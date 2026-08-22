"""Three synthetic Course Profiles for Qualification scale acceptance."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

from target_execution_contract import component_digest


FIXTURE_TARGET_IDS = ("fixture_qualification_pistol", "fixture_qualification_rifle", "fixture_qualification_data_only")
ASSET_SHA256 = "cb906e88e090b787369acb6d6ad2900b0f2c46d07507fd2175b90f5a387a5ee0"


def _component(component_id: str, definition: Dict[str, Any]) -> Dict[str, Any]:
    component = {"id": component_id, "version": "1", "status": "approved", "digest": "", "definition": deepcopy(definition)}
    component["digest"] = component_digest(component)
    return component


def _contract(target_id: str, name: str, sku: str, profile_id: str, stages: list[Dict[str, Any]], threshold: int) -> Dict[str, Any]:
    capabilities = {
        "qualificationPractice": {"status": "available"},
        "officialQualification": {"status": "unavailable", "reason": "official_administration_authority_not_implemented"},
        "credentialIssuance": {"status": "unavailable"},
        "externalReporting": {"status": "unavailable"},
        "physicalShotTiming": {"status": "unavailable"},
    }
    geometry = _component(f"{target_id}-geometry", {"status": "ugo_zone_geometry", "coordinateSystem": "normalized_source_image_top_left", "zones": [
        {"zoneId": "center", "shape": "circle", "cx": 0.5, "cy": 0.5, "radius": 0.18, "priority": 20},
        {"zoneId": "paper", "shape": "rectangle", "xMin": 0.05, "xMax": 0.95, "yMin": 0.05, "yMax": 0.95, "priority": 10},
    ], "physicalMeasurement": "unavailable"})
    registration = _component(f"{target_id}-registration", {"role": "scorable_canonical_asset", "assetPath": "backend/test_fixtures/target_execution_scale.svg", "assetSha256": ASSET_SHA256, "assetAlt": name, "coordinateConvention": "normalized_source_image_top_left"})
    scoring = _component(f"{target_id}-scoring", {"status": "governed", "zoneValues": {"center": 10, "paper": 4, "outside": 0}, "missingRoundValue": 0, "extraObservationTreatment": "not_evaluable"})
    mission = {
        "missionFamily": "qualificationCourseEvaluation", "resultPackageType": "qualificationResult", "resultPackageVersion": "1",
        "profileId": profile_id, "profileVersion": "1", "courseName": name, "courseMode": "practice_simulation",
        "claimantClass": "synthetic_practice_shooter",
        "governingAuthority": {"id": f"synthetic-authority-{profile_id}", "name": "Synthetic Qualification Authority", "authorityScope": "fixture_practice_course_definition"},
        "sourceDocuments": [{"id": f"source-{profile_id}", "title": f"{name} governed fixture course", "revision": "2026.1", "reference": f"synthetic://qualification/{profile_id}", "effectiveFrom": "2026-08-19T00:00:00-04:00", "sha256": "b" * 64}],
        "approval": {"status": "approved", "authorityId": "QUALIFICATION-SYNTHETIC-AUTHORITY"},
        "effective": {"from": "2026-08-19T00:00:00-04:00", "until": None},
        "lifecycle": {"status": "active", "supersededBy": None, "suspended": False, "revoked": False},
        "componentBindings": {"targetProfileId": target_id, "targetProfileVersion": "1", "geometryDigest": geometry["digest"], "scoringDigest": scoring["digest"]},
        "resultVocabulary": ["pass", "fail", "incomplete", "not_evaluable"],
        "allowedClaimGrades": ["practice_simulation"],
        "timingPolicy": {"clockSource": "backend_orchestration_clock", "physicalShotTiming": "unavailable"},
        "targetInstances": [{"targetInstanceId": "paper-1", "targetProfileId": target_id}],
        "stages": stages,
        "threshold": {"operator": "greater_than_or_equal", "value": threshold, "unit": "points"},
        "incompleteCourseOutcome": "incomplete", "capabilityStates": capabilities,
    }
    components = {"geometry": geometry, "registration": registration, "scoring": scoring, "mission": _component(f"{target_id}-mission", mission)}
    return {
        "schemaVersion": "sczn3-target-execution-contract-v1", "contractId": f"tec-{target_id}", "contractVersion": "1", "authorityContractVersion": "ADR-001-v1",
        "lifecycleStatus": "supported", "supportStatus": "supported",
        "approval": {"status": "approved", "authorityId": "QUALIFICATION-SYNTHETIC-AUTHORITY", "approvedAt": "2026-08-19T18:41:11-04:00"},
        "effective": {"from": "2026-08-19T18:41:11-04:00", "until": None},
        "targetProfile": {"id": target_id, "version": "1", "atpId": f"atp-{target_id}-v1", "authorityId": f"authority-{target_id}-v1", "publisher": {"id": "synthetic-qualification-publisher", "name": "Synthetic Qualification Publisher"}, "product": {"id": f"product-{sku.lower()}", "name": name, "sku": sku}},
        "components": components,
        "missionFamily": "qualificationCourseEvaluation", "resultPackageType": "qualificationResult", "resultPackageVersion": "1",
        "executor": {"id": "qualification-executor", "version": "1"},
        "secAdapter": {"id": "qualification-family", "version": "1", "scoringPresentationFamily": "qualification_pass_fail"},
        "preservationValidator": {"id": "qualification-preservation", "version": "1"},
        "session": {"capabilityStates": capabilities, "officialMissionRequired": False},
        "unsupportedUses": ["official_qualification", "credential_issuance", "instructor_attestation", "facility_approval", "external_reporting", "physical_shot_timing"],
    }


def contracts():
    pistol_stages = [
        {"stageId": "pistol-near", "title": "Pistol Near", "instruction": "Record one governed observation.", "distance": {"value": 7, "unit": "yd"}, "requiredRounds": 1, "targetInstanceId": "paper-1", "allowedZoneIds": ["center", "paper"]},
        {"stageId": "pistol-far", "title": "Pistol Far", "instruction": "Record one governed observation.", "distance": {"value": 15, "unit": "yd"}, "requiredRounds": 1, "targetInstanceId": "paper-1", "allowedZoneIds": ["center", "paper"]},
    ]
    rifle_stages = [
        {"stageId": "rifle-standing", "title": "Rifle Standing", "distance": {"value": 25, "unit": "yd"}, "requiredRounds": 1, "targetInstanceId": "paper-1", "allowedZoneIds": ["center", "paper"]},
        {"stageId": "rifle-supported", "title": "Rifle Supported", "distance": {"value": 50, "unit": "yd"}, "requiredRounds": 1, "targetInstanceId": "paper-1", "allowedZoneIds": ["center", "paper"]},
    ]
    data_only_stages = [
        {"stageId": "course-stage", "title": "Course Stage", "distance": {"value": 10, "unit": "m"}, "requiredRounds": 1, "targetInstanceId": "paper-1", "allowedZoneIds": ["center", "paper"]},
    ]
    return (
        _contract(FIXTURE_TARGET_IDS[0], "Pistol Practice Course", "QUAL-A01", "qualification-pistol-v1", pistol_stages, 20),
        _contract(FIXTURE_TARGET_IDS[1], "Rifle Practice Course", "QUAL-B02", "qualification-rifle-v1", rifle_stages, 15),
        _contract(FIXTURE_TARGET_IDS[2], "Data-Only Practice Course", "QUAL-C03", "qualification-data-only-v1", data_only_stages, 10),
    )
