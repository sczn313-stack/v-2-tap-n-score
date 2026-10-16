#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
POPULATION = ROOT / "docs/backend/registries/episode64_platform_population_registry.json"
FOUNDER = ROOT / "docs/backend/registries/episode64_platform_founder_acceptance_registry.json"
EVIDENCE = ROOT / (
    "docs/authority-evidence/platform/episode67-master407-founder-oos-2026-10-16/"
    "SCZN3_EP67_FOUNDER_OOS_MASTER407_ATC200.json"
)
RUNTIME_IDS = {
    "american_target_58_q100_uspa_ipsc",
    "american_target_58_q500_uspa_ipsc",
    "american_target_58_q1000_uspa_ipsc",
}


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


class Master407FounderOosTest(unittest.TestCase):
    def test_master407_is_oos_in_both_registries(self):
        population = load(POPULATION)
        founder = load(FOUNDER)
        pop = next(row for row in population["records"] if row["masterNumber"] == 407)
        fa = next(row for row in founder["records"] if row["masterNumber"] == 407)
        self.assertEqual(set(pop["runtimeIds"]), RUNTIME_IDS)
        self.assertFalse(pop["executableFaceSelection"]["eligible"])
        self.assertEqual(pop["executableFaceSelection"]["excludedBecause"], "FOUNDER_OOS")
        self.assertEqual(pop["founderAuthority"]["currentScope"], "OOS")
        self.assertEqual(fa["founderStatus"], "FOUNDER_OOS")
        self.assertEqual(fa["currentScope"], "OOS")
        self.assertFalse(fa["librarySelection"]["eligibleForFounderReview"])

    def test_preservation_receipt_and_accounting(self):
        receipt = load(EVIDENCE)
        self.assertEqual(receipt["decision"]["reason"], "UGO physical scoring-boundary authority remains unverified.")
        self.assertFalse(receipt["decision"]["deleted"])
        self.assertEqual(receipt["approvedMasterAccounting"]["after"], {
            "activeMetadataConnectedFaces": 1495,
            "protectedOosFaces": 32,
        })
        for relative, expected in receipt["preservation"]["artifactSha256"].items():
            path = Path(relative) if relative.startswith("/") else ROOT / relative
            self.assertTrue(path.is_file(), relative)
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), expected, relative)
        self.assertTrue(all(receipt["preservation"].values()))
        self.assertFalse(receipt["authorityBoundary"]["ugoModified"])
        self.assertFalse(receipt["authorityBoundary"]["precisionGateBypassed"])


if __name__ == "__main__":
    unittest.main()
