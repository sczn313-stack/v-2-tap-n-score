from authority_service import GSSF_AC_1_PROFILE, build_authority_package, build_distance_click_query
from mission_registry import MISSION_FAMILY_IDS, RESULT_PACKAGE_IDS
from target_registry import (
    GOVERNED_UNAVAILABLE_MESSAGE,
    get_target_registry_entry,
    is_target_execution_authorized,
)


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


def test_poib_render_coordinate_uses_hit_group_not_aim():
    aim = {"xPercent": 50, "yPercent": 50}
    impacts = [
        {"xPercent": 62, "yPercent": 38},
        {"xPercent": 66, "yPercent": 40},
        {"xPercent": 64, "yPercent": 42},
        {"xPercent": 68, "yPercent": 36},
    ]
    result = package(aim, impacts)
    assert_close(result["poib"]["xPercent"], 65, "hit-group poib x")
    assert_close(result["poib"]["yPercent"], 39, "hit-group poib y")
    assert_close(result["groupCenter"]["xPercent"], 65, "hit-group center x")
    assert_close(result["groupCenter"]["yPercent"], 39, "hit-group center y")
    assert_close(result["renderCoordinates"]["poib"]["xPercent"], 65, "render poib x", tolerance=0.001)
    assert_close(result["renderCoordinates"]["poib"]["yPercent"], 39, "render poib y", tolerance=0.001)
    if result["renderCoordinates"]["poib"] == result["renderCoordinates"]["aim"]:
        raise AssertionError("POIB marker must not collapse to aim coordinates")


def test_baker_zeroing_package_carries_authoritative_target_identity():
    result = package({"xPercent": 50, "yPercent": 50}, [{"xPercent": 50, "yPercent": 50}])
    assert_equal(result["target_profile_id"], "baker_st_100yd_smart_zero", "baker target profile id")
    assert_equal(result["mission_family"], "zeroingCorrection", "baker mission family")
    assert_equal(result["manufacturer"], "Baker Targets", "baker manufacturer")
    assert_equal(result["discipline"], "zeroing", "baker discipline")
    assert_equal(result["target"]["target_profile_id"], "baker_st_100yd_smart_zero", "nested baker target profile id")


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
        "targetId": "NON_REGISTRY_PRECISION_TEST",
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
        "targetId": "NON_REGISTRY_PRECISION_TEST",
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


def test_target_registry_defaults_research_targets_unavailable():
    entry = get_target_registry_entry("nra_b8")
    assert_equal(entry["lifecycleStatus"], "research", "registry lifecycle default")
    assert_equal(entry["supportedStatus"], "unavailable", "registry support default")
    assert_equal(entry["geometryAuthorityStatus"], "unconfirmed", "registry geometry default")
    assert_equal(entry["scoringAuthorityStatus"], "unconfirmed", "registry scoring default")
    assert_equal(is_target_execution_authorized(entry), False, "registry research executable")


def test_b1_tq6_ring_scoring_prototype_is_known_but_not_executable():
    entry = get_target_registry_entry("nra_b1_tq6")
    assert_equal(entry["targetName"], "NRA B-1 / TQ-6 25-Foot Slow Fire Pistol", "b1 target name")
    assert_equal(entry["missionFamilyId"], "precisionRingScore", "b1 mission family")
    assert_equal(entry["resultPackageType"], "precisionScoreResult", "b1 result package")
    assert_equal(entry["lifecycleStatus"], "research", "b1 lifecycle default")
    assert_equal(entry["supportedStatus"], "unavailable", "b1 support default")
    assert_equal(entry["geometryAuthorityStatus"], "unconfirmed", "b1 geometry authority")
    assert_equal(entry["scoringAuthorityStatus"], "unconfirmed", "b1 scoring authority")
    assert_equal(is_target_execution_authorized(entry), False, "b1 executable")
    assert_equal("officialRingGeometry" in entry["authorityGaps"], True, "b1 ring geometry gap")


def test_target_registry_supported_entries_require_explicit_authority():
    entry = get_target_registry_entry("BAKER_ST_100YD_SMART")
    assert_equal(entry["lifecycleStatus"], "supported", "baker registry lifecycle")
    assert_equal(entry["supportedStatus"], "supported", "baker registry support")
    assert_equal(entry["geometryAuthorityStatus"], "confirmed", "baker registry geometry")
    assert_equal(entry["scoringAuthorityStatus"], "confirmed", "baker registry scoring")
    assert_equal(is_target_execution_authorized(entry), True, "baker registry executable")


