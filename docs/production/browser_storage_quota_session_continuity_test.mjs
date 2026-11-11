import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

class SaturatedStorage {
  constructor() {
    this.values = new Map();
    this.saturated = false;
    this.failureName = "QuotaExceededError";
  }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) {
    if (this.saturated) {
      const error = new Error(this.failureName === "QuotaExceededError" ? "The quota has been exceeded." : "Storage access denied.");
      error.name = this.failureName;
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

const localStorage = new SaturatedStorage();
localStorage.setItem("SCZN3_EXISTING_HISTORY_SENTINEL", JSON.stringify({ preserved: true }));
const before = [...localStorage.values.entries()];
const events = [];
const window = {
  CustomEvent: TestCustomEvent,
  dispatchEvent(event) { events.push(event); return true; }
};
const context = {
  window,
  localStorage,
  TextEncoder,
  URL,
  console: { ...console, error() {}, warn() {}, info() {} },
  document: { documentElement: { setAttribute() {} } }
};
window.window = window;
window.localStorage = localStorage;
window.document = context.document;

vm.runInNewContext(await readFile("app_state.js", "utf8"), context, { filename: "app_state.js" });
const state = window.SCZN3M4;
localStorage.saturated = true;

const authorityPackage = {
  ok: true,
  authoritativeSessionId: "quota-session-authority-001",
  sessionLifecycle: "created",
  sessionMode: "simulation",
  target: {
    targetId: "baker_tst12_17_5x23",
    targetAuthorityId: "baker_tst12_17_5x23",
    targetName: "TST-12 17.5 × 23",
    targetProfileVersion: "test-v1"
  },
  missionIdentity: { missionFamily: "targetScoring", missionId: "tst12-score", resultPackageType: "target_score" },
  governedDistance: { value: 10, unit: "YDS", locked: false },
  selectedEquipment: { source: "shooter-selected", weaponCategory: "Rifle", modelCaliber: ".223" }
};
const matrix = {
  targetProfileId: "baker_tst12_17_5x23",
  targetName: "TST-12 17.5 × 23",
  missionFamily: "targetScoring",
  experienceMode: "simulation",
  weaponCategory: "Rifle",
  weaponModelCaliber: ".223"
};

const created = state.createAuthoritativeSession(authorityPackage, matrix);
assert.equal(created.sessionId, authorityPackage.authoritativeSessionId);
assert.equal(created.sessionIdAuthority, "backend");
assert.equal(events.length, 1);
assert.equal(events[0].type, "sczn3:browser-storage-unavailable");
assert.equal(events[0].detail.storageMode, "memory_only");
assert.equal(events[0].detail.sessionId, authorityPackage.authoritativeSessionId);
assert.deepEqual([...localStorage.values.entries()], before, "quota fallback must not delete or rewrite existing browser records");

const withObservation = state.updateSessionById(created.sessionId, {
  observations: [{ observationId: "observation-001", x: 0.5, y: 0.5, stationRegionId: "station_1_square" }]
});
assert.equal(withObservation.observations.length, 1);
assert.equal(withObservation.observations[0].observationId, "observation-001");
assert.equal(events.length, 2);
assert.deepEqual([...localStorage.values.entries()], before);

const preservedLocally = state.replaceSession({ ...withObservation, savedToSEC: true, preservedAt: "2026-11-10T12:00:00.000Z" });
assert.equal(preservedLocally.savedToSEC, true);
assert.equal(preservedLocally.sessionId, created.sessionId);
assert.equal(events.length, 3);
assert.deepEqual([...localStorage.values.entries()], before);

localStorage.failureName = "SecurityError";
assert.throws(
  () => state.updateSessionById(created.sessionId, { notes: "must fail closed" }),
  error => error && error.name === "SecurityError",
  "non-quota storage failures must not be converted into the quota fallback"
);

localStorage.failureName = "QuotaExceededError";
vm.runInNewContext(await readFile("sec_reopen_capability.js", "utf8"), context, { filename: "sec_reopen_capability.js" });
const capabilityToken = "eyJzZXNzaW9uSWQiOiJxdW90YS1zZXNzaW9uLWF1dGhvcml0eS0wMDEifQ.signature";
assert.equal(window.SCZN3SECReopenAuthority.remember({
  session: { sessionId: created.sessionId },
  reopenCapability: capabilityToken
}), true);
assert.equal(window.SCZN3SECReopenAuthority.capability(created.sessionId), capabilityToken);
assert.equal(events.at(-1).detail.operation, "remember-sec-reopen-capability");
assert.deepEqual([...localStorage.values.entries()], before);

const runtime = await readFile("target_execution_runtime.js", "utf8");
const reopenCapability = await readFile("sec_reopen_capability.js", "utf8");
const html = await readFile("target-experience.html", "utf8");
const experience = await readFile("tst12_universal_experience.js", "utf8");
assert.match(html, /id="contractBrowserStorageWarning"[^>]*role="status"[^>]*aria-live="polite"[^>]*hidden/);
assert.match(runtime, /Browser storage is full\. This session is active with Backend Authority/);
assert.match(runtime, /This session is preserved to SEC and can be reopened from the Ballistic Vault/);
assert.match(reopenCapability, /VOLATILE_CAPABILITIES/);
assert.match(reopenCapability, /remember-sec-reopen-capability/);
assert.match(experience, /TAP WHERE YOUR SHOTS HIT/);
assert.match(experience, /\[\["STATION", activeStation\], \["RECORDED", activeCount\], \["TOTAL", totalCount\]\]/);

console.log(JSON.stringify({
  verdict: "PASS",
  backendSessionRetained: created.sessionId,
  observationsRetained: withObservation.observations.length,
  quotaWarnings: events.length,
  existingStorageUnchanged: true,
  nonQuotaFailure: "fail_closed"
}, null, 2));
