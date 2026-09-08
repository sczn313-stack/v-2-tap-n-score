#!/usr/bin/env python3
"""Acceptance for target scoring as data across the nine-target scale cohort."""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import execute_authoritative_session
from preserved_sec_store import preserve_sec, read_preserved_sec
from session_authority import prepare_session, start_session
from target_execution_contract import TargetExecutionContractError, component_digest, runtime_resolver, validate_contract
from executors import declarative_target_score
from test_target_execution_scale_architecture import MemoryStore


ROOT = Path(__file__).resolve().parents[1]
COHORT = json.loads((ROOT / "authority-evidence/platform/target-data-one-road-scale-proof-2026-09-08/TARGET_DATA_ONE_ROAD_COHORT.json").read_text(encoding="utf-8"))["targets"]
NOW = datetime(2026, 9, 9, 12, 0, tzinfo=timezone.utc)
EXPECTED_MODELS = {
    "13120": "named_regions", "22200": "numeric_regions", "SL-ST2": "penalty_regions",
    "22470": "named_regions", "22040": "penalty_regions", "12070": "numeric_regions",
    "BE-R9B": "multiple_bulls", "GF-BB-C": "ordered_objects", "22740": "not_applicable",
}


def execute(target, store, resolver):
    prepared = prepare_session({"targetId": target["targetProfileId"], "missionFamily": "targetScoring"}, store, now=NOW, execution_contract_resolver=resolver)
    assert prepared["missionIdentity"]["missionFamily"] == "targetScoring"
    started = start_session({"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]}, store, idempotency_key=f"target-score-{target['ordinal']}", now=NOW, execution_contract_resolver=resolver)
    evidence = {"imageEvidence": {"sha256": "a" * 64, "widthPx": 1141, "heightPx": 1500, "mediaType": "image/webp", "dataUrl": "data:image/webp;base64,UklGRg=="}, "observations": [{"xNorm": .42, "yNorm": .44}, {"xNorm": .57, "yNorm": .51}, {"xNorm": .48, "yNorm": .58}]}
    if started["interactionContract"]["aim"]["mode"] == "shooter_declared":
        evidence["shooterDeclaredAimPoint"] = {"xNorm": .5, "yNorm": .5}
    result = execute_authoritative_session({"authoritativeSessionId": started["authoritativeSessionId"], "evidence": evidence}, store, resolver=resolver)
    artifact = {"sessionId": started["authoritativeSessionId"], "authoritativeSessionId": started["authoritativeSessionId"], "sessionIdAuthority": "backend", "matrixSnapshot": {"targetProfileId": target["targetProfileId"], "missionFamily": result["missionFamily"], "resultPackageType": result["resultPackageType"]}, "authorityPackage": result, "targetEvidenceImage": {"dataUrl": "data:image/webp;base64,UklGRg==", "sha256": "a" * 64}, "savedToSEC": False}
    saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
    reopened = read_preserved_sec(started["authoritativeSessionId"], store)
    assert saved["artifactSha256"] == reopened["artifactSha256"]
    assert reopened["session"]["authorityPackage"]["target"]["product"]["sku"] == target["sku"]
    return result


def test_nine_targets_inherit_one_target_scoring_executor_and_preserve_exact_identity():
    resolver, store = runtime_resolver(), MemoryStore()
    results = [execute(target, store, resolver) for target in COHORT]
    assert len(results) == 9
    assert {item["missionFamily"] for item in results} == {"targetScoring"}
    assert {item["executionContract"]["executorId"] for item in results} == {"declarative-target-score"}
    assert {item["executionContract"]["secAdapterFamilyId"] for item in results} == {"target-scoring-family"}
    assert {item["target"]["product"]["sku"]: item["scoring"]["model"] for item in results} == EXPECTED_MODELS
    assert all(item["reconciliation"]["status"] == "reconciled" and item["reconciliation"]["countsMatch"] for item in results)
    assert {item["target"]["product"]["sku"]: item["aimStructure"]["mode"] for item in results} == {
        "13120": "shooter_declared", "22200": "fixed", "SL-ST2": "shooter_declared",
        "22470": "shooter_declared", "22040": "shooter_declared", "12070": "fixed",
        "BE-R9B": "region_centers", "GF-BB-C": "region_centers", "22740": "not_required",
    }
    assert sum(item["scoring"]["status"] == "complete" for item in results) == 8
    assert [item["target"]["product"]["sku"] for item in results if item["scoring"]["status"] == "not_applicable"] == ["22740"]


def test_scoring_data_expresses_required_recurring_patterns():
    contracts = {item["targetProfile"]["product"]["sku"]: item for item in runtime_resolver().contracts() if item["targetProfile"]["product"]["sku"] in EXPECTED_MODELS}
    assert len(contracts) == 9
    definitions = {sku: contract["components"]["scoring"]["definition"] for sku, contract in contracts.items()}
    assert definitions["22200"]["model"] == "numeric_regions"
    assert {rule["value"] for rule in definitions["22200"]["regionRules"].values()} >= {7, 8, 9, 10}
    assert definitions["22470"]["model"] == "named_regions"
    assert {rule["label"] for rule in definitions["22470"]["regionRules"].values()} == {"A", "B", "C", "D"}
    assert definitions["22040"]["model"] == "penalty_regions"
    assert {rule["value"] for rule in definitions["22040"]["regionRules"].values()} == {0, -1, -3}
    assert definitions["GF-BB-C"]["aggregation"] == {"mode": "ordered_progression", "sequence": list(range(1, 16)), "mismatchBehavior": "stop_progress", "completionBehavior": "all_in_order"}
    assert definitions["BE-R9B"]["model"] == "multiple_bulls"
    assert definitions["BE-R9B"]["aggregation"]["mode"] == "per_object_counts"
    assert len(definitions["BE-R9B"]["regionRules"]) == 9
    assert all("outsideRule" in definition or definition["model"] == "not_applicable" for definition in definitions.values())
    assert definitions["22740"]["status"] == "not_applicable"
    assert definitions["22740"]["reason"] == "printer_defines_no_score"
    assert {definition["schemaVersion"] for definition in definitions.values()} == {"sczn3-target-scoring-data-v1"}


def test_object_results_and_sequence_policy_are_reusable_data_outcomes():
    resolver, store = runtime_resolver(), MemoryStore()
    by_sku = {target["sku"]: target for target in COHORT}
    bulls = execute(by_sku["BE-R9B"], store, resolver)
    ordered = execute(by_sku["GF-BB-C"], store, resolver)
    assert len(bulls["scoring"]["objectResults"]) == 9
    assert sum(item["observationCount"] for item in bulls["scoring"]["objectResults"]) <= len(bulls["classifications"])
    assert len(ordered["scoring"]["objectResults"]) == 15
    assert ordered["scoring"]["aggregation"]["mode"] == "ordered_progression"
    assert isinstance(ordered["scoring"]["sequenceComplete"], bool)


def test_ordered_object_reset_and_completion_are_data_not_target_code():
    contract = next(item for item in runtime_resolver().contracts() if item["targetProfile"]["product"]["sku"] == "GF-BB-C")
    candidate = deepcopy(contract)
    candidate["components"]["scoring"]["definition"]["aggregation"]["mismatchBehavior"] = "restart_sequence"
    regions = {region["regionId"]: region for region in candidate["components"]["geometry"]["definition"]["regions"]}
    observations = []
    for region_id in ("1", "2"):
        observations.append({"xNorm": regions[region_id]["cx"], "yNorm": regions[region_id]["cy"]})
    observations.append({"xNorm": .02, "yNorm": .02})
    for region_id in ("1", "2"):
        observations.append({"xNorm": regions[region_id]["cx"], "yNorm": regions[region_id]["cy"]})
    result = declarative_target_score.execute(candidate, {"imageEvidence": {"sha256": "b" * 64, "widthPx": 1141, "heightPx": 1500, "mediaType": "image/jpeg", "dataUrl": "data:image/jpeg;base64,AA=="}, "observations": observations})
    assert result["scoring"]["completedInOrder"] == 2
    assert result["scoring"]["completion"] == "in_progress"
    assert result["scoring"]["nextExpectedObjectId"] == 3
    assert result["scoring"]["sequenceComplete"] is False


def test_invalid_scoring_or_aim_data_fails_at_contract_admission():
    source = next(item for item in runtime_resolver().contracts() if item["targetProfile"]["product"]["sku"] == "12070")
    for component_name, mutate, expected in (
        ("scoring", lambda definition: definition["aggregation"].update({"mode": "classification_counts"}), "target_scoring_aggregation_invalid"),
        ("mission", lambda definition: definition["interaction"]["aim"].update({"mode": "fixed", "points": []}), "target_scoring_fixed_aim_required"),
    ):
        candidate = deepcopy(source)
        candidate.pop("contractFingerprint", None)
        component = candidate["components"][component_name]
        mutate(component["definition"])
        component["digest"] = component_digest(component)
        try:
            validate_contract(candidate, now=NOW)
        except TargetExecutionContractError as error:
            assert error.payload["reason"] == expected
        else:
            raise AssertionError(f"expected admission failure: {expected}")


def test_shared_runtime_and_executor_have_no_cohort_target_identity_branches():
    paths = [ROOT / "backend/executors/declarative_target_score.py", ROOT / "target_execution_runtime.js", ROOT / "target-experience.html"]
    for path in paths:
        source = path.read_text(encoding="utf-8").lower()
        for target in COHORT:
            assert target["targetProfileId"].lower() not in source


if __name__ == "__main__":
    test_nine_targets_inherit_one_target_scoring_executor_and_preserve_exact_identity()
    test_scoring_data_expresses_required_recurring_patterns()
    test_object_results_and_sequence_policy_are_reusable_data_outcomes()
    test_ordered_object_reset_and_completion_are_data_not_target_code()
    test_invalid_scoring_or_aim_data_fails_at_contract_admission()
    test_shared_runtime_and_executor_have_no_cohort_target_identity_branches()
    print("Declarative Target Scoring acceptance: PASS")
    print("- 9 products inherited one targetScoring executor and one SEC/Vault adapter")
    print("- 8 printer-defined scoring models completed; Vital Dude remained truthfully not_applicable")
    print("- numeric, named, penalty, ordered-object, multi-bull, outside, total, and not-applicable data patterns passed")
    print("- target-specific production branches added: 0")
