#!/usr/bin/env python3
"""Repair the shared QT/THE 13 family defects exposed by Founder N/N.

This pass uses only the preserved Leg Two authority, registered QT artwork, and
existing SCZN3 contracts.  It intentionally fails closed where the earlier
capability elevation promoted recognition into unsupported target semantics.
"""

from __future__ import annotations

import importlib.util
import json
from collections import Counter
from copy import deepcopy
from pathlib import Path


HERE = Path(__file__).resolve().parent
DOCS = HERE.parents[2]
CONTRACTS = DOCS / "backend/target_execution_contracts/contracts"
LEG2_PATH = HERE.parent / "qt-printer13-leg2-recognition-compression-delta-2026-09-22/QT_LEG2_FAMILY_COMPRESSION_MANIFEST.json"
MANIFEST_PATH = HERE / "QT_LEG3_EXECUTION_MANIFEST.json"
AUTHORITY_PATH = DOCS / "backend/target_knowledge/qt_printer13_leg3_execution_authority.json"
REPAIR_PATH = HERE / "QT_THE13_FINAL_FAMILY_REPAIR_MANIFEST.json"
REPORT_PATH = HERE / "QT_THE13_FINAL_FAMILY_REPAIR_REPORT.md"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


base = load_module("qt_leg3_base", HERE / "build_qt_leg3_execution.py")
elev = load_module("qt_leg3_elevation", HERE / "elevate_qt_capabilities.py")


def circle(region_id, cx, cy, radius, priority, *, object_id=None):
    value = {"regionId": region_id, "shape": "circle", "cx": cx, "cy": cy, "radius": radius, "priority": priority}
    if object_id:
        value["objectId"] = object_id
    return value


def ellipse(region_id, cx, cy, rx, ry, priority, *, object_id=None):
    value = {"regionId": region_id, "shape": "ellipse", "cx": cx, "cy": cy, "radiusX": rx, "radiusY": ry, "priority": priority}
    if object_id:
        value["objectId"] = object_id
    return value


def rectangle(region_id, x0, y0, x1, y1, priority, *, object_id=None):
    value = {"regionId": region_id, "shape": "rectangle", "xMin": x0, "yMin": y0, "xMax": x1, "yMax": y1, "priority": priority}
    if object_id:
        value["objectId"] = object_id
    return value


def named(regions, labels, truth):
    return elev.named(regions, labels, truth)


def b21fsx():
    regions = [ellipse("center_5x", 0.50, 0.463, 0.10, 0.078, 100)]
    rules = {"center_5x": {"label": "5X", "value": 5, "countsAsX": True}}
    return elev.numeric(regions, rules, "The printed center is governed as 5X; all other printed codes remain unscored because their point semantics are not published.", "mixed_regions")


def b27p1():
    regions = [
        ellipse("x_ring", .50, .535, .063, .056, 110),
        ellipse("ring_10", .50, .535, .102, .105, 100),
        ellipse("ring_9", .50, .535, .172, .174, 90),
        ellipse("ring_8", .50, .535, .248, .245, 80),
        ellipse("ring_7", .50, .535, .350, .315, 70),
    ]
    rules = {
        "x_ring": {"label": "X", "value": 10, "countsAsX": True},
        "ring_10": {"label": "10", "value": 10},
        "ring_9": {"label": "9", "value": 9},
        "ring_8": {"label": "8", "value": 8},
        "ring_7": {"label": "7", "value": 7},
    }
    return elev.numeric(regions, rules, "The stored B-27 family authority governs X/10/9/8/7; geometry is registered to the B-27-P1 printed rings.")


