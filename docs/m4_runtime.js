(function () {
  "use strict";

  const state = window.SCZN3M4;
  const config = window.SCZN3_M4_CONFIG || {};
  if (!state) throw new Error("Tap-n-Score state must load before the M4 runtime.");

  const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
  const FOUNDER_REVIEW = new URLSearchParams(window.location.search).get("founder_review") === "1";
  const AUTHORITY_ENDPOINT = window.SCZN3_M4_AUTHORITY_ENDPOINT || (LOCAL_HOSTS.has(window.location.hostname)
    ? FOUNDER_REVIEW ? `${window.location.origin}/api/authority/m4` : "http://127.0.0.1:8098/api/authority/m4"
    : FOUNDER_REVIEW
      ? `${window.location.origin}/api/authority/m4`
      : "/api/authority/m4");

  function nowStamp() {
    return new Date().toISOString();
  }

  function isM4Session(session) {
    const source = session && session.matrixSnapshot ? session.matrixSnapshot : session || {};
    const profile = String(
      source.target_profile_id
      || source.targetProfileId
      || source.targetId
      || source.targetVersion
      || ""
    ).toLowerCase();
    const name = String(source.targetName || source.targetFamily || "").toLowerCase();
    const sku = String(source.sku || session && session.sku || "").trim();
    if (profile) return profile === "m4_25m_zero" || (profile.includes("m4") && profile.includes("25"));
    return sku === "ST-M16A2/M4"
      || (profile.includes("m4") && (profile.includes("25") || profile.includes("authority")))
      || (name.includes("m4") && name.includes("25"));
  }

  async function requestAuthority(payload) {
    const operationId = window.SCZN3Processing?.begin({ id: "m4-correction", message: "Calculating your correction…" }) || "";
    try {
      const response = await fetch(AUTHORITY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`M4 authority failed: ${response.status}`);
      const result = await response.json();
      if (operationId) SCZN3Processing.succeed(operationId);
      return result;
    } catch (error) {
      if (operationId) SCZN3Processing.fail(operationId);
      throw error;
    }
  }

  function authorityRequest(session, aimPoint, impactPoints, phase = "initial") {
    if (!window.SCZN3ZeroingPlatform) throw new Error("The shared zeroing capability is unavailable.");
    return window.SCZN3ZeroingPlatform.authorityRequest({
      session,
      aimPoint,
      impactPoints,
      phase,
      fallbackConfig: config
    });
  }

  function saveInitialAuthority(authorityPackage, evidence, aimPoint, impactPoints) {
    const active = state.read(state.KEYS.activeSession, null);
    if (!active || !authorityPackage || !authorityPackage.status) return null;
    const timestamp = nowStamp();
    return state.replaceSession({
      ...active,
      targetEvidenceImage: evidence ? {
        ...evidence,
        savedAt: timestamp,
        evidenceType: "uploaded-target-image"
      } : active.targetEvidenceImage,
      aimPoint,
      confirmedAimPoint: authorityPackage.inputs && authorityPackage.inputs.confirmedAimPoint || aimPoint,
      confirmedAimPointAuthority: authorityPackage.confirmedAimPointAuthority,
      impactPoints,
      backendAuthorityPackage: authorityPackage,
      m4AuthorityPackage: authorityPackage,
      poib: authorityPackage.poib,
      registeredBull: authorityPackage.inputs && authorityPackage.inputs.registeredBullCoordinate,
      aimPointDiscrepancy: authorityPackage.aimPointDiscrepancy,
      geometryValidation: authorityPackage.geometryValidation,
      mechanicalValidation: authorityPackage.mechanicalValidation,
      clicks: authorityPackage.clicks,
      score: authorityPackage.score,
      correctionData: {
        status: "backend-authority-calculated",
        correction: authorityPackage.correction,
        clicks: authorityPackage.clicks,
        angular: authorityPackage.angular,
        evidenceHash: authorityPackage.evidenceHash
      },
      savedToSEC: false,
      workflowStage: "execution",
      updatedAt: timestamp
    });
  }

  function saveConfirmationAuthority(authorityPackage, evidence, impactPoints) {
    const active = state.read(state.KEYS.activeSession, null);
    if (!active || !authorityPackage || !authorityPackage.validation) return null;
    const timestamp = nowStamp();
    return state.replaceSession({
      ...active,
      confirmationEvidenceImage: evidence ? {
        ...evidence,
        savedAt: timestamp,
        evidenceType: "confirmation-target-image"
      } : active.confirmationEvidenceImage,
      confirmationImpactPoints: impactPoints,
      confirmationAuthorityPackage: authorityPackage,
      confirmedAimPoint: authorityPackage.inputs && authorityPackage.inputs.confirmedAimPoint || active.confirmedAimPoint || active.aimPoint,
      confirmedAimPointAuthority: authorityPackage.confirmedAimPointAuthority || active.confirmedAimPointAuthority,
      confirmationStatus: authorityPackage.validation.confirmed
        ? "Confirmed"
        : "Correction Required",
      confirmedAt: authorityPackage.validation.confirmed ? timestamp : null,
      workflowStage: "validation",
      updatedAt: timestamp
    });
  }

  function preserveActiveSEC(note = "", sourceSession = null) {
    const active = state.read(state.KEYS.activeSession, null);
    const session = sourceSession && (!active || active.sessionId !== sourceSession.sessionId)
      ? sourceSession
      : active;
    const evidencePackage = session && (session.authorityPackage || session.backendAuthorityPackage);
    const dispatch = session && window.SCZN3SECDispatch
      ? window.SCZN3SECDispatch.resolve(session)
      : null;
    const impacts = Array.isArray(evidencePackage && evidencePackage.impacts) ? evidencePackage.impacts : [];
    const impactCount = Number(evidencePackage && evidencePackage.supportedAnalysis && evidencePackage.supportedAnalysis.impactCount);
    const evidence = session && session.targetEvidenceImage;
    const supportedConfirmationResult = dispatch && (
      dispatch.adapter === window.SCZN3SECDispatch.ADAPTERS.M4_ZEROING
      || dispatch.adapter === window.SCZN3SECDispatch.ADAPTERS.M16A2_ZEROING
      || dispatch.adapter === window.SCZN3SECDispatch.ADAPTERS.BAKER_100YD_ZEROING
    ) && session.confirmationAuthorityPackage;
    const supportedEvidenceResult = dispatch
      && dispatch.adapter === window.SCZN3SECDispatch.ADAPTERS.BAKER_SL_ST1
      && evidencePackage
      && evidencePackage.ok === true
      && evidencePackage.status === "supported_analysis_ready"
      && Number.isInteger(impactCount)
      && impactCount >= 0
      && impactCount === impacts.length
      && evidence
      && (evidence.dataUrl || evidence.mediaId);
    const vitalDudeTarget = evidencePackage && evidencePackage.target;
    const vitalDudeReconciliation = evidencePackage && evidencePackage.reconciliation;
    const vitalDudeAim = evidencePackage && evidencePackage.shooterDeclaredAimPoint;
    const vitalDudePointIsValid = point => {
      const xNorm = Number(point && point.xNorm);
      const yNorm = Number(point && point.yNorm);
      return Number.isFinite(xNorm) && xNorm >= 0 && xNorm <= 1
        && Number.isFinite(yNorm) && yNorm >= 0 && yNorm <= 1;
    };
    const vitalDudeAimIsValid = vitalDudeAim === null || vitalDudeAim === undefined || (
      vitalDudePointIsValid(vitalDudeAim)
      && vitalDudeAim.declaredBy === "shooter"
      && vitalDudeAim.evidenceMeaning === "shooter_declared_aim_point"
      && vitalDudeAim.authorityScope === "session_evidence_only"
    );
    const supportedVitalDudeResult = dispatch
      && dispatch.adapter === window.SCZN3SECDispatch.ADAPTERS.GUNFUN_VITAL_DUDE
      && evidencePackage
      && evidencePackage.ok === true
      && evidencePackage.status === "supported_analysis_ready"
      && evidencePackage.authoritySource === "backend-authoritative"
      && evidencePackage.missionFamily === "smartEvidenceCapture"
      && evidencePackage.missionId === "GUNFUN_22740_EVIDENCE_CAPTURE_V1"
      && evidencePackage.resultPackageType === "smartEvidenceResult"
      && vitalDudeTarget
      && vitalDudeTarget.smartTargetId === "GUNFUN_22740_VITAL_DUDE"
      && vitalDudeTarget.variantId === "GUNFUN_22740_VITAL_DUDE_23X35"
      && vitalDudeTarget.targetProfileId === "gunfun_22740_vital_dude"
      && String(vitalDudeTarget.targetProfileVersion) === "1"
      && vitalDudeTarget.sku === "22740"
      && evidencePackage.authorityTrace
      && evidencePackage.authorityTrace.resultAuthority === "backend"
      && evidencePackage.imageEvidence
      && evidencePackage.imageEvidence.backendHashVerified === true
      && evidencePackage.imageEvidence.acceptanceScope === "shooter_declared_registered_photo_evidence"
      && evidencePackage.scoring
      && evidencePackage.scoring.status === "not_applicable"
      && evidencePackage.ugo
      && evidencePackage.ugo.status === "image_plane_evidence_only"
      && evidencePackage.ugo.canonicalRegionMapping === "unavailable"
      && evidencePackage.ugo.semanticClassification === "unavailable"
      && evidencePackage.ugo.physicalMeasurement === "unavailable"
      && Number.isInteger(impactCount)
      && impactCount >= 1
      && impactCount === impacts.length
      && impacts.every(impact => vitalDudePointIsValid(impact)
        && impact.evidenceMeaning === "shooter_recorded_visible_shot_observation")
      && vitalDudeReconciliation
      && vitalDudeReconciliation.countsMatch === true
      && Number.isInteger(vitalDudeReconciliation.capturedObservationCount)
      && Number.isInteger(vitalDudeReconciliation.acceptedObservationCount)
      && vitalDudeReconciliation.capturedObservationCount === impactCount
      && vitalDudeReconciliation.acceptedObservationCount === impactCount
      && vitalDudeAimIsValid
      && evidence
      && (evidence.dataUrl || evidence.mediaId);
    const idpaReconciliation = evidencePackage && evidencePackage.reconciliation;
    const supportedIdpaResult = dispatch
      && dispatch.adapter === window.SCZN3SECDispatch.ADAPTERS.BAKER_SL_ST2_IDPA
      && evidencePackage
      && evidencePackage.ok === true
      && evidencePackage.status === "supported_analysis_ready"
      && evidencePackage.authoritySource === "backend-authoritative"
      && evidencePackage.resultPackageType === "idpaTimeScoreResult"
      && evidencePackage.scoring
      && evidencePackage.scoring.status === "complete"
      && idpaReconciliation
      && idpaReconciliation.selectionReconciles === true
      && idpaReconciliation.timeReconciles === true
      && Number.isInteger(idpaReconciliation.capturedImpactCount)
      && idpaReconciliation.capturedImpactCount === impacts.length
      && evidence
      && (evidence.dataUrl || evidence.mediaId);
    const bakerFunAdapters = window.SCZN3SECDispatch ? [
      window.SCZN3SECDispatch.ADAPTERS.BAKER_GF_DB_POINTS,
      window.SCZN3SECDispatch.ADAPTERS.BAKER_GF_DB_NUMBERS,
      window.SCZN3SECDispatch.ADAPTERS.BAKER_GF_BP,
      window.SCZN3SECDispatch.ADAPTERS.EZ2C_DOT_TORTURE,
      window.SCZN3SECDispatch.ADAPTERS.BAKER_GF_BB_C
    ] : [];
    const supportedBakerFunResult = dispatch
      && bakerFunAdapters.includes(dispatch.adapter)
      && evidencePackage
      && evidencePackage.ok === true
      && evidencePackage.status === "complete"
      && ["bakerFunGame", "catalogFunGame"].includes(evidencePackage.missionFamily)
      && ["bakerDartboardGameResult", "bakerBowlingPinsResult", "dotTortureCourseResult", "bakerBilliardSequenceResult", "bakerBattleshipGameResult"].includes(evidencePackage.resultPackageType)
      && evidencePackage.authorityTrace
      && evidencePackage.authorityTrace.classificationAuthority === "backend"
      && evidencePackage.authorityTrace.scoringAuthority === "backend"
      && evidencePackage.reconciliation
      && evidencePackage.reconciliation.status === "reconciled"
      && evidencePackage.reconciliation.recordedEventCount === evidencePackage.reconciliation.evidenceObservationCount
      && evidence
      && (evidence.dataUrl || evidence.mediaId);
    const supportedContractResult = window.SCZN3TargetExecutionRuntime
      && window.SCZN3TargetExecutionRuntime.canPreserve(session) === true;
    if (!session || (!supportedConfirmationResult && !supportedEvidenceResult && !supportedVitalDudeResult && !supportedIdpaResult && !supportedBakerFunResult && !supportedContractResult)) return null;
    const timestamp = nowStamp();
    return state.replaceSession({
      ...session,
      savedToSEC: true,
      secNote: note || session.secNote || "",
      preservedAt: timestamp,
      savedAt: timestamp,
      timestamp,
      workflowStage: "preservation",
      updatedAt: timestamp
    });
  }

  Object.assign(state, {
    M4_AUTHORITY_ENDPOINT: AUTHORITY_ENDPOINT,
    isM4Session,
    requestAuthority,
    authorityRequest,
    saveInitialAuthority,
    saveConfirmationAuthority,
    preserveActiveSEC
  });
})();
