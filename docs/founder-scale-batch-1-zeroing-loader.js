(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  if (params.get("founderReview") !== "scale-batch-1") return;

  const reviewImages = Object.freeze({
    baker_m16a2_25m_zero: ["/scale-batch-assets/target-19.jpg", "baker-standard-m16a2.jpg"],
    gunfun_32120_m16a2_green_25m_zero: ["/scale-batch-assets/target-20.jpg", "gunfun-32120-m16a2-green.jpg"],
    speedwell_dodm4_m16a2_25m_zero: ["/scale-batch-assets/target-21.jpg", "speedwell-dodm4-m16a2.jpg"]
  });

  function initialize() {
    const definition = reviewImages[params.get("target_profile_id") || params.get("targetProfileId")];
    if (!definition) return;
    let loading = false;
    document.addEventListener("click", async event => {
      const candidate = event.target.closest('label[for="targetImageInput"], label[for="targetCameraInput"], button');
      const action = candidate && (
        candidate.matches('label[for="targetImageInput"], label[for="targetCameraInput"]')
        || /add photo/i.test(candidate.textContent || "")
      ) ? candidate : null;
      if (!action) return;
      event.preventDefault();
      if (loading) return;
      loading = true;
      const input = document.getElementById(action.htmlFor || "targetImageInput");
      const originalLabel = action.textContent;
      action.textContent = "Loading Review Target…";
      try {
        const response = await fetch(definition[0], { cache: "no-store" });
        if (!response.ok) throw new Error(`review_image_${response.status}`);
        const blob = await response.blob();
        const transfer = new DataTransfer();
        transfer.items.add(new File([blob], definition[1], { type: blob.type || "image/jpeg" }));
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        action.textContent = "Load Review Target Again";
      } catch (error) {
        action.textContent = originalLabel;
        const status = document.getElementById("saveSessionStatus");
        if (status) status.textContent = `Unable to load review target: ${error.message}`;
      } finally {
        loading = false;
      }
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
