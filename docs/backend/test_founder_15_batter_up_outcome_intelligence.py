#!/usr/bin/env python3
"""Founder #15 gate: Batter Up reports publisher outcomes without inventing a game."""
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


NOW = datetime(2026, 10, 3, 15, 0, tzinfo=timezone.utc)
ROOT = Path(__file__).parent
CONTRACT_FILE = ROOT / "target_execution_contracts/contracts/blocker_baker_targets_gf_batterup_target_scoring_v1.json"
TREATMENT_FILE = ROOT.parent / "authority-evidence/platform/episode64-founder-walk-2026-10-02/FOUNDER_15_BATTER_UP_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "e1a7ed4757478eaf3b281c0ecefea6c44af286e048f90127b9ae5d0a5be0e8f3"
TARGET_ID = "blocker_baker_targets_gf_batterup"
IMAGE = {"sha256": FACE_SHA, "widthPx": 1141, "heightPx": 1523, "mediaType": "image/jpeg", "dataUrl": "data:image/jpeg;base64,/9j/"}

# Mixed publisher outcomes plus one observation outside the governed playing field.
EXERCISE = [
    (98 / 1141, 153 / 1523),       # HOME RUN ball
    (570 / 1141, 302 / 1523),      # TRIPLE ball
    (166 / 1141, 610 / 1523),      # DOUBLE ball
    (570 / 1141, 549 / 1523),      # SINGLE ball
    (570 / 1141, 1270 / 1523),     # BASE ON BALLS ball
    (356 / 1141, 507 / 1523),      # OUT ball
    (570 / 1141, 430 / 1523),      # outfield STRIKE
    (100 / 1141, 1150 / 1523),     # left FOUL BALL area
    (888 / 1141, 1033 / 1523),     # 1st-base safe center
    (950 / 1141, 1033 / 1523),     # 1st-base red OUT ring
    (570 / 1141, 1030 / 1523),     # pitcher OUT
    (0.50, 0.02),                  # outside all governed regions
]
EXPECTED_REGIONS = [
    "home_run_left", "triple_center", "double_left", "single_center", "base_on_balls",
    "out_ball_left", "outfield_strike", "foul_ball_left", "first_base_safe_center",
    "first_base_out_ring", "pitcher_out", "outside",
]
EXPECTED_OUTCOMES = {
    "home_run": 1,
    "triple": 1,
    "double": 1,
    "single": 1,
    "base_on_balls": 1,
    "safe_base_center": 1,
    "strike": 1,
    "foul_ball": 1,
    "out": 3,
}


def contract():
    return validate_contract(json.loads(CONTRACT_FILE.read_text(encoding="utf-8")))


def evidence(points=EXERCISE):
    return {
        "imageEvidence": deepcopy(IMAGE),
        "observations": [{"xNorm": x, "yNorm": y} for x, y in points],
        "shooterDeclaredComplete": True,
    }


def outcome_counts(scoring):
    dimension = next(item for item in scoring["summaryResults"] if item["dimensionId"] == "baseball_outcome")
    return {item["groupId"]: item["observationCount"] for item in dimension["groups"]}


def assert_result(result):
    assert result["target"]["id"] == TARGET_ID
    scoring = result["scoring"]
    assert scoring["model"] == "named_regions"
    assert scoring["observationCount"] == 12
    assert scoring["classifiedObservationCount"] == 12
    assert scoring["unclassifiedObservationCount"] == 0
    assert scoring["outsideCount"] == 1
    assert "total" not in scoring
    assert [item["regionId"] for item in result["classifications"]] == EXPECTED_REGIONS
    assert all(item["value"] is None for item in result["classifications"])
    assert all(item["countsAsHit"] is True for item in result["classifications"][:-1])
    assert result["classifications"][-1]["countsAsHit"] is False
    assert outcome_counts(scoring) == EXPECTED_OUTCOMES
    assert result["sczn3Metrics"]["hitRate"] == {"validHitCount": 11, "governedShotCount": 12, "percentage": 91.7}
    assert result["authorityTrace"]["scoringAuthority"] == "printer-rules-through-target-data"
    treatment = result["smartTargetTreatment"]
    assert treatment["publisherScoreStatus"] == "not_defined"
    assert treatment["fixedObservationCountStatus"] == "not_defined"
    assert treatment["inningsStatus"] == "not_defined"
    assert treatment["baserunnerAdvancementStatus"] == "not_defined"
    assert treatment["runsStatus"] == "not_defined"
    assert treatment["battingOrderStatus"] == "not_defined"
    assert treatment["winnerRuleStatus"] == "not_defined"
    assert [(item["xNorm"], item["yNorm"]) for item in result["classifications"]] == EXERCISE


