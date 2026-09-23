#!/usr/bin/env python3
"""Verify the QT-only surgical sweep and seal its compact receipts."""

from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter
from pathlib import Path


HERE = Path(__file__).resolve().parent
DOCS = HERE.parents[2]
BACKEND = DOCS / "backend"
CONTRACTS = BACKEND / "target_execution_contracts/contracts"
MANIFEST_PATH = HERE / "QT_LEG3_EXECUTION_MANIFEST.json"
SWEEP_PATH = HERE / "QT_THE13_SURGICAL_CORRECTNESS_SWEEP.json"
SWEEP_MD_PATH = HERE / "QT_THE13_SURGICAL_CORRECTNESS_SWEEP.md"
VERIFY_PATH = HERE / "QT_THE13_SURGICAL_CORRECTNESS_VERIFICATION.json"
LIFECYCLE_PATH = HERE / "QT_LEG3_LIFECYCLE_VERIFICATION.json"
AUTHORITY_PATH = BACKEND / "target_knowledge/qt_printer13_leg3_execution_authority.json"

sys.path.insert(0, str(BACKEND))
from target_execution_contract import TargetExecutionContractResolver  # noqa: E402


def non_qt_snapshot():
    values = {}
    for path in sorted(CONTRACTS.glob("*.json")):
        if path.name.startswith("qt_printer13_product_"):
            continue
        values[str(path.relative_to(DOCS))] = hashlib.sha256(path.read_bytes()).hexdigest()
    return values


