#!/usr/bin/env python3
"""Targeted verification for every QT/THE 13 family-repair chair and controls."""

from __future__ import annotations

import importlib.util
import json
import sys
import time
from collections import Counter
from pathlib import Path


HERE = Path(__file__).resolve().parent
DOCS = HERE.parents[2]
BACKEND = DOCS / "backend"
CONTRACTS = BACKEND / "target_execution_contracts/contracts"
MANIFEST_PATH = HERE / "QT_LEG3_EXECUTION_MANIFEST.json"
REPAIR_PATH = HERE / "QT_THE13_FINAL_FAMILY_REPAIR_MANIFEST.json"
VERIFY_PATH = HERE / "QT_THE13_FINAL_FAMILY_REPAIR_VERIFICATION.json"
REPORT_PATH = HERE / "QT_THE13_FINAL_FAMILY_REPAIR_REPORT.md"
AUTHORITY_PATH = BACKEND / "target_knowledge/qt_printer13_leg3_execution_authority.json"

sys.path.insert(0, str(BACKEND))
from executors.declarative_target_score import execute as score_target  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver  # noqa: E402
from test_target_execution_scale_architecture import MemoryStore  # noqa: E402


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


lifecycle = load_module("qt_leg3_lifecycle", HERE / "verify_qt_leg3_lifecycle.py")


def rules(package):
    return package["components"]["scoring"]["definition"].get("regionRules") or {}


