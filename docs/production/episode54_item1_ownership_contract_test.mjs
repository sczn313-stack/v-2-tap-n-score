import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

class MemoryStorage {
  constructor(entries = []) {
    this.values = new Map(entries.map(([key, value]) => [String(key), String(value)]));
  }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

async function source(name) {
  return readFile(name, "utf8");
}

const browser = { window: {}, console };
browser.window.window = browser.window;
vm.createContext(browser);
vm.runInContext(await source("platform_contracts.js"), browser, { filename: "platform_contracts.js" });
vm.runInContext(await source("sec_v1.js"), browser, { filename: "sec_v1.js" });
const shellOwner = browser.window.SCZN3SEC;
vm.runInContext(await source("sec_framework.js"), browser, { filename: "sec_framework.js" });

assert.strictEqual(browser.window.SCZN3SEC, shellOwner, "semantic helpers must not replace the SEC shell owner");
assert.equal(typeof browser.window.SCZN3SEC.render, "function");
assert.equal(typeof browser.window.SCZN3SECComponents.EvidenceCard, "function");
assert.equal(browser.window.SCZN3PlatformContracts.owners.secFramework, "SCZN3SEC");
assert.equal(browser.window.SCZN3PlatformContracts.owners.secComponents, "SCZN3SECComponents");

assert.equal(browser.window.SCZN3TargetAdapters.validate({
  adapterId: "fixture-adapter",
  targetProfileId: "fixture-target",
  contentModel: { evidence: {} }
}).ok, true);
assert.deepEqual(
  Array.from(browser.window.SCZN3TargetAdapters.validate({
    adapterId: "bad-adapter",
    targetProfileId: "fixture-target",
    contentModel: {},
    shellGeometry: "target-owned",
    score() { return 100; }
  }).errors),
  ["platform_owned_shellGeometry", "platform_owned_score"]
);
assert.equal(browser.window.SCZN3PartnershipIdentity.validate({ publisher: "Baker Targets" }).ok, true);
assert.equal(browser.window.SCZN3PartnershipIdentity.validate({
  publisher: "Baker Targets",
  targetProfileLabel: "USPSA Practice Target"
}).ok, false, "partner identity must remain separate from persistent target-profile identity");

const identityBrowser = {
  window: {},
  localStorage: new MemoryStorage(),
  sessionStorage: new MemoryStorage(),
  URLSearchParams,
  Object,
  String
};
vm.createContext(identityBrowser);
vm.runInContext(await source("smart_target_identity.js"), identityBrowser, { filename: "smart_target_identity.js" });
const legacyFacade = identityBrowser.window.SCZN3SmartTargetIdentity;
const productOwner = identityBrowser.window.SCZN3PartnerProducts.BAKER_M4;
const resolved = productOwner.resolve("?v=baker&sku=ST-M16A2%2FM4");
assert.equal(resolved.targetProfileId, "m4_25m_zero");
assert.deepEqual(legacyFacade.resolve("?v=baker&sku=ST-M16A2%2FM4"), resolved);
identityBrowser.window.SCZN3TargetProfiles.writePending(resolved);
assert.deepEqual(
  JSON.parse(identityBrowser.localStorage.getItem("SCZN3_PENDING_TARGET_PROFILE")),
  { targetId: "m4_25m_zero" }
);

const legacySession = JSON.stringify({
  sessionId: "legacy-session-001",
  savedToSEC: true,
  evidence: { count: 4 },
  targetEvidenceImage: { mediaRef: "legacy-media-001" }
});
const legacyHistory = JSON.stringify([{ sessionId: "legacy-session-001" }]);
const legacyEquipment = JSON.stringify([{ id: "equipment-001", label: "Founder Rifle" }]);
const legacyRecordKey = "SCZN3_BAKER_SESSION_RECORD_legacy-session-001";
const legacyMediaKey = "SCZN3_BAKER_MEDIA_legacy-media-001";
const legacyMedia = JSON.stringify({ mediaId: "legacy-media-001", dataUrl: "data:image/png;base64,AA==" });
const canonicalExisting = JSON.stringify({ sessionId: "canonical-session-wins" });
const storage = new MemoryStorage([
  ["SCZN3_BAKER_ACTIVE_SESSION", legacySession],
  ["SCZN3_BAKER_SESSION_HISTORY", legacyHistory],
  ["SCZN3_BAKER_SAVED_SETUPS", legacyEquipment],
  [legacyRecordKey, legacySession],
  [legacyMediaKey, legacyMedia],
  ["SCZN3_ACTIVE_ZERO_SESSION", canonicalExisting]
]);
const stateBrowser = {
  window: {},
  localStorage: storage,
  TextEncoder,
  URL,
  console,
  document: { documentElement: { setAttribute() {} } }
};
stateBrowser.window.window = stateBrowser.window;
stateBrowser.window.localStorage = storage;
stateBrowser.window.document = stateBrowser.document;
vm.createContext(stateBrowser);
vm.runInContext(await source("app_state.js"), stateBrowser, { filename: "app_state.js" });

const platformState = stateBrowser.window.SCZN3PlatformState;
assert.equal(platformState.keys.activeSession, "SCZN3_ACTIVE_SESSION");
assert.equal(platformState.keys.savedEquipment, "SCZN3_SAVED_EQUIPMENT_PROFILES");
assert.equal(storage.getItem("SCZN3_ACTIVE_SESSION"), legacySession);
assert.equal(storage.getItem("SCZN3_SESSION_HISTORY"), legacyHistory);
assert.equal(storage.getItem("SCZN3_SAVED_EQUIPMENT_PROFILES"), legacyEquipment);
assert.equal(storage.getItem("SCZN3_SESSION_RECORD_legacy-session-001"), null, "legacy session records remain readable in place without a duplicate canonical copy");
assert.equal(storage.getItem("SCZN3_MEDIA_legacy-media-001"), null, "legacy evidence remains readable in place without a duplicate canonical copy");
assert.equal(storage.getItem("SCZN3_ACTIVE_ZERO_SESSION"), canonicalExisting, "canonical state must win over legacy state");
assert.equal(storage.getItem("SCZN3_BAKER_ACTIVE_SESSION"), legacySession, "migration must retain legacy data");
assert.equal(storage.getItem(legacyRecordKey), legacySession, "migration must retain legacy records");
assert.equal(storage.getItem(legacyMediaKey), legacyMedia, "migration must retain legacy evidence media");
assert.equal(platformState.migration.legacyKeysRetained, true);
assert.equal(platformState.migration.strategy, "scalar-copy-lazy-prefixed-fallback-preserve-legacy");
assert.equal(
  JSON.stringify(stateBrowser.window.SCZN3M4.read("SCZN3_SESSION_RECORD_legacy-session-001", null)),
  legacySession,
  "legacy sessions remain readable through the universal namespace without eager duplication"
);
assert.equal(
  JSON.stringify(stateBrowser.window.SCZN3M4.read("SCZN3_MEDIA_legacy-media-001", null)),
  legacyMedia,
  "legacy evidence remains readable through the universal namespace without eager duplication"
);

const beforeLegacyKeys = [...storage.values.keys()].filter(key => key.startsWith("SCZN3_BAKER_")).sort();
stateBrowser.window.SCZN3M4.write(platformState.keys.activeMatrix, { targetProfileId: "m4_25m_zero" });
const afterLegacyKeys = [...storage.values.keys()].filter(key => key.startsWith("SCZN3_BAKER_")).sort();
assert.deepEqual(afterLegacyKeys, beforeLegacyKeys, "new platform writes must not create Baker-owned state");

const matrixSource = await source("matrix.html");
assert.match(matrixSource, /SCZN3PlatformState\.keys\.savedEquipment/);
assert.doesNotMatch(matrixSource, /const SAVED_SETUPS_KEY = "SCZN3_BAKER_SAVED_SETUPS"/);

console.log("PASS Episode 54 Item 1 ownership, namespace, and legacy-state migration contracts");
