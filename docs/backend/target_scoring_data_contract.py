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
    "mixed_regions": "sum_and_classification_counts",
    "named_regions": "classification_counts",
    "penalty_regions": "sum",
    "ordered_objects": "ordered_progression",
    "multiple_bulls": "per_object_counts",
    "not_applicable": "none",
}
LAYOUT_MODELS = {"concentric_regions", "regions", "repeated_regions", "discrete_objects", "unstructured_evidence"}
AIM_MODES = {"fixed", "region_centers", "shooter_declared", "not_required"}
BOUNDARY_POLICY_MODES = {"authority_scoring_gauge"}
PARTICIPANT_AGGREGATION_MODES = {"owned_object_totals"}
OBJECT_SCOREBOARD_MODES = {"score_x"}
COUNTED_HIT_POLICY_MODES = {"per_object_cap"}
SCORING_MODE_POLICY_MODES = {"shooter_selected_region_values"}


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
    elif shape == "rounded_rectangle":
        x0 = _number(region.get("xMin"), "scoring_region_coordinate_invalid")
        y0 = _number(region.get("yMin"), "scoring_region_coordinate_invalid")
        x1 = _number(region.get("xMax"), "scoring_region_coordinate_invalid")
        y1 = _number(region.get("yMax"), "scoring_region_coordinate_invalid")
        rx = _number(region.get("cornerRadiusX"), "scoring_region_radius_invalid")
        ry = _number(region.get("cornerRadiusY"), "scoring_region_radius_invalid")
        if x0 >= x1 or y0 >= y1 or rx <= 0 or ry <= 0 or rx * 2 > x1 - x0 + 1e-9 or ry * 2 > y1 - y0 + 1e-9:
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


def _boundary_policy(scoring: Mapping[str, Any], regions: Sequence[Mapping[str, Any]]) -> None:
    policy = scoring.get("boundaryPolicy")
    if policy is None:
        return
    if not isinstance(policy, Mapping) or policy.get("mode") not in BOUNDARY_POLICY_MODES:
        raise TargetScoringDataContractError("target_scoring_boundary_policy_invalid")
    if policy.get("lineTouchRule") != "higher_value" or policy.get("materialFact") != "caliber":
        raise TargetScoringDataContractError("target_scoring_boundary_policy_rule_invalid")
    if policy.get("selectionRule") != "request_only_if_score_material":
        raise TargetScoringDataContractError("target_scoring_boundary_policy_selection_invalid")
    if scoring.get("model") not in {"numeric_regions", "penalty_regions", "mixed_regions"}:
        raise TargetScoringDataContractError("target_scoring_boundary_policy_model_invalid")
    authority = policy.get("authority")
    if not isinstance(authority, Mapping) or not all(str(authority.get(field) or "").strip() for field in ("source", "section", "rule")):
        raise TargetScoringDataContractError("target_scoring_boundary_policy_authority_required")
    groups = policy.get("authorizedGaugeGroups")
    if not isinstance(groups, list) or not groups:
        raise TargetScoringDataContractError("target_scoring_gauge_groups_required")
    group_ids: set[str] = set()
    aliases: set[str] = set()
    for group in groups:
        if not isinstance(group, Mapping):
            raise TargetScoringDataContractError("target_scoring_gauge_group_invalid")
        group_id = str(group.get("caliberId") or "").strip()
        group_aliases = group.get("aliases")
        diameter_range = group.get("diameterRangeInches")
        if not group_id or group_id in group_ids or not isinstance(group_aliases, list) or not group_aliases:
            raise TargetScoringDataContractError("target_scoring_gauge_group_invalid")
        if not isinstance(diameter_range, Mapping):
            raise TargetScoringDataContractError("target_scoring_gauge_range_invalid")
        minimum, maximum = diameter_range.get("min"), diameter_range.get("max")
        if not isinstance(minimum, Real) or isinstance(minimum, bool) or not isinstance(maximum, Real) or isinstance(maximum, bool):
            raise TargetScoringDataContractError("target_scoring_gauge_range_invalid")
        if not 0.05 <= float(minimum) <= float(maximum) <= 1.0:
            raise TargetScoringDataContractError("target_scoring_gauge_range_invalid")
        normalized_aliases = {str(alias or "").strip().casefold() for alias in group_aliases}
        if "" in normalized_aliases or aliases.intersection(normalized_aliases):
            raise TargetScoringDataContractError("target_scoring_gauge_alias_invalid")
        group_ids.add(group_id)
        aliases.update(normalized_aliases)
    rules = scoring.get("regionRules") or {}
    ordered = sorted(regions, key=lambda region: int(region.get("priority", 0)), reverse=True)
    ordered_values = [float(rules[region["regionId"]]["value"]) for region in ordered]
    if ordered_values != sorted(ordered_values, reverse=True):
        raise TargetScoringDataContractError("target_scoring_boundary_priority_must_follow_higher_value")


