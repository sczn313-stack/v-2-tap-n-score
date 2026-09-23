#!/usr/bin/env python3
"""Repair Founder-confirmed QT presentation coupling and 530 registration defects."""
from __future__ import annotations

import hashlib
import json
import sys
from copy import deepcopy
from pathlib import Path


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))
from target_execution_contract import component_digest, validate_contract  # noqa: E402

AUTHORITY = BACKEND / "target_knowledge/qt_episode64_smart_target_authority.json"
CONTRACT = BACKEND / "target_execution_contracts/contracts/qt_printer13_product_1873655562313_target_scoring_v1.json"
MANIFEST = DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22/QT_EP64_254_IMPLEMENTATION_MANIFEST.json"
LEG3 = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_LEG3_EXECUTION_MANIFEST.json"
QT_ID = "QT-PRODUCT-1873655562313"

# Pixel-measured outer extents of the five explicitly governed bull objects on
# the preserved 500 x 746 source face. The target meaning and object identities
# come from Homie's locked treatment; this is implementation registration only.
REGIONS = [
    {"regionId": "bull_1", "shape": "rounded_rectangle", "xMin": 0.112, "yMin": 0.088472, "xMax": 0.366, "yMax": 0.306971, "cornerRadiusX": 0.055, "cornerRadiusY": 0.045, "priority": 50, "objectId": "bull_1"},
    {"regionId": "bull_2", "shape": "rounded_rectangle", "xMin": 0.658, "yMin": 0.087131, "xMax": 0.898, "yMax": 0.310992, "cornerRadiusX": 0.055, "cornerRadiusY": 0.045, "priority": 50, "objectId": "bull_2"},
    {"regionId": "bull_3", "shape": "rounded_rectangle", "xMin": 0.390, "yMin": 0.348525, "xMax": 0.640, "yMax": 0.576408, "cornerRadiusX": 0.055, "cornerRadiusY": 0.045, "priority": 50, "objectId": "bull_3"},
    {"regionId": "bull_4", "shape": "rounded_rectangle", "xMin": 0.112, "yMin": 0.609920, "xMax": 0.366, "yMax": 0.837802, "cornerRadiusX": 0.055, "cornerRadiusY": 0.045, "priority": 50, "objectId": "bull_4"},
    {"regionId": "bull_5", "shape": "rounded_rectangle", "xMin": 0.640, "yMin": 0.615282, "xMax": 0.886, "yMax": 0.839142, "cornerRadiusX": 0.055, "cornerRadiusY": 0.045, "priority": 50, "objectId": "bull_5"},
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    authority = json.loads(AUTHORITY.read_text(encoding="utf-8"))
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    row = next(item for item in authority["chairs"] if item["qtCatalogId"] == QT_ID)
    if row["highestTruthfulCapability"] != "Zone / Object Counting":
        raise AssertionError("530 Homie capability changed unexpectedly")
    if [item["regionId"] for item in row["geometry"]["regions"]] != [item["regionId"] for item in REGIONS]:
        raise AssertionError("530 semantic region identities changed unexpectedly")
    geometry = deepcopy(row["geometry"])
    geometry["regions"] = deepcopy(REGIONS)
    geometry["ugoAuthority"] = "founder-confirmed-preserved-530-face-registration-v1"
    geometry["derivation"] = {
        "method": "pixel-measured-outer-extents-on-preserved-source-face",
        "sourceImageWidthPx": 500,
        "sourceImageHeightPx": 746,
        "semanticAuthority": "Homie corrected treatment ac73166e47bd17ca76882d27260b7528419f2b174ea4d0bc1b4ef8cfdb6daa44",
        "founderExpectedDistribution": "2 taps on each of Bull 1 through Bull 5",
    }
    row["geometry"] = geometry
    row["founderDefectRepair"] = {
        "repairId": "QT_FOUNDER_CONFIRMED_DEFECT_REPAIR_2026_09_23",
        "status": "IMPLEMENTED_PENDING_INDEPENDENT_VERIFICATION",
        "semanticChange": False,
        "registrationChange": "530 generic 3-top/2-bottom coordinates replaced by preserved-face 2-top/1-middle/2-bottom coordinates",
        "sharedPresentationChange": "Target header status height fixed so tap feedback cannot vertically reposition the rendered image",
    }
    contract["authorityContractVersion"] = "QT-EPISODE64-HOMIE-CORRECTED-FOUNDER-REPAIR-v4"
    contract["approval"] = {
        "status": "approved",
        "authorityId": "QT_FOUNDER_CONFIRMED_DEFECT_REPAIR_2026_09_23",
        "approvedAt": "2026-09-23T00:00:00-04:00",
    }
    contract["components"]["geometry"]["definition"] = deepcopy(geometry)
    contract["components"]["geometry"]["version"] = "2"
    contract["components"]["geometry"]["status"] = "approved"
    contract["targetProfile"]["product"]["founderConfirmedRegistrationVersion"] = "530-face-v1"
    contract["components"]["mission"]["definition"]["founderDefectRepair"] = deepcopy(row["founderDefectRepair"])
    for component in contract["components"].values():
        component["digest"] = component_digest(component)
    contract.pop("contractFingerprint", None)
    validated = validate_contract(contract)
    CONTRACT.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")
    row["contractSha256"] = sha256(CONTRACT)
    row["contractFingerprint"] = validated["contractFingerprint"]
    authority["status"] = "FOUNDER_CONFIRMED_DEFECT_REPAIR_PENDING_VERIFICATION"
    authority.pop("verification", None)
    authority.pop("exceptions", None)
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n", encoding="utf-8")
    for path in (MANIFEST, LEG3):
        data = json.loads(path.read_text(encoding="utf-8"))
        data["status"] = "FOUNDER_CONFIRMED_DEFECT_REPAIR_PENDING_VERIFICATION"
        data["founderDefectRepair"] = {
            "status": "IMPLEMENTED_PENDING_INDEPENDENT_VERIFICATION",
            "affectedPresentationChairs": 253,
            "unaffectedInheritedZeroingChairs": 1,
            "correctedRegistrationChairs": [QT_ID],
        }
        path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "IMPLEMENTED_PENDING_INDEPENDENT_VERIFICATION",
        "sharedPresentationAffected": 253,
        "inheritedZeroingUnaffected": 1,
        "registrationCorrected": [QT_ID],
        "contractFingerprint": validated["contractFingerprint"],
    }, indent=2))


if __name__ == "__main__":
    main()
