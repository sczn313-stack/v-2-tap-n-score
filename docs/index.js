/* ============================================================
   docs/index.js — FULL REPLACEMENT
   USER-LANGUAGE SEC
   - hide unfamiliar tech terms
   - keep only user-facing correction output
============================================================ */

(() => {
  "use strict";

  const HISTORY_KEY = "SCZN3_SEC_HISTORY_V1";
  const HISTORY_LIMIT = 10;

  const DEFAULTS = {
    targetWIn: 8.5,
    targetHIn: 11,
    rangeYds: 100,
    dialUnit: "MOA",
    clickValue: 0.25
  };

  const $ = (id) => document.getElementById(id);

  const els = {
    landingView: $("landingView"),
    workspaceView: $("workspaceView"),

    photoBtn: $("photoBtn"),
    photoInput: $("photoInput"),

    backBtn: $("backBtn"),

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

    vendorBox: $("vendorBox"),
    vendorPanelLink: $("vendorPanelLink"),
    vendorLabel: $("vendorLabel"),
    vendorName: $("vendorName"),

    secOverlay: $("secOverlay"),
    secBackBtn: $("secBackBtn"),
    saveSecBtn: $("saveSecBtn"),
    scoreAnotherBtn: $("scoreAnotherBtn"),

    secVendorSlot: $("secVendorSlot"),
    secVendorLink: $("secVendorLink"),
    secVendorLinkLabel: $("secVendorLinkLabel"),
    secVendorLinkName: $("secVendorLinkName"),

    secTargetThumb: $("secTargetThumb"),
    secScore: $("secScore"),
    secScoreBand: $("secScoreBand"),

    secWindageClicks: $("secWindageClicks"),
    secWindageDir: $("secWindageDir"),
    secElevationClicks: $("secElevationClicks"),
    secElevationDir: $("secElevationDir"),

    secThumbScore: $("secThumbScore"),
    secThumbHits: $("secThumbHits"),
    secThumbWhen: $("secThumbWhen"),
    secThumbTutorLine: $("secThumbTutorLine"),

    secHowScoreText: $("secHowScoreText"),
    secHistoryList: $("secHistoryList")
  };

  const VENDOR_CONFIG = {
    baker: {
      key: "baker",
      name: "Baker",
      label: "BUY MORE TARGETS LIKE THIS",
      secLabel: "Vendor",
      url: "https://bakertargets.com"
    }
  };

  let aim = null;
  let hits = [];
  let targetImage = null;
  let currentObjectUrl = null;
  let activeVendor = null;

  function clampPositiveNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  function getStoredNumber(keys, fallback) {
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw == null || raw === "") continue;
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) return n;
      } catch (err) {}
    }
    return fallback;
  }

  function getStoredText(keys, fallback) {
    for (const key of keys) {
      try {
        const raw = (localStorage.getItem(key) || "").trim();
        if (raw) return raw;
      } catch (err) {}
    }
    return fallback;
  }

  function getParam(name) {
    const url = new URL(window.location.href);
    return (url.searchParams.get(name) || "").trim();
  }

  function getRangeConfig() {
    const targetWIn = clampPositiveNumber(
      getParam("wIn") || getStoredNumber(["SCZN3_TARGET_W_IN_V1"], DEFAULTS.targetWIn),
      DEFAULTS.targetWIn
    );

    const targetHIn = clampPositiveNumber(
      getParam("hIn") || getStoredNumber(["SCZN3_TARGET_H_IN_V1"], DEFAULTS.targetHIn),
      DEFAULTS.targetHIn
    );

    const rangeYds = clampPositiveNumber(
      getParam("rangeYds") || getStoredNumber(["SCZN3_RANGE_YDS_V1"], DEFAULTS.rangeYds),
      DEFAULTS.rangeYds
    );

    let dialUnit = (
      getParam("dialUnit") ||
      getStoredText(["SCZN3_DIAL_UNIT_V1", "SCZN3_RANGE_UNIT_V1"], DEFAULTS.dialUnit)
    ).toUpperCase();

    if (dialUnit !== "MOA" && dialUnit !== "MRAD") {
      dialUnit = DEFAULTS.dialUnit;
    }

    const clickValue = clampPositiveNumber(
      getParam("clickValue") || getStoredNumber(["SCZN3_CLICK_VALUE_V1"], DEFAULTS.clickValue),
      DEFAULTS.clickValue
    );

    return { targetWIn, targetHIn, rangeYds, dialUnit, clickValue };
  }

  function resolveVendorFromRoute() {
    const v = getParam("v").toLowerCase();
    const vendor = getParam("vendor").toLowerCase();
    const routeKey = v || vendor || "";

    if (!routeKey) return null;
    if (!Object.prototype.hasOwnProperty.call(VENDOR_CONFIG, routeKey)) return null;

    return VENDOR_CONFIG[routeKey];
  }

  function hydrateVendor() {
    activeVendor = resolveVendorFromRoute();
    const hasVendor = !!activeVendor;

    if (els.vendorBox) els.vendorBox.hidden = !hasVendor;

    if (hasVendor) {
      if (els.vendorPanelLink) els.vendorPanelLink.href = activeVendor.url;
      if (els.vendorLabel) els.vendorLabel.textContent = activeVendor.label;
      if (els.vendorName) els.vendorName.textContent = activeVendor.name;
    } else {
      if (els.vendorPanelLink) els.vendorPanelLink.removeAttribute("href");
      if (els.vendorLabel) els.vendorLabel.textContent = "";
      if (els.vendorName) els.vendorName.textContent = "";
    }

    if (els.secVendorSlot) els.secVendorSlot.hidden = !hasVendor;

    if (hasVendor) {
      if (els.secVendorLink) els.secVendorLink.href = activeVendor.url;
      if (els.secVendorLinkLabel) els.secVendorLinkLabel.textContent = activeVendor.secLabel;
      if (els.secVendorLinkName) els.secVendorLinkName.textContent = activeVendor.name;
    } else {
      if (els.secVendorLink) els.secVendorLink.removeAttribute("href");
      if (els.secVendorLinkLabel) els.secVendorLinkLabel.textContent = "";
      if (els.secVendorLinkName) els.secVendorLinkName.textContent = "";
    }
  }

  function showLanding() {
    if (els.landingView) els.landingView.hidden = false;
    if (els.workspaceView) els.workspaceView.hidden = true;
    if (els.secOverlay) els.secOverlay.hidden = true;
    if (els.freezeScrim) els.freezeScrim.hidden = true;
  }

  function showWorkspace() {
    if (els.landingView) els.landingView.hidden = true;
    if (els.workspaceView) els.workspaceView.hidden = false;
  }

  function showSEC() {
    if (els.secOverlay) els.secOverlay.hidden = false;
  }

  function hideSEC() {
    if (els.secOverlay) els.secOverlay.hidden = true;
    if (els.freezeScrim) els.freezeScrim.hidden = true;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveHistory(rows) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, HISTORY_LIMIT)));
    } catch (err) {}
  }

  function formatHistoryDate(raw) {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "--";

    return d.toLocaleString([], {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function renderHistory() {
    if (!els.secHistoryList) return;

    const rows = loadHistory();
    els.secHistoryList.innerHTML = "";

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "secHistoryRow";
      empty.innerHTML = `
        <div class="secHistoryCell">--</div>
        <div class="secHistoryCell">--</div>
        <div class="secHistoryCell">No sessions yet</div>
        <div class="secHistoryCell tut">Run a scored session to populate history.</div>
      `;
      els.secHistoryList.appendChild(empty);
      return;
    }

    rows.slice(0, HISTORY_LIMIT).forEach((row) => {
      const item = document.createElement("div");
      item.className = "secHistoryRow";
      item.innerHTML = `
        <div class="secHistoryCell">${escapeHtml(String(row.score ?? "--"))}</div>
        <div class="secHistoryCell">${escapeHtml(String(row.hits ?? "--"))}</div>
        <div class="secHistoryCell">${escapeHtml(formatHistoryDate(row.createdAt))}</div>
        <div class="secHistoryCell tut">${escapeHtml(String(row.tutLine ?? ""))}</div>
      `;
      els.secHistoryList.appendChild(item);
    });
  }

  function pushHistory(entry) {
    const current = loadHistory();
    const next = [entry, ...current].slice(0, HISTORY_LIMIT);
    saveHistory(next);
    renderHistory();
  }

  if (els.photoBtn && els.photoInput) {
    els.photoBtn.addEventListener("click", () => {
      els.photoInput.click();
    });

    els.photoInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }

      currentObjectUrl = URL.createObjectURL(file);
      targetImage = currentObjectUrl;

      if (els.targetImg) {
        els.targetImg.src = targetImage;
      }

      aim = null;
      hits = [];
      renderDots();
      updateUI();
      showWorkspace();
    });
  }

  function getPoint(e) {
    if (!els.targetWrap) return { x: 0, y: 0 };

    const rect = els.targetWrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    };
  }

  if (els.targetWrap) {
    els.targetWrap.addEventListener("pointerdown", (e) => {
      if (!targetImage) return;
      if (!els.secOverlay?.hidden) return;

      const p = getPoint(e);

      if (!aim) {
        aim = p;
      } else if (hits.length < 7) {
        hits.push(p);
      }

      renderDots();
      updateUI();
    });
  }

  function renderDots() {
    if (!els.dotsLayer) return;

    els.dotsLayer.innerHTML = "";

    if (aim) {
      const d = document.createElement("div");
      d.className = "shotDot aimDot";
      d.style.left = `${aim.x * 100}%`;
      d.style.top = `${aim.y * 100}%`;
      els.dotsLayer.appendChild(d);
    }

    hits.forEach((h, i) => {
      const d = document.createElement("div");
      d.className = "shotDot hitDot";
      d.style.left = `${h.x * 100}%`;
      d.style.top = `${h.y * 100}%`;
      d.textContent = String(i + 1);
      els.dotsLayer.appendChild(d);
    });
  }

  function updateUI() {
    if (els.shotCount) {
      els.shotCount.textContent = String(hits.length);
    }

    if (!aim) {
      if (els.instructionLine) els.instructionLine.textContent = "Tap aim point to begin.";
      if (els.statusLine) els.statusLine.textContent = "No aim point set.";
      if (els.showResultsBtn) els.showResultsBtn.disabled = true;
      return;
    }

    if (hits.length < 3) {
      if (els.instructionLine) els.instructionLine.textContent = "Tap 3–7 shots.";
      if (els.statusLine) els.statusLine.textContent = `${hits.length} shot(s) placed.`;
      if (els.showResultsBtn) els.showResultsBtn.disabled = true;
      return;
    }

    if (els.instructionLine) els.instructionLine.textContent = "Ready for results.";
    if (els.statusLine) els.statusLine.textContent = `${hits.length} shots captured.`;
    if (els.showResultsBtn) els.showResultsBtn.disabled = false;
  }

  if (els.undoBtn) {
    els.undoBtn.addEventListener("click", () => {
      if (hits.length > 0) {
        hits.pop();
      } else {
        aim = null;
      }
      renderDots();
      updateUI();
    });
  }

  if (els.clearBtn) {
    els.clearBtn.addEventListener("click", () => {
      aim = null;
      hits = [];
      renderDots();
      updateUI();
    });
  }

  if (els.backBtn) {
    els.backBtn.addEventListener("click", () => {
      showLanding();
    });
  }

  if (els.scoreAnotherBtn) {
    els.scoreAnotherBtn.addEventListener("click", () => {
      hideSEC();
      aim = null;
      hits = [];
      renderDots();
      updateUI();
      showLanding();
    });
  }

  function meanPoint(points) {
    const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x: avgX, y: avgY };
  }

  function normalizedToInches(point, config) {
    return {
      x: point.x * config.targetWIn,
      y: point.y * config.targetHIn
    };
  }

  function computeGroupSizeInches(points, config) {
    if (points.length < 2) return 0;

    const inchPoints = points.map((p) => normalizedToInches(p, config));
    let maxDist = 0;

    for (let i = 0; i < inchPoints.length; i += 1) {
      for (let j = i + 1; j < inchPoints.length; j += 1) {
        const dx = inchPoints[i].x - inchPoints[j].x;
        const dy = inchPoints[i].y - inchPoints[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) maxDist = dist;
      }
    }

    return maxDist;
  }

  function inchesToMOA(inches, rangeYds) {
    const moaInchesAtRange = 1.047 * (rangeYds / 100);
    return inches / moaInchesAtRange;
  }

  function inchesToMRAD(inches, rangeYds) {
    const mradInchesAtRange = 3.6 * (rangeYds / 100);
    return inches / mradInchesAtRange;
  }

  function unitFromInches(inches, config) {
    if (config.dialUnit === "MRAD") {
      return inchesToMRAD(inches, config.rangeYds);
    }
    return inchesToMOA(inches, config.rangeYds);
  }

  function computeScore(distanceInches, groupSizeInches, shotCount) {
    const distancePenalty = distanceInches * 18;
    const groupPenalty = groupSizeInches * 11;
    const shotCountBonus = Math.min(shotCount, 5) * 1.5;
    const raw = 100 - distancePenalty - groupPenalty + shotCountBonus;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  function getScoreState(score) {
    if (score >= 90) {
      return {
        scoreClass: "scoreGreen",
        bandClass: "bandGreen",
        bandText: "EXCELLENT",
        tutor: "Tight group. Stay centered and confirm with another clean session.",
        howText: "Higher scores come from tighter groups finishing closer to the aim point."
      };
    }

    if (score >= 60) {
      return {
        scoreClass: "scoreYellow",
        bandClass: "bandYellow",
        bandText: "SOLID",
        tutor: "You are on track. Tighten the group and keep moving closer to center.",
        howText: "A tighter group closer to center raises your score fast."
      };
    }

    return {
      scoreClass: "scoreRed",
      bandClass: "bandRed",
      bandText: "NEEDS WORK",
      tutor: "Focus on consistency first, then move the group toward center.",
      howText: "Lower scores usually mean the group is wide, off-center, or both."
    };
  }

  function applyScoreClasses(scoreState) {
    if (els.secScore) {
      els.secScore.classList.remove("scoreGreen", "scoreYellow", "scoreRed");
      els.secScore.classList.add(scoreState.scoreClass);
    }

    if (els.secScoreBand) {
      els.secScoreBand.classList.remove("bandGreen", "bandYellow", "bandRed");
      els.secScoreBand.classList.add(scoreState.bandClass);
    }
  }

  function getDirectionX(dxInches) {
    if (Math.abs(dxInches) < 0.005) return "CENTERED";
    return dxInches > 0 ? "RIGHT" : "LEFT";
  }

  function getDirectionY(dyInches) {
    if (Math.abs(dyInches) < 0.005) return "CENTERED";
    return dyInches > 0 ? "UP" : "DOWN";
  }

  function computeResults() {
    const config = getRangeConfig();

    const poibNorm = meanPoint(hits);
    const aimIn = normalizedToInches(aim, config);
    const poibIn = normalizedToInches(poibNorm, config);

    const dxInches = aimIn.x - poibIn.x;
    const dyDom = aimIn.y - poibIn.y;
    const dyInches = -dyDom;

    const windageUnits = unitFromInches(Math.abs(dxInches), config);
    const elevationUnits = unitFromInches(Math.abs(dyInches), config);

    const windageClicks = windageUnits / config.clickValue;
    const elevationClicks = elevationUnits / config.clickValue;

    const groupSizeInches = computeGroupSizeInches(hits, config);
    const distanceFromCenter = Math.sqrt(dxInches * dxInches + dyInches * dyInches);
    const score = computeScore(distanceFromCenter, groupSizeInches, hits.length);

    return {
      score,
      config,
      dxInches,
      dyInches,
      windageClicks,
      elevationClicks
    };
  }

  if (els.showResultsBtn) {
    els.showResultsBtn.addEventListener("click", () => {
      if (!aim || hits.length < 3 || !targetImage) return;

      const r = computeResults();
      const scoreState = getScoreState(r.score);
      const createdAt = new Date().toISOString();

      if (els.freezeScrim) els.freezeScrim.hidden = false;

      if (els.secTargetThumb) {
        els.secTargetThumb.removeAttribute("width");
        els.secTargetThumb.removeAttribute("height");
        els.secTargetThumb.src = targetImage;
      }

      if (els.secScore) els.secScore.textContent = String(r.score);
      if (els.secScoreBand) els.secScoreBand.textContent = scoreState.bandText;
      applyScoreClasses(scoreState);

      if (els.secWindageDir) els.secWindageDir.textContent = getDirectionX(r.dxInches);
      if (els.secWindageClicks) els.secWindageClicks.textContent = r.windageClicks.toFixed(2);

      if (els.secElevationDir) els.secElevationDir.textContent = getDirectionY(r.dyInches);
      if (els.secElevationClicks) els.secElevationClicks.textContent = r.elevationClicks.toFixed(2);

      if (els.secThumbScore) els.secThumbScore.textContent = String(r.score);
      if (els.secThumbHits) els.secThumbHits.textContent = String(hits.length);
      if (els.secThumbWhen) els.secThumbWhen.textContent = formatHistoryDate(createdAt);
      if (els.secThumbTutorLine) {
        els.secThumbTutorLine.textContent =
          `${getDirectionX(r.dxInches)} ${r.windageClicks.toFixed(2)} • ${getDirectionY(r.dyInches)} ${r.elevationClicks.toFixed(2)}`;
      }

      if (els.secHowScoreText) {
        els.secHowScoreText.textContent = scoreState.howText;
      }

      pushHistory({
        score: r.score,
        hits: hits.length,
        createdAt,
        tutLine: `${getDirectionX(r.dxInches)} ${r.windageClicks.toFixed(2)} • ${getDirectionY(r.dyInches)} ${r.elevationClicks.toFixed(2)}`
      });

      showSEC();
    });
  }

  if (els.secBackBtn) {
    els.secBackBtn.addEventListener("click", hideSEC);
  }

  if (els.saveSecBtn) {
    els.saveSecBtn.addEventListener("click", () => {
      document.dispatchEvent(new Event("SCZN3_SAVE_SEC"));
    });
  }

  hydrateVendor();
  showLanding();
  updateUI();
  renderHistory();
})();
