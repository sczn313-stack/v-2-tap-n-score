(function () {
  "use strict";

  const ARRIVAL_SESSION_KEY = "SCZN3_OPS_ARRIVAL_ID";
  const CAMPAIGN_SESSION_KEY = "SCZN3_OPS_CAMPAIGN";
  const VISITOR_RETURN_KEY = "SCZN3_OPS_LAST_VISIT";
  const EVENT_DEDUPE_PREFIX = "SCZN3_OPS_EVENT_";
  const EVENT_ENDPOINT = "/api/ops/event";
  const CAMPAIGN_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
  const RETURN_GAP_MS = 30 * 60 * 1000;

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

  function campaignId() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const incoming = String(params.get("ref") || "").trim().toLowerCase();
      if (incoming && CAMPAIGN_PATTERN.test(incoming)) window.sessionStorage.setItem(CAMPAIGN_SESSION_KEY, incoming);
      const stored = String(window.sessionStorage.getItem(CAMPAIGN_SESSION_KEY) || "").trim().toLowerCase();
      return CAMPAIGN_PATTERN.test(stored) ? stored : "direct";
    } catch (_) {
      return "direct";
    }
  }

  function shouldReportOnce(eventType) {
    try {
      const key = `${EVENT_DEDUPE_PREFIX}${arrivalId()}_${eventType}`;
      if (window.sessionStorage.getItem(key) === "1") return false;
      window.sessionStorage.setItem(key, "1");
      return true;
    } catch (_) {
      return true;
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

  function report(eventType, session, options = {}) {
    try {
      if (isPulsePage()) return;
      if (options.once && !shouldReportOnce(eventType)) return;
      const source = session || activeSession();
      const sessionId = source && (source.id || source.sessionId || source.sessionNumber);
      const payload = {
        event_type: eventType,
        arrival_id: arrivalId() || undefined,
        session_id: sessionId ? String(sessionId) : undefined,
        path: pagePath(),
        campaign: campaignId(),
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
    report("arrival", null, { once: true });
    try {
      const currentArrival = arrivalId();
      const previous = JSON.parse(window.localStorage.getItem(VISITOR_RETURN_KEY) || "null");
      const now = Date.now();
      if (previous && previous.arrivalId !== currentArrival && Number.isFinite(previous.lastSeenAt) && now - previous.lastSeenAt >= RETURN_GAP_MS) {
        report("returnShooter", null, { once: true });
      }
      window.localStorage.setItem(VISITOR_RETURN_KEY, JSON.stringify({ arrivalId: currentArrival, lastSeenAt: now }));
    } catch (_) {}
  }

  function recordTstStarted() { report("tstStart", null, { once: true }); }
  function recordTstCompleted() { report("tstComplete", null, { once: true }); }
  function recordSessionStarted(session) { report("sessionStart", session, { once: true }); }
  function recordShowResults(_authorityPackage) { report("showResults", null, { once: true }); }
  function recordSessionSaved(session) { report("sessionSaved", session, { once: true }); }

  window.SCZN3Ops = {
    recordLinkOpen,
    recordTstStarted,
    recordTstCompleted,
    recordSessionStarted,
    recordShowResults,
    recordSessionSaved,
    campaignId
  };
  recordLinkOpen();
})();
