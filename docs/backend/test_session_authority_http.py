#!/usr/bin/env python3
"""HTTP handler boundary tests for Backend Session Authority (no network socket)."""
from __future__ import annotations

import json

import server as server_module
from test_session_authority import TestStore, equipment


class HandlerHarness(server_module.AuthorityHandler):
    def __init__(self, method, path, payload=None, headers=None):
        self.command = method
        self.path = path
        self.payload = payload
        self.headers = headers or {}
        self.result = None

    def _read_json_body(self):
        if isinstance(self.payload, Exception):
            raise self.payload
        return self.payload

    def _send_json(self, status, payload):
        self.result = (status, payload)

    def dispatch(self):
        if self.command == "GET":
            self.do_GET()
        else:
            self.do_POST()
        return self.result


def request(method, path, payload=None, headers=None):
    return HandlerHarness(method, path, payload, headers).dispatch()


def main():
    store = TestStore()
    original_runtime_store = server_module.runtime_store
    server_module.runtime_store = lambda: store
    try:
        status, package = request("GET", "/api/session/prepare")
        assert status == 405 and package["allowed"] == ["POST"]

        status, package = request("POST", "/api/session/prepare", {})
        assert status == 400 and package["reason"] == "target_id_required"
        status, package = request("POST", "/api/session/prepare", json.JSONDecodeError("bad", "{", 1))
        assert status == 400 and package["reason"] == "invalid_json"

        status, standard_preparation = request("POST", "/api/session/prepare", {
            "targetId": "m4_25m_zero",
        })
        assert status == 200 and standard_preparation["setupMode"] == "standard"
        assert standard_preparation["standardSetup"]["source"] == "backend_standard_setup"

        selected = equipment()
        status, preparation = request("POST", "/api/session/prepare", {
            "targetId": "m4_25m_zero",
            "missionFamily": "spoofed-client-value",
            "equipmentCandidates": [selected],
        })
        assert status == 200 and preparation["status"] == "prepared"
        assert preparation["missionIdentity"]["missionFamily"] == "zeroingCorrection"
        assert preparation["targetAdmission"]["status"] == "admitted"
        assert preparation["equipmentAssessments"][0]["officialMission"]["status"] == "authority_unavailable"
        assert preparation["equipmentAssessments"][0]["officialMission"]["restrictionIds"] == []

        start_payload = {
            "preparationToken": preparation["preparationToken"],
            "selectedEquipment": {**selected, "source": "weapon_library"},
        }
        status, session = request(
            "POST",
            "/api/session/start",
            start_payload,
            {"Idempotency-Key": "http-contract-idem-1"},
        )
        assert status == 201 and session["authoritativeSessionId"].startswith("sczn3-session-")
        assert session["sessionMode"] == "target_evidence"
        assert session["capabilities"]["evidence"]["status"] == "available"
        assert session["restrictions"] == []

        status, replay = request(
            "POST",
            "/api/session/start",
            start_payload,
            {"Idempotency-Key": "http-contract-idem-1"},
        )
        assert status == 200 and replay["authoritativeSessionId"] == session["authoritativeSessionId"]
        assert replay["idempotentReplay"] is True
    finally:
        server_module.runtime_store = original_runtime_store

    print("PASS Backend Session Authority HTTP contract")


if __name__ == "__main__":
    main()
