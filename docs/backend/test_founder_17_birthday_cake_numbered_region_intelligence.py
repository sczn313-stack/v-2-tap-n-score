#!/usr/bin/env python3
"""Founder #17 preflight: one Birthday Cake treatment, two identities."""
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


NOW = datetime(2026, 10, 4, 0, 15, tzinfo=timezone.utc)
ROOT = Path(__file__).parent
CONTRACT_ROOT = ROOT / "target_execution_contracts" / "contracts"
TREATMENT = ROOT.parent / "authority-evidence/platform/episode64-founder-walk-2026-10-02/FOUNDER_17_BIRTHDAY_CAKE_CANONICAL_FACE_TREATMENT.json"
FACE_SHA = "9bb68c840f6d62e5f2a68cb3a0d9154ca688f20c4b3871565b946203877a016e"
FILES = (
    "blocker_baker_targets_gf_birthday_cake_target_scoring_v1.json",
    "final_collection_baker_targets_pk_partypack_001_target_scoring_v1.json",
)
TARGETS = (
    "blocker_baker_targets_gf_birthday_cake",
    "final_collection_baker_targets_pk_partypack_001",
)
IMAGE = {"sha256": FACE_SHA, "widthPx": 1141, "heightPx": 1500, "mediaType": "image/jpeg", "dataUrl": "data:image/jpeg;base64,/9j/"}

# One observation in each printed region, followed by three deliberately
# unnumbered observations: yellow balloon, blue balloon, and page background.
MIXED_PROOF = [
    (0.460, 0.560),  # cake body 100
    (0.770, 0.380),  # party hat 75
    (0.270, 0.650),  # left character area 50
    (0.450, 0.720),  # lower face/frosting 30
    (0.676, 0.710),  # right strawberry 25
    (0.450, 0.160),  # red balloon 20
    (0.430, 0.800),  # black cake base 20
    (0.660, 0.120),  # unnumbered yellow balloon
    (0.790, 0.150),  # unnumbered blue balloon
    (0.920, 0.850),  # page background
]
EXPECTED_REGIONS = [
    "cake_body_100",
    "party_hat_75",
    "left_character_area_50",
    "lower_face_frosting_30",
    "right_strawberry_25",
    "red_balloon_20",
    "black_cake_base_20",
    "outside",
    "outside",
    "outside",
]
EXPECTED_VALUES = [100, 75, 50, 30, 25, 20, 20, None, None, None]


def contracts():
    return [validate_contract(json.loads((CONTRACT_ROOT / name).read_text(encoding="utf-8"))) for name in FILES]


def evidence(points=MIXED_PROOF):
    return {"imageEvidence": deepcopy(IMAGE), "observations": [{"xNorm": x, "yNorm": y} for x, y in points], "shooterDeclaredComplete": True}


def assert_result(result, target_id):
    assert result["target"]["id"] == target_id
    scoring = result["scoring"]
    assert scoring["model"] == "mixed_regions"
    assert scoring["observationCount"] == 10
    assert scoring["classifiedObservationCount"] == 10
    assert scoring["unclassifiedObservationCount"] == 0
    assert scoring["outsideCount"] == 3
    assert scoring["total"] == 320
    assert [item["regionId"] for item in result["classifications"]] == EXPECTED_REGIONS
    assert [item["value"] for item in result["classifications"]] == EXPECTED_VALUES
    assert all(item["value"] is None for item in result["classifications"][7:])
    assert len(scoring["regionResults"]) == 7
    assert all(item["hitCount"] == 1 for item in scoring["regionResults"])
    distribution = {}
    for item in scoring["regionResults"]:
        distribution[item["value"]] = distribution.get(item["value"], 0) + item["hitCount"]
    assert distribution == {100: 1, 75: 1, 50: 1, 30: 1, 25: 1, 20: 2}
    assert result["sczn3Metrics"]["hitRate"] == {"validHitCount": 7, "governedShotCount": 10, "percentage": 70.0}
    assert scoring["total"] / scoring["observationCount"] == 32.0
    treatment = result["smartTargetTreatment"]
    assert treatment["fixedObservationCountStatus"] == "not_defined"
    assert treatment["requiredEngagementOrderStatus"] == "not_defined"
    assert treatment["maximumScoreStatus"] == "not_defined"
    assert treatment["ageRuleStatus"] == "not_defined"
    assert [(item["xNorm"], item["yNorm"]) for item in result["classifications"]] == MIXED_PROOF


