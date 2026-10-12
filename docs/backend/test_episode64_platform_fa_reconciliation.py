#!/usr/bin/env python3
import json
import hashlib
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "docs/backend/registries/episode64_platform_founder_acceptance_registry.json"
MATRIX = ROOT / "docs/authority-evidence/platform/episode64-platform-founder-acceptance-reconciliation-2026-10-11/SCZN3_EP64_THE13_CORRECTED_ELIGIBILITY_MATRIX.json"


class ReconciliationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(REGISTRY.read_text())
        cls.records = cls.data["records"]

    def test_complete_unique_census(self):
        self.assertEqual(len(self.records), 1993)
        self.assertEqual(len({r["censusFaceKey"] for r in self.records}), 1993)
        self.assertEqual(sum(Counter(r["founderStatus"] for r in self.records).values()), 1993)

    def test_selection_never_reoffers_approved_oos_or_hold(self):
        for r in self.records:
            if r["founderStatus"] != "UNVERIFIED":
                self.assertFalse(r["librarySelection"]["eligibleForFounderReview"], r["censusFaceKey"])

    def test_known_reconciled_ten_states(self):
        by_runtime = {runtime: r for r in self.records for runtime in r["runtimeIds"]}
        self.assertEqual(by_runtime["blocker_baker_targets_gf_duck_hunt"]["founderStatus"], "FOUNDER_OOS")
        self.assertEqual(by_runtime["evidence_speedwell_targets_ar_5_10"]["founderStatus"], "FOUNDER_APPROVED")
        self.assertEqual(by_runtime["evidence_the_national_target_company_nra_a_17"]["founderStatus"], "FOUNDER_APPROVED")

    def test_qt_checkpoint_exact_census(self):
        qt = [r for r in self.records if r["printer"] == "Qualification Targets"]
        self.assertEqual(len(qt), 254)
        self.assertEqual(sum(r["founderStatus"] == "FOUNDER_HOLD" for r in qt), 3)
        self.assertEqual(sum(r["founderStatus"] in {"FOUNDER_APPROVED", "FOUNDER_APPROVED_INHERITED"} for r in qt), 251)

    def test_the13_is_exact_and_conservative(self):
        rows = json.loads(MATRIX.read_text())
        self.assertEqual(len(rows), 13)
        self.assertEqual(sum(r["recommendation"] == "REPLACE RECOMMENDED" for r in rows), 5)
        self.assertEqual(sum(r["recommendation"] == "HOLD" for r in rows), 8)

    def test_evidence_manifest_hashes(self):
        path = ROOT / "docs/authority-evidence/platform/episode64-platform-founder-acceptance-reconciliation-2026-10-11/EVIDENCE_SOURCE_MANIFEST.json"
        manifest = json.loads(path.read_text())
        for source in manifest["authoritativeSources"]:
            actual = hashlib.sha256((ROOT / source["path"]).read_bytes()).hexdigest()
            self.assertEqual(actual, source["sha256"], source["path"])


if __name__ == "__main__":
    unittest.main()
