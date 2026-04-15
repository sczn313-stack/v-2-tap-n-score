/* ============================================================
   docs/index.js — FULL REPLACEMENT
   Matched to current target-page HTML
   - Landing hides after photo load
   - Target workspace becomes primary view
   - Add photo -> tap aim -> tap shots
   - Show Results builds SEC image behind the scenes
   - No live SEC page handoff
============================================================ */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    photoBtn: $("photoBtn"),
    photoInput: $("photoInput"),
    vendorBox: $("vendorBox"),
    vendorLabel: $("vendorLabel"),
    vendorPanel: $("vendorPanel"),
    vendorPanelLink: $("vendorPanelLink"),
    vendorName: $("vendorName"),

    scoreSection: $("scoreSection"),
    targetWrap: $("targetWrap"),
    targetImg: $("targetImg"),
    dotsLayer: $("dotsLayer"),

    tapCount: $("tapCount"),
    clearTapsBtn: $("clearTapsBtn"),
    showResultsBtn: $("showResultsBtn"),
    instructionLine: $("instructionLine"),
    statusLine: $("statusLine"),

    liveDistance: $("liveDistance"),
    liveDial: $("liveDial"),
    liveTarget: $("liveTarget"),

    matrixBtn: $("matrixBtn"),
    matrixPanel: $("matrixPanel"),
    matrixCloseBtn: $("matrixCloseBtn"),

    distanceYds: $("distanceYds"),
    distDown: $("distDown"),
    distUp: $("distUp"),
    distUnitYd: $("distUnitYd"),
    distUnitM: $("distUnitM"),
    distUnitLabel: $("distUnitLabel"),

    unitMoa: $("unitMoa"),
    unitMrad: $("unitMrad"),
    clickValue: $("clickValue"),
    clickUnitLabel: $("clickUnitLabel"),

    sizeChipRow: $("sizeChipRow"),
    presetChipRow: $("presetChipRow"),
    swapSizeBtn: $("swapSizeBtn")
  };

  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";
  const KEY_VENDOR_NAME = "SCZN3_VENDOR_NAME_V1";
  const KEY_TARGET_IMG_DATAURL = "SCZN3_TARGET_IMG_DATAURL_V1";
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
    targetWIn: 23,
    targetHIn: 35,
    targetSizeKey: "23x35"
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
    return isBakerMode() && getSku() === "bkr-b2b";
  }

  function safeNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function setText(el, text) {
    if (el) el.textContent = text;
  }

  function getRangeYds() {
    return safeNumber(els.distanceYds?.value, safeNumber(localStorage.getItem(KEY_RANGE_YDS), DEFAULTS.rangeYds));
  }

  function getRangeUnit() {
    return (localStorage.getItem(KEY_RANGE_UNIT) || DEFAULTS.rangeUnit).toLowerCase() === "m" ? "m" : "yd";
  }

  function getDialUnit() {
    return (localStorage.getItem(KEY_DIAL_UNIT) || DEFAULTS.dialUnit).toUpperCase() === "MRAD" ? "MRAD" : "MOA";
  }

  function getClickValue() {
    const fallback = getDialUnit() === "MRAD" ? 0.1 : 0.25;
    return safeNumber(els.clickValue?.value, safeNumber(localStorage.getItem(KEY_CLICK_VALUE), fallback));
  }

  function getTargetDimsInches() {
    return {
      w: safeNumber(localStorage.getItem(KEY_TARGET_W_IN), DEFAULTS.targetWIn),
      h: safeNumber(localStorage.getItem(KEY_TARGET_H_IN), DEFAULTS.targetHIn)
    };
  }

  function persistSettings() {
    try {
      localStorage.setItem(KEY_RANGE_YDS, String(getRangeYds()));
      localStorage.setItem(KEY_RANGE_UNIT, getRangeUnit());
      localStorage.setItem(KEY_DIAL_UNIT, getDialUnit());
      localStorage.setItem(KEY_CLICK_VALUE, String(getClickValue()));
    } catch {}
    updateLiveBar();
  }

  function setRangeUnit(unit) {
    const next = unit === "m" ? "m" : "yd";
    try {
      localStorage.setItem(KEY_RANGE_UNIT, next);
    } catch {}
    syncMatrixUI();
    updateLiveBar();
  }

  function setDialUnit(unit) {
    const next = unit === "MRAD" ? "MRAD" : "MOA";
    try {
      localStorage.setItem(KEY_DIAL_UNIT, next);
      if (next === "MOA" && !els.clickValue.value) els.clickValue.value = "0.25";
      if (next === "MRAD" && !els.clickValue.value) els.clickValue.value = "0.10";
    } catch {}
    syncMatrixUI();
    updateLiveBar();
  }

  function setTargetSize(sizeKey, w, h) {
    try {
      localStorage.setItem(KEY_TARGET_SIZE_KEY, sizeKey);
      localStorage.setItem(KEY_TARGET_W_IN, String(w));
      localStorage.setItem(KEY_TARGET_H_IN, String(h));
    } catch {}
    syncSizeChips();
    updateLiveBar();
  }

  function hydrateVendor() {
    try {
      if (isBakerMode()) {
        localStorage.setItem(KEY_VENDOR_URL, "https://bakertargets.com");
        localStorage.setItem(KEY_VENDOR_NAME, "BAKER TARGETS");
      }

      const vendorUrl = String(localStorage.getItem(KEY_VENDOR_URL) || "").trim();
      const vendorName = String(localStorage.getItem(KEY_VENDOR_NAME) || "").trim();

      if (els.vendorPanelLink && vendorUrl) els.vendorPanelLink.href = vendorUrl;
      if (els.vendorBox && vendorUrl) els.vendorBox.href = vendorUrl;

      if (els.vendorName) {
        els.vendorName.textContent = vendorName || "OFFICIAL TARGET PARTNER";
      }

      if (els.vendorLabel && isBakerMode()) {
        els.vendorLabel.textContent = "BUY MORE TARGETS LIKE THIS";
      }
    } catch {}
  }

  function openVendorPanel() {
    if (!els.vendorPanel) return;
    els.vendorPanel.classList.remove("vendorHidden");
    els.vendorPanel.classList.add("show", "open", "is-open");
    els.vendorPanel.setAttribute("aria-hidden", "false");
  }

  function closeVendorPanel() {
    if (!els.vendorPanel) return;
    els.vendorPanel.classList.add("vendorHidden");
    els.vendorPanel.classList.remove("show", "open", "is-open");
    els.vendorPanel.setAttribute("aria-hidden", "true");
  }

  function hideLandingPage() {
    const landing =
      document.getElementById("landingPage") ||
      document.querySelector(".hero");

    if (landing) {
      landing.style.display = "none";
      landing.setAttribute("aria-hidden", "true");
    }
  }

  function showLandingPage() {
    const landing =
      document.getElementById("landingPage") ||
      document.querySelector(".hero");

    if (landing) {
      landing.style.display = "";
      landing.removeAttribute("aria-hidden");
    }
  }

  function updateInstruction() {
    if (!els.targetImg?.src) {
      setText(els.instructionLine, "Add a target photo.");
      return;
    }
    if (!aim) {
      setText(els.instructionLine, "Tap Aim Point.");
      return;
    }
    setText(els.instructionLine, "Tap Bullet Holes.");
  }

  function updateStatus() {
    if (!els.targetImg?.src) {
      setText(els.statusLine, "Add a target photo to begin.");
      return;
    }

    if (!aim) {
      setText(els.statusLine, "Tap the point you were aiming at.");
      return;
    }

    if (hits.length < 3) {
      setText(els.statusLine, `Tap Bullet Holes. ${hits.length}/3 minimum`);
      return;
    }

    setText(els.statusLine, `Ready • ${hits.length} shots recorded`);
  }

  function updateTapCount() {
    setText(els.tapCount, String(hits.length));
  }

  function updateLiveBar() {
    const rangeVal = getRangeYds();
    const rangeUnit = getRangeUnit();
    const dialUnit = getDialUnit();
    const clickValue = getClickValue();
    const dims = getTargetDimsInches();

    setText(els.liveDistance, `${rangeVal} ${rangeUnit === "m" ? "m" : "yds"}`);
    setText(els.liveDial, `${clickValue} ${dialUnit}`);
    setText(els.liveTarget, `${dims.w}×${dims.h}`);
  }

  function syncMatrixUI() {
    const rangeUnit = getRangeUnit();
    const dialUnit = getDialUnit();

    els.distUnitYd?.classList.toggle("segOn", rangeUnit === "yd");
    els.distUnitM?.classList.toggle("segOn", rangeUnit === "m");
    setText(els.distUnitLabel, rangeUnit === "m" ? "m" : "yds");

    els.unitMoa?.classList.toggle("segOn", dialUnit === "MOA");
    els.unitMrad?.classList.toggle("segOn", dialUnit === "MRAD");
    setText(els.clickUnitLabel, dialUnit === "MRAD" ? "MRAD/click" : "MOA/click");
  }

  function syncSizeChips() {
    const active = localStorage.getItem(KEY_TARGET_SIZE_KEY) || DEFAULTS.targetSizeKey;
    const chips = els.sizeChipRow ? [...els.sizeChipRow.querySelectorAll(".chipSize")] : [];
    chips.forEach((chip) => chip.classList.toggle("segOn", chip.dataset.size === active));
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function releaseObjectUrl() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }

  async function handlePhotoFile(file) {
    if (!file || !els.targetImg) return;

    releaseObjectUrl();
    objectUrl = URL.createObjectURL(file);

    const dataUrl = await readFileAsDataURL(file);
    localStorage.setItem(KEY_TARGET_IMG_DATAURL, dataUrl);

    resetTapsOnly();
    els.targetImg.src = objectUrl;

    if (els.scoreSection) {
      els.scoreSection.classList.remove("scoreHidden");
      els.scoreSection.classList.add("workspaceVisible");
    }

    hideLandingPage();

    updateInstruction();
    updateStatus();
  }

  function restorePhoto() {
    const dataUrl = String(localStorage.getItem(KEY_TARGET_IMG_DATAURL) || "");
    if (!dataUrl || !els.targetImg) return;
    els.targetImg.src = dataUrl;

    if (els.scoreSection) {
      els.scoreSection.classList.remove("scoreHidden");
      els.scoreSection.classList.add("workspaceVisible");
    }

    hideLandingPage();
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

  function maybeTrackStart(evt) {
    touchStart = clientPointFromEvent(evt);
  }

  function movementTooLarge(evt) {
    if (!touchStart) return false;
    const now = clientPointFromEvent(evt);
    return Math.abs(now.x - touchStart.x) > 12 || Math.abs(now.y - touchStart.y) > 12;
  }

  function eventToPercent(evt) {
    const rect = getWrapRect();
    if (!rect) return null;

    const pt = clientPointFromEvent(evt);
    return {
      xPct: clamp((pt.x - rect.left) / rect.width, 0, 1),
      yPct: clamp((pt.y - rect.top) / rect.height, 0, 1)
    };
  }

  function renderDots() {
    if (!els.dotsLayer) return;
    els.dotsLayer.innerHTML = "";

    if (aim) {
      const dot = document.createElement("div");
      dot.className = "shotDot aimDot";
      dot.style.left = `${aim.xPct * 100}%`;
      dot.style.top = `${aim.yPct * 100}%`;
      els.dotsLayer.appendChild(dot);
    }

    hits.forEach((hit, idx) => {
      const dot = document.createElement("div");
      dot.className = "shotDot hitDot";
      dot.style.left = `${hit.xPct * 100}%`;
      dot.style.top = `${hit.yPct * 100}%`;
      dot.textContent = String(idx + 1);
      els.dotsLayer.appendChild(dot);
    });
  }

  function resetTapsOnly() {
    aim = null;
    hits = [];
    touchStart = null;
    renderDots();
    updateTapCount();
    closeVendorPanel();
    updateInstruction();
    updateStatus();
  }

  function onTargetTap(evt) {
    if (!els.targetImg?.src) return;
    if (movementTooLarge(evt)) return;

    evt.preventDefault();

    const point = eventToPercent(evt);
    if (!point) return;

    if (!aim) {
      aim = point;
      renderDots();
      updateInstruction();
      updateStatus();
      return;
    }

    hits.push(point);
    renderDots();
    updateTapCount();
    updateInstruction();
    updateStatus();
  }

  function avg(list, key) {
    if (!list.length) return 0;
    return list.reduce((sum, item) => sum + item[key], 0) / list.length;
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

    if (dialUnit === "MRAD") {
      const meters = rangeYds * 0.9144;
      const inchesPerMrad = meters * 39.3701 * 0.001;
      windageUnitValue = inchesPerMrad ? round2(Math.abs(dxInches) / inchesPerMrad) : 0;
      elevationUnitValue = inchesPerMrad ? round2(Math.abs(dyInches) / inchesPerMrad) : 0;
    } else {
      const inchesPerMoa = (rangeYds / 100) * 1.047;
      windageUnitValue = inchesPerMoa ? round2(Math.abs(dxInches) / inchesPerMoa) : 0;
      elevationUnitValue = inchesPerMoa ? round2(Math.abs(dyInches) / inchesPerMoa) : 0;
    }

    const windageClicks = clickValue ? round2(windageUnitValue / clickValue) : 0;
    const elevationClicks = clickValue ? round2(elevationUnitValue / clickValue) : 0;

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
      windageDir: dxInches > 0 ? "LEFT" : dxInches < 0 ? "RIGHT" : "—",
      elevationDir: dyInches > 0 ? "UP" : dyInches < 0 ? "DOWN" : "—",
      dialUnit,
      clickValue,
      rangeYds: round2(rangeYds),
      groupSizeInches: computeMaxSpreadInches(hits, dims),
      vendor: getVendor(),
      sku: getSku(),
      batch: getBatch(),
      mode: getMode(),
      isB2B: isB2B(),
      targetWIn: dims.w,
      targetHIn: dims.h,
      createdAt: new Date().toISOString()
    };
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

    return {
      ...metrics,
      score,
      scoreBand: band.label,
      scoreDetail: band.detail,
      sessionStartedAt,
      sessionDurationMs: Date.now() - sessionStartedAt
    };
  }

  function persistPayload(payload) {
    if (!payload) return;
    try {
      localStorage.setItem(KEY_SEC_PAYLOAD, JSON.stringify(payload));
      const raw = localStorage.getItem(KEY_SEC_HISTORY);
      let history = [];
      try {
        history = JSON.parse(raw || "[]");
        if (!Array.isArray(history)) history = [];
      } catch {
        history = [];
      }
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
      setText(els.statusLine, "Need at least 3 shots.");
      return;
    }

    persistPayload(payload);

    try {
      const blob = await buildSecImageBlob(payload);
      await shareBlob(blob, `SCZN3_SEC_${Date.now()}.png`);
      setText(els.statusLine, "SEC image ready.");
      openVendorPanel();
    } catch (err) {
      console.error(err);
      setText(els.statusLine, "Could not build SEC image.");
    }
  }

  function bindMatrix() {
    els.matrixBtn?.addEventListener("click", () => {
      els.matrixPanel?.classList.toggle("matrixHidden");
    });

    els.matrixCloseBtn?.addEventListener("click", () => {
      els.matrixPanel?.classList.add("matrixHidden");
    });

    els.distDown?.addEventListener("click", () => {
      els.distanceYds.value = String(Math.max(1, safeNumber(els.distanceYds.value, 100) - 1));
      persistSettings();
    });

    els.distUp?.addEventListener("click", () => {
      els.distanceYds.value = String(safeNumber(els.distanceYds.value, 100) + 1);
      persistSettings();
    });

    els.distanceYds?.addEventListener("change", persistSettings);

    els.distUnitYd?.addEventListener("click", () => setRangeUnit("yd"));
    els.distUnitM?.addEventListener("click", () => setRangeUnit("m"));

    els.unitMoa?.addEventListener("click", () => setDialUnit("MOA"));
    els.unitMrad?.addEventListener("click", () => setDialUnit("MRAD"));

    els.clickValue?.addEventListener("change", persistSettings);

    els.presetChipRow?.addEventListener("click", (evt) => {
      const btn = evt.target.closest("[data-click]");
      if (!btn) return;
      els.clickValue.value = btn.dataset.click;
      setDialUnit(btn.dataset.unit);
      persistSettings();
    });

    els.sizeChipRow?.addEventListener("click", (evt) => {
      const btn = evt.target.closest(".chipSize");
      if (!btn) return;
      const size = btn.dataset.size;
      if (size === "custom") return;
      setTargetSize(size, safeNumber(btn.dataset.w, 23), safeNumber(btn.dataset.h, 35));
    });

    els.swapSizeBtn?.addEventListener("click", () => {
      const dims = getTargetDimsInches();
      setTargetSize("custom", dims.h, dims.w);
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
      els.targetWrap?.addEventListener(eventName, maybeTrackStart, { passive: true });
    });

    ["click", "touchend"].forEach((eventName) => {
      els.targetWrap?.addEventListener(eventName, onTargetTap, { passive: false });
    });

    els.clearTapsBtn?.addEventListener("click", () => resetTapsOnly());
    els.showResultsBtn?.addEventListener("click", onShowResults);

    els.vendorPanelLink?.addEventListener("click", () => {
      try {
        const href = String(els.vendorPanelLink.href || "").trim();
        if (href) localStorage.setItem(KEY_VENDOR_URL, href);
      } catch {}
    });

    bindMatrix();
  }

  function initDefaults() {
    if (!localStorage.getItem(KEY_RANGE_YDS)) localStorage.setItem(KEY_RANGE_YDS, String(DEFAULTS.rangeYds));
    if (!localStorage.getItem(KEY_RANGE_UNIT)) localStorage.setItem(KEY_RANGE_UNIT, DEFAULTS.rangeUnit);
    if (!localStorage.getItem(KEY_DIAL_UNIT)) localStorage.setItem(KEY_DIAL_UNIT, DEFAULTS.dialUnit);
    if (!localStorage.getItem(KEY_CLICK_VALUE)) localStorage.setItem(KEY_CLICK_VALUE, String(DEFAULTS.clickValue));
    if (!localStorage.getItem(KEY_TARGET_W_IN)) localStorage.setItem(KEY_TARGET_W_IN, String(DEFAULTS.targetWIn));
    if (!localStorage.getItem(KEY_TARGET_H_IN)) localStorage.setItem(KEY_TARGET_H_IN, String(DEFAULTS.targetHIn));
    if (!localStorage.getItem(KEY_TARGET_SIZE_KEY)) localStorage.setItem(KEY_TARGET_SIZE_KEY, DEFAULTS.targetSizeKey);
  }

  function init() {
    initDefaults();
    hydrateVendor();
    restorePhoto();

    if (els.distanceYds) els.distanceYds.value = String(getRangeYds());
    if (els.clickValue) els.clickValue.value = String(getClickValue());

    syncMatrixUI();
    syncSizeChips();
    updateLiveBar();
    updateTapCount();
    updateInstruction();
    updateStatus();
    bindEvents();

    if (isBakerMode() && els.vendorPanelLink && !els.vendorPanelLink.href) {
      els.vendorPanelLink.href = "https://bakertargets.com";
    }

    if (!els.targetImg?.src) {
      showLandingPage();
    }
  }

  init();
})();
