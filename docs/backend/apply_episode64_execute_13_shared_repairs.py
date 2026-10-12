#!/usr/bin/env python3
"""Repair cohort contracts that route an Evidence-Only ceiling to scoring."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

from target_execution_contract import component_digest, validate_contract


DOCS = Path(__file__).resolve().parents[1]
CONTRACT_PATH = DOCS / "backend/target_execution_contracts/contracts/blocker_champion_targets_primos_45559_target_scoring_v1.json"
EVIDENCE_PATH = DOCS / (
    "authority-evidence/platform/episode64-execute-the-13-2026-10-12/"
    "SCZN3_EP64_EXECUTE_13_SHARED_REPAIR.json"
)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def to_evidence_only(contract: dict[str, Any]) -> dict[str, Any]:
    result = deepcopy(contract)
    scoring = result["components"]["scoring"]["definition"]
    geometry = result["components"]["geometry"]["definition"]
    if result["missionFamily"] != "targetScoring" or scoring.get("status") != "not_applicable" or geometry.get("regions"):
        raise RuntimeError("contract_does_not_match_shared_evidence_executor_repair_rule")

    target_id = result["targetProfile"]["id"]
    result["contractId"] = f"tec-{target_id}-smart-evidence-v1"
    result["missionFamily"] = "smartEvidenceCapture"
    result["resultPackageType"] = "smartEvidenceResult"
    result["resultPackageVersion"] = "1"
    result["executor"] = {"id": "smart-evidence-capture", "version": "1"}
    result["secAdapter"] = {"id": "smart-evidence-family", "version": "1", "scoringPresentationFamily": "not_applicable"}
    result["preservationValidator"] = {"id": "smart-evidence-preservation", "version": "1"}

    publisher_authority = deepcopy(scoring.get("publisherRuleAuthority"))
    result["components"]["scoring"]["definition"] = {
        "status": "not_applicable",
        "reason": "governed_evidence_only_ceiling",
        "publisherRuleAuthority": publisher_authority,
    }
    capability_states = {
        "evidence": {"status": "available"},
        "measurement": {"status": "not_applicable"},
        "correction": {"status": "not_applicable"},
        "officialScore": {"status": "not_applicable"},
        "publisherMission": {"status": "not_applicable"},
        "qualification": {"status": "not_applicable"},
    }
    result["components"]["mission"]["definition"] = {
        "missionFamily": "smartEvidenceCapture",
        "resultPackageType": "smartEvidenceResult",
        "resultPackageVersion": "1",
        "maxObservations": 500,
        "interaction": {
            "aim": {"mode": "not_required", "points": []},
            "observationInput": "normalized_taps",
            "resultAction": "show_result",
        },
        "capabilityStates": deepcopy(capability_states),
        "authorityResolution": publisher_authority["rule"],
        "recognizedBehaviorFamily": "SMART_EVIDENCE_FLOOR",
        "allowShooterDeclaredAim": False,
    }
    result["session"] = {"capabilityStates": deepcopy(capability_states), "officialMissionRequired": False}
    result["unsupportedUses"] = [
        "zeroing_correction",
        "qualification_or_certification",
        "pixel_derived_physical_authority",
        "scoring_or_object_semantics_beyond_current_authority",
    ]
    for component_name in ("scoring", "mission"):
        result["components"][component_name]["digest"] = component_digest(result["components"][component_name])
    result.pop("contractFingerprint", None)
    return validate_contract(result)


def main() -> None:
    before = validate_contract(read_json(CONTRACT_PATH))
    after = to_evidence_only(before)
    write_json(CONTRACT_PATH, after)
    write_json(
        EVIDENCE_PATH,
        {
            "schemaVersion": "sczn3.episode64.execute-13-shared-repair.v1",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "targetId": after["targetProfile"]["id"],
            "sharedRule": "A contract with an Evidence-Only authority ceiling, no governed regions, and no governed scoring must use smartEvidenceCapture rather than targetScoring.",
            "before": {
                "contractId": before["contractId"],
                "contractFingerprint": before["contractFingerprint"],
                "missionFamily": before["missionFamily"],
                "executor": before["executor"]["id"],
                "scoringStatus": before["components"]["scoring"]["definition"]["status"],
                "regionCount": len(before["components"]["geometry"]["definition"].get("regions", [])),
            },
            "after": {
                "contractId": after["contractId"],
                "contractFingerprint": after["contractFingerprint"],
                "missionFamily": after["missionFamily"],
                "executor": after["executor"]["id"],
                "scoringStatus": after["components"]["scoring"]["definition"]["status"],
                "regionCount": len(after["components"]["geometry"]["definition"].get("regions", [])),
            },
            "authorityChanged": False,
            "geometryChanged": False,
            "publisherSemanticsInvented": False,
        },
    )
    print(json.dumps({"targetId": after["targetProfile"]["id"], "status": "REPAIRED", "contractFingerprint": after["contractFingerprint"]}, indent=2))


if __name__ == "__main__":
    main()
