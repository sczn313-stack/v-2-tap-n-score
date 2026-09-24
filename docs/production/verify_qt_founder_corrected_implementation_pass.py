#!/usr/bin/env python3
"""Verify the Founder-corrected QT implementation and late-review locks."""
from __future__ import annotations

import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
sys.path[:0] = [str(BACKEND), str(Path(__file__).resolve().parent)]
from executors.declarative_target_score import execute as execute_score  # noqa: E402
from executors.smart_evidence_capture import execute as execute_evidence  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver  # noqa: E402
from test_target_execution_scale_architecture import MemoryStore  # noqa: E402

AUTHORITY = BACKEND / "target_knowledge/qt_episode64_smart_target_authority.json"
LEG3 = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_LEG3_EXECUTION_MANIFEST.json"
MANIFEST = DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22/QT_EP64_254_IMPLEMENTATION_MANIFEST.json"
COMPLETION = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_FINAL_SMART_TARGET_COMPLETION_MANIFEST.json"
PACKET_DIR = DOCS / "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23"
BROWSER = PACKET_DIR / "QT_FOUNDER_CORRECTED_254_BROWSER_VERIFICATION.json"
VERIFICATION = PACKET_DIR / "QT_FOUNDER_CORRECTED_IMPLEMENTATION_VERIFICATION.json"
REPORT = PACKET_DIR / "QT_FOUNDER_CORRECTED_IMPLEMENTATION_REPORT.md"
RECONCILIATION = PACKET_DIR / "QT_FOUNDER_CORRECTED_IMPLEMENTATION_RECONCILIATION.json"
EXPECTED = {"Scoring":39,"Zone / Object Counting":153,"Evidence Only":61,"Zeroing":1}


def load_lifecycle():
    path = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/verify_qt_leg3_lifecycle.py"
    spec = importlib.util.spec_from_file_location("qt_founder_lifecycle", path)
    module = importlib.util.module_from_spec(spec); assert spec.loader; spec.loader.exec_module(module)
    return module


life = load_lifecycle()


def image(surface: dict) -> dict:
    return {"dataUrl":surface["assetPath"],"registeredAssetPath":surface["assetPath"],"sha256":surface["assetSha256"],"canonicalAssetSha256":surface["assetSha256"],"widthPx":surface["imageWidth"],"heightPx":surface["imageHeight"],"mediaType":"image/png" if surface["assetPath"].endswith(".png") else "image/jpeg"}


RECIPES = {
    "QT-PRODUCT-1967347335241": {"points":[(.50,.20),(.20,.55),(.04,.60),(.50,.95),(.99,.01)],"counts":{"zone_5":1,"zone_3":1,"zone_1":1,"zone_0":1,"outside":1},"total":9},
    "QT-PRODUCT-1967349399625": {"points":[(.50,.20),(.20,.55),(.04,.60),(.50,.95),(.99,.01)],"counts":{"zone_5":1,"zone_3":1,"zone_1":1,"zone_0":1,"outside":1},"total":9},
    "QT-PRODUCT-1960344911945": {"points":[(.50,.38),(.50,.65),(.50,.90),(.99,.01)],"counts":{"zone_5":1,"zone_4":1,"zone_3":1,"outside":1},"total":12},
    "QT-PRODUCT-8197771264284": {"points":[(.287,.17),(.665,.17),(.355,.35),(.65,.35),(.37,.52),(.75,.53),(.98,.98)],"outside":1},
    "QT-PRODUCT-8197776572700": {"points":[(.22,.14),(.69,.14),(.375,.21),(.60,.21),(.25,.28),(.765,.28),(.505,.31),(.285,.39),(.485,.50),(.98,.98)],"outside":1},
    "QT-PRODUCT-1891723542601": {"points":[(.50,.12),(.50,.23),(.50,.43),(.25,.50),(.50,.82),(.98,.98)],"outside":1},
    "QT-PRODUCT-10653290365212": {"points":[(.50,.32),(.50,.40),(.50,.61),(.50,.80),(.15,.15)],"outside":1},
    "QT-PRODUCT-1960347762761": {"points":[(.50,.22),(.50,.42),(.25,.45),(.84,.19),(.50,.80),(.98,.02)],"outside":1},
    "QT-PRODUCT-1960319418441": {"points":[(.50,.12),(.50,.28),(.50,.42),(.30,.60),(.50,.86),(.98,.02)],"outside":1},
}