def test_known_registry_target_refuses_execution_until_authority_granted():
    result = build_authority_package({
        "targetId": "IBS_100YD_RIMFIRE_MATCH",
        "missionFamilyId": "precisionRingScore",
        "resultPackageType": "precisionScoreResult",
    })
    assert_equal(result["ok"], False, "known unsupported target ok")
    assert_equal(result["status"], "unavailable", "known unsupported status")
    assert_equal(result["reason"], "target_authority_incomplete", "known unsupported reason")
    assert_equal(result["displayMessage"], GOVERNED_UNAVAILABLE_MESSAGE, "known unsupported message")


def test_b1_tq6_refuses_precision_ring_scoring_until_authority_confirmed():
    result = build_authority_package({
        "targetId": "nra_b1_tq6",
        "missionFamilyId": "precisionRingScore",
        "resultPackageType": "precisionScoreResult",
        "hitCoordinates": [{"xPercent": 50, "yPercent": 50}],
    })
    assert_equal(result["ok"], False, "b1 unsupported ok")
    assert_equal(result["status"], "unavailable", "b1 unsupported status")
    assert_equal(result["reason"], "target_authority_incomplete", "b1 unsupported reason")
    assert_equal(result["displayMessage"], GOVERNED_UNAVAILABLE_MESSAGE, "b1 unavailable message")
    assert_equal(result["targetId"], "nra_b1_tq6", "b1 target id")


def test_payload_cannot_silently_activate_registry_target():
    result = build_authority_package({
        "targetId": "nra_b8",
        "missionFamilyId": "precisionRingScore",
        "resultPackageType": "precisionScoreResult",
        "lifecycleStatus": "supported",
        "supportedStatus": "supported",
        "geometryAuthorityStatus": "confirmed",
        "scoringAuthorityStatus": "confirmed",
    })
    assert_equal(result["ok"], False, "payload cannot activate ok")
    assert_equal(result["reason"], "target_authority_incomplete", "payload cannot activate reason")
    assert_equal(result["lifecycleStatus"], "research", "payload cannot override lifecycle")
    assert_equal(result["supportedStatus"], "unavailable", "payload cannot override support")


GSSF_CANONICAL_AC_1_ASSET = {
    "canonicalAssetId": "gssf_ac_1_clean_reference_png_v1",
    "canonicalAssetSha256": "e08eb090f31e64a2fd75f6e88b7267ed9798da4eb438322d1dbc8246e362f030",
    "imageWidthPx": 1125,
    "imageHeightPx": 1373,
    "canonicalCoordinateSystemVersion": "gssf-ac-1-canonical-coordinate-system-v1",
}


GSSF_CANONICAL_AC_1_CENTER_PX = {"x": 561.8978, "y": 649.6939}
GSSF_CANONICAL_AC_1_PIXELS_PER_INCH = 60.9


MISSING_CANONICAL_ASSET_SENTINEL = object()


def gssf_canonical_asset_package(hits=None, canonical_asset=MISSING_CANONICAL_ASSET_SENTINEL, **overrides):
    supplied_hits = hits if hits is not None else []
    normalized_hits = [dict(hit, shotId=hit.get("shotId", index)) for index, hit in enumerate(supplied_hits, start=1)]
    payload = {
        "target_profile_id": "gssf_ac_1",
        "targetProfileVersion": "1",
        "missionFamily": "gssf",
        "mission_family": "gssf",
        "registrationPackageId": "gssf-ac-1-clean-png-registration-v1",
        "registrationPackageVersion": "1",
        "targetExecutionContractId": "gssf-ac-1-live-canonical-v1",
        "imageWidthPx": 1125,
        "imageHeightPx": 1373,
        "evidenceSha256": "e08eb090f31e64a2fd75f6e88b7267ed9798da4eb438322d1dbc8246e362f030",
        "hitPixelCoordinates": normalized_hits,
        "observationCount": len(normalized_hits),
    }
    if canonical_asset is MISSING_CANONICAL_ASSET_SENTINEL:
        payload["canonicalAsset"] = dict(GSSF_CANONICAL_AC_1_ASSET)
    elif canonical_asset is not None:
        payload["canonicalAsset"] = canonical_asset
    payload.update(overrides)
    return build_authority_package(payload)


