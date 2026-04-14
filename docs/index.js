/* ============================================================
   docs/index.js — Annotated Thumbnail Build v2
   Adds: capture target + visible dots into stored thumbnail
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
  const elShowResultsBtn = $("showResultsBtn");

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
    if (elDots) elDots.innerHTML = "";
  }

  async function loadCurrentImage() {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = elImg.src;
    });
  }

  async function buildAnnotatedThumbnail() {
    if (!elWrap || !elImg?.src) return;

    const wrapRect = elWrap.getBoundingClientRect();
    const width = Math.max(1, Math.round(wrapRect.width));
    const height = Math.max(1, Math.round(wrapRect.height));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseImg = await loadCurrentImage();
    ctx.drawImage(baseImg, 0, 0, width, height);

    const dotEls = Array.from(elDots?.querySelectorAll(".tapDot") || []);

    dotEls.forEach((dot) => {
      const leftPct = parseFloat(dot.style.left || "0") / 100;
      const topPct = parseFloat(dot.style.top || "0") / 100;

      const x = leftPct * width;
      const y = topPct * height;

      const isAim = dot.classList.contains("tapDotAim");
      const radius = 10;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isAim ? "#67f3a4" : "#b7ff3c";
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000000";
      ctx.stroke();
    });

    const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
    localStorage.setItem(KEY_TARGET_IMG_DATA, dataUrl);
  }

  elFile?.addEventListener("change", async () => {
    const f = elFile.files?.[0];
    if (!f) return;

    resetAll();

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(f);

    elImg.src = objectUrl;
    elFile.value = "";
  });

  elWrap?.addEventListener("click", (e) => {
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

  elShowResultsBtn?.addEventListener("click", async () => {
    await buildAnnotatedThumbnail();

    const payload = {
      score: 85,
      shots: hits.length,
      elevation: { dir: "DOWN", clicks: 0 },
      windage: { dir: "LEFT", clicks: 1 },
      debug: { distanceYds: 350 }
    };

    localStorage.setItem(KEY_PAYLOAD, JSON.stringify(payload));
    window.location.href = "./sec.html?fresh=" + Date.now();
  });
})();
