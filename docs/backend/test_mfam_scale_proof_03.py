#!/usr/bin/env python3
"""Scale Proof #3: one family authority, multiple exact product admissions."""
from __future__ import annotations

import base64
import hashlib
from copy import deepcopy
from pathlib import Path

import cv2
import numpy as np

from mfam_family_authority import resolve_face_admission, resolve_target_profile
from mfam_family_conformance import run_family_admission_batch, scale_proof
from m4_authority.authority_service import build_authority_package
from session_authority import prepare_session
from target_image_registration_authority import register_target_image


DOCS = Path(__file__).resolve().parents[1]
CONTRACT_ID = "MFAM-STANDARD-M16A2-A3-FAMILY-CONFORMANCE-v1"
FAMILY_PACKAGE_ID = "MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1"
CANDIDATE_FACES = [
    "face-006", "face-013", "face-016", "face-018",
    "face-020", "face-025", "face-027", "face-032",
]
PROFILES = {
    "baker_m16a2_25m_zero": (
        "baker-m16a2-25m-photo-registration-v1",
        "BAKER_M16A2_25M_AUTHORITY_v1",
        DOCS / "assets" / "BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg",
    ),
    "speedwell_dodm4_m16a2_25m_zero": (
        "speedwell-dodm4-m16a2-photo-registration-v1",
        "SPEEDWELL_DODM4_M16A2_AUTHORITY_v1",
        DOCS / "assets" / "SPEEDWELL_M16A2_PUBLISHER_FACE_AUTHORITY_v1.jpg",
    ),
    "army_nsn_6920_01_395_2949_m16a2_25m_zero": (
        "army-nsn-6920-01-395-2949-m16a2-photo-registration-v1",
        "ARMY_NSN_6920_01_395_2949_M16A2_AUTHORITY_v1",
        DOCS / "authority-evidence" / "mfam" / "industry-sweep-2026-09-06" / "scale-proof-03" / "ARMY_FM_3_22_9_FIGURE_5_19_M16A2_FACE.png",
    ),
}


class Store:
    def __init__(self):
        self.preparations = {}

    def save_preparation(self, record):
        self.preparations[record["tokenHash"]] = deepcopy(record)


def image_evidence(path: Path, *, rotate_180: bool = False) -> dict:
    raw = path.read_bytes()
    decoded = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert decoded is not None
    if rotate_180:
        decoded = cv2.rotate(decoded, cv2.ROTATE_180)
        suffix = ".jpg" if path.suffix.lower() in {".jpg", ".jpeg"} else ".png"
        ok, encoded = cv2.imencode(suffix, decoded)
        assert ok
        raw = encoded.tobytes()
    height, width = decoded.shape[:2]
    media_type = "image/jpeg" if path.suffix.lower() in {".jpg", ".jpeg"} else "image/png"
    return {
        "sha256": hashlib.sha256(raw).hexdigest(),
        "widthPx": width,
        "heightPx": height,
        "dataUrl": f"data:{media_type};base64,{base64.b64encode(raw).decode('ascii')}",
    }


def registration_payload(profile_id: str, *, rotate_180: bool = False) -> dict:
    package_id, version, path = PROFILES[profile_id]
    return {
        "registrationPackageId": package_id,
        "registrationPackageVersion": "1",
        "targetProfileId": profile_id,
        "targetProfileVersion": version,
        "imageEvidence": image_evidence(path, rotate_180=rotate_180),
        "observations": [],
    }


def authority_payload(profile_id: str) -> dict:
    package_id, version, path = PROFILES[profile_id]
    binding = resolve_target_profile(profile_id)["binding"]
    representation = binding["canonicalRepresentationAuthority"]
    aim = representation["aimCoordinate"]
    impacts = [
        {"xPercent": aim["xPercent"] + 4.0, "yPercent": aim["yPercent"] + 3.0, "shotId": "shot-1"},
        {"xPercent": aim["xPercent"] + 4.5, "yPercent": aim["yPercent"] + 2.5, "shotId": "shot-2"},
        {"xPercent": aim["xPercent"] + 3.5, "yPercent": aim["yPercent"] + 3.5, "shotId": "shot-3"},
    ]
    evidence = image_evidence(path)
    return {
        "target_profile_id": profile_id,
        "targetProfileId": profile_id,
        "targetId": representation["targetId"],
        "targetName": "Standard M16A2 family scale proof",
        "aimCoordinate": aim,
        "impactCoordinates": impacts,
        "distance": {"value": 25, "unit": "m"},
        "phase": "initial",
        "zeroingMission": {"confirmationMinimumShots": 3, "confirmationResidualToleranceInches": 1},
        "adjustmentProfileId": "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011",
        "shooterSetup": {
            "opticType": "Iron Sights",
            "adjustmentSystem": "M16A2_IRON_FSP_REAR_DRUM",
            "equipmentConfigurationId": "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
            "adjustmentProfileId": "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011",
        },
        "precisionTapEvidence": {
            "schemaVersion": "sczn3-precision-tap-observations-v1",
            "observationAuthority": "shooter_declared",
            "coordinateConvention": "normalized_source_image_top_left",
            "registrationPackageId": package_id,
            "registrationPackageVersion": "1",
            "targetProfileId": profile_id,
            "targetProfileVersion": version,
            "imageEvidence": evidence,
            "aimObservation": aim,
            "impactObservations": impacts,
        },
    }


