import copy
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from preserved_sec_store import PreservedSECError, preserve_sec, read_preserved_sec
from sec_reopen_authority import (
    SECReopenAuthorityError,
    issue_reopen_capability,
    verify_reopen_capability,
)


KEY = "test-only-reopen-signing-key-with-at-least-32-bytes"


class MemoryStore:
    def __init__(self):
        self.records = {}
        self.targets = {"SESSION-A": "fixture-target", "SESSION-B": "fixture-target"}

    def authoritative_target_id(self, session_id):
        return self.targets.get(session_id)

    def save(self, record):
        existing = self.records.setdefault(record["sessionId"], copy.deepcopy(dict(record)))
        if existing["artifactSha256"] != record["artifactSha256"]:
            raise PreservedSECError("preservation_conflict", "preserved_sec_is_immutable", 409)
        return copy.deepcopy(existing)

    def get(self, session_id):
        return copy.deepcopy(self.records.get(session_id))


def artifact(session_id, note="original"):
    return {
        "sessionId": session_id,
        "authoritativeSessionId": session_id,
        "sessionIdAuthority": "backend",
        "matrixSnapshot": {"targetProfileId": "fixture-target"},
        "targetEvidenceImage": {"dataUrl": "data:image/jpeg;base64,fixture"},
        "savedAt": "2026-08-25T12:00:00+00:00",
        "note": note,
    }


class SECReopenAuthorityTest(unittest.TestCase):
    def setUp(self):
        self.store = MemoryStore()
        self.saved_a = preserve_sec({"session": artifact("SESSION-A")}, self.store)
        self.saved_b = preserve_sec({"session": artifact("SESSION-B")}, self.store)
        self.cap_a = issue_reopen_capability("SESSION-A", self.saved_a["artifactSha256"], key=KEY)
        self.cap_b = issue_reopen_capability("SESSION-B", self.saved_b["artifactSha256"], key=KEY)

    def test_exact_capability_reopens_exact_immutable_artifact(self):
        claims = verify_reopen_capability(self.cap_a, "SESSION-A", key=KEY)
        reopened = read_preserved_sec("SESSION-A", self.store)
        self.assertEqual(claims["artifactSha256"], reopened["artifactSha256"])
        self.assertEqual(self.saved_a["session"], reopened["session"])

    def test_one_sec_capability_cannot_reopen_another(self):
        with self.assertRaises(SECReopenAuthorityError):
            verify_reopen_capability(self.cap_a, "SESSION-B", key=KEY)

    def test_tampered_capability_is_denied(self):
        with self.assertRaises(SECReopenAuthorityError):
            verify_reopen_capability(self.cap_a[:-1] + ("A" if self.cap_a[-1] != "A" else "B"), "SESSION-A", key=KEY)

    def test_missing_capability_is_denied(self):
        with self.assertRaises(SECReopenAuthorityError):
            verify_reopen_capability("", "SESSION-A", key=KEY)

    def test_legacy_exact_artifact_proof_can_regain_capability(self):
        repeated = preserve_sec({"session": artifact("SESSION-A")}, self.store)
        recovered = issue_reopen_capability("SESSION-A", repeated["artifactSha256"], key=KEY)
        self.assertEqual(
            verify_reopen_capability(recovered, "SESSION-A", key=KEY)["artifactSha256"],
            self.saved_a["artifactSha256"],
        )

    def test_non_identical_legacy_artifact_cannot_regain_capability(self):
        with self.assertRaises(PreservedSECError) as raised:
            preserve_sec({"session": artifact("SESSION-A", "changed")}, self.store)
        self.assertEqual(raised.exception.payload["reason"], "preserved_sec_is_immutable")

    def test_signing_key_is_mandatory_and_not_a_browser_credential(self):
        with self.assertRaises(SECReopenAuthorityError) as raised:
            issue_reopen_capability("SESSION-A", self.saved_a["artifactSha256"], key="short")
        self.assertEqual(raised.exception.http_status, 503)


if __name__ == "__main__":
    unittest.main()
