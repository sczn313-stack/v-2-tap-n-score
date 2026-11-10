#!/usr/bin/env python3
"""Founder-approved three-path TST-12 release availability regression."""
from __future__ import annotations

from datetime import datetime, timezone

from session_authority import SessionAuthorityError, prepare_session, start_session
from test_target_execution_scale_architecture import MemoryStore


NOW = datetime(2026, 11, 9, 18, 0, tzinfo=timezone.utc)


def expect_error(call, reason: str, status: str):
    try:
        call()
    except SessionAuthorityError as exc:
        assert exc.payload["reason"] == reason, exc.payload
        assert exc.payload["status"] == status, exc.payload
        return exc
    raise AssertionError(f"expected {reason}")


def counts(store: MemoryStore) -> tuple[int, int]:
    return len(store.preparations), len(store.sessions)


def prepare(store: MemoryStore, target_id: str, mode=None):
    payload = {"targetId": target_id, "missionFamily": "targetScoring"}
    if mode is not None:
        payload["experienceMode"] = mode
    return prepare_session(payload, store, now=NOW)


def start(store: MemoryStore, prepared: dict, mode=None):
    payload = {
        "preparationToken": prepared["preparationToken"],
        "selectedEquipment": prepared["standardSetup"],
    }
    if mode is not None:
        payload["experienceMode"] = mode
    return start_session(payload, store, idempotency_key=f"availability-{mode}", now=NOW)


def test_three_approved_combinations_prepare_and_start_once():
    for target_id, mode in (
        ("baker_tst12_17_5x23", "simulation"),
        ("baker_tst12_17_5x23", "actual"),
        ("baker_tst12_23x35", "simulation"),
    ):
        store = MemoryStore()
        prepared = prepare(store, target_id, mode.upper())
        assert prepared["experienceMode"] == mode
        assert prepared["experienceAvailabilityPolicyId"] == "sczn3-tst12-three-path-release-20261109-1"
        assert counts(store) == (1, 0)
        started = start(store, prepared, mode)
        assert started["experienceMode"] == mode
        assert counts(store) == (1, 1)


def test_withheld_combination_fails_before_any_write():
    store = MemoryStore()
    error = expect_error(
        lambda: prepare(store, "baker_tst12_23x35", "actual"),
        "experience_mode_not_available",
        "experience_unavailable",
    )
    assert error.payload["targetId"] == "baker_tst12_23x35"
    assert error.payload["experienceMode"] == "actual"
    assert counts(store) == (0, 0)


def test_missing_and_malformed_modes_fail_before_any_write():
    for mode, reason in ((None, "experience_mode_required"), ("practice", "experience_mode_invalid")):
        store = MemoryStore()
        expect_error(
            lambda mode=mode: prepare(store, "baker_tst12_17_5x23", mode),
            reason,
            "invalid_request",
        )
        assert counts(store) == (0, 0)


def test_prepared_mode_is_bound_to_start_token():
    store = MemoryStore()
    prepared = prepare(store, "baker_tst12_17_5x23", "simulation")
    expect_error(
        lambda: start(store, prepared, "actual"),
        "experience_mode_preparation_mismatch",
        "preparation_invalid",
    )
    assert counts(store) == (1, 0)


def test_other_targets_keep_existing_missing_mode_contract():
    store = MemoryStore()
    prepared = prepare_session({"targetId": "m4_25m_zero"}, store, now=NOW)
    assert "experienceMode" not in prepared
    assert counts(store) == (1, 0)


if __name__ == "__main__":
    for name, test in sorted(globals().items()):
        if name.startswith("test_") and callable(test):
            test()
            print(f"PASS {name}")
