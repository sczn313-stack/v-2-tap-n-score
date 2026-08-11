"""Phase 4 evidence analysis for the Baker SL-ST1 Target Page.

This module intentionally returns only truths supported by submitted evidence:
the accepted image metadata, normalized impact locations, and impact count.
Product-region meaning and numeric scoring remain unavailable until the printer
product scoring model is Founder verified.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any, Dict, Mapping


ROOT = Path(__file__).resolve().parents[1]
ATP_PATH = ROOT / "backend" / "target_profiles" / "ATP_BAKER_SL_ST1_PRACTICE_V1.json"
UGO_PATH = ROOT / "authority-evidence" / "baker-sl-st1" / "BAKER_SL_ST1_UGO_REGISTRATION_V1.json"
IDENTITY_PATH = ROOT / "backend" / "registries" / "smart_target_identity_registry.json"
SHA256_PATTERN = re.compile(r"^[a-f0-9]{64}$")


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

    return {
        "ok": True,
        "status": "supported_analysis_ready",
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
            "status": "unavailable",
            "reason": "universal_sec_phase_not_implemented",
        },
    }
