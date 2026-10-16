#!/usr/bin/env python3
"""Move Master #407 out of active acceptance without deleting its authority."""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
POPULATION = ROOT / "docs/backend/registries/episode64_platform_population_registry.json"
FOUNDER = ROOT / "docs/backend/registries/episode64_platform_founder_acceptance_registry.json"
EVIDENCE = ROOT / (
    "docs/authority-evidence/platform/episode67-master407-founder-oos-2026-10-16/"
    "SCZN3_EP67_FOUNDER_OOS_MASTER407_ATC200.json"
)
MASTER = Path("/Users/ronnieseay/Downloads/SCZN3_Master_1527_QT_Founder_Approved_2026-10-16.xlsx")
MASTER_SHA256 = "101cb96d6b65a5f94cd0a074a7d962856a47bccc01cae8f5d032a1829aa418e2"
MASTER_NUMBER = 407
FACE_KEY = "THE13-MASTER-0407"
FACE_SHA256 = "53202446b635012c7a4f509e7bbc0fb5cef10a42aa5d1c9a531f1f763d070a52"
REASON = "UGO physical scoring-boundary authority remains unverified."
RUNTIME_IDS = [
    "american_target_58_q1000_uspa_ipsc",
    "american_target_58_q100_uspa_ipsc",
    "american_target_58_q500_uspa_ipsc",
]
CONTRACTS = [
    ROOT / "docs/backend/target_execution_contracts/contracts/american_target_58_q100_uspa_ipsc_target_scoring_v1.json",
    ROOT / "docs/backend/target_execution_contracts/contracts/american_target_58_q500_uspa_ipsc_target_scoring_v1.json",
    ROOT / "docs/backend/target_execution_contracts/contracts/american_target_58_q1000_uspa_ipsc_target_scoring_v1.json",
]
ARTWORK = ROOT / "docs/authority-evidence/platform/scale-batch-1-2026-09-08/representations/american-target-58-Q100.jpg"
EP67_REPORT = ROOT / (
    "CHECKPOINTS/SCZN3_EP67_FINAL_CLOSURE_2026-10-16/evidence/"
    "MASTER407_UGO_PHYSICAL_MEASUREMENT_REPORT.md"
)


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def find_master(records: list[dict]) -> dict:
    matches = [row for row in records if row.get("masterNumber") == MASTER_NUMBER]
    if len(matches) != 1:
        raise RuntimeError(f"Master #407 must resolve exactly once, found {len(matches)}")
    row = matches[0]
    if row.get("censusFaceKey") != FACE_KEY or row.get("canonicalFaceId") != FACE_SHA256:
        raise RuntimeError("Master #407 identity mismatch")
    if sorted(row.get("runtimeIds", [])) != sorted(RUNTIME_IDS):
        raise RuntimeError("Master #407 runtime identity mismatch")
    return row


