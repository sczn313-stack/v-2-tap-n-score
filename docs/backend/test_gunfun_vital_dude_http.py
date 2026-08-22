"""HTTP boundary for the Founder-approved Vital Dude evidence endpoint."""
from __future__ import annotations

import json
import sys
import types

try:
    import cv2  # type: ignore  # noqa: F401
except ModuleNotFoundError:
    # The Vital Dude endpoint does not use OpenCV. The shared server imports
    # older photo-registration modules eagerly, so isolate that unrelated
    # optional dependency in this focused HTTP-boundary test.
    sys.modules["cv2"] = types.ModuleType("cv2")

import server as server_module


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
    status, response = request("GET", "/api/target/gunfun/vital-dude/analyze")
    assert status == 405 and response["allowed"] == ["POST"]
    status, response = request("POST", "/api/target/gunfun/vital-dude/analyze", {})
    assert status == 400 and response["reason"] == "targetProfileId_identity_mismatch"
    status, response = request("POST", "/api/target/gunfun/vital-dude/analyze", json.JSONDecodeError("bad", "{", 1))
    assert status == 400 and response["reason"] == "invalid_json"
    print("PASS GunFun Vital Dude HTTP authority boundary")


if __name__ == "__main__":
    run()
