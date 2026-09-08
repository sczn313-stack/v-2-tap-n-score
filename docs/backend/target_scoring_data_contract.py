"""Validation for reusable target-scoring and interaction data.

This module validates behavior-shaped data before a Target Execution Contract
can enter the runtime catalog.  It contains no target or publisher identities.
"""
from __future__ import annotations

from numbers import Real
from typing import Any, Mapping, Sequence


SCHEMA_VERSION = "sczn3-target-scoring-data-v1"
MODEL_AGGREGATIONS = {
    "numeric_regions": "sum",
    "named_regions": "classification_counts",
    "penalty_regions": "sum",
    "ordered_objects": "ordered_progression",
    "multiple_bulls": "per_object_counts",
    "not_applicable": "none",
}
LAYOUT_MODELS = {"concentric_regions", "regions", "repeated_regions", "discrete_objects", "unstructured_evidence"}
AIM_MODES = {"fixed", "region_centers", "shooter_declared", "not_required"}


class TargetScoringDataContractError(ValueError):
    pass


def _number(value: Any, reason: str) -> float:
    if not isinstance(value, Real) or isinstance(value, bool):
        raise TargetScoringDataContractError(reason)
    number = float(value)
    if not 0 <= number <= 1:
        raise TargetScoringDataContractError(reason)
    return number


def _region(region: Any) -> str:
    if not isinstance(region, Mapping):
        raise TargetScoringDataContractError("scoring_region_invalid")
    region_id = str(region.get("regionId") or "").strip()
    if not region_id:
        raise TargetScoringDataContractError("scoring_region_identity_required")
    shape = region.get("shape")
    if shape == "circle":
        _number(region.get("cx"), "scoring_region_coordinate_invalid")
        _number(region.get("cy"), "scoring_region_coordinate_invalid")
        radius = _number(region.get("radius"), "scoring_region_radius_invalid")
        if radius <= 0:
            raise TargetScoringDataContractError("scoring_region_radius_invalid")
    elif shape == "ellipse":
        _number(region.get("cx"), "scoring_region_coordinate_invalid")
        _number(region.get("cy"), "scoring_region_coordinate_invalid")
        if _number(region.get("radiusX"), "scoring_region_radius_invalid") <= 0 or _number(region.get("radiusY"), "scoring_region_radius_invalid") <= 0:
            raise TargetScoringDataContractError("scoring_region_radius_invalid")
    elif shape == "rectangle":
        x0 = _number(region.get("xMin"), "scoring_region_coordinate_invalid")
        y0 = _number(region.get("yMin"), "scoring_region_coordinate_invalid")
        x1 = _number(region.get("xMax"), "scoring_region_coordinate_invalid")
        y1 = _number(region.get("yMax"), "scoring_region_coordinate_invalid")
        if x0 >= x1 or y0 >= y1:
            raise TargetScoringDataContractError("scoring_region_bounds_invalid")
    elif shape == "polygon":
        points = region.get("points")
        if not isinstance(points, Sequence) or isinstance(points, (str, bytes)) or len(points) < 3:
            raise TargetScoringDataContractError("scoring_region_polygon_invalid")
        for point in points:
            if not isinstance(point, Sequence) or isinstance(point, (str, bytes)) or len(point) != 2:
                raise TargetScoringDataContractError("scoring_region_polygon_invalid")
            _number(point[0], "scoring_region_coordinate_invalid")
            _number(point[1], "scoring_region_coordinate_invalid")
    else:
        raise TargetScoringDataContractError("scoring_region_shape_unsupported")
    if not isinstance(region.get("priority"), int):
        raise TargetScoringDataContractError("scoring_region_priority_required")
    return region_id


