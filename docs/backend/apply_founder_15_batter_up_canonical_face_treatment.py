#!/usr/bin/env python3
"""Apply Founder #15 Batter Up publisher-outcome intelligence to its exact face."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from sczn3_derived_scoring_authority import resolve_ordered_x_scoring
from target_execution_contract import component_digest


ROOT = Path(__file__).resolve().parent
CONTRACTS = ROOT / "target_execution_contracts" / "contracts"
EVIDENCE = ROOT.parent / "authority-evidence" / "platform" / "episode64-founder-walk-2026-10-02"
TREATMENT_PATH = EVIDENCE / "FOUNDER_15_BATTER_UP_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "e1a7ed4757478eaf3b281c0ecefea6c44af286e048f90127b9ae5d0a5be0e8f3"
FILE = "blocker_baker_targets_gf_batterup_target_scoring_v1.json"
TARGET_ID = "blocker_baker_targets_gf_batterup"
WIDTH, HEIGHT = 1141, 1523


def ellipse(region_id: str, cx: int, cy: int, radius_x: int, radius_y: int, priority: int) -> dict:
    return {
        "regionId": region_id,
        "shape": "ellipse",
        "cx": round(cx / WIDTH, 8),
        "cy": round(cy / HEIGHT, 8),
        "radiusX": round(radius_x / WIDTH, 8),
        "radiusY": round(radius_y / HEIGHT, 8),
        "priority": priority,
    }


def polygon(region_id: str, points: list[tuple[int, int]], priority: int) -> dict:
    return {
        "regionId": region_id,
        "shape": "polygon",
        "points": [[round(x / WIDTH, 8), round(y / HEIGHT, 8)] for x, y in points],
        "priority": priority,
    }


BALLS = (
    ("home_run_left", "Home Run — Left", "home_run", "Home Run", 98, 153, 55, 55),
    ("home_run_right", "Home Run — Right", "home_run", "Home Run", 1041, 153, 55, 55),
    ("triple_left", "Triple — Left", "triple", "Triple", 243, 356, 67, 66),
    ("triple_center", "Triple — Center", "triple", "Triple", 570, 302, 65, 67),
    ("triple_right", "Triple — Right", "triple", "Triple", 895, 356, 67, 66),
    ("out_ball_left", "Out Ball — Left", "out", "Out", 356, 507, 73, 75),
    ("out_ball_right", "Out Ball — Right", "out", "Out", 769, 507, 73, 75),
    ("single_center", "Single — Center", "single", "Single", 570, 549, 75, 80),
    ("double_left", "Double — Left", "double", "Double", 166, 610, 77, 79),
    ("double_right", "Double — Right", "double", "Double", 966, 610, 77, 79),
    ("single_lower_left", "Single — Lower Left", "single", "Single", 350, 751, 77, 80),
    ("single_lower_right", "Single — Lower Right", "single", "Single", 786, 751, 77, 80),
    ("base_on_balls", "Base on Balls", "base_on_balls", "Base on Balls", 570, 1270, 82, 84),
)

BASES = (
    ("first", "1st Base", 888, 1033),
    ("second", "2nd Base", 570, 789),
    ("third", "3rd Base", 252, 1033),
)


def rule(label: str, object_id: str, outcome_id: str, outcome_label: str) -> dict:
    return {
        "label": label,
        "objectId": object_id,
        "objectLabel": label,
        "outcomeId": outcome_id,
        "outcomeLabel": outcome_label,
        "countsAsHit": True,
        "valueAuthority": "publisher_outcome_non_numeric",
    }


def build_treatment() -> dict:
    regions = []
    rules = {}
    outcome_objects: dict[str, list[str]] = {
        "home_run": [], "triple": [], "double": [], "single": [],
        "base_on_balls": [], "strike": [], "foul_ball": [], "out": [], "safe_base_center": [],
    }

    for region_id, label, outcome_id, outcome_label, cx, cy, rx, ry in BALLS:
        regions.append(ellipse(region_id, cx, cy, rx, ry, 800))
        rules[region_id] = rule(label, region_id, outcome_id, outcome_label)
        outcome_objects[outcome_id].append(region_id)

    for base_id, base_label, cx, cy in BASES:
        safe_id = f"{base_id}_base_safe_center"
        out_id = f"{base_id}_base_out_ring"
        regions.append(ellipse(safe_id, cx, cy, 35, 37, 950))
        regions.append(ellipse(out_id, cx, cy, 82, 84, 700))
        rules[safe_id] = rule(f"{base_label} — Safe Center", safe_id, "safe_base_center", "Safe Base Center")
        rules[out_id] = rule(f"{base_label} — Out Ring", out_id, "out", "Out")
        outcome_objects["safe_base_center"].append(safe_id)
        outcome_objects["out"].append(out_id)

    pitcher_id = "pitcher_out"
    regions.append(polygon(pitcher_id, [
        (492, 1003), (521, 981), (552, 965), (592, 979), (624, 1015),
        (629, 1050), (610, 1070), (624, 1121), (594, 1143), (568, 1090),
        (541, 1080), (526, 1050), (500, 1042),
    ], 850))
    rules[pitcher_id] = rule("Pitcher — Out", pitcher_id, "out", "Out")
    outcome_objects["out"].append(pitcher_id)

    field_regions = (
        ("infield_out", "Infield — Out", "out", "Out", [(570, 744), (940, 1007), (570, 1300), (200, 1007)], 350),
        ("foul_ball_left", "Foul Ball — Left", "foul_ball", "Foul Ball", [(0, 807), (208, 1004), (494, 1285), (344, 1400), (0, 1330)], 300),
        ("foul_ball_right", "Foul Ball — Right", "foul_ball", "Foul Ball", [(1140, 807), (932, 1004), (646, 1285), (796, 1400), (1140, 1330)], 300),
        ("outfield_strike", "Outfield — Strike", "strike", "Strike", [(0, 330), (1140, 330), (1140, 1370), (0, 1370)], 100),
    )
    for region_id, label, outcome_id, outcome_label, points, priority in field_regions:
        regions.append(polygon(region_id, points, priority))
        rules[region_id] = rule(label, region_id, outcome_id, outcome_label)
        outcome_objects[outcome_id].append(region_id)

    object_ids = [item[0] for item in BALLS]
    object_ids.extend([f"{base_id}_base_safe_center" for base_id, _, _, _ in BASES])
    object_ids.extend([f"{base_id}_base_out_ring" for base_id, _, _, _ in BASES])
    object_ids.extend([pitcher_id, "infield_out", "foul_ball_left", "foul_ball_right", "outfield_strike"])
    assert set(object_ids) == {item for values in outcome_objects.values() for item in values}

    summary_groups = [
        {"groupId": outcome_id, "label": label, "objectIds": outcome_objects[outcome_id]}
        for outcome_id, label in (
            ("home_run", "Home Run"), ("triple", "Triple"), ("double", "Double"),
            ("single", "Single"), ("base_on_balls", "Base on Balls"),
            ("safe_base_center", "Safe Base Center"), ("strike", "Strike"),
            ("foul_ball", "Foul Ball"), ("out", "Out"),
        )
    ]
    capabilities = {
        "evidence": {"status": "available"},
        "measurement": {"status": "available"},
        "correction": {"status": "not_applicable"},
        "officialScore": {"status": "not_applicable"},
        "publisherMission": {"status": "available"},
    }
    x_authority = resolve_ordered_x_scoring([], x_role="not_present")
    return {
        "schemaVersion": "sczn3-canonical-face-treatment-v1",
        "faceSha256": FACE_SHA,
        "status": "founder_15_bounded_implementation",
        "publisherAuthority": {
            "canonicalFacePath": "docs/authority-evidence/platform/the-905-blocker-factory-2026-09-29/representations/BLOCKER_FACE_a0abfc653ad4acce3d45.jpg",
            "canonicalFaceSha256": FACE_SHA,
            "productUrl": "https://bakertargets.com/product/batter-up-target/",
            "printedRules": [
                "Hit in outfield is a STRIKE.",
                "Hit in infield or red circle is OUT; the center of each red circle is safe and counts as the base result shown.",
                "Hit any part of a marked baseball and take the play marked.",
                "Hit the pitcher and score an OUT.",
            ],
        },
        "automaticInheritance": {
            "package": "FOUNDER_15_AUTOMATIC_INHERITANCE_PACKAGE.json",
            "inheritedMachinery": [
                "canonical-face normalized geometry", "declarative region classification",
                "object and outcome distribution", "complete observation accounting",
                "shared HISTORY progressive disclosure", "SEC/Vault exact reopen",
            ],
            "x10FounderRule": x_authority,
            "x10RuleApplied": False,
            "reason": "Batter Up has no X scoring grammar.",
        },
        "visibleStructure": {
            "markedBaseballs": len(BALLS),
            "safeBaseCenters": 3,
            "redOutRings": 3,
            "fieldOutcomeAreas": 4,
            "pitcherOutArea": 1,
            "numericPointScore": "not_defined",
        },
        "geometry": {
            "coordinateSystem": "normalized_source_image_top_left",
            "layoutModel": "discrete_objects",
            "regions": regions,
            "ugoAuthority": f"SCZN3_PUBLISHER_BATTER_UP_FACE_{FACE_SHA[:20].upper()}_V1",
        },
        "scoring": {
            "status": "complete",
            "model": "named_regions",
            "regionRules": rules,
            "outsideRule": {"label": "Outside Governed Baseball Areas", "countsAsHit": False},
            "classificationFootprintMode": "tap_center",
            "schemaVersion": "sczn3-target-scoring-data-v1",
            "aggregation": {"mode": "classification_counts"},
            "summaryDimensions": [{"dimensionId": "baseball_outcome", "label": "Baseball Outcome Distribution", "groups": summary_groups}],
            "publisherRuleAuthority": {
                "source": f"printed rules on publisher canonical face {FACE_SHA}",
                "rule": "Each observation resolves to the printed baseball play or governed field outcome. No numeric point score, shot quota, innings, runs, batting order, winner determination, or complete baseball simulation is authorized.",
            },
        },
        "mission": {
            "missionFamily": "targetScoring",
            "resultPackageType": "targetScoreResult",
            "resultPackageVersion": "1",
            "maxObservations": 500,
            "interaction": {"aim": {"mode": "not_required", "points": []}, "observationInput": "normalized_taps", "resultAction": "show_result"},
            "capabilityStates": capabilities,
            "smartTargetTreatment": {
                "grammar": ["publisher_labeled_baseball_outcomes", "nested_safe_center_and_out_ring", "open_observation_count"],
                "shooterFacingVocabulary": {"singular": "outcome area", "plural": "outcome areas"},
                "objectCompletionVerbPast": "engaged",
                "objectCompletionLabel": "Outcome Areas Engaged",
                "outsideLabel": "Outside Governed Baseball Areas",
                "hitAreaLabel": "printed baseball outcomes and governed field areas",
                "intelligence": ["tap_accuracy", "per_outcome_area_engagement", "baseball_outcome_distribution", "outside_observation_count", "complete_observation_accounting", "region_detail"],
                "authorityScope": "publisher_visible_outcome_classification",
                "publisherScoreStatus": "not_defined",
                "fixedObservationCountStatus": "not_defined",
                "inningsStatus": "not_defined",
                "baserunnerAdvancementStatus": "not_defined",
                "runsStatus": "not_defined",
                "battingOrderStatus": "not_defined",
                "winnerRuleStatus": "not_defined",
            },
        },
        "sessionCapabilityStates": capabilities,
        "unsupportedUses": [
            "numeric_point_scoring", "invented_fixed_shot_count", "invented_innings_or_turn_sequence",
            "invented_baserunner_advancement_or_run_total", "invented_batting_order_or_winner_rule",
            "invented_complete_baseball_game_procedure", "physical_hole_extent_or_line_touch_adjudication",
        ],
    }


def main() -> None:
    treatment = build_treatment()
    path = CONTRACTS / FILE
    package = json.loads(path.read_text(encoding="utf-8"))
    if package["targetProfile"]["id"] != TARGET_ID:
        raise SystemExit("batter_up_target_identity_mismatch")
    if package["components"]["registration"]["definition"].get("assetSha256") != FACE_SHA:
        raise SystemExit("batter_up_face_sha_mismatch")
    package["components"]["geometry"]["definition"] = deepcopy(treatment["geometry"])
    package["components"]["scoring"]["definition"] = deepcopy(treatment["scoring"])
    package["components"]["mission"]["definition"] = deepcopy(treatment["mission"])
    package["session"]["capabilityStates"] = deepcopy(treatment["sessionCapabilityStates"])
    package["session"]["officialMissionRequired"] = False
    package["unsupportedUses"] = deepcopy(treatment["unsupportedUses"])
    for name in ("geometry", "scoring", "mission"):
        package["components"][name]["digest"] = component_digest(package["components"][name])
    path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    TREATMENT_PATH.write_text(json.dumps(treatment, indent=2) + "\n", encoding="utf-8")
    print(f"UPDATED {path.name} {TARGET_ID}")
    print(f"WROTE {TREATMENT_PATH.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
