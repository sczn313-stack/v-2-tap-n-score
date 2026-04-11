/* ============================================================
   docs/sec.js — COMMAND TILE UPGRADE
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const viewPrecision = $("viewPrecision");
  const viewReport = $("viewReport");
  const toReportBtn = $("toReportBtn");
  const backBtn = $("backBtn");
  const goHomeBtn = $("goHomeBtn");
  const secCardImg = $("secCardImg");

  const KEY_RESULTS = "sczn3_results";

  function loadPayload() {
    const s = sessionStorage.getItem(KEY_RESULTS) || "";
    try { return JSON.parse(s); } catch { return null; }
  }

  function avg(points, key) {
    return points.reduce((sum, p) => sum + Number(p[key] || 0), 0) / points.length;
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

    const windageDir = dx > 0 ? "RIGHT" : dx < 0 ? "LEFT" : "CENTER";
    const elevationDir = dy > 0 ? "DOWN" : dy < 0 ? "UP" : "CENTER";

    const offset = Math.sqrt(dx * dx + dy * dy);

    const score = Math.max(0, Math.min(100, Math.round(100 - (offset * 120))));

    return {
      score,
      windageClicks,
      windageDir,
      elevationClicks,
      elevationDir,
      hits: hits.length
    };
  }

  function arrowFor(dir) {
    if (dir === "LEFT") return "←";
    if (dir === "RIGHT") return "→";
    if (dir === "UP") return "↑";
    if (dir === "DOWN") return "↓";
    return "•";
  }

  function tileColor(dir) {
    if (dir === "LEFT" || dir === "RIGHT") return "#3b82f6";
    if (dir === "UP" || dir === "DOWN") return "#ef4444";
    return "#64748b";
  }

  function buildCard(result) {
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 1600;

    const ctx = canvas.getContext("2d");

    // background
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // SCORE
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SCORE", 700, 140);

    ctx.font = "bold 180px Arial";
    ctx.fillText(result.score, 700, 320);

    // COMMAND TILES
    const tileWidth = 550;
    const tileHeight = 320;

    // WINDAGE TILE
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(100, 420, tileWidth, tileHeight);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 28px Arial";
    ctx.fillText("WINDAGE", 375, 470);

    ctx.fillStyle = tileColor(result.windageDir);
    ctx.font = "bold 140px Arial";
    ctx.fillText(arrowFor(result.windageDir), 375, 600);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px Arial";
    ctx.fillText(result.windageClicks, 375, 720);

    // ELEVATION TILE
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(750, 420, tileWidth, tileHeight);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 28px Arial";
    ctx.fillText("ELEVATION", 1025, 470);

    ctx.fillStyle = tileColor(result.elevationDir);
    ctx.font = "bold 140px Arial";
    ctx.fillText(arrowFor(result.elevationDir), 1025, 600);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px Arial";
    ctx.fillText(result.elevationClicks, 1025, 720);

    // FOOTER DATA
    ctx.fillStyle = "#94a3b8";
    ctx.font = "28px Arial";
    ctx.fillText(`${result.hits} shots`, 700, 900);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.fillText("SCZN3", 700, 1500);

    return canvas.toDataURL("image/png");
  }

  function goToReport() {
    const payload = loadPayload();
    if (!payload) return;

    const result = compute(payload);
    if (!result) return;

    const img = buildCard(result);

    if (secCardImg) secCardImg.src = img;

    viewPrecision.classList.remove("viewOn");
    viewReport.classList.add("viewOn");
  }

  function goBack() {
    viewReport.classList.remove("viewOn");
    viewPrecision.classList.add("viewOn");
  }

  if (toReportBtn) toReportBtn.onclick = goToReport;
  if (backBtn) backBtn.onclick = goBack;

})();
