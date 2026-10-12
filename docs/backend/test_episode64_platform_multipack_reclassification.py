#!/usr/bin/env python3
import hashlib
import json
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "docs/backend/registries/episode64_platform_population_registry.json"
FA = ROOT / "docs/backend/registries/episode64_platform_founder_acceptance_registry.json"
THE13 = ROOT / "docs/authority-evidence/platform/episode64-platform-multipack-reclassification-2026-10-11/SCZN3_EP64_THE13_POPULATION_INTEGRITY_MATRIX.json"


class MultipackReclassificationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(REGISTRY.read_text())
        cls.records = cls.data["records"]
        cls.by_master = {r["masterNumber"]: r for r in cls.records}

    def test_all_records_preserved_once(self):
        self.assertEqual(len(self.records), 1993)
        self.assertEqual(len({r["censusFaceKey"] for r in self.records}), 1993)
        self.assertEqual(sum(Counter(r["populationClassification"] for r in self.records).values()), 1993)

    def test_classification_census(self):
        actual = Counter(r["populationClassification"] for r in self.records)
        self.assertEqual(actual, Counter({
            "INDIVIDUAL_FACE": 1485,
            "IDENTICAL_MULTIPACK": 446,
            "ASSORTMENT_PACK": 61,
            "COMMERCIAL_CONTAINER": 1,
        }))
        self.assertEqual(actual["UNRESOLVED"], 0)
        self.assertEqual(self.data["summary"]["verifiedUniqueShootableFaceMinimum"], 1860)

    def test_founder_authority_is_lossless(self):
        prior = {r["censusFaceKey"]: r for r in json.loads(FA.read_text())["records"]}
        for r in self.records:
            p = prior[r["censusFaceKey"]]
            self.assertEqual(r["founderAuthority"]["status"], p["founderStatus"])
            self.assertEqual(r["founderAuthority"]["currentScope"], p["currentScope"])

    def test_packages_never_enter_executable_selection(self):
        for r in self.records:
            if r["populationClassification"] in {"ASSORTMENT_PACK", "COMMERCIAL_CONTAINER", "UNRESOLVED"}:
                self.assertFalse(r["executableFaceSelection"]["eligible"], r["censusFaceKey"])

    def test_founder_approved_oos_and_hold_never_reenter_selection(self):
        for r in self.records:
            if r["founderAuthority"]["status"] != "UNVERIFIED":
                self.assertFalse(r["executableFaceSelection"]["eligible"], r["censusFaceKey"])

    def test_known_pack_and_face_examples(self):
        self.assertEqual(self.by_master[5]["populationClassification"], "ASSORTMENT_PACK")
        self.assertEqual(self.by_master[49]["populationClassification"], "IDENTICAL_MULTIPACK")
        self.assertEqual(self.by_master[156]["populationClassification"], "ASSORTMENT_PACK")
        self.assertEqual(self.by_master[169]["populationClassification"], "INDIVIDUAL_FACE")

    def test_source_hashes_and_the13(self):
        for source in self.data["sources"].values():
            self.assertEqual(hashlib.sha256((ROOT / source["path"]).read_bytes()).hexdigest(), source["sha256"])
        rows = json.loads(THE13.read_text())
        self.assertEqual(len(rows), 13)
        self.assertEqual(next(x for x in rows if x["masterNumber"] == 156)["eligibilityEffect"], "INELIGIBLE_PACKAGE_OR_UNRESOLVED")
        self.assertTrue(all(not x["replacementSelected"] for x in rows))


if __name__ == "__main__":
    unittest.main()
