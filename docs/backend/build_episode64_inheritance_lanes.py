#!/usr/bin/env python3
"""Project the frozen 1,993 census into independent mechanical lanes.

Lane A is a lossless LLM input for the 1,561 records that resolve to exactly
one registered canonical face. Lane B is an identity/runtime reconciliation
queue. This script performs no semantic classification and changes no runtime.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DOCS = Path(__file__).resolve().parents[1]
REPOSITORY = DOCS.parent
FLOOR_DIR = DOCS / "authority-evidence/platform/episode64-inheritance-census-input-2026-10-04"
FROZEN_CENSUS = FLOOR_DIR / "SCZN3_EP64_THE13_1993_INHERITANCE_CENSUS.json"
FLOOR_LOCK = FLOOR_DIR / "SCZN3_EP64_THE13_1993_CENSUS_FLOOR_LOCK.json"
UNRECONCILED = FLOOR_DIR / "SCZN3_EP64_THE13_1993_UNRECONCILED.json"
FROZEN_SHA256 = "1397c143fc6a72d8f203636d201864435e51cb1cce65ad077fbb6a164ca3f4e4"

OUTPUT_DIR = DOCS / "authority-evidence/platform/episode64-inheritance-census-lanes-2026-10-04"
LANE_A = OUTPUT_DIR / "SCZN3_EP64_LANE_A_1561_SEMANTIC_INHERITANCE_INPUT.json"
LANE_A_SUMMARY = OUTPUT_DIR / "SCZN3_EP64_LANE_A_1561_ACCOUNTING_SUMMARY.json"
LANE_A_DELIVERY = OUTPUT_DIR / "SCZN3_EP64_LANE_A_1561_DELIVERY_MANIFEST.json"
LANE_B = OUTPUT_DIR / "SCZN3_EP64_LANE_B_432_MECHANICAL_RECONCILIATION_INPUT.json"
LANE_B_SUMMARY = OUTPUT_DIR / "SCZN3_EP64_LANE_B_432_ACCOUNTING_SUMMARY.json"
LANE_MANIFEST = OUTPUT_DIR / "SCZN3_EP64_1993_TWO_LANE_MANIFEST.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def relative(path: Path) -> str:
    return path.relative_to(REPOSITORY).as_posix()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any, *, compact: bool = False) -> None:
    text = (
        json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        if compact
        else json.dumps(payload, ensure_ascii=False, indent=2)
    )
    path.write_text(text + "\n", encoding="utf-8")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    actual_floor_sha = sha256(FROZEN_CENSUS)
    if actual_floor_sha != FROZEN_SHA256:
        raise RuntimeError(f"frozen census drift: {actual_floor_sha}")

    floor = read_json(FROZEN_CENSUS)
    lock = read_json(FLOOR_LOCK)
    unreconciled = read_json(UNRECONCILED)
    faces = floor["faces"]
    all_bindings = floor["runtimeBindings"]
    all_groups = floor["canonicalFaceGroups"]

    lane_a_faces = [
        record for record in faces
        if record["identity"]["canonicalFaceResolution"] == "ONE_REGISTERED_CANONICAL_FACE"
    ]
    lane_b_faces = [
        record for record in faces
        if record["identity"]["canonicalFaceResolution"] != "ONE_REGISTERED_CANONICAL_FACE"
    ]
    if len(lane_a_faces) != 1561 or len(lane_b_faces) != 432:
        raise RuntimeError(f"lane count drift: A={len(lane_a_faces)} B={len(lane_b_faces)}")

    lane_a_face_ids = sorted({record["identity"]["canonicalFaceId"] for record in lane_a_faces})
    lane_a_groups = {face_id: all_groups[face_id] for face_id in lane_a_face_ids}
    direct_lane_a_runtime_ids = sorted({
        runtime_id for record in lane_a_faces for runtime_id in record["identity"]["runtimeIds"]
    })
    alias_expanded_lane_a_runtime_ids = sorted({
        runtime_id for group in lane_a_groups.values() for runtime_id in group["runtimeIds"]
    })
    lane_a_bindings = {
        runtime_id: all_bindings[runtime_id]
        for runtime_id in alias_expanded_lane_a_runtime_ids
    }

    generated_at = datetime.now(timezone.utc).isoformat()
    lane_a = {
        "schemaVersion": "sczn3-episode64-lane-a-semantic-inheritance-input-v1",
        "generatedAt": generated_at,
        "sourceCommit": lock["sourceCommit"],
        "frozenCensus": {"path": relative(FROZEN_CENSUS), "sha256": FROZEN_SHA256},
        "operationBoundary": {
            "semanticClassificationPerformed": False,
            "runtimeModified": False,
            "recordsIncludedByMechanicalRule": "identity.canonicalFaceResolution == ONE_REGISTERED_CANONICAL_FACE",
            "llmOwnsNextSemanticOperation": True,
        },
        "mechanicalClosure": {"input": 1561, "delivered": len(lane_a_faces), "unaccounted": 0, "status": "PASS"},
        "globalAccountingInvariant": {"laneA": 1561, "laneB": 432, "total": 1993, "status": "PASS"},
        "globalAuthorityReferences": floor["globalAuthorityReferences"],
        "faces": lane_a_faces,
        "runtimeBindings": lane_a_bindings,
        "canonicalFaceGroups": lane_a_groups,
        "bindingScope": {
            "directRuntimeBindingIds": direct_lane_a_runtime_ids,
            "canonicalFaceAliasExpandedRuntimeBindingIds": alias_expanded_lane_a_runtime_ids,
            "note": "Alias expansion preserves every stored runtime identity sharing a Lane A canonical face; it does not add census records or semantic conclusions.",
        },
    }
    write_json(LANE_A, lane_a, compact=True)

    lane_a_summary = {
        "schemaVersion": "sczn3-episode64-lane-a-accounting-v1",
        "generatedAt": generated_at,
        "frozenCensusSha256": FROZEN_SHA256,
        "mechanicalClosure": lane_a["mechanicalClosure"],
        "globalAccountingInvariant": lane_a["globalAccountingInvariant"],
        "canonicalFaceCount": len(lane_a_face_ids),
        "directRuntimeBindingCount": len(direct_lane_a_runtime_ids),
        "aliasExpandedRuntimeBindingCount": len(alias_expanded_lane_a_runtime_ids),
        "printerCounts": dict(sorted(Counter(
            record["identity"]["printer"] for record in lane_a_faces
        ).items())),
        "smartFamilyCounts": dict(sorted(Counter(
            record["existingUnderstanding"]["smartFamily"] for record in lane_a_faces
        ).items())),
        "semanticClassificationPerformed": False,
        "runtimeModified": False,
    }
    write_json(LANE_A_SUMMARY, lane_a_summary)

    lane_a_delivery = {
        "schemaVersion": "sczn3-episode64-lane-a-delivery-v1",
        "sourceCommit": lock["sourceCommit"],
        "frozenCensusSha256": FROZEN_SHA256,
        "mechanicalClosure": lane_a["mechanicalClosure"],
        "artifacts": [
            {"path": relative(path), "bytes": path.stat().st_size, "sha256": sha256(path)}
            for path in (LANE_A, LANE_A_SUMMARY)
        ],
    }
    write_json(LANE_A_DELIVERY, lane_a_delivery)

    lane_b_face_keys = {record["identity"]["censusFaceKey"] for record in lane_b_faces}
    issue_by_key = {record["censusFaceKey"]: record for record in unreconciled["censusRecords"]}
    if lane_b_face_keys != set(issue_by_key):
        raise RuntimeError("Lane B face keys do not match the frozen unreconciled ledger")
    lane_b_direct_runtime_ids = sorted({
        runtime_id for record in lane_b_faces for runtime_id in record["identity"]["runtimeIds"]
    })
    lane_b_issue_runtime_ids = sorted(set(
        lane_b_direct_runtime_ids + unreconciled["runtimeBindingsNotJoinedToAuthoritativeCensus"]
    ))
    lane_b_bindings = {
        runtime_id: all_bindings[runtime_id]
        for runtime_id in lane_b_issue_runtime_ids
    }
    lane_b = {
        "schemaVersion": "sczn3-episode64-lane-b-mechanical-reconciliation-input-v1",
        "generatedAt": generated_at,
        "sourceCommit": lock["sourceCommit"],
        "frozenCensus": {"path": relative(FROZEN_CENSUS), "sha256": FROZEN_SHA256},
        "operationBoundary": {
            "identityAndRuntimeReconciliationOnly": True,
            "semanticAnswersMayNotBeInvented": True,
            "runtimeModified": False,
            "laneABlocked": False,
        },
        "mechanicalClosure": {"input": 432, "queued": len(lane_b_faces), "unaccounted": 0, "status": "PASS"},
        "globalAccountingInvariant": {"laneA": 1561, "laneB": 432, "total": 1993, "status": "PASS"},
        "faces": lane_b_faces,
        "reconciliationLedger": {
            "censusRecords": unreconciled["censusRecords"],
            "contractFileVariantConflicts": unreconciled["contractFileVariantConflicts"],
            "runtimeBindingsNotJoinedToAuthoritativeCensus": unreconciled["runtimeBindingsNotJoinedToAuthoritativeCensus"],
        },
        "runtimeBindings": lane_b_bindings,
        "workstreams": {
            "multipleRegisteredFaceReferences": {
                "input": 55,
                "records": [record for record in unreconciled["censusRecords"] if "MULTIPLE_REGISTERED_CANONICAL_FACES" in record["reasons"]],
                "allowedResolutionEvidence": ["publisher package/constituent identity", "registered asset hash", "stored product/SKU identity", "existing authority manifests"],
            },
            "noRegisteredRuntimeBinding": {
                "input": 377,
                "records": [record for record in unreconciled["censusRecords"] if "NO_REGISTERED_RUNTIME_BINDING" in record["reasons"]],
                "allowedResolutionEvidence": ["existing active/quarantined/historical contract identity", "exact publisher product/SKU identity", "registered asset hash", "existing authority manifests"],
            },
            "contractVariantConflicts": {
                "input": 44,
                "records": unreconciled["contractFileVariantConflicts"],
                "allowedResolutionEvidence": ["canonical runtime loader path", "Git history", "contract fingerprint", "approval/effective authority"],
            },
            "unjoinedRuntimeBindings": {
                "input": 64,
                "runtimeIds": unreconciled["runtimeBindingsNotJoinedToAuthoritativeCensus"],
                "allowedResolutionEvidence": ["exact census identity", "publisher product/SKU identity", "registered asset hash", "existing authority manifests"],
            },
        },
    }
    write_json(LANE_B, lane_b, compact=True)

    lane_b_summary = {
        "schemaVersion": "sczn3-episode64-lane-b-accounting-v1",
        "generatedAt": generated_at,
        "frozenCensusSha256": FROZEN_SHA256,
        "mechanicalClosure": lane_b["mechanicalClosure"],
        "globalAccountingInvariant": lane_b["globalAccountingInvariant"],
        "multipleRegisteredFaceReferences": 55,
        "noRegisteredRuntimeBinding": 377,
        "contractVariantConflicts": 44,
        "unjoinedRuntimeBindings": 64,
        "note": "Issue populations overlap by design and are not added together as a census total.",
        "laneABlocked": False,
        "semanticClassificationPerformed": False,
        "runtimeModified": False,
    }
    write_json(LANE_B_SUMMARY, lane_b_summary)

    lane_manifest = {
        "schemaVersion": "sczn3-episode64-two-lane-manifest-v1",
        "generatedAt": generated_at,
        "frozenFloor": {"path": relative(FLOOR_LOCK), "censusSha256": FROZEN_SHA256},
        "globalAccountingInvariant": {"laneA": 1561, "laneB": 432, "total": 1993, "status": "PASS"},
        "laneA": {
            "status": "DELIVERED_TO_LLM_INPUT",
            "input": relative(LANE_A),
            "summary": relative(LANE_A_SUMMARY),
            "deliveryManifest": relative(LANE_A_DELIVERY),
        },
        "laneB": {
            "status": "OPEN_MECHANICAL_RECONCILIATION",
            "input": relative(LANE_B),
            "summary": relative(LANE_B_SUMMARY),
            "blocksLaneA": False,
        },
        "productionTargetImplementationStarted": False,
    }
    write_json(LANE_MANIFEST, lane_manifest)

    print(json.dumps({
        "status": "PASS",
        "laneA": {"input": 1561, "delivered": len(lane_a_faces), "unaccounted": 0, "sha256": sha256(LANE_A)},
        "laneB": {"input": 432, "queued": len(lane_b_faces), "unaccounted": 0, "sha256": sha256(LANE_B)},
        "global": {"laneAPlusLaneB": len(lane_a_faces) + len(lane_b_faces), "expected": 1993},
    }, indent=2))


if __name__ == "__main__":
    main()
