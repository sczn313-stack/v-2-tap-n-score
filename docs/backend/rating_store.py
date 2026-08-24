"""First-party storage for voluntary SCZN3 experience ratings."""
from __future__ import annotations

import hashlib
import json
import os
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Mapping, Optional


SOURCE = "voluntary_rate_us"
RELATIONSHIP_STATUSES = {"new_to_this_browser", "returning_to_this_browser", "unknown"}
COMPLETION_STATUSES = {"incomplete", "complete", "ambiguous"}
SEC_STATES = {"none", "active_result", "preserved", "unknown"}


class RatingError(Exception):
    def __init__(self, status: str, reason: str, http_status: int = 400):
        super().__init__(reason)
        self.http_status = http_status
        self.payload = {"ok": False, "status": status, "reason": reason}


def _canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _fingerprint(value: Any) -> str:
    return hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()


def _text(value: Any, *, maximum: int = 240) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if len(text) > maximum:
        raise RatingError("invalid_request", "context_value_too_long")
    return text


def _object(value: Any) -> Mapping[str, Any]:
    return value if isinstance(value, Mapping) else {}


def _optional_identity(value: Any, allowed_keys: tuple[str, ...]) -> Optional[dict[str, Any]]:
    source = _object(value)
    identity = {key: _text(source.get(key)) for key in allowed_keys}
    identity = {key: entry for key, entry in identity.items() if entry is not None}
    return identity or None


def validate_rating(payload: Any, *, idempotency_key: Optional[str] = None, now: Optional[datetime] = None) -> dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise RatingError("invalid_request", "rating_payload_required")
    rating = payload.get("rating")
    if isinstance(rating, bool) or not isinstance(rating, int) or rating < 1 or rating > 5:
        raise RatingError("invalid_request", "rating_must_be_integer_1_through_5")
    comment = payload.get("comment")
    if comment is not None and not isinstance(comment, str):
        raise RatingError("invalid_request", "comment_must_be_text_or_null")
    if isinstance(comment, str) and len(comment) > 5000:
        raise RatingError("invalid_request", "comment_too_long")
    submission_key = _text(idempotency_key or payload.get("submissionKey"), maximum=160)
    if not submission_key:
        raise RatingError("invalid_request", "submission_key_required")
    if idempotency_key and _text(payload.get("submissionKey"), maximum=160) not in {None, submission_key}:
        raise RatingError("invalid_request", "submission_key_mismatch")
    if payload.get("source") != SOURCE:
        raise RatingError("invalid_request", "voluntary_rate_us_source_required")

    context = _object(payload.get("context"))
    relationship = _object(context.get("shooterRelationship"))
    relationship_status = _text(relationship.get("status")) or "unknown"
    if relationship_status not in RELATIONSHIP_STATUSES:
        raise RatingError("invalid_request", "invalid_shooter_relationship")
    completion_status = _text(context.get("completionStatus")) or "ambiguous"
    if completion_status not in COMPLETION_STATUSES:
        raise RatingError("invalid_request", "invalid_completion_status")
    sec = _object(context.get("sec"))
    sec_state = _text(sec.get("state")) or "unknown"
    if sec_state not in SEC_STATES:
        raise RatingError("invalid_request", "invalid_sec_state")

    normalized_context = {
        "shooterRelationship": {
            "status": relationship_status,
            "scope": _text(relationship.get("scope")) or "this_browser",
            "basis": _text(relationship.get("basis")),
        },
        "origin": _optional_identity(context.get("origin"), ("route", "view")),
        "activity": _text(context.get("activity")),
        "target": _optional_identity(context.get("target"), ("targetProfileId", "targetLabel")),
        "publisher": _optional_identity(context.get("publisher"), ("publisherId", "publisherLabel")),
        "session": _optional_identity(context.get("session"), ("sessionId",)),
        "sec": {"exists": sec.get("exists") is True, "state": sec_state},
        "currentStage": _text(context.get("currentStage")),
        "completionStatus": completion_status,
    }
    submitted_at = (now or datetime.now(timezone.utc)).isoformat()
    record = {
        "submissionKey": submission_key,
        "rating": rating,
        "comment": comment,
        "submittedAt": submitted_at,
        "source": SOURCE,
        "context": normalized_context,
    }
    record["requestFingerprint"] = _fingerprint({key: record[key] for key in ("rating", "comment", "source", "context")})
    return record


