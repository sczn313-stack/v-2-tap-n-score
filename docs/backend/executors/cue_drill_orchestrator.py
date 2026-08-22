"""Governed Cue/Drill family owner.

The executor owns declarative cue sequencing and evidence association. It does
not score, qualify, diagnose, judge decisions, or infer physical shot timing.
"""
from __future__ import annotations

import random
from copy import deepcopy
from typing import Any, Dict, Mapping, Optional

from target_execution_contract import canonical_json, digest
from stage_event_primitives import admitted_image, contains, coordinate, current_plan_item, reconcile, sign_result, text


class CueDrillError(ValueError):
    pass


SELECTION_MODES = {"fixed_order", "seeded_random", "external_command"}
SEQUENCE_RULES = {"single_pass", "fixed_repeat", "memory_repeat"}
TIMING_MODES = {"untimed", "fixed_practice_window"}
TERMINAL_STATES = {"complete", "stopped_incomplete"}


def _text(value: Any) -> str:
    return text(value)


def _coordinate(value: Any, reason: str) -> float:
    return coordinate(value, reason, CueDrillError)


def _image(value: Any) -> Dict[str, Any]:
    return admitted_image(value, "registered_cue_drill_session_evidence", CueDrillError)


def _profile(contract: Mapping[str, Any]) -> Dict[str, Any]:
    mission = deepcopy(contract["components"]["mission"]["definition"])
    required = ("profileId", "profileVersion", "cueSelectionMode", "sequenceRule", "timingPolicy", "stages", "capabilityStates")
    if any(field not in mission for field in required):
        raise CueDrillError("cue_drill_profile_incomplete")
    if mission.get("missionFamily") != "cueDrillOrchestration" or mission.get("resultPackageType") != "cueDrillResult" or _text(mission.get("resultPackageVersion")) != "1":
        raise CueDrillError("cue_drill_profile_binding_invalid")
    if mission["cueSelectionMode"] not in SELECTION_MODES or mission["sequenceRule"] not in SEQUENCE_RULES:
        raise CueDrillError("cue_drill_profile_mode_invalid")
    timing = mission["timingPolicy"]
    if not isinstance(timing, Mapping) or timing.get("mode") not in TIMING_MODES or timing.get("physicalShotTiming") != "unavailable":
        raise CueDrillError("cue_drill_timing_policy_invalid")
    if timing.get("clockSource") not in {"backend_orchestration_clock", "client_practice_clock", "external_reported_timer"}:
        raise CueDrillError("cue_drill_clock_source_invalid")
    if timing.get("mode") == "fixed_practice_window" and (not isinstance(timing.get("windowMs"), int) or not 1 <= timing["windowMs"] <= 3600000):
        raise CueDrillError("cue_drill_practice_window_invalid")
    stages = mission["stages"]
    if not isinstance(stages, list) or not stages:
        raise CueDrillError("cue_drill_stages_required")
    stage_ids, cue_ids = set(), set()
    geometry_entities = contract["components"]["geometry"]["definition"].get("entities", [])
    known_entities = {_text(entity.get("entityId")) for entity in geometry_entities if isinstance(entity, Mapping)}
    for stage in stages:
        if not isinstance(stage, Mapping) or not _text(stage.get("stageId")) or not _text(stage.get("title")) or not isinstance(stage.get("cues"), list) or not stage["cues"]:
            raise CueDrillError("cue_drill_stage_invalid")
        if stage["stageId"] in stage_ids:
            raise CueDrillError("cue_drill_stage_identity_duplicate")
        stage_ids.add(stage["stageId"])
        for cue in stage["cues"]:
            policy = cue.get("responsePolicy") if isinstance(cue, Mapping) else None
            if not isinstance(cue, Mapping) or not _text(cue.get("cueId")) or not _text(cue.get("label")) or not isinstance(policy, Mapping):
                raise CueDrillError("cue_drill_cue_invalid")
            if cue["cueId"] in cue_ids:
                raise CueDrillError("cue_drill_cue_identity_duplicate")
            cue_ids.add(cue["cueId"])
            expected = policy.get("expectedObservationCount")
            if not isinstance(expected, int) or not 0 <= expected <= 500 or not isinstance(policy.get("allowNoObservation"), bool):
                raise CueDrillError("cue_drill_response_policy_invalid")
            entity_ids = cue.get("entityIds", [])
            if not isinstance(entity_ids, list) or any(_text(entity) not in known_entities for entity in entity_ids):
                raise CueDrillError("cue_drill_geometry_entity_unavailable")
    scoring = contract["components"]["scoring"]["definition"]
    if scoring.get("status") != "not_applicable":
        raise CueDrillError("cue_drill_requires_not_applicable_scoring")
    return mission


