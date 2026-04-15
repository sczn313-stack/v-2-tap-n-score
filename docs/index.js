/* ============================================================
   docs/index.js — FULL REPLACEMENT
   Behind-the-scenes SEC image flow
   - No live SEC page handoff
   - Show Results builds final SEC image silently
   - Auto opens share/save flow directly
   - History stays in localStorage only
============================================================ */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const byIds = (...ids) => ids.map((id) => $(id)).find(Boolean) || null;

  const els = {
    photoBtn: byIds("photoBtn"),
    photoInput: byIds("photoInput"),
    targetImg: byIds("targetImg"),
    targetWrap: byIds("targetWrap"),
    dotsLayer: byIds("dotsLayer"),
    instruction: byIds("instruction", "topInstruction", "tapInstruction"),
    status: byIds("status", "statusText", "liveStatus"),
    tapCount: byIds("tapCount", "shotCount", "hitsCount"),
    showResultsBtn: byIds("showResultsBtn", "resultsBtn", "showResults"),
    resetBtn: byIds("resetBtn", "clearBtn"),
    vendorPanel: byIds("vendorPanel", "vendorBox"),
    vendorPanelLink: byIds("vendorPanelLink", "vendorLink"),
    vendorName: byIds("vendorName"),
    matrix: byIds("settingsMatrix"),
    stickyBar: byIds("stickyResults", "stickyBar"),
    stickyText: byIds("stickyResultsText", "stickyText"),
    yardInput: byIds("yardageInput", "distanceInput", "yardsInput"),
    unitToggle: byIds("unitToggle", "dialUnitToggle"),
    clickInput: byIds("clickValueInput", "clickInput"),
    rangeUnitSelect: byIds("rangeUnit", "distanceUnit"),
    targetSizeSelect: byIds("targetSize", "targetSizeSelect"),
  };

  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";
  const KEY_VENDOR_NAME = "SCZN3_VENDOR_NAME_V1";
  const KEY_TARGET_IMG_DATAURL = "SCZN3_TARGET_IMG_DATAURL_V1";
  const KEY_TARGET_IMG_BLOBURL = "SCZN3_TARGET_IMG_BLOBURL_V1";
  const KEY_SEC_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_SEC_HISTORY = "SCZN3_SEC_HISTORY_V1";
  const KEY_RANGE_YDS = "SCZN3_RANGE_YDS_V1";
  const KEY_RANGE_UNIT = "SCZN3_RANGE_UNIT_V1";
  const KEY_DIAL_UNIT = "SCZN3_DIAL_UNIT_V1";
  const KEY_CLICK_VALUE = "SCZN3_CLICK_VALUE_V1";
  const KEY_TARGET_W_IN = "SCZN3_TARGET_W_IN_V1";
  const KEY_TARGET_H_IN = "SCZN3_TARGET_H_IN_V1";
  const KEY_TARGET_SIZE_KEY = "SCZN3_TARGET_SIZE_KEY_V1";

  const DEFAULTS = {
    rangeYds: 100,
    rangeUnit: "yd",
    dialUnit: "MOA",
    clickValue: 0.25,
    targetWIn: 8.5,
    targetHIn: 11,
    shotGoal: 5
  };

  let objectUrl = null;
  let aim = null;
  let hits = [];
  let touchStart = null;
  let sessionStartedAt = Date.now();

  function getUrl() {
    try {
      return new URL(window.location.href);
    } catch {
      return null;
    }
  }

  function getParam(name) {
    const u = getUrl();
    return u ? (u.searchParams.get(name) || "") : "";
  }

  function getVendor() {
    return getParam("v").toLowerCase();
  }

  function getSku() {
    return getParam("sku").toLowerCase();
  }

  function getBatch() {
    return getParam("b").trim();
  }

  function getMode() {
    return getParam("mode").trim() || "live";
  }

  function isBakerMode() {
    return getVendor() === "baker";
  }

  function isB2B() {
    return getVendor() === "baker" && getSku() === "bkr-b2b";
  }

  function setText(el, text) {
    if (el) el.textContent = text || "";
  }

  function safeNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function getRangeYds() {
    const urlVal = safeNumber(getParam("yds"), NaN);
    const stored = safeNumber(localStorage.getItem(KEY_RANGE_YDS), DEFAULTS.rangeYds);
    const domVal = els.yardInput ? safeNumber(els.yardInput.value, NaN) : NaN;
    return safeNumber(domVal, safeNumber(urlVal, stored));
  }

  function getRangeUnit() {
    const stored = (localStorage.getItem(KEY_RANGE_UNIT) || "").trim();
    const domVal = els.rangeUnitSelect ? String(els.rangeUnitSelect.value || "").trim() : "";
    const value = domVal || stored || DEFAULTS.rangeUnit;
    return value.toLowerCase() === "m" ? "m" : "yd";
  }

  function getDialUnit() {
    const stored = (localStorage.getItem(KEY_DIAL_UNIT) || "").trim();
    const domVal = els.unitToggle ? String(els.unitToggle.value || "").trim() : "";
    const value = (domVal || stored || DEFAULTS.dialUnit).toUpperCase();
    return value === "MRAD" ? "MRAD" : "MOA";
  }

  function getClickValue() {
    const stored = safeNumber(localStorage.getItem(KEY_CLICK_VALUE), DEFAULTS.clickValue);
    const domVal = els.clickInput ? safeNumber(els.clickInput.value, NaN) : NaN;
    const dialUnit = getDialUnit();
    const fallback = dialUnit === "MRAD" ? 0.1 : 0.25;
    return safeNumber(domVal, safeNumber(stored, fallback));
  }

  function getTargetDimsInches() {
    const urlW = safeNumber(getParam("wIn"), NaN);
    const urlH = safeNumber(getParam("hIn"), NaN);
    const storedW = safeNumber(localStorage.getItem(KEY_TARGET_W_IN), DEFAULTS.targetWIn);
    const storedH = safeNumber(localStorage.getItem(KEY_TARGET_H_IN), DEFAULTS.targetHIn);

    const w = safeNumber(urlW, storedW);
    const h = safeNumber(urlH, storedH);

    return {
      w: w > 0 ? w : DEFAULTS.targetWIn,
      h: h > 0 ? h : DEFAULTS.targetHIn
    };
  }

  function persistSettings() {
    try {
      localStorage.setItem(KEY_RANGE_YDS, String(getRangeYds()));
      localStorage.setItem(KEY_RANGE_UNIT, getRangeUnit());
      localStorage.setItem(KEY_DIAL_UNIT, getDialUnit());
      localStorage.setItem(KEY_CLICK_VALUE, String(getClickValue()));
      const dims = getTargetDimsInches();
      localStorage.setItem(KEY_TARGET_W_IN, String(dims.w));
      localStorage.setItem(KEY_TARGET_H_IN, String(dims.h));
      if (els.targetSizeSelect?.value) {
        localStorage.setItem(KEY_TARGET_SIZE_KEY, String(els.targetSizeSelect.value));
      }
    } catch {}
  }

  function hydrateVendor() {
    try {
      if (isBakerMode()) {
        localStorage.setItem(KEY_VENDOR_URL, "https://bakertargets.com");
        localStorage.setItem(KEY_VENDOR_NAME, "BAKER TARGETS");
      }

      const storedUrl = String(localStorage.getItem(KEY_VENDOR_URL) || "").trim();
      const storedName = String(localStorage.getItem(KEY_VENDOR_NAME) || "").trim();

      if (els.vendorPanelLink && storedUrl) {
        els.vendorPanelLink.href = storedUrl;
      }

      if (els.vendorName) {
        els.vendorName.textContent = storedName || (isBakerMode() ? "BAKER TARGETS" : "Vendor Not Set");
      }
    } catch {}
  }

  function openVendorPanel() {
    if (!els.vendorPanel) return;
    els.vendorPanel.classList.add("open", "show", "is-open");
  }

  function closeVendorPanel() {
    if (!els.vendorPanel) return;
    els.vendorPanel.classList.remove("open", "show", "is-open");
  }

  function setInstruction(text) {
    if (!els.instruction) return;
    void els.instruction.offsetHeight;
    els.instruction.textContent = text || "";
    els.instruction.style.opacity = "1";
    els.instruction.style.transform = "translateY(0px)";
  }

  function syncInstruction() {
    if (!els.targetImg?.src) {
      setInstruction("Add a target photo.");
      return;
    }
    if (!aim) {
      setInstruction("Tap Aim Point.");
      return;
    }
    setInstruction("Tap Bullet Holes.");
  }

  function setTapCount() {
    setText(els.tapCount, `${hits.length}`);
  }

  function showSticky(text) {
    if (els.stickyText) els.stickyText.textContent = text || "";
    if (els.stickyBar) els.stickyBar.classList.add("show", "is-visible");
  }

  function hideSticky() {
    if (els.stickyBar) els.stickyBar.classList.remove("show", "is-visible");
  }

  function updateStatus() {
    if (!els.status) return;

    if (!els.targetImg?.src) {
      setText(els.status, "Add a target photo.");
      hideSticky();
      return;
    }

    if (!aim) {
      setText(els.status, "Tap Aim Point.");
      hideSticky();
      return;
    }

    if (hits.length < 3) {
      setText(els.status, `Tap Bullet Holes. ${hits.length}/3 minimum`);
      showSticky(`Results ready at 3+ shots • ${hits.length} recorded`);
      return;
    }

    setText(els.status, `Ready • ${hits.length} shot${hits.length === 1 ? "" : "s"} recorded`);
    showSticky(`Show Results • ${hits.length} shot${hits.length === 1 ? "" : "s"} recorded`);
  }

  function releaseObjectUrl() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  async function handlePhotoFile(file) {
    if (!file || !els.targetImg) return;

    releaseObjectUrl();
    objectUrl = URL.createObjectURL(file);
    els.targetImg.src = objectUrl;

    try {
      const dataUrl = await readFileAsDataURL(file);
      localStorage.setItem(KEY_TARGET_IMG_DATAURL, dataUrl);
      localStorage.setItem(KEY_TARGET_IMG_BLOBURL, objectUrl);
    } catch {}

    resetAll(false);
    syncInstruction();
    updateStatus();
  }

  function restorePhoto() {
    if (!els.targetImg) return;
    const dataUrl = String(localStorage.getItem(KEY_TARGET_IMG_DATAURL) || "");
    if (!dataUrl) return;
    els.targetImg.src = dataUrl;
    syncInstruction();
    updateStatus();
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

  function eventToPercent(evt) {
    const rect = getWrapRect();
    if (!rect) return null;

    const pt = clientPointFromEvent(evt);
    const x = clamp((pt.x - rect.left) / rect.width, 0, 1);
    const y = clamp((pt.y - rect.top) / rect.height, 0, 1);

    return {
      xPct: x,
      yPct: y,
      xPx: x * rect.width,
      yPx: y * rect.height
    };
  }

  function createDot(className, xPct, yPct, label) {
    if (!els.dotsLayer) return;
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `shotDot ${className}`.trim();
    dot.style.left = `${xPct * 100}%`;
    dot.style.top = `${yPct * 100}%`;
    dot.setAttribute("aria-label", label || className);
    if (className === "hitDot") {
      dot.textContent = String(hits.length);
    }
    els.dotsLayer.appendChild(dot);
  }

  function renderDots() {
    if (!els.dotsLayer) return;
    els.dotsLayer.innerHTML = "";

    if (aim) {
      createDot("aimDot", aim.xPct, aim.yPct, "Aim Point");
    }

    hits.forEach((hit, idx) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "shotDot hitDot";
      dot.style.left = `${hit.xPct * 100}%`;
      dot.style.top = `${hit.yPct * 100}%`;
      dot.setAttribute("aria-label", `Shot ${idx + 1}`);
      dot.textContent = String(idx + 1);
      els.dotsLayer.appendChild(dot);
    });
  }

  function resetAll(clearImage = false) {
    aim = null;
    hits = [];
    touchStart = null;

    if (els.dotsLayer) els.dotsLayer.innerHTML = "";
    setTapCount();
    hideSticky();
    closeVendorPanel();

    if (clearImage && els.targetImg) {
      els.targetImg.removeAttribute("src");
      try {
        localStorage.removeItem(KEY_TARGET_IMG_DATAURL);
        localStorage.removeItem(KEY_TARGET_IMG_BLOBURL);
      } catch {}
      releaseObjectUrl();
    }

    syncInstruction();
    updateStatus();
  }

  function maybeTrackStart(evt) {
    touchStart = clientPointFromEvent(evt);
  }

  function movementTooLarge(evt) {
    if (!touchStart) return false;
    const now = clientPointFromEvent(evt);
    const dx = Math.abs(now.x - touchStart.x);
    const dy = Math.abs(now.y - touchStart.y);
    return dx > 12 || dy > 12;
  }

  function onTargetTap(evt) {
    if (!els.targetImg?.src) return;
    if (movementTooLarge(evt)) return;

    evt.preventDefault();

    const point = eventToPercent(evt);
    if (!point) return;

    if (!aim) {
      aim = {
        xPct: point.xPct,
        yPct: point.yPct
      };
      renderDots();
      syncInstruction();
      updateStatus();
      return;
    }

    hits.push({
      xPct: point.xPct,
      yPct: point.yPct
    });

    renderDots();
    setTapCount();
    syncInstruction();
    updateStatus();
  }

  function avg(list, key) {
    if (!list.length) return 0;
    return list.reduce((sum, item) => sum + item[key], 0) / list.length;
  }

  function computeGroupMetrics() {
    if (!aim || hits.length === 0) return null;

    const centroidXPct = avg(hits, "xPct");
    const centroidYPct = avg(hits, "yPct");

    const dims = getTargetDimsInches();
    const dxInches = round2((centroidXPct - aim.xPct) * dims.w);
    const dyInches = round2((centroidYPct - aim.yPct) * dims.h);

    const rangeYds = getRangeUnit() === "m"
      ? round2(getRangeYds() * 1.09361)
      : getRangeYds();

    const dialUnit = getDialUnit();
    const clickValue = getClickValue();

    let windageUnitValue = 0;
    let elevationUnitValue = 0;
    let windageClicks = 0;
    let elevationClicks = 0;

    if (dialUnit === "MRAD") {
      const meters = rangeYds * 0.9144;
      const inchesPerMrad = meters * 39.3701 * 0.001;
      windageUnitValue = inchesPerMrad ? round2(Math.abs(dxInches) / inchesPerMrad) : 0;
      elevationUnitValue = inchesPerMrad ? round2(Math.abs(dyInches) / inchesPerMrad) : 0;
      windageClicks = clickValue ? round2(windageUnitValue / clickValue) : 0;
      elevationClicks = clickValue ? round2(elevationUnitValue / clickValue) : 0;
    } else {
      const inchesPerMoa = (rangeYds / 100) * 1.047;
      windageUnitValue = inchesPerMoa ? round2(Math.abs(dxInches) / inchesPerMoa) : 0;
      elevationUnitValue = inchesPerMoa ? round2(Math.abs(dyInches) / inchesPerMoa) : 0;
      windageClicks = clickValue ? round2(windageUnitValue / clickValue) : 0;
      elevationClicks = clickValue ? round2(elevationUnitValue / clickValue) : 0;
    }

    const windageDir = dxInches > 0 ? "LEFT" : dxInches < 0 ? "RIGHT" : "—";
    const elevationDir = dyInches > 0 ? "UP" : dyInches < 0 ? "DOWN" : "—";

    const groupSizeInches = computeMaxSpreadInches(hits, dims);

    return {
      aim,
      hits: [...hits],
      shotCount: hits.length,
      centroidXPct: round2(centroidXPct),
      centroidYPct: round2(centroidYPct),
      dxInches,
      dyInches,
      windageUnitValue,
      elevationUnitValue,
      windageClicks,
      elevationClicks,
      windageDir,
      elevationDir,
      dialUnit,
      clickValue,
      rangeYds: round2(rangeYds),
      groupSizeInches,
      vendor: getVendor() || "",
      sku: getSku() || "",
      batch: getBatch() || "",
      mode: getMode(),
      isB2B: isB2B(),
      targetWIn: dims.w,
      targetHIn: dims.h,
      createdAt: new Date().toISOString()
    };
  }

  function computeMaxSpreadInches(points, dims) {
    if (!points || points.length < 2) return 0;
    let max = 0;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = (points[i].xPct - points[j].xPct) * dims.w;
        const dy = (points[i].yPct - points[j].yPct) * dims.h;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > max) max = d;
      }
    }
    return round2(max);
  }

  function computeScore(metrics) {
    if (!metrics) return 0;
    const spreadPenalty = clamp(metrics.groupSizeInches * 9, 0, 50);
    const offsetPenalty = clamp((Math.abs(metrics.dxInches) + Math.abs(metrics.dyInches)) * 12, 0, 50);
    return Math.max(0, Math.min(100, Math.round(100 - spreadPenalty - offsetPenalty)));
  }

  function getScoreBand(score) {
    if (score >= 90) return { label: "STRONG", detail: "Excellent" };
    if (score >= 60) return { label: "IMPROVING", detail: "Solid" };
    return { label: "NEEDS WORK", detail: "Keep refining" };
  }

  function buildPayload() {
    const metrics = computeGroupMetrics();
    if (!metrics) return null;

    const score = computeScore(metrics);
    const band = getScoreBand(score);
    const payload = {
      ...metrics,
      score,
      scoreBand: band.label,
      scoreDetail: band.detail,
      sessionStartedAt,
      sessionDurationMs: Date.now() - sessionStartedAt
    };

    return payload;
  }

  function persistPayload(payload) {
    if (!payload) return;

    try {
      localStorage.setItem(KEY_SEC_PAYLOAD, JSON.stringify(payload));

      const raw = localStorage.getItem(KEY_SEC_HISTORY);
      const history = Array.isArray(JSON.parse(raw || "[]")) ? JSON.parse(raw || "[]") : [];
      history.unshift(payload);
      localStorage.setItem(KEY_SEC_HISTORY, JSON.stringify(history.slice(0, 10)));
    } catch {}
  }

  function bgForScore(ctx, width, height, score) {
    const g = ctx.createLinearGradient(0, 0, width, height);
    if (score >= 90) {
      g.addColorStop(0, "#0c2d18");
      g.addColorStop(1, "#102418");
    } else if (score >= 60) {
      g.addColorStop(0, "#3b2d0f");
      g.addColorStop(1, "#231c0d");
    } else {
      g.addColorStop(0, "#381315");
      g.addColorStop(1, "#200d0f");
    }
    return g;
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function buildSecImageBlob(payload) {
    const width = 1400;
    const height = 2200;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bgForScore(ctx, width, height, payload.score);
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 24; i++) {
      const y = 120 + i * 84;
      ctx.fillRect(70, y, width - 140, 1);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 54px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("SCZN3 • Shooter Experience Card", 80, 110);

    ctx.font = "700 165px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(String(payload.score), 80, 280);

    ctx.font = "700 52px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(payload.scoreBand, 320, 220);
    ctx.font = "400 36px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(payload.scoreDetail, 320, 275);

    drawRoundedRect(ctx, 80, 340, width - 160, 640, 32);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();

    const imageSrc = String(localStorage.getItem(KEY_TARGET_IMG_DATAURL) || els.targetImg?.src || "");
    if (imageSrc) {
      try {
        const shotImg = await loadImage(imageSrc);
        const boxX = 110;
        const boxY = 375;
        const boxW = width - 220;
        const boxH = 570;

        const scale = Math.min(boxW / shotImg.width, boxH / shotImg.height);
        const drawW = shotImg.width * scale;
        const drawH = shotImg.height * scale;
        const drawX = boxX + (boxW - drawW) / 2;
        const drawY = boxY + (boxH - drawH) / 2;

        ctx.drawImage(shotImg, drawX, drawY, drawW, drawH);

        const px = (pctX, pctY) => ({
          x: drawX + pctX * drawW,
          y: drawY + pctY * drawH
        });

        if (payload.aim) {
          const a = px(payload.aim.xPct, payload.aim.yPct);
          ctx.strokeStyle = "#69b7ff";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(a.x - 18, a.y);
          ctx.lineTo(a.x + 18, a.y);
          ctx.moveTo(a.x, a.y - 18);
          ctx.lineTo(a.x, a.y + 18);
          ctx.stroke();
        }

        payload.hits.forEach((hit, idx) => {
          const p = px(hit.xPct, hit.yPct);
          ctx.fillStyle = "#ff4d5d";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = "700 22px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
          ctx.fillText(String(idx + 1), p.x + 16, p.y + 8);
        });

        const c = px(payload.centroidXPct, payload.centroidYPct);
        ctx.strokeStyle = "#ffd34d";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(c.x - 20, c.y - 20);
        ctx.lineTo(c.x + 20, c.y + 20);
        ctx.moveTo(c.x + 20, c.y - 20);
        ctx.lineTo(c.x - 20, c.y + 20);
        ctx.stroke();
      } catch {}
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 46px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("Scope Adjustments", 80, 1060);

    const lines = [
      `Windage: ${payload.windageClicks.toFixed(2)} clicks ${payload.windageDir}`,
      `Elevation: ${payload.elevationClicks.toFixed(2)} clicks ${payload.elevationDir}`,
      `Offset: ${Math.abs(payload.dxInches).toFixed(2)}" ${payload.dxInches > 0 ? "right" : payload.dxInches < 0 ? "left" : "center"} • ${Math.abs(payload.dyInches).toFixed(2)}" ${payload.dyInches > 0 ? "low" : payload.dyInches < 0 ? "high" : "center"}`,
      `${payload.dialUnit}: ${payload.windageUnitValue.toFixed(2)} / ${payload.elevationUnitValue.toFixed(2)} • Click value ${payload.clickValue.toFixed(2)}`,
      `Distance: ${payload.rangeYds.toFixed(2)} yd • Shots: ${payload.shotCount}`,
      `Group Size: ${payload.groupSizeInches.toFixed(2)}"`
    ];

    ctx.font = "500 40px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    lines.forEach((line, idx) => {
      ctx.fillText(line, 80, 1140 + idx * 76);
    });

    drawRoundedRect(ctx, 80, 1640, width - 160, 260, 28);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 40px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("Confirmation", 110, 1710);
    ctx.font = "500 34px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("Adjust scope as indicated, then re-fire to confirm zero.", 110, 1775);
    ctx.fillText(`Vendor: ${(localStorage.getItem(KEY_VENDOR_NAME) || "Official Target Partner").trim()}`, 110, 1840);

    ctx.font = "400 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillText(`Generated ${new Date(payload.createdAt).toLocaleString()}`, 80, 2060);
    ctx.fillText("Faith • Order • Precision", 80, 2110);

    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1);
    });
  }

  async function shareBlob(blob, filename) {
    if (!blob) return false;

    const file = new File([blob], filename, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "SCZN3 SEC",
        text: "Shooter Experience Card"
      });
      return true;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  }

  async function onShowResults() {
    persistSettings();

    const payload = buildPayload();
    if (!payload || payload.shotCount < 3) {
      setText(els.status, "Need at least 3 shots.");
      return;
    }

    persistPayload(payload);

    try {
      const blob = await buildSecImageBlob(payload);
      await shareBlob(blob, `SCZN3_SEC_${Date.now()}.png`);
      setText(els.status, "SEC image ready.");
      openVendorPanel();
    } catch (err) {
      console.error(err);
      setText(els.status, "Could not build SEC image.");
    }
  }

  function bindEvents() {
    els.photoBtn?.addEventListener("click", () => els.photoInput?.click());

    els.photoInput?.addEventListener("change", async (evt) => {
      const file = evt.target?.files?.[0];
      if (file) await handlePhotoFile(file);
      evt.target.value = "";
    });

    ["pointerdown", "touchstart", "mousedown"].forEach((name) => {
      els.targetWrap?.addEventListener(name, maybeTrackStart, { passive: true });
    });

    ["click", "touchend"].forEach((name) => {
      els.targetWrap?.addEventListener(name, onTargetTap, { passive: false });
    });

    els.resetBtn?.addEventListener("click", () => resetAll(false));
    els.showResultsBtn?.addEventListener("click", onShowResults);

    els.vendorPanelLink?.addEventListener("click", () => {
      try {
        const href = String(els.vendorPanelLink.href || "").trim();
        if (href) localStorage.setItem(KEY_VENDOR_URL, href);
      } catch {}
    });

    [
      els.yardInput,
      els.unitToggle,
      els.clickInput,
      els.rangeUnitSelect,
      els.targetSizeSelect
    ].filter(Boolean).forEach((el) => {
      el.addEventListener("change", persistSettings);
    });
  }

  function init() {
    hydrateVendor();
    restorePhoto();
    bindEvents();
    syncInstruction();
    updateStatus();
    setTapCount();

    if (isBakerMode() && els.vendorPanelLink && !els.vendorPanelLink.href) {
      els.vendorPanelLink.href = "https://bakertargets.com";
    }

    if (els.status && !els.targetImg?.src) {
      els.status.textContent = "Add a target photo.";
    }
  }

  init();
})();
