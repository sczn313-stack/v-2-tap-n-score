import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const storage = new Map();
const localStorage = {
  getItem: key => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value))
};
const calls = [];
const window = {
  localStorage,
  fetch: async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === "POST") return { ok: true, json: async () => ({ ok: true, session: { sessionId: "SEC-A" }, reopenCapability: "capability-a" }) };
    return { ok: true, json: async () => ({ ok: true, session: { sessionId: "SEC-A" } }) };
  }
};
vm.runInNewContext(fs.readFileSync(new URL("../sec_reopen_capability.js", import.meta.url), "utf8"), { window, JSON, String, encodeURIComponent });

await window.SCZN3SECReopenAuthority.provePossession("/api/session/sec", { sessionId: "SEC-A" });
assert.equal(window.SCZN3SECReopenAuthority.capability("SEC-A"), "capability-a");
await window.SCZN3SECReopenAuthority.reopen("/api/session/sec", "SEC-A");
assert.equal(calls[1].url, "/api/session/sec?session=SEC-A");
assert.equal(calls[1].options.headers["X-SCZN3-SEC-Reopen-Capability"], "capability-a");

const serverSource = fs.readFileSync(new URL("../backend/server.py", import.meta.url), "utf8");
const sessionStoreSource = fs.readFileSync(new URL("../backend/session_authority.py", import.meta.url), "utf8");
const preservedStoreSource = fs.readFileSync(new URL("../backend/preserved_sec_store.py", import.meta.url), "utf8");
assert.match(serverSource, /preserved_sec_enumeration_not_authorized/);
assert.match(serverSource, /verify_reopen_capability\(self\.headers\.get\(CAPABILITY_HEADER\), session_id\)/);
assert.doesNotMatch(serverSource, /else list_preserved_secs/);
assert.match(sessionStoreSource, /os\.environ\.get\("SCZN3_SESSION_SEC_DATABASE_URL", ""\)/);
assert.match(preservedStoreSource, /os\.environ\.get\("SCZN3_SESSION_SEC_DATABASE_URL", ""\)/);
console.log("PASS per-SEC reopen authority and global-enumeration denial contract");
