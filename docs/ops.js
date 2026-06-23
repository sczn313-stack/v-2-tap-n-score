(function () {
  "use strict";

  const STORAGE_KEY = "SCZN3_OPS_V1";
  const DEFAULT_STATE = {
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

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function readState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneDefaultState();
      const parsed = JSON.parse(raw);
      const fresh = cloneDefaultState();
      return {
        ...fresh,
        ...parsed,
        counters: { ...fresh.counters, ...(parsed && parsed.counters ? parsed.counters : {}) },
        shootingDays: Array.isArray(parsed && parsed.shootingDays) ? parsed.shootingDays : []
      };
    } catch (error) {
      return cloneDefaultState();
    }
  }

  function writeState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Operations telemetry must never affect shooter workflow.
    }
  }

  function mutate(mutator) {
    try {
      const state = readState();
      mutator(state);
      writeState(state);
      return state;
    } catch (error) {
      return readState();
    }
  }

  function increment(counterName) {
    return mutate(state => {
      state.counters[counterName] = Number(state.counters[counterName] || 0) + 1;
    });
  }

  function dateKeyFromSession(session) {
    const source = session && (session.savedAt || session.timestamp || session.updatedAt || session.createdAt);
    const date = source ? new Date(source) : new Date();
    if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
    return date.toISOString().slice(0, 10);
  }

  function recordLinkOpen() {
    const path = (window.location && window.location.pathname ? window.location.pathname : "").toLowerCase();
    if (path.endsWith("/ops.html") || path === "/ops.html") return readState();
    return increment("linkOpens");
  }

  function recordSessionStarted() {
    return increment("sessionsStarted");
  }

  function recordShowResults() {
    return increment("showResults");
  }

  function recordSessionSaved(session, options) {
    return mutate(state => {
      state.counters.sessionsSaved = Number(state.counters.sessionsSaved || 0) + 1;
      if (options && options.hadSavedHistoryBefore) {
        state.counters.returnShooters = Number(state.counters.returnShooters || 0) + 1;
      }
      const day = dateKeyFromSession(session);
      if (!state.shootingDays.includes(day)) state.shootingDays.push(day);
      state.shootingDays.sort();
    });
  }

  function snapshot() {
    const state = readState();
    return {
      linkOpens: Number(state.counters.linkOpens || 0),
      sessionsStarted: Number(state.counters.sessionsStarted || 0),
      showResults: Number(state.counters.showResults || 0),
      sessionsSaved: Number(state.counters.sessionsSaved || 0),
      returnShooters: Number(state.counters.returnShooters || 0),
      shootingDays: Array.isArray(state.shootingDays) ? state.shootingDays.length : 0,
      shootingDayKeys: Array.isArray(state.shootingDays) ? state.shootingDays.slice() : []
    };
  }

  function reset() {
    writeState(cloneDefaultState());
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
