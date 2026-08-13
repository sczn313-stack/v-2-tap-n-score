import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key) {
    return this.values.has(String(key)) ? this.values.get(String(key)) : null;
  }

  setItem(key, value) {
    this.values.set(String(key), String(value));
  }

  removeItem(key) {
    this.values.delete(String(key));
  }
}

const localStorage = new MemoryStorage();
const documentElementAttributes = new Map();
const window = {};
const context = {
  window,
  localStorage,
  TextEncoder,
  URL,
  console,
  document: {
    documentElement: {
      setAttribute(name, value) {
        documentElementAttributes.set(name, value);
      }
    }
  }
};
window.window = window;
window.localStorage = localStorage;
window.document = context.document;

const stateSource = await readFile("app_state.js", "utf8");
vm.runInNewContext(stateSource, context, { filename: "app_state.js" });
const state = window.SCZN3M4;

const dataUrlPrefix = "data:image/jpeg;base64,";
const weaponPhoto = {
  name: "founder-m4.jpg",
  type: "image/jpeg",
  size: 158449,
  dataUrl: dataUrlPrefix + "A".repeat(158449 - dataUrlPrefix.length)
};
const request = {
  targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
  aimCoordinate: { xPercent: 50, yPercent: 50 },
  impactCoordinates: [
    { shotId: "shot-1", xPercent: 45, yPercent: 60 },
    { shotId: "shot-2", xPercent: 46, yPercent: 61 },
    { shotId: "shot-3", xPercent: 44, yPercent: 59 }
  ],
  shooterSetup: {
    opticType: "Iron Sights",
    adjustmentSystem: "M4_IRON",
    weaponPhoto
  }
};
const authorityPackage = {
  authorityVersion: "M4_ZEROING_AUTHORITY_V1",
  mission_family: "zeroingCorrection",
  target_profile_id: "m4_25m_zero",
  evidenceHash: "founder-authority-hash",
  inputs: request,
  confirmedAimPointAuthority: {
    status: "confirmed",
    coordinate: request.aimCoordinate,
    source: "shooter-selected-session-evidence",
    method: "confirmed-aim-point-v1"
  },
  frontendRequest: request,
  status: { hasCorrection: true, impactCount: 3 },
  impacts: request.impactCoordinates,
  poib: { xPercent: 45, yPercent: 60 },
  aimPointDiscrepancy: {
    status: "measured",
    judgment: "unavailable",
    magnitudeInches: 0
  },
  geometryValidation: {
    status: "calculated",
    vectorStart: "POIB",
    vectorEnd: "CONFIRMED_AIM_POINT"
  },
  mechanicalValidation: { status: "calculated" },
  renderCoordinates: {
    aim: request.aimCoordinate,
    bull: { xPercent: 50, yPercent: 48.7, shotId: "registered-bull" },
    impacts: request.impactCoordinates,
    poib: { xPercent: 45, yPercent: 60 },
    vector: {
      start: { xPercent: 45, yPercent: 60 },
      end: request.aimCoordinate,
      intent: "POIB_TO_CONFIRMED_AIM"
    }
  },
  correction: { windage: "LEFT", elevation: "UP" },
  clicks: { windageClicks: 12, elevationClicks: 13 },
  angular: { moa: { windage: 5.85, elevation: 15.89 } },
  score: { value: 84 }
};
const authorityClicks = {
  ...authorityPackage.clicks,
  windage: authorityPackage.correction.windage,
  elevation: authorityPackage.correction.elevation,
  poib: authorityPackage.poib,
  authorityPackage
};
const legacySession = {
  sessionId: "baker-session-founder-quota",
  sessionLabel: "Session #005",
  timestamp: "2026-07-27T22:00:00.000Z",
  savedAt: "2026-07-27T22:00:00.000Z",
  savedToSEC: true,
  vendor: "Baker",
  sku: "ST-M16A2/M4",
  product: "M4 Carbine • 25 Meter Zeroing Target",
  targetName: "M4 Carbine • 25 Meter Zeroing Target",
  target_profile_id: "m4_25m_zero",
  mission_family: "zeroingCorrection",
  matrixSnapshot: {
    target_profile_id: "m4_25m_zero",
    mission_family: "zeroingCorrection",
    weaponPhoto
  },
  targetEvidenceImage: {
    name: "BAKER_ST-M16A2-M4_SMART_TARGET.svg",
    type: "image/svg+xml",
    dataUrl: "assets/BAKER_ST-M16A2-M4_SMART_TARGET.svg"
  },
  aimPoint: request.aimCoordinate,
  confirmedAimPoint: request.aimCoordinate,
  confirmedAimPointAuthority: authorityPackage.confirmedAimPointAuthority,
  impactPoints: request.impactCoordinates,
  shotData: {
    aimPoint: request.aimCoordinate,
    impactPoints: request.impactCoordinates,
    shotCount: 3,
    hits: 3,
    authoritySource: "backend"
  },
  backendAuthorityPackage: authorityPackage,
  ugeoAuthorityPackage: authorityPackage,
  authorityPackage,
  m4AuthorityPackage: authorityPackage,
  clicks: authorityClicks,
  correctionData: {
    status: "backend-authority-calculated",
    clicks: authorityClicks
  },
  correctionStatus: "backend-authority-calculated",
  confirmationStatus: "Pending"
};

