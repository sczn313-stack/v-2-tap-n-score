/* ============================================================
   docs/index.js — ORIGINAL ENGINE (RESTORED) + FIXES
   FIXES:
   - Baker opens directly (no panel intercept)
   - Photo upload does NOT reset page
   - Full SCZN3 engine preserved
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  function getParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name) || "";
  }

  function isBakerMode() {
    return getParam("v").toLowerCase() === "baker";
  }

  const elPhotoBtn = $("photoBtn");
  const elFile = $("photoInput");
  const elImg = $("targetImg");
  const elWrap = $("targetWrap");
  const elDots = $("dotsLayer");

  const elVendorBox = $("vendorBox");
  const elVendorPanelLink = $("vendorPanelLink");

  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";

  let objectUrl = null;
  let aim = null;
  let hits = [];

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
    if (!elImg.src) return;

    const { x01, y01 } = getRelative01(x, y);

    if (!aim) {
      aim = { x01, y01 };
      addDot(x01, y01, "aim");
      return;
    }

    hits.push({ x01, y01 });
    addDot(x01, y01, "hit");
  }

  function hydrateVendor() {
    if (isBakerMode()) {
      localStorage.setItem(KEY_VENDOR_URL, "https://baker-targets.com/");
    }

    const v = localStorage.getItem(KEY_VENDOR_URL) || "";

    if (elVendorPanelLink && v) {
      elVendorPanelLink.href = v;
      elVendorPanelLink.target = "_blank";
      elVendorPanelLink.rel = "noopener";
    }

    if (elVendorBox) {
      if (v) {
        // 🔥 FIX — DIRECT NAVIGATION
        elVendorBox.href = v;
        elVendorBox.target = "_blank";
        elVendorBox.rel = "noopener";
        elVendorBox.onclick = null;
      } else {
        elVendorBox.href = "#";
      }
    }
  }

  function hydratePhoto() {
    if (!elPhotoBtn || !elFile) return;

    elPhotoBtn.addEventListener("click", () => {
      elFile.click();
    });

    elFile.addEventListener("change", () => {
      const f = elFile.files?.[0];
      if (!f) return;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(f);

      elImg.src = objectUrl;

      // 🔥 FIX — prevent reset
      elFile.value = "";
    });
  }

  if (elWrap) {
    elWrap.addEventListener("click", (e) => {
      acceptTap(e.clientX, e.clientY);
    });
  }

  hydrateVendor();
  hydratePhoto();

})();
