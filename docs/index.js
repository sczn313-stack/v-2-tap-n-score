Here is the full replacement for docs/index.js:

/* ============================================================
   docs/index.js — FULL REPLACEMENT
   CONTINUOUS BACK SYSTEM + IPAD FIT + FULL-PAGE SEC
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

  const STORAGE_KEYS = {
    TARGET_W_IN: "SCZN3_TARGET_W_IN_V1",
    TARGET_H_IN: "SCZN3_TARGET_H_IN_V1",
    RANGE_YDS: "SCZN3_RANGE_YDS_V1",
    DIAL_UNIT: "SCZN3_DIAL_UNIT_V1",
    CLICK_VALUE: "SCZN3_CLICK_VALUE_V1",
    LAST_IMAGE: "SCZN3_TARGET_IMG_DATAURL_V1"
  };

  let objectUrl = null;
  let suppressNextPop = false;
  let pointerStart = null;
  let activePointerId = null;

  const TAP_DRIFT_PX = 14;
  const MAX_SHOTS = 7;

  const state = {
    view: "landing",          // landing | workspace
    imageSrc: "",
    aim: null,                // { x:0..1, y:0..1 }
    shots: [],                // [{x,y}]
    frozen: false,
    secData: null
  };

  function setViewportHeightVar() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--app-vh", `${vh}px`);
  }

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
    } else {
      els.landingView?.classList.add("scoreHidden");
      els.workspaceView?.classList.remove("scoreHidden");
    }

    window.scrollTo(0, 0);

    if (pushHistory) {
      pushHistoryForView(view);
    }

    renderAll();
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
      } catch (_) {}
      objectUrl = null;
    }
  }

  function resetSession() {
    state.imageSrc = "";
    state.aim = null;
    state.shots = [];
    state.frozen = false;
    state.secData = null;

    pointerStart = null;
    activePointerId = null;

    clearImageElement();
    hideOverlay();

    if (els.dotsLayer) {
      els.dotsLayer.innerHTML = "";
    }
  }

  function hardResetSession() {
    try { sessionStorage.clear(); } catch (_) {}

    state.aim = null;
    state.shots = [];
    state.frozen = false;
    state.secData = null;

    pointerStart = null;
    activePointerId = null;

    hideOverlay();

    if (els.dotsLayer) {
      els.dotsLayer.innerHTML = "";
    }

    renderAll();
  }

  function getNum(key, fallback) {
    const raw = localStorage.getItem(key);
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : fallback;
  }

  function getDialUnit() {
    const raw = (localStorage.getItem(STORAGE_KEYS.DIAL_UNIT) || "MOA").toUpperCase();
    return raw === "MRAD" ? "MRAD" : "MOA";
  }

  function getClickValue(unit) {
    const stored = Number(localStorage.getItem(STORAGE_KEYS.CLICK_VALUE));
    if (Number.isFinite(stored) && stored > 0) return stored;
    return unit === "MRAD" ? 0.10 : 0.25;
  }

  function clamp01(n) {
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  function toFixed2(n) {
    return Number(n).toFixed(2);
  }

  function updateUI() {
    if (els.shotCount) {
      els.shotCount.textContent = String(state.shots.length);
    }

    if (els.undoBtn) {
      els.undoBtn.disabled = !state.aim && state.shots.length === 0;
    }

    if (els.clearBtn) {
      els.clearBtn.disabled = !state.imageSrc || (!state.aim && state.shots.length === 0);
    }

    if (els.showResultsBtn) {
      els.showResultsBtn.disabled = !state.imageSrc || !state.aim || state.shots.length < 1 || state.frozen;
    }

    if (!state.imageSrc) {
      if (els.instructionLine) els.instructionLine.textContent = "Add a target photo.";
      if (els.statusLine) els.statusLine.textContent = "Tap to begin.";
      return;
    }

    if (!state.aim) {
      if (els.instructionLine) els.instructionLine.textContent = "Tap the aim point.";
      if (els.statusLine) els.statusLine.textContent = "Aim point needed before shots.";
      return;
    }

    if (state.shots.length < MAX_SHOTS && !state.frozen) {
      if (els.instructionLine) {
        els.instructionLine.textContent = `Tap shot impacts (${state.shots.length}/${MAX_SHOTS}).`;
      }

      if (els.statusLine) {
        els.statusLine.textContent =
          state.shots.length >= 3
            ? "Results ready. Add more shots or tap Show Results."
            : "Add at least 3 shots for a stronger read.";
      }
      return;
    }

    if (state.frozen) {
      if (els.instructionLine) els.instructionLine.textContent = "Results locked.";
      if (els.statusLine) els.statusLine.textContent = "Use Back to return or Save SEC.";
      return;
    }

    if (els.instructionLine) els.instructionLine.textContent = "Shot limit reached.";
    if (els.statusLine) els.statusLine.textContent = "Tap Show Results.";
  }

  function renderDots() {
    if (!els.dotsLayer) return;
    els.dotsLayer.innerHTML = "";

    if (state.aim) {
      const d = document.createElement("div");
      d.className = "shotDot aimDot";
      d.style.left = `${state.aim.x * 100}%`;
      d.style.top = `${state.aim.y * 100}%`;
      d.textContent = "A";
      els.dotsLayer.appendChild(d);
    }

    state.shots.forEach((shot, i) => {
      const d = document.createElement("div");
      d.className = "shotDot hitDot";
      d.style.left = `${shot.x * 100}%`;
      d.style.top = `${shot.y * 100}%`;
      d.textContent = String(i + 1);
      els.dotsLayer.appendChild(d);
    });

    if (state.secData?.poib) {
      const d = document.createElement("div");
      d.className = "shotDot poibDot";
      d.style.left = `${state.secData.poib.x * 100}%`;
      d.style.top = `${state.secData.poib.y * 100}%`;
      d.textContent = "X";
      els.dotsLayer.appendChild(d);
    }
  }

  function renderImage() {
    if (!els.targetImg) return;

    if (state.imageSrc) {
      els.targetImg.src = state.imageSrc;
    } else {
      els.targetImg.removeAttribute("src");
      els.targetImg.src = "";
    }
  }

  function renderSec() {
    const sec = state.secData;

    if (els.secShotCount) {
      els.secShotCount.textContent = String(state.shots.length);
    }

    if (!sec) {
      if (els.secStatus) els.secStatus.textContent = "No SEC data";
      if (els.secWindage) els.secWindage.textContent = "—";
      if (els.secElevation) els.secElevation.textContent = "—";
      return;
    }

    if (els.secStatus) {
      els.secStatus.textContent = sec.status;
    }

    if (els.secWindage) {
      els.secWindage.textContent =
        `${sec.windageDir} ${toFixed2(sec.windageClicks)} clicks`;
    }

    if (els.secElevation) {
      els.secElevation.textContent =
        `${sec.elevationDir} ${toFixed2(sec.elevationClicks)} clicks`;
    }
  }

  function renderAll() {
    renderImage();
    renderDots();
    renderSec();
    updateUI();
  }

  function getPointFromClient(clientX, clientY) {
    if (!els.targetWrap) return null;
    const rect = els.targetWrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const x = clamp01((clientX - rect.left) / rect.width);
    const y = clamp01((clientY - rect.top) / rect.height);

    return { x, y };
  }

  function handleTapPoint(point) {
    if (!point || state.frozen || !state.imageSrc) return;

    if (!state.aim) {
      state.aim = point;
      renderAll();
      return;
    }

    if (state.shots.length >= MAX_SHOTS) {
      renderAll();
      return;
    }

    state.shots.push(point);
    renderAll();
  }

  function calcAveragePoint(points) {
    if (!points.length) return null;
    const sx = points.reduce((sum, p) => sum + p.x, 0);
    const sy = points.reduce((sum, p) => sum + p.y, 0);
    return {
      x: sx / points.length,
      y: sy / points.length
    };
  }

  function moaPerInchAt(rangeYds) {
    return 100 / (1.047 * rangeYds);
  }

  function computeGroupSizeInches(shots, targetWIn, targetHIn) {
    if (shots.length < 2) return 0;

    let maxDist = 0;
    for (let i = 0; i < shots.length; i += 1) {
      for (let j = i + 1; j < shots.length; j += 1) {
        const dx = (shots[j].x - shots[i].x) * targetWIn;
        const dy = (shots[j].y - shots[i].y) * targetHIn;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) maxDist = dist;
      }
    }
    return maxDist;
  }

  function buildSecData() {
    if (!state.aim || !state.shots.length) return null;

    const poib = calcAveragePoint(state.shots);
    const targetWIn = getNum(STORAGE_KEYS.TARGET_W_IN, 8.5);
    const targetHIn = getNum(STORAGE_KEYS.TARGET_H_IN, 11);
    const rangeYds = getNum(STORAGE_KEYS.RANGE_YDS, 100);
    const dialUnit = getDialUnit();
    const clickValue = getClickValue(dialUnit);

    const dxInches = (poib.x - state.aim.x) * targetWIn;
    const dyInches = (poib.y - state.aim.y) * targetHIn;

    const windageDir = dxInches > 0 ? "LEFT" : dxInches < 0 ? "RIGHT" : "HOLD";
    const elevationDir = dyInches > 0 ? "UP" : dyInches < 0 ? "DOWN" : "HOLD";

    let windageClicks = 0;
    let elevationClicks = 0;

    if (dialUnit === "MOA") {
      const moaFactor = moaPerInchAt(rangeYds);
      const windageMoa = Math.abs(dxInches) * moaFactor;
      const elevationMoa = Math.abs(dyInches) * moaFactor;
      windageClicks = windageMoa / clickValue;
      elevationClicks = elevationMoa / clickValue;
    } else {
      const inchesPerMil = rangeYds * 0.036;
      const windageMil = Math.abs(dxInches) / inchesPerMil;
      const elevationMil = Math.abs(dyInches) / inchesPerMil;
      windageClicks = windageMil / clickValue;
      elevationClicks = elevationMil / clickValue;
    }

    const groupSizeInches = computeGroupSizeInches(state.shots, targetWIn, targetHIn);

    let status = "Needs work";
    if (state.shots.length >= 5 && groupSizeInches <= 1.5) status = "Strong";
    else if (state.shots.length >= 3 && groupSizeInches <= 3.0) status = "Solid";

    return {
      poib,
      targetWIn,
      targetHIn,
      rangeYds,
      dialUnit,
      clickValue,
      dxInches,
      dyInches,
      windageDir,
      elevationDir,
      windageClicks,
      elevationClicks,
      groupSizeInches,
      status
    };
  }

  function showResults() {
    if (!state.imageSrc || !state.aim || state.shots.length < 1) return;

    state.secData = buildSecData();
    state.frozen = true;

    renderAll();
    showOverlay();
  }

  function backFromOverlay() {
    hideOverlay();
    state.frozen = false;
    state.secData = null;
    renderAll();
  }

  function stepBack() {
    if (!state.imageSrc) {
      setView("landing", false);
      return;
    }

    if (!els.secOverlay?.classList.contains("isHidden")) {
      backFromOverlay();
      return;
    }

    if (state.shots.length) {
      state.shots.pop();
      state.secData = null;
      renderAll();
      return;
    }

    if (state.aim) {
      state.aim = null;
      state.secData = null;
      renderAll();
      return;
    }

    resetSession();
    setView("landing", false);
  }

  function startPointer(ev) {
    if (!state.imageSrc || state.frozen) return;
    if (!els.targetWrap) return;

    activePointerId = ev.pointerId;
    pointerStart = { x: ev.clientX, y: ev.clientY };

    if (els.targetWrap.setPointerCapture) {
      try { els.targetWrap.setPointerCapture(ev.pointerId); } catch (_) {}
    }
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

    if (drift > TAP_DRIFT_PX) return;

    const point = getPointFromClient(ev.clientX, ev.clientY);
    handleTapPoint(point);
  }

  function cancelPointer() {
    pointerStart = null;
    activePointerId = null;
  }

  function onPhotoChosen(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      state.imageSrc = dataUrl;
      state.aim = null;
      state.shots = [];
      state.frozen = false;
      state.secData = null;

      try { localStorage.setItem(STORAGE_KEYS.LAST_IMAGE, dataUrl); } catch (_) {}

      renderAll();
      setView("workspace", true);
    };
    reader.readAsDataURL(file);
  }

  async function saveSEC() {
    if (!state.secData || !state.imageSrc) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const W = 1400;
    const H = 2200;

    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = "#07090d";
    ctx.fillRect(0, 0, W, H);

    const img = new Image();
    img.onload = () => {
      const pad = 70;
      const panelTop = 80;
      const panelW = W - pad * 2;
      const imageH = 1100;

      ctx.fillStyle = "#10151d";
      roundRect(ctx, pad, panelTop, panelW, H - 160, 28, true);

      const scale = Math.min(panelW / img.width, imageH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = (W - drawW) / 2;
      const drawY = 150;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      if (state.aim) {
        drawMarker(ctx, drawX + state.aim.x * drawW, drawY + state.aim.y * drawH, "#4dd2ff", "A");
      }

      state.shots.forEach((shot, i) => {
        drawMarker(ctx, drawX + shot.x * drawW, drawY + shot.y * drawH, "#ffffff", String(i + 1));
      });

      if (state.secData?.poib) {
        drawMarker(ctx, drawX + state.secData.poib.x * drawW, drawY + state.secData.poib.y * drawH, "#ff5d5d", "X");
      }

      let y = drawY + drawH + 90;

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 58px Arial";
      ctx.fillText("SCZN3 SEC", pad + 30, y);

      y += 75;
      ctx.font = "34px Arial";
      ctx.fillStyle = "#d4d9e2";
      ctx.fillText(`Shots: ${state.shots.length}`, pad + 30, y);

      y += 60;
      ctx.fillText(`Status: ${state.secData.status}`, pad + 30, y);

      y += 60;
      ctx.fillText(
        `Windage: ${state.secData.windageDir} ${toFixed2(state.secData.windageClicks)} clicks`,
        pad + 30,
        y
      );

      y += 60;
      ctx.fillText(
        `Elevation: ${state.secData.elevationDir} ${toFixed2(state.secData.elevationClicks)} clicks`,
        pad + 30,
        y
      );

      y += 60;
      ctx.fillText(
        `Group Size: ${toFixed2(state.secData.groupSizeInches)} in`,
        pad + 30,
        y
      );

      y += 60;
      ctx.fillText(
        `Offset X/Y: ${toFixed2(state.secData.dxInches)} in / ${toFixed2(state.secData.dyInches)} in`,
        pad + 30,
        y
      );

      y += 60;
      ctx.fillText(
        `Range: ${toFixed2(state.secData.rangeYds)} yds • ${state.secData.dialUnit} • ${toFixed2(state.secData.clickValue)} / click`,
        pad + 30,
        y
      );

      y += 110;
      ctx.font = "28px Arial";
      ctx.fillStyle = "#8ea0b8";
      ctx.fillText("Faith • Order • Precision", pad + 30, y);

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "SCZN3_SEC.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
    };

    img.src = state.imageSrc;
  }

  function roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
  }

  function drawMarker(ctx, x, y, color, label) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0a0d12";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y + 1);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  function hydrateLastImage() {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_IMAGE) || "";
    if (!saved) return;
    state.imageSrc = saved;
    renderAll();
  }

  function wireEvents() {
    els.photoBtn?.addEventListener("click", () => {
      els.photoInput?.click();
    });

    els.photoInput?.addEventListener("change", (ev) => {
      const file = ev.target?.files?.[0];
      onPhotoChosen(file);
    });

    els.undoBtn?.addEventListener("click", () => {
      if (state.frozen) return;
      if (state.shots.length) {
        state.shots.pop();
      } else if (state.aim) {
        state.aim = null;
      }
      state.secData = null;
      renderAll();
    });

    els.clearBtn?.addEventListener("click", () => {
      if (!state.imageSrc) return;
      state.aim = null;
      state.shots = [];
      state.frozen = false;
      state.secData = null;
      hideOverlay();
      renderAll();
    });

    els.showResultsBtn?.addEventListener("click", showResults);

    els.backBtn?.addEventListener("click", stepBack);

    els.secBackBtn?.addEventListener("click", backFromOverlay);
    els.saveSecBtn?.addEventListener("click", saveSEC);

    els.targetWrap?.addEventListener("pointerdown", startPointer, { passive: true });
    els.targetWrap?.addEventListener("pointerup", endPointer, { passive: true });
    els.targetWrap?.addEventListener("pointercancel", cancelPointer, { passive: true });
    els.targetWrap?.addEventListener("pointerleave", cancelPointer, { passive: true });

    window.addEventListener("resize", () => {
      setViewportHeightVar();
      renderAll();
    });

    window.addEventListener("orientationchange", () => {
      setViewportHeightVar();
      setTimeout(() => {
        renderAll();
        window.scrollTo(0, 0);
      }, 40);
    });

    window.addEventListener("popstate", () => {
      if (suppressNextPop) return;

      if (!els.secOverlay?.classList.contains("isHidden")) {
        backFromOverlay();
        return;
      }

      if (state.view === "workspace") {
        resetSession();
        setView("landing", false);
        return;
      }

      setView("landing", false);
    });
  }

  function init() {
    setViewportHeightVar();
    hideOverlay();
    hydrateLastImage();
    wireEvents();

    history.replaceState({ view: "landing" }, "", window.location.href);

    if (state.imageSrc) {
      setView("workspace", false);
    } else {
      setView("landing", false);
    }

    renderAll();
  }

  init();
})();
