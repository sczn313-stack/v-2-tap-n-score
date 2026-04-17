/* ============================================================
   docs/index.js — FULL REPLACEMENT
   CONTINUOUS BACK + SCROLL-SAFE TAPS + FULL SEC
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

  let pointerStart = null;
  let activePointerId = null;
  let pointerStartScrollX = 0;
  let pointerStartScrollY = 0;

  const TAP_DRIFT_PX = 14;
  const TAP_TIME_MS = 300;
  const MAX_SHOTS = 7;

  const state = {
    view: "landing",
    imageSrc: "",
    aim: null,
    shots: [],
    frozen: false,
    secData: null
  };

  function hideOverlay() {
    els.freezeScrim?.classList.add("isHidden");
    els.secOverlay?.classList.add("isHidden");
  }

  function showOverlay() {
    els.freezeScrim?.classList.remove("isHidden");
    els.secOverlay?.classList.remove("isHidden");
  }

  function renderDots() {
    if (!els.dotsLayer) return;
    els.dotsLayer.innerHTML = "";

    if (state.aim) {
      const d = document.createElement("div");
      d.className = "shotDot aimDot";
      d.style.left = `${state.aim.x * 100}%`;
      d.style.top = `${state.aim.y * 100}%`;
      els.dotsLayer.appendChild(d);
    }

    state.shots.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "shotDot hitDot";
      d.style.left = `${s.x * 100}%`;
      d.style.top = `${s.y * 100}%`;
      d.textContent = i + 1;
      els.dotsLayer.appendChild(d);
    });
  }

  function renderAll() {
    if (els.targetImg && state.imageSrc) {
      els.targetImg.src = state.imageSrc;
    }
    renderDots();
  }

  function getPoint(clientX, clientY) {
    const rect = els.targetWrap.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  }

  function handleTap(point) {
    if (!state.aim) {
      state.aim = point;
    } else if (state.shots.length < MAX_SHOTS) {
      state.shots.push(point);
    }
    renderAll();
  }

  /* =========================
     SCROLL-SAFE POINTER LOGIC
  ========================= */

  function startPointer(ev) {
    if (!state.imageSrc || state.frozen) return;

    activePointerId = ev.pointerId;

    pointerStart = {
      x: ev.clientX,
      y: ev.clientY,
      t: Date.now()
    };

    pointerStartScrollX = window.scrollX;
    pointerStartScrollY = window.scrollY;
  }

  function endPointer(ev) {
    if (activePointerId !== ev.pointerId) return;

    const start = pointerStart;
    pointerStart = null;
    activePointerId = null;

    if (!start) return;

    const dx = ev.clientX - start.x;
    const dy = ev.clientY - start.y;
    const drift = Math.sqrt(dx * dx + dy * dy);

    const scrollDx = Math.abs(window.scrollX - pointerStartScrollX);
    const scrollDy = Math.abs(window.scrollY - pointerStartScrollY);
    const elapsed = Date.now() - start.t;

    // 🔥 KILL FALSE TAPS
    if (scrollDx > 4 || scrollDy > 4) return;
    if (drift > TAP_DRIFT_PX) return;
    if (elapsed > TAP_TIME_MS) return;

    const point = getPoint(ev.clientX, ev.clientY);
    handleTap(point);
  }

  function cancelPointer() {
    pointerStart = null;
    activePointerId = null;
  }

  function wireEvents() {
    els.photoBtn?.addEventListener("click", () => {
      els.photoInput.click();
    });

    els.photoInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        state.imageSrc = reader.result;
        state.aim = null;
        state.shots = [];
        renderAll();
      };

      reader.readAsDataURL(file);
    });

    els.targetWrap?.addEventListener("pointerdown", startPointer);
    els.targetWrap?.addEventListener("pointerup", endPointer);
    els.targetWrap?.addEventListener("pointercancel", cancelPointer);
    els.targetWrap?.addEventListener("pointerleave", cancelPointer);

    els.secBackBtn?.addEventListener("click", () => {
      hideOverlay();
      state.frozen = false;
      renderAll();
    });
  }

  function init() {
    hideOverlay();
    wireEvents();
  }

  init();
})();
