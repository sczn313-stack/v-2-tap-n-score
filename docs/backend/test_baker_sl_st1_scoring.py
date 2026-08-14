"""Fail-first Mission A tests for backend-authoritative Baker SL-ST1 scoring."""
import base64
from copy import deepcopy
from pathlib import Path

from baker_sl_st1_scoring import BakerSLST1ScoringError, score_canonical_impacts
from baker_sl_st1_target_page import analyze_baker_sl_st1_evidence


CANONICAL_CONTEXT = {
    "coordinateSystemId": "UGO_IMAGE_PLANE_TOP_LEFT_V1",
    "registrationId": "UGO_BAKER_SL_ST1_23X35_V1",
    "canonicalAssetSha256": "8f3f4a7e371549466dcfd00d95981704f51cf977e5e5ffba288d097efb008429",
}


def impact(x_px, y_px, **claims):
    return {"xNorm": x_px / 1140, "yNorm": y_px / 1499, **claims}


INTERIORS = {
    "A-head": impact(570, 221),
    "A-body": impact(570, 700),
    "B": impact(570, 330),
    "C": impact(350, 700),
    "D": impact(220, 700),
}


def score(impacts):
    return score_canonical_impacts({**CANONICAL_CONTEXT, "impacts": impacts})


def run():
    for fixture, expected in (("A-head", "A"), ("A-body", "A"), ("B", "B"), ("C", "C"), ("D", "D")):
        result = score([INTERIORS[fixture]])
        assert result["impacts"][0]["zone"] == expected
        assert result["scoring"]["status"] == "complete"

    mixed = score(list(INTERIORS.values()))
    assert mixed["zoneCounts"] == {"A": 2, "B": 1, "C": 1, "D": 1, "outside": 0, "indeterminate_boundary": 0}
    assert mixed["classifiedImpactCount"] == 5
    assert mixed["capturedImpactCount"] == 5
    assert mixed["reconciliation"]["countsMatchCapturedImpactCount"] is True
    assert mixed["scoring"]["subtotals"] == {"A": 20, "B": 9, "C": 8, "D": 7}
    assert mixed["scoring"]["total"] == 44

    for zone, count, expected_total in (("A-body", 17, 170), ("B", 12, 108), ("C", 9, 72), ("D", 5, 35)):
        result = score([deepcopy(INTERIORS[zone]) for _ in range(count)])
        assert result["capturedImpactCount"] == count
        assert result["scoring"]["total"] == expected_total

    injected = impact(570, 221, zone="D", value=999, subtotal=999, score=9999)
    authoritative = score([injected])
    assert authoritative["impacts"][0]["zone"] == "A"
    assert authoritative["impacts"][0]["zoneValue"] == 10
    assert authoritative["scoring"]["total"] == 10
    assert not any(key in authoritative["impacts"][0] for key in ("value", "subtotal", "score"))

    outside = score([impact(100, 700)])
    assert outside["impacts"][0]["zone"] == "outside"
    assert outside["scoring"] == {"status": "withheld", "reason": "outside_numeric_treatment_unapproved"}

    boundary = score([impact(438, 700)])
    assert boundary["impacts"][0]["zone"] == "indeterminate_boundary"
    assert boundary["scoring"] == {"status": "withheld", "reason": "indeterminate_boundary"}

    try:
        score([{ "xNorm": 1.01, "yNorm": 0.5 }])
    except BakerSLST1ScoringError as exc:
        assert exc.reason == "canonical_impact_x_out_of_bounds"
    else:
        raise AssertionError("Malformed canonical coordinates must fail closed")

    trace = mixed["authorityTrace"]
    assert trace["classificationAuthority"] == "backend"
    assert trace["geometryAuthorityId"] == "UGO_BAKER_SL_ST1_23X35_V1"
    assert trace["coordinateSystemId"] == "UGO_IMAGE_PLANE_TOP_LEFT_V1"
    assert trace["scoringAuthorityId"] == "BAKER_SL_ST1_SCORING_V1"

    canonical_path = Path(__file__).resolve().parents[1] / "authority-evidence" / "baker-sl-st1" / "BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp"
    canonical_bytes = canonical_path.read_bytes()
    analyzed = analyze_baker_sl_st1_evidence({
        "targetId": "BAKER_SL_ST1",
        "variantId": "BAKER_SL_ST1_23X35_STANDARD_WHITE",
        "imageEvidence": {
            "sha256": CANONICAL_CONTEXT["canonicalAssetSha256"],
            "mediaType": "image/webp",
            "widthPx": 1141,
            "heightPx": 1500,
            "dataUrl": "data:image/webp;base64," + base64.b64encode(canonical_bytes).decode("ascii"),
        },
        "impacts": [
            impact(570, 221, zone="D", value=999, score=9999),
            INTERIORS["B"],
            INTERIORS["C"],
            INTERIORS["D"],
        ],
    })
    assert analyzed["imageEvidence"]["backendHashVerified"] is True
    assert analyzed["imageEvidence"]["targetIdentityVerifiedFromImage"] is True
    assert analyzed["imageEvidence"]["acceptanceScope"] == "exact_registered_canonical_asset"
    assert [item["zone"] for item in analyzed["impacts"]] == ["A", "B", "C", "D"]
    assert analyzed["productRegionDistribution"]["zoneCounts"] == {
        "A": 1, "B": 1, "C": 1, "D": 1, "outside": 0, "indeterminate_boundary": 0
    }
    assert analyzed["scoring"]["total"] == 34

    unregistered = analyze_baker_sl_st1_evidence({
        "targetId": "BAKER_SL_ST1",
        "variantId": "BAKER_SL_ST1_23X35_STANDARD_WHITE",
        "imageEvidence": {
            "sha256": __import__("hashlib").sha256(b"not-the-canonical-asset").hexdigest(),
            "mediaType": "image/png",
            "widthPx": 1141,
            "heightPx": 1500,
            "dataUrl": "data:image/png;base64," + base64.b64encode(b"not-the-canonical-asset").decode("ascii"),
        },
        "impacts": [INTERIORS["A-body"]],
    })
    assert unregistered["scoring"] == {"status": "unavailable", "reason": "canonical_registration_required"}

    print("PASS Baker SL-ST1 Mission A backend scoring contract")


if __name__ == "__main__":
    run()