def gssf_pixel_at_radius(radius_inches, axis="x"):
    center = GSSF_CANONICAL_AC_1_CENTER_PX
    ppi = GSSF_CANONICAL_AC_1_PIXELS_PER_INCH
    if axis == "y":
        return {"xPx": center["x"], "yPx": center["y"] + (radius_inches * ppi)}
    return {"xPx": center["x"] + (radius_inches * ppi), "yPx": center["y"]}


def test_gssf_ac_1_scores_hit_by_hit_zones():
    result = gssf_canonical_asset_package(hits=[
        gssf_pixel_at_radius(0),
        gssf_pixel_at_radius(5),
        gssf_pixel_at_radius(7),
    ])
    assert_equal(result["ok"], True, "gssf ok")
    assert_equal(result["resultPackageType"], "gssfPaperPenaltyResult", "gssf result type")
    assert_equal([hit["zone"] for hit in result["hitClassifications"]], ["downZero", "plusOne", "plusThree"], "gssf zones")
    assert_equal([hit["shot"] for hit in result["hitClassifications"]], [1, 2, 3], "gssf hit classification shot ids")
    assert_equal([hit["shot"] for hit in result["renderCoordinates"]["hits"]], [1, 2, 3], "gssf rendered hit shot ids")
    assert_equal(result["downZeroCount"], 1, "gssf down zero count")
    assert_equal(result["plusOneCount"], 1, "gssf plus one count")
    assert_equal(result["plusThreeCount"], 1, "gssf plus three count")
    assert_equal(result["missCount"], 0, "gssf miss count")
    assert_equal(result["totalPaperPenaltySeconds"], 4, "gssf paper penalty")
    assert_equal(result["scoringBreakdown"], [
        {
            "zone": "downZero",
            "label": "Down Zero",
            "count": 1,
            "penaltySecondsPerHit": 0,
            "subtotalPenaltySeconds": 0,
            "math": "1 x 0 = 0",
            "shotIds": [1],
        },
        {
            "zone": "plusOne",
            "label": "+1",
            "count": 1,
            "penaltySecondsPerHit": 1,
            "subtotalPenaltySeconds": 1,
            "math": "1 x 1 = 1",
            "shotIds": [2],
        },
        {
            "zone": "plusThree",
            "label": "+3",
            "count": 1,
            "penaltySecondsPerHit": 3,
            "subtotalPenaltySeconds": 3,
            "math": "1 x 3 = 3",
            "shotIds": [3],
        },
        {
            "zone": "miss",
            "label": "Miss",
            "count": 0,
            "penaltySecondsPerHit": 10,
            "subtotalPenaltySeconds": 0,
            "math": "0 x 10 = 0",
            "shotIds": [],
        },
    ], "gssf backend scoring breakdown")
    assert_equal(result["resultSource"], "backend", "gssf result source")
    assert_equal(result["authorityPackageId"], "gssf-ac-1-canonical-asset-paper-penalty-v1", "gssf authority package id")
    assert_equal(result["authorityTrace"]["source"], "backend", "gssf authority trace source")
    assert_equal(result["authorityTrace"]["classificationCount"], 3, "gssf authority trace classification count")

    original_penalties = dict(GSSF_AC_1_PROFILE["penaltySeconds"])
    governed_penalties = {
        "downZero": 2,
        "plusOne": 4,
        "plusThree": 6,
        "miss": 8,
    }
    try:
        GSSF_AC_1_PROFILE["penaltySeconds"].update(governed_penalties)
        governed_result = gssf_canonical_asset_package(hits=[
            gssf_pixel_at_radius(0),
            gssf_pixel_at_radius(5),
            gssf_pixel_at_radius(7),
        ])
        assert_equal(
            [hit["penaltySeconds"] for hit in governed_result["hitClassifications"]],
            [2, 4, 6],
            "gssf hit penalties use profile authority",
        )
        assert_equal(
            [bucket["penaltySecondsPerHit"] for bucket in governed_result["scoringBreakdown"]],
            [2, 4, 6, 8],
            "gssf breakdown multipliers use profile authority",
        )
        assert_equal(
            [bucket["subtotalPenaltySeconds"] for bucket in governed_result["scoringBreakdown"]],
            [2, 4, 6, 0],
            "gssf breakdown subtotals use profile authority",
        )
        assert_equal(governed_result["totalPaperPenaltySeconds"], 12, "gssf total uses profile authority")
    finally:
        GSSF_AC_1_PROFILE["penaltySeconds"].clear()
        GSSF_AC_1_PROFILE["penaltySeconds"].update(original_penalties)


