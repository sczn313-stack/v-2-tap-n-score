"""Baker SL-ST1 evidence analysis and backend scoring dispatch.

Exact canonical bytes use Mission A directly. Founder-approved real photographs
must first pass Mission B registration before their backend-derived canonical
coordinates can enter unchanged Mission A scoring.
"""
from __future__ import annotations

import hashlib
import base64
import binascii
import json
import re
from pathlib import Path
from typing import Any, Dict, Mapping

from baker_sl_st1_scoring import BakerSLST1ScoringError, score_canonical_impacts
from baker_sl_st1_registration import BakerSLST1RegistrationError, register_photo_impacts


ROOT = Path(__file__).resolve().parents[1]
ATP_PATH = ROOT / "backend" / "target_profiles" / "ATP_BAKER_SL_ST1_PRACTICE_V1.json"
UGO_PATH = ROOT / "authority-evidence" / "baker-sl-st1" / "BAKER_SL_ST1_UGO_REGISTRATION_V1.json"
IDENTITY_PATH = ROOT / "backend" / "registries" / "smart_target_identity_registry.json"
SHA256_PATTERN = re.compile(r"^[a-f0-9]{64}$")
DATA_URL_PATTERN = re.compile(r"^data:(image/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$")
MAX_IMAGE_BYTES = 25 * 1024 * 1024


class BakerSLST1EvidenceError(ValueError):
    def __init__(self, reason: str, status: str = "invalid_evidence"):
        super().__init__(reason)
        self.payload = {"ok": False, "status": status, "reason": reason}


def _read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _governed_context() -> Dict[str, Any]:
    atp = _read_json(ATP_PATH)
    ugo = _read_json(UGO_PATH)
    identity_registry = _read_json(IDENTITY_PATH)
    identity = next(
        (record for record in identity_registry["records"] if record["smartTargetId"] == "BAKER_SL_ST1"),
        None,
    )
    if identity is None:
        raise BakerSLST1EvidenceError("smart_target_identity_not_registered", "configuration_error")
    if atp["bindings"]["smartTargetIdentity"]["sha256"] != _sha256(IDENTITY_PATH):
        raise BakerSLST1EvidenceError("identity_binding_mismatch", "configuration_error")
    if atp["bindings"]["ugoObservation"]["sha256"] != _sha256(UGO_PATH):
        raise BakerSLST1EvidenceError("ugo_binding_mismatch", "configuration_error")
    if atp["bindings"]["ugoObservation"]["artifactId"] != ugo["registrationId"]:
        raise BakerSLST1EvidenceError("ugo_identity_mismatch", "configuration_error")
    return {"atp": atp, "ugo": ugo, "identity": identity}


def _positive_integer(value: Any, reason: str) -> int:
    if isinstance(value, bool):
        raise BakerSLST1EvidenceError(reason)
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise BakerSLST1EvidenceError(reason)
    if parsed <= 0:
        raise BakerSLST1EvidenceError(reason)
    return parsed


def _normalized_coordinate(value: Any, reason: str) -> float:
    if isinstance(value, bool):
        raise BakerSLST1EvidenceError(reason)
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise BakerSLST1EvidenceError(reason)
    if parsed < 0 or parsed > 1:
        raise BakerSLST1EvidenceError(reason)
    return round(parsed, 8)


def _backend_verified_image(image: Mapping[str, Any], claimed_hash: str) -> Dict[str, Any]:
    data_url = image.get("dataUrl")
    if not data_url:
        return {"verified": False, "sha256": claimed_hash}
    match = DATA_URL_PATTERN.fullmatch(str(data_url))
    if not match:
        raise BakerSLST1EvidenceError("image_data_url_invalid")
    try:
        image_bytes = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError):
        raise BakerSLST1EvidenceError("image_data_base64_invalid")
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise BakerSLST1EvidenceError("image_data_size_invalid")
    backend_hash = hashlib.sha256(image_bytes).hexdigest()
    if backend_hash != claimed_hash:
        raise BakerSLST1EvidenceError("image_sha256_mismatch")
    return {
        "verified": True,
        "sha256": backend_hash,
        "mediaType": match.group(1),
        "byteLength": len(image_bytes),
        "imageBytes": image_bytes,
    }


