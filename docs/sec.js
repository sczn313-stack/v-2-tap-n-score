/* ============================================================
   docs/sec.js — FULL REPLACEMENT
   MATCHED TO CURRENT index.js PAYLOAD CONTRACT
   Source-of-truth fields used:
   - score
   - scoreBand
   - scoreDetail
   - shotCount
   - rangeYds
   - windageClicks / windageDir
   - elevationClicks / elevationDir
   - windageUnitValue / elevationUnitValue
   - dialUnit / clickValue
   - dxInches / dyInches
   - groupSizeInches
   - createdAt
============================================================ */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const KEY_PAYLOAD = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_IMG = "SCZN3_TARGET_IMG_DATAURL_V1";
  const KEY_HISTORY = "SCZN3_SEC_HISTORY_V1";
  const KEY_HISTORY_LAST = "SCZN3_SEC_HISTORY_LAST_V1";
  const KEY_VENDOR_NAME = "SCZN3_VENDOR_NAME_V1";
  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";

  const AUTO_SAVE_DELAY_MS = 5000;

  let autoSaveTimer = null;
  let autoSaveAttempted = false;

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

  function saveHistory(history) {
    try {
      localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
    } catch {}
  }

  function formatDate(ts) {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return "—";
    }
  }

  function directionWord(dir) {
    const d = String(dir || "").toUpperCase();
    if (d === "UP") return "UP";
    if (d === "DOWN") return "DOWN";
    if (d === "LEFT") return "LEFT";
    if (d === "RIGHT") return "RIGHT";
    return "—";
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function getScoreBand(score) {
    if (score >= 90) return { label: "STRONG", className: "scoreBand scoreBandGood" };
    if (score >= 60) return { label: "SOLID", className: "scoreBand scoreBandMid" };
    return { label: "NEEDS WORK", className: "scoreBand scoreBandBad" };
  }

  function getHistoryScoreClass(score) {
    if (score >= 90) return "scoreHigh";
    if (score >= 60) return "scoreMid";
    return "scoreLow";
  }

  function getVendorState(payload) {
    const urlFromStorage = String(localStorage.getItem(KEY_VENDOR_URL) || "").trim();
    const nameFromStorage = String(localStorage.getItem(KEY_VENDOR_NAME) || "").trim();

    const url = urlFromStorage || "";
    const name =
      nameFromStorage ||
      (String(payload?.vendor || "").trim() ? String(payload.vendor).trim().toUpperCase() : "Vendor Not Set");

    return { url, name };
  }

  function getSessionSignature(payload) {
    if (!payload) return "";

    return [
      safeNumber(payload.score, 0),
      safeNumber(payload.shotCount, 0),
      round2(safeNumber(payload.rangeYds, 0)),
      round2(safeNumber(payload.elevationClicks, 0)),
      String(payload.elevationDir || ""),
      round2(safeNumber(payload.windageClicks, 0)),
      String(payload.windageDir || ""),
      round2(safeNumber(payload.dxInches, 0)),
      round2(safeNumber(payload.dyInches, 0))
    ].join("|");
  }

  function renderVendor(payload) {
    const btn = $("vendorBtn");
    const text = $("vendorText");
    if (!btn || !text) return;

    const { url, name } = getVendorState(payload);
    text.textContent = name;

    if (url) {
      btn.href = url;
      btn.classList.remove("vendorDisabled");
    } else {
      btn.href = "#";
      btn.classList.add("vendorDisabled");
    }
  }

  function renderPayload(payload) {
    if (!payload) return;

    const score = safeNumber(payload.score, 0);
    const scoreEl = $("scoreValue");
    const bandEl = $("scoreBand");
    const corrEl = $("corrClicksInline");
    const metaEl = $("sessionMeta");

    if (scoreEl) {
      scoreEl.textContent = String(score);
    }

    if (bandEl) {
      const band =
        payload.scoreBand
          ? {
              label: String(payload.scoreBand || "—"),
              className:
                String(payload.scoreBand).toUpperCase() === "STRONG"
                  ? "scoreBand scoreBandGood"
                  : String(payload.scoreBand).toUpperCase() === "IMPROVING" ||
                    String(payload.scoreBand).toUpperCase() === "SOLID"
                  ? "scoreBand scoreBandMid"
                  : "scoreBand scoreBandBad"
            }
          : getScoreBand(score);

      bandEl.textContent = band.label;
      bandEl.className = band.className;
    }

    const elevClicks = round2(safeNumber(payload.elevationClicks, 0));
    const windClicks = round2(safeNumber(payload.windageClicks, 0));

    if (corrEl) {
      corrEl.innerHTML = `
        <span class="corrGroup">
          <span class="corrNum">${elevClicks}</span>
          <span class="corrDir corrDirVertical">${directionWord(payload.elevationDir)}</span>
        </span>
        <span class="corrDivider">•</span>
        <span class="corrGroup">
          <span class="corrNum">${windClicks}</span>
          <span class="corrDir corrDirHorizontal">${directionWord(payload.windageDir)}</span>
        </span>
      `;
    }

    if (metaEl) {
      const parts = [
        `${round2(safeNumber(payload.rangeYds, 0))} yds`,
        `${safeNumber(payload.shotCount, 0)} hits`,
        `${round2(safeNumber(payload.groupSizeInches, 0))}" group`
      ];
      metaEl.textContent = parts.join(" • ");
    }
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

  function updateHistory(payload) {
    if (!payload) return;

    const signature = getSessionSignature(payload);
    const lastSignature = localStorage.getItem(KEY_HISTORY_LAST) || "";

    if (signature && signature === lastSignature) {
      return;
    }

    const history = loadHistory();

    const entry = {
      score: safeNumber(payload.score, 0),
      hits: safeNumber(payload.shotCount, 0),
      yds: round2(safeNumber(payload.rangeYds, 0)),
      ts: Date.now()
    };

    history.unshift(entry);
    saveHistory(history.slice(0, 10));

    if (signature) {
      localStorage.setItem(KEY_HISTORY_LAST, signature);
    }
  }

  function renderHistory() {
    const grid = $("historyGrid");
    const empty = $("historyEmpty");
    if (!grid) return;

    const history = loadHistory();
    grid.innerHTML = "";

    if (!history.length) {
      if (empty) empty.style.display = "block";
      grid.style.display = "none";
      return;
    }

    if (empty) empty.style.display = "none";
    grid.style.display = "grid";

    const ordered = history.slice(0, 10);

    ordered.forEach((h, i) => {
      const card = document.createElement("div");
      card.className = "historyCard";

      const scoreClass = getHistoryScoreClass(safeNumber(h.score, 0));

      card.innerHTML = `
        <div class="historyRow">
          <span class="hIndex">${String(i + 1)}</span>
          <span class="hScore ${scoreClass}">${safeNumber(h.score, 0)}</span>
          <span class="hYds">${h.yds ?? "—"}</span>
          <span class="hHits">${h.hits ?? "—"}</span>
        </div>
        <div class="hDate">${formatDate(h.ts)}</div>
      `;

      grid.appendChild(card);
    });
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    const lines = [];

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }

    if (line) lines.push(line);

    lines.forEach((ln, i) => {
      ctx.fillText(ln, x, y + i * lineHeight);
    });
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function containRect(srcW, srcH, maxW, maxH) {
    const ratio = Math.min(maxW / srcW, maxH / srcH);
    return {
      w: Math.max(1, Math.round(srcW * ratio)),
      h: Math.max(1, Math.round(srcH * ratio))
    };
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  async function buildSecBlob(payload) {
    const width = 1400;
    const height = 1800;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#0a1224");
    bgGrad.addColorStop(0.25, "#09101b");
    bgGrad.addColorStop(1, "#06070a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const radial = ctx.createRadialGradient(width / 2, 120, 80, width / 2, 120, 620);
    radial.addColorStop(0, "rgba(47,102,255,0.22)");
    radial.addColorStop(1, "rgba(47,102,255,0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    const pad = 72;
    const cardX = pad;
    const cardY = 120;
    const cardW = width - pad * 2;
    const cardH = height - 220;

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, cardX, cardY, cardW, cardH, 34, true, false);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cardY, cardW, cardH, 34, false, true);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 70px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("SEC", cardX + 50, cardY + 92);

    ctx.fillStyle = "rgba(238,242,247,0.76)";
    ctx.font = "900 28px system-ui, -apple-system, Segoe UI, Arial";
    ctx.textAlign = "right";
    ctx.fillText("Shooter Experience Card", cardX + cardW - 50, cardY + 88);
    ctx.textAlign = "left";

    const score = safeNumber(payload?.score, 0);
    const band = payload?.scoreBand
      ? getScoreBand(
          String(payload.scoreBand).toUpperCase() === "STRONG"
            ? 95
            : String(payload.scoreBand).toUpperCase() === "IMPROVING" ||
              String(payload.scoreBand).toUpperCase() === "SOLID"
            ? 70
            : 30
        )
      : getScoreBand(score);
    const history = loadHistory();
    const vendor = getVendorState(payload);

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("YOUR SCORE", cardX + 54, cardY + 155);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 150px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(score), cardX + 54, cardY + 305);

    const pillX = cardX + 54;
    const pillY = cardY + 332;
    const pillW = 240;
    const pillH = 56;
    const bandFill =
      safeNumber(score, 0) >= 90 ? "#48ff8b" :
      safeNumber(score, 0) >= 60 ? "#ffe466" :
      "#ff6e64";

    ctx.fillStyle = bandFill;
    roundRect(ctx, pillX, pillY, pillW, pillH, 28, true, false);

    ctx.fillStyle =
      safeNumber(score, 0) >= 90 ? "#06140b" :
      safeNumber(score, 0) >= 60 ? "#191300" :
      "#220504";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(payload?.scoreBand || band.label), pillX + pillW / 2, pillY + 37);
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("SCOPE CORRECTION", cardX + 54, cardY + 455);

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, cardX + 54, cardY + 480, 540, 98, 20, true, true);

    const elev = round2(safeNumber(payload?.elevationClicks, 0));
    const wind = round2(safeNumber(payload?.windageClicks, 0));

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(elev), cardX + 84, cardY + 544);

    ctx.fillStyle = "#5ca8ff";
    ctx.font = "900 42px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(directionWord(payload?.elevationDir), cardX + 152, cardY + 544);

    ctx.fillStyle = "rgba(238,242,247,0.58)";
    ctx.font = "900 34px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("•", cardX + 304, cardY + 544);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(String(wind), cardX + 360, cardY + 544);

    ctx.fillStyle = "#ff8b96";
    ctx.font = "900 42px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(directionWord(payload?.windageDir), cardX + 428, cardY + 544);

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("SESSION", cardX + 54, cardY + 655);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 36px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText(
      `${round2(safeNumber(payload?.rangeYds, 0))} yds • ${safeNumber(payload?.shotCount, 0)} hits`,
      cardX + 54,
      cardY + 708
    );

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("OFFICIAL TARGET PARTNER", cardX + 660, cardY + 155);

    ctx.fillStyle = "#eef2f7";
    ctx.font = "900 40px system-ui, -apple-system, Segoe UI, Arial";
    wrapText(ctx, vendor.name || "Vendor Not Set", cardX + 660, cardY + 210, 500, 48);

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("TARGET THUMBNAIL", cardX + 660, cardY + 340);

    const thumbX = cardX + 660;
    const thumbY = cardY + 370;
    const thumbW = 490;
    const thumbH = 370;

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, thumbX, thumbY, thumbW, thumbH, 22, true, true);

    const thumbSrc = localStorage.getItem(KEY_IMG) || "";
    const thumbImg = await loadImage(thumbSrc);

    if (thumbImg) {
      const fit = containRect(thumbImg.width, thumbImg.height, thumbW - 24, thumbH - 24);
      const dx = thumbX + 12 + (thumbW - 24 - fit.w) / 2;
      const dy = thumbY + 12 + (thumbH - 24 - fit.h) / 2;
      ctx.drawImage(thumbImg, dx, dy, fit.w, fit.h);
    } else {
      ctx.fillStyle = "rgba(238,242,247,0.36)";
      ctx.font = "800 28px system-ui, -apple-system, Segoe UI, Arial";
      ctx.textAlign = "center";
      ctx.fillText("No thumbnail available", thumbX + thumbW / 2, thumbY + thumbH / 2);
      ctx.textAlign = "left";
    }

    ctx.fillStyle = "rgba(238,242,247,0.72)";
    ctx.font = "900 24px system-ui, -apple-system, Segoe UI, Arial";
    ctx.fillText("SESSION HISTORY", cardX + 54, cardY + 840);

    const histBoxX = cardX + 54;
    const histBoxY = cardY + 870;
    const histBoxW = cardW - 108;
    const histBoxH = 520;

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, histBoxX, histBoxY, histBoxW, histBoxH, 22, true, true);

    ctx.fillStyle = "rgba(238,242,247,0.62)";
    ctx.font = "900 20px system-ui, -apple-system, Segoe UI, Arial";
    const leftX = histBoxX + 28;
    const rightX = histBoxX + histBoxW / 2 + 14;

    ctx.fillText("#", leftX, histBoxY + 40);
    ctx.fillText("SCORE", leftX + 52, histBoxY + 40);
    ctx.fillText("YARDS", leftX + 190, histBoxY + 40);
    ctx.fillText("HITS", leftX + 325, histBoxY + 40);

    ctx.fillText("#", rightX, histBoxY + 40);
    ctx.fillText("SCORE", rightX + 52, histBoxY + 40);
    ctx.fillText("YARDS", rightX + 190, histBoxY + 40);
    ctx.fillText("HITS", rightX + 325, histBoxY + 40);

    const recent = history.slice(0, 10);

    recent.forEach((item, idx) => {
      const col = idx < 5 ? 0 : 1;
      const row = idx < 5 ? idx : idx - 5;
      const x = col === 0 ? leftX : rightX;
      const y = histBoxY + 94 + row * 86;

      ctx.fillStyle = "#5f86ff";
      ctx.font = "900 34px system-ui, -apple-system, Segoe UI, Arial";
      ctx.fillText(String(idx + 1), x, y);

      const scoreClass = getHistoryScoreClass(safeNumber(item.score, 0));
      ctx.fillStyle =
        scoreClass === "scoreHigh" ? "#48ff8b" :
        scoreClass === "scoreMid" ? "#ffe466" :
        "#ff6e64";
      ctx.fillText(String(safeNumber(item.score, 0)), x + 52, y);

      ctx.fillStyle = "#eef2f7";
      ctx.fillText(String(item.yds ?? "—"), x + 190, y);
      ctx.fillText(String(item.hits ?? "—"), x + 325, y);

      ctx.fillStyle = "rgba(238,242,247,0.62)";
      ctx.font = "800 20px system-ui, -apple-system, Segoe UI, Arial";
      ctx.fillText(formatDate(item.ts), x, y + 32);
    });

    ctx.fillStyle = "rgba(238,242,247,0.46)";
    ctx.font = "800 18px system-ui, -apple-system, Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Faith • Order • Precision", width / 2, height - 48);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) throw new Error("PNG export failed");
    return blob;
  }

  async function shareOrSaveBlob(blob, filename) {
    const file = new File([blob], filename, { type: "image/png" });

    if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "SEC Export",
          text: "Save SEC to Photos or Files"
        });
        return { ok: true, mode: "share" };
      } catch (err) {
        if (err && err.name === "AbortError") {
          return { ok: false, canceled: true };
        }
      }
    }

    try {
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      const win = window.open(objectUrl, "_blank", "noopener,noreferrer");
      if (win) {
        setTimeout(() => {
          try { win.focus(); } catch {}
        }, 120);
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      return { ok: false, fallback: true };
    } catch {
      return { ok: false };
    }
  }

  async function handleSaveSec(payload) {
    try {
      const blob = await buildSecBlob(payload);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `SEC-${stamp}.png`;
      return await shareOrSaveBlob(blob, filename);
    } catch (err) {
      console.error(err);
      return { ok: false };
    }
  }

  function showSaveFallback() {
    const btn = $("saveFallbackBtn");
    if (!btn) return;
    btn.style.display = "inline-flex";
  }

  function scheduleAutoSave(payload) {
    if (!payload || autoSaveAttempted) return;
    autoSaveTimer = window.setTimeout(async () => {
      autoSaveAttempted = true;
      const result = await handleSaveSec(payload);
      if (!result || !result.ok) {
        showSaveFallback();
      }
    }, AUTO_SAVE_DELAY_MS);
  }

  function clearAutoSaveTimer() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  function wireActions(payload) {
    $("saveFallbackBtn")?.addEventListener("click", async (e) => {
      e.preventDefault();
      const result = await handleSaveSec(payload);
      if (!result || !result.ok) {
        showSaveFallback();
      }
    });

    $("backBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      clearAutoSaveTimer();
      window.history.back();
    });

    $("goHomeBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      clearAutoSaveTimer();
      window.location.href = "./?fresh=" + Date.now();
    });

    $("surveyBtn")?.addEventListener("click", (e) => {
      const href = String(e.currentTarget.getAttribute("href") || "").trim();
      if (!href || href === "#") {
        e.preventDefault();
      }
    });
  }

  function init() {
    const payload = loadPayload();

    renderPayload(payload);
    renderVendor(payload);
    renderThumbnail();
    updateHistory(payload);
    renderHistory();
    wireActions(payload);
    scheduleAutoSave(payload);
  }

  window.addEventListener("beforeunload", clearAutoSaveTimer);

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
