from authority_service import build_authority_package


def package(aim=None, impacts=None, optic=None):
    return build_authority_package({
        "targetId": "BAKER_ST_100YD_SMART",
        "aimCoordinate": aim,
        "impactCoordinates": impacts or [],
        "distance": {"value": 100, "unit": "yds"},
        "shooterSetup": {"optic": optic or {"adjustmentUnit": "MOA", "clickValueMOA": 0.25}},
    })


def assert_equal(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")


def assert_close(actual, expected, label, tolerance=0.0001):
    if abs(actual - expected) > tolerance:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")


def test_no_aim_returns_no_correction():
    result = package(None, [{"xPercent": 20, "yPercent": 20}])
    assert_equal(result["correction"], None, "correction without aim")
    assert_equal(result["clicks"], None, "clicks without aim")


def test_no_impacts_returns_no_poib():
    result = package({"xPercent": 50, "yPercent": 50}, [])
    assert_equal(result["poib"], None, "poib without impacts")
    assert_equal(result["groupCenter"], None, "group center without impacts")


def test_single_hit_poib_equals_hit():
    hit = {"xPercent": 22.5, "yPercent": 31.25}
    result = package({"xPercent": 50, "yPercent": 50}, [hit])
    assert_close(result["poib"]["xPercent"], hit["xPercent"], "single-hit poib x")
    assert_close(result["poib"]["yPercent"], hit["yPercent"], "single-hit poib y")


def test_four_symmetric_hits_equal_center():
    impacts = [
        {"xPercent": 40, "yPercent": 40},
        {"xPercent": 60, "yPercent": 40},
        {"xPercent": 40, "yPercent": 60},
        {"xPercent": 60, "yPercent": 60},
    ]
    result = package({"xPercent": 50, "yPercent": 50}, impacts)
    assert_close(result["poib"]["xPercent"], 50, "symmetric poib x")
    assert_close(result["poib"]["yPercent"], 50, "symmetric poib y")


def point_from_grid(x_inches, y_inches):
    geometry = {
        "imageWidth": 1102,
        "imageHeight": 1713,
        "gridLeftPx": 68,
        "gridTopPx": 282,
        "gridSquarePx": 49,
    }
    return {
        "xPercent": ((geometry["gridLeftPx"] + (x_inches * geometry["gridSquarePx"])) / geometry["imageWidth"]) * 100,
        "yPercent": ((geometry["gridTopPx"] + (y_inches * geometry["gridSquarePx"])) / geometry["imageHeight"]) * 100,
    }


def test_10_horizontal_squares_equals_10_vertical_squares_click_magnitude():
    aim = point_from_grid(10, 10)
    horizontal = package(aim, [point_from_grid(20, 10)])
    vertical = package(aim, [point_from_grid(10, 20)])
    assert_equal(horizontal["clicks"]["windageClicks"], vertical["clicks"]["elevationClicks"], "10-square click parity")


def test_quarter_moa_clicks():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(20, 10)], {"adjustmentUnit": "MOA", "clickValueMOA": 0.25})
    assert_equal(result["clicks"]["adjustmentUnit"], "MOA", "quarter moa unit")
    assert_equal(result["clicks"]["windageClicks"], 38, "quarter moa 10-inch clicks")


def test_half_moa_clicks():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(20, 10)], {"adjustmentUnit": "MOA", "clickValueMOA": 0.5})
    assert_equal(result["clicks"]["windageClicks"], 19, "half moa 10-inch clicks")


def test_one_moa_clicks():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(20, 10)], {"adjustmentUnit": "MOA", "clickValueMOA": 1})
    assert_equal(result["clicks"]["windageClicks"], 10, "one moa 10-inch clicks")


def test_point_one_mrad_clicks():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(20, 10)], {"adjustmentUnit": "MRAD", "clickValueMRAD": 0.1})
    assert_equal(result["clicks"]["adjustmentUnit"], "MRAD", "point one mrad unit")
    assert_equal(result["clicks"]["windageClicks"], 28, "point one mrad 10-inch clicks")
    assert_close(result["moa"]["windageMRAD"], 2.7778, "point one mrad angular value", tolerance=0.0001)


def test_point_zero_five_mrad_clicks():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(20, 10)], {"adjustmentUnit": "MRAD", "clickValueMRAD": 0.05})
    assert_equal(result["clicks"]["windageClicks"], 56, "point zero five mrad 10-inch clicks")


def test_guidance_elevation_only():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(10, 20)])
    assert_equal(result["shooterGuidance"]["primary"], "Apply 38 clicks UP, then confirm.", "elevation-only guidance")
    assert_equal(result["shooterGuidance"]["short"], "38 UP", "elevation-only short guidance")


def test_guidance_windage_only():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(20, 10)])
    assert_equal(result["shooterGuidance"]["primary"], "Apply 38 clicks LEFT, then confirm.", "windage-only guidance")
    assert_equal(result["shooterGuidance"]["short"], "38 LEFT", "windage-only short guidance")