def _aim(interaction: Any, region_ids: set[str]) -> None:
    if not isinstance(interaction, Mapping) or interaction.get("observationInput") != "normalized_taps" or interaction.get("resultAction") != "show_result":
        raise TargetScoringDataContractError("target_scoring_interaction_invalid")
    aim = interaction.get("aim")
    if not isinstance(aim, Mapping) or aim.get("mode") not in AIM_MODES:
        raise TargetScoringDataContractError("target_scoring_aim_mode_invalid")
    points = aim.get("points") or []
    if not isinstance(points, list):
        raise TargetScoringDataContractError("target_scoring_aim_points_invalid")
    if aim["mode"] == "fixed" and len(points) != 1:
        raise TargetScoringDataContractError("target_scoring_fixed_aim_required")
    if aim["mode"] == "region_centers" and not points:
        raise TargetScoringDataContractError("target_scoring_region_aims_required")
    if aim["mode"] in {"shooter_declared", "not_required"} and points:
        raise TargetScoringDataContractError("target_scoring_aim_points_not_allowed")
    identities = set()
    for point in points:
        if not isinstance(point, Mapping):
            raise TargetScoringDataContractError("target_scoring_aim_point_invalid")
        aim_id = str(point.get("aimId") or "").strip()
        if not aim_id or aim_id in identities:
            raise TargetScoringDataContractError("target_scoring_aim_identity_invalid")
        identities.add(aim_id)
        _number(point.get("xNorm"), "target_scoring_aim_coordinate_invalid")
        _number(point.get("yNorm"), "target_scoring_aim_coordinate_invalid")
        region_id = str(point.get("regionId") or "").strip()
        if aim["mode"] == "region_centers" and region_id not in region_ids:
            raise TargetScoringDataContractError("target_scoring_aim_region_invalid")


def validate_target_scoring_data(contract: Mapping[str, Any]) -> None:
    if contract.get("missionFamily") != "targetScoring":
        return
    components = contract.get("components") or {}
    geometry = (components.get("geometry") or {}).get("definition")
    scoring = (components.get("scoring") or {}).get("definition")
    mission = (components.get("mission") or {}).get("definition")
    if not isinstance(geometry, Mapping) or not isinstance(scoring, Mapping) or not isinstance(mission, Mapping):
        raise TargetScoringDataContractError("target_scoring_components_required")
    if scoring.get("schemaVersion") != SCHEMA_VERSION:
        raise TargetScoringDataContractError("target_scoring_schema_version_invalid")
    model = str(scoring.get("model") or "")
    if model not in MODEL_AGGREGATIONS:
        raise TargetScoringDataContractError("target_scoring_model_unsupported")
    if geometry.get("layoutModel") not in LAYOUT_MODELS:
        raise TargetScoringDataContractError("target_scoring_layout_model_invalid")
    regions = geometry.get("regions")
    if not isinstance(regions, list):
        raise TargetScoringDataContractError("target_scoring_regions_invalid")
    region_ids = [_region(region) for region in regions]
    if len(region_ids) != len(set(region_ids)):
        raise TargetScoringDataContractError("target_scoring_region_identity_duplicate")
    region_id_set = set(region_ids)
    rules = scoring.get("regionRules")
    if not isinstance(rules, Mapping):
        raise TargetScoringDataContractError("target_scoring_region_rules_invalid")
    if model != "not_applicable" and (not regions or set(rules) != region_id_set or not isinstance(scoring.get("outsideRule"), Mapping)):
        raise TargetScoringDataContractError("target_scoring_region_rules_incomplete")
    aggregation = scoring.get("aggregation")
    if not isinstance(aggregation, Mapping) or aggregation.get("mode") != MODEL_AGGREGATIONS[model]:
        raise TargetScoringDataContractError("target_scoring_aggregation_invalid")
    if model in {"numeric_regions", "penalty_regions"}:
        values = [rule.get("value") for rule in rules.values()] + [scoring["outsideRule"].get("value")]
        if any(not isinstance(value, Real) or isinstance(value, bool) for value in values):
            raise TargetScoringDataContractError("target_scoring_numeric_value_required")
    if model in {"multiple_bulls", "ordered_objects"}:
        object_ids = [rule.get("objectId") for rule in rules.values()]
        if any(value is None or str(value).strip() == "" for value in object_ids):
            raise TargetScoringDataContractError("target_scoring_object_identity_invalid")
        if model == "ordered_objects":
            unique_object_ids = list(dict.fromkeys(str(value) for value in object_ids))
            sequence = aggregation.get("sequence")
            if not isinstance(sequence, list) or [str(value) for value in sequence] != unique_object_ids:
                raise TargetScoringDataContractError("target_scoring_sequence_invalid")
            if aggregation.get("mismatchBehavior") not in {"stop_progress", "restart_sequence"} or aggregation.get("completionBehavior") not in {"all_in_order", "shooter_declared"}:
                raise TargetScoringDataContractError("target_scoring_sequence_policy_invalid")
    if model == "not_applicable" and (scoring.get("status") != "not_applicable" or regions or rules or not str(scoring.get("reason") or "").strip()):
        raise TargetScoringDataContractError("target_scoring_not_applicable_invalid")
    _aim(mission.get("interaction"), region_id_set)
