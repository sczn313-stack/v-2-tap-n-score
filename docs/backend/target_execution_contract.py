"""Fail-closed resolver for locked ADR-001 Target Execution Contracts.

The resolver authorizes exact component versions inside Target Authority. It
does not route or implement the independent ``zeroingCorrection`` pipeline.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping, Optional


ROOT = Path(__file__).resolve().parent
DEFAULT_CONTRACT_DIR = ROOT / "target_execution_contracts" / "contracts"
SCHEMA_VERSION = "sczn3-target-execution-contract-v1"
TARGET_AUTHORITY_FAMILIES = {
    "collectionHandEvaluation": "collectionHandResult",
    "cueDrillOrchestration": "cueDrillResult",
    "decisionScenarioEvaluation": "decisionScenarioResult",
    "diagnosticFeedbackEvaluation": "diagnosticFeedbackResult",
    "qualificationCourseEvaluation": "qualificationResult",
    "precisionRingScore": "precisionScoreResult",
    "recreationalChallenge": "challengeResult",
    "secProgressionEvaluation": "secProgressionResult",
    "smartEvidenceCapture": "smartEvidenceResult",
    "targetScoring": "targetScoreResult",
}
EXECUTABLE_REGISTRATION_ROLES = {"scorable_canonical_asset", "evidence_capture_asset"}


class TargetExecutionContractError(Exception):
    def __init__(self, reason: str, status: str = "authority_unavailable", **details: Any):
        super().__init__(reason)
        self.payload = {"ok": False, "status": status, "reason": reason, **details}


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def digest(value: Any) -> str:
    raw = value if isinstance(value, str) else canonical_json(value)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _text(value: Any) -> str:
    return str(value or "").strip()


def _instant(value: Any, field: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(_text(value).replace("Z", "+00:00"))
    except ValueError as exc:
        raise TargetExecutionContractError("contract_datetime_invalid", field=field) from exc
    if parsed.tzinfo is None:
        raise TargetExecutionContractError("contract_datetime_timezone_required", field=field)
    return parsed.astimezone(timezone.utc)


def component_digest(component: Mapping[str, Any]) -> str:
    return digest({
        "id": component.get("id"),
        "version": component.get("version"),
        "status": component.get("status"),
        "definition": component.get("definition"),
    })


def validate_contract(package: Any, *, now: Optional[datetime] = None) -> Dict[str, Any]:
    if not isinstance(package, Mapping):
        raise TargetExecutionContractError("contract_object_required", "configuration_error")
    contract = deepcopy(dict(package))
    required = {
        "schemaVersion", "contractId", "contractVersion", "authorityContractVersion",
        "lifecycleStatus", "supportStatus", "approval", "effective", "targetProfile",
        "components", "missionFamily", "resultPackageType", "resultPackageVersion", "executor", "secAdapter",
        "preservationValidator", "session", "unsupportedUses",
    }
    missing = sorted(field for field in required if field not in contract)
    if missing:
        raise TargetExecutionContractError("contract_fields_required", "configuration_error", fields=missing)
    if contract["schemaVersion"] != SCHEMA_VERSION:
        raise TargetExecutionContractError("contract_schema_version_invalid", "configuration_error")
    for field in ("contractId", "contractVersion", "authorityContractVersion"):
        if not _text(contract.get(field)):
            raise TargetExecutionContractError("contract_identity_invalid", "configuration_error", field=field)
    if contract.get("lifecycleStatus") != "supported" or contract.get("supportStatus") != "supported":
        raise TargetExecutionContractError("contract_not_supported", lifecycleStatus=contract.get("lifecycleStatus"), supportStatus=contract.get("supportStatus"))
    approval = contract.get("approval")
    if not isinstance(approval, Mapping) or approval.get("status") != "approved" or not _text(approval.get("authorityId")):
        raise TargetExecutionContractError("contract_not_approved")
    _instant(approval.get("approvedAt"), "approval.approvedAt")
    effective = contract.get("effective")
    if not isinstance(effective, Mapping):
        raise TargetExecutionContractError("contract_effective_window_required", "configuration_error")
    current = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    starts = _instant(effective.get("from"), "effective.from")
    ends = _instant(effective.get("until"), "effective.until") if effective.get("until") else None
    if current < starts:
        raise TargetExecutionContractError("contract_not_yet_effective")
    if ends and current >= ends:
        raise TargetExecutionContractError("contract_expired")
    target = contract.get("targetProfile")
    if not isinstance(target, Mapping):
        raise TargetExecutionContractError("target_profile_required", "configuration_error")
    for field in ("id", "version", "atpId", "authorityId"):
        if not _text(target.get(field)):
            raise TargetExecutionContractError("target_profile_identity_invalid", "configuration_error", field=field)
    for owner in ("publisher", "product"):
        if not isinstance(target.get(owner), Mapping):
            raise TargetExecutionContractError("product_identity_invalid", "configuration_error", field=owner)
    for field in ("id", "name"):
        if not _text(target["publisher"].get(field)):
            raise TargetExecutionContractError("publisher_identity_invalid", "configuration_error", field=field)
    for field in ("id", "name", "sku"):
        if not _text(target["product"].get(field)):
            raise TargetExecutionContractError("product_identity_invalid", "configuration_error", field=field)
    mission_family = _text(contract.get("missionFamily"))
    if mission_family == "zeroingCorrection":
        raise TargetExecutionContractError("zeroing_authority_isolated")
    expected_result = TARGET_AUTHORITY_FAMILIES.get(mission_family)
    if not expected_result:
        raise TargetExecutionContractError("mission_family_not_registered")
    if contract.get("resultPackageType") != expected_result:
        raise TargetExecutionContractError("result_package_not_authorized_by_mission_family")
    if not _text(contract.get("resultPackageVersion")):
        raise TargetExecutionContractError("result_package_version_required", "configuration_error")
    components = contract.get("components")
    if not isinstance(components, Mapping) or set(components) != {"geometry", "registration", "scoring", "mission"}:
        raise TargetExecutionContractError("exact_component_set_required", "configuration_error")
    for name in ("geometry", "registration", "scoring", "mission"):
        component = components.get(name)
        if not isinstance(component, Mapping):
            raise TargetExecutionContractError("component_required", "configuration_error", component=name)
        if component.get("status") != "approved":
            raise TargetExecutionContractError("component_not_approved", component=name, componentStatus=component.get("status"))
        if not _text(component.get("id")) or not _text(component.get("version")) or not isinstance(component.get("definition"), Mapping):
            raise TargetExecutionContractError("component_identity_invalid", "configuration_error", component=name)
        if component.get("digest") != component_digest(component):
            raise TargetExecutionContractError("component_digest_mismatch", component=name)
    registration_role = _text(components["registration"]["definition"].get("role"))
    if registration_role not in EXECUTABLE_REGISTRATION_ROLES:
        raise TargetExecutionContractError("registration_role_not_executable", role=registration_role)
    registration = components["registration"]["definition"]
    asset_path = _text(registration.get("assetPath"))
    asset_hash = _text(registration.get("assetSha256")).lower()
    coordinate_convention = _text(registration.get("coordinateConvention"))
    if not asset_path or not coordinate_convention or len(asset_hash) != 64 or any(character not in "0123456789abcdef" for character in asset_hash):
        raise TargetExecutionContractError("registration_asset_identity_invalid", "configuration_error")
    normalized_parts = Path(asset_path).parts
    if Path(asset_path).is_absolute() or ".." in normalized_parts:
        raise TargetExecutionContractError("registration_asset_path_invalid", "configuration_error")
    mission = components["mission"]["definition"]
    if mission.get("missionFamily") != mission_family or mission.get("resultPackageType") != expected_result or _text(mission.get("resultPackageVersion")) != contract["resultPackageVersion"]:
        raise TargetExecutionContractError("mission_component_binding_mismatch")
    for owner in ("executor", "secAdapter", "preservationValidator"):
        reference = contract.get(owner)
        if not isinstance(reference, Mapping) or not _text(reference.get("id")) or not _text(reference.get("version")):
            raise TargetExecutionContractError("versioned_owner_invalid", "configuration_error", owner=owner)
    if not isinstance(contract.get("session"), Mapping) or not isinstance(contract.get("unsupportedUses"), list):
        raise TargetExecutionContractError("contract_session_or_unsupported_uses_invalid", "configuration_error")
    contract["contractFingerprint"] = digest(contract)
    return contract


class TargetExecutionContractResolver:
    def __init__(self, contracts: Optional[Iterable[Mapping[str, Any]]] = None, *, contract_dir: Optional[Path] = None):
        packages = list(contracts) if contracts is not None else self._read_contracts(contract_dir or DEFAULT_CONTRACT_DIR)
        validated = [validate_contract(package) for package in packages]
        identities = [(item["contractId"], item["contractVersion"]) for item in validated]
        if len(identities) != len(set(identities)):
            raise TargetExecutionContractError("duplicate_contract_identity", "configuration_error")
        from execution_capability_registry import CapabilityRegistryError, resolve_owner
        for contract in validated:
            try:
                resolve_owner(contract)
            except CapabilityRegistryError as exc:
                raise TargetExecutionContractError(str(exc), "configuration_error", contractId=contract["contractId"]) from exc
        self._contracts = tuple(validated)

    @staticmethod
    def _read_contracts(contract_dir: Path) -> list[Dict[str, Any]]:
        if not contract_dir.exists():
            return []
        packages = []
        for path in sorted(contract_dir.glob("*.json")):
            try:
                packages.append(json.loads(path.read_text(encoding="utf-8")))
            except (OSError, json.JSONDecodeError) as exc:
                raise TargetExecutionContractError("contract_file_invalid", "configuration_error", path=str(path)) from exc
        return packages

    def contracts(self) -> tuple[Dict[str, Any], ...]:
        return tuple(deepcopy(item) for item in self._contracts)

    def catalog(self) -> tuple[Dict[str, Any], ...]:
        """Return only the approved registration data needed by generic clients."""
        entries = []
        for contract in self._contracts:
            target = contract["targetProfile"]
            registration = contract["components"]["registration"]["definition"]
            entries.append({
                "targetProfileId": target["id"],
                "targetProfileVersion": target["version"],
                "publisher": deepcopy(target["publisher"]),
                "product": deepcopy(target["product"]),
                "missionFamily": contract["missionFamily"],
                "resultPackageType": contract["resultPackageType"],
                "resultPackageVersion": contract["resultPackageVersion"],
                "contractId": contract["contractId"],
                "contractVersion": contract["contractVersion"],
                "registration": {
                    "role": registration.get("role"),
                    "assetPath": registration.get("assetPath"),
                    "assetSha256": registration.get("assetSha256"),
                    "assetAlt": registration.get("assetAlt"),
                    "coordinateConvention": registration.get("coordinateConvention"),
                },
            })
        return tuple(entries)

    def capabilities_for_target(self, target_profile_id: Any) -> tuple[Dict[str, Any], ...]:
        target = _text(target_profile_id).lower()
        return tuple(deepcopy(item) for item in self._contracts if item["targetProfile"]["id"].lower() == target)

    def resolve(self, target_profile_id: Any, mission_family: Any = None) -> Dict[str, Any]:
        target = _text(target_profile_id).lower()
        family = _text(mission_family)
        matches = [item for item in self._contracts if item["targetProfile"]["id"].lower() == target]
        if family:
            matches = [item for item in matches if item["missionFamily"] == family]
        if not matches:
            raise TargetExecutionContractError("execution_contract_unavailable", targetProfileId=target_profile_id, missionFamily=family or None)
        if len(matches) != 1:
            raise TargetExecutionContractError("execution_contract_ambiguous", targetProfileId=target_profile_id, missionFamily=family or None)
        return deepcopy(matches[0])

    def resolve_identity(self, identity: Mapping[str, Any]) -> Dict[str, Any]:
        contract_id = _text(identity.get("contractId"))
        version = _text(identity.get("contractVersion"))
        fingerprint = _text(identity.get("contractFingerprint"))
        matches = [item for item in self._contracts if item["contractId"] == contract_id and item["contractVersion"] == version]
        if len(matches) != 1 or matches[0]["contractFingerprint"] != fingerprint:
            raise TargetExecutionContractError("execution_contract_identity_mismatch")
        return deepcopy(matches[0])


@lru_cache(maxsize=1)
def runtime_resolver() -> TargetExecutionContractResolver:
    return TargetExecutionContractResolver()
