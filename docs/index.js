/* ============================================================
   docs/index.js — FULL REPLACEMENT
   DIRECT EXPORT BUILD
   Flow:
   - landing page
   - add target photo
   - landing hides / target workspace becomes active
   - tap aim + shots
   - Show Results builds SEC image directly
   - NO sec.html handoff
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
  const KEY_SEC_HISTORY = "SCZN3_SEC_HISTORY_V1";
  const KEY_SEC_HISTORY_LAST = "SCZN3_SEC_HISTORY_LAST_V1";
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

  function round2(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setText(el, text) {
    if (el) el.textContent = String(text ?? "");
  }

  function getLandingEl() {
    return document.getElementById("landingPage") || document.querySelector(".hero");
  }

  function showLandingPage() {
    const landing = getLandingEl();
    if (landing) {
      landing.style.display = "";
      landing.removeAttribute("aria-hidden");
    }
  }

  function hideLandingPage() {
    const landing = getLandingEl();
    if (landing) {
      landing.style.display = "none";
      landing.setAttribute("aria-hidden", "true");
    }
  }

  function showWorkspace() {
    if (!els.scoreSection) return;
    els.scoreSection.classList.remove("scoreHidden");
    els.scoreSection.classList.add("workspaceVisible");
  }

  function hideWorkspace() {
    if (!els.scoreSection) return;
    els.scoreSection.classList.add("scoreHidden");
    els.scoreSection.classList.remove("workspaceVisible");
  }

  function forceTop() {
    try { window.scrollTo(0, 0); } catch {}
  }

  function getRangeYds() {
    return safeNumber(
      els.distanceYds?.value,
      safeNumber(localStorage.getItem(KEY_RANGE_YDS), DEFAULTS.rangeYds)
    );
  }

  function getRangeUnit() {
    return (localStorage.getItem(KEY_RANGE_UNIT) || DEFAULTS.rangeUnit).toLowerCase() === "m" ? "m" : "yd";
  }

  function getDialUnit() {
    return (localStorage.getItem(KEY_DIAL_UNIT) || DEFAULTS.dialUnit).toUpperCase() === "MRAD" ? "MRAD" : "MOA";
  }

  function getClickValue() {
    const fallback = getDialUnit() === "MRAD" ? 0.10 : 0.25;
    return safeNumber(
      els.clickValue?.value,
      safeNumber(localStorage.getItem(KEY_CLICK_VALUE), fallback)
    );
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
    try { localStorage.setItem(KEY_RANGE_UNIT, next); } catch {}
    syncMatrixUI();
    updateLiveBar();
  }

  function setDialUnit(unit) {
    const next = unit === "MRAD" ? "MRAD" : "MOA";
    try {
      localStorage.setItem(KEY_DIAL_UNIT, next);
      if (els.clickValue) {
        if (next === "MOA" && (!els.clickValue.value || Number(els.clickValue.value) <= 0)) {
          els.clickValue.value = "0.25";
        }
        if (next === "MRAD" && (!els.clickValue.value || Number(els.clickValue.value) <= 0)) {
          els.clickValue.value = "0.10";
        }
      }
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

  function getVendorName() {
    const stored = String(localStorage.getItem(KEY_VENDOR_NAME) || "").trim();
    if (stored) return stored;
    if (isBakerMode()) return "BAKER TARGETS";
    return "Vendor Not Set";
  }

  function hydrateVendor() {
    try {
      if (isBakerMode()) {
        localStorage.setItem(KEY_VENDOR_URL, "https://bakertargets.com");
        localStorage.setItem(KEY_VENDOR_NAME, "BAKER TARGETS");
      }

      const vendorUrl = String(localStorage.getItem(KEY_VENDOR_URL) || "").trim();
      const vendorName = getVendorName();

      if (els.vendorPanelLink && vendorUrl) els.vendorPanelLink.href = vendorUrl;
      if (els.vendorBox && vendorUrl) els.vendorBox.href = vendorUrl;
      if (els.vendorName) els.vendorName.textContent = vendorName;
      if (els.vendorLabel) els.vendorLabel.textContent = "BUY MORE TARGETS LIKE THIS";
    } catch {}
  }

  function setInstruction(text, kind) {
    if (!els.instructionLine) return;

    const color =
      kind === "aim" ? "rgba(103,243,164,.95)" :
      kind === "holes" ? "rgba(183,255,60,.95)" :
      "rgba(238,242,247,.70)";

    els.instructionLine.style.transition = "opacity 180ms ease, transform 180ms ease, color 120ms ease";
    els.instructionLine.style.opacity = "0";
    els.instructionLine.style.transform = "translateY(2px)";
    els.instructionLine.style.color = color;

    void els.instructionLine.offsetHeight;

    els.instructionLine.textContent = text || "";
    els.instructionLine.style.opacity = "1";
    els.instructionLine.style.transform = "translateY(0px)";
  }

  function updateInstruction() {
    if (!els.targetImg?.src) {
      setInstruction("Add a target photo.", "");
      return;
    }
    if (!aim) {
      setInstruction("Tap Aim Point.", "aim");
      return;
    }
    setInstruction("Tap Bullet Holes.", "holes");
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
    const chips = els.sizeChipRow ? [...els.sizeChipRow.querySelectorAll(".chipSize, [data-size]")] : [];
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

  async function buildBaseThumbnailDataUrl(file) {
    const sourceDataUrl = await readFileAsDataURL(file);
    const img = await loadImage(sourceDataUrl);

    const maxDim = 900;
    const w = img.naturalWidth || img.width || 1;
    const h = img.naturalHeight || img.height || 1;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    ctx.drawImage(img, 0, 0, outW, outH);
    return canvas.toDataURL("image/jpeg", 0.76);
  }

  async function handlePhotoFile(file) {
    if (!file || !els.targetImg) return;

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }

    objectUrl = URL.createObjectURL(file);

    try {
      const baseDataUrl = await buildBaseThumbnailDataUrl(file);
      localStorage.setItem(KEY_TARGET_IMG_DATAURL, baseDataUrl);
    } catch {}

    resetTapsOnly();

    els.targetImg.onload = () => {
      showWorkspace();
      hideLandingPage();
      forceTop();
      updateInstruction();
      updateStatus();
    };

    els.targetImg.onerror = () => {
      setText(els.statusLine, "Photo failed to load.");
    };

    els.targetImg.src = objectUrl;
  }

  function restorePhoto() {
    const dataUrl = String(localStorage.getItem(KEY_TARGET_IMG_DATAURL) || "");
    if (!dataUrl || !els.targetImg) return;
    els.targetImg.src = dataUrl;
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
      const d = document.createElement("div");
      d.className = "shotDot aimDot";
      d.style.left = `${aim.xPct * 100}%`;
      d.style.top = `${aim.yPct * 100}%`;
      els.dotsLayer.appendChild(d);
    }

    hits.forEach((hit, idx) => {
      const d = document.createElement("div");
      d.className = "shotDot hitDot";
      d.style.left = `${hit.xPct * 100}%`;
      d.style.top = `${hit.yPct * 100}%`;
      d.textContent = String(idx + 1);
      els.dotsLayer.appendChild(d);
    });
  }

  function resetTapsOnly() {
    aim = null;
    hits = [];
    touchStart = null;
    renderDots();
    updateTapCount();
    updateInstruction();
    updateStatus();
    sessionStartedAt = Date.now();
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

    if (hits.length >= 10) return;

    hits.push(point);
    renderDots();
    updateTapCount();
    updateInstruction();
    updateStatus();
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

    const centroidXPct = hits.reduce((sum, p) => sum + p.xPct, 0) / hits.length;
    const centroidYPct = hits.reduce((sum, p) => sum + p.yPct, 0) / hits.length;
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
    if (score >= 90) return { label: "STRONG", fill: "#48ff8b", text: "#06140b" };
    if (score >= 60) return { label: "SOLID", fill: "#ffe466", text: "#191300" };
    return { label: "NEEDS WORK", fill: "#ff6e64", text: "#220504" };
  }

  function getHistoryScoreColor(score) {
    if (score >= 90) return "#48ff8b";
    if (score >= 60) return "#ffe466";
    return "#ff6e64";
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
      scoreBandFill: band.fill,
      scoreBandText: band.text,
      vendorName: getVendorName(),
      sessionStartedAt,
      sessionDurationMs: Date.now() - sessionStartedAt
    };
  }

  function historySignatureFromPayload(payload) {
    if (!payload) return "";
    return [
      payload.score,
      payload.rangeYds,
      payload.shotCount,
      payload.windageClicks,
      payload.windageDir,
      payload.elevationClicks,
      payload.elevationDir,
      payload.groupSizeInches
    ].join("|");
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(KEY_SEC_HISTORY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistory(entries) {
    try {
      localStorage.setItem(KEY_SEC_HISTORY, JSON.stringify(entries));
    } catch {}
  }

  function persistHistoryEntry(payload) {
    if (!payload) return;

    const signature = historySignatureFromPayload(payload);
    const lastSignature = String(localStorage.getItem(KEY_SEC_HISTORY_LAST) || "");

    if (signature && signature === lastSignature) return;

    const entry = {
      score: Number(payload.score ?? 0),
      yds: payload.rangeYds ?? "—",
      hits: payload.shotCount ?? "—",
      ts: Date.now()
    };

    const history = loadHistory();
    history.unshift(entry);
    saveHistory(history.slice(0, 10));

    if (signature) {
      try { localStorage.setItem(KEY_SEC_HISTORY_LAST, signature); } catch {}
    }
  }

  async function buildAnnotatedThumbnailAndStore() {
    if (!els.targetWrap || !els.targetImg?.src) return;

    const rect = els.targetWrap.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseImg = await loadImage(els.targetImg.src);
    ctx.drawImage(baseImg, 0, 0, width, height);

    if (aim) {
      const ax = aim.xPct * width;
      const ay = aim.yPct * height;

      ctx.beginPath();
      ctx.arc(ax, ay, 13, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(103,243,164,.25)";
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = "#67f3a4";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ax - 18, ay);
      ctx.lineTo(ax + 18, ay);
      ctx.moveTo(ax, ay - 18);
      ctx.lineTo(ax, ay + 18);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#67f3a4";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ax, ay, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#67f3a4";
      ctx.fill();
    }

    hits.forEach((h) => {
      const x = h.xPct * width;
      const y = h.yPct * height;
      const r = 8;

      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.88, Math.PI / 8, 0, Math.PI * 2);
      ctx.fillStyle = "#0d0909";
      ctx.fill();

      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.stroke();
    });

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    localStorage.setItem(KEY_TARGET_IMG_DATAURL, dataUrl);
  }

  function containRect(srcW, srcH, maxW, maxH) {
    const ratio = Math.min(maxW / srcW, maxH / srcH);
    return {
      w: Math.max(1, Math.round(srcW * ratio)),
      h: Math.max(1, Math.round(srcH * ratio))
    };
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    const lines = [];

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }

    if (line) lines.push(line);

    lines.forEach((ln, i) => {
      ctx.fillText(ln, x, y + i * lineHeight);
    });
  }

  function formatHistoryDate(ts) {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return "—";
    }
  }

  async function buildSECBlob(payload) {
    const width = 1400;
    const height = 1800;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#0a1224");
    bgGrad.addColorStop(0.25, "#09101b");
    bgGrad.addColorStop(1, "#06070a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const radial = ctx.createRadialGradient(width / 2, 120, 80, width / 2, 120, 620);
    radial.addColorStop(0, "rgba(47,102,255,0.22)");
    radial.addColorStop(1, "rgba(47,102,255,0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    const pad = 72;
    const cardX = pad;
    const cardY = 120;
    const cardW = width - pad * 2;
    const cardH = height - 220;

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, cardX, cardY, cardW, cardH, 34, true, false);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cardY, cardW, cardH, 34, false, true);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 70px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("SEC", cardX + 50, cardY + 92);

    ctx.fillStyle = "rgba(238,242,247,0.76)";
    ctx.font = "900 28px system-ui, -apple-system, Segoe UI, Arial";
    ctx.textAlign = "right";
    ctx.fillText("Shooter Experience Card", cardX + cardW - 50, cardY + 88);
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("YOUR SCORE", cardX + 54, cardY + 155);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 150px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(payload.score ?? 0), cardX + 54, cardY + 305);

    const pillX = cardX + 54;
    const pillY = cardY + 332;
    const pillW = 240;
    const pillH = 56;

    ctx.fillStyle = payload.scoreBandFill || "#ffe466";
    roundRect(ctx, pillX, pillY, pillW, pillH, 28, true, false);

    ctx.fillStyle = payload.scoreBandText || "#191300";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(payload.scoreBand || "SOLID", pillX + pillW / 2, pillY + 37);
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("SCOPE CORRECTION", cardX + 54, cardY + 455);

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, cardX + 54, cardY + 480, 540, 98, 20, true, true);

    const elev = Math.round(Number(payload.elevationClicks ?? 0));
    const wind = Math.round(Number(payload.windageClicks ?? 0));

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(elev), cardX + 84, cardY + 544);

    ctx.fillStyle = "#5ca8ff";
    ctx.font = "900 42px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(payload.elevationDir || "—"), cardX + 152, cardY + 544);

    ctx.fillStyle = "rgba(238,242,247,0.58)";
    ctx.font = "900 34px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("•", cardX + 304, cardY + 544);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(wind), cardX + 360, cardY + 544);

    ctx.fillStyle = "#ff8b96";
    ctx.font = "900 42px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(payload.windageDir || "—"), cardX + 428, cardY + 544);

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("SESSION", cardX + 54, cardY + 655);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 36px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(`${payload.rangeYds ?? "—"} yds • ${payload.shotCount ?? "—"} hits`, cardX + 54, cardY + 708);

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("OFFICIAL TARGET PARTNER", cardX + 660, cardY + 155);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 40px system-ui, -apple-system, Segoe UI, Arial";
    wrapText(ctx, payload.vendorName || getVendorName(), cardX + 660, cardY + 210, 500, 48);

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("TARGET THUMBNAIL", cardX + 660, cardY + 340);

    const thumbX = cardX + 660;
    const thumbY = cardY + 370;
    const thumbW = 490;
    const thumbH = 370;

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, thumbX, thumbY, thumbW, thumbH, 22, true, true);

    const thumbSrc = String(localStorage.getItem(KEY_TARGET_IMG_DATAURL) || "");
    if (thumbSrc) {
      const thumbImg = await loadImage(thumbSrc);
      const fit = containRect(thumbImg.width, thumbImg.height, thumbW - 24, thumbH - 24);
      const dx = thumbX + 12 + (thumbW - 24 - fit.w) / 2;
      const dy = thumbY + 12 + (thumbH - 24 - fit.h) / 2;
      ctx.drawImage(thumbImg, dx, dy, fit.w, fit.h);
    }

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("SESSION HISTORY", cardX + 54, cardY + 840);

    const histBoxX = cardX + 54;
    const histBoxY = cardY + 870;
    const histBoxW = cardW - 108;
    const histBoxH = 520;

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, histBoxX, histBoxY, histBoxW, histBoxH, 22, true, true);

    ctx.fillStyle = "rgba(238,242,247,0.62)";
    ctx.font = "900 20px system-ui, -apple-system, Segoe UI, Arial";

    const leftX = histBoxX + 28;
    const rightX = histBoxX + histBoxW / 2 + 14;

    ctx.fillText("#", leftX, histBoxY + 40);
    ctx.fillText("SCORE", leftX + 52, histBoxY + 40);
    ctx.fillText("YARDS", leftX + 190, histBoxY + 40);
    ctx.fillText("HITS", leftX + 325, histBoxY + 40);

    ctx.fillText("#", rightX, histBoxY + 40);
    ctx.fillText("SCORE", rightX + 52, histBoxY + 40);
    ctx.fillText("YARDS", rightX + 190, histBoxY + 40);
    ctx.fillText("HITS", rightX + 325, histBoxY + 40);

    const recent = loadHistory().slice(0, 10);

    recent.forEach((item, idx) => {
      const col = idx < 5 ? 0 : 1;
      const row = idx < 5 ? idx : idx - 5;
      const x = col === 0 ? leftX : rightX;
      const y = histBoxY + 94 + row * 86;

      ctx.fillStyle = "#5f86ff";
      ctx.font = "900 34px system-ui, -apple-system, Segoe UI, Arial";
      ctx.fillText(String(idx + 1), x, y);

      ctx.fillStyle = getHistoryScoreColor(Number(item.score ?? 0));
      ctx.fillText(String(item.score ?? "—"), x + 52, y);

      ctx.fillStyle = "#eef2f7";
      ctx.fillText(String(item.yds ?? "—"), x + 190, y);
      ctx.fillText(String(item.hits ?? "—"), x + 325, y);

      ctx.fillStyle = "rgba(238,242,247,0.62)";
      ctx.font = "800 20px system-ui, -apple-system, Segoe UI, Arial";
      ctx.fillText(formatHistoryDate(item.ts), x, y + 32);
    });

    ctx.fillStyle = "rgba(238,242,247,0.46)";
    ctx.font = "800 18px system-ui, -apple-system, Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Faith • Order • Precision", width / 2, height - 48);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) throw new Error("PNG export failed");
    return blob;
  }

  async function shareOrSaveBlob(blob, filename) {
    const file = new File([blob], filename, { type: "image/png" });

    if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "SEC Export",
          text: "Save SEC to Photos or Files"
        });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }

    const objectUrl2 = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl2;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    const win = window.open(objectUrl2, "_blank", "noopener,noreferrer");
    if (win) {
      setTimeout(() => {
        try { win.focus(); } catch {}
      }, 120);
    }

    setTimeout(() => URL.revokeObjectURL(objectUrl2), 60000);
  }

  async function onShowResults() {
    persistSettings();

    const payload = buildPayload();
    if (!payload || payload.shotCount < 3) {
      setText(els.statusLine, "Need at least 3 shots.");
      return;
    }

    persistHistoryEntry(payload);

    try {
      await buildAnnotatedThumbnailAndStore();
      const blob = await buildSECBlob(payload);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      await shareOrSaveBlob(blob, `SEC-${stamp}.png`);
    } catch (err) {
      alert("Export failed.");
      console.error(err);
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
      if (!els.distanceYds) return;
      els.distanceYds.value = String(Math.max(1, safeNumber(els.distanceYds.value, 100) - 1));
      persistSettings();
    });

    els.distUp?.addEventListener("click", () => {
      if (!els.distanceYds) return;
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
      if (!btn || !els.clickValue) return;
      els.clickValue.value = btn.dataset.click;
      setDialUnit(btn.dataset.unit);
      persistSettings();
    });

    els.sizeChipRow?.addEventListener("click", (evt) => {
      const btn = evt.target.closest(".chipSize, [data-size]");
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

    els.clearTapsBtn?.addEventListener("click", resetTapsOnly);
    els.showResultsBtn?.addEventListener("click", onShowResults);

    bindMatrix();
  }

  function initDefaults() {
    try {
      if (!localStorage.getItem(KEY_RANGE_YDS)) localStorage.setItem(KEY_RANGE_YDS, String(DEFAULTS.rangeYds));
      if (!localStorage.getItem(KEY_RANGE_UNIT)) localStorage.setItem(KEY_RANGE_UNIT, DEFAULTS.rangeUnit);
      if (!localStorage.getItem(KEY_DIAL_UNIT)) localStorage.setItem(KEY_DIAL_UNIT, DEFAULTS.dialUnit);
      if (!localStorage.getItem(KEY_CLICK_VALUE)) localStorage.setItem(KEY_CLICK_VALUE, String(DEFAULTS.clickValue));
      if (!localStorage.getItem(KEY_TARGET_W_IN)) localStorage.setItem(KEY_TARGET_W_IN, String(DEFAULTS.targetWIn));
      if (!localStorage.getItem(KEY_TARGET_H_IN)) localStorage.setItem(KEY_TARGET_H_IN, String(DEFAULTS.targetHIn));
      if (!localStorage.getItem(KEY_TARGET_SIZE_KEY)) localStorage.setItem(KEY_TARGET_SIZE_KEY, DEFAULTS.targetSizeKey);
    } catch {}
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

    if (els.targetImg?.src) {
      showWorkspace();
      hideLandingPage();
    } else {
      hideWorkspace();
      showLandingPage();
    }

    forceTop();
  }

  init();
})();
