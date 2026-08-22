"""Fail-first Episode 55 tests for backend-authoritative SL-ST2 timed practice."""
from __future__ import annotations

import base64
import hashlib
from copy import deepcopy
from pathlib import Path

import cv2
import numpy as np

from baker_sl_st2_idpa_authority import BakerSLST2AuthorityError, analyze_baker_sl_st2_evidence


ROOT = Path(__file__).resolve().parents[1]
REPRESENTATION = ROOT / "authority-evidence" / "baker-sl-st2" / "BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.jpeg"
REPRESENTATION_SHA256 = "9fb11d843c09336bce46e93a7c163eb9f8653e439ad0f4950d419d75d7faf5e9"
WIDTH = 1074
HEIGHT = 1393


def impact(x_px, y_px, **claims):
    return {"xNorm": x_px / (WIDTH - 1), "yNorm": y_px / (HEIGHT - 1), **claims}


INTERIORS = {
    "head_zero": impact(531, 255),
    "head_one": impact(610, 165),
    "torso_zero": impact(531, 644),
    "torso_one": impact(530, 895),
    "torso_three": impact(238, 765),
    "outside": impact(100, 650),
}


def payload(impacts, *, raw_time="8.50", affirmed=True):
    image_bytes = REPRESENTATION.read_bytes()
    return {
        "targetProfileId": "idpa_silhouette_sl_st2",
        "targetProfileVersion": "1",
        "targetId": "BAKER_SL_ST2",
        "variantId": "BAKER_SL_ST2_23X35_STANDARD_WHITE",
        "missionAuthorityId": "SCZN3_SL_ST2_TIMED_PAIR_7YD_V1",
        "rulesAuthorityId": "IDPA_RULEBOOK_2026_2",
        "reportedRawTime": raw_time,
        "rawTimeSource": "manual_shot_timer_entry",
        "evidenceCompletenessAffirmed": affirmed,
        "imageEvidence": {
            "sha256": REPRESENTATION_SHA256,
            "mediaType": "image/jpeg",
            "widthPx": WIDTH,
            "heightPx": HEIGHT,
            "dataUrl": "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode("ascii"),
        },
        "impacts": impacts,
        # Untrusted presentation claims must never influence authority.
        "zone": "down_zero",
        "pointsDown": -999,
        "selectedImpactIds": ["attacker-choice"],
        "finalTime": "0.00",
    }


def perspective_payload(canonical_points):
    source = cv2.imread(str(REPRESENTATION), cv2.IMREAD_COLOR)
    source_corners = np.float32([[0, 0], [WIDTH - 1, 0], [WIDTH - 1, HEIGHT - 1], [0, HEIGHT - 1]])
    output_corners = np.float32([[160, 110], [1120, 190], [1060, 1510], [205, 1450]])
    transform = cv2.getPerspectiveTransform(source_corners, output_corners)
    photo = cv2.warpPerspective(source, transform, (1280, 1600), borderValue=(42, 42, 42))
    encoded_ok, encoded = cv2.imencode(".jpg", photo, [cv2.IMWRITE_JPEG_QUALITY, 94])
    assert encoded_ok
    image_bytes = encoded.tobytes()
    projected = cv2.perspectiveTransform(np.float32([canonical_points]), transform)[0]
    data = payload([], raw_time="6.75")
    data["imageEvidence"] = {
        "sha256": hashlib.sha256(image_bytes).hexdigest(),
        "mediaType": "image/jpeg",
        "widthPx": 1280,
        "heightPx": 1600,
        "dataUrl": "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode("ascii"),
    }
    data["impacts"] = [impact_data for impact_data in (
        {"xNorm": float(point[0]) / 1279, "yNorm": float(point[1]) / 1599}
        for point in projected
    )]
    return data


def expect_rejection(data, reason):
    try:
        analyze_baker_sl_st2_evidence(data)
    except BakerSLST2AuthorityError as exc:
        assert exc.reason == reason, (exc.reason, reason)
    else:
        raise AssertionError(f"Expected fail-closed rejection: {reason}")