def test_gssf_final_time_unavailable_without_raw_time():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)])
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
    result = gssf_canonical_asset_package(raw_time_seconds=12.45, hits=[
        gssf_pixel_at_radius(0), gssf_pixel_at_radius(5),
    ])
    assert_close(result["finalTimeSeconds"], 13.45, "gssf final time")
    assert_equal(result["finalTimeStatus"], "calculated", "gssf final time status")


def test_gssf_package_does_not_return_baker_zeroing_fields():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)])
    forbidden_keys = ["score", "clicks", "moa", "correction", "distanceClickQuery", "group", "poib"]
    for key in forbidden_keys:
        if key in result:
            raise AssertionError(f"gssf package must not return Baker field: {key}")


def test_gssf_canonical_asset_scores_exact_center():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)])
    hit = result["hitClassifications"][0]
    assert_equal(result["ok"], True, "canonical asset ok")
    assert_equal(result["scoringModel"], "canonical-asset-scoring", "canonical asset scoring model")
    assert_equal(result["canonicalAsset"]["canonicalAssetId"], "gssf_ac_1_clean_reference_png_v1", "canonical asset id")
    assert_equal(
        result["canonicalAsset"]["canonicalAssetSha256"],
        "e08eb090f31e64a2fd75f6e88b7267ed9798da4eb438322d1dbc8246e362f030",
        "canonical asset sha256",
    )
    assert_equal(
        result["canonicalAsset"]["canonicalCoordinateSystemVersion"],
        "gssf-ac-1-canonical-coordinate-system-v1",
        "canonical coordinate system version",
    )
    assert_equal(hit["zone"], "downZero", "canonical asset center zone")
    assert_close(hit["radiusInches"], 0, "canonical asset center radius")
    assert_equal(hit["tapPixel"], {"xPx": 561.8978, "yPx": 649.6939}, "canonical asset center tap pixel")
    assert_equal(hit["canonicalCenterPixel"], {"xPx": 561.8978, "yPx": 649.6939}, "canonical center pixel")
    assert_equal(hit["canonicalPixelsPerInch"], 60.9, "canonical pixels per inch")


def test_gssf_canonical_asset_scores_just_inside_four_inches():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(3.999)])
    hit = result["hitClassifications"][0]
    assert_equal(hit["zone"], "downZero", "canonical asset just inside down zero")
    assert_close(hit["radiusInches"], 3.999, "canonical asset just inside radius")


def test_gssf_canonical_asset_scores_exactly_four_inches():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(4.0)])
    hit = result["hitClassifications"][0]
    assert_equal(hit["zone"], "downZero", "canonical asset exactly down zero boundary")
    assert_close(hit["distanceFromDownZeroBoundaryInches"], 0, "canonical asset four inch boundary distance")


def test_gssf_canonical_asset_scores_just_outside_four_inches():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(4.001)])
    hit = result["hitClassifications"][0]
    assert_equal(hit["zone"], "plusOne", "canonical asset just outside down zero")
    assert_close(hit["distanceFromDownZeroBoundaryInches"], 0.001, "canonical asset just outside four inch distance")


def test_gssf_canonical_asset_scores_exactly_six_point_five_inches():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(6.5)])
    hit = result["hitClassifications"][0]
    assert_equal(hit["zone"], "plusOne", "canonical asset exactly plus one boundary")
    assert_close(hit["distanceFromPlusOneBoundaryInches"], 0, "canonical asset six point five boundary distance")


def test_gssf_canonical_asset_scores_just_outside_six_point_five_inches():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(6.501)])
    hit = result["hitClassifications"][0]
    assert_equal(hit["zone"], "plusThree", "canonical asset just outside plus one")
    assert_close(hit["distanceFromPlusOneBoundaryInches"], 0.001, "canonical asset just outside six point five distance")


