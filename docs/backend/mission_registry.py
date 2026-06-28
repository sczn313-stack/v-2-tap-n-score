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
    "marksmanshipTraining",
    "hitMissReactive",
    "scenarioDecision",
    "anatomyVitalZone",
    "recreationalChallenge",
    "smartEvidenceCapture",
    "gssf",
}

RESULT_PACKAGE_IDS = {
    "zeroCorrectionResult",
    "precisionScoreResult",
    "precisionGroupResult",
    "stageScoreResult",
    "qualificationResult",
    "hitMissResult",
    "trainingProgressionResult",
    "marksmanshipTrainingResult",
    "challengeResult",
    "smartEvidenceResult",
    "gssfPaperPenaltyResult",
}

MISSION_RESULT_PACKAGE_MAP = {
    "zeroingCorrection": "zeroCorrectionResult",
    "precisionRingScore": "precisionScoreResult",
    "precisionGroup": "precisionGroupResult",
    "courseOfFireScore": "stageScoreResult",
    "practicalStageScore": "stageScoreResult",
    "qualification": "qualificationResult",
    "trainingProgression": "trainingProgressionResult",
    "marksmanshipTraining": "marksmanshipTrainingResult",
    "hitMissReactive": "hitMissResult",
    "scenarioDecision": "challengeResult",
    "anatomyVitalZone": "challengeResult",
    "recreationalChallenge": "challengeResult",
    "smartEvidenceCapture": "smartEvidenceResult",
    "gssf": "gssfPaperPenaltyResult",
}

BAKER_TARGET_IDS = {"BAKER_ST_100YD_SMART"}
GSSF_TARGET_IDS = {"gssf_ac_1", "GSSF_AC_1"}
DOT_TORTURE_TARGET_IDS = {"dot_torture_ez2c_style_17", "DOT_TORTURE_EZ2C_STYLE_17"}

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

GSSF_AC_1_TARGET_PROFILE = {
    "targetId": "gssf_ac_1",
    "manufacturer": "Glock Shooting Sports Foundation",
    "sku": "AC-1",
    "missionFamilyId": "gssf",
    "resultPackageType": "gssfPaperPenaltyResult",
    "authorityStatus": "supported",
    "rulesSource": "GSSF AC-1 target scoring authority profile",
    "geometryStatus": "official-diameter-authority",
    "instructionStatus": "published-gssf-paper-target-scoring",
    "scoringStatus": "time-plus-paper-penalty",
    "qualificationStatus": "not_applicable",
    "evidenceModel": "photo-plus-hit-coordinates",
}

DOT_TORTURE_TARGET_PROFILE = {
    "targetId": "dot_torture_ez2c_style_17",
    "manufacturer": "EZ2C Targets",
    "sku": "Style 17",
    "targetName": "EZ2C Style 17 Dot Torture Training Drill",
    "missionFamilyId": "marksmanshipTraining",
    "missionName": "dotTorture",
    "resultPackageType": "marksmanshipTrainingResult",
    "authorityStatus": "supported",
    "rulesSource": "Dot Torture training drill profile: 50 rounds across numbered dots",
    "geometryStatus": "target-size-known-zone-geometry-pending",
    "instructionStatus": "published-training-drill-stage-round-counts",
    "scoringStatus": "inside-numbered-circle-counts",
    "qualificationStatus": "not_applicable",
    "evidenceModel": "photo-plus-hit-coordinates-plus-stage-context",
    "discipline": "pistol",
    "secTemplate": "trainingSEC",
}


def normalize_target_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    supplied = payload.get("targetProfile") if isinstance(payload.get("targetProfile"), dict) else {}
    target_id = str(
        payload.get("targetId")
        or payload.get("target_profile_id")
        or payload.get("targetProfileId")
        or supplied.get("targetId")
        or supplied.get("target_profile_id")
        or supplied.get("targetProfileId")
        or BAKER_TARGET_PROFILE["targetId"]
    )

    if target_id in BAKER_TARGET_IDS:
        profile = deepcopy(BAKER_TARGET_PROFILE)
    elif target_id in GSSF_TARGET_IDS:
        profile = deepcopy(GSSF_AC_1_TARGET_PROFILE)
    elif target_id in DOT_TORTURE_TARGET_IDS:
        profile = deepcopy(DOT_TORTURE_TARGET_PROFILE)
    else:
        mission_family = (
            supplied.get("missionFamilyId")
            or supplied.get("mission_family")
            or payload.get("missionFamilyId")
            or payload.get("mission_family")
        )
        result_package = (
            supplied.get("resultPackageType")
            or supplied.get("result_package_type")
            or payload.get("resultPackageType")
            or payload.get("result_package_type")
        )
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
    if (
        profile.get("targetId") in BAKER_TARGET_IDS
        and profile.get("missionFamilyId") == "zeroingCorrection"
        and profile.get("resultPackageType") == "zeroCorrectionResult"
    ):
        return True
    return (
        profile.get("targetId") in GSSF_TARGET_IDS
        and profile.get("missionFamilyId") == "gssf"
        and profile.get("resultPackageType") == "gssfPaperPenaltyResult"
    ) or (
        profile.get("targetId") in DOT_TORTURE_TARGET_IDS
        and profile.get("missionFamilyId") == "marksmanshipTraining"
        and profile.get("resultPackageType") == "marksmanshipTrainingResult"
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
