#!/usr/bin/env python3
"""Apply Founder #21 Bull Shot intelligence to every exact-face identity."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from target_execution_contract import component_digest


ROOT = Path(__file__).resolve().parent
CONTRACTS = ROOT / "target_execution_contracts" / "contracts"
EVIDENCE = ROOT.parent / "authority-evidence/platform/episode64-founder-walk-2026-10-02"
TREATMENT_PATH = EVIDENCE / "FOUNDER_21_BULL_SHOT_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "416e346cdbbf4c23cc8aa0c8690b2bc0fac019749db7a117e4eb051129a668db"
FILES = (
    "blocker_baker_targets_gf_bullshot_target_scoring_v1.json",
    "final_collection_baker_targets_pk_badanimals_003_target_scoring_v1.json",
    "final_collection_baker_targets_pk_badmugcombo_003_target_scoring_v1.json",
)
EXPECTED_TARGETS = {
    "blocker_baker_targets_gf_bullshot",
    "final_collection_baker_targets_pk_badanimals_003",
    "final_collection_baker_targets_pk_badmugcombo_003",
}


# Normalized source-image polygons measured from the exact 1167 x 1500 face.
# They follow the publisher's solid and dashed printed boundaries. Score on
# Touch evaluates the separate bullet-hole footprint without enlarging them.
REGIONS = [
    {"regionId": "head_10", "label": "Head — 10", "value": 10, "points": [[.425,.215],[.465,.201],[.520,.198],[.575,.207],[.615,.228],[.625,.273],[.608,.317],[.572,.350],[.520,.362],[.468,.348],[.432,.314],[.421,.264]]},
    {"regionId": "left_upper_4", "label": "Left Upper — 4", "value": 4, "points": [[.334,.249],[.390,.270],[.425,.315],[.421,.375],[.392,.435],[.361,.495],[.343,.565],[.315,.635],[.274,.668],[.219,.657],[.169,.615],[.151,.552],[.170,.475],[.205,.404],[.239,.333],[.282,.277]]},
    {"regionId": "left_middle_8", "label": "Left Middle — 8", "value": 8, "points": [[.342,.438],[.391,.411],[.436,.432],[.462,.487],[.459,.552],[.448,.619],[.431,.688],[.405,.746],[.370,.768],[.337,.736],[.321,.681],[.319,.620],[.327,.558]]},
    {"regionId": "left_lower_6", "label": "Left Lower — 6", "value": 6, "points": [[.260,.672],[.316,.658],[.337,.705],[.337,.767],[.325,.833],[.316,.906],[.322,.990],[.248,.990],[.236,.925],[.235,.850],[.238,.774]]},
    {"regionId": "left_outer_lower_4", "label": "Left Lower Outer — 4", "value": 4, "points": [[.150,.619],[.219,.657],[.260,.672],[.238,.774],[.235,.850],[.236,.925],[.248,.990],[.126,.990],[.129,.932],[.144,.866],[.151,.801],[.140,.742]]},
    {"regionId": "right_upper_4", "label": "Right Upper — 4", "value": 4, "points": [[.615,.274],[.670,.290],[.716,.329],[.739,.388],[.753,.455],[.780,.520],[.811,.579],[.818,.644],[.787,.691],[.737,.698],[.700,.670],[.675,.615],[.660,.552],[.640,.490],[.613,.432],[.593,.374]]},
    {"regionId": "right_middle_8", "label": "Right Middle — 8", "value": 8, "points": [[.548,.431],[.593,.402],[.632,.430],[.654,.487],[.663,.551],[.674,.616],[.692,.682],[.695,.749],[.673,.789],[.636,.772],[.604,.731],[.580,.672],[.563,.612],[.551,.548],[.536,.486]]},
    {"regionId": "right_lower_6", "label": "Right Lower — 6", "value": 6, "points": [[.695,.680],[.736,.694],[.762,.736],[.765,.800],[.757,.865],[.747,.930],[.744,.990],[.666,.990],[.675,.931],[.683,.870],[.688,.809]]},
    {"regionId": "right_arm_2", "label": "Right Arm — 2", "value": 2, "points": [[.787,.690],[.824,.690],[.849,.728],[.857,.785],[.875,.840],[.901,.897],[.891,.923],[.847,.902],[.810,.867],[.779,.819],[.761,.764],[.762,.720]]},
    {"regionId": "center_lower_8", "label": "Center Lower — 8", "value": 8, "points": [[.404,.744],[.454,.726],[.510,.724],[.567,.733],[.608,.766],[.634,.817],[.641,.878],[.630,.934],[.602,.974],[.578,.990],[.408,.990],[.380,.961],[.354,.914],[.339,.858],[.344,.806],[.368,.767]]},
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
        "status": "founder_21_bounded_implementation",
        "publisherAuthority": {
            "canonicalFacePath": "docs/authority-evidence/platform/the-905-blocker-factory-2026-09-29/representations/BLOCKER_FACE_6863f5130880b07072bb.jpg",
            "canonicalFaceSha256": FACE_SHA,
            "productUrl": "https://bakertargets.com/product/bull-shot-target/",
            "rule": "The exact publisher face visibly labels ten discrete regions: one 10-point, three 8-point, two 6-point, three 4-point, and one 2-point. Each observation touching a governed printed region earns its printed value under Founder-locked Score on Touch. No shot quota, sequence, maximum score, miss penalty, winner, or game procedure is admitted.",
        },
        "visibleStructure": {
            "governedRegionCount": 10,
            "printedValueDistribution": {"10": 1, "8": 3, "6": 2, "4": 3, "2": 1},
            "referencePatternTotal": 60,
            "physicalDimensionsInferred": False,
        },
        "regions": deepcopy(REGIONS),
        "geometry": {
            "coordinateSystem": "normalized_source_image_top_left",
            "layoutModel": "discrete_objects",
            "regions": geometry_regions,
            "ugoAuthority": f"SCZN3_PUBLISHER_NUMBERED_BULL_SHOT_FACE_{FACE_SHA[:20].upper()}_V1",
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
                "rule": "Ten publisher-numbered regions: one 10-point, three 8-point, two 6-point, three 4-point, and one 2-point. Outside observations are count-only and receive no invented value.",
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
                "hitAreaLabel": "10 numbered scoring regions",
                "intelligence": ["publisher_numbered_score", "hit_and_outside_accounting", "value_distribution", "per_region_performance", "observation_accounting", "region_detail"],
                "authorityScope": "publisher_numbered_canonical_face",
                "publisherScoreStatus": "defined_by_printed_face",
                "fixedObservationCountStatus": "not_defined",
                "boundaryRule": "score_on_touch",
                "presentationRule": "Preserve everything underneath. Present what happened first.",
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
            raise SystemExit(f"bull_shot_face_sha_mismatch:{filename}")
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
        raise SystemExit(f"bull_shot_face_population_mismatch:{sorted(identities)}")
    print(f"WROTE {TREATMENT_PATH.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
