/* ============================================================
   docs/sec.js — FULL REPLACEMENT (IMAGE EXPORT + HISTORY SAFE)
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_IMG = "SCZN3_TARGET_IMG_DATAURL_V1";
  const KEY_HISTORY = "SCZN3_SEC_HISTORY_V1";

  function loadPayload() {
    try {
      const raw = localStorage.getItem(KEY_PAYLOAD);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(KEY_HISTORY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function formatDate(ts) {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleString();
    } catch {
      return "";
    }
  }

  function directionArrow(dir) {
    const d = String(dir || "").toUpperCase();
    if (d === "UP") return "↑";
    if (d === "DOWN") return "↓";
    if (d === "LEFT") return "←";
    if (d === "RIGHT") return "→";
    return "";
  }

  function renderPayload(p) {
    if (!p) return;

    const score = Number(p.score ?? 0);
    $("scoreValue").textContent = String(p.score ?? "—");

    const band = $("scoreBand");
    if (score >= 90) {
      band.textContent = "STRONG";
      band.className = "scoreBand scoreBandGood";
    } else if (score >= 60) {
      band.textContent = "SOLID";
      band.className = "scoreBand scoreBandMid";
    } else {
      band.textContent = "NEEDS WORK";
      band.className = "scoreBand scoreBandLow";
    }

    const elev = Math.round(Number(p?.elevation?.clicks ?? 0));
    const wind = Math.round(Number(p?.windage?.clicks ?? 0));

    const elevDir = directionArrow(p?.elevation?.dir);
    const windDir = directionArrow(p?.windage?.dir);

    $("corrClicksInline").textContent = `Clicks ${elev}${elevDir} • ${wind}${windDir}`;

    const distance = p?.debug?.distanceYds ?? "—";
    const hits = p?.shots ?? "—";
    const time = formatDate(p?.ts);

    $("sessionMeta").textContent = `${distance} yds • ${hits} hits${time ? " • " + time : ""}`;
  }

  function renderThumbnail() {
    const img = $("reportThumb");
    if (!img) return;

    const dataUrl = localStorage.getItem(KEY_IMG);
    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function fillRoundedRect(ctx, x, y, w, h, r, fill, stroke = null) {
    roundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  async function buildSECImageBlob(payload) {
    const history = loadHistory().slice(0, 6); // max 6 rows

    const width = 1400;
    const padding = 40;
    const innerWidth = width - padding * 2;

    const height =
      padding +
      100 +
      260 +
      180 +
      100 +
      820 +
      (history.length ? 260 : 0) +
      80;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0a1224");
    bg.addColorStop(1, "#06070a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    let y = padding;

    // HEADER
    ctx.font = "900 60px system-ui";
    ctx.fillStyle = "#ff5a58";
    ctx.fillText("S", padding, y);
    ctx.fillStyle = "#eef2f7";
    ctx.fillText("E", padding + 36, y);
    ctx.fillStyle = "#3b6cff";
    ctx.fillText("C", padding + 72, y);

    ctx.font = "900 24px system-ui";
    ctx.fillStyle = "#aaa";
    ctx.fillText("SHOOTER EXPERIENCE CARD", width - 420, y + 10);

    y += 100;

    // SCORE CARD
    fillRoundedRect(ctx, padding, y, innerWidth, 260, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.1)");

    ctx.font = "900 140px system-ui";
    ctx.fillStyle = "#eef2f7";
    ctx.textAlign = "center";
    ctx.fillText(payload.score ?? "—", width / 2, y + 160);

    y += 280;

    // CORRECTION
    fillRoundedRect(ctx, padding, y, innerWidth, 180, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.1)");

    ctx.font = "900 60px system-ui";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText($("corrClicksInline").textContent, width / 2, y + 110);

    y += 200;

    // META
    fillRoundedRect(ctx, padding, y, innerWidth, 100, 24, "rgba(255,255,255,.05)", "rgba(255,255,255,.1)");

    ctx.font = "900 36px system-ui";
    ctx.fillText($("sessionMeta").textContent, width / 2, y + 60);

    y += 120;

    // THUMBNAIL
    fillRoundedRect(ctx, padding, y, innerWidth, 820, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.1)");

    const thumbSrc = localStorage.getItem(KEY_IMG);
    if (thumbSrc) {
      try {
        const img = await loadImage(thumbSrc);
        ctx.drawImage(img, padding + 20, y + 20, innerWidth - 40, 780);
      } catch {}
    }

    y += 840;

    // HISTORY (NEW)
    if (history.length) {
      ctx.font = "900 22px system-ui";
      ctx.fillStyle = "#aaa";
      ctx.fillText("SHOOTER HISTORY", width / 2, y);

      y += 40;

      ctx.textAlign = "left";

      history.forEach((h, i) => {
        const line = `${String(i + 1).padStart(2, "0")}   ${h.score ?? "-"}   ${h.hits ?? "-"}   ${formatDate(h.ts)}`;
        ctx.fillText(line, padding + 20, y);
        y += 34;
      });

      ctx.textAlign = "center";
    }

    // EXPORT
    return await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
  }

  async function saveSEC(payload) {
    const blob = await buildSECImageBlob(payload);

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SEC-Card.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function init() {
    const payload = loadPayload();
    if (!payload) return;

    renderPayload(payload);
    renderThumbnail();

    $("saveSecBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      saveSEC(payload);
    });

    $("goHomeBtn")?.addEventListener("click", () => {
      window.location.href = "./";
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
