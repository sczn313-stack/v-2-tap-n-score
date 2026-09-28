(function initializeSECReopenCapability(global) {
  "use strict";

  const STORAGE_KEY = "SCZN3_SEC_REOPEN_CAPABILITIES_V1";
  const HEADER = "X-SCZN3-SEC-Reopen-Capability";
  const FRAGMENT_KEY = "secReopenCapability";

  function clean(value) { return String(value || "").trim(); }
  function readMap() {
    try {
      const value = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  function capability(sessionId) { return clean(readMap()[clean(sessionId)]); }
  function validCapability(value) {
    const token = clean(value);
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ? token : "";
  }
  function tokenSessionId(token) {
    try {
      const encoded = validCapability(token).split(".", 1)[0];
      if (!encoded) return "";
      const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
      return clean(JSON.parse(global.atob(base64)).sessionId);
    } catch (_) { return ""; }
  }
  function fragmentCapability(sessionId, locationValue = global.location) {
    try {
      const params = new URLSearchParams(clean(locationValue && locationValue.hash).replace(/^#/, ""));
      const token = validCapability(params.get(FRAGMENT_KEY));
      return tokenSessionId(token) === clean(sessionId) ? token : "";
    } catch (_) { return ""; }
  }
  function activeCapability(sessionId) {
    // The backend verifies that this narrow bearer capability is signed for the
    // exact session id and immutable artifact digest. The URL fragment is never
    // transmitted in an HTTP request or Referer; JS promotes it to the guarded
    // request header only when the preserved artifact is explicitly reopened.
    return fragmentCapability(sessionId) || validCapability(capability(sessionId));
  }
  function portableUrl(value, sessionId) {
    const token = activeCapability(sessionId);
    if (!token) return value;
    try {
      const url = new URL(value, global.location && global.location.href || undefined);
      const params = new URLSearchParams(clean(url.hash).replace(/^#/, ""));
      params.set(FRAGMENT_KEY, token);
      url.hash = params.toString();
      return url.toString();
    } catch (_) { return value; }
  }
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
    const token = activeCapability(sessionId);
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
    if (!activeCapability(sessionId) && localArtifact) await provePossession(endpoint, localArtifact);
    const response = await global.fetch(`${endpoint}?session=${encodeURIComponent(sessionId)}`, {
      headers: authorizedHeaders(sessionId)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(payload?.reason || "preserved_sec_reopen_denied");
    return payload;
  }

  global.SCZN3SECReopenAuthority = Object.freeze({
    FRAGMENT_KEY,
    HEADER,
    activeCapability,
    authorizedHeaders,
    capability,
    fragmentCapability,
    portableUrl,
    provePossession,
    remember,
    reopen
  });
})(window);
