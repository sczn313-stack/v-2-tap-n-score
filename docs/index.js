/* ============================================================
   docs/index.js — FULL REPLACEMENT
   LOCKED FLOW + LIVE SEC OVERLAY
   POLISH PASS 2 — SCORE HIERARCHY / BAND STYLING
   POLISH PASS 3 — HISTORY ALIGNMENT / 10 SESSION COMPRESSION
============================================================ */

(() => {
  "use strict";

  const HISTORY_KEY = "SCZN3_SEC_HISTORY_V1";
  const HISTORY_LIMIT = 10;

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

    secOverlay: $("secOverlay"),
    secBackBtn: $("secBackBtn"),
    saveSecBtn: $("saveSecBtn"),
    scoreAnotherBtn: $("scoreAnotherBtn"),

    secTargetThumb: $("secTargetThumb"),
    secScore: $("secScore"),
    secScoreBand: $("secScoreBand"),

    secWindageClicks: $("secWindageClicks"),
    secWindageDir: $("secWindageDir"),
    secElevationClicks: $("secElevationClicks"),
    secElevationDir: $("secElevationDir"),

    secShotCount: $("secShotCount"),
    secGroupSize: $("secGroupSize"),
    secDx: $("secDxInches"),
    secDy: $("secDyInches"),

    secThumbScore: $("secThumbScore"),
    secThumbHits: $("secThumbHits"),
    secThumbWhen: $("secThumbWhen"),
    secThumbTutorLine: $("secThumbTutorLine"),

    secHowScoreText: $("secHowScoreText"),
    secHistoryList: $("secHistoryList")
  };

  let aim = null;
  let hits = [];
  let targetImage = null;
  let currentObjectUrl = null;

  /* ============================================================
     VIEW CONTROL
  ============================================================= */

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

  /* ============================================================
     HISTORY
  ============================================================= */

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("History load failed:", err);
      return [];
    }
  }

  function saveHistory(rows) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, HISTORY_LIMIT)));
    } catch (err) {
      console.warn("History save failed:", err);
    }
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

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ============================================================
     IMAGE LOAD
  ============================================================= */

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

  /* ============================================================
     TAP LOGIC
  ============================================================= */

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

  /* ============================================================
     DOT RENDER
  ============================================================= */

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

  /* ============================================================
     UI STATE
  ============================================================= */

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

  /* ============================================================
     CONTROLS
  ============================================================= */

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

  /* ============================================================
     RESULTS (PLACEHOLDER CALC UNTIL TRUE SCZN3 MATH SWAP-IN)
  ============================================================= */

  function computeGroupCenter(points) {
    const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x: avgX, y: avgY };
  }

  function computeGroupSize(points) {
    if (points.length < 2) return 0;

    let maxDist = 0;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) maxDist = dist;
      }
    }
    return maxDist * 10;
  }

  function computeResults() {
    const center = computeGroupCenter(hits);
    const dx = (center.x - aim.x) * 10;
    const dy = (center.y - aim.y) * 10;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const groupSize = computeGroupSize(hits);

    const scoreRaw = 100 - (distance * 11 + groupSize * 5);
    const scoreNum = Math.max(0, Math.min(100, Math.round(scoreRaw)));

    return {
      score: scoreNum,
      dx,
      dy,
      groupSize
    };
  }

  function getScoreState(score) {
    if (score >= 90) {
      return {
        scoreClass: "scoreGreen",
        bandClass: "bandGreen",
        bandText: "EXCELLENT",
        tutor: "Tight group. Stay centered and confirm with another clean session.",
        howText: "Higher scores come from tighter groups finishing very close to the aim point."
      };
    }

    if (score >= 60) {
      return {
        scoreClass: "scoreYellow",
        bandClass: "bandYellow",
        bandText: "SOLID",
        tutor: "You are on track. Tighten the group and keep moving closer to center.",
        howText: "A solid score means the group is usable, but a tighter cluster nearer center raises it fast."
      };
    }

    return {
      scoreClass: "scoreRed",
      bandClass: "bandRed",
      bandText: "NEEDS WORK",
      tutor: "Focus on consistency first. Tighten the group, then bring it toward center.",
      howText: "Lower scores usually mean the group is wide, off-center, or both. Tightness plus centering drives improvement."
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

  function getDirectionX(dx) {
    if (Math.abs(dx) < 0.005) return "CENTERED";
    return dx > 0 ? "RIGHT" : "LEFT";
  }

  function getDirectionY(dy) {
    if (Math.abs(dy) < 0.005) return "CENTERED";
    return dy > 0 ? "DOWN" : "UP";
  }

  /* ============================================================
     SHOW RESULTS → LIVE SEC
  ============================================================= */

  if (els.showResultsBtn) {
    els.showResultsBtn.addEventListener("click", () => {
      if (!aim || hits.length < 3 || !targetImage) return;

      const r = computeResults();
      const scoreState = getScoreState(r.score);
      const createdAt = new Date().toISOString();

      if (els.freezeScrim) {
        els.freezeScrim.hidden = false;
      }

      if (els.secTargetThumb) {
        els.secTargetThumb.removeAttribute("width");
        els.secTargetThumb.removeAttribute("height");
        els.secTargetThumb.src = targetImage;
      }

      if (els.secScore) els.secScore.textContent = String(r.score);
      if (els.secScoreBand) els.secScoreBand.textContent = scoreState.bandText;

      applyScoreClasses(scoreState);

      if (els.secWindageClicks) els.secWindageClicks.textContent = Math.abs(r.dx).toFixed(2);
      if (els.secWindageDir) els.secWindageDir.textContent = getDirectionX(r.dx);

      if (els.secElevationClicks) els.secElevationClicks.textContent = Math.abs(r.dy).toFixed(2);
      if (els.secElevationDir) els.secElevationDir.textContent = getDirectionY(r.dy);

      if (els.secShotCount) els.secShotCount.textContent = String(hits.length);
      if (els.secGroupSize) els.secGroupSize.textContent = `${r.groupSize.toFixed(2)} in`;
      if (els.secDx) els.secDx.textContent = `${r.dx.toFixed(2)} in`;
      if (els.secDy) els.secDy.textContent = `${r.dy.toFixed(2)} in`;

      if (els.secThumbScore) els.secThumbScore.textContent = String(r.score);
      if (els.secThumbHits) els.secThumbHits.textContent = String(hits.length);
      if (els.secThumbWhen) els.secThumbWhen.textContent = formatHistoryDate(createdAt);
      if (els.secThumbTutorLine) els.secThumbTutorLine.textContent = scoreState.tutor;
      if (els.secHowScoreText) els.secHowScoreText.textContent = scoreState.howText;

      pushHistory({
        score: r.score,
        hits: hits.length,
        createdAt,
        tutLine: scoreState.tutor
      });

      showSEC();
    });
  }

  /* ============================================================
     SEC CONTROLS
  ============================================================= */

  if (els.secBackBtn) {
    els.secBackBtn.addEventListener("click", hideSEC);
  }

  if (els.saveSecBtn) {
    els.saveSecBtn.addEventListener("click", () => {
      document.dispatchEvent(new Event("SCZN3_SAVE_SEC"));
    });
  }

  /* ============================================================
     INIT
  ============================================================= */

  showLanding();
  updateUI();
  renderHistory();
})();
