#!/usr/bin/env python3
"""Apply the Founder/Homie QT late-review locks without generalizing target truth."""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter
from copy import deepcopy
from pathlib import Path


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))
from target_execution_contract import component_digest, validate_contract  # noqa: E402

AUTHORITY = BACKEND / "target_knowledge/qt_episode64_smart_target_authority.json"
CONTRACTS = BACKEND / "target_execution_contracts/contracts"
MANIFEST = DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22/QT_EP64_254_IMPLEMENTATION_MANIFEST.json"
LEG3 = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_LEG3_EXECUTION_MANIFEST.json"
COMPLETION = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_FINAL_SMART_TARGET_COMPLETION_MANIFEST.json"
PACKET_DIR = DOCS / "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23"
LOCKS = PACKET_DIR / "QT_FOUNDER_LATE_REVIEW_LOCKS.json"
RECONCILIATION = PACKET_DIR / "QT_FOUNDER_CORRECTED_IMPLEMENTATION_RECONCILIATION.json"
SELECTOR = PACKET_DIR / "QT_FOUNDER_254_EXECUTABLE_SELECTOR.html"
LOCK_ID = "QT_FOUNDER_CORRECTED_IMPLEMENTATION_PASS_2026_09_23"


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


TSR_OUTER = [(0.14,.92),(.10,.86),(.15,.80),(.17,.77),(.08,.74),(.02,.68),(.02,.58),(.05,.52),(.07,.42),(.16,.35),(.34,.29),(.36,.26),(.34,.22),(.34,.15),(.38,.11),(.44,.09),(.56,.09),(.63,.11),(.67,.15),(.67,.22),(.65,.26),(.67,.29),(.84,.35),(.94,.42),(.96,.52),(.99,.58),(.98,.68),(.92,.74),(.83,.77),(.86,.80),(.91,.86),(.86,.92)]
TSR_MIDDLE = [(.18,.80),(.11,.72),(.10,.62),(.14,.48),(.25,.39),(.40,.33),(.35,.28),(.35,.17),(.40,.12),(.50,.10),(.60,.12),(.65,.17),(.65,.28),(.60,.33),(.75,.39),(.86,.48),(.90,.62),(.89,.72),(.82,.80)]
TSR_INNER = [(.37,.12),(.50,.10),(.63,.12),(.66,.20),(.63,.30),(.59,.34),(.70,.42),(.72,.55),(.70,.63),(.64,.68),(.57,.70),(.43,.70),(.36,.68),(.30,.63),(.28,.55),(.30,.42),(.41,.34),(.37,.30),(.34,.20)]


def silhouette(x0: float, y0: float, x1: float, y1: float, region_id: str, label: str) -> tuple[dict, dict]:
    width, height = x1 - x0, y1 - y0
    points = [
        (x0 + .38*width, y0), (x0 + .62*width, y0), (x0 + .67*width, y0 + .17*height),
        (x0 + .66*width, y0 + .30*height), (x0 + .92*width, y0 + .43*height),
        (x1, y1), (x0, y1), (x0 + .08*width, y0 + .43*height),
        (x0 + .34*width, y0 + .30*height), (x0 + .33*width, y0 + .17*height),
    ]
    return poly(region_id, points, 50, object_id=region_id), {"label": label, "objectId": region_id, "objectLabel": label}


def tsr_lock(product: str) -> dict:
    regions = [
        poly("zone_5", TSR_INNER, 100),
        poly("zone_3", TSR_MIDDLE, 90),
        poly("zone_1", TSR_OUTER, 80),
        rect("zone_0", .10, .925, .90, .98, 1),
    ]
    rules = {f"zone_{value}": {"label": str(value), "value": value} for value in (5, 3, 1, 0)}
    return {"product": product, "capability": "Scoring", "family": "VALUED_REGION_QUALIFICATION", "regions": regions, "rules": rules, "model": "numeric_regions", "rule": "Four artwork-established scoring outcomes: 5, 3, 1, and 0; unpublished course mechanics remain UNKNOWN."}