def test_guidance_both_axes():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(20, 20)])
    assert_equal(result["shooterGuidance"]["primary"], "Apply 38 clicks UP and 38 clicks LEFT, then confirm.", "both-axis guidance")
    assert_equal(result["shooterGuidance"]["short"], "38 UP / 38 LEFT", "both-axis short guidance")


def test_guidance_zero_correction():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(10, 10)])
    assert_equal(result["shooterGuidance"]["primary"], "Confirm zero.", "zero correction guidance")
    assert_equal(result["shooterGuidance"]["short"], "Confirm zero", "zero correction short guidance")


def test_guidance_moa_workflow():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(20, 20)], {"adjustmentUnit": "MOA", "clickValueMOA": 0.5})
    assert_equal(result["clicks"]["adjustmentUnit"], "MOA", "guidance moa unit")
    assert_equal(result["shooterGuidance"]["primary"], "Apply 19 clicks UP and 19 clicks LEFT, then confirm.", "moa guidance")


def test_guidance_mrad_workflow():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(20, 20)], {"adjustmentUnit": "MRAD", "clickValueMRAD": 0.1})
    assert_equal(result["clicks"]["adjustmentUnit"], "MRAD", "guidance mrad unit")
    assert_equal(result["shooterGuidance"]["primary"], "Apply 28 clicks UP and 28 clicks LEFT, then confirm.", "mrad guidance")


def assert_raises_value_error(callback, label):
    try:
        callback()
    except ValueError:
        return
    raise AssertionError(f"{label}: expected ValueError")


def test_invalid_unknown_unit_rejection():
    aim = point_from_grid(10, 10)
    assert_raises_value_error(
        lambda: package(aim, [point_from_grid(20, 10)], {"adjustmentUnit": "MIL", "clickValue": 0.1}),
        "unknown unit",
    )


def test_missing_click_value_rejection():
    aim = point_from_grid(10, 10)
    assert_raises_value_error(
        lambda: package(aim, [point_from_grid(20, 10)], {"adjustmentUnit": "MRAD"}),
        "missing click value",
    )


def test_same_input_creates_same_evidence_hash():
    payload = {"xPercent": 24, "yPercent": 42}
    first = package({"xPercent": 50, "yPercent": 50}, [payload])
    second = package({"xPercent": 50, "yPercent": 50}, [payload])
    assert_equal(first["evidenceHash"], second["evidenceHash"], "stable evidence hash")


def test_missing_evidence_creates_no_fake_coordinate():
    result = package(None, [])
    assert_equal(result["renderCoordinates"]["aim"], None, "fake aim")
    assert_equal(result["renderCoordinates"]["poib"], None, "fake poib")
    assert_equal(result["renderCoordinates"]["vector"], None, "fake vector")
    assert_equal(result["renderCoordinates"]["impacts"], [], "fake impacts")
    assert_equal(result["score"]["value"], None, "fake score")
    assert_equal(result["shooterGuidance"]["status"], "unavailable", "fake guidance status")
    assert_equal(result["shooterGuidance"]["primary"], None, "fake guidance")


def test_backend_score_scores_close_hits_higher_than_far_hits():
    aim = point_from_grid(10, 10)
    close = package(aim, [point_from_grid(10, 10), point_from_grid(11, 10), point_from_grid(10, 11)])
    far = package(aim, [point_from_grid(20, 10), point_from_grid(10, 20), point_from_grid(20, 20)])
    if not close["score"]["value"] > far["score"]["value"]:
      raise AssertionError(f"score quality: expected close score > far score, got {close['score']['value']} <= {far['score']['value']}")
    assert_equal(close["score"]["method"], "authority-v1", "score method")


def test_backend_group_size_is_authoritative():
    aim = point_from_grid(10, 10)
    result = package(aim, [point_from_grid(10, 10), point_from_grid(11, 10)])
    assert_equal(result["group"]["status"], "calculated", "group status")
    assert_close(result["group"]["valueMOA"], 0.96, "one-inch group moa", tolerance=0.01)


def run():
    tests = [
        test_no_aim_returns_no_correction,
        test_no_impacts_returns_no_poib,
        test_single_hit_poib_equals_hit,
        test_four_symmetric_hits_equal_center,
        test_10_horizontal_squares_equals_10_vertical_squares_click_magnitude,
        test_quarter_moa_clicks,
        test_half_moa_clicks,
        test_one_moa_clicks,
        test_point_one_mrad_clicks,
        test_point_zero_five_mrad_clicks,
        test_guidance_elevation_only,
        test_guidance_windage_only,
        test_guidance_both_axes,
        test_guidance_zero_correction,
        test_guidance_moa_workflow,
        test_guidance_mrad_workflow,
        test_invalid_unknown_unit_rejection,
        test_missing_click_value_rejection,
        test_same_input_creates_same_evidence_hash,
        test_missing_evidence_creates_no_fake_coordinate,
        test_backend_score_scores_close_hits_higher_than_far_hits,
        test_backend_group_size_is_authoritative,
    ]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} authority service tests")


if __name__ == "__main__":
    run()
