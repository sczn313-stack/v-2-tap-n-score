"""Durable preservation for immutable Shooter Experience Card artifacts."""
from __future__ import annotations

import hashlib
import json
import os
import math
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, Mapping, Optional

from execution_capability_registry import CapabilityRegistryError, validate_result
from target_execution_contract import TargetExecutionContractError, TargetExecutionContractResolver, runtime_resolver


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


def _validate_contract_backed_artifact(
    session: Mapping[str, Any],
    governed_target_id: str,
    resolver: TargetExecutionContractResolver,
) -> None:
    result = session.get("authorityPackage") or session.get("backendAuthorityPackage")
    if not isinstance(result, Mapping) or not isinstance(result.get("executionContract"), Mapping):
        return
    if result.get("authoritySource") != "backend-authoritative":
        raise PreservedSECError("authority_unavailable", "backend_result_authority_required", 409)
    try:
        contract = resolver.resolve_identity(result["executionContract"])
        valid = validate_result(contract, result)
    except (TargetExecutionContractError, CapabilityRegistryError) as exc:
        reason = getattr(exc, "payload", {}).get("reason") or str(exc)
        raise PreservedSECError("authority_unavailable", reason, 409) from exc
    if contract["targetProfile"]["id"].lower() != _text(governed_target_id).lower():
        raise PreservedSECError("identity_mismatch", "execution_contract_target_mismatch", 409)
    if _text(result.get("authoritativeSessionId")) != _text(session.get("sessionId") or session.get("authoritativeSessionId")):
        raise PreservedSECError("identity_mismatch", "result_session_identity_mismatch", 409)
    evidence = session.get("targetEvidenceImage")
    if not isinstance(evidence, Mapping) or not (_text(evidence.get("dataUrl")) or _text(evidence.get("mediaId"))):
        raise PreservedSECError("invalid_request", "admitted_evidence_image_required")
    if not valid:
        raise PreservedSECError("authority_unavailable", "result_package_validation_failed", 409)


def _hit_rate(session: Mapping[str, Any]) -> Optional[Dict[str, Any]]:
    result = session.get("authorityPackage") or session.get("backendAuthorityPackage")
    metric = result.get("sczn3Metrics", {}).get("hitRate") if isinstance(result, Mapping) else None
    if not isinstance(metric, Mapping):
        return None
    valid, total, percentage = metric.get("validHitCount"), metric.get("governedShotCount"), metric.get("percentage")
    if not isinstance(valid, int) or not isinstance(total, int) or total < 1 or not isinstance(percentage, (int, float)):
        return None
    return {"validHitCount": valid, "governedShotCount": total, "percentage": float(percentage)}


def _numeric_score(session: Mapping[str, Any]) -> Optional[Dict[str, Any]]:
    result = session.get("authorityPackage") or session.get("backendAuthorityPackage")
    scoring = result.get("scoring") if isinstance(result, Mapping) else None
    if (
        not isinstance(scoring, Mapping)
        or scoring.get("model") not in {"numeric_regions", "penalty_regions", "mixed_regions"}
        or isinstance(scoring.get("participantResults"), list)
    ):
        return None
    total = scoring.get("total")
    regions = scoring.get("regionResults")
    if not isinstance(total, (int, float)) or isinstance(total, bool) or not isinstance(regions, list):
        return None
    return {"targetScore": total, "regionResults": deepcopy(regions)}


def _shot_pattern(session: Mapping[str, Any]) -> Optional[Dict[str, Any]]:
    result = session.get("authorityPackage") or session.get("backendAuthorityPackage")
    pattern = result.get("sczn3Metrics", {}).get("shotPattern") if isinstance(result, Mapping) else None
    center = pattern.get("center") if isinstance(pattern, Mapping) else None
    dispersion = pattern.get("dispersion") if isinstance(pattern, Mapping) else None
    if (
        not isinstance(center, Mapping)
        or not isinstance(dispersion, Mapping)
        or not isinstance(center.get("xNorm"), (int, float))
        or not isinstance(center.get("yNorm"), (int, float))
        or not isinstance(pattern.get("tapCount"), int)
    ):
        return None
    return {
        "tapCount": pattern["tapCount"],
        "center": deepcopy(center),
        "dispersion": deepcopy(dispersion),
    }


