#!/usr/bin/env python3
"""Finish QT Printer #13 with family-level Smart Target treatments."""
from __future__ import annotations

import hashlib
import html
import importlib.util
import json
import math
import time
from collections import Counter
from copy import deepcopy
from pathlib import Path


HERE = Path(__file__).resolve().parent
DOCS = HERE.parents[2]
CONTRACTS = DOCS / "backend/target_execution_contracts/contracts"
LEG2 = HERE.parent / "qt-printer13-leg2-recognition-compression-delta-2026-09-22/QT_LEG2_FAMILY_COMPRESSION_MANIFEST.json"
EXECUTION = HERE / "QT_LEG3_EXECUTION_MANIFEST.json"
AUTHORITY = DOCS / "backend/target_knowledge/qt_printer13_leg3_execution_authority.json"
MANIFEST = HERE / "QT_FINAL_SMART_TARGET_COMPLETION_MANIFEST.json"
REVIEW = HERE / "QT_FINAL_SMART_TARGET_USEFULNESS_REVIEW.html"
RUNTIME = HERE / "QT_FINAL_SMART_TARGET_BUILD_RUNTIME.json"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


base = load_module("qt_final_base", HERE / "build_qt_leg3_execution.py")
elev = load_module("qt_final_elevation", HERE / "elevate_qt_capabilities.py")


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def non_qt_snapshot() -> dict[str, str]:
    return {
        str(path.relative_to(DOCS)): sha(path)
        for path in sorted(CONTRACTS.glob("*.json"))
        if not path.name.startswith("qt_printer13_product_")
    }


def five_spot_behavior() -> dict:
    centers = ((0.226, 0.239), (0.760, 0.239), (0.500, 0.479), (0.222, 0.741), (0.758, 0.741))
    regions, rules = [], {}
    for number, (cx, cy) in enumerate(centers, start=1):
        object_id = f"spot_{number}"
        aim_id = f"spot_{number}_aim_point"
        regions.append(elev.rectangle(aim_id, cx - 0.025, cy - 0.018, cx + 0.025, cy + 0.018, 120, objectId=object_id))
        regions.append(elev.ellipse(object_id, cx, cy, 0.120, 0.105, 80, objectId=object_id))
        rules[aim_id] = {"label": f"Spot {number} aim point", "objectId": object_id, "objectLabel": f"Spot {number}", "subsetRole": "aim_point"}
        rules[object_id] = {"label": f"Spot {number}", "objectId": object_id, "objectLabel": f"Spot {number}"}
    return {
        "model": "named_regions",
        "regions": regions,
        "rules": rules,
        "truth": "The preserved QT artwork governs five independent spots and one square center aim point within each spot. Aim-point hits are subsets of spot hits; no shot quota, sequence, or perfect drill is claimed.",
        "capability": "Zone / Object Counting",
    }


def sector_polygon(center_x: float, center_y: float, radius: float, start_degrees: float, end_degrees: float) -> list[list[float]]:
    points = [[center_x, center_y]]
    steps = 5
    for step in range(steps + 1):
        angle = math.radians(start_degrees + (end_degrees - start_degrees) * step / steps)
        points.append([round(center_x + radius * math.cos(angle), 5), round(center_y + radius * math.sin(angle), 5)])
    return points


def diagnostic_behavior(surface: dict) -> tuple[dict, dict]:
    regions = [
        elev.ellipse("ring_10", 0.50, 0.515, 0.115, 0.090, 110),
        elev.ellipse("ring_9", 0.50, 0.515, 0.175, 0.140, 100),
        elev.ellipse("ring_8", 0.50, 0.515, 0.235, 0.190, 90),
        elev.ellipse("ring_7", 0.50, 0.515, 0.295, 0.240, 80),
    ]
    rules = {f"ring_{value}": {"label": str(value), "value": value} for value in (10, 9, 8, 7)}
    behavior = elev.numeric(regions, rules, "The preserved QT DIAG artwork prints governed 10/9/8/7 rings. Printed handedness-specific diagnostic labels are reported separately as publisher label matches, not SCZN3 causal diagnoses.")
    right = [
        "Thumbing", "Squeezing Whole Hand With Trigger Pull", "Breaking Wrist Down Or Relaxing Too Soon",
        "Jerking", "Squeezing Finger Tips While Applying Trigger Pull", "Too Much Or Too Little Trigger Finger",
        "Pushing, Anticipating Recoil Or No Follow Through", "Breaking Wrist Up", "Heeling, Anticipating Recoil",
    ]
    left = [
        "Too Much Or Too Little Trigger Finger", "Squeezing Finger Tips While Applying Trigger Pull", "Jerking",
        "Breaking Wrist Down Or Relaxing Too Soon", "Squeezing Whole Hand With Trigger Pull", "Thumbing",
        "Heeling, Anticipating Recoil", "Breaking Wrist Up", "Pushing, Anticipating Recoil Or No Follow Through",
    ]
    handedness = "left" if surface["visualStackOrdinal"] == 115 else "right"
    labels = left if handedness == "left" else right
    boundaries = [-20, 25, 65, 82, 112, 150, 205, 245, 295, 340]
    overlay_regions, label_map = [], {}
    for index, label in enumerate(labels):
        region_id = f"diagnostic_sector_{index + 1}"
        overlay_regions.append({"regionId": region_id, "shape": "polygon", "points": sector_polygon(0.50, 0.515, 0.455, boundaries[index], boundaries[index + 1]), "priority": 20})
        label_map[region_id] = label
    overlay = {
        "status": "governed_publisher_printed_labels",
        "handedness": handedness,
        "regions": overlay_regions,
        "labels": label_map,
        "authority": "Preserved QT DIAG-L/DIAG-R publisher artwork and Leg Two DIAG_L_R finding",
        "unsupportedClaims": ["causal_diagnosis", "correction", "coaching"],
    }
    return behavior, overlay


