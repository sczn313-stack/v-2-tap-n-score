"""Durable preservation for immutable Shooter Experience Card artifacts."""
from __future__ import annotations

import hashlib
import json
import os
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, Mapping, Optional


class PreservedSECError(Exception):
    def __init__(self, status: str, reason: str, http_status: int = 400, **details: Any):
        super().__init__(reason)
        self.http_status = http_status
        self.payload = {"ok": False, "status": status, "reason": reason, **details}


def _canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _digest(value: Any) -> str:
    return hashlib.sha256(_canonical_json(value).encode("utf-8")).hexdigest()


def _text(value: Any) -> str:
    return str(value or "").strip()


def _target_id(session: Mapping[str, Any]) -> str:
    snapshot = session.get("matrixSnapshot") if isinstance(session.get("matrixSnapshot"), Mapping) else {}
    return _text(
        snapshot.get("targetProfileId")
        or snapshot.get("target_profile_id")
        or snapshot.get("targetId")
        or session.get("targetProfileId")
        or session.get("target_profile_id")
        or session.get("targetId")
    )


def preserve_sec(payload: Any, store: Any, *, now: Optional[datetime] = None) -> Dict[str, Any]:
    if not isinstance(payload, Mapping) or not isinstance(payload.get("session"), Mapping):
        raise PreservedSECError("invalid_request", "session_required")
    session = deepcopy(dict(payload["session"]))
    session_id = _text(session.get("sessionId") or session.get("authoritativeSessionId"))
    if not session_id or session.get("sessionIdAuthority") != "backend":
        raise PreservedSECError("invalid_request", "backend_session_identity_required")
    governed_target_id = store.authoritative_target_id(session_id)
    if not governed_target_id:
        raise PreservedSECError("not_found", "authoritative_session_not_found", 404)
    submitted_target_id = _target_id(session)
    if submitted_target_id.lower() != _text(governed_target_id).lower():
        raise PreservedSECError(
            "identity_mismatch", "target_identity_mismatch", 409,
            expectedTargetId=governed_target_id, receivedTargetId=submitted_target_id,
        )
    preserved_at = (now or datetime.now(timezone.utc)).isoformat()
    session["sessionId"] = session_id
    session["authoritativeSessionId"] = session_id
    session["savedToSEC"] = True
    session.setdefault("savedAt", preserved_at)
    record = {
        "sessionId": session_id,
        "targetId": governed_target_id,
        "artifact": session,
        "artifactSha256": _digest(session),
        "preservedAt": session["savedAt"],
    }
    saved = store.save(record)
    return {
        "ok": True,
        "status": "preserved",
        "session": deepcopy(saved["artifact"]),
        "artifactSha256": saved["artifactSha256"],
        "preservedAt": saved["preservedAt"],
    }


def read_preserved_sec(session_id: Any, store: Any) -> Dict[str, Any]:
    clean_session_id = _text(session_id)
    if not clean_session_id:
        raise PreservedSECError("invalid_request", "session_id_required")
    record = store.get(clean_session_id)
    if not record:
        raise PreservedSECError("not_found", "preserved_sec_not_found", 404)
    return {
        "ok": True,
        "status": "preserved",
        "session": deepcopy(record["artifact"]),
        "artifactSha256": record["artifactSha256"],
        "preservedAt": record["preservedAt"],
    }


def list_preserved_secs(store: Any) -> Dict[str, Any]:
    records = store.list()
    return {
        "ok": True,
        "status": "preserved",
        "sessions": [deepcopy(record["artifact"]) for record in records],
        "artifacts": [
            {
                "sessionId": record["sessionId"],
                "artifactSha256": record["artifactSha256"],
                "preservedAt": record["preservedAt"],
            }
            for record in records
        ],
    }


class PostgresPreservedSECStore:
    def __init__(self, database_url: Optional[str] = None, connect_fn: Any = None):
        self.database_url = database_url if database_url is not None else os.environ.get("SCZN3_SESSION_SEC_DATABASE_URL", "")
        self.connect_fn = connect_fn

    def _connect(self):
        if not self.database_url:
            raise PreservedSECError("storage_unavailable", "DATABASE_URL_not_configured", 503)
        if self.connect_fn:
            return self.connect_fn(self.database_url)
        import psycopg
        from psycopg.rows import dict_row
        return psycopg.connect(self.database_url, row_factory=dict_row)

    def authoritative_target_id(self, session_id: str) -> Optional[str]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "select target_id from authoritative_sessions where authoritative_session_id = %s",
                    (session_id,),
                )
                row = cursor.fetchone()
        return row["target_id"] if row else None

    def save(self, record: Mapping[str, Any]) -> Dict[str, Any]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    insert into preserved_secs (
                      session_id, target_id, artifact, artifact_sha256, preserved_at
                    ) values (%s, %s, %s::jsonb, %s, %s::timestamptz)
                    on conflict (session_id) do nothing
                    """,
                    (
                        record["sessionId"], record["targetId"],
                        _canonical_json(record["artifact"]), record["artifactSha256"],
                        record["preservedAt"],
                    ),
                )
                cursor.execute(
                    """
                    select session_id, target_id, artifact, artifact_sha256, preserved_at
                      from preserved_secs where session_id = %s
                    """,
                    (record["sessionId"],),
                )
                row = cursor.fetchone()
        saved = self._row(row)
        if saved["artifactSha256"] != record["artifactSha256"]:
            raise PreservedSECError("preservation_conflict", "preserved_sec_is_immutable", 409)
        return saved

    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    select session_id, target_id, artifact, artifact_sha256, preserved_at
                      from preserved_secs where session_id = %s
                    """,
                    (session_id,),
                )
                row = cursor.fetchone()
        return self._row(row) if row else None

    def list(self):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    select session_id, target_id, artifact, artifact_sha256, preserved_at
                      from preserved_secs order by preserved_at desc
                    """
                )
                rows = cursor.fetchall()
        return [self._row(row) for row in rows]

    @staticmethod
    def _row(row: Mapping[str, Any]) -> Dict[str, Any]:
        preserved_at = row["preserved_at"]
        return {
            "sessionId": row["session_id"],
            "targetId": row["target_id"],
            "artifact": row["artifact"],
            "artifactSha256": row["artifact_sha256"],
            "preservedAt": preserved_at.isoformat() if hasattr(preserved_at, "isoformat") else str(preserved_at),
        }


def runtime_store() -> PostgresPreservedSECStore:
    return PostgresPreservedSECStore()
