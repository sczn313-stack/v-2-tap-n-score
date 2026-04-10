// 🔥 BAKER WIRING + EXISTING LOGIC (MINIMAL PATCH)

(() => {
  const $ = (id) => document.getElementById(id);

  function getParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name) || "";
  }

  function getVendor() {
    return getParam("v").toLowerCase();
  }

  function isBakerMode() {
    return getVendor() === "baker";
  }

  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";

  const elVendorBox = $("vendorBox");
  const elVendorLabel = $("vendorLabel");
  const elVendorPanel = $("vendorPanel");
  const elVendorPanelLink = $("vendorPanelLink");

  function toggleVendorPanel() {
    if (!elVendorPanel) return;
    elVendorPanel.classList.toggle("vendorOpen");
  }

  function hydrateVendorBox() {
    // 🔥 FORCE BAKER URL
    if (isBakerMode()) {
      localStorage.setItem(KEY_VENDOR_URL, "https://baker-targets.com/");
    }

    if (elVendorLabel) elVendorLabel.textContent = "BUY MORE TARGETS LIKE THIS";

    // Flip animation
    if (isBakerMode() && elVendorLabel) {
      const a = "BUY MORE TARGETS LIKE THIS";
      const b = "BAKER • SMART TARGET™";
      let flip = false;
      setInterval(() => {
        flip = !flip;
        elVendorLabel.textContent = flip ? b : a;
      }, 1200);
    }

    // Apply URL
    const v = localStorage.getItem(KEY_VENDOR_URL) || "";
    const ok = v.startsWith("http");

    if (elVendorPanelLink) {
      if (ok) {
        elVendorPanelLink.href = v;
        elVendorPanelLink.style.pointerEvents = "auto";
        elVendorPanelLink.style.opacity = "1";
      } else {
        elVendorPanelLink.href = "#";
        elVendorPanelLink.style.pointerEvents = "none";
        elVendorPanelLink.style.opacity = ".65";
      }
    }

    if (elVendorBox) {
      elVendorBox.href = "#";
      elVendorBox.addEventListener("click", (e) => {
        e.preventDefault();
        toggleVendorPanel();
      });
    }
  }

  // 🔥 INIT
  hydrateVendorBox();

})();
