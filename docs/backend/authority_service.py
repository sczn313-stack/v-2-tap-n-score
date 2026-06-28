"""SCZN3 backend authority service.

Backend calculates. Frontend displays.
"""
from __future__ import annotations

import hashlib
import json
import math
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from mission_registry import normalize_target_profile, refusal_for_profile

DEFAULT_TARGET_ID = "BAKER_ST_100YD_SMART"
DEFAULT_TARGET_GEOMETRY = {
    "targetId": DEFAULT_TARGET_ID,
    "imageWidth": 1102,
    "imageHeight": 1713,
    "gridLeftPx": 68,
    "gridTopPx": 282,
    "gridRightPx": 1047,
    "gridBottomPx": 1652,
    "gridSquarePx": 49,
    "gridSquareInches": 1,
    "unit": "inch",
}
MOA_INCHES_AT_100_YARDS = 1.047
MRAD_INCHES_AT_100_YARDS = 3.6
GSSF_AC_1_PROFILE = {
    "target_profile_id": "gssf_ac_1",
    "mission_family": "gssf",
    "targetWidthInches": 19,
    "targetHeightInches": 30,
    "zoneCenterPercent": {"xPercent": 50, "yPercent": 50},
    "downZeroRadiusInches": 4,
    "plusOneRadiusInches": 6.5,
    "penaltySeconds": {
        "downZero": 0,
        "plusOne": 1,
        "plusThree": 3,
        "miss": 10,
    },
    "authoritySource": "GSSF AC-1 profile: 8-inch Down Zero, 13-inch +1, paper +3, miss +10",
}
DOT_TORTURE_STAGES = [
    {"stageId": "dot_1", "label": "Dot 1", "dots": [1], "rounds": 5},
    {"stageId": "dot_2", "label": "Dot 2", "dots": [2], "rounds": 5},
    {"stageId": "dots_3_4", "label": "Dots 3 & 4", "dots": [3, 4], "rounds": 8},
    {"stageId": "dot_5", "label": "Dot 5", "dots": [5], "rounds": 5},
    {"stageId": "dots_6_7", "label": "Dots 6 & 7", "dots": [6, 7], "rounds": 16},
    {"stageId": "dot_8", "label": "Dot 8", "dots": [8], "rounds": 5},
    {"stageId": "dots_9_10", "label": "Dots 9 & 10", "dots": [9, 10], "rounds": 6},
]
DOT_TORTURE_PROFILE = {
    "target_profile_id": "dot_torture_ez2c_style_17",
    "mission_family": "marksmanshipTraining",
    "mission_name": "dotTorture",
    "target_name": "EZ2C Style 17 Dot Torture Training Drill",
    "target_size": {"width": 11, "height": 17, "unit": "inches"},
    "discipline": "pistol",
    "recommended_distance": {"value": 3, "unit": "yards"},
    "max_score": 50,
    "total_rounds": 50,
    "sec_template": "trainingSEC",
    "scoring_rule": "Only shots completely inside each numbered circle count.",
}


def _num(value: Any, fallback: Optional[float] = None) -> Optional[float]:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if not math.isfinite(number):
        return fallback
    return number


def _round(value: float, places: int = 4) -> float:
    return round(float(value), places)


def normalize_point(point: Any) -> Optional[Dict[str, float]]:
    if not isinstance(point, dict):
        return None
    x = _num(point.get("xPercent"), None)
    y = _num(point.get("yPercent"), None)
    if x is None or y is None:
        return None
    return {
        "xPercent": _round(max(0, min(100, x)), 4),
        "yPercent": _round(max(0, min(100, y)), 4),
    }


def normalize_impacts(impacts: Any) -> List[Dict[str, float]]:
    if not isinstance(impacts, list):
        return []
    return [point for point in (normalize_point(item) for item in impacts) if point]


def target_geometry(payload: Dict[str, Any]) -> Dict[str, Any]:
    supplied = payload.get("targetAuthorityGeometry") or payload.get("targetGeometry") or {}
    geometry = deepcopy(DEFAULT_TARGET_GEOMETRY)
    if isinstance(supplied, dict):
        geometry.update({key: value for key, value in supplied.items() if value is not None})
    geometry["targetId"] = payload.get("targetId") or geometry.get("targetId") or DEFAULT_TARGET_ID
    return geometry


