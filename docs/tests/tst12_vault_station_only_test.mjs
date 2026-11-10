import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const records = fs.readFileSync(path.join(docs, "records.html"), "utf8");
const runtime = fs.readFileSync(path.join(docs, "target_execution_runtime.js"), "utf8");
const stationResultsSource = fs.readFileSync(path.join(docs, "tst12_station_results.js"), "utf8");
const founderSessions = JSON.parse(fs.readFileSync("/private/tmp/tst12-session-census-readonly.json", "utf8"));
const serverSessions = JSON.parse(fs.readFileSync("/private/tmp/sczn3-8221-current-sessions.json", "utf8"));
const allSessions = [
  ...(Array.isArray(founderSessions) ? founderSessions : founderSessions.sessions || []),
  ...(Array.isArray(serverSessions) ? serverSessions : serverSessions.sessions || [])
];
const uniqueSessions = [...new Map(allSessions.map(session => [session.sessionId, session])).values()];
const fixtures = [
  uniqueSessions.find(session => {
    const scoring = session?.authorityPackage?.scoring || {};
    return session?.authorityPackage?.target?.id === "baker_tst12_17_5x23"
      && Number(scoring.total) === 128 && Number(scoring.observationCount) === 60;
  }),
  uniqueSessions.find(session => session?.authorityPackage?.target?.id === "baker_tst12_23x35" && Number(session.authorityPackage?.scoring?.observationCount) === 60)
];

assert.ok(fixtures[0], "a preserved 17.5 x 23 TST-12 Backend result is available for the Vault renderer regression");
assert.ok(fixtures[1], "a preserved 23 x 35 TST-12 Backend result is available for the Vault renderer regression");
const partialFixture = uniqueSessions.find(session => {
  const scoring = session?.authorityPackage?.scoring || {};
  return session?.authorityPackage?.target?.id === "baker_tst12_17_5x23"
    && Number(scoring.total) === 48 && Number(scoring.observationCount) === 22;
});
assert.ok(partialFixture, "a preserved partial TST-12 result with a selected miss is available for Vault reconciliation");

assert.match(
  records,
  /CONTRACT_PRECISION_OPEN_SCORE, SCZN3SECDispatch\.ADAPTERS\.CONTRACT_TARGET_SCORING, SCZN3SECDispatch\.ADAPTERS\.CONTRACT_RECREATIONAL_CHALLENGE/,
  "Vault can create the compact authoritative result summary for target-scoring sessions"
);
assert.match(
  records,
  /const useTst12StationPresentation = tst12 && Boolean\(stationDetails\) && Boolean\(resultSummary\);/,
  "Vault only suppresses the generic result when both TST-12 replacements are valid"
);
assert.match(
  records,
  /: useTst12StationPresentation\s+\? vaultResultSummaryPanel\(resultSummary\)\s+: approvedResult/s,
  "Vault chooses the summary instead of the generic contract component for a valid TST-12 station ledger"
);
assert.match(runtime, /title: "Scoring Distribution"/, "the generic approved result component contains the distribution that must not be selected for TST-12 Vault records");

