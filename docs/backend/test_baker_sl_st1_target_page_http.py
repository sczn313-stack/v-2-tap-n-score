#!/usr/bin/env python3
"""HTTP boundary test for the Baker SL-ST1 Phase 4 endpoint."""
import json

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


def main():
    status, response = request("GET", "/api/target/baker-sl-st1/analyze")
    assert status == 405
    assert response["allowed"] == ["POST"]

    payload = {
        "targetId": "BAKER_SL_ST1",
        "variantId": "BAKER_SL_ST1_23X35_STANDARD_WHITE",
        "imageEvidence": {
            "sha256": "b" * 64,
            "mediaType": "image/png",
            "widthPx": 1000,
            "heightPx": 1500,
        },
        "impacts": [{"xNorm": 0.5, "yNorm": 0.5}],
    }
    status, response = request("POST", "/api/target/baker-sl-st1/analyze", payload)
    assert status == 200
    assert response["supportedAnalysis"] == {"impactCount": 1}
    assert response["scoring"]["status"] == "unavailable"

    status, response = request(
        "POST",
        "/api/target/baker-sl-st1/analyze",
        json.JSONDecodeError("bad", "{", 1),
    )
    assert status == 400
    assert response["reason"] == "invalid_json"

    print("PASS Baker SL-ST1 Phase 4 HTTP boundary")


if __name__ == "__main__":
    main()
