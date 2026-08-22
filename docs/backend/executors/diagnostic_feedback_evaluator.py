"""Exact publisher-region label matching without SCZN3 causal diagnosis."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, Mapping

from stage_event_primitives import admitted_image, sign_result, text
from target_execution_contract import canonical_json, digest
from ugo_observation_classifier import classify, coordinate


class DiagnosticFeedbackError(ValueError):
    pass


def _profile(contract: Mapping[str, Any]) -> Dict[str, Any]:
    profile = deepcopy(contract["components"]["mission"]["definition"])
    required = ("profileId", "profileVersion", "publisherAuthority", "sourceDocuments", "approval", "effective", "lifecycle", "componentBindings", "claimGrade", "applicability", "evaluationPolicy", "regionLabelMap", "capabilityStates")
    if any(field not in profile for field in required):
        raise DiagnosticFeedbackError("diagnostic_profile_incomplete")
    if profile.get("missionFamily") != "diagnosticFeedbackEvaluation" or profile.get("resultPackageType") != "diagnosticFeedbackResult" or text(profile.get("resultPackageVersion")) != "1":
        raise DiagnosticFeedbackError("diagnostic_profile_binding_invalid")
    authority = profile["publisherAuthority"]
    if not isinstance(authority, Mapping) or not text(authority.get("id")) or not text(authority.get("name")):
        raise DiagnosticFeedbackError("diagnostic_publisher_authority_invalid")
    sources = profile["sourceDocuments"]
    if not isinstance(sources, list) or not sources:
        raise DiagnosticFeedbackError("diagnostic_source_authority_required")
    for source in sources:
        source_hash = text(source.get("sha256")).lower() if isinstance(source, Mapping) else ""
        if not isinstance(source, Mapping) or any(not text(source.get(key)) for key in ("id", "title", "revision", "reference", "effectiveFrom")) or len(source_hash) != 64 or any(character not in "0123456789abcdef" for character in source_hash):
            raise DiagnosticFeedbackError("diagnostic_source_authority_invalid")
    approval, effective, lifecycle = profile["approval"], profile["effective"], profile["lifecycle"]
    if not isinstance(approval, Mapping) or approval.get("status") != "approved" or not text(approval.get("authorityId")) or not isinstance(effective, Mapping) or not text(effective.get("from")) or not isinstance(lifecycle, Mapping) or lifecycle.get("status") != "active" or lifecycle.get("suspended") is not False or lifecycle.get("revoked") is not False or lifecycle.get("supersededBy") is not None:
        raise DiagnosticFeedbackError("diagnostic_profile_authority_inactive")
    try:
        starts = datetime.fromisoformat(text(effective["from"]).replace("Z", "+00:00"))
        ends = datetime.fromisoformat(text(effective.get("until")).replace("Z", "+00:00")) if effective.get("until") else None
    except ValueError as exc:
        raise DiagnosticFeedbackError("diagnostic_effective_window_invalid") from exc
    now = datetime.now(timezone.utc)
    if now < starts.astimezone(timezone.utc) or (ends and now >= ends.astimezone(timezone.utc)):
        raise DiagnosticFeedbackError("diagnostic_profile_not_effective")
    bindings = profile["componentBindings"]
    target = contract["targetProfile"]
    if not isinstance(bindings, Mapping) or bindings.get("targetProfileId") != target["id"] or text(bindings.get("targetProfileVersion")) != text(target["version"]) or bindings.get("registrationDigest") != contract["components"]["registration"]["digest"] or bindings.get("geometryDigest") != contract["components"]["geometry"]["digest"]:
        raise DiagnosticFeedbackError("diagnostic_component_binding_invalid")
    if profile["claimGrade"] != "publisher_label_match" or profile["evaluationPolicy"] != {"mode": "per_observation_region_match", "summary": "count_by_label", "dominantLabel": "unavailable"}:
        raise DiagnosticFeedbackError("diagnostic_claim_policy_invalid")
    applicability = profile["applicability"]
    if not isinstance(applicability, Mapping) or applicability.get("handedness") not in {"left", "right", "ambidextrous", "not_applicable"} or applicability.get("orientation") != "registered_publisher_orientation" or applicability.get("allowRotation") is not False or applicability.get("allowMirroring") is not False or not isinstance(applicability.get("declarationRequired"), bool):
        raise DiagnosticFeedbackError("diagnostic_applicability_invalid")
    geometry = contract["components"]["geometry"]["definition"]
    regions = geometry.get("regions")
    if not isinstance(regions, list) or not regions:
        raise DiagnosticFeedbackError("diagnostic_geometry_required")
    region_ids = {text(region.get("regionId")) for region in regions if isinstance(region, Mapping)}
    mappings = profile["regionLabelMap"]
    if not isinstance(mappings, list) or not mappings:
        raise DiagnosticFeedbackError("diagnostic_label_map_required")
    seen_regions, seen_labels = set(), set()
    for item in mappings:
        label_hash = text(item.get("sourceSha256")).lower() if isinstance(item, Mapping) else ""
        if not isinstance(item, Mapping) or item.get("statementType") != "publisher_region_label" or item.get("geometryEntityId") not in region_ids or any(not text(item.get(key)) for key in ("diagnosticRegionId", "geometryEntityId", "publisherLabelId", "displayLabel", "sourceReference")) or len(label_hash) != 64 or any(character not in "0123456789abcdef" for character in label_hash):
            raise DiagnosticFeedbackError("diagnostic_label_map_invalid")
        if item["geometryEntityId"] in seen_regions or item["publisherLabelId"] in seen_labels:
            raise DiagnosticFeedbackError("diagnostic_label_map_conflict")
        seen_regions.add(item["geometryEntityId"]); seen_labels.add(item["publisherLabelId"])
    scoring = contract["components"]["scoring"]["definition"]
    if scoring.get("status") != "not_applicable":
        raise DiagnosticFeedbackError("diagnostic_scoring_must_be_not_applicable")
    return profile


def _evaluate(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    profile = _profile(contract)
    if not isinstance(evidence, Mapping) or not isinstance(evidence.get("observations"), list) or not evidence["observations"]:
        raise DiagnosticFeedbackError("diagnostic_observations_required")
    image = admitted_image(evidence.get("imageEvidence"), "registered_diagnostic_label_evidence", DiagnosticFeedbackError)
    applicability = profile["applicability"]
    declared = text(evidence.get("declaredHandedness")) or "not_applicable"
    if applicability["declarationRequired"] and declared != applicability["handedness"]:
        raise DiagnosticFeedbackError("diagnostic_handedness_mismatch")
    if text(evidence.get("declaredOrientation")) not in {"", "registered_publisher_orientation"}:
        raise DiagnosticFeedbackError("diagnostic_orientation_mismatch")
    regions = contract["components"]["geometry"]["definition"]["regions"]
    labels = {item["geometryEntityId"]: item for item in profile["regionLabelMap"]}
    classifications, label_counts = [], {}
    for index, observation in enumerate(evidence["observations"], start=1):
        if not isinstance(observation, Mapping):
            raise DiagnosticFeedbackError("diagnostic_observation_invalid")
        x = coordinate(observation.get("xNorm"), "diagnostic_observation_coordinate_invalid", DiagnosticFeedbackError)
        y = coordinate(observation.get("yNorm"), "diagnostic_observation_coordinate_invalid", DiagnosticFeedbackError)
        classified = classify(regions, x, y, id_key="regionId", shape_reason="diagnostic_geometry_shape_not_supported", error_type=DiagnosticFeedbackError)
        label = labels.get(classified["entityId"])
        state = "exact_region_match" if label else ("ambiguous" if classified["classificationStatus"] == "ambiguous" else "unmapped")
        entry = {"observationId": f"observation-{index:03d}", "xNorm": x, "yNorm": y, "classificationState": state, "geometryEntityId": classified["entityId"], "matchingEntityIds": classified["matchingEntityIds"], "publisherLabel": deepcopy(label) if label else None, "evidenceMeaning": "publisher_label_associated_with_observed_evidence" if label else "no_publisher_label_established"}
        classifications.append(entry)
        if label:
            label_counts[label["publisherLabelId"]] = label_counts.get(label["publisherLabelId"], 0) + 1
    counts = {"matched": sum(item["publisherLabel"] is not None for item in classifications), "unmapped": sum(item["classificationState"] == "unmapped" for item in classifications), "ambiguous": sum(item["classificationState"] == "ambiguous" for item in classifications), "rejected": 0}
    return {"profile": profile, "image": image, "classifications": classifications, "labelCounts": label_counts, "counts": counts, "declared": declared}


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    evaluated = _evaluate(contract, evidence)
    profile = evaluated["profile"]
    return sign_result({
        "ok": True, "status": "complete", "authoritySource": "backend-authoritative",
        "missionFamily": contract["missionFamily"], "resultPackageType": contract["resultPackageType"], "resultPackageVersion": contract["resultPackageVersion"],
        "target": deepcopy(contract["targetProfile"]),
        "executionContract": {"contractId": contract["contractId"], "contractVersion": contract["contractVersion"], "contractFingerprint": contract["contractFingerprint"], "executorId": contract["executor"]["id"], "executorVersion": contract["executor"]["version"], "secAdapterFamilyId": contract["secAdapter"]["id"], "secAdapterFamilyVersion": contract["secAdapter"]["version"], "preservationValidatorId": contract["preservationValidator"]["id"], "preservationValidatorVersion": contract["preservationValidator"]["version"]},
        "profile": {"profileId": profile["profileId"], "profileVersion": profile["profileVersion"], "componentDigest": contract["components"]["mission"]["digest"], "publisherAuthority": deepcopy(profile["publisherAuthority"]), "sourceDocuments": deepcopy(profile["sourceDocuments"]), "componentBindings": deepcopy(profile["componentBindings"])},
        "imageEvidence": evaluated["image"], "declaredApplicability": {"handedness": evaluated["declared"], "orientation": "registered_publisher_orientation", "matched": True},
        "classifications": evaluated["classifications"], "observations": deepcopy(evaluated["classifications"]),
        "labelSummary": {"mode": "count_by_label", "counts": evaluated["labelCounts"], "dominantLabel": {"status": "unavailable"}},
        "reconciliation": {"status": "reconciled", "observationCount": len(evaluated["classifications"]), **evaluated["counts"]},
        "claim": {"claimGrade": "publisher_label_match", "displayLabel": "Publisher Label Match — Not an SCZN3 Diagnosis", "causalDiagnosisStatus": "not_established", "correctionStatus": "not_provided"},
        "scoring": {"status": "not_applicable", "reason": "publisher_label_match_is_not_scoring"}, "capabilityStates": deepcopy(profile["capabilityStates"]),
        "authorityTrace": {"targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}", "resultAuthority": "backend", "classificationAuthority": "ugo", "labelAuthority": profile["publisherAuthority"]["id"], "componentDigests": {name: component["digest"] for name, component in contract["components"].items()}},
    })


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    if not isinstance(result, Mapping):
        return False
    result_hash = result.get("resultHash")
    canonical = {key: value for key, value in result.items() if key not in {"resultHash", "resultIdentity"}}
    if not isinstance(result_hash, str) or result_hash != digest(canonical_json(canonical)) or result.get("resultIdentity") != f"SCZN3-RESULT-{result_hash[:24].upper()}":
        return False
    try:
        validation_image = deepcopy(result.get("imageEvidence"))
        if isinstance(validation_image, dict):
            validation_image["mediaId"] = "preserved-result-validation"
        expected = _evaluate(contract, {"imageEvidence": validation_image, "observations": result.get("classifications"), "declaredHandedness": result.get("declaredApplicability", {}).get("handedness"), "declaredOrientation": result.get("declaredApplicability", {}).get("orientation")})
    except DiagnosticFeedbackError:
        return False
    profile = expected["profile"]
    expected_profile = {"profileId": profile["profileId"], "profileVersion": profile["profileVersion"], "componentDigest": contract["components"]["mission"]["digest"], "publisherAuthority": profile["publisherAuthority"], "sourceDocuments": profile["sourceDocuments"], "componentBindings": profile["componentBindings"]}
    return bool(result.get("ok") is True and result.get("status") == "complete" and result.get("authoritySource") == "backend-authoritative" and result.get("missionFamily") == contract["missionFamily"] and result.get("resultPackageType") == contract["resultPackageType"] and result.get("resultPackageVersion") == contract["resultPackageVersion"] and result.get("target") == contract["targetProfile"] and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"] and result.get("profile") == expected_profile and result.get("imageEvidence", {}).get("backendHashVerified") is True and result.get("imageEvidence", {}).get("acceptanceScope") == "registered_diagnostic_label_evidence" and result.get("classifications") == expected["classifications"] and result.get("observations") == expected["classifications"] and result.get("labelSummary") == {"mode": "count_by_label", "counts": expected["labelCounts"], "dominantLabel": {"status": "unavailable"}} and result.get("reconciliation") == {"status": "reconciled", "observationCount": len(expected["classifications"]), **expected["counts"]} and result.get("claim") == {"claimGrade": "publisher_label_match", "displayLabel": "Publisher Label Match — Not an SCZN3 Diagnosis", "causalDiagnosisStatus": "not_established", "correctionStatus": "not_provided"} and result.get("scoring") == {"status": "not_applicable", "reason": "publisher_label_match_is_not_scoring"} and result.get("authorityTrace", {}).get("componentDigests") == {name: component["digest"] for name, component in contract["components"].items()})
