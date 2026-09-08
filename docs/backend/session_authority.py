"""Backend-owned session preparation and creation authority.

The browser may propose a Target ID and equipment candidates. This module owns
Target ID -> ATP -> mission resolution, target admission, official-mission
eligibility, capability availability, durable session identity, and idempotency.
Runtime authority requires Postgres through the dedicated backend-only
``SCZN3_SESSION_SEC_DATABASE_URL``;
there is intentionally no in-memory, filesystem, or browser fallback.
"""
from __future__ import annotations

import hashlib
import json
import os
import secrets
import uuid
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping, Optional

from gssf_ac_1_authority import GSSF_AC_1_ATP, GSSF_AC_1_EXECUTION_CONTRACT
from m4_authority.weapon_equipment_registry import (
    authority_model_from_adjustment_profile,
    authority_model_from_record,
    get_adjustment_profile,
    resolve_proven_equipment_record,
)
from mfam_family_authority import resolve_target_profile as resolve_mfam_target_profile
from target_execution_contract import TargetExecutionContractError, TargetExecutionContractResolver, runtime_resolver


PREPARATION_TTL_SECONDS = int(os.environ.get("SCZN3_SESSION_PREPARATION_TTL_SECONDS", "900"))
M4_STANDARD_EQUIPMENT_AUTHORITY_ID = "M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01"
EQUIPMENT_KNOWLEDGE_REGISTRY_PATH = Path(__file__).resolve().parent / "registries" / "equipment_knowledge_registry.json"


def _load_equipment_knowledge_registry() -> Dict[str, Any]:
    with EQUIPMENT_KNOWLEDGE_REGISTRY_PATH.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    records = payload.get("records")
    if payload.get("schemaId") != "sczn3-equipment-knowledge-v1.1" or not isinstance(records, list):
        raise RuntimeError("equipment_knowledge_registry_invalid")
    return payload


EQUIPMENT_KNOWLEDGE_REGISTRY = _load_equipment_knowledge_registry()
EQUIPMENT_KNOWLEDGE_BY_RECORD_ID = {
    record["recordId"]: record
    for record in EQUIPMENT_KNOWLEDGE_REGISTRY["records"]
    if isinstance(record, Mapping) and record.get("recordId")
}

ZEROING_EXPERIENCE_SCHEMA_VERSION = "sczn3-zeroing-experience-profile-v1"
ZEROING_CAPABILITY_ID = "sczn3-governed-zeroing-road-v1"


def mfam_authority_binding(target_profile_id: str) -> Dict[str, Any]:
    """Resolve the executable M/FAM differences owned by backend authority."""
    resolved = resolve_mfam_target_profile(target_profile_id)
    binding = resolved["binding"]
    family_package = resolved.get("familyAuthorityPackage")
    family_geometry = (
        family_package.get("geometryAuthority")
        if isinstance(family_package, Mapping)
        else resolved["family"]["geometry"]
    )
    family_procedure = (
        family_package.get("procedureAuthority")
        if isinstance(family_package, Mapping)
        else resolved["family"]["procedure"]
    )
    return {
        "registryId": resolved["registryId"],
        "registryVersion": resolved["version"],
        "productId": binding["productId"],
        "publisherIdentity": {
            "name": resolved["product"]["publisherOrIssuer"],
        },
        "productIdentity": {
            "productId": binding["productId"],
            "name": resolved["product"]["exactName"],
            "identifiers": deepcopy(resolved["product"].get("identifiers") or {}),
            "inventoryFaceId": binding.get("inventoryFaceId"),
        },
        "faceIdentity": deepcopy(resolved["product"]["face"]),
        "familyId": binding["familyId"],
        "familyAuthorityPackageId": binding.get("familyAuthorityPackageId"),
        "familyAuthorityVersion": family_package.get("authorityVersion") if isinstance(family_package, Mapping) else None,
        "geometry": deepcopy(family_geometry),
        "aimAuthority": deepcopy(family_package.get("aimAuthority")) if isinstance(family_package, Mapping) else None,
        "measurementAuthority": deepcopy(family_package.get("measurementAuthority")) if isinstance(family_package, Mapping) else None,
        "procedure": deepcopy(family_procedure),
        "mechanicalAuthorityId": binding["mechanicalAuthorityId"],
        "equipmentConfiguration": deepcopy(resolved["mechanicalAuthority"]["equipmentConfiguration"]),
        "confirmationAuthority": deepcopy(family_package.get("confirmationAuthority")) if isinstance(family_package, Mapping) else None,
        "registrationPackageId": binding["registrationPackageId"],
        "canonicalRepresentationAuthority": deepcopy(binding.get("canonicalRepresentationAuthority")),
        "status": binding["status"],
    }


def zeroing_experience(
    target_profile_id: str,
    target_profile_version: str,
    *,
    authority_family: str,
    entry_mode: str,
    confirmation_mode: str,
) -> Dict[str, Any]:
    """Declare target differences without transferring workflow ownership."""
    return {
        "schemaVersion": ZEROING_EXPERIENCE_SCHEMA_VERSION,
        "capabilityId": ZEROING_CAPABILITY_ID,
        "targetProfileId": target_profile_id,
        "targetProfileVersion": target_profile_version,
        "authorityFamily": authority_family,
        "entryMode": entry_mode,
        "confirmationMode": confirmation_mode,
    }


def standard_m16a2_family_profile(
    target_profile_id: str,
    target_profile_version: str,
    target_name: str,
    *,
    atp_id: str,
    mission_id: str,
    registration_package_id: str,
    canonical_coordinate_system_id: str,
) -> Dict[str, Any]:
    """Bind one exact product representation to the shared M16A2 family road."""
    family_binding = mfam_authority_binding(target_profile_id)
    return {
        "targetId": target_profile_id,
        "targetAuthorityId": target_profile_version,
        "targetName": target_name,
        "targetProfileVersion": target_profile_version,
        "atpId": atp_id,
        "zeroingExperience": zeroing_experience(
            target_profile_id,
            target_profile_version,
            authority_family="mfam",
            entry_mode="photo",
            confirmation_mode="governed",
        ),
        "mfamAuthorityBinding": family_binding,
        "confirmationAuthority": deepcopy(family_binding["confirmationAuthority"]),
        "registrationAuthority": {
            "registrationPackageId": registration_package_id,
            "registrationPackageVersion": "1",
            "canonicalCoordinateSystemId": canonical_coordinate_system_id,
            "status": "available",
        },
        "missionIdentity": {
            "missionFamily": "zeroingCorrection",
            "missionId": mission_id,
            "resultPackageType": "zeroCorrectionResult",
        },
        "governedDistance": {"value": 25, "unit": "M", "locked": True},
        "equipmentRequirements": {
            "weaponCategories": ["Rifle"],
            "modelFamilies": ["M16A2"],
            "requiresAdjustmentSystem": True,
            "allowedAdjustmentUnits": ["MOA"],
        },
        "standardSetupAuthority": {
            "setupId": "standard-m16a2-iron-fsp-rear-drum",
            "authorityId": "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011",
            "kind": "registered_adjustment_profile",
            "equipmentConfigurationId": "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
        },
    }


def standard_m4_family_profile(
    target_profile_id: str,
    target_profile_version: str,
    target_name: str,
    *,
    atp_id: str,
    mission_id: str,
    registration_package_id: str,
    canonical_coordinate_system_id: str,
) -> Dict[str, Any]:
    """Bind one exact product representation to the shared Standard M4 family road."""
    family_binding = mfam_authority_binding(target_profile_id)
    return {
        "targetId": target_profile_id,
        "targetAuthorityId": target_profile_version,
        "targetName": target_name,
        "targetProfileVersion": target_profile_version,
        "atpId": atp_id,
        "zeroingExperience": zeroing_experience(
            target_profile_id,
            target_profile_version,
            authority_family="mfam",
            entry_mode="photo",
            confirmation_mode="governed",
        ),
        "mfamAuthorityBinding": family_binding,
        "confirmationAuthority": deepcopy(family_binding["confirmationAuthority"]),
        "registrationAuthority": {
            "registrationPackageId": registration_package_id,
            "registrationPackageVersion": "1",
            "canonicalCoordinateSystemId": canonical_coordinate_system_id,
            "status": "available",
        },
        "missionIdentity": {
            "missionFamily": "zeroingCorrection",
            "missionId": mission_id,
            "resultPackageType": "zeroCorrectionResult",
        },
        "governedDistance": {"value": 25, "unit": "M", "locked": True},
        "equipmentRequirements": {
            "weaponCategories": ["Rifle"],
            "modelFamilies": ["M4", "M4A1"],
            "requiresAdjustmentSystem": True,
            "allowedAdjustmentUnits": ["MOA"],
        },
        "standardSetupAuthority": {
            "setupId": "standard-m4-iron-dch-fsp",
            "authorityId": "M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011",
            "kind": "registered_adjustment_profile",
            "equipmentConfigurationId": "M4-M4A1-DCH-FSP",
        },
    }


