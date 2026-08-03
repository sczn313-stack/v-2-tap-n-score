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
    "select-target",
    "stay-on-screen",
    "tap-aim-point",
    "tap-initial-group",
    "confirm-session-setup",
    "calculate-authoritative-correction",
    "apply-correction",
    "fire-confirmation-group",
    "tap-confirmation-group",
    "generate-zeroing-sec",
    "preserve-sec",
    "add-to-ballistic-vault"
  ]);

  const missions = new Map();

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
    SOP,
    WORKSPACE_STATES,
    registerMission,
    resolveMission,
    contextFingerprint,
    isCompletedSession
  });
})();
