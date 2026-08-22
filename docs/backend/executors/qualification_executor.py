"""Practice/simulation Qualification family owner."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from typing import Any, Dict, Mapping, Optional

from stage_event_primitives import admitted_image, contains, coordinate, current_plan_item, reconcile, sign_result, text
from target_execution_contract import canonical_json, digest


class QualificationError(ValueError):
    pass


TERMINAL_STATES = {"complete", "stopped_incomplete"}
OUTCOMES = {"pass", "fail", "incomplete", "not_evaluable"}


def _json_stable_numbers(value: Any) -> Any:
    """Avoid signed-package drift when JavaScript round-trips integral floats."""
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, list):
        return [_json_stable_numbers(item) for item in value]
    if isinstance(value, Mapping):
        return {key: _json_stable_numbers(item) for key, item in value.items()}
    return value


def _profile(contract: Mapping[str, Any]) -> Dict[str, Any]:
    mission = deepcopy(contract["components"]["mission"]["definition"])
    required = ("profileId", "profileVersion", "courseName", "courseMode", "claimantClass", "governingAuthority", "sourceDocuments", "approval", "effective", "lifecycle", "componentBindings", "resultVocabulary", "allowedClaimGrades", "timingPolicy", "targetInstances", "stages", "threshold", "incompleteCourseOutcome", "capabilityStates")
    if any(field not in mission for field in required):
        raise QualificationError("qualification_profile_incomplete")
    if mission.get("missionFamily") != "qualificationCourseEvaluation" or mission.get("resultPackageType") != "qualificationResult" or text(mission.get("resultPackageVersion")) != "1":
        raise QualificationError("qualification_profile_binding_invalid")
    authority = mission["governingAuthority"]
    sources = mission["sourceDocuments"]
    if not isinstance(authority, Mapping) or not text(authority.get("id")) or not text(authority.get("name")) or not isinstance(sources, list) or not sources:
        raise QualificationError("qualification_governing_authority_incomplete")
    for source in sources:
        source_hash = text(source.get("sha256")).lower() if isinstance(source, Mapping) else ""
        if not isinstance(source, Mapping) or any(not text(source.get(key)) for key in ("id", "title", "revision", "reference", "effectiveFrom")) or len(source_hash) != 64 or any(character not in "0123456789abcdef" for character in source_hash):
            raise QualificationError("qualification_source_authority_invalid")
    approval, effective, lifecycle = mission["approval"], mission["effective"], mission["lifecycle"]
    if not text(mission["claimantClass"]) or not isinstance(approval, Mapping) or approval.get("status") != "approved" or not text(approval.get("authorityId")) or not isinstance(effective, Mapping) or not text(effective.get("from")) or not isinstance(lifecycle, Mapping) or lifecycle.get("status") != "active" or lifecycle.get("suspended") is not False or lifecycle.get("revoked") is not False or lifecycle.get("supersededBy") is not None:
        raise QualificationError("qualification_profile_authority_inactive")
    try:
        datetime.fromisoformat(text(effective["from"]).replace("Z", "+00:00"))
        if effective.get("until"):
            datetime.fromisoformat(text(effective["until"]).replace("Z", "+00:00"))
    except ValueError as exc:
        raise QualificationError("qualification_effective_window_invalid") from exc
    bindings = mission["componentBindings"]
    target = contract["targetProfile"]
    if not isinstance(bindings, Mapping) or bindings.get("targetProfileId") != target["id"] or text(bindings.get("targetProfileVersion")) != text(target["version"]) or bindings.get("geometryDigest") != contract["components"]["geometry"]["digest"] or bindings.get("scoringDigest") != contract["components"]["scoring"]["digest"]:
        raise QualificationError("qualification_component_binding_invalid")
    if mission["resultVocabulary"] != ["pass", "fail", "incomplete", "not_evaluable"]:
        raise QualificationError("qualification_result_vocabulary_invalid")
    grades = mission["allowedClaimGrades"]
    if not isinstance(grades, list) or "practice_simulation" not in grades or any(value not in {"practice_simulation", "official_qualification"} for value in grades):
        raise QualificationError("qualification_claim_policy_invalid")
    timing = mission["timingPolicy"]
    if not isinstance(timing, Mapping) or timing.get("physicalShotTiming") != "unavailable" or timing.get("clockSource") not in {"backend_orchestration_clock", "client_practice_clock", "external_reported_timer"}:
        raise QualificationError("qualification_timing_policy_invalid")
    instances = mission["targetInstances"]
    instance_ids = {text(item.get("targetInstanceId")) for item in instances if isinstance(item, Mapping)} if isinstance(instances, list) else set()
    if not instance_ids or len(instance_ids) != len(instances):
        raise QualificationError("qualification_target_instances_invalid")
    geometry = contract["components"]["geometry"]["definition"]
    zones = geometry.get("zones")
    values = contract["components"]["scoring"]["definition"].get("zoneValues")
    if not isinstance(zones, list) or not zones or not isinstance(values, Mapping):
        raise QualificationError("qualification_geometry_scoring_incomplete")
    zone_ids = {text(zone.get("zoneId")) for zone in zones if isinstance(zone, Mapping)}
    if not zone_ids or any(zone not in values for zone in zone_ids) or "outside" not in values:
        raise QualificationError("qualification_zone_values_incomplete")
    stages = mission["stages"]
    if not isinstance(stages, list) or not stages:
        raise QualificationError("qualification_stages_required")
    stage_ids = set()
    for stage in stages:
        if not isinstance(stage, Mapping) or not text(stage.get("stageId")) or not text(stage.get("title")) or stage.get("targetInstanceId") not in instance_ids or not isinstance(stage.get("requiredRounds"), int) or stage["requiredRounds"] < 1:
            raise QualificationError("qualification_stage_invalid")
        if stage["stageId"] in stage_ids:
            raise QualificationError("qualification_stage_identity_duplicate")
        stage_ids.add(stage["stageId"])
        allowed = stage.get("allowedZoneIds")
        distance = stage.get("distance")
        if not isinstance(allowed, list) or not allowed or any(value not in zone_ids for value in allowed) or not isinstance(distance, Mapping) or distance.get("unit") not in {"yd", "m"} or not isinstance(distance.get("value"), (int, float)) or distance["value"] <= 0:
            raise QualificationError("qualification_stage_authority_invalid")
        if stage.get("timeLimitMs") is not None and (not isinstance(stage["timeLimitMs"], int) or stage["timeLimitMs"] < 1):
            raise QualificationError("qualification_stage_timing_invalid")
    threshold = mission["threshold"]
    if not isinstance(threshold, Mapping) or threshold.get("operator") != "greater_than_or_equal" or not isinstance(threshold.get("value"), (int, float)):
        raise QualificationError("qualification_threshold_invalid")
    scoring = contract["components"]["scoring"]["definition"]
    if scoring.get("status") != "governed" or scoring.get("extraObservationTreatment") not in {"not_evaluable", "include"} or not isinstance(scoring.get("missingRoundValue"), (int, float)):
        raise QualificationError("qualification_scoring_policy_invalid")
    return mission


def _plan(profile: Mapping[str, Any]) -> list[Dict[str, Any]]:
    return [{"stageId": stage["stageId"], "stageTitle": stage["title"], "stageInstruction": stage.get("instruction", ""), "cueId": stage["stageId"], "label": stage["title"], "entityIds": deepcopy(stage["allowedZoneIds"]), "responsePolicy": {"expectedObservationCount": stage["requiredRounds"], "allowNoObservation": True}, "distance": deepcopy(stage["distance"]), "targetInstanceId": stage["targetInstanceId"], "timeLimitMs": stage.get("timeLimitMs"), "planIndex": index} for index, stage in enumerate(profile["stages"], start=1)]


def _classify(contract: Mapping[str, Any], observation: Mapping[str, Any], index: int) -> Dict[str, Any]:
    x = coordinate(observation.get("xNorm"), "qualification_observation_x_invalid", QualificationError)
    y = coordinate(observation.get("yNorm"), "qualification_observation_y_invalid", QualificationError)
    zones = contract["components"]["geometry"]["definition"]["zones"]
    matches = [zone for zone in zones if contains(zone, x, y, "qualification_geometry_shape_not_supported", QualificationError)]
    matches.sort(key=lambda zone: int(zone.get("priority", 0)), reverse=True)
    ambiguous = len(matches) > 1 and int(matches[0].get("priority", 0)) == int(matches[1].get("priority", 0))
    zone_id = None if ambiguous else (text(matches[0]["zoneId"]) if matches else "outside")
    values = contract["components"]["scoring"]["definition"]["zoneValues"]
    return {"observationId": f"observation-{index:03d}", "xNorm": x, "yNorm": y, "entityId": zone_id, "zoneId": zone_id, "classificationStatus": "ambiguous" if ambiguous else "classified", "matchingEntityIds": [text(zone["zoneId"]) for zone in matches], "value": None if ambiguous else float(values[zone_id]), "evidenceMeaning": "shooter_recorded_visible_shot_observation"}


def _public_cue(active: Mapping[str, Any]) -> Dict[str, Any]:
    cue = active["cue"]
    return {"cueId": cue["cueId"], "stageId": cue["stageId"], "stageTitle": cue["stageTitle"], "label": cue["label"], "source": "qualification_profile", "issuedAt": active["issuedAt"], "observationCount": len(active["observations"]), "noObservationDeclared": active["noObservationDeclared"], "distance": deepcopy(cue["distance"]), "requiredRounds": cue["responsePolicy"]["expectedObservationCount"]}


def _public_state(state: Mapping[str, Any]) -> Dict[str, Any]:
    return {"status": state.get("terminalStatus") or "in_progress", "completedCueCount": len(state["stageRecords"]), "plannedCueCount": len(state["plan"]), "activeCue": _public_cue(state["activeStage"]) if state.get("activeStage") else None, "externalCueRequired": False, "claimGrade": "practice_simulation", "courseName": state["profile"]["courseName"]}


def _evaluate(contract: Mapping[str, Any], state: Mapping[str, Any]) -> tuple[str, float, list[Dict[str, Any]]]:
    scoring = contract["components"]["scoring"]["definition"]
    evaluated = []
    total = 0.0
    not_evaluable = False
    incomplete = False
    for record in state["stageRecords"]:
        stage_total = sum(float(item["value"]) for item in record["observations"] if item.get("value") is not None)
        missing = max(0, int(record["cue"]["responsePolicy"]["expectedObservationCount"]) - len(record["observations"]))
        stage_total += missing * float(scoring["missingRoundValue"])
        if record["reconciliationState"] in {"ambiguous", "unresolved"} or (record["reconciliationState"] == "extra" and scoring["extraObservationTreatment"] == "not_evaluable") or record.get("timingStatus") in {"not_evaluable", "outside_practice_window"}:
            not_evaluable = True
        if record["reconciliationState"] == "missing":
            incomplete = True
        total += stage_total
        evaluated.append({**deepcopy(record), "stageScore": stage_total, "missingRoundCount": missing})
    if state["terminalStatus"] == "stopped_incomplete" or len(state["stageRecords"]) < len(state["plan"]):
        outcome = "incomplete"
    elif not_evaluable:
        outcome = "not_evaluable"
    elif incomplete and state["profile"]["incompleteCourseOutcome"] == "incomplete":
        outcome = "incomplete"
    elif total >= float(state["profile"]["threshold"]["value"]):
        outcome = "pass"
    else:
        outcome = "fail"
    return outcome, total, evaluated


def _result(contract: Mapping[str, Any], state: Mapping[str, Any], session_id: str) -> Dict[str, Any]:
    outcome, total, stages = _evaluate(contract, state)
    observations = [deepcopy(item) for record in stages for item in record["observations"]]
    counts = {key: sum(1 for record in stages if record["reconciliationState"] == key) for key in ("recorded", "missing", "extra", "ambiguous", "unresolved")}
    profile = state["profile"]
    return sign_result(_json_stable_numbers({
        "ok": True, "status": state["terminalStatus"], "authoritySource": "backend-authoritative", "authoritativeSessionId": session_id,
        "missionFamily": contract["missionFamily"], "resultPackageType": contract["resultPackageType"], "resultPackageVersion": contract["resultPackageVersion"],
        "target": deepcopy(contract["targetProfile"]),
        "executionContract": {"contractId": contract["contractId"], "contractVersion": contract["contractVersion"], "contractFingerprint": contract["contractFingerprint"], "executorId": contract["executor"]["id"], "executorVersion": contract["executor"]["version"], "secAdapterFamilyId": contract["secAdapter"]["id"], "secAdapterFamilyVersion": contract["secAdapter"]["version"], "preservationValidatorId": contract["preservationValidator"]["id"], "preservationValidatorVersion": contract["preservationValidator"]["version"]},
        "profile": {"profileId": profile["profileId"], "profileVersion": profile["profileVersion"], "componentDigest": contract["components"]["mission"]["digest"], "courseName": profile["courseName"], "courseMode": profile["courseMode"], "claimantClass": profile["claimantClass"], "governingAuthority": deepcopy(profile["governingAuthority"]), "sourceDocuments": deepcopy(profile["sourceDocuments"]), "approval": deepcopy(profile["approval"]), "effective": deepcopy(profile["effective"]), "componentBindings": deepcopy(profile["componentBindings"])},
        "run": {"terminalStatus": state["terminalStatus"], "stageCount": len(stages), "plannedStageCount": len(state["plan"])},
        "claim": {"claimGrade": "practice_simulation", "officialClaimStatus": "not_established", "credentialStatus": "not_issued_by_sczn3", "displayLabel": "Practice Simulation — Not Official Qualification"},
        "performance": {"outcome": outcome, "total": total, "threshold": deepcopy(profile["threshold"])},
        "stages": stages, "observations": observations, "imageEvidence": deepcopy(state["imageEvidence"]),
        "reconciliation": {"status": "reconciled", "stageCount": len(stages), "observationCount": len(observations), **counts},
        "timing": {"policy": deepcopy(profile["timingPolicy"]), "physicalShotTiming": {"status": "unavailable", "reason": "no_authorized_physical_shot_timing_source"}},
        "capabilityStates": deepcopy(profile["capabilityStates"]),
        "authorityTrace": {"targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}", "resultAuthority": "backend", "stageEventAuthority": "backend", "qualificationAuthority": profile["governingAuthority"]["id"], "componentDigests": {name: component["digest"] for name, component in contract["components"].items()}},
    }))


def transition(contract: Mapping[str, Any], current_state: Optional[Mapping[str, Any]], action: Mapping[str, Any]) -> Dict[str, Any]:
    profile = _profile(contract)
    action_type = text(action.get("type"))
    session_id = text(action.get("authoritativeSessionId"))
    received_at = text(action.get("backendReceivedAt"))
    sequence = int(action["backendSequenceNumber"])
    if current_state is None:
        if action_type != "start_run":
            raise QualificationError("qualification_start_required")
        requested = text(action.get("requestedClaimGrade")) or "practice_simulation"
        if requested == "official_qualification":
            raise QualificationError("official_qualification_authority_unavailable")
        if requested != "practice_simulation" or requested not in profile["allowedClaimGrades"]:
            raise QualificationError("qualification_claim_grade_unavailable")
        try:
            received = datetime.fromisoformat(received_at.replace("Z", "+00:00"))
            starts = datetime.fromisoformat(text(profile["effective"]["from"]).replace("Z", "+00:00"))
            ends = datetime.fromisoformat(text(profile["effective"].get("until")).replace("Z", "+00:00")) if profile["effective"].get("until") else None
        except ValueError as exc:
            raise QualificationError("qualification_execution_time_invalid") from exc
        if received < starts or (ends and received >= ends):
            raise QualificationError("qualification_profile_not_effective")
        state = {"contractFingerprint": contract["contractFingerprint"], "profile": profile, "plan": _plan(profile), "cursor": 0, "activeStage": None, "stageRecords": [], "terminalStatus": None, "imageEvidence": admitted_image(action.get("imageEvidence"), "registered_qualification_practice_evidence", QualificationError), "startedAt": received_at}
        return {"state": state, "event": {"type": action_type}, "response": {"ok": True, "status": "in_progress", "runState": _public_state(state)}}
    state = deepcopy(dict(current_state))
    if state.get("terminalStatus"):
        raise QualificationError("qualification_run_terminal")
    if state.get("contractFingerprint") != contract["contractFingerprint"]:
        raise QualificationError("qualification_contract_mismatch")
    if action_type == "issue_or_declare_cue":
        if state.get("activeStage"):
            raise QualificationError("qualification_active_stage_exists")
        cue = current_plan_item(state, "qualification_course_complete", QualificationError)
        state["activeStage"] = {"cue": cue, "source": "qualification_profile", "issuedAt": received_at, "sequenceNumber": sequence, "observations": [], "noObservationDeclared": False, "practiceTiming": None}
        response = {"ok": True, "status": "in_progress", "activeCue": _public_cue(state["activeStage"]), "runState": _public_state(state)}
    elif action_type == "record_response_evidence":
        active = state.get("activeStage")
        supplied = action.get("observations")
        if not active or not isinstance(supplied, list) or not supplied:
            raise QualificationError("qualification_active_stage_observations_required")
        offset = sum(len(record["observations"]) for record in state["stageRecords"]) + len(active["observations"])
        active["observations"].extend(_classify(contract, item, offset + index) for index, item in enumerate(supplied, start=1))
        state["activeStage"] = active
        response = {"ok": True, "status": "in_progress", "activeCue": _public_cue(active), "runState": _public_state(state)}
    elif action_type == "record_no_observation":
        active = state.get("activeStage")
        if not active or active["observations"]:
            raise QualificationError("qualification_no_observation_invalid")
        active["noObservationDeclared"] = True
        state["activeStage"] = active
        response = {"ok": True, "status": "in_progress", "activeCue": _public_cue(active), "runState": _public_state(state)}
    elif action_type == "advance":
        active = state.get("activeStage")
        if not active:
            raise QualificationError("qualification_active_stage_required")
        elapsed = action.get("practiceElapsedMs")
        time_limit = active["cue"].get("timeLimitMs")
        if elapsed is not None and (not isinstance(elapsed, int) or elapsed < 0):
            raise QualificationError("qualification_practice_time_invalid")
        timing_status = "not_applicable" if time_limit is None else ("not_evaluable" if elapsed is None else ("within_practice_window" if elapsed <= time_limit else "outside_practice_window"))
        active["practiceTiming"] = {"elapsedMs": elapsed, "source": profile["timingPolicy"]["clockSource"]} if elapsed is not None else None
        active["timingStatus"] = timing_status
        active["reconciliationState"] = reconcile(active["observations"], int(active["cue"]["responsePolicy"]["expectedObservationCount"]), set(active["cue"]["entityIds"]))
        active["advancedAt"] = received_at
        state["stageRecords"].append(deepcopy(active))
        state["cursor"] += 1
        state["activeStage"] = None
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
        raise QualificationError("qualification_action_invalid")
    active = state.get("activeStage") or {}
    return {"state": state, "event": {"type": action_type, "stageId": active.get("cue", {}).get("stageId")}, "response": response}


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    raise QualificationError("qualification_requires_session_bound_action_execution")


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    if not isinstance(result, Mapping):
        return False
    try:
        profile = _profile(contract)
    except QualificationError:
        return False
    result_hash = result.get("resultHash")
    canonical = {key: value for key, value in result.items() if key not in {"resultHash", "resultIdentity"}}
    stages = result.get("stages")
    reconciliation = result.get("reconciliation", {})
    if not isinstance(result_hash, str) or result_hash != digest(canonical_json(canonical)) or result.get("resultIdentity") != f"SCZN3-RESULT-{result_hash[:24].upper()}" or not isinstance(stages, list):
        return False
    statuses = ("recorded", "missing", "extra", "ambiguous", "unresolved")
    result_profile = result.get("profile", {})
    if result_profile.get("approval") != profile["approval"] or result_profile.get("effective") != profile["effective"] or result_profile.get("componentBindings") != profile["componentBindings"] or result_profile.get("claimantClass") != profile["claimantClass"]:
        return False
    if not bool(result.get("ok") is True and result.get("status") in TERMINAL_STATES and result.get("authoritySource") == "backend-authoritative" and result.get("missionFamily") == contract["missionFamily"] and result.get("resultPackageType") == contract["resultPackageType"] and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"] and result.get("target") == contract["targetProfile"] and result.get("profile", {}).get("profileId") == profile["profileId"] and result.get("profile", {}).get("profileVersion") == profile["profileVersion"] and result.get("profile", {}).get("componentDigest") == contract["components"]["mission"]["digest"] and result.get("profile", {}).get("governingAuthority") == profile["governingAuthority"] and result.get("profile", {}).get("sourceDocuments") == profile["sourceDocuments"] and result.get("claim", {}).get("claimGrade") == "practice_simulation" and result.get("claim", {}).get("officialClaimStatus") == "not_established" and result.get("claim", {}).get("credentialStatus") == "not_issued_by_sczn3" and result.get("performance", {}).get("outcome") in OUTCOMES and reconciliation.get("status") == "reconciled" and reconciliation.get("stageCount") == len(stages) and result.get("timing", {}).get("policy") == profile["timingPolicy"] and result.get("timing", {}).get("physicalShotTiming", {}).get("status") == "unavailable" and result.get("run", {}).get("terminalStatus") == result.get("status") and result.get("run", {}).get("stageCount") == len(stages) and result.get("run", {}).get("plannedStageCount") == len(profile["stages"]) and result.get("imageEvidence", {}).get("backendHashVerified") is True):
        return False
    if result["status"] == "complete" and len(stages) != len(profile["stages"]):
        return False
    expected_plan = _plan(profile)
    rebuilt_records = []
    flattened = []
    for index, record in enumerate(stages):
        if not isinstance(record, Mapping) or index >= len(expected_plan) or record.get("cue") != expected_plan[index]:
            return False
        observations = record.get("observations")
        if not isinstance(observations, list):
            return False
        expected_observations = []
        for observation_index, observation in enumerate(observations, start=len(flattened) + 1):
            try:
                expected_observations.append(_json_stable_numbers(_classify(contract, observation, observation_index)))
            except QualificationError:
                return False
        if observations != expected_observations:
            return False
        expected_reconciliation = reconcile(observations, int(expected_plan[index]["responsePolicy"]["expectedObservationCount"]), set(expected_plan[index]["entityIds"]))
        if record.get("reconciliationState") != expected_reconciliation:
            return False
        time_limit = expected_plan[index].get("timeLimitMs")
        practice_timing = record.get("practiceTiming")
        elapsed = practice_timing.get("elapsedMs") if isinstance(practice_timing, Mapping) else None
        expected_timing = "not_applicable" if time_limit is None else ("not_evaluable" if elapsed is None else ("within_practice_window" if isinstance(elapsed, int) and 0 <= elapsed <= time_limit else "outside_practice_window"))
        if record.get("timingStatus") != expected_timing or (practice_timing and practice_timing.get("source") != profile["timingPolicy"]["clockSource"]):
            return False
        scoring = contract["components"]["scoring"]["definition"]
        stage_score = sum(item["value"] for item in observations)
        missing = max(0, int(expected_plan[index]["responsePolicy"]["expectedObservationCount"]) - len(observations))
        stage_score += missing * scoring["missingRoundValue"]
        if record.get("stageScore") != _json_stable_numbers(stage_score) or record.get("missingRoundCount") != missing:
            return False
        rebuilt_records.append(deepcopy(dict(record)))
        flattened.extend(observations)
    state = {"profile": profile, "plan": expected_plan, "stageRecords": rebuilt_records, "terminalStatus": result["status"]}
    outcome, total, _ = _evaluate(contract, state)
    expected_performance = {"outcome": outcome, "total": _json_stable_numbers(total), "threshold": profile["threshold"]}
    expected_counts = {key: sum(1 for record in stages if record["reconciliationState"] == key) for key in statuses}
    return bool(result.get("performance") == expected_performance and result.get("observations") == flattened and reconciliation.get("observationCount") == len(flattened) and all(reconciliation.get(key) == value for key, value in expected_counts.items()) and sum(expected_counts.values()) == len(stages) and result.get("authorityTrace", {}).get("componentDigests") == {name: component["digest"] for name, component in contract["components"].items()})
