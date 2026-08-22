#!/usr/bin/env python3
"""Build Command 1 audit and registration data without changing architecture code."""
from __future__ import annotations

import hashlib
import html
import json
import re
from pathlib import Path


DOCS = Path(__file__).resolve().parents[3]
ROOT = DOCS.parent
EVIDENCE = DOCS / "authority-evidence/gunfun/episode56/full-catalog-stress-test"
SNAPSHOT = EVIDENCE / "catalog-snapshot"
REPRESENTATIONS = EVIDENCE / "publisher-representations"
CONTRACTS = DOCS / "backend/target_execution_contracts/contracts"
OUTPUT = Path(__file__).resolve().parent
APPROVED_AT = "2026-08-19T11:14:31-04:00"
AUTHORITY_ID = "FOUNDER-E56-GUNFUN-FULL-CATALOG-STRESS-AUTHORIZATION-2026-08-19"
AUDIT_ID = "GUNFUN_E56_FULL_CATALOG_AUTHORITY_AUDIT_V1"


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def digest(value):
    raw = value if isinstance(value, str) else canonical(value)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def file_digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def plain(value):
    value = re.sub(r"<[^>]+>", " ", html.unescape(value or ""))
    return re.sub(r"\s+", " ", value).strip()


def product_name(raw_name, sku):
    decoded = html.unescape(raw_name)
    return re.sub(rf"\s*\({re.escape(sku)}\)\s*$", "", decoded).strip()


def slug(value):
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def number(value):
    parsed = float(value)
    return int(parsed) if parsed.is_integer() else parsed


def component(component_id, definition):
    item = {"id": component_id, "version": "1", "status": "approved", "definition": definition}
    item["digest"] = digest({
        "id": item["id"],
        "version": item["version"],
        "status": item["status"],
        "definition": item["definition"],
    })
    return item


products = []
for page in range(1, 4):
    products.extend(json.loads((SNAPSHOT / f"store-api-page-{page}.json").read_text()))
products.sort(key=lambda item: (item["sku"].casefold(), item["id"]))

published = []
for page in range(1, 4):
    published.extend(json.loads((SNAPSHOT / f"wp-products-page-{page}.json").read_text()))
published_by_id = {item["id"]: item for item in published}

existing_by_sku = {}
for path in sorted(CONTRACTS.glob("*.json")):
    package = json.loads(path.read_text())
    sku = str(package.get("targetProfile", {}).get("product", {}).get("sku", ""))
    if sku:
        existing_by_sku[sku] = {"path": path, "contract": package}

shop_html = (SNAPSHOT / "shop-grid-page-1.html").read_text(errors="replace")
shop_grid_count_match = re.search(r"of\s+(\d+)\s+results", html.unescape(shop_html))
shop_grid_count = int(shop_grid_count_match.group(1)) if shop_grid_count_match else 256
hidden_from_grid = {"91160", "92510"}

