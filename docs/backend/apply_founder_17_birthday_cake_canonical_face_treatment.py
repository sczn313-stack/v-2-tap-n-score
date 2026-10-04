#!/usr/bin/env python3
"""Apply Founder #17 Birthday Cake intelligence to both exact-face identities."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from target_execution_contract import component_digest


ROOT = Path(__file__).resolve().parent
CONTRACTS = ROOT / "target_execution_contracts" / "contracts"
EVIDENCE = ROOT.parent / "authority-evidence" / "platform" / "episode64-founder-walk-2026-10-02"
TREATMENT_PATH = EVIDENCE / "FOUNDER_17_BIRTHDAY_CAKE_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "9bb68c840f6d62e5f2a68cb3a0d9154ca688f20c4b3871565b946203877a016e"
FILES = (
    "blocker_baker_targets_gf_birthday_cake_target_scoring_v1.json",
    "final_collection_baker_targets_pk_partypack_001_target_scoring_v1.json",
)
EXPECTED_TARGETS = {
    "blocker_baker_targets_gf_birthday_cake",
    "final_collection_baker_targets_pk_partypack_001",
}


# Polygons are normalized against the exact 1141 x 1500 publisher face. They
# trace only the artwork carrying a printed number. Nearby unnumbered balloons,
# candles, strawberries, character features, and decorations remain count-only.
# Priorities encode visible illustration layering at legitimate seams: the
# numbered strawberry and lower green area paint above the black cake base.
REGIONS = [
    {
        "regionId": "cake_body_100", "label": "Cake Body — 100", "value": 100, "priority": 200,
        "points": [[0.267, 0.430], [0.310, 0.408], [0.391, 0.400], [0.500, 0.405], [0.598, 0.421], [0.668, 0.452], [0.680, 0.527], [0.674, 0.606], [0.641, 0.626], [0.588, 0.628], [0.535, 0.619], [0.497, 0.640], [0.447, 0.625], [0.401, 0.641], [0.361, 0.621], [0.315, 0.631], [0.277, 0.603]],
    },
    {
        "regionId": "party_hat_75", "label": "Party Hat — 75", "value": 75, "priority": 200,
        "points": [[0.674, 0.254], [0.846, 0.424], [0.832, 0.454], [0.802, 0.470], [0.751, 0.466], [0.720, 0.443]],
    },
    {
        "regionId": "left_character_area_50", "label": "Left Character Area — 50", "value": 50, "priority": 300,
        "points": [[0.145, 0.611], [0.197, 0.590], [0.255, 0.585], [0.313, 0.604], [0.356, 0.645], [0.337, 0.692], [0.286, 0.721], [0.222, 0.710], [0.170, 0.681]],
    },
    {
        "regionId": "lower_face_frosting_30", "label": "Lower Face / Frosting — 30", "value": 30, "priority": 350,
        "points": [[0.291, 0.672], [0.350, 0.657], [0.416, 0.667], [0.483, 0.660], [0.547, 0.668], [0.611, 0.687], [0.649, 0.719], [0.615, 0.756], [0.549, 0.775], [0.477, 0.783], [0.401, 0.773], [0.336, 0.751], [0.298, 0.716]],
    },
    {
        "regionId": "right_strawberry_25", "label": "Right Strawberry — 25", "value": 25, "priority": 400,
        "points": [[0.639, 0.676], [0.676, 0.672], [0.710, 0.691], [0.714, 0.724], [0.693, 0.752], [0.660, 0.742], [0.641, 0.713]],
    },
    {
        "regionId": "red_balloon_20", "label": "Red Balloon — 20", "value": 20, "priority": 200,
        "points": [[0.425, 0.096], [0.469, 0.095], [0.505, 0.117], [0.520, 0.153], [0.514, 0.197], [0.488, 0.222], [0.452, 0.232], [0.415, 0.219], [0.391, 0.190], [0.382, 0.151], [0.392, 0.118]],
    },
    {
        "regionId": "black_cake_base_20", "label": "Black Cake Base — 20", "value": 20, "priority": 100,
        "points": [[0.183, 0.699], [0.247, 0.689], [0.319, 0.702], [0.391, 0.716], [0.469, 0.712], [0.548, 0.708], [0.621, 0.702], [0.694, 0.711], [0.724, 0.748], [0.699, 0.795], [0.629, 0.813], [0.548, 0.826], [0.464, 0.833], [0.381, 0.829], [0.301, 0.817], [0.229, 0.797], [0.187, 0.758]],
    },
]


def build_treatment() -> dict:
    geometry_regions = [
        {
            "regionId": item["regionId"],
            "shape": "polygon",
            "points": item["points"],
            "priority": item["priority"],
        }
        for item in REGIONS
    ]
    rules = {
        item["regionId"]: {
            "label": item["label"],
            "value": item["value"],
            "countsAsHit": True,
            "scoreTier": f"publisher_printed_{item['value']}",
            "valueAuthority": "publisher_printed",
        }
        for item in REGIONS
    }
    capabilities = {
        "evidence": {"status": "available"},
        "measurement": {"status": "available"},
        "correction": {"status": "not_applicable"},
        "officialScore": {"status": "available"},
        "publisherMission": {"status": "not_applicable"},
    }
    return {
        "schemaVersion": "sczn3-canonical-face-treatment-v1",
        "faceSha256": FACE_SHA,
        "status": "founder_17_bounded_implementation",
        "publisherAuthority": {
            "canonicalFacePath": "docs/authority-evidence/platform/the-905-blocker-factory-2026-09-29/representations/BLOCKER_FACE_0a976d2f68562205739f.jpg",
            "canonicalFaceSha256": FACE_SHA,
            "productUrl": "https://bakertargets.com/product/birthday-cake-target/",
            "rule": "The exact publisher face visibly labels seven scoring areas: 100, 75, 50, 30, 25, and two separate 20-point areas. Each observation inside governed numbered geometry earns its printed value. No shot quota, sequence, maximum score, age rule, winner rule, birthday procedure, or outside penalty is admitted.",
        },
        "visibleStructure": {
            "printedValueInstances": {"100": 1, "75": 1, "50": 1, "30": 1, "25": 1, "20": 2},
            "printedValueInstanceCount": 7,
            "oneHitEachTotal": 320,
            "unnumberedArtworkValue": None,
        },
        "regions": deepcopy(REGIONS),
        "geometry": {
            "coordinateSystem": "normalized_source_image_top_left",
            "layoutModel": "discrete_objects",
            "regions": geometry_regions,
            "ugoAuthority": f"SCZN3_PUBLISHER_BIRTHDAY_CAKE_FACE_{FACE_SHA[:20].upper()}_V1",
        },
        "scoring": {
            "status": "complete",
            "model": "mixed_regions",
            "regionRules": rules,
            "outsideRule": {"label": "Outside Scoring Area", "countsAsHit": False, "scoreTier": "outside_count_only"},
            "classificationFootprintMode": "tap_center",
            "schemaVersion": "sczn3-target-scoring-data-v1",
            "aggregation": {"mode": "sum_and_classification_counts"},
            "aggregateValueDistribution": True,
            "publisherRuleAuthority": {
                "source": f"publisher canonical face {FACE_SHA}",
                "rule": "Seven publisher-numbered Birthday Cake areas: one each at 100, 75, 50, 30, and 25, plus two distinct 20-point areas. Unnumbered artwork and outside observations are count-only and receive no invented value.",
            },
        },
        "mission": {
            "missionFamily": "targetScoring",
            "resultPackageType": "targetScoreResult",
            "resultPackageVersion": "1",
            "maxObservations": 500,
            "interaction": {
                "aim": {"mode": "not_required", "points": []},
                "observationInput": "normalized_taps",
                "resultAction": "show_result",
            },
            "capabilityStates": capabilities,
            "smartTargetTreatment": {
                "grammar": ["publisher_numbered_regions", "mixed_valued_and_unvalued_artwork", "open_observation_count"],
                "shooterFacingVocabulary": {"singular": "scoring area", "plural": "scoring areas"},
                "outsideLabel": "Outside Scoring Area",
                "hitAreaLabel": "7 numbered scoring areas",
                "intelligence": ["publisher_numbered_score", "hit_and_outside_accounting", "value_distribution", "per_region_performance", "points_per_tap", "observation_accounting", "region_detail"],
                "authorityScope": "publisher_numbered_canonical_face",
                "publisherScoreStatus": "defined_by_printed_face",
                "fixedObservationCountStatus": "not_defined",
                "requiredEngagementOrderStatus": "not_defined",
                "winnerRuleStatus": "not_defined",
                "maximumScoreStatus": "not_defined",
                "ageRuleStatus": "not_defined",
            },
        },
        "sessionCapabilityStates": capabilities,
        "unsupportedUses": [
            "zeroing_correction",
            "qualification_or_certification",
            "invented_fixed_shot_count_or_sequence",
            "invented_maximum_score_or_winner_rule",
            "invented_age_rule_or_birthday_game_procedure",
            "invented_outside_value_or_penalty",
            "transferring_printed_values_to_unnumbered_artwork",
            "physical_hole_extent_or_line_touch_adjudication",
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
            raise SystemExit(f"birthday_cake_face_sha_mismatch:{filename}")
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
        raise SystemExit(f"birthday_cake_face_population_mismatch:{sorted(identities)}")
    print(f"WROTE {TREATMENT_PATH.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
