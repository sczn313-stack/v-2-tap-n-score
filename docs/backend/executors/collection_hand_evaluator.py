"""Bounded publisher-defined collection/hand evaluator.

This owner evaluates only exact Profile-declared collection members and hand
patterns. It is not a path, board, deck, casino, poker, or generic game engine.
"""
from __future__ import annotations

from collections import Counter
from copy import deepcopy
from typing import Any, Dict, Mapping, Optional

from stage_event_primitives import admitted_image, contains, coordinate, sign_result, text
from target_execution_contract import canonical_json, digest


class CollectionHandError(ValueError):
    pass


PLAYER_MODES = {"solo", "alternating_players"}
DUPLICATE_POLICIES = {"allow_repeated_member", "count_once", "reject_duplicate"}
INVALID_POLICIES = {"record_without_collection_member", "reject_turn"}
TERMINAL_STATES = {"complete", "stopped_incomplete"}


def _profile(contract: Mapping[str, Any]) -> Dict[str, Any]:
    profile = deepcopy(contract["components"]["mission"]["definition"])
    required = ("profileId", "profileVersion", "publisherAuthority", "sourceDocuments", "approval", "effective", "lifecycle", "componentBindings", "claimGrade", "playerPolicy", "collectionPolicy", "memberMap", "handPatterns", "capabilityStates")
    if any(field not in profile for field in required):
        raise CollectionHandError("collection_hand_profile_incomplete")
    if profile.get("missionFamily") != "collectionHandEvaluation" or profile.get("resultPackageType") != "collectionHandResult" or text(profile.get("resultPackageVersion")) != "1" or profile.get("claimGrade") != "publisher_collection_hand_result":
        raise CollectionHandError("collection_hand_profile_binding_invalid")
    lifecycle, approval = profile["lifecycle"], profile["approval"]
    if not isinstance(lifecycle, Mapping) or lifecycle.get("status") != "active" or lifecycle.get("suspended") is not False or lifecycle.get("revoked") is not False or not isinstance(approval, Mapping) or approval.get("status") != "approved" or not text(approval.get("authorityId")):
        raise CollectionHandError("collection_hand_profile_authority_inactive")
    bindings = profile["componentBindings"]
    if not isinstance(bindings, Mapping) or bindings.get("targetProfileId") != contract["targetProfile"]["id"] or text(bindings.get("targetProfileVersion")) != text(contract["targetProfile"]["version"]) or bindings.get("registrationDigest") != contract["components"]["registration"]["digest"] or bindings.get("geometryDigest") != contract["components"]["geometry"]["digest"]:
        raise CollectionHandError("collection_hand_component_binding_invalid")
    documents = profile["sourceDocuments"]
    if not isinstance(documents, list) or not documents or any(not isinstance(item, Mapping) or not text(item.get("reference")) or len(text(item.get("sha256"))) != 64 for item in documents):
        raise CollectionHandError("collection_hand_source_authority_invalid")

    players = profile["playerPolicy"]
    if not isinstance(players, Mapping) or players.get("mode") not in PLAYER_MODES or not isinstance(players.get("minimumPlayers"), int) or not isinstance(players.get("maximumPlayers"), int) or not 1 <= players["minimumPlayers"] <= players["maximumPlayers"] <= 8:
        raise CollectionHandError("collection_hand_player_policy_invalid")
    if players["mode"] == "solo" and (players["minimumPlayers"] != 1 or players["maximumPlayers"] != 1):
        raise CollectionHandError("collection_hand_solo_policy_invalid")

    collection = profile["collectionPolicy"]
    if not isinstance(collection, Mapping) or not isinstance(collection.get("handSize"), int) or not 1 <= collection["handSize"] <= 50 or collection.get("observationsPerTurn") != 1 or collection.get("duplicatePolicy") not in DUPLICATE_POLICIES or collection.get("invalidObservationPolicy") not in INVALID_POLICIES or collection.get("terminalPolicy") != "fixed_turns_per_player":
        raise CollectionHandError("collection_hand_collection_policy_invalid")

    geometry_ids = {text(item.get("entityId")) for item in contract["components"]["geometry"]["definition"].get("entities", []) if isinstance(item, Mapping)}
    members, member_ids, mapped_geometry = profile["memberMap"], set(), set()
    if not isinstance(members, list) or not members:
        raise CollectionHandError("collection_hand_member_map_required")
    for member in members:
        if not isinstance(member, Mapping) or not text(member.get("collectionMemberId")) or not text(member.get("geometryEntityId")) or not text(member.get("publisherLabel")) or not text(member.get("sourceReference")):
            raise CollectionHandError("collection_hand_member_invalid")
        if member["collectionMemberId"] in member_ids or member["geometryEntityId"] in mapped_geometry or member["geometryEntityId"] not in geometry_ids:
            raise CollectionHandError("collection_hand_member_mapping_invalid")
        member_ids.add(member["collectionMemberId"]); mapped_geometry.add(member["geometryEntityId"])

    patterns, pattern_ids = profile["handPatterns"], set()
    if not isinstance(patterns, list) or not patterns:
        raise CollectionHandError("collection_hand_patterns_required")
    for pattern in patterns:
        required_members = pattern.get("requiredMemberIds") if isinstance(pattern, Mapping) else None
        if not isinstance(pattern, Mapping) or not text(pattern.get("handClassId")) or not text(pattern.get("publisherLabel")) or not isinstance(pattern.get("precedence"), int) or not isinstance(required_members, list) or len(required_members) != collection["handSize"] or any(member not in member_ids for member in required_members) or not text(pattern.get("sourceReference")):
            raise CollectionHandError("collection_hand_pattern_invalid")
        if pattern["handClassId"] in pattern_ids:
            raise CollectionHandError("collection_hand_pattern_duplicate")
        pattern_ids.add(pattern["handClassId"])
    if len({item["precedence"] for item in patterns}) != len(patterns):
        raise CollectionHandError("collection_hand_pattern_precedence_duplicate")
    if contract["components"]["scoring"]["definition"].get("status") != "not_applicable":
        raise CollectionHandError("collection_hand_scoring_must_be_not_applicable")
    return profile


