/* ============================================================
   docs/index.js — FULL REPLACEMENT (FINAL FIX)
   FIXES:
   ✅ URL payload is PRIMARY (bulletproof)
   ✅ session/local storage = backup only
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const elPhotoBtn = $("photoBtn");
  const elFile = $("photoInput");
  const elImg = $("targetImg");
  const elWrap = $("targetWrap");
  const elDots = $("dotsLayer");

  const elTapCount = $("tapCount");
  const elClearTapsBtn = $("clearTapsBtn");
  const elShowResultsBtn = $("showResultsBtn");
  const elStickyResultsBtn = $("stickyResultsBtn");

  let objectUrl = null;
  let aim = null;
  let hits = [];

  function updateTapCount() {
    if (elTapCount) elTapCount.textContent = hits.length;
  }

  function clearDots() {
    if (elDots) elDots.innerHTML = "";
  }

  function addDot(x01, y01, kind) {
    const d = document.createElement("div");
    d.style.position = "absolute";
    d.style.left = `${x01 * 100}%`;
    d.style.top = `${y01 * 100}%`;
    d.style.transform = "translate(-50%, -50%)";
    d.style.borderRadius = "50%";

    if (kind === "aim") {
      d.style.width = "18px";
      d.style.height = "18px";
      d.style.background = "#67f3a4";
      d.style.border = "2px solid white";
    } else {
      d.style.width = "13px";
      d.style.height = "13px";
      d.style.background = "#b7ff3c";
      d.style.border = "2px solid white";
    }

    elDots.appendChild(d);
  }

  function redrawDots() {
    clearDots();
    if (aim) addDot(aim.x01, aim.y01, "aim");
    hits.forEach((p) => addDot(p.x01, p.y01, "hit"));
    updateTapCount();
  }

  function getRelative01(x, y) {
    const r = elWrap.getBoundingClientRect();
    return {
      x01: (x - r.left) / r.width,
      y01: (y - r.top) / r.height
    };
  }

  function acceptTap(x, y) {
    if (!elImg?.src) return;

    const p = getRelative01(x, y);

    if (!aim) {
      aim = p;
    } else {
      hits.push(p);
    }

    redrawDots();
  }

  function encodePayload(payload) {
    return btoa(JSON.stringify(payload));
  }

  function goToResults() {
    if (!aim || hits.length < 3) {
      alert("Add aim + 3 shots");
      return;
    }

    const payload = {
      aim,
      hits,
      createdAt: Date.now()
    };

    const encoded = encodePayload(payload);

    // ALSO store backup
    try {
      sessionStorage.setItem("sczn3_results", JSON.stringify(payload));
    } catch {}

    // 🔥 PRIMARY HANDOFF = URL
    window.location.href = `sec.html?payload=${encoded}`;
  }

  if (elWrap) {
    elWrap.addEventListener("click", (e) => {
      acceptTap(e.clientX, e.clientY);
    });
  }

  if (elClearTapsBtn) {
    elClearTapsBtn.onclick = () => {
      aim = null;
      hits = [];
      redrawDots();
    };
  }

  if (elShowResultsBtn) elShowResultsBtn.onclick = goToResults;
  if (elStickyResultsBtn) elStickyResultsBtn.onclick = goToResults;

  if (elPhotoBtn && elFile) {
    elPhotoBtn.onclick = () => elFile.click();

    elFile.onchange = () => {
      const f = elFile.files?.[0];
      if (!f) return;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(f);

      elImg.src = objectUrl;
      aim = null;
      hits = [];
      redrawDots();
    };
  }
})();
