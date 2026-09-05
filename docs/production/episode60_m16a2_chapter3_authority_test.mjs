import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { buildAuthorityPackage } from "./authority_adapter.mjs";

const fixtureSource = await readFile(new URL("../m16a2_talking_demo_session.js", import.meta.url), "utf8");
const sandbox = { URLSearchParams, window: { location: { search: "?m16a2_demo=1" } } };
vm.runInNewContext(fixtureSource, sandbox);
const fixture = sandbox.window.SCZN3_BAKER_TALKING_DEMO_FIXTURE;

const adjustmentProfileId = "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011";
const equipmentConfigurationId = "M16A2-STANDARD-IRON-FSP-REAR-DRUM";
const aimCoordinate = fixture.aim;
const shooterSetup = {
  opticType: "Iron Sights",
  adjustmentSystem: "M16A2_IRON_FSP_REAR_DRUM",
  equipmentConfigurationId,
  adjustmentProfileId
};

const initial = await buildAuthorityPackage({
  target_profile_id: fixture.target.profileId,
  targetProfileId: fixture.target.profileId,
  targetId: fixture.target.targetId,
  targetName: "Baker 25 Meters Zeroing Target M16A2",
  aimCoordinate,
  impactCoordinates: fixture.initialImpacts,
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
assert.equal(initial.clicks.windageClicks, fixture.initialAuthorityPackage.clicks.windageClicks);
assert.equal(initial.clicks.elevationClicks, fixture.initialAuthorityPackage.clicks.elevationClicks);
assert.equal(initial.clicks.windageDirection, fixture.initialAuthorityPackage.clicks.windageDirection);
assert.equal(initial.clicks.elevationDirection, fixture.initialAuthorityPackage.clicks.elevationDirection);
assert.equal(initial.clicks.windageTurnDirection, fixture.initialAuthorityPackage.clicks.windageTurnDirection);
assert.equal(initial.clicks.elevationTurnDirection, fixture.initialAuthorityPackage.clicks.elevationTurnDirection);
assert.equal(Number(initial.poib.xPercent), fixture.initialAuthorityPackage.poib.xPercent);
assert.equal(Number(initial.poib.yPercent), fixture.initialAuthorityPackage.poib.yPercent);

const confirmation = await buildAuthorityPackage({
  target_profile_id: fixture.target.profileId,
  targetProfileId: fixture.target.profileId,
  targetId: fixture.target.targetId,
  targetName: "Baker 25 Meters Zeroing Target M16A2",
  aimCoordinate,
  impactCoordinates: fixture.confirmationImpacts,
  distance: { value: 25, unit: "m" },
  phase: "confirmation",
  adjustmentProfileId,
  shooterSetup
});

assert.equal(confirmation.validation.confirmed, true);
assert.ok(Math.max(...fixture.confirmationImpacts.map(point => point.xPercent)) - Math.min(...fixture.confirmationImpacts.map(point => point.xPercent)) >= 10, "confirmation shots are visibly distinct rather than stacked");
assert.deepEqual(
  { xPercent: Number(confirmation.poib.xPercent), yPercent: Number(confirmation.poib.yPercent) },
  { xPercent: fixture.aim.xPercent, yPercent: fixture.aim.yPercent },
  "the dispersed confirmation evidence remains centered on the governed aim point"
);
assert.equal(initial.targetProfileId, "baker_m16a2_25m_zero");
assert.equal(initial.target.targetId, "BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1");
assert.equal(initial.authorityVersion, "sczn3-baker-m16a2-authority-v1");
assert.equal(confirmation.mechanicalSightAuthority.adjustmentProfileId, adjustmentProfileId);
assert.equal(Number(confirmation.clicks.model.windagePerClick), 0.5);
assert.equal(Number(confirmation.clicks.model.elevationPerClick), 1.25);
assert.equal(confirmation.clicks.windageClicks, fixture.confirmationAuthorityPackage.clicks.windageClicks);
assert.equal(confirmation.clicks.elevationClicks, fixture.confirmationAuthorityPackage.clicks.elevationClicks);
assert.equal(fixture.fixtureAuthority.owner, "SCZN3 Backend Authority");
assert.equal(fixture.fixtureAuthority.method, "docs/production/authority_adapter.mjs::buildAuthorityPackage");
assert.equal(fixture.target.imageSha256, "250f77079bd13198a8d3c301e204f58c8e96752631f9aec479c29f8f2f5c7993");

console.log("PASS Episode 60 Chapter 3 M16A2 governed authority and confirmation");
