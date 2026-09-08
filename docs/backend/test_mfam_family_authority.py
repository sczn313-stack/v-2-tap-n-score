#!/usr/bin/env python3
"""Lean M/FAM runtime-authority contract tests."""
from __future__ import annotations

import json
from pathlib import Path

from mfam_family_authority import (
    INVENTORY_AUDIT_PATH,
    MFAMAuthorityError,
    REGISTRY_PATH,
    family,
    inventory_audit,
    product,
    registry_metadata,
    resolve_known_target,
    resolve_target_profile,
)


EXPECTED_PROFILE_IDS = {
    "baker_m16a2_25m_zero",
    "speedwell_dodm4_m16a2_25m_zero",
    "army_nsn_6920_01_395_2949_m16a2_25m_zero",
    "qualification_m16a2_25m_zero",
    "gunfun_32120_m16a2_green_25m_zero",
    "rite_9125_m16a2_25m_zero",
    "national_23075_m16a2_25m_zero",
    "alco_ar0_m16a2_25m_zero",
    "gunfun_32110_m16a2_red_25m_zero",
    "gunfun_82020_m16a2_25m_zero",
    "baker_m4_25m_zero",
    "rite_9125_m4_25m_zero",
    "national_23075_m4_25m_zero",
    "qualification_m4_25m_zero",
    "speedwell_dodm4_m4_25m_zero",
    "action_m4_carbine_25m_zero",
    "army_nsn_6920_01_395_2949_m4_25m_zero",
    "gunfun_32110_m16a4_red_25m_zero",
    "gunfun_32120_m16a4_green_25m_zero",
    "action_m16_m16a2_25m_zero",
    "gunfun_22460_embedded_m4_25m_zero",
    "army_nsn_6920_01_167_1392_m16a1_25m_zero",
}

REMOVED_BUREAUCRACY = {
    "classificationVocabulary",
    "evidencePolicy",
    "authorizationSweep",
    "familyConformanceRegistry",
    "rootAuthorityGaps",
    "scaleProofs",
    "pairClassifications",
    "publisherSweep",
    "unresolvedGaps",
}


def expect_error(fn, message: str) -> None:
    try:
        fn()
    except MFAMAuthorityError as exc:
        assert str(exc) == message
        return
    raise AssertionError(f"expected MFAMAuthorityError: {message}")


def test_registry_is_the_lean_v2_authority_contract():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    assert payload["schemaId"] == "sczn3-mfam-authority-v2"
    assert payload["status"] == "governed"
    assert not REMOVED_BUREAUCRACY.intersection(payload)
    assert set(payload["authorityChain"]) == {
        "printerAuthority",
        "recognition",
        "ugo",
        "equipmentAuthority",
        "backend",
        "tapNScore",
        "expandedLearning",
    }
    assert len(payload["familyAuthorityPackages"]) == 3
    assert len(payload["targetProfileBindings"]) == 22


def test_schema_names_only_runtime_authority_responsibilities():
    schema = json.loads(
        REGISTRY_PATH.with_name("mfam_family_authority.schema.json").read_text(encoding="utf-8")
    )
    assert schema["properties"]["schemaId"]["const"] == "sczn3-mfam-authority-v2"
    assert not REMOVED_BUREAUCRACY.intersection(schema["properties"])
    assert set(schema["required"]) == {
        "schemaId",
        "registryId",
        "version",
        "status",
        "universalZeroingCapabilityId",
        "authorityChain",
        "inventory",
        "families",
        "familyAuthorityPackages",
        "mechanicalAuthorities",
        "products",
        "targetProfileBindings",
        "sources",
    }


def test_presence_in_the_governed_registry_is_authority_not_an_extra_status_vote():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    for collection in (
        "familyAuthorityPackages",
        "mechanicalAuthorities",
        "products",
        "targetProfileBindings",
    ):
        assert all("status" not in record for record in payload[collection]), collection
    assert all("runtimeStatus" not in record for record in payload["products"])
    assert all("mappingClassification" not in record for record in payload["products"])
    assert all("evidenceQuality" not in record for record in payload["products"])


def test_inventory_keeps_knowledge_without_a_duplicate_runtime_status():
    audit = inventory_audit()
    assert audit == json.loads(INVENTORY_AUDIT_PATH.read_text(encoding="utf-8"))
    assert audit["counts"]["physicalTargetFaces"] == 35
    assert audit["counts"]["runtimeBindings"] == 22
    assert sum(bool(face.get("runtimeBinding")) for face in audit["faces"]) == 22
    assert all("runtimeStatus" not in face for face in audit["faces"])
    claimed = {
        face_id
        for product_record in audit["products"]
        for face_id in product_record["faceIds"]
    }
    assert claimed == {face["faceId"] for face in audit["faces"]}


