"""Backend authority for the Founder-approved GunFun Vital Dude evidence proof.

This owner validates shooter-declared image-plane evidence. It deliberately does
not classify printed features, calculate geometry, score, correct, or infer the
meaning of any part of the publisher product.
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import json
import re
from pathlib import Path
from typing import Any, Dict, Mapping


ROOT = Path(__file__).resolve().parents[1]
PROFILE_PATH = ROOT / "backend" / "target_profiles" / "ATP_GUNFUN_22740_VITAL_DUDE_EVIDENCE_V1.json"
SHA256_PATTERN = re.compile(r"^[a-f0-9]{64}$")
DATA_URL_PATTERN = re.compile(r"^data:(image/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$")
MAX_IMAGE_BYTES = 25 * 1024 * 1024
MAX_OBSERVATIONS = 250


class VitalDudeEvidenceError(ValueError):
    def __init__(self, reason: str, status: str = "invalid_evidence"):
        super().__init__(reason)
        self.reason = reason
        self.payload = {"ok": False, "status": status, "reason": reason}


def _profile() -> Dict[str, Any]:
    try:
        profile = json.loads(PROFILE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise VitalDudeEvidenceError("vital_dude_profile_unavailable", "configuration_error") from exc
    expected = {
        "status": "founder_approved",
        "atpId": "ATP_GUNFUN_22740_VITAL_DUDE_EVIDENCE_V1",
        "targetProfileId": "gunfun_22740_vital_dude",
        "targetProfileVersion": "1",
        "smartTargetId": "GUNFUN_22740_VITAL_DUDE",
        "variantId": "GUNFUN_22740_VITAL_DUDE_23X35",
        "missionId": "GUNFUN_22740_EVIDENCE_CAPTURE_V1",
        "missionFamily": "smartEvidenceCapture",
        "resultPackageType": "smartEvidenceResult",
    }
    if any(str(profile.get(key)) != value for key, value in expected.items()):
        raise VitalDudeEvidenceError("vital_dude_profile_identity_invalid", "configuration_error")
    if profile.get("scoringAuthority") != "not_applicable" or profile.get("canonicalRegionAuthority") != "unavailable":
        raise VitalDudeEvidenceError("vital_dude_profile_capability_boundary_invalid", "configuration_error")
    return profile


def _positive_integer(value: Any, reason: str) -> int:
    if isinstance(value, bool):
        raise VitalDudeEvidenceError(reason)
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise VitalDudeEvidenceError(reason) from exc
    if parsed <= 0:
        raise VitalDudeEvidenceError(reason)
    return parsed


def _coordinate(value: Any, reason: str) -> float:
    if isinstance(value, bool):
        raise VitalDudeEvidenceError(reason)
    try:
        parsed = float(value)
    except (TypeError, ValueError) as exc:
        raise VitalDudeEvidenceError(reason) from exc
    if parsed < 0 or parsed > 1:
        raise VitalDudeEvidenceError(reason)
    return round(parsed, 8)


def _verified_image(image: Mapping[str, Any], claimed_hash: str) -> Dict[str, Any]:
    data_url = str(image.get("dataUrl") or "")
    match = DATA_URL_PATTERN.fullmatch(data_url)
    if not match:
        raise VitalDudeEvidenceError("image_data_url_invalid")
    try:
        image_bytes = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError) as exc:
        raise VitalDudeEvidenceError("image_data_base64_invalid") from exc
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise VitalDudeEvidenceError("image_data_size_invalid")
    actual_hash = hashlib.sha256(image_bytes).hexdigest()
    if actual_hash != claimed_hash:
        raise VitalDudeEvidenceError("image_sha256_mismatch")
    return {"sha256": actual_hash, "mediaType": match.group(1), "byteLength": len(image_bytes)}


def analyze_vital_dude_evidence(payload: Any) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise VitalDudeEvidenceError("payload_must_be_an_object", "invalid_request")
    profile = _profile()
    identity_fields = {
        "targetProfileId": profile["targetProfileId"],
        "targetProfileVersion": profile["targetProfileVersion"],
        "targetId": profile["smartTargetId"],
        "variantId": profile["variantId"],
        "missionId": profile["missionId"],
    }
    for key, expected in identity_fields.items():
        if str(payload.get(key) or "") != expected:
            raise VitalDudeEvidenceError(f"{key}_identity_mismatch")

    image = payload.get("imageEvidence")
    if not isinstance(image, Mapping):
        raise VitalDudeEvidenceError("image_evidence_required")
    image_hash = str(image.get("sha256") or "").lower()
    if not SHA256_PATTERN.fullmatch(image_hash):
        raise VitalDudeEvidenceError("image_sha256_required")
    media_type = str(image.get("mediaType") or "").lower()
    if not media_type.startswith("image/"):
        raise VitalDudeEvidenceError("image_media_type_required")
    width = _positive_integer(image.get("widthPx"), "image_width_required")
    height = _positive_integer(image.get("heightPx"), "image_height_required")
    verified = _verified_image(image, image_hash)
    if verified["mediaType"] != media_type:
        raise VitalDudeEvidenceError("image_media_type_mismatch")

    observations = payload.get("impacts")
    if not isinstance(observations, list) or not observations:
        raise VitalDudeEvidenceError("at_least_one_shot_observation_required")
    if len(observations) > MAX_OBSERVATIONS:
        raise VitalDudeEvidenceError("shot_observation_limit_exceeded")
    normalized = []
    for index, observation in enumerate(observations, start=1):
        if not isinstance(observation, Mapping):
            raise VitalDudeEvidenceError("shot_observation_must_be_an_object")
        normalized.append({
            "impactId": f"observation-{index:03d}",
            "xNorm": _coordinate(observation.get("xNorm"), "shot_observation_x_out_of_bounds"),
            "yNorm": _coordinate(observation.get("yNorm"), "shot_observation_y_out_of_bounds"),
            "evidenceMeaning": "shooter_recorded_visible_shot_observation",
        })

    declared_aim = payload.get("shooterDeclaredAimPoint")
    aim_point = None
    if declared_aim is not None:
        if not isinstance(declared_aim, Mapping):
            raise VitalDudeEvidenceError("shooter_declared_aim_point_invalid")
        aim_point = {
            "xNorm": _coordinate(declared_aim.get("xNorm"), "shooter_declared_aim_x_out_of_bounds"),
            "yNorm": _coordinate(declared_aim.get("yNorm"), "shooter_declared_aim_y_out_of_bounds"),
            "declaredBy": "shooter",
            "evidenceMeaning": "shooter_declared_aim_point",
            "authorityScope": "session_evidence_only",
        }

    evidence_identity = hashlib.sha256(json.dumps({
        "imageSha256": image_hash,
        "observations": normalized,
        "shooterDeclaredAimPoint": aim_point,
    }, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()

    result = {
        "ok": True,
        "status": "supported_analysis_ready",
        "authoritySource": "backend-authoritative",
        "missionFamily": profile["missionFamily"],
        "missionId": profile["missionId"],
        "resultPackageType": profile["resultPackageType"],
        "target": {
            "smartTargetId": profile["smartTargetId"],
            "variantId": profile["variantId"],
            "targetProfileId": profile["targetProfileId"],
            "targetProfileVersion": profile["targetProfileVersion"],
            "publisher": "GunFun",
            "productName": "Vital Dude",
            "sku": "22740",
            "publishedDimensions": {"width": 23, "height": 35, "unit": "inch"},
        },
        "imageEvidence": {
            "sha256": image_hash,
            "mediaType": media_type,
            "widthPx": width,
            "heightPx": height,
            "byteLength": verified["byteLength"],
            "backendHashVerified": True,
            "targetIdentityVerifiedFromImage": False,
            "acceptanceScope": "shooter_declared_registered_photo_evidence",
        },
        "impacts": normalized,
        "shooterDeclaredAimPoint": aim_point,
        "supportedAnalysis": {"impactCount": len(normalized)},
        "reconciliation": {
            "capturedObservationCount": len(normalized),
            "acceptedObservationCount": len(normalized),
            "countsMatch": True,
        },
        "ugo": {
            "status": "image_plane_evidence_only",
            "coordinateSystem": "normalized_source_image_top_left",
            "canonicalRegionMapping": "unavailable",
            "semanticClassification": "unavailable",
            "physicalMeasurement": "unavailable",
        },
        "productRegionDistribution": {"status": "unavailable", "reason": "canonical_region_authority_unavailable"},
        "scoring": {"status": "not_applicable", "reason": "evidence_only_experience"},
        "capabilityStates": {
            "anatomicalClassification": "unavailable",
            "medicalMeaning": "unavailable",
            "tacticalMeaning": "unavailable",
            "qualification": "not_applicable",
            "missionRules": "not_applicable",
            "correction": "not_applicable",
        },
        "authorityTrace": {
            "profileAuthorityId": profile["atpId"],
            "evidenceAuthority": "shooter_declaration_validated_by_backend",
            "resultAuthority": "backend",
            "publisherProductAuthority": "GUNFUN_EP56_COHORT_PUBLISHER_AUTHORITY_AUDIT_V1:E56-T08",
        },
        "evidenceIdentity": f"VITAL-DUDE-EVIDENCE-{evidence_identity[:24].upper()}",
        "evidenceHash": evidence_identity,
        "continuation": {"status": "available", "nextAction": "continue_to_universal_sec"},
    }
    result_hash = hashlib.sha256(json.dumps(result, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
    result["resultIdentity"] = f"VITAL-DUDE-RESULT-{result_hash[:24].upper()}"
    result["resultHash"] = result_hash
    return result
