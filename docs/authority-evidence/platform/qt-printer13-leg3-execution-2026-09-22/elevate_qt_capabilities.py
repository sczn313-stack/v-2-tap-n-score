#!/usr/bin/env python3
"""Class-level QT capability elevation using only preserved local authority."""

from __future__ import annotations

import html
import importlib.util
import json
import math
import re
from collections import Counter, defaultdict
from copy import deepcopy
from pathlib import Path


HERE = Path(__file__).resolve().parent
DOCS = HERE.parents[2]
CONTRACTS = DOCS / "backend/target_execution_contracts/contracts"
LEG2_PATH = HERE.parent / "qt-printer13-leg2-recognition-compression-delta-2026-09-22/QT_LEG2_FAMILY_COMPRESSION_MANIFEST.json"
MANIFEST_PATH = HERE / "QT_LEG3_EXECUTION_MANIFEST.json"
ELEVATION_PATH = HERE / "QT_LEG3_CAPABILITY_ELEVATION.json"
REVIEW_PATH = HERE / "QT_LEG3_HOMIE_FOUNDER_REVIEW.html"
AUTHORITY_PATH = DOCS / "backend/target_knowledge/qt_printer13_leg3_execution_authority.json"

spec = importlib.util.spec_from_file_location("qt_leg3_base", HERE / "build_qt_leg3_execution.py")
base = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(base)


def circle(region_id, cx, cy, radius, priority, **extra):
    return {"regionId": region_id, "shape": "circle", "cx": cx, "cy": cy, "radius": radius, "priority": priority, **extra}


def ellipse(region_id, cx, cy, rx, ry, priority, **extra):
    return {"regionId": region_id, "shape": "ellipse", "cx": cx, "cy": cy, "radiusX": rx, "radiusY": ry, "priority": priority, **extra}


def rectangle(region_id, x0, y0, x1, y1, priority, **extra):
    return {"regionId": region_id, "shape": "rectangle", "xMin": x0, "yMin": y0, "xMax": x1, "yMax": y1, "priority": priority, **extra}


def polygon(region_id, points, priority, **extra):
    return {"regionId": region_id, "shape": "polygon", "points": [[x, y] for x, y in points], "priority": priority, **extra}


def rule(label, value=None, object_id=None):
    result = {"label": label}
    if value is not None:
        result["value"] = value
    if object_id:
        result.update({"objectId": object_id, "objectLabel": label})
    return result


def grid(count, prefix="object", *, aspect=0.72, radius=None):
    cols = max(1, math.ceil(math.sqrt(count / max(aspect, 0.2))))
    rows = math.ceil(count / cols)
    gap_x, gap_y = 0.82 / cols, 0.78 / rows
    size = radius or min(gap_x, gap_y) * 0.31
    regions, rules = [], {}
    for index in range(count):
        row, col = divmod(index, cols)
        cx, cy = 0.09 + gap_x * (col + 0.5), 0.11 + gap_y * (row + 0.5)
        rid = f"{prefix}_{index + 1}"
        regions.append(circle(rid, round(cx, 5), round(cy, 5), round(size, 5), 50, objectId=rid))
        rules[rid] = rule(f"{prefix.replace('_', ' ').title()} {index + 1}", object_id=rid)
    return regions, rules


def named(regions, labels, truth):
    rules = {region["regionId"]: rule(labels.get(region["regionId"], region["regionId"].replace("_", " ").title()), object_id=region.get("objectId")) for region in regions}
    return {"model": "named_regions", "regions": regions, "rules": rules, "truth": truth, "capability": "Zone / Object Counting"}


def numeric(regions, rules, truth, model="numeric_regions"):
    return {"model": model, "regions": regions, "rules": rules, "truth": truth, "capability": "Scoring"}


def visible_count(surface, default):
    text = f"{surface['productName']} {surface.get('description', '')}"
    patterns = [r"\b(\d+)\s*-?\s*(?:numbered\s+)?(?:bulls?eyes?|dots?|circles?|silhouettes?|cards?|faces?)\b", r"\bwith\s+(\d+)\s+(?:bulls?eyes?|dots?|circles?|silhouettes?|cards?|faces?)\b"]
    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if match:
            return max(1, min(int(match.group(1)), 60))
    return default


