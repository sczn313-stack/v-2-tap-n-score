from authority_service import build_authority_package, build_distance_click_query
from mission_registry import MISSION_FAMILY_IDS, RESULT_PACKAGE_IDS


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


def test_mission_family_registry_contains_known_ids():
    expected = {
        "zeroingCorrection",
        "precisionRingScore",
        "precisionGroup",
        "courseOfFireScore",
        "practicalStageScore",
        "qualification",
        "trainingProgression",
        "marksmanshipTraining",
        "hitMissReactive",
        "scenarioDecision",
        "anatomyVitalZone",
        "recreationalChallenge",
        "smartEvidenceCapture",
        "gssf",
    }
    assert_equal(MISSION_FAMILY_IDS, expected, "mission family registry")


def test_result_package_registry_contains_known_ids():
    expected = {
        "zeroCorrectionResult",
        "precisionScoreResult",
        "precisionGroupResult",
        "stageScoreResult",
        "qualificationResult",
        "hitMissResult",
        "trainingProgressionResult",
        "marksmanshipTrainingResult",
        "challengeResult",
        "smartEvidenceResult",
        "gssfPaperPenaltyResult",
    }
    assert_equal(RESULT_PACKAGE_IDS, expected, "result package registry")


def test_unsupported_mission_family_returns_governed_unavailable():
    result = build_authority_package({
        "targetId": "IBS_100YD_RIMFIRE_MATCH",
        "missionFamilyId": "precisionRingScore",
        "resultPackageType": "precisionScoreResult",
    })
    assert_equal(result["ok"], False, "unsupported ok")
    assert_equal(result["status"], "unavailable", "unsupported status")
    assert_equal(result["reason"], "mission_family_not_implemented", "unsupported reason")
    assert_equal(result["missionFamilyId"], "precisionRingScore", "unsupported mission")
    assert_equal(result["resultPackageType"], "precisionScoreResult", "unsupported result package")


def test_result_package_must_be_authorized_by_mission_family():
    result = build_authority_package({
        "targetId": "IBS_100YD_RIMFIRE_MATCH",
        "missionFamilyId": "precisionRingScore",
        "resultPackageType": "zeroCorrectionResult",
    })
    assert_equal(result["ok"], False, "unauthorized package ok")
    assert_equal(result["reason"], "result_package_not_authorized_by_mission_family", "unauthorized package reason")


def test_unknown_mission_family_is_rejected_before_scoring():
    result = build_authority_package({
        "targetId": "UNKNOWN_TARGET",
        "missionFamilyId": "unknownMission",
        "resultPackageType": "challengeResult",
    })
    assert_equal(result["ok"], False, "unknown mission ok")
    assert_equal(result["reason"], "mission_family_not_registered", "unknown mission reason")


def gssf_package(**overrides):
    payload = {
        "target_profile_id": "gssf_ac_1",
        "mission_family": "gssf",
        "hitCoordinates": [],
    }
    payload.update(overrides)
    return build_authority_package(payload)


def test_gssf_ac_1_scores_hit_by_hit_zones():
    result = gssf_package(hitCoordinates=[
        {"xPercent": 50, "yPercent": 50},
        {"xPercent": 50, "yPercent": 68},
        {"xPercent": 50, "yPercent": 80},
        {"xPercent": -5, "yPercent": 50},
    ])
    assert_equal(result["ok"], True, "gssf ok")
    assert_equal(result["resultPackageType"], "gssfPaperPenaltyResult", "gssf result type")
    assert_equal([hit["zone"] for hit in result["hitClassifications"]], ["downZero", "plusOne", "plusThree", "miss"], "gssf zones")
    assert_equal(result["downZeroCount"], 1, "gssf down zero count")
    assert_equal(result["plusOneCount"], 1, "gssf plus one count")
    assert_equal(result["plusThreeCount"], 1, "gssf plus three count")
    assert_equal(result["missCount"], 1, "gssf miss count")
    assert_equal(result["totalPaperPenaltySeconds"], 14, "gssf paper penalty")


def test_gssf_final_time_unavailable_without_raw_time():
    result = gssf_package(hitCoordinates=[{"xPercent": 50, "yPercent": 50}])
    assert_equal(result["finalTimeSeconds"], None, "gssf final time unavailable")
    assert_equal(result["finalTimeStatus"], "unavailable_without_raw_time", "gssf final time status")
    assert_equal(result["display"]["resultLines"], [
        "Mission: GSSF AC-1",
        "Down Zero: 1",
        "+1: 0",
        "+3: 0",
        "Miss: 0",
        "Paper Penalty: +0 sec",
        "Final Time: unavailable",
    ], "gssf unavailable final time display lines")


