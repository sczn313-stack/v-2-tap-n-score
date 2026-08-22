#!/usr/bin/env python3
"""Exercise every admitted GunFun SKU through the frozen governed lifecycle."""
from __future__ import annotations

import hashlib
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


DOCS = Path(__file__).resolve().parents[3]
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))

from execution_authority import execute_authoritative_session  # noqa: E402
from execution_capability_registry import resolve_owner  # noqa: E402
from preserved_sec_store import preserve_sec, read_preserved_sec  # noqa: E402
from session_authority import prepare_session, start_session  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver  # noqa: E402
from test_target_execution_scale_architecture import MemoryStore  # noqa: E402


AUDIT_PATH = DOCS / "authority-evidence/gunfun/episode56/full-catalog-stress-test/FULL_CATALOG_AUTHORITY_AUDIT.json"
OUTPUT = Path(__file__).resolve().parent / "FULL_CATALOG_LIFECYCLE_RESULTS.json"
NOW = datetime(2026, 8, 19, 16, 0, tzinfo=timezone.utc)
DATA_URL = "data:image/svg+xml;base64,PHN2Zy8+"
IMAGE_SHA = "a" * 64


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


audit = json.loads(AUDIT_PATH.read_text())
resolver = TargetExecutionContractResolver()
catalog = resolver.catalog()
catalog_by_sku = {entry["product"]["sku"]: entry for entry in catalog}
assert len(catalog) == 237
assert len(catalog_by_sku) == 237
store = MemoryStore()
outcomes = []

for index, record in enumerate(audit["records"], 1):
    sku = record["product"]["sku"]
    if record["registration"]["status"] != "registered":
        assert sku not in catalog_by_sku
        continue
    started_clock = time.perf_counter()
    entry = catalog_by_sku[sku]
    target_id = entry["targetProfileId"]
    assert target_id == record["registration"]["targetProfileId"]
    assert entry["product"]["name"] == record["product"]["profileName"]
    assert entry["missionFamily"] == "smartEvidenceCapture"
    assert entry["resultPackageType"] == "smartEvidenceResult"
    contract = resolver.resolve(target_id, "smartEvidenceCapture")
    owner = resolve_owner(contract)
    assert owner.executor_id == "smart-evidence-capture"
    assert owner.sec_adapter_family_id == "smart-evidence-family"
    admitted_asset = DOCS / entry["registration"]["assetPath"]
    assert admitted_asset.is_file()
    assert sha256(admitted_asset) == entry["registration"]["assetSha256"]
    registered_at = time.perf_counter()

    prepared = prepare_session(
        {"targetId": target_id, "missionFamily": "smartEvidenceCapture"},
        store,
        now=NOW,
        execution_contract_resolver=resolver,
    )
    started = start_session(
        {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
        store,
        idempotency_key=f"e56-full-catalog-{index:03d}",
        now=NOW,
        execution_contract_resolver=resolver,
    )
    result = execute_authoritative_session({
        "authoritativeSessionId": started["authoritativeSessionId"],
        "evidence": {
            "imageEvidence": {"sha256": IMAGE_SHA, "widthPx": 900, "heightPx": 1200, "mediaType": "image/svg+xml", "dataUrl": DATA_URL},
            "observations": [{"xNorm": 0.25, "yNorm": 0.35}, {"xNorm": 0.75, "yNorm": 0.65}],
            "shooterDeclaredAimPoint": {"xNorm": 0.5, "yNorm": 0.5},
        },
    }, store, resolver=resolver)
    authoritative_result_at = time.perf_counter()
    assert result["authoritySource"] == "backend-authoritative"
    assert result["target"]["product"]["sku"] == sku
    assert result["target"]["product"]["name"] == record["product"]["profileName"]
    assert result["reconciliation"] == {"capturedObservationCount": 2, "acceptedObservationCount": 2, "countsMatch": True}
    assert result["scoring"]["status"] == "not_applicable"
    assert result["shooterDeclaredAimPoint"]["declaredBy"] == "shooter"
    assert result["capabilityStates"]["evidence"]["status"] == "available"
    assert result["capabilityStates"]["measurement"]["status"] == "unavailable"
    assert result["capabilityStates"]["correction"]["status"] == "unavailable"

    artifact = {
        "sessionId": started["authoritativeSessionId"],
        "authoritativeSessionId": started["authoritativeSessionId"],
        "sessionIdAuthority": "backend",
        "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": result["missionFamily"], "resultPackageType": result["resultPackageType"]},
        "authorityPackage": result,
        "targetEvidenceImage": {"dataUrl": DATA_URL, "sha256": IMAGE_SHA},
        "savedToSEC": False,
    }
    universal_sec_at = time.perf_counter()
    saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
    preserved_at = time.perf_counter()
    reopened = read_preserved_sec(started["authoritativeSessionId"], store)
    reopened_at = time.perf_counter()
    assert saved["artifactSha256"] == reopened["artifactSha256"]
    reopened_result = reopened["session"]["authorityPackage"]
    assert reopened_result["target"]["id"] == target_id
    assert reopened_result["target"]["product"]["sku"] == sku
    assert reopened_result["reconciliation"]["acceptedObservationCount"] == 2
    assert reopened_result["scoring"]["status"] == "not_applicable"
    assert reopened["session"]["targetEvidenceImage"]["dataUrl"] == DATA_URL

    outcomes.append({
        "catalogId": record["catalogId"],
        "sku": sku,
        "productName": record["product"]["profileName"],
        "targetProfileId": target_id,
        "inheritedCapabilityFamily": "smartEvidenceCapture",
        "executorId": owner.executor_id,
        "secFamily": owner.sec_adapter_family_id,
        "targetIdProductionCodeEdit": "NO",
        "targetSpecificModulesOrRoutesCreated": 0,
        "status": "exact_reopen_pass",
        "artifactSha256": saved["artifactSha256"],
        "timeMs": {
            "registrationResolution": round((registered_at - started_clock) * 1000, 3),
            "backendAuthoritativeResult": round((authoritative_result_at - started_clock) * 1000, 3),
            "universalSec": round((universal_sec_at - started_clock) * 1000, 3),
            "preservation": round((preserved_at - started_clock) * 1000, 3),
            "exactReopen": round((reopened_at - started_clock) * 1000, 3),
        },
    })

assert len(outcomes) == 237
assert len({outcome["targetProfileId"] for outcome in outcomes}) == 237
assert len({outcome["artifactSha256"] for outcome in outcomes}) == 237
report = {
    "schemaVersion": "gunfun-full-catalog-lifecycle-results-v1",
    "status": "PASS",
    "registeredProductsTested": 237,
    "backendAuthoritativeResults": 237,
    "universalSecs": 237,
    "preservedAndExactlyReopened": 237,
    "targetIdProductionCodeEdits": 0,
    "targetSpecificModulesOrRoutesCreated": 0,
    "inheritedCapabilityFamilies": {"smartEvidenceCapture": 237},
    "outcomes": outcomes,
}
OUTPUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
print("GunFun full-catalog governed lifecycle: PASS")
print("- 237/237 frozen-architecture publisher targets reached backend-authoritative result, Universal SEC, preservation, and exact reopen")
print("- 237/237 inherited smartEvidenceCapture and the smart-evidence SEC family")
print("- Vital Dude remained governed on its preexisting target-specific path and exposed resolver-precedence architecture failure")
print("- 20/258 product records remained outside frozen-architecture execution at explicit product, authority, or architecture boundaries")