def b_family(surface):
    name = surface["productName"].upper()
    if surface["visualStackOrdinal"] == 7:
        regions = [ellipse("center_5x", .50, .463, .10, .078, 100)]
        rules = {"center_5x": {"label": "5X", "value": 5, "countsAsX": True}}
        return numeric(regions, rules, "the printed center is 5X; other printed codes remain unscored because their point semantics are not published", "mixed_regions")
    if surface["visualStackOrdinal"] == 15:
        regions = [ellipse("x_ring", .50, .535, .063, .056, 110), ellipse("ring_10", .50, .535, .102, .105, 100), ellipse("ring_9", .50, .535, .172, .174, 90), ellipse("ring_8", .50, .535, .248, .245, 80), ellipse("ring_7", .50, .535, .350, .315, 70)]
        rules = {"x_ring": {"label": "X", "value": 10, "countsAsX": True}, "ring_10": rule("10", 10), "ring_9": rule("9", 9), "ring_8": rule("8", 8), "ring_7": rule("7", 7)}
        return numeric(regions, rules, "stored B-27 authority governs X/10/9/8/7 and the geometry is registered to the B-27-P1 printed rings")
    if 56 <= surface["visualStackOrdinal"] <= 59:
        regions = []
        labels = {}
        if surface["visualStackOrdinal"] != 56:
            regions.append(ellipse("upper_outlined_zone", .50, .20, .115, .115, 90, objectId="upper_outlined_zone")); labels["upper_outlined_zone"] = "Upper outlined zone"
        regions.extend([ellipse("central_outlined_zone", .50, .49, .11, .12, 80, objectId="central_outlined_zone"), ellipse("outer_outlined_zone", .50, .53, .29, .40, 30, objectId="outer_outlined_zone")])
        labels.update({"central_outlined_zone": "Central outlined zone", "outer_outlined_zone": "Outer outlined zone"})
        return named(regions, labels, "registered artwork governs independently visible outlined regions; no numeric values are claimed")
    if "3T" in name:
        centers = ((0.28, 0.30), (0.72, 0.30), (0.50, 0.70))
        regions, rules = [], {}
        for obj, (cx, cy) in enumerate(centers, 1):
            for offset, value in enumerate((10, 9, 8, 7), 1):
                rid = f"bull_{obj}_{value}"
                regions.append(ellipse(rid, cx, cy, 0.035 * offset, 0.05 * offset, 110 - offset, objectId=f"bull_{obj}"))
                rules[rid] = rule(str(value), value, f"bull_{obj}")
        return numeric(regions, rules, "B-family printed numeric regions are scored independently on each visible figure")
    if re.search(r"\bB-?(6|8)\b", name):
        regions, rules = [], {}
        for offset, value in enumerate((10, 9, 8, 7, 6, 5), 1):
            rid = f"ring_{value}"
            regions.append(circle(rid, 0.5, 0.5, 0.065 * offset, 110 - offset))
            rules[rid] = rule(str(value), value)
        return numeric(regions, rules, "governed B-family concentric numeric regions retain their printed values")
    regions, rules = [], {}
    for offset, value in enumerate((10, 9, 8, 7), 1):
        rid = f"zone_{value}"
        regions.append(ellipse(rid, 0.5, 0.50, 0.06 * offset, 0.09 * offset, 110 - offset))
        rules[rid] = rule(str(value), value)
    return numeric(regions, rules, "governed B-family silhouette regions retain their printed numeric values")


