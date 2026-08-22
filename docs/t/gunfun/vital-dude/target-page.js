(() => {
  "use strict";

  const TARGET_ID = "GUNFUN_22740_VITAL_DUDE";
  const SESSION_TARGET_ID = "gunfun_22740_vital_dude";
  const VARIANT_ID = "GUNFUN_22740_VITAL_DUDE_23X35";
  const MISSION_ID = "GUNFUN_22740_EVIDENCE_CAPTURE_V1";
  const local = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  const authorityOrigin = local ? "http://127.0.0.1:8098" : "https://sczn3-authority.onrender.com";
  const analyzeEndpoint = `${authorityOrigin}/api/target/gunfun/vital-dude/analyze`;
  const preservedSecEndpoint = `${authorityOrigin}/api/session/sec`;

  const elements = {
    startCard: document.getElementById("startCard"), start: document.getElementById("startExperience"),
    instruction: document.getElementById("targetInstruction"), loadCard: document.getElementById("loadCard"),
    workspace: document.getElementById("targetWorkspace"), imageFrame: document.getElementById("imageFrame"),
    image: document.getElementById("targetImage"), impactLayer: document.getElementById("impactLayer"), tapSurface: document.getElementById("tapSurface"),
    count: document.getElementById("impactCount"), feedback: document.getElementById("workspaceFeedback"), aimState: document.getElementById("aimState"),
    markAim: document.getElementById("markAim"), undo: document.getElementById("undoImpact"), clear: document.getElementById("clearImpacts"), showResults: document.getElementById("showResults"),
    secView: document.getElementById("vitalDudeSecView"), secRoot: document.getElementById("vitalDudeSecRoot"), pageShell: document.querySelector(".sl-page-shell"), header: document.querySelector(".sl-app-header"), workflowDock: document.getElementById("workflowDock"),
    confirmation: document.getElementById("confirmationDialog"), confirmationTitle: document.getElementById("confirmationTitle"), confirmationMessage: document.getElementById("confirmationMessage"), confirmationCancel: document.getElementById("confirmationCancel"), confirmationAccept: document.getElementById("confirmationAccept"),
    inputs: Array.from(document.querySelectorAll('input[type="file"]'))
  };
  const state = { imageEvidence: null, imageUrl: "", imageDataUrl: "", persistedImageDataUrl: "", impacts: [], aimPoint: null, mode: "impact", pending: false, result: null, preserved: false, authoritativeSessionId: "" };
  const workspace = SCZN3SmartTargetWorkspace.create({ root: elements.workspace, evidenceRegion: elements.imageFrame, actionRegion: elements.workflowDock, header: elements.header, activeClass: "sl-workspace-active", viewportProperty: "--sl-workspace-viewport-height" });
  const setFeedback = message => { elements.feedback.textContent = message; };
  const observationMessage = count => `${count} shot ${count === 1 ? "observation" : "observations"} recorded.`;

  function requestConfirmation({ title, message, acceptLabel }) {
    return new Promise(resolve => {
      const previous = document.activeElement;
      elements.confirmationTitle.textContent = title; elements.confirmationMessage.textContent = message; elements.confirmationAccept.textContent = acceptLabel; elements.confirmation.hidden = false; elements.confirmationCancel.focus();
      const finish = accepted => { elements.confirmation.hidden = true; elements.confirmationCancel.removeEventListener("click", cancel); elements.confirmationAccept.removeEventListener("click", accept); document.removeEventListener("keydown", key); previous?.focus?.(); resolve(accepted); };
      const cancel = () => finish(false); const accept = () => finish(true); const key = event => { if (event.key === "Escape") cancel(); };
      elements.confirmationCancel.addEventListener("click", cancel); elements.confirmationAccept.addEventListener("click", accept); document.addEventListener("keydown", key);
    });
  }

  function invalidateResult() { state.result = null; state.preserved = false; workspace.scheduleLayout(); }

  function renderEvidence() {
    const nodes = state.impacts.map((impact, index) => {
      const marker = document.createElement("span"); marker.className = "sl-impact-marker"; marker.dataset.label = String(index + 1); marker.style.left = `${impact.xNorm * 100}%`; marker.style.top = `${impact.yNorm * 100}%`; return marker;
    });
    if (state.aimPoint) {
      const marker = document.createElement("span"); marker.className = "vital-dude-aim-marker"; marker.style.left = `${state.aimPoint.xNorm * 100}%`; marker.style.top = `${state.aimPoint.yNorm * 100}%`; marker.innerHTML = "<i></i>"; nodes.push(marker);
    }
    elements.impactLayer.replaceChildren(...nodes);
    elements.count.textContent = String(state.impacts.length);
    document.getElementById("impactCounter")?.setAttribute("aria-label", observationMessage(state.impacts.length));
    elements.undo.disabled = !state.impacts.length || state.pending;
    elements.clear.disabled = (!state.impacts.length && !state.aimPoint) || state.pending;
    elements.showResults.disabled = !state.impacts.length || state.pending;
    elements.markAim.disabled = !state.imageEvidence || state.pending;
    elements.markAim.textContent = state.mode === "aim" ? "Cancel Aim" : state.aimPoint ? "Move Aim" : "Mark Aim";
    elements.aimState.textContent = state.mode === "aim" ? "Tap the photo to declare your aim point." : state.aimPoint ? "Aim point: shooter declared" : "Aim point: not declared";
    elements.aimState.classList.toggle("is-armed", state.mode === "aim");
    elements.tapSurface.setAttribute("aria-label", state.mode === "aim" ? "Declare aim point" : "Record a visible shot observation");
  }

  async function digestFile(file) { const bytes = await file.arrayBuffer(); const digest = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join(""); }
  function fileDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(file); }); }
  function imageDimensions(url) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ widthPx: image.naturalWidth, heightPx: image.naturalHeight }); image.onerror = reject; image.src = url; }); }
  function canvasBlob(canvas, quality) { return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("evidence_representation_unavailable")), "image/jpeg", quality)); }
  function blobDataUrl(blob) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(blob); }); }

  async function persistenceRepresentation(url, dimensions, originalDataUrl) {
    if (new TextEncoder().encode(originalDataUrl).byteLength <= 320000) return { dataUrl: originalDataUrl, derivative: false };
    const source = new Image(); await new Promise((resolve, reject) => { source.onload = resolve; source.onerror = reject; source.src = url; });
    let maximum = 1200, quality = .82, best = null;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const scale = Math.min(1, maximum / Math.max(dimensions.widthPx, dimensions.heightPx)); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(dimensions.widthPx * scale)); canvas.height = Math.max(1, Math.round(dimensions.heightPx * scale)); const context = canvas.getContext("2d", { alpha: false }); context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(source, 0, 0, canvas.width, canvas.height); const blob = await canvasBlob(canvas, quality); const dataUrl = await blobDataUrl(blob); best = { dataUrl, derivative: true, widthPx: canvas.width, heightPx: canvas.height, sizeBytes: blob.size }; if (new TextEncoder().encode(dataUrl).byteLength <= 320000) return best; if (quality > .58) quality -= .08; else maximum = Math.max(720, Math.round(maximum * .82));
    }
    return best;
  }

  async function loadImage(file) {
    if (!file || !String(file.type || "").startsWith("image/")) { elements.instruction.textContent = "We couldn’t use this photo. Retake it or choose another."; return; }
    if ((state.impacts.length || state.aimPoint) && !await requestConfirmation({ title: "Replace Target Photo?", message: "Replacing this photo clears the current shot observations and declared aim point.", acceptLabel: "Replace Photo" })) return;
    const operation = SCZN3Actions.begin({ id: "vital-dude-photo", message: "Preparing your target photo…", scope: elements.loadCard });
    const url = URL.createObjectURL(file);
    try {
      const [sha256, dimensions, dataUrl] = await Promise.all([digestFile(file), imageDimensions(url), fileDataUrl(file)]); const stored = await persistenceRepresentation(url, dimensions, dataUrl); const previous = state.imageUrl; elements.image.src = url; await workspace.decodeImage(elements.image); if (previous) URL.revokeObjectURL(previous);
      state.imageUrl = url; state.imageDataUrl = dataUrl; state.persistedImageDataUrl = stored.dataUrl; state.imageEvidence = { sha256, mediaType: file.type, widthPx: dimensions.widthPx, heightPx: dimensions.heightPx, originalSizeBytes: file.size, persistedRepresentation: stored.derivative ? "geometry-preserving-display-derivative" : "original", persistedWidthPx: stored.widthPx || dimensions.widthPx, persistedHeightPx: stored.heightPx || dimensions.heightPx, persistedSizeBytes: stored.sizeBytes || file.size };
      state.impacts = []; state.aimPoint = null; state.mode = "impact"; invalidateResult(); elements.imageFrame.style.aspectRatio = `${dimensions.widthPx} / ${dimensions.heightPx}`; elements.loadCard.hidden = true; await workspace.revealAfterDecode(elements.image); elements.instruction.textContent = "Target ready. Record each visible shot observation."; setFeedback("Tap each visible shot observation. Mark Aim is optional."); renderEvidence(); SCZN3Actions.finish(operation, true);
    } catch (error) { URL.revokeObjectURL(url); elements.instruction.textContent = "We couldn’t use this photo. Retake it or choose another."; SCZN3Actions.finish(operation, false); }
  }

  async function authorityRequest(path, options) { const response = await fetch(`${authorityOrigin}/api/session/${path}`, { ...options, headers: { Accept: "application/json", ...(options.headers || {}) } }); const data = await response.json().catch(() => null); if (!response.ok || !data || data.ok !== true) throw new Error("session_service_unavailable"); return data; }
  function activeSession() { const session = window.SCZN3M4 && SCZN3M4.read(SCZN3M4.KEYS.activeSession, null); const snapshot = session && session.matrixSnapshot || {}; const identity = String(snapshot.targetId || snapshot.target_profile_id || snapshot.targetProfileId || "").toLowerCase(); return session && state.authoritativeSessionId && session.sessionId === state.authoritativeSessionId && session.sessionIdAuthority === "backend" && [TARGET_ID.toLowerCase(), SESSION_TARGET_ID].includes(identity) ? session : null; }
  async function ensureAuthoritativeSession() {
    const existing = activeSession(); if (existing) return existing;
    const preparation = await authorityRequest("prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId: TARGET_ID, equipmentCandidates: [] }) });
    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `vital-dude-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const backend = await authorityRequest("start", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ preparationToken: preparation.preparationToken, selectedEquipment: preparation.standardSetup, idempotencyKey }) });
    const created = SCZN3M4.createAuthoritativeSession(backend, { targetName: "GunFun Vital Dude", targetId: SESSION_TARGET_ID }); state.authoritativeSessionId = created.sessionId; return created;
  }

  async function renderSec(session) {
    const dispatch = SCZN3SECDispatch.resolve(session); if (!dispatch || dispatch.adapter !== SCZN3SECDispatch.ADAPTERS.GUNFUN_VITAL_DUDE) throw new Error("vital_dude_sec_identity_unavailable");
    elements.secRoot.innerHTML = SCZN3GunFunVitalDudeSEC.render({ session, package: state.result || session.authorityPackage, mode: "live", preserved: state.preserved || session.savedToSEC === true }); window.SCZN3SECReopenLifecycle?.initialize(elements.secRoot); elements.pageShell.hidden = true; elements.secView.hidden = false; bindSecActions(session); elements.secView.scrollIntoView({ block: "start" });
  }

  function bindSecActions(session) {
    SCZN3Actions.bind(elements.secRoot, { save: { id: "save-sec", message: "Preserving your Shooter Experience Card…", run: async () => {
      const active = SCZN3M4.read(SCZN3M4.KEYS.activeSession, session); const saved = active && active.savedToSEC === true ? active : SCZN3M4.preserveActiveSEC("", active); const status = elements.secRoot.querySelector("[data-vital-dude-sec-status]"); if (!saved) { if (status) status.textContent = "SEC could not be saved."; return false; }
      try { const response = await fetch(preservedSecEndpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ session: saved }) }); const data = await response.json().catch(() => null); if (!response.ok || !data || data.ok !== true) throw new Error("preservation_failed"); state.preserved = true; await renderSec(data.session || saved); const refreshed = elements.secRoot.querySelector("[data-vital-dude-sec-status]"); if (refreshed) refreshed.textContent = "SEC saved to Ballistic Vault."; return true; } catch (error) { state.preserved = false; if (status) status.textContent = "SEC could not be saved. Your evidence remains available; try again."; return false; }
    } } }, { shareData: () => ({ title: "GunFun Vital Dude SEC", text: `${state.impacts.length} shot observations recorded as evidence.`, url: location.href }) });
  }

  elements.start.addEventListener("click", async () => { const operation = SCZN3Actions.begin({ id: "vital-dude-start", message: "Starting evidence session…", trigger: elements.start, scope: elements.startCard }); try { await ensureAuthoritativeSession(); elements.startCard.hidden = true; elements.loadCard.hidden = false; elements.instruction.textContent = "Capture or choose a photo of your Vital Dude target."; SCZN3Actions.finish(operation, true); } catch (error) { elements.instruction.textContent = "The evidence session could not start. Try again."; SCZN3Actions.finish(operation, false); } });
  elements.inputs.forEach(input => input.addEventListener("change", async () => { const file = input.files && input.files[0]; await loadImage(file); input.value = ""; }));
  elements.markAim.addEventListener("click", () => { if (!state.imageEvidence || state.pending) return; state.mode = state.mode === "aim" ? "impact" : "aim"; setFeedback(state.mode === "aim" ? "Tap once to declare where you aimed. This is shooter evidence only." : "Aim marking cancelled. Continue recording visible shot observations."); renderEvidence(); });
  elements.tapSurface.addEventListener("click", event => { if (!state.imageEvidence || state.pending) return; const rect = elements.tapSurface.getBoundingClientRect(); const p = { xNorm: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), yNorm: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) }; if (state.mode === "aim") { state.aimPoint = p; state.mode = "impact"; setFeedback("Shooter-declared aim point recorded. Continue with visible shot observations."); } else { state.impacts.push(p); setFeedback(`${observationMessage(state.impacts.length)} Add another, Undo, Clear, Mark Aim, or Show Evidence Result.`); } invalidateResult(); renderEvidence(); });
  elements.undo.addEventListener("click", () => { if (state.impacts.length && !state.pending) { state.impacts.pop(); invalidateResult(); setFeedback(state.impacts.length ? observationMessage(state.impacts.length) : "Last observation removed. Tap each visible shot observation."); renderEvidence(); } });
  elements.clear.addEventListener("click", async () => { if (state.pending || !await requestConfirmation({ title: "Clear Evidence Markers?", message: "This removes all shot observations and the optional declared aim point from this photo.", acceptLabel: "Clear Markers" })) return; state.impacts = []; state.aimPoint = null; state.mode = "impact"; invalidateResult(); setFeedback("Markers cleared. Tap each visible shot observation."); renderEvidence(); });
  elements.showResults.addEventListener("click", async () => {
    if (!state.imageEvidence || !state.impacts.length || state.pending) return; state.pending = true; renderEvidence(); const operation = SCZN3Actions.begin({ id: "vital-dude-result", message: "Validating your evidence…", trigger: elements.showResults, scope: elements.workflowDock }); setFeedback("Backend authority is validating your evidence."); let succeeded = false;
    try {
      if (!state.result) { const response = await fetch(analyzeEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ targetProfileId: SESSION_TARGET_ID, targetProfileVersion: "1", targetId: TARGET_ID, variantId: VARIANT_ID, missionId: MISSION_ID, imageEvidence: { ...state.imageEvidence, dataUrl: state.imageDataUrl }, impacts: state.impacts, shooterDeclaredAimPoint: state.aimPoint }) }); const result = await response.json().catch(() => null); if (!response.ok || !result || !SCZN3GunFunVitalDudeSEC.matches(result)) throw new Error("unsupported_result"); state.result = result; }
      const session = await ensureAuthoritativeSession(); const evidence = { ...state.imageEvidence, dataUrl: state.persistedImageDataUrl || state.imageDataUrl }; if (!await Promise.resolve(SCZN3M4.saveTargetEvidenceImage(evidence))) throw new Error("target_evidence_persistence_failed"); const updated = await Promise.resolve(SCZN3M4.updateActiveSession({ authorityPackage: state.result, impactPoints: state.impacts.map(p => ({ xPercent: p.xNorm * 100, yPercent: p.yNorm * 100 })), shooterDeclaredAimPoint: state.aimPoint, shotData: { impactPoints: state.impacts, shotCount: state.impacts.length, hits: state.impacts.length, status: "supported-analysis-ready" }, savedToSEC: false })); if (!updated) throw new Error("session_result_persistence_failed"); await renderSec(updated || session); succeeded = true;
    } catch (error) { console.warn("Vital Dude evidence result failed", error); elements.instruction.textContent = "Your evidence markers are still here. Try Show Evidence Result again."; setFeedback("Evidence result unavailable. Your photo and markers remain editable."); }
    finally { state.pending = false; SCZN3Actions.finish(operation, succeeded); renderEvidence(); }
  });

  window.SCZN3WorkspaceNavigationState = Object.freeze({ hasUnsavedProgress() { return !state.preserved && Boolean(state.imageEvidence || state.impacts.length || state.aimPoint); } });
  workspace.bindViewportLifecycle(); window.addEventListener("pagehide", () => { workspace.destroy(); if (state.imageUrl) URL.revokeObjectURL(state.imageUrl); }); renderEvidence();
})();
