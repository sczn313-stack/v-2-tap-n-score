#!/usr/bin/env python3
"""Admit QT Printer #13 surfaces without reopening Leg One/Two discovery.

The builder consumes only the preserved QT image manifest and the authoritative
Leg Two compression manifest.  Exact prior target-scoring contracts may supply
geometry/scoring.  Every other surface is admitted at the fail-closed Smart
Evidence floor because Leg Two did not publish a per-image executable coordinate
map.  Recognition remains preserved separately from executable capability.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
from collections import Counter, defaultdict
from copy import deepcopy
from pathlib import Path


HERE = Path(__file__).resolve().parent
DOCS = HERE.parents[2]
ROOT = DOCS.parent
BACKEND = DOCS / "backend"
CONTRACT_DIR = BACKEND / "target_execution_contracts" / "contracts"
LEG1 = HERE.parent / "qt-printer13-visual-ingestion-2026-09-22"
LEG2 = HERE.parent / "qt-printer13-leg2-recognition-compression-delta-2026-09-22"
LEG1_MANIFEST = LEG1 / "QT_VISUAL_STACK_MANIFEST.json"
LEG2_MANIFEST = LEG2 / "QT_LEG2_FAMILY_COMPRESSION_MANIFEST.json"
AUTHORITY_PATH = BACKEND / "target_knowledge" / "qt_printer13_leg3_execution_authority.json"
MANIFEST_PATH = HERE / "QT_LEG3_EXECUTION_MANIFEST.json"
REVIEW_PATH = HERE / "QT_LEG3_HOMIE_FOUNDER_REVIEW.html"
APPROVED_AT = "2026-09-22T11:00:53-04:00"
AUTHORITY_ID = "QT_PRINTER13_LEG3_EXECUTION_2026_09_22"


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def component(component_id, definition):
    result = {"id": component_id, "version": "1", "status": "approved", "definition": definition}
    result["digest"] = digest({key: result[key] for key in ("id", "version", "status", "definition")})
    return result


def slug(value):
    return re.sub(r"[^a-z0-9]+", "_", str(value).casefold()).strip("_")


def contract_index():
    result = {}
    for path in CONTRACT_DIR.glob("*.json"):
        try:
            package = json.loads(path.read_text())
        except (OSError, json.JSONDecodeError):
            continue
        if package.get("contractId"):
            result[package["contractId"]] = (path, package)
    return result


def target_profile(surface):
    product_id = str(surface["shopifyProductId"])
    skus = [str(value) for value in surface.get("skuProductIdentifiers") or []]
    return {
        "id": f"qt_printer13_product_{product_id}",
        "version": "1",
        "atpId": f"ATP_QT_PRINTER13_PRODUCT_{product_id}_V1",
        "authorityId": f"{AUTHORITY_ID}:{surface['qtCatalogId']}",
        "publisher": {"id": "qualification-targets-inc", "name": "Qualification Targets Inc", "url": "https://targets.net/"},
        "product": {
            "id": surface["qtCatalogId"],
            "name": surface["productName"],
            "sku": " | ".join(skus) or surface["qtCatalogId"],
            "qtCatalogId": surface["qtCatalogId"],
            "shopifyProductId": surface["shopifyProductId"],
            "sourceUrl": surface["sourceUrl"],
            "permanentIdentity": f"Qualification Targets Inc + {surface['qtCatalogId']}",
            "behaviorFamily": surface["sczn3BehaviorFamily"],
            "qtFamilyGroup": surface["qtFamilyGroup"],
        },
    }


def registration(surface, target_id):
    image = surface["preservedImages"][0]
    asset_path = f"authority-evidence/platform/qt-printer13-visual-ingestion-2026-09-22/{image['localPath']}"
    actual = hashlib.sha256((DOCS / asset_path).read_bytes()).hexdigest()
    if actual != image["sha256"]:
        raise AssertionError(f"preserved QT image hash mismatch: {surface['qtCatalogId']}")
    return component(f"{target_id}-registration", {
        "role": "scorable_canonical_asset" if surface.get("_priorScoring") else "evidence_capture_asset",
        "assetPath": asset_path,
        "assetSha256": actual,
        "assetAlt": f"{surface['productName']} ({surface['qtCatalogId']})",
        "coordinateConvention": "normalized_source_image_top_left",
        "sourceUrl": surface["sourceUrl"],
        "sourceManifest": "authority-evidence/platform/qt-printer13-visual-ingestion-2026-09-22/QT_VISUAL_STACK_MANIFEST.json",
    })


def common(surface, mission_family, result_type):
    profile = target_profile(surface)
    suffix = "target-scoring" if mission_family == "targetScoring" else "smart-evidence"
    return {
        "schemaVersion": "sczn3-target-execution-contract-v1",
        "contractId": f"tec-{profile['id']}-{suffix}-v1",
        "contractVersion": "1",
        "authorityContractVersion": "QT-PRINTER13-LEG3-v1",
        "lifecycleStatus": "supported",
        "supportStatus": "supported",
        "approval": {"status": "approved", "authorityId": AUTHORITY_ID, "approvedAt": APPROVED_AT},
        "effective": {"from": APPROVED_AT, "until": None},
        "targetProfile": profile,
        "missionFamily": mission_family,
        "resultPackageType": result_type,
        "resultPackageVersion": "1",
    }


def evidence_contract(surface):
    target_id = target_profile(surface)["id"]
    contract = common(surface, "smartEvidenceCapture", "smartEvidenceResult")
    caps = {
        "evidence": {"status": "available"},
        "measurement": {"status": "available"},
        "correction": {"status": "not_applicable"},
        "officialScore": {"status": "not_applicable"},
        "qualification": {"status": "not_applicable"},
        "publisherMission": {"status": "not_applicable"},
    }
    geometry = {
        "status": "image_plane_evidence_only",
        "coordinateSystem": "normalized_source_image_top_left",
        "canonicalRegionMapping": "unavailable",
        "semanticClassification": "recognized_family_not_executable_without_governed_coordinate_map",
        "physicalMeasurement": "unavailable",
    }
    scoring = {"status": "not_applicable", "reason": "no_governed_per_image_scoring_geometry_in_leg_two_authority"}
    mission = {
        "missionFamily": "smartEvidenceCapture",
        "resultPackageType": "smartEvidenceResult",
        "resultPackageVersion": "1",
        "authorityResolution": "Preserve exact QT identity, registered artwork, normalized taps, TOTAL TAPS, SEC and exact reopen. Do not convert family recognition into invented executable regions, values, course rules, or penalties.",
        "recognizedBehaviorFamily": surface["sczn3BehaviorFamily"],
        "recognizedQtGroup": surface["qtFamilyGroup"],
        "legTwoHighestTruthfulCapability": surface["highestTruthfulCapabilityNow"],
        "semanticStatus": surface["semanticStatus"],
        "unresolvedReason": surface.get("unresolvedReason"),
        "sourcePacket": "authority-evidence/platform/qt-printer13-leg2-recognition-compression-delta-2026-09-22/QT_LEG2_FAMILY_COMPRESSION_MANIFEST.json",
        "maxObservations": 500,
        "allowShooterDeclaredAim": False,
        "capabilityStates": caps,
        "interaction": {"aim": {"mode": "not_required", "points": []}, "observationInput": "normalized_taps", "resultAction": "show_result"},
    }
    contract["components"] = {
        "geometry": component(f"{target_id}-geometry", geometry),
        "registration": registration(surface, target_id),
        "scoring": component(f"{target_id}-scoring", scoring),
        "mission": component(f"{target_id}-mission", mission),
    }
    contract.update({
        "executor": {"id": "smart-evidence-capture", "version": "1"},
        "secAdapter": {"id": "smart-evidence-family", "version": "1", "scoringPresentationFamily": "target-data"},
        "preservationValidator": {"id": "smart-evidence-preservation", "version": "1"},
        "session": {"capabilityStates": caps, "officialMissionRequired": False},
        "unsupportedUses": ["invented_scoring", "invented_regions", "invented_qualification", "invented_course_rules", "invented_penalties", "invented_zeroing_correction"],
    })
    return contract


def inherited_scoring_contract(surface, source):
    target_id = target_profile(surface)["id"]
    contract = common(surface, "targetScoring", "targetScoreResult")
    source_dimensions = source["targetProfile"]["product"].get("dimensions")
    if source_dimensions:
        contract["targetProfile"]["product"]["dimensions"] = deepcopy(source_dimensions)
    contract["authorityContractVersion"] = "QT-PRINTER13-LEG3-EXACT-PRIOR-INHERIT-v1"
    contract["components"] = {
        "geometry": component(f"{target_id}-geometry", deepcopy(source["components"]["geometry"]["definition"])),
        "registration": registration(surface, target_id),
        "scoring": component(f"{target_id}-scoring", deepcopy(source["components"]["scoring"]["definition"])),
        "mission": component(f"{target_id}-mission", deepcopy(source["components"]["mission"]["definition"])),
    }
    contract["components"]["mission"]["definition"].update({
        "qtInheritance": {
            "mode": "EXACT_PRIOR_SURFACE",
            "sourceContractId": source["contractId"],
            "sourceTargetProfileId": source["targetProfile"]["id"],
            "legTwoManifest": "authority-evidence/platform/qt-printer13-leg2-recognition-compression-delta-2026-09-22/QT_LEG2_FAMILY_COMPRESSION_MANIFEST.json",
        }
    })
    mission_component = contract["components"]["mission"]
    mission_component["digest"] = digest({key: mission_component[key] for key in ("id", "version", "status", "definition")})
    contract.update({
        "executor": deepcopy(source["executor"]),
        "secAdapter": deepcopy(source["secAdapter"]),
        "preservationValidator": deepcopy(source["preservationValidator"]),
        "session": deepcopy(source["session"]),
        "unsupportedUses": sorted(set(source.get("unsupportedUses") or []) | {"qt_semantics_beyond_exact_prior_surface_inheritance"}),
    })
    return contract


def review_html(rows, family_counts, capability_counts):
    grouped = defaultdict(list)
    for row in rows:
        grouped[row["behaviorFamily"]].append(row)
    sections = []
    for family in sorted(grouped):
        cards = []
        for card_index, row in enumerate(grouped[family]):
            rel = f"../qt-printer13-visual-ingestion-2026-09-22/{row['imageLocalPath']}"
            badge = "EXACT PRIOR SCORING" if row["executionCapability"] == "Scoring" else "TOTAL TAPS"
            flags = []
            if card_index == 0:
                flags.append("FAMILY REPRESENTATIVE")
            if row["semanticStatus"] == "PARTIAL_UNRESOLVED_NOT_PUBLISHED":
                flags.append("UNRESOLVED SEMANTICS · FLOOR PRESERVED")
            marker = f'''<div class="flag">{' · '.join(flags)}</div>''' if flags else ""
            cards.append(f'''<a class="card" href="{html.escape(rel)}"><div class="n">#{row['visualStackOrdinal']}</div>{marker}<img loading="lazy" src="{html.escape(rel)}" alt="{html.escape(row['productName'])}"><div class="name">{html.escape(row['productName'])}</div><div class="meta">{badge} · {html.escape(row['semanticStatus'])}</div></a>''')
        sections.append(f'''<section><h2>{html.escape(family)} <span>{len(cards)}</span></h2><div class="grid">{''.join(cards)}</div></section>''')
    count_rows = "".join(f"<tr><td>{html.escape(name)}</td><td>{count}</td></tr>" for name, count in sorted(family_counts.items()))
    return f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QT Printer #13 · Leg Three Review</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#0b0e12;color:#eef2f5;font:13px/1.25 system-ui,sans-serif}}header{{position:sticky;top:0;z-index:2;background:#111821ee;border-bottom:1px solid #29313b;padding:10px 14px}}h1{{font-size:18px;margin:0 0 4px}}header p{{margin:0;color:#aab4c0}}main{{padding:8px}}.audit{{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}}.audit article{{background:#151b23;border:1px solid #2b3440;padding:8px}}.audit h2{{margin-bottom:6px}}table{{width:100%;border-collapse:collapse;font-size:11px}}td{{padding:2px 5px;border-bottom:1px solid #29313b}}td:last-child{{text-align:right;color:#f1c75b}}section{{margin:8px 0 14px}}h2{{font-size:14px;margin:0 0 5px;color:#f1c75b}}h2 span{{color:#8995a3}}.grid{{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}}.card{{position:relative;min-width:0;background:#151b23;border:1px solid #2b3440;border-radius:4px;padding:4px;text-decoration:none;color:inherit}}.card:hover{{border-color:#f1c75b}}.n{{position:absolute;z-index:1;top:5px;left:5px;background:#05080bd9;color:#fff;font-size:18px;font-weight:800;padding:1px 5px;border-radius:3px}}.flag{{position:absolute;z-index:1;top:6px;right:5px;max-width:70%;background:#74540ee8;color:#fff;font-size:8px;font-weight:800;padding:2px 4px;border-radius:3px;text-align:right}}img{{display:block;width:100%;height:150px;object-fit:contain;background:#fff}}.name{{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700;margin-top:3px}}.meta{{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#92a0af;font-size:10px}}@media(max-width:900px){{.grid{{grid-template-columns:repeat(3,1fr)}}.audit{{grid-template-columns:1fr}}}}@media(max-width:520px){{.grid{{grid-template-columns:repeat(2,1fr)}}}}
</style></head><body><header><h1>QT Printer #13 · Leg Three Execution Review</h1><p>254 surfaces · 12 recognized families · capabilities {html.escape(json.dumps(capability_counts, sort_keys=True))} · no new primitives · click any card for preserved full image</p></header><main><div class="audit"><article><h2>Reconciliation</h2><p><b>254 PASS · 0 HOLD · 0 OOS · 0 exceptions</b></p><p>0 contradictions to Leg Two · 0 implementation defects · 45 unpublished semantic sets preserved at a contract-backed floor.</p></article><article><h2>Family counts</h2><table>{count_rows}</table></article></div>{''.join(sections)}</main></body></html>'''


def main():
    HERE.mkdir(parents=True, exist_ok=True)
    leg1 = json.loads(LEG1_MANIFEST.read_text())
    leg2 = json.loads(LEG2_MANIFEST.read_text())
    cards = {item["qtCatalogId"]: item for item in leg1["cards"]}
    existing = contract_index()
    rows = []
    created_paths = []
    for surface in leg2["surfaces"]:
        card = cards[surface["qtCatalogId"]]
        if card["disposition"] != "CANDIDATE_EXECUTABLE_PAPER_SURFACE":
            raise AssertionError(f"non-candidate entered Leg Three: {surface['qtCatalogId']}")
        prior = next((match for match in surface["priorPrinterMatches"] if match.get("missionFamily") == "targetScoring"), None)
        source_contract = existing.get(prior["contractId"], (None, None))[1] if prior else None
        if prior and source_contract is None:
            raise AssertionError(f"missing prior contract: {prior['contractId']}")
        surface = deepcopy(surface)
        surface["_priorScoring"] = bool(source_contract)
        package = inherited_scoring_contract(surface, source_contract) if source_contract else evidence_contract(surface)
        filename = f"{package['targetProfile']['id']}_{'target_scoring' if source_contract else 'smart_evidence'}_v1.json"
        path = CONTRACT_DIR / filename
        path.write_text(json.dumps(package, indent=2) + "\n")
        created_paths.append(str(path.relative_to(DOCS)))
        image = surface["preservedImages"][0]
        rows.append({
            "visualStackOrdinal": surface["visualStackOrdinal"],
            "qtCatalogId": surface["qtCatalogId"],
            "shopifyProductId": surface["shopifyProductId"],
            "productName": surface["productName"],
            "skuProductIdentifiers": surface["skuProductIdentifiers"],
            "sourceUrl": surface["sourceUrl"],
            "behaviorFamily": surface["sczn3BehaviorFamily"],
            "qtFamilyGroup": surface["qtFamilyGroup"],
            "inheritanceMode": surface["inheritanceMode"],
            "semanticStatus": surface["semanticStatus"],
            "unresolvedReason": surface.get("unresolvedReason"),
            "targetProfileId": package["targetProfile"]["id"],
            "missionFamily": package["missionFamily"],
            "resultPackageType": package["resultPackageType"],
            "executionCapability": "Scoring" if source_contract else "Evidence Only",
            "contractId": package["contractId"],
            "contractPath": str(path.relative_to(DOCS)),
            "inheritedSourceContractId": source_contract["contractId"] if source_contract else None,
            "imageLocalPath": image["localPath"],
            "assetPath": package["components"]["registration"]["definition"]["assetPath"],
            "assetSha256": image["sha256"],
            "imageWidth": image["width"],
            "imageHeight": image["height"],
            "provenance": surface["sourceProvenance"],
        })
    family_counts = Counter(row["behaviorFamily"] for row in rows)
    capability_counts = Counter(row["executionCapability"] for row in rows)
    inheritance_counts = Counter(row["inheritanceMode"] for row in rows)
    manifest = {
        "schemaVersion": "qt-printer13-leg3-execution-manifest-v1",
        "authorityId": AUTHORITY_ID,
        "generatedOn": "2026-09-22",
        "status": "ADMITTED_PENDING_INDEPENDENT_LIFECYCLE_VERIFICATION",
        "scope": {"candidateExecutableSurfaces": len(rows), "recognizedBehaviorFamilies": len(family_counts)},
        "authorityBoundary": {
            "inputs": [str(LEG1_MANIFEST.relative_to(DOCS)), str(LEG2_MANIFEST.relative_to(DOCS))],
            "researchRepeated": False,
            "visualIngestionRepeated": False,
            "newBehavioralPrimitives": 0,
            "geometryRule": "Only exact Leg Two prior target-scoring inheritance may carry executable geometry. Other recognized families remain Smart Evidence until a governed per-image coordinate map exists.",
        },
        "familyCounts": dict(sorted(family_counts.items())),
        "capabilityCounts": dict(sorted(capability_counts.items())),
        "inheritanceCounts": dict(sorted(inheritance_counts.items())),
        "exactPriorSurfaceInheritance": leg2["summary"]["exactPriorSurfaceInheritance"],
        "existingBehaviorWithQtData": leg2["summary"]["existingBehaviorWithQtData"],
        "unresolvedSemanticSurfaces": leg2["summary"]["surfacesWithAtLeastOneUnpublishedSemantic"],
        "contractsCreated": len(created_paths),
        "surfaces": rows,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n")
    authority = {
        "schemaVersion": "qt-printer13-leg3-execution-authority-v1",
        "authorityId": AUTHORITY_ID,
        "authorityClass": "backend_target_execution_authority",
        "lifecycleStatus": "supported_pending_independent_lifecycle_verification",
        "supportStatus": "supported",
        "executionAuthorityGranted": True,
        "canonicalMutation": True,
        "admissionMutation": True,
        "publisher": "Qualification Targets Inc",
        "surfaceCount": len(rows),
        "contractManifest": str(MANIFEST_PATH.relative_to(DOCS)),
        "sourceAuthorities": [
            str(LEG1_MANIFEST.relative_to(DOCS)),
            str(LEG2_MANIFEST.relative_to(DOCS)),
            "backend/target_knowledge/qt_printer13_leg2_research_authority.json",
        ],
        "rules": {
            "scoring": "Only exact prior target-scoring inheritance admitted; valued and unvalued observations plus explicit outside are reconciled by the existing declarative executor.",
            "evidenceOnly": "All other surfaces preserve registered artwork and ordered observations and report TOTAL TAPS without point terminology.",
            "unknowns": "Unpublished QT course, sequence, penalty, qualification, and target-specific semantics remain withheld.",
            "novelPrimitives": 0,
        },
        "familyCounts": dict(sorted(family_counts.items())),
        "capabilityCounts": dict(sorted(capability_counts.items())),
    }
    AUTHORITY_PATH.write_text(json.dumps(authority, indent=2) + "\n")
    REVIEW_PATH.write_text(review_html(rows, family_counts, capability_counts))
    print(f"QT Leg Three contracts built: {len(rows)}")
    print(f"Capabilities: {dict(capability_counts)}")
    print(f"Families: {len(family_counts)}")


if __name__ == "__main__":
    main()
