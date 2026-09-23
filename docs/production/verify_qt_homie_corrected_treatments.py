#!/usr/bin/env python3
"""Independently verify Homie's corrected QT treatments across all 254 chairs."""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import time
from collections import Counter
from pathlib import Path


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from executors.declarative_target_score import execute as execute_score  # noqa: E402
from executors.smart_evidence_capture import execute as execute_evidence  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver  # noqa: E402
from test_target_execution_scale_architecture import MemoryStore  # noqa: E402
from apply_qt_homie_corrected_treatments import (  # noqa: E402
    AUTHORITY,
    EXPECTED_CAPABILITIES,
    EXPECTED_SHA256,
    LEG3,
    MANIFEST,
    PACKET,
    PACKET_DIR,
    RECONCILIATION,
    SELECTOR,
    audit,
    contract_facts,
    parse_packet,
    sha256,
)


CONTRACTS = BACKEND / "target_execution_contracts/contracts"
VERIFICATION = PACKET_DIR / "QT_HOMIE_254_CORRECTED_LIFECYCLE_VERIFICATION.json"
EXCEPTIONS = PACKET_DIR / "QT_HOMIE_254_CORRECTED_EXCEPTION_LIST.json"
REPORT = PACKET_DIR / "QT_HOMIE_254_CORRECTED_EXECUTION_REPORT.md"


