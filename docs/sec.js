(() => {
  function init() {
    const $ = (id) => document.getElementById(id);

    const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
    const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";
    const KEY_VENDOR_NAME = "SCZN3_VENDOR_NAME_V1";
    const HISTORY_KEY = "SCZN3_SEC_HISTORY_V1";
    const HISTORY_LIMIT = 6;

    const scoreValue = $("scoreValue");
    const scoreBand = $("scoreBand");
    const vendorBtn = $("vendorBtn");
    const vendorText = $("vendorText");

    const corrClicksInline = $("corrClicksInline");
    const sessionMeta = $("sessionMeta");

    const historyGrid = $("historyGrid");
    const historyEmpty = $("historyEmpty");

    const surveyBtn = $("surveyBtn");
    const saveSecBtn = $("saveSecBtn");
    const goHomeBtn = $("goHomeBtn");

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
      return loadPayloadFromStorage();
    }

    function isBaker(url) {
      return (url || "").toLowerCase().includes("baker");
    }

    function titleCase(text) {
      return String(text || "")
        .toLowerCase()
        .replace(/\b[a-z]/g, (m) => m.toUpperCase());
    }

    function displayScore(score) {
      const n = Number(score);
      return Number.isFinite(n) ? Math.round(n) : null;
    }

    function getBand(score) {
      const n = Number(score);
      if (!Number.isFinite(n)) return "—";
      if (n >= 90) return "Strong";
      if (n >= 60) return "Solid";
      return "Needs Work";
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

    function normalizeDir(dir) {
      return String(dir || "").trim().toUpperCase();
    }

    function dirArrow(dir) {
      const d = normalizeDir(dir);
      if (d === "UP") return "↑";
      if (d === "DOWN") return "↓";
      if (d === "LEFT") return "←";
      if (d === "RIGHT") return "→";
      return "";
    }

    function dirWordAbbr(dir) {
      const d = normalizeDir(dir);
      if (d === "UP") return "UP";
      if (d === "DOWN") return "DN";
      if (d === "LEFT") return "LT";
      if (d === "RIGHT") return "RT";
      return "";
    }

    function roundedClicks(value) {
      const n = Number(value);
      return Number.isFinite(n) ? Math.round(n) : 0;
    }

    function compactClicksText(elevationClicks, elevationDir, windageClicks, windageDir) {
      return `Clicks ${roundedClicks(elevationClicks)}${dirArrow(elevationDir)} • ${roundedClicks(windageClicks)}${dirArrow(windageDir)}`;
    }

    function resolveDistance(payload) {
      const distance =
        Number(payload?.debug?.distanceYds) ||
        Number(payload?.distanceYds) ||
        Number(payload?.distance) ||
        0;

      return Number.isFinite(distance) && distance > 0 ? Math.round(distance) : 0;
    }

    function resolveHits(payload) {
      const shots = Number(payload?.shots);
      const hits = Number(payload?.hits);

      if (Number.isFinite(shots) && shots >= 0) return Math.round(shots);
      if (Number.isFinite(hits) && hits >= 0) return Math.round(hits);
      return 0;
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

      if (!vendorName && isBaker(vendorUrl)) {
        vendorName = "Baker";
      }

      payload.vendorUrl = vendorUrl;
      payload.vendorName = vendorName;

      return { vendorUrl, vendorName };
    }

    function tutorialText(score, elevationDir, windageDir) {
      const dirs = [dirWordAbbr(elevationDir), dirWordAbbr(windageDir)].filter(Boolean).join(" and ");

      if (score >= 99) return "Zero confirmed — maintain hold";
      if (score >= 90) return dirs ? `Hold steady ${dirs}` : "Hold steady and confirm";
      if (score >= 60) return dirs ? `Refine aim ${dirs}` : "Refine aim and tighten";
      return dirs ? `Shift impacts ${dirs}` : "Shift impacts to center";
    }

    function renderNoData() {
      if (scoreValue) scoreValue.textContent = "—";
      if (scoreBand) {
        scoreBand.textContent = "SEC data not found";
        setBandClass(null);
      }

      if (corrClicksInline) corrClicksInline.textContent = "—";
      if (sessionMeta) sessionMeta.textContent = "—";

      if (vendorText) vendorText.textContent = "Vendor Not Set";
      if (vendorBtn) {
        vendorBtn.href = "#";
        vendorBtn.classList.add("vendorDisabled");
      }

      if (surveyBtn) {
        surveyBtn.href = "#";
        surveyBtn.style.pointerEvents = "none";
        surveyBtn.style.opacity = ".6";
      }
    }

    function renderVendor(payload) {
      const { vendorUrl, vendorName } = resolveVendor(payload);

      if (!vendorBtn || !vendorText) return;

      if (vendorUrl && vendorUrl.startsWith("http")) {
        vendorBtn.href = vendorUrl;
        vendorBtn.classList.remove("vendorDisabled");
        vendorText.textContent = vendorName
          ? `Visit ${titleCase(vendorName)}`
          : "Visit Vendor";
      } else {
        vendorBtn.href = "#";
        vendorBtn.classList.add("vendorDisabled");
        vendorText.textContent = "Vendor Not Set";
      }
    }

    function renderPayload(payload) {
      const rawScore = Number(payload?.score);
      const shownScore = displayScore(rawScore);
      const elevation = payload?.elevation || {};
      const windage = payload?.windage || {};
      const distance = resolveDistance(payload);
      const hits = resolveHits(payload);

      if (scoreValue) {
        scoreValue.textContent = shownScore != null ? String(shownScore) : "—";
      }

      if (scoreBand) {
        scoreBand.textContent = getBand(shownScore);
        setBandClass(shownScore);
      }

      if (corrClicksInline) {
        corrClicksInline.textContent = compactClicksText(
          elevation.clicks,
          elevation.dir,
          windage.clicks,
          windage.dir
        );
      }

      if (sessionMeta) {
        sessionMeta.textContent = `${distance || "—"} yds • ${hits} hits`;
      }
    }

    function normalizeHistoryEntry(payload) {
      const rawScore = Number(payload?.score);
      const shownScore = displayScore(rawScore);
      const distance = resolveDistance(payload);
      const hits = resolveHits(payload);

      return {
        score: shownScore != null ? shownScore : 0,
        distance,
        hits,
        elevationClicks: roundedClicks(payload?.elevation?.clicks),
        elevationDir: normalizeDir(payload?.elevation?.dir),
        windageClicks: roundedClicks(payload?.windage?.clicks),
        windageDir: normalizeDir(payload?.windage?.dir),
        ts: Date.now()
      };
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

    function isSameHistoryEntry(a, b) {
      if (!a || !b) return false;

      return (
        String(a.score) === String(b.score) &&
        String(a.distance) === String(b.distance) &&
        String(a.hits) === String(b.hits) &&
        String(a.elevationClicks) === String(b.elevationClicks) &&
        String(a.elevationDir) === String(b.elevationDir) &&
        String(a.windageClicks) === String(b.windageClicks) &&
        String(a.windageDir) === String(b.windageDir)
      );
    }

    function saveToHistory(payload) {
      try {
        const entry = normalizeHistoryEntry(payload);
        const history = loadHistory().filter((item) => {
          return (
            item &&
            typeof item === "object" &&
            Number.isFinite(Number(item.score)) &&
            Number.isFinite(Number(item.distance)) &&
            Number.isFinite(Number(item.hits))
          );
        });

        if (history.length && isSameHistoryEntry(history[0], entry)) {
          return;
        }

        history.unshift(entry);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
      } catch {}
    }

    function formatHistoryTime24(ts) {
      try {
        return new Date(ts).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
      } catch {
        return "";
      }
    }

    function getScoreClass(score) {
      if (score >= 90) return "historyScoreHigh";
      if (score >= 60) return "historyScoreMid";
      return "historyScoreLow";
    }

    function historyCellHtml(item, index) {
      if (!item) return `<div class="historyCell"></div>`;

      const stamp = item.ts ? formatHistoryTime24(item.ts) : "";
      const scoreClass = getScoreClass(Number(item.score));
      const tutorial = tutorialText(item.score, item.elevationDir, item.windageDir);

      return `
        <div class="historyCell">
          <div class="historyTop">
            <span class="historyIndex">${String(index + 1).padStart(2, "0")}.</span>
            <span class="${scoreClass}">${item.score}</span>
            <span class="historySoft">|</span>
            <span class="historyValue">${item.distance}</span>
            <span class="historySoft">|</span>
            <span class="historyHits">${item.hits}</span>
          </div>
          <div class="historyBottom">
            <span class="historyValue">${item.elevationClicks}${dirArrow(item.elevationDir)} ${item.windageClicks}${dirArrow(item.windageDir)}</span>
            <span class="historySoft">${stamp}</span>
          </div>
          <div class="historyTutorial">${tutorial}</div>
        </div>
      `;
    }

    function renderHistory() {
      if (!historyGrid) return;

      const history = loadHistory().filter((item) => item && typeof item === "object");

      if (!history.length) {
        historyGrid.innerHTML = "";
        if (historyEmpty) historyEmpty.style.display = "";
        return;
      }

      if (historyEmpty) historyEmpty.style.display = "none";

      const limited = history.slice(0, HISTORY_LIMIT);
      let html = "";

      for (let i = 0; i < limited.length; i += 2) {
        html += historyCellHtml(limited[i], i);
        html += historyCellHtml(limited[i + 1], i + 1);
      }

      historyGrid.innerHTML = html;
    }

    function drawRoundRect(ctx, x, y, w, h, r, fillStyle, strokeStyle) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();

      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }

      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    function canvasToBlob(canvas) {
      return new Promise((resolve) => {
        if (canvas.toBlob) {
          canvas.toBlob((blob) => resolve(blob), "image/png");
          return;
        }

        try {
          const dataUrl = canvas.toDataURL("image/png");
          fetch(dataUrl).then((r) => r.blob()).then(resolve).catch(() => resolve(null));
        } catch {
          resolve(null);
        }
      });
    }

    async function buildExportImage(payload) {
      const rawScore = Number(payload?.score);
      const score = displayScore(rawScore);
      const compactText = compactClicksText(
        payload?.elevation?.clicks,
        payload?.elevation?.dir,
        payload?.windage?.clicks,
        payload?.windage?.dir
      );
      const distance = resolveDistance(payload);
      const hits = resolveHits(payload);
      const metaText = `${distance || "—"} yds • ${hits} hits`;

      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1600;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");

      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, "#0a1224");
      bg.addColorStop(0.24, "#09101b");
      bg.addColorStop(1, "#06070a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const glow = ctx.createRadialGradient(600, 140, 60, 600, 140, 420);
      glow.addColorStop(0, "rgba(47,102,255,0.16)");
      glow.addColorStop(1, "rgba(47,102,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = "left";
      ctx.font = "1000 72px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillStyle = "#ff5a58";
      ctx.fillText("S", 120, 132);
      ctx.fillStyle = "#eef2f7";
      ctx.fillText("E", 180, 132);
      ctx.fillStyle = "#3b6cff";
      ctx.fillText("C", 236, 132);

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(238,242,247,.72)";
      ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("SHOOTER EXPERIENCE CARD", 1080, 132);

      drawRoundRect(ctx, 120, 210, 960, 280, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)");
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(238,242,247,.72)";
      ctx.font = "900 28px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("SMART SCORE", 600, 286);

      ctx.fillStyle = "#eef2f7";
      ctx.font = "1000 160px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(score != null ? String(score) : "—", 600, 416);

      drawRoundRect(ctx, 120, 540, 960, 220, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)");
      ctx.fillStyle = "rgba(238,242,247,.72)";
      ctx.font = "900 28px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("CORRECTION", 600, 610);

      drawRoundRect(ctx, 160, 646, 880, 92, 22, "rgba(255,255,255,.04)", "rgba(255,255,255,.08)");
      ctx.fillStyle = "#eef2f7";
      ctx.font = "1000 54px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(compactText, 600, 704);

      drawRoundRect(ctx, 270, 810, 660, 84, 22, "rgba(255,255,255,.045)", "rgba(255,255,255,.08)");
      ctx.fillStyle = "#eef2f7";
      ctx.font = "1000 34px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(metaText, 600, 866);

      drawRoundRect(ctx, 120, 948, 960, 190, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)");
      ctx.fillStyle = "rgba(238,242,247,.72)";
      ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("OFFICIAL TARGET PARTNER", 600, 1018);

      drawRoundRect(ctx, 270, 1048, 660, 64, 20, "rgba(255,255,255,.04)", "rgba(255,255,255,.08)");
      ctx.fillStyle = "rgba(238,242,247,.78)";
      ctx.font = "1000 30px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("Official Target Partner", 600, 1090);

      ctx.fillStyle = "rgba(238,242,247,.46)";
      ctx.font = "900 26px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("SCZN3 • Tap-n-Score", 600, 1460);

      const dataUrl = canvas.toDataURL("image/png");
      const blob = await canvasToBlob(canvas);

      return { dataUrl, blob };
    }

    async function handleSave(payload) {
      if (!saveSecBtn) return;

      const originalText = saveSecBtn.textContent;
      saveSecBtn.disabled = true;
      saveSecBtn.textContent = "Saving...";

      try {
        const { dataUrl, blob } = await buildExportImage(payload);
        const filename = `sczn3-sec-${Date.now()}.png`;

        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        } else {
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }

        const ua = navigator.userAgent || "";
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        if (isIOS) {
          window.open(dataUrl, "_blank");
        }
      } catch (err) {
        console.error("SEC save failed", err);
        alert("Unable to save SEC right now.");
      } finally {
        saveSecBtn.disabled = false;
        saveSecBtn.textContent = originalText;
      }
    }

    function wireActions(payload) {
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

      saveSecBtn?.addEventListener("click", () => {
        handleSave(payload);
      });

      goHomeBtn?.addEventListener("click", () => {
        window.location.href = "./?v=baker&fresh=" + Date.now();
      });
    }

    const payload = loadPayload();

    if (!payload) {
      renderNoData();
      renderHistory();
      return;
    }

    renderPayload(payload);
    renderVendor(payload);
    saveToHistory(payload);
    renderHistory();
    wireActions(payload);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