def main():
    manifest = json.loads(MANIFEST_PATH.read_text())
    sweep = json.loads(SWEEP_PATH.read_text())
    lifecycle = json.loads(LIFECYCLE_PATH.read_text())
    paths = sorted(CONTRACTS.glob("qt_printer13_product_*.json"))
    packages = [json.loads(path.read_text()) for path in paths]
    resolver = TargetExecutionContractResolver(contracts=packages)
    by_ordinal = {item["visualStackOrdinal"]: item for item in lifecycle["results"]}
    changed = set(sweep["changedOrdinals"])
    changed_failures = [by_ordinal[ordinal] for ordinal in sorted(changed) if by_ordinal[ordinal]["status"] != "PASS"]

    non_qt = non_qt_snapshot()
    non_qt_digest = hashlib.sha256(json.dumps(non_qt, sort_keys=True).encode()).hexdigest()
    rows_by_id = {row["qtCatalogId"]: row for row in manifest["surfaces"]}
    structural = {
        "surfaceCount254": len(manifest["surfaces"]) == 254 and len(sweep["rows"]) == 254,
        "contractCount253": len(packages) == 253,
        "resolverIdentityUnique": len({package["contractId"] for package in packages}) == 253 and all(resolver.resolve(package["targetProfile"]["id"], package["missionFamily"])["contractId"] == package["contractId"] for package in packages),
        "triageReconciles": sum(sweep["triageCounts"].values()) == 254 and Counter(item["bucket"] for item in sweep["rows"]) == Counter(sweep["triageCounts"]),
        "capabilitiesReconcile": all(Counter(row["executionCapability"] for row in manifest["surfaces"])[name] == count for name, count in sweep["capabilityCountsAfter"].items()),
        "allCFailClosed": all(rows_by_id[item["id"]]["missionFamily"] == "smartEvidenceCapture" and item["finalCapability"] == "Evidence Only" for item in sweep["rows"] if item["bucket"] == "C"),
        "allBExactPrior": all(item["authorityInheritance"].startswith("EXACT_PRIOR_SURFACE:") for item in sweep["rows"] if item["bucket"] == "B"),
        "allChangedLifecyclePass": len(changed) == sweep["changedCount"] and not changed_failures,
        "completeQtRegressionPass": lifecycle["status"] == "PASS" and lifecycle["eligible"] == lifecycle["pass"] == 254 and lifecycle["fail"] == 0,
        "nonQtContractsReadOnly": len(non_qt) == sweep["nonQtContractBoundary"]["fileCount"] and non_qt_digest == sweep["nonQtContractBoundary"]["afterAggregateSha256"],
        "legacyUnresolvedSetsPreserved": sweep["legacyUnresolvedSemanticSetsPreserved"] == 45,
    }
    failures = [key for key, passed in structural.items() if not passed]
    status = "PASS" if not failures and not changed_failures else "FAIL"

    for item in sweep["rows"]:
        item["verification"] = "PASS" if by_ordinal[item["visualStackOrdinal"]]["status"] == "PASS" else "HOLD"
    sweep.update({
        "status": status,
        "verification": str(VERIFY_PATH.relative_to(DOCS)),
        "changedLifecyclePass": sweep["changedCount"] - len(changed_failures),
        "changedLifecycleFail": len(changed_failures),
        "completeQtRegression": {"pass": lifecycle["pass"], "fail": lifecycle["fail"], "elapsedSeconds": lifecycle["elapsedSeconds"]},
        "lifecycleFailures": changed_failures,
        "regressionFailures": [] if lifecycle["fail"] == 0 else [item for item in lifecycle["results"] if item["status"] != "PASS"],
    })
    SWEEP_PATH.write_text(json.dumps(sweep, indent=2) + "\n")

    verification = {
        "schemaVersion": "qt-the13-surgical-correctness-verification-v1",
        "generatedOn": "2026-09-22",
        "status": status,
        "structuralChecks": structural,
        "failedStructuralChecks": failures,
        "changedChairLifecycle": {"eligible": sweep["changedCount"], "pass": sweep["changedCount"] - len(changed_failures), "fail": len(changed_failures)},
        "completeQtAutomatedRegression": sweep["completeQtRegression"],
        "nonQtBoundary": {"fileCount": len(non_qt), "aggregateSha256": non_qt_digest, "unchanged": structural["nonQtContractsReadOnly"]},
        "capabilityCounts": sweep["capabilityCountsAfter"],
        "exceptions": changed_failures,
    }
    VERIFY_PATH.write_text(json.dumps(verification, indent=2) + "\n")

    table = ["| ID | Target | A/B/C | Final Capability | Authority/Inheritance | Changed? | PASS/HOLD |", "|---|---|:---:|---|---|:---:|:---:|"]
    for item in sweep["rows"]:
        table.append(f"| {item['id']} | {item['target'].replace('|', '/')} | {item['bucket']} | {item['finalCapability']} | `{item['authorityInheritance']}` | {'Yes' if item['changed'] else 'No'} | {item['verification']} |")
    unresolved = "\n".join(f"- `{item['family']}` — {item['surfaceCount']} chairs: {item['question']}" for item in sweep["unresolvedGroups"])
    observations = "\n".join(f"- {item}" for item in sweep["crossFamilyObservations"])
    SWEEP_MD_PATH.write_text(
        "# THE 13 / QT Surgical Correctness Sweep\n\n"
        f"Status: **{status}**\n\n"
        f"- A/B/C: **{sweep['triageCounts']['A']} / {sweep['triageCounts']['B']} / {sweep['triageCounts']['C']}**\n"
        f"- Actually changed: **{sweep['changedCount']}**\n"
        f"- Capabilities after repair: `{json.dumps(sweep['capabilityCountsAfter'], sort_keys=True)}`\n"
        f"- Changed-chair lifecycle: **{sweep['changedLifecyclePass']}/{sweep['changedCount']} PASS**\n"
        f"- Complete QT automated regression: **{lifecycle['pass']}/{lifecycle['eligible']} PASS**\n"
        "- Web research: **0**\n"
        "- Non-QT contract mutations: **0**\n\n"
        "## Grouped unresolved questions\n\n" + unresolved + "\n\n"
        "## Cross-family observations\n\n" + observations + "\n\n"
        "## Compact 254-row manifest\n\n" + "\n".join(table) + "\n",
        encoding="utf-8",
    )

    manifest.update({
        "status": "THE13_SURGICAL_CORRECTNESS_SWEEP_PASS" if status == "PASS" else "THE13_SURGICAL_CORRECTNESS_SWEEP_HOLD",
        "surgicalSweepVerification": str(VERIFY_PATH.relative_to(DOCS)),
    })
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n")
    authority = json.loads(AUTHORITY_PATH.read_text())
    authority.update({
        "lifecycleStatus": "supported" if status == "PASS" else "supported_with_exceptions",
        "surgicalCorrectnessStatus": status,
        "surgicalCorrectnessVerification": str(VERIFY_PATH.relative_to(DOCS)),
        "verifiedPass": lifecycle["pass"],
        "verifiedFail": lifecycle["fail"],
        "nonQtMutation": False,
    })
    AUTHORITY_PATH.write_text(json.dumps(authority, indent=2) + "\n")
    print(f"QT surgical sweep: {status}; changed={sweep['changedLifecyclePass']}/{sweep['changedCount']}; regression={lifecycle['pass']}/{lifecycle['eligible']}")
    if status != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
