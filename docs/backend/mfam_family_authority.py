"""Fail-closed resolver for the governed M/FAM target-family registry.

The registry compresses evidence into family candidates, but family membership
never grants executable authority. Only an explicit GOVERNED Target Profile
binding may resolve for runtime use.
"""
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, Mapping


REGISTRY_PATH = Path(__file__).resolve().parent / "registries" / "mfam_family_authority.json"
INVENTORY_AUDIT_PATH = Path(__file__).resolve().parent / "registries" / "mfam_inventory_audit.json"
SCHEMA_ID = "sczn3-mfam-family-authority-v1"
ALLOWED_CLASSIFICATIONS = {
    "EXACTLY_THE_SAME",
    "REPRESENTATION_INK_PUBLISHER_DIFFERENCE_ONLY",
    "SAME_GOVERNED_CAPABILITY_DIFFERENT_VALUE",
    "GEOMETRY_DIFFERENCE",
    "MECHANICAL_AUTHORITY_DIFFERENCE",
    "PROCEDURE_DIFFERENCE",
    "IDENTITY_REGISTRATION_DIFFERENCE",
    "GENUINELY_DIFFERENT_TARGET_FAMILY",
    "UNPROVEN",
}


class MFAMAuthorityError(RuntimeError):
    """Raised when M/FAM evidence cannot support the requested authority."""


def _unique_index(items: list[Mapping[str, Any]], key: str) -> Dict[str, Dict[str, Any]]:
    index: Dict[str, Dict[str, Any]] = {}
    for item in items:
        value = item.get(key)
        if not isinstance(value, str) or not value:
            raise MFAMAuthorityError(f"mfam_registry_missing_{key}")
        if value in index:
            raise MFAMAuthorityError(f"mfam_registry_duplicate_{key}:{value}")
        index[value] = dict(item)
    return index


def _face_has_authorized_geometry(
    face_record: Mapping[str, Any],
    geometries: Mapping[str, Mapping[str, Any]],
) -> bool:
    """Require face-level physical proof before declaring reusable geometry."""
    geometry = geometries.get(str(face_record.get("geometryId"))) or {}
    if geometry.get("evidenceStatus") != "PROVEN_REUSABLE":
        return False
    dimensions = face_record.get("dimensions") or {}
    grid = face_record.get("grid") or {}
    spacing = grid.get("spacing") or {}
    aim = str(face_record.get("aimReference") or "")
    return bool(
        dimensions.get("width")
        and dimensions.get("height")
        and grid.get("columns")
        and grid.get("rows")
        and spacing.get("value")
        and spacing.get("unit")
        and aim
        and "UNPROVEN" not in aim.upper()
    )