LOCK_DEFINITIONS = {
    "QT-PRODUCT-1967347335241": tsr_lock("TSR-III PPSO"),
    "QT-PRODUCT-1967349399625": tsr_lock("TSR-IV"),
    "QT-PRODUCT-1960344911945": {
        "product": "TX-PT", "capability": "Scoring", "family": "VALUED_REGION_QUALIFICATION", "model": "numeric_regions",
        "regions": [
            ellipse("zone_5", .505, .375, .235, .155, 100),
            poly("zone_4", [(.15,.80),(.14,.32),(.23,.26),(.35,.23),(.65,.23),(.78,.26),(.86,.32),(.86,.80),(.72,.83),(.28,.83)], 90),
            poly("zone_3", [(.10,.94),(.04,.84),(.03,.35),(.13,.28),(.37,.22),(.39,.06),(.44,.02),(.56,.02),(.62,.06),(.64,.22),(.88,.28),(.97,.35),(.96,.84),(.90,.94)], 80),
        ],
        "rules": {"zone_5":{"label":"5","value":5},"zone_4":{"label":"4","value":4},"zone_3":{"label":"3","value":3}},
        "rule": "Artwork-established scoring values 5, 4, and 3; unpublished course mechanics remain UNKNOWN.",
    },
    "QT-PRODUCT-8197771264284": {
        "product":"USAF-M4-AFQC", "capability":"Zone / Object Counting", "family":"M16_M4_QUALIFICATION", "model":"named_regions",
        "regions": [], "rules": {}, "rule":"Six qualification silhouettes only: two 75 M, two 175 M, and two 300 M; lower diagrams are reference/zeroing elements.",
    },
    "QT-PRODUCT-8197776572700": {
        "product":"USAF-M4-SFQC", "capability":"Zone / Object Counting", "family":"M16_M4_QUALIFICATION", "model":"named_regions",
        "regions": [], "rules": {}, "rule":"Nine qualification silhouettes only: one 50 M, three 100 M, two 150 M, two 200 M, and one 250 M; lower diagrams are reference/zeroing elements.",
    },
    "QT-PRODUCT-1891723542601": {
        "product":"USMC-THREAT", "capability":"Zone / Object Counting", "family":"ANATOMY_VITAL_REGIONS", "model":"named_regions",
        "regions":[
            ellipse("head_circle",.50,.125,.125,.073,100,object_id="head_circle"),
            ellipse("head_outline",.50,.145,.17,.12,90,object_id="head_outline"),
            ellipse("center_chest",.50,.438,.205,.16,80,object_id="center_chest"),
            ellipse("center_mass",.50,.50,.285,.25,70,object_id="center_mass"),
            poly("pelvic_zone",[(.23,.69),(.77,.69),(.81,.75),(.66,.92),(.35,.92),(.20,.75)],60,object_id="pelvic_zone"),
        ],
        "rules":{}, "rule":"Count taps by the five established visible zones; no point values or unpublished threat-course mechanics.",
    },
    "QT-PRODUCT-10653290365212": {
        "product":"USMS-QT", "capability":"Zone / Object Counting", "family":"VALUED_REGION_QUALIFICATION", "model":"named_regions",
        "regions":[
            rect("head_inner",.435,.285,.585,.365,100,object_id="head_inner"),
            poly("head_outer",[(.39,.24),(.61,.24),(.65,.27),(.65,.38),(.57,.44),(.43,.44),(.39,.38)],90,object_id="head_outer"),
            ellipse("center_mass",.515,.61,.17,.12,80,object_id="center_mass"),
            poly("main_silhouette",[(.39,.24),(.61,.24),(.65,.38),(.76,.50),(.77,.87),(.72,.91),(.28,.91),(.23,.87),(.24,.50),(.39,.38)],60,object_id="main_silhouette"),
        ],
        "rules":{}, "rule":"Count main-target zones only; two upper-left circles and the upper-right zeroing/reference diagram are excluded.",
    },
    "QT-PRODUCT-1960347762761": {
        "product":"WI-DOJ", "capability":"Zone / Object Counting", "family":"VALUED_REGION_QUALIFICATION", "model":"named_regions",
        "regions":[
            ellipse("head_zone",.50,.22,.12,.12,100,object_id="head_zone"),
            rect("central_rectangle",.43,.34,.58,.56,90,object_id="central_rectangle"),
            ellipse("torso_zone",.50,.46,.29,.25,80,object_id="torso_zone"),
            ellipse("upper_right_circle",.84,.19,.075,.055,100,object_id="upper_right_circle"),
            poly("remaining_silhouette",[(.33,.04),(.62,.04),(.69,.17),(.90,.31),(.97,.55),(.87,.68),(.72,.73),(.64,.98),(.08,.98),(.17,.76),(.03,.62),(.08,.39),(.27,.22)],40,object_id="remaining_silhouette"),
        ],
        "rules":{}, "rule":"Count established visible outlined zones and the separate upper-right circle; no points.",
    },
    "QT-PRODUCT-1960319418441": {
        "product":"WITC-Q1", "capability":"Zone / Object Counting", "family":"VALUED_REGION_QUALIFICATION", "model":"named_regions",
        "regions":[
            poly("head_zone",[(.38,.05),(.62,.05),(.64,.18),(.59,.23),(.41,.23),(.36,.18)],100,object_id="head_zone"),
            rect("spinal_zone",.45,.19,.55,.39,95,object_id="spinal_zone"),
            rect("chest_zone",.35,.37,.65,.48,90,object_id="chest_zone"),
            poly("center_mass_zone",[(.25,.31),(.75,.31),(.77,.69),(.72,.75),(.28,.75),(.23,.69)],80,object_id="center_mass_zone"),
            poly("remaining_silhouette",[(.34,.02),(.66,.02),(.70,.27),(.88,.34),(.91,.82),(.78,.95),(.22,.95),(.09,.82),(.12,.34),(.30,.27)],40,object_id="remaining_silhouette"),
        ],
        "rules":{}, "rule":"Count taps by established visible outlined zones; no points or unpublished course mechanics.",
    },
}


