"""Shared governed conversion from continuous sight corrections to executable clicks."""
from __future__ import annotations

import math
from typing import Any, Dict


ROUNDING_RULE = "nearest-whole-click-half-to-even"
POLICY_ID = "sczn3-universal-mechanical-quantization-v1"
MAX_GOVERNED_CANDIDATE_SPAN_CLICKS = 3
_TIE_EPSILON = 1e-9


def nearest_click_half_to_even(value: float) -> int:
    """Return the nearest integer; exact half-click ties select the even integer."""
    if not math.isfinite(value):
        raise ValueError("continuous click value must be finite")
    magnitude = abs(float(value))
    lower = math.floor(magnitude)
    fraction = magnitude - lower
    if fraction < 0.5 - _TIE_EPSILON:
        selected = lower
    elif fraction > 0.5 + _TIE_EPSILON:
        selected = lower + 1
    else:
        selected = lower if lower % 2 == 0 else lower + 1
    return -selected if value < 0 else selected


def quantize_mechanical_axis(continuous_clicks: float, uncertainty_clicks: float = 0.0) -> Dict[str, Any]:
    """Quantize one signed axis and retain the uncertainty/release decision."""
    continuous = float(continuous_clicks)
    uncertainty = max(0.0, float(uncertainty_clicks))
    selected = nearest_click_half_to_even(continuous)
    lower_integer = math.floor(continuous)
    upper_integer = math.ceil(continuous)
    candidates = sorted({
        nearest_click_half_to_even(continuous - uncertainty),
        selected,
        nearest_click_half_to_even(continuous + uncertainty),
    })
    nonzero_signs = {1 if value > 0 else -1 for value in candidates if value != 0}
    candidate_span = (max(candidates) - min(candidates)) if candidates else 0
    within_governed_span = candidate_span <= MAX_GOVERNED_CANDIDATE_SPAN_CLICKS
    direction_stable = len(nonzero_signs) <= 1
    releasable = within_governed_span and direction_stable

    return {
        "policyId": POLICY_ID,
        "roundingRule": ROUNDING_RULE,
        "tieBreak": "exact half-click selects the even integer",
        "selectionMethod": "minimum absolute residual from governed continuous correction",
        "continuousClicks": round(continuous, 6),
        "selectedClicks": selected,
        "lowerIntegerClicks": lower_integer,
        "upperIntegerClicks": upper_integer,
        "lowerResidualClicks": round(abs(continuous - lower_integer), 6),
        "upperResidualClicks": round(abs(upper_integer - continuous), 6),
        "uncertaintyHalfWidthClicks": round(uncertainty, 6),
        "maximumGovernedCandidateSpanClicks": MAX_GOVERNED_CANDIDATE_SPAN_CLICKS,
        "signedClickCandidates": candidates,
        "candidateSpanClicks": candidate_span,
        "directionStable": direction_stable,
        "uncertaintyWithinPolicy": within_governed_span,
        "status": "released" if releasable else "withheld",
        "reason": None if releasable else "mechanical_quantization_uncertainty_exceeds_governed_policy",
    }
