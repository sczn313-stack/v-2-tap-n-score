#!/usr/bin/env python3
"""Preserve public BigCommerce package-variant responses for Thompson targets."""

from __future__ import annotations

import hashlib
import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PRODUCTS = ROOT / "sources" / "products"
VARIANTS = ROOT / "sources" / "variants"
MANIFEST = ROOT / "sources" / "variant-manifest.json"


def package_options(source: str) -> tuple[str, list[tuple[str, str]]] | None:
    match = re.search(r"Pack Quantity(?: Options)?:", source, re.I)
    if not match:
        return None
    start = source.rfind('<div class="form-field"', 0, match.start())
    end = source.find("</div>", match.end())
    block = source[start:end]
    pairs = re.findall(
        r'name="attribute\[(\d+)\]"\s+value="(\d+)"[\s\S]*?'
        r'<label[^>]*for="attribute_\2"[^>]*>([\s\S]*?)</label>',
        block,
    )
    if not pairs:
        return None
    group_ids = {group for group, _, _ in pairs}
    if len(group_ids) != 1:
        raise ValueError(f"Unexpected package attribute groups: {group_ids}")
    return pairs[0][0], [
        (value, html.unescape(re.sub(r"<[^>]+>", "", label)).strip())
        for _, value, label in pairs
    ]


def main() -> None:
    VARIANTS.mkdir(parents=True, exist_ok=True)
    records = []
    headers = {
        "User-Agent": "SCZN3-POS-Public-Evidence/1.0",
        "X-Requested-With": "XMLHttpRequest",
    }
    for path in sorted(PRODUCTS.glob("*.html")):
        source = path.read_text(errors="ignore")
        product_match = re.search(r'name="product_id" value="(\d+)"', source)
        canonical_match = re.search(r"<link rel='canonical' href='([^']+)'", source)
        options = package_options(source)
        if not product_match or not options:
            continue
        product_id = product_match.group(1)
        group_id, values = options
        for value_id, label in values:
            evidence_path = VARIANTS / f"{product_id}-{group_id}-{value_id}.json"
            query = urllib.parse.urlencode({f"attribute[{group_id}]": value_id})
            url = f"https://www.thompsontarget.com/remote/v1/product-attributes/{product_id}?{query}"
            if not evidence_path.exists():
                request = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(request, timeout=30) as response:
                    evidence_path.write_bytes(response.read())
                time.sleep(0.05)
            content = evidence_path.read_bytes()
            records.append(
                {
                    "productId": int(product_id),
                    "productUrl": canonical_match.group(1) if canonical_match else None,
                    "attributeGroupId": int(group_id),
                    "attributeValueId": int(value_id),
                    "packageLabel": label,
                    "file": str(evidence_path.relative_to(ROOT)),
                    "sha256": hashlib.sha256(content).hexdigest(),
                }
            )
    MANIFEST.write_text(
        json.dumps(
            {
                "observedAt": "2026-08-23",
                "source": "Thompson Target public BigCommerce storefront option endpoint",
                "count": len(records),
                "records": records,
            },
            indent=2,
        )
        + "\n"
    )
    print(f"Preserved {len(records)} package-variant responses.")


if __name__ == "__main__":
    main()