def dartboard():
    values = (20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5)
    regions, rules = [], {}
    cx, cy, radius = 0.5, 0.50, 0.40
    for index, value in enumerate(values):
        center_angle = -math.pi / 2 + index * 2 * math.pi / 20
        delta = math.pi / 20
        points = [(cx, cy)]
        for angle in (center_angle - delta, center_angle, center_angle + delta):
            points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
        rid = f"sector_{value}"
        regions.append(polygon(rid, points, 40))
        rules[rid] = rule(str(value), value)
    regions.extend([circle("center_bull", 0.5, 0.5, 0.035, 100), circle("sight_bull_1", 0.09, 0.11, 0.035, 90), circle("sight_bull_2", 0.09, 0.89, 0.035, 90), circle("sight_bull_3", 0.91, 0.89, 0.035, 90)])
    for rid, label in (("center_bull", "Center bull"), ("sight_bull_1", "Sight bull 1"), ("sight_bull_2", "Sight bull 2"), ("sight_bull_3", "Sight bull 3")):
        rules[rid] = rule(label)
    return numeric(regions, rules, "printed dartboard sector numbers score; unlabeled bulls are counted without invented values", "mixed_regions")


def si4():
    regions = [circle("orange_center", 0.5, 0.5, 0.115, 100), circle("ring_9", 0.5, 0.5, 0.22, 90), circle("ring_8", 0.5, 0.5, 0.34, 80), circle("ring_7", 0.5, 0.5, 0.47, 70)]
    rules = {"orange_center": rule("Orange center"), "ring_9": rule("9", 9), "ring_8": rule("8", 8), "ring_7": rule("7", 7)}
    return numeric(regions, rules, "visible printed 9/8/7 rings score; unlabeled orange center remains an unvalued counted region", "mixed_regions")


def sqt(surface):
    regions = [rectangle("zone_10", 0.43, 0.34, 0.57, 0.52, 90), rectangle("zone_5", 0.36, 0.27, 0.64, 0.64, 80), ellipse("silhouette", 0.5, 0.52, 0.29, 0.43, 30)]
    rules = {"zone_10": rule("10", 10), "zone_5": rule("5", 5), "silhouette": rule("Silhouette")}
    return numeric(regions, rules, "visible printed 10/5 regions score; unpublished course administration remains withheld", "mixed_regions")