def _participant_aggregation(scoring: Mapping[str, Any], object_ids: set[str], interaction: Mapping[str, Any]) -> None:
    policy = scoring.get("participantAggregation")
    course = interaction.get("participantCourse") if isinstance(interaction, Mapping) else None
    if policy is None:
        if course is not None:
            raise TargetScoringDataContractError("target_scoring_participant_policy_required")
        return
    if not isinstance(policy, Mapping) or policy.get("mode") not in PARTICIPANT_AGGREGATION_MODES:
        raise TargetScoringDataContractError("target_scoring_participant_aggregation_invalid")
    participants = policy.get("participants")
    objects = policy.get("objects")
    if not isinstance(participants, list) or len(participants) < 2 or not isinstance(objects, list) or not objects:
        raise TargetScoringDataContractError("target_scoring_participant_structure_invalid")
    participant_ids = [str(item.get("participantId") or "").strip() for item in participants if isinstance(item, Mapping)]
    if len(participant_ids) != len(participants) or any(not value for value in participant_ids) or len(set(participant_ids)) != len(participant_ids):
        raise TargetScoringDataContractError("target_scoring_participant_identity_invalid")
    object_records = {}
    for item in objects:
        if not isinstance(item, Mapping):
            raise TargetScoringDataContractError("target_scoring_participant_object_invalid")
        object_id = str(item.get("objectId") or "").strip()
        participant_id = str(item.get("participantId") or "").strip()
        quota = item.get("shotQuota")
        if not object_id or object_id in object_records or object_id not in object_ids or participant_id not in participant_ids:
            raise TargetScoringDataContractError("target_scoring_participant_object_invalid")
        if not isinstance(quota, int) or isinstance(quota, bool) or quota < 1:
            raise TargetScoringDataContractError("target_scoring_participant_quota_invalid")
        object_records[object_id] = (participant_id, quota)
    if set(object_records) != object_ids:
        raise TargetScoringDataContractError("target_scoring_participant_objects_incomplete")
    if policy.get("completionRule") != "all_object_quotas_met" or policy.get("overQuotaBehavior") != "reject":
        raise TargetScoringDataContractError("target_scoring_participant_quota_policy_invalid")
    if not isinstance(course, Mapping) or course.get("selectionMode") != "shooter_declared_object_any_order":
        raise TargetScoringDataContractError("target_scoring_participant_course_invalid")
    course_participants = course.get("participants")
    if not isinstance(course_participants, list):
        raise TargetScoringDataContractError("target_scoring_participant_course_invalid")
    course_objects = {
        str(obj.get("objectId") or ""): (str(item.get("participantId") or ""), obj.get("shotQuota"))
        for item in course_participants if isinstance(item, Mapping)
        for obj in (item.get("objects") or []) if isinstance(obj, Mapping)
    }
    if course_objects != object_records:
        raise TargetScoringDataContractError("target_scoring_participant_course_mismatch")


def _object_scoreboard(scoring: Mapping[str, Any], object_ids: set[str]) -> None:
    presentation = scoring.get("objectScoreboard")
    if presentation is None:
        return
    if (
        not isinstance(presentation, Mapping)
        or presentation.get("mode") not in OBJECT_SCOREBOARD_MODES
        or len(object_ids) < 2
        or not all(str(presentation.get(field) or "").strip() for field in ("heading", "totalScoreLabel", "totalXCountLabel"))
    ):
        raise TargetScoringDataContractError("target_scoring_object_scoreboard_invalid")