def _classify(contract: Mapping[str, Any], profile: Mapping[str, Any], observation: Mapping[str, Any], observation_id: str) -> Dict[str, Any]:
    x = coordinate(observation.get("xNorm"), "collection_hand_observation_x_invalid", CollectionHandError)
    y = coordinate(observation.get("yNorm"), "collection_hand_observation_y_invalid", CollectionHandError)
    matches = [entity for entity in contract["components"]["geometry"]["definition"].get("entities", []) if contains(entity, x, y, "collection_hand_geometry_shape_not_supported", CollectionHandError)]
    status = "matched" if len(matches) == 1 else ("ambiguous" if len(matches) > 1 else "unresolved")
    entity_id = text(matches[0].get("entityId")) if len(matches) == 1 else None
    member = next((item for item in profile["memberMap"] if item["geometryEntityId"] == entity_id), None)
    if status == "matched" and member is None: status = "unresolved"
    return {"observationId": observation_id, "xNorm": x, "yNorm": y, "classificationStatus": status, "geometryEntityId": entity_id, "matchingEntityIds": [text(item.get("entityId")) for item in matches], "collectionMember": deepcopy(member) if status == "matched" else None, "evidenceMeaning": "shooter_recorded_visible_shot_observation"}


def _hand(profile: Mapping[str, Any], member_ids: list[str]) -> Dict[str, Any]:
    if len(member_ids) != profile["collectionPolicy"]["handSize"]:
        return {"status": "incomplete", "handClassId": None, "publisherLabel": None, "precedence": None}
    counts = Counter(member_ids)
    matching = [item for item in profile["handPatterns"] if Counter(item["requiredMemberIds"]) == counts]
    if len(matching) != 1:
        return {"status": "unclassified_collection", "handClassId": None, "publisherLabel": None, "precedence": None}
    pattern = matching[0]
    return {"status": "matched", "handClassId": pattern["handClassId"], "publisherLabel": pattern["publisherLabel"], "precedence": pattern["precedence"], "sourceReference": pattern["sourceReference"]}


