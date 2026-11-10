import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const identity = "sczn3-three-path-release-20261109-1";
const stationIdentity = "sczn3-tst12-station-pip-cq-20261107-2";
const read = relative => fs.readFileSync(path.join(docs, relative), "utf8");
const runtimeSource = read("target_execution_runtime.js");
const adapterSource = read("tst12_universal_experience.js");
const recordsSource = read("records.html");
const targetHtml = read("target-experience.html");
const targetCss = read("target-experience.css");
const universalCss = read("tst12-universal-experience.css");
const vaultCss = read("ballistic-vault.css");

for (const source of [runtimeSource, adapterSource, targetHtml, targetCss, universalCss, recordsSource, vaultCss]) {
  assert.match(source, new RegExp(identity), "every Founder-delivered presentation surface carries the approved identity");
}
const stationResultsSource = read("tst12_station_results.js");
assert.match(stationResultsSource, new RegExp(stationIdentity), "the shared station renderer carries the Simulator PiP identity");
assert.match(stationResultsSource, /TOTAL STATION RESULTS/, "the shared Result and Vault renderer carries the aggregate heading");
assert.match(adapterSource, /SCZN3Tst12StationResults/, "fresh and exact-reopen Results use the shared station renderer");
assert.match(recordsSource, /SCZN3Tst12StationResults/, "Vault uses the shared station renderer");
for (const source of [stationResultsSource]) {
  assert.match(source, /tst12-condition-separator/, "eye and hand abbreviations have an independent separator");
  assert.match(source, /tst12-condition-description/, "eye and hand descriptions have an independent element");
  for (const label of ["TOTAL TAPS", "HITS", "MISSES", "SELECTED FOR SCORING", "ADDITIONAL OBSERVATIONS"]) {
    assert.match(source, new RegExp(label), `${label} remains an independently named accounting metric`);
  }
}
assert.match(runtimeSource, /contract-usm-static-score/, "TST-12 History uses the non-interactive score card");
assert.match(runtimeSource, /GO TO SESSION FOR BREAKDOWN/, "the approved informational score text is present");
assert.doesNotMatch(runtimeSource.match(/function tst12ScoreCard\(point\)[\s\S]*?\n  }/)?.[0] || "", /href=|role=|tabindex=|data-usm-exact-reopen|data-usm-metric-trigger|onclick/, "the TST-12 score card has no navigation or activation contract");

const document = { readyState: "loading", addEventListener() {}, documentElement: { dataset: {} } };
const window = { location: { hostname: "127.0.0.1", search: "" } };
vm.runInNewContext(runtimeSource, { URLSearchParams, Uint8Array, DataView, Math, Intl, Date, Object, Array, Number, String, Set, Map, document, window });
const runtime = window.SCZN3TargetExecutionRuntime;
assert.equal(document.documentElement.dataset.tst12RuntimeIdentity, identity, "executing the approved runtime publishes its identity");

const sourceRegistrationObservations = [
  { observationId: "station-01-shot", xNorm: 0.1, yNorm: 0.1, assignedStationRegionId: "station_01_square" },
  { observationId: "station-07-shot", xNorm: 0.7, yNorm: 0.7, assignedStationRegionId: "station_07_square" }
];
const reversedCanonicalObservations = [
  { observationId: "station-07-shot", canonicalPoint: { xNorm: 0.71, yNorm: 0.72 } },
  { observationId: "station-01-shot", canonicalPoint: { xNorm: 0.11, yNorm: 0.12 } }
];
const canonicalScoring = runtime.canonicalScoringObservations(sourceRegistrationObservations, reversedCanonicalObservations);
assert.deepEqual(JSON.parse(JSON.stringify(canonicalScoring)), [
  { observationId: "station-07-shot", xNorm: 0.71, yNorm: 0.72, assignedStationRegionId: "station_07_square" },
  { observationId: "station-01-shot", xNorm: 0.11, yNorm: 0.12, assignedStationRegionId: "station_01_square" }
], "canonical registration coordinates retain station ownership by observation identity when response order changes");
assert.throws(
  () => runtime.canonicalScoringObservations(sourceRegistrationObservations, [reversedCanonicalObservations[0], reversedCanonicalObservations[0]]),
  /canonical_observation_identity_duplicate_station-07-shot/,
  "duplicate registration identities fail closed instead of borrowing another station by array position"
);

const observations = [
  { observationId: "shot-1", xNorm: 0.10, yNorm: 0.20 },
  { observationId: "shot-2", xNorm: 0.20, yNorm: 0.20 },
  { observationId: "shot-3", xNorm: 0.30, yNorm: 0.20 },
  { observationId: "shot-4", xNorm: 0.40, yNorm: 0.20 },
  { observationId: "shot-5", xNorm: 0.50, yNorm: 0.50 }
];
const classifications = [
  { observationId: "shot-1", countsAsHit: true, regionId: "station_01_crosshair" },
  { observationId: "shot-3", countsAsHit: true, regionId: "station_01_crosshair" },
  { observationId: "shot-4", countsAsHit: true, regionId: "station_01_crosshair" },
  { observationId: "shot-5", countsAsHit: true, regionId: "station_01_crosshair" },
  { observationId: "shot-2", countsAsHit: false, regionId: "outside" }
];
const result = {
  target: { product: { dimensions: { width: 17.5, height: 23, unit: "inch" } } },
  scoring: { status: "complete", stationCreditPolicy: { mode: "best_scoring_observations_per_station" } },
  observations,
  classifications
};
const session = {
  targetEvidenceImage: {
    dataUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
    evidenceRole: "shooter-facing-target-artwork",
    imageWidthPx: 1750,
    imageHeightPx: 2300
  }
};
assert.deepEqual(Array.from(runtime.missedTapNumbers(result)), [2], "a reordered Backend response identifies shot #2 as the miss, not array slot #5");
const evidence = runtime.vaultEvidenceModel(session, result);
assert.equal(evidence.markers[1].label, "2", "the missed marker keeps the original observation number");
assert.equal(evidence.markers[1].isMiss, true, "shot #2 is presented as the miss by stable identity");
assert.equal(evidence.markers[4].label, "5", "the bullseye marker keeps observation number #5");
assert.equal(evidence.markers[4].isMiss, false, "shot #5 remains a hit despite being classification array slot #4");
assert.equal(evidence.markers[4].xPercent, 50, "shot #5 projection remains at its preserved horizontal coordinate");
assert.equal(evidence.markers[4].yPercent, 50, "shot #5 projection remains at its preserved vertical coordinate");

const manifestPath = path.join(docs, "tst12_presentation_identity.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.presentationIdentity, identity, "manifest names the approved presentation identity");
  assert.equal(manifest.stationResultsIdentity, stationIdentity, "manifest names the approved Simulator PiP station identity");
  for (const [relative, expected] of Object.entries(manifest.assets)) {
    const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(docs, relative))).digest("hex");
    assert.equal(actual, expected, `${relative} matches the approved local SHA-256 identity`);
  }
}

console.log("PASS TST-12 delivery contract and observation-identity regression");
