(function (global) {
  "use strict";

  const STAGE_SELECTOR = "details.sec-accordion-stage[data-sec-region], details.sec-accordion-stage[data-sec-stage]";
  const GROUP_SELECTOR = ".sec-target-story, .sec-v1-flow";
  const boundStages = new WeakSet();

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

  function siblingStages(stage, fallbackRoot) {
    const group = stage.closest(GROUP_SELECTOR) || fallbackRoot;
    if (!group || typeof group.querySelectorAll !== "function") return [];
    return [...group.querySelectorAll(STAGE_SELECTOR)];
  }

  function syncGroupState(group, stages = group && typeof group.querySelectorAll === "function" ? [...group.querySelectorAll(STAGE_SELECTOR)] : []) {
    if (!group?.dataset) return "";
    const openStage = stages.find(stage => stage.open);
    const openRegion = stageIdentity(openStage);
    if (openRegion) group.dataset.secOpenRegion = openRegion;
    else delete group.dataset.secOpenRegion;
    return openRegion;
  }

  function bind(root = document) {
    if (!root || typeof root.querySelectorAll !== "function") return 0;
    const stages = [...root.querySelectorAll(STAGE_SELECTOR)];
    stages.forEach(stage => {
      if (boundStages.has(stage)) return;
      boundStages.add(stage);
      stage.addEventListener("toggle", () => {
        const group = stage.closest(GROUP_SELECTOR) || root;
        const stages = siblingStages(stage, root);
        if (stage.open) {
          stages.forEach(otherStage => {
            if (otherStage !== stage) otherStage.open = false;
          });
        }
        syncGroupState(group, stages);
      });
    });
    return stages.length;
  }

  function initialize(root = document) {
    bind(root);
    const normalized = normalize(root);
    const groups = [];
    if (root?.matches?.(GROUP_SELECTOR)) groups.push(root);
    root?.querySelectorAll?.(GROUP_SELECTOR).forEach(group => groups.push(group));
    groups.forEach(group => syncGroupState(group));
    return normalized;
  }

  function normalizeDocument() {
    initialize(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", normalizeDocument, { once: true });
  } else {
    normalizeDocument();
  }
  global.addEventListener("pageshow", normalizeDocument);
  global.SCZN3SECReopenLifecycle = Object.freeze({ normalize, bind, initialize });
})(window);
