#!/usr/bin/env python3
"""Scale Sweep 07: printer authority plus family UGO admission proof."""
from __future__ import annotations

import base64
import hashlib
from pathlib import Path

import cv2
import numpy as np

from m4_authority.authority_service import build_authority_package
from mfam_family_authority import industry_authorization_sweep, resolve_face_admission, resolve_target_profile
from session_authority import TARGET_AUTHORITY_PROFILES
from target_image_registration_authority import register_target_image


DOCS = Path(__file__).resolve().parents[1]
M4_TEMPLATE = DOCS / "assets" / "BAKER_ST_M16A2_M4_M4_FACE_AUTHORITY_v1.jpg"
M16A2_DIFFERENT_GEOMETRY = DOCS / "assets" / "BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg"
CASES = {
    "rite_9125_m4_25m_zero": ("face-007", "RITE_9125_M4_AUTHORITY_v1", "rite-9125-m4-family-ugo-registration-v1"),
    "national_23075_m4_25m_zero": ("face-014", "NATIONAL_23075_M4_AUTHORITY_v1", "national-23075-m4-family-ugo-registration-v1"),
    "qualification_m4_25m_zero": ("face-017", "QUALIFICATION_M4_25M_AUTHORITY_v1", "qualification-m4-family-ugo-registration-v1"),
    "speedwell_dodm4_m4_25m_zero": ("face-019", "SPEEDWELL_DODM4_M4_AUTHORITY_v1", "speedwell-dodm4-m4-family-ugo-registration-v1"),
    "action_m4_carbine_25m_zero": ("face-021", "ACTION_M4_CARBINE_AUTHORITY_v1", "action-m4-carbine-family-ugo-registration-v1"),
    "army_nsn_6920_01_395_2949_m4_25m_zero": ("face-033", "ARMY_NSN_6920_01_395_2949_M4_AUTHORITY_v1", "army-nsn-6920-01-395-2949-m4-family-ugo-registration-v1"),
}


def image_evidence(path: Path) -> dict:
    raw = path.read_bytes()
    decoded = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert decoded is not None
    height, width = decoded.shape[:2]
    return {
        "sha256": hashlib.sha256(raw).hexdigest(),
        "widthPx": width,
        "heightPx": height,
        "dataUrl": f"data:image/jpeg;base64,{base64.b64encode(raw).decode('ascii')}",
    }


def registration_request(profile_id: str, version: str, package_id: str, asset: Path) -> dict:
    return {
        "registrationPackageId": package_id,
        "registrationPackageVersion": "1",
        "targetProfileId": profile_id,
        "targetProfileVersion": version,
        "imageEvidence": image_evidence(asset),
        "observations": [],
    }


def authority_payload(profile_id: str, version: str, package_id: str) -> dict:
    aim = {"xPercent": 50.0, "yPercent": 48.6}
    impacts = [
        {"xPercent": 54.0, "yPercent": 45.6, "shotId": f"shot-{index + 1}"}
        for index in range(3)
    ]
    return {
        "target_profile_id": profile_id,
        "targetProfileId": profile_id,
        "targetId": "MFAM_STANDARD_M4_FAMILY_UGO_TEMPLATE_v1",
        "targetName": profile_id,
        "aimCoordinate": aim,
        "impactCoordinates": impacts,
        "distance": {"value": 25, "unit": "m"},
        "phase": "initial",
        "adjustmentProfileId": "M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011",
        "shooterSetup": {
            "opticType": "Iron Sights",
            "adjustmentSystem": "M4_IRON_DCH_FSP",
            "equipmentConfigurationId": "M4-M4A1-DCH-FSP",
            "adjustmentProfileId": "M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011",
        },
        "precisionTapEvidence": {
            "schemaVersion": "sczn3-precision-tap-observations-v1",
            "observationAuthority": "shooter_declared",
            "coordinateConvention": "normalized_source_image_top_left",
            "registrationPackageId": package_id,
            "registrationPackageVersion": "1",
            "targetProfileId": profile_id,
            "targetProfileVersion": version,
            "imageEvidence": image_evidence(M4_TEMPLATE),
            "aimObservation": aim,
            "impactObservations": impacts,
        },
    }


def test_batch_disposition_is_seventeen_executable_eighteen_true_gaps():
    sweep = industry_authorization_sweep()
    assert sweep["counts"]["alreadyAuthorizedPhysicalFaces"] == 17
    assert sweep["counts"]["heldPhysicalFaces"] == 18
    assert {item["runtimeBinding"] for item in sweep["authorizedNow"]} == set(CASES)


def test_all_six_preserve_printer_face_identity_and_inherit_one_family():
    for profile_id, (face_id, _version, _package_id) in CASES.items():
        resolved = resolve_target_profile(profile_id)
        profile = TARGET_AUTHORITY_PROFILES[profile_id]
        assert resolved["inventoryFace"]["faceId"] == face_id
        assert profile["mfamAuthorityBinding"]["faceIdentity"]["faceId"] == face_id
        assert profile["mfamAuthorityBinding"]["faceIdentity"]["printerAuthorityPreserved"] is True
        assert resolved["binding"]["familyAuthorityPackageId"] == "MFAM-STANDARD-M16A4-M4-FAMILY-AUTHORITY-v1"
        assert resolved["binding"]["mechanicalAuthorityId"] == "M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011"
        assert resolved["binding"]["canonicalRepresentationAuthority"]["authorityScope"] == "UGO_GEOMETRY_TEMPLATE_NOT_PRODUCT_IDENTITY"


def test_family_ugo_registers_without_recasting_template_as_product_identity():
    for profile_id, (face_id, version, package_id) in CASES.items():
        result = register_target_image(registration_request(profile_id, version, package_id, M4_TEMPLATE))
        assert result["knowledgeState"] == "exact"
        assert result["orientationEvidence"]["status"] == "proven"
        assert result["canonicalRepresentation"]["role"] == "family_ugo_geometry_template_not_product_identity"
        assert result["productIdentityAuthority"]["faceId"] == face_id
        assert result["productIdentityAuthority"]["rule"] == "printer_authority_is_authority"


def test_genuinely_different_m16a2_geometry_still_fails_closed():
    profile_id, (face_id, version, package_id) = next(iter(CASES.items()))
    result = register_target_image(
        registration_request(profile_id, version, package_id, M16A2_DIFFERENT_GEOMETRY)
    )
    assert result["knowledgeState"] == "unavailable"
    assert result["reason"] in {"target_identity_unverified", "target_orientation_unverified", "target_geometry_unverified"}
    assert result["productIdentityAuthority"]["faceId"] == face_id


def test_all_six_release_the_same_governed_m4_mechanics_without_product_logic():
    for profile_id, (_face_id, version, package_id) in CASES.items():
        result = build_authority_package(authority_payload(profile_id, version, package_id))
        assert result["authorityAuditEnvelope"]["releaseStatus"] == "released"
        assert result["registrationClaimSufficiency"]["status"] == "sufficient"
        assert result["mechanicalSightAuthority"]["adjustmentProfileId"] == "M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011"
        assert result["clicks"]["windageClicks"] == 2
        assert result["clicks"]["elevationClicks"] == 1


def test_m16a4_faces_keep_their_true_mechanical_hold():
    for face_id in ("face-026", "face-028"):
        result = resolve_face_admission(face_id)
        assert result["disposition"] == "HOLD"
        assert result["missingFacts"] == ["governed M16A4 mechanical authority branch"]


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"M/FAM Printer Authority Sweep 07 tests passed: {len(tests)}/{len(tests)}")