def test_gssf_canonical_asset_refuses_missing_canonical_asset():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)], canonical_asset=None)
    assert_equal(result["ok"], False, "canonical asset missing asset ok")
    assert_equal(result["reason"], "missing_canonical_asset_id", "canonical asset missing asset reason")


def test_gssf_canonical_asset_refuses_wrong_coordinate_system_version():
    canonical_asset = dict(GSSF_CANONICAL_AC_1_ASSET)
    canonical_asset["canonicalCoordinateSystemVersion"] = "draft-coordinate-system"
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)], canonical_asset=canonical_asset)
    assert_equal(result["ok"], False, "canonical asset wrong coordinate system ok")
    assert_equal(
        result["reason"],
        "unsupported_canonical_coordinate_system_version",
        "canonical asset wrong coordinate system reason",
    )


def test_gssf_canonical_asset_refuses_missing_asset_id():
    canonical_asset = dict(GSSF_CANONICAL_AC_1_ASSET)
    del canonical_asset["canonicalAssetId"]
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)], canonical_asset=canonical_asset)
    assert_equal(result["ok"], False, "canonical asset missing asset id ok")
    assert_equal(result["reason"], "missing_canonical_asset_id", "canonical asset missing asset id reason")


def test_gssf_canonical_asset_refuses_missing_asset_sha256():
    canonical_asset = dict(GSSF_CANONICAL_AC_1_ASSET)
    del canonical_asset["canonicalAssetSha256"]
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)], canonical_asset=canonical_asset)
    assert_equal(result["ok"], False, "canonical asset missing asset sha ok")
    assert_equal(result["reason"], "missing_canonical_asset_sha256", "canonical asset missing asset sha reason")


def test_gssf_canonical_asset_refuses_wrong_asset_sha256():
    canonical_asset = dict(GSSF_CANONICAL_AC_1_ASSET)
    canonical_asset["canonicalAssetSha256"] = "0" * 64
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)], canonical_asset=canonical_asset)
    assert_equal(result["ok"], False, "canonical asset wrong asset sha ok")
    assert_equal(result["reason"], "unapproved_canonical_asset_sha256", "canonical asset wrong asset sha reason")


def test_gssf_canonical_asset_refuses_same_dimensions_wrong_asset_identity():
    canonical_asset = dict(GSSF_CANONICAL_AC_1_ASSET)
    canonical_asset["canonicalAssetId"] = "different_1125_by_1373_asset"
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)], canonical_asset=canonical_asset)
    assert_equal(result["ok"], False, "canonical asset wrong asset id ok")
    assert_equal(result["reason"], "unapproved_canonical_asset_id", "canonical asset wrong asset id reason")


def test_gssf_canonical_asset_refuses_evidence_sha256_mismatch():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)], evidenceSha256="1" * 64)
    assert_equal(result["ok"], False, "canonical asset wrong evidence sha ok")
    assert_equal(result["reason"], "evidence_sha256_mismatch", "canonical asset wrong evidence sha reason")


def test_gssf_canonical_asset_refuses_mismatched_image_dimensions():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)], imageHeightPx=1400)
    assert_equal(result["ok"], False, "canonical asset mismatched dimensions ok")
    assert_equal(result["reason"], "canonical_image_dimension_mismatch", "canonical asset mismatched dimensions reason")
    assert_equal(result["canonicalAssetValidation"]["field"], "imageHeightPx", "canonical asset mismatched field")


def test_gssf_canonical_asset_scores_shot_two_in_canonical_atp_coordinates():
    result = gssf_canonical_asset_package(hits=[
        gssf_pixel_at_radius(0),
        {"xPx": 562.0, "yPx": 932.96},
    ])
    hit = result["hitClassifications"][1]
    assert_equal(hit["shot"], 2, "canonical asset shot two test shot id")
    assert_equal(hit["zone"], "plusOne", "canonical asset shot two classification")
    assert_close(hit["radiusInches"], 4.6513, "canonical asset shot two radius", tolerance=0.0001)
    assert_close(hit["distanceFromDownZeroBoundaryInches"], 0.6513, "canonical asset shot two down zero distance", tolerance=0.0001)


def test_gssf_legacy_percentage_request_refuses_without_fallback():
    result = build_authority_package({
        "target_profile_id": "gssf_ac_1",
        "mission_family": "gssf",
        "hitCoordinates": [{"xPercent": 50, "yPercent": 50}],
    })
    assert_equal(result["ok"], False, "legacy GSSF request refuses")
    assert_equal(result["status"], "authority_unavailable", "legacy GSSF refusal status")


