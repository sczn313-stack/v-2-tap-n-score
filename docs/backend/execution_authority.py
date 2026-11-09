"""Generic session-bound Target Authority execution service."""
from __future__ import annotations

from copy import deepcopy
import math
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


def _validate_station_sequence_policy(contract: Mapping[str, Any], evidence: Any) -> None:
    """Fail closed for governed sequential or shooter-selected station assignment."""
    if not isinstance(evidence, Mapping):
        return
    policy = (contract.get("components", {}).get("mission", {}).get("definition", {}).get("interaction", {}) or {}).get("stationSequencePolicy")
    if not isinstance(policy, Mapping):
        return
    region_ids = [str(region_id) for region_id in policy.get("stationRegionIds", [])]
    observations = evidence.get("observations")
    if not region_ids or not isinstance(observations, list):
        return
    assignment_authority = str(policy.get("assignmentAuthority") or "accepted_observation_sequence")
    station_counts = {region_id: 0 for region_id in region_ids}
    for index, observation in enumerate(observations, start=1):
        if not isinstance(observation, Mapping):
            return
        declared_region_id = str(observation.get("assignedStationRegionId") or "")
        if assignment_authority == "shooter_selected_station":
            if declared_region_id not in station_counts:
                raise ExecutionAuthorityError("station_selection_invalid", "invalid_evidence", 409, observationIndex=index, receivedStationRegionId=declared_region_id, allowedStationRegionIds=region_ids)
            station_counts[declared_region_id] += 1
            continue
        per_station_limit = policy.get("observationsPerStation")
        if not isinstance(per_station_limit, int) or per_station_limit < 1:
            return
        expected_region_id = region_ids[(index - 1) // per_station_limit] if index <= len(region_ids) * per_station_limit else None
        if not expected_region_id:
            raise ExecutionAuthorityError("station_sequence_observation_limit_exceeded", "invalid_evidence", 409, observationIndex=index, maximumAcceptedObservations=len(region_ids) * per_station_limit)
        if declared_region_id != expected_region_id:
            raise ExecutionAuthorityError("station_sequence_assignment_invalid", "invalid_evidence", 409, observationIndex=index, expectedStationRegionId=expected_region_id, receivedStationRegionId=declared_region_id)


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
    governed_evidence = deepcopy(payload.get("evidence"))
    _validate_station_sequence_policy(contract, governed_evidence)
    boundary_policy = contract.get("components", {}).get("scoring", {}).get("definition", {}).get("boundaryPolicy")
    if isinstance(governed_evidence, Mapping) and isinstance(boundary_policy, Mapping) and boundary_policy.get("mode") == "authority_scoring_gauge":
        governed_evidence = dict(governed_evidence)
        caliber = governed_evidence.pop("scoringCaliber", None)
        diameter = governed_evidence.pop("scoringGaugeDiameterInches", None)
        if caliber not in (None, "") or diameter not in (None, ""):
            governed_evidence["_backendScoringGaugeContext"] = {
                "caliber": caliber,
                "diameterInches": diameter,
                "source": "shooter_declared_material_fact",
            }
    try:
        result = execute_capability(contract, governed_evidence)
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