TARGET_AUTHORITY_PROFILES: Dict[str, Dict[str, Any]] = {
    "baker_m16a2_25m_zero": standard_m16a2_family_profile(
        "baker_m16a2_25m_zero",
        "BAKER_M16A2_25M_AUTHORITY_v1",
        "Baker M16A2 25 Meter Zeroing Target",
        atp_id="baker-m16a2-25m-zero-atp-v1",
        mission_id="BAKER_M16A2_25M_300M_ZERO",
        registration_package_id="baker-m16a2-25m-photo-registration-v1",
        canonical_coordinate_system_id="BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1",
    ),
    "speedwell_dodm4_m16a2_25m_zero": standard_m16a2_family_profile(
        "speedwell_dodm4_m16a2_25m_zero",
        "SPEEDWELL_DODM4_M16A2_AUTHORITY_v1",
        "Speedwell DODM4 M16A2 25 Meter Zeroing Target",
        atp_id="speedwell-dodm4-m16a2-25m-zero-atp-v1",
        mission_id="SPEEDWELL_DODM4_M16A2_25M_300M_ZERO",
        registration_package_id="speedwell-dodm4-m16a2-photo-registration-v1",
        canonical_coordinate_system_id="SPEEDWELL_M16A2_PUBLISHER_FACE_AUTHORITY_v1",
    ),
    "army_nsn_6920_01_395_2949_m16a2_25m_zero": standard_m16a2_family_profile(
        "army_nsn_6920_01_395_2949_m16a2_25m_zero",
        "ARMY_NSN_6920_01_395_2949_M16A2_AUTHORITY_v1",
        "Army-Issued M16A2 25 Meter Zeroing Target",
        atp_id="army-nsn-6920-01-395-2949-m16a2-25m-zero-atp-v1",
        mission_id="ARMY_ISSUED_M16A2_25M_300M_ZERO",
        registration_package_id="army-nsn-6920-01-395-2949-m16a2-photo-registration-v1",
        canonical_coordinate_system_id="ARMY_NSN_6920_01_395_2949_M16A2_FACE_AUTHORITY_v1",
    ),
    "qualification_m16a2_25m_zero": standard_m16a2_family_profile(
        "qualification_m16a2_25m_zero",
        "QUALIFICATION_M16A2_25M_AUTHORITY_v1",
        "Qualification Targets M16A2 25 Meter Zeroing Target",
        atp_id="qualification-m16a2-25m-zero-atp-v1",
        mission_id="QUALIFICATION_M16A2_25M_300M_ZERO",
        registration_package_id="qualification-m16a2-photo-registration-v1",
        canonical_coordinate_system_id="QUALIFICATION_M16A2_PUBLISHER_FACE_AUTHORITY_v1",
    ),
    "gunfun_32120_m16a2_green_25m_zero": standard_m16a2_family_profile(
        "gunfun_32120_m16a2_green_25m_zero",
        "GUNFUN_32120_M16A2_GREEN_AUTHORITY_v1",
        "GunFun 32120 M16A2 Green 25 Meter Zeroing Target",
        atp_id="gunfun-32120-m16a2-green-25m-zero-atp-v1",
        mission_id="GUNFUN_32120_M16A2_25M_300M_ZERO",
        registration_package_id="gunfun-32120-m16a2-green-photo-registration-v1",
        canonical_coordinate_system_id="GUNFUN_32120_M16A2_GREEN_FACE_AUTHORITY_v1",
    ),
    "rite_9125_m16a2_25m_zero": standard_m16a2_family_profile(
        "rite_9125_m16a2_25m_zero", "RITE_9125_M16A2_AUTHORITY_v1",
        "Rite in the Rain 9125 M16A2 25 Meter Zeroing Target",
        atp_id="rite-9125-m16a2-25m-zero-atp-v1", mission_id="RITE_9125_M16A2_25M_300M_ZERO",
        registration_package_id="rite-9125-m16a2-photo-registration-v1",
        canonical_coordinate_system_id="RITE_9125_M16A2_FRONT_FACE_AUTHORITY_v1",
    ),
    "national_23075_m16a2_25m_zero": standard_m16a2_family_profile(
        "national_23075_m16a2_25m_zero", "NATIONAL_23075_M16A2_AUTHORITY_v1",
        "National 23075 M16A2 25 Meter Zeroing Target",
        atp_id="national-23075-m16a2-25m-zero-atp-v1", mission_id="NATIONAL_23075_M16A2_25M_300M_ZERO",
        registration_package_id="national-23075-m16a2-photo-registration-v1",
        canonical_coordinate_system_id="NATIONAL_23075_M16A2_FACE_AUTHORITY_v1",
    ),
    "alco_ar0_m16a2_25m_zero": standard_m16a2_family_profile(
        "alco_ar0_m16a2_25m_zero", "ALCO_AR0_M16A2_AUTHORITY_v1",
        "Alco AR-0 M16A2 25 Meter Zeroing Target",
        atp_id="alco-ar0-m16a2-25m-zero-atp-v1", mission_id="ALCO_AR0_M16A2_25M_300M_ZERO",
        registration_package_id="alco-ar0-m16a2-photo-registration-v1",
        canonical_coordinate_system_id="ALCO_AR0_M16A2_FACE_AUTHORITY_v1",
    ),
    "gunfun_32110_m16a2_red_25m_zero": standard_m16a2_family_profile(
        "gunfun_32110_m16a2_red_25m_zero", "GUNFUN_32110_M16A2_RED_AUTHORITY_v1",
        "GunFun 32110 M16A2 Red 25 Meter Zeroing Target",
        atp_id="gunfun-32110-m16a2-red-25m-zero-atp-v1", mission_id="GUNFUN_32110_M16A2_25M_300M_ZERO",
        registration_package_id="gunfun-32110-m16a2-red-photo-registration-v1",
        canonical_coordinate_system_id="GUNFUN_32110_M16A2_RED_FACE_AUTHORITY_v1",
    ),
    "gunfun_82020_m16a2_25m_zero": standard_m16a2_family_profile(
        "gunfun_82020_m16a2_25m_zero", "GUNFUN_82020_M16A2_AUTHORITY_v1",
        "GunFun 82020 M16A2 25 Meter Zeroing Target",
        atp_id="gunfun-82020-m16a2-25m-zero-atp-v1", mission_id="GUNFUN_82020_M16A2_25M_300M_ZERO",
        registration_package_id="gunfun-82020-m16a2-photo-registration-v1",
        canonical_coordinate_system_id="GUNFUN_82020_M16A2_FACE_AUTHORITY_v1",
    ),
    "baker_m4_25m_zero": standard_m4_family_profile(
        "baker_m4_25m_zero", "BAKER_M4_25M_AUTHORITY_v1",
        "Baker M4 25 Meter Zeroing Target",
        atp_id="baker-m4-25m-zero-atp-v1", mission_id="BAKER_M4_25M_300M_ZERO",
        registration_package_id="baker-st-m16a2-m4-m4-photo-registration-v1",
        canonical_coordinate_system_id="BAKER_ST_M16A2_M4_M4_FACE_AUTHORITY_v1",
    ),
    "m4_25m_zero": {
        "targetId": "m4_25m_zero",
        "targetAuthorityId": "M4_TARGET_AUTHORITY_v1_ORIGINAL",
        "targetName": "M4/M16 Series Weapons 25M Zero",
        "targetProfileVersion": "M4_TARGET_AUTHORITY_v1_ORIGINAL",
        "atpId": "m4-25m-zero-atp-v1",
        "zeroingExperience": zeroing_experience(
            "m4_25m_zero",
            "M4_TARGET_AUTHORITY_v1_ORIGINAL",
            authority_family="mfam",
            entry_mode="registered-reference",
            confirmation_mode="governed",
        ),
        "mfamAuthorityBinding": mfam_authority_binding("m4_25m_zero"),
        "registrationAuthority": {
            "registrationPackageId": "m4-m16-25m-zero-photo-registration-v1",
            "registrationPackageVersion": "1",
            "canonicalCoordinateSystemId": "M4_M16_25M_ZERO_AUTHORITY_v1",
            "status": "available",
        },
        "missionIdentity": {
            "missionFamily": "zeroingCorrection",
            "missionId": "M4_25M_300M_ZERO",
            "resultPackageType": "zeroCorrectionResult",
        },
        "governedDistance": {"value": 25, "unit": "M", "locked": True},
        "equipmentRequirements": {
            "weaponCategories": ["Rifle"],
            "modelFamilies": ["AR Platform", "M4", "M16"],
            "requiresAdjustmentSystem": True,
            "allowedAdjustmentUnits": ["MOA", "MRAD"],
        },
        "standardSetupAuthority": {
            "setupId": "standard-m4-iron-dch-fsp",
            "authorityId": M4_STANDARD_EQUIPMENT_AUTHORITY_ID,
            "kind": "registered_m4_iron_sight",
        },
    },
    "baker_st_100yd_smart_zero": {
        "targetId": "baker_st_100yd_smart_zero",
        "targetAuthorityId": "BAKER_ST_100YD_SMART",
        "targetName": "Baker 100 Yard Smart Target",
        "targetProfileVersion": "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
        "atpId": "baker-100-yard-smart-zero-atp-v1",
        "zeroingExperience": zeroing_experience(
            "baker_st_100yd_smart_zero",
            "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
            authority_family="universal",
            entry_mode="registered-reference",
            confirmation_mode="evidence",
        ),
        "registrationAuthority": {
            "registrationPackageId": "baker-st-100yd-smart-photo-registration-v1",
            "registrationPackageVersion": "1",
            "canonicalCoordinateSystemId": "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
            "status": "available",
        },
        "missionIdentity": {
            "missionFamily": "zeroingCorrection",
            "missionId": "BAKER_100YD_ZERO",
            "resultPackageType": "zeroCorrectionResult",
        },
        "governedDistance": {"value": 100, "unit": "YDS", "locked": False},
        "confirmationAuthority": {
            "status": "authority_unavailable",
            "reason": "authoritative_confirmation_standard_not_registered",
            "requiredConfirmationShotCount": None,
            "residualTolerance": None,
            "units": None,
            "applicableTargetProfileVersion": None,
            "authorityProvenance": None,
            "additionalConfirmationRules": None,
            "unresolvedFields": [
                "requiredConfirmationShotCount",
                "residualTolerance",
                "units",
                "applicableTargetProfileVersion",
                "authorityProvenance",
                "additionalConfirmationRules",
            ],
        },
        "equipmentRequirements": {
            "weaponCategories": ["Rifle"],
            "requiresAdjustmentSystem": True,
            "allowedAdjustmentUnits": ["MOA", "MRAD"],
        },
        "standardSetupAuthority": {
            "setupId": "standard-baker-100yd-quarter-moa-scope",
            "authorityId": "BAKER_ST_100YD_STANDARD_SETUP_v1",
            "kind": "target_standard_scope",
            "adjustmentUnit": "MOA",
            "clickValue": 0.25,
        },
    },
    "gssf_ac_1": {
        "targetId": GSSF_AC_1_ATP["targetProfileId"],
        "targetAuthorityId": GSSF_AC_1_ATP["targetProfileId"],
        "targetName": "GSSF AC-1",
        "targetProfileVersion": GSSF_AC_1_ATP["targetProfileVersion"],
        "atpId": "gssf-ac-1-atp-v1",
        "missionIdentity": {
            "missionFamily": GSSF_AC_1_EXECUTION_CONTRACT["missionFamily"],
            "missionId": "GSSF_AC_1_PAPER_PENALTY",
            "resultPackageType": GSSF_AC_1_EXECUTION_CONTRACT["resultPackageType"],
        },
        "governedDistance": {"value": None, "unit": None, "locked": False},
        "registrationAuthority": {
            "registrationPackageId": "gssf-ac-1-photo-registration-fixture-v1",
            "registrationPackageVersion": "1",
            "canonicalCoordinateSystemId": "gssf-ac-1-canonical-coordinate-system-v1",
            "status": "available",
        },
        "equipmentRequirements": {
            "weaponCategories": ["Pistol"],
            "requiresAdjustmentSystem": False,
            "allowedAdjustmentUnits": [],
        },
        "standardSetupAuthority": {
            "setupId": "standard-gssf-pistol",
            "authorityId": "GSSF_AC_1_STANDARD_SETUP_v1",
            "kind": "target_standard_pistol",
        },
    },
    "baker_sl_st1": {
        "targetId": "BAKER_SL_ST1",
        "targetAuthorityId": "BAKER_SL_ST1",
        "targetName": "Silhouette Target (USPSA)",
        "targetProfileVersion": "1",
        "atpId": "ATP_BAKER_SL_ST1_PRACTICE_V1",
        "missionIdentity": {
            "missionFamily": "smartEvidenceCapture",
            "missionId": "BAKER_SL_ST1_PRACTICE_EVIDENCE",
            "resultPackageType": "smartEvidenceResult",
        },
        "governedDistance": {"value": None, "unit": None, "locked": False},
        "equipmentRequirements": {
            "weaponCategories": [],
            "requiresAdjustmentSystem": False,
            "allowedAdjustmentUnits": [],
        },
        "standardSetupAuthority": {
            "setupId": "baker-sl-st1-optional-equipment",
            "authorityId": "ATP_BAKER_SL_ST1_PRACTICE_V1",
            "kind": "target_optional_equipment",
        },
        "officialMissionRequired": False,
    },
    "idpa_silhouette_sl_st2": {
        "targetId": "idpa_silhouette_sl_st2",
        "targetAuthorityId": "BAKER_SL_ST2_23X35_PRODUCT_AUTHORITY_V1",
        "targetName": "Silhouette Target (IDPA)",
        "targetProfileVersion": "1",
        "atpId": "ATP_BAKER_SL_ST2_TIMED_PAIR_7YD_V1",
        "missionIdentity": {
            "missionFamily": "idpaTimedPractice",
            "missionId": "SCZN3_SL_ST2_TIMED_PAIR_7YD_V1",
            "resultPackageType": "idpaTimeScoreResult",
        },
        "governedDistance": {"value": 7, "unit": "YDS", "locked": True},
        "equipmentRequirements": {
            "weaponCategories": ["Pistol"],
            "requiresAdjustmentSystem": False,
            "allowedAdjustmentUnits": [],
        },
        "standardSetupAuthority": {
            "setupId": "baker-sl-st2-optional-pistol",
            "authorityId": "SCZN3_SL_ST2_TIMED_PAIR_7YD_V1",
            "kind": "target_optional_equipment",
        },
        "officialMissionRequired": False,
    },
    "baker_gf_db": {
        "targetId": "baker_gf_db",
        "targetAuthorityId": "BAKER_GF_DB_PRODUCT_AUTHORITY_V1",
        "targetName": "Dartboard Target",
        "targetProfileVersion": "1",
        "atpId": "ATP_BAKER_GF_DB_V1",
        "missionIdentity": {
            "missionFamily": "bakerFunGame",
            "missionId": "BAKER_GF_DB_RANGE_GAMES_V1",
            "resultPackageType": "bakerDartboardGameResult",
        },
        "governedDistance": {"value": None, "unit": None, "locked": False},
        "equipmentRequirements": {"weaponCategories": [], "requiresAdjustmentSystem": False, "allowedAdjustmentUnits": []},
        "standardSetupAuthority": {"setupId": "baker-gf-db-optional-equipment", "authorityId": "BAKER_GF_DB_PRODUCT_AUTHORITY_V1", "kind": "target_optional_equipment"},
        "officialMissionRequired": False,
    },
    "baker_gf_bp": {
        "targetId": "baker_gf_bp",
        "targetAuthorityId": "BAKER_GF_BP_PRODUCT_AUTHORITY_V1",
        "targetName": "Bowling Pins Target",
        "targetProfileVersion": "1",
        "atpId": "ATP_BAKER_GF_BP_V1",
        "missionIdentity": {
            "missionFamily": "bakerFunGame",
            "missionId": "BAKER_GF_BP_TEN_SHOT_CHALLENGE_V1",
            "resultPackageType": "bakerBowlingPinsResult",
        },
        "governedDistance": {"value": None, "unit": None, "locked": False},
        "equipmentRequirements": {"weaponCategories": [], "requiresAdjustmentSystem": False, "allowedAdjustmentUnits": []},
        "standardSetupAuthority": {"setupId": "baker-gf-bp-optional-equipment", "authorityId": "BAKER_GF_BP_PRODUCT_AUTHORITY_V1", "kind": "target_optional_equipment"},
        "officialMissionRequired": False,
    },
    "ez2c_dot_torture_17": {
        "targetId": "ez2c_dot_torture_17",
        "targetAuthorityId": "EZ2C_STYLE_17_DOT_TORTURE_PRODUCT_AUTHORITY_V1",
        "targetName": "Dot Torture",
        "targetProfileVersion": "1",
        "atpId": "ATP_EZ2C_STYLE_17_DOT_TORTURE_V1",
        "missionIdentity": {"missionFamily": "catalogFunGame", "missionId": "EZ2C_STYLE_17_PUBLISHED_COURSE_V1", "resultPackageType": "dotTortureCourseResult"},
        "governedDistance": {"value": 3, "unit": "YDS", "locked": True},
        "equipmentRequirements": {"weaponCategories": [], "requiresAdjustmentSystem": False, "allowedAdjustmentUnits": []},
        "standardSetupAuthority": {"setupId": "ez2c-style-17-optional-equipment", "authorityId": "EZ2C_STYLE_17_DOT_TORTURE_PRODUCT_AUTHORITY_V1", "kind": "target_optional_equipment"},
        "officialMissionRequired": False,
    },
    "baker_gf_bb_c": {
        "targetId": "baker_gf_bb_c",
        "targetAuthorityId": "BAKER_GF_BB_C_PRODUCT_AUTHORITY_V1",
        "targetName": "Billiard Balls",
        "targetProfileVersion": "1",
        "atpId": "ATP_BAKER_GF_BB_C_V1",
        "missionIdentity": {"missionFamily": "catalogFunGame", "missionId": "BAKER_GF_BB_C_PUBLISHED_GAME_V1", "resultPackageType": "bakerBilliardSequenceResult"},
        "governedDistance": {"value": None, "unit": None, "locked": False},
        "equipmentRequirements": {"weaponCategories": [], "requiresAdjustmentSystem": False, "allowedAdjustmentUnits": []},
        "standardSetupAuthority": {"setupId": "baker-gf-bb-c-optional-equipment", "authorityId": "BAKER_GF_BB_C_PRODUCT_AUTHORITY_V1", "kind": "target_optional_equipment"},
        "officialMissionRequired": False,
    },
    "baker_gf_battleship": {
        "targetId": "baker_gf_battleship",
        "targetAuthorityId": "BAKER_GF_BATTLESHIP_PRODUCT_AUTHORITY_V1",
        "targetName": "Battleship Target",
        "targetProfileVersion": "1",
        "atpId": "ATP_BAKER_GF_BATTLESHIP_V1",
        "missionIdentity": {"missionFamily": "catalogFunGame", "missionId": "BAKER_GF_BATTLESHIP_PUBLISHED_GAME_V1", "resultPackageType": "bakerBattleshipGameResult"},
        "governedDistance": {"value": None, "unit": None, "locked": False},
        "equipmentRequirements": {"weaponCategories": [], "requiresAdjustmentSystem": False, "allowedAdjustmentUnits": []},
        "standardSetupAuthority": {"setupId": "baker-gf-battleship-optional-equipment", "authorityId": "BAKER_GF_BATTLESHIP_PRODUCT_AUTHORITY_V1", "kind": "target_optional_equipment"},
        "officialMissionRequired": False,
    },
    "gunfun_22740_vital_dude": {
        "targetId": "gunfun_22740_vital_dude",
        "targetAuthorityId": "ATP_GUNFUN_22740_VITAL_DUDE_EVIDENCE_V1",
        "targetName": "GunFun Vital Dude",
        "targetProfileVersion": "1",
        "atpId": "ATP_GUNFUN_22740_VITAL_DUDE_EVIDENCE_V1",
        "missionIdentity": {
            "missionFamily": "smartEvidenceCapture",
            "missionId": "GUNFUN_22740_EVIDENCE_CAPTURE_V1",
            "resultPackageType": "smartEvidenceResult",
        },
        "governedDistance": {"value": None, "unit": None, "locked": False},
        "equipmentRequirements": {"weaponCategories": [], "requiresAdjustmentSystem": False, "allowedAdjustmentUnits": []},
        "standardSetupAuthority": {
            "setupId": "gunfun-vital-dude-optional-equipment",
            "authorityId": "ATP_GUNFUN_22740_VITAL_DUDE_EVIDENCE_V1",
            "kind": "target_optional_equipment",
        },
        "officialMissionRequired": False,
    },
}

