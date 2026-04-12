/* ============================================================
   docs/sec.js — FULL REPLACEMENT
   Purpose:
   - Read payload from URL or localStorage
   - Render SEC page 1 with correct existing HTML ids
   - Support page 2 report view buttons
   - Keep Baker vendor wiring working
   - Bind after DOM is ready
============================================================ */

(() => {
  function init() {
    const $ = (id) => document.getElementById(id);

    const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
    const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";
    const KEY_VENDOR_NAME = "SCZN3_VENDOR_NAME_V1";

    const viewPrecision = $("viewPrecision");
    const viewReport = $("viewReport");

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
    const goHomeBtn = $("goHomeBtn");
    const backBtn = $("backBtn");
    const vendorBtn = $("vendorBtn");
    const surveyBtn = $("surveyBtn");
    const secCardImg = $("secCardImg");

    function getUrl() {
      try {
        return new URL(window.location.href);
      } catch {
        return null;
      }
    }

    function getParam(name) {
      const u = getUrl();
      return u ? (u.searchParams.get(name) || "") : "";
    }

    function decodePayloadFromQuery() {
      const raw = getParam("payload");
      if (!raw) return null;

      try {
        const json = decodeURIComponent(escape(atob(raw)));
        return JSON.parse(json);
      } catch {
        return null;
      }
    }

    function loadPayloadFromStorage() {
      try {
        const s = localStorage.getItem(KEY_PAYLOAD) || "";
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    }

    function savePayload(payload) {
      try {
        localStorage.setItem(KEY_PAYLOAD, JSON.stringify(payload));
      } catch {}
    }

    function loadPayload() {
      const fromQuery = decodePayloadFromQuery();
      if (fromQuery) {
        savePayload(fromQuery);
        return fromQuery;
      }

      const fromStorage = loadPayloadFromStorage();
      if (fromStorage) return fromStorage;

      return null;
    }

    function isBaker(url) {
      return (url || "").toLowerCase().includes("baker");
    }

    function resolveVendor(payload) {
      let vendorUrl = String(payload?.vendorUrl || "");
      const vParam = getParam("v").toLowerCase();

      if (!vendorUrl && vParam === "baker") {
        vendorUrl = "https://baker-targets.com/";
      }

      if (!vendorUrl) {
        vendorUrl = String(localStorage.getItem(KEY_VENDOR_URL) || "");
      }

      if (!vendorUrl && vParam === "baker") {
        vendorUrl = "https://baker-targets.com/";
      }

      let vendorName =
        String(payload?.vendorName || "") ||
        String(localStorage.getItem(KEY_VENDOR_NAME) || "");

      if (!vendorName) {
        vendorName = isBaker(vendorUrl) ? "BAKER TARGETS" : "VENDOR";
      }

      payload.vendorUrl = vendorUrl;
      payload.vendorName = vendorName;

      return { vendorUrl, vendorName };
    }

    function showPrecision() {
      viewPrecision?.classList.add("viewOn");
      viewReport?.classList.remove("viewOn");
    }

    function showReport() {
      viewReport?.classList.add("viewOn");
      viewPrecision?.classList.remove("viewOn");
    }

    function formatClicks(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return "—";
      return n.toFixed(2);
    }

    function getBand(score) {
      const n = Number(score);
      if (!Number.isFinite(n)) return "—";
      if (n >= 90) return "STRONG";
      if (n >= 60) return "SOLID";
      return "NEEDS WORK";
    }

    function setBandClass(score) {
      if (!scoreBand) return;
      scoreBand.classList.remove("scoreBandNeutral", "scoreBandGood", "scoreBandMid", "scoreBandLow");

      const n = Number(score);
      if (!Number.isFinite(n)) {
        scoreBand.classList.add("scoreBandNeutral");
        return;
      }
      if (n >= 90) {
        scoreBand.classList.add("scoreBandGood");
        return;
      }
      if (n >= 60) {
        scoreBand.classList.add("scoreBandMid");
        return;
      }
      scoreBand.classList.add("scoreBandLow");
    }

    function renderNoData() {
      if (scoreValue) scoreValue.textContent = "—";
      if (scoreBand) scoreBand.textContent = "SEC data not found";
      if (windageBig) windageBig.textContent = "—";
      if (windageDir) windageDir.textContent = "—";
      if (elevationBig) elevationBig.textContent = "—";
      if (elevationDir) elevationDir.textContent = "—";
      if (runDistance) runDistance.textContent = "—";
      if (runHits) runHits.textContent = "—";
      if (runTime) runTime.textContent = "—";
    }

    function renderPayload(payload) {
      const score = Number(payload?.score);
      const shots = Number(payload?.shots);
      const windage = payload?.windage || {};
      const elevation = payload?.elevation || {};
      const dial = payload?.dial || {};
      const distanceYds = Number(payload?.debug?.distanceYds);

      if (scoreValue) {
        scoreValue.textContent = Number.isFinite(score) ? String(Math.round(score)) : "—";
      }

      if (scoreBand) {
        scoreBand.textContent = getBand(score);
        setBandClass(score);
      }

      if (windageBig) {
        windageBig.textContent = formatClicks(windage.clicks);
      }

      if (windageDir) {
        windageDir.textContent = windage.dir || "—";
      }

      if (elevationBig) {
        elevationBig.textContent = formatClicks(elevation.clicks);
      }

      if (elevationDir) {
        elevationDir.textContent = elevation.dir || "—";
      }

      if (runDistance) {
        runDistance.textContent = Number.isFinite(distanceYds) ? `${distanceYds} yds` : "—";
      }

      if (runHits) {
        runHits.textContent = Number.isFinite(shots) ? `${shots} hits` : "—";
      }

      if (runTime) {
        const unit = String(dial.unit || "");
        const clickValue = Number(dial.clickValue);
        runTime.textContent =
          unit && Number.isFinite(clickValue)
            ? `${clickValue.toFixed(2)} ${unit}`
            : "—";
      }
    }

    function wireVendor(payload) {
      const { vendorUrl, vendorName } = resolveVendor(payload);

      if (!vendorBtn) return;

      if (vendorUrl && vendorUrl.startsWith("http")) {
        vendorBtn.href = vendorUrl;
        vendorBtn.textContent = isBaker(vendorUrl) ? "Visit Baker" : `Visit ${vendorName}`;
        vendorBtn.style.pointerEvents = "auto";
        vendorBtn.style.opacity = "1";
      } else {
        vendorBtn.href = "#";
        vendorBtn.textContent = "Vendor Not Set";
        vendorBtn.style.pointerEvents = "none";
        vendorBtn.style.opacity = ".6";
      }
    }

    function buildReportCard(payload) {
      if (!secCardImg) return;

      const score = Number(payload?.score);
      const windage = payload?.windage || {};
      const elevation = payload?.elevation || {};
      const shots = Number(payload?.shots);
      const distanceYds = Number(payload?.debug?.distanceYds);
      const dial = payload?.dial || {};

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
          <rect width="1200" height="1600" fill="#0b0f14"/>
          <text x="600" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" fill="#ffffff">SEC</text>
          <text x="600" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#b8c2cf">Shooter Experience Card</text>

          <rect x="120" y="270" width="960" height="220" rx="28" fill="#131a22" stroke="#243140"/>
          <text x="600" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#8fa3b8">SCORE</text>
          <text x="600" y="435" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="700" fill="#ffffff">${Number.isFinite(score) ? Math.round(score) : "—"}</text>

          <rect x="120" y="550" width="450" height="240" rx="28" fill="#131a22" stroke="#243140"/>
          <text x="345" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#8fa3b8">WINDAGE</text>
          <text x="345" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="76" font-weight="700" fill="#ffffff">${formatClicks(windage.clicks)}</text>
          <text x="345" y="760" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#d6dfeb">${windage.dir || "—"}</text>

          <rect x="630" y="550" width="450" height="240" rx="28" fill="#131a22" stroke="#243140"/>
          <text x="855" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#8fa3b8">ELEVATION</text>
          <text x="855" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="76" font-weight="700" fill="#ffffff">${formatClicks(elevation.clicks)}</text>
          <text x="855" y="760" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#d6dfeb">${elevation.dir || "—"}</text>

          <rect x="120" y="860" width="960" height="220" rx="28" fill="#131a22" stroke="#243140"/>
          <text x="240" y="940" font-family="Arial, sans-serif" font-size="32" fill="#8fa3b8">DISTANCE</text>
          <text x="240" y="1010" font-family="Arial, sans-serif" font-size="54" fill="#ffffff">${Number.isFinite(distanceYds) ? `${distanceYds} yds` : "—"}</text>

          <text x="540" y="940" font-family="Arial, sans-serif" font-size="32" fill="#8fa3b8">HITS</text>
          <text x="540" y="1010" font-family="Arial, sans-serif" font-size="54" fill="#ffffff">${Number.isFinite(shots) ? shots : "—"}</text>

          <text x="810" y="940" font-family="Arial, sans-serif" font-size="32" fill="#8fa3b8">DIAL</text>
          <text x="810" y="1010" font-family="Arial, sans-serif" font-size="54" fill="#ffffff">${
            dial.unit && Number.isFinite(Number(dial.clickValue))
              ? `${Number(dial.clickValue).toFixed(2)} ${dial.unit}`
              : "—"
          }</text>

          <text x="600" y="1450" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#7f91a5">SCZN3 • Tap-n-Score</text>
        </svg>
      `.trim();

      secCardImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function wireActions(payload) {
      toReportBtn?.addEventListener("click", () => {
        buildReportCard(payload);
        showReport();
      });

      backBtn?.addEventListener("click", () => {
        showPrecision();
      });

      goHomeBtn?.addEventListener("click", () => {
        window.location.href = "./?v=baker&fresh=" + Date.now();
      });

      if (surveyBtn) {
        const surveyUrl = String(payload?.surveyUrl || "");
        if (surveyUrl && surveyUrl.startsWith("http")) {
          surveyBtn.href = surveyUrl;
          surveyBtn.style.pointerEvents = "auto";
          surveyBtn.style.opacity = "1";
        } else {
          surveyBtn.href = "#";
          surveyBtn.style.pointerEvents = "none";
          surveyBtn.style.opacity = ".6";
        }
      }
    }

    const payload = loadPayload();

    if (!payload) {
      renderNoData();
      return;
    }

    renderPayload(payload);
    wireVendor(payload);
    wireActions(payload);
    showPrecision();
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