def _base_plan(profile: Mapping[str, Any], seed: str) -> list[Dict[str, Any]]:
    rng = random.Random(seed)
    plan = []
    for stage in profile["stages"]:
        cues = [deepcopy(cue) for cue in stage["cues"]]
        if profile["cueSelectionMode"] == "seeded_random":
            rng.shuffle(cues)
        entries = [{"stageId": stage["stageId"], "stageTitle": stage["title"], "stageInstruction": stage.get("instruction", ""), **cue} for cue in cues]
        rule = profile["sequenceRule"]
        if rule == "fixed_repeat":
            entries *= int(profile.get("repeatCount", 1))
        elif rule == "memory_repeat":
            entries = [deepcopy(item) for end in range(1, len(entries) + 1) for item in entries[:end]]
        plan.extend(entries)
    for index, cue in enumerate(plan, start=1):
        cue["planIndex"] = index
    return plan


def _contains(entity: Mapping[str, Any], x: float, y: float) -> bool:
    return contains(entity, x, y, "cue_drill_geometry_shape_not_supported", CueDrillError)


def _classify(contract: Mapping[str, Any], observation: Mapping[str, Any], index: int) -> Dict[str, Any]:
    x = _coordinate(observation.get("xNorm"), "cue_drill_observation_x_invalid")
    y = _coordinate(observation.get("yNorm"), "cue_drill_observation_y_invalid")
    entities = contract["components"]["geometry"]["definition"].get("entities", [])
    matches = [_text(entity["entityId"]) for entity in entities if _contains(entity, x, y)]
    return {
        "observationId": f"observation-{index:03d}",
        "xNorm": x, "yNorm": y,
        "entityId": matches[0] if len(matches) == 1 else None,
        "classificationStatus": "classified" if len(matches) == 1 else ("ambiguous" if len(matches) > 1 else "unresolved"),
        "matchingEntityIds": matches,
        "evidenceMeaning": "shooter_recorded_visible_shot_observation",
    }


def _current_cue(state: Mapping[str, Any]) -> Dict[str, Any]:
    return current_plan_item(state, "cue_drill_plan_complete", CueDrillError)


def _reconcile(active: Mapping[str, Any]) -> str:
    return reconcile(active["observations"], int(active["cue"]["responsePolicy"]["expectedObservationCount"]), set(active["cue"].get("entityIds", [])))


