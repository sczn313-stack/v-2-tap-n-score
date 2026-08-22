#!/usr/bin/env python3
"""Founder acceptance for immutable cross-session SEC progression."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from progression_record_store import MemoryProgressionRecordStore
from sec_progression_authority import SECProgressionAuthorityError, SyntheticProgressionSubjectAuthority, UnavailableProgressionSubjectAuthority, evaluate_progression, reopen_progression
from session_authority import SessionAuthorityError, prepare_session
from target_execution_contract import TargetExecutionContractError, TargetExecutionContractResolver, component_digest
from test_cue_drill_orchestrator import MemoryStore
from test_fixtures.sec_progression_scale import FIXTURE_TARGET_IDS, SUBJECT_ID, SUBJECT_TOKEN, contracts, progression_v2_contract, source_record, source_records


NOW = datetime(2026, 8, 20, 2, 0, tzinfo=timezone.utc)
BACKEND = Path(__file__).resolve().parent
PRODUCTION_SURFACES = (BACKEND / "server.py", BACKEND / "session_authority.py", BACKEND / "execution_capability_registry.py", BACKEND / "sec_progression_authority.py", BACKEND / "progression_record_store.py", BACKEND.parent / "target_execution_runtime.js", BACKEND.parent / "sec_dispatch.js", BACKEND.parent / "m4_runtime.js", BACKEND.parent / "records.html")


class SECStore:
    def __init__(self, records): self.records = {item["sessionId"]: deepcopy(item) for item in records}
    def get(self, session_id): return deepcopy(self.records.get(session_id))


def _run(target_id, source_ids, resolver, secs, records, key, prior=None, token=SUBJECT_TOKEN, id_value="SCZN3-PROGRESSION-TEST000000000001"):
    return evaluate_progression({"targetProfileId": target_id, "missionFamily": "secProgressionEvaluation", "sourceSessionIds": source_ids, "idempotencyKey": key, "expectedPriorProgressionEvaluationId": prior, "subjectAuthorityToken": token}, secs, records, SyntheticProgressionSubjectAuthority({SUBJECT_TOKEN: SUBJECT_ID}), resolver=resolver, now=NOW, id_factory=lambda: id_value)


def test_three_programs_advance_and_reopen_exactly():
    resolver, secs, records = TargetExecutionContractResolver(contracts()), SECStore(source_records()), MemoryProgressionRecordStore()
    cases = ((FIXTURE_TARGET_IDS[0], ["precision-1", "precision-2"]), (FIXTURE_TARGET_IDS[1], ["qualification-1", "qualification-2"]), (FIXTURE_TARGET_IDS[2], ["data-1"]))
    for index, (target_id, sources) in enumerate(cases, start=1):
        response = _run(target_id, sources, resolver, secs, records, f"program-{index}", id_value=f"SCZN3-PROGRESSION-TEST{index:012d}")
        result = response["result"]
        assert result["transition"]["outcome"] == "advanced" and result["resultingLevel"]["levelId"] == "level-1"
        assert result["claim"]["displayLabel"] == "Governed Progression Result — Derived from Preserved SECs"
        assert result["claim"]["officialQualificationStatus"] == "not_established" and result["claim"]["verifiedIdentityStatus"] == "not_established"
        reopened = reopen_progression(response["progressionEvaluationId"], records)
        assert reopened["resultHash"] == response["resultHash"] and reopened["result"] == result


def test_source_secs_immutable_and_provenance_exact():
    source = source_records(); before = deepcopy(source)
    resolver, secs, records = TargetExecutionContractResolver(contracts()), SECStore(source), MemoryProgressionRecordStore()
    response = _run(FIXTURE_TARGET_IDS[0], ["precision-1", "precision-2"], resolver, secs, records, "immutability", id_value="SCZN3-PROGRESSION-IMMUTABLE01")
    assert source == before
    provenance = response["result"]["sourceSECs"]["eligible"]
    assert [(item["sessionId"], item["artifactSha256"], item["resultHash"]) for item in provenance] == [(item["sessionId"], item["artifactSha256"], item["artifact"]["authorityPackage"]["resultHash"]) for item in before[:2]]


def test_single_use_stale_concurrency_and_idempotency():
    resolver, secs, records = TargetExecutionContractResolver(contracts()), SECStore(source_records()), MemoryProgressionRecordStore()
    first = _run(FIXTURE_TARGET_IDS[2], ["data-1"], resolver, secs, records, "first", id_value="SCZN3-PROGRESSION-SINGLEUSE01")
    replay = _run(FIXTURE_TARGET_IDS[2], ["data-1"], resolver, secs, records, "first", id_value="SCZN3-PROGRESSION-IGNORED000")
    assert replay["idempotentReplay"] is True and replay["resultHash"] == first["resultHash"]
    second = _run(FIXTURE_TARGET_IDS[2], ["data-1"], resolver, secs, records, "second", first["progressionEvaluationId"], id_value="SCZN3-PROGRESSION-SINGLEUSE02")
    assert second["result"]["transition"]["outcome"] == "ineligible_inputs" and second["result"]["sourceSECs"]["ineligible"][0]["reason"] == "source_sec_already_consumed"
    try: _run(FIXTURE_TARGET_IDS[2], ["data-1"], resolver, secs, records, "stale", None, id_value="SCZN3-PROGRESSION-STALE000001")
    except SECProgressionAuthorityError as exc: assert exc.payload["reason"] == "progression_prior_record_conflict"
    else: raise AssertionError("stale progression transition admitted")


def test_profile_version_isolation_no_recompute():
    source = source_records(); secs, records = SECStore(source), MemoryProgressionRecordStore()
    v1 = _run(FIXTURE_TARGET_IDS[0], ["precision-1", "precision-2"], TargetExecutionContractResolver((contracts()[0],)), secs, records, "v1", id_value="SCZN3-PROGRESSION-VERSION0001")
    v1_frozen = deepcopy(v1)
    v2 = _run(FIXTURE_TARGET_IDS[0], ["precision-1", "precision-2"], TargetExecutionContractResolver((progression_v2_contract(),)), secs, records, "v2", id_value="SCZN3-PROGRESSION-VERSION0002")
    assert v1 == v1_frozen and v1["result"]["transition"]["outcome"] == "advanced" and v2["result"]["transition"]["outcome"] == "held"
    assert v1["result"]["profile"]["profileVersion"] == "1" and v2["result"]["profile"]["profileVersion"] == "2"


def test_tamper_arbitrary_adapter_baker_and_subject_fail_closed():
    all_sources = list(source_records())
    tampered = deepcopy(all_sources[0]); tampered["artifact"]["authorityPackage"]["scoring"]["total"] = 999
    resolver, records = TargetExecutionContractResolver(contracts()), MemoryProgressionRecordStore()
    response = _run(FIXTURE_TARGET_IDS[0], ["precision-1"], resolver, SECStore((tampered,)), records, "tamper", id_value="SCZN3-PROGRESSION-TAMPER0001")
    assert response["result"]["transition"]["outcome"] == "ineligible_inputs" and response["result"]["sourceSECs"]["ineligible"][0]["reason"] == "progression_source_artifact_hash_mismatch"
    candidate = deepcopy(contracts()[0]); candidate["components"]["mission"]["definition"]["inputEligibility"]["factAdapterId"] = "client.json.path"; candidate["components"]["mission"]["definition"]["levels"][1]["advanceCondition"]["factId"] = "client.json.path"; candidate["components"]["mission"]["digest"] = component_digest(candidate["components"]["mission"])
    try: _run(candidate["targetProfile"]["id"], ["precision-1"], TargetExecutionContractResolver((candidate,)), SECStore(all_sources), MemoryProgressionRecordStore(), "arbitrary")
    except SECProgressionAuthorityError as exc: assert exc.payload["reason"] == "progression_fact_adapter_unavailable"
    else: raise AssertionError("arbitrary fact path admitted")
    try: TargetExecutionContractResolver(contracts()).resolve("baker_bullseye_challenge", "secProgressionEvaluation")
    except TargetExecutionContractError as exc: assert exc.payload["reason"] == "execution_contract_unavailable"
    else: raise AssertionError("Baker progression admitted without authoritative guide")
    try: evaluate_progression({"targetProfileId": FIXTURE_TARGET_IDS[0], "missionFamily": "secProgressionEvaluation", "sourceSessionIds": ["precision-1"], "idempotencyKey": "production", "subjectAuthorityToken": "browser-local"}, SECStore(all_sources), MemoryProgressionRecordStore(), UnavailableProgressionSubjectAuthority(), resolver=resolver)
    except SECProgressionAuthorityError as exc: assert exc.payload["reason"] == "production_progression_subject_authority_unavailable"
    else: raise AssertionError("browser-local subject identity admitted")


def test_data_only_third_program_has_zero_target_id_production_edits():
    third = FIXTURE_TARGET_IDS[2].lower()
    for path in PRODUCTION_SURFACES: assert third not in path.read_text(encoding="utf-8").lower(), f"target-specific production edit detected in {path.name}"


def test_progression_cannot_fabricate_a_shooting_session():
    try: prepare_session({"targetId": FIXTURE_TARGET_IDS[0], "missionFamily": "secProgressionEvaluation"}, MemoryStore(), now=NOW, execution_contract_resolver=TargetExecutionContractResolver(contracts()))
    except SessionAuthorityError as exc: assert exc.payload["reason"] == "cross_session_progression_route_required"
    else: raise AssertionError("progression fabricated a shooting session")


if __name__ == "__main__":
    test_three_programs_advance_and_reopen_exactly(); test_source_secs_immutable_and_provenance_exact(); test_single_use_stale_concurrency_and_idempotency(); test_profile_version_isolation_no_recompute(); test_tamper_arbitrary_adapter_baker_and_subject_fail_closed(); test_data_only_third_program_has_zero_target_id_production_edits(); test_progression_cannot_fabricate_a_shooting_session()
    print("SEC Progression three-program acceptance: PASS")
