"""Founder-approved E56-T08 evidence-only backend contract tests."""
from __future__ import annotations

import base64
import hashlib
from copy import deepcopy

from gunfun_vital_dude_evidence_authority import VitalDudeEvidenceError, analyze_vital_dude_evidence


IMAGE_BYTES = b"founder-vital-dude-evidence-image"
IMAGE_HASH = hashlib.sha256(IMAGE_BYTES).hexdigest()


def payload():
    return {
        "targetProfileId": "gunfun_22740_vital_dude",
        "targetProfileVersion": "1",
        "targetId": "GUNFUN_22740_VITAL_DUDE",
        "variantId": "GUNFUN_22740_VITAL_DUDE_23X35",
        "missionId": "GUNFUN_22740_EVIDENCE_CAPTURE_V1",
        "imageEvidence": {
            "sha256": IMAGE_HASH,
            "mediaType": "image/jpeg",
            "widthPx": 1200,
            "heightPx": 1800,
            "dataUrl": "data:image/jpeg;base64," + base64.b64encode(IMAGE_BYTES).decode("ascii"),
        },
        "impacts": [{"xNorm": 0.25, "yNorm": 0.4}, {"xNorm": 0.75, "yNorm": 0.6}],
        "shooterDeclaredAimPoint": {"xNorm": 0.5, "yNorm": 0.5},
        "score": 999,
        "anatomicalRegion": "client_invention",
        "correction": {"x": 1, "y": 2},
    }


def reject(value, reason):
    try:
        analyze_vital_dude_evidence(value)
    except VitalDudeEvidenceError as exc:
        assert exc.reason == reason, (exc.reason, reason)
    else:
        raise AssertionError(f"Expected rejection: {reason}")


def run():
    result = analyze_vital_dude_evidence(payload())
    assert result["authoritySource"] == "backend-authoritative"
    assert result["target"]["sku"] == "22740"
    assert result["supportedAnalysis"]["impactCount"] == 2
    assert result["reconciliation"] == {
        "capturedObservationCount": 2,
        "acceptedObservationCount": 2,
        "countsMatch": True,
    }
    assert result["shooterDeclaredAimPoint"]["declaredBy"] == "shooter"
    assert result["shooterDeclaredAimPoint"]["authorityScope"] == "session_evidence_only"
    assert result["scoring"]["status"] == "not_applicable"
    assert result["ugo"]["canonicalRegionMapping"] == "unavailable"
    assert result["ugo"]["physicalMeasurement"] == "unavailable"
    assert result["productRegionDistribution"]["status"] == "unavailable"
    assert result["capabilityStates"]["anatomicalClassification"] == "unavailable"
    assert "score" not in result
    assert "anatomicalRegion" not in result
    assert "correction" not in result
    assert len(result["evidenceHash"]) == 64 and len(result["resultHash"]) == 64

    no_aim = payload()
    no_aim.pop("shooterDeclaredAimPoint")
    assert analyze_vital_dude_evidence(no_aim)["shooterDeclaredAimPoint"] is None

    bad_hash = deepcopy(payload())
    bad_hash["imageEvidence"]["sha256"] = "0" * 64
    reject(bad_hash, "image_sha256_mismatch")
    wrong_target = deepcopy(payload())
    wrong_target["targetId"] = "BAKER_SL_ST1"
    reject(wrong_target, "targetId_identity_mismatch")
    out_of_range = deepcopy(payload())
    out_of_range["impacts"][0]["xNorm"] = 1.1
    reject(out_of_range, "shot_observation_x_out_of_bounds")
    empty = deepcopy(payload())
    empty["impacts"] = []
    reject(empty, "at_least_one_shot_observation_required")

    print("PASS GunFun Vital Dude evidence-only backend authority contract")


if __name__ == "__main__":
    run()
