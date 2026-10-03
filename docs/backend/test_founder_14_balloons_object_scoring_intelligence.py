#!/usr/bin/env python3
"""Founder #14 preflight: eight balloons, explicit SCZN3-derived X=10, three identities."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
import json
from pathlib import Path

from execution_authority import execute_authoritative_session
from executors.declarative_target_score import DeclarativeTargetScoreError, execute
from preserved_sec_store import list_preserved_secs, preserve_sec, read_preserved_sec
from session_authority import prepare_session, start_session
from target_execution_contract import TargetExecutionContractResolver, validate_contract
from test_target_execution_scale_architecture import MemoryStore


NOW = datetime(2026, 10, 3, 6, 0, tzinfo=timezone.utc)
ROOT = Path(__file__).parent
CONTRACT_ROOT = ROOT / "target_execution_contracts" / "contracts"
TREATMENT = ROOT.parent / "authority-evidence/platform/episode64-founder-walk-2026-10-02/FOUNDER_14_BALLOONS_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "4e2fc902b18f2afe9a2776fe6882871b4e263a529abe3ba98cfa8243fbb7023d"
FILES = (
    "blocker_baker_targets_gf_balloons_target_scoring_v1.json",
    "final_collection_baker_targets_pk_ladies_005_target_scoring_v1.json",
    "final_collection_baker_targets_pk_partypack_002_target_scoring_v1.json",
)
TARGETS = (
    "blocker_baker_targets_gf_balloons",
    "final_collection_baker_targets_pk_ladies_005",
    "final_collection_baker_targets_pk_partypack_002",
)
IMAGE = {"sha256": FACE_SHA, "widthPx": 741, "heightPx": 1000, "mediaType": "image/jpeg", "dataUrl": "data:image/jpeg;base64,/9j/"}
BALLOONS = (
    ("pink_upper_left", 145 / 741, 207 / 1000),
    ("green_top", 408 / 741, 154 / 1000),
    ("red_upper_right", 614 / 741, 280 / 1000),
    ("blue_middle_left", 286 / 741, 427 / 1000),
    ("yellow_middle_right", 490 / 741, 521 / 1000),
    ("purple_lower_left", 136 / 741, 650 / 1000),
    ("orange_lower_middle", 355 / 741, 788 / 1000),
    ("teal_lower_right", 600 / 741, 736 / 1000),
)
# Two X hits, then 9/8/7/6/5/9, followed by one outside observation.
RING_EXERCISE = (
    (BALLOONS[0][1], BALLOONS[0][2]),
    (BALLOONS[1][1], BALLOONS[1][2]),
    (BALLOONS[2][1] + 28 / 741, BALLOONS[2][2]),
    (BALLOONS[3][1] + 47 / 741, BALLOONS[3][2]),
    (BALLOONS[4][1] + 63 / 741, BALLOONS[4][2]),
    (BALLOONS[5][1] + 79 / 741, BALLOONS[5][2]),
    (BALLOONS[6][1] + 94 / 741, BALLOONS[6][2]),
    (BALLOONS[7][1] + 28 / 741, BALLOONS[7][2]),
    (0.95, 0.95),
)
EXPECTED_REGIONS = (
    "pink_upper_left_x", "green_top_x", "red_upper_right_9", "blue_middle_left_8",
    "yellow_middle_right_7", "purple_lower_left_6", "orange_lower_middle_5",
    "teal_lower_right_9", "outside",
)
EXPECTED_VALUES = (10.0, 10.0, 9.0, 8.0, 7.0, 6.0, 5.0, 9.0, None)


def contracts():
    return [validate_contract(json.loads((CONTRACT_ROOT / name).read_text(encoding="utf-8"))) for name in FILES]


def evidence(points=RING_EXERCISE):
    return {"imageEvidence": deepcopy(IMAGE), "observations": [{"xNorm": x, "yNorm": y} for x, y in points], "shooterDeclaredComplete": True}


def assert_mixed_result(result, target_id):
    assert result["target"]["id"] == target_id
    scoring = result["scoring"]
    assert scoring["model"] == "mixed_regions"
    assert scoring["observationCount"] == 9
    assert scoring["outsideCount"] == 1
    assert scoring["total"] == 64
    assert scoring["xCount"] == 2
    assert scoring["xScoring"]["mode"] == "sczn3_derived_numeric"
    assert scoring["xScoring"]["value"] == 10
    assert scoring["xScoring"]["derivationId"] == "sczn3-balloons-visible-descending-hierarchy-x10-v1"
    assert scoring["xScoring"]["publisherAttribution"] is False
    assert tuple(item["regionId"] for item in result["classifications"]) == EXPECTED_REGIONS
    assert tuple(item["value"] for item in result["classifications"]) == EXPECTED_VALUES
    assert result["classifications"][0]["label"].endswith("— X")
    assert result["classifications"][0]["countsAsHit"] is True
    assert len(scoring["objectResults"]) == 8
    assert all(item["hit"] is True and item["observationCount"] == 1 for item in scoring["objectResults"])
    assert [item["xCount"] for item in scoring["objectResults"]] == [1, 1, 0, 0, 0, 0, 0, 0]
    assert [item["score"] for item in scoring["objectResults"]] == [10, 10, 9, 8, 7, 6, 5, 9]
    assert result["sczn3Metrics"]["objectCoverage"] == {"objectsHit": 8, "scorableObjectCount": 8}
    assert result["sczn3Metrics"]["hitRate"] == {"validHitCount": 8, "governedShotCount": 9, "percentage": 88.9}
    distribution = scoring["valueDistribution"]
    assert distribution == [
        {"label": "X · SCZN3-derived 10", "value": 10, "hitCount": 2, "points": 20, "countsAsX": True, "valueAuthority": "sczn3_derived"},
        {"label": "9", "value": 9, "hitCount": 2, "points": 18, "countsAsX": False},
        {"label": "8", "value": 8, "hitCount": 1, "points": 8, "countsAsX": False},
        {"label": "7", "value": 7, "hitCount": 1, "points": 7, "countsAsX": False},
        {"label": "6", "value": 6, "hitCount": 1, "points": 6, "countsAsX": False},
        {"label": "5", "value": 5, "hitCount": 1, "points": 5, "countsAsX": False},
    ]
    treatment = result["smartTargetTreatment"]
    assert treatment["publisherObjective"] == "How many balloons are popped"
    assert treatment["xValueStatus"] == "sczn3_derived_10_not_publisher_attributed"
    assert treatment["fixedObservationCountStatus"] == "not_defined"
    assert treatment["requiredEngagementOrderStatus"] == "not_defined"
    assert treatment["winnerRuleStatus"] == "not_defined"


def test_canonical_face_population_and_shared_treatment():
    treatment = json.loads(TREATMENT.read_text(encoding="utf-8"))
    assert treatment["visibleStructure"] == {
        "balloonCount": 8,
        "nestedRegionsPerBalloon": ["X", "9", "8", "7", "6", "5"],
        "numericValues": [10, 9, 8, 7, 6, 5],
        "xNumericValue": 10,
        "xValueAuthority": "sczn3_derived",
    }
    assert len(treatment["geometry"]["regions"]) == 48
    assert len(treatment["scoring"]["regionRules"]) == 48
    resolved = contracts()
    assert {item["targetProfile"]["id"] for item in resolved} == set(TARGETS)
    for contract in resolved:
        assert contract["components"]["registration"]["definition"]["assetSha256"] == FACE_SHA
        assert contract["components"]["geometry"]["definition"] == treatment["geometry"]
        assert contract["components"]["scoring"]["definition"] == treatment["scoring"]
        assert contract["components"]["mission"]["definition"] == treatment["mission"]
        assert "exactObservations" not in contract["components"]["mission"]["definition"]


def test_x_numeric_rings_objects_and_outside_are_reconciled():
    for contract in contracts():
        assert_mixed_result(execute(contract, evidence()), contract["targetProfile"]["id"])
        x_only = execute(contract, evidence([(BALLOONS[0][1], BALLOONS[0][2])]))
        assert x_only["scoring"]["total"] == 10
        assert x_only["scoring"]["xCount"] == 1
        assert x_only["scoring"]["objectResults"][0]["hit"] is True
        assert x_only["scoring"]["objectResults"][0]["performancePercentage"] == 100.0
        outside = execute(contract, evidence([(0.95, 0.95)]))
        assert outside["scoring"]["total"] == 0 and outside["scoring"]["outsideCount"] == 1
        try:
            execute(contract, evidence([(BALLOONS[0][1], BALLOONS[0][2])] * 501))
        except DeclarativeTargetScoreError as exc:
            assert exc.payload == {"reason": "observation_limit_exceeded"}
        else:
            raise AssertionError("defensive observation maximum was not enforced")


def test_all_three_identities_complete_session_sec_vault_exact_reopen():
    resolved = contracts()
    resolver, store = TargetExecutionContractResolver(tuple(resolved)), MemoryStore()
    sessions = []
    for index, target_id in enumerate(TARGETS, start=1):
        prepared = prepare_session({"targetId": target_id, "missionFamily": "targetScoring"}, store, now=NOW, execution_contract_resolver=resolver)
        started = start_session(
            {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
            store, idempotency_key=f"founder-14-balloons-{index}", now=NOW, execution_contract_resolver=resolver,
        )
        result = execute_authoritative_session({"authoritativeSessionId": started["authoritativeSessionId"], "evidence": evidence()}, store, resolver=resolver)
        assert_mixed_result(result, target_id)
        artifact = {
            "sessionId": started["authoritativeSessionId"], "authoritativeSessionId": started["authoritativeSessionId"],
            "sessionIdAuthority": "backend", "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": "targetScoring", "resultPackageType": result["resultPackageType"]},
            "authorityPackage": result, "targetEvidenceImage": deepcopy(IMAGE), "savedToSEC": True,
            "savedAt": NOW.isoformat(), "preservedAt": NOW.isoformat(), "updatedAt": NOW.isoformat(),
        }
        saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
        reopened = read_preserved_sec(started["authoritativeSessionId"], store)
        assert saved["artifactSha256"] == reopened["artifactSha256"]
        assert reopened["session"]["authorityPackage"] == result
        assert_mixed_result(reopened["session"]["authorityPackage"], target_id)
        sessions.append(started["authoritativeSessionId"])
    vault = list_preserved_secs(store)
    assert [item["sessionId"] for item in vault["sessions"]] == sessions
    assert [item["authorityPackage"]["scoring"]["total"] for item in vault["sessions"]] == [64, 64, 64]
    assert [item["authorityPackage"]["scoring"]["xCount"] for item in vault["sessions"]] == [2, 2, 2]


def test_x_is_never_assigned_ten_without_explicit_structural_authority():
    contract = deepcopy(contracts()[0])
    scoring = contract["components"]["scoring"]["definition"]
    x_rule = scoring["regionRules"]["pink_upper_left_x"]
    x_rule.pop("value")
    x_rule["valueAuthority"] = "undefined"
    scoring.pop("xScoring")
    scoring["aggregateValueDistribution"] = False
    result = execute(contract, evidence([(BALLOONS[0][1], BALLOONS[0][2])]))
    assert result["scoring"]["total"] == 0
    assert result["scoring"]["xCount"] == 1
    assert result["classifications"][0]["value"] is None


if __name__ == "__main__":
    test_canonical_face_population_and_shared_treatment()
    test_x_numeric_rings_objects_and_outside_are_reconciled()
    test_all_three_identities_complete_session_sec_vault_exact_reopen()
    test_x_is_never_assigned_ten_without_explicit_structural_authority()
    print("PASS Founder 14 revised: 8 balloons, SCZN3-derived X=10, 9/8/7/6/5, outside count-only, no text-matched X inheritance, three identities, Session/SEC/Vault/exact reopen")
