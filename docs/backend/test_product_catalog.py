"""Executable governance tests for the GSSF AC-1 public product route."""
from copy import deepcopy

from product_catalog import (
    GSSF_AC_1_CATALOG_ENTRY,
    GSSF_AC_1_PRODUCT_RECORD,
    GSSF_PUBLISHER_RECORD,
    resolve_product_route,
)


def assert_equal(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")


def test_gssf_ac1_product_route_resolves():
    result = resolve_product_route("gssf", "ac1")
    assert_equal(result["ok"], True, "route resolved")
    assert_equal(result["status"], "resolved", "route status")
    assert_equal(result["publicRoute"], "/t/gssf/ac1", "permanent public route")
    assert_equal(result["publisher"]["publisherRouteId"], "gssf", "publisher identity")
    assert_equal(result["product"]["productRouteId"], "ac1", "product identity")
    assert_equal(
        result["authorityResolution"]["targetExecutionContractId"],
        "gssf-ac-1-live-canonical-v1",
        "approved execution contract",
    )
    assert_equal(result["authorityResolution"]["missionFamily"], "gssf", "mission family")


def test_unknown_publisher_refuses_visibly():
    result = resolve_product_route("unknown", "ac1")
    assert_equal(result["status"], "product_unavailable", "unknown publisher status")
    assert_equal(result["reason"], "unknown_publisher", "unknown publisher reason")


def test_unknown_product_refuses_visibly():
    result = resolve_product_route("gssf", "unknown")
    assert_equal(result["status"], "product_unavailable", "unknown product status")
    assert_equal(result["reason"], "unknown_product", "unknown product reason")


def test_suspended_catalog_entry_refuses_visibly():
    entry = deepcopy(GSSF_AC_1_CATALOG_ENTRY)
    entry["lifecycleStatus"] = "suspended"
    result = resolve_product_route("gssf", "ac1", catalog_entries={("gssf", "ac1"): entry})
    assert_equal(result["status"], "product_unavailable", "suspended status")
    assert_equal(result["reason"], "catalog_entry_unavailable", "suspended reason")


def test_retired_catalog_entry_refuses_visibly():
    entry = deepcopy(GSSF_AC_1_CATALOG_ENTRY)
    entry["lifecycleStatus"] = "retired"
    result = resolve_product_route("gssf", "ac1", catalog_entries={("gssf", "ac1"): entry})
    assert_equal(result["status"], "product_retired", "retired status")
    assert_equal(result["reason"], "catalog_entry_retired", "retired reason")


def test_authority_mismatch_refuses():
    entry = deepcopy(GSSF_AC_1_CATALOG_ENTRY)
    entry["targetExecutionContractId"] = "wrong-contract"
    result = resolve_product_route("gssf", "ac1", catalog_entries={("gssf", "ac1"): entry})
    assert_equal(result["status"], "authority_unavailable", "authority mismatch status")
    assert_equal(result["reason"], "catalog_authority_mismatch", "authority mismatch reason")


def test_branding_authorization_remains_separate():
    result = resolve_product_route("gssf", "ac1")
    assert_equal(
        result["publisher"]["brandingAuthorizationStatus"],
        "external_authorization_unverified",
        "branding authorization",
    )


def test_product_route_cannot_enter_zeroing_authority():
    result = resolve_product_route("gssf", "ac1")
    authority = result["authorityResolution"]
    assert_equal(authority["missionFamily"], "gssf", "product route mission family")
    assert_equal("zeroCorrectionResult" in str(result), False, "zeroing result excluded")
    assert_equal("zeroingCorrection" in str(result), False, "zeroing route excluded")


def run():
    tests = [
        test_gssf_ac1_product_route_resolves,
        test_unknown_publisher_refuses_visibly,
        test_unknown_product_refuses_visibly,
        test_suspended_catalog_entry_refuses_visibly,
        test_retired_catalog_entry_refuses_visibly,
        test_authority_mismatch_refuses,
        test_branding_authorization_remains_separate,
        test_product_route_cannot_enter_zeroing_authority,
    ]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} product catalog tests")


if __name__ == "__main__":
    run()