def _load_registry() -> Dict[str, Any]:
    with REGISTRY_PATH.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if payload.get("schemaId") != SCHEMA_ID or payload.get("status") != "governed":
        raise MFAMAuthorityError("mfam_registry_not_governed")
    vocabulary = set(payload.get("classificationVocabulary") or [])
    if vocabulary != ALLOWED_CLASSIFICATIONS:
        raise MFAMAuthorityError("mfam_registry_classification_vocabulary_invalid")

    with INVENTORY_AUDIT_PATH.open("r", encoding="utf-8") as handle:
        inventory = json.load(handle)
    audit_pointer = payload.get("inventoryAudit") or {}
    if inventory.get("schemaId") != "sczn3-mfam-inventory-audit-v1":
        raise MFAMAuthorityError("mfam_inventory_audit_invalid")
    if inventory.get("catalogId") != audit_pointer.get("catalogId"):
        raise MFAMAuthorityError("mfam_inventory_audit_catalog_mismatch")
    if audit_pointer.get("path") != "registries/mfam_inventory_audit.json":
        raise MFAMAuthorityError("mfam_inventory_audit_path_mismatch")
    if inventory.get("authorityRegistryId") != payload.get("registryId"):
        raise MFAMAuthorityError("mfam_inventory_audit_registry_mismatch")
    for name, expected in (audit_pointer.get("counts") or {}).items():
        if inventory.get("counts", {}).get(name) != expected:
            raise MFAMAuthorityError(f"mfam_inventory_audit_count_mismatch:{name}")

    families = _unique_index(payload.get("families") or [], "familyId")
    mechanics = _unique_index(payload.get("mechanicalAuthorities") or [], "mechanicalAuthorityId")
    products = _unique_index(payload.get("products") or [], "productId")
    sources = _unique_index(payload.get("sources") or [], "sourceId")
    bindings = _unique_index(payload.get("targetProfileBindings") or [], "targetProfileId")

    for collection_name, collection in (("family", families.values()), ("mechanical_authority", mechanics.values())):
        for record in collection:
            for source_id in record.get("sourceIds") or []:
                if source_id not in sources:
                    raise MFAMAuthorityError(f"mfam_{collection_name}_source_missing:{source_id}")

    for product in products.values():
        family_id = product.get("candidateFamilyId")
        if family_id and family_id not in families:
            raise MFAMAuthorityError(f"mfam_product_family_missing:{product['productId']}")
        for authority_id in product.get("mechanicalAuthorityIds") or []:
            if authority_id not in mechanics:
                raise MFAMAuthorityError(f"mfam_product_mechanical_authority_missing:{product['productId']}")
        for source_id in product.get("sourceIds") or []:
            if source_id not in sources:
                raise MFAMAuthorityError(f"mfam_product_source_missing:{product['productId']}")

    for binding in bindings.values():
        product = products.get(binding.get("productId"))
        family = families.get(binding.get("familyId"))
        mechanical = mechanics.get(binding.get("mechanicalAuthorityId"))
        if not product or not family or not mechanical:
            raise MFAMAuthorityError(f"mfam_binding_reference_missing:{binding['targetProfileId']}")
        governed = (
            binding.get("status") == "GOVERNED"
            and product.get("runtimeStatus") == "GOVERNED"
            and family.get("status") == "GOVERNED"
            and mechanical.get("status") == "GOVERNED"
            and product.get("registration", {}).get("status") == "GOVERNED"
            and bool(binding.get("registrationPackageId"))
        )
        if not governed:
            raise MFAMAuthorityError(f"mfam_binding_not_fully_governed:{binding['targetProfileId']}")

    for pair in payload.get("pairClassifications") or []:
        if pair.get("leftProductId") not in products or pair.get("rightProductId") not in products:
            raise MFAMAuthorityError("mfam_pair_product_missing")
        classes = set(pair.get("classifications") or [])
        if not classes or not classes.issubset(ALLOWED_CLASSIFICATIONS):
            raise MFAMAuthorityError("mfam_pair_classification_invalid")
        for source_id in pair.get("sourceIds") or []:
            if source_id not in sources:
                raise MFAMAuthorityError(f"mfam_pair_source_missing:{source_id}")

    inventory_publishers = _unique_index(inventory.get("publisherAuthorities") or [], "publisherAuthorityId")
    inventory_products = _unique_index(inventory.get("products") or [], "productId")
    inventory_faces = _unique_index(inventory.get("faces") or [], "faceId")
    inventory_representations = _unique_index(
        [{"representationId": face.get("representationId")} for face in inventory_faces.values()],
        "representationId",
    )
    reference_representations = _unique_index(
        inventory.get("referenceRepresentations") or [], "representationId"
    )
    inventory_geometries = _unique_index(inventory.get("geometryCatalog") or [], "geometryId")
    inventory_procedures = _unique_index(inventory.get("procedureCatalog") or [], "procedureId")
    inventory_counts = inventory.get("counts") or {}
    computed_counts = {
        "sourceEvidenceRecords": len(products),
        "publisherIssuingAuthorities": len(inventory_publishers),
        "commercialGovernmentProducts": len(inventory_products),
        "physicalTargetFaces": len(inventory_faces),
        "productFaceRepresentationRecords": len(inventory_representations),
        "representationCatalogRecords": len(inventory_representations) + len(reference_representations),
        "geometryCatalogRecords": len(inventory_geometries),
        "procedureCatalogRecords": len(inventory_procedures),
        "candidateGovernedFamilies": len(families),
        "runtimeBindings": len(bindings),
    }
    for name, actual in computed_counts.items():
        if inventory_counts.get(name) != actual:
            raise MFAMAuthorityError(f"mfam_inventory_computed_count_mismatch:{name}")
    if set(inventory_representations).intersection(reference_representations):
        raise MFAMAuthorityError("mfam_inventory_representation_identity_collision")
    for representation in reference_representations.values():
        if representation.get("evidenceRecordId") not in products:
            raise MFAMAuthorityError(
                f"mfam_inventory_reference_evidence_missing:{representation['representationId']}"
            )

    cataloged_face_ids = set(inventory_faces)
    for inventory_product in inventory_products.values():
        if inventory_product.get("publisherAuthorityId") not in inventory_publishers:
            raise MFAMAuthorityError(f"mfam_inventory_product_publisher_missing:{inventory_product['productId']}")
        declared_faces = set(inventory_product.get("faceIds") or [])
        if not declared_faces or not declared_faces.issubset(cataloged_face_ids):
            raise MFAMAuthorityError(f"mfam_inventory_product_face_missing:{inventory_product['productId']}")
        for evidence_record_id in inventory_product.get("evidenceRecordIds") or []:
            if evidence_record_id not in products:
                raise MFAMAuthorityError(f"mfam_inventory_evidence_record_missing:{evidence_record_id}")

    claimed_faces: set[str] = set()
    claimed_face_count = 0
    for inventory_product in inventory_products.values():
        claimed_faces.update(inventory_product["faceIds"])
        claimed_face_count += len(inventory_product["faceIds"])
    if claimed_faces != cataloged_face_ids or claimed_face_count != len(cataloged_face_ids):
        raise MFAMAuthorityError("mfam_inventory_unclaimed_face")

    for face_record in inventory_faces.values():
        inventory_product = inventory_products.get(face_record.get("productId"))
        if not inventory_product or face_record["faceId"] not in inventory_product["faceIds"]:
            raise MFAMAuthorityError(f"mfam_inventory_face_product_mismatch:{face_record['faceId']}")
        if face_record.get("publisherAuthorityId") != inventory_product.get("publisherAuthorityId"):
            raise MFAMAuthorityError(f"mfam_inventory_face_publisher_mismatch:{face_record['faceId']}")
        if face_record.get("geometryId") not in inventory_geometries:
            raise MFAMAuthorityError(f"mfam_inventory_face_geometry_missing:{face_record['faceId']}")
        if face_record.get("procedureId") not in inventory_procedures:
            raise MFAMAuthorityError(f"mfam_inventory_face_procedure_missing:{face_record['faceId']}")
        family_id = face_record.get("governedFamilyId")
        if family_id and family_id not in families:
            raise MFAMAuthorityError(f"mfam_inventory_face_family_missing:{face_record['faceId']}")
        runtime_binding = face_record.get("runtimeBinding")
        if runtime_binding and runtime_binding not in bindings:
            raise MFAMAuthorityError(f"mfam_inventory_face_binding_missing:{face_record['faceId']}")
        for authority_id in face_record.get("mechanicalAuthorityIds") or []:
            if authority_id not in mechanics:
                raise MFAMAuthorityError(f"mfam_inventory_face_mechanical_authority_missing:{face_record['faceId']}")
        for source_id in face_record.get("evidenceSourceIds") or []:
            if source_id not in sources:
                raise MFAMAuthorityError(f"mfam_inventory_face_source_missing:{face_record['faceId']}:{source_id}")

    authorization_sweep = payload.get("authorizationSweep") or {}
    sweep_counts = authorization_sweep.get("counts") or {}
    bound_physical_faces = [face for face in inventory_faces.values() if face.get("runtimeBinding")]
    held_physical_faces = [face for face in inventory_faces.values() if not face.get("runtimeBinding")]
    held_authorized_geometries = [
        face for face in held_physical_faces
        if _face_has_authorized_geometry(face, inventory_geometries)
    ]
    computed_sweep_counts = {
        "authorizedNowRuntimeBindings": 0,
        "alreadyAuthorizedRuntimeBindings": len(bindings),
        "alreadyAuthorizedPhysicalFaces": len(bound_physical_faces),
        "heldPhysicalFaces": len(held_physical_faces),
        "knownHeldFacesWithAuthorizedGeometry": len(held_authorized_geometries),
    }
    if sweep_counts != computed_sweep_counts:
        raise MFAMAuthorityError("mfam_authorization_sweep_count_mismatch")
    if authorization_sweep.get("dispositions") != ["AUTHORIZED_NOW", "ALREADY_AUTHORIZED", "HOLD"]:
        raise MFAMAuthorityError("mfam_authorization_sweep_dispositions_invalid")

    payload["_index"] = {
        "families": families,
        "mechanics": mechanics,
        "products": products,
        "bindings": bindings,
    }
    payload["_inventoryIndex"] = {
        "publishers": inventory_publishers,
        "products": inventory_products,
        "faces": inventory_faces,
        "geometries": inventory_geometries,
        "procedures": inventory_procedures,
        "representations": inventory_representations,
        "referenceRepresentations": reference_representations,
    }
    payload["_inventory"] = inventory
    return payload


