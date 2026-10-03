import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile("target_execution_runtime.js", "utf8");
const window = { location: { hostname: "127.0.0.1", search: "?authorityPort=8118" } };
const document = { readyState: "loading", addEventListener() {} };
vm.runInNewContext(source, { URLSearchParams, Uint8Array, DataView, Math, Intl, Date, Object, Array, Number, String, Set, Map, document, window });

const result = {
  missionFamily: "targetScoring",
  target: { id: "counting-presentation-regression" },
  scoring: {
    model: "named_regions",
    observationCount: 25,
    outsideCount: 11,
    objectResults: [
      { objectId: "region", label: "Governed Region", observationCount: 2, hit: true },
      { objectId: "central", label: "Central Governed Region", observationCount: 1, hit: true },
      { objectId: "remaining", label: "Remaining Governed Target Area", observationCount: 2, hit: true },
      { objectId: "named", label: "Pistol Zone", observationCount: 9, hit: true },
      { objectId: "inactive", label: "Dormant Zone", observationCount: 0, hit: false }
    ]
  },
  sczn3Metrics: {
    status: "complete",
    hitRate: { validHitCount: 14, governedShotCount: 25, percentage: 56 },
    objectCoverage: { objectsHit: 4, scorableObjectCount: 5 }
  }
};

const markup = window.SCZN3TargetExecutionRuntime.shooterFacingResultMarkup(result, {});
assert.match(markup, /14 HIT TAPS[\s\S]*11 MISSED[\s\S]*25 TOTAL TAPS/);
assert.match(markup, /<details class="contract-numeric-region-results contract-counting-details" data-counting-details="true">/);
assert.doesNotMatch(markup, /<details[^>]*\sopen(?:\s|>)/i);
assert.match(markup, /Zones hit/);
assert.match(markup, /Tap to view/);
assert.match(markup, /Region[\s\S]*?<td>2<\/td>/);
assert.match(markup, /Central Region[\s\S]*?<td>1<\/td>/);
assert.match(markup, /Remaining Target Area[\s\S]*?<td>2<\/td>/);
assert.match(markup, /Pistol Zone[\s\S]*?<td>9<\/td>/);
const primaryDetail = markup.split('<details class="contract-all-target-regions"')[0];
assert.doesNotMatch(primaryDetail, /Dormant Zone|<td>0<\/td>/, "inactive regions stay off the primary shooter-facing breakdown");
assert.match(markup, /All target regions[\s\S]*Dormant Zone[\s\S]*<td>0<\/td>/, "zero-hit regions remain available one disclosure level deeper");
assert.doesNotMatch(markup, /governed/i);
assert.doesNotMatch(markup, /observationPercentage|%<\/td>/i);

console.log("PASS universal Counting drawer and shooter-facing label sanitization");
