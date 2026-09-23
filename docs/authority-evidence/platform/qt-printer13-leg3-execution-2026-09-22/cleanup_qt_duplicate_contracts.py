#!/usr/bin/env python3
"""Inventory and surgically remove byte-identical numbered QT contract copies."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path


HERE = Path(__file__).resolve().parent
DOCS = HERE.parents[2]
CONTRACT_DIR = DOCS / "backend/target_execution_contracts/contracts"
MANIFEST_PATH = HERE / "QT_PRINTER13_DUPLICATE_CLEANUP_MANIFEST.json"
NUMBERED = re.compile(r"^(qt_printer13_product_.+_v1) ([234])\.json$")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path: Path) -> str:
    return str(path.relative_to(DOCS))


def canonical_paths() -> list[Path]:
    return sorted(
        path for path in CONTRACT_DIR.glob("qt_printer13_product_*.json")
        if NUMBERED.fullmatch(path.name) is None
    )


def numbered_paths() -> list[Path]:
    return sorted(
        path for path in CONTRACT_DIR.glob("qt_printer13_product_*.json")
        if NUMBERED.fullmatch(path.name) is not None
    )


def inventory() -> dict:
    canonicals = canonical_paths()
    numbered = numbered_paths()
    canonical_by_identity: dict[str, list[Path]] = {}
    for path in canonicals:
        identity = json.loads(path.read_text(encoding="utf-8"))["contractId"]
        canonical_by_identity.setdefault(identity, []).append(path)

    entries = []
    for duplicate in numbered:
        match = NUMBERED.fullmatch(duplicate.name)
        assert match is not None
        canonical = duplicate.with_name(f"{match.group(1)}.json")
        canonical_exists = canonical.is_file()
        duplicate_bytes = duplicate.read_bytes()
        canonical_bytes = canonical.read_bytes() if canonical_exists else b""
        duplicate_record = json.loads(duplicate_bytes)
        canonical_record = json.loads(canonical_bytes) if canonical_exists else {}
        identity = duplicate_record.get("contractId")
        canonical_identity = canonical_record.get("contractId")
        canonical_identity_count = len(canonical_by_identity.get(identity, []))
        byte_identical = canonical_exists and duplicate_bytes == canonical_bytes
        identity_identical = bool(identity) and identity == canonical_identity
        verified = byte_identical and identity_identical and canonical_identity_count == 1
        entries.append({
            "duplicatePath": relative(duplicate),
            "canonicalPath": relative(canonical),
            "numberedSuffix": int(match.group(2)),
            "contractId": identity,
            "targetProfileId": duplicate_record.get("targetProfile", {}).get("id"),
            "missionFamily": duplicate_record.get("missionFamily"),
            "byteLength": len(duplicate_bytes),
            "duplicateSha256": hashlib.sha256(duplicate_bytes).hexdigest(),
            "canonicalSha256": hashlib.sha256(canonical_bytes).hexdigest() if canonical_exists else None,
            "canonicalExists": canonical_exists,
            "byteIdentical": byte_identical,
            "identityIdentical": identity_identical,
            "canonicalFilesForIdentityBeforeDeletion": canonical_identity_count,
            "canonicalFilesForIdentityAfterDeletion": canonical_identity_count,
            "verifiedSafeToDelete": verified,
        })

    all_verified = (
        len(canonicals) == 253
        and len(numbered) == 176
        and len(canonical_by_identity) == 253
        and all(len(paths) == 1 for paths in canonical_by_identity.values())
        and all(entry["verifiedSafeToDelete"] for entry in entries)
    )
    return {
        "schemaVersion": "qt-printer13-duplicate-cleanup-manifest-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "READY_FOR_CLEANUP" if all_verified else "BLOCKED",
        "scope": "Numbered byte-identical QT Printer #13 target execution contract copies only.",
        "contractDirectory": relative(CONTRACT_DIR),
        "before": {
            "canonicalQtContractFiles": len(canonicals),
            "numberedDuplicateFiles": len(numbered),
            "totalQtContractFiles": len(canonicals) + len(numbered),
            "uniqueCanonicalContractIdentities": len(canonical_by_identity),
        },
        "verification": {
            "expectedCanonicalCount": 253,
            "expectedNumberedDuplicateCount": 176,
            "allCanonicalCounterpartsExist": all(entry["canonicalExists"] for entry in entries),
            "allByteIdentical": all(entry["byteIdentical"] for entry in entries),
            "allIdentityIdentical": all(entry["identityIdentical"] for entry in entries),
            "allLeaveExactlyOneCanonicalIdentity": all(
                entry["canonicalFilesForIdentityAfterDeletion"] == 1 for entry in entries
            ),
            "allVerifiedSafeToDelete": all_verified,
        },
        "duplicates": entries,
    }


def write_inventory() -> None:
    manifest = inventory()
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(
        f"QT duplicate inventory: {manifest['status']} "
        f"({manifest['before']['numberedDuplicateFiles']} duplicates)"
    )
    if manifest["status"] != "READY_FOR_CLEANUP":
        raise SystemExit(1)


def cleanup() -> None:
    frozen = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if frozen.get("status") != "READY_FOR_CLEANUP":
        raise SystemExit("cleanup manifest is not ready")
    current = inventory()
    frozen_pairs = [
        (item["duplicatePath"], item["canonicalPath"], item["duplicateSha256"], item["canonicalSha256"])
        for item in frozen["duplicates"]
    ]
    current_pairs = [
        (item["duplicatePath"], item["canonicalPath"], item["duplicateSha256"], item["canonicalSha256"])
        for item in current["duplicates"]
    ]
    if current.get("status") != "READY_FOR_CLEANUP" or current_pairs != frozen_pairs:
        raise SystemExit("filesystem no longer matches frozen cleanup manifest")

    for item in frozen["duplicates"]:
        duplicate = DOCS / item["duplicatePath"]
        canonical = DOCS / item["canonicalPath"]
        if digest(duplicate) != item["duplicateSha256"] or digest(canonical) != item["canonicalSha256"]:
            raise SystemExit(f"hash changed before deletion: {duplicate}")
        duplicate.unlink()

    remaining_canonicals = canonical_paths()
    remaining_numbered = numbered_paths()
    identities = [json.loads(path.read_text(encoding="utf-8"))["contractId"] for path in remaining_canonicals]
    if len(remaining_canonicals) != 253 or remaining_numbered or len(set(identities)) != 253:
        raise SystemExit("post-cleanup QT contract reconciliation failed")

    frozen.update({
        "status": "CLEANED",
        "cleanedAt": datetime.now(timezone.utc).isoformat(),
        "removedNumberedDuplicateFiles": len(frozen["duplicates"]),
        "after": {
            "canonicalQtContractFiles": len(remaining_canonicals),
            "numberedDuplicateFiles": len(remaining_numbered),
            "totalQtContractFiles": len(remaining_canonicals),
            "uniqueCanonicalContractIdentities": len(set(identities)),
        },
        "canonicalContentsModified": False,
        "canonicalFilesRenamed": False,
    })
    MANIFEST_PATH.write_text(json.dumps(frozen, indent=2) + "\n", encoding="utf-8")
    print("QT duplicate cleanup: CLEANED (176 removed; 253 canonical remain)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("inventory", "cleanup"))
    args = parser.parse_args()
    if args.mode == "inventory":
        write_inventory()
    else:
        cleanup()


if __name__ == "__main__":
    main()
