#!/usr/bin/env python3
"""Fail-closed validation for the five-publisher normalized evidence batch."""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA = ROOT / "normalized" / "all-publishers.json"
EXPECTED_PUBLISHERS = {
    "splatterburst",
    "highwild",
    "birchwood-casey",
    "ez-aim-allen",
    "champion",
}
VALID_CLASSES = {
    "shootable_target",
    "shootable_target_system",
    "target_accessory",
    "maintenance_consumable",
    "non_target_catalog_product",
}
VALID_FAMILIES = {f"CF-{number:02d}" for number in range(1, 17)}
REQUIRED = {
    "recordId", "publisher", "sourceProductId", "productName", "productUrl",
    "publishedDimensions", "imageRefs", "commercialVariant", "productClass",
    "isActualShootableTarget", "behaviorLineageKey", "capabilityMappings",
    "authorityGaps", "recognitionTraits", "sources", "observedAt",
}


def check(name: str, condition: bool, detail: str) -> dict:
    return {"check": name, "status": "PASS" if condition else "FAIL", "detail": detail}


def main() -> None:
    rows = json.loads(DATA.read_text())
    publishers = {row["publisher"]["id"] for row in rows}
    ids = [row["recordId"] for row in rows]
    exact_skus = [(row["publisher"]["id"], row["sku"]) for row in rows if row["sku"]]
    targets = [row for row in rows if row["isActualShootableTarget"]]
    non_targets = [row for row in rows if not row["isActualShootableTarget"]]
    source_paths = [ROOT / source["path"] for row in rows for source in row["sources"] if "path" in source]
    results = [
        check("publisher_set", publishers == EXPECTED_PUBLISHERS, f"observed={sorted(publishers)}"),
        check("record_count", len(rows) == 790, f"observed={len(rows)}"),
        check("required_fields", all(REQUIRED <= set(row) for row in rows), "every record has the common P-OS evidence envelope"),
        check("record_id_uniqueness", len(ids) == len(set(ids)), f"unique={len(set(ids))}/{len(ids)}"),
        check("publisher_sku_uniqueness", len(exact_skus) == len(set(exact_skus)), f"unique={len(set(exact_skus))}/{len(exact_skus)}"),
        check("classification_closed_set", all(row["productClass"] in VALID_CLASSES for row in rows), f"classes={sorted({row['productClass'] for row in rows})}"),
        check("target_boolean_reconciles", all(row["isActualShootableTarget"] == (row["productClass"] in {"shootable_target", "shootable_target_system"}) for row in rows), f"targets={len(targets)}"),
        check("target_evidence_floor", all(any(mapping["familyId"] == "CF-01" and mapping["status"] == "supported_floor" for mapping in row["capabilityMappings"]) for row in targets), f"covered={len(targets)}/{len(targets)}"),
        check("target_image_references", all(row["imageRefs"] for row in targets), f"covered={sum(bool(row['imageRefs']) for row in targets)}/{len(targets)}"),
        check("recognition_trait_envelope", all(row["recognitionTraits"].get("titleTokens") for row in targets), f"covered={sum(bool(row['recognitionTraits'].get('titleTokens')) for row in targets)}/{len(targets)}"),
        check("non_targets_have_no_execution_mapping", all(not row["capabilityMappings"] for row in non_targets), f"non-target/accessory records={len(non_targets)}"),
        check("known_capability_families_only", all(mapping["familyId"] in VALID_FAMILIES for row in rows for mapping in row["capabilityMappings"]), "no new capability family identifiers"),
        check("richer_capabilities_fail_closed", all(mapping["status"] == "candidate_authority_required" for row in rows for mapping in row["capabilityMappings"] if mapping["familyId"] != "CF-01"), "no discovery candidate was admitted as executable authority"),
        check("authority_gap_on_missing_sku", all(any("SKU" in gap for gap in row["authorityGaps"]) for row in rows if not row["sku"]), f"missing SKU records={sum(not bool(row['sku']) for row in rows)}"),
        check("source_files_present", all(path.exists() for path in source_paths), f"referenced paths={len(set(source_paths))}"),
        check("no_unrelated_personal_cookie_headers", not any("set-cookie:" in path.read_text(errors="ignore").lower() for path in ROOT.rglob("*.headers.txt")), "captured response headers were sanitized"),
    ]
    failed = [result for result in results if result["status"] == "FAIL"]
    payload = {
        "validatedAt": datetime.now(timezone.utc).isoformat(),
        "input": str(DATA.relative_to(ROOT)),
        "inputSha256": hashlib.sha256(DATA.read_bytes()).hexdigest(),
        "status": "PASS" if not failed else "FAIL",
        "checks": results,
        "counts": {
            "records": len(rows),
            "targets": len(targets),
            "nonTargetsAccessoriesConsumables": len(non_targets),
            "publishers": len(publishers),
            "exactSkuRecords": len(exact_skus),
            "missingSkuRecords": sum(not bool(row["sku"]) for row in rows),
            "classCounts": dict(sorted(Counter(row["productClass"] for row in rows).items())),
        },
    }
    (ROOT / "validation.json").write_text(json.dumps(payload, indent=2) + "\n")
    manifest = []
    for path in sorted(ROOT.rglob("*")):
        if path.is_file() and path.name != "manifest.json":
            body = path.read_bytes()
            manifest.append({
                "path": str(path.relative_to(ROOT)),
                "bytes": len(body),
                "sha256": hashlib.sha256(body).hexdigest(),
            })
    (ROOT / "manifest.json").write_text(json.dumps({
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "files": manifest,
    }, indent=2) + "\n")
    print(json.dumps(payload, indent=2))
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
