"""Publisher-designated response matching without legal or tactical judgment."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from typing import Any, Dict, Mapping, Optional

from stage_event_primitives import admitted_image, current_plan_item, sign_result, text
from ugo_observation_classifier import classify
from target_execution_contract import canonical_json, digest


class DecisionScenarioError(ValueError):
    pass


TERMINAL_STATES = {"complete", "stopped_incomplete"}
EXPECTED_RESPONSES = {"observation_required", "no_observation_expected"}
RECONCILIATION_STATES = {"matched", "mismatched", "ambiguous", "unresolved", "missing"}


def _profile(contract: Mapping[str, Any]) -> Dict[str, Any]:
    mission = deepcopy(contract["components"]["mission"]["definition"])
    required = ("profileId", "profileVersion", "publisherAuthority", "sourceDocuments", "approval", "effective", "lifecycle", "componentBindings", "claimGrade", "presentationMode", "timingPolicy", "presentations", "capabilityStates")
    if any(field not in mission for field in required):
        raise DecisionScenarioError("decision_profile_incomplete")
    if mission.get("missionFamily") != "decisionScenarioEvaluation" or mission.get("resultPackageType") != "decisionScenarioResult" or text(mission.get("resultPackageVersion")) != "1":
        raise DecisionScenarioError("decision_profile_binding_invalid")
    if mission.get("claimGrade") != "publisher_designation_response_match" or mission.get("presentationMode") != "fixed_profile_order":
        raise DecisionScenarioError("decision_claim_or_presentation_mode_invalid")
    authority, sources = mission["publisherAuthority"], mission["sourceDocuments"]
    if not isinstance(authority, Mapping) or not text(authority.get("id")) or not text(authority.get("name")) or not isinstance(sources, list) or not sources:
        raise DecisionScenarioError("decision_publisher_authority_incomplete")
    for source in sources:
        source_hash = text(source.get("sha256")).lower() if isinstance(source, Mapping) else ""
        if not isinstance(source, Mapping) or any(not text(source.get(key)) for key in ("id", "title", "revision", "reference", "effectiveFrom")) or len(source_hash) != 64 or any(character not in "0123456789abcdef" for character in source_hash):
            raise DecisionScenarioError("decision_source_authority_invalid")
    approval, effective, lifecycle = mission["approval"], mission["effective"], mission["lifecycle"]
    if not isinstance(approval, Mapping) or approval.get("status") != "approved" or not text(approval.get("authorityId")) or not isinstance(effective, Mapping) or not text(effective.get("from")) or not isinstance(lifecycle, Mapping) or lifecycle.get("status") != "active" or lifecycle.get("suspended") is not False or lifecycle.get("revoked") is not False or lifecycle.get("supersededBy") is not None:
        raise DecisionScenarioError("decision_profile_authority_inactive")
    try:
        datetime.fromisoformat(text(effective["from"]).replace("Z", "+00:00"))
        if effective.get("until"):
            datetime.fromisoformat(text(effective["until"]).replace("Z", "+00:00"))
    except ValueError as exc:
        raise DecisionScenarioError("decision_effective_window_invalid") from exc
    bindings, target = mission["componentBindings"], contract["targetProfile"]
    if not isinstance(bindings, Mapping) or bindings.get("targetProfileId") != target["id"] or text(bindings.get("targetProfileVersion")) != text(target["version"]) or bindings.get("registrationDigest") != contract["components"]["registration"]["digest"] or bindings.get("geometryDigest") != contract["components"]["geometry"]["digest"]:
        raise DecisionScenarioError("decision_component_binding_invalid")
    timing = mission["timingPolicy"]
    if not isinstance(timing, Mapping) or timing.get("mode") not in {"untimed", "fixed_practice_window"} or timing.get("clockSource") not in {"backend_orchestration_clock", "client_practice_clock"} or timing.get("physicalShotTiming") != "unavailable":
        raise DecisionScenarioError("decision_timing_policy_invalid")
    if timing["mode"] == "fixed_practice_window" and (not isinstance(timing.get("windowMs"), int) or not 1 <= timing["windowMs"] <= 3600000):
        raise DecisionScenarioError("decision_practice_window_invalid")
    presentations = mission["presentations"]
    if not isinstance(presentations, list) or not presentations:
        raise DecisionScenarioError("decision_presentations_required")
    ids = set()
    geometry = contract["components"]["geometry"]["definition"]
    entities = geometry.get("entities", geometry.get("regions", geometry.get("zones", [])))
    known_entities = {text(item.get("entityId", item.get("regionId", item.get("zoneId")))) for item in entities if isinstance(item, Mapping)}
    for presentation in presentations:
        designation = presentation.get("publisherDesignation") if isinstance(presentation, Mapping) else None
        policy = presentation.get("responsePolicy") if isinstance(presentation, Mapping) else None
        presentation_id = text(presentation.get("presentationId")) if isinstance(presentation, Mapping) else ""
        if not isinstance(presentation, Mapping) or not text(presentation.get("scenarioId")) or not presentation_id or not text(presentation.get("title")) or not isinstance(designation, Mapping) or not isinstance(policy, Mapping):
            raise DecisionScenarioError("decision_presentation_invalid")
        if presentation_id in ids:
            raise DecisionScenarioError("decision_presentation_identity_duplicate")
        ids.add(presentation_id)
        if not text(designation.get("id")) or not text(designation.get("label")) or designation.get("expectedResponse") not in EXPECTED_RESPONSES or not text(designation.get("sourceReference")):
            raise DecisionScenarioError("decision_designation_invalid")
        minimum, maximum = policy.get("minimumObservations"), policy.get("maximumObservations")
        if not isinstance(minimum, int) or not isinstance(maximum, int) or not 0 <= minimum <= maximum <= 500 or not isinstance(policy.get("allowExplicitNoObservation"), bool):
            raise DecisionScenarioError("decision_response_policy_invalid")
        expected = designation["expectedResponse"]
        if (expected == "observation_required" and minimum < 1) or (expected == "no_observation_expected" and (minimum != 0 or maximum != 0 or policy["allowExplicitNoObservation"] is not True)):
            raise DecisionScenarioError("decision_expected_response_policy_conflict")
        entity_ids = policy.get("authorizedEntityIds", [])
        if not isinstance(entity_ids, list) or any(text(item) not in known_entities for item in entity_ids):
            raise DecisionScenarioError("decision_geometry_entity_unavailable")
    if contract["components"]["scoring"]["definition"].get("status") != "not_applicable":
        raise DecisionScenarioError("decision_requires_not_applicable_scoring")
    return mission


def _plan(profile: Mapping[str, Any]) -> list[Dict[str, Any]]:
    return [{**deepcopy(item), "planIndex": index} for index, item in enumerate(profile["presentations"], start=1)]


def _current(state: Mapping[str, Any]) -> Dict[str, Any]:
    return current_plan_item(state, "decision_plan_complete", DecisionScenarioError)


def _classify(contract: Mapping[str, Any], observations: list[Mapping[str, Any]], offset: int) -> list[Dict[str, Any]]:
    geometry = contract["components"]["geometry"]["definition"]
    regions = geometry.get("entities", geometry.get("regions", geometry.get("zones", [])))
    id_key = "entityId" if geometry.get("entities") is not None else ("regionId" if geometry.get("regions") is not None else "zoneId")
    output = []
    for index, observation in enumerate(observations, start=offset + 1):
        try:
            x, y = float(observation.get("xNorm")), float(observation.get("yNorm"))
        except (TypeError, ValueError) as exc:
            raise DecisionScenarioError("decision_observation_coordinate_invalid") from exc
        if not 0 <= x <= 1 or not 0 <= y <= 1:
            raise DecisionScenarioError("decision_observation_coordinate_invalid")
        try:
            result = classify(regions, x, y, id_key=id_key, shape_reason="decision_geometry_shape_not_supported", error_type=DecisionScenarioError)
        except (KeyError, TypeError, ValueError) as exc:
            raise DecisionScenarioError(str(exc)) from exc
        output.append({"observationId": f"observation-{index:03d}", "xNorm": x, "yNorm": y, "geometryEntityId": result["entityId"], "classificationStatus": result["classificationStatus"], "matchingEntityIds": result["matchingEntityIds"], "evidenceMeaning": "shooter_recorded_visible_shot_observation"})
    return output


def _reconcile(active: Mapping[str, Any]) -> str:
    expected = active["presentation"]["publisherDesignation"]["expectedResponse"]
    observations = active["observations"]
    if active["noResponseEvidence"] is not None:
        return "matched" if expected == "no_observation_expected" else "mismatched"
    if not observations:
        return "missing"
    if expected == "no_observation_expected":
        return "mismatched"
    if any(item["classificationStatus"] == "ambiguous" for item in observations):
        return "ambiguous"
    authorized = set(active["presentation"]["responsePolicy"].get("authorizedEntityIds", []))
    if any(item["classificationStatus"] in {"unmapped", "registration_unavailable"} or (authorized and item.get("geometryEntityId") not in authorized) for item in observations):
        return "unresolved"
    policy = active["presentation"]["responsePolicy"]
    return "matched" if policy["minimumObservations"] <= len(observations) <= policy["maximumObservations"] else "mismatched"


def _public_active(active: Mapping[str, Any]) -> Dict[str, Any]:
    item = active["presentation"]
    return {"scenarioId": item["scenarioId"], "presentationId": item["presentationId"], "title": item["title"], "publisherDesignationLabel": item["publisherDesignation"]["label"], "expectedResponse": item["publisherDesignation"]["expectedResponse"], "issuedAt": active["issuedAt"], "observationCount": len(active["observations"]), "noObservationRecorded": active["noResponseEvidence"] is not None}


def _public_state(state: Mapping[str, Any]) -> Dict[str, Any]:
    return {"status": state.get("terminalStatus") or "in_progress", "completedPresentationCount": len(state["presentationRecords"]), "plannedPresentationCount": len(state["plan"]), "activeScenario": _public_active(state["activeScenario"]) if state.get("activeScenario") else None}


def _result(contract: Mapping[str, Any], state: Mapping[str, Any], session_id: str) -> Dict[str, Any]:
    records = deepcopy(state["presentationRecords"])
    observations = [deepcopy(item) for record in records for item in record["observations"]]
    counts = {key: sum(1 for record in records if record["reconciliationState"] == key) for key in RECONCILIATION_STATES}
    profile = state["profile"]
    result = {
        "ok": True, "status": state["terminalStatus"], "authoritySource": "backend-authoritative", "authoritativeSessionId": session_id,
        "missionFamily": contract["missionFamily"], "resultPackageType": contract["resultPackageType"], "resultPackageVersion": contract["resultPackageVersion"], "target": deepcopy(contract["targetProfile"]),
        "executionContract": {"contractId": contract["contractId"], "contractVersion": contract["contractVersion"], "contractFingerprint": contract["contractFingerprint"], "executorId": contract["executor"]["id"], "executorVersion": contract["executor"]["version"], "secAdapterFamilyId": contract["secAdapter"]["id"], "secAdapterFamilyVersion": contract["secAdapter"]["version"], "preservationValidatorId": contract["preservationValidator"]["id"], "preservationValidatorVersion": contract["preservationValidator"]["version"]},
        "profile": {"profileId": profile["profileId"], "profileVersion": profile["profileVersion"], "componentDigest": contract["components"]["mission"]["digest"], "publisherAuthority": deepcopy(profile["publisherAuthority"]), "sourceDocuments": deepcopy(profile["sourceDocuments"]), "approval": deepcopy(profile["approval"]), "effective": deepcopy(profile["effective"]), "componentBindings": deepcopy(profile["componentBindings"])},
        "claim": {"claimGrade": "publisher_designation_response_match", "displayLabel": "Publisher-Designated Response Match — Not Legal or Tactical Judgment", "legalJudgmentStatus": "not_established", "tacticalJudgmentStatus": "not_established", "threatStatus": "not_established", "useOfForceStatus": "not_established", "qualificationStatus": "not_established"},
        "run": {"terminalStatus": state["terminalStatus"], "presentationCount": len(records), "plannedPresentationCount": len(state["plan"])},
        "presentations": records, "observations": observations, "imageEvidence": deepcopy(state["imageEvidence"]),
        "reconciliation": {"status": "reconciled", "presentationCount": len(records), "observationCount": len(observations), **counts},
        "timing": {"policy": deepcopy(profile["timingPolicy"]), "presentationAuthority": "backend", "physicalShotTiming": {"status": "unavailable", "reason": "no_authorized_physical_shot_timing_source"}},
        "scoring": {"status": "not_applicable", "reason": "publisher_designation_response_matching_is_not_scoring"},
        "capabilityStates": deepcopy(profile["capabilityStates"]),
        "authorityTrace": {"targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}", "resultAuthority": "backend", "scenarioAuthority": "decision_scenario_profile", "stageEventAuthority": "backend", "componentDigests": {name: component["digest"] for name, component in contract["components"].items()}},
    }
    return sign_result(result)


def transition(contract: Mapping[str, Any], current_state: Optional[Mapping[str, Any]], action: Mapping[str, Any]) -> Dict[str, Any]:
    profile = _profile(contract)
    action_type, session_id = text(action.get("type")), text(action.get("authoritativeSessionId"))
    sequence, received_at = int(action["backendSequenceNumber"]), text(action["backendReceivedAt"])
    if not session_id:
        raise DecisionScenarioError("authoritative_session_id_required")
    if current_state is None:
        if action_type != "start_run":
            raise DecisionScenarioError("decision_start_required")
        state = {"contractFingerprint": contract["contractFingerprint"], "profile": profile, "plan": _plan(profile), "cursor": 0, "activeScenario": None, "presentationRecords": [], "terminalStatus": None, "imageEvidence": admitted_image(action.get("imageEvidence"), "registered_decision_scenario_evidence", DecisionScenarioError), "startedAt": received_at}
        return {"state": state, "event": {"type": action_type}, "response": {"ok": True, "status": "in_progress", "runState": _public_state(state)}}
    state = deepcopy(dict(current_state))
    if state.get("terminalStatus"):
        raise DecisionScenarioError("decision_run_terminal")
    if state.get("contractFingerprint") != contract["contractFingerprint"]:
        raise DecisionScenarioError("decision_contract_mismatch")
    if action_type == "present_scenario":
        if state.get("activeScenario"):
            raise DecisionScenarioError("decision_active_scenario_exists")
        item = _current(state)
        state["activeScenario"] = {"presentation": item, "issuedAt": received_at, "sequenceNumber": sequence, "observations": [], "noResponseEvidence": None, "practiceTiming": None}
        response = {"ok": True, "status": "in_progress", "activeScenario": _public_active(state["activeScenario"]), "runState": _public_state(state)}
    elif action_type == "record_response_evidence":
        active, observations = state.get("activeScenario"), action.get("observations")
        if not active or not isinstance(observations, list) or not observations or active["noResponseEvidence"] is not None:
            raise DecisionScenarioError("decision_active_scenario_observations_required")
        offset = sum(len(record["observations"]) for record in state["presentationRecords"]) + len(active["observations"])
        active["observations"].extend(_classify(contract, observations, offset))
        state["activeScenario"] = active
        response = {"ok": True, "status": "in_progress", "activeScenario": _public_active(active), "runState": _public_state(state)}
    elif action_type == "record_no_observation":
        active = state.get("activeScenario")
        if not active or active["observations"] or active["noResponseEvidence"] is not None or active["presentation"]["responsePolicy"].get("allowExplicitNoObservation") is not True:
            raise DecisionScenarioError("decision_no_response_evidence_not_authorized")
        active["noResponseEvidence"] = {"kind": "explicit_no_observation", "provenance": "shooter_declared_after_backend_presentation", "recordedAt": received_at, "presentationSequenceNumber": active["sequenceNumber"], "physicalShotAbsenceProven": False}
        state["activeScenario"] = active
        response = {"ok": True, "status": "in_progress", "activeScenario": _public_active(active), "runState": _public_state(state)}
    elif action_type == "advance":
        active = state.get("activeScenario")
        if not active:
            raise DecisionScenarioError("decision_active_scenario_required")
        if not active["observations"] and active["noResponseEvidence"] is None:
            raise DecisionScenarioError("decision_response_evidence_required")
        elapsed = action.get("practiceElapsedMs")
        if elapsed is not None and (profile["timingPolicy"]["mode"] != "fixed_practice_window" or profile["timingPolicy"]["clockSource"] != "client_practice_clock" or not isinstance(elapsed, int) or elapsed < 0):
            raise DecisionScenarioError("decision_practice_time_invalid")
        active["practiceTiming"] = {"elapsedMs": elapsed, "source": "client_practice_clock", "authority": "practice_only"} if elapsed is not None else None
        active["reconciliationState"] = _reconcile(active)
        active["advancedAt"] = received_at
        state["presentationRecords"].append(deepcopy(active))
        state["cursor"] += 1
        state["activeScenario"] = None
        if state["cursor"] >= len(state["plan"]):
            state["terminalStatus"] = "complete"
            result = _result(contract, state, session_id)
            response = {"ok": True, "status": "complete", "runState": _public_state(state), "result": result}
        else:
            response = {"ok": True, "status": "in_progress", "runState": _public_state(state)}
    elif action_type == "stop_run":
        state["terminalStatus"] = "stopped_incomplete"
        result = _result(contract, state, session_id)
        response = {"ok": True, "status": "stopped_incomplete", "runState": _public_state(state), "result": result}
    else:
        raise DecisionScenarioError("decision_action_invalid")
    active = state.get("activeScenario") or {}
    return {"state": state, "event": {"type": action_type, "presentationId": active.get("presentation", {}).get("presentationId")}, "response": response}


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    raise DecisionScenarioError("decision_requires_session_bound_action_execution")


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    if not isinstance(result, Mapping):
        return False
    try:
        profile = _profile(contract)
    except DecisionScenarioError:
        return False
    result_hash = result.get("resultHash")
    canonical = {key: value for key, value in result.items() if key not in {"resultHash", "resultIdentity"}}
    records, reconciliation = result.get("presentations"), result.get("reconciliation", {})
    if not isinstance(result_hash, str) or result_hash != digest(canonical_json(canonical)) or result.get("resultIdentity") != f"SCZN3-RESULT-{result_hash[:24].upper()}" or not isinstance(records, list):
        return False
    expected_plan, flattened = _plan(profile), []
    if result.get("status") == "complete" and len(records) != len(expected_plan):
        return False
    if result.get("status") == "stopped_incomplete" and len(records) > len(expected_plan):
        return False
    for index, record in enumerate(records):
        if not isinstance(record, Mapping) or index >= len(expected_plan) or record.get("presentation") != expected_plan[index] or not isinstance(record.get("observations"), list) or record.get("reconciliationState") not in RECONCILIATION_STATES:
            return False
        if record.get("observations") and record.get("noResponseEvidence") is not None:
            return False
        try:
            rebuilt = _classify(contract, record["observations"], len(flattened))
        except DecisionScenarioError:
            return False
        if record["observations"] != rebuilt or record.get("reconciliationState") != _reconcile(record):
            return False
        no_response = record.get("noResponseEvidence")
        if no_response is not None and no_response.get("provenance") != "shooter_declared_after_backend_presentation":
            return False
        flattened.extend(record["observations"])
    counts = {key: sum(1 for record in records if record["reconciliationState"] == key) for key in RECONCILIATION_STATES}
    claim = result.get("claim", {})
    return bool(
        result.get("ok") is True and result.get("status") in TERMINAL_STATES and result.get("authoritySource") == "backend-authoritative"
        and result.get("missionFamily") == contract["missionFamily"] and result.get("resultPackageType") == contract["resultPackageType"] and result.get("resultPackageVersion") == contract["resultPackageVersion"]
        and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"] and result.get("target") == contract["targetProfile"]
        and result.get("profile", {}).get("profileId") == profile["profileId"] and result.get("profile", {}).get("profileVersion") == profile["profileVersion"] and result.get("profile", {}).get("componentDigest") == contract["components"]["mission"]["digest"]
        and result.get("profile", {}).get("publisherAuthority") == profile["publisherAuthority"] and result.get("profile", {}).get("sourceDocuments") == profile["sourceDocuments"] and result.get("profile", {}).get("componentBindings") == profile["componentBindings"]
        and claim == {"claimGrade": "publisher_designation_response_match", "displayLabel": "Publisher-Designated Response Match — Not Legal or Tactical Judgment", "legalJudgmentStatus": "not_established", "tacticalJudgmentStatus": "not_established", "threatStatus": "not_established", "useOfForceStatus": "not_established", "qualificationStatus": "not_established"}
        and result.get("run") == {"terminalStatus": result["status"], "presentationCount": len(records), "plannedPresentationCount": len(expected_plan)}
        and result.get("observations") == flattened and reconciliation.get("status") == "reconciled" and reconciliation.get("presentationCount") == len(records) and reconciliation.get("observationCount") == len(flattened)
        and all(reconciliation.get(key) == value for key, value in counts.items()) and sum(counts.values()) == len(records)
        and result.get("timing", {}).get("policy") == profile["timingPolicy"] and result.get("timing", {}).get("physicalShotTiming", {}).get("status") == "unavailable"
        and result.get("scoring", {}).get("status") == "not_applicable" and result.get("imageEvidence", {}).get("backendHashVerified") is True
        and result.get("authorityTrace", {}).get("componentDigests") == {name: component["digest"] for name, component in contract["components"].items()}
    )
