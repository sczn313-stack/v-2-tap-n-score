"""Three synthetic publisher-label products for Diagnostic scale acceptance."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

from target_execution_contract import component_digest


FIXTURE_TARGET_IDS = ("fixture_diagnostic_right_tutor", "fixture_diagnostic_humorous", "fixture_diagnostic_left_data_only")
ASSET_SHA256 = "cb906e88e090b787369acb6d6ad2900b0f2c46d07507fd2175b90f5a387a5ee0"


def _component(component_id: str, definition: Dict[str, Any]) -> Dict[str, Any]:
    component = {"id": component_id, "version": "1", "status": "approved", "digest": "", "definition": deepcopy(definition)}
    component["digest"] = component_digest(component)
    return component


def _contract(target_id: str, name: str, sku: str, handedness: str, regions: list[Dict[str, Any]], labels: list[tuple[str, str]]) -> Dict[str, Any]:
    geometry = _component(f"{target_id}-geometry", {"status": "ugo_diagnostic_region_geometry", "coordinateSystem": "normalized_source_image_top_left", "orientation": "registered_publisher_orientation", "regions": regions, "physicalMeasurement": "unavailable"})
    registration = _component(f"{target_id}-registration", {"role": "evidence_capture_asset", "assetPath": "backend/test_fixtures/target_execution_scale.svg", "assetSha256": ASSET_SHA256, "assetAlt": name, "coordinateConvention": "normalized_source_image_top_left"})
    scoring = _component(f"{target_id}-scoring", {"status": "not_applicable", "reason": "publisher_label_match_is_not_scoring"})
    source_hash = "c" * 64
    profile = {
        "missionFamily": "diagnosticFeedbackEvaluation", "resultPackageType": "diagnosticFeedbackResult", "resultPackageVersion": "1",
        "profileId": f"diagnostic-{sku.lower()}-v1", "profileVersion": "1",
        "publisherAuthority": {"id": "synthetic-diagnostic-publisher", "name": "Synthetic Diagnostic Publisher"},
        "sourceDocuments": [{"id": f"source-{sku.lower()}", "title": f"{name} publisher labels", "revision": "2026.1", "reference": f"synthetic://diagnostic/{sku.lower()}", "effectiveFrom": "2026-08-19T00:00:00-04:00", "sha256": source_hash}],
        "approval": {"status": "approved", "authorityId": "DIAGNOSTIC-SYNTHETIC-AUTHORITY"},
        "effective": {"from": "2026-08-19T00:00:00-04:00", "until": None},
        "lifecycle": {"status": "active", "supersededBy": None, "suspended": False, "revoked": False},
        "componentBindings": {"targetProfileId": target_id, "targetProfileVersion": "1", "registrationDigest": registration["digest"], "geometryDigest": geometry["digest"]},
        "claimGrade": "publisher_label_match",
        "applicability": {"handedness": handedness, "declarationRequired": handedness in {"left", "right"}, "orientation": "registered_publisher_orientation", "allowRotation": False, "allowMirroring": False},
        "evaluationPolicy": {"mode": "per_observation_region_match", "summary": "count_by_label", "dominantLabel": "unavailable"},
        "regionLabelMap": [{"diagnosticRegionId": f"diagnostic-{region_id}", "geometryEntityId": region_id, "publisherLabelId": f"label-{region_id}", "displayLabel": label, "sourceReference": f"synthetic://diagnostic/{sku.lower()}#{region_id}", "sourceSha256": source_hash, "statementType": "publisher_region_label"} for region_id, label in labels],
        "capabilityStates": {"publisherLabelMatch": {"status": "available"}, "causalDiagnosis": {"status": "unavailable"}, "correction": {"status": "unavailable"}, "scoring": {"status": "not_applicable"}},
    }
    components = {"geometry": geometry, "registration": registration, "scoring": scoring, "mission": _component(f"{target_id}-mission", profile)}
    return {
        "schemaVersion": "sczn3-target-execution-contract-v1", "contractId": f"tec-{target_id}", "contractVersion": "1", "authorityContractVersion": "ADR-001-v1",
        "lifecycleStatus": "supported", "supportStatus": "supported", "approval": {"status": "approved", "authorityId": "DIAGNOSTIC-SYNTHETIC-AUTHORITY", "approvedAt": "2026-08-19T20:20:45-04:00"}, "effective": {"from": "2026-08-19T20:20:45-04:00", "until": None},
        "targetProfile": {"id": target_id, "version": "1", "atpId": f"atp-{target_id}-v1", "authorityId": f"authority-{target_id}-v1", "publisher": {"id": "synthetic-diagnostic-publisher", "name": "Synthetic Diagnostic Publisher"}, "product": {"id": f"product-{sku.lower()}", "name": name, "sku": sku}},
        "components": components, "missionFamily": "diagnosticFeedbackEvaluation", "resultPackageType": "diagnosticFeedbackResult", "resultPackageVersion": "1",
        "executor": {"id": "diagnostic-feedback-evaluator", "version": "1"}, "secAdapter": {"id": "diagnostic-feedback-family", "version": "1", "scoringPresentationFamily": "evidence_only"}, "preservationValidator": {"id": "diagnostic-feedback-preservation", "version": "1"},
        "session": {"capabilityStates": profile["capabilityStates"], "officialMissionRequired": False},
        "unsupportedUses": ["causal_diagnosis", "correction", "coaching", "scoring", "qualification", "medical", "anatomical", "tactical", "handedness_mirroring", "group_distribution_diagnosis"],
    }


def contracts():
    right_regions = [{"regionId": "upper-left", "shape": "rectangle", "xMin": .05, "xMax": .4, "yMin": .05, "yMax": .4, "priority": 10}]
    humorous_regions = [
        {"regionId": "snack-zone", "shape": "circle", "cx": .45, "cy": .5, "radius": .25, "priority": 5},
        {"regionId": "nap-zone", "shape": "circle", "cx": .55, "cy": .5, "radius": .25, "priority": 5},
    ]
    left_regions = [{"regionId": "lower-right", "shape": "rectangle", "xMin": .6, "xMax": .95, "yMin": .6, "yMax": .95, "priority": 10}]
    return (
        _contract(FIXTURE_TARGET_IDS[0], "Conventional Right-Handed Tutor", "DIAG-A01", "right", right_regions, [("upper-left", "Publisher Upper Left")]),
        _contract(FIXTURE_TARGET_IDS[1], "Humorous Neutral Label Target", "DIAG-B02", "not_applicable", humorous_regions, [("snack-zone", "Snack Break"), ("nap-zone", "Nap Time")]),
        _contract(FIXTURE_TARGET_IDS[2], "Data-Only Left-Handed Tutor", "DIAG-C03", "left", left_regions, [("lower-right", "Publisher Lower Right")]),
    )