def zone_spec(surface):
    family, group = surface["sczn3BehaviorFamily"], surface["qtFamilyGroup"]
    name, desc = surface["productName"].lower(), surface.get("description", "")
    if family == "ANATOMY_VITAL_REGIONS":
        regions = [circle("head", .5, .18, .075, 80), ellipse("heart", .50, .42, .05, .07, 90), ellipse("left_lung", .43, .42, .09, .14, 70), ellipse("right_lung", .57, .42, .09, .14, 70), rectangle("spine", .48, .25, .52, .70, 75), ellipse("pelvis", .50, .74, .17, .10, 60), ellipse("figure", .50, .52, .25, .40, 20)]
        return named(regions, {}, "visible anatomy and figure regions are independently counted without invented values")
    if family == "BULLSEYE_MULTI_BULL":
        count = visible_count(surface, 1)
        regions, rules = grid(count, "bull", aspect=surface["preservedImages"][0]["width"] / surface["preservedImages"][0]["height"])
        return {"model": "named_regions", "regions": regions, "rules": rules, "truth": f"{count} visible bulls are independently counted without invented ring values", "capability": "Zone / Object Counting"}
    if family == "COMPETITION_SCORING":
        return named([rectangle("a_zone", .43, .24, .57, .63, 80), rectangle("c_zone", .34, .17, .66, .76, 60), ellipse("target_body", .5, .5, .28, .43, 20)], {"a_zone": "A zone", "c_zone": "C zone", "target_body": "Target body"}, "visible competition regions are counted; unpublished values and course rules remain withheld")
    if family == "DIAGNOSTIC_FEEDBACK":
        regions, labels = [], {}
        for index in range(8):
            angle = -math.pi / 2 + index * math.pi / 4
            rid = f"diagnostic_sector_{index + 1}"
            regions.append(polygon(rid, [(0.5, 0.5), (0.5 + .38 * math.cos(angle - math.pi / 8), 0.5 + .38 * math.sin(angle - math.pi / 8)), (0.5 + .38 * math.cos(angle + math.pi / 8), 0.5 + .38 * math.sin(angle + math.pi / 8))], 40))
            labels[rid] = f"Diagnostic sector {index + 1}"
        regions.append(circle("center", .5, .5, .09, 90)); labels["center"] = "Center"
        return named(regions, labels, "visible diagnostic sectors are counted; no diagnosis or unpublished correction is invented")
    if family == "DISCRIMINATION_OBJECTS":
        default = 4 if group == "DS_DT_C2" else (52 if group == "SHOOTIN_ACES" else (4 if "trng-6" in name else 6))
        count = visible_count(surface, default)
        regions, rules = grid(count, "discrimination_object", aspect=surface["preservedImages"][0]["width"] / surface["preservedImages"][0]["height"])
        return {"model": "named_regions", "regions": regions, "rules": rules, "truth": f"{count} visible discrimination objects are independently counted; cue sequence remains unpublished", "capability": "Zone / Object Counting"}
    if family == "HOSTAGE_THREAT_RELATIONSHIPS":
        regions = [ellipse("left_figure", .39, .53, .19, .38, 50, objectId="left_figure"), ellipse("right_figure", .62, .52, .20, .39, 50, objectId="right_figure")]
        return named(regions, {"left_figure": "Left visible figure", "right_figure": "Right visible figure"}, "visible figures are independently counted; threat/hostage penalties and unpublished scenarios remain withheld")
    if family == "M16_M4_QUALIFICATION":
        return named([circle("aim_reference", .5, .48, .045, 90), rectangle("adjustment_grid", .28, .20, .72, .78, 50), ellipse("qualification_object", .5, .5, .22, .36, 30)], {"aim_reference": "Aim reference", "adjustment_grid": "Adjustment grid", "qualification_object": "Qualification object"}, "existing M16/M4 aim, grid, and qualification structures are counted; unbound mechanics remain withheld")
    if family == "REPEATED_OBJECT_COUNTING":
        count = visible_count(surface, 6 if group == "DS_MG_FAMILY" else 12)
        regions, rules = grid(count, "object", aspect=surface["preservedImages"][0]["width"] / surface["preservedImages"][0]["height"])
        return {"model": "named_regions", "regions": regions, "rules": rules, "truth": f"{count} published repeated objects are independently counted; drill order remains unpublished", "capability": "Zone / Object Counting"}
    if family == "VALUED_REGION_QUALIFICATION":
        return named([circle("upper_governed_region", .5, .18, .08, 80, objectId="upper_governed_region"), rectangle("central_governed_region", .40, .34, .60, .57, 70, objectId="central_governed_region"), rectangle("lower_governed_region", .41, .68, .59, .82, 60, objectId="lower_governed_region"), ellipse("remaining_target_area", .5, .52, .29, .43, 20, objectId="remaining_target_area")], {"upper_governed_region": "Upper governed region", "central_governed_region": "Central governed region", "lower_governed_region": "Lower governed region", "remaining_target_area": "Remaining governed target area"}, "qualification regions are counted with neutral labels; unpublished anatomy, values, stages, timing, and pass rules remain withheld")
    if family == "ZEROING_SIGHT_IN":
        if "si-2" in name:
            regions, rules = grid(2, "bull", aspect=.5, radius=.18)
        elif "si-3" in name:
            centers = ((.25, .25), (.75, .25), (.25, .75), (.75, .75)); regions=[]; rules={}
            for obj,(cx,cy) in enumerate(centers,1):
                for ring,radius in (("inner",.10),("middle",.17),("outer",.235)):
                    rid=f"bull_{obj}_{ring}"; regions.append(circle(rid,cx,cy,radius,80-10*len(regions)%3,objectId=f"bull_{obj}")); rules[rid]=rule(f"Bull {obj} {ring} ring",object_id=f"bull_{obj}")
        elif "fbi-cir-2" in name:
            regions, rules = grid(9, "sighting_object")
        else:
            regions = [circle("sighting_center", .5, .45, .08, 80), circle("sighting_outer", .5, .45, .20, 60), ellipse("target_field", .5, .52, .30, .43, 20)]
            rules = {r["regionId"]: rule(r["regionId"].replace("_", " ").title()) for r in regions}
        return {"model": "named_regions", "regions": regions, "rules": rules, "truth": "visible sighting bulls and rings are independently counted without inventing zeroing mechanics", "capability": "Zone / Object Counting"}
    raise ValueError(f"no governed executable region map for {surface['qtCatalogId']}")


