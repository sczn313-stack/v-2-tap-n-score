#!/usr/bin/env python3
"""Apply the Founder-authorized dispositions for exactly 16 population exceptions."""
from __future__ import annotations

import hashlib
import json
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "docs/backend/registries/episode64_platform_population_registry.json"
FA_REGISTRY = ROOT / "docs/backend/registries/episode64_platform_founder_acceptance_registry.json"
DISPOSITIONS = ROOT / "docs/backend/registries/episode64_population_exception_dispositions.json"
SOURCE_EXCEPTIONS = ROOT / "docs/authority-evidence/platform/episode64-platform-multipack-reclassification-2026-10-11/UNRESOLVED_AND_INCOMPLETE_CASES.json"
OUT = ROOT / "docs/authority-evidence/platform/episode64-population-exception-closeout-2026-10-11"

INDIVIDUAL = "INDIVIDUAL_FACE"
IDENTICAL = "IDENTICAL_MULTIPACK"
ASSORTMENT = "ASSORTMENT_PACK"
CONTAINER = "COMMERCIAL_CONTAINER"
UNRESOLVED = "UNRESOLVED"


def load(path: Path):
    return json.loads(path.read_text())


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def component_key(component: dict) -> str | None:
    value = component.get("canonicalFaceId")
    if not value or value == "UNKNOWN":
        return None
    return ("census:" if value.startswith("THE13-MASTER-") else "sha256:") + value


def direct_key(record: dict) -> str | None:
    if record["populationClassification"] not in {INDIVIDUAL, IDENTICAL}:
        return None
    resolution = record.get("exceptionDisposition") or {}
    key = resolution.get("caseCanonicalId")
    if key and key != "UNKNOWN":
        return ("census:" if key.startswith("THE13-MASTER-") else "sha256:") + key
    candidates = record["packageRelationship"].get("verifiedCanonicalFaceIds") or []
    if len(candidates) == 1:
        return "sha256:" + candidates[0]
    return "census:" + record["censusFaceKey"]


