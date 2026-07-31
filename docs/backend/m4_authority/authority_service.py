"""Reusable zeroing Shooter Experience Card authority service.

Target geometry, mission, sight rules, distance, and firearm profile are inputs.
Backend calculates. Frontend displays.
"""
from __future__ import annotations

import hashlib
import json
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .weapon_equipment_registry import (
    authority_model_from_record,
    resolve_proven_equipment_record,
)

MOA_INCHES_AT_100_YARDS = 1.047
MRAD_INCHES_AT_100_YARDS = 3.6
M4_BULL_AUTHORITY = {
    "authorityId": "M4-BULL-COORDINATE-AUTHORITY-2026-07-28",
    "status": "founder-approved",
    "xPercent": 50.0,
    "yPercent": 48.7,
    "coordinateSystem": "continuous-edge-origin-normalized-percent",
    "sourceDimensionsPx": {"width": 773, "height": 1000},
    "sourceCoordinatePx": {"x": 386.5, "y": 487.0},
    "toleranceSourcePx": {"x": 1.0, "y": 1.0},
    "sourceAssetSha256": "d7912799f7462335ed1487dd19c437e1cf9c749615136c9acd735cc20bc49bff",
    "validationReportSha256": "b9f0c485e01a03142d8b066bd208422f84a781b9dec218253ebf292784cec283",
    "founderApprovedDate": "2026-07-28",
    "scope": "normalized bull coordinate only",
}
M4_GEOMETRY = {
    "targetId": "M4_TARGET_AUTHORITY_v1_ORIGINAL",
    "imageWidth": 1024,
    "imageHeight": 1270,
    "gridLeftPx": 95,
    "gridTopPx": 147,
    "gridRightPx": 932,
    "gridBottomPx": 1012,
    "gridSquarePx": 59.8,
    "gridSquareInches": 1,
    "unit": "inch",
    "bullCoordinate": {
        "xPercent": M4_BULL_AUTHORITY["xPercent"],
        "yPercent": M4_BULL_AUTHORITY["yPercent"],
        "source": M4_BULL_AUTHORITY["authorityId"],
    },
}


def number(value: Any, fallback: Optional[float] = None) -> Optional[float]:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return fallback
    return result if math.isfinite(result) else fallback


def rounded(value: float, places: int = 4) -> float:
    return round(float(value), places)


def normalize_point(point: Any, default_id: str = "") -> Optional[Dict[str, Any]]:
    if not isinstance(point, dict):
        return None
    x = number(point.get("xPercent"))
    y = number(point.get("yPercent"))
    if x is None or y is None:
        return None
    result: Dict[str, Any] = {
        "xPercent": rounded(max(0, min(100, x))),
        "yPercent": rounded(max(0, min(100, y))),
    }
    result["shotId"] = str(point.get("shotId") or default_id)
    return result


def normalize_impacts(impacts: Any) -> List[Dict[str, Any]]:
    if not isinstance(impacts, list):
        return []
    return [
        point
        for point in (
            normalize_point(item, f"shot-{index}")
            for index, item in enumerate(impacts, start=1)
        )
        if point
    ]


def geometry_for(payload: Dict[str, Any]) -> Dict[str, Any]:
    supplied = payload.get("targetAuthorityGeometry")
    geometry = dict(M4_GEOMETRY)
    if isinstance(supplied, dict):
        geometry.update({key: value for key, value in supplied.items() if value is not None})
    # The M4 route consumes registered bull authority. A client payload may not
    # replace it with an implementation assumption or compatibility value.
    geometry["bullCoordinate"] = dict(M4_GEOMETRY["bullCoordinate"])
    geometry["targetId"] = str(payload.get("targetId") or geometry["targetId"])
    return geometry


