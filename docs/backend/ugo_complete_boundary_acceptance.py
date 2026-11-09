"""Shared UGO completeness gate for N/N acceptance.

Stored regions executing is necessary but not sufficient.  A target is eligible
for N/N PASS only when every declared result-affecting physical boundary has an
inside / edge / outside proof and the complete boundary roster is asserted.
"""
from __future__ import annotations

from typing import Any, Mapping, Sequence

from ugo_observation_classifier import classify


SCHEMA_VERSION_V1 = "sczn3.ugo.complete-boundary.v1"
SCHEMA_VERSION_V2 = "sczn3.ugo.complete-boundary.v2"
SUPPORTED_SCHEMA_VERSIONS = {SCHEMA_VERSION_V1, SCHEMA_VERSION_V2}
ALLOWED_EFFECTS = {"hit_miss", "zone_identity", "object_identity", "score"}


class UGOCompleteBoundaryError(ValueError):
    pass


def _required(contract: Mapping[str, Any]) -> bool:
    if contract.get("missionFamily") != "targetScoring":
        return False
    components = contract.get("components") or {}
    geometry = (components.get("geometry") or {}).get("definition") or {}
    scoring = (components.get("scoring") or {}).get("definition") or {}
    return scoring.get("model") != "not_applicable" and bool(geometry.get("regions"))


