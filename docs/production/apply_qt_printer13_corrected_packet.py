#!/usr/bin/env python3
"""Apply the 2026-09-27 QT Printer #13 corrected implementation packet."""
from __future__ import annotations

import hashlib
import json
import re
import sys
import zipfile
from collections import Counter
from copy import deepcopy
from pathlib import Path
from xml.etree import ElementTree as ET


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))
from target_execution_contract import component_digest, validate_contract  # noqa: E402

EVIDENCE_DIR = DOCS / "authority-evidence/platform/qt-printer13-corrected-implementation-2026-09-27"
PACKET = EVIDENCE_DIR / "SCZN3_QT_Printer13_Corrected_Implementation_Packet_2026-09-27.docx"
PACKET_SHA256 = "e78cae75bd1c65e8bf5fb1d541296e65085be61db066eaafa29a6eaed2e91935"
AUTHORITY = BACKEND / "target_knowledge/qt_episode64_smart_target_authority.json"
LEG3 = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_LEG3_EXECUTION_MANIFEST.json"
MANIFEST = DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22/QT_EP64_254_IMPLEMENTATION_MANIFEST.json"
COMPLETION = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_FINAL_SMART_TARGET_COMPLETION_MANIFEST.json"
SELECTOR = DOCS / "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23/QT_FOUNDER_254_EXECUTABLE_SELECTOR.html"
LEDGER = EVIDENCE_DIR / "QT_PRINTER13_CORRECTED_PACKET_LEDGER.json"
RECONCILIATION = EVIDENCE_DIR / "QT_PRINTER13_CORRECTED_IMPLEMENTATION_RECONCILIATION.json"
LOCK_ID = "QT_PRINTER13_CORRECTED_IMPLEMENTATION_PACKET_2026_09_27"

