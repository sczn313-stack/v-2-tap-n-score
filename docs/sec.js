/* ============================================================
   docs/sec.js — FULL REPLACEMENT (VERIFIED)
   Fixes:
   - history render target mismatch (historyGrid vs historyWrap)
   - empty-state visibility
   - duplicate history entries on refresh
   - keeps score / yards / hits / thumbnail flow intact
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_IMG = "SCZN3_TARGET_IMG_DATAURL_V1";
  const KEY_HISTORY = "SCZN3_SEC_HISTORY_V1";
  const KEY_HISTORY_LAST = "SCZN3_SEC_HISTORY_LAST_V1";

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
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
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

  function getSessionSignature(payload) {
    if (!payload) return "";
    const score = Number(payload?.score ?? 0);
    const hits = Number(payload?.shots ?? 0);
    const yds = String(payload?.debug?.distanceYds ?? "—");
    const elevClicks = Math.round(Number(payload?.elevation?.clicks ?? 0));
    const elevDir = String(payload?.elevation?.dir ?? "");
    const windClicks = Math.round(Number(payload?.windage?.clicks ?? 0));
    const windDir = String(payload?.windage?.dir ?? "");

    return [
      score,
      hits,
      yds,
      elevClicks,
      elevDir,
      windClicks,
      windDir
    ].join("|");
  }

  function renderPayload(p) {
    if (!p) return;

    const score = Number(p.score ?? 0);
    const scoreEl = $("scoreValue");
    const band = $("scoreBand");
    const corr = $("corrClicksInline");
    const meta = $("sessionMeta");

    if (scoreEl) {
      scoreEl.textContent = String(score);
    }

    if (band) {
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
    }

    const elev = Math.round(Number(p?.elevation?.clicks ?? 0));
    const wind = Math.round(Number(p?.windage?.clicks ?? 0));

    if (corr) {
      corr.textContent =
        `Clicks ${elev}${directionArrow(p?.elevation?.dir)} • ${wind}${directionArrow(p?.windage?.dir)}`;
    }

    const yds = p?.debug?.distanceYds ?? "—";
    const hits = p?.shots ?? "—";

    if (meta) {
      meta.textContent = `${yds} yds • ${hits} hits`;
    }
  }

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

  function updateHistory(payload) {
    if (!payload) return;

    const signature = getSessionSignature(payload);
    const lastSignature = localStorage.getItem(KEY_HISTORY_LAST) || "";

    if (signature && signature === lastSignature) {
      return;
    }

    const history = loadHistory();

    const entry = {
      score: Number(payload?.score ?? 0),
      hits: Number(payload?.shots ?? 0),
      yds: payload?.debug?.distanceYds ?? "—",
      ts: Date.now()
    };

    history.unshift(entry);

    const trimmed = history.slice(0, 10);
    saveHistory(trimmed);

    if (signature) {
      localStorage.setItem(KEY_HISTORY_LAST, signature);
    }
  }

  function renderHistory() {
    const grid = $("historyGrid");
    const empty = $("historyEmpty");

    if (!grid) return;

    const history = loadHistory();
    grid.innerHTML = "";

    if (!history.length) {
      if (empty) empty.style.display = "block";
      grid.style.display = "none";
      return;
    }

    if (empty) empty.style.display = "none";
    grid.style.display = "grid";

    history.forEach((h, i) => {
      const index = String(i + 1).padStart(2, "0");

      const card = document.createElement("div");
      card.className = "historyCard";

      card.innerHTML = `
        <div class="historyRow">
          <span class="hIndex">${index}</span>
          <span class="hScore">${h.score}</span>
          <span class="hYds">${h.yds}</span>
          <span class="hHits">${h.hits}</span>
        </div>
        <div class="hDate">${formatDate(h.ts)}</div>
      `;

      grid.appendChild(card);
    });
  }

  function wireActions() {
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
    wireActions();
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
