"""Bounded reusable recreational-challenge executor."""
from __future__ import annotations

from collections import defaultdict
from copy import deepcopy
from math import hypot
from typing import Any, Mapping

from target_execution_contract import canonical_json, digest


class RecreationalChallengeError(ValueError):
    pass


def _contains(entity: Mapping[str, Any], x: float, y: float) -> bool:
    if entity.get("shape") == "circle":
        return hypot(x - float(entity["cx"]), y - float(entity["cy"])) <= float(entity["radius"])
    if entity.get("shape") == "rectangle":
        return float(entity["xMin"]) <= x <= float(entity["xMax"]) and float(entity["yMin"]) <= y <= float(entity["yMax"])
    raise RecreationalChallengeError("challenge_geometry_shape_not_supported")


def execute(contract: Mapping[str, Any], evidence: Any) -> dict[str, Any]:
    if not isinstance(evidence, Mapping) or not isinstance(evidence.get("events"), list):
        raise RecreationalChallengeError("challenge_events_required")
    mission = contract["components"]["mission"]["definition"]
    players = mission.get("players")
    entities = contract["components"]["geometry"]["definition"].get("entities")
    if not isinstance(players, list) or len(players) < 1 or not isinstance(entities, list) or not entities:
        raise RecreationalChallengeError("challenge_authority_incomplete")
    player_ids = [str(player["playerId"]) for player in players]
    hits = defaultdict(int)
    classified = []
    for index, event in enumerate(evidence["events"]):
        if not isinstance(event, Mapping):
            raise RecreationalChallengeError("challenge_event_invalid")
        player_id = str(event.get("playerId") or "")
        if player_id not in player_ids:
            raise RecreationalChallengeError("challenge_player_invalid")
        if mission.get("alternateTurns") is True and player_id != player_ids[index % len(player_ids)]:
            raise RecreationalChallengeError("challenge_turn_order_invalid")
        try:
            x, y = float(event.get("xNorm")), float(event.get("yNorm"))
        except (TypeError, ValueError) as exc:
            raise RecreationalChallengeError("challenge_coordinate_invalid") from exc
        if not 0 <= x <= 1 or not 0 <= y <= 1:
            raise RecreationalChallengeError("challenge_coordinate_out_of_bounds")
        matches = [entity for entity in entities if _contains(entity, x, y)]
        if len(matches) > 1:
            raise RecreationalChallengeError("challenge_classification_ambiguous")
        entity_id = str(matches[0]["entityId"]) if matches else None
        if entity_id:
            hits[entity_id] += 1
        classified.append({"eventId": f"event-{index + 1:03d}", "playerId": player_id, "xNorm": x, "yNorm": y, "entityId": entity_id, "outcome": "hit" if entity_id else "miss"})
    entity_state = [{"entityId": str(entity["entityId"]), "sideId": str(entity.get("sideId") or ""), "hits": hits[str(entity["entityId"])], "requiredHits": int(entity.get("requiredHits", 1)), "complete": hits[str(entity["entityId"])] >= int(entity.get("requiredHits", 1))} for entity in entities]
    winner = None
    if mission.get("terminalCondition") == "all_opposing_entities_complete":
        for player in players:
            opposing = [state for state in entity_state if state["sideId"] != str(player.get("sideId") or "")]
            if opposing and all(state["complete"] for state in opposing):
                winner = str(player["playerId"])
                break
    result = {
        "ok": True, "status": "complete", "authoritySource": "backend-authoritative",
        "missionFamily": contract["missionFamily"], "resultPackageType": contract["resultPackageType"], "resultPackageVersion": contract["resultPackageVersion"],
        "target": deepcopy(contract["targetProfile"]),
        "executionContract": {"contractId": contract["contractId"], "contractVersion": contract["contractVersion"], "contractFingerprint": contract["contractFingerprint"], "executorId": contract["executor"]["id"], "executorVersion": contract["executor"]["version"], "secAdapterFamilyId": contract["secAdapter"]["id"], "secAdapterFamilyVersion": contract["secAdapter"]["version"], "preservationValidatorId": contract["preservationValidator"]["id"], "preservationValidatorVersion": contract["preservationValidator"]["version"]},
        "events": classified, "entityState": entity_state,
        "challenge": {"status": "complete" if winner else "in_progress", "winnerPlayerId": winner},
        "reconciliation": {"status": "reconciled", "recordedEventCount": len(classified), "evidenceObservationCount": len(classified)},
        "authorityTrace": {"targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}", "classificationAuthority": "backend", "missionAuthority": "backend"},
    }
    result["resultHash"] = digest(canonical_json(result))
    return result


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    return bool(isinstance(result, Mapping) and result.get("authoritySource") == "backend-authoritative" and result.get("resultPackageVersion") == contract["resultPackageVersion"] and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"] and result.get("reconciliation", {}).get("status") == "reconciled" and result.get("challenge", {}).get("status") in {"in_progress", "complete"})
