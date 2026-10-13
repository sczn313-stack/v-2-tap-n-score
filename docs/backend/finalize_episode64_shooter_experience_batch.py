#!/usr/bin/env python3
"""Build the final 782-row disposition ledger and Founder-review proof input."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "docs/authority-evidence/platform/episode64-shooter-experience-connections-2026-10-12"


def load(name: str) -> dict:
    return json.loads((EVIDENCE / name).read_text())


def write(name: str, value: dict) -> None:
    (EVIDENCE / name).write_text(json.dumps(value, indent=2) + "\n")


def main() -> None:
    dry_run = load("CONNECT_928_READ_ONLY_DRY_RUN.json")
    applied = load("CONNECT_928_APPLY_LEDGER.json")
    machine = load("CONNECT_691_MACHINE_PROOF.json")
    browser = load("CONNECT_661_BROWSER_PROOF.json")

    machine_by_runtime = {row["runtimeId"]: row for row in machine["rows"]}
    browser_by_runtime = {row["runtimeId"]: row for row in browser["rows"]}
    applied_by_row = {row["row"]: row for row in applied["rows"]}
    rows = []

    for source in dry_run["rows"]:
        if source["draftLayout"] != "AC:AG":
            continue
        applied_row = applied_by_row[source["row"]]
        result = {
            "row": source["row"],
            "masterNumber": source["masterNumber"],
            "printer": source["printer"],
            "targetName": source["targetName"],
            "inventoryRecordId": source["inventoryRecordId"],
            "sku": source["sku"],
            "runtimeId": source.get("runtimeId"),
            "contractPath": source.get("contractPath"),
            "draftStatus": source["draftStatus"],
            "identityStatus": source["status"],
            "status": "BLOCKED",
            "blocker": None,
            "machineProof": None,
            "browserProof": None,
        }
        if applied_row["status"] == "CONNECTED":
            runtime_id = applied_row["runtimeId"]
            machine_row = machine_by_runtime[runtime_id]
            result["runtimeId"] = runtime_id
            result["contractPath"] = applied_row["contractPath"]
            result["machineProof"] = machine_row["status"]
            if machine_row["status"] != "PASS":
                result["status"] = "BLOCKED_MACHINE_GATE"
                result["blocker"] = machine_row.get("blocker")
            else:
                browser_row = browser_by_runtime[runtime_id]
                result["browserProof"] = browser_row["status"]
                if browser_row["status"] == "PASS":
                    result["status"] = "PASS"
                    result["launchUrl"] = browser_row["launchUrl"]
                else:
                    result["status"] = "BLOCKED_BROWSER_GATE"
                    result["blocker"] = browser_row.get("blocker")
        else:
            result["status"] = applied_row["status"]
            evidence = applied_row.get("identityEvidence") or {}
            result["blocker"] = evidence.get("reason") or applied_row["status"]
        rows.append(result)

    assert len(rows) == 782
    counts = Counter(row["status"] for row in rows)
    assert counts == Counter(
        {
            "PASS": 661,
            "BLOCKED_MACHINE_GATE": 30,
            "BLOCKED_AMBIGUOUS_MATCH": 70,
            "BLOCKED_NO_MATCH": 10,
            "BLOCKED_INCOMPLETE_DRAFT": 11,
        }
    )

    final_ledger = {
        "schemaVersion": "sczn3.episode64.shooter-experience-additional-782-ledger.v1",
        "governance": {
            "draftArithmetic": "928 = 146 prior intake + 782 additional",
            "populationArithmetic": "1168 = 928 drafted + 240 deferred",
            "identityRule": "Exact canonical identity, registered artwork, SKU, printer, and runtime corroboration; no forced ambiguous matches.",
            "capabilityRule": "Evidence Only remains Evidence Only; connection does not promote scoring or overwrite Backend Authority.",
            "founderApprovalClaimed": False,
        },
        "summary": dict(sorted(counts.items())),
        "rows": rows,
    }
    write("CONNECT_782_FINAL_LEDGER.json", final_ledger)

    pass_ids = {row["runtimeId"] for row in rows if row["status"] == "PASS"}
    pass_rows = []
    for machine_row in machine["rows"]:
        if machine_row["runtimeId"] not in pass_ids:
            continue
        browser_row = browser_by_runtime[machine_row["runtimeId"]]
        merged = dict(machine_row)
        merged["browserStages"] = browser_row["stages"]
        merged["launchUrl"] = browser_row["launchUrl"]
        pass_rows.append(merged)
    assert len(pass_rows) == 661
    write(
        "CONNECT_661_FINAL_PASS_PROOF.json",
        {
            "schemaVersion": "sczn3.episode64.shooter-experience-final-pass-proof.v1",
            "sourceMachineProof": str(EVIDENCE / "CONNECT_691_MACHINE_PROOF.json"),
            "sourceBrowserProof": str(EVIDENCE / "CONNECT_661_BROWSER_PROOF.json"),
            "summary": {"targets": 661, "pass": 661, "blocked": 0},
            "rows": pass_rows,
        },
    )
    print(json.dumps({"additionalDrafts": 782, "dispositions": dict(counts), "founderBoardTargets": 661}))


if __name__ == "__main__":
    main()
