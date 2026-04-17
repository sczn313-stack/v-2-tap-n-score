/* ============================================================
   docs/save.js — NEW FILE
   EXPORT / SAVE ONLY
============================================================ */

(() => {
  "use strict";

  window.SCZN3 = window.SCZN3 || {};

  function getCtx() {
    return {
      els: window.SCZN3.els,
      state: window.SCZN3.state,
      sec: window.SCZN3.sec
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function fillVerticalGradient(ctx, width, height) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#071743");
    grad.addColorStop(0.42, "#041652");
    grad.addColorStop(1, "#02103d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function finishSaveCanvas(ctx, canvas, values, state, sec) {
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("SCOPE CORRECTION", 80, 560);

    roundRect(ctx, 80, 600, 700, 130, 24);
    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 70px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.elevCount, 120, 685);

    ctx.fillStyle = "#69a8ff";
    ctx.font = "900 62px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.elevDir, 180, 685);

    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.font = "900 50px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("•", 420, 680);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 70px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.windCount, 500, 685);

    ctx.fillStyle = "#ff7987";
    ctx.font = "900 62px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.windDir, 560, 685);

    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("SESSION", 80, 850);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 58px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.session, 80, 920);

    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("SESSION HISTORY", 80, 1100);

    roundRect(ctx, 80, 1140, 1440, 90, 18);
    ctx.fillStyle = "rgba(255,255,255,.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 30px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(`Avg: ${values.avg}`, 110, 1198);
    ctx.fillText(`Best: ${values.best}`, 320, 1198);
    ctx.fillText(`Trend: ${values.trend}`, 560, 1198);

    const items = sec.loadHistory();
    const y = 1260;
    const col1X = 80;
    const col2X = 805;
    const cardW = 635;
    const cardH = 145;

    items.slice(0, 10).forEach((item, i) => {
      const colX = i < 5 ? col1X : col2X;
      const rowIndex = i < 5 ? i : i - 5;
      const cardY = y + rowIndex * (cardH + 20);

      roundRect(ctx, colX, cardY, cardW, cardH, 18);
      ctx.fillStyle = "rgba(255,255,255,.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "rgba(184,197,234,1)";
      ctx.font = "900 18px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
      ctx.fillText(`#${i + 1}`, colX + 20, cardY + 30);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 24px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
      ctx.fillText(`Score ${item.score}`, colX + 20, cardY + 66);
      ctx.fillText(`${item.shots} Hits`, colX + 220, cardY + 66);
      ctx.fillText(item.windage, colX + 20, cardY + 102);
      ctx.fillText(item.elevation, colX + 20, cardY + 132);
    });

    const link = document.createElement("a");
    link.download = `sczn3-sec-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function save() {
    const { els, state, sec } = getCtx();

    const values = {
      score: String(els.secScore?.textContent || "0"),
      band: String(els.secScoreBand?.textContent || "SOLID"),
      elevCount: String(els.secElevationCount?.textContent || "0"),
      elevDir: String(els.secElevationDir?.textContent || "UP"),
      windCount: String(els.secWindageCount?.textContent || "0"),
      windDir: String(els.secWindageDir?.textContent || "RIGHT"),
      session: String(els.secSessionLine?.textContent || "—"),
      vendor: String(els.secVendorName?.textContent || "Vendor Not Set"),
      avg: String(els.historyAvg?.textContent || "—"),
      best: String(els.historyBest?.textContent || "—"),
      trend: String(els.historyTrend?.textContent || "—")
    };

    const width = 1600;
    const height = 2200;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    fillVerticalGradient(ctx, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, 40, 40, width - 80, height - 80, 32);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "900 76px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("SEC", 80, 110);

    ctx.font = "800 32px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.fillText("Shooter Experience Card", width - 520, 110);

    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.fillText("YOUR SCORE", 80, 210);

    ctx.font = "900 160px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(values.score, 80, 360);

    const band = sec.getScoreBand(Number(values.score) || 0);
    roundRect(ctx, 80, 395, 250, 70, 35);
    ctx.fillStyle = band.bg;
    ctx.fill();
    ctx.fillStyle = band.fg;
    ctx.font = "900 34px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.band, 130, 442);

    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("OFFICIAL TARGET PARTNER", 840, 210);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 58px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText(values.vendor, 840, 280);

    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Segoe UI, Arial";
    ctx.fillText("TARGET THUMBNAIL", 840, 420);

    roundRect(ctx, 840, 460, 620, 360, 28);
    ctx.fillStyle = "rgba(255,255,255,.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (state.imageSrc) {
      const img = new Image();
      img.onload = () => {
        const boxX = 840;
        const boxY = 460;
        const boxW = 620;
        const boxH = 360;

        const scale = Math.min((boxW - 40) / img.width, (boxH - 40) / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const drawX = boxX + (boxW - drawW) / 2;
        const drawY = boxY + (boxH - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        finishSaveCanvas(ctx, canvas, values, state, sec);
      };
      img.src = state.imageSrc;
      return;
    }

    finishSaveCanvas(ctx, canvas, values, state, sec);
  }

  window.SCZN3.save = {
    roundRect,
    fillVerticalGradient,
    fitValueText: null,
    save,
    finishSaveCanvas
  };
})();
