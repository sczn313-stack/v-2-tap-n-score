#!/usr/bin/env python3
"""Build reproducible Publisher #12 pricing, volume, and cumulative models."""

from __future__ import annotations

import json
import statistics
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent
CATALOG = json.loads((ROOT / "THOMPSON_CATALOG.json").read_text())
BASELINE_PATH = ROOT.parent / "2026-08-22-11-printer-annual-volume" / "MODEL.json"
BASELINE = json.loads(BASELINE_PATH.read_text())
OUTPUT = ROOT / "THOMPSON_VOLUME_PRICING_MODEL.json"


def fee_for_piece(price: float) -> float:
    return round(price * 0.10, 6) if price < 1.00 else 0.10


def observations() -> list[dict]:
    rows = []
    for product in CATALOG["products"]:
        if product["productClass"] not in {"publisher_target_identity", "target_system_bundle"}:
            continue
        if product["commercialVariants"]:
            for variant in product["commercialVariants"]:
                price = variant["perPhysicalTargetPriceUsd"]
                if price is None:
                    continue
                rows.append(
                    {
                        "productName": product["productName"],
                        "productUrl": product["productUrl"],
                        "sku": variant["sku"],
                        "packageLabel": variant["packageLabel"],
                        "packagePriceUsd": variant["priceUsd"],
                        "physicalTargetPiecesPerPackage": variant["physicalTargetPiecesPerPackage"],
                        "piecePriceUsd": price,
                        "sczn3FeePerPieceUsd": fee_for_piece(price),
                        "sczn3FeePerPackageUsd": round(fee_for_piece(price) * variant["physicalTargetPiecesPerPackage"], 4),
                        "feePercentOfSellingPrice": round(fee_for_piece(price) / price * 100, 4),
                    }
                )
        elif product["fixedPerPhysicalTargetPriceUsd"] is not None:
            price = product["fixedPerPhysicalTargetPriceUsd"]
            rows.append(
                {
                    "productName": product["productName"],
                    "productUrl": product["productUrl"],
                    "sku": product["baseSku"],
                    "packageLabel": f'{product["fixedPhysicalTargetPiecesPerPackage"]} physical target pieces',
                    "packagePriceUsd": product["basePriceUsd"],
                    "physicalTargetPiecesPerPackage": product["fixedPhysicalTargetPiecesPerPackage"],
                    "piecePriceUsd": price,
                    "sczn3FeePerPieceUsd": fee_for_piece(price),
                    "sczn3FeePerPackageUsd": round(fee_for_piece(price) * product["fixedPhysicalTargetPiecesPerPackage"], 4),
                    "feePercentOfSellingPrice": round(fee_for_piece(price) / price * 100, 4),
                }
            )
    return rows


def representative(rows: list[dict]) -> list[dict]:
    wants = (
        ("Trouble Shooter Handgun Diagnostic - 19", "5 pack"),
        ("Trouble Shooter Handgun Diagnostic - 19", "20 pack"),
        ("Trouble Shooter Handgun Diagnostic - 19", "100 pack"),
        ("TAC Target", "5 Pack"),
        ("TAC Target", "100 Pack"),
        ("HALO Threat Code", "10 pack"),
        ("HALO Threat Code", "50 pack"),
        ("B27Q Blue Half-Size", "100 Pack"),
        ("Hot Spots 1\"", "100 Sheets"),
        ("HALO Stick-Um-Up", "100 physical"),
    )
    selected = []
    for product_fragment, package_fragment in wants:
        found = next(
            (
                row for row in rows
                if product_fragment.lower() in row["productName"].lower()
                and package_fragment.lower() in row["packageLabel"].lower()
            ),
            None,
        )
        if found and found not in selected:
            selected.append(found)
    return selected


