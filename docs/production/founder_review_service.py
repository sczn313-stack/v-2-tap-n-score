"""Protected, single-origin Founder Review host for an immutable SCZN3 candidate.

This module is deployment infrastructure. It does not alter the candidate's
product behavior: static candidate files are served from ``docs/`` and the
existing Backend Authority handler owns every ``/api/`` request.
"""
from __future__ import annotations

import base64
import hmac
import json
import mimetypes
import os
import posixpath
import sys
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Optional
from urllib.parse import unquote, urlsplit


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = int(os.environ.get("SCZN3_REVIEW_BACKEND_PORT", "8098"))
PUBLIC_HOST = os.environ.get("HOST", "0.0.0.0")
PUBLIC_PORT = int(os.environ.get("PORT", "8096"))
PRODUCTION_AUTHORITY_ORIGIN = "https://sczn3-authority.onrender.com"

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
    "test-results",
    "tests",
}

TEXT_SUFFIXES = {".css", ".html", ".js", ".json", ".mjs", ".svg", ".txt", ".xml"}
FORWARDED_REQUEST_HEADERS = {
    "content-type",
    "idempotency-key",
    "x-sczn3-sec-reopen",
}
FORWARDED_RESPONSE_HEADERS = {
    "content-type",
    "server-timing",
    "x-sczn3-authority-received-at",
}


def _required_secret(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        raise RuntimeError(f"{name} must be configured")
    return value


def _expected_authorization() -> str:
    username = _required_secret("SCZN3_REVIEW_USERNAME")
    password = _required_secret("SCZN3_REVIEW_PASSWORD")
    encoded = base64.b64encode(f"{username}:{password}".encode("utf-8")).decode("ascii")
    return f"Basic {encoded}"


def _run_review_migrations() -> None:
    database_url = _required_secret("SCZN3_SESSION_SEC_DATABASE_URL")
    if not os.environ.get("DATABASE_URL"):
        os.environ["DATABASE_URL"] = database_url
    import psycopg

    migration_dir = BACKEND / "migrations"
    with psycopg.connect(database_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            for migration in sorted(migration_dir.glob("[0-9][0-9][0-9]_*.sql")):
                cursor.execute(migration.read_text(encoding="utf-8"))


def _start_authority() -> ThreadingHTTPServer:
    sys.path.insert(0, str(BACKEND))
    os.environ["HOST"] = BACKEND_HOST
    os.environ["PORT"] = str(BACKEND_PORT)
    from server import AuthorityHandler

    authority = ThreadingHTTPServer((BACKEND_HOST, BACKEND_PORT), AuthorityHandler)
    threading.Thread(target=authority.serve_forever, daemon=True, name="sczn3-review-authority").start()
    return authority


def _static_path(request_path: str) -> Optional[Path]:
    decoded = unquote(urlsplit(request_path).path)
    normalized = posixpath.normpath(decoded).lstrip("/")
    if normalized in {"", "."}:
        normalized = "index.html"
    parts = [part for part in normalized.split("/") if part]
    if (
        not parts
        or parts[0] in BLOCKED_STATIC_ROOTS
        or any(part.startswith(".") for part in parts)
        or any(".BEFORE_" in part or part.endswith("~") for part in parts)
    ):
        return None
    candidate = (DOCS / Path(*parts)).resolve()
    try:
        candidate.relative_to(DOCS)
    except ValueError:
        return None
    if candidate.is_dir():
        candidate = candidate / "index.html"
    return candidate if candidate.is_file() else None


class FounderReviewHandler(BaseHTTPRequestHandler):
    server_version = "SCZN3FounderReview/1"

    def _security_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("Pragma", "no-cache")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("X-Robots-Tag", "noindex, nofollow, noarchive")

    def _authorized(self) -> bool:
        received = self.headers.get("Authorization", "")
        expected = self.server.expected_authorization  # type: ignore[attr-defined]
        return bool(received) and hmac.compare_digest(received, expected)

    def _require_authorization(self) -> bool:
        if self._authorized():
            return True
        body = b"Founder Review access required.\n"
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="SCZN3 Founder Review", charset="UTF-8"')
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._security_headers()
        self.end_headers()
        self.wfile.write(body)
        return False

    def _health(self) -> None:
        body = json.dumps({
            "ok": True,
            "service": "sczn3-founder-review",
            "release": os.environ.get("SCZN3_REVIEW_RELEASE", "unrecorded"),
        }).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._security_headers()
        self.end_headers()
        self.wfile.write(body)

    def _proxy(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else None
        target = f"http://{BACKEND_HOST}:{BACKEND_PORT}{self.path}"
        headers = {
            name: value
            for name, value in self.headers.items()
            if name.lower() in FORWARDED_REQUEST_HEADERS
        }
        request = urllib.request.Request(target, data=body, headers=headers, method=self.command)
        try:
            response = urllib.request.urlopen(request, timeout=120)
        except urllib.error.HTTPError as error:
            response = error
        except (TimeoutError, urllib.error.URLError):
            payload = b'{"ok":false,"status":"service_error","reason":"review_authority_unreachable"}'
            self.send_response(503)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self._security_headers()
            self.end_headers()
            self.wfile.write(payload)
            return
        payload = response.read()
        self.send_response(response.status)
        for name, value in response.headers.items():
            if name.lower() in FORWARDED_RESPONSE_HEADERS:
                self.send_header(name, value)
        self.send_header("Content-Length", str(len(payload)))
        self._security_headers()
        self.end_headers()
        self.wfile.write(payload)

    def _serve_static(self) -> None:
        source = _static_path(self.path)
        if source is None:
            self.send_error(404)
            return
        payload = source.read_bytes()
        if source.suffix.lower() in TEXT_SUFFIXES:
            payload = payload.replace(PRODUCTION_AUTHORITY_ORIGIN.encode("utf-8"), b"")
        content_type = mimetypes.guess_type(source.name)[0] or "application/octet-stream"
        if source.suffix.lower() in TEXT_SUFFIXES and "charset=" not in content_type:
            content_type = f"{content_type}; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self._security_headers()
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        if urlsplit(self.path).path == "/health":
            self._health()
            return
        if not self._require_authorization():
            return
        if urlsplit(self.path).path.startswith("/api/"):
            self._proxy()
            return
        self._serve_static()

    def do_POST(self) -> None:
        if not self._require_authorization():
            return
        self._proxy()

    def do_OPTIONS(self) -> None:
        if not self._require_authorization():
            return
        self._proxy()

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"{self.address_string()} - {fmt % args}")


def main() -> None:
    expected = _expected_authorization()
    _required_secret("SCZN3_SEC_REOPEN_SIGNING_KEY")
    _run_review_migrations()
    authority = _start_authority()
    public = ThreadingHTTPServer((PUBLIC_HOST, PUBLIC_PORT), FounderReviewHandler)
    public.expected_authorization = expected  # type: ignore[attr-defined]
    print(f"SCZN3 Founder Review listening at http://{PUBLIC_HOST}:{PUBLIC_PORT}")
    try:
        public.serve_forever()
    finally:
        authority.shutdown()


if __name__ == "__main__":
    main()