_REGISTRY = _load_registry()


def registry_metadata() -> Dict[str, Any]:
    return {
        "registryId": _REGISTRY["registryId"],
        "version": _REGISTRY["version"],
        "universalZeroingCapabilityId": _REGISTRY["universalZeroingCapabilityId"],
        "inventoryCatalogId": _REGISTRY["inventoryAudit"]["catalogId"],
        "authorizationSweep": deepcopy(_REGISTRY["authorizationSweep"]),
    }


def inventory_audit() -> Dict[str, Any]:
    return deepcopy(_REGISTRY["_inventory"])


def _face_admission_record(face_record: Mapping[str, Any]) -> Dict[str, Any]:
    geometry = _REGISTRY["_inventoryIndex"]["geometries"][face_record["geometryId"]]
    procedure = _REGISTRY["_inventoryIndex"]["procedures"][face_record["procedureId"]]
    runtime_binding = face_record.get("runtimeBinding")
    geometry_authorized = _face_has_authorized_geometry(
        face_record,
        _REGISTRY["_inventoryIndex"]["geometries"],
    )
    missing_facts = list(face_record.get("unresolvedFacts") or [])
    if runtime_binding:
        target_state = "KNOWN_TARGET_EXECUTION_AUTHORIZED"
        disposition = "ALREADY_AUTHORIZED"
        shooter_recovery = None
    elif geometry_authorized:
        target_state = "KNOWN_TARGET_GEOMETRY_AUTHORIZED"
        disposition = "HOLD"
        shooter_recovery = {
            "code": "KNOWN_TARGET_AUTHORITY_UNRESOLVED",
            "title": "THIS TARGET IS KNOWN",
            "message": f"Tap-n-Score knows this target, but {missing_facts[0]} is not yet governed.",
        }
    else:
        target_state = "KNOWN_TARGET_AUTHORITY_UNRESOLVED"
        disposition = "HOLD"
        shooter_recovery = {
            "code": "KNOWN_TARGET_AUTHORITY_UNRESOLVED",
            "title": "THIS TARGET IS KNOWN",
            "message": f"Tap-n-Score knows this target, but {missing_facts[0]} is not yet governed.",
        }
    return {
        "targetKnowledge": "KNOWN_TARGET",
        "targetState": target_state,
        "disposition": disposition,
        "faceId": face_record["faceId"],
        "productId": face_record["productId"],
        "publisherAuthorityId": face_record["publisherAuthorityId"],
        "exactProduct": face_record["exactProduct"],
        "side": face_record["side"],
        "representationId": face_record["representationId"],
        "geometryId": face_record["geometryId"],
        "geometryAuthorityStatus": "AUTHORIZED_REUSABLE" if geometry_authorized else geometry["evidenceStatus"],
        "procedureId": face_record["procedureId"],
        "procedureAuthorityStatus": procedure["evidenceStatus"],
        "mechanicalAuthorityIds": list(face_record.get("mechanicalAuthorityIds") or []),
        "registration": deepcopy(face_record.get("registration") or {}),
        "runtimeBinding": runtime_binding,
        "missingFacts": missing_facts,
        "whyExecutionBlocked": None if runtime_binding else f"Execution requires the unresolved authority fact(s): {'; '.join(missing_facts)}.",
        "shooterRecovery": shooter_recovery,
    }


