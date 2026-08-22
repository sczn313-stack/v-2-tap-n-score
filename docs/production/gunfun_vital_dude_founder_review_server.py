"""Local-only E56-T08 Founder review authority and ephemeral SEC store."""
from __future__ import annotations

import json
import sys
from copy import deepcopy
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

from gunfun_vital_dude_evidence_authority import VitalDudeEvidenceError, analyze_vital_dude_evidence  # noqa: E402
from session_authority import SessionAuthorityError, prepare_session, start_session  # noqa: E402


HOST, PORT = "127.0.0.1", 8098


class SessionStore:
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


SESSION_STORE = SessionStore()
PRESERVED = {}


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, value):
        body = json.dumps(value).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:8096")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key")
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        return json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")

    def do_OPTIONS(self):
        self.send_json(200, {"ok": True})

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            payload = self.body()
            if path == "/api/target/gunfun/vital-dude/analyze":
                self.send_json(200, analyze_vital_dude_evidence(payload)); return
            if path == "/api/session/prepare":
                self.send_json(200, prepare_session(payload, SESSION_STORE)); return
            if path == "/api/session/start":
                package = start_session(payload, SESSION_STORE, idempotency_key=self.headers.get("Idempotency-Key"))
                self.send_json(200 if package.get("idempotentReplay") else 201, package); return
            if path == "/api/session/sec":
                session = payload.get("session") or {}
                session_id = str(session.get("sessionId") or "")
                if not session_id or session.get("sessionIdAuthority") != "backend":
                    self.send_json(400, {"ok": False, "reason": "backend_session_identity_required"}); return
                snapshot = session.get("matrixSnapshot") or {}
                target = str(snapshot.get("targetProfileId") or snapshot.get("target_profile_id") or snapshot.get("targetId") or "")
                if target.lower() not in {"gunfun_22740_vital_dude", "gunfun_22740_vital_dude_23x35"}:
                    self.send_json(409, {"ok": False, "reason": "target_identity_mismatch"}); return
                preserved = {**deepcopy(session), "savedToSEC": True, "preservedAt": datetime.now(timezone.utc).isoformat()}
                PRESERVED[session_id] = preserved
                self.send_json(201, {"ok": True, "status": "preserved", "session": preserved}); return
            self.send_json(404, {"ok": False, "reason": "not_found"})
        except VitalDudeEvidenceError as error:
            self.send_json(400, error.payload)
        except SessionAuthorityError as error:
            self.send_json(error.http_status, error.payload)
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"ok": False, "reason": "invalid_json"})
        except Exception as error:
            self.send_json(500, {"ok": False, "reason": type(error).__name__})

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/session/sec":
            session_id = parse_qs(urlparse(self.path).query).get("session", [""])[0]
            if session_id:
                session = PRESERVED.get(session_id)
                self.send_json(200 if session else 404, {"ok": bool(session), "status": "preserved" if session else "not_found", "session": session}); return
            self.send_json(200, {"ok": True, "status": "preserved", "sessions": list(PRESERVED.values()), "artifacts": [{"sessionId": key, "preservedAt": value.get("preservedAt"), "artifactSha256": value.get("authorityPackage", {}).get("resultHash", "local-review")} for key, value in PRESERVED.items()]}); return
        self.send_json(200 if path == "/health" else 404, {"ok": path == "/health"})

    def log_message(self, *_):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
