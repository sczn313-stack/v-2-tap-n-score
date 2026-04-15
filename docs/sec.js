/* ============================================================
   docs/sec.js — FULL REPLACEMENT
   LIVE SEC PAGE
   - reads current payload from localStorage
   - renders live SEC page
   - Save as Picture creates SEC image on demand
   - Back returns to prior page
   - Zero Another Target clears payload + target image and returns home
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
    if (score >= 60) return { label: "IMPROVING", className: "scoreBand scoreBandMid" };
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
      (String(payload?.vendor || "").trim()
        ? String(payload.vendor).trim().toUpperCase()
        : "Vendor Not Set");

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

    if (scoreEl) scoreEl.textContent = String(score);

    if (bandEl) {
      const band = payload.scoreBand
        ? {
            label: String(payload.scoreBand || "—"),
            className:
              String(payload.scoreBand).toUpperCase() === "STRONG"
                ? "scoreBand scoreBandGood"
                : String(payload.scoreBand).toUpperCase() === "IMPROVING"
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
      metaEl.textContent = [
        `${round2(safeNumber(payload.rangeYds, 0))} yds`,
        `${safeNumber(payload.shotCount, 0)} hits`,
        `${round2(safeNumber(payload.groupSizeInches, 0))}" group`
      ].join(" • ");
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
    if (signature && signature === lastSignature) return;

    const history = loadHistory();
    history.unshift({
      score: safeNumber(payload.score, 0),
      hits: safeNumber(payload.shotCount, 0),
      yds: round2(safeNumber(payload.rangeYds, 0)),
      ts: Date.now()
    });

    saveHistory(history.slice(0, 10));
    if (signature) localStorage.setItem(KEY_HISTORY_LAST, signature);
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

    history.slice(0, 10).forEach((h, i) => {
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

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function bgForScore(ctx, width, height, score) {
    const g = ctx.createLinearGradient(0, 0, width, height);
    if (score >= 90) {
      g.addColorStop(0, "#0c2d18");
      g.addColorStop(1, "#102418");
    } else if (score >= 60) {
      g.addColorStop(0, "#3b2d0f");
      g.addColorStop(1, "#231c0d");
    } else {
      g.addColorStop(0, "#381315");
      g.addColorStop(1, "#200d0f");
    }
    return g;
  }

  async function buildSecImageBlob(payload) {
    const width = 1400;
    const height = 2200;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bgForScore(ctx, width, height, payload.score);
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 24; i++) {
      const y = 120 + i * 84;
      ctx.fillRect(70, y, width - 140, 1);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 54px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("SCZN3 • Shooter Experience Card", 80, 110);

    ctx.font = "700 165px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(String(payload.score), 80, 280);

    ctx.font = "700 52px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(payload.scoreBand, 320, 220);
    ctx.font = "400 36px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(payload.scoreDetail, 320, 275);

    drawRoundedRect(ctx, 80, 340, width - 160, 640, 32);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();

    const imageSrc = String(localStorage.getItem(KEY_IMG) || "");
    if (imageSrc) {
      try {
        const shotImg = await loadImage(imageSrc);
        if (shotImg) {
          const boxX = 110;
          const boxY = 375;
          const boxW = width - 220;
          const boxH = 570;

          const scale = Math.min(boxW / shotImg.width, boxH / shotImg.height);
          const drawW = shotImg.width * scale;
          const drawH = shotImg.height * scale;
          const drawX = boxX + (boxW - drawW) / 2;
          const drawY = boxY + (boxH - drawH) / 2;

          ctx.drawImage(shotImg, drawX, drawY, drawW, drawH);

          const px = (pctX, pctY) => ({
            x: drawX + pctX * drawW,
            y: drawY + pctY * drawH
          });

          if (payload.aim) {
            const a = px(payload.aim.xPct, payload.aim.yPct);
            ctx.strokeStyle = "#69b7ff";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(a.x - 18, a.y);
            ctx.lineTo(a.x + 18, a.y);
            ctx.moveTo(a.x, a.y - 18);
            ctx.lineTo(a.x, a.y + 18);
            ctx.stroke();
          }

          payload.hits.forEach((hit, idx) => {
            const p = px(hit.xPct, hit.yPct);
            ctx.fillStyle = "#ff4d5d";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.font = "700 22px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
            ctx.fillText(String(idx + 1), p.x + 16, p.y + 8);
          });

          const c = px(payload.centroidXPct, payload.centroidYPct);
          ctx.strokeStyle = "#ffd34d";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(c.x - 20, c.y - 20);
          ctx.lineTo(c.x + 20, c.y + 20);
          ctx.moveTo(c.x + 20, c.y - 20);
          ctx.lineTo(c.x - 20, c.y + 20);
          ctx.stroke();
        }
      } catch {}
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 46px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("Scope Adjustments", 80, 1060);

    const lines = [
      `Windage: ${payload.windageClicks.toFixed(2)} clicks ${payload.windageDir}`,
      `Elevation: ${payload.elevationClicks.toFixed(2)} clicks ${payload.elevationDir}`,
      `Offset: ${Math.abs(payload.dxInches).toFixed(2)}" ${payload.dxInches > 0 ? "right" : payload.dxInches < 0 ? "left" : "center"} • ${Math.abs(payload.dyInches).toFixed(2)}" ${payload.dyInches > 0 ? "low" : payload.dyInches < 0 ? "high" : "center"}`,
      `${payload.dialUnit}: ${payload.windageUnitValue.toFixed(2)} / ${payload.elevationUnitValue.toFixed(2)} • Click value ${payload.clickValue.toFixed(2)}`,
      `Distance: ${payload.rangeYds.toFixed(2)} yd • Shots: ${payload.shotCount}`,
      `Group Size: ${payload.groupSizeInches.toFixed(2)}"`
    ];

    ctx.font = "500 40px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    lines.forEach((line, idx) => {
      ctx.fillText(line, 80, 1140 + idx * 76);
    });

    drawRoundedRect(ctx, 80, 1640, width - 160, 260, 28);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 40px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("Confirmation", 110, 1710);
    ctx.font = "500 34px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("Adjust scope as indicated, then re-fire to confirm zero.", 110, 1775);
    ctx.fillText(`Vendor: ${(localStorage.getItem(KEY_VENDOR_NAME) || "Official Target Partner").trim()}`, 110, 1840);

    ctx.font = "400 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillText(`Generated ${new Date(payload.createdAt).toLocaleString()}`, 80, 2060);
    ctx.fillText("Faith • Order • Precision", 80, 2110);

    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1);
    });
  }

  async function saveSECImage(payload) {
    try {
      const blob = await buildSecImageBlob(payload);
      if (!blob) return false;

      const file = new File([blob], `SCZN3_SEC_${Date.now()}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "SCZN3 SEC",
          text: "Shooter Experience Card"
        });
        return true;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SCZN3_SEC_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  function clearForNewTarget() {
    try {
      localStorage.removeItem(KEY_PAYLOAD);
      localStorage.removeItem(KEY_IMG);
      localStorage.removeItem(KEY_HISTORY_LAST);
    } catch {}
  }

  function wireActions(payload) {
    const saveBtn = $("saveFallbackBtn");
    const backBtn = $("backBtn");
    const goHomeBtn = $("goHomeBtn");
    const surveyBtn = $("surveyBtn");

    if (saveBtn) {
      saveBtn.style.display = "inline-flex";
      saveBtn.textContent = "Save as Picture";
      saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await saveSECImage(payload);
      });
    }

    backBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      window.history.back();
    });

    goHomeBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      clearForNewTarget();
      window.location.href = `./?cb=${Date.now()}`;
    });

    surveyBtn?.addEventListener("click", (e) => {
      const href = String(e.currentTarget.getAttribute("href") || "").trim();
      if (!href || href === "#") e.preventDefault();
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
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