def distance_yards(payload: Dict[str, Any]) -> float:
    distance = payload.get("distance") or {}
    if isinstance(distance, dict):
        value = number(distance.get("value"), 25) or 25
        unit = str(distance.get("unit") or "m").lower()
    else:
        value = number(distance, 25) or 25
        unit = "m"
    return max(1, value * 1.0936133 if unit.startswith("m") else value)


def grid_inches(point: Dict[str, Any], geometry: Dict[str, Any]) -> Dict[str, float]:
    x_px = (point["xPercent"] / 100) * float(geometry["imageWidth"])
    y_px = (point["yPercent"] / 100) * float(geometry["imageHeight"])
    scale = float(geometry.get("gridSquareInches", 1)) / float(geometry["gridSquarePx"])
    return {
        "xInches": rounded((x_px - float(geometry["gridLeftPx"])) * scale),
        "yInches": rounded((y_px - float(geometry["gridTopPx"])) * scale),
    }


def average_point(points: List[Dict[str, Any]]) -> Optional[Dict[str, float]]:
    if not points:
        return None
    return {
        "xPercent": rounded(sum(point["xPercent"] for point in points) / len(points)),
        "yPercent": rounded(sum(point["yPercent"] for point in points) / len(points)),
    }


def adjustment_model(payload: Dict[str, Any]) -> Dict[str, Any]:
    setup = payload.get("shooterSetup") if isinstance(payload.get("shooterSetup"), dict) else {}
    optic = setup.get("optic") if isinstance(setup.get("optic"), dict) else {}
    optic_type = str(optic.get("type") or setup.get("opticType") or "Iron Sights")
    requested = str(
        optic.get("adjustmentSystem")
        or setup.get("adjustmentSystem")
        or ("M4_IRON" if "iron" in optic_type.lower() else "OPTIC")
    ).upper()
    if requested.startswith("M4_IRON"):
        requested_authority_id = str(
            payload.get("equipmentAuthorityRecordId")
            or setup.get("equipmentAuthorityRecordId")
            or payload.get("mechanicalSightAuthorityId")
            or setup.get("mechanicalSightAuthorityId")
            or ""
        )
        authority_record = resolve_proven_equipment_record(
            requested_authority_id,
            requested,
        )
        authority = authority_model_from_record(authority_record) if authority_record else {}
        proven = bool(authority_record)
        return {
            "system": requested,
            "label": authority.get("label") or "Unspecified M4 iron sights",
            "unit": "MOA",
            "windagePerClick": authority.get("windagePerClick"),
            "elevationPerClick": authority.get("elevationPerClick"),
            "authorityStatus": "proven" if proven else "unproven",
            "authorityId": authority.get("authorityId"),
            "authoritySource": authority.get("sourceCitation"),
            "exactSightIdentity": authority.get("exactSightIdentity"),
            "roundingRule": authority.get("roundingRule"),
            "turnDirections": authority.get("turnDirections"),
            "equipmentAuthorityRecordId": authority.get("equipmentAuthorityRecordId"),
            "authorityRecord": authority.get("authorityRecord"),
        }
    authority = payload.get("mechanicalAuthority")
    if not isinstance(authority, dict):
        authority = setup.get("mechanicalAuthority")
    authority = authority if isinstance(authority, dict) else {}
    authority_status = str(authority.get("status") or "unproven").lower()
    proven = authority_status == "proven"
    unit = str(optic.get("adjustmentUnit") or setup.get("opticAdjustmentUnit") or "MOA").upper()
    unit = "MRAD" if unit == "MRAD" else "MOA"
    click_value = number(
        optic.get("clickValue")
        or setup.get("opticClickValue")
        or optic.get("clickValueMRAD" if unit == "MRAD" else "clickValueMOA")
    ) if proven else None
    return {
        "system": "OPTIC",
        "label": f"Optic · {click_value:g} {unit}/click" if click_value else f"{unit} optic",
        "unit": unit,
        "windagePerClick": click_value,
        "elevationPerClick": click_value,
        "authorityStatus": "proven" if proven and click_value else "unproven",
        "authoritySource": authority.get("source"),
        "turnDirections": authority.get("turnDirections"),
    }


