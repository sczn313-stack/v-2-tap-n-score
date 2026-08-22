"""Backend authority for inherited catalog game targets.

The browser reports image evidence and shooter observations. UGO registers the
image to Baker's publisher representation. This module alone classifies selected
centers and applies Baker's published target-game rules.
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import json
import math
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Mapping, Sequence

import cv2
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
BAKER_EVIDENCE_ROOT = ROOT / "authority-evidence" / "baker-fun"
CATALOG_EVIDENCE_ROOT = ROOT / "authority-evidence" / "catalog-targets"
DATA_URL_PATTERN = re.compile(r"^data:(image/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$")
SHA256_PATTERN = re.compile(r"^[a-f0-9]{64}$")
MAX_IMAGE_BYTES = 25 * 1024 * 1024

PROFILES = {
    "baker_gf_db": {
        "product": "BAKER_GF_DB_PRODUCT_AUTHORITY_V1.json",
        "ugo": "UGO_BAKER_GF_DB_V1.json",
        "image": "BAKER_GF_DB_PUBLISHER_PRODUCT_IMAGE_V1.jpg",
        "targetId": "BAKER_GF_DB",
        "resultPackageType": "bakerDartboardGameResult",
        "root": BAKER_EVIDENCE_ROOT,
    },
    "baker_gf_bp": {
        "product": "BAKER_GF_BP_PRODUCT_AUTHORITY_V1.json",
        "ugo": "UGO_BAKER_GF_BP_V1.json",
        "image": "BAKER_GF_BP_PUBLISHER_PRODUCT_IMAGE_V1.jpg",
        "targetId": "BAKER_GF_BP",
        "resultPackageType": "bakerBowlingPinsResult",
        "root": BAKER_EVIDENCE_ROOT,
    },
    "ez2c_dot_torture_17": {
        "product": "EZ2C_STYLE_17_DOT_TORTURE_PRODUCT_AUTHORITY_V1.json",
        "ugo": "UGO_EZ2C_STYLE_17_DOT_TORTURE_V1.json",
        "image": "EZ2C_STYLE_17_DOT_TORTURE_PUBLISHER_IMAGE_V1.jpg",
        "targetId": "EZ2C_STYLE_17",
        "resultPackageType": "dotTortureCourseResult",
        "root": CATALOG_EVIDENCE_ROOT,
    },
    "baker_gf_bb_c": {
        "product": "BAKER_GF_BB_C_PRODUCT_AUTHORITY_V1.json",
        "ugo": "UGO_BAKER_GF_BB_C_V1.json",
        "image": "BAKER_GF_BB_C_PUBLISHER_IMAGE_V1.jpg",
        "targetId": "BAKER_GF_BB_C",
        "resultPackageType": "bakerBilliardSequenceResult",
        "root": CATALOG_EVIDENCE_ROOT,
    },
    "baker_gf_battleship": {
        "product": "BAKER_GF_BATTLESHIP_PRODUCT_AUTHORITY_V1.json",
        "ugo": "UGO_BAKER_GF_BATTLESHIP_V1.json",
        "image": "BAKER_GF_BATTLESHIP_PUBLISHER_IMAGE_V1.jpg",
        "targetId": "BAKER_GF_BATTLESHIP",
        "resultPackageType": "bakerBattleshipGameResult",
        "root": CATALOG_EVIDENCE_ROOT,
    },
}


class BakerFunAuthorityError(ValueError):
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


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _normal(value: Any, reason: str) -> float:
    if isinstance(value, bool):
        raise BakerFunAuthorityError(reason)
    try:
        parsed = float(value)
    except (TypeError, ValueError) as exc:
        raise BakerFunAuthorityError(reason) from exc
    if not math.isfinite(parsed) or parsed < 0 or parsed > 1:
        raise BakerFunAuthorityError(reason)
    return parsed


def _decode_image(image: Mapping[str, Any]) -> Dict[str, Any]:
    claimed = _clean(image.get("sha256")).lower()
    if not SHA256_PATTERN.fullmatch(claimed):
        raise BakerFunAuthorityError("image_sha256_required")
    match = DATA_URL_PATTERN.fullmatch(_clean(image.get("dataUrl")))
    if not match:
        raise BakerFunAuthorityError("image_data_url_invalid")
    try:
        image_bytes = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError) as exc:
        raise BakerFunAuthorityError("image_data_base64_invalid") from exc
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise BakerFunAuthorityError("image_data_size_invalid")
    backend_hash = hashlib.sha256(image_bytes).hexdigest()
    if backend_hash != claimed:
        raise BakerFunAuthorityError("image_sha256_mismatch")
    decoded = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if decoded is None:
        raise BakerFunAuthorityError("image_evidence_unreadable")
    height, width = decoded.shape[:2]
    try:
        supplied = (int(image.get("widthPx")), int(image.get("heightPx")))
    except (TypeError, ValueError) as exc:
        raise BakerFunAuthorityError("image_dimensions_required") from exc
    if supplied != (width, height):
        raise BakerFunAuthorityError("image_dimensions_mismatch")
    return {"bytes": image_bytes, "decoded": decoded, "sha256": backend_hash, "mediaType": match.group(1), "width": width, "height": height, "byteLength": len(image_bytes)}


@lru_cache(maxsize=8)
def _context(profile_id: str) -> Dict[str, Any]:
    definition = PROFILES.get(profile_id)
    if not definition:
        raise BakerFunAuthorityError("target_profile_identity_mismatch")
    evidence_root = definition["root"]
    product_path = evidence_root / definition["product"]
    ugo_path = evidence_root / definition["ugo"]
    image_path = evidence_root / definition["image"]
    product, ugo = _read_json(product_path), _read_json(ugo_path)
    source_hash = _sha256(image_path)
    if source_hash != product["publisherRepresentation"]["sha256"] or source_hash != ugo["sourceEvidence"]["sha256"]:
        raise BakerFunAuthorityError("publisher_representation_authority_mismatch", "configuration_error")
    if product["authorityId"] != ugo["productAuthorityId"]:
        raise BakerFunAuthorityError("product_ugo_authority_mismatch", "configuration_error")
    if product.get("rulesAuthority", {}).get("path"):
        rules_path = evidence_root / product["rulesAuthority"]["path"]
        if _sha256(rules_path) != product["rulesAuthority"]["sha256"]:
            raise BakerFunAuthorityError("publisher_rules_authority_mismatch", "configuration_error")
    canonical = cv2.imdecode(np.frombuffer(image_path.read_bytes(), dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
    if canonical is None:
        raise BakerFunAuthorityError("publisher_representation_unreadable", "configuration_error")
    sift = cv2.SIFT_create(nfeatures=12000, contrastThreshold=0.015, edgeThreshold=16)
    keypoints, descriptors = sift.detectAndCompute(canonical, None)
    return {
        "definition": definition,
        "product": product,
        "ugo": ugo,
        "canonical": canonical,
        "sift": sift,
        "keypoints": keypoints,
        "descriptors": descriptors,
        "hashes": {
            "productAuthoritySha256": _sha256(product_path),
            "ugoAuthoritySha256": _sha256(ugo_path),
            "publisherRepresentationSha256": source_hash,
        },
    }


def _register(context: Mapping[str, Any], evidence: Mapping[str, Any], events: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    ugo = context["ugo"]
    source = ugo["sourceEvidence"]
    coordinate_events = [event for event in events if event.get("type") in {"shot", "replacement"}]
    points = [[_normal(event.get("xNorm"), "shot_coordinate_invalid") * (evidence["width"] - 1), _normal(event.get("yNorm"), "shot_coordinate_invalid") * (evidence["height"] - 1)] for event in coordinate_events]
    base_uncertainty = float(ugo["geometryObservation"]["boundaryUncertaintyPx"])
    if evidence["sha256"] == source["sha256"]:
        if (evidence["width"], evidence["height"]) != (source["pixelWidth"], source["pixelHeight"]):
            raise BakerFunAuthorityError("publisher_representation_dimensions_mismatch")
        canonical = points
        registration = {"status": "complete", "method": "exact_publisher_representation", "ugoAuthorityId": ugo["ugoAuthorityId"], "reprojectionRmsPx": 0, "reprojectionP95Px": 0}
        uncertainty = base_uncertainty
    else:
        gray = cv2.cvtColor(evidence["decoded"], cv2.COLOR_BGR2GRAY)
        keypoints, descriptors = context["sift"].detectAndCompute(gray, None)
        if descriptors is None:
            raise BakerFunAuthorityError("target_identity_unverified")
        matcher = cv2.BFMatcher(cv2.NORM_L2)
        forward = matcher.knnMatch(context["descriptors"], descriptors, k=2)
        reverse = matcher.knnMatch(descriptors, context["descriptors"], k=2)
        forward_good = {m.queryIdx: m for m, n in forward if m.distance < 0.72 * n.distance}
        reverse_good = {m.queryIdx: m for m, n in reverse if m.distance < 0.72 * n.distance}
        matches = [m for query, m in forward_good.items() if m.trainIdx in reverse_good and reverse_good[m.trainIdx].trainIdx == query]
        gate = ugo["runtimeGate"]
        if len(matches) < gate["minimumMutualMatches"]:
            raise BakerFunAuthorityError("target_identity_unverified", details={"mutualMatches": len(matches)})
        source_points = np.float32([keypoints[m.trainIdx].pt for m in matches])
        destination_points = np.float32([context["keypoints"][m.queryIdx].pt for m in matches])
        cv2.setRNGSeed(0)
        homography, mask = cv2.findHomography(source_points, destination_points, cv2.RANSAC, 5.0, maxIters=10000, confidence=0.999)
        if homography is None or mask is None:
            raise BakerFunAuthorityError("ugo_registration_unavailable")
        inliers = mask.ravel().astype(bool)
        count, ratio = int(inliers.sum()), float(inliers.mean())
        if count < gate["minimumInliers"] or ratio < gate["minimumInlierRatio"]:
            raise BakerFunAuthorityError("insufficient_landmark_coverage", details={"inliers": count, "inlierRatio": round(ratio, 4)})
        projected = cv2.perspectiveTransform(source_points[inliers].reshape(-1, 1, 2), homography)[:, 0, :]
        residuals = np.linalg.norm(projected - destination_points[inliers], axis=1)
        rms, p95 = float(np.sqrt(np.mean(residuals ** 2))), float(np.percentile(residuals, 95))
        if rms > gate["maximumReprojectionRmsPx"] or p95 > gate["maximumReprojectionP95Px"]:
            raise BakerFunAuthorityError("registration_uncertainty_exceeded", details={"rmsPx": round(rms, 4), "p95Px": round(p95, 4)})
        source_array = np.float32([points]).reshape(1, -1, 2) if points else np.empty((1, 0, 2), dtype=np.float32)
        canonical = cv2.perspectiveTransform(source_array, homography)[0].tolist() if points else []
        uncertainty = min(float(gate["maximumBoundaryUncertaintyPx"]), base_uncertainty + p95)
        registration = {"status": "complete", "method": "ugo_sift_homography_v1", "ugoAuthorityId": ugo["ugoAuthorityId"], "mutualMatches": len(matches), "inliers": count, "inlierRatio": round(ratio, 4), "reprojectionRmsPx": round(rms, 4), "reprojectionP95Px": round(p95, 4), "localUncertaintyPx": round(uncertainty, 4)}
    point_iterator = iter(canonical)
    resolved = []
    for event in events:
        resolved.append(next(point_iterator) if event.get("type") in {"shot", "replacement"} else None)
    return {"canonicalPoints": resolved, "uncertaintyPx": uncertainty, "registration": registration}


def _variant(product: Mapping[str, Any], variant_id: str) -> Mapping[str, Any]:
    variant = next((item for item in product["variants"] if item["variantId"] == variant_id), None)
    if not variant:
        raise BakerFunAuthorityError("target_variant_mismatch")
    return variant


def _inches(point: Sequence[float], variant: Mapping[str, Any], source: Mapping[str, Any]) -> Dict[str, float]:
    return {"x": round(float(point[0]) * float(variant["widthInches"]) / (source["pixelWidth"] - 1), 6), "y": round(float(point[1]) * float(variant["heightInches"]) / (source["pixelHeight"] - 1), 6)}


def _dart_classification(point: Sequence[float], uncertainty: float, geometry: Mapping[str, Any]) -> Dict[str, Any]:
    cx, cy = geometry["boardCenterPx"]
    dx, dy = float(point[0]) - cx, float(point[1]) - cy
    radius = math.hypot(dx, dy)
    rings = geometry["ringsPx"]
    radial_boundaries = [rings[key] for key in ("innerBullMax", "outerBullMax", "innerRingMin", "innerRingMax", "outerRingMin", "outerRingMax")]
    clearance = min(abs(radius - float(boundary)) for boundary in radial_boundaries)
    if radius > rings["outerRingMax"]:
        band, sector = "outside", None
    elif radius <= rings["innerBullMax"]:
        band, sector = "inner_bull", None
    elif radius <= rings["outerBullMax"]:
        band, sector = "outer_bull", None
    else:
        degrees = (math.degrees(math.atan2(dy, dx)) + 90) % 360
        sector_index = int(math.floor((degrees + 9) / 18)) % 20
        sector = int(geometry["sectorOrderClockwiseFromTop"][sector_index])
        distance_degrees = abs(((degrees + 9) % 18) - 9)
        sector_clearance = radius * math.radians(9 - distance_degrees)
        clearance = min(clearance, sector_clearance)
        if rings["innerRingMin"] <= radius <= rings["innerRingMax"]:
            band = "triple"
        elif rings["outerRingMin"] <= radius <= rings["outerRingMax"]:
            band = "double"
        else:
            band = "single"
    status = "indeterminate_boundary" if clearance <= uncertainty else "classified"
    return {"status": status, "band": band, "sectorNumber": sector, "canonicalRadiusPx": round(radius, 4), "boundaryClearancePx": round(clearance, 4)}


def _polygon(instance: Mapping[str, Any], template: Sequence[Sequence[float]]) -> list[list[float]]:
    left, top, right, bottom = [float(value) for value in instance["bbox"]]
    return [[left + point[0] * (right - left), top + point[1] * (bottom - top)] for point in template]


def _inside(point: Sequence[float], polygon: Sequence[Sequence[float]]) -> bool:
    return cv2.pointPolygonTest(np.float32(polygon), (float(point[0]), float(point[1])), False) >= 0


def _polygon_distance(point: Sequence[float], polygon: Sequence[Sequence[float]]) -> float:
    return abs(float(cv2.pointPolygonTest(np.float32(polygon), (float(point[0]), float(point[1])), True)))


def _pin_classification(point: Sequence[float], uncertainty: float, geometry: Mapping[str, Any]) -> Dict[str, Any]:
    template = geometry["shapeTemplate"]
    matches = []
    nearest = float("inf")
    for instance in geometry["pinInstancesBackToFront"]:
        polygon = _polygon(instance, template)
        nearest = min(nearest, _polygon_distance(point, polygon))
        if _inside(point, polygon):
            matches.append(instance["pinId"])
    pin_id = matches[-1] if matches else None
    status = "indeterminate_boundary" if nearest <= uncertainty else "classified"
    return {"status": status, "pinId": pin_id, "region": "pin" if pin_id else "outside", "boundaryClearancePx": round(nearest, 4)}


def _circle_classification(point: Sequence[float], uncertainty: float, geometry: Mapping[str, Any], collection: str, id_key: str, radius_key: str) -> Dict[str, Any]:
    matches = []
    nearest = float("inf")
    radius = float(geometry[radius_key])
    for region in geometry[collection]:
        distance = math.hypot(float(point[0]) - float(region["centerPx"][0]), float(point[1]) - float(region["centerPx"][1]))
        nearest = min(nearest, abs(distance - radius))
        if distance <= radius:
            matches.append(region[id_key])
    region_id = matches[-1] if matches else None
    return {
        "status": "indeterminate_boundary" if nearest <= uncertainty else "classified",
        id_key: region_id,
        "region": collection[:-1] if region_id is not None else "outside",
        "boundaryClearancePx": round(nearest, 4),
    }


def _players(payload: Mapping[str, Any], exact: int | None = None) -> list[Dict[str, str]]:
    supplied = payload.get("players")
    minimum = exact if exact is not None else 2
    if not isinstance(supplied, list) or len(supplied) < minimum or len(supplied) > 20 or (exact is not None and len(supplied) != exact):
        raise BakerFunAuthorityError("players_invalid")
    result, seen = [], set()
    for index, player in enumerate(supplied, 1):
        if not isinstance(player, Mapping):
            raise BakerFunAuthorityError("players_invalid")
        player_id = _clean(player.get("playerId"))
        name = _clean(player.get("name")) or f"Player {index}"
        if not player_id or player_id in seen:
            raise BakerFunAuthorityError("player_identity_invalid")
        seen.add(player_id)
        result.append({"playerId": player_id, "name": name})
    return result


def _event(event: Any, index: int) -> Dict[str, Any]:
    if not isinstance(event, Mapping):
        raise BakerFunAuthorityError("shot_event_invalid")
    kind = _clean(event.get("type"))
    if kind not in {"shot", "miss", "replacement"}:
        raise BakerFunAuthorityError("shot_event_type_invalid")
    result = {"eventId": _clean(event.get("eventId")) or f"event-{index + 1}", "type": kind, "playerId": _clean(event.get("playerId")), "phase": _clean(event.get("phase"))}
    if kind in {"shot", "replacement"}:
        result.update({"xNorm": _normal(event.get("xNorm"), "shot_coordinate_invalid"), "yNorm": _normal(event.get("yNorm"), "shot_coordinate_invalid")})
    if event.get("announcedNumber") is not None:
        try:
            result["announcedNumber"] = int(event.get("announcedNumber"))
        except (TypeError, ValueError) as exc:
            raise BakerFunAuthorityError("announced_number_invalid") from exc
    if event.get("completeInside") is not None:
        result["completeInside"] = event.get("completeInside") is True
    if event.get("declaredChallengeCell") is not None:
        result["declaredChallengeCell"] = _clean(event.get("declaredChallengeCell"))
    return result


def _battleship_classification(point: Sequence[float], uncertainty: float, geometry: Mapping[str, Any], declared_challenge: str = "") -> Dict[str, Any]:
    x, y = float(point[0]), float(point[1])
    selected = None
    for board in geometry["boards"]:
        left, top = [float(value) for value in board["gridOriginPx"]]
        size = float(geometry["cellSizePx"])
        column = int(math.floor((x - left) / size)) + 1
        row = int(math.floor((y - top) / size)) + 1
        if 1 <= row <= int(board["rows"]) and 1 <= column <= int(board["columns"]):
            cell = f"r{row}c{column}"
            ship = next((item for item in board["ships"] if cell in item["cells"]), None)
            clearance = min((x - left) % size, size - ((x - left) % size), (y - top) % size, size - ((y - top) % size))
            selected = {"status": "classified", "boardId": board["boardId"], "boardPlayerId": board["playerId"], "cellId": cell, "shipId": ship["shipId"] if ship else None, "region": "ship_square" if ship else "water", "boundaryClearancePx": round(clearance, 4)}
            if clearance <= uncertainty:
                selected["status"] = "indeterminate_boundary"
            break
    if selected is None:
        return {"status": "classified", "boardId": None, "boardPlayerId": None, "cellId": None, "shipId": None, "region": "outside", "boundaryClearancePx": None}
    if declared_challenge:
        board_id, _, cell_id = declared_challenge.partition(":")
        board = next((item for item in geometry["boards"] if item["boardId"] == board_id), None)
        if not board or cell_id not in board["challengeCells"]:
            raise BakerFunAuthorityError("declared_challenge_circle_invalid")
        row_match = re.fullmatch(r"r(\d+)c(\d+)", cell_id)
        row, column = int(row_match.group(1)), int(row_match.group(2))
        left, top = [float(value) for value in board["gridOriginPx"]]
        size = float(geometry["cellSizePx"])
        center = (left + (column - 0.5) * size, top + (row - 0.5) * size)
        radius = math.hypot(x - center[0], y - center[1])
        circles = geometry["challengeCircle"]
        white, outer = float(circles["whiteCenterRadiusPx"]), float(circles["outerRadiusPx"])
        clearance = min(abs(radius - white), abs(radius - outer))
        selected.update({"declaredChallengeCell": declared_challenge, "challengeRadiusPx": round(radius, 4), "challengeRegion": "white_center" if radius <= white else "dark_circle" if radius <= outer else "outside_circle", "boundaryClearancePx": round(clearance, 4)})
        if clearance <= uncertainty:
            selected["status"] = "indeterminate_boundary"
    return selected


def _dot_expectations(product: Mapping[str, Any]) -> list[Dict[str, int]]:
    expectations = []
    for stage in product["rulesAuthority"]["stages"]:
        pattern = stage["shotPattern"]
        repetitions = stage["rounds"] // len(pattern)
        for _ in range(repetitions):
            for dot in pattern:
                expectations.append({"stage": stage["stage"], "dotNumber": dot})
    return expectations


def _dot_torture_game(product: Mapping[str, Any], events: Sequence[Mapping[str, Any]], classifications: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    expectations = _dot_expectations(product)
    if len(events) > len(expectations):
        raise BakerFunAuthorityError("too_many_shot_events")
    observations, hits = [], 0
    for index, (shot, classification) in enumerate(zip(events, classifications)):
        expected = expectations[index]
        if shot.get("playerId") != "shooter" or shot.get("phase") != f"stage_{expected['stage']}":
            raise BakerFunAuthorityError("shot_sequence_invalid", details={"eventIndex": index, **expected})
        if shot["type"] == "shot" and "completeInside" not in shot:
            raise BakerFunAuthorityError("complete_inside_adjudication_required")
        hit = bool(shot["type"] == "shot" and shot.get("completeInside") is True and classification.get("dotNumber") == expected["dotNumber"])
        hits += int(hit)
        observations.append({**shot, "expectedDotNumber": expected["dotNumber"], "stageNumber": expected["stage"], "hit": hit, "classification": classification, "adjudicationAuthority": "shooter_reported_complete_inside" if shot["type"] == "shot" else "reported_miss"})
    complete = len(events) == len(expectations)
    return {
        "status": "complete" if complete else "in_progress",
        "gameMode": "dot_torture_course",
        "scoringPresentationFamily": "highest-score-wins",
        "maximumScore": len(expectations),
        "score": hits,
        "misses": len(events) - hits,
        "requiredEventCount": len(expectations),
        "recordedEventCount": len(events),
        "nextExpectation": expectations[len(events)] if not complete else None,
        "observations": observations,
    }


def _billiard_game(product: Mapping[str, Any], players: Sequence[Mapping[str, str]], events: Sequence[Mapping[str, Any]], classifications: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    sequence = product["publishedGame"]["sequence"]
    current_index, current_player_index = 0, 0
    credited = {player["playerId"]: [] for player in players}
    observations = []
    for index, (shot, classification) in enumerate(zip(events, classifications)):
        if current_index >= len(sequence):
            raise BakerFunAuthorityError("shot_event_after_game_complete")
        expected_player = players[current_player_index]
        expected_ball = sequence[current_index]
        if shot.get("playerId") != expected_player["playerId"] or shot.get("phase") != "ordered_sequence":
            raise BakerFunAuthorityError("shot_sequence_invalid", details={"eventIndex": index, "expectedPlayerId": expected_player["playerId"], "expectedBallNumber": expected_ball})
        hit = bool(shot["type"] == "shot" and classification.get("number") == expected_ball)
        if hit:
            credited[expected_player["playerId"]].append(expected_ball)
            current_index += 1
        else:
            current_player_index = (current_player_index + 1) % len(players)
        observations.append({**shot, "expectedBallNumber": expected_ball, "hit": hit, "classification": classification})
    complete = current_index == len(sequence)
    return {
        "status": "complete" if complete else "in_progress",
        "gameMode": "ordered_billiard_sequence",
        "scoringPresentationFamily": "qualification-pass-fail",
        "publishedInstruction": product["publishedGame"]["instruction"],
        "currentBallNumber": None if complete else sequence[current_index],
        "currentPlayerId": None if complete else players[current_player_index]["playerId"],
        "ballsCompleted": current_index,
        "ballCount": len(sequence),
        "recordedEventCount": len(events),
        "players": [{**player, "creditedBallNumbers": credited[player["playerId"]]} for player in players],
        "outcome": "sequence_complete" if complete else "in_progress",
        "winnerPlayerIds": [],
        "observations": observations,
        "claimBoundary": "Publisher defines sequence and turn change only; no winner or numeric score inferred",
    }


def _battleship_game(product: Mapping[str, Any], geometry: Mapping[str, Any], players: Sequence[Mapping[str, str]], events: Sequence[Mapping[str, Any]], classifications: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    boards = {board["playerId"]: board for board in geometry["boards"]}
    hit_cells = {player["playerId"]: set() for player in players}
    skipped_turns = {player["playerId"]: 0 for player in players}
    player_index, pending, observations = 0, None, []
    winner_ids, loser_ids = [], []

    def target_player(attacker_id: str) -> str:
        return players[1]["playerId"] if attacker_id == players[0]["playerId"] else players[0]["playerId"]

    def ship_cells(board: Mapping[str, Any]) -> set[str]:
        return {cell for ship in board["ships"] for cell in ship["cells"]}

    def advance_turn() -> None:
        nonlocal player_index
        player_index = (player_index + 1) % 2
        if skipped_turns[players[player_index]["playerId"]] > 0:
            skipped_turns[players[player_index]["playerId"]] -= 1
            player_index = (player_index + 1) % 2

    for index, (event, classification) in enumerate(zip(events, classifications)):
        if winner_ids:
            raise BakerFunAuthorityError("shot_event_after_game_complete")
        attacker = players[player_index]
        defender_id = target_player(attacker["playerId"])
        defender_board = boards[defender_id]
        if event.get("playerId") != attacker["playerId"]:
            raise BakerFunAuthorityError("shot_sequence_invalid", details={"eventIndex": index, "expectedPlayerId": attacker["playerId"]})
        credited = []
        if pending:
            if event["type"] != "replacement" or event.get("phase") != "challenge_replacement":
                raise BakerFunAuthorityError("challenge_replacement_required", details={"eventIndex": index})
            if classification.get("boardPlayerId") != defender_id or not classification.get("shipId") or classification.get("cellId") in hit_cells[defender_id]:
                raise BakerFunAuthorityError("challenge_replacement_invalid")
            if pending["kind"] == "dark_circle":
                credited = [classification["cellId"]]
            else:
                remaining_by_ship = []
                for ship in defender_board["ships"]:
                    remaining = [cell for cell in ship["cells"] if cell not in hit_cells[defender_id]]
                    if remaining:
                        remaining_by_ship.append((len(ship["cells"]), ship["shipId"], remaining))
                largest = max(item[0] for item in remaining_by_ship)
                allowed = [item for item in remaining_by_ship if item[0] == largest]
                chosen = next((item for item in allowed if item[1] == classification.get("shipId")), None)
                if not chosen:
                    raise BakerFunAuthorityError("challenge_largest_ship_choice_invalid")
                credited = chosen[2]
            hit_cells[defender_id].update(credited)
            observations.append({**event, "classification": classification, "replacementAward": pending["kind"], "creditedCells": credited})
            pending = None
            advance_turn()
        else:
            phase = event.get("phase")
            if phase not in {"ship_attack", "challenge_attack"} or event["type"] == "replacement":
                raise BakerFunAuthorityError("shot_sequence_invalid", details={"eventIndex": index})
            hit = False
            challenge_outcome = None
            if phase == "ship_attack":
                hit = bool(event["type"] == "shot" and classification.get("boardPlayerId") == defender_id and classification.get("shipId"))
                if hit:
                    credited = [classification["cellId"]]
                    hit_cells[defender_id].add(classification["cellId"])
            else:
                declared = event.get("declaredChallengeCell")
                if not declared or not declared.startswith(defender_board["boardId"] + ":"):
                    raise BakerFunAuthorityError("declared_challenge_circle_invalid")
                challenge_outcome = classification.get("challengeRegion") if event["type"] == "shot" else "outside_circle"
                if challenge_outcome == "dark_circle":
                    pending = {"kind": "dark_circle", "attackerPlayerId": attacker["playerId"], "defenderPlayerId": defender_id}
                elif challenge_outcome == "white_center":
                    pending = {"kind": "white_center", "attackerPlayerId": attacker["playerId"], "defenderPlayerId": defender_id}
                else:
                    skipped_turns[attacker["playerId"]] += 1
            observations.append({**event, "classification": classification, "hit": hit, "challengeOutcome": challenge_outcome, "creditedCells": credited})
            if not pending:
                advance_turn()

        for board_player_id, board in boards.items():
            if ship_cells(board).issubset(hit_cells[board_player_id]):
                loser_ids = [board_player_id]
                winner_ids = [target_player(board_player_id)]
                break

    board_results = []
    for player in players:
        board = boards[player["playerId"]]
        required = ship_cells(board)
        board_results.append({
            "playerId": player["playerId"],
            "playerName": player["name"],
            "shipSquareCount": len(required),
            "shipSquaresHit": len(required.intersection(hit_cells[player["playerId"]])),
            "shipSquaresRemaining": len(required.difference(hit_cells[player["playerId"]])),
            "sunk": required.issubset(hit_cells[player["playerId"]]),
        })
    return {
        "status": "complete" if winner_ids else "in_progress",
        "gameMode": "baker_battleship",
        "scoringPresentationFamily": "qualification-pass-fail",
        "publishedObjective": product["rulesAuthority"]["objective"],
        "currentPlayerId": None if winner_ids else players[player_index]["playerId"],
        "pendingChallengeAward": pending,
        "winnerPlayerIds": winner_ids,
        "loserPlayerIds": loser_ids,
        "boards": board_results,
        "recordedEventCount": len(events),
        "observations": observations,
        "optionalChallengeRulesAvailable": True,
    }


def _points_game(payload: Mapping[str, Any], players: Sequence[Mapping[str, str]], events: Sequence[Mapping[str, Any]], classifications: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    try:
        shots_per_player = int(payload.get("shotsPerPlayer", 10))
    except (TypeError, ValueError) as exc:
        raise BakerFunAuthorityError("shots_per_player_invalid") from exc
    if shots_per_player < 1 or shots_per_player > 100:
        raise BakerFunAuthorityError("shots_per_player_invalid")
    play_order = _clean(payload.get("playOrder")) or "player_at_a_time"
    if play_order not in {"player_at_a_time", "alternating"}:
        raise BakerFunAuthorityError("play_order_invalid")
    regular_count = len(players) * shots_per_player
    required = regular_count + len(players)
    if len(events) > required:
        raise BakerFunAuthorityError("too_many_shot_events")
    scores = {player["playerId"]: {**player, "regularScore": 0, "bullBonus": 0, "totalScore": 0, "shots": []} for player in players}
    for index, (shot, classification) in enumerate(zip(events, classifications)):
        if index < regular_count:
            expected = players[index // shots_per_player] if play_order == "player_at_a_time" else players[index % len(players)]
            phase = "regular"
            announced = shot.get("announcedNumber")
            if not isinstance(announced, int) or announced < 1 or announced > 20:
                raise BakerFunAuthorityError("announced_number_invalid")
            matched = shot["type"] == "shot" and classification.get("sectorNumber") == announced and classification.get("band") in {"single", "double", "triple"}
            multiplier = {"single": 1, "double": 2, "triple": 3}.get(classification.get("band"), 0) if matched else 0
            points = announced * multiplier
            scores[expected["playerId"]]["regularScore"] += points
            detail = {"announcedNumber": announced, "matchedAnnouncement": matched, "multiplier": multiplier, "points": points}
        else:
            expected = players[index - regular_count]
            phase = "bull"
            points = 50 if shot["type"] == "shot" and classification.get("band") == "inner_bull" else 25 if shot["type"] == "shot" and classification.get("band") == "outer_bull" else 0
            scores[expected["playerId"]]["bullBonus"] += points
            detail = {"points": points}
        if shot["playerId"] != expected["playerId"] or shot.get("phase") != phase:
            raise BakerFunAuthorityError("shot_sequence_invalid", details={"eventIndex": index, "expectedPlayerId": expected["playerId"], "expectedPhase": phase})
        scores[expected["playerId"]]["shots"].append({**shot, "classification": classification, **detail})
    for score in scores.values():
        score["totalScore"] = score["regularScore"] + score["bullBonus"]
    complete = len(events) == required
    leaders = []
    if complete:
        high = max(score["totalScore"] for score in scores.values())
        leaders = [score["playerId"] for score in scores.values() if score["totalScore"] == high]
    return {
        "status": "complete" if complete else "in_progress",
        "gameMode": "game_of_points",
        "scoringPresentationFamily": "highest-score-wins",
        "shotsPerPlayer": shots_per_player,
        "playOrder": play_order,
        "requiredEventCount": required,
        "recordedEventCount": len(events),
        "players": list(scores.values()),
        "winnerPlayerIds": leaders if complete and len(leaders) == 1 else [],
        "tiePlayerIds": leaders if complete and len(leaders) > 1 else [],
    }


def _numbers_game(players: Sequence[Mapping[str, str]], events: Sequence[Mapping[str, Any]], classifications: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    state = {player["playerId"]: {**player, "nextNumber": 1, "bullDistancePx": None, "completed": False, "shots": []} for player in players}
    current = players[0]["playerId"]
    first_finisher = None
    response_player = None
    status, winner_ids, tie_ids = "in_progress", [], []
    for index, (shot, classification) in enumerate(zip(events, classifications)):
        if status == "complete":
            raise BakerFunAuthorityError("shot_event_after_game_complete")
        if shot["playerId"] != current:
            raise BakerFunAuthorityError("shot_sequence_invalid", details={"eventIndex": index, "expectedPlayerId": current})
        player = state[current]
        expected = player["nextNumber"]
        if shot["type"] == "miss":
            hit = False
        elif expected <= 20:
            hit = classification.get("sectorNumber") == expected and classification.get("band") in {"single", "double", "triple"}
        else:
            hit = classification.get("band") in {"inner_bull", "outer_bull"}
        player["shots"].append({**shot, "expected": "bull" if expected == 21 else expected, "hit": hit, "classification": classification})
        if hit and expected <= 20:
            player["nextNumber"] += 1
            continue
        if hit and expected == 21:
            player["completed"] = True
            player["bullDistancePx"] = classification.get("canonicalRadiusPx")
            if first_finisher is None:
                first_finisher = current
                response_player = players[1]["playerId"] if current == players[0]["playerId"] else players[0]["playerId"]
                current = response_player
                continue
            distances = [state[item["playerId"]]["bullDistancePx"] for item in players]
            if abs(distances[0] - distances[1]) < 1e-9:
                tie_ids = [item["playerId"] for item in players]
            else:
                winner_ids = [players[0]["playerId"] if distances[0] < distances[1] else players[1]["playerId"]]
            status = "complete"
            continue
        if first_finisher is not None and current == response_player:
            winner_ids = [first_finisher]
            status = "complete"
            continue
        current = players[1]["playerId"] if current == players[0]["playerId"] else players[0]["playerId"]
    return {
        "status": status,
        "gameMode": "game_of_numbers",
        "scoringPresentationFamily": "qualification-pass-fail",
        "players": list(state.values()),
        "currentPlayerId": None if status == "complete" else current,
        "firstFinisherPlayerId": first_finisher,
        "winnerPlayerIds": winner_ids,
        "tiePlayerIds": tie_ids,
        "recordedEventCount": len(events),
    }


def _bowling_game(product: Mapping[str, Any], events: Sequence[Mapping[str, Any]], classifications: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    challenge = product["publishedChallenge"]
    if len(events) > challenge["shotLimit"]:
        raise BakerFunAuthorityError("ten_shot_limit_exceeded")
    observations, pins = [], []
    for shot, classification in zip(events, classifications):
        pin_id = classification.get("pinId") if shot["type"] == "shot" else None
        new_pin_hit = bool(pin_id and pin_id not in pins)
        if new_pin_hit:
            pins.append(pin_id)
        observations.append({**shot, "classification": classification, "newPinHit": new_pin_hit})
    complete_attempt = len(events) == challenge["shotLimit"]
    cleared = len(pins) == challenge["pinCount"] and complete_attempt
    return {
        "status": "complete" if complete_attempt else "in_progress",
        "scoringPresentationFamily": "qualification-pass-fail",
        "challengeAuthorityId": challenge["authorityId"],
        "shotLimit": challenge["shotLimit"],
        "shotsUsed": len(events),
        "pinCount": challenge["pinCount"],
        "pinsHit": len(pins),
        "pinIdsHit": pins,
        "pinsRemaining": challenge["pinCount"] - len(pins),
        "outcome": "all_pins_hit" if cleared else "attempt_complete" if complete_attempt else "in_progress",
        "observations": observations,
    }


def analyze_fun_target_evidence(payload: Any) -> Dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise BakerFunAuthorityError("payload_must_be_an_object", "invalid_request")
    profile_id = _clean(payload.get("targetProfileId"))
    context = _context(profile_id)
    product, ugo = context["product"], context["ugo"]
    if _clean(payload.get("targetProfileVersion")) != "1":
        raise BakerFunAuthorityError("target_profile_version_mismatch")
    if _clean(payload.get("targetId")) != context["definition"]["targetId"]:
        raise BakerFunAuthorityError("target_identity_mismatch")
    variant = _variant(product, _clean(payload.get("variantId")))
    image_payload = payload.get("imageEvidence")
    if not isinstance(image_payload, Mapping):
        raise BakerFunAuthorityError("image_evidence_required")
    image = _decode_image(image_payload)
    raw_events = payload.get("events")
    if not isinstance(raw_events, list):
        raise BakerFunAuthorityError("shot_events_required")
    events = [_event(item, index) for index, item in enumerate(raw_events)]
    registration = _register(context, image, events)
    classifications, evidence_observations = [], []
    for event, point in zip(events, registration["canonicalPoints"]):
        if point is None:
            classification = {"status": "reported_miss", "region": "outside"}
        elif profile_id == "baker_gf_db":
            classification = _dart_classification(point, registration["uncertaintyPx"], ugo["geometryObservation"])
        elif profile_id == "baker_gf_bp":
            classification = _pin_classification(point, registration["uncertaintyPx"], ugo["geometryObservation"])
        elif profile_id == "ez2c_dot_torture_17":
            classification = _circle_classification(point, registration["uncertaintyPx"], ugo["geometryObservation"], "dots", "dotNumber", "dotRadiusPx")
        elif profile_id == "baker_gf_battleship":
            classification = _battleship_classification(point, registration["uncertaintyPx"], ugo["geometryObservation"], event.get("declaredChallengeCell", ""))
        else:
            classification = _circle_classification(point, registration["uncertaintyPx"], ugo["geometryObservation"], "balls", "number", "ballRadiusPx")
        if classification.get("status") == "indeterminate_boundary":
            raise BakerFunAuthorityError("indeterminate_boundary", details={"eventId": event["eventId"], "boundaryClearancePx": classification["boundaryClearancePx"]})
        classifications.append(classification)
        evidence_observations.append({"eventId": event["eventId"], "playerId": event.get("playerId"), "type": event["type"], "imageCoordinate": {"xNorm": event.get("xNorm"), "yNorm": event.get("yNorm")} if point is not None else None, "canonicalCoordinatePx": {"x": round(point[0], 4), "y": round(point[1], 4)} if point is not None else None, "targetCoordinateInches": _inches(point, variant, ugo["sourceEvidence"]) if point is not None else None, "classification": classification})
    if profile_id == "baker_gf_db":
        players = _players(payload, exact=2 if payload.get("gameMode") == "game_of_numbers" else None)
        mode = _clean(payload.get("gameMode"))
        if mode == "game_of_points":
            result = _points_game(payload, players, events, classifications)
        elif mode == "game_of_numbers":
            result = _numbers_game(players, events, classifications)
        else:
            raise BakerFunAuthorityError("game_mode_invalid")
        mission_id = "BAKER_GF_DB_GAME_OF_POINTS_V1" if mode == "game_of_points" else "BAKER_GF_DB_GAME_OF_NUMBERS_V1"
    elif profile_id == "baker_gf_bp":
        result = _bowling_game(product, events, classifications)
        mission_id = "BAKER_GF_BP_TEN_SHOT_CHALLENGE_V1"
    elif profile_id == "ez2c_dot_torture_17":
        _players(payload, exact=1)
        result = _dot_torture_game(product, events, classifications)
        mission_id = "EZ2C_STYLE_17_PUBLISHED_COURSE_V1"
    elif profile_id == "baker_gf_battleship":
        players = _players(payload, exact=2)
        result = _battleship_game(product, ugo["geometryObservation"], players, events, classifications)
        mission_id = "BAKER_GF_BATTLESHIP_PUBLISHED_GAME_V1"
    else:
        result = _billiard_game(product, _players(payload), events, classifications)
        mission_id = "BAKER_GF_BB_C_PUBLISHED_GAME_V1"
    return {
        "ok": True,
        "status": result["status"],
        "resultPackageType": context["definition"]["resultPackageType"],
        "targetProfileId": profile_id,
        "targetProfileVersion": "1",
        "targetId": context["definition"]["targetId"],
        "variantId": variant["variantId"],
        "missionFamily": "bakerFunGame" if profile_id in {"baker_gf_db", "baker_gf_bp"} else "catalogFunGame",
        "missionAuthorityId": mission_id,
        "publisherIdentity": product["publisherIdentity"],
        "productIdentity": product["productIdentity"],
        "registration": registration["registration"],
        "evidence": {"imageSha256": image["sha256"], "imageWidthPx": image["width"], "imageHeightPx": image["height"], "observations": evidence_observations, "observationCount": len(events)},
        "result": result,
        "reconciliation": {"recordedEventCount": len(events), "evidenceObservationCount": len(evidence_observations), "status": "reconciled" if len(events) == len(evidence_observations) else "mismatch"},
        "authorityTrace": {**context["hashes"], "classificationAuthority": "backend", "scoringAuthority": "backend", "ugoAuthorityId": ugo["ugoAuthorityId"], "missionAuthorityId": mission_id},
    }


def analyze_baker_fun_evidence(payload: Any) -> Dict[str, Any]:
    """Compatibility entry point for the pre-expansion Baker route."""
    return analyze_fun_target_evidence(payload)
