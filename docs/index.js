/* ============================================================
   docs/index.js — FULL REPLACEMENT
   LOCKED BUILD + FULL PAGE SEC + SEC-ONLY SAVE + PREMIUM EXPORT
   SAVED SEC DOES NOT SHOW BACK / SAVE BUTTONS
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

    if (pushHistory) pushHistoryForView(view);
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
    try { localStorage.clear(); } catch {}
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
      { x: 0, y: 0 },
      { x: 14, y: 0 },
      { x: -14, y: 0 },
      { x: 0, y: -14 },
      { x: 0, y: 14 },
      { x: 12, y: -12 },
      { x: -12, y: -12 },
      { x: 12, y: 12 },
      { x: -12, y: 12 },
      { x: 20, y: 0 },
      { x: -20, y: 0 },
      { x: 0, y: -20 },
      { x: 0, y: 20 }
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
      d.title = `Shot ${i + 1}`;
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
    return `${count} ${noun} ${dir}`;
  }

  function formatStatusText(shotCount) {
    const noun = shotCount === 1 ? "SHOT" : "SHOTS";
    return `${shotCount} ${noun} RECORDED`;
  }

  function computeSECValues() {
    if (!state.aim || state.shots.length === 0) return null;

    const avgX = state.shots.reduce((sum, p) => sum + p.x, 0) / state.shots.length;
    const avgY = state.shots.reduce((sum, p) => sum + p.y, 0) / state.shots.length;

    const dx = avgX - state.aim.x;
    const dy = avgY - state.aim.y;

    const windageDir = dx > 0 ? "LEFT" : dx < 0 ? "RIGHT" : "HOLD";
    const elevationDir = dy > 0 ? "UP" : dy < 0 ? "DOWN" : "HOLD";

    const windage = Math.round(Math.abs(dx) * 100);
    const elevation = Math.round(Math.abs(dy) * 100);

    return {
      statusText: formatStatusText(state.shots.length),
      windageText: formatClicksText(windageDir, windage),
      elevationText: formatClicksText(elevationDir, elevation)
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
    if (els.secStatus) els.secStatus.textContent = values.statusText;
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
    grad.addColorStop(0.42, "#041652");
    grad.addColorStop(1, "#02103d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function fillSoftGlow(ctx, width, height) {
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.12, 10, width * 0.5, height * 0.12, width * 0.48);
    glow.addColorStop(0, "rgba(255, 76, 94, 0.14)");
    glow.addColorStop(0.28, "rgba(54, 117, 255, 0.10)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
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

  function drawInfoBlock(ctx, x, y, w, h, label, value, startSize = 44, minSize = 22) {
    roundRect(ctx, x, y, w, h, 20);
    ctx.fillStyle = "rgba(255,255,255,0.065)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.stroke();

    ctx.fillStyle = "rgba(184,197,234,1)";
    ctx.font = "900 18px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, x + 24, y + 36);

    const valueWidth = w - 48;
    const fitted = fitValueText(ctx, value, valueWidth, startSize, minSize);
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${fitted}px -apple-system, BlinkMacSystemFont, Segoe UI, Arial`;
    ctx.fillText(value, x + 24, y + 96);
  }

  function save() {
    const shots = String(els.secShotCount?.textContent || state.shots.length || 0);
    const status = String(els.secStatus?.textContent || formatStatusText(state.shots.length));
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

    const shellX = 44;
    const shellY = 44;
    const shellW = width - 88;
    const headerH = 138;

    // Header without buttons
    roundRect(ctx, shellX, shellY, shellW, headerH, 30);
    ctx.fillStyle = "rgba(8, 20, 52, 0.96)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "900 70px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "#ff5a66";
    ctx.fillText("S", shellX + 28, shellY + 88);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("E", shellX + 76, shellY + 88);
    ctx.fillStyle = "#61a7ff";
    ctx.fillText("C", shellX + 128, shellY + 88);

    ctx.fillStyle = "rgba(184,197,234,0.95)";
    ctx.font = "900 22px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("Shooter Experience Card", shellX + 210, shellY + 88);

    const bodyX = 44;
    const bodyY = shellY + headerH + 20;
    const bodyW = width - 88;
    const bodyH = height - bodyY - 44;

    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 30);
    ctx.fillStyle = "rgba(8, 20, 52, 0.96)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    const pad = 32;
    const colGap = 20;
    const rowGap = 20;
    const smallBlockH = 162;
    const wideBlockH = 184;
    const halfW = Math.floor((bodyW - pad * 2 - colGap) / 2);

    const row1Y = bodyY + pad;

    drawInfoBlock(ctx, bodyX + pad, row1Y, halfW, smallBlockH, "SHOTS", shots, 50, 28);
    drawInfoBlock(ctx, bodyX + pad + halfW + colGap, row1Y, halfW, smallBlockH, "STATUS", status, 32, 20);

    drawInfoBlock(
      ctx,
      bodyX + pad,
      row1Y + smallBlockH + rowGap,
      bodyW - pad * 2,
      wideBlockH,
      "WINDAGE",
      windage,
      42,
      24
    );

    drawInfoBlock(
      ctx,
      bodyX + pad,
      row1Y + smallBlockH + rowGap + wideBlockH + rowGap,
      bodyW - pad * 2,
      wideBlockH,
      "ELEVATION",
      elevation,
      42,
      24
    );

    ctx.fillStyle = "rgba(184,197,234,0.72)";
    ctx.font = "900 18px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("Tap-n-Score™", bodyX + pad, bodyY + bodyH - 26);

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
    hardResetSession();
    console.log("PREMIUM EXPORT POLISH ACTIVE");
  }

  init();
})();