def axis_clicks(moa: float, mrad: float, model: Dict[str, Any], axis: str) -> int:
    magnitude = mrad if model["unit"] == "MRAD" else moa
    return int(round(magnitude / float(model[f"{axis}PerClick"])))


def reconcile_click_axis(
    axis: str,
    moa: float,
    mrad: float,
    model: Dict[str, Any],
    displayed_clicks: int,
) -> Dict[str, Any]:
    unit = str(model.get("unit") or "").upper()
    angular_value = mrad if unit == "MRAD" else moa
    displayed_angular_value = rounded(angular_value, 2)
    click_constant = number(model.get(f"{axis}PerClick"))
    rounding_rule = str(model.get("roundingRule") or "")
    if click_constant is None or click_constant <= 0:
        return {
            "status": "mismatch",
            "axis": axis,
            "reason": "missing positive axis-specific click constant",
        }
    raw_clicks = angular_value / click_constant
    displayed_raw_clicks = displayed_angular_value / click_constant
    expected_clicks = int(round(raw_clicks))
    displayed_expected_clicks = int(round(displayed_raw_clicks))
    reconciled = (
        rounding_rule == "nearest-whole-click-half-to-even"
        and expected_clicks == displayed_clicks
        and displayed_expected_clicks == displayed_clicks
    )
    return {
        "status": "reconciled" if reconciled else "mismatch",
        "axis": axis,
        "chain": "measured offset → MOA/MRAD → sight constant → raw clicks → rounding → displayed clicks",
        "adjustmentUnit": unit,
        "angularValue": rounded(angular_value),
        "displayedAngularValue": displayed_angular_value,
        "clickConstant": rounded(click_constant),
        "rawClicks": rounded(raw_clicks),
        "displayedRawClicks": rounded(displayed_raw_clicks),
        "roundingRule": rounding_rule,
        "expectedClicks": expected_clicks,
        "displayedExpectedClicks": displayed_expected_clicks,
        "displayedClicks": displayed_clicks,
    }


def reconcile_click_calculation(
    angular: Dict[str, Any],
    model: Dict[str, Any],
    windage_clicks: int,
    elevation_clicks: int,
) -> Dict[str, Any]:
    axes = {
        "windage": reconcile_click_axis(
            "windage",
            float(angular["windageMOA"]),
            float(angular["windageMRAD"]),
            model,
            windage_clicks,
        ),
        "elevation": reconcile_click_axis(
            "elevation",
            float(angular["elevationMOA"]),
            float(angular["elevationMRAD"]),
            model,
            elevation_clicks,
        ),
    }
    reconciled = all(axis["status"] == "reconciled" for axis in axes.values())
    return {
        "status": "reconciled" if reconciled else "mismatch",
        "method": "m4-mechanical-calculation-reconciliation-v1",
        "axes": axes,
    }


def score_and_classify(
    aim: Optional[Dict[str, Any]],
    impacts: List[Dict[str, Any]],
    geometry: Dict[str, Any],
) -> Dict[str, Any]:
    result = {
        "value": None,
        "status": "unavailable",
        "method": "m4-authority-distance-v1",
        "perShot": [],
    }
    if not aim or not impacts:
        result["reason"] = "confirmed aim point and confirmed impacts required"
        return result
    aim_grid = grid_inches(aim, geometry)
    rows = []
    for impact in impacts:
        location = grid_inches(impact, geometry)
        x = rounded(location["xInches"] - aim_grid["xInches"])
        y = rounded(location["yInches"] - aim_grid["yInches"])
        distance = rounded(math.hypot(x, y))
        if distance <= 1:
            points, classification = 10, "CENTERED"
        elif distance <= 2:
            points, classification = 8, "NEAR AIM POINT"
        elif distance <= 4:
            points, classification = 6, "CORRECTION ZONE"
        elif distance <= 6:
            points, classification = 4, "OUTER GROUP"
        else:
            points, classification = 0, "OUTSIDE ZERO STANDARD"
        rows.append({
            "shotId": impact["shotId"],
            "xInches": x,
            "yInches": y,
            "distanceInches": distance,
            "points": points,
            "classification": classification,
        })
    possible = len(rows) * 10
    raw = sum(row["points"] for row in rows)
    value = int(round((raw / possible) * 100))
    if value >= 90:
        band = "excellent"
    elif value >= 80:
        band = "good"
    elif value >= 70:
        band = "developing"
    else:
        band = "corrective"
    result.update({
        "value": value,
        "band": band,
        "rawScore": raw,
        "possibleScore": possible,
        "status": "calculated",
        "perShot": rows,
    })
    return result