def _result(contract: Mapping[str, Any], state: Mapping[str, Any], session_id: str) -> Dict[str, Any]:
    profile = state["profile"]
    players = []
    for player in state["players"]:
        member_ids = [item["collectionMemberId"] for item in player["collection"]]
        players.append({**deepcopy(player), "hand": _hand(profile, member_ids)})
    comparison = {"status": "not_applicable", "winnerPlayerId": None, "tiedPlayerIds": []}
    if profile["playerPolicy"]["mode"] == "alternating_players" and state["terminalStatus"] == "complete":
        classified = [item for item in players if item["hand"]["status"] == "matched"]
        if classified:
            best = max(item["hand"]["precedence"] for item in classified)
            winners = [item["playerId"] for item in classified if item["hand"]["precedence"] == best]
            comparison = {"status": "winner" if len(winners) == 1 else "tie", "winnerPlayerId": winners[0] if len(winners) == 1 else None, "tiedPlayerIds": winners if len(winners) > 1 else []}
        else: comparison = {"status": "unclassified", "winnerPlayerId": None, "tiedPlayerIds": []}
    observations = [deepcopy(item) for turn in state["turns"] for item in turn["observations"]]
    counts = Counter(item["disposition"] for item in observations)
    result = {
        "ok": True, "status": state["terminalStatus"], "authoritySource": "backend-authoritative", "authoritativeSessionId": session_id,
        "missionFamily": contract["missionFamily"], "resultPackageType": contract["resultPackageType"], "resultPackageVersion": contract["resultPackageVersion"], "target": deepcopy(contract["targetProfile"]),
        "executionContract": {"contractId": contract["contractId"], "contractVersion": contract["contractVersion"], "contractFingerprint": contract["contractFingerprint"], "executorId": contract["executor"]["id"], "executorVersion": contract["executor"]["version"], "secAdapterFamilyId": contract["secAdapter"]["id"], "secAdapterFamilyVersion": contract["secAdapter"]["version"], "preservationValidatorId": contract["preservationValidator"]["id"], "preservationValidatorVersion": contract["preservationValidator"]["version"]},
        "profile": {"profileId": profile["profileId"], "profileVersion": profile["profileVersion"], "componentDigest": contract["components"]["mission"]["digest"], "sourceDocuments": deepcopy(profile["sourceDocuments"])},
        "run": {"terminalStatus": state["terminalStatus"], "playerMode": profile["playerPolicy"]["mode"], "playerCount": len(players), "completedTurnCount": len(state["turns"]), "plannedTurnCount": len(players) * profile["collectionPolicy"]["handSize"]},
        "turns": deepcopy(state["turns"]), "observations": observations, "players": players, "comparison": comparison, "imageEvidence": deepcopy(state["imageEvidence"]),
        "claim": {"claimGrade": "publisher_collection_hand_result", "displayLabel": "Publisher-Defined Collection/Hand Result — Not a General Game Judgment", "generalGameJudgmentStatus": "not_established", "conventionalPokerMeaningStatus": "not_established", "gamblingStatus": "not_applicable", "skillStatus": "not_established"},
        "reconciliation": {"status": "reconciled", "turnCount": len(state["turns"]), "observationCount": len(observations), "acceptedMemberCount": counts["accepted"], "duplicateIgnoredCount": counts["duplicate_ignored"], "ambiguousCount": counts["ambiguous"], "unresolvedCount": counts["unresolved"]},
        "scoring": {"status": "not_applicable", "reason": "collection_hand_result_is_not_an_independent_score"},
        "timing": {"physicalShotTiming": {"status": "unavailable", "reason": "manual_observations_do_not_establish_physical_shot_timing"}},
        "capabilityStates": deepcopy(profile["capabilityStates"]),
        "authorityTrace": {"targetExecutionContract": f"{contract['contractId']}@{contract['contractVersion']}", "resultAuthority": "backend", "collectionHandProfileAuthority": profile["approval"]["authorityId"], "stageEventAuthority": "backend", "componentDigests": {name: component["digest"] for name, component in contract["components"].items()}},
    }
    return sign_result(result)


