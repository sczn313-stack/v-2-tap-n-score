#!/usr/bin/env python3
"""Focused Backend lifecycle acceptance for both TST-12 sizes and session modes."""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import ExecutionAuthorityError, execute_authoritative_session
from preserved_sec_store import preserve_sec, read_preserved_sec
from session_authority import prepare_session, start_session
from target_execution_contract import TargetExecutionContractResolver
from test_target_execution_scale_architecture import MemoryStore


BACKEND = Path(__file__).resolve().parent
NOW = datetime(2026, 10, 21, 18, 0, tzinfo=timezone.utc)
TARGETS = ("baker_tst12_17_5x23", "baker_tst12_23x35")


def contract_path(target_id: str) -> Path:
    return BACKEND / "target_execution_contracts" / "contracts" / f"{target_id}_target_scoring_v1.json"


def observations(contract: dict) -> list[dict[str, float]]:
    centers = [
        (region["regionId"].replace("_crosshair", "_square"), region["cx"], region["cy"])
        for region in contract["components"]["geometry"]["definition"]["regions"]
        if region["regionId"].endswith("_crosshair")
    ]
    assert len(centers) == 12
    return [
        {"xNorm": x, "yNorm": y, "assignedStationRegionId": station_region_id}
        for station_region_id, x, y in centers
        for _ in range(5)
    ]


def mixed_observations(contract: dict) -> list[dict[str, float]]:
    regions = {
        region["regionId"]: region
        for region in contract["components"]["geometry"]["definition"]["regions"]
    }
    evidence = []
    for station_number in range(1, 13):
        prefix = f"station_{station_number:02d}"
        station_id = f"{prefix}_square"
        crosshair = regions[f"{prefix}_crosshair"]
        red = regions[f"{prefix}_red_center"]
        ring = regions[f"{prefix}_black_ring_1"]
        points = (
            (crosshair["cx"], crosshair["cy"]),
            (red["cx"] + red["radiusX"] * 0.75, red["cy"]),
            (ring["cx"] + (ring["innerRadiusX"] + ring["outerRadiusX"]) / 2, ring["cy"]),
            (ring["cx"] + ring["outerRadiusX"], ring["cy"]),
            (0.99, 0.99),
        )
        evidence.extend(
            {
                "observationId": f"stable-{station_number:02d}-{point_number:02d}",
                "xNorm": x,
                "yNorm": y,
                "assignedStationRegionId": station_id,
            }
            for point_number, (x, y) in enumerate(points, start=1)
        )
    return evidence


def every_region_observations(contract: dict) -> list[dict[str, float]]:
    """One governed example of every TST-12 row type per station, plus a miss."""
    regions = {
        region["regionId"]: region
        for region in contract["components"]["geometry"]["definition"]["regions"]
    }
    evidence = []
    for station_number in range(1, 13):
        prefix = f"station_{station_number:02d}"
        station_id = f"{prefix}_square"
        square = regions[station_id]
        red = regions[f"{prefix}_red_center"]
        crosshair = regions[f"{prefix}_crosshair"]
        # The square corner is inside its governed rectangle and outside the
        # concentric rings. Every annular-band point is its radial midpoint.
        evidence.append({
            "xNorm": square["xMin"] + 0.01,
            "yNorm": square["yMin"] + 0.01,
            "assignedStationRegionId": station_id,
        })
        for ring_number in range(1, 5):
            ring = regions[f"{prefix}_black_ring_{ring_number}"]
            evidence.append({
                "xNorm": ring["cx"] + (ring["innerRadiusX"] + ring["outerRadiusX"]) / 2,
                "yNorm": ring["cy"],
                "assignedStationRegionId": station_id,
            })
        evidence.extend([
            {
                "xNorm": red["cx"] + red["radiusX"] * 0.75,
                "yNorm": red["cy"],
                "assignedStationRegionId": station_id,
            },
            {
                "xNorm": crosshair["cx"],
                "yNorm": crosshair["cy"],
                "assignedStationRegionId": station_id,
            },
            {
                "xNorm": 0.99,
                "yNorm": 0.99,
                "assignedStationRegionId": station_id,
            },
        ])
    return evidence


