/* ============================================================
   docs/index.js — FULL REPLACEMENT
   CONTINUOUS BACK SYSTEM + SCREEN FIT + TAP ON RELEASE
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
    closeSecBtn: $("closeSecBtn"),
    saveSecBtn: $("saveSecBtn"),

    secShotCount: $("secShotCount"),
    secStatus: $("secStatus"),
    secWindage: $("secWindage"),
    secElevation: $("secElevation")
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

    if (pushHistory) {
      pushHistoryForView(view);
    }
  }

  function hideOverlay() {
    els.freezeScrim?.classList.add("isHidden");
    els.secOverlay?.classList.add("isHidden");
  }

  function showOverlay() {
    els.freezeScrim?.classList.remove("isHidden");
    els.secOverlay?.classList.remove("isHidden");
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
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {}
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

    if (els.dotsLayer) {
      els.dotsLayer.innerHTML = "";
    }
  }

  function hardResetSession() {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}

    resetSession();
    setView("landing", false);
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

    if (els.instructionLine) {
      els.instructionLine.textContent = `Tap shot ${state.shots.length + 1}`;
    }
    if (els.statusLine) {
      els.statusLine.textContent = `${state.shots.length} shot(s) recorded`;
    }
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
    pointerStart = {
      x: e.clientX,
      y: e.clientY
    };
  }

  function onPointerUp(e) {
    if (!state.imageSrc || state.frozen) return;
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    if (!pointerStart) return;

    const dx = e.clientX - pointerStart.x;
    const dy = e.clientY - pointerStart.y;
    const moved = Math.hypot(dx, dy);

    activePointerId = null;

    if (moved > 12) {
      pointerStart = null;
      return;
    }

    const p = getPointFromClient(e.clientX, e.clientY);

    if (!state.aim) {
      state.aim = p;
    } else if (state.shots.length < 7) {
      state.shots.push(p);
    }

    pointerStart = null;
    renderAll();
  }

  function onPointerCancel() {
    pointerStart = null;
    activePointerId = null;
  }

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

  function computeSECValues() {
    if (!state.aim || state.shots.length === 0) {
      return null;
    }

    const avgX = state.shots.reduce((sum, p) => sum + p.x, 0) / state.shots.length;
    const avgY = state.shots.reduce((sum, p) => sum + p.y, 0) / state.shots.length;

    const dx = avgX - state.aim.x;
    const dy = avgY - state.aim.y;

    const windageDir = dx > 0 ? "LEFT" : dx < 0 ? "RIGHT" : "HOLD";
    const elevationDir = dy > 0 ? "UP" : dy < 0 ? "DOWN" : "HOLD";

    const windage = Math.round(Math.abs(dx) * 100);
    const elevation = Math.round(Math.abs(dy) * 100);

    return {
      windageText: windage === 0 ? "HOLD" : `${windageDir} ${windage}`,
      elevationText: elevation === 0 ? "HOLD" : `${elevationDir} ${elevation}`
    };
  }

  function openSEC(push = true) {
    if (!state.aim || state.shots.length === 0) return;

    state.frozen = true;
    setView("results", push);

    const values = computeSECValues();
    if (!values) return;

    showOverlay();

    if (els.secShotCount) els.secShotCount.textContent = String(state.shots.length);
    if (els.secStatus) els.secStatus.textContent = "Results Ready";
    if (els.secWindage) els.secWindage.textContent = values.windageText;
    if (els.secElevation) els.secElevation.textContent = values.elevationText;
  }

  function closeSEC(push = false) {
    state.frozen = false;
    hideOverlay();
    setView("workspace", push);
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

  function drawInfoBlock(ctx, x, y, w, h, label, value, labelColor, valueColor) {
    roundRect(ctx, x, y, w, h, 16);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.font = "900 11px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, x + 18, y + 26);

    ctx.fillStyle = valueColor;
    ctx.font = "900 18px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(value, x + 18, y + 50);
  }

  function save() {
    if (!els.targetWrap || !els.targetImg || !state.imageSrc) return;

    const rect = els.targetWrap.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);

      if (state.frozen) {
        ctx.fillStyle = "rgba(5, 9, 20, 0.58)";
        ctx.fillRect(0, 0, width, height);
      }

      if (state.aim) {
        const x = state.aim.x * width;
        const y = state.aim.y * height;

        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fillStyle = "#2f66ff";
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      state.shots.forEach((shot, i) => {
        const x = shot.x * width;
        const y = shot.y * height;

        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fillStyle = "#ff4d5d";
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "700 12px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), x, y);
      });

      if (state.frozen) {
        const cardWidth = Math.min(width - 32, 680);
        const cardX = Math.round((width - cardWidth) / 2);
        const cardY = Math.round(height * 0.68);
        const cardHeight = Math.min(height - cardY - 16, 250);

        roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 22);
        ctx.fillStyle = "rgba(8, 20, 52, 0.96)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = "900 24px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
        ctx.fillText("SEC", cardX + 18, cardY + 34);

        const labelColor = "rgba(184,197,234,1)";
        const valueColor = "#ffffff";

        const blockGap = 10;
        const innerPad = 18;
        const row1Y = cardY + 54;
        const smallBlockH = 72;
        const wideBlockH = 62;
        const halfW = Math.floor((cardWidth - innerPad * 2 - blockGap) / 2);

        drawInfoBlock(
          ctx,
          cardX + innerPad,
          row1Y,
          halfW,
          smallBlockH,
          "SHOTS",
          String(state.shots.length),
          labelColor,
          valueColor
        );

        drawInfoBlock(
          ctx,
          cardX + innerPad + halfW + blockGap,
          row1Y,
          halfW,
          smallBlockH,
          "STATUS",
          "Results Ready",
          labelColor,
          valueColor
        );

        drawInfoBlock(
          ctx,
          cardX + innerPad,
          row1Y + smallBlockH + 12,
          cardWidth - innerPad * 2,
          wideBlockH,
          "WINDAGE",
          els.secWindage?.textContent || "HOLD",
          labelColor,
          valueColor
        );

        drawInfoBlock(
          ctx,
          cardX + innerPad,
          row1Y + smallBlockH + 12 + wideBlockH + 12,
          cardWidth - innerPad * 2,
          wideBlockH,
          "ELEVATION",
          els.secElevation?.textContent || "HOLD",
          labelColor,
          valueColor
        );
      }

      const link = document.createElement("a");
      link.download = `sczn3-result-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = els.targetImg.src;
  }

  function loadImage(file) {
    if (!file) return;

    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {}
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
    els.photoBtn?.addEventListener("click", () => els.photoInput?.click());

    els.photoInput?.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) loadImage(file);
    });

    els.targetWrap?.addEventListener("pointerdown", onPointerDown);
    els.targetWrap?.addEventListener("pointerup", onPointerUp);
    els.targetWrap?.addEventListener("pointercancel", onPointerCancel);

    els.backBtn?.addEventListener("click", () => goBack(true));
    els.undoBtn?.addEventListener("click", undo);
    els.clearBtn?.addEventListener("click", clearAll);
    els.showResultsBtn?.addEventListener("click", () => openSEC(true));

    els.closeSecBtn?.addEventListener("click", () => closeSEC(false));
    els.saveSecBtn?.addEventListener("click", save);

    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        window.location.reload();
      }
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
    hardResetSession();
    console.log("BACK SYSTEM ACTIVE");
  }

  init();
})();
