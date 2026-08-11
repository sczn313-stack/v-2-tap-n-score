(function (global) {
  "use strict";

  const PORTFOLIO_PRODUCT = "M4 — Baker Smart Target";
  const CANDIDATE_REFERENCE_ID = "M4_25M_ZERO";
  const AUTHORITY_CLASSIFICATION = "research";
  const CALCULATED_AUTHORITY_ENABLED = false;

  const BLOCKED_REASONS = Object.freeze({
    missing_exact_reference_registration: "The exact M4 physical reference and publisher-product mapping have not been approved.",
    unresolved_product_mapping: "The M4 portfolio product has not been mapped to an approved Reference Target Registration Record.",
    missing_registration_package: "No approved M4 Registration Package or canonical asset is registered.",
    missing_geometry_authority: "Complete M4 geometry and physical-scale authority are unavailable.",
    missing_measurement_authority: "M4 zeroing measurement and correction authority are unavailable.",
    missing_execution_authority: "No M4 Target Execution Contract is active.",
    calculated_authority_not_registered: "Calculated M4 results are not authorized."
  });

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cleanText(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  function packageTargetId(pkg) {
    if (!pkg || typeof pkg !== "object") return "";
    const trace = pkg.authorityTrace && typeof pkg.authorityTrace === "object"
      ? pkg.authorityTrace
      : {};
    return cleanText(
      pkg.targetId
      || pkg.target_id
      || pkg.targetProfileId
      || pkg.target_profile_id
      || trace.targetId
      || trace.targetProfileId
    ).toUpperCase();
  }

  function matches(pkg) {
    return packageTargetId(pkg) === CANDIDATE_REFERENCE_ID;
  }

  function validBlockedEnvelope(pkg) {
    return !!(
      pkg
      && pkg.ok === false
      && pkg.status === "authority_unavailable"
      && pkg.authorityClassification === AUTHORITY_CLASSIFICATION
      && packageTargetId(pkg) === CANDIDATE_REFERENCE_ID
    );
  }

  function blockedReason(pkg) {
    if (pkg && pkg.status === "calculated" && !CALCULATED_AUTHORITY_ENABLED) {
      return BLOCKED_REASONS.calculated_authority_not_registered;
    }
    const code = cleanText(pkg && pkg.reasonCode);
    return BLOCKED_REASONS[code] || BLOCKED_REASONS.unresolved_product_mapping;
  }

  function researchNoticeHtml() {
    return `
      <aside class="sec-practice-notice" aria-label="Research authority notice">
        <strong>Research Authority</strong>
        <p>The M4 target is recognized as an Episode 37 portfolio product, but its exact physical reference and current authority chain are not approved.</p>
        <p>This review card does not represent a measured zero, an authorized correction, or a completed shooting result.</p>
      </aside>
    `;
  }

  function blockedItemsHtml() {
    const items = [
      ["Exact Product Identity", "The portfolio product is not yet mapped to a registered physical reference."],
      ["Evidence and Geometry", "No approved canonical asset, complete geometry, or physical scale is registered."],
      ["Group Center and POIB", "The impact, aim-point, and group-center evidence contract is not approved."],
      ["Zeroing Corrections", "No M4 measurement profile or execution contract authorizes correction values."]
    ];
    return `
      <div class="sec-practice-blocked-grid" aria-label="Intentionally blocked M4 fields">
        ${items.map(([label, reason]) => `
          <div>
            <span>${label}</span>
            <strong>Unavailable</strong>
            <small>${reason}</small>
          </div>
        `).join("")}
      </div>
    `;
  }

  function sessionSummaryHtml(session) {
    const snapshot = session && session.matrixSnapshot || {};
    const timestamp = cleanText(session && (session.preservedAt || session.timestamp));
    const rows = [
      ["Firearm", cleanText(snapshot.rifle) || "Not recorded"],
      ["Equipment", cleanText(snapshot.opticModel || snapshot.opticType) || "Not recorded"],
      ["Ammunition", cleanText(snapshot.ammoLoad || snapshot.ammoCaliber) || "Not recorded"],
      ["Distance", cleanText(session && session.targetDistanceLabel) || "Not recorded"],
      ["Date / Time", timestamp || "Not recorded"],
      ["Shooter", cleanText(snapshot.shooterName) || "Not recorded"]
    ];
    return `
      <div class="sec-session-summary-grid">
        ${rows.map(([label, value]) => `
          <div>
            <span>${label}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `).join("")}
      </div>
    `;
  }

  function render({ session = {}, package: pkg = null } = {}) {
    if (!global.SCZN3SEC || !matches(pkg)) {
      return global.SCZN3SEC
        ? global.SCZN3SEC.renderUnavailable("M4 Smart Target result unavailable")
        : "";
    }

    const acceptedEnvelope = validBlockedEnvelope(pkg);
    const reason = acceptedEnvelope
      ? blockedReason(pkg)
      : (pkg.status === "calculated"
          ? BLOCKED_REASONS.calculated_authority_not_registered
          : "The M4 authority package is incomplete or mismatched.");
    const recordId = cleanText(session.sessionId) || "m4-authority-unavailable";

    return global.SCZN3SEC.render({
      schemaVersion: "1.2",
      recordId,
      missionFamily: "unavailable",
      sessionLabel: session.sessionLabel || "Session",
      scoreDisplay: "Score Unavailable",
      articleClassName: "history-card m4-smart-target-sec-card is-authority-blocked",
      articleAttributes: {
        "data-authority-classification": AUTHORITY_CLASSIFICATION,
        "data-authority-state": "unavailable",
        "data-m4-sec-state": "blocked",
        "data-target-id": CANDIDATE_REFERENCE_ID
      },
      regions: [
        {
          key: "target",
          className: "sec-v1-evidence-content",
          ariaLabel: "Target",
          contentHtml: `
            <section class="sec-v1-adapter-block sec-practice-evidence" aria-labelledby="m4-evidence">
              <div class="sec-workspace-heading">
                <div>
                  <h3 class="sec-v1-region-title" id="m4-evidence">Evidence Workspace</h3>
                </div>
                <small>Registered M4 evidence is required before analysis can begin.</small>
              </div>
              <div class="sec-practice-evidence-unavailable" role="status">
                <strong>Evidence unavailable</strong>
                <span>No approved M4 canonical asset, Registration Package, complete geometry, or execution authority exists.</span>
              </div>
            </section>
          `
        },
        {
          key: "session",
          className: "sec-v1-measurement-content",
          ariaLabel: "Session",
          contentHtml: `
            <section class="sec-session-section"><h3>Session Details</h3>${sessionSummaryHtml(session)}</section>
            <details class="correction-context-drawer sec-correction-context"><summary>Analysis</summary><div class="correction-context-panel">
            <div class="sec-primary-result-grid">
              <div class="sec-primary-result-value"><span>Zeroing Analysis</span><strong class="sec-v1-result-value">Unavailable</strong></div>
              <div class="sec-supporting-metric"><span>Measurements</span><strong>None calculated</strong><small>Missing authority remains unavailable. It is never converted to zero.</small></div>
            </div>
            <section class="sec-v1-adapter-block sec-v1-performance-detail sec-practice-performance" aria-labelledby="m4-blocked-fields"><h3 class="sec-v1-region-title" id="m4-blocked-fields">Intentionally Blocked</h3>${blockedItemsHtml()}</section>
            ${global.SCZN3SEC.renderAchievementScale("Unavailable — no approved M4 achievement authority")}
            ${researchNoticeHtml()}
            </div></details>
          `
        },
        {
          key: "sightCorrection",
          className: "sec-v1-recommendation-content",
          ariaLabel: "Sight Correction",
          contentHtml: `
            <section class="sec-v1-adapter-block sec-v1-explanation-primary sec-practice-explanation" aria-labelledby="m4-explanation">
              <span class="sec-component-label">Why results are unavailable</span>
              <h3 class="sec-v1-region-title" id="m4-explanation">Sight correction unavailable</h3>
              <p>${escapeHtml(reason)}</p>
              <p>The legacy M4 candidate and the separately supported Baker 100-yard product have not been substituted for one another.</p>
            </section>
            <section class="sec-v1-adapter-block sec-secondary-result" aria-labelledby="m4-authority-state">
              <span>Correction status</span><h3 id="m4-authority-state">Unavailable</h3><strong>No adjustment shown</strong>
            </section>
          `
        },
        {
          key: "actions",
          className: "sec-v1-preservation-content",
          ariaLabel: "Shooter Action Bar",
          contentHtml: `
            <div class="sec-v1-record-actions" aria-label="SEC actions">
              <span class="sec-save-status">Export unavailable</span>
            </div>
          `
        }
      ]
    });
  }

  global.SCZN3M4SmartTargetSEC = Object.freeze({
    portfolioProduct: PORTFOLIO_PRODUCT,
    candidateReferenceId: CANDIDATE_REFERENCE_ID,
    authorityClassification: AUTHORITY_CLASSIFICATION,
    calculatedAuthorityEnabled: CALCULATED_AUTHORITY_ENABLED,
    matches,
    render
  });
})(window);
