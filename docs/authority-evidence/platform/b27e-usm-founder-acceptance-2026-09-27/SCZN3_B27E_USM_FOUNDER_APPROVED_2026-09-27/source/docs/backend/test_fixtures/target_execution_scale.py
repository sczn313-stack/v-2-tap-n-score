"""Synthetic products that prove registration-driven execution without target wiring."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

from target_execution_contract import component_digest


FIXTURE_TARGET_IDS = ("fixture_paper_alpha", "fixture_paper_bravo")


def _component(component_id: str, definition: Dict[str, Any]) -> Dict[str, Any]:
    component = {
        "id": component_id,
        "version": "1",
        "status": "approved",
        "digest": "",
        "definition": deepcopy(definition),
    }
    component["digest"] = component_digest(component)
    return component


def smart_evidence_contract(target_id: str, product_name: str, sku: str) -> Dict[str, Any]:
    components = {
        "geometry": _component(f"{target_id}-geometry", {
            "status": "image_plane_evidence_only",
            "coordinateSystem": "normalized_source_image_top_left",
            "canonicalRegionMapping": "unavailable",
            "semanticClassification": "unavailable",
            "physicalMeasurement": "unavailable",
        }),
        "registration": _component(f"{target_id}-registration", {
            "role": "evidence_capture_asset",
            "assetPath": "backend/test_fixtures/target_execution_scale.svg",
            "assetSha256": "cb906e88e090b787369acb6d6ad2900b0f2c46d07507fd2175b90f5a387a5ee0",
            "assetAlt": f"Synthetic registered product {product_name}",
            "coordinateConvention": "normalized_source_image_top_left",
        }),
        "scoring": _component(f"{target_id}-scoring", {
            "status": "not_applicable",
            "reason": "synthetic_evidence_only_acceptance_fixture",
        }),
        "mission": _component(f"{target_id}-mission", {
            "missionFamily": "smartEvidenceCapture",
            "resultPackageType": "smartEvidenceResult",
            "resultPackageVersion": "1",
            "maxObservations": 50,
            "allowShooterDeclaredAim": True,
            "capabilityStates": {
                "evidence": {"status": "available"},
                "measurement": {"status": "unavailable"},
                "correction": {"status": "not_applicable"},
                "officialScore": {"status": "not_applicable"},
            },
        }),
    }
    return {
        "schemaVersion": "sczn3-target-execution-contract-v1",
        "contractId": f"tec-{target_id}",
        "contractVersion": "1",
        "authorityContractVersion": "ADR-001-v1",
        "lifecycleStatus": "supported",
        "supportStatus": "supported",
        "approval": {"status": "approved", "authorityId": "SCALE-ACCEPTANCE-AUTHORITY", "approvedAt": "2026-08-18T20:46:00-04:00"},
        "effective": {"from": "2026-08-18T20:46:00-04:00", "until": None},
        "targetProfile": {
            "id": target_id,
            "version": "1",
            "atpId": f"atp-{target_id}-v1",
            "authorityId": f"authority-{target_id}-v1",
            "publisher": {"id": "synthetic-publisher", "name": "Synthetic Publisher"},
            "product": {"id": f"product-{sku.lower()}", "name": product_name, "sku": sku},
        },
        "components": components,
        "missionFamily": "smartEvidenceCapture",
        "resultPackageType": "smartEvidenceResult",
        "resultPackageVersion": "1",
        "executor": {"id": "smart-evidence-capture", "version": "1"},
        "secAdapter": {"id": "smart-evidence-family", "version": "1", "scoringPresentationFamily": "not_applicable"},
        "preservationValidator": {"id": "smart-evidence-preservation", "version": "1"},
        "session": {
            "capabilityStates": components["mission"]["definition"]["capabilityStates"],
            "officialMissionRequired": False,
        },
        "unsupportedUses": ["scoring", "anatomical_interpretation", "measurement", "correction"],
    }


def contracts():
    return (
        smart_evidence_contract(FIXTURE_TARGET_IDS[0], "Paper Alpha", "SYN-A01"),
        smart_evidence_contract(FIXTURE_TARGET_IDS[1], "Paper Bravo", "SYN-B02"),
    )
