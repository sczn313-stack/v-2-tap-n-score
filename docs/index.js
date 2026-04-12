/* ============================================================
   docs/index.js — FULL REPLACEMENT
   Stable target-page taps + robust sec handoff
   FIXES:
   ✅ Writes payload to sessionStorage
   ✅ Adds URL payload fallback for cross-domain / refresh safety
   ✅ Keeps existing target tap flow
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const elPhotoBtn = $("photoBtn");
  const elFile = $("photoInput");
  const elImg = $("targetImg");
  const elWrap = $("targetWrap");
  const elDots = $("dotsLayer");

  const elVendorBox = $("vendorBox");
  const elVendorPanelLink = $("vendorPanelLink");

  const elTapCount = $("tapCount");
  const elClearTapsBtn = $("clearTapsBtn");
  const elShowResultsBtn = $("showResultsBtn");
  const elInstructionLine = $("instructionLine");
  const elStatusLine = $("statusLine");
  const elScoreSection = $("scoreSection");
  const elStickyBar = $("stickyBar");
  const elStickyResultsBtn = $("stickyResultsBtn");

  const KEY_VENDOR_URL = "SCZN3_VENDOR_URL_V1";
  const KEY_RESULTS = "sczn3_results";

  let objectUrl = null;
  let aim = null;
  let hits = [];

  function getParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name) || "";
  }

  function isBakerMode() {
    return getParam("v").toLowerCase() === "baker";
  }

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
    elStickyBar.setAttribute("aria-hidden", show ? "false" : "true");
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
      setStatus(`Add ${3 - hits.length} more shot${3 - hits.length === 1 ? "" : "s"} to enable results.`);
      return;
    }

    setInstruction("Tap bullet holes.");
    setStatus("Ready. Tap Show results.");
  }

  function clearDots() {
    if (elDots) elDots.innerHTML = "";
  }

  function addDot(x01, y01, kind) {
    if (!elDots) return;

    const d = document.createElement("div");
    d.className = kind === "aim" ? "aimDot" : "shotDot";
    d.style.left = `${x01 * 100}%`;
    d.style.top = `${y01 * 100}%`;
    d.style.position = "absolute";
    d.style.transform = "translate(-50%, -50%)";
    d.style.pointerEvents = "none";

    if (kind === "aim") {
      d.style.background = "#67f3a4";
      d.style.width = "18px";
      d.style.height = "18px";
      d.style.border = "2px solid rgba(255,255,255,.95)";
      d.style.boxShadow = "0 0 0 2px rgba(0,0,0,.22), 0 0 14px rgba(103,243,164,.35)";
      d.style.zIndex = "6";
    } else {
      d.style.background = "#b7ff3c";
      d.style.width = "13px";
      d.style.height = "13px";
      d.style.border = "2px solid rgba(255,255,255,.92)";
      d.style.boxShadow = "0 0 0 2px rgba(0,0,0,.18), 0 0 10px rgba(183,255,60,.28)";
      d.style.zIndex = "5";
    }

    d.style.borderRadius = "50%";
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

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function getRelative01(x, y) {
    const r = elWrap.getBoundingClientRect();
    return {
      x01: clamp01((x - r.left) / r.width),
      y01: clamp01((y - r.top) / r.height)
    };
  }

  function acceptTap(x, y) {
    if (!elImg?.src) return;

    const { x01, y01 } = getRelative01(x, y);

    if (!aim) {
      aim = { x01, y01 };
      redrawDots();
      return;
    }

    hits.push({ x01, y01 });
    redrawDots();
  }

  function safeBase64Encode(obj) {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    } catch {
      return "";
    }
  }

  function hydrateVendor() {
    if (isBakerMode()) {
      localStorage.setItem(KEY_VENDOR_URL, "https://bakertargets.com/");
    }

    const v = localStorage.getItem(KEY_VENDOR_URL) || "";

    if (elVendorPanelLink && v) {
      elVendorPanelLink.href = v;
      elVendorPanelLink.target = "_blank";
    }

    if (elVendorBox && v) {
      elVendorBox.href = v;
      elVendorBox.target = "_blank";
      elVendorBox.rel = "noopener";
      elVendorBox.onclick = null;
    }
  }

  function hydratePhoto() {
    if (!elPhotoBtn || !elFile) return;

    elPhotoBtn.onclick = () => elFile.click();

    elFile.onchange = () => {
      const f = elFile.files?.[0];
      if (!f) return;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(f);

      elImg.src = objectUrl;

      if (elScoreSection) {
        elScoreSection.classList.remove("scoreHidden");
      }

      resetTaps();
      setInstruction("Tap aim point.");
      setStatus("Aim point first, then tap 3+ bullet holes.");

      elFile.value = "";
    };
  }

  function goToResults() {
    if (!aim || hits.length < 3) {
      alert("Add 1 aim point and at least 3 shots.");
      return;
    }

    const payload = {
      aim,
      hits,
      createdAt: Date.now(),
      source: "index"
    };

    // Primary storage path
    sessionStorage.setItem(KEY_RESULTS, JSON.stringify(payload));

    // Cross-domain / refresh-safe fallback
    const params = new URLSearchParams(window.location.search);
    const encoded = safeBase64Encode(payload);
    if (encoded) {
      params.set("payload", encoded);
    }

    const qs = params.toString();
    window.location.href = qs ? `sec.html?${qs}` : "sec.html";
  }

  if (elWrap) {
    elWrap.addEventListener("click", (e) => {
      acceptTap(e.clientX, e.clientY);
    });
  }

  if (elClearTapsBtn) {
    elClearTapsBtn.onclick = () => {
      resetTaps();
    };
  }

  if (elShowResultsBtn) {
    elShowResultsBtn.onclick = goToResults;
  }

  if (elStickyResultsBtn) {
    elStickyResultsBtn.onclick = goToResults;
  }

  hydrateVendor();
  hydratePhoto();
  refreshUiState();
})();
