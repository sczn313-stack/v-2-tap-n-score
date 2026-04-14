/* ============================================================
   docs/sec.js — FULL REPLACEMENT (HISTORY + YARDS + ALIGNMENT)
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_IMG = "SCZN3_TARGET_IMG_DATAURL_V1";
  const KEY_HISTORY = "SCZN3_SEC_HISTORY_V1";

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
    localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
  }

  function formatDate(ts) {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return "—";
    }
  }

  function directionArrow(dir) {
    const d = String(dir || "").toUpperCase();
    if (d === "UP") return "↑";
    if (d === "DOWN") return "↓";
    if (d === "LEFT") return "←";
    if (d === "RIGHT") return "→";
    return "";
  }

  function renderPayload(p) {
    if (!p) return;

    const score = Number(p.score ?? 0);
    $("scoreValue").textContent = String(score);

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

    const elev = Math.round(Number(p?.elevation?.clicks ?? 0));
    const wind = Math.round(Number(p?.windage?.clicks ?? 0));

    $("corrClicksInline").textContent =
      `Clicks ${elev}${directionArrow(p?.elevation?.dir)} • ${wind}${directionArrow(p?.windage?.dir)}`;

    const yds = p?.debug?.distanceYds ?? "—";
    const hits = p?.shots ?? "—";

    $("sessionMeta").textContent = `${yds} yds • ${hits} hits`;
  }

  function renderThumbnail() {
    const img = $("reportThumb");
    const dataUrl = localStorage.getItem(KEY_IMG);

    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }
  }

  function updateHistory(payload) {
    if (!payload) return;

    const history = loadHistory();

    const entry = {
      score: payload.score ?? 0,
      hits: payload.shots ?? 0,
      yds: payload?.debug?.distanceYds ?? "—",
      ts: Date.now()
    };

    history.unshift(entry);

    const trimmed = history.slice(0, 10);
    saveHistory(trimmed);
  }

  function renderHistory() {
    const wrap = $("historyWrap");
    if (!wrap) return;

    const history = loadHistory();

    wrap.innerHTML = "";

    history.forEach((h, i) => {
      const index = String(i + 1).padStart(2, "0");

      const el = document.createElement("div");
      el.className = "historyCard";

      el.innerHTML = `
        <div class="historyRow">
          <span class="hIndex">${index}</span>
          <span class="hScore">${h.score}</span>
          <span class="hYds">${h.yds}</span>
          <span class="hHits">${h.hits}</span>
        </div>
        <div class="hDate">${formatDate(h.ts)}</div>
      `;

      wrap.appendChild(el);
    });
  }

  function wireActions(payload) {
    $("saveSecBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      alert("SEC Saved");
    });

    $("goHomeBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "./?fresh=" + Date.now();
    });
  }

  function init() {
    const payload = loadPayload();

    renderPayload(payload);
    renderThumbnail();

    updateHistory(payload);
    renderHistory();

    wireActions(payload);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
