#!/usr/bin/env python3
"""Founder #20 preflight: one Brainy Brian treatment, two identities, no invented game."""
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


NOW = datetime(2026, 10, 4, 3, 15, tzinfo=timezone.utc)
ROOT = Path(__file__).parent
CONTRACT_ROOT = ROOT / "target_execution_contracts" / "contracts"
TREATMENT = ROOT.parent / "authority-evidence/platform/episode64-founder-walk-2026-10-02/FOUNDER_20_BRAINY_BRIAN_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "3de161ec482fc4d03d4b228f2374f0e7e9e5dc5fc86db7994cbc83cd9ebeed1f"
FILES = (
    "blocker_baker_targets_z_bb_target_scoring_v1.json",
    "final_collection_baker_targets_pk_zombiepack_001_target_scoring_v1.json",
)
TARGETS = (
    "blocker_baker_targets_z_bb",
    "final_collection_baker_targets_pk_zombiepack_001",
)
IMAGE = {
    "sha256": FACE_SHA,
    "widthPx": 1167,
    "heightPx": 1500,
    "mediaType": "image/jpeg",
    "dataUrl": "data:image/jpeg;base64,/9j/",
}
EXERCISE = [
    (0.5065, 0.2760), (0.4750, 0.2760),
    (0.6070, 0.2460), (0.6400, 0.2460),
    (0.5650, 0.1550), (0.6050, 0.3500), (0.4500, 0.2300),
    (0.4700, 0.7450), (0.4850, 0.5500),
    (0.1700, 0.5500), (0.7900, 0.5200), (0.5500, 0.9200),
    (0.9400, 0.1000),
]
EXPECTED_REGIONS = [
    "left_eye_center", "left_eye", "right_eye_center", "right_eye",
    "exposed_brain", "mouth_teeth", "head_face",
    "exposed_abdomen_intestines", "upper_torso",
    "left_arm_hand", "right_arm_hand", "lower_body", "outside",
]


def contracts():
    return [validate_contract(json.loads((CONTRACT_ROOT / name).read_text(encoding="utf-8"))) for name in FILES]


def observation(x: float, y: float) -> dict:
    return {
        "xNorm": x,
        "yNorm": y,
        "observationFootprint": {
            "schemaVersion": "sczn3.observation-footprint.v1",
            "coordinateSystem": "normalized_source_image_top_left",
            "radiusXNorm": 4.5 / IMAGE["widthPx"],
            "radiusYNorm": 4.5 / IMAGE["heightPx"],
            "authority": "shooter_observation",
            "source": "sczn3_precision_tap_standard_9_source_pixels",
        },
    }


def evidence(points=EXERCISE):
    return {
        "imageEvidence": deepcopy(IMAGE),
        "observations": [observation(x, y) for x, y in points],
        "shooterDeclaredComplete": True,
    }


def assert_result(result, target_id):
    assert result["target"]["id"] == target_id
    scoring = result["scoring"]
    assert scoring["model"] == "multiple_bulls"
    assert scoring["observationCount"] == 13
    assert scoring["classifiedObservationCount"] == 13
    assert scoring["unclassifiedObservationCount"] == 0
    assert scoring["outsideCount"] == 1
    assert "total" not in scoring
    assert [item["regionId"] for item in result["classifications"]] == EXPECTED_REGIONS
    assert all(item["value"] is None for item in result["classifications"])
    assert all(item["classificationMethod"] == "physical_projectile_footprint" for item in result["classifications"])
    assert all(item["countsAsHit"] is True for item in result["classifications"][:-1])
    assert result["classifications"][-1]["countsAsHit"] is False
    assert all(item["classificationStatus"] != "ambiguous" for item in result["classifications"])
    assert len(scoring["objectResults"]) == 12
    assert all(item["hitCount"] == 1 for item in scoring["objectResults"])
    assert result["sczn3Metrics"]["hitRate"] == {
        "validHitCount": 12,
        "governedShotCount": 13,
        "percentage": 92.3,
    }
    assert result["sczn3Metrics"]["objectCoverage"] == {
        "objectsHit": 12,
        "scorableObjectCount": 12,
    }
    assert result["authorityTrace"]["scoringAuthority"] == "sczn3-derived-structural-classification-no-publisher-score"
    assert result["smartTargetTreatment"]["x10AuthorityStatus"] == "not_applicable"
    assert result["smartTargetTreatment"]["classificationPrecedence"] == "most_specific_legitimate_feature_wins"
    assert [(item["xNorm"], item["yNorm"]) for item in result["classifications"]] == EXERCISE


