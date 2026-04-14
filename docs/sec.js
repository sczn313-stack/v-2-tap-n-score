/* ============================================================
   docs/sec.js — FULL REPLACEMENT (IMAGE + HISTORY + TIMESTAMP)
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_IMG = "SCZN3_TARGET_IMG_DATAURL_V1";
  const KEY_HISTORY = "SCZN3_SEC_HISTORY_V1";

  // ------------------------------------------------------------
  // LOAD
  // ------------------------------------------------------------
  function loadPayload() {
    try {
      const raw = localStorage.getItem(KEY_PAYLOAD);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(KEY_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
    } catch {}
  }

  // ------------------------------------------------------------
  // TIME FORMAT
  // ------------------------------------------------------------
  function formatTimestamp(ts) {
    try {
      const d = new Date(ts);
      const date = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const time = d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit"
      });
      return `${date} • ${time}`;
    } catch {
      return "";
    }
  }

  // ------------------------------------------------------------
  // NO DATA
  // ------------------------------------------------------------
  function renderNoData() {
    $("scoreValue").textContent = "—";
    $("scoreBand").textContent = "NO DATA";
    $("scoreBand").className = "scoreBand scoreBandNeutral";
    $("corrClicksInline").textContent = "—";
    $("sessionMeta").textContent = "No session data";
  }

  function directionArrow(dir) {
    const d = String(dir || "").toUpperCase();
    if (d === "UP") return "↑";
    if (d === "DOWN") return "↓";
    if (d === "LEFT") return "←";
    if (d === "RIGHT") return "→";
    return "";
  }

  // ------------------------------------------------------------
  // RENDER PAYLOAD
  // ------------------------------------------------------------
  function renderPayload(p) {
    if (!p) return;

    const score = Number(p.score ?? 0);
    $("scoreValue").textContent = String(p.score ?? "—");

    const band = $("scoreBand");
    if (score >= 90) {
      band.textContent = "STRONG";
      band.className = "scoreBand scoreBandGood";
    } else if (score >= 60) {
      band.textContent = "SOLID";
      band.className = "scoreBand scoreBandMid";
    } else {
      band.textContent = "NEEDS WORK";
      band.className = "scoreBand scoreBandBad";
    }

    const elev = p?.elevation || {};
    const wind = p?.windage || {};

    const elevText = `${Math.round(elev.clicks || 0)}${directionArrow(elev.dir)}`;
    const windText = `${Math.round(wind.clicks || 0)}${directionArrow(wind.dir)}`;

    $("corrClicksInline").textContent = `Clicks ${elevText} • ${windText}`;

    const distanceYds = p?.debug?.distanceYds ?? "—";
    const hits = p?.shots ?? "—";
    const ts = formatTimestamp(p.timestamp);

    $("sessionMeta").textContent = `${distanceYds} yds • ${hits} hits • ${ts}`;
  }

  // ------------------------------------------------------------
  // THUMBNAIL
  // ------------------------------------------------------------
  function renderThumbnail() {
    const img = $("reportThumb");
    if (!img) return;

    const dataUrl = localStorage.getItem(KEY_IMG);

    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = "block";
    } else {
      img.removeAttribute("src");
      img.style.display = "none";
    }
  }

  // ------------------------------------------------------------
  // HISTORY (NEWEST = TOP, COUNT 01 TOP)
  // ------------------------------------------------------------
  function updateHistory(payload) {
    if (!payload) return;

    let history = loadHistory();

    const entry = {
      score: payload.score,
      hits: payload.shots,
      timestamp: payload.timestamp
    };

    // add newest to FRONT
    history.unshift(entry);

    // cap at 10
    if (history.length > 10) {
      history = history.slice(0, 10);
    }

    saveHistory(history);
    return history;
  }

  function renderHistory(history) {
    const grid = $("historyGrid");
    const empty = $("historyEmpty");

    if (!grid || !empty) return;

    grid.innerHTML = "";

    if (!history || history.length === 0) {
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    history.forEach((item, index) => {
      const displayIndex = String(index + 1).padStart(2, "0");
      const ts = formatTimestamp(item.timestamp);

      const cell = document.createElement("div");
      cell.className = "historyCell";

      cell.innerHTML = `
        <div class="historyTop">
          <span class="historyIndex">${displayIndex}</span>
          <span class="historyValue">${item.score}</span>
          <span class="historyHits">${item.hits}</span>
        </div>
        <div class="historyBottom">
          <span class="historySoft">${ts}</span>
        </div>
      `;

      grid.appendChild(cell);
    });
  }

  // ------------------------------------------------------------
  // IMAGE EXPORT (UNCHANGED CORE)
  // ------------------------------------------------------------
  async function buildSECImageBlob() {
    const thumbSrc = localStorage.getItem(KEY_IMG);

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#06070a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // simple export (uses existing UI text)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Arial";
    ctx.fillText($("scoreValue").textContent, 100, 120);

    ctx.font = "28px Arial";
    ctx.fillText($("corrClicksInline").textContent, 100, 200);
    ctx.fillText($("sessionMeta").textContent, 100, 260);

    if (thumbSrc) {
      const img = new Image();
      await new Promise((res) => {
        img.onload = res;
        img.src = thumbSrc;
      });
      ctx.drawImage(img, 100, 320, 1000, 900);
    }

    return await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
  }

  async function saveSEC() {
    try {
      const blob = await buildSECImageBlob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "SEC-Card.png";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      alert("Save failed.");
    }
  }

  function goHome() {
    window.location.href = "./?fresh=" + Date.now();
  }

  // ------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------
  function init() {
    const payload = loadPayload();

    if (!payload) {
      renderNoData();
      renderThumbnail();
      renderHistory([]);
      return;
    }

    // ensure timestamp exists
    if (!payload.timestamp) {
      payload.timestamp = new Date().toISOString();
    }

    renderPayload(payload);
    renderThumbnail();

    const history = updateHistory(payload);
    renderHistory(history);

    $("saveSecBtn")?.addEventListener("click", saveSEC);
    $("goHomeBtn")?.addEventListener("click", goHome);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
