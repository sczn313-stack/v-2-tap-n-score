"""Local-only Baker Fun Founder review authority and ephemeral SEC store."""
from __future__ import annotations

import json
import sys
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

from baker_fun_target_authority import BakerFunAuthorityError, analyze_fun_target_evidence  # noqa: E402


HOST, PORT = "127.0.0.1", 8098
PREPARATIONS = {}
SESSIONS = {}
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
        try:
            payload = self.body()
            if self.path in {"/api/target/baker-fun/analyze", "/api/target/fun/analyze"}:
                self.send_json(200, analyze_fun_target_evidence(payload)); return
            if self.path == "/api/session/prepare":
                target = str(payload.get("targetId") or "")
                if target not in {"baker_gf_db", "baker_gf_bp", "ez2c_dot_torture_17", "baker_gf_bb_c", "baker_gf_battleship"}:
                    self.send_json(400, {"ok": False, "reason": "target_identity_mismatch"}); return
                token = str(uuid.uuid4()); PREPARATIONS[token] = target
                self.send_json(200, {"ok": True, "preparationToken": token, "standardSetup": {"candidateId": "review-optional-equipment", "source": "backend_standard_setup"}}); return
            if self.path == "/api/session/start":
                token = str(payload.get("preparationToken") or ""); target = PREPARATIONS.get(token)
                if not target:
                    self.send_json(400, {"ok": False, "reason": "preparation_token_invalid"}); return
                session_id = f"baker-fun-founder-{uuid.uuid4()}"; now = datetime.now(timezone.utc).isoformat()
                profiles = {
                    "baker_gf_db": ("bakerDartboardGameResult", "Dartboard Target", "BAKER_GF_DB_PRODUCT_AUTHORITY_V1", "ATP_BAKER_GF_DB_V1", "bakerFunGame", "BAKER_GF_DB_RANGE_GAMES_V1"),
                    "baker_gf_bp": ("bakerBowlingPinsResult", "Bowling Pins Target", "BAKER_GF_BP_PRODUCT_AUTHORITY_V1", "ATP_BAKER_GF_BP_V1", "bakerFunGame", "BAKER_GF_BP_TEN_SHOT_CHALLENGE_V1"),
                    "ez2c_dot_torture_17": ("dotTortureCourseResult", "Dot Torture", "EZ2C_STYLE_17_DOT_TORTURE_PRODUCT_AUTHORITY_V1", "ATP_EZ2C_STYLE_17_DOT_TORTURE_V1", "catalogFunGame", "EZ2C_STYLE_17_PUBLISHED_COURSE_V1"),
                    "baker_gf_bb_c": ("bakerBilliardSequenceResult", "Billiard Balls", "BAKER_GF_BB_C_PRODUCT_AUTHORITY_V1", "ATP_BAKER_GF_BB_C_V1", "catalogFunGame", "BAKER_GF_BB_C_PUBLISHED_GAME_V1"),
                    "baker_gf_battleship": ("bakerBattleshipGameResult", "Battleship Target", "BAKER_GF_BATTLESHIP_PRODUCT_AUTHORITY_V1", "ATP_BAKER_GF_BATTLESHIP_V1", "catalogFunGame", "BAKER_GF_BATTLESHIP_PUBLISHED_GAME_V1"),
                }
                result_type, target_name, authority_id, atp_id, mission_family, mission_id = profiles[target]
                session = {"ok": True, "status": "started", "authoritativeSessionId": session_id, "sessionId": session_id, "sessionIdAuthority": "backend", "sessionLabel": "Founder Review", "createdAt": now, "sessionLifecycle": "created", "target": {"targetId": target, "targetProfileId": target, "targetProfileVersion": "1", "targetAuthorityId": authority_id, "targetName": target_name, "atpId": atp_id}, "missionIdentity": {"missionFamily": mission_family, "missionId": mission_id, "resultPackageType": result_type}, "governedDistance": {"value": 3, "unit": "YDS", "locked": True} if target == "ez2c_dot_torture_17" else {"value": None, "unit": None, "locked": False}, "selectedEquipment": payload.get("selectedEquipment") or {}}
                SESSIONS[session_id] = session; self.send_json(201, session); return
            if self.path == "/api/session/sec":
                session = payload.get("session") or {}; session_id = str(session.get("sessionId") or "")
                if not session_id:
                    self.send_json(400, {"ok": False, "reason": "session_identity_required"}); return
                preserved = {**session, "savedToSEC": True, "preservedAt": datetime.now(timezone.utc).isoformat()}; PRESERVED[session_id] = preserved
                self.send_json(200, {"ok": True, "status": "preserved", "session": preserved}); return
            self.send_json(404, {"ok": False, "reason": "not_found"})
        except BakerFunAuthorityError as error:
            self.send_json(400, error.payload)
        except Exception as error:
            self.send_json(500, {"ok": False, "reason": type(error).__name__})

    def do_GET(self):
        if self.path.startswith("/api/session/sec"):
            session_id = parse_qs(urlparse(self.path).query).get("session", [""])[0]
            if session_id:
                session = PRESERVED.get(session_id)
                self.send_json(200 if session else 404, {"ok": bool(session), "session": session, "reason": None if session else "not_found"}); return
            self.send_json(200, {"ok": True, "sessions": list(PRESERVED.values())}); return
        self.send_json(200 if self.path == "/health" else 404, {"ok": self.path == "/health"})

    def log_message(self, *_):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
