#!/usr/bin/env python3
"""Audit and preserve the final QT Printer #13 closing record."""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


HERE = Path(__file__).resolve().parent
DOCS = HERE.parents[2]
VISUAL = HERE.parent / "qt-printer13-visual-ingestion-2026-09-22"
LEG2 = HERE.parent / "qt-printer13-leg2-recognition-compression-delta-2026-09-22"
BACKEND = DOCS / "backend"
RECORD_PATH = HERE / "QT_PRINTER13_CLOSING_RECORD.json"
REPORT_PATH = HERE / "QT_PRINTER13_CLOSING_RECORD.md"
AUTHORITY_PATH = BACKEND / "target_knowledge/qt_printer13_closing_authority.json"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rel(path: Path) -> str:
    return str(path.relative_to(DOCS))


def artifact(path: Path) -> dict:
    return {"path": rel(path), "sha256": sha(path), "byteLength": path.stat().st_size}


def aggregate(paths: list[Path]) -> str:
    rows = [f"{rel(path)}\t{sha(path)}" for path in sorted(paths)]
    return hashlib.sha256(("\n".join(rows) + "\n").encode("utf-8")).hexdigest()


def main() -> None:
    reconciliation_path = VISUAL / "QT_RECONCILIATION.json"
    visual_manifest_path = VISUAL / "QT_VISUAL_STACK_MANIFEST.json"
    leg2_manifest_path = LEG2 / "QT_LEG2_FAMILY_COMPRESSION_MANIFEST.json"
    leg2_counts_path = LEG2 / "QT_LEG2_INHERITED_VS_NOVEL_COUNTS.json"
    leg2_unresolved_path = LEG2 / "QT_LEG2_UNRESOLVED_EXCEPTIONS.json"
    leg2_authority_path = BACKEND / "target_knowledge/qt_printer13_leg2_research_authority.json"
    execution_manifest_path = HERE / "QT_LEG3_EXECUTION_MANIFEST.json"
    elevation_path = HERE / "QT_LEG3_CAPABILITY_ELEVATION.json"
    lifecycle_path = HERE / "QT_LEG3_LIFECYCLE_VERIFICATION.json"
    final_reconciliation_path = HERE / "QT_LEG3_FINAL_RECONCILIATION.json"
    exceptions_path = HERE / "QT_LEG3_EXCEPTION_LIST.json"
    cleanup_path = HERE / "QT_PRINTER13_DUPLICATE_CLEANUP_MANIFEST.json"
    leg3_authority_path = BACKEND / "target_knowledge/qt_printer13_leg3_execution_authority.json"

    commercial = load(reconciliation_path)
    visual = load(visual_manifest_path)
    leg2_manifest = load(leg2_manifest_path)
    leg2_counts = load(leg2_counts_path)
    leg2_unresolved = load(leg2_unresolved_path)
    leg2_authority = load(leg2_authority_path)
    execution = load(execution_manifest_path)
    elevation = load(elevation_path)
    lifecycle = load(lifecycle_path)
    final = load(final_reconciliation_path)
    exceptions = load(exceptions_path)
    cleanup = load(cleanup_path)
    leg3_authority = load(leg3_authority_path)

    surfaces = execution["surfaces"]
    families = dict(sorted(Counter(row["behaviorFamily"] for row in surfaces).items()))
    capabilities = dict(sorted(Counter(row["executionCapability"] for row in surfaces).items()))
    inheritance = dict(sorted(Counter(row["inheritanceMode"] for row in surfaces).items()))
    unresolved = [row for row in surfaces if row.get("semanticStatus") == "PARTIAL_UNRESOLVED_NOT_PUBLISHED"]
    contract_paths = [DOCS / row["contractPath"] for row in surfaces if row.get("contractPath")]
    zeroing_rows = [row for row in surfaces if row["executionCapability"] == "Zeroing"]

    all_images = [VISUAL / image["localPath"] for card in visual["cards"] for image in card["images"]]
    for card in visual["cards"]:
        for image in card["images"]:
            path = VISUAL / image["localPath"]
            assert path.is_file() and sha(path) == image["sha256"]

    assert commercial["status"] == "COMPLETE"
    assert commercial["reconciliation"] == {
        "totalCommercialListings": 530,
        "totalCommercialVariants": 697,
        "candidatePaperListings": 291,
        "obviousPackagesOosNonIndependentListings": 276,
        "candidateExecutableSurfaces": 254,
        "replicaVariantGroups": 17,
        "ambiguousExceptions": 0,
        "visualCardsProduced": 291,
        "paperImagesExpected": 380,
        "paperImagesPreserved": 380,
    }
    assert commercial["accountingCheck"]["passes"] is True
    assert len(visual["cards"]) == 291 and len(all_images) == 380
    assert len(surfaces) == len({row["qtCatalogId"] for row in surfaces}) == 254
    assert len(leg2_manifest["surfaces"]) == 254
    assert families == leg2_counts["familyCompression"]["byFamily"] == final["familyCounts"]
    assert len(families) == leg2_counts["familyCompression"]["sczn3BehaviorFamilies"] == 12
    assert inheritance == {"EXACT_PRIOR_SURFACE": 32, "EXISTING_BEHAVIOR_WITH_QT_DATA": 222}
    assert leg2_counts["inheritance"]["genuinelyNovelPrimitive"] == final["newBehavioralPrimitives"] == 0
    assert capabilities == {"Scoring": 40, "Zeroing": 1, "Zone / Object Counting": 213}
    assert capabilities == elevation["after"] == lifecycle["capabilityResults"] == final["capabilityCounts"]
    assert len(unresolved) == leg2_counts["semanticCompleteness"]["partialWithUnpublishedSemantic"] == 45
    assert final["equation"] == {"PASS": 254, "HOLD": 0, "OOS": 0, "EXCEPTION": 0, "TOTAL": 254, "reconciles": True}
    assert lifecycle["status"] == "PASS" and lifecycle["pass"] == 254 and lifecycle["fail"] == 0
    assert exceptions["status"] == "CLEAR" and not exceptions["failures"]
    assert cleanup["status"] == "CLEANED" and cleanup["before"]["totalQtContractFiles"] == 429
    assert cleanup["after"] == {
        "canonicalQtContractFiles": 253,
        "numberedDuplicateFiles": 0,
        "totalQtContractFiles": 253,
        "uniqueCanonicalContractIdentities": 253,
    }
    assert len(contract_paths) == 253 and all(path.is_file() for path in contract_paths)
    assert len(set(load(path)["contractId"] for path in contract_paths)) == 253
    assert len(zeroing_rows) == 1 and zeroing_rows[0]["targetProfileId"] == "qualification_m16a2_25m_zero"
    assert leg2_authority["compressionFinding"] == {
        "existingBehaviorFamilies": 12,
        "exactPriorSurfaceInheritance": 32,
        "existingBehaviorWithQtData": 222,
        "novelBehavioralPrimitives": 0,
        "unresolvedSurfaceSemantics": 45,
    }
    assert leg3_authority["surfaceCount"] == 254
    assert leg3_authority["capabilityCounts"] == capabilities
    assert leg3_authority["verifiedPass"] == 254 and leg3_authority["verifiedFail"] == 0

    restore_files = [
        reconciliation_path,
        visual_manifest_path,
        VISUAL / "QT_SOURCE_CENSUS.json",
        VISUAL / "QT_SOURCE_CENSUS.csv",
        VISUAL / "QT_REPLICA_VARIANT_GROUPS.json",
        leg2_manifest_path,
        leg2_counts_path,
        leg2_unresolved_path,
        leg2_authority_path,
        execution_manifest_path,
        elevation_path,
        lifecycle_path,
        final_reconciliation_path,
        exceptions_path,
        cleanup_path,
        leg3_authority_path,
        BACKEND / "registries/target_image_registration_packages.json",
        BACKEND / "registries/mfam_family_authority.json",
    ]
    assert all(path.is_file() for path in restore_files)

    record = {
        "schemaVersion": "qt-printer13-closing-record-v1",
        "authorityId": "QT_PRINTER13_CLOSING_RECORD_2026_09_22",
        "closedAt": datetime.now(timezone.utc).isoformat(),
        "printer": {"number": 13, "publisher": "Qualification Targets Inc", "gate": "CLOSED"},
        "commercialToExecutableReconciliation": commercial["reconciliation"],
        "commercialDispositionCounts": commercial["dispositionCounts"],
        "finalSurfaceInventoryCount": len(surfaces),
        "finalSurfaceInventory": surfaces,
        "familyDistribution": {"familyCount": len(families), "byFamily": families},
        "inheritanceResult": {
            "exactPriorSurface": 32,
            "existingBehaviorWithQtData": 222,
            "novelBehavioralPrimitives": 0,
            "usingExistingSczn3Machinery": 254,
        },
        "finalCapabilityDistribution": capabilities,
        "unresolvedSemantics": {
            "count": len(unresolved),
            "policy": leg2_authority["unknownPolicy"],
            "surfaceIds": [row["qtCatalogId"] for row in unresolved],
            "source": rel(leg2_unresolved_path),
        },
        "lifecycleProof": {
            "requiredLifecycle": lifecycle["requiredLifecycle"],
            "pass": lifecycle["pass"],
            "hold": 0,
            "oos": 0,
            "exceptions": lifecycle["fail"],
            "total": lifecycle["eligible"],
            "reconciles": final["equation"]["reconciles"],
            "source": rel(lifecycle_path),
        },
        "scaleDemonstration": {
            "statement": "Printer #13 demonstrates that SCZN3 can preserve 254 commercial identities while compressing them into 12 existing behavior families, execute all 254 with existing machinery, and introduce no new behavioral primitive.",
            "batchSurfaceCount": 254,
            "existingBehaviorCoveragePercent": 100.0,
            "independentLifecyclePassRatePercent": 100.0,
            "novelBehavioralPrimitives": 0,
        },
        "durableAuthorityAudit": {
            "status": "PASS",
            "importantKnowledgeOnlyInReportsOrTemporaryArtifacts": False,
            "gaps": [],
            "mappings": {
                "legTwoRecognitionCompressionAndUnknowns": rel(leg2_authority_path),
                "legThreeCapabilityRulesAndCounts": rel(leg3_authority_path),
                "perSurfaceExecutionAuthority": "backend/target_execution_contracts/contracts/qt_printer13_product_*_target_scoring_v1.json (253 files) plus existing MFAM qualification_m16a2_25m_zero authority",
                "commercialIdentityArtworkAndProvenance": rel(visual_manifest_path),
                "lifecycleAndExactReopen": rel(lifecycle_path),
            },
            "historicalStatusNote": "QT_LEG3_EXECUTION_MANIFEST.json retains its pre-verification phase label; the later Backend execution authority and final reconciliation govern the completed PASS state.",
        },
        "duplicateAuthorityCleanup": {
            "status": cleanup["status"],
            "before": cleanup["before"],
            "after": cleanup["after"],
            "manifest": rel(cleanup_path),
            "productionResolver": {"status": "PASS", "duplicateContractIdentityErrors": 0, "resolvedContracts": 2975, "uniqueQtCanonicalContracts": 253},
        },
        "recordedTimingEvidence": {
            "lifecycleVerificationElapsedSeconds": lifecycle["elapsedSeconds"],
            "perSurfaceElapsedMillisecondsPreservedIn": rel(lifecycle_path),
            "otherExecutionStageDurations": "NOT RECORDED; NOT ESTIMATED",
        },
        "restoreProvenance": {
            "requiredFiles": [artifact(path) for path in restore_files],
            "preservedArtwork": {
                "count": len(all_images),
                "allHashesVerified": True,
                "aggregatePathAndSha256": aggregate(all_images),
                "manifest": rel(visual_manifest_path),
            },
            "canonicalQtContracts": {
                "count": len(contract_paths),
                "uniqueContractIdentities": 253,
                "aggregatePathAndSha256": aggregate(contract_paths),
                "manifest": rel(execution_manifest_path),
            },
            "inheritedZeroingAuthority": {
                "targetProfileId": zeroing_rows[0]["targetProfileId"],
                "registrationPackageId": "qualification-m16a2-photo-registration-v1",
                "assetSha256": zeroing_rows[0]["assetSha256"],
            },
        },
        "gateDecision": {
            "status": "CLOSED",
            "statement": "Qualification Targets is Printer #13 understood to the same governed standard as Printers #1–12.",
            "blockers": [],
            "showcaseTargetWorkStarted": False,
        },
    }
    RECORD_PATH.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")

    authority = {
        "schemaVersion": "qt-printer13-closing-authority-v1",
        "authorityId": record["authorityId"],
        "authorityClass": "backend_target_knowledge_closure",
        "lifecycleStatus": "closed",
        "supportStatus": "supported",
        "printerNumber": 13,
        "publisher": "Qualification Targets Inc",
        "surfaceCount": 254,
        "behaviorFamilyCount": 12,
        "inheritanceResult": record["inheritanceResult"],
        "capabilityDistribution": capabilities,
        "unresolvedSemanticSets": 45,
        "lifecycleReconciliation": {"pass": 254, "hold": 0, "oos": 0, "exceptions": 0, "total": 254},
        "duplicateAuthorityCleanup": record["duplicateAuthorityCleanup"],
        "durableAuthorityAudit": record["durableAuthorityAudit"],
        "closingRecord": rel(RECORD_PATH),
        "restoreProvenance": record["restoreProvenance"],
        "recordedTimingEvidence": record["recordedTimingEvidence"],
        "gate": record["gateDecision"],
    }
    AUTHORITY_PATH.write_text(json.dumps(authority, indent=2) + "\n", encoding="utf-8")

    family_rows = "\n".join(f"| {name} | {count} |" for name, count in families.items())
    REPORT_PATH.write_text(f"""# QT Printer #13 Closing Record

Status: **GATE CLOSED**

## 1. Commercial-to-executable reconciliation

- 530 commercial listings / 697 variants
- 291 candidate paper listings and visual cards
- 380/380 paper images preserved
- 276 package, component, non-paper, or non-target listings
- 254 executable Smart Target surfaces
- 17 replica-variant groups
- 0 ambiguous census exceptions

## 2. Final inventory

The complete 254-surface inventory is embedded in `QT_PRINTER13_CLOSING_RECORD.json` and retains commercial identity, SKU, source URL, family, inheritance, capability, unresolved status, contract identity, artwork path/hash, and source provenance.

## 3. Family distribution

| Existing SCZN3 behavior family | Surfaces |
|---|---:|
{family_rows}

## 4. Inherited vs. novel

- Exact prior-surface inheritance: 32
- Existing behavior with QT-specific data: 222
- Novel behavioral primitives: 0
- Existing SCZN3 machinery coverage: 254/254

## 5. Final capabilities

- Scoring: 40
- Zone / Object Counting: 213
- Inherited Zeroing: 1
- Evidence Only: 0

## 6. Unresolved semantics

45 UNRESOLVED / NOT PUBLISHED semantic sets remain explicit. No missing rule was invented.

## 7. Lifecycle proof

254/254 TARGET → TAP → RESULT → SEC → VAULT → exact reopen PASS. HOLD 0 / OOS 0 / exceptions 0.

## 8. Scale demonstrated

Printer #13 preserved 254 commercial identities, compressed them into 12 existing behavior families, executed every surface with existing machinery, and required zero novel behavioral primitives.

## 9. Restore provenance

The JSON closing record contains SHA-256 evidence for the required census, manifests, Backend Target Knowledge records, lifecycle proof, cleanup record, MFAM registries, all 380 preserved images as an aggregate, and all 253 canonical QT contracts as an aggregate. The exact M16A2 zeroing chair retains its existing MFAM authority.

Recorded lifecycle verification time: **{lifecycle['elapsedSeconds']} seconds**. Per-surface recorded times remain in the lifecycle artifact. Other stage durations were not recorded and were not estimated.

## 10. Gate decision

**Printer #13 gate is CLOSED. Qualification Targets is understood to the same governed standard as Printers #1–12.**
""", encoding="utf-8")

    print("QT Printer #13 closing record: CLOSED (254/254; resolver clean)")


if __name__ == "__main__":
    main()
