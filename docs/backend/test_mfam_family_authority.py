#!/usr/bin/env python3
"""M/FAM family-registry integrity and fail-closed tests."""
from __future__ import annotations

import json
from pathlib import Path

from mfam_family_authority import (
    ALLOWED_CLASSIFICATIONS,
    MFAMAuthorityError,
    INVENTORY_AUDIT_PATH,
    REGISTRY_PATH,
    classify_pair,
    family,
    inventory_audit,
    product,
    registry_metadata,
    resolve_target_profile,
)


def expect_error(fn, message):
    try:
        fn()
    except MFAMAuthorityError as exc:
        assert str(exc) == message
        return
    raise AssertionError(f"expected MFAMAuthorityError: {message}")


def test_registry_metadata_and_vocabulary_are_governed():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    assert payload["schemaId"] == "sczn3-mfam-family-authority-v1"
    assert payload["status"] == "governed"
    assert set(payload["classificationVocabulary"]) == ALLOWED_CLASSIFICATIONS
    assert registry_metadata()["universalZeroingCapabilityId"] == "sczn3-governed-zeroing-road-v1"


def test_registry_schema_contract_is_present_and_matches_runtime_schema_id():
    schema_path = REGISTRY_PATH.with_name("mfam_family_authority.schema.json")
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    assert schema["properties"]["schemaId"]["const"] == "sczn3-mfam-family-authority-v1"
    assert set(schema["required"]) == {
        "schemaId", "registryId", "version", "status", "classificationVocabulary",
        "evidencePolicy", "inventoryAudit", "families", "mechanicalAuthorities", "products",
        "targetProfileBindings", "pairClassifications", "publisherSweep",
        "unresolvedGaps", "sources",
    }


def test_inventory_schema_and_exact_audit_counts():
    schema_path = INVENTORY_AUDIT_PATH.with_name("mfam_inventory_audit.schema.json")
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    assert schema["properties"]["schemaId"]["const"] == "sczn3-mfam-inventory-audit-v1"
    audit = inventory_audit()
    assert audit["counts"] == {
        "sourceEvidenceRecords": 31,
        "publisherIssuingAuthorities": 10,
        "commercialGovernmentProducts": 25,
        "physicalTargetFaces": 35,
        "productFaceRepresentationRecords": 35,
        "exactUniqueFaceDesigns": None,
        "exactUniqueFaceDesignsStatus": "UNPROVEN_WHERE_REVERSE_SIDE_DESIGN_IS_NOT_PRESERVED",
        "additionalNonProductReferenceRepresentations": 1,
        "representationCatalogRecords": 36,
        "geometryCatalogRecords": 23,
        "exactUniquePhysicalGeometries": None,
        "exactUniquePhysicalGeometriesStatus": "UNPROVEN",
        "procedureCatalogRecords": 14,
        "exactUniqueProcedures": None,
        "exactUniqueProceduresStatus": "UNPROVEN_WHERE_PRODUCT_INSTRUCTIONS_ARE_MISSING",
        "candidateGovernedFamilies": 9,
        "runtimeBindings": 2,
    }


def test_inventory_products_claim_all_faces_and_every_face_is_auditable():
    audit = inventory_audit()
    faces = {record["faceId"]: record for record in audit["faces"]}
    claimed = {face_id for record in audit["products"] for face_id in record["faceIds"]}
    assert claimed == set(faces)
    required = {
        "faceId", "productId", "publisherAuthorityId", "exactProduct", "identifiers",
        "side", "representationId", "representation", "dimensions", "geometryId",
        "geometry", "grid", "aimReference", "distance", "procedureId", "procedure",
        "weaponApplicability", "sightEquipmentApplicability", "mechanicalAuthorityIds",
        "registration", "evidenceSourceIds", "governedFamilyId", "runtimeBinding",
        "runtimeStatus", "unresolvedFacts",
    }
    for record in faces.values():
        assert required == set(record), record["faceId"]
    baker_reverse = faces["face-002"]
    assert baker_reverse["geometry"] == "UNPROVEN; do not infer the governed front-face geometry"
    assert baker_reverse["governedFamilyId"] is None


def test_exact_nine_candidate_families_are_cataloged():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    assert [record["familyId"] for record in payload["families"]] == [
        "mfam_m16a1_25m_250m",
        "mfam_m16a2_a3_standard_25m_300m",
        "mfam_m16a4_m4_standard_25m_300m",
        "mfam_modern_a8_moa_25m",
        "mfam_m16a2r_enlarged_23x35",
        "mfam_10m_boresight_offset",
        "mfam_configuration_offset_overlay_on_base",
        "mfam_usmc_36m_bzo",
        "mfam_qualification_course_product_specific",
    ]


