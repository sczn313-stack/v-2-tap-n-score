(function () {
  "use strict";

  const WORKSPACE_STATES = Object.freeze([
    "ready",
    "aim-confirmed",
    "initial-group",
    "setup-review",
    "correction-ready",
    "confirmation-group",
    "validation",
    "mission-complete"
  ]);

  const SOP = Object.freeze([
    "photo-entry",
    "precision-tap",
    "tap-aim-point",
    "tap-initial-group",
    "undo-clear",
    "show-results",
    "present-authoritative-correction",
    "apply-correction",
    "fire-confirmation-group",
    "confirmation-photo-entry",
    "tap-confirmation-group",
    "show-confirmation-results",
    "generate-zeroing-sec",
    "preserve-sec",
    "add-to-ballistic-vault",
    "failure-recovery"
  ]);

  const CAPABILITY_ID = "sczn3-governed-zeroing-road-v1";
  const EXPERIENCE_SCHEMA_VERSION = "sczn3-zeroing-experience-profile-v1";
  const AUTHORITY_FAMILIES = new Set(["mfam", "universal"]);
  const ENTRY_MODES = new Set(["photo", "registered-reference"]);
  const CONFIRMATION_MODES = new Set(["governed", "evidence"]);

  const missions = new Map();
  const targetProfiles = new Map();

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function sourceRecords(source = {}) {
    const backend = source.backendSessionAuthority || {};
    return [source, backend, source.matrixSnapshot || {}, source.targetAuthority || {}, backend.target || {}];
  }

  function targetProfileId(source = {}) {
    for (const record of sourceRecords(source)) {
      const value = clean(record.target_profile_id || record.targetProfileId || record.targetId);
      if (value) return value.toLowerCase();
    }
    return "";
  }

  function validateProfile(definition) {
    const errors = [];
    if (!definition || typeof definition !== "object") return ["profile_required"];
    if (!clean(definition.targetProfileId)) errors.push("target_profile_id_required");
    if (clean(definition.capabilityId) !== CAPABILITY_ID) errors.push("shared_zeroing_capability_required");
    if (!AUTHORITY_FAMILIES.has(clean(definition.authorityFamily))) errors.push("authority_family_invalid");
    if (!ENTRY_MODES.has(clean(definition.entryMode))) errors.push("entry_mode_invalid");
    if (!CONFIRMATION_MODES.has(clean(definition.confirmationMode))) errors.push("confirmation_mode_invalid");
    ["workflow", "controls", "navigation", "scoring", "correctionMath", "confirmationWorkflow", "secWorkflow", "vaultWorkflow"].forEach(key => {
      if (Object.prototype.hasOwnProperty.call(definition, key)) errors.push(`platform_owned_${key}`);
    });
    return errors;
  }

  function freezeProfile(definition) {
    const errors = validateProfile(definition);
    if (errors.length) throw new Error(`Invalid zeroing Target Profile: ${errors.join(", ")}`);
    return Object.freeze({
      schemaVersion: EXPERIENCE_SCHEMA_VERSION,
      ...definition,
      targetProfileId: clean(definition.targetProfileId).toLowerCase(),
      targetProfileVersion: clean(definition.targetProfileVersion),
      presentation: Object.freeze({ ...(definition.presentation || {}) }),
      entryEvidence: definition.entryEvidence ? Object.freeze({ ...definition.entryEvidence }) : null,
      exactAsset: definition.exactAsset ? Object.freeze({ ...definition.exactAsset }) : null
    });
  }

  function registerTargetProfile(definition) {
    const profile = freezeProfile(definition);
    targetProfiles.set(profile.targetProfileId, profile);
    return profile;
  }

  function authoritativeExperience(source = {}) {
    const backend = source.backendSessionAuthority || {};
    const candidate = source.zeroingExperience || backend.zeroingExperience;
    if (!candidate || typeof candidate !== "object") return null;
    const profileId = targetProfileId(source);
    const definition = {
      ...candidate,
      targetProfileId: candidate.targetProfileId || profileId
    };
    if (validateProfile(definition).length) return null;
    if (profileId && clean(definition.targetProfileId).toLowerCase() !== profileId) return null;
    return freezeProfile(definition);
  }

  function resolveTargetProfile(source = {}) {
    const authoritative = authoritativeExperience(source);
    const profileId = targetProfileId(source);
    const registered = targetProfiles.get(profileId) || null;
    if (!authoritative) return registered;
    if (!registered) return authoritative;
    if (
      authoritative.targetProfileVersion
      && registered.targetProfileVersion
      && authoritative.targetProfileVersion !== registered.targetProfileVersion
    ) return null;
    return freezeProfile({
      ...registered,
      ...authoritative,
      presentation: { ...registered.presentation, ...authoritative.presentation },
      entryEvidence: authoritative.entryEvidence || registered.entryEvidence,
      exactAsset: authoritative.exactAsset || registered.exactAsset
    });
  }

  function isZeroingSession(source = {}) {
    return !!resolveTargetProfile(source);
  }

  function usesAuthorityFamily(source, family) {
    const profile = resolveTargetProfile(source);
    return !!profile && profile.authorityFamily === family;
  }

  function usesGovernedConfirmation(source) {
    const profile = resolveTargetProfile(source);
    return !!profile && profile.confirmationMode === "governed";
  }

  function authorityRequest({ session, aimPoint, impactPoints, phase = "initial", fallbackConfig = {} } = {}) {
    const profile = resolveTargetProfile(session || {});
    if (!profile) throw new Error("A governed zeroing Target Profile is required.");
    const backend = session && session.backendSessionAuthority || {};
    const backendTarget = backend.target || {};
    const source = session && session.matrixSnapshot || {};
    const fallbackTarget = fallbackConfig.target || {};
    const fallbackMission = fallbackConfig.zeroingMission || {};
    const governedDistance = backend.governedDistance || session && session.sessionDistance || {};
    const missionIdentity = backend.missionIdentity || {};
    const adjustmentSystem = clean(source.adjustmentSystem) || (clean(source.opticType || source.opticModel).toLowerCase().includes("iron") ? "M4_IRON" : "OPTIC");
    const fallbackDistance = fallbackMission.defaultDistance || {};
    const distanceValue = Number(governedDistance.value ?? source.targetDistanceValue ?? source.targetDistance ?? fallbackDistance.value ?? 25);
    const distanceUnit = clean(governedDistance.unit || source.targetDistanceUnit || fallbackDistance.unit || "m").toUpperCase();
    const targetId = clean(backendTarget.targetAuthorityId || source.targetId || fallbackTarget.targetId || profile.targetProfileId);

    return {
      vendor: clean(source.vendor || fallbackTarget.vendor),
      sku: clean(source.sku || fallbackTarget.sku),
      product: clean(source.product || backendTarget.targetName || fallbackTarget.product),
      authority: clean(source.authority || fallbackTarget.authority),
      target_profile_id: profile.targetProfileId,
      targetProfileId: profile.targetProfileId,
      targetId,
      targetName: clean(backendTarget.targetName || source.targetName || fallbackTarget.targetName),
      aimCoordinate: aimPoint || null,
      impactCoordinates: (impactPoints || []).map((point, index) => ({
        ...point,
        shotId: point.shotId || `${phase}-shot-${index + 1}`
      })),
      distance: {
        value: Number.isFinite(distanceValue) && distanceValue > 0 ? distanceValue : 25,
        unit: ["YDS", "YD"].includes(distanceUnit) ? "yds" : "m"
      },
      phase,
      zeroingMission: {
        ...fallbackMission,
        ...(profile.confirmationRules || {}),
        id: clean(missionIdentity.missionId || fallbackMission.id)
      },
      equipmentAuthorityRecordId: clean(source.equipmentAuthorityRecordId) || null,
      adjustmentProfileId: clean(source.adjustmentProfileId) || null,
      shooterSetup: {
        ...source,
        adjustmentSystem,
        equipmentConfigurationId: clean(source.equipmentConfigurationId),
        adjustmentProfileId: clean(source.adjustmentProfileId) || null,
        equipmentAuthorityRecordId: clean(source.equipmentAuthorityRecordId) || null,
        opticAdjustmentUnit: clean(source.opticAdjustmentUnit || source.adjustmentUnit || "MOA"),
        opticClickValue: Number(source.opticClickValue) || null,
        optic: {
          type: source.opticType,
          manufacturer: source.opticBrand,
          model: source.opticModel,
          adjustmentSystem,
          adjustmentUnit: clean(source.opticAdjustmentUnit || source.adjustmentUnit || "MOA"),
          clickValue: Number(source.opticClickValue) || null
        }
      }
    };
  }

  function freezeMission(definition) {
    const required = ["id", "targetAuthority", "correctionAuthority", "sessionContext", "confirmationRules", "artwork"];
    required.forEach(key => {
      if (!definition || !definition[key]) throw new Error(`Zeroing mission requires ${key}.`);
    });
    return Object.freeze({
      ...definition,
      workflow: WORKSPACE_STATES,
      sop: SOP
    });
  }

  function registerMission(definition) {
    const mission = freezeMission(definition);
    missions.set(String(mission.id), mission);
    return mission;
  }

  function resolveMission(source = {}) {
    const ids = [
      source.zeroingMissionId,
      source.target_profile_id,
      source.targetProfileId,
      source.targetId
    ].filter(Boolean).map(String);
    for (const id of ids) {
      if (missions.has(id)) return missions.get(id);
      for (const mission of missions.values()) {
        if ((mission.aliases || []).includes(id)) return mission;
      }
    }
    return null;
  }

  function contextFingerprint(context = {}) {
    return JSON.stringify({
      sightSystem: context.sightSystem || "",
      sightAuthorityId: context.sightAuthorityId || context.equipmentAuthorityRecordId || "",
      distance: Number(context.distance || context.value || 0),
      distanceUnit: String(context.distanceUnit || context.unit || "").toUpperCase(),
      adjustmentUnit: String(context.adjustmentUnit || "").toUpperCase(),
      opticIdentity: context.opticIdentity || "",
      opticClickValue: Number(context.opticClickValue || 0)
    });
  }

  function isCompletedSession(session) {
    return Boolean(
      session &&
      session.savedToSEC === true &&
      session.workflowStage === "preservation" &&
      session.confirmationAuthorityPackage &&
      Array.isArray(session.confirmationImpactPoints) &&
      session.confirmationImpactPoints.length > 0
    );
  }

  window.SCZN3ZeroingPlatform = Object.freeze({
    CAPABILITY_ID,
    EXPERIENCE_SCHEMA_VERSION,
    SOP,
    WORKSPACE_STATES,
    registerMission,
    resolveMission,
    registerTargetProfile,
    resolveTargetProfile,
    validateTargetProfile: definition => Object.freeze({ ok: validateProfile(definition).length === 0, errors: Object.freeze(validateProfile(definition)) }),
    targetProfileId,
    isZeroingSession,
    usesAuthorityFamily,
    usesGovernedConfirmation,
    authorityRequest,
    contextFingerprint,
    isCompletedSession
  });
})();
