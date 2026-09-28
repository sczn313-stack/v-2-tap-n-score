(function (global) {
  "use strict";

  const TARGET_ID = "BAKER_SL_ST2";
  const VARIANT_ID = "BAKER_SL_ST2_23X35_STANDARD_WHITE";
  const MISSION_FAMILY = "idpaTimedPractice";
  const RESULT_PACKAGE_TYPE = "idpaTimeScoreResult";
  const SEC_ADAPTER_ID = "baker-sl-st2-idpa";
  const REQUIRED_STAGES = Object.freeze(["evidence", "measurement", "execution", "validation", "preservation"]);

  const clean = value => typeof value === "string" ? value.trim() : "";
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const authorityPackage = session => session && (session.authorityPackage || session.backendAuthorityPackage || session.ugeoAuthorityPackage || session.m4AuthorityPackage) || null;

  function matches(pkg) {
    return !!(pkg && pkg.ok === true && pkg.status === "supported_analysis_ready"
      && pkg.authoritySource === "backend-authoritative"
      && pkg.missionFamily === MISSION_FAMILY && pkg.resultPackageType === RESULT_PACKAGE_TYPE
      && pkg.target && pkg.target.smartTargetId === TARGET_ID && pkg.target.variantId === VARIANT_ID);
  }

  function verifiedResult(pkg) {
    if (!matches(pkg) || !pkg.scoring || pkg.scoring.status !== "complete" || pkg.scoring.objective !== "lowest_time_wins") return null;
    const trace = pkg.authorityTrace || {};
    const reconciliation = pkg.reconciliation || {};
    const selection = pkg.scoredSelection || {};
    if (trace.classificationAuthority !== "backend" || trace.calculationAuthority !== "backend") return null;
    if (trace.ugoAuthorityId !== "UGO_BAKER_SL_ST2_23X35_TARGET_PLANE_V1" || trace.missionAuthorityId !== "SCZN3_SL_ST2_TIMED_PAIR_7YD_V1" || trace.rulesAuthorityId !== "IDPA_RULEBOOK_2026_2") return null;
    if (reconciliation.selectionReconciles !== true || reconciliation.timeReconciles !== true || reconciliation.requiredImpactCount !== 2 || reconciliation.selectedImpactCount !== 2) return null;
    if (!Array.isArray(pkg.impacts) || pkg.impacts.length !== reconciliation.capturedImpactCount) return null;
    if (!Array.isArray(selection.selectedImpactIds) || selection.selectedImpactIds.length !== 2) return null;
    const parsed = [pkg.scoring.reportedRawTime, pkg.scoring.pointsDownTime, pkg.scoring.finalTime].map(Number);
    if (!parsed.every(Number.isFinite) || !Array.isArray(pkg.scoring.breakdown) || pkg.scoring.breakdown.length !== 4) return null;
    return {
      raw: pkg.scoring.reportedRawTime,
      pointsDown: Number(pkg.scoring.pointsDown),
      pointsDownTime: pkg.scoring.pointsDownTime,
      finalTime: pkg.scoring.finalTime,
      captured: reconciliation.capturedImpactCount,
      selected: selection.selectedImpactIds,
      excluded: selection.excludedImpactIds || [],
      counts: selection.selectedClassifications || {},
      breakdown: pkg.scoring.breakdown
    };
  }

  function secAdapterViewModel(session) {
    const registry = global.SCZN3TargetAdapters;
    if (!registry || !authorityPackage(session)) return null;
    const mapped = registry.createViewModel(SEC_ADAPTER_ID, { session });
    if (!mapped || mapped.ok !== true || !mapped.value) return null;
    const stages = mapped.value.semanticComponents.map(component => component.stage);
    if (stages.length !== REQUIRED_STAGES.length || stages.some((stage, index) => stage !== REQUIRED_STAGES[index])) return null;
    if (mapped.value.scoringPresentationFamily !== registry.scoringPresentationFamilies.LOWEST_SCORE_WINS) return null;
    return mapped.value;
  }

  function evidenceHtml(session, pkg) {
    const imageUrl = clean(session && session.targetEvidenceImage && session.targetEvidenceImage.dataUrl);
    if (!imageUrl) return '<div class="sec-comparison-pending">Target photograph unavailable</div>';
    const markers = pkg.impacts.map((impact, index) => {
      const point = impact.sourceEvidencePoint || {};
      const x = Number(point.xNorm) * 100;
      const y = Number(point.yNorm) * 100;
      if (![x, y].every(Number.isFinite)) return "";
      return `<span class="sec-target-impact-marker" style="left:${x}%;top:${y}%" aria-hidden="true">${index + 1}</span>`;
    }).join("");
    return `<div class="sec-target-evidence-viewport"><div class="sec-target-evidence-frame"><img src="${escapeHtml(imageUrl)}" alt="SL-ST2 target evidence with numbered bullet-hole markers" /><div class="sec-target-impact-layer">${markers}</div></div></div>`;
  }

  function performanceHtml(result) {
    const rows = result.breakdown.map(row => `<div class="sec-idpa-breakdown-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.count)} × ${escapeHtml(row.pointsDownValue)}s</strong><b>${escapeHtml(row.timeSubtotal)}s</b></div>`).join("");
    return global.SCZN3SECComponents.Result({
      family: "lowest-score-wins",
      contentHtml: `<section class="sec-idpa-performance" aria-label="Timed practice result">
        <header class="sec-idpa-time-hero"><span>Final Time</span><strong>${escapeHtml(result.finalTime)}<small>s</small></strong><b>Lowest time wins</b></header>
        <div class="sec-idpa-time-equation"><span>Reported Raw Time <strong>${escapeHtml(result.raw)}s</strong></span><i>+</i><span>Points-Down Time <strong>${escapeHtml(result.pointsDownTime)}s</strong></span></div>
        <section class="sec-idpa-breakdown"><h3>Best Two Hits</h3>${rows}</section>
        ${global.SCZN3SECComponents.Validation({ contentHtml: `<p class="sec-idpa-reconciliation"><strong>${result.selected.length}</strong> scored · <strong>${result.excluded.length}</strong> extra · <strong>${result.captured}</strong> bullet holes accounted for</p>` })}
      </section>`
    });
  }

  function sessionDetailsHtml(session, pkg) {
    const dateRaw = clean(session && (session.preservedAt || session.createdAt || session.timestamp));
    const date = dateRaw ? new Date(dateRaw) : null;
    const fields = [
      { label: "Mission", value: "Timed Pair — 7 Yards" },
      { label: "Reported Raw Time", value: `${pkg.scoring.reportedRawTime}s` },
      { label: "Time Source", value: "Manual shot-timer entry" },
      { label: "Evidence", value: `${pkg.impacts.length} numbered bullet holes · complete set affirmed` },
      date && !Number.isNaN(date.getTime()) ? { label: "Date", value: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) } : null,
      date && !Number.isNaN(date.getTime()) ? { label: "Time", value: date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) } : null
    ].filter(Boolean);
    return global.SCZN3SECComponents.SessionDetails({ fields });
  }

  function actionBarHtml(mode, preserved) {
    if (mode === "historical") return global.SCZN3SECComponents.ActionBar({ actions: [
      { label: "Export SEC", action: "export", attributes: { "data-sec-export": true } },
      { label: "Share SEC", action: "share", attributes: { "data-sec-share": true } },
      { label: "Ballistic Vault", action: "history", href: "records.html", primary: true }
    ] });
    return global.SCZN3SECComponents.ActionBar({
      actions: [
        { label: preserved ? "SEC Preserved" : "Save SEC", action: "save", primary: !preserved, disabled: preserved, className: preserved ? "is-preserved" : "", attributes: { "data-idpa-save-sec": true } },
        { label: "Share", action: "share", attributes: { "data-sec-share": true } },
        { label: "Export / Print PDF", action: "export", attributes: { "data-sec-export": true } },
        { label: "Ballistic Vault", action: "history", href: "../../../records.html" }
      ],
      afterHtml: '<span class="sec-action-status" data-idpa-sec-status role="status" aria-live="polite"></span>'
    });
  }

  function render({ session = {}, package: pkg = null, mode = "live", preserved = session.savedToSEC === true } = {}) {
    pkg = pkg || authorityPackage(session);
    const adapter = secAdapterViewModel(session);
    const result = verifiedResult(pkg);
    if (!global.SCZN3SEC || !adapter || !result) return global.SCZN3SEC ? global.SCZN3SEC.renderUnavailable("Results unavailable") : "";
    return global.SCZN3SEC.render({
      schemaVersion: "1.2",
      recordId: clean(session.sessionId) || "baker-sl-st2-idpa-sec",
      missionFamily: MISSION_FAMILY,
      sessionLabel: clean(session.sessionLabel) || "Session",
      scoreDisplay: `${result.finalTime} Seconds`,
      articleClassName: "history-card baker-sl-st2-idpa-sec-card",
      articleAttributes: {
        "data-target-id": TARGET_ID,
        "data-sec-mode": mode,
        "data-sec-adapter-id": SEC_ADAPTER_ID,
        "data-scoring-presentation-family": adapter.scoringPresentationFamily,
        "data-target-profile-id": adapter.targetProfileIdentity.targetProfileId,
        "data-target-profile-version": adapter.targetProfileIdentity.targetProfileVersion,
        "data-publisher-id": adapter.publisherIdentity.publisherId,
        "data-product-id": adapter.productIdentity.productId
      },
      regions: [
        { key: "target", className: "sec-v1-evidence-content", ariaLabel: "Target", contentHtml: `<section class="sec-evidence-result-layout">${global.SCZN3SECComponents.Evidence({ contentHtml: `<section class="sec-target-evidence"><header><span>Target Evidence</span><strong data-sczn3-target-profile-identity="idpa_silhouette_sl_st2">${escapeHtml(global.SCZN3TargetProfiles.display(adapter.targetProfileIdentity))}</strong></header><figure>${evidenceHtml(session, pkg)}</figure></section>` })}${performanceHtml(result)}</section>` },
        { key: "session", className: "sec-v1-measurement-content", ariaLabel: "Session", contentHtml: global.SCZN3SECComponents.Measurement({ contentHtml: sessionDetailsHtml(session, pkg) }) },
        { key: "actions", className: "sec-v1-preservation-content", ariaLabel: "Shooter Action Bar", contentHtml: global.SCZN3SECComponents.Preservation({ contentHtml: actionBarHtml(mode, preserved) }) }
      ]
    });
  }

  function vaultResultSummary(pkg) {
    const result = verifiedResult(pkg);
    if (!result) return null;
    return Object.freeze({
      status: "complete",
      primaryValue: result.finalTime,
      primaryUnit: "SECONDS",
      objectiveLabel: "LOWEST TIME WINS",
      breakdown: Object.freeze([
        Object.freeze({ label: "RAW", value: `${result.raw}s` }),
        Object.freeze({ label: "DOWN", value: `+${result.pointsDownTime}s` })
      ]),
      evidenceLabel: `${result.captured} ${result.captured === 1 ? "bullet hole" : "bullet holes"}`
    });
  }

  function vaultLowestScoreWinsModel(pkg) {
    const result = verifiedResult(pkg);
    if (!result) return null;
    return Object.freeze({
      ariaLabel: "Saved IDPA lowest score wins analysis",
      metrics: Object.freeze([
        Object.freeze({ label: "Final Time", value: `${result.finalTime}s` }),
        Object.freeze({ label: "Raw Time", value: `${result.raw}s` }),
        Object.freeze({ label: "Points Down", value: `+${result.pointsDownTime}s` }),
        Object.freeze({ label: "Best Two", value: String(result.selected.length) })
      ])
    });
  }

  function vaultEvidenceModel(session, pkg) {
    const result = verifiedResult(pkg);
    const imageUrl = clean(session && session.targetEvidenceImage && session.targetEvidenceImage.dataUrl);
    if (!result || !imageUrl) return null;
    const markers = pkg.impacts.map((impact, index) => Object.freeze({ xPercent: impact.sourceEvidencePoint.xNorm * 100, yPercent: impact.sourceEvidencePoint.yNorm * 100, label: String(index + 1) }));
    return Object.freeze({ status: "complete", imageUrl, imageAlt: `Completed SL-ST2 target with ${markers.length} numbered bullet holes`, evidence: session.targetEvidenceImage, markers: Object.freeze(markers) });
  }

  global.SCZN3BakerSLST2IDPASEC = Object.freeze({ targetId: TARGET_ID, variantId: VARIANT_ID, missionFamily: MISSION_FAMILY, resultPackageType: RESULT_PACKAGE_TYPE, secAdapterId: SEC_ADAPTER_ID, matches, verifiedResult, secAdapterViewModel, vaultResultSummary, vaultLowestScoreWinsModel, vaultEvidenceModel, render });
})(window);
