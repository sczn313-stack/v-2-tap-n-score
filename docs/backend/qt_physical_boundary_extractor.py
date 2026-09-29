"""Extract target-specific physical boundaries from an exact scaled QT face.

The representation locates boundaries.  Publisher sheet dimensions supply the
physical scale.  The extractor never borrows a family geometry or treats an
unscaled pixel count as inches.
"""
from __future__ import annotations

from itertools import combinations
from math import cos, log, pi, radians, sin
from pathlib import Path
from typing import Any, Mapping

import cv2
import numpy as np


class BoundaryExtractionError(ValueError):
    pass


def _contour_record(contour: np.ndarray, image_area: float) -> dict[str, Any] | None:
    area = abs(float(cv2.contourArea(contour)))
    perimeter = float(cv2.arcLength(contour, True))
    if area <= 0 or perimeter <= 0:
        return None
    x, y, width, height = cv2.boundingRect(contour)
    circularity = 4 * pi * area / (perimeter * perimeter)
    return {
        "contour": contour,
        "area": area,
        "areaFraction": area / image_area,
        "centerX": x + width / 2,
        "centerY": y + height / 2,
        "width": width,
        "height": height,
        "circularity": circularity,
        "aspect": width / height if height else 0,
    }


def _deduplicate(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for record in sorted(records, key=lambda item: item["area"], reverse=True):
        duplicate = False
        for kept in result:
            distance = ((record["centerX"] - kept["centerX"]) ** 2 + (record["centerY"] - kept["centerY"]) ** 2) ** 0.5
            scale = max(record["width"], record["height"], kept["width"], kept["height"])
            if distance < scale * 0.04 and abs(record["area"] - kept["area"]) / max(record["area"], kept["area"]) < 0.12:
                duplicate = True
                break
        if not duplicate:
            result.append(record)
    return result


def _reading_order(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not records:
        return []
    median_height = float(np.median([item["height"] for item in records]))
    rows: list[list[dict[str, Any]]] = []
    for record in sorted(records, key=lambda item: item["centerY"]):
        if not rows or abs(record["centerY"] - np.mean([item["centerY"] for item in rows[-1]])) > median_height * 0.65:
            rows.append([record])
        else:
            rows[-1].append(record)
    return [item for row in rows for item in sorted(row, key=lambda candidate: candidate["centerX"])]


def _similar_cluster(records: list[dict[str, Any]], count: int) -> list[dict[str, Any]]:
    if len(records) < count:
        raise BoundaryExtractionError(f"only_{len(records)}_closed_object_candidates_for_{count}_semantic_objects")
    best: tuple[float, list[dict[str, Any]]] | None = None
    ordered = sorted(records, key=lambda item: item["area"], reverse=True)
    for start in range(0, len(ordered) - count + 1):
        group = ordered[start:start + count]
        areas = np.array([item["area"] for item in group], dtype=float)
        coefficient = float(np.std(areas) / np.mean(areas))
        if coefficient > 0.18:
            continue
        mean_area = float(np.mean(areas))
        same_scale = [item for item in records if abs(item["area"] - mean_area) / mean_area <= 0.18]
        # Printed outlines often produce inner/outer edge contours at nearly
        # the same scale. Collapse those edge duplicates by physical center;
        # semantic objects must occupy distinct places on the exact face.
        distinct: list[dict[str, Any]] = []
        for item in sorted(same_scale, key=lambda candidate: candidate["area"], reverse=True):
            if any(
                ((item["centerX"] - kept["centerX"]) ** 2 + (item["centerY"] - kept["centerY"]) ** 2) ** 0.5
                < min(max(item["width"], item["height"]), max(kept["width"], kept["height"])) * 0.35
                for kept in distinct
            ):
                continue
            distinct.append(item)
        if len(distinct) != count:
            continue
        group = distinct
        areas = np.array([item["area"] for item in group], dtype=float)
        coefficient = float(np.std(areas) / np.mean(areas))
        score = mean_area * min(item["circularity"] for item in group) / (1 + coefficient)
        if best is None or score > best[0]:
            best = (score, list(group))
    if best is None:
        raise BoundaryExtractionError("exact_semantic_object_count_not_isolated_from_exact_face")
    return _reading_order(best[1])


def _polygon(contour: np.ndarray, width: int, height: int, region_id: str, priority: int) -> dict[str, Any]:
    perimeter = cv2.arcLength(contour, True)
    simplified = cv2.approxPolyDP(contour, max(1.0, perimeter * 0.0025), True)[:, 0, :]
    if len(simplified) < 8:
        simplified = cv2.approxPolyDP(contour, max(0.5, perimeter * 0.001), True)[:, 0, :]
    return {
        "regionId": region_id,
        "shape": "polygon",
        "points": [[float(x) / width, float(y) / height] for x, y in simplified],
        "priority": priority,
    }


def _edge_proof(gray: np.ndarray, contour: np.ndarray) -> dict[str, Any]:
    x_gradient = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    y_gradient = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    magnitude = cv2.magnitude(x_gradient, y_gradient)
    points = contour[:, 0, :]
    values = magnitude[np.clip(points[:, 1], 0, gray.shape[0] - 1), np.clip(points[:, 0], 0, gray.shape[1] - 1)]
    threshold = max(4.0, float(np.percentile(magnitude, 75)))
    return {
        "boundarySampleCount": int(len(values)),
        "edgeThreshold": round(threshold, 4),
        "alignedFraction": round(float(np.mean(values >= threshold)), 4),
        "medianGradient": round(float(np.median(values)), 4),
    }


def _load_contour_records(image_path: Path, *, edges: bool = False) -> tuple[np.ndarray, list[np.ndarray], np.ndarray, list[dict[str, Any]]]:
    gray = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if gray is None:
        raise BoundaryExtractionError("exact_registered_face_decode_failed")
    if not edges:
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        _, source = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        sources = [source]
    else:
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        enhanced = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(blurred)
        sources = [
            cv2.Canny(blurred, 20, 80),
            cv2.Canny(blurred, 45, 145),
            cv2.Canny(enhanced, 8, 35),
            cv2.Canny(enhanced, 18, 70),
            cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 7),
        ]
        sources += [cv2.morphologyEx(source, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=1) for source in sources[:4]]
    contour_sets = [cv2.findContours(source, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE) for source in sources]
    contours = [contour for found, _ in contour_sets for contour in found]
    hierarchy = np.empty((0, 4), dtype=int)
    image_area = float(gray.shape[0] * gray.shape[1])
    records: list[dict[str, Any]] = []
    for index, contour in enumerate(contours):
        record = _contour_record(contour, image_area)
        if not record or not 0.00025 <= record["areaFraction"] <= 0.78:
            continue
        x, y, width, height = cv2.boundingRect(contour)
        if x <= 1 or y <= 1 or x + width >= gray.shape[1] - 1 or y + height >= gray.shape[0] - 1:
            continue
        record.update({"index": index, "parent": -1})
        records.append(record)
    return gray, contours, hierarchy, _deduplicate(records)


def _scaled_result(
    image_path: Path,
    gray: np.ndarray,
    regions: list[dict[str, Any]],
    contours_by_id: Mapping[str, np.ndarray],
    sheet_width: float,
    sheet_height: float,
    mapping: str,
    *,
    minimum_edge_alignment: float = 0.70,
) -> dict[str, Any]:
    image_height, image_width = gray.shape
    proofs = [{"regionId": region["regionId"], **_edge_proof(gray, contours_by_id[region["regionId"]])} for region in regions]
    if any(item["alignedFraction"] < minimum_edge_alignment for item in proofs):
        raise BoundaryExtractionError("extracted_boundary_edge_alignment_below_gate")
    physical_regions = [
        {
            **region,
            "points": [[point[0] * sheet_width, point[1] * sheet_height] for point in region["points"]],
            "unit": "inch",
        }
        for region in regions
    ]
    return {
        "representation": {"widthPx": image_width, "heightPx": image_height, "path": str(image_path)},
        "targetPlane": {"width": sheet_width, "height": sheet_height, "unit": "inch", "origin": "top_left"},
        "mapping": mapping,
        "physicalRegions": physical_regions,
        "runtimeRegions": regions,
        "edgeProof": proofs,
    }


def extract_scaled_concentric_boundaries(
    image_path: Path,
    semantic_regions: list[Mapping[str, Any]],
    sheet_width: float,
    sheet_height: float,
) -> dict[str, Any]:
    """Extract one target's nested contours; never supplies a family template."""
    if len(semantic_regions) < 2:
        raise BoundaryExtractionError("concentric_extractor_requires_multiple_semantic_regions")
    if len(semantic_regions) > 6:
        raise BoundaryExtractionError("nested_topology_requires_multiple_independent_boundary_chains")
    gray, _, _, records = _load_contour_records(image_path, edges=True)
    height, width = gray.shape
    diagonal = float((width * width + height * height) ** 0.5)
    records = [item for item in records if item["circularity"] >= 0.10 and 0.22 <= item["aspect"] <= 4.5]
    required = len(semantic_regions)
    candidates: list[tuple[float, list[dict[str, Any]]]] = []
    # Combinations are bounded by the largest edge-aligned contours to avoid
    # interpreting text glyphs as physical scoring boundaries.
    pool = sorted(records, key=lambda item: item["area"], reverse=True)[:14]
    for group_tuple in combinations(pool, required):
        group = sorted(group_tuple, key=lambda item: item["area"])
        if not 0.04 <= group[-1]["areaFraction"] <= 0.65:
            continue
        if not width * 0.25 <= group[-1]["centerX"] <= width * 0.75:
            continue
        if not height * 0.15 <= group[-1]["centerY"] <= height * 0.88:
            continue
        centers_x = np.array([item["centerX"] for item in group])
        centers_y = np.array([item["centerY"] for item in group])
        center_spread = float(np.hypot(np.ptp(centers_x), np.ptp(centers_y)) / diagonal)
        if center_spread > 0.045:
            continue
        areas = [item["area"] for item in group]
        if any(not 1.18 <= areas[index + 1] / areas[index] <= 10.0 for index in range(len(areas) - 1)):
            continue
        if any(
            min(group[index + 1]["width"] - group[index]["width"], group[index + 1]["height"] - group[index]["height"])
            < min(width, height) * 0.015
            for index in range(len(group) - 1)
        ):
            continue
        proofs = [_edge_proof(gray, item["contour"])["alignedFraction"] for item in group]
        if min(proofs) < 0.70:
            continue
        # Prefer strong exact-face edges, a compact common center, and a
        # physically substantial outer boundary.
        score = sum(proofs) + group[-1]["areaFraction"] * 4.0 - center_spread * 20.0
        candidates.append((score, group))
    if not candidates:
        raise BoundaryExtractionError("target_specific_concentric_boundary_set_not_isolated")
    candidates.sort(key=lambda item: item[0], reverse=True)
    if len(candidates) > 1 and candidates[0][0] - candidates[1][0] < 0.04:
        raise BoundaryExtractionError("target_specific_concentric_boundary_set_ambiguous")
    selected = candidates[0][1]
    semantics = sorted(
        semantic_regions,
        key=lambda item: int(item.get("priority", 0)),
        reverse=True,
    )
    regions: list[dict[str, Any]] = []
    contours_by_id: dict[str, np.ndarray] = {}
    for semantic, record in zip(semantics, selected):
        region_id = str(semantic["regionId"])
        region = _polygon(record["contour"], width, height, region_id, int(semantic.get("priority", 100)))
        regions.append(region)
        contours_by_id[region_id] = record["contour"]
    return _scaled_result(
        image_path, gray, regions, contours_by_id, sheet_width, sheet_height,
        "target-specific nested exact-face boundaries scaled by publisher physical sheet extent",
    )


def extract_scaled_spatial_zone_boundaries(
    image_path: Path,
    semantic_regions: list[Mapping[str, Any]],
    sheet_width: float,
    sheet_height: float,
) -> dict[str, Any]:
    """Extract upper/central/lower regions contained by one physical target."""
    by_id = {str(item["regionId"]): item for item in semantic_regions}
    required = ("upper_governed_region", "central_governed_region", "lower_governed_region", "remaining_target_area")
    if not all(item in by_id for item in required):
        raise BoundaryExtractionError("spatial_zone_semantics_not_supported")
    gray, _, _, records = _load_contour_records(image_path, edges=True)
    height, width = gray.shape
    records = [
        item for item in records
        if item["circularity"] >= 0.035 and 0.12 <= item["aspect"] <= 6.0
        and _edge_proof(gray, item["contour"])["alignedFraction"] >= 0.70
    ]
    outers = [item for item in records if item["areaFraction"] >= 0.08]
    solutions: list[tuple[float, dict[str, dict[str, Any]]]] = []
    for outer in outers[:8]:
        internal = [
            item for item in records
            if item is not outer
            and 0.002 <= item["areaFraction"] < outer["areaFraction"] * 0.72
            and cv2.pointPolygonTest(outer["contour"], (item["centerX"], item["centerY"]), False) >= 0
        ]
        for group_tuple in combinations(internal[:14], 3):
            group = sorted(group_tuple, key=lambda item: item["centerY"])
            if any(abs(item["centerX"] - outer["centerX"]) > width * 0.12 for item in group):
                continue
            if group[1]["centerY"] - group[0]["centerY"] < height * 0.055:
                continue
            if group[2]["centerY"] - group[1]["centerY"] < height * 0.055:
                continue
            # The three zones must describe distinct vertical structures, not
            # three near-concentric scoring rings with effectively one center.
            overlap = max(item["centerY"] for item in group) - min(item["centerY"] for item in group)
            score = outer["areaFraction"] * 3.0 + sum(item["areaFraction"] for item in group) - overlap / height * 0.15
            solutions.append((score, dict(zip(required[:3], group)) | {required[3]: outer}))
    if not solutions:
        raise BoundaryExtractionError("target_specific_upper_central_lower_boundary_set_not_isolated")
    solutions.sort(key=lambda item: item[0], reverse=True)
    if len(solutions) > 1 and solutions[0][0] - solutions[1][0] < 0.025:
        raise BoundaryExtractionError("target_specific_upper_central_lower_boundary_set_ambiguous")
    selected = solutions[0][1]
    regions: list[dict[str, Any]] = []
    contours_by_id: dict[str, np.ndarray] = {}
    for region_id in required:
        semantic = by_id[region_id]
        record = selected[region_id]
        regions.append(_polygon(record["contour"], width, height, region_id, int(semantic.get("priority", 100))))
        contours_by_id[region_id] = record["contour"]
    return _scaled_result(
        image_path, gray, regions, contours_by_id, sheet_width, sheet_height,
        "target-specific upper/central/lower exact-face boundaries scaled by publisher physical sheet extent",
    )


def extract_scaled_ordered_spatial_boundaries(
    image_path: Path,
    semantic_regions: list[Mapping[str, Any]],
    sheet_width: float,
    sheet_height: float,
) -> dict[str, Any]:
    """Extract a vertical series of distinct, explicitly named regions."""
    if not 2 <= len(semantic_regions) <= 5:
        raise BoundaryExtractionError("ordered_spatial_extractor_requires_two_to_five_regions")
    gray, _, _, records = _load_contour_records(image_path, edges=True)
    height, width = gray.shape
    records = [
        item for item in records
        if item["areaFraction"] >= 0.003
        and item["circularity"] >= 0.025
        and 0.12 <= item["aspect"] <= 6.0
        and abs(item["centerX"] - width / 2) <= width * 0.20
        and _edge_proof(gray, item["contour"])["alignedFraction"] >= 0.70
    ]
    count = len(semantic_regions)
    solutions: list[tuple[float, list[dict[str, Any]]]] = []
    for group_tuple in combinations(records[:16], count):
        group = sorted(group_tuple, key=lambda item: item["centerY"])
        if any(group[index + 1]["centerY"] - group[index]["centerY"] < height * 0.055 for index in range(count - 1)):
            continue
        # Distinct objects may touch or nearly touch, but one selected contour
        # may not contain the center of another; containment means this is a
        # nested topology and belongs to a different extractor.
        if any(
            cv2.pointPolygonTest(a["contour"], (b["centerX"], b["centerY"]), False) >= 0
            for a, b in combinations(group, 2)
        ):
            continue
        score = sum(item["areaFraction"] for item in group) - float(np.std([item["centerX"] for item in group])) / width
        solutions.append((score, group))
    if not solutions:
        raise BoundaryExtractionError("target_specific_ordered_spatial_boundary_set_not_isolated")
    solutions.sort(key=lambda item: item[0], reverse=True)
    if len(solutions) > 1 and solutions[0][0] - solutions[1][0] < 0.02:
        raise BoundaryExtractionError("target_specific_ordered_spatial_boundary_set_ambiguous")
    selected = solutions[0][1]
    regions: list[dict[str, Any]] = []
    contours_by_id: dict[str, np.ndarray] = {}
    for semantic, record in zip(semantic_regions, selected):
        region_id = str(semantic["regionId"])
        regions.append(_polygon(record["contour"], width, height, region_id, int(semantic.get("priority", 100))))
        contours_by_id[region_id] = record["contour"]
    return _scaled_result(
        image_path, gray, regions, contours_by_id, sheet_width, sheet_height,
        "target-specific ordered spatial exact-face boundaries scaled by publisher physical sheet extent",
    )


def _semantic_seed_box(region: Mapping[str, Any]) -> tuple[float, float, float, float] | None:
    """Return correspondence hints only; these values never become output."""
    shape = str(region.get("shape") or "")
    if shape in {"ellipse", "circle"}:
        cx, cy = float(region["cx"]), float(region["cy"])
        rx = float(region.get("radiusX", region.get("radius", 0)))
        ry = float(region.get("radiusY", region.get("radius", 0)))
        return cx - rx, cy - ry, cx + rx, cy + ry
    if shape in {"rectangle", "rounded_rectangle"}:
        return float(region["xMin"]), float(region["yMin"]), float(region["xMax"]), float(region["yMax"])
    if shape == "polygon" and region.get("points"):
        xs = [float(point[0]) for point in region["points"]]
        ys = [float(point[1]) for point in region["points"]]
        return min(xs), min(ys), max(xs), max(ys)
    return None


def _voronoi_cell(index: int, centers: list[tuple[float, float]]) -> list[list[float]]:
    polygon = [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]]
    ax, ay = centers[index]
    for other, (bx, by) in enumerate(centers):
        if other == index:
            continue
        # Points satisfying A*x + B*y <= C are at least as close to A as B.
        a, b = 2 * (bx - ax), 2 * (by - ay)
        c = bx * bx + by * by - ax * ax - ay * ay
        clipped: list[list[float]] = []
        for start, end in zip(polygon, polygon[1:] + polygon[:1]):
            fs = a * start[0] + b * start[1] - c
            fe = a * end[0] + b * end[1] - c
            start_inside, end_inside = fs <= 1e-9, fe <= 1e-9
            if start_inside:
                clipped.append(start)
            if start_inside != end_inside:
                denominator = fs - fe
                t = fs / denominator if denominator else 0.0
                clipped.append([start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1])])
        polygon = clipped
        if not polygon:
            break
    return polygon


