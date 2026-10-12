#!/usr/bin/env python3
"""Build the Episode 64 platform-wide Founder-acceptance reconciliation.

The illustrated/staging workbook is a manifest, never authority.  This builder
uses only durable Founder records and the existing 1,993-face census.  Unknown
is deliberately sticky: a spreadsheet label or machine PASS cannot promote a
face to Founder approved.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLATFORM = ROOT / "docs/authority-evidence/platform"
CENSUS_PATH = PLATFORM / "episode64-inheritance-census-input-2026-10-04/SCZN3_EP64_THE13_1993_INHERITANCE_CENSUS.json"
OUT_DIR = PLATFORM / "episode64-platform-founder-acceptance-reconciliation-2026-10-11"
REGISTRY_PATH = ROOT / "docs/backend/registries/episode64_platform_founder_acceptance_registry.json"

APPROVED = "FOUNDER_APPROVED"
APPROVED_INHERITED = "FOUNDER_APPROVED_INHERITED"
OOS = "FOUNDER_OOS"
HOLD = "FOUNDER_HOLD"
UNVERIFIED = "UNVERIFIED"

THE13 = [
    ("American Target Company", 251, "A23/3"),
    ("Speedwell Targets", 687, "AR 5/10"),
    ("Baker Targets", 428, "B27E"),
    ("Birchwood Casey", 501, "35770"),
    ("Highwild", 681, "Two Packs"),
    ("Splatterburst Targets", 817, "12 x 18 Silhouette"),
    ("Champion / Primos", 149, "Dartboard"),
    ("EZ Aim / Allen", 156, "9 Target Fun Pack"),
    ("U.S. Target", 246, "Poker"),
    ("Baker Targets", 92, "Googly Ghosts"),
    ("GunFun", 172, "Bowling Pins"),
    ("The National Target Company", 218, "Javelina"),
    ("Thompson Target", 231, "Bo-Bo"),
]


def load(path: Path):
    return json.loads(path.read_text())


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def identity_runtime_ids(face: dict) -> set[str]:
    return set(face["identity"].get("runtimeIds") or [])


def empty_record(face: dict) -> dict:
    ident = face["identity"]
    execution = face["executionState"]
    authority = face["authority"]
    return {
        "censusFaceKey": ident["censusFaceKey"],
        "masterNumber": ident["masterNumber"],
        "canonicalFaceId": ident["canonicalFaceId"],
        "printer": ident["printer"],
        "targetName": ident["targetName"],
        "runtimeIds": ident.get("runtimeIds") or [],
        "sourceIdentityIds": [ident.get("inventoryRecordIdsOrQtIdentityId")] if ident.get("inventoryRecordIdsOrQtIdentityId") else [],
        "founderStatus": UNVERIFIED,
        "currentScope": "ACTIVE",
        "founderEvidence": [],
        "approvalInheritance": None,
        "librarySelection": {
            "displayStatus": "FOUNDER STATUS UNVERIFIED",
            "eligibleForFounderReview": True,
            "excludeReason": None,
        },
        "backend": {
            "contractLifecycleStatuses": execution.get("contractLifecycleStatuses") or [],
            "contractSupportStatuses": execution.get("contractSupportStatuses") or [],
            "geometryStatuses": execution.get("geometryStatuses") or [],
            "scoringStatuses": execution.get("scoringStatuses") or [],
            "authorityVersions": authority.get("contractAuthorityVersions") or [],
        },
        "artwork": {
            "source": authority.get("workbookImage"),
            "sha256": authority.get("workbookAssetSha256"),
            "registeredAssetShaConsistency": authority.get("registeredAssetShaConsistency"),
        },
        "secEvidence": [],
    }


def apply(record: dict, status: str, source: Path, detail: str, inheritance: dict | None = None):
    priority = {UNVERIFIED: 0, APPROVED_INHERITED: 1, APPROVED: 2, HOLD: 3, OOS: 4}
    record["founderEvidence"].append({"source": rel(source), "detail": detail})
    if priority[status] >= priority[record["founderStatus"]]:
        record["founderStatus"] = status
        if inheritance:
            record["approvalInheritance"] = inheritance


def match(records: list[dict], *, runtime_ids=(), identity_ids=(), master=None, canonical=None, name=None) -> list[dict]:
    """Match by the strongest supplied identity key, never by a broad OR join."""
    runtime_ids = set(runtime_ids or [])
    identity_ids = set(identity_ids or [])
    if master is not None:
        return [r for r in records if r["masterNumber"] == master]
    if canonical:
        return [r for r in records if r["canonicalFaceId"] == canonical]
    if runtime_ids:
        found = [r for r in records if runtime_ids.intersection(r["runtimeIds"])]
        if found:
            return found
    if identity_ids:
        return [r for r in records if identity_ids.intersection(r["sourceIdentityIds"])]
    if name:
        return [r for r in records if r["targetName"].strip().casefold() == name.strip().casefold()]
    return []


def apply_ledger(records: list[dict], path: Path):
    data = load(path)
    for e in data.get("entries", []):
        decision = str(e.get("decision", "")).upper()
        if decision != "APPROVED":
            continue
        ids = [e.get("runtimeId")] if e.get("runtimeId") else []
        targets = match(records, runtime_ids=ids, canonical=e.get("canonicalFaceId"), name=e.get("targetIdentity") or e.get("targetName"))
        for r in targets:
            apply(r, APPROVED, path, f"Explicit Founder decision APPROVED for {e.get('runtimeId') or e.get('targetIdentity') or e.get('targetName')}")
            lifecycle = e.get("lifecycle") or {}
            if lifecycle:
                r["secEvidence"].append({"source": rel(path), "lifecycle": lifecycle})
        if e.get("currentScope") == "OOS":
            for r in targets:
                apply(r, OOS, path, "Historical approval preserved; current scope is OOS")


def apply_standalone_approvals(records: list[dict]):
    patterns = [
        "episode64-founder-walk-2026-10-02/FOUNDER_*_FOUNDER_APPROVAL.json",
        "episode64-*-founder-approval-2026-10-*/FOUNDER_*_FOUNDER_APPROVAL.json",
        "episode64-reconciled-ten-founder-acceptance-2026-10-10/FOUNDER_*_RECONCILED_APPROVAL.json",
    ]
    paths = sorted({p for pat in patterns for p in PLATFORM.glob(pat)})
    for path in paths:
        data = load(path)
        if str(data.get("decision", "")).upper() != "APPROVED":
            continue
        t = data.get("target") or {}
        ids = [t.get("runtimeId") or data.get("runtimeId")]
        ids += [x.get("runtimeId") for x in data.get("allApprovedFaceIdentities", []) if x.get("runtimeId")]
        for r in match(records, runtime_ids=ids, canonical=data.get("canonicalFaceId"), name=t.get("name") or data.get("targetName")):
            apply(r, APPROVED, path, "Explicit standalone Founder approval")
            proof = data.get("founderProof") or data.get("acceptedSessionDurability")
            if proof:
                r["secEvidence"].append({"source": rel(path), "proof": proof})


def apply_qt_checkpoint(records: list[dict]):
    checkpoint = PLATFORM / "qt-printer13-founder-accepted-physical-authority-200-51-3-2026-09-29/QT_PRINTER13_FOUNDER_ACCEPTANCE_CHECKPOINT.json"
    manifest = PLATFORM / "qt-printer13-physical-authority-execution-2026-09-28/QT_PHYSICAL_AUTHORITY_BATCH_MANIFEST.json"
    cp = load(checkpoint)
    if cp.get("founderAcceptance") != "ACCEPTED":
        return
    holds = {x["target"].strip().casefold() for x in cp.get("holds", [])}
    for target in load(manifest)["targets"]:
        product_name = target["productName"].strip().casefold()
        is_hold = any(product_name == h or product_name.startswith(h + " ") for h in holds)
        result = "HOLD" if is_hold else ("N/A" if target.get("result") == "N/A" else "REPAIR→PASS")
        for r in match(records, runtime_ids=[target["targetProfileId"]], identity_ids=[target["qtCatalogId"]]):
            if result == "HOLD":
                apply(r, HOLD, checkpoint, f"QT accepted checkpoint preserves target HOLD: {target.get('reason')}")
            else:
                apply(r, APPROVED_INHERITED, checkpoint, f"QT Founder-accepted 200/51/3 checkpoint; manifest result {result}", {
                    "type": "QT_FOUNDER_ACCEPTED_CHECKPOINT",
                    "manifest": rel(manifest),
                    "targetProfileId": target["targetProfileId"],
                    "manifestResult": result,
                })


def apply_bowling_inheritance(records: list[dict]):
    path = PLATFORM / "episode64-ugo-recovery-44-2026-10-07/SCZN3_EP64_BOWLING_PINS_FOUNDER_2_OF_2_APPROVAL.json"
    data = load(path)
    for lock in data.get("locks", []):
        for r in match(records, runtime_ids=[lock["runtimeId"]]):
            apply(r, APPROVED_INHERITED if lock["runtimeId"] != data["founderDecision"]["representativeReviewed"] else APPROVED, path, "Founder 2/2 approval lock with independent N/N proof", {
                "type": "REPRESENTATIVE_HOMOGENEITY_LOCK",
                "contractFingerprint": lock.get("contractFingerprint"),
                "independentNn": lock.get("independentNn"),
            })


def apply_oos(records: list[dict]):
    oos_dir = PLATFORM / "episode64-lane-a-bale-1-founder-oos-2026-10-04"
    for path in sorted(oos_dir.glob("SCZN3_EP64_FOUNDER_OOS_*.json")):
        data = load(path); rec = data.get("record") or {}
        for r in match(records, runtime_ids=rec.get("runtimeIds") or [], master=rec.get("masterNumber"), canonical=rec.get("canonicalFaceId"), name=rec.get("targetName")):
            apply(r, OOS, path, f"Founder OOS: {rec.get('oosReason') or data.get('reason') or data.get('status')}")
    alien = PLATFORM / "episode64-alien-final-founder-repair-2026-10-06/SCZN3_EP64_FOUNDER_OOS_ALIEN_GAME_TARGET.json"
    data = load(alien); t = data["target"]
    for r in match(records, runtime_ids=[t["runtimeTargetId"]], master=t.get("masterNumber"), name=t.get("targetName")):
        apply(r, OOS, alien, data["decision"])


def finalize(records: list[dict]):
    for r in records:
        s = r["founderStatus"]
        if s == OOS:
            r["currentScope"] = "OOS"
            r["librarySelection"] = {"displayStatus": "OUT OF SCOPE", "eligibleForFounderReview": False, "excludeReason": "FOUNDER_OOS"}
        elif s == HOLD:
            r["currentScope"] = "HOLD"
            r["librarySelection"] = {"displayStatus": "FOUNDER HOLD", "eligibleForFounderReview": False, "excludeReason": "FOUNDER_HOLD"}
        elif s in (APPROVED, APPROVED_INHERITED):
            r["librarySelection"] = {"displayStatus": "FOUNDER APPROVED", "eligibleForFounderReview": False, "excludeReason": s}


def the13_matrix(records: list[dict]) -> list[dict]:
    rows = []
    for printer, master, label in THE13:
        matches = [r for r in records if r["masterNumber"] == master]
        if not matches:
            rows.append({"printer": printer, "masterNumber": master, "manifestName": label, "status": "UNVERIFIED", "recommendation": "HOLD", "reason": "Candidate not found in authoritative census"})
            continue
        r = matches[0]
        package = master == 156 or "pack" in r["targetName"].casefold()
        eligible = r["founderStatus"] == UNVERIFIED and not package
        if r["founderStatus"] in (APPROVED, APPROVED_INHERITED):
            rec, reason = "REPLACE RECOMMENDED", "Already Founder approved"
        elif r["founderStatus"] == OOS:
            rec, reason = "REPLACE RECOMMENDED", "Founder OOS"
        elif r["founderStatus"] == HOLD:
            rec, reason = "HOLD", "Founder hold"
        elif package:
            rec, reason = "REPLACE RECOMMENDED", "Commercial/package identity is not an individual executable face"
        else:
            rec, reason = "HOLD", "Live FA is unverified and deterministic #4 provenance remains unproven"
        rows.append({
            "printer": printer, "masterNumber": master, "manifestName": label,
            "canonicalTargetName": r["targetName"], "canonicalFaceId": r["canonicalFaceId"],
            "runtimeIds": r["runtimeIds"], "founderStatus": r["founderStatus"],
            "eligibleNow": eligible, "recommendation": rec, "reason": reason,
            "geometryStatuses": r["backend"]["geometryStatuses"],
            "scoringStatuses": r["backend"]["scoringStatuses"],
        })
    return rows


def main():
    census = load(CENSUS_PATH)
    records = [empty_record(face) for face in census["faces"]]
    apply_qt_checkpoint(records)
    for p in [
        PLATFORM / "episode64-founder-walk-2026-10-02/FOUNDER_WALK_LEDGER.json",
        PLATFORM / "episode64-baker-20-max-package-2026-10-06/FOUNDER_ACCEPTANCE_LEDGER.json",
        PLATFORM / "episode64-reconciled-ten-founder-acceptance-2026-10-10/FOUNDER_ACCEPTANCE_LEDGER.json",
    ]:
        apply_ledger(records, p)
    apply_standalone_approvals(records)
    apply_bowling_inheritance(records)
    apply_oos(records)
    finalize(records)
    counts = Counter(r["founderStatus"] for r in records)
    registry = {
        "schemaVersion": "sczn3-platform-founder-acceptance-registry-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "governance": {
            "stagingWorkbookIsAuthority": False,
            "machinePassEqualsFounderApproval": False,
            "unknownPromotionRule": "No exact durable Founder evidence means UNVERIFIED.",
            "precedence": ["FOUNDER_OOS", "FOUNDER_HOLD", "FOUNDER_APPROVED", "FOUNDER_APPROVED_INHERITED", "UNVERIFIED"],
        },
        "sourceCensus": {"path": rel(CENSUS_PATH), "sha256": sha256(CENSUS_PATH), "faceCount": len(records)},
        "summary": {"total": len(records), **dict(sorted(counts.items()))},
        "records": records,
    }
    matrix = the13_matrix(records)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY_PATH.write_text(json.dumps(registry, indent=2) + "\n")
    (OUT_DIR / "SCZN3_EP64_THE13_CORRECTED_ELIGIBILITY_MATRIX.json").write_text(json.dumps(matrix, indent=2) + "\n")
    evidence_sources = sorted({e["source"] for r in records for e in r["founderEvidence"]})
    source_manifest = {
        "schemaVersion": "sczn3-platform-fa-source-manifest-v1",
        "authoritativeSourceCount": len(evidence_sources),
        "authoritativeSources": [
            {"path": p, "sha256": sha256(ROOT / p)} for p in evidence_sources
        ],
        "stagingWorkbook": {
            "path": "/Users/ronnieseay/Downloads/SCZN3_E64_Platform_FA_Reconciliation_Staging.xlsx",
            "role": "MANIFEST_AND_ANALYSIS_ONLY_NOT_AUTHORITY",
            "aggregateLabels": {"total": 1993, "Not FA": 1612, "FA QT inheritance": 124, "FA prior approval": 3, "FA": 254},
        },
    }
    (OUT_DIR / "EVIDENCE_SOURCE_MANIFEST.json").write_text(json.dumps(source_manifest, indent=2) + "\n")
    before_after = {
        "schemaVersion": "sczn3-platform-fa-before-after-v1",
        "before": {
            "kind": "staging_workbook_labels_non_authoritative",
            "counts": source_manifest["stagingWorkbook"]["aggregateLabels"],
            "warning": "These labels cannot be interpreted as the live FA ledger.",
        },
        "after": {
            "kind": "durable_identity_level_founder_evidence",
            "counts": registry["summary"],
            "librarySelectionExcluded": sum(not r["librarySelection"]["eligibleForFounderReview"] for r in records),
            "librarySelectionEligibleUnverified": sum(r["librarySelection"]["eligibleForFounderReview"] for r in records),
        },
        "corrections": {
            "staleWorkbookPromotionPrevented": True,
            "oosCurrentScopeSeparatedFromHistoricalApproval": True,
            "machinePassNotPromotedToFounderApproval": True,
            "unresolvedIdentityLevelFounderStatus": counts.get(UNVERIFIED, 0),
        },
    }
    (OUT_DIR / "BEFORE_AFTER_RECONCILIATION.json").write_text(json.dumps(before_after, indent=2) + "\n")
    checkpoint = {
        "schemaVersion": "sczn3-nondestructive-rollback-checkpoint-v1",
        "recordedAt": datetime.now(timezone.utc).isoformat(),
        "startingHead": "90fa4505a7d7b4414e979d47348ec4b978d8c86e",
        "preExistingTrackedDirtyPaths": 193,
        "strategy": "new-files-only; rollback by deleting this reconciliation package and registry",
        "gitObjectCheckpoint": "NOT_CREATED_POLICY_REJECTED",
    }
    (OUT_DIR / "ROLLBACK_CHECKPOINT.json").write_text(json.dumps(checkpoint, indent=2) + "\n")
    report = build_report(registry, matrix)
    (OUT_DIR / "SCZN3_EP64_PLATFORM_FA_RECONCILIATION_REPORT.md").write_text(report)
    print(json.dumps({"summary": registry["summary"], "registry": rel(REGISTRY_PATH), "report": rel(OUT_DIR / 'SCZN3_EP64_PLATFORM_FA_RECONCILIATION_REPORT.md')}, indent=2))


def build_report(registry: dict, matrix: list[dict]) -> str:
    s = registry["summary"]
    lines = [
        "# Episode 64 — Platform Founder Acceptance Reconciliation",
        "",
        "## Result",
        "",
        f"All **{s['total']}/1,993** census faces were reconciled exactly once. No Illustrated Master or staging-workbook status was treated as authority.",
        "",
        "| Governing state | Count |",
        "|---|---:|",
    ]
    for key in [APPROVED, APPROVED_INHERITED, OOS, HOLD, UNVERIFIED]:
        lines.append(f"| {key} | {s.get(key, 0)} |")
    lines += [
        "",
        "## Evidence policy",
        "",
        "- Explicit durable Founder decisions and accepted checkpoints are authoritative.",
        "- OOS is current scope and preserves historical approval/evidence.",
        "- Machine lifecycle PASS is never promoted to Founder approval.",
        "- Missing identity-level evidence remains UNVERIFIED.",
        "- This isolated package does not rewrite target contracts, geometry, scoring, artwork, SEC records, or existing ledgers.",
        "- The shared registry exposes one display state and one Founder-review eligibility flag per face; 334 approved/inherited/OOS/hold faces are excluded from reselection.",
        "- Existing production Library code had no shared FA-registry hook. This pass supplies the canonical backend registry/reader; browser UI consumption is NOT PROVEN and no UI link restoration is claimed.",
        "",
        "## THE 13 corrected matrix",
        "",
        "| # | Printer | Master | Target | FA state | Recommendation | Reason |",
        "|---:|---|---:|---|---|---|---|",
    ]
    for i, row in enumerate(matrix, 1):
        lines.append(f"| {i} | {row['printer']} | {row['masterNumber']} | {row.get('canonicalTargetName', row['manifestName'])} | {row.get('founderStatus', row.get('status'))} | {row['recommendation']} | {row['reason']} |")
    lines += [
        "",
        "## Exceptions and limits",
        "",
        "- Deterministic printer ordering and exact fourth-eligible provenance are not established by the durable sources inspected; the eight otherwise unresolved candidates remain HOLD rather than being guessed.",
        "- This pass adds the shared machine-readable FA registry and selection fields, but does not claim an existing UI consumed a registry that did not previously exist.",
        "- Runtime links restored: 0. No broken runtime link was changed or verified in this reconciliation-only assignment.",
        "- No external research, target implementation, contract mutation, push, or deployment was performed.",
    ]
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    main()
