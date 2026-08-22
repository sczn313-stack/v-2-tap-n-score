#!/usr/bin/env python3
"""Reproduce the Founder-facing 69-offering capability-gap gallery."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
OUT_DIR = Path(__file__).resolve().parent
GUNFUN_SOURCE = ROOT / "docs/authority-evidence/gunfun/episode56/full-catalog-stress-test/FULL_CATALOG_AUTHORITY_AUDIT.json"
BAKER_SOURCES = [Path(f"/tmp/baker_catalog_page{i}.json") for i in range(1, 7)]

FAMILIES = {
    "CF-11": "Governed diagnostic feedback",
    "CF-12": "Qualification/staged-course evaluation",
    "CF-13": "Commanded, cued, randomized, or timed drill orchestration",
    "CF-14": "Decision discrimination and scenario state",
    "CF-15": "Longitudinal progression",
    "CF-16": "Declarative collection/hand/path game state",
}


def clean_markup(value: str) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def baker_eligible(product: dict) -> bool:
    categories = {category["name"] for category in product.get("categories", [])}
    if "Target Variety Packs" in categories or "Get-Ten Packs" in categories:
        return False
    return product.get("sku") not in {"BK-ShootingGuide", "SW-Mug", "SAP1"}


def gunfun_families(record: dict) -> list[str]:
    product = record["product"]
    families = []
    if "diagnostic" in {tag.lower() for tag in product.get("tags", [])}:
        families.append("CF-11")
    if "Qualification" in product.get("categories", []):
        families.append("CF-12")
    if "Command" in product.get("categories", []):
        families.append("CF-13")
    return families


def baker_families(product: dict) -> list[str]:
    name = clean_markup(product.get("name", ""))
    description = clean_markup(product.get("description", ""))
    categories = {category["name"] for category in product.get("categories", [])}
    families = []
    if re.search(r"Shooting Tutor", name, re.I):
        families.append("CF-11")
    if re.search(r"Qualification|Qualifying", name, re.I) or re.search(r"qualification", description, re.I):
        families.append("CF-12")
    if re.search(r"Primary Target|Command Training|Timed Shooting|Timed Target", name, re.I):
        families.append("CF-13")
    if "Decision Targets" in categories or re.search(r"Shoot\s*/\s*Don", description, re.I):
        families.append("CF-14")
    if re.search(r"Bullseye Challenge Target", name, re.I):
        families.append("CF-15")
    if re.search(r"Poker Wheel", name, re.I):
        families.append("CF-16")
    return families


def gap_explanation(primary: str, name: str) -> str:
    if primary == "CF-11":
        return "The shooter uses publisher-labeled diagnostic zones to relate shot placement to feedback; SCZN3 can record the shots but cannot yet issue that governed diagnostic result."
    if primary == "CF-12":
        return "The shooter completes a named qualification or staged course whose strings, timing, scoring, and threshold must be evaluated; SCZN3 cannot yet execute a versioned qualification profile."
    if primary == "CF-13" and re.search(r"Primary|Simon", name, re.I):
        return "The shooter follows and repeats a changing Simon-Says-style cue sequence; SCZN3 cannot yet govern cues, memory state, and response order."
    if primary == "CF-13":
        return "The shooter responds to instructed, randomized, or timed prompts; SCZN3 cannot yet orchestrate and reconcile a governed cue-and-response sequence."
    if primary == "CF-14":
        return "The shooter decides whether the presented member of a publisher-defined Good/Bad pair calls for a shot or no shot; SCZN3 cannot yet govern scenario presentation and response correctness."
    if primary == "CF-15":
        return "The shooter repeats the publisher's accuracy program across sessions and advances through levels; SCZN3 cannot yet maintain governed progression state over preserved SECs."
    return "The shooter's hits form a poker hand whose membership and rank must be evaluated; SCZN3 cannot yet govern collection and hand-combination state."


def md(value: object) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


gunfun = json.loads(GUNFUN_SOURCE.read_text())
baker_products = []
for source in BAKER_SOURCES:
    baker_products.extend(json.loads(source.read_text()))

records = []
for source in gunfun["records"]:
    families = gunfun_families(source)
    if not families:
        continue
    product = source["product"]
    representation = source["publisherRepresentation"]
    primary = families[0]
    records.append({
        "publisher": "GunFun",
        "exactProductName": product["exactPublishedName"],
        "sku": product["sku"],
        "publisherProductLink": product["productUrl"],
        "thumbnailReference": representation.get("publisherUrl"),
        "localThumbnailReference": representation.get("localPath"),
        "primaryMissingFamily": {"id": primary, "name": FAMILIES[primary]},
        "additionalMissingFamilies": [{"id": family, "name": FAMILIES[family]} for family in families[1:]],
        "allMissingFamilyIds": families,
        "plainEnglishGap": gap_explanation(primary, product["exactPublishedName"]),
        "canonicalProductLineage": f"GunFun:{product['sku']}",
        "sourceCatalogId": source["catalogId"],
    })

for source in baker_products:
    if not baker_eligible(source):
        continue
    families = baker_families(source)
    if not families:
        continue
    name = clean_markup(source["name"])
    primary = families[0]
    sku = source["sku"]
    base_sku = re.sub(r"-Bulk$", "", sku)
    image = source.get("images", [{}])[0]
    records.append({
        "publisher": "Baker Targets",
        "exactProductName": name,
        "sku": sku,
        "publisherProductLink": source["permalink"],
        "thumbnailReference": image.get("thumbnail") or image.get("src"),
        "localThumbnailReference": None,
        "primaryMissingFamily": {"id": primary, "name": FAMILIES[primary]},
        "additionalMissingFamilies": [{"id": family, "name": FAMILIES[family]} for family in families[1:]],
        "allMissingFamilyIds": families,
        "plainEnglishGap": gap_explanation(primary, name),
        "canonicalProductLineage": f"Baker:{base_sku}",
        "sourceCatalogId": f"Baker:{source['id']}",
    })

order = {family: index for index, family in enumerate(FAMILIES)}
records.sort(key=lambda record: (order[record["primaryMissingFamily"]["id"]], record["publisher"], record["exactProductName"], record["sku"]))
for index, record in enumerate(records, 1):
    record["analysisId"] = f"EP56-GAP-{index:03d}"

family_summary = []
for family_id, family_name in FAMILIES.items():
    assigned = [record for record in records if family_id in record["allMissingFamilyIds"]]
    primary = [record for record in records if record["primaryMissingFamily"]["id"] == family_id]
    family_summary.append({
        "id": family_id,
        "name": family_name,
        "uniqueOfferingsRequiringFamily": len(assigned),
        "canonicalLineagesRequiringFamily": len({record["canonicalProductLineage"] for record in assigned}),
        "primaryGroupOfferings": len(primary),
    })

overlaps = [record for record in records if record["additionalMissingFamilies"]]
assert len(records) == 69, len(records)
assert sum(len(record["allMissingFamilyIds"]) for record in records) == 72
assert len(overlaps) == 3
assert {record["publisher"] for record in records} == {"GunFun", "Baker Targets"}
assert sum(record["publisher"] == "GunFun" for record in records) == 32
assert sum(record["publisher"] == "Baker Targets" for record in records) == 37
assert [item["uniqueOfferingsRequiringFamily"] for item in family_summary] == [16, 27, 17, 8, 2, 2]
assert [item["primaryGroupOfferings"] for item in family_summary] == [16, 26, 15, 8, 2, 2]

output = {
    "analysisId": "EP56-UNRECOGNIZED-69-V1",
    "status": "founder_review",
    "scope": "catalog capability analysis only",
    "implementationPerformed": False,
    "denominator": {
        "combinedOfferings": 663,
        "recognizedByExistingFamilies": 594,
        "requiringAtLeastOneMissingFamily": 69,
        "requiringAtLeastOneMissingFamilyPercent": 10.41,
        "gunfunOfferings": 32,
        "bakerOfferings": 37,
        "multiLabelFamilyAssignments": 72,
        "overlappingOfferings": 3,
        "canonicalLineages": 55,
    },
    "familySummary": family_summary,
    "overlapReconciliation": [
        {"publisher": record["publisher"], "sku": record["sku"], "families": record["allMissingFamilyIds"]}
        for record in overlaps
    ],
    "unusualThemeFinding": {
        "unusualThemesWithin69": [],
        "conclusion": "No Bigfoot, Sasquatch, zombie, monster, alien, or similar novelty artwork causes a capability gap in the 69.",
        "catalogExamplesOutside69": [
            {"publisher": "Baker Targets", "sku": "GG-Bigfoot", "theme": "Bigfoot"},
            {"publisher": "Baker Targets", "sku": "GG-Bigfoot-Bulk", "theme": "Bigfoot"},
            {"publisher": "GunFun", "sku": "17180", "theme": "Graveyard Zombie"},
            {"publisher": "GunFun", "sku": "27130", "theme": "Zombie Attack"},
            {"publisher": "GunFun", "sku": "21120", "theme": "Evil Clown"},
        ],
    },
    "records": records,
}

(OUT_DIR / "UNRECOGNIZED_69.json").write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n")

by_sku = {(record["publisher"], record["sku"]): record for record in records}
representatives = {
    "CF-11": [("GunFun", "82080"), ("Baker Targets", "ST-STR")],
    "CF-12": [("GunFun", "53510"), ("Baker Targets", "SL-B21E-FLSHERIFF")],
    "CF-13": [("GunFun", "92430"), ("Baker Targets", "GF-Primary")],
    "CF-14": [("Baker Targets", "DS-GoodJeff"), ("Baker Targets", "DS-BadJeff")],
    "CF-15": [("Baker Targets", "BE-Challenge")],
    "CF-16": [("Baker Targets", "GF-PokerWheel")],
}

lines = [
    "# What Lives in the Unrecognized 10%",
    "",
    "**Status:** Founder review; capability analysis only  ",
    "**Population:** 69 of 663 GunFun + Baker target-product offerings (10.41%)  ",
    "**Implementation:** None",
    "",
    "## Founder answer",
    "",
    "> **The unrecognized 10% is not hiding a Bigfoot-shaped architecture problem. It is dominated by conventional training products whose artwork is ordinary but whose required digital behavior is richer: diagnostic feedback, qualifications, commanded drills, shoot/no-shoot decisions, longitudinal progression, and poker-hand state.**",
    "",
    "Bigfoot is real in Baker's catalog—SKUs `GG-Bigfoot` and `GG-Bigfoot-Bulk`—but neither offering is in this 69. Zombies, monsters, aliens, clowns, and similar novelty art also do **not** create any of the six gaps. Their artwork may be unusual; their presently established digital behavior is not.",
    "",
    "## Exact denominator reconciliation",
    "",
    "| Missing family | Unique offerings requiring family | Canonical lineages | Primary-group offerings |",
    "|---|---:|---:|---:|",
]
for summary in family_summary:
    lines.append(f"| {summary['id']} — {summary['name']} | {summary['uniqueOfferingsRequiringFamily']} | {summary['canonicalLineagesRequiringFamily']} | {summary['primaryGroupOfferings']} |")
lines.extend([
    "",
    "The multi-label family columns total **72 assignments**. Deduct the three second-family assignments—GunFun `22460`, Baker `ST-CTQ`, and Baker `ST-CTQ-Bulk`—to obtain **69 unique offerings**. Primary grouping assigns each product once: **16 + 26 + 15 + 8 + 2 + 2 = 69**. The 69 offerings collapse to **55 product lineages** after Baker bulk packaging is paired with its base product.",
    "",
    "## The fun version",
    "",
])

family_plain = {
    "CF-11": "SCZN3 doesn't recognize this yet because recording where shots landed is not the same as issuing the publisher's diagnostic feedback about that pattern.",
    "CF-12": "SCZN3 doesn't recognize this yet because a qualification is a versioned course—stages, distances, strings, timing, scores, thresholds, and official/practice status—not merely a printable target.",
    "CF-13": "SCZN3 doesn't recognize this yet because the computer must conduct the drill: issue or randomize cues, enforce sequence or timing, and reconcile the shooter's response.",
    "CF-14": "SCZN3 doesn't recognize this yet because the session must present a governed scenario identity and evaluate shoot versus no-shoot without inferring threat meaning from the picture.",
    "CF-15": "SCZN3 doesn't recognize this yet because today's result must be evaluated against a governed multi-session progression history, not just preserved as one SEC.",
    "CF-16": "SCZN3 doesn't recognize this yet because individual hits become a collection whose combination and rank—such as a poker hand—must be evaluated as game state.",
}

for family_id, family_name in FAMILIES.items():
    lines.append(f"### {family_id} — {family_name}")
    lines.append("")
    lines.append(f"> **{family_plain[family_id]}**")
    lines.append("")
    lines.append("Representative publisher products:")
    lines.append("")
    for key in representatives[family_id]:
        record = by_sku.get(key)
        if record:
            lines.append(f"- <img src=\"{record['thumbnailReference']}\" alt=\"{md(record['exactProductName'])}\" width=\"88\"> [{md(record['exactProductName'])}]({record['publisherProductLink']}) — `{record['sku']}`")
    lines.append("")

lines.extend([
    "## Complete 69-offering ledger",
    "",
    "Every offering appears exactly once under its primary missing family. `Additional family` preserves the three overlaps.",
    "",
])

for family_id, family_name in FAMILIES.items():
    group = [record for record in records if record["primaryMissingFamily"]["id"] == family_id]
    lines.extend([
        f"### {family_id} — {family_name} ({len(group)} primary-group offerings)",
        "",
        "| Publisher | Target | Exact product | SKU | Additional family | What the shooter does that SCZN3 does not yet know how to do |",
        "|---|---|---|---|---|---|",
    ])
    for record in group:
        image = f"<a href=\"{record['thumbnailReference']}\"><img src=\"{record['thumbnailReference']}\" alt=\"{md(record['exactProductName'])}\" width=\"72\"></a>" if record["thumbnailReference"] else "Not published"
        additional = ", ".join(f"{family['id']} — {family['name']}" for family in record["additionalMissingFamilies"]) or "—"
        lines.append(
            f"| {record['publisher']} | {image} | [{md(record['exactProductName'])}]({record['publisherProductLink']}) | `{md(record['sku'])}` | {md(additional)} | {md(record['plainEnglishGap'])} |"
        )
    lines.append("")

lines.extend([
    "## Novelty-art audit",
    "",
    "**Inside the 69:** no Bigfoot, Sasquatch, zombie, monster, alien, clown, or comparable novelty-art offering. The closest things to comic relief are Poker Wheel and the Simon-Says-style Primary target, but each is present because of real game/orchestration state—not its artwork.",
    "",
    "**Elsewhere in the analyzed catalogs:** the creatures are absolutely real. Representative examples include [Baker Bigfoot `GG-Bigfoot`](https://bakertargets.com/product/bigfoot-target/), [Baker Alien Game `GF-Alien`](https://bakertargets.com/product/alien-game-target/), [Baker Evil Emmy Zombie `Z-EE-Blk`](https://bakertargets.com/product/evil-emmy-zombie-target/), [Baker Frankenstein `GG-Frankenstein`](https://bakertargets.com/product/frankenstein-target/), [GunFun Graveyard Zombie `17180`](https://gunfun.com/shop/graveyard-zombie-17180/), [GunFun Zombie Attack `27130`](https://gunfun.com/shop/zombie-attack-27130/), and [GunFun Evil Clown `21120`](https://gunfun.com/shop/evil-clown-21120/). They map to already recognized evidence/challenge behavior under current publisher authority. Unusual artwork alone is not a capability family.",
    "",
    "## Authority boundary",
    "",
    "This ledger identifies catalog-established behavior that lacks a reusable SCZN3 capability owner. It does not grant execution authority, infer rules, or assert that product-page evidence alone is sufficient to build any family. Qualification, diagnostic, timing, scenario, progression, and game-rule authority must still be packaged and validated before execution.",
    "",
    "No application architecture, implementation, registration, QR asset, catalog state, commit, push, deployment, or production state changed.",
])

(OUT_DIR / "UNRECOGNIZED_69_FOUNDER_GALLERY.md").write_text("\n".join(lines) + "\n")
print(json.dumps({
    "records": len(records),
    "publisherCounts": {publisher: sum(record["publisher"] == publisher for record in records) for publisher in ("GunFun", "Baker Targets")},
    "familySummary": family_summary,
    "overlaps": [(record["publisher"], record["sku"], record["allMissingFamilyIds"]) for record in overlaps],
}, indent=2))
