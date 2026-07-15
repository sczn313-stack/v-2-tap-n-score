"""Locked Phase 1 authority components for the registered GSSF AC-1 asset."""

GSSF_AC_1_GEOMETRY_PROFILE = {
    "geometryProfileId": "gssf-ac-1-concentric-geometry-v1",
    "version": "1",
    "coordinateSystemVersion": "gssf-ac-1-canonical-coordinate-system-v1",
    "canonicalCenterPx": {"x": 561.8978, "y": 649.6939},
    "pixelsPerInch": 60.9,
    "downZeroRadiusInches": 4.0,
    "plusOneRadiusInches": 6.5,
    "boundaryPolicy": "center-point-inclusive-upper-boundary-v1",
}

GSSF_AC_1_SCORING_PROFILE = {
    "scoringProfileId": "gssf-ac-1-paper-penalty-v1",
    "version": "1",
    "penaltySeconds": {"downZero": 0, "plusOne": 1, "plusThree": 3, "miss": 10},
}

GSSF_AC_1_MISSION_PROFILE = {
    "missionProfileId": "gssf-ac-1-paper-penalty-mission-v1",
    "version": "1",
    "missionFamily": "gssf",
    "resultPackageType": "gssfPaperPenaltyResult",
}

GSSF_AC_1_ATP = {
    "targetProfileId": "gssf_ac_1",
    "targetProfileVersion": "1",
    "geometryProfileId": GSSF_AC_1_GEOMETRY_PROFILE["geometryProfileId"],
    "scoringProfileId": GSSF_AC_1_SCORING_PROFILE["scoringProfileId"],
    "manufacturer": "Glock Shooting Sports Foundation",
    "lifecycleStatus": "supported",
    "geometryAuthorityStatus": "confirmed",
    "scoringAuthorityStatus": "confirmed",
    "missionFamily": "gssf",
    "resultPackageType": "gssfPaperPenaltyResult",
    "authoritySource": "SCZN3 Target Authority Phase 1 locked architecture and registered asset audit",
}

GSSF_AC_1_REGISTRATION_PACKAGE = {
    "registrationPackageId": "gssf-ac-1-clean-png-registration-v1",
    "registrationPackageVersion": "1",
    "registrationStatus": "approved",
    "targetProfileId": GSSF_AC_1_ATP["targetProfileId"],
    "targetProfileVersion": GSSF_AC_1_ATP["targetProfileVersion"],
    "canonicalAssetId": "gssf_ac_1_clean_reference_png_v1",
    "canonicalAssetSha256": "e08eb090f31e64a2fd75f6e88b7267ed9798da4eb438322d1dbc8246e362f030",
    "mediaType": "image/png",
    "imageWidthPx": 1125,
    "imageHeightPx": 1373,
    "coordinateSystemVersion": GSSF_AC_1_GEOMETRY_PROFILE["coordinateSystemVersion"],
    "coordinateOrigin": "top-left; +x right; +y down",
    "canonicalCenterPx": GSSF_AC_1_GEOMETRY_PROFILE["canonicalCenterPx"],
    "pixelsPerInch": GSSF_AC_1_GEOMETRY_PROFILE["pixelsPerInch"],
    "geometryProfileId": GSSF_AC_1_GEOMETRY_PROFILE["geometryProfileId"],
    "assetRole": "scorable_canonical_asset",
    "authoritySource": "SCZN3 Target Authority Phase 1 locked architecture and exact local asset audit",
    "approvedBy": "SCZN3 architecture owner",
    "approvedAt": "2026-07-14",
    "photographedPhysicalTargetSupport": False,
}

GSSF_AC_1_EXECUTION_CONTRACT = {
    "targetExecutionContractId": "gssf-ac-1-live-canonical-v1",
    "missionFamily": "gssf",
    "targetProfileId": GSSF_AC_1_ATP["targetProfileId"],
    "targetProfileVersion": GSSF_AC_1_ATP["targetProfileVersion"],
    "registrationPackageId": GSSF_AC_1_REGISTRATION_PACKAGE["registrationPackageId"],
    "registrationPackageVersion": GSSF_AC_1_REGISTRATION_PACKAGE["registrationPackageVersion"],
    "geometryProfileId": GSSF_AC_1_GEOMETRY_PROFILE["geometryProfileId"],
    "scoringProfileId": GSSF_AC_1_SCORING_PROFILE["scoringProfileId"],
    "missionProfileId": GSSF_AC_1_MISSION_PROFILE["missionProfileId"],
    "missionProfileVersion": GSSF_AC_1_MISSION_PROFILE["version"],
    "resultPackageType": "gssfPaperPenaltyResult",
}

# Compatibility export: existing backend callers and governance tests read this
# object, while its governed geometry and penalties have only one source above.
GSSF_AC_1_PROFILE = {
    "target_profile_id": GSSF_AC_1_ATP["targetProfileId"],
    "mission_family": GSSF_AC_1_EXECUTION_CONTRACT["missionFamily"],
    "downZeroRadiusInches": GSSF_AC_1_GEOMETRY_PROFILE["downZeroRadiusInches"],
    "plusOneRadiusInches": GSSF_AC_1_GEOMETRY_PROFILE["plusOneRadiusInches"],
    "penaltySeconds": GSSF_AC_1_SCORING_PROFILE["penaltySeconds"],
    "authoritySource": "GSSF AC-1 governed canonical geometry and paper-penalty profiles",
}
