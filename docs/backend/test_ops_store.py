from datetime import datetime, timezone
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
            self.result = self.database.count_by("event_type", params)
            return
        if "select referral_source, count(*)" in normalized:
            self.result = self.database.count_arrival_by("referral_source", params)
            return
        if "select target_source, count(*)" in normalized:
            self.result = self.database.count_arrival_by("target_source", params)
            return
        if "select region, count(*)" in normalized:
            self.result = self.database.count_arrival_by("region", params)
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

    def matching_events(self, params):
        params = params or {}
        matches = []
        for event in self.events:
            occurred_at = datetime.fromisoformat(event["occurred_at"].replace("Z", "+00:00"))
            if params.get("start_at") and occurred_at < params["start_at"]:
                continue
            if params.get("end_at") and occurred_at >= params["end_at"]:
                continue
            if params.get("product") and event.get("target_source") != params["product"]:
                continue
            matches.append(event)
        return matches

    def count_by(self, field, params=None):
        counts = {}
        for event in self.matching_events(params):
            key = event.get(field) or "Unknown"
            counts[key] = counts.get(key, 0) + 1
        return sorted(counts.items())

    def count_arrival_by(self, field, params=None):
        counts = {}
        for event in self.matching_events(params):
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
    assert_equal(summary["totals"]["returnShooters"], None, "return visitors remain unavailable")


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
    assert_equal(summary["productActivity"], {"gssf-ac1-public-route-v1": 1}, "primary product activity contains governed identity only")
    assert_equal(summary["unavailableTelemetry"]["unattributedArrivals"], 1, "unattributed activity remains explicit")
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


def test_time_windows_are_single_governed_intervals():
    db = FakeDatabase()
    for arrival_id, timestamp in [
        ("today", "2026-07-16T14:00:00Z"),
        ("this-week", "2026-07-15T23:00:00Z"),
        ("older", "2026-06-30T12:00:00Z"),
    ]:
        event = sample_event("arrival", arrival_id)
        event["timestamp"] = timestamp
        record_event(event, database_url_override="postgresql://test", connect_fn=db.connect)
    now = datetime(2026, 7, 16, 18, 0, tzinfo=timezone.utc)
    today = summarize_events(time_window="today", timezone_name="America/New_York", now=now, database_url_override="postgresql://test", connect_fn=db.connect)
    week = summarize_events(time_window="week", timezone_name="America/New_York", now=now, database_url_override="postgresql://test", connect_fn=db.connect)
    assert_equal(today["totals"]["arrivals"], 1, "today contains only today's interval")
    assert_equal(week["totals"]["arrivals"], 2, "week contains only this week's interval")
    assert_equal(today["filters"]["startAt"], "2026-07-16T04:00:00+00:00", "today starts at founder-local midnight")


def test_product_filter_uses_governed_catalog_identity_only():
    db = FakeDatabase()
    record_event(sample_event("arrival", "gssf"), database_url_override="postgresql://test", connect_fn=db.connect)
    unattributed = sample_event("arrival", "unattributed")
    for field in ["publisherRouteId", "productRouteId", "catalogEntryId"]:
        unattributed.pop(field)
    record_event(unattributed, database_url_override="postgresql://test", connect_fn=db.connect)
    summary = summarize_events(product_filter="gssf-ac1-public-route-v1", now=datetime(2026, 7, 17, tzinfo=timezone.utc), database_url_override="postgresql://test", connect_fn=db.connect)
    assert_equal(summary["totals"]["arrivals"], 1, "GSSF filter excludes unattributed events")
    assert_equal(summary["sources"]["targets"], {"gssf-ac1-public-route-v1": 1}, "filtered attribution contains only the selected governed product")
    assert_equal(summary["unavailableTelemetry"]["unattributedArrivals"], 0, "selected governed product has no unattributed activity")
    assert_equal(summary["filters"]["product"], "gssf-ac1-public-route-v1", "governed product filter recorded")
    invalid = summarize_events(product_filter="baker-inferred", database_url_override="postgresql://test", connect_fn=db.connect)
    assert_equal(invalid["status"], "invalid_filter", "unknown product filter refuses")


def test_conversion_percentages_preserve_zero_and_unavailable():
    db = FakeDatabase()
    record_event(sample_event("arrival", "arrival-1"), database_url_override="postgresql://test", connect_fn=db.connect)
    record_event(sample_event("arrival", "arrival-2"), database_url_override="postgresql://test", connect_fn=db.connect)
    record_event(sample_event("sessionStart", "session-start"), database_url_override="postgresql://test", connect_fn=db.connect)
    record_event(sample_event("showResults", "result"), database_url_override="postgresql://test", connect_fn=db.connect)
    summary = summarize_events(now=datetime(2026, 7, 17, tzinfo=timezone.utc), database_url_override="postgresql://test", connect_fn=db.connect)
    assert_equal(summary["conversionPercentages"]["arrivalToSessionStart"], 50.0, "arrival conversion")
    assert_equal(summary["conversionPercentages"]["sessionStartToResult"], 100.0, "result conversion")
    assert_equal(summary["conversionPercentages"]["resultToSave"], 0.0, "measured zero conversion remains zero")
    empty = summarize_events(now=datetime(2026, 7, 17, tzinfo=timezone.utc), database_url_override="postgresql://test", connect_fn=FakeDatabase().connect)
    assert_equal(empty["conversionPercentages"]["arrivalToSessionStart"], None, "conversion without denominator is unavailable")


def test_inconsistent_funnel_is_explicitly_unavailable():
    db = FakeDatabase()
    record_event(sample_event("arrival", "arrival"), database_url_override="postgresql://test", connect_fn=db.connect)
    record_event(sample_event("sessionStart", "start"), database_url_override="postgresql://test", connect_fn=db.connect)
    record_event(sample_event("showResults", "result-1"), database_url_override="postgresql://test", connect_fn=db.connect)
    record_event(sample_event("showResults", "result-2"), database_url_override="postgresql://test", connect_fn=db.connect)
    summary = summarize_events(now=datetime(2026, 7, 17, tzinfo=timezone.utc), database_url_override="postgresql://test", connect_fn=db.connect)
    assert_equal(summary["conversionPercentages"]["sessionStartToResult"], None, "inconsistent conversion unavailable")
    assert_equal(summary["operationalFailures"], ["results_exceed_session_starts"], "integrity failure explicit")


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
        test_time_windows_are_single_governed_intervals,
        test_product_filter_uses_governed_catalog_identity_only,
        test_conversion_percentages_preserve_zero_and_unavailable,
        test_inconsistent_funnel_is_explicitly_unavailable,
    ]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} ops store tests")


if __name__ == "__main__":
    run()
