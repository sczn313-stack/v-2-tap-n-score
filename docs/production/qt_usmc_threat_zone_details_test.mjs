import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile("target_execution_runtime.js", "utf8");
const window = { location: { hostname: "127.0.0.1", search: "?authorityPort=8118" } };
const document = { readyState: "loading", addEventListener() {} };
vm.runInNewContext(source, { URLSearchParams, Uint8Array, DataView, Math, Intl, Date, Object, Array, Number, String, Set, Map, document, window });

const result = {
  missionFamily: "targetScoring",
  target: { id: "qt_printer13_product_1891723542601" },
  scoring: {
    model: "named_regions",
    observationCount: 26,
    outsideCount: 9,
    objectResults: [
      { objectId: "head_circle", label: "5-inch Circle Head Zone", observationCount: 3 },
      { objectId: "head_outline", label: "Outline of Head Zone", observationCount: 2 },
      { objectId: "center_chest", label: "10-inch Center Chest Zone", observationCount: 4 },
      { objectId: "center_mass", label: "19.5-inch Center Mass Zone", observationCount: 5 },
      { objectId: "pelvic_zone", label: "Full Polygonal Pelvic Zone", observationCount: 3 }
    ]
  },
  sczn3Metrics: {
    status: "complete",
    hitRate: { validHitCount: 17, governedShotCount: 26, percentage: 65.4 },
    objectCoverage: { objectsHit: 5, scorableObjectCount: 5 }
  }
};

const markup = window.SCZN3TargetExecutionRuntime.shooterFacingResultMarkup(result, {});
assert.match(markup, /17 HIT TAPS/);
assert.match(markup, /9 MISSED/);
assert.match(markup, /26 TOTAL TAPS/);
assert.match(markup, /SCZN3 Hit Rate[\s\S]*65\.4%/);
assert.doesNotMatch(markup, /taps hit valid regions/);
assert.match(markup, /5 of 5 target objects hit/);
assert.match(markup, /<details class="contract-numeric-region-results contract-zone-details" data-zone-details="true">/);
assert.match(markup, /Zone details/);
assert.match(markup, /Tap to view/);
assert.doesNotMatch(markup, /contract-object-groups/);

for (const zone of result.scoring.objectResults) {
  assert.equal(markup.split(zone.label).length - 1, 1, `${zone.label} is displayed exactly once`);
  assert.match(markup, new RegExp(`${zone.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?<td>${zone.observationCount}</td>`));
}

console.log("PASS USMC-THREAT compact Zone Details presentation");
