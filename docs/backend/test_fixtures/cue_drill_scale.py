"""Three synthetic products for Cue/Drill family scale acceptance."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, Optional

from target_execution_contract import component_digest


FIXTURE_TARGET_IDS = ("fixture_cue_fixed", "fixture_cue_memory", "fixture_cue_external")
ASSET_SHA256 = "cb906e88e090b787369acb6d6ad2900b0f2c46d07507fd2175b90f5a387a5ee0"


def _component(component_id: str, definition: Dict[str, Any]) -> Dict[str, Any]:
    component = {"id": component_id, "version": "1", "status": "approved", "digest": "", "definition": deepcopy(definition)}
    component["digest"] = component_digest(component)
    return component


def _contract(target_id: str, name: str, sku: str, mission: Dict[str, Any], entities: list[Dict[str, Any]]) -> Dict[str, Any]:
    components = {
        "geometry": _component(f"{target_id}-geometry", {"status": "ugo_entity_geometry", "coordinateSystem": "normalized_source_image_top_left", "entities": entities, "physicalMeasurement": "unavailable"}),
        "registration": _component(f"{target_id}-registration", {"role": "evidence_capture_asset", "assetPath": "backend/test_fixtures/target_execution_scale.svg", "assetSha256": ASSET_SHA256, "assetAlt": name, "coordinateConvention": "normalized_source_image_top_left"}),
        "scoring": _component(f"{target_id}-scoring", {"status": "not_applicable", "reason": "cue_drill_orchestration_is_not_scoring"}),
        "mission": _component(f"{target_id}-mission", mission),
    }
    return {
        "schemaVersion": "sczn3-target-execution-contract-v1",
        "contractId": f"tec-{target_id}", "contractVersion": "1", "authorityContractVersion": "ADR-001-v1",
        "lifecycleStatus": "supported", "supportStatus": "supported",
        "approval": {"status": "approved", "authorityId": "CUE-DRILL-SYNTHETIC-AUTHORITY", "approvedAt": "2026-08-19T18:12:59-04:00"},
        "effective": {"from": "2026-08-19T18:12:59-04:00", "until": None},
        "targetProfile": {"id": target_id, "version": "1", "atpId": f"atp-{target_id}-v1", "authorityId": f"authority-{target_id}-v1", "publisher": {"id": "synthetic-cue-publisher", "name": "Synthetic Cue Publisher"}, "product": {"id": f"product-{sku.lower()}", "name": name, "sku": sku}},
        "components": components,
        "missionFamily": "cueDrillOrchestration", "resultPackageType": "cueDrillResult", "resultPackageVersion": "1",
        "executor": {"id": "cue-drill-orchestrator", "version": "1"},
        "secAdapter": {"id": "cue-drill-family", "version": "1", "scoringPresentationFamily": "evidence_only"},
        "preservationValidator": {"id": "cue-drill-preservation", "version": "1"},
        "session": {"capabilityStates": mission["capabilityStates"], "officialMissionRequired": False},
        "unsupportedUses": ["scoring", "qualification", "diagnosis", "decision_judgment", "physical_shot_timing"],
    }


def _mission(profile_id: str, selection: str, sequence: str, timing: Dict[str, Any], stages: list[Dict[str, Any]], repeat_count: Optional[int] = None) -> Dict[str, Any]:
    value = {
        "missionFamily": "cueDrillOrchestration", "resultPackageType": "cueDrillResult", "resultPackageVersion": "1",
        "profileId": profile_id, "profileVersion": "1", "cueSelectionMode": selection, "sequenceRule": sequence,
        "timingPolicy": timing, "stages": stages,
        "capabilityStates": {"orchestration": {"status": "available"}, "scoring": {"status": "not_applicable"}, "qualification": {"status": "unavailable"}, "physicalShotTiming": {"status": "unavailable"}},
    }
    if repeat_count is not None:
        value["repeatCount"] = repeat_count
    return value


def contracts():
    fixed_entities = [
        {"entityId": "left", "shape": "circle", "cx": 0.25, "cy": 0.5, "radius": 0.18},
        {"entityId": "right", "shape": "circle", "cx": 0.75, "cy": 0.5, "radius": 0.18},
    ]
    fixed = _contract(FIXTURE_TARGET_IDS[0], "Fixed Command Paper", "CUE-A01", _mission(
        "cue-fixed-v1", "fixed_order", "single_pass",
        {"mode": "untimed", "clockSource": "backend_orchestration_clock", "physicalShotTiming": "unavailable"},
        [
            {"stageId": "stage-left", "title": "Left", "cues": [{"cueId": "cue-left", "label": "Left", "entityIds": ["left"], "responsePolicy": {"expectedObservationCount": 1, "allowNoObservation": True}}]},
            {"stageId": "stage-right", "title": "Right", "cues": [{"cueId": "cue-right", "label": "Right", "entityIds": ["right"], "responsePolicy": {"expectedObservationCount": 1, "allowNoObservation": True}}]},
        ],
    ), fixed_entities)
    overlap_entities = [
        {"entityId": "alpha", "shape": "rectangle", "xMin": 0.1, "xMax": 0.65, "yMin": 0.1, "yMax": 0.9},
        {"entityId": "bravo", "shape": "rectangle", "xMin": 0.35, "xMax": 0.9, "yMin": 0.1, "yMax": 0.9},
    ]
    memory = _contract(FIXTURE_TARGET_IDS[1], "Random Memory Paper", "CUE-B02", _mission(
        "cue-memory-v1", "seeded_random", "memory_repeat",
        {"mode": "fixed_practice_window", "windowMs": 10000, "clockSource": "client_practice_clock", "physicalShotTiming": "unavailable"},
        [{"stageId": "memory", "title": "Memory", "cues": [
            {"cueId": "cue-alpha", "label": "Alpha", "entityIds": ["alpha"], "responsePolicy": {"expectedObservationCount": 1, "allowNoObservation": False}},
            {"cueId": "cue-bravo", "label": "Bravo", "entityIds": ["bravo"], "responsePolicy": {"expectedObservationCount": 1, "allowNoObservation": False}},
        ]}],
    ), overlap_entities)
    external = _contract(FIXTURE_TARGET_IDS[2], "External Command Paper", "CUE-C03", _mission(
        "cue-external-v1", "external_command", "single_pass",
        {"mode": "fixed_practice_window", "windowMs": 15000, "clockSource": "external_reported_timer", "physicalShotTiming": "unavailable"},
        [{"stageId": "external", "title": "External", "cues": [
            {"cueId": "cue-left-external", "label": "External left", "entityIds": ["left"], "responsePolicy": {"expectedObservationCount": 1, "allowNoObservation": True}},
            {"cueId": "cue-right-external", "label": "External right", "entityIds": ["right"], "responsePolicy": {"expectedObservationCount": 1, "allowNoObservation": True}},
        ]}],
    ), fixed_entities)
    return fixed, memory, external
