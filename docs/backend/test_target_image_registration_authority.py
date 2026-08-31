from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np

from authority_service import build_authority_package, zero_correction_registration_sufficiency
from target_image_registration_authority import register_target_image


DOCS_ROOT = Path(__file__).resolve().parents[1]
CANONICAL = DOCS_ROOT / "assets" / "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png"
FOUNDER_ROOT = DOCS_ROOT / "authority-evidence" / "baker-100-registration" / "real-world-acceptance"
FOUNDER_PHOTO = FOUNDER_ROOT / "FOUNDER_FIRED_WRINKLED_BAKER_ST_100YD_SMART.jpeg"
FOUNDER_MANIFEST = FOUNDER_ROOT / "FOUNDER_FIRED_WRINKLED_BAKER_ST_100YD_SMART_MANIFEST.json"


def image_evidence(path: Path, media_type: str | None = None):
    data = path.read_bytes()
    decoded = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    height, width = decoded.shape[:2]
    suffix_type = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    return {
        "sha256": hashlib.sha256(data).hexdigest(),
        "widthPx": width,
        "heightPx": height,
        "dataUrl": f"data:{media_type or suffix_type};base64," + base64.b64encode(data).decode("ascii"),
    }


def registration_request(image, observations=None, package_id="baker-st-100yd-smart-photo-registration-v1", profile_id="baker_st_100yd_smart_zero", profile_version="BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL"):
    return {
        "registrationPackageId": package_id,
        "registrationPackageVersion": "1",
        "targetProfileId": profile_id,
        "targetProfileVersion": profile_version,
        "imageEvidence": image,
        "observations": observations or [],
    }


def test_exact_asset_is_one_shared_method():
    result = register_target_image(registration_request(image_evidence(CANONICAL)))
    assert result["knowledgeState"] == "exact"
    assert result["registrationMethod"] == "exact_canonical_representation"
    assert result["claimSufficiencyOwner"] == "downstream_mission_authority"
    assert result["metrics"]["targetCoverage"] == 1


def test_founder_fired_wrinkled_photo_accumulates_registration_evidence():
    manifest = json.loads(FOUNDER_MANIFEST.read_text())
    observations = [
        {"observationId": "aim", "role": "aim", **manifest["shooterDeclaredObservations"]["aim"]},
        *[
            {"observationId": f"impact-{index:03d}", "role": "impact", **point}
            for index, point in enumerate(manifest["shooterDeclaredObservations"]["impacts"], start=1)
        ],
    ]
    result = register_target_image(registration_request(image_evidence(FOUNDER_PHOTO), observations))
    assert result["knowledgeState"] == "estimated"
    assert result["registrationMethod"] == "ugo_sift_homography_v1"
    assert result["metrics"]["mutualMatches"] >= 50
    assert result["metrics"]["inliers"] >= 40
    assert result["metrics"]["targetCoverage"] >= 0.9
    assert len(result["canonicalObservations"]) == 6
    assert all(item["registeredCoverageStatus"] == "supported" for item in result["canonicalObservations"])
    assert all(item["localUncertaintyPx"] < 8 for item in result["canonicalObservations"])


def test_founder_photo_reaches_existing_zeroing_owner_with_stable_claim():
    manifest = json.loads(FOUNDER_MANIFEST.read_text())
    aim = manifest["shooterDeclaredObservations"]["aim"]
    impacts = manifest["shooterDeclaredObservations"]["impacts"]
    evidence = image_evidence(FOUNDER_PHOTO)
    payload = {
        "targetId": "BAKER_ST_100YD_SMART",
        "target_profile_id": "baker_st_100yd_smart_zero",
        "targetProfileId": "baker_st_100yd_smart_zero",
        "targetProfileVersion": "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
        "aimCoordinate": {"xPercent": aim["xNorm"] * 100, "yPercent": aim["yNorm"] * 100},
        "impactCoordinates": [{"xPercent": item["xNorm"] * 100, "yPercent": item["yNorm"] * 100} for item in impacts],
        "distance": {"value": 100, "unit": "yds"},
        "shooterSetup": {"optic": {"adjustmentUnit": "MOA", "clickValueMOA": 0.25}},
        "precisionTapEvidence": {
            "targetProfileId": "baker_st_100yd_smart_zero",
            "targetProfileVersion": "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
            "registrationPackageId": "baker-st-100yd-smart-photo-registration-v1",
            "registrationPackageVersion": "1",
            "imageEvidence": evidence,
            "aimObservation": {"xPercent": aim["xNorm"] * 100, "yPercent": aim["yNorm"] * 100},
            "impactObservations": [{"xPercent": item["xNorm"] * 100, "yPercent": item["yNorm"] * 100} for item in impacts],
        },
    }
    result = build_authority_package(payload)
    assert result["targetImageRegistrationEvidence"]["knowledgeState"] == "estimated"
    assert result["registrationClaimSufficiency"]["status"] == "sufficient"
    assert result["correction"] is not None
    assert result["clicks"] is not None
    assert result["vectors"]["poibToAim"]["intent"] == "POIB_TO_AIM"


