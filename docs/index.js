/* ============================================================
   docs/index.js (FULL RESTORE + BAKER FIX)
   DO NOT STRIP CORE LOGIC AGAIN
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  function getUrl() {
    try { return new URL(window.location.href); } catch { return null; }
  }

  function getParam(name) {
    const u = getUrl();
    return u ? (u.searchParams.get(name) || "") : "";
  }

  function getVendor() {
    return getParam("v").toLowerCase();
  }

  function isBakerMode() {
    return getVendor() === "baker";
  }

  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";

  const elPhotoBtn = $("photoBtn");
  const elFile = $("photoInput");
  const elVendorBox = $("vendorBox");
  const elVendorPanelLink = $("vendorPanelLink");

  // ✅ FIX 1 — ALWAYS SET BAKER URL
  function hydrateVendor() {
    if (isBakerMode()) {
      localStorage.setItem(KEY_VENDOR_URL, "https://baker-targets.com/");
    }

    const v = localStorage.getItem(KEY_VENDOR_URL) || "";

    if (elVendorPanelLink && v) {
      elVendorPanelLink.href = v;
      elVendorPanelLink.target = "_blank";
    }

    // 🔥 CRITICAL FIX — allow direct open
    if (elVendorBox && v) {
      elVendorBox.href = v;
      elVendorBox.target = "_blank";
      elVendorBox.style.pointerEvents = "auto";
    }
  }

  // ✅ FIX 2 — PHOTO BUTTON WORKING AGAIN
  function hydratePhoto() {
    if (!elPhotoBtn || !elFile) return;

    elPhotoBtn.onclick = () => elFile.click();

    elFile.onchange = () => {
      const f = elFile.files?.[0];
      if (!f) return;

      const img = document.getElementById("targetImg");
      if (!img) return;

      const url = URL.createObjectURL(f);
      img.src = url;
    };
  }

  // 🔥 INIT
  hydrateVendor();
  hydratePhoto();

})();
