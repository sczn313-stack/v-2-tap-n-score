import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile("target_execution_runtime.js", "utf8");
const registrySource = await readFile("usm_proof_registry.js", "utf8");
const window = {
  location: { hostname: "127.0.0.1", search: "?authorityPort=8118" }
};
vm.runInNewContext(registrySource, { window });
const document = { readyState: "loading", addEventListener() {} };
vm.runInNewContext(source, { URLSearchParams, Uint8Array, DataView, Math, Intl, Date, Object, Array, Number, String, Set, Map, document, window });
const runtime = window.SCZN3TargetExecutionRuntime;

function session(number, taps, hits, score, preservedAt, targetId = "gunfun_22200_b27e_black") {
  return {
    sessionId: `session-${number}`,
    sessionLabel: `Session #${number}`,
    preservedAt,
    authorityPackage: {
      missionFamily: "targetScoring",
      target: {
        id: targetId,
        version: "1",
        publisher: { id: "gunfun", name: "GunFun" },
        product: { id: `product-${targetId}`, name: targetId === "gunfun_22200_b27e_black" ? "B27E Black" : "Other Target", sku: "22200" }
      },
      scoring: {
        model: "numeric_regions",
        status: "complete",
        observationCount: taps,
        total: score,
        regionResults: [{ regionId: "hit", hitCount: hits }]
      }
    }
  };
}

const sessions = [
  session("046", 6, 5, 42, "2026-09-20T10:00:00Z"),
  session("055", 6, 6, 51, "2026-09-21T10:00:00Z"),
  session("561", 12, 6, 56, "2026-09-22T10:00:00Z"),
  session("170", 17, 13, 122, "2026-09-23T10:00:00Z")
];

const series = runtime.usmHistorySeries(sessions, "gunfun_22200_b27e_black");
assert.deepEqual(Array.from(series, point => point.sessionLabel), ["Session #046", "Session #055", "Session #561", "Session #170"], "USM keeps one chronological B27E History across differing tap counts");
assert.deepEqual(Array.from(series, point => point.hitRate), [83.33, 100, 50, 76.47], "Hit Rate is hit taps divided by total taps across the complete series");
assert.deepEqual(Array.from(series, point => point.pointsPerTap), [7, 8.5, 4.7, 7.2], "Points per Tap is governed score divided by total taps and rounded to one decimal for display");

const markup055 = runtime.usmDrawerMarkup(series, "session-055");
assert.match(markup055, /3 · HISTORY/);
assert.match(markup055, /SCORE <i>\|<\/i> HIT RATE <i>\|<\/i> POINTS PER TAP/);
assert.match(markup055, /Score for 4 chronological preserved sessions/);
assert.match(markup055, /Hit Rate for 4 chronological preserved sessions/);
assert.match(markup055, /Points per Tap for 4 chronological preserved sessions/);
assert.match(markup055, /POINTS PER TAP<\/span><strong>8\.5/);
assert.match(markup055, /<strong>51<\/strong> points ÷ <strong>6<\/strong> taps = <strong>8\.5<\/strong>/);
assert.match(markup055, /HIT RATE<\/span><strong>100%/);
assert.match(markup055, /6 hits ÷ 6 taps = 100%/);
assert.match(markup055, /<strong>SESSION #055<\/strong><time[^>]*>09\/21\/26/);
assert.match(markup055, /#055[\s\S]*09\/21\/26/, "each chart point carries its individual numeric preserved date");
assert.match(markup055, /TAP ANY BULLET TO VIEW THAT SESSION/);
assert.match(markup055, /3 · HISTORY[\s\S]*DETAILS[\s\S]*B27E Black/);
assert.match(markup055, /data-usm-metric-trigger="score"[\s\S]*data-usm-metric-panel="score" hidden[\s\S]*SCORING DISTRIBUTION/, "History keeps the first surface compact and places scoring distribution behind the Score drawer");
assert.doesNotMatch(markup055, /Actual governed target score|Governed score ÷ total taps/, "machine language is absent from the shooter-facing History presentation");
assert.doesNotMatch(markup055, /6-TAP SESSIONS|12-TAP SESSIONS|NORMALIZED|PUBLISHER RULE/i, "tap count is session data, not the identity of History or a manufactured scoring label");

const markup561 = runtime.usmDrawerMarkup(series, "session-561");
assert.match(markup561, /POINTS PER TAP<\/span><strong>4\.7/);
assert.match(markup561, /<strong>SESSION #561<\/strong><time[^>]*>09\/22\/26/);
assert.match(markup561, /<strong>56<\/strong> points ÷ <strong>12<\/strong> taps ≈ <strong>4\.7<\/strong>/);
assert.match(markup561, /HIT RATE<\/span><strong>50%/);
assert.match(markup561, /6 hits ÷ 12 taps = 50%/);

const otherTargetSessions = [session("201", 8, 6, 61, "2026-09-24T10:00:00Z", "another_target")];
assert.equal(runtime.usmHistorySeries(otherTargetSessions, "another_target").length, 1, "USM inherits by governed additive scoring capability rather than target identity");
assert.equal(window.SCZN3USMProofRegistry.isEligible({ missionFamily: "targetScoring", scoring: { model: "counts_only", status: "complete", total: 6, observationCount: 8 } }), false, "counts-only targets do not inherit additive-score USM");
assert.equal(window.SCZN3USMProofRegistry.isEligible({ missionFamily: "targetScoring", scoring: { model: "penalty_regions", status: "complete", total: 6, observationCount: 8 } }), false, "penalty scoring does not inherit without separate eligibility review");
assert.equal(window.SCZN3USMProofRegistry.isEligible({ missionFamily: "targetScoring", scoring: { model: "numeric_regions", status: "withheld", total: 6, observationCount: 8 } }), false, "withheld scoring cannot inherit USM");
assert.equal(runtime.usmDrawerMarkup([], "session-055"), "", "History is withheld when no eligible preserved scoring records exist");

console.log("PASS B27E Universal Scoring Model: Score / Hit Rate / Points per Tap");
