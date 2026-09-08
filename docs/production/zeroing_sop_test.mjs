import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const platformSource = await readFile("zeroing_platform.js", "utf8");
const context = { window: {} };
vm.runInNewContext(platformSource, context, { filename: "zeroing_platform.js" });
vm.runInNewContext(await readFile("zeroing_target_profiles.js", "utf8"), context, { filename: "zeroing_target_profiles.js" });
const platform = context.window.SCZN3ZeroingPlatform;

assert.deepEqual(Array.from(platform.SOP), [
  "photo-entry", "precision-tap", "tap-aim-point", "tap-initial-group", "undo-clear",
  "show-results", "present-authoritative-correction", "apply-correction",
  "fire-confirmation-group", "confirmation-photo-entry", "tap-confirmation-group",
  "show-confirmation-results", "generate-zeroing-sec", "preserve-sec",
  "add-to-ballistic-vault", "failure-recovery"
]);

const m16a2 = platform.resolveTargetProfile({ targetProfileId: "baker_m16a2_25m_zero" });
const speedwellM16a2 = platform.resolveTargetProfile({ targetProfileId: "speedwell_dodm4_m16a2_25m_zero" });
const armyM16a2 = platform.resolveTargetProfile({ targetProfileId: "army_nsn_6920_01_395_2949_m16a2_25m_zero" });
const qualificationM16a2 = platform.resolveTargetProfile({ targetProfileId: "qualification_m16a2_25m_zero" });
const gunfunGreenM16a2 = platform.resolveTargetProfile({ targetProfileId: "gunfun_32120_m16a2_green_25m_zero" });
const m4 = platform.resolveTargetProfile({ targetProfileId: "m4_25m_zero" });
assert.equal(m16a2.capabilityId, platform.CAPABILITY_ID);
assert.equal(speedwellM16a2.capabilityId, platform.CAPABILITY_ID);
assert.equal(armyM16a2.capabilityId, platform.CAPABILITY_ID);
assert.equal(qualificationM16a2.capabilityId, platform.CAPABILITY_ID);
assert.equal(gunfunGreenM16a2.capabilityId, platform.CAPABILITY_ID);
assert.equal(m4.capabilityId, platform.CAPABILITY_ID);
assert.equal(m16a2.entryMode, "photo");
assert.equal(m4.entryMode, "registered-reference");
assert.equal(m16a2.authorityFamily, "mfam");
assert.equal(speedwellM16a2.authorityFamily, "mfam");
assert.equal(armyM16a2.authorityFamily, "mfam");
assert.equal(qualificationM16a2.authorityFamily, "mfam");
assert.equal(gunfunGreenM16a2.authorityFamily, "mfam");
assert.equal(m4.authorityFamily, "mfam");
assert.deepEqual(speedwellM16a2.presentation, m16a2.presentation, "family consumers share one presentation contract");
assert.deepEqual(armyM16a2.presentation, m16a2.presentation, "family consumers share one presentation contract");
assert.deepEqual(qualificationM16a2.presentation, m16a2.presentation, "family consumers share one presentation contract");
assert.deepEqual(gunfunGreenM16a2.presentation, m16a2.presentation, "family consumers share one presentation contract");
assert.notEqual(speedwellM16a2.exactAsset.sha256, m16a2.exactAsset.sha256, "publisher identity retains exact representation");
assert.notEqual(armyM16a2.exactAsset.sha256, m16a2.exactAsset.sha256, "issuer identity retains exact representation");
assert.equal(platform.usesGovernedConfirmation({ targetProfileId: m16a2.targetProfileId }), true);
assert.equal(platform.usesGovernedConfirmation({ targetProfileId: m4.targetProfileId }), true);
assert.equal(platform.validateTargetProfile({
  ...m16a2,
  workflow: ["target-owned-copy-of-shared-road"]
}).ok, false, "a Target Profile cannot take ownership of the shared road");

const futureM4M16 = platform.registerTargetProfile({
  capabilityId: platform.CAPABILITY_ID,
  targetProfileId: "future_m4_m16_25m_zero",
  targetProfileVersion: "PROOF_REQUIRED_BEFORE_RUNTIME_ADMISSION",
  authorityFamily: "mfam",
  entryMode: "photo",
  confirmationMode: "governed",
  presentation: { targetZero: "300 m" }
});
assert.equal(futureM4M16.capabilityId, m16a2.capabilityId);
assert.equal(platform.resolveTargetProfile({ targetProfileId: futureM4M16.targetProfileId }), futureM4M16);
assert.equal(Object.hasOwn(futureM4M16, "workflow"), false, "registering another target cannot fork the road");

