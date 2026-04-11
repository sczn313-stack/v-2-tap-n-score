/* ============================================================
   docs/index.js — FULL REPLACEMENT
   Polish pass only:
   - keeps existing tap flow + sec handoff
   - adds touch support
   - locks aim vs hit dot classes
   - guards against accidental duplicate taps
   - no wire changes
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

  const MIN_HITS_FOR_RESULTS = 3;
  const TAP_DUPLICATE_THRESHOLD = 0.012; // normalized distance guard
  const MAX_HITS = 25;

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

    if (!elImg || !elImg.src) {
      setInstruction("");
      setStatus("Add a target photo to begin.");
      return;
    }

    if (!aim) {
      setInstruction("Tap aim point.");
      setStatus("Set the aim point first.");
      return;
    }

    if (hits.length < MIN_HITS_FOR_RESULTS) {
      const remaining = MIN_HITS_FOR_RESULTS - hits.length;
      setInstruction("Tap bullet holes.");
      setStatus(`Add ${remaining} more shot${remaining === 1 ? "" : "s"} to enable results.`);
      return;
    }

    setInstruction("Tap bullet holes.");
    setStatus("Ready. Tap Show results.");
  }

  function clearDots() {
    if (elDots) elDots.innerHTML = "";
  }

  function makeDotClass(kind) {
    if (kind === "aim") return "aimDot";
    if (kind === "hit") return "shotDot";
    return "tapDot";
  }

  function addDot(x01, y01, kind) {
    if (!elDots) return;

    const d = document.createElement("div");
    d.className = makeDotClass(kind);
    d.style.left = `${x01 * 100}%`;
    d.style.top = `${y01 * 100}%`;

    // Fallback inline styling so dots still render correctly
    // even if CSS class styling changes later.
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

    d.style.position = "absolute";
    d.style.transform = "translate(-50%, -50%)";
    d.style.borderRadius = "50%";
    d.style.pointerEvents = "none";

    elDots.appendChild(d);
  }

  function redrawDots() {
    clearDots();

    if (aim) addDot(aim.x01, aim.y01, "aim");
    for (const p of hits) addDot(p.x01, p.y01, "hit");

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

  function getRelative01(clientX, clientY) {
    if (!elWrap) return { x01: 0, y01: 0 };

    const r = elWrap.getBoundingClientRect();
    return {
      x01: clamp01((clientX - r.left) / r.width),
      y01: clamp01((clientY - r.top) / r.height)
    };
  }

  function normalizedDistance(a, b) {
    const dx = a.x01 - b.x01;
    const dy = a.y01 - b.y01;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function isDuplicateHit(candidate) {
    return hits.some((p) => normalizedDistance(candidate, p) <= TAP_DUPLICATE_THRESHOLD);
  }

  function isDuplicateAim(candidate) {
    if (!aim) return false;
    return normalizedDistance(candidate, aim) <= TAP_DUPLICATE_THRESHOLD;
  }

  function canAcceptTap() {
    return !!(elImg && elImg.src && elWrap);
  }

  function acceptTap(clientX, clientY) {
    if (!canAcceptTap()) return;

    const point = getRelative01(clientX, clientY);

    if (!aim) {
      aim = point;
      redrawDots();
      return;
    }

    if (isDuplicateAim(point) || isDuplicateHit(point)) {
      return;
    }

    if (hits.length >= MAX_HITS) {
      setStatus(`Maximum of ${MAX_HITS} shots reached.`);
      return;
    }

    hits.push(point);
    redrawDots();
  }

  function extractClientPoint(evt) {
    if (!evt) return null;

    if (evt.touches && evt.touches[0]) {
      return {
        clientX: evt.touches[0].clientX,
        clientY: evt.touches[0].clientY
      };
    }

    if (evt.changedTouches && evt.changedTouches[0]) {
      return {
        clientX: evt.changedTouches[0].clientX,
        clientY: evt.changedTouches[0].clientY
      };
    }

    if (typeof evt.clientX === "number" && typeof evt.clientY === "number") {
      return {
        clientX: evt.clientX,
        clientY: evt.clientY
      };
    }

    return null;
  }

  function handlePointerLikeTap(evt) {
    const pt = extractClientPoint(evt);
    if (!pt) return;
    acceptTap(pt.clientX, pt.clientY);
  }

  function hydrateVendor() {
    if (isBakerMode()) {
      localStorage.setItem(KEY_VENDOR_URL, "https://bakertargets.com/");
    }

    const v = localStorage.getItem(KEY_VENDOR_URL) || "";

    if (elVendorPanelLink && v) {
      elVendorPanelLink.href = v;
      elVendorPanelLink.target = "_blank";
      elVendorPanelLink.rel = "noopener";
    }

    if (elVendorBox && v) {
      elVendorBox.href = v;
      elVendorBox.target = "_blank";
      elVendorBox.rel = "noopener";
      elVendorBox.onclick = null;
    }
  }

  function releaseObjectUrl() {
    if (!objectUrl) return;
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }

  function hydratePhoto() {
    if (!elPhotoBtn || !elFile || !elImg) return;

    elPhotoBtn.onclick = () => elFile.click();

    elFile.onchange = () => {
      const f = elFile.files?.[0];
      if (!f) return;

      releaseObjectUrl();
      objectUrl = URL.createObjectURL(f);

      elImg.onload = () => {
        if (elScoreSection) {
          elScoreSection.classList.remove("scoreHidden");
        }

        resetTaps();
        setInstruction("Tap aim point.");
        setStatus("Aim point first, then tap 3+ bullet holes.");
      };

      elImg.src = objectUrl;
      elFile.value = "";
    };
  }

  function goToResults() {
    if (!aim || hits.length < MIN_HITS_FOR_RESULTS) {
      alert(`Add 1 aim point and at least ${MIN_HITS_FOR_RESULTS} shots.`);
      return;
    }

    const payload = {
      aim,
      hits,
      createdAt: Date.now(),
      source: "index"
    };

    sessionStorage.setItem(KEY_RESULTS, JSON.stringify(payload));

    const params = new URLSearchParams(window.location.search);
    const qs = params.toString();
    window.location.href = qs ? `sec.html?${qs}` : "sec.html";
  }

  function bindTargetTapEvents() {
    if (!elWrap) return;

    elWrap.addEventListener("click", (e) => {
      handlePointerLikeTap(e);
    });

    elWrap.addEventListener(
      "touchstart",
      (e) => {
        // Prevent ghost-click style double counting on some mobile browsers.
        e.preventDefault();
        handlePointerLikeTap(e);
      },
      { passive: false }
    );
  }

  function bindButtons() {
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
  }

  function init() {
    bindTargetTapEvents();
    bindButtons();
    hydrateVendor();
    hydratePhoto();
    refreshUiState();
  }

  window.addEventListener("beforeunload", () => {
    releaseObjectUrl();
  });

  init();
})();
