#!/usr/bin/env python3
"""Fail-closed structural validation for the NRA four-publisher evidence batch."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def require(value, message):
    if not value:
        raise AssertionError(message)


def main():
    summary = json.loads((ROOT / "normalized/summary.json").read_text())
    profiles = json.loads((ROOT / "PUBLISHER_PROFILES.json").read_text())["profiles"]
    matrix = json.loads((ROOT / "NRA_CROSS_PUBLISHER_MATRIX.json").read_text())
    ledger = json.loads((ROOT / "EVIDENCE_LEDGER.json").read_text())
    monitoring = json.loads((ROOT / "MONITORING_PLAN.json").read_text())

    require(len(profiles) == 4, "exactly four publisher profiles required")
    require(len({x["publisherId"] for x in profiles}) == 4, "publisher profile IDs must be unique")
    for profile in profiles:
        require(len(profile["meetingFacts"]) == 5, f"{profile['publisherId']} must have exactly five meeting facts")
        for tier in ("tier1", "tier2", "tier3"):
            require(all(x in profile[tier] for x in ("status", "completeDomains", "partialDomains", "unknownDomains")), f"{profile['publisherId']} {tier} incomplete")

    expected = {
        "commercialProductPagesOrIdentities": 884,
        "commercialOfferingRecords": 1207,
        "actualShootableTargetProductPagesOrIdentities": 851,
        "actualShootableTargetOfferingRecords": 1170,
        "nonTargetOrAccessoryOfferingRecords": 37,
    }
    for key, value in expected.items():
        require(summary["combined"][key] == value, f"summary {key} drifted")

    all_records = json.loads((ROOT / "normalized/all-publishers.json").read_text())
    require(len(all_records) == 1207, "combined normalized record count mismatch")
    required_fields = {"recordId", "publisher", "sourceProductId", "productName", "productUrl", "productClass", "isActualShootableTarget", "capabilityMappings", "authorityGaps", "recognitionTraits", "source", "observedAt"}
    for row in all_records:
        require(required_fields <= set(row), f"missing fields on {row.get('recordId')}")
        if row["isActualShootableTarget"]:
            require(row["capabilityMappings"] and row["capabilityMappings"][0]["familyId"] == "CF-01", f"smart-evidence floor missing on {row['recordId']}")
        require(all(x["status"] in {"supported_floor", "candidate_authority_required"} for x in row["capabilityMappings"]), f"unauthorized capability state on {row['recordId']}")

    require(matrix["counts"]["uniqueNraSpecificationsReliablyEstablishedBySheets"] == 136, "NRA union count mismatch")
    require(matrix["counts"]["specificationsListedByMultipleCurrentManufacturers"] == 105, "NRA multi-printer count mismatch")
    require(matrix["counts"]["specificationsListedByAllFourCurrentManufacturers"] == 54, "NRA four-printer count mismatch")
    require(len(matrix["rows"]) == 136, "NRA matrix row count mismatch")
    for spec in ("B-16", "B-2", "B-3"):
        row = next((x for x in matrix["rows"] if x["nraSpecification"] == spec), None)
        require(row and row["currentLicensedManufacturerCount"] == 4, f"{spec} must map to all four current manufacturers")
        require(row["implementations"]["champion"]["products"], f"{spec} Champion mapping missing")

    require(any(x["claimId"] == "NRA-CURRENT-LICENSEES-2026-08-21" for x in ledger["claims"]), "current NRA status claim missing")
    require(monitoring["status"] == "structure_only_no_monitoring_service_implemented", "monitoring must not claim implementation")
    audit = json.loads((ROOT / "DENOMINATOR_AUDIT.json").read_text())
    require(audit["combined"]["publisherTargetImplementationIdentities"] == 744, "audited identity denominator drifted")
    require(audit["combined"]["commercialTargetOfferings"] == 1151, "audited offering denominator drifted")
    require(audit["combined"]["uniqueNraSpecificationsWithExactLiveCatalogMapping"] == 112, "live NRA mapping denominator drifted")
    require(audit["combined"]["exactLivePublisherNraSpecificationImplementations"] == 264, "publisher/NRA implementation denominator drifted")
    require(audit["correctedCumulative"]["publisherTargetImplementationIdentities"] == 1651, "cumulative identity correction drifted")
    require(audit["correctedCumulative"]["commercialTargetOfferings"] == 2319, "cumulative offering correction drifted")
    require(len(list((ROOT / "raw/speedwell/product-pages").glob("*.html"))) == 194, "Speedwell product-page corpus incomplete")
    require(len(list((ROOT / "raw/national-target").glob("products-page-*.json"))) == 4, "National API corpus incomplete")
    require(len(list((ROOT / "raw/us-target").glob("products-page-*.json"))) == 2, "U.S. Target API corpus incomplete")
    for name in ("tgt-american.pdf", "tgt-national.pdf", "tgt-speedwell.pdf", "tgt-ustarget.pdf", "current-licensed-manufacturers.html"):
        path = ROOT / "sources/nra" / name
        require(path.exists() and path.stat().st_size > 1000, f"missing NRA source {name}")

    # Rebuild a final manifest after all validation artifacts exist.
    files = []
    for path in sorted(ROOT.rglob("*")):
        if path.is_file() and path.name != "manifest.json":
            payload = path.read_bytes()
            files.append({"path": str(path.relative_to(ROOT)), "bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()})
    (ROOT / "manifest.json").write_text(json.dumps({"files": files}, indent=2) + "\n")
    print(json.dumps({"status": "PASS", "validatedRecords": len(all_records), "nraMatrixRows": len(matrix["rows"]), "manifestFiles": len(files)}, indent=2))


if __name__ == "__main__":
    main()