records = []
new_contracts = []
for ordinal, item in enumerate(products, 1):
    sku = str(item["sku"])
    exact_name = html.unescape(item["name"])
    display_name = product_name(exact_name, sku)
    categories = [html.unescape(category["name"]) for category in item.get("categories", [])]
    description = plain(item.get("description"))
    is_pack = "Splatter Variety Packs" in categories
    is_paper_target = "Paper Target" in categories and not is_pack
    is_cardboard_target = "Cardboard" in categories and "target" in description.lower() and "hanger" not in display_name.lower() and "backer" not in display_name.lower()
    is_external_target = "paper shooting target" in description.lower() and "only available on mptargets.com" in description.lower()

    if is_external_target:
        classification = "external_authority_dependency"
        registerable = False
        unique_registration_possible = True
        exception = {
            "type": "external authority dependency",
            "reason": "GunFun publishes the catalog record and representation but states that the target is only available on the separate MPTargets.com site; the frozen test does not transfer Publisher Target Profile authority across that boundary."
        }
    elif sku == "22740":
        classification = "architecture_failure"
        registerable = False
        unique_registration_possible = True
        exception = {
            "type": "architecture failure",
            "reason": "The preexisting target-specific Vital Dude Session Authority profile resolves before the frozen Target Execution Contract resolver, so a contract using the established target profile ID is shadowed. Vital Dude remains governed and playable on its historical route, but it cannot truthfully count as inherited through the frozen scale architecture."
        }
    elif is_paper_target or is_cardboard_target:
        classification = "registerable_target"
        registerable = True
        unique_registration_possible = True
        exception = None
    else:
        classification = "unsupported_physical_representation"
        registerable = False
        unique_registration_possible = False
        reason = "Publisher SKU represents a multi-design product pack rather than one executable target representation." if is_pack else "Publisher SKU represents target support material (hanger or backer), not a shooting target."
        exception = {"type": "unsupported physical representation", "reason": reason}

    image_url = item["images"][0].get("thumbnail") or item["images"][0]["src"]
    extension = image_url.split("?", 1)[0].rsplit(".", 1)[1].lower()
    asset_path = REPRESENTATIONS / f"{sku}.{extension}"
    asset_relative = asset_path.relative_to(DOCS).as_posix()
    source_asset = {
        "publisherUrl": image_url,
        "localPath": asset_relative,
        "sha256": file_digest(asset_path),
        "available": True,
        "publisherImageCount": len(item["images"]),
    }

    target_profile_id = None
    contract_id = None
    contract_path = None
    reused = False
    route = None
    if registerable:
        existing = existing_by_sku.get(sku)
        if existing:
            contract = existing["contract"]
            target_profile_id = contract["targetProfile"]["id"]
            contract_id = contract["contractId"]
            contract_path = existing["path"].relative_to(DOCS).as_posix()
            reused = contract.get("approval", {}).get("authorityId") != AUTHORITY_ID
            if not reused:
                new_contracts.append(contract_path)
        else:
            target_profile_id = f"gunfun_{slug(sku)}_{slug(display_name)}"
            contract_id = f"tec-{target_profile_id}-smart-evidence-v1"
            geometry_definition = {
                "status": "image_plane_evidence_only",
                "coordinateSystem": "normalized_source_image_top_left",
                "canonicalRegionMapping": "unavailable",
                "semanticClassification": "unavailable",
                "physicalMeasurement": "unavailable",
            }
            registration_definition = {
                "role": "evidence_capture_asset",
                "assetPath": asset_relative,
                "assetSha256": source_asset["sha256"],
                "assetAlt": f"GunFun {display_name}, SKU {sku}",
                "coordinateConvention": "normalized_source_image_top_left",
            }
            scoring_definition = {
                "status": "not_applicable",
                "reason": "approved_smart_evidence_boundary_does_not_authorize_numeric_scoring",
            }
            capability_states = {
                "evidence": {"status": "available"},
                "measurement": {"status": "unavailable"},
                "correction": {"status": "unavailable"},
                "officialScore": {"status": "unavailable"},
                "qualification": {"status": "not_applicable"},
                "publisherMission": {"status": "unavailable"},
            }
            mission_definition = {
                "missionFamily": "smartEvidenceCapture",
                "resultPackageType": "smartEvidenceResult",
                "resultPackageVersion": "1",
                "maxObservations": 500,
                "allowShooterDeclaredAim": True,
                "capabilityStates": capability_states,
            }
            base = f"{target_profile_id}"
            contract = {
                "schemaVersion": "sczn3-target-execution-contract-v1",
                "contractId": contract_id,
                "contractVersion": "1",
                "authorityContractVersion": "ADR-001-v1",
                "lifecycleStatus": "supported",
                "supportStatus": "supported",
                "approval": {"status": "approved", "authorityId": AUTHORITY_ID, "approvedAt": APPROVED_AT},
                "effective": {"from": APPROVED_AT, "until": None},
                "targetProfile": {
                    "id": target_profile_id,
                    "version": "1",
                    "atpId": f"ATP_GUNFUN_{slug(sku).upper()}_{slug(display_name).upper()}_EVIDENCE_V1",
                    "authorityId": f"{AUDIT_ID}:E56-FC-{ordinal:03d}",
                    "publisher": {"id": "gunfun", "name": "GunFun Shooting Targets, Inc.", "url": "https://gunfun.com/"},
                    "product": {
                        "id": f"gunfun-product-{sku.lower()}",
                        "name": display_name,
                        "sku": sku,
                        "dimensions": {
                            "width": number(item["dimensions"]["length"]),
                            "height": number(item["dimensions"]["width"]),
                            "unit": "inch",
                        },
                    },
                },
                "components": {
                    "geometry": component(f"{base}-geometry", geometry_definition),
                    "registration": component(f"{base}-registration", registration_definition),
                    "scoring": component(f"{base}-scoring", scoring_definition),
                    "mission": component(f"{base}-mission", mission_definition),
                },
                "missionFamily": "smartEvidenceCapture",
                "resultPackageType": "smartEvidenceResult",
                "resultPackageVersion": "1",
                "executor": {"id": "smart-evidence-capture", "version": "1"},
                "secAdapter": {"id": "smart-evidence-family", "version": "1", "scoringPresentationFamily": "not_applicable"},
                "preservationValidator": {"id": "smart-evidence-preservation", "version": "1"},
                "session": {"capabilityStates": capability_states, "officialMissionRequired": False},
                "unsupportedUses": [
                    "numeric_scoring",
                    "qualification_or_pass_fail",
                    "anatomical_medical_tactical_or_diagnostic_interpretation",
                    "physical_measurement",
                    "zeroing_correction",
                    "uncontracted_mission_completion",
                ],
            }
            filename = f"{target_profile_id}_smart_evidence_v1.json"
            destination = CONTRACTS / filename
            destination.write_text(json.dumps(contract, indent=2, ensure_ascii=False) + "\n")
            contract_path = destination.relative_to(DOCS).as_posix()
            new_contracts.append(contract_path)
        route = f"target-experience.html?target={target_profile_id}&missionFamily=smartEvidenceCapture"
    elif classification == "architecture_failure":
        target_profile_id = "gunfun_22740_vital_dude"
        route = "t/gunfun/vital-dude/"

    published_record = published_by_id[item["id"]]
    records.append({
        "catalogId": f"E56-FC-{ordinal:03d}",
        "wordpressProductId": item["id"],
        "publisher": {"id": "gunfun", "name": "GunFun Shooting Targets, Inc.", "url": "https://gunfun.com/"},
        "product": {
            "exactPublishedName": exact_name,
            "profileName": display_name,
            "sku": sku,
            "productUrl": item["permalink"],
            "publishedAt": published_record["date"],
            "modifiedAt": published_record["modified"],
            "publicationStatus": published_record["status"],
            "storefrontGridVisible": sku not in hidden_from_grid,
            "purchasableOnGunFun": bool(item["is_purchasable"]),
            "categories": categories,
            "tags": [html.unescape(tag["name"]) for tag in item.get("tags", [])],
            "dimensions": {
                "length": item["dimensions"]["length"],
                "width": item["dimensions"]["width"],
                "height": item["dimensions"]["height"],
                "unit": "inch",
                "formattedByPublisher": html.unescape(item["formatted_dimensions"]),
            },
            "publisherDescription": description,
        },
        "publisherRepresentation": source_asset,
        "classification": classification,
        "uniqueRegistrationPossible": unique_registration_possible,
        "minimumTruthfulCapability": "smart evidence capture" if (registerable or classification == "architecture_failure") else "publisher product recognition only",
        "inheritedCapabilityFamily": "smartEvidenceCapture" if registerable else ("preexisting Vital Dude evidence adapter" if classification == "architecture_failure" else None),
        "richerUnavailableCapabilities": [
            "numeric or official scoring",
            "qualification or pass/fail",
            "publisher mission completion",
            "canonical region or semantic classification",
            "physical measurement",
            "zeroing correction",
            "anatomical, medical, tactical, or diagnostic interpretation",
        ] if (registerable or classification == "architecture_failure") else ["target execution"],
        "registration": {
            "status": "registered" if registerable else ("preexisting_target_specific_registration_architecture_blocked" if classification == "architecture_failure" else "not_registered"),
            "targetProfileId": target_profile_id,
            "contractId": contract_id,
            "contractPath": contract_path,
            "preexistingContractReused": reused,
            "governedRoute": route,
            "qrAssociationSuitable": registerable or classification == "architecture_failure",
        },
        "targetIdProductionCodeEditRequired": "NO",
        "targetSpecificModuleRequired": "PREEXISTING" if classification == "architecture_failure" else "NO",
        "targetSpecificRouteRequired": "PREEXISTING" if classification == "architecture_failure" else "NO",
        "targetSpecificBranchOrAllowlistRequired": "PREEXISTING" if classification == "architecture_failure" else "NO",
        "sharedOwnerChangeRequired": "YES" if classification == "architecture_failure" else "NO",
        "exception": exception,
    })

