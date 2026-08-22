import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(path, "utf8");
const [owner, css, framework, bakerHtml, bakerRuntime, rootHtml, m4Html, records, netlifyBuild, siteBuild] = await Promise.all([
  read("platform_actions.js"),
  read("platform_actions.css"),
  read("sec_framework.js"),
  read("t/baker/sl-st1/index.html"),
  read("t/baker/sl-st1/target-page.js"),
  read("shoot.html"),
  read("sec.html"),
  read("records.html"),
  read("production/build-netlify.mjs"),
  read("production/build-site.mjs")
]);

assert.match(owner, /window\.SCZN3Actions = Object\.freeze/);
for (const member of ["markRegion", "syncAvailability", "begin", "finish", "run", "share", "print", "toggleNote", "outcomeLabel", "bind"]) {
  assert.match(owner, new RegExp(`\\b${member}\\b`), `SCZN3Actions exposes ${member}`);
}
assert.match(owner, /window\.SCZN3Processing\?\.begin/);
assert.match(owner, /activeTriggers = new WeakSet/);
assert.match(owner, /activeTriggers\.has\((?:trigger|triggerElement)\)/);
assert.match(owner, /data-sczn3-action-region/);
for (const forbidden of [
  /calculateScore/i,
  /classifyImpact/i,
  /calculateCorrection/i,
  /POIB/i,
  /penalty\s*=/i,
  /qualificationDecision/i,
  /Baker SL-ST1/i,
  /GSSF Practice/i,
  /M4 25m/i
]) assert.doesNotMatch(owner, forbidden, `shared actions remain presentation-only and target-neutral: ${forbidden}`);

assert.match(css, /\[data-sczn3-action-region="platform-v1"\]/);
assert.match(css, /\.sec-preservation-actions/);
assert.match(css, /@media\s*\(max-width:560px\)/);
assert.match(css, /overflow-x:auto/);
assert.match(css, /@media\s*\(prefers-reduced-motion:reduce\)/);

assert.match(framework, /data-sczn3-action-region="platform-v1"/);
assert.match(framework, /data-sczn3-action=/);
assert.match(framework, /const ACTION_NAMES = Object\.freeze/);
assert.match(framework, /ACTION_NAMES\.includes/);

for (const html of [bakerHtml, rootHtml, m4Html, records]) {
  assert.match(html, /platform_actions\.js\?v=episode54-item7-1/);
  assert.match(html, /platform_actions\.css\?v=episode54-item7-1/);
}
for (const build of [netlifyBuild, siteBuild]) {
  assert.match(build, /"platform_actions\.js"/);
  assert.match(build, /"platform_actions\.css"/);
}

assert.match(bakerHtml, /data-sczn3-action-region="platform-v1"/);
assert.match(rootHtml, /data-sczn3-action-region="platform-v1"/);
assert.match(bakerRuntime, /SCZN3Actions\.begin/);
assert.match(bakerRuntime, /SCZN3Actions\.finish/);
assert.match(bakerRuntime, /SCZN3Actions\.bind\(root/);
assert.doesNotMatch(bakerRuntime, /elements\.saveSec\.addEventListener/);
assert.doesNotMatch(bakerRuntime, /elements\.share\.addEventListener/);
assert.doesNotMatch(bakerRuntime, /elements\.exportPdf\.addEventListener/);

assert.match(rootHtml, /SCZN3Actions\.begin/);
assert.match(rootHtml, /SCZN3Actions\.finish/);
assert.match(m4Html, /SCZN3Actions\.bind\(card/);
assert.match(records, /SCZN3Actions\.bind\(historyList/);
assert.match(records, /SCZN3Actions\.syncAvailability\(historyList/);
assert.match(records, /data-sczn3-action-region="platform-v1"/);

for (const action of ["save", "share", "export", "note", "history"]) {
  assert.match(`${framework}\n${bakerRuntime}\n${m4Html}\n${records}`, new RegExp(`action:\\s*["']${action}["']|data-sczn3-action=["']${action}["']`));
}

assert.match(bakerRuntime, /analyzeEndpoint/);
assert.match(rootHtml, /function backendAuthorityRequest/);
assert.match(records, /function buildGssfSecExportPages/);
assert.doesNotMatch(owner, /analyzeEndpoint|backendAuthorityRequest|buildGssfSecExportPages/);

console.log("PASS Episode 54 Item 7 shared responsive/action ownership contract");
