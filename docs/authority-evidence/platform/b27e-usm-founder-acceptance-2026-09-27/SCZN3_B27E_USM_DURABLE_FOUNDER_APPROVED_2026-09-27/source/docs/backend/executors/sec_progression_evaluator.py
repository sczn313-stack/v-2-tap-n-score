"""Cross-session evaluator over immutable normalized SEC facts."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from typing import Any, Dict, Mapping, Optional

from stage_event_primitives import sign_result, text


class SECProgressionError(ValueError):
    pass


OUTCOMES = {"advanced", "held", "insufficient_evidence", "ineligible_inputs"}


def profile(contract: Mapping[str, Any]) -> Dict[str, Any]:
    mission = deepcopy(contract["components"]["mission"]["definition"])
    required = ("profileId", "profileVersion", "programId", "programName", "publisherAuthority", "sourceDocuments", "approval", "effective", "lifecycle", "componentBindings", "claimGrade", "subjectContinuity", "inputEligibility", "consumptionPolicy", "startingLevelId", "levels", "capabilityStates")
    if any(field not in mission for field in required):
        raise SECProgressionError("progression_profile_incomplete")
    if mission.get("missionFamily") != "secProgressionEvaluation" or mission.get("resultPackageType") != "secProgressionResult" or text(mission.get("resultPackageVersion")) != "1" or mission.get("claimGrade") != "governed_progression_result":
        raise SECProgressionError("progression_profile_binding_invalid")
    authority, sources = mission["publisherAuthority"], mission["sourceDocuments"]
    if not isinstance(authority, Mapping) or not text(authority.get("id")) or not text(authority.get("name")) or not isinstance(sources, list) or not sources:
        raise SECProgressionError("progression_publisher_authority_incomplete")
    for source in sources:
        sha = text(source.get("sha256")).lower() if isinstance(source, Mapping) else ""
        if not isinstance(source, Mapping) or any(not text(source.get(key)) for key in ("id", "title", "revision", "reference", "effectiveFrom")) or len(sha) != 64 or any(char not in "0123456789abcdef" for char in sha):
            raise SECProgressionError("progression_source_authority_invalid")
    approval, effective, lifecycle = mission["approval"], mission["effective"], mission["lifecycle"]
    if not isinstance(approval, Mapping) or approval.get("status") != "approved" or not text(approval.get("authorityId")) or not isinstance(effective, Mapping) or not text(effective.get("from")) or not isinstance(lifecycle, Mapping) or lifecycle.get("status") != "active" or lifecycle.get("suspended") is not False or lifecycle.get("revoked") is not False or lifecycle.get("supersededBy") is not None:
        raise SECProgressionError("progression_profile_authority_inactive")
    try:
        datetime.fromisoformat(text(effective["from"]).replace("Z", "+00:00"))
    except ValueError as exc:
        raise SECProgressionError("progression_effective_window_invalid") from exc
    bindings, target = mission["componentBindings"], contract["targetProfile"]
    if not isinstance(bindings, Mapping) or bindings.get("targetProfileId") != target["id"] or text(bindings.get("targetProfileVersion")) != text(target["version"]) or bindings.get("registrationDigest") != contract["components"]["registration"]["digest"]:
        raise SECProgressionError("progression_component_binding_invalid")
    if mission["subjectContinuity"] != {"authority": "backend_required", "verifiedRealWorldIdentity": "not_established"}:
        raise SECProgressionError("progression_subject_policy_invalid")
    eligibility = mission["inputEligibility"]
    if not isinstance(eligibility, Mapping) or not text(eligibility.get("factAdapterId")) or not isinstance(eligibility.get("allowedTuples"), list) or not eligibility["allowedTuples"]:
        raise SECProgressionError("progression_input_eligibility_invalid")
    from progression_input_facts import FACT_ADAPTERS
    if eligibility["factAdapterId"] not in FACT_ADAPTERS:
        raise SECProgressionError("progression_fact_adapter_unavailable")
    if mission["consumptionPolicy"] != "single_use_within_profile_lineage":
        raise SECProgressionError("progression_consumption_policy_invalid")
    levels = mission["levels"]
    if not isinstance(levels, list) or len(levels) < 2:
        raise SECProgressionError("progression_levels_required")
    ids, orders = set(), []
    for level in levels:
        condition = level.get("advanceCondition") if isinstance(level, Mapping) else None
        if not isinstance(level, Mapping) or not text(level.get("levelId")) or not text(level.get("label")) or not isinstance(level.get("order"), int):
            raise SECProgressionError("progression_level_invalid")
        if level["levelId"] in ids:
            raise SECProgressionError("progression_level_duplicate")
        ids.add(level["levelId"]); orders.append(level["order"])
        if condition is not None and (not isinstance(condition, Mapping) or condition.get("factId") != eligibility["factAdapterId"] or condition.get("comparator") not in {"equal", "greater_than_or_equal", "less_than_or_equal"} or condition.get("aggregation") not in {"all_selected", "count_meeting_condition"} or not isinstance(condition.get("requiredSECCount"), int) or condition["requiredSECCount"] < 1 or not isinstance(condition.get("maximumLevelAdvance"), int) or condition["maximumLevelAdvance"] != 1):
            raise SECProgressionError("progression_level_condition_invalid")
    if len(orders) != len(set(orders)) or mission["startingLevelId"] not in ids or max(orders) - min(orders) != len(orders) - 1:
        raise SECProgressionError("progression_level_order_invalid")
    return mission


def _compare(value: Any, comparator: str, threshold: Any) -> bool:
    if comparator == "equal":
        return value == threshold
    if not isinstance(value, (int, float)) or not isinstance(threshold, (int, float)):
        return False
    return value >= threshold if comparator == "greater_than_or_equal" else value <= threshold


def evaluate(contract: Mapping[str, Any], subject_id: str, inputs: list[Mapping[str, Any]], prior: Optional[Mapping[str, Any]], consumed_ids: set[str], evaluation_id: str, evaluated_at: str) -> Dict[str, Any]:
    mission = profile(contract)
    levels = sorted(mission["levels"], key=lambda item: item["order"])
    prior_level = prior.get("resultingLevel", {}).get("levelId") if isinstance(prior, Mapping) else mission["startingLevelId"]
    level_index = next((index for index, item in enumerate(levels) if item["levelId"] == prior_level), None)
    if level_index is None:
        raise SECProgressionError("progression_prior_level_invalid")
    eligible, rejected = [], []
    allowed = {(item["missionFamily"], item["resultPackageType"], str(item["resultPackageVersion"])) for item in mission["inputEligibility"]["allowedTuples"]}
    seen = set()
    for item in inputs:
        session_id = text(item.get("sessionId"))
        reason = None
        if not session_id or session_id in seen:
            reason = "duplicate_source_sec"
        elif session_id in consumed_ids:
            reason = "source_sec_already_consumed"
        elif item.get("status") != "eligible" or item.get("factId") != mission["inputEligibility"]["factAdapterId"]:
            reason = item.get("reason") or "source_sec_ineligible"
        elif (item.get("missionFamily"), item.get("resultPackageType"), str(item.get("resultPackageVersion"))) not in allowed:
            reason = "source_family_tuple_ineligible"
        seen.add(session_id)
        (rejected if reason else eligible).append({**deepcopy(dict(item)), **({"reason": reason, "status": "ineligible"} if reason else {})})
    eligible.sort(key=lambda item: (item["preservedAt"], item["artifactSha256"], item["sessionId"]))
    current, next_level = levels[level_index], levels[level_index + 1] if level_index + 1 < len(levels) else None
    outcome, resulting = "held", current
    reasons = []
    if not eligible:
        outcome = "ineligible_inputs" if rejected else "insufficient_evidence"; reasons.append("no_new_eligible_secs")
    elif next_level is None:
        reasons.append("highest_level_already_reached")
    else:
        condition = next_level.get("advanceCondition")
        qualifying = [item for item in eligible if _compare(item["factValue"], condition["comparator"], condition["threshold"])]
        enough = len(eligible) >= condition["requiredSECCount"]
        satisfied = (enough and len(qualifying) == len(eligible)) if condition["aggregation"] == "all_selected" else len(qualifying) >= condition["requiredSECCount"]
        if satisfied:
            outcome, resulting = "advanced", next_level; reasons.append("profile_condition_satisfied")
        elif not enough:
            outcome = "insufficient_evidence"; reasons.append("required_sec_count_not_met")
        else:
            outcome = "held"; reasons.append("profile_condition_not_satisfied")
    result = {
        "ok": True, "status": "complete", "authoritySource": "backend-authoritative", "progressionEvaluationId": evaluation_id, "evaluatedAt": evaluated_at,
        "missionFamily": contract["missionFamily"], "resultPackageType": contract["resultPackageType"], "resultPackageVersion": contract["resultPackageVersion"], "target": deepcopy(contract["targetProfile"]),
        "executionContract": {"contractId": contract["contractId"], "contractVersion": contract["contractVersion"], "contractFingerprint": contract["contractFingerprint"], "executorId": contract["executor"]["id"], "executorVersion": contract["executor"]["version"], "secAdapterFamilyId": contract["secAdapter"]["id"], "secAdapterFamilyVersion": contract["secAdapter"]["version"], "preservationValidatorId": contract["preservationValidator"]["id"], "preservationValidatorVersion": contract["preservationValidator"]["version"]},
        "profile": {"profileId": mission["profileId"], "profileVersion": mission["profileVersion"], "programId": mission["programId"], "programName": mission["programName"], "componentDigest": contract["components"]["mission"]["digest"], "publisherAuthority": deepcopy(mission["publisherAuthority"]), "sourceDocuments": deepcopy(mission["sourceDocuments"]), "componentBindings": deepcopy(mission["componentBindings"])},
        "subject": {"progressionSubjectId": subject_id, "authority": "backend", "verifiedRealWorldIdentity": "not_established"},
        "priorProgressionRecord": {"progressionEvaluationId": prior.get("progressionEvaluationId"), "resultHash": prior.get("resultHash")} if prior else None,
        "priorLevel": {"levelId": current["levelId"], "label": current["label"]}, "resultingLevel": {"levelId": resulting["levelId"], "label": resulting["label"]},
        "transition": {"outcome": outcome, "reasonCodes": reasons, "maximumLevelAdvance": 1},
        "sourceSECs": {"eligible": eligible, "ineligible": rejected, "newlyConsumedSessionIds": [item["sessionId"] for item in eligible], "consumptionPolicy": mission["consumptionPolicy"]},
        "claim": {"claimGrade": "governed_progression_result", "displayLabel": "Governed Progression Result — Derived from Preserved SECs", "skillStatus": "not_established", "readinessStatus": "not_established", "certificationStatus": "not_established", "officialQualificationStatus": "not_established", "verifiedIdentityStatus": "not_established"},
        "capabilityStates": deepcopy(mission["capabilityStates"]),
        "authorityTrace": {"targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}", "resultAuthority": "backend", "sourceSECLoadingAuthority": "backend", "componentDigests": {name: component["digest"] for name, component in contract["components"].items()}},
    }
    return sign_result(result)


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    raise SECProgressionError("cross_session_progression_route_required")


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    if not isinstance(result, Mapping):
        return False
    try:
        mission = profile(contract)
    except SECProgressionError:
        return False
    from target_execution_contract import canonical_json, digest
    claimed = result.get("resultHash")
    canonical = {key: value for key, value in result.items() if key not in {"resultHash", "resultIdentity"}}
    source = result.get("sourceSECs", {})
    all_items = source.get("eligible", []) + source.get("ineligible", []) if isinstance(source, Mapping) else []
    identities = [item.get("sessionId") for item in all_items if isinstance(item, Mapping)]
    claim = result.get("claim", {})
    return bool(
        isinstance(claimed, str) and claimed == digest(canonical_json(canonical)) and result.get("resultIdentity") == f"SCZN3-RESULT-{claimed[:24].upper()}"
        and result.get("ok") is True and result.get("status") == "complete" and result.get("authoritySource") == "backend-authoritative"
        and result.get("missionFamily") == contract["missionFamily"] and result.get("resultPackageType") == contract["resultPackageType"] and result.get("resultPackageVersion") == contract["resultPackageVersion"]
        and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"] and result.get("target") == contract["targetProfile"]
        and result.get("profile", {}).get("profileId") == mission["profileId"] and result.get("profile", {}).get("profileVersion") == mission["profileVersion"] and result.get("profile", {}).get("componentDigest") == contract["components"]["mission"]["digest"]
        and result.get("subject", {}).get("authority") == "backend" and result.get("subject", {}).get("verifiedRealWorldIdentity") == "not_established"
        and result.get("transition", {}).get("outcome") in OUTCOMES and result.get("transition", {}).get("maximumLevelAdvance") == 1
        and isinstance(source.get("eligible"), list) and isinstance(source.get("ineligible"), list) and len(identities) == len(set(identities))
        and source.get("newlyConsumedSessionIds") == [item["sessionId"] for item in source["eligible"]] and source.get("consumptionPolicy") == "single_use_within_profile_lineage"
        and claim == {"claimGrade": "governed_progression_result", "displayLabel": "Governed Progression Result — Derived from Preserved SECs", "skillStatus": "not_established", "readinessStatus": "not_established", "certificationStatus": "not_established", "officialQualificationStatus": "not_established", "verifiedIdentityStatus": "not_established"}
        and result.get("authorityTrace", {}).get("componentDigests") == {name: component["digest"] for name, component in contract["components"].items()}
    )
