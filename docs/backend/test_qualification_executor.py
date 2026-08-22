#!/usr/bin/env python3
"""Founder acceptance for the reusable practice Qualification family."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import ExecutionAuthorityError, execute_authoritative_action
from execution_capability_registry import resolve_owner
from preserved_sec_store import PreservedSECError, preserve_sec, read_preserved_sec
from session_authority import prepare_session, start_session
from stage_event_store import MemoryStageEventStore
from target_execution_contract import TargetExecutionContractResolver, component_digest
from test_cue_drill_orchestrator import IMAGE, MemoryStore
from test_fixtures.qualification_scale import FIXTURE_TARGET_IDS, contracts
from test_fixtures.target_execution_scale import smart_evidence_contract


NOW = datetime(2026, 8, 19, 23, 0, tzinfo=timezone.utc)
BACKEND = Path(__file__).resolve().parent
PRODUCTION_SURFACES = (
    BACKEND / "server.py", BACKEND / "session_authority.py", BACKEND / "execution_authority.py",
    BACKEND / "execution_capability_registry.py", BACKEND / "stage_event_store.py",
    BACKEND.parent / "target_execution_runtime.js", BACKEND.parent / "sec_dispatch.js",
    BACKEND.parent / "sec_adapter_model.js", BACKEND.parent / "m4_runtime.js", BACKEND.parent / "target-experience.html",
)


def _session(target_id, resolver, store, key):
    prepared = prepare_session({"targetId": target_id, "missionFamily": "qualificationCourseEvaluation"}, store, now=NOW, execution_contract_resolver=resolver)
    return start_session({"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]}, store, idempotency_key=key, now=NOW, execution_contract_resolver=resolver)


def _act(session_id, resolver, sessions, stages, sequence, action, action_id):
    response = execute_authoritative_action(
        {"authoritativeSessionId": session_id, "actionId": action_id, "expectedSequence": sequence, "action": action},
        sessions, stages, resolver=resolver, now=NOW,
    )
    return response, response["sequenceNumber"]


def _preserve(target_id, session_id, result, sessions, resolver):
    artifact = {
        "sessionId": session_id, "authoritativeSessionId": session_id, "sessionIdAuthority": "backend",
        "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": result["missionFamily"], "resultPackageType": result["resultPackageType"]},
        "authorityPackage": result, "targetEvidenceImage": deepcopy(IMAGE), "savedToSEC": False,
    }
    saved = preserve_sec({"session": artifact}, sessions, now=NOW, execution_contract_resolver=resolver)
    return saved, read_preserved_sec(session_id, sessions)


def _complete(target_id, resolver, sessions, stages, index, point):
    started = _session(target_id, resolver, sessions, f"qualification-idem-{index}")
    session_id, sequence = started["authoritativeSessionId"], 0
    response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "start_run", "imageEvidence": IMAGE, "requestedClaimGrade": "practice_simulation"}, f"{index}-start")
    for stage_index in range(response["runState"]["plannedCueCount"]):
        response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "issue_or_declare_cue"}, f"{index}-issue-{stage_index}")
        response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "record_response_evidence", "observations": [point]}, f"{index}-record-{stage_index}")
        response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "advance"}, f"{index}-advance-{stage_index}")
    result = response["result"]
    saved, reopened = _preserve(target_id, session_id, result, sessions, resolver)
    return started, result, saved, reopened


def test_three_courses_inherit_one_family_and_exact_reopen():
    resolver = TargetExecutionContractResolver(contracts())
    sessions, stages = MemoryStore(), MemoryStageEventStore()
    points = ({"xNorm": 0.5, "yNorm": 0.5}, {"xNorm": 0.2, "yNorm": 0.2}, {"xNorm": 0.5, "yNorm": 0.5})
    outcomes = [_complete(target_id, resolver, sessions, stages, index, point) for index, (target_id, point) in enumerate(zip(FIXTURE_TARGET_IDS, points), start=1)]
    owners = [resolve_owner(resolver.resolve(target_id, "qualificationCourseEvaluation")) for target_id in FIXTURE_TARGET_IDS]
    assert {owner.executor_id for owner in owners} == {"qualification-executor"}
    assert {owner.sec_adapter_family_id for owner in owners} == {"qualification-family"}
    assert [item[1]["performance"]["outcome"] for item in outcomes] == ["pass", "fail", "pass"]
    for target_id, (started, result, saved, reopened) in zip(FIXTURE_TARGET_IDS, outcomes):
        assert started["missionIdentity"]["missionFamily"] == "qualificationCourseEvaluation"
        assert result["target"]["id"] == target_id
        assert result["claim"] == {"claimGrade": "practice_simulation", "officialClaimStatus": "not_established", "credentialStatus": "not_issued_by_sczn3", "displayLabel": "Practice Simulation — Not Official Qualification"}
        assert result["timing"]["physicalShotTiming"]["status"] == "unavailable"
        assert saved["artifactSha256"] == reopened["artifactSha256"]
        assert reopened["session"]["authorityPackage"] == result
        assert reopened["session"]["targetEvidenceImage"]["dataUrl"] == IMAGE["dataUrl"]


def test_official_request_fails_closed_without_downgrade_or_state():
    resolver = TargetExecutionContractResolver(contracts())
    sessions, stages = MemoryStore(), MemoryStageEventStore()
    started = _session(FIXTURE_TARGET_IDS[0], resolver, sessions, "official-refusal")
    try:
        _act(started["authoritativeSessionId"], resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE, "requestedClaimGrade": "official_qualification", "instructor": "client-entered"}, "official-start")
    except ExecutionAuthorityError as exc:
        assert exc.payload["reason"] == "official_qualification_authority_unavailable"
    else:
        raise AssertionError("official qualification request silently admitted")
    assert stages.get_run(started["authoritativeSessionId"]) is None


def test_incomplete_profile_and_result_tampering_fail_closed():
    original = contracts()[0]
    candidate = deepcopy(original)
    del candidate["components"]["mission"]["definition"]["sourceDocuments"]
    candidate["components"]["mission"]["digest"] = component_digest(candidate["components"]["mission"])
    resolver = TargetExecutionContractResolver((candidate,))
    sessions, stages = MemoryStore(), MemoryStageEventStore()
    started = _session(candidate["targetProfile"]["id"], resolver, sessions, "incomplete-profile")
    try:
        _act(started["authoritativeSessionId"], resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE}, "incomplete-start")
    except ExecutionAuthorityError as exc:
        assert exc.payload["reason"] == "qualification_profile_incomplete"
    else:
        raise AssertionError("incomplete Course Profile admitted")

    resolver = TargetExecutionContractResolver(contracts())
    sessions, stages = MemoryStore(), MemoryStageEventStore()
    _, result, _, _ = _complete(FIXTURE_TARGET_IDS[0], resolver, sessions, stages, 91, {"xNorm": 0.5, "yNorm": 0.5})
    owner = resolve_owner(resolver.resolve(FIXTURE_TARGET_IDS[0], "qualificationCourseEvaluation"))
    for mutate in (
        lambda item: item["claim"].update({"claimGrade": "official_qualification"}),
        lambda item: item["performance"].update({"outcome": "fail"}),
        lambda item: item["reconciliation"].update({"observationCount": 999}),
    ):
        tampered = deepcopy(result)
        mutate(tampered)
        assert owner.validate_result(resolver.resolve(FIXTURE_TARGET_IDS[0], "qualificationCourseEvaluation"), tampered) is False


def test_inactive_mismatched_and_timing_material_authority_fail_closed():
    original = contracts()[0]
    mutations = (
        (lambda item: item["components"]["mission"]["definition"]["lifecycle"].update({"suspended": True}), "qualification_profile_authority_inactive"),
        (lambda item: item["components"]["mission"]["definition"]["componentBindings"].update({"geometryDigest": "0" * 64}), "qualification_component_binding_invalid"),
        (lambda item: item["components"]["mission"]["definition"]["timingPolicy"].update({"physicalShotTiming": "inferred"}), "qualification_timing_policy_invalid"),
    )
    for mutate, reason in mutations:
        candidate = deepcopy(original)
        mutate(candidate)
        candidate["components"]["mission"]["digest"] = component_digest(candidate["components"]["mission"])
        resolver = TargetExecutionContractResolver((candidate,))
        sessions, stages = MemoryStore(), MemoryStageEventStore()
        started = _session(candidate["targetProfile"]["id"], resolver, sessions, f"invalid-{reason}")
        try:
            _act(started["authoritativeSessionId"], resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE}, f"action-{reason}")
        except ExecutionAuthorityError as exc:
            assert exc.payload["reason"] == reason
        else:
            raise AssertionError(f"invalid authority admitted: {reason}")

    timed = deepcopy(original)
    timed["components"]["mission"]["definition"]["stages"][0]["timeLimitMs"] = 1000
    timed["components"]["mission"]["digest"] = component_digest(timed["components"]["mission"])
    resolver = TargetExecutionContractResolver((timed,))
    sessions, stages = MemoryStore(), MemoryStageEventStore()
    started = _session(timed["targetProfile"]["id"], resolver, sessions, "timing-material")
    session_id, sequence = started["authoritativeSessionId"], 0
    _, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "start_run", "imageEvidence": IMAGE}, "timed-start")
    _, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "issue_or_declare_cue"}, "timed-issue-1")
    _, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "record_response_evidence", "observations": [{"xNorm": .5, "yNorm": .5}]}, "timed-record-1")
    response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "advance"}, "timed-advance-1")
    _, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "issue_or_declare_cue"}, "timed-issue-2")
    _, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "record_response_evidence", "observations": [{"xNorm": .5, "yNorm": .5}]}, "timed-record-2")
    response, _ = _act(session_id, resolver, sessions, stages, sequence, {"type": "advance"}, "timed-advance-2")
    assert response["result"]["performance"]["outcome"] == "not_evaluable"


def test_stopped_course_is_incomplete_and_preservable():
    resolver = TargetExecutionContractResolver(contracts())
    sessions, stages = MemoryStore(), MemoryStageEventStore()
    started = _session(FIXTURE_TARGET_IDS[0], resolver, sessions, "stopped-course")
    session_id = started["authoritativeSessionId"]
    _, sequence = _act(session_id, resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE}, "stop-start")
    _, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "issue_or_declare_cue"}, "stop-issue")
    response, _ = _act(session_id, resolver, sessions, stages, sequence, {"type": "stop_run"}, "stop-terminal")
    assert response["result"]["performance"]["outcome"] == "incomplete"
    saved, reopened = _preserve(FIXTURE_TARGET_IDS[0], session_id, response["result"], sessions, resolver)
    assert saved["artifactSha256"] == reopened["artifactSha256"]


def test_data_only_third_course_has_zero_target_id_production_edits():
    third = FIXTURE_TARGET_IDS[2].lower()
    for path in PRODUCTION_SURFACES:
        assert third not in path.read_text(encoding="utf-8").lower(), f"target-specific production edit detected in {path.name}"


def test_shared_primitives_are_inherited_without_cue_authority():
    source = (BACKEND / "executors" / "qualification_executor.py").read_text(encoding="utf-8")
    assert "from stage_event_primitives import" in source
    assert "cue_drill_orchestrator" not in source


def test_smart_evidence_and_qualification_resolve_independently():
    qualification = contracts()[0]
    evidence = smart_evidence_contract(qualification["targetProfile"]["id"], "Pistol Practice Course", "QUAL-A01")
    evidence["contractId"] = "tec-fixture-qualification-pistol-smart-evidence"
    resolver = TargetExecutionContractResolver((qualification, evidence))
    assert resolver.resolve(qualification["targetProfile"]["id"], "qualificationCourseEvaluation")["executor"]["id"] == "qualification-executor"
    assert resolver.resolve(qualification["targetProfile"]["id"], "smartEvidenceCapture")["executor"]["id"] == "smart-evidence-capture"


if __name__ == "__main__":
    test_three_courses_inherit_one_family_and_exact_reopen()
    test_official_request_fails_closed_without_downgrade_or_state()
    test_incomplete_profile_and_result_tampering_fail_closed()
    test_inactive_mismatched_and_timing_material_authority_fail_closed()
    test_stopped_course_is_incomplete_and_preservable()
    test_data_only_third_course_has_zero_target_id_production_edits()
    test_shared_primitives_are_inherited_without_cue_authority()
    test_smart_evidence_and_qualification_resolve_independently()
    print("Qualification three-fixture acceptance: PASS")
