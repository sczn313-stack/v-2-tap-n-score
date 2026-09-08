"""Lean runtime authority resolver for governed M/FAM targets.

The executable path is deliberately small:

printer product/face -> exact registration (UGO) -> family authority ->
equipment mechanics -> universal zeroing road.

Historical comparisons, admission exercises, scale proofs, and evidence-quality
rankings live in preservation records. They are not runtime prerequisites.
"""
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, Mapping


REGISTRY_PATH = Path(__file__).resolve().parent / "registries" / "mfam_family_authority.json"
INVENTORY_AUDIT_PATH = Path(__file__).resolve().parent / "registries" / "mfam_inventory_audit.json"
REGISTRATION_REGISTRY_PATH = (
    Path(__file__).resolve().parent / "registries" / "target_image_registration_packages.json"
)
SCHEMA_ID = "sczn3-mfam-authority-v2"


class MFAMAuthorityError(RuntimeError):
    """Raised when a requested M/FAM runtime authority cannot be resolved."""


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


def _source_ids_exist(
    record: Mapping[str, Any],
    sources: Mapping[str, Mapping[str, Any]],
    error_prefix: str,
) -> None:
    for source_id in record.get("sourceIds") or []:
        if source_id not in sources:
            raise MFAMAuthorityError(f"{error_prefix}:{source_id}")


