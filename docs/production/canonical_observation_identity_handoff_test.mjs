import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

class SaturatedStorage {
  constructor() {
    this.values = new Map();
    this.saturated = false;
  }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) {
    if (this.saturated) {
      const error = new Error("The quota has been exceeded.");
      error.name = "QuotaExceededError";
      throw error;
    }
    this.values.set(String(key), String(value));
  }
  removeItem(key) { this.values.delete(String(key)); }
}

class TestCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
}

const requestedTargetProfileId = "baker_tst12_17_5x23";
const historicalMatrix = {
  targetProfileId: requestedTargetProfileId,
  target_profile_id: requestedTargetProfileId,
  targetId: "FOUNDER-TST12-UGO-SCORING-AUTHORITY-2026-10-21",
  targetName: "TST-12 17.5 x 23",
  targetFamily: "Baker 100 Yard Smart Target",
  targetVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
  missionFamily: "targetScoring",
  experienceMode: "simulation"
};

const localStorage = new SaturatedStorage();
localStorage.setItem("SCZN3_ACTIVE_MATRIX", JSON.stringify(historicalMatrix));
localStorage.setItem("SCZN3_EXISTING_HISTORY_SENTINEL", JSON.stringify({ preserved: true }));
const before = [...localStorage.values.entries()];
const events = [];
const document = {
  documentElement: { dataset: {}, setAttribute() {} },
  readyState: "complete",
  querySelector() { return null; }
};
const window = {
  CustomEvent: TestCustomEvent,
  dispatchEvent(event) { events.push(event); return true; },
  location: { href: "https://tap-n-score.com/target-experience.html", search: "", hostname: "tap-n-score.com", port: "" },
  document,
  localStorage,
  console
};
window.window = window;

const context = {
  window,
  document,
  localStorage,
  TextEncoder,
  URL,
  URLSearchParams,
  Uint8Array,
  Uint32Array,
  DataView,
  Math,
  console: { ...console, error() {}, warn() {}, info() {} }
};

vm.runInNewContext(await readFile("platform_contracts.js", "utf8"), context, { filename: "platform_contracts.js" });
vm.runInNewContext(await readFile("app_state.js", "utf8"), context, { filename: "app_state.js" });
vm.runInNewContext(await readFile("target_execution_runtime.js", "utf8"), context, { filename: "target_execution_runtime.js" });

localStorage.saturated = true;
const authorityPackage = {
  ok: true,
  authoritativeSessionId: "identity-handoff-session-001",
  sessionLifecycle: "created",
  sessionMode: "simulation",
  target: {
    targetId: requestedTargetProfileId,
    targetAuthorityId: "FOUNDER-TST12-UGO-SCORING-AUTHORITY-2026-10-21",
    targetName: "TST-12 17.5 x 23",
    targetProfileVersion: "1",
    atpId: "ATP_BAKER_TST12_17_5X23_V1"
  },
  missionIdentity: { missionFamily: "targetScoring", missionId: "tst12-score", resultPackageType: "targetScoreResult" },
  governedDistance: { value: 10, unit: "YDS", locked: false },
  selectedEquipment: { source: "shooter-selected", weaponCategory: "Rifle", modelCaliber: ".223" }
};

const session = window.SCZN3M4.createAuthoritativeSession(authorityPackage, window.SCZN3M4.getActiveMatrix());
const runtime = window.SCZN3TargetExecutionRuntime;
const admitted = runtime.backendAdmittedObservationTargetProfileId(session, requestedTargetProfileId);
assert.equal(admitted, requestedTargetProfileId, "the immutable Backend-admitted profile owns observation identity");
assert.notEqual(session.matrixSnapshot.targetId, admitted, "the fixture retains the historical authority-id vocabulary alongside the canonical profile");

const observation = runtime.canonicalSourceImagePoint({ xNorm: 0.5, yNorm: 0.25 }, {
  targetProfileId: admitted,
  sourceImageSha256: "a".repeat(64),
  sourceImageWidthPx: 1750,
  sourceImageHeightPx: 2300
});
assert.equal(observation.canonicalTargetCoordinate.targetProfileId, requestedTargetProfileId);
assert.deepEqual([...localStorage.values.entries()], before, "saturated storage and historical records remain unchanged");
assert.ok(events.some(event => event.type === "sczn3:browser-storage-unavailable"), "the saturated-storage path was exercised");

assert.throws(
  () => runtime.backendAdmittedObservationTargetProfileId(session, "baker_tst12_23x35"),
  /backend_admitted_target_identity_mismatch/,
  "a requested/admitted identity disagreement fails closed"
);
assert.throws(
  () => runtime.backendAdmittedObservationTargetProfileId({ backendSessionAuthority: {} }, requestedTargetProfileId),
  /backend_admitted_target_identity_unavailable/,
  "a missing Backend identity fails closed"
);

const source = await readFile("target_execution_runtime.js", "utf8");
const ensureIndex = source.indexOf('await ensureDurableSession("first_valid_authoritative_observation")');
const authorityIndex = source.indexOf("backendAdmittedObservationTargetProfileId(state.session, targetId)", ensureIndex);
const canonicalIndex = source.indexOf("canonicalSourceImagePoint(normalizedPoint", authorityIndex);
assert.ok(ensureIndex > 0 && authorityIndex > ensureIndex && canonicalIndex > authorityIndex, "durable session and identity validation precede canonical observation construction");
assert.doesNotMatch(source, /state\.session\s*&&\s*state\.session\.matrixSnapshot\s*&&\s*state\.session\.matrixSnapshot\.targetProfileId\)\s*\|\|\s*targetId/, "mutable matrixSnapshot is no longer an observation identity source");

console.log(JSON.stringify({
  verdict: "PASS",
  fixture: "founder-mixed-historical-identity-plus-saturated-storage",
  admittedTargetProfileId: admitted,
  canonicalObservationTargetProfileId: observation.canonicalTargetCoordinate.targetProfileId,
  historicalStorageUnchanged: true,
  mismatchBehavior: "fail_closed"
}, null, 2));