TARGET_ID_ALIASES = {
    "m4_target_authority_v1_original": "m4_25m_zero",
    "baker_st_m16a2_standard_face": "baker_m16a2_25m_zero",
    "baker_st_100yd_smart": "baker_st_100yd_smart_zero",
    "gssf-ac-1": "gssf_ac_1",
    "baker_sl_st1": "baker_sl_st1",
    "baker-sl-st1": "baker_sl_st1",
    "baker_sl_st2": "idpa_silhouette_sl_st2",
    "baker-sl-st2": "idpa_silhouette_sl_st2",
    "idpa_silhouette_sl_st2": "idpa_silhouette_sl_st2",
    "baker_gf_db": "baker_gf_db",
    "baker-gf-db": "baker_gf_db",
    "gf-db": "baker_gf_db",
    "baker_gf_bp": "baker_gf_bp",
    "baker-gf-bp": "baker_gf_bp",
    "gf-bp": "baker_gf_bp",
    "ez2c_style_17": "ez2c_dot_torture_17",
    "dot-torture": "ez2c_dot_torture_17",
    "dot_torture_ez2c_style_17": "ez2c_dot_torture_17",
    "baker_gf_bb_c": "baker_gf_bb_c",
    "baker-gf-bb-c": "baker_gf_bb_c",
    "gf-bb-c": "baker_gf_bb_c",
    "baker_gf_battleship": "baker_gf_battleship",
    "baker-gf-battleship": "baker_gf_battleship",
    "gf-battleship": "baker_gf_battleship",
    "gunfun_22740_vital_dude": "gunfun_22740_vital_dude",
    "gunfun-22740-vital-dude": "gunfun_22740_vital_dude",
    "gunfun_22740": "gunfun_22740_vital_dude",
    "gunfun-22740": "gunfun_22740_vital_dude",
}