localStorage.setItem(state.KEYS.activeSession, JSON.stringify(legacySession));
localStorage.setItem(state.KEYS.activeZeroSession, JSON.stringify(legacySession));
localStorage.setItem(state.KEYS.sessionHistory, JSON.stringify([legacySession]));
localStorage.setItem(state.KEYS.activeMatrix, JSON.stringify(legacySession.matrixSnapshot));
localStorage.setItem("SCZN3_CUSTOMER_USE_LIMIT_TEST_SENTINEL", JSON.stringify({ remaining: 7 }));

const backwardCompatible = state.read(state.KEYS.activeSession, null);
assert.equal(backwardCompatible.sessionId, legacySession.sessionId);
assert.equal(backwardCompatible.m4AuthorityPackage.evidenceHash, "founder-authority-hash");
assert.equal(backwardCompatible.matrixSnapshot.weaponPhoto.dataUrl, weaponPhoto.dataUrl);

const originalPayloadBytes = new TextEncoder().encode(JSON.stringify(legacySession)).byteLength;
const saved = state.updateActiveSession({
  savedIdentifier: "SEC-baker-session-founder-quota",
  savedRecordId: legacySession.sessionId,
  workflowStage: "validation"
});

assert.ok(saved);
assert.equal(saved.authorityPackage.evidenceHash, "founder-authority-hash");
assert.strictEqual(saved.backendAuthorityPackage, saved.authorityPackage);
assert.strictEqual(saved.ugeoAuthorityPackage, saved.authorityPackage);
assert.strictEqual(saved.m4AuthorityPackage, saved.authorityPackage);
assert.equal(saved.clicks.windageClicks, 12);
assert.equal(saved.correctionData.clicks.elevationClicks, 13);
assert.equal(saved.matrixSnapshot.weaponPhoto.dataUrl, weaponPhoto.dataUrl);
assert.deepEqual(
  JSON.parse(JSON.stringify(saved.impactPoints)),
  legacySession.impactPoints
);

const activeReference = JSON.parse(localStorage.getItem(state.KEYS.activeSession));
const zeroReference = JSON.parse(localStorage.getItem(state.KEYS.activeZeroSession));
const historyReferences = JSON.parse(localStorage.getItem(state.KEYS.sessionHistory));
assert.equal(activeReference.persistenceSchema, "sczn3-session-ref-v1");
assert.equal(activeReference.sessionId, legacySession.sessionId);
assert.equal(zeroReference.persistenceSchema, "sczn3-session-ref-v1");
assert.equal(historyReferences.length, 1);
assert.equal(historyReferences[0].sessionId, legacySession.sessionId);
assert.ok(JSON.stringify(historyReferences).length < 500);

