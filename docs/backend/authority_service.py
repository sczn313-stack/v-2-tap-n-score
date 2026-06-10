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
DEFAULT_OPTIC_CLICK_MOA = 0.25
MOA_INCHES_AT_100_YARDS = 1.047


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


def optic_click_value(payload: Dict[str, Any]) -> float:
    setup = payload.get("shooterSetup") if isinstance(payload.get("shooterSetup"), dict) else {}
    optic = setup.get("optic") if isinstance(setup.get("optic"), dict) else {}
    value = (
        optic.get("clickValueMOA")
        or optic.get("clickValue")
        or setup.get("opticClickValueMOA")
        or setup.get("clickValueMOA")
        or DEFAULT_OPTIC_CLICK_MOA
    )
    return max(0.01, _num(value, DEFAULT_OPTIC_CLICK_MOA) or DEFAULT_OPTIC_CLICK_MOA)


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


def clicks_for_inches(inches: float, yards: float, click_moa: float) -> int:
    moa = abs(inches) / ((yards / 100) * MOA_INCHES_AT_100_YARDS)
    return int(round(moa / click_moa))


def moa_for_inches(inches: float, yards: float) -> float:
    return abs(inches) / ((yards / 100) * MOA_INCHES_AT_100_YARDS)


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


def stable_hash(payload: Dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def build_authority_package(payload: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        payload = {}

    geometry = target_geometry(payload)
    aim = normalize_point(payload.get("aimCoordinate") or payload.get("aim") or payload.get("aimPoint"))
    impacts = normalize_impacts(payload.get("impactCoordinates") or payload.get("impacts") or payload.get("impactPoints"))
    yards = distance_yards(payload)
    click_moa = optic_click_value(payload)
    poib = average_point(impacts)
    score = calculate_score(aim, impacts, geometry)
    group = calculate_group(impacts, geometry, yards)

    aim_grid = image_percent_to_grid_inches(aim, geometry) if aim else None
    poib_grid = image_percent_to_grid_inches(poib, geometry) if poib else None

    correction = None
    clicks = None
    moa = None
    vector = None
    if aim_grid and poib_grid:
        x_inches = _round(poib_grid["xInches"] - aim_grid["xInches"], 4)
        y_inches = _round(poib_grid["yInches"] - aim_grid["yInches"], 4)
        directions = direction_labels(x_inches, y_inches)
        windage_clicks = clicks_for_inches(x_inches, yards, click_moa)
        elevation_clicks = clicks_for_inches(y_inches, yards, click_moa)
        correction = {
            "xInches": x_inches,
            "yInches": y_inches,
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
        }
        moa = {
            "windageMOA": _round(abs(x_inches) / ((yards / 100) * MOA_INCHES_AT_100_YARDS), 4),
            "elevationMOA": _round(abs(y_inches) / ((yards / 100) * MOA_INCHES_AT_100_YARDS), 4),
        }
        vector = {
            "start": image_point_through_grid(poib, geometry),
            "end": image_point_through_grid(aim, geometry),
            "intent": "POIB_TO_AIM",
        }

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
            "opticClickValueMOA": _round(click_moa, 4),
            "shooterSetup": payload.get("shooterSetup") or {},
        },
        "impacts": impacts,
        "poib": poib,
        "groupCenter": poib,
        "group": group,
        "score": score,
        "correction": correction,
        "clicks": clicks,
        "moa": moa,
        "vectors": {"poibToAim": vector} if vector else {},
        "geometryMetadata": geometry,
        "targetMetadata": {
            "targetId": geometry["targetId"],
            "gridSquareInches": geometry.get("gridSquareInches", 1),
            "gridSquarePx": geometry.get("gridSquarePx"),
        },
        "renderCoordinates": render_coordinates,
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
