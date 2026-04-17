/* ============================================================
   docs/index.js — FULL REPLACEMENT
   APP FLOW / STATE / TAPS / WIRING
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

  window.SCZN3 = window.SCZN3 || {};
  window.SCZN3.els = els;
  window.SCZN3.state = state;

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

  function goBack(push = false) {
    if (state.view === "results") {
      window.SCZN3.sec.closeSEC(push);
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

    els.historyBtn?.addEventListener("click", () => window.SCZN3.sec.openHistoryShortcut());
    els.backBtn?.addEventListener("click", () => goBack(true));
    els.undoBtn?.addEventListener("click", undo);
    els.clearBtn?.addEventListener("click", clearAll);
    els.showResultsBtn?.addEventListener("click", () => window.SCZN3.sec.openSEC(true));

    els.secBackBtn?.addEventListener("click", () => window.SCZN3.sec.closeSEC(false));
    els.saveSecBtn?.addEventListener("click", () => window.SCZN3.save.save());

    window.addEventListener("pageshow", (e) => {
      if (e.persisted) window.location.reload();
    });

    window.addEventListener("popstate", () => {
      if (suppressNextPop) return;

      if (state.view === "results") {
        window.SCZN3.sec.closeSEC(false);
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
    window.SCZN3.sec.renderHistoryInSEC();
    hardResetSession();
    console.log("SEC DASHBOARD SPLIT ACTIVE");
  }

  window.SCZN3.app = {
    els,
    state,
    setView,
    hideOverlay,
    showSECOverlay: () => {
      els.freezeScrim?.classList.remove("isHidden");
      els.secOverlay?.classList.remove("isHidden");
    },
    renderAll,
    resetSession,
    goBack
  };

  init();
})();
