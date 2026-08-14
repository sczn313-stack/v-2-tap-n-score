"""Immutable Founder fixture capture for Baker SL-ST1 registration validation.

This module preserves evidence only. It does not verify target identity, classify
regions, or calculate a score.
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, Mapping


TARGET_ID = "BAKER_SL_ST1"
VARIANT_ID = "BAKER_SL_ST1_23X35_STANDARD_WHITE"
FIXTURE_PURPOSE = "founder_scoring_fixture_registration_validation"
DATA_URL_PATTERN = re.compile(r"^data:(image/(?:jpeg|png));base64,([A-Za-z0-9+/=\r\n]+)$")
MAX_IMAGE_BYTES = 25 * 1024 * 1024


class BakerSLST1FixtureError(ValueError):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.payload = {"ok": False, "status": "fixture_capture_rejected", "reason": reason}


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _coordinate(value: Any, reason: str) -> float:
    if isinstance(value, bool):
        raise BakerSLST1FixtureError(reason)
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise BakerSLST1FixtureError(reason)
    if not 0 <= parsed <= 1:
        raise BakerSLST1FixtureError(reason)
    return parsed


def _decode_image(data_url: Any) -> tuple[str, bytes]:
    match = DATA_URL_PATTERN.fullmatch(str(data_url or ""))
    if not match:
        raise BakerSLST1FixtureError("fixture_image_must_be_jpeg_or_png_data_url")
    try:
        image_bytes = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError):
        raise BakerSLST1FixtureError("fixture_image_base64_invalid")
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise BakerSLST1FixtureError("fixture_image_size_invalid")
    return match.group(1), image_bytes


def preserve_founder_fixture(payload: Any, *, now: datetime | None = None) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise BakerSLST1FixtureError("fixture_payload_must_be_object")
    if payload.get("purpose") != FIXTURE_PURPOSE:
        raise BakerSLST1FixtureError("fixture_purpose_mismatch")
    if payload.get("targetId") != TARGET_ID:
        raise BakerSLST1FixtureError("fixture_target_identity_mismatch")
    if payload.get("variantId") != VARIANT_ID:
        raise BakerSLST1FixtureError("fixture_target_variant_mismatch")

    impacts = payload.get("impacts")
    if not isinstance(impacts, list) or not impacts:
        raise BakerSLST1FixtureError("fixture_requires_at_least_one_impact")
    if len(impacts) > 250:
        raise BakerSLST1FixtureError("fixture_impact_limit_exceeded")
    exact_impacts = [
        {
            "impactId": f"impact-{index:03d}",
            "xNorm": _coordinate(impact.get("xNorm") if isinstance(impact, Mapping) else None, "fixture_impact_x_invalid"),
            "yNorm": _coordinate(impact.get("yNorm") if isinstance(impact, Mapping) else None, "fixture_impact_y_invalid"),
        }
        for index, impact in enumerate(impacts, start=1)
    ]

    image = payload.get("imageEvidence")
    if not isinstance(image, Mapping):
        raise BakerSLST1FixtureError("fixture_image_evidence_required")
    media_type, image_bytes = _decode_image(image.get("dataUrl"))
    backend_image_hash = _sha256(image_bytes)
    claimed_hash = str(image.get("sha256") or "").lower()
    if claimed_hash and claimed_hash != backend_image_hash:
        raise BakerSLST1FixtureError("fixture_client_image_hash_mismatch")

    coordinate_hash = _sha256(_canonical_bytes(exact_impacts))
    captured_at = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    identity_seed = {
        "purpose": FIXTURE_PURPOSE,
        "targetId": TARGET_ID,
        "variantId": VARIANT_ID,
        "imageSha256": backend_image_hash,
        "coordinateSha256": coordinate_hash,
        "impactCount": len(exact_impacts),
    }
    fixture_hash = _sha256(_canonical_bytes(identity_seed))
    fixture_id = f"FOUNDER_BAKER_SL_ST1_SCORING_{fixture_hash[:16].upper()}"
    export = {
        "schemaVersion": "sczn3-founder-registration-fixture-v1",
        "ok": True,
        "status": "preserved_for_registration_validation",
        "fixtureId": fixture_id,
        "fixtureSha256": fixture_hash,
        "capturedAt": captured_at,
        "purpose": FIXTURE_PURPOSE,
        "sessionIdentity": {
            "fixtureSessionId": f"fixture-session-{fixture_hash[:24]}",
            "targetId": TARGET_ID,
            "variantId": VARIANT_ID,
            "identityStatus": "claimed_pending_backend_image_registration",
        },
        "evidenceIdentity": {
            "evidenceId": f"sha256:{backend_image_hash}",
            "originalImageSha256": backend_image_hash,
            "coordinateSha256": coordinate_hash,
            "hashAuthority": "backend",
        },
        "imageEvidence": {
            "mediaType": media_type,
            "byteLength": len(image_bytes),
            "widthPx": image.get("widthPx"),
            "heightPx": image.get("heightPx"),
            "originalFileDataUrl": image.get("dataUrl"),
        },
        "impacts": exact_impacts,
        "impactCount": len(exact_impacts),
        "immutability": {
            "state": "sealed_export",
            "statement": "This fixture preserves the original image bytes and the complete captured set of shooter-selected coordinates. It contains no classification or score.",
        },
    }
    return export
