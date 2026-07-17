"""HTTP server for SCZN3 backend authority."""
from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from authority_service import build_authority_package, build_distance_click_query
from ops_store import record_event, summarize_events
from product_catalog import product_resolution_http_status, resolve_product_route

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8098"))
DEFAULT_ALLOWED_ORIGINS = (
    "https://tap-n-score.com,"
    "https://www.tap-n-score.com,"
    "https://BakerTargets.com,"
    "https://www.BakerTargets.com,"
    "http://127.0.0.1:8101,"
    "http://localhost:8101"
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
    DISTANCE_CLICK_QUERY_PATHS = {"/api/authority/distance-click-query", "/api/authority/distance-click-query/"}
    OPS_EVENT_PATHS = {"/api/ops/event", "/api/ops/event/"}
    OPS_SUMMARY_PATHS = {"/api/ops/summary", "/api/ops/summary/"}
    OPS_HEALTH_PATHS = {"/api/ops/health", "/api/ops/health/"}
    OPS_ENV_CHECK_PATHS = {"/api/ops/env-check", "/api/ops/env-check/"}
    PRODUCT_ROUTE_PATHS = {"/api/catalog/product-route", "/api/catalog/product-route/"}

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
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
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
        if path in self.OPS_HEALTH_PATHS:
            self._send_json(200, {"ok": True, "service": "sczn3-ops"})
            return
        if path in self.OPS_ENV_CHECK_PATHS:
            self._send_json(403, founder_access_unavailable())
            return
        if path in self.OPS_SUMMARY_PATHS:
            self._send_json(200, summarize_events())
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
    print(f"SCZN3 authority backend listening at http://{HOST}:{PORT}/api/authority/ugeo")
    server.serve_forever()
