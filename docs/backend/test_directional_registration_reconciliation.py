from __future__ import annotations

import base64
import hashlib
from copy import deepcopy
from pathlib import Path

import cv2
import numpy as np

from authority_service import build_authority_package
from target_image_registration_authority import directional_source_reconciliation


DOCS = Path(__file__).resolve().parents[1]
CANONICAL = DOCS / "assets" / "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png"
PACKAGE_ID = "baker-st-100yd-smart-photo-registration-v1"
PROFILE_ID = "baker_st_100yd_smart_zero"
PROFILE_VERSION = "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL"


def image_evidence(raw: bytes, media_type: str = "image/jpeg") -> dict:
    decoded = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert decoded is not None
    height, width = decoded.shape[:2]
    return {
        "sha256": hashlib.sha256(raw).hexdigest(),
        "widthPx": width,
        "heightPx": height,
        "dataUrl": f"data:{media_type};base64,{base64.b64encode(raw).decode('ascii')}",
    }


def encoded_image(image: np.ndarray, quality: int = 86) -> dict:
    ok, encoded = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    assert ok
    return image_evidence(encoded.tobytes())


def precision_envelope(evidence: dict, aim: dict, impacts: list[dict]) -> dict:
    return {
        "schemaVersion": "sczn3-precision-tap-observations-v1",
        "observationAuthority": "shooter_declared",
        "coordinateConvention": "normalized_source_image_top_left",
        "registrationPackageId": PACKAGE_ID,
        "registrationPackageVersion": "1",
        "targetProfileId": PROFILE_ID,
        "targetProfileVersion": PROFILE_VERSION,
        "imageEvidence": evidence,
        "aimObservation": aim,
        "impactObservations": impacts,
    }


def authority_payload(evidence: dict, aim: dict, impacts: list[dict]) -> dict:
    return {
        "targetId": "BAKER_ST_100YD_SMART",
        "targetProfileId": PROFILE_ID,
        "targetName": "Baker 100 Yard Smart Target",
        "aimCoordinate": aim,
        "impactCoordinates": impacts,
        "distance": {"value": 100, "unit": "yds"},
        "shooterSetup": {"optic": {"adjustmentUnit": "MOA", "clickValueMOA": 0.25}},
        "precisionTapEvidence": precision_envelope(evidence, aim, impacts),
    }


def source_point(x: float, y: float, shot_id: str = "") -> dict:
    point = {"xPercent": x, "yPercent": y}
    if shot_id:
        point["shotId"] = shot_id
    return point


def directional_package(evidence: dict, poib_x: float, poib_y: float) -> dict:
    aim = source_point(50, 50)
    impacts = [
        source_point(poib_x - .4, poib_y - .3, "shot-1"),
        source_point(poib_x + .4, poib_y - .2, "shot-2"),
        source_point(poib_x, poib_y + .5, "shot-3"),
    ]
    return build_authority_package(authority_payload(evidence, aim, impacts))


def canonical_evidence() -> dict:
    return image_evidence(CANONICAL.read_bytes(), "image/png")


def central_symmetric_crop(rotation: int = 0) -> dict:
    image = cv2.imread(str(CANONICAL), cv2.IMREAD_COLOR)
    crop = image[280:1650, 68:1047]
    if rotation == 90:
        crop = cv2.rotate(crop, cv2.ROTATE_90_CLOCKWISE)
    elif rotation == 180:
        crop = cv2.rotate(crop, cv2.ROTATE_180)
    elif rotation == 270:
        crop = cv2.rotate(crop, cv2.ROTATE_90_COUNTERCLOCKWISE)
    largest = max(crop.shape[:2])
    if largest > 1200:
        scale = 1200 / largest
        crop = cv2.resize(crop, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    return encoded_image(crop)


def perspective_evidence() -> tuple[dict, np.ndarray]:
    canonical = cv2.imread(str(CANONICAL), cv2.IMREAD_COLOR)
    height, width = canonical.shape[:2]
    canonical_corners = np.float32([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]])
    photo_corners = np.float32([[82, 55], [1140, 96], [1194, 1518], [48, 1480]])
    canonical_to_photo = cv2.getPerspectiveTransform(canonical_corners, photo_corners)
    photo = cv2.warpPerspective(canonical, canonical_to_photo, (1240, 1580), borderValue=(40, 40, 40))
    return encoded_image(photo, 92), canonical_to_photo