def resolve_face_admission(identity: str) -> Dict[str, Any]:
    """Classify known identity separately from geometry and execution authority."""
    requested = str(identity or "").strip()
    inventory_index = _REGISTRY["_inventoryIndex"]
    face = inventory_index["faces"].get(requested)
    if not face:
        face = next(
            (item for item in inventory_index["faces"].values()
             if requested in {item.get("representationId"), item.get("runtimeBinding")}),
            None,
        )
    if face:
        return deepcopy(_face_admission_record(face))

    product_record = inventory_index["products"].get(requested)
    if not product_record:
        product_matches = [
            item for item in inventory_index["products"].values()
            if requested == item.get("exactName")
            or requested in set((item.get("identifiers") or {}).values())
            or requested in set(item.get("evidenceRecordIds") or [])
        ]
        if len(product_matches) == 1:
            product_record = product_matches[0]
        elif len(product_matches) > 1:
            return {
                "targetKnowledge": "KNOWN_TARGET",
                "targetState": "KNOWN_TARGET_AUTHORITY_UNRESOLVED",
                "disposition": "HOLD",
                "candidateProductIds": [item["productId"] for item in product_matches],
                "missingFacts": ["exact publisher product identity"],
                "whyExecutionBlocked": "This identifier matches more than one cataloged product.",
                "shooterRecovery": {
                    "code": "KNOWN_TARGET_AUTHORITY_UNRESOLVED",
                    "title": "THIS TARGET IS KNOWN",
                    "message": "Choose the exact publisher product.",
                },
            }
    if product_record:
        face_ids = list(product_record.get("faceIds") or [])
        if len(face_ids) == 1:
            return deepcopy(_face_admission_record(inventory_index["faces"][face_ids[0]]))
        return {
            "targetKnowledge": "KNOWN_TARGET",
            "targetState": "KNOWN_TARGET_AUTHORITY_UNRESOLVED",
            "disposition": "HOLD",
            "productId": product_record["productId"],
            "exactProduct": product_record["exactName"],
            "candidateFaceIds": face_ids,
            "missingFacts": ["exact face/side selection"],
            "whyExecutionBlocked": "A two-sided product cannot execute until its exact face/side is established.",
            "shooterRecovery": {
                "code": "KNOWN_TARGET_AUTHORITY_UNRESOLVED",
                "title": "THIS TARGET IS KNOWN",
                "message": "Choose the exact face or side of this target.",
            },
        }

    binding = _REGISTRY["_index"]["bindings"].get(requested)
    if binding:
        return {
            "targetKnowledge": "KNOWN_TARGET",
            "targetState": "KNOWN_TARGET_EXECUTION_AUTHORIZED",
            "disposition": "ALREADY_AUTHORIZED",
            "recordKind": "governed_reference_representation",
            "targetProfileId": requested,
            "productId": binding["productId"],
            "familyId": binding["familyId"],
            "mechanicalAuthorityId": binding["mechanicalAuthorityId"],
            "registrationPackageId": binding["registrationPackageId"],
            "missingFacts": [],
            "shooterRecovery": None,
        }

    return {
        "targetKnowledge": "UNKNOWN_TARGET",
        "targetState": "UNKNOWN_TARGET",
        "disposition": "HOLD",
        "missingFacts": ["publisher product and exact face identity"],
        "whyExecutionBlocked": "No admitted publisher product and exact face identity matches this identifier.",
        "shooterRecovery": {
            "code": "UNKNOWN_TARGET",
            "title": "WE CAN’T IDENTIFY THIS TARGET",
            "message": "Select the exact target product or scan its target identity.",
        },
    }


