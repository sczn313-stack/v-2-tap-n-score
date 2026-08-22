"""Three synthetic Decision Scenario Profiles for reusable-owner acceptance."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

from target_execution_contract import component_digest


FIXTURE_TARGET_IDS = ("fixture_decision_positive", "fixture_decision_no_response", "fixture_decision_data_only")
ASSET_SHA256 = "cb906e88e090b787369acb6d6ad2900b0f2c46d07507fd2175b90f5a387a5ee0"


def _component(component_id: str, definition: Dict[str, Any]) -> Dict[str, Any]:
    component = {"id": component_id, "version": "1", "status": "approved", "digest": "", "definition": deepcopy(definition)}
    component["digest"] = component_digest(component)
    return component


def _contract(target_id: str, name: str, sku: str, expected: str, publisher_label: str) -> Dict[str, Any]:
    geometry = _component(f"{target_id}-geometry", {"status": "ugo_scenario_entity_geometry", "coordinateSystem": "normalized_source_image_top_left", "entities": [{"entityId": "scenario-subject", "shape": "rectangle", "xMin": .1, "xMax": .9, "yMin": .1, "yMax": .9, "priority": 10}], "physicalMeasurement": "unavailable"})
    registration = _component(f"{target_id}-registration", {"role": "evidence_capture_asset", "assetPath": "backend/test_fixtures/target_execution_scale.svg", "assetSha256": ASSET_SHA256, "assetAlt": name, "coordinateConvention": "normalized_source_image_top_left"})
    scoring = _component(f"{target_id}-scoring", {"status": "not_applicable", "reason": "decision_response_matching_is_not_scoring"})
    source_reference = f"synthetic://decision/{sku.lower()}"
    capabilities = {"publisherDesignationResponseMatch": {"status": "available"}, "legalJudgment": {"status": "unavailable"}, "tacticalJudgment": {"status": "unavailable"}, "threatAssessment": {"status": "unavailable"}, "useOfForce": {"status": "unavailable"}, "scoring": {"status": "not_applicable"}, "qualification": {"status": "unavailable"}, "physicalShotTiming": {"status": "unavailable"}}
    profile = {
        "missionFamily": "decisionScenarioEvaluation", "resultPackageType": "decisionScenarioResult", "resultPackageVersion": "1",
        "profileId": f"decision-{sku.lower()}-v1", "profileVersion": "1",
        "publisherAuthority": {"id": "synthetic-decision-publisher", "name": "Synthetic Decision Publisher"},
        "sourceDocuments": [{"id": f"source-{sku.lower()}", "title": f"{name} publisher designation", "revision": "2026.1", "reference": source_reference, "effectiveFrom": "2026-08-19T00:00:00-04:00", "sha256": "d" * 64}],
        "approval": {"status": "approved", "authorityId": "DECISION-SYNTHETIC-AUTHORITY"},
        "effective": {"from": "2026-08-19T00:00:00-04:00", "until": None},
        "lifecycle": {"status": "active", "supersededBy": None, "suspended": False, "revoked": False},
        "componentBindings": {"targetProfileId": target_id, "targetProfileVersion": "1", "registrationDigest": registration["digest"], "geometryDigest": geometry["digest"]},
        "claimGrade": "publisher_designation_response_match", "presentationMode": "fixed_profile_order",
        "timingPolicy": {"mode": "untimed", "clockSource": "backend_orchestration_clock", "physicalShotTiming": "unavailable"},
        "presentations": [{"scenarioId": f"scenario-{sku.lower()}", "presentationId": f"presentation-{sku.lower()}", "title": f"{name} governed presentation", "publisherDesignation": {"id": f"designation-{sku.lower()}", "label": publisher_label, "expectedResponse": expected, "sourceReference": source_reference}, "responsePolicy": {"minimumObservations": 1 if expected == "observation_required" else 0, "maximumObservations": 1 if expected == "observation_required" else 0, "allowExplicitNoObservation": True, "authorizedEntityIds": ["scenario-subject"]}, "transition": "complete"}],
        "capabilityStates": capabilities,
    }
    components = {"geometry": geometry, "registration": registration, "scoring": scoring, "mission": _component(f"{target_id}-mission", profile)}
    return {
        "schemaVersion": "sczn3-target-execution-contract-v1", "contractId": f"tec-{target_id}", "contractVersion": "1", "authorityContractVersion": "ADR-001-v1", "lifecycleStatus": "supported", "supportStatus": "supported",
        "approval": {"status": "approved", "authorityId": "DECISION-SYNTHETIC-AUTHORITY", "approvedAt": "2026-08-19T20:34:55-04:00"}, "effective": {"from": "2026-08-19T20:34:55-04:00", "until": None},
        "targetProfile": {"id": target_id, "version": "1", "atpId": f"atp-{target_id}-v1", "authorityId": f"authority-{target_id}-v1", "publisher": {"id": "synthetic-decision-publisher", "name": "Synthetic Decision Publisher"}, "product": {"id": f"product-{sku.lower()}", "name": name, "sku": sku}},
        "components": components, "missionFamily": "decisionScenarioEvaluation", "resultPackageType": "decisionScenarioResult", "resultPackageVersion": "1",
        "executor": {"id": "decision-scenario-evaluator", "version": "1"}, "secAdapter": {"id": "decision-scenario-family", "version": "1", "scoringPresentationFamily": "evidence_only"}, "preservationValidator": {"id": "decision-scenario-preservation", "version": "1"},
        "session": {"capabilityStates": capabilities, "officialMissionRequired": False},
        "unsupportedUses": ["legal_judgment", "tactical_judgment", "threat_assessment", "use_of_force", "scoring", "qualification", "physical_shot_timing", "artwork_inference", "target_name_inference"],
    }


def contracts():
    return (
        _contract(FIXTURE_TARGET_IDS[0], "Friendly-Named Observation Scenario", "DEC-A01", "observation_required", "Publisher says respond"),
        _contract(FIXTURE_TARGET_IDS[1], "Danger-Named No-Response Scenario", "DEC-B02", "no_observation_expected", "Publisher says do not respond"),
        _contract(FIXTURE_TARGET_IDS[2], "Data-Only Independent Scenario", "DEC-C03", "observation_required", "Publisher data-only response"),
    )
