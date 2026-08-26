(function initializeSECReopenCapability(global) {
  "use strict";

  const STORAGE_KEY = "SCZN3_SEC_REOPEN_CAPABILITIES_V1";
  const HEADER = "X-SCZN3-SEC-Reopen-Capability";

  function clean(value) { return String(value || "").trim(); }
  function readMap() {
    try {
      const value = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  function capability(sessionId) { return clean(readMap()[clean(sessionId)]); }
  function remember(packageData) {
    const sessionId = clean(packageData?.session?.sessionId || packageData?.sessionId);
    const token = clean(packageData?.reopenCapability);
    if (!sessionId || !token) return false;
    const values = readMap();
    values[sessionId] = token;
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    return true;
  }
  function authorizedHeaders(sessionId, base) {
    const token = capability(sessionId);
    return { Accept: "application/json", ...(base || {}), ...(token ? { [HEADER]: token } : {}) };
  }
  async function provePossession(endpoint, session) {
    const response = await global.fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ session })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok || !remember(payload)) throw new Error(payload?.reason || "sec_reopen_authority_unavailable");
    return payload;
  }
  async function reopen(endpoint, sessionId, localArtifact) {
    if (!capability(sessionId) && localArtifact) await provePossession(endpoint, localArtifact);
    const response = await global.fetch(`${endpoint}?session=${encodeURIComponent(sessionId)}`, {
      headers: authorizedHeaders(sessionId)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(payload?.reason || "preserved_sec_reopen_denied");
    return payload;
  }

  global.SCZN3SECReopenAuthority = Object.freeze({ HEADER, authorizedHeaders, capability, provePossession, remember, reopen });
})(window);
