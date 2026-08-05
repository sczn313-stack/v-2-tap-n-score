import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = [
  "index.html", "matrix.html", "shoot.html", "sec.html", "records.html",
  "app_state.js", "m4_runtime.js", "sec_framework.js", "navigation.js",
  "zeroing_platform.js", "ballistic-vault.css", "styles.css", "backend/server.py"
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
assert.match(source["shoot.html"], /const FOUNDER_WORKSPACE_TEST_MODE = IS_LOCAL_FRONTEND && TARGET_QUERY\.get\("founder_review"\) === "1";/);
assert.doesNotMatch(source["shoot.html"], /window\.location\.href = "sec\.html";[\s\S]{0,500}initial-authority-saved-confirmation-pending/);
assert.match(
  source["styles.css"],
  /\.target-page\[data-target-mission="zeroing"\]\[data-has-results="false"\]\[data-authority-status="false"\] \.evidence-meta\{[\s\S]*?display:none;/,
  "zeroing result panels must only be hidden before a result or visible failure exists",
);
assert.match(
  source["styles.css"],
  /\.target-page\[data-has-results="true"\] \.evidence-meta,[\s\S]*?\.target-page\[data-authority-status="true"\] \.evidence-meta\{[\s\S]*?display:block;/,
  "all target families must show the shared result or failure surface",
);

assert.match(source["sec.html"], /class="sec-before-after"/);
assert.match(source["sec.html"], /<figcaption><strong>Before<\/strong><\/figcaption>/);
assert.match(source["sec.html"], /<figcaption><strong>After<\/strong><\/figcaption>/);
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
assert.match(source["m4_runtime.js"], /http:\/\/127\.0\.0\.1:8098\/api\/authority\/m4/);
assert.match(source["m4_runtime.js"], /: "\/api\/authority\/m4";/, "production M4 authority must remain same-origin");
assert.match(source["backend/server.py"], /M4_AUTHORITY_PATHS = \{"\/api\/authority\/m4", "\/api\/authority\/m4\/"\}/, "the local authority service must register M4 beside the generic route");
assert.match(source["backend/server.py"], /AUTHORITY_PATHS = \{"\/api\/authority\/ugeo", "\/api\/authority\/ugeo\/"\}/, "the local authority service must preserve 100 Yard and GSSF routing");

const buildSource = await readFile("production/build-site.mjs", "utf8");
for (const asset of [
  "shoot.html", "sec.html", "records.html", "zeroing_platform.js",
  "ballistic-vault.css", "workspace_correction_context.css", "m4-sec.css"
]) assert.match(buildSource, new RegExp(`"${asset.replace(".", "\\.")}"`));

console.log("PASS canonical Zeroing Workspace integration contract");
