#!/usr/bin/env python3
"""Founder acceptance for exact publisher-label matching."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import ExecutionAuthorityError, execute_authoritative_session
from execution_capability_registry import resolve_owner
from preserved_sec_store import preserve_sec, read_preserved_sec
from session_authority import prepare_session, start_session
from target_execution_contract import TargetExecutionContractResolver, component_digest
from test_cue_drill_orchestrator import IMAGE, MemoryStore
from test_fixtures.diagnostic_feedback_scale import FIXTURE_TARGET_IDS, contracts
from test_fixtures.target_execution_scale import smart_evidence_contract


NOW = datetime(2026, 8, 20, 1, 0, tzinfo=timezone.utc)
BACKEND = Path(__file__).resolve().parent
PRODUCTION_SURFACES = (BACKEND / "server.py", BACKEND / "session_authority.py", BACKEND / "execution_authority.py", BACKEND / "execution_capability_registry.py", BACKEND.parent / "target_execution_runtime.js", BACKEND.parent / "sec_dispatch.js", BACKEND.parent / "sec_adapter_model.js", BACKEND.parent / "m4_runtime.js", BACKEND.parent / "target-experience.html")


def _session(target_id, resolver, store, key):
    prepared = prepare_session({"targetId": target_id, "missionFamily": "diagnosticFeedbackEvaluation"}, store, now=NOW, execution_contract_resolver=resolver)
    return start_session({"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]}, store, idempotency_key=key, now=NOW, execution_contract_resolver=resolver)


def _run(target_id, resolver, store, observations, handedness):
    started = _session(target_id, resolver, store, f"diagnostic-{target_id}")
    result = execute_authoritative_session({"authoritativeSessionId": started["authoritativeSessionId"], "evidence": {"imageEvidence": IMAGE, "observations": observations, "declaredHandedness": handedness, "declaredOrientation": "registered_publisher_orientation"}}, store, resolver=resolver)
    artifact = {"sessionId": started["authoritativeSessionId"], "authoritativeSessionId": started["authoritativeSessionId"], "sessionIdAuthority": "backend", "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": result["missionFamily"], "resultPackageType": result["resultPackageType"]}, "authorityPackage": result, "targetEvidenceImage": deepcopy(IMAGE), "savedToSEC": False}
    saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
    return result, saved, read_preserved_sec(started["authoritativeSessionId"], store)


def test_three_products_match_truthfully_and_reopen_exactly():
    resolver, store = TargetExecutionContractResolver(contracts()), MemoryStore()
    cases = (
        (FIXTURE_TARGET_IDS[0], [{"xNorm": .2, "yNorm": .2}, {"xNorm": .8, "yNorm": .2}], "right", ["exact_region_match", "unmapped"]),
        (FIXTURE_TARGET_IDS[1], [{"xNorm": .5, "yNorm": .5}], "not_applicable", ["ambiguous"]),
        (FIXTURE_TARGET_IDS[2], [{"xNorm": .8, "yNorm": .8}], "left", ["exact_region_match"]),
    )
    for target_id, observations, handedness, states in cases:
        result, saved, reopened = _run(target_id, resolver, store, observations, handedness)
        assert [item["classificationState"] for item in result["classifications"]] == states
        assert result["claim"] == {"claimGrade": "publisher_label_match", "displayLabel": "Publisher Label Match — Not an SCZN3 Diagnosis", "causalDiagnosisStatus": "not_established", "correctionStatus": "not_provided"}
        assert result["scoring"]["status"] == "not_applicable"
        assert result["labelSummary"]["dominantLabel"]["status"] == "unavailable"
        assert saved["artifactSha256"] == reopened["artifactSha256"]
        assert reopened["session"]["authorityPackage"] == result
    assert resolve_owner(resolver.resolve(FIXTURE_TARGET_IDS[2], "diagnosticFeedbackEvaluation")).executor_id == "diagnostic-feedback-evaluator"


def test_handedness_orientation_and_authority_fail_closed():
    resolver, store = TargetExecutionContractResolver(contracts()), MemoryStore()
    started = _session(FIXTURE_TARGET_IDS[0], resolver, store, "wrong-hand")
    for evidence, reason in (
        ({"imageEvidence": IMAGE, "observations": [{"xNorm": .2, "yNorm": .2}], "declaredHandedness": "left"}, "diagnostic_handedness_mismatch"),
        ({"imageEvidence": IMAGE, "observations": [{"xNorm": .2, "yNorm": .2}], "declaredHandedness": "right", "declaredOrientation": "mirrored"}, "diagnostic_orientation_mismatch"),
    ):
        try:
            execute_authoritative_session({"authoritativeSessionId": started["authoritativeSessionId"], "evidence": evidence}, store, resolver=resolver)
        except ExecutionAuthorityError as exc:
            assert exc.payload["reason"] == reason
        else:
            raise AssertionError(f"invalid applicability admitted: {reason}")

    candidate = deepcopy(contracts()[0])
    candidate["components"]["mission"]["definition"]["lifecycle"]["suspended"] = True
    candidate["components"]["mission"]["digest"] = component_digest(candidate["components"]["mission"])
    resolver, store = TargetExecutionContractResolver((candidate,)), MemoryStore()
    started = _session(candidate["targetProfile"]["id"], resolver, store, "suspended")
    try:
        execute_authoritative_session({"authoritativeSessionId": started["authoritativeSessionId"], "evidence": {"imageEvidence": IMAGE, "observations": [{"xNorm": .2, "yNorm": .2}], "declaredHandedness": "right"}}, store, resolver=resolver)
    except ExecutionAuthorityError as exc:
        assert exc.payload["reason"] == "diagnostic_profile_authority_inactive"
    else:
        raise AssertionError("suspended Profile admitted")


def test_tampering_and_cross_family_inference_fail():
    resolver, store = TargetExecutionContractResolver(contracts()), MemoryStore()
    result, _, _ = _run(FIXTURE_TARGET_IDS[0], resolver, store, [{"xNorm": .2, "yNorm": .2}], "right")
    owner, contract = resolve_owner(resolver.resolve(FIXTURE_TARGET_IDS[0], "diagnosticFeedbackEvaluation")), resolver.resolve(FIXTURE_TARGET_IDS[0], "diagnosticFeedbackEvaluation")
    for mutate in (lambda item: item["classifications"][0]["publisherLabel"].update({"displayLabel": "Client diagnosis"}), lambda item: item["claim"].update({"causalDiagnosisStatus": "established"}), lambda item: item["scoring"].update({"status": "complete"})):
        candidate = deepcopy(result); mutate(candidate)
        assert owner.validate_result(contract, candidate) is False
    evidence = smart_evidence_contract(contract["targetProfile"]["id"], contract["targetProfile"]["product"]["name"], contract["targetProfile"]["product"]["sku"])
    evidence["contractId"] = "tec-diagnostic-smart-evidence"
    multi = TargetExecutionContractResolver((contracts()[0], evidence))
    assert multi.resolve(contract["targetProfile"]["id"], "smartEvidenceCapture")["executor"]["id"] == "smart-evidence-capture"
    assert multi.resolve(contract["targetProfile"]["id"], "diagnosticFeedbackEvaluation")["executor"]["id"] == "diagnostic-feedback-evaluator"


def test_data_only_third_fixture_has_zero_target_id_production_edits():
    third = FIXTURE_TARGET_IDS[2].lower()
    for path in PRODUCTION_SURFACES:
        assert third not in path.read_text(encoding="utf-8").lower(), f"target-specific production edit detected in {path.name}"


if __name__ == "__main__":
    test_three_products_match_truthfully_and_reopen_exactly()
    test_handedness_orientation_and_authority_fail_closed()
    test_tampering_and_cross_family_inference_fail()
    test_data_only_third_fixture_has_zero_target_id_production_edits()
    print("Diagnostic Feedback three-fixture acceptance: PASS")
