import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeSource = fs.readFileSync(path.join(docs, "target_execution_runtime.js"), "utf8");
const adapterSource = fs.readFileSync(path.join(docs, "tst12_universal_experience.js"), "utf8");
const stationResultsSource = fs.readFileSync(path.join(docs, "tst12_station_results.js"), "utf8");
const founderSessions = JSON.parse(fs.readFileSync("/private/tmp/tst12-session-census-readonly.json", "utf8"));
const fixture17 = (Array.isArray(founderSessions) ? founderSessions : founderSessions.sessions || [])
  .find(session => {
    const scoring = session?.authorityPackage?.scoring || {};
    return session?.authorityPackage?.target?.id === "baker_tst12_17_5x23"
      && Number(scoring.total) === 128 && Number(scoring.observationCount) === 60
      && Number(scoring.actualHitCount) === 40 && Number(scoring.actualMissCount) === 20;
  });
assert.ok(fixture17, "the Founder 128-point TST-12 result is available read-only for this regression");
const fixture23 = JSON.parse(fs.readFileSync("/private/tmp/sczn3-8221-current-sessions.json", "utf8")).sessions
  .find(session => session?.authorityPackage?.target?.id === "baker_tst12_23x35" && session.authorityPackage?.scoring?.observationCount === 60);
assert.ok(fixture23, "a preserved 23 x 35 Backend result is available for the handoff regression");
const partialFixture = (Array.isArray(founderSessions) ? founderSessions : founderSessions.sessions || [])
  .find(session => {
    const scoring = session?.authorityPackage?.scoring || {};
    return session?.authorityPackage?.target?.id === "baker_tst12_17_5x23"
      && Number(scoring.total) === 48 && Number(scoring.observationCount) === 22;
  });
assert.ok(partialFixture, "a preserved partial TST-12 result with a selected miss is available for filtering and reconciliation");

