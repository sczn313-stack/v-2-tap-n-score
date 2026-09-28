#!/usr/bin/env python3
"""Founder acceptance: new products inherit execution with zero target-ID production edits."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import ExecutionAuthorityError, execute_authoritative_session
from execution_capability_registry import resolve_owner
from preserved_sec_store import preserve_sec, read_preserved_sec
from session_authority import SessionAuthorityError, digest, prepare_session, start_session
from target_execution_contract import TargetExecutionContractError, TargetExecutionContractResolver, component_digest
from test_fixtures.target_execution_scale import FIXTURE_TARGET_IDS, contracts


NOW = datetime(2026, 8, 19, 1, 0, tzinfo=timezone.utc)
BACKEND = Path(__file__).resolve().parent
PRODUCTION_SURFACES = (
    BACKEND / "session_authority.py",
    BACKEND / "execution_authority.py",
    BACKEND / "execution_capability_registry.py",
    BACKEND / "preserved_sec_store.py",
    BACKEND.parent / "target_execution_runtime.js",
    BACKEND.parent / "sec_dispatch.js",
    BACKEND.parent / "m4_runtime.js",
    BACKEND.parent / "target_experiences.js",
)


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
        return deepcopy(self.preserved[record["sessionId"]])

    def get(self, session_id):
        return deepcopy(self.preserved.get(session_id))

    def list(self):
        return [deepcopy(value) for value in self.preserved.values()]


def _execute_product(target_id, resolver, store, key):
    prepared = prepare_session({"targetId": target_id, "missionFamily": "smartEvidenceCapture"}, store, now=NOW, execution_contract_resolver=resolver)
    started = start_session({"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]}, store, idempotency_key=key, now=NOW, execution_contract_resolver=resolver)
    result = execute_authoritative_session({
        "authoritativeSessionId": started["authoritativeSessionId"],
        "evidence": {
            "imageEvidence": {"sha256": "a" * 64, "widthPx": 900, "heightPx": 1200, "mediaType": "image/svg+xml", "dataUrl": "data:image/svg+xml;base64,PHN2Zy8+"},
            "observations": [{"xNorm": 0.25, "yNorm": 0.35}, {"xNorm": 0.75, "yNorm": 0.65}],
            "shooterDeclaredAimPoint": {"xNorm": 0.5, "yNorm": 0.5},
        },
    }, store, resolver=resolver)
    artifact = {
        "sessionId": started["authoritativeSessionId"],
        "authoritativeSessionId": started["authoritativeSessionId"],
        "sessionIdAuthority": "backend",
        "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": result["missionFamily"], "resultPackageType": result["resultPackageType"]},
        "authorityPackage": result,
        "targetEvidenceImage": {"dataUrl": "data:image/svg+xml;base64,PHN2Zy8+", "sha256": "a" * 64},
        "savedToSEC": False,
    }
    saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
    reopened = read_preserved_sec(started["authoritativeSessionId"], store)
    return prepared, started, result, saved, reopened


def test_two_products_inherit_same_family_executor_and_exact_sec_reopen():
    resolver = TargetExecutionContractResolver(contracts())
    store = MemoryStore()
    outcomes = [_execute_product(target_id, resolver, store, f"idem-{index}") for index, target_id in enumerate(FIXTURE_TARGET_IDS, start=1)]
    contracts_by_target = [resolver.resolve(target_id, "smartEvidenceCapture") for target_id in FIXTURE_TARGET_IDS]
    owners = [resolve_owner(contract) for contract in contracts_by_target]
    assert {owner.executor_id for owner in owners} == {"smart-evidence-capture"}
    assert {owner.sec_adapter_family_id for owner in owners} == {"smart-evidence-family"}
    for target_id, outcome in zip(FIXTURE_TARGET_IDS, outcomes):
        prepared, started, result, saved, reopened = outcome
        assert prepared["target"]["targetId"] == target_id
        assert started["missionIdentity"]["executionContract"]["contractFingerprint"] == result["executionContract"]["contractFingerprint"]
        assert result["target"]["id"] == target_id
        assert result["reconciliation"]["capturedObservationCount"] == 2
        assert saved["artifactSha256"] == reopened["artifactSha256"]
        assert reopened["session"]["authorityPackage"]["target"]["id"] == target_id
        assert reopened["session"]["authorityPackage"]["target"]["product"]["sku"] in {"SYN-A01", "SYN-B02"}


def test_fixture_target_ids_do_not_exist_on_production_routing_surfaces():
    for path in PRODUCTION_SURFACES:
        source = path.read_text(encoding="utf-8").lower()
        for target_id in FIXTURE_TARGET_IDS:
            assert target_id not in source, f"target-specific production edit detected in {path.name}: {target_id}"


def test_contracts_fail_closed_for_missing_suspended_tampered_or_incompatible_authority():
    original = contracts()[0]
    resolver = TargetExecutionContractResolver((original,))
    try:
        resolver.resolve("not_registered", "smartEvidenceCapture")
    except TargetExecutionContractError as exc:
        assert exc.payload["reason"] == "execution_contract_unavailable"
    else:
        raise AssertionError("missing contract was admitted")

    for mutate, reason in (
        (lambda value: value.update({"lifecycleStatus": "suspended"}), "contract_not_supported"),
        (lambda value: value.update({"supportStatus": "unavailable"}), "contract_not_supported"),
        (lambda value: value["components"]["mission"].update({"digest": "0" * 64}), "component_digest_mismatch"),
        (lambda value: value.update({"resultPackageType": "challengeResult"}), "result_package_not_authorized_by_mission_family"),
        (lambda value: value["components"]["registration"]["definition"].update({"role": "display_only"}), "registration_role_not_executable"),
        (lambda value: value.update({"executor": {"id": "precision-open-score", "version": "1"}}), "executor_contract_mismatch"),
    ):
        candidate = deepcopy(original)
        mutate(candidate)
        if reason == "registration_role_not_executable":
            candidate["components"]["registration"]["digest"] = component_digest(candidate["components"]["registration"])
        try:
            TargetExecutionContractResolver((candidate,))
        except TargetExecutionContractError as exc:
            assert exc.payload["reason"] == reason
        else:
            raise AssertionError(f"invalid contract admitted: {reason}")

    second = deepcopy(original)
    second["contractId"] = "tec-ambiguous-second"
    ambiguous = TargetExecutionContractResolver((original, second))
    try:
        ambiguous.resolve(original["targetProfile"]["id"], "smartEvidenceCapture")
    except TargetExecutionContractError as exc:
        assert exc.payload["reason"] == "execution_contract_ambiguous"
    else:
        raise AssertionError("ambiguous contract tuple was admitted")

    zeroing = deepcopy(original)
    zeroing["missionFamily"] = "zeroingCorrection"
    try:
        TargetExecutionContractResolver((zeroing,))
    except TargetExecutionContractError as exc:
        assert exc.payload["reason"] == "zeroing_authority_isolated"
    else:
        raise AssertionError("zeroing fell through Target Authority")


if __name__ == "__main__":
    test_two_products_inherit_same_family_executor_and_exact_sec_reopen()
    test_fixture_target_ids_do_not_exist_on_production_routing_surfaces()
    test_contracts_fail_closed_for_missing_suspended_tampered_or_incompatible_authority()
    print("Target Execution Scale Architecture acceptance: PASS")
    print("- two distinct products inherited smart-evidence-capture + smart-evidence-family")
    print("- exact immutable SEC reopen preserved both publisher product identities")
    print("- fixture target IDs appear in zero production routing surfaces")
    print("- missing, unavailable, suspended, tampered, incompatible, and ambiguous authority failed closed")
    print("- zeroing remained isolated from Target Authority")
