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

  function createPrecisionTap(options = {}) {
    const viewport = requireElement(options.viewport, "precision_tap_viewport");
    const plane = requireElement(options.plane, "precision_tap_plane");
    const image = requireElement(options.image, "precision_tap_image");
    const onTap = typeof options.onTap === "function" ? options.onTap : () => {};
    const canTap = typeof options.canTap === "function" ? options.canTap : () => true;
    const pointers = new Map();
    let fitScale = 1;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let singleStart = null;
    let pinchStart = null;
    let multiGesture = false;

    viewport.dataset.precisionTapOwner = OWNER;
    viewport.dataset.precisionTapState = "entry";
    plane.dataset.precisionTapPlane = "true";

    function point(event) {
      const rect = viewport.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function midpoint(first, second) {
      return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    }

    function distance(first, second) {
      return Math.hypot(second.x - first.x, second.y - first.y);
    }

    function clamp() {
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const edge = 36;
      translateX = width <= viewport.clientWidth
        ? (viewport.clientWidth - width) / 2
        : Math.min(edge, Math.max(viewport.clientWidth - width - edge, translateX));
      translateY = height <= viewport.clientHeight
        ? (viewport.clientHeight - height) / 2
        : Math.min(edge, Math.max(viewport.clientHeight - height - edge, translateY));
    }

    function render() {
      plane.style.transform = `translate3d(${translateX}px,${translateY}px,0) scale(${scale})`;
      plane.style.setProperty("--precision-tap-marker-size", `${18 / scale}px`);
      plane.style.setProperty("--precision-tap-marker-border", `${2 / scale}px`);
      plane.style.setProperty("--precision-tap-marker-font", `${9 / scale}px`);
      plane.style.setProperty("--precision-tap-aim-size", `${24 / scale}px`);
      viewport.dataset.precisionTapScale = String(Number((scale / fitScale).toFixed(3)));
    }

    function resetView() {
      const dimensions = imageDimensions(image);
      if (!dimensions || !viewport.clientWidth || !viewport.clientHeight) return false;
      plane.style.width = `${dimensions.width}px`;
      plane.style.height = `${dimensions.height}px`;
      fitScale = Math.min(viewport.clientWidth / dimensions.width, viewport.clientHeight / dimensions.height);
      scale = fitScale;
      translateX = (viewport.clientWidth - dimensions.width * scale) / 2;
      translateY = (viewport.clientHeight - dimensions.height * scale) / 2;
      render();
      return true;
    }

    function beginPinch() {
      const active = [...pointers.values()];
      if (active.length < 2) return;
      const center = midpoint(active[0], active[1]);
      pinchStart = {
        distance: Math.max(1, distance(active[0], active[1])),
        scale,
        imageX: (center.x - translateX) / scale,
        imageY: (center.y - translateY) / scale
      };
      multiGesture = true;
      viewport.classList.add("is-panning");
    }

    function pointerDown(event) {
      event.preventDefault();
      viewport.setPointerCapture?.(event.pointerId);
      const current = point(event);
      pointers.set(event.pointerId, current);
      if (pointers.size === 1) singleStart = { point: current, translateX, translateY, moved: false, time: performance.now() };
      else if (pointers.size === 2) beginPinch();
    }

    function pointerMove(event) {
      if (!pointers.has(event.pointerId)) return;
      event.preventDefault();
      const current = point(event);
      pointers.set(event.pointerId, current);
      if (pointers.size >= 2 && pinchStart) {
        const active = [...pointers.values()];
        const center = midpoint(active[0], active[1]);
        scale = Math.min(fitScale * 12, Math.max(fitScale, pinchStart.scale * distance(active[0], active[1]) / pinchStart.distance));
        translateX = center.x - pinchStart.imageX * scale;
        translateY = center.y - pinchStart.imageY * scale;
        clamp();
        render();
        return;
      }
      if (pointers.size === 1 && singleStart && !multiGesture) {
        const deltaX = current.x - singleStart.point.x;
        const deltaY = current.y - singleStart.point.y;
        if (Math.hypot(deltaX, deltaY) > 7) {
          singleStart.moved = true;
          viewport.classList.add("is-panning");
        }
        if (singleStart.moved) {
          translateX = singleStart.translateX + deltaX;
          translateY = singleStart.translateY + deltaY;
          clamp();
          render();
        }
      }
    }

    function finishPointer(event) {
      if (!pointers.has(event.pointerId)) return;
      const current = point(event);
      const shouldTap = canTap() && pointers.size === 1 && singleStart && !singleStart.moved
        && !multiGesture && performance.now() - singleStart.time < 700;
      pointers.delete(event.pointerId);
      if (shouldTap) onTap(event, current);
      if (pointers.size === 1 && multiGesture) {
        const remaining = [...pointers.values()][0];
        singleStart = { point: remaining, translateX, translateY, moved: true, time: performance.now() };
      }
      if (pointers.size < 2) pinchStart = null;
      if (!pointers.size) {
        multiGesture = false;
        singleStart = null;
        viewport.classList.remove("is-panning");
      }
    }

    function wheel(event) {
      event.preventDefault();
      const current = point(event);
      const imageX = (current.x - translateX) / scale;
      const imageY = (current.y - translateY) / scale;
      scale = Math.min(fitScale * 12, Math.max(fitScale, scale * Math.exp(-event.deltaY * .0015)));
      translateX = current.x - imageX * scale;
      translateY = current.y - imageY * scale;
      clamp();
      render();
    }

    function setReviewing(reviewing) {
      viewport.dataset.precisionTapState = reviewing ? "review" : "entry";
      if (reviewing) resetView();
    }

    function destroy() {
      viewport.removeEventListener("pointerdown", pointerDown);
      viewport.removeEventListener("pointermove", pointerMove);
      viewport.removeEventListener("pointerup", finishPointer);
      viewport.removeEventListener("pointercancel", finishPointer);
      viewport.removeEventListener("wheel", wheel);
    }

    viewport.addEventListener("pointerdown", pointerDown, { passive: false });
    viewport.addEventListener("pointermove", pointerMove, { passive: false });
    viewport.addEventListener("pointerup", finishPointer, { passive: false });
    viewport.addEventListener("pointercancel", finishPointer, { passive: false });
    viewport.addEventListener("wheel", wheel, { passive: false });
    resetView();

    return Object.freeze({ resetView, setReviewing, destroy, getScale: () => scale / fitScale });
  }

  window.SCZN3SmartTargetWorkspace = Object.freeze({
    version: "1.1.0",
    owner: OWNER,
    create,
    decodeImage,
    imageDimensions,
    visibleViewportBelow,
    configureContainedStage,
    resetContainedStage,
    createPrecisionTap
  });
})();