def test_canonical_face_population_and_shared_treatment():
    treatment = json.loads(TREATMENT.read_text(encoding="utf-8"))
    assert len(treatment["regions"]) == 7
    assert sorted(item["value"] for item in treatment["regions"]) == [20, 20, 25, 30, 50, 75, 100]
    assert sum(item["value"] for item in treatment["regions"]) == 320
    resolved = contracts()
    assert {item["targetProfile"]["id"] for item in resolved} == set(TARGETS)
    for contract in resolved:
        assert contract["components"]["registration"]["definition"]["assetSha256"] == FACE_SHA
        assert contract["components"]["geometry"]["definition"] == treatment["geometry"]
        assert contract["components"]["scoring"]["definition"] == treatment["scoring"]
        assert contract["components"]["mission"]["definition"] == treatment["mission"]
        assert contract["components"]["mission"]["definition"]["maxObservations"] == 500


def test_printed_regions_score_and_unnumbered_artwork_is_count_only():
    for contract in contracts():
        assert_result(execute(contract, evidence()), contract["targetProfile"]["id"])
        for point in MIXED_PROOF[7:]:
            outside = execute(contract, evidence([point]))
            assert outside["scoring"]["total"] == 0
            assert outside["scoring"]["outsideCount"] == 1
            assert outside["classifications"][0]["value"] is None
        repeated = execute(contract, evidence([MIXED_PROOF[0]] * 25))
        assert repeated["scoring"]["total"] == 2500
        try:
            execute(contract, evidence([MIXED_PROOF[0]] * 501))
        except DeclarativeTargetScoreError as exc:
            assert exc.payload == {"reason": "observation_limit_exceeded"}
        else:
            raise AssertionError("defensive observation maximum was not enforced")


def test_legitimate_layer_precedence_is_deterministic():
    for contract in contracts():
        # These points lie where visible foreground numbered artwork overlaps
        # the broader base/frosting footprint; the most specific layer wins.
        result = execute(contract, evidence([(0.650, 0.710), (0.550, 0.730)]))
        assert [item["regionId"] for item in result["classifications"]] == ["right_strawberry_25", "lower_face_frosting_30"]
        assert result["scoring"]["total"] == 55


def test_both_identities_complete_session_sec_vault_exact_reopen():
    resolved = contracts()
    resolver, store = TargetExecutionContractResolver(tuple(resolved)), MemoryStore()
    sessions = []
    for index, target_id in enumerate(TARGETS, start=1):
        prepared = prepare_session({"targetId": target_id, "missionFamily": "targetScoring"}, store, now=NOW, execution_contract_resolver=resolver)
        started = start_session(
            {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
            store,
            idempotency_key=f"founder-17-birthday-cake-{index}",
            now=NOW,
            execution_contract_resolver=resolver,
        )
        assert started["interactionContract"]["observations"] == {"max": 500, "exact": None}
        result = execute_authoritative_session({"authoritativeSessionId": started["authoritativeSessionId"], "evidence": evidence()}, store, resolver=resolver)
        assert_result(result, target_id)
        artifact = {
            "sessionId": started["authoritativeSessionId"],
            "authoritativeSessionId": started["authoritativeSessionId"],
            "sessionIdAuthority": "backend",
            "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": "targetScoring", "resultPackageType": result["resultPackageType"]},
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
    assert [item["authorityPackage"]["scoring"]["total"] for item in vault["sessions"]] == [320, 320]


if __name__ == "__main__":
    test_canonical_face_population_and_shared_treatment()
    test_printed_regions_score_and_unnumbered_artwork_is_count_only()
    test_legitimate_layer_precedence_is_deterministic()
    test_both_identities_complete_session_sec_vault_exact_reopen()
    print("PASS Founder 17: 100/75/50/30/25/20x2 = 320, unnumbered count-only, two identities, Session/SEC/Vault/exact reopen")
