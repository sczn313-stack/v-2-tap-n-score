#!/usr/bin/env python3
"""Reconcile the Founder-confirmed QT transform and 530 registration repairs."""
from __future__ import annotations

import json
import hashlib
import sys
from pathlib import Path


DOCS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(DOCS / "backend"))
from target_execution_contract import component_digest, validate_contract  # noqa: E402
PACKET_DIR = DOCS / "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23"
AUTHORITY = DOCS / "backend/target_knowledge/qt_episode64_smart_target_authority.json"
CONTRACT = DOCS / "backend/target_execution_contracts/contracts/qt_printer13_product_1873655562313_target_scoring_v1.json"
MANIFEST = DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22/QT_EP64_254_IMPLEMENTATION_MANIFEST.json"
LEG3 = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_LEG3_EXECUTION_MANIFEST.json"
LIFECYCLE = PACKET_DIR / "QT_HOMIE_254_CORRECTED_LIFECYCLE_VERIFICATION.json"
BROWSER = PACKET_DIR / "QT_FOUNDER_TRANSFORM_CLASSIFICATION_BROWSER_VERIFICATION.json"
VERIFICATION = PACKET_DIR / "QT_FOUNDER_CONFIRMED_DEFECT_REPAIR_VERIFICATION.json"
REPORT = PACKET_DIR / "QT_FOUNDER_CONFIRMED_DEFECT_REPAIR_REPORT.md"
QT_530 = "QT-PRODUCT-1873655562313"

