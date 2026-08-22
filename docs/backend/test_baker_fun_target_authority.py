import base64
import hashlib
import math
from pathlib import Path

from baker_fun_target_authority import BakerFunAuthorityError, analyze_baker_fun_evidence, analyze_fun_target_evidence


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "authority-evidence" / "baker-fun"
CATALOG_EVIDENCE = ROOT / "authority-evidence" / "catalog-targets"


def image_evidence(name):
    path = EVIDENCE / name
    raw = path.read_bytes()
    return {
        "dataUrl": "data:image/jpeg;base64," + base64.b64encode(raw).decode(),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "widthPx": 1141,
        "heightPx": 1500,
    }


def catalog_image(name, width, height):
    path = CATALOG_EVIDENCE / name
    raw = path.read_bytes()
    return {"dataUrl": "data:image/jpeg;base64," + base64.b64encode(raw).decode(), "sha256": hashlib.sha256(raw).hexdigest(), "widthPx": width, "heightPx": height}


def dart_point(number, radius=120):
    order = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
    angle = math.radians(order.index(number) * 18 - 90)
    return {"xNorm": (572.5 + radius * math.cos(angle)) / 1140, "yNorm": (758.5 + radius * math.sin(angle)) / 1499}


def shot(index, player, phase, point=None, announced=None):
    event = {"eventId": f"event-{index}", "type": "shot" if point else "miss", "playerId": player, "phase": phase}
    if point:
        event.update(point)
    if announced is not None:
        event["announcedNumber"] = announced
    return event


def dart_payload(mode, players, events, **extra):
    return {
        "targetProfileId": "baker_gf_db",
        "targetProfileVersion": "1",
        "targetId": "BAKER_GF_DB",
        "variantId": "GF-DB-FullSize",
        "gameMode": mode,
        "players": players,
        "events": events,
        "imageEvidence": image_evidence("BAKER_GF_DB_PUBLISHER_PRODUCT_IMAGE_V1.jpg"),
        **extra,
    }


def test_game_of_points_uses_announced_number_multipliers_and_bulls():
    players = [{"playerId": "p1", "name": "Player 1"}, {"playerId": "p2", "name": "Player 2"}]
    events = [
        shot(1, "p1", "regular", dart_point(20), 20),
        shot(2, "p2", "regular", None, 1),
        shot(3, "p1", "bull", {"xNorm": 572.5 / 1140, "yNorm": 758.5 / 1499}),
        shot(4, "p2", "bull", {"xNorm": 572.5 / 1140, "yNorm": 718.5 / 1499}),
    ]
    package = analyze_baker_fun_evidence(dart_payload("game_of_points", players, events, shotsPerPlayer=1, playOrder="player_at_a_time"))
    assert package["status"] == "complete"
    assert [player["totalScore"] for player in package["result"]["players"]] == [70, 25]
    assert package["result"]["winnerPlayerIds"] == ["p1"]
    assert package["authorityTrace"]["scoringAuthority"] == "backend"


def test_game_of_numbers_requires_one_through_twenty_then_bull():
    players = [{"playerId": "p1", "name": "Player 1"}, {"playerId": "p2", "name": "Player 2"}]
    events = [shot(number, "p1", "numbers", dart_point(number), number) for number in range(1, 21)]
    events += [
        shot(21, "p1", "numbers", {"xNorm": 572.5 / 1140, "yNorm": 758.5 / 1499}),
        shot(22, "p2", "numbers", None),
    ]
    package = analyze_baker_fun_evidence(dart_payload("game_of_numbers", players, events))
    assert package["status"] == "complete"
    assert package["result"]["winnerPlayerIds"] == ["p1"]
    assert package["result"]["players"][0]["completed"] is True


def test_bowling_is_a_ten_shot_pin_challenge_without_imported_rules():
    centers = [(135, 590), (430, 590), (730, 585), (1015, 595), (255, 765), (580, 770), (895, 765), (390, 985), (745, 990), (570, 1165)]
    events = [{"eventId": f"event-{index}", "type": "shot", "xNorm": x / 1140, "yNorm": y / 1499, "playerId": "shooter", "phase": "ten_shot_challenge"} for index, (x, y) in enumerate(centers, 1)]
    payload = {
        "targetProfileId": "baker_gf_bp", "targetProfileVersion": "1", "targetId": "BAKER_GF_BP", "variantId": "GF-BP-FullSize",
        "imageEvidence": image_evidence("BAKER_GF_BP_PUBLISHER_PRODUCT_IMAGE_V1.jpg"), "events": events,
    }
    package = analyze_baker_fun_evidence(payload)
    assert package["status"] == "complete"
    assert package["result"]["shotLimit"] == 10
    assert package["result"]["pinsHit"] == 10
    assert package["result"]["outcome"] == "all_pins_hit"
    assert "score" not in package["result"] and "time" not in package["result"]


