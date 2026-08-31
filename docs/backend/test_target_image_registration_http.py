"""HTTP boundary contract for Episode 59 Target Image Registration Authority."""
from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path

import server as server_module


ROOT = Path(__file__).resolve().parents[1]
CANONICAL = ROOT / "assets" / "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png"


class HandlerHarness(server_module.AuthorityHandler):
    def __init__(self, method, path, payload=None):
        self.command = method
        self.path = path
        self.payload = payload
        self.headers = {}
        self.result = None

    def _read_json_body(self):
        if isinstance(self.payload, Exception):
            raise self.payload
        return self.payload

    def _send_json(self, status, payload):
        self.result = (status, payload)


def request(method, path, payload=None):
    handler = HandlerHarness(method, path, payload)
    handler.do_GET() if method == "GET" else handler.do_POST()
    return handler.result


def run():
    endpoint = "/api/authority/target-image-registration"
    status, response = request("GET", endpoint)
    assert status == 405 and response["allowed"] == ["POST"]

    status, response = request("POST", endpoint, {})
    assert status == 404 and response["reason"] == "registration_package_unavailable"

    raw = CANONICAL.read_bytes()
    payload = {
        "registrationPackageId": "baker-st-100yd-smart-photo-registration-v1",
        "registrationPackageVersion": "1",
        "targetProfileId": "baker_st_100yd_smart_zero",
        "targetProfileVersion": "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
        "imageEvidence": {
            "dataUrl": "data:image/png;base64," + base64.b64encode(raw).decode("ascii"),
            "sha256": hashlib.sha256(raw).hexdigest(),
            "widthPx": 1102,
            "heightPx": 1713,
        },
        "observations": [],
    }
    status, response = request("POST", endpoint, payload)
    assert status == 200
    assert response["knowledgeState"] == "exact"
    assert response["claimSufficiencyOwner"] == "downstream_mission_authority"

    status, response = request("POST", endpoint, json.JSONDecodeError("bad", "{", 1))
    assert status == 400 and response["reason"] == "invalid_json"

    print("PASS Episode 59 Target Image Registration HTTP boundary")


if __name__ == "__main__":
    run()
