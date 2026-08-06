import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] || null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

const localStorage = memoryStorage();
const context = {
  window: {},
  document: undefined,
  localStorage,
  console,
  Date,
  Math,
  Number,
  String,
  Object,
  Array,
  RegExp,
  JSON,
  TextEncoder
};
vm.createContext(context);
vm.runInContext(await readFile("app_state.js", "utf8"), context);

const backendPackage = {
  ok: true,
  status: "created",
  authoritativeSessionId: "sczn3-session-contract-001",
  createdAt: "2026-08-05T12:00:00+00:00",
  sessionLifecycle: "created",
  target: {
    targetId: "m4_25m_zero",
    targetAuthorityId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
    targetName: "M4/M16 Series Weapons 25M Zero",
    targetProfileVersion: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
    atpId: "m4-25m-zero-atp-v1"
  },
  missionIdentity: {
    missionFamily: "zeroingCorrection",
    missionId: "M4_25M_300M_ZERO",
    resultPackageType: "zeroCorrectionResult"
  },
  governedDistance: { value: 25, unit: "M", locked: true },
  selectedEquipment: {
    candidateId: "weapon-1",
    weaponCategory: "Rifle",
    equipmentFingerprint: "test"
  }
};

const session = context.window.SCZN3M4.createAuthoritativeSession(backendPackage, {
  setupId: "weapon-1",
  weaponCategory: "Rifle",
  weaponModelType: "AR Platform",
  mission_family: "client-spoof",
  target_profile_id: "m4_25m_zero",
  opticAdjustmentUnit: "MOA",
  opticClickValue: "0.5"
});

assert.equal(session.sessionId, backendPackage.authoritativeSessionId);
assert.equal(session.authoritativeSessionId, backendPackage.authoritativeSessionId);
assert.equal(session.sessionIdAuthority, "backend");
assert.equal(session.sessionNumberAuthority, "device-local-temporary");
assert.equal(session.sessionLabel, "Session #001");
assert.equal(session.mission_family, "zeroingCorrection");
assert.equal(session.matrixSnapshot.mission_family, "zeroingCorrection");
assert.equal(session.matrixSnapshot.sessionAuthorityOwner, "backend");
assert.equal(session.sessionDistance.value, 25);
assert.equal(session.sessionDistance.unit, "M");
assert.equal(context.window.SCZN3M4.getSessionHistory()[0].sessionId, backendPackage.authoritativeSessionId);

const matrixHtml = await readFile("matrix.html", "utf8");
const indexHtml = await readFile("index.html", "utf8");
const targetExperiences = await readFile("target_experiences.js", "utf8");
const shootHtml = await readFile("shoot.html", "utf8");
const netlifyConfig = await readFile("netlify.toml", "utf8");
const redirects = await readFile("_redirects", "utf8");

assert(matrixHtml.includes('sessionAuthorityRequest("prepare"'));
assert(matrixHtml.includes('sessionAuthorityRequest("start"'));
assert(matrixHtml.includes("SCZN3M4.createAuthoritativeSession"));
assert(!matrixHtml.includes("SCZN3M4.createSession(collectForm())"));
assert(!indexHtml.includes("SCZN3M4.createSession"));
assert(!targetExperiences.includes("mission_family="));
assert(targetExperiences.includes('JSON.stringify({ targetId })'));
assert(targetExperiences.includes('data-status="${escapeHtml(experience.status)}"'));
assert(targetExperiences.includes('tag = available ? "a" : "article"'));
assert(targetExperiences.includes("SCZN3_TARGET_CATALOG_VIEW_COUNT_V1"));
assert(indexHtml.includes("<strong>TAP</strong><span>your target below</span>"));
assert(shootHtml.includes("window.location.replace(`matrix.html"));
assert(netlifyConfig.includes('from = "/api/session/prepare"'));
assert(netlifyConfig.includes('from = "/api/session/start"'));
assert(redirects.includes("/api/session/prepare"));
assert(redirects.includes("/api/session/start"));
assert(matrixHtml.includes("This target will use the Standard Setup shown below."));
assert(matrixHtml.includes("Continue with Standard Setup"));
assert(matrixHtml.includes(">Weapon Setup</button>"));
assert(matrixHtml.includes("JSON.stringify({ targetId })"));
assert(matrixHtml.includes("preferredCompatibleSavedSetup"));
assert(matrixHtml.includes("initializeOneTimeSetupFromAuthority"));
assert(!matrixHtml.includes("standardSetup: {"));

const standardBackendPackage = {
  ...backendPackage,
  authoritativeSessionId: "sczn3-session-contract-standard-001",
  setupMode: "standard",
  selectedEquipment: {
    candidateId: "standard-m4-iron-dch-fsp",
    weaponCategory: "Rifle",
    manufacturer: "Colt / FN",
    modelType: "M4/M4A1 Carbine",
    modelCaliber: "5.56 NATO",
    opticType: "Iron Sights",
    adjustmentUnit: "MOA",
    clickValue: null,
    adjustmentSystem: "M4_IRON_DCH_FSP",
    equipmentAuthorityRecordId: "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28",
    axisAdjustment: { windagePerClick: 0.75, elevationPerClick: 1.5, unit: "MOA" },
    source: "backend_standard_setup",
    setupAuthority: "backend-target-authority",
    setupAuthorityId: "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28"
  }
};
const standardSession = context.window.SCZN3M4.createAuthoritativeSession(standardBackendPackage, {
  target_profile_id: "m4_25m_zero",
  weaponCategory: "Pistol",
  weaponModelType: "client-value-must-not-win",
  opticClickValue: "9"
});
assert.equal(standardSession.matrixSnapshot.weaponCategory, "Rifle");
assert.equal(standardSession.matrixSnapshot.weaponModelType, "M4/M4A1 Carbine");
assert.equal(standardSession.matrixSnapshot.adjustmentSystem, "M4_IRON_DCH_FSP");
assert.equal(standardSession.matrixSnapshot.equipmentAuthorityRecordId, "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28");
assert.equal(standardSession.matrixSnapshot.setupMode, "standard");

console.log("PASS Backend Session Authority frontend and routing contract");