def validate_complete_boundary_acceptance(contract: Mapping[str, Any], *, required: bool = False) -> dict[str, Any]:
    """Validate and execute the complete-boundary proof embedded in a contract."""
    if not _required(contract):
        return {"required": False, "status": "NOT_APPLICABLE", "boundaryCount": 0, "probeCount": 0}
    components = contract.get("components") or {}
    geometry = (components.get("geometry") or {}).get("definition") or {}
    proof = geometry.get("completeBoundaryProof")
    if proof is None:
        if required:
            raise UGOCompleteBoundaryError("ugo_complete_boundary_proof_required")
        return {"required": True, "status": "UNPROVEN", "boundaryCount": 0, "probeCount": 0}
    schema_version = proof.get("schemaVersion") if isinstance(proof, Mapping) else None
    if not isinstance(proof, Mapping) or schema_version not in SUPPORTED_SCHEMA_VERSIONS or proof.get("status") != "PASS":
        raise UGOCompleteBoundaryError("ugo_complete_boundary_proof_invalid")
    assertion = proof.get("completenessAssertion")
    if not isinstance(assertion, Mapping) or any(assertion.get(key) is not True for key in (
        "allResultAffectingPhysicalBoundariesEnumerated",
        "allOuterHitMissEnvelopesEnumerated",
        "pixelIsAuthorityFalse",
    )):
        raise UGOCompleteBoundaryError("ugo_complete_boundary_assertion_incomplete")
    physical = geometry.get("physicalAuthority")
    if not isinstance(physical, Mapping) or physical.get("pixelIsAuthority", physical.get("imagePixelsAreAuthority")) is not False:
        raise UGOCompleteBoundaryError("ugo_complete_boundary_physical_authority_invalid")
    regions = geometry.get("regions")
    if not isinstance(regions, Sequence) or isinstance(regions, (str, bytes)) or not regions:
        raise UGOCompleteBoundaryError("ugo_complete_boundary_regions_required")
    region_ids = [str(region.get("regionId") or region.get("zoneId") or "").strip() for region in regions]
    if any(not region_id for region_id in region_ids) or len(set(region_ids)) != len(region_ids):
        raise UGOCompleteBoundaryError("ugo_complete_boundary_region_identity_invalid")
    declared_ids = proof.get("resultAffectingBoundaryIds")
    boundaries = proof.get("boundaries")
    if schema_version == SCHEMA_VERSION_V1:
        if not isinstance(declared_ids, list) or set(map(str, declared_ids)) != set(region_ids):
            raise UGOCompleteBoundaryError("ugo_complete_boundary_roster_incomplete")
    else:
        declared_region_ids = proof.get("resultAffectingRegionIds")
        if not isinstance(declared_region_ids, list) or set(map(str, declared_region_ids)) != set(region_ids):
            raise UGOCompleteBoundaryError("ugo_complete_boundary_region_roster_incomplete")
        if not isinstance(declared_ids, list) or not declared_ids or any(not str(item).strip() for item in declared_ids) or len(set(map(str, declared_ids))) != len(declared_ids):
            raise UGOCompleteBoundaryError("ugo_complete_boundary_roster_incomplete")
    if not isinstance(boundaries, list) or len(boundaries) != len(declared_ids):
        raise UGOCompleteBoundaryError("ugo_complete_boundary_ledger_incomplete")
    by_boundary: dict[str, Mapping[str, Any]] = {}
    covered_regions: set[str] = set()
    probe_count = 0
    for boundary in boundaries:
        if not isinstance(boundary, Mapping):
            raise UGOCompleteBoundaryError("ugo_complete_boundary_entry_invalid")
        region_id = str(boundary.get("regionId") or "").strip()
        boundary_id = region_id if schema_version == SCHEMA_VERSION_V1 else str(boundary.get("boundaryId") or "").strip()
        effects = boundary.get("effects")
        probes = boundary.get("probes")
        if region_id not in region_ids or not boundary_id or boundary_id in by_boundary or boundary_id not in set(map(str, declared_ids)):
            raise UGOCompleteBoundaryError("ugo_complete_boundary_entry_identity_invalid")
        if not isinstance(effects, list) or not effects or not set(map(str, effects)).issubset(ALLOWED_EFFECTS):
            raise UGOCompleteBoundaryError("ugo_complete_boundary_effect_invalid")
        if not isinstance(probes, Mapping) or set(probes) != {"inside", "edge", "outside"}:
            raise UGOCompleteBoundaryError("ugo_complete_boundary_probe_set_invalid")
        observed: dict[str, str] = {}
        for kind in ("inside", "edge", "outside"):
            probe = probes[kind]
            if not isinstance(probe, Mapping):
                raise UGOCompleteBoundaryError("ugo_complete_boundary_probe_invalid")
            try:
                x, y = float(probe["x"]), float(probe["y"])
            except (KeyError, TypeError, ValueError) as exc:
                raise UGOCompleteBoundaryError("ugo_complete_boundary_probe_coordinate_invalid") from exc
            if not 0 <= x <= 1 or not 0 <= y <= 1:
                raise UGOCompleteBoundaryError("ugo_complete_boundary_probe_coordinate_invalid")
            expected = str(probe.get("expectedEntityId") or "outside")
            if expected != "outside" and expected not in region_ids:
                raise UGOCompleteBoundaryError("ugo_complete_boundary_probe_expectation_invalid")
            classified = classify(regions, x, y, id_key="regionId")
            actual = classified.get("entityId") or "outside"
            if classified.get("classificationStatus") == "ambiguous" or actual != expected:
                raise UGOCompleteBoundaryError(f"ugo_complete_boundary_probe_failed:{region_id}:{kind}:{expected}:{actual}")
            observed[kind] = actual
            probe_count += 1
        if observed["inside"] != region_id or observed["edge"] != region_id or observed["outside"] == region_id:
            raise UGOCompleteBoundaryError(f"ugo_complete_boundary_transition_invalid:{region_id}")
        by_boundary[boundary_id] = boundary
        covered_regions.add(region_id)
    if set(by_boundary) != set(map(str, declared_ids)) or covered_regions != set(region_ids):
        raise UGOCompleteBoundaryError("ugo_complete_boundary_ledger_incomplete")
    return {
        "required": True,
        "status": "PASS",
        "schemaVersion": schema_version,
        "regionCount": len(region_ids),
        "boundaryCount": len(boundaries),
        "probeCount": probe_count,
        "rule": "inside_edge_outside_for_every_result_affecting_boundary",
    }


def require_nn_complete_boundary(contract: Mapping[str, Any]) -> dict[str, Any]:
    """Fail closed when a result-affecting target lacks complete UGO proof."""
    return validate_complete_boundary_acceptance(contract, required=True)
