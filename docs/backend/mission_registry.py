"""Mission family and result package registry for SCZN3 UTE.

This module is a routing skeleton only. It names the authority concepts that
future UTE routing will use without activating unsupported scoring engines.
"""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, Optional

from target_registry import (
    GOVERNED_UNAVAILABLE_MESSAGE,
    registry_profile_for_target,
    is_target_execution_authorized,
)

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
DOT_TORTURE_TARGET_IDS = {
    "dot_torture_ez2c_style_17",
    "DOT_TORTURE_EZ2C_STYLE_17",
    "dot_torture_lite_ez2c",
    "DOT_TORTURE_LITE_EZ2C",
    "revolving_dot_torture_ez2c",
    "REVOLVING_DOT_TORTURE_EZ2C",
}

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
    "targetProfileVersion": "1",
    "registrationPackageId": "gssf-ac-1-clean-png-registration-v1",
    "registrationPackageVersion": "1",
    "geometryProfileId": "gssf-ac-1-concentric-geometry-v1",
    "scoringProfileId": "gssf-ac-1-paper-penalty-v1",
    "targetExecutionContractId": "gssf-ac-1-live-canonical-v1",
    "evidenceModel": "registered-canonical-asset-plus-pixel-observations",
}

DOT_TORTURE_STANDARD_STAGES = [
    {
        "stageId": "dot_1",
        "label": "Dot 1",
        "dots": [1],
        "rounds": 5,
        "guidance": "Stage 1: Dot 1 — Draw and fire 5 slow-fire shots.",
    },
    {
        "stageId": "dot_2",
        "label": "Dot 2",
        "dots": [2],
        "rounds": 5,
        "guidance": "Stage 2: Dot 2 — Draw and fire 1 shot, holster, repeat x5.",
    },
    {
        "stageId": "dots_3_4",
        "label": "Dots 3 & 4",
        "dots": [3, 4],
        "rounds": 8,
        "guidance": "Stage 3: Dots 3 & 4 — Draw, fire 1 on Dot 3 and 1 on Dot 4, repeat x4.",
    },
    {
        "stageId": "dot_5",
        "label": "Dot 5",
        "dots": [5],
        "rounds": 5,
        "guidance": "Stage 4: Dot 5 — Draw and fire 5 shots, strong hand only.",
    },
    {
        "stageId": "dots_6_7",
        "label": "Dots 6 & 7",
        "dots": [6, 7],
        "rounds": 16,
        "guidance": "Stage 5: Dots 6 & 7 — Draw and fire 2 on Dot 6 and 2 on Dot 7, repeat x4.",
    },
    {
        "stageId": "dot_8",
        "label": "Dot 8",
        "dots": [8],
        "rounds": 5,
        "guidance": "Stage 6: Dot 8 — From ready/retention, fire 5 shots weak hand only.",
    },
    {
        "stageId": "dots_9_10",
        "label": "Dots 9 & 10",
        "dots": [9, 10],
        "rounds": 6,
        "guidance": "Stage 7: Dots 9 & 10 — Draw, fire 1 on Dot 9, speed reload, fire 1 on Dot 10, repeat x3.",
    },
]

DOT_TORTURE_LITE_STAGES = [
    {
        "stageId": "lite_dot_1",
        "label": "Dot 1",
        "dots": [1],
        "rounds": 5,
        "guidance": "Stage 1: Dot 1 — Fire 5 slow-fire shots.",
    },
    {
        "stageId": "lite_dot_2",
        "label": "Dot 2",
        "dots": [2],
        "rounds": 5,
        "guidance": "Stage 2: Dot 2 — Fire 5 deliberate shots.",
    },
    {
        "stageId": "lite_dots_3_4",
        "label": "Dots 3 & 4",
        "dots": [3, 4],
        "rounds": 10,
        "guidance": "Stage 3: Dots 3 & 4 — Alternate one shot on each dot for 10 total rounds.",
    },
    {
        "stageId": "lite_dot_5",
        "label": "Dot 5",
        "dots": [5],
        "rounds": 5,
        "guidance": "Stage 4: Dot 5 — Fire 5 controlled shots.",
    },
    {
        "stageId": "lite_dot_6",
        "label": "Dot 6",
        "dots": [6],
        "rounds": 5,
        "guidance": "Stage 5: Dot 6 — Fire 5 controlled shots.",
    },
]

