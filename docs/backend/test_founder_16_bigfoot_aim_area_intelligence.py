#!/usr/bin/env python3
"""Founder #16 preflight: one Bigfoot treatment, two identities, no invented game."""
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


NOW = datetime(2026, 10, 3, 23, 30, tzinfo=timezone.utc)
ROOT = Path(__file__).parent
CONTRACT_ROOT = ROOT / "target_execution_contracts" / "contracts"
TREATMENT = ROOT.parent / "authority-evidence/platform/episode64-founder-walk-2026-10-02/FOUNDER_16_BIGFOOT_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "330819718b8bc8e4121a5cdc59845233d15eff86946e646a85b9a93700f5ceeb"
FILES = (
    "blocker_baker_targets_gg_bigfoot_target_scoring_v1.json",
    "final_collection_baker_targets_pk_leftout2_002_target_scoring_v1.json",
)
TARGETS = (
    "blocker_baker_targets_gg_bigfoot",
    "final_collection_baker_targets_pk_leftout2_002",
)
IMAGE = {"sha256": FACE_SHA, "widthPx": 1141, "heightPx": 1500, "mediaType": "image/jpeg", "dataUrl": "data:image/jpeg;base64,/9j/"}
EXERCISE = [
    (0.4592, 0.1747), (0.4470, 0.1760),
    (0.5346, 0.1740), (0.5470, 0.1760),
    (0.4870, 0.2350), (0.4870, 0.3800), (0.4870, 0.5000),
    (0.2050, 0.5000), (0.7750, 0.5000),
    (0.3700, 0.7500), (0.6100, 0.7500),
    (0.9500, 0.5000),
]
EXPECTED_REGIONS = [
    "left_eye_center", "left_red_eye", "right_eye_center", "right_red_eye",
    "head_face", "upper_torso_chest", "abdomen", "left_arm", "right_arm",
    "left_leg", "right_leg", "outside",
]
FOUNDER_EXERCISE = [
    (0.4562533820346321, 0.16973592551033473),
    (0.5456067370129870, 0.17315105349020573),
    (0.4970829951298701, 0.11980173787244680),
    (0.39167343073593074, 0.33823486702566510),
    (0.6339877570346321, 0.32842039377277780),
    (0.6634114583333334, 0.62163903733266290),
    (0.37822138798701296, 0.64513331701339510),
    (0.23960024350649352, 0.71873543490726280),
    (0.12362182088744590, 0.71394396533098430),
    (0.12880478896103897, 0.45436851284964010),
    (0.10453869047619047, 0.22642962257730820),
    (0.24660951028138527, 0.14934163017291297),
    (0.8313717532467533, 0.11093269552924133),
    (0.9007034632034632, 0.23738890332627275),
    (0.9579951298701299, 0.42274481364620180),
    (0.8915973349567100, 0.76026364840260570),
    (0.7735305059523809, 0.82124072632568840),
    (0.3783059388528138, 0.80391425781764240),
    (0.6319331709956710, 0.77027749824188850),
    (0.2754075351731602, 0.27221549091761265),
    (0.7324134199134200, 0.25827199287550280),
]
FOUNDER_EXPECTED_REGIONS = [
    "left_red_eye", "right_red_eye", "head_face", "upper_torso_chest",
    "right_arm", "right_leg", "left_leg",
    "outside", "outside", "outside", "outside", "outside", "outside",
    "outside", "outside", "outside", "outside",
    "left_leg", "right_leg", "left_arm", "right_arm",
]


def contracts():
    return [validate_contract(json.loads((CONTRACT_ROOT / name).read_text(encoding="utf-8"))) for name in FILES]


def evidence(points=EXERCISE):
    return {"imageEvidence": deepcopy(IMAGE), "observations": [{"xNorm": x, "yNorm": y} for x, y in points], "shooterDeclaredComplete": True}


def assert_result(result, target_id):
    assert result["target"]["id"] == target_id
    scoring = result["scoring"]
    assert scoring["model"] == "multiple_bulls"
    assert scoring["observationCount"] == 12
    assert scoring["classifiedObservationCount"] == 12
    assert scoring["unclassifiedObservationCount"] == 0
    assert scoring["outsideCount"] == 1
    assert "total" not in scoring
    assert [item["regionId"] for item in result["classifications"]] == EXPECTED_REGIONS
    assert all(item["value"] is None for item in result["classifications"])
    assert all(item["countsAsHit"] is True for item in result["classifications"][:-1])
    assert result["classifications"][-1]["countsAsHit"] is False
    assert len(scoring["objectResults"]) == 11
    by_object = {item["objectId"]: item for item in scoring["objectResults"]}
    assert all(by_object[name]["hitCount"] == 1 for name in (
        "left_eye_center", "left_red_eye", "right_eye_center", "right_red_eye"
    ))
    assert all(by_object[name]["hitCount"] == 1 for name in (
        "head_face", "upper_torso_chest", "abdomen", "left_arm", "right_arm", "left_leg", "right_leg"
    ))
    assert result["sczn3Metrics"]["hitRate"] == {"validHitCount": 11, "governedShotCount": 12, "percentage": 91.7}
    assert result["sczn3Metrics"]["objectCoverage"] == {"objectsHit": 11, "scorableObjectCount": 11}
    assert result["authorityTrace"]["scoringAuthority"] == "sczn3-derived-structural-classification-no-publisher-score"
    assert result["smartTargetTreatment"]["x10AuthorityStatus"] == "not_applicable"
    assert [(item["xNorm"], item["yNorm"]) for item in result["classifications"]] == EXERCISE


