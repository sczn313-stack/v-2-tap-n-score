import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const runtimeSource = fs.readFileSync(new URL("../target_execution_runtime.js", import.meta.url), "utf8");
const registrySource = fs.readFileSync(new URL("../usm_proof_registry.js", import.meta.url), "utf8");
const window = { location: { hostname: "127.0.0.1", search: "?authorityPort=8213" } };
const document = { readyState: "loading", addEventListener() {}, documentElement: { dataset: {} } };
vm.runInNewContext(registrySource, { window });
vm.runInNewContext(runtimeSource, { URLSearchParams, Uint8Array, DataView, Math, Intl, Date, Object, Array, Number, String, Set, Map, document, window });
const runtime = window.SCZN3TargetExecutionRuntime;
const targetIds = ["baker_tst12_17_5x23", "baker_tst12_23x35"];

function session(number, targetId) {
  return {
    sessionId: `tst12-history-${String(number).padStart(2, "0")}`,
    sessionLabel: `Session #${String(number).padStart(3, "0")}`,
    preservedAt: new Date(Date.UTC(2026, 9, number, 12)).toISOString(),
    authorityPackage: {
      missionFamily: "targetScoring",
      target: {
        id: targetId,
        version: "1",
        publisher: { id: "baker-targets", name: "Baker Targets" },
        product: { id: "baker-tst12", name: "TST-12 17.5 x 23", sku: "PREPRODUCTION-NOT-ASSIGNED" }
      },
      scoring: {
        model: "numeric_regions",
        status: "complete",
        observationCount: 6,
        creditedObservationCount: 5,
        additionalObservationCount: 1,
        total: number * 5,
        regionResults: [{ regionId: "station_01_crosshair", label: "Crosshair", value: 5, hitCount: 5, countedHitCount: 5, points: number * 5 }]
      }
    }
  };
}

for (const targetId of targetIds) {
  for (const count of [1, 3, 8, 9, 20]) {
    const input = Array.from({ length: count }, (_, index) => session(count - index, targetId));
    const series = runtime.usmHistorySeries(input, targetId);
    assert.deepEqual(Array.from(series, point => point.sessionLabel), Array.from({ length: count }, (_, index) => `Session #${String(index + 1).padStart(3, "0")}`), `${targetId} ${count}: sessions remain chronological`);
    const selected = Math.min(3, count);
    const markup = runtime.usmDrawerMarkup(series, `tst12-history-${String(selected).padStart(2, "0")}`);
    const widths = Array.from(markup.matchAll(/<svg width="(\d+)"/g), match => Number(match[1]));
    const expectedWidth = Math.max(640, 52 + Math.max(1, count - 1) * 72 + 52);
    assert.deepEqual(widths, [expectedWidth, expectedWidth, expectedWidth], `${targetId} ${count}: all three graphs use one session window and order`);
    assert.equal((markup.match(/data-usm-session-id=/g) || []).length, count * 3, `${targetId} ${count}: no historical point is removed`);
    assert.match(markup, new RegExp(`<strong>SESSION #${String(selected).padStart(3, "0")}<\\/strong>`), `${targetId} ${count}: the requested older session owns the detail panel`);
    assert.match(markup, new RegExp(`${String(selected).padStart(3, "0")}[\\s\\S]*10\\/${String(selected).padStart(2, "0")}\\/26`), `${targetId} ${count}: selected session number and date remain paired`);
    assert.match(markup, new RegExp(`<strong>${selected * 5} POINTS<\\/strong>`), `${targetId} ${count}: selected score remains visible with its point unit`);
    assert.match(markup, /GO TO SESSION FOR BREAKDOWN/, `${targetId} ${count}: informational session-breakdown text is preserved`);
    assert.match(markup, /TAP ANY DATA POINT CIRCLE TO VIEW THAT SESSION/, `${targetId} ${count}: graph instruction names the actual interactive circle`);
    assert.doesNotMatch(markup, /TAP ANY BULLET TO VIEW THAT SESSION/, `${targetId} ${count}: retired graph wording is absent`);
    const scoreControl = markup.match(/<div class="contract-usm-metric-card contract-usm-static-score[\s\S]*?<\/div>/)?.[0] || "";
    assert.ok(scoreControl, `${targetId} ${count}: static score card is rendered`);
    assert.doesNotMatch(scoreControl, /<a\b|href=|data-usm-exact-reopen|role=|tabindex=|TAP FOR BREAKDOWN|DETAILS|contract-usm-disclosure-cue|data-usm-metric-trigger|aria-expanded|aria-controls/, `${targetId} ${count}: score card has no link, keyboard activation, dropdown behavior, or exact-SEC navigation`);
    assert.doesNotMatch(markup, /data-usm-metric-trigger="score"|contract-usm-panel-score|SCORING DISTRIBUTION &amp; BREAKDOWN|ALL SCORING REGIONS/, `${targetId} ${count}: TST-12 score has no dropdown panel or reconstructed breakdown`);
  }
}

const nonTst12Input = [session(1, "fixture_paper_alpha")];
const nonTst12Markup = runtime.usmDrawerMarkup(runtime.usmHistorySeries(nonTst12Input, "fixture_paper_alpha"), "tst12-history-01");
assert.match(nonTst12Markup, /SCORING DISTRIBUTION &amp; BREAKDOWN/, "non-TST-12 History keeps its existing score breakdown");
assert.match(nonTst12Markup, /data-usm-metric-trigger="score"/, "non-TST-12 History keeps its existing score dropdown behavior");
assert.match(nonTst12Markup, /tap for breakdown/, "non-TST-12 History keeps its existing score instruction");

assert.match(runtimeSource, /scrollers\.forEach\(target => \{ if \(target !== source\) target\.scrollLeft = source\.scrollLeft; \}\)/, "Total Points, Total Taps, and Points per Tap share horizontal navigation");
assert.match(runtimeSource, /const point = pointById\.get\(sessionId\)/, "point selection resolves the exact session rather than the newest session");
assert.match(runtimeSource, /usmReopenBaseHref\(point\)/, "the selected point retains its own SEC route");
assert.match(runtimeSource, /function tst12ScoreCard\(point\)[\s\S]*contract-usm-static-score/, "TST-12 score is owned by a dedicated static presentation card");
assert.doesNotMatch(runtimeSource, /function tst12ScoreCard\(point\)[\s\S]{0,700}(?:data-usm-exact-reopen|href=|data-usm-metric-trigger|aria-expanded|aria-controls)/, "TST-12 score card has no navigation or disclosure contract");
assert.doesNotMatch(runtimeSource, /Open this session's SEC to review its preserved station-by-station scoring ledger\./, "retired Station Results instruction is removed");
assert.match(runtimeSource, /scrollLeft = scroller\.scrollWidth/, "newest chronological sessions are revealed without deleting older points");

console.log("PASS TST-12 History windows: 1, 3, 8, 9, and 20 preserved sessions");
