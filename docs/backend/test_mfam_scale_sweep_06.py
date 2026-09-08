#!/usr/bin/env python3
"""Regression proof for the cross-family M/FAM batch admission sweep."""
from __future__ import annotations

import base64
import hashlib
from pathlib import Path

import cv2
import numpy as np

from m4_authority.authority_service import build_authority_package
from mfam_family_authority import industry_authorization_sweep, resolve_target_profile
from target_image_registration_authority import register_target_image


DOCS = Path(__file__).resolve().parents[1]
CASES = {
    "baker_m4_25m_zero": {
        "asset": DOCS / "assets" / "BAKER_ST_M16A2_M4_M4_FACE_AUTHORITY_v1.jpg",
        "version": "BAKER_M4_25M_AUTHORITY_v1",
        "coordinateSystem": "BAKER_ST_M16A2_M4_M4_FACE_AUTHORITY_v1",
        "registration": "baker-st-m16a2-m4-m4-photo-registration-v1",
        "family": "MFAM-STANDARD-M16A4-M4-FAMILY-AUTHORITY-v1",
        "mechanics": "M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011",
        "system": "M4_IRON_DCH_FSP",
        "equipment": "M4-M4A1-DCH-FSP",
        "aim": {"xPercent": 50.0, "yPercent": 48.6},
        "expectedClicks": {"windageClicks": 2, "elevationClicks": 1},
    },
    "gunfun_82020_m16a2_25m_zero": {
        "asset": DOCS / "assets" / "GUNFUN_82020_M16A2_FACE_AUTHORITY_v1.jpg",
        "version": "GUNFUN_82020_M16A2_AUTHORITY_v1",
        "coordinateSystem": "GUNFUN_82020_M16A2_FACE_AUTHORITY_v1",
        "registration": "gunfun-82020-m16a2-photo-registration-v1",
        "family": "MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1",
        "mechanics": "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011",
        "system": "M16A2_IRON_FSP_REAR_DRUM",
        "equipment": "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
        "aim": {"xPercent": 49.625, "yPercent": 50.08741258741259},
        "expectedClicks": {"windageClicks": 4, "elevationClicks": 2},
    },
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


def registration_request(profile_id: str, case: dict, evidence: dict) -> dict:
    return {
        "registrationPackageId": case["registration"],
        "registrationPackageVersion": "1",
        "targetProfileId": profile_id,
        "targetProfileVersion": case["version"],
        "imageEvidence": evidence,
        "observations": [],
    }


def authority_payload(profile_id: str, case: dict) -> dict:
    aim = case["aim"]
    impacts = [
        {
            "xPercent": aim["xPercent"] + 4,
            "yPercent": aim["yPercent"] - 3,
            "shotId": f"shot-{index + 1}",
        }
        for index in range(3)
    ]
    evidence = image_evidence(case["asset"])
    precision = {
        "schemaVersion": "sczn3-precision-tap-observations-v1",
        "observationAuthority": "shooter_declared",
        "coordinateConvention": "normalized_source_image_top_left",
        "registrationPackageId": case["registration"],
        "registrationPackageVersion": "1",
        "targetProfileId": profile_id,
        "targetProfileVersion": case["version"],
        "imageEvidence": evidence,
        "aimObservation": aim,
        "impactObservations": impacts,
    }
    return {
        "target_profile_id": profile_id,
        "targetProfileId": profile_id,
        "targetId": case["coordinateSystem"],
        "targetName": profile_id,
        "aimCoordinate": aim,
        "impactCoordinates": impacts,
        "distance": {"value": 25, "unit": "m"},
        "phase": "initial",
        "adjustmentProfileId": case["mechanics"],
        "shooterSetup": {
            "opticType": "Iron Sights",
            "adjustmentSystem": case["system"],
            "equipmentConfigurationId": case["equipment"],
            "adjustmentProfileId": case["mechanics"],
        },
        "precisionTapEvidence": precision,
    }


def test_latest_batch_counts_and_zero_duplicate_roads():
    sweep = industry_authorization_sweep()
    assert sweep["counts"]["authorizedNowRuntimeBindings"] == 6
    assert sweep["counts"]["heldPhysicalFaces"] == 18
    assert {
        item["runtimeBinding"] for item in sweep["authorizedNow"]
    } == {
        "rite_9125_m4_25m_zero", "national_23075_m4_25m_zero",
        "qualification_m4_25m_zero", "speedwell_dodm4_m4_25m_zero",
        "action_m4_carbine_25m_zero", "army_nsn_6920_01_395_2949_m4_25m_zero",
    }


def test_each_new_face_inherits_the_correct_family_package():
    for profile_id, case in CASES.items():
        resolved = resolve_target_profile(profile_id)
        assert resolved["binding"]["familyAuthorityPackageId"] == case["family"]
        assert resolved["binding"]["mechanicalAuthorityId"] == case["mechanics"]
        assert resolved["familyAuthorityPackage"]["universalZeroingCapabilityId"] == "sczn3-governed-zeroing-road-v1"


def test_exact_representations_register_and_cross_product_substitution_fails():
    for profile_id, case in CASES.items():
        result = register_target_image(
            registration_request(profile_id, case, image_evidence(case["asset"]))
        )
        assert result["knowledgeState"] == "exact"
        assert result["registrationMethod"] == "exact_canonical_representation"
        assert result["orientationEvidence"]["status"] == "proven"

    profile_ids = list(CASES)
    left, right = profile_ids
    wrong = register_target_image(
        registration_request(left, CASES[left], image_evidence(CASES[right]["asset"]))
    )
    assert wrong["knowledgeState"] == "unavailable"
    assert wrong["reason"] in {"target_identity_unverified", "target_orientation_unverified"}


def test_family_mechanics_release_governed_clicks_without_product_logic():
    for profile_id, case in CASES.items():
        result = build_authority_package(authority_payload(profile_id, case))
        assert result["authorityAuditEnvelope"]["releaseStatus"] == "released"
        assert result["registrationClaimSufficiency"]["status"] == "sufficient"
        assert result["mechanicalSightAuthority"]["adjustmentProfileId"] == case["mechanics"]
        assert result["clicks"]["windageClicks"] == case["expectedClicks"]["windageClicks"]
        assert result["clicks"]["elevationClicks"] == case["expectedClicks"]["elevationClicks"]
        assert result["clicks"]["windageDirection"] == "LEFT"
        assert result["clicks"]["elevationDirection"] == "DOWN"


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"M/FAM Scale Sweep 06 tests passed: {len(tests)}/{len(tests)}")
