import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(path, "utf8");
const [owner, css, bakerHtml, bakerRuntime, idpaHtml, rootHtml, netlifyBuild, siteBuild] = await Promise.all([
  read("smart_target_workspace.js"),
  read("smart_target_workspace.css"),
  read("t/baker/sl-st1/index.html"),
  read("t/baker/sl-st1/target-page.js"),
  read("t/baker/sl-st2/index.html"),
  read("shoot.html"),
  read("production/build-netlify.mjs"),
  read("production/build-site.mjs")
]);

assert.match(owner, /window\.SCZN3SmartTargetWorkspace = Object\.freeze/);
for (const member of [
  "create",
  "decodeImage",
  "visibleViewportBelow",
  "configureContainedStage",
  "resetContainedStage",
  "revealAfterDecode",
  "bindViewportLifecycle"
]) assert.match(owner, new RegExp(`\\b${member}\\b`), `platform workspace exposes ${member}`);

for (const forbidden of [
  /Baker/i,
  /USPSA/i,
  /GSSF/i,
  /M4 25/i,
  /scoreImpact/i,
  /classify/i,
  /calculateScore/i,
  /penalty/i,
  /POIB/i,
  /authorityRequest/i
]) assert.doesNotMatch(owner, forbidden, `platform workspace remains target-neutral and presentation-only: ${forbidden}`);

assert.match(css, /\[data-sczn3-workspace="platform-v1"\]\[hidden\]/);
assert.match(css, /object-fit:contain/);
assert.match(css, /data-sczn3-workspace-layout="contained-rows"/);
assert.match(css, /grid-template-rows:minmax\(0,1fr\) auto/);
assert.match(css, /data-sczn3-workspace-layout="stage-overlay"/);
assert.match(css, /position:absolute/);

for (const html of [bakerHtml, idpaHtml, rootHtml]) {
  assert.match(html, /smart_target_workspace\.js\?v=/);
  assert.match(html, /smart_target_workspace\.css\?v=/);
  assert.match(html, /data-sczn3-workspace="platform-v1"/);
  assert.match(html, /data-sczn3-workspace-layout="(?:contained-rows|stage-overlay)"/);
  assert.match(html, /data-sczn3-workspace-evidence="true"/);
  assert.match(html, /data-sczn3-workspace-actions="true"/);
}
assert.doesNotMatch(idpaHtml, /sl-st1\/target-page\.css/, "IDPA must not inherit its workspace presentation from another target");
assert.doesNotMatch(idpaHtml, /baker-sl-st1-sec\.css/, "IDPA must not inherit SEC presentation from another target");

assert.match(bakerRuntime, /SCZN3SmartTargetWorkspace\.create/);
assert.match(bakerRuntime, /workspace\.decodeImage\(elements\.image\)/);
assert.match(bakerRuntime, /workspace\.revealAfterDecode\(elements\.image\)/);
assert.match(bakerRuntime, /workspace\.bindViewportLifecycle\(\)/);
assert.doesNotMatch(bakerRuntime, /function decodeDisplayedImage/);
assert.doesNotMatch(bakerRuntime, /new ResizeObserver\(queueTargetFit\)/);

assert.match(rootHtml, /SCZN3SmartTargetWorkspace\.create/);
assert.match(rootHtml, /SCZN3SmartTargetWorkspace\.configureContainedStage/);
assert.match(rootHtml, /SCZN3SmartTargetWorkspace\.resetContainedStage/);
assert.match(rootHtml, /smartTargetWorkspace\.decodeImage\(targetImage\)/);
assert.match(rootHtml, /id="targetEvidencePreview" data-sczn3-workspace-evidence="true"/);

for (const missionSpecific of [
  /function backendAuthorityRequest/,
  /function isM4AuthoritySession/,
  /function isGssfAuthoritySession/,
  /function isBaker100YardSession/
]) assert.match(rootHtml, missionSpecific, "mission workflow remains outside the platform workspace owner");
assert.match(bakerRuntime, /const analyzeEndpoint/);
assert.match(bakerRuntime, /state\.impacts/);

for (const build of [netlifyBuild, siteBuild]) {
  assert.match(build, /"smart_target_workspace\.js"/);
  assert.match(build, /"smart_target_workspace\.css"/);
}

console.log("PASS Episode 54 Item 6 Smart Target Workspace ownership contract");
