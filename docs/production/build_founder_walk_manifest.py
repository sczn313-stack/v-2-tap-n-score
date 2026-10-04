#!/usr/bin/env python3
"""Build the deterministic, canonical-face-safe Founder Walk."""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from pathlib import Path

from openpyxl import load_workbook


DOCS = Path(__file__).resolve().parents[1]
CONTRACTS = DOCS / "backend/target_execution_contracts/contracts"
CENSUS = DOCS / "authority-evidence/platform/episode64-the13-authoritative-census-2026-10-02/SCZN3_EP64_THE13_1993_CONSOLIDATED_MASTER.xlsx"
CENSUS_SHEET = "THE 13 — 1993 Master"
OUTPUT = DOCS / "founder_walk_manifest.js"
AUDIT_OUTPUT = DOCS / "authority-evidence/platform/episode64-founder-walk-2026-10-02/FOUNDER_WALK_CANONICAL_FACE_AUDIT.json"
WALK_SIZE = 21
REVIEWED = (
    {"founderNumber": 1, "targetProfileId": "baker_gf_bb_c"},
    {"founderNumber": 2, "targetProfileId": "ez_aim_allen_15787_shootin_eye_test"},
    {"founderNumber": 3, "targetProfileId": "blocker_baker_targets_gf_250anniversary"},
    {"founderNumber": 4, "targetProfileId": "final_collection_baker_targets_spec_4thofjulypack_001"},
    {"founderNumber": 5, "targetProfileId": "blocker_baker_targets_gf_4thofjuly"},
)
LLM_READY_FACES = {
    "2bc7e86234b634720f86198b5e870b4120d5efba33247ffa33a78797bc204ce1",
    "416e346cdbbf4c23cc8aa0c8690b2bc0fac019749db7a117e4eb051129a668db",
}

PUBLISHER_ALIASES = {
    "Baker Targets": {"Baker Targets"},
    "GunFun": {"GunFun", "GunFun Shooting Targets, Inc."},
    "Splatterburst Targets": {"Splatterburst Targets"},
    "Highwild": {"Highwild"},
    "Birchwood Casey": {"Birchwood Casey"},
    "EZ Aim / Allen Company": {"EZ Aim / Allen Company"},
    "Champion Targets / Primos": {"Champion Targets / Primos"},
    "American Target Company": {"American Target Company"},
    "The National Target Company": {"The National Target Company"},
    "Speedwell Targets": {"Speedwell Targets"},
    "U.S. Target Inc.": {"U.S. Target Inc."},
    "Thompson Target Inc.": {"Thompson Target Inc."},
    "Qualification Targets": {"Qualification Targets Inc"},
}


def clean(value) -> str:
    return str(value or "").strip()


def normalized(value) -> str:
    ascii_value = unicodedata.normalize("NFKD", clean(value)).encode("ascii", "ignore").decode("ascii").casefold()
    return re.sub(r"[^a-z0-9]+", " ", ascii_value).strip()


def canonical_contract_paths() -> list[Path]:
    return [path for path in sorted(CONTRACTS.glob("*.json")) if not re.search(r" \d+$", path.stem)]


def load_contracts() -> list[dict]:
    identities: dict[tuple[str, str], dict] = {}
    for path in canonical_contract_paths():
        package = json.loads(path.read_text(encoding="utf-8"))
        identity = (clean(package.get("contractId")), clean(package.get("contractVersion")))
        if all(identity):
            identities.setdefault(identity, package)
    return list(identities.values())


def canonical_face_id(contract: dict) -> str:
    registration = contract.get("components", {}).get("registration", {}).get("definition", {})
    face_id = clean(registration.get("assetSha256")).lower()
    if len(face_id) != 64 or any(character not in "0123456789abcdef" for character in face_id):
        raise RuntimeError(f"canonical face unresolved for {contract.get('contractId')}")
    return face_id


def face_registry(contracts: list[dict]) -> dict[str, dict]:
    registry: dict[str, dict] = {}
    for contract in contracts:
        target = contract["targetProfile"]
        product = target.get("product") or {}
        publisher = target.get("publisher") or {}
        registration = contract["components"]["registration"]["definition"]
        face_id = canonical_face_id(contract)
        face = registry.setdefault(face_id, {
            "canonicalFaceId": face_id,
            "assetSha256": face_id,
            "sourceIdentities": [],
        })
        face["sourceIdentities"].append({
            "runtimeId": target["id"],
            "contractId": contract["contractId"],
            "contractVersion": contract["contractVersion"],
            "printer": publisher.get("name"),
            "publisherUrl": publisher.get("url"),
            "productId": product.get("id"),
            "productName": product.get("name"),
            "sku": product.get("sku"),
            "assetPath": registration.get("assetPath"),
        })
    for face in registry.values():
        face["sourceIdentities"].sort(key=lambda item: (normalized(item["runtimeId"]), normalized(item["sku"])))
        face["runtimeIds"] = [item["runtimeId"] for item in face["sourceIdentities"]]
        face["skus"] = sorted({clean(item["sku"]) for item in face["sourceIdentities"] if clean(item["sku"])})
        face["productIds"] = sorted({clean(item["productId"]) for item in face["sourceIdentities"] if clean(item["productId"])})
    return registry


