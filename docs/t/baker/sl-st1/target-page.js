(() => {
  "use strict";

  const TARGET_ID = "BAKER_SL_ST1";
  const VARIANT_ID = "BAKER_SL_ST1_23X35_STANDARD_WHITE";
  const local = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  const endpointMeta = document.querySelector('meta[name="sczn3-baker-sl-st1-endpoint"]');
  const endpoint = local
    ? "http://127.0.0.1:8098/api/target/baker-sl-st1/analyze"
    : endpointMeta.content;

  const elements = {
    instruction: document.getElementById("targetInstruction"),
    loadCard: document.getElementById("loadCard"),
    workspace: document.getElementById("targetWorkspace"),
    imageFrame: document.getElementById("imageFrame"),
    image: document.getElementById("targetImage"),
    impactLayer: document.getElementById("impactLayer"),
    tapSurface: document.getElementById("tapSurface"),
    count: document.getElementById("impactCount"),
    feedback: document.getElementById("workspaceFeedback"),
    undo: document.getElementById("undoImpact"),
    clear: document.getElementById("clearImpacts"),
    showResults: document.getElementById("showResults"),
    results: document.getElementById("supportedResults"),
    resultCount: document.getElementById("resultImpactCount"),
    confirmation: document.getElementById("confirmationDialog"),
    confirmationTitle: document.getElementById("confirmationTitle"),
    confirmationMessage: document.getElementById("confirmationMessage"),
    confirmationCancel: document.getElementById("confirmationCancel"),
    confirmationAccept: document.getElementById("confirmationAccept"),
    inputs: Array.from(document.querySelectorAll('input[type="file"]'))
  };

  const state = {
    imageEvidence: null,
    imageUrl: "",
    impacts: [],
    pending: false,
    result: null
  };

  function impactMessage(count) {
    return `${count} ${count === 1 ? "impact" : "impacts"} recorded.`;
  }

  function setFeedback(message) {
    elements.feedback.textContent = message;
  }

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
      const onKeydown = event => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        cancel();
      };
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

  function imageDimensions(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ widthPx: image.naturalWidth, heightPx: image.naturalHeight });
      image.onerror = reject;
      image.src = url;
    });
  }

  async function loadImage(file) {
    if (!file || !String(file.type || "").startsWith("image/")) {
      elements.instruction.textContent = "We couldn’t use this photo. Retake it or choose another.";
      return;
    }
    if (state.impacts.length && !await requestConfirmation({
      title: "Replace Target Photo?",
      message: "Replacing this photo will clear its impact marks.",
      acceptLabel: "Replace Photo"
    })) return;

    const nextUrl = URL.createObjectURL(file);
    try {
      const [sha256, dimensions] = await Promise.all([digestFile(file), imageDimensions(nextUrl)]);
      if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
      state.imageUrl = nextUrl;
      state.imageEvidence = {
        sha256,
        mediaType: file.type,
        widthPx: dimensions.widthPx,
        heightPx: dimensions.heightPx
      };
      state.impacts = [];
      invalidateResults();
      elements.image.src = nextUrl;
      elements.imageFrame.style.aspectRatio = `${dimensions.widthPx} / ${dimensions.heightPx}`;
      elements.loadCard.hidden = true;
      elements.workspace.hidden = false;
      elements.instruction.textContent = "Target ready. Tap every bullet hole you can see.";
      setFeedback("Target ready. Tap every bullet hole you can see.");
      renderImpacts();
    } catch (error) {
      URL.revokeObjectURL(nextUrl);
      elements.instruction.textContent = "We couldn’t use this photo. Retake it or choose another.";
    }
  }

  elements.inputs.forEach(input => {
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      await loadImage(file);
      input.value = "";
    });
  });

  elements.tapSurface.addEventListener("click", event => {
    if (!state.imageEvidence || state.pending) return;
    const rect = elements.tapSurface.getBoundingClientRect();
    const xNorm = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const yNorm = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    state.impacts.push({ xNorm, yNorm });
    invalidateResults();
    renderImpacts();
    setFeedback(impactMessage(state.impacts.length));
  });

  elements.undo.addEventListener("click", () => {
    if (!state.impacts.length || state.pending) return;
    state.impacts.pop();
    invalidateResults();
    renderImpacts();
    setFeedback("Last mark removed.");
  });

  elements.clear.addEventListener("click", async () => {
    if (!state.impacts.length || state.pending) return;
    if (!await requestConfirmation({
      title: "Clear Impact Marks?",
      message: "This removes every impact mark from the current photo.",
      acceptLabel: "Clear Marks"
    })) return;
    state.impacts = [];
    invalidateResults();
    renderImpacts();
    setFeedback("All impact marks cleared.");
  });

  elements.showResults.addEventListener("click", async () => {
    if (!state.imageEvidence || !state.impacts.length || state.pending) return;
    state.pending = true;
    renderImpacts();
    setFeedback("Reviewing your impacts…");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          targetId: TARGET_ID,
          variantId: VARIANT_ID,
          imageEvidence: state.imageEvidence,
          impacts: state.impacts
        })
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || result.status !== "supported_analysis_ready") {
        throw new Error("unsupported_result");
      }
      state.result = result;
      elements.resultCount.textContent = impactMessage(result.supportedAnalysis.impactCount);
      elements.results.hidden = false;
      elements.instruction.textContent = "Your impacts are ready to review.";
      setFeedback("Your impacts are ready to review.");
      elements.results.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      state.result = null;
      elements.results.hidden = true;
      elements.instruction.textContent = "Your impact marks are still here. Try Show Results again.";
      setFeedback("Your impact marks are still here. Try Show Results again.");
    } finally {
      state.pending = false;
      renderImpacts();
    }
  });

  window.SCZN3WorkspaceNavigationState = Object.freeze({
    hasUnsavedProgress() {
      return Boolean(state.imageEvidence || state.impacts.length);
    }
  });

  window.addEventListener("pagehide", () => {
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  });

  renderImpacts();
})();
