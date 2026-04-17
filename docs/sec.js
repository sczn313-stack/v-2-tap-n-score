/* ============================================================
   docs/sec.js — NEW FILE
   SEC / HISTORY / SCORE LOGIC
============================================================ */

(() => {
  "use strict";

  window.SCZN3 = window.SCZN3 || {};

  const HISTORY_KEY = "SCZN3_HISTORY_V3";
  const HISTORY_LIMIT = 10;

  function getCtx() {
    return {
      els: window.SCZN3.els,
      state: window.SCZN3.state,
      app: window.SCZN3.app
    };
  }

  function formatClicksText(dir, count) {
    if (count === 0 || dir === "HOLD") return "HOLD";
    return `${count} CLICKS ${dir}`.replace("1 CLICKS", "1 CLICK");
  }

  function formatStatusText(shotCount) {
    return `${shotCount} SHOTS RECORDED`;
  }

  function getScoreBand(score) {
    if (score >= 90) return { text: "EXCELLENT", bg: "#6cf08e", fg: "#0b2013" };
    if (score >= 75) return { text: "SOLID", bg: "#f0da62", fg: "#15130a" };
    if (score >= 60) return { text: "IMPROVING", bg: "#ffb761", fg: "#201307" };
    return { text: "NEEDS WORK", bg: "#ff7b7b", fg: "#280d0d" };
  }

  function scoreFromCounts(windageCount, elevationCount) {
    return Math.max(0, 100 - (windageCount + elevationCount));
  }

  function computeSECValues() {
    const { state } = getCtx();
    if (!state.aim || state.shots.length === 0) return null;

    const avgX = state.shots.reduce((sum, p) => sum + p.x, 0) / state.shots.length;
    const avgY = state.shots.reduce((sum, p) => sum + p.y, 0) / state.shots.length;

    const dx = avgX - state.aim.x;
    const dy = avgY - state.aim.y;

    const windageDir = dx > 0 ? "LEFT" : dx < 0 ? "RIGHT" : "HOLD";
    const elevationDir = dy > 0 ? "UP" : dy < 0 ? "DOWN" : "HOLD";

    const windageCount = Math.round(Math.abs(dx) * 100);
    const elevationCount = Math.round(Math.abs(dy) * 100);
    const score = scoreFromCounts(windageCount, elevationCount);

    return {
      shotCount: state.shots.length,
      statusText: formatStatusText(state.shots.length),
      windageText: formatClicksText(windageDir, windageCount),
      elevationText: formatClicksText(elevationDir, elevationCount),
      windageDir,
      elevationDir,
      windageCount,
      elevationCount,
      score
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

    if (!els.historyList) return;

    items.forEach((item, index) => {
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
      els.historyList.appendChild(card);
    });
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
    const { els, app } = getCtx();
    const values = computeSECValues();
    if (!values) return;

    getCtx().state.frozen = true;
    app.setView("results", push);

    addHistoryEntry({
      createdAt: new Date().toISOString(),
      shots: values.shotCount,
      windage: values.windageText,
      elevation: values.elevationText,
      windageCount: values.windageCount,
      elevationCount: values.elevationCount,
      score: values.score
    });

    app.showSECOverlay();

    if (els.secShotCount) els.secShotCount.textContent = String(values.shotCount);
    if (els.secStatus) els.secStatus.textContent = values.statusText;
    if (els.secWindage) els.secWindage.textContent = values.windageText;
    if (els.secElevation) els.secElevation.textContent = values.elevationText;

    if (els.secScore) els.secScore.textContent = String(values.score);
    if (els.secElevationCount) els.secElevationCount.textContent = String(values.elevationCount);
    if (els.secWindageCount) els.secWindageCount.textContent = String(values.windageCount);
    if (els.secElevationDir) els.secElevationDir.textContent = values.elevationDir;
    if (els.secWindageDir) els.secWindageDir.textContent = values.windageDir;
    if (els.secSessionLine) els.secSessionLine.textContent = `${values.shotCount} hits`;
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

    if (els.secShotCount) els.secShotCount.textContent = "—";
    if (els.secStatus) els.secStatus.textContent = "HISTORY VIEW";
    if (els.secWindage) els.secWindage.textContent = "—";
    if (els.secElevation) els.secElevation.textContent = "—";
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
