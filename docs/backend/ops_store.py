"""Postgres-backed OPS authority storage.

This module intentionally does not use local files, SQLite, JSONL, or the Render
ephemeral filesystem for authoritative OPS totals.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from product_catalog import resolve_product_route

ALLOWED_EVENT_TYPES = {
    "arrival",
    "pageView",
    "sessionStart",
    "showResults",
    "sessionSaved",
}

SUMMARY_KEYS = {
    "arrival": "arrivals",
    "pageView": "pageViews",
    "sessionStart": "sessionStarts",
    "showResults": "showResults",
    "sessionSaved": "sessionsSaved",
}


def database_url(explicit_url=None):
    return explicit_url if explicit_url is not None else os.environ.get("DATABASE_URL", "")


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean_text(value, default="Unknown"):
    if value is None:
        return default
    text = str(value).strip()
    return text or default


def clean_optional_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def validate_event(payload):
    if not isinstance(payload, dict):
        return None, "payload must be an object"

    event_type = payload.get("eventType") or payload.get("event_type")
    if event_type not in ALLOWED_EVENT_TYPES:
        return None, f"invalid eventType: {event_type!r}"

    metadata = payload.get("metadata") or {}
    if not isinstance(metadata, dict):
        return None, "metadata must be an object"

    publisher_route_id = clean_optional_text(payload.get("publisherRouteId") or payload.get("publisher_route_id"))
    product_route_id = clean_optional_text(payload.get("productRouteId") or payload.get("product_route_id"))
    catalog_entry_id = clean_optional_text(payload.get("catalogEntryId") or payload.get("catalog_entry_id"))
    provided_identity = [publisher_route_id, product_route_id, catalog_entry_id]
    if any(provided_identity) and not all(provided_identity):
        return None, "governed product identity must be complete"
    target_source = "Unattributed"
    if all(provided_identity):
        resolution = resolve_product_route(publisher_route_id, product_route_id)
        resolved_entry = resolution.get("catalogEntry") if resolution.get("ok") is True else None
        if not resolved_entry or resolved_entry.get("catalogEntryId") != catalog_entry_id:
            return None, "governed product identity is unavailable or mismatched"
        target_source = catalog_entry_id
        metadata = {
            **metadata,
            "governedProduct": {
                "publisherRouteId": publisher_route_id,
                "productRouteId": product_route_id,
                "catalogEntryId": catalog_entry_id,
            },
        }

    return {
        "event_type": event_type,
        "arrival_id": clean_optional_text(payload.get("arrivalId") or payload.get("arrival_id")),
        "session_id": clean_optional_text(payload.get("sessionId") or payload.get("session_id")),
        "referral_source": "Deferred",
        "target_source": target_source,
        "region": "Deferred",
        "path": clean_optional_text(payload.get("path")),
        "occurred_at": clean_optional_text(payload.get("timestamp") or payload.get("occurredAt") or payload.get("occurred_at")) or utc_now_iso(),
        "user_agent_hash": clean_optional_text(payload.get("userAgentHash") or payload.get("user_agent_hash")),
        "metadata": json.dumps(metadata, sort_keys=True),
    }, None


def connect_postgres(url):
    import psycopg

    return psycopg.connect(url)


def record_event(payload, *, database_url_override=None, connect_fn=None):
    event, error = validate_event(payload)
    if error:
        return {"ok": False, "status": "invalid", "error": error}

    url = database_url(database_url_override)
    if not url:
        return {"ok": False, "status": "unavailable", "reason": "DATABASE_URL not configured"}

    connector = connect_fn or connect_postgres
    try:
        with connector(url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    insert into ops_events (
                      event_type,
                      arrival_id,
                      session_id,
                      referral_source,
                      target_source,
                      region,
                      path,
                      occurred_at,
                      user_agent_hash,
                      metadata
                    )
                    values (
                      %(event_type)s,
                      %(arrival_id)s,
                      %(session_id)s,
                      %(referral_source)s,
                      %(target_source)s,
                      %(region)s,
                      %(path)s,
                      %(occurred_at)s,
                      %(user_agent_hash)s,
                      %(metadata)s::jsonb
                    )
                    on conflict (arrival_id)
                      where event_type = 'arrival' and arrival_id is not null
                    do nothing
                    """,
                    event,
                )
                stored = getattr(cursor, "rowcount", 1) != 0
        return {
            "ok": True,
            "status": "stored" if stored else "duplicate",
            "eventType": event["event_type"],
            "stored": stored,
        }
    except Exception as exc:  # pragma: no cover - defensive backend boundary
        return {"ok": False, "status": "storage_error", "error": str(exc)}


def empty_summary(status="ok"):
    return {
        "ok": status == "ok",
        "status": status,
        "totals": {
            "arrivals": 0,
            "pageViews": 0,
            "sessionStarts": 0,
            "showResults": 0,
            "sessionsSaved": 0,
            "returnShooters": 0,
        },
        "sources": {
            "referrals": {},
            "targets": {},
            "regions": {},
        },
    }


def rows_to_bucket(rows):
    return {str(label or "Unknown"): int(count or 0) for label, count in rows}


def summarize_events(*, database_url_override=None, connect_fn=None):
    url = database_url(database_url_override)
    if not url:
        summary = empty_summary("unavailable")
        summary["reason"] = "DATABASE_URL not configured"
        return summary

    connector = connect_fn or connect_postgres
    try:
        summary = empty_summary()
        with connector(url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("select event_type, count(*) from ops_events group by event_type")
                for event_type, count in cursor.fetchall():
                    key = SUMMARY_KEYS.get(event_type)
                    if key:
                        summary["totals"][key] = int(count or 0)

                cursor.execute(
                    "select referral_source, count(*) from ops_events where event_type = 'arrival' group by referral_source"
                )
                summary["sources"]["referrals"] = rows_to_bucket(cursor.fetchall())

                cursor.execute(
                    "select target_source, count(*) from ops_events where event_type = 'arrival' group by target_source"
                )
                summary["sources"]["targets"] = rows_to_bucket(cursor.fetchall())

                cursor.execute(
                    "select region, count(*) from ops_events where event_type = 'arrival' group by region"
                )
                summary["sources"]["regions"] = rows_to_bucket(cursor.fetchall())

        return summary
    except Exception as exc:  # pragma: no cover - defensive backend boundary
        return {"ok": False, "status": "storage_error", "error": str(exc)}
