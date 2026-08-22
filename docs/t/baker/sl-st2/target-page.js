(() => {
  "use strict";

  const TARGET_ID = "BAKER_SL_ST2";
  const TARGET_PROFILE_ID = "idpa_silhouette_sl_st2";
  const VARIANT_ID = "BAKER_SL_ST2_23X35_STANDARD_WHITE";
  const MISSION_AUTHORITY_ID = "SCZN3_SL_ST2_TIMED_PAIR_7YD_V1";
  const RULES_AUTHORITY_ID = "IDPA_RULEBOOK_2026_2";
  const local = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  const authorityOrigin = local ? "http://127.0.0.1:8098" : "https://sczn3-authority.onrender.com";
  const analyzeEndpoint = `${authorityOrigin}/api/target/baker-sl-st2/analyze`;
  const preservedSecEndpoint = `${authorityOrigin}/api/session/sec`;
  const reviewAsset = "../../../authority-evidence/baker-sl-st2/BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.jpeg";
  const query = new URLSearchParams(location.search);

  const elements = {
    instruction: document.getElementById("targetInstruction"), loadCard: document.getElementById("loadCard"),
    rawTime: document.getElementById("reportedRawTime"), complete: document.getElementById("evidenceComplete"),
    workspace: document.getElementById("targetWorkspace"), imageFrame: document.getElementById("imageFrame"),
    image: document.getElementById("targetImage"), impactLayer: document.getElementById("impactLayer"),
    tapSurface: document.getElementById("tapSurface"), count: document.getElementById("impactCount"),
    feedback: document.getElementById("workspaceFeedback"), undo: document.getElementById("undoImpact"),
    clear: document.getElementById("clearImpacts"), showResults: document.getElementById("showResults"),
    secView: document.getElementById("idpaSecView"), secRoot: document.getElementById("idpaSecRoot"),
    pageShell: document.querySelector(".sl-page-shell"), header: document.querySelector(".sl-app-header"),
    workflowDock: document.getElementById("workflowDock"), confirmation: document.getElementById("confirmationDialog"),
    confirmationTitle: document.getElementById("confirmationTitle"), confirmationMessage: document.getElementById("confirmationMessage"),
    confirmationCancel: document.getElementById("confirmationCancel"), confirmationAccept: document.getElementById("confirmationAccept"),
    inputs: Array.from(document.querySelectorAll('input[type="file"]'))
  };
  const state = { imageEvidence: null, imageUrl: "", imageDataUrl: "", persistedImageDataUrl: "", impacts: [], pending: false, result: null, preserved: false, authoritativeSessionId: "" };
  const workspace = SCZN3SmartTargetWorkspace.create({ root: elements.workspace, evidenceRegion: elements.imageFrame, actionRegion: elements.workflowDock, header: elements.header, activeClass: "sl-workspace-active", viewportProperty: "--sl-workspace-viewport-height" });
  const beginProcessing = (id, message, trigger, scope) => SCZN3Actions.begin({ id, message, trigger, scope });
  const finishProcessing = (id, succeeded = true) => SCZN3Actions.finish(id, succeeded);
  const feedback = message => { elements.feedback.textContent = message; };

  function rawTimeValid() { return /^\d+(?:\.\d{1,2})?$/.test(elements.rawTime.value.trim()); }
  function bulletHoleMessage(count) { return `${count} ${count === 1 ? "bullet hole" : "bullet holes"} recorded.`; }
  function invalidateResult() { state.result = null; state.preserved = false; workspace.scheduleLayout(); }
  function renderImpacts() {
    elements.impactLayer.replaceChildren(...state.impacts.map((impact, index) => {
      const marker = document.createElement("span"); marker.className = "sl-impact-marker"; marker.style.left = `${impact.xNorm * 100}%`; marker.style.top = `${impact.yNorm * 100}%`; marker.textContent = String(index + 1); return marker;
    }));
    elements.count.textContent = String(state.impacts.length);
    document.getElementById("impactCounter")?.setAttribute("aria-label", bulletHoleMessage(state.impacts.length));
    elements.undo.disabled = state.pending || state.impacts.length === 0;
    elements.clear.disabled = state.pending || state.impacts.length === 0;
    elements.showResults.disabled = state.pending || !state.imageEvidence || state.impacts.length < 2 || !rawTimeValid() || !elements.complete.checked;
  }

  function requestConfirmation({ title, message, acceptLabel }) {
    return new Promise(resolve => {
      const previous = document.activeElement;
      elements.confirmationTitle.textContent = title; elements.confirmationMessage.textContent = message; elements.confirmationAccept.textContent = acceptLabel; elements.confirmation.hidden = false; elements.confirmationCancel.focus();
      const finish = accepted => { elements.confirmation.hidden = true; elements.confirmationCancel.removeEventListener("click", cancel); elements.confirmationAccept.removeEventListener("click", accept); document.removeEventListener("keydown", key); previous?.focus?.(); resolve(accepted); };
      const cancel = () => finish(false); const accept = () => finish(true); const key = event => { if (event.key === "Escape") { event.preventDefault(); cancel(); } };
      elements.confirmationCancel.addEventListener("click", cancel); elements.confirmationAccept.addEventListener("click", accept); document.addEventListener("keydown", key);
    });
  }

  async function digestFile(file) {
    const bytes = await file.arrayBuffer(); const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  }
  function fileDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(file); }); }
  function imageDimensions(url) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ widthPx: image.naturalWidth, heightPx: image.naturalHeight }); image.onerror = reject; image.src = url; }); }
  function blobDataUrl(blob) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(blob); }); }
  function canvasBlob(canvas, quality) { return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("evidence_representation_unavailable")), "image/jpeg", quality)); }
  async function persistenceRepresentation(url, dimensions, originalDataUrl) {
    if (new TextEncoder().encode(originalDataUrl).byteLength <= 320000) return { dataUrl: originalDataUrl, derivative: false };
    const source = new Image(); await new Promise((resolve, reject) => { source.onload = resolve; source.onerror = reject; source.src = url; });
    let maximumDimension = 1200; let quality = .82; let best = null;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const scale = Math.min(1, maximumDimension / Math.max(dimensions.widthPx, dimensions.heightPx));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(dimensions.widthPx * scale)); canvas.height = Math.max(1, Math.round(dimensions.heightPx * scale));
      const context = canvas.getContext("2d", { alpha: false }); context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(source, 0, 0, canvas.width, canvas.height);
      const blob = await canvasBlob(canvas, quality); const dataUrl = await blobDataUrl(blob); best = { dataUrl, derivative: true, mediaType: "image/jpeg", widthPx: canvas.width, heightPx: canvas.height, sizeBytes: blob.size };
      if (new TextEncoder().encode(dataUrl).byteLength <= 320000) return best;
      if (quality > .58) quality -= .08; else maximumDimension = Math.max(720, Math.round(maximumDimension * .82));
    }
    return best;
  }

  async function loadImage(file) {
    if (!file || !String(file.type || "").startsWith("image/")) { elements.instruction.textContent = "We couldn’t use this photo. Retake it or choose another."; return; }
    if (state.impacts.length && !await requestConfirmation({ title: "Replace Target Photo?", message: "Replacing this photo will clear your bullet-hole markers.", acceptLabel: "Replace Photo" })) return;
    const operationId = beginProcessing("target-photo", "Preparing your target photo…", null, elements.loadCard);
    const nextUrl = URL.createObjectURL(file);
    try {
      const [sha256, dimensions, dataUrl] = await Promise.all([digestFile(file), imageDimensions(nextUrl), fileDataUrl(file)]);
      const stored = await persistenceRepresentation(nextUrl, dimensions, dataUrl);
      elements.image.src = nextUrl; await workspace.decodeImage(elements.image);
      if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
      state.imageUrl = nextUrl; state.imageDataUrl = dataUrl; state.persistedImageDataUrl = stored.dataUrl;
      state.imageEvidence = { sha256, mediaType: file.type, widthPx: dimensions.widthPx, heightPx: dimensions.heightPx, originalSizeBytes: file.size, persistedRepresentation: stored.derivative ? "geometry-preserving-display-derivative" : "original", persistedMediaType: stored.mediaType || file.type, persistedWidthPx: stored.widthPx || dimensions.widthPx, persistedHeightPx: stored.heightPx || dimensions.heightPx, persistedSizeBytes: stored.sizeBytes || file.size };
      state.impacts = []; invalidateResult(); elements.imageFrame.style.aspectRatio = `${dimensions.widthPx} / ${dimensions.heightPx}`; elements.loadCard.hidden = true;
      await workspace.revealAfterDecode(elements.image); elements.instruction.textContent = "Target ready. Tap every bullet hole from this string."; feedback("Tap every bullet hole you see."); renderImpacts(); finishProcessing(operationId, true);
    } catch (error) {
      elements.image.src = state.imageUrl || ""; URL.revokeObjectURL(nextUrl); elements.instruction.textContent = "We couldn’t use this photo. Retake it or choose another."; finishProcessing(operationId, false);
    }
  }

  async function authorityRequest(path, options) {
    const response = await fetch(`${authorityOrigin}/api/session/${path}`, { ...options, headers: { Accept: "application/json", ...(options.headers || {}) } });
    const data = await response.json().catch(() => null); if (!response.ok || !data || data.ok !== true) throw new Error(data && data.reason || "session_service_unavailable"); return data;
  }
  function activeSession() {
    const session = window.SCZN3M4?.read(SCZN3M4.KEYS.activeSession, null); const snapshot = session && session.matrixSnapshot || {}; const identity = String(snapshot.targetId || snapshot.targetProfileId || "").toLowerCase();
    return session && state.authoritativeSessionId && session.sessionId === state.authoritativeSessionId && session.sessionIdAuthority === "backend" && [TARGET_ID.toLowerCase(), TARGET_PROFILE_ID].includes(identity) ? session : null;
  }
  async function ensureSession() {
    const existing = activeSession(); if (existing) return existing;
    const preparation = await authorityRequest("prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId: TARGET_PROFILE_ID, equipmentCandidates: [] }) });
    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `idpa-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const backendSession = await authorityRequest("start", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ preparationToken: preparation.preparationToken, selectedEquipment: preparation.standardSetup, idempotencyKey }) });
    const created = SCZN3M4.createAuthoritativeSession(backendSession, { targetName: "Silhouette Target (IDPA)", targetId: TARGET_PROFILE_ID }); state.authoritativeSessionId = created.sessionId; return created;
  }

  async function renderSec(session) {
    const dispatch = SCZN3SECDispatch.resolve(session); if (dispatch.adapter !== SCZN3SECDispatch.ADAPTERS.BAKER_SL_ST2_IDPA) throw new Error("idpa_sec_identity_unavailable");
    elements.secRoot.innerHTML = SCZN3BakerSLST2IDPASEC.render({ session, package: state.result || session.authorityPackage, mode: "live", preserved: state.preserved || session.savedToSEC === true });
    SCZN3TargetProfileIdentity?.hydrate(elements.secRoot); SCZN3PartnershipIdentity?.hydrate(elements.secRoot); SCZN3SECReopenLifecycle?.initialize(elements.secRoot);
    elements.pageShell.hidden = true; elements.secView.hidden = false; bindSecInteractions(session); elements.secView.scrollIntoView({ block: "start" });
  }
  async function persistResultAndOpenSec(operationId) {
    SCZN3Processing?.update(operationId, "Opening your Shooter Experience Card…"); const session = await ensureSession();
    const evidence = { ...state.imageEvidence, dataUrl: state.persistedImageDataUrl || state.imageDataUrl };
    if (!await Promise.resolve(SCZN3M4.saveTargetEvidenceImage(evidence))) throw new Error("target_evidence_persistence_failed");
    const updated = await Promise.resolve(SCZN3M4.updateActiveSession({ authorityPackage: state.result, impactPoints: state.impacts.map(point => ({ xPercent: point.xNorm * 100, yPercent: point.yNorm * 100 })), shotData: { impactPoints: state.impacts, shotCount: state.impacts.length, hits: state.impacts.length, status: "supported-analysis-ready" }, reportedRawTime: elements.rawTime.value.trim(), evidenceCompletenessAffirmed: true, savedToSEC: false }));
    if (!updated) throw new Error("session_result_persistence_failed"); await renderSec(updated || session);
  }
  function bindSecInteractions(session) {
    const root = elements.secRoot;
    SCZN3Actions.bind(root, {
      save: { id: "save-sec", message: "Preserving your Shooter Experience Card…", run: async () => {
        const active = SCZN3M4.read(SCZN3M4.KEYS.activeSession, session); const saved = active && active.savedToSEC === true ? active : SCZN3M4.preserveActiveSEC("", active); const status = root.querySelector("[data-idpa-sec-status]");
        if (!saved) { console.warn("SL-ST2 SEC preservation failed", "local_preservation_unavailable"); if (status) status.textContent = "SEC could not be saved."; return false; }
        try {
          const response = await fetch(preservedSecEndpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ session: saved }) }); const data = await response.json().catch(() => null);
          if (!response.ok || !data || data.ok !== true) throw new Error("preserved_sec_persistence_failed"); state.preserved = true; await renderSec(data.session || saved); const refreshed = elements.secRoot.querySelector("[data-idpa-sec-status]"); if (refreshed) refreshed.textContent = "SEC saved to Ballistic Vault."; return true;
        } catch (error) { console.warn("SL-ST2 SEC preservation failed", error && error.message || error); if (status) status.textContent = "SEC could not be saved. Your session remains available; try again."; return false; }
      } }
    }, { shareData: () => ({ title: "Timed Pair Shooter Experience Card", text: `${state.result.scoring.finalTime} seconds · Timed Practice Result`, url: location.href }) });
  }

  elements.inputs.forEach(input => input.addEventListener("change", async () => { const file = input.files && input.files[0]; await loadImage(file); input.value = ""; }));
  elements.rawTime.addEventListener("input", () => { invalidateResult(); renderImpacts(); }); elements.complete.addEventListener("change", () => { invalidateResult(); renderImpacts(); });
  elements.tapSurface.addEventListener("click", event => { if (!state.imageEvidence || state.pending) return; const rect = elements.tapSurface.getBoundingClientRect(); state.impacts.push({ xNorm: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), yNorm: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) }); invalidateResult(); renderImpacts(); feedback("Add another, Undo, Clear, or Show Results."); });
  elements.undo.addEventListener("click", () => { if (!state.pending && state.impacts.length) { state.impacts.pop(); invalidateResult(); renderImpacts(); feedback(state.impacts.length ? "Last mark removed. Continue or Show Results." : "Last mark removed. Tap every bullet hole you see."); } });
  elements.clear.addEventListener("click", async () => { if (!state.impacts.length || state.pending || !await requestConfirmation({ title: "Clear Bullet Holes?", message: "This removes every bullet-hole marker from the current photo.", acceptLabel: "Clear Markers" })) return; state.impacts = []; invalidateResult(); renderImpacts(); feedback("Marks cleared. Tap every bullet hole you see."); });
  elements.showResults.addEventListener("click", async () => {
    if (elements.showResults.disabled || state.pending) return; state.pending = true; renderImpacts(); feedback("Registering your target and calculating your timed practice result…"); const operationId = beginProcessing("show-results", "Registering your target and calculating your timed practice result…", elements.showResults, elements.workflowDock); let succeeded = false;
    try {
      const response = await fetch(analyzeEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ targetProfileId: TARGET_PROFILE_ID, targetProfileVersion: "1", targetId: TARGET_ID, variantId: VARIANT_ID, missionAuthorityId: MISSION_AUTHORITY_ID, rulesAuthorityId: RULES_AUTHORITY_ID, reportedRawTime: elements.rawTime.value.trim(), rawTimeSource: "manual_shot_timer_entry", evidenceCompletenessAffirmed: elements.complete.checked, imageEvidence: { ...state.imageEvidence, dataUrl: state.imageDataUrl }, impacts: state.impacts }) });
      const result = await response.json().catch(() => null); if (!response.ok || !result || result.ok !== true || result.resultPackageType !== "idpaTimeScoreResult") throw new Error(result && result.reason || "result_unavailable"); state.result = result; await persistResultAndOpenSec(operationId); succeeded = true;
    } catch (error) { console.warn("SL-ST2 Show Results failed", error && error.message || error); const message = state.result ? "Your result is ready. Try Show Results again." : `Your bullet-hole marks are still here. ${error && error.message === "indeterminate_boundary" ? "One selected center is too close to a scoring boundary." : "Try Show Results again."}`; elements.instruction.textContent = message; feedback(message); workspace.syncVisibleViewport(); }
    finally { state.pending = false; finishProcessing(operationId, succeeded); renderImpacts(); }
  });

  window.SCZN3WorkspaceNavigationState = Object.freeze({ hasUnsavedProgress() { return !state.preserved && Boolean(state.imageEvidence || state.impacts.length); } });
  workspace.bindViewportLifecycle(); window.addEventListener("pagehide", () => { workspace.destroy(); if (state.imageUrl) URL.revokeObjectURL(state.imageUrl); }); renderImpacts();
  if (query.get("founderReview") === "idpa-timed-pair") {
    elements.rawTime.value = "8.50"; elements.instruction.textContent = "Founder Review — enter evidence for Timed Pair — 7 Yards.";
    fetch(reviewAsset, { cache: "no-store" }).then(response => { if (!response.ok) throw new Error("review_target_unavailable"); return response.blob(); }).then(blob => loadImage(new File([blob], "BAKER_SL_ST2_23X35.jpeg", { type: "image/jpeg" }))).catch(() => { elements.instruction.textContent = "The SL-ST2 review target could not be loaded."; });
  }
})();
