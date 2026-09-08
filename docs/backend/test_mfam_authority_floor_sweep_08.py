#!/usr/bin/env python3
"""Authority-floor Sweep 08: shared gaps, shared solutions, no face-level bureaucracy."""
from __future__ import annotations

import json
from pathlib import Path

from mfam_family_authority import (
    INVENTORY_AUDIT_PATH,
    REGISTRY_PATH,
    family_scale_proof,
    registry_metadata,
    resolve_face_admission,
    resolve_target_profile,
)
from session_authority import TARGET_AUTHORITY_PROFILES


NEW_M16A4_BINDINGS = {
    "gunfun_32110_m16a4_red_25m_zero": "face-026",
    "gunfun_32120_m16a4_green_25m_zero": "face-028",
}
BACKEND = Path(__file__).resolve().parent


def test_every_remaining_hold_has_one_reusable_root_cause():
    metadata = registry_metadata()
    groups = metadata["rootAuthorityGaps"]
    grouped = [face_id for group in groups for face_id in group["faceIds"]]
    inventory = json.loads(INVENTORY_AUDIT_PATH.read_text(encoding="utf-8"))
    held = [face["faceId"] for face in inventory["faces"] if not face["runtimeBinding"]]
    assert len(groups) == 7
    assert len(grouped) == len(set(grouped)) == 13
    assert set(grouped) == set(held)
    assert all(group["sharedMissingAuthority"] for group in groups)
    assert all(group["whyUGOCannotExecute"] for group in groups)


def test_m16a4_authority_is_one_family_branch_not_two_product_packages():
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    authority_id = "M16A4-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
    authority = next(item for item in registry["mechanicalAuthorities"] if item["mechanicalAuthorityId"] == authority_id)
    assert authority["status"] == "GOVERNED"
    controls = {item["axis"]: item for item in authority["controls"] if item["axis"] in {"elevation", "windage"}}
    assert controls["elevation"]["movementPerClick"] == 1.25
    assert controls["windage"]["movementPerClick"] == 0.5
    package = next(item for item in registry["familyAuthorityPackages"] if item["familyId"] == "mfam_m16a4_m4_standard_25m_300m")
    assert authority_id in package["mechanicalAuthorityIds"]
    assert len([item for item in registry["mechanicalAuthorities"] if item["mechanicalAuthorityId"] == authority_id]) == 1


def test_two_printer_faces_inherit_one_branch_and_one_universal_road():
    for profile_id, face_id in NEW_M16A4_BINDINGS.items():
        resolved = resolve_target_profile(profile_id)
        profile = TARGET_AUTHORITY_PROFILES[profile_id]
        assert resolved["binding"]["inventoryFaceId"] == face_id
        assert resolved["binding"]["familyAuthorityPackageId"] == "MFAM-STANDARD-M16A4-M4-FAMILY-AUTHORITY-v1"
        assert resolved["binding"]["mechanicalAuthorityId"] == "M16A4-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
        assert resolved["binding"]["canonicalRepresentationAuthority"]["authorityScope"] == "UGO_GEOMETRY_TEMPLATE_NOT_PRODUCT_IDENTITY"
        assert resolved["binding"]["canonicalRepresentationAuthority"]["productIdentityAuthority"]["faceId"] == face_id
        assert profile["zeroingExperience"]["capabilityId"] == "sczn3-governed-zeroing-road-v1"
        assert profile["equipmentRequirements"]["modelFamilies"] == ["M16A4"]


def test_registration_packages_keep_printer_identity_separate_from_family_ugo():
    registry = json.loads(
        (BACKEND / "registries" / "target_image_registration_packages.json").read_text(encoding="utf-8")
    )
    packages = {item["targetProfileId"]: item for item in registry["packages"]}
    for profile_id, face_id in NEW_M16A4_BINDINGS.items():
        package = packages[profile_id]
        assert package["productIdentityAuthority"]["faceId"] == face_id
        assert package["productIdentityAuthority"]["rule"] == "printer_authority_is_authority"
        assert package["canonicalRepresentation"]["role"] == "family_ugo_geometry_template_not_product_identity"
        assert package["ugoAuthorityId"] == "MFAM-STANDARD-M16A4-M4-13CM-14X16-GEOMETRY-v1"
        assert package["orientationProof"]["requiredForGovernedDirection"] is True


def test_current_sweep_counts_and_scale_are_exact():
    proof = family_scale_proof("MFAM-AUTHORITY-FLOOR-SWEEP-08")
    assert proof["counts"]["newlyExecutableThroughInheritance"] == 2
    assert proof["counts"]["totalExecutableBindingsAfterProof"] == 9
    assert proof["counts"]["productSpecificZeroingImplementationsCreated"] == 0
    assert proof["counts"]["universalZeroingRoadsCreated"] == 0
    assert proof["batchSummary"]["remainingHeldPhysicalFaces"] == 16
    assert proof["batchSummary"]["endingExecutablePhysicalFaces"] == 19
    assert registry_metadata()["authorizationSweep"]["counts"] == {
        "authorizedNowRuntimeBindings": 3,
        "alreadyAuthorizedRuntimeBindings": 20,
        "alreadyAuthorizedPhysicalFaces": 22,
        "heldPhysicalFaces": 13,
        "knownHeldFacesWithAuthorizedGeometry": 3,
        "heldFacesAssignedToCandidateFamily": 9,
        "heldFacesUnassigned": 4,
        "candidateFamilies": 9,
    }


def test_known_held_face_reports_shared_root_gap_not_generic_photo_failure():
    result = resolve_face_admission("face-001")
    assert result["targetState"] == "KNOWN_TARGET_GEOMETRY_AUTHORIZED"
    assert result["rootAuthorityGap"]["gapId"] == "MFAM-ROOT-GAP-MODERN-TRUE-DISTANCE-COMPLETION-v1"
    assert "true-distance" in result["rootAuthorityGap"]["sharedMissingAuthority"]
    assert result["shooterRecovery"]["title"] == "THIS TARGET IS KNOWN"
    assert "true-distance" in result["shooterRecovery"]["message"]
    assert "production-ready registration" not in result["shooterRecovery"]["message"]


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"M/FAM Authority Floor Sweep 08 tests passed: {len(tests)}/{len(tests)}")