def extract_scaled_seeded_exact_boundaries(
    image_path: Path,
    semantic_regions: list[Mapping[str, Any]],
    sheet_width: float,
    sheet_height: float,
    *,
    max_seed_center_distance: float = 0.38,
    max_seed_area_log_distance: float = 4.6,
) -> dict[str, Any]:
    """Snap semantic identities to real closed edges on their exact target face.

    Quarantined geometry is used only as a correspondence hint to distinguish
    multiple real boundaries on one face. Every emitted vertex comes from a
    strong closed exact-face contour and is independently edge-checked.
    """
    gray, _, _, records = _load_contour_records(image_path, edges=True)
    height, width = gray.shape
    candidates = []
    for record in records:
        proof = _edge_proof(gray, record["contour"])
        if proof["alignedFraction"] < 0.76:
            continue
        if record["circularity"] < 0.015 or not 0.08 <= record["aspect"] <= 10.0:
            continue
        candidates.append({**record, "proof": proof})
    if not candidates:
        raise BoundaryExtractionError("exact_face_has_no_usable_closed_boundaries")

    selected: list[tuple[Mapping[str, Any], dict[str, Any], dict[str, Any]]] = []
    complement_semantics: list[Mapping[str, Any]] = []
    used: set[int] = set()
    ordered_semantics = sorted(semantic_regions, key=lambda item: int(item.get("priority", 0)), reverse=True)
    for semantic in ordered_semantics:
        region_id = str(semantic.get("regionId") or "")
        # Misses are the complement of all admitted physical regions. A
        # generated sheet rectangle is not a physical target boundary.
        if region_id.endswith("_miss"):
            complement_semantics.append(semantic)
            continue
        seed = _semantic_seed_box(semantic)
        if seed is None:
            raise BoundaryExtractionError(f"{region_id}_has_no_correspondence_hint")
        sx0, sy0, sx1, sy1 = seed
        scx, scy = (sx0 + sx1) / 2, (sy0 + sy1) / 2
        sarea = max((sx1 - sx0) * (sy1 - sy0), 1e-6)
        ranked = []
        for record in candidates:
            if record["index"] in used:
                continue
            # Peer objects with equal classifier priority must occupy distinct
            # physical locations. Reject another edge of an already selected
            # peer before it can become a second semantic object.
            if any(
                int(other_semantic.get("priority", 0)) == int(semantic.get("priority", 0))
                and np.hypot(
                    record["centerX"] / width - other_record["centerX"] / width,
                    record["centerY"] / height - other_record["centerY"] / height,
                ) < 0.035
                for other_semantic, other_record, _ in selected
            ):
                continue
            if "figure" in region_id and record["areaFraction"] < 0.02:
                continue
            if any(token in region_id for token in ("remaining_target", "main_silhouette")) and record["areaFraction"] < 0.035:
                continue
            x0 = (record["centerX"] - record["width"] / 2) / width
            y0 = (record["centerY"] - record["height"] / 2) / height
            x1 = (record["centerX"] + record["width"] / 2) / width
            y1 = (record["centerY"] + record["height"] / 2) / height
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            area = max((x1 - x0) * (y1 - y0), 1e-6)
            center_distance = float(np.hypot(cx - scx, cy - scy))
            area_distance = abs(log(area / sarea))
            overlap_x = max(0.0, min(x1, sx1) - max(x0, sx0))
            overlap_y = max(0.0, min(y1, sy1) - max(y0, sy0))
            intersection = overlap_x * overlap_y
            union = area + sarea - intersection
            iou = intersection / union if union else 0.0
            score = center_distance * 2.8 + area_distance * 0.22 + (1.0 - iou) * 0.45 - record["proof"]["alignedFraction"] * 0.12
            ranked.append((score, record, {"seedCenterDistance": round(center_distance, 5), "seedAreaLogDistance": round(area_distance, 5), "seedBoxIoU": round(iou, 5)}))
        ranked.sort(key=lambda item: item[0])
        if not ranked:
            raise BoundaryExtractionError(f"{region_id}_exact_boundary_not_found")
        score, record, correspondence = ranked[0]
        if (
            correspondence["seedCenterDistance"] > max_seed_center_distance
            or correspondence["seedAreaLogDistance"] > max_seed_area_log_distance
        ):
            raise BoundaryExtractionError(f"{region_id}_exact_boundary_physically_ambiguous")
        used.add(record["index"])
        selected.append((semantic, record, correspondence))

    if not selected:
        raise BoundaryExtractionError("exact_face_only_contains_nonphysical_miss_placeholders")
    regions: list[dict[str, Any]] = []
    contours_by_id: dict[str, np.ndarray] = {}
    correspondence_proof = []
    for semantic, record, correspondence in selected:
        region_id = str(semantic["regionId"])
        regions.append(_polygon(record["contour"], width, height, region_id, int(semantic.get("priority", 100))))
        contours_by_id[region_id] = record["contour"]
        correspondence_proof.append({"regionId": region_id, **correspondence})
    result = _scaled_result(
        image_path, gray, regions, contours_by_id, sheet_width, sheet_height,
        "closed exact-face edges scaled by publisher physical sheet extent; quarantined geometry used for correspondence only",
    )
    complement_ids = {str(item["regionId"]) for item in complement_semantics}
    if complement_ids and complement_ids != {"upper_miss", "lower_miss"}:
        base_ids = [item[:-5] for item in sorted(complement_ids) if item.endswith("_miss")]
        by_region = {region["regionId"]: region for region in regions}
        if len(base_ids) != len(complement_ids) or any(item not in by_region for item in base_ids):
            raise BoundaryExtractionError("nonphysical_complement_topology_not_supported")
        centers = [
            (
                sum(point[0] for point in by_region[item]["points"]) / len(by_region[item]["points"]),
                sum(point[1] for point in by_region[item]["points"]) / len(by_region[item]["points"]),
            )
            for item in base_ids
        ]
        by_id = {str(item["regionId"]): item for item in complement_semantics}
        complements = [
            {
                "regionId": f"{base_id}_miss", "shape": "polygon", "points": _voronoi_cell(index, centers),
                "priority": int(by_id[f"{base_id}_miss"].get("priority", 1)),
            }
            for index, base_id in enumerate(base_ids)
        ]
        if any(len(region["points"]) < 3 for region in complements):
            raise BoundaryExtractionError("object_miss_partition_not_derivable_from_exact_face")
        result["runtimeRegions"].extend(complements)
        result["physicalRegions"].extend([
            {**region, "points": [[point[0] * sheet_width, point[1] * sheet_height] for point in region["points"]], "unit": "inch"}
            for region in complements
        ])
        result["edgeProof"].extend([
            {"regionId": region["regionId"], "derivedComplement": True, "derivation": "nearest-object partition derived from exact physical object centers"}
            for region in complements
        ])
        correspondence_proof.extend([
            {"regionId": region["regionId"], "derivedComplement": True, "partition": "exact-face object-center Voronoi"} for region in complements
        ])
    elif complement_ids:
        upper = [region for region in regions if region["regionId"].startswith("upper_")]
        lower = [region for region in regions if region["regionId"].startswith("lower_")]
        if not upper or not lower:
            raise BoundaryExtractionError("upper_lower_complement_requires_both_physical_groups")
        upper_bottom = max(max(point[1] for point in region["points"]) for region in upper)
        lower_top = min(min(point[1] for point in region["points"]) for region in lower)
        split = max(0.05, min(0.95, (upper_bottom + lower_top) / 2))
        by_id = {str(item["regionId"]): item for item in complement_semantics}
        complements = [
            {
                "regionId": "upper_miss", "shape": "polygon",
                "points": [[0.0, 0.0], [1.0, 0.0], [1.0, split], [0.0, split]],
                "priority": int(by_id["upper_miss"].get("priority", 2)),
            },
            {
                "regionId": "lower_miss", "shape": "polygon",
                "points": [[0.0, split], [1.0, split], [1.0, 1.0], [0.0, 1.0]],
                "priority": int(by_id["lower_miss"].get("priority", 1)),
            },
        ]
        result["runtimeRegions"].extend(complements)
        result["physicalRegions"].extend([
            {**region, "points": [[point[0] * sheet_width, point[1] * sheet_height] for point in region["points"]], "unit": "inch"}
            for region in complements
        ])
        result["edgeProof"].extend([
            {"regionId": region["regionId"], "derivedComplement": True, "derivation": "upper/lower partition derived from exact physical group extents"}
            for region in complements
        ])
        correspondence_proof.extend([
            {"regionId": region["regionId"], "derivedComplement": True, "splitYNorm": round(split, 6)} for region in complements
        ])
    result["correspondenceProof"] = correspondence_proof
    result["quarantinedGeometryUsedAsAuthority"] = False
    return result


