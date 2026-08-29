import base64
import json
import sys
import threading
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


PRODUCTION = Path(__file__).resolve().parents[1] / "production"
sys.path.insert(0, str(PRODUCTION))

import founder_review_service as review


class FakeAuthorityHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        payload = json.dumps({
            "ok": True,
            "path": self.path,
            "body": json.loads(body or b"{}"),
            "idempotencyKey": self.headers.get("Idempotency-Key"),
        }).encode("utf-8")
        self.send_response(201)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *_):
        pass


class FounderReviewServiceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.authority = ThreadingHTTPServer(("127.0.0.1", 0), FakeAuthorityHandler)
        review.BACKEND_PORT = cls.authority.server_address[1]
        threading.Thread(target=cls.authority.serve_forever, daemon=True).start()

        cls.review = ThreadingHTTPServer(("127.0.0.1", 0), review.FounderReviewHandler)
        cls.authorization = "Basic " + base64.b64encode(b"founder:test-password").decode("ascii")
        cls.review.expected_authorization = cls.authorization
        threading.Thread(target=cls.review.serve_forever, daemon=True).start()
        cls.origin = f"http://127.0.0.1:{cls.review.server_address[1]}"

    @classmethod
    def tearDownClass(cls):
        cls.review.shutdown()
        cls.authority.shutdown()

    def request(self, path, *, authorized=False, data=None, headers=None):
        request_headers = dict(headers or {})
        if authorized:
            request_headers["Authorization"] = self.authorization
        request = urllib.request.Request(
            self.origin + path,
            data=json.dumps(data).encode("utf-8") if data is not None else None,
            headers=request_headers,
            method="POST" if data is not None else "GET",
        )
        return urllib.request.urlopen(request)

    def test_health_is_public_but_discloses_no_candidate_data(self):
        response = self.request("/health")
        self.assertEqual(response.status, 200)
        self.assertEqual(json.load(response)["service"], "sczn3-founder-review")

    def test_static_candidate_requires_authentication(self):
        with self.assertRaises(urllib.error.HTTPError) as context:
            self.request("/index.html")
        self.assertEqual(context.exception.code, 401)
        self.assertIn("Basic", context.exception.headers["WWW-Authenticate"])

    def test_static_candidate_is_served_and_production_authority_is_rebound(self):
        response = self.request("/shoot.html", authorized=True)
        body = response.read().decode("utf-8")
        self.assertEqual(response.status, 200)
        self.assertNotIn(review.PRODUCTION_AUTHORITY_ORIGIN, body)
        self.assertIn("/api/authority/ugeo", body)
        self.assertEqual(response.headers["X-Robots-Tag"], "noindex, nofollow, noarchive")

    def test_sensitive_static_roots_are_not_served(self):
        with self.assertRaises(urllib.error.HTTPError) as context:
            self.request("/backend/server.py", authorized=True)
        self.assertEqual(context.exception.code, 404)

    def test_authenticated_api_request_reaches_existing_authority_boundary(self):
        response = self.request(
            "/api/session/start",
            authorized=True,
            data={"test": True},
            headers={"Content-Type": "application/json", "Idempotency-Key": "review-test-1"},
        )
        payload = json.load(response)
        self.assertEqual(response.status, 201)
        self.assertEqual(payload["path"], "/api/session/start")
        self.assertEqual(payload["body"], {"test": True})
        self.assertEqual(payload["idempotencyKey"], "review-test-1")


if __name__ == "__main__":
    unittest.main()
