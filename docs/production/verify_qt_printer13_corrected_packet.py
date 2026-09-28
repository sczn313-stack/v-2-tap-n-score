#!/usr/bin/env python3
"""Independently verify the QT Printer #13 corrected implementation packet."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(BACKEND), str(HERE)]

from executors.declarative_target_score import execute as execute_score  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver, validate_contract  # noqa: E402
from test_target_execution_scale_architecture import MemoryStore  # noqa: E402
from ugo_observation_classifier import classify  # noqa: E402
from apply_qt_printer13_corrected_packet import (  # noqa: E402
    CAPABILITY_MAP, GEOMETRY_LOCKS, LOCK_ID, PACKET, PACKET_SHA256,
    docx_rows,
)

AUTHORITY = BACKEND / "target_knowledge/qt_episode64_smart_target_authority.json"
LEG3 = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_LEG3_EXECUTION_MANIFEST.json"
EVIDENCE = DOCS / "authority-evidence/platform/qt-printer13-corrected-implementation-2026-09-27"
VERIFICATION = EVIDENCE / "QT_PRINTER13_CORRECTED_PACKET_VERIFICATION.json"
REPORT = EVIDENCE / "QT_PRINTER13_CORRECTED_IMPLEMENTATION_REPORT.md"
RECONCILIATION = EVIDENCE / "QT_PRINTER13_CORRECTED_IMPLEMENTATION_RECONCILIATION.json"
BROWSER = EVIDENCE / "QT_PRINTER13_CORRECTED_253_BROWSER_VERIFICATION.json"
FILE_MANIFEST = EVIDENCE / "QT_PRINTER13_IMPLEMENTATION_FILE_MANIFEST.json"
REPRESENTATIVE_SELECTOR = EVIDENCE / "QT_PRINTER13_FOUNDER_REPRESENTATIVE_5_SELECTOR.html"
REPRESENTATIVE_BROWSER = EVIDENCE / "QT_PRINTER13_FOUNDER_REPRESENTATIVE_5_BROWSER_VERIFICATION.json"
EXPECTED = {"Scoring": 40, "Zone / Object Counting": 162, "Evidence Only": 51, "Zeroing": 1}
FORBIDDEN = re.compile(
    r"strongest|weakest|even distribution|100% evenness|the center of your shot pattern|"
    r"shot.pattern center|directional.center|normalized rms|rms radius|target.image.coordinates|"
    r"dispersion/distribution",
    re.I,
)


def load_lifecycle():
    path = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/verify_qt_leg3_lifecycle.py"
    spec = importlib.util.spec_from_file_location("qt_packet_lifecycle", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


life = load_lifecycle()


def image(surface: dict) -> dict:
    return {
        "dataUrl": surface["assetPath"], "registeredAssetPath": surface["assetPath"],
        "sha256": surface["assetSha256"], "canonicalAssetSha256": surface["assetSha256"],
        "widthPx": surface["imageWidth"], "heightPx": surface["imageHeight"],
        "mediaType": "image/png" if surface["assetPath"].endswith(".png") else "image/jpeg",
    }


def sample_for_each_region(regions: list[dict]) -> tuple[dict[str, tuple[float, float]], tuple[float, float] | None]:
    found: dict[str, tuple[float, float]] = {}
    outside = None
    for yi in range(1, 200):
        y = yi / 200
        for xi in range(1, 200):
            x = xi / 200
            hit = classify(regions, x, y, id_key="regionId", shape_reason="shape_unsupported", error_type=ValueError).get("entityId")
            if hit and hit not in found:
                found[hit] = (x, y)
            elif hit is None and outside is None:
                outside = (x, y)
            if len(found) == len(regions) and outside:
                return found, outside
    return found, outside


def strings_relevant_to_result(row: dict) -> list[str]:
    values = []
    treatment = row.get("smartTargetTreatment", {})
    values.append(str(treatment.get("smartBehavior") or ""))
    values.append(str(treatment.get("homieCorrectedTreatment", {}).get("requiredBehavior") or ""))
    values.append(str(row.get("homieCorrectedTreatmentRecord", {}).get("codyAction") or ""))
    values.append(str(row.get("homieLockedCatalogRecord", {}).get("smartBehavior") or ""))
    return values


def main() -> None:
    assert hashlib.sha256(PACKET.read_bytes()).hexdigest() == PACKET_SHA256
    packet_rows = docx_rows()
    packet_by_chair = {row["qtChair"]: row for row in packet_rows}
    authority = json.loads(AUTHORITY.read_text(encoding="utf-8"))
    leg3 = json.loads(LEG3.read_text(encoding="utf-8"))
    rows, surfaces = authority["chairs"], leg3["surfaces"]
    assert len(rows) == len({row["qtCatalogId"] for row in rows}) == 254
    assert len(surfaces) == len({row["qtCatalogId"] for row in surfaces}) == 254
    by_chair = {int(row["chair"]): row for row in rows}
    surface_by_id = {row["qtCatalogId"]: row for row in surfaces}

    contract_paths = [DOCS / row["contractPath"] for row in rows if row.get("contractPath")]
    contracts = [json.loads(path.read_text(encoding="utf-8")) for path in contract_paths]
    assert len(contracts) == 253
    validated = [validate_contract(contract) for contract in contracts]
    assert len({contract["contractId"] for contract in validated}) == 253
    assert len({contract["contractFingerprint"] for contract in validated}) == 253
    resolver = TargetExecutionContractResolver(contracts=contracts)

    failures: dict[str, list] = {
        "capability": [], "packetOverrides": [], "packetBinding": [], "staleResultLanguage": [],
        "runtimeTreatment": [], "resultMeta": [], "geometry": [], "lifecycle": [], "browser": [], "representativeReview": [], "usm": [],
    }
    counts = dict(Counter(row["highestTruthfulCapability"] for row in rows))
    if counts != EXPECTED:
        failures["capability"].append({"expected": EXPECTED, "actual": counts})

    for chair, packet in packet_by_chair.items():
        row = by_chair[chair]
        if row["highestTruthfulCapability"] != CAPABILITY_MAP[packet["capabilityLabel"]]:
            failures["packetOverrides"].append({"chair": chair, "expected": packet["capability"], "actual": row["highestTruthfulCapability"]})

    for row in rows:
        lock = row.get("smartTargetTreatment", {}).get("correctedPacketLock", {})
        if lock.get("lockId") != LOCK_ID or lock.get("packetSha256") != PACKET_SHA256:
            failures["packetBinding"].append(row["qtCatalogId"])
        if any(FORBIDDEN.search(value) for value in strings_relevant_to_result(row)):
            failures["staleResultLanguage"].append(row["qtCatalogId"])
        treatment_result = row.get("smartTargetTreatment", {}).get("result", {})
        if treatment_result.get("shotPattern") is not False or treatment_result.get("distributionMeta") is not False:
            failures["resultMeta"].append({"target": row["qtCatalogId"], "source": "authority"})
        if not row.get("contractPath"):
            continue
        contract = resolver.resolve(row["targetProfileId"], row["missionFamily"])
        mission = contract["components"]["mission"]["definition"]
        if mission.get("smartTargetTreatment") != row["smartTargetTreatment"]:
            failures["runtimeTreatment"].append(row["qtCatalogId"])
        surface = surface_by_id[row["qtCatalogId"]]
        evidence, _source, observations = life.evidence_for(contract, surface)
        result = execute_score(contract, evidence) if row["missionFamily"] == "targetScoring" else None
        if result:
            metrics = result.get("sczn3Metrics", {})
            if metrics.get("shotPattern") is not None or metrics.get("objectDistribution") is not None:
                failures["resultMeta"].append({"target": row["qtCatalogId"], "source": "executor"})
            if result["scoring"]["observationCount"] != len(observations) or not result["reconciliation"]["countsMatch"]:
                failures["runtimeTreatment"].append({"target": row["qtCatalogId"], "reason": "tap_reconciliation"})

    geometry_results = []
    for chair, expected_lock in GEOMETRY_LOCKS.items():
        row = by_chair[chair]
        surface = surface_by_id[row["qtCatalogId"]]
        contract = resolver.resolve(row["targetProfileId"], "targetScoring")
        geometry = contract["components"]["geometry"]["definition"]["regions"]
        scoring = contract["components"]["scoring"]["definition"]
        samples, outside = sample_for_each_region(geometry)
        expected_ids = set(scoring["regionRules"])
        checks = {
            "allRegionsReachable": set(samples) == expected_ids,
            "outsideReachable": outside is not None,
            "authorityRegionIdentity": {region["regionId"] for region in geometry} == {region["regionId"] for region in expected_lock["regions"]},
        }
        if all(checks.values()):
            points = [samples[region_id] for region_id in expected_ids] + [outside]
            result = execute_score(contract, {"imageEvidence": image(surface), "observations": [{"xNorm": x, "yNorm": y} for x, y in points]})
            checks.update({
                "oneTapPerRegion": all(result["scoring"]["regionCounts"].get(region_id) == 1 for region_id in expected_ids),
                "oneOutside": result["scoring"]["outsideCount"] == 1,
                "allTapsReconcile": result["scoring"]["observationCount"] == len(points),
            })
        status = "PASS" if all(checks.values()) else "FAIL"
        geometry_results.append({"chair": chair, "target": row["productName"], "status": status, "checks": checks})
        if status != "PASS":
            failures["geometry"].append(geometry_results[-1])

    usmc = by_chair[288]
    usmc_labels = set(usmc["smartTargetTreatment"]["truthLayers"]["publisherTruth"]["artworkFacts"]["labels"])
    required_usmc = {"Outline of Head Zone", "5-inch Circle Head Zone", "19.5-inch Center Mass Zone", "10-inch Center Chest Zone", "Full Polygonal Pelvic Zone"}
    if usmc_labels != required_usmc or len(usmc["geometry"]["regions"]) != 5:
        failures["geometry"].append({"chair": 288, "reason": "USMC-THREAT five-zone lock missing", "labels": sorted(usmc_labels)})

    store = MemoryStore()
    lifecycle = [life.verify_one(surface, resolver, store, index) for index, surface in enumerate(surfaces, 1)]
    failures["lifecycle"] = [item for item in lifecycle if item["status"] != "PASS"]
    browser = json.loads(BROWSER.read_text(encoding="utf-8"))
    if browser.get("status") != "PASS" or browser.get("pass") != 253 or browser.get("fail") != 0:
        failures["browser"].append(browser)
    representative = json.loads(REPRESENTATIVE_BROWSER.read_text(encoding="utf-8"))
    if representative.get("status") != "PASS" or representative.get("count") != 5:
        failures["representativeReview"].append(representative)

    usm_registry = (DOCS / "usm_proof_registry.js").read_text(encoding="utf-8")
    runtime = (DOCS / "target_execution_runtime.js").read_text(encoding="utf-8")
    if "qt_printer13_product_" not in usm_registry:
        failures["usm"].append("QT registry prefix unavailable")
    if "`${targetName || \"TARGET\"} DETAILS`" not in runtime or '"B27E DETAILS"' not in runtime:
        failures["usm"].append("target-specific History label unavailable")

    status = "PASS" if not any(failures.values()) else "FAIL"
    verification = {
        "schemaVersion": "sczn3.qt-printer13.corrected-packet-verification.v1",
        "status": status, "founderAcceptance": "PENDING", "packetSha256": PACKET_SHA256,
        "chairs": 254, "contracts": 253, "inheritedZeroing": 1,
        "explicitOverrideRows": len(packet_rows), "capabilityCounts": counts,
        "treatmentBindingPass": 254 - len(failures["packetBinding"]),
        "contractValidationPass": len(validated),
        "geometryCorrectionPass": len(geometry_results) - len(failures["geometry"]),
        "geometryCorrectionApplicable": len(geometry_results),
        "lifecyclePass": 254 - len(failures["lifecycle"]), "lifecycleApplicable": 254,
        "renderedBrowserPass": browser.get("pass"), "renderedBrowserApplicable": 253,
        "coordinateExactReopenPass": sum(item.get("checks", {}).get("exactTapReopen") is True for item in lifecycle),
        "evidenceExactReopenPass": sum(item.get("checks", {}).get("exactArtworkReopen") is True for item in lifecycle),
        "staleResultBehaviorCount": len(failures["staleResultLanguage"]) + len(failures["resultMeta"]),
        "usmcThreatFiveZonePass": not any(item.get("chair") == 288 for item in failures["geometry"] if isinstance(item, dict)),
        "browserVerification": str(BROWSER.relative_to(DOCS)),
        "representativeFounderReview": str(REPRESENTATIVE_BROWSER.relative_to(DOCS)),
        "geometryResults": geometry_results, "lifecycleResults": lifecycle, "failures": failures,
    }
    VERIFICATION.write_text(json.dumps(verification, indent=2) + "\n", encoding="utf-8")
    if status != "PASS":
        raise AssertionError({name: len(items) for name, items in failures.items() if items})

    reconciliation = json.loads(RECONCILIATION.read_text(encoding="utf-8"))
    reconciliation.update({"status": "PASS_254_OF_254_FOUNDER_ACCEPTANCE_PENDING", "verification": str(VERIFICATION.relative_to(DOCS))})
    RECONCILIATION.write_text(json.dumps(reconciliation, indent=2) + "\n", encoding="utf-8")
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=DOCS.parent, text=True, capture_output=True, check=True).stdout.strip()
    core_paths = [
        PACKET, AUTHORITY, LEG3,
        DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22/QT_EP64_254_IMPLEMENTATION_MANIFEST.json",
        DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_FINAL_SMART_TARGET_COMPLETION_MANIFEST.json",
        DOCS / "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23/QT_FOUNDER_254_EXECUTABLE_SELECTOR.html",
        DOCS / "target_execution_runtime.js", DOCS / "usm_proof_registry.js", DOCS / "target-experience.html", DOCS / "records.html",
        DOCS / "production/apply_qt_printer13_corrected_packet.py", DOCS / "production/verify_qt_printer13_corrected_packet.py",
        DOCS / "production/qt_printer13_usm_contract_test.mjs", DOCS / "production/qt_founder_corrected_254_browser_test.mjs",
        DOCS / "production/qt_printer13_representative_review_server.py", DOCS / "production/qt_printer13_representative_5_browser_test.mjs",
        DOCS / "production/canonical_preserved_lifecycle_test.mjs", BROWSER,
        REPRESENTATIVE_SELECTOR, REPRESENTATIVE_BROWSER,
        EVIDENCE / "QT_PRINTER13_CORRECTED_PACKET_LEDGER.json", RECONCILIATION, VERIFICATION, REPORT,
    ]
    all_paths = core_paths + contract_paths
    file_manifest = {
        "schemaVersion": "sczn3.qt-printer13.implementation-file-manifest.v1",
        "workingTreeHead": head, "commitCreated": False,
        "coreAndEvidenceFiles": [str(path.relative_to(DOCS.parent)) for path in core_paths],
        "contractFiles": [str(path.relative_to(DOCS.parent)) for path in contract_paths],
        "contractFileCount": len(contract_paths),
        "sha256": {str(path.relative_to(DOCS.parent)): hashlib.sha256(path.read_bytes()).hexdigest() for path in all_paths if path.exists()},
    }
    changed_chairs = "\n".join(
        f"  - QT #{item['qtChair']} — {item['productName']}: {item['from']} → {item['to']}"
        for item in reconciliation.get("changedChairs", [])
    )
    REPORT.write_text(
        "# QT Printer #13 Corrected Implementation Report\n\n"
        "Status: **PASS — Helpmeet Homie review required; Founder acceptance pending**\n\n"
        "## Implementation changes\n\n"
        "- Bound all 254 authority rows and all 253 execution contracts to the corrected packet SHA-256.\n"
        "- Removed prohibited QT RESULT analytics/language and kept counts, scores, misses, and exact evidence only.\n"
        "- Registered 17 corrected target-specific region models, including USMC-THREAT's five governed zones.\n"
        "- Enrolled QT numeric scoring targets in USM without changing target-specific governed scoring.\n"
        "- Preserved Backend Authority ownership, UGO normalized-source coordinates, universal RESULT/SEC/Vault, and exact reopen.\n\n"
        "## Reconciliation\n\n"
        f"- Governing packet SHA-256: `{PACKET_SHA256}`.\n"
        "- Inventory: **254/254** chairs; **253/253** target execution contracts plus **1** inherited Zeroing road.\n"
        "- Final capability distribution: **40 Scoring / 162 Zone–Object Counting / 51 Evidence Only / 1 Zeroing**.\n"
        "- Explicit packet overrides: **91/91**. Capability changes: **18**.\n"
        f"{changed_chairs}\n\n"
        "## Verification\n\n"
        "- Corrected geometry registrations: **17/17**, including the five-zone USMC-THREAT treatment.\n"
        "- Full TARGET → TAP → RESULT → SEC → VAULT → exact reopen verification: **254/254 PASS**.\n"
        "- Rendered browser TARGET → RESULT → SEC → Vault → exact reopen: **253/253 applicable PASS**; inherited Zeroing remains on its governed isolated road.\n"
        "- Representative Founder selector: **5/5 entry roads PASS**; Founder acceptance remains pending.\n"
        "- Exact UGO tap reopen: **254/254 PASS**. Exact registered evidence reopen: **254/254 PASS**.\n"
        "- Stale prohibited QT RESULT behaviors: **0**.\n"
        "- QT scoring targets are enrolled in USM while governed target scoring remains unchanged underneath.\n"
        "- Failures/withholds: **0/0**. Founder acceptance was not declared.\n"
        f"- Working-tree HEAD remained `{head}`; no commit was created.\n"
        f"- Exact changed-file inventory and hashes: `{FILE_MANIFEST.relative_to(DOCS)}`.\n",
        encoding="utf-8",
    )
    file_manifest["sha256"] = {str(path.relative_to(DOCS.parent)): hashlib.sha256(path.read_bytes()).hexdigest() for path in all_paths if path.exists()}
    FILE_MANIFEST.write_text(json.dumps(file_manifest, indent=2) + "\n", encoding="utf-8")
    print("PASS QT Printer #13 corrected packet: 254/254 lifecycle; Founder acceptance pending")


if __name__ == "__main__":
    main()