def load_census() -> list[dict]:
    workbook = load_workbook(CENSUS, read_only=True, data_only=True)
    sheet = workbook[CENSUS_SHEET]
    headers = [clean(value) for value in next(sheet.iter_rows(values_only=True))]
    rows = []
    for values in sheet.iter_rows(min_row=2, values_only=True):
        row = dict(zip(headers, values))
        if clean(row.get("Smart Family")) != "1. Mona Lisa":
            continue
        rows.append({
            "censusOrder": int(row["Master #"]),
            "printer": clean(row["Printer"]),
            "targetName": clean(row["Target name"]),
            "productId": clean(row["Printer product IDs / SKU"]),
            "status": clean(row["Status / QT capability"]),
        })
    workbook.close()
    if len(rows) != 400:
        raise RuntimeError(f"expected 400 Mona Lisa census rows, found {len(rows)}")
    return sorted(rows, key=lambda row: row["censusOrder"])


def candidate_contracts(row: dict, contracts: list[dict]) -> list[dict]:
    aliases = PUBLISHER_ALIASES.get(row["printer"], {row["printer"]})
    publisher_contracts = [
        contract for contract in contracts
        if clean((contract.get("targetProfile") or {}).get("publisher", {}).get("name")) in aliases
        and contract.get("lifecycleStatus") == "supported"
        and contract.get("supportStatus") == "supported"
        and contract.get("approval", {}).get("status") == "approved"
    ]
    product_tokens = [normalized(value) for value in re.split(r"[,|\n]", row["productId"]) if normalized(value)]
    sku_matches = [
        contract for contract in publisher_contracts
        if normalized(contract.get("targetProfile", {}).get("product", {}).get("sku")) in product_tokens
    ]
    name_matches = [
        contract for contract in publisher_contracts
        if normalized(contract.get("targetProfile", {}).get("product", {}).get("name")) == normalized(row["targetName"])
    ]
    candidates = sku_matches or name_matches
    return sorted(candidates, key=lambda contract: (
        product_tokens.index(normalized(contract["targetProfile"].get("product", {}).get("sku")))
        if normalized(contract["targetProfile"].get("product", {}).get("sku")) in product_tokens else 999,
        normalized(contract["targetProfile"]["id"]),
    ))


def target_entry(row: dict, contract: dict, faces: dict[str, dict]) -> dict:
    target = contract["targetProfile"]
    product = target.get("product") or {}
    face_id = canonical_face_id(contract)
    face = faces[face_id]
    return {
        **row,
        "targetProfileId": target["id"],
        "runtimeId": target["id"],
        "registeredTargetName": product.get("name") or row["targetName"],
        "registeredSku": product.get("sku") or row["productId"],
        "missionFamily": contract["missionFamily"],
        "resultPackageType": contract["resultPackageType"],
        "contractId": contract["contractId"],
        "contractVersion": contract["contractVersion"],
        "canonicalFaceId": face_id,
        "canonicalFaceIdentityCount": len(face["sourceIdentities"]),
        "canonicalFaceRuntimeIds": face["runtimeIds"],
        "canonicalFaceSkus": face["skus"],
        "canonicalFaceProductIds": face["productIds"],
    }


