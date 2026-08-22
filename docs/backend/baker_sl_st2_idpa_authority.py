"""Episode 55 backend authority for Baker SL-ST2 Timed Pair — 7 Yards.

The browser supplies evidence observations and reported session facts. UGO maps
the photograph into the governed 23 x 35 target plane; this module alone
classifies selected centers, selects the best two, and calculates final time.
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import json
import math
import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Mapping, Sequence, Tuple

import cv2
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_ROOT = ROOT / "authority-evidence" / "baker-sl-st2"
PRODUCT_PATH = EVIDENCE_ROOT / "BAKER_SL_ST2_23X35_PRODUCT_AUTHORITY_V1.json"
UGO_PATH = EVIDENCE_ROOT / "UGO_BAKER_SL_ST2_23X35_TARGET_PLANE_V1.json"
MISSION_PATH = EVIDENCE_ROOT / "SCZN3_SL_ST2_TIMED_PAIR_7YD_V1.json"
RULES_PATH = EVIDENCE_ROOT / "IDPA_RULEBOOK_2026_2_AUTHORITY_V1.json"
REPRESENTATION_PATH = EVIDENCE_ROOT / "BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.jpeg"
RULEBOOK_PATH = EVIDENCE_ROOT / "IDPA_RULEBOOK_2026_2.pdf"
DATA_URL_PATTERN = re.compile(r"^data:(image/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$")
SHA256_PATTERN = re.compile(r"^[a-f0-9]{64}$")
MAX_IMAGE_BYTES = 25 * 1024 * 1024


class BakerSLST2AuthorityError(ValueError):
    def __init__(self, reason: str, status: str = "authority_rejected", details: Mapping[str, Any] | None = None):
        super().__init__(reason)
        self.reason = reason
        self.payload = {"ok": False, "status": status, "reason": reason}
        if details:
            self.payload["details"] = dict(details)


def _read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float, Decimal)) and not isinstance(value, bool) and math.isfinite(float(value))


def _normal(value: Any, reason: str) -> float:
    if not _is_number(value):
        raise BakerSLST2AuthorityError(reason)
    parsed = float(value)
    if parsed < 0 or parsed > 1:
        raise BakerSLST2AuthorityError(reason)
    return parsed


def _reported_time(value: Any) -> Tuple[str, Decimal]:
    if isinstance(value, bool) or value is None:
        raise BakerSLST2AuthorityError("reported_raw_time_invalid")
    text = str(value).strip()
    if not re.fullmatch(r"\d+(?:\.\d{1,2})?", text):
        reason = "reported_raw_time_precision_unsupported" if re.fullmatch(r"\d+\.\d{3,}", text) else "reported_raw_time_invalid"
        raise BakerSLST2AuthorityError(reason)
    try:
        parsed = Decimal(text)
    except InvalidOperation as exc:
        raise BakerSLST2AuthorityError("reported_raw_time_invalid") from exc
    if parsed < 0 or parsed > Decimal("9999.99"):
        raise BakerSLST2AuthorityError("reported_raw_time_invalid")
    quantized = parsed.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return text, quantized


def _decode_image(image: Mapping[str, Any]) -> Dict[str, Any]:
    claimed = str(image.get("sha256") or "").lower()
    if not SHA256_PATTERN.fullmatch(claimed):
        raise BakerSLST2AuthorityError("image_sha256_required")
    match = DATA_URL_PATTERN.fullmatch(str(image.get("dataUrl") or ""))
    if not match:
        raise BakerSLST2AuthorityError("image_data_url_invalid")
    try:
        image_bytes = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError) as exc:
        raise BakerSLST2AuthorityError("image_data_base64_invalid") from exc
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise BakerSLST2AuthorityError("image_data_size_invalid")
    backend_hash = hashlib.sha256(image_bytes).hexdigest()
    if backend_hash != claimed:
        raise BakerSLST2AuthorityError("image_sha256_mismatch")
    decoded = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if decoded is None:
        raise BakerSLST2AuthorityError("image_evidence_unreadable")
    height, width = decoded.shape[:2]
    try:
        supplied_width = int(image.get("widthPx"))
        supplied_height = int(image.get("heightPx"))
    except (TypeError, ValueError) as exc:
        raise BakerSLST2AuthorityError("image_dimensions_required") from exc
    if (width, height) != (supplied_width, supplied_height):
        raise BakerSLST2AuthorityError("image_dimensions_mismatch")
    return {
        "bytes": image_bytes,
        "decoded": decoded,
        "sha256": backend_hash,
        "mediaType": match.group(1),
        "width": width,
        "height": height,
        "byteLength": len(image_bytes),
    }


def _polygon_distance(point: Sequence[float], polygon: Sequence[Sequence[float]]) -> float:
    px, py = float(point[0]), float(point[1])
    minimum = float("inf")
    for start, end in zip(polygon, list(polygon[1:]) + [polygon[0]]):
        ax, ay = float(start[0]), float(start[1])
        bx, by = float(end[0]), float(end[1])
        dx, dy = bx - ax, by - ay
        denominator = dx * dx + dy * dy
        factor = 0.0 if denominator == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / denominator))
        minimum = min(minimum, math.hypot(px - (ax + factor * dx), py - (ay + factor * dy)))
    return minimum


def _inside_polygon(point: Sequence[float], polygon: Sequence[Sequence[float]]) -> bool:
    px, py = float(point[0]), float(point[1])
    inside = False
    for start, end in zip(polygon, list(polygon[1:]) + [polygon[0]]):
        ax, ay = float(start[0]), float(start[1])
        bx, by = float(end[0]), float(end[1])
        if (ay > py) != (by > py) and px < ((bx - ax) * (py - ay) / (by - ay)) + ax:
            inside = not inside
    return inside


def _circle_distance(point: Sequence[float], circle: Mapping[str, Any]) -> float:
    center = circle["center"]
    return abs(math.hypot(float(point[0]) - center[0], float(point[1]) - center[1]) - float(circle["radius"]))


def _inside_circle(point: Sequence[float], circle: Mapping[str, Any]) -> bool:
    center = circle["center"]
    return math.hypot(float(point[0]) - center[0], float(point[1]) - center[1]) < float(circle["radius"])


def _classify(point_px: Sequence[float], uncertainty_px: float, geometry: Mapping[str, Any]) -> Tuple[str, float]:
    regions = geometry["regionsPx"]
    distances = [
        _polygon_distance(point_px, regions["headExterior"]),
        _polygon_distance(point_px, regions["bodyExterior"]),
        _polygon_distance(point_px, regions["torsoDownOne"]),
        _circle_distance(point_px, regions["headZero"]),
        _circle_distance(point_px, regions["torsoZero"]),
    ]
    clearance = min(distances)
    if clearance <= uncertainty_px:
        return "indeterminate_boundary", clearance
    if _inside_circle(point_px, regions["headZero"]) or _inside_circle(point_px, regions["torsoZero"]):
        return "down_zero", clearance
    if _inside_polygon(point_px, regions["headExterior"]) or _inside_polygon(point_px, regions["torsoDownOne"]):
        return "down_one", clearance
    if _inside_polygon(point_px, regions["bodyExterior"]):
        return "down_three", clearance
    return "outside", clearance


@lru_cache(maxsize=1)
def _context() -> Dict[str, Any]:
    product = _read_json(PRODUCT_PATH)
    ugo = _read_json(UGO_PATH)
    mission = _read_json(MISSION_PATH)
    rules = _read_json(RULES_PATH)
    source_hash = _sha256(REPRESENTATION_PATH)
    rules_hash = _sha256(RULEBOOK_PATH)
    if source_hash != product["representationEvidence"]["sha256"] or source_hash != ugo["sourceEvidence"]["sha256"]:
        raise BakerSLST2AuthorityError("target_representation_authority_mismatch", "configuration_error")
    if rules_hash != rules["sha256"]:
        raise BakerSLST2AuthorityError("rules_source_authority_mismatch", "configuration_error")
    if mission["productAuthorityId"] != product["authorityId"] or mission["ugoAuthorityId"] != ugo["ugoAuthorityId"]:
        raise BakerSLST2AuthorityError("mission_target_authority_mismatch", "configuration_error")
    if mission["rulesAuthorityId"] != rules["authorityId"]:
        raise BakerSLST2AuthorityError("mission_rules_authority_mismatch", "configuration_error")
    canonical_bytes = REPRESENTATION_PATH.read_bytes()
    canonical = cv2.imdecode(np.frombuffer(canonical_bytes, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
    if canonical is None:
        raise BakerSLST2AuthorityError("target_representation_unreadable", "configuration_error")
    sift = cv2.SIFT_create(nfeatures=12000, contrastThreshold=0.015, edgeThreshold=16)
    keypoints, descriptors = sift.detectAndCompute(canonical, None)
    return {
        "product": product,
        "ugo": ugo,
        "mission": mission,
        "rules": rules,
        "hashes": {
            "productAuthoritySha256": _sha256(PRODUCT_PATH),
            "ugoAuthoritySha256": _sha256(UGO_PATH),
            "missionAuthoritySha256": _sha256(MISSION_PATH),
            "rulesAuthoritySha256": _sha256(RULES_PATH),
            "rulesSourceSha256": rules_hash,
            "representationSha256": source_hash,
        },
        "canonical": canonical,
        "sift": sift,
        "keypoints": keypoints,
        "descriptors": descriptors,
    }


def _register(context: Mapping[str, Any], evidence: Mapping[str, Any], impacts: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    ugo = context["ugo"]
    source = ugo["sourceEvidence"]
    boundary_uncertainty = float(ugo["geometryObservation"]["boundaryUncertaintyPx"])
    if evidence["sha256"] == source["sha256"]:
        if evidence["width"] != source["pixelWidth"] or evidence["height"] != source["pixelHeight"]:
            raise BakerSLST2AuthorityError("target_representation_dimensions_mismatch")
        return {
            "canonicalPoints": [
                [float(item["xNorm"]) * (source["pixelWidth"] - 1), float(item["yNorm"]) * (source["pixelHeight"] - 1)]
                for item in impacts
            ],
            "uncertaintyPx": boundary_uncertainty,
            "registration": {
                "status": "complete",
                "method": "exact_publisher_representation",
                "ugoAuthorityId": ugo["ugoAuthorityId"],
                "sourceImageSha256": evidence["sha256"],
                "reprojectionRmsPx": 0,
                "reprojectionP95Px": 0,
                "targetCoverage": 1,
            },
        }

    gray = cv2.cvtColor(evidence["decoded"], cv2.COLOR_BGR2GRAY)
    keypoints, descriptors = context["sift"].detectAndCompute(gray, None)
    if descriptors is None:
        raise BakerSLST2AuthorityError("target_identity_unverified")
    matcher = cv2.BFMatcher(cv2.NORM_L2)
    forward = matcher.knnMatch(context["descriptors"], descriptors, k=2)
    reverse = matcher.knnMatch(descriptors, context["descriptors"], k=2)
    forward_good = {m.queryIdx: m for m, n in forward if m.distance < 0.72 * n.distance}
    reverse_good = {m.queryIdx: m for m, n in reverse if m.distance < 0.72 * n.distance}
    matches = [m for query, m in forward_good.items() if m.trainIdx in reverse_good and reverse_good[m.trainIdx].trainIdx == query]
    gate = ugo["runtimeGate"]
    if len(matches) < gate["minimumMutualMatches"]:
        raise BakerSLST2AuthorityError("target_identity_unverified", details={"mutualMatches": len(matches)})
    source_points = np.float32([keypoints[m.trainIdx].pt for m in matches])
    destination_points = np.float32([context["keypoints"][m.queryIdx].pt for m in matches])
    cv2.setRNGSeed(0)
    homography, mask = cv2.findHomography(source_points, destination_points, cv2.RANSAC, 5.0, maxIters=10000, confidence=0.999)
    if homography is None or mask is None:
        raise BakerSLST2AuthorityError("ugo_registration_unavailable")
    inliers = mask.ravel().astype(bool)
    inlier_count = int(inliers.sum())
    inlier_ratio = float(inliers.mean())
    if inlier_count < gate["minimumInliers"] or inlier_ratio < gate["minimumInlierRatio"]:
        raise BakerSLST2AuthorityError("insufficient_landmark_coverage", details={"inliers": inlier_count, "inlierRatio": round(inlier_ratio, 4)})
    projected = cv2.perspectiveTransform(source_points[inliers].reshape(-1, 1, 2), homography)[:, 0, :]
    residuals = np.linalg.norm(projected - destination_points[inliers], axis=1)
    rms = float(np.sqrt(np.mean(residuals ** 2)))
    p95 = float(np.percentile(residuals, 95))
    if rms > gate["maximumReprojectionRmsPx"] or p95 > gate["maximumReprojectionP95Px"]:
        raise BakerSLST2AuthorityError("registration_uncertainty_exceeded", details={"rmsPx": round(rms, 4), "p95Px": round(p95, 4)})
    photo_corners = np.float32([[[0, 0], [evidence["width"] - 1, 0], [evidence["width"] - 1, evidence["height"] - 1], [0, evidence["height"] - 1]]])
    mapped_corners = cv2.perspectiveTransform(photo_corners, homography)[0]
    canonical_area = float(context["canonical"].shape[0] * context["canonical"].shape[1])
    coverage = min(1.0, abs(float(cv2.contourArea(mapped_corners))) / canonical_area)
    if coverage < gate["minimumTargetCoverage"]:
        raise BakerSLST2AuthorityError("insufficient_landmark_coverage", details={"targetCoverage": round(coverage, 4)})
    input_points = np.float32([[
        [float(item["xNorm"]) * (evidence["width"] - 1), float(item["yNorm"]) * (evidence["height"] - 1)]
        for item in impacts
    ]])
    canonical_points = cv2.perspectiveTransform(input_points, homography)[0].tolist()
    uncertainty = min(float(gate["maximumBoundaryUncertaintyPx"]), boundary_uncertainty + p95)
    return {
        "canonicalPoints": canonical_points,
        "uncertaintyPx": uncertainty,
        "registration": {
            "status": "complete",
            "method": "ugo_sift_homography_v1",
            "ugoAuthorityId": ugo["ugoAuthorityId"],
            "sourceImageSha256": evidence["sha256"],
            "mutualMatches": len(matches),
            "inliers": inlier_count,
            "inlierRatio": round(inlier_ratio, 4),
            "reprojectionRmsPx": round(rms, 4),
            "reprojectionP95Px": round(p95, 4),
            "targetCoverage": round(coverage, 4),
            "localUncertaintyPx": round(uncertainty, 4),
        },
    }


def _pixel_to_inches(point: Sequence[float], ugo: Mapping[str, Any]) -> Dict[str, float]:
    source = ugo["representationToTargetPlane"]["sheetCornersPx"]
    left, top = float(source[0]["x"]), float(source[0]["y"])
    right, bottom = float(source[2]["x"]), float(source[2]["y"])
    extent = ugo["coordinateSystem"]["extent"]
    return {
        "x": round((float(point[0]) - left) * float(extent["width"]) / (right - left), 6),
        "y": round((float(point[1]) - top) * float(extent["height"]) / (bottom - top), 6),
    }


def analyze_baker_sl_st2_evidence(payload: Any) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise BakerSLST2AuthorityError("payload_must_be_an_object", "invalid_request")
    context = _context()
    mission = context["mission"]
    product = context["product"]
    if str(payload.get("targetProfileId") or "") != mission["targetProfileId"]:
        raise BakerSLST2AuthorityError("target_profile_identity_mismatch")
    if str(payload.get("targetProfileVersion") or "") != mission["targetProfileVersion"]:
        raise BakerSLST2AuthorityError("target_profile_version_mismatch")
    if str(payload.get("targetId") or "") != product["productIdentity"]["productId"]:
        raise BakerSLST2AuthorityError("target_identity_mismatch")
    if str(payload.get("variantId") or "") != product["productIdentity"]["variantId"]:
        raise BakerSLST2AuthorityError("target_variant_mismatch")
    if str(payload.get("missionAuthorityId") or "") != mission["missionAuthorityId"]:
        raise BakerSLST2AuthorityError("mission_authority_mismatch")
    if str(payload.get("rulesAuthorityId") or "") != mission["rulesAuthorityId"]:
        raise BakerSLST2AuthorityError("rules_authority_mismatch")
    if payload.get("rawTimeSource") != "manual_shot_timer_entry":
        raise BakerSLST2AuthorityError("raw_time_source_unsupported")
    submitted_time, raw_time = _reported_time(payload.get("reportedRawTime"))
    if payload.get("evidenceCompletenessAffirmed") is not True:
        raise BakerSLST2AuthorityError("evidence_completeness_required")

    image = payload.get("imageEvidence")
    if not isinstance(image, Mapping):
        raise BakerSLST2AuthorityError("image_evidence_required")
    evidence = _decode_image(image)
    submitted_impacts = payload.get("impacts")
    if not isinstance(submitted_impacts, list) or len(submitted_impacts) < 2:
        raise BakerSLST2AuthorityError("at_least_two_determinate_impacts_required")
    if len(submitted_impacts) > 250:
        raise BakerSLST2AuthorityError("impact_limit_exceeded")
    impacts = []
    for index, item in enumerate(submitted_impacts, start=1):
        if not isinstance(item, Mapping):
            raise BakerSLST2AuthorityError("impact_must_be_an_object")
        impacts.append({
            "impactId": f"impact-{index:03d}",
            "xNorm": _normal(item.get("xNorm"), "impact_x_out_of_bounds"),
            "yNorm": _normal(item.get("yNorm"), "impact_y_out_of_bounds"),
        })

    registration = _register(context, evidence, impacts)
    points_values = mission["pointsDownValues"]
    classified = []
    for impact, point in zip(impacts, registration["canonicalPoints"]):
        classification, clearance = _classify(point, registration["uncertaintyPx"], context["ugo"]["geometryObservation"])
        record = {
            "impactId": impact["impactId"],
            "sourceEvidencePoint": {"xNorm": round(impact["xNorm"], 8), "yNorm": round(impact["yNorm"], 8)},
            "canonicalPointPx": {"x": round(float(point[0]), 4), "y": round(float(point[1]), 4)},
            "canonicalPointInches": _pixel_to_inches(point, context["ugo"]),
            "classification": classification,
            "boundaryClearancePx": round(clearance, 4),
            "registrationUncertaintyPx": round(registration["uncertaintyPx"], 4),
        }
        if classification == "indeterminate_boundary":
            raise BakerSLST2AuthorityError("indeterminate_boundary", details={"impactId": impact["impactId"], "classification": classification})
        record["pointsDown"] = int(points_values[classification])
        classified.append(record)

    required = int(mission["courseOfFire"]["requiredScoredHits"])
    if len(classified) < required:
        raise BakerSLST2AuthorityError("at_least_two_determinate_impacts_required")
    ranked = sorted(enumerate(classified), key=lambda pair: (pair[1]["pointsDown"], pair[0]))
    selected = [record for _, record in ranked[:required]]
    excluded = [record for _, record in ranked[required:]]
    total_points_down = sum(record["pointsDown"] for record in selected)
    points_down_time = Decimal(total_points_down).quantize(Decimal("0.01"))
    final_time = raw_time + points_down_time
    counts = {"down_zero": 0, "down_one": 0, "down_three": 0, "outside": 0}
    for record in selected:
        counts[record["classification"]] += 1
    breakdown = [
        {
            "classification": classification,
            "label": label,
            "count": counts[classification],
            "pointsDownValue": int(points_values[classification]),
            "pointsDownSubtotal": str(counts[classification] * int(points_values[classification])),
            "timeSubtotal": f"{Decimal(counts[classification] * int(points_values[classification])).quantize(Decimal('0.01'))}",
        }
        for classification, label in (
            ("down_zero", "0 down"),
            ("down_one", "-1"),
            ("down_three", "-3"),
            ("outside", "Outside"),
        )
    ]
    hashes = context["hashes"]
    result = {
        "ok": True,
        "status": "supported_analysis_ready",
        "authoritySource": "backend-authoritative",
        "missionFamily": "idpaTimedPractice",
        "resultPackageType": "idpaTimeScoreResult",
        "targetProfileId": mission["targetProfileId"],
        "targetProfileVersion": mission["targetProfileVersion"],
        "target": {
            "targetProfileId": mission["targetProfileId"],
            "targetProfileVersion": mission["targetProfileVersion"],
            "smartTargetId": product["productIdentity"]["productId"],
            "variantId": product["productIdentity"]["variantId"],
        },
        "identity": {
            "targetProfileLabel": "Silhouette Target (IDPA)",
            "missionLabel": mission["missionLabel"],
            "publisherIdentity": product["publisherIdentity"],
            "productIdentity": product["productIdentity"],
        },
        "imageEvidence": {
            "sha256": evidence["sha256"],
            "mediaType": evidence["mediaType"],
            "widthPx": evidence["width"],
            "heightPx": evidence["height"],
            "byteLength": evidence["byteLength"],
            "backendHashVerified": True,
            "targetIdentityVerifiedFromImage": True,
            "acceptanceScope": registration["registration"]["method"],
        },
        "sessionEvidence": {
            "reportedRawTimeSubmitted": submitted_time,
            "reportedRawTime": f"{raw_time:.2f}",
            "rawTimeSource": "manual_shot_timer_entry",
            "evidenceCompletenessAffirmed": True,
        },
        "impacts": classified,
        "scoredSelection": {
            "mode": "unlimited_best_hits",
            "requiredImpactCount": required,
            "selectedImpactIds": [item["impactId"] for item in selected],
            "excludedImpactIds": [item["impactId"] for item in excluded],
            "selectedClassifications": counts,
        },
        "scoring": {
            "status": "complete",
            "objective": "lowest_time_wins",
            "reportedRawTime": f"{raw_time:.2f}",
            "pointsDown": total_points_down,
            "pointsDownTime": f"{points_down_time:.2f}",
            "finalTime": f"{final_time:.2f}",
            "breakdown": breakdown,
        },
        "reconciliation": {
            "capturedImpactCount": len(classified),
            "selectedImpactCount": len(selected),
            "excludedImpactCount": len(excluded),
            "requiredImpactCount": required,
            "selectionReconciles": len(selected) == required and len(selected) + len(excluded) == len(classified),
            "timeReconciles": final_time == raw_time + points_down_time,
        },
        "registration": registration["registration"],
        "authorityTrace": {
            "classificationAuthority": "backend",
            "calculationAuthority": "backend",
            "productAuthorityId": product["authorityId"],
            "ugoAuthorityId": context["ugo"]["ugoAuthorityId"],
            "missionAuthorityId": mission["missionAuthorityId"],
            "rulesAuthorityId": context["rules"]["authorityId"],
            **hashes,
        },
        "claimBoundary": {
            "resultLabel": "Timed Practice Result",
            "notOfficial": True,
            "notMatchScore": True,
            "selectedCenterClassificationOnly": True,
        },
        "continuation": {"status": "available", "nextAction": "continue_to_sec"},
    }
    evidence_identity_payload = {
        "imageSha256": evidence["sha256"],
        "reportedRawTime": f"{raw_time:.2f}",
        "evidenceCompletenessAffirmed": True,
        "impacts": [record["sourceEvidencePoint"] for record in classified],
        "missionAuthorityId": mission["missionAuthorityId"],
        "targetProfileId": mission["targetProfileId"],
        "targetProfileVersion": mission["targetProfileVersion"],
    }
    evidence_hash = hashlib.sha256(
        json.dumps(evidence_identity_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    result_identity_payload = {
        "evidenceHash": evidence_hash,
        "scoredSelection": result["scoredSelection"],
        "scoring": result["scoring"],
        "authorityTrace": result["authorityTrace"],
    }
    result_hash = hashlib.sha256(
        json.dumps(result_identity_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    result["evidenceHash"] = evidence_hash
    result["evidenceIdentity"] = f"SLST2-EVIDENCE-{evidence_hash[:16].upper()}"
    result["resultHash"] = result_hash
    result["resultIdentity"] = f"SLST2-RESULT-{result_hash[:16].upper()}"
    return result
