"""Local review authority for the target-data/one-road cohort proof.

This server loads the production Target Execution Contract catalog. It does not
add target contracts, route aliases, or target-specific behavior.
"""
from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

from execution_authority import ExecutionAuthorityError, execute_authoritative_session  # noqa: E402
from authority_service import build_authority_package, build_distance_click_query  # noqa: E402
from m4_authority.authority_service import build_authority_package as build_m4_authority  # noqa: E402
from preserved_sec_store import PreservedSECError, list_preserved_secs, preserve_sec, read_preserved_sec  # noqa: E402
from sec_reopen_authority import (  # noqa: E402
    CAPABILITY_HEADER,
    SECReopenAuthorityError,
    issue_reopen_capability,
    verify_reopen_capability,
)
from session_authority import SessionAuthorityError, prepare_session, start_session  # noqa: E402
from target_execution_contract import runtime_resolver  # noqa: E402
from target_image_registration_authority import TargetImageRegistrationError, register_target_image  # noqa: E402
from baker_sl_st2_idpa_authority import BakerSLST2AuthorityError, analyze_baker_sl_st2_evidence  # noqa: E402
from baker_fun_target_authority import BakerFunAuthorityError, analyze_fun_target_evidence  # noqa: E402
from gunfun_vital_dude_evidence_authority import VitalDudeEvidenceError, analyze_vital_dude_evidence  # noqa: E402
from test_target_execution_scale_architecture import MemoryStore  # noqa: E402


HOST, PORT = "127.0.0.1", 8100
RESOLVER = runtime_resolver()
STORE = MemoryStore()


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, value):
        body = json.dumps(value).encode("utf-8")
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

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self.send_json(200, {"ok": True, "service": "target-data-one-road-scale-review"})
            return
        if path == "/api/target-execution/catalog":
            self.send_json(200, {"ok": True, "status": "approved_execution_contract_catalog", "targets": RESOLVER.catalog()})
            return
        if path == "/api/session/sec":
            session_id = parse_qs(urlparse(self.path).query).get("session", [""])[0]
            try:
                if session_id:
                    claims = verify_reopen_capability(self.headers.get(CAPABILITY_HEADER), session_id)
                    package = read_preserved_sec(session_id, STORE)
                    if claims["artifactSha256"] != package["artifactSha256"]:
                        raise SECReopenAuthorityError("preserved_sec_reopen_capability_invalid")
                    self.send_json(200, package)
                else:
                    self.send_json(200, list_preserved_secs(STORE))
            except (PreservedSECError, SECReopenAuthorityError) as error:
                self.send_json(error.http_status, error.payload)
            return
        self.send_json(404, {"ok": False, "reason": "not_found"})

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            payload = self.body()
            if path == "/api/session/prepare":
                self.send_json(200, prepare_session(payload, STORE, execution_contract_resolver=RESOLVER))
                return
            if path == "/api/session/start":
                value = start_session(payload, STORE, idempotency_key=self.headers.get("Idempotency-Key"), execution_contract_resolver=RESOLVER)
                self.send_json(200 if value.get("idempotentReplay") else 201, value)
                return
            if path == "/api/target-execution":
                self.send_json(200, execute_authoritative_session(payload, STORE, resolver=RESOLVER))
                return
            if path == "/api/target/baker-sl-st2/analyze":
                self.send_json(200, analyze_baker_sl_st2_evidence(payload))
                return
            if path in {"/api/target/baker-fun/analyze", "/api/target/fun/analyze"}:
                self.send_json(200, analyze_fun_target_evidence(payload))
                return
            if path == "/api/target/gunfun/vital-dude/analyze":
                self.send_json(200, analyze_vital_dude_evidence(payload))
                return
            if path in {"/api/authority/ugeo", "/api/authority/ugeo/"}:
                self.send_json(200, build_authority_package(payload))
                return
            if path in {"/api/authority/m4", "/api/authority/m4/"}:
                self.send_json(200, build_m4_authority(payload))
                return
            if path in {"/api/authority/distance-click-query", "/api/authority/distance-click-query/"}:
                self.send_json(200, build_distance_click_query(payload))
                return
            if path in {"/api/authority/target-image-registration", "/api/authority/target-image-registration/"}:
                self.send_json(200, register_target_image(payload))
                return
            if path == "/api/session/sec":
                package = preserve_sec(payload, STORE, execution_contract_resolver=RESOLVER)
                package["reopenCapability"] = issue_reopen_capability(
                    package["session"]["sessionId"], package["artifactSha256"]
                )
                self.send_json(201, package)
                return
            self.send_json(404, {"ok": False, "reason": "not_found"})
        except SessionAuthorityError as error:
            self.send_json(error.http_status, error.payload)
        except ExecutionAuthorityError as error:
            self.send_json(error.http_status, error.payload)
        except TargetImageRegistrationError as error:
            self.send_json(error.http_status, error.payload)
        except (BakerSLST2AuthorityError, BakerFunAuthorityError, VitalDudeEvidenceError) as error:
            self.send_json(400, error.payload)
        except PreservedSECError as error:
            self.send_json(error.http_status, error.payload)
        except SECReopenAuthorityError as error:
            self.send_json(error.http_status, error.payload)
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"ok": False, "reason": "invalid_json"})
        except Exception as error:
            self.send_json(500, {"ok": False, "reason": type(error).__name__})

    def log_message(self, *_):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