def _result(contract: Mapping[str, Any], state: Mapping[str, Any], session_id: str) -> Dict[str, Any]:
    records = deepcopy(state["cueRecords"])
    observations = [deepcopy(item) for record in records for item in record["observations"]]
    counts = {key: sum(1 for record in records if record["reconciliationState"] == key) for key in ("recorded", "missing", "extra", "ambiguous", "unresolved")}
    profile = state["profile"]
    result = {
        "ok": True,
        "status": state["terminalStatus"],
        "authoritySource": "backend-authoritative",
        "authoritativeSessionId": session_id,
        "missionFamily": contract["missionFamily"],
        "resultPackageType": contract["resultPackageType"],
        "resultPackageVersion": contract["resultPackageVersion"],
        "target": deepcopy(contract["targetProfile"]),
        "executionContract": {
            "contractId": contract["contractId"], "contractVersion": contract["contractVersion"],
            "contractFingerprint": contract["contractFingerprint"],
            "executorId": contract["executor"]["id"], "executorVersion": contract["executor"]["version"],
            "secAdapterFamilyId": contract["secAdapter"]["id"], "secAdapterFamilyVersion": contract["secAdapter"]["version"],
            "preservationValidatorId": contract["preservationValidator"]["id"], "preservationValidatorVersion": contract["preservationValidator"]["version"],
        },
        "profile": {
            "profileId": profile["profileId"], "profileVersion": profile["profileVersion"],
            "componentDigest": contract["components"]["mission"]["digest"],
            "cueSelectionMode": profile["cueSelectionMode"], "sequenceRule": profile["sequenceRule"],
        },
        "run": {"terminalStatus": state["terminalStatus"], "cueCount": len(records), "plannedCueCount": len(state["plan"])},
        "stages": records,
        "observations": observations,
        "imageEvidence": deepcopy(state["imageEvidence"]),
        "reconciliation": {"status": "reconciled", "cueCount": len(records), "observationCount": len(observations), **counts},
        "timing": {
            "policy": deepcopy(profile["timingPolicy"]),
            "cueIssuanceAuthority": "backend_orchestration_clock",
            "physicalShotTiming": {"status": "unavailable", "reason": "no_authorized_physical_shot_timing_source"},
        },
        "scoring": {"status": "not_applicable", "reason": "cue_drill_orchestration_is_not_scoring"},
        "capabilityStates": deepcopy(profile["capabilityStates"]),
        "authorityTrace": {
            "targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}",
            "resultAuthority": "backend", "stageEventAuthority": "backend",
            "componentDigests": {name: component["digest"] for name, component in contract["components"].items()},
        },
    }
    if profile["cueSelectionMode"] == "seeded_random":
        result["randomization"] = {"seed": state["seed"], "generatedCueOrder": [cue["cueId"] for cue in state["plan"]], "authority": "backend"}
    return sign_result(result)


