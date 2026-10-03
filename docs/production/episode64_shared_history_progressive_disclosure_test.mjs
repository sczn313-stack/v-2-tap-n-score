import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const [source, css] = await Promise.all([
  readFile(new URL("../target_execution_runtime.js", import.meta.url), "utf8"),
  readFile(new URL("../target-experience.css", import.meta.url), "utf8"),
]);
const window = {
  location: { hostname: "127.0.0.1", search: "" },
  SCZN3USMProofRegistry: { isEligible() { return true; } },
};
const document = { readyState: "loading", addEventListener() {} };
vm.runInNewContext(source, {
  URLSearchParams, Uint8Array, Uint32Array, ArrayBuffer, DataView,
  Math, Intl, Date, Object, Array, Number, String, Set, Map, RegExp,
  document, window,
});

const labels = ["Pink", "Green", "Red", "Blue", "Yellow", "Purple", "Orange", "Teal"];
const values = [10, 9, 8, 7, 6, 5];
const regionResults = labels.flatMap((label, objectIndex) => values.map((value, valueIndex) => ({
  regionId: `balloon_${objectIndex + 1}_${value}`,
  label: `${label} Balloon — ${valueIndex === 0 ? "X" : value}`,
  value,
  hitCount: objectIndex === valueIndex ? 1 : 0,
  points: objectIndex === valueIndex ? value : 0,
})));
const objectResults = labels.map((label, index) => ({
  objectId: `balloon_${index + 1}`,
  label: `${label} Balloon`,
  observationCount: 1,
  hitCount: 1,
  hit: true,
  score: values[index % values.length],
  xCount: index < 2 ? 1 : 0,
  ringCounts: index < 2 ? {} : { [values[index % values.length]]: 1 },
  performancePercentage: 100,
}));
const result = {
  missionFamily: "targetScoring",
  target: { id: "balloons-history-test", version: "1", publisher: { id: "baker", name: "Baker Targets" }, product: { id: "balloons", name: "Balloons Target", sku: "GF-Balloons" } },
  smartTargetTreatment: {
    shooterFacingVocabulary: { singular: "balloon", plural: "balloons" },
    objectCompletionLabel: "Balloons Popped",
    objectCompletionVerbPast: "popped",
    outsideLabel: "Outside Scoring Area",
  },
  scoring: {
    model: "mixed_regions", status: "complete", observationCount: 9, outsideCount: 1, total: 64,
    regionResults, objectResults,
    valueDistribution: [
      { label: "X · SCZN3-derived 10", value: 10, hitCount: 2, points: 20, countsAsX: true, valueAuthority: "sczn3_derived" },
      ...[9, 8, 7, 6, 5].map(value => ({ label: String(value), value, hitCount: 1, points: value, countsAsX: false })),
    ],
  },
  classifications: [
    ...objectResults.map((item, index) => ({ objectId: item.objectId, regionId: regionResults[index * values.length + (index % values.length)].regionId, value: item.score, countsAsHit: true })),
    { objectId: null, regionId: "outside", value: null, countsAsHit: false },
  ],
  sczn3Metrics: {
    hitRate: { validHitCount: 8, governedShotCount: 9 },
    objectCoverage: { objectsHit: 8, scorableObjectCount: 8 },
    objectDistribution: {
      strongest: { objectId: "balloon_8", label: "Teal Balloon", tapCount: 1 },
      weakest: { objectId: "balloon_1", label: "Pink Balloon", tapCount: 1 },
      countRange: 0, standardDeviationTaps: 0, evennessPercentage: 100,
    },
  },
};

const session = { sessionId: "sczn3-session-history-drawers", sessionLabel: "Session #001", preservedAt: "2026-10-03T12:00:00Z", authorityPackage: result };
const [point] = window.SCZN3TargetExecutionRuntime.usmHistorySeries([session], "balloons-history-test");
assert.equal(point.objectResults.length, 8, "HISTORY must preserve every per-balloon result for drill-down");
assert.equal(point.valueDistribution.length, 6, "HISTORY must preserve the compact aggregate scoring distribution");
assert.deepEqual(JSON.parse(JSON.stringify(point.objectCoverage)), { objectsHit: 8, scorableObjectCount: 8 });

const markup = window.SCZN3TargetExecutionRuntime.usmDrawerMarkup([point], session.sessionId);
assert.equal((markup.match(/data-usm-metric-trigger=/g) || []).length, 3, "three summary metrics remain on the first surface");
assert.equal((markup.match(/class="contract-usm-disclosure-cue"/g) || []).length, 3, "each shared summary metric owns the small disclosure cue");
assert.equal((markup.match(/data-usm-metric-panel=/g) || []).length, 3, "each summary metric owns one drill-down drawer");
assert.equal((markup.match(/data-usm-metric-panel="[^"]+" hidden/g) || []).length, 3, "all metric drawers are closed by default");
assert.match(markup, /SCORING DISTRIBUTION &amp; BREAKDOWN/);
assert.match(markup, /X · SCZN3-derived 10/);
assert.match(markup, /PER-BALLOON DETAIL/);
assert.match(markup, /PER-BALLOON ENGAGEMENT/);
assert.match(markup, /BALLOONS POPPED[\s\S]*8[\s\S]*8/);
assert.match(markup, /ALL SCORING REGIONS/);
assert.equal((markup.match(/class="contract-usm-object-grid"/g) || []).length, 2, "score and hit-rate drawers both expose per-object detail");
assert.match(markup, /Outside Scoring Area — 1 tap · count only/);
assert.match(css, /\.contract-usm-object-grid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, "desktop per-object detail is two columns");
assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.contract-usm-detail-list,\.contract-usm-object-grid,\.contract-usm-comparison\{grid-template-columns:1fr\}/, "mobile drill-down collapses to one column");
assert.match(css, /\.contract-usm-disclosure-cue::after\{[^}]*content:"⌄"/, "closed drawers use a small down disclosure chevron");
assert.match(css, /\.contract-usm-metric-card\[aria-expanded="true"\] \.contract-usm-disclosure-cue::after\{content:"⌃"/, "open drawers use a small up disclosure chevron driven by aria-expanded");
assert.doesNotMatch(css, /\.contract-usm-disclosure-cue[^}]*border-radius:50%/, "metric disclosure cues do not borrow circular navigation treatment");
assert.match(source, /metricTrigger\.setAttribute\("aria-expanded", "true"\)/, "shared drawer state keeps accessibility state authoritative");
assert.doesNotMatch(source, /balloons-history-test|GF-Balloons|PK-Ladies|PK-PartyPack/, "shared presentation contains no Balloons identity branch");

console.log("PASS Episode 64 shared HISTORY: summary first, metric drawers, nested per-object/region detail, full data retained");