def assert_founder_result(result, target_id):
    assert result["target"]["id"] == target_id
    scoring = result["scoring"]
    assert scoring["observationCount"] == 21
    assert scoring["classifiedObservationCount"] == 21
    assert scoring["unclassifiedObservationCount"] == 0
    assert scoring["outsideCount"] == 10
    assert "total" not in scoring
    assert [item["regionId"] for item in result["classifications"]] == FOUNDER_EXPECTED_REGIONS
    assert all(item["classificationStatus"] != "ambiguous" for item in result["classifications"])
    assert all(item["countsAsHit"] is True for item in result["classifications"][:7])
    assert all(item["countsAsHit"] is False for item in result["classifications"][7:17])
    assert all(item["countsAsHit"] is True for item in result["classifications"][17:])
    assert result["sczn3Metrics"]["hitRate"] == {"validHitCount": 11, "governedShotCount": 21, "percentage": 52.4}
    assert [(item["xNorm"], item["yNorm"]) for item in result["classifications"]] == FOUNDER_EXERCISE


def test_canonical_face_population_and_shared_treatment():
    treatment = json.loads(TREATMENT.read_text(encoding="utf-8"))
    resolved = contracts()
    assert treatment["visibleStructure"] == {
        "primaryObjectCount": 1,
        "eyeAimAreaCount": 2,
        "nestedEyeCenterCount": 2,
        "boundedAnatomicalAreaCount": 7,
        "physicalDimensionsInferred": False,
    }
    assert len(treatment["geometry"]["regions"]) == 11
    assert {item["targetProfile"]["id"] for item in resolved} == set(TARGETS)
    for contract in resolved:
        assert contract["components"]["registration"]["definition"]["assetSha256"] == FACE_SHA
        assert contract["components"]["geometry"]["definition"] == treatment["geometry"]
        assert contract["components"]["scoring"]["definition"] == treatment["scoring"]
        assert contract["components"]["mission"]["definition"] == treatment["mission"]
        assert contract["components"]["mission"]["definition"]["maxObservations"] == 500
        assert "exactObservations" not in contract["components"]["mission"]["definition"]


def test_open_count_bigfoot_intelligence_without_invented_score_or_vital_claims():
    for contract in contracts():
        assert_result(execute(contract, evidence()), contract["targetProfile"]["id"])
        one = execute(contract, evidence([EXERCISE[0]]))
        assert one["scoring"]["observationCount"] == 1
        assert "total" not in one["scoring"]
        many = execute(contract, evidence([EXERCISE[0]] * 25))
        assert many["scoring"]["observationCount"] == 25
        assert "total" not in many["scoring"]
        shooter_labels = " ".join(
            rule["label"] for rule in contract["components"]["scoring"]["definition"]["regionRules"].values()
        ).lower()
        for term in ("kill", "vital", "wound", "threat", "tactical"):
            assert term not in shooter_labels
        try:
            execute(contract, evidence([EXERCISE[0]] * 501))
        except DeclarativeTargetScoreError as exc:
            assert exc.payload == {"reason": "observation_limit_exceeded"}
        else:
            raise AssertionError("defensive observation maximum was not enforced")


def test_exact_founder_21_observation_set_resolves_once_without_ambiguity():
    for contract in contracts():
        assert_founder_result(execute(contract, evidence(FOUNDER_EXERCISE)), contract["targetProfile"]["id"])


def test_both_identities_complete_session_sec_vault_exact_reopen():
    resolved = contracts()
    resolver, store = TargetExecutionContractResolver(tuple(resolved)), MemoryStore()
    sessions = []
    for index, target_id in enumerate(TARGETS, start=1):
        prepared = prepare_session({"targetId": target_id, "missionFamily": "targetScoring"}, store, now=NOW, execution_contract_resolver=resolver)
        started = start_session(
            {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
            store, idempotency_key=f"founder-16-bigfoot-{index}", now=NOW, execution_contract_resolver=resolver,
        )
        assert started["interactionContract"]["observations"] == {"max": 500, "exact": None}
        result = execute_authoritative_session({"authoritativeSessionId": started["authoritativeSessionId"], "evidence": evidence(FOUNDER_EXERCISE)}, store, resolver=resolver)
        assert_founder_result(result, target_id)
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
        assert_founder_result(reopened["session"]["authorityPackage"], target_id)
        sessions.append(started["authoritativeSessionId"])
    vault = list_preserved_secs(store)
    assert [item["sessionId"] for item in vault["sessions"]] == sessions
    assert [item["authorityPackage"]["scoring"]["observationCount"] for item in vault["sessions"]] == [21, 21]


if __name__ == "__main__":
    test_canonical_face_population_and_shared_treatment()
    test_open_count_bigfoot_intelligence_without_invented_score_or_vital_claims()
    test_exact_founder_21_observation_set_resolves_once_without_ambiguity()
    test_both_identities_complete_session_sec_vault_exact_reopen()
    print("PASS Founder 16: exact 21-tap Founder set reconciled, no ambiguity, two identities, Session/SEC/Vault/exact reopen")