def test_gssf_invalid_registration_refuses():
    result = gssf_canonical_asset_package(
        hits=[gssf_pixel_at_radius(0)], registrationPackageId="unknown-registration"
    )
    assert_equal(result["reason"], "execution_contract_identity_mismatch", "registration mismatch reason")


def test_gssf_malformed_observation_refuses_without_partial_package():
    result = gssf_canonical_asset_package(
        hits=[gssf_pixel_at_radius(0)],
        hitPixelCoordinates=[{"shotId": 1, "xPx": None, "yPx": 649.6939}],
        observationCount=1,
    )
    assert_equal(result["status"], "authority_unavailable", "malformed observation status")
    assert_equal(result["reason"], "malformed_shot_observation", "malformed observation reason")
    assert_equal("scoringBreakdown" in result, False, "malformed observation has no partial scoring")


def test_gssf_observation_count_and_shot_id_parity_are_required():
    count_result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)], observationCount=2)
    assert_equal(count_result["reason"], "observation_count_mismatch", "observation count mismatch")
    duplicate_result = gssf_canonical_asset_package(hits=[
        dict(gssf_pixel_at_radius(0), shotId=7),
        dict(gssf_pixel_at_radius(5), shotId=7),
    ])
    assert_equal(duplicate_result["reason"], "duplicate_shot_id", "duplicate shot id refusal")


def test_gssf_supplied_shot_ids_are_preserved():
    result = gssf_canonical_asset_package(hits=[
        dict(gssf_pixel_at_radius(0), shotId=2),
        dict(gssf_pixel_at_radius(5), shotId=9),
    ])
    assert_equal([hit["shotId"] for hit in result["hitClassifications"]], [2, 9], "classification shot ids")
    assert_equal(result["scoringBreakdown"][0]["shotIds"], [2], "down zero supplied shot id")
    assert_equal(result["scoringBreakdown"][1]["shotIds"], [9], "plus one supplied shot id")


def test_gssf_authority_trace_names_all_execution_components():
    result = gssf_canonical_asset_package(hits=[gssf_pixel_at_radius(0)])
    trace = result["authorityTrace"]
    assert_equal(trace["registrationPackageId"], "gssf-ac-1-clean-png-registration-v1", "trace registration")
    assert_equal(trace["registrationPackageVersion"], "1", "trace registration version")
    assert_equal(trace["geometryProfileId"], "gssf-ac-1-concentric-geometry-v1", "trace geometry")
    assert_equal(trace["geometryProfileVersion"], "1", "trace geometry version")
    assert_equal(trace["scoringProfileId"], "gssf-ac-1-paper-penalty-v1", "trace scoring")
    assert_equal(trace["scoringProfileVersion"], "1", "trace scoring version")
    assert_equal(trace["missionProfileId"], "gssf-ac-1-paper-penalty-mission-v1", "trace mission")
    assert_equal(trace["missionProfileVersion"], "1", "trace mission version")
    assert_equal(trace["targetExecutionContractId"], "gssf-ac-1-live-canonical-v1", "trace contract")


def dot_torture_package(**overrides):
    payload = {
        "target_profile_id": "dot_torture_ez2c_style_17",
    }
    payload.update(overrides)
    return build_authority_package(payload)


def dot_torture_lite_package(**overrides):
    payload = {
        "target_profile_id": "dot_torture_lite_ez2c",
    }
    payload.update(overrides)
    return build_authority_package(payload)


def revolving_dot_torture_package(**overrides):
    payload = {
        "target_profile_id": "revolving_dot_torture_ez2c",
    }
    payload.update(overrides)
    return build_authority_package(payload)


