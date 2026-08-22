#!/usr/bin/env python3
"""Founder acceptance for bounded Collection/Hand execution."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import ExecutionAuthorityError, execute_authoritative_action
from execution_capability_registry import resolve_owner
from preserved_sec_store import preserve_sec, read_preserved_sec
from session_authority import prepare_session, start_session
from stage_event_store import MemoryStageEventStore
from target_execution_contract import TargetExecutionContractError, TargetExecutionContractResolver, component_digest
from test_cue_drill_orchestrator import IMAGE, MemoryStore
from test_fixtures.collection_hand_scale import FIXTURE_TARGET_IDS, contracts


NOW = datetime(2026, 8, 20, 1, 20, tzinfo=timezone.utc)
BACKEND = Path(__file__).resolve().parent
PRODUCTION_SURFACES = (BACKEND / "server.py", BACKEND / "session_authority.py", BACKEND / "execution_authority.py", BACKEND / "execution_capability_registry.py", BACKEND / "stage_event_store.py", BACKEND.parent / "target_execution_runtime.js", BACKEND.parent / "sec_dispatch.js", BACKEND.parent / "sec_adapter_model.js", BACKEND.parent / "m4_runtime.js", BACKEND.parent / "target-experience.html")
POINTS = {"a": {"xNorm": .15, "yNorm": .5}, "b": {"xNorm": .45, "yNorm": .5}, "c": {"xNorm": .75, "yNorm": .5}, "outside": {"xNorm": .95, "yNorm": .95}}


def _session(target_id, resolver, sessions, key):
    prepared = prepare_session({"targetId": target_id, "missionFamily": "collectionHandEvaluation"}, sessions, now=NOW, execution_contract_resolver=resolver)
    return start_session({"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]}, sessions, idempotency_key=key, now=NOW, execution_contract_resolver=resolver)


def _act(session_id, resolver, sessions, stages, sequence, action, action_id):
    response = execute_authoritative_action({"authoritativeSessionId": session_id, "actionId": action_id, "expectedSequence": sequence, "action": action}, sessions, stages, resolver=resolver, now=NOW)
    return response, response["sequenceNumber"]


def _run(target_id, points, index, player_count=1):
    resolver, sessions, stages = TargetExecutionContractResolver(contracts()), MemoryStore(), MemoryStageEventStore()
    started = _session(target_id, resolver, sessions, f"collection-session-{index}"); session_id, sequence = started["authoritativeSessionId"], 0
    response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "start_run", "imageEvidence": IMAGE, "playerCount": player_count}, f"{index}-start")
    for turn, point in enumerate(points, start=1):
        active = response["runState"]["activePlayerId"]
        response, sequence = _act(session_id, resolver, sessions, stages, sequence, {"type": "record_turn_observation", "playerId": active, "observations": [POINTS[point]]}, f"{index}-turn-{turn}")
    result = response["result"]
    artifact = {"sessionId": session_id, "authoritativeSessionId": session_id, "sessionIdAuthority": "backend", "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": result["missionFamily"], "resultPackageType": result["resultPackageType"]}, "authorityPackage": result, "targetEvidenceImage": deepcopy(IMAGE), "savedToSEC": False}
    saved = preserve_sec({"session": artifact}, sessions, now=NOW, execution_contract_resolver=resolver)
    return resolver, result, saved, read_preserved_sec(session_id, sessions)


def test_three_fixtures_and_exact_reopen():
    cases = ((FIXTURE_TARGET_IDS[0], ["a", "b", "c"], 1, "publisher-triple"), (FIXTURE_TARGET_IDS[1], ["a", "b", "a", "c"], 2, "publisher-pair-a"), (FIXTURE_TARGET_IDS[2], ["b", "c"], 1, "publisher-data-pair"))
    for index, (target_id, points, players, expected) in enumerate(cases, start=1):
        resolver, result, saved, reopened = _run(target_id, points, index, players)
        assert result["claim"]["displayLabel"] == "Publisher-Defined Collection/Hand Result — Not a General Game Judgment"
        assert any(player["hand"]["handClassId"] == expected for player in result["players"])
        assert result["claim"]["generalGameJudgmentStatus"] == "not_established" and result["claim"]["conventionalPokerMeaningStatus"] == "not_established"
        assert result["scoring"]["status"] == "not_applicable" and result["timing"]["physicalShotTiming"]["status"] == "unavailable"
        assert saved["artifactSha256"] == reopened["artifactSha256"] and reopened["session"]["authorityPackage"] == result
        assert resolve_owner(resolver.resolve(target_id, "collectionHandEvaluation")).executor_id == "collection-hand-evaluator"
    assert _run(FIXTURE_TARGET_IDS[1], ["a", "b", "a", "c"], 22, 2)[1]["comparison"] == {"status": "winner", "winnerPlayerId": "player-1", "tiedPlayerIds": []}


def test_provenance_and_exact_result_generation():
    resolver, result, _, _ = _run(FIXTURE_TARGET_IDS[0], ["a", "b", "c"], 30)
    assert [item["collectionMember"]["collectionMemberId"] for item in result["observations"]] == ["member-a", "member-b", "member-c"]
    assert result["players"][0]["hand"]["publisherLabel"] == "Publisher Triple Collection"
    assert all(item["collectionMember"]["sourceReference"].startswith("synthetic://collection-hand/") for item in result["observations"])
    assert result["profile"]["sourceDocuments"][0]["sha256"] == "c" * 64 and result["authorityTrace"]["collectionHandProfileAuthority"] == "COLLECTION-HAND-SYNTHETIC-AUTHORITY"


def test_invalid_incomplete_tampered_authority_refuses():
    original = contracts()[0]
    for mutate, reason in ((lambda item: item["components"]["mission"]["definition"]["lifecycle"].update({"suspended": True}), "collection_hand_profile_authority_inactive"), (lambda item: item["components"]["mission"]["definition"]["componentBindings"].update({"geometryDigest": "0" * 64}), "collection_hand_component_binding_invalid"), (lambda item: item["components"]["mission"]["definition"]["handPatterns"][0].update({"requiredMemberIds": ["member-a", "missing", "member-c"]}), "collection_hand_pattern_invalid")):
        candidate = deepcopy(original); mutate(candidate); candidate["components"]["mission"]["digest"] = component_digest(candidate["components"]["mission"])
        resolver, sessions, stages = TargetExecutionContractResolver((candidate,)), MemoryStore(), MemoryStageEventStore(); started = _session(candidate["targetProfile"]["id"], resolver, sessions, reason)
        try: _act(started["authoritativeSessionId"], resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE, "playerCount": 1}, reason)
        except ExecutionAuthorityError as exc: assert exc.payload["reason"] == reason
        else: raise AssertionError(f"invalid authority admitted: {reason}")
    resolver, result, _, _ = _run(FIXTURE_TARGET_IDS[0], ["a", "b", "c"], 31); contract = resolver.resolve(FIXTURE_TARGET_IDS[0], "collectionHandEvaluation"); owner = resolve_owner(contract)
    for mutate in (lambda item: item["claim"].update({"generalGameJudgmentStatus": "established"}), lambda item: item["players"][0]["hand"].update({"publisherLabel": "Conventional Royal Flush"}), lambda item: item["comparison"].update({"winnerPlayerId": "player-99"})):
        candidate = deepcopy(result); mutate(candidate); assert owner.validate_result(contract, candidate) is False


def test_turn_duplicate_unclassified_and_stop_boundaries():
    resolver, sessions, stages = TargetExecutionContractResolver(contracts()), MemoryStore(), MemoryStageEventStore(); started = _session(FIXTURE_TARGET_IDS[1], resolver, sessions, "turn-order"); sid = started["authoritativeSessionId"]
    response, sequence = _act(sid, resolver, sessions, stages, 0, {"type": "start_run", "imageEvidence": IMAGE, "playerCount": 2}, "turn-start")
    try: _act(sid, resolver, sessions, stages, sequence, {"type": "record_turn_observation", "playerId": "player-2", "observations": [POINTS["a"]]}, "out-of-turn")
    except ExecutionAuthorityError as exc: assert exc.payload["reason"] == "collection_hand_turn_order_invalid"
    else: raise AssertionError("out-of-turn evidence admitted")
    stopped, _ = _act(sid, resolver, sessions, stages, sequence, {"type": "stop_run"}, "stop")
    assert stopped["result"]["status"] == "stopped_incomplete" and all(player["hand"]["status"] == "incomplete" for player in stopped["result"]["players"])
    try: _run(FIXTURE_TARGET_IDS[2], ["b", "b"], 40)
    except ExecutionAuthorityError as exc: assert exc.payload["reason"] == "collection_hand_duplicate_member_rejected"
    else: raise AssertionError("disallowed duplicate admitted")


def test_baker_blocked_no_general_engine_and_data_only_zero_id():
    try: TargetExecutionContractResolver(contracts()).resolve("baker_poker_wheel", "collectionHandEvaluation")
    except TargetExecutionContractError as exc: assert exc.payload["reason"] == "execution_contract_unavailable"
    else: raise AssertionError("Baker Poker Wheel admitted without printed guide")
    source = (BACKEND / "executors" / "collection_hand_evaluator.py").read_text(encoding="utf-8").lower()
    for forbidden in ("cue_drill_orchestrator", "recreational_challenge", "path engine", "board engine", "deck engine", "casino engine"):
        assert forbidden not in source
    third = FIXTURE_TARGET_IDS[2].lower()
    for path in PRODUCTION_SURFACES: assert third not in path.read_text(encoding="utf-8").lower(), f"target-specific production edit detected in {path.name}"


if __name__ == "__main__":
    test_three_fixtures_and_exact_reopen(); test_provenance_and_exact_result_generation(); test_invalid_incomplete_tampered_authority_refuses(); test_turn_duplicate_unclassified_and_stop_boundaries(); test_baker_blocked_no_general_engine_and_data_only_zero_id()
    print("Collection/Hand three-fixture acceptance: PASS")
