#!/usr/bin/env python3
"""Audit Batch #8-#11 denominators into four explicitly separate layers.

The identity key is conservative: an organization specification collapses
publisher material/color/package variants only when the catalog name connects
them to that exact specification. Publisher-only lineages collapse only explicit
commercial variants; ambiguity remains separate instead of being guessed away.
"""

from __future__ import annotations

import html
import importlib.util
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parent
NORM = ROOT / "normalized"

module_spec = importlib.util.spec_from_file_location("authority_map", ROOT / "build_authority_map.py")
authority_map = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(authority_map)
NRA_SPECS = authority_map.LICENSED


AMERICAN_NON_TARGET = {
    "Target Pasters", "A 17B", "A 23B Short", "A 23B Full", "A 25B Short",
}
NATIONAL_ACCESSORY_SKUS = {"BACKER", "CB", "CB-24X24", "3/4PASTER500", "1INCHPASTER", "REDPASTER1"}
SPEEDWELL_NON_TARGET_SKUS = {
    "SP-24", "GSA", "STA-MPS", "SLUGMASTER", "650", "PASTER-FRS-2", "BOBS-MST",
    "BAC36", "BAC45A", "BAC48A", "PASWHS", "PASBLR", "PASBLS", "PASBLUES", "PASBRS",
    "PASGRS", "PASWHR", "STALPA", "STALPS", "ULTRACC", "ULTRALS",
}


EXPLICIT_LINEAGES = {
    "american-target": {
        "RB 50-6-8P": "RB-50-6-8", "RB 50-6-8": "RB-50-6-8",
        "S-2 - tag/orange": "S-2", "S-2 - paper/orange": "S-2",
        "AMTR-1BU": "AMTR-1", "AMTR-1GR": "AMTR-1",
        "AMTR-IIBU": "AMTR-II", "AMTR-IIGR": "AMTR-II",
        "Squirrel": "SQUIRREL",
    },
    "national-target": {
        "B-21E FL R": "B-21E-FL", "B-21E FL": "B-21E-FL",
        "D-1(P)": "D-1", "D-1(T)(50)": "D-1",
        "AP-1(T)(50)": "AP-1", "AP-1(P)": "AP-1",
    },
    "speedwell": {
        "DEADOTCB": "DEA-DOT", "DEADOTP": "DEA-DOT",
        "FBICIRCB": "FBI-5-BULL", "FBICIRP": "FBI-5-BULL",
        "FBIIPCB": "FBI-SINGLE-BULL", "FBIIP1": "FBI-SINGLE-BULL",
        "FBIQIT03CB": "FBI-QIT-03", "FBI-QIT 03": "FBI-QIT-03",
        "FBIQITCB": "FBI-QIT-2-BULL", "FBIQIT": "FBI-QIT-2-BULL",
        "TQ19CB": "TQ-19", "TQ19": "TQ-19",
        "TQ15CB": "TQ-15", "TQ15": "TQ-15",
        "SI-1-CB": "SI-1", "SI-1-P": "SI-1",
        "TSRIIBLCB": "TSR-II-BLUE", "TSRIIBLP": "TSR-II-BLUE",
        "B21FS": "B21FS", "B21FSBL": "B21FS", "B21FSR": "B21FS",
        "B21XFS": "B21XFS", "B21XFSBL": "B21XFS",
        "B21EBL": "B21E", "B21EOR": "B21E",
        "B21XR": "B21XR", "B21XRBL": "B21XR",
        "B27E-HV": "B-27E", "B 27 E PINK": "B-27E", "B27E": "B-27E",
        "B27EBL": "B-27E", "B27E GREEN": "B-27E", "B27EGY": "B-27E", "B27EOR": "B-27E",
        "B27FS": "B27FS", "B27FSBL": "B27FS", "B27FSGR": "B27FS", "B27FSGY": "B27FS",
        "B27FSA": "B27FSA", "B27FSABL": "B27FSA", "B27FSAGR": "B27FSA",
        "TSRIBLUE": "TSR-I", "TSRIGREEN": "TSR-I",
        "TSRIIGREEN": "TSR-II-GREEN",
        "STA-IPSC": "IPSC-PLATE-FULL", "STA-IPSC-2": "IPSC-PLATE-HALF",
        "SP-Q": "FBI-Q-STEEL", "STA-Q": "FBI-Q-STEEL",
    },
    "us-target": {},
}


def source_key(row):
    return row["sourceProductId"].split("-Q")[0]