def rotated_full_face(rotation: int) -> tuple[dict, np.ndarray, tuple[int, int]]:
    canonical = cv2.imread(str(CANONICAL), cv2.IMREAD_COLOR)
    height, width = canonical.shape[:2]
    if rotation == 90:
        photo = cv2.rotate(canonical, cv2.ROTATE_90_CLOCKWISE)
        transform = np.array([[0, -1, height - 1], [1, 0, 0], [0, 0, 1]], dtype=np.float64)
    elif rotation == 180:
        photo = cv2.rotate(canonical, cv2.ROTATE_180)
        transform = np.array([[-1, 0, width - 1], [0, -1, height - 1], [0, 0, 1]], dtype=np.float64)
    elif rotation == 270:
        photo = cv2.rotate(canonical, cv2.ROTATE_90_COUNTERCLOCKWISE)
        transform = np.array([[0, 1, 0], [-1, 0, width - 1], [0, 0, 1]], dtype=np.float64)
    else:
        raise ValueError("rotation must be 90, 180, or 270")
    photo_height, photo_width = photo.shape[:2]
    return encoded_image(photo, 92), transform, (photo_width, photo_height)


def transformed_point(matrix: np.ndarray, x: float, y: float, shot_id: str = "") -> dict:
    point = np.float32([[[x / 100 * 1101, y / 100 * 1712]]])
    mapped = cv2.perspectiveTransform(point, matrix)[0, 0]
    return source_point(float(mapped[0] / 1239 * 100), float(mapped[1] / 1579 * 100), shot_id)


def transformed_point_for_size(
    matrix: np.ndarray,
    photo_size: tuple[int, int],
    x: float,
    y: float,
    shot_id: str = "",
) -> dict:
    point = np.float32([[[x / 100 * 1101, y / 100 * 1712]]])
    mapped = cv2.perspectiveTransform(point, matrix)[0, 0]
    return source_point(float(mapped[0] / (photo_size[0] - 1) * 100), float(mapped[1] / (photo_size[1] - 1) * 100), shot_id)


def test_correctly_oriented_photo_releases_reconciled_right_up_result():
    evidence, transform = perspective_evidence()
    aim = transformed_point(transform, 50, 50)
    impacts = [
        transformed_point(transform, 43.6, 55.7, "shot-1"),
        transformed_point(transform, 44.4, 55.8, "shot-2"),
        transformed_point(transform, 44.0, 56.5, "shot-3"),
    ]
    result = build_authority_package(authority_payload(evidence, aim, impacts))
    assert result["targetImageRegistrationEvidence"]["orientationEvidence"]["status"] == "proven"
    assert result["registrationClaimSufficiency"]["status"] == "sufficient"
    assert result["directionalReconciliation"]["status"] == "reconciled"
    assert result["correction"]["windageDirection"] == "RIGHT"
    assert result["correction"]["elevationDirection"] == "UP"
    assert result["authorityAuditEnvelope"]["releaseStatus"] == "released"
    assert result["clicks"]["quantization"]["windage"]["policyId"] == "sczn3-universal-mechanical-quantization-v1"
    assert result["clicks"]["quantization"]["windage"]["status"] == "released"
    assert result["authorityAuditEnvelope"]["mechanicalQuantization"] == result["clicks"]["quantization"]
    assert all(result["directionalReconciliation"]["checks"].values())