const m16Request = platform.authorityRequest({
  session: {
    target_profile_id: m16a2.targetProfileId,
    backendSessionAuthority: {
      target: { targetId: m16a2.targetProfileId, targetAuthorityId: "BAKER_M16A2_25M_AUTHORITY_v1", targetName: "Baker M16A2 25 Meter Zeroing Target" },
      governedDistance: { value: 25, unit: "M", locked: true },
      missionIdentity: { missionId: "BAKER_M16A2_25M_300M_ZERO" }
    },
    matrixSnapshot: {
      adjustmentSystem: "M16A2_IRON_FSP_REAR_DRUM",
      adjustmentProfileId: "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011",
      equipmentConfigurationId: "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
      opticType: "Iron Sights",
      opticAdjustmentUnit: "MOA"
    }
  },
  aimPoint: { xPercent: 50, yPercent: 48.7 },
  impactPoints: [{ xPercent: 58, yPercent: 41 }]
});
assert.equal(m16Request.targetProfileId, m16a2.targetProfileId);
assert.equal(m16Request.shooterSetup.adjustmentSystem, "M16A2_IRON_FSP_REAR_DRUM");
assert.equal(m16Request.adjustmentProfileId, "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011");
assert.equal(Object.hasOwn(m16Request, "targetAuthorityGeometry"), false, "the browser cannot rebuild governed geometry");

const mission = platform.registerMission({
  id: "TEST_ZEROING",
  targetAuthority: { id: "target-authority" },
  correctionAuthority: { route: "/api/authority/test", owner: "backend" },
  sessionContext: { fields: ["sightSystem", "distance", "adjustmentUnit"] },
  confirmationRules: { minimumShots: 3 },
  artwork: { workspace: "target.svg" }
});
assert.equal(platform.resolveMission({ zeroingMissionId: "TEST_ZEROING" }), mission);
assert.equal(platform.isCompletedSession({
  savedToSEC: true,
  workflowStage: "preservation",
  confirmationAuthorityPackage: { evidenceHash: "immutable" },
  confirmationImpactPoints: [{ xPercent: 50, yPercent: 50 }]
}), true);
assert.equal(platform.isCompletedSession({
  savedToSEC: false,
  workflowStage: "validation",
  confirmationAuthorityPackage: null,
  confirmationImpactPoints: []
}), false);

const shoot = await readFile("shoot.html", "utf8");
const sec = await readFile("sec.html", "utf8");
const vault = await readFile("records.html", "utf8");
assert.match(shoot, /zeroingLivePhase === "confirmation"/);
assert.match(shoot, /isZeroingAuthoritySession\(\)[\s\S]*?zeroingLivePhase === "confirmation"/);
assert.match(shoot, /phase: zeroingLivePhase === "confirmation" \? "confirmation" : "initial"/);
assert.match(shoot, /confirmationStatus = usesGovernedZeroingRoad\(\)[\s\S]*?: "Recorded"/);
assert.match(shoot, /if \(usesGovernedZeroingRoad\(\) && authorityPackage\.mechanicalValidation\?\.status !== "calculated"\) return null;/);
assert.match(shoot, /function renderCorrectionOverlay\(correction\)[\s\S]*?!isZeroingAuthoritySession\(\)[\s\S]*?!currentClicks/);
assert.match(shoot, /REQUESTED_SESSION_ID[\s\S]*?SCZN3M4\.loadSession\(REQUESTED_SESSION_ID\)/);
assert.match(shoot, /SESSION_ROUTE_MISS/);
assert.doesNotMatch(shoot, /!REQUESTED_TARGET_PROFILE_ID && SCZN3M4\.getActiveMatrix\(\)[\s\S]*?SCZN3M4\.createSession/);
assert.match(shoot, /if \(!SIMULATION_MODE\)[\s\S]*?window\.location\.replace\(`matrix\.html/);
assert.match(shoot, /undoImpact[\s\S]*?holeEntrySettled = false;[\s\S]*?correctionContextReviewDismissed = true;[\s\S]*?scheduleHoleEntryReadiness\(\)/);
assert.match(shoot, /confirmationAuthorityPackage/);
assert.match(shoot, /remainingCorrectionShooterMessage\(backendAuthorityPackage\)/);
assert.match(shoot, /Apply the remaining correction:[\s\S]*?Then shoot another confirmation group, photograph that target, and tap only those new holes\./);
assert.match(shoot, /Tap Your Confirmation Shots/);
assert.match(sec, /authorityPackage && authorityPackage\.clicks/);
assert.match(sec, /confirmationAuthorityPackage/);
assert.doesNotMatch(sec, /sec-comparison-arrow/);
assert.match(vault, /evidenceHash|authorityPackage/);

console.log("PASS canonical Zeroing Platform SOP");
