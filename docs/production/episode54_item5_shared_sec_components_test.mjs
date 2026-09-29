import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const names = ["sec_framework.js", "baker_sl_st1_sec.js", "m4_zeroing_sec.js", "records.html"];
const [framework, baker, m4, records] = await Promise.all(names.map(name => readFile(name, "utf8")));
const context = { window: {} };
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(framework, context, { filename: "sec_framework.js" });

const components = context.window.SCZN3SECComponents;
for (const name of ["Evidence", "Measurement", "Result", "LowestScoreWinsPanel", "Recommendation", "Execution", "Validation", "Preservation", "SessionDetails", "ActionBar", "ZeroingCorrection"]) {
  assert.equal(typeof components[name], "function", `${name} has one platform owner`);
}
assert.deepEqual(Array.from(components.semanticOrder), ["evidence", "measurement", "recommendation", "execution", "validation", "preservation"]);
assert.match(components.Evidence({ contentHtml: "<figure>evidence</figure>" }), /data-sec-component="evidence"/);
assert.match(components.Result({ family: "highest-score-wins", contentHtml: "<strong>100</strong>" }), /data-result-family="highest-score-wins"/);
assert.match(components.LowestScoreWinsPanel({ metrics: [{ label: "Final Time", value: "8.50s" }] }), /data-lowest-score-wins-presentation="platform-v1"/, "lowest-score-wins presentation has one platform owner");
assert.equal(components.Result({ family: "invented-family", contentHtml: "bad" }), "", "unregistered result families fail closed");
assert.match(components.SessionDetails({ fields: [{ label: "Date", value: "Aug 16, 2026" }] }), /sec-session-record-fields/);
assert.match(components.ActionBar({ actions: [{ label: "Open SEC", href: "records.html", primary: true }] }), /class="button primary"/);
assert.match(components.ZeroingCorrection({ systemLabel: "Scope", axes: [{ label: "Windage", direction: "2 LEFT", supporting: "0.25 MOA/click" }] }), /sec-sight-correction-story/);

const combinedAdapters = `${baker}\n${m4}\n${records}`;
assert.equal((combinedAdapters.match(/SCZN3SECComponents\s*=/g) || []).length, 0, "target adapters never claim shared component ownership");
for (const component of ["Evidence", "Measurement", "Result", "Execution", "Validation", "Preservation", "ActionBar", "SessionDetails"]) {
  assert.match(combinedAdapters, new RegExp(`SCZN3SECComponents\\.${component}\\(`), `${component} is consumed through the shared owner`);
}
assert.match(m4, /Result\(\{ family: "zeroing-correction"/);
assert.match(records, /Result\(\{ family: "zeroing-correction"/);
assert.match(records, /Result\(\{ family: "lowest-score-wins"/);
assert.match(baker, /Result\(\{[\s\S]*family: "highest-score-wins"/);
assert.doesNotMatch(combinedAdapters, /function zeroingReferenceMetric\(/, "duplicate metric presentation is retired");
assert.doesNotMatch(records, /return `<div class="sec-sight-correction-axis"/, "100 Yard maps correction data into the shared zeroing presenter");
assert.match(records, /<script src="sec_framework\.js\?v=[^"]+"><\/script>/, "historical SEC renderers consume the shared component owner");
assert.match(await readFile("sec-framework.css", "utf8"), /\.sec-component\{display:contents\}/, "component extraction preserves established layout");

console.log("PASS Episode 54 Item 5 shared SEC components have one platform owner and all four adapters consume presentation without frontend authority");
