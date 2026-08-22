#!/usr/bin/env python3
"""Build the organization-specification-publisher-SKU evidence map."""

from __future__ import annotations

import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
NORM = ROOT / "normalized"


def specs(value):
    return value.split()


LICENSED = {
    "american-target": specs("""
        C-2 C-3 B-40/1 B-40/4 AR-4/5 AR-5/1 AR-5/5 AR-5/10 B-18 B-18C B-24 D-1 D-1C D-1(CB) D-2
        MR-31 MR-31C MR-52 MR-52C MR-63 MR-63C MR-65 MR-65C SR SR-C SR-1 SR-1C SR-3C SR-21 SR-21C SR-42 SR-42C MR MR-1C
        B-27 B-27C B-29 B-34 TQ-14 TQ-15 TQ-16 TQ-19 TQ-20 TQ-21 TQ-22 B-19 B-19C B-33 B-35 B-37 B-37C B-38 B-38C B-39
        TQ-1/1 TQ-1/5 TQ-3/1 TQ-3/2 TQ-4 TQ-5/5 TQ-6 TQ-7 TQ-12 TQ-13 A-17 A-23/3 A-23/5 A-25 A-26 A-27 A-32 A-33 A-36 A-50 A-50/1 A-51
        B-2 B-3 B-4 B-5 B-6 B-6C B-8 B-8C B-11 B-16 B-17 B-17C MR-63FC MR-65FC MR-1FC LR-FC
    """),
    "national-target": specs("""
        C-1 C-1C C-2 C-3 B-18 B-18C B-24 D-1 D-1C D-1(CB) D-2 B-40 B-40/4 AR-4/1 AR-4/5 AR-4/10 AR-5/1 AR-5/5 AR-5/10 A-44/1 A-44/5
        MR-1C MR-31 MR-31C MR-52 MR-52C MR-63 MR-63C MR-65 MR-65C LR-C SR SR-C SR-1 SR-1C SR-5 SR-21 SR-21C SR-3C SR-42 SR-42C
        RB-50LH RB-50LC RB-50RH RB-50RC AR-6 A-27 A-31 A-32 A-33 A-36 A-50 A-50/1 A-51 A-7/5 A-7/10 A-17 A-21 A-21C A-23/3 A-23/5 A-25 A-26
        B-19 B-19C B-33 B-35 B-37 B-37C B-38 B-38C B-39 B-27 B-27C B-27(24)(CB) B-27(24) B-27A B-27E B-29 B-34
        B-2 B-3 B-4 B-5 B-6 B-6C B-8 B-8C B-11 B-16 B-17 B-17C TQ-13 TQ-14 TQ-15 TQ-16 TQ-17 TQ-18 TQ-19 TQ-20 TQ-21 TQ-22 TQ-36 TQ-39 TQ-40
        TQ-1/1 TQ-1/5 TQ-2 TQ-3/1 TQ-3/2 TQ-3/5 TQ-4 TQ-5/1 TQ-5/5 TQ-6 TQ-7 TQ-8 TQ-9 TQ-12 ST-2 LR-FC MR-1FC MR-63FC MR-65FC
    """),
    "speedwell": specs("""
        D-1C D-1(CB) D-2 B-40 B-40/4 AR-4/1 AR-4/5 AR-4/10 AR-5/1 AR-5/5 AR-5/10 B-18 B-18C B-24 D-1
        SR-31C SR-42 SR-42C MR-1C MR-52 MR-52C MR-63 MR-63C SR-C SR-1 SR-1C SR-3C SR-5 SR-21 SR-21C SR-31
        B-27(24) B-29 B-32 B-34 B-27 B-27C B-27(CB) B-27E A-27 A-32 A-33 A-36 A-50 A-50/1 A-51 AR-6 A-7/5 A-7/10 A-17 A-21 A-23/3 A-23/5 A-25 A-26
        TQ-7 TQ-8 TQ-9 TQ-10 TQ-11 TQ-12 TQ-13 TQ-14 TQ-15 TQ-1/1 TQ-1/5 TQ-2 TQ-3/1 TQ-3/5 TQ-4 TQ-5/1 TQ-5/5 TQ-6
        B-17 B-17C B-19 B-19C B-33 B-35 B-37 B-37C B-38 B-39 B-2 B-3 B-4 B-5 B-6 B-6C B-8 B-8C B-11 B-16
    """),
    "us-target": specs("""
        B-18 B-18C B-24 D-1 D-2 AP-1 AP-1C AP-2 B-40 B-40/4 AR-5/1 AR-5/5 AR-5/10 SR-C SR-1 SR-1C SR-3C SR-21 SR-21C MR-31 MR-52
        B-2 B-3 B-4 B-5 B-6 B-6C B-8 B-8C B-11 B-16 B-17 B-17C B-19 B-19C B-35 B-37 B-37C B-39 B-27 B-27C B-27E B-29 B-34
        A-7/5 A-17 A-21 A-23/3 A-23/5 A-26 A-27 A-32 A-36 A-50 A-51 NRA/USA-50
        TQ-1/1 TQ-1/5 TQ-3/1 TQ-3/2 TQ-4 TQ-6 TQ-7 TQ-15 TQ-16 TQ-19 TQ-22 TQ-21
    """),
}