def _same_target_progress(session: Mapping[str, Any], target_id: str, store: Any) -> Dict[str, Any]:
    current = _hit_rate(session)
    current_score = _numeric_score(session)
    current_pattern = _shot_pattern(session)
    continuity_id = _text(session.get("shooterContinuityId"))
    progress = {
        "status": "current_only" if current or current_pattern else "not_applicable",
        "scope": "same_shooter_same_permanent_target",
        "current": deepcopy(current) if current else {},
        "previous": None,
    }
    if current_pattern:
        progress["current"]["shotPattern"] = current_pattern
    if current and current_score:
        progress["current"].update(current_score)
    if not current and not current_pattern:
        return progress
    if not continuity_id:
        progress["comparisonUnavailableReason"] = "shooter_continuity_not_present"
        return progress
    records = list(store.prior_applicable(target_id, continuity_id)) if hasattr(store, "prior_applicable") else list(reversed(store.list()))
    applicable = []
    for record in records:
        prior = record.get("artifact") if isinstance(record, Mapping) else None
        if not isinstance(prior, Mapping) or _text(record.get("targetId")).lower() != target_id.lower():
            continue
        if _text(prior.get("shooterContinuityId")) != continuity_id:
            continue
        prior_rate = _hit_rate(prior)
        prior_pattern = _shot_pattern(prior)
        if not prior_rate and not prior_pattern:
            continue
        prior_score = _numeric_score(prior)
        applicable.append((prior, prior_rate, prior_score, prior_pattern))
    if applicable:
        prior, prior_rate, prior_score, prior_pattern = applicable[0]
        previous = {**(prior_rate or {}), "sessionId": _text(prior.get("sessionId")), "savedAt": _text(prior.get("savedAt"))}
        if prior_pattern:
            previous["shotPattern"] = prior_pattern
        if prior_score:
            previous.update(prior_score)
        progress.update({"status": "comparison_available", "previous": previous})
        if current and prior_rate:
            progress["percentagePointChange"] = round(current["percentage"] - prior_rate["percentage"], 1)
        if current_pattern and prior_pattern:
            current_center, prior_center = current_pattern["center"], prior_pattern["center"]
            current_radius = current_pattern["dispersion"].get("rmsRadiusNorm")
            prior_radius = prior_pattern["dispersion"].get("rmsRadiusNorm")
            progress["shotPatternComparison"] = {
                "status": "comparable",
                "centerMovementNorm": round(math.hypot(current_center["xNorm"] - prior_center["xNorm"], current_center["yNorm"] - prior_center["yNorm"]), 4),
                "xMovementNorm": round(current_center["xNorm"] - prior_center["xNorm"], 4),
                "yMovementNorm": round(current_center["yNorm"] - prior_center["yNorm"], 4),
                "rmsRadiusChangeNorm": round(current_radius - prior_radius, 4) if isinstance(current_radius, (int, float)) and isinstance(prior_radius, (int, float)) else None,
                "tapCountChange": current_pattern["tapCount"] - prior_pattern["tapCount"],
            }
        if current_score and prior_score:
            progress["scoreChange"] = round(current_score["targetScore"] - prior_score["targetScore"], 1)
            progress["regionDistributionComparison"] = {
                "status": "comparable",
                "current": deepcopy(current_score["regionResults"]),
                "previous": deepcopy(prior_score["regionResults"]),
            }
        score_candidates = [
            (current_score, _text(session.get("sessionId"))),
            *((score, _text(prior.get("sessionId"))) for prior, _, score, _ in applicable),
        ]
        scores = [(score["targetScore"], session_id) for score, session_id in score_candidates if score]
        rates = ([(current["percentage"], _text(session.get("sessionId")))] if current else []) + [(rate["percentage"], _text(prior.get("sessionId"))) for prior, rate, _, _ in applicable if rate]
        patterns = [(current_pattern, _text(session.get("sessionId")))] + [(pattern, _text(prior.get("sessionId"))) for prior, _, _, pattern in applicable] if current_pattern else [(pattern, _text(prior.get("sessionId"))) for prior, _, _, pattern in applicable if pattern]
        dispersion_candidates = [(pattern["dispersion"].get("rmsRadiusNorm"), session_id) for pattern, session_id in patterns if pattern and pattern["dispersion"].get("status") == "complete"]
        progress["best"] = {
            "targetScore": {"value": max(scores, key=lambda item: item[0])[0], "sessionId": max(scores, key=lambda item: item[0])[1]} if scores else None,
            "hitRate": {"percentage": max(rates, key=lambda item: item[0])[0], "sessionId": max(rates, key=lambda item: item[0])[1]} if rates else None,
            "tightestPattern": {"rmsRadiusNorm": min(dispersion_candidates, key=lambda item: item[0])[0], "sessionId": min(dispersion_candidates, key=lambda item: item[0])[1]} if dispersion_candidates else None,
        }
    else:
        progress["comparisonUnavailableReason"] = "no_previous_applicable_session"
    return progress


def preserve_sec(
    payload: Any,
    store: Any,
    *,
    now: Optional[datetime] = None,
    execution_contract_resolver: Optional[TargetExecutionContractResolver] = None,
) -> Dict[str, Any]:
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
    _validate_contract_backed_artifact(session, governed_target_id, execution_contract_resolver or runtime_resolver())
    preserved_at = (now or datetime.now(timezone.utc)).isoformat()
    session["sessionId"] = session_id
    session["authoritativeSessionId"] = session_id
    session["savedToSEC"] = True
    session.setdefault("savedAt", preserved_at)
    session["sczn3Progress"] = _same_target_progress(session, governed_target_id, store)
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

    def prior_applicable(self, target_id: str, continuity_id: str):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    select session_id, target_id, artifact, artifact_sha256, preserved_at
                      from preserved_secs
                     where lower(target_id) = lower(%s)
                       and artifact ->> 'shooterContinuityId' = %s
                       and artifact #> '{authorityPackage,sczn3Metrics,hitRate}' is not null
                     order by preserved_at desc
                    """,
                    (target_id, continuity_id),
                )
                row = cursor.fetchone()
        return [self._row(row)] if row else []

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