def test_frontend_result_claims_are_ignored_and_bad_hash_fails_closed():
    players = [{"playerId": "p1", "name": "Player 1"}, {"playerId": "p2", "name": "Player 2"}]
    payload = dart_payload("game_of_points", players, [shot(1, "p1", "regular", None, 20)], shotsPerPlayer=1, frontendScore=9999)
    package = analyze_baker_fun_evidence(payload)
    assert package["result"]["players"][0]["totalScore"] == 0
    payload["imageEvidence"]["sha256"] = "0" * 64
    try:
        analyze_baker_fun_evidence(payload)
    except BakerFunAuthorityError as error:
        assert error.reason == "image_sha256_mismatch"
    else:  # pragma: no cover - explicit fail-closed assertion
        raise AssertionError("bad image hash must fail closed")


def test_dot_torture_uses_published_50_round_course_and_reported_hole_extent():
    sequence = [1] * 5 + [2] * 5 + [3, 4] * 4 + [5] * 5 + [6, 6, 7, 7] * 4 + [8] * 5 + [9, 10] * 3
    stages = [1] * 5 + [2] * 5 + [3] * 8 + [4] * 5 + [5] * 16 + [6] * 5 + [7] * 6
    centers = {1: (500, 190), 2: (310, 395), 3: (500, 395), 4: (690, 395), 5: (310, 605), 6: (500, 605), 7: (690, 605), 8: (310, 810), 9: (500, 810), 10: (690, 810)}
    events = [{"eventId": str(index), "type": "shot", "playerId": "shooter", "phase": f"stage_{stages[index]}", "completeInside": True, "xNorm": centers[number][0] / 999, "yNorm": centers[number][1] / 999} for index, number in enumerate(sequence)]
    payload = {"targetProfileId": "ez2c_dot_torture_17", "targetProfileVersion": "1", "targetId": "EZ2C_STYLE_17", "variantId": "EZ2C-17-11x17", "imageEvidence": catalog_image("EZ2C_STYLE_17_DOT_TORTURE_PUBLISHER_IMAGE_V1.jpg", 1000, 1000), "players": [{"playerId": "shooter", "name": "Shooter"}], "events": events}
    package = analyze_fun_target_evidence(payload)
    assert package["status"] == "complete" and package["result"]["score"] == 50
    payload["events"][0].pop("completeInside")
    try:
        analyze_fun_target_evidence(payload)
    except BakerFunAuthorityError as error:
        assert error.reason == "complete_inside_adjudication_required"
    else:
        raise AssertionError("physical complete-inside adjudication must be explicit")


def test_billiard_uses_published_sequence_without_invented_winner():
    centers = {1: (560, 1220), 2: (360, 485), 3: (660, 1030), 4: (660, 665), 5: (760, 485), 6: (360, 845), 7: (165, 485), 8: (560, 845), 9: (860, 665), 10: (560, 485), 11: (460, 1030), 12: (960, 485), 13: (265, 665), 14: (760, 845), 15: (460, 665)}
    events = [{"eventId": str(number), "type": "shot", "playerId": "p1", "phase": "ordered_sequence", "xNorm": centers[number][0] / 1140, "yNorm": centers[number][1] / 1499} for number in range(1, 16)]
    payload = {"targetProfileId": "baker_gf_bb_c", "targetProfileVersion": "1", "targetId": "BAKER_GF_BB_C", "variantId": "GF-BB-C-FullSize", "imageEvidence": catalog_image("BAKER_GF_BB_C_PUBLISHER_IMAGE_V1.jpg", 1141, 1500), "players": [{"playerId": "p1", "name": "Player 1"}, {"playerId": "p2", "name": "Player 2"}], "events": events}
    package = analyze_fun_target_evidence(payload)
    assert package["status"] == "complete" and package["result"]["ballsCompleted"] == 15
    assert package["result"]["winnerPlayerIds"] == [] and "score" not in package["result"]


def battleship_point(board, cell):
    match = __import__("re").fullmatch(r"r(\d+)c(\d+)", cell)
    row, column = int(match.group(1)), int(match.group(2))
    y0 = 43 if board == "player_1_board" else 305
    return {"xNorm": (96 + (column - 0.5) * 24) / 431, "yNorm": (y0 + (row - 0.5) * 24) / 567}


