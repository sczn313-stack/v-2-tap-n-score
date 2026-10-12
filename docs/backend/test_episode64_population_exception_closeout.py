#!/usr/bin/env python3
import hashlib
import json
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "docs/backend/registries/episode64_platform_population_registry.json"
FA = ROOT / "docs/backend/registries/episode64_platform_founder_acceptance_registry.json"
DISPOSITIONS = ROOT / "docs/backend/registries/episode64_population_exception_dispositions.json"
SOURCE = ROOT / "docs/authority-evidence/platform/episode64-platform-multipack-reclassification-2026-10-11/UNRESOLVED_AND_INCOMPLETE_CASES.json"
OUT = ROOT / "docs/authority-evidence/platform/episode64-population-exception-closeout-2026-10-11"


class PopulationExceptionCloseoutTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry = json.loads(REGISTRY.read_text())
        cls.records = cls.registry["records"]
        cls.by_key = {x["censusFaceKey"]: x for x in cls.records}
        cls.dispositions = json.loads(DISPOSITIONS.read_text())["cases"]

    def test_exact_16_case_scope(self):
        source = json.loads(SOURCE.read_text())
        expected = {x["censusFaceKey"] for x in source["unresolvedRecords"]}
        expected |= {x["censusFaceKey"] for x in source["assortmentsWithoutCompleteVerifiedRoster"]}
        self.assertEqual(len(expected), 16)
        self.assertEqual({x["censusFaceKey"] for x in self.dispositions}, expected)
        self.assertEqual(len(self.dispositions), 16)

    def test_disposition_census(self):
        self.assertEqual(Counter(x["disposition"] for x in self.dispositions), Counter({
            "RESOLVED": 11, "HOLD": 5,
        }))
        self.assertEqual(self.registry["summary"]["exceptionCloseout"], {
            "processed": 16, "resolved": 11, "oos": 0, "hold": 5,
        })

    def test_population_is_preserved_and_recalculated(self):
        self.assertEqual(len(self.records), 1993)
        self.assertEqual(len(self.by_key), 1993)
        self.assertEqual(Counter(x["populationClassification"] for x in self.records), Counter({
            "INDIVIDUAL_FACE": 1485,
            "IDENTICAL_MULTIPACK": 446,
            "ASSORTMENT_PACK": 61,
            "COMMERCIAL_CONTAINER": 1,
        }))
        self.assertEqual(self.registry["summary"]["verifiedUniqueShootableFaceMinimum"], 1860)
        self.assertEqual(self.registry["summary"]["unresolvedAssortmentsWithoutCompleteRoster"], 5)
        self.assertFalse(self.registry["summary"]["exactUniqueFaceCountProven"])

    def test_resolved_identity_cases_have_canonical_keys(self):
        for master in (305, 306, 309, 310):
            record = next(x for x in self.records if x["masterNumber"] == master)
            self.assertEqual(record["populationClassification"], "INDIVIDUAL_FACE")
            self.assertEqual(record["canonicalFaceId"], record["censusFaceKey"])
            self.assertEqual(record["exceptionDisposition"]["status"], "RESOLVED")
        squirrel = next(x for x in self.records if x["masterNumber"] == 1212)
        self.assertEqual(squirrel["populationClassification"], "COMMERCIAL_CONTAINER")
        self.assertEqual(squirrel["packageRelationship"]["verifiedComponentFaceCount"], 2)
        self.assertEqual({x["scope"] for x in squirrel["packageRelationship"]["verifiedComponents"]}, {
            "ACTIVE", "FOUNDER_OOS_PRESERVED",
        })

    def test_package_rosters_and_holds(self):
        for master, count in {1062: 4, 1258: 1, 1590: 4, 1598: 6, 1609: 4, 1729: 4}.items():
            record = next(x for x in self.records if x["masterNumber"] == master)
            self.assertTrue(record["packageRelationship"]["componentRosterComplete"])
            self.assertEqual(record["packageRelationship"]["verifiedComponentFaceCount"], count)
        for master in (47, 159, 160, 217, 484):
            record = next(x for x in self.records if x["masterNumber"] == master)
            self.assertEqual(record["exceptionDisposition"]["status"], "HOLD")
            self.assertFalse(record["packageRelationship"]["componentRosterComplete"])
        hunting = next(x for x in self.records if x["masterNumber"] == 1590)
        self.assertEqual(hunting["exceptionDisposition"]["status"], "RESOLVED")

    def test_selection_and_founder_state_protected(self):
        prior = {x["censusFaceKey"]: x for x in json.loads(FA.read_text())["records"]}
        for record in self.records:
            old = prior[record["censusFaceKey"]]
            self.assertEqual(record["founderAuthority"]["status"], old["founderStatus"])
            self.assertEqual(record["founderAuthority"]["currentScope"], old["currentScope"])
            if record["populationClassification"] in {"ASSORTMENT_PACK", "COMMERCIAL_CONTAINER", "UNRESOLVED"}:
                self.assertFalse(record["executableFaceSelection"]["eligible"])
        before_after = json.loads((OUT / "BEFORE_AFTER_16_EXCEPTIONS.json").read_text())
        self.assertFalse(before_after["founderAcceptanceRegistryChanged"])
        self.assertEqual(before_after["founderAcceptanceRegistryBeforeSha256"], hashlib.sha256(FA.read_bytes()).hexdigest())


if __name__ == "__main__":
    unittest.main()