def distance_yards(payload: Dict[str, Any]) -> float:
    distance = payload.get("distance", {})
    if isinstance(distance, dict):
        value = _num(distance.get("value"), 100) or 100
        unit = str(distance.get("unit", "yds")).lower()
    else:
        value = _num(distance, 100) or 100
        unit = "yds"
    if unit in {"m", "meter", "meters"}:
        return max(1, value * 1.0936133)
    return max(1, value)


def _first_present(*values: Any) -> Any:
    for value in values:
        if value is not None and value != "":
            return value
    return None


def optic_adjustment(payload: Dict[str, Any]) -> Dict[str, Any]:
    setup = payload.get("shooterSetup") if isinstance(payload.get("shooterSetup"), dict) else {}
    optic = setup.get("optic") if isinstance(setup.get("optic"), dict) else {}
    unit = str(_first_present(
        optic.get("adjustmentUnit"),
        setup.get("opticAdjustmentUnit"),
    ) or "").upper()
    if unit not in {"MOA", "MRAD"}:
        raise ValueError("invalid or missing optic adjustment unit")

    if unit == "MOA":
        raw_value = _first_present(
            optic.get("clickValueMOA"),
            setup.get("opticClickValueMOA"),
            setup.get("clickValueMOA"),
            optic.get("clickValue"),
            setup.get("opticClickValue"),
            setup.get("clickValue"),
        )
    else:
        raw_value = _first_present(
            optic.get("clickValueMRAD"),
            setup.get("opticClickValueMRAD"),
            optic.get("clickValue"),
            setup.get("opticClickValue"),
        )

    value = _num(raw_value, None)
    if value is None or value <= 0:
        raise ValueError("invalid or missing optic click value")

    return {
        "unit": unit,
        "clickValue": _round(value, 4),
        "clickValueMOA": _round(value, 4) if unit == "MOA" else None,
        "clickValueMRAD": _round(value, 4) if unit == "MRAD" else None,
        "clickValueLabel": str(_first_present(optic.get("clickValueLabel"), setup.get("opticClickValueLabel"), f"{value} {unit}")),
    }


def image_percent_to_pixels(point: Dict[str, float], geometry: Dict[str, Any]) -> Dict[str, float]:
    return {
        "xPx": (point["xPercent"] / 100) * float(geometry["imageWidth"]),
        "yPx": (point["yPercent"] / 100) * float(geometry["imageHeight"]),
    }


def image_percent_to_grid_inches(point: Dict[str, float], geometry: Dict[str, Any]) -> Dict[str, float]:
    px = image_percent_to_pixels(point, geometry)
    square_px = float(geometry["gridSquarePx"])
    square_inches = float(geometry.get("gridSquareInches", 1))
    return {
        "xInches": _round(((px["xPx"] - float(geometry["gridLeftPx"])) / square_px) * square_inches, 4),
        "yInches": _round(((px["yPx"] - float(geometry["gridTopPx"])) / square_px) * square_inches, 4),
    }


def grid_inches_to_image_percent(grid_point: Dict[str, float], geometry: Dict[str, Any]) -> Dict[str, float]:
    square_px = float(geometry["gridSquarePx"])
    square_inches = float(geometry.get("gridSquareInches", 1))
    x_px = float(geometry["gridLeftPx"]) + ((grid_point["xInches"] / square_inches) * square_px)
    y_px = float(geometry["gridTopPx"]) + ((grid_point["yInches"] / square_inches) * square_px)
    return {
        "xPercent": _round((x_px / float(geometry["imageWidth"])) * 100, 4),
        "yPercent": _round((y_px / float(geometry["imageHeight"])) * 100, 4),
    }


def image_point_through_grid(point: Dict[str, float], geometry: Dict[str, Any]) -> Dict[str, float]:
    return grid_inches_to_image_percent(image_percent_to_grid_inches(point, geometry), geometry)


def average_point(points: List[Dict[str, float]]) -> Optional[Dict[str, float]]:
    if not points:
        return None
    return {
        "xPercent": _round(sum(point["xPercent"] for point in points) / len(points), 4),
        "yPercent": _round(sum(point["yPercent"] for point in points) / len(points), 4),
    }


def moa_for_inches(inches: float, yards: float) -> float:
    return abs(inches) / ((yards / 100) * MOA_INCHES_AT_100_YARDS)


def mrad_for_inches(inches: float, yards: float) -> float:
    return abs(inches) / ((yards / 100) * MRAD_INCHES_AT_100_YARDS)


