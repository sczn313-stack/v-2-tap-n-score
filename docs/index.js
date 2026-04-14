/* ============================================================
   docs/index.js — Annotated Thumbnail Build
   Adds: capture target + dots into stored thumbnail
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_TARGET_IMG_DATA = "SCZN3_TARGET_IMG_DATAURL_V1";

  let objectUrl = null;
  let aim = null;
  let hits = [];

  const elFile = $("photoInput");
  const elImg = $("targetImg");
  const elWrap = $("targetWrap");
  const elDots = $("dotsLayer");

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function getRelative01(clientX, clientY) {
    const r = elWrap.getBoundingClientRect();
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;
    return { x01: clamp01(x), y01: clamp01(y) };
  }

  function addDot(x01, y01, kind) {
    const d = document.createElement("div");
    d.className = "tapDot " + (kind === "aim" ? "tapDotAim" : "tapDotHit");
    d.style.left = (x01 * 100) + "%";
    d.style.top = (y01 * 100) + "%";
    elDots.appendChild(d);
  }

  function resetAll() {
    aim = null;
    hits = [];
    elDots.innerHTML = "";
  }

  // ------------------------------------------------------------
  // 🔥 NEW: BUILD ANNOTATED THUMBNAIL
  // ------------------------------------------------------------
  async function buildAnnotatedThumbnail() {
    const rect = elWrap.getBoundingClientRect();

    const canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");

    // draw base image
    await new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        res();
      };
      img.src = elImg.src;
    });

    // draw aim + hits
    const drawDot = (x01, y01, color) => {
      const x = x01 * canvas.width;
      const y = y01 * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000";
      ctx.stroke();
    };

    if (aim) {
      drawDot(aim.x01, aim.y01, "#67f3a4"); // green aim
    }

    hits.forEach(h => {
      drawDot(h.x01, h.y01, "#b7ff3c"); // yellow hits
    });

    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    localStorage.setItem(KEY_TARGET_IMG_DATA, dataUrl);
  }

  // ------------------------------------------------------------
  // FILE LOAD
  // ------------------------------------------------------------
  elFile?.addEventListener("change", async () => {
    const f = elFile.files?.[0];
    if (!f) return;

    resetAll();

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(f);

    elImg.src = objectUrl;
    elFile.value = "";
  });

  // ------------------------------------------------------------
  // TAP HANDLING
  // ------------------------------------------------------------
  elWrap?.addEventListener("click", async (e) => {
    if (!elImg?.src) return;

    const { x01, y01 } = getRelative01(e.clientX, e.clientY);

    if (!aim) {
      aim = { x01, y01 };
      addDot(x01, y01, "aim");
      return;
    }

    hits.push({ x01, y01 });
    addDot(x01, y01, "hit");
  });

  // ------------------------------------------------------------
  // SHOW RESULTS → SAVE ANNOTATED IMAGE
  // ------------------------------------------------------------
  $("showResultsBtn")?.addEventListener("click", async () => {
    await buildAnnotatedThumbnail();

    const payload = {
      score: 85,
      shots: hits.length,
      elevation: { dir: "UP", clicks: 1 },
      windage: { dir: "RIGHT", clicks: 1 },
      debug: { distanceYds: 100 }
    };

    localStorage.setItem(KEY_PAYLOAD, JSON.stringify(payload));

    window.location.href = "./sec.html?fresh=" + Date.now();
  });

})();
