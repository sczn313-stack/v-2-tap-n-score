import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

class QuotaStorage {
  constructor(limit) {
    this.limit = limit;
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
    const next = new Map(this.values);
    next.set(String(key), String(value));
    const characters = [...next.entries()].reduce((sum, [storedKey, storedValue]) => sum + storedKey.length + storedValue.length, 0);
    if (characters > this.limit) {
      const error = new Error("storage quota exceeded");
      error.name = "QuotaExceededError";
      throw error;
    }
    this.values = next;
  }

  removeItem(key) {
    this.values.delete(String(key));
  }
}

const localStorage = new QuotaStorage(56000);
const preservedSessionId = "legacy-preserved-session";
const preservedMediaId = "legacy-preserved-media";
const preservedRecord = {
  persistenceSchema: "sczn3-canonical-session-v1",
  sessionId: preservedSessionId,
  savedToSEC: true,
  sessionLabel: "Session #001",
  targetName: "Baker 100 Yard Smart Target",
  targetEvidenceImage: { mediaRef: preservedMediaId }
};
localStorage.setItem("SCZN3_BAKER_SESSION_HISTORY", JSON.stringify([{
  persistenceSchema: "sczn3-session-ref-v1",
  sessionId: preservedSessionId,
  sessionLabel: "Session #001",
  savedToSEC: true
}]));
localStorage.setItem(`SCZN3_BAKER_SESSION_RECORD_${encodeURIComponent(preservedSessionId)}`, JSON.stringify(preservedRecord));
localStorage.setItem(`SCZN3_BAKER_MEDIA_${encodeURIComponent(preservedMediaId)}`, JSON.stringify({
  mediaId: preservedMediaId,
  dataUrl: `data:image/jpeg;base64,${"P".repeat(6000)}`
}));

let orphanCount = 0;
while (orphanCount < 20) {
  try {
    const sessionId = `legacy-orphan-${orphanCount}`;
    const mediaId = `legacy-orphan-media-${orphanCount}`;
    localStorage.setItem(`SCZN3_BAKER_SESSION_RECORD_${sessionId}`, JSON.stringify({
      persistenceSchema: "sczn3-canonical-session-v1",
      sessionId,
      savedToSEC: false,
      targetEvidenceImage: { mediaRef: mediaId }
    }));
    localStorage.setItem(`SCZN3_BAKER_MEDIA_${mediaId}`, JSON.stringify({
      mediaId,
      dataUrl: `data:image/jpeg;base64,${"O".repeat(8000)}`
    }));
    orphanCount += 1;
  } catch (error) {
    assert.equal(error.name, "QuotaExceededError");
    break;
  }
}
assert.ok(orphanCount > 0, "fixture must contain legacy orphan storage");

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

assert.ok(window.SCZN3M4, "state module must load when legacy migration encounters browser quota");
const history = window.SCZN3M4.getSessionHistory();
assert.equal(history.length, 1);
assert.equal(history[0].sessionId, preservedSessionId);
assert.equal(history[0].savedToSEC, true);
assert.notEqual(localStorage.getItem(`SCZN3_BAKER_SESSION_RECORD_${preservedSessionId}`), null, "preserved legacy SEC must remain intact");
assert.equal(
  [...localStorage.values.keys()].some(key => key.startsWith("SCZN3_BAKER_SESSION_RECORD_legacy-orphan-")),
  false,
  "unreferenced legacy sessions must be reclaimed when they prevent safe migration"
);
assert.equal(
  [...localStorage.values.keys()].some(key => key.startsWith("SCZN3_BAKER_MEDIA_legacy-orphan-media-")),
  false,
  "unreferenced legacy media must be reclaimed when they prevent safe migration"
);

const report = JSON.parse(documentElementAttributes.get("data-sczn3-storage-gc-report"));
assert.equal(report.reason, "legacy-migration-capacity-recovery");
assert.equal(report.namespace, "legacy");
assert.ok(report.preservedSessionIds.includes(preservedSessionId));

console.log("PASS Episode 59 legacy quota migration preserves SEC history and restores working capacity");
