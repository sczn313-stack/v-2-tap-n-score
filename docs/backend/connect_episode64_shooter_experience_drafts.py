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
POPULATION_REGISTRY = ROOT / "docs/backend/registries/episode64_platform_population_registry.json"
SHEET_NAME = "1993 Illustrated Master"
CONNECTED_AT = date(2026, 10, 12).isoformat()
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
WORKBOOK_REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"

sys.path.insert(0, str(ROOT / "docs/backend"))
from target_execution_contract import validate_contract  # noqa: E402


def normalized(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def publisher_key(value: Any) -> str:
    words = re.findall(r"[a-z0-9]+", str(value or "").lower())
    generic = {"the", "target", "targets", "shooting", "company", "co", "inc", "incorporated", "llc"}
    return "".join(word for word in words if word not in generic)


def publisher_equivalent(left: Any, right: Any) -> bool:
    return bool(publisher_key(left)) and publisher_key(left) == publisher_key(right)


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
        # Early reviewed rows use AA:AE. Later production batches use AC:AG
        # after artwork columns were inserted. The status cell determines the
        # layout; this prevents authority/gate text from being mistaken for a
        # Shooter Experience description.
        late_status = str(values.get("AG") or "").strip()
        early_status = str(values.get("AE") or "").strip()
        if "DRAFT" in late_status.upper():
            description_column, visible_column = "AC", "AD"
            authority_column, supported_column, status_column = "AE", "AF", "AG"
            draft_status = late_status
        elif "DRAFT" in early_status.upper():
            description_column, visible_column = "AA", "AB"
            authority_column, supported_column, status_column = "AC", "AD", "AE"
            draft_status = early_status
        else:
            continue
        description = str(values.get(description_column) or "").strip()
        drafts.append({
            "row": row_number,
            "masterNumber": int(values["A"]),
            "printer": str(values.get("B") or "").strip(),
            "targetName": str(values.get("C") or "").strip(),
            "inventoryRecordId": str(values.get("G") or "").strip(),
            "sku": str(values.get("H") or "").strip(),
            "sourceUrl": str(values.get("L") or "").strip(),
            "description": description,
            "visibleArtworkDescription": str(values.get(visible_column) or "").strip(),
            "authorityLimitations": str(values.get(authority_column) or "").strip(),
            "supportedExperience": str(values.get(supported_column) or "").strip(),
            "draftStatus": draft_status,
            "draftLayout": f"{description_column}:{status_column}",
            "sourceCells": f"{description_column}{row_number}:{status_column}{row_number}",
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
        if not publisher_equivalent(owner.get("name"), draft["printer"]):
            continue
        if sku and normalized(product.get("sku")) == sku:
            candidates.append((path, package))
    if candidates:
        return candidates
    return [
        (path, package)
        for path, package in packages
        if publisher_equivalent((package["targetProfile"].get("publisher") or {}).get("name"), draft["printer"])
        and normalized((package["targetProfile"].get("product") or {}).get("name")) == name
    ]


def population_records() -> dict[int, dict[str, Any]]:
    payload = json.loads(POPULATION_REGISTRY.read_text(encoding="utf-8"))
    return {int(row["masterNumber"]): row for row in payload["records"]}


def identity_resolution(
    draft: dict[str, Any],
    packages: list[tuple[Path, dict[str, Any]]],
    population: dict[int, dict[str, Any]],
) -> tuple[list[tuple[Path, dict[str, Any]]], dict[str, Any]]:
    """Resolve only when population identity and runtime contract agree.

    Publisher/SKU matching remains useful corroboration, but cannot override a
    canonical population/runtime identity. Duplicate numbered contract copies
    are already excluded by ``contracts()``.
    """
    record = population.get(int(draft["masterNumber"]))
    if not record:
        return [], {"method": "NO_POPULATION_RECORD"}
    expected_runtimes = list(record.get("runtimeIds") or [])
    runtime_matches = [
        (path, package) for path, package in packages
        if package["targetProfile"].get("id") in expected_runtimes
    ]
    corroborating = exact_matches(draft, packages)
    corroborating_ids = {package["targetProfile"].get("id") for _, package in corroborating}
    fully_corroborated = [
        (path, package) for path, package in runtime_matches
        if package["targetProfile"].get("id") in corroborating_ids
    ]
    evidence = {
        "method": "POPULATION_RUNTIME_PLUS_PUBLISHER_SKU_OR_NAME",
        "canonicalFaceId": record.get("canonicalFaceId"),
        "populationClassification": record.get("populationClassification"),
        "populationRuntimeIds": expected_runtimes,
        "runtimeContractMatches": len(runtime_matches),
        "publisherSkuOrNameCorroboratedMatches": len(fully_corroborated),
        "workbookSku": draft.get("sku"),
    }
    return fully_corroborated, evidence


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
            "sourceCells": draft["sourceCells"],
            "masterNumber": draft["masterNumber"],
            "inventoryRecordId": draft["inventoryRecordId"],
            "sku": draft["sku"],
            "connectedAt": CONNECTED_AT,
        },
    }


def draft_suitability(draft: dict[str, Any], identity_evidence: dict[str, Any]) -> list[str]:
    blockers = []
    for field in ("description", "visibleArtworkDescription", "authorityLimitations", "supportedExperience"):
        if not str(draft.get(field) or "").strip() or str(draft.get(field)).strip().lower() == "none":
            blockers.append(f"missing_or_empty:{field}")
    if identity_evidence.get("populationClassification") != "INDIVIDUAL_FACE":
        blockers.append(f"non_individual_population:{identity_evidence.get('populationClassification') or 'UNKNOWN'}")
    return blockers


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
    parser.add_argument("--preserve-blockers-from", type=Path, help="Prior connector ledger whose identity blockers remain quarantined.")
    args = parser.parse_args()
    drafts = workbook_drafts(args.workbook)
    packages = contracts()
    population = population_records()
    preserved_blockers: dict[int, str] = {}
    if args.preserve_blockers_from:
        prior = json.loads(args.preserve_blockers_from.read_text(encoding="utf-8"))
        preserved_blockers = {
            int(row["masterNumber"]): row["status"]
            for row in prior["rows"]
            if row["status"] in {"BLOCKED_AMBIGUOUS_MATCH", "BLOCKED_NO_MATCH"}
        }
    rows = []
    for draft in drafts:
        prior_status = preserved_blockers.get(int(draft["masterNumber"]))
        if prior_status:
            rows.append({
                **draft,
                "status": f"PRESERVED_{prior_status}",
                "preservedFrom": str(args.preserve_blockers_from),
                "writePerformed": False,
            })
            continue
        matches, identity_evidence = identity_resolution(draft, packages, population)
        if len(matches) != 1:
            rows.append({
                **draft,
                "status": "BLOCKED_NO_MATCH" if not matches else "BLOCKED_AMBIGUOUS_MATCH",
                "matchCount": len(matches),
                "identityEvidence": identity_evidence,
            })
            continue
        suitability_blockers = draft_suitability(draft, identity_evidence)
        if suitability_blockers:
            rows.append({
                **draft,
                "status": "BLOCKED_INCOMPLETE_DRAFT",
                "matchCount": 1,
                "identityEvidence": identity_evidence,
                "suitabilityBlockers": suitability_blockers,
            })
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
            "identityEvidence": identity_evidence,
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
