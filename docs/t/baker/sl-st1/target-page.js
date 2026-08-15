(() => {
  "use strict";

  const TARGET_ID = "BAKER_SL_ST1";
  const SESSION_TARGET_ID = "baker_sl_st1";
  const VARIANT_ID = "BAKER_SL_ST1_23X35_STANDARD_WHITE";
  const local = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  const authorityOrigin = local ? "http://127.0.0.1:8098" : "https://sczn3-authority.onrender.com";
  const analyzeEndpoint = `${authorityOrigin}/api/target/baker-sl-st1/analyze`;
  const fixtureCaptureEndpoint = `${authorityOrigin}/api/target/baker-sl-st1/founder-fixture`;
  const preservedSecEndpoint = `${authorityOrigin}/api/session/sec`;
  const query = new URLSearchParams(location.search);
  const founderFixtureMode = query.get("founderFixture") === "sl-st1-scoring-v1";
  const canonicalFounderReviewMode = query.get("founderReview") === "mission-a-canonical";
  const canonicalAssetUrl = "../../../authority-evidence/baker-sl-st1/BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp";

  const elements = {
    instruction: document.getElementById("targetInstruction"), loadCard: document.getElementById("loadCard"),
    workspace: document.getElementById("targetWorkspace"), imageFrame: document.getElementById("imageFrame"),
    image: document.getElementById("targetImage"), impactLayer: document.getElementById("impactLayer"),
    tapSurface: document.getElementById("tapSurface"), count: document.getElementById("impactCount"),
    feedback: document.getElementById("workspaceFeedback"), undo: document.getElementById("undoImpact"),
    clear: document.getElementById("clearImpacts"), showResults: document.getElementById("showResults"),
    secView: document.getElementById("bakerSecView"),
    secRoot: document.getElementById("bakerSecRoot"), pageShell: document.querySelector(".sl-page-shell"), header: document.querySelector(".sl-app-header"),
    workflowDock: document.getElementById("workflowDock"),
    confirmation: document.getElementById("confirmationDialog"), confirmationTitle: document.getElementById("confirmationTitle"),
    confirmationMessage: document.getElementById("confirmationMessage"), confirmationCancel: document.getElementById("confirmationCancel"),
    confirmationAccept: document.getElementById("confirmationAccept"), inputs: Array.from(document.querySelectorAll('input[type="file"]'))
  };

  const state = { imageEvidence: null, imageUrl: "", imageDataUrl: "", persistedImageDataUrl: "", impacts: [], pending: false, result: null, preserved: false, fixtureLocked: false, fixtureDownloadUrl: "", authoritativeSessionId: "" };
  const bulletHoleMessage = count => `${count} ${count === 1 ? "bullet hole" : "bullet holes"} recorded.`;
  const setFeedback = message => { elements.feedback.textContent = message; };
  const beginProcessing = (id, message, trigger, scope) => window.SCZN3Processing?.begin({ id, message, trigger, scope }) || "";
  const finishProcessing = (operationId, succeeded = true) => {
    if (!operationId || !window.SCZN3Processing) return;
    (succeeded ? SCZN3Processing.succeed : SCZN3Processing.fail)(operationId);
  };

  function invalidateResults() {
    state.result = null;
    queueTargetFit();
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
    elements.count.textContent = String(state.impacts.length);
    document.getElementById("impactCounter")?.setAttribute("aria-label", bulletHoleMessage(state.impacts.length));
    elements.undo.disabled = state.impacts.length === 0 || state.pending || state.fixtureLocked;
    elements.clear.disabled = state.impacts.length === 0 || state.pending || state.fixtureLocked;
    elements.showResults.disabled = state.pending || state.fixtureLocked || state.impacts.length === 0;
    if (founderFixtureMode && !state.fixtureLocked) elements.showResults.textContent = "Preserve Founder Scoring Fixture";
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

  function blobDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function canvasBlob(canvas, quality) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("evidence_representation_unavailable"));
    }, "image/jpeg", quality));
  }

  async function decodeDisplayedImage(image) {
    if (typeof image.decode === "function") {
      await image.decode();
      return;
    }
    if (image.complete && image.naturalWidth > 0) return;
    await new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", reject, { once: true });
    });
  }

  async function persistenceRepresentation(url, dimensions, originalDataUrl) {
    const maximumStoredBytes = 320000;
    if (new TextEncoder().encode(originalDataUrl).byteLength <= maximumStoredBytes) {
      return { dataUrl: originalDataUrl, mediaType: originalDataUrl.slice(5, originalDataUrl.indexOf(";")), derivative: false };
    }
    const source = new Image();
    await new Promise((resolve, reject) => {
      source.onload = resolve;
      source.onerror = reject;
      source.src = url;
    });
    let maximumDimension = 1200;
    let quality = 0.82;
    let best = null;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const scale = Math.min(1, maximumDimension / Math.max(dimensions.widthPx, dimensions.heightPx));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(dimensions.widthPx * scale));
      canvas.height = Math.max(1, Math.round(dimensions.heightPx * scale));
      const context = canvas.getContext("2d", { alpha: false });
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      const blob = await canvasBlob(canvas, quality);
      const dataUrl = await blobDataUrl(blob);
      best = { dataUrl, mediaType: "image/jpeg", widthPx: canvas.width, heightPx: canvas.height, sizeBytes: blob.size, derivative: true };
      if (new TextEncoder().encode(dataUrl).byteLength <= maximumStoredBytes) return best;
      if (quality > 0.58) quality -= 0.08;
      else maximumDimension = Math.max(720, Math.round(maximumDimension * 0.82));
    }
    return best;
  }

  function fitTargetEvidence() {
    const visualViewport = window.visualViewport;
    const viewportHeight = visualViewport && Number.isFinite(visualViewport.height)
      ? visualViewport.height
      : window.innerHeight;
    const viewportTop = visualViewport && Number.isFinite(visualViewport.offsetTop) ? visualViewport.offsetTop : 0;
    const headerBottom = elements.header ? elements.header.getBoundingClientRect().bottom : viewportTop;
    const workspaceHeight = Math.max(0, Math.floor(viewportTop + viewportHeight - Math.max(viewportTop, headerBottom)));
    document.documentElement.style.setProperty("--sl-workspace-viewport-height", `${workspaceHeight}px`);
  }

  function queueTargetFit() {
    requestAnimationFrame(() => requestAnimationFrame(fitTargetEvidence));
  }

  async function loadImage(file) {
    if (!file || !String(file.type || "").startsWith("image/")) {
      elements.instruction.textContent = "We couldn’t use this photo. Retake it or choose another.";
      return;
    }
    if (state.impacts.length && !await requestConfirmation({ title: "Replace Target Photo?", message: "Replacing this photo will clear your bullet-hole markers.", acceptLabel: "Replace Photo" })) return;
    const initiatingLabel = document.querySelector(`label[for="${CSS.escape(document.activeElement?.id || "")}"]`);
    const processingId = beginProcessing("target-photo", "Preparing your target photo…", initiatingLabel, elements.loadCard);
    const nextUrl = URL.createObjectURL(file);
    try {
      const [sha256, dimensions, dataUrl] = await Promise.all([digestFile(file), imageDimensions(nextUrl), fileDataUrl(file)]);
      const storedRepresentation = await persistenceRepresentation(nextUrl, dimensions, dataUrl);
      const previousImageUrl = state.imageUrl;
      elements.image.src = nextUrl;
      await decodeDisplayedImage(elements.image);
      if (previousImageUrl) URL.revokeObjectURL(previousImageUrl);
      state.imageUrl = nextUrl;
      state.imageDataUrl = dataUrl;
      state.persistedImageDataUrl = storedRepresentation.dataUrl;
      state.imageEvidence = {
        sha256,
        mediaType: file.type,
        widthPx: dimensions.widthPx,
        heightPx: dimensions.heightPx,
        originalSizeBytes: file.size,
        persistedRepresentation: storedRepresentation.derivative ? "geometry-preserving-display-derivative" : "original",
        persistedMediaType: storedRepresentation.mediaType,
        persistedWidthPx: storedRepresentation.widthPx || dimensions.widthPx,
        persistedHeightPx: storedRepresentation.heightPx || dimensions.heightPx,
        persistedSizeBytes: storedRepresentation.sizeBytes || file.size
      };
      state.impacts = [];
      state.fixtureLocked = false;
      state.preserved = false;
      invalidateResults();
      elements.imageFrame.style.aspectRatio = `${dimensions.widthPx} / ${dimensions.heightPx}`;
      elements.loadCard.hidden = true;
      elements.workspace.hidden = false;
      document.body.classList.add("sl-workspace-active");
      elements.workspace.scrollIntoView({ block: "start", behavior: "auto" });
      queueTargetFit();
      elements.instruction.textContent = "Target ready. Tap every bullet hole you can see.";
      setFeedback("Tap every bullet hole you see.");
      renderImpacts();
      finishProcessing(processingId, true);
    } catch (error) {
      elements.image.src = state.imageUrl || "";
      URL.revokeObjectURL(nextUrl);
      elements.instruction.textContent = "We couldn’t use this photo. Retake it or choose another.";
      finishProcessing(processingId, false);
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
    return session
      && state.authoritativeSessionId
      && session.sessionId === state.authoritativeSessionId
      && session.sessionIdAuthority === "backend"
      && (identity === TARGET_ID || identity === SESSION_TARGET_ID.toUpperCase())
      ? session
      : null;
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
    const created = SCZN3M4.createAuthoritativeSession(backendSession, { targetName: "Silhouette Target (USPSA)", targetId: TARGET_ID });
    state.authoritativeSessionId = created.sessionId;
    return created;
  }

  function dismissedKey(session) { return `SCZN3_BAKER_SL_ST1_DETAILS_DISMISSED_${session.sessionId}`; }
  function detailsDismissed(session) { return localStorage.getItem(dismissedKey(session)) === "1"; }

  function renderSec(session) {
    const dispatch = window.SCZN3SECDispatch && window.SCZN3SECDispatch.resolve(session);
    if (!dispatch || dispatch.adapter !== window.SCZN3SECDispatch.ADAPTERS.BAKER_SL_ST1) {
      throw new Error("baker_sec_identity_unavailable");
    }
    elements.secRoot.innerHTML = SCZN3BakerSLST1SEC.render({ session, package: state.result || session.authorityPackage, mode: "live", detailsDismissed: detailsDismissed(session) });
    window.SCZN3SECReopenLifecycle?.initialize(elements.secRoot);
    elements.pageShell.hidden = true;
    elements.secView.hidden = false;
    bindSecInteractions(session);
    elements.secView.scrollIntoView({ block: "start" });
  }

  async function persistResultAndOpenSec(processingId) {
    window.SCZN3Processing?.update(processingId, "Opening your Shooter Experience Card…");
    setFeedback("Opening your Shooter Experience Card…");
    const session = await ensureAuthoritativeSession();
    const evidence = { ...state.imageEvidence, dataUrl: state.persistedImageDataUrl || state.imageDataUrl };
    const evidenceSession = await Promise.resolve(SCZN3M4.saveTargetEvidenceImage(evidence));
    if (!evidenceSession) throw new Error("target_evidence_persistence_failed");
    const updated = await Promise.resolve(SCZN3M4.updateActiveSession({ authorityPackage: state.result, impactPoints: state.impacts.map(point => ({ xPercent: point.xNorm * 100, yPercent: point.yNorm * 100 })), shotData: { impactPoints: state.impacts, shotCount: state.impacts.length, hits: state.impacts.length, status: "supported-analysis-ready" }, savedToSEC: false }));
    if (!updated) throw new Error("session_result_persistence_failed");
    renderSec(updated || session);
  }

  function bindSecInteractions(session) {
    const root = elements.secRoot;
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
    root.querySelector("[data-baker-save-sec]")?.addEventListener("click", async event => {
      const button = event.currentTarget;
      const processingId = beginProcessing("save-sec", "Preserving your Shooter Experience Card…", button, button.closest("[data-processing-host]") || root);
      let saveSucceeded = false;
      button.disabled = true;
      const activeSession = SCZN3M4.read(SCZN3M4.KEYS.activeSession, session);
      const saved = activeSession && activeSession.savedToSEC === true
        ? activeSession
        : SCZN3M4.preserveActiveSEC("", activeSession);
      const status = root.querySelector("[data-baker-sec-status]");
      if (!saved) {
        state.preserved = false;
        if (status) status.textContent = "SEC could not be saved.";
        button.disabled = false;
        finishProcessing(processingId, false);
        return;
      }
      try {
        const response = await fetch(preservedSecEndpoint, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ session: saved })
        });
        const packageData = await response.json().catch(() => null);
        if (!response.ok || !packageData || packageData.ok !== true) throw new Error("preserved_sec_persistence_failed");
        state.preserved = true;
        saveSucceeded = true;
        if (status) status.textContent = "SEC saved to Ballistic Vault.";
      } catch (error) {
        state.preserved = false;
        if (status) status.textContent = "SEC could not be saved. Your session remains available; try again.";
      } finally {
        finishProcessing(processingId, saveSucceeded);
        if (saveSucceeded) {
          button.textContent = "SEC Preserved";
          button.classList.add("is-preserved");
          button.disabled = true;
        } else {
          button.disabled = false;
        }
      }
    });
    root.querySelector("[data-sec-export]")?.addEventListener("click", () => window.print());
    root.querySelector("[data-sec-share]")?.addEventListener("click", async () => {
      const shareData = { title: "Baker Silhouette Target SEC", text: `${state.result.supportedAnalysis.impactCount} bullet holes recorded with Tap-n-Score.`, url: location.href };
      if (navigator.share) await navigator.share(shareData).catch(() => {});
      else if (navigator.clipboard) await navigator.clipboard.writeText(location.href).catch(() => {});
    });
  }

  elements.inputs.forEach(input => input.addEventListener("change", async () => { const file = input.files && input.files[0]; await loadImage(file); input.value = ""; }));
  elements.tapSurface.addEventListener("click", event => {
    if (!state.imageEvidence || state.pending || state.fixtureLocked) return;
    const rect = elements.tapSurface.getBoundingClientRect();
    state.impacts.push({ xNorm: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), yNorm: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) });
    state.preserved = false;
    invalidateResults();
    renderImpacts();
    setFeedback("Add another, Undo, Clear, or Show Results.");
    if (founderFixtureMode) setFeedback(`${bulletHoleMessage(state.impacts.length)} Review the complete captured set, then preserve the Founder Scoring Fixture.`);
  });
  elements.undo.addEventListener("click", () => { if (state.impacts.length && !state.pending) { state.impacts.pop(); state.preserved = false; invalidateResults(); renderImpacts(); setFeedback(state.impacts.length ? "Last mark removed. Continue or Show Results." : "Last mark removed. Tap every bullet hole you see."); queueTargetFit(); } });
  elements.clear.addEventListener("click", async () => {
    if (!state.impacts.length || state.pending || !await requestConfirmation({ title: "Clear Bullet Holes?", message: "This removes every bullet-hole marker from the current photo.", acceptLabel: "Clear Markers" })) return;
    state.impacts = []; state.preserved = false; invalidateResults(); renderImpacts(); setFeedback("Marks cleared. Tap every bullet hole you see."); queueTargetFit();
  });
  elements.showResults.addEventListener("click", async () => {
    if (!state.imageEvidence || !state.impacts.length || state.pending) return;
    if (founderFixtureMode) {
      if (!state.impacts.length || state.fixtureLocked) return;
      const processingId = beginProcessing("fixture-preservation", "Preserving the Founder Scoring Fixture…", elements.showResults, elements.workflowDock);
      let processingSucceeded = false;
      state.pending = true; renderImpacts(); setFeedback("Backend is sealing the Founder Scoring Fixture…");
      try {
        const response = await fetch(fixtureCaptureEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            purpose: "founder_scoring_fixture_registration_validation",
            targetId: TARGET_ID,
            variantId: VARIANT_ID,
            imageEvidence: { ...state.imageEvidence, dataUrl: state.imageDataUrl },
            impacts: state.impacts
          })
        });
        const fixture = await response.json();
        if (!response.ok || fixture.ok !== true || fixture.status !== "preserved_for_registration_validation") throw new Error(fixture.reason || "fixture_capture_failed");
        const blob = new Blob([JSON.stringify(fixture, null, 2)], { type: "application/json" });
        if (state.fixtureDownloadUrl) URL.revokeObjectURL(state.fixtureDownloadUrl);
        const href = URL.createObjectURL(blob);
        state.fixtureDownloadUrl = href;
        const link = document.createElement("a");
        link.href = href;
        link.download = `${fixture.fixtureId}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        state.fixtureLocked = true;
        state.preserved = true;
        elements.instruction.textContent = "Founder fixture preserved.";
        setFeedback(`Fixture ${fixture.fixtureId} is sealed and downloaded. No additional impacts can alter it.`);
        const downloadAgain = document.createElement("a");
        downloadAgain.href = href;
        downloadAgain.download = `${fixture.fixtureId}.json`;
        downloadAgain.textContent = "Download Sealed Fixture";
        downloadAgain.className = "button";
        elements.feedback.append(" ", downloadAgain);
        processingSucceeded = true;
      } catch (error) {
        setFeedback(`Fixture was not preserved: ${error && error.message || "unknown error"}. Your captured marks remain editable.`);
      } finally {
        state.pending = false;
        finishProcessing(processingId, processingSucceeded);
        renderImpacts();
      }
      return;
    }
    const processingMessage = state.result ? "Opening your Shooter Experience Card…" : "Analyzing your target and calculating your score…";
    let processingSucceeded = false;
    state.pending = true;
    renderImpacts();
    setFeedback(processingMessage);
    const processingId = beginProcessing("show-results", processingMessage, elements.showResults, elements.workflowDock);
    try {
      if (!state.result) {
        const response = await fetch(analyzeEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ targetId: TARGET_ID, variantId: VARIANT_ID, imageEvidence: { ...state.imageEvidence, dataUrl: state.imageDataUrl }, impacts: state.impacts }) });
        const result = await response.json();
        if (!response.ok || result.ok !== true || result.status !== "supported_analysis_ready") throw new Error("unsupported_result");
        state.result = result;
      }
      await persistResultAndOpenSec(processingId);
      processingSucceeded = true;
    } catch (error) {
      console.warn("SL-ST1 Show Results failed", error && error.message || error);
      const retryMessage = state.result
        ? "Your score is ready. Try Show Results again."
        : "Your bullet-hole marks are still here. Try Show Results again.";
      elements.instruction.textContent = retryMessage;
      setFeedback(retryMessage);
      fitTargetEvidence();
    } finally { state.pending = false; finishProcessing(processingId, processingSucceeded); renderImpacts(); }
  });

  window.SCZN3WorkspaceNavigationState = Object.freeze({ hasUnsavedProgress() { return !state.preserved && Boolean(state.imageEvidence || state.impacts.length); } });
  window.addEventListener("resize", queueTargetFit);
  window.visualViewport?.addEventListener("resize", queueTargetFit);
  window.visualViewport?.addEventListener("scroll", queueTargetFit);
  new ResizeObserver(queueTargetFit).observe(elements.workflowDock);
  window.addEventListener("pagehide", () => {
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    if (state.fixtureDownloadUrl) URL.revokeObjectURL(state.fixtureDownloadUrl);
  });
  renderImpacts();
  if (founderFixtureMode) {
    elements.instruction.textContent = "Founder Scoring Fixture Mode — load the actual Baker SL-ST1 photograph and select every captured impact.";
    setFeedback("Capture the complete impact set. Review it, then preserve the immutable Founder Scoring Fixture.");
    renderImpacts();
  } else if (canonicalFounderReviewMode) {
    elements.instruction.textContent = "Tap every visible bullet hole, then choose Show Results.";
    setFeedback("Loading Baker SL-ST1…");
    fetch(canonicalAssetUrl, { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("canonical_target_unavailable");
        return response.blob();
      })
      .then(blob => loadImage(new File([blob], "BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp", { type: "image/webp" })))
      .catch(() => {
        elements.instruction.textContent = "The Baker SL-ST1 target could not be loaded.";
        setFeedback("Target unavailable. Restart the local review and try again.");
      });
  }
})();
