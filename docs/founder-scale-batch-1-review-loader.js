(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  if (params.get("founderReview") !== "scale-batch-1") return;

  const reviewImages = Object.freeze({
    gunfun_22200_b27e_black: ["/scale-batch-assets/target-01.jpg", "gunfun-22200-b27e-black.jpg"],
    gunfun_12070_big_circle: ["/scale-batch-assets/target-02.jpg", "gunfun-12070-big-circle.jpg"],
    us_target_386_cr_t_turkey: ["/scale-batch-assets/target-03.png", "us-target-386-cr-t-turkey.png"],
    gunfun_13120_small_critical_shots: ["/scale-batch-assets/target-04.jpg", "gunfun-13120-small-critical-shots.jpg"],
    gunfun_22470_uspsa_ipsc: ["/scale-batch-assets/target-05.jpg", "gunfun-22470-uspsa-ipsc.jpg"],
    american_target_58_q100_uspa_ipsc: ["/scale-batch-assets/target-06.jpg", "american-target-58-q100-uspa-ipsc.jpg"],
    idpa_silhouette_sl_st2: ["/scale-batch-assets/target-07.jpeg", "baker-sl-st2-idpa.jpeg"],
    gunfun_22040_idpa_white: ["/scale-batch-assets/target-08.jpg", "gunfun-22040-idpa-white.jpg"],
    national_target_idpa_p: ["/scale-batch-assets/target-09.jpg", "national-target-idpa-p.jpg"],
    baker_be_r9b: ["/scale-batch-assets/target-10.webp", "baker-be-r9b.webp"],
    splatterburst_74_12in_multi_bullseye: ["/scale-batch-assets/target-11.jpg", "splatterburst-74-multi-bullseye.jpg"],
    thompson_r_1602_basic_training_bullseye: ["/scale-batch-assets/target-12.webp", "thompson-r-1602-basic-training-bullseye.webp"],
    baker_gf_bb_c: ["/scale-batch-assets/target-13.jpg", "baker-gf-bb-c.jpg"],
    birchwood_casey_bc_3dtgtprt_pool_rack: ["/scale-batch-assets/target-14.png", "birchwood-casey-bc-3dtgtprt.png"],
    ez_aim_allen_15787_shootin_eye_test: ["/scale-batch-assets/target-15.jpg", "ez-aim-allen-15787.jpg"],
    gunfun_22740_vital_dude: ["/scale-batch-assets/target-16.jpg", "gunfun-22740-vital-dude.jpg"],
    highwild_cj_host_m108_gong: ["/scale-batch-assets/target-17.jpg", "highwild-cj-host-m108.jpg"],
    champion_44924c_rimfire_animal_4pack: ["/scale-batch-assets/target-18.png", "champion-44924c.png"]
  });

  async function loadReviewImage(input, action, status, definition) {
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
      if (status) status.textContent = `Unable to load review target: ${error.message}`;
    }
  }

  function initialize() {
    const pathname = window.location.pathname.replace(/\/+$/, "/");
    const exactRouteTargets = Object.freeze({
      "/t/baker/sl-st2/": "idpa_silhouette_sl_st2",
      "/t/baker/fun/": params.get("target") === "gf-bb" ? "baker_gf_bb_c" : "",
      "/t/gunfun/vital-dude/": "gunfun_22740_vital_dude"
    });
    const targetId = exactRouteTargets[pathname] || params.get("target") || "";
    const definition = reviewImages[targetId];
    const inputId = document.getElementById("contractFile") ? "contractFile" : "libraryInput";
    const input = document.getElementById(inputId);
    if (!definition || !input) return;
    let loading = false;
    document.addEventListener("click", async event => {
      const action = event.target.closest(`label[for="${inputId}"]`);
      if (!action) return;
      event.preventDefault();
      if (loading) return;
      loading = true;
      const status = document.getElementById("contractStatus") || document.getElementById("workspaceFeedback") || document.getElementById("targetInstruction");
      await loadReviewImage(input, action, status, definition);
      loading = false;
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
