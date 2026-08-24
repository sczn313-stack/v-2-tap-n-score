from datetime import datetime, timezone

from rating_store import RatingError, record_rating, validate_rating


class MemoryRatingStore:
    def __init__(self):
        self.records = {}

    def save(self, record):
        existing = self.records.get(record["submissionKey"])
        if existing:
            return existing, True
        saved = {**record, "ratingId": f"rating-{len(self.records) + 1}"}
        self.records[record["submissionKey"]] = saved
        return saved, False


def payload(key="submission-1", rating=5, comment=None):
    return {
        "submissionKey": key,
        "rating": rating,
        "comment": comment,
        "source": "voluntary_rate_us",
        "context": {
            "shooterRelationship": {
                "status": "new_to_this_browser",
                "scope": "this_browser",
                "basis": "no_prior_platform_history_in_browser",
            },
            "origin": {"route": "/index.html", "view": "home"},
            "activity": None,
            "target": None,
            "publisher": None,
            "session": None,
            "sec": {"exists": False, "state": "none"},
            "currentStage": None,
            "completionStatus": "ambiguous",
        },
    }


def test_comment_is_preserved_exactly():
    value = "  Keep the target voice.\nDon't change this text.  "
    record = validate_rating(payload(comment=value), now=datetime(2026, 8, 23, tzinfo=timezone.utc))
    assert record["comment"] == value
    assert record["submittedAt"] == "2026-08-23T00:00:00+00:00"


def test_comment_may_be_omitted():
    record = validate_rating(payload(comment=None))
    assert record["comment"] is None


def test_all_five_rating_values_are_accepted():
    for rating in range(1, 6):
        assert validate_rating(payload(key=f"rating-{rating}", rating=rating))["rating"] == rating


def test_duplicate_submission_is_idempotent():
    store = MemoryRatingStore()
    first = record_rating(payload(), store)
    duplicate = record_rating(payload(), store)
    assert first["status"] == "stored"
    assert duplicate["status"] == "duplicate"
    assert duplicate["ratingId"] == first["ratingId"]
    assert len(store.records) == 1


def test_submission_key_cannot_hide_different_feedback():
    store = MemoryRatingStore()
    record_rating(payload(), store)
    try:
        record_rating(payload(rating=1), store)
    except RatingError as error:
        assert error.http_status == 409
        assert error.payload["reason"] == "submission_key_reused_with_different_feedback"
    else:
        raise AssertionError("conflicting duplicate was accepted")


def test_unknown_printer_remains_null():
    record = validate_rating(payload())
    assert record["context"]["publisher"] is None


def test_known_printer_and_target_are_preserved():
    value = payload()
    value["context"]["target"] = {"targetProfileId": "gunfun_22740_vital_dude", "targetLabel": "Vital Dude"}
    value["context"]["publisher"] = {"publisherId": "gunfun", "publisherLabel": "GunFun"}
    record = validate_rating(value)
    assert record["context"]["target"]["targetProfileId"] == "gunfun_22740_vital_dude"
    assert record["context"]["publisher"] == {"publisherId": "gunfun", "publisherLabel": "GunFun"}


def test_invalid_rating_and_context_fail_closed():
    for rating in (0, 6, 3.5, True):
        try:
            validate_rating(payload(rating=rating))
        except RatingError:
            pass
        else:
            raise AssertionError(f"invalid rating accepted: {rating!r}")
    value = payload()
    value["context"]["completionStatus"] = "probably_done"
    try:
        validate_rating(value)
    except RatingError as error:
        assert error.payload["reason"] == "invalid_completion_status"
    else:
        raise AssertionError("invalid completion status accepted")


if __name__ == "__main__":
    for name, test in sorted(globals().items()):
        if name.startswith("test_") and callable(test):
            test()
            print(f"PASS {name}")