def test_canonical_face_population_and_shared_treatment():
    treatment = json.loads(TREATMENT.read_text(encoding="utf-8"))
    resolved = contracts()
    assert treatment["visibleStructure"] == {
        "primaryObjectCount": 1,
        "nestedEyeCount": 2,
        "nestedEyeCenterCount": 2,
        "precisionFeatureCount": 7,
        "boundedBodyAreaCount": 5,
        "governedRegionCount": 12,
        "physicalDimensionsInferred": False,
    }
    assert len(treatment["geometry"]["regions"]) == 12
    assert treatment["scoring"]["classificationFootprintMode"] == "score_on_touch"
    assert {item["targetProfile"]["id"] for item in resolved} == set(TARGETS)
    for contract in resolved:
        assert contract["components"]["registration"]["definition"]["assetSha256"] == FACE_SHA
        assert contract["components"]["geometry"]["definition"] == treatment["geometry"]
        assert contract["components"]["scoring"]["definition"] == treatment["scoring"]
        assert contract["components"]["mission"]["definition"] == treatment["mission"]
        assert contract["components"]["mission"]["definition"]["maxObservations"] == 500
        assert "exactObservations" not in contract["components"]["mission"]["definition"]


def test_most_specific_feature_wins_without_invented_score_or_tactical_claims():
    for contract in contracts():
        result = execute(contract, evidence())
        assert_result(result, contract["targetProfile"]["id"])
        assert result["classifications"][0]["regionId"] == "left_eye_center"
        assert result["classifications"][2]["regionId"] == "right_eye_center"
        assert result["classifications"][4]["regionId"] == "exposed_brain"
        assert result["classifications"][5]["regionId"] == "mouth_teeth"
        assert result["classifications"][7]["regionId"] == "exposed_abdomen_intestines"
        labels = " ".join(
            rule["label"] for rule in contract["components"]["scoring"]["definition"]["regionRules"].values()
        ).lower()
        for term in ("kill", "vital", "wound", "threat", "tactical", "score", "points"):
            assert term not in labels
        one = execute(contract, evidence([EXERCISE[0]]))
        assert one["scoring"]["observationCount"] == 1
        assert "total" not in one["scoring"]
        many = execute(contract, evidence([EXERCISE[0]] * 25))
        assert many["scoring"]["observationCount"] == 25
        assert "total" not in many["scoring"]
        try:
            execute(contract, evidence([EXERCISE[0]] * 501))
        except DeclarativeTargetScoreError as exc:
            assert exc.payload == {"reason": "observation_limit_exceeded"}
        else:
            raise AssertionError("defensive observation maximum was not enforced")


def test_both_identities_complete_session_sec_vault_exact_reopen():
    resolved = contracts()
    resolver, store = TargetExecutionContractResolver(tuple(resolved)), MemoryStore()
    sessions = []
    for index, target_id in enumerate(TARGETS, start=1):
        prepared = prepare_session(
            {"targetId": target_id, "missionFamily": "targetScoring"},
            store,
            now=NOW,
            execution_contract_resolver=resolver,
        )
        started = start_session(
            {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
            store,
            idempotency_key=f"founder-20-brainy-brian-{index}",
            now=NOW,
            execution_contract_resolver=resolver,
        )
        assert started["interactionContract"]["observations"] == {"max": 500, "exact": None}
        result = execute_authoritative_session(
            {"authoritativeSessionId": started["authoritativeSessionId"], "evidence": evidence()},
            store,
            resolver=resolver,
        )
        assert_result(result, target_id)
        artifact = {
            "sessionId": started["authoritativeSessionId"],
            "authoritativeSessionId": started["authoritativeSessionId"],
            "sessionIdAuthority": "backend",
            "matrixSnapshot": {
                "targetProfileId": target_id,
                "missionFamily": "targetScoring",
                "resultPackageType": result["resultPackageType"],
            },
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
        assert_result(reopened["session"]["authorityPackage"], target_id)
        sessions.append(started["authoritativeSessionId"])
    vault = list_preserved_secs(store)
    assert [item["sessionId"] for item in vault["sessions"]] == sessions
    assert [item["authorityPackage"]["scoring"]["observationCount"] for item in vault["sessions"]] == [13, 13]


if __name__ == "__main__":
    test_canonical_face_population_and_shared_treatment()
    test_most_specific_feature_wins_without_invented_score_or_tactical_claims()
    test_both_identities_complete_session_sec_vault_exact_reopen()
    print("PASS Founder 20: 12 governed Brainy Brian areas + outside, two identities, Session/SEC/Vault/exact reopen")
