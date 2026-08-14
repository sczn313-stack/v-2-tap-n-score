import hashlib
import json
import base64
from pathlib import Path

import cv2

from baker_sl_st1_registration import register_photo_impacts
from baker_sl_st1_target_page import analyze_baker_sl_st1_evidence


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_ROOT = ROOT / "authority-evidence" / "baker-sl-st1" / "registration-validation"
SESSION_FIXTURE = EVIDENCE_ROOT / "session-002" / "BAKER_SL_ST1_SESSION_002_MANIFEST.json"


def _fixture_payload():
    manifest = json.loads(SESSION_FIXTURE.read_text(encoding="utf-8"))
    image_path = SESSION_FIXTURE.parent / manifest["imageFile"]
    image_bytes = image_path.read_bytes()
    assert hashlib.sha256(image_bytes).hexdigest() == manifest["imageSha256"]
    return manifest, image_bytes


def test_session_002_registers_all_16_points_and_hands_off_to_mission_a():
    manifest, image_bytes = _fixture_payload()
    result = register_photo_impacts(
        image_bytes=image_bytes,
        image_sha256=manifest["imageSha256"],
        width_px=manifest["widthPx"],
        height_px=manifest["heightPx"],
        impacts=manifest["impacts"],
    )

    assert result["status"] == "registered_real_photo_scoring_ready"
    assert result["registration"]["status"] == "pass"
    assert result["registration"]["authorityId"] == "BAKER_SL_ST1_MISSION_B_RUNTIME_GATE_V1"
    assert result["registration"]["metrics"]["residual"]["rmsPx"] <= 6
    assert result["registration"]["metrics"]["residual"]["p95Px"] <= 17
    assert result["registration"]["metrics"]["residual"]["maxPx"] <= 20
    assert result["registration"]["metrics"]["bootstrap"]["rmsPx"] <= 6
    assert result["registration"]["metrics"]["bootstrap"]["p95Px"] <= 7
    assert len(result["impacts"]) == 16
    assert all("sourceEvidencePoint" in impact for impact in result["impacts"])
    assert all("canonicalPointPx" in impact for impact in result["impacts"])
    assert result["reconciliation"]["capturedImpactCount"] == 16
    assert result["reconciliation"]["countsMatchCapturedImpactCount"] is True
    assert result["scoring"]["status"] == "complete"
    assert result["authorityTrace"]["classificationAuthority"] == "backend"
    assert result["authorityTrace"]["registrationAuthority"] == "backend"


def test_registration_fails_closed_for_unreliable_or_wrong_evidence():
    cases = [
        ("positive-target-identity/BAKER_SL_ST1_POSITIVE_CAPTURE_007_EXTREME_DISTANCE_SMALL_TARGET.jpeg", "target_identity_unverified"),
        ("fail-closed/BAKER_SL_ST1_CAPTURE_008_INSUFFICIENT_GEOMETRY.jpeg", "insufficient_authoritative_geometry"),
        ("negative-target-identity/NEGATIVE_USPSA_IPSC_GF100_IMAGE.jpeg", "target_identity_unverified"),
    ]
    for relative_path, expected_reason in cases:
        image_path = EVIDENCE_ROOT / relative_path
        image_bytes = image_path.read_bytes()
        decoded = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
        height_px, width_px = decoded.shape[:2]
        try:
            register_photo_impacts(
                image_bytes=image_bytes,
                image_sha256=hashlib.sha256(image_bytes).hexdigest(),
                width_px=width_px,
                height_px=height_px,
                impacts=[{"xNorm": 0.5, "yNorm": 0.5}],
            )
        except ValueError as exc:
            assert getattr(exc, "reason", None) == expected_reason
        else:
            raise AssertionError(f"{relative_path} must fail closed")


def test_frontend_registration_and_score_claims_are_ignored():
    manifest, image_bytes = _fixture_payload()
    result = register_photo_impacts(
        image_bytes=image_bytes,
        image_sha256=manifest["imageSha256"],
        width_px=manifest["widthPx"],
        height_px=manifest["heightPx"],
        impacts=[
            {
                **impact,
                "zone": "A",
                "zoneValue": 999,
                "canonicalPointPx": {"x": 0, "y": 0},
                "score": 999999,
            }
            for impact in manifest["impacts"]
        ],
    )
    assert result["scoring"]["total"] != 999999
    assert all(impact.get("zoneValue") != 999 for impact in result["impacts"])


def test_session_002_runs_through_real_target_page_dispatch():
    manifest, image_bytes = _fixture_payload()
    result = analyze_baker_sl_st1_evidence({
        "targetId": "BAKER_SL_ST1",
        "variantId": "BAKER_SL_ST1_23X35_STANDARD_WHITE",
        "imageEvidence": {
            "sha256": manifest["imageSha256"],
            "mediaType": "image/jpeg",
            "widthPx": manifest["widthPx"],
            "heightPx": manifest["heightPx"],
            "dataUrl": "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode("ascii"),
        },
        "impacts": manifest["impacts"],
        "registration": {"homography": [999], "status": "pass"},
        "scoring": {"total": 999999},
    })
    assert result["imageEvidence"]["acceptanceScope"] == "founder_approved_registered_real_photo"
    assert result["imageEvidence"]["targetIdentityVerifiedFromImage"] is True
    assert result["registration"]["status"] == "pass"
    assert result["supportedAnalysis"]["impactCount"] == 16
    assert result["scoring"]["status"] == "complete"
    assert result["scoring"]["total"] != 999999
    assert result["authorityTrace"]["sourceEvidenceSha256"] == manifest["imageSha256"]


def run():
    test_session_002_registers_all_16_points_and_hands_off_to_mission_a()
    test_registration_fails_closed_for_unreliable_or_wrong_evidence()
    test_frontend_registration_and_score_claims_are_ignored()
    test_session_002_runs_through_real_target_page_dispatch()
    print("PASS Baker SL-ST1 Mission B registration contract")


if __name__ == "__main__":
    run()