def corrected_class(publisher, row):
    name, sku = row["productName"], row["sku"] or ""
    if publisher == "american-target":
        return "target_accessory" if name in AMERICAN_NON_TARGET else "shootable_target"
    if publisher == "national-target":
        return "target_accessory" if sku in NATIONAL_ACCESSORY_SKUS else "shootable_target"
    if publisher == "speedwell":
        if sku in SPEEDWELL_NON_TARGET_SKUS:
            if sku.startswith("PAS") or sku in {"650", "ULTRACC", "ULTRALS"}:
                return "consumable"
            return "target_accessory"
        return "shootable_target_system" if re.search(r"with stand|dueling tree|popper", name, re.I) else "shootable_target"
    if publisher == "us-target":
        return "target_accessory" if name == "Backer" else "shootable_target"
    raise KeyError(publisher)


def canonical_code(value):
    value = html.unescape(value.upper())
    value = re.sub(r"^(?:NRA\s+)?(?:OFFICIAL\s+)?", "", value)
    value = value.replace("&AMP;", "")
    value = re.sub(r"\((?:P|T)\)", "", value)
    value = re.sub(r"\((?:CP|CT)\)", "C", value)
    value = re.sub(r"[^A-Z0-9/]+", "", value)
    return value


def catalog_code(publisher, row):
    name, sku = row["productName"], row["sku"] or ""
    if publisher == "american-target":
        raw = name
    elif publisher in {"national-target", "speedwell"} and sku:
        raw = sku
    else:
        # U.S. Target has no public SKU; its target designation leads the title.
        match = re.match(r"^([A-Z0-9]+(?:[-/][A-Z0-9]+)*(?:\([A-Z]+\))?)", name.upper())
        raw = match.group(1) if match else name
    code = canonical_code(raw)
    # Explicit material/color commercial suffixes do not create a new face.
    for suffix in ("ORANGE", "GREEN", "PINK", "BLACK", "WHITE", "BLUE", "GREY", "GRAY", "RED", "REVRC", "REV", "HV", "WHT", "OC", "GS"):
        if code.endswith(suffix) and len(code) > len(suffix) + 1:
            code = code[:-len(suffix)]
            break
    # Publisher abbreviations established by the product names/descriptions.
    explicit = {
        "american-target": {"B27PR": "B27", "B27BL": "B27", "B27GR": "B27", "B27CR": "B27", "B34P": "B34", "B34T": "B34", "TQ1/1T": "TQ1/1", "TQ1/5T": "TQ1/5", "TQ3/2T": "TQ3/2", "TQ4T": "TQ4"},
        "national-target": {"D1P": "D1", "D1T": "D1", "AP1P": "AP1", "AP1T": "AP1"},
        "speedwell": {
            "AR410": "AR4/10", "AR510": "AR5/10", "AR51": "AR5/1", "AR55": "AR5/5",
            "TQ55": "TQ5/5", "TQ35": "TQ3/5", "TQ4P": "TQ4",
            "B6P": "B6", "B6T": "B6", "B6CP": "B6C", "B6CT": "B6C",
            "B8P": "B8", "B8T": "B8", "B8CP": "B8C", "B8CT": "B8C",
            "D1NRA": "D1", "TQ19CB": "TQ19", "TQ15CB": "TQ15",
            "B27EBL": "B27E", "B27EGY": "B27E", "B27EOR": "B27E", "B29BL": "B29",
        },
        "us-target": {"TQ4T": "TQ4", "TQ4P": "TQ4", "TQ3/2T": "TQ3/2", "TQ3/2P": "TQ3/2", "TQ1/5T": "TQ1/5", "TQ1/5P": "TQ1/5", "B8T": "B8", "B8P": "B8", "B6T": "B6", "B6P": "B6"},
    }
    return explicit[publisher].get(code, code)


def matched_nra_spec(publisher, row):
    code = catalog_code(publisher, row)
    canonical_specs = defaultdict(list)
    for spec in NRA_SPECS[publisher]:
        canonical_specs[canonical_code(spec)].append(spec)
    if code not in canonical_specs:
        return None
    selected = sorted(canonical_specs[code], key=len, reverse=True)[0]
    # A repair/center commercial product must not collapse into a full-face spec
    # unless the selected NRA designation itself is the center specification.
    value = row["productName"].upper()
    has_repair = bool(re.search(r"\b(?:RC|REPAIR CENTER|CENTER)\b|REVRC", value))
    selected_is_center = selected.endswith("C") or "(C" in selected
    if has_repair and not selected_is_center:
        return None
    if re.search(r"\bF[- ]?CLASS\b|\bREDUCED\b", value) and not re.search(r"(?:FC|F-CLASS)$", selected):
        return None
    return selected