// Execute the production post-render helper with a real preserved TST-12
// authority package.  The helper is intentionally private to initializePage,
// so this extracts only that already-authored function and supplies its real
// lifecycle dependencies.
const start = runtimeSource.indexOf("    function renderResultSEC(");
const end = runtimeSource.indexOf("\n    async function showResult", start);
assert.ok(start >= 0 && end > start, "runtime owns a bounded result-render helper");
const helperSource = runtimeSource.slice(start, end);
const stationResultsContext = { window: {} };
vm.runInNewContext(stationResultsSource, stationResultsContext, { filename: "tst12_station_results.js" });
const stationPerformanceMarkup = stationResultsContext.window.SCZN3Tst12StationResults.render;
for (const session of [fixture17, fixture23]) {
  const result = session.authorityPackage;
  const ledgerMarkup = stationPerformanceMarkup(result);
  const backendStationTotal = result.scoring.stationBestFive.reduce((total, station) => total + Number(station.bestFiveScore), 0);
  assert.equal(backendStationTotal, Number(result.scoring.total), `${result.target.id}: Backend station totals reconcile to the target score`);
  assert.equal((ledgerMarkup.match(/data-tst12-station-card=/g) || []).length, 12, `${result.target.id}: shared adapter markup includes all twelve stations`);
  assert.match(ledgerMarkup, /Ring 1/, `${result.target.id}: actual adapter markup retains governed ring rows`);
  assert.match(ledgerMarkup, /VALUE &amp; REGION/, `${result.target.id}: approved three-column heading renders`);
  assert.match(ledgerMarkup, /class="tst12-station-total"/, `${result.target.id}: selected-tap total row renders`);
  assert.match(ledgerMarkup, /0 – Miss/, `${result.target.id}: selected misses have one governed zero-point row`);
  assert.match(ledgerMarkup, /STATIONS ATTEMPTED:/, `${result.target.id}: compact summary identifies attempted stations`);
  assert.match(ledgerMarkup, /TOTAL STATION RESULTS/, `${result.target.id}: aggregate station accounting has its approved heading`);
  assert.match(ledgerMarkup, /tst12-condition-separator[^>]*[^>]*>—</, `${result.target.id}: eye and hand abbreviations are visibly separated from their descriptions`);
  assert.match(ledgerMarkup, /Crosshairs/, `${result.target.id}: actual adapter markup retains the governed crosshair row`);
  assert.doesNotMatch(ledgerMarkup, /Scoring Distribution/, `${result.target.id}: actual adapter markup never creates the retired flat distribution`);
  for (const station of result.scoring.stationBestFive) {
    const canonicalPrefix = String(station.stationRegionId).replace(/_square$/, "");
    const selectedRegionTaps = result.scoring.regionResults
      .filter(region => String(region.regionId).startsWith(canonicalPrefix))
      .reduce((total, region) => total + Number(region.countedHitCount || 0), 0);
    const selectedMisses = result.classifications
      .filter(item => item.assignedStationRegionId === station.stationRegionId && item.creditedForScore === true && item.countsAsHit === false)
      .length;
    assert.equal(selectedRegionTaps + selectedMisses, Number(station.creditedObservations), `${result.target.id} ${station.stationRegionId}: selected regions plus selected misses reconcile to the Backend selection`);
  }
  if (Number(result.scoring.total) === 128) {
    assert.match(ledgerMarkup, /STATION 1/, "Founder 128-point run: station identity remains visible");
    assert.match(ledgerMarkup, /POINTS PER TAP<\/b><strong>4\.00/, "Founder 128-point run: station PPT uses official points divided by recorded taps");
    assert.match(ledgerMarkup, /4 – Red circle<\/th><td>3<\/td><td>12<\/td>/, "Founder 128-point run: station 1 maps red-center authority into the ledger");
    assert.match(ledgerMarkup, /5 – Crosshairs<\/th><td>1<\/td><td>5<\/td>/, "Founder 128-point run: station 1 maps crosshair authority into the ledger");
    assert.match(ledgerMarkup, /POINTS PER TAP<\/b><strong>2\.13/, "Founder 128-point run: session PPT uses aggregate points divided by aggregate taps");
  }
  const root = { innerHTML: "", id: "contractSecRoot" };
  const dispatched = [];
  const adapterCalls = [];
  const context = {
    state: { session },
    targetId: result.target.id,
    missionFamily: "targetScoring",
    experienceMode: "simulation",
    byId: id => id === "contractSecRoot" ? root : null,
    canonicalResult: current => current.authorityPackage,
    renderSEC: input => `<details class="contract-numeric-region-results">legacy flat distribution for ${input.package.scoring.total}</details>`,
    initializeSECInteractions: () => {},
    installSimulatorReentry: () => {},
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } },
    document: { dispatchEvent: event => dispatched.push(event) },
    global: {
      SCZN3Tst12ResultPresentation: {
        applyResultPresentation: detail => {
          adapterCalls.push(detail);
          root.innerHTML = `<details class="tst12-station-performance">Station Results for ${detail.result.scoring.total}</details>`;
          return true;
        }
      }
    }
  };
  vm.runInNewContext(`${helperSource}\nthis.renderResultSECForTest = renderResultSEC;`, context, { filename: "target_execution_runtime.js" });
  context.renderResultSECForTest({ session, result });

  assert.equal(adapterCalls.length, 1, `${result.target.id}: runtime invokes the TST-12 presentation owner synchronously after generic SEC markup`);
  assert.equal(adapterCalls[0].result, result, `${result.target.id}: handoff retains the exact Backend authority package`);
  assert.equal(adapterCalls[0].targetId, result.target.id, `${result.target.id}: handoff retains the page target identity`);
  assert.match(root.innerHTML, /Station Results/, `${result.target.id}: adapter replacement completes after the generic renderer`);
  assert.doesNotMatch(root.innerHTML, /legacy flat distribution/, `${result.target.id}: the generic flat distribution cannot survive a successful TST-12 handoff`);
  assert.equal(dispatched.length, 1, `${result.target.id}: post-render lifecycle notification remains available to existing consumers`);
  assert.equal(dispatched[0].type, "sczn3:target-result-rendered");
  assert.equal(dispatched[0].detail.presentationApplied, true, `${result.target.id}: event records successful replacement without rerunning it`);
}

const partialMarkup = stationPerformanceMarkup(partialFixture.authorityPackage);
assert.equal((partialMarkup.match(/data-tst12-station-card=/g) || []).length, 3, "partial result renders only its three attempted station cards");
assert.match(partialMarkup, /STATION 1/, "partial result preserves Station 1 identity");
assert.match(partialMarkup, /STATION 2/, "partial result preserves Station 2 identity");
assert.match(partialMarkup, /STATION 3/, "partial result preserves Station 3 identity");
assert.doesNotMatch(partialMarkup, /STATION 4/, "partial result does not render an empty Station 4 card");
assert.match(partialMarkup, /STATIONS ATTEMPTED: 3 OF 12/, "partial result displays the authoritative attempted-station count");
assert.match(partialMarkup, /0 – Miss<\/th><td>1<\/td><td>0<\/td>/, "partial result maps its selected miss into the single Miss row");