const recordKey = `${state.KEYS.sessionRecordPrefix}${encodeURIComponent(legacySession.sessionId)}`;
const canonicalRecord = JSON.parse(localStorage.getItem(recordKey));
const canonicalSerialized = JSON.stringify(canonicalRecord);
const canonicalBytes = new TextEncoder().encode(canonicalSerialized).byteLength;
assert.equal(canonicalRecord.persistenceSchema, "sczn3-canonical-session-v1");
assert.ok(canonicalRecord.authorityPackage);
assert.equal(canonicalRecord.authorityPackage.evidenceHash, "founder-authority-hash");
assert.equal(canonicalRecord.authorityPackage.renderCoordinates.bull.shotId, "registered-bull");
assert.deepEqual(
  canonicalRecord.authorityPackage.renderCoordinates.vector.end,
  canonicalRecord.authorityPackage.inputs.aimCoordinate
);
assert.equal(canonicalRecord.authorityPackage.confirmedAimPointAuthority.status, "confirmed");
assert.equal(canonicalRecord.authorityPackage.aimPointDiscrepancy.judgment, "unavailable");
assert.equal(canonicalRecord.authorityPackage.frontendRequest, undefined);
assert.equal(canonicalRecord.authorityPackage.frontendRequestRef, "inputs");
for (const duplicate of [
  "backendAuthorityPackage",
  "ugeoAuthorityPackage",
  "m4AuthorityPackage",
  "clicks",
  "correctionData"
]) {
  assert.equal(canonicalRecord[duplicate], undefined, `${duplicate} must not be persisted`);
}
assert.ok(canonicalBytes < originalPayloadBytes * 0.1);

const mediaKeys = [...localStorage.values.keys()].filter(key => key.startsWith(state.KEYS.mediaPrefix));
assert.equal(mediaKeys.length, 1);
const persistedMedia = JSON.parse(localStorage.getItem(mediaKeys[0]));
assert.equal(persistedMedia.dataUrl, weaponPhoto.dataUrl);
assert.equal(canonicalSerialized.includes(weaponPhoto.dataUrl), false);
assert.equal(localStorage.getItem(state.KEYS.activeMatrix).includes(weaponPhoto.dataUrl), false);
assert.equal(state.getActiveMatrix().weaponPhoto.dataUrl, weaponPhoto.dataUrl);

const reopened = state.loadSession(legacySession.sessionId);
assert.ok(reopened);
const reopenedActive = state.read(state.KEYS.activeSession, null);
assert.equal(reopenedActive.savedIdentifier, "SEC-baker-session-founder-quota");
assert.equal(reopenedActive.authorityPackage.evidenceHash, "founder-authority-hash");
assert.deepEqual(
  reopenedActive.authorityPackage.renderCoordinates.vector.end,
  reopenedActive.confirmedAimPoint
);
assert.equal(reopenedActive.authorityPackage.frontendRequest.shooterSetup.weaponPhoto.dataUrl, weaponPhoto.dataUrl);
assert.deepEqual(
  JSON.parse(JSON.stringify(reopenedActive.shotData.impactPoints)),
  legacySession.shotData.impactPoints
);

const reopenedHistory = state.getSessionHistory();
assert.equal(reopenedHistory.length, 1);
assert.equal(reopenedHistory[0].authorityPackage.evidenceHash, "founder-authority-hash");
assert.equal(reopenedHistory[0].targetEvidenceImage.dataUrl, legacySession.targetEvidenceImage.dataUrl);
assert.deepEqual(
  JSON.parse(localStorage.getItem("SCZN3_CUSTOMER_USE_LIMIT_TEST_SENTINEL")),
  { remaining: 7 }
);

const report = window.__SCZN3_SESSION_NORMALIZATION_REPORT__;
assert.equal(report.sessionId, legacySession.sessionId);
assert.ok(report.originalPayloadBytes >= originalPayloadBytes);
assert.equal(report.canonicalRecordBytes, canonicalBytes);
assert.equal(report.mediaAssetCount, 1);

console.log(
  `PASS canonical session persistence normalization: ${originalPayloadBytes} -> ${canonicalBytes} bytes + one media asset`
);
