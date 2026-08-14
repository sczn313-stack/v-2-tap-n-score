(function (global) {
  "use strict";

  const STAGE_SELECTOR = "details.sec-accordion-stage[data-sec-region], details.sec-accordion-stage[data-sec-stage]";

  function stageIdentity(stage) {
    return String(stage?.dataset?.secRegion || stage?.dataset?.secStage || "").trim().toLowerCase();
  }

  function normalize(root = document) {
    if (!root || typeof root.querySelectorAll !== "function") return 0;
    const stages = [...root.querySelectorAll(STAGE_SELECTOR)];
    if (!stages.length) return 0;

    const targets = stages.filter(stage => stageIdentity(stage) === "target");
    stages.forEach(stage => { stage.open = false; });
    targets.forEach(stage => { stage.open = true; });
    return targets.length;
  }

  function normalizeDocument() {
    normalize(document);
  }

  global.addEventListener("pageshow", normalizeDocument);
  global.SCZN3SECReopenLifecycle = Object.freeze({ normalize });
})(window);
