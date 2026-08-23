#!/usr/bin/env python3
"""Preserve the public Thompson Target product pages listed in its sitemap."""

from __future__ import annotations

import hashlib
import json
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parent
SITEMAP = ROOT / "sources" / "product-sitemap.xml"
PRODUCTS = ROOT / "sources" / "products"
MANIFEST = ROOT / "sources" / "download-manifest.json"


def urls() -> list[str]:
    root = ElementTree.parse(SITEMAP).getroot()
    return [node.text for node in root.iter() if node.tag.endswith("loc") and node.text]


def main() -> None:
    PRODUCTS.mkdir(parents=True, exist_ok=True)
    records = []
    request_headers = {"User-Agent": "SCZN3-POS-Public-Evidence/1.0"}
    for index, url in enumerate(urls(), start=1):
        slug = urlparse(url).path.strip("/").split("/")[-1]
        path = PRODUCTS / f"{slug}.html"
        if not path.exists():
            request = urllib.request.Request(url, headers=request_headers)
            with urllib.request.urlopen(request, timeout=30) as response:
                path.write_bytes(response.read())
            time.sleep(0.10)
        content = path.read_bytes()
        records.append(
            {
                "index": index,
                "url": url,
                "file": str(path.relative_to(ROOT)),
                "bytes": len(content),
                "sha256": hashlib.sha256(content).hexdigest(),
            }
        )
    MANIFEST.write_text(
        json.dumps(
            {
                "observedAt": "2026-08-23",
                "source": "Thompson Target public BigCommerce product sitemap",
                "count": len(records),
                "records": records,
            },
            indent=2,
        )
        + "\n"
    )
    print(f"Preserved {len(records)} Thompson product pages.")


if __name__ == "__main__":
    main()
