/* ============================================================
   docs/index.js — Annotated Thumbnail Build v3 (LOCKED)
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
    return {
      x01: clamp01((clientX - r.left) / r.width),
      y01: clamp01((clientY - r.top) / r.height)
    };
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

    const canvas = document.createElement("canvas");
    canvas.width = wrapRect.width;
    canvas.height = wrapRect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseImg = await loadCurrentImage();
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    const dots = elDots.querySelectorAll(".tapDot");

    dots.forEach(dot => {
      const dotRect = dot.getBoundingClientRect();

      const x = dotRect.left - wrapRect.left + dotRect.width / 2;
      const y = dotRect.top - wrapRect.top + dotRect.height / 2;

      const isAim = dot.classList.contains("tapDotAim");

      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = isAim ? "#67f3a4" : "#b7ff3c";
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = "#000";
      ctx.stroke();
    });

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
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
