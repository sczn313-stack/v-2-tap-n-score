"""Contract tests for the Baker SL-ST1 Phase 4 evidence endpoint."""
from baker_sl_st1_target_page import BakerSLST1EvidenceError, analyze_baker_sl_st1_evidence


def evidence_payload():
    return {
        "targetId": "BAKER_SL_ST1",
        "variantId": "BAKER_SL_ST1_23X35_STANDARD_WHITE",
        "imageEvidence": {
            "sha256": "a" * 64,
            "mediaType": "image/jpeg",
            "widthPx": 1200,
            "heightPx": 1800,
        },
        "impacts": [
            {"xNorm": 0.25, "yNorm": 0.5},
            {"xNorm": 0.75, "yNorm": 0.6},
        ],
    }


def expect_reason(payload, reason):
    try:
        analyze_baker_sl_st1_evidence(payload)
    except BakerSLST1EvidenceError as exc:
        assert exc.payload["reason"] == reason
        return
    raise AssertionError(f"Expected {reason}")


def run():
    result = analyze_baker_sl_st1_evidence(evidence_payload())
    assert result["ok"] is True
    assert result["status"] == "supported_analysis_ready"
    assert result["target"] == {
        "smartTargetId": "BAKER_SL_ST1",
        "variantId": "BAKER_SL_ST1_23X35_STANDARD_WHITE",
        "targetProfileId": "baker_sl_st1_practice",
        "targetProfileVersion": 1,
    }
    assert result["supportedAnalysis"] == {"impactCount": 2}
    assert result["impacts"] == [
        {"impactId": "impact-001", "xNorm": 0.25, "yNorm": 0.5},
        {"impactId": "impact-002", "xNorm": 0.75, "yNorm": 0.6},
    ]
    assert result["productRegionDistribution"]["status"] == "unavailable"
    assert result["scoring"]["status"] == "unavailable"
    assert result["continuation"]["status"] == "unavailable"
    assert "score" not in result["supportedAnalysis"]

    wrong_target = evidence_payload()
    wrong_target["targetId"] = "gssf_ac_1"
    expect_reason(wrong_target, "target_identity_mismatch")

    no_impacts = evidence_payload()
    no_impacts["impacts"] = []
    expect_reason(no_impacts, "at_least_one_impact_required")

    out_of_bounds = evidence_payload()
    out_of_bounds["impacts"] = [{"xNorm": 1.01, "yNorm": 0.5}]
    expect_reason(out_of_bounds, "impact_x_out_of_bounds")

    bad_image = evidence_payload()
    bad_image["imageEvidence"]["sha256"] = "not-a-hash"
    expect_reason(bad_image, "image_sha256_required")

    print("PASS Baker SL-ST1 Phase 4 backend evidence contract")


if __name__ == "__main__":
    run()
