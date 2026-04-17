/* ============================================================
   docs/index.js — FULL REPLACEMENT
   CONTINUOUS BACK SYSTEM + IPAD FIT + FULL-PAGE SEC + SEC-ONLY SAVE
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

    if (els.undoBtn) {
      els.undoBtn.disabled = !(state.aim || state.shots.length > 0);
    }

    if (els.clearBtn) {
      els.clearBtn.disabled = !(state.aim || state.shots.length > 0);
    }

    if (els.showResultsBtn) {
      els.showResultsBtn.disabled = !(state.aim && state.shots.length > 0);
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

  function fillVerticalGradient(ctx, width, height) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#071743");
    grad.addColorStop(0.45, "#03124a");
    grad.addColorStop(1, "#01103f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function fillSoftGlow(ctx, width, height) {
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.16, 10, width * 0.5, height * 0.16, width * 0.42);
    glow.addColorStop(0, "rgba(255, 76, 94, 0.12)");
    glow.addColorStop(0.35, "rgba(54, 117, 255, 0.08)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  function drawInfoBlock(ctx, x, y, w, h, label, value) {
    roundRect(ctx, x, y, w, h, 18);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.stroke();

    ctx.fillStyle = "rgba(184,197,234,1)";
    ctx.font = "900 18px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, x + 22, y + 34);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 44px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(value, x + 22, y + 88);
  }

  function save() {
    const shots = String(els.secShotCount?.textContent || state.shots.length || 0);
    const status = String(els.secStatus?.textContent || "Results Ready");
    const windage = String(els.secWindage?.textContent || "HOLD");
    const elevation = String(els.secElevation?.textContent || "HOLD");

    const width = 1400;
    const height = 1800;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    fillVerticalGradient(ctx, width, height);
    fillSoftGlow(ctx, width, height);

    const shellX = 40;
    const shellY = 40;
    const shellW = width - 80;
    const headerH = 130;

    roundRect(ctx, shellX, shellY, shellW, headerH, 28);
    ctx.fillStyle = "rgba(8, 20, 52, 0.96)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    ctx.fillStyle = "#ff5a66";
    ctx.font = "900 68px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("S", shellX + 26, shellY + 84);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("E", shellX + 72, shellY + 84);

    ctx.fillStyle = "#61a7ff";
    ctx.fillText("C", shellX + 122, shellY + 84);

    const btnY = shellY + 24;
    const btnH = 78;
    const saveBtnW = 144;
    const backBtnW = 144;
    const gap = 16;
    const saveBtnX = shellX + shellW - 24 - saveBtnW;
    const backBtnX = saveBtnX - gap - backBtnW;

    roundRect(ctx, backBtnX, btnY, backBtnW, btnH, 39);
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fill();

    roundRect(ctx, saveBtnX, btnY, saveBtnW, btnH, 39);
    const btnGrad = ctx.createLinearGradient(saveBtnX, btnY, saveBtnX + saveBtnW, btnY + btnH);
    btnGrad.addColorStop(0, "#2f66ff");
    btnGrad.addColorStop(1, "#5d8cff");
    ctx.fillStyle = btnGrad;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 30px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("Back", backBtnX + 38, btnY + 49);
    ctx.fillText("Save", saveBtnX + 38, btnY + 49);

    const bodyX = 40;
    const bodyY = shellY + headerH + 18;
    const bodyW = width - 80;
    const bodyH = height - bodyY - 40;

    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 28);
    ctx.fillStyle = "rgba(8, 20, 52, 0.96)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    const pad = 28;
    const colGap = 18;
    const rowGap = 18;
    const smallBlockH = 150;
    const wideBlockH = 170;
    const halfW = Math.floor((bodyW - pad * 2 - colGap) / 2);

    const row1Y = bodyY + pad;

    drawInfoBlock(ctx, bodyX + pad, row1Y, halfW, smallBlockH, "SHOTS", shots);
    drawInfoBlock(ctx, bodyX + pad + halfW + colGap, row1Y, halfW, smallBlockH, "STATUS", status);

    drawInfoBlock(
      ctx,
      bodyX + pad,
      row1Y + smallBlockH + rowGap,
      bodyW - pad * 2,
      wideBlockH,
      "WINDAGE",
      windage
    );

    drawInfoBlock(
      ctx,
      bodyX + pad,
      row1Y + smallBlockH + rowGap + wideBlockH + rowGap,
      bodyW - pad * 2,
      wideBlockH,
      "ELEVATION",
      elevation
    );

    const link = document.createElement("a");
    link.download = `sczn3-sec-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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

    els.secBackBtn?.addEventListener("click", () => closeSEC(false));
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