def test_dot_torture_creates_backend_training_session():
    result = dot_torture_package()
    assert_equal(result["ok"], True, "dot torture ok")
    assert_equal(result["status"], "created", "dot torture status")
    assert_equal(result["session_id"].startswith("dot-torture-"), True, "dot torture backend session id")
    assert_equal(result["mission_family"], "marksmanshipTraining", "dot torture mission family")
    assert_equal(result["mission_group"], "dotTortureFamily", "dot torture mission group")
    assert_equal(result["mission_name"], "dotTortureStandard", "dot torture mission name")
    assert_equal(result["mission_variant"], "standard", "dot torture mission variant")
    assert_equal(result["target_display_name"], "Dot Torture", "dot torture display name")
    assert_equal(result["target_name"], "EZ2C Style 17 Dot Torture Training Drill", "dot torture target name")
    assert_equal(result["target_size"], {"width": 11, "height": 17, "unit": "inches"}, "dot torture target size")
    assert_equal(result["recommended_distance"], {"value": 3, "unit": "yards"}, "dot torture recommended distance")
    assert_equal(result["discipline"], "pistol", "dot torture discipline")
    assert_equal(result["max_score"], 50, "dot torture max score")
    assert_equal(result["total_rounds"], 50, "dot torture total rounds")
    assert_equal(result["sec_template"], "trainingSEC", "dot torture sec template")


def test_dot_torture_lite_creates_variant_training_session():
    result = dot_torture_lite_package()
    assert_equal(result["ok"], True, "dot torture lite ok")
    assert_equal(result["target_profile_id"], "dot_torture_lite_ez2c", "dot torture lite target profile")
    assert_equal(result["mission_family"], "marksmanshipTraining", "dot torture lite mission family")
    assert_equal(result["mission_group"], "dotTortureFamily", "dot torture lite mission group")
    assert_equal(result["mission_name"], "dotTortureLite", "dot torture lite mission name")
    assert_equal(result["mission_variant"], "lite", "dot torture lite mission variant")
    assert_equal(result["target_display_name"], "Dot Torture Lite", "dot torture lite display name")
    assert_equal(result["target_name"], "EZ2C Dot Torture Lite Training Drill", "dot torture lite target name")
    assert_equal(result["stage_count"], 5, "dot torture lite stage count")
    assert_equal(result["total_rounds"], 30, "dot torture lite total rounds")
    assert_equal(result["max_score"], 30, "dot torture lite max score")
    assert_equal(result["trainingSEC"]["scoreMax"], 30, "dot torture lite sec score max")
    assert_equal(result["sec_template"], "trainingSEC", "dot torture lite sec template")


def test_revolving_dot_torture_creates_variant_training_session():
    result = revolving_dot_torture_package()
    assert_equal(result["ok"], True, "revolving dot torture ok")
    assert_equal(result["target_profile_id"], "revolving_dot_torture_ez2c", "revolving dot torture target profile")
    assert_equal(result["mission_family"], "marksmanshipTraining", "revolving dot torture mission family")
    assert_equal(result["mission_group"], "dotTortureFamily", "revolving dot torture mission group")
    assert_equal(result["mission_name"], "revolvingDotTorture", "revolving dot torture mission name")
    assert_equal(result["mission_variant"], "revolving", "revolving dot torture mission variant")
    assert_equal(result["target_display_name"], "Revolving Dot Torture", "revolving dot torture display name")
    assert_equal(result["target_name"], "EZ2C Revolving Dot Torture Training Drill", "revolving dot torture target name")
    assert_equal(result["stage_count"], 7, "revolving dot torture stage count")
    assert_equal(result["total_rounds"], 50, "revolving dot torture total rounds")
    assert_equal(result["max_score"], 50, "revolving dot torture max score")
    assert_equal(result["trainingSEC"]["scoreMax"], 50, "revolving dot torture sec score max")
    assert_equal(result["sec_template"], "trainingSEC", "revolving dot torture sec template")


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


def test_distance_click_query_session_context_alone_does_not_authorize_clicks():
    context = {
        "sessionDistance": {"value": 100, "unit": "YDS", "source": "session"},
        "angularUnit": "MOA",
        "clickValue": 0.25,
    }
    result = distance_query(session_id="session-001", activeCalculationContext=context)
    assert_equal(result["ok"], False, "context-only query ok")
    assert_equal(result["reason"], "insufficient_authority", "context-only reason")
    assert_equal(result["session_id"], "session-001", "context-only session id")
    assert_equal(result["activeCalculationContext"], context, "context-only preserved context")
    if "dialClicks" in result:
        raise AssertionError("session context alone must not return fake dialClicks")


