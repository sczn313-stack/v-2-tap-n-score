from __future__ import annotations

import base64
import hashlib
from copy import deepcopy
from pathlib import Path

import cv2
import numpy as np

from m4_authority.authority_service import build_authority_package
from session_authority import SessionAuthorityError, prepare_session
from target_image_registration_authority import register_target_image


DOCS = Path(__file__).resolve().parents[1]
CANONICAL = DOCS / "assets" / "BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg"
DIFFERENT_GEOMETRY = DOCS / "assets" / "M4_M16_25M_ZERO_AUTHORITY_v1.png"
PACKAGE_ID = "baker-m16a2-25m-photo-registration-v1"
PROFILE_ID = "baker_m16a2_25m_zero"
PROFILE_VERSION = "BAKER_M16A2_25M_AUTHORITY_v1"
COORDINATE_SYSTEM_ID = "BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1"
ADJUSTMENT_PROFILE_ID = "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
EQUIPMENT_CONFIGURATION_ID = "M16A2-STANDARD-IRON-FSP-REAR-DRUM"


class Store:
    def __init__(self):
        self.preparations = {}

    def save_preparation(self, record):
        self.preparations[record["tokenHash"]] = deepcopy(record)


def image_evidence(path: Path) -> dict:
    raw = path.read_bytes()
    decoded = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert decoded is not None
    height, width = decoded.shape[:2]
    media_type = "image/jpeg" if path.suffix.lower() in {".jpg", ".jpeg"} else "image/png"
    return {
        "sha256": hashlib.sha256(raw).hexdigest(),
        "widthPx": width,
        "heightPx": height,
        "dataUrl": f"data:{media_type};base64,{base64.b64encode(raw).decode('ascii')}",
    }


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


def authority_payload(evidence: dict, impacts: list[dict], phase: str = "initial") -> dict:
    aim = {"xPercent": 50.0, "yPercent": 48.7}
    return {
        "target_profile_id": PROFILE_ID,
        "targetProfileId": PROFILE_ID,
        "targetId": COORDINATE_SYSTEM_ID,
        "targetName": "Baker M16A2 25 Meter Zeroing Target",
        "aimCoordinate": aim,
        "impactCoordinates": impacts,
        "distance": {"value": 25, "unit": "m"},
        "phase": phase,
        "zeroingMission": {"confirmationMinimumShots": 3, "confirmationResidualToleranceInches": 1},
        "adjustmentProfileId": ADJUSTMENT_PROFILE_ID,
        "shooterSetup": {
            "opticType": "Iron Sights",
            "adjustmentSystem": "M16A2_IRON_FSP_REAR_DRUM",
            "equipmentConfigurationId": EQUIPMENT_CONFIGURATION_ID,
            "adjustmentProfileId": ADJUSTMENT_PROFILE_ID,
        },
        "precisionTapEvidence": precision_envelope(evidence, aim, impacts),
    }


def test_session_advertises_dedicated_standard_baker_m16a2_registration():
    prepared = prepare_session({"targetId": PROFILE_ID}, Store())
    assert prepared["target"]["targetId"] == PROFILE_ID
    assert prepared["target"]["targetAuthorityId"] == PROFILE_VERSION
    assert prepared["registrationAuthority"] == {
        "registrationPackageId": PACKAGE_ID,
        "registrationPackageVersion": "1",
        "canonicalCoordinateSystemId": COORDINATE_SYSTEM_ID,
        "status": "available",
    }
    assert prepared["standardSetup"]["adjustmentProfileId"] == ADJUSTMENT_PROFILE_ID


def test_ambiguous_two_sided_product_identity_no_longer_routes_to_universal_m4():
    try:
        prepare_session({"targetId": "ST-M16A2/M4"}, Store())
    except SessionAuthorityError as error:
        assert error.payload["reason"] == "target_id_not_registered"
    else:
        raise AssertionError("ambiguous ST-M16A2/M4 identity must fail closed")


