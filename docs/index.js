function hydrateVendorBox() {
  // 🔥 SET BAKER URL (THIS FIXES YOUR ISSUE)
  if (isBakerMode()) {
    localStorage.setItem(KEY_VENDOR_URL, "https://baker-targets.com/");
  }

  // Label behavior
  if (elVendorLabel) elVendorLabel.textContent = "BUY MORE TARGETS LIKE THIS";

  if (isBakerMode() && elVendorLabel) {
    const a = "BUY MORE TARGETS LIKE THIS";
    const b = "BAKER • SMART TARGET™";
    let flip = false;
    setInterval(() => {
      flip = !flip;
      elVendorLabel.textContent = flip ? b : a;
    }, 1200);
  }

  // Get vendor URL
  const v = localStorage.getItem(KEY_VENDOR_URL) || "";
  const ok = typeof v === "string" && v.startsWith("http");

  // Panel button (Visit Baker)
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

  // Pill click behavior
  if (elVendorBox) {
    elVendorBox.removeAttribute("target");
    elVendorBox.removeAttribute("rel");
    elVendorBox.href = "#";
    elVendorBox.style.pointerEvents = "auto";
    elVendorBox.style.opacity = "1";

    elVendorBox.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleVendorPanel();
    });
  }
}