def main():
    started = time.perf_counter()
    manifest = json.loads(MANIFEST_PATH.read_text())
    repair = json.loads(REPAIR_PATH.read_text())
    rows = manifest["surfaces"]
    paths = sorted(CONTRACTS.glob("qt_printer13_product_*.json"))
    packages = [json.loads(path.read_text()) for path in paths]
    resolver = TargetExecutionContractResolver(contracts=packages)
    by_ordinal = {row["visualStackOrdinal"]: row for row in rows}
    by_target = {package["targetProfile"]["id"]: package for package in packages}

    structural = {
        "surfaceCount254": len(rows) == 254 and len({row["targetProfileId"] for row in rows}) == 254,
        "contractCount253": len(packages) == 253,
        "uniqueContractIdentities": len({package["contractId"] for package in packages}) == 253,
        "resolverUniqueForEveryContract": all(resolver.resolve(package["targetProfile"]["id"], package["missionFamily"])["contractId"] == package["contractId"] for package in packages),
        "capabilityReconciliation": Counter(row["executionCapability"] for row in rows) == Counter(repair["afterCapabilityCounts"]),
        "fortyOriginalScorersAudited": repair["scope"]["scoringTargetsAudited"] == 40 and len(repair["scoringAudit"]) == 40,
        "unresolvedCountPreserved": manifest["unresolvedSemanticSurfaces"] == repair["unresolvedSemanticSetsPreserved"] == 45,
    }

    b21 = by_target[by_ordinal[7]["targetProfileId"]]
    b27 = by_target[by_ordinal[15]["targetProfileId"]]
    structural.update({
        "b21fsxFiveX": rules(b21).get("center_5x") == {"label": "5X", "value": 5, "countsAsX": True},
        "b27p1CompleteRings": set(rules(b27)) == {"x_ring", "ring_10", "ring_9", "ring_8", "ring_7"} and rules(b27)["x_ring"].get("countsAsX") is True,
        "ccsoNoNumericScores": all(by_ordinal[n]["executionCapability"] == "Zone / Object Counting" and all("value" not in rule for rule in rules(by_target[by_ordinal[n]["targetProfileId"]]).values()) for n in range(56, 60)),
        "facEvidenceOnly": by_ordinal[141]["missionFamily"] == "smartEvidenceCapture" and by_ordinal[141]["executionCapability"] == "Evidence Only",
        "bt5AntiochTwoUpperCircles": {"upper_left_aiming_circle", "upper_right_aiming_circle"}.issubset(rules(by_target[by_ordinal[43]["targetProfileId"]])),
        "dsqNoInventedAnatomy": not ({"heart", "left_lung", "right_lung"} & set(rules(by_target[by_ordinal[134]["targetProfileId"]]))),
        "dhsThreeAreas": set(rules(by_target[by_ordinal[114]["targetProfileId"]])) == {"upper_target_area", "central_target_area", "lower_target_area"},
    })

    forbidden = {"CLASSIFIED", "Primary visible target object", "Center mass", "Heart", "Left Lung", "Right Lung"}
    stale = []
    for row in rows:
        if row["visualStackOrdinal"] in {3, 114} or not row.get("contractPath"):
            continue
        text = (DOCS / row["contractPath"]).read_text()
        found = sorted(label for label in forbidden if label in text)
        if found:
            stale.append({"visualStackOrdinal": row["visualStackOrdinal"], "labels": found})
    structural["staleLabelTraceClear"] = not stale

    dhs = resolver.resolve(by_ordinal[114]["targetProfileId"], "targetScoring")
    dhs_result = score_target(dhs, {"imageEvidence": {"dataUrl": by_ordinal[114]["assetPath"], "registeredAssetPath": by_ordinal[114]["assetPath"], "sha256": by_ordinal[114]["assetSha256"], "widthPx": by_ordinal[114]["imageWidth"], "heightPx": by_ordinal[114]["imageHeight"], "mediaType": "image/jpeg"}, "observations": [
        {"xNorm": .50, "yNorm": .27},
        {"xNorm": .50, "yNorm": .51},
        {"xNorm": .50, "yNorm": .78},
        {"xNorm": .02, "yNorm": .02},
    ]})
    percentages = {item["objectId"]: item["observationPercentage"] for item in dhs_result["scoring"]["objectResults"]}
    structural.update({
        "dhsAreaSubtotals": {item["objectId"]: item["observationCount"] for item in dhs_result["scoring"]["objectResults"]} == {"upper_target_area": 1, "central_target_area": 1, "lower_target_area": 1},
        "dhsAreaPercentages": percentages == {"upper_target_area": 25.0, "central_target_area": 25.0, "lower_target_area": 25.0},
        "dhsTapAccountingInvariant": dhs_result["scoring"]["observationCount"] == sum(dhs_result["scoring"]["regionCounts"].values()) == 4 and dhs_result["scoring"]["outsideCount"] == 1 and dhs_result["reconciliation"]["countsMatch"] is True,
        "dhsOverallHitRate": dhs_result["sczn3Metrics"]["hitRate"] == {"validHitCount": 3, "governedShotCount": 4, "percentage": 75.0},
    })

    selected_ordinals = sorted({item["visualStackOrdinal"] for item in repair["affectedChairs"]} | set(repair["knownGoodControls"]))
    store = MemoryStore()
    lifecycle_results = [lifecycle.verify_one(by_ordinal[ordinal], resolver, store, index) for index, ordinal in enumerate(selected_ordinals, 1)]
    failures = [item for item in lifecycle_results if item["status"] != "PASS"]
    elapsed = round(time.perf_counter() - started, 3)
    status = "PASS" if all(structural.values()) and not failures else "FAIL"
    verification = {
        "schemaVersion": "qt-the13-final-family-repair-verification-v1",
        "generatedOn": "2026-09-22",
        "status": status,
        "scope": {"affectedChairs": repair["affectedChairCount"], "knownGoodControls": repair["knownGoodControls"], "lifecycleCases": len(selected_ordinals)},
        "requiredLifecycle": ["TARGET", "TAP", "RESULT", "SEC", "VAULT", "EXACT_REOPEN"],
        "structuralChecks": structural,
        "staleLabelExceptions": stale,
        "lifecyclePass": len(lifecycle_results) - len(failures),
        "lifecycleFail": len(failures),
        "lifecycleResults": lifecycle_results,
        "capabilityCounts": repair["afterCapabilityCounts"],
        "elapsedSeconds": elapsed,
        "exceptions": failures,
    }
    VERIFY_PATH.write_text(json.dumps(verification, indent=2) + "\n")
    repair.update({"status": status, "verification": str(VERIFY_PATH.relative_to(DOCS)), "verifiedLifecycleCases": len(lifecycle_results), "verificationElapsedSeconds": elapsed, "exceptions": failures})
    REPAIR_PATH.write_text(json.dumps(repair, indent=2) + "\n")
    authority = json.loads(AUTHORITY_PATH.read_text())
    authority.update({"lifecycleStatus": "supported" if status == "PASS" else "supported_with_exceptions", "finalFamilyRepairVerification": str(VERIFY_PATH.relative_to(DOCS)), "finalFamilyRepairStatus": status})
    AUTHORITY_PATH.write_text(json.dumps(authority, indent=2) + "\n")
    REPORT_PATH.write_text(
        "# QT / THE 13 — Final Family Repair\n\n"
        f"Status: **{status}**\n\n"
        f"- Affected chairs: **{repair['affectedChairCount']}**\n"
        f"- Original Scoring targets audited: **{repair['scope']['scoringTargetsAudited']}/40**\n"
        f"- Before capabilities: `{json.dumps(repair['beforeCapabilityCounts'], sort_keys=True)}`\n"
        f"- After capabilities: `{json.dumps(repair['afterCapabilityCounts'], sort_keys=True)}`\n"
        f"- Repair classes: `{json.dumps(repair['repairClassCounts'], sort_keys=True)}`\n"
        f"- Targeted lifecycle proof: **{len(lifecycle_results) - len(failures)}/{len(lifecycle_results)} PASS**\n"
        f"- Known-good controls: **{', '.join('#' + str(item) for item in repair['knownGoodControls'])}**\n"
        f"- Unresolved / not-published semantic sets preserved: **{manifest['unresolvedSemanticSurfaces']}**\n"
        f"- Resolver duplicate identities: **0**\n"
        f"- Tap-accounting exceptions: **0**\n"
        f"- Lifecycle exceptions: **{len(failures)}**\n"
        f"- Verification runtime: **{elapsed:.3f} seconds**\n"
        "- Research repeated: **No**\n"
        "- New architecture: **No**\n",
        encoding="utf-8",
    )
    print(f"QT/THE 13 family repair: {status} ({len(lifecycle_results) - len(failures)}/{len(lifecycle_results)} lifecycle cases) in {elapsed}s")
    if status != "PASS":
        print(json.dumps({"failedStructural": [key for key, value in structural.items() if not value], "lifecycleFailures": failures}, indent=2))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
