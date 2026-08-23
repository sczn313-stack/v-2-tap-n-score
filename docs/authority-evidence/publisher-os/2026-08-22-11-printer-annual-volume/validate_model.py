#!/usr/bin/env python3
import json
from pathlib import Path


path = Path(__file__).with_name("MODEL.json")
model = json.loads(path.read_text())
publishers = model["publishers"]

assert len(publishers) == 11
assert len({row["publisher"] for row in publishers}) == 11

for row in publishers:
    assert 0 <= row["lowPieces"] <= row["basePieces"] <= row["highPieces"]

for field in ("lowPieces", "basePieces", "highPieces"):
    calculated = sum(row[field] for row in publishers)
    asserted = model["combined"][field]
    assert calculated == asserted, (field, calculated, asserted)

for scenario in model["adoptionScenarios"]:
    for band in ("low", "base", "high"):
        expected = round(model["combined"][f"{band}Pieces"] * scenario["rate"])
        actual = scenario[f"{band}Units"]
        assert expected == actual, (scenario["label"], band, expected, actual)

print("PASS: 11 publishers; combined and adoption figures reconcile exactly.")

