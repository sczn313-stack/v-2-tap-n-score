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
    adjustment_profiles = document.get("adjustmentProfiles")
    if not isinstance(adjustment_profiles, list):
        raise RuntimeError("Weapon Equipment Registry adjustmentProfiles must be an array")
    adjustment_profile_ids = [
        str(profile.get("adjustmentProfileId") or "")
        for profile in adjustment_profiles
    ]
    if any(not profile_id for profile_id in adjustment_profile_ids):
        raise RuntimeError("Every adjustment profile requires adjustmentProfileId")
    if len(set(adjustment_profile_ids)) != len(adjustment_profile_ids):
        raise RuntimeError("Adjustment profile IDs must be unique")
    return document


REGISTRY = _load_registry()
RECORDS_BY_ID = {
    record["recordId"]: record
    for record in REGISTRY["records"]
}
ADJUSTMENT_PROFILES_BY_ID = {
    profile["adjustmentProfileId"]: profile
    for profile in REGISTRY["adjustmentProfiles"]
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


def get_adjustment_profile(adjustment_profile_id: Any) -> Optional[Dict[str, Any]]:
    profile = ADJUSTMENT_PROFILES_BY_ID.get(str(adjustment_profile_id or ""))
    return copy.deepcopy(profile) if profile else None


def resolve_target_adjustment_authority(
    target_zero_relationship: Any,
) -> Optional[Dict[str, Any]]:
    if not isinstance(target_zero_relationship, dict):
        return None

    equipment_configuration_id = str(
        target_zero_relationship.get("equipmentConfigurationId") or ""
    )
    target_profile_id = str(target_zero_relationship.get("targetProfileId") or "")
    if not equipment_configuration_id or not target_profile_id:
        return None

    selection_type = target_zero_relationship.get("authoritySelectionType")
    if selection_type == "reusable_adjustment_profile":
        profile_id = target_zero_relationship.get("adjustmentProfileId")
        if not profile_id or target_zero_relationship.get("targetScopedAuthorityRecordId") is not None:
            return None
        profile = get_adjustment_profile(profile_id)
        if not profile or str(profile.get("status") or "").lower() != "proven":
            return None
        if str(profile.get("equipmentConfigurationId") or "") != equipment_configuration_id:
            return None
        return {
            "selectionType": "reusable_adjustment_profile",
            "adjustmentProfile": profile,
            "authorityRecord": None,
        }

    if selection_type == "target_scoped_authority":
        record_id = target_zero_relationship.get("targetScopedAuthorityRecordId")
        if target_zero_relationship.get("adjustmentProfileId") is not None or not record_id:
            return None
        record = resolve_proven_equipment_record(record_id)
        if not record or record.get("recordType") != "target_scoped_weapon_sight_configuration":
            return None
        if str(record.get("equipmentConfigurationId") or "") != equipment_configuration_id:
            return None
        authority_scope = record.get("authorityScope") or {}
        if str(authority_scope.get("targetProfileId") or "") != target_profile_id:
            return None
        return {
            "selectionType": "target_scoped_authority",
            "adjustmentProfile": None,
            "authorityRecord": record,
        }

    return None


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