def finish_object_rules() -> None:
    afqc = LOCK_DEFINITIONS["QT-PRODUCT-8197771264284"]
    for rid, label, box in [
        ("silhouette_300m_1","300 M silhouette 1",(.235,.13,.34,.215)),
        ("silhouette_75m_1","75 M silhouette 1",(.48,.12,.85,.225)),
        ("silhouette_175m_1","175 M silhouette 1",(.29,.28,.42,.415)),
        ("silhouette_175m_2","175 M silhouette 2",(.585,.28,.715,.415)),
        ("silhouette_75m_2","75 M silhouette 2",(.19,.45,.55,.585)),
        ("silhouette_300m_2","300 M silhouette 2",(.69,.48,.805,.585)),
    ]:
        region, rule = silhouette(*box, rid, label); afqc["regions"].append(region); afqc["rules"][rid] = rule
    sfqc = LOCK_DEFINITIONS["QT-PRODUCT-8197776572700"]
    for rid, label, box in [
        ("silhouette_250m","250 M silhouette",(.15,.09,.29,.18)),
        ("silhouette_300m","300 M silhouette",(.64,.09,.74,.18)),
        ("silhouette_200m_1","200 M silhouette 1",(.30,.15,.45,.26)),
        ("silhouette_200m_2","200 M silhouette 2",(.53,.15,.67,.26)),
        ("silhouette_150m_1","150 M silhouette 1",(.15,.20,.35,.34)),
        ("silhouette_150m_2","150 M silhouette 2",(.68,.20,.85,.34)),
        ("silhouette_100m_1","100 M silhouette 1",(.35,.26,.66,.36)),
        ("silhouette_100m_2","100 M silhouette 2",(.14,.34,.43,.44)),
        ("silhouette_50m","50 M silhouette",(.20,.42,.77,.59)),
    ]:
        region, rule = silhouette(*box, rid, label); sfqc["regions"].append(region); sfqc["rules"][rid] = rule
    label_maps = {
        "QT-PRODUCT-1891723542601": {"head_circle":"Head circle","head_outline":"Head outline","center_chest":"Center chest zone","center_mass":"Center mass zone","pelvic_zone":"Pelvic zone"},
        "QT-PRODUCT-10653290365212": {"head_inner":"Head inner zone","head_outer":"Head outer zone","center_mass":"Center mass zone","main_silhouette":"Remaining main silhouette"},
        "QT-PRODUCT-1960347762761": {"head_zone":"Head outlined zone","central_rectangle":"Central outlined rectangle","torso_zone":"Torso outlined zone","upper_right_circle":"Upper-right circle","remaining_silhouette":"Remaining silhouette"},
        "QT-PRODUCT-1960319418441": {"head_zone":"Head zone","spinal_zone":"Spinal zone","chest_zone":"Chest zone","center_mass_zone":"Center mass zone","remaining_silhouette":"Remaining silhouette"},
    }
    for qid, labels in label_maps.items():
        LOCK_DEFINITIONS[qid]["rules"] = {rid:{"label":label,"objectId":rid,"objectLabel":label} for rid,label in labels.items()}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean_qt_meta(treatment: dict) -> None:
    measured = treatment.get("truthLayers", {}).get("sczn3MeasuredIntelligence", {})
    for key in ("shotPatternCenter", "distribution", "dispersion"):
        measured.pop(key, None)
    measured["qtLockedResultCleanup"] = "counts_scores_and_misses_only"
    treatment.setdefault("result", {})["shotPattern"] = False
    treatment["result"]["distributionMeta"] = False
    treatment.setdefault("session", {})["centerMovement"] = False
    treatment["session"]["dispersionChange"] = False
    treatment.setdefault("progress", {})["tightestPatternPersonalBest"] = False