def transition(contract: Mapping[str, Any], current_state: Optional[Mapping[str, Any]], action: Mapping[str, Any]) -> Dict[str, Any]:
    profile = _profile(contract)
    action_type = _text(action.get("type"))
    sequence = int(action["backendSequenceNumber"])
    received_at = _text(action["backendReceivedAt"])
    session_id = _text(action.get("authoritativeSessionId"))
    if not session_id:
        raise CueDrillError("authoritative_session_id_required")
    if current_state is None:
        if action_type != "start_run":
            raise CueDrillError("cue_drill_start_required")
        seed = _text(action.get("backendSeed"))
        if not seed:
            raise CueDrillError("backend_random_seed_required")
        state = {
            "contractFingerprint": contract["contractFingerprint"], "profile": profile,
            "seed": seed, "plan": _base_plan(profile, seed), "cursor": 0,
            "activeCue": None, "cueRecords": [], "terminalStatus": None,
            "imageEvidence": _image(action.get("imageEvidence")), "startedAt": received_at,
        }
        return {"state": state, "event": {"type": action_type}, "response": {"ok": True, "status": "in_progress", "runState": _public_state(state)}}
    state = deepcopy(dict(current_state))
    if state.get("terminalStatus"):
        raise CueDrillError("cue_drill_run_terminal")
    if state.get("contractFingerprint") != contract["contractFingerprint"]:
        raise CueDrillError("cue_drill_contract_mismatch")

    if action_type == "issue_or_declare_cue":
        if state.get("activeCue"):
            raise CueDrillError("cue_drill_active_cue_exists")
        cue = _current_cue(state)
        source = "sczn3_issued"
        if profile["cueSelectionMode"] == "external_command":
            declared_id = _text(action.get("declaredCueId"))
            allowed = {item["cueId"]: item for stage in profile["stages"] for item in stage["cues"]}
            if declared_id not in allowed or action.get("declaredBy") not in {"shooter", "instructor"}:
                raise CueDrillError("external_cue_declaration_invalid")
            chosen = deepcopy(allowed[declared_id])
            cue.update(chosen)
            source = f"{action['declaredBy']}_declared_external"
        state["activeCue"] = {"cue": cue, "source": source, "issuedAt": received_at, "sequenceNumber": sequence, "observations": [], "noObservationDeclared": False, "practiceTiming": None}
        response = {"ok": True, "status": "in_progress", "activeCue": _public_cue(state["activeCue"]), "runState": _public_state(state)}
    elif action_type == "record_response_evidence":
        active = state.get("activeCue")
        observations = action.get("observations")
        if not active or not isinstance(observations, list) or not observations:
            raise CueDrillError("active_cue_observations_required")
        offset = sum(len(record["observations"]) for record in state["cueRecords"]) + len(active["observations"])
        active["observations"].extend(_classify(contract, item, offset + index) for index, item in enumerate(observations, start=1))
        state["activeCue"] = active
        response = {"ok": True, "status": "in_progress", "activeCue": _public_cue(active), "runState": _public_state(state)}
    elif action_type == "record_no_observation":
        active = state.get("activeCue")
        if not active or active["observations"] or active["cue"]["responsePolicy"].get("allowNoObservation") is not True:
            raise CueDrillError("no_observation_declaration_not_authorized")
        active["noObservationDeclared"] = True
        state["activeCue"] = active
        response = {"ok": True, "status": "in_progress", "activeCue": _public_cue(active), "runState": _public_state(state)}
    elif action_type == "advance":
        active = state.get("activeCue")
        if not active:
            raise CueDrillError("active_cue_required")
        timing = profile["timingPolicy"]
        practice = None
        if action.get("practiceElapsedMs") is not None:
            if timing["clockSource"] not in {"client_practice_clock", "external_reported_timer"}:
                raise CueDrillError("practice_time_source_not_authorized")
            elapsed = action["practiceElapsedMs"]
            if not isinstance(elapsed, int) or elapsed < 0:
                raise CueDrillError("practice_time_invalid")
            practice = {"elapsedMs": elapsed, "source": timing["clockSource"], "declaredBy": action.get("declaredBy") if timing["clockSource"] == "external_reported_timer" else "client"}
        active["practiceTiming"] = practice
        record = {**deepcopy(active), "reconciliationState": _reconcile(active), "advancedAt": received_at}
        state["cueRecords"].append(record)
        state["cursor"] += 1
        state["activeCue"] = None
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
    elif action_type == "complete_run":
        if state["cursor"] < len(state["plan"]):
            raise CueDrillError("cue_drill_completion_not_established")
        state["terminalStatus"] = "complete"
        result = _result(contract, state, session_id)
        response = {"ok": True, "status": "complete", "runState": _public_state(state), "result": result}
    else:
        raise CueDrillError("cue_drill_action_invalid")
    active_for_event = state.get("activeCue") or {}
    return {"state": state, "event": {"type": action_type, "cueId": active_for_event.get("cue", {}).get("cueId")}, "response": response}


def _public_cue(active: Mapping[str, Any]) -> Dict[str, Any]:
    cue = active["cue"]
    return {"cueId": cue["cueId"], "stageId": cue["stageId"], "stageTitle": cue["stageTitle"], "label": cue["label"], "source": active["source"], "issuedAt": active["issuedAt"], "observationCount": len(active["observations"]), "noObservationDeclared": active["noObservationDeclared"]}


