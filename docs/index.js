/* ============================================================
   docs/index.js — FULL REPLACEMENT
   BUTTON STATE POLISH + CURRENT BUILD
============================================================ */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    landingView: $("landingView"),
    workspaceView: $("workspaceView"),

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
    secElevation: $("secElevation")
  };

  let objectUrl = null;

  const state = {
    view: "landing",
    imageSrc: "",
    aim: null,
    shots: [],
    frozen: false
  };

  /* ================= BUTTON STATE ================= */

  function updateButtons() {
    const hasImage = !!state.imageSrc;
    const hasAim = !!state.aim;
    const shotCount = state.shots.length;

    // Undo
    els.undoBtn.disabled = !(hasAim || shotCount > 0);

    // Clear
    els.clearBtn.disabled = !(hasAim || shotCount > 0);

    // Show Results (must have aim + at least 1 shot)
    els.showResultsBtn.disabled = !(hasAim && shotCount > 0);
  }

  /* ================= UI ================= */

  function updateUI() {
    if (els.shotCount) {
      els.shotCount.textContent = String(state.shots.length);
    }

    updateButtons();

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

    if (state.shots.length >= 7) {
      els.instructionLine.textContent = "Maximum 7 shots reached.";
      els.statusLine.textContent = `${state.shots.length} shot(s) recorded`;
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

  /* ================= INTERACTION ================= */

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

  /* ================= CONTROLS ================= */

  function undo() {
    if (state.frozen) return;

    if (state.shots.length > 0) {
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

    els.freezeScrim.classList.remove("isHidden");
    els.secOverlay.classList.remove("isHidden");

    els.secShotCount.textContent = state.shots.length;
    els.secStatus.textContent = "Results Ready";

    els.secWindage.textContent = "HOLD";
    els.secElevation.textContent = "HOLD";
  }

  function closeSEC() {
    state.frozen = false;
    els.freezeScrim.classList.add("isHidden");
    els.secOverlay.classList.add("isHidden");
  }

  function goBack() {
    if (state.view === "workspace") {
      resetSession();
      setView("landing");
      renderAll();
    }
  }

  function resetSession() {
    state.imageSrc = "";
    state.aim = null;
    state.shots = [];
    state.frozen = false;

    els.targetImg.src = "";
    els.photoInput.value = "";
    els.dotsLayer.innerHTML = "";

    closeSEC();
  }

  function setView(view) {
    state.view = view;

    if (view === "landing") {
      els.landingView.classList.remove("scoreHidden");
      els.workspaceView.classList.add("scoreHidden");
    } else {
      els.landingView.classList.add("scoreHidden");
      els.workspaceView.classList.remove("scoreHidden");
    }
  }

  /* ================= IMAGE ================= */

  function loadImage(file) {
    if (!file) return;

    if (objectUrl) URL.revokeObjectURL(objectUrl);

    objectUrl = URL.createObjectURL(file);

    state.imageSrc = objectUrl;
    state.aim = null;
    state.shots = [];
    state.frozen = false;

    els.targetImg.src = objectUrl;

    setView("workspace");
    renderAll();
  }

  /* ================= BIND ================= */

  function bind() {
    els.photoBtn.addEventListener("click", () => els.photoInput.click());

    els.photoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) loadImage(file);
    });

    els.targetWrap.addEventListener("click", handleTap);

    els.undoBtn.addEventListener("click", undo);
    els.clearBtn.addEventListener("click", clearAll);
    els.showResultsBtn.addEventListener("click", openSEC);

    els.secBackBtn.addEventListener("click", closeSEC);

    els.backBtn.addEventListener("click", goBack);
  }

  function init() {
    bind();
    renderAll();
  }

  init();
})();
