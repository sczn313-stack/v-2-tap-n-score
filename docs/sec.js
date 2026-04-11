/* ============================================================
   docs/sec.js — FULL REPLACEMENT (SEC + REPORT IMAGE FIX)
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const scoreValue = $("scoreValue");
  const scoreBand = $("scoreBand");

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

  const KEY_RESULTS = "sczn3_results";

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

    const windageDirection = dx > 0 ? "LEFT" : "RIGHT";
    const elevationDirection = dy > 0 ? "UP" : "DOWN";

    const score = Math.max(0, 100 - Math.round((Math.abs(dx) + Math.abs(dy)) * 200));

    return {
      score,
      windageClicks,
      windageDirection,
      elevationClicks,
      elevationDirection,
      shotCount: hits.length
    };
  }

  function render(payload, result) {
    if (!result) return;

    scoreValue.textContent = result.score;
    scoreBand.textContent = result.score >= 70 ? "GOOD" : "ADJUST";

    windageBig.textContent = result.windageClicks;
    windageDir.textContent = result.windageDirection;

    elevationBig.textContent = result.elevationClicks;
    elevationDir.textContent = result.elevationDirection;

    runDistance.textContent = "100 yds";
    runHits.textContent = `${result.shotCount} hits`;
    runTime.textContent = "Session ready";
  }

  /* 🔥 IMAGE GENERATOR */
  function generateCard(result) {
    if (!secCardImg || !result) return;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;

    const ctx = canvas.getContext("2d");

    // background
    ctx.fillStyle = "#0b0f1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // text color
    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 48px Arial";
    ctx.fillText(`Score: ${result.score}`, 40, 80);

    ctx.font = "28px Arial";
    ctx.fillText(`Windage: ${result.windageClicks} ${result.windageDirection}`, 40, 180);
    ctx.fillText(`Elevation: ${result.elevationClicks} ${result.elevationDirection}`, 40, 240);

    ctx.font = "20px Arial";
    ctx.fillText(`SCZN3`, 40, 320);

    const imgURL = canvas.toDataURL("image/png");
    secCardImg.src = imgURL;
  }

  function init() {
    const payload = loadPayload();
    const result = compute(payload);

    render(payload, result);

    if (toReportBtn) {
      toReportBtn.onclick = () => {
        viewPrecision.classList.remove("viewOn");
        viewReport.classList.add("viewOn");

        // 🔥 GENERATE IMAGE ON ENTRY
        generateCard(result);
      };
    }

    if (backBtn) {
      backBtn.onclick = () => {
        viewReport.classList.remove("viewOn");
        viewPrecision.classList.add("viewOn");
      };
    }

    if (goHomeBtn) {
      goHomeBtn.onclick = () => {
        window.location.href = "index.html";
      };
    }
  }

  init();
})();
