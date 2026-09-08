"""One governed scoring executor whose behavior is supplied entirely by target data."""
from __future__ import annotations

from collections import Counter, defaultdict
from copy import deepcopy
from typing import Any, Dict, Mapping

from target_execution_contract import canonical_json, digest
from ugo_observation_classifier import classify, coordinate


class DeclarativeTargetScoreError(ValueError):
    pass


SUPPORTED_MODELS = {
    "numeric_regions",
    "named_regions",
    "penalty_regions",
    "ordered_objects",
    "multiple_bulls",
    "not_applicable",
}


def _image(value: Any) -> Dict[str, Any]:
    if not isinstance(value, Mapping):
        raise DeclarativeTargetScoreError("image_evidence_required")
    sha256 = str(value.get("sha256") or "").strip().lower()
    if len(sha256) != 64 or any(character not in "0123456789abcdef" for character in sha256):
        raise DeclarativeTargetScoreError("image_sha256_invalid")
    width, height = value.get("widthPx"), value.get("heightPx")
    if not isinstance(width, int) or width < 1 or not isinstance(height, int) or height < 1:
        raise DeclarativeTargetScoreError("image_dimensions_invalid")
    if not (str(value.get("dataUrl") or "").strip() or str(value.get("mediaId") or "").strip()):
        raise DeclarativeTargetScoreError("admitted_image_reference_required")
    return {"sha256": sha256, "widthPx": width, "heightPx": height, "mediaType": str(value.get("mediaType") or "image/unknown"), "backendHashVerified": True}


def _point(value: Any) -> tuple[float, float]:
    if not isinstance(value, Mapping):
        raise DeclarativeTargetScoreError("observation_invalid")
    return (
        coordinate(value.get("xNorm"), "observation_coordinate_invalid", DeclarativeTargetScoreError),
        coordinate(value.get("yNorm"), "observation_coordinate_invalid", DeclarativeTargetScoreError),
    )


