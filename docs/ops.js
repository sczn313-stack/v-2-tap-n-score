(function () {
  "use strict";

  const V1_STORAGE_KEY = "SCZN3_OPS_V1";
  const V2_STORAGE_KEY = "SCZN3_OPS_V2";
  const V2_ARRIVAL_SESSION_KEY = "SCZN3_OPS_V2_ARRIVAL_ID";
  const OPS_V3_EVENT_ENDPOINT = "https://sczn3-authority.onrender.com/api/ops/event";
  const MAX_EVENTS = 500;

  const DEFAULT_V1_STATE = {
    version: 1,
    counters: {
      linkOpens: 0,
      sessionsStarted: 0,
      showResults: 0,
      sessionsSaved: 0,
      returnShooters: 0
    },
    shootingDays: []
  };

  const DEFAULT_V2_STATE = {
    version: 2,
    counters: {
      arrivals: 0,
      pageViews: 0,
      sessionsStarted: 0,
      showResults: 0,
      sessionsSaved: 0,
      returnShooters: 0
    },
    sources: {
      referrals: {},
      targets: {},
      regions: {}
    },
    shootingDays: [],
    events: []
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (error) {
      return clone(fallback);
    }
  }

  function writeJson(key, state) {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      // Operations telemetry must never affect shooter workflow.
    }
  }

  function readV1State() {
    const parsed = readJson(V1_STORAGE_KEY, DEFAULT_V1_STATE);
    const fresh = clone(DEFAULT_V1_STATE);
    return {
      ...fresh,
      ...parsed,
      counters: { ...fresh.counters, ...(parsed && parsed.counters ? parsed.counters : {}) },
      shootingDays: Array.isArray(parsed && parsed.shootingDays) ? parsed.shootingDays : []
    };
  }

  function readV2State() {
    const parsed = readJson(V2_STORAGE_KEY, DEFAULT_V2_STATE);
    const fresh = clone(DEFAULT_V2_STATE);
    return {
      ...fresh,
      ...parsed,
      version: 2,
      counters: { ...fresh.counters, ...(parsed && parsed.counters ? parsed.counters : {}) },
      sources: {
        referrals: { ...(parsed && parsed.sources && parsed.sources.referrals ? parsed.sources.referrals : {}) },
        targets: { ...(parsed && parsed.sources && parsed.sources.targets ? parsed.sources.targets : {}) },
        regions: { ...(parsed && parsed.sources && parsed.sources.regions ? parsed.sources.regions : {}) }
      },
      shootingDays: Array.isArray(parsed && parsed.shootingDays) ? parsed.shootingDays : [],
      events: Array.isArray(parsed && parsed.events) ? parsed.events : []
    };
  }

  function mutateV1(mutator) {
    try {
      const state = readV1State();
      mutator(state);
      writeJson(V1_STORAGE_KEY, state);
      return state;
    } catch (error) {
      return readV1State();
    }
  }

  function mutateV2(mutator) {
    try {
      const state = readV2State();
      mutator(state);
      writeJson(V2_STORAGE_KEY, state);
      return state;
    } catch (error) {
      return readV2State();
    }
  }

  function incrementCounter(state, counterName) {
    state.counters[counterName] = Number(state.counters[counterName] || 0) + 1;
  }

  function incrementSource(bucket, label) {
    const key = label || "Unknown";
    bucket[key] = Number(bucket[key] || 0) + 1;
  }

  function pushEvent(state, event) {
    state.events.push({
      at: new Date().toISOString(),
      ...event
    });
    if (state.events.length > MAX_EVENTS) {
      state.events = state.events.slice(state.events.length - MAX_EVENTS);
    }
  }

  function dateKeyFromSession(session) {
    const source = session && (session.savedAt || session.timestamp || session.updatedAt || session.createdAt);
    const date = source ? new Date(source) : new Date();
    if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
    return date.toISOString().slice(0, 10);
  }

  function pagePath() {
    return (window.location && window.location.pathname ? window.location.pathname : "").toLowerCase();
  }

  function isOpsPage() {
    const path = pagePath();
    return path.endsWith("/ops.html") || path === "/ops.html";
  }

  function urlParams() {
    try {
      return new URLSearchParams(window.location.search || "");
    } catch (error) {
      return new URLSearchParams();
    }
  }

  function normalizeReferral(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) return "";
    if (text.includes("baker")) return "Baker Targets";
    if (text.includes("qr") || text.includes("qrc")) return "QR Target";
    if (text.includes("youtube") || text === "yt") return "YouTube";
    if (text.includes("google")) return "Google";
    if (text.includes("direct")) return "Direct URL";
    return value ? String(value).trim() : "";
  }

  function referralFromReferrer() {
    try {
      if (!document.referrer) return "Direct URL";
      const referrer = new URL(document.referrer);
      if (referrer.hostname === window.location.hostname) return "Direct URL";
      return normalizeReferral(referrer.hostname) || referrer.hostname || "Unknown";
    } catch (error) {
      return "Unknown";
    }
  }

  function referralSource() {
    const params = urlParams();
    const explicit = params.get("ref") || params.get("referral") || params.get("utm_source") || params.get("source");
    return normalizeReferral(explicit) || referralFromReferrer() || "Unknown";
  }

  function normalizeTarget(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) return "";
    if (text.includes("st-100") || text.includes("st100") || text.includes("baker")) return "ST-100";
    if (text.includes("m4")) return "M4";
    return value ? String(value).trim() : "";
  }

  function targetSource() {
    const params = urlParams();
    const explicit = params.get("target") || params.get("targetId") || params.get("targetSource") || params.get("family");
    return normalizeTarget(explicit) || "Unknown";
  }

  function regionSource() {
    try {
      const options = Intl.DateTimeFormat().resolvedOptions();
      return options && options.timeZone ? options.timeZone : "Unknown";
    } catch (error) {
      return "Unknown";
    }
  }

  function createArrivalId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `arrival-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function currentArrivalId() {
    try {
      return window.sessionStorage.getItem(V2_ARRIVAL_SESSION_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function backendEventPayload(eventType, extra) {
    const payload = {
      event_type: eventType,
      arrival_id: currentArrivalId() || undefined,
      referral_source: referralSource(),
      target_source: targetSource(),
      region: regionSource(),
      path: pagePath(),
      metadata: {}
    };
    return { ...payload, ...(extra || {}) };
  }

  function reportBackendEvent(eventType, extra) {
    try {
      if (isOpsPage()) return;
      const payload = backendEventPayload(eventType, extra);
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const sent = navigator.sendBeacon(
          OPS_V3_EVENT_ENDPOINT,
          new Blob([body], { type: "text/plain;charset=UTF-8" })
        );
        if (sent) return;
      }
      if (window.fetch) {
        window.fetch(OPS_V3_EVENT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true
        }).catch(() => {});
      }
    } catch (error) {
      // Backend telemetry must never affect shooter workflow.
    }
  }

  function recordV1PageView() {
    if (isOpsPage()) return readV1State();
    return mutateV1(state => {
      incrementCounter(state, "linkOpens");
    });
  }

  function recordV2PageViewAndArrival() {
    if (isOpsPage()) return readV2State();
    const referral = referralSource();
    const target = targetSource();
    const region = regionSource();
    let backendArrivalId = "";
    let shouldReportArrival = false;
    return mutateV2(state => {
      incrementCounter(state, "pageViews");
      pushEvent(state, {
        type: "page_view",
        path: pagePath(),
        referralSource: referral,
        targetSource: target,
        region
      });
      let arrivalId = "";
      try {
        arrivalId = window.sessionStorage.getItem(V2_ARRIVAL_SESSION_KEY) || "";
      } catch (error) {
        arrivalId = "";
      }
      if (!arrivalId) {
        arrivalId = createArrivalId();
        try {
          window.sessionStorage.setItem(V2_ARRIVAL_SESSION_KEY, arrivalId);
        } catch (error) {}
        backendArrivalId = arrivalId;
        shouldReportArrival = true;
        incrementCounter(state, "arrivals");
        incrementSource(state.sources.referrals, referral);
        incrementSource(state.sources.targets, target);
        incrementSource(state.sources.regions, region);
        pushEvent(state, {
          type: "arrival",
          arrivalId,
          entryPath: pagePath(),
          referralSource: referral,
          targetSource: target,
          region
        });
      }
      reportBackendEvent("pageView", {
        arrival_id: arrivalId || backendArrivalId || undefined,
        referral_source: referral,
        target_source: target,
        region,
        metadata: { source: "ops-v3" }
      });
      if (shouldReportArrival) {
        reportBackendEvent("arrival", {
          arrival_id: backendArrivalId,
          referral_source: referral,
          target_source: target,
          region,
          metadata: { source: "ops-v3", entry_path: pagePath() }
        });
      }
    });
  }

  function recordLinkOpen() {
    recordV1PageView();
    return recordV2PageViewAndArrival();
  }

  function recordSessionStarted() {
    mutateV1(state => {
      incrementCounter(state, "sessionsStarted");
    });
    const state = mutateV2(state => {
      incrementCounter(state, "sessionsStarted");
      pushEvent(state, { type: "session_started", path: pagePath() });
    });
    reportBackendEvent("sessionStart", { metadata: { source: "ops-v3" } });
    return state;
  }

  function recordShowResults() {
    mutateV1(state => {
      incrementCounter(state, "showResults");
    });
    const state = mutateV2(state => {
      incrementCounter(state, "showResults");
      pushEvent(state, { type: "show_results", path: pagePath() });
    });
    reportBackendEvent("showResults", { metadata: { source: "ops-v3" } });
    return state;
  }

  function recordSessionSaved(session, options) {
    mutateV1(state => {
      incrementCounter(state, "sessionsSaved");
      if (options && options.hadSavedHistoryBefore) incrementCounter(state, "returnShooters");
      const day = dateKeyFromSession(session);
      if (!state.shootingDays.includes(day)) state.shootingDays.push(day);
      state.shootingDays.sort();
    });
    const state = mutateV2(state => {
      incrementCounter(state, "sessionsSaved");
      if (options && options.hadSavedHistoryBefore) incrementCounter(state, "returnShooters");
      const day = dateKeyFromSession(session);
      if (!state.shootingDays.includes(day)) state.shootingDays.push(day);
      state.shootingDays.sort();
      pushEvent(state, {
        type: "session_saved",
        path: pagePath(),
        date: day,
        returnShooter: !!(options && options.hadSavedHistoryBefore)
      });
    });
    const sessionId = session && (session.id || session.sessionId || session.sessionNumber);
    reportBackendEvent("sessionSaved", {
      session_id: sessionId ? String(sessionId) : undefined,
      metadata: { source: "ops-v3", date: dateKeyFromSession(session) }
    });
    if (options && options.hadSavedHistoryBefore) {
      reportBackendEvent("returnShooter", {
        session_id: sessionId ? String(sessionId) : undefined,
        metadata: { source: "ops-v3", date: dateKeyFromSession(session) }
      });
    }
    return state;
  }

  function snapshot() {
    const v1 = readV1State();
    const v2 = readV2State();
    return {
      version: 2,
      arrivals: Number(v2.counters.arrivals || 0),
      pageViews: Number(v2.counters.pageViews || 0),
      legacyPageViews: Number(v1.counters.linkOpens || 0),
      sessionsStarted: Number(v2.counters.sessionsStarted || 0),
      showResults: Number(v2.counters.showResults || 0),
      sessionsSaved: Number(v2.counters.sessionsSaved || 0),
      returnShooters: Number(v2.counters.returnShooters || 0),
      shootingDays: Array.isArray(v2.shootingDays) ? v2.shootingDays.length : 0,
      shootingDayKeys: Array.isArray(v2.shootingDays) ? v2.shootingDays.slice() : [],
      referrals: { ...(v2.sources.referrals || {}) },
      targets: { ...(v2.sources.targets || {}) },
      regions: { ...(v2.sources.regions || {}) },
      v1: {
        linkOpens: Number(v1.counters.linkOpens || 0),
        sessionsStarted: Number(v1.counters.sessionsStarted || 0),
        showResults: Number(v1.counters.showResults || 0),
        sessionsSaved: Number(v1.counters.sessionsSaved || 0),
        returnShooters: Number(v1.counters.returnShooters || 0),
        shootingDays: Array.isArray(v1.shootingDays) ? v1.shootingDays.length : 0
      }
    };
  }

  function reset() {
    writeJson(V1_STORAGE_KEY, clone(DEFAULT_V1_STATE));
    writeJson(V2_STORAGE_KEY, clone(DEFAULT_V2_STATE));
    try {
      window.sessionStorage.removeItem(V2_ARRIVAL_SESSION_KEY);
    } catch (error) {}
    return snapshot();
  }

  window.SCZN3Ops = {
    recordLinkOpen,
    recordSessionStarted,
    recordShowResults,
    recordSessionSaved,
    snapshot,
    reset
  };

  try {
    recordLinkOpen();
  } catch (error) {
    // Operations telemetry must never affect shooter workflow.
  }
})();
