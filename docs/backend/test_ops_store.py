from authority_service import build_authority_package
from ops_store import record_event, summarize_events, validate_event


class FakeCursor:
    def __init__(self, database):
        self.database = database
        self.result = []
        self.rowcount = 0

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, sql, params=None):
        normalized = " ".join(sql.lower().split())
        if normalized.startswith("insert into ops_events"):
            self.rowcount = self.database.insert(params)
            self.result = []
            return
        if "select event_type, count(*)" in normalized:
            self.result = self.database.count_by("event_type")
            return
        if "select referral_source, count(*)" in normalized:
            self.result = self.database.count_arrival_by("referral_source")
            return
        if "select target_source, count(*)" in normalized:
            self.result = self.database.count_arrival_by("target_source")
            return
        if "select region, count(*)" in normalized:
            self.result = self.database.count_arrival_by("region")
            return
        raise AssertionError(f"Unexpected SQL: {sql}")

    def fetchall(self):
        return self.result


class FakeConnection:
    def __init__(self, database):
        self.database = database

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def cursor(self):
        return FakeCursor(self.database)


class FakeDatabase:
    def __init__(self):
        self.events = []

    def connect(self, _url):
        return FakeConnection(self)

    def insert(self, event):
        if event["event_type"] == "arrival" and event.get("arrival_id"):
            for existing in self.events:
                if existing["event_type"] == "arrival" and existing.get("arrival_id") == event["arrival_id"]:
                    return 0
        self.events.append(dict(event))
        return 1

    def count_by(self, field):
        counts = {}
        for event in self.events:
            key = event.get(field) or "Unknown"
            counts[key] = counts.get(key, 0) + 1
        return sorted(counts.items())

    def count_arrival_by(self, field):
        counts = {}
        for event in self.events:
            if event.get("event_type") != "arrival":
                continue
            key = event.get(field) or "Unknown"
            counts[key] = counts.get(key, 0) + 1
        return sorted(counts.items())


