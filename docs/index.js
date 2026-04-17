/* ============================================================
   docs/index.js — FULL REPLACEMENT
   CLEAN START + NO AUTO RELOAD / NO SESSION RESTORE
============================================================ */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    landingView: $("landingView"),
    workspaceView: $("workspaceView"),

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
    closeSecBtn: $("closeSecBtn"),
    saveSecBtn: $("saveSecBtn"),

    secShotCount: $("secShotCount"),
    secStatus: $("secStatus"),
    secWindage: $("secWindage"),
    secElevation: $("secElevation")
  };

  let objectUrl = null;

  const state = {
    imageSrc: "",
    aim: null,
    shots: [],
    frozen: false
  };

  function showLanding() {
    els.landingView?.classList.remove("scoreHidden");
    els.workspaceView?.classList.add("scoreHidden");
  }

  function showWorkspace() {
    els.landingView?.classList.add("scoreHidden");
    els.workspaceView?.classList.remove("scoreHidden");
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
    if (els.photoInput) {
      els.photoInput.value = "";
    }
    if (objectUrl) {
      try { URL.revokeObjectURL(objectUrl); } catch {}
      objectUrl = null;
    }
  }

  function hardResetSession() {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}

    state.imageSrc = "";
    state.aim = null;
    state.shots = [];
    state.frozen = false;

    clearImageElement();
    hideOverlay();

    if (els.dotsLayer) {
      els.dotsLayer.innerHTML = "";
    }

    showLanding();
    renderAll();
  }

  function updateUI() {
    if (els.shotCount) {
      els.shotCount.textContent = String(state.shots.length);
    }

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

    state.shots.forEach((shot, i) => {
      const d = document.createElement("div");
      d.className = "hitDot";
      d.style.left = `${shot.x * 100}%`;
      d.style.top = `${shot.y * 100}%`;
      d.textContent = String(i + 1);
      els.dotsLayer.appendChild(d);
    });
  }

  function renderAll() {
    updateUI();
    renderDots();
  }

  function getPoint(e) {
    const rect = els.targetWrap.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    };
  }

  function handleTap(e) {
    if (!state.imageSrc || state.frozen) return;

    const p = getPoint(e);

    if (!state.aim) {
      state.aim = p;
    } else if (state.shots.length < 7) {
      state.shots.push(p);
    }

    renderAll();
  }

  function undo() {
    if (state.frozen) return;

    if (state.shots.length) {
      state.shots.pop();
    } else {
      state.aim = null;
    }
    renderAll();
  }

  function clearAll() {
    if (state.frozen) return;

    state.aim = null;
    state.shots = [];
    renderAll();
  }

  function openSEC() {
    if (!state.aim || state.shots.length === 0) return;

    state.frozen = true;

    const avgX = state.shots.reduce((s, p) => s + p.x, 0) / state.shots.length;
    const avgY = state.shots.reduce((s, p) => s + p.y, 0) / state.shots.length;

    const dx = avgX - state.aim.x;
    const dy = avgY - state.aim.y;

    const windageDir = dx > 0 ? "LEFT" : dx < 0 ? "RIGHT" : "HOLD";
    const elevationDir = dy > 0 ? "UP" : dy < 0 ? "DOWN" : "HOLD";

    const windage = Math.round(Math.abs(dx) * 100);
    const elevation = Math.round(Math.abs(dy) * 100);

    els.freezeScrim?.classList.remove("isHidden");
    els.secOverlay?.classList.remove("isHidden");

    if (els.secShotCount) els.secShotCount.textContent = String(state.shots.length);
    if (els.secStatus) els.secStatus.textContent = "Results Ready";
    if (els.secWindage) els.secWindage.textContent = windage === 0 ? "HOLD" : `${windageDir} ${windage}`;
    if (els.secElevation) els.secElevation.textContent = elevation === 0 ? "HOLD" : `${elevationDir} ${elevation}`;
  }

  function closeSEC() {
    state.frozen = false;
    hideOverlay();
  }

  function save() {
    alert("Save wired next step");
  }

  function loadImage(file) {
    if (!file) return;

    clearImageElement();

    objectUrl = URL.createObjectURL(file);
    state.imageSrc = objectUrl;
    state.aim = null;
    state.shots = [];
    state.frozen = false;

    hideOverlay();

    if (els.targetImg) {
      els.targetImg.src = objectUrl;
    }

    showWorkspace();
    renderAll();
  }

  function bind() {
    els.photoBtn?.addEventListener("click", () => els.photoInput?.click());

    els.photoInput?.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) loadImage(file);
    });

    els.targetWrap?.addEventListener("click", handleTap);
    els.targetWrap?.addEventListener("touchend", (e) => {
      e.preventDefault();
      handleTap(e.changedTouches ? e.changedTouches[0] : e);
    }, { passive: false });

    els.undoBtn?.addEventListener("click", undo);
    els.clearBtn?.addEventListener("click", clearAll);
    els.showResultsBtn?.addEventListener("click", openSEC);

    els.closeSecBtn?.addEventListener("click", closeSEC);
    els.saveSecBtn?.addEventListener("click", save);

    window.addEventListener("pageshow", () => {
      hardResetSession();
    });

    window.addEventListener("load", () => {
      hardResetSession();
    });
  }

  function init() {
    bind();
    hardResetSession();
    console.log("CLEAN START ACTIVE");
  }

  init();
})();
