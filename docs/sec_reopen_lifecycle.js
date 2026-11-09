(function (global) {
  "use strict";

  const STAGE_SELECTOR = "details.sec-accordion-stage[data-sec-region], details.sec-accordion-stage[data-sec-stage]";
  const STAGE_SUMMARY_SELECTOR = "details.sec-accordion-stage[data-sec-region]>summary, details.sec-accordion-stage[data-sec-stage]>summary";
  const GROUP_SELECTOR = ".sec-target-story, .sec-v1-flow";
  const RESULT_DRAWER_SELECTOR = "details[data-result-distribution-drawer='true']";
  const boundStages = new WeakSet();
  const boundRoots = new WeakSet();
  const disclosureEvents = [];

  // Passive, in-memory diagnostics for the Founder-reported disclosure issue.
  // This observes native <details> state; it never changes stage behavior.
  function captureDisclosureEvent(stage, phase, error = "") {
    if (!stage) return;
    const group = stage.closest(GROUP_SELECTOR);
    const body = stage.querySelector(":scope > .sec-stage-body");
    const bodyStyle = body ? global.getComputedStyle(body) : null;
    const rect = body ? body.getBoundingClientRect() : null;
    const event = {
      at: new Date().toISOString(),
      phase,
      region: stageIdentity(stage),
      open: Boolean(stage.open),
      groupOpenRegion: group?.dataset?.secOpenRegion || "",
      bodyVisible: Boolean(rect && rect.width > 0 && rect.height > 0 && bodyStyle?.display !== "none" && bodyStyle?.visibility !== "hidden"),
      error: String(error || "")
    };
    disclosureEvents.push(event);
    if (disclosureEvents.length > 40) disclosureEvents.shift();
    global.SCZN3SECDisclosureDiagnostics = disclosureEvents.slice();
    global.console?.info?.("[SCZN3 disclosure]", event);
  }

  function stageIdentity(stage) {
    return String(stage?.dataset?.secRegion || stage?.dataset?.secStage || "").trim().toLowerCase();
  }

  function collapseResultDrawers(stage) {
    if (!stage || typeof stage.querySelectorAll !== "function") return 0;
    const drawers = [...stage.querySelectorAll(RESULT_DRAWER_SELECTOR)];
    drawers.forEach(drawer => { drawer.open = false; });
    return drawers.length;
  }

  function normalize(root = document) {
    if (!root || typeof root.querySelectorAll !== "function") return 0;
    const stages = [...root.querySelectorAll(STAGE_SELECTOR)];
    if (!stages.length) return 0;

    const targets = stages.filter(stage => stageIdentity(stage) === "target");
    stages.forEach(stage => {
      stage.open = false;
      collapseResultDrawers(stage);
    });
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
            if (otherStage !== stage) {
              otherStage.open = false;
              collapseResultDrawers(otherStage);
            }
          });
        } else {
          collapseResultDrawers(stage);
        }
        syncGroupState(group, stages);
        captureDisclosureEvent(stage, "toggle");
      });
    });
    if (!boundRoots.has(root)) {
      boundRoots.add(root);
      root.addEventListener("click", event => {
        const close = event.target.closest?.("[data-sec-close-drawer]");
        if (close && root.contains(close)) {
          event.preventDefault();
          const stage = close.closest(STAGE_SELECTOR);
          const stages = siblingStages(stage, root);
          stages.forEach(item => {
            item.open = false;
            collapseResultDrawers(item);
          });
          syncGroupState(stage?.closest(GROUP_SELECTOR) || root, stages);
          return;
        }
        const summary = event.target.closest?.(STAGE_SUMMARY_SELECTOR);
        const stage = summary?.parentElement;
        if (!stage || !root.contains(stage) || stage.open) return;
        captureDisclosureEvent(stage, "summary-click-before-toggle");
        siblingStages(stage, root).forEach(otherStage => {
          if (otherStage !== stage) {
            otherStage.open = false;
            collapseResultDrawers(otherStage);
          }
        });
      });
      global.addEventListener("error", event => {
        const stage = event.target?.closest?.(STAGE_SELECTOR)
          || [...root.querySelectorAll(STAGE_SELECTOR)].find(item => item.open);
        if (stage && root.contains(stage)) captureDisclosureEvent(stage, "window-error", event.message || event.error?.message || "error");
      });
      global.addEventListener("unhandledrejection", event => {
        const activeStage = [...root.querySelectorAll(STAGE_SELECTOR)].find(stage => stage.open);
        if (activeStage) captureDisclosureEvent(activeStage, "unhandled-rejection", event.reason?.message || String(event.reason || "rejection"));
      });
    }
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
