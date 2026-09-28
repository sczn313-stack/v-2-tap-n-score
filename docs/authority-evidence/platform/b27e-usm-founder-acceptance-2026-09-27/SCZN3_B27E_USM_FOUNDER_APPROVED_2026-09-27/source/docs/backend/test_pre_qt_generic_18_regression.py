#!/usr/bin/env python3
"""Independent authority/lifecycle regression for the 18 pre-QT generic targets."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import execute_authoritative_session
from preserved_sec_store import preserve_sec, read_preserved_sec
from session_authority import prepare_session, start_session
from target_execution_contract import runtime_resolver
from test_target_execution_scale_architecture import MemoryStore


ROOT = Path(__file__).resolve().parents[1]
COHORT = json.loads(
    (ROOT / "authority-evidence/platform/scale-batch-1-2026-09-08/SCALE_BATCH_1_COHORT.json").read_text(encoding="utf-8")
)["targets"]
TARGETS = [item for item in COHORT if item["runtimeType"] == "targetScoring"]
NOW = datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)


def contains(region, x, y):
    shape = region["shape"]
    if shape == "circle":
        return (x - region["cx"]) ** 2 + (y - region["cy"]) ** 2 <= region["radius"] ** 2
    if shape == "ellipse":
        return ((x - region["cx"]) / region["radiusX"]) ** 2 + ((y - region["cy"]) / region["radiusY"]) ** 2 <= 1
    if shape == "rectangle":
        return region["xMin"] <= x <= region["xMax"] and region["yMin"] <= y <= region["yMax"]
    if shape == "polygon":
        inside = False
        points = region["points"]
        previous = points[-1]
        for current in points:
            x1, y1 = previous
            x2, y2 = current
            crosses = (y1 > y) != (y2 > y)
            if crosses and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                inside = not inside
            previous = current
        return inside
    raise AssertionError(f"unsupported independent test shape: {shape}")


def bounds(region):
    shape = region["shape"]
    if shape == "circle":
        return region["cx"] - region["radius"], region["cy"] - region["radius"], region["cx"] + region["radius"], region["cy"] + region["radius"]
    if shape == "ellipse":
        return region["cx"] - region["radiusX"], region["cy"] - region["radiusY"], region["cx"] + region["radiusX"], region["cy"] + region["radiusY"]
    if shape == "rectangle":
        return region["xMin"], region["yMin"], region["xMax"], region["yMax"]
    xs = [point[0] for point in region["points"]]
    ys = [point[1] for point in region["points"]]
    return min(xs), min(ys), max(xs), max(ys)


def independent_probe(regions):
    """Choose a deliberately off-center point with an unambiguous authority result."""
    if not regions:
        return .317, .413, "outside"
    target = max(regions, key=lambda region: int(region.get("priority", 0)))
    left, top, right, bottom = bounds(target)
    for fx, fy in ((.37, .63), (.61, .39), (.43, .71), (.29, .47), (.67, .53), (.5, .5)):
        x, y = left + (right - left) * fx, top + (bottom - top) * fy
        matches = [region for region in regions if contains(region, x, y)]
        if not matches:
            continue
        highest = max(int(region.get("priority", 0)) for region in matches)
        winners = [region for region in matches if int(region.get("priority", 0)) == highest]
        if len(winners) == 1 and winners[0]["regionId"] == target["regionId"]:
            assert abs(x - .5) > .001 or abs(y - .5) > .001
            return x, y, target["regionId"]
    raise AssertionError(f"no independent off-center probe for {target['regionId']}")


def canonical(contract, image, x, y):
    return {
        "schemaVersion": "sczn3.ugo.normalized-source-image-point.v1",
        "coordinateSystem": "normalized_source_image_top_left",
        "targetProfileId": contract["targetProfile"]["id"],
        "sourceImageSha256": image["sha256"],
        "sourceImageWidthPx": image["widthPx"],
        "sourceImageHeightPx": image["heightPx"],
        "xNorm": x,
        "yNorm": y,
    }


def run_one(target, contract, store, resolver):
    geometry = contract["components"]["geometry"]["definition"]
    scoring = contract["components"]["scoring"]["definition"]
    x, y, expected_region = independent_probe(geometry.get("regions") or [])
    image = {
        "sha256": contract["components"]["registration"]["definition"]["assetSha256"],
        "widthPx": 1403,
        "heightPx": 997,
        "mediaType": "image/jpeg",
        "dataUrl": "data:image/jpeg;base64,/9j/2Q==",
    }
    point = {"xNorm": x, "yNorm": y, "canonicalTargetCoordinate": canonical(contract, image, x, y)}
    prepared = prepare_session(
        {"targetId": target["targetProfileId"], "missionFamily": "targetScoring"},
        store,
        now=NOW,
        execution_contract_resolver=resolver,
    )
    started = start_session(
        {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
        store,
        idempotency_key=f"pre-qt-generic-18-{target['ordinal']}",
        now=NOW,
        execution_contract_resolver=resolver,
    )
    evidence = {"imageEvidence": image, "observations": [point]}
    if started["interactionContract"]["aim"]["mode"] == "shooter_declared":
        evidence["shooterDeclaredAimPoint"] = {"xNorm": .271, "yNorm": .619}
    result = execute_authoritative_session(
        {"authoritativeSessionId": started["authoritativeSessionId"], "evidence": evidence},
        store,
        resolver=resolver,
    )
    assert result["target"]["id"] == target["targetProfileId"]
    assert result["missionFamily"] == "targetScoring"
    assert result["scoring"]["model"] == scoring["model"]
    assert result["scoring"]["status"] == ("not_applicable" if scoring["model"] == "not_applicable" else "complete")
    assert result["reconciliation"]["status"] == "reconciled"
    assert result["reconciliation"]["countsMatch"] is True
    observed = result["classifications"][0]
    assert observed["regionId"] == expected_region
    assert observed["canonicalTargetCoordinate"] == point["canonicalTargetCoordinate"]
    if scoring["model"] != "not_applicable":
        expected_rule = (scoring.get("regionRules") or {}).get(expected_region, scoring["outsideRule"])
        assert observed["label"] == expected_rule["label"]
        assert observed["value"] == expected_rule.get("value")

    artifact = {
        "sessionId": started["authoritativeSessionId"],
        "authoritativeSessionId": started["authoritativeSessionId"],
        "sessionIdAuthority": "backend",
        "matrixSnapshot": {"targetProfileId": target["targetProfileId"], "missionFamily": "targetScoring", "resultPackageType": result["resultPackageType"]},
        "authorityPackage": result,
        "targetEvidenceImage": image,
        "savedToSEC": False,
    }
    saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
    reopened = read_preserved_sec(started["authoritativeSessionId"], store)
    assert saved["artifactSha256"] == reopened["artifactSha256"]
    reopened_result = reopened["session"]["authorityPackage"]
    assert reopened_result["target"] == result["target"]
    assert reopened_result["scoring"] == result["scoring"]
    assert reopened_result["classifications"] == result["classifications"]
    assert reopened["session"]["targetEvidenceImage"]["sha256"] == image["sha256"]
    return target["productName"], scoring["model"]


def main():
    assert len(TARGETS) == 18
    resolver, store = runtime_resolver(), MemoryStore()
    contracts = {item["targetProfile"]["id"]: item for item in resolver.contracts()}
    results = [run_one(target, contracts[target["targetProfileId"]], store, resolver) for target in TARGETS]
    assert len(results) == 18
    print("PASS pre-QT generic backend authority/lifecycle: 18/18")
    for name, model in results:
        print(f"- {name}: {model} · authority semantics/UGO/SEC preservation/exact data reopen PASS")


if __name__ == "__main__":
    main()
