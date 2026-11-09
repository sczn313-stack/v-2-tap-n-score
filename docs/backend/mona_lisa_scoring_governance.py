"""Read-only runtime registry for the Founder-authored Mona Lisa scoring schema."""
from __future__ import annotations

import json
from copy import deepcopy
from functools import lru_cache
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LEDGER = ROOT / "authority-evidence/platform/episode64-mona-lisa-scoring-schema-audited-2026-10-06/SCZN3_EP64_MONA_LISA_375_SCORING_GOVERNANCE_AUDITED.json"
SCHEMA_VERSION = "sczn3-episode64-mona-lisa-375-scoring-governance-audited-v2"


class MonaLisaScoringGovernanceError(ValueError):
    pass


@lru_cache(maxsize=1)
def _registry(path: Path = DEFAULT_LEDGER) -> dict[str, dict[str, Any]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise MonaLisaScoringGovernanceError("mona_lisa_scoring_governance_unavailable") from exc
    entries = payload.get("entries")
    if payload.get("schemaVersion") != SCHEMA_VERSION or not isinstance(entries, list) or len(entries) != 375:
        raise MonaLisaScoringGovernanceError("mona_lisa_scoring_governance_invalid")
    registry = {str(item.get("runtimeId") or "").lower(): item for item in entries}
    if len(registry) != 375 or "" in registry:
        raise MonaLisaScoringGovernanceError("mona_lisa_scoring_governance_identity_invalid")
    return registry


def scoring_governance_for_target(target_profile_id: Any) -> dict[str, Any] | None:
    value = _registry().get(str(target_profile_id or "").strip().lower())
    return deepcopy(value) if value else None


def scoring_governance_population() -> tuple[dict[str, Any], ...]:
    return tuple(deepcopy(value) for value in _registry().values())