def test_exact_standard_baker_m16a2_face_registers():
    evidence = image_evidence(CANONICAL)
    result = register_target_image({
        "registrationPackageId": PACKAGE_ID,
        "registrationPackageVersion": "1",
        "targetProfileId": PROFILE_ID,
        "targetProfileVersion": PROFILE_VERSION,
        "imageEvidence": evidence,
        "observations": [{"observationId": "aim", "role": "aim", "xNorm": .5, "yNorm": .487}],
    })
    assert result["knowledgeState"] == "exact"
    assert result["registrationMethod"] == "exact_canonical_representation"
    assert result["canonicalCoordinateSystemId"] == COORDINATE_SYSTEM_ID
    assert result["canonicalRepresentation"]["sha256"] == evidence["sha256"]


def test_different_universal_moa_geometry_still_fails_closed():
    result = register_target_image({
        "registrationPackageId": PACKAGE_ID,
        "registrationPackageVersion": "1",
        "targetProfileId": PROFILE_ID,
        "targetProfileVersion": PROFILE_VERSION,
        "imageEvidence": image_evidence(DIFFERENT_GEOMETRY),
        "observations": [],
    })
    assert result["knowledgeState"] == "unavailable"
    assert result["reason"] == "target_identity_unverified"


def test_standard_baker_m16a2_uses_existing_mechanical_authority():
    impacts = [
        {"xPercent": 58.3, "yPercent": 41.1, "shotId": "initial-1"},
        {"xPercent": 58.5, "yPercent": 41.3, "shotId": "initial-2"},
        {"xPercent": 58.7, "yPercent": 41.5, "shotId": "initial-3"},
    ]
    result = build_authority_package(authority_payload(image_evidence(CANONICAL), impacts))
    assert result["targetProfileId"] == PROFILE_ID
    assert result["authorityVersion"] == "sczn3-baker-m16a2-authority-v1"
    assert result["targetImageRegistrationEvidence"]["knowledgeState"] == "exact"
    assert result["registrationClaimSufficiency"]["owner"] == "baker-m16a2-zeroing-authority"
    assert result["mechanicalSightAuthority"]["adjustmentProfileId"] == ADJUSTMENT_PROFILE_ID
    correction_controls = {
        control["axis"]: control
        for control in result["mechanicalSightAuthority"]["controls"]
        if control["operationPurpose"] == "correction"
    }
    assert correction_controls["windage"]["movementPerClick"] == .5
    assert correction_controls["elevation"]["movementPerClick"] == 1.25
    assert result["clicks"]["windageClicks"] == 5
    assert result["clicks"]["windageDirection"] == "LEFT"
    assert result["clicks"]["windageTurnDirection"] == "COUNTERCLOCKWISE"
    assert result["clicks"]["elevationClicks"] == 2
    assert result["clicks"]["elevationDirection"] == "DOWN"
    assert result["clicks"]["elevationTurnDirection"] == "COUNTERCLOCKWISE"
    assert result["mechanicalValidation"]["status"] == "calculated"


def test_standard_baker_m16a2_confirmation_is_authoritative():
    impacts = [
        {"xPercent": 49.9, "yPercent": 48.6, "shotId": "confirmation-1"},
        {"xPercent": 50.1, "yPercent": 48.7, "shotId": "confirmation-2"},
        {"xPercent": 50.0, "yPercent": 48.8, "shotId": "confirmation-3"},
    ]
    result = build_authority_package(authority_payload(image_evidence(CANONICAL), impacts, "confirmation"))
    assert result["validation"]["confirmed"] is True
    assert result["validation"]["status"] == "calculated"
    assert result["registrationClaimSufficiency"]["confirmationAssessment"]["status"] == "stable"
    assert result["targetImageRegistrationEvidence"]["knowledgeState"] == "exact"


if __name__ == "__main__":
    tests = [value for name, value in globals().copy().items() if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} Baker M16A2 identity/registration tests")
