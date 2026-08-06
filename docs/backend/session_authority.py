"""Backend-owned session preparation and creation authority.

The browser may propose a Target ID and equipment candidates. This module owns
Target ID -> ATP -> mission resolution, compatibility, durable session identity,
and idempotency. Runtime authority requires Postgres through ``DATABASE_URL``;
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
from typing import Any, Dict, Iterable, Mapping, Optional

from gssf_ac_1_authority import GSSF_AC_1_ATP, GSSF_AC_1_EXECUTION_CONTRACT
from m4_authority.weapon_equipment_registry import (
    authority_model_from_record,
    resolve_proven_equipment_record,
)


PREPARATION_TTL_SECONDS = int(os.environ.get("SCZN3_SESSION_PREPARATION_TTL_SECONDS", "900"))
M4_STANDARD_EQUIPMENT_AUTHORITY_ID = "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28"


TARGET_AUTHORITY_PROFILES: Dict[str, Dict[str, Any]] = {
    "m4_25m_zero": {
        "targetId": "m4_25m_zero",
        "targetAuthorityId": "M4_TARGET_AUTHORITY_v1_ORIGINAL",
        "targetName": "M4/M16 Series Weapons 25M Zero",
        "targetProfileVersion": "M4_TARGET_AUTHORITY_v1_ORIGINAL",
        "atpId": "m4-25m-zero-atp-v1",
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
        "missionIdentity": {
            "missionFamily": "zeroingCorrection",
            "missionId": "BAKER_100YD_ZERO",
            "resultPackageType": "zeroCorrectionResult",
        },
        "governedDistance": {"value": 100, "unit": "YDS", "locked": False},
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
}

TARGET_ID_ALIASES = {
    "m4_target_authority_v1_original": "m4_25m_zero",
    "st-m16a2/m4": "m4_25m_zero",
    "baker_st_100yd_smart": "baker_st_100yd_smart_zero",
    "gssf-ac-1": "gssf_ac_1",
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


def resolve_target_authority(target_id: Any) -> Dict[str, Any]:
    requested = clean_text(target_id).lower()
    canonical = TARGET_ID_ALIASES.get(requested, requested)
    profile = TARGET_AUTHORITY_PROFILES.get(canonical)
    if not profile:
        raise SessionAuthorityError("target_unavailable", "target_id_not_registered", 404)
    return deepcopy(profile)


def _candidate_id(candidate: Mapping[str, Any], index: int) -> str:
    return clean_text(candidate.get("candidateId") or candidate.get("setupId")) or f"candidate-{index}"


def normalize_equipment(candidate: Any, index: int = 1, *, allow_backend_standard: bool = False) -> Dict[str, Any]:
    if not isinstance(candidate, Mapping):
        raise SessionAuthorityError("invalid_request", "equipment_candidate_must_be_an_object")
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
        "weaponCategory": clean_text(candidate.get("weaponCategory")),
        "manufacturer": clean_text(candidate.get("manufacturer") or candidate.get("weaponManufacturer")),
        "modelType": clean_text(candidate.get("modelType") or candidate.get("weaponModelType")),
        "modelCaliber": clean_text(candidate.get("modelCaliber") or candidate.get("weaponModelCaliber")),
        "opticType": clean_text(candidate.get("opticType")),
        "adjustmentUnit": adjustment_unit,
        "clickValue": click_value,
        "source": source,
    }
    if allow_backend_standard and source == "backend_standard_setup":
        normalized.update({
            "setupAuthority": "backend-target-authority",
            "setupAuthorityId": clean_text(candidate.get("setupAuthorityId")),
            "adjustmentSystem": clean_text(candidate.get("adjustmentSystem")),
            "equipmentAuthorityRecordId": clean_text(candidate.get("equipmentAuthorityRecordId")),
            "axisAdjustment": deepcopy(candidate.get("axisAdjustment") or {}),
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

    if kind == "registered_m4_iron_sight":
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
    else:
        raise SessionAuthorityError("authority_unavailable", "standard_setup_authority_unavailable", 503)

    candidate.update({
        "source": "backend_standard_setup",
        "setupAuthority": "backend-target-authority",
        "setupAuthorityId": authority["authorityId"],
        "displayFields": display_fields,
    })
    normalized = normalize_equipment(candidate, allow_backend_standard=True)
    compatibility = evaluate_compatibility(profile, normalized)
    if not compatibility["compatible"]:
        raise SessionAuthorityError(
            "authority_unavailable", "standard_setup_incompatible_with_target_authority", 503,
            compatibility=compatibility,
        )
    return normalized


def evaluate_compatibility(profile: Mapping[str, Any], candidate: Mapping[str, Any]) -> Dict[str, Any]:
    requirements = profile["equipmentRequirements"]
    reasons = []
    category = clean_text(candidate.get("weaponCategory"))
    if category not in requirements["weaponCategories"]:
        reasons.append("weapon_category_incompatible")

    model_families = requirements.get("modelFamilies") or []
    model_type = clean_text(candidate.get("modelType")).lower()
    if model_families and not any(family.lower() in model_type for family in model_families):
        reasons.append("weapon_model_family_incompatible")

    if requirements.get("requiresAdjustmentSystem"):
        unit = clean_text(candidate.get("adjustmentUnit")).upper()
        click_value = candidate.get("clickValue")
        if unit not in requirements.get("allowedAdjustmentUnits", []):
            reasons.append("adjustment_unit_required")
        axis_adjustment = candidate.get("axisAdjustment") or {}
        has_axis_adjustment = all(
            isinstance(axis_adjustment.get(axis), (int, float)) and axis_adjustment.get(axis) > 0
            for axis in ("windagePerClick", "elevationPerClick")
        )
        if (not isinstance(click_value, (int, float)) or click_value <= 0) and not has_axis_adjustment:
            reasons.append("positive_click_value_required")

    return {
        "candidateId": candidate["candidateId"],
        "equipmentFingerprint": candidate["equipmentFingerprint"],
        "compatible": not reasons,
        "reasons": reasons or ["requirements_satisfied"],
    }


def atp_fingerprint(profile: Mapping[str, Any]) -> str:
    governed = {
        "targetId": profile["targetId"],
        "targetProfileVersion": profile["targetProfileVersion"],
        "atpId": profile["atpId"],
        "missionIdentity": profile["missionIdentity"],
        "governedDistance": profile["governedDistance"],
        "equipmentRequirements": profile["equipmentRequirements"],
        "standardSetupAuthority": profile["standardSetupAuthority"],
        "standardSetup": standard_setup_for(profile),
    }
    return digest(governed)


def prepare_session(payload: Any, store: Any, *, now: Optional[datetime] = None) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise SessionAuthorityError("invalid_request", "payload_must_be_an_object")
    target_id = payload.get("targetId") or payload.get("target_id")
    if not clean_text(target_id):
        raise SessionAuthorityError("invalid_request", "target_id_required")
    profile = resolve_target_authority(target_id)
    candidates_raw = payload.get("equipmentCandidates") or payload.get("equipment_candidates")
    use_standard_setup = candidates_raw is None or candidates_raw == []
    if candidates_raw is not None and not isinstance(candidates_raw, list):
        raise SessionAuthorityError("invalid_request", "equipment_candidates_must_be_an_array")
    standard_setup = standard_setup_for(profile)
    candidates = [standard_setup] if use_standard_setup else [
        normalize_equipment(candidate, index) for index, candidate in enumerate(candidates_raw, start=1)
    ]
    results = [evaluate_compatibility(profile, candidate) for candidate in candidates]
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
        "missionIdentity": profile["missionIdentity"],
        "governedDistance": profile["governedDistance"],
        "equipmentRequirements": profile["equipmentRequirements"],
        "standardSetup": standard_setup,
        "equipmentCandidates": candidates,
        "compatibilityResults": results,
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
        "missionIdentity": profile["missionIdentity"],
        "governedDistance": profile["governedDistance"],
        "equipmentRequirements": profile["equipmentRequirements"],
        "standardSetup": standard_setup,
        "setupMode": "standard" if use_standard_setup else "shooter-selected",
        "compatibilityResults": results,
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

    current_profile = resolve_target_authority(preparation["targetId"])
    if (
        current_profile["targetProfileVersion"] != preparation["targetProfileVersion"]
        or atp_fingerprint(current_profile) != preparation["atpFingerprint"]
    ):
        raise SessionAuthorityError("preparation_stale", "atp_changed_reconfirmation_required", 409)

    candidate = _candidate_for(preparation, selected)
    compatibility = evaluate_compatibility(current_profile, candidate)
    if not compatibility["compatible"]:
        raise SessionAuthorityError(
            "equipment_incompatible",
            "selected_equipment_incompatible",
            422,
            compatibility=compatibility,
        )

    session_id = f"sczn3-session-{uuid.uuid4()}"
    created_at = iso(current_time)
    response = {
        "ok": True,
        "status": "created",
        "authoritativeSessionId": session_id,
        "createdAt": created_at,
        "sessionLifecycle": "created",
        "target": {
            "targetId": current_profile["targetId"],
            "targetAuthorityId": current_profile["targetAuthorityId"],
            "targetName": current_profile["targetName"],
            "targetProfileVersion": current_profile["targetProfileVersion"],
            "atpId": current_profile["atpId"],
        },
        "missionIdentity": current_profile["missionIdentity"],
        "governedDistance": current_profile["governedDistance"],
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
        "missionIdentity": current_profile["missionIdentity"],
        "governedDistance": current_profile["governedDistance"],
        "selectedEquipment": candidate,
        "response": response,
        "createdAt": created_at,
    }
    stored = store.create_session(record, preparation["preparationId"], created_at)
    return stored["response"]


class PostgresSessionStore:
    def __init__(self, database_url: Optional[str] = None, connect_fn: Any = None):
        self.database_url = database_url if database_url is not None else os.environ.get("DATABASE_URL", "")
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
