/* ============================================================
   docs/sec.js — FULL REPLACEMENT
   Reads target-page results and renders SEC
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const scoreValue = $("scoreValue");
  const scoreSub = $("scoreSub");

  const windageValue = $("windageValue");
  const windageSub = $("windageSub");

  const elevationValue = $("elevationValue");
  const elevationSub = $("elevationSub");

  const chip1 = $("chip1");
  const chip2 = $("chip2");
  const chip3 = $("chip3");

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

    const windageDir = dx > 0 ? "LEFT" : dx < 0 ? "RIGHT" : "—";
    const elevationDir = dy > 0 ? "UP" : dy < 0 ? "DOWN" : "—";

    const windageClicks = Math.max(0, Math.round(Math.abs(dx) * 100));
    const elevationClicks = Math.max(0, Math.round(Math.abs(dy) * 100));

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
      windageDir,
      elevationClicks,
      elevationDir,
      shotCount: hits.length,
      meanRadius,
      aimOffset
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
      vendorBtn.textContent = "Vendor";
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
    if (scoreSub) scoreSub.textContent = "Tight cluster + closer to the aim point = higher score.";

    if (windageValue) {
      windageValue.textContent =
        result.windageDir === "—" ? "0" : String(result.windageClicks);
    }
    if (windageSub) {
      windageSub.textContent =
        result.windageDir === "—" ? "CENTERED" : result.windageDir;
    }

    if (elevationValue) {
      elevationValue.textContent =
        result.elevationDir === "—" ? "0" : String(result.elevationClicks);
    }
    if (elevationSub) {
      elevationSub.textContent =
        result.elevationDir === "—" ? "CENTERED" : result.elevationDir;
    }

    if (chip1) chip1.textContent = `${result.shotCount} SHOTS`;
    if (chip2) chip2.textContent = `OFFSET ${result.aimOffset.toFixed(3)}`;
    if (chip3) chip3.textContent = `GROUP ${result.meanRadius.toFixed(3)}`;
  }

  render();
})();