def _load_registry() -> Dict[str, Any]:
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    if payload.get("schemaId") != SCHEMA_ID or payload.get("status") != "governed":
        raise MFAMAuthorityError("mfam_registry_not_governed")
    if payload.get("universalZeroingCapabilityId") != "sczn3-governed-zeroing-road-v1":
        raise MFAMAuthorityError("mfam_registry_zeroing_capability_mismatch")

    inventory = json.loads(INVENTORY_AUDIT_PATH.read_text(encoding="utf-8"))
    inventory_pointer = payload.get("inventory") or {}
    if inventory.get("schemaId") != "sczn3-mfam-inventory-audit-v1":
        raise MFAMAuthorityError("mfam_inventory_audit_invalid")
    if inventory.get("catalogId") != inventory_pointer.get("catalogId"):
        raise MFAMAuthorityError("mfam_inventory_audit_catalog_mismatch")
    if inventory_pointer.get("path") != "registries/mfam_inventory_audit.json":
        raise MFAMAuthorityError("mfam_inventory_audit_path_mismatch")
    if inventory.get("authorityRegistryId") != payload.get("registryId"):
        raise MFAMAuthorityError("mfam_inventory_audit_registry_mismatch")

    families = _unique_index(payload.get("families") or [], "familyId")
    family_packages = _unique_index(
        payload.get("familyAuthorityPackages") or [], "familyAuthorityPackageId"
    )
    mechanics = _unique_index(
        payload.get("mechanicalAuthorities") or [], "mechanicalAuthorityId"
    )
    products = _unique_index(payload.get("products") or [], "productId")
    sources = _unique_index(payload.get("sources") or [], "sourceId")
    bindings = _unique_index(payload.get("targetProfileBindings") or [], "targetProfileId")

    inventory_publishers = _unique_index(
        inventory.get("publisherAuthorities") or [], "publisherAuthorityId"
    )
    inventory_products = _unique_index(inventory.get("products") or [], "productId")
    inventory_faces = _unique_index(inventory.get("faces") or [], "faceId")
    inventory_geometries = _unique_index(inventory.get("geometryCatalog") or [], "geometryId")
    inventory_procedures = _unique_index(inventory.get("procedureCatalog") or [], "procedureId")

    registration_payload = json.loads(REGISTRATION_REGISTRY_PATH.read_text(encoding="utf-8"))
    registration_packages = _unique_index(
        registration_payload.get("packages") or [], "registrationPackageId"
    )

    # Printer/product facts retain provenance. Provenance is recorded once; it
    # is not converted into another admission score or evidence-ranking gate.
    for family_record in families.values():
        _source_ids_exist(family_record, sources, "mfam_family_source_missing")
    for mechanical in mechanics.values():
        _source_ids_exist(mechanical, sources, "mfam_mechanical_source_missing")
    for product_record in products.values():
        family_id = product_record.get("familyId")
        if family_id and family_id not in families:
            raise MFAMAuthorityError(
                f"mfam_product_family_missing:{product_record['productId']}"
            )
        for authority_id in product_record.get("mechanicalAuthorityIds") or []:
            if authority_id not in mechanics:
                raise MFAMAuthorityError(
                    f"mfam_product_mechanical_authority_missing:{product_record['productId']}"
                )
        _source_ids_exist(product_record, sources, "mfam_product_source_missing")

    # A family package is executable authority because it is present in this
    # governed registry, references real mechanics, and names the shared road.
    for package in family_packages.values():
        family_id = package.get("familyId")
        if family_id not in families:
            raise MFAMAuthorityError(
                f"mfam_family_package_family_missing:{package['familyAuthorityPackageId']}"
            )
        if package.get("universalZeroingCapabilityId") != payload["universalZeroingCapabilityId"]:
            raise MFAMAuthorityError(
                f"mfam_family_package_capability_mismatch:{package['familyAuthorityPackageId']}"
            )
        authority_ids = package.get("mechanicalAuthorityIds") or []
        if not authority_ids or any(authority_id not in mechanics for authority_id in authority_ids):
            raise MFAMAuthorityError(
                f"mfam_family_package_mechanics_missing:{package['familyAuthorityPackageId']}"
            )
        _source_ids_exist(package, sources, "mfam_family_package_source_missing")

    # An explicit binding is the entire runtime authorization decision. It
    # connects exact identity, exact registration, one family package, and one
    # applicable mechanical authority. No second admission registry votes.
    for binding in bindings.values():
        profile_id = binding["targetProfileId"]
        product_record = products.get(binding.get("productId"))
        family_record = families.get(binding.get("familyId"))
        family_package = family_packages.get(binding.get("familyAuthorityPackageId"))
        mechanical = mechanics.get(binding.get("mechanicalAuthorityId"))
        registration_package = registration_packages.get(binding.get("registrationPackageId"))
        if not all((product_record, family_record, family_package, mechanical, registration_package)):
            raise MFAMAuthorityError(f"mfam_binding_reference_missing:{profile_id}")
        if family_package.get("familyId") != binding.get("familyId"):
            raise MFAMAuthorityError(f"mfam_binding_family_package_mismatch:{profile_id}")
        if binding.get("mechanicalAuthorityId") not in family_package.get("mechanicalAuthorityIds", []):
            raise MFAMAuthorityError(f"mfam_binding_mechanics_outside_family_package:{profile_id}")
        if registration_package.get("targetProfileId") != profile_id:
            raise MFAMAuthorityError(f"mfam_binding_registration_profile_mismatch:{profile_id}")

        inventory_face_id = binding.get("inventoryFaceId")
        if inventory_face_id:
            inventory_face = inventory_faces.get(inventory_face_id)
            if not inventory_face or inventory_face.get("runtimeBinding") != profile_id:
                raise MFAMAuthorityError(f"mfam_binding_inventory_face_mismatch:{profile_id}")

        representation = binding.get("canonicalRepresentationAuthority") or {}
        required_representation_fields = {
            "targetId", "imageWidth", "imageHeight", "gridLeftPx", "gridTopPx",
            "gridRightPx", "gridBottomPx", "gridSquareXPx", "gridSquareYPx",
            "aimCoordinate", "aimAuthorityId", "sourceAssetSha256",
        }
        if not required_representation_fields.issubset(representation):
            raise MFAMAuthorityError(
                f"mfam_binding_representation_authority_incomplete:{profile_id}"
            )
        identity = representation.get("productIdentityAuthority") or {}
        if representation.get("authorityScope") == "UGO_GEOMETRY_TEMPLATE_NOT_PRODUCT_IDENTITY":
            if (
                identity.get("faceId") != inventory_face_id
                or not identity.get("publisher")
                or not identity.get("sourceIds")
            ):
                raise MFAMAuthorityError(
                    f"mfam_binding_printer_identity_authority_incomplete:{profile_id}"
                )

    # The inventory remains the knowledge catalog. These checks protect exact
    # printer/product/face links without making inventory bookkeeping an
    # additional authority gate.
    for product_record in inventory_products.values():
        if product_record.get("publisherAuthorityId") not in inventory_publishers:
            raise MFAMAuthorityError(
                f"mfam_inventory_product_publisher_missing:{product_record['productId']}"
            )
        face_ids = product_record.get("faceIds") or []
        if not face_ids or any(face_id not in inventory_faces for face_id in face_ids):
            raise MFAMAuthorityError(
                f"mfam_inventory_product_face_missing:{product_record['productId']}"
            )

    claimed_faces = [
        face_id
        for product_record in inventory_products.values()
        for face_id in product_record.get("faceIds") or []
    ]
    if len(claimed_faces) != len(set(claimed_faces)) or set(claimed_faces) != set(inventory_faces):
        raise MFAMAuthorityError("mfam_inventory_face_ownership_invalid")

    for face_record in inventory_faces.values():
        product_record = inventory_products.get(face_record.get("productId"))
        if not product_record or face_record["faceId"] not in product_record.get("faceIds", []):
            raise MFAMAuthorityError(
                f"mfam_inventory_face_product_mismatch:{face_record['faceId']}"
            )
        if face_record.get("publisherAuthorityId") != product_record.get("publisherAuthorityId"):
            raise MFAMAuthorityError(
                f"mfam_inventory_face_publisher_mismatch:{face_record['faceId']}"
            )
        if face_record.get("geometryId") not in inventory_geometries:
            raise MFAMAuthorityError(
                f"mfam_inventory_face_geometry_missing:{face_record['faceId']}"
            )
        if face_record.get("procedureId") not in inventory_procedures:
            raise MFAMAuthorityError(
                f"mfam_inventory_face_procedure_missing:{face_record['faceId']}"
            )
        runtime_binding = face_record.get("runtimeBinding")
        if runtime_binding and runtime_binding not in bindings:
            raise MFAMAuthorityError(
                f"mfam_inventory_face_binding_missing:{face_record['faceId']}"
            )

    payload["_index"] = {
        "families": families,
        "familyPackages": family_packages,
        "mechanics": mechanics,
        "products": products,
        "bindings": bindings,
        "sources": sources,
        "registrationPackages": registration_packages,
    }
    payload["_inventoryIndex"] = {
        "publishers": inventory_publishers,
        "products": inventory_products,
        "faces": inventory_faces,
        "geometries": inventory_geometries,
        "procedures": inventory_procedures,
    }
    payload["_inventory"] = inventory
    return payload


