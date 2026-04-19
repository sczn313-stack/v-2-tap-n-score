/* ============================================================
   docs/index.js — FULL REPLACEMENT
   LOCKED FLOW + LIVE SEC OVERLAY
============================================================ */

(() => {
  "use strict";

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

    // SEC fields
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
    secThumbTutorLine: $("secThumbTutorLine")
  };

  let aim = null;
  let hits = [];
  let targetImage = null;

  /* ============================================================
     VIEW CONTROL
  ============================================================= */

  function showLanding() {
    els.landingView.hidden = false;
    els.workspaceView.hidden = true;
    els.secOverlay.hidden = true;
  }

  function showWorkspace() {
    els.landingView.hidden = true;
    els.workspaceView.hidden = false;
  }

  function showSEC() {
    els.secOverlay.hidden = false;
  }

  function hideSEC() {
    els.secOverlay.hidden = true;
    els.freezeScrim.hidden = true;
  }

  /* ============================================================
     IMAGE LOAD
  ============================================================= */

  els.photoBtn.addEventListener("click", () => {
    els.photoInput.click();
  });

  els.photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    targetImage = url;

    els.targetImg.src = url;

    aim = null;
    hits = [];
    renderDots();
    updateUI();

    showWorkspace();
  });

  /* ============================================================
     TAP LOGIC
  ============================================================= */

  function getPoint(e) {
    const rect = els.targetWrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    };
  }

  els.targetWrap.addEventListener("pointerdown", (e) => {
    if (!targetImage) return;

    const p = getPoint(e);

    if (!aim) {
      aim = p;
    } else if (hits.length < 7) {
      hits.push(p);
    }

    renderDots();
    updateUI();
  });

  /* ============================================================
     DOT RENDER
  ============================================================= */

  function renderDots() {
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
      d.textContent = i + 1;
      els.dotsLayer.appendChild(d);
    });
  }

  /* ============================================================
     UI STATE
  ============================================================= */

  function updateUI() {
    els.shotCount.textContent = hits.length;

    if (!aim) {
      els.instructionLine.textContent = "Tap aim point to begin.";
      els.statusLine.textContent = "No aim point set.";
      els.showResultsBtn.disabled = true;
      return;
    }

    if (hits.length < 3) {
      els.instructionLine.textContent = "Tap 3–7 shots.";
      els.statusLine.textContent = `${hits.length} shot(s) placed.`;
      els.showResultsBtn.disabled = true;
      return;
    }

    els.instructionLine.textContent = "Ready for results.";
    els.statusLine.textContent = `${hits.length} shots captured.`;
    els.showResultsBtn.disabled = false;
  }

  /* ============================================================
     CONTROLS
  ============================================================= */

  els.undoBtn.addEventListener("click", () => {
    if (hits.length > 0) {
      hits.pop();
    } else {
      aim = null;
    }
    renderDots();
    updateUI();
  });

  els.clearBtn.addEventListener("click", () => {
    aim = null;
    hits = [];
    renderDots();
    updateUI();
  });

  els.backBtn.addEventListener("click", () => {
    showLanding();
  });

  /* ============================================================
     RESULTS (SIMPLIFIED CALC FOR NOW)
  ============================================================= */

  function computeResults() {
    const avgX = hits.reduce((s, p) => s + p.x, 0) / hits.length;
    const avgY = hits.reduce((s, p) => s + p.y, 0) / hits.length;

    const dx = (avgX - aim.x) * 10;
    const dy = (avgY - aim.y) * 10;

    return {
      score: Math.max(0, 100 - Math.sqrt(dx * dx + dy * dy) * 10).toFixed(0),
      dx,
      dy
    };
  }

  /* ============================================================
     SHOW RESULTS → LIVE SEC
  ============================================================= */

  els.showResultsBtn.addEventListener("click", () => {
    const r = computeResults();

    // freeze background
    els.freezeScrim.hidden = false;

    // populate SEC
    els.secTargetThumb.src = targetImage;

    els.secScore.textContent = r.score;
    els.secScoreBand.textContent =
      r.score >= 90 ? "EXCELLENT" :
      r.score >= 60 ? "SOLID" : "NEEDS WORK";

    els.secWindageClicks.textContent = Math.abs(r.dx).toFixed(2);
    els.secWindageDir.textContent = r.dx > 0 ? "RIGHT" : "LEFT";

    els.secElevationClicks.textContent = Math.abs(r.dy).toFixed(2);
    els.secElevationDir.textContent = r.dy > 0 ? "DOWN" : "UP";

    els.secShotCount.textContent = hits.length;
    els.secGroupSize.textContent = "--";
    els.secDx.textContent = r.dx.toFixed(2);
    els.secDy.textContent = r.dy.toFixed(2);

    // thumbnail meta
    els.secThumbScore.textContent = r.score;
    els.secThumbHits.textContent = hits.length;
    els.secThumbWhen.textContent = new Date().toLocaleString();
    els.secThumbTutorLine.textContent =
      "Tighten your group and move toward center.";

    showSEC();
  });

  /* ============================================================
     SEC CONTROLS
  ============================================================= */

  els.secBackBtn.addEventListener("click", hideSEC);

  els.saveSecBtn.addEventListener("click", () => {
    // handled in save.js (capture live)
    document.dispatchEvent(new Event("SCZN3_SAVE_SEC"));
  });

  /* ============================================================
     INIT
  ============================================================= */

  showLanding();
})();
