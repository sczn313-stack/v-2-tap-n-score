"""Controlled fact adapters for immutable, backend-preserved SECs."""
from __future__ import annotations

from typing import Any, Callable, Dict, Mapping

from target_execution_contract import canonical_json, digest


class ProgressionFactError(ValueError):
    pass


def _result_hash_valid(result: Mapping[str, Any]) -> bool:
    claimed = str(result.get("resultHash") or "")
    canonical = {key: value for key, value in result.items() if key not in {"resultHash", "resultIdentity"}}
    return len(claimed) == 64 and claimed == digest(canonical_json(canonical)) and result.get("resultIdentity") == f"SCZN3-RESULT-{claimed[:24].upper()}"


def _precision(result: Mapping[str, Any]) -> Any:
    scoring = result.get("scoring", {})
    if result.get("missionFamily") != "precisionRingScore" or scoring.get("status") != "complete" or not isinstance(scoring.get("total"), (int, float)):
        raise ProgressionFactError("progression_source_precision_result_invalid")
    return scoring["total"]


def _qualification(result: Mapping[str, Any]) -> Any:
    claim, performance = result.get("claim", {}), result.get("performance", {})
    if result.get("missionFamily") != "qualificationCourseEvaluation" or claim.get("claimGrade") != "practice_simulation" or performance.get("outcome") not in {"pass", "fail", "incomplete", "not_evaluable"}:
        raise ProgressionFactError("progression_source_qualification_result_invalid")
    return performance["outcome"]


def _cue(result: Mapping[str, Any]) -> Any:
    if result.get("missionFamily") != "cueDrillOrchestration" or result.get("status") not in {"complete", "stopped_incomplete"}:
        raise ProgressionFactError("progression_source_cue_result_invalid")
    return result["status"]


def _diagnostic(result: Mapping[str, Any]) -> Any:
    claim, reconciliation = result.get("claim", {}), result.get("reconciliation", {})
    if result.get("missionFamily") != "diagnosticFeedbackEvaluation" or claim.get("claimGrade") != "publisher_label_match" or not isinstance(reconciliation.get("matched"), int):
        raise ProgressionFactError("progression_source_diagnostic_result_invalid")
    return reconciliation["matched"]


def _decision(result: Mapping[str, Any]) -> Any:
    claim, reconciliation = result.get("claim", {}), result.get("reconciliation", {})
    if result.get("missionFamily") != "decisionScenarioEvaluation" or claim.get("claimGrade") != "publisher_designation_response_match" or not isinstance(reconciliation.get("matched"), int):
        raise ProgressionFactError("progression_source_decision_result_invalid")
    return reconciliation["matched"]


FACT_ADAPTERS: Dict[str, tuple[str, str, Callable[[Mapping[str, Any]], Any]]] = {
    "precision_score_total": ("precisionRingScore", "precisionScoreResult", _precision),
    "qualification_practice_outcome": ("qualificationCourseEvaluation", "qualificationResult", _qualification),
    "cue_terminal_status": ("cueDrillOrchestration", "cueDrillResult", _cue),
    "diagnostic_publisher_match_count": ("diagnosticFeedbackEvaluation", "diagnosticFeedbackResult", _diagnostic),
    "decision_publisher_match_count": ("decisionScenarioEvaluation", "decisionScenarioResult", _decision),
}


def extract_preserved_fact(record: Mapping[str, Any], subject_id: str, fact_id: str) -> Dict[str, Any]:
    adapter = FACT_ADAPTERS.get(fact_id)
    if not adapter:
        raise ProgressionFactError("progression_fact_adapter_unavailable")
    artifact = record.get("artifact")
    if not isinstance(artifact, Mapping) or record.get("artifactSha256") != digest(canonical_json(artifact)):
        raise ProgressionFactError("progression_source_artifact_hash_mismatch")
    subject = artifact.get("progressionSubjectAuthority", {})
    if not isinstance(subject, Mapping) or subject.get("authority") != "backend" or subject.get("progressionSubjectId") != subject_id:
        raise ProgressionFactError("progression_source_subject_mismatch")
    result = artifact.get("authorityPackage") or artifact.get("backendAuthorityPackage")
    if not isinstance(result, Mapping) or result.get("authoritySource") != "backend-authoritative" or not _result_hash_valid(result):
        raise ProgressionFactError("progression_source_result_authority_invalid")
    mission, package_type, extractor = adapter
    if result.get("missionFamily") != mission or result.get("resultPackageType") != package_type:
        raise ProgressionFactError("progression_source_family_mismatch")
    value = extractor(result)
    return {
        "status": "eligible", "sessionId": record["sessionId"], "artifactSha256": record["artifactSha256"],
        "preservedAt": record["preservedAt"], "resultIdentity": result["resultIdentity"], "resultHash": result["resultHash"],
        "target": result.get("target"), "missionFamily": mission, "resultPackageType": package_type,
        "resultPackageVersion": result.get("resultPackageVersion"), "claimGrade": result.get("claim", {}).get("claimGrade", "not_applicable"),
        "factId": fact_id, "factValue": value, "factAdapterAuthority": "backend-controlled-family-adapter",
    }