def main() -> None:
    rows = observations()
    prices = sorted(row["piecePriceUsd"] for row in rows)
    fees = sorted(row["sczn3FeePerPieceUsd"] for row in rows)
    below = [row for row in rows if row["piecePriceUsd"] < 1.00]
    at_or_above = [row for row in rows if row["piecePriceUsd"] >= 1.00]
    thompson_volume = {
        "lowPieces": 500_000,
        "basePieces": 1_750_000,
        "highPieces": 3_500_000,
        "confidence": "low",
        "status": "planning estimate; no audited Thompson unit sales or target-category revenue found",
        "basis": (
            "Official evidence establishes a family-owned Ohio manufacturer with a full industrial "
            "building/warehouse, nationwide sporting-goods, gun-shop, and range distribution, a public "
            "retail/bulk/dealer channel, 109 target identities and 293 target/system offerings, plus a "
            "confirmed SIG SAUER collaboration. Scenario bounds use capacity/catalog/channel bounding; "
            "catalog breadth is not converted mechanically into sales."
        ),
        "reasonablenessChecks": {
            "twentyPiecePackageEquivalents": {
                "low": 25_000,
                "base": 87_500,
                "high": 175_000,
            },
            "hundredPiecePackageEquivalents": {
                "low": 5_000,
                "base": 17_500,
                "high": 35_000,
            },
            "warning": "Equivalent packages are scale checks, not observed annual orders or assumed package mix.",
        },
    }
    baseline = BASELINE["combined"]
    combined = {
        "lowPieces": baseline["lowPieces"] + thompson_volume["lowPieces"],
        "basePieces": baseline["basePieces"] + thompson_volume["basePieces"],
        "highPieces": baseline["highPieces"] + thompson_volume["highPieces"],
    }
    family_counts = Counter(
        family
        for product in CATALOG["products"]
        if product["isActualShootableTarget"]
        for family in product["targetFamilies"]
    )
    output = {
        "modelId": "POS-THOMPSON-PUBLISHER-12-2026-08-23-V1",
        "observationDate": "2026-08-23",
        "publisher": "Thompson Target Inc.",
        "catalogDenominators": CATALOG["denominators"],
        "targetFamilyCountsNonExclusive": dict(family_counts.most_common()),
        "pricing": {
            "candidate": {
                "belowOneDollar": "10% of actual Smart Target selling price per physical target",
                "oneDollarOrMore": "$0.10 per enabled physical target",
            },
            "exactPublicPriceObservations": len(rows),
            "unpricedTargetSystemOfferings": CATALOG["denominators"]["targetAndTargetSystemCommercialOfferings"] - len(rows),
            "piecePriceUsd": {
                "minimum": min(prices),
                "median": statistics.median(prices),
                "meanUnweightedCatalogMix": round(statistics.mean(prices), 6),
                "maximum": max(prices),
            },
            "feePerPieceUsd": {
                "minimum": min(fees),
                "median": statistics.median(fees),
                "meanUnweightedCatalogMix": round(statistics.mean(fees), 6),
                "maximum": max(fees),
            },
            "priceTierCounts": {
                "belowOneDollar": len(below),
                "oneDollarOrMore": len(at_or_above),
            },
            "representativePublishedPackages": representative(rows),
            "warning": (
                "The mean is an unweighted catalog-observation proxy, not a sales-weighted realization. "
                "Dealer and negotiated wholesale prices are not publicly exposed and are not invented."
            ),
        },
        "annualVolume": {
            "unit": BASELINE["unit"],
            "existing11PublisherBaseline": {
                "modelId": BASELINE["modelId"],
                "lowPieces": baseline["lowPieces"],
                "basePieces": baseline["basePieces"],
                "highPieces": baseline["highPieces"],
                "preservedUnchanged": True,
            },
            "thompson": thompson_volume,
            "combined12Publishers": combined,
        },
        "cumulativeP_OS": {
            "existing11Publishers": {
                "publisherTargetImplementationIdentities": 1_683,
                "commercialTargetOfferings": 2_416,
                "recognitionReadyIdentities": 1_683,
                "recognitionReadyOfferings": 2_416,
                "smartEvidenceEligibleIdentities": 1_680,
                "smartEvidenceEligibleOfferings": 2_413,
            },
            "publisher12Additive": {
                "publisherTargetImplementationIdentities": 109,
                "commercialTargetAndSystemOfferings": 293,
                "recognitionReadyIdentities": 109,
                "recognitionReadyOfferings": 293,
                "smartEvidenceEligibleIdentities": 109,
                "smartEvidenceEligibleOfferings": 292,
                "smartEvidenceOfferingBoundary": "Quik-Stand includes unspecified free targets, so that system offering is not promoted to Smart Evidence eligibility.",
            },
            "combined12Publishers": {
                "publisherTargetImplementationIdentities": 1_792,
                "commercialTargetAndSystemOfferings": 2_709,
                "recognitionReadyIdentities": 1_792,
                "recognitionReadyOfferings": 2_709,
                "smartEvidenceEligibleIdentities": 1_789,
                "smartEvidenceEligibleOfferings": 2_705,
                "implementedBehavioralFamilies": 16,
                "newBehavioralFamiliesRequiredByThompson": 0,
            },
            "recognitionWarning": "Recognition-ready evidence is not a claim that photo recognition has been implemented.",
        },
    }
    OUTPUT.write_text(json.dumps(output, indent=2) + "\n")
    print(json.dumps({"pricing": output["pricing"], "annualVolume": output["annualVolume"]}, indent=2))


if __name__ == "__main__":
    main()
