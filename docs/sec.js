/* ============================================================
   docs/sec.js — FULL REPLACEMENT
   FIX:
   ✅ Correctly decodes payload from URL
   ✅ Falls back to sessionStorage / localStorage
   ✅ Restores full SEC rendering flow
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  // Views
  const viewPrecision = $("viewPrecision");
  const viewReport = $("viewReport");
  const toReportBtn = $("toReportBtn");
  const backBtn = $("backBtn");
  const goHomeBtn = $("goHomeBtn");

  // Page 1
  const scoreValue = $("scoreValue");
  const scoreBand = $("scoreBand");
  const scoreTip = $("scoreTip");
  const runDistance = $("runDistance");
  const runHits = $("runHits");
  const runTime = $("runTime");
  const windageBig = $("windageBig");
  const windageDir = $("windageDir");
  const elevationBig = $("elevationBig");
  const elevationDir = $("elevationDir");

  // Page 2
  const secCardImg = $("secCardImg");
  const vendorBtn = $("vendorBtn");
  const surveyBtn = $("surveyBtn");

  // Keys
  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";
  const KEY_VENDOR_NAME = "SCZN3_VENDOR_NAME_V1";
  const KEY_RESULTS = "sczn3_results";
  const KEY_SEC_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const DEFAULT_SURVEY_URL = "https://forms.gle/uCSDTk5BwT4euLYeA";

  function getParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name) || "";
  }

  function safeJsonParse(s) {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }

  function decodePayloadFromUrl(value) {
    if (!value) return null;

    // Matches index.js encoder:
    // btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    try {
      const json = decodeURIComponent(escape(atob(value)));
      return safeJsonParse(json);
    } catch {
      // Fallback for plain btoa(JSON.stringify(...))
      try {
        return safeJsonParse(atob(value));
      } catch {
        return null;
      }
    }
  }

  function loadPayload() {
    // 1) URL payload
    const fromUrl = getParam("payload");
    if (fromUrl) {
      const p = decodePayloadFromUrl(fromUrl);
      if (p) return p;
    }

    // 2) sessionStorage primary
    let s = sessionStorage.getItem(KEY_RESULTS);
    if (s) {
      const p = safeJsonParse(s);
      if (p) return p;
    }

    // 3) sessionStorage secondary
    s = sessionStorage.getItem(KEY_SEC_PAYLOAD);
    if (s) {
      const p = safeJsonParse(s);
      if (p) return p;
    }

    // 4) localStorage fallback
    s = localStorage.getItem(KEY_SEC_PAYLOAD);
    if (s) {
      const p = safeJsonParse(s);
      if (p) return p;
    }

    return null;
  }

  function avg(points, key) {
    return points.reduce((sum, p) => sum + Number(p[key] || 0), 0) / points.length;
  }

  function distance(a, b) {
    const dx = Number(a.x01 || 0) - Number(b.x01 || 0);
    const dy = Number(a.y01 || 0) - Number(b.y01 || 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function normalizePayload(payload) {
    if (!payload) return null;

    if (payload.aim && Array.isArray(payload.hits)) {
      return {
        aim: payload.aim,
        hits: payload.hits,
        vendorUrl: payload.vendorUrl || "",
        vendorName: payload.vendorName || "",
        distanceLabel: payload.distanceLabel || "100 yds",
        timeLabel: payload.timeLabel || "Results ready"
      };
    }

    if (payload.aimPoint && Array.isArray(payload.shots)) {
      return {
        aim: payload.aimPoint,
        hits: payload.shots,
        vendorUrl: payload.vendorUrl || "",
        vendorName: payload.vendorName || "",
        distanceLabel: payload.distanceLabel || "100 yds",
        timeLabel: payload.timeLabel || "Results ready"
      };
    }

    return null;
  }

  function compute(norm) {
    if (!norm?.aim || !norm?.hits || norm.hits.length < 3) return null;

    const poib = {
      x01: avg(norm.hits, "x01"),
      y01: avg(norm.hits, "y01")
    };

    const dx = poib.x01 - norm.aim.x01;
    const dy = poib.y01 - norm.aim.y01;

    const windageClicks = Math.round(Math.abs(dx) * 100);
    const elevationClicks = Math.round(Math.abs(dy) * 100);

    const windageDirection =
      dx > 0 ? "LEFT" : dx < 0 ? "RIGHT" : "CENTERED";

    const elevationDirection =
      dy > 0 ? "UP" : dy < 0 ? "DOWN" : "CENTERED";

    const meanRadius =
      norm.hits.reduce((sum, p) => sum + distance(p, poib), 0) / norm.hits.length;

    const offset = Math.sqrt(dx * dx + dy * dy);

    const score = Math.max(
      0,
      Math.min(100, Math.round(100 - offset * 120))
    );

    return {
      score,
      poib,
      offset,
      meanRadius,
      windageClicks,
      elevationClicks,
      windageDirection,
      elevationDirection,
      shotCount: norm.hits.length,
      distanceLabel: norm.distanceLabel || "100 yds",
      timeLabel: norm.timeLabel || "Results ready",
      vendorUrl: norm.vendorUrl || "",
      vendorName: norm.vendorName || ""
    };
  }

  function scoreLabel(score) {
    if (score >= 90) return "EXCELLENT";
    if (score >= 75) return "GOOD";
    if (score >= 60) return "FAIR";
    return "ADJUST";
  }

  function renderVendor(result) {
    if (!vendorBtn) return;

    const vParam = getParam("v").toLowerCase();

    let vendorUrl =
      result?.vendorUrl ||
      localStorage.getItem(KEY_VENDOR_URL) ||
      "";

    if (!vendorUrl && vParam === "baker") {
      vendorUrl = "https://bakertargets.com/";
    }

    let vendorName =
      result?.vendorName ||
      localStorage.getItem(KEY_VENDOR_NAME) ||
      "";

    if (!vendorName && vendorUrl.toLowerCase().includes("baker")) {
      vendorName = "Visit Baker";
    }

    if (vendorUrl) {
      vendorBtn.href = vendorUrl;
      vendorBtn.textContent = vendorName || "Visit Vendor";
      vendorBtn.style.pointerEvents = "auto";
      vendorBtn.style.opacity = "1";
    } else {
      vendorBtn.href = "#";
      vendorBtn.textContent = "Visit Vendor";
      vendorBtn.style.pointerEvents = "none";
      vendorBtn.style.opacity = ".6";
    }

    if (surveyBtn) {
      surveyBtn.href = DEFAULT_SURVEY_URL;
      surveyBtn.target = "_blank";
      surveyBtn.rel = "noopener";
    }
  }

  function renderPrecision(result) {
    if (!result) return;

    if (scoreValue) scoreValue.textContent = String(result.score);
    if (scoreBand) scoreBand.textContent = scoreLabel(result.score);
    if (scoreTip) {
      scoreTip.textContent = "Tight cluster + closer to the aim point = higher score.";
    }

    if (windageBig) {
      windageBig.textContent =
        result.windageDirection === "CENTERED" ? "0" : String(result.windageClicks);
    }
    if (windageDir) windageDir.textContent = result.windageDirection;

    if (elevationBig) {
      elevationBig.textContent =
        result.elevationDirection === "CENTERED" ? "0" : String(result.elevationClicks);
    }
    if (elevationDir) elevationDir.textContent = result.elevationDirection;

    if (runDistance) runDistance.textContent = result.distanceLabel;
    if (runHits) runHits.textContent = `${result.shotCount} hits`;
    if (runTime) runTime.textContent = result.timeLabel;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fillRoundRect(ctx, x, y, w, h, r, fill) {
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function strokeRoundRect(ctx, x, y, w, h, r, stroke, lineWidth = 1) {
    roundRect(ctx, x, y, w, h, r);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function drawMiniTarget(ctx, x, y, w, h, result) {
    fillRoundRect(ctx, x, y, w, h, 22, "#f3f4f6");
    strokeRoundRect(ctx, x, y, w, h, 22, "rgba(15,23,42,.12)", 2);

    ctx.strokeStyle = "rgba(15,23,42,.15)";
    ctx.lineWidth = 1;

    const cols = 8;
    const rows = 5;

    for (let i = 1; i < cols; i++) {
      const gx = x + (w / cols) * i;
      ctx.beginPath();
      ctx.moveTo(gx, y + 8);
      ctx.lineTo(gx, y + h - 8);
      ctx.stroke();
    }

    for (let j = 1; j < rows; j++) {
      const gy = y + (h / rows) * j;
      ctx.beginPath();
      ctx.moveTo(x + 8, gy);
      ctx.lineTo(x + w - 8, gy);
      ctx.stroke();
    }

    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 28, cy);
    ctx.lineTo(cx + 28, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 28);
    ctx.lineTo(cx, cy + 28);
    ctx.stroke();

    const poibX = cx + (result.poib.x01 - 0.5) * (w * 0.7);
    const poibY = cy + (result.poib.y01 - 0.5) * (h * 0.7);

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(poibX - 10, poibY - 10);
    ctx.lineTo(poibX + 10, poibY + 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(poibX - 10, poibY + 10);
    ctx.lineTo(poibX + 10, poibY - 10);
    ctx.stroke();
  }

  function generateFancyCard(result) {
    if (!secCardImg || !result) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 1800;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bgTop = "#07111f";
    const bgBottom = "#0f1b2d";
    const card = "rgba(255,255,255,.06)";
    const cardBorder = "rgba(255,255,255,.10)";
    const white = "#f8fafc";
    const muted = "#94a3b8";
    const accent = result.score >= 90 ? "#22c55e" : result.score >= 75 ? "#3b82f6" : result.score >= 60 ? "#f59e0b" : "#ef4444";

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, bgTop);
    grad.addColorStop(1, bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(59,130,246,.10)";
    ctx.beginPath();
    ctx.arc(1180, 180, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(239,68,68,.08)";
    ctx.beginPath();
    ctx.arc(170, 1500, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = white;
    ctx.font = "600 34px Arial";
    ctx.fillText("SHOOTER EXPERIENCE CARD", 90, 90);

    ctx.fillStyle = muted;
    ctx.font = "24px Arial";
    ctx.fillText("After-Shot Intelligence", 90, 126);

    fillRoundRect(ctx, 70, 170, 1260, 560, 36, card);
    strokeRoundRect(ctx, 70, 170, 1260, 560, 36, cardBorder, 2);

    ctx.fillStyle = muted;
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SCORE", 700, 250);

    ctx.fillStyle = white;
    ctx.font = "bold 220px Arial";
    ctx.fillText(String(result.score), 700, 470);

    fillRoundRect(ctx, 420, 500, 560, 90, 45, accent);
    ctx.fillStyle = "#0b1220";
    ctx.font = "bold 38px Arial";
    ctx.fillText(scoreLabel(result.score), 700, 558);

    ctx.fillStyle = muted;
    ctx.font = "24px Arial";
    ctx.fillText("Distance", 250, 650);
    ctx.fillText("Hits", 700, 650);
    ctx.fillText("Status", 1080, 650);

    ctx.fillStyle = white;
    ctx.font = "bold 34px Arial";
    ctx.fillText(result.distanceLabel, 250, 695);
    ctx.fillText(`${result.shotCount}`, 700, 695);
    ctx.fillText(result.timeLabel, 1080, 695);

    ctx.textAlign = "left";

    fillRoundRect(ctx, 70, 780, 610, 300, 30, card);
    strokeRoundRect(ctx, 70, 780, 610, 300, 30, cardBorder, 2);

    fillRoundRect(ctx, 720, 780, 610, 300, 30, card);
    strokeRoundRect(ctx, 720, 780, 610, 300, 30, cardBorder, 2);

    ctx.fillStyle = muted;
    ctx.font = "bold 24px Arial";
    ctx.fillText("WINDAGE", 110, 835);
    ctx.fillText("ELEVATION", 760, 835);

    ctx.fillStyle = white;
    ctx.font = "bold 130px Arial";
    ctx.fillText(
      result.windageDirection === "CENTERED" ? "0" : String(result.windageClicks),
      110,
      965
    );
    ctx.fillText(
      result.elevationDirection === "CENTERED" ? "0" : String(result.elevationClicks),
      760,
      965
    );

    ctx.fillStyle = accent;
    ctx.font = "bold 42px Arial";
    ctx.fillText(result.windageDirection, 118, 1025);
    ctx.fillText(result.elevationDirection, 768, 1025);

    fillRoundRect(ctx, 70, 1130, 610, 420, 30, card);
    strokeRoundRect(ctx, 70, 1130, 610, 420, 30, cardBorder, 2);

    fillRoundRect(ctx, 720, 1130, 610, 420, 30, card);
    strokeRoundRect(ctx, 720, 1130, 610, 420, 30, cardBorder, 2);

    ctx.fillStyle = muted;
    ctx.font = "bold 24px Arial";
    ctx.fillText("TARGET SNAPSHOT", 110, 1188);
    ctx.fillText("SESSION DETAILS", 760, 1188);

    drawMiniTarget(ctx, 110, 1225, 530, 250, result);

    ctx.fillStyle = white;
    ctx.font = "bold 28px Arial";
    ctx.fillText("Offset", 760, 1285);
    ctx.fillText("Group", 760, 1370);
    ctx.fillText("Partner", 760, 1455);

    ctx.font = "24px Arial";
    ctx.fillStyle = muted;
    ctx.fillText(result.offset.toFixed(3), 760, 1325);
    ctx.fillText(result.meanRadius.toFixed(3), 760, 1410);
    ctx.fillText(result.vendorName || "Baker Targets", 760, 1495);

    ctx.fillStyle = white;
    ctx.font = "bold 26px Arial";
    ctx.fillText("Powered by SCZN3", 90, 1690);

    ctx.fillStyle = muted;
    ctx.font = "22px Arial";
    ctx.fillText("Faith • Order • Precision", 90, 1730);

    ctx.textAlign = "right";
    ctx.fillText("Report Card", 1310, 1730);

    secCardImg.src = canvas.toDataURL("image/png");
  }

  function showReport(result) {
    if (!viewPrecision || !viewReport) return;
    generateFancyCard(result);
    viewPrecision.classList.remove("viewOn");
    viewReport.classList.add("viewOn");
  }

  function showPrecision() {
    if (!viewPrecision || !viewReport) return;
    viewReport.classList.remove("viewOn");
    viewPrecision.classList.add("viewOn");
  }

  function goHome() {
    const params = new URLSearchParams(window.location.search);
    params.delete("payload");
    const qs = params.toString();
    window.location.href = qs ? `index.html?${qs}` : "index.html";
  }

  const rawPayload = loadPayload();
  const norm = normalizePayload(rawPayload);
  const result = compute(norm);

  if (!result) {
    alert("SEC data not found. Go back and run a target first.");
    return;
  }

  result.vendorUrl = norm.vendorUrl || "";
  result.vendorName = norm.vendorName || "";

  renderVendor(result);
  renderPrecision(result);

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