def assert_equal(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")


def sample_event(event_type="arrival", arrival_id="arrival-1"):
    return {
        "eventType": event_type,
        "arrivalId": arrival_id,
        "sessionId": "session-1",
        "publisherRouteId": "gssf",
        "productRouteId": "ac1",
        "catalogEntryId": "gssf-ac1-public-route-v1",
        "path": "/index.html",
        "timestamp": "2026-06-23T15:00:00Z",
        "metadata": {"source": "test"},
    }


def test_valid_event_accepted():
    db = FakeDatabase()
    result = record_event(sample_event(), database_url_override="postgresql://test", connect_fn=db.connect)
    assert_equal(result["ok"], True, "valid event ok")
    assert_equal(result["status"], "stored", "valid event stored")
    assert_equal(len(db.events), 1, "event count")


def test_invalid_event_type_rejected():
    result = record_event(sample_event("buttonClick"), database_url_override="postgresql://test", connect_fn=FakeDatabase().connect)
    assert_equal(result["ok"], False, "invalid event ok")
    assert_equal(result["status"], "invalid", "invalid event status")


def test_missing_database_url_returns_unavailable():
    result = record_event(sample_event(), database_url_override="", connect_fn=FakeDatabase().connect)
    assert_equal(result["ok"], False, "missing db ok")
    assert_equal(result["status"], "unavailable", "missing db status")
    assert_equal(result["reason"], "DATABASE_URL not configured", "missing db reason")


def test_duplicate_arrival_id_does_not_double_count_arrival():
    db = FakeDatabase()
    first = record_event(sample_event("arrival", "same-arrival"), database_url_override="postgresql://test", connect_fn=db.connect)
    second = record_event(sample_event("arrival", "same-arrival"), database_url_override="postgresql://test", connect_fn=db.connect)
    summary = summarize_events(database_url_override="postgresql://test", connect_fn=db.connect)
    assert_equal(first["status"], "stored", "first arrival")
    assert_equal(second["status"], "duplicate", "duplicate arrival")
    assert_equal(summary["totals"]["arrivals"], 1, "arrival dedupe total")


def test_summary_totals_return_correct_counts():
    db = FakeDatabase()
    for event_type in ["arrival", "pageView", "sessionStart", "showResults", "sessionSaved"]:
        record_event(sample_event(event_type, f"{event_type}-1"), database_url_override="postgresql://test", connect_fn=db.connect)
    summary = summarize_events(database_url_override="postgresql://test", connect_fn=db.connect)
    assert_equal(summary["totals"]["arrivals"], 1, "arrivals total")
    assert_equal(summary["totals"]["pageViews"], 1, "page views total")
    assert_equal(summary["totals"]["sessionStarts"], 1, "session starts total")
    assert_equal(summary["totals"]["showResults"], 1, "show results total")
    assert_equal(summary["totals"]["sessionsSaved"], 1, "sessions saved total")
    assert_equal(summary["totals"]["returnShooters"], 0, "return shooters remain deferred")


def test_only_governed_product_identity_is_attributed():
    db = FakeDatabase()
    record_event(sample_event("arrival", "arrival-a"), database_url_override="postgresql://test", connect_fn=db.connect)
    event = sample_event("arrival", "arrival-b")
    event.pop("publisherRouteId")
    event.pop("productRouteId")
    event.pop("catalogEntryId")
    record_event(event, database_url_override="postgresql://test", connect_fn=db.connect)
    summary = summarize_events(database_url_override="postgresql://test", connect_fn=db.connect)
    assert_equal(summary["sources"]["referrals"], {"Deferred": 2}, "referral bucket deferred")
    assert_equal(summary["sources"]["targets"], {"Unattributed": 1, "gssf-ac1-public-route-v1": 1}, "governed target bucket")
    assert_equal(summary["sources"]["regions"], {"Deferred": 2}, "region bucket deferred")


def test_mismatched_product_identity_is_rejected():
    event = sample_event()
    event["catalogEntryId"] = "untrusted-entry"
    validated, error = validate_event(event)
    assert_equal(validated, None, "mismatched product event")
    assert_equal(error, "governed product identity is unavailable or mismatched", "mismatched product error")


def test_ops_failure_does_not_affect_authority_package():
    def failing_connect(_url):
        raise RuntimeError("database unavailable")

    result = record_event(sample_event(), database_url_override="postgresql://test", connect_fn=failing_connect)
    assert_equal(result["ok"], False, "ops failure ok")
    assert_equal(result["status"], "storage_error", "ops failure status")
    package = build_authority_package({
        "targetId": "BAKER_ST_100YD_SMART",
        "aimCoordinate": {"xPercent": 50, "yPercent": 50},
        "impactCoordinates": [{"xPercent": 50, "yPercent": 50}],
        "distance": {"value": 100, "unit": "yds"},
        "shooterSetup": {"optic": {"adjustmentUnit": "MOA", "clickValueMOA": 0.25}},
    })
    assert_equal(package["status"]["hasCorrection"], True, "authority unaffected")


def test_validate_event_rejects_non_object_metadata():
    event, error = validate_event({**sample_event(), "metadata": "bad"})
    assert_equal(event, None, "bad metadata event")
    assert_equal(error, "metadata must be an object", "bad metadata error")


def run():
    tests = [
        test_valid_event_accepted,
        test_invalid_event_type_rejected,
        test_missing_database_url_returns_unavailable,
        test_duplicate_arrival_id_does_not_double_count_arrival,
        test_summary_totals_return_correct_counts,
        test_only_governed_product_identity_is_attributed,
        test_mismatched_product_identity_is_rejected,
        test_ops_failure_does_not_affect_authority_package,
        test_validate_event_rejects_non_object_metadata,
    ]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} ops store tests")


if __name__ == "__main__":
    run()
