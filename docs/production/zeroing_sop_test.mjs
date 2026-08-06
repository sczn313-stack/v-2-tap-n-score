import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const platformSource = await readFile("zeroing_platform.js", "utf8");
const context = { window: {} };
vm.runInNewContext(platformSource, context, { filename: "zeroing_platform.js" });
const platform = context.window.SCZN3ZeroingPlatform;

assert.deepEqual(Array.from(platform.SOP), [
  "select-target", "stay-on-screen", "tap-aim-point", "tap-initial-group",
  "confirm-session-setup", "calculate-authoritative-correction", "apply-correction",
  "fire-confirmation-group", "tap-confirmation-group", "generate-zeroing-sec",
  "preserve-sec", "add-to-ballistic-vault"
]);

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
assert.match(shoot, /m4LivePhase === "confirmation"/);
assert.match(shoot, /REQUESTED_SESSION_ID[\s\S]*?SCZN3M4\.loadSession\(REQUESTED_SESSION_ID\)/);
assert.match(shoot, /SESSION_ROUTE_MISS/);
assert.doesNotMatch(shoot, /!REQUESTED_TARGET_PROFILE_ID && SCZN3M4\.getActiveMatrix\(\)[\s\S]*?SCZN3M4\.createSession/);
assert.match(shoot, /if \(!SIMULATION_MODE\)[\s\S]*?window\.location\.replace\(`matrix\.html/);
assert.match(shoot, /undoImpact[\s\S]*?holeEntrySettled = false;[\s\S]*?correctionContextReviewDismissed = true;[\s\S]*?scheduleHoleEntryReadiness\(\)/);
assert.match(shoot, /confirmationAuthorityPackage/);
assert.match(shoot, /remainingCorrectionShooterMessage\(backendAuthorityPackage\)/);
assert.match(shoot, /Apply the remaining correction:[\s\S]*?Then fire and tap another confirmation group\./);
assert.match(shoot, /Tap Your Confirmation Impacts/);
assert.match(sec, /authorityPackage && authorityPackage\.clicks/);
assert.match(sec, /confirmationAuthorityPackage/);
assert.doesNotMatch(sec, /sec-comparison-arrow/);
assert.match(vault, /evidenceHash|authorityPackage/);

console.log("PASS canonical Zeroing Platform SOP");