def clicks_for_inches(inches: float, yards: float, adjustment: Dict[str, Any]) -> int:
    if adjustment["unit"] == "MRAD":
        angular_value = mrad_for_inches(inches, yards)
        click_value = adjustment["clickValueMRAD"]
    else:
        angular_value = moa_for_inches(inches, yards)
        click_value = adjustment["clickValueMOA"]
    return int(round(angular_value / click_value))


def clicks_for_angular_value(angular_value: float, adjustment_unit: str, click_value: float) -> int:
    unit = str(adjustment_unit or "").upper()
    if unit not in {"MOA", "MRAD"}:
        raise ValueError("invalid or missing optic adjustment unit")
    if click_value <= 0:
        raise ValueError("invalid or missing optic click value")
    return int(round(abs(angular_value) / click_value))


def angular_for_inches(inches: float, yards: float, adjustment: Dict[str, Any]) -> float:
    if adjustment["unit"] == "MRAD":
        return mrad_for_inches(inches, yards)
    moa = abs(inches) / ((yards / 100) * MOA_INCHES_AT_100_YARDS)
    return moa


def direction_labels(x_inches: float, y_inches: float) -> Dict[str, str]:
    return {
        "windage": "LEFT" if x_inches > 0 else "RIGHT" if x_inches < 0 else "CENTER",
        "elevation": "UP" if y_inches > 0 else "DOWN" if y_inches < 0 else "CENTER",
    }


def shot_quality_points(distance_inches: float) -> int:
    if distance_inches <= 1:
        return 10
    if distance_inches <= 2:
        return 8
    if distance_inches <= 4:
        return 6
    if distance_inches <= 6:
        return 4
    if distance_inches <= 8:
        return 2
    return 0


def calculate_score(aim: Optional[Dict[str, float]], impacts: List[Dict[str, float]], geometry: Dict[str, Any]) -> Dict[str, Any]:
    score = {
        "value": None,
        "method": "authority-v1",
        "status": "unavailable",
        "rawScore": 0,
        "possibleScore": 0,
        "maxShotValue": 10,
        "perShot": [],
    }
    if not aim:
        score["reason"] = "missing aim coordinate"
        return score
    if not impacts:
        score["reason"] = "missing impact coordinates"
        return score

    aim_grid = image_percent_to_grid_inches(aim, geometry)
    per_shot = []
    for index, impact in enumerate(impacts, start=1):
        impact_grid = image_percent_to_grid_inches(impact, geometry)
        x_inches = _round(impact_grid["xInches"] - aim_grid["xInches"], 4)
        y_inches = _round(impact_grid["yInches"] - aim_grid["yInches"], 4)
        distance_inches = _round(math.sqrt((x_inches * x_inches) + (y_inches * y_inches)), 4)
        points = shot_quality_points(distance_inches)
        per_shot.append({
            "shot": index,
            "xInches": x_inches,
            "yInches": y_inches,
            "distanceInches": distance_inches,
            "points": points,
        })

    raw_score = sum(shot["points"] for shot in per_shot)
    possible_score = len(impacts) * score["maxShotValue"]
    score.update({
        "value": int(round((raw_score / possible_score) * 100)) if possible_score else None,
        "status": "calculated",
        "rawScore": raw_score,
        "possibleScore": possible_score,
        "perShot": per_shot,
    })
    return score


def calculate_group(impacts: List[Dict[str, float]], geometry: Dict[str, Any], yards: float) -> Dict[str, Any]:
    group = {
        "valueMOA": None,
        "diameterInches": None,
        "method": "authority-v1-max-spread",
        "status": "unavailable",
    }
    if len(impacts) < 2:
        group["reason"] = "requires at least two impacts"
        return group

    grid_points = [image_percent_to_grid_inches(impact, geometry) for impact in impacts]
    max_distance = 0.0
    for index, first in enumerate(grid_points):
        for second in grid_points[index + 1:]:
            x_delta = second["xInches"] - first["xInches"]
            y_delta = second["yInches"] - first["yInches"]
            max_distance = max(max_distance, math.sqrt((x_delta * x_delta) + (y_delta * y_delta)))

    diameter_inches = _round(max_distance, 4)
    value_moa = _round(moa_for_inches(diameter_inches, yards), 2)
    group.update({
        "valueMOA": value_moa,
        "diameterInches": diameter_inches,
        "display": f"{value_moa:.2f} MOA",
        "status": "calculated",
    })
    return group


def format_distance_yards(yards: float) -> str:
    rounded = _round(yards, 1)
    if rounded.is_integer():
        return f"{int(rounded)} yds"
    return f"{rounded} yds"


