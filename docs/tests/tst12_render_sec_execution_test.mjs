import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../target_execution_runtime.js", import.meta.url), "utf8");
const document = {
  readyState: "loading",
  addEventListener() {},
  documentElement: { dataset: {} },
  querySelectorAll() { return []; },
  getElementById() { return null; }
};
const components = {
  Evidence: ({ contentHtml }) => contentHtml,
  Result: ({ contentHtml }) => contentHtml,
  Measurement: ({ contentHtml }) => contentHtml,
  SessionFoundation: () => "",
  ActionBar: ({ actions }) => actions.map(action => action.label).join(" | "),
  Preservation: ({ contentHtml }) => contentHtml
};
const context = {
  document,
  URLSearchParams,
  location: { search: "", hostname: "127.0.0.1", href: "http://127.0.0.1:8221/target-experience.html" }
};
context.window = context;
context.SCZN3SEC = {
  render: ({ regions }) => regions.map(region => region.contentHtml).join("\n"),
  renderUnavailable: reason => `UNAVAILABLE:${reason}`
};
context.SCZN3SECComponents = components;
context.SCZN3ExecutionFamilyAdapters = { createViewModel: () => ({ ok: true }) };
context.SCZN3SECReopenAuthority = { portableUrl: value => value };
vm.runInNewContext(source, context, { filename: "target_execution_runtime.js" });

const result = {
  ok: true,
  status: "complete",
  missionFamily: "targetScoring",
  executionContract: { contractId: "tec-baker_tst12_17_5x23-target-scoring-v1", contractVersion: "1", contractFingerprint: "a".repeat(64), secAdapterFamilyId: "target-scoring-family" },
  target: {
    id: "baker_tst12_17_5x23", version: "1",
    publisher: { id: "baker-targets", name: "Baker Targets" },
    product: { id: "sczn3-baker-tst12-17-5x23", name: "TST-12 17.5 x 23", sku: "PREPRODUCTION-NOT-ASSIGNED", dimensions: { width: 17.5, height: 23, unit: "inch" } }
  },
  scoring: { status: "complete", model: "numeric_regions", total: 150, observationCount: 60, actualHitCount: 48, actualMissCount: 12, regionResults: [] },
  observations: [],
  classifications: [{ observationId: "shot-1", countsAsHit: true, value: 5 }],
  reconciliation: { status: "reconciled", countsMatch: true, recordedObservationCount: 1 },
  aimStructure: { mode: "not_required" }
};

const html = context.SCZN3TargetExecutionRuntime.renderSEC({
  session: { sessionId: "tst12-render-regression", authorityPackage: result },
  package: result,
  mode: "live"
});

assert.match(html, /YOUR TARGET/, "TST-12 Result renders the approved evidence label");
assert.match(html, /TST-12 17\.5 x 23/, "TST-12 identity renders after resolving Backend target identity");
assert.doesNotMatch(html, /PREPRODUCTION-NOT-ASSIGNED/, "internal SKU placeholder is absent from the shooter-facing Result");
assert.doesNotMatch(html, /UNAVAILABLE:/, "renderSEC does not fail before Backend target identity resolution");
console.log("PASS TST-12 renderSEC execution regression");
