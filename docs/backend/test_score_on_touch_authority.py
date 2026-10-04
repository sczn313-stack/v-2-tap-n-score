#!/usr/bin/env python3
"""Focused proof of the Founder-locked shared Score on Touch boundary rule."""
from ugo_observation_classifier import classify


def test_touch_crossing_counts_and_higher_value_wins():
    regions = [
        {"regionId": "low", "shape": "circle", "cx": .50, "cy": .50, "radius": .10, "priority": 100},
        {"regionId": "high", "shape": "circle", "cx": .63, "cy": .50, "radius": .05, "priority": 100},
    ]
    result = classify(
        regions, .56, .50, id_key="regionId",
        footprint_radius_x=.025, footprint_radius_y=.025,
        touch_values={"low": 5, "high": 10},
    )
    assert result["classificationStatus"] == "matched"
    assert result["entityId"] == "high"
    assert result["matchingEntityIds"] == ["high", "low"]
    assert result["classificationMethod"] == "physical_projectile_footprint"


def test_center_outside_but_footprint_touching_counts():
    regions = [{"regionId": "disc", "shape": "circle", "cx": .50, "cy": .50, "radius": .05, "priority": 100}]
    point_only = classify(regions, .56, .50, id_key="regionId")
    touched = classify(regions, .56, .50, id_key="regionId", footprint_radius_x=.02, footprint_radius_y=.02)
    assert point_only["classificationStatus"] == "unmapped"
    assert touched["classificationStatus"] == "matched"
    assert touched["entityId"] == "disc"


if __name__ == "__main__":
    test_touch_crossing_counts_and_higher_value_wins()
    test_center_outside_but_footprint_touching_counts()
    print("PASS Score on Touch: immutable region geometry, observation footprint, higher-value precedence")
