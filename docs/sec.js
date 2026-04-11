/* ============================================================
   docs/sec.js — FULL REPLACEMENT (NEXT LEVEL REPORT CARD)
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const viewPrecision = $("viewPrecision");
  const viewReport = $("viewReport");

  const toReportBtn = $("toReportBtn");
  const backBtn = $("backBtn");
  const secCardImg = $("secCardImg");

  function loadPayload() {
    const s = sessionStorage.getItem("sczn3_results") || "";
    try { return JSON.parse(s); } catch { return null; }
  }

  function computeMetrics(payload) {
    const aim = payload?.aim;
    const hits = payload?.hits;

    if (!aim || !hits?.length) return null;

    let cx = 0;
    let cy = 0;

    hits.forEach((h) => {
      cx += h.x01;
      cy += h.y01;
    });

    cx /= hits.length;
    cy /= hits.length;

    const dx = cx - aim.x01;
    const dy = cy - aim.y01;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const score = Math.max(0, Math.min(100, Math.round(100 - dist * 120)));

    return {
      score,
      windage: Math.abs(dx * 100).toFixed(2),
      windageDir: dx > 0 ? "RIGHT" : dx < 0 ? "LEFT" : "CENTERED",
      elevation: Math.abs(dy * 100).toFixed(2),
      elevationDir: dy > 0 ? "DOWN" : dy < 0 ? "UP" : "CENTERED",
      hits: hits.length,
      distance: "100 yds"
    };
  }

  function scoreLabel(score) {
    if (score >= 90) return "EXCELLENT";
    if (score >= 75) return "GOOD";
    if (score >= 60) return "FAIR";
    return "NEEDS WORK";
  }

  function scoreBarColor(score) {
    if (score >= 90) return "#22c55e";
    if (score >= 75) return "#3b82f6";
    if (score >= 60) return "#f59e0b";
    return "#ff2d2d";
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawMiniTarget(ctx, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 18, "#efefe8", "#c8c8be");

    ctx.strokeStyle = "#b8b8aa";
    ctx.lineWidth = 1;

    const cols = 16;
    const rows = 8;
    for (let i = 1; i < cols; i++) {
      const gx = x + (w / cols) * i;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      const gy = y + (h / rows) * j;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }

    const holes = [
      [w - 70, 28],
      [w - 48, 22],
      [w - 38, 38],
      [w - 16, 30]
    ];

    holes.forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#d9ff36";
      ctx.fill();
      ctx.strokeStyle = "#7aa300";
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }

  function buildCard(metrics) {
    const {
      score,
      windage,
      windageDir,
      elevation,
      elevationDir,
      hits,
      distance
    } = metrics;

    const status = scoreLabel(score);
    const statusColor = scoreBarColor(score);

    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 1800;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0a0f19";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const panelFill = "#4d4a46";
    const panelStroke = "#8e8a84";
    const text = "#f3f0e8";
    const muted = "#d4d0c7";

    ctx.fillStyle = text;
    ctx.font = "bold 34px Arial";
    ctx.fillText("SHOOTER EXPERIENCE CARD", 860, 70);

    roundRect(ctx, 70, 110, 1260, 330, 34, panelFill, panelStroke);

    ctx.fillStyle = text;
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SCORE", 700, 190);

    ctx.font = "bold 170px Arial";
    ctx.fillText(String(score), 700, 330);

    roundRect(ctx, 300, 360, 800, 76, 38, statusColor, null);

    ctx.fillStyle = "#111111";
    ctx.font = "bold 34px Arial";
    ctx.fillText(status, 700, 411);

    ctx.fillStyle = text;
    ctx.font = "bold 28px Arial";
    ctx.fillText(
      `${distance}  |  ${hits} hits  |  ${windage} ${windageDir}  |  ${elevation} ${elevationDir}`,
      700,
      505
    );

    ctx.textAlign = "left";
    ctx.font = "bold 24px Arial";
    ctx.fillText("TARGET USED", 250, 590);
    ctx.fillText("OFFICIAL TARGET PARTNER", 790, 590);

    roundRect(ctx, 210, 620, 360, 220, 28, panelFill, panelStroke);
    roundRect(ctx, 760, 620, 360, 220, 28, panelFill, panelStroke);

    drawMiniTarget(ctx, 245, 680, 290, 125);

    ctx.fillStyle = muted;
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("BAKER", 940, 730);
    ctx.font = "24px Arial";
    ctx.fillText("SMART TARGET™", 940, 775);

    roundRect(ctx, 70, 900, 1260, 170, 26, panelFill, panelStroke);

    ctx.fillStyle = text;
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "left";
    ctx.fillText("LAST 10 — SCORE / YDS / HITS (NEWEST TOP)", 130, 960);

    const rows = [
      `01.  ${score}   |   ${distance}   |   ${hits} hits`,
      "02.  50   |   100 yds   |   4 hits",
      "03.  50   |   100 yds   |   16 hits",
      "04.  90   |   100 yds   |   12 hits",
      "05.  90   |   100 yds   |   12 hits",
      "06.  95   |   100 yds   |   8 hits",
      "07.  95   |   100 yds   |   8 hits",
      "08.  95   |   100 yds   |   8 hits",
      "09.  80   |   100 yds   |   4 hits"
    ];

    roundRect(ctx, 115, 988, 850, 54, 16, "#6f87a8", null);

    ctx.font = "bold 28px Arial";
    rows.forEach((row, i) => {
      const y = 1026 + i * 56;
      ctx.fillStyle = text;
      ctx.fillText(row, 150, y);
    });

    ctx.textAlign = "center";
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = muted;
    ctx.fillText("SCZN3", 700, 1725);

    return canvas.toDataURL("image/png");
  }

  function goToReport() {
    const payload = loadPayload();
    if (!payload) return;

    const metrics = computeMetrics(payload);
    if (!metrics) return;

    const img = buildCard(metrics);

    if (secCardImg) {
      secCardImg.src = img;
    }

    viewPrecision.classList.remove("viewOn");
    viewReport.classList.add("viewOn");
  }

  function goBack() {
    viewReport.classList.remove("viewOn");
    viewPrecision.classList.add("viewOn");
  }

  if (toReportBtn) {
    toReportBtn.onclick = goToReport;
  }

  if (backBtn) {
    backBtn.onclick = goBack;
  }
})();
