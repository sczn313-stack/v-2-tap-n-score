import assert from "node:assert/strict";
import { buildAuthorityPackage } from "./authority_adapter.mjs";

const AUTHORITY_ID = "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28";
const bull = { xPercent: 50, yPercent: 48.7 };
const confirmedAim = { xPercent: 52, yPercent: 46, shotId: "aim" };

const basePayload = {
  targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
  targetName: "M4 Carbine • 25 Meter Zeroing Target",
  targetAuthorityGeometry: {
    bullCoordinate: {
      ...bull,
      source: "M4-BULL-COORDINATE-AUTHORITY-2026-07-28"
    }
  },
  distance: { value: 25, unit: "m" },
  zeroingMission: {
    id: "M4_25M_300M_ZERO",
    label: "25m / 300m M4 zero",
    confirmationMinimumShots: 3,
    confirmationResidualToleranceInches: 1
  },
  aimCoordinate: confirmedAim,
  impactCoordinates: [
    { xPercent: 57, yPercent: 57, shotId: "shot-1" },
    { xPercent: 58, yPercent: 58, shotId: "shot-2" },
    { xPercent: 59, yPercent: 59, shotId: "shot-3" }
  ]
};

const proven = await buildAuthorityPackage({
  ...basePayload,
  equipmentAuthorityRecordId: AUTHORITY_ID,
  shooterSetup: {
    opticType: "Iron Sights",
    adjustmentSystem: "M4_IRON_DCH_FSP",
    equipmentAuthorityRecordId: AUTHORITY_ID
  }
});

assert.equal(Number(proven.poib.xPercent), 58);
assert.equal(Number(proven.poib.yPercent), 58);
assert.equal(proven.correction.windageDirection, "LEFT");
assert.equal(proven.correction.elevationDirection, "UP");
assert.equal(proven.status.hasMechanicalRecommendation, true);
assert.ok(proven.clicks.windageClicks > 0);
assert.ok(proven.clicks.elevationClicks > 0);
assert.equal(proven.clicks.windageTurnDirection, "COUNTERCLOCKWISE");
assert.equal(proven.clicks.elevationTurnDirection, "CLOCKWISE");
assert.equal(Number(proven.clicks.model.windagePerClick), 0.75);
assert.equal(Number(proven.clicks.model.elevationPerClick), 1.5);
assert.equal(proven.mechanicalSightAuthority.recordId, AUTHORITY_ID);
assert.equal(
  Number(proven.vectors.poibToConfirmedAim.start.xPercent),
  Number(proven.poib.xPercent)
);
assert.equal(
  Number(proven.vectors.poibToConfirmedAim.start.yPercent),
  Number(proven.poib.yPercent)
);
assert.equal(Number(proven.vectors.poibToConfirmedAim.end.xPercent), confirmedAim.xPercent);
assert.equal(Number(proven.vectors.poibToConfirmedAim.end.yPercent), confirmedAim.yPercent);
assert.equal(Number(proven.renderCoordinates.bull.xPercent), bull.xPercent);
assert.equal(Number(proven.renderCoordinates.bull.yPercent), bull.yPercent);
assert.equal(proven.geometryValidation.vectorEnd, "CONFIRMED_AIM_POINT");
assert.deepEqual(proven.lineage.correctionDerivedFrom, ["confirmed-aim-point", "poib"]);
assert.equal(proven.calculationReconciliation.status, "reconciled");
assert.equal(proven.calculationReconciliation.axes.windage.status, "reconciled");
assert.equal(proven.calculationReconciliation.axes.elevation.status, "reconciled");

const reconciliationCase = await buildAuthorityPackage({
  ...basePayload,
  aimCoordinate: { xPercent: 50, yPercent: 48.7, shotId: "reconcile-aim" },
  impactCoordinates: [
    { xPercent: 94.0, yPercent: 48.7, shotId: "reconcile-1" },
    { xPercent: 94.4, yPercent: 48.7, shotId: "reconcile-2" },
    { xPercent: 94.2, yPercent: 48.7, shotId: "reconcile-3" }
  ],
  equipmentAuthorityRecordId: AUTHORITY_ID,
  shooterSetup: {
    opticType: "Iron Sights",
    adjustmentSystem: "M4_IRON_DCH_FSP",
    equipmentAuthorityRecordId: AUTHORITY_ID
  }
});

const windageTrace = reconciliationCase.calculationReconciliation.axes.windage;
assert.equal(Number(reconciliationCase.angular.windageMOA), 26.4406);
assert.equal(Number(windageTrace.displayedAngularValue), 26.44);
assert.equal(Number(windageTrace.clickConstant), 0.75);
assert.equal(Number(windageTrace.rawClicks), 35.2541);
assert.equal(windageTrace.expectedClicks, 35);
assert.equal(windageTrace.displayedExpectedClicks, 35);
assert.equal(windageTrace.displayedClicks, 35);
assert.equal(reconciliationCase.clicks.windageClicks, 35);
assert.equal(reconciliationCase.correction.windage, "35 clicks LEFT");

const injected = await buildAuthorityPackage({
  ...basePayload,
  mechanicalAuthority: "proven",
  windageClickMOA: 0.01,
  elevationClickMOA: 0.01,
  shooterSetup: {
    opticType: "Iron Sights",
    adjustmentSystem: "M4_IRON",
    mechanicalAuthority: "proven",
    windageClickMOA: 0.01,
    elevationClickMOA: 0.01
  }
});

assert.equal(injected.status.hasMechanicalRecommendation, false);
assert.equal(injected.clicks, null);
assert.equal(injected.mechanicalSightAuthority.status, "unavailable");

console.log("PASS M4 Testability Gate: exact sight authority, POIB, direction, clicks, and confirmed Aim Point endpoint");
