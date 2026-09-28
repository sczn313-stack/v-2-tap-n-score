"""Generic session-bound Target Authority execution service."""
from __future__ import annotations

from copy import deepcopy
import secrets
from datetime import datetime
from typing import Any, Dict, Mapping, Optional

from execution_capability_registry import CapabilityRegistryError, execute as execute_capability, resolve_owner
from stage_event_store import StageEventStoreError
from target_execution_contract import (
    TargetExecutionContractError,
    TargetExecutionContractResolver,
    canonical_json,
    digest,
    runtime_resolver,
)


class ExecutionAuthorityError(Exception):
    def __init__(self, reason: str, status: str = "authority_unavailable", http_status: int = 400, **details: Any):
        super().__init__(reason)
        self.http_status = http_status
        self.payload = {"ok": False, "status": status, "reason": reason, **details}


def execute_authoritative_session(
    payload: Any,
    store: Any,
    *,
    resolver: Optional[TargetExecutionContractResolver] = None,
) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise ExecutionAuthorityError("payload_object_required", "invalid_request")
    session_id = str(payload.get("authoritativeSessionId") or payload.get("sessionId") or "").strip()
    if not session_id:
        raise ExecutionAuthorityError("authoritative_session_id_required", "invalid_request")
    session = store.get_authoritative_session(session_id)
    if not isinstance(session, Mapping):
        raise ExecutionAuthorityError("authoritative_session_not_found", "not_found", 404)
    mission = session.get("missionIdentity") if isinstance(session.get("missionIdentity"), Mapping) else {}
    contract_identity = mission.get("executionContract") if isinstance(mission.get("executionContract"), Mapping) else None
    if not contract_identity:
        raise ExecutionAuthorityError("target_execution_contract_required")
    authority = resolver or runtime_resolver()
    try:
        contract = authority.resolve_identity(contract_identity)
    except TargetExecutionContractError as exc:
        raise ExecutionAuthorityError(exc.payload["reason"], exc.payload.get("status", "authority_unavailable"), 409) from exc
    if str(session.get("targetId") or "").lower() != contract["targetProfile"]["id"].lower():
        raise ExecutionAuthorityError("authoritative_session_target_mismatch", "identity_mismatch", 409)
    if mission.get("missionFamily") != contract["missionFamily"] or mission.get("resultPackageType") != contract["resultPackageType"]:
        raise ExecutionAuthorityError("authoritative_session_mission_mismatch", "identity_mismatch", 409)
    try:
        result = execute_capability(contract, payload.get("evidence"))
    except (ValueError, CapabilityRegistryError) as exc:
        raise ExecutionAuthorityError(str(exc), "invalid_evidence") from exc
    result = deepcopy(result)
    result["authoritativeSessionId"] = session_id
    result.setdefault("authorityTrace", {})["sessionAuthority"] = "backend"
    result["resultHash"] = digest(canonical_json({key: value for key, value in result.items() if key not in {"resultHash", "resultIdentity"}}))
    result["resultIdentity"] = f"SCZN3-RESULT-{result['resultHash'][:24].upper()}"
    return result


def execute_authoritative_action(
    payload: Any,
    session_store: Any,
    stage_event_store: Any,
    *,
    resolver: Optional[TargetExecutionContractResolver] = None,
    now: Optional[datetime] = None,
    seed_factory: Any = None,
) -> Dict[str, Any]:
    """Apply one idempotent action through the exact session-selected family owner."""
    if not isinstance(payload, Mapping):
        raise ExecutionAuthorityError("payload_object_required", "invalid_request")
    session_id = str(payload.get("authoritativeSessionId") or payload.get("sessionId") or "").strip()
    action_id = str(payload.get("actionId") or "").strip()
    expected_sequence = payload.get("expectedSequence")
    action = payload.get("action")
    if not session_id or not action_id or not isinstance(expected_sequence, int) or expected_sequence < 0 or not isinstance(action, Mapping):
        raise ExecutionAuthorityError("mission_action_identity_required", "invalid_request")
    session = session_store.get_authoritative_session(session_id)
    if not isinstance(session, Mapping):
        raise ExecutionAuthorityError("authoritative_session_not_found", "not_found", 404)
    mission = session.get("missionIdentity") if isinstance(session.get("missionIdentity"), Mapping) else {}
    contract_identity = mission.get("executionContract") if isinstance(mission.get("executionContract"), Mapping) else None
    if not contract_identity:
        raise ExecutionAuthorityError("target_execution_contract_required")
    authority = resolver or runtime_resolver()
    try:
        contract = authority.resolve_identity(contract_identity)
        owner = resolve_owner(contract)
    except (TargetExecutionContractError, CapabilityRegistryError) as exc:
        reason = getattr(exc, "payload", {}).get("reason") or str(exc)
        raise ExecutionAuthorityError(reason, "authority_unavailable", 409) from exc
    if str(session.get("targetId") or "").lower() != contract["targetProfile"]["id"].lower():
        raise ExecutionAuthorityError("authoritative_session_target_mismatch", "identity_mismatch", 409)
    if mission.get("missionFamily") != contract["missionFamily"] or mission.get("resultPackageType") != contract["resultPackageType"]:
        raise ExecutionAuthorityError("authoritative_session_mission_mismatch", "identity_mismatch", 409)
    if owner.transition is None:
        raise ExecutionAuthorityError("mission_family_action_execution_unavailable", "authority_unavailable", 409)
    governed_action = {**deepcopy(dict(action)), "authoritativeSessionId": session_id}
    if governed_action.get("type") == "start_run":
        governed_action["backendSeed"] = (seed_factory or (lambda: secrets.token_hex(16)))()
    try:
        def governed_transition(state, event):
            outcome = owner.transition(contract, state, event)
            candidate = outcome.get("response", {}).get("result")
            if candidate is not None and not owner.validate_result(contract, candidate):
                raise ValueError("result_package_validation_failed")
            return outcome

        response = stage_event_store.apply(
            session_id=session_id,
            contract_fingerprint=contract["contractFingerprint"],
            mission_family=contract["missionFamily"],
            action_id=action_id,
            expected_sequence=expected_sequence,
            transition=governed_transition,
            action=governed_action,
            now=now,
        )
    except (ValueError, StageEventStoreError) as exc:
        raise ExecutionAuthorityError(str(exc), "invalid_action", 409) from exc
    result = response.get("result")
    if result is not None and not owner.validate_result(contract, result):
        raise ExecutionAuthorityError("result_package_validation_failed", "authority_unavailable", 409)
    return response
