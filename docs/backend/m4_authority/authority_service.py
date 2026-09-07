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

try:
    from authority_service import apply_precision_tap_registration, source_photo_render_coordinates
    from mechanical_quantization import ROUNDING_RULE, nearest_click_half_to_even, quantize_mechanical_axis
    from mfam_family_authority import MFAMAuthorityError, resolve_target_profile as resolve_mfam_target_profile
    from target_image_registration_authority import canonical_point_to_source_percent, directional_source_reconciliation
except ModuleNotFoundError:  # Package import used by the Python/JavaScript parity harness.
    from backend.authority_service import apply_precision_tap_registration, source_photo_render_coordinates
    from backend.mechanical_quantization import ROUNDING_RULE, nearest_click_half_to_even, quantize_mechanical_axis
    from backend.mfam_family_authority import MFAMAuthorityError, resolve_target_profile as resolve_mfam_target_profile
    from backend.target_image_registration_authority import canonical_point_to_source_percent, directional_source_reconciliation

from .weapon_equipment_registry import (
    authority_model_from_adjustment_profile,
    authority_model_from_record,
    get_adjustment_profile,
    resolve_proven_equipment_record,
)

MOA_INCHES_AT_100_YARDS = 1.047
MRAD_INCHES_AT_100_YARDS = 3.6
M4_BULL_AUTHORITY = {
    "authorityId": "M4-M16-25M-BULL-AUTHORITY-2026-09-01",
    "status": "founder-approved",
    "xPercent": 50.0,
    "yPercent": 43.181818,
    "coordinateSystem": "continuous-edge-origin-normalized-percent",
    "sourceDimensionsPx": {"width": 2550, "height": 3300},
    "sourceCoordinatePx": {"x": 1275.0, "y": 1425.0},
    "toleranceSourcePx": {"x": 1.0, "y": 1.0},
    "sourceAssetSha256": "e2be00e15b82b8f775fcb0934aaac7413ee44abcb53df29e44f07ac2c2b25b70",
    "validatedPresentationSha256": "a562a0f5ce3e0c3ffd2ad3fbd886aed277dad82d99bd37edf8d6bed380b2b9d4",
    "founderApprovedDate": "2026-09-01",
    "scope": "M4/M16 Series Weapons 25M Zero canonical bull coordinate only",
}
M4_GEOMETRY = {
    "targetId": "M4_M16_25M_ZERO_AUTHORITY_v1",
    "imageWidth": 2550,
    "imageHeight": 3300,
    "gridLeftPx": 75,
    "gridTopPx": 225,
    "gridRightPx": 2475,
    "gridBottomPx": 2625,
    "gridSquarePx": 300,
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


def governed_family_context(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Resolve family authority independently from publisher representation identity."""
    target_profile_id = str(payload.get("targetProfileId") or payload.get("target_profile_id") or "").lower()
    if not target_profile_id:
        return None
    try:
        resolved = resolve_mfam_target_profile(target_profile_id)
    except MFAMAuthorityError:
        return None
    package = resolved.get("familyAuthorityPackage")
    representation = resolved.get("binding", {}).get("canonicalRepresentationAuthority")
    if not isinstance(package, dict) or not isinstance(representation, dict):
        return None
    return {"resolved": resolved, "package": package, "representation": representation}


def geometry_for(payload: Dict[str, Any]) -> Dict[str, Any]:
    context = governed_family_context(payload)
    if context:
        package = context["package"]
        representation = context["representation"]
        family_geometry = package["geometryAuthority"]
        aim = representation["aimCoordinate"]
        square = family_geometry["square"]
        square_inches = float(square["value"]) / 2.54 if str(square["unit"]).upper() == "CM" else float(square["value"])
        return {
            "targetId": representation["targetId"],
            "imageWidth": representation["imageWidth"],
            "imageHeight": representation["imageHeight"],
            "gridLeftPx": representation["gridLeftPx"],
            "gridTopPx": representation["gridTopPx"],
            "gridRightPx": representation["gridRightPx"],
            "gridBottomPx": representation["gridBottomPx"],
            "gridColumns": family_geometry["columns"],
            "gridRows": family_geometry["rows"],
            "gridSquareXPx": representation["gridSquareXPx"],
            "gridSquareYPx": representation["gridSquareYPx"],
            "gridSquarePx": representation["gridSquareXPx"],
            "gridSquareInches": square_inches,
            "unit": "inch",
            "authorityOwner": package["familyAuthorityPackageId"],
            "authorityVersion": package["authorityVersion"],
            "familyId": package["familyId"],
            "familyGeometryAuthorityId": family_geometry["authorityId"],
            "bullAuthority": {
                "authorityId": representation["aimAuthorityId"],
                "status": "registered-production-face",
                "xPercent": aim["xPercent"],
                "yPercent": aim["yPercent"],
                "coordinateSystem": "continuous-edge-origin-normalized-percent",
                "sourceDimensionsPx": {
                    "width": representation["imageWidth"],
                    "height": representation["imageHeight"],
                },
                "sourceCoordinatePx": {
                    "x": float(representation["imageWidth"]) * float(aim["xPercent"]) / 100,
                    "y": float(representation["imageHeight"]) * float(aim["yPercent"]) / 100,
                },
                "sourceAssetSha256": representation["sourceAssetSha256"],
                "scope": "exact registered representation aim reference",
            },
            "bullCoordinate": {
                "xPercent": aim["xPercent"],
                "yPercent": aim["yPercent"],
                "source": representation["aimAuthorityId"],
            },
        }
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
    scale_x = float(geometry.get("gridSquareInches", 1)) / float(geometry.get("gridSquareXPx") or geometry["gridSquarePx"])
    scale_y = float(geometry.get("gridSquareInches", 1)) / float(geometry.get("gridSquareYPx") or geometry["gridSquarePx"])
    return {
        "xInches": rounded((x_px - float(geometry["gridLeftPx"])) * scale_x),
        "yInches": rounded((y_px - float(geometry["gridTopPx"])) * scale_y),
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
    if requested.startswith("M16A2_IRON"):
        requested_profile_id = str(
            payload.get("adjustmentProfileId")
            or setup.get("adjustmentProfileId")
            or ""
        )
        profile = get_adjustment_profile(requested_profile_id)
        family_context = governed_family_context(payload)
        allowed_profile_ids = set(
            family_context["package"].get("mechanicalAuthorityIds") or []
        ) if family_context else set()
        authority = authority_model_from_adjustment_profile(profile) if (
            profile
            and requested_profile_id in allowed_profile_ids
            and str(profile.get("status") or "").lower() == "proven"
            and str(profile.get("adjustmentSystem") or "").upper() == requested
        ) else {}
        proven = bool(authority)
        return {
            "system": requested,
            "label": authority.get("label") or "Unspecified M16A2 iron sights",
            "unit": authority.get("unit") or "MOA",
            "windagePerClick": authority.get("windagePerClick"),
            "elevationPerClick": authority.get("elevationPerClick"),
            "authorityStatus": "proven" if proven else "unproven",
            "authorityId": authority.get("authorityId"),
            "authoritySource": authority.get("authoritySource"),
            "roundingRule": authority.get("roundingRule"),
            "turnDirections": authority.get("turnDirections"),
            "adjustmentProfileId": authority.get("adjustmentProfileId"),
            "equipmentConfigurationId": authority.get("equipmentConfigurationId"),
            "authorityRecord": authority.get("authorityRecord"),
        }
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
    return nearest_click_half_to_even(magnitude / float(model[f"{axis}PerClick"]))


def registration_claim_sufficiency(
    registration: Optional[Dict[str, Any]],
    aim: Optional[Dict[str, Any]],
    poib: Optional[Dict[str, Any]],
    geometry: Dict[str, Any],
    yards: float,
    model: Dict[str, Any],
    phase: str,
    mission: Dict[str, Any],
) -> Dict[str, Any]:
    """Decide whether registered photo uncertainty can change mechanical instructions."""
    owner = geometry.get("authorityOwner") or "m4-zeroing-authority"
    if not registration:
        return {"status": "not_applicable", "owner": owner}
    orientation = registration.get("orientationEvidence") or {}
    if orientation.get("requiredForGovernedDirection") and orientation.get("status") != "proven":
        return {
            "status": "insufficient",
            "owner": owner,
            "reason": "target_orientation_unverified",
            "orientationEvidence": orientation,
        }
    observations = registration.get("canonicalObservations") or []
    if (
        registration.get("knowledgeState") not in ("exact", "estimated")
        or not aim
        or not poib
        or not observations
        or any(item.get("registeredCoverageStatus") != "supported" for item in observations)
    ):
        return {
            "status": "insufficient",
            "owner": owner,
            "reason": "registered_observations_incomplete",
        }
    if model.get("authorityStatus") != "proven":
        return {
            "status": "sufficient_for_geometry_only",
            "owner": owner,
            "reason": "registered_mechanical_sight_authority_required_for_clicks",
        }

    maximum_uncertainty_px = max(float(item.get("localUncertaintyPx") or 0) for item in observations)
    combined_uncertainty_inches = (
        maximum_uncertainty_px
        * 2
        * float(geometry.get("gridSquareInches", 1))
        / min(float(geometry.get("gridSquareXPx") or geometry["gridSquarePx"]), float(geometry.get("gridSquareYPx") or geometry["gridSquarePx"]))
    )
    aim_grid = grid_inches(aim, geometry)
    poib_grid = grid_inches(poib, geometry)
    axis_assessments: Dict[str, Any] = {}
    governed = True
    for axis, coordinate, moa_inches, mrad_inches in (
        ("windage", "xInches", MOA_INCHES_AT_100_YARDS, MRAD_INCHES_AT_100_YARDS),
        ("elevation", "yInches", MOA_INCHES_AT_100_YARDS, MRAD_INCHES_AT_100_YARDS),
    ):
        signed_offset = aim_grid[coordinate] - poib_grid[coordinate]
        angular_scale = (yards / 100) * (mrad_inches if model["unit"] == "MRAD" else moa_inches)
        angular_per_click = float(model[f"{axis}PerClick"])
        quantization = quantize_mechanical_axis(
            signed_offset / angular_scale / angular_per_click,
            combined_uncertainty_inches / angular_scale / angular_per_click,
        )
        governed = governed and quantization["status"] == "released"
        candidates = quantization["signedClickCandidates"]
        axis_assessments[axis] = {
            "status": "stable" if len(candidates) == 1 else "bounded_adjacent" if quantization["status"] == "released" else "excessive",
            "signedClickCandidates": candidates,
            "quantization": quantization,
        }
    confirmation_assessment = {"status": "not_applicable"}
    confirmation_stable = True
    if phase == "confirmation":
        residual = math.hypot(
            aim_grid["xInches"] - poib_grid["xInches"],
            aim_grid["yInches"] - poib_grid["yInches"],
        )
        tolerance = number(mission.get("confirmationResidualToleranceInches"), 1.0) or 1.0
        radial_uncertainty = math.sqrt(2) * combined_uncertainty_inches
        minimum_residual = max(0.0, residual - radial_uncertainty)
        maximum_residual = residual + radial_uncertainty
        confirmation_stable = maximum_residual <= tolerance or minimum_residual > tolerance
        confirmation_assessment = {
            "status": "stable" if confirmation_stable else "ambiguous",
            "minimumResidualInches": rounded(minimum_residual),
            "maximumResidualInches": rounded(maximum_residual),
            "toleranceInches": rounded(tolerance),
        }
    sufficient_for_claim = governed or (phase == "confirmation" and confirmation_stable)
    return {
        "status": (
            "sufficient"
            if governed
            else "sufficient_for_confirmation"
            if phase == "confirmation" and confirmation_stable
            else "insufficient"
        ),
        "owner": owner,
        "reason": None if sufficient_for_claim else "mechanical_quantization_uncertainty_exceeds_governed_policy",
        "knowledgeState": registration.get("knowledgeState"),
        "maximumLocalUncertaintyPx": rounded(maximum_uncertainty_px),
        "combinedAxisUncertaintyInches": rounded(combined_uncertainty_inches),
        "axisAssessments": axis_assessments,
        "confirmationAssessment": confirmation_assessment,
    }


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
    expected_clicks = nearest_click_half_to_even(raw_clicks)
    displayed_expected_clicks = nearest_click_half_to_even(displayed_raw_clicks)
    reconciled = (
        rounding_rule == ROUNDING_RULE
        and expected_clicks == displayed_clicks
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
    payload, registration_evidence = apply_precision_tap_registration(payload)
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
    mission = dict(payload.get("zeroingMission")) if isinstance(payload.get("zeroingMission"), dict) else {}
    family_context = governed_family_context(payload)
    if family_context:
        confirmation_authority = family_context["package"]["confirmationAuthority"]
        mission.update({
            "confirmationAuthorityId": confirmation_authority["authorityId"],
            "confirmationMinimumShots": confirmation_authority["minimumShots"],
            "confirmationResidualToleranceInches": confirmation_authority["residualTolerance"]["value"],
            "confirmationEvidenceRequirement": confirmation_authority["evidenceRequirement"],
        })
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

    registration_sufficiency = registration_claim_sufficiency(
        registration_evidence,
        aim,
        poib,
        geometry,
        yards,
        model,
        phase,
        mission,
    )
    correction_estimate = None
    quantization_withheld = registration_sufficiency.get("status") == "insufficient"
    if quantization_withheld and clicks:
        correction_estimate = {
            "status": "best_estimate_exact_click_count_withheld",
            "truthLabel": "Best estimate — exact click count withheld",
            "correction": correction,
            "clicks": clicks,
            "angular": angular,
            "axisAssessments": registration_sufficiency.get("axisAssessments") or {},
        }
        clicks = None
        correction["windage"] = None
        correction["elevation"] = None
        mechanical_validation = {
            "status": "unavailable",
            "reason": registration_sufficiency.get("reason"),
            "model": model,
        }
    elif clicks and registration_evidence:
        quantization = {
            axis: assessment.get("quantization")
            for axis, assessment in registration_sufficiency.get("axisAssessments", {}).items()
        }
        clicks["quantization"] = quantization
        mechanical_validation["quantizationPolicy"] = quantization
        mechanical_validation["registrationUncertaintyPreserved"] = True
    if (
        phase == "confirmation"
        and registration_sufficiency.get("confirmationAssessment", {}).get("status") == "ambiguous"
    ):
        validation = {
            "status": "authority-unavailable",
            "outcome": "CONFIRMATION DECISION UNAVAILABLE",
            "confirmed": None,
            "reason": "registration_uncertainty_could_change_confirmation_outcome",
            "method": "zeroing-confirmation-authority-v1",
        }

    if registration_evidence:
        render_coordinates = source_photo_render_coordinates(
            registration_evidence,
            aim,
            impacts,
            poib,
            geometry,
        )
        render_coordinates["bull"] = canonical_point_to_source_percent(registration_evidence, bull)
    else:
        render_coordinates = {"aim": aim, "bull": bull, "impacts": impacts, "poib": poib, "vector": vector}

    directional_reconciliation = directional_source_reconciliation(
        registration_evidence,
        aim,
        poib,
        render_coordinates,
        correction,
    )
    if registration_evidence and directional_reconciliation.get("status") != "reconciled":
        registration_sufficiency = {
            **registration_sufficiency,
            "status": "insufficient",
            "owner": registration_sufficiency.get("owner"),
            "reason": registration_sufficiency.get("reason") or "source_direction_reconciliation_failed",
            "orientationEvidence": registration_evidence.get("orientationEvidence") or {},
            "directionalReconciliation": directional_reconciliation,
        }
    audit_correction = dict(correction) if correction else None
    audit_clicks = dict(clicks) if clicks else None
    audit_angular = dict(angular) if angular else None
    audit_vector = dict(vector) if vector else None
    shooter_guidance = None
    hard_withhold = registration_sufficiency.get("reason") in {
        "target_orientation_unverified",
        "source_direction_reconciliation_failed",
    }
    if hard_withhold:
        correction = None
        clicks = None
        angular = None
        vector = None
        correction_estimate = None
        render_coordinates["vector"] = None
        mechanical_validation = {
            "status": "unavailable",
            "reason": registration_sufficiency.get("reason"),
            "model": model,
        }
        calculation_reconciliation = {
            "status": "unavailable",
            "reason": registration_sufficiency.get("reason"),
        }
        geometry_validation = {
            "status": "authority-withheld",
            "reason": registration_sufficiency.get("reason"),
        }
        shooter_guidance = {
            "status": "authority_withheld",
            "reason": registration_sufficiency.get("reason"),
            "message": (
                "TARGET ORIENTATION UNVERIFIED. This photo does not match the exact selected target face for this session, or its identifying top and bottom landmarks could not be proven. Check the target identity before taking another photo."
                if registration_sufficiency.get("reason") == "target_orientation_unverified"
                else "The directional correction was withheld because the source photograph and governed result did not reconcile."
            ),
        }
        if phase == "confirmation":
            validation = {
                "status": "authority-unavailable",
                "outcome": "CONFIRMATION DECISION UNAVAILABLE",
                "confirmed": None,
                "reason": registration_sufficiency.get("reason"),
                "method": "zeroing-confirmation-authority-v1",
            }

    shot_ids = [impact["shotId"] for impact in impacts]
    target_profile_id = str(payload.get("targetProfileId") or payload.get("target_profile_id") or "m4_25m_zero").lower()
    bull_authority = geometry.get("bullAuthority") or M4_BULL_AUTHORITY
    core = {
        "target_profile_id": target_profile_id,
        "targetProfileId": target_profile_id,
        "mission_family": "zeroingCorrection",
        "missionFamilyId": "zeroingCorrection",
        "resultPackageType": "zeroCorrectionResult",
        "authorityVersion": geometry.get("authorityVersion") or "sczn3-m4-authority-v1",
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
        "renderCoordinates": render_coordinates,
        "targetImageRegistrationEvidence": registration_evidence,
        "registrationClaimSufficiency": registration_sufficiency,
        "directionalReconciliation": directional_reconciliation,
        "authorityAuditEnvelope": {
            "schemaVersion": "sczn3-directional-authority-audit-v1",
            "sourceEvidence": directional_reconciliation.get("sourcePlane"),
            "registration": {
                "registrationEvidenceId": registration_evidence.get("registrationEvidenceId") if registration_evidence else None,
                "registrationEvidenceHash": registration_evidence.get("registrationEvidenceHash") if registration_evidence else None,
                "sourceToCanonicalMatrix": registration_evidence.get("sourceToCanonicalMatrix") if registration_evidence else None,
                "orientationEvidence": registration_evidence.get("orientationEvidence") if registration_evidence else None,
            },
            "canonicalObservations": registration_evidence.get("canonicalObservations") if registration_evidence else [],
            "canonicalPOIB": poib,
            "canonicalAim": aim,
            "canonicalVector": audit_vector,
            "applicableAuthority": model,
            "calculatedCorrection": audit_correction,
            "calculatedClicks": audit_clicks,
            "calculatedAngular": audit_angular,
            "mechanicalQuantization": clicks.get("quantization") if clicks else None,
            "projectedResult": directional_reconciliation.get("projectedResult"),
            "releaseStatus": "withheld" if hard_withhold else "released",
        } if registration_evidence else None,
        "correctionEstimate": correction_estimate,
        "shooterGuidance": shooter_guidance,
        "confirmedAimPointAuthority": {
            "status": "confirmed" if aim else "unavailable",
            "coordinate": aim,
            "source": "shooter-selected-session-evidence" if aim else None,
            "method": "confirmed-aim-point-v1" if aim else None,
        },
        "bullCoordinateAuthority": dict(bull_authority),
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
            "hasCorrectionEstimate": correction_estimate is not None,
        },
    }
    core["evidenceHash"] = stable_hash(core)
    core["computedAt"] = datetime.now(timezone.utc).isoformat()
    return core
