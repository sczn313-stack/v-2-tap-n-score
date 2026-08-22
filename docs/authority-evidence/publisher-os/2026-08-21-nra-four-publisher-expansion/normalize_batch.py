#!/usr/bin/env python3
"""Normalize the 2026-08-21 NRA four-publisher expansion.

Evidence tooling only. This script does not write production registries or grant
execution authority. Richer capability mappings remain authority-gated.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin


ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
OUT = ROOT / "normalized"
OBSERVED_AT = "2026-08-21"

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


def clean(value):
    value = html.unescape(value or "")
    value = re.sub(r"<script\b.*?</script>|<style\b.*?</style>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<br\s*/?>|</p>|</li>|</div>", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"[ \t\r\f\v]+", " ", value)
    value = re.sub(r"\n\s*\n+", "\n", value)
    return value.strip()


def dimensions(value):
    value = value.replace("“", '"').replace("”", '"').replace("″", '"')
    patterns = [
        r"\b\d+(?:\.\d+)?(?:\s+\d+/\d+)?\s*(?:\"|in(?:ch(?:es)?)?)?\s*[xX×]\s*\d+(?:\.\d+)?(?:\s+\d+/\d+)?\s*(?:\"|in(?:ch(?:es)?)?)?",
        r"\b\d+(?:\.\d+)?\s*(?:\"|inch(?:es)?)\s+(?:square|diameter)\b",
    ]
    found = []
    for pattern in patterns:
        found.extend(re.findall(pattern, value, flags=re.I))
    return list(dict.fromkeys(x.strip() for x in found))


def package_quantity(value):
    patterns = [
        r"(?:box|pack|package|case|roll)\s+(?:of\s+)?(\d+)",
        r"(\d+)\s*(?:per\s+(?:box|carton|pack)|targets?\s+per\s+(?:box|pack)|count\b|ct\b)",
    ]
    for pattern in patterns:
        match = re.search(pattern, value, re.I)
        if match:
            return int(match.group(1))
    return None


def family_candidates(name, description, actual):
    if not actual:
        return []
    title = name.lower()
    hay = f"{name} {description}".lower()
    rows = [{
        "familyId": "CF-01", "family": FAMILIES["CF-01"], "status": "supported_floor",
        "basis": "Known publisher target can preserve identity and shooter evidence without inventing richer meaning.",
    }]
    tests = [
        ("CF-04", r"sight[ -]?in|zero(?:ing)?|load development|grid", "Sight-in/zeroing language requires exact geometry and procedure authority."),
        ("CF-02", r"bullseye|rings?|scoring|\bscore\b|points?", "Scoring language requires exact governed region/value authority."),
        ("CF-12", r"qualification|\bqual\b|course of fire|official nra|\bnra\b|idpa|ipsc|uspsa|usa shooting|iale?fi|ibs", "Competition or qualification use requires the governing organization profile, not product identity alone."),
        ("CF-13", r"command|commander|drill|timed|rapid fire", "Cue, sequence, or timing behavior requires a governed Cue/Drill Profile."),
        ("CF-11", r"diagnostic|tutor|trainer|correction chart", "Trainer labeling supports only publisher-label matching after exact region authority is packaged."),
        ("CF-14", r"no[ -]?shoot|threat|hostage|decision|bad guy|friendly", "Scenario artwork or naming cannot establish the expected response."),
        ("CF-16", r"playing cards|poker|hand game", "Collection/hand behavior requires complete publisher rules."),
        ("CF-15", r"progression|level up|multi[- ]session", "Across-session claims require authoritative progression rules and governed subject continuity."),
        ("CF-03", r"dueling|reset(?:ting)?|knockover|spinner|spinning|popper|bottle|balloon", "Entity-completion behavior requires publisher-authorized completion rules."),
        ("CF-08", r"pool|dice|game on|handgun games", "Game artwork does not itself authorize multiplayer or point rules."),
    ]
    for fid, pattern, basis in tests:
        if re.search(pattern, hay if fid in {"CF-04", "CF-02"} else title):
            rows.append({"familyId": fid, "family": FAMILIES[fid], "status": "candidate_authority_required", "basis": basis})
    seen = set()
    return [x for x in rows if not (x["familyId"] in seen or seen.add(x["familyId"]))]


def make_record(*, publisher_id, publisher_name, product_id, name, sku, url, category,
                description, image_refs, price, product_class, source, package=None,
                designation=None, organization_labels=None, availability=None):
    actual = product_class in {"shootable_target", "shootable_target_system"}
    sku = str(sku).strip() if sku not in (None, "") else None
    labels = organization_labels or []
    mappings = family_candidates(name, description, actual)
    gaps = []
    if not sku:
        gaps.append("Exact public publisher SKU is not exposed; preserve publisher product identity and fail closed on SKU-dependent admission.")
    if actual and any(x["status"] == "candidate_authority_required" for x in mappings):
        gaps.append("Richer capability mapping is a discovery candidate only until exact rules/profile/geometry authority is packaged.")
    return {
        "recordId": f"{publisher_id}:{sku or product_id}",
        "publisher": {"id": publisher_id, "name": publisher_name},
        "sourceProductId": str(product_id),
        "productName": name,
        "publisherDesignation": designation,
        "sku": sku,
        "productUrl": url,
        "publisherCategory": category,
        "description": description,
        "publishedDimensions": dimensions(f"{name} {description}"),
        "packageQuantity": package if package is not None else package_quantity(f"{name} {description}"),
        "imageRefs": list(dict.fromkeys(x for x in image_refs if x)),
        "observedPrice": price,
        "availability": availability,
        "productClass": product_class,
        "isActualShootableTarget": actual,
        "organizationLabels": labels,
        "capabilityMappings": mappings,
        "authorityGaps": gaps,
        "recognitionTraits": {
            "titleTokens": re.findall(r"[a-z0-9]+", name.lower()),
            "publishedDimensions": dimensions(f"{name} {description}"),
            "imageCount": len(list(dict.fromkeys(x for x in image_refs if x))),
        },
        "source": source,
        "observedAt": OBSERVED_AT,
    }


def read_woo(directory, publisher_id, publisher_name):
    products = []
    for path in sorted(directory.glob("products-page-*.json")):
        products.extend((x, path) for x in json.loads(path.read_text()))
    rows = []
    for product, path in products:
        name = clean(product.get("name"))
        desc = clean(product.get("description") or product.get("short_description"))
        categories = [clean(x.get("name")) for x in product.get("categories", [])]
        cat_text = " ".join(categories).lower()
        if publisher_id == "national-target":
            accessory_skus = {"BACKER", "CB", "CB-24X24", "3/4PASTER500", "1INCHPASTER", "REDPASTER1"}
            if (product.get("sku") or "") in accessory_skus:
                pclass = "target_accessory"
            else:
                pclass = "shootable_target"
        else:
            pclass = "target_accessory" if name == "Backer" else "shootable_target"
        labels = []
        text = f"{name} {cat_text}".lower()
        for label, pattern in [("NRA", r"\bnra\b"), ("IDPA", r"\bidpa\b"), ("IPSC", r"\bipsc\b"), ("USA Shooting", r"usa shooting"), ("IALEFI", r"ialefi"), ("IBS", r"\bibs\b")]:
            if re.search(pattern, text): labels.append({"organization": label, "status": "publisher_labeled_not_independent_authority"})
        prices = product.get("prices", {})
        rows.append(make_record(
            publisher_id=publisher_id, publisher_name=publisher_name, product_id=product["id"],
            name=name, sku=product.get("sku"), url=product.get("permalink"), category=categories,
            description=desc, image_refs=[x.get("src") for x in product.get("images", [])],
            price={"minorUnits": prices.get("price"), "currency": prices.get("currency_code")},
            product_class=pclass, package=None, organization_labels=labels,
            availability=product.get("is_in_stock"),
            source=[{"kind": "publisher_store_api", "path": str(path.relative_to(ROOT)), "productId": str(product["id"])}],
        ))
    return rows


def american():
    rows = []
    category_files = [x for x in sorted((RAW / "american-target").glob("*.html")) if x.stem not in {"home", "about", "faq"}]
    for path in category_files:
        page = path.read_text(errors="ignore")
        blocks = re.findall(r'<div class="piccaption">(.*?)</div>', page, re.I | re.S)
        for index, block in enumerate(blocks, 1):
            m = re.search(r"<h2[^>]*>(.*?)</h2>", block, re.I | re.S)
            if not m:
                continue
            name = clean(m.group(1))
            desc = clean(block)
            img = re.search(r'<img[^>]+src=["\']([^"\']+)', block, re.I)
            designation = name
            price_tiers = [(int(q), amount) for q, amount in re.findall(r"Per\s+(\d+)\s*:\s*\$([\d.]+)", desc, re.I)]
            if not price_tiers:
                price_tiers = [(None, None)]
            labels = [{"organization": "NRA", "status": "publisher_labeled_and_current_nra_licensee"}] if re.search(r"Official NRA", desc, re.I) else []
            pclass = "target_accessory" if name in {"Target Pasters", "A 17B", "A 23B Short", "A 23B Full", "A 25B Short"} else "shootable_target"
            for tier, amount in price_tiers:
                suffix = f"-Q{tier}" if tier else ""
                rows.append(make_record(
                    publisher_id="american-target", publisher_name="American Target Company",
                    product_id=f"{path.stem}:{index}{suffix}", name=name, sku=None,
                    designation=designation,
                    url=f"https://www.americantargetcompany.com/{path.name}#{re.sub(r'[^A-Za-z0-9]+', '_', name)}",
                    category=path.stem.replace("-", " "), description=desc,
                    image_refs=[urljoin("https://www.americantargetcompany.com", img.group(1))] if img else [],
                    price={"amount": amount, "currency": "USD", "priceBasis": f"per {tier}"} if amount else None,
                    package=tier, product_class=pclass, organization_labels=labels,
                    source=[{"kind": "publisher_static_catalog", "path": str(path.relative_to(ROOT)), "block": index}],
                ))
    return rows


def speedwell_class(name, description, sku):
    non_target = {
        "SP-24", "GSA", "STA-MPS", "SLUGMASTER", "650", "PASTER-FRS-2", "BOBS-MST",
        "BAC36", "BAC45A", "BAC48A", "PASWHS", "PASBLR", "PASBLS", "PASBLUES", "PASBRS",
        "PASGRS", "PASWHR", "STALPA", "STALPS", "ULTRACC", "ULTRALS",
    }
    if sku in non_target:
        return "maintenance_consumable" if sku.startswith("PAS") or sku in {"650", "ULTRACC", "ULTRALS"} else "target_accessory"
    return "shootable_target_system" if re.search(r"with stand|dueling tree|popper", name, re.I) else "shootable_target"


def speedwell():
    rows = []
    for index, path in enumerate(sorted((RAW / "speedwell" / "product-pages").glob("*.html")), 1):
        page = path.read_text(errors="ignore")
        def grab(pattern):
            m = re.search(pattern, page, re.I | re.S)
            return clean(m.group(1)) if m else None
        name = grab(r'<h1[^>]*class=["\'][^"\']*vp-product-title[^"\']*["\'][^>]*>.*?<span[^>]*itemprop=["\']name["\'][^>]*>(.*?)</span>')
        if not name:
            continue
        sku = grab(r'<span[^>]*class=["\']product_code["\'][^>]*>(.*?)</span>')
        desc = grab(r'<span[^>]*id=["\']product_description["\'][^>]*>(.*?)</span>') or ""
        price = grab(r'<span[^>]*itemprop=["\']price["\'][^>]*content=["\']([^"\']+)')
        image = grab(r'<img[^>]*itemprop=["\']image["\'][^>]*src=["\']([^"\']+)')
        action = re.search(r'<form[^>]*action=["\']([^"\']+)', page, re.I)
        category = [clean(x) for x in re.findall(r'<a[^>]+href=["\'][^"\']*category-s/[^"\']+["\'][^>]*>(.*?)</a>', page, re.I | re.S)]
        text = f"{name} {desc}".lower()
        labels = []
        for label, pattern in [("NRA", r"\bnra\b"), ("IDPA", r"\bidpa\b"), ("IPSC", r"\bipsc\b"), ("IBS", r"\bibs\b")]:
            if re.search(pattern, text): labels.append({"organization": label, "status": "publisher_labeled_not_independent_authority"})
        rows.append(make_record(
            publisher_id="speedwell", publisher_name="Speedwell Targets", product_id=index,
            name=name, sku=sku, designation=None,
            url=urljoin("https://www.speedwelltargets.com", action.group(1)) if action else None,
            category=category, description=desc,
            image_refs=[("https:" + image if image and image.startswith("//") else image)],
            price={"amount": price, "currency": "USD"} if price else None,
            product_class=speedwell_class(name, desc, sku), organization_labels=labels,
            source=[{"kind": "publisher_product_page", "path": str(path.relative_to(ROOT)), "sitemapIndex": index}],
        ))
    return rows


def summarize(records):
    targets = [x for x in records if x["isActualShootableTarget"]]
    identities = {(x["publisher"]["id"], x["sourceProductId"].split("-Q")[0]) for x in records}
    target_identities = {(x["publisher"]["id"], x["sourceProductId"].split("-Q")[0]) for x in targets}
    richer = [x for x in targets if len(x["capabilityMappings"]) > 1]
    cands = Counter(m["familyId"] for x in targets for m in x["capabilityMappings"] if m["status"] != "supported_floor")
    return {
        "commercialProductPagesOrIdentities": len(identities),
        "commercialOfferingRecords": len(records),
        "actualShootableTargetProductPagesOrIdentities": len(target_identities),
        "actualShootableTargetOfferingRecords": len(targets),
        "nonTargetOrAccessoryOfferingRecords": len(records) - len(targets),
        "recordsWithExactSku": sum(bool(x["sku"]) for x in records),
        "targetRecordsMissingExactSku": sum(not x["sku"] for x in targets),
        "targetRecordsWithSmartEvidenceFloor": len(targets),
        "targetRecordsWithRicherCapabilityCandidates": len(richer),
        "productClassCounts": dict(sorted(Counter(x["productClass"] for x in records).items())),
        "richerCapabilityCandidateCounts": dict(sorted(cands.items())),
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    catalogs = {
        "american-target": american(),
        "national-target": read_woo(RAW / "national-target", "national-target", "The National Target Company"),
        "speedwell": speedwell(),
        "us-target": read_woo(RAW / "us-target", "us-target", "U.S. Target Inc."),
    }
    for publisher, records in catalogs.items():
        (OUT / f"{publisher}.json").write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n")
    all_records = [x for records in catalogs.values() for x in records]
    (OUT / "all-publishers.json").write_text(json.dumps(all_records, indent=2, ensure_ascii=False) + "\n")
    summary = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "observedAt": OBSERVED_AT,
        "recordSemantics": "One record per exposed catalog product, except American Target quantity/price tiers are separate commercial offerings sharing one product identity.",
        "authorityBoundary": "Organization labels are evidence links, not automatic endorsement or executable authority. Richer capability candidates remain authority-gated.",
        "capabilityFamilies": FAMILIES,
        "publishers": {key: summarize(value) for key, value in catalogs.items()},
        "combined": summarize(all_records),
    }
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n")
    manifest = []
    for path in sorted(ROOT.rglob("*")):
        if path.is_file() and path.name != "manifest.json":
            payload = path.read_bytes()
            manifest.append({"path": str(path.relative_to(ROOT)), "bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()})
    (ROOT / "manifest.json").write_text(json.dumps({"generatedAt": datetime.now(timezone.utc).isoformat(), "files": manifest}, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