def main() -> None:
    if not MASTER.is_file() or digest(MASTER) != MASTER_SHA256:
        raise RuntimeError("Founder-approved 1,527-face Master is unavailable or changed")
    if digest(ARTWORK) != FACE_SHA256:
        raise RuntimeError("Master #407 registered artwork changed")

    artifact_hashes_before = {relative(path): digest(path) for path in [*CONTRACTS, ARTWORK, EP67_REPORT]}
    population = read_json(POPULATION)
    founder = read_json(FOUNDER)
    population_before = deepcopy(population)
    founder_before = deepcopy(founder)
    pop_row = find_master(population["records"])
    fa_row = find_master(founder["records"])
    already_oos = pop_row["founderAuthority"]["status"] == "FOUNDER_OOS"
    if already_oos != (fa_row["founderStatus"] == "FOUNDER_OOS"):
        raise RuntimeError("Master #407 registries disagree before transition")

    prior_registry_state = None
    if EVIDENCE.exists():
        prior_registry_state = read_json(EVIDENCE).get("priorRegistryState")
    if prior_registry_state is None:
        prior_registry_state = {
            "population": deepcopy(pop_row),
            "founderAcceptance": deepcopy(fa_row),
        }

    evidence_ref = relative(EVIDENCE)
    evidence_entry = {"source": evidence_ref, "detail": f"Founder OOS: {REASON}"}
    pop_row["executableFaceSelection"] = {"eligible": False, "excludedBecause": "FOUNDER_OOS"}
    pop_row["founderAuthority"] = {
        "status": "FOUNDER_OOS",
        "currentScope": "OOS",
        "evidence": [evidence_entry],
        "inheritance": None,
    }
    fa_row["founderStatus"] = "FOUNDER_OOS"
    fa_row["currentScope"] = "OOS"
    fa_row["founderEvidence"] = [evidence_entry]
    fa_row["approvalInheritance"] = None
    fa_row["librarySelection"] = {
        "displayStatus": "OUT OF SCOPE",
        "eligibleForFounderReview": False,
        "excludeReason": "FOUNDER_OOS",
    }

    if not already_oos:
        population["summary"]["recordsExcludedFromExecutableFaceSelection"] += 1
        founder["summary"]["FOUNDER_OOS"] += 1
        founder["summary"]["UNVERIFIED"] -= 1

    if len(population_before["records"]) != len(population["records"]):
        raise RuntimeError("population registry length changed")
    for before, after in zip(population_before["records"], population["records"]):
        if before.get("masterNumber") != MASTER_NUMBER and before != after:
            raise RuntimeError(f"unrelated population row changed: {before.get('censusFaceKey')}")
    if len(founder_before["records"]) != len(founder["records"]):
        raise RuntimeError("Founder registry length changed")
    for before, after in zip(founder_before["records"], founder["records"]):
        if before.get("masterNumber") != MASTER_NUMBER and before != after:
            raise RuntimeError(f"unrelated Founder row changed: {before.get('censusFaceKey')}")

    write_json(FOUNDER, founder)
    population["sources"]["founderAcceptanceRegistry"]["sha256"] = digest(FOUNDER)
    write_json(POPULATION, population)
    artifact_hashes_after = {relative(path): digest(path) for path in [*CONTRACTS, ARTWORK, EP67_REPORT]}
    if artifact_hashes_before != artifact_hashes_after:
        raise RuntimeError("a preserved Master #407 artifact changed during OOS transition")

    receipt = {
        "schemaVersion": "sczn3-episode67-founder-oos-record-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "FOUNDER_APPROVED_OOS",
        "decision": {
            "masterNumber": MASTER_NUMBER,
            "censusFaceKey": FACE_KEY,
            "canonicalFaceId": FACE_SHA256,
            "printer": "American Target Company",
            "targetName": "ATC-200 USPA/IPSC",
            "physicalSize": {"width": 20, "height": 32, "unit": "inch"},
            "reason": REASON,
            "activeScoringAcceptance": False,
            "deleted": False,
        },
        "packageRuntimeIdentities": [
            {"sku": "law-enforcement:58-Q100", "runtimeId": "american_target_58_q100_uspa_ipsc"},
            {"sku": "law-enforcement:58-Q500", "runtimeId": "american_target_58_q500_uspa_ipsc"},
            {"sku": "law-enforcement:58-Q1000", "runtimeId": "american_target_58_q1000_uspa_ipsc"},
        ],
        "approvedMasterAccounting": {
            "totalCanonicalFaces": 1527,
            "before": {"activeMetadataConnectedFaces": 1496, "protectedOosFaces": 31},
            "after": {"activeMetadataConnectedFaces": 1495, "protectedOosFaces": 32},
            "movedCanonicalFaces": 1,
            "affectedRuntimeIdentities": 3,
        },
        "priorRegistryState": prior_registry_state,
        "preservation": {
            "artworkPreserved": True,
            "metadataPreserved": True,
            "scoringDescriptionsPreserved": True,
            "existingEvidencePreserved": True,
            "runtimeContractsPreserved": True,
            "founderApprovedMasterUnchanged": True,
            "founderApprovedMaster": {"path": str(MASTER), "sha256": MASTER_SHA256},
            "artifactSha256": artifact_hashes_after,
        },
        "authorityBoundary": {
            "ugoModified": False,
            "sharedScoringModified": False,
            "backendContractModifiedByThisTransition": False,
            "modelModified": False,
            "physicalScoringBoundaryAuthorityVerified": False,
            "precisionGateBypassed": False,
        },
    }
    write_json(EVIDENCE, receipt)
    print(json.dumps({
        "status": "PASS",
        "evidence": relative(EVIDENCE),
        "active": 1495,
        "oos": 32,
        "runtimeIds": RUNTIME_IDS,
    }, indent=2))


if __name__ == "__main__":
    main()