def spec_pattern(spec):
    # Exact designation matching with punctuation-flexible separators. Avoid B-2 -> B-21.
    chars = []
    for ch in spec.upper():
        chars.append(re.escape(ch) if ch.isalnum() else r"[\s\-_/()]*")
    return re.compile(r"(?<![A-Z0-9])" + "".join(chars) + r"(?![A-Z0-9])", re.I)


def catalog_matches(publisher, spec):
    records = json.loads((NORM / f"{publisher}.json").read_text())
    pattern = spec_pattern(spec)
    found = []
    seen = set()
    for row in records:
        text = f"{row['publisherDesignation'] or ''} {row['productName']} {row['description']}"
        if not pattern.search(text):
            continue
        key = (row["productName"], row["sku"], row["productUrl"])
        if key in seen:
            continue
        seen.add(key)
        found.append({
            "productName": row["productName"], "sku": row["sku"], "publisherDesignation": row["publisherDesignation"],
            "packageQuantity": row["packageQuantity"], "dimensions": row["publishedDimensions"], "productUrl": row["productUrl"],
        })
    return found


def main():
    union = sorted(set().union(*[set(x) for x in LICENSED.values()]))
    rows = []
    for spec in union:
        implementations = {}
        for publisher in LICENSED:
            listed = spec in LICENSED[publisher]
            matches = catalog_matches(publisher, spec) if listed else []
            implementations[publisher] = {
                "currentNraManufacturerSheetListsSpecification": listed,
                "catalogMatches": matches,
                "evidenceStatus": "organization_sheet_plus_publisher_catalog" if matches else "organization_sheet_only" if listed else "not_listed",
            }
        champion = []
        if spec == "B-16":
            champion = [{"productName": "GB-16", "sku": "40749", "status": "historical_catalog"}, {"productName": "B-16", "sku": "40722", "status": "current_catalog"}]
        elif spec == "B-2":
            champion = [{"productName": "GB-2", "sku": "40750", "status": "historical_catalog_grade_b_face_mapping"}]
        elif spec == "B-3":
            champion = [{"productName": "GB-3", "sku": "40751", "status": "current_catalog"}]
        rows.append({
            "nraSpecification": spec,
            "governingAuthority": "National Rifle Association Competition Programs",
            "currentLicensedManufacturerCount": sum(spec in x for x in LICENSED.values()),
            "implementations": {"champion": {"currentNraLicensedStatus": "not_established", "products": champion}, **implementations},
        })
    output = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "authorityModel": "Organization Authority -> Governed Target Specification -> Publisher Implementation -> Commercial SKU/package",
        "boundary": "The manufacturer sheet establishes licensed specification availability; it does not by itself establish every live SKU, package, price, course, or official qualification claim.",
        "currentNraDirectory": {
            "observedAt": "2026-08-21",
            "url": "https://competitions.nra.org/competition-resources/nra-licensed-target-manufacturers/",
            "listed": ["American Target Company", "The National Target Company", "Speedwell Targets", "U.S. Target Inc."],
            "champion": "not_listed_current_status_unresolved",
        },
        "manufacturerSheets": {
            "american-target": "sources/nra/tgt-american.pdf",
            "national-target": "sources/nra/tgt-national.pdf",
            "speedwell": "sources/nra/tgt-speedwell.pdf",
            "us-target": "sources/nra/tgt-ustarget.pdf",
        },
        "counts": {
            "uniqueNraSpecificationsReliablyEstablishedBySheets": len(union),
            "specificationsListedByMultipleCurrentManufacturers": sum(sum(s in x for x in LICENSED.values()) > 1 for s in union),
            "specificationsListedByAllFourCurrentManufacturers": sum(all(s in x for x in LICENSED.values()) for s in union),
            "sheetSpecificationCounts": {k: len(set(v)) for k, v in LICENSED.items()},
        },
        "rows": rows,
    }
    (ROOT / "NRA_CROSS_PUBLISHER_MATRIX.json").write_text(json.dumps(output, indent=2) + "\n")
    print(json.dumps(output["counts"], indent=2))


if __name__ == "__main__":
    main()