def analyze_baker_sl_st1_evidence(payload: Any) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise BakerSLST1EvidenceError("payload_must_be_an_object", "invalid_request")

    context = _governed_context()
    atp = context["atp"]
    identity = context["identity"]
    expected_variant = identity["launchVariant"]["variantId"]
    if str(payload.get("targetId") or "") != identity["smartTargetId"]:
        raise BakerSLST1EvidenceError("target_identity_mismatch")
    if str(payload.get("variantId") or "") != expected_variant:
        raise BakerSLST1EvidenceError("target_variant_mismatch")

    image = payload.get("imageEvidence")
    if not isinstance(image, Mapping):
        raise BakerSLST1EvidenceError("image_evidence_required")
    image_hash = str(image.get("sha256") or "").lower()
    if not SHA256_PATTERN.fullmatch(image_hash):
        raise BakerSLST1EvidenceError("image_sha256_required")
    media_type = str(image.get("mediaType") or "").lower()
    if not media_type.startswith("image/"):
        raise BakerSLST1EvidenceError("image_media_type_required")
    width = _positive_integer(image.get("widthPx"), "image_width_required")
    height = _positive_integer(image.get("heightPx"), "image_height_required")
    verified_image = _backend_verified_image(image, image_hash)

    impacts = payload.get("impacts")
    if not isinstance(impacts, list) or not impacts:
        raise BakerSLST1EvidenceError("at_least_one_impact_required")
    if len(impacts) > 250:
        raise BakerSLST1EvidenceError("impact_limit_exceeded")

    normalized_impacts = []
    for index, impact in enumerate(impacts, start=1):
        if not isinstance(impact, Mapping):
            raise BakerSLST1EvidenceError("impact_must_be_an_object")
        normalized_impacts.append({
            "impactId": f"impact-{index:03d}",
            "xNorm": _normalized_coordinate(impact.get("xNorm"), "impact_x_out_of_bounds"),
            "yNorm": _normalized_coordinate(impact.get("yNorm"), "impact_y_out_of_bounds"),
        })

    result = {
        "ok": True,
        "status": "supported_analysis_ready",
        "missionFamily": "smartEvidenceCapture",
        "resultPackageType": "smartEvidenceResult",
        "target": {
            "smartTargetId": identity["smartTargetId"],
            "variantId": expected_variant,
            "targetProfileId": atp["targetProfileId"],
            "targetProfileVersion": atp["targetProfileVersion"],
        },
        "imageEvidence": {
            "sha256": image_hash,
            "mediaType": media_type,
            "widthPx": width,
            "heightPx": height,
            "acceptanceScope": "manual_impact_evidence",
            "backendHashVerified": verified_image["verified"],
            "targetIdentityVerifiedFromImage": False,
        },
        "impacts": normalized_impacts,
        "supportedAnalysis": {
            "impactCount": len(normalized_impacts),
        },
        "productRegionDistribution": {
            "status": "unavailable",
            "reason": "product_definition_founder_verification_pending",
        },
        "scoring": {
            "status": "unavailable",
            "reason": "printer_product_scoring_model_founder_verification_pending",
        },
        "continuation": {
            "status": "available",
            "nextAction": "continue_to_universal_sec",
        },
    }
    canonical = context["ugo"]["sourceEvidence"]
    if (
        verified_image["verified"]
        and image_hash == canonical["sha256"]
        and width == canonical["pixelWidth"]
        and height == canonical["pixelHeight"]
    ):
        try:
            scored = score_canonical_impacts({
                "coordinateSystemId": context["ugo"]["coordinateSystem"]["coordinateSystemId"],
                "registrationId": context["ugo"]["registrationId"],
                "canonicalAssetSha256": image_hash,
                "impacts": normalized_impacts,
            })
        except BakerSLST1ScoringError as exc:
            raise BakerSLST1EvidenceError(exc.reason, "configuration_error") from exc
        result["imageEvidence"]["acceptanceScope"] = "exact_registered_canonical_asset"
        result["imageEvidence"]["targetIdentityVerifiedFromImage"] = True
        result["impacts"] = scored["impacts"]
        result["productRegionDistribution"] = {
            "status": "complete",
            "zoneCounts": scored["zoneCounts"],
            "classifiedImpactCount": scored["classifiedImpactCount"],
            "capturedImpactCount": scored["capturedImpactCount"],
            "reconciliation": scored["reconciliation"],
        }
        result["scoring"] = scored["scoring"]
        result["authorityTrace"] = scored["authorityTrace"]
    elif verified_image["verified"]:
        try:
            registered = register_photo_impacts(
                image_bytes=verified_image["imageBytes"],
                image_sha256=image_hash,
                width_px=width,
                height_px=height,
                impacts=normalized_impacts,
            )
        except BakerSLST1RegistrationError as exc:
            # Preserve the pre-Mission-B evidence contract for non-image test
            # bytes while returning specific fail-closed registration reasons
            # for valid photographed evidence.
            reason = "canonical_registration_required" if exc.reason == "image_evidence_unreadable" else exc.reason
            result["productRegionDistribution"]["reason"] = reason
            result["scoring"]["reason"] = reason
            result["registration"] = exc.payload
        else:
            result["imageEvidence"]["acceptanceScope"] = "founder_approved_registered_real_photo"
            result["imageEvidence"]["targetIdentityVerifiedFromImage"] = True
            result["impacts"] = registered["impacts"]
            result["productRegionDistribution"] = {
                "status": "complete",
                "zoneCounts": registered["zoneCounts"],
                "classifiedImpactCount": registered["classifiedImpactCount"],
                "capturedImpactCount": registered["capturedImpactCount"],
                "reconciliation": registered["reconciliation"],
            }
            result["scoring"] = registered["scoring"]
            result["registration"] = registered["registration"]
            result["authorityTrace"] = registered["authorityTrace"]
    return result