def _public_state(state: Mapping[str, Any]) -> Dict[str, Any]:
    current = _current_cue(state) if not state.get("terminalStatus") and int(state["cursor"]) < len(state["plan"]) else None
    response = {"status": state.get("terminalStatus") or "in_progress", "completedCueCount": len(state["cueRecords"]), "plannedCueCount": len(state["plan"]), "activeCue": _public_cue(state["activeCue"]) if state.get("activeCue") else None}
    if current and state["profile"]["cueSelectionMode"] == "external_command":
        stage = next(item for item in state["profile"]["stages"] if item["stageId"] == current["stageId"])
        response["externalCueRequired"] = True
        response["allowedExternalCues"] = [{"cueId": item["cueId"], "label": item["label"]} for item in stage["cues"]]
    elif current:
        response["externalCueRequired"] = False
    return response


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    raise CueDrillError("cue_drill_requires_session_bound_action_execution")


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    if not isinstance(result, Mapping):
        return False
    try:
        profile = _profile(contract)
    except CueDrillError:
        return False
    records = result.get("stages")
    reconciliation = result.get("reconciliation")
    terminal = result.get("status")
    if not isinstance(records, list) or not isinstance(reconciliation, Mapping):
        return False
    statuses = ("recorded", "missing", "extra", "ambiguous", "unresolved")
    if any(record.get("reconciliationState") not in statuses or not isinstance(record.get("cue"), Mapping) or not isinstance(record.get("observations"), list) for record in records):
        return False
    observed_count = sum(len(record["observations"]) for record in records)
    if any(reconciliation.get(key) != sum(1 for record in records if record["reconciliationState"] == key) for key in statuses):
        return False
    result_hash = result.get("resultHash")
    canonical = {key: value for key, value in result.items() if key not in {"resultHash", "resultIdentity"}}
    if not isinstance(result_hash, str) or result_hash != digest(canonical_json(canonical)) or result.get("resultIdentity") != f"SCZN3-RESULT-{result_hash[:24].upper()}":
        return False
    seed = result.get("randomization", {}).get("seed", "")
    expected_plan = _base_plan(profile, seed)
    if terminal == "complete" and len(records) != len(expected_plan):
        return False
    if terminal == "stopped_incomplete" and len(records) > len(expected_plan):
        return False
    if profile["cueSelectionMode"] == "seeded_random":
        expected_order = [cue["cueId"] for cue in expected_plan]
        if result.get("randomization", {}).get("generatedCueOrder") != expected_order or result.get("randomization", {}).get("authority") != "backend":
            return False
    elif "randomization" in result:
        return False
    if profile["cueSelectionMode"] != "external_command":
        if [record["cue"].get("cueId") for record in records] != [cue["cueId"] for cue in expected_plan[:len(records)]]:
            return False
        if any(record.get("source") != "sczn3_issued" for record in records):
            return False
    else:
        allowed = {cue["cueId"] for stage in profile["stages"] for cue in stage["cues"]}
        if any(record["cue"].get("cueId") not in allowed or record.get("source") not in {"shooter_declared_external", "instructor_declared_external"} for record in records):
            return False
    identity = result.get("profile", {})
    target = result.get("target", {})
    return bool(
        result.get("ok") is True
        and terminal in TERMINAL_STATES
        and result.get("authoritySource") == "backend-authoritative"
        and result.get("missionFamily") == contract["missionFamily"]
        and result.get("resultPackageType") == contract["resultPackageType"]
        and result.get("resultPackageVersion") == contract["resultPackageVersion"]
        and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"]
        and target.get("id") == contract["targetProfile"]["id"]
        and target.get("product", {}).get("sku") == contract["targetProfile"]["product"]["sku"]
        and identity.get("profileId") == profile["profileId"]
        and identity.get("profileVersion") == profile["profileVersion"]
        and identity.get("componentDigest") == contract["components"]["mission"]["digest"]
        and reconciliation.get("status") == "reconciled"
        and reconciliation.get("cueCount") == len(records)
        and reconciliation.get("observationCount") == observed_count == len(result.get("observations", []))
        and sum(int(reconciliation.get(key, -1)) for key in statuses) == len(records)
        and result.get("timing", {}).get("physicalShotTiming", {}).get("status") == "unavailable"
        and result.get("scoring", {}).get("status") == "not_applicable"
        and result.get("imageEvidence", {}).get("backendHashVerified") is True
        and result.get("run", {}).get("terminalStatus") == terminal
    )