def test_gssf_final_time_calculates_when_raw_time_supplied():
    result = gssf_package(raw_time_seconds=12.45, hitCoordinates=[
        {"xPercent": 50, "yPercent": 50},
        {"xPercent": 50, "yPercent": 68},
    ])
    assert_close(result["finalTimeSeconds"], 13.45, "gssf final time")
    assert_equal(result["finalTimeStatus"], "calculated", "gssf final time status")


def test_gssf_package_does_not_return_baker_zeroing_fields():
    result = gssf_package(hitCoordinates=[{"xPercent": 50, "yPercent": 50}])
    forbidden_keys = ["score", "clicks", "moa", "correction", "distanceClickQuery", "group", "poib"]
    for key in forbidden_keys:
        if key in result:
            raise AssertionError(f"gssf package must not return Baker field: {key}")


def dot_torture_package(**overrides):
    payload = {
        "target_profile_id": "dot_torture_ez2c_style_17",
    }
    payload.update(overrides)
    return build_authority_package(payload)


def test_dot_torture_creates_backend_training_session():
    result = dot_torture_package()
    assert_equal(result["ok"], True, "dot torture ok")
    assert_equal(result["status"], "created", "dot torture status")
    assert_equal(result["session_id"].startswith("dot-torture-"), True, "dot torture backend session id")
    assert_equal(result["mission_family"], "marksmanshipTraining", "dot torture mission family")
    assert_equal(result["mission_name"], "dotTorture", "dot torture mission name")
    assert_equal(result["target_name"], "EZ2C Style 17 Dot Torture Training Drill", "dot torture target name")
    assert_equal(result["target_size"], {"width": 11, "height": 17, "unit": "inches"}, "dot torture target size")
    assert_equal(result["recommended_distance"], {"value": 3, "unit": "yards"}, "dot torture recommended distance")
    assert_equal(result["discipline"], "pistol", "dot torture discipline")
    assert_equal(result["max_score"], 50, "dot torture max score")
    assert_equal(result["total_rounds"], 50, "dot torture total rounds")
    assert_equal(result["sec_template"], "trainingSEC", "dot torture sec template")


def test_dot_torture_stage_guidance_matches_authority_profile():
    result = dot_torture_package()
    stages = [(stage["label"], stage["rounds"]) for stage in result["stages"]]
    assert_equal(stages, [
        ("Dot 1", 5),
        ("Dot 2", 5),
        ("Dots 3 & 4", 8),
        ("Dot 5", 5),
        ("Dots 6 & 7", 16),
        ("Dot 8", 5),
        ("Dots 9 & 10", 6),
    ], "dot torture stage round counts")
    assert_equal(sum(stage["rounds"] for stage in result["stages"]), 50, "dot torture total stage rounds")
    assert_equal(result["display"]["stageGuidance"], [
        "Stage 1: Dot 1 — Draw and fire 5 slow-fire shots.",
        "Stage 2: Dot 2 — Draw and fire 1 shot, holster, repeat x5.",
        "Stage 3: Dots 3 & 4 — Draw, fire 1 on Dot 3 and 1 on Dot 4, repeat x4.",
        "Stage 4: Dot 5 — Draw and fire 5 shots, strong hand only.",
        "Stage 5: Dots 6 & 7 — Draw and fire 2 on Dot 6 and 2 on Dot 7, repeat x4.",
        "Stage 6: Dot 8 — From ready/retention, fire 5 shots weak hand only.",
        "Stage 7: Dots 9 & 10 — Draw, fire 1 on Dot 9, speed reload, fire 1 on Dot 10, repeat x3.",
    ], "dot torture backend stage guidance")


def test_dot_torture_training_sec_template_fields():
    result = dot_torture_package(distance={"value": 3, "unit": "yards"}, raw_time_seconds=91.25)
    sec = result["trainingSEC"]
    assert_equal(sec["scoreMax"], 50, "dot torture sec score max")
    assert_equal(sec["scoreTotal"], None, "dot torture sec score pending")
    assert_equal(sec["percentage"], None, "dot torture sec percentage pending")
    assert_equal(len(sec["stageResults"]), 7, "dot torture sec stage results")
    assert_equal(sec["missesByDot"], {}, "dot torture misses by dot pending")
    assert_equal(sec["missesByStage"], {}, "dot torture misses by stage pending")
    assert_equal(sec["distance"], {"value": 3.0, "unit": "yards"}, "dot torture sec distance")
    assert_equal(sec["timeSeconds"], 91.25, "dot torture sec time")
    assert_equal(sec["sessionSaved"], False, "dot torture sec save status")


