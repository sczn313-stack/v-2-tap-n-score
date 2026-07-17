"""Postgres-backed OPS authority storage.

This module intentionally does not use local files, SQLite, JSONL, or the Render
ephemeral filesystem for authoritative OPS totals.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from product_catalog import PUBLISHER_RECORDS, PRODUCT_RECORDS, TARGET_CATALOG_ENTRIES, resolve_product_route

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

TIME_WINDOWS = {"today", "week", "month", "year", "all"}


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


def governed_product_options():
    options = [{"id": "all", "label": "All Products"}]
    for (publisher_id, product_id), entry in TARGET_CATALOG_ENTRIES.items():
        if entry.get("lifecycleStatus") != "active" or entry.get("availabilityStatus") != "available":
            continue
        publisher = PUBLISHER_RECORDS.get(publisher_id, {})
        product = PRODUCT_RECORDS.get((publisher_id, product_id), {})
        options.append({
            "id": entry["catalogEntryId"],
            "label": f"{publisher.get('displayName', publisher_id)} / {product.get('displayName', product_id)}",
        })
    return options


def resolve_summary_filters(time_window="all", product_filter="all", timezone_name="UTC", now=None):
    window = clean_text(time_window, "all").lower()
    if window not in TIME_WINDOWS:
        return None, "invalid time window"
    product = clean_text(product_filter, "all")
    allowed_products = {option["id"] for option in governed_product_options()}
    if product not in allowed_products:
        return None, "unknown or unavailable product filter"
    try:
        zone = ZoneInfo(clean_text(timezone_name, "UTC"))
    except ZoneInfoNotFoundError:
        return None, "invalid time zone"

    current_utc = now.astimezone(timezone.utc) if now else datetime.now(timezone.utc)
    local_now = current_utc.astimezone(zone)
    start_local = None
    if window == "today":
        start_local = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif window == "week":
        start_local = (local_now - timedelta(days=local_now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    elif window == "month":
        start_local = local_now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif window == "year":
        start_local = local_now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    return {
        "timeWindow": window,
        "product": product,
        "timeZone": zone.key,
        "startAt": start_local.astimezone(timezone.utc) if start_local else None,
        "endAt": current_utc,
    }, None


def conversion_percent(numerator, denominator):
    if (
        not isinstance(numerator, int)
        or not isinstance(denominator, int)
        or denominator <= 0
        or numerator > denominator
    ):
        return None
    return round((numerator / denominator) * 100, 1)


def public_filter_context(filters):
    return {
        **filters,
        "startAt": filters["startAt"].isoformat() if filters["startAt"] else None,
        "endAt": filters["endAt"].isoformat(),
        "productOptions": governed_product_options(),
    }


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
            "returnShooters": None,
        },
        "conversionPercentages": {
            "arrivalToSessionStart": None,
            "sessionStartToResult": None,
            "resultToSave": None,
        },
        "operationalFailures": [],
        "productActivity": {},
        "unavailableTelemetry": {
            "returningVisitors": True,
            "unattributedArrivals": None,
        },
        "sources": {
            "referrals": {},
            "targets": {},
            "regions": {},
        },
    }


def rows_to_bucket(rows):
    return {str(label or "Unknown"): int(count or 0) for label, count in rows}


def summarize_events(
    *,
    time_window="all",
    product_filter="all",
    timezone_name="UTC",
    now=None,
    database_url_override=None,
    connect_fn=None,
):
    filters, filter_error = resolve_summary_filters(time_window, product_filter, timezone_name, now)
    if filter_error:
        summary = empty_summary("invalid_filter")
        summary["reason"] = filter_error
        return summary
    url = database_url(database_url_override)
    if not url:
        summary = empty_summary("unavailable")
        summary["reason"] = "DATABASE_URL not configured"
        summary["filters"] = public_filter_context(filters)
        return summary

    connector = connect_fn or connect_postgres
    try:
        summary = empty_summary()
        summary["filters"] = public_filter_context(filters)
        clauses = ["occurred_at < %(end_at)s"]
        params = {"end_at": filters["endAt"]}
        if filters["startAt"]:
            clauses.append("occurred_at >= %(start_at)s")
            params["start_at"] = filters["startAt"]
        if filters["product"] != "all":
            clauses.append("target_source = %(product)s")
            params["product"] = filters["product"]
        where_sql = " where " + " and ".join(clauses)
        arrival_where_sql = " where event_type = 'arrival' and " + " and ".join(clauses)
        with connector(url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(f"select event_type, count(*) from ops_events{where_sql} group by event_type", params)
                for event_type, count in cursor.fetchall():
                    key = SUMMARY_KEYS.get(event_type)
                    if key:
                        summary["totals"][key] = int(count or 0)

                cursor.execute(
                    f"select referral_source, count(*) from ops_events{arrival_where_sql} group by referral_source",
                    params,
                )
                summary["sources"]["referrals"] = rows_to_bucket(cursor.fetchall())

                cursor.execute(
                    f"select target_source, count(*) from ops_events{arrival_where_sql} group by target_source",
                    params,
                )
                summary["sources"]["targets"] = rows_to_bucket(cursor.fetchall())

                cursor.execute(
                    f"select region, count(*) from ops_events{arrival_where_sql} group by region",
                    params,
                )
                summary["sources"]["regions"] = rows_to_bucket(cursor.fetchall())

        totals = summary["totals"]
        governed_product_ids = {option["id"] for option in governed_product_options() if option["id"] != "all"}
        summary["productActivity"] = {
            product_id: count
            for product_id, count in summary["sources"]["targets"].items()
            if product_id in governed_product_ids
        }
        summary["unavailableTelemetry"] = {
            "returningVisitors": True,
            "unattributedArrivals": sum(
                count
                for product_id, count in summary["sources"]["targets"].items()
                if product_id not in governed_product_ids
            ),
        }
        failures = []
        if totals["sessionStarts"] > totals["arrivals"]:
            failures.append("session_starts_exceed_arrivals")
        if totals["showResults"] > totals["sessionStarts"]:
            failures.append("results_exceed_session_starts")
        if totals["sessionsSaved"] > totals["showResults"]:
            failures.append("saves_exceed_results")
        summary["operationalFailures"] = failures
        summary["conversionPercentages"] = {
            "arrivalToSessionStart": conversion_percent(totals["sessionStarts"], totals["arrivals"]),
            "sessionStartToResult": conversion_percent(totals["showResults"], totals["sessionStarts"]),
            "resultToSave": conversion_percent(totals["sessionsSaved"], totals["showResults"]),
        }

        return summary
    except Exception as exc:  # pragma: no cover - defensive backend boundary
        return {"ok": False, "status": "storage_error", "error": str(exc)}
