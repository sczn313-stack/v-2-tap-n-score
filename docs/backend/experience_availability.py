"""Governed release availability for new shooter experiences.

This policy is intentionally separate from target geometry and scoring
contracts.  It controls which already-governed target/mode combinations may
begin a *new* session without changing target identity or historical reopen.
"""
from __future__ import annotations

from types import MappingProxyType
from typing import Any, Mapping, Optional


POLICY_ID = "sczn3-tst12-three-path-release-20261109-1"
SUPPORTED_EXPERIENCE_MODES = frozenset({"simulation", "actual"})
_TARGET_MODE_POLICY = MappingProxyType({
    "baker_tst12_17_5x23": frozenset({"simulation", "actual"}),
    "baker_tst12_23x35": frozenset({"simulation"}),
})


class ExperienceAvailabilityError(Exception):
    def __init__(self, status: str, reason: str, http_status: int = 400, **details: Any):
        super().__init__(reason)
        self.http_status = http_status
        self.payload = {
            "ok": False,
            "status": status,
            "reason": reason,
            "availabilityPolicyId": POLICY_ID,
            **details,
        }


def governed_modes(target_id: Any) -> Optional[frozenset[str]]:
    return _TARGET_MODE_POLICY.get(str(target_id or "").strip().lower())


def normalize_experience_mode(target_id: Any, raw_mode: Any) -> Optional[str]:
    """Validate a requested mode before any preparation record is written.

    Targets governed by this release policy require an explicit mode. Other
    targets retain their existing session contract when no mode is supplied,
    while any supplied mode must still be a supported normalized value.
    """
    target = str(target_id or "").strip().lower()
    allowed = governed_modes(target)
    raw = str(raw_mode or "").strip()
    if not raw:
        if allowed is not None:
            raise ExperienceAvailabilityError(
                "invalid_request", "experience_mode_required", 400, targetId=target
            )
        return None
    mode = raw.lower()
    if mode not in SUPPORTED_EXPERIENCE_MODES:
        raise ExperienceAvailabilityError(
            "invalid_request", "experience_mode_invalid", 400,
            targetId=target, experienceMode=raw,
        )
    if allowed is not None and mode not in allowed:
        raise ExperienceAvailabilityError(
            "experience_unavailable", "experience_mode_not_available", 409,
            targetId=target, experienceMode=mode,
        )
    return mode


def public_policy() -> Mapping[str, Any]:
    return MappingProxyType({
        "policyId": POLICY_ID,
        "targets": MappingProxyType({
            target_id: tuple(sorted(modes))
            for target_id, modes in _TARGET_MODE_POLICY.items()
        }),
    })
