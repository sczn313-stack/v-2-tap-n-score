"""HTTP server for SCZN3 backend authority."""
from __future__ import annotations

import hmac
import hmac
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from authority_service import build_authority_package, build_distance_click_query
from baker_sl_st1_target_page import BakerSLST1EvidenceError, analyze_baker_sl_st1_evidence
from baker_sl_st1_fixture_capture import BakerSLST1FixtureError, preserve_founder_fixture
from m4_authority.authority_service import build_authority_package as build_m4_authority_package
from ops_store import record_event, summarize_events
from product_catalog import product_resolution_http_status, resolve_product_route
from preserved_sec_store import (
    PreservedSECError,
    preserve_sec,
    read_preserved_sec,
    runtime_store as preserved_sec_runtime_store,
)
from sec_reopen_authority import (
    CAPABILITY_HEADER,
    SECReopenAuthorityError,
    issue_reopen_capability,
    signing_key as sec_reopen_signing_key,
    verify_reopen_capability,
)
from session_authority import (
    SessionAuthorityError,
    prepare_session,
    runtime_store,
    start_session,
)
from target_image_registration_authority import TargetImageRegistrationError, register_target_image

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8098"))
DEFAULT_ALLOWED_ORIGINS = (
    "https://tap-n-score.com,"
    "https://www.tap-n-score.com,"
    "https://BakerTargets.com,"
    "https://www.BakerTargets.com,"
    "http://127.0.0.1:8101,"
    "http://localhost:8101,"
    "http://127.0.0.1:8096,"
    "http://localhost:8096"
)
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get("SCZN3_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS).split(",")
    if origin.strip()
}


def founder_access_unavailable():
    """Refuse private telemetry until authenticated founder access exists."""
    return {
        "ok": False,
        "status": "founder_authentication_required",
        "reason": "Pulse Check remains unavailable until server-verified founder authentication is configured.",
    }


