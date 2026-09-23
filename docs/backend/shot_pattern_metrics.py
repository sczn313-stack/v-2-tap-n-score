"""Measured shot-pattern facts derived only from normalized tap coordinates."""
from __future__ import annotations

import math
from typing import Any, Dict, Mapping, Sequence


def _band(value: float, low: str, middle: str, high: str) -> str:
    if value < 1 / 3:
        return low
    if value > 2 / 3:
        return high
    return middle


def derive_shot_pattern(
    observations: Sequence[Mapping[str, Any]],
    aim_point: Mapping[str, Any] | None = None,
) -> Dict[str, Any]:
    """Return target-plane measurements without assigning publisher meaning."""
    points = [(float(item["xNorm"]), float(item["yNorm"])) for item in observations]
    count = len(points)
    center_x = sum(point[0] for point in points) / count
    center_y = sum(point[1] for point in points) / count
    distances = [math.hypot(x - center_x, y - center_y) for x, y in points]
    mean_radius = sum(distances) / count
    rms_radius = math.sqrt(sum(distance * distance for distance in distances) / count)
    result: Dict[str, Any] = {
        "status": "complete",
        "metricAuthority": "sczn3_measured_from_normalized_taps",
        "publisherMeaningAttributed": False,
        "coordinateSpace": "normalized_source_image_top_left",
        "tapCount": count,
        "center": {
            "xNorm": round(center_x, 4),
            "yNorm": round(center_y, 4),
            "horizontalBand": _band(center_x, "left", "center", "right"),
            "verticalBand": _band(center_y, "upper", "middle", "lower"),
        },
        "dispersion": {
            "status": "complete" if count > 1 else "single_tap",
            "meanRadiusNorm": round(mean_radius, 4),
            "rmsRadiusNorm": round(rms_radius, 4),
            "maxRadiusNorm": round(max(distances), 4),
            "boundingWidthNorm": round(max(x for x, _ in points) - min(x for x, _ in points), 4),
            "boundingHeightNorm": round(max(y for _, y in points) - min(y for _, y in points), 4),
            "physicalUnitsAvailable": False,
        },
    }
    if isinstance(aim_point, Mapping):
        aim_x, aim_y = float(aim_point["xNorm"]), float(aim_point["yNorm"])
        result["aimOffset"] = {
            "status": "complete",
            "xNorm": round(center_x - aim_x, 4),
            "yNorm": round(center_y - aim_y, 4),
            "distanceNorm": round(math.hypot(center_x - aim_x, center_y - aim_y), 4),
            "aimAuthority": str(aim_point.get("authorityScope") or "session_evidence_only"),
        }
    else:
        result["aimOffset"] = {"status": "not_available", "reason": "no_governed_or_shooter_declared_aim_point"}
    return result
