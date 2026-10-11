import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LEDGER = ROOT / "docs/authority-evidence/platform/episode64-reconciled-ten-founder-acceptance-2026-10-10/FOUNDER_ACCEPTANCE_LEDGER.json"
LIFECYCLE = ROOT / "docs/authority-evidence/platform/episode64-ten-sbc-execution-2026-10-09/SCZN3_EP64_TEN_SBC_LIFECYCLE_PROOF.json"


class Episode64ReconciledTenFounderAcceptanceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
        cls.lifecycle = json.loads(LIFECYCLE.read_text(encoding="utf-8"))

    def test_all_ten_are_approved_once(self):
        entries = self.ledger["entries"]
        runtime_ids = [entry["runtimeId"] for entry in entries]
        self.assertEqual(10, len(entries))
        self.assertEqual(10, len(set(runtime_ids)))
        self.assertTrue(all(entry["decision"] == "APPROVED" for entry in entries))
        self.assertEqual(0, self.ledger["summary"]["pendingFounderReviews"])

    def test_current_scope_is_nine_active_passes_and_one_oos(self):
        entries = self.ledger["entries"]
        active = [entry for entry in entries if entry["currentScope"] == "ACTIVE"]
        out_of_scope = [entry for entry in entries if entry["currentScope"] == "OOS"]
        self.assertEqual(9, len(active))
        self.assertEqual(9, sum(entry["decision"] == "APPROVED" for entry in active))
        self.assertEqual(1, len(out_of_scope))
        self.assertEqual("blocker_baker_targets_gf_duck_hunt", out_of_scope[0]["runtimeId"])
        self.assertEqual("APPROVED", out_of_scope[0]["decision"])
        self.assertTrue(out_of_scope[0]["scopeDecision"]["historicalAcceptancePreserved"])
        self.assertEqual(9, self.ledger["summary"]["activeTargetCount"])
        self.assertEqual(9, self.ledger["summary"]["activeFounderPass"])
        self.assertEqual(1, self.ledger["summary"]["outOfScopeCount"])

    def test_every_entry_has_real_evidence_and_supported_contract(self):
        base = LEDGER.parent
        for entry in self.ledger["entries"]:
            evidence = Path(entry["approvalEvidence"])
            if not evidence.is_absolute() and not evidence.parts[0] == "docs":
                evidence = base / evidence
            elif not evidence.is_absolute():
                evidence = ROOT / evidence
            self.assertTrue(evidence.is_file(), entry["runtimeId"])
            contract = ROOT / entry["backendContract"]
            self.assertTrue(contract.is_file(), entry["runtimeId"])
            contract_data = json.loads(contract.read_text(encoding="utf-8"))
            self.assertEqual("supported", contract_data["lifecycleStatus"])
            self.assertEqual("supported", contract_data["supportStatus"])

    def test_machine_proof_is_separate_and_complete(self):
        proof_by_id = {record["targetId"]: record for record in self.lifecycle["records"]}
        self.assertEqual(10, len(proof_by_id))
        for entry in self.ledger["entries"]:
            proof = proof_by_id[entry["runtimeId"]]
            self.assertEqual("PASS", proof["status"])
            self.assertEqual("PASS", proof["ugo"]["status"])
            self.assertIn("EXACT_REOPEN PASS", proof["lifecycle"])

    def test_duck_hunt_technical_exception_does_not_revoke_fa(self):
        duck = next(entry for entry in self.ledger["entries"] if entry["runtimeId"] == "blocker_baker_targets_gf_duck_hunt")
        self.assertEqual("APPROVED", duck["decision"])
        self.assertIsNotNone(duck["outstandingTechnicalWork"])
        self.assertEqual(1, self.ledger["summary"]["technicalExceptions"])
        scope_record = LEDGER.parent / duck["scopeDecision"]["evidence"]
        scope = json.loads(scope_record.read_text(encoding="utf-8"))
        self.assertEqual("OOS", scope["currentScope"])
        self.assertTrue(scope["historicalFounderAcceptance"]["preserved"])
        self.assertEqual(38, scope["preservedFounderSessionInformation"]["totalTaps"])


if __name__ == "__main__":
    unittest.main()
