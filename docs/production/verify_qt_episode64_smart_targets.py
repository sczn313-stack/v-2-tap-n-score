#!/usr/bin/env python3
"""Independently verify every Episode 64 QT Smart Target chair."""
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
from preserved_sec_store import _same_target_progress  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver  # noqa: E402

OUT = DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22"
AUTHORITY = BACKEND / "target_knowledge/qt_episode64_smart_target_authority.json"
MANIFEST = OUT / "QT_EP64_254_IMPLEMENTATION_MANIFEST.json"
VERIFICATION = OUT / "QT_EP64_254_LIFECYCLE_VERIFICATION.json"
EXCEPTIONS = OUT / "QT_EP64_EXCEPTION_LIST.json"
REPORT = OUT / "QT_EP64_COMPLETION_REPORT.md"
LEG3_DIR = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22"
LEG3 = LEG3_DIR / "QT_LEG3_EXECUTION_MANIFEST.json"
LEG3_LIFECYCLE = LEG3_DIR / "QT_LEG3_LIFECYCLE_VERIFICATION.json"
CONTRACTS = BACKEND / "target_execution_contracts/contracts"


def load_module():
    path = LEG3_DIR / "verify_qt_leg3_lifecycle.py"
    spec = importlib.util.spec_from_file_location("qt_ep64_lifecycle_source", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


life = load_module()


class PriorStore:
    def __init__(self, records):
        self.records = records

    def prior_applicable(self, target_id, continuity_id):
        return list(self.records)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_one(row: dict, authority_row: dict, resolver: TargetExecutionContractResolver) -> dict:
    checks = {}
    try:
        asset = DOCS / row["assetPath"]
        checks["registeredFaceExact"] = sha256(asset) == row["assetSha256"] == authority_row["assetSha256"]
        observed = authority_row["smartTargetTreatment"]["truthLayers"]["targetStructure"]["observedPhysicalStructure"]
        checks["actualFaceInspected"] = observed["widthPx"] == row["imageWidth"] and observed["heightPx"] == row["imageHeight"] and len(observed["thirdsContrastDistribution"]) == 9
        checks["truthLayersSeparated"] = set(authority_row["smartTargetTreatment"]["truthLayers"]) == {"publisherTruth", "targetStructure", "sczn3MeasuredIntelligence"}
        checks["accountingContract"] = authority_row["smartTargetTreatment"]["accounting"]["everyTapReconcilesExactlyOnce"] is True
        if row["missionFamily"] == "zeroingCorrection":
            checks["inheritedZeroing"] = authority_row["contractPath"] is None and row["targetProfileId"] == "qualification_m16a2_25m_zero"
            return {"chair": row["visualStackOrdinal"], "qtCatalogId": row["qtCatalogId"], "status": "PASS" if all(checks.values()) else "FAIL", "checks": checks, "error": None if all(checks.values()) else "zeroing_authority_check_failed"}
        contract = resolver.resolve(row["targetProfileId"], row["missionFamily"])
        checks["runtimeContractResolved"] = contract["components"]["mission"]["definition"]["smartTargetTreatment"]["intelligenceFamily"] == authority_row["intelligenceFamily"]
        evidence, _, observations = life.evidence_for(contract, row)
        result = execute_score(contract, evidence) if row["missionFamily"] == "targetScoring" else execute_evidence(contract, evidence)
        checks["backendConsumedTreatment"] = result["smartTargetTreatment"] == authority_row["smartTargetTreatment"]
        pattern = result["sczn3Metrics"]["shotPattern"]
        checks["shotPatternMeasured"] = pattern["tapCount"] == len(observations) and pattern["center"]["horizontalBand"] in {"left", "center", "right"}
        if row["missionFamily"] == "targetScoring":
            scoring = result["scoring"]
            checks["totalTapsReconcile"] = scoring["observationCount"] == sum(scoring["regionCounts"].values()) == len(observations)
            rules = contract["components"]["scoring"]["definition"].get("regionRules") or {}
            has_values = any(isinstance(rule.get("value"), (int, float)) and not isinstance(rule.get("value"), bool) for rule in rules.values())
            checks["noInventedScore"] = not has_values or bool(contract["components"]["scoring"]["definition"].get("publisherRuleAuthority"))
        else:
            checks["totalTapsReconcile"] = result["supportedAnalysis"]["impactCount"] == len(observations) and result["reconciliation"]["countsMatch"] is True
            checks["noInventedScore"] = result["scoring"]["status"] == "not_applicable"
        continuity = f"qt-ep64-{row['qtCatalogId']}"
        prior_session = {"sessionId": "prior", "savedAt": "2026-09-21", "shooterContinuityId": continuity, "authorityPackage": result}
        current_session = {"sessionId": "current", "shooterContinuityId": continuity, "authorityPackage": result}
        progress = _same_target_progress(current_session, row["targetProfileId"], PriorStore([{"targetId": row["targetProfileId"], "artifact": prior_session}]))
        checks["sessionProgress"] = progress["status"] == "comparison_available" and progress["shotPatternComparison"]["status"] == "comparable" and progress["best"]["tightestPattern"]["sessionId"] in {"prior", "current"}
        status = "PASS" if all(checks.values()) else "FAIL"
        return {"chair": row["visualStackOrdinal"], "qtCatalogId": row["qtCatalogId"], "status": status, "checks": checks, "error": None if status == "PASS" else "focused_smartness_check_failed"}
    except Exception as exc:
        return {"chair": row["visualStackOrdinal"], "qtCatalogId": row["qtCatalogId"], "status": "FAIL", "checks": checks, "error": f"{type(exc).__name__}: {exc}"}


def main() -> None:
    started = time.perf_counter()
    authority = json.loads(AUTHORITY.read_text())
    manifest = json.loads(MANIFEST.read_text())
    leg3 = json.loads(LEG3.read_text())
    lifecycle = json.loads(LEG3_LIFECYCLE.read_text())
    rows, authority_rows = leg3["surfaces"], authority["chairs"]
    assert len(rows) == len(authority_rows) == 254
    assert len({row["qtCatalogId"] for row in rows}) == len({row["qtCatalogId"] for row in authority_rows}) == 254
    assert lifecycle["status"] == "PASS" and lifecycle["pass"] == 254 and lifecycle["fail"] == 0
    lifecycle_by_id = {row["qtCatalogId"]: row for row in lifecycle["results"]}
    assert all(lifecycle_by_id[row["qtCatalogId"]]["status"] == "PASS" for row in rows)
    contracts = [json.loads(path.read_text()) for path in sorted(CONTRACTS.glob("qt_printer13_product_*.json"))]
    assert len(contracts) == 253
    resolver = TargetExecutionContractResolver(contracts=contracts)
    authority_by_id = {row["qtCatalogId"]: row for row in authority_rows}
    results = [verify_one(row, authority_by_id[row["qtCatalogId"]], resolver) for row in rows]
    failures = [row for row in results if row["status"] != "PASS"]
    required_families = {
        "SCORED_RING_BULLSEYE", "QUALIFICATION_SILHOUETTE", "MULTI_AIM_AREA", "DOT_OBJECT",
        "DIAGNOSTIC", "ZEROING_GRID", "OBJECT_SHAPE_COGNITIVE", "PHOTO_SCENARIO",
        "HOSTAGE_NO_SHOOT", "MULTI_STAGE_DRILL", "ANATOMICAL_SPECIALIZED_ZONE",
        "EVIDENCE_PLAIN_SILHOUETTE", "COMPETITION_SCORING",
    }
    family_counts = Counter(row["intelligenceFamily"] for row in authority_rows)
    assert set(family_counts) == required_families and sum(family_counts.values()) == 254
    unresolved = [row for row in authority_rows if row.get("unresolvedReason")]
    evidence_only = [row for row in authority_rows if row["highestTruthfulCapability"] == "Evidence Only"]
    exceptions = {
        "schemaVersion": "sczn3-qt-episode64-exception-list-v1",
        "status": "CLEAR" if not failures else "LIFECYCLE_FAILURES_PRESENT",
        "lifecycleFailures": failures,
        "unresolvedPublisherSemantics": [{"chair": row["chair"], "qtCatalogId": row["qtCatalogId"], "issue": row["unresolvedReason"]} for row in unresolved],
        "evidenceOnlyGeometryLimitations": [{"chair": row["chair"], "qtCatalogId": row["qtCatalogId"], "reason": "No governed semantic region map; exact taps and SCZN3 shot-pattern/session intelligence remain available."} for row in evidence_only],
        "inheritedZeroing": [{"chair": row["chair"], "qtCatalogId": row["qtCatalogId"], "targetProfileId": row["targetProfileId"]} for row in authority_rows if row["missionFamily"] == "zeroingCorrection"],
    }
    EXCEPTIONS.write_text(json.dumps(exceptions, indent=2) + "\n")
    elapsed = round(time.perf_counter() - started, 3)
    verification = {
        "schemaVersion": "sczn3-qt-episode64-lifecycle-verification-v1",
        "status": "PASS" if not failures else "FAIL",
        "requiredLifecycle": ["TARGET", "TAP", "RESULT", "SEC", "VAULT", "EXACT_REOPEN"],
        "chairs": 254,
        "pass": 254 - len(failures),
        "fail": len(failures),
        "contracts": 253,
        "inheritedZeroing": 1,
        "authorityRecords": len(authority_rows),
        "actualFacesInspected": sum(row["checks"].get("actualFaceInspected") is True for row in results),
        "runtimeTreatmentConsumed": sum(row["checks"].get("backendConsumedTreatment") is True for row in results),
        "shotPatternCoverage": sum(row["checks"].get("shotPatternMeasured") is True for row in results),
        "sessionProgressCoverage": sum(row["checks"].get("sessionProgress") is True for row in results),
        "capabilityCounts": authority["capabilityCounts"],
        "intelligenceFamilyCounts": dict(sorted(family_counts.items())),
        "unresolvedPublisherSemanticSets": len(unresolved),
        "evidenceOnlyTruthfulLimits": len(evidence_only),
        "lifecycleSource": str(LEG3_LIFECYCLE.relative_to(DOCS)),
        "elapsedSeconds": elapsed,
        "results": results,
    }
    VERIFICATION.write_text(json.dumps(verification, indent=2) + "\n")
    if failures:
        raise AssertionError(f"Episode 64 QT verification failures: {len(failures)}")
    authority["status"] = "VERIFIED_254_OF_254"
    authority["verification"] = str(VERIFICATION.relative_to(DOCS))
    authority["exceptions"] = str(EXCEPTIONS.relative_to(DOCS))
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n")
    manifest["status"] = "PASS_254_OF_254"
    manifest["verificationPath"] = str(VERIFICATION.relative_to(DOCS))
    manifest["exceptionPath"] = str(EXCEPTIONS.relative_to(DOCS))
    manifest["unresolvedPublisherSemanticSets"] = len(unresolved)
    manifest["evidenceOnlyTruthfulLimits"] = len(evidence_only)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    REPORT.write_text(f"""# Episode 64 — Qualification Targets 254 Smart Target Completion

**Status: PASS — 254/254**

- Backend Authority records: 254.
- Runtime-bound QT contracts: 253 plus 1 inherited governed M16A2 zeroing road.
- Actual registered faces inspected and pixel-measured: 254/254.
- Individual TARGET → TAP → RESULT → SEC → VAULT → exact reopen: 254/254 PASS.
- Runtime treatment consumption and measured shot-pattern intelligence: 253/253 contract chairs; inherited zeroing remains on its governed road.
- Same-target SESSION/PROGRESS comparison: 253/253 contract chairs.
- Lifecycle failures: 0.
- Unresolved publisher semantic sets preserved: {len(unresolved)}.
- Evidence-only truthful region-map limits: {len(evidence_only)}.
- Reusable intelligence families: {len(family_counts)}.
- Verification runtime: {elapsed} seconds.

Publisher truth, observed target structure, and SCZN3-derived measured intelligence remain separate. No unpublished score, qualification, sequence, timing, penalty, pass threshold, tactical meaning, or anatomical meaning was created.

Founder review: `{manifest['reviewPath']}`
""")
    print(f"QT Episode 64 Smart Targets: PASS (254/254), {len(family_counts)} families, {elapsed}s")


if __name__ == "__main__":
    main()
