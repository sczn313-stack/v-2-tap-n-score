"""Reusable, fail-closed Target Family Conformance/Admission evaluator."""
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, Mapping


REGISTRY_PATH = Path(__file__).resolve().parent / "registries" / "mfam_family_conformance.json"
AUTHORITY_REGISTRY_PATH = Path(__file__).resolve().parent / "registries" / "mfam_family_authority.json"
SCHEMA_ID = "sczn3-target-family-conformance-v1"


class MFAMConformanceError(RuntimeError):
    """Raised when admission evidence or its registry contract is inconsistent."""


def _index(items: list[Mapping[str, Any]], key: str) -> Dict[str, Dict[str, Any]]:
    result: Dict[str, Dict[str, Any]] = {}
    for item in items:
        identity = item.get(key)
        if not isinstance(identity, str) or not identity or identity in result:
            raise MFAMConformanceError(f"mfam_conformance_invalid_{key}")
        result[identity] = dict(item)
    return result


def _evaluate(payload: Mapping[str, Any], face_id: str) -> Dict[str, Any]:
    evaluations = _index(payload.get("evaluations") or [], "faceId")
    contracts = _index(payload.get("contracts") or [], "contractId")
    evaluation = evaluations.get(face_id)
    if not evaluation:
        raise MFAMConformanceError("mfam_conformance_face_not_evaluated")
    contract = contracts.get(evaluation.get("contractId"))
    if not contract:
        raise MFAMConformanceError(f"mfam_conformance_contract_missing:{face_id}")
    evidence = _index(evaluation.get("gateEvidence") or [], "gateId")
    required_gate_ids = [gate["gateId"] for gate in contract.get("requiredGates") or []]
    if set(evidence) != set(required_gate_ids):
        raise MFAMConformanceError(f"mfam_conformance_gate_set_mismatch:{face_id}")
    missing_gate_ids = [gate_id for gate_id in required_gate_ids if evidence[gate_id].get("status") != "PROVEN"]
    calculated = "ADMITTED" if not missing_gate_ids and evaluation.get("targetProfileId") else "HOLD"
    if calculated != evaluation.get("disposition"):
        raise MFAMConformanceError(f"mfam_conformance_disposition_mismatch:{face_id}")
    missing_facts = evaluation.get("irreducibleMissingFacts") or []
    if calculated == "ADMITTED" and missing_facts:
        raise MFAMConformanceError(f"mfam_conformance_admitted_with_gap:{face_id}")
    if calculated == "HOLD" and len(missing_facts) != 1:
        raise MFAMConformanceError(f"mfam_conformance_hold_not_irreducible:{face_id}")
    return deepcopy({**evaluation, "missingGateIds": missing_gate_ids, "calculatedDisposition": calculated})


def _load() -> Dict[str, Any]:
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    authority = json.loads(AUTHORITY_REGISTRY_PATH.read_text(encoding="utf-8"))
    if payload.get("schemaId") != SCHEMA_ID or payload.get("status") != "governed":
        raise MFAMConformanceError("mfam_conformance_registry_not_governed")
    pointer = authority.get("familyConformanceRegistry") or {}
    if payload.get("registryId") != pointer.get("registryId"):
        raise MFAMConformanceError("mfam_conformance_registry_pointer_mismatch")
    if payload.get("authorityRegistryId") != authority.get("registryId"):
        raise MFAMConformanceError("mfam_conformance_authority_registry_mismatch")
    contracts = _index(payload.get("contracts") or [], "contractId")
    packages = _index(payload.get("reusableEvidencePackages") or [], "evidencePackageId")
    inventory = json.loads((REGISTRY_PATH.parent / "mfam_inventory_audit.json").read_text(encoding="utf-8"))
    faces = _index(inventory.get("faces") or [], "faceId")
    bindings = _index(authority.get("targetProfileBindings") or [], "targetProfileId")
    for evaluation in payload.get("evaluations") or []:
        face_id = evaluation.get("faceId")
        face = faces.get(face_id)
        if not face:
            raise MFAMConformanceError(f"mfam_conformance_inventory_face_missing:{face_id}")
        if evaluation.get("productId") != face.get("productId") or evaluation.get("representationId") != face.get("representationId"):
            raise MFAMConformanceError(f"mfam_conformance_identity_mismatch:{face_id}")
        if evaluation.get("contractId") not in contracts:
            raise MFAMConformanceError(f"mfam_conformance_contract_missing:{face_id}")
        for gate in evaluation.get("gateEvidence") or []:
            for package_id in gate.get("evidencePackageIds") or []:
                if package_id not in packages:
                    raise MFAMConformanceError(f"mfam_conformance_evidence_package_missing:{face_id}:{package_id}")
        resolved = _evaluate(payload, face_id)
        profile_id = resolved.get("targetProfileId")
        if resolved["disposition"] == "ADMITTED" and profile_id not in bindings:
            raise MFAMConformanceError(f"mfam_conformance_binding_missing:{face_id}")
    admitted = {
        evaluation.get("targetProfileId")
        for evaluation in payload.get("evaluations") or []
        if evaluation.get("disposition") == "ADMITTED"
    }
    family_bound = {
        binding["targetProfileId"]
        for binding in authority.get("targetProfileBindings") or []
        if binding.get("familyAuthorityPackageId")
    }
    if admitted != family_bound:
        raise MFAMConformanceError("mfam_conformance_runtime_binding_set_mismatch")
    payload["_index"] = {"contracts": contracts, "packages": packages}
    return payload


_REGISTRY = _load()


def family_conformance_contract(contract_id: str) -> Dict[str, Any]:
    contract = _REGISTRY["_index"]["contracts"].get(str(contract_id))
    if not contract:
        raise MFAMConformanceError("mfam_conformance_contract_not_found")
    return deepcopy(contract)


def evaluate_family_candidate(face_id: str) -> Dict[str, Any]:
    return _evaluate(_REGISTRY, str(face_id))


def run_family_admission_batch(contract_id: str, face_ids: list[str]) -> Dict[str, Any]:
    results = [evaluate_family_candidate(face_id) for face_id in face_ids]
    if any(result["contractId"] != contract_id for result in results):
        raise MFAMConformanceError("mfam_conformance_batch_contract_mismatch")
    return deepcopy({
        "contractId": contract_id,
        "candidatesEvaluated": len(results),
        "admitted": [result for result in results if result["disposition"] == "ADMITTED"],
        "hold": [result for result in results if result["disposition"] == "HOLD"],
    })


def scale_proof() -> Dict[str, Any]:
    return deepcopy(_REGISTRY["scaleProof"])
