/* ============================================================
   docs/sec.js — FULL REPLACEMENT (IMAGE EXPORT)
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_IMG = "SCZN3_TARGET_IMG_DATAURL_V1";

  function loadPayload() {
    try {
      const raw = localStorage.getItem(KEY_PAYLOAD);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function renderNoData() {
    $("scoreValue").textContent = "—";
    $("scoreBand").textContent = "NO DATA";
    $("scoreBand").className = "scoreBand scoreBandNeutral";
    $("corrClicksInline").textContent = "—";
    $("sessionMeta").textContent = "No session data";
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
      band.className = "scoreBand scoreBandBad";
    }

    const elevationClicks = Number(p?.elevation?.clicks ?? 0);
    const elevationDir = String(p?.elevation?.dir ?? "");
    const windageClicks = Number(p?.windage?.clicks ?? 0);
    const windageDir = String(p?.windage?.dir ?? "");

    const elevRounded = Math.round(elevationClicks);
    const windRounded = Math.round(windageClicks);

    const elevText = `${elevRounded}${elevationDir ? directionArrow(elevationDir) : ""}`;
    const windText = `${windRounded}${windageDir ? directionArrow(windageDir) : ""}`;

    $("corrClicksInline").textContent = `Clicks ${elevText} • ${windText}`;

    const distanceYds = p?.debug?.distanceYds ?? "—";
    const hits = p?.shots ?? "—";
    $("sessionMeta").textContent = `${distanceYds} yds • ${hits} hits`;
  }

  function renderThumbnail() {
    const img = $("reportThumb");
    if (!img) return;

    const dataUrl = localStorage.getItem(KEY_IMG);

    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = "block";
    } else {
      img.removeAttribute("src");
      img.style.display = "none";
    }
  }

  function wireVendor(payload) {
    const btn = $("vendorBtn");
    const text = $("vendorText");
    if (!btn || !text) return;

    const url = String(payload?.vendorUrl || "").trim();

    if (url && /^https?:\/\//i.test(url)) {
      btn.href = url;
      btn.classList.remove("vendorDisabled");
      text.textContent = "Visit Partner";
    } else {
      btn.href = "#";
      btn.classList.add("vendorDisabled");
      text.textContent = "Vendor Not Set";
      btn.addEventListener("click", (e) => e.preventDefault(), { once: true });
    }
  }

  function wireSurvey(payload) {
    const btn = $("surveyBtn");
    if (!btn) return;

    const url = String(payload?.surveyUrl || "").trim();

    if (url && /^https?:\/\//i.test(url)) {
      btn.href = url;
      btn.style.pointerEvents = "auto";
      btn.style.opacity = "1";
    } else {
      btn.href = "#";
      btn.style.pointerEvents = "none";
      btn.style.opacity = ".55";
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

  function fillRoundedRect(ctx, x, y, w, h, r, fillStyle, strokeStyle = null, lineWidth = 1) {
    roundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    if (strokeStyle) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    }
  }

  function scoreBandColors(score) {
    if (score >= 90) {
      return { bg: "#48ff8b", fg: "#06140b", text: "STRONG" };
    }
    if (score >= 60) {
      return { bg: "#ffe466", fg: "#191300", text: "SOLID" };
    }
    return { bg: "#ff6e64", fg: "#220504", text: "NEEDS WORK" };
  }

  async function buildSECImageBlob(payload) {
    const width = 1400;
    const padding = 42;
    const innerWidth = width - padding * 2;

    const topRowHeight = 250;
    const correctionHeight = 170;
    const metaHeight = 90;
    const thumbHeight = 820;
    const footerHeight = 44;

    const height =
      padding +
      72 +
      28 +
      topRowHeight +
      20 +
      correctionHeight +
      20 +
      metaHeight +
      20 +
      thumbHeight +
      24 +
      footerHeight +
      padding;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0a1224");
    bg.addColorStop(0.22, "#09101b");
    bg.addColorStop(1, "#06070a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, 520);
    glow.addColorStop(0, "rgba(47,102,255,.20)");
    glow.addColorStop(1, "rgba(47,102,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, 520);

    let y = padding;

    // Header
    ctx.textBaseline = "top";
    ctx.font = "900 62px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "#ff5a58";
    ctx.fillText("S", padding, y);
    const sw = ctx.measureText("S").width;
    ctx.fillStyle = "#eef2f7";
    ctx.fillText("E", padding + sw, y);
    const sew = ctx.measureText("SE").width;
    ctx.fillStyle = "#3b6cff";
    ctx.fillText("C", padding + sew, y);

    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.76)";
    const title = "SHOOTER EXPERIENCE CARD";
    const titleWidth = ctx.measureText(title).width;
    ctx.fillText(title, width - padding - titleWidth, y + 16);

    y += 100;

    // Top row
    const gap = 18;
    const leftW = Math.round(innerWidth * 0.55);
    const rightW = innerWidth - leftW - gap;

    fillRoundedRect(ctx, padding, y, leftW, topRowHeight, 32, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);
    fillRoundedRect(ctx, padding + leftW + gap, y, rightW, topRowHeight, 32, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);

    ctx.font = "900 18px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.74)";
    ctx.textAlign = "center";
    ctx.fillText("SMART SCORE", padding + leftW / 2, y + 28);

    const score = Number(payload?.score ?? 0);
    ctx.font = "900 150px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText(String(payload?.score ?? "—"), padding + leftW / 2, y + 62);

    const band = scoreBandColors(score);
    const pillW = band.text === "NEEDS WORK" ? 220 : 150;
    const pillH = 56;
    const pillX = padding + (leftW - pillW) / 2;
    const pillY = y + topRowHeight - 78;
    fillRoundedRect(ctx, pillX, pillY, pillW, pillH, 999, band.bg);
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = band.fg;
    ctx.fillText(band.text, pillX + pillW / 2, pillY + 14);

    ctx.font = "900 18px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.74)";
    ctx.fillText("OFFICIAL TARGET PARTNER", padding + leftW + gap + rightW / 2, y + 76);

    ctx.font = "900 60px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText(String($("vendorText")?.textContent || "Vendor Not Set"), padding + leftW + gap + rightW / 2, y + 118);

    y += topRowHeight + 20;

    // Correction
    fillRoundedRect(ctx, padding, y, innerWidth, correctionHeight, 32, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);
    ctx.font = "900 18px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.74)";
    ctx.fillText("CORRECTION", width / 2, y + 22);

    fillRoundedRect(ctx, padding + 20, y + 56, innerWidth - 40, 86, 24, "rgba(255,255,255,.04)", "rgba(255,255,255,.10)", 2);
    ctx.font = "1000 68px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText(String($("corrClicksInline")?.textContent || "—"), width / 2, y + 74);

    y += correctionHeight + 20;

    // Meta
    fillRoundedRect(ctx, padding, y, innerWidth, metaHeight, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);
    ctx.font = "900 42px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText(String($("sessionMeta")?.textContent || "—"), width / 2, y + 22);

    y += metaHeight + 20;

    // Thumbnail card
    fillRoundedRect(ctx, padding, y, innerWidth, thumbHeight, 32, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);
    ctx.font = "900 18px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.74)";
    ctx.fillText("TARGET THUMBNAIL", width / 2, y + 22);

    const thumbSrc = localStorage.getItem(KEY_IMG) || "";
    if (thumbSrc) {
      try {
        const thumb = await loadImage(thumbSrc);
        const boxX = padding + 24;
        const boxY = y + 60;
        const boxW = innerWidth - 48;
        const boxH = thumbHeight - 84;

        const scale = Math.min(boxW / thumb.width, boxH / thumb.height);
        const drawW = Math.round(thumb.width * scale);
        const drawH = Math.round(thumb.height * scale);
        const drawX = boxX + Math.round((boxW - drawW) / 2);
        const drawY = boxY + Math.round((boxH - drawH) / 2);

        fillRoundedRect(ctx, boxX, boxY, boxW, boxH, 24, "rgba(255,255,255,.03)", "rgba(255,255,255,.08)", 2);
        ctx.save();
        roundedRect(ctx, boxX, boxY, boxW, boxH, 24);
        ctx.clip();
        ctx.drawImage(thumb, drawX, drawY, drawW, drawH);
        ctx.restore();
      } catch {}
    }

    y += thumbHeight + 24;

    // Footer
    ctx.font = "800 18px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.62)";
    ctx.fillText("Tap-n-Score™ • Shooter Experience Card", width / 2, y);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not create SEC image");
    return blob;
  }

  async function saveSEC(payload) {
    try {
      const blob = await buildSECImageBlob(payload);
      const file = new File([blob], "SEC-Card.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "SEC Card",
          text: "Shooter Experience Card"
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SEC-Card.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(err);
      alert("Save SEC could not complete on this device.");
    }
  }

  function goHome() {
    try {
      window.location.href = "./?fresh=" + Date.now();
    } catch {
      window.location.href = "./";
    }
  }

  function wireActions(payload) {
    const saveBtn = $("saveSecBtn");
    const homeBtn = $("goHomeBtn");

    saveBtn?.addEventListener("click", async (e) => {
      e.preventDefault();
      await saveSEC(payload);
    });

    homeBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      goHome();
    });

    wireVendor(payload);
    wireSurvey(payload);
  }

  function init() {
    const payload = loadPayload();

    if (!payload) {
      renderNoData();
      renderThumbnail();
      wireActions(null);
      return;
    }

    renderPayload(payload);
    renderThumbnail();
    wireActions(payload);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
