"""Read-only access to the reconciled platform Founder-acceptance registry."""
from __future__ import annotations

import json
from pathlib import Path

REGISTRY = Path(__file__).resolve().parent / "registries/episode64_platform_founder_acceptance_registry.json"


def load_registry(path: Path = REGISTRY) -> dict:
    data = json.loads(path.read_text())
    if data.get("schemaVersion") != "sczn3-platform-founder-acceptance-registry-v1":
        raise ValueError("unsupported Founder-acceptance registry schema")
    if data.get("summary", {}).get("total") != 1993 or len(data.get("records", [])) != 1993:
        raise ValueError("Founder-acceptance registry is not a complete 1,993-face census")
    return data


def find_by_runtime_id(runtime_id: str, path: Path = REGISTRY) -> dict | None:
    for record in load_registry(path)["records"]:
        if runtime_id in record["runtimeIds"]:
            return record
    return None


def eligible_for_founder_review(runtime_id: str, path: Path = REGISTRY) -> bool:
    record = find_by_runtime_id(runtime_id, path)
    return bool(record and record["librarySelection"]["eligibleForFounderReview"])
