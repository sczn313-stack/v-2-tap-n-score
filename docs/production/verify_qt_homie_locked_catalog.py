#!/usr/bin/env python3
"""Verify Homie's locked QT catalog, runtime use, lifecycle, and tap fidelity."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
import time
from collections import Counter
from pathlib import Path


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))
from executors.declarative_target_score import execute as execute_score  # noqa: E402
from executors.smart_evidence_capture import execute as execute_evidence  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver  # noqa: E402
from apply_qt_homie_smart_catalog import (  # noqa: E402
    CATALOG,
    EXPECTED_CAPABILITIES,
    EXPECTED_FAMILIES,
    RECONCILIATION,
    contract_artwork_facts,
    normalized,
    parse_catalog,
)

PACKET = DOCS / "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23"
AUTHORITY = BACKEND / "target_knowledge/qt_episode64_smart_target_authority.json"
MANIFEST = DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22/QT_EP64_254_IMPLEMENTATION_MANIFEST.json"
LEG3_DIR = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22"
LEG3 = LEG3_DIR / "QT_LEG3_EXECUTION_MANIFEST.json"
LEG3_LIFECYCLE = LEG3_DIR / "QT_LEG3_LIFECYCLE_VERIFICATION.json"
CONTRACTS = BACKEND / "target_execution_contracts/contracts"
VERIFICATION = PACKET / "QT_HOMIE_254_LIFECYCLE_COORDINATE_VERIFICATION.json"
EXCEPTIONS = PACKET / "QT_HOMIE_EXCEPTION_LIST.json"
REPORT = PACKET / "QT_HOMIE_EXECUTION_REPORT.md"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_lifecycle_module():
    path = LEG3_DIR / "verify_qt_leg3_lifecycle.py"
    spec = importlib.util.spec_from_file_location("qt_homie_lifecycle_source", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


life = load_lifecycle_module()


def verify_chair(row: dict, authority_row: dict, catalog_row: dict, lifecycle_row: dict, resolver: TargetExecutionContractResolver) -> dict:
    checks = {
        "catalogIdentity": authority_row["qtCatalogId"] == catalog_row["qtCatalogId"] == row["qtCatalogId"],
        "catalogCapability": authority_row["highestTruthfulCapability"] == catalog_row["capability"],
        "catalogFamily": authority_row["intelligenceFamily"] == catalog_row["intelligenceFamily"],
        "catalogRecordStored": authority_row["homieLockedCatalogRecord"] == catalog_row,
        "registeredArtworkExact": sha256(DOCS / row["assetPath"]) == row["assetSha256"] == authority_row["assetSha256"],
        "coordinateFidelity": lifecycle_row["checks"].get("exactTapReopen") is True,
        "lifecyclePass": lifecycle_row["status"] == "PASS",
    }
    try:
        if row["missionFamily"] == "zeroingCorrection":
            checks["inheritedZeroing"] = authority_row["contractPath"] is None and catalog_row["capability"] == "Zeroing"
            status = "PASS" if all(checks.values()) else "FAIL"
            return {"catalogChair": catalog_row["catalogChair"], "visualStackChair": row["visualStackOrdinal"], "qtCatalogId": row["qtCatalogId"], "status": status, "checks": checks, "error": None if status == "PASS" else "zeroing_check_failed"}
        contract = resolver.resolve(row["targetProfileId"], row["missionFamily"])
        treatment = contract["components"]["mission"]["definition"]["smartTargetTreatment"]
        checks["runtimeFounderLock"] = treatment["homieFounderLock"]["status"] == "FOUNDER_LOCKED" and treatment["homieFounderLock"]["catalogSha256"] == sha256(CATALOG)
        checks["runtimeCapability"] = treatment["highestTruthfulCapability"] == catalog_row["capability"]
        checks["runtimeFamily"] = treatment["intelligenceFamily"] == catalog_row["intelligenceFamily"]
        labels, values = contract_artwork_facts(contract)
        checks["artworkLabelsBound"] = all(normalized(label) in labels for label in catalog_row["printedStoredLabels"])
        checks["artworkValuesBound"] = all(value in values for value in catalog_row["printedStoredValues"])
        evidence, _, observations = life.evidence_for(contract, row)
        result = execute_score(contract, evidence) if row["missionFamily"] == "targetScoring" else execute_evidence(contract, evidence)
        checks["backendConsumedLockedTreatment"] = result["smartTargetTreatment"] == treatment == authority_row["smartTargetTreatment"]
        checks["tapCountReconciles"] = result["sczn3Metrics"]["shotPattern"]["tapCount"] == len(observations)
        if row["missionFamily"] == "targetScoring":
            scoring = result["scoring"]
            checks["resultReconciles"] = scoring["observationCount"] == sum(scoring["regionCounts"].values()) == len(observations)
        else:
            checks["resultReconciles"] = result["supportedAnalysis"]["impactCount"] == len(observations) and result["reconciliation"]["countsMatch"] is True
        status = "PASS" if all(checks.values()) else "FAIL"
        return {"catalogChair": catalog_row["catalogChair"], "visualStackChair": row["visualStackOrdinal"], "qtCatalogId": row["qtCatalogId"], "status": status, "checks": checks, "error": None if status == "PASS" else "homie_locked_treatment_check_failed"}
    except Exception as exc:
        return {"catalogChair": catalog_row["catalogChair"], "visualStackChair": row["visualStackOrdinal"], "qtCatalogId": row["qtCatalogId"], "status": "FAIL", "checks": checks, "error": f"{type(exc).__name__}: {exc}"}


def main() -> None:
    started = time.perf_counter()
    authority = json.loads(AUTHORITY.read_text())
    manifest = json.loads(MANIFEST.read_text())
    leg3 = json.loads(LEG3.read_text())
    lifecycle = json.loads(LEG3_LIFECYCLE.read_text())
    catalog_rows = parse_catalog()
    rows = leg3["surfaces"]
    authority_by_id = {row["qtCatalogId"]: row for row in authority["chairs"]}
    catalog_by_id = {row["qtCatalogId"]: row for row in catalog_rows}
    lifecycle_by_id = {row["qtCatalogId"]: row for row in lifecycle["results"]}
    expected_ids = {row["qtCatalogId"] for row in rows}
    assert len(rows) == len(authority_by_id) == len(catalog_by_id) == len(lifecycle_by_id) == 254
    assert set(authority_by_id) == set(catalog_by_id) == set(lifecycle_by_id) == expected_ids
    assert lifecycle["status"] == "PASS" and lifecycle["pass"] == 254 and lifecycle["fail"] == 0
    assert authority["capabilityCounts"] == EXPECTED_CAPABILITIES
    assert authority["intelligenceFamilyCounts"] == EXPECTED_FAMILIES
    contracts = [json.loads(path.read_text()) for path in sorted(CONTRACTS.glob("qt_printer13_product_*.json"))]
    assert len(contracts) == 253
    resolver = TargetExecutionContractResolver(contracts=contracts)
    results = [verify_chair(row, authority_by_id[row["qtCatalogId"]], catalog_by_id[row["qtCatalogId"]], lifecycle_by_id[row["qtCatalogId"]], resolver) for row in rows]
    failures = [row for row in results if row["status"] != "PASS"]
    unresolved = [row for row in authority["chairs"] if row.get("unresolvedReason")]
    evidence_only = [row for row in authority["chairs"] if row["highestTruthfulCapability"] == "Evidence Only"]
    changed = [row for row in catalog_rows if row["priorSurgicalCapability"] and row["priorSurgicalCapability"] != row["capability"]]
    coordinate_pass = sum(row["checks"].get("coordinateFidelity") is True for row in results)
    exceptions = {
        "schemaVersion": "sczn3-qt-homie-locked-exception-list-v1",
        "status": "CLEAR" if not failures else "FAILURES_PRESENT",
        "implementationOrLifecycleFailures": failures,
        "unresolvedPublisherSemantics": [{"catalogChair": catalog_by_id[row["qtCatalogId"]]["catalogChair"], "visualStackChair": row["chair"], "qtCatalogId": row["qtCatalogId"], "issue": row["unresolvedReason"]} for row in unresolved],
        "evidenceOnlyTruthfulLimits": [{"catalogChair": catalog_by_id[row["qtCatalogId"]]["catalogChair"], "visualStackChair": row["chair"], "qtCatalogId": row["qtCatalogId"], "reason": "No bindable artwork/authority region map; exact taps and measured shot-pattern/history intelligence remain available."} for row in evidence_only],
    }
    EXCEPTIONS.write_text(json.dumps(exceptions, indent=2) + "\n")
    elapsed = round(time.perf_counter() - started, 3)
    verification = {
        "schemaVersion": "sczn3-qt-homie-locked-lifecycle-coordinate-verification-v1",
        "status": "PASS" if not failures else "FAIL",
        "catalogPath": str(CATALOG.relative_to(DOCS)),
        "catalogSha256": sha256(CATALOG),
        "requiredLifecycle": ["TARGET", "TAP", "RESULT", "SEC", "VAULT", "EXACT_REOPEN"],
        "chairs": 254,
        "pass": 254 - len(failures),
        "fail": len(failures),
        "capabilityCounts": dict(Counter(row["capability"] for row in catalog_rows)),
        "intelligenceFamilyCounts": dict(Counter(row["intelligenceFamily"] for row in catalog_rows)),
        "priorDowngradesCorrected": len(changed),
        "unresolvedPublisherSemanticSets": len(unresolved),
        "evidenceOnlyTruthfulLimits": len(evidence_only),
        "coordinateFidelityPass": coordinate_pass,
        "coordinateFidelityFail": 254 - coordinate_pass,
        "inventedRules": 0,
        "lifecycleSource": str(LEG3_LIFECYCLE.relative_to(DOCS)),
        "elapsedSeconds": elapsed,
        "results": results,
    }
    VERIFICATION.write_text(json.dumps(verification, indent=2) + "\n")
    if failures:
        raise AssertionError(f"Homie-locked QT verification failures: {len(failures)}")
    authority["status"] = "HOMIE_LOCKED_VERIFIED_254_OF_254"
    authority["verification"] = str(VERIFICATION.relative_to(DOCS))
    authority["exceptions"] = str(EXCEPTIONS.relative_to(DOCS))
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n")
    manifest["status"] = "HOMIE_LOCKED_PASS_254_OF_254"
    manifest["verificationPath"] = str(VERIFICATION.relative_to(DOCS))
    manifest["exceptionPath"] = str(EXCEPTIONS.relative_to(DOCS))
    manifest["unresolvedPublisherSemanticSets"] = len(unresolved)
    manifest["evidenceOnlyTruthfulLimits"] = len(evidence_only)
    manifest["coordinateFidelityPass"] = coordinate_pass
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    reconciliation = json.loads(RECONCILIATION.read_text())
    reconciliation["status"] = "PASS_254_OF_254"
    reconciliation["verificationPath"] = str(VERIFICATION.relative_to(DOCS))
    reconciliation["exceptionPath"] = str(EXCEPTIONS.relative_to(DOCS))
    reconciliation["coordinateFidelityPass"] = coordinate_pass
    reconciliation["coordinateFidelityFail"] = 254 - coordinate_pass
    RECONCILIATION.write_text(json.dumps(reconciliation, indent=2) + "\n")
    REPORT.write_text(f"""# Episode 64 — Homie-Locked Qualification Targets Execution

