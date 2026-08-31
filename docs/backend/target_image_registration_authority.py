"""Reusable, claim-neutral Target Image Registration Authority.

Registration reports what SCZN3 governably knows about a photograph.  It does
not decide whether that knowledge is sufficient for a zero, score,
classification, qualification, or evidence-only claim.
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import json
import math
import re
from collections import OrderedDict
from functools import lru_cache
from pathlib import Path
from threading import RLock
from typing import Any, Dict, Mapping, Sequence

import cv2
import numpy as np


DOCS_ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = Path(__file__).resolve().parent / "registries" / "target_image_registration_packages.json"
DATA_URL_PATTERN = re.compile(r"^data:(image/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$")
SHA256_PATTERN = re.compile(r"^[a-f0-9]{64}$")
MAX_IMAGE_BYTES = 25 * 1024 * 1024
TRANSFORM_CACHE_LIMIT = 16
_TRANSFORM_CACHE: "OrderedDict[tuple[str, str, int, int], Dict[str, Any]]" = OrderedDict()
_TRANSFORM_CACHE_LOCK = RLock()


class TargetImageRegistrationError(ValueError):
    def __init__(self, reason: str, status: str = "registration_rejected", details: Mapping[str, Any] | None = None, http_status: int = 422):
        super().__init__(reason)
        self.reason = reason
        self.http_status = http_status
        self.payload = {"ok": False, "status": status, "reason": reason}
        if details:
            self.payload["details"] = dict(details)


def _stable_hash(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def registration_packages() -> Dict[str, Dict[str, Any]]:
    registry = _read_json(REGISTRY_PATH)
    packages = registry.get("packages")
    if not isinstance(packages, list):
        raise TargetImageRegistrationError("registration_package_registry_invalid", "configuration_error", http_status=503)
    result: Dict[str, Dict[str, Any]] = {}
    for package in packages:
        if not isinstance(package, Mapping) or not package.get("registrationPackageId"):
            raise TargetImageRegistrationError("registration_package_registry_invalid", "configuration_error", http_status=503)
        package_id = str(package["registrationPackageId"])
        if package_id in result:
            raise TargetImageRegistrationError("registration_package_identity_duplicate", "configuration_error", {"registrationPackageId": package_id}, 503)
        result[package_id] = dict(package)
    return result


def registration_package(package_id: str) -> Dict[str, Any]:
    package = registration_packages().get(str(package_id or ""))
    if not package:
        raise TargetImageRegistrationError("registration_package_unavailable", details={"registrationPackageId": package_id}, http_status=404)
    return package


def decode_image_evidence(image: Mapping[str, Any]) -> Dict[str, Any]:
    if not isinstance(image, Mapping):
        raise TargetImageRegistrationError("image_evidence_required")
    claimed = str(image.get("sha256") or "").lower()
    if not SHA256_PATTERN.fullmatch(claimed):
        raise TargetImageRegistrationError("image_sha256_required")
    match = DATA_URL_PATTERN.fullmatch(str(image.get("dataUrl") or ""))
    if not match:
        raise TargetImageRegistrationError("image_data_url_invalid")
    try:
        image_bytes = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError) as exc:
        raise TargetImageRegistrationError("image_data_base64_invalid") from exc
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise TargetImageRegistrationError("image_data_size_invalid")
    backend_hash = hashlib.sha256(image_bytes).hexdigest()
    if backend_hash != claimed:
        raise TargetImageRegistrationError("image_sha256_mismatch")
    decoded = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if decoded is None:
        raise TargetImageRegistrationError("image_evidence_unreadable")
    height, width = decoded.shape[:2]
    try:
        supplied_width = int(image.get("widthPx"))
        supplied_height = int(image.get("heightPx"))
    except (TypeError, ValueError) as exc:
        raise TargetImageRegistrationError("image_dimensions_required") from exc
    if (width, height) != (supplied_width, supplied_height):
        raise TargetImageRegistrationError("image_dimensions_mismatch")
    return {
        "bytes": image_bytes,
        "decoded": decoded,
        "sha256": backend_hash,
        "mediaType": match.group(1),
        "width": width,
        "height": height,
        "byteLength": len(image_bytes),
    }


def _normal(value: Any, reason: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)):
        raise TargetImageRegistrationError(reason)
    parsed = float(value)
    if parsed < 0 or parsed > 1:
        raise TargetImageRegistrationError(reason)
    return parsed


def normalize_observations(observations: Any) -> list[Dict[str, Any]]:
    if observations is None:
        return []
    if not isinstance(observations, list) or len(observations) > 500:
        raise TargetImageRegistrationError("registration_observations_invalid")
    normalized = []
    for index, item in enumerate(observations, start=1):
        if not isinstance(item, Mapping):
            raise TargetImageRegistrationError("registration_observation_invalid", details={"observationIndex": index})
        normalized.append({
            "observationId": str(item.get("observationId") or f"observation-{index:03d}"),
            "role": str(item.get("role") or "observation"),
            "xNorm": _normal(item.get("xNorm"), "registration_observation_x_out_of_bounds"),
            "yNorm": _normal(item.get("yNorm"), "registration_observation_y_out_of_bounds"),
        })
    return normalized


@lru_cache(maxsize=32)
def _package_context(package_id: str) -> Dict[str, Any]:
    package = registration_package(package_id)
    representation = package["canonicalRepresentation"]
    path = DOCS_ROOT / representation["path"]
    if not path.is_file():
        raise TargetImageRegistrationError("canonical_representation_missing", "configuration_error", {"path": representation["path"]}, 503)
    canonical_bytes = path.read_bytes()
    actual_hash = hashlib.sha256(canonical_bytes).hexdigest()
    if actual_hash != representation["sha256"]:
        raise TargetImageRegistrationError("canonical_representation_hash_mismatch", "configuration_error", http_status=503)
    canonical_color = cv2.imdecode(np.frombuffer(canonical_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if canonical_color is None:
        raise TargetImageRegistrationError("canonical_representation_unreadable", "configuration_error", http_status=503)
    height, width = canonical_color.shape[:2]
    if width != int(representation["pixelWidth"]) or height != int(representation["pixelHeight"]):
        raise TargetImageRegistrationError("canonical_representation_dimensions_mismatch", "configuration_error", http_status=503)
    canonical_gray = cv2.cvtColor(canonical_color, cv2.COLOR_BGR2GRAY)
    sift = cv2.SIFT_create(nfeatures=12000, contrastThreshold=0.015, edgeThreshold=16)
    keypoints, descriptors = sift.detectAndCompute(canonical_gray, None)
    if descriptors is None:
        raise TargetImageRegistrationError("canonical_representation_features_unavailable", "configuration_error", http_status=503)
    return {
        "package": package,
        "canonical": canonical_color,
        "canonicalGray": canonical_gray,
        "sift": sift,
        "keypoints": keypoints,
        "descriptors": descriptors,
    }


def _visible_canonical_coverage(homography: np.ndarray, source_width: int, source_height: int, canonical_width: int, canonical_height: int) -> float:
    source_corners = np.float32([[[0, 0], [source_width - 1, 0], [source_width - 1, source_height - 1], [0, source_height - 1]]])
    mapped = cv2.perspectiveTransform(source_corners, homography)[0].astype(np.float32)
    canonical_rect = np.float32([[0, 0], [canonical_width - 1, 0], [canonical_width - 1, canonical_height - 1], [0, canonical_height - 1]])
    hull = cv2.convexHull(mapped)
    try:
        intersection_area, _ = cv2.intersectConvexConvex(hull, canonical_rect)
    except cv2.error:
        return 0.0
    canonical_area = float((canonical_width - 1) * (canonical_height - 1))
    return max(0.0, min(1.0, float(intersection_area) / canonical_area)) if canonical_area else 0.0


def _local_uncertainty(point: Sequence[float], inlier_destinations: np.ndarray, residuals: np.ndarray, base_uncertainty: float) -> float:
    if not len(inlier_destinations):
        return float(base_uncertainty)
    distances = np.linalg.norm(inlier_destinations - np.float32(point), axis=1)
    nearest_count = min(8, len(distances))
    nearest = np.argpartition(distances, nearest_count - 1)[:nearest_count]
    local_residual = float(np.percentile(residuals[nearest], 95))
    spacing_penalty = float(np.min(distances)) * 0.002
    return round(float(base_uncertainty) + local_residual + spacing_penalty, 4)


def _cached_transform(key: tuple[str, str, int, int]) -> Dict[str, Any] | None:
    with _TRANSFORM_CACHE_LOCK:
        cached = _TRANSFORM_CACHE.get(key)
        if cached is not None:
            _TRANSFORM_CACHE.move_to_end(key)
        return cached


def _remember_transform(key: tuple[str, str, int, int], value: Dict[str, Any]) -> None:
    with _TRANSFORM_CACHE_LOCK:
        _TRANSFORM_CACHE[key] = value
        _TRANSFORM_CACHE.move_to_end(key)
        while len(_TRANSFORM_CACHE) > TRANSFORM_CACHE_LIMIT:
            _TRANSFORM_CACHE.popitem(last=False)


def canonical_point_to_source_percent(registration: Mapping[str, Any] | None, point: Mapping[str, Any] | None) -> Dict[str, float] | None:
    """Project one governed canonical point back onto the admitted source photograph."""
    if not registration or not point:
        return None
    matrix_values = registration.get("sourceToCanonicalMatrix")
    canonical = registration.get("canonicalRepresentation") or {}
    source = registration.get("sourceImage") or {}
    try:
        matrix = np.asarray(matrix_values, dtype=np.float64)
        inverse = np.linalg.inv(matrix)
        canonical_width = int(canonical["pixelWidth"])
        canonical_height = int(canonical["pixelHeight"])
        source_width = int(source["widthPx"])
        source_height = int(source["heightPx"])
        canonical_point = np.float32([[[(float(point["xPercent"]) / 100) * (canonical_width - 1), (float(point["yPercent"]) / 100) * (canonical_height - 1)]]])
        source_point = cv2.perspectiveTransform(canonical_point, inverse)[0, 0]
    except (KeyError, TypeError, ValueError, np.linalg.LinAlgError, cv2.error):
        return None
    if source_width <= 1 or source_height <= 1:
        return None
    return {
        "xPercent": round(float(source_point[0]) / (source_width - 1) * 100, 4),
        "yPercent": round(float(source_point[1]) / (source_height - 1) * 100, 4),
    }


def _unavailable_evidence(package: Mapping[str, Any], evidence: Mapping[str, Any], reason: str, details: Mapping[str, Any] | None = None) -> Dict[str, Any]:
    result = {
        "ok": True,
        "schemaVersion": "sczn3-target-image-registration-evidence-v1",
        "knowledgeState": "unavailable",
        "targetProfileId": package["targetProfileId"],
        "targetProfileVersion": package["targetProfileVersion"],
        "registrationPackageId": package["registrationPackageId"],
        "registrationPackageVersion": package["registrationPackageVersion"],
        "sourceImage": {"sha256": evidence["sha256"], "widthPx": evidence["width"], "heightPx": evidence["height"]},
        "canonicalRepresentation": dict(package["canonicalRepresentation"]),
        "canonicalCoordinateSystemId": package["canonicalCoordinateSystemId"],
        "ugoAuthorityId": package["ugoAuthorityId"],
        "reason": reason,
        "details": dict(details or {}),
        "claimSufficiencyOwner": "downstream_mission_authority",
        "recovery": {"action": "retake_photo", "shooterMessage": "We need a little more of the target in the picture. Take another photo."},
        "canonicalObservations": [],
    }
    result["registrationEvidenceHash"] = _stable_hash(result)
    result["registrationEvidenceId"] = f"TIR-{result['registrationEvidenceHash'][:24].upper()}"
    return result


def register_decoded_image(package_id: str, evidence: Mapping[str, Any], observations: Any = None) -> Dict[str, Any]:
    context = _package_context(package_id)
    package = context["package"]
    representation = package["canonicalRepresentation"]
    normalized = normalize_observations(observations)
    canonical_width = int(representation["pixelWidth"])
    canonical_height = int(representation["pixelHeight"])
    base_uncertainty = float(package.get("baseGeometryUncertaintyPx") or 0)
    cache_key = (package_id, str(evidence["sha256"]), int(evidence["width"]), int(evidence["height"]))
    cached = _cached_transform(cache_key)

    if cached is not None:
        matrix = cached["matrix"]
        method = cached["method"]
        metrics = cached["metrics"]
        inlier_destinations = cached["inlierDestinations"]
        residuals = cached["residuals"]
        knowledge_state = cached["knowledgeState"]
    elif evidence["sha256"] == representation["sha256"]:
        if evidence["width"] != canonical_width or evidence["height"] != canonical_height:
            raise TargetImageRegistrationError("canonical_representation_dimensions_mismatch")
        matrix = np.eye(3, dtype=np.float64)
        method = "exact_canonical_representation"
        metrics = {"mutualMatches": None, "inliers": None, "inlierRatio": 1.0, "reprojectionRmsPx": 0.0, "reprojectionP95Px": 0.0, "targetCoverage": 1.0}
        inlier_destinations = np.empty((0, 2), dtype=np.float32)
        residuals = np.empty((0,), dtype=np.float32)
        knowledge_state = "exact"
    else:
        gray = cv2.cvtColor(evidence["decoded"], cv2.COLOR_BGR2GRAY)
        keypoints, descriptors = context["sift"].detectAndCompute(gray, None)
        if descriptors is None:
            return _unavailable_evidence(package, evidence, "target_identity_unverified")
        gate = package["integrityGates"]
        matcher = cv2.BFMatcher(cv2.NORM_L2)
        forward = matcher.knnMatch(context["descriptors"], descriptors, k=2)
        reverse = matcher.knnMatch(descriptors, context["descriptors"], k=2)
        ratio = float(gate.get("ratioTest") or 0.72)
        forward_good = {m.queryIdx: m for m, n in forward if m.distance < ratio * n.distance}
        reverse_good = {m.queryIdx: m for m, n in reverse if m.distance < ratio * n.distance}
        matches = [m for query, m in forward_good.items() if m.trainIdx in reverse_good and reverse_good[m.trainIdx].trainIdx == query]
        if len(matches) < int(gate["minimumMutualMatches"]):
            return _unavailable_evidence(package, evidence, "target_identity_unverified", {"mutualMatches": len(matches)})
        source_points = np.float32([keypoints[m.trainIdx].pt for m in matches])
        destination_points = np.float32([context["keypoints"][m.queryIdx].pt for m in matches])
        cv2.setRNGSeed(0)
        matrix, mask = cv2.findHomography(
            source_points,
            destination_points,
            cv2.RANSAC,
            float(gate.get("ransacThresholdPx") or 5),
            maxIters=10000,
            confidence=0.999,
        )
        if matrix is None or mask is None:
            return _unavailable_evidence(package, evidence, "registration_transform_unavailable")
        inliers = mask.ravel().astype(bool)
        inlier_count = int(inliers.sum())
        inlier_ratio = float(inliers.mean())
        if inlier_count < int(gate["minimumInliers"]) or inlier_ratio < float(gate["minimumInlierRatio"]):
            return _unavailable_evidence(package, evidence, "target_identity_unverified", {"inliers": inlier_count, "inlierRatio": round(inlier_ratio, 4)})
        projected = cv2.perspectiveTransform(source_points[inliers].reshape(-1, 1, 2), matrix)[:, 0, :]
        inlier_destinations = destination_points[inliers]
        residuals = np.linalg.norm(projected - inlier_destinations, axis=1)
        rms = float(np.sqrt(np.mean(residuals ** 2)))
        p95 = float(np.percentile(residuals, 95))
        coverage = _visible_canonical_coverage(matrix, evidence["width"], evidence["height"], canonical_width, canonical_height)
        method = "ugo_sift_homography_v1"
        metrics = {
            "mutualMatches": len(matches),
            "inliers": inlier_count,
            "inlierRatio": round(inlier_ratio, 4),
            "reprojectionRmsPx": round(rms, 4),
            "reprojectionP95Px": round(p95, 4),
            "targetCoverage": round(coverage, 4),
        }
        knowledge_state = "estimated" if coverage >= float(gate.get("minimumTargetCoverage") or 0) else "partial"

    if cached is None:
        _remember_transform(cache_key, {
            "matrix": matrix,
            "method": method,
            "metrics": metrics,
            "inlierDestinations": inlier_destinations,
            "residuals": residuals,
            "knowledgeState": knowledge_state,
        })

    canonical_observations = []
    if normalized:
        source_values = np.float32([[[item["xNorm"] * (evidence["width"] - 1), item["yNorm"] * (evidence["height"] - 1)] for item in normalized]])
        mapped_values = cv2.perspectiveTransform(source_values, matrix)[0]
        for item, mapped in zip(normalized, mapped_values):
            x_px, y_px = float(mapped[0]), float(mapped[1])
            inside = 0 <= x_px <= canonical_width - 1 and 0 <= y_px <= canonical_height - 1
            uncertainty = base_uncertainty if method == "exact_canonical_representation" else _local_uncertainty(mapped, inlier_destinations, residuals, base_uncertainty)
            canonical_observations.append({
                "observationId": item["observationId"],
                "role": item["role"],
                "sourcePoint": {"xNorm": round(item["xNorm"], 8), "yNorm": round(item["yNorm"], 8)},
                "canonicalPointPx": {"x": round(x_px, 4), "y": round(y_px, 4)},
                "canonicalPoint": {"xNorm": round(x_px / (canonical_width - 1), 8), "yNorm": round(y_px / (canonical_height - 1), 8)},
                "localUncertaintyPx": uncertainty,
                "registeredCoverageStatus": "supported" if inside else "outside_registered_target_plane",
            })

    result = {
        "ok": True,
        "schemaVersion": "sczn3-target-image-registration-evidence-v1",
        "knowledgeState": knowledge_state,
        "targetProfileId": package["targetProfileId"],
        "targetProfileVersion": package["targetProfileVersion"],
        "registrationPackageId": package["registrationPackageId"],
        "registrationPackageVersion": package["registrationPackageVersion"],
        "sourceImage": {"sha256": evidence["sha256"], "widthPx": evidence["width"], "heightPx": evidence["height"], "mediaType": evidence["mediaType"]},
        "canonicalRepresentation": dict(representation),
        "canonicalCoordinateSystemId": package["canonicalCoordinateSystemId"],
        "ugoAuthorityId": package["ugoAuthorityId"],
        "registrationMethod": method,
        "sourceToCanonicalMatrix": [[round(float(value), 12) for value in row] for row in matrix.tolist()],
        "metrics": metrics,
        "globalUncertaintyPx": round(base_uncertainty + float(metrics["reprojectionP95Px"] or 0), 4),
        "canonicalObservations": canonical_observations,
        "claimSufficiencyOwner": "downstream_mission_authority",
        "claimSufficiency": "not_evaluated",
        "recovery": None,
    }
    result["registrationEvidenceHash"] = _stable_hash(result)
    result["registrationEvidenceId"] = f"TIR-{result['registrationEvidenceHash'][:24].upper()}"
    return result


def register_target_image(payload: Any) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise TargetImageRegistrationError("payload_must_be_an_object", "invalid_request", http_status=400)
    package = registration_package(str(payload.get("registrationPackageId") or ""))
    if str(payload.get("registrationPackageVersion") or "") != str(package["registrationPackageVersion"]):
        raise TargetImageRegistrationError("registration_package_version_mismatch", http_status=409)
    if str(payload.get("targetProfileId") or "") != str(package["targetProfileId"]):
        raise TargetImageRegistrationError("target_profile_identity_mismatch", http_status=409)
    if str(payload.get("targetProfileVersion") or "") != str(package["targetProfileVersion"]):
        raise TargetImageRegistrationError("target_profile_version_mismatch", http_status=409)
    evidence = decode_image_evidence(payload.get("imageEvidence") or {})
    return register_decoded_image(package["registrationPackageId"], evidence, payload.get("observations"))