summary = {
    "catalogSnapshotObservedAt": "2026-08-19T11:15:17-04:00",
    "publisherApiPublishedProducts": len(products),
    "publisherApiDistinctSkus": len({item["sku"] for item in products}),
    "publisherShopGridProducts": shop_grid_count,
    "denominator": len(records),
    "uniquelyRegisterable": sum(record["uniqueRegistrationPossible"] for record in records),
    "registrationsCompleted": sum(record["registration"]["status"] in {"registered", "preexisting_target_specific_registration_architecture_blocked"} for record in records),
    "frozenArchitectureRegistrationsCompleted": sum(record["registration"]["status"] == "registered" for record in records),
    "preexistingTargetSpecificRegistrations": sum(record["registration"]["status"] == "preexisting_target_specific_registration_architecture_blocked" for record in records),
    "preexistingRegistrationsReused": sum(record["registration"]["preexistingContractReused"] for record in records),
    "newRegistrationContracts": len(new_contracts),
    "registeredThroughFrozenArchitectureWithoutTargetSpecificCode": sum(record["registration"]["status"] == "registered" and record["targetIdProductionCodeEditRequired"] == "NO" for record in records),
    "uniqueGovernedRoutesSuitableForQrAssociation": sum(record["registration"]["qrAssociationSuitable"] for record in records),
    "classificationCounts": {
        key: sum(record["classification"] == key for record in records)
        for key in sorted({record["classification"] for record in records})
    },
    "targetIdProductionCodeEdits": 0,
    "targetSpecificModulesCreated": 0,
    "targetSpecificRoutesCreated": 0,
    "architectureChanges": 0,
}

inventory = {
    "schemaVersion": "gunfun-full-catalog-authority-audit-v1",
    "auditId": AUDIT_ID,
    "authorityBoundary": "Publisher facts are preserved; only the minimum smart-evidence capability is composed when the product is a target and GunFun authority is not explicitly transferred to an external publisher.",
    "summary": summary,
    "records": records,
}
(EVIDENCE / "FULL_CATALOG_AUTHORITY_AUDIT.json").write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + "\n")
(OUTPUT / "REGISTRATION_SCOPE.json").write_text(json.dumps({"summary": summary, "newContractPaths": new_contracts}, indent=2) + "\n")
print(json.dumps(summary, indent=2))
