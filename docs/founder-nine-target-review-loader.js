(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  if (params.get("founderReview") !== "nine-target") return;

  const reviewImages = Object.freeze({
    gunfun_13120_small_critical_shots: Object.freeze({ path: "/review-assets/target-01.jpg", name: "gunfun-13120-small-critical-shots.jpg" }),
    gunfun_22200_b27e_black: Object.freeze({ path: "/review-assets/target-02.jpg", name: "gunfun-22200-b27e-black.jpg" }),
    idpa_silhouette_sl_st2: Object.freeze({ path: "/review-assets/target-03.jpeg", name: "baker-sl-st2-idpa.jpeg" }),
    gunfun_22470_uspsa_ipsc: Object.freeze({ path: "/review-assets/target-04.jpg", name: "gunfun-22470-uspsa-ipsc.jpg" }),
    gunfun_22040_idpa_white: Object.freeze({ path: "/review-assets/target-05.jpg", name: "gunfun-22040-idpa-white.jpg" }),
    gunfun_12070_big_circle: Object.freeze({ path: "/review-assets/target-06.jpg", name: "gunfun-12070-big-circle.jpg" }),
    baker_be_r9b: Object.freeze({ path: "/review-assets/target-07.webp", name: "baker-be-r9b.webp" }),
    baker_gf_bb_c: Object.freeze({ path: "/review-assets/target-08.jpg", name: "baker-gf-bb-c.jpg" }),
    gunfun_22740_vital_dude: Object.freeze({ path: "/review-assets/target-09.jpg", name: "gunfun-22740-vital-dude.jpg" }),
  });

  function initialize() {
    const reviewImage = reviewImages[params.get("target")];
    const input = document.getElementById("contractFile");
    const action = document.querySelector('label[for="contractFile"]');
    const status = document.getElementById("contractStatus");
    if (!reviewImage || !input || !action) return;

    let loading = false;
    action.addEventListener("click", async event => {
      event.preventDefault();
      if (loading) return;
      loading = true;
      const originalLabel = action.textContent;
      action.textContent = "Loading Review Target…";
      try {
        const response = await fetch(reviewImage.path, { cache: "no-store" });
        if (!response.ok) throw new Error(`review_image_${response.status}`);
        const blob = await response.blob();
        const file = new File([blob], reviewImage.name, { type: blob.type || "image/jpeg" });
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        action.textContent = "Load Review Target Again";
      } catch (error) {
        action.textContent = originalLabel;
        if (status) status.textContent = `Unable to load review target: ${error.message}`;
      } finally {
        loading = false;
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
