import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const manifestPath = "authority-evidence/platform/known-good-target-regression-2026-09-08/KNOWN_GOOD_TARGETS.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const launcher = await readFile("founder-scale-batch-1-review.html", "utf8");
const vaultContract = await readFile("production/sec_vault_architecture_contract_test.mjs", "utf8");
const vault = await readFile("records.html", "utf8");
const dispatch = await readFile("sec_dispatch.js", "utf8");

assert.equal(manifest.schemaVersion, "sczn3-known-good-target-regression-v1");
assert.equal(manifest.targets.length, 12, "the exact completed-target inventory remains explicit");

const identities = new Set();
for (const target of manifest.targets) {
  for (const field of ["targetIdentity", "route", "resultBehavior", "secBehavior", "vaultBehavior", "exactReopenBehavior", "regression"]) {
    assert.equal(typeof target[field], "string", `${target.targetIdentity || "target"} has ${field}`);
    assert.ok(target[field].trim(), `${target.targetIdentity || "target"} has a non-empty ${field}`);
  }
  assert.equal(identities.has(target.targetIdentity), false, `${target.targetIdentity} is unique`);
  identities.add(target.targetIdentity);
  await access(target.regression);
  assert.match(target.vaultBehavior, /Ballistic Vault/, `${target.targetIdentity} preserves the existing Vault destination`);
  assert.equal(typeof target.confirmationApplicable, "boolean", `${target.targetIdentity} declares whether confirmation applies`);
}

const exactInheritedRoutes = [
  "t/baker/sl-st2/?founderReview=scale-batch-1",
  "t/baker/fun/?target=gf-bb&amp;founderReview=scale-batch-1",
  "t/gunfun/vital-dude/?founderReview=scale-batch-1"
];
for (const route of exactInheritedRoutes) assert.ok(launcher.includes(route), `Batch #1 inherits ${route}`);
for (const targetId of ["idpa_silhouette_sl_st2", "baker_gf_bb_c", "gunfun_22740_vital_dude"]) {
  assert.doesNotMatch(launcher, new RegExp(`target-experience\\.html[^\"']*target=${targetId}`), `${targetId} is not diverted through a generic substitute route`);
}

assert.match(vaultContract, /Same destination = same name|Ballistic Vault|must not rename the Ballistic Vault as History/);
assert.match(vault, /CONTRACT_TARGET_SCORING[\s\S]*?SCZN3TargetExecutionRuntime\.vaultResultSummary/, "data-defined scores use the shared Vault result summary");
assert.match(vault, /scoredEvidenceTarget =[^;]*Boolean\(resultSummary\)/, "a preserved shared result cannot fall through to zeroing confirmation UI");
assert.match(dispatch, /CONTRACT_TARGET_SCORING[\s\S]*?target-experience\.html\?session=/, "target-scoring SECs exact-reopen through their shared production route");
assert.equal(manifest.targets.filter(target => target.confirmationApplicable).length, 3, "only governed zeroing targets require confirmation");
assert.equal(manifest.targets.filter(target => !target.confirmationApplicable).length, 9, "non-zeroing targets remain free of zeroing confirmation machinery");

console.log(`PASS known-good target regression inventory: ${manifest.targets.length}/${manifest.targets.length}`);
console.log("PASS Batch #1 exact-route inheritance: 3/3");