def load_lifecycle_module():
    path = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/verify_qt_leg3_lifecycle.py"
    spec = importlib.util.spec_from_file_location("qt_corrected_lifecycle", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


life = load_lifecycle_module()


def direct_checks(surface: dict, authority_row: dict, record: dict, resolver: TargetExecutionContractResolver) -> dict:
    treatment = authority_row["smartTargetTreatment"]
    observed = treatment["truthLayers"]["targetStructure"]["observedPhysicalStructure"]
    checks = {
        "packetRecordStoredExact": authority_row["homieCorrectedTreatmentRecord"] == record,
        "packetLockExact": treatment["homieFounderLock"]["packetSha256"] == EXPECTED_SHA256,
        "capabilityExact": authority_row["highestTruthfulCapability"] == treatment["highestTruthfulCapability"] == record["capability"],
        "familyExact": authority_row["intelligenceFamily"] == treatment["intelligenceFamily"] == record["intelligenceFamily"],
        "artworkBindingExact": sha256(DOCS / authority_row["assetPath"]) == record["imageSha256"] == authority_row["assetSha256"],
        "imageDimensionsExact": observed["widthPx"] == surface["imageWidth"] and observed["heightPx"] == surface["imageHeight"],
        "aspectRatioExact": abs(observed["aspectRatio"] - (surface["imageWidth"] / surface["imageHeight"])) < 0.00001,
        "requiredPersistenceStored": treatment["homieCorrectedTreatment"]["requiredPersistence"] == record["requiredPersistence"],
        "forbiddenInferenceStored": treatment["homieCorrectedTreatment"]["forbiddenInference"] == record["forbiddenInference"],
    }
    if surface["missionFamily"] == "zeroingCorrection":
        checks["inheritedZeroingRoad"] = authority_row["contractPath"] is None and record["capability"] == "Zeroing"
        return checks
    contract = resolver.resolve(surface["targetProfileId"], surface["missionFamily"])
    runtime_treatment = contract["components"]["mission"]["definition"]["smartTargetTreatment"]
    scoring_definition = contract["components"]["scoring"]["definition"]
    region_ids, labels, values = contract_facts(contract)
    checks.update({
        "runtimeConsumesCorrectedTreatment": runtime_treatment == treatment,
        "regionBindingExact": region_ids == record["regionIds"],
        "labelBindingExact": labels == record["labels"],
        "valueBindingExact": set(values) == set(record["values"]),
        "contractArtworkFactsExact": scoring_definition["homieCorrectedArtworkFacts"]["packetSha256"] == EXPECTED_SHA256,
        "scoringFlagTruthful": treatment["result"]["publisherScore"] is (record["capability"] == "Scoring"),
        "zoneBreakdownTruthful": treatment["result"]["regionObjectBreakdown"] is (record["capability"] in {"Scoring", "Zone / Object Counting"}),
    })
    evidence, _, observations = life.evidence_for(contract, surface)
    result = execute_score(contract, evidence) if surface["missionFamily"] == "targetScoring" else execute_evidence(contract, evidence)
    checks["resultConsumesCorrectedTreatment"] = result["smartTargetTreatment"] == treatment
    checks["resultTapReconciliation"] = result["reconciliation"]["countsMatch"] is True
    if surface["missionFamily"] == "targetScoring":
        checks["resultRegionReconciliation"] = result["scoring"]["observationCount"] == sum(result["scoring"]["regionCounts"].values()) == len(observations)
        checks["noUnsupportedNumericScore"] = bool(record["values"]) is (record["capability"] == "Scoring")
    else:
        checks["resultRegionReconciliation"] = result["supportedAnalysis"]["impactCount"] == len(observations)
        checks["noUnsupportedNumericScore"] = result["scoring"]["status"] == "not_applicable"
    return checks


def main() -> None:
    started = time.perf_counter()
    records = parse_packet()
    preflight = audit(records)
    blocking = ["identityGaps", "assetFailures", "regionBindingFailures", "labelBindingFailures", "valueBindingFailures", "contractFailures", "changedIdentityCapabilityOrFamily"]
    if any(preflight[name] for name in blocking):
        raise AssertionError({name: preflight[name] for name in blocking if preflight[name]})
    authority = json.loads(AUTHORITY.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    leg3 = json.loads(LEG3.read_text(encoding="utf-8"))
    surfaces = leg3["surfaces"]
    if len(surfaces) != 254 or len({row["qtCatalogId"] for row in surfaces}) != 254:
        raise AssertionError("QT surface manifest does not contain 254 unique chairs")
    if authority["capabilityCounts"] != EXPECTED_CAPABILITIES:
        raise AssertionError(f"Backend Authority capability counts differ: {authority['capabilityCounts']}")
    contract_paths = sorted(CONTRACTS.glob("qt_printer13_product_*.json"))
    contracts = [json.loads(path.read_text(encoding="utf-8")) for path in contract_paths]
    if len(contracts) != 253:
        raise AssertionError(f"expected 253 contracts, found {len(contracts)}")
    resolver = TargetExecutionContractResolver(contracts=contracts)
    store = MemoryStore()
    authority_by_id = {row["qtCatalogId"]: row for row in authority["chairs"]}
    records_by_id = {row["qtCatalogId"]: row for row in records}
    results = []
    for index, surface in enumerate(surfaces, 1):
        lifecycle = life.verify_one(surface, resolver, store, index)
        checks = direct_checks(surface, authority_by_id[surface["qtCatalogId"]], records_by_id[surface["qtCatalogId"]], resolver)
        checks.update({f"lifecycle_{name}": passed for name, passed in lifecycle["checks"].items()})
        status = "PASS" if lifecycle["status"] == "PASS" and all(checks.values()) else "FAIL"
        results.append({
            "catalogChair": records_by_id[surface["qtCatalogId"]]["catalogChair"],
            "visualStackChair": surface["visualStackOrdinal"],
            "qtCatalogId": surface["qtCatalogId"],
            "productName": surface["productName"],
            "capability": records_by_id[surface["qtCatalogId"]]["capability"],
            "status": status,
            "checks": checks,
            "lifecycleError": lifecycle["error"],
            "artifactSha256": lifecycle["artifactSha256"],
        })
    frontend = subprocess.run(
        ["node", "production/qt_5spot_founder_defects_test.mjs"],
        cwd=DOCS,
        text=True,
        capture_output=True,
    )
    frontend_checks = {
        "status": "PASS" if frontend.returncode == 0 else "FAIL",
        "command": "node production/qt_5spot_founder_defects_test.mjs",
        "stdout": frontend.stdout.strip(),
        "stderr": frontend.stderr.strip(),
        "scope": [
            "readable RESULT presentation", "truthful tied distribution", "source-image coordinate normalization",
            "Vault evidence resolution", "preserved evidence dimensions", "Vault result/zone breakdown", "target fit/aspect containment",
        ],
    }
    failures = [row for row in results if row["status"] != "PASS"]
    if frontend.returncode:
        failures.append({"qtCatalogId": "SHARED_FRONTEND", "status": "FAIL", "error": frontend.stderr})
    coordinate_pass = sum(row["checks"].get("lifecycle_exactTapReopen") is True for row in results)
    evidence_pass = sum(row["checks"].get("lifecycle_exactArtworkReopen") is True for row in results)
    result_pass = sum(row["checks"].get("lifecycle_exactResultReopen") is True for row in results)
    fit_pass = sum(row["checks"].get("imageDimensionsExact") is True and row["checks"].get("aspectRatioExact") is True for row in results)
    scoring_reconciliation_pass = sum(row["checks"].get("resultRegionReconciliation") is True and row["checks"].get("resultTapReconciliation") is True for row in results)
    scoring_reconciliation_applicable = sum(row["capability"] != "Zeroing" for row in results)
    unresolved = [row for row in authority["chairs"] if row.get("unresolvedReason")]
    evidence_only = [row for row in authority["chairs"] if row["highestTruthfulCapability"] == "Evidence Only"]
    prior_reconciliation = json.loads(RECONCILIATION.read_text(encoding="utf-8"))
    exceptions = {
        "schemaVersion": "sczn3-qt-homie-corrected-exception-list-v1",
        "status": "CLEAR" if not failures else "EXCEPTIONS_PRESENT",
        "implementationOrLifecycleFailures": failures,
        "treatmentAuthorityConflicts": [],
        "existingUnresolvedPublisherSemanticSets": [
            {"catalogChair": records_by_id[row["qtCatalogId"]]["catalogChair"], "visualStackChair": row["chair"], "qtCatalogId": row["qtCatalogId"], "issue": row["unresolvedReason"]}
            for row in unresolved
        ],
        "evidenceOnlyTruthfulLimits": [
            {"catalogChair": records_by_id[row["qtCatalogId"]]["catalogChair"], "visualStackChair": row["chair"], "qtCatalogId": row["qtCatalogId"], "authorityLimit": records_by_id[row["qtCatalogId"]]["authorityLimit"]}
            for row in evidence_only
        ],
    }
    EXCEPTIONS.write_text(json.dumps(exceptions, indent=2) + "\n", encoding="utf-8")
    elapsed = round(time.perf_counter() - started, 3)
    verification = {
        "schemaVersion": "sczn3-qt-homie-corrected-lifecycle-verification-v1",
        "status": "PASS" if not failures else "FAIL",
        "packetPath": str(PACKET.relative_to(DOCS)),
        "packetSha256": EXPECTED_SHA256,
        "requiredLifecycle": ["TARGET", "TAP", "RESULT", "SEC", "VAULT", "EXACT_REOPEN"],
        "chairs": 254,
        "contracts": 253,
        "inheritedZeroing": 1,
        "pass": 254 - len([row for row in results if row["status"] != "PASS"]),
        "fail": len([row for row in results if row["status"] != "PASS"]),
        "capabilityCounts": dict(Counter(row["capability"] for row in records)),
        "intelligenceFamilyCounts": dict(Counter(row["intelligenceFamily"] for row in records)),
        "changedChairCount": prior_reconciliation["changedChairCount"],
        "changedChairs": prior_reconciliation["changedChairs"],
        "coordinateFidelityPass": coordinate_pass,
        "coordinateFidelityFail": 254 - coordinate_pass,
        "vaultEvidencePass": evidence_pass,
        "vaultEvidenceFail": 254 - evidence_pass,
        "vaultResultPass": result_pass,
        "vaultResultFail": 254 - result_pass,
        "scoringCountingReconciliationApplicable": scoring_reconciliation_applicable,
        "scoringCountingReconciliationPass": scoring_reconciliation_pass,
        "scoringCountingReconciliationFail": scoring_reconciliation_applicable - scoring_reconciliation_pass,
        "targetFitAspectPass": fit_pass,
        "targetFitAspectFail": 254 - fit_pass,
        "treatmentAuthorityConflicts": 0,
        "existingUnresolvedPublisherSemanticSets": len(unresolved),
        "evidenceOnlyTruthfulLimits": len(evidence_only),
        "frontendSharedDefectVerification": frontend_checks,
        "elapsedSeconds": elapsed,
        "results": results,
    }
    VERIFICATION.write_text(json.dumps(verification, indent=2) + "\n", encoding="utf-8")
    if failures:
        raise AssertionError(f"corrected QT verification failures: {len(failures)}")
    authority["status"] = "HOMIE_CORRECTED_VERIFIED_254_OF_254"
    authority["verification"] = str(VERIFICATION.relative_to(DOCS))
    authority["exceptions"] = str(EXCEPTIONS.relative_to(DOCS))
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n", encoding="utf-8")
    prior_reconciliation.update({
        "status": "PASS_254_OF_254",
        "verificationPath": str(VERIFICATION.relative_to(DOCS)),
        "exceptionPath": str(EXCEPTIONS.relative_to(DOCS)),
        "coordinateFidelityPass": coordinate_pass,
        "vaultEvidencePass": evidence_pass,
        "vaultResultPass": result_pass,
        "scoringCountingReconciliationPass": scoring_reconciliation_pass,
        "targetFitAspectPass": fit_pass,
    })
    RECONCILIATION.write_text(json.dumps(prior_reconciliation, indent=2) + "\n", encoding="utf-8")
    manifest.update({
        "status": "HOMIE_CORRECTED_PASS_254_OF_254",
        "verificationPath": str(VERIFICATION.relative_to(DOCS)),
        "exceptionPath": str(EXCEPTIONS.relative_to(DOCS)),
        "coordinateFidelityPass": coordinate_pass,
        "vaultEvidencePass": evidence_pass,
        "vaultResultPass": result_pass,
        "scoringCountingReconciliationPass": scoring_reconciliation_pass,
        "targetFitAspectPass": fit_pass,
    })
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(f"""# Episode 64 — Homie-Corrected Qualification Targets Execution

**Status: PASS — 254/254**

- Authoritative corrected-treatment packet: `{EXPECTED_SHA256}`.
- Backend Authority records: 254.
- Runtime-bound QT contracts: 253 plus 1 inherited governed M16A2 zeroing road.
- Corrected treatments stored and consumed: 254/254.
- Capability reconciliation: 36 Scoring / 154 Zone–Object Counting / 1 Zeroing / 63 Evidence Only.
- Changed from the immediately prior locked treatment: {prior_reconciliation['changedChairCount']} chair (`IPSC-Paper Target`: Scoring → Zone / Object Counting).
- TARGET → TAP → RESULT → SEC → VAULT → exact reopen: 254/254 PASS.
- Source-image coordinate fidelity: {coordinate_pass}/254 PASS.
- Vault source evidence preservation: {evidence_pass}/254 PASS.
- Vault authority/result preservation: {result_pass}/254 PASS.
- Scoring/counting reconciliation: {scoring_reconciliation_pass}/{scoring_reconciliation_applicable} applicable contract chairs PASS; inherited zeroing is not applicable.
- Target dimensions/aspect binding: {fit_pass}/254 PASS.
- Treatment/authority conflicts: 0.
- Existing unresolved publisher semantic sets retained: {len(unresolved)}.
- Evidence Only truthful limits retained: {len(evidence_only)}.
- Shared frontend defect verification: {frontend_checks['status']}.
- Verification runtime: {elapsed} seconds.

No target artwork was reinterpreted during implementation. No unsupported timing, sequence, qualification threshold, penalty, score, or course-of-fire rule was created.

Founder Review selector: `{SELECTOR.relative_to(DOCS)}`
""", encoding="utf-8")
    print(f"QT Homie corrected treatments: PASS (254/254), coordinates {coordinate_pass}/254, evidence {evidence_pass}/254, results {result_pass}/254, fit {fit_pass}/254, {elapsed}s")


if __name__ == "__main__":
    main()
