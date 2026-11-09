#!/usr/bin/env python3
"""Prove TST-12 scoring aggregates are independent of tap sequence."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from execution_authority import execute_authoritative_session
from session_authority import prepare_session, start_session
from target_execution_contract import TargetExecutionContractResolver
from test_baker_tst12_universal_lifecycle import image_evidence
from test_target_execution_scale_architecture import MemoryStore


BACKEND = Path(__file__).resolve().parent
NOW = datetime(2026, 11, 9, 12, 0, tzinfo=timezone.utc)
TARGETS = ("baker_tst12_17_5x23", "baker_tst12_23x35")


def start(store, resolver, target_id, key):
    prepared = prepare_session(
        {"targetId": target_id, "missionFamily": "targetScoring"},
        store,
        now=NOW,
        execution_contract_resolver=resolver,
    )
    return start_session(
        {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
        store,
        idempotency_key=key,
        now=NOW,
        execution_contract_resolver=resolver,
    )


def governed_observations(contract):
    regions = {
        region["regionId"]: region
        for region in contract["components"]["geometry"]["definition"]["regions"]
    }
    square = regions["station_01_square"]
    ring = regions["station_01_black_ring_1"]
    red = regions["station_01_red_center"]
    crosshair = regions["station_01_crosshair"]
    station = "station_01_square"
    return {
        "crosshair-5": {"observationId": "crosshair-5", "xNorm": crosshair["cx"], "yNorm": crosshair["cy"], "assignedStationRegionId": station},
        "red-4": {"observationId": "red-4", "xNorm": red["cx"] + red["radiusX"] * 0.7, "yNorm": red["cy"], "assignedStationRegionId": station},
        "ring-3": {"observationId": "ring-3", "xNorm": ring["cx"] + (ring["innerRadiusX"] + ring["outerRadiusX"]) / 2, "yNorm": ring["cy"], "assignedStationRegionId": station},
        "square-2-a": {"observationId": "square-2-a", "xNorm": square["xMin"] + 0.02, "yNorm": square["yMin"] + 0.02, "assignedStationRegionId": station},
        "square-2-b": {"observationId": "square-2-b", "xNorm": square["xMax"] - 0.02, "yNorm": square["yMin"] + 0.02, "assignedStationRegionId": station},
        "square-2-c": {"observationId": "square-2-c", "xNorm": square["xMin"] + 0.02, "yNorm": square["yMax"] - 0.02, "assignedStationRegionId": station},
        "miss-0": {"observationId": "miss-0", "xNorm": 0.99, "yNorm": 0.99, "assignedStationRegionId": station},
    }


def comparable(result):
    scoring = result["scoring"]
    station = scoring["stationBestFive"][0]
    return {
        "totalPoints": scoring["total"],
        "hits": scoring["actualHitCount"],
        "misses": scoring["actualMissCount"],
        "selected": scoring["creditedObservationCount"],
        "additional": scoring["additionalObservationCount"],
        "pointsPerTap": result["sczn3Metrics"]["pointsPerTap"],
        "station": {
            key: value
            for key, value in station.items()
            if key != "creditedObservationIds"
        },
    }


def verify(target_id):
    contract = json.loads((BACKEND / "target_execution_contracts" / "contracts" / f"{target_id}_target_scoring_v1.json").read_text(encoding="utf-8"))
    resolver = TargetExecutionContractResolver((contract,))
    store = MemoryStore()
    sessions = [
        start(store, resolver, target_id, f"tap-order-{target_id}-a"),
        start(store, resolver, target_id, f"tap-order-{target_id}-b"),
    ]
    assert sessions[0]["authoritativeSessionId"] != sessions[1]["authoritativeSessionId"]

    evidence = governed_observations(contract)
    orders = [
        ["crosshair-5", "red-4", "ring-3", "square-2-a", "square-2-b", "square-2-c", "miss-0"],
        ["miss-0", "square-2-c", "square-2-b", "crosshair-5", "square-2-a", "ring-3", "red-4"],
    ]
    results = []
    for session, order in zip(sessions, orders):
        observations = [evidence[identity] for identity in order]
        result = execute_authoritative_session(
            {
                "authoritativeSessionId": session["authoritativeSessionId"],
                "evidence": {
                    "imageEvidence": image_evidence(contract),
                    "observations": observations,
                    "scoringCaliber": ".22 LR",
                },
            },
            store,
            resolver=resolver,
        )
        assert [row["observationId"] for row in result["classifications"]] == order
        assert [row["value"] for row in result["classifications"]].count(2.0) == 3
        results.append(result)

    assert comparable(results[0]) == comparable(results[1]) == {
        "totalPoints": 16.0,
        "hits": 6,
        "misses": 1,
        "selected": 5,
        "additional": 2,
        "pointsPerTap": 16 / 7,
        "station": {
            "stationRegionId": "station_01_square",
            "totalObservations": 7,
            "creditedObservations": 5,
            "additionalObservations": 2,
            "actualHits": 6,
            "actualMisses": 1,
            "bestFiveScore": 16.0,
        },
    }
    for result in results:
        credited_twos = [
            row for row in result["classifications"]
            if row["value"] == 2.0 and row["creditedForScore"] is True
        ]
        assert len(credited_twos) == 2

    print(
        f"PASS {target_id}: independent sessions retained opposite tap sequences; "
        "7 taps, tied fifth-selection boundary, 16 points, 6 hits, 1 miss, 5 selected, 2 additional, PPT 16/7"
    )


if __name__ == "__main__":
    for target in TARGETS:
        verify(target)