def formerly_ambiguous_observations(contract: dict) -> list[dict[str, float]]:
    evidence = observations(contract)
    regions = {
        region["regionId"]: region
        for region in contract["components"]["geometry"]["definition"]["regions"]
    }
    ring_1 = regions["station_01_black_ring_1"]
    ring_2 = regions["station_01_black_ring_2"]
    evidence[0] = {
        "xNorm": ring_1["cx"] + (ring_1["outerRadiusX"] + ring_2["innerRadiusX"]) / 2,
        "yNorm": ring_1["cy"],
        "assignedStationRegionId": "station_01_square",
    }
    return evidence


def image_evidence(contract: dict) -> dict:
    registration = contract["components"]["registration"]["definition"]
    dimensions = (1041, 980) if contract["targetProfile"]["id"] == "baker_tst12_17_5x23" else (1206, 1134)
    return {
        "sha256": registration["assetSha256"],
        "mediaId": f"registered-asset:{registration['assetSha256']}",
        "assetUrl": registration["assetPath"],
        "mediaType": "image/svg+xml",
        "widthPx": dimensions[0],
        "heightPx": dimensions[1],
    }


def verify(target_id: str, experience_mode: str) -> None:
    contract = json.loads(contract_path(target_id).read_text(encoding="utf-8"))
    resolver = TargetExecutionContractResolver((contract,))
    store = MemoryStore()
    prepared = prepare_session(
        {"targetId": target_id, "missionFamily": "targetScoring", "experienceMode": experience_mode},
        store,
        now=NOW,
        execution_contract_resolver=resolver,
    )
    started = start_session(
        {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"], "experienceMode": experience_mode},
        store,
        idempotency_key=f"tst12-{target_id}-{experience_mode}",
        now=NOW,
        execution_contract_resolver=resolver,
    )
    station_policy = started["interactionContract"]["stationSequencePolicy"]
    assert station_policy["scoringCreditObservationsPerStation"] == 5
    assert station_policy["assignmentAuthority"] == "shooter_selected_station"
    assert len(station_policy["stationRegions"]) == 12
    assert all(region["shape"] == "rectangle" for region in station_policy["stationRegions"])
    gauge_catalog = started["interactionContract"]["scoringGaugeCatalog"]
    assert gauge_catalog["source"] == "target_execution_contract_boundary_policy"
    assert [item["caliberId"] for item in gauge_catalog["options"]] == [
        ".17 HMR", ".22 LR", ".22 WMR", ".223 Rem", "5.56 NATO", ".300 BLK", ".308 Win", "6.5 Creedmoor",
        "9mm", "10mm Auto", ".45 ACP", ".40 S&W", ".380 ACP", ".357 SIG", ".45 GAP",
        "12 Gauge", "20 Gauge", "16 Gauge", ".410 Bore",
    ]
    available_calibers = [item for item in gauge_catalog["options"] if item["availableForScoring"]]
    unavailable_calibers = [item for item in gauge_catalog["options"] if not item["availableForScoring"]]
    assert len(available_calibers) == 15
    assert all(item["diameterInches"] > 0 for item in available_calibers)
    assert [item["caliberId"] for item in unavailable_calibers] == ["12 Gauge", "20 Gauge", "16 Gauge", ".410 Bore"]
    assert all(item["unavailableReason"] == "No single governed projectile diameter" for item in unavailable_calibers)
    for catalog_option in available_calibers:
        catalog_result = execute_authoritative_session(
            {
                "authoritativeSessionId": started["authoritativeSessionId"],
                "evidence": {
                    "imageEvidence": image_evidence(contract),
                    "observations": observations(contract)[:1],
                    "scoringCaliber": catalog_option["caliberId"],
                    "scoringGaugeDiameterInches": catalog_option["diameterInches"],
                },
            },
            store,
            resolver=resolver,
        )
        assert catalog_result["scoring"]["observationCount"] == 1
    first_crosshair = next(region for region in contract["components"]["geometry"]["definition"]["regions"] if region["regionId"] == "station_01_crosshair")
    seven_at_one_station = [
        {"xNorm": first_crosshair["cx"], "yNorm": first_crosshair["cy"], "assignedStationRegionId": "station_01_square"}
        for _ in range(5)
    ] + [
        {"xNorm": 0.99, "yNorm": 0.99, "assignedStationRegionId": "station_01_square"}
        for _ in range(2)
    ]
    unlimited_result = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {"imageEvidence": image_evidence(contract), "observations": seven_at_one_station, "scoringCaliber": "22"},
        },
        store,
        resolver=resolver,
    )
    assert unlimited_result["scoring"]["observationCount"] == 7
    assert unlimited_result["scoring"]["creditedObservationCount"] == 5
    assert unlimited_result["scoring"]["additionalObservationCount"] == 2
    assert unlimited_result["scoring"]["actualHitCount"] == 5
    assert unlimited_result["scoring"]["actualMissCount"] == 2
    assert unlimited_result["scoring"]["total"] == 25
    assert unlimited_result["sczn3Metrics"]["pointsPerTap"] == 25 / 7
    sixty_misses_with_one_overfull_station = [
        {"xNorm": 0.99, "yNorm": 0.99, "assignedStationRegionId": "station_01_square"}
        for _ in range(10)
    ] + [
        {"xNorm": 0.99, "yNorm": 0.99, "assignedStationRegionId": f"station_{station:02d}_square"}
        for station in range(2, 12)
        for _ in range(5)
    ]
    all_miss_best_five = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {
                "imageEvidence": image_evidence(contract),
                "observations": sixty_misses_with_one_overfull_station,
                "scoringCaliber": "22",
            },
        },
        store,
        resolver=resolver,
    )
    assert all_miss_best_five["scoring"]["observationCount"] == 60
    assert all_miss_best_five["scoring"]["creditedObservationCount"] == 55
    assert all_miss_best_five["scoring"]["additionalObservationCount"] == 5
    assert all_miss_best_five["scoring"]["actualHitCount"] == 0
    assert all_miss_best_five["scoring"]["actualMissCount"] == 60
    assert all_miss_best_five["scoring"]["total"] == 0
    assert all_miss_best_five["sczn3Metrics"]["pointsPerTap"] == 0
    assert [
        item["observationId"]
        for item in all_miss_best_five["classifications"]
        if item["creditedForScore"] is False
    ] == [f"observation-{number:03d}" for number in range(6, 11)]
    for partial_count in (1, 12, 35):
        partial = observations(contract)[:partial_count]
        partial_result = execute_authoritative_session(
            {
                "authoritativeSessionId": started["authoritativeSessionId"],
                "evidence": {"imageEvidence": image_evidence(contract), "observations": partial, "scoringCaliber": "22"},
            },
            store,
            resolver=resolver,
        )
        assert partial_result["scoring"]["observationCount"] == partial_count
        assert len(partial_result["classifications"]) == partial_count
    one_per_station = observations(contract)[::5]
    one_per_station_result = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {"imageEvidence": image_evidence(contract), "observations": one_per_station, "scoringCaliber": "22"},
        },
        store,
        resolver=resolver,
    )
    assert one_per_station_result["scoring"]["observationCount"] == 12
    assert {item["assignedStationRegionId"] for item in one_per_station_result["classifications"]} == {f"station_{index:02d}_square" for index in range(1, 13)}
    # Regression for Founder Sessions #017/#018: station identity is an
    # observation fact, not an array-position inference. Deliberately submit
    # Station 7 before Station 1 and retain caller-issued identities end to end.
    regions_by_id = {
        region["regionId"]: region
        for region in contract["components"]["geometry"]["definition"]["regions"]
    }
    station_order = (7, 1, 12, 2, 11, 3, 10, 4, 9, 5, 8, 6)
    identity_ordered_crosshairs = [
        {
            "observationId": f"stable-station-{station:02d}",
            "xNorm": regions_by_id[f"station_{station:02d}_crosshair"]["cx"],
            "yNorm": regions_by_id[f"station_{station:02d}_crosshair"]["cy"],
            "assignedStationRegionId": f"station_{station:02d}_square",
        }
        for station in station_order
    ]
    identity_result = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {"imageEvidence": image_evidence(contract), "observations": identity_ordered_crosshairs, "scoringCaliber": "22"},
        },
        store,
        resolver=resolver,
    )
    assert [item["observationId"] for item in identity_result["classifications"]] == [item["observationId"] for item in identity_ordered_crosshairs]
    for observation, classification in zip(identity_ordered_crosshairs, identity_result["classifications"]):
        station = int(observation["assignedStationRegionId"].split("_")[1])
        assert classification["assignedStationRegionId"] == observation["assignedStationRegionId"]
        assert classification["regionId"] == f"station_{station:02d}_crosshair"
        assert classification["countsAsHit"] is True
        assert classification["value"] == 5.0
    station_seven = next(item for item in identity_result["scoring"]["stationBestFive"] if item["stationRegionId"] == "station_07_square")
    assert station_seven == {
        "stationRegionId": "station_07_square",
        "totalObservations": 1,
        "creditedObservations": 1,
        "additionalObservations": 0,
        "actualHits": 1,
        "actualMisses": 0,
        "bestFiveScore": 5.0,
        "creditedObservationIds": ["stable-station-07"],
    }
    station_seven_miss = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {
                "imageEvidence": image_evidence(contract),
                "observations": [{
                    "observationId": "stable-station-07-miss",
                    "xNorm": 0.99,
                    "yNorm": 0.99,
                    "assignedStationRegionId": "station_07_square",
                }],
                "scoringCaliber": "22",
            },
        },
        store,
        resolver=resolver,
    )
    station_seven_miss_ledger = next(item for item in station_seven_miss["scoring"]["stationBestFive"] if item["stationRegionId"] == "station_07_square")
    assert station_seven_miss_ledger["totalObservations"] == 1
    assert station_seven_miss_ledger["actualHits"] == 0
    assert station_seven_miss_ledger["actualMisses"] == 1
    assert station_seven_miss_ledger["bestFiveScore"] == 0.0
    every_region_result = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {
                "imageEvidence": image_evidence(contract),
                "observations": every_region_observations(contract),
                "scoringCaliber": "22",
            },
        },
        store,
        resolver=resolver,
    )
    for station_number in range(1, 13):
        prefix = f"station_{station_number:02d}"
        station_id = f"{prefix}_square"
        station_rows = [
            item for item in every_region_result["classifications"]
            if item["assignedStationRegionId"] == station_id
        ]
        assert [item["regionId"] for item in station_rows] == [
            station_id,
            *(f"{prefix}_black_ring_{ring_number}" for ring_number in range(1, 5)),
            f"{prefix}_red_center",
            f"{prefix}_crosshair",
            "outside",
        ]
        assert sum(item["countsAsHit"] is True for item in station_rows) == 7
        assert sum(item["countsAsHit"] is False for item in station_rows) == 1
    switched = [observations(contract)[5], observations(contract)[0], observations(contract)[6], observations(contract)[1]]
    switched_result = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {"imageEvidence": image_evidence(contract), "observations": switched, "scoringCaliber": "22"},
        },
        store,
        resolver=resolver,
    )
    assert [item["assignedStationRegionId"] for item in switched_result["classifications"]] == ["station_02_square", "station_01_square", "station_02_square", "station_01_square"]
    result = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {"imageEvidence": image_evidence(contract), "observations": observations(contract)},
        },
        store,
        resolver=resolver,
    )
    assert result["status"] == "complete"
    assert result["scoring"]["observationCount"] == 60
    assert result["scoring"]["total"] == 300
    assert result["sczn3Metrics"]["pointsPerTap"] == 5
    assert len(result["classifications"]) == 60
    assert all(item["value"] == 5 for item in result["classifications"])
    assert all(item["assignedStationRegionId"] == f"station_{(index // 5) + 1:02d}_square" for index, item in enumerate(result["classifications"]))
    more_than_sixty = observations(contract) + [
        {"xNorm": first_crosshair["cx"], "yNorm": first_crosshair["cy"], "assignedStationRegionId": "station_01_square"}
        for _ in range(6)
    ]
    over_sixty_result = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {"imageEvidence": image_evidence(contract), "observations": more_than_sixty, "scoringCaliber": "22"},
        },
        store,
        resolver=resolver,
    )
    assert over_sixty_result["scoring"]["observationCount"] == 66
    assert over_sixty_result["scoring"]["creditedObservationCount"] == 60
    assert over_sixty_result["scoring"]["additionalObservationCount"] == 6
    assert over_sixty_result["scoring"]["total"] == 300
    assert over_sixty_result["sczn3Metrics"]["pointsPerTap"] == 300 / 66
    assert all(item["creditedForScore"] is False for item in over_sixty_result["classifications"][60:])
    miss_observations = observations(contract)
    miss_observations[5] = {
        "xNorm": 0.99,
        "yNorm": 0.99,
        "assignedStationRegionId": "station_02_square",
    }
    assigned_station_miss = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {
                "imageEvidence": image_evidence(contract),
                "observations": miss_observations,
            },
        },
        store,
        resolver=resolver,
    )
    assert assigned_station_miss["classifications"][5]["assignedStationRegionId"] == "station_02_square"
    assert assigned_station_miss["classifications"][5]["regionId"] == "outside"
    assert assigned_station_miss["classifications"][5]["value"] == 0.0
    mixed_result = execute_authoritative_session(
        {
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {
                "imageEvidence": image_evidence(contract),
                "observations": mixed_observations(contract),
                "scoringCaliber": "22",
            },
        },
        store,
        resolver=resolver,
    )
    assert mixed_result["scoring"]["observationCount"] == 60
    assert len(mixed_result["classifications"]) == 60
    assert [item["observationId"] for item in mixed_result["classifications"]] == [
        f"stable-{station_number:02d}-{point_number:02d}"
        for station_number in range(1, 13)
        for point_number in range(1, 6)
    ]
    assert [item["value"] for item in mixed_result["classifications"][:5]] == [5.0, 4.0, 3.0, 3.0, 0.0]
    assert all(item["value"] == 0.0 for item in mixed_result["classifications"][4::5])
    assert not any(item["classificationStatus"] == "ambiguous" for item in mixed_result["classifications"])
    if target_id == "baker_tst12_17_5x23":
        ambiguity_replay = execute_authoritative_session(
            {
                "authoritativeSessionId": started["authoritativeSessionId"],
                "evidence": {
                    "imageEvidence": image_evidence(contract),
                    "observations": formerly_ambiguous_observations(contract),
                    "scoringCaliber": "22",
                },
            },
            store,
            resolver=resolver,
        )
        first = ambiguity_replay["classifications"][0]
        assert first["value"] == 3.0
        assert first["classificationResolution"] == "equivalent_governed_outcome"
        assert {"station_01_black_ring_1", "station_01_black_ring_2"}.issubset(first["matchingRegionIds"])
    try:
        execute_authoritative_session(
            {
                "authoritativeSessionId": started["authoritativeSessionId"],
                "evidence": {
                    "imageEvidence": image_evidence(contract),
                    "observations": observations(contract),
                    "scoringCaliber": "50",
                },
            },
            store,
            resolver=resolver,
        )
        raise AssertionError("TST-12 accepted an unauthorized caliber")
    except ExecutionAuthorityError as exc:
        assert exc.payload["reason"] == "scoring_caliber_not_authorized"
    session = {
        "sessionId": started["authoritativeSessionId"],
        "authoritativeSessionId": started["authoritativeSessionId"],
        "sessionIdAuthority": "backend",
        "matrixSnapshot": {
            "targetProfileId": target_id,
            "missionFamily": "targetScoring",
            "resultPackageType": "targetScoreResult",
            "experienceMode": experience_mode,
            "practiceDistanceLabel": "",
        },
        "authorityPackage": mixed_result,
        "targetEvidenceImage": deepcopy(image_evidence(contract)),
        "savedToSEC": False,
    }
    saved = preserve_sec({"session": session}, store, now=NOW, execution_contract_resolver=resolver)
    reopened = read_preserved_sec(started["authoritativeSessionId"], store)
    assert saved["artifactSha256"] == reopened["artifactSha256"]
    assert reopened["session"]["matrixSnapshot"]["experienceMode"] == experience_mode
    assert reopened["session"]["authorityPackage"] == mixed_result


if __name__ == "__main__":
    for target, mode in (
        ("baker_tst12_17_5x23", "simulation"),
        ("baker_tst12_17_5x23", "actual"),
        ("baker_tst12_23x35", "simulation"),
    ):
        verify(target, mode)
        print(f"PASS {target} {mode} RESULT -> SEC -> Vault -> exact reopen")
