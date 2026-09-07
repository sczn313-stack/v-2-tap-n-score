(function (global) {
  "use strict";

  const TARGET_ID = "GUNFUN_22740_VITAL_DUDE";
  const VARIANT_ID = "GUNFUN_22740_VITAL_DUDE_23X35";
  const PROFILE_ID = "gunfun_22740_vital_dude";
  const MISSION_ID = "GUNFUN_22740_EVIDENCE_CAPTURE_V1";
  const MISSION_FAMILY = "smartEvidenceCapture";
  const RESULT_PACKAGE_TYPE = "smartEvidenceResult";
  const SEC_ADAPTER_ID = "gunfun-vital-dude-evidence";
  const REQUIRED_STAGES = Object.freeze(["evidence", "validation", "preservation"]);

  const clean = value => typeof value === "string" && value.trim() ? value.trim() : "";
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  function authorityPackage(session) {
    return session && (session.authorityPackage || session.backendAuthorityPackage || session.ugeoAuthorityPackage || session.m4AuthorityPackage) || null;
  }

  function point(value) {
    const xNorm = Number(value && value.xNorm);
    const yNorm = Number(value && value.yNorm);
    return Number.isFinite(xNorm) && Number.isFinite(yNorm) && xNorm >= 0 && xNorm <= 1 && yNorm >= 0 && yNorm <= 1
      ? Object.freeze({ xNorm, yNorm })
      : null;
  }

  function impactCount(pkg) {
    const count = Number(pkg && pkg.supportedAnalysis && pkg.supportedAnalysis.impactCount);
    const impacts = Array.isArray(pkg && pkg.impacts) ? pkg.impacts : [];
    const reconciliation = pkg && pkg.reconciliation;
    if (!Number.isInteger(count) || count < 1 || count !== impacts.length || impacts.some(item => !point(item))) return null;
    if (!reconciliation || reconciliation.countsMatch !== true || reconciliation.capturedObservationCount !== count || reconciliation.acceptedObservationCount !== count) return null;
    return count;
  }

  function matches(pkg) {
    return !!(
      pkg && pkg.ok === true && pkg.status === "supported_analysis_ready"
      && pkg.authoritySource === "backend-authoritative"
      && pkg.missionFamily === MISSION_FAMILY && pkg.missionId === MISSION_ID
      && pkg.resultPackageType === RESULT_PACKAGE_TYPE
      && pkg.target && clean(pkg.target.smartTargetId).toUpperCase() === TARGET_ID
      && pkg.target.variantId === VARIANT_ID
      && pkg.target.targetProfileId === PROFILE_ID && String(pkg.target.targetProfileVersion) === "1"
      && pkg.target.sku === "22740"
      && pkg.scoring && pkg.scoring.status === "not_applicable"
      && pkg.ugo && pkg.ugo.status === "image_plane_evidence_only"
      && pkg.ugo.canonicalRegionMapping === "unavailable"
      && pkg.ugo.semanticClassification === "unavailable"
      && pkg.ugo.physicalMeasurement === "unavailable"
      && impactCount(pkg) !== null
    );
  }

  function aimPoint(pkg) {
    if (!pkg || pkg.shooterDeclaredAimPoint === null || pkg.shooterDeclaredAimPoint === undefined) return null;
    const candidate = point(pkg.shooterDeclaredAimPoint);
    return candidate
      && pkg.shooterDeclaredAimPoint.declaredBy === "shooter"
      && pkg.shooterDeclaredAimPoint.authorityScope === "session_evidence_only"
      ? candidate
      : false;
  }

  function secAdapterViewModel(session) {
    const registry = global.SCZN3TargetAdapters;
    if (!registry || !matches(authorityPackage(session))) return null;
    const mapped = registry.createViewModel(SEC_ADAPTER_ID, { session });
    if (!mapped || mapped.ok !== true || !mapped.value) return null;
    const stages = mapped.value.semanticComponents.map(component => component.stage);
    if (stages.length !== REQUIRED_STAGES.length || stages.some((stage, index) => stage !== REQUIRED_STAGES[index])) return null;
    if (mapped.value.scoringPresentationFamily !== registry.scoringPresentationFamilies.EVIDENCE_ONLY) return null;
    return mapped.value;
  }

  function evidenceHtml(session, pkg) {
    const evidence = session && session.targetEvidenceImage || {};
    const imageUrl = clean(evidence.dataUrl);
    if (!imageUrl) return '<div class="sec-comparison-pending">Target photograph unavailable</div>';
    const markers = pkg.impacts.map((impact, index) => {
      const p = point(impact);
      return `<span class="sec-target-impact-marker" style="left:${p.xNorm * 100}%;top:${p.yNorm * 100}%" aria-label="Shot observation ${index + 1}">${index + 1}</span>`;
    }).join("");
    const aim = aimPoint(pkg);
    const aimMarker = aim && aim !== false
      ? `<span class="vital-dude-aim-marker" style="left:${aim.xNorm * 100}%;top:${aim.yNorm * 100}%" aria-label="Shooter-declared aim point"><i></i></span>`
      : "";
    return `<div class="sec-target-evidence-viewport"><div class="sec-target-evidence-frame"><img src="${escapeHtml(imageUrl)}" alt="GunFun Vital Dude target with shooter-recorded evidence" /><div class="sec-target-impact-layer">${markers}${aimMarker}</div></div></div>`;
  }

  function vaultEvidenceModel(session, pkg) {
    if (!matches(pkg)) return null;
    const imageUrl = clean(session && session.targetEvidenceImage && session.targetEvidenceImage.dataUrl);
    if (!imageUrl) return null;
    const markers = pkg.impacts.map((impact, index) => {
      const p = point(impact);
      return Object.freeze({ xPercent: p.xNorm * 100, yPercent: p.yNorm * 100, label: String(index + 1) });
    });
    const aim = aimPoint(pkg);
    return Object.freeze({
      status: "complete",
      imageUrl,
      imageAlt: "Saved GunFun Vital Dude target with shooter-recorded observations",
      evidence: session.targetEvidenceImage,
      markers: Object.freeze(markers),
      aimPoint: aim && aim !== false ? Object.freeze({ xPercent: aim.xNorm * 100, yPercent: aim.yNorm * 100, label: "Aim" }) : null
    });
  }

  function vaultResultSummary(pkg) {
    if (!matches(pkg)) return null;
    const count = impactCount(pkg);
    return Object.freeze({
      status: "unavailable",
      primaryLabel: "EVIDENCE RECORDED",
      objectiveLabel: "No score applies",
      evidenceLabel: `${count} shot ${count === 1 ? "observation" : "observations"}`
    });
  }

  function actionBarHtml(mode, preserved) {
    if (mode === "historical") return global.SCZN3SECComponents.ActionBar({ actions: [
      { label: "Export SEC", action: "export", attributes: { "data-sec-export": true } },
      { label: "Share SEC", action: "share", attributes: { "data-sec-share": true } },
      { label: "Ballistic Vault", action: "history", href: "records.html", primary: true }
    ] });
    return global.SCZN3SECComponents.ActionBar({
      actions: [
        { label: preserved ? "SEC Preserved" : "Save SEC", action: "save", primary: !preserved, disabled: preserved, className: preserved ? "is-preserved" : "" },
        { label: "Share", action: "share", attributes: { "data-sec-share": true } },
        { label: "Export / Print PDF", action: "export", attributes: { "data-sec-export": true } },
        { label: "Ballistic Vault", action: "history", href: "../../../records.html" }
      ],
      afterHtml: '<span class="sec-action-status" data-vital-dude-sec-status role="status" aria-live="polite"></span>'
    });
  }

  function render({ session = {}, package: pkg = null, mode = "live", preserved = session.savedToSEC === true } = {}) {
    pkg = pkg || authorityPackage(session);
    const view = secAdapterViewModel({ ...session, authorityPackage: pkg });
    const aim = aimPoint(pkg);
    if (!global.SCZN3SEC || !view || !matches(pkg) || aim === false) return global.SCZN3SEC ? global.SCZN3SEC.renderUnavailable("Results unavailable") : "";
    const count = impactCount(pkg);
    const result = `<section class="vital-dude-evidence-result"><span>Evidence Recorded</span><strong>${count}</strong><small>shot ${count === 1 ? "observation" : "observations"}</small>${aim ? '<p>Shooter-declared aim point preserved</p>' : '<p>No aim point declared</p>'}</section>`;
    const capabilityStates = `<dl class="vital-dude-capability-states"><div><dt>Scoring</dt><dd>Not applicable</dd></div><div><dt>Canonical regions</dt><dd>Unavailable</dd></div><div><dt>Anatomical, medical, or tactical meaning</dt><dd>Unavailable</dd></div><div><dt>Physical measurement or correction</dt><dd>Unavailable</dd></div></dl>`;
    const validation = global.SCZN3SECComponents.Validation({ contentHtml: `<section class="vital-dude-validation"><strong>${count} of ${count} observations reconciled</strong><span>Image hash backend verified · image-plane evidence only</span>${capabilityStates}</section>` });
    return global.SCZN3SEC.render({
      schemaVersion: "1.2",
      recordId: clean(session.sessionId) || "vital-dude-sec",
      missionFamily: MISSION_FAMILY,
      sessionLabel: clean(session.sessionLabel) || "Session",
      scoreDisplay: `${count} Observations`,
      articleClassName: "history-card vital-dude-sec-card",
      articleAttributes: {
        "data-target-id": TARGET_ID,
        "data-sec-mode": mode,
        "data-sec-adapter-id": SEC_ADAPTER_ID,
        "data-scoring-presentation-family": view.scoringPresentationFamily,
        "data-target-profile-id": PROFILE_ID,
        "data-target-profile-version": "1",
        "data-publisher-id": "gunfun",
        "data-product-id": TARGET_ID
      },
      regions: [
        { key: "target", className: "sec-v1-evidence-content", ariaLabel: "Target", contentHtml: `<section class="sec-evidence-result-layout">${global.SCZN3SECComponents.Evidence({ contentHtml: `<section class="sec-target-evidence"><header><span>Target Evidence</span><strong>GunFun Vital Dude · SKU 22740</strong></header><figure>${evidenceHtml(session, pkg)}</figure></section>` })}<div class="sec-component sec-component-result" data-sec-component="result" data-result-family="evidence-only">${result}${validation}</div></section>` },
        { key: "session", className: "sec-v1-measurement-content", ariaLabel: "Authority", contentHtml: global.SCZN3SECComponents.Measurement({ contentHtml: `<section class="vital-dude-authority"><strong>Publisher product → shooter evidence → backend-governed result</strong><span>${escapeHtml(pkg.evidenceIdentity)}</span><small>Aim and shot markers are shooter declarations. SCZN3 assigns no printed-feature meaning.</small></section>` }) },
        { key: "actions", className: "sec-v1-preservation-content", ariaLabel: "Shooter Action Bar", contentHtml: global.SCZN3SECComponents.Preservation({ contentHtml: actionBarHtml(mode, preserved) }) }
      ]
    });
  }

  global.SCZN3GunFunVitalDudeSEC = Object.freeze({
    targetId: TARGET_ID, variantId: VARIANT_ID, missionId: MISSION_ID,
    missionFamily: MISSION_FAMILY, resultPackageType: RESULT_PACKAGE_TYPE,
    secAdapterId: SEC_ADAPTER_ID, matches, impactCount, aimPoint,
    secAdapterViewModel, vaultEvidenceModel, vaultResultSummary, render
  });
})(window);
