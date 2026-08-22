"""Authority-neutral mechanics shared by governed staged mission families."""
from __future__ import annotations

from copy import deepcopy
from math import hypot
from typing import Any, Dict, Mapping, Type

from target_execution_contract import canonical_json, digest


class StageEventPrimitiveError(ValueError):
    pass


def text(value: Any) -> str:
    return str(value or "").strip()


def coordinate(value: Any, reason: str, error_type: Type[ValueError] = StageEventPrimitiveError) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise error_type(reason) from exc
    if not 0 <= number <= 1:
        raise error_type(reason)
    return number


def admitted_image(value: Any, acceptance_scope: str, error_type: Type[ValueError] = StageEventPrimitiveError) -> Dict[str, Any]:
    if not isinstance(value, Mapping):
        raise error_type("image_evidence_required")
    sha256 = text(value.get("sha256")).lower()
    width, height = value.get("widthPx"), value.get("heightPx")
    if len(sha256) != 64 or any(character not in "0123456789abcdef" for character in sha256):
        raise error_type("image_sha256_invalid")
    if not isinstance(width, int) or width < 1 or not isinstance(height, int) or height < 1:
        raise error_type("image_dimensions_invalid")
    if not (text(value.get("dataUrl")) or text(value.get("mediaId"))):
        raise error_type("admitted_image_reference_required")
    return {"sha256": sha256, "widthPx": width, "heightPx": height, "mediaType": text(value.get("mediaType")) or "image/unknown", "backendHashVerified": True, "acceptanceScope": acceptance_scope}


def contains(shape: Mapping[str, Any], x: float, y: float, error_reason: str, error_type: Type[ValueError] = StageEventPrimitiveError) -> bool:
    kind = shape.get("shape")
    if kind == "circle":
        return hypot(x - float(shape["cx"]), y - float(shape["cy"])) <= float(shape["radius"])
    if kind == "rectangle":
        return float(shape["xMin"]) <= x <= float(shape["xMax"]) and float(shape["yMin"]) <= y <= float(shape["yMax"])
    raise error_type(error_reason)


def current_plan_item(state: Mapping[str, Any], complete_reason: str, error_type: Type[ValueError] = StageEventPrimitiveError) -> Dict[str, Any]:
    cursor = int(state["cursor"])
    if cursor >= len(state["plan"]):
        raise error_type(complete_reason)
    return deepcopy(state["plan"][cursor])


def reconcile(observations: list[Mapping[str, Any]], expected: int, authorized_ids: set[str]) -> str:
    if any(item["classificationStatus"] == "ambiguous" for item in observations):
        return "ambiguous"
    if any(item["classificationStatus"] == "unresolved" or (authorized_ids and item.get("entityId") not in authorized_ids) for item in observations):
        return "unresolved"
    if len(observations) > expected:
        return "extra"
    if len(observations) < expected:
        return "missing"
    return "recorded"


def sign_result(result: Mapping[str, Any]) -> Dict[str, Any]:
    signed = deepcopy(dict(result))
    signed["resultHash"] = digest(canonical_json(signed))
    signed["resultIdentity"] = f"SCZN3-RESULT-{signed['resultHash'][:24].upper()}"
    return signed
