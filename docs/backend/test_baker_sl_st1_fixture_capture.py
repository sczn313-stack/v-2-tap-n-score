import base64
import hashlib
from datetime import datetime, timezone

from baker_sl_st1_fixture_capture import BakerSLST1FixtureError, preserve_founder_fixture


IMAGE_BYTES = b"\x89PNG\r\n\x1a\nfounder-fixture-pixels"
IMAGE_DATA_URL = "data:image/png;base64," + base64.b64encode(IMAGE_BYTES).decode("ascii")


def payload(count=7):
    return {
        "purpose": "founder_scoring_fixture_registration_validation",
        "targetId": "BAKER_SL_ST1",
        "variantId": "BAKER_SL_ST1_23X35_STANDARD_WHITE",
        "imageEvidence": {
            "dataUrl": IMAGE_DATA_URL,
            "sha256": hashlib.sha256(IMAGE_BYTES).hexdigest(),
            "widthPx": 995,
            "heightPx": 1477,
        },
        "impacts": [{"xNorm": index / (count + 2), "yNorm": (index + 1) / (count + 2)} for index in range(1, count + 1)],
    }


def expect_reason(value, reason):
    try:
        preserve_founder_fixture(value)
    except BakerSLST1FixtureError as exc:
        assert exc.payload["reason"] == reason
        return
    raise AssertionError(f"Expected {reason}")


def run():
    frozen_now = datetime(2026, 8, 13, 18, 0, tzinfo=timezone.utc)
    result = preserve_founder_fixture(payload(), now=frozen_now)
    assert result["status"] == "preserved_for_registration_validation"
    assert result["impactCount"] == 7
    assert len(result["impacts"]) == 7
    assert result["evidenceIdentity"]["originalImageSha256"] == hashlib.sha256(IMAGE_BYTES).hexdigest()
    assert result["evidenceIdentity"]["hashAuthority"] == "backend"
    assert result["imageEvidence"]["originalFileDataUrl"] == IMAGE_DATA_URL
    assert result["immutability"]["state"] == "sealed_export"
    assert "score" not in result
    assert "classification" not in result

    for count in (1, 3, 12, 250):
        variable = preserve_founder_fixture(payload(count), now=frozen_now)
        assert variable["impactCount"] == count
        assert len(variable["impacts"]) == count

    empty = payload()
    empty["impacts"] = []
    expect_reason(empty, "fixture_requires_at_least_one_impact")

    too_many = payload(250)
    too_many["impacts"].append({"xNorm": 0.9, "yNorm": 0.9})
    expect_reason(too_many, "fixture_impact_limit_exceeded")

    wrong_hash = payload()
    wrong_hash["imageEvidence"]["sha256"] = "0" * 64
    expect_reason(wrong_hash, "fixture_client_image_hash_mismatch")

    print("PASS Baker SL-ST1 variable-impact immutable Founder Scoring Fixture capture")


if __name__ == "__main__":
    run()
