/* ============================================================
   docs/index.js — FULL REPLACEMENT (TOUCH PRECISION FIX)
   FIXES:
   ✅ True touch support (mobile-first)
   ✅ No ghost clicks
   ✅ Better tap accuracy
   ✅ Cleaner dot placement
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
  const elInstructionLine = $("instructionLine");
  const elStatusLine = $("statusLine");
  const elScoreSection = $("scoreSection");
  const elStickyBar = $("stickyBar");
  const elStickyResultsBtn = $("stickyResultsBtn");

  const KEY_RESULTS = "sczn3_results";

  let objectUrl = null;
  let aim = null;
  let hits = [];

  /* =========================
     UI HELPERS
  ========================== */

  function setInstruction(text) {
    if (elInstructionLine) elInstructionLine.textContent = text;
  }

  function setStatus(text) {
    if (elStatusLine) elStatusLine.textContent = text;
  }

  function updateTapCount() {
    if (elTapCount) elTapCount.textContent = String(hits.length);
  }

  function updateStickyBar() {
    if (!elStickyBar) return;
    const show = !!aim && hits.length >= 1;
    elStickyBar.classList.toggle("stickyHidden", !show);
  }

  function refreshUiState() {
    updateTapCount();
    updateStickyBar();

    if (!elImg?.src) {
      setInstruction("");
      setStatus("Add a target photo to begin.");
      return;
    }

    if (!aim) {
      setInstruction("Tap aim point.");
      setStatus("Set the aim point first.");
      return;
    }

    if (hits.length < 3) {
      setInstruction("Tap bullet holes.");
      setStatus(`Add ${3 - hits.length} more shots.`);
      return;
    }

    setInstruction("Tap bullet holes.");
    setStatus("Ready. Tap Show results.");
  }

  /* =========================
     DOT RENDER
  ========================== */

  function clearDots() {
    elDots.innerHTML = "";
  }

  function addDot(x01, y01, type) {
    const d = document.createElement("div");
    d.className = "tapDot";

    // ✅ tighter placement (centered correctly)
    d.style.left = `${x01 * 100}%`;
    d.style.top = `${y01 * 100}%`;
    d.style.transform = "translate(-50%, -50%)";

    d.style.background =
      type === "aim" ? "#4ade80" : "#facc15";

    elDots.appendChild(d);
  }

  function redrawDots() {
    clearDots();
    if (aim) addDot(aim.x01, aim.y01, "aim");
    hits.forEach((p) => addDot(p.x01, p.y01, "hit"));
    refreshUiState();
  }

  function resetTaps() {
    aim = null;
    hits = [];
    redrawDots();
  }

  /* =========================
     COORDINATES (IMPROVED)
  ========================== */

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function getRelative01(clientX, clientY) {
    const rect = elWrap.getBoundingClientRect();

    // ✅ accounts for scroll + precision
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    return {
      x01: clamp01(x),
      y01: clamp01(y)
    };
  }

  /* =========================
     TAP HANDLER
  ========================== */

  function handleTap(clientX, clientY) {
    if (!elImg?.src) return;

    const { x01, y01 } = getRelative01(clientX, clientY);

    if (!aim) {
      aim = { x01, y01 };
    } else {
      hits.push({ x01, y01 });
    }

    redrawDots();
  }

  /* =========================
     TOUCH + CLICK FIX
  ========================== */

  let lastTouchTime = 0;

  // ✅ TOUCH (primary)
  elWrap.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    if (!t) return;

    lastTouchTime = Date.now();

    handleTap(t.clientX, t.clientY);
  }, { passive: true });

  // ❌ CLICK (fallback only, prevents double fire)
  elWrap.addEventListener("click", (e) => {
    if (Date.now() - lastTouchTime < 500) return;
    handleTap(e.clientX, e.clientY);
  });

  /* =========================
     PHOTO LOAD
  ========================== */

  elPhotoBtn.onclick = () => elFile.click();

  elFile.onchange = () => {
    const f = elFile.files?.[0];
    if (!f) return;

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(f);

    elImg.src = objectUrl;

    elScoreSection.classList.remove("scoreHidden");

    resetTaps();

    setInstruction("Tap aim point.");
    setStatus("Aim point first, then tap 3+ shots.");

    elFile.value = "";
  };

  /* =========================
     RESULTS
  ========================== */

  function goToResults() {
    if (!aim || hits.length < 3) {
      alert("Add 1 aim point and at least 3 shots.");
      return;
    }

    const payload = {
      aim,
      hits,
      createdAt: Date.now()
    };

    sessionStorage.setItem(KEY_RESULTS, JSON.stringify(payload));

    window.location.href = "sec.html";
  }

  elShowResultsBtn.onclick = goToResults;
  elStickyResultsBtn.onclick = goToResults;

  elClearTapsBtn.onclick = resetTaps;

  refreshUiState();
})();
