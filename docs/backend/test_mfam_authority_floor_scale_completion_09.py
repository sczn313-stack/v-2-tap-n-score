#!/usr/bin/env python3
"""Authority-floor completion: batch unlocks, exact UGO boundaries, one road."""
from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np

from m4_authority.authority_service import build_authority_package
from mfam_family_authority import REGISTRY_PATH, inventory_audit, registry_metadata, resolve_target_profile
from session_authority import TARGET_AUTHORITY_PROFILES, standard_setup_for
from target_image_registration_authority import register_target_image


DOCS = Path(__file__).resolve().parents[1]
NEW = {
    "action_m16_m16a2_25m_zero": "face-022",
    "gunfun_22460_embedded_m4_25m_zero": "face-030",
    "army_nsn_6920_01_167_1392_m16a1_25m_zero": "face-031",
}


def evidence(path: Path) -> dict:
    raw = path.read_bytes()
    image = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert image is not None
    height, width = image.shape[:2]
    media = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    return {
        "sha256": hashlib.sha256(raw).hexdigest(),
        "widthPx": width,
        "heightPx": height,
        "dataUrl": f"data:{media};base64,{base64.b64encode(raw).decode('ascii')}",
    }


def test_batch_counts_and_root_gaps_are_exact():
    meta = registry_metadata()
    assert meta["authorizationSweep"]["counts"] == {
        "authorizedNowRuntimeBindings": 3,
        "alreadyAuthorizedRuntimeBindings": 20,
        "alreadyAuthorizedPhysicalFaces": 22,
        "heldPhysicalFaces": 13,
        "knownHeldFacesWithAuthorizedGeometry": 3,
        "heldFacesAssignedToCandidateFamily": 9,
        "heldFacesUnassigned": 4,
        "candidateFamilies": 9,
    }
    assert len(meta["rootAuthorityGaps"]) == 7
    assert sum(len(gap["faceIds"]) for gap in meta["rootAuthorityGaps"]) == 13


def test_three_new_faces_inherit_one_universal_road_without_product_workflows():
    audit = {face["faceId"]: face for face in inventory_audit()["faces"]}
    for profile_id, face_id in NEW.items():
        resolved = resolve_target_profile(profile_id)
        profile = TARGET_AUTHORITY_PROFILES[profile_id]
        assert resolved["binding"]["inventoryFaceId"] == face_id
        assert audit[face_id]["runtimeBinding"] == profile_id
        assert profile["zeroingExperience"]["capabilityId"] == "sczn3-governed-zeroing-road-v1"
        assert standard_setup_for(profile)["equipmentFingerprint"]


def test_action_m16_keeps_printer_identity_and_requires_family_ugo():
    resolved = resolve_target_profile("action_m16_m16a2_25m_zero")
    representation = resolved["binding"]["canonicalRepresentationAuthority"]
    assert representation["authorityScope"] == "UGO_GEOMETRY_TEMPLATE_NOT_PRODUCT_IDENTITY"
    assert representation["productIdentityAuthority"] == {
        "publisher": "Action Target", "faceId": "face-022", "sourceIds": ["ACTION-M4-CARBINE"]
    }
    assert resolved["binding"]["mechanicalAuthorityId"] == "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"


def test_gunfun_composite_exact_representation_registers_only_embedded_m4_subface():
    path = DOCS / "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22460.jpg"
    result = register_target_image({
        "registrationPackageId": "gunfun-22460-embedded-m4-subface-registration-v1",
        "registrationPackageVersion": "1",
        "targetProfileId": "gunfun_22460_embedded_m4_25m_zero",
        "targetProfileVersion": "GUNFUN_22460_EMBEDDED_M4_AUTHORITY_v1",
        "imageEvidence": evidence(path),
        "observations": [{"observationId": "aim", "role": "aim", "xNorm": .25, "yNorm": .697865353}],
    })
    assert result["knowledgeState"] == "exact"
    product = resolve_target_profile("gunfun_22460_embedded_m4_25m_zero")["product"]
    assert "qualification scoring" in product["notes"][0]


