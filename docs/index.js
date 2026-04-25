/* ============================================================
   docs/index.js — FULL REPLACEMENT
   BUTTON FREEZE FIX
   - fixes Undo / Clear / Show Results responsiveness
   - removes async thumbnail work from results open
   - removes html/body overflow locking
   - keeps score/history/timestamp flow
============================================================ */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const HISTORY_KEY = "SCZN3_SEC_HISTORY_V1";
  const HISTORY_LIMIT = 4;

  const DEFAULTS = {
    rangeValue: 100,
    rangeUnit: "yds",
    targetSize: "8.5x11",
    dialUnit: "MOA",
    clickValue: 0.25
  };

  const TARGET_SIZE_MAP = {
    "8.5x11": { w: 8.5, h: 11 },
    "11x17": { w: 11, h: 17 },
    "12x18": { w: 12, h: 18 },
    "18x24": { w: 18, h: 24 },
    "23x35": { w: 23, h: 35 },
    "24x36": { w: 24, h: 36 }
  };

  const els = {
    landingView: $("landingView"),
    workspaceView: $("workspaceView"),

    distanceInput: $("distanceInput"),
    distanceUnitSelect: $("distanceUnitSelect"),
    targetSizeSelect: $("targetSizeSelect"),
    dialUnitSelect: $("dialUnitSelect"),
    clickValueInput: $("clickValueInput"),

    photoInput: $("photoInput"),

    instructionLine: $("instructionLine"),
    statusLine: $("statusLine"),

    vendorLabel: $("vendorLabel"),
    vendorName: $("vendorName"),
    vendorPanelLink: $("vendorPanelLink"),

    backBtn: $("backBtn"),
    targetWrap: $("targetWrap"),
    targetImg: $("targetImg"),
    dotsLayer: $("dotsLayer"),

    shotCount: $("shotCount"),
    undoBtn: $("undoBtn"),
    clearBtn: $("clearBtn"),
    showResultsBtn: $("showResultsBtn"),

    freezeScrim: $("freezeScrim"),
    secOverlay: $("secOverlay"),
    secCard: $("secCard"),
    secTargetImage: $("secTargetImage"),

    secScoreValue: $("secScoreValue"),
    secScoreBand: $("secScoreBand"),
    secHitsValue: $("secHitsValue"),
    secDistanceValue: $("secDistanceValue"),
    secWindageValue: $("secWindageValue"),
    secElevationValue: $("secElevationValue"),
    secMetaDate: $("secMetaDate"),
    secMetaTime: $("secMetaTime"),
    secMetaUnit: $("secMetaUnit"),
    secMetaVendor: $("secMetaVendor"),
    secHistoryGrid: $("secHistoryGrid"),

    secBackBtn: $("secBackBtn"),
    saveBtn: $("saveBtn"),
    secVendorBtn: $("secVendorBtn"),
    scoreAnotherBtn: $("scoreAnotherBtn")
  };

  const state = {
    imageSrc: "",
    imageReady: false,
    aim: null,
    hits: [],
    maxShots: 7,
    vendorName: "Tap-n-Score",
    vendorUrl: "",
    secOpen: false,
    secOpening: false,
    tapStartX: 0,
    tapStartY: 0,
    tapMoved: false,
    touchSequenceStarted: false,
    lastTouchAt: 0,
    lastResult: null,
    history: []
  };

  let lastTapTime = 0;
  let dotQuietTimer = null;
  let lastShowResultsAt = 0;

  init();

  function init() {
    syncControls();
    resolveVendor();
    loadHistory();
    wireEvents();
    softenTouchBehavior();
    renderHistory();
    updateInstruction();
    updateStatus("Waiting for target photo.");
    updateButtons();
    updateShotCount();
    updateTargetVisualState();
  }

  function wireEvents() {
    els.photoInput?.addEventListener("change", onPhotoSelected);
    els.backBtn?.addEventListener("click", backToLanding);

    els.undoBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (els.undoBtn.disabled) return;
      undoLastTap();
    });

    els.clearBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (els.clearBtn.disabled) return;
      clearAllTaps();
    });

    els.showResultsBtn?.addEventListener("click", onShowResultsPress);

    els.distanceInput?.addEventListener("input", onConfigChanged);
    els.distanceUnitSelect?.addEventListener("change", onConfigChanged);
    els.targetSizeSelect?.addEventListener("change", onConfigChanged);
    els.dialUnitSelect?.addEventListener("change", onDialUnitChanged);
    els.clickValueInput?.addEventListener("input", onConfigChanged);

    els.secBackBtn?.addEventListener("click", closeSEC);

    els.saveBtn?.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("SCZN3_SAVE_SEC"));
    });

    els.scoreAnotherBtn?.addEventListener("click", () => {
      closeSEC();
      clearAllTaps();
      backToLanding();
    });

    if (els.targetWrap) {
      els.targetWrap.addEventListener("touchstart", onTargetTouchStart, { passive: true });
      els.targetWrap.addEventListener("touchmove", onTargetTouchMove, { passive: true });
      els.targetWrap.addEventListener("touchend", onTargetTouchEnd, { passive: false });
      els.targetWrap.addEventListener("touchcancel", onTargetTouchCancel, { passive: true });
      els.targetWrap.addEventListener("click", onTargetClick, false);
      els.targetWrap.addEventListener("dragstart", (e) => e.preventDefault());
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.secOpen) closeSEC();
    });

    window.addEventListener("resize", () => {
      if (state.imageSrc) renderDots();
      updateTargetVisualState();
    });
  }

  function onConfigChanged() {
    if (!state.lastResult) return;
    try {
      const result = buildResult();
      renderSEC(result);
    } catch (err) {
      console.warn("Config refresh skipped:", err);
    }
  }

  function onDialUnitChanged() {
    if (!els.clickValueInput) return;

    const current = Number(els.clickValueInput.value);
    const unit = getDialUnit();

    if (!Number.isFinite(current) || current <= 0) {
      els.clickValueInput.value = unit === "MRAD" ? "0.10" : "0.25";
    }

    onConfigChanged();
  }

  function softenTouchBehavior() {
    if (els.targetWrap) {
      els.targetWrap.style.touchAction = "manipulation";
      els.targetWrap.style.webkitUserSelect = "none";
      els.targetWrap.style.userSelect = "none";
      els.targetWrap.style.webkitTouchCallout = "none";
    }

    if (els.targetImg) {
      els.targetImg.draggable = false;
      els.targetImg.style.pointerEvents = "none";
      els.targetImg.style.webkitUserSelect = "none";
      els.targetImg.style.userSelect = "none";
    }

    if (els.showResultsBtn) {
      els.showResultsBtn.style.touchAction = "manipulation";
    }

    if (els.undoBtn) {
      els.undoBtn.style.touchAction = "manipulation";
    }

    if (els.clearBtn) {
      els.clearBtn.style.touchAction = "manipulation";
    }
  }

  function syncControls() {
    if (els.distanceInput && !els.distanceInput.value) {
      els.distanceInput.value = String(DEFAULTS.rangeValue);
    }

    if (els.distanceUnitSelect && !els.distanceUnitSelect.value) {
      els.distanceUnitSelect.value = DEFAULTS.rangeUnit;
    }

    if (els.targetSizeSelect && !els.targetSizeSelect.value) {
      els.targetSizeSelect.value = DEFAULTS.targetSize;
    }

    if (els.dialUnitSelect && !els.dialUnitSelect.value) {
      els.dialUnitSelect.value = DEFAULTS.dialUnit;
    }

    if (els.clickValueInput && !els.clickValueInput.value) {
      els.clickValueInput.value = String(DEFAULTS.clickValue);
    }
  }

  function resolveVendor() {
    const params = new URLSearchParams(window.location.search);
    const urlVendor = (params.get("v") || "").toLowerCase();

    if (urlVendor === "baker") {
      state.vendorName = "Baker";
    }

    if (els.vendorName) {
      els.vendorName.textContent = state.vendorName;
    }

    if (els.vendorLabel) {
      els.vendorLabel.textContent =
        state.vendorName !== "Tap-n-Score"
          ? `${state.vendorName} • Your Target`
          : "Printer Partner";
    }

    if (els.vendorPanelLink) {
      els.vendorPanelLink.href = state.vendorUrl || "#";
      els.vendorPanelLink.hidden = false;
    }

    if (els.secVendorBtn) {
      els.secVendorBtn.hidden = !state.vendorUrl;
      els.secVendorBtn.href = state.vendorUrl || "#";
      els.secVendorBtn.textContent =
        state.vendorName !== "Tap-n-Score"
          ? `Buy More from ${state.vendorName}`
          : "Buy More Targets";
    }
  }

  function onPhotoSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      updateStatus("That file is not an image.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const src = String(reader.result || "");
      if (!src) {
        updateStatus("Target photo could not be read.");
        return;
      }

      state.imageSrc = src;
      state.imageReady = false;

      setWorkspaceImage(src);
      resetSessionOnly();
      enterWorkspace();
    };

    reader.onerror = () => {
      updateStatus("Target photo failed to load.");
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function setWorkspaceImage(src) {
    if (!src) return;

    if (els.targetImg) {
      els.targetImg.onload = () => {
        state.imageReady = true;
        updateStatus("Tap the aim point first.");
        updateInstruction();
        updateTargetVisualState();
        updateButtons();
      };

      els.targetImg.onerror = () => {
        state.imageReady = false;
        updateStatus("This target image could not be displayed.");
        updateTargetVisualState();
        updateButtons();
      };

      els.targetImg.src = src;
    }

    if (els.secTargetImage) {
      els.secTargetImage.src = src;
    }

    updateTargetVisualState();
  }

  function enterWorkspace() {
    if (els.landingView) els.landingView.hidden = true;
    if (els.workspaceView) els.workspaceView.hidden = false;

    updateInstruction();
    updateStatus("Loading target photo...");
    updateButtons();
    updateTargetVisualState();
  }

  function backToLanding() {
    closeSEC();

    if (els.workspaceView) els.workspaceView.hidden = true;
    if (els.landingView) els.landingView.hidden = false;

    updateStatus("Waiting for target photo.");
    updateInstruction();
    updateTargetVisualState();
    updateButtons();
  }

  function resetSessionOnly() {
    state.aim = null;
    state.hits = [];
    state.lastResult = null;
    state.secOpening = false;
    renderDots();
    updateInstruction();
    updateButtons();
    updateShotCount();
    updateTargetVisualState();
  }

  function clearAllTaps() {
    state.aim = null;
    state.hits = [];
    state.lastResult = null;
    state.secOpening = false;

    renderDots();
    updateInstruction();
    updateStatus("Session cleared. Tap the aim point first.");
    updateButtons();
    updateShotCount();
    updateTargetVisualState();
  }

  function undoLastTap() {
    state.secOpening = false;

    if (state.hits.length > 0) {
      state.hits.pop();
      state.lastResult = null;
      renderDots();
      setDotsBrightThenQuiet();
      updateInstruction();
      updateStatus(
        state.hits.length > 0
          ? "Last shot removed."
          : state.aim
            ? "Aim point set. Add your shots."
            : "Tap the aim point first."
      );
      updateButtons();
      updateShotCount();
      updateTargetVisualState();
      return;
    }

    if (state.aim) {
      state.aim = null;
      state.lastResult = null;
      renderDots();
      setDotsBrightThenQuiet();
      updateInstruction();
      updateStatus("Aim point removed. Tap the aim point first.");
      updateButtons();
      updateShotCount();
      updateTargetVisualState();
    }
  }

  function onTargetTouchStart(e) {
    const t = e.touches && e.touches[0];
    if (!t) return;

    state.touchSequenceStarted = true;
    state.tapStartX = t.clientX;
    state.tapStartY = t.clientY;
    state.tapMoved = false;
  }

  function onTargetTouchMove(e) {
    const t = e.touches && e.touches[0];
    if (!t) return;

    const dx = Math.abs(t.clientX - state.tapStartX);
    const dy = Math.abs(t.clientY - state.tapStartY);

    if (dx > 10 || dy > 10) {
      state.tapMoved = true;
    }
  }

  function onTargetTouchCancel() {
    state.touchSequenceStarted = false;
    state.tapMoved = false;
  }

  function onTargetTouchEnd(e) {
    if (!state.touchSequenceStarted) return;
    state.touchSequenceStarted = false;

    if (state.tapMoved) return;
    if (!state.imageSrc || !state.imageReady || !els.targetWrap) return;
    if (state.secOpen || state.secOpening) return;

    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;

    state.lastTouchAt = Date.now();

    applyTargetTap({
      clientX: t.clientX,
      clientY: t.clientY
    });

    e.preventDefault();
  }

  function onTargetClick(e) {
    if (Date.now() - state.lastTouchAt < 500) return;
    if (!state.imageSrc || !state.imageReady || !els.targetWrap) return;
    if (state.secOpen || state.secOpening) return;

    applyTargetTap({
      clientX: e.clientX,
      clientY: e.clientY
    });
  }

  function applyTargetTap(pointLike) {
    const now = performance.now();
    if (now - lastTapTime < 40) return;
    lastTapTime = now;

    const point = getNormalizedPoint(pointLike, els.targetWrap);
    if (!point) return;

    if (!state.aim) {
      state.aim = point;
      state.lastResult = null;
      renderDots();
      setDotsBrightThenQuiet();
      updateInstruction();
      updateStatus("Aim point locked. Now tap your bullet holes.");
      updateButtons();
      updateShotCount();
      updateTargetVisualState();
      return;
    }

    if (state.hits.length >= state.maxShots) {
      updateStatus(`Maximum ${state.maxShots} shots reached.`);
      return;
    }

    state.hits.push(point);
    state.lastResult = null;

    renderDots();
    setDotsBrightThenQuiet();
    updateInstruction();

    if (state.hits.length >= 3) {
      updateStatus("Results ready.");
    } else {
      updateStatus(`${3 - state.hits.length} more to unlock.`);
    }

    updateButtons();
    updateShotCount();
    updateTargetVisualState();
  }

  function getNormalizedPoint(e, element) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    return {
      x: clamp(x, 0, 1),
      y: clamp(y, 0, 1)
    };
  }

  function renderDots() {
    if (!els.dotsLayer) return;
    els.dotsLayer.innerHTML = "";

    if (state.aim) {
      const dot = document.createElement("div");
      dot.className = "shotDot aimDot isActive";
      dot.style.left = `${state.aim.x * 100}%`;
      dot.style.top = `${state.aim.y * 100}%`;
      els.dotsLayer.appendChild(dot);
    }

    state.hits.forEach((hit, index) => {
      const dot = document.createElement("div");
      dot.className = "shotDot hitDot isActive";
      dot.style.left = `${hit.x * 100}%`;
      dot.style.top = `${hit.y * 100}%`;
      dot.textContent = String(index + 1);
      els.dotsLayer.appendChild(dot);
    });
  }

  function setDotsBrightThenQuiet() {
    const dots = els.dotsLayer?.querySelectorAll(".shotDot");
    if (!dots || !dots.length) return;

    window.clearTimeout(dotQuietTimer);

    dots.forEach((dot) => {
      dot.classList.remove("isQuiet");
      dot.classList.add("isActive");
    });

    dotQuietTimer = window.setTimeout(() => {
      const currentDots = els.dotsLayer?.querySelectorAll(".shotDot");
      currentDots?.forEach((dot) => {
        dot.classList.remove("isActive");
        dot.classList.add("isQuiet");
      });
    }, 720);
  }

  function updateInstruction() {
    if (!els.instructionLine) return;

    if (!state.imageSrc) {
      els.instructionLine.textContent = "Add your target photo to begin.";
      return;
    }

    if (!state.imageReady) {
      els.instructionLine.textContent = "Loading target photo...";
      return;
    }

    if (!state.aim) {
      els.instructionLine.textContent = "Tap your aim point first.";
      return;
    }

    if (state.hits.length < 3) {
      const remaining = 3 - state.hits.length;
      els.instructionLine.textContent = `Tap ${remaining} more shot${remaining === 1 ? "" : "s"} to unlock results.`;
      return;
    }

    els.instructionLine.textContent = "Results ready. Tap Show Results.";
  }

  function updateStatus(message) {
    if (els.statusLine) {
      els.statusLine.textContent = message;
    }
  }

  function updateButtons() {
    const hasAim = !!state.aim;
    const hitCount = state.hits.length;
    const canEdit = !state.secOpen && !state.secOpening;
    const canShowResults = hasAim && hitCount >= 3 && canEdit;

    if (els.undoBtn) {
      els.undoBtn.disabled = !canEdit || (!hasAim && hitCount === 0);
    }

    if (els.clearBtn) {
      els.clearBtn.disabled = !canEdit || (!hasAim && hitCount === 0);
    }

    if (els.showResultsBtn) {
      els.showResultsBtn.disabled = !canShowResults;
    }
  }

  function updateShotCount() {
    if (els.shotCount) {
      els.shotCount.textContent = String(state.hits.length);
    }
  }

  function onShowResultsPress(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (els.showResultsBtn?.disabled) return;

    const now = Date.now();
    if (now - lastShowResultsAt < 550) return;
    lastShowResultsAt = now;

    showResults();
  }

  function showResults() {
    if (state.secOpening || state.secOpen) return;

    if (!state.aim || state.hits.length < 3) {
      updateStatus("Tap the aim point and at least 3 shots first.");
      updateButtons();
      return;
    }

    state.secOpening = true;
    updateButtons();
    updateStatus("Opening results...");

    try {
      const result = buildResult();
      renderSEC(result);
      openSEC();
      persistSession(result);
      state.secOpening = false;
      updateButtons();
      updateTargetVisualState();
    } catch (err) {
      handleShowResultsFailure(err);
    }
  }

  function handleShowResultsFailure(err) {
    console.error("Show Results failed:", err);
    updateStatus("Show Results failed.");
    state.secOpening = false;
    updateButtons();
    alert(`Show Results failed: ${err && err.message ? err.message : "Unknown error"}`);
  }

  function buildResult() {
    const size = getTargetDimensions();
    const rangeYards = getRangeInYards();

    const poib = getPOIB(state.hits);
    const dxNorm = poib.x - state.aim.x;
    const dyNorm = poib.y - state.aim.y;

    const dxInches = dxNorm * size.w;
    const dyInches = dyNorm * size.h;

    const moaPerInch = 100 / (1.047 * rangeYards);
    const windageMOA = Math.abs(dxInches) * moaPerInch;
    const elevationMOA = Math.abs(dyInches) * moaPerInch;

    const windageMRAD = Math.abs(dxInches) / (3.6 * (rangeYards / 100));
    const elevationMRAD = Math.abs(dyInches) / (3.6 * (rangeYards / 100));

    const dialUnit = getDialUnit();
    const clickValue = getClickValue();

    const windageDial = dialUnit === "MRAD" ? windageMRAD : windageMOA;
    const elevationDial = dialUnit === "MRAD" ? elevationMRAD : elevationMOA;

    const windageClicks = windageDial / clickValue;
    const elevationClicks = elevationDial / clickValue;

    const windageDir = dxInches > 0 ? "Left" : dxInches < 0 ? "Right" : "Hold";
    const elevationDir = dyInches > 0 ? "Up" : dyInches < 0 ? "Down" : "Hold";

    const xs = state.hits.map((p) => p.x);
    const ys = state.hits.map((p) => p.y);
    const groupWNorm = Math.max(...xs) - Math.min(...xs);
    const groupHNorm = Math.max(...ys) - Math.min(...ys);
    const groupSizeIn = Math.sqrt(
      Math.pow(groupWNorm * size.w, 2) + Math.pow(groupHNorm * size.h, 2)
    );

    const distanceFromAimIn = Math.sqrt((dxInches * dxInches) + (dyInches * dyInches));
    const score = computeScore(distanceFromAimIn, groupSizeIn, state.hits.length);

    const now = new Date();

    return {
      id: buildSessionId(now),
      createdAt: now.toISOString(),
      score,
      scoreBand: getScoreBand(score),
      hitCount: state.hits.length,
      rangeValue: getRangeValue(),
      rangeUnit: getRangeUnit(),
      dialUnit,
      clickValue,
      windageDir,
      elevationDir,
      windageClicks,
      elevationClicks,
      vendorName: state.vendorName,
      vendorUrl: state.vendorUrl,
      dateLabel: formatDate(now),
      timeLabel: formatTime(now),
      timestampLabel: formatTimestamp(now),
      thumbDataUrl: state.imageSrc || ""
    };
  }

  function renderSEC(result) {
    state.lastResult = result;

    applyScoreUI(result.score, result.scoreBand);

    if (els.secHitsValue) {
      els.secHitsValue.textContent = String(result.hitCount);
    }

    if (els.secDistanceValue) {
      els.secDistanceValue.textContent = `${Math.round(result.rangeValue)} ${result.rangeUnit}`;
    }

    if (els.secWindageValue) {
      els.secWindageValue.textContent = formatAdjustment(result.windageDir, result.windageClicks);
    }

    if (els.secElevationValue) {
      els.secElevationValue.textContent = formatAdjustment(result.elevationDir, result.elevationClicks);
    }

    if (els.secTargetImage) {
      els.secTargetImage.src = state.imageSrc || "";
      els.secTargetImage.alt = "Analyzed target";
    }

    if (els.secMetaDate) els.secMetaDate.textContent = result.dateLabel;
    if (els.secMetaTime) els.secMetaTime.textContent = result.timeLabel;
    if (els.secMetaUnit) els.secMetaUnit.textContent = `${result.dialUnit} • ${formatNumber(result.clickValue)} click`;
    if (els.secMetaVendor) els.secMetaVendor.textContent = result.vendorName || "Tap-n-Score";

    if (els.secVendorBtn) {
      if (result.vendorUrl) {
        els.secVendorBtn.hidden = false;
        els.secVendorBtn.href = result.vendorUrl;
      } else {
        els.secVendorBtn.hidden = true;
        els.secVendorBtn.href = "#";
      }
    }

    renderHistory();
  }

  function persistSession(result) {
    if (!result) return;

    const entry = {
      id: result.id,
      createdAt: result.createdAt,
      timestampLabel: result.timestampLabel,
      score: result.score,
      status: result.scoreBand.label,
      hits: result.hitCount,
      distanceLabel: `${Math.round(result.rangeValue)} ${result.rangeUnit}`,
      windageLabel: formatAdjustment(result.windageDir, result.windageClicks),
      elevationLabel: formatAdjustment(result.elevationDir, result.elevationClicks),
      vendorName: result.vendorName || "Tap-n-Score",
      thumbDataUrl: state.imageSrc || ""
    };

    state.history = [entry, ...state.history.filter((item) => item.id !== entry.id)].slice(0, HISTORY_LIMIT);
    saveHistory();
    renderHistory();
  }

  function loadHistory() {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      state.history = Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
    } catch (err) {
      console.warn("History load failed:", err);
      state.history = [];
    }
  }

  function saveHistory() {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, HISTORY_LIMIT)));
    } catch (err) {
      console.warn("History save failed:", err);
    }
  }

  function renderHistory() {
    if (!els.secHistoryGrid) return;

    els.secHistoryGrid.innerHTML = "";

    const items = state.history.slice(0, HISTORY_LIMIT);

    if (!items.length) {
      renderEmptyHistory();
      return;
    }

    items.forEach((item) => {
      els.secHistoryGrid.appendChild(buildHistoryTile(item));
    });

    while (els.secHistoryGrid.children.length < HISTORY_LIMIT) {
      const tile = document.createElement("article");
      tile.className = "secHistoryTile isEmpty";

      const wrap = document.createElement("div");
      wrap.className = "secHistoryThumbWrap";

      const placeholder = document.createElement("div");
      placeholder.className = "secHistoryThumbPlaceholder";
      placeholder.textContent = "No session";

      wrap.appendChild(placeholder);
      tile.appendChild(wrap);
      els.secHistoryGrid.appendChild(tile);
    }
  }

  function buildHistoryTile(item) {
    const tile = document.createElement("article");
    tile.className = "secHistoryTile";

    const thumbWrap = document.createElement("div");
    thumbWrap.className = "secHistoryThumbWrap";

    if (item.thumbDataUrl) {
      const img = document.createElement("img");
      img.className = "secHistoryThumb";
      img.src = item.thumbDataUrl;
      img.alt = "Session thumbnail";
      thumbWrap.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "secHistoryThumbPlaceholder";
      placeholder.textContent = "Session saved";
      thumbWrap.appendChild(placeholder);
    }

    const body = document.createElement("div");
    body.className = "secHistoryBody";

    const top = document.createElement("div");
    top.className = "secHistoryTop";

    const score = document.createElement("div");
    score.className = "secHistoryScore";
    score.textContent = String(item.score);

    const status = document.createElement("div");
    status.className = "secHistoryStatus";
    status.textContent = item.status || "";

    top.appendChild(score);
    top.appendChild(status);

    const meta = document.createElement("div");
    meta.className = "secHistoryMeta";

    const line1 = document.createElement("div");
    line1.className = "secHistoryLine";
    line1.innerHTML = `<span class="muted">Hits:</span> ${escapeHtml(String(item.hits || 0))}`;

    const line2 = document.createElement("div");
    line2.className = "secHistoryLine";
    line2.innerHTML = `<span class="muted">Dist:</span> ${escapeHtml(item.distanceLabel || "--")}`;

    const line3 = document.createElement("div");
    line3.className = "secHistoryLine secHistoryClicks";
    line3.textContent = compactClicks(item.windageLabel, item.elevationLabel);

    const stamp = document.createElement("div");
    stamp.className = "secHistoryTimestamp";
    stamp.textContent = item.timestampLabel || "";

    meta.appendChild(line1);
    meta.appendChild(line2);
    meta.appendChild(line3);
    meta.appendChild(stamp);

    body.appendChild(top);
    body.appendChild(meta);

    tile.appendChild(thumbWrap);
    tile.appendChild(body);

    return tile;
  }

  function renderEmptyHistory() {
    if (!els.secHistoryGrid) return;

    els.secHistoryGrid.innerHTML = "";

    for (let i = 0; i < HISTORY_LIMIT; i += 1) {
      const tile = document.createElement("article");
      tile.className = "secHistoryTile isEmpty";

      const wrap = document.createElement("div");
      wrap.className = "secHistoryThumbWrap";

      const placeholder = document.createElement("div");
      placeholder.className = "secHistoryThumbPlaceholder";
      placeholder.textContent = "No session";

      wrap.appendChild(placeholder);
      tile.appendChild(wrap);
      els.secHistoryGrid.appendChild(tile);
    }
  }

  function openSEC() {
    if (els.freezeScrim) {
      els.freezeScrim.hidden = false;
    }

    if (els.secOverlay) {
      els.secOverlay.hidden = false;
      els.secOverlay.setAttribute("aria-hidden", "false");
      els.secOverlay.classList.remove("isOpen");
      void els.secOverlay.offsetHeight;
      els.secOverlay.classList.add("isOpen");
      els.secOverlay.scrollTop = 0;
      els.secOverlay.style.pointerEvents = "auto";
    }

    state.secOpen = true;
    updateStatus("Results opened.");
  }

  function closeSEC() {
    if (els.freezeScrim) {
      els.freezeScrim.hidden = true;
    }

    if (els.secOverlay) {
      els.secOverlay.hidden = true;
      els.secOverlay.setAttribute("aria-hidden", "true");
      els.secOverlay.classList.remove("isOpen");
      els.secOverlay.style.pointerEvents = "";
    }

    state.secOpen = false;
    state.secOpening = false;
    updateButtons();
    updateTargetVisualState();
  }

  function getPOIB(points) {
    const total = points.reduce(
      (acc, p) => {
        acc.x += p.x;
        acc.y += p.y;
        return acc;
      },
      { x: 0, y: 0 }
    );

    return {
      x: total.x / points.length,
      y: total.y / points.length
    };
  }

  function computeScore(distanceFromAimIn, groupSizeIn, hitCount) {
    const distPenalty = distanceFromAimIn * 11.5;
    const groupPenalty = groupSizeIn * 7.5;
    const hitBonus = Math.min(hitCount, 5) * 2;
    return Math.round(clamp(100 - distPenalty - groupPenalty + hitBonus, 0, 100));
  }

  function getScoreBand(score) {
    if (score >= 90) return { label: "STRONG / EXCELLENT", tone: "green" };
    if (score >= 60) return { label: "IMPROVING / SOLID", tone: "yellow" };
    return { label: "NEEDS WORK", tone: "red" };
  }

  function applyScoreUI(score, band) {
    if (els.secScoreValue) {
      els.secScoreValue.textContent = String(score);
      els.secScoreValue.classList.remove("is-green", "is-yellow", "is-red");

      if (score >= 90) els.secScoreValue.classList.add("is-green");
      else if (score >= 60) els.secScoreValue.classList.add("is-yellow");
      else els.secScoreValue.classList.add("is-red");
    }

    if (els.secScoreBand) {
      els.secScoreBand.textContent = band.label;
      els.secScoreBand.classList.remove("is-green", "is-yellow", "is-red");

      if (band.tone === "green") els.secScoreBand.classList.add("is-green");
      else if (band.tone === "yellow") els.secScoreBand.classList.add("is-yellow");
      else els.secScoreBand.classList.add("is-red");
    }
  }

  function formatAdjustment(direction, clicks) {
    const rounded = Math.round(Number(clicks) || 0);
    if (direction === "Hold" || rounded === 0) return "Hold";
    return `${direction.toUpperCase()} • ${rounded} click${rounded === 1 ? "" : "s"}`;
  }

  function compactClicks(windageLabel, elevationLabel) {
    const parts = [];
    if (windageLabel && windageLabel !== "Hold") parts.push(windageLabel);
    if (elevationLabel && elevationLabel !== "Hold") parts.push(elevationLabel);
    return parts.length ? parts.join(" • ") : "Hold";
  }

  function getRangeValue() {
    const n = Number(els.distanceInput?.value);
    return Number.isFinite(n) && n > 0 ? n : DEFAULTS.rangeValue;
  }

  function getRangeUnit() {
    return els.distanceUnitSelect?.value === "m" ? "m" : "yds";
  }

  function getRangeInYards() {
    const value = getRangeValue();
    return getRangeUnit() === "m" ? value * 1.09361 : value;
  }

  function getTargetSizeKey() {
    return TARGET_SIZE_MAP[els.targetSizeSelect?.value]
      ? els.targetSizeSelect.value
      : DEFAULTS.targetSize;
  }

  function getTargetDimensions() {
    return TARGET_SIZE_MAP[getTargetSizeKey()] || TARGET_SIZE_MAP[DEFAULTS.targetSize];
  }

  function getDialUnit() {
    return els.dialUnitSelect?.value === "MRAD" ? "MRAD" : "MOA";
  }

  function getClickValue() {
    const n = Number(els.clickValueInput?.value);
    if (Number.isFinite(n) && n > 0) return n;
    return getDialUnit() === "MRAD" ? 0.1 : 0.25;
  }

  function formatDate(date) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatTime(date) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function formatTimestamp(date) {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function buildSessionId(date) {
    return `sec-${date.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateTargetVisualState() {
    if (!els.targetWrap) return;

    const hasImage = !!state.imageSrc && !!state.imageReady;
    const engaged = hasImage && (!!state.aim || state.hits.length > 0);
    const ready = engaged && state.hits.length >= 3;

    els.targetWrap.classList.toggle("hasImage", hasImage);
    els.targetWrap.classList.toggle("isEngaged", engaged);
    els.targetWrap.classList.toggle("isReady", ready);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