def extract_scaled_object_boundaries(
    image_path: Path,
    region_ids: list[str],
    sheet_width: float,
    sheet_height: float,
    *,
    five_spot: bool = False,
    minimum_object_area_fraction: float = 0.00045,
    require_primary_single_object: bool = False,
) -> dict[str, Any]:
    gray = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if gray is None:
        raise BoundaryExtractionError("exact_registered_face_decode_failed")
    image_height, image_width = gray.shape
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, hierarchy = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    hierarchy = hierarchy[0] if hierarchy is not None else []
    image_area = float(image_width * image_height)
    records = []
    for index, contour in enumerate(contours):
        record = _contour_record(contour, image_area)
        if not record:
            continue
        x, y, width, height = cv2.boundingRect(contour)
        if not minimum_object_area_fraction <= record["areaFraction"] <= 0.78:
            continue
        if x <= 1 or y <= 1 or x + width >= image_width - 1 or y + height >= image_height - 1:
            continue
        if record["circularity"] < 0.45 or not 0.45 <= record["aspect"] <= 2.2:
            continue
        record["index"] = index
        records.append(record)
    records = _deduplicate(records)

    if five_spot:
        spot_ids = [item for item in region_ids if not item.endswith("_aim_point")]
        selected = _similar_cluster(records, len(spot_ids))
        regions: list[dict[str, Any]] = []
        proofs: list[dict[str, Any]] = []
        for ordinal, (region_id, record) in enumerate(zip(spot_ids, selected), start=1):
            regions.append(_polygon(record["contour"], image_width, image_height, region_id, 100 + ordinal))
            proofs.append({"regionId": region_id, **_edge_proof(gray, record["contour"])})
            children = []
            child_index = int(hierarchy[record["index"]][2]) if len(hierarchy) else -1
            while child_index >= 0:
                child = _contour_record(contours[child_index], image_area)
                if child and 0.01 <= child["area"] / record["area"] <= 0.12 and 0.72 <= child["aspect"] <= 1.28:
                    children.append(child)
                child_index = int(hierarchy[child_index][0])
            if len(children) != 1:
                raise BoundaryExtractionError(f"{region_id}_square_aim_point_not_uniquely_extracted")
            aim_id = f"spot_{ordinal}_aim_point"
            regions.append(_polygon(children[0]["contour"], image_width, image_height, aim_id, 200 + ordinal))
            proofs.append({"regionId": aim_id, **_edge_proof(gray, children[0]["contour"])})
    else:
        if len(region_ids) > 1:
            selected = _similar_cluster(records, len(region_ids))
        else:
            selected_record = max(records, key=lambda item: item["area"] * item["circularity"])
            peers = [
                item for item in records
                if abs(item["area"] - selected_record["area"]) / selected_record["area"] <= 0.18
                and ((item["centerX"] - selected_record["centerX"]) ** 2 + (item["centerY"] - selected_record["centerY"]) ** 2) ** 0.5 > max(item["width"], selected_record["width"]) * 0.25
            ]
            if peers:
                raise BoundaryExtractionError("one_semantic_object_conflicts_with_multiple_same_scale_physical_objects")
            if require_primary_single_object:
                if selected_record["areaFraction"] < 0.01:
                    raise BoundaryExtractionError("single_semantic_region_not_a_primary_physical_boundary")
                if not image_width * 0.2 <= selected_record["centerX"] <= image_width * 0.8:
                    raise BoundaryExtractionError("single_semantic_region_not_centered_on_primary_target_face")
                if not image_height * 0.12 <= selected_record["centerY"] <= image_height * 0.9:
                    raise BoundaryExtractionError("single_semantic_region_not_centered_on_primary_target_face")
            selected = [selected_record]
        regions = [_polygon(record["contour"], image_width, image_height, region_id, 100 + index) for index, (region_id, record) in enumerate(zip(region_ids, selected), start=1)]
        proofs = [{"regionId": region_id, **_edge_proof(gray, record["contour"])} for region_id, record in zip(region_ids, selected)]

    if any(item["alignedFraction"] < 0.70 for item in proofs):
        raise BoundaryExtractionError("extracted_boundary_edge_alignment_below_gate")

    physical_regions = []
    for region in regions:
        physical_regions.append({
            **region,
            "points": [[point[0] * sheet_width, point[1] * sheet_height] for point in region["points"]],
            "unit": "inch",
        })
    return {
        "representation": {"widthPx": image_width, "heightPx": image_height, "path": str(image_path)},
        "targetPlane": {"width": sheet_width, "height": sheet_height, "unit": "inch", "origin": "top_left"},
        "mapping": "exact_representation_edges_to_publisher_physical_sheet_extent",
        "physicalRegions": physical_regions,
        "runtimeRegions": regions,
        "edgeProof": proofs,
    }


