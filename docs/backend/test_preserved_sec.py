import unittest

from preserved_sec_store import PreservedSECError, list_preserved_secs, preserve_sec, read_preserved_sec


class MemoryPreservedSECStore:
    def __init__(self):
        self.authoritative_sessions = {"sczn3-session-founder-174": "baker_sl_st1"}
        self.records = {}

    def authoritative_target_id(self, session_id):
        return self.authoritative_sessions.get(session_id)

    def save(self, record):
        existing = self.records.get(record["sessionId"])
        if existing and existing["artifactSha256"] != record["artifactSha256"]:
            raise PreservedSECError("preservation_conflict", "preserved_sec_is_immutable", 409)
        self.records[record["sessionId"]] = record
        return self.records[record["sessionId"]]

    def get(self, session_id):
        return self.records.get(session_id)

    def list(self):
        return list(self.records.values())


class PreservedSECContractTests(unittest.TestCase):
    def setUp(self):
        self.store = MemoryPreservedSECStore()
        self.session = {
            "sessionId": "sczn3-session-founder-174",
            "sessionIdAuthority": "backend",
            "savedToSEC": True,
            "matrixSnapshot": {"targetProfileId": "BAKER_SL_ST1"},
            "authorityPackage": {
                "authorityTrace": {"classificationAuthority": "backend"},
                "scoring": {"status": "complete", "total": 174},
            },
        }

    def test_preserve_read_and_list_return_same_artifact(self):
        preserved = preserve_sec({"session": self.session}, self.store)
        reopened = read_preserved_sec(self.session["sessionId"], self.store)
        vault = list_preserved_secs(self.store)
        self.assertTrue(preserved["ok"])
        self.assertEqual(reopened["session"], preserved["session"])
        self.assertEqual(vault["sessions"], [preserved["session"]])
        self.assertEqual(reopened["artifactSha256"], preserved["artifactSha256"])

    def test_rejects_unknown_or_mismatched_backend_session(self):
        unknown = dict(self.session, sessionId="sczn3-session-unknown")
        with self.assertRaises(PreservedSECError) as raised:
            preserve_sec({"session": unknown}, self.store)
        self.assertEqual(raised.exception.payload["reason"], "authoritative_session_not_found")

        mismatch = {**self.session, "matrixSnapshot": {"targetProfileId": "GSSF_AC_1"}}
        with self.assertRaises(PreservedSECError) as raised:
            preserve_sec({"session": mismatch}, self.store)
        self.assertEqual(raised.exception.payload["reason"], "target_identity_mismatch")

    def test_preserved_artifact_is_immutable(self):
        preserve_sec({"session": self.session}, self.store)
        changed = {**self.session, "authorityPackage": {"scoring": {"status": "complete", "total": 999}}}
        with self.assertRaises(PreservedSECError) as raised:
            preserve_sec({"session": changed}, self.store)
        self.assertEqual(raised.exception.payload["reason"], "preserved_sec_is_immutable")


if __name__ == "__main__":
    unittest.main()
