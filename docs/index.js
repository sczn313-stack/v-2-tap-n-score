/* ============================================================
   docs/index.js — FULL REPLACEMENT
   CLEAN START BUILD (NO AUTO RESTORE)
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

  /* ======================
     CORE UI CONTROL
  ====================== */

  function showLanding() {
    els.landingView.classList.remove("scoreHidden");
    els.workspaceView.classList.add("scoreHidden");
  }

  function showWorkspace() {
    els.landingView.classList.add("scoreHidden");
    els.workspaceView.classList.remove("scoreHidden");
  }

  function updateUI() {
    els.shotCount.textContent = state.shots.length;

    if (!state.imageSrc) {
      els.instructionLine.textContent = "Add a target photo.";
      els.statusLine.textContent = "Tap to begin.";
    } else if (!state.aim) {
      els.instructionLine.textContent = "Tap aim point.";
      els.statusLine.textContent = "First tap sets aim.";
    } else {
      els.instructionLine.textContent = `Tap shot ${state.shots.length + 1}`;
      els.statusLine.textContent = `${state.shots.length} shot(s) recorded`;
    }
  }

  /* ======================
     DOT RENDER
  ====================== */

  function renderDots() {
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
      d.textContent = i + 1;
      els.dotsLayer.appendChild(d);
    });
  }

  function renderAll() {
    updateUI();
    renderDots();
  }

  /* ======================
     TAP HANDLING
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

  function openSEC() {
    if (!state.aim || state.shots.length === 0) return;

    state.frozen = true;

    els.freezeScrim.classList.remove("isHidden");
    els.secOverlay.classList.remove("isHidden");

    els.secShotCount.textContent = state.shots.length;
    els.secStatus.textContent = "Results Ready";
    els.secWindage.textContent = "—";
    els.secElevation.textContent = "—";
  }

  function closeSEC() {
    state.frozen = false;

    els.freezeScrim.classList.add("isHidden");
    els.secOverlay.classList.add("isHidden");
  }

  function save() {
    alert("Save wired next step");
  }

  /* ======================
     IMAGE LOAD
  ====================== */

  function loadImage(file) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);

    objectUrl = URL.createObjectURL(file);

    state.imageSrc = objectUrl;
    state.aim = null;
    state.shots = [];

    els.targetImg.src = objectUrl;

    showWorkspace();
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
    els.saveSecBtn.onclick = save;
  }

  /* ======================
     INIT (CRITICAL FIX)
  ====================== */

  function init() {
    bind();

    // 🔥 HARD RESET EVERYTHING
    try {
      localStorage.clear();
    } catch {}

    state.imageSrc = "";
    state.aim = null;
    state.shots = [];
    state.frozen = false;

    showLanding();
    renderAll();
  }

  init();

})();
