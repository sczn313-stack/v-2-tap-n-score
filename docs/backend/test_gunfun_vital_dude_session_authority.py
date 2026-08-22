"""Session Authority admission for the controlled E56-T08 proof."""
from __future__ import annotations

from datetime import datetime, timezone

from session_authority import prepare_session, start_session
from test_session_authority import TestStore


NOW = datetime(2026, 8, 18, 22, 30, tzinfo=timezone.utc)


def run():
    store = TestStore()
    preparation = prepare_session({"targetId": "GUNFUN_22740_VITAL_DUDE", "equipmentCandidates": []}, store, now=NOW)
    assert preparation["target"]["targetId"] == "gunfun_22740_vital_dude"
    assert preparation["target"]["atpId"] == "ATP_GUNFUN_22740_VITAL_DUDE_EVIDENCE_V1"
    assert preparation["missionIdentity"] == {
        "missionFamily": "smartEvidenceCapture",
        "missionId": "GUNFUN_22740_EVIDENCE_CAPTURE_V1",
        "resultPackageType": "smartEvidenceResult",
    }
    assert preparation["targetAdmission"]["status"] == "admitted"
    assert preparation["equipmentAssessments"][0]["officialMission"]["status"] == "not_applicable"
    result = start_session({
        "preparationToken": preparation["preparationToken"],
        "selectedEquipment": preparation["standardSetup"],
    }, store, idempotency_key="idem-vital-dude", now=NOW)
    assert result["sessionMode"] == "target_evidence"
    assert result["target"]["targetId"] == "gunfun_22740_vital_dude"
    assert result["officialMission"]["status"] == "not_applicable"
    assert result["capabilities"]["correction"]["status"] == "not_applicable"
    assert result["selectedEquipment"]["source"] == "backend_standard_setup"
    print("PASS GunFun Vital Dude Session Authority admission")


if __name__ == "__main__":
    run()