def _public_state(state: Mapping[str, Any]) -> Dict[str, Any]:
    profile = state["profile"]
    cursor = len(state["turns"])
    active = state["players"][cursor % len(state["players"])] if not state.get("terminalStatus") else None
    return {"status": state.get("terminalStatus") or "in_progress", "playerMode": profile["playerPolicy"]["mode"], "activePlayerId": active["playerId"] if active else None, "completedTurnCount": cursor, "plannedTurnCount": len(state["players"]) * profile["collectionPolicy"]["handSize"], "players": [{"playerId": item["playerId"], "label": item["label"], "collectionCount": len(item["collection"])} for item in state["players"]]}


def transition(contract: Mapping[str, Any], current_state: Optional[Mapping[str, Any]], action: Mapping[str, Any]) -> Dict[str, Any]:
    profile, action_type = _profile(contract), text(action.get("type"))
    session_id, received_at = text(action.get("authoritativeSessionId")), text(action.get("backendReceivedAt"))
    if not session_id: raise CollectionHandError("authoritative_session_id_required")
    if current_state is None:
        if action_type != "start_run": raise CollectionHandError("collection_hand_start_required")
        count = action.get("playerCount", 1)
        policy = profile["playerPolicy"]
        if not isinstance(count, int) or not policy["minimumPlayers"] <= count <= policy["maximumPlayers"]: raise CollectionHandError("collection_hand_player_count_invalid")
        labels = action.get("playerLabels") or []
        if labels and (not isinstance(labels, list) or len(labels) != count or any(not text(label) for label in labels)): raise CollectionHandError("collection_hand_player_labels_invalid")
        players = [{"playerId": f"player-{index + 1}", "label": text(labels[index]) if labels else f"Player {index + 1}", "collection": []} for index in range(count)]
        state = {"contractFingerprint": contract["contractFingerprint"], "profile": profile, "imageEvidence": admitted_image(action.get("imageEvidence"), "registered_collection_hand_session_evidence", CollectionHandError), "players": players, "turns": [], "terminalStatus": None, "startedAt": received_at}
        return {"state": state, "event": {"type": action_type}, "response": {"ok": True, "status": "in_progress", "runState": _public_state(state)}}
    state = deepcopy(dict(current_state))
    if state.get("terminalStatus"): raise CollectionHandError("collection_hand_run_terminal")
    if state.get("contractFingerprint") != contract["contractFingerprint"]: raise CollectionHandError("collection_hand_contract_mismatch")
    if action_type == "record_turn_observation":
        observations = action.get("observations")
        if not isinstance(observations, list) or len(observations) != profile["collectionPolicy"]["observationsPerTurn"]: raise CollectionHandError("collection_hand_turn_observation_count_invalid")
        cursor = len(state["turns"]); player = state["players"][cursor % len(state["players"])]
        if action.get("playerId") is not None and text(action.get("playerId")) != player["playerId"]: raise CollectionHandError("collection_hand_turn_order_invalid")
        classified = _classify(contract, profile, observations[0], f"observation-{cursor + 1:03d}")
        member = classified.get("collectionMember"); disposition = classified["classificationStatus"]
        if disposition == "matched":
            duplicate = any(item["collectionMemberId"] == member["collectionMemberId"] for item in player["collection"])
            duplicate_policy = profile["collectionPolicy"]["duplicatePolicy"]
            if duplicate and duplicate_policy == "reject_duplicate": raise CollectionHandError("collection_hand_duplicate_member_rejected")
            if duplicate and duplicate_policy == "count_once": disposition = "duplicate_ignored"
            else: player["collection"].append(deepcopy(member)); disposition = "accepted"
        elif profile["collectionPolicy"]["invalidObservationPolicy"] == "reject_turn": raise CollectionHandError(f"collection_hand_{disposition}_observation_rejected")
        classified["disposition"] = disposition
        state["turns"].append({"turnNumber": cursor + 1, "playerId": player["playerId"], "recordedAt": received_at, "observations": [classified]})
        if len(state["turns"]) >= len(state["players"]) * profile["collectionPolicy"]["handSize"]: state["terminalStatus"] = "complete"
        response = {"ok": True, "status": state.get("terminalStatus") or "in_progress", "runState": _public_state(state)}
        if state.get("terminalStatus"): response["result"] = _result(contract, state, session_id)
    elif action_type == "stop_run":
        state["terminalStatus"] = "stopped_incomplete"
        response = {"ok": True, "status": "stopped_incomplete", "runState": _public_state(state), "result": _result(contract, state, session_id)}
    else: raise CollectionHandError("collection_hand_action_invalid")
    return {"state": state, "event": {"type": action_type, "turnNumber": len(state["turns"])}, "response": response}


