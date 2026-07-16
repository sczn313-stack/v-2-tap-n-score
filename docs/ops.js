(function () {
  "use strict";

  const ARRIVAL_SESSION_KEY = "SCZN3_OPS_ARRIVAL_ID";
  const EVENT_ENDPOINT = "https://sczn3-authority.onrender.com/api/ops/event";

  function pagePath() {
    return window.location && window.location.pathname ? window.location.pathname.toLowerCase() : "";
  }

  function isPulsePage() {
    const path = pagePath();
    return path.endsWith("/ops.html") || path === "/ops.html";
  }

  function createId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function arrivalId() {
    try {
      let value = window.sessionStorage.getItem(ARRIVAL_SESSION_KEY);
      if (!value) {
        value = createId("arrival");
        window.sessionStorage.setItem(ARRIVAL_SESSION_KEY, value);
      }
      return value;
    } catch (_) {
      return "";
    }
  }

  function activeSession() {
    try {
      return window.SCZN3M4 && SCZN3M4.read && SCZN3M4.KEYS
        ? SCZN3M4.read(SCZN3M4.KEYS.activeSession, null)
        : null;
    } catch (_) {
      return null;
    }
  }

  function productIdentity(session) {
    const params = new URLSearchParams(window.location.search || "");
    const matrix = session && session.matrixSnapshot || {};
    const publisher = params.get("publisher_route_id") || session && session.publisher_route_id || matrix.publisher_route_id;
    const product = params.get("product_route_id") || session && session.product_route_id || matrix.product_route_id;
    const catalog = params.get("catalog_entry_id") || session && session.catalog_entry_id || matrix.catalog_entry_id;
    return publisher && product && catalog ? {
      publisher_route_id: String(publisher),
      product_route_id: String(product),
      catalog_entry_id: String(catalog)
    } : {};
  }

  function report(eventType, session) {
    try {
      if (isPulsePage()) return;
      const source = session || activeSession();
      const sessionId = source && (source.id || source.sessionId || source.sessionNumber);
      const payload = {
        event_type: eventType,
        arrival_id: arrivalId() || undefined,
        session_id: sessionId ? String(sessionId) : undefined,
        path: pagePath(),
        ...productIdentity(source),
        metadata: { source: "ops-governed-v1" }
      };
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon && navigator.sendBeacon(EVENT_ENDPOINT, new Blob([body], { type: "text/plain;charset=UTF-8" }))) return;
      if (window.fetch) window.fetch(EVENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      }).catch(() => {});
    } catch (_) {
      // Operational telemetry never affects the shooter workflow.
    }
  }

  function recordLinkOpen() {
    report("pageView");
    report("arrival");
  }

  function recordSessionStarted(session) { report("sessionStart", session); }
  function recordShowResults(_authorityPackage) { report("showResults"); }
  function recordSessionSaved(session) { report("sessionSaved", session); }

  window.SCZN3Ops = { recordLinkOpen, recordSessionStarted, recordShowResults, recordSessionSaved };
  recordLinkOpen();
})();
