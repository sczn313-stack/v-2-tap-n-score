"""Authority-neutral normalized point classification against approved UGO regions."""
from __future__ import annotations

from math import hypot
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
    raise error_type(reason)


def classify(regions: Sequence[Mapping[str, Any]], x: float, y: float, *, id_key: str = "zoneId", shape_reason: str = "geometry_shape_not_supported", error_type: Type[ValueError] = UGOClassificationError) -> Dict[str, Any]:
    matches = [region for region in regions if contains(region, x, y, shape_reason, error_type)]
    matches.sort(key=lambda region: int(region.get("priority", 0)), reverse=True)
    ambiguous = len(matches) > 1 and int(matches[0].get("priority", 0)) == int(matches[1].get("priority", 0))
    return {
        "classificationStatus": "ambiguous" if ambiguous else ("unmapped" if not matches else "matched"),
        "entityId": None if ambiguous or not matches else str(matches[0][id_key]),
        "matchingEntityIds": [str(region[id_key]) for region in matches],
    }
