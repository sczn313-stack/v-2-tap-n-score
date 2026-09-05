(function exposeTSTTViewportGuard(global) {
  "use strict";

  const installedDocuments = new WeakSet();

  function install(doc = global.document) {
    if (!doc || installedDocuments.has(doc)) return false;
    installedDocuments.add(doc);

    const viewport = doc.querySelector('meta[name="viewport"]');
    if (viewport) viewport.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
    doc.documentElement.dataset.tsttPageZoom = "locked";
    doc.documentElement.style.touchAction = "pan-x pan-y";

    const lockBody = () => {
      if (doc.body) doc.body.style.touchAction = "pan-x pan-y";
    };
    lockBody();
    if (!doc.body) doc.addEventListener("DOMContentLoaded", lockBody, { once: true });

    const preventPageGesture = event => {
      if (event.cancelable) event.preventDefault();
    };
    for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
      doc.addEventListener(type, preventPageGesture, { passive: false });
    }
    doc.addEventListener("touchmove", event => {
      if (event.touches && event.touches.length > 1) preventPageGesture(event);
    }, { passive: false });
    doc.addEventListener("wheel", event => {
      if (event.ctrlKey) preventPageGesture(event);
    }, { passive: false });
    return true;
  }

  global.SCZN3TSTTViewportGuard = Object.freeze({ install });

  const query = new URLSearchParams(global.location.search);
  if (global.document.documentElement.dataset.tsttPage === "true" || query.get("embedded_tstt") === "1") install();
})(window);