def run():
    result = analyze_baker_sl_st2_evidence(payload([
        INTERIORS["torso_three"],
        INTERIORS["head_zero"],
        INTERIORS["torso_one"],
        INTERIORS["torso_zero"],
    ]))
    assert result["resultPackageType"] == "idpaTimeScoreResult"
    assert result["authoritySource"] == "backend-authoritative"
    assert [item["classification"] for item in result["impacts"]] == [
        "down_three", "down_zero", "down_one", "down_zero"
    ]
    assert result["scoredSelection"]["selectedImpactIds"] == ["impact-002", "impact-004"]
    assert result["scoredSelection"]["excludedImpactIds"] == ["impact-003", "impact-001"]
    assert result["scoring"] == {
        "status": "complete",
        "objective": "lowest_time_wins",
        "reportedRawTime": "8.50",
        "pointsDown": 0,
        "pointsDownTime": "0.00",
        "finalTime": "8.50",
        "breakdown": [
            {"classification": "down_zero", "label": "0 down", "count": 2, "pointsDownValue": 0, "pointsDownSubtotal": "0", "timeSubtotal": "0.00"},
            {"classification": "down_one", "label": "-1", "count": 0, "pointsDownValue": 1, "pointsDownSubtotal": "0", "timeSubtotal": "0.00"},
            {"classification": "down_three", "label": "-3", "count": 0, "pointsDownValue": 3, "pointsDownSubtotal": "0", "timeSubtotal": "0.00"},
            {"classification": "outside", "label": "Outside", "count": 0, "pointsDownValue": 5, "pointsDownSubtotal": "0", "timeSubtotal": "0.00"},
        ],
    }
    assert result["reconciliation"]["capturedImpactCount"] == 4
    assert result["reconciliation"]["selectedImpactCount"] == 2
    assert result["reconciliation"]["requiredImpactCount"] == 2
    assert result["imageEvidence"]["backendHashVerified"] is True
    assert result["imageEvidence"]["targetIdentityVerifiedFromImage"] is True
    assert result["authorityTrace"]["classificationAuthority"] == "backend"
    assert result["authorityTrace"]["ugoAuthorityId"] == "UGO_BAKER_SL_ST2_23X35_TARGET_PLANE_V1"
    assert result["authorityTrace"]["missionAuthorityId"] == "SCZN3_SL_ST2_TIMED_PAIR_7YD_V1"
    assert result["evidenceIdentity"].startswith("SLST2-EVIDENCE-")
    assert len(result["evidenceHash"]) == 64
    assert result["resultIdentity"].startswith("SLST2-RESULT-")
    assert len(result["resultHash"]) == 64
    assert result["authorityTrace"]["rulesAuthorityId"] == "IDPA_RULEBOOK_2026_2"

    one_each = analyze_baker_sl_st2_evidence(payload([
        INTERIORS["head_zero"], INTERIORS["head_one"], INTERIORS["torso_three"], INTERIORS["outside"]
    ], raw_time="10.25"))
    assert [item["pointsDown"] for item in one_each["impacts"]] == [0, 1, 3, 5]
    assert one_each["scoring"]["breakdown"][1]["timeSubtotal"] == "1.00"
    assert one_each["scoring"]["pointsDown"] == 1
    assert one_each["scoring"]["finalTime"] == "11.25"

    registered = analyze_baker_sl_st2_evidence(perspective_payload([[531, 255], [238, 765], [531, 644]]))
    assert registered["registration"]["method"] == "ugo_sift_homography_v1"
    assert registered["imageEvidence"]["targetIdentityVerifiedFromImage"] is True
    assert [item["classification"] for item in registered["impacts"]] == ["down_zero", "down_three", "down_zero"]
    assert registered["scoring"]["finalTime"] == "6.75"
    assert registered["registration"]["reprojectionRmsPx"] <= 6

    # Stable ties resolve by evidence-entry order, never client selection.
    tie = analyze_baker_sl_st2_evidence(payload([
        deepcopy(INTERIORS["torso_one"]), deepcopy(INTERIORS["head_one"]), deepcopy(INTERIORS["torso_one"])
    ], raw_time="3.1"))
    assert tie["scoredSelection"]["selectedImpactIds"] == ["impact-001", "impact-002"]
    assert tie["scoring"]["finalTime"] == "5.10"

    expect_rejection(payload([INTERIORS["head_zero"]]), "at_least_two_determinate_impacts_required")
    expect_rejection(payload([INTERIORS["head_zero"], INTERIORS["torso_zero"]], affirmed=False), "evidence_completeness_required")
    expect_rejection(payload([INTERIORS["head_zero"], INTERIORS["torso_zero"]], raw_time="-1"), "reported_raw_time_invalid")
    expect_rejection(payload([INTERIORS["head_zero"], INTERIORS["torso_zero"]], raw_time="1.234"), "reported_raw_time_precision_unsupported")

    mismatch = payload([INTERIORS["head_zero"], INTERIORS["torso_zero"]])
    mismatch["variantId"] = "BAKER_SL_ST2_17_5X23_HEAVYWEIGHT"
    expect_rejection(mismatch, "target_variant_mismatch")

    # An exact governed boundary cannot receive a plausible score.
    exact_boundary = impact(611, 255)
    expect_rejection(payload([exact_boundary, INTERIORS["torso_zero"]]), "indeterminate_boundary")

    print("PASS Baker SL-ST2 IDPA Timed Pair backend authority contract")


if __name__ == "__main__":
    run()