def ccso(surface):
    ordinal = surface["visualStackOrdinal"]
    regions = []
    labels = {}
    if ordinal != 56:
        regions.append(ellipse("upper_outlined_zone", .50, .20, .115, .115, 90, object_id="upper_outlined_zone"))
        labels["upper_outlined_zone"] = "Upper outlined zone"
    regions.extend([
        ellipse("central_outlined_zone", .50, .49, .11, .12, 80, object_id="central_outlined_zone"),
        ellipse("outer_outlined_zone", .50, .53, .29, .40, 30, object_id="outer_outlined_zone"),
    ])
    labels.update({"central_outlined_zone": "Central outlined zone", "outer_outlined_zone": "Outer outlined zone"})
    return named(regions, labels, "The registered artwork governs independently visible outlined regions; no printed or stored numeric point values are claimed.")


def neutral_qualification():
    regions = [
        circle("upper_governed_region", .50, .18, .08, 80, object_id="upper_governed_region"),
        rectangle("central_governed_region", .40, .34, .60, .57, 70, object_id="central_governed_region"),
        rectangle("lower_governed_region", .41, .68, .59, .82, 60, object_id="lower_governed_region"),
        ellipse("remaining_target_area", .50, .52, .29, .43, 20, object_id="remaining_target_area"),
    ]
    labels = {
        "upper_governed_region": "Upper governed region",
        "central_governed_region": "Central governed region",
        "lower_governed_region": "Lower governed region",
        "remaining_target_area": "Remaining governed target area",
    }
    return named(regions, labels, "Leg Two governs independently meaningful qualification regions; labels remain neutral because target-specific anatomy, values, and course semantics are not published.")


def bt5_antioch():
    regions = [
        circle("upper_left_aiming_circle", .145, .225, .105, 100, object_id="upper_left_aiming_circle"),
        circle("upper_right_aiming_circle", .845, .225, .105, 100, object_id="upper_right_aiming_circle"),
        ellipse("central_inner_outline", .50, .49, .105, .13, 90, object_id="central_inner_outline"),
        ellipse("central_outer_outline", .50, .55, .27, .37, 40, object_id="central_outer_outline"),
    ]
    labels = {
        "upper_left_aiming_circle": "Upper left aiming circle",
        "upper_right_aiming_circle": "Upper right aiming circle",
        "central_inner_outline": "Central inner outline",
        "central_outer_outline": "Central outer outline",
    }
    return named(regions, labels, "The registered BT-5 Antioch artwork governs two upper circular aiming regions and two central outlined regions; no unpublished values are assigned.")


def dsq_alt2():
    regions = [
        circle("numbered_object_1", .18, .15, .055, 110, object_id="numbered_object_1"),
        circle("numbered_object_2", .82, .15, .055, 110, object_id="numbered_object_2"),
        circle("numbered_object_3", .18, .88, .055, 110, object_id="numbered_object_3"),
        circle("numbered_object_4", .82, .88, .055, 110, object_id="numbered_object_4"),
        ellipse("upper_outlined_region", .50, .20, .12, .10, 90, object_id="upper_outlined_region"),
        ellipse("central_outlined_region", .50, .46, .16, .17, 80, object_id="central_outlined_region"),
        ellipse("lower_outlined_region", .50, .71, .20, .20, 70, object_id="lower_outlined_region"),
        ellipse("outer_figure_region", .50, .51, .29, .42, 20, object_id="outer_figure_region"),
    ]
    labels = {f"numbered_object_{n}": f"Printed object {n}" for n in range(1, 5)}
    labels.update({
        "upper_outlined_region": "Upper outlined region",
        "central_outlined_region": "Central outlined region",
        "lower_outlined_region": "Lower outlined region",
        "outer_figure_region": "Outer figure region",
    })
    return named(regions, labels, "The registered DSQ Alt 2 artwork governs four numbered peripheral objects and outlined figure regions; no anatomy or unpublished values are inferred.")


def dhs_sqt():
    regions = [
        ellipse("upper_target_area", .50, .27, .20, .15, 90, object_id="upper_target_area"),
        circle("central_target_area", .50, .51, .15, 80, object_id="central_target_area"),
        rectangle("lower_target_area", .31, .66, .69, .89, 70, object_id="lower_target_area"),
    ]
    labels = {
        "upper_target_area": "Upper target area",
        "central_target_area": "Central circular target area",
        "lower_target_area": "Lower target area",
    }
    return named(regions, labels, "The registered DHS-SQT artwork governs three independently meaningful target areas; point values and course administration are not published.")


