"""Governed Target Registry foundation for SCZN3.

The registry preserves target knowledge without granting target authority.
Execution is allowed only when lifecycle, support, geometry authority, and
scoring authority are all explicitly confirmed.
"""
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parent
MANIFEST_DIR = ROOT / "target_knowledge" / "manifests"

LIFECYCLE_STATES = {"research", "draft", "validation", "supported", "retired"}
SUPPORTED_STATUS_VALUES = {"unavailable", "supported", "retired"}
CONFIRMED = "confirmed"
DEFAULT_LIFECYCLE_STATUS = "research"
DEFAULT_SUPPORTED_STATUS = "unavailable"
GOVERNED_UNAVAILABLE_MESSAGE = (
    "Target recognized. Authority is incomplete. This target is not yet supported."
)

GOVERNED_STATUS_KEYS = {
    "lifecycleStatus",
    "supportedStatus",
    "geometryAuthorityStatus",
    "scoringAuthorityStatus",
}

IMPLEMENTED_TARGET_OVERRIDES: Dict[str, Dict[str, Any]] = {
    "baker_st_100yd_smart": {
        "lifecycleStatus": "supported",
        "supportedStatus": "supported",
        "geometryAuthorityStatus": CONFIRMED,
        "scoringAuthorityStatus": CONFIRMED,
        "missionFamilyId": "zeroingCorrection",
        "resultPackageType": "zeroCorrectionResult",
        "registrySupportNotes": "Current Baker zeroing authority bridge is explicitly supported.",
    },
    "gssf_ac_1": {
        "targetId": "gssf_ac_1",
        "targetName": "GSSF AC-1",
        "targetFamily": "GSSF Paper",
        "targetType": "paper-penalty-scoring",
        "manufacturer": "Glock Shooting Sports Foundation",
        "discipline": "pistol competition",
        "lifecycleStatus": "supported",
        "supportedStatus": "supported",
        "geometryAuthorityStatus": CONFIRMED,
        "scoringAuthorityStatus": CONFIRMED,
        "instructionAuthorityStatus": CONFIRMED,
        "missionFamilyId": "gssf",
        "resultPackageType": "gssfPaperPenaltyResult",
        "evidenceModel": "photo-plus-hit-coordinates",
        "registrySupportNotes": "Current GSSF AC-1 backend scoring authority is explicitly supported.",
    },
    "dot_torture_ez2c_style_17": {
        "lifecycleStatus": "supported",
        "supportedStatus": "supported",
        "geometryAuthorityStatus": CONFIRMED,
        "scoringAuthorityStatus": CONFIRMED,
        "missionFamilyId": "marksmanshipTraining",
        "resultPackageType": "marksmanshipTrainingResult",
        "registrySupportNotes": "Current Dot Torture training session package is explicitly supported.",
    },
    "dot_torture_lite_ez2c": {
        "lifecycleStatus": "supported",
        "supportedStatus": "supported",
        "geometryAuthorityStatus": CONFIRMED,
        "scoringAuthorityStatus": CONFIRMED,
        "missionFamilyId": "marksmanshipTraining",
        "resultPackageType": "marksmanshipTrainingResult",
        "registrySupportNotes": "Current Dot Torture Lite training session package is explicitly supported.",
    },
    "revolving_dot_torture_ez2c": {
        "lifecycleStatus": "supported",
        "supportedStatus": "supported",
        "geometryAuthorityStatus": CONFIRMED,
        "scoringAuthorityStatus": CONFIRMED,
        "missionFamilyId": "marksmanshipTraining",
        "resultPackageType": "marksmanshipTrainingResult",
        "registrySupportNotes": "Current Revolving Dot Torture training session package is explicitly supported.",
    },
}

