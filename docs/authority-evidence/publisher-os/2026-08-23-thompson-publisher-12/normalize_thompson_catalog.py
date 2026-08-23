#!/usr/bin/env python3
"""Normalize preserved Thompson Target pages and package variants for P-OS."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PRODUCTS = ROOT / "sources" / "products"
VARIANT_MANIFEST = ROOT / "sources" / "variant-manifest.json"
OUTPUT = ROOT / "THOMPSON_CATALOG.json"


def clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = re.sub(r"<!--.*?-->", " ", value, flags=re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def match(pattern: str, source: str) -> str | None:
    found = re.search(pattern, source, re.I | re.S)
    return clean(found.group(1)) if found else None


def dimension(title: str) -> str | None:
    found = re.search(r"(\d+(?:\.\d+)?)[\"”]?\s*[xX]\s*(\d+(?:\.\d+)?)[\"”]?", title)
    return f'{found.group(1)}" x {found.group(2)}"' if found else None


def package_quantity(label: str | None, title: str) -> int | None:
    for value in (label or "", title):
        found = re.search(r"\b(\d+)\s*(?:pack|targets?|sheets?)\b", value, re.I)
        if found:
            return int(found.group(1))
    return None


def separable_targets_per_sheet(title: str) -> int:
    """Count peel-and-stick targets, but never printed zones on one paper target."""
    if not re.search(r"adhesive|peel|stick", title, re.I):
        return 1
    found = re.search(r"\b(\d+)\s*/\s*sheet\b", title, re.I)
    return int(found.group(1)) if found else 1


def classify(slug: str) -> str:
    accessories = (
        "poster", "t-shirt", "clip-shoot", "target-taxi-deluxe", "range-rig-water",
        "range-rig-zipper", "clip-on-3d-glasses",
    )
    systems = (
        "combo-pack", "range-rig-all-in-one", "silhouette-combo-60-pack",
        "bullseye-combo-60-pack", "progressive-pistol-training-60-pack",
        "quik-stand-sturdy",
    )
    if any(token in slug for token in systems):
        return "target_system_bundle"
    if any(token in slug for token in accessories):
        return "non_target_accessory"
    return "publisher_target_identity"


def families(slug: str) -> list[str]:
    result = []
    tests = (
        ("reactive", ("halo-", "reactive", "splatter")),
        ("adhesive", ("adhesive", "hot-spots", "stick-um-up", "shot-spot")),
        ("diagnostic", ("trouble-shooter", "group-shooter", "diagnostic")),
        ("cue_drill", ("tac-target", "audible-cues")),
        ("qualification", ("b27q", "qualification")),
        ("competition", ("ipsc", "uspsa")),
        ("decision_scenario", ("threat-code",)),
        ("game", ("shooting-game", "air-strike", "gun-slingers", "checkers", "alien-invasion", "infected-zombie")),
        ("zeroing_sight_in", ("scope", "sight-in", "m-rad", "sight-seer", "dead-center")),
        ("hunting_patterning", ("deer", "turkey", "squirrel", "shotgun")),
        ("silhouette_defense", ("silhouette", "center-fire", "b27", "hostage", "immobilize", "vital-information")),
        ("recreational_novelty", ("zombie", "werewolf", "clown", "crazy-bones", "money-grabber", "cleaver")),
        ("bullseye_practice", ("bullseye", "bright-lightning", "yellow-jacket", "hot-shot", "true-blue", "basic-training")),
        ("three_dimensional_art", ("3d-",)),
    )
    for name, tokens in tests:
        if any(token in slug for token in tokens):
            result.append(name)
    return result or ["general_practice"]


def capability_map(family_names: list[str]) -> list[dict]:
    capabilities = [{"family": "smartEvidenceCapture", "status": "applicable"}]
    mapping = {
        "zeroing_sight_in": ("zeroing", "authority_data_required"),
        "diagnostic": ("diagnosticFeedbackEvaluation", "publisher_region_profile_required"),
        "cue_drill": ("cueDrillOrchestration", "publisher_cue_drill_profile_required"),
        "qualification": ("qualificationCourseEvaluation", "external_course_authority_required"),
        "competition": ("precisionRingScore", "exact_scoring_region_authority_required"),
        "decision_scenario": ("decisionScenarioEvaluation", "publisher_scenario_profile_required"),
        "game": ("recreationalChallenge", "publisher_game_rules_profile_required"),
        "recreational_novelty": ("recreationalChallenge", "publisher_game_rules_profile_required"),
        "bullseye_practice": ("precisionRingScore", "exact_scoring_region_authority_required"),
    }
    for family_name in family_names:
        if family_name in mapping:
            capability, status = mapping[family_name]
            entry = {"family": capability, "status": status}
            if entry not in capabilities:
                capabilities.append(entry)
    return capabilities


def main() -> None:
    manifest = json.loads(VARIANT_MANIFEST.read_text())
    variants_by_url: dict[str, list[dict]] = {}
    for record in manifest["records"]:
        response = json.loads((ROOT / record["file"]).read_text())["data"]
        price = response.get("price", {}).get("without_tax", {}).get("value")
        variant = {
            "packageLabel": record["packageLabel"],
            "packageQuantity": package_quantity(record["packageLabel"], ""),
            "sku": response.get("sku"),
            "upc": response.get("upc"),
            "mpn": response.get("mpn"),
            "priceUsd": price,
            "inStock": response.get("instock"),
            "variantId": response.get("variantId"),
            "sourceFile": record["file"],
        }
        variants_by_url.setdefault(record["productUrl"], []).append(variant)

    products = []
    for path in sorted(PRODUCTS.glob("*.html")):
        source = path.read_text(errors="ignore")
        canonical = match(r"<link rel='canonical' href='([^']+)'", source)
        title = match(r'<h1 class="productView-title"[^>]*>(.*?)</h1>', source)
        if not canonical or not title:
            raise ValueError(f"Missing canonical/title in {path}")
        slug = canonical.rstrip("/").split("/")[-1]
        bc_match = re.search(r"var BCData = (\{.*?\});", source, re.S)
        bc = json.loads(bc_match.group(1))["product_attributes"] if bc_match else {}
        base_price = bc.get("price", {}).get("without_tax", {}).get("value")
        price_range = bc.get("price", {}).get("price_range", {})
        family_names = families(slug)
        product_class = classify(slug)
        publisher_description = match(
            r'<div class="tab-content is-active" id="tab-description">(.*?)<!-- snippet location product_description -->',
            source,
        )
        intended_text = " ".join(filter(None, (title, publisher_description)))
        platform_applicability = [
            platform
            for platform in ("rifle", "pistol", "handgun", "shotgun")
            if re.search(rf"\b{platform}\b", intended_text, re.I)
        ]
        variants = sorted(
            variants_by_url.get(canonical, []),
            key=lambda item: (item["packageQuantity"] is None, item["packageQuantity"] or 0),
        )
        sheet_multiplier = separable_targets_per_sheet(title)
        for variant in variants:
            quantity = variant["packageQuantity"]
            physical_quantity = quantity * sheet_multiplier if quantity else None
            variant["separableTargetsPerSheet"] = sheet_multiplier
            variant["physicalTargetPiecesPerPackage"] = physical_quantity
            variant["perPhysicalTargetPriceUsd"] = (
                round(variant["priceUsd"] / physical_quantity, 6)
                if variant["priceUsd"] is not None and physical_quantity else None
            )
        fixed_quantity = package_quantity(None, title) if not variants else None
        fixed_physical_quantity = fixed_quantity * sheet_multiplier if fixed_quantity else None
        products.append(
            {
                "recordId": f"thompson-{bc.get('mpn') or slug}",
                "publisher": "Thompson Target Inc.",
                "productName": title,
                "productUrl": canonical,
                "sourceFile": str(path.relative_to(ROOT)),
                "productClass": product_class,
                "isActualShootableTarget": product_class == "publisher_target_identity",
                "isTargetSystemBundle": product_class == "target_system_bundle",
                "baseSku": bc.get("sku"),
                "baseUpc": bc.get("upc"),
                "baseMpn": bc.get("mpn"),
                "publishedDimensions": dimension(title),
                "description": match(r'<meta name="description" content="([^"]*)"', source),
                "publisherDescription": publisher_description,
                "publisherStatedPlatformApplicability": platform_applicability,
                "primaryImage": match(r'data-mfp-src="([^"]+)"', source),
                "basePriceUsd": base_price,
                "priceRangeUsd": {
                    "min": price_range.get("min", {}).get("without_tax", {}).get("value", base_price),
                    "max": price_range.get("max", {}).get("without_tax", {}).get("value", base_price),
                },
                "fixedPackageQuantity": fixed_quantity,
                "separableTargetsPerSheet": sheet_multiplier,
                "fixedPhysicalTargetPiecesPerPackage": fixed_physical_quantity,
                "fixedPerPhysicalTargetPriceUsd": (
                    round(base_price / fixed_physical_quantity, 6)
                    if base_price is not None and fixed_physical_quantity else None
                ),
                "commercialVariants": variants,
                "targetFamilies": family_names,
                "capabilityMappings": capability_map(family_names) if product_class != "non_target_accessory" else [],
                "observedAt": "2026-08-23",
            }
        )

    shootable = [product for product in products if product["isActualShootableTarget"]]
    systems = [product for product in products if product["isTargetSystemBundle"]]
    accessories = [product for product in products if product["productClass"] == "non_target_accessory"]
    commercial_offerings = sum(
        max(1, len(product["commercialVariants"])) for product in shootable + systems
    )
    exact_skus = {
        variant["sku"]
        for product in products
        for variant in product["commercialVariants"]
        if variant["sku"]
    } | {product["baseSku"] for product in products if product["baseSku"]}
    exact_upcs = {
        variant["upc"]
        for product in products
        for variant in product["commercialVariants"]
        if variant["upc"]
    } | {product["baseUpc"] for product in products if product["baseUpc"]}
    output = {
        "schemaVersion": "1.0",
        "publisher": "Thompson Target Inc.",
        "observedAt": "2026-08-23",
        "denominators": {
            "publicProductPages": len(products),
            "publisherTargetImplementationIdentities": len(shootable),
            "targetSystemBundlePages": len(systems),
            "nonTargetAccessoryPages": len(accessories),
            "targetAndTargetSystemCommercialOfferings": commercial_offerings,
            "exactExposedSkuRecords": len(exact_skus),
            "exactExposedUpcRecords": len(exact_upcs),
        },
        "products": products,
    }
    OUTPUT.write_text(json.dumps(output, indent=2) + "\n")
    print(json.dumps(output["denominators"], indent=2))


if __name__ == "__main__":
    main()