class SessionAuthorityError(Exception):
    def __init__(self, status: str, reason: str, http_status: int = 400, **details: Any):
        super().__init__(reason)
        self.http_status = http_status
        self.payload = {"ok": False, "status": status, "reason": reason, **details}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def clean_text(value: Any) -> str:
    return str(value or "").strip()


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def digest(value: Any) -> str:
    raw = value if isinstance(value, str) else canonical_json(value)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _profile_from_execution_contract(contract: Mapping[str, Any]) -> Dict[str, Any]:
    target = contract["targetProfile"]
    session = contract.get("session") or {}
    contract_identity = {
        "contractId": contract["contractId"],
        "contractVersion": contract["contractVersion"],
        "contractFingerprint": contract["contractFingerprint"],
    }
    return {
        "targetId": target["id"],
        "targetAuthorityId": target["authorityId"],
        "targetName": target["product"]["name"],
        "targetProfileVersion": target["version"],
        "atpId": target["atpId"],
        "missionIdentity": {
            "missionFamily": contract["missionFamily"],
            "missionId": contract["components"]["mission"]["id"],
            "resultPackageType": contract["resultPackageType"],
            "resultPackageVersion": contract["resultPackageVersion"],
            "executionContract": contract_identity,
        },
        "executionContract": contract_identity,
        "executionCapabilityStates": deepcopy(session.get("capabilityStates") or {}),
        "governedDistance": deepcopy(session.get("governedDistance") or {"value": None, "unit": None, "locked": False}),
        "equipmentRequirements": deepcopy(session.get("equipmentRequirements") or {"weaponCategories": [], "requiresAdjustmentSystem": False, "allowedAdjustmentUnits": []}),
        "standardSetupAuthority": deepcopy(session.get("standardSetupAuthority") or {"setupId": f"{contract['contractId']}-optional-equipment", "authorityId": contract["contractId"], "kind": "target_optional_equipment"}),
        "officialMissionRequired": bool(session.get("officialMissionRequired", False)),
        "publisherIdentity": deepcopy(target["publisher"]),
        "productIdentity": deepcopy(target["product"]),
    }


def resolve_target_authority(
    target_id: Any,
    *,
    execution_contract_resolver: Optional[TargetExecutionContractResolver] = None,
    mission_family: Any = None,
) -> Dict[str, Any]:
    requested = clean_text(target_id).lower()
    canonical = TARGET_ID_ALIASES.get(requested, requested)
    profile = TARGET_AUTHORITY_PROFILES.get(canonical)
    if profile:
        return deepcopy(profile)
    resolver = execution_contract_resolver or runtime_resolver()
    try:
        return _profile_from_execution_contract(resolver.resolve(canonical, mission_family))
    except TargetExecutionContractError as exc:
        if exc.payload.get("reason") == "execution_contract_unavailable":
            raise SessionAuthorityError("target_unavailable", "target_id_not_registered", 404) from exc
        raise SessionAuthorityError(exc.payload.get("status", "authority_unavailable"), exc.payload["reason"], 409) from exc


def _candidate_id(candidate: Mapping[str, Any], index: int) -> str:
    return clean_text(candidate.get("candidateId") or candidate.get("setupId")) or f"candidate-{index}"


