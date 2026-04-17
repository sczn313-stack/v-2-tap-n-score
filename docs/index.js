/* ============================================================
   docs/index.js — FULL REPLACEMENT
   CONTINUOUS BACK SYSTEM + SEC OVERLAY + CLEAN STATE
============================================================ */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    landingView: $("landingView"),
    workspaceView: $("workspaceView"),

    backBtn: $("backBtn"), // 🔥 NEW

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
    view: "landing", // 🔥 landing | workspace | results
    imageSrc: "",
    aim: null,
    shots: [],
    frozen: false
  };

  /* ======================
     VIEW CONTROL
  ====================== */

  function setView(v) {
    state.view = v;

    if (v === "landing") {
      els.landingView.classList.remove("scoreHidden");
      els.workspaceView.classList.add("scoreHidden");
    }

    if (v === "workspace" || v === "results") {
      els.landingView.classList.add("scoreHidden");
      els.workspaceView.classList.remove("scoreHidden");
    }

    // 🔥 push browser state
    history.pushState({ view: v }, "");
  }

  function resetSession() {
    state.imageSrc = "";
    state.aim = null;
    state.shots = [];
    state.frozen = false;

    if (objectUrl) {
      try { URL.revokeObjectURL(objectUrl); } catch {}
      objectUrl = null;
    }

    els.targetImg.src = "";
    els.dotsLayer.innerHTML = "";

    hideOverlay();
  }

  /* ======================
     UI
  ====================== */

  function updateUI() {
    els.shotCount.textContent = state.shots.length;

    if (!state.imageSrc) {
      els.instructionLine.textContent = "Add a target photo.";
      els.statusLine.textContent = "Tap to begin.";
      return;
    }

    if (!state.aim) {
      els.instructionLine.textContent = "Tap aim point.";
      els.statusLine.textContent = "First tap sets aim.";
      return;
    }

    els.instructionLine.textContent = `Tap shot ${state.shots.length + 1}`;
    els.statusLine.textContent = `${state.shots.length} shot(s) recorded`;
  }

  function renderDots() {
    els.dotsLayer.innerHTML = "";

    if (state.aim) {
      const d = document.createElement("div");
      d.className = "aimDot";
      d.style.left = `${state.aim.x * 100}%`;
      d.style.top = `${state.aim.y * 100}%`;
      els.dotsLayer.appendChild(d);
    }

    state.shots.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "hitDot";
      d.style.left = `${s.x * 100}%`;
      d.style.top = `${s.y * 100}%`;
      d.textContent = i + 1;
      els.dotsLayer.appendChild(d);
    });
  }

  function renderAll() {
    updateUI();
    renderDots();
  }

  /* ======================
     TAP
  ====================== */

  function getPoint(e) {
    const rect = els.targetWrap.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
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

  /* ======================
     ACTIONS
  ====================== */

  function undo() {
    if (state.shots.length) {
      state.shots.pop();
    } else {
      state.aim = null;
    }
    renderAll();
  }

  function clearAll() {
    state.aim = null;
    state.shots = [];
    renderAll();
  }

  /* ======================
     SEC
  ====================== */

  function openSEC() {
    if (!state.aim || !state.shots.length) return;

    state.frozen = true;
    setView("results");

    const avgX = state.shots.reduce((s, p) => s + p.x, 0) / state.shots.length;
    const avgY = state.shots.reduce((s, p) => s + p.y, 0) / state.shots.length;

    const dx = avgX - state.aim.x;
    const dy = avgY - state.aim.y;

    const wDir = dx > 0 ? "LEFT" : dx < 0 ? "RIGHT" : "HOLD";
    const eDir = dy > 0 ? "UP" : dy < 0 ? "DOWN" : "HOLD";

    const w = Math.round(Math.abs(dx) * 100);
    const e = Math.round(Math.abs(dy) * 100);

    els.freezeScrim.classList.remove("isHidden");
    els.secOverlay.classList.remove("isHidden");

    els.secShotCount.textContent = state.shots.length;
    els.secStatus.textContent = "Results Ready";
    els.secWindage.textContent = w === 0 ? "HOLD" : `${wDir} ${w}`;
    els.secElevation.textContent = e === 0 ? "HOLD" : `${eDir} ${e}`;
  }

  function closeSEC() {
    state.frozen = false;
    setView("workspace");
    hideOverlay();
  }

  function hideOverlay() {
    els.freezeScrim.classList.add("isHidden");
    els.secOverlay.classList.add("isHidden");
  }

  /* ======================
     BACK SYSTEM 🔥
  ====================== */

  function goBack() {
    if (state.view === "results") {
      closeSEC();
      return;
    }

    if (state.view === "workspace") {
      resetSession();
      setView("landing");
      return;
    }

    // landing → normal browser back
    history.back();
  }

  window.onpopstate = () => {
    goBack();
  };

  /* ======================
     IMAGE
  ====================== */

  function loadImage(file) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);

    objectUrl = URL.createObjectURL(file);

    state.imageSrc = objectUrl;
    state.aim = null;
    state.shots = [];

    els.targetImg.src = objectUrl;

    setView("workspace");
    renderAll();
  }

  /* ======================
     EVENTS
  ====================== */

  function bind() {
    els.photoBtn.onclick = () => els.photoInput.click();

    els.photoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) loadImage(file);
    };

    els.targetWrap.onclick = handleTap;

    els.undoBtn.onclick = undo;
    els.clearBtn.onclick = clearAll;
    els.showResultsBtn.onclick = openSEC;

    els.closeSecBtn.onclick = closeSEC;

    els.backBtn.onclick = goBack; // 🔥
  }

  /* ======================
     INIT
  ====================== */

  function init() {
    bind();
    resetSession();
    setView("landing");
    console.log("BACK SYSTEM ACTIVE");
  }

  init();

})();
