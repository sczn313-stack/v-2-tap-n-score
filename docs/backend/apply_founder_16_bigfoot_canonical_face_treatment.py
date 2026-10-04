#!/usr/bin/env python3
"""Apply Founder #16 Bigfoot intelligence to every exact-face identity."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from target_execution_contract import component_digest


ROOT = Path(__file__).resolve().parent
CONTRACTS = ROOT / "target_execution_contracts" / "contracts"
EVIDENCE = ROOT.parent / "authority-evidence" / "platform" / "episode64-founder-walk-2026-10-02"
TREATMENT_PATH = EVIDENCE / "FOUNDER_16_BIGFOOT_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "330819718b8bc8e4121a5cdc59845233d15eff86946e646a85b9a93700f5ceeb"
FILES = (
    "blocker_baker_targets_gg_bigfoot_target_scoring_v1.json",
    "final_collection_baker_targets_pk_leftout2_002_target_scoring_v1.json",
)
EXPECTED_TARGETS = {
    "blocker_baker_targets_gg_bigfoot",
    "final_collection_baker_targets_pk_leftout2_002",
}


def ellipse(region_id: str, cx: float, cy: float, radius_x: float, radius_y: float, priority: int) -> dict:
    return {
        "regionId": region_id,
        "shape": "ellipse",
        "cx": cx,
        "cy": cy,
        "radiusX": radius_x,
        "radiusY": radius_y,
        "priority": priority,
    }


def polygon(region_id: str, points: list[list[float]], priority: int) -> dict:
    return {"regionId": region_id, "shape": "polygon", "points": points, "priority": priority}


# Normalized source-image geometry measured from the exact 1141 x 1500 face.
# These bounds describe visible image areas only; they are not physical target
# dimensions and do not imply hunting, wound, vital, or tactical semantics.
LEFT_EYE = (0.4584, 0.1760)
RIGHT_EYE = (0.5355, 0.1753)
LEFT_EYE_CENTER = (0.4592, 0.1747)
RIGHT_EYE_CENTER = (0.5346, 0.1740)

HEAD_FACE = [
    [0.398, 0.073], [0.485, 0.069], [0.563, 0.085], [0.611, 0.126],
    [0.633, 0.191], [0.617, 0.258], [0.576, 0.309], [0.527, 0.342],
    [0.450, 0.342], [0.401, 0.310], [0.360, 0.260], [0.347, 0.191],
    [0.363, 0.126],
]
UPPER_TORSO = [
    [0.350, 0.278], [0.420, 0.318], [0.487, 0.349], [0.555, 0.318],
    [0.625, 0.278], [0.697, 0.302], [0.741, 0.361], [0.686, 0.428],
    [0.590, 0.450], [0.487, 0.426], [0.388, 0.450], [0.290, 0.426],
    [0.237, 0.361], [0.279, 0.302],
]
ABDOMEN = [
    [0.386, 0.424], [0.487, 0.405], [0.591, 0.424], [0.635, 0.518],
    [0.598, 0.588], [0.526, 0.632], [0.451, 0.632], [0.379, 0.588],
    [0.343, 0.518],
]
LEFT_ARM = [
    [0.266, 0.234], [0.355, 0.270], [0.341, 0.372], [0.306, 0.477],
    [0.285, 0.610], [0.244, 0.687], [0.184, 0.682], [0.135, 0.624],
    [0.125, 0.530], [0.151, 0.431], [0.174, 0.337],
]
RIGHT_ARM = [
    [0.660, 0.220], [0.748, 0.245], [0.801, 0.337], [0.824, 0.431], [0.849, 0.530],
    [0.839, 0.624], [0.791, 0.682], [0.732, 0.687], [0.690, 0.610],
    [0.670, 0.477], [0.625, 0.372], [0.610, 0.270],
]
LEFT_LEG = [
    [0.350, 0.535], [0.479, 0.594], [0.487, 0.716], [0.471, 0.842],
    [0.455, 0.950], [0.401, 0.973], [0.323, 0.958], [0.279, 0.913],
    [0.286, 0.799], [0.300, 0.680],
]
RIGHT_LEG = [
    [0.626, 0.535], [0.705, 0.680], [0.705, 0.799], [0.698, 0.913],
    [0.653, 0.958], [0.575, 0.973], [0.522, 0.950], [0.505, 0.842],
    [0.489, 0.716], [0.498, 0.594],
]


def build_treatment() -> dict:
    regions = [
        ellipse("left_eye_center", *LEFT_EYE_CENTER, 0.0060, 0.0048, 1000),
        ellipse("right_eye_center", *RIGHT_EYE_CENTER, 0.0060, 0.0048, 1000),
        ellipse("left_red_eye", *LEFT_EYE, 0.0205, 0.0115, 900),
        ellipse("right_red_eye", *RIGHT_EYE, 0.0205, 0.0115, 900),
        polygon("head_face", HEAD_FACE, 700),
        # Peer anatomical polygons intentionally overlap at illustrated fur
        # transitions. Priorities encode the visible ownership of those seams:
        # arms win at shoulder seams; torso then wins over abdomen/leg seams.
        # The shared ambiguity gate remains strict and unchanged.
        polygon("left_arm", LEFT_ARM, 650),
        polygon("right_arm", RIGHT_ARM, 650),
        polygon("upper_torso_chest", UPPER_TORSO, 640),
        polygon("abdomen", ABDOMEN, 630),
        polygon("left_leg", LEFT_LEG, 620),
        polygon("right_leg", RIGHT_LEG, 620),
    ]
    rules = {
        "left_eye_center": {"label": "Left Eye — White Center", "objectId": "left_eye_center", "objectLabel": "Left Eye — White Center"},
        "left_red_eye": {"label": "Left Eye — Red Area", "objectId": "left_red_eye", "objectLabel": "Left Eye — Red Area"},
        "right_eye_center": {"label": "Right Eye — White Center", "objectId": "right_eye_center", "objectLabel": "Right Eye — White Center"},
        "right_red_eye": {"label": "Right Eye — Red Area", "objectId": "right_red_eye", "objectLabel": "Right Eye — Red Area"},
        "head_face": {"label": "Head / Face", "objectId": "head_face", "objectLabel": "Head / Face"},
        "upper_torso_chest": {"label": "Upper Torso / Chest", "objectId": "upper_torso_chest", "objectLabel": "Upper Torso / Chest"},
        "abdomen": {"label": "Abdomen", "objectId": "abdomen", "objectLabel": "Abdomen"},
        "left_arm": {"label": "Left Arm", "objectId": "left_arm", "objectLabel": "Left Arm"},
        "right_arm": {"label": "Right Arm", "objectId": "right_arm", "objectLabel": "Right Arm"},
        "left_leg": {"label": "Left Leg", "objectId": "left_leg", "objectLabel": "Left Leg"},
        "right_leg": {"label": "Right Leg", "objectId": "right_leg", "objectLabel": "Right Leg"},
    }
    eye_objects = ["left_eye_center", "left_red_eye", "right_eye_center", "right_red_eye"]
    anatomy_objects = ["head_face", "upper_torso_chest", "abdomen", "left_arm", "right_arm", "left_leg", "right_leg"]
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
        "status": "founder_16_bounded_implementation",
        "publisherAuthority": {
            "canonicalFacePath": "docs/authority-evidence/platform/the-905-blocker-factory-2026-09-29/representations/BLOCKER_FACE_147c97fc046a421cecae.jpg",
            "canonicalFaceSha256": FACE_SHA,
            "productUrl": "https://bakertargets.com/product/bigfoot-target/",
            "rule": "The exact publisher face visibly supplies one Bigfoot silhouette, two red-eye aim areas, and a white center mark in each eye. SCZN3 may classify and compare those visible areas, but may not invent points, shot rules, game procedure, physical dimensions, or vital/kill/wound/tactical semantics.",
        },
        "visibleStructure": {
            "primaryObjectCount": 1,
            "eyeAimAreaCount": 2,
            "nestedEyeCenterCount": 2,
            "boundedAnatomicalAreaCount": 7,
            "physicalDimensionsInferred": False,
        },
        "geometry": {
            "coordinateSystem": "normalized_source_image_top_left",
            "layoutModel": "discrete_objects",
            "regions": regions,
            "ugoAuthority": f"SCZN3_VISIBLE_BIGFOOT_FACE_{FACE_SHA[:20].upper()}_V1",
        },
        "scoring": {
            "status": "complete",
            "model": "multiple_bulls",
            "regionRules": rules,
            "outsideRule": {"label": "Outside Bigfoot Areas", "countsAsHit": False},
            "classificationFootprintMode": "tap_center",
            "schemaVersion": "sczn3-target-scoring-data-v1",
            "aggregation": {"mode": "per_object_counts"},
            "summaryDimensions": [
                {
                    "dimensionId": "feature_class",
                    "label": "Bigfoot area distribution",
                    "groups": [
                        {"groupId": "eyes", "label": "Eyes", "objectIds": eye_objects},
                        {"groupId": "silhouette_areas", "label": "Silhouette Areas", "objectIds": anatomy_objects},
                    ],
                }
            ],
            "publisherRuleAuthority": {
                "source": f"publisher canonical face {FACE_SHA}",
                "rule": "Visible eye and silhouette areas are classified as non-numeric SCZN3-derived target intelligence. No publisher score, fixed shot count, sequence, maximum, penalty, winner rule, vital-zone claim, or game procedure is defined.",
            },
        },
        "mission": {
            "missionFamily": "targetScoring",
            "resultPackageType": "targetScoreResult",
            "resultPackageVersion": "1",
            "maxObservations": 500,
            "interaction": {
                "aim": {
                    "mode": "region_centers",
                    "points": [
                        {"aimId": "aim_left_eye", "regionId": "left_eye_center", "xNorm": LEFT_EYE_CENTER[0], "yNorm": LEFT_EYE_CENTER[1]},
                        {"aimId": "aim_right_eye", "regionId": "right_eye_center", "xNorm": RIGHT_EYE_CENTER[0], "yNorm": RIGHT_EYE_CENTER[1]},
                    ],
                },
                "observationInput": "normalized_taps",
                "resultAction": "show_result",
            },
            "capabilityStates": capabilities,
            "smartTargetTreatment": {
                "grammar": ["nested_aim_area", "silhouette_region", "count_only_performance"],
                "shooterFacingVocabulary": {"singular": "target area", "plural": "target areas"},
                "outsideLabel": "Outside Bigfoot Areas",
                "hitAreaLabel": "the visible Bigfoot eye and silhouette areas",
                "intelligence": [
                    "tap_accuracy", "target_area_completion", "per_target_area_counts",
                    "eye_center_accuracy", "eye_distribution", "silhouette_area_distribution",
                    "outside_target_area_count", "observation_accounting", "region_detail",
                ],
                "authorityScope": "sczn3_derived_visible_structure",
                "publisherScoreStatus": "not_defined",
                "fixedObservationCountStatus": "not_defined",
                "engagementSequenceStatus": "not_defined",
                "winnerRuleStatus": "not_defined",
                "x10AuthorityStatus": "not_applicable",
                "presentationRule": "Preserve everything underneath. Present what happened first.",
            },
        },
        "sessionCapabilityStates": capabilities,
        "unsupportedUses": [
            "zeroing_correction", "qualification_or_certification", "invented_numeric_score",
            "invented_fixed_shot_count_or_sequence", "invented_maximum_score_or_winner_rule",
            "invented_game_procedure", "invented_outside_penalty", "x10_scoring",
            "vital_kill_wound_threat_tactical_or_effectiveness_claims",
            "inferred_physical_dimensions_from_pixels", "physical_hole_extent_or_line_touch_adjudication",
        ],
    }


def main() -> None:
    treatment = build_treatment()
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    TREATMENT_PATH.write_text(json.dumps(treatment, indent=2) + "\n", encoding="utf-8")
    identities = set()
    for filename in FILES:
        path = CONTRACTS / filename
        package = json.loads(path.read_text(encoding="utf-8"))
        if package["components"]["registration"]["definition"].get("assetSha256") != FACE_SHA:
            raise SystemExit(f"bigfoot_face_sha_mismatch:{filename}")
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
        raise SystemExit(f"bigfoot_face_population_mismatch:{sorted(identities)}")
    print(f"WROTE {TREATMENT_PATH.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