def test_distance_click_query_approved_clicks():
    result = distance_query(authorityClicks=18, direction="UP")
    assert_equal(result["ok"], True, "approved clicks ok")
    assert_equal(result["dialClicks"], 18, "approved clicks count")
    assert_equal(result["direction"], "UP", "approved clicks direction")
    assert_equal(result["display"], "Dial: 18 Clicks ↑", "approved clicks display")


def test_distance_click_query_uses_nested_transition_authority():
    context = {
        "sessionDistance": {"value": 25, "unit": "M", "source": "atp", "locked": True},
        "angularUnit": "MOA",
        "clickValue": 0.25,
    }
    result = distance_query(
        session_id="m4-session-001",
        activeCalculationContext=context,
        distanceTransitionAuthority={"authorityClicks": 12, "direction": "DOWN"},
    )
    assert_equal(result["ok"], True, "nested transition ok")
    assert_equal(result["dialClicks"], 12, "nested transition clicks")
    assert_equal(result["direction"], "DOWN", "nested transition direction")
    assert_equal(result["session_id"], "m4-session-001", "nested transition session id")
    assert_equal(result["activeCalculationContext"], context, "nested transition context")


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
        test_poib_render_coordinate_uses_hit_group_not_aim,
        test_baker_zeroing_package_carries_authoritative_target_identity,
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
        test_target_registry_defaults_research_targets_unavailable,
        test_b1_tq6_ring_scoring_prototype_is_known_but_not_executable,
        test_target_registry_supported_entries_require_explicit_authority,
        test_known_registry_target_refuses_execution_until_authority_granted,
        test_b1_tq6_refuses_precision_ring_scoring_until_authority_confirmed,
        test_payload_cannot_silently_activate_registry_target,
        test_gssf_ac_1_scores_hit_by_hit_zones,
        test_gssf_final_time_unavailable_without_raw_time,
        test_gssf_final_time_calculates_when_raw_time_supplied,
        test_gssf_package_does_not_return_baker_zeroing_fields,
        test_gssf_canonical_asset_scores_exact_center,
        test_gssf_canonical_asset_scores_just_inside_four_inches,
        test_gssf_canonical_asset_scores_exactly_four_inches,
        test_gssf_canonical_asset_scores_just_outside_four_inches,
        test_gssf_canonical_asset_scores_exactly_six_point_five_inches,
        test_gssf_canonical_asset_scores_just_outside_six_point_five_inches,
        test_gssf_canonical_asset_refuses_missing_canonical_asset,
        test_gssf_canonical_asset_refuses_wrong_coordinate_system_version,
        test_gssf_canonical_asset_refuses_missing_asset_id,
        test_gssf_canonical_asset_refuses_missing_asset_sha256,
        test_gssf_canonical_asset_refuses_wrong_asset_sha256,
        test_gssf_canonical_asset_refuses_same_dimensions_wrong_asset_identity,
        test_gssf_canonical_asset_refuses_evidence_sha256_mismatch,
        test_gssf_canonical_asset_refuses_mismatched_image_dimensions,
        test_gssf_canonical_asset_scores_shot_two_in_canonical_atp_coordinates,
        test_gssf_legacy_percentage_request_refuses_without_fallback,
        test_gssf_invalid_registration_refuses,
        test_gssf_malformed_observation_refuses_without_partial_package,
        test_gssf_observation_count_and_shot_id_parity_are_required,
        test_gssf_supplied_shot_ids_are_preserved,
        test_gssf_authority_trace_names_all_execution_components,
        test_dot_torture_creates_backend_training_session,
        test_dot_torture_lite_creates_variant_training_session,
        test_revolving_dot_torture_creates_variant_training_session,
        test_dot_torture_stage_guidance_matches_authority_profile,
        test_dot_torture_training_sec_template_fields,
        test_dot_torture_package_does_not_return_zeroing_fields,
        test_distance_click_query_missing_current_distance,
        test_distance_click_query_missing_go_to_distance,
        test_distance_click_query_missing_adjustment_unit,
        test_distance_click_query_missing_click_value,
        test_distance_click_query_distance_only_does_not_fake_clicks,
        test_distance_click_query_session_context_alone_does_not_authorize_clicks,
        test_distance_click_query_approved_clicks,
        test_distance_click_query_uses_nested_transition_authority,
        test_distance_click_query_angular_delta_moa,
        test_distance_click_query_angular_delta_mrad,
    ]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} authority service tests")


if __name__ == "__main__":
    run()