def test_only_two_exact_profiles_have_executable_mfam_bindings():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    assert {item["targetProfileId"] for item in payload["targetProfileBindings"]} == {
        "baker_m16a2_25m_zero",
        "m4_25m_zero",
    }
    for target_profile_id in ("baker_m16a2_25m_zero", "m4_25m_zero"):
        resolved = resolve_target_profile(target_profile_id)
        assert resolved["binding"]["status"] == "GOVERNED"
        assert resolved["product"]["runtimeStatus"] == "GOVERNED"
        assert resolved["family"]["status"] == "GOVERNED"
        assert resolved["mechanicalAuthority"]["status"] == "GOVERNED"


def test_unregistered_products_and_families_do_not_gain_execution_authority():
    held = product("rite-in-rain:9125:m16a2-m16a4-front")
    assert held["candidateFamilyId"] == "mfam_m16a2_a3_standard_25m_300m"
    assert held["runtimeStatus"] == "HOLD"
    expect_error(lambda: resolve_target_profile("rite-in-rain:9125:m16a2-m16a4-front"), "mfam_target_profile_not_governed")
    assert family("mfam_m16a2_a3_standard_25m_300m")["status"] == "GOVERNED"


def test_proven_equivalence_does_not_merge_product_or_registration_identity():
    pair = classify_pair("baker:st-uni25mmoa:face", "sczn3:protected-modern-m4-m16-moa:face")
    assert pair["status"] == "PROVEN"
    assert "REPRESENTATION_INK_PUBLISHER_DIFFERENCE_ONLY" in pair["classifications"]
    assert "IDENTITY_REGISTRATION_DIFFERENCE" in pair["classifications"]
    baker = product("baker:st-uni25mmoa:face")
    protected = product("sczn3:protected-modern-m4-m16-moa:face")
    assert baker["candidateFamilyId"] == protected["candidateFamilyId"]
    assert baker["registration"]["status"] == "UNPROVEN"
    assert protected["registration"]["status"] == "GOVERNED"


def test_standard_and_enlarged_m16a2_are_proven_different_geometry():
    pair = classify_pair("baker:st-m16a2-m4:m16a2-face", "baker:st-m16a2r:face")
    assert pair["status"] == "PROVEN"
    assert "GEOMETRY_DIFFERENCE" in pair["classifications"]
    assert product("baker:st-m16a2r:face")["dimensions"] == {"width": 23.0, "height": 35.0, "unit": "IN"}


def test_national_yellow_face_is_representation_variant_not_runtime_alias():
    pair = classify_pair("national-target:23112:two-sided", "national-target:23112:yellow-face")
    assert pair["status"] == "PROVEN"
    assert pair["classifications"] == ["REPRESENTATION_INK_PUBLISHER_DIFFERENCE_ONLY"]
    assert product("national-target:23112:yellow-face")["runtimeStatus"] == "HOLD"
    expect_error(lambda: resolve_target_profile("national-target:23112:yellow-face"), "mfam_target_profile_not_governed")


def test_every_product_preserves_required_evidence_fields():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    required = {
        "productId", "publisherOrIssuer", "exactName", "face", "dimensions",
        "grid", "aim", "procedure", "applicableEquipment", "mechanicalAuthorityIds",
        "registration", "evidenceQuality", "runtimeStatus", "sourceIds",
    }
    for record in payload["products"]:
        assert required.issubset(record), record["productId"]
        assert record["sourceIds"], record["productId"]


def test_human_governance_record_exists():
    path = Path(__file__).resolve().parents[1] / "architecture" / "M_FAM_GOVERNANCE.md"
    assert path.is_file()
    face_catalog = Path(__file__).resolve().parents[1] / "authority-evidence" / "mfam" / "industry-sweep-2026-09-06" / "M_FAM_FACE_LEVEL_MASTER_CATALOG.md"
    assert face_catalog.is_file()
    governance_text = path.read_text(encoding="utf-8")
    catalog_text = face_catalog.read_text(encoding="utf-8")
    audit = inventory_audit()
    for record in audit["faces"]:
        assert f"`{record['faceId']}`" in catalog_text
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    for record in payload["families"]:
        assert f"`{record['familyId']}`" in governance_text


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_") and callable(value)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"M/FAM Family Authority tests passed: {len(tests)}/{len(tests)}")
