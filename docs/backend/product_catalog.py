"""Governed public product-route catalog for the approved GSSF AC-1 identity."""
from __future__ import annotations

from typing import Any, Dict, Mapping, Optional, Tuple

from gssf_ac_1_authority import (
    GSSF_AC_1_ATP,
    GSSF_AC_1_EXECUTION_CONTRACT,
    GSSF_AC_1_REGISTRATION_PACKAGE,
)


GSSF_PUBLISHER_RECORD = {
    "publisherRouteId": "gssf",
    "displayName": "GSSF",
    "lifecycleStatus": "active",
    "brandingAuthorizationStatus": "external_authorization_unverified",
}

GSSF_AC_1_PRODUCT_RECORD = {
    "publisherRouteId": "gssf",
    "productRouteId": "ac1",
    "displayName": "AC-1",
    "lifecycleStatus": "active",
}

GSSF_AC_1_CATALOG_ENTRY = {
    "catalogEntryId": "gssf-ac1-public-route-v1",
    "catalogEntryVersion": "1",
    "publicRoute": "/t/gssf/ac1",
    "publisherRouteId": "gssf",
    "productRouteId": "ac1",
    "lifecycleStatus": "active",
    "availabilityStatus": "available",
    "targetProfileId": GSSF_AC_1_ATP["targetProfileId"],
    "targetProfileVersion": GSSF_AC_1_ATP["targetProfileVersion"],
    "registrationPackageId": GSSF_AC_1_REGISTRATION_PACKAGE["registrationPackageId"],
    "registrationPackageVersion": GSSF_AC_1_REGISTRATION_PACKAGE["registrationPackageVersion"],
    "missionFamily": GSSF_AC_1_EXECUTION_CONTRACT["missionFamily"],
    "targetExecutionContractId": GSSF_AC_1_EXECUTION_CONTRACT["targetExecutionContractId"],
    "resultPackageType": GSSF_AC_1_EXECUTION_CONTRACT["resultPackageType"],
}

PUBLISHER_RECORDS = {"gssf": GSSF_PUBLISHER_RECORD}
PRODUCT_RECORDS = {("gssf", "ac1"): GSSF_AC_1_PRODUCT_RECORD}
TARGET_CATALOG_ENTRIES = {("gssf", "ac1"): GSSF_AC_1_CATALOG_ENTRY}


def _refusal(status: str, reason: str, publisher_route_id: str, product_route_id: str, **details: Any) -> Dict[str, Any]:
    result = {
        "ok": False,
        "status": status,
        "reason": reason,
        "publisherRouteId": publisher_route_id,
        "productRouteId": product_route_id,
    }
    result.update(details)
    return result


def _authority_matches(entry: Mapping[str, Any]) -> bool:
    expected = {
        "targetProfileId": GSSF_AC_1_ATP["targetProfileId"],
        "targetProfileVersion": GSSF_AC_1_ATP["targetProfileVersion"],
        "registrationPackageId": GSSF_AC_1_REGISTRATION_PACKAGE["registrationPackageId"],
        "registrationPackageVersion": GSSF_AC_1_REGISTRATION_PACKAGE["registrationPackageVersion"],
        "missionFamily": GSSF_AC_1_EXECUTION_CONTRACT["missionFamily"],
        "targetExecutionContractId": GSSF_AC_1_EXECUTION_CONTRACT["targetExecutionContractId"],
        "resultPackageType": GSSF_AC_1_EXECUTION_CONTRACT["resultPackageType"],
    }
    return all(entry.get(field) == value for field, value in expected.items())


def resolve_product_route(
    publisher_route_id: str,
    product_route_id: str,
    *,
    publisher_records: Optional[Mapping[str, Mapping[str, Any]]] = None,
    product_records: Optional[Mapping[Tuple[str, str], Mapping[str, Any]]] = None,
    catalog_entries: Optional[Mapping[Tuple[str, str], Mapping[str, Any]]] = None,
) -> Dict[str, Any]:
    """Resolve one public product identity without granting authority by inference."""
    publishers = publisher_records if publisher_records is not None else PUBLISHER_RECORDS
    products = product_records if product_records is not None else PRODUCT_RECORDS
    entries = catalog_entries if catalog_entries is not None else TARGET_CATALOG_ENTRIES
    publisher_id = publisher_route_id.strip().lower() if isinstance(publisher_route_id, str) else ""
    product_id = product_route_id.strip().lower() if isinstance(product_route_id, str) else ""

    publisher = publishers.get(publisher_id)
    if not publisher:
        return _refusal("product_unavailable", "unknown_publisher", publisher_id, product_id)
    if publisher.get("lifecycleStatus") != "active":
        return _refusal("product_unavailable", "publisher_unavailable", publisher_id, product_id)

    product = products.get((publisher_id, product_id))
    if not product:
        return _refusal("product_unavailable", "unknown_product", publisher_id, product_id)
    if product.get("lifecycleStatus") != "active":
        return _refusal("product_unavailable", "product_lifecycle_unavailable", publisher_id, product_id)

    entry = entries.get((publisher_id, product_id))
    if not entry:
        return _refusal("product_unavailable", "catalog_entry_missing", publisher_id, product_id)
    lifecycle = entry.get("lifecycleStatus")
    availability = entry.get("availabilityStatus")
    if lifecycle == "retired":
        return _refusal("product_retired", "catalog_entry_retired", publisher_id, product_id)
    if lifecycle != "active" or availability != "available":
        return _refusal(
            "product_unavailable",
            "catalog_entry_unavailable",
            publisher_id,
            product_id,
            lifecycleStatus=lifecycle,
            availabilityStatus=availability,
        )
    if entry.get("publisherRouteId") != publisher_id or entry.get("productRouteId") != product_id:
        return _refusal("authority_unavailable", "catalog_identity_mismatch", publisher_id, product_id)
    if not _authority_matches(entry):
        return _refusal("authority_unavailable", "catalog_authority_mismatch", publisher_id, product_id)

    experience_url = (
        "/shoot.html?target_profile_id=gssf_ac_1"
        "&publisher_route_id=gssf"
        "&product_route_id=ac1"
        "&catalog_entry_id=gssf-ac1-public-route-v1"
    )
    return {
        "ok": True,
        "status": "resolved",
        "resolutionType": "governed_product_route",
        "publicRoute": entry["publicRoute"],
        "publisher": {
            "publisherRouteId": publisher["publisherRouteId"],
            "displayName": publisher["displayName"],
            "brandingAuthorizationStatus": publisher["brandingAuthorizationStatus"],
        },
        "product": {
            "productRouteId": product["productRouteId"],
            "displayName": product["displayName"],
        },
        "catalogEntry": dict(entry),
        "authorityResolution": {
            "targetProfileId": entry["targetProfileId"],
            "targetProfileVersion": entry["targetProfileVersion"],
            "registrationPackageId": entry["registrationPackageId"],
            "registrationPackageVersion": entry["registrationPackageVersion"],
            "missionFamily": entry["missionFamily"],
            "targetExecutionContractId": entry["targetExecutionContractId"],
            "resultPackageType": entry["resultPackageType"],
        },
        "experienceUrl": experience_url,
    }


def product_resolution_http_status(result: Mapping[str, Any]) -> int:
    if result.get("ok") is True:
        return 200
    if result.get("status") == "product_retired":
        return 410
    if result.get("status") == "authority_unavailable":
        return 503
    return 404