def apply_lock(row: dict, lock: dict) -> None:
    treatment = row["smartTargetTreatment"]
    row["highestTruthfulCapability"] = lock["capability"]
    row["intelligenceFamily"] = lock["family"]
    row["missionFamily"] = "targetScoring"
    observed = deepcopy(row["geometry"].get("observedPhysicalStructure", {}))
    row["geometry"] = {
        "coordinateSystem":"normalized_source_image_top_left", "layoutModel":"regions",
        "regions":deepcopy(lock["regions"]), "ugoAuthority":"founder-homie-individual-target-lock-v1",
        "derivation":{"method":"target-specific-visible-boundary-registration","semanticSource":LOCK_ID,"familyGeneralization":False},
        "observedPhysicalStructure":observed,
    }
    treatment["intelligenceFamily"] = lock["family"]
    treatment["highestTruthfulCapability"] = lock["capability"]
    publisher = treatment["truthLayers"]["publisherTruth"]
    publisher["publishedRuleAuthority"] = {"source":LOCK_ID,"rule":lock["rule"],"authorityOrder":"Founder/Homie exact treatment supersedes prior packet where listed"}
    publisher["publishedValuesAvailable"] = lock["capability"] == "Scoring"
    publisher["artworkFacts"] = {"values":[rule["value"] for rule in lock["rules"].values() if "value" in rule],"labels":[rule["label"] for rule in lock["rules"].values()],"authorityClass":"founder_homie_late_review_lock"}
    publisher["unresolved"] = "Timing, sequence, qualification thresholds, penalties, and unpublished course-of-fire rules remain UNKNOWN."
    structure = treatment["truthLayers"]["targetStructure"]
    structure.update({"registeredGeometryStatus":"regions_available","registeredRegionCount":len(lock["regions"]),"registeredRegionIds":[region["regionId"] for region in lock["regions"]]})
    treatment["accounting"]["meaningfulBreakdown"] = "score_and_regions" if lock["capability"] == "Scoring" else "regions_or_objects"
    treatment["result"].update({"publisherScore":lock["capability"] == "Scoring","regionObjectBreakdown":True})
    treatment["progress"]["scoreHistoryWhenGoverned"] = lock["capability"] == "Scoring"
    treatment["smartBehavior"] = lock["rule"]
    treatment["founderLateReviewLock"] = {"lockId":LOCK_ID,"product":lock["product"],"capability":lock["capability"],"familyGeneralization":False,"rule":lock["rule"]}
    row["homieCorrectedTreatmentRecord"].update({"capability":lock["capability"],"intelligenceFamily":lock["family"],"labels":[rule["label"] for rule in lock["rules"].values()],"values":[str(rule["value"]) for rule in lock["rules"].values() if "value" in rule],"regionIds":[region["regionId"] for region in lock["regions"]],"storedGoverningRule":lock["rule"],"codyAction":lock["rule"]})


