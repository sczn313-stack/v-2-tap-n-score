#!/usr/bin/env python3
"""Remove newly attached draft metadata from machine-blocked targets only."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "docs/backend"))
from target_execution_contract import validate_contract  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--connection-report", required=True, type=Path)
    parser.add_argument("--machine-proof", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    connection = json.loads(args.connection_report.read_text(encoding="utf-8"))
    proof = json.loads(args.machine_proof.read_text(encoding="utf-8"))
    by_runtime = {row.get("runtimeId"): row for row in connection["rows"] if row.get("runtimeId")}
    rows = []
    for failure in (row for row in proof["rows"] if row["status"] == "BLOCKED"):
        source = by_runtime[failure["runtimeId"]]
        path = ROOT / source["contractPath"]
        package = json.loads(path.read_text(encoding="utf-8"))
        product = package["targetProfile"]["product"]
        experience = product.get("shooterExperience") or {}
        provenance = experience.get("provenance") or {}
        assert provenance.get("masterNumber") == source["masterNumber"], "quarantine_provenance_mismatch"
        removed = product.pop("shooterExperience")
        package.pop("contractFingerprint", None)
        validated = validate_contract(package)
        path.write_text(json.dumps(validated, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        rows.append({
            "masterNumber": source["masterNumber"], "runtimeId": failure["runtimeId"],
            "targetName": source["targetName"], "contractPath": source["contractPath"],
            "status": "WITHHELD_MACHINE_BLOCKED", "blocker": failure["blocker"],
            "removedDraftProvenance": removed["provenance"],
            "geometryChanged": False, "scoringChanged": False, "founderStatusChanged": False,
        })
    report = {
        "schemaVersion": "sczn3.episode64.shooter-experience-quarantine.v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceConnectionReport": str(args.connection_report), "sourceMachineProof": str(args.machine_proof),
        "summary": {"withheld": len(rows), "writesLimitedToDraftRemoval": len(rows)}, "rows": rows,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))


if __name__ == "__main__":
    main()