RESEARCH_TARGET_SEEDS: Dict[str, Dict[str, Any]] = {
    "gssf_glock_m": {
        "targetId": "gssf_glock_m",
        "targetName": "GSSF Glock M",
        "targetFamily": "GSSF Paper",
        "targetType": "paper-penalty-scoring",
        "manufacturer": "Glock Shooting Sports Foundation",
        "discipline": "pistol competition",
        "missionFamilyId": "gssf",
        "resultPackageType": "gssfPaperPenaltyResult",
        "authorityGaps": ["geometry authority", "scoring authority", "official target profile"],
    },
    "gssf_five_to_glock": {
        "targetId": "gssf_five_to_glock",
        "targetName": "GSSF Five-To-Glock",
        "targetFamily": "GSSF Paper",
        "targetType": "paper-penalty-scoring",
        "manufacturer": "Glock Shooting Sports Foundation",
        "discipline": "pistol competition",
        "missionFamilyId": "gssf",
        "resultPackageType": "gssfPaperPenaltyResult",
        "authorityGaps": ["geometry authority", "scoring authority", "official target profile"],
    },
    "gssf_plates": {
        "targetId": "gssf_plates",
        "targetName": "GSSF Plates",
        "targetFamily": "GSSF Steel",
        "targetType": "hit-miss-reactive",
        "manufacturer": "Glock Shooting Sports Foundation",
        "discipline": "pistol competition",
        "missionFamilyId": "hitMissReactive",
        "resultPackageType": "hitMissResult",
        "authorityGaps": ["course authority", "target geometry", "timing/scoring authority"],
    },
    "nra_b8": {
        "targetId": "nra_b8",
        "targetName": "NRA B-8",
        "targetFamily": "NRA Bullseye",
        "targetType": "precision-ring-score",
        "manufacturer": "National Rifle Association",
        "discipline": "bullseye pistol",
        "missionFamilyId": "precisionRingScore",
        "resultPackageType": "precisionScoreResult",
        "authorityGaps": ["official ring geometry", "official scoring rules", "target source"],
    },
    "ibs_100yd_rimfire_match": {
        "targetId": "IBS_100YD_RIMFIRE_MATCH",
        "targetName": "IBS 100 Yard Rimfire Match",
        "targetFamily": "IBS Benchrest",
        "targetType": "precision-ring-score",
        "manufacturer": "International Benchrest Shooters",
        "discipline": "benchrest rifle",
        "missionFamilyId": "precisionRingScore",
        "resultPackageType": "precisionScoreResult",
        "authorityGaps": ["official target geometry", "official scoring rules", "match procedure authority"],
    },
    "uspsa_classifier": {
        "targetId": "uspsa_classifier",
        "targetName": "USPSA Classifier",
        "targetFamily": "USPSA",
        "targetType": "practical-stage-score",
        "manufacturer": "United States Practical Shooting Association",
        "discipline": "practical pistol",
        "missionFamilyId": "practicalStageScore",
        "resultPackageType": "stageScoreResult",
        "authorityGaps": ["classifier identity", "course of fire", "hit factor scoring authority"],
    },
}


def normalize_target_id(target_id: Any) -> str:
    return str(target_id or "").strip().lower()


def _load_manifest(path: Path) -> Optional[Dict[str, Any]]:
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def _authority_gaps(manifest: Dict[str, Any]) -> List[str]:
    unknowns = manifest.get("unknowns") if isinstance(manifest.get("unknowns"), list) else []
    gaps: List[str] = []
    for item in unknowns:
        if isinstance(item, dict) and item.get("field"):
            gaps.append(str(item["field"]))
    return gaps


