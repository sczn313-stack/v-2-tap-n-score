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
    family_scale_proof,
    family,
    hold_clearance_inventory,
    industry_authorization_sweep,
    inventory_audit,
    product,
    registry_metadata,
    resolve_face_admission,
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
    metadata = registry_metadata()
    assert metadata["universalZeroingCapabilityId"] == "sczn3-governed-zeroing-road-v1"
    assert metadata["authorizationSweep"]["counts"]["heldPhysicalFaces"] == 13
    assert len(metadata["rootAuthorityGaps"]) == 7
    assert metadata["authorizationSweep"]["reportPath"].endswith("M_FAM_INDUSTRY_AUTHORIZATION_SWEEP.md")


def test_registry_schema_contract_is_present_and_matches_runtime_schema_id():
    schema_path = REGISTRY_PATH.with_name("mfam_family_authority.schema.json")
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    assert schema["properties"]["schemaId"]["const"] == "sczn3-mfam-family-authority-v1"
    assert set(schema["required"]) == {
        "schemaId", "registryId", "version", "status", "classificationVocabulary",
        "evidencePolicy", "inventoryAudit", "authorizationSweep", "familyConformanceRegistry", "rootAuthorityGaps", "scaleProofs", "families", "familyAuthorityPackages", "mechanicalAuthorities", "products",
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
        "runtimeBindings": 23,
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


def test_twenty_three_exact_profiles_have_executable_mfam_bindings():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    assert {item["targetProfileId"] for item in payload["targetProfileBindings"]} == {
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
        "m4_25m_zero",
        "action_m16_m16a2_25m_zero",
        "gunfun_22460_embedded_m4_25m_zero",
        "army_nsn_6920_01_167_1392_m16a1_25m_zero",
    }
    for target_profile_id in (
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
        "m4_25m_zero",
        "action_m16_m16a2_25m_zero",
        "gunfun_22460_embedded_m4_25m_zero",
        "army_nsn_6920_01_167_1392_m16a1_25m_zero",
    ):
        resolved = resolve_target_profile(target_profile_id)
        assert resolved["binding"]["status"] == "GOVERNED"
        assert resolved["product"]["runtimeStatus"] == "GOVERNED"
        assert resolved["family"]["status"] == "GOVERNED"
        assert resolved["mechanicalAuthority"]["status"] == "GOVERNED"


def test_standard_m16a2_family_authority_is_one_reusable_backend_package():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    packages = payload["familyAuthorityPackages"]
    assert len(packages) == 3
    package = next(item for item in packages if item["familyAuthorityPackageId"] == "MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1")
    assert package["familyAuthorityPackageId"] == "MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1"
    assert package["familyId"] == "mfam_m16a2_a3_standard_25m_300m"
    assert package["universalZeroingCapabilityId"] == "sczn3-governed-zeroing-road-v1"
    assert package["geometryAuthority"]["columns"] == 18
    assert package["geometryAuthority"]["rows"] == 20
    assert package["geometryAuthority"]["square"] == {"value": 0.96, "unit": "CM"}
    assert package["aimAuthority"]["gridOriginToAim"] == {"columns": 9, "rows": 10}
    assert package["mechanicalAuthorityIds"] == [
        "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
    ]
    assert package["confirmationAuthority"]["minimumShots"] == 3
    assert package["confirmationAuthority"]["residualTolerance"] == {"value": 1.0, "unit": "IN"}
    resolved = resolve_target_profile("baker_m16a2_25m_zero")
    assert resolved["familyAuthorityPackage"] == package
    assert resolved["binding"]["familyAuthorityPackageId"] == package["familyAuthorityPackageId"]
    assert resolved["binding"]["canonicalRepresentationAuthority"]["targetId"] == "BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1"


def test_printer_authority_sweep_reuses_one_standard_m4_family_package():
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    package = next(
        item for item in payload["familyAuthorityPackages"]
        if item["familyAuthorityPackageId"] == "MFAM-STANDARD-M16A4-M4-FAMILY-AUTHORITY-v1"
    )
    assert package["geometryAuthority"]["columns"] == 14
    assert package["geometryAuthority"]["rows"] == 16
    assert package["geometryAuthority"]["square"] == {"value": 1.3, "unit": "CM"}
    assert package["aimAuthority"]["gridOriginToAim"] == {"columns": 7, "rows": 8}
    assert package["mechanicalAuthorityIds"] == [
        "M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011",
        "M16A4-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011",
    ]
    baker = resolve_target_profile("baker_m4_25m_zero")
    gunfun = resolve_target_profile("gunfun_82020_m16a2_25m_zero")
    assert baker["familyAuthorityPackage"] == package
    assert baker["binding"]["inventoryFaceId"] == "face-004"
    assert gunfun["binding"]["inventoryFaceId"] == "face-029"
    assert gunfun["binding"]["familyAuthorityPackageId"] == "MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1"
    for profile_id, face_id in {
        "rite_9125_m4_25m_zero": "face-007",
        "national_23075_m4_25m_zero": "face-014",
        "qualification_m4_25m_zero": "face-017",
        "speedwell_dodm4_m4_25m_zero": "face-019",
        "action_m4_carbine_25m_zero": "face-021",
        "army_nsn_6920_01_395_2949_m4_25m_zero": "face-033",
        "gunfun_32110_m16a4_red_25m_zero": "face-026",
        "gunfun_32120_m16a4_green_25m_zero": "face-028",
    }.items():
        resolved = resolve_target_profile(profile_id)
        assert resolved["familyAuthorityPackage"] == package
        assert resolved["binding"]["inventoryFaceId"] == face_id
        authority = resolved["binding"]["canonicalRepresentationAuthority"]
        assert authority["authorityScope"] == "UGO_GEOMETRY_TEMPLATE_NOT_PRODUCT_IDENTITY"
        assert authority["productIdentityAuthority"]["faceId"] == face_id


def test_standard_m16a2_scale_proof_is_auditable_and_evidence_limited():
    proof = family_scale_proof("MFAM-SCALE-PROOF-01-STANDARD-M16A2-A3")
    assert proof["familyId"] == "mfam_m16a2_a3_standard_25m_300m"
    assert proof["counts"] == {
        "candidateFaces": 9,
        "familyAuthorityPackagesCreated": 1,
        "alreadyExecutable": 1,
        "newlyExecutableThroughInheritance": 0,
        "stillHold": 8,
        "productSpecificZeroingImplementationsCreated": 0,
        "universalZeroingRoadsCreated": 0,
        "totalExecutableBindingsAfterProof": 1,
    }
    assert proof["familyLeverage"] == 1.0
    assert proof["admittedTargetProfileIds"] == ["baker_m16a2_25m_zero"]
    assert {item["faceId"] for item in proof["holdReasons"]} == {
        "face-006", "face-013", "face-016", "face-018",
        "face-020", "face-025", "face-027", "face-032",
    }


def test_industry_authorization_sweep_uses_all_faces_without_inventing_authority():
    sweep = industry_authorization_sweep()
    assert sweep["counts"] == {
        "authorizedNowRuntimeBindings": 3,
        "alreadyAuthorizedRuntimeBindings": 20,
        "alreadyAuthorizedPhysicalFaces": 22,
        "heldPhysicalFaces": 13,
        "knownHeldFacesWithAuthorizedGeometry": 3,
        "heldFacesAssignedToCandidateFamily": 9,
        "heldFacesUnassigned": 4,
        "candidateFamilies": 9,
    }
    assert {item["runtimeBinding"] for item in sweep["authorizedNow"]} == {
        "action_m16_m16a2_25m_zero", "gunfun_22460_embedded_m4_25m_zero",
        "army_nsn_6920_01_167_1392_m16a1_25m_zero",
    }
    assert {item.get("targetProfileId") or item.get("runtimeBinding") for item in sweep["alreadyAuthorized"]} == {
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
        "rite_9125_m4_25m_zero", "national_23075_m4_25m_zero",
        "qualification_m4_25m_zero", "speedwell_dodm4_m4_25m_zero",
        "action_m4_carbine_25m_zero", "army_nsn_6920_01_395_2949_m4_25m_zero",
        "m4_25m_zero",
        "gunfun_32110_m16a4_red_25m_zero", "gunfun_32120_m16a4_green_25m_zero",
    }
    assert len(sweep["hold"]) == 13
    assert {item["faceId"] for item in sweep["hold"]} == {
        f"face-{index:03d}" for index in range(1, 36)
    } - {"face-003", "face-004", "face-006", "face-007", "face-013", "face-014", "face-016", "face-017", "face-018", "face-019", "face-020", "face-021", "face-022", "face-025", "face-026", "face-027", "face-028", "face-029", "face-030", "face-031", "face-032", "face-033"}


def test_hold_clearance_inventory_groups_every_hold_without_forcing_family_membership():
    plan = hold_clearance_inventory()
    assert plan["heldFaceCount"] == 13
    assert plan["assignedHeldFaceCount"] == 9
    assert plan["unassignedHeldFaceCount"] == 4
    assert len(plan["families"]) == 9
    grouped = {face_id for family_record in plan["families"] for face_id in family_record["heldFaceIds"]}
    unassigned = set(plan["unassignedFaceIds"])
    assert len(grouped) == 9
    assert len(unassigned) == 4
    assert not grouped.intersection(unassigned)
    assert grouped | unassigned == {
        f"face-{index:03d}" for index in range(1, 36)
    } - {"face-003", "face-004", "face-006", "face-007", "face-013", "face-014", "face-016", "face-017", "face-018", "face-019", "face-020", "face-021", "face-022", "face-025", "face-026", "face-027", "face-028", "face-029", "face-030", "face-031", "face-032", "face-033"}
    counts = {record["familyId"]: record["heldFaceCount"] for record in plan["families"]}
    assert counts == {
        "mfam_m16a1_25m_250m": 0,
        "mfam_m16a2_a3_standard_25m_300m": 0,
        "mfam_m16a4_m4_standard_25m_300m": 0,
        "mfam_modern_a8_moa_25m": 6,
        "mfam_m16a2r_enlarged_23x35": 1,
        "mfam_10m_boresight_offset": 1,
        "mfam_configuration_offset_overlay_on_base": 0,
        "mfam_usmc_36m_bzo": 0,
        "mfam_qualification_course_product_specific": 1,
    }


def test_known_identity_geometry_and_execution_states_are_distinct():
    executable = resolve_face_admission("face-003")
    assert executable["targetState"] == "KNOWN_TARGET_EXECUTION_AUTHORIZED"
    assert executable["runtimeBinding"] == "baker_m16a2_25m_zero"
    assert executable["shooterRecovery"] is None

    reusable_geometry = resolve_face_admission("face-001")
    assert reusable_geometry["targetState"] == "KNOWN_TARGET_GEOMETRY_AUTHORIZED"
    assert reusable_geometry["geometryAuthorityStatus"] == "AUTHORIZED_REUSABLE"
    assert reusable_geometry["disposition"] == "HOLD"
    assert reusable_geometry["missingFacts"] == [
        "production registration", "exact selected equipment branch", "confirmation",
    ]
    assert reusable_geometry["shooterRecovery"]["title"] == "THIS TARGET IS KNOWN"

    newly_executable = resolve_face_admission("face-006")
    assert newly_executable["targetState"] == "KNOWN_TARGET_EXECUTION_AUTHORIZED"
    assert newly_executable["disposition"] == "ALREADY_AUTHORIZED"

    unknown = resolve_face_admission("not-an-admitted-mfam-target")
    assert unknown["targetState"] == "UNKNOWN_TARGET"
    assert unknown["shooterRecovery"]["title"] == "WE CAN’T IDENTIFY THIS TARGET"


def test_baker_st_m16a2r_is_known_different_and_reports_only_its_real_gaps():
    for identity in ("face-005", "product-baker-st-m16a2r", "ST-M16A2R", "baker:st-m16a2r:face"):
        result = resolve_face_admission(identity)
        assert result["targetKnowledge"] == "KNOWN_TARGET"
        assert result["exactProduct"] == "25 Meter Sighting Target with Red"
        assert result["geometryId"] == "geometry-baker-m16a2r-23x35"
        assert result["targetState"] == "KNOWN_TARGET_AUTHORITY_UNRESOLVED"
        assert result["missingFacts"] == [
            "grid pitch", "page origin", "aim reference", "registration", "mechanical applicability",
        ]
        assert "photo" not in result["shooterRecovery"]["message"].lower()


def test_two_sided_known_product_requires_face_identity_instead_of_becoming_unknown():
    result = resolve_face_admission("product-baker-st-m16a2-m4")
    assert result["targetKnowledge"] == "KNOWN_TARGET"
    assert result["targetState"] == "KNOWN_TARGET_AUTHORITY_UNRESOLVED"
    assert result["candidateFaceIds"] == ["face-003", "face-004"]
    assert result["missingFacts"] == ["exact face/side selection"]


def test_shared_m16a4_mechanical_gap_is_governed_once_and_inherited():
    admitted = resolve_face_admission("face-026")
    assert admitted["missingFacts"] == []
    assert admitted["disposition"] == "ALREADY_AUTHORIZED"
    resolved = resolve_target_profile("gunfun_32110_m16a4_red_25m_zero")
    assert resolved["mechanicalAuthority"]["mechanicalAuthorityId"] == "M16A4-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
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
    authorization_report = face_catalog.with_name("M_FAM_INDUSTRY_AUTHORIZATION_SWEEP.md")
    hold_clearance_plan = face_catalog.with_name("M_FAM_HOLD_CLEARANCE_PLAN.md")
    scale_proof = face_catalog.parent / "scale-proof-05" / "M_FAM_SCALE_PROOF_05_MATERIAL_ADMISSION.md"
    scale_sweep = face_catalog.parent / "scale-sweep-06" / "M_FAM_SCALE_SWEEP_06_BATCH_ADMISSION.md"
    printer_authority_sweep = face_catalog.parent / "scale-sweep-07" / "M_FAM_SCALE_SWEEP_07_PRINTER_AUTHORITY_LOCK.md"
    assert face_catalog.is_file()
    assert authorization_report.is_file()
    assert hold_clearance_plan.is_file()
    assert scale_proof.is_file()
    assert scale_sweep.is_file()
    assert printer_authority_sweep.is_file()
    governance_text = path.read_text(encoding="utf-8")
    catalog_text = face_catalog.read_text(encoding="utf-8")
    authorization_text = authorization_report.read_text(encoding="utf-8")
    clearance_text = hold_clearance_plan.read_text(encoding="utf-8")
    scale_text = scale_proof.read_text(encoding="utf-8")
    audit = inventory_audit()
    for record in audit["faces"]:
        assert f"`{record['faceId']}`" in catalog_text
        if record["faceId"] != "face-003":
            assert f"`{record['faceId']}`" in authorization_text
    payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    for record in payload["families"]:
        assert f"`{record['familyId']}`" in governance_text
        assert f"`{record['familyId']}`" in clearance_text
    assert "Baker `ST-M16A2R`" in authorization_text
    assert "| `AUTHORIZED NOW` — new runtime bindings | 2 |" in authorization_text
    assert "| `HOLD` — known physical product faces | 24 |" in authorization_text
    assert "Baker `ST-M16A2R`" in clearance_text
    for face_id in ("face-003", "face-006", "face-013", "face-016", "face-018", "face-020", "face-025", "face-027", "face-032"):
        assert f"`{face_id}`" in scale_text
    assert "FAMILY LEVERAGE" in scale_text
    assert "Baker `ST-Uni25mMOA`" in clearance_text
    assert "National `23112` no-yellow" in clearance_text
    assert "National `23112` yellow-circle" in clearance_text
    sweep_text = scale_sweep.read_text(encoding="utf-8")
    assert "Known physical faces processed | 35" in sweep_text
    assert "Executable runtime bindings after | 12" in sweep_text
    assert "Product-specific zeroing implementations created | 0" in sweep_text
    printer_text = printer_authority_sweep.read_text(encoding="utf-8")
    assert "| **EXECUTABLE** | **17** |" in printer_text
    assert "| **TRUE AUTHORITY GAP** | **18** |" in printer_text
    assert "| **TOTAL** | **35** |" in printer_text
    assert "New independent evidence artifacts: `0`" in printer_text


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_") and callable(value)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"M/FAM Family Authority tests passed: {len(tests)}/{len(tests)}")
