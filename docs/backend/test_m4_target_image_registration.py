from __future__ import annotations

import base64
import hashlib
from copy import deepcopy
from pathlib import Path

import cv2
import numpy as np

from m4_authority.authority_service import build_authority_package
from session_authority import prepare_session
from target_image_registration_authority import register_target_image


DOCS = Path(__file__).resolve().parents[1]
CANONICAL = DOCS / "assets" / "M4_M16_25M_ZERO_AUTHORITY_v1.png"
FOUNDER_PHOTO = DOCS / "assets" / "M4_M16_SERIES_WEAPONS_25M_ZERO_FOUNDER_PHOTO.jpeg"
UNRELATED_M4_TARGET = DOCS / "assets" / "M4_TARGET_AUTHORITY_v1_ORIGINAL.png"
PACKAGE_ID = "m4-m16-25m-zero-photo-registration-v1"
PROFILE_ID = "m4_25m_zero"
PROFILE_VERSION = "M4_TARGET_AUTHORITY_v1_ORIGINAL"
COORDINATE_SYSTEM_ID = "M4_M16_25M_ZERO_AUTHORITY_v1"
BULL_Y_PERCENT = 43.181818
MECHANICAL_AUTHORITY_ID = "M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01"


class Store:
    def __init__(self):
        self.preparations = {}

    def save_preparation(self, record):
        self.preparations[record["tokenHash"]] = deepcopy(record)


def image_evidence(raw: bytes, media_type: str) -> dict:
    decoded = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert decoded is not None
    height, width = decoded.shape[:2]
    return {
        "sha256": hashlib.sha256(raw).hexdigest(),
        "widthPx": width,
        "heightPx": height,
        "dataUrl": f"data:{media_type};base64,{base64.b64encode(raw).decode('ascii')}",
    }


def perspective_fixture() -> tuple[dict, np.ndarray]:
    source = cv2.imread(str(CANONICAL), cv2.IMREAD_COLOR)
    height, width = source.shape[:2]
    source_corners = np.float32([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]])
    photo_corners = np.float32([[95, 70], [1180, 115], [1215, 1515], [60, 1470]])
    canonical_to_photo = cv2.getPerspectiveTransform(source_corners, photo_corners)
    photo = cv2.warpPerspective(source, canonical_to_photo, (1280, 1600), borderValue=(35, 35, 35))
    encoded_ok, encoded = cv2.imencode(".jpg", photo, [cv2.IMWRITE_JPEG_QUALITY, 92])
    assert encoded_ok
    return image_evidence(encoded.tobytes(), "image/jpeg"), canonical_to_photo


def source_observation(canonical_to_photo: np.ndarray, x_percent: float, y_percent: float, shot_id: str = "") -> dict:
    point = np.float32([[[x_percent / 100 * 2549, y_percent / 100 * 3299]]])
    mapped = cv2.perspectiveTransform(point, canonical_to_photo)[0, 0]
    result = {
        "xPercent": float(mapped[0] / 1279 * 100),
        "yPercent": float(mapped[1] / 1599 * 100),
    }
    if shot_id:
        result["shotId"] = shot_id
    return result


def precision_envelope(evidence: dict, aim: dict, impacts: list[dict]) -> dict:
    return {
        "schemaVersion": "sczn3-precision-tap-observations-v1",
        "observationAuthority": "shooter_declared",
        "coordinateConvention": "normalized_source_image_top_left",
        "registrationPackageId": PACKAGE_ID,
        "registrationPackageVersion": "1",
        "targetProfileId": PROFILE_ID,
        "targetProfileVersion": PROFILE_VERSION,
        "imageEvidence": evidence,
        "aimObservation": aim,
        "impactObservations": impacts,
    }


def authority_payload(evidence: dict, aim: dict, impacts: list[dict], phase: str) -> dict:
    return {
        "targetId": PROFILE_VERSION,
        "targetName": "M4 Carbine • 25 Meter Zeroing Target",
        "aimCoordinate": aim,
        "impactCoordinates": impacts,
        "distance": {"value": 25, "unit": "m"},
        "phase": phase,
        "zeroingMission": {"confirmationMinimumShots": 3, "confirmationResidualToleranceInches": 1},
        "equipmentAuthorityRecordId": MECHANICAL_AUTHORITY_ID,
        "shooterSetup": {
            "opticType": "Iron Sights",
            "adjustmentSystem": "M4_IRON_DCH_FSP",
            "equipmentAuthorityRecordId": MECHANICAL_AUTHORITY_ID,
        },
        "precisionTapEvidence": precision_envelope(evidence, aim, impacts),
    }


