#!/usr/bin/env python3
"""Bind all 254 QT chairs to reusable Episode 64 Smart Target treatments.

This consumes preserved Episode 63 evidence. It performs no web research and
never promotes visible artwork into unpublished publisher rules.
"""
from __future__ import annotations

import hashlib
import html
import json
import sys
from collections import Counter
from copy import deepcopy
from pathlib import Path

import numpy as np
from PIL import Image


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))
from target_execution_contract import component_digest, validate_contract  # noqa: E402

LEG3 = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_LEG3_EXECUTION_MANIFEST.json"
CONTRACTS = BACKEND / "target_execution_contracts/contracts"
OUT = DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22"
AUTHORITY = BACKEND / "target_knowledge/qt_episode64_smart_target_authority.json"
MANIFEST = OUT / "QT_EP64_254_IMPLEMENTATION_MANIFEST.json"
REVIEW = OUT / "QT_EP64_FOUNDER_REVIEW.html"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def observed_image_structure(path: Path) -> dict:
    """Measure the actual registered face without assigning semantic meaning."""
    with Image.open(path) as image:
        image.load()
        width, height = image.size
        rgb = image.convert("RGB")
        rgb.thumbnail((192, 192))
        array = np.asarray(rgb, dtype=np.float32)
    h, w, _ = array.shape
    sample = max(1, min(h, w) // 16)
    corners = np.concatenate((
        array[:sample, :sample].reshape(-1, 3),
        array[:sample, -sample:].reshape(-1, 3),
        array[-sample:, :sample].reshape(-1, 3),
        array[-sample:, -sample:].reshape(-1, 3),
    ))
    background = np.median(corners, axis=0)
    delta = np.sqrt(np.sum((array - background) ** 2, axis=2))
    mask = delta >= 30.0
    ys, xs = np.where(mask)
    if len(xs):
        bbox = {
            "xMin": round(float(xs.min()) / w, 4), "yMin": round(float(ys.min()) / h, 4),
            "xMax": round(float(xs.max() + 1) / w, 4), "yMax": round(float(ys.max() + 1) / h, 4),
        }
        weights = delta[mask]
        centroid = {
            "xNorm": round(float(np.average((xs + 0.5) / w, weights=weights)), 4),
            "yNorm": round(float(np.average((ys + 0.5) / h, weights=weights)), 4),
        }
    else:
        bbox, centroid = None, None
    thirds = []
    for row in range(3):
        for column in range(3):
            y0, y1 = round(row * h / 3), round((row + 1) * h / 3)
            x0, x1 = round(column * w / 3), round((column + 1) * w / 3)
            tile = mask[y0:y1, x0:x1]
            thirds.append({
                "cell": f"r{row + 1}c{column + 1}",
                "contrastCoverage": round(float(tile.mean()), 4) if tile.size else 0.0,
            })
    return {
        "measurementAuthority": "sczn3_measured_from_registered_face_pixels",
        "semanticMeaningAttributed": False,
        "widthPx": width,
        "heightPx": height,
        "aspectRatio": round(width / height, 6),
        "cornerBackgroundRgb": [int(round(value)) for value in background],
        "contrastCoverage": round(float(mask.mean()), 4),
        "contrastBoundingBox": bbox,
        "contrastCentroid": centroid,
        "thirdsContrastDistribution": thirds,
    }


def intelligence_family(row: dict) -> str:
    family, group = row["behaviorFamily"], row["qtFamilyGroup"]
    if family == "DIAGNOSTIC_FEEDBACK":
        return "DIAGNOSTIC"
    if row["missionFamily"] == "zeroingCorrection" or family == "ZEROING_SIGHT_IN":
        return "ZEROING_GRID"
    if group == "CR_ACTIVE_SHOOTER_FAMILY":
        return "PHOTO_SCENARIO"
    if family == "HOSTAGE_THREAT_RELATIONSHIPS":
        return "HOSTAGE_NO_SHOOT"
    if family == "ANATOMY_VITAL_REGIONS" or group == "TQ_19E_AZ":
        return "ANATOMICAL_SPECIALIZED_ZONE"
    if family == "COMPETITION_SCORING":
        return "COMPETITION_SCORING"
    if family == "DISCRIMINATION_OBJECTS":
        return "OBJECT_SHAPE_COGNITIVE"
    if group in {"DSQ_FAMILY", "LKPD_DRILLS", "TRNG_FAMILY", "SQT_A1_FAMILY", "OPOTA_FAMILY", "PFC_TIER_FAMILY", "IALEFI_FAMILY"}:
        return "MULTI_STAGE_DRILL"
    if family == "REPEATED_OBJECT_COUNTING":
        return "DOT_OBJECT"
    if family == "BULLSEYE_MULTI_BULL":
        return "MULTI_AIM_AREA"
    if family == "B_FAMILY_SCORING":
        return "SCORED_RING_BULLSEYE"
    if family in {"M16_M4_QUALIFICATION", "VALUED_REGION_QUALIFICATION"}:
        return "QUALIFICATION_SILHOUETTE"
    return "EVIDENCE_PLAIN_SILHOUETTE"


def treatment(row: dict, contract: dict | None, observed: dict) -> dict:
    capability = row["executionCapability"]
    structured = contract is not None and contract["missionFamily"] == "targetScoring"
    scoring = contract["components"]["scoring"]["definition"] if structured else {}
    geometry = contract["components"]["geometry"]["definition"] if contract else {}
    region_rules = scoring.get("regionRules") or {}
    has_values = any(isinstance(rule.get("value"), (int, float)) and not isinstance(rule.get("value"), bool) for rule in region_rules.values())
    return {
        "schemaVersion": "sczn3-episode64-smart-target-treatment-v1",
        "intelligenceFamily": intelligence_family(row),
        "highestTruthfulCapability": capability,
        "truthLayers": {
            "publisherTruth": {
                "semanticStatus": row["semanticStatus"],
                "publishedRuleAuthority": deepcopy(scoring.get("publisherRuleAuthority")),
                "publishedValuesAvailable": has_values,
                "unresolved": row.get("unresolvedReason"),
                "rule": "Only source-backed publisher/governing semantics may score or qualify.",
            },
            "targetStructure": {
                "registeredGeometryStatus": "regions_available" if structured else "registered_image_plane_only",
                "registeredRegionCount": len(geometry.get("regions") or []),
                "registeredRegionIds": [item["regionId"] for item in geometry.get("regions") or []],
                "observedPhysicalStructure": observed,
                "rule": "Pixel measurements describe the face; they do not create publisher semantics.",
            },
            "sczn3MeasuredIntelligence": {
                "totalTapsFirst": True,
                "shotPatternCenter": "THE CENTER OF YOUR SHOT PATTERN",
                "distribution": True,
                "dispersion": True,
                "sameTargetComparison": True,
                "personalBest": True,
                "consistencyHistory": True,
                "publisherMeaningAttributed": False,
            },
        },
        "accounting": {
            "everyTapReconcilesExactlyOnce": True,
            "childRegionsAreSubsetsNotAdditionalTaps": True,
            "meaningfulBreakdown": "score_and_regions" if has_values else ("regions_or_objects" if structured else "measured_shot_pattern"),
        },
        "result": {
            "totalTaps": True,
            "publisherScore": has_values,
            "regionObjectBreakdown": structured,
            "shotPattern": True,
        },
        "sec": {"preserveAuthorityPackage": True, "preserveExactTaps": True, "preserveArtworkIdentity": True},
        "session": {"sameTargetComparisonAfterSecondSession": True, "centerMovement": True, "dispersionChange": True},
        "progress": {"tightestPatternPersonalBest": True, "scoreHistoryWhenGoverned": has_values},
        "unsupported": [
            "invented_score", "invented_qualification", "invented_sequence", "invented_timing",
            "invented_penalty", "invented_pass_threshold", "invented_tactical_or_anatomical_meaning",
        ],
    }


def card(row: dict, item: dict) -> str:
    if row["missionFamily"] == "zeroingCorrection":
        href = f"../../../shoot.html?target_profile_id={row['targetProfileId']}&missionFamily=zeroingCorrection&authorityPort=8118"
    else:
        href = f"../../../target-experience.html?missionFamily={row['missionFamily']}&target={row['targetProfileId']}&source=registered&authorityPort=8118"
    image = "../qt-printer13-visual-ingestion-2026-09-22/" + row["imageLocalPath"]
    unresolved = row.get("unresolvedReason") or "None"
    return f'''<a class="card" href="{html.escape(href)}"><b>#{row['visualStackOrdinal']}</b><img src="{html.escape(image)}" alt="{html.escape(row['productName'])}" loading="lazy"><strong>{html.escape(row['productName'])}</strong><span>{html.escape(item['intelligenceFamily'].replace('_', ' '))}</span><small>{html.escape(row['executionCapability'])}</small><em title="{html.escape(unresolved)}">Unresolved: {html.escape(unresolved)}</em></a>'''


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    leg3 = json.loads(LEG3.read_text())
    rows = leg3["surfaces"]
    if len(rows) != 254 or len({row["qtCatalogId"] for row in rows}) != 254:
        raise AssertionError("QT inventory is not 254 unique chairs")
    authority_rows, family_counts, capability_counts = [], Counter(), Counter()
    for row in rows:
        contract = None
        contract_path = DOCS / row["contractPath"] if row.get("contractPath") else None
        if contract_path:
            contract = json.loads(contract_path.read_text())
        asset = DOCS / row["assetPath"]
        if sha256(asset) != row["assetSha256"]:
            raise AssertionError(f"registered face hash mismatch: {row['qtCatalogId']}")
        observed = observed_image_structure(asset)
        if observed["widthPx"] != row["imageWidth"] or observed["heightPx"] != row["imageHeight"]:
            raise AssertionError(f"registered face dimensions mismatch: {row['qtCatalogId']}")
        spec = treatment(row, contract, observed)
        if contract:
            contract["authorityContractVersion"] = "QT-EPISODE64-SMART-TARGET-v1"
            contract["approval"] = {"status": "approved", "authorityId": "QT_EPISODE64_SMART_TARGET_AUTHORITY_2026_09_22", "approvedAt": "2026-09-22T00:00:00-04:00"}
            contract["effective"] = {"from": "2026-09-22T00:00:00-04:00", "until": None}
            contract["targetProfile"]["product"]["episode64IntelligenceFamily"] = spec["intelligenceFamily"]
            contract["components"]["geometry"]["definition"]["observedPhysicalStructure"] = observed
            contract["components"]["mission"]["definition"]["smartTargetTreatment"] = spec
            for component in contract["components"].values():
                component["digest"] = component_digest(component)
            contract.pop("contractFingerprint", None)
            validated = validate_contract(contract)
            contract_path.write_text(json.dumps(contract, indent=2) + "\n")
            contract_hash = sha256(contract_path)
            contract_fingerprint = validated["contractFingerprint"]
            geometry = deepcopy(contract["components"]["geometry"]["definition"])
        else:
            contract_hash = None
            contract_fingerprint = row["contractId"]
            geometry = {
                "authority": "inherited_mfam_zeroing_authority",
                "observedPhysicalStructure": observed,
                "registeredTargetProfileId": row["targetProfileId"],
            }
        item = {
            "chair": row["visualStackOrdinal"],
            "qtCatalogId": row["qtCatalogId"],
            "productName": row["productName"],
            "skuProductIdentifiers": row["skuProductIdentifiers"],
            "sourceUrl": row["sourceUrl"],
            "provenance": row["provenance"],
            "assetPath": row["assetPath"],
            "assetSha256": row["assetSha256"],
            "targetProfileId": row["targetProfileId"],
            "missionFamily": row["missionFamily"],
            "contractPath": row.get("contractPath"),
            "contractSha256": contract_hash,
            "contractFingerprint": contract_fingerprint,
            "behaviorFamily": row["behaviorFamily"],
            "qtFamilyGroup": row["qtFamilyGroup"],
            "semanticStatus": row["semanticStatus"],
            "unresolvedReason": row.get("unresolvedReason"),
            "intelligenceFamily": spec["intelligenceFamily"],
            "highestTruthfulCapability": row["executionCapability"],
            "geometry": geometry,
            "smartTargetTreatment": spec,
        }
        authority_rows.append(item)
        family_counts[spec["intelligenceFamily"]] += 1
        capability_counts[row["executionCapability"]] += 1

    authority = {
        "schemaVersion": "sczn3-qt-episode64-smart-target-authority-v1",
        "authorityId": "QT_EPISODE64_SMART_TARGET_AUTHORITY_2026_09_22",
        "status": "implemented_pending_independent_verification",
        "publisher": "Qualification Targets Inc",
        "chairCount": 254,
        "identityCount": len({item["qtCatalogId"] for item in authority_rows}),
        "contractCount": sum(item["contractPath"] is not None for item in authority_rows),
        "inheritedZeroingCount": sum(item["contractPath"] is None for item in authority_rows),
        "capabilityCounts": dict(sorted(capability_counts.items())),
        "intelligenceFamilyCounts": dict(sorted(family_counts.items())),
        "governingRules": {
            "backendOwnsTruth": True,
            "publisherTruthSeparateFromSczn3Measurement": True,
            "noPublishedValueNoInventedScore": True,
            "everyTapReconciles": True,
            "totalTapsFirst": True,
            "assumptionEqualsDrifting": True,
        },
        "chairs": authority_rows,
    }
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n")
    manifest = {
        "schemaVersion": "sczn3-qt-episode64-implementation-manifest-v1",
        "status": "IMPLEMENTED_PENDING_INDEPENDENT_VERIFICATION",
        "sourceHead": "cb5ba727399ee2b2e0d6484cdbd5f3a94602cd79",
        "chairs": 254,
        "contracts": authority["contractCount"],
        "inheritedZeroing": authority["inheritedZeroingCount"],
        "capabilityCounts": authority["capabilityCounts"],
        "intelligenceFamilyCounts": authority["intelligenceFamilyCounts"],
        "authorityPath": str(AUTHORITY.relative_to(DOCS)),
        "reviewPath": str(REVIEW.relative_to(DOCS)),
        "runtimeOwners": [
            "backend/executors/declarative_target_score.py",
            "backend/executors/smart_evidence_capture.py",
            "backend/preserved_sec_store.py",
            "target_execution_runtime.js",
        ],
        "exceptions": [],
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    cards = "".join(card(row, item) for row, item in zip(rows, authority_rows))
    counts = " · ".join(f"{name.replace('_', ' ')} {count}" for name, count in sorted(family_counts.items()))
    REVIEW.write_text(f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QT Episode 64 Founder Review</title><style>*{{box-sizing:border-box}}body{{margin:0;background:#080b10;color:#f6f7f9;font:12px system-ui}}header{{position:sticky;top:0;z-index:4;padding:10px 12px;background:#0d1420f2;border-bottom:1px solid #344154}}h1{{margin:0;font-size:20px}}p{{margin:3px 0;color:#b8c2cf}}main{{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;padding:5px}}.card{{position:relative;min-width:0;padding:4px;background:#141c27;border:1px solid #303e50;color:white;text-decoration:none}}.card:hover{{border-color:#f2c75b}}.card b{{position:absolute;padding:3px 6px;background:#05080cdd;font-size:18px}}img{{display:block;width:100%;height:158px;object-fit:contain;background:#fff}}strong,span,small,em{{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}span{{color:#f2c75b}}small{{color:#b9c5d3}}em{{color:#8f9dad;font-size:10px}}@media(max-width:850px){{main{{grid-template-columns:repeat(3,minmax(0,1fr))}}}}</style></head><body><header><h1>Episode 64 · QT 254 Founder Review</h1><p>Authority stored · runtime-bound contracts · click any chair to execute</p><p>{html.escape(counts)}</p></header><main>{cards}</main></body></html>''', encoding="utf-8")
    print(json.dumps({"chairs": 254, "contracts": authority["contractCount"], "capabilities": authority["capabilityCounts"], "families": authority["intelligenceFamilyCounts"]}, indent=2))


if __name__ == "__main__":
    main()