def industry_authorization_sweep() -> Dict[str, Any]:
    """Return the complete evidence-limited disposition of the audited industry set."""
    face_results = [
        _face_admission_record(face)
        for face in _REGISTRY["_inventoryIndex"]["faces"].values()
    ]
    bound_face_profiles = {item["runtimeBinding"] for item in face_results if item.get("runtimeBinding")}
    reference_bindings = [
        {
            "targetKnowledge": "KNOWN_TARGET",
            "targetState": "KNOWN_TARGET_EXECUTION_AUTHORIZED",
            "disposition": "ALREADY_AUTHORIZED",
            "recordKind": "governed_reference_representation",
            "targetProfileId": binding["targetProfileId"],
            "productId": binding["productId"],
            "familyId": binding["familyId"],
            "mechanicalAuthorityId": binding["mechanicalAuthorityId"],
            "registrationPackageId": binding["registrationPackageId"],
            "missingFacts": [],
        }
        for binding in _REGISTRY["_index"]["bindings"].values()
        if binding["targetProfileId"] not in bound_face_profiles
    ]
    return deepcopy({
        "registryId": _REGISTRY["registryId"],
        "registryVersion": _REGISTRY["version"],
        "universalZeroingCapabilityId": _REGISTRY["universalZeroingCapabilityId"],
        "reportPath": _REGISTRY["authorizationSweep"]["reportPath"],
        "counts": _REGISTRY["authorizationSweep"]["counts"],
        "authorizedNow": [],
        "alreadyAuthorized": [item for item in face_results if item["disposition"] == "ALREADY_AUTHORIZED"] + reference_bindings,
        "hold": [item for item in face_results if item["disposition"] == "HOLD"],
    })


