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

  function noticeHtml() {
    return `
      <aside class="sec-practice-notice" aria-label="${PRACTICE_NOTICE.title}">
        <strong>${PRACTICE_NOTICE.title}</strong>
        ${PRACTICE_NOTICE.paragraphs.map(text => `<p>${text}</p>`).join("")}
      </aside>
    `;
  }

  function blockedItemsHtml() {
    const items = [
      ["Overall Practice Result", "Definition and calculation authority are not approved."],
      ["Group Center and POIB", "Aim-point, geometry, and group-center methods are not approved."],
      ["Group Size", "The measurement method, units, and physical scale are not approved."],
      ["Consistency and Improvement", "Comparable-session and analysis authority are not approved."]
    ];
    return `
      <div class="sec-practice-blocked-grid" aria-label="Intentionally blocked Practice Analysis fields">
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
    const sessionId = cleanText(session && session.sessionId);
    const timestamp = cleanText(session && session.timestamp);
    const rows = [
      ["Smart Target", "ST-001 — Universal Smart Target"],
      ["Mission", "Universal Practice"],
      ["Authority", "Practice Analysis"],
      ["Runtime Status", "Authority unavailable"],
      ["Session Identifier", sessionId || "Unavailable"],
      ["Date and Time", timestamp || "Unavailable"]
    ];
    return `
      <div class="sec-session-summary-grid">
        ${rows.map(([label, value]) => `
          <div${label === "Session Identifier" ? ' class="is-wide"' : ""}>
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

    return global.SCZN3SEC.render({
      schemaVersion: "1.1",
      recordId,
      missionFamily: MISSION_FAMILY,
      articleClassName: "history-card universal-practice-sec-card is-authority-blocked",
      articleAttributes: {
        "data-authority-classification": AUTHORITY_CLASSIFICATION,
        "data-authority-state": "unavailable",
        "data-st001-sec-state": "blocked"
      },
      regions: [
        {
          key: "evidence",
          className: "sec-v1-evidence-content",
          ariaLabel: "Evidence",
          contentHtml: `
            <section class="sec-v1-adapter-block sec-practice-evidence" aria-labelledby="st001-evidence">
              <div class="sec-workspace-heading">
                <div><span>1 · Evidence</span><h3 class="sec-v1-region-title" id="st001-evidence">Evidence Workspace</h3></div>
                <small>Registered evidence is required before analysis can begin.</small>
              </div>
              <div class="sec-practice-evidence-unavailable" role="status">
                <strong>Evidence unavailable</strong>
                <span>ST-001 has no approved canonical asset, Registration Package, or Geometry Profile.</span>
              </div>
            </section>
          `
        },
        {
          key: "measurement",
          className: "sec-v1-measurement-content",
          ariaLabel: "Measurement",
          contentHtml: `
            <div class="sec-experience-heading"><span>2 · Measurement</span><h3 class="sec-v1-region-title">Measured Result</h3></div>
            <div class="sec-primary-result-grid"><div class="sec-primary-result-value"><span>Practice Analysis</span><strong class="sec-v1-result-value">Unavailable</strong></div><div class="sec-supporting-metric"><span>Measurements</span><strong>None calculated</strong><small>Missing authority remains unavailable. It is never converted to zero.</small></div></div>
          `
        },
        {
          key: "recommendation",
          className: "sec-v1-recommendation-content",
          ariaLabel: "Recommendation or Score",
          contentHtml: `
            <div class="sec-experience-heading"><span>3 · Recommendation / Score</span><h3 class="sec-v1-region-title">Analysis Status</h3></div>
            <section class="sec-v1-adapter-block sec-v1-explanation-primary sec-practice-explanation" aria-labelledby="st001-explanation">
              <span class="sec-component-label">Why results are unavailable</span><h3 class="sec-v1-region-title" id="st001-explanation">Authority must precede measurement</h3><p>${escapeHtml(reason)}</p><p>No score, group measurement, POIB, consistency value, or improvement claim has been fabricated.</p>
            </section>
          `
        },
        {
          key: "execution",
          className: "sec-v1-execution-content",
          ariaLabel: "Execution",
          contentHtml: `
            <span>4 · Execution</span>
            <strong>Complete and approve ST-001 authority before Practice Analysis begins.</strong>
            <i aria-hidden="true">→</i>
          `
        },
        {
          key: "validation",
          className: "sec-v1-validation-content",
          ariaLabel: "Validation",
          contentHtml: `
            <div class="sec-experience-heading"><span>5 · Validation</span><h3 class="sec-v1-region-title">Authority State</h3></div>
            <section class="sec-v1-adapter-block sec-secondary-result" aria-labelledby="st001-authority-state"><span>Authority State</span><h3 id="st001-authority-state">Practice Analysis</h3><strong>Blocked</strong></section>
            <section class="sec-v1-adapter-block sec-v1-performance-detail sec-practice-performance" aria-labelledby="st001-blocked-fields"><h3 class="sec-v1-region-title" id="st001-blocked-fields">Intentionally Blocked</h3>${blockedItemsHtml()}</section>
            ${global.SCZN3SEC.renderAchievementScale("Unavailable — no approved achievement authority")}
            ${noticeHtml()}
          `
        },
        {
          key: "preservation",
          className: "sec-v1-preservation-content",
          ariaLabel: "Preservation",
          contentHtml: `
            <section class="sec-v1-adapter-block sec-v1-history-content" aria-labelledby="st001-session-summary"><span>6 · Preservation</span><h3 class="sec-v1-region-title" id="st001-session-summary">Session Summary</h3>${sessionSummaryHtml(session)}</section>
            <div class="sec-v1-wordmark"><span>SEC</span><small>Shooter Experience Card</small></div>
            <div class="sec-identity-ledger">
              <div><span>Smart Target</span><strong>ST-001</strong></div>
              <div><span>SEC Version</span><strong>1.1</strong></div>
              <div><span>Authority</span><strong>Practice Analysis</strong></div>
              <div><span>Confidence</span><strong>Authority unavailable</strong></div>
            </div>
            <div class="sec-v1-record-actions" aria-label="SEC actions">
              <span class="sec-save-status">Export unavailable</span>
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
