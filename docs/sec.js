/* ============================================================
   docs/sec.js — FULL REPLACEMENT (IMAGE EXPORT TIGHTENED)
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
    const padding = 34;
    const innerWidth = width - padding * 2;

    const topRowHeight = 220;
    const correctionHeight = 150;
    const metaHeight = 80;
    const thumbHeight = 720;
    const footerHeight = 34;

    const height =
      padding +
      68 +
      18 +
      topRowHeight +
      14 +
      correctionHeight +
      14 +
      metaHeight +
      14 +
      thumbHeight +
      16 +
      footerHeight +
      padding;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0a1224");
    bg.addColorStop(0.22, "#09101b");
    bg.addColorStop(1, "#06070a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, 520);
    glow.addColorStop(0, "rgba(47,102,255,.18)");
    glow.addColorStop(1, "rgba(47,102,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, 520);

    let y = padding;

    // Header
    ctx.font = "900 58px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "#ff5a58";
    ctx.fillText("S", padding, y);
    const sw = ctx.measureText("S").width;

    ctx.fillStyle = "#eef2f7";
    ctx.fillText("E", padding + sw, y);
    const sew = ctx.measureText("SE").width;

    ctx.fillStyle = "#3b6cff";
    ctx.fillText("C", padding + sew, y);

    ctx.font = "900 22px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.76)";
    const title = "SHOOTER EXPERIENCE CARD";
    const titleWidth = ctx.measureText(title).width;
    ctx.fillText(title, width - padding - titleWidth, y + 14);

    y += 86;

    // Top row
    const gap = 16;
    const leftW = Math.round(innerWidth * 0.55);
    const rightW = innerWidth - leftW - gap;

    fillRoundedRect(ctx, padding, y, leftW, topRowHeight, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);
    fillRoundedRect(ctx, padding + leftW + gap, y, rightW, topRowHeight, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);

    ctx.textAlign = "center";
    ctx.font = "900 16px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.74)";
    ctx.fillText("SMART SCORE", padding + leftW / 2, y + 24);

    const score = Number(payload?.score ?? 0);
    ctx.font = "900 136px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText(String(payload?.score ?? "—"), padding + leftW / 2, y + 54);

    const band = scoreBandColors(score);
    const pillW = band.text === "NEEDS WORK" ? 208 : 146;
    const pillH = 54;
    const pillX = padding + (leftW - pillW) / 2;
    const pillY = y + topRowHeight - 72;

    fillRoundedRect(ctx, pillX, pillY, pillW, pillH, 999, band.bg);

    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = band.fg;
    ctx.fillText(band.text, pillX + pillW / 2, pillY + 14);

    ctx.font = "900 16px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.74)";
    ctx.fillText("OFFICIAL TARGET PARTNER", padding + leftW + gap + rightW / 2, y + 64);

    ctx.font = "900 58px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText(String($("vendorText")?.textContent || "Vendor Not Set"), padding + leftW + gap + rightW / 2, y + 106);

    y += topRowHeight + 14;

    // Correction
    fillRoundedRect(ctx, padding, y, innerWidth, correctionHeight, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);

    ctx.font = "900 16px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.74)";
    ctx.fillText("CORRECTION", width / 2, y + 18);

    fillRoundedRect(ctx, padding + 18, y + 46, innerWidth - 36, 78, 22, "rgba(255,255,255,.04)", "rgba(255,255,255,.10)", 2);

    ctx.font = "1000 64px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText(String($("corrClicksInline")?.textContent || "—"), width / 2, y + 60);

    y += correctionHeight + 14;

    // Meta
    fillRoundedRect(ctx, padding, y, innerWidth, metaHeight, 24, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);

    ctx.font = "900 38px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText(String($("sessionMeta")?.textContent || "—"), width / 2, y + 18);

    y += metaHeight + 14;

    // Thumbnail
    fillRoundedRect(ctx, padding, y, innerWidth, thumbHeight, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);

    ctx.font = "900 16px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.74)";
    ctx.fillText("TARGET THUMBNAIL", width / 2, y + 18);

    const thumbSrc = localStorage.getItem(KEY_IMG) || "";
    if (thumbSrc) {
      try {
        const thumb = await loadImage(thumbSrc);

        const boxX = padding + 18;
        const boxY = y + 46;
        const boxW = innerWidth - 36;
        const boxH = thumbHeight - 64;

        const imgRatio = thumb.width / thumb.height;
        const boxRatio = boxW / boxH;

        let drawW;
        let drawH;
        let drawX;
        let drawY;

        if (imgRatio > boxRatio) {
          drawH = boxH;
          drawW = Math.round(drawH * imgRatio);
          drawX = boxX + Math.round((boxW - drawW) / 2);
          drawY = boxY;
        } else {
          drawW = boxW;
          drawH = Math.round(drawW / imgRatio);
          drawX = boxX;
          drawY = boxY + Math.round((boxH - drawH) / 2);
        }

        fillRoundedRect(ctx, boxX, boxY, boxW, boxH, 22, "rgba(255,255,255,.03)", "rgba(255,255,255,.08)", 2);

        ctx.save();
        roundedRect(ctx, boxX, boxY, boxW, boxH, 22);
        ctx.clip();
        ctx.drawImage(thumb, drawX, drawY, drawW, drawH);
        ctx.restore();
      } catch {}
    }

    y += thumbHeight + 16;

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
