import json
from copy import deepcopy
from pathlib import Path

from build_qt_physical_authority_batch import (
    CONTRACTS,
    PRIOR_B27E,
    QT_B27E_NAME,
    RUN_DIR,
    boundary_challenges,
    compile_ellipse,
    physical_ellipse,
)
from target_execution_contract import validate_contract


def test_only_physically_admitted_qt_geometry_is_active():
    active = []
    for path in CONTRACTS.glob("qt_printer13_*.json"):
        contract = json.loads(path.read_text())
        if contract["missionFamily"] != "targetScoring":
            continue
        if contract.get("approval", {}).get("authorityId") not in {
            "QT_PRINTER13_PHYSICAL_AUTHORITY_EXECUTION_2026_09_28",
            "QT_PRINTER13_SCALED_EXACT_FACE_AUTHORITY_2026_09_28",
            "QT_PRINTER13_B27_P1_PHYSICAL_AUTHORITY_2026_09_29",
            "QT_PRINTER13_NM_Q3_PHYSICAL_AUTHORITY_2026_09_29",
        }:
            continue
        authority = contract["components"]["geometry"]["definition"].get("physicalAuthority")
        assert authority and authority["boundaryGate"] == "PASS", path.name
        assert authority.get("imagePixelsAreAuthority", authority.get("unscaledPixelsAreAuthority")) is False
        assert authority.get("genericOrFamilyGeometryUsed", False) is False
        active.append(path.name)
    manifest = json.loads((RUN_DIR / "QT_PHYSICAL_AUTHORITY_BATCH_MANIFEST.json").read_text())
    assert len(active) == manifest["census"]["REPAIR→PASS"]
    assert QT_B27E_NAME in active


def test_admitted_contract_validates_and_has_no_leg_three_derivation():
    contract = json.loads((CONTRACTS / QT_B27E_NAME).read_text())
    validate_contract(contract)
    encoded = json.dumps(contract)
    assert "qt-leg3-class-level-visible-structure" not in encoded
    assert "leg-two-family-plus-preserved-visible-structure" not in encoded


def test_boundary_gate_detects_compiler_displacement():
    prior = json.loads(PRIOR_B27E.read_text())
    source = {item["regionId"]: item for item in prior["components"]["geometry"]["definition"]["regions"]}
    physical = [physical_ellipse("zone_10", source["10"], 23, 35)]
    compiled = [compile_ellipse(physical[0], 23, 35)]
    compiled[0] = deepcopy(compiled[0])
    compiled[0]["cx"] += 0.02
    assert any(not item["pass"] for item in boundary_challenges(physical, compiled, 23, 35))


def test_batch_census_reconciles_254():
    manifest = json.loads((RUN_DIR / "QT_PHYSICAL_AUTHORITY_BATCH_MANIFEST.json").read_text())
    census = manifest["census"]
    assert census["PASS"] + census["REPAIR→PASS"] + census["HOLD"] + census["N/A"] == 254
    assert len(manifest["targets"]) == 254