def test_downstream_zeroing_owner_refuses_only_materially_unstable_claim():
    registration = {
        "canonicalObservations": [
            {"role": "aim", "localUncertaintyPx": 80},
            {"role": "impact", "localUncertaintyPx": 80},
        ]
    }
    geometry = {"imageWidth": 1102, "imageHeight": 1713, "gridLeftPx": 68, "gridTopPx": 282, "gridSquarePx": 49, "gridSquareInches": 1}
    result = zero_correction_registration_sufficiency(
        registration,
        {"xPercent": 50, "yPercent": 50},
        [{"xPercent": 50.2, "yPercent": 50.2}],
        geometry,
        100,
        {"unit": "MOA", "clickValue": 0.25, "clickValueMOA": 0.25, "clickValueMRAD": None},
    )
    assert result["status"] == "insufficient"
    assert result["reason"] == "registration_uncertainty_could_change_correction"


def test_deliberately_inadequate_evidence_fails_safely(tmp_path):
    blank = np.full((900, 700, 3), 255, dtype=np.uint8)
    ok, encoded = cv2.imencode(".jpg", blank)
    assert ok
    path = tmp_path / "blank.jpg"
    path.write_bytes(encoded.tobytes())
    result = register_target_image(registration_request(image_evidence(path)))
    assert result["knowledgeState"] == "unavailable"
    assert result["reason"] == "target_identity_unverified"
    assert result["recovery"]["action"] == "retake_photo"


def test_third_target_inherits_arbitrary_photo_registration_through_data_only(tmp_path):
    source_path = DOCS_ROOT / "assets" / "gssf_ac_1_clean_reference.png"
    source = cv2.imread(str(source_path), cv2.IMREAD_COLOR)
    height, width = source.shape[:2]
    source_corners = np.float32([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]])
    output_corners = np.float32([[120, 90], [1040, 145], [1010, 1450], [165, 1400]])
    transform = cv2.getPerspectiveTransform(source_corners, output_corners)
    photo = cv2.warpPerspective(source, transform, (1180, 1540), borderValue=(65, 65, 65))
    ok, encoded = cv2.imencode(".jpg", photo, [cv2.IMWRITE_JPEG_QUALITY, 94])
    assert ok
    path = tmp_path / "gssf-phone-photo.jpg"
    path.write_bytes(encoded.tobytes())
    result = register_target_image(registration_request(
        image_evidence(path),
        [{"observationId": "impact-001", "role": "impact", "xNorm": 0.5, "yNorm": 0.5}],
        package_id="gssf-ac-1-photo-registration-fixture-v1",
        profile_id="gssf_ac_1",
        profile_version="1",
    ))
    assert result["knowledgeState"] == "estimated"
    assert result["registrationMethod"] == "ugo_sift_homography_v1"
    assert result["targetProfileId"] == "gssf_ac_1"
    assert len(result["canonicalObservations"]) == 1


if __name__ == "__main__":
    import tempfile

    test_exact_asset_is_one_shared_method()
    test_founder_fired_wrinkled_photo_accumulates_registration_evidence()
    test_founder_photo_reaches_existing_zeroing_owner_with_stable_claim()
    test_downstream_zeroing_owner_refuses_only_materially_unstable_claim()
    with tempfile.TemporaryDirectory() as directory:
        test_deliberately_inadequate_evidence_fails_safely(Path(directory))
        test_third_target_inherits_arbitrary_photo_registration_through_data_only(Path(directory))
    print("PASS Episode 59 Target Image Registration Authority")
