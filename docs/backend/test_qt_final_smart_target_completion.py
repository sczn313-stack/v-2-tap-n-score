from __future__ import annotations

import json
from pathlib import Path

from executors.declarative_target_score import execute as execute_score
from executors.smart_evidence_capture import execute as execute_evidence
from preserved_sec_store import _same_target_progress
from target_execution_contract import TargetExecutionContractResolver


DOCS = Path(__file__).resolve().parents[1]
ARTIFACTS = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22"
CONTRACTS = DOCS / "backend/target_execution_contracts/contracts"


def load(path: Path):
    return json.loads(path.read_text())


def image(row):
    return {
        "dataUrl": row["assetPath"],
        "sha256": row["assetSha256"],
        "widthPx": row["imageWidth"],
        "heightPx": row["imageHeight"],
        "mediaType": "image/png",
    }


class PriorStore:
    def __init__(self, records):
        self.records = records

    def prior_applicable(self, target_id, continuity_id):
        return list(self.records)


def test_final_qt_smart_target_inventory_and_shared_intelligence():
    manifest = load(ARTIFACTS / "QT_LEG3_EXECUTION_MANIFEST.json")
    completion = load(ARTIFACTS / "QT_FINAL_SMART_TARGET_COMPLETION_MANIFEST.json")
    rows = manifest["surfaces"]
    assert len(rows) == len({row["qtCatalogId"] for row in rows}) == 254
    assert sum(completion["finalTreatmentCounts"].values()) == 254
    assert completion["nonQtContractBoundary"]["unchanged"] is True
    assert completion["founderCorrectedCapabilityCounts"] == {"Scoring": 39, "Zone / Object Counting": 153, "Evidence Only": 61, "Zeroing": 1}
    assert completion["smartSessionProgressCoverage"]["shotPattern"] == 0
    assert completion["lockedResultMetaRemovedChairs"] == 254

    packages = [load(path) for path in CONTRACTS.glob("qt_printer13_product_*.json")]
    assert len(packages) == 253
    resolver = TargetExecutionContractResolver(contracts=packages)
    for row in rows:
        if row["missionFamily"] != "zeroingCorrection":
            assert resolver.resolve(row["targetProfileId"], row["missionFamily"])["targetProfile"]["product"]["id"] == row["qtCatalogId"]

    five = next(row for row in rows if row["visualStackOrdinal"] == 1)
    five_contract = resolver.resolve(five["targetProfileId"], "targetScoring")
    observations = []
    centers = ((0.226, 0.239), (0.760, 0.239), (0.500, 0.479), (0.222, 0.741), (0.758, 0.741))
    for x, y in centers:
        observations.extend(({"xNorm": x, "yNorm": y}, {"xNorm": x + 0.07, "yNorm": y}))
    observations.append({"xNorm": 0.02, "yNorm": 0.98})
    five_result = execute_score(five_contract, {"imageEvidence": image(five), "observations": observations})
    assert five_result["scoring"]["observationCount"] == 11
    assert five_result["scoring"]["outsideCount"] == 1
    assert [item["observationCount"] for item in five_result["scoring"]["objectResults"]] == [2, 2, 2, 2, 2]
    assert sum(item["observationCount"] for item in five_result["scoring"]["subsetResults"]) == 5
    assert all(item["accountingRole"] == "subset_not_additional_primary_tap" for item in five_result["scoring"]["subsetResults"])
    assert five_result["sczn3Metrics"]["objectCoverage"] == {"objectsHit": 5, "scorableObjectCount": 5}
    assert five_result["sczn3Metrics"]["shotPattern"] is None
    assert five_result["sczn3Metrics"]["objectDistribution"] is None

    diagnostic = next(row for row in rows if row["visualStackOrdinal"] == 116)
    diagnostic_contract = resolver.resolve(diagnostic["targetProfileId"], "targetScoring")
    diagnostic_result = execute_score(diagnostic_contract, {"imageEvidence": image(diagnostic), "observations": [{"xNorm": 0.5, "yNorm": 0.515}, {"xNorm": 0.72, "yNorm": 0.515}]})
    assert diagnostic_result["scoring"]["total"] == 18
    assert diagnostic_result["diagnosticOverlay"]["handedness"] == "right"
    assert diagnostic_result["diagnosticOverlay"]["claimGrade"] == "publisher_printed_diagnostic_label_match"
    assert diagnostic_result["diagnosticOverlay"]["causalDiagnosisStatus"] == "not_established"

    anatomy = next(row for row in rows if row["visualStackOrdinal"] == 3)
    anatomy_contract = resolver.resolve(anatomy["targetProfileId"], "smartEvidenceCapture")
    anatomy_result = execute_evidence(anatomy_contract, {"imageEvidence": image(anatomy), "observations": [{"xNorm": 0.4, "yNorm": 0.4}, {"xNorm": 0.6, "yNorm": 0.6}]})
    assert anatomy_result["scoring"]["status"] == "not_applicable"
    assert anatomy_result["sczn3Metrics"]["shotPattern"] is None

    continuity = "qt-smartness-test"
    prior_session = {"sessionId": "prior", "savedAt": "2026-09-21", "shooterContinuityId": continuity, "authorityPackage": anatomy_result}
    current_result = execute_evidence(anatomy_contract, {"imageEvidence": image(anatomy), "observations": [{"xNorm": 0.48, "yNorm": 0.48}, {"xNorm": 0.52, "yNorm": 0.52}]})
    current_session = {"sessionId": "current", "shooterContinuityId": continuity, "authorityPackage": current_result}
    progress = _same_target_progress(current_session, anatomy["targetProfileId"], PriorStore([{"targetId": anatomy["targetProfileId"], "artifact": prior_session}]))
    assert progress["status"] != "comparison_available"


if __name__ == "__main__":
    test_final_qt_smart_target_inventory_and_shared_intelligence()
    print("PASS QT final Smart Target inventory, family treatment, measured intelligence, and progress")
