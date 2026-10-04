#!/usr/bin/env python3
"""Apply Founder #19 Boss Hog intelligence to every exact-face identity."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from target_execution_contract import component_digest


ROOT = Path(__file__).resolve().parent
CONTRACTS = ROOT / "target_execution_contracts" / "contracts"
EVIDENCE = ROOT.parent / "authority-evidence/platform/episode64-founder-walk-2026-10-02"
TREATMENT_PATH = EVIDENCE / "FOUNDER_19_BOSS_HOG_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "fa6b7512c2ee02c6299798909e9492a3202b7ec13a4766988b65b263909b92b3"
FILES = (
    "blocker_baker_targets_gf_bosshog_target_scoring_v1.json",
    "final_collection_baker_targets_pk_badanimals_002_target_scoring_v1.json",
    "final_collection_baker_targets_pk_badmugcombo_002_target_scoring_v1.json",
)
EXPECTED_TARGETS = {
    "blocker_baker_targets_gf_bosshog",
    "final_collection_baker_targets_pk_badanimals_002",
    "final_collection_baker_targets_pk_badmugcombo_002",
}


# These eight non-overlapping polygons follow the publisher-drawn white solid
# and dashed boundaries on the exact 1141x1500 face. They describe the printed
# regions; Score on Touch evaluates the separate observation footprint without
# inflating any polygon.
REGIONS = [
    {"regionId": "head_8", "label": "Head — 8", "value": 8, "points": [[.326,.126],[.385,.109],[.452,.105],[.512,.125],[.559,.170],[.585,.235],[.585,.301],[.559,.354],[.510,.385],[.452,.390],[.395,.367],[.348,.322],[.321,.260]]},
    {"regionId": "left_upper_2", "label": "Left Upper — 2", "value": 2, "points": [[.223,.281],[.278,.272],[.326,.296],[.361,.359],[.370,.435],[.344,.502],[.307,.552],[.236,.569],[.171,.548],[.122,.495],[.103,.415],[.123,.347],[.168,.301]]},
    {"regionId": "right_upper_2", "label": "Right Upper — 2", "value": 2, "points": [[.575,.278],[.624,.278],[.675,.311],[.711,.367],[.731,.442],[.719,.514],[.688,.558],[.626,.563],[.590,.514],[.566,.438],[.552,.363]]},
    {"regionId": "left_middle_4", "label": "Left Middle — 4", "value": 4, "points": [[.122,.495],[.171,.548],[.236,.569],[.307,.552],[.321,.615],[.308,.694],[.272,.765],[.230,.823],[.175,.808],[.126,.758],[.090,.682],[.087,.595]]},
    {"regionId": "right_middle_4", "label": "Right Middle — 4", "value": 4, "points": [[.626,.563],[.688,.558],[.719,.514],[.751,.574],[.776,.661],[.779,.744],[.754,.800],[.697,.809],[.655,.765],[.627,.688],[.608,.615]]},
    {"regionId": "center_body_8", "label": "Center Body — 8", "value": 8, "points": [[.346,.477],[.405,.451],[.477,.455],[.535,.488],[.575,.548],[.601,.633],[.610,.736],[.602,.839],[.580,.928],[.551,.990],[.367,.990],[.337,.924],[.314,.836],[.306,.736],[.311,.638],[.326,.552]]},
    {"regionId": "left_lower_6", "label": "Left Lower — 6", "value": 6, "points": [[.090,.682],[.126,.758],[.175,.808],[.230,.823],[.272,.765],[.306,.736],[.314,.836],[.337,.924],[.367,.990],[.092,.990],[.073,.911],[.065,.822]]},
    {"regionId": "right_lower_6", "label": "Right Lower — 6", "value": 6, "points": [[.655,.765],[.697,.809],[.754,.800],[.796,.817],[.829,.862],[.837,.922],[.810,.969],[.753,.991],[.551,.990],[.580,.928],[.602,.839],[.610,.736]]},
]


def build_treatment() -> dict:
    geometry_regions = [
        {"regionId": item["regionId"], "shape": "polygon", "points": item["points"], "priority": 100}
        for item in REGIONS
    ]
    rules = {
        item["regionId"]: {
            "label": item["label"],
            "value": item["value"],
            "scoreTier": f"printed_{item['value']}",
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
        "status": "founder_19_bounded_implementation",
        "publisherAuthority": {
            "canonicalFacePath": "docs/authority-evidence/platform/the-905-blocker-factory-2026-09-29/representations/BLOCKER_FACE_1b3fbf7376ea8ec3911b.jpg",
            "canonicalFaceSha256": FACE_SHA,
            "productUrl": "https://bakertargets.com/product/boss-hog-target/",
            "rule": "The exact publisher face visibly labels eight discrete regions: two each worth 8, 6, 4, and 2. Each observation touching a governed printed region earns its printed value under Founder-locked Score on Touch. No shot quota, sequence, maximum score, miss penalty, winner, or game procedure is admitted.",
        },
        "regions": deepcopy(REGIONS),
        "geometry": {
            "coordinateSystem": "normalized_source_image_top_left",
            "layoutModel": "discrete_objects",
            "regions": geometry_regions,
            "ugoAuthority": f"SCZN3_PUBLISHER_NUMBERED_BOSS_HOG_FACE_{FACE_SHA[:20].upper()}_V1",
        },
        "scoring": {
            "status": "complete",
            "model": "mixed_regions",
            "regionRules": rules,
            "outsideRule": {"label": "Outside Scoring Area", "countsAsHit": False, "scoreTier": "outside_count_only"},
            "classificationFootprintMode": "score_on_touch",
            "schemaVersion": "sczn3-target-scoring-data-v1",
            "aggregation": {"mode": "sum_and_classification_counts"},
            "publisherRuleAuthority": {
                "source": f"publisher canonical face {FACE_SHA}",
                "rule": "Eight publisher-numbered regions: two 8-point, two 6-point, two 4-point, and two 2-point. Outside observations are count-only and receive no invented value.",
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
                "grammar": ["publisher_numbered_regions", "open_observation_count", "score_on_touch"],
                "shooterFacingVocabulary": {"singular": "scoring region", "plural": "scoring regions"},
                "outsideLabel": "Outside Scoring Area",
                "hitAreaLabel": "8 numbered scoring regions",
                "intelligence": ["publisher_numbered_score", "hit_and_outside_accounting", "value_distribution", "per_region_performance", "observation_accounting", "region_detail"],
                "authorityScope": "publisher_numbered_canonical_face",
                "publisherScoreStatus": "defined_by_printed_face",
                "fixedObservationCountStatus": "not_defined",
                "boundaryRule": "score_on_touch",
            },
        },
        "sessionCapabilityStates": capabilities,
        "unsupportedUses": [
            "zeroing_correction", "qualification_or_certification",
            "invented_fixed_shot_count_or_sequence", "invented_maximum_score_or_winner_rule",
            "invented_outside_penalty", "invented_game_procedure",
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
            raise SystemExit(f"boss_hog_face_sha_mismatch:{filename}")
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
        raise SystemExit(f"boss_hog_face_population_mismatch:{sorted(identities)}")
    print(f"WROTE {TREATMENT_PATH.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
