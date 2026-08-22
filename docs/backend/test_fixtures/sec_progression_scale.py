"""Three synthetic progression programs and immutable SEC facts."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

from target_execution_contract import canonical_json, component_digest, digest


FIXTURE_TARGET_IDS = ("fixture_progression_precision", "fixture_progression_qualification", "fixture_progression_data_only")
SUBJECT_ID, SUBJECT_TOKEN = "subject-synthetic-001", "synthetic-subject-token"
ASSET_SHA256 = "cb906e88e090b787369acb6d6ad2900b0f2c46d07507fd2175b90f5a387a5ee0"


def _component(component_id: str, definition: Dict[str, Any]) -> Dict[str, Any]:
    item = {"id": component_id, "version": "1", "status": "approved", "digest": "", "definition": deepcopy(definition)}
    item["digest"] = component_digest(item); return item


def _contract(target_id: str, name: str, sku: str, fact_id: str, source_family: str, source_package: str, threshold: Any, required: int, profile_version: str = "1") -> Dict[str, Any]:
    registration = _component(f"{target_id}-registration", {"role": "evidence_capture_asset", "assetPath": "backend/test_fixtures/target_execution_scale.svg", "assetSha256": ASSET_SHA256, "assetAlt": name, "coordinateConvention": "normalized_source_image_top_left"})
    geometry = _component(f"{target_id}-geometry", {"status": "not_applicable_to_cross_session_progression", "physicalMeasurement": "not_applicable"})
    scoring = _component(f"{target_id}-scoring", {"status": "not_applicable", "reason": "progression_consumes_existing_authoritative_facts"})
    comparator = "equal" if isinstance(threshold, str) else "greater_than_or_equal"
    profile = {
        "missionFamily": "secProgressionEvaluation", "resultPackageType": "secProgressionResult", "resultPackageVersion": "1",
        "profileId": f"progression-{sku.lower()}", "profileVersion": profile_version, "programId": f"program-{sku.lower()}", "programName": name,
        "publisherAuthority": {"id": "synthetic-progression-publisher", "name": "Synthetic Progression Publisher"},
        "sourceDocuments": [{"id": f"source-{sku.lower()}", "title": f"{name} governed progression rules", "revision": profile_version, "reference": f"synthetic://progression/{sku.lower()}/{profile_version}", "effectiveFrom": "2026-08-19T00:00:00-04:00", "sha256": "e" * 64}],
        "approval": {"status": "approved", "authorityId": "PROGRESSION-SYNTHETIC-AUTHORITY"}, "effective": {"from": "2026-08-19T00:00:00-04:00", "until": None}, "lifecycle": {"status": "active", "supersededBy": None, "suspended": False, "revoked": False},
        "componentBindings": {"targetProfileId": target_id, "targetProfileVersion": "1", "registrationDigest": registration["digest"]},
        "claimGrade": "governed_progression_result", "subjectContinuity": {"authority": "backend_required", "verifiedRealWorldIdentity": "not_established"},
        "inputEligibility": {"factAdapterId": fact_id, "allowedTuples": [{"missionFamily": source_family, "resultPackageType": source_package, "resultPackageVersion": "1"}]},
        "consumptionPolicy": "single_use_within_profile_lineage", "startingLevelId": "level-0",
        "levels": [{"levelId": "level-0", "label": "Starting Level", "order": 0}, {"levelId": "level-1", "label": "Level One", "order": 1, "advanceCondition": {"factId": fact_id, "comparator": comparator, "threshold": threshold, "aggregation": "count_meeting_condition", "requiredSECCount": required, "maximumLevelAdvance": 1}}],
        "capabilityStates": {"progression": {"status": "available"}, "verifiedIdentity": {"status": "not_established"}, "certification": {"status": "unavailable"}, "readiness": {"status": "unavailable"}, "historicalRescoring": {"status": "not_applicable"}},
    }
    components = {"geometry": geometry, "registration": registration, "scoring": scoring, "mission": _component(f"{target_id}-mission-{profile_version}", profile)}
    return {"schemaVersion": "sczn3-target-execution-contract-v1", "contractId": f"tec-{target_id}-{profile_version}", "contractVersion": profile_version, "authorityContractVersion": "ADR-001-v1", "lifecycleStatus": "supported", "supportStatus": "supported", "approval": {"status": "approved", "authorityId": "PROGRESSION-SYNTHETIC-AUTHORITY", "approvedAt": "2026-08-19T20:55:42-04:00"}, "effective": {"from": "2026-08-19T20:55:42-04:00", "until": None}, "targetProfile": {"id": target_id, "version": "1", "atpId": f"atp-{target_id}-v1", "authorityId": f"authority-{target_id}-v1", "publisher": {"id": "synthetic-progression-publisher", "name": "Synthetic Progression Publisher"}, "product": {"id": f"product-{sku.lower()}", "name": name, "sku": sku}}, "components": components, "missionFamily": "secProgressionEvaluation", "resultPackageType": "secProgressionResult", "resultPackageVersion": "1", "executor": {"id": "sec-progression-evaluator", "version": "1"}, "secAdapter": {"id": "sec-progression-family", "version": "1", "scoringPresentationFamily": "evidence_only"}, "preservationValidator": {"id": "sec-progression-preservation", "version": "1"}, "session": {"capabilityStates": profile["capabilityStates"], "officialMissionRequired": False}, "unsupportedUses": ["shooting_session_execution", "historical_rescoring", "verified_identity", "certification", "readiness", "arbitrary_fact_paths", "scripts"]}


def contracts():
    return (_contract(FIXTURE_TARGET_IDS[0], "Precision Progression Ladder", "PROG-A01", "precision_score_total", "precisionRingScore", "precisionScoreResult", 8, 2), _contract(FIXTURE_TARGET_IDS[1], "Practice Course Progression", "PROG-B02", "qualification_practice_outcome", "qualificationCourseEvaluation", "qualificationResult", "pass", 2), _contract(FIXTURE_TARGET_IDS[2], "Data-Only Independent Progression", "PROG-C03", "precision_score_total", "precisionRingScore", "precisionScoreResult", 5, 1))


def progression_v2_contract(): return _contract(FIXTURE_TARGET_IDS[0], "Precision Progression Ladder", "PROG-A01", "precision_score_total", "precisionRingScore", "precisionScoreResult", 10, 2, "2")


def _result(session_id: str, mission: str, package: str, value: Any) -> Dict[str, Any]:
    result = {"ok": True, "status": "complete", "authoritySource": "backend-authoritative", "authoritativeSessionId": session_id, "missionFamily": mission, "resultPackageType": package, "resultPackageVersion": "1", "target": {"id": f"source-{session_id}", "version": "1", "publisher": {"id": "synthetic-source", "name": "Synthetic Source"}, "product": {"id": f"product-{session_id}", "name": "Source Target", "sku": session_id.upper()}}, "reconciliation": {"status": "reconciled"}}
    if mission == "precisionRingScore": result["scoring"] = {"status": "complete", "total": value}
    elif mission == "qualificationCourseEvaluation": result.update({"claim": {"claimGrade": "practice_simulation"}, "performance": {"outcome": value}})
    result["resultHash"] = digest(canonical_json(result)); result["resultIdentity"] = f"SCZN3-RESULT-{result['resultHash'][:24].upper()}"; return result


def source_record(session_id: str, mission: str, package: str, value: Any, subject_id: str = SUBJECT_ID, preserved_index: int = 1):
    artifact = {"sessionId": session_id, "sessionIdAuthority": "backend", "savedToSEC": True, "progressionSubjectAuthority": {"progressionSubjectId": subject_id, "authority": "backend", "verifiedRealWorldIdentity": "not_established"}, "authorityPackage": _result(session_id, mission, package, value)}
    return {"sessionId": session_id, "targetId": f"source-{session_id}", "artifact": artifact, "artifactSha256": digest(canonical_json(artifact)), "preservedAt": f"2026-08-19T21:{preserved_index:02d}:00-04:00"}


def source_records():
    return (source_record("precision-1", "precisionRingScore", "precisionScoreResult", 9, preserved_index=1), source_record("precision-2", "precisionRingScore", "precisionScoreResult", 8, preserved_index=2), source_record("qualification-1", "qualificationCourseEvaluation", "qualificationResult", "pass", preserved_index=3), source_record("qualification-2", "qualificationCourseEvaluation", "qualificationResult", "pass", preserved_index=4), source_record("data-1", "precisionRingScore", "precisionScoreResult", 6, preserved_index=5))
