"""Mission family and result package registry for SCZN3 UTE.

This module is a routing skeleton only. It names the authority concepts that
future UTE routing will use without activating unsupported scoring engines.
"""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, Optional

MISSION_FAMILY_IDS = {
    "zeroingCorrection",
    "precisionRingScore",
    "precisionGroup",
    "courseOfFireScore",
    "practicalStageScore",
    "qualification",
    "trainingProgression",
    "hitMissReactive",
    "scenarioDecision",
    "anatomyVitalZone",
    "recreationalChallenge",
    "smartEvidenceCapture",
}

RESULT_PACKAGE_IDS = {
    "zeroCorrectionResult",
    "precisionScoreResult",
    "precisionGroupResult",
    "stageScoreResult",
    "qualificationResult",
    "hitMissResult",
    "trainingProgressionResult",
    "challengeResult",
    "smartEvidenceResult",
}

MISSION_RESULT_PACKAGE_MAP = {
    "zeroingCorrection": "zeroCorrectionResult",
    "precisionRingScore": "precisionScoreResult",
    "precisionGroup": "precisionGroupResult",
    "courseOfFireScore": "stageScoreResult",
    "practicalStageScore": "stageScoreResult",
    "qualification": "qualificationResult",
    "trainingProgression": "trainingProgressionResult",
    "hitMissReactive": "hitMissResult",
    "scenarioDecision": "challengeResult",
    "anatomyVitalZone": "challengeResult",
    "recreationalChallenge": "challengeResult",
    "smartEvidenceCapture": "smartEvidenceResult",
}

BAKER_TARGET_IDS = {"BAKER_ST_100YD_SMART"}

BAKER_TARGET_PROFILE = {
    "targetId": "BAKER_ST_100YD_SMART",
    "manufacturer": "Baker Targets",
    "sku": "ST-100YD-SMART",
    "missionFamilyId": "zeroingCorrection",
    "resultPackageType": "zeroCorrectionResult",
    "authorityStatus": "supported",
    "rulesSource": "current-baker-authority-bridge",
    "geometryStatus": "verified-local-measurement",
    "instructionStatus": "printed-target-text-and-local-build",
    "scoringStatus": "authority-v1-distance-from-aim",
    "qualificationStatus": "not_applicable",
    "evidenceModel": "photo-plus-aim-plus-impacts",
}


def normalize_target_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    supplied = payload.get("targetProfile") if isinstance(payload.get("targetProfile"), dict) else {}
    target_id = str(
        payload.get("targetId")
        or supplied.get("targetId")
        or BAKER_TARGET_PROFILE["targetId"]
    )

    if target_id in BAKER_TARGET_IDS:
        profile = deepcopy(BAKER_TARGET_PROFILE)
    else:
        mission_family = supplied.get("missionFamilyId") or payload.get("missionFamilyId")
        result_package = supplied.get("resultPackageType") or payload.get("resultPackageType")
        profile = {
            "targetId": target_id,
            "manufacturer": supplied.get("manufacturer") or payload.get("manufacturer"),
            "sku": supplied.get("sku") or payload.get("sku"),
            "missionFamilyId": mission_family,
            "resultPackageType": result_package,
            "authorityStatus": supplied.get("authorityStatus") or payload.get("authorityStatus") or "unsupported",
            "rulesSource": supplied.get("rulesSource") or payload.get("rulesSource"),
            "geometryStatus": supplied.get("geometryStatus") or payload.get("geometryStatus") or "unknown",
            "instructionStatus": supplied.get("instructionStatus") or payload.get("instructionStatus") or "unknown",
            "scoringStatus": supplied.get("scoringStatus") or payload.get("scoringStatus") or "unknown",
            "qualificationStatus": supplied.get("qualificationStatus") or payload.get("qualificationStatus") or "unknown",
            "evidenceModel": supplied.get("evidenceModel") or payload.get("evidenceModel") or "unknown",
        }

    for key in BAKER_TARGET_PROFILE.keys():
        if supplied.get(key) not in (None, ""):
            profile[key] = supplied[key]
        elif payload.get(key) not in (None, ""):
            profile[key] = payload[key]

    if not profile.get("resultPackageType") and profile.get("missionFamilyId") in MISSION_RESULT_PACKAGE_MAP:
        profile["resultPackageType"] = MISSION_RESULT_PACKAGE_MAP[profile["missionFamilyId"]]
    return profile


def is_supported_profile(profile: Dict[str, Any]) -> bool:
    return (
        profile.get("targetId") in BAKER_TARGET_IDS
        and profile.get("missionFamilyId") == "zeroingCorrection"
        and profile.get("resultPackageType") == "zeroCorrectionResult"
    )


def unavailable_result(
    reason: str,
    profile: Dict[str, Any],
    status: str = "unavailable",
) -> Dict[str, Any]:
    return {
        "ok": False,
        "status": status,
        "reason": reason,
        "targetId": profile.get("targetId"),
        "missionFamilyId": profile.get("missionFamilyId"),
        "resultPackageType": profile.get("resultPackageType"),
        "authorityStatus": profile.get("authorityStatus"),
        "method": "ute-routing-skeleton-v1",
    }


def refusal_for_profile(profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    mission_family = profile.get("missionFamilyId")
    result_package = profile.get("resultPackageType")

    if mission_family not in MISSION_FAMILY_IDS:
        return unavailable_result("mission_family_not_registered", profile)
    if result_package not in RESULT_PACKAGE_IDS:
        return unavailable_result("result_package_not_registered", profile)
    expected_package = MISSION_RESULT_PACKAGE_MAP.get(mission_family)
    if expected_package != result_package:
        return unavailable_result("result_package_not_authorized_by_mission_family", profile)
    if not is_supported_profile(profile):
        return unavailable_result("mission_family_not_implemented", profile)
    return None
