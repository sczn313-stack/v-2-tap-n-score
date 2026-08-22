import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const context = vm.createContext({ window: {} });
for (const file of ["platform_contracts.js", "sec_adapter_model.js", "sec_dispatch.js"]) vm.runInContext(read(file), context, { filename: file });

const adapters = context.window.SCZN3TargetAdapters;
for (const id of ["baker-gf-db-points", "baker-gf-db-numbers", "baker-gf-bp", "ez2c-dot-torture", "baker-gf-bb-c", "baker-gf-battleship"]) {
  const adapter = adapters.get(id);
  assert(adapter, `${id} registered`);
  assert.equal(adapter.authorityReferences.result.source, "backend-authoritative");
  const stages = Array.from(adapter.contentModel.components, component => component.stage);
  assert.equal(stages[0], "evidence");
  assert.equal(stages.at(-1), "preservation");
  assert.deepEqual(stages, [...stages].sort((a, b) => ["evidence", "measurement", "recommendation", "execution", "validation", "preservation"].indexOf(a) - ["evidence", "measurement", "recommendation", "execution", "validation", "preservation"].indexOf(b)));
  for (const forbidden of ["shellHtml", "structuralCss", "navigation", "scoringFormula", "classify", "executeMission"]) assert.equal(forbidden in adapter, false);
}
assert.equal(adapters.get("baker-gf-db-points").scoringPresentationFamily, "highest-score-wins");
assert.equal(adapters.get("baker-gf-db-numbers").scoringPresentationFamily, "qualification-pass-fail");
assert.equal(adapters.get("baker-gf-bp").scoringPresentationFamily, "qualification-pass-fail");
assert.equal(adapters.get("ez2c-dot-torture").scoringPresentationFamily, "highest-score-wins");
assert.equal(adapters.get("baker-gf-bb-c").scoringPresentationFamily, "qualification-pass-fail");
assert.equal(adapters.get("baker-gf-battleship").scoringPresentationFamily, "qualification-pass-fail");

const source = read("t/baker/fun/target-page.js");
for (const owner of ["SCZN3SmartTargetWorkspace.create", "SCZN3Actions.begin", "SCZN3BakerFunSEC.render", "SCZN3SECReopenLifecycle?.initialize"]) assert(source.includes(owner), `inherits ${owner}`);
assert(!source.includes("calculateScore") && !source.includes("classifyPin") && !source.includes("classifyDart"));

const sec = read("baker_fun_sec.js");
for (const owner of ["SCZN3SEC.render", "SCZN3SECComponents.Result", "SCZN3SECComponents.Evidence", "SCZN3SECComponents.Measurement", "SCZN3SECComponents.Validation", "SCZN3SECComponents.Preservation", "SCZN3SECComponents.ActionBar"]) assert(sec.includes(owner), `SEC inherits ${owner}`);

const runtime = read("m4_runtime.js");
assert.match(runtime, /supportedBakerFunResult[\s\S]*classificationAuthority === "backend"[\s\S]*scoringAuthority === "backend"[\s\S]*reconciliation\.status === "reconciled"/, "shared preservation owner admits only reconciled backend-authoritative Baker Fun SECs");

const experiences = read("target_experiences.js");
assert.match(experiences, /id: "dart-board"[\s\S]*status: "available"[\s\S]*target=gf-db/);
assert.match(experiences, /id: "bowling-pins"[\s\S]*status: "available"[\s\S]*target=gf-bp/);
assert.match(experiences, /id: "dot-torture"[\s\S]*status: "available"[\s\S]*target=dot-torture/);
assert.match(experiences, /id: "billiard-balls"[\s\S]*status: "available"[\s\S]*target=gf-bb/);
assert.match(experiences, /id: "baker-battleship"[\s\S]*status: "available"[\s\S]*target=gf-battleship/);
assert.doesNotMatch(experiences, /st-001-universal-bullseye/);

console.log("Episode 55 Baker Fun inheritance contract PASS");