def _resolve_equipment_catalog_record(candidate: Mapping[str, Any]) -> Optional[Dict[str, Any]]:
    record_id = clean_text(candidate.get("equipmentCatalogAuthorityRecordId"))
    if not record_id:
        return None
    record = EQUIPMENT_KNOWLEDGE_BY_RECORD_ID.get(record_id)
    if not record:
        raise SessionAuthorityError("authority_unavailable", "equipment_catalog_authority_record_not_registered", 409)
    expected = {
        "equipmentConfigurationId": clean_text(record.get("configurationId")),
        "equipmentEntityType": clean_text(record.get("entityType")),
        "weaponCatalogManufacturer": clean_text(record.get("manufacturer")),
        "weaponCatalogModel": clean_text(record.get("model")),
        "weaponCatalogCaliber": clean_text(record.get("caliber")),
    }
    for field, authoritative_value in expected.items():
        claimed = clean_text(candidate.get(field))
        if claimed and claimed.casefold() != authoritative_value.casefold():
            raise SessionAuthorityError("authority_conflict", f"equipment_catalog_{field}_mismatch", 409)
    return record


def normalize_equipment(candidate: Any, index: int = 1, *, allow_backend_standard: bool = False) -> Dict[str, Any]:
    if not isinstance(candidate, Mapping):
        raise SessionAuthorityError("invalid_request", "equipment_candidate_must_be_an_object")
    catalog_record = _resolve_equipment_catalog_record(candidate)
    adjustment_unit = clean_text(candidate.get("adjustmentUnit") or candidate.get("opticAdjustmentUnit")).upper()
    click_value_raw = candidate.get("clickValue") or candidate.get("opticClickValue")
    try:
        click_value = float(click_value_raw) if click_value_raw not in (None, "") else None
    except (TypeError, ValueError):
        click_value = None
    requested_source = clean_text(candidate.get("source"))
    source = requested_source if allow_backend_standard and requested_source == "backend_standard_setup" else (
        "weapon_library" if candidate.get("setupId") else "one_time_setup"
    )
    normalized = {
        "candidateId": _candidate_id(candidate, index),
        "equipmentProfileSchemaVersion": clean_text(candidate.get("equipmentProfileSchemaVersion")),
        "equipmentCatalogVersion": clean_text(candidate.get("equipmentCatalogVersion")),
        "equipmentIdentityStatus": "publisher_catalog_match" if catalog_record else clean_text(candidate.get("equipmentIdentityStatus")),
        "equipmentIdentitySource": "equipment_knowledge_registry" if catalog_record else clean_text(candidate.get("equipmentIdentitySource")),
        "equipmentProfileCreatedAt": clean_text(candidate.get("equipmentProfileCreatedAt")),
        "equipmentProfileUpdatedAt": clean_text(candidate.get("equipmentProfileUpdatedAt")),
        "weaponCategory": clean_text(candidate.get("weaponCategory")),
        "manufacturer": clean_text(candidate.get("manufacturer") or candidate.get("weaponManufacturer")),
        "modelType": clean_text(candidate.get("modelType") or candidate.get("weaponModelType")),
        "modelCaliber": clean_text(candidate.get("modelCaliber") or candidate.get("weaponModelCaliber")),
        "catalogManufacturer": clean_text(catalog_record.get("manufacturer")) if catalog_record else clean_text(candidate.get("catalogManufacturer") or candidate.get("weaponCatalogManufacturer")),
        "catalogModel": clean_text(catalog_record.get("model")) if catalog_record else clean_text(candidate.get("catalogModel") or candidate.get("weaponCatalogModel")),
        "catalogCaliber": clean_text(catalog_record.get("caliber")) if catalog_record else clean_text(candidate.get("catalogCaliber") or candidate.get("weaponCatalogCaliber")),
        "frameCategory": clean_text(catalog_record.get("frameCategory")) if catalog_record else clean_text(candidate.get("frameCategory") or candidate.get("weaponFrameCategory")),
        "barrelLength": clean_text(catalog_record.get("barrelLength")) if catalog_record else clean_text(candidate.get("barrelLength")),
        "equipmentCatalogAuthorityRecordId": clean_text(catalog_record.get("recordId")) if catalog_record else "",
        "equipmentConfigurationId": clean_text(catalog_record.get("configurationId")) if catalog_record else clean_text(candidate.get("equipmentConfigurationId")),
        "equipmentEntityType": clean_text(catalog_record.get("entityType")) if catalog_record else clean_text(candidate.get("equipmentEntityType")),
        "equipmentKnowledgeSchemaId": EQUIPMENT_KNOWLEDGE_REGISTRY["schemaId"] if catalog_record else clean_text(candidate.get("equipmentKnowledgeSchemaId")),
        "equipmentKnowledgeRegistryVersion": EQUIPMENT_KNOWLEDGE_REGISTRY["registryVersion"] if catalog_record else clean_text(candidate.get("equipmentKnowledgeRegistryVersion")),
        "equipmentKnowledgeFacts": deepcopy(catalog_record.get("facts") or []) if catalog_record else [],
        "equipmentKnowledgeRelationships": deepcopy(catalog_record.get("relationships") or []) if catalog_record else [],
        "opticType": clean_text(candidate.get("opticType")),
        "opticBrand": clean_text(candidate.get("opticBrand")),
        "opticModel": clean_text(candidate.get("opticModel")),
        "adjustmentProfileId": clean_text(candidate.get("adjustmentProfileId")),
        "adjustmentSystem": clean_text(candidate.get("adjustmentSystem")),
        "magnification": clean_text(candidate.get("magnification")),
        "adjustmentUnit": adjustment_unit,
        "clickValue": click_value,
        "ammoCaliber": clean_text(candidate.get("ammoCaliber")),
        "ammoManufacturer": clean_text(candidate.get("ammoManufacturer")),
        "ammoLoad": clean_text(candidate.get("ammoLoad")),
        "bulletWeight": clean_text(candidate.get("bulletWeight")),
        "source": source,
    }
    adjustment_profile_id = normalized["adjustmentProfileId"]
    if adjustment_profile_id:
        adjustment_profile = get_adjustment_profile(adjustment_profile_id)
        if not adjustment_profile or str(adjustment_profile.get("status") or "").lower() != "proven":
            raise SessionAuthorityError("authority_unavailable", "equipment_adjustment_profile_not_registered", 409)
        expected_configuration = str(adjustment_profile.get("equipmentConfigurationId") or "")
        if normalized["equipmentConfigurationId"] != expected_configuration:
            raise SessionAuthorityError("authority_conflict", "equipment_adjustment_profile_configuration_mismatch", 409)
        claimed_system = normalized["adjustmentSystem"]
        governed_system = str(adjustment_profile.get("adjustmentSystem") or "")
        if claimed_system and claimed_system != governed_system:
            raise SessionAuthorityError("authority_conflict", "equipment_adjustment_profile_system_mismatch", 409)
        model = authority_model_from_adjustment_profile(adjustment_profile)
        normalized.update({
            "adjustmentSystem": governed_system,
            "adjustmentUnit": model["unit"],
            "axisAdjustment": {
                "windagePerClick": model["windagePerClick"],
                "elevationPerClick": model["elevationPerClick"],
                "unit": model["unit"],
            },
            "mechanicalAuthority": {
                "status": "proven",
                "source": model["authoritySource"],
                "turnDirections": model["turnDirections"],
            },
        })
    if allow_backend_standard and source == "backend_standard_setup":
        normalized.update({
            "setupAuthority": "backend-target-authority",
            "setupAuthorityId": clean_text(candidate.get("setupAuthorityId")),
            "adjustmentSystem": clean_text(candidate.get("adjustmentSystem")),
            "adjustmentProfileId": clean_text(candidate.get("adjustmentProfileId")),
            "equipmentAuthorityRecordId": clean_text(candidate.get("equipmentAuthorityRecordId")),
            "axisAdjustment": deepcopy(candidate.get("axisAdjustment") or {}),
            "mechanicalAuthority": deepcopy(candidate.get("mechanicalAuthority") or normalized.get("mechanicalAuthority") or {}),
            "displayFields": deepcopy(candidate.get("displayFields") or []),
        })
    normalized["equipmentFingerprint"] = digest(normalized)
    return normalized


