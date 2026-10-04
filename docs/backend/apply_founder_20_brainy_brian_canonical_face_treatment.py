#!/usr/bin/env python3
"""Apply Founder #20 Brainy Brian intelligence to every exact-face identity."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from target_execution_contract import component_digest


ROOT = Path(__file__).resolve().parent
CONTRACTS = ROOT / "target_execution_contracts" / "contracts"
EVIDENCE = ROOT.parent / "authority-evidence" / "platform" / "episode64-founder-walk-2026-10-02"
TREATMENT_PATH = EVIDENCE / "FOUNDER_20_BRAINY_BRIAN_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "3de161ec482fc4d03d4b228f2374f0e7e9e5dc5fc86db7994cbc83cd9ebeed1f"
FILES = (
    "blocker_baker_targets_z_bb_target_scoring_v1.json",
    "final_collection_baker_targets_pk_zombiepack_001_target_scoring_v1.json",
)
EXPECTED_TARGETS = {
    "blocker_baker_targets_z_bb",
    "final_collection_baker_targets_pk_zombiepack_001",
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


# Normalized source-image geometry measured from the exact 1167 x 1500 face.
# These polygons follow visible printed features. They are neither physical
# dimensions nor kill/vital/wound/tactical zones. Higher priority implements
# the Founder-locked rule that the most-specific legitimate feature wins.
EXPOSED_BRAIN = [
    [0.486, 0.105], [0.526, 0.101], [0.575, 0.111], [0.618, 0.130],
    [0.647, 0.159], [0.642, 0.188], [0.609, 0.209], [0.565, 0.207],
    [0.523, 0.190], [0.493, 0.163],
]
MOUTH_TEETH = [
    [0.551, 0.306], [0.598, 0.301], [0.642, 0.314], [0.673, 0.341],
    [0.670, 0.373], [0.638, 0.393], [0.596, 0.390], [0.560, 0.367],
    [0.540, 0.337],
]
HEAD_FACE = [
    [0.438, 0.121], [0.497, 0.099], [0.570, 0.105], [0.636, 0.137],
    [0.681, 0.193], [0.688, 0.259], [0.672, 0.329], [0.636, 0.397],
    [0.575, 0.421], [0.508, 0.401], [0.459, 0.361], [0.425, 0.302],
    [0.405, 0.234], [0.409, 0.169],
]
UPPER_TORSO = [
    [0.329, 0.334], [0.415, 0.363], [0.505, 0.397], [0.600, 0.385],
    [0.683, 0.401], [0.731, 0.475], [0.729, 0.590], [0.681, 0.703],
    [0.620, 0.815], [0.525, 0.850], [0.422, 0.827], [0.346, 0.751],
    [0.299, 0.633], [0.291, 0.485],
]
EXPOSED_ABDOMEN = [
    [0.367, 0.657], [0.421, 0.641], [0.494, 0.657], [0.557, 0.697],
    [0.577, 0.759], [0.550, 0.817], [0.491, 0.842], [0.427, 0.830],
    [0.382, 0.794], [0.352, 0.733],
]
LEFT_ARM_HAND = [
    [0.252, 0.299], [0.345, 0.331], [0.383, 0.420], [0.348, 0.525],
    [0.302, 0.622], [0.257, 0.720], [0.221, 0.827], [0.199, 0.916],
    [0.177, 0.982], [0.118, 0.978], [0.091, 0.914], [0.100, 0.824],
    [0.075, 0.723], [0.048, 0.616], [0.060, 0.491], [0.111, 0.385],
    [0.175, 0.322],
]
RIGHT_ARM_HAND = [
    [0.650, 0.350], [0.711, 0.358], [0.760, 0.408], [0.786, 0.355],
    [0.809, 0.306], [0.847, 0.312], [0.846, 0.379], [0.904, 0.414],
    [0.942, 0.463], [0.956, 0.539], [0.935, 0.590], [0.894, 0.567],
    [0.866, 0.527], [0.835, 0.578], [0.792, 0.565], [0.747, 0.525],
    [0.706, 0.611], [0.658, 0.683], [0.618, 0.634], [0.626, 0.532],
]
LOWER_BODY = [
    [0.294, 0.803], [0.381, 0.798], [0.481, 0.829], [0.584, 0.810],
    [0.674, 0.823], [0.692, 0.909], [0.673, 0.996], [0.273, 0.996],
    [0.258, 0.918],
]

LEFT_EYE = (0.5065, 0.2760)
RIGHT_EYE = (0.6070, 0.2460)
LEFT_EYE_CENTER = (0.5065, 0.2760)
RIGHT_EYE_CENTER = (0.6070, 0.2460)


def build_treatment() -> dict:
    regions = [
        ellipse("left_eye_center", *LEFT_EYE_CENTER, 0.0100, 0.0080, 1000),
        ellipse("right_eye_center", *RIGHT_EYE_CENTER, 0.0085, 0.0070, 1000),
        ellipse("left_eye", *LEFT_EYE, 0.0400, 0.0370, 900),
        ellipse("right_eye", *RIGHT_EYE, 0.0380, 0.0350, 900),
        polygon("exposed_brain", EXPOSED_BRAIN, 860),
        polygon("mouth_teeth", MOUTH_TEETH, 850),
        polygon("exposed_abdomen_intestines", EXPOSED_ABDOMEN, 840),
        polygon("head_face", HEAD_FACE, 700),
        polygon("left_arm_hand", LEFT_ARM_HAND, 660),
        polygon("right_arm_hand", RIGHT_ARM_HAND, 660),
        polygon("upper_torso", UPPER_TORSO, 640),
        polygon("lower_body", LOWER_BODY, 620),
    ]
    labels = {
        "left_eye_center": "Left Eye — White Center",
        "right_eye_center": "Right Eye — White Center",
        "left_eye": "Left Eye",
        "right_eye": "Right Eye",
        "exposed_brain": "Exposed Brain",
        "mouth_teeth": "Mouth / Teeth",
        "exposed_abdomen_intestines": "Exposed Abdomen / Intestines",
        "head_face": "Head / Face",
        "left_arm_hand": "Left Arm / Hand",
        "right_arm_hand": "Right Arm / Hand",
        "upper_torso": "Upper Torso",
        "lower_body": "Lower Body",
    }
    rules = {
        region_id: {"label": label, "objectId": region_id, "objectLabel": label}
        for region_id, label in labels.items()
    }
    precision_features = [
        "left_eye_center", "right_eye_center", "left_eye", "right_eye",
        "exposed_brain", "mouth_teeth", "exposed_abdomen_intestines",
    ]
    body_areas = ["head_face", "left_arm_hand", "right_arm_hand", "upper_torso", "lower_body"]
    aims = [
        {"aimId": "aim_left_eye", "regionId": "left_eye_center", "xNorm": LEFT_EYE_CENTER[0], "yNorm": LEFT_EYE_CENTER[1]},
        {"aimId": "aim_right_eye", "regionId": "right_eye_center", "xNorm": RIGHT_EYE_CENTER[0], "yNorm": RIGHT_EYE_CENTER[1]},
        {"aimId": "aim_exposed_brain", "regionId": "exposed_brain", "xNorm": 0.565, "yNorm": 0.155},
        {"aimId": "aim_mouth", "regionId": "mouth_teeth", "xNorm": 0.605, "yNorm": 0.350},
        {"aimId": "aim_exposed_abdomen", "regionId": "exposed_abdomen_intestines", "xNorm": 0.470, "yNorm": 0.745},
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
        "status": "founder_20_bounded_implementation",
        "publisherAuthority": {
            "canonicalFacePath": "docs/authority-evidence/platform/the-905-blocker-factory-2026-09-29/representations/BLOCKER_FACE_e3150e6fd7cc25b8b2e1.jpg",
            "canonicalFaceSha256": FACE_SHA,
            "productUrl": "https://bakertargets.com/product/brainy-brian-zombie-target/",
            "rule": "The exact publisher face visibly supplies one Brainy Brian zombie silhouette with an exposed brain, nested eye structure, mouth/teeth, exposed abdomen/intestines, and bounded body areas. SCZN3 may classify and compare those visible features but may not invent points, shot rules, game procedure, physical dimensions, or kill/vital/wound/threat/tactical semantics.",
        },
        "visibleStructure": {
            "primaryObjectCount": 1,
            "nestedEyeCount": 2,
            "nestedEyeCenterCount": 2,
            "precisionFeatureCount": len(precision_features),
            "boundedBodyAreaCount": len(body_areas),
            "governedRegionCount": len(regions),
            "physicalDimensionsInferred": False,
        },
        "geometry": {
            "coordinateSystem": "normalized_source_image_top_left",
            "layoutModel": "discrete_objects",
            "regions": regions,
            "ugoAuthority": f"SCZN3_VISIBLE_BRAINY_BRIAN_FACE_{FACE_SHA[:20].upper()}_V1",
        },
        "scoring": {
            "status": "complete",
            "model": "multiple_bulls",
            "regionRules": rules,
            "outsideRule": {"label": "Outside Brainy Brian Areas", "countsAsHit": False},
            "classificationFootprintMode": "score_on_touch",
            "schemaVersion": "sczn3-target-scoring-data-v1",
            "aggregation": {"mode": "per_object_counts"},
            "summaryDimensions": [
                {
                    "dimensionId": "feature_class",
                    "label": "Brainy Brian feature distribution",
                    "groups": [
                        {"groupId": "precision_features", "label": "Distinct Features", "objectIds": precision_features},
                        {"groupId": "body_areas", "label": "Body Areas", "objectIds": body_areas},
                    ],
                }
            ],
            "publisherRuleAuthority": {
                "source": f"publisher canonical face {FACE_SHA}",
                "rule": "Visible printed features and body areas are classified as non-numeric SCZN3-derived target intelligence. No publisher score, quota, sequence, maximum, penalty, winner, kill/vital/wound claim, or game procedure is defined.",
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
                "grammar": ["nested_aim_area", "feature_region", "silhouette_region", "count_only_performance"],
                "shooterFacingVocabulary": {"singular": "target area", "plural": "target areas"},
                "outsideLabel": "Outside Brainy Brian Areas",
                "hitAreaLabel": "the visible Brainy Brian features and body areas",
                "intelligence": [
                    "tap_accuracy", "target_area_completion", "per_target_area_counts",
                    "nested_eye_center_accuracy", "feature_distribution", "body_area_distribution",
                    "outside_target_area_count", "observation_accounting", "region_detail",
                ],
                "authorityScope": "sczn3_derived_visible_structure",
                "publisherScoreStatus": "not_defined",
                "fixedObservationCountStatus": "not_defined",
                "engagementSequenceStatus": "not_defined",
                "winnerRuleStatus": "not_defined",
                "x10AuthorityStatus": "not_applicable",
                "classificationPrecedence": "most_specific_legitimate_feature_wins",
                "presentationRule": "Preserve everything underneath. Present what happened first.",
            },
        },
        "sessionCapabilityStates": capabilities,
        "unsupportedUses": [
            "zeroing_correction", "qualification_or_certification", "invented_numeric_score",
            "invented_fixed_shot_count_or_sequence", "invented_maximum_score_or_winner_rule",
            "invented_game_procedure", "invented_outside_penalty", "x10_scoring",
            "vital_kill_wound_threat_tactical_or_effectiveness_claims",
            "inferred_physical_dimensions_from_pixels",
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
            raise SystemExit(f"brainy_brian_face_sha_mismatch:{filename}")
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
        raise SystemExit(f"brainy_brian_face_population_mismatch:{sorted(identities)}")
    print(f"WROTE {TREATMENT_PATH.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
