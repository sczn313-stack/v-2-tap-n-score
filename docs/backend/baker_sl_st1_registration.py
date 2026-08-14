"""Mission B backend authority for real-photo Baker SL-ST1 registration.

The photographed evidence is never geometry authority. This module verifies a
real capture against governed Baker evidence, maps it into the registered UGO
plane, applies the Founder-approved empirical gate, and only then hands the
backend-derived coordinates to unchanged Mission A scoring.
"""
from __future__ import annotations

import hashlib
import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Mapping, Sequence, Tuple

import cv2
import numpy as np

from baker_sl_st1_scoring import score_canonical_impacts


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_ROOT = ROOT / "authority-evidence" / "baker-sl-st1"
CANONICAL_PATH = EVIDENCE_ROOT / "BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp"
UGO_PATH = EVIDENCE_ROOT / "BAKER_SL_ST1_UGO_REGISTRATION_V1.json"
GATE_PATH = EVIDENCE_ROOT / "BAKER_SL_ST1_MISSION_B_RUNTIME_GATE_V1.json"


class BakerSLST1RegistrationError(ValueError):
    def __init__(self, reason: str, details: Mapping[str, Any] | None = None):
        super().__init__(reason)
        self.reason = reason
        self.payload = {"ok": False, "status": "registration_rejected", "reason": reason}
        if details:
            self.payload["details"] = dict(details)


def _read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _point_segment_distance(point: Sequence[float], start: Sequence[float], end: Sequence[float]) -> float:
    point_value = np.asarray(point, dtype=np.float64)
    start_value = np.asarray(start, dtype=np.float64)
    end_value = np.asarray(end, dtype=np.float64)
    segment = end_value - start_value
    denominator = float(segment @ segment)
    if denominator == 0:
        return float(np.linalg.norm(point_value - start_value))
    factor = max(0.0, min(1.0, float((point_value - start_value) @ segment) / denominator))
    return float(np.linalg.norm(point_value - (start_value + factor * segment)))


def _near_polyline(point: Sequence[float], polygon: np.ndarray, radius: float = 22) -> bool:
    return min(
        _point_segment_distance(point, start, end)
        for start, end in zip(polygon, np.vstack([polygon[1:], polygon[:1]]))
    ) <= radius


def _in_bounds(point: Sequence[float], bounds: Mapping[str, Any], margin: float = 8) -> bool:
    x_value, y_value = point
    return (
        float(bounds["left"]) - margin <= x_value <= float(bounds["right"]) + margin
        and float(bounds["top"]) - margin <= y_value <= float(bounds["bottom"]) + margin
    )


