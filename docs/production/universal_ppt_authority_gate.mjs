import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const read = path => readFile(path, "utf8");
const [runtimeSource, registrySource, executorSource, preservedSource, tst12Source, tst12ExperienceSource, bakerAuthoritySource, bakerSecSource, vaultSource] = await Promise.all([
  read("target_execution_runtime.js"),
  read("usm_proof_registry.js"),
  read("backend/executors/declarative_target_score.py"),
  read("backend/preserved_sec_store.py"),
  read("tst12_station_results.js"),
  read("tst12_universal_experience.js"),
  read("backend/baker_fun_target_authority.py"),
  read("baker_fun_sec.js"),
  read("records.html")
]);

assert.match(executorSource, /"pointsPerTap": points_per_tap/);
assert.doesNotMatch(executorSource, /"hitRate"\s*:/);
assert.match(preservedSource, /legacy_read_only_projection/);
assert.doesNotMatch(runtimeSource, /SCZN3 Hit Rate|>HIT RATE<|label: "Hit Rate"/i);
assert.match(runtimeSource, /TOTAL POINTS <i>\|<\/i> TOTAL TAPS <i>\|<\/i> POINTS PER TAP/);
assert.match(runtimeSource, /value\.toFixed\(2\)/);
assert.match(runtimeSource, /Official Hit Factor withheld/);
assert.match(tst12Source, /<b>POINTS PER TAP<\/b>/);
assert.doesNotMatch(tst12Source, /<b>(?:SESSION )?PPT<\/b>/);
assert.doesNotMatch(tst12ExperienceSource, /retiredStationPerformanceMarkup|data-tst12-retired-renderer/);
assert.doesNotMatch(vaultSource, /retiredTst12VaultStationDetails|data-tst12-retired-renderer/);
assert.doesNotMatch(bakerAuthoritySource, /hitRatePercent/);
assert.match(bakerSecSource, /POINTS PER TAP/);
assert.match(vaultSource, /class="vault-ppt-card"><span>TOTAL POINTS/);
assert.match(vaultSource, /class="vault-ppt-card"><span>TOTAL TAPS/);
assert.match(vaultSource, /class="vault-ppt-card"><span>POINTS PER TAP/);

const window = { location: { hostname: "127.0.0.1", search: "" } };
const document = { readyState: "loading", documentElement: { dataset: {} }, addEventListener() {} };
vm.runInNewContext(registrySource, { window });
vm.runInNewContext(runtimeSource, { URLSearchParams, Uint8Array, DataView, Math, Intl, Date, Object, Array, Number, String, Set, Map, document, window });
const runtime = window.SCZN3TargetExecutionRuntime;

function result(points, taps, ppt = points / taps) {
  const classifications = Array.from({ length: taps }, (_, index) => ({ observationId: `observation-${index + 1}`, countsAsHit: index < Math.max(0, taps - 2), regionId: index < Math.max(0, taps - 2) ? "five" : "outside" }));
  return {
    ok: true,
    status: "complete",
    missionFamily: "targetScoring",
    authoritySource: "backend-authoritative",
    target: { id: "ppt-gate", version: "2", publisher: { id: "sczn3", name: "SCZN3" }, product: { id: "ppt-product", name: "PPT Gate", sku: "PPT" } },
    executionContract: { contractId: "ppt-gate", contractVersion: "2", contractFingerprint: "f".repeat(64), executorId: "declarative-target-score", executorVersion: "1", secAdapterFamilyId: "a", secAdapterFamilyVersion: "1", preservationValidatorId: "p", preservationValidatorVersion: "1" },
    scoring: { model: "numeric_regions", status: "complete", total: points, observationCount: taps, actualHitCount: Math.max(0, taps - 2), outsideCount: 2, regionResults: [{ regionId: "five", label: "5", value: 5, hitCount: Math.max(0, taps - 2), points }] },
    sczn3Metrics: { status: "complete", pointsPerTap: ppt },
    classifications,
    aimStructure: { mode: "fixed" },
    reconciliation: { status: "reconciled", countsMatch: true, recordedObservationCount: taps }
  };
}

function session(id, packageResult) {
  return { sessionId: id, sessionLabel: `Session #${id}`, preservedAt: "2026-11-05T12:00:00Z", authorityPackage: packageResult };
}

const authoritative = result(178, 60);
const summary = runtime.vaultResultSummary(authoritative, session("029", authoritative));
assert.deepEqual({ ...summary.performanceMetrics }, { totalPoints: 178, totalTaps: 60, pointsPerTap: 178 / 60, pointsPerTapSource: "backend_authority", hits: 58, misses: 2 });

const series = runtime.usmHistorySeries([session("029", authoritative)], "ppt-gate");
assert.equal(series.length, 1);
assert.equal(series[0].pointsPerTap, 178 / 60);
const history = runtime.usmDrawerMarkup(series, "029");
assert.match(history, /TOTAL POINTS <i>\|<\/i> TOTAL TAPS <i>\|<\/i> POINTS PER TAP/);
assert.match(history, /POINTS PER TAP<\/span><strong>2\.97/);
assert.doesNotMatch(history, /HIT RATE/i);

const legacy = result(51, 6);
delete legacy.sczn3Metrics.pointsPerTap;
const legacyPoint = runtime.usmHistorySeries([session("legacy", legacy)], "ppt-gate")[0];
assert.equal(legacyPoint.pointsPerTap, 8.5);
assert.equal(legacyPoint.pointsPerTapSource, "legacy_read_only_projection");
assert.equal(legacy.sczn3Metrics.pointsPerTap, undefined, "legacy projection must never mutate the preserved artifact");

const zeroTap = result(0, 1, 0);
zeroTap.scoring.observationCount = 0;
zeroTap.sczn3Metrics.pointsPerTap = null;
assert.equal(runtime.usmHistorySeries([session("zero", zeroTap)], "ppt-gate").length, 0);

const negative = result(-10, 4, -2.5);
assert.equal(runtime.vaultResultSummary(negative, session("negative", negative)).performanceMetrics.pointsPerTap, -2.5);

const unsupported = result(0, 1, null);
unsupported.scoring = { model: "not_applicable", status: "not_applicable", observationCount: 1 };
unsupported.sczn3Metrics.pointsPerTap = null;
assert.equal(runtime.vaultResultSummary(unsupported, session("unsupported", unsupported)).performanceMetrics, null);

console.log("PASS universal PPT Authority gate: backend ownership, 2-decimal presentation, Vault cards, History graphs, legacy projection, zero-tap, negative, unsupported, TST-12, Baker Fun");
