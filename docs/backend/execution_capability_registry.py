"""Mission-family capability registry with no target identity branches."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Dict, Mapping, Optional

from executors import collection_hand_evaluator, cue_drill_orchestrator, decision_scenario_evaluator, declarative_target_score, diagnostic_feedback_evaluator, precision_open_score, qualification_executor, recreational_challenge, sec_progression_evaluator, smart_evidence_capture


@dataclass(frozen=True)
class CapabilityOwner:
    mission_family: str
    result_package_type: str
    result_package_version: str
    executor_id: str
    executor_version: str
    sec_adapter_family_id: str
    preservation_validator_id: str
    execute: Callable[[Mapping[str, Any], Any], Dict[str, Any]]
    validate_result: Callable[[Mapping[str, Any], Any], bool]
    transition: Optional[Callable[..., Dict[str, Any]]] = None


OWNERS = (
    CapabilityOwner("collectionHandEvaluation", "collectionHandResult", "1", "collection-hand-evaluator", "1", "collection-hand-family", "collection-hand-preservation", collection_hand_evaluator.execute, collection_hand_evaluator.validate_result, collection_hand_evaluator.transition),
    CapabilityOwner("cueDrillOrchestration", "cueDrillResult", "1", "cue-drill-orchestrator", "1", "cue-drill-family", "cue-drill-preservation", cue_drill_orchestrator.execute, cue_drill_orchestrator.validate_result, cue_drill_orchestrator.transition),
    CapabilityOwner("decisionScenarioEvaluation", "decisionScenarioResult", "1", "decision-scenario-evaluator", "1", "decision-scenario-family", "decision-scenario-preservation", decision_scenario_evaluator.execute, decision_scenario_evaluator.validate_result, decision_scenario_evaluator.transition),
    CapabilityOwner("qualificationCourseEvaluation", "qualificationResult", "1", "qualification-executor", "1", "qualification-family", "qualification-preservation", qualification_executor.execute, qualification_executor.validate_result, qualification_executor.transition),
    CapabilityOwner("diagnosticFeedbackEvaluation", "diagnosticFeedbackResult", "1", "diagnostic-feedback-evaluator", "1", "diagnostic-feedback-family", "diagnostic-feedback-preservation", diagnostic_feedback_evaluator.execute, diagnostic_feedback_evaluator.validate_result),
    CapabilityOwner("smartEvidenceCapture", "smartEvidenceResult", "1", "smart-evidence-capture", "1", "smart-evidence-family", "smart-evidence-preservation", smart_evidence_capture.execute, smart_evidence_capture.validate_result),
    CapabilityOwner("targetScoring", "targetScoreResult", "1", "declarative-target-score", "1", "target-scoring-family", "target-scoring-preservation", declarative_target_score.execute, declarative_target_score.validate_result),
    CapabilityOwner("precisionRingScore", "precisionScoreResult", "1", "precision-open-score", "1", "precision-open-score-family", "precision-open-score-preservation", precision_open_score.execute, precision_open_score.validate_result),
    CapabilityOwner("recreationalChallenge", "challengeResult", "1", "recreational-challenge", "1", "recreational-challenge-family", "recreational-challenge-preservation", recreational_challenge.execute, recreational_challenge.validate_result),
    CapabilityOwner("secProgressionEvaluation", "secProgressionResult", "1", "sec-progression-evaluator", "1", "sec-progression-family", "sec-progression-preservation", sec_progression_evaluator.execute, sec_progression_evaluator.validate_result),
)


class CapabilityRegistryError(ValueError):
    pass


def resolve_owner(contract: Mapping[str, Any]) -> CapabilityOwner:
    matches = [owner for owner in OWNERS if owner.mission_family == contract.get("missionFamily") and owner.result_package_type == contract.get("resultPackageType")]
    if len(matches) != 1:
        raise CapabilityRegistryError("capability_owner_unavailable")
    owner = matches[0]
    if contract.get("resultPackageVersion") != owner.result_package_version:
        raise CapabilityRegistryError("result_package_version_unsupported")
    checks = {
        "executor": (owner.executor_id, owner.executor_version),
        "secAdapter": (owner.sec_adapter_family_id, contract.get("secAdapter", {}).get("version")),
        "preservationValidator": (owner.preservation_validator_id, contract.get("preservationValidator", {}).get("version")),
    }
    if contract.get("executor", {}).get("id") != checks["executor"][0] or contract.get("executor", {}).get("version") != checks["executor"][1]:
        raise CapabilityRegistryError("executor_contract_mismatch")
    if contract.get("secAdapter", {}).get("id") != owner.sec_adapter_family_id:
        raise CapabilityRegistryError("sec_adapter_contract_mismatch")
    if contract.get("preservationValidator", {}).get("id") != owner.preservation_validator_id:
        raise CapabilityRegistryError("preservation_validator_contract_mismatch")
    return owner


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    return resolve_owner(contract).execute(contract, evidence)


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    return resolve_owner(contract).validate_result(contract, result)
