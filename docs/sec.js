/* ============================================================
   docs/sec.js — FULL REPLACEMENT
   Purpose:
   - Read payload from URL or localStorage
   - Render SEC page 1
   - Generate report image on page 2
   - Keep vendor wiring working
   - Save and render Shooter History
   - Remove duplicate/raw history rendering
============================================================ */

(() => {
  function init() {
    const $ = (id) => document.getElementById(id);

    const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
    const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";
    const KEY_VENDOR_NAME = "SCZN3_VENDOR_NAME_V1";
    const HISTORY_KEY = "SCZN3_SEC_HISTORY_V1";
    const HISTORY_LIMIT = 10;

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

    const historyList = $("historyList");
    const historyEmpty = $("historyEmpty");

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

      scoreBand.classList.remove(
        "scoreBandNeutral",
        "scoreBandGood",
        "scoreBandMid",
        "scoreBandLow"
      );

      const n = Number(score);

      if (!Number.isFinite(n)) {
        scoreBand.classList.add("scoreBandNeutral");
      } else if (n >= 90) {
        scoreBand.classList.add("scoreBandGood");
      } else if (n >= 60) {
        scoreBand.classList.add("scoreBandMid");
      } else {
        scoreBand.classList.add("scoreBandLow");
      }
    }

    function renderNoData() {
      if (scoreValue) scoreValue.textContent = "—";
      if (scoreBand) {
        scoreBand.textContent = "SEC data not found";
        scoreBand.className = "scoreBand scoreBandNeutral";
      }
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
      const shots =
        Number(payload?.shots) ||
        Number(payload?.hits) ||
        0;
      const windage = payload?.windage || {};
      const elevation = payload?.elevation || {};
      const dial = payload?.dial || {};
      const distanceYds =
        Number(payload?.debug?.distanceYds) ||
        Number(payload?.distanceYds) ||
        Number(payload?.distance) ||
        0;

      if (scoreValue) {
        scoreValue.textContent = Number.isFinite(score) ? String(Math.round(score)) : "—";
      }

      if (scoreBand) {
        scoreBand.textContent = getBand(score);
        setBandClass(score);
      }

      if (windageBig) windageBig.textContent = formatClicks(windage.clicks);
      if (windageDir) windageDir.textContent = windage.dir || "—";

      if (elevationBig) elevationBig.textContent = formatClicks(elevation.clicks);
      if (elevationDir) elevationDir.textContent = elevation.dir || "—";

      if (runDistance) {
        runDistance.textContent = distanceYds ? `${distanceYds} yds` : "—";
      }

      if (runHits) {
        runHits.textContent = shots ? `${shots} hits` : "0 hits";
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
      const shots =
        Number(payload?.shots) ||
        Number(payload?.hits) ||
        0;
      const distanceYds =
        Number(payload?.debug?.distanceYds) ||
        Number(payload?.distanceYds) ||
        Number(payload?.distance) ||
        0;
      const dial = payload?.dial || {};

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
          <rect width="1200" height="1600" fill="#05070b"/>
          <text x="600" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" fill="#ffffff">SEC</text>
          <text x="600" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#a9b5c8">Shooter Experience Card</text>

          <rect x="120" y="270" width="960" height="220" rx="28" fill="#111821" stroke="#223042"/>
          <text x="600" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#90a0b8">SCORE</text>
          <text x="600" y="435" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="700" fill="#ffffff">${Number.isFinite(score) ? Math.round(score) : "—"}</text>

          <rect x="120" y="550" width="450" height="240" rx="28" fill="#111821" stroke="#223042"/>
          <text x="345" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#90a0b8">WINDAGE</text>
          <text x="345" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="76" font-weight="700" fill="#ffffff">${formatClicks(windage.clicks)}</text>
          <text x="345" y="760" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#d9e2ef">${windage.dir || "—"}</text>

          <rect x="630" y="550" width="450" height="240" rx="28" fill="#111821" stroke="#223042"/>
          <text x="855" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#90a0b8">ELEVATION</text>
          <text x="855" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="76" font-weight="700" fill="#ffffff">${formatClicks(elevation.clicks)}</text>
          <text x="855" y="760" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#d9e2ef">${elevation.dir || "—"}</text>

          <rect x="120" y="860" width="960" height="220" rx="28" fill="#111821" stroke="#223042"/>
          <text x="240" y="940" font-family="Arial, sans-serif" font-size="32" fill="#90a0b8">DISTANCE</text>
          <text x="240" y="1010" font-family="Arial, sans-serif" font-size="54" fill="#ffffff">${distanceYds ? `${distanceYds} yds` : "—"}</text>

          <text x="540" y="940" font-family="Arial, sans-serif" font-size="32" fill="#90a0b8">HITS</text>
          <text x="540" y="1010" font-family="Arial, sans-serif" font-size="54" fill="#ffffff">${shots || "0"}</text>

          <text x="810" y="940" font-family="Arial, sans-serif" font-size="32" fill="#90a0b8">DIAL</text>
          <text x="810" y="1010" font-family="Arial, sans-serif" font-size="54" fill="#ffffff">${
            dial.unit && Number.isFinite(Number(dial.clickValue))
              ? `${Number(dial.clickValue).toFixed(2)} ${dial.unit}`
              : "—"
          }</text>

          <text x="600" y="1450" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#8191a6">SCZN3 • Tap-n-Score</text>
        </svg>
      `.trim();

      secCardImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function loadHistory() {
      try {
        const raw = localStorage.getItem(HISTORY_KEY) || "[]";
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function normalizePayload(payload) {
      return {
        score: Number(payload?.score) || 0,
        shots: Number(payload?.shots) || Number(payload?.hits) || 0,
        distance:
          Number(payload?.debug?.distanceYds) ||
          Number(payload?.distanceYds) ||
          Number(payload?.distance) ||
          0,
        windageClicks: Number(payload?.windage?.clicks || 0).toFixed(2),
        windageDir: String(payload?.windage?.dir || "—"),
        elevationClicks: Number(payload?.elevation?.clicks || 0).toFixed(2),
        elevationDir: String(payload?.elevation?.dir || "—"),
        ts: Date.now()
      };
    }

    function isSameHistoryEntry(a, b) {
      if (!a || !b) return false;

      return (
        String(a.score) === String(b.score) &&
        String(a.shots) === String(b.shots) &&
        String(a.distance) === String(b.distance) &&
        String(a.windageClicks) === String(b.windageClicks) &&
        String(a.windageDir) === String(b.windageDir) &&
        String(a.elevationClicks) === String(b.elevationClicks) &&
        String(a.elevationDir) === String(b.elevationDir)
      );
    }

    function saveToHistory(payload) {
      try {
        const history = loadHistory().filter((item) => {
          return (
            item &&
            typeof item === "object" &&
            Number.isFinite(Number(item.score)) &&
            Number.isFinite(Number(item.distance || item.distanceYds || 0))
          );
        });

        const clean = normalizePayload(payload);

        if (history.length && isSameHistoryEntry(history[0], clean)) {
          return;
        }

        history.unshift(clean);

        localStorage.setItem(
          HISTORY_KEY,
          JSON.stringify(history.slice(0, HISTORY_LIMIT))
        );
      } catch {}
    }

    function formatHistoryTime(ts) {
      try {
        return new Date(ts).toLocaleString([], {
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        });
      } catch {
        return "";
      }
    }

    function renderHistory() {
      if (!historyList) return;

      const history = loadHistory().filter((item) => {
        return item && typeof item === "object";
      });

      if (!history.length) {
        historyList.innerHTML = "";
        if (historyEmpty) historyEmpty.style.display = "";
        return;
      }

      if (historyEmpty) historyEmpty.style.display = "none";

      historyList.innerHTML = history
        .map((item, index) => {
          const scoreText = Number.isFinite(Number(item.score))
            ? Math.round(Number(item.score))
            : "—";
          const shotsText = Number.isFinite(Number(item.shots))
            ? `${Number(item.shots)} hits`
            : "0 hits";
          const distanceText = Number.isFinite(Number(item.distance))
            ? `${Number(item.distance)} yds`
            : "—";
          const stampText = item.ts ? formatHistoryTime(item.ts) : "";

          return `
            <div class="historyRow" data-history-index="${index}">
              <div class="historyLeft">
                <div class="historyIndex">${String(index + 1).padStart(2, "0")}.</div>
                <div class="historyMain">
                  <div class="historyTop">
                    <span class="historyScore">${scoreText}</span>
                    <span class="historySep">|</span>
                    <span class="historyDistance">${distanceText}</span>
                    <span class="historySep">|</span>
                    <span class="historyHits">${shotsText}</span>
                  </div>
                  <div class="historyBottom">
                    <span>${item.windageClicks} ${item.windageDir}</span>
                    <span class="historySep">•</span>
                    <span>${item.elevationClicks} ${item.elevationDir}</span>
                    <span class="historySep">•</span>
                    <span>${stampText}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
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
      renderHistory();
      return;
    }

    renderPayload(payload);
    wireVendor(payload);
    wireActions(payload);
    saveToHistory(payload);
    renderHistory();
    showPrecision();
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
