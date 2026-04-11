/* ============================================================
   docs/sec.js — FULL REPLACEMENT
   SEC rendering + report image generation + smoother scoring
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

  const viewPrecision = $("viewPrecision");
  const viewReport = $("viewReport");

  const secCardImg = $("secCardImg");
  const vendorBtn = $("vendorBtn");

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

    const offset = Math.sqrt(dx * dx + dy * dy);

    const score = Math.max(
      0,
      Math.min(100, Math.round(100 - (offset * 120)))
    );

    return {
      score,
      windageClicks,
      windageDirection,
      elevationClicks,
      elevationDirection,
      shotCount: hits.length,
      meanRadius,
      offset
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

  function render(result) {
    renderVendor();
    if (!result) return;

    if (scoreValue) scoreValue.textContent = String(result.score);

    if (scoreBand) {
      if (result.score >= 90) {
        scoreBand.textContent = "EXCELLENT";
      } else if (result.score >= 75) {
        scoreBand.textContent = "GOOD";
      } else if (result.score >= 60) {
        scoreBand.textContent = "FAIR";
      } else {
        scoreBand.textContent = "ADJUST";
      }
    }

    if (scoreTip) {
      scoreTip.textContent = "Tight cluster + closer to the aim point = higher score.";
    }

    if (windageBig) {
      windageBig.textContent =
        result.windageDirection === "CENTERED" ? "0" : String(result.windageClicks);
    }
    if (windageDir) {
      windageDir.textContent = result.windageDirection;
    }

    if (elevationBig) {
      elevationBig.textContent =
        result.elevationDirection === "CENTERED" ? "0" : String(result.elevationClicks);
    }
    if (elevationDir) {
      elevationDir.textContent = result.elevationDirection;
    }

    if (runDistance) runDistance.textContent = "100 yds";
    if (runHits) runHits.textContent = `${result.shotCount} hits`;
    if (runTime) runTime.textContent = "Session ready";
  }

  function generateCard(result) {
    if (!secCardImg || !result) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 675;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#08101f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Arial";
    ctx.fillText(`Score: ${result.score}`, 80, 120);

    ctx.font = "42px Arial";
    ctx.fillText(
      `Windage: ${result.windageDirection === "CENTERED" ? 0 : result.windageClicks} ${result.windageDirection}`,
      80,
      260
    );
    ctx.fillText(
      `Elevation: ${result.elevationDirection === "CENTERED" ? 0 : result.elevationClicks} ${result.elevationDirection}`,
      80,
      340
    );

    ctx.font = "32px Arial";
    ctx.fillText(`Shots: ${result.shotCount}`, 80, 450);
    ctx.fillText(`Offset: ${result.offset.toFixed(3)}`, 80, 500);
    ctx.fillText(`Group: ${result.meanRadius.toFixed(3)}`, 80, 550);

    ctx.font = "28px Arial";
    ctx.fillText("SCZN3", 80, 620);

    secCardImg.src = canvas.toDataURL("image/png");
  }

  function showReport(result) {
    if (!viewPrecision || !viewReport) return;

    viewPrecision.classList.remove("viewOn");
    viewReport.classList.add("viewOn");
    generateCard(result);
  }

  function showPrecision() {
    if (!viewPrecision || !viewReport) return;

    viewReport.classList.remove("viewOn");
    viewPrecision.classList.add("viewOn");
  }

  function goHome() {
    const params = new URLSearchParams(window.location.search);
    const qs = params.toString();
    window.location.href = qs ? `index.html?${qs}` : "index.html";
  }

  const payload = loadPayload();
  const result = compute(payload);

  render(result);

  if (toReportBtn) {
    toReportBtn.onclick = () => showReport(result);
  }

  if (backBtn) {
    backBtn.onclick = showPrecision;
  }

  if (goHomeBtn) {
    goHomeBtn.onclick = goHome;
  }
})();
