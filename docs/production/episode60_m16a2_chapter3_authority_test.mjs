import assert from "node:assert/strict";
import { buildAuthorityPackage } from "./authority_adapter.mjs";

const adjustmentProfileId = "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011";
const equipmentConfigurationId = "M16A2-STANDARD-IRON-FSP-REAR-DRUM";
const aimCoordinate = { xPercent: 50, yPercent: 43.181818 };
const shooterSetup = {
  opticType: "Iron Sights",
  adjustmentSystem: "M16A2_IRON_FSP_REAR_DRUM",
  equipmentConfigurationId,
  adjustmentProfileId
};

const initial = await buildAuthorityPackage({
  targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
  targetName: "Baker 25 Meters Zeroing Target M16A2",
  aimCoordinate,
  impactCoordinates: [
    { xPercent: 59.6, yPercent: 55, shotId: "initial-1" },
    { xPercent: 60, yPercent: 55.4, shotId: "initial-2" },
    { xPercent: 60.4, yPercent: 55.8, shotId: "initial-3" }
  ],
  distance: { value: 25, unit: "m" },
  adjustmentProfileId,
  shooterSetup
});

assert.equal(initial.status.hasCorrection, true);
assert.equal(initial.mechanicalSightAuthority.adjustmentProfileId, adjustmentProfileId);
assert.equal(initial.mechanicalSightAuthority.equipmentConfigurationId, equipmentConfigurationId);
assert.equal(Number(initial.clicks.model.windagePerClick), 0.5);
assert.equal(Number(initial.clicks.model.elevationPerClick), 1.25);
assert.equal(initial.clicks.model.turnDirections.windage.RIGHT, "CLOCKWISE");
assert.equal(initial.clicks.model.turnDirections.elevation.DOWN, "COUNTERCLOCKWISE");
assert.equal(initial.mechanicalValidation.status, "calculated");
assert.equal(initial.calculationReconciliation.status, "reconciled");

const confirmation = await buildAuthorityPackage({
  targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
  targetName: "Baker 25 Meters Zeroing Target M16A2",
  aimCoordinate,
  impactCoordinates: [
    { xPercent: 49.9, yPercent: 43.1, shotId: "confirmation-1" },
    { xPercent: 50.1, yPercent: 43.2, shotId: "confirmation-2" },
    { xPercent: 50, yPercent: 43.3, shotId: "confirmation-3" }
  ],
  distance: { value: 25, unit: "m" },
  phase: "confirmation",
  adjustmentProfileId,
  shooterSetup
});

assert.equal(confirmation.validation.confirmed, true);
assert.equal(confirmation.mechanicalSightAuthority.adjustmentProfileId, adjustmentProfileId);
assert.equal(Number(confirmation.clicks.model.windagePerClick), 0.5);
assert.equal(Number(confirmation.clicks.model.elevationPerClick), 1.25);

console.log("PASS Episode 60 Chapter 3 M16A2 governed authority and confirmation");
