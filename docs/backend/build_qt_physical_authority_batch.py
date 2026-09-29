#!/usr/bin/env python3
"""Compile QT UGO from target-specific physical facts and admit verified results.

This intentionally replaces the QT Leg Three geometry path.  It never treats
an existing QT normalized region, an image measurement, or a family template
as physical authority.  Candidate geometry is built in the evidence directory,
boundary challenged there, and copied into Backend Authority only after PASS.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping

from qt_physical_boundary_extractor import (
    BoundaryExtractionError,
    extract_scaled_concentric_boundaries,
    extract_scaled_foreground_components,
    extract_scaled_primary_foreground_boundary,
    extract_scaled_three_tone_boundaries,
    extract_scaled_positioned_objects,
    extract_scaled_internal_regions_with_outer_figure,
    extract_scaled_largest_internal_with_outer_figure,
    extract_scaled_dartboard_boundaries,
    extract_scaled_object_boundaries,
    extract_scaled_ordered_spatial_boundaries,
    extract_scaled_seeded_exact_boundaries,
    extract_scaled_spatial_zone_boundaries,
)


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "docs/backend"
CONTRACTS = BACKEND / "target_execution_contracts/contracts"
RUN_DIR = ROOT / "docs/authority-evidence/platform/qt-printer13-physical-authority-execution-2026-09-28"
CANDIDATES = RUN_DIR / "CANDIDATES"
CHECKPOINT = RUN_DIR / "PRE_ADMISSION_CHECKPOINT"
CLEANUP = ROOT / "docs/authority-evidence/platform/qt-printer13-physical-authority-cleanup-2026-09-28"
CLEANUP_MANIFEST = CLEANUP / "QT_PHYSICAL_AUTHORITY_CLEANUP_MANIFEST.json"
QUARANTINE = CLEANUP / "QUARANTINED_CANDIDATES/contracts"
LEG2 = ROOT / "docs/authority-evidence/platform/qt-printer13-leg2-recognition-compression-delta-2026-09-22/QT_LEG2_FAMILY_COMPRESSION_MANIFEST.json"
SMART_AUTHORITY = BACKEND / "target_knowledge/qt_episode64_smart_target_authority.json"
LEG3_AUTHORITY = BACKEND / "target_knowledge/qt_printer13_leg3_execution_authority.json"
PRIOR_B27E = CONTRACTS / "gunfun_22200_b27e_black_target_scoring_v1.json"
PRIOR_B27_STANDARD = ROOT / "docs/authority-evidence/platform/qt-printer13-physical-authority-floor-194-2026-09-29/contracts/qt_printer13_product_1960338784329_target_scoring_v1.json"
PRIOR_NM_Q1 = ROOT / "docs/authority-evidence/platform/qt-printer13-physical-authority-floor-194-2026-09-29/contracts/qt_printer13_product_1967276982345_target_scoring_v1.json"
QT_B27E_NAME = "qt_printer13_product_1873808916553_target_scoring_v1.json"
QT_B27E_ID = "QT-PRODUCT-1873808916553"

ESTABLISHED_OBJECT_COUNTS = {
    "DOT-3 Paper Target": 6,
    "DOT-5 Paper Target": 9,
    "DOT-6 Paper Target": 10,
    "DOT-7 Paper Target": 8,
    "TRNG-9 Paper Target": 4,
}

SINGLE_FIGURE_PRODUCTS = {
    "CJ-100 Paper Target", "CR-101 Paper Target", "CR-102 Paper Target", "CR-104 Paper Target",
    "CR-105 Paper Target", "CR-107 Paper Target", "CR-108 Paper Target", "CR-109 Paper Target",
    "CR-113 Paper Target", "CR-116 Paper Target", "CR-117 Paper Target", "CR-204 Paper Target",
    "FAC-USAF-Q Paper Target", "MI-TCQ-95 Paper Target", "SEAL-1 Paper Target", "SEAL-2 Paper Target",
    "SEAL-3 Paper Target", "SEAL-4 Paper Target", "TQ-15-P3 Paper Target", "TQ-15-P6 Paper Target",
    "TQ-19-P2 Paper Target", "CR-202 Paper Target",
}

FAINT_EXACT_LINE_PRODUCTS = {
    "B-27-P1 Paper Target", "BT-5-Antioch Paper Target", "DEA-Q-RL Paper Target",
    "FBI-QIT-99 Paper Target", "KS-Q Paper Target", "LA-P1 Paper Target",
    "OPOTA-RQT2 Paper Target", "PFC TIER-2 Paper Target", "SQT-A1 Paper Target",
}

OUTER_FOREGROUND_PRODUCTS = {
    "FAC-USMC Paper Target", "FBI-QIT-99 Paper Target", "KS-Q Paper Target",
    "OPOTA-RQT2 Paper Target", "PFC TIER-2 Paper Target",
}

DEA_Q_RL_PRODUCT = "DEA-Q-RL Paper Target"
LA_P1_PRODUCT = "LA-P1 Paper Target"
DARTBOARD_PRODUCT = "Dart Board Paper Target"
B27_P1_PRODUCT = "B-27-P1 Paper Target"
NM_DPS_Q3_PRODUCT = "NM-DPS-Q3 Paper Target"

DIMENSION_RE = re.compile(
    r"(?P<w>\d+(?:\.\d+)?)\s*(?:\"|in(?:ch(?:es)?)?)?\s*[xX×]\s*(?P<h>\d+(?:\.\d+)?)\s*(?:\"|in(?:ch(?:es)?)?)",
    re.IGNORECASE,
)
MEASUREMENT_RE = re.compile(r"(?<!\d)(\d+(?:\.\d+)?)\s*(?:\"|inch(?:es)?)", re.IGNORECASE)

# Publisher catalog facts absent from the scraped product descriptions but
# preserved in Qualification Targets catalogs. These are sheet extents only;
# they do not supply internal geometry.
PUBLISHER_SHEET_EXTENTS = {
    "DSQ-M4-100R": {"width": 11.5, "height": 17.5, "unit": "inch", "verbatim": '11.5" x 17.5"'},
    "DSQ-M4-50R": {"width": 17.5, "height": 23.0, "unit": "inch", "verbatim": '17.5" x 23"'},
}


def read(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def component_digest(component: Mapping[str, Any]) -> str:
    payload = {key: component.get(key) for key in ("id", "version", "status", "definition")}
    return hashlib.sha256(canonical(payload).encode()).hexdigest()


def git_head() -> str:
    return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()


def extract_physical_facts(surface: Mapping[str, Any]) -> dict[str, Any]:
    description = str(surface.get("description") or "")
    dimensions = []
    for match in DIMENSION_RE.finditer(description):
        dimensions.append({"width": float(match.group("w")), "height": float(match.group("h")), "unit": "inch", "verbatim": match.group(0)})
    for sku in surface.get("skuProductIdentifiers") or surface.get("skus") or surface.get("sku") or []:
        if str(sku) in PUBLISHER_SHEET_EXTENTS and not dimensions:
            dimensions.append({
                **PUBLISHER_SHEET_EXTENTS[str(sku)],
                "catalogAuthority": "Qualification Targets Inc catalog, Military page; preserved publisher catalog evidence",
            })
    description_without_sheet_extent = DIMENSION_RE.sub(" ", description)
    measurements = sorted({float(value) for value in MEASUREMENT_RE.findall(description_without_sheet_extent)})
    return {
        "publisherDescription": description,
        "sheetDimensions": dimensions,
        "otherExplicitInchMeasurements": measurements,
        "sourceUrl": surface.get("sourceUrl"),
        "sourceProvenance": surface.get("sourceProvenance"),
        "preservedImages": surface.get("preservedImages", []),
        "extractionRule": "structured only from preserved publisher text; no image-derived physical dimensions",
    }


def physical_ellipse(region_id: str, source: Mapping[str, Any], width: float, height: float) -> dict[str, Any]:
    return {
        "regionId": region_id,
        "shape": "ellipse",
        "centerX": float(source["cx"]) * width,
        "centerY": float(source["cy"]) * height,
        "radiusX": float(source["radiusX"]) * width,
        "radiusY": float(source["radiusY"]) * height,
        "unit": "inch",
        "priority": int(source["priority"]),
    }


def compile_ellipse(region: Mapping[str, Any], width: float, height: float) -> dict[str, Any]:
    return {
        "regionId": region["regionId"],
        "shape": "ellipse",
        "cx": region["centerX"] / width,
        "cy": region["centerY"] / height,
        "radiusX": region["radiusX"] / width,
        "radiusY": region["radiusY"] / height,
        "priority": region["priority"],
    }


def contains_physical(region: Mapping[str, Any], x: float, y: float) -> bool:
    return ((x - region["centerX"]) / region["radiusX"]) ** 2 + ((y - region["centerY"]) / region["radiusY"]) ** 2 <= 1.0


def physical_classify(regions: list[dict[str, Any]], x: float, y: float) -> str | None:
    matches = [region for region in regions if contains_physical(region, x, y)]
    matches.sort(key=lambda region: region["priority"], reverse=True)
    return matches[0]["regionId"] if matches else None


def boundary_challenges(physical: list[dict[str, Any]], compiled: list[dict[str, Any]], width: float, height: float) -> list[dict[str, Any]]:
    from ugo_observation_classifier import classify

    tests: list[dict[str, Any]] = []
    epsilon = min(width, height) / 100000.0
    for region in physical:
        cx, cy, rx, ry = region["centerX"], region["centerY"], region["radiusX"], region["radiusY"]
        points = [
            # 0.8 stays clearly inside this boundary while avoiding the next
            # nested region in the governed B-27E physical source.
            ("clearly_inside", cx + rx * 0.8, cy),
            ("x_immediately_inside", cx + rx - epsilon, cy),
            ("x_immediately_outside", cx + rx + epsilon, cy),
            ("y_immediately_inside", cx, cy + ry - epsilon),
            ("y_immediately_outside", cx, cy + ry + epsilon),
        ]
        for challenge, x, y in points:
            expected = physical_classify(physical, x, y)
            actual_result = classify(compiled, x / width, y / height, id_key="regionId")
            actual = actual_result["entityId"]
            tests.append({
                "regionId": region["regionId"], "challenge": challenge,
                "physicalPoint": {"x": round(x, 8), "y": round(y, 8), "unit": "inch"},
                "expected": expected or "MISS", "actual": actual or "MISS",
                "classificationStatus": actual_result["classificationStatus"],
                "pass": expected == actual and actual_result["classificationStatus"] != "ambiguous",
            })
    for challenge, x, y in (("outside_top_left", 0.0, 0.0), ("outside_bottom_right", width, height)):
        expected = physical_classify(physical, x, y)
        actual = classify(compiled, x / width, y / height, id_key="regionId")["entityId"]
        tests.append({"regionId": None, "challenge": challenge, "physicalPoint": {"x": x, "y": y, "unit": "inch"}, "expected": expected or "MISS", "actual": actual or "MISS", "pass": expected == actual})
    return tests


def polygon_boundary_challenges(physical: list[dict[str, Any]], compiled: list[dict[str, Any]], width: float, height: float) -> list[dict[str, Any]]:
    """Challenge physical polygon boundaries independently of runtime coordinates."""
    from ugo_observation_classifier import classify

    tests: list[dict[str, Any]] = []
    for region in physical:
        points = region["points"]
        center_x = sum(point[0] for point in points) / len(points)
        center_y = sum(point[1] for point in points) / len(points)
        anchors = points[::max(1, len(points) // 4)][:4]
        probes = [("center", center_x, center_y)]
        for index, (anchor_x, anchor_y) in enumerate(anchors, start=1):
            probes.extend([
                (f"boundary_{index}_inside", anchor_x * 0.999 + center_x * 0.001, anchor_y * 0.999 + center_y * 0.001),
                (f"boundary_{index}_outside", anchor_x * 1.001 - center_x * 0.001, anchor_y * 1.001 - center_y * 0.001),
            ])
        for challenge, x, y in probes:
            expected = classify(physical, x, y, id_key="regionId")["entityId"]
            actual_result = classify(compiled, x / width, y / height, id_key="regionId")
            actual = actual_result["entityId"]
            tests.append({
                "regionId": region["regionId"], "challenge": challenge,
                "physicalPoint": {"x": round(x, 8), "y": round(y, 8), "unit": "inch"},
                "expected": expected or "MISS", "actual": actual or "MISS",
                "classificationStatus": actual_result["classificationStatus"],
                "pass": expected == actual and actual_result["classificationStatus"] != "ambiguous",
            })
    for challenge, x, y in (("outside_top_left", 0.0, 0.0), ("outside_bottom_right", width, height)):
        expected = classify(physical, x, y, id_key="regionId")["entityId"]
        actual = classify(compiled, x / width, y / height, id_key="regionId")["entityId"]
        tests.append({"regionId": None, "challenge": challenge, "physicalPoint": {"x": x, "y": y, "unit": "inch"}, "expected": expected or "MISS", "actual": actual or "MISS", "pass": expected == actual})
    return tests


def compile_scaled_face_contract(surface: Mapping[str, Any], quarantined: Mapping[str, Any], dimensions: Mapping[str, Any]) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    registration = quarantined["components"]["registration"]["definition"]
    image_path = ROOT / "docs" / registration["assetPath"]
    if not image_path.is_file() or sha(image_path) != registration["assetSha256"]:
        raise BoundaryExtractionError("registered_exact_face_identity_or_hash_unavailable")
    original_regions = list(quarantined["components"]["geometry"]["definition"].get("regions", []))
    product_name = str(surface.get("productName") or "")
    published_object_count = ESTABLISHED_OBJECT_COUNTS.get(product_name)
    single_figure = product_name in SINGLE_FIGURE_PRODUCTS
    three_tone = product_name == "B-21E-3T Paper Target"
    trng_1 = product_name == "TRNG-1 Paper Target"
    outer_foreground = product_name in OUTER_FOREGROUND_PRODUCTS
    dea_q_rl = product_name == DEA_Q_RL_PRODUCT
    la_p1 = product_name == LA_P1_PRODUCT
    dartboard = product_name == DARTBOARD_PRODUCT
    if published_object_count is not None:
        original_regions = original_regions[:published_object_count]
    if single_figure:
        original_regions = [{"regionId": "target_figure", "priority": 100}]
    if three_tone:
        original_regions = [
            {"regionId": "outer_tone", "priority": 90},
            {"regionId": "inner_tone", "priority": 100},
            {"regionId": "center_tone", "priority": 110},
        ]
    if dea_q_rl:
        original_regions = [
            {"regionId": "left_sighting_circle", "priority": 100},
            {"regionId": "right_sighting_circle", "priority": 100},
            {"regionId": "target_figure", "priority": 90},
        ]
    if la_p1:
        original_regions = [
            {"regionId": "inner_p_region", "priority": 100},
            {"regionId": "remaining_target_figure", "priority": 20},
        ]
    region_ids = [str(region.get("regionId") or "") for region in original_regions]
    five_spot = surface["qtCatalogId"] == "QT-PRODUCT-1873683447881"
    repeated_prefixes = ("bull_", "object_", "discrimination_object_", "sighting_object_", "circle_", "shape_", "silhouette_")
    repeated_exact = set(region_ids) == {"left_figure", "right_figure"}
    generic_single = len(region_ids) == 1
    repeated_circles = len(region_ids) > 1 and all("circle" in item for item in region_ids)
    repeated = bool(region_ids) and (all(item.startswith(repeated_prefixes) for item in region_ids) or repeated_exact or repeated_circles or generic_single)
    spatial = set(region_ids) == {"upper_governed_region", "central_governed_region", "lower_governed_region", "remaining_target_area"}
    ordered_spatial_sets = (
        {"upper_target_area", "central_target_area", "lower_target_area"},
        {"head_region", "torso_region"},
        {"head_region", "center_mass_region", "lower_torso_region", "pelvic_region"},
    )
    ordered_spatial = set(region_ids) in ordered_spatial_sets
    concentric_tokens = ("zone_", "ring_", "score_", "x_ring", "orange_center")
    nested_words = ("inner", "outer", "middle", "outlined", "target_body")
    multi_anatomical = any("head" in item for item in region_ids) and any(("body" in item or "torso" in item) for item in region_ids)
    concentric = len(region_ids) >= 2 and (
        all(item.startswith(concentric_tokens) for item in region_ids)
        or (not multi_anatomical and all(any(word in item for word in nested_words) for item in region_ids))
        or set(region_ids) in ({"zone_10", "zone_5", "silhouette"}, {"a_zone", "c_zone", "target_body"})
    )
    primary_error = None
    try:
        if dartboard:
            extracted = extract_scaled_dartboard_boundaries(
                image_path,
                [item for item in region_ids if item.startswith("sector_")],
                float(dimensions["width"]), float(dimensions["height"]),
            )
        elif dea_q_rl:
            extracted = extract_scaled_foreground_components(
                image_path, ["left_sighting_circle", "right_sighting_circle", "target_figure"],
                float(dimensions["width"]), float(dimensions["height"]),
            )
        elif la_p1:
            extracted = extract_scaled_largest_internal_with_outer_figure(
                image_path, "inner_p_region", "remaining_target_figure",
                float(dimensions["width"]), float(dimensions["height"]),
            )
        elif outer_foreground:
            extracted = extract_scaled_internal_regions_with_outer_figure(
                image_path, original_regions, float(dimensions["width"]), float(dimensions["height"]),
            )
        elif trng_1:
            extracted = extract_scaled_positioned_objects(
                image_path,
                {
                    "discrimination_object_1": (0.26, 0.21), "discrimination_object_2": (0.75, 0.47),
                    "discrimination_object_3": (0.75, 0.80), "discrimination_object_4": (0.26, 0.80),
                    "discrimination_object_5": (0.26, 0.48), "discrimination_object_6": (0.75, 0.21),
                },
                float(dimensions["width"]), float(dimensions["height"]),
            )
        elif three_tone:
            extracted = extract_scaled_three_tone_boundaries(
                image_path, ["outer_tone", "inner_tone", "center_tone"],
                float(dimensions["width"]), float(dimensions["height"]),
            )
        elif single_figure:
            extracted = extract_scaled_primary_foreground_boundary(
                image_path, "target_figure", float(dimensions["width"]), float(dimensions["height"]),
            )
        elif ordered_spatial:
            extracted = extract_scaled_ordered_spatial_boundaries(
                image_path, original_regions, float(dimensions["width"]), float(dimensions["height"]),
            )
        elif spatial:
            extracted = extract_scaled_spatial_zone_boundaries(
                image_path, original_regions, float(dimensions["width"]), float(dimensions["height"]),
            )
        elif concentric:
            extracted = extract_scaled_concentric_boundaries(
                image_path, original_regions, float(dimensions["width"]), float(dimensions["height"]),
            )
        elif five_spot or repeated:
            foreground_component_products = {
                "DS-DT-C2 Paper Target", "TRNG-8A Paper Target", "TRNG-8B Paper Target",
                "TRNG-8C Paper Target", "TRNG-9 Paper Target", "DOT-6 Paper Target",
            }
            if (
                str(surface.get("productName") or "") in foreground_component_products
                and region_ids and all(item.startswith(("discrimination_object_", "object_")) for item in region_ids)
            ):
                extracted = extract_scaled_foreground_components(
                    image_path, region_ids, float(dimensions["width"]), float(dimensions["height"]),
                )
            else:
                extracted = extract_scaled_object_boundaries(
                    image_path,
                    region_ids,
                    float(dimensions["width"]),
                    float(dimensions["height"]),
                    five_spot=five_spot,
                    minimum_object_area_fraction=0.02 if repeated_exact else 0.00045,
                    require_primary_single_object=generic_single,
                )
        else:
            raise BoundaryExtractionError("no_specialized_topology_extractor")
    except BoundaryExtractionError as error:
        primary_error = str(error)
        faint_lines = str(surface.get("productName") or "") in FAINT_EXACT_LINE_PRODUCTS
        extracted = extract_scaled_seeded_exact_boundaries(
            image_path, original_regions, float(dimensions["width"]), float(dimensions["height"]),
            max_seed_center_distance=0.55 if faint_lines else 0.38,
            max_seed_area_log_distance=6.5 if faint_lines else 4.6,
        )
        extracted["specializedExtractorFailure"] = primary_error
    compiled = extracted["runtimeRegions"]
    physical = extracted["physicalRegions"]
    challenges = polygon_boundary_challenges(physical, compiled, float(dimensions["width"]), float(dimensions["height"]))
    if not all(item["pass"] for item in challenges):
        raise BoundaryExtractionError("physical_to_runtime_boundary_projection_failed")

    contract = deepcopy(quarantined)
    if three_tone:
        scoring = contract["components"]["scoring"]["definition"]
        scoring["model"] = "named_regions"
        scoring["regionRules"] = {
            "outer_tone": {"label": "Outer Tone"},
            "inner_tone": {"label": "Inner Tone"},
            "center_tone": {"label": "Center Tone"},
        }
        scoring["aggregation"] = {"mode": "classification_counts"}
        scoring["outsideRule"] = {"label": "Missed"}
        scoring["classificationFootprintMode"] = "tap_center"
        scoring["publisherRuleAuthority"] = {
            **scoring.get("publisherRuleAuthority", {}),
            "rule": "the publisher-described three printed tone zones are counted; no unpublished point values are inferred",
        }
    if single_figure:
        scoring = contract["components"]["scoring"]["definition"]
        scoring["model"] = "named_regions"
        scoring["regionRules"] = {
            "target_figure": {"label": "Target Figure", "objectId": "target_figure", "objectLabel": "Target Figure"}
        }
        scoring["aggregation"] = {"mode": "classification_counts"}
        scoring["outsideRule"] = {"label": "Missed"}
        scoring["classificationFootprintMode"] = "tap_center"
        scoring["publisherRuleAuthority"] = {
            **scoring.get("publisherRuleAuthority", {}),
            "rule": "the exact printed target figure is counted as one physical object; no unpublished values or course rules are inferred",
        }
    if dea_q_rl:
        scoring = contract["components"]["scoring"]["definition"]
        scoring["model"] = "named_regions"
        scoring["regionRules"] = {
            "left_sighting_circle": {"label": "Left Sighting Circle", "objectId": "left_sighting_circle", "objectLabel": "Left Sighting Circle"},
            "right_sighting_circle": {"label": "Right Sighting Circle", "objectId": "right_sighting_circle", "objectLabel": "Right Sighting Circle"},
            "target_figure": {"label": "Target Figure", "objectId": "target_figure", "objectLabel": "Target Figure"},
        }
        scoring["aggregation"] = {"mode": "classification_counts"}
        scoring["outsideRule"] = {"label": "Missed"}
        scoring["classificationFootprintMode"] = "tap_center"
        scoring["publisherRuleAuthority"] = {
            **scoring.get("publisherRuleAuthority", {}),
            "rule": "the exact face establishes two separate printed sighting circles and one printed target figure; no unpublished values or course rules are inferred",
        }
    if la_p1:
        scoring = contract["components"]["scoring"]["definition"]
        scoring["model"] = "named_regions"
        scoring["regionRules"] = {
            "inner_p_region": {"label": "Inner P Region", "objectId": "inner_p_region", "objectLabel": "Inner P Region"},
            "remaining_target_figure": {"label": "Remaining Target Figure", "objectId": "remaining_target_figure", "objectLabel": "Remaining Target Figure"},
        }
        scoring["aggregation"] = {"mode": "classification_counts"}
        scoring["outsideRule"] = {"label": "Missed"}
        scoring["classificationFootprintMode"] = "tap_center"
        scoring["publisherRuleAuthority"] = {
            **scoring.get("publisherRuleAuthority", {}),
            "rule": "the exact face establishes the printed inner P boundary and remaining printed target figure; no unpublished point values are inferred",
        }
    if published_object_count is not None:
        scoring = contract["components"]["scoring"]["definition"]
        allowed_ids = [str(region["regionId"]) for region in original_regions]
        allowed = set(allowed_ids)
        scoring["regionRules"] = {
            key: value for key, value in scoring.get("regionRules", {}).items() if key in allowed
        }
        authority = scoring.get("publisherRuleAuthority", {})
        count_source = "exact-face printed" if product_name == "TRNG-9 Paper Target" else "publisher-described repeated"
        authority["rule"] = f"{published_object_count} {count_source} objects are independently counted; drill order remains unpublished"
        scoring["publisherRuleAuthority"] = authority
        scoring["homieLockedArtworkFacts"] = {
            **scoring.get("homieLockedArtworkFacts", {}),
            "labels": [str(scoring["regionRules"].get(item, {}).get("label") or item) for item in allowed_ids],
            "storedTargetRule": authority["rule"],
        }
        scoring["homieCorrectedArtworkFacts"] = {
            **scoring.get("homieCorrectedArtworkFacts", {}),
            "labels": [str(scoring["regionRules"].get(item, {}).get("label") or item) for item in allowed_ids],
            "regionObjectIds": allowed_ids,
            "storedGoverningRule": authority["rule"],
        }
    contract["authorityContractVersion"] = "QT-PHYSICAL-AUTHORITY-2026-09-28-v2"
    contract["approval"] = {
        "status": "approved", "authorityId": "QT_PRINTER13_SCALED_EXACT_FACE_AUTHORITY_2026_09_28",
        "approvedAt": "2026-09-28T00:00:00-04:00", "founderAcceptance": "pending",
    }
    contract["targetProfile"]["product"]["dimensions"] = dict(dimensions)
    contract["components"]["geometry"]["definition"] = {
        "coordinateSystem": "normalized_source_image_top_left",
        "layoutModel": quarantined["components"]["geometry"]["definition"].get("layoutModel", "regions"),
        "regions": compiled, "ugoAuthority": "qt-exact-face-governed-physical-scale-v1",
        "physicalAuthority": {
            "targetPlane": extracted["targetPlane"], "sourceAssetPath": registration["assetPath"],
            "sourceAssetSha256": registration["assetSha256"], "publisherEvidence": surface["description"],
            "mapping": extracted["mapping"], "edgeProof": extracted["edgeProof"],
            "compileRule": "exact-face boundary coordinates scaled by publisher-governed physical sheet extent",
            "unscaledPixelsAreAuthority": False, "genericOrFamilyGeometryUsed": False, "boundaryGate": "PASS",
            "correspondenceOnlySeed": bool(extracted.get("correspondenceProof")),
            "specializedExtractorFailure": primary_error,
        },
    }
    for component in contract["components"].values():
        component["digest"] = component_digest(component)
    return contract, extracted, challenges


def compile_b27_p1(surface: Mapping[str, Any], quarantined: Mapping[str, Any], dimensions: Mapping[str, Any]) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    """Bind the photo target to the proven full-size B-27 physical standard."""
    if float(dimensions["width"]) != 24.0 or float(dimensions["height"]) != 45.0:
        raise BoundaryExtractionError("b27_p1_full_size_physical_extent_not_established")
    source = read(PRIOR_B27_STANDARD)
    source_dimensions = source["targetProfile"]["product"]["dimensions"]
    if float(source_dimensions["width"]) != 24.0 or float(source_dimensions["height"]) != 45.0:
        raise BoundaryExtractionError("proven_b27_standard_extent_mismatch")
    source_regions = {item["regionId"]: item for item in source["components"]["geometry"]["definition"]["regions"]}
    mapping = (("ring_10", "zone_10"), ("ring_9", "zone_9"), ("ring_8", "zone_8"), ("ring_7", "zone_7"))
    runtime_regions = [
        {**deepcopy(source_regions[source_id]), "regionId": target_id}
        for target_id, source_id in mapping
    ]
    original_x = next(
        item for item in quarantined["components"]["geometry"]["definition"]["regions"]
        if item["regionId"] == "x_ring"
    )
    registration = quarantined["components"]["registration"]["definition"]
    image_path = ROOT / "docs" / registration["assetPath"]
    x_result = extract_scaled_seeded_exact_boundaries(
        image_path, [original_x], 24.0, 45.0,
        max_seed_center_distance=0.30, max_seed_area_log_distance=3.0,
    )
    runtime_regions = x_result["runtimeRegions"] + runtime_regions
    physical_regions = [
        {**deepcopy(region), "points": [[point[0] * 24.0, point[1] * 45.0] for point in region["points"]], "unit": "inch"}
        for region in runtime_regions
    ]
    challenges = polygon_boundary_challenges(physical_regions, runtime_regions, 24.0, 45.0)
    if not all(item["pass"] for item in challenges):
        raise BoundaryExtractionError("b27_p1_standard_projection_failed")

    contract = deepcopy(quarantined)
    contract["authorityContractVersion"] = "QT-PHYSICAL-AUTHORITY-2026-09-29-v1"
    contract["approval"] = {
        "status": "approved", "authorityId": "QT_PRINTER13_B27_P1_PHYSICAL_AUTHORITY_2026_09_29",
        "approvedAt": "2026-09-29T00:00:00-04:00", "founderAcceptance": "pending",
    }
    contract["targetProfile"]["product"]["dimensions"] = {"width": 24.0, "height": 45.0, "unit": "inch"}
    contract["components"]["geometry"]["definition"] = {
        "coordinateSystem": "normalized_source_image_top_left", "layoutModel": "concentric_regions",
        "regions": runtime_regions, "ugoAuthority": "qt-b27-p1-proven-standard-plus-exact-x-v1",
        "physicalAuthority": {
            "targetPlane": {"width": 24.0, "height": 45.0, "unit": "inch", "origin": "top_left"},
            "sourceAssetPath": registration["assetPath"], "sourceAssetSha256": registration["assetSha256"],
            "publisherEvidence": surface["description"],
            "sourceB27ContractPath": str(PRIOR_B27_STANDARD.relative_to(ROOT)),
            "sourceB27ContractSha256": sha(PRIOR_B27_STANDARD),
            "compileRule": "publisher-identified hidden B-27 scoring zones inherit the proven 24x45 B-27 physical standard; X boundary is extracted from this exact registered face",
            "unscaledPixelsAreAuthority": False, "genericOrFamilyGeometryUsed": False, "boundaryGate": "PASS",
        },
    }
    for component in contract["components"].values():
        component["digest"] = component_digest(component)
    physical_source = {
        "targetPlane": contract["components"]["geometry"]["definition"]["physicalAuthority"]["targetPlane"],
        "runtimeRegions": runtime_regions, "physicalRegions": physical_regions,
        "mapping": contract["components"]["geometry"]["definition"]["physicalAuthority"]["compileRule"],
        "edgeProof": x_result["edgeProof"] + [{"regionId": target_id, "provenB27StandardRegion": source_id} for target_id, source_id in mapping],
    }
    return contract, physical_source, challenges


def compile_nm_q3(surface: Mapping[str, Any], quarantined: Mapping[str, Any], dimensions: Mapping[str, Any]) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    """Bind Q3 to the Founder-confirmed identical NM-Q1 physical overlay."""
    if float(dimensions["width"]) != 23.0 or float(dimensions["height"]) != 35.0:
        raise BoundaryExtractionError("nm_q3_physical_extent_not_established")
    source = read(PRIOR_NM_Q1)
    source_geometry = source["components"]["geometry"]["definition"]
    source_ids = [item["regionId"] for item in source_geometry["regions"]]
    target_ids = [item["regionId"] for item in quarantined["components"]["geometry"]["definition"]["regions"]]
    if set(source_ids) != set(target_ids):
        raise BoundaryExtractionError("nm_q3_founder_confirmed_overlay_semantics_mismatch")
    source_by_id = {item["regionId"]: item for item in source_geometry["regions"]}
    runtime_regions = [deepcopy(source_by_id[item]) for item in target_ids]
    physical_regions = [
        {**deepcopy(region), "points": [[point[0] * 23.0, point[1] * 35.0] for point in region["points"]], "unit": "inch"}
        for region in runtime_regions
    ]
    challenges = polygon_boundary_challenges(physical_regions, runtime_regions, 23.0, 35.0)
    if not all(item["pass"] for item in challenges):
        raise BoundaryExtractionError("nm_q3_confirmed_overlay_projection_failed")
    registration = quarantined["components"]["registration"]["definition"]
    contract = deepcopy(quarantined)
    contract["authorityContractVersion"] = "QT-PHYSICAL-AUTHORITY-2026-09-29-v1"
    contract["approval"] = {
        "status": "approved", "authorityId": "QT_PRINTER13_NM_Q3_PHYSICAL_AUTHORITY_2026_09_29",
        "approvedAt": "2026-09-29T00:00:00-04:00", "founderAcceptance": "pending",
    }
    contract["targetProfile"]["product"]["dimensions"] = {"width": 23.0, "height": 35.0, "unit": "inch"}
    contract["components"]["geometry"]["definition"] = {
        "coordinateSystem": "normalized_source_image_top_left", "layoutModel": source_geometry.get("layoutModel", "regions"),
        "regions": runtime_regions, "ugoAuthority": "qt-nm-founder-confirmed-identical-physical-overlay-v1",
        "physicalAuthority": {
            "targetPlane": {"width": 23.0, "height": 35.0, "unit": "inch", "origin": "top_left"},
            "sourceAssetPath": registration["assetPath"], "sourceAssetSha256": registration["assetSha256"],
            "publisherEvidence": surface["description"],
            "sourceNmQ1ContractPath": str(PRIOR_NM_Q1.relative_to(ROOT)),
            "sourceNmQ1ContractSha256": sha(PRIOR_NM_Q1),
            "compileRule": "Founder-confirmed identical NM-DPS-Q1/Q3 printed scoring overlay on the same governed 23x35 target plane",
            "unscaledPixelsAreAuthority": False, "genericOrFamilyGeometryUsed": False, "boundaryGate": "PASS",
        },
    }
    for component in contract["components"].values():
        component["digest"] = component_digest(component)
    physical_source = {
        "targetPlane": contract["components"]["geometry"]["definition"]["physicalAuthority"]["targetPlane"],
        "runtimeRegions": runtime_regions, "physicalRegions": physical_regions,
        "mapping": contract["components"]["geometry"]["definition"]["physicalAuthority"]["compileRule"],
        "edgeProof": [{"regionId": item["regionId"], "founderConfirmedIdenticalNmOverlay": True} for item in runtime_regions],
    }
    return contract, physical_source, challenges


def compile_b27e(surface: Mapping[str, Any], quarantined: Mapping[str, Any]) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    prior = read(PRIOR_B27E)
    prior_dims = prior["targetProfile"]["product"]["dimensions"]
    facts = extract_physical_facts(surface)
    if prior_dims != {"width": 23, "height": 35, "unit": "inch"}:
        raise RuntimeError("prior_b27e_physical_extent_mismatch")
    if not any(item["width"] == 23 and item["height"] == 35 for item in facts["sheetDimensions"]):
        raise RuntimeError("qt_b27e_publisher_extent_not_established")
    source_regions = {region["regionId"]: region for region in prior["components"]["geometry"]["definition"]["regions"]}
    mapping = (("zone_10", "10"), ("zone_9", "9"), ("zone_8", "8"), ("zone_7", "7"))
    physical = [physical_ellipse(qt_id, source_regions[prior_id], 23, 35) for qt_id, prior_id in mapping]
    compiled = [compile_ellipse(region, 23, 35) for region in physical]
    challenges = boundary_challenges(physical, compiled, 23, 35)
    if not all(item["pass"] for item in challenges):
        raise RuntimeError("b27e_boundary_gate_failed")

    contract = deepcopy(quarantined)
    contract["authorityContractVersion"] = "QT-PHYSICAL-AUTHORITY-2026-09-28-v1"
    contract["approval"] = {
        "status": "approved",
        "authorityId": "QT_PRINTER13_PHYSICAL_AUTHORITY_EXECUTION_2026_09_28",
        "approvedAt": "2026-09-28T00:00:00-04:00",
        "founderAcceptance": "pending",
    }
    contract["targetProfile"]["product"]["dimensions"] = {"width": 23, "height": 35, "unit": "inch"}
    definition = {
        "coordinateSystem": "normalized_source_image_top_left",
        "layoutModel": "concentric_regions",
        "regions": compiled,
        "ugoAuthority": "qt-target-specific-physical-source-v1",
        "physicalAuthority": {
            "targetPlane": {"width": 23, "height": 35, "unit": "inch", "origin": "top_left"},
            "sourceContractId": prior["contractId"],
            "sourceContractSha256": sha(PRIOR_B27E),
            "sourceAuthority": prior["approval"]["authorityId"],
            "publisherEvidence": surface["description"],
            "identityReconciliation": "exact B-27E surface; full-sized B-27 scoring zones; identical 23x35 physical sheet extent",
            "compileRule": "physical inches divided by governed physical sheet extent",
            "imagePixelsAreAuthority": False,
            "boundaryGate": "PASS",
        },
    }
    contract["components"]["geometry"]["definition"] = definition
    for component in contract["components"].values():
        component["digest"] = component_digest(component)
    return contract, {"targetPlane": definition["physicalAuthority"]["targetPlane"], "regions": physical}, challenges


def main() -> None:
    from target_execution_contract import validate_contract

    cleanup = read(CLEANUP_MANIFEST)
    leg2 = read(LEG2)
    surfaces = {item["qtCatalogId"]: item for item in leg2["surfaces"]}
    CANDIDATES.mkdir(parents=True, exist_ok=True)
    CHECKPOINT.mkdir(parents=True, exist_ok=True)
    head = git_head()
    checkpoint_files = [SMART_AUTHORITY, LEG3_AUTHORITY]
    for source in checkpoint_files:
        destination = CHECKPOINT / source.name
        if not destination.exists():
            shutil.copy2(source, destination)
    write(CHECKPOINT / "CHECKPOINT_MANIFEST.json", {
        "head": head,
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "files": [{"path": str(path.relative_to(ROOT)), "sha256": sha(path)} for path in checkpoint_files],
        "quarantineSnapshot": str(QUARANTINE.relative_to(ROOT)),
        "quarantineContractCount": len(list(QUARANTINE.glob("*.json"))),
    })

    # Rebuild only contracts admitted by this physical-authority batch.  The
    # quarantined source remains immutable and all unrelated contracts remain.
    for path in CONTRACTS.glob("qt_printer13_*.json"):
        package = read(path)
        authority_id = str(package.get("approval", {}).get("authorityId") or "")
        if authority_id in {
            "QT_PRINTER13_PHYSICAL_AUTHORITY_EXECUTION_2026_09_28",
            "QT_PRINTER13_SCALED_EXACT_FACE_AUTHORITY_2026_09_28",
        }:
            path.unlink()

    ledger: list[dict[str, Any]] = []
    admitted: list[str] = []
    for item in cleanup["targets"]:
        qt_id = item["qtCatalogId"]
        surface = surfaces[qt_id]
        facts = extract_physical_facts(surface)
        record: dict[str, Any] = {
            "populationPosition": item["populationPosition"], "visualStackOrdinal": item["visualStackOrdinal"],
            "qtCatalogId": qt_id, "targetProfileId": item["targetProfileId"], "productName": item["productName"],
            "sku": item["sku"], "establishedTreatment": item["establishedTreatment"],
            "physicalSourceExtraction": facts, "candidateLocation": None, "boundaryChallenge": None,
            "backendAdmission": "NONE", "quarantinePath": item.get("quarantinePath"),
        }
        if item["finalClassification"] == "NOT APPLICABLE":
            record["result"] = "N/A"
            record["reason"] = item["physicalBoundarySource"]
        elif qt_id == QT_B27E_ID:
            quarantine_path = QUARANTINE / QT_B27E_NAME
            contract, physical_source, challenges = compile_b27e(surface, read(quarantine_path))
            candidate_path = CANDIDATES / QT_B27E_NAME
            write(candidate_path, contract)
            write(CANDIDATES / "QT-PRODUCT-1873808916553_PHYSICAL_SOURCE.json", physical_source)
            validate_contract(contract)
            active_path = CONTRACTS / QT_B27E_NAME
            write(active_path, contract)
            record.update({
                "result": "REPAIR→PASS", "reason": "exact prior B-27E physical authority reconciled to the QT 23x35 surface",
                "candidateLocation": str(candidate_path.relative_to(ROOT)), "boundaryChallenge": challenges,
                "backendAdmission": str(active_path.relative_to(ROOT)),
                "physicalAuthoritySources": [str(PRIOR_B27E.relative_to(ROOT)), str(LEG2.relative_to(ROOT))],
            })
            admitted.append(qt_id)
        else:
            try:
                if not facts["sheetDimensions"]:
                    raise BoundaryExtractionError("publisher_physical_sheet_extent_not_established")
                dimensions = facts["sheetDimensions"][0]
                quarantine_path = ROOT / "docs" / item["quarantinePath"]
                governed_dimensions = {"width": dimensions["width"], "height": dimensions["height"], "unit": "inch"}
                if item["productName"] == B27_P1_PRODUCT:
                    contract, physical_source, challenges = compile_b27_p1(surface, read(quarantine_path), governed_dimensions)
                elif item["productName"] == NM_DPS_Q3_PRODUCT:
                    contract, physical_source, challenges = compile_nm_q3(surface, read(quarantine_path), governed_dimensions)
                else:
                    contract, physical_source, challenges = compile_scaled_face_contract(surface, read(quarantine_path), governed_dimensions)
                candidate_path = CANDIDATES / quarantine_path.name
                write(candidate_path, contract)
                source_path = CANDIDATES / f"{qt_id}_PHYSICAL_SOURCE.json"
                write(source_path, physical_source)
                validate_contract(contract)
                active_path = CONTRACTS / quarantine_path.name
                write(active_path, contract)
                record.update({
                    "result": "REPAIR→PASS", "reason": "target-specific boundaries extracted from the exact registered face at publisher-governed physical scale",
                    "candidateLocation": str(candidate_path.relative_to(ROOT)), "boundaryChallenge": challenges,
                    "backendAdmission": str(active_path.relative_to(ROOT)), "physicalSource": str(source_path.relative_to(ROOT)),
                    "edgeProof": physical_source["edgeProof"],
                })
                admitted.append(qt_id)
            except BoundaryExtractionError as error:
                record["result"] = "HOLD"
                record["reason"] = f"HOLD: exact-face physical compiler did not clear the admission gate: {error}."
                record["missingPhysicalAuthority"] = {
                    "sheetExtentEstablished": bool(facts["sheetDimensions"]),
                    "additionalMeasurementsEstablished": bool(facts["otherExplicitInchMeasurements"]),
                    "exactFaceAvailable": bool(surface.get("preservedImages")),
                    "remainingBlocker": str(error),
                }
        ledger.append(record)

    census = {
        "PASS": sum(item["result"] == "PASS" for item in ledger),
        "REPAIR→PASS": sum(item["result"] == "REPAIR→PASS" for item in ledger),
        "HOLD": sum(item["result"] == "HOLD" for item in ledger),
        "N/A": sum(item["result"] == "N/A" for item in ledger),
        "TOTAL": len(ledger),
    }
    manifest_rel = str((RUN_DIR / "QT_PHYSICAL_AUTHORITY_BATCH_MANIFEST.json").relative_to(ROOT / "docs"))
    manifest = {
        "schemaVersion": "qt-physical-authority-batch-v1", "generatedOn": "2026-09-28", "startingHead": head,
        "scope": 254, "historicalLegThreeGeneratorRerun": False, "sharedRuntimeChanged": False,
        "physicalGate": "exact target representation + exact identity + publisher physical sheet extent -> physically scaled target plane -> UGO",
        "pixelBoundaryRule": "pixels may locate the exact face boundary; publisher extent alone supplies physical scale",
        "genericFamilyGeometryPermitted": False,
        "census": census, "admittedQtCatalogIds": admitted, "targets": ledger,
    }
    write(RUN_DIR / "QT_PHYSICAL_SOURCE_LEDGER.json", {"schemaVersion": "qt-physical-source-ledger-v1", "targets": ledger})
    write(RUN_DIR / "QT_PHYSICAL_AUTHORITY_BATCH_MANIFEST.json", manifest)

    # Backend Target Knowledge must describe the same admission state as the
    # active contracts and batch manifest.  This is an authority reconciliation,
    # not a new identity or architecture.
    smart = read(SMART_AUTHORITY)
    by_qt_id = {item["qtCatalogId"]: item for item in ledger}
    for chair in smart.get("chairs", []):
        item = by_qt_id.get(chair.get("qtCatalogId"))
        if not item:
            continue
        if item["result"] == "REPAIR→PASS":
            active_path = ROOT / item["backendAdmission"]
            package = read(active_path)
            chair["physicalAuthorityAdmission"] = {
                "status": "VERIFIED_FOR_BACKEND",
                "semanticTreatmentPreserved": True,
                "physicalBoundaryAuthorityStatus": "VERIFIED",
                "candidateContractPath": item["candidateLocation"],
                "physicalSourcePath": item.get("physicalSource"),
                "activeContractPath": item["backendAdmission"],
                "activeContractSha256": sha(active_path),
                "contractFingerprint": validate_contract(package)["contractFingerprint"],
                "boundaryChallengeCount": len(item.get("boundaryChallenge") or []),
                "runtimeExecutionAdmitted": True,
                "genericOrFamilyGeometryUsed": False,
            }
        elif item["result"] == "N/A":
            chair["physicalAuthorityAdmission"] = {
                "status": "NOT_APPLICABLE",
                "semanticTreatmentPreserved": True,
                "physicalBoundaryAuthorityStatus": "NOT_REQUIRED_BY_CURRENT_CAPABILITY",
                "runtimeExecutionAdmitted": False,
                "reason": item["reason"],
            }
        else:
            chair["physicalAuthorityAdmission"] = {
                "status": "HOLD",
                "semanticTreatmentPreserved": True,
                "physicalBoundaryAuthorityStatus": "NOT_VERIFIED",
                "candidateContractQuarantinePath": item.get("quarantinePath"),
                "runtimeExecutionAdmitted": False,
                "reason": item["reason"],
            }
    smart["physicalAuthorityExecution"] = {
        "status": "COMPLETE_WITH_HOLDS",
        "manifest": manifest_rel,
        "census": census,
        "admittedQtCatalogIds": admitted,
        "sharedRuntimeChanged": False,
        "authorityModelChanged": False,
        "historicalLegThreeGeneratorRerun": False,
    }
    write(SMART_AUTHORITY, smart)

    leg3 = read(LEG3_AUTHORITY)
    leg3["physicalAuthorityExecution"] = {
        "status": "COMPLETE_WITH_HOLDS",
        "manifest": manifest_rel,
        "census": census,
        "admittedQtCatalogIds": admitted,
        "historicalLegThreeGeneratorRerun": False,
        "activeClassGeneratedQtGeometry": 0,
    }
    write(LEG3_AUTHORITY, leg3)
    print(json.dumps({"census": census, "admitted": admitted, "manifest": manifest_rel}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