CAPABILITY_MAP = {
    "EVIDENCE ONLY": "Evidence Only",
    "COUNTING": "Zone / Object Counting",
    "SCORING -> USM": "Scoring",
    "ZEROING": "Zeroing",
}
EXPECTED_FINAL_COUNTS = {"Scoring": 40, "Zone / Object Counting": 162, "Evidence Only": 51, "Zeroing": 1}
FORBIDDEN_RESULT_LANGUAGE = re.compile(
    r"strongest|weakest|evenness|center[- ]of[- ]shot[- ]pattern|shot[- ]pattern center|"
    r"the center of your shot pattern|directional[- ]center|normalized rms|rms radius|"
    r"target[- ]image[- ]coordinate|dispersion/distribution",
    re.IGNORECASE,
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def norm(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def poly(region_id: str, points: list[tuple[float, float]], priority: int, *, object_id: str | None = None) -> dict:
    row = {"regionId": region_id, "shape": "polygon", "points": [list(point) for point in points], "priority": priority}
    if object_id:
        row["objectId"] = object_id
    return row


def ellipse(region_id: str, cx: float, cy: float, rx: float, ry: float, priority: int, *, object_id: str | None = None) -> dict:
    row = {"regionId": region_id, "shape": "ellipse", "cx": cx, "cy": cy, "radiusX": rx, "radiusY": ry, "priority": priority}
    if object_id:
        row["objectId"] = object_id
    return row


def rect(region_id: str, x0: float, y0: float, x1: float, y1: float, priority: int, *, object_id: str | None = None) -> dict:
    row = {"regionId": region_id, "shape": "rectangle", "xMin": x0, "yMin": y0, "xMax": x1, "yMax": y1, "priority": priority}
    if object_id:
        row["objectId"] = object_id
    return row


def object_rule(label: str, object_id: str) -> dict:
    return {"label": label, "objectId": object_id, "objectLabel": label}


def definition(product: str, capability: str, family: str, model: str, regions: list[dict], rules: dict, rule: str) -> dict:
    return {"product": product, "capability": capability, "family": family, "model": model, "regions": regions, "rules": rules, "rule": rule}


def object_definition(product: str, family: str, regions: list[dict], labels: dict[str, str], rule: str) -> dict:
    return definition(product, "Zone / Object Counting", family, "named_regions", regions, {rid: object_rule(label, rid) for rid, label in labels.items()}, rule)


def score_definition(product: str, family: str, rings: list[tuple[str, str, int, float, float]], rule: str) -> dict:
    regions = [ellipse(rid, .5, .5, rx, ry, 100 - index, object_id="bull_1") for index, (rid, _label, _value, rx, ry) in enumerate(rings)]
    rules = {rid: {"label": label, "value": value, "objectId": "bull_1", "objectLabel": product} for rid, label, value, _rx, _ry in rings}
    return definition(product, "Scoring", family, "numeric_regions", regions, rules, rule)


GEOMETRY_LOCKS: dict[int, dict] = {
    143: object_definition(
        "FAC-USAF-BAT", "REPEATED_OBJECT_COUNTING",
        [
            ellipse("upper_circle", .50, .165, .125, .072, 100, object_id="upper_circle"),
            ellipse("center_circle", .50, .455, .208, .119, 99, object_id="center_circle"),
            ellipse("lower_left_circle", .252, .881, .124, .072, 98, object_id="lower_left_circle"),
            ellipse("lower_right_circle", .748, .879, .124, .072, 97, object_id="lower_right_circle"),
        ],
        {"upper_circle": "Upper circle", "center_circle": "Center circle", "lower_left_circle": "Lower-left circle", "lower_right_circle": "Lower-right circle"},
        "Four visibly printed circles; count each circle, total taps, and misses/outside. No values or invented meaning.",
    ),
    148: object_definition(
        "FBI-CIR", "BULLSEYE_MULTI_BULL",
        [
            ellipse("circle_1", .282, .318, .132, .087, 100, object_id="circle_1"),
            ellipse("circle_2", .690, .318, .132, .087, 99, object_id="circle_2"),
            ellipse("circle_3", .488, .505, .176, .115, 98, object_id="circle_3"),
            ellipse("circle_4", .282, .692, .132, .087, 97, object_id="circle_4"),
            ellipse("circle_5", .698, .692, .132, .087, 96, object_id="circle_5"),
        ],
        {f"circle_{index}": f"Circle {index}" for index in range(1, 6)},
        "Five-circle structure; count each circle and misses/outside without point scoring.",
    ),
    150: score_definition("FBI-IP1", "BULLSEYE_MULTI_BULL", [
        ("score_10", "10", 10, .101, .100), ("score_9", "9", 9, .183, .181),
        ("score_8", "8", 8, .276, .274), ("score_7", "7", 7, .382, .378),
    ], "Printed 7/8/9/10 scoring rings; score only those governed printed values."),
    151: score_definition("FBI-IP1-OR", "BULLSEYE_MULTI_BULL", [
        ("score_10", "10", 10, .104, .104), ("score_9", "9", 9, .184, .184),
        ("score_8", "8", 8, .278, .278), ("score_7", "7", 7, .378, .378),
    ], "Printed 7/8/9/10 scoring rings; score only those governed printed values."),
    154: object_definition(
        "FBI-Q-R PLUS", "DISCRIMINATION_OBJECTS",
        [
            ellipse("shape_1", .156, .259, .078, .060, 100, object_id="shape_1"),
            rect("shape_2", .670, .210, .812, .321, 99, object_id="shape_2"),
            poly("shape_3", [( .760, .720), (.686, .861), (.834, .861)], 98, object_id="shape_3"),
            poly("shape_4", [(.148, .715), (.077, .805), (.148, .891), (.222, .805)], 97, object_id="shape_4"),
        ],
        {f"shape_{index}": f"Numbered shape {index}" for index in range(1, 5)},
        "Four numbered shapes; count each object without assigning the printed identifiers as point values.",
    ),
    163: object_definition(
        "GA-PT-R", "VALUED_REGION_QUALIFICATION",
        [rect("head_region", .408, .145, .624, .245, 100, object_id="head_region"), rect("torso_region", .337, .400, .625, .676, 90, object_id="torso_region")],
        {"head_region": "Head region", "torso_region": "Torso region"},
        "Count the two visibly outlined target regions; no point values or qualification outcome is inferred.",
    ),
    164: object_definition(
        "HCSO-Q1", "VALUED_REGION_QUALIFICATION",
        [
            poly("inner_region", [(.34,.03),(.66,.03),(.69,.15),(.63,.25),(.70,.36),(.75,.49),(.71,.61),(.63,.69),(.50,.72),(.37,.69),(.29,.61),(.25,.49),(.30,.36),(.37,.25),(.31,.15)], 100, object_id="inner_region"),
            poly("outer_region", [(.34,.03),(.66,.03),(.69,.23),(.93,.36),(.98,.56),(.88,.70),(.72,.77),(.63,.96),(.37,.96),(.28,.77),(.12,.70),(.02,.56),(.07,.36),(.31,.23)], 80, object_id="outer_region"),
        ],
        {"inner_region": "Inner target zone", "outer_region": "Outer target zone"},
        "Visible separate target zones support neutral counting; printed numerals are not used as point values.",
    ),
    165: score_definition("HM-1 HITMARKER Bullseye", "BULLSEYE_MULTI_BULL", [
        ("score_9", "9", 9, .130, .130), ("score_8", "8", 8, .225, .225),
        ("score_7", "7", 7, .310, .310), ("score_6", "6", 6, .395, .395),
        ("score_5", "5", 5, .480, .480),
    ], "Printed 5/6/7/8/9 scoring rings; score only those governed printed values."),
    168: object_definition(
        "HSI-SAT/QT", "VALUED_REGION_QUALIFICATION",
        [
            ellipse("head_inner", .480, .242, .062, .055, 110, object_id="head_inner"),
            ellipse("head_outer", .480, .242, .115, .105, 100, object_id="head_outer"),
            rect("body_inner", .365, .350, .635, .630, 90, object_id="body_inner"),
            poly("body_middle", [(.29,.31),(.69,.31),(.73,.39),(.73,.70),(.66,.78),(.34,.78),(.27,.70),(.27,.39)], 80, object_id="body_middle"),
            poly("body_outer", [(.21,.29),(.78,.29),(.82,.38),(.82,.79),(.73,.86),(.27,.86),(.18,.79),(.18,.38)], 70, object_id="body_outer"),
        ],
        {"head_inner":"Head inner region","head_outer":"Head outer region","body_inner":"Body inner region","body_middle":"Body middle region","body_outer":"Body outer region"},
        "Visible qualification regions support neutral counting; no scoring values, quotas, or course rules are implemented.",
    ),
    177: object_definition(
        "ICE-QT", "VALUED_REGION_QUALIFICATION",
        [
            ellipse("head_region", .477, .225, .110, .080, 110, object_id="head_region"),
            rect("torso_inner", .340, .385, .650, .670, 100, object_id="torso_inner"),
            poly("torso_middle", [(.27,.33),(.70,.33),(.74,.42),(.74,.75),(.66,.82),(.34,.82),(.25,.75),(.25,.42)], 90, object_id="torso_middle"),
            poly("torso_outer", [(.19,.30),(.79,.30),(.83,.40),(.83,.84),(.74,.90),(.26,.90),(.16,.84),(.16,.40)], 80, object_id="torso_outer"),
        ],
        {"head_region":"Head qualification region","torso_inner":"Inner torso region","torso_middle":"Middle torso region","torso_outer":"Outer torso region"},
        "Visible distinct qualification regions are counted neutrally; no printed values, quotas, or course rules are inferred.",
    ),
    178: object_definition(
        "ICE-QT-R", "VALUED_REGION_QUALIFICATION",
        [
            ellipse("head_region", .474, .255, .105, .072, 110, object_id="head_region"),
            rect("torso_inner", .342, .408, .645, .630, 100, object_id="torso_inner"),
            poly("torso_middle", [(.29,.37),(.69,.37),(.72,.43),(.72,.68),(.65,.74),(.35,.74),(.27,.68),(.27,.43)], 90, object_id="torso_middle"),
            poly("torso_outer", [(.22,.34),(.75,.34),(.79,.41),(.79,.75),(.70,.80),(.30,.80),(.19,.75),(.19,.41)], 80, object_id="torso_outer"),
        ],
        {"head_region":"Head qualification region","torso_inner":"Inner torso region","torso_middle":"Middle torso region","torso_outer":"Outer torso region"},
        "The reduced face retains visible qualification-region structure; count regions neutrally without values or course rules.",
    ),
    179: object_definition(
        "IL-PT", "BULLSEYE_MULTI_BULL",
        [
            ellipse("innermost_region", .500, .665, .085, .065, 110, object_id="innermost_region"),
            ellipse("inner_region", .500, .665, .155, .125, 100, object_id="inner_region"),
            ellipse("middle_region", .500, .665, .285, .235, 90, object_id="middle_region"),
            ellipse("outer_region", .500, .665, .425, .345, 80, object_id="outer_region"),
        ],
        {"innermost_region":"Innermost printed region","inner_region":"Inner printed region","middle_region":"Middle printed region","outer_region":"Outer printed region"},
        "Count the visible nested printed regions; do not apply point values from this treatment.",
    ),
    183: object_definition(
        "KCF-1", "VALUED_REGION_QUALIFICATION",
        [
            poly("inner_region", [(.39,.08),(.61,.08),(.66,.22),(.66,.34),(.70,.42),(.70,.62),(.64,.68),(.36,.68),(.30,.62),(.30,.42),(.34,.34),(.34,.22)], 100, object_id="inner_region"),
            poly("middle_region", [(.31,.06),(.69,.06),(.72,.30),(.76,.38),(.76,.77),(.67,.83),(.33,.83),(.24,.77),(.24,.38),(.28,.30)], 90, object_id="middle_region"),
            poly("remaining_target", [(.32,.05),(.68,.05),(.72,.28),(.88,.36),(.92,.94),(.08,.94),(.12,.36),(.28,.28)], 70, object_id="remaining_target"),
        ],
        {"inner_region":"Inner target region","middle_region":"Middle target region","remaining_target":"Remaining target region"},
        "Visible target regions are counted neutrally; no unpublished scoring values or qualification rules are applied.",
    ),
    184: object_definition(
        "KS-Q", "VALUED_REGION_QUALIFICATION",
        [
            ellipse("inner_region", .500, .455, .205, .160, 100, object_id="inner_region"),
            poly("middle_region", [(.30,.31),(.70,.31),(.76,.38),(.77,.82),(.70,.88),(.30,.88),(.23,.82),(.24,.38)], 90, object_id="middle_region"),
            poly("remaining_target", [(.34,.03),(.66,.03),(.70,.25),(.96,.36),(.97,.97),(.03,.97),(.04,.36),(.30,.25)], 70, object_id="remaining_target"),
        ],
        {"inner_region":"Inner silhouette region","middle_region":"Middle silhouette region","remaining_target":"Remaining silhouette region"},
        "Visible silhouette regions are counted neutrally; no values are implemented.",
    ),
    188: object_definition(
        "LKPD-Q", "DISCRIMINATION_OBJECTS",
        [
            rect("square_1", .098, .043, .145, .075, 120, object_id="square_1"), rect("square_2", .220, .043, .267, .075, 119, object_id="square_2"),
            rect("square_3", .098, .119, .145, .151, 118, object_id="square_3"), rect("square_4", .220, .119, .267, .151, 117, object_id="square_4"),
            ellipse("circle_1", .780, .064, .047, .032, 116, object_id="circle_1"), ellipse("circle_2", .912, .059, .025, .020, 115, object_id="circle_2"),
            ellipse("circle_3", .912, .128, .034, .027, 114, object_id="circle_3"), ellipse("circle_4", .780, .151, .036, .027, 113, object_id="circle_4"),
            ellipse("circle_5", .912, .211, .048, .035, 112, object_id="circle_5"), ellipse("circle_6", .780, .218, .025, .019, 111, object_id="circle_6"),
            ellipse("large_circle", .180, .238, .112, .078, 110, object_id="large_circle"),
            rect("torso_inner", .405, .386, .660, .602, 100, object_id="torso_inner"),
            rect("torso_middle", .323, .386, .744, .748, 90, object_id="torso_middle"),
            poly("torso_outer", [(.35,.32),(.65,.32),(.73,.42),(.76,.79),(.69,.89),(.31,.89),(.24,.79),(.27,.42)], 80, object_id="torso_outer"),
        ],
        {**{f"square_{i}":f"Square {i}" for i in range(1,5)}, **{f"circle_{i}":f"Circle {i}" for i in range(1,7)}, "large_circle":"Large circle", "torso_inner":"Inner torso area", "torso_middle":"Middle torso area", "torso_outer":"Outer torso area"},
        "Count the visible separate target areas; no drill order, values, timing, or quota is implemented.",
    ),
    283: object_definition(
        "TSR-IV Blue", "VALUED_REGION_QUALIFICATION",
        [
            ellipse("head_region", .500, .180, .175, .145, 110, object_id="head_region"),
            ellipse("center_mass_region", .500, .515, .225, .235, 100, object_id="center_mass_region"),
            poly("lower_torso_region", [(.18,.33),(.82,.33),(.93,.48),(.93,.82),(.82,.88),(.18,.88),(.07,.82),(.07,.48)], 90, object_id="lower_torso_region"),
            rect("pelvic_region", .190, .875, .810, .985, 80, object_id="pelvic_region"),
        ],
        {"head_region":"Upper qualification region","center_mass_region":"Center-mass qualification region","lower_torso_region":"Lower-torso qualification region","pelvic_region":"Pelvic qualification region"},
        "Count neck-line, pelvic, and established qualification regions; no point values are implemented.",
    ),
    288: object_definition(
        "USMC-THREAT", "ANATOMY_VITAL_REGIONS",
        [
            ellipse("head_circle", .50, .125, .125, .073, 110, object_id="head_circle"),
            ellipse("head_outline", .50, .145, .170, .120, 100, object_id="head_outline"),
            ellipse("center_chest", .50, .438, .205, .160, 90, object_id="center_chest"),
            ellipse("center_mass", .50, .500, .285, .250, 80, object_id="center_mass"),
            poly("pelvic_zone", [(.23,.69),(.77,.69),(.81,.75),(.66,.92),(.35,.92),(.20,.75)], 70, object_id="pelvic_zone"),
        ],
        {"head_circle":"5-inch Circle Head Zone","head_outline":"Outline of Head Zone","center_chest":"10-inch Center Chest Zone","center_mass":"19.5-inch Center Mass Zone","pelvic_zone":"Full Polygonal Pelvic Zone"},
        "Count the five publisher-established hidden zones; no point values, threat/hostage penalties, or scenario rules are implemented.",
    ),
}


EVIDENCE_DOWNGRADES = {
    175: "No executable scoring/counting semantics are established by the corrected packet; preserve evidence and exact taps only.",
    285: "No executable regions or values are established by the corrected packet; preserve evidence and exact taps only.",
}


def docx_rows() -> list[dict]:
    if sha256(PACKET) != PACKET_SHA256:
        raise AssertionError("corrected implementation packet SHA-256 mismatch")
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with zipfile.ZipFile(PACKET) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    records = []
    for tr in root.findall(".//w:tbl/w:tr", ns):
        cells = []
        for tc in tr.findall("w:tc", ns):
            text = " ".join(part.strip() for part in (node.text or "" for node in tc.findall(".//w:t", ns)) if part.strip())
            cells.append(text)
        if len(cells) < 5 or not re.fullmatch(r"\d+/254", cells[0]):
            continue
        records.append({
            "homieChair": int(cells[0].split("/", 1)[0]),
            "qtChair": int(re.search(r"\d+", cells[1]).group()),
            "skuTarget": cells[2],
            "capabilityLabel": cells[3],
            "capability": CAPABILITY_MAP[cells[3]],
            "implementationTreatment": cells[4],
        })
    if len(records) != 91 or len({row["qtChair"] for row in records}) != 91:
        raise AssertionError(f"expected 91 unique packet override rows, found {len(records)}")
    return records


def canonical_behavior(row: dict, treatment_text: str | None = None) -> str:
    capability = row["highestTruthfulCapability"]
    prefix = f"{treatment_text.rstrip('.')} . " if treatment_text else ""
    if capability == "Scoring":
        body = "Report total taps, governed scoring-region counts, points by region, misses, and total score. Every tap reconciles exactly once. USM uses governed Score, Hit Rate, and Points per Tap."
    elif capability == "Zone / Object Counting":
        body = "Report total taps, counts by established zone/object, useful zones/objects hit, and misses/outside where applicable. No points. Every tap reconciles exactly once."
    elif capability == "Evidence Only":
        body = "Preserve source evidence, total taps, and exact canonical coordinates through RESULT, SEC, Vault, and exact reopen. Do not add target semantics, zones, values, or scoring."
    else:
        body = "Preserve the governed zeroing treatment and exact canonical tap coordinates without inventing correction or course rules."
    return (prefix + body).replace(" . ", ". ")


def clean_treatment(row: dict, override: dict | None) -> None:
    treatment = row["smartTargetTreatment"]
    measured = treatment.setdefault("truthLayers", {}).setdefault("sczn3MeasuredIntelligence", {})
    for key in ("shotPatternCenter", "distribution", "dispersion"):
        measured.pop(key, None)
    measured.update({"qtLockedResultCleanup": "counts_scores_and_misses_only", "centerPatternAnalytics": False, "distributionEvennessAnalytics": False})
    treatment.setdefault("result", {}).update({"shotPattern": False, "distributionMeta": False})
    treatment.setdefault("session", {}).update({"centerMovement": False, "dispersionChange": False})
    treatment.setdefault("progress", {})["tightestPatternPersonalBest"] = False
    treatment["highestTruthfulCapability"] = row["highestTruthfulCapability"]
    treatment["intelligenceFamily"] = row["intelligenceFamily"]
    behavior = canonical_behavior(row, override["implementationTreatment"] if override else None)
    if override or FORBIDDEN_RESULT_LANGUAGE.search(str(treatment.get("smartBehavior") or "")):
        treatment["smartBehavior"] = behavior
    for record_key in ("homieCorrectedTreatment",):
        record = treatment.get(record_key)
        if isinstance(record, dict) and (override or FORBIDDEN_RESULT_LANGUAGE.search(str(record.get("requiredBehavior") or ""))):
            record["requiredBehavior"] = behavior
            record["capability"] = row["highestTruthfulCapability"]
            record["intelligenceFamily"] = row["intelligenceFamily"]
    for record_key in ("homieCorrectedTreatmentRecord", "homieLockedCatalogRecord"):
        record = row.get(record_key)
        if isinstance(record, dict) and (override or FORBIDDEN_RESULT_LANGUAGE.search(str(record.get("codyAction") or record.get("smartBehavior") or ""))):
            if "codyAction" in record:
                record["codyAction"] = behavior
            if "smartBehavior" in record:
                record["smartBehavior"] = behavior
            if "capability" in record:
                record["capability"] = row["highestTruthfulCapability"]
            if "intelligenceFamily" in record:
                record["intelligenceFamily"] = row["intelligenceFamily"]
    treatment["correctedPacketLock"] = {
        "lockId": LOCK_ID,
        "packetPath": str(PACKET.relative_to(DOCS)),
        "packetSha256": PACKET_SHA256,
        "universalLocksApplied": True,
        "explicitOverride": deepcopy(override),
        "founderAcceptance": "PENDING",
    }


def apply_geometry_lock(row: dict, lock: dict) -> None:
    observed = deepcopy(row.get("geometry", {}).get("observedPhysicalStructure", {}))
    row["highestTruthfulCapability"] = lock["capability"]
    row["intelligenceFamily"] = lock["family"]
    row["missionFamily"] = "targetScoring"
    row["geometry"] = {
        "coordinateSystem": "normalized_source_image_top_left",
        "layoutModel": "regions",
        "regions": deepcopy(lock["regions"]),
        "ugoAuthority": "sczn3.ugo.normalized-source-image-point.v1",
        "derivation": {"method": "target-specific-visible-boundary-registration", "semanticSource": LOCK_ID, "familyGeneralization": False},
        "observedPhysicalStructure": observed,
    }
    treatment = row["smartTargetTreatment"]
    treatment["highestTruthfulCapability"] = lock["capability"]
    treatment["intelligenceFamily"] = lock["family"]
    publisher = treatment["truthLayers"]["publisherTruth"]
    publisher["publishedRuleAuthority"] = {"source": LOCK_ID, "packetSha256": PACKET_SHA256, "rule": lock["rule"]}
    publisher["publishedValuesAvailable"] = lock["capability"] == "Scoring"
    publisher["artworkFacts"] = {
        "values": [rule["value"] for rule in lock["rules"].values() if "value" in rule],
        "labels": [rule["label"] for rule in lock["rules"].values()],
        "authorityClass": "homie_corrected_packet_and_exact_registered_face",
    }
    structure = treatment["truthLayers"]["targetStructure"]
    structure.update({"registeredGeometryStatus": "regions_available", "registeredRegionCount": len(lock["regions"]), "registeredRegionIds": [region["regionId"] for region in lock["regions"]]})
    treatment.setdefault("accounting", {})["meaningfulBreakdown"] = "score_and_regions" if lock["capability"] == "Scoring" else "regions_or_objects"
    treatment.setdefault("result", {}).update({"publisherScore": lock["capability"] == "Scoring", "regionObjectBreakdown": True})
    treatment.setdefault("progress", {})["scoreHistoryWhenGoverned"] = lock["capability"] == "Scoring"
    treatment["smartBehavior"] = canonical_behavior(row, lock["rule"])
    for record_key in ("homieCorrectedTreatmentRecord",):
        record = row.setdefault(record_key, {})
        record.update({
            "capability": lock["capability"], "intelligenceFamily": lock["family"],
            "labels": [rule["label"] for rule in lock["rules"].values()],
            "values": [str(rule["value"]) for rule in lock["rules"].values() if "value" in rule],
            "regionIds": [region["regionId"] for region in lock["regions"]],
            "storedGoverningRule": lock["rule"], "codyAction": treatment["smartBehavior"],
        })


def apply_evidence_downgrade(row: dict, reason: str) -> None:
    observed = deepcopy(row.get("geometry", {}).get("observedPhysicalStructure", {}))
    row.update({"highestTruthfulCapability": "Evidence Only", "intelligenceFamily": "EVIDENCE_ONLY", "missionFamily": "smartEvidenceCapture"})
    row["geometry"] = {
        "status": "image_plane_evidence_only", "coordinateSystem": "normalized_source_image_top_left",
        "canonicalRegionMapping": "unavailable", "semanticClassification": "not_established_by_corrected_packet",
        "physicalMeasurement": "unavailable", "observedPhysicalStructure": observed,
    }
    treatment = row["smartTargetTreatment"]
    treatment.update({"highestTruthfulCapability": "Evidence Only", "intelligenceFamily": "EVIDENCE_ONLY"})
    treatment["truthLayers"]["publisherTruth"].update({"publishedValuesAvailable": False, "publishedRuleAuthority": {"source": LOCK_ID, "packetSha256": PACKET_SHA256, "rule": reason}})
    treatment["truthLayers"]["targetStructure"].update({"registeredGeometryStatus": "no_governed_regions", "registeredRegionCount": 0, "registeredRegionIds": []})
    treatment.setdefault("accounting", {})["meaningfulBreakdown"] = "evidence_and_total_taps"
    treatment.setdefault("result", {}).update({"publisherScore": False, "regionObjectBreakdown": False})
    treatment.setdefault("progress", {})["scoreHistoryWhenGoverned"] = False


def scoring_definition(lock: dict) -> dict:
    numeric = lock["model"] == "numeric_regions"
    return {
        "schemaVersion": "sczn3-target-scoring-data-v1", "status": "complete", "model": lock["model"],
        "regionRules": deepcopy(lock["rules"]), "aggregation": {"mode": "sum" if numeric else "classification_counts"},
        "publisherRuleAuthority": {"source": LOCK_ID, "packetSha256": PACKET_SHA256, "rule": lock["rule"]},
        "outsideRule": {"label": "Outside target miss", **({"value": 0} if numeric else {})},
        "classificationFootprintMode": "tap_center", "correctedPacketLock": {"lockId": LOCK_ID, "familyGeneralization": False},
    }


def bind_target_scoring(contract: dict, row: dict, lock: dict) -> None:
    contract["contractId"] = re.sub(r"-(smart-evidence|target-scoring)-v1$", "-target-scoring-v1", contract["contractId"])
    contract.update({"missionFamily": "targetScoring", "resultPackageType": "targetScoreResult", "resultPackageVersion": "1"})
    contract["executor"] = {"id": "declarative-target-score", "version": "1"}
    contract["secAdapter"] = {"id": "target-scoring-family", "version": "1", "scoringPresentationFamily": "target-data"}
    contract["preservationValidator"] = {"id": "target-scoring-preservation", "version": "1"}
    contract["components"]["geometry"].update({"version": "3", "definition": deepcopy(row["geometry"])})
    contract["components"]["scoring"].update({"version": "3", "definition": scoring_definition(lock)})
    mission = contract["components"]["mission"]["definition"]
    mission.update({"missionFamily": "targetScoring", "resultPackageType": "targetScoreResult", "resultPackageVersion": "1", "authorityResolution": lock["rule"], "recognizedBehaviorFamily": lock["family"]})
    mission.setdefault("capabilityStates", {}).update({"evidence": {"status": "available"}, "measurement": {"status": "available"}, "officialScore": {"status": "available" if lock["capability"] == "Scoring" else "not_applicable"}})
    contract.setdefault("session", {})["capabilityStates"] = deepcopy(mission["capabilityStates"])


def bind_smart_evidence(contract: dict, row: dict, reason: str) -> None:
    contract["contractId"] = re.sub(r"-(smart-evidence|target-scoring)-v1$", "-smart-evidence-v1", contract["contractId"])
    contract.update({"missionFamily": "smartEvidenceCapture", "resultPackageType": "smartEvidenceResult", "resultPackageVersion": "1"})
    contract["executor"] = {"id": "smart-evidence-capture", "version": "1"}
    contract["secAdapter"] = {"id": "smart-evidence-family", "version": "1", "scoringPresentationFamily": "target-data"}
    contract["preservationValidator"] = {"id": "smart-evidence-preservation", "version": "1"}
    contract["components"]["geometry"].update({"version": "3", "definition": deepcopy(row["geometry"])})
    contract["components"]["scoring"].update({"version": "3", "definition": {"status": "not_applicable", "reason": reason, "publisherRuleAuthority": {"source": LOCK_ID, "packetSha256": PACKET_SHA256, "rule": reason}}})
    mission = contract["components"]["mission"]["definition"]
    mission.update({"missionFamily": "smartEvidenceCapture", "resultPackageType": "smartEvidenceResult", "resultPackageVersion": "1", "authorityResolution": reason, "recognizedBehaviorFamily": "EVIDENCE_ONLY"})
    mission.setdefault("capabilityStates", {}).update({"evidence": {"status": "available"}, "measurement": {"status": "available"}, "officialScore": {"status": "not_applicable"}, "qualification": {"status": "not_applicable"}, "publisherMission": {"status": "not_applicable"}})
    contract.setdefault("session", {})["capabilityStates"] = deepcopy(mission["capabilityStates"])


def update_contract(row: dict, lock: dict | None, downgrade_reason: str | None) -> dict:
    path = DOCS / row["contractPath"]
    before = sha256(path)
    contract = json.loads(path.read_text(encoding="utf-8"))
    contract["authorityContractVersion"] = "QT-PRINTER13-CORRECTED-PACKET-2026-09-27-v1"
    contract["approval"] = {"status": "approved", "authorityId": LOCK_ID, "approvedAt": "2026-09-27T00:00:00-04:00", "founderAcceptance": "pending"}
    contract["targetProfile"]["product"].update({"episode64IntelligenceFamily": row["intelligenceFamily"], "homieLockedCapability": row["highestTruthfulCapability"], "correctedPacketSha256": PACKET_SHA256})
    if lock:
        bind_target_scoring(contract, row, lock)
    elif downgrade_reason:
        bind_smart_evidence(contract, row, downgrade_reason)
    mission = contract["components"]["mission"]["definition"]
    mission["smartTargetTreatment"] = deepcopy(row["smartTargetTreatment"])
    mission["correctedPacket"] = {"path": str(PACKET.relative_to(DOCS)), "sha256": PACKET_SHA256, "lockId": LOCK_ID}
    for component in contract["components"].values():
        component["digest"] = component_digest(component)
    contract.pop("contractFingerprint", None)
    validated = validate_contract(contract)
    path.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")
    row["contractSha256"] = sha256(path)
    row["contractFingerprint"] = validated["contractFingerprint"]
    return {"path": str(path.relative_to(DOCS)), "beforeSha256": before, "afterSha256": row["contractSha256"], "changed": before != row["contractSha256"]}


def update_selector(rows: list[dict]) -> None:
    text = SELECTOR.read_text(encoding="utf-8")
    match = re.search(r"const surfaces=(\[.*?\]);const selector=", text)
    if not match:
        raise AssertionError("Founder selector surfaces payload not found")
    surfaces = json.loads(match.group(1))
    by_id = {row["qtCatalogId"]: row for row in rows}
    for surface in surfaces:
        row = by_id[surface["qtCatalogId"]]
        surface.update({"capability": row["highestTruthfulCapability"], "family": row["intelligenceFamily"], "missionFamily": row["missionFamily"]})
    payload = json.dumps(surfaces, separators=(",", ":")).replace("</", "<\\/")
    text = text[:match.start(1)] + payload + text[match.end(1):]
    text = re.sub(r"v=qt-[^`\"&]+", "v=qt-corrected-packet-20260927", text)
    SELECTOR.write_text(text, encoding="utf-8")


def main() -> None:
    records = docx_rows()
    authority = json.loads(AUTHORITY.read_text(encoding="utf-8"))
    rows = authority["chairs"]
    if len(rows) != 254 or len({row["qtCatalogId"] for row in rows}) != 254:
        raise AssertionError("Backend Authority must contain 254 unique QT chairs")
    by_chair = {int(row["chair"]): row for row in rows}
    overrides = {record["qtChair"]: record for record in records}
    identity_failures = []
    for chair, record in overrides.items():
        row = by_chair.get(chair)
        if not row:
            identity_failures.append({"qtChair": chair, "reason": "missing_authority_chair"})
            continue
        packet_sku = norm(record["skuTarget"])
        stored = [norm(value) for value in row.get("skuProductIdentifiers", [])]
        if not any(packet_sku in value or value in packet_sku for value in stored):
            identity_failures.append({"qtChair": chair, "packet": record["skuTarget"], "stored": row.get("skuProductIdentifiers")})
    if identity_failures:
        raise AssertionError(f"packet identity reconciliation failed: {identity_failures}")

    before_counts = dict(Counter(row["highestTruthfulCapability"] for row in rows))
    changes = []
    for row in rows:
        chair = int(row["chair"])
        override = overrides.get(chair)
        prior = row["highestTruthfulCapability"]
        if override:
            row["highestTruthfulCapability"] = override["capability"]
            row["correctedPacketOverride"] = deepcopy(override)
        if chair in GEOMETRY_LOCKS:
            apply_geometry_lock(row, GEOMETRY_LOCKS[chair])
        elif chair in EVIDENCE_DOWNGRADES:
            apply_evidence_downgrade(row, EVIDENCE_DOWNGRADES[chair])
        clean_treatment(row, override)
        if prior != row["highestTruthfulCapability"]:
            changes.append({"qtChair": chair, "qtCatalogId": row["qtCatalogId"], "productName": row["productName"], "from": prior, "to": row["highestTruthfulCapability"]})

    after_counts = dict(Counter(row["highestTruthfulCapability"] for row in rows))
    if after_counts != EXPECTED_FINAL_COUNTS:
        raise AssertionError(f"final capability counts differ: {after_counts}")

    contract_changes = []
    for row in rows:
        if not row.get("contractPath"):
            continue
        chair = int(row["chair"])
        contract_changes.append(update_contract(row, GEOMETRY_LOCKS.get(chair), EVIDENCE_DOWNGRADES.get(chair)))

    leg3 = json.loads(LEG3.read_text(encoding="utf-8"))
    by_id = {row["qtCatalogId"]: row for row in rows}
    for surface in leg3["surfaces"]:
        row = by_id[surface["qtCatalogId"]]
        surface.update({"executionCapability": row["highestTruthfulCapability"], "missionFamily": row["missionFamily"]})

    packet_record = {"path": str(PACKET.relative_to(DOCS)), "sha256": PACKET_SHA256, "lockId": LOCK_ID, "reviewedChairs": 254, "explicitOverrideRows": len(records), "founderAcceptance": "PENDING"}
    authority.update({
        "schemaVersion": "sczn3-qt-printer13-corrected-packet-authority-v1",
        "status": "CORRECTED_PACKET_IMPLEMENTED_PENDING_INDEPENDENT_VERIFICATION",
        "catalogAuthority": packet_record,
        "baseIdentityPublisherRecord": "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23/QT_HOMIE_254_CORRECTED_TREATMENTS.md",
        "capabilityCounts": after_counts,
        "correctedPacketReconciliation": str(RECONCILIATION.relative_to(DOCS)),
    })
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n", encoding="utf-8")
    leg3.update({"status": authority["status"], "capabilityCounts": after_counts, "correctedPacket": packet_record})
    LEG3.write_text(json.dumps(leg3, indent=2) + "\n", encoding="utf-8")
    for path in (MANIFEST, COMPLETION):
        data = json.loads(path.read_text(encoding="utf-8"))
        data.update({"status": authority["status"], "capabilityCounts": after_counts, "correctedPacket": packet_record})
        path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    LEDGER.write_text(json.dumps({"schemaVersion": "sczn3.qt-printer13.corrected-packet-ledger.v1", "packet": packet_record, "overrides": records}, indent=2) + "\n", encoding="utf-8")
    reconciliation = {
        "schemaVersion": "sczn3.qt-printer13.corrected-implementation-reconciliation.v1",
        "status": "IMPLEMENTED_PENDING_INDEPENDENT_VERIFICATION",
        "packet": packet_record,
        "chairs": 254,
        "contracts": 253,
        "inheritedZeroing": 1,
        "beforeCapabilityCounts": before_counts,
        "capabilityCounts": after_counts,
        "changedChairCount": len(changes),
        "changedChairs": changes,
        "geometryCorrectedChairs": sorted(GEOMETRY_LOCKS),
        "evidenceDowngradeChairs": sorted(EVIDENCE_DOWNGRADES),
        "qtResultCleanupChairs": 254,
        "usmcThreatFiveZoneCorrection": 288 in GEOMETRY_LOCKS,
        "contractFilesChanged": sum(item["changed"] for item in contract_changes),
        "contractChanges": contract_changes,
        "implementationConflicts": [],
        "withholds": [],
    }
    RECONCILIATION.write_text(json.dumps(reconciliation, indent=2) + "\n", encoding="utf-8")
    update_selector(rows)
    print(json.dumps({key: reconciliation[key] for key in ("status", "chairs", "contracts", "beforeCapabilityCounts", "capabilityCounts", "changedChairCount", "geometryCorrectedChairs", "qtResultCleanupChairs")}, indent=2))


if __name__ == "__main__":
    main()
