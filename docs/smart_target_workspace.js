(() => {
  "use strict";

  const OWNER = "SCZN3SmartTargetWorkspace";

  function requireElement(value, name) {
    if (!value || value.nodeType !== 1) throw new TypeError(`${name}_required`);
    return value;
  }

  function finitePositive(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function imageDimensions(image) {
    if (!image) return null;
    const width = finitePositive(image.naturalWidth);
    const height = finitePositive(image.naturalHeight);
    return width && height ? Object.freeze({ width, height }) : null;
  }

  async function decodeImage(image) {
    requireElement(image, "workspace_image");
    if (image.complete && imageDimensions(image)) return imageDimensions(image);
    if (typeof image.decode === "function") await image.decode();
    else await new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", reject, { once: true });
    });
    const dimensions = imageDimensions(image);
    if (!dimensions) throw new Error("workspace_image_decode_failed");
    return dimensions;
  }

  function visibleViewportBelow(header) {
    const viewport = window.visualViewport;
    const height = viewport && Number.isFinite(viewport.height) ? viewport.height : window.innerHeight;
    const top = viewport && Number.isFinite(viewport.offsetTop) ? viewport.offsetTop : 0;
    const headerBottom = header ? header.getBoundingClientRect().bottom : top;
    return Object.freeze({
      top,
      bottom: top + height,
      height: Math.max(0, Math.floor(top + height - Math.max(top, headerBottom)))
    });
  }

  function create(options = {}) {
    const root = requireElement(options.root, "workspace_root");
    const evidenceRegion = options.evidenceRegion ? requireElement(options.evidenceRegion, "workspace_evidence") : null;
    const actionRegion = options.actionRegion ? requireElement(options.actionRegion, "workspace_actions") : null;
    const header = options.header || null;
    const activeClass = String(options.activeClass || "");
    const viewportProperty = String(options.viewportProperty || "--sczn3-workspace-viewport-height");
    const resizeTarget = options.resizeTarget || actionRegion || root;
    let resizeObserver = null;
    let scheduled = false;

    root.dataset.sczn3Workspace = "platform-v1";
    root.dataset.sczn3WorkspaceOwner = OWNER;
    if (evidenceRegion) evidenceRegion.dataset.sczn3WorkspaceEvidence = "true";
    if (actionRegion) actionRegion.dataset.sczn3WorkspaceActions = "true";

    function syncVisibleViewport() {
      scheduled = false;
      const available = visibleViewportBelow(header);
      document.documentElement.style.setProperty(viewportProperty, `${available.height}px`);
      root.style.setProperty("--sczn3-workspace-available-height", `${available.height}px`);
      return available;
    }

    function scheduleLayout() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => requestAnimationFrame(syncVisibleViewport));
    }

    function bindViewportLifecycle() {
      window.addEventListener("resize", scheduleLayout);
      window.visualViewport?.addEventListener("resize", scheduleLayout);
      window.visualViewport?.addEventListener("scroll", scheduleLayout);
      if ("ResizeObserver" in window && resizeTarget) {
        resizeObserver = new ResizeObserver(scheduleLayout);
        resizeObserver.observe(resizeTarget);
      }
      scheduleLayout();
      return api;
    }

    function destroy() {
      window.removeEventListener("resize", scheduleLayout);
      window.visualViewport?.removeEventListener("resize", scheduleLayout);
      window.visualViewport?.removeEventListener("scroll", scheduleLayout);
      resizeObserver?.disconnect();
      resizeObserver = null;
    }

    async function revealAfterDecode(image, revealOptions = {}) {
      const dimensions = await decodeImage(image);
      root.hidden = false;
      if (evidenceRegion) evidenceRegion.hidden = false;
      if (activeClass) document.body.classList.add(activeClass);
      if (revealOptions.scroll !== false) root.scrollIntoView({ block: "start", behavior: "auto" });
      scheduleLayout();
      return dimensions;
    }

    function conceal() {
      root.hidden = true;
      if (activeClass) document.body.classList.remove(activeClass);
      scheduleLayout();
    }

    const api = Object.freeze({
      owner: OWNER,
      root,
      evidenceRegion,
      actionRegion,
      decodeImage,
      revealAfterDecode,
      conceal,
      syncVisibleViewport,
      scheduleLayout,
      bindViewportLifecycle,
      destroy
    });
    return api;
  }

  function configureContainedStage(stage, dimensions, options = {}) {
    requireElement(stage, "workspace_stage");
    const width = finitePositive(dimensions && dimensions.width);
    const height = finitePositive(dimensions && dimensions.height);
    if (!width || !height) return false;
    const viewportWidth = finitePositive(options.viewportWidth) || Math.max(1, document.documentElement.clientWidth || window.innerWidth || width);
    const viewportHeight = finitePositive(options.viewportHeight) || Math.max(1, document.documentElement.clientHeight || window.innerHeight || height);
    const containedWidth = Math.floor(Math.min(viewportWidth, viewportHeight * (width / height)));
    const containedHeight = Math.floor(containedWidth * (height / width));
    stage.style.setProperty("--workspace-stage-width", `${containedWidth}px`);
    stage.style.setProperty("--workspace-stage-height", `${containedHeight}px`);
    stage.style.setProperty("--workspace-target-ratio", `${width} / ${height}`);
    stage.dataset.geometryLocked = "true";
    return true;
  }

  function resetContainedStage(stage) {
    requireElement(stage, "workspace_stage");
    stage.dataset.geometryLocked = "false";
    stage.style.removeProperty("--workspace-stage-width");
    stage.style.removeProperty("--workspace-stage-height");
    stage.style.removeProperty("--workspace-target-ratio");
  }

  window.SCZN3SmartTargetWorkspace = Object.freeze({
    version: "1.0.0",
    owner: OWNER,
    create,
    decodeImage,
    imageDimensions,
    visibleViewportBelow,
    configureContainedStage,
    resetContainedStage
  });
})();