def standard_setup_for(profile: Mapping[str, Any]) -> Dict[str, Any]:
    authority = profile["standardSetupAuthority"]
    kind = authority["kind"]
    distance = profile["governedDistance"]
    display_fields = []
    if distance.get("value") is not None:
        unit_label = "meters" if distance.get("unit") == "M" else "yards"
        display_fields.append({"label": "Distance", "value": f"{distance['value']} {unit_label}"})

    if kind == "registered_adjustment_profile":
        adjustment_profile = get_adjustment_profile(authority["authorityId"])
        if not adjustment_profile or str(adjustment_profile.get("status") or "").lower() != "proven":
            raise SessionAuthorityError("authority_unavailable", "registered_adjustment_profile_unavailable", 503)
        if str(adjustment_profile.get("equipmentConfigurationId") or "") != str(authority.get("equipmentConfigurationId") or ""):
            raise SessionAuthorityError("authority_unavailable", "registered_adjustment_profile_configuration_mismatch", 503)
        model = authority_model_from_adjustment_profile(adjustment_profile)
        display_fields.extend([
            {"label": "Firearm", "value": "M16A2 Rifle"},
            {"label": "Sighting configuration", "value": model["label"]},
            {"label": "Windage", "value": f"{model['windagePerClick']} {model['unit']} per click"},
            {"label": "Elevation", "value": f"{model['elevationPerClick']} {model['unit']} per click"},
        ])
        candidate = {
            "candidateId": authority["setupId"],
            "weaponCategory": "Rifle",
            "manufacturer": "Military M-Series Rifles",
            "modelType": "M16A2 Rifle",
            "modelCaliber": "5.56 NATO",
            "opticType": "Iron Sights",
            "adjustmentUnit": model["unit"],
            "clickValue": None,
            "adjustmentSystem": model["system"],
            "adjustmentProfileId": model["adjustmentProfileId"],
            "equipmentConfigurationId": model["equipmentConfigurationId"],
            "axisAdjustment": {
                "windagePerClick": model["windagePerClick"],
                "elevationPerClick": model["elevationPerClick"],
                "unit": model["unit"],
            },
        }
    elif kind == "registered_m4_iron_sight":
        record = resolve_proven_equipment_record(authority["authorityId"], "M4_IRON_DCH_FSP")
        if not record:
            raise SessionAuthorityError("authority_unavailable", "m4_standard_setup_authority_unavailable", 503)
        model = authority_model_from_record(record)
        display_fields.extend([
            {"label": "Firearm", "value": "M4/M4A1 Carbine"},
            {"label": "Sighting configuration", "value": model["label"]},
            {"label": "Windage", "value": f"{model['windagePerClick']} {model['unit']} per click"},
            {"label": "Elevation", "value": f"{model['elevationPerClick']} {model['unit']} per click"},
        ])
        candidate = {
            "candidateId": authority["setupId"],
            "weaponCategory": "Rifle",
            "manufacturer": "Colt / FN",
            "modelType": "M4/M4A1 Carbine",
            "modelCaliber": "5.56 NATO",
            "opticType": "Iron Sights",
            "adjustmentUnit": model["unit"],
            "clickValue": None,
            "adjustmentSystem": model["system"],
            "equipmentAuthorityRecordId": model["equipmentAuthorityRecordId"],
            "axisAdjustment": {
                "windagePerClick": model["windagePerClick"],
                "elevationPerClick": model["elevationPerClick"],
                "unit": model["unit"],
            },
        }
    elif kind == "target_standard_scope":
        display_fields.extend([
            {"label": "Firearm", "value": "Rifle"},
            {"label": "Sighting configuration", "value": "Scope / optic"},
            {"label": "Adjustment", "value": f"{authority['clickValue']} {authority['adjustmentUnit']} per click"},
        ])
        candidate = {
            "candidateId": authority["setupId"],
            "weaponCategory": "Rifle",
            "manufacturer": "Standard Setup",
            "modelType": "Rifle",
            "modelCaliber": "Shooter ammunition",
            "opticType": "Scope",
            "adjustmentUnit": authority["adjustmentUnit"],
            "clickValue": authority["clickValue"],
        }
    elif kind == "target_standard_pistol":
        display_fields.extend([
            {"label": "Firearm", "value": "Pistol"},
            {"label": "Sighting configuration", "value": "Pistol sights"},
        ])
        candidate = {
            "candidateId": authority["setupId"],
            "weaponCategory": "Pistol",
            "manufacturer": "Standard Setup",
            "modelType": "Pistol",
            "modelCaliber": "Shooter ammunition",
            "opticType": "Pistol sights",
            "adjustmentUnit": "",
            "clickValue": None,
        }
    elif kind == "target_optional_equipment":
        candidate = {
            "candidateId": authority["setupId"],
            "weaponCategory": "",
            "manufacturer": "",
            "modelType": "",
            "modelCaliber": "",
            "opticType": "",
            "adjustmentUnit": "",
            "clickValue": None,
        }
    else:
        raise SessionAuthorityError("authority_unavailable", "standard_setup_authority_unavailable", 503)

    candidate.update({
        "source": "backend_standard_setup",
        "setupAuthority": "backend-target-authority",
        "setupAuthorityId": authority["authorityId"],
        "displayFields": display_fields,
    })
    normalized = normalize_equipment(candidate, allow_backend_standard=True)
    assessment = assess_equipment(profile, normalized)
    correction = assessment["capabilities"]["correction"]
    official_score = assessment["capabilities"]["officialScore"]
    if (
        assessment["capabilities"]["evidence"]["status"] != "available"
        or (
            profile["missionIdentity"]["missionFamily"] == "zeroingCorrection"
            and correction["status"] != "available"
        )
        or (
            profile["missionIdentity"]["missionFamily"] == "gssf"
            and official_score["status"] != "available"
        )
    ):
        raise SessionAuthorityError(
            "authority_unavailable", "standard_setup_incompatible_with_target_authority", 503,
            equipmentAssessment=assessment,
        )
    return normalized


def target_admission(profile: Mapping[str, Any]) -> Dict[str, Any]:
    return {
        "status": "admitted",
        "targetId": profile["targetId"],
        "reason": "registered_active_smart_target",
    }


def official_mission_eligibility(profile: Mapping[str, Any], candidate: Mapping[str, Any]) -> Dict[str, Any]:
    target_id = profile["targetId"]
    category = clean_text(candidate.get("weaponCategory"))
    equipment_authority_id = clean_text(candidate.get("equipmentAuthorityRecordId"))

    if profile.get("officialMissionRequired") is False:
        return {
            "status": "not_applicable",
            "missionId": profile["missionIdentity"]["missionId"],
            "reasons": ["product_supports_practice_evidence_without_official_mission_claim"],
            "restrictionIds": [],
        }

    if target_id == "m4_25m_zero":
        if equipment_authority_id == M4_STANDARD_EQUIPMENT_AUTHORITY_ID:
            return {
                "status": "eligible",
                "missionId": profile["missionIdentity"]["missionId"],
                "reasons": ["registered_m4_equipment_authority_satisfied"],
                "restrictionIds": [],
            }
        return {
            "status": "authority_unavailable",
            "missionId": profile["missionIdentity"]["missionId"],
            "reasons": ["official_m4_equipment_eligibility_not_registered_for_selected_equipment"],
            "restrictionIds": [],
        }

    if target_id == "gssf_ac_1":
        if category == "Pistol":
            return {
                "status": "eligible",
                "missionId": profile["missionIdentity"]["missionId"],
                "reasons": ["registered_gssf_pistol_mission_profile_satisfied"],
                "restrictionIds": [],
            }
        return {
            "status": "authority_unavailable",
            "missionId": profile["missionIdentity"]["missionId"],
            "reasons": ["official_gssf_equipment_eligibility_not_registered_for_selected_equipment"],
            "restrictionIds": [],
        }

    return {
        "status": "eligible",
        "missionId": profile["missionIdentity"]["missionId"],
        "reasons": ["no_registered_equipment_restriction"],
        "restrictionIds": [],
    }


def correction_capability(profile: Mapping[str, Any], candidate: Mapping[str, Any], mission: Mapping[str, Any]) -> Dict[str, Any]:
    if profile["missionIdentity"]["missionFamily"] != "zeroingCorrection":
        return {"status": "not_applicable"}

    unit = clean_text(candidate.get("adjustmentUnit")).upper()
    click_value = candidate.get("clickValue")
    axis_adjustment = candidate.get("axisAdjustment") or {}
    has_axis_adjustment = all(
        isinstance(axis_adjustment.get(axis), (int, float)) and axis_adjustment.get(axis) > 0
        for axis in ("windagePerClick", "elevationPerClick")
    )
    if unit not in ("MOA", "MRAD"):
        return {"status": "unavailable", "reason": "adjustment_unit_not_available"}
    if (not isinstance(click_value, (int, float)) or click_value <= 0) and not has_axis_adjustment:
        return {"status": "unavailable", "reason": "positive_click_or_axis_adjustment_not_available"}

    if clean_text(candidate.get("equipmentAuthorityRecordId")):
        provenance = "registered_equipment_authority"
    elif candidate.get("source") == "backend_standard_setup":
        provenance = "backend_standard_setup_authority"
    else:
        provenance = "shooter_confirmed_configuration"
    return {
        "status": "available",
        "scope": "official_mission" if mission["status"] == "eligible" else "equipment_correction_only",
        "provenance": provenance,
        "physicalControlDirectionsAvailable": has_axis_adjustment,
    }


