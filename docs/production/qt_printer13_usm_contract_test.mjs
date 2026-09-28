import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile("target_execution_runtime.js", "utf8");
const registrySource = await readFile("usm_proof_registry.js", "utf8");
const window = { location: { hostname: "127.0.0.1", search: "?authorityPort=8118" } };
vm.runInNewContext(registrySource, { window });
const document = { readyState: "loading", addEventListener() {} };
vm.runInNewContext(source, { URLSearchParams, Uint8Array, DataView, Math, Intl, Date, Object, Array, Number, String, Set, Map, document, window });
const runtime = window.SCZN3TargetExecutionRuntime;
const targetId = "qt_printer13_product_1960116518985";

function session(number, taps, hits, score, preservedAt) {
  return {
    sessionId: `qt-session-${number}`,
    sessionLabel: `Session #${number}`,
    preservedAt,
    authorityPackage: {
      missionFamily: "targetScoring",
      target: {
        id: targetId, version: "1",
        publisher: { id: "qualification-targets", name: "Qualification Targets" },
        product: { id: "QT-PRODUCT-1960116518985", name: "FBI-IP1", sku: "FBI-IP1" }
      },
      scoring: {
        model: "numeric_regions", status: "complete", observationCount: taps, total: score,
        regionResults: [{ regionId: "score_10", hitCount: hits }]
      }
    }
  };
}

const sessions = [
  session("001", 6, 5, 48, "2026-09-27T10:00:00Z"),
  session("002", 10, 8, 77, "2026-09-27T11:00:00Z")
];
const series = runtime.usmHistorySeries(sessions, targetId);
assert.equal(series.length, 2, "QT scoring target retains chronological USM history across tap counts");
assert.deepEqual(Array.from(series, point => point.hitRate), [83.33, 80]);
assert.deepEqual(Array.from(series, point => point.pointsPerTap), [8, 7.7]);
const markup = runtime.usmDrawerMarkup(series, "qt-session-002");
assert.match(markup, /3 · HISTORY[\s\S]*FBI-IP1[\s\S]*FBI-IP1 DETAILS/);
assert.match(markup, /SCORE <i>\|<\/i> HIT RATE <i>\|<\/i> POINTS PER TAP/);
assert.match(markup, /77 points ÷ 10 taps<br>= 7\.7/);
assert.match(markup, /8 hits ÷ 10 taps<br>= 80%/);
assert.doesNotMatch(markup, /normalized|efficiency|publisher rule|governed score/i);
console.log("PASS QT Printer #13 scoring → USM contract");
