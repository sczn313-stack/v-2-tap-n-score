#!/usr/bin/env python3
"""Fail-closed validation for the Thompson Publisher #12 evidence bundle."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
CATALOG = json.loads((ROOT / "THOMPSON_CATALOG.json").read_text())
MODEL = json.loads((ROOT / "THOMPSON_VOLUME_PRICING_MODEL.json").read_text())


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)
    print(f"PASS: {message}")


def main() -> None:
    download = json.loads((ROOT / "sources/download-manifest.json").read_text())
    variants = json.loads((ROOT / "sources/variant-manifest.json").read_text())
    check(download["count"] == 129, "129 publisher product pages preserved")
    check(variants["count"] == 280, "280 publisher package-variant responses preserved")
    for record in download["records"]:
        path = ROOT / record["file"]
        check(path.exists(), f"source exists: {record['file']}")
        check(hashlib.sha256(path.read_bytes()).hexdigest() == record["sha256"], f"source hash: {record['file']}")

    denominators = CATALOG["denominators"]
    check(denominators["publicProductPages"] == 129, "page denominator")
    check(denominators["publisherTargetImplementationIdentities"] == 109, "target-identity denominator")
    check(denominators["targetSystemBundlePages"] == 10, "target-system denominator")
    check(denominators["nonTargetAccessoryPages"] == 10, "non-target denominator")
    check(denominators["targetAndTargetSystemCommercialOfferings"] == 293, "commercial-offering denominator")

    products = CATALOG["products"]
    check(len({product["productUrl"] for product in products}) == 129, "unique canonical product URLs")
    check(all(product["primaryImage"] for product in products), "every product page exposes a primary image")
    commercial_skus = []
    for product in products:
        if product["productClass"] not in {"publisher_target_identity", "target_system_bundle"}:
            continue
        if product["commercialVariants"]:
            commercial_skus.extend(variant["sku"] for variant in product["commercialVariants"])
        else:
            commercial_skus.append(product["baseSku"])
    check(len(commercial_skus) == 293, "one exact SKU for every target/system commercial offering")
    check(None not in commercial_skus and len(set(commercial_skus)) == 293, "commercial SKUs are present and unique")

    pricing = MODEL["pricing"]
    check(pricing["exactPublicPriceObservations"] == 292, "292 exact public per-piece price calculations")
    check(pricing["unpricedTargetSystemOfferings"] == 1, "one target-system offering lacks an exact target-piece denominator")
    check(pricing["priceTierCounts"]["belowOneDollar"] + pricing["priceTierCounts"]["oneDollarOrMore"] == 292, "pricing tiers reconcile")
    check(all(
        row["sczn3FeePerPieceUsd"] <= 0.10
        for row in pricing["representativePublishedPackages"]
    ), "pricing candidate caps representative fees at ten cents")

    annual = MODEL["annualVolume"]
    check(annual["existing11PublisherBaseline"] == {
        "modelId": "POS-11P-ANNUAL-PAPER-TARGET-VOLUME-2026-08-22-V1",
        "lowPieces": 12_050_000,
        "basePieces": 24_550_000,
        "highPieces": 45_000_000,
        "preservedUnchanged": True,
    }, "historical 11-publisher model preserved unchanged")
    check(annual["combined12Publishers"] == {
        "lowPieces": 12_550_000,
        "basePieces": 26_300_000,
        "highPieces": 48_500_000,
    }, "12-publisher annual-volume sums")
    cumulative = MODEL["cumulativeP_OS"]["combined12Publishers"]
    check(cumulative["publisherTargetImplementationIdentities"] == 1_792, "12-publisher target identities")
    check(cumulative["commercialTargetAndSystemOfferings"] == 2_709, "12-publisher commercial target/system offerings")
    check(cumulative["newBehavioralFamiliesRequiredByThompson"] == 0, "no new behavioral family required")
    print("\nTHOMPSON PUBLISHER #12 VALIDATION: PASS")


if __name__ == "__main__":
    main()
