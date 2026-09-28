import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const docs = path.join(repo, "docs");
const baseline = "a9ba035659e873f5704a35ee7a10541b270fec3a";
const contractRoot = "docs/backend/target_execution_contracts/contracts";
const read = relative => readFile(path.join(docs, relative), "utf8");
const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

const baselineContracts = git("ls-tree", "-r", "--name-only", baseline, contractRoot).trim().split("\n").filter(Boolean);
assert.equal(baselineContracts.length, 251, "known-good pre-QT floor contains 251 execution contracts");
for (const relative of baselineContracts) {
  const current = await readFile(path.join(repo, relative));
  const knownGood = execFileSync("git", ["show", `${baseline}:${relative}`], { cwd: repo, maxBuffer: 32 * 1024 * 1024 });
  assert.deepEqual(current, knownGood, `pre-QT contract changed: ${relative}`);
}

const matureAdapters = [
  "docs/sec_v1.js",
  "docs/sec_reopen_lifecycle.js",
  "docs/baker_sl_st1_sec.js",
  "docs/baker_sl_st2_idpa_sec.js",
  "docs/baker_fun_sec.js",
  "docs/gunfun_vital_dude_sec.js",
  "docs/m4_zeroing_sec.js",
  "docs/m4_runtime.js",
];
for (const relative of matureAdapters) {
  const current = await readFile(path.join(repo, relative));
  const knownGood = execFileSync("git", ["show", `${baseline}:${relative}`], { cwd: repo });
  assert.deepEqual(current, knownGood, `mature adapter changed: ${relative}`);
}

const cohort = JSON.parse(await read("authority-evidence/platform/scale-batch-1-2026-09-08/SCALE_BATCH_1_COHORT.json"));
const targets = cohort.targets.filter(target => target.runtimeType === "targetScoring");
assert.equal(targets.length, 18);
for (const target of targets) {
  const contract = JSON.parse(await read(`backend/target_execution_contracts/contracts/${target.targetProfileId}_target_scoring_v1.json`));
  assert.equal(contract.targetProfile.id, target.targetProfileId);
  assert.equal(contract.missionFamily, "targetScoring");
  assert.equal(contract.executor.id, "declarative-target-score");
  assert.equal(contract.secAdapter.id, "target-scoring-family");
  assert.equal(contract.components.registration.status, "approved");
  assert.equal(contract.components.geometry.status, "approved");
  assert.equal(contract.components.scoring.status, "approved");
}

const framework = await read("sec_framework.js");
const runtime = await read("target_execution_runtime.js");
const vault = await read("records.html");
const targetCss = await read("target-experience.css");
const episode64ReviewAuthority = await read("production/qt_episode64_founder_review_server.py");
assert.match(framework, /function Result\(model = \{\}\)/);
assert.match(runtime, /SCZN3SECComponents\.Result\(\{ family: approvedResultFamily\(result\), contentHtml \}\)/);
assert.match(runtime, /contract-lifecycle-pair/);
assert.match(runtime, /result\.missionFamily === "targetScoring" \|\| isQtPrinter13Result\(result\) \? "" : shotPatternMarkup\(result, session\)/, "generic targetScoring Result excludes unauthorized shot-pattern presentation");
assert.match(runtime, /const reopenBaseHref = `target-experience\.html\?session=[\s\S]*?portableUrl\(reopenBaseHref, session\.sessionId\)/, "targetScoring Exact Reopen uses the functional checkpoint target-experience road with portable custody");
assert.match(runtime, /sourceImagePoint\(event\.clientX, event\.clientY, renderedImageContentBox\(byId\("contractTargetImage"\)\)/);
assert.match(runtime, /data-ugo-projection-plane="normalized-source-image"/);
assert.match(runtime, /syncProjectionLayerToImage\(byId\("contractMarkers"\), image, frame\)/);
assert.match(vault, /SCZN3TargetExecutionRuntime\.approvedResultComponent\(pkg, session\)/);
assert.match(vault, /<div class="vault-evidence-pair">/);
assert.match(vault, /<span class="vault-open-label">OPEN SEC →<\/span>/);
assert.match(vault, /vault-approved-result-panel/);
assert.doesNotMatch(vault, /renderCompactVaultRecord\(requestedSession, \{ historical: true \}\)/);
assert.match(vault, /renderedImageContentBox\(image\)/);
assert.match(targetCss, /contract-evidence-marker-layer/);
assert.match(targetCss, /@media\(max-width:760px\)\{\.contract-combined-score-rate\{grid-template-columns:minmax\(0,1fr\)\}/, "narrow universal score and hit-rate cards stack instead of clipping");
assert.match(targetCss, /font-variant-numeric:tabular-nums;white-space:nowrap/, "universal numeric result remains legible without clipping or broken percentage tokens");
assert.doesNotMatch(runtime, /function universalResultMarkup/);
assert.match(episode64ReviewAuthority, /"targets": RESOLVER\.catalog\(\)/, "Episode 64 review authority exposes the approved generic catalog");
assert.doesNotMatch(episode64ReviewAuthority, /startswith\("qt_printer13_product_"\)/, "Episode 64 review authority must not hide pre-QT registrations");

for (const target of targets) {
  for (const sharedSource of [runtime, await read("backend/executors/declarative_target_score.py")]) {
    assert.ok(!sharedSource.includes(target.targetProfileId), `shared code branches on ${target.targetProfileId}`);
  }
}

console.log("PASS pre-QT generic preservation boundary: 251/251 contracts and 8/8 mature adapters byte-identical");
console.log("PASS pre-QT generic architecture: 18/18 targets retain one executor/adapter, recovered universal RESULT, and UGO projection road");
