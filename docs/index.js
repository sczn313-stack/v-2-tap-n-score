/* ============================================================
   docs/index.js — FINAL STABLE BUILD + SEC HANDOFF (COMPLETE)
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const elPhotoBtn = $("photoBtn");
  const elFile = $("photoInput");
  const elImg = $("targetImg");
  const elWrap = $("targetWrap");
  const elDots = $("dotsLayer");

  const elShowResultsBtn = $("showResultsBtn");
  const elStickyResultsBtn = $("stickyResultsBtn");

  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";
  const KEY_SEC_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";

  let objectUrl = null;
  let aim = null;
  let hits = [];

  function getParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name) || "";
  }

  function isBakerMode() {
    return getParam("v").toLowerCase() === "baker";
  }

  function hydrateVendor() {
    if (isBakerMode()) {
      localStorage.setItem(KEY_VENDOR_URL, "https://bakertargets.com/");
    }
  }

  function hydratePhoto() {
    if (!elPhotoBtn || !elFile) return;

    elPhotoBtn.onclick = () => elFile.click();

    elFile.onchange = () => {
      const f = elFile.files?.[0];
      if (!f) return;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(f);
      elImg.src = objectUrl;

      elFile.value = "";
    };
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function getRelative01(x, y) {
    const r = elWrap.getBoundingClientRect();
    return {
      x01: clamp01((x - r.left) / r.width),
      y01: clamp01((y - r.top) / r.height)
    };
  }

  function addDot(x01, y01, kind) {
    const d = document.createElement("div");
    d.className = "tapDot";
    d.style.left = (x01 * 100) + "%";
    d.style.top = (y01 * 100) + "%";
    d.style.background = kind === "aim" ? "#67f3a4" : "#b7ff3c";
    elDots.appendChild(d);
  }

  function acceptTap(x, y) {
    if (!elImg?.src) return;

    const { x01, y01 } = getRelative01(x, y);

    if (!aim) {
      aim = { x01, y01 };
      addDot(x01, y01, "aim");
      return;
    }

    hits.push({ x01, y01 });
    addDot(x01, y01, "hit");
  }

  if (elWrap) {
    elWrap.addEventListener("click", (e) => {
      acceptTap(e.clientX, e.clientY);
    });
  }

  /* ============================================================
     🔥 SEC HANDOFF (THIS FIXES YOUR PROBLEM)
  ============================================================ */

  function goToSEC() {
    if (!aim || hits.length < 3) {
      alert("Take at least 3 shots first");
      return;
    }

    const payload = {
      aim,
      hits,
      distanceLabel: "100 yds",
      timeLabel: "Session ready",
      vendorUrl: localStorage.getItem(KEY_VENDOR_URL) || "",
      vendorName: ""
    };

    sessionStorage.setItem(
      KEY_SEC_PAYLOAD,
      JSON.stringify(payload)
    );

    window.location.href = "sec.html?v=" + Date.now();
  }

  function hookResultsButtons() {
    if (elShowResultsBtn) {
      elShowResultsBtn.onclick = goToSEC;
    }

    if (elStickyResultsBtn) {
      elStickyResultsBtn.onclick = goToSEC;
    }
  }

  hydrateVendor();
  hydratePhoto();
  hookResultsButtons();

})();
