#!/usr/bin/env python3
"""Reclassify the preserved 1,993 Episode 64 rows as faces or packages.

This builder never deletes source records and never treats a product name alone
as face authority.  It combines the Master source-row evidence with registered
canonical-face resolution.  Ambiguous multi-face resolution remains UNRESOLVED.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLATFORM = ROOT / "docs/authority-evidence/platform"
CENSUS = PLATFORM / "episode64-inheritance-census-input-2026-10-04/SCZN3_EP64_THE13_1993_INHERITANCE_CENSUS.json"
FA_REGISTRY = ROOT / "docs/backend/registries/episode64_platform_founder_acceptance_registry.json"
SOURCE_ROWS = PLATFORM / "episode64-platform-multipack-reclassification-2026-10-11/SCZN3_EP64_MASTER_SOURCE_RECORDS_EXTRACT.json"
MASTER_XLSX = PLATFORM / "episode64-the13-authoritative-census-2026-10-02/SCZN3_EP64_THE13_1993_CONSOLIDATED_MASTER.xlsx"
OUT_DIR = PLATFORM / "episode64-platform-multipack-reclassification-2026-10-11"
OUT_REGISTRY = ROOT / "docs/backend/registries/episode64_platform_population_registry.json"

INDIVIDUAL = "INDIVIDUAL_FACE"
IDENTICAL = "IDENTICAL_MULTIPACK"
ASSORTMENT = "ASSORTMENT_PACK"
CONTAINER = "COMMERCIAL_CONTAINER"
UNRESOLVED = "UNRESOLVED"

QTY_RE = re.compile(r"(?i)(?:\b\d+\s*[- ]?(?:pack|pk|count|ct)\b|\bbox of \d+\b|\b\d+\s+targets?\s+total\b|\bcase of \d+\b|\broll of \d+\b|\bsingle pack\b)")
MULTI_RE = re.compile(r"(?i)(?:\bvariety\b|\bassort(?:ed|ment)?\b|\bcombo\b|\bsample pack\b|pack(?:\s*#|_)|\bspecial pack\b|\bholiday(?:s)? pack\b|\bmonster pack\b|\bzombie pack\b|\bfun pack\b|\binvasion pack\b|\bblast pack\b|\bspirit pack\b|\bparty pack\b|\boutdoors pack\b|\bsilhouette target pack\b|\bpistol pack\b|\bhostage pack\b|\bin a crowd pack\b|\bbad guy target pack\b)")
PACK_RE = re.compile(r"(?i)\b(pack|box|case|roll|bundle|kit|set|targets total|target system)\b|pack[_#]")

THE13_MASTERS = [251, 687, 428, 501, 681, 817, 149, 156, 246, 92, 172, 218, 231]


def load(path: Path):
    return json.loads(path.read_text())


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def split_ids(value) -> list[str]:
    return [x.strip() for x in str(value or "").split(",") if x.strip()]


def quantity_product(row: dict) -> bool:
    return bool(QTY_RE.search(str(row.get("Product name") or ""))) or bool(
        re.search(r"(?i)(?:^|[-_:])Q(?:250|500|1000)(?:$|[-_:])", str(row.get("Printer product ID") or ""))
    )


def quantities(text: str) -> list[int]:
    found = []
    patterns = [
        r"(?i)\b(\d+)\s*[- ]?(?:pack|pk|count|ct)\b",
        r"(?i)\bbox of (\d+)\b",
        r"(?i)\b(\d+)\s+targets?\s+total\b",
        r"(?i)\bcase of (\d+)\b",
        r"(?i)(?:^|[-_:])Q(250|500|1000)(?:$|[-_:])",
    ]
    for pattern in patterns:
        found.extend(int(x) for x in re.findall(pattern, text))
    return sorted(set(found))


def classify(face: dict, sources: list[dict]) -> tuple[str, str, str]:
    ident = face["identity"]
    names = " | ".join([str(x.get("Product name") or "") for x in sources] + [ident["targetName"]])
    candidates = set(ident.get("candidateCanonicalFaceIds") or []) - {"UNKNOWN"}
    has_pack_signal = bool(PACK_RE.search(names) or QTY_RE.search(names) or MULTI_RE.search(names))

    if ident["printer"] == "Qualification Targets":
        return INDIVIDUAL, "HIGH", "QT semantic record identifies one governed paper face; SKU color/ink variants do not create another face."
    if ident["masterNumber"] == 156:
        return ASSORTMENT, "HIGH", "Durable Episode 64 audit identifies this as a nine-target commercial package, not one executable face."
    if len(candidates) > 1:
        if has_pack_signal:
            return ASSORTMENT, "HIGH", "Commercial package resolves to multiple registered canonical face hashes."
        return UNRESOLVED, "LOW", "One Master row resolves to multiple canonical face hashes without package evidence; an authorized merge cannot be inferred."
    if any(x.get("Shootable classification") == "MULTI-FACE ASSORTMENT" for x in sources):
        return ASSORTMENT, "HIGH", "Master source explicitly classifies the product as a multi-face assortment."
    if MULTI_RE.search(names):
        if len(candidates) == 1:
            return IDENTICAL, "HIGH", "Package identity resolves to one registered canonical face."
        return ASSORTMENT, "MEDIUM", "Publisher product evidence describes an assortment; component identities are retained only where independently registered."
    if sources and any(not quantity_product(x) and not PACK_RE.search(str(x.get("Product name") or "")) for x in sources):
        return INDIVIDUAL, "HIGH", "At least one source product is an independently named paper face; quantity SKUs are retained as commercial variants."
    if sources and all(quantity_product(x) or PACK_RE.search(str(x.get("Product name") or "")) for x in sources):
        derived = {str(x.get("Derived face name")).strip() for x in sources if x.get("Derived face name")}
        if len(derived) == 1 or len(candidates) == 1:
            return IDENTICAL, "HIGH", "All preserved source products are quantity packages of one derived or registered face."
        return UNRESOLVED, "LOW", "Package evidence exists, but one exact face or a verified component roster is not established."
    if has_pack_signal:
        if len(candidates) == 1:
            return IDENTICAL, "HIGH", "Package record resolves to one registered canonical face."
        return UNRESOLVED, "LOW", "Ambiguous package record lacks a verified component roster and exact face binding."
    if sources and all(x.get("Shootable classification") == "PAPER / FACE CANDIDATE" for x in sources):
        return INDIVIDUAL, "HIGH", "All joined Master source rows identify the same derived paper face."
    if ident.get("canonicalFaceResolution") == "ONE_REGISTERED_CANONICAL_FACE":
        return INDIVIDUAL, "HIGH", "Runtime registration resolves the record to one canonical face."
    return INDIVIDUAL, "MEDIUM", "Master face derivation identifies one paper face; no contrary package evidence is preserved."


def face_key(record: dict) -> str | None:
    candidates = record["packageRelationship"]["verifiedCanonicalFaceIds"]
    if record["populationClassification"] not in {INDIVIDUAL, IDENTICAL}:
        return None
    if len(candidates) == 1:
        return "sha256:" + candidates[0]
    return record["censusFaceKey"]


def main():
    census = load(CENSUS)
    fa = load(FA_REGISTRY)
    fa_by_key = {x["censusFaceKey"]: x for x in fa["records"]}
    source_rows = load(SOURCE_ROWS)
    source_by_id = {str(x["Inventory record ID"]): x for x in source_rows}
    records = []

    for face in census["faces"]:
        ident = face["identity"]
        source_ids = split_ids(ident.get("inventoryRecordIdsOrQtIdentityId"))
        sources = [source_by_id[x] for x in source_ids if x in source_by_id]
        category, confidence, reason = classify(face, sources)
        candidate_ids = sorted(set(ident.get("candidateCanonicalFaceIds") or []) - {"UNKNOWN"})
        product_rows = []
        for row in sources:
            text = f"{row.get('Product name') or ''} {row.get('Printer product ID') or ''}"
            product_rows.append({
                "inventoryRecordId": row.get("Inventory record ID"),
                "sourceRecordId": row.get("Source record ID"),
                "skuOrProductId": row.get("Printer product ID"),
                "productName": row.get("Product name"),
                "derivedFaceName": row.get("Derived face name"),
                "sourceUrl": row.get("Source URL"),
                "packageQuantities": quantities(text),
                "sourceShootableClassification": row.get("Shootable classification"),
            })
        prior = fa_by_key[ident["censusFaceKey"]]
        executable = category in {INDIVIDUAL, IDENTICAL}
        founder_eligible = prior["librarySelection"]["eligibleForFounderReview"]
        records.append({
            "censusFaceKey": ident["censusFaceKey"],
            "masterNumber": ident["masterNumber"],
            "printer": ident["printer"],
            "targetName": ident["targetName"],
            "canonicalFaceId": ident["canonicalFaceId"],
            "runtimeIds": ident.get("runtimeIds") or [],
            "populationClassification": category,
            "classificationConfidence": confidence,
            "classificationReason": reason,
            "commercialProducts": product_rows,
            "packageRelationship": {
                "commercialProductIds": [x["skuOrProductId"] for x in product_rows],
                "verifiedCanonicalFaceIds": candidate_ids,
                "verifiedComponentFaceCount": len(candidate_ids) if category == ASSORTMENT else (1 if executable else 0),
                "componentRosterComplete": bool(candidate_ids) and category != UNRESOLVED,
            },
            "executableFaceSelection": {
                "eligible": executable and founder_eligible,
                "excludedBecause": None if executable and founder_eligible else (
                    prior["librarySelection"]["excludeReason"] if not founder_eligible else category
                ),
            },
            "founderAuthority": {
                "status": prior["founderStatus"],
                "currentScope": prior["currentScope"],
                "evidence": prior["founderEvidence"],
                "inheritance": prior["approvalInheritance"],
            },
            "backend": prior["backend"],
            "artwork": prior["artwork"],
            "secEvidence": prior["secEvidence"],
        })

    counts = Counter(x["populationClassification"] for x in records)
    direct_face_keys = {k for x in records if (k := face_key(x))}
    assortment_components = {
        "sha256:" + candidate
        for x in records if x["populationClassification"] == ASSORTMENT
        for candidate in x["packageRelationship"]["verifiedCanonicalFaceIds"]
    }
    verified_keys = direct_face_keys | assortment_components
    new_assortment_faces = assortment_components - direct_face_keys
    duplicate_source_representations = sum(max(0, len(x["commercialProducts"]) - 1) for x in records)
    unresolved_assortments = sum(
        x["populationClassification"] == ASSORTMENT and not x["packageRelationship"]["componentRosterComplete"]
        for x in records
    )
    source_class_counts = Counter(str(x.get("Shootable classification") or "UNCLASSIFIED") for x in source_rows)
    confidence_counts = Counter(x["classificationConfidence"] for x in records)
    summary = {
        "preservedRegistryRecords": len(records),
        "preservedCommercialSourceRecords": len(source_rows),
        **{k: counts.get(k, 0) for k in [INDIVIDUAL, IDENTICAL, ASSORTMENT, CONTAINER, UNRESOLVED]},
        "verifiedUniqueShootableFaceMinimum": len(verified_keys),
        "verifiedDirectFaceKeys": len(direct_face_keys),
        "knownAssortmentComponentFaceKeys": len(assortment_components),
        "assortmentComponentsNewToDirectFacePopulation": len(new_assortment_faces),
        "knownDuplicateCommercialRepresentations": duplicate_source_representations,
        "recordsReclassifiedFromImplicitIndividualFace": counts.get(IDENTICAL, 0) + counts.get(ASSORTMENT, 0) + counts.get(CONTAINER, 0) + counts.get(UNRESOLVED, 0),
        "recordsExcludedFromUniqueFaceMinimum": counts.get(ASSORTMENT, 0) + counts.get(CONTAINER, 0) + counts.get(UNRESOLVED, 0),
        "recordsExcludedFromExecutableFaceSelection": sum(not x["executableFaceSelection"]["eligible"] for x in records),
        "unresolvedAssortmentsWithoutCompleteRoster": unresolved_assortments,
        "sourceOnlyPreclassifiedAssortmentRecords": source_class_counts.get("MULTI-FACE ASSORTMENT", 0),
        "classificationConfidence": dict(sorted(confidence_counts.items())),
        "exactUniqueFaceCountProven": False,
        "upperBound": None,
        "upperBoundReason": "No finite upper bound is supported while assortment component rosters remain incomplete.",
    }
    registry = {
        "schemaVersion": "sczn3-platform-population-registry-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "governance": {
            "baselineRecordsPreserved": 1993,
            "deleteMultipacks": False,
            "pixelCreatesAuthority": False,
            "selectionRule": "Only INDIVIDUAL_FACE and IDENTICAL_MULTIPACK may supply an executable face, subject to FA/OOS/HOLD status.",
        },
        "sources": {
            "sourceWorkbook": {"path": rel(MASTER_XLSX), "sha256": sha(MASTER_XLSX), "readMethod": "@oai/artifact-tool"},
            "census": {"path": rel(CENSUS), "sha256": sha(CENSUS)},
            "founderAcceptanceRegistry": {"path": rel(FA_REGISTRY), "sha256": sha(FA_REGISTRY)},
            "masterSourceExtract": {"path": rel(SOURCE_ROWS), "sha256": sha(SOURCE_ROWS)},
        },
        "summary": summary,
        "records": records,
    }
    OUT_REGISTRY.write_text(json.dumps(registry, indent=2) + "\n")
    the13 = build_the13(records)
    (OUT_DIR / "SCZN3_EP64_THE13_POPULATION_INTEGRITY_MATRIX.json").write_text(json.dumps(the13, indent=2) + "\n")
    before_after = {
        "schemaVersion": "sczn3-platform-population-before-after-v1",
        "before": {"claimedShootableTargetPopulation": 1993, "commercialPackageDistinction": "NOT_RECONCILED"},
        "after": summary,
        "interpretation": "1,993 remains the preserved registry population. It is not a proven unique-face count. The evidence-backed minimum is reported separately.",
    }
    (OUT_DIR / "BEFORE_AFTER_POPULATION_ACCOUNTING.json").write_text(json.dumps(before_after, indent=2) + "\n")
    unresolved = [
        {
            "censusFaceKey": x["censusFaceKey"], "masterNumber": x["masterNumber"],
            "printer": x["printer"], "targetName": x["targetName"],
            "reason": x["classificationReason"],
            "candidateCanonicalFaceIds": x["packageRelationship"]["verifiedCanonicalFaceIds"],
        }
        for x in records if x["populationClassification"] == UNRESOLVED
    ]
    incomplete_assortments = [
        {
            "censusFaceKey": x["censusFaceKey"], "masterNumber": x["masterNumber"],
            "printer": x["printer"], "targetName": x["targetName"],
            "classificationConfidence": x["classificationConfidence"],
        }
        for x in records
        if x["populationClassification"] == ASSORTMENT and not x["packageRelationship"]["componentRosterComplete"]
    ]
    (OUT_DIR / "UNRESOLVED_AND_INCOMPLETE_CASES.json").write_text(json.dumps({
        "schemaVersion": "sczn3-population-exceptions-v1",
        "unresolvedRecords": unresolved,
        "assortmentsWithoutCompleteVerifiedRoster": incomplete_assortments,
    }, indent=2) + "\n")
    checkpoint = {
        "schemaVersion": "sczn3-new-files-only-checkpoint-v1",
        "recordedAt": datetime.now(timezone.utc).isoformat(),
        "startingHead": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "priorFaRegistryPreserved": {"path": rel(FA_REGISTRY), "sha256": sha(FA_REGISTRY), "conclusiveRecords": 334},
        "strategy": "No existing production or evidence file is rewritten; rollback removes only this population package, registry, builder, reader, and test.",
        "gitCommit": "NOT_CREATED_APPROVAL_GUARD_PRESERVED",
    }
    (OUT_DIR / "ROLLBACK_CHECKPOINT.json").write_text(json.dumps(checkpoint, indent=2) + "\n")
    (OUT_DIR / "SCZN3_EP64_PLATFORM_MULTIPACK_RECLASSIFICATION_REPORT.md").write_text(report(registry, the13))
    print(json.dumps({"summary": summary, "registry": rel(OUT_REGISTRY)}, indent=2))


def build_the13(records: list[dict]) -> list[dict]:
    by_master = {x["masterNumber"]: x for x in records}
    rows = []
    for master in THE13_MASTERS:
        r = by_master[master]
        package_block = r["populationClassification"] in {ASSORTMENT, CONTAINER, UNRESOLVED}
        if package_block:
            effect = "INELIGIBLE_PACKAGE_OR_UNRESOLVED"
        elif r["founderAuthority"]["status"] in {"FOUNDER_APPROVED", "FOUNDER_APPROVED_INHERITED", "FOUNDER_OOS"}:
            effect = "INELIGIBLE_FOUNDER_STATUS"
        else:
            effect = "HOLD_ORIGINAL_NUMBER_4_PROVENANCE"
        rows.append({
            "masterNumber": master,
            "printer": r["printer"],
            "targetName": r["targetName"],
            "populationClassification": r["populationClassification"],
            "classificationConfidence": r["classificationConfidence"],
            "verifiedComponentFaceCount": r["packageRelationship"]["verifiedComponentFaceCount"],
            "founderStatus": r["founderAuthority"]["status"],
            "eligibilityEffect": effect,
            "replacementSelected": False,
        })
    return rows


def report(registry: dict, the13: list[dict]) -> str:
    s = registry["summary"]
    lines = [
        "# Episode 64 — Platform-wide Multipack Reclassification",
        "",
        "## Population result",
        "",
        "The original **1,993 records remain preserved**. They are not a proven count of unique shootable faces.",
        "",
        "| Classification | Records |",
        "|---|---:|",
    ]
    for key in [INDIVIDUAL, IDENTICAL, ASSORTMENT, CONTAINER, UNRESOLVED]:
        lines.append(f"| {key} | {s[key]} |")
    lines += [
        "",
        f"Verified unique shootable-face minimum: **{s['verifiedUniqueShootableFaceMinimum']}**.",
        "",
        "An exact final count and finite upper bound are not proven because some assortment component rosters remain incomplete and five non-package Master rows resolve to conflicting canonical face hashes.",
        "",
        f"Preserved commercial source records: **{s['preservedCommercialSourceRecords']}**. Known duplicate commercial representations: **{s['knownDuplicateCommercialRepresentations']}**.",
        "",
        f"Records reclassified away from the implicit individual-face assumption: **{s['recordsReclassifiedFromImplicitIndividualFace']}**. Records excluded from the verified unique-face minimum: **{s['recordsExcludedFromUniqueFaceMinimum']}**.",
        "",
        f"The preserved 2,570-row source layer also contains **{s['sourceOnlyPreclassifiedAssortmentRecords']}** preclassified multi-face assortment records that were never promoted into the 1,993 Master population.",
        "",
        "## Protection",
        "",
        "- The 334 conclusive FA/OOS/HOLD records are copied by exact census identity with their evidence intact.",
        "- Multipacks and assortments are retained as commercial identities.",
        "- Selection eligibility is false for assortments, containers, unresolved records, OOS, holds, and Founder-approved faces.",
        "- No target contract, scoring rule, geometry, artwork, SEC/Vault record, or historical ledger was rewritten.",
        "- Runtime Library consumption is not claimed; this pass adds the canonical backend population registry and reader.",
        "",
        "## THE 13",
        "",
        "| Master | Printer | Target | Population class | FA status | Effect |",
        "|---:|---|---|---|---|---|",
    ]
    for row in the13:
        lines.append(f"| {row['masterNumber']} | {row['printer']} | {row['targetName']} | {row['populationClassification']} | {row['founderStatus']} | {row['eligibilityEffect']} |")
    lines += [
        "",
        "No replacement was selected. The original #4 safety switch remains active.",
        "",
        "## Remaining exceptions",
        "",
        "- Five non-package Master rows aggregate multiple registered canonical face hashes and remain UNRESOLVED.",
        f"- {s['unresolvedAssortmentsWithoutCompleteRoster']} assortment records lack a complete verified component roster; their package identity is established, but unknown components are not invented.",
        "- The verified face count is therefore a minimum, not an exact final population.",
    ]
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    main()