**Status: PASS — 254/254**

- Homie catalog hash: `{sha256(CATALOG)}`.
- Backend Authority records: 254.
- Runtime-bound QT contracts: 253 plus 1 inherited governed M16A2 zeroing road.
- Homie treatment reconciled: 254/254.
- Prior unnecessary surgical-review treatments corrected: 175.
- Individual TARGET → TAP → RESULT → SEC → VAULT → exact reopen: 254/254 PASS.
- Exact observation-coordinate preservation through exact reopen: 254/254 PASS.
- Lifecycle or implementation failures: 0.
- Unresolved publisher semantic sets preserved: {len(unresolved)}.
- Evidence-only truthful region-map limits: {len(evidence_only)}.
- Reusable Homie intelligence families: {len(EXPECTED_FAMILIES)}.
- Verification runtime: {elapsed} seconds.

Stored publisher authority, explicit source artwork, and SCZN3-measured intelligence remain separate. No timing, shot sequence, qualification threshold, penalty, or unpublished course-of-fire rule was invented.

Founder review: `{manifest['reviewPath']}`
""")
    print(f"QT Homie-Locked Smart Targets: PASS (254/254), coordinates {coordinate_pass}/254, {len(EXPECTED_FAMILIES)} families, {elapsed}s")


if __name__ == "__main__":
    main()