def resolve_target_profile(target_profile_id: str) -> Dict[str, Any]:
    binding = _REGISTRY["_index"]["bindings"].get(str(target_profile_id))
    if not binding:
        raise MFAMAuthorityError("mfam_target_profile_not_governed")
    return deepcopy({
        **registry_metadata(),
        "binding": binding,
        "product": _REGISTRY["_index"]["products"][binding["productId"]],
        "family": _REGISTRY["_index"]["families"][binding["familyId"]],
        "mechanicalAuthority": _REGISTRY["_index"]["mechanics"][binding["mechanicalAuthorityId"]],
    })


def product(product_id: str) -> Dict[str, Any]:
    record = _REGISTRY["_index"]["products"].get(str(product_id))
    if not record:
        raise MFAMAuthorityError("mfam_product_not_found")
    return deepcopy(record)


def family(family_id: str) -> Dict[str, Any]:
    record = _REGISTRY["_index"]["families"].get(str(family_id))
    if not record:
        raise MFAMAuthorityError("mfam_family_not_found")
    return deepcopy(record)


def classify_pair(left_product_id: str, right_product_id: str) -> Dict[str, Any]:
    wanted = {str(left_product_id), str(right_product_id)}
    for record in _REGISTRY.get("pairClassifications") or []:
        if {record["leftProductId"], record["rightProductId"]} == wanted:
            return deepcopy(record)
    raise MFAMAuthorityError("mfam_pair_not_classified")
