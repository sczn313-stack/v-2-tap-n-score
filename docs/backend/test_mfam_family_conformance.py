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


def test_all_eight_candidates_are_batch_evaluated_and_admitted():
    proof = scale_proof()
    result = run_family_admission_batch(proof["contractId"], proof["candidateFaceIds"])
    assert result["candidatesEvaluated"] == 8
    assert {item["faceId"] for item in result["admitted"]} == set(proof["candidateFaceIds"])
    assert result["hold"] == []


def test_issued_nsn_bridge_and_exact_packages_clear_speedwell_and_army():
    speedwell = evaluate_family_candidate("face-020")
    army = evaluate_family_candidate("face-032")
    assert speedwell["missingGateIds"] == []
    assert army["missingGateIds"] == []
    assert speedwell["disposition"] == army["disposition"] == "ADMITTED"


def test_new_publisher_artwork_keeps_exact_registration_and_clears_all_gates():
    for face_id in ("face-006", "face-013", "face-018", "face-025"):
        result = evaluate_family_candidate(face_id)
        assert result["missingGateIds"] == []
        assert result["disposition"] == "ADMITTED"


def test_new_admissions_reuse_family_facts_but_keep_exact_registration():
    qualification = evaluate_family_candidate("face-016")
    gunfun_green = evaluate_family_candidate("face-027")
    assert qualification["disposition"] == gunfun_green["disposition"] == "ADMITTED"
    assert qualification["targetProfileId"] == "qualification_m16a2_25m_zero"
    assert gunfun_green["targetProfileId"] == "gunfun_32120_m16a2_green_25m_zero"


if __name__ == "__main__":
    tests = [value for name, value in globals().copy().items() if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} reusable M/FAM family-conformance tests")
