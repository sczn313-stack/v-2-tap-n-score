"""Validate SCZN3 target knowledge manifests.

This is intentionally lightweight and standard-library only.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List

ROOT = Path(__file__).resolve().parent
MANIFEST_DIR = ROOT / "manifests"
UNKNOWN = "UNKNOWN / REQUIRES OFFICIAL SOURCE"

TOP_LEVEL_REQUIRED = [
    "schemaVersion",
    "targetIdentity",
    "authorityClassification",
    "instructionAuthority",
    "geometryAuthority",
    "evidenceRequirements",
    "unknowns",
    "sourceAudit",
]

SECTION_REQUIRED = {
    "targetIdentity": [
        "targetId",
        "targetName",
        "targetFamily",
        "targetType",
        "discipline",
        "guidanceMode",
    ],
    "authorityClassification": [
        "primaryAuthorityType",
        "geometryAuthorityLevel",
        "instructionAuthorityLevel",
        "sourceConfidence",
    ],
    "instructionAuthority": [
        "designerInstructions",
        "printedTargetText",
        "officialRules",
        "courseOfFire",
        "intendedUse",
        "shotCount",
        "distance",
        "passFailOrScoringRules",
    ],
    "geometryAuthority": [
        "knownGeometryFields",
        "gridSpacing",
        "bullCount",
        "zoneCount",
        "aimPointRules",
        "scoringZones",
        "ringGeometry",
    ],
    "evidenceRequirements": [
        "requiredAimPoint",
        "requiredImpactCount",
        "requiredDistance",
        "requiredSetupFields",
        "minimumConfidenceRequirements",
    ],
}


def require_keys(container: Dict[str, Any], keys: Iterable[str], label: str, errors: List[str]) -> None:
    for key in keys:
        if key not in container:
            errors.append(f"{label}: missing {key}")


def validate_manifest(path: Path) -> List[str]:
    errors: List[str] = []
    try:
        data = json.loads(path.read_text())
    except Exception as exc:  # pragma: no cover - command-line guard
        return [f"{path.name}: invalid JSON: {exc}"]

    require_keys(data, TOP_LEVEL_REQUIRED, path.name, errors)
    for section, keys in SECTION_REQUIRED.items():
        value = data.get(section)
        if not isinstance(value, dict):
            errors.append(f"{path.name}: {section} must be an object")
            continue
        require_keys(value, keys, f"{path.name}.{section}", errors)

    target_id = data.get("targetIdentity", {}).get("targetId")
    if not target_id:
        errors.append(f"{path.name}: targetId must be non-empty")

    unknowns = data.get("unknowns")
    if not isinstance(unknowns, list):
        errors.append(f"{path.name}: unknowns must be a list")
    else:
        for index, item in enumerate(unknowns):
            if not isinstance(item, dict):
                errors.append(f"{path.name}: unknowns[{index}] must be an object")
                continue
            if item.get("status") != UNKNOWN:
                errors.append(f"{path.name}: unknowns[{index}].status must be {UNKNOWN!r}")
            if not item.get("field"):
                errors.append(f"{path.name}: unknowns[{index}].field must be non-empty")
            if not item.get("neededSource"):
                errors.append(f"{path.name}: unknowns[{index}].neededSource must be non-empty")

    source_audit = data.get("sourceAudit")
    if not isinstance(source_audit, list) or not source_audit:
        errors.append(f"{path.name}: sourceAudit must contain at least one source")

    return errors


def main() -> int:
    errors: List[str] = []
    manifests = sorted(MANIFEST_DIR.glob("*.json"))
    if not manifests:
        errors.append("no manifests found")
    for manifest in manifests:
        errors.extend(validate_manifest(manifest))
    if errors:
        print("FAIL target knowledge validation")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"PASS {len(manifests)} target knowledge manifests")
    return 0


if __name__ == "__main__":
    sys.exit(main())