def execute(contract: Mapping[str, Any], evidence: Any) -> Dict[str, Any]:
    raise CollectionHandError("collection_hand_requires_session_bound_action_execution")


def validate_result(contract: Mapping[str, Any], result: Any) -> bool:
    if not isinstance(result, Mapping): return False
    try: profile = _profile(contract)
    except CollectionHandError: return False
    canonical = {key: value for key, value in result.items() if key not in {"resultHash", "resultIdentity"}}
    valid_hash = result.get("resultHash") == digest(canonical_json(canonical)) and result.get("resultIdentity") == f"SCZN3-RESULT-{result.get('resultHash', '')[:24].upper()}"
    turns, observations, players, recon = result.get("turns"), result.get("observations"), result.get("players"), result.get("reconciliation")
    if not isinstance(turns, list) or not isinstance(observations, list) or not isinstance(players, list) or not isinstance(recon, Mapping): return False
    dispositions = Counter(item.get("disposition") for item in observations)
    return bool(valid_hash and result.get("ok") is True and result.get("status") in TERMINAL_STATES and result.get("authoritySource") == "backend-authoritative" and result.get("missionFamily") == contract["missionFamily"] and result.get("resultPackageType") == contract["resultPackageType"] and result.get("resultPackageVersion") == "1" and result.get("executionContract", {}).get("contractFingerprint") == contract["contractFingerprint"] and result.get("target", {}).get("id") == contract["targetProfile"]["id"] and result.get("profile", {}).get("profileId") == profile["profileId"] and result.get("profile", {}).get("componentDigest") == contract["components"]["mission"]["digest"] and result.get("run", {}).get("terminalStatus") == result.get("status") and recon.get("status") == "reconciled" and recon.get("turnCount") == len(turns) and recon.get("observationCount") == len(observations) == len(turns) and recon.get("acceptedMemberCount") == dispositions["accepted"] and recon.get("duplicateIgnoredCount") == dispositions["duplicate_ignored"] and recon.get("ambiguousCount") == dispositions["ambiguous"] and recon.get("unresolvedCount") == dispositions["unresolved"] and result.get("claim", {}).get("claimGrade") == "publisher_collection_hand_result" and result.get("claim", {}).get("generalGameJudgmentStatus") == "not_established" and result.get("claim", {}).get("conventionalPokerMeaningStatus") == "not_established" and result.get("scoring", {}).get("status") == "not_applicable" and result.get("timing", {}).get("physicalShotTiming", {}).get("status") == "unavailable")