def test_canonical_face_and_authority_boundary():
    resolved = contract()
    treatment = json.loads(TREATMENT_FILE.read_text(encoding="utf-8"))
    assert treatment["faceSha256"] == FACE_SHA
    assert treatment["automaticInheritance"]["x10RuleApplied"] is False
    assert treatment["automaticInheritance"]["x10FounderRule"]["overrideDecision"] == "no_eligible_superior_ordered_scoring_grammar"
    assert resolved["components"]["registration"]["definition"]["assetSha256"] == FACE_SHA
    assert resolved["components"]["geometry"]["definition"] == treatment["geometry"]
    assert resolved["components"]["scoring"]["definition"] == treatment["scoring"]
    assert resolved["components"]["mission"]["definition"] == treatment["mission"]
    assert len(treatment["geometry"]["regions"]) == 24
    assert treatment["visibleStructure"] == {
        "markedBaseballs": 13,
        "safeBaseCenters": 3,
        "redOutRings": 3,
        "fieldOutcomeAreas": 4,
        "pitcherOutArea": 1,
        "numericPointScore": "not_defined",
    }


def test_mixed_outcomes_and_open_observation_count():
    resolved = contract()
    assert_result(execute(resolved, evidence()))
    one = execute(resolved, evidence([EXERCISE[0]]))
    assert one["scoring"]["observationCount"] == 1 and "total" not in one["scoring"]
    many = execute(resolved, evidence([EXERCISE[0]] * 25))
    assert many["scoring"]["observationCount"] == 25 and "total" not in many["scoring"]
    try:
        execute(resolved, evidence([EXERCISE[0]] * 501))
    except DeclarativeTargetScoreError as exc:
        assert exc.payload == {"reason": "observation_limit_exceeded"}
    else:
        raise AssertionError("defensive observation maximum was not enforced")


def test_session_history_sec_vault_exact_reopen():
    resolved = contract()
    resolver, store = TargetExecutionContractResolver((resolved,)), MemoryStore()
    prepared = prepare_session({"targetId": TARGET_ID, "missionFamily": "targetScoring"}, store, now=NOW, execution_contract_resolver=resolver)
    started = start_session(
        {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
        store,
        idempotency_key="founder-15-batter-up",
        now=NOW,
        execution_contract_resolver=resolver,
    )
    assert started["interactionContract"]["observations"] == {"max": 500, "exact": None}
    result = execute_authoritative_session(
        {"authoritativeSessionId": started["authoritativeSessionId"], "evidence": evidence()},
        store,
        resolver=resolver,
    )
    assert_result(result)
    artifact = {
        "sessionId": started["authoritativeSessionId"],
        "authoritativeSessionId": started["authoritativeSessionId"],
        "sessionIdAuthority": "backend",
        "matrixSnapshot": {"targetProfileId": TARGET_ID, "missionFamily": "targetScoring", "resultPackageType": result["resultPackageType"]},
        "authorityPackage": result,
        "targetEvidenceImage": deepcopy(IMAGE),
        "savedToSEC": True,
        "savedAt": NOW.isoformat(),
        "preservedAt": NOW.isoformat(),
        "updatedAt": NOW.isoformat(),
    }
    saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
    reopened = read_preserved_sec(started["authoritativeSessionId"], store)
    assert saved["artifactSha256"] == reopened["artifactSha256"]
    assert reopened["session"]["authorityPackage"] == result
    assert_result(reopened["session"]["authorityPackage"])
    vault = list_preserved_secs(store)
    assert len(vault["sessions"]) == 1
    assert vault["sessions"][0]["authorityPackage"] == result


if __name__ == "__main__":
    test_canonical_face_and_authority_boundary()
    test_mixed_outcomes_and_open_observation_count()
    test_session_history_sec_vault_exact_reopen()
    print("PASS Founder 15: publisher baseball outcomes, outside accounting, no invented game, Session/SEC/Vault/exact reopen")
