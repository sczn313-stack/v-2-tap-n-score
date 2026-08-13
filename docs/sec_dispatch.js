(function (global) {
  "use strict";

  const ADAPTERS = Object.freeze({
    M4_ZEROING: "m4-zeroing",
    BAKER_100YD_ZEROING: "baker-100yd-zeroing",
    BAKER_SL_ST1: "baker-sl-st1",
    GSSF: "gssf",
    TRAINING: "marksmanship-training",
    UNIVERSAL_PRACTICE: "universal-practice",
    UNAVAILABLE: "unavailable"
  });

  const TARGET_ALIASES = Object.freeze({
    baker_st_100yd_smart: "baker_st_100yd_smart_zero",
    baker_sl_st1_practice: "baker_sl_st1",
    "baker-sl-st1": "baker_sl_st1"
  });

  const TRAINING_TARGETS = new Set([
    "dot_torture_ez2c_style_17",
    "dot_torture_lite_ez2c",
    "revolving_dot_torture_ez2c"
  ]);

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function normalizedTarget(value) {
    const normalized = text(value).toLowerCase();
    return TARGET_ALIASES[normalized] || normalized;
  }

  function normalizedMission(value) {
    return text(value).replace(/[^a-z0-9]/gi, "").toLowerCase();
  }

  function normalizedResultType(value) {
    return text(value).toLowerCase();
  }

  function canonicalPackage(session) {
    if (!session || typeof session !== "object") return null;
    return session.authorityPackage
      || session.backendAuthorityPackage
      || session.ugeoAuthorityPackage
      || session.m4AuthorityPackage
      || null;
  }

  function values(sources, keys, normalize) {
    const found = [];
    sources.forEach(source => {
      if (!source || typeof source !== "object") return;
      keys.forEach(key => {
        const value = normalize(source[key]);
        if (value && !found.includes(value)) found.push(value);
      });
    });
    return found;
  }

  function appendValue(found, value, normalize) {
    const normalized = normalize(value);
    if (normalized && !found.includes(normalized)) found.push(normalized);
  }

  function resolveIdentity(session) {
    const pkg = canonicalPackage(session);
    const backendSession = session && session.backendSessionAuthority || {};
    const backendTarget = backendSession.target || {};
    const backendMission = backendSession.missionIdentity || {};
    const targetAuthority = session && session.targetAuthority || {};
    const snapshot = session && session.matrixSnapshot || {};

    const missionSources = [pkg, pkg && pkg.target, backendMission, backendSession, targetAuthority, session, snapshot];
    const resultSources = [pkg, backendMission, backendSession, session, snapshot];
    const targetValues = [];
    [pkg, pkg && pkg.target, targetAuthority, session, snapshot].forEach(source => {
      if (!source || typeof source !== "object") return;
      appendValue(targetValues, source.target_profile_id || source.targetProfileId, normalizedTarget);
    });
    appendValue(targetValues, backendTarget.targetId || backendTarget.target_profile_id || backendTarget.targetProfileId, normalizedTarget);
    if (!targetValues.length) appendValue(targetValues, pkg && (pkg.targetId || pkg.target_id), normalizedTarget);
    const missionValues = values(missionSources, ["mission_family", "missionFamily", "missionFamilyId"], normalizedMission);
    const resultValues = values(resultSources, ["resultPackageType", "result_package_type"], normalizedResultType);

    return Object.freeze({
      targetProfileId: targetValues[0] || "",
      missionFamily: missionValues[0] || "",
      resultPackageType: resultValues[0] || "",
      conflicts: Object.freeze({
        targetProfileId: Object.freeze(targetValues.slice(1)),
        missionFamily: Object.freeze(missionValues.slice(1)),
        resultPackageType: Object.freeze(resultValues.slice(1))
      }),
      package: pkg
    });
  }

  function hasConflicts(identity) {
    return Object.values(identity.conflicts).some(entries => entries.length > 0);
  }

  function selectAdapter(identity) {
    if (!identity || hasConflicts(identity)) return ADAPTERS.UNAVAILABLE;
    const target = identity.targetProfileId;
    const mission = identity.missionFamily;
    const result = identity.resultPackageType;

    if (target === "m4_25m_zero" && mission === "zeroingcorrection" && result === "zerocorrectionresult") {
      return ADAPTERS.M4_ZEROING;
    }
    if (target === "baker_st_100yd_smart_zero" && mission === "zeroingcorrection" && result === "zerocorrectionresult") {
      return ADAPTERS.BAKER_100YD_ZEROING;
    }
    if (target === "baker_sl_st1" && mission === "smartevidencecapture" && result === "smartevidenceresult") {
      return ADAPTERS.BAKER_SL_ST1;
    }
    if (target === "gssf_ac_1" && mission === "gssf" && result === "gssfpaperpenaltyresult") {
      return ADAPTERS.GSSF;
    }
    if (TRAINING_TARGETS.has(target) && mission === "marksmanshiptraining" && result === "marksmanshiptrainingresult") {
      return ADAPTERS.TRAINING;
    }
    if (mission === "universalpractice" && result === "universalpracticeanalysisresult") {
      return ADAPTERS.UNIVERSAL_PRACTICE;
    }
    return ADAPTERS.UNAVAILABLE;
  }

  function resolve(session) {
    const identity = resolveIdentity(session);
    return Object.freeze({
      identity,
      adapter: selectAdapter(identity),
      valid: selectAdapter(identity) !== ADAPTERS.UNAVAILABLE,
      reason: hasConflicts(identity) ? "identity_conflict" : "identity_unregistered"
    });
  }

  function destinationFor(session, options = {}) {
    const dispatch = resolve(session);
    const sessionId = text(session && session.sessionId);
    if (dispatch.adapter === ADAPTERS.M4_ZEROING) {
      const params = new URLSearchParams({ sessionId, v: options.version || "sec-dispatch-v1" });
      if (options.thumbnail) params.set("vaultThumbnail", "1");
      return `sec.html?${params.toString()}`;
    }
    return `records.html?session=${encodeURIComponent(sessionId)}&view=sec`;
  }

  global.SCZN3SECDispatch = Object.freeze({
    ADAPTERS,
    canonicalPackage,
    resolveIdentity,
    selectAdapter,
    resolve,
    destinationFor
  });
})(window);
