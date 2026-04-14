/* ============================================================
   docs/sec.js — FULL REPLACEMENT (THUMB + META + ACTION FIX)
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

    const elevationClicks = Number(p?.elevation?.clicks ?? 0);
    const elevationDir = String(p?.elevation?.dir ?? "");
    const windageClicks = Number(p?.windage?.clicks ?? 0);
    const windageDir = String(p?.windage?.dir ?? "");

    const elevRounded = Math.round(elevationClicks);
    const windRounded = Math.round(windageClicks);

    const elevText = `${elevRounded}${elevationDir ? directionArrow(elevationDir) : ""}`;
    const windText = `${windRounded}${windageDir ? directionArrow(windageDir) : ""}`;

    $("corrClicksInline").textContent = `Clicks ${elevText} • ${windText}`;

    const distanceYds = p?.debug?.distanceYds ?? "—";
    const hits = p?.shots ?? "—";
    $("sessionMeta").textContent = `${distanceYds} yds • ${hits} hits`;
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

  function wireVendor(payload) {
    const btn = $("vendorBtn");
    const text = $("vendorText");
    if (!btn || !text) return;

    const url = String(payload?.vendorUrl || "").trim();

    if (url && /^https?:\/\//i.test(url)) {
      btn.href = url;
      btn.classList.remove("vendorDisabled");
      text.textContent = "Visit Partner";
    } else {
      btn.href = "#";
      btn.classList.add("vendorDisabled");
      text.textContent = "Vendor Not Set";
      btn.addEventListener("click", (e) => e.preventDefault(), { once: true });
    }
  }

  function wireSurvey(payload) {
    const btn = $("surveyBtn");
    if (!btn) return;

    const url = String(payload?.surveyUrl || "").trim();

    if (url && /^https?:\/\//i.test(url)) {
      btn.href = url;
      btn.style.pointerEvents = "auto";
      btn.style.opacity = "1";
    } else {
      btn.href = "#";
      btn.style.pointerEvents = "none";
      btn.style.opacity = ".55";
    }
  }

  function saveSEC() {
    window.print();
  }

  function goHome() {
    try {
      window.location.href = "./?fresh=" + Date.now();
    } catch {
      window.location.href = "./";
    }
  }

  function wireActions(payload) {
    const saveBtn = $("saveSecBtn");
    const homeBtn = $("goHomeBtn");

    saveBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      saveSEC();
    });

    homeBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      goHome();
    });

    wireVendor(payload);
    wireSurvey(payload);
  }

  function init() {
    const payload = loadPayload();

    if (!payload) {
      renderNoData();
      renderThumbnail();
      wireActions(null);
      return;
    }

    renderPayload(payload);
    renderThumbnail();
    wireActions(payload);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