def test_session_authority_advertises_m4_registration():
    prepared = prepare_session({"targetId": PROFILE_ID}, Store())
    assert prepared["registrationAuthority"] == {
        "registrationPackageId": PACKAGE_ID,
        "registrationPackageVersion": "1",
        "canonicalCoordinateSystemId": COORDINATE_SYSTEM_ID,
        "status": "available",
    }


def test_exact_canonical_representation_registers():
    evidence = image_evidence(CANONICAL.read_bytes(), "image/png")
    result = register_target_image({
        "registrationPackageId": PACKAGE_ID,
        "registrationPackageVersion": "1",
        "targetProfileId": PROFILE_ID,
        "targetProfileVersion": PROFILE_VERSION,
        "imageEvidence": evidence,
        "observations": [{"observationId": "aim", "role": "aim", "xNorm": .5, "yNorm": BULL_Y_PERCENT / 100}],
    })
    assert result["knowledgeState"] == "exact"
    assert result["registrationMethod"] == "exact_canonical_representation"
    assert result["canonicalRepresentation"]["sha256"] == evidence["sha256"]


def test_registered_photo_drives_unchanged_m4_authority_and_source_rendering():
    evidence, transform = perspective_fixture()
    aim = source_observation(transform, 50, BULL_Y_PERCENT)
    impacts = [
        source_observation(transform, 59.7, 40, "initial-1"),
        source_observation(transform, 60, 40, "initial-2"),
        source_observation(transform, 60.3, 40, "initial-3"),
    ]
    result = build_authority_package(authority_payload(evidence, aim, impacts, "initial"))
    assert result["targetImageRegistrationEvidence"]["knowledgeState"] == "estimated"
    assert result["registrationClaimSufficiency"]["status"] == "sufficient"
    assert result["mechanicalSightAuthority"]["recordId"] == MECHANICAL_AUTHORITY_ID
    assert result["clicks"] and result["mechanicalValidation"]["status"] == "calculated"
    assert abs(result["inputs"]["aimCoordinate"]["xPercent"] - 50) < .05
    assert abs(result["inputs"]["aimCoordinate"]["yPercent"] - BULL_Y_PERCENT) < .05
    assert result["renderCoordinates"]["coordinatePlane"] == "source_photo"
    assert abs(result["renderCoordinates"]["aim"]["xPercent"] - aim["xPercent"]) < .02
    assert result["evidenceHash"]


def test_registered_confirmation_is_authoritative_and_preserves_lineage():
    evidence, transform = perspective_fixture()
    aim = source_observation(transform, 50, BULL_Y_PERCENT)
    impacts = [
        source_observation(transform, 49.9, BULL_Y_PERCENT - .1, "confirmation-1"),
        source_observation(transform, 50.1, BULL_Y_PERCENT, "confirmation-2"),
        source_observation(transform, 50, BULL_Y_PERCENT + .1, "confirmation-3"),
    ]
    result = build_authority_package(authority_payload(evidence, aim, impacts, "confirmation"))
    assert result["validation"]["confirmed"] is True
    assert result["registrationClaimSufficiency"]["confirmationAssessment"]["status"] == "stable"
    assert result["targetImageRegistrationEvidence"]["registrationEvidenceId"].startswith("TIR-")
    assert len(result["renderCoordinates"]["impacts"]) == 3
    assert len(result["evidenceHash"]) == 64


def test_founder_photo_registers_as_the_episode_60_authority_target():
    evidence = image_evidence(FOUNDER_PHOTO.read_bytes(), "image/jpeg")
    result = register_target_image({
        "registrationPackageId": PACKAGE_ID,
        "registrationPackageVersion": "1",
        "targetProfileId": PROFILE_ID,
        "targetProfileVersion": PROFILE_VERSION,
        "imageEvidence": evidence,
        "observations": [],
    })
    assert result["knowledgeState"] == "estimated"
    assert result["canonicalCoordinateSystemId"] == COORDINATE_SYSTEM_ID


def test_law_enforcement_target_cannot_be_misregistered_as_m4_m16_target():
    evidence = image_evidence(UNRELATED_M4_TARGET.read_bytes(), "image/png")
    result = register_target_image({
        "registrationPackageId": PACKAGE_ID,
        "registrationPackageVersion": "1",
        "targetProfileId": PROFILE_ID,
        "targetProfileVersion": PROFILE_VERSION,
        "imageEvidence": evidence,
        "observations": [],
    })
    assert result["knowledgeState"] == "unavailable"
    assert result["reason"] == "target_identity_unverified"


if __name__ == "__main__":
    tests = [value for name, value in globals().copy().items() if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} M4 Target Image Registration tests")
