#!/usr/bin/env python3
"""Normalize the 2026-08-20 five-publisher public-catalog evidence batch.

This is evidence tooling only. It does not write production registries or grant
execution authority. Capability mappings are conservative discovery candidates;
the smart-evidence floor is the only default relationship for a shootable target.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
OUT = ROOT / "normalized"
OBSERVED_AT = "2026-08-20"

FAMILIES = {
    "CF-01": "smart evidence capture",
    "CF-02": "registered/open numeric region or ring scoring",
    "CF-03": "bounded entity-completion recreational challenge",
    "CF-04": "zeroing/group/correction/confirmation",
    "CF-05": "time-plus-penalty",
    "CF-06": "timed selected-hit/points-down",
    "CF-07": "fixed course/shot allocation",
    "CF-08": "multiplayer point accumulation",
    "CF-09": "ordered sequence/miss transfer",
    "CF-10": "adversarial board state",
    "CF-11": "diagnostic feedback",
    "CF-12": "qualification/staged-course evaluation",
    "CF-13": "cue/drill orchestration",
    "CF-14": "decision discrimination/scenario state",
    "CF-15": "longitudinal progression",
    "CF-16": "collection/hand game state",
}


def read_json(path: Path):
    return json.loads(path.read_text())


def textify(value: str | None) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def slug(value: str) -> str:
    value = html.unescape(value).lower()
    value = re.sub(r"\b(?:pack of )?\d+[- ]?pack\b", " ", value)
    value = re.sub(r"\b\d+\s*targets? per (?:sheet|pack)\b", " ", value)
    value = re.sub(r"\b(?:black|white|orange|green|yellow|blue|red|pink|tan|multi(?:-color)?|chartreuse)\b", " ", value)
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value


def extract_dimensions(value: str) -> list[str]:
    value = value.replace("“", '"').replace("”", '"').replace("″", '"')
    patterns = [
        r"\b\d+(?:\.\d+)?\s*(?:\"|in(?:ch(?:es)?)?)\s*[xX×]\s*\d+(?:\.\d+)?\s*(?:\"|in(?:ch(?:es)?)?)?(?:\s*[xX×]\s*\d+(?:/\d+|\.\d+)?\s*(?:\"|in(?:ch(?:es)?)?))?",
        r"\b\d+(?:\.\d+)?\s*[Ww]\s*[xX×]\s*\d+(?:\.\d+)?\s*[Hh]\b",
        r"\b\d+(?:\.\d+)?[- ](?:inch|in\.)\b",
        r"\b\d+(?:\.\d+)?\s*(?:\"|inch(?:es)?)\s+(?:square|diameter)\b",
    ]
    found = []
    for pattern in patterns:
        found.extend(re.findall(pattern, value, flags=re.I))
    return list(dict.fromkeys(x.strip() for x in found))


def family_candidates(title: str, description: str) -> list[dict]:
    t = title.lower()
    hay = f"{title} {description}".lower()
    mappings = [{
        "familyId": "CF-01",
        "family": FAMILIES["CF-01"],
        "status": "supported_floor",
        "basis": "Known publisher target can preserve identity and shooter evidence without inventing richer meaning.",
    }]
    candidates: list[tuple[str, str]] = []
    if re.search(r"sight[ -]?in|zero(?:ing)?|load development|grid", hay):
        candidates.append(("CF-04", "Publisher language indicates sight-in, zeroing, load-development, or grid use; exact geometry and procedure remain authority-gated."))
    if re.search(r"bullseye|rings?|scorekeeper|scoring|\bscore\b|points?", hay):
        candidates.append(("CF-02", "Printed rings/points or scoring language may support governed scoring after exact region/value authority is packaged."))
    if re.search(r"qualification|\bqual\b|course of fire|ipsc|uspsa|idpa|ibs|b-?27|bc-?27|\bnra\b", t):
        candidates.append(("CF-12", "Qualification or competition language requires a versioned governing course/profile; product identity alone is insufficient."))
    if re.search(r"command|commander|drill|timed", t):
        candidates.append(("CF-13", "Command, cue, sequence, or timing behavior requires an authoritative Cue/Drill Profile."))
    if re.search(r"diagnostic|tutor|handgun trainer|firearm trainer", t):
        candidates.append(("CF-11", "Tutor/trainer labeling may support publisher-label matching only after exact region/label authority is captured."))
    if re.search(r"no threat|threat|hostage|decision|bad guy", t):
        candidates.append(("CF-14", "Scenario artwork or naming does not establish the expected response; a governed Decision Scenario Profile is required."))
    if re.search(r"deck of cards|playing cards|poker|hand game", t):
        candidates.append(("CF-16", "Collection/hand behavior requires complete publisher rules; familiar card rules are not authority."))
    if re.search(r"progression|level up|multi[- ]session", hay):
        candidates.append(("CF-15", "Any across-session claim requires authoritative progression rules and governed subject continuity."))
    if re.search(r"dueling|reset(?:ting)?|knockover|spinner|spinning|popper|bottle|balloon", t):
        candidates.append(("CF-03", "Reactive or entity-completion use may be available only when completion rules and state are publisher-authorized."))
    if re.search(r"pool|dice|game on|handgun games|shot commander", t):
        candidates.append(("CF-08", "Recreational artwork suggests optional game play, but exact multiplayer/point rules must be captured before execution."))
    seen = {"CF-01"}
    for family_id, basis in candidates:
        if family_id in seen:
            continue
        seen.add(family_id)
        mappings.append({
            "familyId": family_id,
            "family": FAMILIES[family_id],
            "status": "candidate_authority_required",
            "basis": basis,
        })
    return mappings


def classify_highwild(title: str, description: str) -> str:
    hay = f"{title} {description}".lower()
    non_target = re.search(
        r"feeder|trail (?:game )?camera|hammock|game hoist|gambrel|trophy mount|bow (?:& )?gear|duck call|cargo lash|"
        r"skinning tool|ladder stand|tree step|shooting rest|earmuff|safety flag|gift card|shipping|turkey fan mounting",
        hay,
    )
    if non_target:
        return "non_target_catalog_product"
    t = title.lower()
    if re.search(r" — (?:target )?(?:mount bracket|hanger|stand|parts?)$", t):
        return "target_accessory"
    actual_signal = re.search(
        r"paper targets?|cardboard targets?|target stickers?|splatter.*targets?|"
        r"(?:gong|torso|hostage|silhouette|bullseye|popper|spinner|resetting|dueling tree|knockovers?|bottle)"
        r"(?:.*shooting)? targets?|complete target system|target system|target kit|bullet trap.*(?:paper|spinner)",
        t,
    )
    accessory_only = re.search(
        r"target (?:stand|hanger|mount|holder)|stand base|mount(?:ing)? (?:kit|bracket)|hanger(?: parts)?|"
        r"conversion adapter|painting stencil|steel post|clay pigeon target holder|bullet trap$|parts$|springs?$",
        t,
    )
    included_object = re.search(r"(?:\+| with ).*(?:\d+.*(?:gong|torso)|hostage target|silhouette|paper targets?|spinner targets?)", t)
    if accessory_only and not included_object and not re.search(r"gong shooting target|hostage target|torso (?:silhouette )?shooting target|paper targets?|spinner target|resetting target|dueling tree target|complete target system", t):
        return "target_accessory"
    if not actual_signal and not included_object:
        return "target_accessory" if re.search(r"target|gong|stand|hanger|trap", t) else "non_target_catalog_product"
    if re.search(r"(?:stand|hanger|mount|trap).*(?:\+| with | for paper targets?).*(?:gong|torso|silhouette|hostage|paper target|spinner)|target system|target kit", t):
        return "shootable_target_system"
    return "shootable_target"


def classify_allen(title: str) -> str:
    t = title.lower()
    if re.search(r"thrower|target stand|stand base|hanging hook|target hanger|target stakes|gong target chain|gong hook|recoil spring", t):
        if re.search(r"target kit|trainer kit", t):
            return "shootable_target_system"
        return "target_accessory"
    return "shootable_target_system" if re.search(r"target system|target & trap|target kit|trainer kit", t) else "shootable_target"


def classify_champion(product_type: str, title: str) -> str:
    if product_type in {"Paper Targets", "Paper", "Steel Targets"}:
        return "shootable_target"
    if product_type == "Targets":
        return "target_accessory" if "staple gun" in title.lower() else "shootable_target"
    if product_type == "Accessories" and re.search(r"target.*(?:holder|hanger)|stand", title, re.I):
        return "target_accessory"
    return "non_target_catalog_product"


def make_record(*, publisher_id: str, publisher_name: str, product_id, variant_id, name: str,
                sku_value, url: str, category, description: str, dimensions: list[str], images: list[str],
                commercial_variant: dict, product_class: str, source: list[dict], available=None,
                price=None, authority_gaps=None, recognition=None) -> dict:
    sku_clean = str(sku_value).strip() if sku_value not in (None, "") else None
    record_key = sku_clean or f"SOURCE-{product_id}" + (f"-VARIANT-{variant_id}" if variant_id else "")
    actual = product_class in {"shootable_target", "shootable_target_system"}
    mappings = family_candidates(name, description) if actual else []
    gaps = list(authority_gaps or [])
    if not sku_clean:
        gaps.append("Exact publisher SKU is not exposed by the captured public source; preserve source product identity and fail closed on SKU-dependent admission.")
    if actual and any(x["status"] == "candidate_authority_required" for x in mappings):
        gaps.append("Richer capability candidates are discovery classifications only until exact profile/geometry/rules authority is packaged and admitted.")
    return {
        "recordId": f"{publisher_id}:{record_key}",
        "publisher": {"id": publisher_id, "name": publisher_name},
        "sourceProductId": str(product_id),
        "sourceVariantId": str(variant_id) if variant_id is not None else None,
        "productName": name,
        "sku": sku_clean,
        "fallbackProductKey": None if sku_clean else record_key,
        "productUrl": url,
        "publisherCategory": category,
        "description": description,
        "publishedDimensions": dimensions,
        "imageRefs": images,
        "commercialVariant": commercial_variant,
        "availability": available,
        "observedPrice": price,
        "productClass": product_class,
        "isActualShootableTarget": actual,
        "behaviorLineageKey": slug(name),
        "capabilityMappings": mappings,
        "authorityGaps": list(dict.fromkeys(gaps)),
        "recognitionTraits": recognition or {},
        "sources": source,
        "observedAt": OBSERVED_AT,
    }


def normalize_shopify(path_list: list[Path], publisher_id: str, publisher_name: str, base_url: str, classifier):
    products = []
    for path in path_list:
        products.extend((product, path) for product in read_json(path)["products"])
    records = []
    for product, source_path in products:
        description = textify(product.get("body_html"))
        variants = product.get("variants") or [{}]
        for variant in variants:
            variant_title = variant.get("title")
            full_name = product["title"] if not variant_title or variant_title == "Default Title" else f"{product['title']} — {variant_title}"
            pclass = classifier(product.get("product_type", ""), full_name) if publisher_id == "champion" else classifier(full_name, description) if publisher_id == "highwild" else classifier(full_name)
            image = variant.get("featured_image") or {}
            image_urls = [image.get("src")] if isinstance(image, dict) and image.get("src") else []
            image_urls.extend(x.get("src") for x in product.get("images", []) if x.get("src"))
            records.append(make_record(
                publisher_id=publisher_id,
                publisher_name=publisher_name,
                product_id=product["id"],
                variant_id=variant.get("id"),
                name=full_name,
                sku_value=variant.get("sku"),
                url=f"{base_url}/products/{product['handle']}",
                category=product.get("product_type") or product.get("tags") or None,
                description=description,
                dimensions=extract_dimensions(f"{full_name} {description}"),
                images=list(dict.fromkeys(image_urls)),
                commercial_variant={"title": variant_title, "option1": variant.get("option1"), "option2": variant.get("option2"), "option3": variant.get("option3")},
                product_class=pclass,
                source=[{"kind": "publisher_catalog_api", "path": str(source_path.relative_to(ROOT)), "productId": str(product["id"])}],
                available=variant.get("available"),
                price={"amount": variant.get("price"), "currency": "USD"} if variant.get("price") is not None else None,
                recognition={
                    "titleTokens": re.findall(r"[a-z0-9]+", product["title"].lower()),
                    "material": "steel" if "steel" in f"{full_name} {description}".lower() else "paper_or_cardboard" if re.search(r"paper|cardboard|corrugated|tagboard", f"{full_name} {description}", re.I) else None,
                    "reactive": bool(re.search(r"reactive|splatter|splash|reset|spinner|popper|dueling|knockover", f"{full_name} {description}", re.I)),
                },
            ))
    return records


def normalize_splatterburst():
    products = read_json(RAW / "splatterburst/store-products.json")
    records = []
    for product in products:
        description = textify(product.get("description") or product.get("short_description"))
        categories = [x.get("name") for x in product.get("categories", [])]
        pclass = "maintenance_consumable" if any("cover up" in (x or "").lower() for x in categories) else "shootable_target"
        records.append(make_record(
            publisher_id="splatterburst",
            publisher_name="Splatterburst Targets",
            product_id=product["id"],
            variant_id=None,
            name=html.unescape(product["name"]),
            sku_value=product.get("sku"),
            url=product.get("permalink"),
            category=categories,
            description=description,
            dimensions=extract_dimensions(f"{product['name']} {description}"),
            images=[x.get("src") for x in product.get("images", []) if x.get("src")],
            commercial_variant={"type": product.get("type"), "variations": product.get("variations") or []},
            product_class=pclass,
            source=[{"kind": "publisher_store_api", "path": "raw/splatterburst/store-products.json", "productId": str(product["id"])}],
            available=product.get("is_in_stock"),
            price={"minorUnits": product.get("prices", {}).get("price"), "currency": product.get("prices", {}).get("currency_code")},
            recognition={
                "titleTokens": re.findall(r"[a-z0-9]+", html.unescape(product["name"]).lower()),
                "material": "adhesive_paper" if re.search(r"adhesive|stick", product["name"], re.I) else "paper",
                "reactive": bool(re.search(r"splatter", product["name"], re.I)),
            },
        ))
    return records


def normalize_birchwood():
    products = read_json(RAW / "birchwood-casey/current-products-browser.json")
    records = []
    for product in products:
        description = " ".join(x.lstrip("- ") for x in product.get("features", []) if x != "- list:")
        title = product["title"]
        if re.search(r"hand thrower", title, re.I):
            pclass = "non_target_catalog_product"
        elif re.search(r"target paint", title, re.I):
            pclass = "maintenance_consumable"
        elif re.search(r"target hanger|target stand|target hook|target mount|target dispenser|display rack|target stapler|target stakes|gong hangers", title, re.I) and not re.search(r"with steel stand|target kits|self-resetting targets|target stand kit.*(?:target|plate)", title, re.I):
            pclass = "target_accessory"
        elif re.search(r"with steel stand|target kits|self-resetting targets|steel range pack", f"{title} {description}", re.I):
            pclass = "shootable_target_system"
        else:
            pclass = "shootable_target"
        options = product.get("publishedOptions") or []
        records.append(make_record(
            publisher_id="birchwood-casey",
            publisher_name="Birchwood Casey",
            product_id=product.get("siteProductId") or product["url"].rstrip("/").split("/")[-1].removesuffix(".html"),
            variant_id=None,
            name=title,
            sku_value=product.get("sku"),
            url=product["url"],
            category=None,
            description=description,
            dimensions=extract_dimensions(f"{title} {description}"),
            images=list(dict.fromkeys([product.get("image")] + product.get("imageRefs", []))),
            commercial_variant={"publishedOptions": options},
            product_class=pclass,
            source=[
                {"kind": "publisher_live_catalog_browser", "path": "raw/birchwood-casey/current-products-browser.json", "productId": product["siteProductId"]},
                {"kind": "publisher_branded_catalog_supplement", "path": "raw/birchwood-casey/birchwood-casey-branded-catalog.pdf", "dateCaveat": "circa 2021; not used to override current live identity"},
            ],
            available=None,
            price={"display": product.get("price"), "currency": "USD"},
            authority_gaps=["Live parent product exposes options but no exact option-level SKU in captured public DOM." ] if options and not product.get("sku") else [],
            recognition={
                "titleTokens": re.findall(r"[a-z0-9]+", title.lower()),
                "material": "steel" if re.search(r"steel|ar500", f"{title} {description}", re.I) else "paper_or_tagboard",
                "reactive": bool(re.search(r"dirty bird|shoot-n-c|splatter|reactive|reset|spinner|gong", f"{title} {description}", re.I)),
                "publishedOptionLabels": options,
            },
        ))
    return records


def summarize(records: list[dict]) -> dict:
    products = {(x["publisher"]["id"], x["sourceProductId"]) for x in records}
    target_records = [x for x in records if x["isActualShootableTarget"]]
    target_products = {(x["publisher"]["id"], x["sourceProductId"]) for x in target_records}
    class_counts = Counter(x["productClass"] for x in records)
    candidate_counts = Counter()
    floor_counts = Counter()
    for record in target_records:
        for mapping in record["capabilityMappings"]:
            (floor_counts if mapping["status"] == "supported_floor" else candidate_counts)[mapping["familyId"]] += 1
    exact_skus = [x["sku"] for x in records if x["sku"]]
    richer = [x for x in target_records if len(x["capabilityMappings"]) > 1]
    multi = [x for x in target_records if len(x["capabilityMappings"]) > 2]
    return {
        "commercialProductPages": len(products),
        "commercialOfferingRecords": len(records),
        "recordsWithExactSku": sum(bool(x["sku"]) for x in records),
        "uniqueExactSkus": len(set(exact_skus)),
        "recordsMissingExactSku": sum(not bool(x["sku"]) for x in records),
        "actualShootableTargetProductPages": len(target_products),
        "actualShootableTargetOfferingRecords": len(target_records),
        "nonTargetOrAccessoryOfferingRecords": len(records) - len(target_records),
        "targetRecordsWithSmartEvidenceFloor": len(target_records),
        "targetRecordsWithRicherCapabilityCandidates": len(richer),
        "targetRecordsWithMultipleRicherCapabilityCandidates": len(multi),
        "targetRecordsMissingExactSku": sum(not bool(x["sku"]) for x in target_records),
        "productClassCounts": dict(sorted(class_counts.items())),
        "capabilityFloorCounts": dict(sorted(floor_counts.items())),
        "richerCapabilityCandidateCounts": dict(sorted(candidate_counts.items())),
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    catalogs = {
        "splatterburst": normalize_splatterburst(),
        "highwild": normalize_shopify(
            [RAW / "highwild/products-page-1.json", RAW / "highwild/products-page-2.json"],
            "highwild", "Highwild", "https://www.highwildoutdoors.com", classify_highwild,
        ),
        "birchwood-casey": normalize_birchwood(),
        "ez-aim-allen": normalize_shopify(
            [RAW / "ez-aim-allen/ezaim-products.json"],
            "ez-aim-allen", "EZ Aim / Allen Company", "https://byallen.com", classify_allen,
        ),
        "champion": normalize_shopify(
            [RAW / "champion/champion-products.json"],
            "champion", "Champion Targets / Primos", "https://www.primos.com", classify_champion,
        ),
    }
    for publisher, records in catalogs.items():
        (OUT / f"{publisher}.json").write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n")
    all_records = [record for records in catalogs.values() for record in records]
    (OUT / "all-publishers.json").write_text(json.dumps(all_records, indent=2, ensure_ascii=False) + "\n")
    publisher_summaries = {publisher: summarize(records) for publisher, records in catalogs.items()}
    summary = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "observedAt": OBSERVED_AT,
        "recordSemantics": "One normalized record per captured commercial variant where the publisher source exposes variants; otherwise one per live product page.",
        "authorityBoundary": "Capability candidates are discovery classifications, not execution authority. Only the smart-evidence floor is assigned by default to known shootable publisher targets.",
        "capabilityFamilies": FAMILIES,
        "publishers": publisher_summaries,
        "combined": summarize(all_records),
    }
    summary_bytes = json.dumps(summary, indent=2, ensure_ascii=False) + "\n"
    (OUT / "summary.json").write_text(summary_bytes)
    manifest = []
    for path in sorted(ROOT.rglob("*")):
        if path.is_file() and path.name != "manifest.json":
            payload = path.read_bytes()
            manifest.append({"path": str(path.relative_to(ROOT)), "bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()})
    (ROOT / "manifest.json").write_text(json.dumps({"generatedAt": datetime.now(timezone.utc).isoformat(), "files": manifest}, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
