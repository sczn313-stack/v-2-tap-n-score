"""Three synthetic authority-complete Collection/Hand Profiles."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

from target_execution_contract import component_digest


FIXTURE_TARGET_IDS = ("fixture_collection_solo", "fixture_collection_multiplayer", "fixture_collection_data_only")
ASSET_SHA256 = "cb906e88e090b787369acb6d6ad2900b0f2c46d07507fd2175b90f5a387a5ee0"


def _component(component_id: str, definition: Dict[str, Any]) -> Dict[str, Any]:
    component = {"id": component_id, "version": "1", "status": "approved", "digest": "", "definition": deepcopy(definition)}
    component["digest"] = component_digest(component); return component


def _contract(target_id: str, name: str, sku: str, mode: str, hand_size: int, patterns: list[dict], duplicate_policy: str = "allow_repeated_member") -> Dict[str, Any]:
    entities = [
        {"entityId": "member-a-region", "shape": "rectangle", "xMin": .05, "xMax": .3, "yMin": .1, "yMax": .9, "priority": 10},
        {"entityId": "member-b-region", "shape": "rectangle", "xMin": .35, "xMax": .6, "yMin": .1, "yMax": .9, "priority": 10},
        {"entityId": "member-c-region", "shape": "rectangle", "xMin": .65, "xMax": .9, "yMin": .1, "yMax": .9, "priority": 10},
    ]
    geometry = _component(f"{target_id}-geometry", {"status": "ugo_collection_member_geometry", "coordinateSystem": "normalized_source_image_top_left", "entities": entities, "physicalMeasurement": "unavailable"})
    registration = _component(f"{target_id}-registration", {"role": "evidence_capture_asset", "assetPath": "backend/test_fixtures/target_execution_scale.svg", "assetSha256": ASSET_SHA256, "assetAlt": name, "coordinateConvention": "normalized_source_image_top_left"})
    scoring = _component(f"{target_id}-scoring", {"status": "not_applicable", "reason": "collection_hand_result_is_not_independent_scoring"})
    reference = f"synthetic://collection-hand/{sku.lower()}"
    members = [{"collectionMemberId": key, "geometryEntityId": f"member-{key[-1]}-region", "publisherLabel": f"Publisher Member {key[-1].upper()}", "attributes": {"publisherCategoryId": key}, "sourceReference": reference} for key in ("member-a", "member-b", "member-c")]
    capabilities = {"publisherCollectionHandResult": {"status": "available"}, "pathState": {"status": "unavailable"}, "boardGame": {"status": "unavailable"}, "deckGame": {"status": "unavailable"}, "casinoValue": {"status": "unavailable"}, "generalGameJudgment": {"status": "unavailable"}, "physicalShotTiming": {"status": "unavailable"}, "scoring": {"status": "not_applicable"}}
    profile = {
        "missionFamily": "collectionHandEvaluation", "resultPackageType": "collectionHandResult", "resultPackageVersion": "1",
        "profileId": f"collection-hand-{sku.lower()}-v1", "profileVersion": "1", "publisherAuthority": {"id": "synthetic-collection-publisher", "name": "Synthetic Collection Publisher"},
        "sourceDocuments": [{"id": f"source-{sku.lower()}", "title": f"{name} synthetic rules", "revision": "2026.1", "reference": reference, "effectiveFrom": "2026-08-19T00:00:00-04:00", "sha256": "c" * 64}],
        "approval": {"status": "approved", "authorityId": "COLLECTION-HAND-SYNTHETIC-AUTHORITY"}, "effective": {"from": "2026-08-19T00:00:00-04:00", "until": None}, "lifecycle": {"status": "active", "supersededBy": None, "suspended": False, "revoked": False},
        "componentBindings": {"targetProfileId": target_id, "targetProfileVersion": "1", "registrationDigest": registration["digest"], "geometryDigest": geometry["digest"]}, "claimGrade": "publisher_collection_hand_result",
        "playerPolicy": {"mode": mode, "minimumPlayers": 1 if mode == "solo" else 2, "maximumPlayers": 1 if mode == "solo" else 2},
        "collectionPolicy": {"handSize": hand_size, "observationsPerTurn": 1, "duplicatePolicy": duplicate_policy, "invalidObservationPolicy": "record_without_collection_member", "terminalPolicy": "fixed_turns_per_player"},
        "memberMap": members, "handPatterns": [{**pattern, "sourceReference": reference} for pattern in patterns], "capabilityStates": capabilities,
    }
    components = {"geometry": geometry, "registration": registration, "scoring": scoring, "mission": _component(f"{target_id}-mission", profile)}
    return {
        "schemaVersion": "sczn3-target-execution-contract-v1", "contractId": f"tec-{target_id}", "contractVersion": "1", "authorityContractVersion": "ADR-001-v1", "lifecycleStatus": "supported", "supportStatus": "supported",
        "approval": {"status": "approved", "authorityId": "COLLECTION-HAND-SYNTHETIC-AUTHORITY", "approvedAt": "2026-08-19T21:14:10-04:00"}, "effective": {"from": "2026-08-19T21:14:10-04:00", "until": None},
        "targetProfile": {"id": target_id, "version": "1", "atpId": f"atp-{target_id}-v1", "authorityId": f"authority-{target_id}-v1", "publisher": {"id": "synthetic-collection-publisher", "name": "Synthetic Collection Publisher"}, "product": {"id": f"product-{sku.lower()}", "name": name, "sku": sku}},
        "components": components, "missionFamily": "collectionHandEvaluation", "resultPackageType": "collectionHandResult", "resultPackageVersion": "1", "executor": {"id": "collection-hand-evaluator", "version": "1"}, "secAdapter": {"id": "collection-hand-family", "version": "1", "scoringPresentationFamily": "evidence_only"}, "preservationValidator": {"id": "collection-hand-preservation", "version": "1"},
        "session": {"capabilityStates": capabilities, "officialMissionRequired": False}, "unsupportedUses": ["path_state", "board_game", "deck_game", "casino_value", "general_game_judgment", "conventional_poker_inference", "physical_shot_timing", "scoring"],
    }


def contracts():
    return (
        _contract(FIXTURE_TARGET_IDS[0], "Solo Publisher Collection", "HAND-A01", "solo", 3, [{"handClassId": "publisher-triple", "publisherLabel": "Publisher Triple Collection", "precedence": 10, "requiredMemberIds": ["member-a", "member-b", "member-c"]}]),
        _contract(FIXTURE_TARGET_IDS[1], "Alternating Publisher Hands", "HAND-B02", "alternating_players", 2, [{"handClassId": "publisher-pair-a", "publisherLabel": "Publisher Pair A", "precedence": 20, "requiredMemberIds": ["member-a", "member-a"]}, {"handClassId": "publisher-mixed", "publisherLabel": "Publisher Mixed Pair", "precedence": 10, "requiredMemberIds": ["member-b", "member-c"]}]),
        _contract(FIXTURE_TARGET_IDS[2], "Data-Only Independent Hand", "HAND-C03", "solo", 2, [{"handClassId": "publisher-data-pair", "publisherLabel": "Publisher Data Pair", "precedence": 7, "requiredMemberIds": ["member-b", "member-c"]}], "reject_duplicate"),
    )