def _aim(value: Any, allowed: bool) -> Dict[str, Any] | None:
    if value is None:
        return None
    if not allowed or not isinstance(value, Mapping):
        raise DeclarativeTargetScoreError("shooter_declared_aim_not_authorized")
    x, y = _point(value)
    return {"xNorm": x, "yNorm": y, "declaredBy": "shooter", "authorityScope": "session_evidence_only"}


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    if not isinstance(evidence, Mapping):
        raise DeclarativeTargetScoreError("evidence_object_required")
    observations = evidence.get("observations")
    if not isinstance(observations, list) or not observations:
        raise DeclarativeTargetScoreError("observations_required")
    mission = contract["components"]["mission"]["definition"]
    if len(observations) > int(mission.get("maxObservations", 500)):
        raise DeclarativeTargetScoreError("observation_limit_exceeded")
    scoring_data = contract["components"]["scoring"]["definition"]
    model = str(scoring_data.get("model") or "")
    if model not in SUPPORTED_MODELS:
        raise DeclarativeTargetScoreError("scoring_model_unsupported")
    geometry = contract["components"]["geometry"]["definition"]
    regions = geometry.get("regions") or []
    rules = scoring_data.get("regionRules") or {}
    if model != "not_applicable" and (not isinstance(regions, list) or not regions or not isinstance(rules, Mapping)):
        raise DeclarativeTargetScoreError("target_scoring_data_incomplete")

    classifications = []
    counts: Counter[str] = Counter()
    group_totals: Dict[str, float] = defaultdict(float)
    total = 0.0
    numeric = model in {"numeric_regions", "penalty_regions"}
    for index, observation in enumerate(observations, start=1):
        x, y = _point(observation)
        classified = classify(regions, x, y, id_key="regionId", shape_reason="geometry_shape_not_supported", error_type=DeclarativeTargetScoreError) if regions else {"classificationStatus": "unmapped", "entityId": None, "matchingEntityIds": []}
        if classified["classificationStatus"] == "ambiguous":
            raise DeclarativeTargetScoreError("geometry_classification_ambiguous")
        region_id = classified["entityId"] or "outside"
        rule = rules.get(region_id, scoring_data.get("outsideRule"))
        if model != "not_applicable" and not isinstance(rule, Mapping):
            raise DeclarativeTargetScoreError("scoring_rule_unavailable")
        label = str((rule or {}).get("label") or region_id)
        value = (rule or {}).get("value")
        if numeric:
            if not isinstance(value, (int, float)) or isinstance(value, bool):
                raise DeclarativeTargetScoreError("numeric_scoring_value_required")
            value = float(value)
            total += value
            group_totals[str(observation.get("groupId") or "all")] += value
        counts[region_id] += 1
        classifications.append({
            "observationId": f"observation-{index:03d}", "xNorm": x, "yNorm": y,
            "regionId": region_id, "label": label, "value": value,
            "objectId": (rule or {}).get("objectId"), "groupId": str(observation.get("groupId") or "all"),
            "classificationStatus": classified["classificationStatus"],
        })

    scoring: Dict[str, Any] = {
        "status": "not_applicable" if model == "not_applicable" else "complete",
        "model": model,
        "completion": "shooter_declared" if evidence.get("shooterDeclaredComplete") is True else "open",
        "observationCount": len(classifications),
        "regionCounts": dict(counts),
        "outsideCount": counts.get("outside", 0),
        "publisherRuleAuthority": deepcopy(scoring_data.get("publisherRuleAuthority")),
    }
    if numeric:
        scoring.update({"total": total, "groupTotals": dict(group_totals)})
    elif model == "ordered_objects":
        observed = [item.get("objectId") for item in classifications]
        expected = list(scoring_data.get("sequence") or [])
        prefix = 0
        for actual, wanted in zip(observed, expected):
            if str(actual) != str(wanted):
                break
            prefix += 1
        scoring.update({"observedSequence": observed, "expectedSequence": expected, "completedInOrder": prefix, "nextExpectedObjectId": expected[prefix] if prefix < len(expected) else None})
    elif model == "not_applicable":
        scoring["reason"] = str(scoring_data.get("reason") or "printer_defines_no_score")

    result = {
        "ok": True, "status": "complete", "authoritySource": "backend-authoritative",
        "missionFamily": contract["missionFamily"], "resultPackageType": contract["resultPackageType"], "resultPackageVersion": contract["resultPackageVersion"],
        "target": deepcopy(contract["targetProfile"]),
        "executionContract": {"contractId": contract["contractId"], "contractVersion": contract["contractVersion"], "contractFingerprint": contract["contractFingerprint"], "executorId": contract["executor"]["id"], "executorVersion": contract["executor"]["version"], "secAdapterFamilyId": contract["secAdapter"]["id"], "secAdapterFamilyVersion": contract["secAdapter"]["version"], "preservationValidatorId": contract["preservationValidator"]["id"], "preservationValidatorVersion": contract["preservationValidator"]["version"]},
        "imageEvidence": _image(evidence.get("imageEvidence")),
        "observations": deepcopy(classifications), "classifications": classifications,
        "shooterDeclaredAimPoint": _aim(evidence.get("shooterDeclaredAimPoint"), bool(mission.get("allowShooterDeclaredAim", True))),
        "scoring": scoring,
        "reconciliation": {"status": "reconciled", "recordedObservationCount": len(classifications), "classifiedObservationCount": len(classifications), "countsMatch": sum(counts.values()) == len(classifications)},
        "authorityTrace": {"targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}", "classificationAuthority": "backend", "scoringAuthority": "printer-rules-through-target-data", "componentDigests": {name: component["digest"] for name, component in contract["components"].items()}},
    }
    result["resultHash"] = digest(canonical_json(result))
    return result


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    scoring = result.get("scoring") if isinstance(result, Mapping) else None
    classifications = result.get("classifications") if isinstance(result, Mapping) else None
    reconciliation = result.get("reconciliation") if isinstance(result, Mapping) else None
    return bool(
        isinstance(result, Mapping) and result.get("ok") is True
        and result.get("authoritySource") == "backend-authoritative"
        and result.get("missionFamily") == contract["missionFamily"]
        and result.get("resultPackageType") == contract["resultPackageType"]
        and result.get("resultPackageVersion") == contract["resultPackageVersion"]
        and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"]
        and isinstance(classifications, list) and len(classifications) >= 1
        and isinstance(scoring, Mapping) and scoring.get("status") in {"complete", "not_applicable"}
        and isinstance(reconciliation, Mapping) and reconciliation.get("status") == "reconciled" and reconciliation.get("countsMatch") is True
        and result.get("imageEvidence", {}).get("backendHashVerified") is True
    )