def generic_lineage(name):
    value = html.unescape(name.upper())
    value = re.sub(r"^(?:SALE\s*\||NEW\s*-|OFFICIAL\s+|NRA\s+OFFICIAL\s+)+", "", value)
    value = re.sub(r"\b(?:BOX(?:ED)?|BUNDLE|PACK|QUANTITY|ROLL)\s+(?:OF\s+)?\d+\b.*$", "", value)
    value = re.sub(r"\bAS LOW AS\s*\$?[\d.]+.*$", "", value)
    value = re.sub(r"\([^)]*\d+(?:\.\d+)?\s*[X×]\s*\d+[^)]*\)", "", value)
    value = re.sub(r"\((?:P|T|CB)\)", "", value)
    value = re.sub(r"\b(?:PAPER|TAGBOARD|TAG|CARDBOARD)\b", "", value)
    value = re.sub(r"\b(?:BLACK|BLUE|GREEN|ORANGE|PINK|RED|WHITE|GRAY|GREY|BUFF|HIGH VISIBILITY|HI VIS)\b", "", value)
    value = re.sub(r"\b(?:NRA|OFFICIAL|TARGET|TARGETS)\b", "", value)
    value = re.sub(r"[^A-Z0-9]+", "-", value).strip("-")
    return value


def implementation_key(publisher, row):
    name, sku = row["productName"], row["sku"] or ""
    nra = matched_nra_spec(publisher, row)
    if nra:
        return f"{publisher}:NRA:{nra}", f"NRA:{nra}", "exact_catalog_designation_to_current_nra_sheet"
    explicit = EXPLICIT_LINEAGES[publisher]
    if sku in explicit:
        return f"{publisher}:PUB:{explicit[sku]}", None, "explicit_publisher_variant_lineage"
    if name in explicit:
        return f"{publisher}:PUB:{explicit[name]}", None, "explicit_publisher_variant_lineage"
    return f"{publisher}:PUB:{generic_lineage(name)}", None, "conservative_publisher_face_lineage"


def material(row):
    text = f"{row['productName']} {row['description']}".lower()
    if "cardboard" in text or re.search(r"\bcb\b", text): return "cardboard"
    if "tag board" in text or "tagboard" in text or re.search(r"\btype:\s*tag\b", text): return "tagboard"
    if "steel" in text or "ar500" in text: return "steel"
    if "paper" in text: return "paper"
    return "unspecified"


def color(row):
    text = f"{row['productName']} {row['description']}".lower()
    colors = [x for x in ("black", "blue", "green", "orange", "pink", "red", "white", "gray", "grey", "buff") if re.search(rf"\b{x}\b", text)]
    return "+".join(colors) if colors else "standard_or_unspecified"


def audit():
    audit_rows = []
    for publisher in NRA_SPECS:
        records = json.loads((NORM / f"{publisher}.json").read_text())
        product_rows = {}
        source_offerings = defaultdict(list)
        for row in records:
            source_offerings[source_key(row)].append(row)
            product_rows.setdefault(source_key(row), row)
        for product_id, row in product_rows.items():
            pclass = corrected_class(publisher, row)
            is_target = pclass in {"shootable_target", "shootable_target_system"}
            ikey = governed = reason = None
            if is_target:
                ikey, governed, reason = implementation_key(publisher, row)
            offerings = []
            for offering in source_offerings[product_id]:
                offerings.append({
                    "sourceRecordId": offering["recordId"],
                    "packageQuantity": offering["packageQuantity"],
                    "material": material(offering),
                    "color": color(offering),
                    "dimensions": offering["publishedDimensions"],
                    "price": offering["observedPrice"],
                })
            audit_rows.append({
                "publisher": publisher,
                "sourceProductId": product_id,
                "productName": row["productName"],
                "sku": row["sku"],
                "correctedClass": pclass,
                "governedTargetSpecification": governed,
                "publisherImplementationKey": ikey,
                "identityReason": reason,
                "commercialOfferings": offerings,
                "productUrl": row["productUrl"],
            })
    return audit_rows


def unique_offerings(rows):
    keys = set()
    duplicate_evidence = []
    for row in rows:
        if not row["publisherImplementationKey"]:
            continue
        for offering in row["commercialOfferings"]:
            # Price tiers are commercial quantity offerings. Duplicate category
            # pages with the same implementation/configuration/price collapse.
            commercial_variant = re.sub(r"[^A-Z0-9]+", "", row["productName"].upper())
            key = (
                row["publisher"], commercial_variant, offering["packageQuantity"], offering["material"],
                tuple(offering["dimensions"]),
            )
            if key in keys:
                duplicate_evidence.append({"product": row["productName"], "sourceRecordId": offering["sourceRecordId"], "duplicateOfferingKey": list(key)})
            keys.add(key)
    return len(keys), duplicate_evidence