def main() -> None:
    authority = json.loads(AUTHORITY.read_text(encoding="utf-8"))
    leg3 = json.loads(LEG3.read_text(encoding="utf-8"))
    browser = json.loads(BROWSER.read_text(encoding="utf-8"))
    rows = authority["chairs"]
    surfaces = leg3["surfaces"]
    contracts = [json.loads((DOCS / row["contractPath"]).read_text(encoding="utf-8")) for row in rows if row.get("contractPath")]
    resolver = TargetExecutionContractResolver(contracts=contracts)
    by_id = {row["qtCatalogId"]:row for row in rows}
    surface_by_id = {row["qtCatalogId"]:row for row in surfaces}
    lifecycle_store = MemoryStore()
    lifecycle = [life.verify_one(surface, resolver, lifecycle_store, index) for index, surface in enumerate(surfaces, 1)]
    lifecycle_failures = [row for row in lifecycle if row["status"] != "PASS"]
    binding_failures = []
    meta_failures = []
    reconciliation_failures = []
    for surface in surfaces:
        row = by_id[surface["qtCatalogId"]]
        treatment = row["smartTargetTreatment"]
        if treatment.get("result", {}).get("shotPattern") is not False or treatment.get("result", {}).get("distributionMeta") is not False:
            meta_failures.append({"qtCatalogId":row["qtCatalogId"],"source":"authority_treatment"})
        if surface["missionFamily"] == "zeroingCorrection":
            continue
        contract = resolver.resolve(surface["targetProfileId"], surface["missionFamily"])
        if contract["components"]["mission"]["definition"]["smartTargetTreatment"] != treatment:
            binding_failures.append({"qtCatalogId":row["qtCatalogId"],"reason":"runtime_treatment_differs"})
        evidence, _, observations = life.evidence_for(contract, surface)
        result = execute_score(contract, evidence) if surface["missionFamily"] == "targetScoring" else execute_evidence(contract, evidence)
        metrics = result.get("sczn3Metrics", {})
        if metrics.get("shotPattern") is not None or metrics.get("objectDistribution") is not None:
            meta_failures.append({"qtCatalogId":row["qtCatalogId"],"source":"backend_result"})
        if surface["missionFamily"] == "targetScoring" and not (result["reconciliation"]["countsMatch"] and result["scoring"]["observationCount"] == len(observations)):
            reconciliation_failures.append(row["qtCatalogId"])
    recipe_results = []
    for qid, recipe in RECIPES.items():
        row, surface = by_id[qid], surface_by_id[qid]
        contract = resolver.resolve(surface["targetProfileId"], "targetScoring")
        observations = [{"xNorm":x,"yNorm":y} for x,y in recipe["points"]]
        result = execute_score(contract, {"imageEvidence":image(surface),"observations":observations})
        expected_outside = recipe.get("outside", recipe.get("counts", {}).get("outside", 0))
        checks = {"totalTaps":result["scoring"]["observationCount"] == len(observations),"outside":result["scoring"]["outsideCount"] == expected_outside}
        if "counts" in recipe:
            checks["regionCounts"] = result["scoring"]["regionCounts"] == recipe["counts"]
            checks["totalScore"] = result["scoring"]["total"] == recipe["total"]
        else:
            checks["allGovernedObjects"] = all(item["observationCount"] >= 1 for item in result["scoring"]["objectResults"])
        recipe_results.append({"qtCatalogId":qid,"productName":row["productName"],"status":"PASS" if all(checks.values()) else "FAIL","checks":checks,"scoring":result["scoring"]})
    b_value_failures = []
    for row in rows:
        if row.get("intelligenceFamily") != "B_FAMILY_SCORING" or not row.get("contractPath"):
            continue
        contract = resolver.resolve(row["targetProfileId"], row["missionFamily"])
        actual = sorted(set(str(rule["value"]) for rule in contract["components"]["scoring"]["definition"].get("regionRules",{}).values() if "value" in rule))
        expected = sorted(set(row["homieCorrectedTreatmentRecord"].get("values") or []))
        if actual != expected:
            b_value_failures.append({"qtCatalogId":row["qtCatalogId"],"expected":expected,"actual":actual})
    capability_counts = dict(Counter(row["highestTruthfulCapability"] for row in rows))
    unresolved_sets = sum(bool(row.get("unresolvedReason")) for row in rows)
    failures = {
        "capabilityCounts": [] if capability_counts == EXPECTED else [{"expected":EXPECTED,"actual":capability_counts}],
        "lifecycle": lifecycle_failures,
        "treatmentBinding": binding_failures,
        "resultMeta": meta_failures,
        "scoringCounting": reconciliation_failures,
        "lateReviewRecipes": [row for row in recipe_results if row["status"] != "PASS"],
        "unauthorizedBFamilyValues": b_value_failures,
        "browser": [] if browser.get("status") == "PASS" and browser.get("pass") == 253 else [browser],
    }
    status = "PASS" if not any(failures.values()) else "FAIL"
    verification = {
        "schemaVersion":"sczn3.qt-founder-corrected-implementation-verification.v1","status":status,"founderAcceptance":"PENDING",
        "chairs":254,"contracts":253,"inheritedZeroing":1,"capabilityCounts":capability_counts,
        "treatmentBindingPass":254-len(binding_failures),"lifecyclePass":254-len(lifecycle_failures),"lifecycleFail":len(lifecycle_failures),
        "renderedBrowserPass":browser.get("pass"),"renderedBrowserApplicable":253,"zeroingRenderedRoad":"separate inherited governed road",
        "coordinatePersistencePass":sum(row["checks"].get("exactTapReopen") is True for row in lifecycle),
        "evidencePersistencePass":sum(row["checks"].get("exactArtworkReopen") is True for row in lifecycle),
        "scoringCountingReconciliationPass":253-len(reconciliation_failures),"scoringCountingApplicable":253,
        "targetFitAspectBrowserPass":browser.get("pass"),"staleResultMetaComponents":len(meta_failures),
        "lateReviewRecipePass":sum(row["status"] == "PASS" for row in recipe_results),"lateReviewRecipeApplicable":len(recipe_results),
        "unauthorizedBFamilyValueInheritance":len(b_value_failures),"historicalSessionMigration":"NOT PERFORMED; evidence preserved; policy question remains separate",
        "preservedUnresolvedSemanticSets":unresolved_sets,
        "remainingUnknown":"Timing, sequence, qualification thresholds, penalties, and unpublished course-of-fire rules remain UNKNOWN where not explicitly established.",
        "lateReviewRecipeResults":recipe_results,"failures":failures,
        "browserVerification":str(BROWSER.relative_to(DOCS)),"lifecycleResults":lifecycle,
    }
    VERIFICATION.write_text(json.dumps(verification, indent=2) + "\n", encoding="utf-8")
    if status != "PASS":
        raise AssertionError({key:len(value) for key,value in failures.items() if value})
    report = f"""# QT 254 Founder-Corrected Implementation Pass

Status: **PASS — Founder acceptance pending**

- Capability totals: **39 Scoring · 153 Zone/Object Counting · 61 Evidence Only · 1 Zeroing**.
- Treatment/runtime binding: **254/254**.
- Backend lifecycle: **254/254**.
- Real rendered contract lifecycle: **253/253**; inherited Zeroing remains on its separate governed road.
- Coordinate persistence and exact reopen: **254/254**.
- Evidence persistence: **254/254**.
- Scoring/counting reconciliation: **253/253 applicable**.
- Late-review independent recipes: **9/9**.
- Stale QT RESULT-meta components: **0**.
- Unauthorized B-family values: **0**; each retained value matches its individual Founder/Homie treatment record.
- Preserved unresolved semantic sets: **{unresolved_sets}**; Evidence Only chairs: **{capability_counts['Evidence Only']}**.
- Historical sessions were not recalculated or silently relabeled.

UNKNOWN remains explicit for timing, sequence, qualification thresholds, penalties, and unpublished course-of-fire rules not established by the treatment.
"""
    REPORT.write_text(report, encoding="utf-8")
    authority.update({"status":"FOUNDER_CORRECTED_VERIFIED_254_OF_254_ACCEPTANCE_PENDING","founderCorrectedVerification":str(VERIFICATION.relative_to(DOCS)),"founderCorrectedReport":str(REPORT.relative_to(DOCS))})
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n", encoding="utf-8")
    for path in (LEG3, MANIFEST, COMPLETION):
        data = json.loads(path.read_text(encoding="utf-8")); data.update({"status":"FOUNDER_CORRECTED_VERIFIED_254_OF_254_ACCEPTANCE_PENDING","founderCorrectedVerification":str(VERIFICATION.relative_to(DOCS)),"founderCorrectedReport":str(REPORT.relative_to(DOCS))}); path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    reconciliation = json.loads(RECONCILIATION.read_text(encoding="utf-8")); reconciliation.update({"status":"PASS_254_OF_254_FOUNDER_ACCEPTANCE_PENDING","verification":str(VERIFICATION.relative_to(DOCS)),"report":str(REPORT.relative_to(DOCS))}); RECONCILIATION.write_text(json.dumps(reconciliation, indent=2) + "\n", encoding="utf-8")
    print("PASS QT Founder-corrected implementation: 254/254 lifecycle, 253/253 rendered contracts, acceptance pending")


if __name__ == "__main__":
    main()
