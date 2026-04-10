/* ============================================================
   docs/index.js (FULL REPLACEMENT)
   FIXES:
   - Photo button unfreezes (proper file input trigger)
   - Baker link opens real site (no panel trap)
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const elPhotoBtn = $("photoBtn");
  const elFile = $("photoInput");

  const elVendorBox = $("vendorBox");
  const elVendorPanelLink = $("vendorPanelLink");

  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";

  function getParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name) || "";
  }

  function isBakerMode() {
    return getParam("v").toLowerCase() === "baker";
  }

  // 🔥 FIX 1 — ALWAYS SET BAKER URL
  function setVendor() {
    if (isBakerMode()) {
      localStorage.setItem(KEY_VENDOR_URL, "https://baker-targets.com/");
    }
  }

  // 🔥 FIX 2 — DIRECT LINK (NO PANEL BLOCKING)
  function wireVendor() {
    const v = localStorage.getItem(KEY_VENDOR_URL) || "";

    if (elVendorPanelLink) {
      elVendorPanelLink.href = v;
      elVendorPanelLink.target = "_blank";
    }

    if (elVendorBox) {
      elVendorBox.href = v;
      elVendorBox.target = "_blank";

      elVendorBox.addEventListener("click", (e) => {
        if (!v) {
          e.preventDefault();
        }
      });
    }
  }

  // 🔥 FIX 3 — PHOTO BUTTON UNLOCK
  function wirePhoto() {
    if (!elPhotoBtn || !elFile) return;

    elPhotoBtn.addEventListener("click", () => {
      elFile.click(); // direct trigger
    });

    elFile.addEventListener("change", () => {
      const f = elFile.files?.[0];
      if (!f) return;

      const img = document.getElementById("targetImg");
      if (!img) return;

      const url = URL.createObjectURL(f);
      img.src = url;
    });
  }

  // 🔥 INIT
  setVendor();
  wireVendor();
  wirePhoto();

})();