def click_phrase(count: int, direction: str) -> Optional[str]:
    if direction == "CENTER" or count == 0:
        return None
    label = "click" if count == 1 else "clicks"
    return f"{count} {label} {direction}"


def short_click_phrase(count: int, direction: str) -> Optional[str]:
    if direction == "CENTER" or count == 0:
        return None
    return f"{count} {direction}"


def build_shooter_guidance(correction: Optional[Dict[str, Any]], clicks: Optional[Dict[str, Any]], yards: float) -> Dict[str, Any]:
    guidance = {
        "status": "unavailable",
        "primary": None,
        "short": None,
        "confirm": None,
        "method": "authority-v1",
    }
    if not correction or not clicks:
        guidance["reason"] = "missing correction authority"
        return guidance

    elevation = click_phrase(int(clicks.get("elevationClicks", 0)), str(clicks.get("elevationDirection", "CENTER")))
    windage = click_phrase(int(clicks.get("windageClicks", 0)), str(clicks.get("windageDirection", "CENTER")))
    short_elevation = short_click_phrase(int(clicks.get("elevationClicks", 0)), str(clicks.get("elevationDirection", "CENTER")))
    short_windage = short_click_phrase(int(clicks.get("windageClicks", 0)), str(clicks.get("windageDirection", "CENTER")))
    phrases = [phrase for phrase in (elevation, windage) if phrase]
    short_phrases = [phrase for phrase in (short_elevation, short_windage) if phrase]
    confirm = f"Confirm at {format_distance_yards(yards)}."

    guidance.update({
        "status": "calculated",
        "confirm": confirm,
    })
    if not phrases:
        guidance["primary"] = "Confirm zero."
        guidance["short"] = "Confirm zero"
        return guidance
    if len(phrases) == 1:
        guidance["primary"] = f"Apply {phrases[0]}, then confirm."
    else:
        guidance["primary"] = f"Apply {phrases[0]} and {phrases[1]}, then confirm."
    guidance["short"] = " / ".join(short_phrases)
    return guidance


