#!/usr/bin/env python3
"""Backend Session Authority contract tests (durable store is substituted only in tests)."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone

from session_authority import (
    PostgresSessionStore,
    SessionAuthorityError,
    TARGET_AUTHORITY_PROFILES,
    digest,
    prepare_session,
    start_session,
)


class TestStore:
    def __init__(self):
        self.preparations = {}
        self.sessions = {}

    def save_preparation(self, record):
        self.preparations[record["tokenHash"]] = deepcopy(record)

    def get_preparation(self, token_hash):
        return deepcopy(self.preparations.get(token_hash))

    def find_session_by_idempotency_key(self, key):
        return deepcopy(self.sessions.get(key))

    def create_session(self, record, preparation_id, consumed_at):
        for preparation in self.preparations.values():
            if preparation["preparationId"] == preparation_id:
                if preparation.get("consumedAt"):
                    raise SessionAuthorityError("preparation_invalid", "preparation_already_consumed", 409)
                preparation["consumedAt"] = consumed_at
                break
        self.sessions[record["idempotencyKey"]] = {
            "requestFingerprint": record["requestFingerprint"],
            "response": deepcopy(record["response"]),
        }
        return deepcopy(record)


NOW = datetime(2026, 8, 5, 12, 0, tzinfo=timezone.utc)


def equipment(category="Rifle", model="AR Platform", setup_id="weapon-1", unit="MOA", click=0.25):
    return {
        "setupId": setup_id,
        "weaponCategory": category,
        "weaponManufacturer": "Test Manufacturer",
        "weaponModelType": model,
        "weaponModelCaliber": "5.56 NATO" if category == "Rifle" else "9mm",
        "opticType": "Iron Sights",
        "opticAdjustmentUnit": unit,
        "opticClickValue": click,
    }


def expect_error(fn, reason, http_status=None):
    try:
        fn()
    except SessionAuthorityError as exc:
        assert exc.payload["reason"] == reason, exc.payload
        if http_status is not None:
            assert exc.http_status == http_status, exc.payload
        return exc
    raise AssertionError(f"expected SessionAuthorityError: {reason}")


def prepared(store, target="m4_25m_zero", selected=None, **extra):
    candidate = selected or equipment()
    return prepare_session({
        "targetId": target,
        "missionFamily": "client-spoof-must-be-ignored",
        "equipmentCandidates": [candidate],
        **extra,
    }, store, now=NOW)


def test_prepare_resolves_backend_mission_and_ignores_client_mission():
    result = prepared(TestStore())
    assert result["ok"] is True
    assert result["target"]["targetId"] == "m4_25m_zero"
    assert result["missionIdentity"]["missionFamily"] == "zeroingCorrection"
    assert result["missionIdentity"]["missionFamily"] != "client-spoof-must-be-ignored"
    assert result["target"]["targetProfileVersion"] == "M4_TARGET_AUTHORITY_v1_ORIGINAL"
    assert result["targetAdmission"]["status"] == "admitted"
    assessment = result["equipmentAssessments"][0]
    assert assessment["officialMission"]["status"] == "authority_unavailable"
    assert assessment["officialMission"]["restrictionIds"] == []
    assert assessment["capabilities"]["evidence"]["status"] == "available"
    assert assessment["capabilities"]["measurement"]["status"] == "available"


def test_prepare_normalizes_three_supported_targets():
    cases = [
        ("m4_25m_zero", equipment(), "zeroingCorrection", 25, "authority_unavailable"),
        ("baker_st_100yd_smart_zero", equipment(model="Bolt Action"), "zeroingCorrection", 100, "eligible"),
        ("gssf_ac_1", equipment(category="Pistol", model="GLOCK Catalog"), "gssf", None, "eligible"),
    ]
    for target, candidate, family, distance, mission_status in cases:
        result = prepared(TestStore(), target, candidate)
        assert result["missionIdentity"]["missionFamily"] == family
        assert result["governedDistance"]["value"] == distance
        assert result["targetAdmission"]["status"] == "admitted"
        assert result["equipmentAssessments"][0]["officialMission"]["status"] == mission_status


def test_baker_sl_st1_uses_backend_session_authority_without_equipment_gate():
    store = TestStore()
    preparation = prepare_session({"targetId": "BAKER_SL_ST1", "equipmentCandidates": []}, store, now=NOW)
    assert preparation["target"]["targetAuthorityId"] == "BAKER_SL_ST1"
    assert preparation["missionIdentity"] == {
        "missionFamily": "smartEvidenceCapture",
        "missionId": "BAKER_SL_ST1_PRACTICE_EVIDENCE",
        "resultPackageType": "smartEvidenceResult",
    }
    assert preparation["targetAdmission"]["status"] == "admitted"
    assert preparation["equipmentAssessments"][0]["officialMission"]["status"] == "not_applicable"
    result = start_session({
        "preparationToken": preparation["preparationToken"],
        "selectedEquipment": preparation["standardSetup"],
    }, store, idempotency_key="idem-baker-sl-st1", now=NOW)
    assert result["authoritativeSessionId"].startswith("sczn3-session-")
    assert result["sessionMode"] == "target_evidence"
    assert result["selectedEquipment"]["source"] == "backend_standard_setup"


def test_100_yard_confirmation_authority_remains_explicitly_unavailable():
    store = TestStore()
    result = prepared(store, "baker_st_100yd_smart_zero", equipment(model="Bolt Action"))
    confirmation = result["confirmationAuthority"]
    assert confirmation["status"] == "authority_unavailable"
    assert confirmation["reason"] == "authoritative_confirmation_standard_not_registered"
    assert confirmation["requiredConfirmationShotCount"] is None
    assert confirmation["residualTolerance"] is None
    assert confirmation["units"] is None
    assert confirmation["applicableTargetProfileVersion"] is None
    assert confirmation["authorityProvenance"] is None
    assert confirmation["additionalConfirmationRules"] is None

    started = start_session({
        "preparationToken": result["preparationToken"],
        "selectedEquipment": result["standardSetup"] if result["setupMode"] == "standard" else equipment(model="Bolt Action"),
    }, store, idempotency_key="idem-100-yard-authority-gap", now=NOW)
    assert started["confirmationAuthority"]["status"] == "authority_unavailable"


def test_prepare_without_saved_equipment_returns_backend_standard_setup_for_all_targets():
    cases = [
        ("m4_25m_zero", "Rifle", "backend_standard_setup"),
        ("baker_st_100yd_smart_zero", "Rifle", "backend_standard_setup"),
        ("gssf_ac_1", "Pistol", "backend_standard_setup"),
    ]
    for target, category, source in cases:
        result = prepare_session({"targetId": target}, TestStore(), now=NOW)
        assert result["setupMode"] == "standard"
        assert result["standardSetup"]["weaponCategory"] == category
        assert result["standardSetup"]["source"] == source
        assert result["standardSetup"]["setupAuthority"] == "backend-target-authority"
        assert result["equipmentAssessments"][0]["officialMission"]["status"] == "eligible"


def test_m4_standard_setup_uses_exact_proven_axis_authority_and_can_start():
    store = TestStore()
    preparation = prepare_session({"targetId": "m4_25m_zero"}, store, now=NOW)
    standard = preparation["standardSetup"]
    assert standard["adjustmentSystem"] == "M4_IRON_DCH_FSP"
    assert standard["equipmentAuthorityRecordId"] == "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28"
    assert standard["axisAdjustment"] == {
        "windagePerClick": 0.75,
        "elevationPerClick": 1.5,
        "unit": "MOA",
    }
    result = start_session({
        "preparationToken": preparation["preparationToken"],
        "selectedEquipment": standard,
    }, store, idempotency_key="idem-standard-m4", now=NOW)
    assert result["setupMode"] == "standard"
    assert result["sessionMode"] == "official_mission"
    assert result["officialMission"]["status"] == "eligible"
    assert result["selectedEquipment"]["setupAuthorityId"] == "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28"


def test_client_cannot_claim_backend_standard_setup_authority():
    store = TestStore()
    candidate = {
        **equipment(),
        "source": "backend_standard_setup",
        "setupAuthority": "backend-target-authority",
        "setupAuthorityId": "spoofed",
    }
    result = prepared(store, selected=candidate)
    prepared_candidate = store.preparations[digest(result["preparationToken"])]["equipmentCandidates"][0]
    assert prepared_candidate["source"] != "backend_standard_setup"
    assert "setupAuthorityId" not in prepared_candidate


def test_unproven_m4_restriction_admits_target_without_inventing_ineligibility():
    store = TestStore()
    candidate = equipment(category="Pistol", model="GLOCK Catalog")
    result = prepared(store, "m4_25m_zero", candidate)
    assessment = result["equipmentAssessments"][0]
    assert result["targetAdmission"]["status"] == "admitted"
    assert assessment["officialMission"]["status"] == "authority_unavailable"
    assert assessment["officialMission"]["restrictionIds"] == []
    assert assessment["restrictions"] == []
    started = start_session({
        "preparationToken": result["preparationToken"],
        "selectedEquipment": {**candidate, "source": "weapon_library"},
    }, store, idempotency_key="idem-unproven-m4-restriction", now=NOW)
    assert started["sessionMode"] == "target_evidence"
    assert started["officialMission"]["status"] == "authority_unavailable"
    assert started["restrictions"] == []


def test_capabilities_are_independent_from_official_mission_eligibility():
    store = TestStore()
    candidate = equipment(category="Rifle", model="Ruger 10/22", click=0.25)
    preparation = prepared(store, "m4_25m_zero", candidate)
    assessment = preparation["equipmentAssessments"][0]
    assert assessment["officialMission"]["status"] == "authority_unavailable"
    assert assessment["capabilities"]["evidence"]["status"] == "available"
    assert assessment["capabilities"]["measurement"]["status"] == "available"
    assert assessment["capabilities"]["correction"] == {
        "status": "available",
        "scope": "equipment_correction_only",
        "provenance": "shooter_confirmed_configuration",
        "physicalControlDirectionsAvailable": False,
    }


def test_missing_adjustment_data_withholds_correction_without_blocking_session():
    store = TestStore()
    candidate = equipment(category="Rifle", model="Ruger 10/22", unit="", click=None)
    preparation = prepared(store, "m4_25m_zero", candidate)
    assessment = preparation["equipmentAssessments"][0]
    assert assessment["capabilities"]["correction"]["status"] == "unavailable"
    started = start_session({
        "preparationToken": preparation["preparationToken"],
        "selectedEquipment": {**candidate, "source": "weapon_library"},
    }, store, idempotency_key="idem-no-adjustment", now=NOW)
    assert started["targetAdmission"]["status"] == "admitted"
    assert started["sessionMode"] == "target_evidence"
    assert started["capabilities"]["correction"]["status"] == "unavailable"


def test_gssf_non_pistol_is_admitted_but_official_score_is_withheld():
    store = TestStore()
    candidate = equipment(category="Rifle", model="Ruger 10/22")
    preparation = prepared(store, "gssf_ac_1", candidate)
    assessment = preparation["equipmentAssessments"][0]
    assert preparation["targetAdmission"]["status"] == "admitted"
    assert assessment["officialMission"]["status"] == "authority_unavailable"
    assert assessment["officialMission"]["restrictionIds"] == []
    assert assessment["capabilities"]["officialScore"]["status"] == "unavailable"
    started = start_session({
        "preparationToken": preparation["preparationToken"],
        "selectedEquipment": {**candidate, "source": "weapon_library"},
    }, store, idempotency_key="idem-gssf-rifle", now=NOW)
    assert started["sessionMode"] == "target_evidence"
    assert started["restrictions"] == []


def test_100_yard_admission_is_not_blocked_by_equipment_category():
    store = TestStore()
    candidate = equipment(category="Pistol", model="Target Pistol")
    preparation = prepared(store, "baker_st_100yd_smart_zero", candidate)
    assessment = preparation["equipmentAssessments"][0]
    assert assessment["officialMission"]["status"] == "eligible"
    assert assessment["capabilities"]["correction"]["status"] == "available"
    started = start_session({
        "preparationToken": preparation["preparationToken"],
        "selectedEquipment": {**candidate, "source": "weapon_library"},
    }, store, idempotency_key="idem-100-yard-pistol", now=NOW)
    assert started["sessionMode"] == "official_mission"


def test_start_issues_backend_id_and_idempotent_retry_returns_same_session():
    store = TestStore()
    candidate = equipment()
    preparation = prepared(store, selected=candidate)
    request = {
        "preparationToken": preparation["preparationToken"],
        "selectedEquipment": {**candidate, "source": "weapon_library"},
    }
    first = start_session(request, store, idempotency_key="idem-1", now=NOW)
    second = start_session(request, store, idempotency_key="idem-1", now=NOW + timedelta(seconds=2))
    assert first["authoritativeSessionId"].startswith("sczn3-session-")
    assert second["authoritativeSessionId"] == first["authoritativeSessionId"]
    assert second["idempotentReplay"] is True
    assert second["status"] == "existing"


def test_idempotency_key_conflict_fails_closed():
    store = TestStore()
    first_candidate = equipment(setup_id="weapon-1")
    preparation = prepared(store, selected=first_candidate)
    start_session({
        "preparationToken": preparation["preparationToken"],
        "selectedEquipment": {**first_candidate, "source": "weapon_library"},
    }, store, idempotency_key="idem-shared", now=NOW)
    second_preparation = prepared(store, selected=equipment(setup_id="weapon-2"))
    expect_error(lambda: start_session({
        "preparationToken": second_preparation["preparationToken"],
        "selectedEquipment": {**equipment(setup_id="weapon-2"), "source": "weapon_library"},
    }, store, idempotency_key="idem-shared", now=NOW), "idempotency_key_reused_with_different_request", 409)


def test_expired_preparation_and_atp_change_require_reconfirmation():
    expired_store = TestStore()
    candidate = equipment()
    expired = prepared(expired_store, selected=candidate)
    expect_error(lambda: start_session({
        "preparationToken": expired["preparationToken"],
        "selectedEquipment": {**candidate, "source": "weapon_library"},
    }, expired_store, idempotency_key="idem-expired", now=NOW + timedelta(hours=1)), "preparation_expired", 409)

    stale_store = TestStore()
    stale = prepared(stale_store, selected=candidate)
    original = TARGET_AUTHORITY_PROFILES["m4_25m_zero"]["targetProfileVersion"]
    TARGET_AUTHORITY_PROFILES["m4_25m_zero"]["targetProfileVersion"] = "changed-version"
    try:
        expect_error(lambda: start_session({
            "preparationToken": stale["preparationToken"],
            "selectedEquipment": {**candidate, "source": "weapon_library"},
        }, stale_store, idempotency_key="idem-stale", now=NOW), "atp_changed_reconfirmation_required", 409)
    finally:
        TARGET_AUTHORITY_PROFILES["m4_25m_zero"]["targetProfileVersion"] = original


def test_selected_equipment_must_match_prepared_fingerprint():
    store = TestStore()
    candidate = equipment()
    result = prepared(store, selected=candidate)
    changed = {**candidate, "opticClickValue": 0.5, "source": "weapon_library"}
    expect_error(lambda: start_session({
        "preparationToken": result["preparationToken"],
        "selectedEquipment": changed,
    }, store, idempotency_key="idem-changed", now=NOW), "selected_equipment_not_prepared", 409)


def test_missing_database_url_has_no_volatile_fallback():
    store = PostgresSessionStore(database_url="")
    result_store = TestStore()
    result = prepared(result_store)
    record = result_store.preparations[digest(result["preparationToken"])]
    expect_error(lambda: store.save_preparation(record), "DATABASE_URL_not_configured", 503)


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_") and callable(value)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"Backend Session Authority tests passed: {len(tests)}/{len(tests)}")