def _counted_hit_policy(scoring: Mapping[str, Any], object_ids: set[str]) -> None:
    policy = scoring.get("countedHitPolicy")
    if policy is None:
        return
    maximum = policy.get("maximumCountedHitsPerObject") if isinstance(policy, Mapping) else None
    if (
        not isinstance(policy, Mapping)
        or policy.get("mode") not in COUNTED_HIT_POLICY_MODES
        or scoring.get("model") != "numeric_regions"
        or not object_ids
        or not isinstance(maximum, int)
        or isinstance(maximum, bool)
        or maximum < 1
        or policy.get("selectionRule") != "observation_order"
        or policy.get("overflowValue") != 0
        or policy.get("preserveAllObservations") is not True
    ):
        raise TargetScoringDataContractError("target_scoring_counted_hit_policy_invalid")


def _scoring_mode_policy(scoring: Mapping[str, Any], region_ids: set[str], interaction: Mapping[str, Any]) -> None:
    policy = scoring.get("scoringModePolicy")
    selector = interaction.get("scoringMode") if isinstance(interaction, Mapping) else None
    if policy is None:
        if selector is not None:
            raise TargetScoringDataContractError("target_scoring_mode_policy_required")
        return
    options = policy.get("options") if isinstance(policy, Mapping) else None
    if (
        not isinstance(policy, Mapping)
        or policy.get("mode") not in SCORING_MODE_POLICY_MODES
        or scoring.get("model") != "numeric_regions"
        or policy.get("materialFact") != "scoring_mode"
        or policy.get("selectionSource") != "shooter_declared"
        or policy.get("required") is not True
        or not isinstance(options, list)
        or len(options) < 2
    ):
        raise TargetScoringDataContractError("target_scoring_mode_policy_invalid")
    identities = []
    labels = []
    for option in options:
        mode_id = str(option.get("modeId") or "").strip() if isinstance(option, Mapping) else ""
        label = str(option.get("label") or "").strip() if isinstance(option, Mapping) else ""
        values = option.get("regionValues") if isinstance(option, Mapping) else None
        outside_value = option.get("outsideValue") if isinstance(option, Mapping) else None
        if (
            not mode_id
            or not label
            or not isinstance(values, Mapping)
            or set(values) != region_ids
            or any(not isinstance(value, Real) or isinstance(value, bool) for value in values.values())
            or not isinstance(outside_value, Real)
            or isinstance(outside_value, bool)
        ):
            raise TargetScoringDataContractError("target_scoring_mode_option_invalid")
        identities.append(mode_id)
        labels.append(label)
    if len(set(identities)) != len(identities) or len(set(labels)) != len(labels):
        raise TargetScoringDataContractError("target_scoring_mode_option_duplicate")
    selector_options = selector.get("options") if isinstance(selector, Mapping) else None
    if (
        not isinstance(selector, Mapping)
        or selector.get("materialFact") != "scoring_mode"
        or selector.get("selectionMode") != "shooter_required_before_result"
        or not str(selector.get("label") or "").strip()
        or not isinstance(selector_options, list)
        or [(str(item.get("modeId") or ""), str(item.get("label") or "")) for item in selector_options if isinstance(item, Mapping)] != list(zip(identities, labels))
    ):
        raise TargetScoringDataContractError("target_scoring_mode_interaction_invalid")


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
    if model == "mixed_regions":
        values = [rule.get("value") for rule in rules.values() if "value" in rule]
        if not values or any(not isinstance(value, Real) or isinstance(value, bool) for value in values):
            raise TargetScoringDataContractError("target_scoring_mixed_numeric_value_required")
        if "value" in scoring["outsideRule"]:
            raise TargetScoringDataContractError("target_scoring_mixed_outside_must_be_count_only")
    object_ids = [rule.get("objectId") for rule in rules.values()]
    has_object_identity = any(value is not None and str(value).strip() for value in object_ids)
    if model in {"multiple_bulls", "ordered_objects"} or has_object_identity:
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
    _participant_aggregation(scoring, {str(value) for value in object_ids if value is not None and str(value).strip()}, mission.get("interaction") or {})
    _object_scoreboard(scoring, {str(value) for value in object_ids if value is not None and str(value).strip()})
    _counted_hit_policy(scoring, {str(value) for value in object_ids if value is not None and str(value).strip()})
    _scoring_mode_policy(scoring, region_id_set, mission.get("interaction") or {})
    _boundary_policy(scoring, regions)
    _aim(mission.get("interaction"), region_id_set)
