#!/usr/bin/env python3
"""Reusable family executor contracts independent of publisher and target identity."""
from __future__ import annotations

from copy import deepcopy

from execution_capability_registry import CapabilityRegistryError, execute, resolve_owner, validate_result
from target_execution_contract import TargetExecutionContractResolver, component_digest
from test_fixtures.target_execution_scale import smart_evidence_contract


def _redigest(contract):
    for component in contract["components"].values():
        component["digest"] = component_digest(component)
    return contract


def precision_contract():
    contract = smart_evidence_contract("fixture_precision_family", "Precision Family", "SYN-P01")
    contract.update({
        "contractId": "tec-fixture-precision-family",
        "missionFamily": "precisionRingScore",
        "resultPackageType": "precisionScoreResult",
        "resultPackageVersion": "1",
        "executor": {"id": "precision-open-score", "version": "1"},
        "secAdapter": {"id": "precision-open-score-family", "version": "1", "scoringPresentationFamily": "precision_open"},
        "preservationValidator": {"id": "precision-open-score-preservation", "version": "1"},
    })
    contract["components"]["geometry"]["definition"] = {"zones": [
        {"zoneId": "inner", "shape": "circle", "cx": .5, "cy": .5, "radius": .2, "priority": 2},
        {"zoneId": "outer", "shape": "circle", "cx": .5, "cy": .5, "radius": .45, "priority": 1},
    ]}
    contract["components"]["scoring"]["definition"] = {"zoneValues": {"inner": 10, "outer": 5, "outside": -1}}
    contract["components"]["mission"]["definition"] = {"missionFamily": "precisionRingScore", "resultPackageType": "precisionScoreResult", "resultPackageVersion": "1", "completion": "shooter_controlled_open"}
    return _redigest(contract)


def challenge_contract():
    contract = smart_evidence_contract("fixture_challenge_family", "Challenge Family", "SYN-C01")
    contract.update({
        "contractId": "tec-fixture-challenge-family",
        "missionFamily": "recreationalChallenge",
        "resultPackageType": "challengeResult",
        "resultPackageVersion": "1",
        "executor": {"id": "recreational-challenge", "version": "1"},
        "secAdapter": {"id": "recreational-challenge-family", "version": "1", "scoringPresentationFamily": "challenge"},
        "preservationValidator": {"id": "recreational-challenge-preservation", "version": "1"},
    })
    contract["components"]["geometry"]["definition"] = {"entities": [
        {"entityId": "alpha-entity", "sideId": "alpha", "shape": "circle", "cx": .25, "cy": .5, "radius": .15, "requiredHits": 1},
        {"entityId": "bravo-entity", "sideId": "bravo", "shape": "circle", "cx": .75, "cy": .5, "radius": .15, "requiredHits": 1},
    ]}
    contract["components"]["scoring"]["definition"] = {"status": "not_applicable", "reason": "challenge_state_not_numeric_score"}
    contract["components"]["mission"]["definition"] = {
        "missionFamily": "recreationalChallenge", "resultPackageType": "challengeResult", "resultPackageVersion": "1",
        "players": [{"playerId": "p1", "sideId": "alpha"}, {"playerId": "p2", "sideId": "bravo"}],
        "alternateTurns": True, "terminalCondition": "all_opposing_entities_complete",
    }
    return _redigest(contract)


def test_precision_open_score_family():
    contract = TargetExecutionContractResolver((precision_contract(),)).resolve("fixture_precision_family")
    result = execute(contract, {"observations": [{"xNorm": .5, "yNorm": .5, "groupId": "g1"}, {"xNorm": .9, "yNorm": .9, "groupId": "g1"}], "shooterDeclaredComplete": True})
    assert result["scoring"] == {"status": "complete", "total": 9.0, "groupTotals": {"g1": 9.0}, "completion": "shooter_declared"}
    assert validate_result(contract, result)


def test_bounded_recreational_challenge_family():
    contract = TargetExecutionContractResolver((challenge_contract(),)).resolve("fixture_challenge_family")
    result = execute(contract, {"events": [{"playerId": "p1", "xNorm": .75, "yNorm": .5}]})
    assert result["challenge"] == {"status": "complete", "winnerPlayerId": "p1"}
    assert validate_result(contract, result)


def test_family_owner_binding_fails_closed():
    contract = TargetExecutionContractResolver((precision_contract(),)).resolve("fixture_precision_family")
    contract["executor"] = {"id": "smart-evidence-capture", "version": "1"}
    try:
        resolve_owner(contract)
    except CapabilityRegistryError as exc:
        assert str(exc) == "executor_contract_mismatch"
    else:
        raise AssertionError("incompatible family owner was admitted")


if __name__ == "__main__":
    test_precision_open_score_family()
    test_bounded_recreational_challenge_family()
    test_family_owner_binding_fails_closed()
    print("Execution capability families: PASS")
    print("- precision/open score and bounded recreational challenge execute from governed component data")
    print("- incompatible executor binding fails closed")