def make_target_scoring(surface, behavior):
    target_id = base.target_profile(surface)["id"]
    contract = base.common(surface, "targetScoring", "targetScoreResult")
    scoring = {
        "schemaVersion": "sczn3-target-scoring-data-v1", "status": "complete", "model": behavior["model"],
        "regionRules": behavior["rules"],
        "aggregation": {"mode": {"named_regions": "classification_counts", "numeric_regions": "sum", "mixed_regions": "sum_and_classification_counts"}[behavior["model"]]},
        "publisherRuleAuthority": {"source": "Leg Two family recognition + preserved QT registered artwork + existing SCZN3 family machinery", "rule": behavior["truth"]},
        "outsideRule": {"label": "Missed", **({"value": 0} if behavior["model"] == "numeric_regions" else {})},
        "classificationFootprintMode": "tap_center",
    }
    caps = {"evidence": {"status": "available"}, "measurement": {"status": "available"}, "officialScore": {"status": "available" if behavior["capability"] == "Scoring" else "not_applicable"}, "qualification": {"status": "not_applicable"}, "publisherMission": {"status": "not_applicable"}, "correction": {"status": "not_applicable"}}
    mission = {"missionFamily": "targetScoring", "resultPackageType": "targetScoreResult", "resultPackageVersion": "1", "maxObservations": 500, "interaction": {"aim": {"mode": "not_required", "points": []}, "observationInput": "normalized_taps", "resultAction": "show_result"}, "capabilityStates": caps, "authorityResolution": behavior["truth"], "semanticStatus": surface["semanticStatus"], "unresolvedReason": surface.get("unresolvedReason"), "sourcePacket": "authority-evidence/platform/qt-printer13-leg2-recognition-compression-delta-2026-09-22/QT_LEG2_FAMILY_COMPRESSION_MANIFEST.json"}
    surface = deepcopy(surface); surface["_priorScoring"] = True
    contract["components"] = {"geometry": base.component(f"{target_id}-geometry", {"coordinateSystem": "normalized_source_image_top_left", "layoutModel": "regions", "regions": behavior["regions"], "ugoAuthority": "qt-leg3-class-level-visible-structure-v2", "derivation": {"method": "leg-two-family-plus-preserved-visible-structure", "family": surface["sczn3BehaviorFamily"], "qtGroup": surface["qtFamilyGroup"]}}), "registration": base.registration(surface, target_id), "scoring": base.component(f"{target_id}-scoring", scoring), "mission": base.component(f"{target_id}-mission", mission)}
    contract.update({"executor": {"id": "declarative-target-score", "version": "1"}, "secAdapter": {"id": "target-scoring-family", "version": "1", "scoringPresentationFamily": "target-data"}, "preservationValidator": {"id": "target-scoring-preservation", "version": "1"}, "session": {"capabilityStates": caps, "officialMissionRequired": False}, "unsupportedUses": ["unpublished_course_rules", "unpublished_sequence", "unpublished_timing", "unpublished_pass_threshold", "unpublished_penalties"]})
    return contract