EXPECTED_530_REGIONS = [
    ("bull_1", .112, .088472, .366, .306971),
    ("bull_2", .658, .087131, .898, .310992),
    ("bull_3", .390, .348525, .640, .576408),
    ("bull_4", .112, .609920, .366, .837802),
    ("bull_5", .640, .615282, .886, .839142),
]


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    authority = load(AUTHORITY)
    lifecycle = load(LIFECYCLE)
    browser = load(BROWSER)
    contract = load(CONTRACT)
    chairs = authority["chairs"]
    row530 = next(row for row in chairs if row["qtCatalogId"] == QT_530)
    contract["components"]["mission"]["definition"]["founderDefectRepair"]["status"] = "VERIFIED_FOUNDER_ACCEPTANCE_PENDING"
    for component in contract["components"].values():
        component["digest"] = component_digest(component)
    contract.pop("contractFingerprint", None)
    validated_contract = validate_contract(contract)
    CONTRACT.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")
    row530["contractSha256"] = sha256(CONTRACT)
    row530["contractFingerprint"] = validated_contract["contractFingerprint"]
    regions = contract["components"]["geometry"]["definition"]["regions"]
    actual_regions = [
        (row["regionId"], row["xMin"], row["yMin"], row["xMax"], row["yMax"])
        for row in regions
    ]
    css = (DOCS / "target-experience.css").read_text(encoding="utf-8")
    checks = {
        "authorityHas254UniqueChairs": len(chairs) == 254 and len({row["qtCatalogId"] for row in chairs}) == 254,
        "sharedRoadHas253Contracts": sum(bool(row.get("contractPath")) for row in chairs) == 253,
        "inheritedZeroingRoadIsSeparate": sum(not row.get("contractPath") for row in chairs) == 1,
        "statusBlockCannotReflowTarget": ".contract-intro #contractStatus{height:3.6em;overflow:auto" in css,
        "browserRenderedProjectionPass": browser.get("status") == "PASS" and browser.get("renderedProjectionRuns") == 8,
        "browserCoversNarrowAndDesktop": browser.get("viewports") == [{"width": 320, "height": 900}, {"width": 1280, "height": 900}],
        "browserCoversAspectExtremesAndFounderTargets": len(browser.get("aspectRepresentatives", [])) == 4,
        "browserCoversEveryLifecycleProjection": browser.get("verifiedStages") == ["TARGET", "RESULT", "SEC", "VAULT", "exact reopen"],
        "lifecycle254Pass": lifecycle.get("status") == "PASS" and lifecycle.get("pass") == 254 and lifecycle.get("fail") == 0,
        "numericCoordinatePersistence254Pass": lifecycle.get("coordinateFidelityPass") == 254,
        "vaultEvidence254Pass": lifecycle.get("vaultEvidencePass") == 254,
        "vaultResult254Pass": lifecycle.get("vaultResultPass") == 254,
        "targetFit254Pass": lifecycle.get("targetFitAspectPass") == 254,
        "scoringCounting253Pass": lifecycle.get("scoringCountingReconciliationPass") == 253,
        "530CapabilityPreserved": row530["highestTruthfulCapability"] == "Zone / Object Counting",
        "530SemanticRegionIdsPreserved": [row[0] for row in actual_regions] == [row[0] for row in EXPECTED_530_REGIONS],
        "530FaceRegistrationExact": actual_regions == EXPECTED_530_REGIONS,
        "530FounderReplay10Of10": browser.get("founder530") == {
            "totalTaps": 10,
            "validBullHits": 10,
            "missed": 0,
            "bullsHit": 5,
            "bullCount": 5,
            "tapsPerBull": [2, 2, 2, 2, 2],
            "exactReopenMarkers": 10,
        },
    }
    failures = [name for name, passed in checks.items() if not passed]
    status = "PASS" if not failures else "FAIL"
    verification = {
        "schemaVersion": "sczn3.qt-founder-confirmed-defect-repair-verification.v1",
        "status": status,
        "founderAcceptance": "PENDING",
        "scope": {
            "allQtChairsRescoped": 254,
            "sharedTargetExperiencePresentationChairs": 253,
            "inheritedZeroingChairsUnaffected": 1,
            "registrationCorrectedChairs": 1,
            "registrationCorrectedIds": [QT_530],
        },
        "firstDivergence": {
            "tapDisplay": "TARGET presentation reflow immediately after click: wrapped status feedback increased the auto-height intro block and moved the rendered image after the physical click was captured.",
            "storedCoordinates": "No divergence found; normalized source-image coordinates remained invariant through RESULT, SEC, Vault, and exact reopen.",
            "530Classification": "Registered Bull 1-5 geometry used a generic 3-top/2-bottom layout that did not match the preserved 530 face's 2-top/1-middle/2-bottom layout.",
        },
        "rootCause": {
            "tapDisplay": "Rendered image bounds changed after the click because the status element above the target had content-dependent height; the overlay correctly followed the moved image, so it no longer occupied the original screen point.",
            "530Classification": "Implementation registration defect in one contract, not a Homie semantic-treatment defect and not a stored-coordinate defect.",
            "falsePriorPass": "The prior coordinate test asserted numeric lifecycle equality and generated test observations from the same registered geometry. It never compared a real browser click to the post-feedback rendered image, and it could not independently challenge malformed 530 registration.",
        },
        "repair": {
            "presentation": "Fixed the status block height so feedback text cannot reposition the rendered target; normalization and overlays continue to use actual rendered image bounds.",
            "registration530": "Replaced only Bull 1-5 extents with pixel-measured outer extents from the preserved 500x746 source face; identities, capability, labels, and semantics are unchanged.",
            "verification": "Added real-browser click/projection checks at narrow and desktop widths across the two Founder targets plus aspect-ratio extremes, and an independent 10-tap 530 replay through exact reopen.",
        },
        "results": {
            "renderedProjectionRuns": browser.get("renderedProjectionRuns"),
            "renderedProjectionRepresentatives": browser.get("aspectRepresentatives"),
            "lifecyclePass": lifecycle.get("pass"),
            "lifecycleFail": lifecycle.get("fail"),
            "numericCoordinatePersistencePass": lifecycle.get("coordinateFidelityPass"),
            "scoringCountingReconciliationPass": lifecycle.get("scoringCountingReconciliationPass"),
            "scoringCountingReconciliationApplicable": lifecycle.get("scoringCountingReconciliationApplicable"),
            "vaultEvidencePass": lifecycle.get("vaultEvidencePass"),
            "vaultResultPass": lifecycle.get("vaultResultPass"),
            "targetFitAspectPass": lifecycle.get("targetFitAspectPass"),
            "founder530": browser.get("founder530"),
        },
        "checks": checks,
        "failures": failures,
        "evidence": {
            "browserVerification": str(BROWSER.relative_to(DOCS)),
            "lifecycleVerification": str(LIFECYCLE.relative_to(DOCS)),
        },
    }
    VERIFICATION.write_text(json.dumps(verification, indent=2) + "\n", encoding="utf-8")
    if failures:
        raise AssertionError(f"Founder repair verification failed: {failures}")

    report = f"""# QT Founder Review — Confirmed Defect Repair

Status: **PASS — Founder acceptance pending**

## Root cause and first divergence

- Tap display: the first divergence occurred in TARGET presentation immediately after the click. Status feedback wrapped, increased the intro block height, and moved the rendered image. The saved source-image coordinate did not move.
- 530 classification: the contract registered a generic 3-top/2-bottom bull layout against artwork that is 2-top/1-middle/2-bottom. This was a one-chair implementation-registration defect.
- Prior false PASS: tests checked internal numeric equality and generated observations from the same geometry under test; they did not assert the original physical browser click against post-feedback rendered bounds or independently challenge 530 registration.

## Scope and repair

- 254/254 QT chairs rescoped.
- 253 contract-driven chairs share the repaired target-experience presentation road.
- 1 inherited Zeroing chair uses a separate road and is unaffected.
- 1/254 chair required registration correction: `{QT_530}` (530 Paper Target).
- Homie's capability, target meaning, and region identities were preserved.

## Verification

- Real rendered projection: **{browser['renderedProjectionRuns']}/{browser['renderedProjectionRuns']} PASS** across narrow and desktop viewports, 5-Spot, 530, and QT aspect-ratio extremes.
- Lifecycle: **{lifecycle['pass']}/254 PASS**, **{lifecycle['fail']} FAIL**.
- Coordinate persistence: **{lifecycle['coordinateFidelityPass']}/254 PASS**.
- Scoring/counting reconciliation: **{lifecycle['scoringCountingReconciliationPass']}/{lifecycle['scoringCountingReconciliationApplicable']} PASS**.
- Vault evidence: **{lifecycle['vaultEvidencePass']}/254 PASS**.
- Vault result: **{lifecycle['vaultResultPass']}/254 PASS**.
- Target fit/aspect: **{lifecycle['targetFitAspectPass']}/254 PASS**.
- 530 Founder replay: **10 total · 10 valid bull hits · 0 missed · 5/5 bulls · 2 taps per bull**, preserved through exact reopen.

Automated repair verification is complete. **Founder visual acceptance remains pending.**
"""
    REPORT.write_text(report, encoding="utf-8")

    authority["status"] = "FOUNDER_CONFIRMED_DEFECT_REPAIR_VERIFIED_254_OF_254"
    authority["founderDefectRepairVerification"] = str(VERIFICATION.relative_to(DOCS))
    authority["founderDefectRepairBrowserVerification"] = str(BROWSER.relative_to(DOCS))
    row530["founderDefectRepair"]["status"] = "VERIFIED_FOUNDER_ACCEPTANCE_PENDING"
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n", encoding="utf-8")
    for path in (MANIFEST, LEG3):
        data = load(path)
        data["status"] = "FOUNDER_CONFIRMED_DEFECT_REPAIR_VERIFIED_254_OF_254"
        data["founderDefectRepair"].update({
            "status": "VERIFIED_FOUNDER_ACCEPTANCE_PENDING",
            "verificationPath": str(VERIFICATION.relative_to(DOCS)),
            "browserVerificationPath": str(BROWSER.relative_to(DOCS)),
            "lifecyclePass": 254,
            "lifecycleFail": 0,
        })
        path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print("PASS QT Founder confirmed defect repair: 254/254 rescoped, 530 10/10, Founder acceptance pending")


if __name__ == "__main__":
    main()
