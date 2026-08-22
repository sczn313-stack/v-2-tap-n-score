import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

const storage = new MemoryStorage();
const document = {
  readyState: "complete",
  querySelectorAll() { return []; },
  documentElement: { setAttribute() {} }
};
const window = { document, localStorage: storage, sessionStorage: storage };
window.window = window;
const context = { window, document, localStorage: storage, sessionStorage: storage, TextEncoder, URL, URLSearchParams, console };
vm.createContext(context);
vm.runInContext(await readFile("platform_contracts.js", "utf8"), context, { filename: "platform_contracts.js" });

const profiles = window.SCZN3TargetProfiles;
const expected = [
  ["m4_25m_zero", "M4_TARGET_AUTHORITY_v1_ORIGINAL", "M4 25m Zero", "25 Meter Zero", "M4 25m Zero • 25 Meter Zero"],
  ["baker_st_100yd_smart_zero", "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL", "100 Yard Bullseye", "100 Yard Zero", "100 Yard Bullseye • 100 Yard Zero"],
  ["gssf_ac_1", "1", "GSSF Practice", "", "GSSF Practice"],
  ["baker_sl_st1_practice", "1", "USPSA Practice Target", "", "USPSA Practice Target"]
];

for (const [id, version, label, mission, display] of expected) {
  const identity = profiles.identityRecord(id);
  assert.ok(identity, `${id} must resolve from its exact governed id`);
  assert.equal(identity.targetProfileId, id);
  assert.equal(identity.targetProfileVersion, version);
  assert.equal(identity.targetProfileLabel, label);
  assert.equal(identity.missionLabel, mission);
  assert.equal(profiles.display(identity), display);
  assert.equal(profiles.validate(identity).ok, true);
  assert.ok(identity.publisherIdentity && identity.productIdentity, `${id} keeps publisher and product identities independently addressable`);
  assert.equal(Object.hasOwn(identity.publisherIdentity, "targetProfileLabel"), false);
  assert.equal(Object.hasOwn(identity.productIdentity, "targetProfileLabel"), false);
}

assert.equal(profiles.identityRecord("Baker 100 Yard Smart Target"), null, "product wording must not be parsed into profile identity");
assert.equal(profiles.identityRecord("Baker SL-ST1 — USPSA"), null, "publisher/product display text must not manufacture profile identity");
assert.equal(profiles.identityRecord("Highest Score Wins"), null, "scoring presentation family must not become profile identity");
assert.equal(profiles.identityRecord("BAKER_SL_ST1").targetProfileId, "baker_sl_st1_practice", "registered aliases resolve without changing their governed identifiers");

vm.runInContext(await readFile("app_state.js", "utf8"), context, { filename: "app_state.js" });
for (const [id, version, label, mission] of expected) {
  const session = window.SCZN3M4.createSession({ targetProfileId: id, targetName: `legacy product label for ${id}` });
  assert.equal(session.targetProfileId, id);
  assert.equal(session.targetProfileVersion, version);
  assert.equal(session.targetProfileLabel, label);
  assert.equal(session.missionLabel, mission);
  assert.deepEqual(session.publisherIdentity, profiles.identityRecord(id).publisherIdentity);
  assert.deepEqual(session.productIdentity, profiles.identityRecord(id).productIdentity);
  const stored = window.SCZN3M4.getSessionHistory().find(candidate => candidate.sessionId === session.sessionId);
  assert.equal(stored.targetProfileLabel, label, `${id} profile identity survives canonical session persistence`);
  assert.equal(stored.productIdentity.productId, profiles.identityRecord(id).productIdentity.productId);
}

const [bakerPage, shootPage, secPage, recordsPage, bakerRenderer] = await Promise.all([
  readFile("t/baker/sl-st1/index.html", "utf8"),
  readFile("shoot.html", "utf8"),
  readFile("sec.html", "utf8"),
  readFile("records.html", "utf8"),
  readFile("baker_sl_st1_sec.js", "utf8")
]);
assert.match(bakerPage, /data-sczn3-target-profile-identity="baker_sl_st1_practice">USPSA Practice Target/);
assert.match(bakerPage, /data-sczn3-partnership-surface="baker_sl_st1_practice"/);
assert.match(shootPage, /SCZN3TargetProfiles\.apply\(header, identity\)/);
assert.match(secPage, /data-sczn3-target-profile-identity="m4_25m_zero"/);
assert.match(secPage, /data-sczn3-partnership-surface="m4_25m_zero"/);
assert.match(recordsPage, /data-sczn3-target-profile-identity="baker_st_100yd_smart_zero"/);
assert.match(recordsPage, /data-sczn3-target-profile-identity="gssf_ac_1"/);
assert.match(recordsPage, /SCZN3PartnershipIdentity\?\.apply\(partnershipSurface, requestedSession, authorityPackage\(requestedSession\)\)/);
assert.doesNotMatch(recordsPage, /getElementById\("recordsHistoricalPromo"\)\.hidden = false/, "historical partner attribution must not be shown without governed identity");
assert.match(bakerRenderer, /targetProfileDisplay\(adapterView\)/, "migrated Baker SEC consumes the Item 2 identity through its governed adapter view model");

console.log("PASS Episode 54 Item 2 target-profile, partnership, product, persistence, and four-target identity contracts");
