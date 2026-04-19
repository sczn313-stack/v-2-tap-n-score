/* ============================================================
   docs/save.js — FULL REPLACEMENT
   LIVE SEC CAPTURE ONLY
   Saved = exactly what user sees
============================================================ */

(() => {
  "use strict";

  // listen for save trigger from index.js
  document.addEventListener("SCZN3_SAVE_SEC", handleSave);

  async function handleSave() {
    const secEl = document.getElementById("secOverlay");

    if (!secEl) {
      console.warn("SEC overlay not found");
      return;
    }

    // ensure overlay is visible before capture
    if (secEl.hidden) {
      console.warn("SEC overlay hidden — cannot capture");
      return;
    }

    try {
      await ensureHtml2Canvas();
      captureSEC(secEl);
    } catch (err) {
      console.error("Save failed:", err);
    }
  }

  /* ============================================================
     LOAD html2canvas (only if needed)
  ============================================================= */

  function ensureHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (window.html2canvas) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load html2canvas"));

      document.body.appendChild(script);
    });
  }

  /* ============================================================
     CAPTURE LIVE SEC
  ============================================================= */

  function captureSEC(secEl) {
    // find the actual card (not full overlay background)
    const card = secEl.querySelector("#secCard");

    if (!card) {
      console.warn("SEC card not found");
      return;
    }

    // optional: scroll into view to avoid clipping
    card.scrollIntoView({ block: "center" });

    // slight delay ensures layout is settled
    setTimeout(() => {
      window.html2canvas(card, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false
      }).then((canvas) => {
        downloadCanvas(canvas);
      });
    }, 60);
  }

  /* ============================================================
     DOWNLOAD IMAGE
  ============================================================= */

  function downloadCanvas(canvas) {
    const link = document.createElement("a");

    const ts = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);

    link.download = `SCZN3_SEC_${ts}.png`;
    link.href = canvas.toDataURL("image/png");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
})();