def test_dot_torture_package_does_not_return_zeroing_fields():
    result = dot_torture_package()
    forbidden_keys = ["clicks", "moa", "correction", "distanceClickQuery", "poib", "group", "shooterGuidance", "vectors"]
    for key in forbidden_keys:
        if key in result:
            raise AssertionError(f"dot torture package must not return zeroing field: {key}")


def distance_query(**overrides):
    payload = {
        "currentDistance": 100,
        "currentDistanceUnit": "YDS",
        "adjustmentUnit": "MOA",
        "clickValue": 0.25,
        "goToDistance": 300,
    }
    payload.update(overrides)
    return build_distance_click_query(payload)


def test_distance_click_query_missing_current_distance():
    result = distance_query(currentDistance=None)
    assert_equal(result["ok"], False, "missing current distance ok")
    assert_equal(result["reason"], "missing_current_distance", "missing current distance reason")
    assert_equal(result["display"], "Dial: Backend authority required", "missing current distance display")


def test_distance_click_query_missing_go_to_distance():
    result = distance_query(goToDistance=None)
    assert_equal(result["ok"], False, "missing go to distance ok")
    assert_equal(result["reason"], "missing_go_to_distance", "missing go to distance reason")


def test_distance_click_query_missing_adjustment_unit():
    result = distance_query(adjustmentUnit="")
    assert_equal(result["ok"], False, "missing adjustment unit ok")
    assert_equal(result["reason"], "invalid_adjustment_unit", "missing adjustment unit reason")


def test_distance_click_query_missing_click_value():
    result = distance_query(clickValue=None)
    assert_equal(result["ok"], False, "missing click value ok")
    assert_equal(result["reason"], "invalid_click_value", "missing click value reason")


def test_distance_click_query_distance_only_does_not_fake_clicks():
    result = distance_query()
    assert_equal(result["ok"], False, "distance-only ok")
    assert_equal(result["reason"], "insufficient_authority", "distance-only reason")
    if "dialClicks" in result:
        raise AssertionError("distance-only query must not return fake dialClicks")


def test_distance_click_query_approved_clicks():
    result = distance_query(authorityClicks=18, direction="UP")
    assert_equal(result["ok"], True, "approved clicks ok")
    assert_equal(result["dialClicks"], 18, "approved clicks count")
    assert_equal(result["direction"], "UP", "approved clicks direction")
    assert_equal(result["display"], "Dial: 18 Clicks ↑", "approved clicks display")


def test_distance_click_query_angular_delta_moa():
    result = distance_query(authorityAngularDelta=4.5, adjustmentUnit="MOA", clickValue=0.25, direction="UP")
    assert_equal(result["ok"], True, "moa angular ok")
    assert_equal(result["dialClicks"], 18, "moa angular clicks")
    assert_equal(result["display"], "Dial: 18 Clicks ↑", "moa angular display")


def test_distance_click_query_angular_delta_mrad():
    result = distance_query(authorityAngularDelta=1.8, adjustmentUnit="MRAD", clickValue=0.1, direction="DOWN")
    assert_equal(result["ok"], True, "mrad angular ok")
    assert_equal(result["dialClicks"], 18, "mrad angular clicks")
    assert_equal(result["display"], "Dial: 18 Clicks ↓", "mrad angular display")


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
        test_mission_family_registry_contains_known_ids,
        test_result_package_registry_contains_known_ids,
        test_unsupported_mission_family_returns_governed_unavailable,
        test_result_package_must_be_authorized_by_mission_family,
        test_unknown_mission_family_is_rejected_before_scoring,
        test_gssf_ac_1_scores_hit_by_hit_zones,
        test_gssf_final_time_unavailable_without_raw_time,
        test_gssf_final_time_calculates_when_raw_time_supplied,
        test_gssf_package_does_not_return_baker_zeroing_fields,
        test_dot_torture_creates_backend_training_session,
        test_dot_torture_stage_guidance_matches_authority_profile,
        test_dot_torture_training_sec_template_fields,
        test_dot_torture_package_does_not_return_zeroing_fields,
        test_distance_click_query_missing_current_distance,
        test_distance_click_query_missing_go_to_distance,
        test_distance_click_query_missing_adjustment_unit,
        test_distance_click_query_missing_click_value,
        test_distance_click_query_distance_only_does_not_fake_clicks,
        test_distance_click_query_approved_clicks,
        test_distance_click_query_angular_delta_moa,
        test_distance_click_query_angular_delta_mrad,
    ]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} authority service tests")


if __name__ == "__main__":
    run()
