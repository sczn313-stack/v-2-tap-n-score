/* ============================================================
   docs/index.js — FULL REPLACEMENT
   DASHBOARD SEC
============================================================ */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    landingView: $("landingView"),
    workspaceView: $("workspaceView"),

    historyBtn: $("historyBtn"),
    backBtn: $("backBtn"),

    photoBtn: $("photoBtn"),
    photoInput: $("photoInput"),

    targetWrap: $("targetWrap"),
    targetImg: $("targetImg"),
    dotsLayer: $("dotsLayer"),

    shotCount: $("shotCount"),
    undoBtn: $("undoBtn"),
    clearBtn: $("clearBtn"),
    showResultsBtn: $("showResultsBtn"),

    instructionLine: $("instructionLine"),
    statusLine: $("statusLine"),

    freezeScrim: $("freezeScrim"),

    secOverlay: $("secOverlay"),
    secBackBtn: $("secBackBtn"),
    saveSecBtn: $("saveSecBtn"),

    secShotCount: $("secShotCount"),
    secStatus: $("secStatus"),
    secWindage: $("secWindage"),
    secElevation: $("secElevation"),

    secScore: $("secScore"),
    secScoreBand: $("secScoreBand"),
    secElevationCount: $("secElevationCount"),
    secElevationDir: $("secElevationDir"),
    secWindageCount: $("secWindageCount"),
    secWindageDir: $("secWindageDir"),
    secSessionLine: $("secSessionLine"),
    secVendorName: $("secVendorName"),
    secThumbImg: $("secThumbImg"),
    secThumbFallback: $("secThumbFallback"),

    historyAvg: $("historyAvg"),
    historyBest: $("historyBest"),
    historyTrend: $("historyTrend"),
    historyList: $("historyList"),
    historyEmpty: $("historyEmpty")
  };

  const HISTORY_KEY = "SCZN3_HISTORY_V3";
  const HISTORY_LIMIT = 10;

  let objectUrl = null;
  let suppressNextPop = false;
  let pointerStart = null;
  let activePointerId = null;

  const state = {
    view: "landing",
    imageSrc: "",
    aim: null,
    shots: [],
    frozen: false
  };

  function pushHistoryForView(view) {
    suppressNextPop = true;
    history.pushState({ view }, "", window.location.href);
    setTimeout(() => {
      suppressNextPop = false;
    }, 0);
  }

  function setView(view, pushHistory = false) {
    state.view = view;

    if (view === "landing") {
      els.landingView?.classList.remove("scoreHidden");
      els.workspaceView?.classList.add("scoreHidden");
      window.scrollTo(0, 0);
    } else {
      els.landingView?.classList.add("scoreHidden");
      els.workspaceView?.classList.remove("scoreHidden");
      window.scrollTo(0, 0);
    }

    if (pushHistory) pushHistoryForView(view);
  }

  function hideOverlay() {
    els.freezeScrim?.classList.add("isHidden");
    els.secOverlay?.classList.add("isHidden");
  }

  function showSECOverlay() {
    els.freezeScrim?.classList.remove("isHidden");
    els.secOverlay?.classList.remove("isHidden");
  }

  function clearImageElement() {
    if (els.targetImg) {
      els.targetImg.removeAttribute("src");
      els.targetImg.src = "";
    }
    if (els.photoInput) els.photoInput.value = "";

    if (objectUrl) {
      try { URL.revokeObjectURL(objectUrl); } catch {}
      objectUrl = null;
    }
  }

  function resetSession() {
    state.imageSrc = "";
    state.aim = null;
    state.shots = [];
    state.frozen = false;
    pointerStart = null;
    activePointerId = null;
    clearImageElement();
    hideOverlay();
    if (els.dotsLayer) els.dotsLayer.innerHTML = "";
  }

  function hardResetSession() {
    try { sessionStorage.clear(); } catch {}
    resetSession();
    setView("landing", false);
    renderAll();
  }

  function updateButtons() {
    const hasWork = !!state.aim || state.shots.length > 0;
    if (els.undoBtn) els.undoBtn.disabled = !hasWork;
    if (els.clearBtn) els.clearBtn.disabled = !hasWork;
    if (els.showResultsBtn) els.showResultsBtn.disabled = !(state.aim && state.shots.length > 0);
  }

  function updateUI() {
    if (els.shotCount) els.shotCount.textContent = String(state.shots.length);
    updateButtons();

    if (!state.imageSrc) {
      if (els.instructionLine) els.instructionLine.textContent = "Add a target photo.";
      if (els.statusLine) els.statusLine.textContent = "Tap to begin.";
      return;
    }

    if (!state.aim) {
      if (els.instructionLine) els.instructionLine.textContent = "Tap aim point.";
      if (els.statusLine) els.statusLine.textContent = "First tap sets aim.";
      return;
    }

    if (state.shots.length >= 7) {
      if (els.instructionLine) els.instructionLine.textContent = "Maximum 7 shots reached.";
      if (els.statusLine) els.statusLine.textContent = `${state.shots.length} shot(s) recorded`;
      return;
    }

    if (els.instructionLine) els.instructionLine.textContent = `Tap shot ${state.shots.length + 1}`;
    if (els.statusLine) els.statusLine.textContent = `${state.shots.length} shot(s) recorded`;
  }

  function getWrapSize() {
    const rect = els.targetWrap?.getBoundingClientRect();
    return { width: rect?.width || 0, height: rect?.height || 0 };
  }

  function getShotDisplayPositions() {
    const { width, height } = getWrapSize();
    if (!width || !height) return state.shots.map((shot) => ({ x: shot.x, y: shot.y }));

    const placed = [];
    const offsets = [
      { x: 0, y: 0 }, { x: 14, y: 0 }, { x: -14, y: 0 }, { x: 0, y: -14 },
      { x: 0, y: 14 }, { x: 12, y: -12 }, { x: -12, y: -12 }, { x: 12, y: 12 },
      { x: -12, y: 12 }, { x: 20, y: 0 }, { x: -20, y: 0 }, { x: 0, y: -20 }, { x: 0, y: 20 }
    ];
    const minDist = 24;

    state.shots.forEach((shot) => {
      const basePx = { x: shot.x * width, y: shot.y * height };
      let chosen = { ...basePx };

      for (const off of offsets) {
        const candidate = { x: basePx.x + off.x, y: basePx.y + off.y };
        const overlaps = placed.some((p) => Math.hypot(candidate.x - p.x, candidate.y - p.y) < minDist);
        if (!overlaps) {
          chosen = candidate;
          break;
        }
      }

      chosen.x = Math.max(14, Math.min(width - 14, chosen.x));
      chosen.y = Math.max(14, Math.min(height - 14, chosen.y));
      placed.push(chosen);
    });

    return placed.map((p) => ({ x: p.x / width, y: p.y / height }));
  }

  function renderDots() {
    if (!els.dotsLayer) return;
    els.dotsLayer.innerHTML = "";

    if (state.aim) {
      const d = document.createElement("div");
      d.className = "aimDot";
      d.style.left = `${state.aim.x * 100}%`;
      d.style.top = `${state.aim.y * 100}%`;
      els.dotsLayer.appendChild(d);
    }

    const displayPositions = getShotDisplayPositions();
    state.shots.forEach((shot, i) => {
      const pos = displayPositions[i] || shot;
      const d = document.createElement("div");
      d.className = "hitDot";
      d.style.left = `${pos.x * 100}%`;
      d.style.top = `${pos.y * 100}%`;
      d.textContent = String(i + 1);
      els.dotsLayer.appendChild(d);
    });
  }

  function renderAll() {
    updateUI();
    renderDots();
  }

  function getPointFromClient(clientX, clientY) {
    const rect = els.targetWrap.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    };
  }

  function onPointerDown(e) {
    if (!state.imageSrc || state.frozen) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    activePointerId = e.pointerId;
    pointerStart = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e) {
    if (!state.imageSrc || state.frozen) return;
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    if (!pointerStart) return;

    const moved = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y);
    activePointerId = null;

    if (moved > 12) {
      pointerStart = null;
      return;
    }

    const p = getPointFromClient(e.clientX, e.clientY);

    if (!state.aim) state.aim = p;
    else if (state.shots.length < 7) state.shots.push(p);

    pointerStart = null;
    renderAll();
  }

  function onPointerCancel() {
    pointerStart = null;
    activePointerId = null;
  }

  function undo() {
    if (state.frozen) return;
    if (state.shots.length > 0) state.shots.pop();
    else state.aim = null;
    renderAll();
  }

  function clearAll() {
    if (state.frozen) return;
    state.aim = null;
    state.shots = [];
    renderAll();
  }

  function formatClicksText(dir, count) {
    if (count === 0 || dir === "HOLD") return "HOLD";
    const noun = count === 1 ? "CLICK" : "CLICKS";
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
    if (!els.secScoreBand) return;
    const band = getScoreBand(score);
    els.secScoreBand.textContent = band.text;
    els.secScoreBand.style.background = band.bg;
    els.secScoreBand.style.color = band.fg;
  }

  function openSEC(push = true) {
    if (!state.aim || state.shots.length === 0) return;

    state.frozen = true;
    setView("results", push);

    const values = computeSECValues();
    if (!values) return;

    addHistoryEntry({
      createdAt: new Date().toISOString(),
      shots: values.shotCount,
      windage: values.windageText,
      elevation: values.elevationText,
      windageCount: values.windageCount,
      elevationCount: values.elevationCount,
      score: values.score
    });

    showSECOverlay();

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
    state.frozen = false;
    hideOverlay();
    setView("workspace", push);
  }

  function openHistoryShortcut() {
    if (!loadHistory().length) return;

    state.frozen = true;
    setView("results", true);
    showSECOverlay();

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

  function goBack(push = false) {
    if (state.view === "results") {
      closeSEC(push);
      return;
    }

    if (state.view === "workspace") {
      resetSession();
      setView("landing", push);
      renderAll();
      return;
    }

    history.back();
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function fillVerticalGradient(ctx, width, height) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#071743");
    grad.addColorStop(0.42, "#041652");
    grad.addColorStop(1, "#02103d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function fitValueText(ctx, text, maxWidth, startSize, minSize) {
    let size = startSize;
    while (size > minSize) {
      ctx.font = `900 ${size}px -apple-system, BlinkMacSystemFont, Segoe UI, Arial`;
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 2;
    }
    return minSize;
  }

  function save() {
    const values = {
      score: String(els.secScore?.textContent || "0"),
      band: String(els.secScoreBand?.textContent || "SOLID"),
      elevCount: String(els.secElevationCount?.textContent || "0"),
      elevDir: String(els.secElevationDir?.textContent || "UP"),
      windCount: String(els.secWindageCount?.textContent || "0"),
      windDir: String(els.secWindageDir?.textContent || "RIGHT"),
      session: String(els.secSessionLine?.textContent || "—"),
      vendor: String(els.secVendorName?.textContent || "Vendor Not Set"),
      avg: String(els.historyAvg?.textContent || "—"),
      best: String(els.historyBest?.textContent || "—"),
      trend: String(els.historyTrend?.textContent || "—")
    };

    const width = 1600;
    const height = 2200;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    fillVerticalGradient(ctx, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, 40, 40, width - 80, height - 80, 32);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "900 76px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("SEC", 80, 110);

    ctx.font = "800 32px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.fillText("Shooter Experience Card", width - 520, 110);

    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.fillText("YOUR SCORE", 80, 210);

    ctx.font = "900 160px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(values.score, 80, 360);

    const band = getScoreBand(Number(values.score) || 0);
    roundRect(ctx, 80, 395, 250, 70, 35);
    ctx.fillStyle = band.bg;
    ctx.fill();
    ctx.fillStyle = band.fg;
    ctx.font = "900 34px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.band, 130, 442);

    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("OFFICIAL TARGET PARTNER", 840, 210);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 58px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.vendor, 840, 280);

    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("TARGET THUMBNAIL", 840, 420);

    roundRect(ctx, 840, 460, 620, 360, 28);
    ctx.fillStyle = "rgba(255,255,255,.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (state.imageSrc) {
      const img = new Image();
      img.onload = () => {
        const boxX = 840;
        const boxY = 460;
        const boxW = 620;
        const boxH = 360;

        const scale = Math.min((boxW - 40) / img.width, (boxH - 40) / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const drawX = boxX + (boxW - drawW) / 2;
        const drawY = boxY + (boxH - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        finishSaveCanvas(ctx, canvas, values);
      };
      img.src = state.imageSrc;
      return;
    }

    finishSaveCanvas(ctx, canvas, values);
  }

  function finishSaveCanvas(ctx, canvas, values) {
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("SCOPE CORRECTION", 80, 560);

    roundRect(ctx, 80, 600, 700, 130, 24);
    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 70px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.elevCount, 120, 685);

    ctx.fillStyle = "#69a8ff";
    ctx.font = "900 62px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.elevDir, 180, 685);

    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.font = "900 50px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("•", 420, 680);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 70px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.windCount, 500, 685);

    ctx.fillStyle = "#ff7987";
    ctx.font = "900 62px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.windDir, 560, 685);

    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("SESSION", 80, 850);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 58px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.session, 80, 920);

    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("SESSION HISTORY", 80, 1100);

    roundRect(ctx, 80, 1140, 1440, 90, 18);
    ctx.fillStyle = "rgba(255,255,255,.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 30px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(`Avg: ${values.avg}`, 110, 1198);
    ctx.fillText(`Best: ${values.best}`, 320, 1198);
    ctx.fillText(`Trend: ${values.trend}`, 560, 1198);

    const items = loadHistory();
    let y = 1260;
    const col1X = 80;
    const col2X = 805;
    const cardW = 635;
    const cardH = 145;

    items.slice(0, 10).forEach((item, i) => {
      const colX = i < 5 ? col1X : col2X;
      const rowIndex = i < 5 ? i : i - 5;
      const cardY = y + rowIndex * (cardH + 20);

      roundRect(ctx, colX, cardY, cardW, cardH, 18);
      ctx.fillStyle = "rgba(255,255,255,.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "rgba(184,197,234,1)";
      ctx.font = "900 18px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
      ctx.fillText(`#${i + 1}`, colX + 20, cardY + 30);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 24px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
      ctx.fillText(`Score ${item.score}`, colX + 20, cardY + 66);
      ctx.fillText(`${item.shots} Hits`, colX + 220, cardY + 66);
      ctx.fillText(item.windage, colX + 20, cardY + 102);
      ctx.fillText(item.elevation, colX + 20, cardY + 132);
    });

    const link = document.createElement("a");
    link.download = `sczn3-sec-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function loadImage(file) {
    if (!file) return;

    if (objectUrl) {
      try { URL.revokeObjectURL(objectUrl); } catch {}
    }

    objectUrl = URL.createObjectURL(file);

    state.imageSrc = objectUrl;
    state.aim = null;
    state.shots = [];
    state.frozen = false;

    hideOverlay();

    if (els.targetImg) {
      els.targetImg.onload = () => {
        window.scrollTo(0, 0);
      };
      els.targetImg.src = objectUrl;
    }

    setView("workspace", true);
    renderAll();
  }

  function bind() {
    els.photoBtn?.addEventListener("click", () => {
      els.photoInput?.click();
    });

    els.photoInput?.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) loadImage(file);
    });

    els.targetWrap?.addEventListener("pointerdown", onPointerDown);
    els.targetWrap?.addEventListener("pointerup", onPointerUp);
    els.targetWrap?.addEventListener("pointercancel", onPointerCancel);

    els.historyBtn?.addEventListener("click", openHistoryShortcut);
    els.backBtn?.addEventListener("click", () => goBack(true));
    els.undoBtn?.addEventListener("click", undo);
    els.clearBtn?.addEventListener("click", clearAll);
    els.showResultsBtn?.addEventListener("click", () => openSEC(true));

    els.secBackBtn?.addEventListener("click", () => closeSEC(false));
    els.saveSecBtn?.addEventListener("click", save);

    window.addEventListener("pageshow", (e) => {
      if (e.persisted) window.location.reload();
    });

    window.addEventListener("popstate", () => {
      if (suppressNextPop) return;

      if (state.view === "results") {
        closeSEC(false);
        return;
      }

      if (state.view === "workspace") {
        resetSession();
        setView("landing", false);
        renderAll();
      }
    });
  }

  function init() {
    bind();
    history.replaceState({ view: "landing" }, "", window.location.href);
    renderHistoryInSEC();
    hardResetSession();
    console.log("SEC DASHBOARD ACTIVE");
  }

  init();
})();