def update_contract(row: dict, lock: dict | None) -> None:
    path = DOCS / row["contractPath"]
    contract = json.loads(path.read_text(encoding="utf-8"))
    contract["authorityContractVersion"] = "QT-FOUNDER-CORRECTED-IMPLEMENTATION-v5"
    contract["approval"] = {"status":"approved","authorityId":LOCK_ID,"approvedAt":"2026-09-23T00:00:00-04:00"}
    mission = contract["components"]["mission"]["definition"]
    mission["smartTargetTreatment"] = deepcopy(row["smartTargetTreatment"])
    if lock:
        contract["contractId"] = contract["contractId"].replace("smart-evidence", "target-scoring")
        contract["missionFamily"] = "targetScoring"
        contract["resultPackageType"] = "targetScoreResult"
        contract["executor"] = {"id":"declarative-target-score","version":"1"}
        contract["secAdapter"] = {"id":"target-scoring-family","version":"1","scoringPresentationFamily":"target-data"}
        contract["preservationValidator"] = {"id":"target-scoring-preservation","version":"1"}
        contract["components"]["geometry"]["definition"] = deepcopy(row["geometry"])
        contract["components"]["geometry"]["version"] = "3"
        scoring = {
            "schemaVersion":"sczn3-target-scoring-data-v1", "status":"complete", "model":lock["model"],
            "regionRules":deepcopy(lock["rules"]), "aggregation":{"mode":"sum" if lock["model"] == "numeric_regions" else "classification_counts"},
            "publisherRuleAuthority":{"source":LOCK_ID,"rule":lock["rule"]},
            "outsideRule":{"label":"Outside target miss","value":0} if lock["model"] == "numeric_regions" else {"label":"Outside target miss"},
            "classificationFootprintMode":"tap_center",
            "founderLateReviewLock":{"lockId":LOCK_ID,"familyGeneralization":False},
        }
        contract["components"]["scoring"]["definition"] = scoring
        contract["components"]["scoring"]["version"] = "3"
        mission.update({"missionFamily":"targetScoring","resultPackageType":"targetScoreResult","resultPackageVersion":"1","authorityResolution":lock["rule"],"recognizedBehaviorFamily":lock["family"]})
        mission.setdefault("capabilityStates", {})["officialScore"] = {"status":"available" if lock["capability"] == "Scoring" else "not_applicable"}
        contract["targetProfile"]["product"].update({"episode64IntelligenceFamily":lock["family"],"homieLockedCapability":lock["capability"],"founderLateReviewLock":LOCK_ID})
        contract["session"]["capabilityStates"] = deepcopy(mission["capabilityStates"])
    for component in contract["components"].values():
        component["digest"] = component_digest(component)
    contract.pop("contractFingerprint", None)
    validated = validate_contract(contract)
    path.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")
    row["contractSha256"] = sha256(path)
    row["contractFingerprint"] = validated["contractFingerprint"]


def update_selector(rows: list[dict]) -> None:
    text = SELECTOR.read_text(encoding="utf-8")
    match = re.search(r"const surfaces=(\[.*?\]);const selector=", text)
    if not match:
        raise AssertionError("Founder selector surfaces payload not found")
    surfaces = json.loads(match.group(1))
    row_by_id = {row["qtCatalogId"]: row for row in rows}
    for surface in surfaces:
        row = row_by_id[surface["qtCatalogId"]]
        surface.update({"capability": row["highestTruthfulCapability"], "family": row["intelligenceFamily"], "missionFamily": row["missionFamily"]})
    payload = json.dumps(surfaces, separators=(",", ":")).replace("</", "<\\/")
    text = text[:match.start(1)] + payload + text[match.end(1):]
    text = text.replace("v=qt-homie-corrected-254", "v=qt-founder-corrected-254")
    SELECTOR.write_text(text, encoding="utf-8")


