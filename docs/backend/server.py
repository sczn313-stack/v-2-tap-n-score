"""HTTP server for SCZN3 backend authority."""
from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from authority_service import build_authority_package

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


class AuthorityHandler(BaseHTTPRequestHandler):
    def _cors_origin(self):
        origin = self.headers.get("Origin")
        return origin if origin in ALLOWED_ORIGINS else None

    def _send_json(self, status, payload):
        body = json.dumps(payload, sort_keys=True, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        cors_origin = self._cors_origin()
        if cors_origin:
            self.send_header("Access-Control-Allow-Origin", cors_origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(200, {"ok": True})

    def do_GET(self):
        if self.path != "/health":
            self._send_json(404, {"error": "not found"})
            return
        self._send_json(200, {"ok": True, "service": "sczn3-authority"})

    def do_POST(self):
        if self.path != "/api/authority/ugeo":
            self._send_json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8") if length else "{}"
            payload = json.loads(raw or "{}")
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
