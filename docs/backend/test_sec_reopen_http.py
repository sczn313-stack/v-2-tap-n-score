import copy
import json
import os
import sys
import threading
import types
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

HERE = os.path.dirname(__file__)
sys.path.insert(0, HERE)
os.environ["SCZN3_SEC_REOPEN_SIGNING_KEY"] = "http-test-reopen-signing-key-with-at-least-32-bytes"


def stub(name, **attributes):
    module = types.ModuleType(name)
    for key, value in attributes.items():
        setattr(module, key, value)
    sys.modules[name] = module
    return module


class StubError(Exception):
    pass


# Isolate the SEC HTTP boundary from unrelated authority packages, including
# optional computer-vision dependencies not needed by this test.
stub("authority_service", build_authority_package=lambda _: {}, build_distance_click_query=lambda _: {})
stub("baker_sl_st1_target_page", BakerSLST1EvidenceError=StubError, analyze_baker_sl_st1_evidence=lambda _: {})
stub("baker_sl_st1_fixture_capture", BakerSLST1FixtureError=StubError, preserve_founder_fixture=lambda _: {})
stub("baker_sl_st2_idpa_authority", BakerSLST2AuthorityError=StubError, analyze_baker_sl_st2_evidence=lambda _: {})
stub("baker_fun_target_authority", BakerFunAuthorityError=StubError, analyze_fun_target_evidence=lambda _: {})
stub("gunfun_vital_dude_evidence_authority", VitalDudeEvidenceError=StubError, analyze_vital_dude_evidence=lambda _: {})
stub("execution_authority", ExecutionAuthorityError=StubError, execute_authoritative_action=lambda *_: {}, execute_authoritative_session=lambda *_: {})
stub("stage_event_store", runtime_stage_event_store=lambda: None)
stub("target_image_registration_authority", TargetImageRegistrationError=StubError, register_target_image=lambda _: {})
m4_package = stub("m4_authority")
m4_authority = stub("m4_authority.authority_service", build_authority_package=lambda _: {})
m4_package.authority_service = m4_authority
stub(
    "m4_authority.weapon_equipment_registry",
    authority_model_from_record=lambda _: None,
    resolve_proven_equipment_record=lambda *_: None,
)
stub("ops_store", record_event=lambda *_: {}, summarize_events=lambda **_: {})
stub("product_catalog", product_resolution_http_status=lambda _: 200, resolve_product_route=lambda *_: {})
stub("progression_record_store", runtime_progression_record_store=lambda: None)
stub("rating_store", RatingError=StubError, record_rating=lambda *_: {}, runtime_store=lambda: None)
stub(
    "sec_progression_authority",
    SECProgressionAuthorityError=StubError,
    evaluate_progression=lambda *_: {},
    reopen_progression=lambda *_: {},
    runtime_progression_subject_authority=lambda: None,
)
from preserved_sec_store import PreservedSECError
import server


class MemoryStore:
    def __init__(self):
        self.records = {}

    def authoritative_target_id(self, session_id):
        return "fixture-target" if session_id in {"SEC-A", "SEC-B"} else None

    def save(self, record):
        existing = self.records.setdefault(record["sessionId"], copy.deepcopy(dict(record)))
        if existing["artifactSha256"] != record["artifactSha256"]:
            raise PreservedSECError("preservation_conflict", "preserved_sec_is_immutable", 409)
        return copy.deepcopy(existing)

    def get(self, session_id):
        return copy.deepcopy(self.records.get(session_id))


def artifact(session_id):
    return {
        "sessionId": session_id,
        "authoritativeSessionId": session_id,
        "sessionIdAuthority": "backend",
        "matrixSnapshot": {"targetProfileId": "fixture-target"},
        "targetEvidenceImage": {"dataUrl": "data:image/jpeg;base64,fixture"},
        "savedAt": "2026-08-25T12:00:00+00:00",
    }


class QuietHandler(server.AuthorityHandler):
    def log_message(self, *_):
        pass


class SECReopenHTTPTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.store = MemoryStore()
        server.preserved_sec_runtime_store = lambda: cls.store
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        cls.origin = f"http://127.0.0.1:{cls.httpd.server_port}"
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.thread.join(timeout=2)

    def request(self, path, *, method="GET", payload=None, capability=None):
        headers = {"Accept": "application/json"}
        body = None
        if payload is not None:
            headers["Content-Type"] = "application/json"
            body = json.dumps(payload).encode()
        if capability:
            headers["X-SCZN3-SEC-Reopen-Capability"] = capability
        request = urllib.request.Request(self.origin + path, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)

    def test_global_listing_denied_and_capability_scoped_reopen_works(self):
        status, global_payload = self.request("/api/session/sec")
        self.assertEqual(status, 403)
        self.assertEqual(global_payload["reason"], "preserved_sec_enumeration_not_authorized")

        status, saved_a = self.request("/api/session/sec", method="POST", payload={"session": artifact("SEC-A")})
        self.assertEqual(status, 201)
        status, saved_b = self.request("/api/session/sec", method="POST", payload={"session": artifact("SEC-B")})
        self.assertEqual(status, 201)

        self.assertEqual(self.request("/api/session/sec?session=SEC-A")[0], 403)
        status, reopened = self.request(
            "/api/session/sec?session=SEC-A", capability=saved_a["reopenCapability"]
        )
        self.assertEqual(status, 200)
        self.assertEqual(reopened["artifactSha256"], saved_a["artifactSha256"])
        self.assertEqual(
            self.request("/api/session/sec?session=SEC-B", capability=saved_a["reopenCapability"])[0],
            403,
        )
        self.assertEqual(
            self.request("/api/session/sec?session=SEC-B", capability=saved_b["reopenCapability"])[0],
            200,
        )


if __name__ == "__main__":
    unittest.main()
