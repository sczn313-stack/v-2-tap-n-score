(function exposeBakerTalkingDemoFixture(global) {
  "use strict";

  const initialImpacts = Object.freeze([
    { xPercent: 29.0001, yPercent: 30.9999, shotId: "sample-initial-1" },
    { xPercent: 34.0001, yPercent: 32.9999, shotId: "sample-initial-2" },
    { xPercent: 27.0, yPercent: 36.0, shotId: "sample-initial-3" },
    { xPercent: 32.0001, yPercent: 38.0, shotId: "sample-initial-4" },
    { xPercent: 37.0001, yPercent: 35.0, shotId: "sample-initial-5" }
  ]);
  const confirmationImpacts = Object.freeze([
    { xPercent: 47.9998, yPercent: 55.4999, shotId: "sample-confirmation-1" },
    { xPercent: 50.9998, yPercent: 54.9999, shotId: "sample-confirmation-2" },
    { xPercent: 52.9998, yPercent: 56.9999, shotId: "sample-confirmation-3" },
    { xPercent: 51.9998, yPercent: 58.4999, shotId: "sample-confirmation-4" },
    { xPercent: 48.9998, yPercent: 59.0, shotId: "sample-confirmation-5" }
  ]);
  const aim = Object.freeze({ xPercent: 49.9998, yPercent: 56.6, shotId: "sample-aim" });
  const equipmentProfile = Object.freeze({
    setupId: "sczn3-talking-demo-equipment-profile-v1",
    setupName: "100 Yard Rifle Setup",
    equipmentProfileSchemaVersion: "sczn3-equipment-profile-v2",
    equipmentCatalogVersion: "episode58-snapshot13-2026-08-24",
    equipmentIdentityStatus: "simulation_reference",
    equipmentIdentitySource: "talking_target_demo_session",
    weaponCategory: "Rifle",
    weaponManufacturer: "Other",
    weaponModelType: "Shooter's Rifle",
    weaponModelCaliber: ".223 / 5.56 NATO",
    opticType: "Scope",
    opticBrand: "Other",
    opticModel: "Quarter-MOA Scope",
    magnification: "1x",
    opticAdjustmentUnit: "MOA",
    opticClickValue: 0.25,
    opticClickValueLabel: "0.25 MOA",
    opticClickValueMOA: 0.25,
    ammoCaliber: ".223 / 5.56 NATO",
    weaponPhoto: Object.freeze({
      dataUrl: "assets/landing-package-hero-rifle.png",
      name: "founder-supplied-demo-firearm.png",
      type: "image/png",
      source: "talking_target_demo_fixture"
    }),
    createdAt: "2026-08-29T21:07:29Z",
    updatedAt: "2026-08-29T21:07:29Z"
  });
  const equipmentProfiles = Object.freeze([
    equipmentProfile,
    Object.freeze({
      ...equipmentProfile,
      setupId: "sczn3-talking-demo-equipment-profile-v2",
      setupName: "Range Rifle",
      weaponManufacturer: "Ruger",
      weaponModelType: "AR-556",
      opticType: "Red Dot",
      opticBrand: "Aimpoint",
      opticModel: "PRO",
      opticClickValue: 0.5,
      opticClickValueLabel: "0.5 MOA",
      opticClickValueMOA: 0.5,
      weaponPhoto: null
    }),
    Object.freeze({
      ...equipmentProfile,
      setupId: "sczn3-talking-demo-equipment-profile-v3",
      setupName: "Service Rifle",
      weaponManufacturer: "Colt",
      weaponModelType: "M4 Carbine",
      opticType: "Prism",
      opticBrand: "Trijicon",
      opticModel: "ACOG",
      magnification: "4x",
      opticClickValue: 0.5,
      opticClickValueLabel: "0.5 MOA",
      opticClickValueMOA: 0.5,
      weaponPhoto: null
    })
  ]);

  const initialAuthorityPackage = Object.freeze({
    authoritySource: "backend-authoritative",
    authorityVersion: "sczn3-ugeo-authority-v1",
    target_profile_id: "baker_st_100yd_smart_zero",
    targetProfileId: "baker_st_100yd_smart_zero",
    targetProfileVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
    mission_family: "zeroingCorrection",
    missionFamilyId: "zeroingCorrection",
    resultPackageType: "zeroCorrectionResult",
    phase: "initial",
    target: Object.freeze({
      targetId: "BAKER_ST_100YD_SMART",
      targetName: "Baker 100 Yard Smart Target",
      target_profile_id: "baker_st_100yd_smart_zero",
      targetProfileId: "baker_st_100yd_smart_zero",
      mission_family: "zeroingCorrection",
      missionFamilyId: "zeroingCorrection",
      manufacturer: "Baker Targets"
    }),
    inputs: Object.freeze({
      aimCoordinate: aim,
      impactCoordinates: initialImpacts,
      distanceYards: 100,
      opticAdjustment: Object.freeze({ unit: "MOA", clickValue: 0.25, clickValueMOA: 0.25, clickValueLabel: "0.25 MOA" })
    }),
    impacts: initialImpacts,
    poib: Object.freeze({ xPercent: 31.8, yPercent: 34.6001 }),
    groupCenter: Object.freeze({ xPercent: 31.8, yPercent: 34.6001 }),
    group: Object.freeze({ valueMOA: 2.42, diameterInches: 2.5385, method: "authority-v1-max-spread", status: "calculated", display: "2.42 MOA" }),
    correction: Object.freeze({
      xInches: -4.0931,
      yInches: -7.691,
      adjustmentUnit: "MOA",
      clickValue: 0.25,
      clickValueLabel: "0.25 MOA",
      windageDirection: "RIGHT",
      elevationDirection: "DOWN",
      windage: "16 clicks RIGHT",
      elevation: "29 clicks DOWN"
    }),
    clicks: Object.freeze({
      windageClicks: 16,
      elevationClicks: 29,
      windageDirection: "RIGHT",
      elevationDirection: "DOWN",
      adjustmentUnit: "MOA",
      clickValue: 0.25,
      clickValueLabel: "0.25 MOA"
    }),
    moa: Object.freeze({ windageMOA: 3.9094, elevationMOA: 7.3457 }),
    angular: Object.freeze({ windageMOA: 3.9094, elevationMOA: 7.3457 }),
    renderCoordinates: Object.freeze({
      aim,
      impacts: initialImpacts,
      poib: Object.freeze({ xPercent: 31.8, yPercent: 34.6001 }),
      vector: Object.freeze({
        start: Object.freeze({ xPercent: 31.8, yPercent: 34.6001 }),
        end: aim,
        intent: "POIB_TO_AIM"
      }),
      coordinatePlane: "canonical_target"
    }),
    validation: Object.freeze({ status: "not-requested", outcome: "PENDING" }),
    status: Object.freeze({ hasAim: true, impactCount: 5, hasPOIB: true, hasCorrection: true, hasResult: true })
  });

  const confirmationAuthorityPackage = Object.freeze({
    authoritySource: "backend-authoritative",
    authorityVersion: "sczn3-ugeo-authority-v1",
    target_profile_id: "baker_st_100yd_smart_zero",
    targetProfileId: "baker_st_100yd_smart_zero",
    targetProfileVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
    mission_family: "zeroingCorrection",
    missionFamilyId: "zeroingCorrection",
    resultPackageType: "zeroCorrectionResult",
    phase: "confirmation",
    impacts: confirmationImpacts,
    poib: Object.freeze({ xPercent: 50.6001, yPercent: 56.9999 }),
    groupCenter: Object.freeze({ xPercent: 50.6001, yPercent: 56.9999 }),
    group: Object.freeze({ valueMOA: 1.4, diameterInches: 1.469, method: "authority-v1-max-spread", status: "calculated", display: "1.40 MOA" }),
    correction: Object.freeze({
      xInches: 0.135,
      yInches: 0.1398,
      adjustmentUnit: "MOA",
      clickValue: 0.25,
      clickValueLabel: "0.25 MOA",
      windageDirection: "LEFT",
      elevationDirection: "UP",
      windage: "1 clicks LEFT",
      elevation: "1 clicks UP"
    }),
    clicks: Object.freeze({
      windageClicks: 1,
      elevationClicks: 1,
      windageDirection: "LEFT",
      elevationDirection: "UP",
      adjustmentUnit: "MOA",
      clickValue: 0.25,
      clickValueLabel: "0.25 MOA"
    }),
    moa: Object.freeze({ windageMOA: 0.1289, elevationMOA: 0.1335 }),
    angular: Object.freeze({ windageMOA: 0.1289, elevationMOA: 0.1335 }),
    renderCoordinates: Object.freeze({
      aim,
      impacts: confirmationImpacts,
      poib: Object.freeze({ xPercent: 50.6001, yPercent: 56.9999 }),
      vector: Object.freeze({
        start: Object.freeze({ xPercent: 50.6001, yPercent: 56.9999 }),
        end: aim,
        intent: "POIB_TO_AIM"
      }),
      coordinatePlane: "canonical_target"
    }),
    validation: Object.freeze({
      status: "authority_unavailable",
      outcome: "CONFIRMATION DECISION UNAVAILABLE",
      evidenceStatus: "recorded",
      confirmed: null,
      reason: "authoritative_confirmation_standard_not_registered"
    }),
    status: Object.freeze({ hasAim: true, impactCount: 5, hasPOIB: true, hasCorrection: true, hasResult: true })
  });

  global.SCZN3_BAKER_TALKING_DEMO_FIXTURE = Object.freeze({
    schemaVersion: "sczn3-talking-target-demo-session-v1",
    fixtureAuthority: Object.freeze({
      owner: "SCZN3 Backend Authority",
      method: "docs/backend/authority_service.py::build_authority_package",
      generatedFrom: "canonical Baker target coordinates",
      generatedAt: "2026-08-29T21:07:29Z",
      sourcePackageEvidenceHashes: Object.freeze({
        initial: "fd69ed6dc235aaa38a1536cf043180bc5044811e184b394007a984e39160f61c",
        confirmation: "c468b234ae58402b244e0840e335fbfa29f8a81415991ccf2b9d3129ebe70746"
      })
    }),
    sessionId: "sczn3-talking-demo-baker-100yd-v1",
    simulationSessionId: "sczn3-talking-demo-baker-100yd-v1",
    equipmentProfile,
    equipmentProfiles,
    aim,
    initialImpacts,
    confirmationImpacts,
    initialAuthorityPackage,
    confirmationAuthorityPackage
  });
})(window);
