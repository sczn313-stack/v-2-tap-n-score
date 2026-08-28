"""Backend-issued possession authority for one immutable preserved SEC."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from typing import Any, Dict, Optional


CAPABILITY_HEADER = "X-SCZN3-SEC-Reopen-Capability"
CAPABILITY_PURPOSE = "sczn3-preserved-sec-reopen"


class SECReopenAuthorityError(Exception):
    def __init__(self, reason: str, http_status: int = 403):
        super().__init__(reason)
        self.http_status = http_status
        self.payload = {"ok": False, "status": "reopen_authority_unavailable", "reason": reason}


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _decode(value: str) -> bytes:
    padding = "=" * ((4 - len(value) % 4) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("ascii"))


def signing_key(configured: Optional[str] = None) -> bytes:
    value = configured if configured is not None else os.environ.get("SCZN3_SEC_REOPEN_SIGNING_KEY", "")
    raw = value.encode("utf-8")
    if len(raw) < 32:
        raise SECReopenAuthorityError("sec_reopen_signing_key_unavailable", 503)
    return raw


def issue_reopen_capability(session_id: str, artifact_sha256: str, *, key: Optional[str] = None) -> str:
    payload = json.dumps(
        {
            "artifactSha256": str(artifact_sha256),
            "purpose": CAPABILITY_PURPOSE,
            "sessionId": str(session_id),
            "version": 1,
        },
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    encoded = _encode(payload)
    signature = _encode(hmac.new(signing_key(key), encoded.encode("ascii"), hashlib.sha256).digest())
    return f"{encoded}.{signature}"


def verify_reopen_capability(capability: Any, session_id: Any, *, key: Optional[str] = None) -> Dict[str, str]:
    token = str(capability or "").strip()
    expected_session = str(session_id or "").strip()
    if not token or not expected_session or token.count(".") != 1:
        raise SECReopenAuthorityError("preserved_sec_reopen_capability_required")
    encoded, received_signature = token.split(".", 1)
    expected_signature = _encode(hmac.new(signing_key(key), encoded.encode("ascii"), hashlib.sha256).digest())
    if not hmac.compare_digest(received_signature, expected_signature):
        raise SECReopenAuthorityError("preserved_sec_reopen_capability_invalid")
    try:
        claims = json.loads(_decode(encoded).decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        raise SECReopenAuthorityError("preserved_sec_reopen_capability_invalid") from None
    if (
        claims.get("version") != 1
        or claims.get("purpose") != CAPABILITY_PURPOSE
        or not hmac.compare_digest(str(claims.get("sessionId") or ""), expected_session)
        or len(str(claims.get("artifactSha256") or "")) != 64
    ):
        raise SECReopenAuthorityError("preserved_sec_reopen_capability_invalid")
    return {"sessionId": expected_session, "artifactSha256": str(claims["artifactSha256"])}
