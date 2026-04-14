/* ============================================================
   docs/sec.js — FULL REPLACEMENT (THUMB FIX)
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
    $("corrClicksInline").textContent = "—";
    $("sessionMeta").textContent = "No session data";
  }

  function renderPayload(p) {
    if (!p) return;

    $("scoreValue").textContent = p.score ?? "—";

    const band = $("scoreBand");
    if (p.score >= 90) {
      band.textContent = "EXCELLENT";
      band.className = "scoreBand scoreBandGood";
    } else if (p.score >= 60) {
      band.textContent = "SOLID";
      band.className = "scoreBand scoreBandMid";
    } else {
      band.textContent = "NEEDS WORK";
      band.className = "scoreBand scoreBandBad";
    }

    $("corrClicksInline").textContent =
      `Clicks ${p.elevationClicks || 0}${p.elevationDir || ""} • ${p.windageClicks || 0}${p.windageDir || ""}`;

    $("sessionMeta").textContent =
      `${p.distanceYards || "—"} yds • ${p.hits || "—"} hits`;
  }

  function renderThumbnail() {
    const img = $( "reportThumb" );
    if (!img) return;

    const dataUrl = localStorage.getItem(KEY_IMG);

    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = "block";
    } else {
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
