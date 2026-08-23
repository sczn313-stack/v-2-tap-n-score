#!/usr/bin/env python3
"""Validate the Thompson pistol authority deep-dive bundle."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / "THOMPSON_PISTOL_AUTHORITY_MAP.json").read_text())

HASHES = {
    "diagnostic-category.html": "20106cae42fe21aafbcc5763387e1a5a21fe39d3779bf03cae5d6f6e0a983d77",
    "group-shooter-handgun.jpg": "02027327dcac830caf132ff7842b7b44758ef4261608f9c7df47e5a4f80e32de",
    "halo-trouble-shooter-12x19.jpg": "d9f0fb0edda94d89780539aa99810bfe8a3e2f6cc93fa1b1b3ea08fa68ddf19e",
    "halo-trouble-shooter-8x11.jpg": "676b28a34fb3c45cd34def06664ef772114547677cdc4722fa822dee15d771eb",
    "premium-handgun-pack.png": "4e29a1bcf447c2469da597e5920f72e600207aaa5199bad70c0369db4401a6c3",
    "progressive-pistol-pack.jpg": "0cfa919fcdd518f883b0e8b8cfb77ab79a9ef929939fb7fcb8f04774fc606dd3",
    "tac-blog.html": "721dde834302989aab6ef9af0260e49355990e336f4c26588b2631df1fde96d8",
    "tac-cue-card.jpg": "8aebc9de2a538d9130566f0fe983f2269b30db343603f871edb4bd8f2c231938",
    "tac-target.jpg": "6df2e43797209db90564daca6dc7d64f7025d50f100e781a465feec03a9aa76f",
    "threat-code-red.jpg": "30bc95bb92a9cc1cea90d0ef05c5aa62d3e7db8c392c25eb75357d3f7699c6ce",
    "trouble-shooter-12x19.jpg": "75bf6e63ac9dae88e845919c2cda1e3b7f5c6831a918f92c0f71d9bb183c5d24",
    "trouble-shooter-19x25.jpg": "e686e984748869a9957335de157bae92a61396704f6314af92fe40603d048517",
    "trouble-shooter-9x12.jpg": "6204fe70493da497df19a0f849c41e8e9e48220459cff95bd49160422f18ff71",
}


def check(condition: bool, label: str) -> None:
    if not condition:
        raise AssertionError(label)
    print(f"PASS: {label}")


def main() -> None:
    for name, expected in HASHES.items():
        path = ROOT / "sources" / name
        check(path.exists(), f"source exists: {name}")
        check(hashlib.sha256(path.read_bytes()).hexdigest() == expected, f"source hash: {name}")
    records = DATA["records"]
    check(len(records) == 10, "ten bounded deep-dive records")
    check(DATA["population"]["instructionalPistolProductIdentities"] == 8, "eight instructional target identities")
    check(DATA["population"]["publisherProgramOrCollectionOfferings"] == 2, "two program/collection offerings")
    check(len({record["baseSku"] for record in records}) == 10, "unique base identities")
    check(all(record["commercialSkus"] for record in records), "every record retains exact commercial identity")
    tac = next(record for record in records if record["baseSku"] == "R-2704")
    check(tac["publisherKnowledge"]["cueSets"] == 10, "TAC has ten publisher cue sets")
    check(tac["publisherKnowledge"]["cuesPerSet"] == 20, "TAC has twenty cues per set")
    check(tac["publisherKnowledge"]["scoringZones"] == [5, 3, 1], "TAC score zones preserved")
    progression = next(record for record in records if record["baseSku"] == "R-6502")
    check([stage["baseSku"] for stage in progression["publisherKnowledge"]["stages"]] == ["R-9200", "R-2550", "R-2704"], "progression order preserved")
    check(progression["publisherKnowledge"]["advancementRule"] is None, "missing advancement rule remains explicit")
    check(DATA["result"]["newBehavioralFamiliesRequired"] == 0, "no new behavioral family inferred")
    check(DATA["result"]["authorityCompleteForProduction"] == 0, "no public evidence promoted to production authority")
    print("\nTHOMPSON PISTOL AUTHORITY DEEP DIVE: PASS")


if __name__ == "__main__":
    main()