_REGISTRY = _load_registry()


def registry_metadata() -> Dict[str, Any]:
    return {
        "registryId": _REGISTRY["registryId"],
        "version": _REGISTRY["version"],
        "authorityChain": deepcopy(_REGISTRY["authorityChain"]),
        "universalZeroingCapabilityId": _REGISTRY["universalZeroingCapabilityId"],
        "inventoryCatalogId": _REGISTRY["inventory"]["catalogId"],
        "targetProfileCount": len(_REGISTRY["_index"]["bindings"]),
        "familyAuthorityPackageCount": len(_REGISTRY["_index"]["familyPackages"]),
    }


def inventory_audit() -> Dict[str, Any]:
    """Return the preserved human-auditable printer/product/face knowledge."""
    return deepcopy(_REGISTRY["_inventory"])


def resolve_known_target(identity: str) -> Dict[str, Any]:
    """Resolve identity without inventing an admission taxonomy."""
    requested = str(identity or "").strip()
    inventory_index = _REGISTRY["_inventoryIndex"]

    face_record = inventory_index["faces"].get(requested)
    if not face_record:
        face_record = next(
            (
                face for face in inventory_index["faces"].values()
                if requested in {face.get("representationId"), face.get("runtimeBinding")}
            ),
            None,
        )
    if face_record:
        profile_id = face_record.get("runtimeBinding")
        return deepcopy({
            "recognized": True,
            "executable": bool(profile_id),
            "faceId": face_record["faceId"],
            "productId": face_record["productId"],
            "publisherAuthorityId": face_record["publisherAuthorityId"],
            "exactProduct": face_record["exactProduct"],
            "side": face_record["side"],
            "representationId": face_record["representationId"],
            "targetProfileId": profile_id,
            "missingFacts": [] if profile_id else list(face_record.get("unresolvedFacts") or []),
        })

    product_record = inventory_index["products"].get(requested)
    if not product_record:
        matches = [
            product_record
            for product_record in inventory_index["products"].values()
            if requested == product_record.get("exactName")
            or requested in set((product_record.get("identifiers") or {}).values())
            or requested in set(product_record.get("evidenceRecordIds") or [])
        ]
        if len(matches) == 1:
            product_record = matches[0]
        elif len(matches) > 1:
            return {
                "recognized": True,
                "executable": False,
                "candidateProductIds": [item["productId"] for item in matches],
                "missingFacts": ["exact publisher product identity"],
            }
    if product_record:
        face_ids = list(product_record.get("faceIds") or [])
        if len(face_ids) == 1:
            return resolve_known_target(face_ids[0])
        return {
            "recognized": True,
            "executable": False,
            "productId": product_record["productId"],
            "exactProduct": product_record["exactName"],
            "candidateFaceIds": face_ids,
            "missingFacts": ["exact face/side selection"],
        }

    if requested in _REGISTRY["_index"]["bindings"]:
        return {
            "recognized": True,
            "executable": True,
            "targetProfileId": requested,
            "missingFacts": [],
        }
    return {
        "recognized": False,
        "executable": False,
        "missingFacts": ["publisher product and exact face identity"],
    }


def resolve_target_profile(target_profile_id: str) -> Dict[str, Any]:
    """Resolve one explicit governed Target Profile for Backend execution."""
    binding = _REGISTRY["_index"]["bindings"].get(str(target_profile_id))
    if not binding:
        raise MFAMAuthorityError("mfam_target_profile_not_governed")
    inventory_face_id = binding.get("inventoryFaceId")
    return deepcopy({
        **registry_metadata(),
        "binding": binding,
        "product": _REGISTRY["_index"]["products"][binding["productId"]],
        "inventoryFace": (
            _REGISTRY["_inventoryIndex"]["faces"].get(inventory_face_id)
            if inventory_face_id else None
        ),
        "family": _REGISTRY["_index"]["families"][binding["familyId"]],
        "familyAuthorityPackage": _REGISTRY["_index"]["familyPackages"]
            [binding["familyAuthorityPackageId"]],
        "mechanicalAuthority": _REGISTRY["_index"]["mechanics"]
            [binding["mechanicalAuthorityId"]],
        "registrationPackage": _REGISTRY["_index"]["registrationPackages"]
            [binding["registrationPackageId"]],
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