@lru_cache(maxsize=1)
def _context() -> Dict[str, Any]:
    ugo = _read_json(UGO_PATH)
    gate = _read_json(GATE_PATH)
    canonical_bytes = CANONICAL_PATH.read_bytes()
    canonical_hash = hashlib.sha256(canonical_bytes).hexdigest()
    if gate["status"] != "founder_approved_initial_runtime_gate":
        raise BakerSLST1RegistrationError("registration_gate_not_approved")
    if gate["canonicalAssetSha256"] != canonical_hash:
        raise BakerSLST1RegistrationError("registration_canonical_asset_mismatch")
    if gate["registrationId"] != ugo["registrationId"]:
        raise BakerSLST1RegistrationError("registration_geometry_authority_mismatch")
    for evidence in gate["sourceEvidence"].values():
        evidence_path = EVIDENCE_ROOT / evidence["path"]
        if hashlib.sha256(evidence_path.read_bytes()).hexdigest() != evidence["sha256"]:
            raise BakerSLST1RegistrationError("registration_source_evidence_mismatch")
    canonical = cv2.imdecode(np.frombuffer(canonical_bytes, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
    if canonical is None:
        raise BakerSLST1RegistrationError("registration_canonical_asset_unreadable")
    sift = cv2.SIFT_create(nfeatures=14000, contrastThreshold=0.02, edgeThreshold=14)
    canonical_keypoints, canonical_descriptors = sift.detectAndCompute(canonical, None)
    boundaries = {
        item["featureId"]: np.float32([[point["xPx"], point["yPx"]] for point in item["points"]])
        for item in ugo["observableGeometry"]["boundaries"]
    }
    regions = {item["featureId"]: item["boundsPx"] for item in ugo["observableGeometry"]["printedBoundaryRegions"]}
    return {
        "ugo": ugo,
        "gate": gate,
        "canonical": canonical,
        "canonicalHash": canonical_hash,
        "sift": sift,
        "canonicalKeypoints": canonical_keypoints,
        "canonicalDescriptors": canonical_descriptors,
        "boundaries": boundaries,
        "publisher": regions["printed_boundary_region_003"],
        "table": regions["printed_boundary_region_001"],
    }


def _mutual_matches(context: Mapping[str, Any], image: np.ndarray):
    image_keypoints, image_descriptors = context["sift"].detectAndCompute(image, None)
    if image_descriptors is None:
        return image_keypoints, []
    matcher = cv2.BFMatcher(cv2.NORM_L2)
    forward = matcher.knnMatch(context["canonicalDescriptors"], image_descriptors, k=2)
    reverse = matcher.knnMatch(image_descriptors, context["canonicalDescriptors"], k=2)
    forward_good = {match.queryIdx: match for match, other in forward if match.distance < 0.72 * other.distance}
    reverse_good = {match.queryIdx: match for match, other in reverse if match.distance < 0.72 * other.distance}
    matches = []
    for query_index, match in forward_good.items():
        reverse_match = reverse_good.get(match.trainIdx)
        if reverse_match is not None and reverse_match.trainIdx == query_index:
            matches.append(match)
    return image_keypoints, matches


def _sample_polyline(polygon: np.ndarray, step: float = 3.0) -> np.ndarray:
    points = []
    for start, end in zip(polygon, np.vstack([polygon[1:], polygon[:1]])):
        count = max(2, int(math.ceil(float(np.linalg.norm(end - start)) / step)))
        for factor in np.linspace(0, 1, count, endpoint=False):
            points.append(start + factor * (end - start))
    return np.float32(points)


def _registration_residual(context: Mapping[str, Any], warped: np.ndarray) -> Dict[str, float]:
    edges = cv2.Canny(warped, 50, 140)
    distance = cv2.distanceTransform((edges == 0).astype(np.uint8), cv2.DIST_L2, 5)
    values = []
    for name in ("printed_boundary_003", "printed_boundary_004", "printed_boundary_005"):
        samples = _sample_polyline(context["boundaries"][name])
        x_indices = np.clip(np.rint(samples[:, 0]).astype(int), 0, warped.shape[1] - 1)
        y_indices = np.clip(np.rint(samples[:, 1]).astype(int), 0, warped.shape[0] - 1)
        values.extend(distance[y_indices, x_indices].astype(float).tolist())
    measured = np.asarray(values)
    return {
        "sampleCount": int(len(measured)),
        "rmsPx": round(float(np.sqrt(np.mean(measured ** 2))), 4),
        "p95Px": round(float(np.percentile(measured, 95)), 4),
        "maxPx": round(float(np.max(measured)), 4),
    }


def _bootstrap_stability(homography: np.ndarray, source: np.ndarray, destination: np.ndarray) -> Dict[str, float]:
    probes = np.float32([
        [438, 133], [701, 133], [306, 482], [834, 482], [438, 975],
        [702, 975], [394, 1184], [746, 1184], [570, 750],
    ]).reshape(-1, 1, 2)
    source_probes = cv2.perspectiveTransform(probes, np.linalg.inv(homography))
    seed = int(hashlib.sha256(np.ascontiguousarray(homography).tobytes()).hexdigest()[:16], 16)
    random = np.random.default_rng(seed)
    deviations = []
    sample_size = max(4, int(math.ceil(len(source) * 0.75)))
    for _ in range(100):
        indices = random.choice(len(source), sample_size, replace=False)
        candidate, _ = cv2.findHomography(source[indices], destination[indices], 0)
        if candidate is None or not np.isfinite(candidate).all():
            continue
        projected = cv2.perspectiveTransform(source_probes, candidate)
        deviations.extend(np.linalg.norm(projected[:, 0, :] - probes[:, 0, :], axis=1).tolist())
    if not deviations:
        raise BakerSLST1RegistrationError("registration_stability_unavailable")
    measured = np.asarray(deviations)
    return {
        "modelCount": int(len(deviations) / len(probes)),
        "rmsPx": round(float(np.sqrt(np.mean(measured ** 2))), 4),
        "p95Px": round(float(np.percentile(measured, 95)), 4),
        "maxPx": round(float(np.max(measured)), 4),
    }


def _gate_exceeded(measured: Mapping[str, float], thresholds: Mapping[str, float]) -> bool:
    return (
        measured["rmsPx"] > thresholds["rmsMax"]
        or measured["p95Px"] > thresholds["p95Max"]
        or measured["maxPx"] > thresholds["maximumMax"]
    )


def register_photo_impacts(*, image_bytes: bytes, image_sha256: str, width_px: int, height_px: int, impacts: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    context = _context()
    backend_hash = hashlib.sha256(image_bytes).hexdigest()
    if backend_hash != image_sha256:
        raise BakerSLST1RegistrationError("image_sha256_mismatch")
    color = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if color is None:
        raise BakerSLST1RegistrationError("image_evidence_unreadable")
    height, width = color.shape[:2]
    if width != int(width_px) or height != int(height_px):
        raise BakerSLST1RegistrationError("image_dimensions_mismatch")
    gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
    image_keypoints, matches = _mutual_matches(context, gray)
    outer = context["boundaries"]["printed_boundary_002"]
    publisher_matches = [match for match in matches if _in_bounds(context["canonicalKeypoints"][match.queryIdx].pt, context["publisher"])]
    table_matches = [match for match in matches if _in_bounds(context["canonicalKeypoints"][match.queryIdx].pt, context["table"])]
    outer_matches = [match for match in matches if _near_polyline(context["canonicalKeypoints"][match.queryIdx].pt, outer)]
    thresholds = context["gate"]["identityAndCorrespondence"]
    if len(publisher_matches) < thresholds["publisherRegionMatchesMin"]:
        raise BakerSLST1RegistrationError("target_identity_unverified", {"publisherRegionMatches": len(publisher_matches)})
    if len(table_matches) < thresholds["scoringTableMatchesMin"] or len(outer_matches) < thresholds["exteriorBoundaryMatchesMin"]:
        raise BakerSLST1RegistrationError("insufficient_authoritative_geometry", {
            "scoringTableMatches": len(table_matches), "exteriorBoundaryMatches": len(outer_matches)
        })
    source = np.float32([image_keypoints[match.trainIdx].pt for match in matches])
    destination = np.float32([context["canonicalKeypoints"][match.queryIdx].pt for match in matches])
    cv2.setRNGSeed(0)
    homography, mask = cv2.findHomography(source, destination, cv2.RANSAC, 6.0, maxIters=10000, confidence=0.999)
    if homography is None or mask is None:
        raise BakerSLST1RegistrationError("homography_unavailable")
    inlier_mask = mask.ravel().astype(bool)
    inlier_count = int(inlier_mask.sum())
    inlier_ratio = float(inlier_mask.mean())
    if inlier_count < thresholds["homographyInliersMin"] or inlier_ratio < thresholds["homographyInlierRatioMin"]:
        raise BakerSLST1RegistrationError("insufficient_authoritative_geometry", {
            "homographyInliers": inlier_count, "homographyInlierRatio": round(inlier_ratio, 4)
        })
    canonical = context["canonical"]
    warped = cv2.warpPerspective(gray, homography, (canonical.shape[1], canonical.shape[0]), flags=cv2.INTER_LINEAR, borderValue=255)
    residual = _registration_residual(context, warped)
    bootstrap = _bootstrap_stability(homography, source[inlier_mask], destination[inlier_mask])
    if _gate_exceeded(residual, context["gate"]["independentResidualPx"]):
        raise BakerSLST1RegistrationError("registration_residual_exceeded", residual)
    if _gate_exceeded(bootstrap, context["gate"]["bootstrapStabilityPx"]):
        raise BakerSLST1RegistrationError("registration_stability_exceeded", bootstrap)

    source_points = np.float32([
        [float(impact["xNorm"]) * (width - 1), float(impact["yNorm"]) * (height - 1)]
        for impact in impacts
    ]).reshape(-1, 1, 2)
    canonical_points = cv2.perspectiveTransform(source_points, homography)[:, 0, :]
    decisive = [context["boundaries"][name] for name in (
        "printed_boundary_002", "printed_boundary_003", "printed_boundary_004", "printed_boundary_005"
    )]
    transformed = []
    ambiguous = []
    for index, point in enumerate(canonical_points, start=1):
        nearest = min(
            _point_segment_distance(point, start, end)
            for polygon in decisive
            for start, end in zip(polygon, np.vstack([polygon[1:], polygon[:1]]))
        )
        record = {
            "impactId": f"impact-{index:03d}",
            "xNorm": round(float(point[0]) / (canonical.shape[1] - 1), 8),
            "yNorm": round(float(point[1]) / (canonical.shape[0] - 1), 8),
            "sourceEvidencePoint": {
                "xNorm": round(float(impacts[index - 1]["xNorm"]), 8),
                "yNorm": round(float(impacts[index - 1]["yNorm"]), 8),
            },
            "registrationBoundaryClearancePx": round(nearest, 4),
        }
        if nearest <= residual["maxPx"]:
            ambiguous.append(index)
        transformed.append(record)
    if ambiguous:
        raise BakerSLST1RegistrationError("indeterminate_boundary", {
            "impactCountIdentifiers": ambiguous, "uncertaintyRadiusPx": residual["maxPx"]
        })

    scored = score_canonical_impacts({
        "coordinateSystemId": context["ugo"]["coordinateSystem"]["coordinateSystemId"],
        "registrationId": context["ugo"]["registrationId"],
        "canonicalAssetSha256": context["canonicalHash"],
        "impacts": transformed,
    })
    for index, impact in enumerate(scored["impacts"]):
        impact["sourceEvidencePoint"] = transformed[index]["sourceEvidencePoint"]
        impact["registrationBoundaryClearancePx"] = transformed[index]["registrationBoundaryClearancePx"]
    scored["status"] = "registered_real_photo_scoring_ready"
    scored["registration"] = {
        "status": "pass",
        "authorityId": context["gate"]["authorityId"],
        "sourceImageSha256": backend_hash,
        "sourceDimensions": {"widthPx": width, "heightPx": height},
        "canonicalAssetSha256": context["canonicalHash"],
        "transformedImpactCount": len(scored["impacts"]),
        "metrics": {
            "identityEvidence": {
                "publisherRegionMatches": len(publisher_matches),
                "scoringTableMatches": len(table_matches),
                "exteriorBoundaryMatches": len(outer_matches),
                "homographyInliers": inlier_count,
                "homographyInlierRatio": round(inlier_ratio, 4),
            },
            "residual": residual,
            "bootstrap": bootstrap,
        },
    }
    scored["authorityTrace"]["registrationAuthority"] = "backend"
    scored["authorityTrace"]["registrationAuthorityId"] = context["gate"]["authorityId"]
    scored["authorityTrace"]["sourceEvidenceSha256"] = backend_hash
    return scored
