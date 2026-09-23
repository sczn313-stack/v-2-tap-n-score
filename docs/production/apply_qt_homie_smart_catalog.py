#!/usr/bin/env python3
"""Bind Homie's Founder-locked 254-chair QT catalog into Backend Authority."""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from collections import Counter
from copy import deepcopy
from pathlib import Path


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))
from target_execution_contract import component_digest, validate_contract  # noqa: E402

PACKET = DOCS / "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23"
CATALOG = PACKET / "QT_HOMIE_SMART_CATALOG_ARTWORK_AUGMENTED.md"
AUTHORITY = BACKEND / "target_knowledge/qt_episode64_smart_target_authority.json"
MANIFEST = DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22/QT_EP64_254_IMPLEMENTATION_MANIFEST.json"
RECONCILIATION = PACKET / "QT_HOMIE_254_CAPABILITY_RECONCILIATION.json"
REVIEW = PACKET / "QT_HOMIE_FOUNDER_REVIEW.html"

EXPECTED_CAPABILITIES = {
    "Scoring": 37,
    "Zone / Object Counting": 153,
    "Zeroing": 1,
    "Evidence Only": 63,
}
EXPECTED_FAMILIES = {
    "VALUED_REGION_QUALIFICATION": 71,
    "EVIDENCE_ONLY": 63,
    "B_FAMILY_SCORING": 34,
    "HOSTAGE_THREAT_RELATIONSHIPS": 29,
    "DISCRIMINATION_OBJECTS": 13,
    "BULLSEYE_MULTI_BULL": 11,
    "REPEATED_OBJECT_COUNTING": 10,
    "M16_M4_QUALIFICATION": 9,
    "ZEROING_SIGHT_IN": 7,
    "COMPETITION_SCORING": 3,
    "ANATOMY_VITAL_REGIONS": 2,
    "DIAGNOSTIC_FEEDBACK": 2,
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def field(block: str, label: str) -> str:
    match = re.search(rf"^- \*\*{re.escape(label)}:\*\*\s*(.+?)\s*$", block, re.MULTILINE)
    if not match:
        raise AssertionError(f"catalog field missing: {label}")
    return match.group(1).strip()


def optional_field(block: str, label: str) -> str | None:
    match = re.search(rf"^- \*\*{re.escape(label)}:\*\*\s*(.+?)\s*$", block, re.MULTILINE)
    return match.group(1).strip() if match else None


def plain(value: str) -> str:
    return value.replace("`", "").replace("*", "").strip()


def list_field(value: str) -> list[str]:
    value = plain(value)
    if value.lower() == "none stored":
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def parse_catalog() -> list[dict]:
    text = CATALOG.read_text(encoding="utf-8")
    headings = list(re.finditer(r"^### (\d+)/254 — (.+?)\s*$", text, re.MULTILINE))
    if len(headings) != 254:
        raise AssertionError(f"catalog must contain 254 chairs, found {len(headings)}")
    records = []
    for index, heading in enumerate(headings):
        block = text[heading.end() : headings[index + 1].start() if index + 1 < len(headings) else len(text)]
        capability_line = field(block, "Artwork-augmented capability")
        capability_match = re.match(r"\*\*(.+?)\*\*\.(?: Prior surgical review: (.+?)\.)?$", capability_line)
        if not capability_match:
            raise AssertionError(f"catalog capability syntax invalid at chair {index + 1}: {capability_line}")
        record = {
            "catalogChair": int(heading.group(1)),
            "productName": heading.group(2).strip(),
            "visualStackChair": int(plain(field(block, "QT visual-stack chair")).lstrip("#")),
            "qtCatalogId": plain(field(block, "Canonical identity")),
            "intelligenceFamily": plain(field(block, "Intelligence family")),
            "capability": plain(capability_match.group(1)),
            "priorSurgicalCapability": plain(capability_match.group(2)) if capability_match.group(2) else None,
            "printedStoredValues": list_field(field(block, "Printed/stored values")),
            "printedStoredLabels": list_field(field(block, "Printed/stored labels")),
            "smartBehavior": plain(field(block, "Smart behavior")),
            "storedTargetRule": plain(optional_field(block, "Stored target rule")) if optional_field(block, "Stored target rule") else None,
            "doNotInvent": list_field(optional_field(block, "Do not invent")) if optional_field(block, "Do not invent") else [],
        }
        records.append(record)
    if [record["catalogChair"] for record in records] != list(range(1, 255)):
        raise AssertionError("catalog chair order is not 1..254")
    if len({record["qtCatalogId"] for record in records}) != 254:
        raise AssertionError("catalog identities are not unique")
    capabilities = Counter(record["capability"] for record in records)
    families = Counter(record["intelligenceFamily"] for record in records)
    changed = [record for record in records if record["priorSurgicalCapability"] and record["priorSurgicalCapability"] != record["capability"]]
    if dict(capabilities) != EXPECTED_CAPABILITIES:
        raise AssertionError(f"capability counts differ from Founder lock: {dict(capabilities)}")
    if dict(families) != EXPECTED_FAMILIES:
        raise AssertionError(f"family counts differ from Founder lock: {dict(families)}")
    if len(changed) != 175:
        raise AssertionError(f"Founder-locked changed-chair count must be 175, found {len(changed)}")
    return records


def normalized(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def contract_artwork_facts(contract: dict) -> tuple[set[str], set[str]]:
    rules = contract.get("components", {}).get("scoring", {}).get("definition", {}).get("regionRules") or {}
    labels: set[str] = set()
    values: set[str] = set()
    for rule in rules.values():
        for key in ("label", "objectLabel"):
            if rule.get(key) is not None:
                labels.add(normalized(rule[key]))
        value = rule.get("value")
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            values.add(str(int(value)) if float(value).is_integer() else str(value))
    return labels, values


def locked_treatment(record: dict, prior: dict, catalog_hash: str) -> dict:
    treatment = deepcopy(prior)
    treatment["schemaVersion"] = "sczn3-episode64-homie-locked-treatment-v2"
    treatment["intelligenceFamily"] = record["intelligenceFamily"]
    treatment["highestTruthfulCapability"] = record["capability"]
    treatment["homieFounderLock"] = {
        "status": "FOUNDER_LOCKED",
        "catalogPath": str(CATALOG.relative_to(DOCS)),
        "catalogSha256": catalog_hash,
        "catalogChair": record["catalogChair"],
        "visualStackChair": record["visualStackChair"],
        "priorSurgicalCapability": record["priorSurgicalCapability"],
        "changedFromPriorSurgicalReview": bool(record["priorSurgicalCapability"] and record["priorSurgicalCapability"] != record["capability"]),
        "governingRule": "Stored authority + explicit source artwork = maximum truthful Smart Target.",
    }
    publisher = treatment["truthLayers"]["publisherTruth"]
    if record["storedTargetRule"]:
        publisher["publishedRuleAuthority"] = {
            "source": f"Homie Founder-locked catalog {catalog_hash}",
            "catalogPath": str(CATALOG.relative_to(DOCS)),
            "rule": record["storedTargetRule"],
        }
    publisher["publishedValuesAvailable"] = bool(record["printedStoredValues"])
    publisher["artworkFacts"] = {
        "values": record["printedStoredValues"],
        "labels": record["printedStoredLabels"],
        "authorityClass": "explicit_source_artwork",
    }
    treatment["smartBehavior"] = record["smartBehavior"]
    treatment["unsupported"] = list(dict.fromkeys(treatment.get("unsupported", []) + [normalized(item) for item in record["doNotInvent"]]))
    result = treatment["result"]
    result["publisherScore"] = record["capability"] == "Scoring"
    result["regionObjectBreakdown"] = record["capability"] in {"Scoring", "Zone / Object Counting"}
    treatment["accounting"]["meaningfulBreakdown"] = (
        "score_and_regions" if record["capability"] == "Scoring"
        else "regions_or_objects" if record["capability"] == "Zone / Object Counting"
        else "governed_zeroing" if record["capability"] == "Zeroing"
        else "measured_shot_pattern"
    )
    treatment["progress"]["scoreHistoryWhenGoverned"] = record["capability"] == "Scoring"
    return treatment


def review_card(record: dict, row: dict) -> str:
    if row["missionFamily"] == "zeroingCorrection":
        href = f"../../../shoot.html?target_profile_id={row['targetProfileId']}&missionFamily=zeroingCorrection&authorityPort=8118"
    else:
        href = f"../../../target-experience.html?missionFamily={row['missionFamily']}&target={row['targetProfileId']}&source=registered&authorityPort=8118"
    image = "../qt-printer13-visual-ingestion-2026-09-22/" + row["assetPath"].split("qt-printer13-visual-ingestion-2026-09-22/", 1)[1]
    changed = " · corrected" if record["priorSurgicalCapability"] and record["priorSurgicalCapability"] != record["capability"] else ""
    return f'''<a class="card" href="{html.escape(href)}"><b>{record['catalogChair']}/254</b><img src="{html.escape(image)}" alt="{html.escape(record['productName'])}" loading="lazy"><strong>{html.escape(record['productName'])}</strong><span>{html.escape(record['intelligenceFamily'].replace('_', ' '))}</span><small>{html.escape(record['capability'] + changed)}</small></a>'''


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate catalog and current chair alignment without writing")
    args = parser.parse_args()
    records = parse_catalog()
    catalog_hash = sha256(CATALOG)
    authority = json.loads(AUTHORITY.read_text())
    manifest = json.loads(MANIFEST.read_text())
    authority_by_id = {row["qtCatalogId"]: row for row in authority["chairs"]}
    if set(authority_by_id) != {record["qtCatalogId"] for record in records}:
        raise AssertionError("catalog and Backend Authority identities do not reconcile")

    mismatches = []
    label_gaps = []
    value_gaps = []
    contract_updates = []
    changed_records = []
    for record in records:
        row = authority_by_id[record["qtCatalogId"]]
        if row["productName"] != record["productName"] or row["chair"] != record["visualStackChair"]:
            mismatches.append({"qtCatalogId": record["qtCatalogId"], "kind": "identity_or_chair"})
        if row["highestTruthfulCapability"] != record["capability"]:
            mismatches.append({"qtCatalogId": record["qtCatalogId"], "kind": "capability", "current": row["highestTruthfulCapability"], "locked": record["capability"]})
        contract_path = DOCS / row["contractPath"] if row.get("contractPath") else None
        contract = json.loads(contract_path.read_text()) if contract_path else None
        if contract:
            labels, values = contract_artwork_facts(contract)
            missing_labels = [label for label in record["printedStoredLabels"] if normalized(label) not in labels]
            missing_values = [value for value in record["printedStoredValues"] if value not in values]
            if missing_labels:
                label_gaps.append({"qtCatalogId": record["qtCatalogId"], "labels": missing_labels})
            if missing_values:
                value_gaps.append({"qtCatalogId": record["qtCatalogId"], "values": missing_values})
        elif record["capability"] != "Zeroing":
            mismatches.append({"qtCatalogId": record["qtCatalogId"], "kind": "missing_contract"})
        if record["priorSurgicalCapability"] and record["priorSurgicalCapability"] != record["capability"]:
            changed_records.append(record)
        contract_updates.append((record, row, contract_path, contract))

    if mismatches:
        raise AssertionError(f"current executable state conflicts with Homie catalog: {mismatches[:8]}")
    if label_gaps or value_gaps:
        raise AssertionError(f"catalog artwork facts are not bound in current geometry/scoring: labels={label_gaps[:8]} values={value_gaps[:8]}")

    summary = {
        "catalogSha256": catalog_hash,
        "chairs": len(records),
        "capabilityCounts": dict(Counter(record["capability"] for record in records)),
        "familyCounts": dict(Counter(record["intelligenceFamily"] for record in records)),
        "changedFromPriorSurgicalReview": len(changed_records),
        "identityCapabilityConflicts": len(mismatches),
        "artworkLabelBindingGaps": len(label_gaps),
        "artworkValueBindingGaps": len(value_gaps),
    }
    if args.check:
        print(json.dumps(summary, indent=2))
        return

    updated_rows = []
    for record, row, contract_path, contract in contract_updates:
        treatment = locked_treatment(record, row["smartTargetTreatment"], catalog_hash)
        row = deepcopy(row)
        row["intelligenceFamily"] = record["intelligenceFamily"]
        row["highestTruthfulCapability"] = record["capability"]
        row["smartTargetTreatment"] = treatment
        row["homieLockedCatalogRecord"] = deepcopy(record)
        if contract:
            contract["authorityContractVersion"] = "QT-EPISODE64-HOMIE-LOCKED-v2"
            contract["approval"] = {
                "status": "approved",
                "authorityId": "QT_EPISODE64_HOMIE_LOCKED_AUTHORITY_2026_09_23",
                "approvedAt": "2026-09-23T00:00:00-04:00",
            }
            product = contract["targetProfile"]["product"]
            product["episode64IntelligenceFamily"] = record["intelligenceFamily"]
            product["homieLockedCapability"] = record["capability"]
            mission = contract["components"]["mission"]["definition"]
            mission["smartTargetTreatment"] = treatment
            scoring = contract["components"]["scoring"]["definition"]
            scoring["homieLockedArtworkFacts"] = {
                "catalogSha256": catalog_hash,
                "values": record["printedStoredValues"],
                "labels": record["printedStoredLabels"],
                "storedTargetRule": record["storedTargetRule"],
            }
            if record["capability"] in {"Scoring", "Zone / Object Counting"}:
                scoring["publisherRuleAuthority"] = treatment["truthLayers"]["publisherTruth"]["publishedRuleAuthority"]
            for component in contract["components"].values():
                component["digest"] = component_digest(component)
            contract.pop("contractFingerprint", None)
            validated = validate_contract(contract)
            contract_path.write_text(json.dumps(contract, indent=2) + "\n")
            row["contractSha256"] = sha256(contract_path)
            row["contractFingerprint"] = validated["contractFingerprint"]
        updated_rows.append(row)

    authority["schemaVersion"] = "sczn3-qt-episode64-homie-locked-authority-v2"
    authority["authorityId"] = "QT_EPISODE64_HOMIE_LOCKED_AUTHORITY_2026_09_23"
    authority["status"] = "HOMIE_LOCKED_IMPLEMENTED_PENDING_VERIFICATION"
    authority["catalogAuthority"] = {
        "path": str(CATALOG.relative_to(DOCS)),
        "sha256": catalog_hash,
        "governingRule": "Stored authority + explicit source artwork = maximum truthful Smart Target.",
        "founderLocked": True,
        "reviewedChairs": 254,
        "priorDowngradesCorrected": 175,
        "inventedRules": 0,
    }
    authority["chairs"] = updated_rows
    authority["capabilityCounts"] = dict(Counter(record["capability"] for record in records))
    authority["intelligenceFamilyCounts"] = dict(Counter(record["intelligenceFamily"] for record in records))
    authority["governingRules"]["explicitSourceArtworkIsAuthorityForVisibleStructure"] = True
    authority["governingRules"]["noInventedTimingSequenceThresholdPenaltyOrCourseRule"] = True
    authority.pop("verification", None)
    authority.pop("exceptions", None)
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n")

    reconciliation = {
        "schemaVersion": "sczn3-qt-homie-locked-capability-reconciliation-v1",
        "status": "IMPLEMENTED_PENDING_INDEPENDENT_VERIFICATION",
        **summary,
        "changedChairs": [
            {
                "catalogChair": record["catalogChair"],
                "visualStackChair": record["visualStackChair"],
                "qtCatalogId": record["qtCatalogId"],
                "productName": record["productName"],
                "from": record["priorSurgicalCapability"],
                "to": record["capability"],
                "family": record["intelligenceFamily"],
            }
            for record in changed_records
        ],
    }
    RECONCILIATION.write_text(json.dumps(reconciliation, indent=2) + "\n")
    manifest["schemaVersion"] = "sczn3-qt-episode64-homie-locked-implementation-manifest-v2"
    manifest["status"] = "HOMIE_LOCKED_IMPLEMENTED_PENDING_VERIFICATION"
    manifest["sourceHead"] = "23a0109b5ce3584cfcaa2900f726ee843d9f899c"
    manifest["capabilityCounts"] = authority["capabilityCounts"]
    manifest["intelligenceFamilyCounts"] = authority["intelligenceFamilyCounts"]
    manifest["homieCatalogPath"] = str(CATALOG.relative_to(DOCS))
    manifest["homieCatalogSha256"] = catalog_hash
    manifest["priorDowngradesCorrected"] = 175
    manifest["reconciliationPath"] = str(RECONCILIATION.relative_to(DOCS))
    manifest["reviewPath"] = str(REVIEW.relative_to(DOCS))
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")

    cards = "".join(review_card(record, row) for record, row in zip(records, updated_rows))
    counts = " · ".join(f"{name.replace('_', ' ')} {count}" for name, count in EXPECTED_FAMILIES.items())
    REVIEW.write_text(f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QT Homie Locked Founder Review</title><style>*{{box-sizing:border-box}}body{{margin:0;background:#080b10;color:#f6f7f9;font:12px system-ui}}header{{position:sticky;top:0;z-index:4;padding:10px 12px;background:#0d1420f2;border-bottom:1px solid #344154}}h1{{margin:0;font-size:20px}}p{{margin:3px 0;color:#b8c2cf}}main{{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;padding:5px}}.card{{position:relative;min-width:0;padding:4px;background:#141c27;border:1px solid #303e50;color:white;text-decoration:none}}.card:hover{{border-color:#f2c75b}}.card b{{position:absolute;padding:3px 6px;background:#05080cdd;font-size:16px}}img{{display:block;width:100%;height:158px;object-fit:contain;background:#fff}}strong,span,small{{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}span{{color:#f2c75b}}small{{color:#b9c5d3}}@media(max-width:850px){{main{{grid-template-columns:repeat(3,minmax(0,1fr))}}}}</style></head><body><header><h1>Episode 64 · Homie-Locked QT 254 Founder Review</h1><p>Catalog {catalog_hash} · authority stored · runtime-bound · 175 prior downgrades corrected</p><p>{html.escape(counts)}</p></header><main>{cards}</main></body></html>''', encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
