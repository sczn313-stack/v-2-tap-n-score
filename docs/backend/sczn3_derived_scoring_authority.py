"""Founder-governed automatic inheritance for SCZN3-derived scoring rules."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path
from typing import Any, Mapping, Sequence


REGISTRY_PATH = Path(__file__).parent / "registries" / "sczn3_derived_scoring_authority.json"


class DerivedScoringAuthorityError(ValueError):
    pass


def registry() -> dict:
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    if payload.get("schemaVersion") != "sczn3-derived-scoring-authority-v1":
        raise DerivedScoringAuthorityError("derived_scoring_registry_schema_invalid")
    rules = payload.get("rules")
    if not isinstance(rules, list) or len(rules) != 1:
        raise DerivedScoringAuthorityError("derived_scoring_registry_rules_invalid")
    return payload


def _explicit_override(override: Mapping[str, Any] | None, grammar: list[Any]) -> dict | None:
    if override is None:
        return None
    authority_type = str(override.get("authorityType") or "").strip()
    treatment = str(override.get("treatment") or "").strip()
    source = str(override.get("source") or "").strip()
    if authority_type not in {"publisher", "governing_body", "competition"} or treatment not in {"numeric", "non_numeric"} or not source:
        raise DerivedScoringAuthorityError("explicit_x_override_invalid")
    value = override.get("value")
    if treatment == "numeric" and (not isinstance(value, (int, float)) or isinstance(value, bool)):
        raise DerivedScoringAuthorityError("explicit_x_override_value_invalid")
    if treatment == "non_numeric" and value is not None:
        raise DerivedScoringAuthorityError("explicit_x_override_non_numeric_value_invalid")
    return {
        "status": "resolved_by_explicit_authority",
        "applies": treatment == "numeric",
        "symbol": "X",
        "value": value if treatment == "numeric" else None,
        "valueAuthority": authority_type,
        "publisherAttribution": authority_type == "publisher",
        "orderedGrammar": deepcopy(grammar),
        "source": source,
        "overrideDecision": "explicit_authority_controls",
    }


def resolve_ordered_x_scoring(
    grammar: Sequence[Any],
    *,
    x_role: str,
    explicit_override: Mapping[str, Any] | None = None,
) -> dict:
    """Resolve X only from an explicit superior ordered scoring grammar.

    Callers must provide canonical-face structural data. This function performs
    no OCR, text search, target-name matching, or geometry inference.
    """
    ordered = list(grammar) if isinstance(grammar, Sequence) and not isinstance(grammar, (str, bytes)) else []
    override = _explicit_override(explicit_override, ordered)
    if override is not None:
        return override

    authority = registry()
    rule = authority["rules"][0]
    tail = ordered[1:]
    eligible_tail = (
        len(tail) >= int(rule["numericTail"]["minimumLength"])
        and all(isinstance(value, int) and not isinstance(value, bool) for value in tail)
        and tail[0] == int(rule["numericTail"]["firstValue"])
        and all(tail[index] - tail[index - 1] == int(rule["numericTail"]["step"]) for index in range(1, len(tail)))
    )
    eligible = bool(ordered) and str(ordered[0]).upper() == "X" and x_role == rule["requiredRole"] and eligible_tail
    if not eligible:
        return {
            "status": "not_applicable",
            "applies": False,
            "symbol": "X",
            "value": None,
            "valueAuthority": None,
            "publisherAttribution": False,
            "orderedGrammar": deepcopy(ordered),
            "source": authority["source"],
            "overrideDecision": "no_eligible_superior_ordered_scoring_grammar",
        }
    return {
        "status": "resolved_sczn3_derived",
        "applies": True,
        "symbol": "X",
        "value": rule["derivedValue"],
        "valueAuthority": rule["valueAuthority"],
        "publisherAttribution": rule["publisherAttribution"],
        "orderedGrammar": deepcopy(ordered),
        "ruleId": rule["ruleId"],
        "authorityId": authority["authorityId"],
        "source": authority["source"],
        "overrideDecision": "no_controlling_external_override",
    }


def apply_ordered_x_inheritance(
    scoring: Mapping[str, Any],
    *,
    grammar: Sequence[Any],
    x_region_ids: Sequence[str],
    x_role: str = "superior_scoring_region",
    explicit_override: Mapping[str, Any] | None = None,
) -> dict:
    """Return a scoring definition with the winning X authority materialized."""
    resolved = resolve_ordered_x_scoring(grammar, x_role=x_role, explicit_override=explicit_override)
    output = deepcopy(dict(scoring))
    output["orderedScoringGrammarAuthority"] = resolved
    if not resolved["applies"]:
        return output
    rules = output.get("regionRules")
    if not isinstance(rules, dict):
        raise DerivedScoringAuthorityError("x_inheritance_region_rules_required")
    for region_id in x_region_ids:
        if region_id not in rules:
            raise DerivedScoringAuthorityError("x_inheritance_region_missing")
        rules[region_id]["value"] = resolved["value"]
        rules[region_id]["valueAuthority"] = resolved["valueAuthority"]
        rules[region_id]["countsAsX"] = True
    return output
