/* ============================================================
   docs/index.js — FULL REPLACEMENT (VERIFIED)
   3-page flow update:
   - NO live SEC webpage stop
   - Show Results builds final SEC image behind the scenes
   - Auto opens share/save flow directly
   - History remains silent in localStorage and is rendered only inside export
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

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

  function isB2B() {
    return getVendor() === "baker" && getSku() === "bkr-b2b";
  }

  function alreadyOnB2BPage() {
    const u = getUrl();
    if (!u) return false;
    return /\/docs\/b2b-sec\.html$/i.test(u.pathname) || /\/b2b-sec\.html$/i.test(u.pathname);
  }

  function routeTargetIfNeeded() {
    if (!isB2B()) return false;
    if (alreadyOnB2BPage()) return false;

    const u = getUrl();
    if (!u) return false;

    const qs = u.searchParams.toString();
    const next = `./b2b-sec.html${qs ? `?${qs}` : ""}`;
    window.location.replace(next);
    return true;
  }

  // ------------------------------------------------------------
  // HARD ROUTE B2B BEFORE ANY OTHER LOGIC RUNS
  // ------------------------------------------------------------
  // TEMP DISABLE B2B ROUTER
  // if (routeTargetIfNeeded()) return;

  // ------------------------------------------------------------
  // PAGE ELEMENTS
  // ------------------------------------------------------------
  const elPhotoBtn = $("photoBtn");
  const elFile = $("photoInput");
  const elVendorBox = $("vendorBox");
  const elVendorLabel = $("vendorLabel");
  const elVendorPanel = $("vendorPanel");
  const elVendorPanelLink = $("vendorPanelLink");
  const elScoreSection = $("scoreSection");
  const elImg = $("targetImg");
  const elDots = $("dotsLayer");
  const elWrap = $("targetWrap");
  const elTapCount = $("tapCount");
  const elClear = $("clearTapsBtn");
  const elInstruction = $("instructionLine");
  const elStatus = $("statusLine");
  const elStickyBar = $("stickyBar");
  const elStickyBtn = $("stickyResultsBtn");
  const elShowResultsBtn = $("showResultsBtn");
  const elLiveDistance = $("liveDistance");
  const elLiveDial = $("liveDial");
  const elLiveTarget = $("liveTarget");
  const elMatrixBtn = $("matrixBtn");
  const elMatrixPanel = $("matrixPanel");
  const elMatrixClose = $("matrixCloseBtn");
  const elDist = $("distanceYds");
  const elDistUp = $("distUp");
  const elDistDown = $("distDown");
  const elDistUnitLabel = $("distUnitLabel");
  const elDistUnitYd = $("distUnitYd");
  const elDistUnitM = $("distUnitM");
  const elUnitMoa = $("unitMoa");
  const elUnitMrad = $("unitMrad");
  const elClickValue = $("clickValue");
  const elClickUnitLabel = $("clickUnitLabel");
  const elSizeChipRow = $("sizeChipRow");
  const elSwapSizeBtn = $("swapSizeBtn");

  // ------------------------------------------------------------
  // STORAGE KEYS
  // ------------------------------------------------------------
  const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_TARGET_IMG_DATA = "SCZN3_TARGET_IMG_DATAURL_V1";
  const KEY_TARGET_IMG_BLOB = "SCZN3_TARGET_IMG_BLOBURL_V1";
  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";
  const KEY_VENDOR_NAME = "SCZN3_VENDOR_NAME_V1";
  const KEY_DIST_UNIT = "SCZN3_RANGE_UNIT_V1";
  const KEY_DIST_YDS = "SCZN3_RANGE_YDS_V1";
  const KEY_TARGET_SIZE = "SCZN3_TARGET_SIZE_KEY_V1";
  const KEY_TARGET_W = "SCZN3_TARGET_W_IN_V1";
  const KEY_TARGET_H = "SCZN3_TARGET_H_IN_V1";
  const KEY_HISTORY = "SCZN3_SEC_HISTORY_V1";
  const KEY_HISTORY_LAST = "SCZN3_SEC_HISTORY_LAST_V1";

  let objectUrl = null;
  let aim = null;
  let hits = [];
  let lastTouchTapAt = 0;
  let touchStart = null;
  let pauseTimer = null;
  let dialUnit = "MOA";
  let rangeUnit = "YDS";
  let rangeYds = 100;
  let targetSizeKey = "23x35";
  let targetWIn = 23;
  let targetHIn = 35;

  const DEFAULTS = { MOA: 0.25, MRAD: 0.10 };

  try { history.scrollRestoration = "manual"; } catch {}

  function forceTop() {
    try { window.scrollTo(0, 0); } catch {}
  }

  function hardHideScoringUI() {
    elScoreSection?.classList.add("scoreHidden");
  }

  window.addEventListener("pageshow", () => {
    forceTop();
    hardHideScoringUI();
    hideSticky();
    closeMatrix();
    closeVendorPanel();
  });

  window.addEventListener("load", () => forceTop());

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function setText(el, t) {
    if (el) el.textContent = String(t ?? "");
  }

  function revealScoringUI() {
    elScoreSection?.classList.remove("scoreHidden");
    try {
      elScoreSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
  }

  function setTapCount() {
    if (elTapCount) elTapCount.textContent = String(hits.length);
  }

  function hideSticky() {
    if (!elStickyBar) return;
    elStickyBar.classList.add("stickyHidden");
    elStickyBar.setAttribute("aria-hidden", "true");
  }

  function showSticky() {
    if (!elStickyBar) return;
    elStickyBar.classList.remove("stickyHidden");
    elStickyBar.setAttribute("aria-hidden", "false");
  }

  function scheduleStickyMagic() {
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => {
      if (hits.length >= 1) showSticky();
    }, 650);
  }

  function setInstruction(text, kind) {
    if (!elInstruction) return;

    const color =
      kind === "aim"   ? "rgba(103,243,164,.95)" :
      kind === "holes" ? "rgba(183,255,60,.95)"  :
      kind === "go"    ? "rgba(47,102,255,.92)"  :
                         "rgba(238,242,247,.70)";

    elInstruction.style.transition = "opacity 180ms ease, transform 180ms ease, color 120ms ease";
    elInstruction.style.opacity = "0";
    elInstruction.style.transform = "translateY(2px)";
    elInstruction.style.color = color;

    void elInstruction.offsetHeight;

    elInstruction.textContent = text || "";
    elInstruction.style.opacity = "1";
    elInstruction.style.transform = "translateY(0px)";
  }

  function syncInstruction() {
    if (!elImg?.src) {
      setInstruction("", "");
      return;
    }
    if (!aim) {
      setInstruction("Tap Aim Point.", "aim");
      return;
    }
    setInstruction("Tap Bullet Holes.", "holes");
  }

  function resetAll() {
    aim = null;
    hits = [];
    touchStart = null;
    if (elDots) elDots.innerHTML = "";
    setTapCount();
    hideSticky();
    syncInstruction();
    setText(elStatus, elImg?.src ? "Tap Aim Point." : "Add a target photo to begin.");
    closeMatrix();
    closeVendorPanel();
  }

  function isBakerMode() {
    return getVendor() === "baker";
  }

  function getVendorName() {
    const stored = String(localStorage.getItem(KEY_VENDOR_NAME) || "").trim();
    if (stored) return stored;
    if (isBakerMode()) return "BAKER TARGETS";
    return "Vendor Not Set";
  }

  function closeVendorPanel() {
    if (!elVendorPanel) return;
    elVendorPanel.classList.remove("vendorOpen");
  }

  function toggleVendorPanel() {
    if (!elVendorPanel) return;
    elVendorPanel.classList.toggle("vendorOpen");
  }

  function hydrateVendorBox() {
    if (elVendorLabel) elVendorLabel.textContent = "BUY MORE TARGETS LIKE THIS";

    if (isBakerMode()) {
      try { localStorage.setItem(KEY_VENDOR_NAME, "BAKER TARGETS"); } catch {}

      if (elVendorLabel) {
        const a = "BUY MORE TARGETS LIKE THIS";
        const b = "BAKER • SMART TARGET™";
        let flip = false;
        setInterval(() => {
          flip = !flip;
          elVendorLabel.textContent = flip ? b : a;
        }, 1200);
      }
    }

    const v = localStorage.getItem(KEY_VENDOR_URL) || "";
    const ok = typeof v === "string" && v.startsWith("http");

    if (elVendorPanelLink) {
      if (ok) {
        elVendorPanelLink.href = v;
        elVendorPanelLink.style.pointerEvents = "auto";
        elVendorPanelLink.style.opacity = "1";
      } else {
        elVendorPanelLink.href = "#";
        elVendorPanelLink.style.pointerEvents = "none";
        elVendorPanelLink.style.opacity = ".65";
      }
    }

    if (elVendorBox) {
      elVendorBox.removeAttribute("target");
      elVendorBox.removeAttribute("rel");
      elVendorBox.href = "#";
      elVendorBox.style.pointerEvents = "auto";
      elVendorBox.style.opacity = "1";

      elVendorBox.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleVendorPanel();
      });
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function buildBaseThumbnailDataUrl(file) {
    const sourceDataUrl = await fileToDataUrl(file);
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

    return canvas.toDataURL("image/jpeg", 0.72);
  }

  async function storeBaseTargetPhotoForSEC(file, blobUrl) {
    try {
      localStorage.setItem(KEY_TARGET_IMG_BLOB, blobUrl);
    } catch {}

    try {
      const baseDataUrl = await buildBaseThumbnailDataUrl(file);
      if (baseDataUrl && baseDataUrl.startsWith("data:image/")) {
        localStorage.setItem(KEY_TARGET_IMG_DATA, baseDataUrl);
        return;
      }
    } catch {}

    try {
      localStorage.removeItem(KEY_TARGET_IMG_DATA);
    } catch {}
  }

  async function loadCurrentDisplayedImage() {
    return new Promise((resolve, reject) => {
      if (!elImg?.src) {
        reject(new Error("No displayed image"));
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = elImg.src;
    });
  }

  async function buildAnnotatedThumbnailAndStore() {
    if (!elWrap || !elImg?.src) return;

    const wrapRect = elWrap.getBoundingClientRect();
    const width = Math.max(1, Math.round(wrapRect.width));
    const height = Math.max(1, Math.round(wrapRect.height));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseImg = await loadCurrentDisplayedImage();
    ctx.drawImage(baseImg, 0, 0, width, height);

    const drawHit = (x01, y01) => {
      const x = x01 * width;
      const y = y01 * height;
      const r = 8;

      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.88, Math.PI / 8, 0, Math.PI * 2);
      ctx.fillStyle = "#0d0909";
      ctx.fill();

      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.stroke();
    };

    const drawAim = (x01, y01) => {
      const x = x01 * width;
      const y = y01 * height;
      const r = 13;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(103,243,164,.25)";
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = "#67f3a4";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x - 18, y);
      ctx.lineTo(x + 18, y);
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x, y + 18);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#67f3a4";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#67f3a4";
      ctx.fill();
    };

    if (aim) drawAim(aim.x01, aim.y01);
    hits.forEach((h) => drawHit(h.x01, h.y01));

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    localStorage.setItem(KEY_TARGET_IMG_DATA, dataUrl);
  }

  function addDot(x01, y01, kind) {
    if (!elDots) return;
    const d = document.createElement("div");
    d.className = "tapDot " + (kind === "aim" ? "tapDotAim" : "tapDotHit");
    d.style.left = (x01 * 100) + "%";
    d.style.top = (y01 * 100) + "%";
    elDots.appendChild(d);
  }

  function getRelative01(clientX, clientY) {
    const r = elWrap.getBoundingClientRect();
    if (!r || r.width <= 1 || r.height <= 1) return { x01: 0.5, y01: 0.5 };
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;
    return { x01: clamp01(x), y01: clamp01(y) };
  }

  function ydsToM(yds) { return yds * 0.9144; }
  function mToYds(m) { return m / 0.9144; }

  function clampRangeYds(v) {
    let n = Number(v);
    if (!Number.isFinite(n)) n = 100;
    n = Math.round(n);
    n = Math.max(1, Math.min(5000, n));
    return n;
  }

  function getDistanceYds() {
    return clampRangeYds(rangeYds);
  }

  function setRangeUnit(u) {
    rangeUnit = (u === "M") ? "M" : "YDS";
    try { localStorage.setItem(KEY_DIST_UNIT, rangeUnit); } catch {}

    elDistUnitYd?.classList.toggle("segOn", rangeUnit === "YDS");
    elDistUnitM?.classList.toggle("segOn", rangeUnit === "M");

    if (elDistUnitLabel) elDistUnitLabel.textContent = (rangeUnit === "M") ? "m" : "yds";

    syncRangeInputFromInternal();
    syncLiveTop();
  }

  function syncRangeInputFromInternal() {
    if (!elDist) return;
    if (rangeUnit === "M") elDist.value = String(Math.round(ydsToM(rangeYds)));
    else elDist.value = String(rangeYds);
  }

  function syncInternalFromRangeInput() {
    if (!elDist) return;

    let n = Number(elDist.value);
    if (!Number.isFinite(n)) {
      n = (rangeUnit === "M") ? Math.round(ydsToM(rangeYds)) : rangeYds;
    }

    rangeYds = (rangeUnit === "M") ? clampRangeYds(mToYds(n)) : clampRangeYds(n);

    try { localStorage.setItem(KEY_DIST_YDS, String(rangeYds)); } catch {}
    syncRangeInputFromInternal();
    syncLiveTop();
  }

  function bumpRange(stepYds) {
    rangeYds = clampRangeYds(rangeYds + stepYds);
    try { localStorage.setItem(KEY_DIST_YDS, String(rangeYds)); } catch {}
    syncRangeInputFromInternal();
    syncLiveTop();
  }

  function hydrateRange() {
    rangeYds = clampRangeYds(Number(localStorage.getItem(KEY_DIST_YDS) || "100"));
    const savedUnit = localStorage.getItem(KEY_DIST_UNIT) || "YDS";
    setRangeUnit(savedUnit === "M" ? "M" : "YDS");
  }

  function setUnit(newUnit) {
    dialUnit = newUnit === "MRAD" ? "MRAD" : "MOA";

    elUnitMoa?.classList.toggle("segOn", dialUnit === "MOA");
    elUnitMrad?.classList.toggle("segOn", dialUnit === "MRAD");

    const def = DEFAULTS[dialUnit];
    if (elClickValue) elClickValue.value = String(def.toFixed(2));

    if (elClickUnitLabel) {
      elClickUnitLabel.textContent = dialUnit === "MOA" ? "MOA/click" : "MRAD/click";
    }

    syncLiveTop();
  }

  function getClickValue() {
    let n = Number(elClickValue?.value);
    if (!Number.isFinite(n) || n <= 0) {
      n = DEFAULTS[dialUnit];
      if (elClickValue) elClickValue.value = String(n.toFixed(2));
    }
    return Math.max(0.01, Math.min(5, n));
  }

  function clampInches(v, fallback) {
    let n = Number(v);
    if (!Number.isFinite(n) || n <= 0) n = fallback;
    return Math.max(1, Math.min(200, n));
  }

  function highlightSizeChip() {
    if (!elSizeChipRow) return;
    const chips = Array.from(elSizeChipRow.querySelectorAll("[data-size]"));
    chips.forEach((c) => {
      const key = c.getAttribute("data-size") || "";
      c.classList.toggle("chipOn", key === targetSizeKey);
    });
  }

  function setTargetSize(key, wIn, hIn) {
    targetSizeKey = String(key || "23x35");
    targetWIn = clampInches(wIn, 23);
    targetHIn = clampInches(hIn, 35);

    try { localStorage.setItem(KEY_TARGET_SIZE, targetSizeKey); } catch {}
    try { localStorage.setItem(KEY_TARGET_W, String(targetWIn)); } catch {}
    try { localStorage.setItem(KEY_TARGET_H, String(targetHIn)); } catch {}

    highlightSizeChip();
    syncLiveTop();
  }

  function hydrateTargetSize() {
    const key = localStorage.getItem(KEY_TARGET_SIZE) || "23x35";
    const presetMap = {
      "8.5x11": { w: 8.5, h: 11 },
      "11x17":  { w: 11,  h: 17 },
      "12x18":  { w: 12,  h: 18 },
      "18x24":  { w: 18,  h: 24 },
      "23x35":  { w: 23,  h: 35 },
      "24x36":  { w: 24,  h: 36 }
    };

    const p = presetMap[key] || {
      w: clampInches(localStorage.getItem(KEY_TARGET_W) || "23", 23),
      h: clampInches(localStorage.getItem(KEY_TARGET_H) || "35", 35)
    };

    const finalKey = (key in presetMap) ? key : (key === "custom" ? "custom" : "23x35");
    setTargetSize(finalKey, p.w, p.h);
  }

  function wireTargetSizeChips() {
    if (!elSizeChipRow) return;

    const chips = Array.from(elSizeChipRow.querySelectorAll("[data-size]"));
    chips.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-size") || "23x35";

        if (key === "custom") {
          setTargetSize("custom", targetWIn, targetHIn);
          return;
        }

        const w = Number(btn.getAttribute("data-w") || targetWIn);
        const h = Number(btn.getAttribute("data-h") || targetHIn);
        setTargetSize(key, w, h);
      });
    });
  }

  function wireSwapSize() {
    if (!elSwapSizeBtn) return;
    elSwapSizeBtn.addEventListener("click", () => {
      const newW = targetHIn;
      const newH = targetWIn;
      setTargetSize(targetSizeKey || "custom", newW, newH);
    });
  }

  function syncLiveTop() {
    if (elLiveDistance) {
      elLiveDistance.textContent = (rangeUnit === "M")
        ? `${Math.round(ydsToM(rangeYds))} m`
        : `${rangeYds} yds`;
    }

    if (elLiveDial) {
      elLiveDial.textContent = `${getClickValue().toFixed(2)} ${dialUnit}`;
    }

    if (elLiveTarget) {
      const label = (targetSizeKey || "").replace("x", "×");
      elLiveTarget.textContent = label || "—";
    }
  }

  function openMatrix() {
    if (!elMatrixPanel) return;
    elMatrixPanel.classList.remove("matrixHidden");
    elMatrixPanel.setAttribute("aria-hidden", "false");
  }

  function closeMatrix() {
    if (!elMatrixPanel) return;
    elMatrixPanel.classList.add("matrixHidden");
    elMatrixPanel.setAttribute("aria-hidden", "true");
  }

  function isMatrixOpen() {
    return !!elMatrixPanel && !elMatrixPanel.classList.contains("matrixHidden");
  }

  function toggleMatrix() {
    isMatrixOpen() ? closeMatrix() : openMatrix();
  }

  function applyPreset(unit, clickVal) {
    setUnit(unit);
    if (elClickValue) elClickValue.value = Number(clickVal).toFixed(2);
    getClickValue();
    closeMatrix();
    syncLiveTop();
  }

  function wireMatrixPresets() {
    if (!elMatrixPanel) return;
    const items = Array.from(elMatrixPanel.querySelectorAll("[data-unit][data-click]"));
    items.forEach((btn) => {
      btn.addEventListener("click", () => {
        const u = btn.getAttribute("data-unit") || "MOA";
        const c = Number(btn.getAttribute("data-click") || "0.25");
        applyPreset(u, c);
      });
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMatrix();
  });

  document.addEventListener("click", (e) => {
    if (!isMatrixOpen()) return;
    if (!elMatrixPanel) return;
    const inside = elMatrixPanel.contains(e.target);
    const isBtn = (e.target === elMatrixBtn) || e.target.closest?.("#matrixBtn");
    if (!inside && !isBtn) closeMatrix();
  }, { capture: true });

  function scoreFromRadiusInches(rIn) {
    if (rIn <= 0.25) return 100;
    if (rIn <= 0.50) return 95;
    if (rIn <= 1.00) return 90;
    if (rIn <= 1.50) return 85;
    if (rIn <= 2.00) return 80;
    if (rIn <= 2.50) return 75;
    if (rIn <= 3.00) return 70;
    if (rIn <= 3.50) return 65;
    if (rIn <= 4.00) return 60;
    return 50;
  }

  function computeCorrectionAndScore() {
    if (!aim || hits.length < 1) return null;

    const avg = hits.reduce((acc, p) => ({ x: acc.x + p.x01, y: acc.y + p.y01 }), { x: 0, y: 0 });
    avg.x /= hits.length;
    avg.y /= hits.length;

    const dx = aim.x01 - avg.x;
    const dy = aim.y01 - avg.y;

    const squareIn = Math.min(targetWIn, targetHIn);
    const inchesX = dx * squareIn;
    const inchesY = dy * squareIn;
    const rIn = Math.sqrt(inchesX * inchesX + inchesY * inchesY);

    const dist = getDistanceYds();
    const inchesPerUnit = (dialUnit === "MOA")
      ? (dist / 100) * 1.047
      : (dist / 100) * 3.6;

    const unitX = inchesX / inchesPerUnit;
    const unitY = inchesY / inchesPerUnit;
    const clickVal = getClickValue();
    const clicksX = unitX / clickVal;
    const clicksY = unitY / clickVal;

    return {
      avgPoi: { x01: avg.x, y01: avg.y },
      inches: { x: inchesX, y: inchesY, r: rIn },
      score: scoreFromRadiusInches(rIn),
      windage: { dir: clicksX >= 0 ? "RIGHT" : "LEFT", clicks: Math.abs(clicksX) },
      elevation: { dir: clicksY >= 0 ? "DOWN" : "UP", clicks: Math.abs(clicksY) },
      dial: { unit: dialUnit, clickValue: clickVal },
      squareIn
    };
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

  function directionWord(dir) {
    const d = String(dir || "").toUpperCase();
    if (d === "UP") return "UP";
    if (d === "DOWN") return "DOWN";
    if (d === "LEFT") return "LEFT";
    if (d === "RIGHT") return "RIGHT";
    return "—";
  }

  function formatDate(ts) {
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

  function loadHistory() {
    try {
      const raw = localStorage.getItem(KEY_HISTORY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
  }

  function getSessionSignature(payload) {
    if (!payload) return "";
    const score = Number(payload?.score ?? 0);
    const hitsCount = Number(payload?.shots ?? 0);
    const yds = String(payload?.debug?.distanceYds ?? "—");
    const elevClicks = Math.round(Number(payload?.elevation?.clicks ?? 0));
    const elevDir = String(payload?.elevation?.dir ?? "");
    const windClicks = Math.round(Number(payload?.windage?.clicks ?? 0));
    const windDir = String(payload?.windage?.dir ?? "");
    return [score, hitsCount, yds, elevClicks, elevDir, windClicks, windDir].join("|");
  }

  function updateSilentHistory(payload) {
    if (!payload) return;

    const signature = getSessionSignature(payload);
    const lastSignature = localStorage.getItem(KEY_HISTORY_LAST) || "";

    if (signature && signature === lastSignature) {
      return;
    }

    const history = loadHistory();
    history.unshift({
      score: Number(payload?.score ?? 0),
      hits: Number(payload?.shots ?? 0),
      yds: payload?.debug?.distanceYds ?? "—",
      ts: Date.now()
    });

    saveHistory(history.slice(0, 10));
    if (signature) localStorage.setItem(KEY_HISTORY_LAST, signature);
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

  async function loadDataImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function buildSecBlob(payload) {
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

    const score = Number(payload?.score ?? 0);
    const band = getScoreBand(score);
    const vendorName = getVendorName();

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("YOUR SCORE", cardX + 54, cardY + 155);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 150px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(score), cardX + 54, cardY + 305);

    const pillX = cardX + 54;
    const pillY = cardY + 332;
    const pillW = 240;
    const pillH = 56;

    ctx.fillStyle = band.fill;
    roundRect(ctx, pillX, pillY, pillW, pillH, 28, true, false);

    ctx.fillStyle = band.text;
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(band.label, pillX + pillW / 2, pillY + 37);
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("SCOPE CORRECTION", cardX + 54, cardY + 455);

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, cardX + 54, cardY + 480, 540, 98, 20, true, true);

    const elev = Math.round(Number(payload?.elevation?.clicks ?? 0));
    const wind = Math.round(Number(payload?.windage?.clicks ?? 0));

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(elev), cardX + 84, cardY + 544);

    ctx.fillStyle = "#5ca8ff";
    ctx.font = "900 42px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(directionWord(payload?.elevation?.dir), cardX + 152, cardY + 544);

    ctx.fillStyle = "rgba(238,242,247,0.58)";
    ctx.font = "900 34px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("•", cardX + 304, cardY + 544);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(wind), cardX + 360, cardY + 544);

    ctx.fillStyle = "#ff8b96";
    ctx.font = "900 42px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(directionWord(payload?.windage?.dir), cardX + 428, cardY + 544);

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("SESSION", cardX + 54, cardY + 655);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 36px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(`${payload?.debug?.distanceYds ?? "—"} yds • ${payload?.shots ?? "—"} hits`, cardX + 54, cardY + 708);

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("OFFICIAL TARGET PARTNER", cardX + 660, cardY + 155);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 40px system-ui, -apple-system, Segoe UI, Arial";
    wrapText(ctx, vendorName, cardX + 660, cardY + 210, 500, 48);

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

    const thumbSrc = localStorage.getItem(KEY_TARGET_IMG_DATA) || "";
    const thumbImg = await loadDataImage(thumbSrc);

    if (thumbImg) {
      const fit = containRect(thumbImg.width, thumbImg.height, thumbW - 24, thumbH - 24);
      const dx = thumbX + 12 + (thumbW - 24 - fit.w) / 2;
      const dy = thumbY + 12 + (thumbH - 24 - fit.h) / 2;
      ctx.drawImage(thumbImg, dx, dy, fit.w, fit.h);
    } else {
      ctx.fillStyle = "rgba(238,242,247,0.36)";
      ctx.font = "800 28px system-ui, -apple-system, Segoe UI, Arial";
      ctx.textAlign = "center";
      ctx.fillText("No thumbnail available", thumbX + thumbW / 2, thumbY + thumbH / 2);
      ctx.textAlign = "left";
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
      ctx.fillText(formatDate(item.ts), x, y + 32);
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
        if (err && err.name === "AbortError") {
          return;
        }
      }
    }

    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    const win = window.open(objectUrl, "_blank", "noopener,noreferrer");
    if (win) {
      setTimeout(() => {
        try { win.focus(); } catch {}
      }, 120);
    }

    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  }

  async function onShowResults() {
    const out = computeCorrectionAndScore();
    if (!out) {
      alert("Tap Aim Point first, then tap at least one bullet hole.");
      return;
    }

    try {
      await buildAnnotatedThumbnailAndStore();
    } catch {}

    const vendorUrl = localStorage.getItem(KEY_VENDOR_URL) || "";
    const vendorName = getVendorName();

    const payload = {
      sessionId: "S-" + Date.now(),
      score: out.score,
      shots: hits.length,
      windage: { dir: out.windage.dir, clicks: Number(out.windage.clicks.toFixed(2)) },
      elevation: { dir: out.elevation.dir, clicks: Number(out.elevation.clicks.toFixed(2)) },
      dial: { unit: out.dial.unit, clickValue: Number(out.dial.clickValue.toFixed(2)) },
      vendorUrl,
      vendorName,
      surveyUrl: "",
      target: { key: targetSizeKey, wIn: Number(targetWIn), hIn: Number(targetHIn) },
      debug: {
        aim,
        hits,
        avgPoi: out.avgPoi,
        distanceYds: getDistanceYds(),
        inches: out.inches,
        squareIn: out.squareIn
      }
    };

    try { localStorage.setItem(KEY_PAYLOAD, JSON.stringify(payload)); } catch {}

    updateSilentHistory(payload);

    const blob = await buildSecBlob(payload);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await shareOrSaveBlob(blob, `SEC-${stamp}.png`);
  }

  // ------------------------------------------------------------
  // PHOTO LOAD
  // ------------------------------------------------------------
  elPhotoBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    elFile?.click();
  });

  elFile?.addEventListener("change", async () => {
    const f = elFile.files?.[0];
    if (!f) return;

    resetAll();

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(f);

    await storeBaseTargetPhotoForSEC(f, objectUrl);

    elImg.onload = () => {
      setText(elStatus, "Tap Aim Point.");
      syncInstruction();
      revealScoringUI();
    };

    elImg.onerror = () => {
      setText(elStatus, "Photo failed to load.");
      setInstruction("Try again.", "");
      revealScoringUI();
    };

    elImg.src = objectUrl;
    elFile.value = "";
  });

  // ------------------------------------------------------------
  // TAP HANDLING
  // ------------------------------------------------------------
  function acceptTap(clientX, clientY) {
    if (!elImg?.src) return;
    const { x01, y01 } = getRelative01(clientX, clientY);

    if (!aim) {
      aim = { x01, y01 };
      addDot(x01, y01, "aim");
      setText(elStatus, "Tap Bullet Holes.");
      hideSticky();
      syncInstruction();
      return;
    }

    if (hits.length >= 10) return;

    hits.push({ x01, y01 });
    addDot(x01, y01, "hit");
    setTapCount();
    hideSticky();
    syncInstruction();
    scheduleStickyMagic();
  }

  if (elWrap) {
    elWrap.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches.length === 1) e.preventDefault();
    }, { passive: false });

    elWrap.addEventListener("touchstart", (e) => {
      if (!e.touches || e.touches.length !== 1) {
        touchStart = null;
        return;
      }
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY, t: Date.now() };
    }, { passive: true });

    elWrap.addEventListener("touchend", (e) => {
      const t = e.changedTouches?.[0];
      if (!t || !touchStart) return;

      const dx = Math.abs(t.clientX - touchStart.x);
      const dy = Math.abs(t.clientY - touchStart.y);
      if (dx > 10 || dy > 10) {
        touchStart = null;
        return;
      }

      lastTouchTapAt = Date.now();
      acceptTap(t.clientX, t.clientY);
      touchStart = null;
    }, { passive: true });

    elWrap.addEventListener("click", (e) => {
      const now = Date.now();
      if (now - lastTouchTapAt < 800) return;
      acceptTap(e.clientX, e.clientY);
    }, { passive: true });
  }

  // ------------------------------------------------------------
  // OTHER CONTROLS
  // ------------------------------------------------------------
  elClear?.addEventListener("click", () => {
    resetAll();
    if (elImg?.src) setText(elStatus, "Tap Aim Point.");
  });

  [elStickyBtn, elShowResultsBtn].filter(Boolean).forEach((b) => {
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onShowResults();
    });
  });

  elDistUp?.addEventListener("click", () => bumpRange(5));
  elDistDown?.addEventListener("click", () => bumpRange(-5));

  elDist?.addEventListener("change", syncInternalFromRangeInput);
  elDist?.addEventListener("blur", syncInternalFromRangeInput);

  elDistUnitYd?.addEventListener("click", () => setRangeUnit("YDS"));
  elDistUnitM?.addEventListener("click", () => setRangeUnit("M"));

  elUnitMoa?.addEventListener("click", () => setUnit("MOA"));
  elUnitMrad?.addEventListener("click", () => setUnit("MRAD"));

  elClickValue?.addEventListener("blur", () => { getClickValue(); syncLiveTop(); });
  elClickValue?.addEventListener("change", () => { getClickValue(); syncLiveTop(); });

  elMatrixBtn?.addEventListener("click", toggleMatrix);
  elMatrixClose?.addEventListener("click", closeMatrix);

  document.addEventListener("click", (e) => {
    if (!elVendorPanel || !elVendorBox) return;
    const inPanel = elVendorPanel.contains(e.target);
    const inPill = elVendorBox.contains(e.target);
    if (!inPanel && !inPill) closeVendorPanel();
  }, { capture: true });

  // ------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------
  setUnit("MOA");
  closeMatrix();
  hideSticky();
  resetAll();

  hydrateVendorBox();
  hydrateRange();
  hydrateTargetSize();

  wireMatrixPresets();
  wireTargetSizeChips();
  wireSwapSize();

  highlightSizeChip();
  syncLiveTop();

  hardHideScoringUI();
  forceTop();
})();