def build_manifest() -> dict:
    contracts = load_contracts()
    faces = face_registry(contracts)
    census = load_census()
    governed = []
    unresolved = []
    for row in census:
        candidates = candidate_contracts(row, contracts)
        if candidates:
            governed.append(target_entry(row, candidates[0], faces))
        else:
            unresolved.append(row)

    by_runtime_id = {entry["runtimeId"]: entry for entry in governed}
    reviewed_entries = []
    reviewed_ids = set()
    reviewed_face_ids = set()
    for seed in REVIEWED:
        target = by_runtime_id.get(seed["targetProfileId"])
        if not target:
            raise RuntimeError(f"reviewed target missing from governed census: {seed['targetProfileId']}")
        reviewed_ids.add(seed["targetProfileId"])
        reviewed_face_ids.add(target["canonicalFaceId"])
        reviewed_entries.append({**target, "founderNumber": seed["founderNumber"]})
    remaining = []
    excluded_face_aliases = []
    seen_faces = set(reviewed_face_ids)
    for entry in governed:
        if entry["runtimeId"] in reviewed_ids:
            continue
        if entry["canonicalFaceId"] in seen_faces:
            excluded_face_aliases.append({
                "censusOrder": entry["censusOrder"],
                "runtimeId": entry["runtimeId"],
                "canonicalFaceId": entry["canonicalFaceId"],
                "reason": "canonical_face_already_represented",
            })
            continue
        seen_faces.add(entry["canonicalFaceId"])
        remaining.append(entry)
        if len(reviewed_entries) + len(remaining) == WALK_SIZE:
            break
    walk = [
        {**entry, "preFounderGate": {"status": "historical_reviewed_record", "llmSemanticReview": "not_applicable"}}
        for entry in reviewed_entries
    ] + [
        {
            **entry,
            "founderNumber": index,
            "preFounderGate": {
                "status": "ready_for_founder" if entry["canonicalFaceId"] in LLM_READY_FACES else "blocked_pending_llm_semantic_review",
                "canonicalFaceResolved": True,
                "allFaceIdentitiesResolved": True,
                "priorFounderOccurrence": False,
                "llmSemanticReview": "cleared" if entry["canonicalFaceId"] in LLM_READY_FACES else "required",
                "readyForFounder": entry["canonicalFaceId"] in LLM_READY_FACES,
            },
        }
        for index, entry in enumerate(remaining, start=len(reviewed_entries) + 1)
    ]
    if len(walk) != WALK_SIZE:
        raise RuntimeError(f"expected {WALK_SIZE} Founder targets, found {len(walk)}")
    return {
        "schemaVersion": "sczn3-founder-walk-v3",
        "walkId": "episode64-mona-lisa-founder-walk-20-unique",
        "walkSize": WALK_SIZE,
        "census": {
            "source": str(CENSUS.relative_to(DOCS)),
            "sheet": CENSUS_SHEET,
            "family": "1. Mona Lisa",
            "total": len(census),
            "governedTargetCount": len(governed),
            "unresolvedRuntimeCount": len(unresolved),
            "orderKey": "Master # ascending",
            "sha256": hashlib.sha256(CENSUS.read_bytes()).hexdigest(),
        },
        "sequencePolicy": "retain reviewed Founder slots, then Master # ascending; resolve every identity to registration assetSha256 canonical face; exclude every unreviewed identity whose canonical face already appeared",
        "canonicalFacePolicy": {
            "authorityField": "components.registration.definition.assetSha256",
            "identityScope": "all canonical contracts sharing the face hash",
            "reviewedFounderSlotsRetained": len(reviewed_entries),
            "remainingCandidateFacesUnique": len({item["canonicalFaceId"] for item in remaining}) == len(remaining),
            "excludedAliasCountBeforeWalkFilled": len(excluded_face_aliases),
        },
        "targets": walk,
        "excludedCanonicalFaceAliases": excluded_face_aliases,
    }


def build_audit(manifest: dict, contracts: list[dict]) -> dict:
    faces = face_registry(contracts)
    prior: dict[str, int] = {}
    targets = []
    for target in manifest["targets"]:
        face_id = target["canonicalFaceId"]
        occurrence = prior.get(face_id)
        targets.append({
            "founderNumber": target["founderNumber"],
            "canonicalFaceId": face_id,
            "printer": target["printer"],
            "targetName": target["targetName"],
            "runtimeId": target["runtimeId"],
            "skuOrProductId": target["productId"],
            "allRuntimeIds": faces[face_id]["runtimeIds"],
            "allSkus": faces[face_id]["skus"],
            "allProductIds": faces[face_id]["productIds"],
            "priorFounderOccurrence": occurrence is not None,
            "priorFounderNumber": occurrence,
            "gateStatus": target.get("preFounderGate", {}).get("status") or "identity_cleared_pending_runtime_and_llm_semantic_gate",
        })
        prior.setdefault(face_id, target["founderNumber"])
    remaining = [item for item in targets if item["founderNumber"] > len(REVIEWED)]
    return {
        "schemaVersion": "sczn3-founder-walk-canonical-face-audit-v1",
        "walkId": manifest["walkId"],
        "canonicalFaceAuthorityField": manifest["canonicalFacePolicy"]["authorityField"],
        "remainingCandidateCount": len(remaining),
        "remainingCanonicalFaceCount": len({item["canonicalFaceId"] for item in remaining}),
        "remainingCandidatesUnique": len({item["canonicalFaceId"] for item in remaining}) == len(remaining),
        "remainingDuplicatesReviewedFaces": [item for item in remaining if item["priorFounderOccurrence"]],
        "historicalReviewedDuplicates": [item for item in targets if item["founderNumber"] <= len(REVIEWED) and item["priorFounderOccurrence"]],
        "targets": targets,
        "excludedCanonicalFaceAliases": manifest["excludedCanonicalFaceAliases"],
    }


def main() -> None:
    payload = build_manifest()
    OUTPUT.write_text(
        "window.SCZN3FounderWalkManifest = Object.freeze("
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ");\n",
        encoding="utf-8",
    )
    audit = build_audit(payload, load_contracts())
    AUDIT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    AUDIT_OUTPUT.write_text(json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(OUTPUT), "audit": str(AUDIT_OUTPUT), "walkSize": len(payload["targets"]), "census": payload["census"]}, indent=2))


if __name__ == "__main__":
    main()
