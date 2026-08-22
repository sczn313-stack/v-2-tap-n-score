#!/usr/bin/env python3
"""Founder acceptance for publisher-designated Decision response matching."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import ExecutionAuthorityError, execute_authoritative_action
from execution_capability_registry import resolve_owner
from preserved_sec_store import preserve_sec, read_preserved_sec
from session_authority import prepare_session, start_session
from stage_event_store import MemoryStageEventStore
from target_execution_contract import TargetExecutionContractResolver, component_digest
from test_cue_drill_orchestrator import IMAGE, MemoryStore
from test_fixtures.decision_scenario_scale import FIXTURE_TARGET_IDS, contracts


NOW = datetime(2026, 8, 20, 1, 0, tzinfo=timezone.utc)
BACKEND = Path(__file__).resolve().parent
PRODUCTION_SURFACES = (BACKEND / "server.py", BACKEND / "session_authority.py", BACKEND / "execution_authority.py", BACKEND / "execution_capability_registry.py", BACKEND / "stage_event_store.py", BACKEND.parent / "target_execution_runtime.js", BACKEND.parent / "sec_dispatch.js", BACKEND.parent / "sec_adapter_model.js", BACKEND.parent / "m4_runtime.js", BACKEND.parent / "target-experience.html")


def _session(target_id, resolver, sessions, key):
    prepared = prepare_session({"targetId": target_id, "missionFamily": "decisionScenarioEvaluation"}, sessions, now=NOW, execution_contract_resolver=resolver)
    return start_session({"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]}, sessions, idempotency_key=key, now=NOW, execution_contract_resolver=resolver)


def _act(session_id, resolver, sessions, stages, sequence, action, action_id):
    response = execute_authoritative_action({"authoritativeSessionId": session_id, "actionId": action_id, "expectedSequence": sequence, "action": action}, sessions, stages, resolver=resolver, now=NOW)
    return response, response["sequenceNumber"]


def _run(target_id, response_kind, index):
    resolver, sessions, stages = TargetExecutionContractResolver(contracts()), MemoryStore(), MemoryStageEventStore()
    started = _session(target_id, resolver, sessions, f"decision-session-{index}")
    session_id, sequence = started["authoritativeSessionId"], 0
    response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "start_run", "imageEvidence": IMAGE}, f"{index}-start")
    response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "present_scenario"}, f"{index}-present")
    if response_kind == "observation":
        response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "record_response_evidence", "observations": [{"xNorm": .5, "yNorm": .5}]}, f"{index}-observe")
    else:
        response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "record_no_observation"}, f"{index}-none")
    response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "advance"}, f"{index}-advance")
    result = response["result"]
    artifact = {"sessionId": session_id, "authoritativeSessionId": session_id, "sessionIdAuthority": "backend", "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": result["missionFamily"], "resultPackageType": result["resultPackageType"]}, "authorityPackage": result, "targetEvidenceImage": deepcopy(IMAGE), "savedToSEC": False}
    saved = preserve_sec({"session": artifact}, sessions, now=NOW, execution_contract_resolver=resolver)
    return resolver, result, saved, read_preserved_sec(session_id, sessions)


def test_three_products_inherit_decision_family_and_exact_reopen():
    cases = ((FIXTURE_TARGET_IDS[0], "observation", "matched"), (FIXTURE_TARGET_IDS[1], "none", "matched"), (FIXTURE_TARGET_IDS[2], "observation", "matched"))
    for index, (target_id, response_kind, expected) in enumerate(cases, start=1):
        resolver, result, saved, reopened = _run(target_id, response_kind, index)
        assert result["presentations"][0]["reconciliationState"] == expected
        assert result["claim"]["displayLabel"] == "Publisher-Designated Response Match — Not Legal or Tactical Judgment"
        assert all(result["claim"][key] == "not_established" for key in ("legalJudgmentStatus", "tacticalJudgmentStatus", "threatStatus", "useOfForceStatus", "qualificationStatus"))
        assert result["scoring"]["status"] == "not_applicable"
        assert saved["artifactSha256"] == reopened["artifactSha256"]
        assert reopened["session"]["authorityPackage"] == result
        assert resolve_owner(resolver.resolve(target_id, "decisionScenarioEvaluation")).executor_id == "decision-scenario-evaluator"


def test_positive_and_no_response_mismatch_truthfully():
    _, positive_no_response, _, _ = _run(FIXTURE_TARGET_IDS[0], "none", 20)
    _, prohibited_observation, _, _ = _run(FIXTURE_TARGET_IDS[1], "observation", 21)
    assert positive_no_response["presentations"][0]["reconciliationState"] == "mismatched"
    assert prohibited_observation["presentations"][0]["reconciliationState"] == "mismatched"
    no_response = positive_no_response["presentations"][0]["noResponseEvidence"]
    assert no_response["provenance"] == "shooter_declared_after_backend_presentation"
    assert no_response["physicalShotAbsenceProven"] is False


def test_missing_evidence_fails_closed():
    resolver, sessions, stages = TargetExecutionContractResolver(contracts()), MemoryStore(), MemoryStageEventStore()
    started = _session(FIXTURE_TARGET_IDS[1], resolver, sessions, "missing-evidence")
    session_id = started["authoritativeSessionId"]
    _, sequence = _act(session_id, resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE}, "missing-start")
    _, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "present_scenario"}, "missing-present")
    try:
        _act(session_id, resolver, sessions, stages, sequence, {"type": "advance"}, "missing-advance")
    except ExecutionAuthorityError as exc:
        assert exc.payload["reason"] == "decision_response_evidence_required"
    else:
        raise AssertionError("missing evidence became a successful no-response")


def test_profile_not_name_or_artwork_owns_expected_response():
    profiles = contracts()
    assert "Friendly-Named" in profiles[0]["targetProfile"]["product"]["name"]
    assert profiles[0]["components"]["mission"]["definition"]["presentations"][0]["publisherDesignation"]["expectedResponse"] == "observation_required"
    assert "Danger-Named" in profiles[1]["targetProfile"]["product"]["name"]
    assert profiles[1]["components"]["mission"]["definition"]["presentations"][0]["publisherDesignation"]["expectedResponse"] == "no_observation_expected"
    source = (BACKEND / "executors" / "decision_scenario_evaluator.py").read_text(encoding="utf-8")
    assert "product\"][\"name" not in source and "assetAlt" not in source and "image recognition" not in source.lower()


def test_inactive_binding_and_tampered_result_fail_closed():
    original = contracts()[0]
    for mutate, reason in (
        (lambda item: item["components"]["mission"]["definition"]["lifecycle"].update({"suspended": True}), "decision_profile_authority_inactive"),
        (lambda item: item["components"]["mission"]["definition"]["componentBindings"].update({"geometryDigest": "0" * 64}), "decision_component_binding_invalid"),
    ):
        candidate = deepcopy(original); mutate(candidate); candidate["components"]["mission"]["digest"] = component_digest(candidate["components"]["mission"])
        resolver, sessions, stages = TargetExecutionContractResolver((candidate,)), MemoryStore(), MemoryStageEventStore()
        started = _session(candidate["targetProfile"]["id"], resolver, sessions, reason)
        try:
            _act(started["authoritativeSessionId"], resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE}, reason)
        except ExecutionAuthorityError as exc:
            assert exc.payload["reason"] == reason
        else:
            raise AssertionError(f"invalid authority admitted: {reason}")
    resolver, result, _, _ = _run(FIXTURE_TARGET_IDS[0], "observation", 30)
    owner, contract = resolve_owner(resolver.resolve(FIXTURE_TARGET_IDS[0], "decisionScenarioEvaluation")), resolver.resolve(FIXTURE_TARGET_IDS[0], "decisionScenarioEvaluation")
    for mutate in (lambda item: item["claim"].update({"legalJudgmentStatus": "established"}), lambda item: item["presentations"][0].update({"reconciliationState": "mismatched"}), lambda item: item["scoring"].update({"status": "complete"})):
        candidate = deepcopy(result); mutate(candidate)
        assert owner.validate_result(contract, candidate) is False


def test_data_only_fixture_has_zero_target_id_production_edits_and_no_cue_authority():
    third = FIXTURE_TARGET_IDS[2].lower()
    for path in PRODUCTION_SURFACES:
        assert third not in path.read_text(encoding="utf-8").lower(), f"target-specific production edit detected in {path.name}"
    source = (BACKEND / "executors" / "decision_scenario_evaluator.py").read_text(encoding="utf-8")
    assert "from stage_event_primitives import" in source
    assert "cue_drill_orchestrator" not in source


if __name__ == "__main__":
    test_three_products_inherit_decision_family_and_exact_reopen()
    test_positive_and_no_response_mismatch_truthfully()
    test_missing_evidence_fails_closed()
    test_profile_not_name_or_artwork_owns_expected_response()
    test_inactive_binding_and_tampered_result_fail_closed()
    test_data_only_fixture_has_zero_target_id_production_edits_and_no_cue_authority()
    print("Decision Scenario three-fixture acceptance: PASS")
