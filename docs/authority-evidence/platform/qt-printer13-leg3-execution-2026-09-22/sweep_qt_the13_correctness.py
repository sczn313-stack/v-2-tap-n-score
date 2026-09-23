#!/usr/bin/env python3
"""QT-only surgical correctness sweep using existing SCZN3 authority.

No web research and no non-QT mutation. Exact prior surfaces inherit the
richest already-approved contract for that exact identity. Family recognition
without governed QT coordinate data fails closed to evidence capture.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
from collections import Counter, defaultdict
from pathlib import Path


HERE = Path(__file__).resolve().parent
DOCS = HERE.parents[2]
CONTRACTS = DOCS / "backend/target_execution_contracts/contracts"
LEG2_PATH = HERE.parent / "qt-printer13-leg2-recognition-compression-delta-2026-09-22/QT_LEG2_FAMILY_COMPRESSION_MANIFEST.json"
LEG2_UNRESOLVED_PATH = HERE.parent / "qt-printer13-leg2-recognition-compression-delta-2026-09-22/QT_LEG2_UNRESOLVED_EXCEPTIONS.json"
MANIFEST_PATH = HERE / "QT_LEG3_EXECUTION_MANIFEST.json"
SWEEP_PATH = HERE / "QT_THE13_SURGICAL_CORRECTNESS_SWEEP.json"
SWEEP_MD_PATH = HERE / "QT_THE13_SURGICAL_CORRECTNESS_SWEEP.md"
AUTHORITY_PATH = DOCS / "backend/target_knowledge/qt_printer13_leg3_execution_authority.json"

# These QT contracts have explicit, durable, stored-image repair authority from
# the completed Founder family pass. They are not generic family promotions.
QT_SPECIFIC_PROVEN = {
    7: "stored QT artwork proves the printed 5X center",
    15: "stored QT artwork plus established B-27 authority proves X/10/9/8/7",
    25: "Founder-designated known-good B-27R control retains established B-family scoring",
    43: "stored QT artwork proves two upper aiming circles and central outlines",
    56: "stored QT artwork proves independently outlined CCSO regions without values",
    57: "stored QT artwork proves independently outlined CCSO regions without values",
    58: "stored QT artwork proves independently outlined CCSO regions without values",
    59: "stored QT artwork proves independently outlined CCSO regions without values",
    114: "stored QT artwork proves three independently meaningful DHS-SQT areas",
    134: "stored QT artwork proves numbered peripheral objects and outlined regions without anatomy inference",
    182: "established IPSC surface authority is already inherited by the QT contract",
    192: "established M16A2 25m zeroing authority is already inherited",
    237: "stored QT artwork proves printed SI-4 ring values",
    245: "stored QT artwork publishes SQT-A1 10/5 regions and score table",
    246: "stored QT artwork publishes RCSO SQT-A1 10/5 regions and variant geometry",
}

MODEL_RANK = {
    "numeric_regions": 3,
    "penalty_regions": 3,
    "mixed_regions": 3,
    "named_regions": 2,
    "multiple_bulls": 2,
    "ordered_objects": 2,
    "not_applicable": 1,
}


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


base = load_module("qt_leg3_base", HERE / "build_qt_leg3_execution.py")
elev = load_module("qt_leg3_elevation", HERE / "elevate_qt_capabilities.py")


def file_sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def non_qt_snapshot():
    paths = sorted(path for path in CONTRACTS.glob("*.json") if not path.name.startswith("qt_printer13_product_"))
    return {str(path.relative_to(DOCS)): file_sha(path) for path in paths}


def capability(package):
    if package["missionFamily"] == "smartEvidenceCapture":
        return "Evidence Only"
    model = package["components"]["scoring"]["definition"].get("model")
    return "Scoring" if MODEL_RANK.get(model) == 3 else "Zone / Object Counting"


def contract_path(package):
    suffix = "target_scoring" if package["missionFamily"] == "targetScoring" else "smart_evidence"
    return f"backend/target_execution_contracts/contracts/{package['targetProfile']['id']}_{suffix}_v1.json"


def current_package(row):
    path = row.get("contractPath")
    return json.loads((DOCS / path).read_text()) if path and (DOCS / path).exists() else None


def exact_sources(surface, by_contract_id, by_target_id):
    choices = []
    for order, match in enumerate(surface.get("priorPrinterMatches") or []):
        referenced = by_contract_id.get(match.get("contractId"))
        if not referenced:
            continue
        for package in by_target_id.get(referenced["targetProfile"]["id"], []):
            if package["missionFamily"] == "targetScoring" and not package["targetProfile"]["id"].startswith("qt_printer13_product_"):
                model = package["components"]["scoring"]["definition"].get("model")
                choices.append((MODEL_RANK.get(model, 0), -order, package["contractId"], package))
    if not choices:
        return None
    return max(choices, key=lambda item: item[:3])[3]


def unresolved_question(family):
    questions = {
        "ANATOMY_VITAL_REGIONS": "Which target-specific printed anatomy regions and exact coordinate boundaries are governed for the unresolved QT faces?",
        "BULLSEYE_MULTI_BULL": "Which exact bull/ring coordinate maps and printed values are governed for QT-only bullseye faces?",
        "B_FAMILY_SCORING": "Which QT-only B-family variants have governed ring values and exact registered geometry beyond proven exact surfaces?",
        "COMPETITION_SCORING": "Which exact A/C/D or competition-region boundaries and values apply to the QT-only faces?",
        "DIAGNOSTIC_FEEDBACK": "What are the exact DIAG-L/R sector boundaries and publisher feedback labels for each handedness?",
        "DISCRIMINATION_OBJECTS": "What exact object coordinate map is governed, and which cue/order/score semantics—if any—are published?",
        "EVIDENCE_ONLY": "Is any executable region, object, score, diagnostic, or qualification semantic published beyond evidence and total taps?",
        "HOSTAGE_THREAT_RELATIONSHIPS": "What exact figure boundaries and penalty/no-shoot semantics are governed for each QT composition?",
        "M16_M4_QUALIFICATION": "Which existing M16/M4 contract is an exact face match, and what qualification versus zeroing mode applies?",
        "REPEATED_OBJECT_COUNTING": "What exact per-object coordinate map is governed for each QT-only repeated-object face?",
        "VALUED_REGION_QUALIFICATION": "What exact QT region boundaries, values, and course aggregation are governed for each unresolved qualification face?",
        "ZEROING_SIGHT_IN": "Which QT sight-in faces have an exact governed aim/impact geometry and zeroing contract rather than only visible bulls?",
    }
    return questions[family]


def main():
    non_qt_before = non_qt_snapshot()
    manifest = json.loads(MANIFEST_PATH.read_text())
    prior_sweep = json.loads(SWEEP_PATH.read_text()) if SWEEP_PATH.exists() else {}
    prior_rows = {item["id"]: item for item in prior_sweep.get("rows", [])}
    before_capability_counts = manifest.get("capabilityCountsBeforeSurgicalSweep") or manifest["capabilityCounts"]
    leg2 = json.loads(LEG2_PATH.read_text())
    old_unresolved = json.loads(LEG2_UNRESOLVED_PATH.read_text())
    surfaces = {item["qtCatalogId"]: item for item in leg2["surfaces"]}

    all_packages = []
    for path in CONTRACTS.glob("*.json"):
        package = json.loads(path.read_text())
        if not package["targetProfile"]["id"].startswith("qt_printer13_product_"):
            all_packages.append(package)
    by_contract_id = {package["contractId"]: package for package in all_packages}
    by_target_id = defaultdict(list)
    for package in all_packages:
        by_target_id[package["targetProfile"]["id"]].append(package)

    rows = []
    triage_rows = []
    changed_ordinals = []
    for row in manifest["surfaces"]:
        surface = surfaces[row["qtCatalogId"]]
        ordinal = row["visualStackOrdinal"]
        before = {
            "capability": row["executionCapability"],
            "missionFamily": row["missionFamily"],
            "contractId": row["contractId"],
            "contractPath": row.get("contractPath"),
        }
        existing = current_package(row)
        source = exact_sources(surface, by_contract_id, by_target_id)

        prior_row = prior_rows.get(row["qtCatalogId"])
        if ordinal == 192:
            package = None
            bucket = "A"
            authority = "EXISTING_SCZN3_ZEROING:qualification_m16a2_25m_zero"
            rationale = QT_SPECIFIC_PROVEN[ordinal]
        elif ordinal in QT_SPECIFIC_PROVEN:
            package = elev.make_target_scoring(surface, elev.b_family(surface)) if ordinal == 25 else existing
            bucket = "A"
            authority = "QT_STORED_IMAGE_AUTHORITY:QT_THE13_FINAL_FAMILY_REPAIR"
            rationale = QT_SPECIFIC_PROVEN[ordinal]
        elif source is not None:
            package = base.inherited_scoring_contract({**surface, "_priorScoring": True}, source)
            bucket = "B"
            authority = f"EXACT_PRIOR_SURFACE:{source['contractId']}"
            rationale = "Current Printers 1–12 authority contains an approved executable contract for the exact prior surface identity."
        else:
            package = base.evidence_contract(surface)
            bucket = "C"
            authority = f"FAMILY_RECOGNITION_ONLY:{surface['sczn3BehaviorFamily']}"
            rationale = "SCZN3 knows the behavior family, but stored authority does not bind target-specific executable coordinates/values for this QT face."

        if package is None:
            final_capability = "Zeroing"
            final_path = None
            final_contract_id = "MFAM:qualification_m16a2_25m_zero"
            final_mission = "zeroingCorrection"
            final_result = "zeroCorrectionResult"
            changed = before != {"capability": final_capability, "missionFamily": final_mission, "contractId": final_contract_id, "contractPath": final_path}
        else:
            final_capability = capability(package)
            final_path = contract_path(package)
            final_contract_id = package["contractId"]
            final_mission = package["missionFamily"]
            final_result = package["resultPackageType"]
            changed = existing != package or before != {"capability": final_capability, "missionFamily": final_mission, "contractId": final_contract_id, "contractPath": final_path}
            destination = DOCS / final_path
            destination.write_text(json.dumps(package, indent=2) + "\n")
            old_path = before["contractPath"]
            if old_path and old_path != final_path and (DOCS / old_path).exists():
                (DOCS / old_path).unlink()

        if prior_row is not None:
            changed = prior_row["changed"]
        if ordinal == 25:
            changed = False
        if source is not None and not changed:
            bucket = "A"
            rationale = "The current QT contract already exactly inherits an approved Printers 1–12 surface contract."

        row.update({
            "missionFamily": final_mission,
            "resultPackageType": final_result,
            "executionCapability": final_capability,
            "contractId": final_contract_id,
            "contractPath": final_path,
            "surgicalSweepBucket": bucket,
            "surgicalSweepAuthority": authority,
        })
        rows.append(row)
        if changed:
            changed_ordinals.append(ordinal)
        triage_rows.append({
            "id": row["qtCatalogId"],
            "visualStackOrdinal": ordinal,
            "target": row["productName"],
            "bucket": bucket,
            "finalCapability": final_capability,
            "authorityInheritance": authority,
            "changed": changed,
            "verification": "PENDING",
            "rationale": rationale,
        })

    # Only remove stale QT contract files. Non-QT contracts remain immutable.
    referenced = {str(DOCS / row["contractPath"]) for row in rows if row.get("contractPath")}
    for path in CONTRACTS.glob("qt_printer13_product_*.json"):
        if str(path) not in referenced:
            path.unlink()

    triage_counts = dict(sorted(Counter(item["bucket"] for item in triage_rows).items()))
    capability_counter = Counter(item["finalCapability"] for item in triage_rows)
    for name in ("Scoring", "Zone / Object Counting", "Diagnostic", "Zeroing", "Evidence Only"):
        capability_counter.setdefault(name, 0)
    capability_counts = dict(sorted(capability_counter.items()))
    unresolved_groups = []
    for family in sorted({surfaces[item["id"]]["sczn3BehaviorFamily"] for item in triage_rows if item["bucket"] == "C"}):
        members = [item for item in triage_rows if item["bucket"] == "C" and surfaces[item["id"]]["sczn3BehaviorFamily"] == family]
        unresolved_groups.append({
            "family": family,
            "surfaceCount": len(members),
            "question": unresolved_question(family),
            "chairs": [item["visualStackOrdinal"] for item in members],
        })

    manifest.update({
        "status": "THE13_SURGICAL_CORRECTNESS_SWEEP_PENDING_VERIFICATION",
        "capabilityCountsBeforeSurgicalSweep": before_capability_counts,
        "capabilityCounts": capability_counts,
        "surfaces": rows,
        "surgicalCorrectnessSweep": str(SWEEP_PATH.relative_to(DOCS)),
        "surgicalSweepTriageCounts": triage_counts,
        "surgicalSweepChangedCount": len(changed_ordinals),
    })
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n")

    non_qt_after = non_qt_snapshot()
    if non_qt_before != non_qt_after:
        raise AssertionError("non_qt_contract_mutation_detected")

    sweep = {
        "schemaVersion": "qt-the13-surgical-correctness-sweep-v1",
        "generatedOn": "2026-09-22",
        "status": "BUILT_PENDING_VERIFICATION",
        "scope": {"publisher": "Qualification Targets Inc", "surfaceCount": 254, "webResearch": False, "nonQtPrinters": "READ_ONLY"},
        "triageCounts": triage_counts,
        "changedCount": len(changed_ordinals),
        "changedOrdinals": changed_ordinals,
        "capabilityCountsBefore": before_capability_counts,
        "capabilityCountsAfter": capability_counts,
        "legacyUnresolvedSemanticSetsPreserved": old_unresolved["summary"]["affectedSurfaces"],
        "unresolvedGroups": unresolved_groups,
        "nonQtContractBoundary": {"fileCount": len(non_qt_before), "beforeAggregateSha256": hashlib.sha256(json.dumps(non_qt_before, sort_keys=True).encode()).hexdigest(), "afterAggregateSha256": hashlib.sha256(json.dumps(non_qt_after, sort_keys=True).encode()).hexdigest(), "unchanged": True},
        "crossFamilyObservations": [
            "Exact prior-surface identity is sufficient to inherit approved target-specific geometry and behavior.",
            "Behavior-family recognition alone is not sufficient to invent a QT coordinate map, point value, diagnostic label, or course rule.",
            "Generic family geometry was the dominant cross-family defect; unresolved QT-only faces now fail closed without discarding identity or tap evidence.",
        ],
        "rows": triage_rows,
        "verification": None,
        "lifecycleFailures": [],
        "regressionFailures": [],
    }
    SWEEP_PATH.write_text(json.dumps(sweep, indent=2) + "\n")

    table = ["| ID | Target | A/B/C | Final Capability | Authority/Inheritance | Changed? | PASS/HOLD |", "|---|---|:---:|---|---|:---:|:---:|"]
    for item in triage_rows:
        table.append(f"| {item['id']} | {item['target'].replace('|', '/')} | {item['bucket']} | {item['finalCapability']} | `{item['authorityInheritance']}` | {'Yes' if item['changed'] else 'No'} | PENDING |")
    SWEEP_MD_PATH.write_text(
        "# THE 13 / QT Surgical Correctness Sweep\n\n"
        "Status: **BUILT — verification pending**\n\n"
        f"- A/B/C: **{triage_counts.get('A', 0)} / {triage_counts.get('B', 0)} / {triage_counts.get('C', 0)}**\n"
        f"- Changed: **{len(changed_ordinals)}**\n"
        f"- Capabilities: `{json.dumps(capability_counts, sort_keys=True)}`\n"
        "- Web research: **0**\n"
        "- Non-QT contract mutation: **0**\n\n"
        + "\n".join(table) + "\n",
        encoding="utf-8",
    )

    authority = json.loads(AUTHORITY_PATH.read_text())
    authority.update({
        "schemaVersion": "qt-printer13-leg3-execution-authority-v4",
        "lifecycleStatus": "supported_pending_surgical_sweep_verification",
        "capabilityCountsBeforeSurgicalSweep": manifest["capabilityCountsBeforeSurgicalSweep"],
        "capabilityCounts": capability_counts,
        "surgicalCorrectnessSweep": str(SWEEP_PATH.relative_to(DOCS)),
        "surgicalSweepTriageCounts": triage_counts,
        "surgicalSweepChangedCount": len(changed_ordinals),
        "nonQtMutation": False,
        "webResearchRepeated": False,
    })
    AUTHORITY_PATH.write_text(json.dumps(authority, indent=2) + "\n")
    print(f"QT sweep built: triage={triage_counts} changed={len(changed_ordinals)} capabilities={capability_counts}")


if __name__ == "__main__":
    main()
