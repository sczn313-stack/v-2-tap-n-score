import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = [
  "index.html", "matrix.html", "shoot.html", "sec.html", "records.html",
  "app_state.js", "m4_runtime.js", "sec_framework.js", "navigation.js",
  "zeroing_platform.js", "ballistic-vault.css"
];
const source = Object.fromEntries(await Promise.all(
  files.map(async file => [file, await readFile(file, "utf8")])
));

assert.match(source["index.html"], /class="package-landing-shell"/);
assert.match(source["matrix.html"], /m4_25m_zero/);
assert.match(source["shoot.html"], /class="workspace-stage-shell"/);
assert.match(source["shoot.html"], /Confirm Session Setup/);
assert.match(source["shoot.html"], /M4-IRON-DCH-FSP-AUTHORITY-2026-07-28/);
assert.match(source["shoot.html"], /SCZN3M4\.loadSession\(REQUESTED_SESSION_ID\)/);
assert.match(source["shoot.html"], /m4LivePhase = "confirmation"/);
assert.match(source["shoot.html"], /confirmationImpactPoints/);
assert.match(source["shoot.html"], /savePatch\.workflowStage = "preservation"/);
assert.match(source["shoot.html"], /sec\.html\?v=stay-on-screen-002/);
assert.doesNotMatch(source["shoot.html"], /window\.location\.href = "sec\.html";[\s\S]{0,500}initial-authority-saved-confirmation-pending/);

assert.match(source["sec.html"], /class="sec-before-after"/);
assert.match(source["sec.html"], /Initial Group/);
assert.match(source["sec.html"], /Confirmation Group/);
assert.match(source["sec.html"], /isCompletedZeroingSession/);
assert.doesNotMatch(source["sec.html"], /Choose Confirmation Target/);
assert.doesNotMatch(source["sec.html"], /id="validateConfirmation"/);
assert.match(source["sec_framework.js"], /id="openValidation"/);

assert.match(source["records.html"], /BALLISTIC VAULT/);
assert.match(source["records.html"], /vault-sec-thumbnail/);
assert.match(source["records.html"], /OPEN PRESERVED SEC/);
assert.match(source["records.html"], /sessionId/);
assert.match(source["ballistic-vault.css"], /\.vault-sec-thumbnail iframe/);

assert.match(source["navigation.js"], /protectActiveWorkspace/);
assert.match(source["navigation.js"], /Leave Current Session\?/);
assert.match(source["navigation.js"], /Stay Here/);
assert.match(source["navigation.js"], /Leave Session/);
assert.match(source["navigation.js"], /SCZN3WorkspaceNavigationState/);
assert.match(source["zeroing_platform.js"], /registerMission/);
assert.match(source["zeroing_platform.js"], /targetAuthority/);
assert.match(source["zeroing_platform.js"], /correctionAuthority/);
assert.match(source["m4_runtime.js"], /\/api\/authority\/m4/);

const buildSource = await readFile("production/build-site.mjs", "utf8");
for (const asset of [
  "shoot.html", "sec.html", "records.html", "zeroing_platform.js",
  "ballistic-vault.css", "workspace_correction_context.css", "m4-sec.css"
]) assert.match(buildSource, new RegExp(`"${asset.replace(".", "\\.")}"`));

console.log("PASS canonical Zeroing Workspace integration contract");