def test_army_m16a1_exact_face_registers_and_direct_grid_releases_clicks():
    path = DOCS / "authority-evidence/mfam/industry-sweep-2026-09-06/authority-floor-scale-completion-09/ARMY_FM_3_22_9_FIGURE_5_18_M16A1_FACE.png"
    result = register_target_image({
        "registrationPackageId": "army-m16a1-figure-5-18-photo-registration-v1",
        "registrationPackageVersion": "1",
        "targetProfileId": "army_nsn_6920_01_167_1392_m16a1_25m_zero",
        "targetProfileVersion": "ARMY_M16A1_FIGURE_5_18_AUTHORITY_v1",
        "imageEvidence": evidence(path),
        "observations": [{"observationId": "aim", "role": "aim", "xNorm": .5075528701, "yNorm": .4562171629}],
    })
    assert result["knowledgeState"] == "exact"
    authority = build_authority_package({
        "targetProfileId": "army_nsn_6920_01_167_1392_m16a1_25m_zero",
        "aimCoordinate": {"xPercent": 50.7552870091, "yPercent": 45.6217162872},
        "impactCoordinates": [
            {"shotId": "one", "xPercent": 40.0, "yPercent": 48.0},
            {"shotId": "two", "xPercent": 40.1, "yPercent": 48.1},
            {"shotId": "three", "xPercent": 39.9, "yPercent": 47.9},
        ],
        "distance": {"value": 25, "unit": "m"},
    })
    assert authority["clicks"]["model"]["unit"] == "GRID_INTERVAL"
    assert authority["calculationReconciliation"]["status"] == "reconciled"
    assert authority["status"]["hasMechanicalRecommendation"] is True
    assert authority["score"]["status"] == "unavailable"
    assert authority["score"]["method"] == "issuer-printed-click-grid-no-score-v1"
    assert authority["correction"]["impactOffset"]["unit"] == "GRID_INTERVAL"
    assert authority["correction"]["impactOffsetInches"] is None
    assert authority["angular"]["windageMOA"] is None

    confirmation = build_authority_package({
        "targetProfileId": "army_nsn_6920_01_167_1392_m16a1_25m_zero",
        "phase": "confirmation",
        "aimCoordinate": {"xPercent": 50.7552870091, "yPercent": 45.6217162872},
        "impactCoordinates": [
            {"shotId": "confirm-one", "xPercent": 43.8, "yPercent": 44.9},
            {"shotId": "confirm-two", "xPercent": 44.2, "yPercent": 44.5},
            {"shotId": "confirm-three", "xPercent": 44.0, "yPercent": 44.7},
        ],
        "distance": {"value": 25, "unit": "m"},
    })
    assert confirmation["validation"]["outcome"] == "CONFIRMED"
    assert confirmation["validation"]["residualUnit"] == "GRID_INTERVAL"
    assert confirmation["validation"]["residualOffsetInches"] is None
    assert confirmation["group"]["unit"] == "GRID_INTERVAL"
    assert confirmation["zeroingMission"]["confirmationResidualTolerance"] == {
        "value": 2.75,
        "unit": "GRID_INTERVAL",
        "basis": "issuer-printed zero region on the exact registered face",
    }


def test_remaining_holds_are_only_exact_truth_gaps():
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    prohibited = ("ink archaeology", "paper archaeology", "independent re-proof")
    for gap in registry["rootAuthorityGaps"]:
        assert "genuinely unknown" in gap["whyUGOCannotExecute"] or gap["gapId"].endswith("TRUE-DISTANCE-COMPLETION-v1")
        assert not any(term in gap["sharedMissingAuthority"].lower() for term in prohibited)


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"M/FAM Authority Floor Scale Completion 09 tests passed: {len(tests)}/{len(tests)}")
