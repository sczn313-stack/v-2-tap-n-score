import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const runtimePath = path.resolve(here, "../target_execution_runtime.js");
const runtime = fs.readFileSync(runtimePath, "utf8");
const hooks = {};
const context = {
  document: {
    documentElement: { dataset: {} },
    readyState: "loading",
    addEventListener() {}
  },
  window: null
};
context.window = context;
context.__SCZN3_TEST_HOOKS__ = hooks;
vm.runInNewContext(runtime, context, { filename: runtimePath });

const createScheduler = hooks.createLatestOnlyPreviewScheduler;
assert.equal(typeof createScheduler, "function", "runtime exposes the production scheduler to the explicit offline test hook");

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((accept, decline) => { resolve = accept; reject = decline; });
  return { promise, resolve, reject };
};
const settle = () => new Promise(resolve => setImmediate(resolve));
const snapshot = count => Object.freeze({
  key: `snapshot-${count}`,
  sourceObservations: Object.freeze(Array.from({ length: count }, (_, index) => Object.freeze({
    observationId: `shot-${index + 1}`,
    xNorm: (index + 1) / 100,
    yNorm: (index + 2) / 100,
    assignedStationRegionId: `station_${String(Math.floor(index / 5) + 1).padStart(2, "0")}_square`
  })))
});

const calls = [];
const applied = [];
let inFlight = 0;
let maximumInFlight = 0;
const scheduler = createScheduler({
  execute(value) {
    const gate = deferred();
    calls.push({ value, gate });
    inFlight += 1;
    maximumInFlight = Math.max(maximumInFlight, inFlight);
    return gate.promise.finally(() => { inFlight -= 1; });
  },
  apply(value, result) {
    applied.push({ value, result });
  }
});

const snapshots = Array.from({ length: 60 }, (_, index) => snapshot(index + 1));
const legacyInFlight = [];
snapshots.forEach(value => legacyInFlight.push(value.key));
assert.equal(legacyInFlight.length, 60, "the retired start-every-preview behavior reproduces sixty overlapping calls when responses remain pending");
snapshots.forEach(value => scheduler.schedule(value));
assert.equal(calls.length, 1, "a burst starts only the first preview request");
assert.equal(calls[0].value.key, "snapshot-1");
assert.equal(maximumInFlight, 1);

calls[0].gate.resolve({ observationCount: 1 });
await settle();
assert.equal(calls.length, 2, "completion drains exactly one latest pending snapshot");
assert.equal(calls[1].value.key, "snapshot-60", "intermediate snapshots are coalesced to the newest observation package");
assert.equal(applied.length, 0, "the stale first response never overwrites the newest preview");
assert.equal(maximumInFlight, 1, "preview concurrency remains one while draining");

calls[1].gate.resolve({ observationCount: 60 });
await settle();
assert.equal(applied.length, 1);
assert.equal(applied[0].value.key, "snapshot-60");
assert.equal(applied[0].result.observationCount, 60);
assert.deepEqual(
  Array.from(applied[0].value.sourceObservations, item => item.observationId),
  Array.from({ length: 60 }, (_, index) => `shot-${index + 1}`),
  "all observation identities reach the latest preview unchanged"
);

for (let index = 0; index < 12; index += 1) scheduler.schedule(snapshots[59]);
assert.equal(calls.length, 2, "station-only repaints do not issue another Backend preview request");
assert.equal(maximumInFlight, 1);

const errorCalls = [];
const errors = [];
const errorScheduler = createScheduler({
  execute(value) {
    errorCalls.push(value.key);
    return value.key === "failed" ? Promise.reject(new Error("preview_unavailable")) : Promise.resolve({ key: value.key });
  },
  apply() {},
  onError(error, value) { errors.push({ message: error.message, key: value.key }); }
});
errorScheduler.schedule({ key: "failed" });
await settle();
assert.deepEqual(errors, [{ message: "preview_unavailable", key: "failed" }], "preview failure remains isolated and observable to its existing fail-safe owner");
errorScheduler.schedule({ key: "next" });
await settle();
assert.deepEqual(errorCalls, ["failed", "next"], "a failed preview does not block a later observation snapshot");

let cadenceInFlight = 0;
let cadenceMaximumInFlight = 0;
let cadenceRequestCount = 0;
let cadenceAppliedCount = 0;
const cadenceScheduler = createScheduler({
  async execute(value) {
    cadenceRequestCount += 1;
    cadenceInFlight += 1;
    cadenceMaximumInFlight = Math.max(cadenceMaximumInFlight, cadenceInFlight);
    await new Promise(resolve => setTimeout(resolve, 240));
    cadenceInFlight -= 1;
    return { observationCount: value.sourceObservations.length };
  },
  apply(value) { cadenceAppliedCount = value.sourceObservations.length; }
});
for (const value of snapshots) {
  cadenceScheduler.schedule(value);
  await new Promise(resolve => setTimeout(resolve, 60));
}
for (let attempt = 0; attempt < 50 && cadenceAppliedCount !== 60; attempt += 1) {
  await new Promise(resolve => setTimeout(resolve, 20));
}
assert.equal(cadenceMaximumInFlight, 1, "the real 60ms cadence never overlaps preview requests");
assert.equal(cadenceAppliedCount, 60, "the 60ms cadence eventually applies the complete latest observation snapshot");
assert.ok(cadenceRequestCount < 20, `60ms cadence is coalesced instead of starting sixty calls (actual ${cadenceRequestCount})`);

assert.match(runtime, /const tst12MarkerClassificationScheduler = createLatestOnlyPreviewScheduler/);
assert.match(runtime, /tst12MarkerClassificationScheduler\.schedule\(\{ key, sourceObservations, requestBody \}\)/);
assert.doesNotMatch(runtime, /tst12MarkerClassificationSequence/, "the request-starting sequence-counter path is retired");
assert.match(
  runtime,
  /async function showResult[\s\S]*?result = await request\("\/api\/target-execution", \{ method: "POST", timeoutMs: 45000/,
  "Show Results retains its independent awaited authoritative Backend request"
);

console.log(JSON.stringify({
  verdict: "PASS",
  retiredConcurrentRequestCount: legacyInFlight.length,
  simulatedObservationCadenceCount: 60,
  previewRequestCount: calls.length,
  maximumPreviewConcurrency: maximumInFlight,
  actualCadenceMilliseconds: 60,
  actualCadencePreviewRequestCount: cadenceRequestCount,
  actualCadenceMaximumConcurrency: cadenceMaximumInFlight,
  appliedSnapshot: applied[0].value.key,
  preservedObservationIdentities: applied[0].value.sourceObservations.length,
  stationOnlyRepaintRequests: 0,
  finalAuthorityRequest: "independent_and_awaited"
}, null, 2));
