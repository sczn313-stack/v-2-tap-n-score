#!/usr/bin/env python3
"""Independent Backend lifecycle proof for an applied Shooter Experience batch."""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import sys
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))

from execution_authority import execute_authoritative_session  # noqa: E402
from preserved_sec_store import list_preserved_secs, preserve_sec, read_preserved_sec  # noqa: E402
from session_authority import prepare_session, start_session  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver, validate_contract_for_nn  # noqa: E402
from test_target_execution_scale_architecture import MemoryStore  # noqa: E402
from ugo_observation_classifier import classify  # noqa: E402


BASE_TIME = datetime(2026, 10, 12, 21, 0, tzinfo=timezone.utc)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_evidence(contract: dict[str, Any]) -> dict[str, Any]:
    registration = contract["components"]["registration"]["definition"]
    suffix = Path(registration["assetPath"]).suffix.lower()
    media_type = "image/png" if suffix == ".png" else "image/webp" if suffix == ".webp" else "image/jpeg"
    return {
        "sha256": registration["assetSha256"],
        "widthPx": int(registration.get("sourceImageWidthPx") or 1000),
        "heightPx": int(registration.get("sourceImageHeightPx") or 1000),
        "mediaType": media_type,
        "dataUrl": f"data:{media_type};base64,AA==",
    }


def interior(region: dict[str, Any]) -> tuple[float, float]:
    shape = region.get("shape")
    if shape in {"circle", "ellipse"}:
        return float(region["cx"]), float(region["cy"])
    if shape in {"rectangle", "rounded_rectangle"}:
        return (float(region["xMin"]) + float(region["xMax"])) / 2, (float(region["yMin"]) + float(region["yMax"])) / 2
    if shape == "polygon":
        points = region["points"]
        return sum(float(point[0]) for point in points) / len(points), sum(float(point[1]) for point in points) / len(points)
    raise AssertionError(f"unsupported_geometry:{shape}")


def scoring_observations(contract: dict[str, Any]) -> tuple[list[dict[str, float]], list[str]]:
    regions = contract["components"]["geometry"]["definition"].get("regions") or []
    assert regions, "scoring_regions_missing"
    selected = regions[:2] if len(regions) > 1 else [regions[0], regions[0]]
    observations = [{"xNorm": x, "yNorm": y} for x, y in (interior(region) for region in selected)]
    outside = None
    for step in range(0, 101, 5):
        for other in range(0, 101, 5):
            x, y = step / 100, other / 100
            if classify(regions, x, y, id_key="regionId")["classificationStatus"] == "unmapped":
                outside = (x, y)
                break
        if outside:
            break
    assert outside is not None, "outside_fixture_unavailable"
    observations.append({"xNorm": outside[0], "yNorm": outside[1]})
    expected = [str(region["regionId"]) for region in selected] + ["outside"]
    return observations, expected


def preserve(result: dict[str, Any], contract: dict[str, Any], session_id: str, store: MemoryStore, now: datetime, resolver: TargetExecutionContractResolver) -> tuple[str, dict[str, Any]]:
    artifact = {
        "sessionId": session_id,
        "authoritativeSessionId": session_id,
        "sessionIdAuthority": "backend",
        "matrixSnapshot": {
            "targetProfileId": result["target"]["id"],
            "missionFamily": result["missionFamily"],
            "resultPackageType": result["resultPackageType"],
        },
        "authorityPackage": result,
        "targetEvidenceImage": image_evidence(contract),
        "observations": result["observations"],
        "savedToSEC": True,
    }
    saved = preserve_sec({"session": artifact}, store, now=now, execution_contract_resolver=resolver)
    vault = list_preserved_secs(store)
    assert any(row["sessionId"] == session_id for row in vault["sessions"]), "vault_session_missing"
    reopened = read_preserved_sec(session_id, store)
    assert reopened["artifactSha256"] == saved["artifactSha256"], "exact_reopen_hash_drift"
    assert reopened["session"]["authorityPackage"] == result, "exact_reopen_result_drift"
    assert reopened["session"]["observations"] == result["observations"], "exact_reopen_observation_drift"
    return saved["artifactSha256"], reopened


