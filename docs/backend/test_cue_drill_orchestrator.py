#!/usr/bin/env python3
"""Founder acceptance for the reusable Cue/Drill capability family."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import ExecutionAuthorityError, execute_authoritative_action
from execution_capability_registry import resolve_owner
from preserved_sec_store import PreservedSECError, preserve_sec, read_preserved_sec
from session_authority import SessionAuthorityError, prepare_session, start_session
from stage_event_store import MemoryStageEventStore
from target_execution_contract import TargetExecutionContractError, TargetExecutionContractResolver, component_digest
from test_fixtures.cue_drill_scale import FIXTURE_TARGET_IDS, contracts
from test_fixtures.target_execution_scale import smart_evidence_contract


NOW = datetime(2026, 8, 19, 22, 30, tzinfo=timezone.utc)
BACKEND = Path(__file__).resolve().parent
PRODUCTION_SURFACES = (
    BACKEND / "server.py", BACKEND / "session_authority.py", BACKEND / "execution_authority.py",
    BACKEND / "execution_capability_registry.py", BACKEND / "stage_event_store.py",
    BACKEND.parent / "target_execution_runtime.js", BACKEND.parent / "sec_dispatch.js",
    BACKEND.parent / "sec_adapter_model.js", BACKEND.parent / "m4_runtime.js",
    BACKEND.parent / "target-experience.html",
)
IMAGE = {"sha256": "a" * 64, "widthPx": 900, "heightPx": 1200, "mediaType": "image/svg+xml", "dataUrl": "data:image/svg+xml;base64,PHN2Zy8+"}


class MemoryStore:
    def __init__(self):
        self.preparations = {}
        self.idempotency = {}
        self.sessions = {}
        self.preserved = {}

    def save_preparation(self, record):
        self.preparations[record["tokenHash"]] = deepcopy(record)

    def get_preparation(self, token_hash):
        return deepcopy(self.preparations.get(token_hash))

    def find_session_by_idempotency_key(self, key):
        return deepcopy(self.idempotency.get(key))

    def create_session(self, record, preparation_id, consumed_at):
        for preparation in self.preparations.values():
            if preparation["preparationId"] == preparation_id:
                if preparation.get("consumedAt"):
                    raise SessionAuthorityError("preparation_invalid", "preparation_already_consumed", 409)
                preparation["consumedAt"] = consumed_at
        self.idempotency[record["idempotencyKey"]] = {"requestFingerprint": record["requestFingerprint"], "response": deepcopy(record["response"])}
        self.sessions[record["authoritativeSessionId"]] = deepcopy(record)
        return deepcopy(record)

    def get_authoritative_session(self, session_id):
        return deepcopy(self.sessions.get(session_id))

    def authoritative_target_id(self, session_id):
        session = self.sessions.get(session_id)
        return session["targetId"] if session else None

    def save(self, record):
        existing = self.preserved.get(record["sessionId"])
        if existing and existing["artifactSha256"] != record["artifactSha256"]:
            raise AssertionError("immutable preservation conflict")
        self.preserved[record["sessionId"]] = deepcopy(record)
        return deepcopy(record)

    def get(self, session_id):
        return deepcopy(self.preserved.get(session_id))

    def list(self):
        return [deepcopy(value) for value in self.preserved.values()]


def _session(target_id, resolver, store, key):
    prepared = prepare_session({"targetId": target_id, "missionFamily": "cueDrillOrchestration"}, store, now=NOW, execution_contract_resolver=resolver)
    return start_session({"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]}, store, idempotency_key=key, now=NOW, execution_contract_resolver=resolver)


def _act(session_id, resolver, sessions, stages, sequence, action, action_id):
    response = execute_authoritative_action(
        {"authoritativeSessionId": session_id, "actionId": action_id, "expectedSequence": sequence, "action": action},
        sessions, stages, resolver=resolver, now=NOW, seed_factory=lambda: "backend-owned-seed-001",
    )
    return response, response["sequenceNumber"]


def _preserve(target_id, session_id, result, sessions):
    artifact = {
        "sessionId": session_id, "authoritativeSessionId": session_id, "sessionIdAuthority": "backend",
        "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": result["missionFamily"], "resultPackageType": result["resultPackageType"]},
        "authorityPackage": result, "targetEvidenceImage": deepcopy(IMAGE), "savedToSEC": False,
    }
    saved = preserve_sec({"session": artifact}, sessions, now=NOW, execution_contract_resolver=TargetExecutionContractResolver(contracts()))
    return saved, read_preserved_sec(session_id, sessions)


def _complete(target_id, resolver, sessions, stages, index):
    started = _session(target_id, resolver, sessions, f"cue-idem-{index}")
    session_id, sequence = started["authoritativeSessionId"], 0
    response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "start_run", "imageEvidence": IMAGE}, f"{index}-start")
    planned = response["runState"]["plannedCueCount"]
    last_issue_payload = None
    for cue_index in range(planned):
        issue = {"type": "issue_or_declare_cue"}
        if target_id == FIXTURE_TARGET_IDS[2]:
            issue.update({"declaredCueId": "cue-left-external" if cue_index == 0 else "cue-right-external", "declaredBy": "instructor"})
        response, sequence = _act(session_id, resolver, sessions, stages, sequence, issue, f"{index}-issue-{cue_index}")
        last_issue_payload = deepcopy(response)
        cue_id = response["activeCue"]["cueId"]
        if target_id == FIXTURE_TARGET_IDS[0] and cue_index == 1:
            response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "record_no_observation"}, f"{index}-none-{cue_index}")
        else:
            if target_id == FIXTURE_TARGET_IDS[1]:
                observations = [{"xNorm": 0.5, "yNorm": 0.5}]
            else:
                observations = [{"xNorm": 0.25 if "left" in cue_id else 0.75, "yNorm": 0.5}]
            response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "record_response_evidence", "observations": observations}, f"{index}-record-{cue_index}")
        advance = {"type": "advance"}
        if target_id == FIXTURE_TARGET_IDS[1]:
            advance["practiceElapsedMs"] = 1200 + cue_index
        if target_id == FIXTURE_TARGET_IDS[2]:
            advance.update({"practiceElapsedMs": 2100 + cue_index, "declaredBy": "instructor"})
        response, sequence = _act(session_id, resolver, sessions, stages, sequence, advance, f"{index}-advance-{cue_index}")
    assert response["status"] == "complete"
    result = response["result"]
    saved, reopened = _preserve(target_id, session_id, result, sessions)
    return started, result, saved, reopened, last_issue_payload


def test_three_products_inherit_one_family_and_exact_reopen():
    packages = contracts()
    resolver = TargetExecutionContractResolver(packages)
    sessions, stages = MemoryStore(), MemoryStageEventStore()
    outcomes = [_complete(target_id, resolver, sessions, stages, index) for index, target_id in enumerate(FIXTURE_TARGET_IDS, start=1)]
    owners = [resolve_owner(resolver.resolve(target_id, "cueDrillOrchestration")) for target_id in FIXTURE_TARGET_IDS]
    assert {owner.executor_id for owner in owners} == {"cue-drill-orchestrator"}
    assert {owner.sec_adapter_family_id for owner in owners} == {"cue-drill-family"}
    for target_id, outcome in zip(FIXTURE_TARGET_IDS, outcomes):
        started, result, saved, reopened, _ = outcome
        assert result["target"]["id"] == target_id
        assert result["status"] == "complete"
        assert result["scoring"]["status"] == "not_applicable"
        assert result["timing"]["physicalShotTiming"]["status"] == "unavailable"
        assert saved["artifactSha256"] == reopened["artifactSha256"]
        assert reopened["session"]["authorityPackage"]["target"]["id"] == target_id
        assert reopened["session"]["targetEvidenceImage"]["dataUrl"] == IMAGE["dataUrl"]
        assert started["missionIdentity"]["missionFamily"] == "cueDrillOrchestration"
    fixed_result, memory_result, external_result = outcomes[0][1], outcomes[1][1], outcomes[2][1]
    assert fixed_result["reconciliation"]["missing"] == 1
    assert memory_result["randomization"]["authority"] == "backend"
    assert memory_result["reconciliation"]["ambiguous"] == memory_result["run"]["cueCount"]
    assert external_result["stages"][0]["source"] == "instructor_declared_external"
    assert external_result["stages"][0]["practiceTiming"]["source"] == "external_reported_timer"


def test_action_idempotency_sequence_and_terminal_preservation_fail_closed():
    resolver = TargetExecutionContractResolver(contracts())
    sessions, stages = MemoryStore(), MemoryStageEventStore()
    started = _session(FIXTURE_TARGET_IDS[0], resolver, sessions, "idempotency-session")
    session_id = started["authoritativeSessionId"]
    first, sequence = _act(session_id, resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE}, "same-action")
    replay, replay_sequence = _act(session_id, resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE}, "same-action")
    assert replay["idempotentReplay"] is True and replay_sequence == sequence
    try:
        _act(session_id, resolver, sessions, stages, 0, {"type": "issue_or_declare_cue"}, "stale-action")
    except ExecutionAuthorityError as exc:
        assert exc.payload["reason"] == "mission_action_sequence_mismatch"
    else:
        raise AssertionError("stale action admitted")
    contract = resolver.resolve(FIXTURE_TARGET_IDS[0], "cueDrillOrchestration")
    fake_result = {"ok": True, "authoritySource": "backend-authoritative", "missionFamily": "cueDrillOrchestration", "resultPackageType": "cueDrillResult", "resultPackageVersion": "1", "executionContract": {"contractId": contract["contractId"], "contractVersion": contract["contractVersion"], "contractFingerprint": contract["contractFingerprint"]}, "authoritativeSessionId": session_id}
    try:
        _preserve(FIXTURE_TARGET_IDS[0], session_id, fake_result, sessions)
    except PreservedSECError as exc:
        assert exc.payload["reason"] == "result_package_validation_failed"
    else:
        raise AssertionError("in-progress/unvalidated result preserved")


def test_stopped_incomplete_is_terminal_truthful_and_preservable():
    resolver = TargetExecutionContractResolver(contracts())
    sessions, stages = MemoryStore(), MemoryStageEventStore()
    started = _session(FIXTURE_TARGET_IDS[0], resolver, sessions, "stopped-session")
    session_id = started["authoritativeSessionId"]
    _, sequence = _act(session_id, resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE}, "stop-start")
    _, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "issue_or_declare_cue"}, "stop-issue")
    response, _ = _act(session_id, resolver, sessions, stages, sequence, {"type": "stop_run"}, "stop-terminal")
    result = response["result"]
    assert result["status"] == "stopped_incomplete"
    assert result["run"]["terminalStatus"] == "stopped_incomplete"
    assert result["run"]["cueCount"] == 0
    saved, reopened = _preserve(FIXTURE_TARGET_IDS[0], session_id, result, sessions)
    assert saved["artifactSha256"] == reopened["artifactSha256"]


def test_tampered_seed_order_and_result_hash_fail_validation():
    resolver = TargetExecutionContractResolver(contracts())
    sessions, stages = MemoryStore(), MemoryStageEventStore()
    _, result, _, _, _ = _complete(FIXTURE_TARGET_IDS[1], resolver, sessions, stages, 77)
    owner = resolve_owner(resolver.resolve(FIXTURE_TARGET_IDS[1], "cueDrillOrchestration"))
    for mutate in (
        lambda item: item["randomization"].update({"seed": "client-substituted"}),
        lambda item: item["randomization"]["generatedCueOrder"].reverse(),
        lambda item: item["reconciliation"].update({"observationCount": 999}),
    ):
        candidate = deepcopy(result)
        mutate(candidate)
        assert owner.validate_result(resolver.resolve(FIXTURE_TARGET_IDS[1], "cueDrillOrchestration"), candidate) is False


def test_multi_capability_resolution_remains_exact_and_independent():
    cue = contracts()[0]
    evidence = smart_evidence_contract(cue["targetProfile"]["id"], "Fixed Command Paper", "CUE-A01")
    evidence["contractId"] = "tec-fixture-cue-fixed-smart-evidence"
    resolver = TargetExecutionContractResolver((cue, evidence))
    assert resolver.resolve(cue["targetProfile"]["id"], "cueDrillOrchestration")["contractId"] == cue["contractId"]
    assert resolver.resolve(cue["targetProfile"]["id"], "smartEvidenceCapture")["contractId"] == evidence["contractId"]
    try:
        resolver.resolve(cue["targetProfile"]["id"])
    except TargetExecutionContractError as exc:
        assert exc.payload["reason"] == "execution_contract_ambiguous"
    else:
        raise AssertionError("multi-capability target resolved without mission family")


def test_profile_authority_and_physical_timing_fail_closed():
    original = contracts()[0]
    mutations = (
        (lambda item: item["components"]["mission"]["definition"].update({"cueSelectionMode": "client_script"}), "cue_drill_profile_mode_invalid"),
        (lambda item: item["components"]["mission"]["definition"]["timingPolicy"].update({"physicalShotTiming": "inferred"}), "cue_drill_timing_policy_invalid"),
        (lambda item: item["components"]["mission"]["definition"]["stages"][0]["cues"][0].update({"entityIds": ["unknown"]}), "cue_drill_geometry_entity_unavailable"),
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


def test_data_only_third_fixture_has_zero_target_id_production_edits():
    third = FIXTURE_TARGET_IDS[2].lower()
    for path in PRODUCTION_SURFACES:
        assert third not in path.read_text(encoding="utf-8").lower(), f"target-specific production edit detected in {path.name}"


if __name__ == "__main__":
    test_three_products_inherit_one_family_and_exact_reopen()
    test_action_idempotency_sequence_and_terminal_preservation_fail_closed()
    test_stopped_incomplete_is_terminal_truthful_and_preservable()
    test_tampered_seed_order_and_result_hash_fail_validation()
    test_multi_capability_resolution_remains_exact_and_independent()
    test_profile_authority_and_physical_timing_fail_closed()
    test_data_only_third_fixture_has_zero_target_id_production_edits()
    print("Cue/Drill three-fixture acceptance: PASS")
