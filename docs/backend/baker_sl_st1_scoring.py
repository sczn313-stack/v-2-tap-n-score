"""Mission A backend authority for Baker SL-ST1 canonical-coordinate scoring.

This module does not register photographs. It accepts only the governed Baker
canonical coordinate system and derives every classification and score on the
backend. Client classification/value/score claims are ignored.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Mapping, Sequence, Tuple


ROOT = Path(__file__).resolve().parents[1]
UGO_PATH = ROOT / "authority-evidence" / "baker-sl-st1" / "BAKER_SL_ST1_UGO_REGISTRATION_V1.json"
SCORING_PATH = ROOT / "authority-evidence" / "baker-sl-st1" / "BAKER_SL_ST1_SCORING_PROFILE_V1.json"
BOUNDARY_EPSILON_PX = 0.0001


class BakerSLST1ScoringError(ValueError):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason
        self.payload = {"ok": False, "status": "scoring_rejected", "reason": reason}


def _read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _coordinate(value: Any, reason: str) -> float:
    if isinstance(value, bool):
        raise BakerSLST1ScoringError(reason)
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise BakerSLST1ScoringError(reason)
    if not 0 <= parsed <= 1:
        raise BakerSLST1ScoringError(reason)
    return parsed


def _point_on_segment(point: Tuple[float, float], start: Tuple[float, float], end: Tuple[float, float]) -> bool:
    px, py = point
    ax, ay = start
    bx, by = end
    cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax)
    scale = max(1.0, abs(bx - ax), abs(by - ay))
    if abs(cross) > BOUNDARY_EPSILON_PX * scale:
        return False
    return (
        min(ax, bx) - BOUNDARY_EPSILON_PX <= px <= max(ax, bx) + BOUNDARY_EPSILON_PX
        and min(ay, by) - BOUNDARY_EPSILON_PX <= py <= max(ay, by) + BOUNDARY_EPSILON_PX
    )


def _on_boundary(point: Tuple[float, float], polygon: Sequence[Tuple[float, float]]) -> bool:
    return any(_point_on_segment(point, start, end) for start, end in zip(polygon, polygon[1:] + polygon[:1]))


def _inside(point: Tuple[float, float], polygon: Sequence[Tuple[float, float]]) -> bool:
    px, py = point
    contained = False
    for (ax, ay), (bx, by) in zip(polygon, polygon[1:] + polygon[:1]):
        if (ay > py) != (by > py) and px < ((bx - ax) * (py - ay) / (by - ay)) + ax:
            contained = not contained
    return contained


def _governed_context() -> Dict[str, Any]:
    ugo = _read_json(UGO_PATH)
    scoring = _read_json(SCORING_PATH)
    if scoring["targetId"] != "BAKER_SL_ST1" or scoring["variantId"] != "BAKER_SL_ST1_23X35_STANDARD_WHITE":
        raise BakerSLST1ScoringError("scoring_target_authority_mismatch")
    if scoring["status"] != "founder_approved_for_canonical_coordinates":
        raise BakerSLST1ScoringError("scoring_authority_not_approved")
    if scoring["zoneValues"] != {"A": 10, "B": 9, "C": 8, "D": 7}:
        raise BakerSLST1ScoringError("scoring_zone_values_mismatch")
    if scoring["classificationPrecedence"] != ["A", "C", "B", "D", "outside"]:
        raise BakerSLST1ScoringError("scoring_precedence_mismatch")
    if scoring["geometryAuthorityId"] != ugo["registrationId"]:
        raise BakerSLST1ScoringError("scoring_geometry_authority_mismatch")
    if scoring["coordinateSystemId"] != ugo["coordinateSystem"]["coordinateSystemId"]:
        raise BakerSLST1ScoringError("scoring_coordinate_system_mismatch")
    source = ugo["sourceEvidence"]
    dimensions = scoring.get("canonicalPixelDimensions")
    if dimensions != {"width": source["pixelWidth"], "height": source["pixelHeight"]}:
        raise BakerSLST1ScoringError("scoring_canonical_dimensions_mismatch")
    if scoring["canonicalAssetSha256"] != source["sha256"]:
        raise BakerSLST1ScoringError("scoring_canonical_asset_mismatch")
    boundaries = {
        item["featureId"]: [(float(point["xPx"]), float(point["yPx"])) for point in item["points"]]
        for item in ugo["observableGeometry"]["boundaries"]
    }
    required = {"printed_boundary_002", "printed_boundary_003", "printed_boundary_004", "printed_boundary_005"}
    if not required.issubset(boundaries):
        raise BakerSLST1ScoringError("scoring_geometry_feature_missing")
    return {"ugo": ugo, "scoring": scoring, "boundaries": boundaries, "dimensions": dimensions}


def _zone(point: Tuple[float, float], boundaries: Mapping[str, Sequence[Tuple[float, float]]]) -> str:
    exterior = boundaries["printed_boundary_002"]
    body = boundaries["printed_boundary_003"]
    body_a = boundaries["printed_boundary_004"]
    head_a = boundaries["printed_boundary_005"]
    decisive = (exterior, body, body_a, head_a)
    if any(_on_boundary(point, polygon) for polygon in decisive):
        return "indeterminate_boundary"
    if _inside(point, body_a) or _inside(point, head_a):
        return "A"
    if _inside(point, body):
        return "C"
    if _inside(point, exterior):
        head_top = min(y for _, y in exterior)
        head_top_points = [x for x, y in exterior if y == head_top]
        head_left = min(head_top_points)
        head_right = max(head_top_points)
        body_top = min(y for _, y in body)
        if head_left < point[0] < head_right and head_top < point[1] < body_top:
            return "B"
        return "D"
    return "outside"


def score_canonical_impacts(payload: Any) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise BakerSLST1ScoringError("canonical_scoring_payload_must_be_object")
    context = _governed_context()
    scoring = context["scoring"]
    if payload.get("coordinateSystemId") != scoring["coordinateSystemId"]:
        raise BakerSLST1ScoringError("canonical_coordinate_system_mismatch")
    if payload.get("registrationId") != scoring["geometryAuthorityId"]:
        raise BakerSLST1ScoringError("canonical_registration_identity_mismatch")
    if payload.get("canonicalAssetSha256") != scoring["canonicalAssetSha256"]:
        raise BakerSLST1ScoringError("canonical_asset_identity_mismatch")
    impacts = payload.get("impacts")
    if not isinstance(impacts, list) or not impacts:
        raise BakerSLST1ScoringError("canonical_scoring_requires_impacts")
    if len(impacts) > 250:
        raise BakerSLST1ScoringError("canonical_scoring_impact_limit_exceeded")

    values = scoring["zoneValues"]
    dimensions = context["dimensions"]
    counts = {"A": 0, "B": 0, "C": 0, "D": 0, "outside": 0, "indeterminate_boundary": 0}
    classified = []
    for index, impact in enumerate(impacts, start=1):
        if not isinstance(impact, Mapping):
            raise BakerSLST1ScoringError("canonical_impact_must_be_object")
        x_norm = _coordinate(impact.get("xNorm"), "canonical_impact_x_out_of_bounds")
        y_norm = _coordinate(impact.get("yNorm"), "canonical_impact_y_out_of_bounds")
        point = (x_norm * (dimensions["width"] - 1), y_norm * (dimensions["height"] - 1))
        zone = _zone(point, context["boundaries"])
        counts[zone] += 1
        result = {
            "impactId": f"impact-{index:03d}",
            "xNorm": round(x_norm, 8),
            "yNorm": round(y_norm, 8),
            "canonicalPointPx": {"x": round(point[0], 6), "y": round(point[1], 6)},
            "zone": zone,
        }
        if zone in values:
            result["zoneValue"] = values[zone]
        classified.append(result)

    classified_count = sum(counts[zone] for zone in values)
    reconciliation = {
        "classifiedImpactCount": classified_count,
        "unresolvedImpactCount": counts["outside"] + counts["indeterminate_boundary"],
        "capturedImpactCount": len(classified),
        "countsMatchCapturedImpactCount": sum(counts.values()) == len(classified),
    }
    if counts["indeterminate_boundary"]:
        score = {"status": "withheld", "reason": "indeterminate_boundary"}
    elif counts["outside"]:
        score = {"status": "withheld", "reason": "outside_numeric_treatment_unapproved"}
    else:
        subtotals = {zone: counts[zone] * values[zone] for zone in ("A", "B", "C", "D")}
        score = {
            "status": "complete",
            "objective": "highest_score_wins",
            "zoneValues": dict(values),
            "subtotals": subtotals,
            "total": sum(subtotals.values()),
        }
    return {
        "status": "canonical_scoring_ready",
        "impacts": classified,
        "zoneCounts": counts,
        "classifiedImpactCount": classified_count,
        "capturedImpactCount": len(classified),
        "reconciliation": reconciliation,
        "scoring": score,
        "authorityTrace": {
            "classificationAuthority": "backend",
            "targetId": scoring["targetId"],
            "variantId": scoring["variantId"],
            "geometryAuthorityId": scoring["geometryAuthorityId"],
            "coordinateSystemId": scoring["coordinateSystemId"],
            "canonicalAssetSha256": scoring["canonicalAssetSha256"],
            "scoringAuthorityId": scoring["scoringAuthorityId"],
        },
    }