def verify(row: dict[str, Any], ordinal: int, resolver: TargetExecutionContractResolver) -> dict[str, Any]:
    runtime_id = row["runtimeId"]
    contract = resolver.resolve(runtime_id, row["missionFamily"])
    profile = contract["targetProfile"]
    product = profile["product"]
    experience = product.get("shooterExperience") or {}
    registration = contract["components"]["registration"]["definition"]
    asset = DOCS / registration["assetPath"]
    stages = {key: "NOT_RUN" for key in ("LOAD", "TAP", "RESULT", "CONFIRM", "SEC", "VAULT", "EXACT_REOPEN")}

    assert profile["id"] == runtime_id, "target_identity_drift"
    assert experience.get("provenance", {}).get("masterNumber") == row["masterNumber"], "description_master_identity_drift"
    assert experience.get("provenance", {}).get("sku") == row["sku"], "description_sku_identity_drift"
    assert experience.get("description") == row["description"], "description_text_drift"
    assert asset.is_file(), "registered_artwork_missing"
    assert sha256(asset) == registration["assetSha256"], "registered_artwork_hash_mismatch"
    assert contract["missionFamily"] == row["missionFamily"], "mission_family_changed"
    assert contract["components"]["scoring"]["definition"].get("status") == row["scoringStatus"], "scoring_status_changed"
    assert len(contract["components"]["geometry"]["definition"].get("regions", [])) == row["governedRegionCount"], "geometry_changed"
    stages["LOAD"] = "PASS"

    if contract["missionFamily"] == "smartEvidenceCapture":
        assert contract["executor"]["id"] == "smart-evidence-capture"
        observations = [{"xNorm": 0.25, "yNorm": 0.25}, {"xNorm": 0.50, "yNorm": 0.50}, {"xNorm": 0.75, "yNorm": 0.75}]
        expected_regions = None
    elif contract["missionFamily"] == "targetScoring":
        contract = validate_contract_for_nn(contract)
        observations, expected_regions = scoring_observations(contract)
    else:
        raise AssertionError(f"unsupported_mission_family:{contract['missionFamily']}")

    now = BASE_TIME + timedelta(minutes=ordinal)
    store = MemoryStore()
    prepared = prepare_session({"targetId": runtime_id, "missionFamily": contract["missionFamily"]}, store, now=now, execution_contract_resolver=resolver)
    started = start_session(
        {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
        store,
        idempotency_key=f"episode64-connect-33-{ordinal:02d}",
        now=now,
        execution_contract_resolver=resolver,
    )
    session_id = started["authoritativeSessionId"]
    stages["TAP"] = "PASS"
    result = execute_authoritative_session(
        {"authoritativeSessionId": session_id, "evidence": {"imageEvidence": image_evidence(contract), "observations": observations, "shooterDeclaredComplete": True}},
        store,
        resolver=resolver,
    )
    assert result["target"]["id"] == runtime_id, "result_target_identity_drift"
    assert result["target"]["product"]["shooterExperience"] == experience, "result_description_missing"
    assert len(result["observations"]) == len(observations), "result_observation_loss"
    stages["RESULT"] = "PASS"

    if expected_regions is None:
        assert result["supportedAnalysis"] == {"impactCount": 3}, "evidence_result_incorrect"
        assert result["scoring"]["status"] == "not_applicable", "evidence_only_promoted_to_scoring"
        functional = {"capability": "Evidence Only", "impactCount": 3, "hitMissAccounting": "not_applicable"}
    else:
        actual = [item.get("regionId") or "outside" for item in result["classifications"]]
        assert actual == expected_regions, f"scoring_classification_drift:{expected_regions}:{actual}"
        assert result["scoring"]["observationCount"] == len(observations), "scoring_observation_count_drift"
        functional = {"capability": "Scoring/Zone", "expectedRegions": expected_regions, "actualRegions": actual, "scoring": result["scoring"]}
    stages["CONFIRM"] = "PASS"

    artifact_sha, reopened = preserve(result, contract, session_id, store, now, resolver)
    stages["SEC"] = "PASS"
    stages["VAULT"] = "PASS"
    assert reopened["session"]["authorityPackage"]["target"]["product"]["shooterExperience"] == experience, "reopen_description_drift"
    stages["EXACT_REOPEN"] = "PASS"
    return {
        "masterNumber": row["masterNumber"],
        "runtimeId": runtime_id,
        "targetName": product["name"],
        "publisher": profile["publisher"]["name"],
        "status": "PASS",
        "missionFamily": contract["missionFamily"],
        "contractFingerprint": contract["contractFingerprint"],
        "registeredArtwork": registration["assetPath"],
        "artworkSha256": registration["assetSha256"],
        "sessionId": session_id,
        "artifactSha256": artifact_sha,
        "functionalResult": functional,
        "stages": stages,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--connection-report", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    source = json.loads(args.connection_report.read_text(encoding="utf-8"))
    connected = [row for row in source["rows"] if row["status"] == "CONNECTED"]
    resolver = TargetExecutionContractResolver()
    rows = []
    for ordinal, row in enumerate(connected, start=1):
        try:
            rows.append(verify(row, ordinal, resolver))
        except Exception as error:
            rows.append({
                "masterNumber": row["masterNumber"],
                "runtimeId": row.get("runtimeId"),
                "targetName": row["targetName"],
                "status": "BLOCKED",
                "blocker": f"{type(error).__name__}:{error}",
            })
    report = {
        "schemaVersion": "sczn3.episode64.shooter-experience-batch-machine-proof.v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceConnectionReport": str(args.connection_report),
        "summary": {
            "targets": len(rows),
            "pass": sum(row["status"] == "PASS" for row in rows),
            "blocked": sum(row["status"] == "BLOCKED" for row in rows),
        },
        "governance": {
            "backendIsAuthority": True,
            "pixelIsAuthority": False,
            "evidenceOnlyIsScoring": False,
            "founderApprovalClaimed": False,
        },
        "rows": rows,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))
    if report["summary"]["blocked"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
