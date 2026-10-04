#!/usr/bin/env python3
"""Founder #18 preflight: Outdoor Challenge geometry plus inherited aim-area intelligence."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
import json
from pathlib import Path

from execution_authority import execute_authoritative_session
from executors.declarative_target_score import DeclarativeTargetScoreError, execute
from preserved_sec_store import list_preserved_secs, preserve_sec, read_preserved_sec
from session_authority import prepare_session, start_session
from target_execution_contract import TargetExecutionContractResolver, validate_contract
from test_target_execution_scale_architecture import MemoryStore


NOW = datetime(2026, 10, 3, 15, 0, tzinfo=timezone.utc)
ROOT = Path(__file__).parent
CONTRACT_ROOT = ROOT / "target_execution_contracts" / "contracts"
TREATMENT = ROOT.parent / "authority-evidence/platform/episode64-founder-walk-2026-10-02/FOUNDER_18_OUTDOOR_CHALLENGE_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "e0e0d0eb46853cb57fcb7f9d8e151a62ffd15e0920e0d30e49a42aeda46b7376"
FILES = (
    "blocker_baker_targets_gf_outdoor_target_scoring_v1.json",
    "final_collection_baker_targets_pk_blastpack_001_target_scoring_v1.json",
    "final_collection_baker_targets_pk_outdoorspack_002_target_scoring_v1.json",
)
TARGETS = (
    "blocker_baker_targets_gf_outdoor",
    "final_collection_baker_targets_pk_blastpack_001",
    "final_collection_baker_targets_pk_outdoorspack_002",
)
IMAGE = {"sha256": FACE_SHA, "widthPx": 571, "heightPx": 750, "mediaType": "image/webp", "dataUrl": "data:image/webp;base64,UklGRg=="}
CENTERS = (
    ("flying_bird", "tree_canopy", .455515, .182865),
    ("upper_right_bird", "tree_canopy", .703620, .242149),
    ("left_bird", "tree_canopy", .219630, .319757),
    ("center_tree_animal", "tree_canopy", .552109, .341198),
    ("center_left_tree_animal", "tree_canopy", .379579, .445849),
    ("right_tree_animal", "tree_canopy", .786729, .484889),
    ("hanging_animal", "lower_scene", .668886, .633388),
    ("wanted_poster", "lower_scene", .481290, .680667),
    ("brewery_bottle", "lower_scene", .135525, .695271),
    ("fence_white_container", "lower_scene", .708443, .726062),
    ("fence_dark_container", "lower_scene", .833670, .726177),
    ("lower_left_large_animal", "lower_scene", .373715, .782609),
    ("barrel_side_small_animal", "lower_scene", .127193, .909672),
    ("lower_right_rabbit", "lower_scene", .848429, .920821),
    ("lower_center_snake", "lower_scene", .467601, .933333),
)
# These lie on surrounding object artwork or clear background, not in red aim areas.
OUTSIDE_POINTS = ((.40, .15), (.30, .77), (.80, .90), (.135, .65), (.90, .10), (.50, .55))
LIFECYCLE_POINTS = [(x, y) for _, _, x, y in CENTERS] + list(OUTSIDE_POINTS)
LIFECYCLE_REGIONS = [region_id for region_id, _, _, _ in CENTERS] + ["outside"] * len(OUTSIDE_POINTS)
FOUNDER_LIVE_POINTS = (
    (.856737, .924993), (.469663, .935202), (.838415, .732085), (.700986, .725718),
    (.488045, .684778), (.674090, .629741), (.377892, .789459), (.133024, .908372),
    (.135569, .699152), (.794837, .485117), (.378830, .451985), (.548515, .344569),
    (.703793, .244066), (.457555, .193669), (.227636, .326989), (.052438, .203299),
    (.039181, .283178), (.044068, .397411), (.922797, .223763), (.946877, .303899),
    (.955357, .430048),
)
FOUNDER_LIVE_REGIONS = (
    "lower_right_rabbit", "lower_center_snake", "fence_dark_container", "fence_white_container",
    "wanted_poster", "hanging_animal", "lower_left_large_animal", "barrel_side_small_animal",
    "brewery_bottle", "right_tree_animal", "center_left_tree_animal", "center_tree_animal",
    "upper_right_bird", "flying_bird", "left_bird",
) + ("outside",) * 6


def contracts():
    return [validate_contract(json.loads((CONTRACT_ROOT / name).read_text(encoding="utf-8"))) for name in FILES]


def observation(x, y):
    return {
        "xNorm": x,
        "yNorm": y,
        "observationFootprint": {
            "schemaVersion": "sczn3.observation-footprint.v1",
            "coordinateSystem": "normalized_source_image_top_left",
            "radiusXNorm": 4.5 / IMAGE["widthPx"],
            "radiusYNorm": 4.5 / IMAGE["heightPx"],
            "authority": "shooter_observation",
            "source": "sczn3_precision_tap_standard_9_source_pixels",
        },
    }


def evidence(points=LIFECYCLE_POINTS):
    return {"imageEvidence": deepcopy(IMAGE), "observations": [observation(x, y) for x, y in points], "shooterDeclaredComplete": True}


def dimension(scoring, dimension_id):
    return next(item for item in scoring["summaryResults"] if item["dimensionId"] == dimension_id)


def assert_lifecycle_result(result, target_id):
    assert result["target"]["id"] == target_id
    scoring = result["scoring"]
    assert scoring["model"] == "multiple_bulls"
    assert scoring["observationCount"] == 21
    assert scoring["outsideCount"] == 6
    assert "total" not in scoring
    assert [item["regionId"] for item in result["classifications"]] == LIFECYCLE_REGIONS
    assert all(item["value"] is None for item in result["classifications"])
    assert len(scoring["objectResults"]) == 15
    assert all(item["hitCount"] == 1 and item["hit"] is True for item in scoring["objectResults"])
    groups = dimension(scoring, "scene_group")["groups"]
    assert [(item["label"], item["observationCount"], item["objectsHit"], item["completionPercentage"]) for item in groups] == [
        ("Tree Canopy", 6, 6, 100.0), ("Lower Challenge Scene", 9, 9, 100.0),
    ]
    assert result["sczn3Metrics"]["hitRate"] == {"validHitCount": 15, "governedShotCount": 21, "percentage": 71.4}
    assert result["sczn3Metrics"]["objectCoverage"] == {"objectsHit": 15, "scorableObjectCount": 15}
    assert result["authorityTrace"]["scoringAuthority"] == "sczn3-derived-structural-classification-no-publisher-score"
    treatment = result["smartTargetTreatment"]
    assert treatment["publisherScoreStatus"] == "not_defined"
    assert treatment["fixedObservationCountStatus"] == "not_defined"
    assert treatment["engagementSequenceStatus"] == "not_defined"
    assert treatment["missPenaltyStatus"] == "not_defined"
    assert treatment["winnerRuleStatus"] == "not_defined"
    assert treatment["rewardRuleStatus"] == "not_defined_artwork_only"


def test_canonical_face_population_and_shared_treatment():
    treatment = json.loads(TREATMENT.read_text(encoding="utf-8"))
    resolved = contracts()
    assert treatment["visibleStructure"] == {
        "redAimAreaCount": 15, "treeCanopyAimAreaCount": 6, "lowerSceneAimAreaCount": 9,
        "surroundingArtworkIsAimArea": False, "physicalDimensionsInferred": False,
    }
    assert len(treatment["geometry"]["regions"]) == 15
    assert {item["targetProfile"]["id"] for item in resolved} == set(TARGETS)
    for contract in resolved:
        assert contract["components"]["registration"]["definition"]["assetSha256"] == FACE_SHA
        assert contract["components"]["geometry"]["definition"] == treatment["geometry"]
        assert contract["components"]["scoring"]["definition"] == treatment["scoring"]
        assert contract["components"]["mission"]["definition"] == treatment["mission"]
        assert "exactObservations" not in contract["components"]["mission"]["definition"]
        assert contract["components"]["mission"]["definition"]["maxObservations"] == 500


def test_aim_area_object_and_scene_intelligence_without_invented_score():
    varied_points = []
    expected_counts = []
    for index, (_, _, x, y) in enumerate(CENTERS, start=1):
        count = 1 + index % 3
        varied_points.extend([(x, y)] * count)
        expected_counts.append(count)
    varied_points.extend(OUTSIDE_POINTS)
    for contract in contracts():
        result = execute(contract, evidence(varied_points))
        scoring = result["scoring"]
        assert scoring["observationCount"] == sum(expected_counts) + 6
        assert scoring["outsideCount"] == 6
        assert "total" not in scoring
        assert [item["hitCount"] for item in scoring["objectResults"]] == expected_counts
        groups = dimension(scoring, "scene_group")["groups"]
        assert [item["observationCount"] for item in groups] == [sum(expected_counts[:6]), sum(expected_counts[6:])]
        assert [item["objectsHit"] for item in groups] == [6, 9]
        assert scoring["summaryResults"][0]["accountingRole"] == "derived_view_of_primary_observations"
        for point in OUTSIDE_POINTS:
            outside = execute(contract, evidence([point]))
            assert outside["classifications"][0]["regionId"] == "outside"
        try:
            execute(contract, evidence([LIFECYCLE_POINTS[0]] * 501))
        except DeclarativeTargetScoreError as exc:
            assert exc.payload == {"reason": "observation_limit_exceeded"}
        else:
            raise AssertionError("defensive observation maximum was not enforced")


def test_exact_founder_live_21_taps_reconcile_as_15_hits_plus_6_outside():
    for contract in contracts():
        result = execute(contract, evidence(FOUNDER_LIVE_POINTS))
        assert [item["regionId"] for item in result["classifications"]] == list(FOUNDER_LIVE_REGIONS)
        assert result["scoring"]["observationCount"] == 21
        assert result["scoring"]["outsideCount"] == 6
        assert result["sczn3Metrics"]["hitRate"] == {"validHitCount": 15, "governedShotCount": 21, "percentage": 71.4}
        assert result["sczn3Metrics"]["objectCoverage"] == {"objectsHit": 15, "scorableObjectCount": 15}
        groups = dimension(result["scoring"], "scene_group")["groups"]
        assert [(item["objectsHit"], item["objectCount"]) for item in groups] == [(6, 6), (9, 9)]
        assert all(item["classificationMethod"] == "physical_projectile_footprint" for item in result["classifications"])
        assert result["ballisticGeometry"]["classificationMethod"] == "observation_footprint_touch"
        assert result["ballisticGeometry"]["scoreOnTouch"]["multipleValuedRegions"] == "higher_value_wins"


def test_all_three_identities_complete_session_sec_vault_exact_reopen():
    resolved = contracts()
    resolver, store = TargetExecutionContractResolver(tuple(resolved)), MemoryStore()
    sessions = []
    for index, target_id in enumerate(TARGETS, start=1):
        prepared = prepare_session({"targetId": target_id, "missionFamily": "targetScoring"}, store, now=NOW, execution_contract_resolver=resolver)
        started = start_session(
            {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
            store, idempotency_key=f"founder-18-outdoor-{index}", now=NOW, execution_contract_resolver=resolver,
        )
        assert started["interactionContract"]["observations"] == {"max": 500, "exact": None}
        result = execute_authoritative_session({"authoritativeSessionId": started["authoritativeSessionId"], "evidence": evidence()}, store, resolver=resolver)
        assert_lifecycle_result(result, target_id)
        artifact = {
            "sessionId": started["authoritativeSessionId"], "authoritativeSessionId": started["authoritativeSessionId"],
            "sessionIdAuthority": "backend", "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": "targetScoring", "resultPackageType": result["resultPackageType"]},
            "authorityPackage": result, "targetEvidenceImage": deepcopy(IMAGE), "savedToSEC": True,
            "savedAt": NOW.isoformat(), "preservedAt": NOW.isoformat(), "updatedAt": NOW.isoformat(),
        }
        saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
        reopened = read_preserved_sec(started["authoritativeSessionId"], store)
        assert saved["artifactSha256"] == reopened["artifactSha256"]
        assert reopened["session"]["authorityPackage"] == result
        assert_lifecycle_result(reopened["session"]["authorityPackage"], target_id)
        sessions.append(started["authoritativeSessionId"])
    vault = list_preserved_secs(store)
    assert [item["sessionId"] for item in vault["sessions"]] == sessions
    assert [item["authorityPackage"]["scoring"]["observationCount"] for item in vault["sessions"]] == [21, 21, 21]


if __name__ == "__main__":
    test_canonical_face_population_and_shared_treatment()
    test_aim_area_object_and_scene_intelligence_without_invented_score()
    test_exact_founder_live_21_taps_reconcile_as_15_hits_plus_6_outside()
    test_all_three_identities_complete_session_sec_vault_exact_reopen()
    print("PASS Founder 18: 15 red aim areas, 6/9 scene split, artwork/outside count-only, three identities, Session/SEC/Vault/exact reopen")
