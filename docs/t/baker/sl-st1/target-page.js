(() => {
  "use strict";

  const TARGET_ID = "BAKER_SL_ST1";
  const SESSION_TARGET_ID = "baker_sl_st1";
  const VARIANT_ID = "BAKER_SL_ST1_23X35_STANDARD_WHITE";
  const local = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  const authorityOrigin = local ? "http://127.0.0.1:8098" : "https://sczn3-authority.onrender.com";
  const analyzeEndpoint = `${authorityOrigin}/api/target/baker-sl-st1/analyze`;

  const elements = {
    instruction: document.getElementById("targetInstruction"), loadCard: document.getElementById("loadCard"),
    workspace: document.getElementById("targetWorkspace"), imageFrame: document.getElementById("imageFrame"),
    image: document.getElementById("targetImage"), impactLayer: document.getElementById("impactLayer"),
    tapSurface: document.getElementById("tapSurface"), count: document.getElementById("impactCount"),
    feedback: document.getElementById("workspaceFeedback"), undo: document.getElementById("undoImpact"),
    clear: document.getElementById("clearImpacts"), showResults: document.getElementById("showResults"),
    results: document.getElementById("supportedResults"), resultCount: document.getElementById("resultImpactCount"),
    continueToSec: document.getElementById("continueToSec"), secView: document.getElementById("bakerSecView"),
    secRoot: document.getElementById("bakerSecRoot"), pageShell: document.querySelector(".sl-page-shell"),
    workflowDock: document.getElementById("workflowDock"),
    confirmation: document.getElementById("confirmationDialog"), confirmationTitle: document.getElementById("confirmationTitle"),
    confirmationMessage: document.getElementById("confirmationMessage"), confirmationCancel: document.getElementById("confirmationCancel"),
    confirmationAccept: document.getElementById("confirmationAccept"), inputs: Array.from(document.querySelectorAll('input[type="file"]'))
  };

  const state = { imageEvidence: null, imageUrl: "", imageDataUrl: "", impacts: [], pending: false, result: null, preserved: false };
  const impactMessage = count => `${count} ${count === 1 ? "impact" : "impacts"} recorded.`;
  const setFeedback = message => { elements.feedback.textContent = message; };

  function invalidateResults() {
    state.result = null;
    elements.results.hidden = true;
  }

  function requestConfirmation({ title, message, acceptLabel }) {
    return new Promise(resolve => {
      const previouslyFocused = document.activeElement;
      elements.confirmationTitle.textContent = title;
      elements.confirmationMessage.textContent = message;
      elements.confirmationAccept.textContent = acceptLabel;
      elements.confirmation.hidden = false;
      elements.confirmationCancel.focus();
      const finish = accepted => {
        elements.confirmation.hidden = true;
        elements.confirmationCancel.removeEventListener("click", cancel);
        elements.confirmationAccept.removeEventListener("click", accept);
        document.removeEventListener("keydown", onKeydown);
        if (previouslyFocused && typeof previouslyFocused.focus === "function") previouslyFocused.focus();
        resolve(accepted);
      };
      const cancel = () => finish(false);
      const accept = () => finish(true);
      const onKeydown = event => { if (event.key === "Escape") { event.preventDefault(); cancel(); } };
      elements.confirmationCancel.addEventListener("click", cancel);
      elements.confirmationAccept.addEventListener("click", accept);
      document.addEventListener("keydown", onKeydown);
    });
  }

  function renderImpacts() {
    elements.impactLayer.replaceChildren(...state.impacts.map(impact => {
      const marker = document.createElement("span");
      marker.className = "sl-impact-marker";
      marker.style.left = `${impact.xNorm * 100}%`;
      marker.style.top = `${impact.yNorm * 100}%`;
      return marker;
    }));
    elements.count.textContent = impactMessage(state.impacts.length);
    elements.undo.disabled = state.impacts.length === 0 || state.pending;
    elements.clear.disabled = state.impacts.length === 0 || state.pending;
    elements.showResults.disabled = state.impacts.length === 0 || state.pending;
  }

  async function digestFile(file) {
    const bytes = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function fileDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function imageDimensions(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ widthPx: image.naturalWidth, heightPx: image.naturalHeight });
      image.onerror = reject;
      image.src = url;
    });
  }

  function fitTargetEvidence() {
    if (elements.workspace.hidden || !state.imageEvidence) return;
    const frameTop = Math.max(0, elements.imageFrame.getBoundingClientRect().top);
    const viewportHeight = window.visualViewport && Number.isFinite(window.visualViewport.height)
      ? window.visualViewport.height
      : window.innerHeight;
    const dockHeight = Math.ceil(elements.workflowDock.getBoundingClientRect().height);
    const availableHeight = Math.max(180, Math.floor(viewportHeight - frameTop - dockHeight - 18));
    elements.imageFrame.style.setProperty("--sl-target-fit-height", `${availableHeight}px`);
  }

  function queueTargetFit() {
    requestAnimationFrame(() => requestAnimationFrame(fitTargetEvidence));
  }

  async function loadImage(file) {
    if (!file || !String(file.type || "").startsWith("image/")) {
      elements.instruction.textContent = "We couldn’t use this photo. Retake it or choose another.";
      return;
    }
    if (state.impacts.length && !await requestConfirmation({ title: "Replace Target Photo?", message: "Replacing this photo will clear its impact marks.", acceptLabel: "Replace Photo" })) return;
    const nextUrl = URL.createObjectURL(file);
    try {
      const [sha256, dimensions, dataUrl] = await Promise.all([digestFile(file), imageDimensions(nextUrl), fileDataUrl(file)]);
      if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
      state.imageUrl = nextUrl;
      state.imageDataUrl = dataUrl;
      state.imageEvidence = { sha256, mediaType: file.type, widthPx: dimensions.widthPx, heightPx: dimensions.heightPx };
      state.impacts = [];
      state.preserved = false;
      invalidateResults();
      elements.image.src = nextUrl;
      elements.imageFrame.style.aspectRatio = `${dimensions.widthPx} / ${dimensions.heightPx}`;
      elements.loadCard.hidden = true;
      elements.workspace.hidden = false;
      queueTargetFit();
      elements.instruction.textContent = "Target ready. Tap every bullet hole you can see.";
      setFeedback("Target ready. Tap every bullet hole you can see.");
      renderImpacts();
    } catch (error) {
      URL.revokeObjectURL(nextUrl);
      elements.instruction.textContent = "We couldn’t use this photo. Retake it or choose another.";
    }
  }

  async function authorityRequest(path, options) {
    const response = await fetch(`${authorityOrigin}/api/session/${path}`, { ...options, headers: { Accept: "application/json", ...(options.headers || {}) } });
    const packageData = await response.json().catch(() => null);
    if (!response.ok || !packageData || packageData.ok !== true) throw new Error("session_service_unavailable");
    return packageData;
  }

  function activeBakerSession() {
    const session = window.SCZN3M4 && SCZN3M4.read(SCZN3M4.KEYS.activeSession, null);
    const snapshot = session && session.matrixSnapshot || {};
    const identity = String(snapshot.targetId || snapshot.target_profile_id || snapshot.targetProfileId || "").toUpperCase();
    return session && session.sessionIdAuthority === "backend" && (identity === TARGET_ID || identity === SESSION_TARGET_ID.toUpperCase()) ? session : null;
  }

  async function ensureAuthoritativeSession() {
    const existing = activeBakerSession();
    if (existing) return existing;
    const preparation = await authorityRequest("prepare", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId: TARGET_ID, equipmentCandidates: [] })
    });
    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `baker-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const backendSession = await authorityRequest("start", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ preparationToken: preparation.preparationToken, selectedEquipment: preparation.standardSetup, idempotencyKey })
    });
    return SCZN3M4.createAuthoritativeSession(backendSession, { targetName: "Silhouette Target (USPSA)", targetId: TARGET_ID });
  }

  function dismissedKey(session) { return `SCZN3_BAKER_SL_ST1_DETAILS_DISMISSED_${session.sessionId}`; }
  function detailsDismissed(session) { return localStorage.getItem(dismissedKey(session)) === "1"; }

  function renderSec(session) {
    const dispatch = window.SCZN3SECDispatch && window.SCZN3SECDispatch.resolve(session);
    if (!dispatch || dispatch.adapter !== window.SCZN3SECDispatch.ADAPTERS.BAKER_SL_ST1) {
      throw new Error("baker_sec_identity_unavailable");
    }
    elements.secRoot.innerHTML = SCZN3BakerSLST1SEC.render({ session, package: state.result || session.authorityPackage, mode: "live", detailsDismissed: detailsDismissed(session) });
    elements.pageShell.hidden = true;
    elements.secView.hidden = false;
    bindSecInteractions(session);
    elements.secView.scrollIntoView({ block: "start" });
  }

  function bindSecInteractions(session) {
    const root = elements.secRoot;
    root.querySelectorAll("details[data-sec-region]").forEach(details => details.addEventListener("toggle", () => {
      if (!details.open) return;
      root.querySelectorAll("details[data-sec-region]").forEach(other => { if (other !== details) other.open = false; });
    }));
    const add = root.querySelector("[data-baker-add-details]");
    const form = root.querySelector("[data-baker-details-form]");
    if (add && form) add.addEventListener("click", () => { form.hidden = false; add.closest(".sec-baker-details-invitation-actions").hidden = true; });
    root.querySelector("[data-baker-cancel-details]")?.addEventListener("click", () => renderSec(SCZN3M4.read(SCZN3M4.KEYS.activeSession, session)));
    root.querySelector("[data-baker-dismiss-details]")?.addEventListener("click", () => { localStorage.setItem(dismissedKey(session), "1"); renderSec(session); });
    form?.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(form);
      const snapshot = { ...(session.matrixSnapshot || {}) };
      if (String(data.get("firearm") || "").trim()) snapshot.rifle = String(data.get("firearm")).trim();
      if (String(data.get("ammunition") || "").trim()) snapshot.ammoLoad = String(data.get("ammunition")).trim();
      if (String(data.get("distance") || "").trim()) snapshot.targetDistanceValue = String(data.get("distance")).trim();
      if (String(data.get("shooter") || "").trim()) snapshot.shooterName = String(data.get("shooter")).trim();
      const updated = SCZN3M4.updateActiveSession({ matrixSnapshot: snapshot });
      renderSec(updated || session);
    });
    root.querySelector("[data-baker-add-note]")?.addEventListener("click", () => { const editor = root.querySelector("[data-baker-note-editor]"); if (editor) editor.hidden = false; });
    root.querySelector("[data-baker-save-note]")?.addEventListener("click", () => {
      const note = root.querySelector("[data-baker-note]")?.value.trim() || "";
      const updated = SCZN3M4.updateActiveSession({ secNote: note });
      const status = root.querySelector("[data-baker-sec-status]");
      if (status) status.textContent = updated ? "Note saved." : "Note could not be saved.";
    });
    root.querySelector("[data-baker-save-sec]")?.addEventListener("click", () => {
      const saved = SCZN3M4.preserveActiveSEC("", SCZN3M4.read(SCZN3M4.KEYS.activeSession, session));
      state.preserved = Boolean(saved);
      const status = root.querySelector("[data-baker-sec-status]");
      if (status) status.textContent = saved ? "SEC saved to Ballistic Vault." : "SEC could not be saved.";
    });
    root.querySelector("[data-sec-export]")?.addEventListener("click", () => window.print());
    root.querySelector("[data-sec-share]")?.addEventListener("click", async () => {
      const shareData = { title: "Baker Silhouette Target SEC", text: `${state.result.supportedAnalysis.impactCount} impacts recorded with Tap-n-Score.`, url: location.href };
      if (navigator.share) await navigator.share(shareData).catch(() => {});
      else if (navigator.clipboard) await navigator.clipboard.writeText(location.href).catch(() => {});
    });
  }

  elements.inputs.forEach(input => input.addEventListener("change", async () => { const file = input.files && input.files[0]; await loadImage(file); input.value = ""; }));
  elements.tapSurface.addEventListener("click", event => {
    if (!state.imageEvidence || state.pending) return;
    const rect = elements.tapSurface.getBoundingClientRect();
    state.impacts.push({ xNorm: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), yNorm: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) });
    state.preserved = false;
    invalidateResults();
    renderImpacts();
    setFeedback(`${impactMessage(state.impacts.length)} Add another impact, undo or clear a mark, or show results.`);
  });
  elements.undo.addEventListener("click", () => { if (state.impacts.length && !state.pending) { state.impacts.pop(); state.preserved = false; invalidateResults(); renderImpacts(); setFeedback(state.impacts.length ? `Last mark removed. ${impactMessage(state.impacts.length)} Add another impact, clear the marks, or show results.` : "Last mark removed. Tap every bullet hole you can see."); queueTargetFit(); } });
  elements.clear.addEventListener("click", async () => {
    if (!state.impacts.length || state.pending || !await requestConfirmation({ title: "Clear Impact Marks?", message: "This removes every impact mark from the current photo.", acceptLabel: "Clear Marks" })) return;
    state.impacts = []; state.preserved = false; invalidateResults(); renderImpacts(); setFeedback("All impact marks cleared. Tap every bullet hole you can see."); queueTargetFit();
  });
  elements.showResults.addEventListener("click", async () => {
    if (!state.imageEvidence || !state.impacts.length || state.pending) return;
    state.pending = true; renderImpacts(); setFeedback("Reviewing your impacts…");
    try {
      const response = await fetch(analyzeEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ targetId: TARGET_ID, variantId: VARIANT_ID, imageEvidence: state.imageEvidence, impacts: state.impacts }) });
      const result = await response.json();
      if (!response.ok || result.ok !== true || result.status !== "supported_analysis_ready") throw new Error("unsupported_result");
      state.result = result; elements.resultCount.textContent = impactMessage(result.supportedAnalysis.impactCount); elements.results.hidden = false;
      elements.instruction.textContent = "Your impacts are ready to review."; setFeedback("Your impacts are ready to review."); elements.results.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      state.result = null; elements.results.hidden = true; elements.instruction.textContent = "Your impact marks are still here. Try Show Results again."; setFeedback("Your impact marks are still here. Try Show Results again.");
    } finally { state.pending = false; renderImpacts(); }
  });
  elements.continueToSec.addEventListener("click", async () => {
    if (!state.result || state.pending) return;
    state.pending = true; elements.continueToSec.disabled = true; setFeedback("Opening your Shooter Experience Card…");
    try {
      const session = await ensureAuthoritativeSession();
      const evidence = { ...state.imageEvidence, dataUrl: state.imageDataUrl };
      SCZN3M4.saveTargetEvidenceImage(evidence);
      const updated = SCZN3M4.updateActiveSession({ authorityPackage: state.result, impactPoints: state.impacts.map(point => ({ xPercent: point.xNorm * 100, yPercent: point.yNorm * 100 })), shotData: { impactPoints: state.impacts, shotCount: state.impacts.length, hits: state.impacts.length, status: "supported-analysis-ready" }, savedToSEC: false });
      renderSec(updated || session);
    } catch (error) {
      setFeedback("Your target is ready. Try Continue to SEC again.");
    } finally { state.pending = false; elements.continueToSec.disabled = false; }
  });

  window.SCZN3WorkspaceNavigationState = Object.freeze({ hasUnsavedProgress() { return !state.preserved && Boolean(state.imageEvidence || state.impacts.length); } });
  window.addEventListener("resize", queueTargetFit);
  window.visualViewport?.addEventListener("resize", queueTargetFit);
  window.addEventListener("pagehide", () => { if (state.imageUrl) URL.revokeObjectURL(state.imageUrl); });
  renderImpacts();
})();