def _entry_from_manifest(manifest: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    identity = manifest.get("targetIdentity")
    if not isinstance(identity, dict) or not identity.get("targetId"):
        return None
    routing = manifest.get("uteRouting") if isinstance(manifest.get("uteRouting"), dict) else {}
    classification = manifest.get("authorityClassification") if isinstance(manifest.get("authorityClassification"), dict) else {}
    entry = {
        "targetId": identity.get("targetId"),
        "targetName": identity.get("targetName"),
        "targetFamily": identity.get("targetFamily"),
        "targetType": identity.get("targetType"),
        "manufacturer": identity.get("manufacturer") or routing.get("manufacturer"),
        "sku": identity.get("sku") or routing.get("sku"),
        "discipline": identity.get("discipline"),
        "missionFamilyId": identity.get("missionFamilyId") or routing.get("missionFamilyId"),
        "missionGroup": identity.get("missionGroup") or routing.get("missionGroup"),
        "missionName": identity.get("missionName") or routing.get("missionName"),
        "missionVariant": identity.get("missionVariant") or routing.get("missionVariant"),
        "targetDisplayName": identity.get("targetDisplayName") or routing.get("targetDisplayName"),
        "resultPackageType": identity.get("resultPackageType") or routing.get("resultPackageType"),
        "secTemplate": identity.get("secTemplate") or routing.get("secTemplate"),
        "evidenceModel": routing.get("evidenceModel"),
        "rulesSource": routing.get("rulesSource"),
        "lifecycleStatus": DEFAULT_LIFECYCLE_STATUS,
        "supportedStatus": DEFAULT_SUPPORTED_STATUS,
        "geometryAuthorityStatus": "unconfirmed",
        "instructionAuthorityStatus": classification.get("instructionAuthorityLevel") or "unconfirmed",
        "scoringAuthorityStatus": "unconfirmed",
        "registryRecognized": True,
        "registrySource": "target_knowledge_manifest",
        "authorityGaps": _authority_gaps(manifest),
    }
    for key in ("stageCount", "totalRounds", "maxScore", "stageDefinitions"):
        if key in routing:
            entry[key] = deepcopy(routing[key])
        elif key in identity:
            entry[key] = deepcopy(identity[key])
    return entry


def _apply_override(entry: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    updated = deepcopy(entry)
    updated.update(deepcopy(override))
    updated["registryRecognized"] = True
    if updated.get("supportedStatus") == "supported":
        updated["authorityStatus"] = "supported"
    else:
        updated["authorityStatus"] = "unavailable"
    return updated


def target_registry_entries() -> Dict[str, Dict[str, Any]]:
    entries: Dict[str, Dict[str, Any]] = {}
    for manifest_path in sorted(MANIFEST_DIR.glob("*.json")):
        manifest = _load_manifest(manifest_path)
        if not manifest:
            continue
        entry = _entry_from_manifest(manifest)
        if not entry:
            continue
        entries[normalize_target_id(entry["targetId"])] = entry

    for key, seed in RESEARCH_TARGET_SEEDS.items():
        entries.setdefault(normalize_target_id(key), {
            **deepcopy(seed),
            "lifecycleStatus": DEFAULT_LIFECYCLE_STATUS,
            "supportedStatus": DEFAULT_SUPPORTED_STATUS,
            "geometryAuthorityStatus": "unconfirmed",
            "instructionAuthorityStatus": "unconfirmed",
            "scoringAuthorityStatus": "unconfirmed",
            "authorityStatus": "unavailable",
            "registryRecognized": True,
            "registrySource": "target_registry_research_seed",
        })

    for key, override in IMPLEMENTED_TARGET_OVERRIDES.items():
        normalized = normalize_target_id(key)
        base = entries.get(normalized, {"targetId": override.get("targetId") or key})
        entries[normalized] = _apply_override(base, override)
    return entries


def get_target_registry_entry(target_id: Any) -> Optional[Dict[str, Any]]:
    entry = target_registry_entries().get(normalize_target_id(target_id))
    return deepcopy(entry) if entry else None


def is_target_execution_authorized(entry: Optional[Dict[str, Any]]) -> bool:
    if not entry:
        return False
    return (
        entry.get("lifecycleStatus") == "supported"
        and entry.get("supportedStatus") == "supported"
        and entry.get("geometryAuthorityStatus") == CONFIRMED
        and entry.get("scoringAuthorityStatus") == CONFIRMED
    )


def registry_profile_for_target(target_id: Any) -> Optional[Dict[str, Any]]:
    entry = get_target_registry_entry(target_id)
    if not entry:
        return None
    profile = deepcopy(entry)
    profile["registryExecutionAuthorized"] = is_target_execution_authorized(entry)
    return profile
