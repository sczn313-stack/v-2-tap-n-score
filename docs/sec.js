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

  function saveHistory(history) {
    try {
      localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
    } catch {}
  }

  function normalizeTs(value) {
    if (!value) return "";

    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString();
    } catch {
      return "";
    }
  }

  function formatDate(ts) {
    if (!ts) return "";

    try {
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
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

  function renderNoData() {
    $("scoreValue").textContent = "—";
    $("scoreBand").textContent = "NO DATA";
    $("scoreBand").className = "scoreBand scoreBandNeutral";
    $("corrClicksInline").textContent = "—";
    $("sessionMeta").textContent = "No session data";
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
      img.removeAttribute("src");
      img.style.display = "none";
    }
  }

  function scoreClass(score) {
    const n = Number(score ?? 0);
    if (n >= 90) return "historyScoreHigh";
    if (n >= 60) return "historyScoreMid";
    return "historyScoreLow";
  }

  function migrateHistory(history) {
    if (!Array.isArray(history)) return [];

    let changed = false;

    const migrated = history.map((item) => {
      const ts = normalizeTs(item?.ts || item?.timestamp || item?.date || "");
      if (ts !== (item?.ts || "")) changed = true;

      return {
        score: Number(item?.score ?? 0),
        hits: Number(item?.hits ?? item?.shots ?? 0),
        ts
      };
    });

    if (changed) saveHistory(migrated);
    return migrated;
  }

  function updateHistory(payload) {
    if (!payload) return migrateHistory(loadHistory());

    let history = migrateHistory(loadHistory());

    const entry = {
      score: Number(payload.score ?? 0),
      hits: Number(payload.shots ?? 0),
      ts: normalizeTs(payload.ts) || new Date().toISOString()
    };

    history.unshift(entry);
    history = history.slice(0, 10);
    saveHistory(history);
    return history;
  }

  function renderHistory(history) {
    const grid = $("historyGrid");
    const empty = $("historyEmpty");
    if (!grid || !empty) return;

    grid.innerHTML = "";

    if (!Array.isArray(history) || history.length === 0) {
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    history.forEach((item, index) => {
      const displayIndex = String(index + 1).padStart(2, "0");
      const ts = formatDate(item.ts);

      const cell = document.createElement("div");
      cell.className = "historyCell";
      cell.innerHTML = `
        <div class="historyTop">
          <span class="historyIndex">${displayIndex}</span>
          <span class="${scoreClass(item.score)}">${item.score}</span>
          <span class="historyHits">${item.hits}</span>
        </div>
        <div class="historyBottom">
          <span class="historySoft">${ts || "—"}</span>
        </div>
      `;
      grid.appendChild(cell);
    });
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

  function fillRoundedRect(ctx, x, y, w, h, r, fill, stroke = null, lineWidth = 1) {
    roundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  async function buildSECImageBlob(payload, history) {
    const exportHistory = Array.isArray(history) ? history.slice(0, 6) : [];

    const width = 1400;
    const padding = 40;
    const innerWidth = width - padding * 2;

    const historyHeight = exportHistory.length ? 300 : 120;

    const height =
      padding +
      90 +   // header
      240 +  // score
      180 +  // correction
      90 +   // meta
      820 +  // thumbnail
      historyHeight +
      60;    // footer

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    ctx.textBaseline = "top";

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0a1224");
    bg.addColorStop(1, "#06070a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    let y = padding;

    // Header
    ctx.textAlign = "left";
    ctx.font = "900 58px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif";
    ctx.fillStyle = "#ff5a58";
    ctx.fillText("S", padding, y);
    ctx.fillStyle = "#eef2f7";
    ctx.fillText("E", padding + 35, y);
    ctx.fillStyle = "#3b6cff";
    ctx.fillText("C", padding + 70, y);

    ctx.textAlign = "right";
    ctx.font = "900 22px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.76)";
    ctx.fillText("SHOOTER EXPERIENCE CARD", width - padding, y + 10);

    y += 90;

    // Score
    fillRoundedRect(ctx, padding, y, innerWidth, 220, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);
    ctx.textAlign = "center";
    ctx.font = "900 130px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText(String(payload?.score ?? "—"), width / 2, y + 42);

    y += 240;

    // Correction
    fillRoundedRect(ctx, padding, y, innerWidth, 160, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);
    ctx.font = "1000 60px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif";
    ctx.fillStyle = "#eef2f7";
    ctx.fillText(String($("corrClicksInline")?.textContent || "—"), width / 2, y + 50);

    y += 180;

    // Meta
    fillRoundedRect(ctx, padding, y, innerWidth, 70, 24, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);
    ctx.font = "900 34px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif";
    ctx.fillText(String($("sessionMeta")?.textContent || "—"), width / 2, y + 16);

    y += 90;

    // Thumbnail
    fillRoundedRect(ctx, padding, y, innerWidth, 800, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);

    const thumbSrc = localStorage.getItem(KEY_IMG) || "";
    if (thumbSrc) {
      try {
        const img = await loadImage(thumbSrc);
        const boxX = padding + 20;
        const boxY = y + 20;
        const boxW = innerWidth - 40;
        const boxH = 760;

        ctx.drawImage(img, boxX, boxY, boxW, boxH);
      } catch {}
    }

    y += 820;

    // History
    fillRoundedRect(ctx, padding, y, innerWidth, historyHeight - 20, 28, "rgba(255,255,255,.05)", "rgba(255,255,255,.10)", 2);
    ctx.textAlign = "center";
    ctx.font = "900 18px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.74)";
    ctx.fillText("SHOOTER HISTORY", width / 2, y + 16);

    const startY = y + 54;
    ctx.textAlign = "left";
    ctx.font = "900 16px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif";

    if (exportHistory.length) {
      exportHistory.forEach((h, i) => {
        const rowY = startY + (i * 34);

        const index = String(i + 1).padStart(2, "0");
        const score = Number(h?.score ?? 0);
        const hits = Number(h?.hits ?? 0);
        const dateText = formatDate(h?.ts);

        ctx.fillStyle = "#3b6cff";
        ctx.fillText(index, padding + 24, rowY);

        ctx.fillStyle = score >= 90 ? "#48ff8b" : score >= 60 ? "#ffe466" : "#ff6e64";
        ctx.fillText(String(score), padding + 90, rowY);

        ctx.fillStyle = "#48ff8b";
        ctx.fillText(String(hits), padding + 170, rowY);

        if (dateText) {
          ctx.fillStyle = "rgba(238,242,247,.70)";
          ctx.fillText(dateText, padding + 240, rowY);
        }
      });
    } else {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(238,242,247,.58)";
      ctx.fillText("No shooter history yet.", width / 2, startY + 10);
    }

    y += historyHeight;

    // Footer
    ctx.textAlign = "center";
    ctx.font = "800 18px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif";
    ctx.fillStyle = "rgba(238,242,247,.62)";
    ctx.fillText("Tap-n-Score™ • Shooter Experience Card", width / 2, y);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not create SEC image");
    return blob;
  }

  async function saveSEC(payload, history) {
    try {
      const blob = await buildSECImageBlob(payload, history);

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "SEC-Card.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "SEC Card",
            text: "Shooter Experience Card"
          });
          return;
        }
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

  function wireActions(payload, history) {
    $("saveSecBtn")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await saveSEC(payload, history);
    });

    $("goHomeBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      goHome();
    });
  }

  function init() {
    const payload = loadPayload();

    if (!payload) {
      renderNoData();
      renderThumbnail();
      renderHistory(migrateHistory(loadHistory()));
      wireActions(null, []);
      return;
    }

    if (!payload.ts) {
      payload.ts = new Date().toISOString();
      try {
        localStorage.setItem(KEY_PAYLOAD, JSON.stringify(payload));
      } catch {}
    } else {
      payload.ts = normalizeTs(payload.ts) || new Date().toISOString();
    }

    renderPayload(payload);
    renderThumbnail();

    const history = updateHistory(payload);
    renderHistory(history);

    wireActions(payload, history);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