def test_founder_180_degree_false_registration_is_withheld():
    result = directional_package(central_symmetric_crop(0), 45, 54)
    registration = result["targetImageRegistrationEvidence"]
    mapping = registration["orientationEvidence"]["sourceAxisMapping"]
    audit = result["authorityAuditEnvelope"]
    assert registration["registrationMethod"] == "ugo_sift_homography_v1"
    assert mapping["sourceRightMapsToCanonical"] == "LEFT"
    assert mapping["sourceDownMapsToCanonical"] == "UP"
    assert registration["orientationEvidence"]["status"] == "unverified"
    assert result["registrationClaimSufficiency"]["reason"] == "target_orientation_unverified"
    assert result["directionalReconciliation"]["status"] == "mismatch"
    assert audit["sourceEvidence"]["direction"] == {"windage": "RIGHT", "elevation": "UP"}
    assert audit["calculatedCorrection"]["windageDirection"] == "LEFT"
    assert audit["calculatedCorrection"]["elevationDirection"] == "DOWN"
    assert audit["calculatedClicks"]["windageClicks"] == 4
    assert audit["calculatedClicks"]["elevationClicks"] == 4
    assert audit["releaseStatus"] == "withheld"
    assert result["correction"] is None
    assert result["clicks"] is None
    assert result["renderCoordinates"]["vector"] is None


def test_rotationally_ambiguous_crops_never_receive_directional_authority():
    for rotation in (0, 90, 180, 270):
        result = directional_package(central_symmetric_crop(rotation), 44, 56)
        registration = result["targetImageRegistrationEvidence"]
        assert registration["orientationEvidence"]["status"] == "unverified"
        assert result["registrationClaimSufficiency"]["reason"] == "target_orientation_unverified"
        assert result["authorityAuditEnvelope"]["releaseStatus"] == "withheld"
        assert result["correction"] is None
        assert result["clicks"] is None


def test_rotated_full_faces_are_accepted_only_when_asymmetric_orientation_is_proven():
    for rotation in (90, 180, 270):
        evidence, transform, photo_size = rotated_full_face(rotation)
        aim = transformed_point_for_size(transform, photo_size, 50, 50)
        impacts = [
            transformed_point_for_size(transform, photo_size, 43.6, 55.7, "shot-1"),
            transformed_point_for_size(transform, photo_size, 44.4, 55.8, "shot-2"),
            transformed_point_for_size(transform, photo_size, 44.0, 56.5, "shot-3"),
        ]
        result = build_authority_package(authority_payload(evidence, aim, impacts))
        assert result["targetImageRegistrationEvidence"]["orientationEvidence"]["status"] == "proven"
        assert result["directionalReconciliation"]["status"] == "reconciled"
        assert result["correction"]["windageDirection"] == "RIGHT"
        assert result["correction"]["elevationDirection"] == "UP"


def test_all_source_plane_direction_cases_reconcile():
    cases = [
        ((44, 56), ("RIGHT", "UP")),
        ((56, 44), ("LEFT", "DOWN")),
        ((44, 50), ("RIGHT", "CENTER")),
        ((56, 50), ("LEFT", "CENTER")),
        ((50, 56), ("CENTER", "UP")),
        ((50, 44), ("CENTER", "DOWN")),
    ]
    evidence = canonical_evidence()
    for (x, y), expected in cases:
        result = directional_package(evidence, x, y)
        assert result["directionalReconciliation"]["status"] == "reconciled"
        assert result["correction"]["windageDirection"] == expected[0]
        assert result["correction"]["elevationDirection"] == expected[1]
        assert result["authorityAuditEnvelope"]["releaseStatus"] == "released"


def test_reconciliation_independently_rejects_tampered_direction_or_vector():
    result = directional_package(canonical_evidence(), 44, 56)
    registration = result["targetImageRegistrationEvidence"]
    aim = result["inputs"]["aimCoordinate"]
    poib = result["poib"]
    render = deepcopy(result["renderCoordinates"])
    wrong_correction = deepcopy(result["correction"])
    wrong_correction["windageDirection"] = "LEFT"
    assert directional_source_reconciliation(registration, aim, poib, render, wrong_correction)["status"] == "mismatch"
    render["vector"] = {"start": deepcopy(render["aim"]), "end": deepcopy(render["poib"]), "intent": "POIB_TO_AIM"}
    assert directional_source_reconciliation(registration, aim, poib, render, result["correction"])["status"] == "mismatch"


if __name__ == "__main__":
    tests = [value for name, value in globals().copy().items() if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} directional registration/reconciliation tests")
