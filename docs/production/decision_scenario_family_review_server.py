"""Local-only authority for Decision Scenario browser acceptance."""
from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

from execution_authority import ExecutionAuthorityError, execute_authoritative_action  # noqa: E402
from preserved_sec_store import PreservedSECError, preserve_sec, read_preserved_sec  # noqa: E402
from session_authority import SessionAuthorityError, prepare_session, start_session  # noqa: E402
from stage_event_store import MemoryStageEventStore  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver  # noqa: E402
from test_cue_drill_orchestrator import MemoryStore  # noqa: E402
from test_fixtures.decision_scenario_scale import contracts  # noqa: E402

HOST, PORT = "127.0.0.1", 8098
RESOLVER, STORE, EVENTS = TargetExecutionContractResolver(contracts()), MemoryStore(), MemoryStageEventStore()


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, value):
        body = json.dumps(value).encode("utf-8")
        self.send_response(status); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body))); self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:8096"); self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); self.send_header("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key"); self.end_headers(); self.wfile.write(body)

    def body(self):
        return json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")

    def do_OPTIONS(self):
        self.send_json(200, {"ok": True})

    def do_GET(self):
        if urlparse(self.path).path == "/api/session/sec":
            try: self.send_json(200, read_preserved_sec(parse_qs(urlparse(self.path).query).get("session", [""])[0], STORE))
            except PreservedSECError as error: self.send_json(error.http_status, error.payload)
            return
        self.send_json(200, {"ok": True, "service": "decision-scenario-review"}) if urlparse(self.path).path == "/health" else self.send_json(404, {"ok": False, "reason": "not_found"})

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            payload = self.body()
            if path == "/api/session/prepare": self.send_json(200, prepare_session(payload, STORE, execution_contract_resolver=RESOLVER)); return
            if path == "/api/session/start":
                value = start_session(payload, STORE, idempotency_key=self.headers.get("Idempotency-Key"), execution_contract_resolver=RESOLVER); self.send_json(200 if value.get("idempotentReplay") else 201, value); return
            if path == "/api/target-execution/action": self.send_json(200, execute_authoritative_action(payload, STORE, EVENTS, resolver=RESOLVER)); return
            if path == "/api/session/sec": self.send_json(201, preserve_sec(payload, STORE, execution_contract_resolver=RESOLVER)); return
            self.send_json(404, {"ok": False, "reason": "not_found"})
        except (SessionAuthorityError, ExecutionAuthorityError, PreservedSECError) as error: self.send_json(error.http_status, error.payload)
        except Exception as error: self.send_json(500, {"ok": False, "reason": type(error).__name__})

    def log_message(self, *_): pass


if __name__ == "__main__": ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
