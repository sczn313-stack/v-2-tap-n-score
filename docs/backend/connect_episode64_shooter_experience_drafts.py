#!/usr/bin/env python3
"""Plan or connect Homie's Episode 64 Shooter Experience drafts.

The workbook is descriptive input, not geometry, scoring, or Founder authority.
The default mode is read-only. ``--apply`` only attaches the exact draft text,
source provenance, and authority limitations to a uniquely matched contract.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
from datetime import date
import json
from pathlib import Path
import re
import sys
from typing import Any
from xml.etree import ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_DIR = ROOT / "docs/backend/target_execution_contracts/contracts"
SHEET_NAME = "1993 Illustrated Master"
CONNECTED_AT = date(2026, 10, 12).isoformat()
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
WORKBOOK_REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"

sys.path.insert(0, str(ROOT / "docs/backend"))
from target_execution_contract import validate_contract  # noqa: E402


def normalized(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def shared_strings(archive: ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return ["".join(node.text or "" for node in item.findall(".//m:t", NS)) for item in root.findall("m:si", NS)]


def sheet_path(archive: ZipFile, name: str) -> str:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationship_id = None
    for sheet in workbook.findall("m:sheets/m:sheet", NS):
        if sheet.attrib.get("name") == name:
            relationship_id = sheet.attrib.get(WORKBOOK_REL)
            break
    if not relationship_id:
        raise RuntimeError(f"workbook_sheet_missing:{name}")
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    for relationship in relationships.findall("r:Relationship", REL_NS):
        if relationship.attrib.get("Id") == relationship_id:
            target = relationship.attrib["Target"].lstrip("/")
            return target if target.startswith("xl/") else f"xl/{target}"
    raise RuntimeError(f"workbook_sheet_relationship_missing:{name}")


def cell_value(cell: ET.Element, strings: list[str]) -> Any:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.findall(".//m:t", NS))
    value = cell.find("m:v", NS)
    if value is None:
        return None
    raw = value.text or ""
    if cell_type == "s":
        return strings[int(raw)]
    if cell_type == "b":
        return raw == "1"
    try:
        number = float(raw)
        return int(number) if number.is_integer() else number
    except ValueError:
        return raw


def workbook_drafts(path: Path) -> list[dict[str, Any]]:
    with ZipFile(path) as archive:
        strings = shared_strings(archive)
        sheet = ET.fromstring(archive.read(sheet_path(archive, SHEET_NAME)))
    drafts: list[dict[str, Any]] = []
    for row in sheet.findall(".//m:sheetData/m:row", NS):
        row_number = int(row.attrib["r"])
        if row_number == 1:
            continue
        values = {re.match(r"[A-Z]+", cell.attrib["r"])[0]: cell_value(cell, strings) for cell in row.findall("m:c", NS)}
        description = str(values.get("AA") or "").strip()
        draft_status = str(values.get("AE") or "").strip()
        if not description or not draft_status.startswith("DESIGN DRAFTED"):
            continue
        drafts.append({
            "row": row_number,
            "masterNumber": int(values["A"]),
            "printer": str(values.get("B") or "").strip(),
            "targetName": str(values.get("C") or "").strip(),
            "inventoryRecordId": str(values.get("G") or "").strip(),
            "sku": str(values.get("H") or "").strip(),
            "sourceUrl": str(values.get("L") or "").strip(),
            "description": description,
            "visibleArtworkDescription": str(values.get("AB") or "").strip(),
            "authorityLimitations": str(values.get("AC") or "").strip(),
            "supportedExperience": str(values.get("AD") or "").strip(),
            "draftStatus": draft_status,
        })
    return drafts


def contracts() -> list[tuple[Path, dict[str, Any]]]:
    rows = []
    paths = sorted(CONTRACT_DIR.glob("*.json"))
    canonical_paths = set(paths)
    for path in paths:
        copied_name = re.fullmatch(r"(.+) (\d+)\.json", path.name)
        if copied_name and path.with_name(f"{copied_name.group(1)}.json") in canonical_paths:
            continue
        try:
            package = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if isinstance(package.get("targetProfile"), dict):
            rows.append((path, package))
    return rows


def exact_matches(draft: dict[str, Any], packages: list[tuple[Path, dict[str, Any]]]) -> list[tuple[Path, dict[str, Any]]]:
    publisher = normalized(draft["printer"])
    sku = normalized(draft["sku"])
    name = normalized(draft["targetName"])
    candidates = []
    for path, package in packages:
        profile = package["targetProfile"]
        product = profile.get("product") or {}
        owner = profile.get("publisher") or {}
        if normalized(owner.get("name")) != publisher:
            continue
        if sku and normalized(product.get("sku")) == sku:
            candidates.append((path, package))
    if candidates:
        return candidates
    return [
        (path, package)
        for path, package in packages
        if normalized((package["targetProfile"].get("publisher") or {}).get("name")) == publisher
        and normalized((package["targetProfile"].get("product") or {}).get("name")) == name
    ]


def experience(draft: dict[str, Any], workbook: Path) -> dict[str, Any]:
    row = draft["row"]
    return {
        "schemaVersion": "sczn3-shooter-experience-draft-v1",
        "status": "connected_with_authority_limitations",
        "description": draft["description"],
        "visibleArtworkDescription": draft["visibleArtworkDescription"],
        "authorityLimitations": draft["authorityLimitations"],
        "supportedExperience": draft["supportedExperience"],
        "provenance": {
            "authorityRole": "homie_shooter_experience_draft_not_geometry_or_scoring_authority",
            "sourceWorkbook": workbook.name,
            "sourceSheet": SHEET_NAME,
            "sourceRow": row,
            "sourceCells": f"AA{row}:AE{row}",
            "masterNumber": draft["masterNumber"],
            "inventoryRecordId": draft["inventoryRecordId"],
            "sku": draft["sku"],
            "connectedAt": CONNECTED_AT,
        },
    }


def write_contract(path: Path, package: dict[str, Any]) -> str:
    candidate = deepcopy(package)
    candidate["targetProfile"]["product"]["shooterExperience"] = package["_shooterExperience"]
    candidate.pop("_shooterExperience", None)
    candidate.pop("contractFingerprint", None)
    validated = validate_contract(candidate)
    path.write_text(json.dumps(candidate, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return validated["contractFingerprint"]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workbook", type=Path, required=True)
    parser.add_argument("--apply", action="store_true", help="Attach metadata to uniquely matched contracts. Default is read-only.")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    drafts = workbook_drafts(args.workbook)
    packages = contracts()
    rows = []
    for draft in drafts:
        matches = exact_matches(draft, packages)
        if len(matches) != 1:
            rows.append({**draft, "status": "BLOCKED_NO_MATCH" if not matches else "BLOCKED_AMBIGUOUS_MATCH", "matchCount": len(matches)})
            continue
        path, package = matches[0]
        profile = package["targetProfile"]
        metadata = experience(draft, args.workbook)
        existing = (profile.get("product") or {}).get("shooterExperience")
        status = "ALREADY_CONNECTED" if existing == metadata else "READY_TO_CONNECT"
        fingerprint = None
        if args.apply and status == "READY_TO_CONNECT":
            package["_shooterExperience"] = metadata
            fingerprint = write_contract(path, package)
            status = "CONNECTED"
        rows.append({
            **draft,
            "status": status,
            "runtimeId": profile["id"],
            "contractPath": str(path.relative_to(ROOT)),
            "missionFamily": package["missionFamily"],
            "governedRegionCount": len(package["components"]["geometry"]["definition"].get("regions", [])),
            "scoringStatus": package["components"]["scoring"]["definition"].get("status"),
            **({"contractFingerprint": fingerprint} if fingerprint else {}),
        })
    summary: dict[str, int] = {"draftCount": len(rows)}
    for row in rows:
        summary[row["status"]] = summary.get(row["status"], 0) + 1
    report = {
        "schemaVersion": "sczn3.episode64.shooter-experience-connection-plan.v1",
        "mode": "apply" if args.apply else "read_only_plan",
        "sourceWorkbook": str(args.workbook),
        "sourceSheet": SHEET_NAME,
        "governance": {
            "descriptionIsGeometryAuthority": False,
            "descriptionIsScoringAuthority": False,
            "founderAcceptanceChanged": False,
            "contractBehaviorChanged": False,
            "ambiguousIdentitiesFailClosed": True,
        },
        "summary": summary,
        "rows": rows,
    }
    rendered = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")


if __name__ == "__main__":
    main()
