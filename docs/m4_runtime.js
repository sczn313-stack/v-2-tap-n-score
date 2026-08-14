(function () {
  "use strict";

  const state = window.SCZN3M4;
  const config = window.SCZN3_M4_CONFIG || {};
  if (!state) throw new Error("Tap-n-Score state must load before the M4 runtime.");

  const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
  const AUTHORITY_ENDPOINT = LOCAL_HOSTS.has(window.location.hostname)
    ? "http://127.0.0.1:8098/api/authority/m4"
    : "/api/authority/m4";

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
    const source = session && session.matrixSnapshot
      ? session.matrixSnapshot
      : state.getActiveMatrix() || {};
    const target = config.target || {};
    const mission = config.zeroingMission || {};
    const isIron = String(source.opticType || source.opticModel || "")
      .toLowerCase()
      .includes("iron");
    const configuredSight = config.sightingSystems && config.sightingSystems.M4_IRON_DCH_FSP || {};
    const sightAuthorityId = String(
      source.equipmentAuthorityRecordId
      || source.mechanicalSightAuthorityId
      || source.sightAuthorityId
      || ""
    );
    const usesRegisteredM4IronSight = isIron
      && sightAuthorityId === configuredSight.equipmentAuthorityRecordId;
    const adjustmentSystem = usesRegisteredM4IronSight
      ? "M4_IRON_DCH_FSP"
      : isIron
        ? "M4_IRON"
        : "OPTIC";
    const distanceValue = Number(
      source.targetDistanceValue
      || source.targetDistance
      || source.distance
      || mission.defaultDistance && mission.defaultDistance.value
      || 25
    );
    const distanceUnitSource = String(
      source.targetDistanceUnit
      || mission.defaultDistance && mission.defaultDistance.unit
      || "m"
    ).toUpperCase();

    return {
      vendor: "Baker",
      sku: "ST-M16A2/M4",
      product: "M4 Carbine • 25 Meter Zeroing Target",
      authority: "M4 Zeroing",
      targetId: target.targetId || "M4_TARGET_AUTHORITY_v1_ORIGINAL",
      targetName: target.targetName || "M4 Carbine • 25 Meter Zeroing Target",
      targetAuthorityGeometry: target.geometry,
      aimCoordinate: aimPoint,
      impactCoordinates: (impactPoints || []).map((point, index) => ({
        ...point,
        shotId: point.shotId || `${phase}-shot-${index + 1}`
      })),
      distance: {
        value: Number.isFinite(distanceValue) && distanceValue > 0 ? distanceValue : 25,
        unit: distanceUnitSource === "YDS" || distanceUnitSource === "YD" ? "yds" : "m"
      },
      phase,
      zeroingMission: mission,
      equipmentAuthorityRecordId: usesRegisteredM4IronSight
        ? configuredSight.equipmentAuthorityRecordId
        : null,
      shooterSetup: {
        ...source,
        adjustmentSystem,
        equipmentAuthorityRecordId: usesRegisteredM4IronSight
          ? configuredSight.equipmentAuthorityRecordId
          : null,
        opticAdjustmentUnit: source.opticAdjustmentUnit || "MOA",
        opticClickValue: Number(source.opticClickValue) || null,
        optic: {
          type: source.opticType,
          manufacturer: source.opticBrand,
          model: source.opticModel,
          adjustmentSystem,
          adjustmentUnit: source.opticAdjustmentUnit || "MOA",
          clickValue: Number(source.opticClickValue) || null
        }
      }
    };
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
    if (!session || (!supportedConfirmationResult && !supportedEvidenceResult)) return null;
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
