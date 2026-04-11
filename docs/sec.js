/* ============================================================
   docs/sec.js — FULL REPLACEMENT
   Matches current sec.html IDs
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const scoreValue = $("scoreValue");
  const scoreBand = $("scoreBand");
  const scoreTip = $("scoreTip");

  const windageBig = $("windageBig");
  const windageDir = $("windageDir");

  const elevationBig = $("elevationBig");
  const elevationDir = $("elevationDir");

  const runDistance = $("runDistance");
  const runHits = $("runHits");
  const runTime = $("runTime");

  const toReportBtn = $("toReportBtn");
  const backBtn = $("backBtn");
  const goHomeBtn = $("goHomeBtn");
  const vendorBtn = $("vendorBtn");

  const viewPrecision = $("viewPrecision");
  const viewReport = $("viewReport");

  const KEY_RESULTS = "sczn3_results";
  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";

  function getParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name) || "";
  }

  function loadPayload() {
    const s = sessionStorage.getItem(KEY_RESULTS) || "";
    try { return JSON.parse(s); } catch { return null; }
  }

  function avg(points, key) {
    return points.reduce((sum, p) => sum + Number(p[key] || 0), 0) / points.length;
  }

  function distance(a, b) {
    const dx = a.x01 - b.x01;
    const dy = a.y01 - b.y01;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function compute(payload) {
    const aim = payload?.aim;
    const hits = payload?.hits || [];
    if (!aim || hits.length < 3) return null;

    const poib = {
      x01: avg(hits, "x01"),
      y01: avg(hits, "y01")
    };

    const dx = poib.x01 - aim.x01;
    const dy = poib.y01 - aim.y01;

    const windageClicks = Math.round(Math.abs(dx) * 100);
    const elevationClicks = Math.round(Math.abs(dy) * 100);

    const windageDirection = dx > 0 ? "LEFT" : dx < 0 ? "RIGHT" : "CENTERED";
    const elevationDirection = dy > 0 ? "UP" : dy < 0 ? "DOWN" : "CENTERED";

    const meanRadius =
      hits.reduce((sum, p) => sum + distance(p, poib), 0) / hits.length;

    const aimOffset = distance(poib, aim);

    const score = Math.max(
      0,
      Math.min(100, Math.round(100 - (aimOffset * 220 + meanRadius * 180)))
    );

    return {
      score,
      windageClicks,
      windageDirection,
      elevationClicks,
      elevationDirection,
      shotCount: hits.length
    };
  }

  function renderVendor() {
    if (!vendorBtn) return;

    const vParam = getParam("v").toLowerCase();
    let vendorUrl = localStorage.getItem(KEY_VENDOR_URL) || "";

    if (!vendorUrl && vParam === "baker") {
      vendorUrl = "https://bakertargets.com/";
    }

    if (vendorUrl) {
      vendorBtn.href = vendorUrl;
      vendorBtn.textContent = "Visit Baker";
      vendorBtn.style.pointerEvents = "auto";
      vendorBtn.style.opacity = "1";
    } else {
      vendorBtn.href = "#";
      vendorBtn.textContent = "Visit Vendor";
      vendorBtn.style.pointerEvents = "none";
      vendorBtn.style.opacity = ".6";
    }
  }

  function render() {
    const payload = loadPayload();
    const result = compute(payload);

    renderVendor();

    if (!result) return;

    if (scoreValue) scoreValue.textContent = String(result.score);

    if (scoreBand) {
      if (result.score >= 85) {
        scoreBand.textContent = "EXCELLENT";
        scoreBand.className = "scoreBand";
      } else if (result.score >= 70) {
        scoreBand.textContent = "GOOD";
        scoreBand.className = "scoreBand";
      } else if (result.score >= 50) {
        scoreBand.textContent = "FAIR";
        scoreBand.className = "scoreBand";
      } else {
        scoreBand.textContent = "ADJUST";
        scoreBand.className = "scoreBand";
      }
    }

    if (scoreTip) {
      scoreTip.textContent = "Tight cluster + closer to the aim point = higher score.";
    }

    if (windageBig) windageBig.textContent = String(result.windageClicks);
    if (windageDir) windageDir.textContent = result.windageDirection;

    if (elevationBig) elevationBig.textContent = String(result.elevationClicks);
    if (elevationDir) elevationDir.textContent = result.elevationDirection;

    if (runDistance) runDistance.textContent = "100 yds";
    if (runHits) runHits.textContent = `${result.shotCount} hits`;
    if (runTime) runTime.textContent = "Session ready";
  }

  if (toReportBtn && viewPrecision && viewReport) {
    toReportBtn.onclick = () => {
      viewPrecision.classList.remove("viewOn");
      viewReport.classList.add("viewOn");
    };
  }

  if (backBtn && viewPrecision && viewReport) {
    backBtn.onclick = () => {
      viewReport.classList.remove("viewOn");
      viewPrecision.classList.add("viewOn");
    };
  }

  if (goHomeBtn) {
    goHomeBtn.onclick = () => {
      const params = new URLSearchParams(window.location.search);
      const qs = params.toString();
      window.location.href = qs ? `index.html?${qs}` : "index.html";
    };
  }

  render();
})();
