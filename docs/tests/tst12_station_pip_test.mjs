import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(docs, "tst12_station_results.js"), "utf8");
const fixture = JSON.parse(fs.readFileSync(path.join(docs, "assets/tst12-demo/sczn3-tst12-17-5x23-demo-v1.json"), "utf8")).authorityResult;
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "tst12_station_results.js" });
const renderer = context.window.SCZN3Tst12StationResults;

assert.equal(renderer.PRESENTATION_ID, "sczn3-tst12-station-pip-cq-20261107-2");

function count(markup, expression) {
  return (markup.match(expression) || []).length;
}

const simulator = renderer.render(fixture, { experienceMode: "simulation" });
assert.equal(count(simulator, /data-tst12-station-card=/g), 12, "Simulator always presents all twelve governed stations");
assert.equal(count(simulator, /data-tst12-station-pip="available"/g), 12, "all fixture stations have governed PiP data");
assert.equal(count(simulator, /data-observation-id=/g), 120, "only sixty credited impacts are rendered in preview and expanded views");
assert.equal(count(simulator, /class="tst12-pip-impact-label"/g), 120, "every selected impact has a horizontal numbered capsule in preview and inspection");
assert.equal(count(simulator, /class="tst12-pip-impact-number"/g), 120, "every capsule retains its stable displayed observation number");
assert.match(simulator, /<b>ZOOM<\/b>/, "the unified closed control is labeled ZOOM");
assert.match(simulator, /<b>CLOSE<\/b>/, "the unified open control is labeled CLOSE");
assert.doesNotMatch(simulator, />EXPAND</, "the separated EXPAND label is retired");
assert.match(simulator, /TST12_PRINT_17\.5X23_TAP_N_SCORE_V1\.svg/, "17.5 x 23 uses the approved Tap-n-Score target artwork");
assert.match(simulator, /data-impact-diameter-inches="0\.223"/, "governed impact footprint is preserved in physical inches");
assert.match(simulator, /data-authoritative-x=/, "rendered impacts retain authoritative normalized coordinates");

const actual = renderer.render(fixture, { experienceMode: "actual" });
assert.doesNotMatch(actual, /data-tst12-station-pip=/, "Actual Round is unchanged in the Simulator-first phase");
assert.doesNotMatch(actual, /data-tst12-station-state=/, "Actual Round does not receive Simulator state presentation");

const size23 = structuredClone(fixture);
size23.target.id = "sczn3_tst12_clean_v1_23x35";
const simulator23 = renderer.render(size23, { experienceMode: "simulation" });
assert.match(simulator23, /TST12_PRINT_23X35_TAP_N_SCORE_V1\.svg/, "23 x 35 uses its matching Tap-n-Score artwork");
assert.match(simulator23, /data-ugo-physical-size="23x35"/, "23 x 35 uses its governed physical coordinate space");

const lifecycle = structuredClone(fixture);
lifecycle.classifications = lifecycle.classifications.filter(item => /station_0[12]_square/.test(item.assignedStationRegionId));
lifecycle.scoring.stationBestFive = lifecycle.scoring.stationBestFive.slice(0, 2);
const stationOne = lifecycle.classifications.filter(item => item.assignedStationRegionId === "station_01_square");
stationOne[1].canonicalTargetCoordinate.xNorm = stationOne[0].canonicalTargetCoordinate.xNorm;
stationOne[1].canonicalTargetCoordinate.yNorm = stationOne[0].canonicalTargetCoordinate.yNorm;
stationOne[1].xNorm = stationOne[0].xNorm;
stationOne[1].yNorm = stationOne[0].yNorm;
const stationTwoLedger = lifecycle.scoring.stationBestFive[1];
stationTwoLedger.bestFiveScore = 0;
lifecycle.classifications.filter(item => item.assignedStationRegionId === "station_02_square").forEach(item => {
  item.countsAsHit = false;
  item.value = 0;
});
const extra = structuredClone(stationOne[0]);
extra.observationId = "uncredited-additional-observation";
extra.creditedForScore = false;
lifecycle.classifications.push(extra);
lifecycle.scoring.stationBestFive[0].totalObservations = 6;
lifecycle.scoring.stationBestFive[0].additionalObservations = 1;

const lifecycleMarkup = renderer.render(lifecycle, { experienceMode: "simulation" });
assert.match(lifecycleMarkup, /data-tst12-station="1" data-tst12-station-state="scored"/, "positive-score station is distinguished");
assert.match(lifecycleMarkup, /data-tst12-station="2" data-tst12-station-state="attempted-zero"/, "attempted zero-point station is distinguished from untouched");
assert.match(lifecycleMarkup, /data-tst12-station="3" data-tst12-station-state="not-attempted"/, "untouched station is distinguished without inferring a miss");
assert.match(lifecycleMarkup, /data-overlap-count="2"/, "overlapping credited impacts remain individually represented");
assert.doesNotMatch(lifecycleMarkup, /uncredited-additional-observation/, "additional observations are preserved in accounting but omitted from the selected-for-scoring PiP");

const edge = structuredClone(fixture);
const edgeShot = edge.classifications.find(item => item.assignedStationRegionId === "station_03_square");
edgeShot.canonicalTargetCoordinate.xNorm = 0.999;
edgeShot.xNorm = 0.999;
const edgeMarkup = renderer.render(edge, { experienceMode: "simulation" });
assert.match(edgeMarkup, new RegExp(`data-observation-id="${edgeShot.observationId}"[^>]*data-authoritative-x="0.999"[^>]*data-label-side="left"`), "right-edge capsule reverses horizontally without moving the authoritative impact");

const missingCoordinate = structuredClone(fixture);
delete missingCoordinate.classifications[0].canonicalTargetCoordinate;
delete missingCoordinate.classifications[0].xNorm;
delete missingCoordinate.classifications[0].yNorm;
const unavailable = renderer.render(missingCoordinate, { experienceMode: "simulation" });
assert.match(unavailable, /An authoritative selected-observation coordinate is unavailable\./, "missing authoritative coordinates fail closed instead of fabricating a PiP position");

const missingFootprint = structuredClone(fixture);
delete missingFootprint.ballisticGeometry;
const footprintUnavailable = renderer.render(missingFootprint, { experienceMode: "simulation" });
assert.match(footprintUnavailable, /The governed impact footprint is unavailable\./, "missing governed footprint fails closed");

console.log("PASS TST-12 Simulator station PiP authority, lifecycle states, overlap, and fail-closed coverage");
