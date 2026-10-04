#!/usr/bin/env python3
"""Founder #19 preflight: one Boss Hog treatment, three exact-face identities."""
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


NOW = datetime(2026, 10, 4, 3, 0, tzinfo=timezone.utc)
ROOT = Path(__file__).parent
CONTRACT_ROOT = ROOT / "target_execution_contracts/contracts"
TREATMENT = ROOT.parent / "authority-evidence/platform/episode64-founder-walk-2026-10-02/FOUNDER_19_BOSS_HOG_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "fa6b7512c2ee02c6299798909e9492a3202b7ec13a4766988b65b263909b92b3"
FILES = (
    "blocker_baker_targets_gf_bosshog_target_scoring_v1.json",
    "final_collection_baker_targets_pk_badanimals_002_target_scoring_v1.json",
    "final_collection_baker_targets_pk_badmugcombo_002_target_scoring_v1.json",
)
TARGETS = (
    "blocker_baker_targets_gf_bosshog",
    "final_collection_baker_targets_pk_badanimals_002",
    "final_collection_baker_targets_pk_badmugcombo_002",
)
IMAGE = {"sha256": FACE_SHA, "widthPx": 1141, "heightPx": 1500, "mediaType": "image/jpeg", "dataUrl": "data:image/jpeg;base64,/9j/"}
REGION_EXERCISE = [
    (.452,.190), (.455,.790), (.174,.442), (.676,.440),
    (.176,.660), (.700,.663), (.181,.915), (.715,.920), (.930,.120),
]
EXPECTED_REGIONS = [
    "head_8", "center_body_8", "left_upper_2", "right_upper_2",
    "left_middle_4", "right_middle_4", "left_lower_6", "right_lower_6", "outside",
]


def contracts():
    return [validate_contract(json.loads((CONTRACT_ROOT / name).read_text(encoding="utf-8"))) for name in FILES]


def observation(x, y):
    return {
        "xNorm": x, "yNorm": y,
        "observationFootprint": {
            "schemaVersion": "sczn3.observation-footprint.v1",
            "coordinateSystem": "normalized_source_image_top_left",
            "radiusXNorm": 4.5 / IMAGE["widthPx"], "radiusYNorm": 4.5 / IMAGE["heightPx"],
            "authority": "shooter_observation", "source": "sczn3_precision_tap_standard_9_source_pixels",
        },
    }


def evidence(points=REGION_EXERCISE):
    return {"imageEvidence": deepcopy(IMAGE), "observations": [observation(x, y) for x, y in points], "shooterDeclaredComplete": True}


def assert_result(result, target_id):
    assert result["target"]["id"] == target_id
    scoring = result["scoring"]
    assert scoring["model"] == "mixed_regions"
    assert scoring["observationCount"] == 9
    assert scoring["outsideCount"] == 1
    assert scoring["total"] == 40
    assert [item["regionId"] for item in result["classifications"]] == EXPECTED_REGIONS
    assert [item["value"] for item in result["classifications"]] == [8, 8, 2, 2, 4, 4, 6, 6, None]
    assert all(item["hitCount"] == 1 for item in scoring["regionResults"])
    assert result["sczn3Metrics"]["hitRate"] == {"validHitCount": 8, "governedShotCount": 9, "percentage": 88.9}
    assert result["ballisticGeometry"]["classificationMethod"] == "observation_footprint_touch"
    assert result["ballisticGeometry"]["scoreOnTouch"]["enabled"] is True
    assert result["ballisticGeometry"]["displayMarkerParticipatesInScoring"] is False
    assert result["smartTargetTreatment"]["fixedObservationCountStatus"] == "not_defined"


def test_canonical_face_population_and_shared_treatment():
    treatment = json.loads(TREATMENT.read_text(encoding="utf-8"))
    assert len(treatment["regions"]) == 8
    assert sorted(item["value"] for item in treatment["regions"]) == [2, 2, 4, 4, 6, 6, 8, 8]
    resolved = contracts()
    assert {item["targetProfile"]["id"] for item in resolved} == set(TARGETS)
    for contract in resolved:
        assert contract["components"]["registration"]["definition"]["assetSha256"] == FACE_SHA
        assert contract["components"]["geometry"]["definition"] == treatment["geometry"]
        assert contract["components"]["scoring"]["definition"] == treatment["scoring"]
        assert contract["components"]["mission"]["definition"] == treatment["mission"]
        assert contract["components"]["scoring"]["definition"]["classificationFootprintMode"] == "score_on_touch"


def test_open_count_numbered_score_outside_and_touch():
    for contract in contracts():
        assert_result(execute(contract, evidence()), contract["targetProfile"]["id"])
        one = execute(contract, evidence([(.452,.190)]))
        assert one["scoring"]["total"] == 8
        many = execute(contract, evidence([(.452,.190)] * 25))
        assert many["scoring"]["total"] == 200
        try:
            execute(contract, evidence([(.452,.190)] * 501))
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
        started = start_session({"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]}, store, idempotency_key=f"founder-19-boss-hog-{index}", now=NOW, execution_contract_resolver=resolver)
        assert started["interactionContract"]["observations"] == {"max": 500, "exact": None}
        result = execute_authoritative_session({"authoritativeSessionId": started["authoritativeSessionId"], "evidence": evidence()}, store, resolver=resolver)
        assert_result(result, target_id)
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
        assert_result(reopened["session"]["authorityPackage"], target_id)
        sessions.append(started["authoritativeSessionId"])
    vault = list_preserved_secs(store)
    assert [item["sessionId"] for item in vault["sessions"]] == sessions
    assert [item["authorityPackage"]["scoring"]["total"] for item in vault["sessions"]] == [40, 40, 40]


if __name__ == "__main__":
    test_canonical_face_population_and_shared_treatment()
    test_open_count_numbered_score_outside_and_touch()
    test_all_three_identities_complete_session_sec_vault_exact_reopen()
    print("PASS Founder 19: 8/6/4/2 x2, Score on Touch, outside count-only, three identities, Session/SEC/Vault/exact reopen")