def record_rating(
    payload: Any,
    store: Any,
    *,
    idempotency_key: Optional[str] = None,
    now: Optional[datetime] = None,
) -> dict[str, Any]:
    record = validate_rating(payload, idempotency_key=idempotency_key, now=now)
    saved, duplicate = store.save(record)
    if saved["requestFingerprint"] != record["requestFingerprint"]:
        raise RatingError("conflict", "submission_key_reused_with_different_feedback", 409)
    return {
        "ok": True,
        "status": "duplicate" if duplicate else "stored",
        "ratingId": saved["ratingId"],
        "submittedAt": saved["submittedAt"],
        "duplicate": duplicate,
    }


class PostgresRatingStore:
    def __init__(self, database_url: Optional[str] = None, connect_fn: Any = None):
        self.database_url = database_url if database_url is not None else os.environ.get("DATABASE_URL", "")
        self.connect_fn = connect_fn

    def _connect(self):
        if not self.database_url:
            raise RatingError("storage_unavailable", "DATABASE_URL_not_configured", 503)
        if self.connect_fn:
            return self.connect_fn(self.database_url)
        import psycopg
        from psycopg.rows import dict_row
        return psycopg.connect(self.database_url, row_factory=dict_row)

    def save(self, record: Mapping[str, Any]):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    insert into experience_ratings (
                      submission_key, request_fingerprint, rating, comment, submitted_at,
                      source, shooter_relationship, relationship_scope, originating_route,
                      originating_view, activity_context, target_profile_id, target_label,
                      publisher_id, publisher_label, session_id, sec_exists, sec_state,
                      current_stage, completion_status, context
                    ) values (
                      %(submission_key)s, %(request_fingerprint)s, %(rating)s, %(comment)s,
                      %(submitted_at)s::timestamptz, %(source)s, %(shooter_relationship)s,
                      %(relationship_scope)s, %(originating_route)s, %(originating_view)s,
                      %(activity_context)s, %(target_profile_id)s, %(target_label)s,
                      %(publisher_id)s, %(publisher_label)s, %(session_id)s, %(sec_exists)s,
                      %(sec_state)s, %(current_stage)s, %(completion_status)s, %(context)s::jsonb
                    ) on conflict (submission_key) do nothing
                    """,
                    self._params(record),
                )
                inserted = getattr(cursor, "rowcount", 1) != 0
                cursor.execute(
                    """
                    select id, submission_key, request_fingerprint, rating, comment, submitted_at,
                           source, context
                      from experience_ratings where submission_key = %s
                    """,
                    (record["submissionKey"],),
                )
                row = cursor.fetchone()
        return self._row(row), not inserted

    @staticmethod
    def _params(record: Mapping[str, Any]) -> dict[str, Any]:
        context = record["context"]
        origin = context.get("origin") or {}
        target = context.get("target") or {}
        publisher = context.get("publisher") or {}
        session = context.get("session") or {}
        relationship = context["shooterRelationship"]
        sec = context["sec"]
        return {
            "submission_key": record["submissionKey"],
            "request_fingerprint": record["requestFingerprint"],
            "rating": record["rating"],
            "comment": record["comment"],
            "submitted_at": record["submittedAt"],
            "source": record["source"],
            "shooter_relationship": relationship["status"],
            "relationship_scope": relationship["scope"],
            "originating_route": origin.get("route"),
            "originating_view": origin.get("view"),
            "activity_context": context.get("activity"),
            "target_profile_id": target.get("targetProfileId"),
            "target_label": target.get("targetLabel"),
            "publisher_id": publisher.get("publisherId"),
            "publisher_label": publisher.get("publisherLabel"),
            "session_id": session.get("sessionId"),
            "sec_exists": sec["exists"],
            "sec_state": sec["state"],
            "current_stage": context.get("currentStage"),
            "completion_status": context["completionStatus"],
            "context": _canonical(context),
        }

    @staticmethod
    def _row(row: Mapping[str, Any]) -> dict[str, Any]:
        submitted_at = row["submitted_at"]
        return {
            "ratingId": str(row["id"]),
            "submissionKey": row["submission_key"],
            "requestFingerprint": row["request_fingerprint"],
            "rating": row["rating"],
            "comment": row["comment"],
            "submittedAt": submitted_at.isoformat() if hasattr(submitted_at, "isoformat") else str(submitted_at),
            "source": row["source"],
            "context": deepcopy(row["context"]),
        }


def runtime_store() -> PostgresRatingStore:
    return PostgresRatingStore()
