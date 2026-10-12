"""Read-only selection helper for the Episode 64 population registry."""
from __future__ import annotations

import json
from pathlib import Path

REGISTRY = Path(__file__).resolve().parent / "registries/episode64_platform_population_registry.json"


def load_registry(path: Path = REGISTRY) -> dict:
    data = json.loads(path.read_text())
    if data.get("schemaVersion") not in {
        "sczn3-platform-population-registry-v1",
        "sczn3-platform-population-registry-v2",
    }:
        raise ValueError("unsupported platform population registry schema")
    if data.get("summary", {}).get("preservedRegistryRecords") != 1993 or len(data.get("records", [])) != 1993:
        raise ValueError("population registry must preserve all 1,993 records")
    return data


def find_by_runtime_id(runtime_id: str, path: Path = REGISTRY) -> dict | None:
    return next((r for r in load_registry(path)["records"] if runtime_id in r["runtimeIds"]), None)


def eligible_executable_face(runtime_id: str, path: Path = REGISTRY) -> bool:
    record = find_by_runtime_id(runtime_id, path)
    return bool(record and record["executableFaceSelection"]["eligible"])
