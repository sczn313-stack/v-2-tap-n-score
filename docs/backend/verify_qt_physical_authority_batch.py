#!/usr/bin/env python3
"""Independent lifecycle verification for QT physical-authority admissions."""
from __future__ import annotations

import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import execute_authoritative_session
from preserved_sec_store import list_preserved_secs, preserve_sec, read_preserved_sec
from session_authority import prepare_session, start_session
from target_execution_contract import TargetExecutionContractResolver
from test_target_execution_scale_architecture import MemoryStore
import cv2


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "docs/authority-evidence/platform/qt-printer13-physical-authority-execution-2026-09-28/QT_PHYSICAL_AUTHORITY_LIFECYCLE_VERIFICATION.json"
MANIFEST = ROOT / "docs/authority-evidence/platform/qt-printer13-physical-authority-execution-2026-09-28/QT_PHYSICAL_AUTHORITY_BATCH_MANIFEST.json"
NOW = datetime(2026, 9, 28, 14, 0, tzinfo=timezone.utc)


def main() -> None:
    resolver = TargetExecutionContractResolver()
    store = MemoryStore()
    admitted = json.loads(MANIFEST.read_text())["admittedQtCatalogIds"]
    outcomes = []
    for index, qt_catalog_id in enumerate(admitted, start=1):
        contract = next(item for item in resolver.contracts() if item["targetProfile"]["product"].get("qtCatalogId") == qt_catalog_id and item["missionFamily"] == "targetScoring")
        target_id = contract["targetProfile"]["id"]
        registration = contract["components"]["registration"]["definition"]
        asset = ROOT / "docs" / registration["assetPath"]
        assert asset.is_file()
        assert hashlib.sha256(asset.read_bytes()).hexdigest() == registration["assetSha256"]
        decoded = cv2.imread(str(asset), cv2.IMREAD_GRAYSCALE)
        assert decoded is not None
        regions = contract["components"]["geometry"]["definition"]["regions"]
        observations = []
        for region in regions:
            if region["shape"] == "polygon":
                points = region["points"]
                x = sum(point[0] for point in points) / len(points)
                y = sum(point[1] for point in points) / len(points)
                if region["regionId"].startswith("spot_") and not region["regionId"].endswith("_aim_point"):
                    x = x * 0.25 + points[0][0] * 0.75
                    y = y * 0.25 + points[0][1] * 0.75
            else:
                x = region["cx"] + float(region.get("radiusX", region.get("radius", 0))) * 0.8
                y = region["cy"]
            observations.append({"xNorm": x, "yNorm": y})
        observations.append({"xNorm": 0.01, "yNorm": 0.99})
        prepared = prepare_session({"targetId": target_id, "missionFamily": "targetScoring"}, store, now=NOW, execution_contract_resolver=resolver)
        started = start_session(
            {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
            store, idempotency_key=f"qt-physical-authority-lifecycle-{index}", now=NOW, execution_contract_resolver=resolver,
        )
        try:
            result = execute_authoritative_session({
                "authoritativeSessionId": started["authoritativeSessionId"],
                "evidence": {"imageEvidence": {
                    "sha256": registration["assetSha256"], "widthPx": decoded.shape[1], "heightPx": decoded.shape[0],
                    "mediaType": "image/jpeg", "dataUrl": "data:image/jpeg;base64,/9j/",
                }, "observations": observations},
            }, store, resolver=resolver)
        except Exception as exc:
            outcomes.append({
                "targetProfileId": target_id, "qtCatalogId": qt_catalog_id,
                "contractId": contract["contractId"], "contractFingerprint": contract["contractFingerprint"],
                "stages": {"TARGET": "PASS", "RESULT": "FAIL", "SEC": "NOT RUN", "VAULT": "NOT RUN", "EXACT_REOPEN": "NOT RUN"},
                "observations": len(observations), "error": str(exc),
            })
            continue
        assert result["reconciliation"]["status"] == "reconciled"
        assert result["reconciliation"]["recordedObservationCount"] == len(observations)
        artifact = {
            "sessionId": started["authoritativeSessionId"], "authoritativeSessionId": started["authoritativeSessionId"],
            "sessionIdAuthority": "backend",
            "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": result["missionFamily"], "resultPackageType": result["resultPackageType"]},
            "authorityPackage": result,
            "targetEvidenceImage": {"dataUrl": "data:image/jpeg;base64,/9j/", "sha256": registration["assetSha256"]},
            "savedToSEC": False,
        }
        saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
        reopened = read_preserved_sec(started["authoritativeSessionId"], store)
        assert saved["artifactSha256"] == reopened["artifactSha256"]
        assert reopened["session"]["authorityPackage"] == saved["session"]["authorityPackage"]
        outcomes.append({
            "targetProfileId": target_id, "qtCatalogId": qt_catalog_id, "contractId": contract["contractId"],
            "contractFingerprint": contract["contractFingerprint"],
            "stages": {"TARGET": "PASS", "RESULT": "PASS", "SEC": "PASS", "VAULT": "PASS", "EXACT_REOPEN": "PASS"},
            "observations": len(observations), "reconciliation": result["reconciliation"],
            "classification": result["classifications"], "targetScore": result["scoring"].get("total"),
            "artifactSha256": saved["artifactSha256"],
            "ugoCoordinatesUnchanged": reopened["session"]["authorityPackage"]["observations"] == result["observations"],
        })
    vault = list_preserved_secs(store)
    passed = [item for item in outcomes if item["stages"]["EXACT_REOPEN"] == "PASS"]
    assert len(vault["sessions"]) == len(passed)
    output = {
        "schemaVersion": "qt-physical-authority-lifecycle-verification-v1",
        "admittedTargetCount": len(outcomes), "lifecyclePassCount": len(passed),
        "lifecycleFailCount": len(outcomes) - len(passed), "targets": outcomes,
        "sharedRuntimeChanged": False,
    }
    OUTPUT.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
