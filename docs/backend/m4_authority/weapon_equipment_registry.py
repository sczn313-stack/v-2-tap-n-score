"""Canonical SCZN3 Military Weapon & Equipment Library resolver."""
from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any, Dict, Optional

REGISTRY_PATH = (
    Path(__file__).resolve().parent
    / "registries"
    / "military_weapon_equipment_registry.json"
)


def _load_registry() -> Dict[str, Any]:
    with REGISTRY_PATH.open("r", encoding="utf-8") as source:
        document = json.load(source)
    records = document.get("records")
    if not isinstance(records, list):
        raise RuntimeError("Weapon Equipment Registry records must be an array")
    record_ids = [str(record.get("recordId") or "") for record in records]
    if any(not record_id for record_id in record_ids):
        raise RuntimeError("Every Weapon Equipment Registry record requires recordId")
    if len(set(record_ids)) != len(record_ids):
        raise RuntimeError("Weapon Equipment Registry recordId values must be unique")
    return document


REGISTRY = _load_registry()
RECORDS_BY_ID = {
    record["recordId"]: record
    for record in REGISTRY["records"]
}


def get_equipment_record(record_id: Any) -> Optional[Dict[str, Any]]:
    record = RECORDS_BY_ID.get(str(record_id or ""))
    return copy.deepcopy(record) if record else None


def resolve_proven_equipment_record(
    record_id: Any,
    adjustment_system: Any = None,
) -> Optional[Dict[str, Any]]:
    record = get_equipment_record(record_id)
    if not record or str(record.get("status") or "").lower() != "proven":
        return None
    if adjustment_system and str(record.get("adjustmentSystem") or "").upper() != str(adjustment_system).upper():
        return None
    return record


def authority_model_from_record(record: Dict[str, Any]) -> Dict[str, Any]:
    axes = record.get("axes") or {}
    windage = axes.get("windage") or {}
    elevation = axes.get("elevation") or {}
    source = (record.get("sourceDocumentation") or [{}])[0]
    identity = record.get("equipmentIdentity") or {}
    return {
        "system": record.get("adjustmentSystem"),
        "label": record.get("displayName"),
        "unit": record.get("adjustmentUnit"),
        "windagePerClick": windage.get("movementPerClick"),
        "elevationPerClick": elevation.get("movementPerClick"),
        "authorityStatus": record.get("status"),
        "authorityId": record.get("recordId"),
        "equipmentAuthorityRecordId": record.get("recordId"),
        "authoritySource": source,
        "exactSightIdentity": {
            "weapon": record.get("militaryDesignation"),
            "rearSight": "; ".join(
                part for part in (
                    identity.get("rearSight"),
                    identity.get("rearAperture"),
                    identity.get("rearElevationSetting"),
                ) if part
            ),
            "windageControl": windage.get("control"),
            "elevationControl": elevation.get("control"),
            "mountingConfiguration": identity.get("mountingConfiguration"),
        },
        "roundingRule": record.get("roundingRule"),
        "turnDirections": {
            "windage": windage.get("directionConvention") or {},
            "elevation": elevation.get("directionConvention") or {},
        },
        "authorityRecord": record,
    }
