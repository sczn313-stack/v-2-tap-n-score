#!/usr/bin/env python3
"""Backend tests for reusable M/FAM family admission."""
from mfam_family_conformance import (
    evaluate_family_candidate,
    family_conformance_contract,
    run_family_admission_batch,
    scale_proof,
)


def test_one_contract_owns_all_six_recurring_requirements():
    contract = family_conformance_contract("MFAM-STANDARD-M16A2-A3-FAMILY-CONFORMANCE-v1")
    assert [gate["gateId"] for gate in contract["requiredGates"]] == [
        "physical_geometry_pitch",
        "aim_reference",
        "representation_landmarks",
        "procedure",
        "mechanical_applicability",
        "registration_orientation",
    ]


def test_baker_reference_passes_every_gate_and_has_the_existing_binding():
    result = evaluate_family_candidate("face-003")
    assert result["disposition"] == "ADMITTED"
    assert result["missingGateIds"] == []
    assert result["targetProfileId"] == "baker_m16a2_25m_zero"


def test_all_eight_holds_are_batch_evaluated_without_false_admission():
    proof = scale_proof()
    result = run_family_admission_batch(proof["contractId"], proof["candidateFaceIds"])
    assert result["candidatesEvaluated"] == 8
    assert result["admitted"] == []
    assert len(result["hold"]) == 8
    assert all(len(item["irreducibleMissingFacts"]) == 1 for item in result["hold"])


def test_issued_nsn_bridge_clears_common_authority_not_registration():
    speedwell = evaluate_family_candidate("face-020")
    army = evaluate_family_candidate("face-032")
    assert speedwell["missingGateIds"] == ["registration_orientation"]
    assert army["missingGateIds"] == ["registration_orientation"]
    assert speedwell["disposition"] == army["disposition"] == "HOLD"


def test_publisher_artwork_never_inherits_another_registration():
    for face_id in ("face-006", "face-013", "face-016", "face-018", "face-020", "face-025", "face-027", "face-032"):
        result = evaluate_family_candidate(face_id)
        assert "registration_orientation" in result["missingGateIds"]


if __name__ == "__main__":
    tests = [value for name, value in globals().copy().items() if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} reusable M/FAM family-conformance tests")