def assess_equipment(profile: Mapping[str, Any], candidate: Mapping[str, Any]) -> Dict[str, Any]:
    mission = official_mission_eligibility(profile, candidate)
    official_score = {"status": "not_applicable"}
    if profile.get("executionContract"):
        registered = profile.get("executionCapabilityStates") or {}
        capabilities = {
            "evidence": deepcopy(registered.get("evidence") or {"status": "available"}),
            "measurement": deepcopy(registered.get("measurement") or {"status": "unavailable", "reason": "measurement_authority_not_registered"}),
            "correction": deepcopy(registered.get("correction") or {"status": "not_applicable"}),
            "officialScore": deepcopy(registered.get("officialScore") or {"status": "not_applicable"}),
        }
        return {
            "candidateId": candidate["candidateId"],
            "equipmentFingerprint": candidate["equipmentFingerprint"],
            "officialMission": mission,
            "capabilities": capabilities,
            "restrictions": [],
            "guidance": [] if mission["status"] != "authority_unavailable" else ["Optional capability authority is unavailable; target admission remains independent."],
        }
    if profile["missionIdentity"]["missionFamily"] == "gssf":
        official_score = (
            {"status": "available", "scope": "official_mission"}
            if mission["status"] == "eligible"
            else {"status": "unavailable", "reason": "official_mission_eligibility_not_established"}
        )
    guidance = []
    if mission["status"] == "authority_unavailable":
        guidance.append("Official mission eligibility is not established for this equipment.")
        guidance.append("Target evidence and supported measurements remain available.")
    return {
        "candidateId": candidate["candidateId"],
        "equipmentFingerprint": candidate["equipmentFingerprint"],
        "officialMission": mission,
        "capabilities": {
            "evidence": {"status": "available"},
            "measurement": {"status": "available"},
            "correction": correction_capability(profile, candidate, mission),
            "officialScore": official_score,
        },
        "restrictions": [],
        "guidance": guidance,
    }


def atp_fingerprint(profile: Mapping[str, Any]) -> str:
    governed = {
        "targetId": profile["targetId"],
        "targetProfileVersion": profile["targetProfileVersion"],
        "atpId": profile["atpId"],
        "zeroingExperience": profile.get("zeroingExperience"),
        "mfamAuthorityBinding": profile.get("mfamAuthorityBinding"),
        "missionIdentity": profile["missionIdentity"],
        "governedDistance": profile["governedDistance"],
        "confirmationAuthority": profile.get("confirmationAuthority"),
        "registrationAuthority": profile.get("registrationAuthority"),
        "equipmentRequirements": profile["equipmentRequirements"],
        "standardSetupAuthority": profile["standardSetupAuthority"],
        "standardSetup": standard_setup_for(profile),
    }
    return digest(governed)


def prepare_session(
    payload: Any,
    store: Any,
    *,
    now: Optional[datetime] = None,
    execution_contract_resolver: Optional[TargetExecutionContractResolver] = None,
) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise SessionAuthorityError("invalid_request", "payload_must_be_an_object")
    target_id = payload.get("targetId") or payload.get("target_id")
    if not clean_text(target_id):
        raise SessionAuthorityError("invalid_request", "target_id_required")
    profile = resolve_target_authority(
        target_id,
        execution_contract_resolver=execution_contract_resolver,
        mission_family=payload.get("missionFamily") or payload.get("mission_family"),
    )
    if profile["missionIdentity"]["missionFamily"] == "secProgressionEvaluation":
        raise SessionAuthorityError("authority_unavailable", "cross_session_progression_route_required", 409)
    candidates_raw = payload.get("equipmentCandidates") or payload.get("equipment_candidates")
    use_standard_setup = candidates_raw is None or candidates_raw == []
    if candidates_raw is not None and not isinstance(candidates_raw, list):
        raise SessionAuthorityError("invalid_request", "equipment_candidates_must_be_an_array")
    standard_setup = standard_setup_for(profile)
    candidates = [standard_setup] if use_standard_setup else [
        normalize_equipment(candidate, index) for index, candidate in enumerate(candidates_raw, start=1)
    ]
    assessments = [assess_equipment(profile, candidate) for candidate in candidates]
    issued_at = now or utc_now()
    expires_at = issued_at + timedelta(seconds=PREPARATION_TTL_SECONDS)
    token = secrets.token_urlsafe(32)
    record = {
        "preparationId": str(uuid.uuid4()),
        "tokenHash": digest(token),
        "targetId": profile["targetId"],
        "targetProfileId": profile["targetId"],
        "targetProfileVersion": profile["targetProfileVersion"],
        "atpId": profile["atpId"],
        "atpFingerprint": atp_fingerprint(profile),
        "zeroingExperience": profile.get("zeroingExperience"),
        "mfamAuthorityBinding": profile.get("mfamAuthorityBinding"),
        "missionIdentity": profile["missionIdentity"],
        "governedDistance": profile["governedDistance"],
        "confirmationAuthority": profile.get("confirmationAuthority"),
        "registrationAuthority": profile.get("registrationAuthority"),
        "equipmentRequirements": profile["equipmentRequirements"],
        "standardSetup": standard_setup,
        "equipmentCandidates": candidates,
        "compatibilityResults": assessments,
        "equipmentAssessments": assessments,
        "createdAt": iso(issued_at),
        "expiresAt": iso(expires_at),
    }
    store.save_preparation(record)
    return {
        "ok": True,
        "status": "prepared",
        "preparationToken": token,
        "expiresAt": record["expiresAt"],
        "target": {
            "targetId": profile["targetId"],
            "targetAuthorityId": profile["targetAuthorityId"],
            "targetName": profile["targetName"],
            "targetProfileVersion": profile["targetProfileVersion"],
            "atpId": profile["atpId"],
        },
        "targetAdmission": target_admission(profile),
        "missionIdentity": profile["missionIdentity"],
        "executionContract": profile.get("executionContract"),
        "zeroingExperience": profile.get("zeroingExperience"),
        "mfamAuthorityBinding": profile.get("mfamAuthorityBinding"),
        "governedDistance": profile["governedDistance"],
        "confirmationAuthority": profile.get("confirmationAuthority"),
        "registrationAuthority": profile.get("registrationAuthority"),
        "equipmentRequirements": profile["equipmentRequirements"],
        "standardSetup": standard_setup,
        "setupMode": "standard" if use_standard_setup else "shooter-selected",
        "equipmentAssessments": assessments,
        "restrictions": [],
    }


def _candidate_for(preparation: Mapping[str, Any], selected: Any) -> Dict[str, Any]:
    selected_normalized = normalize_equipment(selected, allow_backend_standard=True)
    for candidate in preparation["equipmentCandidates"]:
        if (
            candidate["candidateId"] == selected_normalized["candidateId"]
            and candidate["equipmentFingerprint"] == selected_normalized["equipmentFingerprint"]
        ):
            return candidate
    raise SessionAuthorityError("preparation_invalid", "selected_equipment_not_prepared", 409)


