#!/usr/bin/env python3
"""Apply Founder #14 Balloons intelligence to every exact-face identity."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from target_execution_contract import component_digest


ROOT = Path(__file__).resolve().parent
CONTRACTS = ROOT / "target_execution_contracts" / "contracts"
EVIDENCE = ROOT.parent / "authority-evidence" / "platform" / "episode64-founder-walk-2026-10-02"
TREATMENT_PATH = EVIDENCE / "FOUNDER_14_BALLOONS_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "4e2fc902b18f2afe9a2776fe6882871b4e263a529abe3ba98cfa8243fbb7023d"
FILES = (
    "blocker_baker_targets_gf_balloons_target_scoring_v1.json",
    "final_collection_baker_targets_pk_ladies_005_target_scoring_v1.json",
    "final_collection_baker_targets_pk_partypack_002_target_scoring_v1.json",
)
EXPECTED_TARGETS = {
    "blocker_baker_targets_gf_balloons",
    "final_collection_baker_targets_pk_ladies_005",
    "final_collection_baker_targets_pk_partypack_002",
}

# Centers are measured on the exact 741 x 1000 publisher face. The six radii
# follow the visible nested X/9/8/7/6/5 boundaries. They are source-image
# geometry only; no physical dimensions are inferred from pixels.
BALLOONS = (
    ("pink_upper_left", "Pink Balloon — Upper Left", 145 / 741, 207 / 1000),
    ("green_top", "Green Balloon — Top", 408 / 741, 154 / 1000),
    ("red_upper_right", "Red Balloon — Upper Right", 614 / 741, 280 / 1000),
    ("blue_middle_left", "Blue Balloon — Middle Left", 286 / 741, 427 / 1000),
    ("yellow_middle_right", "Yellow Balloon — Middle Right", 490 / 741, 521 / 1000),
    ("purple_lower_left", "Purple Balloon — Lower Left", 136 / 741, 650 / 1000),
    ("orange_lower_middle", "Orange Balloon — Lower Middle", 355 / 741, 788 / 1000),
    ("teal_lower_right", "Teal Balloon — Lower Right", 600 / 741, 736 / 1000),
)
RINGS = (
    ("x", "X", 10, 20, True),
    ("9", "9", 9, 39, False),
    ("8", "8", 8, 55, False),
    ("7", "7", 7, 71, False),
    ("6", "6", 6, 86, False),
    ("5", "5", 5, 101, False),
)


def build_treatment() -> dict:
    regions, rules = [], {}
    balloon_ids = []
    for balloon_id, balloon_label, cx, cy in BALLOONS:
        balloon_ids.append(balloon_id)
        for ring_index, (ring_id, ring_label, value, radius_px, counts_as_x) in enumerate(RINGS):
            region_id = f"{balloon_id}_{ring_id}"
            regions.append({
                "regionId": region_id,
                "shape": "ellipse",
                "cx": round(cx, 8),
                "cy": round(cy, 8),
                "radiusX": round(radius_px / 741, 8),
                "radiusY": round(radius_px / 1000, 8),
                "priority": 600 - ring_index * 10,
            })
            rule = {
                "label": f"{balloon_label} — {ring_label}",
                "objectId": balloon_id,
                "objectLabel": balloon_label,
                "countsAsHit": True,
                "scoreTier": "sczn3_derived_x_10" if counts_as_x else f"publisher_printed_{value}",
                "valueAuthority": "sczn3_derived" if counts_as_x else "publisher_printed",
            }
            rule["value"] = value
            if counts_as_x:
                rule["countsAsX"] = True
            rules[region_id] = rule

    capabilities = {
        "evidence": {"status": "available"},
        "measurement": {"status": "available"},
        "correction": {"status": "not_applicable"},
        "officialScore": {"status": "not_applicable"},
        "publisherMission": {"status": "available"},
    }
    return {
        "schemaVersion": "sczn3-canonical-face-treatment-v1",
        "faceSha256": FACE_SHA,
        "status": "founder_14_bounded_implementation",
        "publisherAuthority": {
            "canonicalFacePath": "docs/authority-evidence/platform/the-905-blocker-factory-2026-09-29/representations/BLOCKER_FACE_d5d7c4005703f928b67c.jpg",
            "canonicalFaceSha256": FACE_SHA,
            "productUrl": "https://bakertargets.com/product/balloons-target/",
            "rule": "The exact publisher face contains eight distinct balloon objects, each with nested X/9/8/7/6/5 areas. Baker states the objective as how many balloons are popped but publishes no shot quota, sequence, miss penalty, X value, tie-break, or additional game procedure.",
        },
        "authorityLayers": {
            "physicalPublisherTruth": {
                "authority": "Baker Targets canonical face and product page",
                "facts": [
                    "eight distinct balloon objects",
                    "each balloon visibly contains X/9/8/7/6/5 nested areas",
                    "printed numeric values are 9/8/7/6/5",
                    "publisher objective concerns balloons popped",
                    "publisher does not define a numeric X value",
                ],
            },
            "sczn3DerivedIntelligence": {
                "authority": "docs/governance/EPISODE64_FOUNDER_AUTHORITY_PRINTER_SHOOTER_SCZN3_2026-10-03.md",
                "derivationId": "sczn3-balloons-visible-descending-hierarchy-x10-v1",
                "rule": "For this governed Balloons canonical face only, the visible X/9/8/7/6/5 descending hierarchy is interpreted as X=10 for SCZN3-derived shooter-facing scoring.",
                "publisherAttribution": False,
                "inheritance": "explicit canonical-face treatment with the same legitimate structural grammar; never text matching",
            },
        },
        "visibleStructure": {
            "balloonCount": 8,
            "nestedRegionsPerBalloon": ["X", "9", "8", "7", "6", "5"],
            "numericValues": [10, 9, 8, 7, 6, 5],
            "xNumericValue": 10,
            "xValueAuthority": "sczn3_derived",
        },
        "geometry": {
            "coordinateSystem": "normalized_source_image_top_left",
            "layoutModel": "repeated_regions",
            "regions": regions,
            "ugoAuthority": f"SCZN3_PUBLISHER_BALLOONS_FACE_{FACE_SHA[:20].upper()}_V1",
        },
        "scoring": {
            "status": "complete",
            "model": "mixed_regions",
            "regionRules": rules,
            "outsideRule": {"label": "Outside Governed Balloon Areas", "countsAsHit": False, "scoreTier": "outside_count_only"},
            "classificationFootprintMode": "score_on_touch",
            "schemaVersion": "sczn3-target-scoring-data-v1",
            "aggregation": {"mode": "sum_and_classification_counts"},
            "aggregateValueDistribution": True,
            "xScoring": {
                "mode": "sczn3_derived_numeric",
                "label": "X Hits",
                "value": 10,
                "derivationId": "sczn3-balloons-visible-descending-hierarchy-x10-v1",
                "authority": "docs/governance/EPISODE64_FOUNDER_AUTHORITY_PRINTER_SHOOTER_SCZN3_2026-10-03.md",
                "publisherAttribution": False,
                "rule": "X is reported as X, valued at 10 only by this explicit SCZN3-derived Balloons treatment, and included in the SCZN3 Target Score.",
            },
            "publisherRuleAuthority": {
                "source": f"publisher canonical face {FACE_SHA} + Baker Balloons product page",
                "rule": "Publisher truth: eight balloon objects, printed X/9/8/7/6/5 hierarchy, printed 9/8/7/6/5 values, and balloon-popping objective. No Baker-published numeric X value is claimed.",
            },
            "sczn3DerivedIntelligenceAuthority": {
                "source": "Founder authority: docs/governance/EPISODE64_FOUNDER_AUTHORITY_PRINTER_SHOOTER_SCZN3_2026-10-03.md",
                "derivationId": "sczn3-balloons-visible-descending-hierarchy-x10-v1",
                "rule": "SCZN3 interprets X as 10 for this Balloons canonical face because X directly precedes the visible descending 9/8/7/6/5 hierarchy. This is SCZN3-derived, not Baker-published, and does not apply to other X targets without explicit governed structural-grammar inheritance.",
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
                "grammar": ["distinct_balloon_objects", "nested_x_and_numbered_regions", "open_observation_count"],
                "shooterFacingVocabulary": {"singular": "balloon", "plural": "balloons"},
                "objectCompletionVerbPast": "popped",
                "objectCompletionLabel": "Balloons Popped",
                "outsideLabel": "Outside Governed Balloon Areas",
                "hitAreaLabel": "8 balloons",
                "intelligence": ["balloons_popped", "per_balloon_engagement", "per_balloon_tap_distribution", "aggregate_ring_distribution", "publisher_printed_9_through_5", "sczn3_derived_x_10", "complete_observation_accounting", "region_detail"],
                "authorityScope": "publisher_face_truth_plus_explicit_sczn3_derived_intelligence",
                "publisherScoreStatus": "numeric_9_through_5_only_x_value_not_defined",
                "sczn3DerivedScoreStatus": "x_10_from_visible_descending_hierarchy",
                "publisherObjective": "How many balloons are popped",
                "fixedObservationCountStatus": "not_defined",
                "requiredEngagementOrderStatus": "not_defined",
                "winnerRuleStatus": "not_defined",
                "xValueStatus": "sczn3_derived_10_not_publisher_attributed",
            },
        },
        "sessionCapabilityStates": capabilities,
        "unsupportedUses": [
            "zeroing_correction",
            "qualification_or_certification",
            "publisher_attribution_of_sczn3_derived_x_10",
            "automatic_x_10_inheritance_by_text_matching",
            "invented_fixed_shot_count_or_sequence",
            "invented_miss_penalty_or_tie_break",
            "invented_additional_balloon_game_procedure",
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
            raise SystemExit(f"balloons_face_sha_mismatch:{filename}")
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
        raise SystemExit(f"balloons_face_population_mismatch:{sorted(identities)}")
    print(f"WROTE {TREATMENT_PATH.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