def extract_scaled_foreground_components(
    image_path: Path,
    region_ids: list[str],
    sheet_width: float,
    sheet_height: float,
) -> dict[str, Any]:
    """Extract distinct printed objects of arbitrary shape from one exact face."""
    color = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if color is None:
        raise BoundaryExtractionError("exact_registered_face_decode_failed")
    height, width = color.shape[:2]
    corner_h, corner_w = max(3, height // 20), max(3, width // 20)
    corners = np.vstack([
        color[:corner_h, :corner_w].reshape(-1, 3), color[:corner_h, -corner_w:].reshape(-1, 3),
        color[-corner_h:, :corner_w].reshape(-1, 3), color[-corner_h:, -corner_w:].reshape(-1, 3),
    ])
    background = np.median(corners, axis=0)
    delta = np.linalg.norm(color.astype(np.float32) - background.astype(np.float32), axis=2)
    gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
    solutions: list[tuple[float, list[dict[str, Any]]]] = []
    for threshold in (15, 20, 25, 30, 35, 45, 55, 70):
        mask = (delta > threshold).astype(np.uint8) * 255
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=1)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        records = []
        for contour in contours:
            record = _contour_record(contour, float(width * height))
            if not record or not 0.0008 <= record["areaFraction"] <= 0.45:
                continue
            x, y, box_width, box_height = cv2.boundingRect(contour)
            if y < height * 0.08 or x <= 1 or x + box_width >= width - 1:
                continue
            if box_width < width * 0.018 or box_height < height * 0.018:
                continue
            record["proof"] = _edge_proof(gray, contour)
            records.append(record)
        records = _deduplicate(records)
        if len(records) != len(region_ids):
            continue
        # Each semantic object must occupy a distinct physical location.
        if any(
            cv2.pointPolygonTest(a["contour"], (b["centerX"], b["centerY"]), False) >= 0
            or cv2.pointPolygonTest(b["contour"], (a["centerX"], a["centerY"]), False) >= 0
            for a, b in combinations(records, 2)
        ):
            continue
        score = sum(item["areaFraction"] for item in records) + min(item["proof"]["alignedFraction"] for item in records)
        solutions.append((score, _reading_order(records)))
    if not solutions:
        raise BoundaryExtractionError("exact_foreground_object_count_not_isolated")
    solutions.sort(key=lambda item: item[0], reverse=True)
    selected = solutions[0][1]
    regions = [
        _polygon(record["contour"], width, height, region_id, 100 + index)
        for index, (region_id, record) in enumerate(zip(region_ids, selected), start=1)
    ]
    contours_by_id = {region_id: record["contour"] for region_id, record in zip(region_ids, selected)}
    return _scaled_result(
        image_path, gray, regions, contours_by_id, sheet_width, sheet_height,
        "distinct exact-face foreground components scaled by publisher physical sheet extent",
    )


