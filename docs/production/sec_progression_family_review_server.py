"""Local-only synthetic authority for SEC Progression browser acceptance."""
from __future__ import annotations

import json
import sys
from copy import deepcopy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BACKEND = Path(__file__).resolve().parents[1] / "backend"; sys.path.insert(0, str(BACKEND))
from progression_record_store import MemoryProgressionRecordStore  # noqa: E402
from sec_progression_authority import SECProgressionAuthorityError, SyntheticProgressionSubjectAuthority, evaluate_progression, reopen_progression  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver  # noqa: E402
from test_fixtures.sec_progression_scale import SUBJECT_ID, SUBJECT_TOKEN, contracts, source_records  # noqa: E402

HOST, PORT = "127.0.0.1", 8098
RESOLVER, RECORDS, SUBJECTS = TargetExecutionContractResolver(contracts()), MemoryProgressionRecordStore(), SyntheticProgressionSubjectAuthority({SUBJECT_TOKEN: SUBJECT_ID})


class SECStore:
    def __init__(self): self.records = {item["sessionId"]: deepcopy(item) for item in source_records()}
    def get(self, session_id): return deepcopy(self.records.get(session_id))


SECS = SECStore()


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, value):
        body = json.dumps(value).encode(); self.send_response(status); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body))); self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:8096"); self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); self.send_header("Access-Control-Allow-Headers", "Content-Type"); self.end_headers(); self.wfile.write(body)
    def body(self): return json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
    def do_OPTIONS(self): self.send_json(200, {"ok": True})
    def do_GET(self):
        try: self.send_json(200, reopen_progression(parse_qs(urlparse(self.path).query).get("evaluation", [""])[0], RECORDS)) if urlparse(self.path).path == "/api/sec-progression/evaluate" else self.send_json(200, {"ok": True}) if urlparse(self.path).path == "/health" else self.send_json(404, {"ok": False})
        except SECProgressionAuthorityError as error: self.send_json(error.http_status, error.payload)
    def do_POST(self):
        try: self.send_json(201, evaluate_progression(self.body(), SECS, RECORDS, SUBJECTS, resolver=RESOLVER)) if urlparse(self.path).path == "/api/sec-progression/evaluate" else self.send_json(404, {"ok": False})
        except SECProgressionAuthorityError as error: self.send_json(error.http_status, error.payload)
    def log_message(self, *_): pass


if __name__ == "__main__": ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
