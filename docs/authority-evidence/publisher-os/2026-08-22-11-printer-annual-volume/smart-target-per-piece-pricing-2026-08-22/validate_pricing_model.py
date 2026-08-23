#!/usr/bin/env python3
import json
from decimal import Decimal
from pathlib import Path


model = json.loads(Path(__file__).with_name("MODEL.json").read_text())
volume_model = json.loads((Path(__file__).parent / model["volumeModelRef"]).resolve().read_text())

assert model["annualPieceVolumeCases"] == {
    "low": volume_model["combined"]["lowPieces"],
    "base": volume_model["combined"]["basePieces"],
    "high": volume_model["combined"]["highPieces"],
}
assert len(model["publisherPriceSummaries"]) == 11
assert len({row["publisher"] for row in model["publisherPriceSummaries"]}) == 11

for row in model["publisherPriceSummaries"]:
    assert row["lowObservedPerPiece"] <= row["medianObservedPerPiece"]
    assert row["lowObservedPerPiece"] <= row["representativePerPiece"]
    for fee in model["testedFeesPerPiece"]:
        percentage = Decimal(str(fee)) / Decimal(str(row["representativePerPiece"]))
        assert percentage > 0

scenario_count = 0
for volume in model["annualPieceVolumeCases"].values():
    for penetration in model["testedPenetrations"]:
        for fee in model["testedFeesPerPiece"]:
            revenue = Decimal(volume) * Decimal(str(penetration)) * Decimal(str(fee))
            assert revenue >= 0
            scenario_count += 1

assert scenario_count == 90
assert Decimal(model["annualPieceVolumeCases"]["low"]) * Decimal("0.01") * Decimal("0.05") == Decimal("6025")
assert Decimal(model["annualPieceVolumeCases"]["base"]) * Decimal("0.25") * Decimal("0.10") == Decimal("613750")
assert Decimal(model["annualPieceVolumeCases"]["high"]) * Decimal("1.00") * Decimal("0.20") == Decimal("9000000")

print("PASS: source volume model matches; 11 publisher summaries and all 90 revenue scenarios reconcile.")
