/* ============================================================
   docs/sec.js — FULL REPLACEMENT (THUMB + META FIX)
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_IMG = "SCZN3_TARGET_IMG_DATAURL_V1";

  function loadPayload() {
    try {
      const raw = localStorage.getItem(KEY_PAYLOAD);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function renderNoData() {
    $("scoreValue").textContent = "—";
    $("scoreBand").textContent = "NO DATA";
    $("scoreBand").className = "scoreBand scoreBandNeutral";
    $("corrClicksInline").textContent = "—";
    $("sessionMeta").textContent = "No session data";
  }

  function renderPayload(p) {
    if (!p) return;

    const score = Number(p.score ?? 0);
    $("scoreValue").textContent = p.score ?? "—";

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

    const elevationClicks = Number(p?.elevation?.clicks ?? 0);
    const elevationDir = String(p?.elevation?.dir ?? "");
    const windageClicks = Number(p?.windage?.clicks ?? 0);
    const windageDir = String(p?.windage?.dir ?? "");

    const elevText = `${elevationClicks % 1 === 0 ? elevationClicks : elevationClicks.toFixed(2)}${elevationDir ? directionArrow(elevationDir) : ""}`;
    const windText = `${windageClicks % 1 === 0 ? windageClicks : windageClicks.toFixed(2)}${windageDir ? directionArrow(windageDir) : ""}`;

    $("corrClicksInline").textContent = `Clicks ${elevText} • ${windText}`;

    const distanceYds = p?.debug?.distanceYds ?? "—";
    const hits = p?.shots ?? "—";
    $("sessionMeta").textContent = `${distanceYds} yds • ${hits} hits`;
  }

  function directionArrow(dir) {
    const d = String(dir || "").toUpperCase();
    if (d === "UP") return "↑";
    if (d === "DOWN") return "↓";
    if (d === "LEFT") return "←";
    if (d === "RIGHT") return "→";
    return "";
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

  function init() {
    const payload = loadPayload();

    if (!payload) {
      renderNoData();
    } else {
      renderPayload(payload);
    }

    renderThumbnail();
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