def add_diagnostic_overlay(package: dict, overlay: dict) -> dict:
    package = deepcopy(package)
    component = package["components"]["mission"]
    definition = deepcopy(component["definition"])
    definition["diagnosticOverlay"] = overlay
    package["components"]["mission"] = base.component(component["id"], definition)
    package["unsupportedUses"] = sorted(set(package.get("unsupportedUses") or []) | {"sczn3_causal_diagnosis", "invented_correction"})
    return package


def treatment(surface: dict, non_qt_contracts: dict) -> tuple[str, str, dict | None, str]:
    ordinal = surface["visualStackOrdinal"]
    family = surface["sczn3BehaviorFamily"]
    elev.NON_QT_CONTRACTS = non_qt_contracts
    if ordinal == 192:
        return "Zeroing", "Inherited proven M16A2 25m zeroing road", None, "existing_zeroing_inherit"
    if ordinal == 3:
        return "Evidence", "Evidence + measured shot-pattern/session intelligence; anatomy identities remain unbound", base.evidence_contract(surface), "accepted_evidence_only"
    if ordinal == 1:
        package = elev.make_target_scoring(surface, five_spot_behavior())
        return "Zone-Object", "Five independent spots with aim-point subsets, distribution and progress", package, "qt_five_spot_exact_structure"
    if family == "DIAGNOSTIC_FEEDBACK":
        behavior, overlay = diagnostic_behavior(surface)
        package = add_diagnostic_overlay(elev.make_target_scoring(surface, behavior), overlay)
        return "Diagnostic", "Governed ring score + handedness-specific publisher label distribution + progress", package, "qt_diag_combined"
    capability, behavior = elev.capability_for(surface)
    if capability == "Zeroing":
        return "Zeroing", "Inherited proven zeroing road", None, "existing_zeroing_inherit"
    if capability == "Evidence Only":
        return "Evidence", "Evidence + measured shot-pattern/session intelligence", base.evidence_contract(surface), "spatial_evidence"
    package = behavior if isinstance(behavior, dict) and behavior.get("schemaVersion") == "sczn3-target-execution-contract-v1" else elev.make_target_scoring(surface, behavior)
    category = "Scoring" if capability == "Scoring" else "Zone-Object"
    return category, (
        "Governed values plus hit/miss, distribution, pattern and longitudinal intelligence"
        if category == "Scoring"
        else "Independent governed/observable regions or objects plus hit/miss, distribution, pattern and longitudinal intelligence"
    ), package, "existing_family_behavior_with_qt_data"


