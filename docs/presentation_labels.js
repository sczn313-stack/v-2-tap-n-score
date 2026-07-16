(function () {
  "use strict";

  const TARGET_LABELS = Object.freeze({
    gssf_ac_1: "Competition Paper Target (Demo)"
  });

  function targetLabel(targetProfileId, fallback = "Target") {
    const governedId = String(targetProfileId || "").trim().toLowerCase();
    return TARGET_LABELS[governedId] || fallback;
  }

  function applyTargetLabels(root = document) {
    root.querySelectorAll("[data-sczn3-target-label]").forEach(element => {
      const targetProfileId = element.getAttribute("data-sczn3-target-label");
      const fallback = element.getAttribute("data-sczn3-target-fallback") || element.textContent || "Target";
      element.textContent = targetLabel(targetProfileId, fallback);
    });
  }

  window.SCZN3Presentation = Object.freeze({ targetLabel, applyTargetLabels });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => applyTargetLabels(), { once: true });
  } else {
    applyTargetLabels();
  }
})();
