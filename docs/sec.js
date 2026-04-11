/* ============================================================
   docs/sec.js — FULL REPLACEMENT (VISUAL REPORT CARD UPGRADE)
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
    const aim = payload.aim;
    const hits = payload.hits;

    if (!aim || !hits?.length) return null;

    let cx = 0, cy = 0;
    hits.forEach(h => {
      cx += h.x01;
      cy += h.y01;
    });

    cx /= hits.length;
    cy /= hits.length;

    const dx = cx - aim.x01;
    const dy = cy - aim.y01;

    const dist = Math.sqrt(dx*dx + dy*dy);

    const score = Math.max(0, Math.round(100 - (dist * 200)));

    return {
      score,
      windage: Math.abs(dx * 100).toFixed(2),
      windageDir: dx > 0 ? "RIGHT" : "LEFT",
      elevation: Math.abs(dy * 100).toFixed(2),
      elevationDir: dy > 0 ? "DOWN" : "UP",
      hits: hits.length
    };
  }

  function buildCard(metrics) {
    const { score, windage, windageDir, elevation, elevationDir, hits } = metrics;

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 600;

    const ctx = canvas.getContext("2d");

    // background
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.fillText("SEC REPORT", 40, 60);

    // score
    ctx.font = "bold 120px Arial";
    ctx.fillStyle = "#ff3b3b";
    ctx.fillText(score, 380, 200);

    // status
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#ff3b3b";
    ctx.fillText(score < 60 ? "NEEDS WORK" : "GOOD", 380, 250);

    // windage
    ctx.font = "28px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Windage: ${windage} ${windageDir}`, 100, 350);

    // elevation
    ctx.fillText(`Elevation: ${elevation} ${elevationDir}`, 100, 400);

    // hits
    ctx.fillText(`Hits: ${hits}`, 100, 450);

    // footer
    ctx.font = "20px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText("SCZN3", 40, 560);

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
