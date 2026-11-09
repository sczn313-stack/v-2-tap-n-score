import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = await readFile(path.join(docs, "target_execution_runtime.js"), "utf8");

const startBoundary = runtime.slice(
  runtime.indexOf("async function start(options = {})"),
  runtime.indexOf("async function loadFile(")
);
const durableBoundary = runtime.slice(
  runtime.indexOf("async function ensureDurableSession("),
  runtime.indexOf("async function start(options = {})")
);
const tapStart = runtime.indexOf("async function capturePrecisionTap(");
const tapBoundary = runtime.slice(tapStart, runtime.indexOf('byId("contractUndoObservation")', tapStart));

assert.ok(startBoundary.includes('request("/api/session/prepare"'), "opening resolves governed preparation");
assert.ok(startBoundary.includes("prepared.interactionContract"), "prepared authority initializes governed interaction UI");
assert.ok(!startBoundary.includes('request("/api/session/start"'), "opening does not create a durable session");
assert.ok(!startBoundary.includes("createAuthoritativeSession("), "opening does not create browser session state");

assert.ok(durableBoundary.includes("state.sessionStartPromise"), "one shared in-flight creation owns concurrent observations");
assert.ok(durableBoundary.includes('request("/api/session/start"'), "durable boundary uses Backend session authority");
assert.ok(durableBoundary.includes("state.sessionIdempotencyKey"), "durable boundary uses the stable tab-scoped idempotency key");
assert.ok(durableBoundary.includes("createAuthoritativeSession(started"), "browser session derives from Backend-issued identity");

const ensureIndex = tapBoundary.indexOf('ensureDurableSession("first_valid_authoritative_observation")');
assert.ok(ensureIndex > tapBoundary.indexOf("if (!point)"), "out-of-target taps fail before durable creation");
assert.ok(ensureIndex > tapBoundary.indexOf("if (stationPolicy && !assignedStationRegion)"), "missing station fails before durable creation");
assert.ok(ensureIndex > tapBoundary.indexOf("if (objects.length && !state.selectedObjectId)"), "missing governed object fails before durable creation");
assert.ok(ensureIndex < tapBoundary.indexOf("state.observations.push"), "Backend identity exists before the first observation is admitted");

assert.match(runtime, /if \(!state\.session\) return;\s*persistSessionFacts\(\)/, "setup-only changes remain non-durable before the first observation");
assert.match(runtime, /hasUnsavedProgress\(\)[\s\S]*state\.session[\s\S]*state\.observations\.length/, "existing unsaved-session protection remains session scoped");

console.log("PASS universal target runtime defers durable session creation until the first governed persistence boundary");
