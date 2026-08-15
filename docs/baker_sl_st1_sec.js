(function (global) {
  "use strict";

  const TARGET_ID = "BAKER_SL_ST1";
  const VARIANT_ID = "BAKER_SL_ST1_23X35_STANDARD_WHITE";
  const MISSION_FAMILY = "smartEvidenceCapture";
  const RESULT_PACKAGE_TYPE = "smartEvidenceResult";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clean(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  function targetIdentity(pkg) {
    return clean(pkg && pkg.target && pkg.target.smartTargetId).toUpperCase();
  }

  function matches(pkg) {
    return !!(
      pkg
      && pkg.ok === true
      && pkg.status === "supported_analysis_ready"
      && (pkg.missionFamily === MISSION_FAMILY || pkg.mission_family === MISSION_FAMILY)
      && pkg.resultPackageType === RESULT_PACKAGE_TYPE
      && targetIdentity(pkg) === TARGET_ID
      && pkg.target.variantId === VARIANT_ID
    );
  }

  function authorityPackage(session) {
    return session && (
      session.authorityPackage
      || session.backendAuthorityPackage
      || session.ugeoAuthorityPackage
      || session.m4AuthorityPackage
    ) || null;
  }

  function authoritativeTargetVersion(session) {
    const pkg = authorityPackage(session);
    return matches(pkg) ? `${TARGET_ID}::${VARIANT_ID}` : "";
  }

  function preservedScoreMetric(session) {
    const summary = scoringSummary(authorityPackage(session));
    return summary ? summary.total : Number.NaN;
  }

  function sessionTimelineModel(records, currentSessionId = "") {
    if (!global.SCZN3SECSessionTimeline) return Object.freeze({ points: Object.freeze([]), currentSessionId: clean(currentSessionId) });
    return global.SCZN3SECSessionTimeline.build({
      records,
      expectedIdentity: `${TARGET_ID}::${VARIANT_ID}`,
      identityResolver: authoritativeTargetVersion,
      metricResolver: preservedScoreMetric,
      currentSessionId
    });
  }

  function impactCount(pkg) {
    const count = Number(pkg && pkg.supportedAnalysis && pkg.supportedAnalysis.impactCount);
    const impacts = Array.isArray(pkg && pkg.impacts) ? pkg.impacts : [];
    return Number.isInteger(count) && count >= 0 && count === impacts.length ? count : null;
  }

  function impactLabel(count) {
    return `${count} ${count === 1 ? "Bullet Hole" : "Bullet Holes"}`;
  }

  function scoringSummary(pkg) {
    const scoring = pkg && pkg.scoring;
    const distribution = pkg && pkg.productRegionDistribution;
    const trace = pkg && pkg.authorityTrace;
    if (!scoring || scoring.status !== "complete" || !distribution || distribution.status !== "complete") return null;
    if (!trace || trace.classificationAuthority !== "backend" || trace.geometryAuthorityId !== "UGO_BAKER_SL_ST1_23X35_V1" || trace.coordinateSystemId !== "UGO_IMAGE_PLANE_TOP_LEFT_V1" || trace.scoringAuthorityId !== "BAKER_SL_ST1_SCORING_V1") return null;
    const values = scoring.zoneValues;
    const subtotals = scoring.subtotals;
    const counts = distribution.zoneCounts;
    if (!values || !subtotals || !counts || scoring.objective !== "highest_score_wins") return null;
    const governed = { A: 10, B: 9, C: 8, D: 7 };
    let total = 0;
    let classified = 0;
    for (const zone of ["A", "B", "C", "D"]) {
      if (values[zone] !== governed[zone] || !Number.isInteger(counts[zone]) || counts[zone] < 0) return null;
      if (!Number.isInteger(subtotals[zone]) || subtotals[zone] !== counts[zone] * values[zone]) return null;
      total += subtotals[zone];
      classified += counts[zone];
    }
    if (counts.outside !== 0 || counts.indeterminate_boundary !== 0) return null;
    if (classified !== impactCount(pkg) || distribution.classifiedImpactCount !== classified) return null;
    const observedCounts = { A: 0, B: 0, C: 0, D: 0 };
    for (const impact of pkg.impacts) {
      if (!Object.hasOwn(observedCounts, impact.zone) || impact.zoneValue !== values[impact.zone]) return null;
      observedCounts[impact.zone] += 1;
    }
    for (const zone of ["A", "B", "C", "D"]) if (observedCounts[zone] !== counts[zone]) return null;
    if (!distribution.reconciliation || distribution.reconciliation.countsMatchCapturedImpactCount !== true) return null;
    if (scoring.total !== total) return null;
    return { counts, values, subtotals, total: scoring.total, capturedCount: classified };
  }

  function scoringHtml(summary) {
    if (!summary) return "";
    const rows = ["A", "B", "C", "D"].map(zone =>
      `<div class="sec-baker-zone-row" data-zone="${zone}" aria-label="${zone}: ${summary.counts[zone]} times ${summary.values[zone]} equals ${summary.subtotals[zone]}"><strong class="sec-baker-zone-name">${zone}</strong><span class="sec-baker-zone-equation"><b>${summary.counts[zone]}</b><i aria-hidden="true">×</i><b>${summary.values[zone]}</b></span><i class="sec-baker-zone-equals" aria-hidden="true">=</i><strong class="sec-baker-zone-subtotal">${summary.subtotals[zone]}</strong></div>`
    ).join("");
    return `<section class="sec-baker-performance" aria-label="SL-ST1 score and zone performance">
      <header class="sec-baker-score-hero"><span>Total Score</span><strong>${summary.total}</strong><small>Highest score wins</small></header>
      <div class="sec-baker-zone-performance"><h3>Zone Performance</h3><div class="sec-baker-zone-rows">${rows}</div></div>
      <p class="sec-baker-count-reconciliation"><strong>${summary.capturedCount}</strong> numbered ${summary.capturedCount === 1 ? "bullet hole" : "bullet holes"} <span aria-hidden="true">•</span> all accounted for</p>
    </section>`;
  }

  function vaultResultSummary(pkg) {
    if (!matches(pkg)) return null;
    const count = impactCount(pkg);
    if (count === null) return null;
    const score = scoringSummary(pkg);
    if (!score) {
      return Object.freeze({
        status: "unavailable",
        primaryLabel: "SCORE UNAVAILABLE",
        objectiveLabel: "Open SEC for details",
        evidenceLabel: `${count} ${count === 1 ? "bullet hole" : "bullet holes"}`
      });
    }
    return Object.freeze({
      status: "complete",
      primaryValue: String(score.total),
      primaryUnit: "POINTS",
      objectiveLabel: "HIGHEST SCORE WINS",
      breakdown: Object.freeze(["A", "B", "C", "D"].map(zone => Object.freeze({
        label: zone,
        value: String(score.counts[zone])
      }))),
      evidenceLabel: `${score.capturedCount} ${score.capturedCount === 1 ? "bullet hole" : "bullet holes"}`
    });
  }

  function vaultEvidenceModel(session, pkg) {
    if (!matches(pkg)) return null;
    const count = impactCount(pkg);
    const evidence = session && session.targetEvidenceImage || {};
    const imageUrl = clean(evidence.dataUrl);
    if (count === null || !imageUrl) return null;
    const markers = pkg.impacts.map((impact, index) => {
      const point = impact && impact.sourceEvidencePoint || impact;
      const xNorm = Number(point && point.xNorm);
      const yNorm = Number(point && point.yNorm);
      if (!Number.isFinite(xNorm) || !Number.isFinite(yNorm) || xNorm < 0 || xNorm > 1 || yNorm < 0 || yNorm > 1) return null;
      return Object.freeze({ xPercent: xNorm * 100, yPercent: yNorm * 100, label: String(index + 1) });
    });
    if (markers.some(marker => !marker) || markers.length !== count) return null;
    return Object.freeze({
      status: "complete",
      imageUrl,
      imageAlt: `${clean(session && session.sessionLabel) || "Saved session"} completed target with ${count} numbered ${count === 1 ? "bullet hole" : "bullet holes"}`,
      evidence,
      markers: Object.freeze(markers)
    });
  }

  function displayDateTime(session) {
    const raw = clean(session && (session.preservedAt || session.createdAt || session.timestamp));
    const date = raw ? new Date(raw) : null;
    if (!date || Number.isNaN(date.getTime())) return null;
    return {
      date: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    };
  }

  function sessionValues(session) {
    const snapshot = session && session.matrixSnapshot || {};
    const firearm = [
      clean(snapshot.weaponManufacturer),
      clean(snapshot.weaponModelType || snapshot.rifle),
      clean(snapshot.weaponModelCaliber)
    ].filter(Boolean).join(" · ");
    const equipment = [
      clean(snapshot.opticBrand),
      clean(snapshot.opticModel || snapshot.opticType)
    ].filter(Boolean).join(" · ");
    const ammunition = [
      clean(snapshot.ammoManufacturer),
      clean(snapshot.ammoLoad || snapshot.ammoCaliber),
      clean(snapshot.bulletWeight)
    ].filter(Boolean).join(" · ");
    const distanceValue = clean(snapshot.targetDistanceValue || session && session.targetDistanceValue);
    const distanceUnit = clean(snapshot.targetDistanceUnit || session && session.targetDistanceUnit);
    const distance = distanceValue ? `${distanceValue}${distanceUnit ? ` ${distanceUnit}` : ""}` : "";
    return {
      firearm,
      equipment,
      ammunition,
      distance,
      shooter: clean(snapshot.shooterName),
      dateTime: displayDateTime(session)
    };
  }

  function missingOptionalDetails(session) {
    const values = sessionValues(session);
    return [
      ["firearm", "Firearm", values.firearm],
      ["ammunition", "Ammunition", values.ammunition],
      ["distance", "Distance", values.distance],
      ["shooter", "Shooter", values.shooter]
    ].filter(([, , value]) => !value).map(([key, label]) => ({ key, label }));
  }

  function sessionDetailsHtml(session) {
    const values = sessionValues(session);
    const rows = [
      ["Firearm", values.firearm],
      ["Equipment", values.equipment],
      ["Ammunition", values.ammunition],
      ["Distance", values.distance],
      ["Date", values.dateTime && values.dateTime.date],
      ["Time", values.dateTime && values.dateTime.time],
      ["Shooter", values.shooter]
    ].filter(([, value]) => value);
    return rows.map(([label, value]) => `<div><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  }

  function evidenceHtml(session, pkg) {
    const evidence = session && session.targetEvidenceImage || {};
    const imageUrl = clean(evidence.dataUrl);
    if (!imageUrl) return '<div class="sec-comparison-pending">Target photograph unavailable</div>';
    const markers = pkg.impacts.map((impact, index) => {
      // A Mission B package carries both coordinate truths: the source point
      // places the marker on the photographed evidence, while xNorm/yNorm are
      // the backend-derived canonical coordinates used by Mission A scoring.
      const evidencePoint = impact && impact.sourceEvidencePoint || impact;
      const x = Math.max(0, Math.min(100, Number(evidencePoint.xNorm) * 100));
      const y = Math.max(0, Math.min(100, Number(evidencePoint.yNorm) * 100));
      return `<span class="sec-baker-impact-marker" style="left:${x}%;top:${y}%" aria-hidden="true">${index + 1}</span>`;
    }).join("");
    return `<div class="sec-baker-evidence-viewport"><div class="sec-baker-evidence-frame"><img src="${escapeHtml(imageUrl)}" alt="Baker SL-ST1 target with numbered bullet-hole markers" /><div class="sec-baker-impact-layer">${markers}</div></div></div>`;
  }

  function detailsInvitationHtml(session, mode, dismissed) {
    if (mode !== "live" || dismissed) return "";
    const missing = missingOptionalDetails(session);
    if (!missing.length) return "";
    const labels = missing.map(item => item.label.toLowerCase());
    const list = labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
    const inputs = missing.map(item => {
      const type = item.key === "distance" ? "text" : "text";
      return `<label>${escapeHtml(item.label)}<input type="${type}" name="${escapeHtml(item.key)}" autocomplete="off" /></label>`;
    }).join("");
    return `<aside class="sec-baker-details-invitation" data-baker-details-invitation>
      <p>Add ${escapeHtml(list)} to make this shooting record easier to remember.</p>
      <div class="sec-baker-details-invitation-actions"><button class="button" type="button" data-baker-add-details>Add Details</button><button class="button" type="button" data-baker-dismiss-details>Not Now</button></div>
      <form class="sec-baker-details-form" data-baker-details-form hidden>${inputs}<div><button class="button primary" type="submit">Save Details</button><button class="button" type="button" data-baker-cancel-details>Cancel</button></div></form>
    </aside>`;
  }

  function actionBarHtml(mode, preserved = false) {
    if (mode === "historical") {
      return `<div class="sec-preservation-actions"><button class="button" type="button" data-sec-export>Export SEC</button><button class="button" type="button" data-sec-share>Share SEC</button><a class="button primary" href="records.html">Back to Vault</a></div>`;
    }
    return `<div class="sec-preservation-actions"><button class="button${preserved ? " is-preserved" : " primary"}" type="button" data-baker-save-sec${preserved ? " disabled" : ""}>${preserved ? "SEC Preserved" : "Save SEC"}</button><button class="button" type="button" data-sec-share>Share</button><button class="button" type="button" data-sec-export>Export / Print PDF</button><button class="button" type="button" data-baker-add-note>Add Note</button><a class="button" href="../../../records.html">View History</a></div>
      <div class="sec-note-editor" data-baker-note-editor hidden><label>Session note<textarea rows="3" data-baker-note></textarea></label><button class="button" type="button" data-baker-save-note>Save Note</button></div><span class="sec-action-status" data-baker-sec-status role="status" aria-live="polite"></span>`;
  }

  function render({ session = {}, package: pkg = null, mode = "live", detailsDismissed = false, timelineRecords = [], timelineRecordsHref = "records.html", preserved = session.savedToSEC === true } = {}) {
    if (!global.SCZN3SEC || !matches(pkg)) {
      return global.SCZN3SEC ? global.SCZN3SEC.renderUnavailable("Results unavailable") : "";
    }
    const count = impactCount(pkg);
    if (count === null) return global.SCZN3SEC.renderUnavailable("Results unavailable");
    const label = impactLabel(count);
    const score = scoringSummary(pkg);
    const timeline = global.SCZN3SECSessionTimeline
      ? global.SCZN3SECSessionTimeline.render(
          sessionTimelineModel(timelineRecords, clean(session.sessionId)),
          { title: "Last 10 Scores", valueUnit: "points", recordsHref: timelineRecordsHref }
        )
      : "";
    return global.SCZN3SEC.render({
      schemaVersion: "1.2",
      recordId: clean(session.sessionId) || "baker-sl-st1-sec",
      missionFamily: "smartEvidenceCapture",
      sessionLabel: clean(session.sessionLabel) || "Session",
      scoreDisplay: score ? `${score.total} Points` : label,
      articleClassName: "history-card baker-sl-st1-sec-card",
      articleAttributes: { "data-target-id": TARGET_ID, "data-sec-mode": mode },
      regions: [
        {
          key: "target",
          className: "sec-v1-evidence-content",
          ariaLabel: "Target",
          contentHtml: `<section class="sec-baker-performance-stage"><section class="sec-baker-target-evidence"><header><span>Target Evidence</span><strong>Baker SL-ST1</strong></header><figure>${evidenceHtml(session, pkg)}</figure></section>${score ? scoringHtml(score) : `<section class="sec-baker-score-unavailable"><span>Score</span><strong>Unavailable</strong><small>${escapeHtml(label)} preserved</small></section>`}</section>`
        },
        {
          key: "session",
          className: "sec-v1-measurement-content",
          ariaLabel: "Session",
          contentHtml: `${timeline}<section class="sec-session-section"><h3>Session Details</h3><div class="sec-session-record-fields">${sessionDetailsHtml(session)}</div></section>${detailsInvitationHtml(session, mode, detailsDismissed)}`
        },
        {
          key: "actions",
          className: "sec-v1-preservation-content",
          ariaLabel: "Shooter Action Bar",
          contentHtml: actionBarHtml(mode, preserved)
        }
      ]
    });
  }

  global.SCZN3BakerSLST1SEC = Object.freeze({
    targetId: TARGET_ID,
    variantId: VARIANT_ID,
    missionFamily: MISSION_FAMILY,
    resultPackageType: RESULT_PACKAGE_TYPE,
    matches,
    impactCount,
    scoringSummary,
    vaultResultSummary,
    vaultEvidenceModel,
    authoritativeTargetVersion,
    preservedScoreMetric,
    sessionTimelineModel,
    missingOptionalDetails,
    render
  });
})(window);