def test_every_explicit_binding_resolves_the_complete_runtime_chain():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    assert {binding["targetProfileId"] for binding in payload["targetProfileBindings"]} == EXPECTED_PROFILE_IDS
    for profile_id in EXPECTED_PROFILE_IDS:
        resolved = resolve_target_profile(profile_id)
        binding = resolved["binding"]
        assert binding["targetProfileId"] == profile_id
        assert resolved["product"]["productId"] == binding["productId"]
        assert resolved["family"]["familyId"] == binding["familyId"]
        assert (
            resolved["familyAuthorityPackage"]["familyAuthorityPackageId"]
            == binding["familyAuthorityPackageId"]
        )
        assert (
            resolved["mechanicalAuthority"]["mechanicalAuthorityId"]
            == binding["mechanicalAuthorityId"]
        )
        assert (
            resolved["registrationPackage"]["registrationPackageId"]
            == binding["registrationPackageId"]
        )
        assert (
            resolved["registrationPackage"]["targetProfileId"]
            == binding["targetProfileId"]
        )
        assert (
            resolved["familyAuthorityPackage"]["universalZeroingCapabilityId"]
            == "sczn3-governed-zeroing-road-v1"
        )


def test_family_knowledge_and_authority_are_reused_not_reauthorized_per_printer():
    profile_ids = [
        "baker_m16a2_25m_zero",
        "speedwell_dodm4_m16a2_25m_zero",
        "rite_9125_m16a2_25m_zero",
        "national_23075_m16a2_25m_zero",
        "alco_ar0_m16a2_25m_zero",
        "gunfun_32110_m16a2_red_25m_zero",
    ]
    resolved = [resolve_target_profile(profile_id) for profile_id in profile_ids]
    assert len({item["product"]["publisherOrIssuer"] for item in resolved}) >= 5
    assert {
        item["familyAuthorityPackage"]["familyAuthorityPackageId"] for item in resolved
    } == {"MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1"}
    assert {
        item["mechanicalAuthority"]["mechanicalAuthorityId"] for item in resolved
    } == {"M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"}


def test_recognition_reports_only_known_executable_and_missing_facts():
    executable = resolve_known_target("face-003")
    assert executable["recognized"] is True
    assert executable["executable"] is True
    assert executable["targetProfileId"] == "baker_m16a2_25m_zero"
    assert executable["missingFacts"] == []

    known_hold = resolve_known_target("face-005")
    assert known_hold["recognized"] is True
    assert known_hold["executable"] is False
    assert known_hold["exactProduct"] == "25 Meter Sighting Target with Red"
    assert known_hold["missingFacts"] == [
        "grid pitch",
        "page origin",
        "aim reference",
        "registration",
        "mechanical applicability",
    ]

    two_sided = resolve_known_target("product-baker-st-m16a2-m4")
    assert two_sided["recognized"] is True
    assert two_sided["executable"] is False
    assert two_sided["candidateFaceIds"] == ["face-003", "face-004"]
    assert two_sided["missingFacts"] == ["exact face/side selection"]

    unknown = resolve_known_target("not-a-known-mfam-target")
    assert unknown == {
        "recognized": False,
        "executable": False,
        "missingFacts": ["publisher product and exact face identity"],
    }


def test_protected_modern_reference_keeps_its_original_authority_owner():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    assert "m4_25m_zero" not in {
        binding["targetProfileId"] for binding in payload["targetProfileBindings"]
    }
    expect_error(
        lambda: resolve_target_profile("m4_25m_zero"),
        "mfam_target_profile_not_governed",
    )
    assert product("sczn3:protected-modern-m4-m16-moa:face")["productId"] == (
        "sczn3:protected-modern-m4-m16-moa:face"
    )


def test_metadata_is_runtime_information_not_sweep_accounting():
    metadata = registry_metadata()
    assert metadata["targetProfileCount"] == 22
    assert metadata["familyAuthorityPackageCount"] == 3
    assert metadata["inventoryCatalogId"] == "SCZN3-MFAM-INVENTORY-AUDIT-2026-09-06"
    assert metadata["authorityChain"]["printerAuthority"].startswith(
        "The printer or issuing authority establishes"
    )


def test_known_families_and_historical_records_remain_available():
    assert family("mfam_m16a2_a3_standard_25m_300m")["geometry"]["rows"] == 20
    architecture = Path(__file__).resolve().parents[1] / "architecture" / "M_FAM_GOVERNANCE.md"
    history = (
        Path(__file__).resolve().parents[1]
        / "authority-evidence"
        / "mfam"
        / "industry-sweep-2026-09-06"
    )
    assert architecture.is_file()
    assert (history / "M_FAM_FACE_LEVEL_MASTER_CATALOG.md").is_file()
    assert (
        history
        / "authority-floor-scale-completion-09"
        / "M_FAM_AUTHORITY_FLOOR_SCALE_COMPLETION_09.md"
    ).is_file()


if __name__ == "__main__":
    tests = [
        value
        for name, value in sorted(globals().items())
        if name.startswith("test_") and callable(value)
    ]
    for test in tests:
        test()
    print(f"PASS {len(tests)}/{len(tests)} lean M/FAM authority tests")
