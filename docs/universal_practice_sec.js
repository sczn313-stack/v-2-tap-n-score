(function (global) {
  "use strict";

  const RESULT_PACKAGE_TYPE = "universalPracticeAnalysisResult";
  const MISSION_FAMILY = "universalPractice";
  const AUTHORITY_CLASSIFICATION = "practice_analysis";
  const CALCULATED_AUTHORITY_ENABLED = false;

  const BLOCKED_REASONS = Object.freeze({
    missing_reference_registration: "The ST-001 physical reference has not been registered.",
    missing_registration_package: "The ST-001 canonical asset has not been registered.",
    missing_geometry_authority: "ST-001 geometry authority is unavailable.",
    missing_measurement_authority: "Universal Practice measurement authority is unavailable.",
    missing_execution_authority: "The Universal Practice Execution Contract is not active.",
    episode_38_components_unapproved: "The Episode 38 authority components remain under founder review.",
    calculated_authority_not_registered: "Calculated Universal Practice results are not yet authorized."
  });

  const PRACTICE_NOTICE = Object.freeze({
    title: "Practice Analysis Only",
    paragraphs: Object.freeze([
      "This Shooter Experience Card was generated for practice, training, and personal performance analysis.",
      "It is not an official competition result and has not been sanctioned or endorsed by the governing organization associated with this target.",
      "Official competition results remain the responsibility of the governing organization and its approved scoring procedures."
    ])
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

  function matches(pkg) {
    if (!pkg || typeof pkg !== "object") return false;
    return pkg.resultPackageType === RESULT_PACKAGE_TYPE
      || pkg.missionFamily === MISSION_FAMILY
      || pkg.mission_family === MISSION_FAMILY;
  }

  function blockedReason(pkg) {
    if (pkg && pkg.status === "calculated" && !CALCULATED_AUTHORITY_ENABLED) {
      return BLOCKED_REASONS.calculated_authority_not_registered;
    }
    const code = cleanText(pkg && pkg.reasonCode);
    return BLOCKED_REASONS[code] || "Required ST-001 authority is unavailable.";
  }

  function validBlockedEnvelope(pkg) {
    return !!(
      pkg
      && pkg.ok === false
      && pkg.status === "authority_unavailable"
      && pkg.resultPackageType === RESULT_PACKAGE_TYPE
      && pkg.authorityClassification === AUTHORITY_CLASSIFICATION
      && (pkg.missionFamily === MISSION_FAMILY || pkg.mission_family === MISSION_FAMILY)
    );
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
        ? global.SCZN3SEC.renderUnavailable("Universal Practice result unavailable")
        : "";
    }

    const acceptedEnvelope = validBlockedEnvelope(pkg);
    const reason = acceptedEnvelope
      ? blockedReason(pkg)
      : (pkg.status === "calculated"
          ? BLOCKED_REASONS.calculated_authority_not_registered
          : "The Universal Practice authority package is incomplete or mismatched.");
    const recordId = cleanText(session.sessionId) || "st-001-authority-unavailable";
    const shooterGuidance = global.SCZN3Presentation
      ? global.SCZN3Presentation.blockedTargetGuidance("this practice target")
      : "You can choose another available Smart Target. SCZN3 cannot analyze this practice target yet. Return Home to continue.";

    return global.SCZN3SEC.render({
      schemaVersion: "1.2",
      recordId,
      missionFamily: MISSION_FAMILY,
      sessionLabel: session.sessionLabel || "Session",
      scoreDisplay: "Score Unavailable",
      articleClassName: "history-card universal-practice-sec-card is-authority-blocked",
      articleAttributes: {
        "data-authority-classification": AUTHORITY_CLASSIFICATION,
        "data-authority-state": "unavailable",
        "data-st001-sec-state": "blocked"
      },
      regions: [
        {
          key: "target",
          className: "sec-v1-evidence-content",
          ariaLabel: "Target",
          contentHtml: `
            <section class="sec-v1-adapter-block sec-practice-evidence" aria-labelledby="st001-evidence">
              <div class="sec-workspace-heading">
                <div><h3 class="sec-v1-region-title" id="st001-evidence">Target Evidence</h3></div>
              </div>
              <div class="sec-practice-evidence-unavailable" role="status">
                <strong>This target is not ready for analysis.</strong>
                <span>${escapeHtml(shooterGuidance)}</span>
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
            <div class="sec-primary-result-grid"><div class="sec-primary-result-value"><span>Practice Analysis</span><strong class="sec-v1-result-value">Not available</strong></div><div class="sec-supporting-metric"><span>Measurements</span><strong>Not available</strong></div></div>
            </div></details>
          `
        },
        {
          key: "actions",
          className: "sec-v1-preservation-content",
          ariaLabel: "Shooter Action Bar",
          contentHtml: `
            <div class="sec-v1-record-actions" aria-label="SEC actions">
              <span class="sec-save-status">Export not available</span>
            </div>
          `
        }
      ]
    });
  }

  global.SCZN3UniversalPracticeSEC = Object.freeze({
    resultPackageType: RESULT_PACKAGE_TYPE,
    missionFamily: MISSION_FAMILY,
    authorityClassification: AUTHORITY_CLASSIFICATION,
    calculatedAuthorityEnabled: CALCULATED_AUTHORITY_ENABLED,
    practiceNotice: PRACTICE_NOTICE,
    matches,
    render
  });
})(window);
