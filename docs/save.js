/* ============================================================
   docs/save.js — FULL REPLACEMENT
   SEC SAVE + SAFE THUMB CAPTURE
   - matches stable index.js
   - saves only the live SEC card
   - non-blocking open/save flow
   - lightweight thumbnail helper for history
============================================================ */

(() => {
  "use strict";

  document.addEventListener("SCZN3_SAVE_SEC", handleSave);

  async function handleSave() {
    const secCard = document.getElementById("secCard");
    if (!secCard) {
      console.warn("SEC card not found");
      return;
    }

    try {
      await ensureHtml2Canvas();

      requestAnimationFrame(async () => {
        try {
          const canvas = await window.html2canvas(secCard, {
            backgroundColor: null,
            scale: Math.min(window.devicePixelRatio || 1.5, 2),
            useCORS: true,
            allowTaint: false,
            logging: false,
            removeContainer: true
          });

          downloadCanvas(canvas, buildFileName());
        } catch (err) {
          console.error("SEC save failed:", err);
        }
      });
    } catch (err) {
      console.error("html2canvas failed to load:", err);
    }
  }

  async function ensureHtml2Canvas() {
    if (window.html2canvas) return;

    await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        if (window.html2canvas) resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function downloadCanvas(canvas, fileName) {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.warn("Canvas blob creation failed");
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  function buildFileName() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    return `SCZN3_SEC_${yyyy}-${mm}-${dd}_${hh}${min}.png`;
  }

  /* ============================================================
     OPTIONAL THUMB CAPTURE HOOK
     Used only if a future index.js wants thumbnail capture.
     Safe, lightweight, and non-blocking.
  ============================================================= */
  window.SCZN3_CAPTURE_THUMB = async function (imgEl) {
    try {
      if (!imgEl || !imgEl.src) return "";

      const loadedImg = await cloneImage(imgEl.src);

      const maxW = 320;
      const maxH = 180;

      const ratio = Math.min(maxW / loadedImg.naturalWidth, maxH / loadedImg.naturalHeight);
      const width = Math.max(1, Math.round(loadedImg.naturalWidth * ratio));
      const height = Math.max(1, Math.round(loadedImg.naturalHeight * ratio));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      ctx.drawImage(loadedImg, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", 0.82);
    } catch (err) {
      console.warn("Thumbnail helper failed:", err);
      return "";
    }
  };

  function cloneImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image clone failed"));
      img.src = src;
    });
  }
})();
