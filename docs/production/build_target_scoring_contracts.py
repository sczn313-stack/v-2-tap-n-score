#!/usr/bin/env python3
"""Compile publisher scoring data into target-execution contracts.

This is preservation tooling.  Runtime behavior remains in the single
``declarative-target-score`` executor; this file contains data only.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
OUT = BACKEND / "target_execution_contracts" / "contracts"


def digest(value):
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def component(identifier, definition):
    value = {"id": identifier, "version": "1", "status": "approved", "definition": definition}
    value["digest"] = digest({"id": identifier, "version": "1", "status": "approved", "definition": definition})
    return value


def circle(region_id, cx, cy, radius, priority):
    return {"regionId": region_id, "shape": "circle", "cx": cx, "cy": cy, "radius": radius, "priority": priority}


def ellipse(region_id, cx, cy, rx, ry, priority):
    return {"regionId": region_id, "shape": "ellipse", "cx": cx, "cy": cy, "radiusX": rx, "radiusY": ry, "priority": priority}


def rectangle(region_id, x0, y0, x1, y1, priority):
    return {"regionId": region_id, "shape": "rectangle", "xMin": x0, "yMin": y0, "xMax": x1, "yMax": y1, "priority": priority}


def polygon(region_id, points, priority):
    return {"regionId": region_id, "shape": "polygon", "points": points, "priority": priority}


def rule(label, value=None, object_id=None):
    result = {"label": label}
    if value is not None:
        result["value"] = value
    if object_id is not None:
        result["objectId"] = object_id
    return result


def asset(path):
    absolute = ROOT / path
    return hashlib.sha256(absolute.read_bytes()).hexdigest()


def contract(spec):
    target = spec["target"]
    profile_id = target["id"]
    scoring = dict(spec["scoring"])
    scoring["publisherRuleAuthority"] = spec["ruleAuthority"]
    capability_states = {
        "evidence": {"status": "available"},
        "measurement": {"status": "available" if spec["regions"] else "not_applicable"},
        "correction": {"status": "not_applicable"},
        "officialScore": {"status": "not_applicable"},
        "publisherMission": {"status": "available" if scoring["model"] == "ordered_objects" else "not_applicable"},
    }
    components = {
        "geometry": component(f"{profile_id}-target-scoring-geometry", {"coordinateSystem": "normalized_source_image_top_left", "regions": spec["regions"], "ugoAuthority": spec["ugoAuthority"]}),
        "registration": component(f"{profile_id}-target-scoring-registration", {"role": "scorable_canonical_asset", "assetPath": spec["imagePath"], "assetSha256": asset(spec["imagePath"]), "assetAlt": f"{target['product']['name']}, SKU {target['product']['sku']}", "coordinateConvention": "normalized_source_image_top_left"}),
        "scoring": component(f"{profile_id}-target-scoring-data", scoring),
        "mission": component(f"{profile_id}-target-scoring-mission", {"missionFamily": "targetScoring", "resultPackageType": "targetScoreResult", "resultPackageVersion": "1", "maxObservations": 500, "allowShooterDeclaredAim": True, "capabilityStates": capability_states}),
    }
    return {
        "schemaVersion": "sczn3-target-execution-contract-v1",
        "contractId": f"tec-{profile_id}-target-scoring-v1", "contractVersion": "1", "authorityContractVersion": "ADR-001-v1",
        "lifecycleStatus": "supported", "supportStatus": "supported",
        "approval": {"status": "approved", "authorityId": spec["approvalAuthority"], "approvedAt": "2026-09-08T12:00:00-04:00"},
        "effective": {"from": "2026-09-08T12:00:00-04:00", "until": None},
        "targetProfile": target, "components": components,
        "missionFamily": "targetScoring", "resultPackageType": "targetScoreResult", "resultPackageVersion": "1",
        "executor": {"id": "declarative-target-score", "version": "1"},
        "secAdapter": {"id": "target-scoring-family", "version": "1", "scoringPresentationFamily": "target-data"},
        "preservationValidator": {"id": "target-scoring-preservation", "version": "1"},
        "session": {"capabilityStates": capability_states, "officialMissionRequired": False},
        "unsupportedUses": ["zeroing_correction", "qualification_or_certification", "scoring_rules_not_present_in_publisher_authority", "physical_hole_extent_or_line_touch_adjudication"],
    }


def gunfun_target(sku, name, authority_id, dimensions):
    atp_ids = {
        "12070": "ATP_GUNFUN_12070_BIG_CIRCLE_EVIDENCE_V1",
        "13120": "ATP_GUNFUN_13120_SMALL_CRITICAL_SHOTS_EVIDENCE_V1",
        "22040": "ATP_GUNFUN_22040_IDPA_WHITE_EVIDENCE_V1",
        "22200": "ATP_GUNFUN_22200_B27E_BLACK_EVIDENCE_V1",
        "22470": "ATP_GUNFUN_22470_USPSA_IPSC_EVIDENCE_V1",
        "22740": "ATP_GUNFUN_22740_VITAL_DUDE_EVIDENCE_V1",
    }
    return {"id": f"gunfun_{sku}_{name.lower().replace('/', '_').replace(' ', '_').replace('-', '_')}", "version": "1", "atpId": atp_ids[sku], "authorityId": authority_id, "publisher": {"id": "gunfun", "name": "GunFun Shooting Targets, Inc.", "url": "https://gunfun.com/"}, "product": {"id": f"gunfun-product-{sku}", "name": name, "sku": sku, "dimensions": dimensions}}


GUNFUN_AUTH = "GUNFUN_EP56_FULL_CATALOG_PRINTER_AUTHORITY"
GF_PATH = "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations"

specs = []

# GunFun 13120: the printer defines target areas, but no numeric point schedule.
specs.append({"target": gunfun_target("13120", "Small Critical Shots", "GUNFUN_E56_FULL_CATALOG_AUTHORITY_AUDIT_V1:E56-FC-031", {"width": 19, "height": 25, "unit": "inch"}), "imagePath": f"{GF_PATH}/13120.jpg", "ugoAuthority": "publisher-representation-region-data-v1", "approvalAuthority": GUNFUN_AUTH, "ruleAuthority": {"source": "GunFun product 13120", "rule": "paper shooting target featuring a 2 color silhouette with target areas"}, "regions": [polygon("head_target", [[.44,.13],[.62,.13],[.62,.17],[.55,.17],[.55,.23],[.49,.23],[.49,.17],[.44,.17]], 30), rectangle("torso_red", .48,.42,.66,.53,30), rectangle("torso_target", .30,.37,.69,.72,20)], "scoring": {"status": "complete", "model": "named_regions", "regionRules": {"head_target": rule("Head target area"), "torso_red": rule("Red torso target area"), "torso_target": rule("Torso target area")}, "outsideRule": rule("Outside printed target areas")}})

# GunFun 22200: values are printed on the publisher representation.
specs.append({"target": gunfun_target("22200", "B27E Black", "GUNFUN_E56_FULL_CATALOG_AUTHORITY_AUDIT_V1:E56-FC-103", {"width": 23, "height": 35, "unit": "inch"}), "imagePath": f"{GF_PATH}/22200.jpg", "ugoAuthority": "publisher-printed-ring-data-v1", "approvalAuthority": GUNFUN_AUTH, "ruleAuthority": {"source": "GunFun product 22200 publisher representation", "rule": "printed X/10/9/8/7 regions"}, "regions": [ellipse("x",.50,.66,.045,.055,50),ellipse("10",.50,.66,.09,.10,40),ellipse("9",.50,.66,.18,.20,30),ellipse("8",.50,.66,.27,.28,20),ellipse("7",.50,.66,.36,.36,10)], "scoring": {"status": "complete", "model": "numeric_regions", "regionRules": {"x":rule("X",10),"10":rule("10",10),"9":rule("9",9),"8":rule("8",8),"7":rule("7",7)}, "outsideRule": rule("Miss",0)}})

# GunFun 22470: the printer representation authorizes labels, not numeric values.
specs.append({"target": gunfun_target("22470", "USPSA/IPSC", "GUNFUN_EP56_COHORT_PUBLISHER_AUTHORITY_AUDIT_V1:E56-T10", {"width":23,"height":35,"unit":"inch"}), "imagePath": f"{GF_PATH}/22470.jpg", "ugoAuthority": "UGO_GUNFUN_22470_USPSA_IPSC_CANDIDATE_V1:publisher-labels", "approvalAuthority": GUNFUN_AUTH, "ruleAuthority": {"source":"GunFun product 22470 publisher representation","rule":"printed A/B/C/D region names; no numeric value inferred"}, "regions": [rectangle("a_head",.40,.09,.61,.17,50),rectangle("b_head",.36,.05,.65,.28,20),polygon("a_body",[[.29,.30],[.71,.30],[.71,.65],[.65,.78],[.35,.78],[.29,.65]],50),polygon("c_body",[[.18,.28],[.82,.28],[.91,.38],[.91,.78],[.76,.97],[.24,.97],[.09,.78],[.09,.38]],20),polygon("d_body",[[.08,.28],[.92,.28],[.92,.80],[.77,.97],[.23,.97],[.08,.80]],10)], "scoring": {"status":"complete","model":"named_regions","regionRules":{"a_head":rule("A"),"b_head":rule("B"),"a_body":rule("A"),"c_body":rule("C"),"d_body":rule("D")},"outsideRule":rule("Miss")}})
specs[-1]["target"]["authorityId"] = "GUNFUN_E56_FULL_CATALOG_AUTHORITY_AUDIT_V1:E56-FC-115"

# GunFun 22040: values are visibly printed as 0/-1/-3; IDPA authority supplies outside -5.
specs.append({"target": gunfun_target("22040", "IDPA White", "GUNFUN_E56_FULL_CATALOG_AUTHORITY_AUDIT_V1:E56-FC-093", {"width":23,"height":35,"unit":"inch"}), "imagePath": f"{GF_PATH}/22040.jpg", "ugoAuthority": "publisher-printed-idpa-region-data-v1", "approvalAuthority": GUNFUN_AUTH, "ruleAuthority": {"source":"GunFun product 22040 representation + governed IDPA miss rule","rule":"printed 0/-1/-3 regions; outside -5"}, "regions": [ellipse("zero_head",.50,.17,.09,.07,50),ellipse("zero_torso",.50,.45,.18,.14,50),rectangle("one_head",.37,.06,.64,.29,30),polygon("one_torso",[[.37,.29],[.63,.29],[.76,.39],[.76,.64],[.63,.79],[.37,.79],[.24,.64],[.24,.39]],30),polygon("three",[[.20,.28],[.80,.28],[.90,.37],[.90,.80],[.77,.96],[.23,.96],[.10,.80],[.10,.37]],10)], "scoring": {"status":"complete","model":"penalty_regions","regionRules":{"zero_head":rule("-0",0),"zero_torso":rule("-0",0),"one_head":rule("-1",-1),"one_torso":rule("-1",-1),"three":rule("-3",-3)},"outsideRule":rule("Miss",-5)}})

# GunFun 12070: concentric values 1 through 8 are printed by the publisher.
ring_regions=[]
ring_rules={}
for priority, value, rx, ry in [(80,1,.08,.065),(70,2,.14,.11),(60,3,.20,.16),(50,4,.26,.21),(40,5,.32,.26),(30,6,.37,.30),(20,7,.42,.34),(10,8,.47,.37)]:
    ring_regions.append(ellipse(str(value),.50,.53,rx,ry,priority)); ring_rules[str(value)] = rule(str(value),value)
specs.append({"target": gunfun_target("12070", "Big Circle", "GUNFUN_E56_FULL_CATALOG_AUTHORITY_AUDIT_V1:E56-FC-015", {"width":19,"height":25,"unit":"inch"}), "imagePath": f"{GF_PATH}/12070.jpg", "ugoAuthority": "publisher-printed-concentric-ring-data-v1", "approvalAuthority": GUNFUN_AUTH, "ruleAuthority": {"source":"GunFun product 12070 publisher representation","rule":"printed concentric numeric regions 1 through 8"}, "regions": ring_regions, "scoring":{"status":"complete","model":"numeric_regions","regionRules":ring_rules,"outsideRule":rule("Miss",0)}})

# Vital Dude: the printer defines artwork but no score; not_applicable is the governed answer.
specs.append({"target": gunfun_target("22740", "Vital Dude", "GUNFUN_EP56_COHORT_PUBLISHER_AUTHORITY_AUDIT_V1:E56-T08", {"width":23,"height":35,"unit":"inch"}), "imagePath": f"{GF_PATH}/22740.jpg", "ugoAuthority":"ATP_GUNFUN_22740_VITAL_DUDE_EVIDENCE_V1", "approvalAuthority":GUNFUN_AUTH, "ruleAuthority":{"source":"GunFun product 22740","rule":"publisher defines anatomical artwork and no score"}, "regions":[], "scoring":{"status":"not_applicable","model":"not_applicable","regionRules":{},"reason":"printer_defines_no_score"}})

# Baker SL-ST2: exact governed target-plane regions and governed points-down values.
sl_w, sl_h = 1074, 1393
norm = lambda pts: [[round(x/sl_w,6),round(y/sl_h,6)] for x,y in pts]
sl_regions=[circle("down_zero_head",531/sl_w,255/sl_h,80/sl_w,50),ellipse("down_zero_torso",531/sl_w,644/sl_h,159/sl_w,159/sl_h,50),polygon("down_one_head",norm([[411,137],[652,137],[652,365],[411,365]]),30),polygon("down_one_torso",norm([[411,365],[294,484],[294,879],[411,1078],[651,1078],[769,879],[769,484],[652,365]]),30),polygon("down_three",norm([[263,366],[801,366],[876,480],[876,1120],[778,1328],[286,1328],[187,1120],[187,480]]),10)]
specs.append({"target":{"id":"idpa_silhouette_sl_st2","version":"1","atpId":"ATP_BAKER_SL_ST2_TIMED_PAIR_7YD_V1","authorityId":"BAKER_SL_ST2_23X35_PRODUCT_AUTHORITY_V1","publisher":{"id":"baker-targets","name":"Baker Targets","url":"https://bakertargets.com"},"product":{"id":"BAKER_SL_ST2","name":"Silhouette Target (IDPA)","sku":"SL-ST2","dimensions":{"width":23,"height":35,"unit":"inch"}}}, "imagePath":"authority-evidence/baker-sl-st2/BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.jpeg", "ugoAuthority":"UGO_BAKER_SL_ST2_23X35_TARGET_PLANE_V1", "approvalAuthority":"FOUNDER-APPROVED-SCZN3-SL-ST2-AUTHORITY", "ruleAuthority":{"source":"SCZN3_SL_ST2_TIMED_PAIR_7YD_V1 + IDPA_RULEBOOK_2026_2","rule":"0/-1/-3 points-down regions; outside -5"}, "regions":sl_regions, "scoring":{"status":"complete","model":"penalty_regions","regionRules":{"down_zero_head":rule("-0",0),"down_zero_torso":rule("-0",0),"down_one_head":rule("-1",-1),"down_one_torso":rule("-1",-1),"down_three":rule("-3",-3)},"outsideRule":rule("Miss",-5)}})

# Baker BE-R9B: nine printer-identified bulls, without invented point values.
be_regions=[]; be_rules={}
for row,y in enumerate((.25,.50,.75),start=1):
    for col,x in enumerate((.22,.50,.78),start=1):
        ident=f"bull_{row}_{col}"; be_regions.append(circle(ident,x,y,.105,10)); be_rules[ident]=rule(f"Bull {row}-{col}",object_id=ident)
specs.append({"target":{"id":"baker_be_r9b","version":"1","atpId":"ATP_BAKER_BE_R9B_TARGET_SCORING_V1","authorityId":"BAKER_BE_R9B_PRINTER_AUTHORITY","publisher":{"id":"baker-targets","name":"Baker Targets","url":"https://bakertargets.com"},"product":{"id":"BAKER_BE_R9B","name":"Rifle Nine Bulls Eyes Target","sku":"BE-R9B"}}, "imagePath":"authority-evidence/catalog-targets/BAKER_BE_R9B_PUBLISHER_IMAGE_V1.webp", "ugoAuthority":"baker-publisher-nine-bull-representation-v1", "approvalAuthority":"BAKER-PRINTER-AUTHORITY", "ruleAuthority":{"source":"Baker product BE-R9B","rule":"nine identified bullseyes; no numeric score inferred"}, "regions":be_regions, "scoring":{"status":"complete","model":"multiple_bulls","regionRules":be_rules,"outsideRule":rule("Outside bulls")}})

# Baker GF-BB-C: the publisher defines the numbered object sequence and no numeric score.
balls=[(1,560,1220),(2,360,485),(3,660,1030),(4,660,665),(5,760,485),(6,360,845),(7,165,485),(8,560,845),(9,860,665),(10,560,485),(11,460,1030),(12,960,485),(13,265,665),(14,760,845),(15,460,665)]
bb_regions=[]; bb_rules={}
for number,x,y in balls:
    ident=str(number); bb_regions.append(ellipse(ident,x/1141,y/1500,92/1141,92/1500,10)); bb_rules[ident]=rule(f"Ball {number}",object_id=number)
specs.append({"target":{"id":"baker_gf_bb_c","version":"1","atpId":"ATP_BAKER_GF_BB_C_V1","authorityId":"BAKER_GF_BB_C_PRODUCT_AUTHORITY_V1","publisher":{"id":"baker-targets","name":"Baker Targets","url":"https://bakertargets.com"},"product":{"id":"BAKER_GF_BB_C","name":"Billiard Ball Color Target","sku":"GF-BB-C"}}, "imagePath":"authority-evidence/catalog-targets/BAKER_GF_BB_C_PUBLISHER_IMAGE_V1.jpg", "ugoAuthority":"UGO_BAKER_GF_BB_C_V1", "approvalAuthority":"BAKER_GF_BB_C_PRODUCT_AUTHORITY_V1", "ruleAuthority":{"source":"BAKER_GF_BB_C_PUBLISHED_GAME_V1","rule":"Shoot in order; change shooters if you miss"}, "regions":bb_regions, "scoring":{"status":"complete","model":"ordered_objects","regionRules":bb_rules,"outsideRule":rule("Miss"),"sequence":list(range(1,16))}})


old = [
    "gunfun_13120_small_critical_shots_smart_evidence_v1.json",
    "gunfun_22200_b27e_black_smart_evidence_v1.json",
    "gunfun_22470_uspsa_ipsc_smart_evidence_v1.json",
    "gunfun_22040_idpa_white_smart_evidence_v1.json",
    "gunfun_12070_big_circle_smart_evidence_v1.json",
]
for filename in old:
    path = OUT / filename
    if path.exists():
        path.unlink()

for spec in specs:
    package = contract(spec)
    path = OUT / f"{package['targetProfile']['id']}_target_scoring_v1.json"
    path.write_text(json.dumps(package, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

print(f"WROTE={len(specs)}")
