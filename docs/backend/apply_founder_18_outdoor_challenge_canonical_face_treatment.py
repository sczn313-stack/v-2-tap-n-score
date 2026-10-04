#!/usr/bin/env python3
"""Apply Founder #18 Outdoor Challenge intelligence to every exact-face identity."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from target_execution_contract import component_digest


ROOT = Path(__file__).resolve().parent
CONTRACTS = ROOT / "target_execution_contracts" / "contracts"
EVIDENCE = ROOT.parent / "authority-evidence" / "platform" / "episode64-founder-walk-2026-10-02"
TREATMENT_PATH = EVIDENCE / "FOUNDER_18_OUTDOOR_CHALLENGE_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "e0e0d0eb46853cb57fcb7f9d8e151a62ffd15e0920e0d30e49a42aeda46b7376"
FILES = (
    "blocker_baker_targets_gf_outdoor_target_scoring_v1.json",
    "final_collection_baker_targets_pk_blastpack_001_target_scoring_v1.json",
    "final_collection_baker_targets_pk_outdoorspack_002_target_scoring_v1.json",
)
EXPECTED_TARGETS = {
    "blocker_baker_targets_gf_outdoor",
    "final_collection_baker_targets_pk_blastpack_001",
    "final_collection_baker_targets_pk_outdoorspack_002",
}

# Red-fill centers are measured from the exact 571 x 750 registered source
# face. The governed ellipse includes the full printed red disc and its dark
# perimeter (nine source pixels from center). The original red-fill-only
# ellipse rejected legitimate Founder edge taps on Flying Bird and Left Bird.
# Surrounding illustrated objects remain count-only outside these aim areas.
AIM_AREAS = (
    ("flying_bird", "Flying Bird", "tree_canopy", 0.455515, 0.182865),
    ("upper_right_bird", "Upper Right Bird", "tree_canopy", 0.703620, 0.242149),
    ("left_bird", "Left Bird", "tree_canopy", 0.219630, 0.319757),
    ("center_tree_animal", "Center Tree Animal", "tree_canopy", 0.552109, 0.341198),
    ("center_left_tree_animal", "Center Left Tree Animal", "tree_canopy", 0.379579, 0.445849),
    ("right_tree_animal", "Right Tree Animal", "tree_canopy", 0.786729, 0.484889),
    ("hanging_animal", "Hanging Animal", "lower_scene", 0.668886, 0.633388),
    ("wanted_poster", "Wanted Poster Silhouette", "lower_scene", 0.481290, 0.680667),
    ("brewery_bottle", "Brewery Bottle", "lower_scene", 0.135525, 0.695271),
    ("fence_white_container", "Fence White Container", "lower_scene", 0.708443, 0.726062),
    ("fence_dark_container", "Fence Dark Container", "lower_scene", 0.833670, 0.726177),
    ("lower_left_large_animal", "Lower Left Large Animal", "lower_scene", 0.373715, 0.782609),
    ("barrel_side_small_animal", "Barrel-Side Small Animal", "lower_scene", 0.127193, 0.909672),
    ("lower_right_rabbit", "Lower Right Rabbit", "lower_scene", 0.848429, 0.920821),
    ("lower_center_snake", "Lower Center Snake", "lower_scene", 0.467601, 0.933333),
)
SCENE_LABELS = {"tree_canopy": "Tree Canopy", "lower_scene": "Lower Challenge Scene"}


def ellipse(region_id: str, cx: float, cy: float) -> dict:
    return {
        "regionId": region_id,
        "shape": "ellipse",
        "cx": cx,
        "cy": cy,
        "radiusX": 0.0123,
        "radiusY": 0.0094,
        "priority": 500,
    }


def build_treatment() -> dict:
    regions, rules, aims = [], {}, []
    scene_members = {scene_id: [] for scene_id in SCENE_LABELS}
    for region_id, label, scene_id, cx, cy in AIM_AREAS:
        regions.append(ellipse(region_id, cx, cy))
        rules[region_id] = {
            "label": label,
            "objectId": region_id,
            "objectLabel": label,
        }
        aims.append({"aimId": f"aim_{region_id}", "regionId": region_id, "xNorm": cx, "yNorm": cy})
        scene_members[scene_id].append(region_id)

    scene_groups = [
        {"groupId": scene_id, "label": SCENE_LABELS[scene_id], "objectIds": members}
        for scene_id, members in scene_members.items()
    ]
    capabilities = {
        "evidence": {"status": "available"},
        "measurement": {"status": "available"},
        "correction": {"status": "not_applicable"},
        "officialScore": {"status": "not_applicable"},
        "publisherMission": {"status": "not_applicable"},
    }
    return {
        "schemaVersion": "sczn3-canonical-face-treatment-v1",
        "faceSha256": FACE_SHA,
        "status": "founder_18_bounded_implementation",
        "publisherAuthority": {
            "canonicalFacePath": "docs/authority-evidence/platform/the-905-blocker-factory-2026-09-29/representations/BLOCKER_FACE_ec96e153068064c02b17.webp",
            "canonicalFaceSha256": FACE_SHA,
            "productUrl": "https://bakertargets.com/product/outdoor-shooting-challenge-target-new/",
            "rule": "The exact publisher face visibly supplies fifteen red printed aim areas attached to challenge objects. SCZN3 may measure aim-area, object, and bounded scene distribution, but may not invent points, quota, sequence, penalty, winner, reward/game procedure, hunting-effectiveness claims, or physical dimensions from pixels. The wanted-poster reward text is artwork only.",
        },
        "visibleStructure": {
            "redAimAreaCount": 15,
            "treeCanopyAimAreaCount": 6,
            "lowerSceneAimAreaCount": 9,
            "surroundingArtworkIsAimArea": False,
            "physicalDimensionsInferred": False,
        },
        "geometry": {
            "coordinateSystem": "normalized_source_image_top_left",
            "layoutModel": "discrete_objects",
            "regions": regions,
            "ugoAuthority": f"SCZN3_VISIBLE_OUTDOOR_CHALLENGE_FACE_{FACE_SHA[:20].upper()}_V1",
        },
        "scoring": {
            "status": "complete",
            "model": "multiple_bulls",
            "regionRules": rules,
            "outsideRule": {"label": "Outside Red Aim Areas", "countsAsHit": False},
            "classificationFootprintMode": "score_on_touch",
            "schemaVersion": "sczn3-target-scoring-data-v1",
            "aggregation": {"mode": "per_object_counts"},
            "summaryDimensions": [
                {"dimensionId": "scene_group", "label": "Scene distribution and completion", "groups": scene_groups}
            ],
            "publisherRuleAuthority": {
                "source": f"publisher canonical face {FACE_SHA}",
                "rule": "Fifteen visible red circles are classified as count-only aim areas. Surrounding object artwork and background are outside the red aim areas. No publisher score, quota, sequence, penalty, reward rule, winner, or game procedure is defined.",
            },
        },
        "mission": {
            "missionFamily": "targetScoring",
            "resultPackageType": "targetScoreResult",
            "resultPackageVersion": "1",
            "maxObservations": 500,
            "interaction": {
                "aim": {"mode": "region_centers", "points": aims},
                "observationInput": "normalized_taps",
                "resultAction": "show_result",
            },
            "capabilityStates": capabilities,
            "smartTargetTreatment": {
                "grammar": ["multi_aim_area", "challenge_object", "scene_group", "count_only_performance"],
                "shooterFacingVocabulary": {"singular": "aim area", "plural": "aim areas"},
                "outsideLabel": "Outside Red Aim Areas",
                "hitAreaLabel": "the fifteen red aim areas",
                "intelligence": [
                    "tap_accuracy", "aim_area_completion", "per_aim_area_counts", "object_distribution",
                    "scene_group_distribution", "scene_group_completion", "outside_aim_area_count",
                    "observation_accounting", "region_detail",
                ],
                "authorityScope": "sczn3_derived_visible_structure",
                "publisherScoreStatus": "not_defined",
                "fixedObservationCountStatus": "not_defined",
                "engagementSequenceStatus": "not_defined",
                "missPenaltyStatus": "not_defined",
                "winnerRuleStatus": "not_defined",
                "rewardRuleStatus": "not_defined_artwork_only",
            },
        },
        "sessionCapabilityStates": capabilities,
        "unsupportedUses": [
            "zeroing_correction", "qualification_or_certification", "invented_numeric_score",
            "invented_fixed_shot_count_or_sequence", "invented_miss_penalty_or_winner_rule",
            "invented_reward_or_game_procedure", "monetary_interpretation_of_wanted_poster_artwork",
            "kill_vital_wound_or_hunting_effectiveness_claims", "inferred_physical_dimensions_from_pixels",
        ],
    }


def main() -> None:
    treatment = build_treatment()
    TREATMENT_PATH.write_text(json.dumps(treatment, indent=2) + "\n", encoding="utf-8")
    identities = set()
    for filename in FILES:
        path = CONTRACTS / filename
        package = json.loads(path.read_text(encoding="utf-8"))
        if package["components"]["registration"]["definition"].get("assetSha256") != FACE_SHA:
            raise SystemExit(f"outdoor_challenge_face_sha_mismatch:{filename}")
        identities.add(package["targetProfile"]["id"])
        package["components"]["geometry"]["definition"] = deepcopy(treatment["geometry"])
        package["components"]["scoring"]["definition"] = deepcopy(treatment["scoring"])
        package["components"]["mission"]["definition"] = deepcopy(treatment["mission"])
        package["session"]["capabilityStates"] = deepcopy(treatment["sessionCapabilityStates"])
        package["session"]["officialMissionRequired"] = False
        package["unsupportedUses"] = deepcopy(treatment["unsupportedUses"])
        for name in ("geometry", "scoring", "mission"):
            package["components"][name]["digest"] = component_digest(package["components"][name])
        path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")
        print(f"UPDATED {path.name} {package['targetProfile']['id']}")
    if identities != EXPECTED_TARGETS:
        raise SystemExit(f"outdoor_challenge_face_population_mismatch:{sorted(identities)}")
    print(f"WROTE {TREATMENT_PATH.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
