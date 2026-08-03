import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

const localStorage = memoryStorage();
const sessionStorage = memoryStorage();
const identityContext = {
  window: {},
  localStorage,
  sessionStorage,
  URLSearchParams,
  Object,
  String
};
vm.createContext(identityContext);
vm.runInContext(
  await readFile("smart_target_identity.js", "utf8"),
  identityContext
);

const identityApi = identityContext.window.SCZN3SmartTargetIdentity;
const canonicalUrl = "https://tap-n-score.com/?v=baker&sku=ST-M16A2%2FM4";
const resolved = identityApi.resolve(new URL(canonicalUrl).search);

assert.equal(resolved.vendor, "Baker");
assert.equal(resolved.sku, "ST-M16A2/M4");
assert.equal(resolved.product, "M4 Carbine • 25 Meter Zeroing Target");
assert.equal(resolved.authority, "M4 Zeroing");
assert.equal(identityApi.resolve("?v=baker&sku=ST-M16A2-M4"), null);

identityApi.writePending(resolved);
assert.equal(
  JSON.parse(localStorage.getItem(identityApi.PENDING_TARGET_PROFILE_KEY)).sku,
  "ST-M16A2/M4"
);

const stateContext = {
  window: {},
  localStorage: memoryStorage(),
  console,
  Date,
  Math,
  Number,
  String,
  Object,
  Array,
  RegExp,
  JSON
};
vm.createContext(stateContext);
vm.runInContext(await readFile("app_state.js", "utf8"), stateContext);

const session = stateContext.window.SCZN3M4.createSession(resolved);
for (const field of ["vendor", "sku", "product", "authority"]) {
  assert.equal(session[field], resolved[field]);
  assert.equal(session.matrixSnapshot[field], resolved[field]);
  assert.equal(session.targetAuthority[field], resolved[field]);
}
assert.equal(session.target_profile_id, "m4_25m_zero");
assert.equal(session.matrixSnapshot.targetDistance, "25 m");

const hundredYardSession = stateContext.window.SCZN3M4.createSession({
  ...resolved,
  target_profile_id: "baker_st_100yd_smart_zero",
  targetProfileId: "baker_st_100yd_smart_zero",
  targetId: "BAKER_ST_100YD_SMART",
  targetName: "Baker 100 Yard Smart Target",
  mission_family: "zeroingCorrection",
  missionFamilyId: "zeroingCorrection"
});
stateContext.window.SCZN3M4.updateActiveSession({
  authorityPackage: { status: { hasCorrection: true }, target_profile_id: "baker_st_100yd_smart_zero" }
});
const reloadedHundredYard = stateContext.window.SCZN3M4.loadSession(hundredYardSession.sessionId);
assert.equal(reloadedHundredYard.target_profile_id, "baker_st_100yd_smart_zero");
assert.equal(
  Object.prototype.hasOwnProperty.call(reloadedHundredYard, "m4AuthorityPackage"),
  false,
  "an explicit 100 Yard target must not inherit the M4 SEC adapter from its firearm profile"
);

console.log("PASS canonical Baker M4 Smart Target identity contract");
