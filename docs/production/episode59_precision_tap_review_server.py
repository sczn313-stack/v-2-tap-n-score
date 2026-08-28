"""Local-only Episode 59 Founder review host using production session/authority owners."""
from __future__ import annotations

import json
import os
import sys
import threading
import time
from copy import deepcopy
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
FALLBACK_DOCS = Path(os.environ.get("SCZN3_REVIEW_FALLBACK_DOCS", "")).resolve() if os.environ.get("SCZN3_REVIEW_FALLBACK_DOCS") else None
sys.path.insert(0, str(BACKEND))

from authority_service import build_authority_package  # noqa: E402
from session_authority import SessionAuthorityError, prepare_session, start_session  # noqa: E402
from target_image_registration_authority import (  # noqa: E402
    TargetImageRegistrationError,
    register_target_image,
)


class ReviewStore:
    def __init__(self):
        self.preparations = {}
        self.sessions = {}

    def save_preparation(self, record):
        self.preparations[record["tokenHash"]] = deepcopy(record)

    def get_preparation(self, token_hash):
        return deepcopy(self.preparations.get(token_hash))

    def find_session_by_idempotency_key(self, key):
        return deepcopy(self.sessions.get(key))

    def create_session(self, record, preparation_id, consumed_at):
        for preparation in self.preparations.values():
            if preparation["preparationId"] == preparation_id:
                preparation["consumedAt"] = consumed_at
                break
        self.sessions[record["idempotencyKey"]] = {
            "requestFingerprint": record["requestFingerprint"],
            "response": deepcopy(record["response"]),
        }
        return deepcopy(record)


STORE = ReviewStore()


class Handler(SimpleHTTPRequestHandler):
    BLOCKED_STATIC_ROOTS = {
        ".git",
        ".netlify",
        ".pytest_cache",
        "architecture",
        "authority-evidence",
        "authority-proof-screenshots",
        "backend",
        "build-week",
        "choose-target-proof-screenshots",
        "founder-review",
        "governance",
        "history",
        "node_modules",
        "production",
        "roadmap",
        "test-results",
        "tests",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DOCS), **kwargs)

    def _send_json(self, status, value, extra_headers=None):
        body = json.dumps(value).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        origin = self.headers.get("Origin")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key")
        self.send_header("Access-Control-Expose-Headers", "Server-Timing, X-SCZN3-Authority-Received-At")
        self.send_header("Access-Control-Expose-Headers", "Server-Timing, X-SCZN3-Authority-Received-At")
        for name, header_value in (extra_headers or {}).items():
            self.send_header(name, str(header_value))
        self.end_headers()
        self.wfile.write(body)

    def translate_path(self, request_path):
        primary = Path(super().translate_path(request_path))
        if primary.exists() or not FALLBACK_DOCS:
            return str(primary)
        try:
            relative = primary.relative_to(DOCS)
        except ValueError:
            return str(primary)
        fallback = FALLBACK_DOCS / relative
        return str(fallback if fallback.exists() else primary)

    def _body(self):
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def do_OPTIONS(self):
        self._send_json(200, {"ok": True})

    def do_GET(self):
        request_path = urlparse(self.path).path
        if request_path == "/health":
            self._send_json(200, {"ok": True, "service": "episode59-precision-tap-review"})
            return
        path_parts = [part for part in request_path.split("/") if part]
        if (
            (path_parts and path_parts[0] in self.BLOCKED_STATIC_ROOTS)
            or any(part.startswith(".") for part in path_parts)
            or any(".BEFORE_" in part or part.endswith("~") for part in path_parts)
        ):
            self.send_error(404)
            return
        if request_path == "/ops.js":
            source_path = Path(self.translate_path(request_path))
            body = source_path.read_text(encoding="utf-8").replace(
                "https://sczn3-authority.onrender.com/api/ops/event",
                "/api/ops/event",
            ).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def list_directory(self, _):
        self.send_error(404)
        return None

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            payload = self._body()
            if path == "/api/session/prepare":
                self._send_json(200, prepare_session(payload, STORE))
                return
            if path == "/api/session/start":
                package = start_session(payload, STORE, idempotency_key=self.headers.get("Idempotency-Key"))
                self._send_json(200 if package.get("idempotentReplay") else 201, package)
                return
            if path == "/api/authority/ugeo":
                received_at = time.time_ns() // 1_000_000
                timing = {}
                package = build_authority_package(payload, timing)
                self._send_json(200, package, {
                    "Server-Timing": (
                        f'registration;dur={timing.get("registrationMs", 0)}, '
                        f'authority;dur={timing.get("authorityEvaluationMs", 0)}, '
                        f'total;dur={timing.get("authorityTotalMs", 0)}'
                    ),
                    "X-SCZN3-Authority-Received-At": received_at,
                })
                return
            if path == "/api/authority/target-image-registration":
                self._send_json(200, register_target_image(payload))
                return
            if path == "/api/ops/event":
                self._send_json(200, {"ok": True, "localReviewOnly": True})
                return
            self._send_json(404, {"ok": False, "reason": "not_found"})
        except SessionAuthorityError as error:
            self._send_json(error.http_status, error.payload)
        except TargetImageRegistrationError as error:
            self._send_json(error.http_status, error.payload)
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"ok": False, "reason": "invalid_json"})
        except Exception as error:
            self._send_json(500, {"ok": False, "reason": type(error).__name__})

    def log_message(self, *_):
        pass


def serve(host, port):
    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    lan_host = os.environ.get("SCZN3_REVIEW_LAN_HOST")
    bindings = [("127.0.0.1", 8096), ("127.0.0.1", 8098)]
    if lan_host and lan_host != "127.0.0.1":
        bindings.extend([(lan_host, 8096), (lan_host, 8098)])
    for host, port in bindings[1:]:
        threading.Thread(target=serve, args=(host, port), daemon=True).start()
    serve(*bindings[0])
