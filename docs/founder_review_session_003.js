(function exposeFounderReviewSession003() {
  "use strict";

  const targetId = "ST-M16A2/M4";
  const targetName = "M4 Carbine • 25 Meter Zeroing Target";
  const equipmentRecordId = "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28";
  const targetImage =
    "authority-evidence/m4-target-reconstruction/M4_M16_25M_WORKSPACE_PRESENTATION.svg";
  const initialImpacts = [
    { xPercent: 57.2, yPercent: 58.1, shotId: "initial-shot-1" },
    { xPercent: 58.1, yPercent: 57.4, shotId: "initial-shot-2" },
    { xPercent: 57.6, yPercent: 58.6, shotId: "initial-shot-3" }
  ];
  const confirmationImpacts = [
    { xPercent: 49.7, yPercent: 48.5, shotId: "confirmation-shot-1" },
    { xPercent: 50.2, yPercent: 48.8, shotId: "confirmation-shot-2" },
    { xPercent: 50.1, yPercent: 48.6, shotId: "confirmation-shot-3" }
  ];

  const sightModel = {
    system: "M4_IRON_DCH_FSP",
    label: "M4/M4A1 Carbine — Detachable Carrying Handle and Front Sight Post",
    unit: "MOA",
    windagePerClick: 0.75,
    elevationPerClick: 1.5,
    authorityStatus: "proven",
    authorityId: equipmentRecordId,
    roundingRule: "nearest-whole-click-half-to-even",
    turnDirections: {
      windage: { RIGHT: "CLOCKWISE", LEFT: "COUNTERCLOCKWISE" },
      elevation: { UP: "CLOCKWISE", DOWN: "COUNTERCLOCKWISE" }
    },
    equipmentAuthorityRecordId: equipmentRecordId
  };
  const target = {
    vendor: "Baker",
    sku: targetId,
    targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
    targetName,
    product: targetName,
    authority: "M4 Zeroing"
  };
  const setup = {
    opticType: "Iron Sights",
    adjustmentSystem: "M4_IRON_DCH_FSP",
    equipmentAuthorityRecordId: equipmentRecordId
  };
  const mechanicalSightAuthority = {
    recordId: equipmentRecordId,
    status: "proven",
    source: "FM 3-22.9 Change 1"
  };
  const mechanicalValidation = {
    status: "calculated",
    authorityStatus: "proven",
    calculationReconciliation: "reconciled",
    equipmentAuthorityRecordId: equipmentRecordId
  };
  function reconciledAxis(axis, angularValue, clickConstant, displayedClicks) {
    const displayedAngularValue = Number(angularValue.toFixed(2));
    return {
      status: "reconciled",
      axis,
      chain: "measured offset → MOA/MRAD → sight constant → raw clicks → rounding → displayed clicks",
      adjustmentUnit: "MOA",
      angularValue,
      displayedAngularValue,
      clickConstant,
      rawClicks: Number((angularValue / clickConstant).toFixed(4)),
      displayedRawClicks: Number((displayedAngularValue / clickConstant).toFixed(4)),
      roundingRule: sightModel.roundingRule,
      expectedClicks: displayedClicks,
      displayedExpectedClicks: displayedClicks,
      displayedClicks
    };
  }
  const geometryValidation = {
    status: "calculated",
    method: "confirmed-aim-minus-confirmed-poib-v1",
    vectorStart: "POIB",
    vectorEnd: "CONFIRMED_AIM_POINT",
    physicalDisplacementInches: { x: -1.3072, y: -1.9822 },
    magnitudeInches: 2.3748
  };
  const confirmationGeometryValidation = {
    status: "calculated",
    method: "confirmed-aim-minus-confirmed-poib-v1",
    vectorStart: "POIB",
    vectorEnd: "CONFIRMED_AIM_POINT",
    physicalDisplacementInches: { x: 0, y: 0.0141 },
    magnitudeInches: 0.0141
  };

  const initialAuthority = {
    authorityVersion: "m4-authority-v1.2",
    authorityRoute: "/api/authority/m4",
    target,
    phase: "initial",
    inputs: {
      targetId,
      targetDistanceValue: 25,
      targetDistanceUnit: "M",
      targetZeroValue: 300,
      targetZeroUnit: "M",
      confirmedAimPoint: { xPercent: 50, yPercent: 48.7, shotId: "founder-aim" },
      aimCoordinate: { xPercent: 50, yPercent: 48.7, shotId: "founder-aim" },
      impactCoordinates: initialImpacts,
      shooterSetup: setup
    },
    poib: {
      xPercent: 57.6333,
      yPercent: 58.0333
    },
    group: {
      status: "calculated",
      diameterInches: 0.2689,
      valueMOA: 0.94,
      display: "0.27\" · 0.94 MOA",
      method: "m4-authority-max-spread-v1"
    },
    score: {
      value: 60,
      status: "calculated",
      method: "m4-authority-distance-v1",
      band: "corrective",
      rawScore: 18,
      possibleScore: 30
    },
    correction: {
      impactOffsetInches: { x: 1.3072, y: 1.9822 },
      aimMinusPOIBInches: { x: -1.3072, y: -1.9822 },
      windageDirection: "LEFT",
      elevationDirection: "UP",
      windage: "6 clicks LEFT",
      elevation: "5 clicks UP"
    },
    angular: {
      windageMOA: 4.5666,
      elevationMOA: 6.9246,
      windageMRAD: 1.3281,
      elevationMRAD: 2.0139
    },
    clicks: {
      windageClicks: 6,
      elevationClicks: 5,
      windageDirection: "LEFT",
      elevationDirection: "UP",
      windageTurnDirection: "COUNTERCLOCKWISE",
      elevationTurnDirection: "CLOCKWISE",
      model: sightModel
    },
    aimPointDiscrepancy: {
      status: "measured",
      judgment: "unavailable",
      reason: "materiality tolerance is not founder-approved",
      aimMinusBullInches: { x: 0, y: 0.0106 },
      magnitudeInches: 0.0106
    },
    geometryValidation,
    mechanicalValidation,
    calculationReconciliation: {
      status: "reconciled",
      method: "m4-mechanical-calculation-reconciliation-v1",
      axes: {
        windage: reconciledAxis("windage", 4.5666, 0.75, 6),
        elevation: reconciledAxis("elevation", 6.9246, 1.5, 5)
      }
    },
    mechanicalSightAuthority,
    renderCoordinates: {
      aim: { xPercent: 50, yPercent: 48.7 },
      bull: { xPercent: 50, yPercent: 48.65 },
      impacts: initialImpacts,
      poib: { xPercent: 57.6333, yPercent: 58.0333 },
      vector: {
        start: { xPercent: 57.6333, yPercent: 58.0333 },
        end: { xPercent: 50, yPercent: 48.7 }
      }
    },
    lineage: {
      sourceShotIds: initialImpacts.map((shot) => shot.shotId),
      aimPointShotId: "founder-aim"
    },
    validation: { status: "pending", confirmed: false },
    status: {
      hasAim: true,
      hasConfirmedAim: true,
      hasRegisteredBull: true,
      impactCount: 3,
      hasPOIB: true,
      hasCorrection: true,
      hasMechanicalRecommendation: true
    },
    evidenceHash:
      "debcf21d24b6f74e8214dd47ae9ea36cffa7a95b58a92e249fccf5da526350be",
    computedAt: "2026-07-30T03:41:49.565Z"
  };

  const confirmationAuthority = {
    authorityVersion: "m4-authority-v1.2",
    authorityRoute: "/api/authority/m4",
    target,
    phase: "confirmation",
    inputs: {
      targetId,
      targetDistanceValue: 25,
      targetDistanceUnit: "M",
      targetZeroValue: 300,
      targetZeroUnit: "M",
      confirmedAimPoint: { xPercent: 50, yPercent: 48.7, shotId: "founder-aim" },
      aimCoordinate: { xPercent: 50, yPercent: 48.7, shotId: "founder-aim" },
      impactCoordinates: confirmationImpacts,
      shooterSetup: setup
    },
    poib: {
      xPercent: 50,
      yPercent: 48.6333
    },
    group: {
      status: "calculated",
      diameterInches: 0.1067,
      valueMOA: 0.37,
      display: "0.11\" · 0.37 MOA",
      method: "m4-authority-max-spread-v1"
    },
    score: initialAuthority.score,
    correction: {
      impactOffsetInches: { x: 0, y: -0.0141 },
      aimMinusPOIBInches: { x: 0, y: 0.0141 },
      windageDirection: "CENTER",
      elevationDirection: "DOWN",
      windage: "0 clicks CENTER",
      elevation: "0 clicks DOWN"
    },
    angular: {
      windageMOA: 0,
      elevationMOA: 0.0493,
      windageMRAD: 0,
      elevationMRAD: 0.0143
    },
    clicks: {
      windageClicks: 0,
      elevationClicks: 0,
      windageDirection: "CENTER",
      elevationDirection: "DOWN",
      windageTurnDirection: null,
      elevationTurnDirection: "COUNTERCLOCKWISE",
      model: sightModel
    },
    aimPointDiscrepancy: initialAuthority.aimPointDiscrepancy,
    geometryValidation: confirmationGeometryValidation,
    mechanicalValidation,
    calculationReconciliation: {
      status: "reconciled",
      method: "m4-mechanical-calculation-reconciliation-v1",
      axes: {
        windage: reconciledAxis("windage", 0, 0.75, 0),
        elevation: reconciledAxis("elevation", 0.0493, 1.5, 0)
      }
    },
    mechanicalSightAuthority,
    renderCoordinates: {
      aim: { xPercent: 50, yPercent: 48.7 },
      bull: { xPercent: 50, yPercent: 48.65 },
      impacts: confirmationImpacts,
      poib: { xPercent: 50, yPercent: 48.6333 },
      vector: {
        start: { xPercent: 50, yPercent: 48.6333 },
        end: { xPercent: 50, yPercent: 48.7 }
      }
    },
    lineage: {
      sourceShotIds: confirmationImpacts.map((shot) => shot.shotId),
      aimPointShotId: "founder-aim",
      priorEvidenceHash: initialAuthority.evidenceHash
    },
    validation: {
      status: "calculated",
      outcome: "CONFIRMED",
      confirmed: true,
      minimumShotsMet: true,
      residualOffsetInches: 0.0141,
      standard: "3+ confirmed shots; POIB within 1.00 inch of confirmed aim point",
      method: "zeroing-confirmation-authority-v1"
    },
    status: {
      hasAim: true,
      hasConfirmedAim: true,
      hasRegisteredBull: true,
      impactCount: 3,
      hasPOIB: true,
      hasCorrection: true,
      hasMechanicalRecommendation: true
    },
    evidenceHash:
      "1a55f8b85ad98b71ee579492ff87c0afba0c565d74c209f4a882ffe01c3dd2d3",
    computedAt: "2026-07-30T03:41:49.565Z"
  };

  window.SCZN3_FOUNDER_REVIEW_SESSION_003 = Object.freeze({
    fixtureKind: "sczn3-founder-review-completed-session-v1",
    fixtureSource: "backend-authority-controlled-test-evidence-projection",
    sessionId: "FOUNDER_REVIEW_M4_003",
    sessionLabel: "Session #003",
    sessionNumber: 3,
    timestamp: "2026-07-30T03:41:49.565Z",
    shooterName: "Founder Review Shooter",
    isTestData: true,
    savedToSEC: true,
    targetId,
    vendor: "Baker",
    sku: targetId,
    product: targetName,
    targetName,
    targetDistanceValue: 25,
    targetDistanceUnit: "M",
    targetZeroValue: 300,
    targetZeroUnit: "M",
    matrixSnapshot: setup,
    correctionContextSnapshot: {
      sightLabel: "Iron Sight",
      distanceValue: 25,
      distanceUnit: "M",
      adjustmentUnit: "MOA"
    },
    targetEvidenceImage: { dataUrl: targetImage },
    confirmationEvidenceImage: { dataUrl: targetImage },
    impactPoints: initialImpacts,
    confirmationImpactPoints: confirmationImpacts,
    m4AuthorityPackage: initialAuthority,
    backendAuthorityPackage: initialAuthority,
    confirmationAuthorityPackage: confirmationAuthority
  });
})();
