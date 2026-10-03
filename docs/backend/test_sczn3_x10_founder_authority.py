#!/usr/bin/env python3
"""Global Founder authority: X=10 only for eligible ordered scoring grammar."""
from __future__ import annotations

import json
from pathlib import Path

from sczn3_derived_scoring_authority import apply_ordered_x_inheritance, registry, resolve_ordered_x_scoring


ROOT = Path(__file__).parent


def test_global_rule_and_provenance():
    payload = registry()
    assert payload["authorityId"] == "SCZN3_FOUNDER_X10_ORDERED_GRAMMAR_V1"
    resolved = resolve_ordered_x_scoring(["X", 9, 8, 7, 6, 5], x_role="superior_scoring_region")
    assert resolved["status"] == "resolved_sczn3_derived"
    assert resolved["value"] == 10
    assert resolved["valueAuthority"] == "sczn3_derived"
    assert resolved["publisherAttribution"] is False
    assert resolved["orderedGrammar"] == ["X", 9, 8, 7, 6, 5]


def test_no_text_matching_or_non_sequential_inheritance():
    cases = (
        (["X"], "superior_scoring_region"),
        (["X", 8, 7, 6], "superior_scoring_region"),
        (["X", 9, 7, 6], "superior_scoring_region"),
        (["X", 9, 8], "aim_mark"),
        ([10, 9, 8], "superior_scoring_region"),
    )
    for grammar, role in cases:
        resolved = resolve_ordered_x_scoring(grammar, x_role=role)
        assert resolved["status"] == "not_applicable"
        assert resolved["applies"] is False
        assert resolved["value"] is None


def test_explicit_authority_overrides_sczn3():
    publisher = resolve_ordered_x_scoring(
        ["X", 9, 8, 7],
        x_role="superior_scoring_region",
        explicit_override={"authorityType": "publisher", "treatment": "numeric", "value": 12, "source": "publisher rule 4"},
    )
    assert publisher["value"] == 12 and publisher["valueAuthority"] == "publisher"
    non_numeric = resolve_ordered_x_scoring(
        ["X", 9, 8, 7],
        x_role="superior_scoring_region",
        explicit_override={"authorityType": "competition", "treatment": "non_numeric", "value": None, "source": "competition rule 2"},
    )
    assert non_numeric["applies"] is False and non_numeric["value"] is None


def test_materialized_inheritance_is_explicit_and_balloons_remains_closed():
    scoring = {"regionRules": {"center_x": {"label": "X"}, "ring_9": {"label": "9", "value": 9}}}
    inherited = apply_ordered_x_inheritance(scoring, grammar=["X", 9, 8, 7], x_region_ids=["center_x"])
    assert "value" not in scoring["regionRules"]["center_x"]
    assert inherited["regionRules"]["center_x"] == {
        "label": "X", "value": 10, "valueAuthority": "sczn3_derived", "countsAsX": True,
    }
    balloons = json.loads((ROOT / "target_execution_contracts/contracts/blocker_baker_targets_gf_balloons_target_scoring_v1.json").read_text(encoding="utf-8"))
    authority = balloons["components"]["scoring"]["definition"]["sczn3DerivedIntelligenceAuthority"]
    assert authority["derivationId"] == "sczn3-balloons-visible-descending-hierarchy-x10-v1"
    assert balloons["components"]["registration"]["definition"]["assetSha256"] == "4e2fc902b18f2afe9a2776fe6882871b4e263a529abe3ba98cfa8243fbb7023d"


if __name__ == "__main__":
    test_global_rule_and_provenance()
    test_no_text_matching_or_non_sequential_inheritance()
    test_explicit_authority_overrides_sczn3()
    test_materialized_inheritance_is_explicit_and_balloons_remains_closed()
    print("PASS global Founder X=10 authority: eligible ordered grammar inherits; explicit authority overrides; text matching cannot trigger; Founder #14 unchanged")
