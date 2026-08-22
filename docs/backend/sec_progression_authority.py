"""Backend authority for cross-session SEC progression evaluation."""
from __future__ import annotations

import secrets
from datetime import datetime, timezone
from typing import Any, Dict, Mapping, Optional

from executors import sec_progression_evaluator
from progression_input_facts import ProgressionFactError, extract_preserved_fact
from progression_record_store import ProgressionRecordStoreError
from target_execution_contract import TargetExecutionContractError, TargetExecutionContractResolver, runtime_resolver


class SECProgressionAuthorityError(Exception):
    def __init__(self, reason: str, status: str = "authority_unavailable", http_status: int = 409):
        super().__init__(reason); self.http_status = http_status; self.payload = {"ok": False, "status": status, "reason": reason}


class UnavailableProgressionSubjectAuthority:
    def resolve(self, token: Any) -> str:
        raise SECProgressionAuthorityError("production_progression_subject_authority_unavailable")


class SyntheticProgressionSubjectAuthority:
    def __init__(self, tokens: Mapping[str, str]): self.tokens = dict(tokens)
    def resolve(self, token: Any) -> str:
        subject_id = self.tokens.get(str(token or ""))
        if not subject_id: raise SECProgressionAuthorityError("progression_subject_authority_unavailable")
        return subject_id


def runtime_progression_subject_authority() -> UnavailableProgressionSubjectAuthority:
    return UnavailableProgressionSubjectAuthority()


def _text(value: Any) -> str: return str(value or "").strip()


def evaluate_progression(payload: Any, sec_store: Any, record_store: Any, subject_authority: Any, *, resolver: Optional[TargetExecutionContractResolver] = None, now: Optional[datetime] = None, id_factory: Any = None) -> Dict[str, Any]:
    if not isinstance(payload, Mapping): raise SECProgressionAuthorityError("payload_object_required", "invalid_request", 400)
    target_id, mission = _text(payload.get("targetProfileId")), _text(payload.get("missionFamily"))
    source_ids, idempotency_key = payload.get("sourceSessionIds"), _text(payload.get("idempotencyKey"))
    if not target_id or mission != "secProgressionEvaluation" or not isinstance(source_ids, list) or not source_ids or not idempotency_key or len(source_ids) != len(set(source_ids)):
        raise SECProgressionAuthorityError("progression_request_identity_invalid", "invalid_request", 400)
    subject_id = subject_authority.resolve(payload.get("subjectAuthorityToken"))
    authority = resolver or runtime_resolver()
    try:
        contract = authority.resolve(target_id, mission); profile = sec_progression_evaluator.profile(contract)
    except (TargetExecutionContractError, ValueError) as exc:
        reason = getattr(exc, "payload", {}).get("reason") or str(exc); raise SECProgressionAuthorityError(reason) from exc
    fact_id, facts = profile["inputEligibility"]["factAdapterId"], []
    for session_id in source_ids:
        record = sec_store.get(_text(session_id))
        if not record:
            facts.append({"status": "ineligible", "sessionId": _text(session_id), "reason": "source_sec_not_found"}); continue
        try: facts.append(extract_preserved_fact(record, subject_id, fact_id))
        except ProgressionFactError as exc: facts.append({"status": "ineligible", "sessionId": _text(session_id), "reason": str(exc)})
    lineage_key = f"{subject_id}|{target_id.lower()}|{profile['profileId']}|{profile['profileVersion']}"
    instant = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()
    evaluation_id = (id_factory or (lambda: f"SCZN3-PROGRESSION-{secrets.token_hex(12).upper()}"))()
    try:
        record = record_store.apply(lineage_key, idempotency_key, payload.get("expectedPriorProgressionEvaluationId"), lambda prior, consumed: sec_progression_evaluator.evaluate(contract, subject_id, facts, prior, consumed, evaluation_id, instant))
    except ProgressionRecordStoreError as exc: raise SECProgressionAuthorityError(str(exc), "conflict", 409) from exc
    if not sec_progression_evaluator.validate_result(contract, record["result"]): raise SECProgressionAuthorityError("progression_result_validation_failed")
    return {"ok": True, "status": "preserved", **record}


def reopen_progression(evaluation_id: Any, record_store: Any) -> Dict[str, Any]:
    identity = _text(evaluation_id)
    if not identity: raise SECProgressionAuthorityError("progression_evaluation_id_required", "invalid_request", 400)
    record = record_store.get(identity)
    if not record: raise SECProgressionAuthorityError("progression_record_not_found", "not_found", 404)
    return {"ok": True, "status": "preserved", **record}