def contract_path(package):
    suffix = "target_scoring" if package["missionFamily"] == "targetScoring" else "smart_evidence"
    return f"backend/target_execution_contracts/contracts/{package['targetProfile']['id']}_{suffix}_v1.json"


def write_contract(surface, package, old_path):
    relative = contract_path(package)
    destination = DOCS / relative
    destination.write_text(json.dumps(package, indent=2) + "\n")
    if old_path and old_path != relative:
        stale = DOCS / old_path
        if stale.exists():
            stale.unlink()
    return relative


def main():
    manifest = json.loads(MANIFEST_PATH.read_text())
    leg2 = json.loads(LEG2_PATH.read_text())
    surfaces = {item["qtCatalogId"]: item for item in leg2["surfaces"]}
    prior_repair = json.loads(REPAIR_PATH.read_text()) if REPAIR_PATH.exists() else {}
    original_rows = {item["qtCatalogId"]: item["before"] for item in prior_repair.get("affectedChairs", [])}
    before_counts = dict(manifest.get("capabilityCountsBeforeFamilyRepair") or manifest["capabilityCounts"])
    original_scoring_ordinals = {
        row["visualStackOrdinal"] for row in manifest["surfaces"] if row["executionCapability"] == "Scoring"
    } | {56, 57, 58, 59, 245, 246}
    repair_rows = []
    scoring_audit = []

    for row in manifest["surfaces"]:
        surface = surfaces[row["qtCatalogId"]]
        ordinal = row["visualStackOrdinal"]
        before = original_rows.get(row["qtCatalogId"], {key: row.get(key) for key in ("executionCapability", "missionFamily", "resultPackageType", "contractId", "contractPath")})
        repair_class = None
        package = None

        if ordinal in original_scoring_ordinals:
            scoring_audit.append({"visualStackOrdinal": ordinal, "productName": row["productName"], "result": "retained"})
        if ordinal == 7:
            package = elev.make_target_scoring(surface, b21fsx())
            repair_class = "scoring_geometry"
        elif ordinal == 15:
            package = elev.make_target_scoring(surface, b27p1())
            repair_class = "scoring_geometry"
        elif 56 <= ordinal <= 59:
            package = elev.make_target_scoring(surface, ccso(surface))
            repair_class = "unsupported_generic_score_removed"
            scoring_audit[-1]["result"] = "downgraded_to_zone_object_counting"
        elif ordinal in {245, 246}:
            package = elev.make_target_scoring(surface, elev.sqt(surface))
            repair_class = "scoring_control_retained"
        elif ordinal == 43:
            package = elev.make_target_scoring(surface, bt5_antioch())
            repair_class = "governed_region_truth"
        elif ordinal == 114:
            package = elev.make_target_scoring(surface, dhs_sqt())
            repair_class = "richer_zone_object_counting"
        elif ordinal == 134:
            package = elev.make_target_scoring(surface, dsq_alt2())
            repair_class = "stale_anatomy_removed"
        elif surface["sczn3BehaviorFamily"] == "VALUED_REGION_QUALIFICATION":
            package = elev.make_target_scoring(surface, neutral_qualification())
            repair_class = "unsupported_generic_semantic_labels_neutralized"
        elif surface["sczn3BehaviorFamily"] == "EVIDENCE_ONLY" and row["executionCapability"] != "Scoring":
            package = base.evidence_contract(surface)
            repair_class = "unsupported_primary_object_removed_fail_closed"

        if package is None:
            continue
        relative = write_contract(surface, package, row.get("contractPath"))
        row.update({
            "missionFamily": package["missionFamily"],
            "resultPackageType": package["resultPackageType"],
            "executionCapability": "Scoring" if package["missionFamily"] == "targetScoring" and package["components"]["scoring"]["definition"].get("model") in {"numeric_regions", "mixed_regions"} else ("Evidence Only" if package["missionFamily"] == "smartEvidenceCapture" else "Zone / Object Counting"),
            "contractId": package["contractId"],
            "contractPath": relative,
        })
        after = {key: row.get(key) for key in before}
        repair_rows.append({
            "visualStackOrdinal": ordinal,
            "qtCatalogId": row["qtCatalogId"],
            "productName": row["productName"],
            "behaviorFamily": row["behaviorFamily"],
            "repairClass": repair_class,
            "before": before,
            "after": after,
        })

    after_counts = dict(sorted(Counter(row["executionCapability"] for row in manifest["surfaces"]).items()))
    manifest.update({
        "status": "THE13_FINAL_FAMILY_REPAIR_PENDING_VERIFICATION",
        "capabilityCountsBeforeFamilyRepair": before_counts,
        "capabilityCounts": after_counts,
        "finalFamilyRepairManifest": str(REPAIR_PATH.relative_to(DOCS)),
        "finalFamilyRepairAffectedChairCount": len(repair_rows),
    })
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n")

    repair_counts = dict(sorted(Counter(item["repairClass"] for item in repair_rows).items()))
    payload = {
        "schemaVersion": "qt-the13-final-family-repair-v1",
        "generatedOn": "2026-09-22",
        "status": "BUILT_PENDING_TARGETED_VERIFICATION",
        "scope": {"surfaceCount": 254, "scoringTargetsAudited": len(scoring_audit)},
        "authorityBoundary": {
            "newResearch": False,
            "newArchitecture": False,
            "targetSpecificSemanticInference": False,
            "rule": "Retain only stored authority or governed printed structure; otherwise fail closed without inventing labels, values, or course rules.",
        },
        "beforeCapabilityCounts": before_counts,
        "afterCapabilityCounts": after_counts,
        "affectedChairCount": len(repair_rows),
        "repairClassCounts": repair_counts,
        "scoringAudit": scoring_audit,
        "affectedChairs": repair_rows,
        "knownGoodControls": [25, 182, 192],
        "unresolvedSemanticSetsPreserved": manifest["unresolvedSemanticSurfaces"],
        "exceptions": [],
    }
    REPAIR_PATH.write_text(json.dumps(payload, indent=2) + "\n")

    authority = json.loads(AUTHORITY_PATH.read_text())
    authority.update({
        "schemaVersion": "qt-printer13-leg3-execution-authority-v3",
        "lifecycleStatus": "supported_pending_the13_family_repair_verification",
        "capabilityCountsBeforeFamilyRepair": before_counts,
        "capabilityCounts": after_counts,
        "finalFamilyRepairManifest": str(REPAIR_PATH.relative_to(DOCS)),
        "finalFamilyRepairAffectedChairCount": len(repair_rows),
    })
    AUTHORITY_PATH.write_text(json.dumps(authority, indent=2) + "\n")

    REPORT_PATH.write_text(
        "# QT / THE 13 — Final Family Repair\n\n"
        f"- Affected chairs: **{len(repair_rows)}**\n"
        f"- Scoring targets audited: **{len(scoring_audit)}/40**\n"
        f"- Before capabilities: `{json.dumps(before_counts, sort_keys=True)}`\n"
        f"- After capabilities: `{json.dumps(after_counts, sort_keys=True)}`\n"
        f"- Repair classes: `{json.dumps(repair_counts, sort_keys=True)}`\n"
        f"- Unresolved / not-published semantic sets preserved: **{manifest['unresolvedSemanticSurfaces']}**\n"
        "- Research repeated: **No**\n"
        "- New architecture: **No**\n"
        "- Verification: **Pending targeted regression**\n"
    )
    print(f"family repair built: affected={len(repair_rows)} before={before_counts} after={after_counts}")


if __name__ == "__main__":
    main()