const escapeHtml = value => String(value ?? "").replace(/[&<>\"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const stationResultsContext = { window: {} };
vm.runInNewContext(stationResultsSource, stationResultsContext, { filename: "tst12_station_results.js" });
const tst12VaultStationDetails = session => stationResultsContext.window.SCZN3Tst12StationResults.render(session.authorityPackage);

for (const session of fixtures) {
  const result = session.authorityPackage;
  const markup = tst12VaultStationDetails(session);
  const stationTotal = result.scoring.stationBestFive.reduce((total, station) => total + Number(station.bestFiveScore), 0);
  assert.equal(stationTotal, Number(result.scoring.total), `${result.target.id}: preserved Backend station totals reconcile to the target score`);
  assert.equal((markup.match(/data-tst12-station="/g) || []).length, 12, `${result.target.id}: records-side renderer includes exactly twelve station ledgers`);
  assert.match(markup, /SELECTED FOR SCORING/, `${result.target.id}: ledger retains the selected-for-scoring distinction`);
  assert.match(markup, /Ring 1/, `${result.target.id}: ledger retains authoritative region rows`);
  assert.match(markup, /VALUE &amp; REGION/, `${result.target.id}: approved three-column heading renders`);
  assert.match(markup, /class="tst12-station-total"/, `${result.target.id}: selected-tap total row renders`);
  assert.match(markup, /TOTAL STATION RESULTS/, `${result.target.id}: aggregate ledger has the approved heading`);
  assert.match(markup, /class="tst12-condition-separator"[^>]*>—<\/span>/, `${result.target.id}: eye and hand abbreviations are visibly separated from descriptions`);
  const aggregateAccounting = markup.match(/<div class="tst12-session-accounting"[^>]*>([\s\S]*?)<\/div><p>/)?.[1] || "";
  assert.equal((aggregateAccounting.match(/<div><span>(?:TOTAL TAPS|HITS|MISSES|SELECTED FOR SCORING)<\/span>/g) || []).length, 4, `${result.target.id}: four standard aggregate accounting metrics are independently separated`);
  assert.match(aggregateAccounting, /<div class="is-additional"><span>ADDITIONAL OBSERVATIONS<\/span>/, `${result.target.id}: the fifth aggregate accounting metric is independently separated`);
  assert.match(markup, /0 – Miss/, `${result.target.id}: selected misses have one governed zero-point row`);
  assert.match(markup, /POINTS PER TAP<\/b><strong>/, `${result.target.id}: station PPT uses preserved Backend totals and observations`);
  assert.match(markup, /Crosshairs/, `${result.target.id}: ledger retains the authoritative crosshair row`);
  assert.doesNotMatch(markup, /Scoring Distribution/, `${result.target.id}: records-side ledger does not recreate the retired flat distribution`);
}
const partialMarkup = tst12VaultStationDetails(partialFixture);
assert.equal((partialMarkup.match(/data-tst12-station=/g) || []).length, 3, "Vault renders only the three attempted stations");
assert.match(partialMarkup, /STATIONS ATTEMPTED: 3 OF 12/, "Vault preserves the attempted-station summary");
assert.match(partialMarkup, /0 – Miss<\/th><td>1<\/td><td>0<\/td>/, "Vault retains its selected miss exactly once in the ledger");

const missOnlyVaultResult = structuredClone(partialFixture.authorityPackage);
missOnlyVaultResult.classifications = [{
  observationId: "stable-station-07-miss",
  assignedStationRegionId: "station_07_square",
  regionId: "outside",
  countsAsHit: false,
  value: 0,
  creditedForScore: true
}];
missOnlyVaultResult.scoring = {
  ...missOnlyVaultResult.scoring,
  total: 0,
  observationCount: 1,
  creditedObservationCount: 1,
  additionalObservationCount: 0,
  actualHitCount: 0,
  actualMissCount: 1,
  regionResults: [],
  stationBestFive: Array.from({ length: 12 }, (_, index) => ({
    stationRegionId: `station_${String(index + 1).padStart(2, "0")}_square`,
    totalObservations: index === 6 ? 1 : 0,
    creditedObservations: index === 6 ? 1 : 0,
    additionalObservations: 0,
    actualHits: 0,
    actualMisses: index === 6 ? 1 : 0,
    bestFiveScore: 0,
    creditedObservationIds: index === 6 ? ["stable-station-07-miss"] : []
  }))
};
const missOnlyVaultMarkup = tst12VaultStationDetails({ authorityPackage: missOnlyVaultResult });
assert.equal((missOnlyVaultMarkup.match(/data-tst12-station=/g) || []).length, 1, "Vault renders one card for a Station 7 miss-only attempt");
assert.match(missOnlyVaultMarkup, /STATION 7</, "Vault does not lose Station 7 because its only observation is a miss");
assert.match(missOnlyVaultMarkup, /TOTAL TAPS<\/span><strong>1<\/strong>[\s\S]*MISSES<\/span><strong>1<\/strong>/, "Vault retains Station 7 miss-only accounting");

const vaultStart = records.indexOf("function isTst12VaultSession(session, pkg) {");
const vaultEnd = records.indexOf("\nfunction readVaultReturnState()", vaultStart);
assert.ok(vaultStart >= 0 && vaultEnd > vaultStart, "records owns a bounded compact Vault record renderer");
const genericResult = "<details>Scoring Distribution</details>";
const compactSummary = { status: "complete", primaryValue: "128", primaryUnit: "POINTS", objectiveLabel: "TARGET SCORE", breakdown: [{ label: "Observations", value: "60" }], evidenceLabel: "60 observations preserved" };
const renderCompactVaultRecord = new Function(
  "window", "authorityPackage", "resolveVaultResultSummary", "resolvePreservedApprovedResult", "resolveLowestScoreWinsVaultModel", "resolveVaultEvidenceModel", "isBaker100YardZeroingSession", "vaultSessionNumber", "vaultDateTimeAttribute", "cleanVaultDate", "vaultTargetPanel", "authorityVisualForPackage", "historicalSecUrl", "shootingSessionDisplayLabel", "escapeHtml",
  `const SCZN3SECDispatch = window.SCZN3SECDispatch; ${records.slice(vaultStart, vaultEnd)}; return renderCompactVaultRecord;`
)(
  {
    SCZN3SECDispatch: {
      ADAPTERS: {
        BAKER_SL_ST1: "baker-st1", GUNFUN_VITAL_DUDE: "vital", BAKER_SL_ST2_IDPA: "baker-st2", BAKER_GF_DB_POINTS: "baker-points", BAKER_GF_DB_NUMBERS: "baker-numbers", BAKER_GF_BP: "baker-bp", EZ2C_DOT_TORTURE: "ez2c", BAKER_GF_BB_C: "baker-bbc", GSSF: "gssf", CONTRACT_TARGET_SCORING: "target-scoring"
      },
      resolve: () => ({ adapter: "target-scoring" })
    },
    SCZN3SECComponents: { LowestScoreWinsPanel: () => "<div>LOWEST SCORE</div>" }
  },
  session => session.authorityPackage,
  () => compactSummary,
  () => genericResult,
  () => null,
  () => null,
  () => false,
  session => session.sessionNumber || "0",
  () => "",
  () => "",
  () => "<div>target evidence</div>",
  () => "",
  () => "target-experience.html?session=preserved",
  (session, fallback) => session.sessionLabel || fallback,
  escapeHtml
);
for (const session of fixtures) {
  const markup = renderCompactVaultRecord(session);
  assert.match(markup, /Station Results/, `${session.authorityPackage.target.id}: compact Vault record includes the governed station ledger`);
  assert.match(markup, /<strong>128<\/strong><span>POINTS<\/span>/, `${session.authorityPackage.target.id}: compact Vault record preserves the result summary`);
  assert.doesNotMatch(markup, /Scoring Distribution/, `${session.authorityPackage.target.id}: compact Vault record omits the generic distribution`);
  assert.doesNotMatch(markup, /GENERIC DISTRIBUTION/, `${session.authorityPackage.target.id}: compact Vault record does not retain the generic component`);
}
const nonTstSession = structuredClone(fixtures[0]);
nonTstSession.authorityPackage.target.id = "another_governed_target";
const nonTstMarkup = renderCompactVaultRecord(nonTstSession);
assert.match(nonTstMarkup, /Scoring Distribution/, "other target-scoring Vault records retain their generic distribution");

console.log("PASS TST-12 Vault station-only presentation with preserved Backend sessions");
