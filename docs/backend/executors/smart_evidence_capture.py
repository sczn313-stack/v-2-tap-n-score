"""Reusable backend-owned smart-evidence capability executor."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, Mapping

from target_execution_contract import canonical_json, digest
from shot_pattern_metrics import derive_shot_pattern


class SmartEvidenceError(ValueError):
    pass


def _coordinate(value: Any, reason: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise SmartEvidenceError(reason) from exc
    if number < 0 or number > 1:
        raise SmartEvidenceError(reason)
    return number


def _image(value: Any) -> Dict[str, Any]:
    if not isinstance(value, Mapping):
        raise SmartEvidenceError("image_evidence_required")
    sha256 = str(value.get("sha256") or "").strip().lower()
    if len(sha256) != 64 or any(character not in "0123456789abcdef" for character in sha256):
        raise SmartEvidenceError("image_sha256_invalid")
    width = value.get("widthPx")
    height = value.get("heightPx")
    if not isinstance(width, int) or width < 1 or not isinstance(height, int) or height < 1:
        raise SmartEvidenceError("image_dimensions_invalid")
    if not (str(value.get("dataUrl") or "").strip() or str(value.get("mediaId") or "").strip()):
        raise SmartEvidenceError("admitted_image_reference_required")
    return {
        "sha256": sha256,
        "widthPx": width,
        "heightPx": height,
        "mediaType": str(value.get("mediaType") or "image/unknown"),
        "backendHashVerified": True,
        "acceptanceScope": "registered_session_photo_evidence",
    }


def _canonical_target_coordinate(value: Mapping[str, Any], contract: Mapping[str, Any], image: Mapping[str, Any], x: float, y: float) -> Dict[str, Any]:
    geometry = contract["components"]["geometry"]["definition"]
    coordinate_system = str(geometry.get("coordinateSystem") or "normalized_source_image_top_left")
    if coordinate_system != "normalized_source_image_top_left":
        raise SmartEvidenceError("ugo_coordinate_system_unsupported")
    supplied = value.get("canonicalTargetCoordinate")
    if supplied is not None:
        if not isinstance(supplied, Mapping):
            raise SmartEvidenceError("ugo_canonical_coordinate_invalid")
        if str(supplied.get("schemaVersion") or "") != "sczn3.ugo.normalized-source-image-point.v1":
            raise SmartEvidenceError("ugo_canonical_coordinate_schema_invalid")
        if str(supplied.get("coordinateSystem") or "") != coordinate_system:
            raise SmartEvidenceError("ugo_canonical_coordinate_system_mismatch")
        if str(supplied.get("targetProfileId") or "") != str(contract["targetProfile"]["id"]):
            raise SmartEvidenceError("ugo_canonical_target_identity_mismatch")
        if str(supplied.get("sourceImageSha256") or "").lower() != str(image["sha256"]).lower():
            raise SmartEvidenceError("ugo_canonical_source_image_mismatch")
        if int(supplied.get("sourceImageWidthPx") or 0) != int(image["widthPx"]) or int(supplied.get("sourceImageHeightPx") or 0) != int(image["heightPx"]):
            raise SmartEvidenceError("ugo_canonical_source_dimensions_mismatch")
        if float(supplied.get("xNorm")) != x or float(supplied.get("yNorm")) != y:
            raise SmartEvidenceError("ugo_canonical_coordinate_value_mismatch")
        return deepcopy(dict(supplied))
    return {
        "schemaVersion": "sczn3.ugo.normalized-source-image-point.v1",
        "coordinateSystem": coordinate_system,
        "targetProfileId": str(contract["targetProfile"]["id"]),
        "sourceImageSha256": str(image["sha256"]).lower(),
        "sourceImageWidthPx": int(image["widthPx"]),
        "sourceImageHeightPx": int(image["heightPx"]),
        "xNorm": x,
        "yNorm": y,
    }


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    if not isinstance(evidence, Mapping):
        raise SmartEvidenceError("evidence_object_required")
    image = _image(evidence.get("imageEvidence"))
    observations = evidence.get("observations")
    if not isinstance(observations, list) or not observations:
        raise SmartEvidenceError("shot_observations_required")
    limit = int(contract["components"]["mission"]["definition"].get("maxObservations", 500))
    if len(observations) > limit:
        raise SmartEvidenceError("shot_observation_limit_exceeded")
    exact = contract["components"]["mission"]["definition"].get("exactObservations")
    if exact is not None and (not isinstance(exact, int) or exact < 1 or len(observations) != exact):
        raise SmartEvidenceError("exact_shot_observation_count_required")
    normalized = []
    for index, observation in enumerate(observations, start=1):
        if not isinstance(observation, Mapping):
            raise SmartEvidenceError("shot_observation_invalid")
        x = _coordinate(observation.get("xNorm"), "shot_observation_x_out_of_bounds")
        y = _coordinate(observation.get("yNorm"), "shot_observation_y_out_of_bounds")
        normalized.append({
            "observationId": f"observation-{index:03d}",
            "xNorm": x,
            "yNorm": y,
            "canonicalTargetCoordinate": _canonical_target_coordinate(observation, contract, image, x, y),
            "evidenceMeaning": "shooter_recorded_visible_shot_observation",
        })
    declared = evidence.get("shooterDeclaredAimPoint")
    aim = None
    if declared is not None:
        if not contract["components"]["mission"]["definition"].get("allowShooterDeclaredAim", False):
            raise SmartEvidenceError("shooter_declared_aim_not_authorized")
        if not isinstance(declared, Mapping):
            raise SmartEvidenceError("shooter_declared_aim_invalid")
        aim = {
            "xNorm": _coordinate(declared.get("xNorm"), "shooter_declared_aim_x_out_of_bounds"),
            "yNorm": _coordinate(declared.get("yNorm"), "shooter_declared_aim_y_out_of_bounds"),
            "declaredBy": "shooter",
            "evidenceMeaning": "shooter_declared_aim_point",
            "authorityScope": "session_evidence_only",
        }
    scoring = contract["components"]["scoring"]["definition"]
    if scoring.get("status") != "not_applicable":
        raise SmartEvidenceError("evidence_executor_requires_not_applicable_scoring")
    geometry = contract["components"]["geometry"]["definition"]
    result = {
        "ok": True,
        "status": "supported_analysis_ready",
        "authoritySource": "backend-authoritative",
        "missionFamily": contract["missionFamily"],
        "resultPackageType": contract["resultPackageType"],
        "resultPackageVersion": contract["resultPackageVersion"],
        "target": deepcopy(contract["targetProfile"]),
        "smartTargetTreatment": deepcopy(contract["components"]["mission"]["definition"].get("smartTargetTreatment")),
        "executionContract": {
            "contractId": contract["contractId"],
            "contractVersion": contract["contractVersion"],
            "contractFingerprint": contract["contractFingerprint"],
            "executorId": contract["executor"]["id"],
            "executorVersion": contract["executor"]["version"],
            "secAdapterFamilyId": contract["secAdapter"]["id"],
            "secAdapterFamilyVersion": contract["secAdapter"]["version"],
            "preservationValidatorId": contract["preservationValidator"]["id"],
            "preservationValidatorVersion": contract["preservationValidator"]["version"],
        },
        "imageEvidence": image,
        "observations": normalized,
        "impacts": deepcopy(normalized),
        "shooterDeclaredAimPoint": aim,
        "supportedAnalysis": {"impactCount": len(normalized)},
        "sczn3Metrics": {
            "status": "complete",
            "metricAuthority": "sczn3_measured_supplemental",
            "doesNotReplacePublisherResult": True,
            "shotPattern": None if str(contract.get("targetProfile", {}).get("id") or "").startswith("qt_printer13_product_") else derive_shot_pattern(normalized, aim),
        },
        "reconciliation": {
            "capturedObservationCount": len(normalized),
            "acceptedObservationCount": len(normalized),
            "countsMatch": True,
        },
        "ugo": {
            "status": geometry.get("status", "image_plane_evidence_only"),
            "coordinateSystem": geometry.get("coordinateSystem", "normalized_source_image_top_left"),
            "canonicalRegionMapping": geometry.get("canonicalRegionMapping", "unavailable"),
            "semanticClassification": geometry.get("semanticClassification", "unavailable"),
            "physicalMeasurement": geometry.get("physicalMeasurement", "unavailable"),
        },
        "scoring": {"status": "not_applicable", "reason": scoring.get("reason", "evidence_only_experience")},
        "capabilityStates": deepcopy(contract["components"]["mission"]["definition"].get("capabilityStates", {})),
        "authorityTrace": {
            "targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}",
            "resultAuthority": "backend",
            "componentDigests": {name: component["digest"] for name, component in contract["components"].items()},
        },
    }
    result["resultHash"] = digest(canonical_json(result))
    result["resultIdentity"] = f"SCZN3-RESULT-{result['resultHash'][:24].upper()}"
    return result


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    if not isinstance(result, Mapping):
        return False
    observations = result.get("observations")
    reconciliation = result.get("reconciliation")
    return bool(
        result.get("ok") is True
        and result.get("authoritySource") == "backend-authoritative"
        and result.get("missionFamily") == contract["missionFamily"]
        and result.get("resultPackageType") == contract["resultPackageType"]
        and result.get("resultPackageVersion") == contract["resultPackageVersion"]
        and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"]
        and isinstance(observations, list) and len(observations) >= 1
        and isinstance(reconciliation, Mapping)
        and reconciliation.get("countsMatch") is True
        and reconciliation.get("capturedObservationCount") == len(observations)
        and reconciliation.get("acceptedObservationCount") == len(observations)
        and result.get("scoring", {}).get("status") == "not_applicable"
        and result.get("imageEvidence", {}).get("backendHashVerified") is True
    )
