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


def _load_registry() -> Dict[str, Any]:
    with REGISTRY_PATH.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if payload.get("schemaId") != SCHEMA_ID or payload.get("status") != "governed":
        raise MFAMAuthorityError("mfam_registry_not_governed")
    vocabulary = set(payload.get("classificationVocabulary") or [])
    if vocabulary != ALLOWED_CLASSIFICATIONS:
        raise MFAMAuthorityError("mfam_registry_classification_vocabulary_invalid")

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

    payload["_index"] = {
        "families": families,
        "mechanics": mechanics,
        "products": products,
        "bindings": bindings,
    }
    return payload


_REGISTRY = _load_registry()


def registry_metadata() -> Dict[str, Any]:
    return {
        "registryId": _REGISTRY["registryId"],
        "version": _REGISTRY["version"],
        "universalZeroingCapabilityId": _REGISTRY["universalZeroingCapabilityId"],
    }


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
