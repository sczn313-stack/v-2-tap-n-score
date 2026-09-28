#!/usr/bin/env python3
"""Single-origin localhost host for the five-chair QT Founder review."""
from __future__ import annotations

import mimetypes
import os
import sys
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


DOCS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(DOCS / "backend"))

import qt_episode64_founder_review_server as authority  # noqa: E402
from test_target_execution_scale_architecture import MemoryStore  # noqa: E402


HOST = "127.0.0.1"
PORT = int(os.environ.get("QT_PRINTER13_REVIEW_PORT", "8128"))
ZEROING_UPSTREAM = "http://127.0.0.1:8098"
ZEROING_PROXY_PATHS = {
    "/api/authority/ugeo",
    "/api/authority/distance-click-query",
    "/api/authority/target-image-registration",
}


def static_path(request_path: str) -> Path | None:
    relative = unquote(urlsplit(request_path).path).lstrip("/") or "index.html"
    candidate = (DOCS / relative).resolve()
    try:
        candidate.relative_to(DOCS)
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


class Handler(authority.Handler):
    def send_bytes(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def proxy_zeroing(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else None
        headers = {name: value for name, value in self.headers.items() if name.lower() in {"content-type", "idempotency-key"}}
        request = urllib.request.Request(f"{ZEROING_UPSTREAM}{self.path}", data=body, headers=headers, method=self.command)
        try:
            response = urllib.request.urlopen(request, timeout=120)
        except urllib.error.HTTPError as error:
            response = error
        payload = response.read()
        self.send_bytes(response.status, payload, response.headers.get("Content-Type", "application/json"))

    def do_GET(self):
        if urlsplit(self.path).path.startswith("/api/") or urlsplit(self.path).path == "/health":
            return super().do_GET()
        source = static_path(self.path)
        if source is None:
            return self.send_json(404, {"ok": False, "reason": "not_found"})
        content_type = mimetypes.guess_type(source.name)[0] or "application/octet-stream"
        if source.suffix.lower() in {".html", ".css", ".js", ".json", ".svg"}:
            content_type += "; charset=utf-8"
        self.send_bytes(200, source.read_bytes(), content_type)

    def do_POST(self):
        if urlsplit(self.path).path in ZEROING_PROXY_PATHS:
            return self.proxy_zeroing()
        return super().do_POST()


if __name__ == "__main__":
    store = MemoryStore()
    authority.SESSION_STORE = store
    authority.PRESERVED_SEC_STORE = store
    print(f"QT Printer #13 representative Founder review: http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
