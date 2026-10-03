"""One governed scoring executor whose behavior is supplied entirely by target data."""
from __future__ import annotations

from collections import Counter, defaultdict
from copy import deepcopy
import math
from typing import Any, Dict, Mapping

from target_execution_contract import canonical_json, digest
from target_scoring_data_contract import MODEL_AGGREGATIONS, validate_target_scoring_data
from ugo_observation_classifier import classify, coordinate
from shot_pattern_metrics import derive_shot_pattern


class DeclarativeTargetScoreError(ValueError):
    def __init__(self, reason: str, **details: Any):
        super().__init__(reason)
        self.payload = {"reason": reason, **details}


def _image(value: Any) -> Dict[str, Any]:
    if not isinstance(value, Mapping):
        raise DeclarativeTargetScoreError("image_evidence_required")
    sha256 = str(value.get("sha256") or "").strip().lower()
    if len(sha256) != 64 or any(character not in "0123456789abcdef" for character in sha256):
        raise DeclarativeTargetScoreError("image_sha256_invalid")
    width, height = value.get("widthPx"), value.get("heightPx")
    if not isinstance(width, int) or width < 1 or not isinstance(height, int) or height < 1:
        raise DeclarativeTargetScoreError("image_dimensions_invalid")
    if not (str(value.get("dataUrl") or "").strip() or str(value.get("mediaId") or "").strip()):
        raise DeclarativeTargetScoreError("admitted_image_reference_required")
    return {"sha256": sha256, "widthPx": width, "heightPx": height, "mediaType": str(value.get("mediaType") or "image/unknown"), "backendHashVerified": True}


def _point(value: Any) -> tuple[float, float]:
    if not isinstance(value, Mapping):
        raise DeclarativeTargetScoreError("observation_invalid")
    return (
        coordinate(value.get("xNorm"), "observation_coordinate_invalid", DeclarativeTargetScoreError),
        coordinate(value.get("yNorm"), "observation_coordinate_invalid", DeclarativeTargetScoreError),
    )


def _canonical_target_coordinate(value: Mapping[str, Any], contract: Mapping[str, Any], image: Mapping[str, Any], x: float, y: float) -> Dict[str, Any]:
    geometry = contract["components"]["geometry"]["definition"]
    coordinate_system = str(geometry.get("coordinateSystem") or "")
    if coordinate_system != "normalized_source_image_top_left":
        raise DeclarativeTargetScoreError("ugo_coordinate_system_unsupported")
    supplied = value.get("canonicalTargetCoordinate")
    if supplied is not None:
        if not isinstance(supplied, Mapping):
            raise DeclarativeTargetScoreError("ugo_canonical_coordinate_invalid")
        if str(supplied.get("schemaVersion") or "") != "sczn3.ugo.normalized-source-image-point.v1":
            raise DeclarativeTargetScoreError("ugo_canonical_coordinate_schema_invalid")
        if str(supplied.get("coordinateSystem") or "") != coordinate_system:
            raise DeclarativeTargetScoreError("ugo_canonical_coordinate_system_mismatch")
        if str(supplied.get("targetProfileId") or "") != str(contract["targetProfile"]["id"]):
            raise DeclarativeTargetScoreError("ugo_canonical_target_identity_mismatch")
        if str(supplied.get("sourceImageSha256") or "").lower() != str(image["sha256"]).lower():
            raise DeclarativeTargetScoreError("ugo_canonical_source_image_mismatch")
        if int(supplied.get("sourceImageWidthPx") or 0) != int(image["widthPx"]) or int(supplied.get("sourceImageHeightPx") or 0) != int(image["heightPx"]):
            raise DeclarativeTargetScoreError("ugo_canonical_source_dimensions_mismatch")
        if float(supplied.get("xNorm")) != x or float(supplied.get("yNorm")) != y:
            raise DeclarativeTargetScoreError("ugo_canonical_coordinate_value_mismatch")
        return deepcopy(dict(supplied))
    return {
        "schemaVersion": "sczn3.ugo.normalized-source-image-point.v1",
        "coordinateSystem": coordinate_system,
        "targetProfileId": str(contract["targetProfile"]["id"]),
        "sourceImageSha256": str(image["sha256"]).lower(),
        "sourceImageWidthPx": int(image["widthPx"]),
        "sourceImageHeightPx": int(image["heightPx"]),
        "xNorm": x,
        "yNorm": y,
    }


def _aim(value: Any, mode: str) -> Dict[str, Any] | None:
    if value is None:
        return None
    if mode != "shooter_declared" or not isinstance(value, Mapping):
        raise DeclarativeTargetScoreError("shooter_declared_aim_not_authorized")
    x, y = _point(value)
    return {"xNorm": x, "yNorm": y, "declaredBy": "shooter", "authorityScope": "session_evidence_only"}


def _clean_caliber(value: Any) -> str:
    return "".join(character for character in str(value or "").casefold() if character.isalnum())


def _classify_points(regions: list[Mapping[str, Any]], points: list[tuple[float, float]], physical: Mapping[str, Any], diameter_inches: float) -> list[Dict[str, Any]]:
    width, height = float(physical["width"]), float(physical["height"])
    radius_x, radius_y = diameter_inches / width / 2, diameter_inches / height / 2
    return [
        classify(
            regions,
            x,
            y,
            id_key="regionId",
            shape_reason="geometry_shape_not_supported",
            error_type=DeclarativeTargetScoreError,
            footprint_radius_x=radius_x,
            footprint_radius_y=radius_y,
        )
        for x, y in points
    ]


