/* ============================================================
   docs/index.js — FULL REPLACEMENT
   SINGLE-SCREEN SEC OVERLAY BUILD
   FIX: PHOTO RESTORE FROM STORAGE
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

  const KEY_TARGET_IMG_DATAURL = "SCZN3_TARGET_IMG_DATAURL_V1";

  const state = {
    imageSrc: "",
    aim: null,
    shots: [],
    frozen: false,
    pointerStart: null
  };

  let objectUrl = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round2(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  function setText(el, text) {
    if (el) el.textContent = String(text ?? "");
  }

  function showLanding() {
    els.landingView?.classList.remove("scoreHidden");
    els.workspaceView?.classList.add("scoreHidden");
  }

  function showWorkspace() {
    els.landingView?.classList.add("scoreHidden");
    els.workspaceView?.classList.remove("scoreHidden");
  }

  function updateShotCount() {
    setText(els.shotCount, state.shots.length);
  }

  function updateInstruction() {
    if (!state.imageSrc) {
      setText(els.instructionLine, "Add a target photo.");
      return;
    }

    if (!state.aim) {
      setText(els.instructionLine, "Tap aim point.");
      return;
    }

    if (state.shots.length >= 7) {
      setText(els.instructionLine, "Maximum 7 shots reached.");
      return;
    }

    setText(els.instructionLine, `Tap shot ${state.shots.length + 1}.`);
  }

  function updateStatus() {
    if (!state.imageSrc) {
      setText(els.statusLine, "Add a target photo to begin.");
      return;
    }

    if (!state.aim) {
      setText(els.statusLine, "First tap sets the aim point.");
      return;
    }

    if (state.shots.length === 0) {
      setText(els.statusLine, "Add at least 1 shot to show results.");
      return;
    }

    if (state.frozen) {
      setText(
        els.statusLine,
        `SEC open • ${state.shots.length} shot${state.shots.length === 1 ? "" : "s"} recorded`
      );
      return;
    }

    setText(
      els.statusLine,
      `Ready • ${state.shots.length} shot${state.shots.length === 1 ? "" : "s"} recorded`
    );
  }

  function updateButtons() {
    const hasAnyTap = !!state.aim || state.shots.length > 0;
    const canShowResults = !!state.imageSrc && !!state.aim && state.shots.length >= 1;

    if (els.undoBtn) els.undoBtn.disabled = !hasAnyTap || state.frozen;
    if (els.clearBtn) els.clearBtn.disabled = !hasAnyTap || state.frozen;
    if (els.showResultsBtn) els.showResultsBtn.disabled = !canShowResults || state.frozen;
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

    state.shots.forEach((shot, idx) => {
      const d = document.createElement("div");
      d.className = "shotDot hitDot";
      d.style.left = `${shot.x * 100}%`;
      d.style.top = `${shot.y * 100}%`;
      d.textContent = String(idx + 1);
      els.dotsLayer.appendChild(d);
    });
  }

  function renderAll() {
    updateShotCount();
    updateInstruction();
    updateStatus();
    updateButtons();
    renderDots();
  }

  function closeOverlay() {
    state.frozen = false;
    els.freezeScrim?.classList.add("isHidden");
    els.secOverlay?.classList.add("isHidden");
    els.targetWrap?.classList.remove("isFrozen");
    renderAll();
  }

  function openOverlay() {
    const summary = buildSummary();
    if (!summary) return;

    state.frozen = true;

    setText(els.secShotCount, summary.shotCount);
    setText(els.secStatus, summary.statusText);
    setText(els.secWindage, summary.windageText);
    setText(els.secElevation, summary.elevationText);

    els.freezeScrim?.classList.remove("isHidden");
    els.secOverlay?.classList.remove("isHidden");
    els.targetWrap?.classList.add("isFrozen");

    renderAll();
  }

  function resetTapsOnly() {
    closeOverlay();
    state.aim = null;
    state.shots = [];
    renderAll();
  }

  function undoLastTap() {
    if (state.frozen) return;

    if (state.shots.length > 0) {
      state.shots.pop();
      renderAll();
      return;
    }

    if (state.aim) {
      state.aim = null;
      renderAll();
    }
  }

  function getWrapRect() {
    return els.targetWrap?.getBoundingClientRect() || null;
  }

  function clientPointFromEvent(evt) {
    if (evt.touches && evt.touches[0]) {
      return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
    }
    if (evt.changedTouches && evt.changedTouches[0]) {
      return { x: evt.changedTouches[0].clientX, y: evt.changedTouches[0].clientY };
    }
    return { x: evt.clientX, y: evt.clientY };
  }

  function rememberPointerStart(evt) {
    state.pointerStart = clientPointFromEvent(evt);
  }

  function movementTooLarge(evt) {
    if (!state.pointerStart) return false;
    const now = clientPointFromEvent(evt);
    return Math.abs(now.x - state.pointerStart.x) > 12 || Math.abs(now.y - state.pointerStart.y) > 12;
  }

  function eventToNormalizedPoint(evt) {
    const rect = getWrapRect();
    if (!rect) return null;

    const pt = clientPointFromEvent(evt);

    return {
      x: clamp((pt.x - rect.left) / rect.width, 0, 1),
      y: clamp((pt.y - rect.top) / rect.height, 0, 1)
    };
  }

  function onTargetTap(evt) {
    if (!state.imageSrc) return;
    if (state.frozen) return;
    if (movementTooLarge(evt)) return;

    evt.preventDefault();

    const point = eventToNormalizedPoint(evt);
    if (!point) return;

    if (!state.aim) {
      state.aim = point;
      renderAll();
      return;
    }

    if (state.shots.length >= 7) {
      renderAll();
      return;
    }

    state.shots.push(point);
    renderAll();
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = src;
    });
  }

  async function setWorkingImage(src) {
    if (!src || !els.targetImg) return false;

    try {
      await loadImage(src);
    } catch (err) {
      console.error(err);
      return false;
    }

    state.imageSrc = src;

    return await new Promise((resolve) => {
      els.targetImg.onload = () => {
        showWorkspace();
        closeOverlay();
        renderAll();
        window.scrollTo(0, 0);
        resolve(true);
      };

      els.targetImg.onerror = () => {
        setText(els.statusLine, "Photo failed to load.");
        resolve(false);
      };

      els.targetImg.src = src;

      if (els.targetImg.complete) {
        els.targetImg.onload?.();
      }
    });
  }

  async function handlePhotoFile(file) {
    if (!file) return;

    closeOverlay();

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }

    objectUrl = URL.createObjectURL(file);

    state.aim = null;
    state.shots = [];

    try {
      const dataUrl = await readFileAsDataURL(file);
      localStorage.setItem(KEY_TARGET_IMG_DATAURL, dataUrl);
    } catch (err) {
      console.error(err);
    }

    await setWorkingImage(objectUrl);
  }

  async function restorePhotoFromStorage() {
    const stored = String(localStorage.getItem(KEY_TARGET_IMG_DATAURL) || "").trim();
    if (!stored) return false;

    state.aim = null;
    state.shots = [];

    const ok = await setWorkingImage(stored);
    if (!ok) {
      try {
        localStorage.removeItem(KEY_TARGET_IMG_DATAURL);
      } catch {}
      state.imageSrc = "";
      return false;
    }

    return true;
  }

  function buildSummary() {
    if (!state.aim || state.shots.length === 0) return null;

    const avgX = state.shots.reduce((sum, p) => sum + p.x, 0) / state.shots.length;
    const avgY = state.shots.reduce((sum, p) => sum + p.y, 0) / state.shots.length;

    const dx = round2(avgX - state.aim.x);
    const dy = round2(avgY - state.aim.y);

    const windageDir = dx > 0 ? "LEFT" : dx < 0 ? "RIGHT" : "HOLD";
    const elevationDir = dy > 0 ? "UP" : dy < 0 ? "DOWN" : "HOLD";

    const windageMagnitude = round2(Math.abs(dx) * 100);
    const elevationMagnitude = round2(Math.abs(dy) * 100);

    return {
      shotCount: state.shots.length,
      statusText: state.shots.length >= 3 ? "Results Ready" : "Quick Read",
      windageText: windageMagnitude === 0 ? "HOLD" : `${windageDir} ${windageMagnitude}`,
      elevationText: elevationMagnitude === 0 ? "HOLD" : `${elevationDir} ${elevationMagnitude}`
    };
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function exportVisibleResult() {
    const summary = buildSummary();
    if (!summary || !els.targetWrap || !els.targetImg?.src) return;

    const rect = els.targetWrap.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    loadImage(els.targetImg.src)
      .then((img) => {
        ctx.drawImage(img, 0, 0, width, height);

        if (state.aim) {
          const ax = state.aim.x * width;
          const ay = state.aim.y * height;

          ctx.beginPath();
          ctx.arc(ax, ay, 11, 0, Math.PI * 2);
          ctx.fillStyle = "#2f66ff";
          ctx.fill();

          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(ax - 8, ay);
          ctx.lineTo(ax + 8, ay);
          ctx.moveTo(ax, ay - 8);
          ctx.lineTo(ax, ay + 8);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
        }

        state.shots.forEach((shot, idx) => {
          const x = shot.x * width;
          const y = shot.y * height;
          const r = 13;

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = "#ff4d5d";
          ctx.fill();

          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "700 12px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(idx + 1), x, y + 0.5);
        });

        ctx.fillStyle = "rgba(5, 9, 20, 0.58)";
        ctx.fillRect(0, 0, width, height);

        const cardW = Math.min(width - 24, 540);
        const cardH = Math.min(Math.round(height * 0.42), 260);
        const cardX = Math.round((width - cardW) / 2);
        const cardY = height - cardH - 14;

        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 22);
        ctx.fillStyle = "rgba(8, 20, 52, 0.94)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.12)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        ctx.font = "900 24px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
        ctx.fillText("SEC", cardX + 16, cardY + 32);

        ctx.font = "900 11px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
        ctx.fillStyle = "rgba(184,197,234,1)";
        ctx.fillText("SHOTS", cardX + 16, cardY + 58);
        ctx.fillText("STATUS", cardX + 120, cardY + 58);
        ctx.fillText("WINDAGE", cardX + 16, cardY + 122);
        ctx.fillText("ELEVATION", cardX + 16, cardY + 184);

        ctx.fillStyle = "#ffffff";
        ctx.font = "900 32px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
        ctx.fillText(String(summary.shotCount), cardX + 16, cardY + 92);

        ctx.font = "900 18px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
        ctx.fillText(summary.statusText, cardX + 120, cardY + 92);
        ctx.fillText(summary.windageText, cardX + 16, cardY + 154);
        ctx.fillText(summary.elevationText, cardX + 16, cardY + 216);

        canvas.toBlob((blob) => {
          if (!blob) return;

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `SEC-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();

          setTimeout(() => URL.revokeObjectURL(url), 60000);
        }, "image/png");
      })
      .catch((err) => {
        console.error(err);
        alert("Save failed.");
      });
  }

  function bindEvents() {
    els.photoBtn?.addEventListener("click", () => els.photoInput?.click());

    els.photoInput?.addEventListener("change", async (evt) => {
      const file = evt.target?.files?.[0];
      if (file) await handlePhotoFile(file);
      evt.target.value = "";
    });

    ["pointerdown", "touchstart", "mousedown"].forEach((eventName) => {
      els.targetWrap?.addEventListener(eventName, rememberPointerStart, { passive: true });
    });

    ["click", "touchend"].forEach((eventName) => {
      els.targetWrap?.addEventListener(eventName, onTargetTap, { passive: false });
    });

    els.undoBtn?.addEventListener("click", undoLastTap);
    els.clearBtn?.addEventListener("click", resetTapsOnly);
    els.showResultsBtn?.addEventListener("click", openOverlay);
    els.closeSecBtn?.addEventListener("click", closeOverlay);
    els.saveSecBtn?.addEventListener("click", exportVisibleResult);
  }

  async function init() {
    bindEvents();
    renderAll();

    const restored = await restorePhotoFromStorage();

    if (restored) {
      showWorkspace();
    } else {
      showLanding();
      renderAll();
    }
  }

  init();
})();
