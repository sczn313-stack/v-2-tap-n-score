(function (global) {
  "use strict";

  const SOURCE = "voluntary_rate_us";
  const RETURN_MARKER = "SCZN3_RATE_US_RETURN_CONTEXT_V1";
  const validCompletions = new Set(["incomplete", "complete", "ambiguous"]);
  let installed = false;
  let entry = null;
  let submitting = false;

  function clean(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  function createId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") return global.crypto.randomUUID();
    return `rate-us-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function activeSession() {
    try {
      const platform = global.SCZN3M4;
      if (!platform) return null;
      const queryId = new URLSearchParams(global.location.search).get("session");
      if (queryId && typeof platform.getSessionHistory === "function") {
        const exact = platform.getSessionHistory().find(session => clean(session && session.sessionId) === clean(queryId));
        if (exact) return exact;
      }
      return platform.read && platform.KEYS ? platform.read(platform.KEYS.activeSession, null) : null;
    } catch (_) {
      return null;
    }
  }

  function shooterRelationship() {
    try {
      const priorRating = global.localStorage.getItem(RETURN_MARKER) === "submitted";
      const history = global.SCZN3M4 && typeof global.SCZN3M4.getSessionHistory === "function"
        ? global.SCZN3M4.getSessionHistory()
        : [];
      if (priorRating || Array.isArray(history) && history.length > 0) {
        return { status: "returning_to_this_browser", scope: "this_browser", basis: priorRating ? "prior_rate_us_submission" : "platform_session_history" };
      }
      return { status: "new_to_this_browser", scope: "this_browser", basis: "no_prior_platform_history_in_browser" };
    } catch (_) {
      return { status: "unknown", scope: "this_browser", basis: "browser_storage_unavailable" };
    }
  }

  function originView(pathname) {
    const path = clean(pathname).toLowerCase();
    if (path.endsWith("/index.html") || path === "/" || path === "") return "home";
    if (path.endsWith("/records.html")) return "ballistic_vault";
    if (path.endsWith("/sec.html")) return "sec";
    if (path.endsWith("/shoot.html") || path.endsWith("/target-experience.html") || path.includes("/t/")) return "active_target";
    if (path.endsWith("/matrix.html")) return "equipment_library";
    if (path.endsWith("/analytics.html")) return "analytics";
    if (path.endsWith("/buy-targets.html")) return "buy_targets";
    return "unknown";
  }

  function explicitTargetCandidate(session) {
    const params = new URLSearchParams(global.location.search || "");
    return session || params.get("target") || params.get("target_profile_id") || params.get("targetProfileId") || "";
  }

  function identityContext(session) {
    try {
      const identity = global.SCZN3TargetProfiles && global.SCZN3TargetProfiles.identityRecord
        ? global.SCZN3TargetProfiles.identityRecord(explicitTargetCandidate(session), session && (session.authorityPackage || session.backendAuthorityPackage))
        : null;
      if (!identity) return { target: null, publisher: null };
      const publisher = identity.publisherIdentity;
      return {
        target: {
          targetProfileId: identity.targetProfileId,
          targetLabel: identity.targetProfileLabel
        },
        publisher: publisher && clean(publisher.publisherId) ? {
          publisherId: publisher.publisherId,
          publisherLabel: publisher.publisherLabel
        } : null
      };
    } catch (_) {
      return { target: null, publisher: null };
    }
  }

  function activityContext(session) {
    const snapshot = session && session.matrixSnapshot || {};
    const result = session && (session.authorityPackage || session.backendAuthorityPackage) || {};
    const contract = result.executionContract || {};
    return clean(
      contract.missionFamily
      || result.missionFamily
      || snapshot.missionFamily
      || snapshot.missionIdentity
      || snapshot.missionProfile
      || session && session.missionIdentity
    ) || null;
  }

  function secContext(session) {
    if (!session) return { exists: false, state: "none" };
    if (session.savedToSEC === true) return { exists: true, state: "preserved" };
    if (session.authorityPackage || session.backendAuthorityPackage || session.m4AuthorityPackage) {
      return { exists: true, state: "active_result" };
    }
    return { exists: false, state: "none" };
  }

  function completionStatus(session) {
    const explicit = clean(document.body && document.body.dataset.rateUsCompletionStatus).toLowerCase();
    if (validCompletions.has(explicit)) return explicit;
    if (!session) return "ambiguous";
    if (session.savedToSEC === true) return "complete";
    return "incomplete";
  }

  function permittedNextDestination(completion) {
    if (completion !== "complete") return "";
    const candidate = clean(document.body && document.body.dataset.rateUsNext);
    if (!candidate) return "";
    try {
      const destination = new URL(candidate, global.location.href);
      return destination.origin === global.location.origin ? destination.href : "";
    } catch (_) {
      return "";
    }
  }

  function captureContext() {
    const session = activeSession();
    const identity = identityContext(session);
    const completion = completionStatus(session);
    return {
      context: {
        shooterRelationship: shooterRelationship(),
        origin: { route: global.location.pathname || "/", view: originView(global.location.pathname) },
        activity: activityContext(session),
        target: identity.target,
        publisher: identity.publisher,
        session: session && clean(session.sessionId) ? { sessionId: clean(session.sessionId) } : null,
        sec: secContext(session),
        currentStage: clean(session && session.workflowStage || document.body && document.body.dataset.rateUsStage) || null,
        completionStatus: completion
      },
      returnState: {
        scrollX: global.scrollX || 0,
        scrollY: global.scrollY || 0,
        focusedElement: document.activeElement,
        nextDestination: permittedNextDestination(completion)
      }
    };
  }

  function endpoint() {
    if (clean(global.__SCZN3_RATE_US_ENDPOINT__)) return clean(global.__SCZN3_RATE_US_ENDPOINT__);
    const local = ["127.0.0.1", "localhost"].includes(global.location.hostname);
    return `${local ? "http://127.0.0.1:8098" : "https://sczn3-authority.onrender.com"}/api/feedback/rating`;
  }

  function dialog() {
    return document.getElementById("sczn3RateUsDialog");
  }

  function status(message, isError) {
    const node = document.getElementById("sczn3RateUsStatus");
    if (!node) return;
    node.textContent = message || "";
    node.dataset.error = isError ? "true" : "false";
  }

  function resetForm() {
    const form = document.getElementById("sczn3RateUsForm");
    if (form) form.reset();
    status("");
    submitting = false;
    const submit = document.getElementById("sczn3RateUsSubmit");
    if (submit) submit.disabled = false;
  }

  function restoreEntry() {
    if (!entry) return;
    const state = entry.returnState;
    global.scrollTo(state.scrollX, state.scrollY);
    if (state.focusedElement && state.focusedElement.isConnected && typeof state.focusedElement.focus === "function") {
      state.focusedElement.focus();
    }
  }

  function close() {
    const modal = dialog();
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("rate-us-open");
    restoreEntry();
    entry = null;
    resetForm();
  }

  function open() {
    install();
    if (!dialog().hidden) return;
    entry = captureContext();
    resetForm();
    dialog().hidden = false;
    document.body.classList.add("rate-us-open");
    const firstStar = dialog().querySelector('input[name="sczn3-rating"]');
    if (firstStar) firstStar.focus();
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting || !entry) return;
    const selected = document.querySelector('input[name="sczn3-rating"]:checked');
    if (!selected) {
      status("Choose a star rating before submitting.", true);
      return;
    }
    const submissionKey = createId();
    const commentValue = document.getElementById("sczn3RateUsComment").value;
    const payload = {
      submissionKey,
      rating: Number(selected.value),
      comment: commentValue === "" ? null : commentValue,
      source: SOURCE,
      context: entry.context
    };
    submitting = true;
    const submitButton = document.getElementById("sczn3RateUsSubmit");
    submitButton.disabled = true;
    status("Submitting…");
    try {
      const response = await global.fetch(endpoint(), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", "Idempotency-Key": submissionKey },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.ok !== true) throw new Error(result && result.reason || "rating_submission_failed");
      try { global.localStorage.setItem(RETURN_MARKER, "submitted"); } catch (_) {}
      const nextDestination = entry.returnState.nextDestination;
      status("Thank you.");
      close();
      if (nextDestination) global.location.assign(nextDestination);
    } catch (_) {
      submitting = false;
      submitButton.disabled = false;
      status("We couldn't submit your rating. Your session is still here—please try again.", true);
    }
  }

  function install() {
    if (installed || !document || !document.body) return;
    installed = true;
    const modal = document.createElement("div");
    modal.id = "sczn3RateUsDialog";
    modal.className = "rate-us-dialog";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "sczn3RateUsTitle");
    modal.innerHTML = `
      <section class="rate-us-card">
        <button class="rate-us-close" type="button" data-rate-us-close aria-label="Close Rate Us">×</button>
        <form id="sczn3RateUsForm">
          <h2 id="sczn3RateUsTitle">Rate Your SCZN3 Experience</h2>
          <fieldset class="rate-us-stars" aria-label="Choose a rating from 1 to 5 stars">
            <legend class="rate-us-visually-hidden">Rating</legend>
            ${[1, 2, 3, 4, 5].map(value => `<label><input type="radio" name="sczn3-rating" value="${value}" /><span aria-hidden="true">★</span><span class="rate-us-visually-hidden">${value} star${value === 1 ? "" : "s"}</span></label>`).join("")}
          </fieldset>
          <label class="rate-us-comment" for="sczn3RateUsComment">What did you like—or what could we do better? <span>(optional)</span></label>
          <textarea id="sczn3RateUsComment" maxlength="5000" rows="4"></textarea>
          <p class="rate-us-status" id="sczn3RateUsStatus" role="status" aria-live="polite"></p>
          <button class="button primary rate-us-submit" id="sczn3RateUsSubmit" type="submit">Submit</button>
        </form>
      </section>`;
    document.body.append(modal);
    document.getElementById("sczn3RateUsForm").addEventListener("submit", submit);
    modal.querySelector("[data-rate-us-close]").addEventListener("click", close);
    modal.addEventListener("pointerdown", event => { if (event.target === modal) close(); });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !modal.hidden) {
        event.preventDefault();
        close();
      }
    });
    document.documentElement.dataset.sczn3RateUsReady = "true";
  }

  global.SCZN3RateUs = Object.freeze({ install, open, close, captureContext });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})(window);