def _authority_scoring_gauge(
    policy: Mapping[str, Any],
    context: Mapping[str, Any],
    regions: list[Mapping[str, Any]],
    points: list[tuple[float, float]],
    physical: Mapping[str, Any],
) -> tuple[list[Dict[str, Any]], Dict[str, Any]]:
    dimensions_usable = str(physical.get("unit") or "").lower() in {"inch", "inches", "in"} and float(physical.get("width") or 0) > 0 and float(physical.get("height") or 0) > 0
    if not dimensions_usable:
        raise DeclarativeTargetScoreError("authority_scoring_gauge_physical_dimensions_required")
    groups = list(policy["authorizedGaugeGroups"])
    caliber = _clean_caliber(context.get("caliber"))
    selected = next((group for group in groups if caliber and caliber in {_clean_caliber(alias) for alias in group["aliases"]}), None)
    if caliber and not selected:
        raise DeclarativeTargetScoreError(
            "scoring_caliber_not_authorized",
            receivedCaliber=str(context.get("caliber") or ""),
            allowedCalibers=[group["caliberId"] for group in groups],
        )
    candidates = [selected] if selected else groups
    evaluations = []
    for group in candidates:
        diameter_range = group["diameterRangeInches"]
        for diameter in sorted({float(diameter_range["min"]), float(diameter_range["max"])}):
            classifications = _classify_points(regions, points, physical, diameter)
            evaluations.append((group, diameter, classifications, tuple(item["entityId"] for item in classifications)))
    signatures = {item[3] for item in evaluations}
    if len(signatures) > 1 and selected is None:
        raise DeclarativeTargetScoreError(
            "scoring_caliber_required",
            status="material_fact_required",
            materialFact="caliber",
            allowedCalibers=[group["caliberId"] for group in groups],
            allowedCaliberChoices=[
                {"label": group["caliberId"], "value": group["aliases"][0]}
                for group in groups
            ],
            reasonWhyMaterial="authorized_scoring_gauges_produce_different_region_results",
        )
    exact_diameter = context.get("diameterInches")
    if len(signatures) > 1 and exact_diameter in (None, ""):
        raise DeclarativeTargetScoreError(
            "scoring_gauge_diameter_required",
            status="material_fact_required",
            materialFact="scoring_gauge_diameter_inches",
            caliberId=selected["caliberId"],
            authorizedRange=deepcopy(selected["diameterRangeInches"]),
            reasonWhyMaterial="authorized_diameters_within_caliber_range_produce_different_region_results",
        )
    if exact_diameter not in (None, ""):
        if selected is None:
            raise DeclarativeTargetScoreError("scoring_caliber_required", status="material_fact_required", materialFact="caliber")
        try:
            diameter = float(exact_diameter)
        except (TypeError, ValueError) as exc:
            raise DeclarativeTargetScoreError("scoring_gauge_diameter_invalid") from exc
        diameter_range = selected["diameterRangeInches"]
        if not float(diameter_range["min"]) <= diameter <= float(diameter_range["max"]):
            raise DeclarativeTargetScoreError("scoring_gauge_diameter_not_authorized", caliberId=selected["caliberId"], authorizedRange=deepcopy(diameter_range))
        classifications = _classify_points(regions, points, physical, diameter)
        gauge = {
            "status": "applied",
            "policyId": str(policy.get("policyId") or ""),
            "caliberId": selected["caliberId"],
            "diameterInches": diameter,
            "authorizedRange": deepcopy(diameter_range),
            "lineTouchRule": policy["lineTouchRule"],
            "authority": deepcopy(policy["authority"]),
            "source": str(context.get("source") or "shooter_declared_material_fact"),
        }
        return classifications, gauge
    chosen_group, _, classifications, _ = evaluations[0]
    gauge = {
        "status": "applied" if selected else "not_required_same_score",
        "policyId": str(policy.get("policyId") or ""),
        "caliberId": selected["caliberId"] if selected else None,
        "diameterInches": None,
        "authorizedRange": deepcopy(chosen_group["diameterRangeInches"]) if selected else None,
        "evaluatedCaliberIds": [group["caliberId"] for group in candidates],
        "scoreStableAcrossEvaluatedGauges": True,
        "lineTouchRule": policy["lineTouchRule"],
        "authority": deepcopy(policy["authority"]),
        "source": str(context.get("source") or ("not_required" if not selected else "shooter_declared_material_fact")),
    }
    return classifications, gauge


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    validate_target_scoring_data(contract)
    if not isinstance(evidence, Mapping):
        raise DeclarativeTargetScoreError("evidence_object_required")
    image_evidence = _image(evidence.get("imageEvidence"))
    observations = evidence.get("observations")
    if not isinstance(observations, list) or not observations:
        raise DeclarativeTargetScoreError("observations_required")
    mission = contract["components"]["mission"]["definition"]
    if len(observations) > int(mission.get("maxObservations", 500)):
        raise DeclarativeTargetScoreError("observation_limit_exceeded")
    exact_observations = mission.get("exactObservations")
    if exact_observations is not None and len(observations) != int(exact_observations):
        raise DeclarativeTargetScoreError(
            "observation_count_mismatch",
            exactObservations=int(exact_observations),
            receivedObservations=len(observations),
        )
    scoring_data = contract["components"]["scoring"]["definition"]
    model = str(scoring_data.get("model") or "")
    if model not in MODEL_AGGREGATIONS:
        raise DeclarativeTargetScoreError("scoring_model_unsupported")
    geometry = contract["components"]["geometry"]["definition"]
    regions = geometry.get("regions") or []
    rules = scoring_data.get("regionRules") or {}
    if model != "not_applicable" and (not isinstance(regions, list) or not regions or not isinstance(rules, Mapping)):
        raise DeclarativeTargetScoreError("target_scoring_data_incomplete")

    scoring_mode_policy = scoring_data.get("scoringModePolicy") if isinstance(scoring_data.get("scoringModePolicy"), Mapping) else None
    selected_scoring_mode = None
    if scoring_mode_policy:
        requested_mode = str(evidence.get("scoringMode") or "").strip().casefold()
        choices = [
            {"value": str(option["modeId"]), "label": str(option["label"])}
            for option in scoring_mode_policy["options"]
        ]
        if not requested_mode:
            raise DeclarativeTargetScoreError("scoring_mode_required", allowedScoringModes=choices)
        selected_scoring_mode = next(
            (option for option in scoring_mode_policy["options"] if str(option["modeId"]).casefold() == requested_mode),
            None,
        )
        if selected_scoring_mode is None:
            raise DeclarativeTargetScoreError("scoring_mode_not_authorized", receivedScoringMode=str(evidence.get("scoringMode") or ""), allowedScoringModes=choices)

    elapsed_policy = mission.get("interaction", {}).get("elapsedTime")
    elapsed_time_seconds = evidence.get("elapsedTimeSeconds")
    if elapsed_time_seconds in (None, ""):
        elapsed_time_seconds = None
    elif not isinstance(elapsed_policy, Mapping):
        raise DeclarativeTargetScoreError("elapsed_time_not_authorized")
    elif not isinstance(elapsed_time_seconds, (int, float)) or isinstance(elapsed_time_seconds, bool) or not math.isfinite(float(elapsed_time_seconds)) or float(elapsed_time_seconds) <= 0:
        raise DeclarativeTargetScoreError("elapsed_time_invalid")
    else:
        elapsed_time_seconds = round(float(elapsed_time_seconds), 2)

    def governed_value(region_id: str, rule: Mapping[str, Any]) -> Any:
        if selected_scoring_mode is None:
            return rule.get("value")
        if region_id == "outside":
            return selected_scoring_mode["outsideValue"]
        return selected_scoring_mode["regionValues"].get(region_id)

    classifications = []
    counts: Counter[str] = Counter()
    group_totals: Dict[str, float] = defaultdict(float)
    counted_hits_by_object: Counter[str] = Counter()
    total = 0.0
    numeric = model in {"numeric_regions", "penalty_regions", "mixed_regions"}
    object_hit_classification = model in {"multiple_bulls", "ordered_objects"} or (
        bool(rules) and all(str(rule.get("objectId") or "").strip() for rule in rules.values())
    )
    participant_policy = scoring_data.get("participantAggregation") if isinstance(scoring_data.get("participantAggregation"), Mapping) else None
    counted_hit_policy = scoring_data.get("countedHitPolicy") if isinstance(scoring_data.get("countedHitPolicy"), Mapping) else None
    participant_objects = {
        str(item["objectId"]): dict(item)
        for item in (participant_policy.get("objects") or [])
    } if participant_policy else {}
    physical = contract["targetProfile"].get("product", {}).get("dimensions") or {}
    ballistic = evidence.get("_backendBallisticContext") if isinstance(evidence.get("_backendBallisticContext"), Mapping) else {}
    scoring_gauge_context = evidence.get("_backendScoringGaugeContext") if isinstance(evidence.get("_backendScoringGaugeContext"), Mapping) else {}
    boundary_policy = scoring_data.get("boundaryPolicy") if isinstance(scoring_data.get("boundaryPolicy"), Mapping) else None
    uses_standard_footprint = object_hit_classification and scoring_data.get("classificationFootprintMode", "sczn3_standard") != "tap_center"
    diameter_inches = float(ballistic.get("diameterInches") or 0) if uses_standard_footprint else 0.0
    dimensions_usable = str(physical.get("unit") or "").lower() in {"inch", "inches", "in"} and float(physical.get("width") or 0) > 0 and float(physical.get("height") or 0) > 0
    footprint_radius_x = diameter_inches / float(physical["width"]) / 2 if diameter_inches > 0 and dimensions_usable else 0.0
    footprint_radius_y = diameter_inches / float(physical["height"]) / 2 if diameter_inches > 0 and dimensions_usable else 0.0
    observation_points = [_point(observation) for observation in observations]
    canonical_points = [
        _canonical_target_coordinate(observation, contract, image_evidence, observation_points[index][0], observation_points[index][1])
        for index, observation in enumerate(observations)
    ]
    authority_gauge = None
    governed_classifications = None
    if boundary_policy and boundary_policy.get("mode") == "authority_scoring_gauge":
        governed_classifications, authority_gauge = _authority_scoring_gauge(boundary_policy, scoring_gauge_context, regions, observation_points, physical)
    for index, observation in enumerate(observations, start=1):
        x, y = observation_points[index - 1]
        classification_unavailable = model == "not_applicable"
        classified = (
            {"classificationStatus": "unavailable", "entityId": None, "matchingEntityIds": [], "classificationMethod": "not_applicable_no_governed_regions"}
            if classification_unavailable
            else governed_classifications[index - 1]
            if governed_classifications is not None
            else classify(regions, x, y, id_key="regionId", shape_reason="geometry_shape_not_supported", error_type=DeclarativeTargetScoreError, footprint_radius_x=footprint_radius_x, footprint_radius_y=footprint_radius_y)
            if regions
            else {"classificationStatus": "unmapped", "entityId": None, "matchingEntityIds": [], "classificationMethod": "tap_center_point"}
        )
        if classified["classificationStatus"] == "ambiguous":
            raise DeclarativeTargetScoreError("geometry_classification_ambiguous")
        region_id = None if classification_unavailable else classified["entityId"] or "outside"
        rule = None if classification_unavailable else rules.get(region_id, scoring_data.get("outsideRule"))
        if model != "not_applicable" and not isinstance(rule, Mapping):
            raise DeclarativeTargetScoreError("scoring_rule_unavailable")
        label = "Classification unavailable" if classification_unavailable else str((rule or {}).get("label") or region_id)
        value = governed_value(region_id, rule or {})
        declared_object_id = str(observation.get("declaredObjectId") or "").strip() or None
        classified_object_id = str((rule or {}).get("objectId") or "").strip() or None
        object_id = classified_object_id
        participant_id = None
        if participant_policy:
            if declared_object_id and declared_object_id not in participant_objects:
                raise DeclarativeTargetScoreError("participant_object_assignment_invalid", observationIndex=index, objectId=declared_object_id)
            if classified_object_id and declared_object_id and classified_object_id != declared_object_id:
                raise DeclarativeTargetScoreError(
                    "participant_cross_object_scoring_rule_unavailable",
                    observationIndex=index,
                    declaredObjectId=declared_object_id,
                    classifiedObjectId=classified_object_id,
                )
            object_id = classified_object_id or declared_object_id
            if not object_id:
                raise DeclarativeTargetScoreError("participant_object_assignment_required", observationIndex=index)
            participant_id = participant_objects[object_id]["participantId"]
        scored_observation = numeric and isinstance(value, (int, float)) and not isinstance(value, bool)
        if numeric:
            if model != "mixed_regions" and not scored_observation:
                raise DeclarativeTargetScoreError("numeric_scoring_value_required")
            value = float(value) if scored_observation else None
            counted_for_score = True
            if counted_hit_policy and object_id and region_id != "outside":
                maximum_counted = int(counted_hit_policy["maximumCountedHitsPerObject"])
                counted_for_score = counted_hits_by_object[object_id] < maximum_counted
                if counted_for_score:
                    counted_hits_by_object[object_id] += 1
            counted_value = value if scored_observation and counted_for_score else (float(counted_hit_policy["overflowValue"]) if scored_observation and counted_hit_policy else 0.0)
            total += counted_value
            group_totals[str(participant_id or observation.get("groupId") or "all")] += counted_value
        if not classification_unavailable:
            counts[region_id] += 1
        counts_as_hit = None if classification_unavailable else region_id != "outside" and (rule or {}).get("countsAsHit") is not False
        record = {
            "observationId": f"observation-{index:03d}", "xNorm": x, "yNorm": y,
            "canonicalTargetCoordinate": canonical_points[index - 1],
            "regionId": region_id, "label": label, "value": value,
            "objectId": object_id, "participantId": participant_id, "declaredObjectId": declared_object_id,
            "groupId": str(participant_id or observation.get("groupId") or "all"),
            "classificationStatus": classified["classificationStatus"],
            "classificationMethod": classified["classificationMethod"],
            "countsAsHit": counts_as_hit,
        }
        if numeric and counted_hit_policy and object_id and region_id != "outside":
            record.update({
                "countedForScore": counted_for_score,
                "countedValue": counted_value,
                "scoreExclusionReason": None if counted_for_score else "per_object_counted_hit_cap_reached",
            })
        classifications.append(record)

    if participant_policy:
        object_counts = Counter(str(item.get("objectId") or "") for item in classifications)
        progress = [
            {
                "objectId": object_id,
                "participantId": item["participantId"],
                "shotQuota": int(item["shotQuota"]),
                "recordedShots": object_counts.get(object_id, 0),
            }
            for object_id, item in participant_objects.items()
        ]
        over_quota = next((item for item in progress if item["recordedShots"] > item["shotQuota"]), None)
        if over_quota:
            raise DeclarativeTargetScoreError("participant_object_shot_quota_exceeded", **over_quota)
        incomplete = [item for item in progress if item["recordedShots"] != item["shotQuota"]]
        if incomplete:
            raise DeclarativeTargetScoreError("participant_course_shot_quota_incomplete", progress=progress)

    scoring: Dict[str, Any] = {
        "status": "not_applicable" if model == "not_applicable" else "complete",
        "model": model,
        "completion": "shooter_declared" if evidence.get("shooterDeclaredComplete") is True else "open",
        "observationCount": len(classifications),
        "regionCounts": dict(counts),
        "outsideCount": None if model == "not_applicable" else counts.get("outside", 0),
        "classifiedObservationCount": 0 if model == "not_applicable" else len(classifications),
        "unclassifiedObservationCount": len(classifications) if model == "not_applicable" else 0,
        "classificationStatus": "unavailable" if model == "not_applicable" else "complete",
        "publisherRuleAuthority": deepcopy(scoring_data.get("publisherRuleAuthority")),
        "aggregation": deepcopy(scoring_data.get("aggregation")),
        "participantAggregation": deepcopy(participant_policy),
    }
    if model != "not_applicable":
        scoring["regionCatalog"] = [
            {"regionId": str(region_id), "label": str(rule.get("label") or region_id)}
            for region_id, rule in rules.items()
        ]
    if counted_hit_policy:
        scoring["countedHitPolicy"] = deepcopy(counted_hit_policy)
    if selected_scoring_mode:
        scoring["scoringMode"] = {
            "modeId": str(selected_scoring_mode["modeId"]),
            "label": str(selected_scoring_mode["label"]),
            "materialFact": str(scoring_mode_policy["materialFact"]),
            "selectionSource": "shooter_declared_material_fact",
            "authority": deepcopy(scoring_mode_policy.get("authority")),
        }
    if numeric:
        region_results = []
        for region_id, rule in rules.items():
            governed = governed_value(region_id, rule)
            value = float(governed) if isinstance(governed, (int, float)) and not isinstance(governed, bool) else None
            hit_count = counts.get(region_id, 0)
            classified_hits = [item for item in classifications if item.get("regionId") == region_id]
            counted_hit_count = sum(1 for item in classified_hits if item.get("countedForScore") is not False)
            points = float(sum(float(item.get("countedValue", item.get("value") or 0)) for item in classified_hits))
            region_result = {
                "regionId": region_id,
                "label": str(rule.get("label") or region_id),
                "value": (int(value) if value.is_integer() else value) if value is not None else None,
                "hitCount": hit_count,
                "points": int(points) if points.is_integer() else points,
            }
            if counted_hit_policy:
                region_result.update({"countedHitCount": counted_hit_count, "uncountedHitCount": hit_count - counted_hit_count})
            region_results.append(region_result)
        x_count = sum(1 for item in classifications if rules.get(str(item.get("regionId") or ""), {}).get("countsAsX") is True and item.get("countedForScore") is not False)
        scoring.update({"total": total, "xCount": x_count, "groupTotals": dict(group_totals), "regionResults": region_results})
        if scoring_data.get("xScoring") is not None:
            scoring["xScoring"] = deepcopy(scoring_data["xScoring"])
        if scoring_data.get("aggregateValueDistribution") is True:
            numeric_distribution: Counter[float] = Counter()
            x_numeric_count = 0
            x_numeric_points = 0.0
            for item in classifications:
                if isinstance(item.get("value"), (int, float)) and not isinstance(item.get("value"), bool):
                    rule = rules.get(str(item.get("regionId") or ""), {})
                    if rule.get("countsAsX") is True:
                        x_numeric_count += 1
                        x_numeric_points += float(item["value"])
                    else:
                        numeric_distribution[float(item["value"])] += 1
            scoring["valueDistribution"] = [
                {
                    "label": str(int(value)) if value.is_integer() else str(value),
                    "value": int(value) if value.is_integer() else value,
                    "hitCount": hit_count,
                    "points": int(value * hit_count) if float(value * hit_count).is_integer() else value * hit_count,
                    "countsAsX": False,
                }
                for value, hit_count in sorted(numeric_distribution.items(), reverse=True)
            ]
            if scoring_data.get("xScoring", {}).get("mode") == "separate_non_numeric":
                scoring["valueDistribution"].insert(0, {
                    "label": "X", "value": None, "hitCount": x_count, "points": None, "countsAsX": True,
                })
            elif scoring_data.get("xScoring", {}).get("mode") == "sczn3_derived_numeric":
                scoring["valueDistribution"].insert(0, {
                    "label": "X · SCZN3-derived 10", "value": scoring_data["xScoring"].get("value"),
                    "hitCount": x_numeric_count,
                    "points": int(x_numeric_points) if x_numeric_points.is_integer() else x_numeric_points,
                    "countsAsX": True,
                    "valueAuthority": "sczn3_derived",
                })
        if scoring_data.get("objectScoreboard") is not None:
            scoring["objectScoreboard"] = deepcopy(scoring_data["objectScoreboard"])
    if object_hit_classification:
        object_rules = {}
        object_max_values: Dict[Any, float] = {}
        for rule in rules.values():
            object_id = rule.get("objectId")
            object_rules.setdefault(object_id, rule.get("objectLabel") or rule.get("label"))
            if numeric and isinstance(rule.get("value"), (int, float)) and not isinstance(rule.get("value"), bool):
                object_max_values[object_id] = max(object_max_values.get(object_id, float("-inf")), float(rule["value"]))
        scoring["objectResults"] = [
            {
                "objectId": object_id,
                "label": label,
                "observationCount": sum(
                    1 for item in classifications
                    if str(item.get("objectId")) == str(object_id)
                ),
                "observationPercentage": round(
                    sum(1 for item in classifications if str(item.get("objectId")) == str(object_id))
                    / len(classifications) * 100,
                    1,
                ) if classifications else 0.0,
                "hit": any(
                    str(item.get("objectId")) == str(object_id)
                    and item.get("countsAsHit") is True
                    and (
                        not numeric
                        or float(item.get("value") or 0) > 0
                        or rules.get(str(item.get("regionId") or ""), {}).get("countsAsX") is True
                    )
                    for item in classifications
                ),
                "hitCount": sum(
                    1 for item in classifications
                    if str(item.get("objectId")) == str(object_id) and item.get("countsAsHit") is True
                ),
                "missCount": sum(
                    1 for item in classifications
                    if str(item.get("objectId")) == str(object_id) and item.get("countsAsHit") is False
                ),
            }
            for object_id, label in object_rules.items()
        ]
        summary_dimensions = scoring_data.get("summaryDimensions")
        if isinstance(summary_dimensions, list):
            scoring["summaryResults"] = []
            for dimension in summary_dimensions:
                group_results = []
                for group in dimension["groups"]:
                    members = {str(item) for item in group["objectIds"]}
                    group_observations = [item for item in classifications if str(item.get("objectId") or "") in members]
                    hit_objects = {
                        str(item.get("objectId"))
                        for item in group_observations
                        if item.get("countsAsHit") is True
                    }
                    object_count = len(members)
                    group_results.append({
                        "groupId": str(group["groupId"]),
                        "label": str(group["label"]),
                        "objectIds": list(group["objectIds"]),
                        "observationCount": len(group_observations),
                        "objectsHit": len(hit_objects),
                        "objectCount": object_count,
                        "completionPercentage": round(len(hit_objects) / object_count * 100, 1) if object_count else 0.0,
                    })
                scoring["summaryResults"].append({
                    "dimensionId": str(dimension["dimensionId"]),
                    "label": str(dimension["label"]),
                    "accountingRole": "derived_view_of_primary_observations",
                    "groups": group_results,
                })
        if numeric:
            outside_is_assignable = len(object_rules) == 1 or participant_policy is not None
            single_object_miss_count = counts.get("outside", 0) if len(object_rules) == 1 else None
            for object_result in scoring["objectResults"]:
                object_id = object_result["objectId"]
                assigned = [item for item in classifications if str(item.get("objectId")) == str(object_id)]
                scored_assigned = [
                    item for item in assigned
                    if isinstance(item.get("value"), (int, float)) and not isinstance(item.get("value"), bool)
                ]
                score = sum(float(item.get("countedValue", item["value"])) for item in scored_assigned)
                max_value = object_max_values.get(object_id, 0.0)
                object_cap = int(counted_hit_policy["maximumCountedHitsPerObject"]) if counted_hit_policy else None
                counted_hit_count = sum(1 for item in assigned if item.get("countedForScore") is not False)
                max_possible = (object_cap if object_cap is not None else len(scored_assigned)) * max_value
                ring_scored_assigned = [
                    item for item in scored_assigned
                    if rules.get(str(item.get("regionId") or ""), {}).get("countsAsX") is not True
                ]
                ring_counts = Counter(str(int(item["value"])) if float(item["value"]).is_integer() else str(item["value"]) for item in ring_scored_assigned)
                score_values = sorted({
                    float(rule["value"])
                    for rule in rules.values()
                    if str(rule.get("objectId")) == str(object_id)
                    and isinstance(rule.get("value"), (int, float))
                    and not isinstance(rule.get("value"), bool)
                    and rule.get("countsAsX") is not True
                }, reverse=True)
                object_result.update({
                    "assignedTapCount": len(assigned),
                    "score": score,
                    "ringCounts": dict(sorted(ring_counts.items(), key=lambda item: float(item[0]), reverse=True)),
                    "scoreValues": [int(value) if value.is_integer() else value for value in score_values],
                    "maximumPointsPerAssignedTap": max_value,
                    "maximumPossiblePoints": max_possible,
                    "performancePercentage": round(score / max_possible * 100, 1) if max_possible > 0 else None,
                    "missCount": single_object_miss_count if single_object_miss_count is not None else (sum(1 for item in assigned if item.get("regionId") == "outside") if outside_is_assignable else None),
                    "missesDetermination": "determined_by_declared_object" if participant_policy else ("determined_single_object" if outside_is_assignable else "not_determinable_without_object_assignment"),
                })
                object_result["xCount"] = sum(
                    1 for item in assigned
                    if rules.get(str(item.get("regionId") or ""), {}).get("countsAsX") is True
                )
                if counted_hit_policy:
                    object_result.update({
                        "countedHitCount": counted_hit_count,
                        "uncountedHitCount": len(assigned) - counted_hit_count,
                        "maximumCountedHits": object_cap,
                    })
        if participant_policy:
            by_object = {str(item["objectId"]): item for item in scoring["objectResults"]}
            scoring["participantResults"] = []
            for participant in participant_policy["participants"]:
                participant_id = str(participant["participantId"])
                owned = [item for item in participant_policy["objects"] if str(item["participantId"]) == participant_id]
                subtotals = [{
                    "objectId": str(item["objectId"]),
                    "label": str(item.get("label") or by_object[str(item["objectId"])]["label"]),
                    "shotQuota": int(item["shotQuota"]),
                    "recordedShots": int(by_object[str(item["objectId"])]["assignedTapCount"]),
                    "score": by_object[str(item["objectId"])]["score"],
                } for item in owned]
                scoring["participantResults"].append({
                    "participantId": participant_id,
                    "label": str(participant.get("label") or participant_id),
                    "objectSubtotals": subtotals,
                    "recordedShots": sum(item["recordedShots"] for item in subtotals),
                    "finalScore": sum(float(item["score"]) for item in subtotals),
                })
            # The printer defines one Final Score per participant, not a combined
            # sheet score. Retain the arithmetic sum only as reconciliation data;
            # it must not enter single-target score history or presentation.
            scoring["regionPointReconciliationTotal"] = scoring.pop("total")
        subset_results = []
        for region_id, rule in rules.items():
            subset_role = str(rule.get("subsetRole") or "").strip()
            if not subset_role:
                continue
            count = counts.get(region_id, 0)
            subset_results.append({
                "regionId": region_id,
                "label": str(rule.get("label") or region_id),
                "subsetRole": subset_role,
                "objectId": str(rule.get("objectId") or ""),
                "observationCount": count,
                "observationPercentage": round(count / len(classifications) * 100, 1) if classifications else 0.0,
                "accountingRole": "subset_not_additional_primary_tap",
            })
        if subset_results:
            scoring["subsetResults"] = subset_results
    cumulative_policy = scoring_data.get("cumulativeCountPolicy")
    if isinstance(cumulative_policy, Mapping):
        cumulative_results = []
        whole = Counter()
        for group in cumulative_policy["groups"]:
            atomic = group["atomicRegions"]
            red = counts.get(str(atomic["red"]), 0)
            white_only = counts.get(str(atomic["whiteOnly"]), 0)
            blue_only = counts.get(str(atomic["blueOnly"]), 0)
            misses = counts.get(str(atomic["miss"]), 0)
            record = {
                "groupId": str(group["groupId"]),
                "label": str(group["label"]),
                "atomic": {"red": red, "whiteOnly": white_only, "blueOnly": blue_only, "miss": misses},
                "cumulative": {"redTotal": red, "whiteTotal": red + white_only, "blueTotal": red + white_only + blue_only},
                "hitCount": red + white_only + blue_only,
                "missCount": misses,
                "totalTaps": red + white_only + blue_only + misses,
            }
            cumulative_results.append(record)
            for key, value in record["atomic"].items():
                whole[key] += value
        scoring["cumulativeCountMethod"] = "sczn3_founder_approved_nested_color_totals"
        scoring["cumulativeResults"] = cumulative_results
        scoring["cumulativeWholeTarget"] = {
            "atomic": dict(whole),
            "cumulative": {
                "redTotal": whole["red"],
                "whiteTotal": whole["red"] + whole["whiteOnly"],
                "blueTotal": whole["red"] + whole["whiteOnly"] + whole["blueOnly"],
            },
            "hitCount": whole["red"] + whole["whiteOnly"] + whole["blueOnly"],
            "missCount": whole["miss"],
            "totalTaps": sum(whole.values()),
        }
    if model == "ordered_objects":
        observed = [item.get("objectId") for item in classifications]
        aggregation = scoring_data["aggregation"]
        expected = list(aggregation.get("sequence") or [])
        progress = 0
        for actual in observed:
            if progress < len(expected) and str(actual) == str(expected[progress]):
                progress += 1
                continue
            if aggregation.get("mismatchBehavior") == "restart_sequence":
                progress = 1 if expected and str(actual) == str(expected[0]) else 0
            else:
                break
        complete = progress == len(expected) if aggregation.get("completionBehavior") == "all_in_order" else evidence.get("shooterDeclaredComplete") is True
        scoring["completion"] = "complete" if complete else "in_progress"
        scoring.update({"observedSequence": observed, "expectedSequence": expected, "completedInOrder": progress, "sequenceComplete": complete, "nextExpectedObjectId": expected[progress] if progress < len(expected) else None})
    elif model == "not_applicable":
        scoring["reason"] = str(scoring_data.get("reason") or "printer_defines_no_score")

    governed_shots = 0 if model == "not_applicable" else len(classifications)
    governed_hits = 0 if model == "not_applicable" else sum(1 for item in classifications if item.get("countsAsHit") is True)
    object_count = len(scoring.get("objectResults") or [])
    objects_hit = sum(1 for item in scoring.get("objectResults") or [] if item.get("hit") is True)
    object_counts = [int(item.get("observationCount") or 0) for item in scoring.get("objectResults") or []]
    object_distribution = None
    if object_counts:
        mean_count = sum(object_counts) / len(object_counts)
        variance = sum((count - mean_count) ** 2 for count in object_counts) / len(object_counts)
        strongest = max(scoring["objectResults"], key=lambda item: (int(item.get("observationCount") or 0), str(item.get("label") or "")))
        weakest = min(scoring["objectResults"], key=lambda item: (int(item.get("observationCount") or 0), str(item.get("label") or "")))
        object_distribution = {
            "status": "complete",
            "strongest": {"objectId": strongest["objectId"], "label": strongest["label"], "tapCount": int(strongest.get("observationCount") or 0)},
            "weakest": {"objectId": weakest["objectId"], "label": weakest["label"], "tapCount": int(weakest.get("observationCount") or 0)},
            "countRange": max(object_counts) - min(object_counts),
            "standardDeviationTaps": round(math.sqrt(variance), 2),
            "evennessPercentage": round((1 - (math.sqrt(variance) / mean_count)) * 100, 1) if mean_count > 0 else 0.0,
        }
        object_distribution["evennessPercentage"] = max(0.0, object_distribution["evennessPercentage"])
    sczn3_metrics = {
        "status": "complete" if model != "not_applicable" and regions else "not_applicable",
        "metricAuthority": "sczn3_measured_supplemental",
        "doesNotReplacePublisherResult": True,
        "hitRate": None if model == "not_applicable" else {
            "validHitCount": governed_hits,
            "governedShotCount": governed_shots,
            "percentage": round(governed_hits / governed_shots * 100, 1) if governed_shots else None,
        },
        "objectCoverage": {"objectsHit": objects_hit, "scorableObjectCount": object_count} if object_count else None,
        "objectDistribution": object_distribution,
        "shotPattern": derive_shot_pattern(classifications, _aim(evidence.get("shooterDeclaredAimPoint"), mission["interaction"]["aim"]["mode"])),
    }
    if str(contract.get("targetProfile", {}).get("id") or "").startswith("qt_printer13_product_"):
        # Founder-locked QT RESULT is target truth only: counts, governed points,
        # misses, and totals. Distribution and shot-pattern meta are intentionally
        # absent rather than merely hidden by the frontend.
        sczn3_metrics["objectDistribution"] = None
        sczn3_metrics["shotPattern"] = None

    diagnostic_overlay = None
    overlay = mission.get("diagnosticOverlay")
    if isinstance(overlay, Mapping):
        overlay_regions = overlay.get("regions") or []
        label_map = overlay.get("labels") or {}
        overlay_records = []
        overlay_counts: Counter[str] = Counter()
        for item in classifications:
            classified = classify(overlay_regions, item["xNorm"], item["yNorm"], id_key="regionId", shape_reason="geometry_shape_not_supported", error_type=DeclarativeTargetScoreError)
            region_id = classified.get("entityId")
            label = str(label_map.get(region_id) or "Unmapped")
            if region_id:
                overlay_counts[region_id] += 1
            overlay_records.append({"observationId": item["observationId"], "regionId": region_id, "publisherLabel": label if region_id else None, "classificationStatus": classified["classificationStatus"]})
        diagnostic_overlay = {
            "status": "complete",
            "handedness": overlay.get("handedness"),
            "claimGrade": "publisher_printed_diagnostic_label_match",
            "causalDiagnosisStatus": "not_established",
            "correctionStatus": "not_provided",
            "records": overlay_records,
            "labelCounts": {str(label_map.get(region_id) or region_id): count for region_id, count in overlay_counts.items()},
        }

    smart_treatment = mission.get("smartTargetTreatment") if isinstance(mission.get("smartTargetTreatment"), Mapping) else {}
    structural_classification_only = (
        smart_treatment.get("authorityScope") == "sczn3_derived_visible_structure"
        and smart_treatment.get("publisherScoreStatus") == "not_defined"
    )
    result = {
        "ok": True, "status": "complete", "authoritySource": "backend-authoritative",
        "missionFamily": contract["missionFamily"], "resultPackageType": contract["resultPackageType"], "resultPackageVersion": contract["resultPackageVersion"],
        "target": deepcopy(contract["targetProfile"]),
        "smartTargetTreatment": deepcopy(mission.get("smartTargetTreatment")),
        "executionContract": {"contractId": contract["contractId"], "contractVersion": contract["contractVersion"], "contractFingerprint": contract["contractFingerprint"], "executorId": contract["executor"]["id"], "executorVersion": contract["executor"]["version"], "secAdapterFamilyId": contract["secAdapter"]["id"], "secAdapterFamilyVersion": contract["secAdapter"]["version"], "preservationValidatorId": contract["preservationValidator"]["id"], "preservationValidatorVersion": contract["preservationValidator"]["version"]},
        "imageEvidence": image_evidence,
        "observations": deepcopy(classifications), "classifications": classifications,
        "aimStructure": deepcopy(mission["interaction"]["aim"]),
        "shooterDeclaredAimPoint": _aim(evidence.get("shooterDeclaredAimPoint"), mission["interaction"]["aim"]["mode"]),
        "scoring": scoring,
        "timing": {
            "status": "recorded" if elapsed_time_seconds is not None else "not_entered",
            "elapsedTimeSeconds": elapsed_time_seconds,
            "source": elapsed_policy.get("source") if elapsed_time_seconds is not None and isinstance(elapsed_policy, Mapping) else None,
            "required": False,
            "officialHitFactorStatus": "withheld_without_course_scoring_method_stipulated_hits_and_penalties",
            "grossPointsPerSecond": round(float(scoring.get("total", 0)) / elapsed_time_seconds, 4) if elapsed_time_seconds and isinstance(scoring.get("total"), (int, float)) else None,
        } if isinstance(elapsed_policy, Mapping) else None,
        "sczn3Metrics": sczn3_metrics,
        "diagnosticOverlay": diagnostic_overlay,
        "ballisticGeometry": {
            "tapMeaning": "center_of_sczn3_standard_observation_footprint" if object_hit_classification else "shooter_declared_point",
            "boundaryRule": "observation_footprint_touch_counts_for_object_hit_classification" if object_hit_classification else "target_profile_rule",
            "classificationMethod": "physical_projectile_footprint" if footprint_radius_x > 0 and footprint_radius_y > 0 else "tap_center_point",
            "projectileDiameter": deepcopy(ballistic),
            "normalizedRadius": {"x": footprint_radius_x, "y": footprint_radius_y} if footprint_radius_x > 0 and footprint_radius_y > 0 else None,
            "displayMarkerParticipatesInScoring": False,
            "authorityScoringGauge": deepcopy(authority_gauge),
        },
        "reconciliation": {
            "status": "reconciled",
            "recordedObservationCount": len(classifications),
            "classifiedObservationCount": 0 if model == "not_applicable" else len(classifications),
            "unclassifiedObservationCount": len(classifications) if model == "not_applicable" else 0,
            "countsMatch": (
                len(classifications) == len(observations)
                if model == "not_applicable"
                else sum(counts.values()) == len(classifications)
            ),
        },
        "authorityTrace": {"targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}", "classificationAuthority": "backend", "scoringAuthority": "sczn3-derived-structural-classification-no-publisher-score" if structural_classification_only else "printer-rules-through-target-data", "componentDigests": {name: component["digest"] for name, component in contract["components"].items()}},
    }
    result["resultHash"] = digest(canonical_json(result))
    return result


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    scoring = result.get("scoring") if isinstance(result, Mapping) else None
    classifications = result.get("classifications") if isinstance(result, Mapping) else None
    reconciliation = result.get("reconciliation") if isinstance(result, Mapping) else None
    elapsed_policy = contract.get("components", {}).get("mission", {}).get("definition", {}).get("interaction", {}).get("elapsedTime")
    timing = result.get("timing") if isinstance(result, Mapping) else None
    timing_valid = elapsed_policy is None and timing is None
    if isinstance(elapsed_policy, Mapping) and isinstance(timing, Mapping):
        elapsed = timing.get("elapsedTimeSeconds")
        timing_valid = (
            timing.get("status") == "not_entered" and elapsed is None and timing.get("grossPointsPerSecond") is None
        ) or (
            timing.get("status") == "recorded"
            and isinstance(elapsed, (int, float)) and not isinstance(elapsed, bool) and elapsed > 0
            and timing.get("source") == elapsed_policy.get("source")
            and isinstance(timing.get("grossPointsPerSecond"), (int, float))
        )
        timing_valid = timing_valid and timing.get("officialHitFactorStatus") == "withheld_without_course_scoring_method_stipulated_hits_and_penalties"
    return bool(
        isinstance(result, Mapping) and result.get("ok") is True
        and result.get("authoritySource") == "backend-authoritative"
        and result.get("missionFamily") == contract["missionFamily"]
        and result.get("resultPackageType") == contract["resultPackageType"]
        and result.get("resultPackageVersion") == contract["resultPackageVersion"]
        and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"]
        and isinstance(classifications, list) and len(classifications) >= 1
        and isinstance(scoring, Mapping) and scoring.get("status") in {"complete", "not_applicable"}
        and scoring.get("aggregation") == contract["components"]["scoring"]["definition"].get("aggregation")
        and result.get("aimStructure") == contract["components"]["mission"]["definition"]["interaction"]["aim"]
        and isinstance(reconciliation, Mapping) and reconciliation.get("status") == "reconciled" and reconciliation.get("countsMatch") is True
        and result.get("imageEvidence", {}).get("backendHashVerified") is True
        and timing_valid
    )