def main() -> None:
    finish_object_rules()
    authority = json.loads(AUTHORITY.read_text(encoding="utf-8"))
    leg3 = json.loads(LEG3.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    completion = json.loads(COMPLETION.read_text(encoding="utf-8"))
    rows = authority["chairs"]
    if len(rows) != 254 or len({row["qtCatalogId"] for row in rows}) != 254:
        raise AssertionError("expected 254 unique QT chairs")
    before = {"Zone / Object Counting":154,"Evidence Only":63,"Scoring":36,"Zeroing":1}
    changes = [
        {"chair":282,"qtCatalogId":"QT-PRODUCT-1967347335241","productName":"TSR-III PPSO Paper Target","from":"Evidence Only","to":"Scoring"},
        {"chair":283,"qtCatalogId":"QT-PRODUCT-1967349399625","productName":"TSR-IV Blue Paper Target","from":"Zone / Object Counting","to":"Scoring"},
        {"chair":285,"qtCatalogId":"QT-PRODUCT-1960344911945","productName":"TX-PT Paper Target","from":"Evidence Only","to":"Scoring"},
    ]
    for row in rows:
        clean_qt_meta(row["smartTargetTreatment"])
        lock = LOCK_DEFINITIONS.get(row["qtCatalogId"])
        if lock:
            apply_lock(row, lock)
        if row.get("contractPath"):
            update_contract(row, lock)
    row_by_id = {row["qtCatalogId"]:row for row in rows}
    for surface in leg3["surfaces"]:
        row = row_by_id[surface["qtCatalogId"]]
        surface["executionCapability"] = row["highestTruthfulCapability"]
        surface["missionFamily"] = row["missionFamily"]
    after = dict(Counter(row["highestTruthfulCapability"] for row in rows))
    expected = {"Scoring":39,"Zone / Object Counting":153,"Evidence Only":61,"Zeroing":1}
    if after != expected:
        raise AssertionError(f"capability totals differ: {after}")
    lock_artifact = {"schemaVersion":"sczn3.qt-founder-late-review-locks.v1","lockId":LOCK_ID,"authorityOrder":["exact Founder/Homie target treatment","stored explicit publisher/governing authority","explicit target-face structure captured in treatment","UNKNOWN"],"lockedResultCleanup":["Strongest / Weakest","Evenness","THE CENTER OF YOUR SHOT PATTERN","directional-center labels","normalized RMS radius","target-image-coordinate explanatory language","associated RESULT card/container"],"targets":LOCK_DEFINITIONS}
    LOCKS.write_text(json.dumps(lock_artifact, indent=2) + "\n", encoding="utf-8")
    reconciliation = {"schemaVersion":"sczn3.qt-founder-corrected-implementation-reconciliation.v1","status":"IMPLEMENTED_PENDING_INDEPENDENT_VERIFICATION","lockId":LOCK_ID,"chairs":254,"beforeCapabilityCounts":before,"capabilityCounts":after,"changedCapabilityChairs":changes,"lateReviewLockedChairs":len(LOCK_DEFINITIONS),"qtResultCleanupChairs":254,"historicalSessionPolicy":"preserve evidence; no silent recalculation or semantic relabeling","unknownPolicy":"unestablished semantics remain UNKNOWN"}
    RECONCILIATION.write_text(json.dumps(reconciliation, indent=2) + "\n", encoding="utf-8")
    authority.update({"schemaVersion":"sczn3-qt-founder-corrected-implementation-authority-v5","status":"FOUNDER_CORRECTED_IMPLEMENTED_PENDING_VERIFICATION","capabilityCounts":after,"founderLateReviewLocks":str(LOCKS.relative_to(DOCS)),"founderCorrectedReconciliation":str(RECONCILIATION.relative_to(DOCS))})
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n", encoding="utf-8")
    leg3.update({"status":"FOUNDER_CORRECTED_IMPLEMENTED_PENDING_VERIFICATION","capabilityCounts":after,"founderLateReviewLocks":str(LOCKS.relative_to(DOCS))})
    LEG3.write_text(json.dumps(leg3, indent=2) + "\n", encoding="utf-8")
    manifest.update({"status":"FOUNDER_CORRECTED_IMPLEMENTED_PENDING_VERIFICATION","capabilityCounts":after,"founderLateReviewLocks":str(LOCKS.relative_to(DOCS)),"founderCorrectedReconciliation":str(RECONCILIATION.relative_to(DOCS))})
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    completion.update({"status":"FOUNDER_CORRECTED_IMPLEMENTED_PENDING_VERIFICATION","founderCorrectedCapabilityCounts":after,"smartSessionProgressCoverage":{"shotPattern":0,"sameTargetComparisonAfterSecondPreservedSession":0,"scoreOrObjectDistribution":0,"diagnosticCombined":2,"zeroing":1},"lockedResultMetaRemovedChairs":254,"founderLateReviewLocks":str(LOCKS.relative_to(DOCS))})
    COMPLETION.write_text(json.dumps(completion, indent=2) + "\n", encoding="utf-8")
    update_selector(rows)
    print(json.dumps(reconciliation, indent=2))


if __name__ == "__main__":
    main()