REVOLVING_DOT_TORTURE_STAGES = [
    {
        "stageId": "revolver_dot_1",
        "label": "Dot 1",
        "dots": [1],
        "rounds": 5,
        "guidance": "Stage 1: Dot 1 — Fire 5 slow-fire shots.",
    },
    {
        "stageId": "revolver_dot_2",
        "label": "Dot 2",
        "dots": [2],
        "rounds": 5,
        "guidance": "Stage 2: Dot 2 — Fire 5 deliberate shots.",
    },
    {
        "stageId": "revolver_dots_3_4",
        "label": "Dots 3 & 4",
        "dots": [3, 4],
        "rounds": 8,
        "guidance": "Stage 3: Dots 3 & 4 — Fire 1 on Dot 3 and 1 on Dot 4, repeat x4.",
    },
    {
        "stageId": "revolver_dot_5",
        "label": "Dot 5",
        "dots": [5],
        "rounds": 5,
        "guidance": "Stage 4: Dot 5 — Fire 5 shots, strong hand only.",
    },
    {
        "stageId": "revolver_dots_6_7",
        "label": "Dots 6 & 7",
        "dots": [6, 7],
        "rounds": 12,
        "guidance": "Stage 5: Dots 6 & 7 — Fire 3 on Dot 6 and 3 on Dot 7, repeat x2.",
    },
    {
        "stageId": "revolver_dot_8",
        "label": "Dot 8",
        "dots": [8],
        "rounds": 5,
        "guidance": "Stage 6: Dot 8 — Fire 5 shots, support hand only.",
    },
    {
        "stageId": "revolver_dots_9_10",
        "label": "Dots 9 & 10",
        "dots": [9, 10],
        "rounds": 10,
        "guidance": "Stage 7: Dots 9 & 10 — Fire 5 on Dot 9, reload, fire 5 on Dot 10.",
    },
]


def dot_torture_profile(
    *,
    target_id: str,
    sku: str,
    target_name: str,
    display_name: str,
    mission_name: str,
    mission_variant: str,
    stages: list[dict[str, Any]],
) -> Dict[str, Any]:
    total_rounds = sum(int(stage.get("rounds", 0)) for stage in stages)
    return {
        "targetId": target_id,
        "manufacturer": "EZ2C Targets",
        "sku": sku,
        "targetName": target_name,
        "targetDisplayName": display_name,
        "target_display_name": display_name,
        "missionFamilyId": "marksmanshipTraining",
        "mission_family": "marksmanshipTraining",
        "missionGroup": "dotTortureFamily",
        "mission_group": "dotTortureFamily",
        "missionName": mission_name,
        "mission_name": mission_name,
        "missionVariant": mission_variant,
        "mission_variant": mission_variant,
        "resultPackageType": "marksmanshipTrainingResult",
        "authorityStatus": "supported",
        "rulesSource": f"{display_name} training drill profile: backend-owned stage package",
        "geometryStatus": "target-size-known-zone-geometry-pending",
        "instructionStatus": "training-drill-stage-package",
        "scoringStatus": "inside-numbered-circle-counts",
        "qualificationStatus": "not_applicable",
        "evidenceModel": "photo-plus-hit-coordinates-plus-stage-context",
        "discipline": "pistol",
        "recommendedFirearmType": "pistol",
        "recommended_firearm_type": "pistol",
        "secTemplate": "trainingSEC",
        "sec_template": "trainingSEC",
        "targetSize": {"width": 11, "height": 17, "unit": "inches"},
        "target_size": {"width": 11, "height": 17, "unit": "inches"},
        "recommendedDistance": {"value": 3, "unit": "yards"},
        "recommended_distance": {"value": 3, "unit": "yards"},
        "stageCount": len(stages),
        "stage_count": len(stages),
        "totalRounds": total_rounds,
        "total_rounds": total_rounds,
        "maxScore": total_rounds,
        "max_score": total_rounds,
        "scoringRule": "Only shots completely inside each numbered circle count.",
        "scoring_rule": "Only shots completely inside each numbered circle count.",
        "stageDefinitions": deepcopy(stages),
        "stage_definitions": deepcopy(stages),
    }