def group_measurement(impacts: List[Dict[str, Any]], geometry: Dict[str, Any], yards: float) -> Dict[str, Any]:
    if len(impacts) < 2:
        return {"status": "unavailable", "reason": "two confirmed impacts required"}
    points = [grid_inches(point, geometry) for point in impacts]
    spread = max(
        math.hypot(second["xInches"] - first["xInches"], second["yInches"] - first["yInches"])
        for index, first in enumerate(points)
        for second in points[index + 1:]
    )
    moa = spread / ((yards / 100) * MOA_INCHES_AT_100_YARDS)
    return {
        "status": "calculated",
        "diameterInches": rounded(spread),
        "valueMOA": rounded(moa, 2),
        "display": f'{spread:.2f}" · {moa:.2f} MOA',
        "method": "m4-authority-max-spread-v1",
    }


def stable_hash(payload: Dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def build_authority_package(payload: Dict[str, Any]) -> Dict[str, Any]:
    payload = payload if isinstance(payload, dict) else {}
    geometry = geometry_for(payload)
    aim = normalize_point(payload.get("aimCoordinate") or payload.get("aimPoint"), "aim")
    bull = normalize_point(geometry.get("bullCoordinate"), "registered-bull")
    impacts = normalize_impacts(payload.get("impactCoordinates") or payload.get("impactPoints"))
    yards = distance_yards(payload)
    model = adjustment_model(payload)
    poib = average_point(impacts)
    score = score_and_classify(aim, impacts, geometry)
    group = group_measurement(impacts, geometry, yards)
    correction = clicks = angular = vector = None
    calculation_reconciliation = {
        "status": "unavailable",
        "reason": "mechanical recommendation not calculated",
    }
    geometry_validation = {
        "status": "unavailable",
        "reason": "confirmed aim point and confirmed impacts required",
    }
    mechanical_validation = {
        "status": "unavailable",
        "reason": "mechanical sight authority is not independently proven",
        "model": model,
    }
    aim_discrepancy = {
        "status": "unavailable" if not aim or not bull else "measured",
        "judgment": "unavailable",
        "reason": "materiality tolerance is not founder-approved",
    }

    if aim and bull:
        aim_grid = grid_inches(aim, geometry)
        bull_grid = grid_inches(bull, geometry)
        discrepancy_x = rounded(aim_grid["xInches"] - bull_grid["xInches"])
        discrepancy_y = rounded(aim_grid["yInches"] - bull_grid["yInches"])
        aim_discrepancy.update({
            "aimMinusBullInches": {"x": discrepancy_x, "y": discrepancy_y},
            "magnitudeInches": rounded(math.hypot(discrepancy_x, discrepancy_y)),
        })

    if aim and poib:
        aim_grid = grid_inches(aim, geometry)
        poib_grid = grid_inches(poib, geometry)
        impact_x = rounded(poib_grid["xInches"] - aim_grid["xInches"])
        impact_y = rounded(poib_grid["yInches"] - aim_grid["yInches"])
        correction_x = rounded(-impact_x)
        correction_y = rounded(-impact_y)
        windage_moa = abs(correction_x) / ((yards / 100) * MOA_INCHES_AT_100_YARDS)
        elevation_moa = abs(correction_y) / ((yards / 100) * MOA_INCHES_AT_100_YARDS)
        windage_mrad = abs(correction_x) / ((yards / 100) * MRAD_INCHES_AT_100_YARDS)
        elevation_mrad = abs(correction_y) / ((yards / 100) * MRAD_INCHES_AT_100_YARDS)
        windage_direction = "RIGHT" if correction_x > 0 else "LEFT" if correction_x < 0 else "CENTER"
        elevation_direction = "DOWN" if correction_y > 0 else "UP" if correction_y < 0 else "CENTER"
        correction = {
            "impactOffsetInches": {"x": impact_x, "y": impact_y},
            "aimMinusPOIBInches": {"x": correction_x, "y": correction_y},
            "windageDirection": windage_direction,
            "elevationDirection": elevation_direction,
            "windage": None,
            "elevation": None,
        }
        angular = {
            "windageMOA": rounded(windage_moa),
            "elevationMOA": rounded(elevation_moa),
            "windageMRAD": rounded(windage_mrad),
            "elevationMRAD": rounded(elevation_mrad),
        }
        vector = {"start": poib, "end": aim, "intent": "POIB_TO_CONFIRMED_AIM"}
        geometry_validation = {
            "status": "calculated",
            "method": "confirmed-aim-minus-confirmed-poib-v1",
            "vectorStart": "POIB",
            "vectorEnd": "CONFIRMED_AIM_POINT",
            "physicalDisplacementInches": {"x": correction_x, "y": correction_y},
            "magnitudeInches": rounded(math.hypot(correction_x, correction_y)),
        }
        if model.get("authorityStatus") == "proven":
            windage_clicks = axis_clicks(windage_moa, windage_mrad, model, "windage")
            elevation_clicks = axis_clicks(elevation_moa, elevation_mrad, model, "elevation")
            turn_directions = model.get("turnDirections") or {}
            windage_turn = (turn_directions.get("windage") or {}).get(windage_direction)
            elevation_turn = (turn_directions.get("elevation") or {}).get(elevation_direction)
            correction["windage"] = f"{windage_clicks} clicks {windage_direction}"
            correction["elevation"] = f"{elevation_clicks} clicks {elevation_direction}"
            clicks = {
                "windageClicks": windage_clicks,
                "elevationClicks": elevation_clicks,
                "windageDirection": windage_direction,
                "elevationDirection": elevation_direction,
                "windageTurnDirection": windage_turn,
                "elevationTurnDirection": elevation_turn,
                "model": model,
            }
            calculation_reconciliation = reconcile_click_calculation(
                angular,
                model,
                windage_clicks,
                elevation_clicks,
            )
            if calculation_reconciliation["status"] == "reconciled":
                mechanical_validation = {
                    "status": "calculated",
                    "method": "registered-sight-mechanics-v1",
                    "calculationReconciliation": "reconciled",
                    "model": model,
                }
            else:
                correction["windage"] = None
                correction["elevation"] = None
                clicks = None
                mechanical_validation = {
                    "status": "failed",
                    "reason": "mechanical calculation chain did not reconcile",
                    "calculationReconciliation": "mismatch",
                    "model": model,
                }

    phase = str(payload.get("phase") or "initial").lower()
    mission = payload.get("zeroingMission") if isinstance(payload.get("zeroingMission"), dict) else {}
    validation = {"status": "not-requested", "outcome": "PENDING"}
    if phase == "confirmation":
        minimum_shots = int(number(mission.get("confirmationMinimumShots"), 3) or 3)
        tolerance = number(mission.get("confirmationResidualToleranceInches"), 1.0) or 1.0
        residual = math.hypot(
            correction["impactOffsetInches"]["x"],
            correction["impactOffsetInches"]["y"],
        ) if correction else None
        mechanical_chain_valid = (
            model.get("authorityStatus") != "proven"
            or calculation_reconciliation.get("status") == "reconciled"
        )
        confirmed = (
            len(impacts) >= minimum_shots
            and residual is not None
            and residual <= tolerance
            and mechanical_chain_valid
        )
        validation = {
            "status": (
                "calculated"
                if correction and mechanical_chain_valid
                else "integrity-failed"
                if correction
                else "unavailable"
            ),
            "outcome": (
                "CONFIRMED"
                if confirmed
                else "CALCULATION INTEGRITY FAILED"
                if correction and not mechanical_chain_valid
                else "REQUIRES ADDITIONAL CORRECTION"
            ),
            "confirmed": confirmed,
            "minimumShotsMet": len(impacts) >= minimum_shots,
            "residualOffsetInches": rounded(residual) if residual is not None else None,
            "standard": f"{minimum_shots}+ confirmed shots; POIB within {tolerance:.2f} inch of confirmed aim point",
            "method": "zeroing-confirmation-authority-v1",
        }

    shot_ids = [impact["shotId"] for impact in impacts]
    core = {
        "authorityVersion": "sczn3-m4-authority-v1",
        "target": {
            "targetId": geometry["targetId"],
            "targetName": payload.get("targetName") or "Zeroing target",
        },
        "zeroingMission": mission,
        "phase": phase,
        "inputs": {
            "aimCoordinate": aim,
            "confirmedAimPoint": aim,
            "registeredBullCoordinate": bull,
            "impactCoordinates": impacts,
            "distanceYards": rounded(yards),
            "shooterSetup": payload.get("shooterSetup") or {},
        },
        "poib": poib,
        "groupCenter": poib,
        "group": group,
        "score": score,
        "correction": correction,
        "clicks": clicks,
        "angular": angular,
        "vectors": {"poibToConfirmedAim": vector} if vector else {},
        "aimPointDiscrepancy": aim_discrepancy,
        "geometryValidation": geometry_validation,
        "mechanicalValidation": mechanical_validation,
        "calculationReconciliation": calculation_reconciliation,
        "validation": validation,
        "renderCoordinates": {"aim": aim, "bull": bull, "impacts": impacts, "poib": poib, "vector": vector},
        "confirmedAimPointAuthority": {
            "status": "confirmed" if aim else "unavailable",
            "coordinate": aim,
            "source": "shooter-selected-session-evidence" if aim else None,
            "method": "confirmed-aim-point-v1" if aim else None,
        },
        "bullCoordinateAuthority": dict(M4_BULL_AUTHORITY),
        "mechanicalSightAuthority": model.get("authorityRecord")
        if model.get("authorityStatus") == "proven"
        else {
            "status": "unavailable",
            "reason": "exact registered sight configuration required",
            "requestedSystem": model.get("system"),
            "requestedEquipmentAuthorityRecordId": model.get("equipmentAuthorityRecordId"),
        },
        "geometryMetadata": geometry,
        "lineage": {
            "sourceShotIds": shot_ids,
            "poibDerivedFrom": shot_ids,
            "confirmedAimPointDerivedFrom": ["session-aim-evidence"] if aim else [],
            "correctionDerivedFrom": ["confirmed-aim-point", "poib"] if aim and poib else [],
            "aimPointDiscrepancyDerivedFrom": ["aim", "registered-bull"] if aim and bull else [],
            "validationDerivedFrom": shot_ids if phase == "confirmation" else [],
        },
        "status": {
            "hasAim": aim is not None,
            "hasConfirmedAim": aim is not None,
            "hasRegisteredBull": bull is not None,
            "impactCount": len(impacts),
            "hasPOIB": poib is not None,
            "hasCorrection": correction is not None,
            "hasMechanicalRecommendation": clicks is not None,
        },
    }
    core["evidenceHash"] = stable_hash(core)
    core["computedAt"] = datetime.now(timezone.utc).isoformat()
    return core
