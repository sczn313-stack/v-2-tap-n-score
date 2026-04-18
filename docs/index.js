/* ============================================================
   FINAL FIX — TRUE IMAGE LOCK + REAL TAP SYSTEM
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
    statusLine: $("statusLine")
  };

  let objectUrl = null;

  const state = {
    imageSrc: "",
    aim: null,
    shots: []
  };

  /* ===============================
     VIEW
  =============================== */

  function showWorkspace() {
    els.landingView.classList.add("scoreHidden");
    els.workspaceView.classList.remove("scoreHidden");
  }

  function reset() {
    state.imageSrc = "";
    state.aim = null;
    state.shots = [];
    els.dotsLayer.innerHTML = "";
    els.shotCount.textContent = "0";
  }

  /* ===============================
     IMAGE LOAD
  =============================== */

  function loadImage(file) {
    if (!file) return;

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);

    els.targetImg.onload = () => {
      render();
    };

    els.targetImg.src = objectUrl;

    state.imageSrc = objectUrl;
    state.aim = null;
    state.shots = [];

    showWorkspace();
    render();
  }

  /* ===============================
     IMAGE RECT (CRITICAL)
  =============================== */

  function getImageRect() {
    const wrapRect = els.targetWrap.getBoundingClientRect();
    const img = els.targetImg;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    if (!naturalW || !naturalH) return null;

    const imgRatio = naturalW / naturalH;
    const wrapRatio = wrapRect.width / wrapRect.height;

    let width, height, left, top;

    if (imgRatio > wrapRatio) {
      width = wrapRect.width;
      height = width / imgRatio;
      left = 0;
      top = (wrapRect.height - height) / 2;
    } else {
      height = wrapRect.height;
      width = height * imgRatio;
      top = 0;
      left = (wrapRect.width - width) / 2;
    }

    return {
      left,
      top,
      width,
      height
    };
  }

  /* ===============================
     TAP → NORMALIZED POINT
  =============================== */

  function getPoint(e) {
    const rect = getImageRect();
    if (!rect) return null;

    const wrapRect = els.targetWrap.getBoundingClientRect();

    const x = e.clientX - wrapRect.left;
    const y = e.clientY - wrapRect.top;

    if (
      x < rect.left ||
      x > rect.left + rect.width ||
      y < rect.top ||
      y > rect.top + rect.height
    ) return null;

    return {
      x: (x - rect.left) / rect.width,
      y: (y - rect.top) / rect.height
    };
  }

  /* ===============================
     DOT RENDER
  =============================== */

  function render() {
    els.dotsLayer.innerHTML = "";

    const rect = getImageRect();
    if (!rect) return;

    // lock dots layer to image
    els.dotsLayer.style.left = rect.left + "px";
    els.dotsLayer.style.top = rect.top + "px";
    els.dotsLayer.style.width = rect.width + "px";
    els.dotsLayer.style.height = rect.height + "px";

    // AIM
    if (state.aim) {
      const d = document.createElement("div");
      d.className = "aimDot blinking";

      if (state.shots.length > 0) {
        d.classList.remove("blinking");
      }

      d.style.left = state.aim.x * 100 + "%";
      d.style.top = state.aim.y * 100 + "%";

      els.dotsLayer.appendChild(d);
    }

    // SHOTS
    state.shots.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "hitDot";

      d.style.left = s.x * 100 + "%";
      d.style.top = s.y * 100 + "%";

      d.textContent = i + 1;

      els.dotsLayer.appendChild(d);
    });

    els.shotCount.textContent = state.shots.length;
  }

  /* ===============================
     TAP HANDLER
  =============================== */

  function handleTap(e) {
    if (!state.imageSrc) return;

    const p = getPoint(e);
    if (!p) return;

    if (!state.aim) {
      state.aim = p;
    } else if (state.shots.length < 7) {
      state.shots.push(p);
    }

    render();
  }

  /* ===============================
     ACTIONS
  =============================== */

  function undo() {
    if (state.shots.length > 0) {
      state.shots.pop();
    } else {
      state.aim = null;
    }
    render();
  }

  function clearAll() {
    state.aim = null;
    state.shots = [];
    render();
  }

  /* ===============================
     BIND
  =============================== */

  function bind() {
    els.photoBtn.addEventListener("click", () => {
      els.photoInput.click();
    });

    els.photoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      loadImage(file);
    });

    els.targetWrap.addEventListener("click", handleTap);

    els.undoBtn.addEventListener("click", undo);
    els.clearBtn.addEventListener("click", clearAll);
  }

  bind();
})();
