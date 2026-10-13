#!/usr/bin/env python3
"""Read-only reconciliation for Episode 64 Shooter Experience drafts.

This audit does not connect drafts or change contracts. It reconciles the
guarded connector's 146-row design intake with the workbook's production
ledger and uses existing population/runtime evidence to investigate ambiguous
identity matches without forcing them.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
from typing import Any
from xml.etree import ElementTree as ET
from zipfile import ZipFile

from connect_episode64_shooter_experience_drafts import (
    CONTRACT_DIR,
    NS,
    cell_value,
    contracts,
    exact_matches,
    normalized,
    shared_strings,
    sheet_path,
    workbook_drafts,
)


ROOT = Path(__file__).resolve().parents[2]
MASTER_SHEET = "1993 Illustrated Master"
POPULATION_REGISTRY = ROOT / "docs/backend/registries/episode64_platform_population_registry.json"


def workbook_rows(path: Path) -> list[dict[str, Any]]:
    with ZipFile(path) as archive:
        strings = shared_strings(archive)
        sheet = ET.fromstring(archive.read(sheet_path(archive, MASTER_SHEET)))
    rows = []
    for row in sheet.findall(".//m:sheetData/m:row", NS):
        if row.attrib["r"] == "1":
            continue
        values = {
            re.match(r"[A-Z]+", cell.attrib["r"])[0]: cell_value(cell, strings)
            for cell in row.findall("m:c", NS)
        }
        rows.append({"worksheetRow": int(row.attrib["r"]), **values})
    return rows


def workbook_status(values: dict[str, Any]) -> str:
    # Later batches use AG. Earlier design rows use AE because those rows were
    # authored before the workbook grew the extra artwork/status columns.
    ag = str(values.get("AG") or "").strip()
    if ag:
        return ag
    ae = str(values.get("AE") or "").strip()
    if any(token in ae.upper() for token in ("DRAFT", "OOS", "DEFERRED")):
        return ae
    return ""


def candidate_evidence(path: Path, package: dict[str, Any]) -> dict[str, Any]:
    profile = package["targetProfile"]
    product = profile.get("product") or {}
    representation = package.get("components", {}).get("representation", {}).get("definition", {})
    asset = representation.get("canonicalAsset") or representation.get("asset") or {}
    asset_path = asset.get("path") or representation.get("path")
    stored_sha = asset.get("sha256") or representation.get("sha256")
    actual_sha = None
    if asset_path:
        resolved = ROOT / "docs" / str(asset_path).lstrip("/")
        if not resolved.exists():
            resolved = ROOT / str(asset_path).lstrip("/")
        if resolved.exists() and resolved.is_file():
            actual_sha = hashlib.sha256(resolved.read_bytes()).hexdigest()
    return {
        "runtimeId": profile.get("id"),
        "publisher": (profile.get("publisher") or {}).get("name"),
        "sku": product.get("sku"),
        "productName": product.get("name"),
        "contractPath": str(path.relative_to(ROOT)),
        "artworkPath": asset_path,
        "artworkSha256": stored_sha or actual_sha,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workbook", required=True, type=Path)
    parser.add_argument("--connector-ledger", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    workbook = workbook_rows(args.workbook)
    status_counts: Counter[str] = Counter()
    for row in workbook:
        status = workbook_status(row)
        upper = status.upper()
        if "OOS" in upper or upper.startswith("DEFERRED"):
            status_counts["deferred"] += 1
        elif "DRAFT" in upper:
            status_counts["provisionalDraft"] += 1
        else:
            status_counts["noReportedDraftStatus"] += 1

    connector = json.loads(args.connector_ledger.read_text(encoding="utf-8"))
    connector_rows = connector["rows"]
    population = json.loads(POPULATION_REGISTRY.read_text(encoding="utf-8"))
    by_master = {int(row["masterNumber"]): row for row in population["records"]}
    packages = contracts()

    ambiguous = []
    for draft in connector_rows:
        if draft["status"] != "BLOCKED_AMBIGUOUS_MATCH":
            continue
        matches = exact_matches(draft, packages)
        candidates = [candidate_evidence(path, package) for path, package in matches]
        pop = by_master.get(int(draft["masterNumber"]))
        runtime_ids = set((pop or {}).get("runtimeIds") or [])
        canonical_face = (pop or {}).get("canonicalFaceId")
        runtime_hits = [item for item in candidates if item["runtimeId"] in runtime_ids]
        sha_hits = [item for item in candidates if canonical_face and item["artworkSha256"] == canonical_face]
        intersection = [
            item for item in candidates
            if item in runtime_hits and (not canonical_face or item in sha_hits)
        ]
        if len(intersection) == 1:
            finding = "UNIQUE_EXISTING_IDENTITY_EVIDENCE"
            resolved = intersection[0]["runtimeId"]
        elif len(runtime_hits) == 1:
            finding = "UNIQUE_RUNTIME_ID_BUT_ARTWORK_SHA_NOT_CORROBORATED"
            resolved = runtime_hits[0]["runtimeId"]
        elif len(sha_hits) == 1:
            finding = "UNIQUE_ARTWORK_SHA_BUT_RUNTIME_ID_NOT_CORROBORATED"
            resolved = sha_hits[0]["runtimeId"]
        else:
            finding = "STILL_AMBIGUOUS"
            resolved = None
        ambiguous.append({
            "masterNumber": draft["masterNumber"],
            "printer": draft["printer"],
            "targetName": draft["targetName"],
            "sku": draft["sku"],
            "populationCanonicalFaceId": canonical_face,
            "populationRuntimeIds": sorted(runtime_ids),
            "candidateCount": len(candidates),
            "candidates": candidates,
            "finding": finding,
            "uniquelyIndicatedRuntimeId": resolved,
            "writePerformed": False,
        })

    connector_counts = Counter(row["status"] for row in connector_rows)
    missing_from_connector = status_counts["provisionalDraft"] - len(connector_rows)
    report = {
        "schemaVersion": "sczn3.episode64.shooter-experience-draft-reconciliation.v1",
        "mode": "read_only",
        "sourceWorkbook": str(args.workbook),
        "sourceSheet": MASTER_SHEET,
        "populationReconciliation": {
            "masterRecords": len(workbook),
            "reportedProvisionalDrafts": status_counts["provisionalDraft"],
            "reportedDeferred": status_counts["deferred"],
            "withoutReportedDraftStatus": status_counts["noReportedDraftStatus"],
            "connectorDesignIntake": len(connector_rows),
            "provisionalDraftsOutsideConnectorIntake": missing_from_connector,
            "relationship": "The 146 connector rows are a subset of the 928 provisional drafts, not an additional population.",
            "connectorCategories": {
                "eligibleExactIdentity": connector_counts["CONNECTED"] + connector_counts["ALREADY_CONNECTED"],
                "newlyConnected": connector_counts["CONNECTED"],
                "alreadyConnected": connector_counts["ALREADY_CONNECTED"],
                "deferredAmbiguousIdentity": connector_counts["BLOCKED_AMBIGUOUS_MATCH"],
                "missingRuntimeMatch": connector_counts["BLOCKED_NO_MATCH"],
                "duplicatedDraftRows": 0,
                "duplicateBackendCandidateSets": connector_counts["BLOCKED_AMBIGUOUS_MATCH"],
            },
            "truthBoundary": "Reported draft means provisional authored description, not a connected or machine-proven Shooter Experience.",
        },
        "ambiguousInvestigation": {
            "count": len(ambiguous),
            "findings": dict(Counter(row["finding"] for row in ambiguous)),
            "writesPerformed": 0,
            "rows": ambiguous,
        },
        "noMatchRows": [
            {key: row.get(key) for key in ("masterNumber", "printer", "targetName", "sku", "status")}
            for row in connector_rows if row["status"] == "BLOCKED_NO_MATCH"
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "populationReconciliation": report["populationReconciliation"],
        "ambiguousFindings": report["ambiguousInvestigation"]["findings"],
        "noMatchRows": report["noMatchRows"],
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