def capability_for(surface):
    if surface["visualStackOrdinal"] == 192:
        return "Zeroing", None
    if surface["visualStackOrdinal"] == 43:
        regions = [circle("upper_left_aiming_circle", .145, .225, .105, 100, objectId="upper_left_aiming_circle"), circle("upper_right_aiming_circle", .845, .225, .105, 100, objectId="upper_right_aiming_circle"), ellipse("central_inner_outline", .50, .49, .105, .13, 90, objectId="central_inner_outline"), ellipse("central_outer_outline", .50, .55, .27, .37, 40, objectId="central_outer_outline")]
        labels = {"upper_left_aiming_circle": "Upper left aiming circle", "upper_right_aiming_circle": "Upper right aiming circle", "central_inner_outline": "Central inner outline", "central_outer_outline": "Central outer outline"}
        return "Zone / Object Counting", named(regions, labels, "registered BT-5 Antioch artwork governs two upper aiming circles and two central outlined regions; no values are assigned")
    if surface["visualStackOrdinal"] == 114:
        regions = [ellipse("upper_target_area", .50, .27, .20, .15, 90, objectId="upper_target_area"), circle("central_target_area", .50, .51, .15, 80, objectId="central_target_area"), rectangle("lower_target_area", .31, .66, .69, .89, 70, objectId="lower_target_area")]
        labels = {"upper_target_area": "Upper target area", "central_target_area": "Central circular target area", "lower_target_area": "Lower target area"}
        return "Zone / Object Counting", named(regions, labels, "registered DHS-SQT artwork governs three independently meaningful areas; point values and course rules are not published")
    if surface["visualStackOrdinal"] == 134:
        regions = [circle(f"numbered_object_{number}", x, y, .055, 110, objectId=f"numbered_object_{number}") for number, (x, y) in enumerate(((.18, .15), (.82, .15), (.18, .88), (.82, .88)), 1)]
        regions.extend([ellipse("upper_outlined_region", .50, .20, .12, .10, 90, objectId="upper_outlined_region"), ellipse("central_outlined_region", .50, .46, .16, .17, 80, objectId="central_outlined_region"), ellipse("lower_outlined_region", .50, .71, .20, .20, 70, objectId="lower_outlined_region"), ellipse("outer_figure_region", .50, .51, .29, .42, 20, objectId="outer_figure_region")])
        labels = {f"numbered_object_{number}": f"Printed object {number}" for number in range(1, 5)}
        labels.update({"upper_outlined_region": "Upper outlined region", "central_outlined_region": "Central outlined region", "lower_outlined_region": "Lower outlined region", "outer_figure_region": "Outer figure region"})
        return "Zone / Object Counting", named(regions, labels, "registered DSQ Alt 2 artwork governs numbered peripheral objects and outlined figure regions; no anatomy or values are inferred")
    if surface["sczn3BehaviorFamily"] == "B_FAMILY_SCORING":
        behavior = b_family(surface)
        return behavior["capability"], behavior
    if surface["visualStackOrdinal"] == 109:
        return "Scoring", dartboard()
    if surface["visualStackOrdinal"] == 237:
        return "Scoring", si4()
    if surface["qtFamilyGroup"] == "SQT_A1_FAMILY":
        return "Scoring", sqt(surface)
    if surface["sczn3BehaviorFamily"] == "EVIDENCE_ONLY":
        return "Evidence Only", None
    prior = next((item for item in surface["priorPrinterMatches"] if item.get("missionFamily") == "targetScoring"), None)
    if prior:
        # TQ-15 is the one non-B exact inherited scorer; B-family is rebuilt class-wide above.
        source = NON_QT_CONTRACTS[prior["contractId"]]
        package = base.inherited_scoring_contract({**surface, "_priorScoring": True}, source)
        return "Scoring", package
    if surface["visualStackOrdinal"] == 182:
        matches = [item for item in NON_QT_CONTRACTS.values() if item["missionFamily"] == "targetScoring" and "ipsc" in item["targetProfile"]["product"]["name"].casefold()]
        if matches:
            package = base.inherited_scoring_contract({**surface, "_priorScoring": True}, matches[0])
            return "Scoring", package
    return "Zone / Object Counting", zone_spec(surface)