def review_html(rows: list[dict], counts: dict[str, int]) -> str:
    cards = []
    for row in rows:
        href = f"../../../target-experience.html?missionFamily={row['missionFamily']}&target={row['targetProfileId']}&source=registered&authorityPort=8098" if row["missionFamily"] != "zeroingCorrection" else f"../../../shoot.html?target_profile_id={row['targetProfileId']}&missionFamily=zeroingCorrection&authorityPort=8098"
        cards.append(f'''<a class="card" data-family="{html.escape(row['behaviorFamily'])}" data-capability="{html.escape(row['finalTreatment'])}" href="{html.escape(href)}"><b>#{row['visualStackOrdinal']}</b><img src="../qt-printer13-visual-ingestion-2026-09-22/{html.escape(row['imageLocalPath'])}" loading="lazy"><strong>{html.escape(row['productName'])}</strong><small>{html.escape(row['finalTreatment'])} · {html.escape(row['smartUsefulness'])}</small></a>''')
    count_text = " · ".join(f"{name} {value}" for name, value in counts.items())
    return f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QT Final Smart Target Usefulness Review</title><style>*{{box-sizing:border-box}}body{{margin:0;background:#090c10;color:#eef;font:12px system-ui}}header{{position:sticky;top:0;z-index:3;background:#101722ee;padding:9px;border-bottom:1px solid #35404e}}h1{{font-size:18px;margin:0 0 3px}}p{{margin:2px 0;color:#aeb9c6}}main{{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:5px}}.card{{position:relative;display:block;background:#151c25;border:1px solid #303b49;padding:3px;color:#fff;text-decoration:none;min-width:0}}.card:hover{{border-color:#f3ca5e}}.card>b{{position:absolute;background:#05080bdd;padding:2px 5px;font-size:18px}}img{{display:block;width:100%;height:142px;object-fit:contain;background:#fff}}strong,small{{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}small{{font-size:9px;color:#9eabb9}}@media(max-width:800px){{main{{grid-template-columns:repeat(3,1fr)}}}}</style></head><body><header><h1>QT Printer #13 · Final Smart Target Usefulness</h1><p>254 chairs · {html.escape(count_text)} · click any chair to run its governed experience</p><p>Every result includes truthful shot-pattern intelligence; structured targets additionally expose score/region/object distribution and same-target progress.</p></header><main>{''.join(cards)}</main></body></html>'''


def main() -> None:
    started = time.perf_counter()
    non_qt_before = non_qt_snapshot()
    leg2 = json.loads(LEG2.read_text())
    current = json.loads(EXECUTION.read_text())
    before = {row["qtCatalogId"]: row for row in current["surfaces"]}
    non_qt_contracts = {
        package["contractId"]: package
        for path in CONTRACTS.glob("*.json")
        if not path.name.startswith("qt_printer13_product_")
        for package in [json.loads(path.read_text())]
    }
    desired_paths = set()
    rows, treatments = [], []
    for surface in leg2["surfaces"]:
        surface = deepcopy(surface)
        final_treatment, usefulness, package, basis = treatment(surface, non_qt_contracts)
        image = surface["preservedImages"][0]
        if package is None:
            mission, result_type, target_id, contract_id, contract_path = "zeroingCorrection", "zeroCorrectionResult", "qualification_m16a2_25m_zero", "MFAM:qualification_m16a2_25m_zero", None
        else:
            target_id, mission, result_type, contract_id = package["targetProfile"]["id"], package["missionFamily"], package["resultPackageType"], package["contractId"]
            suffix = "target_scoring" if mission == "targetScoring" else "smart_evidence"
            contract_path = f"backend/target_execution_contracts/contracts/{target_id}_{suffix}_v1.json"
            destination = DOCS / contract_path
            destination.write_text(json.dumps(package, indent=2) + "\n")
            desired_paths.add(destination.resolve())
        row = {
            **{key: before[surface["qtCatalogId"]].get(key) for key in before[surface["qtCatalogId"]]},
            "visualStackOrdinal": surface["visualStackOrdinal"], "qtCatalogId": surface["qtCatalogId"], "shopifyProductId": surface["shopifyProductId"],
            "productName": surface["productName"], "skuProductIdentifiers": surface["skuProductIdentifiers"], "sourceUrl": surface["sourceUrl"],
            "behaviorFamily": surface["sczn3BehaviorFamily"], "qtFamilyGroup": surface["qtFamilyGroup"], "semanticStatus": surface["semanticStatus"], "unresolvedReason": surface.get("unresolvedReason"),
            "targetProfileId": target_id, "missionFamily": mission, "resultPackageType": result_type, "contractId": contract_id, "contractPath": contract_path,
            "executionCapability": "Evidence Only" if final_treatment == "Evidence" else ("Zeroing" if final_treatment == "Zeroing" else ("Scoring" if final_treatment in {"Scoring", "Diagnostic"} else "Zone / Object Counting")),
            "finalTreatment": final_treatment, "smartUsefulness": usefulness, "treatmentBasis": basis,
            "imageLocalPath": image["localPath"], "assetPath": f"authority-evidence/platform/qt-printer13-visual-ingestion-2026-09-22/{image['localPath']}", "assetSha256": image["sha256"], "imageWidth": image["width"], "imageHeight": image["height"], "provenance": surface["sourceProvenance"],
        }
        rows.append(row)
        old = before[surface["qtCatalogId"]]
        treatments.append({"visualStackOrdinal": row["visualStackOrdinal"], "qtCatalogId": row["qtCatalogId"], "productName": row["productName"], "behaviorFamily": row["behaviorFamily"], "finalTreatment": final_treatment, "smartUsefulness": usefulness, "changed": any(old.get(key) != row.get(key) for key in ("missionFamily", "contractId", "contractPath", "executionCapability"))})

    for path in CONTRACTS.glob("qt_printer13_product_*.json"):
        if path.resolve() not in desired_paths:
            path.unlink()
    if len(rows) != 254 or len({row["qtCatalogId"] for row in rows}) != 254:
        raise AssertionError("QT final treatment inventory must contain 254 unique chairs")
    if len(desired_paths) != 253:
        raise AssertionError(f"expected 253 QT contracts, found {len(desired_paths)}")
    non_qt_after = non_qt_snapshot()
    if non_qt_before != non_qt_after:
        raise AssertionError("non-QT target-specific contract mutation detected")

    capability_counts = dict(sorted(Counter(row["executionCapability"] for row in rows).items()))
    treatment_counts = dict(sorted(Counter(row["finalTreatment"] for row in rows).items()))
    family_counts = dict(sorted(Counter(row["behaviorFamily"] for row in rows).items()))
    changed = [item for item in treatments if item["changed"]]
    current.update({
        "schemaVersion": "qt-printer13-final-smart-target-execution-manifest-v1",
        "status": "FINAL_SMART_TARGET_COMPLETION_PENDING_VERIFICATION",
        "capabilityCountsBeforeFinalSmartness": current.get("capabilityCounts"),
        "capabilityCounts": capability_counts,
        "finalTreatmentCounts": treatment_counts,
        "familyCounts": family_counts,
        "changedSurfaceCount": len(changed),
        "surfaces": rows,
        "finalSmartTargetCompletionManifest": str(MANIFEST.relative_to(DOCS)),
    })
    EXECUTION.write_text(json.dumps(current, indent=2) + "\n")
    payload = {
        "schemaVersion": "qt-printer13-final-smart-target-completion-v1", "generatedOn": "2026-09-22", "status": "BUILT_PENDING_INDEPENDENT_VERIFICATION",
        "scope": {"qtChairs": 254, "nonQtTargetContracts": "READ_ONLY", "webResearch": False},
        "finalTreatmentCounts": treatment_counts, "executionCapabilityCounts": capability_counts, "familyCounts": family_counts,
        "changedChairCount": len(changed), "changedChairs": changed, "treatments": treatments,
        "smartSessionProgressCoverage": {"shotPattern": 254, "sameTargetComparisonAfterSecondPreservedSession": 254, "scoreOrObjectDistribution": sum(row["missionFamily"] == "targetScoring" for row in rows), "diagnosticCombined": sum(row["finalTreatment"] == "Diagnostic" for row in rows), "zeroing": sum(row["finalTreatment"] == "Zeroing" for row in rows)},
        "sharedPlatformRepairs": ["Measured normalized shot-pattern center and dispersion", "Same-target pattern movement and spread comparison", "Object distribution/evenness", "Explicit child-region subset accounting", "Combined QT diagnostic scoring and publisher-label overlay presentation"],
        "unresolvedSemanticsPreserved": current.get("unresolvedSemanticSurfaces", 45),
        "nonQtContractBoundary": {"beforeCount": len(non_qt_before), "afterCount": len(non_qt_after), "unchanged": non_qt_before == non_qt_after, "aggregateSha256": hashlib.sha256(json.dumps(non_qt_after, sort_keys=True).encode()).hexdigest()},
        "reviewArtifact": str(REVIEW.relative_to(DOCS)),
    }
    MANIFEST.write_text(json.dumps(payload, indent=2) + "\n")
    REVIEW.write_text(review_html(rows, treatment_counts), encoding="utf-8")
    authority = json.loads(AUTHORITY.read_text())
    authority.update({"schemaVersion": "qt-printer13-final-smart-target-authority-v1", "lifecycleStatus": "supported_pending_final_smartness_verification", "finalTreatmentCounts": treatment_counts, "capabilityCounts": capability_counts, "finalSmartTargetCompletionManifest": str(MANIFEST.relative_to(DOCS)), "sharedMeasuredIntelligence": payload["sharedPlatformRepairs"], "webResearchRepeated": False, "nonQtMutation": False})
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n")
    elapsed = round(time.perf_counter() - started, 3)
    RUNTIME.write_text(json.dumps({"stage": "build", "elapsedSeconds": elapsed, "measured": True}, indent=2) + "\n")
    print(f"QT final smart target build: 254 chairs, changed={len(changed)}, treatments={treatment_counts}, capabilities={capability_counts}, elapsed={elapsed}s")


if __name__ == "__main__":
    main()