def battleship_payload(events):
    return {
        "targetProfileId": "baker_gf_battleship", "targetProfileVersion": "1", "targetId": "BAKER_GF_BATTLESHIP", "variantId": "GF-Battleship-FullSize",
        "imageEvidence": catalog_image("BAKER_GF_BATTLESHIP_PUBLISHER_IMAGE_V1.jpg", 432, 568),
        "players": [{"playerId": "p1", "name": "Player 1"}, {"playerId": "p2", "name": "Player 2"}], "events": events,
    }


def test_battleship_uses_opponent_ship_squares_and_published_win_loss():
    target_cells = ["r1c8", "r2c8", "r3c8", "r4c8", "r5c8", "r6c8", "r2c3", "r2c4", "r3c2", "r4c2", "r5c2", "r6c2", "r8c7", "r8c8", "r8c9", "r9c1", "r9c2", "r9c3", "r9c4"]
    events = []
    for index, cell in enumerate(target_cells):
        events.append({"eventId": f"p1-{index}", "type": "shot", "playerId": "p1", "phase": "ship_attack", **battleship_point("player_2_board", cell)})
        if index < len(target_cells) - 1:
            events.append({"eventId": f"p2-{index}", "type": "miss", "playerId": "p2", "phase": "ship_attack"})
    package = analyze_fun_target_evidence(battleship_payload(events))
    assert package["status"] == "complete"
    assert package["result"]["winnerPlayerIds"] == ["p1"] and package["result"]["loserPlayerIds"] == ["p2"]
    assert package["result"]["boards"][1]["shipSquaresHit"] == 19
    assert package["authorityTrace"]["classificationAuthority"] == "backend"


def test_battleship_optional_challenge_awards_and_turn_penalty_are_publisher_governed():
    white = battleship_point("player_2_board", "r1c2")
    events = [
        {"eventId": "white", "type": "shot", "playerId": "p1", "phase": "challenge_attack", "declaredChallengeCell": "player_2_board:r1c2", **white},
        {"eventId": "award", "type": "replacement", "playerId": "p1", "phase": "challenge_replacement", **battleship_point("player_2_board", "r1c8")},
        {"eventId": "p2-miss", "type": "miss", "playerId": "p2", "phase": "ship_attack"},
    ]
    package = analyze_fun_target_evidence(battleship_payload(events))
    assert package["result"]["boards"][1]["shipSquaresHit"] == 6
    assert package["result"]["currentPlayerId"] == "p1"
    dark = battleship_point("player_2_board", "r2c6")
    dark["xNorm"] += 5 / 431
    events += [
        {"eventId": "dark", "type": "shot", "playerId": "p1", "phase": "challenge_attack", "declaredChallengeCell": "player_2_board:r2c6", **dark},
        {"eventId": "dark-award", "type": "replacement", "playerId": "p1", "phase": "challenge_replacement", **battleship_point("player_2_board", "r2c3")},
    ]
    package = analyze_fun_target_evidence(battleship_payload(events))
    assert package["result"]["boards"][1]["shipSquaresHit"] == 7
    outside = battleship_point("player_1_board", "r1c9")
    outside["xNorm"] += 10 / 431
    events += [
        {"eventId": "p2-outside", "type": "shot", "playerId": "p2", "phase": "challenge_attack", "declaredChallengeCell": "player_1_board:r1c9", **outside},
        {"eventId": "p1-miss", "type": "miss", "playerId": "p1", "phase": "ship_attack"},
    ]
    package = analyze_fun_target_evidence(battleship_payload(events))
    assert package["result"]["currentPlayerId"] == "p1"


def run():
    test_game_of_points_uses_announced_number_multipliers_and_bulls()
    test_game_of_numbers_requires_one_through_twenty_then_bull()
    test_bowling_is_a_ten_shot_pin_challenge_without_imported_rules()
    test_frontend_result_claims_are_ignored_and_bad_hash_fails_closed()
    test_dot_torture_uses_published_50_round_course_and_reported_hole_extent()
    test_billiard_uses_published_sequence_without_invented_winner()
    test_battleship_uses_opponent_ship_squares_and_published_win_loss()
    test_battleship_optional_challenge_awards_and_turn_penalty_are_publisher_governed()
    print("PASS Baker Fun backend authority")


if __name__ == "__main__":
    run()