def stable_hash(payload: Dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _gssf_normalize_point(point: Any) -> Optional[Dict[str, float]]:
    if not isinstance(point, dict):
        return None
    x = _num(point.get("xPercent"), None)
    y = _num(point.get("yPercent"), None)
    if x is None or y is None:
        return None
    return {
        "xPercent": _round(x, 4),
        "yPercent": _round(y, 4),
    }


def _gssf_hits(payload: Dict[str, Any]) -> List[Dict[str, float]]:
    hits = (
        payload.get("hitCoordinates")
        or payload.get("hit_coordinates")
        or payload.get("hits")
        or payload.get("impactCoordinates")
        or payload.get("impactPoints")
    )
    if not isinstance(hits, list):
        return []
    return [point for point in (_gssf_normalize_point(item) for item in hits) if point]


def _gssf_point_inches(point: Dict[str, float]) -> Dict[str, float]:
    profile = GSSF_AC_1_PROFILE
    return {
        "xInches": _round((point["xPercent"] / 100) * float(profile["targetWidthInches"]), 4),
        "yInches": _round((point["yPercent"] / 100) * float(profile["targetHeightInches"]), 4),
    }


def _gssf_zone_for_hit(point: Dict[str, float]) -> Dict[str, Any]:
    profile = GSSF_AC_1_PROFILE
    center = _gssf_point_inches(profile["zoneCenterPercent"])
    hit = _gssf_point_inches(point)
    x_delta = hit["xInches"] - center["xInches"]
    y_delta = hit["yInches"] - center["yInches"]
    radius = math.sqrt((x_delta * x_delta) + (y_delta * y_delta))
    penalties = profile["penaltySeconds"]
    if (
        point["xPercent"] < 0
        or point["xPercent"] > 100
        or point["yPercent"] < 0
        or point["yPercent"] > 100
    ):
        zone = "miss"
    elif radius <= float(profile["downZeroRadiusInches"]):
        zone = "downZero"
    elif radius <= float(profile["plusOneRadiusInches"]):
        zone = "plusOne"
    else:
        zone = "plusThree"
    return {
        "zone": zone,
        "penaltySeconds": penalties[zone],
        "radiusInches": _round(radius, 4),
    }


def build_gssf_ac_1_authority_package(payload: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
    hits = _gssf_hits(payload)
    raw_time = _num(_first_present(payload.get("raw_time_seconds"), payload.get("rawTimeSeconds")), None)
    per_hit = []
    counts = {
        "downZero": 0,
        "plusOne": 0,
        "plusThree": 0,
        "miss": 0,
    }
    for index, hit in enumerate(hits, start=1):
        classification = _gssf_zone_for_hit(hit)
        counts[classification["zone"]] += 1
        per_hit.append({
            "shot": index,
            "coordinate": hit,
            "zone": classification["zone"],
            "penaltySeconds": classification["penaltySeconds"],
            "radiusInches": classification["radiusInches"],
        })

    total_penalty = sum(hit["penaltySeconds"] for hit in per_hit)
    final_time = _round(raw_time + total_penalty, 4) if raw_time is not None else None
    final_time_display = f"{final_time} sec" if final_time is not None else "unavailable"
    result_lines = [
        "Mission: GSSF AC-1",
        f"Down Zero: {counts['downZero']}",
        f"+1: {counts['plusOne']}",
        f"+3: {counts['plusThree']}",
        f"Miss: {counts['miss']}",
        f"Paper Penalty: +{total_penalty} sec",
        f"Final Time: {final_time_display}",
    ]
    authority_core = {
        "ok": True,
        "status": "calculated",
        "authorityVersion": "sczn3-gssf-authority-v1",
        "target_profile_id": "gssf_ac_1",
        "targetProfileId": "gssf_ac_1",
        "mission_family": "gssf",
        "missionFamilyId": "gssf",
        "resultPackageType": "gssfPaperPenaltyResult",
        "target": {
            "target_profile_id": "gssf_ac_1",
            "targetName": "GSSF AC-1",
            "manufacturer": profile.get("manufacturer"),
        },
        "inputs": {
            "target_profile_id": "gssf_ac_1",
            "mission_family": "gssf",
            "hitCoordinates": hits,
            "raw_time_seconds": raw_time,
        },
        "hitClassifications": per_hit,
        "counts": counts,
        "downZeroCount": counts["downZero"],
        "plusOneCount": counts["plusOne"],
        "plusThreeCount": counts["plusThree"],
        "missCount": counts["miss"],
        "totalPaperPenaltySeconds": total_penalty,
        "rawTimeSeconds": raw_time,
        "finalTimeSeconds": final_time,
        "finalTimeStatus": "calculated" if final_time is not None else "unavailable_without_raw_time",
        "display": {
            "resultLines": result_lines,
            "mission": "GSSF AC-1",
            "downZero": f"Down Zero: {counts['downZero']}",
            "plusOne": f"+1: {counts['plusOne']}",
            "plusThree": f"+3: {counts['plusThree']}",
            "miss": f"Miss: {counts['miss']}",
            "paperPenalty": f"Paper Penalty: +{total_penalty} sec",
            "finalTime": f"Final Time: {final_time_display}",
            "summary": (
                f"{counts['downZero']} Down Zero • {counts['plusOne']} +1 • "
                f"{counts['plusThree']} +3 • {counts['miss']} Miss"
            ),
            "paperPenaltySummary": f"{total_penalty} paper penalty seconds",
            "finalTimeSummary": f"{final_time} seconds" if final_time is not None else "Final time unavailable without raw time",
        },
        "profileAuthority": {
            "zoneModel": "concentric-ac-1-paper-penalty",
            "targetWidthInches": GSSF_AC_1_PROFILE["targetWidthInches"],
            "targetHeightInches": GSSF_AC_1_PROFILE["targetHeightInches"],
            "downZeroDiameterInches": GSSF_AC_1_PROFILE["downZeroRadiusInches"] * 2,
            "plusOneDiameterInches": GSSF_AC_1_PROFILE["plusOneRadiusInches"] * 2,
            "penaltySeconds": GSSF_AC_1_PROFILE["penaltySeconds"],
            "authoritySource": GSSF_AC_1_PROFILE["authoritySource"],
        },
        "renderCoordinates": {
            "hits": hits,
        },
    }
    authority_core["evidenceHash"] = stable_hash(authority_core)
    authority_core["computedAt"] = datetime.now(timezone.utc).isoformat()
    return authority_core


def _dot_torture_session_id(payload: Dict[str, Any], profile: Dict[str, Any]) -> str:
    supplied = _first_present(
        payload.get("session_id"),
        payload.get("sessionId"),
        payload.get("activeSessionId"),
    )
    if supplied:
        return str(supplied)
    seed = {
        "targetId": profile.get("targetId"),
        "missionFamilyId": profile.get("missionFamilyId"),
        "missionName": profile.get("missionName"),
        "createdFrom": payload.get("createdFrom") or payload.get("source") or "backend-authority",
    }
    return f"dot-torture-{stable_hash(seed)[:12]}"


def _dot_torture_distance(payload: Dict[str, Any]) -> Dict[str, Any]:
    distance = payload.get("distance")
    if isinstance(distance, dict):
        value = _num(distance.get("value"), DOT_TORTURE_PROFILE["recommended_distance"]["value"])
        unit = str(distance.get("unit") or DOT_TORTURE_PROFILE["recommended_distance"]["unit"])
    else:
        value = _num(distance, DOT_TORTURE_PROFILE["recommended_distance"]["value"])
        unit = DOT_TORTURE_PROFILE["recommended_distance"]["unit"]
    return {
        "value": _round(value or DOT_TORTURE_PROFILE["recommended_distance"]["value"], 4),
        "unit": unit,
    }


def build_dot_torture_session_package(payload: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
    distance = _dot_torture_distance(payload)
    raw_time = _num(_first_present(payload.get("raw_time_seconds"), payload.get("rawTimeSeconds")), None)
    stages = [deepcopy(stage) for stage in DOT_TORTURE_STAGES]
    scoring_rules = [
        DOT_TORTURE_PROFILE["scoring_rule"],
        "Maximum score is 50.",
        "Each counted round is worth one point.",
        "Misses are recorded by dot/stage when scoring authority has stage attribution.",
    ]
    stage_results = [
        {
            "stageId": stage["stageId"],
            "label": stage["label"],
            "dots": stage["dots"],
            "rounds": stage["rounds"],
            "score": None,
            "misses": None,
            "status": "awaiting_scored_evidence",
        }
        for stage in stages
    ]
    authority_core = {
        "ok": True,
        "status": "created",
        "authorityVersion": "sczn3-training-authority-v1",
        "method": "dot-torture-session-skeleton-v1",
        "session_id": _dot_torture_session_id(payload, profile),
        "target_profile_id": "dot_torture_ez2c_style_17",
        "targetProfileId": "dot_torture_ez2c_style_17",
        "mission_family": "marksmanshipTraining",
        "missionFamilyId": "marksmanshipTraining",
        "mission_name": "dotTorture",
        "missionName": "dotTorture",
        "resultPackageType": "marksmanshipTrainingResult",
        "target_name": DOT_TORTURE_PROFILE["target_name"],
        "targetName": DOT_TORTURE_PROFILE["target_name"],
        "target_size": DOT_TORTURE_PROFILE["target_size"],
        "targetSize": DOT_TORTURE_PROFILE["target_size"],
        "discipline": DOT_TORTURE_PROFILE["discipline"],
        "recommended_distance": DOT_TORTURE_PROFILE["recommended_distance"],
        "recommendedDistance": DOT_TORTURE_PROFILE["recommended_distance"],
        "distance": distance,
        "max_score": DOT_TORTURE_PROFILE["max_score"],
        "maxScore": DOT_TORTURE_PROFILE["max_score"],
        "total_rounds": DOT_TORTURE_PROFILE["total_rounds"],
        "totalRounds": DOT_TORTURE_PROFILE["total_rounds"],
        "stages": stages,
        "scoring_rules": scoring_rules,
        "scoringRules": scoring_rules,
        "score": {
            "status": "awaiting_scored_evidence",
            "total": None,
            "max": DOT_TORTURE_PROFILE["max_score"],
            "percentage": None,
        },
        "stageResults": stage_results,
        "missesByDot": {},
        "missesByStage": {},
        "timeSeconds": raw_time,
        "sessionSaved": False,
        "sec_template": DOT_TORTURE_PROFILE["sec_template"],
        "secTemplate": DOT_TORTURE_PROFILE["sec_template"],
        "trainingSEC": {
            "scoreTotal": None,
            "scoreMax": DOT_TORTURE_PROFILE["max_score"],
            "percentage": None,
            "stageResults": stage_results,
            "missesByDot": {},
            "missesByStage": {},
            "distance": distance,
            "timeSeconds": raw_time,
            "sessionSaved": False,
        },
        "display": {
            "primary": "Dot Torture training session ready.",
            "stageGuidance": [f"{stage['label']}: {stage['rounds']} rounds" for stage in stages],
            "resultLines": [
                "Mission: Dot Torture",
                f"Target: {DOT_TORTURE_PROFILE['target_name']}",
                "Max Score: 50",
                "Score: awaiting scored evidence",
            ],
        },
        "targetProfile": {
            **profile,
            "missionName": "dotTorture",
            "secTemplate": DOT_TORTURE_PROFILE["sec_template"],
        },
    }
    authority_core["evidenceHash"] = stable_hash(authority_core)
    authority_core["computedAt"] = datetime.now(timezone.utc).isoformat()
    return authority_core


def _distance_query_number(payload: Dict[str, Any], key: str) -> Optional[float]:
    value = _num(payload.get(key), None)
    return value if value is not None and value > 0 else None


def _distance_query_unavailable(reason: str) -> Dict[str, Any]:
    return {
        "ok": False,
        "reason": reason,
        "display": "Dial: Backend authority required",
        "method": "distance-click-authority-v1",
    }


def _distance_query_direction(payload: Dict[str, Any], default: str = "UP") -> str:
    direction = str(payload.get("direction") or payload.get("dialDirection") or default).upper()
    return direction if direction in {"UP", "DOWN"} else default


def build_distance_click_query(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Build authoritative distance-click guidance.

    Distance transitions require trajectory/doctrine authority. Distances and optic
    click value alone are not enough to produce truthful clicks.
    """
    if not isinstance(payload, dict):
        payload = {}

    current_distance = _distance_query_number(payload, "currentDistance")
    go_to_distance = _distance_query_number(payload, "goToDistance")
    distance_unit = str(payload.get("currentDistanceUnit") or payload.get("distanceUnit") or "").upper()
    adjustment_unit = str(payload.get("adjustmentUnit") or "").upper()
    click_value = _num(payload.get("clickValue"), None)

    if current_distance is None:
        return _distance_query_unavailable("missing_current_distance")
    if go_to_distance is None:
        return _distance_query_unavailable("missing_go_to_distance")
    if distance_unit not in {"YDS", "M"}:
        return _distance_query_unavailable("invalid_distance_unit")
    if adjustment_unit not in {"MOA", "MRAD"}:
        return _distance_query_unavailable("invalid_adjustment_unit")
    if click_value is None or click_value <= 0:
        return _distance_query_unavailable("invalid_click_value")

    approved_clicks = _num(
        _first_present(
            payload.get("authorityClicks"),
            payload.get("dialClicks"),
            payload.get("approvedClicks"),
        ),
        None,
    )
    if approved_clicks is not None:
        dial_clicks = int(round(abs(approved_clicks)))
        direction = _distance_query_direction(payload)
        return {
            "ok": True,
            "dialClicks": dial_clicks,
            "direction": direction,
            "display": f"Dial: {dial_clicks} Clicks {'↑' if direction == 'UP' else '↓'}",
            "method": "distance-click-authority-v1-approved-clicks",
        }

    angular_delta = _num(
        _first_present(
            payload.get("authorityAngularDelta"),
            payload.get("angularDelta"),
            payload.get("dropDeltaAngular"),
        ),
        None,
    )
    if angular_delta is not None:
        dial_clicks = clicks_for_angular_value(angular_delta, adjustment_unit, click_value)
        direction = _distance_query_direction(payload, "UP" if angular_delta >= 0 else "DOWN")
        return {
            "ok": True,
            "dialClicks": dial_clicks,
            "direction": direction,
            "display": f"Dial: {dial_clicks} Clicks {'↑' if direction == 'UP' else '↓'}",
            "method": "distance-click-authority-v1-angular-delta",
        }

    return _distance_query_unavailable("insufficient_authority")


def build_authority_package(payload: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        payload = {}

    profile = normalize_target_profile(payload)
    refusal = refusal_for_profile(profile)
    if refusal:
        return refusal
    if profile.get("targetId") == "gssf_ac_1" and profile.get("missionFamilyId") == "gssf":
        return build_gssf_ac_1_authority_package(payload, profile)
    if (
        profile.get("targetId") == "dot_torture_ez2c_style_17"
        and profile.get("missionFamilyId") == "marksmanshipTraining"
        and profile.get("resultPackageType") == "marksmanshipTrainingResult"
    ):
        return build_dot_torture_session_package(payload, profile)

    geometry = target_geometry(payload)
    aim = normalize_point(payload.get("aimCoordinate") or payload.get("aim") or payload.get("aimPoint"))
    impacts = normalize_impacts(payload.get("impactCoordinates") or payload.get("impacts") or payload.get("impactPoints"))
    yards = distance_yards(payload)
    adjustment = optic_adjustment(payload)
    poib = average_point(impacts)
    score = calculate_score(aim, impacts, geometry)
    group = calculate_group(impacts, geometry, yards)

    aim_grid = image_percent_to_grid_inches(aim, geometry) if aim else None
    poib_grid = image_percent_to_grid_inches(poib, geometry) if poib else None

    correction = None
    clicks = None
    moa = None
    vector = None
    shooter_guidance = None
    if aim_grid and poib_grid:
        x_inches = _round(poib_grid["xInches"] - aim_grid["xInches"], 4)
        y_inches = _round(poib_grid["yInches"] - aim_grid["yInches"], 4)
        directions = direction_labels(x_inches, y_inches)
        windage_clicks = clicks_for_inches(x_inches, yards, adjustment)
        elevation_clicks = clicks_for_inches(y_inches, yards, adjustment)
        correction = {
            "xInches": x_inches,
            "yInches": y_inches,
            "adjustmentUnit": adjustment["unit"],
            "clickValue": adjustment["clickValue"],
            "clickValueLabel": adjustment["clickValueLabel"],
            "windageDirection": directions["windage"],
            "elevationDirection": directions["elevation"],
            "windage": "0 clicks CENTER" if directions["windage"] == "CENTER" else f"{windage_clicks} clicks {directions['windage']}",
            "elevation": "0 clicks CENTER" if directions["elevation"] == "CENTER" else f"{elevation_clicks} clicks {directions['elevation']}",
        }
        clicks = {
            "windageClicks": windage_clicks,
            "elevationClicks": elevation_clicks,
            "windageDirection": directions["windage"],
            "elevationDirection": directions["elevation"],
            "adjustmentUnit": adjustment["unit"],
            "clickValue": adjustment["clickValue"],
            "clickValueLabel": adjustment["clickValueLabel"],
        }
        moa = {
            "windageMOA": _round(abs(x_inches) / ((yards / 100) * MOA_INCHES_AT_100_YARDS), 4),
            "elevationMOA": _round(abs(y_inches) / ((yards / 100) * MOA_INCHES_AT_100_YARDS), 4),
        }
        if adjustment["unit"] == "MRAD":
            moa.update({
                "windageMRAD": _round(angular_for_inches(x_inches, yards, adjustment), 4),
                "elevationMRAD": _round(angular_for_inches(y_inches, yards, adjustment), 4),
            })
        vector = {
            "start": image_point_through_grid(poib, geometry),
            "end": image_point_through_grid(aim, geometry),
            "intent": "POIB_TO_AIM",
        }
        shooter_guidance = build_shooter_guidance(correction, clicks, yards)
    else:
        shooter_guidance = build_shooter_guidance(correction, clicks, yards)

    render_coordinates = {
        "aim": image_point_through_grid(aim, geometry) if aim else None,
        "impacts": [image_point_through_grid(point, geometry) for point in impacts],
        "poib": image_point_through_grid(poib, geometry) if poib else None,
        "vector": vector,
    }

    authority_core = {
        "authorityVersion": "sczn3-ugeo-authority-v1",
        "target": {
            "targetId": geometry["targetId"],
            "targetName": payload.get("targetName") or "Baker 100 Yard Smart Target",
            "vendor": payload.get("vendor") or "Baker Smart Targets",
        },
        "inputs": {
            "aimCoordinate": aim,
            "impactCoordinates": impacts,
            "distanceYards": _round(yards, 4),
            "opticAdjustment": adjustment,
            "shooterSetup": payload.get("shooterSetup") or {},
        },
        "impacts": impacts,
        "poib": poib,
        "groupCenter": poib,
        "group": group,
        "score": score,
        "correction": correction,
        "clicks": clicks,
        "shooterGuidance": shooter_guidance,
        "moa": moa,
        "vectors": {"poibToAim": vector} if vector else {},
        "geometryMetadata": geometry,
        "targetMetadata": {
            "targetId": geometry["targetId"],
            "gridSquareInches": geometry.get("gridSquareInches", 1),
            "gridSquarePx": geometry.get("gridSquarePx"),
        },
        "renderCoordinates": render_coordinates,
        "hasCorrection": correction is not None,
        "status": {
            "hasAim": aim is not None,
            "impactCount": len(impacts),
            "hasPOIB": poib is not None,
            "hasCorrection": correction is not None,
        },
    }
    authority_core["evidenceHash"] = stable_hash(authority_core)
    authority_core["computedAt"] = datetime.now(timezone.utc).isoformat()
    return authority_core


def authority_json(payload: Dict[str, Any]) -> str:
    return json.dumps(build_authority_package(payload), sort_keys=True, indent=2)