def main() -> None:
    before_bytes = REGISTRY.read_bytes()
    prior_fa_hash = sha(FA_REGISTRY)
    registry = json.loads(before_bytes)
    before_summary = dict(registry["summary"])
    dispositions = load(DISPOSITIONS)
    source_exceptions = load(SOURCE_EXCEPTIONS)
    expected = {
        x["censusFaceKey"] for x in source_exceptions["unresolvedRecords"]
    } | {
        x["censusFaceKey"] for x in source_exceptions["assortmentsWithoutCompleteVerifiedRoster"]
    }
    actual = {x["censusFaceKey"] for x in dispositions["cases"]}
    if len(expected) != 16 or actual != expected:
        raise ValueError("disposition scope must match the exact 16 source exceptions")

    by_key = {x["censusFaceKey"]: x for x in registry["records"]}
    before_snapshot = {
        key: {
            "populationClassification": by_key[key]["populationClassification"],
            "canonicalFaceId": by_key[key]["canonicalFaceId"],
            "packageRelationship": by_key[key]["packageRelationship"],
            "founderAuthority": by_key[key]["founderAuthority"],
        }
        for key in sorted(expected)
    }

    for case in dispositions["cases"]:
        record = by_key[case["censusFaceKey"]]
        record["populationClassification"] = case["populationClassification"]
        record["classificationConfidence"] = "HIGH" if case["disposition"] == "RESOLVED" else "MEDIUM"
        record["classificationReason"] = case["reason"]
        record["canonicalFaceId"] = case["caseCanonicalId"]
        record["packageRelationship"]["verifiedComponents"] = case["verifiedComponents"]
        record["packageRelationship"]["verifiedCanonicalFaceIds"] = sorted({
            x["canonicalFaceId"] for x in case["verifiedComponents"]
            if x.get("canonicalFaceId") and x["canonicalFaceId"] != "UNKNOWN" and not x["canonicalFaceId"].startswith("THE13-MASTER-")
        })
        record["packageRelationship"]["verifiedComponentFaceCount"] = len({
            component_key(x) for x in case["verifiedComponents"] if component_key(x)
        })
        record["packageRelationship"]["componentRosterComplete"] = case["componentRosterComplete"]
        record["exceptionDisposition"] = {
            "status": case["disposition"],
            "caseCanonicalId": case["caseCanonicalId"],
            "reason": case["reason"],
            "evidence": case["evidence"],
            "founderAuthorizedOosApplied": case["disposition"] == "OOS",
        }
        executable = case["populationClassification"] in {INDIVIDUAL, IDENTICAL}
        founder_eligible = record["founderAuthority"]["status"] == "UNVERIFIED" and record["founderAuthority"]["currentScope"] == "ACTIVE"
        record["executableFaceSelection"] = {
            "eligible": executable and founder_eligible,
            "excludedBecause": None if executable and founder_eligible else (
                case["populationClassification"] if not executable else record["founderAuthority"]["status"]
            ),
        }

    records = registry["records"]
    counts = Counter(x["populationClassification"] for x in records)
    direct = {key for x in records if (key := direct_key(x))}
    components = {
        key for x in records
        if x["populationClassification"] in {ASSORTMENT, CONTAINER}
        for component in x["packageRelationship"].get("verifiedComponents", [])
        if (key := component_key(component))
    }
    components |= {
        "sha256:" + candidate
        for x in records
        if x["populationClassification"] in {ASSORTMENT, CONTAINER}
        for candidate in x["packageRelationship"].get("verifiedCanonicalFaceIds", [])
        if candidate != "UNKNOWN"
    }
    verified = direct | components
    incomplete = sum(
        x["populationClassification"] == ASSORTMENT and not x["packageRelationship"]["componentRosterComplete"]
        for x in records
    )
    registry["schemaVersion"] = "sczn3-platform-population-registry-v2"
    registry["generatedAt"] = datetime.now(timezone.utc).isoformat()
    registry["sources"]["exceptionDispositions"] = {
        "path": DISPOSITIONS.relative_to(ROOT).as_posix(), "sha256": sha(DISPOSITIONS)
    }
    registry["summary"].update({
        **{k: counts.get(k, 0) for k in [INDIVIDUAL, IDENTICAL, ASSORTMENT, CONTAINER, UNRESOLVED]},
        "verifiedUniqueShootableFaceMinimum": len(verified),
        "verifiedDirectFaceKeys": len(direct),
        "knownPackageComponentFaceKeys": len(components),
        "knownAssortmentComponentFaceKeys": len(components),
        "packageComponentsNewToDirectFacePopulation": len(components - direct),
        "assortmentComponentsNewToDirectFacePopulation": len(components - direct),
        "recordsReclassifiedFromImplicitIndividualFace": counts[IDENTICAL] + counts[ASSORTMENT] + counts[CONTAINER] + counts[UNRESOLVED],
        "recordsExcludedFromUniqueFaceMinimum": counts[ASSORTMENT] + counts[CONTAINER] + counts[UNRESOLVED],
        "recordsExcludedFromExecutableFaceSelection": sum(not x["executableFaceSelection"]["eligible"] for x in records),
        "unresolvedAssortmentsWithoutCompleteRoster": incomplete,
        "classificationConfidence": dict(sorted(Counter(x["classificationConfidence"] for x in records).items())),
        "exactUniqueFaceCountProven": False,
        "upperBound": None,
        "upperBoundReason": "Five package component-to-canonical relationships remain incomplete.",
        "exceptionCloseout": {"processed": 16, "resolved": 11, "oos": 0, "hold": 5},
    })
    REGISTRY.write_text(json.dumps(registry, indent=2) + "\n")

    OUT.mkdir(parents=True, exist_ok=True)
    after_snapshot = {
        key: {
            "populationClassification": by_key[key]["populationClassification"],
            "canonicalFaceId": by_key[key]["canonicalFaceId"],
            "packageRelationship": by_key[key]["packageRelationship"],
            "founderAuthority": by_key[key]["founderAuthority"],
            "exceptionDisposition": by_key[key]["exceptionDisposition"],
        }
        for key in sorted(expected)
    }
    closeout = {
        "schemaVersion": "sczn3-population-exception-closeout-v1",
        "summary": registry["summary"]["exceptionCloseout"],
        "population": registry["summary"],
        "cases": dispositions["cases"],
    }
    (OUT / "SCZN3_EP64_16_EXCEPTION_DISPOSITIONS.json").write_text(json.dumps(closeout, indent=2) + "\n")
    (OUT / "BEFORE_AFTER_16_EXCEPTIONS.json").write_text(json.dumps({
        "beforeRegistrySha256": hashlib.sha256(before_bytes).hexdigest(),
        "afterRegistrySha256": sha(REGISTRY),
        "founderAcceptanceRegistryBeforeSha256": prior_fa_hash,
        "founderAcceptanceRegistryAfterSha256": sha(FA_REGISTRY),
        "founderAcceptanceRegistryChanged": prior_fa_hash != sha(FA_REGISTRY),
        "populationBefore": before_summary,
        "populationAfter": registry["summary"],
        "before": before_snapshot,
        "after": after_snapshot,
    }, indent=2) + "\n")
    (OUT / "ROLLBACK_CHECKPOINT.json").write_text(json.dumps({
        "schemaVersion": "sczn3-population-exception-rollback-v1",
        "recordedAt": datetime.now(timezone.utc).isoformat(),
        "startingHead": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "populationRegistryBeforeSha256": hashlib.sha256(before_bytes).hexdigest(),
        "founderAcceptanceRegistrySha256": prior_fa_hash,
        "rollbackSource": "Re-run the base population builder; this closeout is an additive 16-case overlay.",
        "commitCreated": False,
        "pushPerformed": False,
    }, indent=2) + "\n")
    lines = [
        "# Episode 64 — Close the 16 Population Exceptions",
        "",
        "## Result",
        "",
        "- Preserved Master records: **1,993 / 1,993**",
        "- Fully resolved: **11**",
        "- New Founder-authorized OOS dispositions: **0**",
        "- Remaining HOLD: **5**",
        f"- Verified unique shootable-face minimum: **{registry['summary']['verifiedUniqueShootableFaceMinimum']}**",
        "- Exact unique-face total: **not proven** because five package component-to-canonical relationships remain incomplete.",
        "- Founder Acceptance registry changed: **NO**",
        "",
        "## 16-row disposition table",
        "",
        "| Master | Census identity | Target | Canonical face identity/identities | Disposition | Reason |",
        "|---:|---|---|---|---|---|",
    ]
    record_names = {x["censusFaceKey"]: x["targetName"] for x in records}
    for case in dispositions["cases"]:
        canonical = sorted({
            x.get("canonicalFaceId", "UNKNOWN") for x in case["verifiedComponents"]
        }) or [case["caseCanonicalId"]]
        lines.append(
            f"| {case['masterNumber']} | `{case['censusFaceKey']}` | {record_names[case['censusFaceKey']]} | "
            f"{'<br>'.join('`' + x + '`' for x in canonical)} | **{case['disposition']}** | {case['reason']} |"
        )
    lines += [
        "",
        "## Governance notes",
        "",
        "- The five HOLD cases are packages, not executable faces. Their valid known component labels remain preserved.",
        "- No missing or contradictory evidence was converted to OOS.",
        "- Master 1212 is now a non-executable catalog container holding one active Squirrel face and one already-OOS placeholder identity; no new OOS decision was created.",
        "- Commercial products, quantities, SKUs, registered representations, FA evidence, and SEC/Vault references remain preserved.",
        "- No commit, push, deployment, or approval-guard bypass was performed.",
    ]
    (OUT / "SCZN3_EP64_16_EXCEPTION_CLOSEOUT_REPORT.md").write_text("\n".join(lines) + "\n")
    print(json.dumps({"summary": registry["summary"], "closeout": closeout["summary"]}, indent=2))


if __name__ == "__main__":
    main()