def main():
    rows = audit()
    summaries = {}
    for publisher in NRA_SPECS:
        selected = [x for x in rows if x["publisher"] == publisher]
        targets = [x for x in selected if x["publisherImplementationKey"]]
        offering_count, duplicates = unique_offerings(targets)
        identities = {x["publisherImplementationKey"] for x in targets}
        governed = {x["governedTargetSpecification"] for x in targets if x["governedTargetSpecification"]}
        summaries[publisher] = {
            "catalogProductRecords": len(selected),
            "governedNraSpecificationsWithCatalogImplementations": len(governed),
            "publisherTargetImplementationIdentities": len(identities),
            "commercialTargetOfferings": offering_count,
            "nonTargetAccessoryConsumableRecords": len(selected) - len(targets),
            "classCounts": dict(sorted(Counter(x["correctedClass"] for x in selected).items())),
            "duplicateCatalogEvidenceOfferingsRemoved": len(duplicates),
        }
    total_offerings = 0
    total_identities = 0
    for publisher in NRA_SPECS:
        total_offerings += summaries[publisher]["commercialTargetOfferings"]
        total_identities += summaries[publisher]["publisherTargetImplementationIdentities"]
    governed_relationships = {
        (x["publisher"], x["governedTargetSpecification"])
        for x in rows if x["governedTargetSpecification"]
    }
    mapped_governed_specs = {x[1] for x in governed_relationships}
    target_catalog_offering_rows = sum(
        len(x["commercialOfferings"]) for x in rows if x["publisherImplementationKey"]
    )
    non_target_offering_rows = sum(
        len(x["commercialOfferings"]) for x in rows if not x["publisherImplementationKey"]
    )
    payload = {
        "schemaVersion": "1.0.0",
        "denominators": {
            "governedTargetSpecification": "Organization-owned target meaning; one specification may have many publisher implementations.",
            "publisherTargetImplementationIdentity": "One publisher's implementation of one target face/design lineage; color, paper/tag/cardboard, package, and quantity variants do not create another identity unless geometry/artwork meaning materially changes.",
            "commercialSkuPackageOffering": "A separately sold SKU/page/package/material/color/quantity configuration; duplicate category evidence does not create another offering.",
            "nonTargetAccessoryConsumable": "Commercial catalog record that is not itself the shootable target or target system.",
        },
        "policy": "Conservative fail-closed grouping: exact organization designations and explicit publisher variants collapse; ambiguous face relationships remain separate.",
        "publishers": summaries,
        "combined": {
            "publisherTargetImplementationIdentities": total_identities,
            "commercialTargetOfferings": total_offerings,
            "nonTargetAccessoryConsumableRecords": sum(x["nonTargetAccessoryConsumableRecords"] for x in summaries.values()),
            "nonTargetAccessoryConsumableOfferingRows": non_target_offering_rows,
            "targetCatalogOfferingRowsBeforeDuplicateEvidenceRemoval": target_catalog_offering_rows,
            "uniqueNraSpecificationsInManufacturerSheetUniverse": 136,
            "nraManufacturerSheetPublisherSpecificationRelationships": sum(len(set(x)) for x in NRA_SPECS.values()),
            "uniqueNraSpecificationsWithExactLiveCatalogMapping": len(mapped_governed_specs),
            "exactLivePublisherNraSpecificationImplementations": len(governed_relationships),
            "publisherDefinedOrNotYetGovernedImplementationIdentities": total_identities - len(governed_relationships),
        },
        "correctedCumulative": {
            "acceptedPriorSevenPublisherTargetIdentityBaseline": 907,
            "acceptedPriorSevenPublisherTargetOfferingBaseline": 1168,
            "publishers": 11,
            "publisherTargetImplementationIdentities": 907 + total_identities,
            "commercialTargetOfferings": 1168 + total_offerings,
            "caveat": "The prior seven-publisher baseline was not re-audited in this assignment; this cumulative result adds the audited Batch #8-#11 denominator to that accepted baseline.",
        },
        "records": rows,
    }
    (ROOT / "DENOMINATOR_AUDIT.json").write_text(json.dumps(payload, indent=2) + "\n")
    summary_path = NORM / "summary.json"
    normalized_summary = json.loads(summary_path.read_text())
    normalized_summary["denominatorWarning"] = "Catalog product pages/records are not publisher target implementation identities. Use auditedDenominators for identity and offering claims."
    normalized_summary["auditedDenominators"] = payload["combined"]
    normalized_summary["correctedCumulative"] = payload["correctedCumulative"]
    summary_path.write_text(json.dumps(normalized_summary, indent=2) + "\n")
    print(json.dumps({"publishers": summaries, "combined": payload["combined"]}, indent=2))


if __name__ == "__main__":
    main()
