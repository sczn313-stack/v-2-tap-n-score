/* ============================================================
   docs/sec.js — FULL REPLACEMENT
   SEC / HISTORY / SCORE LOGIC
   DESKTOP BOARD + MOBILE STACK
============================================================ */

(() => {
  "use strict";

  window.SCZN3 = window.SCZN3 || {};

  const HISTORY_KEY = "SCZN3_HISTORY_V5";
  const HISTORY_LIMIT = 10;

  const DEFAULTS = {
    targetWIn: 8.5,
    targetHIn: 11,
    rangeYds: 100,
    dialUnit: "MOA",
    clickValue: 0.25
  };

  function getCtx() {
    return {
      els: window.SCZN3.els,
      state: window.SCZN3.state,
      app: window.SCZN3.app
    };
  }

  function clampNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  function getRealWorldConfig() {
    const state = getCtx().state || {};

    return {
      targetWIn: clampNumber(state.targetWIn, DEFAULTS.targetWIn),
      targetHIn: clampNumber(state.targetHIn, DEFAULTS.targetHIn),
      rangeYds: clampNumber(state.rangeYds, DEFAULTS.rangeYds),
      dialUnit: (state.dialUnit || DEFAULTS.dialUnit).toUpperCase(),
      clickValue: clampNumber(state.clickValue, DEFAULTS.clickValue)
    };
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function formatClicksText(dir, count) {
    if (count === 0 || dir === "HOLD") return "HOLD";
    return `${count} CLICKS ${dir}`.replace("1 CLICKS", "1 CLICK");
  }

  function getScoreBand(score) {
    if (score >= 90) return { text: "EXCELLENT", bg: "#6cf08e", fg: "#0b2013", cls: "scoreGood" };
    if (score >= 75) return { text: "SOLID", bg: "#f0da62", fg: "#15130a", cls: "scoreSolid" };
    if (score >= 60) return { text: "IMPROVING", bg: "#ffb761", fg: "#201307", cls: "scoreMid" };
    return { text: "NEEDS WORK", bg: "#ff7b7b", fg: "#280d0d", cls: "scoreLow" };
  }

  function getInchesPerUnit(rangeYds, dialUnit) {
    if (dialUnit === "MRAD") return 3.6 * (rangeYds / 100);
    return 1.047 * (rangeYds / 100);
  }

  function scoreFromPhysicalOffset(dxInches, dyInches) {
    const distance = Math.sqrt((dxInches * dxInches) + (dyInches * dyInches));
    const raw = 100 - (distance * 10);
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  function formatStatusText(shotCount) {
    return `${shotCount} SHOTS RECORDED`;
  }

  function formatSessionLine(rangeYds, shotCount) {
    return `${rangeYds} yds • ${shotCount} hits`;
  }

  function computeSECValues() {
    const { state } = getCtx();
    if (!state.aim || state.shots.length === 0) return null;

    const cfg = getRealWorldConfig();

    const avgX = state.shots.reduce((sum, p) => sum + p.x, 0) / state.shots.length;
    const avgY = state.shots.reduce((sum, p) => sum + p.y, 0) / state.shots.length;

    const dx = avgX - state.aim.x;
    const dy = avgY - state.aim.y;

    const dxInches = dx * cfg.targetWIn;
    const dyInches = dy * cfg.targetHIn;

    const windageDir = dxInches > 0 ? "LEFT" : dxInches < 0 ? "RIGHT" : "RIGHT";
    const elevationDir = dyInches > 0 ? "UP" : dyInches < 0 ? "DOWN" : "UP";

    const inchesPerUnit = getInchesPerUnit(cfg.rangeYds, cfg.dialUnit);
    const windageAngular = Math.abs(dxInches) / inchesPerUnit;
    const elevationAngular = Math.abs(dyInches) / inchesPerUnit;

    const windageCount = Math.round(windageAngular / cfg.clickValue);
    const elevationCount = Math.round(elevationAngular / cfg.clickValue);
    const score = scoreFromPhysicalOffset(dxInches, dyInches);

    return {
      shotCount: state.shots.length,
      statusText: formatStatusText(state.shots.length),
      sessionLine: formatSessionLine(cfg.rangeYds, state.shots.length),

      windageText: formatClicksText(windageDir, windageCount),
      elevationText: formatClicksText(elevationDir, elevationCount),

      windageDir,
      elevationDir,
      windageCount,
      elevationCount,
      score,

      dx,
      dy,
      dxInches: round2(dxInches),
      dyInches: round2(dyInches),
      windageAngular: round2(windageAngular),
      elevationAngular: round2(elevationAngular),

      rangeYds: cfg.rangeYds,
      dialUnit: cfg.dialUnit,
      clickValue: cfg.clickValue,
      targetWIn: cfg.targetWIn,
      targetHIn: cfg.targetHIn
    };
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch {}
  }

  function addHistoryEntry(entry) {
    const items = loadHistory();
    items.unshift(entry);
    saveHistory(items.slice(0, HISTORY_LIMIT));
  }

  function formatHistoryTime(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  }

  function formatHistoryDateLong(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return "—";
    }
  }

  function computeTrend(items) {
    if (items.length < 6) return "→";
    const recent = items.slice(0, 3).map((i) => i.score || 0);
    const prior = items.slice(3, 6).map((i) => i.score || 0);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
    if (recentAvg > priorAvg + 1) return "↑";
    if (recentAvg < priorAvg - 1) return "↓";
    return "→";
  }

  function makeDesktopHeaderRow() {
    const row = document.createElement("div");
    row.className = "historyDesktopHeader";
    row.innerHTML = `
      <div>#</div>
      <div>SCORE</div>
      <div>YARDS</div>
      <div>HITS</div>
    `;
    return row;
  }

  function makeDesktopItem(item, index) {
    const row = document.createElement("div");
    row.className = "historyDesktopItem";

    const band = getScoreBand(item.score || 0);
    const yards = item.rangeYds ? String(item.rangeYds) : "—";
    const hits = item.shots ? String(item.shots) : "—";

    row.innerHTML = `
      <div class="historyIdxCell">#${index + 1}</div>
      <div class="historyScoreCell ${band.cls}">${item.score ?? "—"}</div>
      <div class="historyYardsCell">${yards}</div>
      <div class="historyHitsCell">${hits}</div>
      <div class="historyDateRow">${formatHistoryDateLong(item.createdAt)}</div>
    `;

    return row;
  }

  function buildDesktopBoard(items) {
    const board = document.createElement("div");
    board.className = "historyDesktopBoard";

    const left = document.createElement("div");
    left.className = "historyDesktopCol";
    left.appendChild(makeDesktopHeaderRow());

    const right = document.createElement("div");
    right.className = "historyDesktopCol";
    right.appendChild(makeDesktopHeaderRow());

    items.slice(0, 5).forEach((item, index) => {
      left.appendChild(makeDesktopItem(item, index));
    });

    items.slice(5, 10).forEach((item, index) => {
      right.appendChild(makeDesktopItem(item, index + 5));
    });

    board.appendChild(left);
    board.appendChild(right);
    return board;
  }

  function makeMobileCard(item, index) {
    const card = document.createElement("div");
    card.className = "historyCard";

    const top = document.createElement("div");
    top.className = "historyRowTop";

    const idx = document.createElement("div");
    idx.className = "historyIndex";
    idx.textContent = `#${index + 1}`;

    const time = document.createElement("div");
    time.className = "historyTime";
    time.textContent = formatHistoryTime(item.createdAt);

    top.appendChild(idx);
    top.appendChild(time);

    const main = document.createElement("div");
    main.className = "historyMain";

    const line1 = document.createElement("div");
    line1.className = "historyLine";
    line1.textContent = `Score: ${item.score} • ${item.shots} SHOTS`;

    const line2 = document.createElement("div");
    line2.className = "historyLine";
    line2.textContent = `WINDAGE: ${item.windage}`;

    const line3 = document.createElement("div");
    line3.className = "historyLine";
    line3.textContent = `ELEVATION: ${item.elevation}`;

    main.appendChild(line1);
    main.appendChild(line2);
    main.appendChild(line3);

    card.appendChild(top);
    card.appendChild(main);
    return card;
  }

  function buildMobileStack(items) {
    const stack = document.createElement("div");
    stack.className = "historyMobileStack";

    items.forEach((item, index) => {
      stack.appendChild(makeMobileCard(item, index));
    });

    return stack;
  }

  function renderHistoryInSEC() {
    const { els } = getCtx();
    const items = loadHistory();

    if (els.historyList) els.historyList.innerHTML = "";
    if (els.historyEmpty) els.historyEmpty.classList.toggle("isHidden", items.length > 0);

    if (els.historyAvg) {
      els.historyAvg.textContent = items.length
        ? String(Math.round(items.reduce((sum, item) => sum + (item.score || 0), 0) / items.length))
        : "—";
    }

    if (els.historyBest) {
      els.historyBest.textContent = items.length
        ? String(Math.max(...items.map((item) => item.score || 0)))
        : "—";
    }

    if (els.historyTrend) {
      els.historyTrend.textContent = items.length ? computeTrend(items) : "—";
    }

    if (!els.historyList || !items.length) return;

    els.historyList.appendChild(buildDesktopBoard(items));
    els.historyList.appendChild(buildMobileStack(items));
  }

  function hydrateThumb() {
    const { els, state } = getCtx();
    if (!els.secThumbImg || !els.secThumbFallback) return;

    if (state.imageSrc) {
      els.secThumbImg.src = state.imageSrc;
      els.secThumbImg.classList.remove("isHidden");
      els.secThumbFallback.classList.add("isHidden");
    } else {
      els.secThumbImg.removeAttribute("src");
      els.secThumbImg.classList.add("isHidden");
      els.secThumbFallback.classList.remove("isHidden");
    }
  }

  function applyBand(score) {
    const { els } = getCtx();
    if (!els.secScoreBand) return;

    const band = getScoreBand(score);
    els.secScoreBand.textContent = band.text;
    els.secScoreBand.style.background = band.bg;
    els.secScoreBand.style.color = band.fg;
  }

  function openSEC(push = true) {
    const { els, app, state } = getCtx();
    const values = computeSECValues();
    if (!values) return;

    state.frozen = true;
    app.setView("results", push);

    addHistoryEntry({
      createdAt: new Date().toISOString(),
      shots: values.shotCount,
      windage: values.windageText,
      elevation: values.elevationText,
      windageCount: values.windageCount,
      elevationCount: values.elevationCount,
      score: values.score,
      dxInches: values.dxInches,
      dyInches: values.dyInches,
      rangeYds: values.rangeYds,
      dialUnit: values.dialUnit,
      clickValue: values.clickValue
    });

    app.showSECOverlay();

    if (els.secScore) els.secScore.textContent = String(values.score);
    if (els.secElevationCount) els.secElevationCount.textContent = String(values.elevationCount);
    if (els.secWindageCount) els.secWindageCount.textContent = String(values.windageCount);
    if (els.secElevationDir) els.secElevationDir.textContent = values.elevationDir;
    if (els.secWindageDir) els.secWindageDir.textContent = values.windageDir;
    if (els.secSessionLine) els.secSessionLine.textContent = values.sessionLine;
    if (els.secVendorName) els.secVendorName.textContent = "Vendor Not Set";

    applyBand(values.score);
    hydrateThumb();
    renderHistoryInSEC();
  }

  function closeSEC(push = false) {
    const { app, state } = getCtx();
    state.frozen = false;
    app.hideOverlay();
    app.setView("workspace", push);
  }

  function openHistoryShortcut() {
    const { els, app, state } = getCtx();
    if (!loadHistory().length) return;

    state.frozen = true;
    app.setView("results", true);
    app.showSECOverlay();

    if (els.secScore) els.secScore.textContent = "—";
    if (els.secElevationCount) els.secElevationCount.textContent = "0";
    if (els.secWindageCount) els.secWindageCount.textContent = "0";
    if (els.secElevationDir) els.secElevationDir.textContent = "UP";
    if (els.secWindageDir) els.secWindageDir.textContent = "RIGHT";
    if (els.secSessionLine) els.secSessionLine.textContent = "History only";
    if (els.secVendorName) els.secVendorName.textContent = "Vendor Not Set";

    applyBand(75);
    hydrateThumb();
    renderHistoryInSEC();
  }

  window.SCZN3.sec = {
    HISTORY_KEY,
    HISTORY_LIMIT,
    DEFAULTS,
    computeSECValues,
    loadHistory,
    saveHistory,
    addHistoryEntry,
    formatHistoryTime,
    computeTrend,
    renderHistoryInSEC,
    hydrateThumb,
    applyBand,
    getScoreBand,
    openSEC,
    closeSEC,
    openHistoryShortcut
  };
})();
