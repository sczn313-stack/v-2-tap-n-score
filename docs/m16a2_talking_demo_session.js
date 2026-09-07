(function exposeM16A2TalkingDemoFixture(global) {
  "use strict";

  if (new URLSearchParams(global.location.search).get("m16a2_demo") !== "1") return;

  const aim = Object.freeze({ xPercent: 50, yPercent: 48.7, shotId: "demo-aim" });
  const initialImpacts = Object.freeze([
    Object.freeze({ xPercent: 61.2, yPercent: 33.7, shotId: "demo-initial-1" }),
    Object.freeze({ xPercent: 66, yPercent: 35.1, shotId: "demo-initial-2" }),
    Object.freeze({ xPercent: 63.3, yPercent: 37.7, shotId: "demo-initial-3" })
  ]);
  const confirmationImpacts = Object.freeze([
    Object.freeze({ xPercent: 44, yPercent: 45, shotId: "demo-confirmation-1" }),
    Object.freeze({ xPercent: 56, yPercent: 48.7, shotId: "demo-confirmation-2" }),
    Object.freeze({ xPercent: 50, yPercent: 52.4, shotId: "demo-confirmation-3" })
  ]);
  const adjustmentProfileId = "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011";
  const equipmentConfigurationId = "M16A2-STANDARD-IRON-FSP-REAR-DRUM";
  const target = Object.freeze({
    image: "assets/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg",
    imageSha256: "250f77079bd13198a8d3c301e204f58c8e96752631f9aec479c29f8f2f5c7993",
    width: 773,
    height: 1000,
    profileId: "baker_m16a2_25m_zero",
    profileVersion: "BAKER_M16A2_25M_AUTHORITY_v1",
    targetId: "BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1",
    name: "Baker M16A2 25 Meter Zeroing Target",
    distanceValue: 25,
    distanceUnit: "METERS"
  });
  const equipmentProfile = Object.freeze({
    setupId: "sczn3-m16a2-tstt-demo-equipment-v1",
    setupName: "M16A2 · Standard Iron Sights",
    weaponCategory: "Rifle",
    weaponManufacturer: "Military M-Series Rifles",
    weaponModelType: "M16A2",
    weaponModelCaliber: "5.56 NATO",
    opticType: "Iron Sights",
    equipmentConfigurationId,
    adjustmentProfileId,
    adjustmentSystem: "M16A2_IRON_FSP_REAR_DRUM",
    opticAdjustmentUnit: "MOA",
    targetDistanceValue: "25",
    targetDistanceUnit: "METERS"
  });
  const mechanicalSightAuthority = Object.freeze({
    status: "proven",
    authorityOwner: "Equipment Authority",
    adjustmentProfileId,
    equipmentConfigurationId,
    adjustmentSystem: "M16A2_IRON_FSP_REAR_DRUM",
    displayName: "M16A2 Standard Front Sight Post + Rear Sight Windage/Elevation Controls"
  });
  const clickModel = Object.freeze({
    system: "M16A2_IRON_FSP_REAR_DRUM",
    label: mechanicalSightAuthority.displayName,
    unit: "MOA",
    windagePerClick: 0.5,
    elevationPerClick: 1.25,
    authorityStatus: "proven",
    authorityId: adjustmentProfileId,
    turnDirections: Object.freeze({
      windage: Object.freeze({ RIGHT: "CLOCKWISE", LEFT: "COUNTERCLOCKWISE" }),
      elevation: Object.freeze({ UP: "CLOCKWISE", DOWN: "COUNTERCLOCKWISE" })
    })
  });
  const initialAuthorityPackage = Object.freeze({
    authoritySource: "backend-authoritative",
    authorityVersion: "sczn3-standard-m16a2-a3-family-authority-v1",
    target_profile_id: target.profileId,
    targetProfileId: target.profileId,
    targetProfileVersion: target.profileVersion,
    mission_family: "zeroingCorrection",
    missionFamilyId: "zeroingCorrection",
    resultPackageType: "zeroCorrectionResult",
    phase: "initial",
    target: Object.freeze({ targetId: target.targetId, targetName: target.name }),
    inputs: Object.freeze({ aimCoordinate: aim, impactCoordinates: initialImpacts, distanceYards: 27.3403, shooterSetup: equipmentProfile }),
    impacts: initialImpacts,
    poib: Object.freeze({ xPercent: 63.5, yPercent: 35.5 }),
    groupCenter: Object.freeze({ xPercent: 63.5, yPercent: 35.5 }),
    group: Object.freeze({ status: "calculated", display: "3-shot pattern" }),
    correction: Object.freeze({
      windage: "8 clicks LEFT",
      elevation: "4 clicks DOWN",
      windageDirection: "LEFT",
      elevationDirection: "DOWN",
      windageTurnDirection: "COUNTERCLOCKWISE",
      elevationTurnDirection: "COUNTERCLOCKWISE"
    }),
    clicks: Object.freeze({
      windageClicks: 8,
      elevationClicks: 4,
      windageDirection: "LEFT",
      elevationDirection: "DOWN",
      windageTurnDirection: "COUNTERCLOCKWISE",
      elevationTurnDirection: "COUNTERCLOCKWISE",
      model: clickModel
    }),
    angular: Object.freeze({ windageMOA: 3.8452, elevationMOA: 4.8681, windageMRAD: 1.1183, elevationMRAD: 1.4158 }),
    renderCoordinates: Object.freeze({
      aim,
      impacts: initialImpacts,
      poib: Object.freeze({ xPercent: 63.5, yPercent: 35.5 }),
      vector: Object.freeze({ start: Object.freeze({ xPercent: 63.5, yPercent: 35.5 }), end: aim, intent: "POIB_TO_CONFIRMED_AIM" }),
      coordinatePlane: "source_photo"
    }),
    mechanicalValidation: Object.freeze({ status: "calculated", method: "registered-sight-mechanics-v1" }),
    calculationReconciliation: Object.freeze({ status: "reconciled" }),
    mechanicalSightAuthority,
    validation: Object.freeze({ status: "not-requested", outcome: "PENDING" }),
    status: Object.freeze({ hasAim: true, impactCount: 3, hasPOIB: true, hasCorrection: true, hasMechanicalRecommendation: true })
  });
  const confirmationAuthorityPackage = Object.freeze({
    ...initialAuthorityPackage,
    phase: "confirmation",
    inputs: Object.freeze({ aimCoordinate: aim, impactCoordinates: confirmationImpacts, distanceYards: 27.3403, shooterSetup: equipmentProfile }),
    impacts: confirmationImpacts,
    poib: Object.freeze({ xPercent: 50, yPercent: 48.7 }),
    groupCenter: Object.freeze({ xPercent: 50, yPercent: 48.7 }),
    correction: Object.freeze({ windage: "0 clicks CENTER", elevation: "0 clicks CENTER", windageDirection: "CENTER", elevationDirection: "CENTER" }),
    clicks: Object.freeze({ windageClicks: 0, elevationClicks: 0, windageDirection: "CENTER", elevationDirection: "CENTER", windageTurnDirection: null, elevationTurnDirection: null, model: clickModel }),
    renderCoordinates: Object.freeze({
      aim,
      impacts: confirmationImpacts,
      poib: Object.freeze({ xPercent: 50, yPercent: 48.7 }),
      vector: Object.freeze({ start: Object.freeze({ xPercent: 50, yPercent: 48.7 }), end: aim, intent: "POIB_TO_CONFIRMED_AIM" }),
      coordinatePlane: "source_photo"
    }),
    validation: Object.freeze({
      status: "calculated",
      outcome: "CONFIRMED",
      confirmed: true,
      minimumShotsMet: true,
      residualOffsetInches: 0,
      standard: "3+ confirmed shots; POIB within 1.00 inch of confirmed aim point",
      method: "zeroing-confirmation-authority-v1"
    })
  });

  global.SCZN3_BAKER_TALKING_DEMO_FIXTURE = Object.freeze({
    schemaVersion: "sczn3-talking-target-demo-session-v1",
    demoKind: "m16a2-tstt",
    fixtureAuthority: Object.freeze({
      owner: "SCZN3 Backend Authority",
      method: "docs/production/authority_adapter.mjs::buildAuthorityPackage",
      generatedFrom: "prepared M16A2 target observations",
      generatedAt: "2026-09-04T18:50:00Z"
    }),
    sessionId: "sczn3-tstt-m16a2-demo-v1",
    simulationSessionId: "",
    returnUrl: "m16a2-tstt.html?chapter=4",
    target,
    equipmentProfile,
    equipmentProfiles: Object.freeze([equipmentProfile]),
    aim,
    initialImpacts,
    confirmationImpacts,
    initialAuthorityPackage,
    confirmationAuthorityPackage
  });
})(window);
