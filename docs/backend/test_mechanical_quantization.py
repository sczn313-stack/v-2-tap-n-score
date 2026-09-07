from mechanical_quantization import nearest_click_half_to_even, quantize_mechanical_axis


def test_half_click_boundary_is_deterministic():
    assert nearest_click_half_to_even(18.499999) == 18
    assert nearest_click_half_to_even(18.5) == 18
    assert nearest_click_half_to_even(18.500001) == 19
    assert nearest_click_half_to_even(19.5) == 20


def test_founder_adjacent_click_uncertainty_is_released_and_preserved():
    result = quantize_mechanical_axis(18.369746, .25566)
    assert result["selectedClicks"] == 18
    assert result["signedClickCandidates"] == [18, 19]
    assert result["lowerResidualClicks"] == .369746
    assert result["upperResidualClicks"] == .630254
    assert result["status"] == "released"


def test_direction_or_excessive_candidate_span_fails_closed():
    assert quantize_mechanical_axis(.2, .8)["status"] == "withheld"
    excessive = quantize_mechanical_axis(18.37, 2.01)
    assert excessive["candidateSpanClicks"] > excessive["maximumGovernedCandidateSpanClicks"]
    assert excessive["status"] == "withheld"


def test_policy_scales_across_governed_zeroing_mechanics():
    m16a2 = quantize_mechanical_axis(9.1849 / .5, .12783 / .5)
    m4 = quantize_mechanical_axis(4.42 / .5, .12 / .5)
    baker_100_optic = quantize_mechanical_axis(2.13 / .25, .08 / .25)
    assert (m16a2["selectedClicks"], m16a2["status"]) == (18, "released")
    assert (m4["selectedClicks"], m4["status"]) == (9, "released")
    assert (baker_100_optic["selectedClicks"], baker_100_optic["status"]) == (9, "released")


if __name__ == "__main__":
    tests = [value for name, value in globals().copy().items() if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} universal mechanical quantization tests")
