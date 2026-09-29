import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const runtime = await readFile("target_execution_runtime.js", "utf8");
const css = await readFile("target-experience.css", "utf8");
const window = { location: { hostname: "127.0.0.1", search: "?authorityPort=8118" } };
const document = { readyState: "loading", addEventListener() {} };
vm.runInNewContext(runtime, { URLSearchParams, Uint8Array, DataView, Math, Intl, Date, Object, Array, Number, String, Set, Map, document, window });

const counting = {
  missionFamily: "targetScoring",
  target: { id: "counting-scale-run" },
  scoring: {
    model: "named_regions",
    observationCount: 19,
    outsideCount: 10,
    objectResults: [
      { objectId: "upper", label: "UPPER", observationCount: 3, hit: true },
      { objectId: "center", label: "CENTER", observationCount: 3, hit: true },
      { objectId: "lower_left", label: "LOWER-LEFT", observationCount: 2, hit: true },
      { objectId: "lower_right", label: "LOWER-RIGHT", observationCount: 1, hit: true }
    ]
  },
  sczn3Metrics: {
    status: "complete",
    hitRate: { validHitCount: 9, governedShotCount: 19, percentage: 47.4 },
    objectCoverage: { objectsHit: 4, scorableObjectCount: 4 }
  }
};
const countingMarkup = window.SCZN3TargetExecutionRuntime.shooterFacingResultMarkup(counting, {});
assert.match(countingMarkup, /9 HIT TAPS[\s\S]*10 MISSED[\s\S]*19 TOTAL TAPS/);
assert.match(countingMarkup, /SCZN3 Hit Rate[\s\S]*47\.4%/);
assert.match(countingMarkup, /4 of 4 target objects hit/);
assert.doesNotMatch(countingMarkup, /9 of 19 taps hit valid regions/);
assert.match(countingMarkup, /data-counting-details="true"/);

assert.doesNotMatch(runtime, /SEC preserved\. Exact reopen available\./);
assert.match(runtime, /className: "contract-exact-reopen"/);
assert.match(css, /contract-numeric-region-results tbody th\{color:#ffd84d;font-weight:950\}/);
assert.match(css, /contract-numeric-region-results tbody td\{color:#fff;font-weight:500\}/);
assert.match(css, /contract-exact-reopen\{border-color:#ffd84d;background:#ffd84d;color:#080808;font-weight:950\}/);

console.log("PASS QT scale-run shared Counting, RESULT language, and Exact Reopen presentation locks");
