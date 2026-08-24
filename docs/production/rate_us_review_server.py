"""Local-only Founder review server for the voluntary Rate Us candidate."""
from __future__ import annotations

import json
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path

DOCS = Path(__file__).resolve().parents[1]
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))

from rating_store import RatingError, record_rating  # noqa: E402


class MemoryStore:
    def __init__(self):
        self.records = {}

    def save(self, record):
        existing = self.records.get(record["submissionKey"])
        if existing:
            return existing, True
        saved = {**record, "ratingId": f"founder-review-rating-{len(self.records) + 1}"}
        self.records[record["submissionKey"]] = saved
        return saved, False


STORE = MemoryStore()


class StaticHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DOCS), **kwargs)

    def log_message(self, *_):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class RatingHandler(BaseHTTPRequestHandler):
    def send_json(self, status, value):
        body = json.dumps(value).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:8111")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_json(200, {"ok": True})

    def do_POST(self):
        if self.path.rstrip("/") != "/api/feedback/rating":
            self.send_json(404, {"ok": False, "reason": "not_found"})
            return
        try:
            payload = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
            result = record_rating(payload, STORE, idempotency_key=self.headers.get("Idempotency-Key"))
            self.send_json(200 if result["duplicate"] else 201, result)
        except RatingError as error:
            self.send_json(error.http_status, error.payload)
        except Exception:
            self.send_json(400, {"ok": False, "status": "invalid_request", "reason": "invalid_json"})

    def log_message(self, *_):
        pass


if __name__ == "__main__":
    static = ThreadingHTTPServer(("127.0.0.1", 8111), StaticHandler)
    ratings = ThreadingHTTPServer(("127.0.0.1", 8098), RatingHandler)
    threading.Thread(target=ratings.serve_forever, daemon=True).start()
    print("Rate Us Founder review: http://127.0.0.1:8111/index.html", flush=True)
    static.serve_forever()