const twoStationResult = structuredClone(partialFixture.authorityPackage);
const firstTwoStations = new Set(["station_01_square", "station_02_square"]);
twoStationResult.classifications = twoStationResult.classifications.filter(item => firstTwoStations.has(item.assignedStationRegionId));
twoStationResult.scoring.stationBestFive = twoStationResult.scoring.stationBestFive.filter(item => firstTwoStations.has(item.stationRegionId));
twoStationResult.scoring.regionResults = twoStationResult.scoring.regionResults.filter(item => /^station_0[12]_/.test(item.regionId));
const twoStationMarkup = stationPerformanceMarkup(twoStationResult);
assert.equal((twoStationMarkup.match(/data-tst12-station-card=/g) || []).length, 2, "two attempted stations render exactly two station cards");
assert.match(twoStationMarkup, /STATIONS ATTEMPTED: 2 OF 12/, "two attempted stations retain their canonical identities and count");
const emptyResult = structuredClone(twoStationResult);
emptyResult.classifications = [];
emptyResult.scoring.stationBestFive = [];
emptyResult.scoring.regionResults = [];
emptyResult.scoring.total = 0;
const emptyMarkup = stationPerformanceMarkup(emptyResult);
assert.equal((emptyMarkup.match(/data-tst12-station-card=/g) || []).length, 0, "zero attempted stations render no empty station cards");
assert.match(emptyMarkup, /No stations attempted yet/, "zero attempted stations receive the scoped empty state");

const missLedger = station => ({
  stationRegionId: `station_${String(station).padStart(2, "0")}_square`,
  totalObservations: 1,
  creditedObservations: 1,
  additionalObservations: 0,
  actualHits: 0,
  actualMisses: 1,
  bestFiveScore: 0,
  creditedObservationIds: [`stable-miss-${station}`]
});
const allMissStationsResult = {
  target: { id: "baker_tst12_17_5x23" },
  classifications: Array.from({ length: 12 }, (_, index) => ({
    observationId: `stable-miss-${index + 1}`,
    assignedStationRegionId: `station_${String(index + 1).padStart(2, "0")}_square`,
    regionId: "outside",
    countsAsHit: false,
    value: 0,
    creditedForScore: true
  })),
  scoring: {
    total: 0,
    observationCount: 12,
    creditedObservationCount: 12,
    additionalObservationCount: 0,
    actualHitCount: 0,
    actualMissCount: 12,
    stationCreditPolicy: { mode: "best_scoring_observations_per_station" },
    stationBestFive: Array.from({ length: 12 }, (_, index) => missLedger(index + 1)),
    regionResults: []
  }
};
const allMissMarkup = stationPerformanceMarkup(allMissStationsResult);
assert.equal((allMissMarkup.match(/data-tst12-station-card=/g) || []).length, 12, "all twelve attempted miss-only stations remain present");
const stationPositions = Array.from({ length: 12 }, (_, index) => allMissMarkup.indexOf(`STATION ${index + 1}<`));
assert.ok(stationPositions.every(position => position >= 0), "every miss-only station has a visible card");
assert.ok(stationPositions.every((position, index) => index === 0 || position > stationPositions[index - 1]), "all twelve station cards remain in numerical order");
const stationSevenOnly = structuredClone(allMissStationsResult);
stationSevenOnly.classifications = stationSevenOnly.classifications.filter(item => item.assignedStationRegionId === "station_07_square");
stationSevenOnly.scoring.stationBestFive = stationSevenOnly.scoring.stationBestFive.map(item => item.stationRegionId === "station_07_square" ? item : { ...item, totalObservations: 0, creditedObservations: 0, actualMisses: 0, creditedObservationIds: [] });
stationSevenOnly.scoring.observationCount = 1;
stationSevenOnly.scoring.creditedObservationCount = 1;
stationSevenOnly.scoring.actualMissCount = 1;
const stationSevenOnlyMarkup = stationPerformanceMarkup(stationSevenOnly);
assert.equal((stationSevenOnlyMarkup.match(/data-tst12-station-card=/g) || []).length, 1, "a Station 7 miss-only attempt renders one station card");
assert.match(stationSevenOnlyMarkup, /STATION 7</, "a miss classification never removes Station 7 from Result Station Results");
assert.match(stationSevenOnlyMarkup, /TOTAL TAPS<\/span><strong>1<\/strong>[\s\S]*MISSES<\/span><strong>1<\/strong>/, "Station 7 miss-only accounting remains authoritative");

assert.match(adapterSource, /global\.SCZN3Tst12ResultPresentation = Object\.freeze\(\{ TST12_PRESENTATION_ID, targetId, applyResultPresentation \}\)/, "adapter registers the production presentation owner and its executable identity");
assert.match(adapterSource, /document\.addEventListener\("sczn3:target-result-rendered"/, "event path remains as a fallback for later result renders");
assert.match(stationResultsSource, /scoring\.regionResults/, "the sole shared renderer uses Backend scored-region authority");
assert.match(stationResultsSource, /scoring\.stationBestFive/, "the sole shared renderer uses Backend best-five authority");
assert.doesNotMatch(adapterSource, /retiredStationPerformanceMarkup|data-tst12-retired-renderer/, "the retired duplicate live-result renderer cannot regain authority");
assert.match(adapterSource, /Select a station before recording a shot\./, "the target-local warning mirrors the existing observation guard wording exactly");
assert.match(adapterSource, /global\.setTimeout\(dismiss, 2500\)/, "the target-local warning dismisses after approximately 2.5 seconds");
console.log("PASS TST-12 generic render -> station results handoff with preserved Backend package");