DOT_TORTURE_TARGET_PROFILES = {
    "dot_torture_ez2c_style_17": dot_torture_profile(
        target_id="dot_torture_ez2c_style_17",
        sku="Style 17",
        target_name="EZ2C Style 17 Dot Torture Training Drill",
        display_name="Dot Torture",
        mission_name="dotTortureStandard",
        mission_variant="standard",
        stages=DOT_TORTURE_STANDARD_STAGES,
    ),
    "dot_torture_lite_ez2c": dot_torture_profile(
        target_id="dot_torture_lite_ez2c",
        sku="Dot Torture Lite",
        target_name="EZ2C Dot Torture Lite Training Drill",
        display_name="Dot Torture Lite",
        mission_name="dotTortureLite",
        mission_variant="lite",
        stages=DOT_TORTURE_LITE_STAGES,
    ),
    "revolving_dot_torture_ez2c": dot_torture_profile(
        target_id="revolving_dot_torture_ez2c",
        sku="Revolving Dot Torture",
        target_name="EZ2C Revolving Dot Torture Training Drill",
        display_name="Revolving Dot Torture",
        mission_name="revolvingDotTorture",
        mission_variant="revolving",
        stages=REVOLVING_DOT_TORTURE_STAGES,
    ),
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

    target_id_key = target_id.lower()

    if target_id in BAKER_TARGET_IDS:
        profile = deepcopy(BAKER_TARGET_PROFILE)
    elif target_id in GSSF_TARGET_IDS:
        profile = deepcopy(GSSF_AC_1_TARGET_PROFILE)
    elif target_id in DOT_TORTURE_TARGET_IDS or target_id_key in DOT_TORTURE_TARGET_PROFILES:
        profile = deepcopy(DOT_TORTURE_TARGET_PROFILES[target_id_key])
    else:
        registry_profile = registry_profile_for_target(target_id)
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
        if registry_profile:
            profile = registry_profile
            profile["missionFamilyId"] = profile.get("missionFamilyId") or mission_family
            profile["resultPackageType"] = profile.get("resultPackageType") or result_package
        else:
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
        (
            profile.get("targetId") in DOT_TORTURE_TARGET_IDS
            or str(profile.get("targetId", "")).lower() in DOT_TORTURE_TARGET_PROFILES
        )
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
        "targetName": profile.get("targetName"),
        "missionFamilyId": profile.get("missionFamilyId"),
        "resultPackageType": profile.get("resultPackageType"),
        "authorityStatus": profile.get("authorityStatus"),
        "lifecycleStatus": profile.get("lifecycleStatus"),
        "supportedStatus": profile.get("supportedStatus"),
        "geometryAuthorityStatus": profile.get("geometryAuthorityStatus"),
        "scoringAuthorityStatus": profile.get("scoringAuthorityStatus"),
        "displayMessage": GOVERNED_UNAVAILABLE_MESSAGE if reason == "target_authority_incomplete" else None,
        "authorityGaps": profile.get("authorityGaps"),
        "method": "ute-routing-skeleton-v1",
    }


def refusal_for_profile(profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    mission_family = profile.get("missionFamilyId")
    result_package = profile.get("resultPackageType")

    if profile.get("registryRecognized") and not is_target_execution_authorized(profile):
        return unavailable_result("target_authority_incomplete", profile)
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