class AuthorityHandler(BaseHTTPRequestHandler):
    AUTHORITY_PATHS = {"/api/authority/ugeo", "/api/authority/ugeo/"}
    M4_AUTHORITY_PATHS = {"/api/authority/m4", "/api/authority/m4/"}
    DISTANCE_CLICK_QUERY_PATHS = {"/api/authority/distance-click-query", "/api/authority/distance-click-query/"}
    OPS_EVENT_PATHS = {"/api/ops/event", "/api/ops/event/"}
    OPS_SUMMARY_PATHS = {"/api/ops/summary", "/api/ops/summary/"}
    OPS_HEALTH_PATHS = {"/api/ops/health", "/api/ops/health/"}
    OPS_ENV_CHECK_PATHS = {"/api/ops/env-check", "/api/ops/env-check/"}
    PRODUCT_ROUTE_PATHS = {"/api/catalog/product-route", "/api/catalog/product-route/"}
    SESSION_PREPARE_PATHS = {"/api/session/prepare", "/api/session/prepare/"}
    SESSION_START_PATHS = {"/api/session/start", "/api/session/start/"}
    PRESERVED_SEC_PATHS = {"/api/session/sec", "/api/session/sec/"}
    BAKER_SL_ST1_ANALYZE_PATHS = {"/api/target/baker-sl-st1/analyze", "/api/target/baker-sl-st1/analyze/"}
    BAKER_SL_ST1_FIXTURE_PATHS = {"/api/target/baker-sl-st1/founder-fixture", "/api/target/baker-sl-st1/founder-fixture/"}
    TARGET_IMAGE_REGISTRATION_PATHS = {"/api/authority/target-image-registration", "/api/authority/target-image-registration/"}

    def _cors_origin(self):
        origin = self.headers.get("Origin")
        return origin if origin in ALLOWED_ORIGINS else None

    def _request_path(self):
        return self.path.split("?", 1)[0]

    def _send_json(self, status, payload):
        body = json.dumps(payload, sort_keys=True, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        cors_origin = self._cors_origin()
        if cors_origin:
            self.send_header("Access-Control-Allow-Origin", cors_origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", f"Content-Type, Idempotency-Key, {CAPABILITY_HEADER}")
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8") if length else "{}"
        return json.loads(raw or "{}")

    def do_OPTIONS(self):
        self._send_json(200, {"ok": True})

    def do_GET(self):
        path = self._request_path()
        if path == "/health":
            self._send_json(200, {"ok": True, "service": "sczn3-authority"})
            return
        if path in self.M4_AUTHORITY_PATHS:
            self._send_json(405, {"error": "method not allowed", "allowed": ["POST"]})
            return
        if path in self.PRESERVED_SEC_PATHS:
            try:
                query = parse_qs(urlparse(self.path).query)
                session_id = query.get("session", query.get("sessionId", [""]))[0]
                if not session_id:
                    raise SECReopenAuthorityError("preserved_sec_enumeration_not_authorized")
                claims = verify_reopen_capability(self.headers.get(CAPABILITY_HEADER), session_id)
                package = read_preserved_sec(session_id, preserved_sec_runtime_store())
                if not hmac.compare_digest(package["artifactSha256"], claims["artifactSha256"]):
                    raise SECReopenAuthorityError("preserved_sec_reopen_capability_invalid")
                self._send_json(200, package)
            except (PreservedSECError, SECReopenAuthorityError) as exc:
                self._send_json(exc.http_status, exc.payload)
            except Exception:
                self._send_json(503, {"ok": False, "status": "storage_error", "reason": "preserved_sec_read_failed"})
            return
        if path in self.SESSION_PREPARE_PATHS or path in self.SESSION_START_PATHS or path in self.BAKER_SL_ST1_ANALYZE_PATHS or path in self.BAKER_SL_ST1_FIXTURE_PATHS or path in self.TARGET_IMAGE_REGISTRATION_PATHS:
            self._send_json(405, {"error": "method not allowed", "allowed": ["POST"]})
            return
        if path in self.OPS_HEALTH_PATHS:
            self._send_json(200, {"ok": True, "service": "sczn3-ops"})
            return
        if path in self.OPS_ENV_CHECK_PATHS:
            self._send_json(403, founder_access_unavailable())
            return
        if path in self.OPS_SUMMARY_PATHS:
            query = parse_qs(urlparse(self.path).query)
            summary = summarize_events(
                time_window=query.get("window", ["all"])[0],
                product_filter=query.get("product", ["all"])[0],
                campaign_filter=query.get("campaign", ["all"])[0],
                timezone_name=query.get("timeZone", ["UTC"])[0],
            )
            self._send_json(200 if summary.get("ok") is True else 400, summary)
            return
        if path in self.PRODUCT_ROUTE_PATHS:
            query = parse_qs(urlparse(self.path).query)
            result = resolve_product_route(
                query.get("publisherRouteId", [""])[0],
                query.get("productRouteId", [""])[0],
            )
            self._send_json(product_resolution_http_status(result), result)
            return
        self._send_json(404, {"error": "not found"})

    def do_POST(self):
        path = self._request_path()
        if path in self.TARGET_IMAGE_REGISTRATION_PATHS:
            try:
                self._send_json(200, register_target_image(self._read_json_body()))
            except (json.JSONDecodeError, UnicodeDecodeError):
                self._send_json(400, {"ok": False, "status": "invalid_request", "reason": "invalid_json"})
            except TargetImageRegistrationError as exc:
                self._send_json(exc.http_status, exc.payload)
            except Exception:  # pragma: no cover - defensive registration boundary
                self._send_json(503, {"ok": False, "status": "service_error", "reason": "target_image_registration_failed"})
            return
        if path in self.PRESERVED_SEC_PATHS:
            try:
                sec_reopen_signing_key()
                package = preserve_sec(self._read_json_body(), preserved_sec_runtime_store())
                package["reopenCapability"] = issue_reopen_capability(
                    package["session"]["sessionId"], package["artifactSha256"]
                )
                self._send_json(201, package)
            except (json.JSONDecodeError, UnicodeDecodeError):
                self._send_json(400, {"ok": False, "status": "invalid_request", "reason": "invalid_json"})
            except (PreservedSECError, SECReopenAuthorityError) as exc:
                self._send_json(exc.http_status, exc.payload)
            except Exception:
                self._send_json(503, {"ok": False, "status": "storage_error", "reason": "preserved_sec_persistence_failed"})
            return
        if path in self.BAKER_SL_ST1_FIXTURE_PATHS:
            try:
                self._send_json(200, preserve_founder_fixture(self._read_json_body()))
            except (json.JSONDecodeError, UnicodeDecodeError):
                self._send_json(400, {"ok": False, "status": "invalid_request", "reason": "invalid_json"})
            except BakerSLST1FixtureError as exc:
                self._send_json(400, exc.payload)
            except Exception:  # pragma: no cover - defensive evidence boundary
                self._send_json(503, {"ok": False, "status": "service_error", "reason": "fixture_capture_failed"})
            return
        if path in self.BAKER_SL_ST1_ANALYZE_PATHS:
            try:
                self._send_json(200, analyze_baker_sl_st1_evidence(self._read_json_body()))
            except (json.JSONDecodeError, UnicodeDecodeError):
                self._send_json(400, {"ok": False, "status": "invalid_request", "reason": "invalid_json"})
            except BakerSLST1EvidenceError as exc:
                status = 503 if exc.payload["status"] == "configuration_error" else 400
                self._send_json(status, exc.payload)
            except Exception:  # pragma: no cover - defensive evidence boundary
                self._send_json(503, {"ok": False, "status": "service_error", "reason": "evidence_analysis_failed"})
            return
        if path in self.SESSION_PREPARE_PATHS:
            try:
                self._send_json(200, prepare_session(self._read_json_body(), runtime_store()))
            except (json.JSONDecodeError, UnicodeDecodeError):
                self._send_json(400, {"ok": False, "status": "invalid_request", "reason": "invalid_json"})
            except SessionAuthorityError as exc:
                self._send_json(exc.http_status, exc.payload)
            except Exception:  # pragma: no cover - defensive storage boundary
                self._send_json(503, {"ok": False, "status": "storage_error", "reason": "session_preparation_persistence_failed"})
            return
        if path in self.SESSION_START_PATHS:
            try:
                package = start_session(
                    self._read_json_body(),
                    runtime_store(),
                    idempotency_key=self.headers.get("Idempotency-Key"),
                )
                self._send_json(200 if package.get("idempotentReplay") else 201, package)
            except (json.JSONDecodeError, UnicodeDecodeError):
                self._send_json(400, {"ok": False, "status": "invalid_request", "reason": "invalid_json"})
            except SessionAuthorityError as exc:
                self._send_json(exc.http_status, exc.payload)
            except Exception:  # pragma: no cover - defensive storage boundary
                self._send_json(503, {"ok": False, "status": "storage_error", "reason": "session_persistence_failed"})
            return
        if path in self.OPS_EVENT_PATHS:
            try:
                self._send_json(200, record_event(self._read_json_body()))
            except Exception as exc:  # pragma: no cover - defensive server boundary
                self._send_json(400, {"error": str(exc)})
            return
        if path in self.DISTANCE_CLICK_QUERY_PATHS:
            try:
                self._send_json(200, build_distance_click_query(self._read_json_body()))
            except Exception as exc:  # pragma: no cover - defensive server boundary
                self._send_json(400, {"error": str(exc)})
            return
        if path in self.M4_AUTHORITY_PATHS:
            try:
                self._send_json(200, build_m4_authority_package(self._read_json_body()))
            except Exception as exc:  # pragma: no cover - defensive server boundary
                self._send_json(400, {"error": str(exc)})
            return
        if path not in self.AUTHORITY_PATHS:
            self._send_json(404, {"error": "not found"})
            return
        try:
            payload = self._read_json_body()
            package = build_authority_package(payload)
            self._send_json(200, package)
        except Exception as exc:  # pragma: no cover - defensive server boundary
            self._send_json(400, {"error": str(exc)})

    def log_message(self, fmt, *args):
        print(f"{self.address_string()} - {fmt % args}")


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), AuthorityHandler)
    print(f"SCZN3 authority backend listening at http://{HOST}:{PORT}/api/authority/ugeo, /api/authority/m4, and /api/session/*")
    server.serve_forever()