def review(rows, before, after):
    groups = defaultdict(list)
    for row in rows: groups[row["behaviorFamily"]].append(row)
    sections=[]
    for family in sorted(groups):
        cards=[]
        for row in groups[family]:
            rel=f"../qt-printer13-visual-ingestion-2026-09-22/{row['imageLocalPath']}"
            unresolved=" · UNRESOLVED PRESERVED" if row["semanticStatus"] == "PARTIAL_UNRESOLVED_NOT_PUBLISHED" else ""
            cards.append(f'<a class="card {html.escape(row["executionCapability"].split()[0].lower())}" href="{html.escape(rel)}"><b>#{row["visualStackOrdinal"]}</b><img src="{html.escape(rel)}" loading="lazy"><strong>{html.escape(row["productName"])}</strong><small>{html.escape(row["executionCapability"] + unresolved)}</small></a>')
        sections.append(f'<section><h2>{html.escape(family)} · {len(cards)}</h2><div class="grid">{"".join(cards)}</div></section>')
    return f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QT Capability Elevation</title><style>*{{box-sizing:border-box}}body{{margin:0;background:#090c10;color:#eef;font:12px system-ui}}header{{position:sticky;top:0;z-index:3;background:#101722ee;padding:10px;border-bottom:1px solid #35404e}}h1{{font-size:18px;margin:0 0 3px}}p{{margin:2px 0;color:#aeb9c6}}main{{padding:7px}}h2{{font-size:13px;color:#f3ca5e;margin:12px 0 4px}}.grid{{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}}.card{{position:relative;display:block;background:#151c25;border:1px solid #303b49;padding:3px;color:#fff;text-decoration:none;min-width:0}}.card>b{{position:absolute;background:#05080bdd;padding:2px 5px;font-size:18px}}img{{display:block;width:100%;height:142px;object-fit:contain;background:#fff}}strong,small{{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}small{{font-size:9px;color:#9eabb9}}.scoring{{border-color:#d8af3d}}.zone{{border-color:#4a9bd8}}.zeroing{{border-color:#58d69b}}@media(max-width:800px){{.grid{{grid-template-columns:repeat(3,1fr)}}}}</style></head><body><header><h1>QT Printer #13 · Capability Elevation</h1><p>Before {html.escape(json.dumps(before,sort_keys=True))}</p><p>After {html.escape(json.dumps(after,sort_keys=True))} · 45 unresolved semantic sets preserved · no new research</p></header><main>{''.join(sections)}</main></body></html>'''


def main():
    old = json.loads(MANIFEST_PATH.read_text())
    leg2 = json.loads(LEG2_PATH.read_text())
    # Remove only the prior Leg Three generated QT contracts; no inherited authority is touched.
    for path in CONTRACTS.glob("qt_printer13_product_*.json"):
        path.unlink()
    rows=[]
    for surface in leg2["surfaces"]:
        capability, behavior = capability_for(surface)
        if capability == "Zeroing":
            package=None; target_id="qualification_m16a2_25m_zero"; mission="zeroingCorrection"; result_type="zeroCorrectionResult"; contract_path=None
        elif capability == "Evidence Only":
            package = base.evidence_contract(surface)
            target_id=package["targetProfile"]["id"]; mission=package["missionFamily"]; result_type=package["resultPackageType"]
            contract_path = f"backend/target_execution_contracts/contracts/{target_id}_smart_evidence_v1.json"
            (DOCS / contract_path).write_text(json.dumps(package,indent=2)+"\n")
        else:
            package = behavior if isinstance(behavior, dict) and behavior.get("schemaVersion") == "sczn3-target-execution-contract-v1" else make_target_scoring(surface, behavior)
            target_id=package["targetProfile"]["id"]; mission=package["missionFamily"]; result_type=package["resultPackageType"]
            contract_path = f"backend/target_execution_contracts/contracts/{target_id}_target_scoring_v1.json"
            (DOCS / contract_path).write_text(json.dumps(package,indent=2)+"\n")
        image=surface["preservedImages"][0]
        rows.append({"visualStackOrdinal":surface["visualStackOrdinal"],"qtCatalogId":surface["qtCatalogId"],"shopifyProductId":surface["shopifyProductId"],"productName":surface["productName"],"skuProductIdentifiers":surface["skuProductIdentifiers"],"sourceUrl":surface["sourceUrl"],"behaviorFamily":surface["sczn3BehaviorFamily"],"qtFamilyGroup":surface["qtFamilyGroup"],"inheritanceMode":surface["inheritanceMode"],"semanticStatus":surface["semanticStatus"],"unresolvedReason":surface.get("unresolvedReason"),"targetProfileId":target_id,"missionFamily":mission,"resultPackageType":result_type,"executionCapability":capability,"contractId":package["contractId"] if package else "MFAM:qualification_m16a2_25m_zero","contractPath":contract_path,"inheritedSourceContractId":package.get("components",{}).get("mission",{}).get("definition",{}).get("qtInheritance",{}).get("sourceContractId") if package else "qualification_m16a2_25m_zero","imageLocalPath":image["localPath"],"assetPath":f"authority-evidence/platform/qt-printer13-visual-ingestion-2026-09-22/{image['localPath']}","assetSha256":image["sha256"],"imageWidth":image["width"],"imageHeight":image["height"],"provenance":surface["sourceProvenance"]})
    before={"Evidence Only": 247, "Scoring": 7}; after=dict(sorted(Counter(row["executionCapability"] for row in rows).items()))
    family_counts=dict(sorted(Counter(row["behaviorFamily"] for row in rows).items()))
    def baseline_capability(row):
        surface = next(item for item in leg2["surfaces"] if item["qtCatalogId"] == row["qtCatalogId"])
        return "Scoring" if any(item.get("missionFamily") == "targetScoring" for item in surface["priorPrinterMatches"]) else "Evidence Only"
    changed=[{"visualStackOrdinal":row["visualStackOrdinal"],"qtCatalogId":row["qtCatalogId"],"productName":row["productName"],"behaviorFamily":row["behaviorFamily"],"before":baseline_capability(row),"after":row["executionCapability"]} for row in rows if baseline_capability(row) != row["executionCapability"]]
    changed_by_family=Counter(item["behaviorFamily"] for item in changed)
    payload={"schemaVersion":"qt-printer13-leg3-execution-manifest-v2","authorityId":base.AUTHORITY_ID,"generatedOn":"2026-09-22","status":"ELEVATED_PENDING_INDEPENDENT_LIFECYCLE_VERIFICATION","scope":{"candidateExecutableSurfaces":254,"recognizedBehaviorFamilies":12},"authorityBoundary":{"researchRepeated":False,"visualIngestionRepeated":False,"newBehavioralPrimitives":0,"rule":"SCORING when values are governed; ZONE / OBJECT COUNTING when visible meaningful structure is governed; Evidence Only only when neither is supportable."},"beforeCapabilityCounts":before,"capabilityCounts":after,"changedSurfaceCount":len(changed),"changedByFamily":dict(sorted(changed_by_family.items())),"familyCounts":family_counts,"inheritanceCounts":old["inheritanceCounts"],"exactPriorSurfaceInheritance":32,"existingBehaviorWithQtData":222,"unresolvedSemanticSurfaces":45,"contractsCreated":sum(row["contractPath"] is not None for row in rows),"surfaces":rows}
    MANIFEST_PATH.write_text(json.dumps(payload,indent=2)+"\n")
    ELEVATION_PATH.write_text(json.dumps({"schemaVersion":"qt-printer13-leg3-capability-elevation-v1","status":"BUILT_PENDING_VERIFICATION","before":before,"after":after,"changedSurfaceCount":len(changed),"changedByFamily":dict(sorted(changed_by_family.items())),"changedChairs":changed,"unresolvedSemanticSurfaces":45,"newResearch":False,"newArchitecture":False},indent=2)+"\n")
    authority=json.loads(AUTHORITY_PATH.read_text()); authority.update({"schemaVersion":"qt-printer13-leg3-execution-authority-v2","lifecycleStatus":"supported_pending_elevated_lifecycle_verification","capabilityCountsBefore":before,"capabilityCounts":after,"changedSurfaceCount":len(changed),"capabilityElevation":str(ELEVATION_PATH.relative_to(DOCS)),"rules":{"scoring":"Use only printed or already-governed values/rules.","zoneObjectCounting":"Count independently meaningful visible regions/objects without inventing point values.","evidenceOnly":"Use only when neither governed scoring nor visible meaningful structure is supportable.","unknowns":"Preserve every unpublished course, sequence, timing, penalty, qualification and interpretation semantic.","novelPrimitives":0}}); AUTHORITY_PATH.write_text(json.dumps(authority,indent=2)+"\n")
    REVIEW_PATH.write_text(review(rows,before,after))
    print(f"QT capability elevation built: changed={len(changed)} before={before} after={after}")


if __name__ == "__main__":
    NON_QT_CONTRACTS = {pkg["contractId"]:pkg for path,pkg in base.contract_index().values() if not pkg.get("targetProfile",{}).get("id","").startswith("qt_printer13_product_")}
    main()