def start_session(
    payload: Any,
    store: Any,
    *,
    idempotency_key: Any = None,
    now: Optional[datetime] = None,
    execution_contract_resolver: Optional[TargetExecutionContractResolver] = None,
) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise SessionAuthorityError("invalid_request", "payload_must_be_an_object")
    token = clean_text(payload.get("preparationToken") or payload.get("preparation_token"))
    key = clean_text(idempotency_key or payload.get("idempotencyKey") or payload.get("idempotency_key"))
    selected = payload.get("selectedEquipment") or payload.get("selected_equipment")
    if not token:
        raise SessionAuthorityError("invalid_request", "preparation_token_required")
    if not key:
        raise SessionAuthorityError("invalid_request", "idempotency_key_required")
    if not isinstance(selected, Mapping):
        raise SessionAuthorityError("invalid_request", "selected_equipment_required")

    request_fingerprint = digest({
        "preparationTokenHash": digest(token),
        "selectedEquipment": normalize_equipment(selected, allow_backend_standard=True),
    })
    existing = store.find_session_by_idempotency_key(key)
    if existing:
        if existing["requestFingerprint"] != request_fingerprint:
            raise SessionAuthorityError("idempotency_conflict", "idempotency_key_reused_with_different_request", 409)
        return {**existing["response"], "status": "existing", "idempotentReplay": True}

    preparation = store.get_preparation(digest(token))
    if not preparation:
        raise SessionAuthorityError("preparation_invalid", "preparation_not_found", 409)
    current_time = now or utc_now()
    expires_at = datetime.fromisoformat(preparation["expiresAt"])
    if current_time >= expires_at:
        raise SessionAuthorityError("preparation_expired", "preparation_expired", 409)
    if preparation.get("consumedAt"):
        raise SessionAuthorityError("preparation_invalid", "preparation_already_consumed", 409)

    current_profile = resolve_target_authority(
        preparation["targetId"],
        execution_contract_resolver=execution_contract_resolver,
        mission_family=preparation["missionIdentity"].get("missionFamily"),
    )
    if (
        current_profile["targetProfileVersion"] != preparation["targetProfileVersion"]
        or atp_fingerprint(current_profile) != preparation["atpFingerprint"]
    ):
        raise SessionAuthorityError("preparation_stale", "atp_changed_reconfirmation_required", 409)

    candidate = _candidate_for(preparation, selected)
    equipment_assessment = assess_equipment(current_profile, candidate)
    session_mode = (
        "official_mission"
        if equipment_assessment["officialMission"]["status"] == "eligible"
        else "target_evidence"
    )

    session_id = f"sczn3-session-{uuid.uuid4()}"
    created_at = iso(current_time)
    response = {
        "ok": True,
        "status": "created",
        "authoritativeSessionId": session_id,
        "createdAt": created_at,
        "sessionLifecycle": "created",
        "sessionMode": session_mode,
        "target": {
            "targetId": current_profile["targetId"],
            "targetAuthorityId": current_profile["targetAuthorityId"],
            "targetName": current_profile["targetName"],
            "targetProfileVersion": current_profile["targetProfileVersion"],
            "atpId": current_profile["atpId"],
        },
        "targetAdmission": target_admission(current_profile),
        "zeroingExperience": current_profile.get("zeroingExperience"),
        "mfamAuthorityBinding": current_profile.get("mfamAuthorityBinding"),
        "missionIdentity": current_profile["missionIdentity"],
        "executionContract": current_profile.get("executionContract"),
        "officialMission": equipment_assessment["officialMission"],
        "capabilities": equipment_assessment["capabilities"],
        "restrictions": equipment_assessment["restrictions"],
        "equipmentAssessment": equipment_assessment,
        "governedDistance": current_profile["governedDistance"],
        "confirmationAuthority": current_profile.get("confirmationAuthority"),
        "registrationAuthority": current_profile.get("registrationAuthority"),
        "selectedEquipment": candidate,
        "setupMode": "standard" if candidate.get("source") == "backend_standard_setup" else "shooter-selected",
    }
    record = {
        "authoritativeSessionId": session_id,
        "preparationId": preparation["preparationId"],
        "idempotencyKey": key,
        "requestFingerprint": request_fingerprint,
        "targetId": current_profile["targetId"],
        "targetProfileVersion": current_profile["targetProfileVersion"],
        "atpId": current_profile["atpId"],
        "zeroingExperience": current_profile.get("zeroingExperience"),
        "mfamAuthorityBinding": current_profile.get("mfamAuthorityBinding"),
        "missionIdentity": current_profile["missionIdentity"],
        "sessionMode": session_mode,
        "officialMission": equipment_assessment["officialMission"],
        "capabilities": equipment_assessment["capabilities"],
        "restrictions": equipment_assessment["restrictions"],
        "equipmentAssessment": equipment_assessment,
        "governedDistance": current_profile["governedDistance"],
        "registrationAuthority": current_profile.get("registrationAuthority"),
        "selectedEquipment": candidate,
        "response": response,
        "createdAt": created_at,
    }
    stored = store.create_session(record, preparation["preparationId"], created_at)
    return stored["response"]


class PostgresSessionStore:
    def __init__(self, database_url: Optional[str] = None, connect_fn: Any = None):
        self.database_url = database_url if database_url is not None else os.environ.get("SCZN3_SESSION_SEC_DATABASE_URL", "")
        self.connect_fn = connect_fn

    def _connect(self):
        if not self.database_url:
            raise SessionAuthorityError("storage_unavailable", "DATABASE_URL_not_configured", 503)
        if self.connect_fn:
            return self.connect_fn(self.database_url)
        import psycopg
        from psycopg.rows import dict_row

        return psycopg.connect(self.database_url, row_factory=dict_row)

    def save_preparation(self, record: Mapping[str, Any]) -> None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    insert into session_preparations (
                      id, token_hash, target_id, target_profile_version, atp_id,
                      atp_fingerprint, mission_identity, governed_distance,
                      equipment_requirements, standard_setup, equipment_candidates,
                      compatibility_results, created_at, expires_at
                    ) values (
                      %(preparationId)s::uuid, %(tokenHash)s, %(targetId)s,
                      %(targetProfileVersion)s, %(atpId)s, %(atpFingerprint)s,
                      %(missionIdentity)s::jsonb, %(governedDistance)s::jsonb,
                      %(equipmentRequirements)s::jsonb, %(standardSetup)s::jsonb, %(equipmentCandidates)s::jsonb,
                      %(compatibilityResults)s::jsonb, %(createdAt)s::timestamptz,
                      %(expiresAt)s::timestamptz
                    )
                    """,
                    {
                        **record,
                        "missionIdentity": canonical_json(record["missionIdentity"]),
                        "governedDistance": canonical_json(record["governedDistance"]),
                        "equipmentRequirements": canonical_json(record["equipmentRequirements"]),
                        "standardSetup": canonical_json(record["standardSetup"]),
                        "equipmentCandidates": canonical_json(record["equipmentCandidates"]),
                        "compatibilityResults": canonical_json(record["compatibilityResults"]),
                    },
                )

    def get_preparation(self, token_hash: str) -> Optional[Dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    select id::text as preparation_id, target_id, target_profile_version,
                           atp_id, atp_fingerprint, mission_identity, governed_distance,
                           equipment_requirements, standard_setup, equipment_candidates,
                           compatibility_results, created_at, expires_at, consumed_at
                      from session_preparations where token_hash = %s
                    """,
                    (token_hash,),
                )
                row = cursor.fetchone()
        if not row:
            return None
        return {
            "preparationId": row["preparation_id"],
            "targetId": row["target_id"],
            "targetProfileVersion": row["target_profile_version"],
            "atpId": row["atp_id"],
            "atpFingerprint": row["atp_fingerprint"],
            "missionIdentity": row["mission_identity"],
            "governedDistance": row["governed_distance"],
            "equipmentRequirements": row["equipment_requirements"],
            "standardSetup": row["standard_setup"],
            "equipmentCandidates": row["equipment_candidates"],
            "compatibilityResults": row["compatibility_results"],
            "equipmentAssessments": row["compatibility_results"],
            "createdAt": iso(row["created_at"]),
            "expiresAt": iso(row["expires_at"]),
            "consumedAt": iso(row["consumed_at"]) if row["consumed_at"] else None,
        }

    def find_session_by_idempotency_key(self, key: str) -> Optional[Dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "select request_fingerprint, response_package from authoritative_sessions where idempotency_key = %s",
                    (key,),
                )
                row = cursor.fetchone()
        return {
            "requestFingerprint": row["request_fingerprint"],
            "response": row["response_package"],
        } if row else None

    def get_authoritative_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "select target_id, mission_identity, response_package from authoritative_sessions where authoritative_session_id = %s",
                    (session_id,),
                )
                row = cursor.fetchone()
        if not row:
            return None
        return {
            "authoritativeSessionId": session_id,
            "targetId": row["target_id"],
            "missionIdentity": row["mission_identity"],
            "response": row["response_package"],
        }

    def create_session(self, record: Mapping[str, Any], preparation_id: str, consumed_at: str) -> Dict[str, Any]:
        try:
            with self._connect() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        insert into authoritative_sessions (
                          authoritative_session_id, preparation_id, idempotency_key,
                          request_fingerprint, target_id, target_profile_version,
                          atp_id, mission_identity, governed_distance,
                          selected_equipment, lifecycle_status, response_package, created_at
                        ) values (
                          %(authoritativeSessionId)s, %(preparationId)s::uuid,
                          %(idempotencyKey)s, %(requestFingerprint)s, %(targetId)s,
                          %(targetProfileVersion)s, %(atpId)s,
                          %(missionIdentity)s::jsonb, %(governedDistance)s::jsonb,
                          %(selectedEquipment)s::jsonb, 'created',
                          %(response)s::jsonb, %(createdAt)s::timestamptz
                        )
                        """,
                        {
                            **record,
                            "missionIdentity": canonical_json(record["missionIdentity"]),
                            "governedDistance": canonical_json(record["governedDistance"]),
                            "selectedEquipment": canonical_json(record["selectedEquipment"]),
                            "response": canonical_json(record["response"]),
                        },
                    )
                    cursor.execute(
                        "update session_preparations set consumed_at = %s::timestamptz where id = %s::uuid and consumed_at is null",
                        (consumed_at, preparation_id),
                    )
                    if cursor.rowcount != 1:
                        raise SessionAuthorityError("preparation_invalid", "preparation_already_consumed", 409)
            return dict(record)
        except SessionAuthorityError:
            raise
        except Exception as exc:
            # A concurrent identical retry may win the unique idempotency race.
            existing = self.find_session_by_idempotency_key(record["idempotencyKey"])
            if existing and existing["requestFingerprint"] == record["requestFingerprint"]:
                return {**record, "response": {**existing["response"], "status": "existing", "idempotentReplay": True}}
            raise SessionAuthorityError("storage_error", "session_persistence_failed", 503) from exc


def runtime_store() -> PostgresSessionStore:
    return PostgresSessionStore()
