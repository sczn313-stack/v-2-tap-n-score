"""Authority-neutral normalized point classification against approved UGO regions."""
from __future__ import annotations

from math import cos, hypot, pi, sin
from typing import Any, Dict, Mapping, Sequence, Type


class UGOClassificationError(ValueError):
    pass


def coordinate(value: Any, reason: str, error_type: Type[ValueError] = UGOClassificationError) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise error_type(reason) from exc
    if not 0 <= number <= 1:
        raise error_type(reason)
    return number


def contains(region: Mapping[str, Any], x: float, y: float, reason: str, error_type: Type[ValueError] = UGOClassificationError) -> bool:
    shape = region.get("shape")
    if shape == "circle":
        return hypot(x - float(region["cx"]), y - float(region["cy"])) <= float(region["radius"])
    if shape == "rectangle":
        return float(region["xMin"]) <= x <= float(region["xMax"]) and float(region["yMin"]) <= y <= float(region["yMax"])
    if shape == "rounded_rectangle":
        x0, x1 = float(region["xMin"]), float(region["xMax"])
        y0, y1 = float(region["yMin"]), float(region["yMax"])
        rx, ry = float(region["cornerRadiusX"]), float(region["cornerRadiusY"])
        if not x0 <= x <= x1 or not y0 <= y <= y1:
            return False
        if x0 + rx <= x <= x1 - rx or y0 + ry <= y <= y1 - ry:
            return True
        corner_x = x0 + rx if x < x0 + rx else x1 - rx
        corner_y = y0 + ry if y < y0 + ry else y1 - ry
        return ((x - corner_x) / rx) ** 2 + ((y - corner_y) / ry) ** 2 <= 1
    if shape == "ellipse":
        rx, ry = float(region["radiusX"]), float(region["radiusY"])
        return rx > 0 and ry > 0 and ((x - float(region["cx"])) / rx) ** 2 + ((y - float(region["cy"])) / ry) ** 2 <= 1
    if shape == "polygon":
        points = region.get("points")
        if not isinstance(points, Sequence) or len(points) < 3:
            raise error_type(reason)
        inside = False
        prior_x, prior_y = map(float, points[-1])
        for raw in points:
            current_x, current_y = map(float, raw)
            crosses = (current_y > y) != (prior_y > y)
            if crosses and x < (prior_x - current_x) * (y - current_y) / (prior_y - current_y) + current_x:
                inside = not inside
            prior_x, prior_y = current_x, current_y
        return inside
    raise error_type(reason)


def _point_to_segment_distance(px: float, py: float, ax: float, ay: float, bx: float, by: float) -> float:
    dx, dy = bx - ax, by - ay
    denominator = dx * dx + dy * dy
    if denominator <= 0:
        return hypot(px - ax, py - ay)
    amount = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / denominator))
    return hypot(px - (ax + amount * dx), py - (ay + amount * dy))


def _polygon_touches_ellipse(points: Sequence[Any], x: float, y: float, radius_x: float, radius_y: float) -> bool:
    """Exact circle-to-polygon test after scaling the observation ellipse to a unit circle."""
    scaled = [((float(point[0]) - x) / radius_x, (float(point[1]) - y) / radius_y) for point in points]
    if any(hypot(px, py) <= 1.0 for px, py in scaled):
        return True
    for index, (ax, ay) in enumerate(scaled):
        bx, by = scaled[(index + 1) % len(scaled)]
        if _point_to_segment_distance(0.0, 0.0, ax, ay, bx, by) <= 1.0:
            return True
    return False


def footprint_touches(
    region: Mapping[str, Any],
    x: float,
    y: float,
    radius_x: float,
    radius_y: float,
    reason: str,
    error_type: Type[ValueError] = UGOClassificationError,
) -> bool:
    """Return whether a physical elliptical shot footprint touches a governed region."""
    if contains(region, x, y, reason, error_type):
        return True
    if radius_x <= 0 or radius_y <= 0:
        return False
    shape = region.get("shape")
    if shape == "rectangle":
        nearest_x = max(float(region["xMin"]), min(x, float(region["xMax"])))
        nearest_y = max(float(region["yMin"]), min(y, float(region["yMax"])))
        return ((nearest_x - x) / radius_x) ** 2 + ((nearest_y - y) / radius_y) ** 2 <= 1.0
    if shape == "polygon":
        points = region.get("points")
        if not isinstance(points, Sequence) or len(points) < 3:
            raise error_type(reason)
        return _polygon_touches_ellipse(points, x, y, radius_x, radius_y)
    if shape in {"circle", "ellipse"}:
        cx, cy = float(region["cx"]), float(region["cy"])
        region_rx = float(region.get("radiusX") if shape == "ellipse" else region["radius"])
        region_ry = float(region.get("radiusY") if shape == "ellipse" else region["radius"])
        if region_rx <= 0 or region_ry <= 0:
            return False
        # A short deterministic polygonization handles ellipses in normalized
        # coordinates without confusing display pixels with physical geometry.
        points = [
            (cx + region_rx * cos(2 * pi * index / 180), cy + region_ry * sin(2 * pi * index / 180))
            for index in range(180)
        ]
        return _polygon_touches_ellipse(points, x, y, radius_x, radius_y)
    raise error_type(reason)


def classify(regions: Sequence[Mapping[str, Any]], x: float, y: float, *, id_key: str = "zoneId", shape_reason: str = "geometry_shape_not_supported", error_type: Type[ValueError] = UGOClassificationError, footprint_radius_x: float = 0.0, footprint_radius_y: float = 0.0) -> Dict[str, Any]:
    uses_footprint = footprint_radius_x > 0 and footprint_radius_y > 0
    matches = [
        region for region in regions
        if footprint_touches(region, x, y, footprint_radius_x, footprint_radius_y, shape_reason, error_type)
        if uses_footprint
    ] if uses_footprint else [region for region in regions if contains(region, x, y, shape_reason, error_type)]
    matches.sort(key=lambda region: int(region.get("priority", 0)), reverse=True)
    ambiguous = len(matches) > 1 and int(matches[0].get("priority", 0)) == int(matches[1].get("priority", 0))
    return {
        "classificationStatus": "ambiguous" if ambiguous else ("unmapped" if not matches else "matched"),
        "entityId": None if ambiguous or not matches else str(matches[0][id_key]),
        "matchingEntityIds": [str(region[id_key]) for region in matches],
        "classificationMethod": "physical_projectile_footprint" if uses_footprint else "tap_center_point",
    }
