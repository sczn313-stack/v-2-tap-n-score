"""Reusable governed precision/open-scoring executor."""
from __future__ import annotations

from collections import defaultdict
from copy import deepcopy
from typing import Any, Dict, Mapping

from target_execution_contract import canonical_json, digest
from ugo_observation_classifier import classify, coordinate


class PrecisionScoreError(ValueError):
    pass


def _point(value: Any) -> tuple[float, float]:
    if not isinstance(value, Mapping):
        raise PrecisionScoreError("observation_invalid")
    return coordinate(value.get("xNorm"), "observation_coordinate_invalid", PrecisionScoreError), coordinate(value.get("yNorm"), "observation_coordinate_invalid", PrecisionScoreError)


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    if not isinstance(evidence, Mapping) or not isinstance(evidence.get("observations"), list) or not evidence["observations"]:
        raise PrecisionScoreError("observations_required")
    geometry = contract["components"]["geometry"]["definition"]
    zones = geometry.get("zones")
    values = contract["components"]["scoring"]["definition"].get("zoneValues")
    if not isinstance(zones, list) or not zones or not isinstance(values, Mapping):
        raise PrecisionScoreError("precision_authority_incomplete")
    classifications = []
    group_totals: Dict[str, float] = defaultdict(float)
    total = 0.0
    for index, observation in enumerate(evidence["observations"], start=1):
        x, y = _point(observation)
        classified = classify(zones, x, y, shape_reason="geometry_shape_not_supported", error_type=PrecisionScoreError)
        if classified["classificationStatus"] == "ambiguous":
            raise PrecisionScoreError("geometry_classification_ambiguous")
        zone_id = classified["entityId"] or "outside"
        if zone_id not in values:
            raise PrecisionScoreError("scoring_value_unavailable")
        score = float(values[zone_id])
        group_id = str(observation.get("groupId") or "all")
        total += score
        group_totals[group_id] += score
        classifications.append({"observationId": f"observation-{index:03d}", "xNorm": x, "yNorm": y, "zoneId": zone_id, "value": score, "groupId": group_id})
    result = {
        "ok": True, "status": "complete", "authoritySource": "backend-authoritative",
        "missionFamily": contract["missionFamily"], "resultPackageType": contract["resultPackageType"], "resultPackageVersion": contract["resultPackageVersion"],
        "target": deepcopy(contract["targetProfile"]),
        "executionContract": {"contractId": contract["contractId"], "contractVersion": contract["contractVersion"], "contractFingerprint": contract["contractFingerprint"], "executorId": contract["executor"]["id"], "executorVersion": contract["executor"]["version"], "secAdapterFamilyId": contract["secAdapter"]["id"], "secAdapterFamilyVersion": contract["secAdapter"]["version"], "preservationValidatorId": contract["preservationValidator"]["id"], "preservationValidatorVersion": contract["preservationValidator"]["version"]},
        "classifications": classifications,
        "scoring": {"status": "complete", "total": total, "groupTotals": dict(group_totals), "completion": "shooter_declared" if evidence.get("shooterDeclaredComplete") is True else "open"},
        "reconciliation": {"status": "reconciled", "recordedObservationCount": len(classifications), "classifiedObservationCount": len(classifications)},
        "authorityTrace": {"targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}", "classificationAuthority": "backend", "scoringAuthority": "backend"},
    }
    result["resultHash"] = digest(canonical_json(result))
    return result


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    return bool(isinstance(result, Mapping) and result.get("authoritySource") == "backend-authoritative" and result.get("resultPackageVersion") == contract["resultPackageVersion"] and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"] and result.get("scoring", {}).get("status") == "complete" and result.get("reconciliation", {}).get("status") == "reconciled")
