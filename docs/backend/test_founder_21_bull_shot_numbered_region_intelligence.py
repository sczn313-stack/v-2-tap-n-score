#!/usr/bin/env python3
"""Founder #21: Bull Shot values, Score on Touch, three identities, lifecycle."""
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


NOW = datetime(2026, 10, 4, 15, 0, tzinfo=timezone.utc)
ROOT = Path(__file__).parent
CONTRACT_ROOT = ROOT / "target_execution_contracts/contracts"
TREATMENT = ROOT.parent / "authority-evidence/platform/episode64-founder-walk-2026-10-02/FOUNDER_21_BULL_SHOT_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "416e346cdbbf4c23cc8aa0c8690b2bc0fac019749db7a117e4eb051129a668db"
FILES = (
    "blocker_baker_targets_gf_bullshot_target_scoring_v1.json",
    "final_collection_baker_targets_pk_badanimals_003_target_scoring_v1.json",
    "final_collection_baker_targets_pk_badmugcombo_003_target_scoring_v1.json",
)
TARGETS = (
    "blocker_baker_targets_gf_bullshot",
    "final_collection_baker_targets_pk_badanimals_003",
    "final_collection_baker_targets_pk_badmugcombo_003",
)
IMAGE = {"sha256": FACE_SHA, "widthPx": 1167, "heightPx": 1500, "mediaType": "image/jpeg", "dataUrl": "data:image/jpeg;base64,/9j/"}
REGION_EXERCISE = [
    (.525,.250), (.365,.570), (.610,.570), (.490,.900), (.280,.820),
    (.700,.820), (.255,.490), (.715,.490), (.190,.900), (.820,.820), (.950,.120),
]
EXPECTED_REGIONS = [
    "head_10", "left_middle_8", "right_middle_8", "center_lower_8", "left_lower_6",
    "right_lower_6", "left_upper_4", "right_upper_4", "left_outer_lower_4", "right_arm_2", "outside",
]
EXPECTED_VALUES = [10, 8, 8, 8, 6, 6, 4, 4, 4, 2, None]


def contracts():
    return [validate_contract(json.loads((CONTRACT_ROOT / name).read_text(encoding="utf-8"))) for name in FILES]


def observation(x, y, radius_x=4.5 / IMAGE["widthPx"], radius_y=4.5 / IMAGE["heightPx"]):
    return {
        "xNorm": x, "yNorm": y,
        "observationFootprint": {
            "schemaVersion": "sczn3.observation-footprint.v1",
            "coordinateSystem": "normalized_source_image_top_left",
            "radiusXNorm": radius_x, "radiusYNorm": radius_y,
            "authority": "shooter_observation", "source": "sczn3_precision_tap_standard_9_source_pixels",
        },
    }


def evidence(points=REGION_EXERCISE):
    observations = [point if isinstance(point, dict) else observation(*point) for point in points]
    return {"imageEvidence": deepcopy(IMAGE), "observations": observations, "shooterDeclaredComplete": True}


def assert_result(result, target_id):
    assert result["target"]["id"] == target_id
    scoring = result["scoring"]
    assert scoring["model"] == "mixed_regions"
    assert scoring["observationCount"] == 11
    assert scoring["outsideCount"] == 1
    assert scoring["total"] == 60
    assert [item["regionId"] for item in result["classifications"]] == EXPECTED_REGIONS
    assert [item["value"] for item in result["classifications"]] == EXPECTED_VALUES
    assert all(item["hitCount"] == 1 for item in scoring["regionResults"])
    assert result["sczn3Metrics"]["hitRate"] == {"validHitCount": 10, "governedShotCount": 11, "percentage": 90.9}
    assert result["ballisticGeometry"]["classificationMethod"] == "observation_footprint_touch"
    assert result["ballisticGeometry"]["scoreOnTouch"]["enabled"] is True
    assert result["ballisticGeometry"]["displayMarkerParticipatesInScoring"] is False
    assert result["smartTargetTreatment"]["fixedObservationCountStatus"] == "not_defined"


def test_canonical_face_population_and_shared_treatment():
    treatment = json.loads(TREATMENT.read_text(encoding="utf-8"))
    assert len(treatment["regions"]) == 10
    assert sorted(item["value"] for item in treatment["regions"]) == [2, 4, 4, 4, 6, 6, 8, 8, 8, 10]
    assert treatment["visibleStructure"]["referencePatternTotal"] == 60
    resolved = contracts()
    assert {item["targetProfile"]["id"] for item in resolved} == set(TARGETS)
    for contract in resolved:
        assert contract["components"]["registration"]["definition"]["assetSha256"] == FACE_SHA
        assert contract["components"]["geometry"]["definition"] == treatment["geometry"]
        assert contract["components"]["scoring"]["definition"] == treatment["scoring"]
        assert contract["components"]["mission"]["definition"] == treatment["mission"]


def test_ten_regions_reference_total_outside_and_score_on_touch():
    for contract in contracts():
        assert_result(execute(contract, evidence()), contract["targetProfile"]["id"])
        # Center just outside the head boundary; the explicit footprint touches
        # the printed boundary and therefore receives the higher valued 10.
        touch = observation(.420, .264, radius_x=.008, radius_y=.006)
        touched = execute(contract, evidence([touch]))
        assert touched["classifications"][0]["regionId"] == "head_10"
        assert touched["scoring"]["total"] == 10
        try:
            execute(contract, evidence([(.525,.250)] * 501))
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
        started = start_session({"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]}, store, idempotency_key=f"founder-21-bull-shot-{index}", now=NOW, execution_contract_resolver=resolver)
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
    assert [item["authorityPackage"]["scoring"]["total"] for item in vault["sessions"]] == [60, 60, 60]


if __name__ == "__main__":
    test_canonical_face_population_and_shared_treatment()
    test_ten_regions_reference_total_outside_and_score_on_touch()
    test_all_three_identities_complete_session_sec_vault_exact_reopen()
    print("PASS Founder 21: ten Bull Shot regions = 60, outside count-only, Score on Touch, three identities, Session/SEC/Vault/exact reopen")