def test_eight_candidates_run_through_one_contract_and_two_are_admitted():
    batch = run_family_admission_batch(CONTRACT_ID, CANDIDATE_FACES)
    assert batch["candidatesEvaluated"] == 8
    assert {record["faceId"] for record in batch["admitted"]} == {"face-020", "face-032"}
    assert {record["faceId"] for record in batch["hold"]} == {
        "face-006", "face-013", "face-016", "face-018", "face-025", "face-027",
    }
    proof = scale_proof()
    assert proof["familyLeverage"] == 3.0
    assert proof["admissionLeverage"] == 2.0
    assert proof["counts"]["productSpecificZeroingImplementations"] == 0
    assert proof["counts"]["universalZeroingRoadsAdded"] == 0


def test_three_products_share_one_family_package_but_retain_exact_identity():
    resolved = {profile_id: resolve_target_profile(profile_id) for profile_id in PROFILES}
    assert {
        record["binding"]["familyAuthorityPackageId"] for record in resolved.values()
    } == {FAMILY_PACKAGE_ID}
    assert len({record["binding"]["productId"] for record in resolved.values()}) == 3
    assert len({record["binding"]["registrationPackageId"] for record in resolved.values()}) == 3
    assert len({record["binding"]["canonicalRepresentationAuthority"]["sourceAssetSha256"] for record in resolved.values()}) == 3
    assert {
        record["binding"]["mechanicalAuthorityId"] for record in resolved.values()
    } == {"M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"}


def test_new_profiles_enter_the_same_backend_zeroing_capability():
    for profile_id in (
        "speedwell_dodm4_m16a2_25m_zero",
        "army_nsn_6920_01_395_2949_m16a2_25m_zero",
    ):
        prepared = prepare_session({"targetId": profile_id}, Store())
        assert prepared["zeroingExperience"]["capabilityId"] == "sczn3-governed-zeroing-road-v1"
        assert prepared["mfamAuthorityBinding"]["familyAuthorityPackageId"] == FAMILY_PACKAGE_ID
        assert prepared["mfamAuthorityBinding"]["productIdentity"]["inventoryFaceId"] in {"face-020", "face-032"}
        assert prepared["standardSetup"]["adjustmentProfileId"] == "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
        assert prepared["confirmationAuthority"]["minimumShots"] == 3


def test_new_profiles_release_governed_correction_through_shared_mechanics():
    for profile_id in (
        "speedwell_dodm4_m16a2_25m_zero",
        "army_nsn_6920_01_395_2949_m16a2_25m_zero",
    ):
        package = build_authority_package(authority_payload(profile_id))
        assert package["status"]["hasMechanicalRecommendation"] is True
        assert package["clicks"]["windageClicks"] == 2
        assert package["clicks"]["windageDirection"] == "LEFT"
        assert package["clicks"]["elevationClicks"] == 1
        assert package["clicks"]["elevationDirection"] == "UP"
        assert package["clicks"]["model"]["authorityId"] == "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"


def test_each_exact_representation_registers_and_rotated_source_must_prove_axes():
    for profile_id in PROFILES:
        accepted = register_target_image(registration_payload(profile_id))
        assert accepted["knowledgeState"] == "exact"
        assert accepted["registrationMethod"] == "exact_canonical_representation"
        if profile_id == "baker_m16a2_25m_zero":
            continue
        rotated = register_target_image(registration_payload(profile_id, rotate_180=True))
        assert rotated["knowledgeState"] == "estimated"
        assert rotated["orientationEvidence"]["status"] == "proven"
        assert rotated["orientationEvidence"]["axesProven"] == ["TOP", "BOTTOM", "LEFT", "RIGHT"]
        assert rotated["orientationEvidence"]["sourceAxisMapping"] == {
            "sourceRightMapsToCanonical": "LEFT",
            "sourceDownMapsToCanonical": "UP",
        }


def test_face_admission_preserves_exact_publisher_product_face_binding():
    speedwell = resolve_face_admission("face-020")
    army = resolve_face_admission("face-032")
    assert speedwell["runtimeBinding"] == "speedwell_dodm4_m16a2_25m_zero"
    assert speedwell["publisherAuthorityId"] == "publisher-speedwell"
    assert army["runtimeBinding"] == "army_nsn_6920_01_395_2949_m16a2_25m_zero"
    assert army["publisherAuthorityId"] == "publisher-us-army"
    assert speedwell["targetState"] == army["targetState"] == "KNOWN_TARGET_EXECUTION_AUTHORIZED"


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_") and callable(value)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"M/FAM Scale Proof #3 tests passed: {len(tests)}/{len(tests)}")