def extract_scaled_primary_foreground_boundary(
    image_path: Path,
    region_id: str,
    sheet_width: float,
    sheet_height: float,
) -> dict[str, Any]:
    """Extract the one dominant printed figure from its exact target face."""
    color = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if color is None:
        raise BoundaryExtractionError("exact_registered_face_decode_failed")
    height, width = color.shape[:2]
    corner_h, corner_w = max(3, height // 20), max(3, width // 20)
    corners = np.vstack([
        color[:corner_h, :corner_w].reshape(-1, 3), color[:corner_h, -corner_w:].reshape(-1, 3),
        color[-corner_h:, :corner_w].reshape(-1, 3), color[-corner_h:, -corner_w:].reshape(-1, 3),
    ])
    background = np.median(corners, axis=0)
    delta = np.linalg.norm(color.astype(np.float32) - background.astype(np.float32), axis=2)
    gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
    candidates: list[tuple[float, np.ndarray, dict[str, Any]]] = []
    for threshold in (15, 20, 25, 30, 35, 45, 55, 70, 90):
        mask = (delta > threshold).astype(np.uint8) * 255
        kernel = np.ones((9, 9), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=3)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        for contour in contours:
            record = _contour_record(contour, float(width * height))
            if not record or not 0.025 <= record["areaFraction"] <= 0.85:
                continue
            if not width * 0.15 <= record["centerX"] <= width * 0.85:
                continue
            if not height * 0.18 <= record["centerY"] <= height * 0.88:
                continue
            proof = _edge_proof(gray, contour)
            if proof["alignedFraction"] < 0.35:
                continue
            score = proof["alignedFraction"] * 4.0 + min(record["areaFraction"], 0.60) - max(0.0, record["areaFraction"] - 0.65) * 5.0
            candidates.append((score, contour, proof))
    if not candidates:
        raise BoundaryExtractionError("primary_exact_face_figure_not_isolated")
    candidates.sort(key=lambda item: item[0], reverse=True)
    _, contour, _ = candidates[0]
    region = _polygon(contour, width, height, region_id, 100)
    return _scaled_result(
        image_path, gray, [region], {region_id: contour}, sheet_width, sheet_height,
        "dominant target-specific foreground figure scaled by publisher physical sheet extent",
        minimum_edge_alignment=0.35,
    )


def extract_scaled_three_tone_boundaries(
    image_path: Path,
    region_ids: list[str],
    sheet_width: float,
    sheet_height: float,
) -> dict[str, Any]:
    """Extract the three explicitly printed tone zones from one exact face."""
    if len(region_ids) != 3:
        raise BoundaryExtractionError("three_tone_requires_three_regions")
    color = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if color is None:
        raise BoundaryExtractionError("exact_registered_face_decode_failed")
    height, width = color.shape[:2]
    sample = cv2.resize(color, (max(1, width // 4), max(1, height // 4)))
    data = sample.reshape(-1, 3).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 50, 0.2)
    _, labels, centers = cv2.kmeans(data, 6, None, criteria, 8, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels[:, 0], minlength=len(centers))
    # White paper is the largest/l brightest cluster. The three largest
    # remaining chromatic clusters are the printed three-tone structures.
    brightness = centers.mean(axis=1)
    paper = int(np.argmax(brightness + counts / max(counts) * 30.0))
    tone_clusters = [index for index in np.argsort(counts)[::-1] if index != paper][:3]
    full_labels = np.argmin(
        np.linalg.norm(color.astype(np.float32)[:, :, None, :] - centers[None, None, :, :], axis=3), axis=2,
    )
    extracted = []
    gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
    for cluster in tone_clusters:
        mask = (full_labels == cluster).astype(np.uint8) * 255
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=2)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        records = [item for contour in contours if (item := _contour_record(contour, float(width * height)))]
        records = [item for item in records if item["areaFraction"] >= 0.002]
        if not records:
            raise BoundaryExtractionError("three_tone_zone_not_isolated")
        extracted.append(max(records, key=lambda item: item["area"]))
    extracted.sort(key=lambda item: item["area"], reverse=True)
    regions = [
        _polygon(record["contour"], width, height, region_id, 80 + index * 10)
        for index, (region_id, record) in enumerate(zip(region_ids, extracted), start=1)
    ]
    contours_by_id = {region_id: record["contour"] for region_id, record in zip(region_ids, extracted)}
    return _scaled_result(
        image_path, gray, regions, contours_by_id, sheet_width, sheet_height,
        "three exact printed tone boundaries scaled by publisher physical sheet extent",
    )


def extract_scaled_positioned_objects(
    image_path: Path,
    positions: Mapping[str, tuple[float, float]],
    sheet_width: float,
    sheet_height: float,
) -> dict[str, Any]:
    """Extract explicitly positioned objects from their own exact face."""
    gray, _, _, records = _load_contour_records(image_path, edges=True)
    height, width = gray.shape
    candidates = []
    for record in records:
        proof = _edge_proof(gray, record["contour"])
        if not 0.004 <= record["areaFraction"] <= 0.18 or proof["alignedFraction"] < 0.68:
            continue
        if not 0.25 <= record["aspect"] <= 2.5:
            continue
        candidates.append({**record, "proof": proof})
    selected = []
    used: set[int] = set()
    for region_id, (expected_x, expected_y) in positions.items():
        ranked = []
        for record in candidates:
            if record["index"] in used:
                continue
            x, y = record["centerX"] / width, record["centerY"] / height
            distance = float(np.hypot(x - expected_x, y - expected_y))
            if distance > 0.20:
                continue
            score = distance * 3.0 - record["areaFraction"] * 4.0 - record["proof"]["alignedFraction"] * 0.2
            ranked.append((score, record))
        if not ranked:
            raise BoundaryExtractionError(f"{region_id}_positioned_object_not_isolated")
        ranked.sort(key=lambda item: item[0])
        record = ranked[0][1]
        used.add(record["index"])
        selected.append((region_id, record))
    regions = [
        _polygon(record["contour"], width, height, region_id, 100 + index)
        for index, (region_id, record) in enumerate(selected, start=1)
    ]
    return _scaled_result(
        image_path, gray, regions, {region_id: record["contour"] for region_id, record in selected},
        sheet_width, sheet_height,
        "target-specific positioned exact-face objects scaled by publisher physical sheet extent",
    )


def extract_scaled_internal_regions_with_outer_figure(
    image_path: Path,
    semantic_regions: list[Mapping[str, Any]],
    sheet_width: float,
    sheet_height: float,
) -> dict[str, Any]:
    """Combine printed internal lines with the exact outer target figure."""
    outer_semantics = [
        item for item in semantic_regions
        if any(token in str(item.get("regionId") or "") for token in ("remaining_target", "main_silhouette"))
    ]
    inner_semantics = [item for item in semantic_regions if item not in outer_semantics]
    if len(outer_semantics) != 1 or not inner_semantics:
        raise BoundaryExtractionError("internal_plus_outer_topology_not_supported")
    inner = extract_scaled_seeded_exact_boundaries(
        image_path, inner_semantics, sheet_width, sheet_height,
        max_seed_center_distance=0.55, max_seed_area_log_distance=6.5,
    )
    outer_id = str(outer_semantics[0]["regionId"])
    outer = extract_scaled_primary_foreground_boundary(image_path, outer_id, sheet_width, sheet_height)
    # Preserve the established low priority of the enclosing remainder.
    outer["runtimeRegions"][0]["priority"] = int(outer_semantics[0].get("priority", 20))
    outer["physicalRegions"][0]["priority"] = int(outer_semantics[0].get("priority", 20))
    return {
        "representation": inner["representation"], "targetPlane": inner["targetPlane"],
        "mapping": "exact printed internal boundaries plus exact foreground target outline, scaled by publisher extent",
        "physicalRegions": inner["physicalRegions"] + outer["physicalRegions"],
        "runtimeRegions": inner["runtimeRegions"] + outer["runtimeRegions"],
        "edgeProof": inner["edgeProof"] + outer["edgeProof"],
        "correspondenceProof": inner.get("correspondenceProof", []),
        "quarantinedGeometryUsedAsAuthority": False,
    }


def extract_scaled_largest_internal_with_outer_figure(
    image_path: Path,
    inner_region_id: str,
    outer_region_id: str,
    sheet_width: float,
    sheet_height: float,
) -> dict[str, Any]:
    """Extract one visibly enclosed internal region plus the printed figure.

    This is used only when the exact face itself visibly supplies a single
    dominant internal outline. No prior normalized geometry selects the line.
    """
    gray, _, _, records = _load_contour_records(image_path, edges=True)
    height, width = gray.shape
    candidates: list[tuple[float, dict[str, Any], dict[str, Any]]] = []
    for record in records:
        if not 0.07 <= record["areaFraction"] <= 0.50:
            continue
        cx, cy = record["centerX"] / width, record["centerY"] / height
        if not 0.30 <= cx <= 0.70 or not 0.22 <= cy <= 0.72:
            continue
        proof = _edge_proof(gray, record["contour"])
        if proof["alignedFraction"] < 0.24:
            continue
        score = record["areaFraction"] + proof["alignedFraction"] * 0.30
        candidates.append((score, record, proof))
    if not candidates:
        raise BoundaryExtractionError(f"{inner_region_id}_exact_internal_boundary_not_found")
    candidates.sort(key=lambda item: item[0], reverse=True)
    _, inner_record, _ = candidates[0]
    inner_region = _polygon(inner_record["contour"], width, height, inner_region_id, 100)
    inner = _scaled_result(
        image_path, gray, [inner_region], {inner_region_id: inner_record["contour"]},
        sheet_width, sheet_height,
        "single dominant exact-face internal outline scaled by publisher extent",
        minimum_edge_alignment=0.24,
    )
    outer = extract_scaled_primary_foreground_boundary(
        image_path, outer_region_id, sheet_width, sheet_height,
    )
    outer["runtimeRegions"][0]["priority"] = 20
    outer["physicalRegions"][0]["priority"] = 20
    return {
        "representation": inner["representation"], "targetPlane": inner["targetPlane"],
        "mapping": "dominant exact-face internal outline plus exact foreground target outline, scaled by publisher extent",
        "physicalRegions": inner["physicalRegions"] + outer["physicalRegions"],
        "runtimeRegions": inner["runtimeRegions"] + outer["runtimeRegions"],
        "edgeProof": inner["edgeProof"] + outer["edgeProof"],
        "quarantinedGeometryUsedAsAuthority": False,
    }


def extract_scaled_dartboard_boundaries(
    image_path: Path,
    sector_ids: list[str],
    sheet_width: float,
    sheet_height: float,
) -> dict[str, Any]:
    """Compile the exact printed dartboard and its three sighting bulls."""
    color = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if color is None:
        raise BoundaryExtractionError("exact_registered_face_decode_failed")
    gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape
    _, dark = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(dark, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    board_candidates = []
    for contour in contours:
        area = abs(float(cv2.contourArea(contour)))
        if area < width * height * 0.20:
            continue
        (cx, cy), radius = cv2.minEnclosingCircle(contour)
        if radius <= 0:
            continue
        circularity = area / (pi * radius * radius)
        if circularity >= 0.75:
            board_candidates.append((area, float(cx), float(cy), float(radius), contour))
    if len(board_candidates) != 1:
        raise BoundaryExtractionError("exact_dartboard_outer_circle_not_isolated")
    _, cx, cy, outer_radius, board_contour = board_candidates[0]

    circles = cv2.HoughCircles(
        cv2.GaussianBlur(gray, (5, 5), 1), cv2.HOUGH_GRADIENT, 1.1, 20,
        param1=80, param2=18, minRadius=max(8, int(width * 0.015)), maxRadius=max(20, int(width * 0.065)),
    )
    if circles is None:
        raise BoundaryExtractionError("exact_dartboard_bulls_not_isolated")
    detected = [tuple(float(value) for value in circle) for circle in circles[0]]
    center_candidates = [
        item for item in detected
        if np.hypot(item[0] - cx, item[1] - cy) <= outer_radius * 0.08
    ]
    if not center_candidates:
        raise BoundaryExtractionError("exact_dartboard_center_bull_not_isolated")
    # The printed center object is the complete blue/orange bull, not only its
    # smaller orange interior.
    center_circle = max(center_candidates, key=lambda item: item[2])
    sight_windows = [
        lambda item: item[0] > width * 0.75 and item[1] < height * 0.22,
        lambda item: item[0] < width * 0.22 and item[1] > height * 0.72,
        lambda item: item[0] > width * 0.75 and item[1] > height * 0.72,
    ]
    contour_circles = []
    for contour in contours:
        area = abs(float(cv2.contourArea(contour)))
        if not width * height * 0.002 <= area <= width * height * 0.008:
            continue
        (x, y), radius = cv2.minEnclosingCircle(contour)
        contour_circles.append((float(x), float(y), float(radius)))
    distinct_sights: list[tuple[float, float, float]] = []
    expected_radius = outer_radius * 0.082
    for window in sight_windows:
        candidates = [
            item for item in contour_circles if window(item)
            and outer_radius * 0.055 <= item[2] <= outer_radius * 0.11
        ]
        if not candidates:
            raise BoundaryExtractionError("exact_dartboard_three_sight_bulls_not_isolated")
        distinct_sights.append(min(candidates, key=lambda item: abs(item[2] - expected_radius)))

    def circle_contour(x: float, y: float, radius: float) -> np.ndarray:
        points = [
            [round(x + radius * cos(radians(angle))), round(y + radius * sin(radians(angle)))]
            for angle in range(0, 360, 3)
        ]
        return np.asarray(points, dtype=np.int32).reshape((-1, 1, 2))

    regions: list[dict[str, Any]] = []
    contours_by_id: dict[str, np.ndarray] = {}
    for index, region_id in enumerate(sector_ids):
        center_angle = -90.0 + index * 18.0
        start, end = center_angle - 9.0, center_angle + 9.0
        arc = [
            [round(cx + outer_radius * cos(radians(angle))), round(cy + outer_radius * sin(radians(angle)))]
            for angle in np.linspace(start, end, 18)
        ]
        contour = np.asarray([[round(cx), round(cy)], *arc], dtype=np.int32).reshape((-1, 1, 2))
        regions.append(_polygon(contour, width, height, region_id, 40))
        contours_by_id[region_id] = contour

    bull_specs = [("center_bull", center_circle, 100)] + [
        (f"sight_bull_{index}", circle, 90) for index, circle in enumerate(distinct_sights, start=1)
    ]
    for region_id, (x, y, radius), priority in bull_specs:
        contour = circle_contour(x, y, radius)
        regions.append(_polygon(contour, width, height, region_id, priority))
        contours_by_id[region_id] = contour

    result = _scaled_result(
        image_path, gray, regions, contours_by_id, sheet_width, sheet_height,
        "exact board circle, printed radial sectors, and exact sight-bull circles scaled by publisher extent",
        minimum_edge_alignment=0.12,
    )
    result["extractionFacts"] = {
        "boardCenterPx": [round(cx, 4), round(cy, 4)],
        "boardOuterRadiusPx": round(outer_radius, 4),
        "centerBullPx": [round(value, 4) for value in center_circle],
        "sightBullsPx": [[round(value, 4) for value in item] for item in distinct_sights],
        "sectorOrientation": "printed 20 sector centered vertically above exact board center; clockwise printed order",
    }
    return result
