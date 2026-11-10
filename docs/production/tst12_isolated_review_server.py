#!/usr/bin/env python3
"""Single-port, loopback-only TST-12 release-gate server.

This test host serves the candidate ``docs`` tree and the real Backend
Authority handler from one explicitly assigned port. It has no default port
and refuses every non-loopback binding.
"""
from __future__ import annotations

import mimetypes
import os
import posixpath
import sys
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))

from server import AuthorityHandler  # noqa: E402


HOST = "127.0.0.1"
PORT_TEXT = os.environ.get("SCZN3_TST12_TEST_PORT", "")
if not PORT_TEXT:
    raise RuntimeError("SCZN3_TST12_TEST_PORT is required; no fallback port is permitted")
PORT = int(PORT_TEXT)
if PORT != 8272:
    raise RuntimeError("Founder authorization permits isolated test port 8272 only")


class IsolatedTST12Handler(AuthorityHandler):
    def _serve_candidate_file(self) -> None:
        request_path = posixpath.normpath(unquote(urlsplit(self.path).path)).lstrip("/")
        if not request_path:
            request_path = "index.html"
        source = (DOCS / request_path).resolve()
        try:
            source.relative_to(DOCS)
        except ValueError:
            self.send_error(404)
            return
        if source.is_dir():
            source = source / "index.html"
        if not source.is_file() or any(part.startswith(".") for part in source.relative_to(DOCS).parts):
            self.send_error(404)
            return
        payload = source.read_bytes()
        content_type = mimetypes.guess_type(source.name)[0] or "application/octet-stream"
        if source.suffix.lower() in {".css", ".html", ".js", ".json", ".mjs", ".svg", ".txt"}:
            content_type = f"{content_type}; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        path = self._request_path()
        if path == "/health" or path.startswith("/api/"):
            super().do_GET()
            return
        self._serve_candidate_file()


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), IsolatedTST12Handler)
    print(f"SCZN3 isolated TST-12 release gate listening at http://{HOST}:{PORT}", flush=True)
    server.serve_forever()
