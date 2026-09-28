#!/usr/bin/env python3
"""Local Backend Authority surface for the Episode 64 QT Founder review."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

from execution_authority import ExecutionAuthorityError, execute_authoritative_session  # noqa: E402
from preserved_sec_store import (  # noqa: E402
    PostgresPreservedSECStore,
    PreservedSECError,
    list_preserved_secs,
    preserve_sec,
    read_preserved_sec,
)
from sec_reopen_authority import CAPABILITY_HEADER, SECReopenAuthorityError, issue_reopen_capability, verify_reopen_capability  # noqa: E402
from session_authority import PostgresSessionStore, SessionAuthorityError, prepare_session, start_session  # noqa: E402
from target_execution_contract import runtime_resolver  # noqa: E402

HOST = "127.0.0.1"
PORT = int(os.environ.get("QT_EP64_AUTHORITY_PORT", "8118"))
RESOLVER = runtime_resolver()
SESSION_STORE = PostgresSessionStore()
PRESERVED_SEC_STORE = PostgresPreservedSECStore()
M4_ADAPTER = BACKEND / "m4_authority/parity/authority_adapter.mjs"
LOCAL_REOPEN_SIGNING_KEY = os.environ.get(
    "SCZN3_SEC_REOPEN_SIGNING_KEY",
    "episode64-qt-founder-review-local-signing-key-v1",
)


def build_m4_authority(payload):
    source = f'''import {{ buildAuthorityPackage }} from {json.dumps(M4_ADAPTER.as_uri())};
let input = ""; for await (const chunk of process.stdin) input += chunk;
process.stdout.write(JSON.stringify(await buildAuthorityPackage(JSON.parse(input))));'''
    completed = subprocess.run(
        ["node", "--input-type=module", "--eval", source],
        input=json.dumps(payload), text=True, capture_output=True, check=True,
    )
    return json.loads(completed.stdout)


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, value):
        body = json.dumps(value).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:8119")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers",
            f"Content-Type, Idempotency-Key, {CAPABILITY_HEADER}",
        )
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        return json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")

    def do_OPTIONS(self):
        self.send_json(200, {"ok": True})

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self.send_json(200, {"ok": True, "service": "qt-episode64-founder-review", "qtChairs": 254})
            return
        if parsed.path == "/api/target-execution/catalog":
            self.send_json(200, {"ok": True, "status": "approved_execution_contract_catalog", "targets": RESOLVER.catalog()})
            return
        if parsed.path == "/api/session/sec":
            session_id = parse_qs(parsed.query).get("session", [""])[0]
            try:
                if not session_id:
                    self.send_json(200, list_preserved_secs(PRESERVED_SEC_STORE)); return
                claims = verify_reopen_capability(
                    self.headers.get(CAPABILITY_HEADER), session_id, key=LOCAL_REOPEN_SIGNING_KEY
                )
                package = read_preserved_sec(session_id, PRESERVED_SEC_STORE)
                if claims["artifactSha256"] != package["artifactSha256"]:
                    raise SECReopenAuthorityError("preserved_sec_reopen_capability_invalid")
                self.send_json(200, package); return
            except (PreservedSECError, SECReopenAuthorityError) as error:
                self.send_json(error.http_status, error.payload); return
        self.send_json(404, {"ok": False, "reason": "not_found"})

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            payload = self.body()
            if path == "/api/session/prepare":
                self.send_json(200, prepare_session(payload, SESSION_STORE, execution_contract_resolver=RESOLVER)); return
            if path == "/api/session/start":
                value = start_session(payload, SESSION_STORE, idempotency_key=self.headers.get("Idempotency-Key"), execution_contract_resolver=RESOLVER)
                self.send_json(200 if value.get("idempotentReplay") else 201, value); return
            if path == "/api/target-execution":
                self.send_json(200, execute_authoritative_session(payload, SESSION_STORE, resolver=RESOLVER)); return
            if path in {"/api/authority/m4", "/api/authority/m4/"}:
                self.send_json(200, build_m4_authority(payload)); return
            if path == "/api/session/sec":
                package = preserve_sec(payload, PRESERVED_SEC_STORE, execution_contract_resolver=RESOLVER)
                package["reopenCapability"] = issue_reopen_capability(
                    package["session"]["sessionId"],
                    package["artifactSha256"],
                    key=LOCAL_REOPEN_SIGNING_KEY,
                )
                self.send_json(201, package); return
            self.send_json(404, {"ok": False, "reason": "not_found"})
        except (SessionAuthorityError, ExecutionAuthorityError, PreservedSECError, SECReopenAuthorityError) as error:
            self.send_json(error.http_status, error.payload)
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"ok": False, "reason": "invalid_json"})
        except Exception as error:
            self.send_json(500, {"ok": False, "reason": type(error).__name__, "detail": str(error)})

    def log_message(self, *_):
        pass


if __name__ == "__main__":
    print(f"QT Episode 64 Backend Authority: http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
