#!/usr/bin/env python3
"""Executable acceptance for the 18 declarative targets in Scale Batch #1."""
from __future__ import annotations

import json
from pathlib import Path

from target_execution_contract import runtime_resolver
from test_declarative_target_scoring import MemoryStore, execute


ROOT = Path(__file__).resolve().parents[1]
COHORT = json.loads(
    (ROOT / "authority-evidence/platform/scale-batch-1-2026-09-08/SCALE_BATCH_1_COHORT.json").read_text(encoding="utf-8")
)["targets"]
SCORING_TARGETS = [target for target in COHORT if target["runtimeType"] == "targetScoring"]


def test_all_declarative_batch_targets_execute_and_preserve_through_one_road():
    resolver, store = runtime_resolver(), MemoryStore()
    contracts = {contract["targetProfile"]["id"]: contract for contract in resolver.contracts()}
    executable = []
    for target in SCORING_TARGETS:
        runtime_sku = contracts[target["targetProfileId"]]["targetProfile"]["product"]["sku"]
        executable.append(execute({
            "ordinal": target["ordinal"],
            "targetProfileId": target["targetProfileId"],
            "sku": runtime_sku,
        }, store, resolver))

    assert len(executable) == 18
    assert {result["missionFamily"] for result in executable} == {"targetScoring"}
    assert {result["executionContract"]["executorId"] for result in executable} == {"declarative-target-score"}
    assert {result["executionContract"]["secAdapterFamilyId"] for result in executable} == {"target-scoring-family"}
    assert all(result["reconciliation"]["status"] == "reconciled" for result in executable)
    assert sum(result["scoring"]["status"] == "not_applicable" for result in executable) == 3


def test_scale_batch_adds_no_target_identity_to_shared_production_runtime():
    shared_runtime = "\n".join((ROOT / path).read_text(encoding="utf-8") for path in (
        "backend/executors/declarative_target_score.py",
        "target_execution_runtime.js",
        "target-experience.html",
    )).lower()
    for target in SCORING_TARGETS:
        assert target["targetProfileId"].lower() not in shared_runtime


if __name__ == "__main__":
    test_all_declarative_batch_targets_execute_and_preserve_through_one_road()
    test_scale_batch_adds_no_target_identity_to_shared_production_runtime()
    print("Scale Batch #1 declarative acceptance: PASS")
    print("- 18/18 target-scoring products execute and preserve through one shared road")
    print("- one declarative scorer, one target-scoring SEC/Vault adapter")
    print("- classification-only targets preserve evidence without inventing score")
    print("- target-specific production branches added: 0")
