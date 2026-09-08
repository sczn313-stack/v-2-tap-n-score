(function (global) {
  "use strict";

  const ADAPTERS = Object.freeze({
    M4_ZEROING: "m4-zeroing",
    M16A2_ZEROING: "m16a2-zeroing",
    SPEEDWELL_M16A2_ZEROING: "speedwell-m16a2-zeroing",
    ARMY_M16A2_ZEROING: "army-m16a2-zeroing",
    BAKER_100YD_ZEROING: "baker-100yd-zeroing",
    BAKER_SL_ST1: "baker-sl-st1",
    GUNFUN_VITAL_DUDE: "gunfun-vital-dude-evidence",
    BAKER_SL_ST2_IDPA: "baker-sl-st2-idpa",
    BAKER_GF_DB_POINTS: "baker-gf-db-points",
    BAKER_GF_DB_NUMBERS: "baker-gf-db-numbers",
    BAKER_GF_BP: "baker-gf-bp",
    EZ2C_DOT_TORTURE: "ez2c-dot-torture",
    BAKER_GF_BB_C: "baker-gf-bb-c",
    BAKER_GF_BATTLESHIP: "baker-gf-battleship",
    GSSF: "gssf",
    TRAINING: "marksmanship-training",
    UNIVERSAL_PRACTICE: "universal-practice",
    CONTRACT_SMART_EVIDENCE: "smart-evidence-family",
    CONTRACT_PRECISION_OPEN_SCORE: "precision-open-score-family",
    CONTRACT_RECREATIONAL_CHALLENGE: "recreational-challenge-family",
    CONTRACT_COLLECTION_HAND: "collection-hand-family",
    CONTRACT_CUE_DRILL: "cue-drill-family",
    CONTRACT_DECISION_SCENARIO: "decision-scenario-family",
    CONTRACT_SEC_PROGRESSION: "sec-progression-family",
    CONTRACT_QUALIFICATION: "qualification-family",
    CONTRACT_DIAGNOSTIC_FEEDBACK: "diagnostic-feedback-family",
    UNAVAILABLE: "unavailable"
  });

  const TARGET_ALIASES = Object.freeze({
    baker_st_100yd_smart: "baker_st_100yd_smart_zero",
    baker_sl_st1_practice: "baker_sl_st1",
    "baker-sl-st1": "baker_sl_st1",
    gunfun_22740_vital_dude: "gunfun_22740_vital_dude",
    "gunfun-22740-vital-dude": "gunfun_22740_vital_dude",
    gunfun_22740: "gunfun_22740_vital_dude",
    idpa_silhouette_sl_st2: "idpa_silhouette_sl_st2",
    baker_sl_st2: "idpa_silhouette_sl_st2",
    "baker-sl-st2": "idpa_silhouette_sl_st2",
    baker_gf_db: "baker_gf_db",
    "baker-gf-db": "baker_gf_db",
    baker_gf_bp: "baker_gf_bp",
    "baker-gf-bp": "baker_gf_bp"
    ,ez2c_dot_torture_17: "ez2c_dot_torture_17"
    ,"dot-torture": "ez2c_dot_torture_17"
    ,baker_gf_bb_c: "baker_gf_bb_c"
    ,"baker-gf-bb-c": "baker_gf_bb_c"
    ,baker_gf_battleship: "baker_gf_battleship"
    ,"baker-gf-battleship": "baker_gf_battleship"
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
    const pkg = identity.package;
    const contract = pkg && pkg.executionContract;

    if (pkg && pkg.authoritySource === "backend-authoritative" && contract && contract.contractFingerprint) {
      if (contract.secAdapterFamilyId === ADAPTERS.CONTRACT_SMART_EVIDENCE && mission === "smartevidencecapture" && result === "smartevidenceresult") return ADAPTERS.CONTRACT_SMART_EVIDENCE;
      if (contract.secAdapterFamilyId === ADAPTERS.CONTRACT_PRECISION_OPEN_SCORE && mission === "precisionringscore" && result === "precisionscoreresult") return ADAPTERS.CONTRACT_PRECISION_OPEN_SCORE;
      if (contract.secAdapterFamilyId === ADAPTERS.CONTRACT_RECREATIONAL_CHALLENGE && mission === "recreationalchallenge" && result === "challengeresult") return ADAPTERS.CONTRACT_RECREATIONAL_CHALLENGE;
      if (contract.secAdapterFamilyId === ADAPTERS.CONTRACT_COLLECTION_HAND && mission === "collectionhandevaluation" && result === "collectionhandresult") return ADAPTERS.CONTRACT_COLLECTION_HAND;
      if (contract.secAdapterFamilyId === ADAPTERS.CONTRACT_CUE_DRILL && mission === "cuedrillorchestration" && result === "cuedrillresult") return ADAPTERS.CONTRACT_CUE_DRILL;
      if (contract.secAdapterFamilyId === ADAPTERS.CONTRACT_DECISION_SCENARIO && mission === "decisionscenarioevaluation" && result === "decisionscenarioresult") return ADAPTERS.CONTRACT_DECISION_SCENARIO;
      if (contract.secAdapterFamilyId === ADAPTERS.CONTRACT_SEC_PROGRESSION && mission === "secprogressionevaluation" && result === "secprogressionresult") return ADAPTERS.CONTRACT_SEC_PROGRESSION;
      if (contract.secAdapterFamilyId === ADAPTERS.CONTRACT_QUALIFICATION && mission === "qualificationcourseevaluation" && result === "qualificationresult") return ADAPTERS.CONTRACT_QUALIFICATION;
      if (contract.secAdapterFamilyId === ADAPTERS.CONTRACT_DIAGNOSTIC_FEEDBACK && mission === "diagnosticfeedbackevaluation" && result === "diagnosticfeedbackresult") return ADAPTERS.CONTRACT_DIAGNOSTIC_FEEDBACK;
      return ADAPTERS.UNAVAILABLE;
    }

    if (target === "m4_25m_zero" && mission === "zeroingcorrection" && result === "zerocorrectionresult") {
      return ADAPTERS.M4_ZEROING;
    }
    if (target === "baker_m16a2_25m_zero" && mission === "zeroingcorrection" && result === "zerocorrectionresult") {
      return ADAPTERS.M16A2_ZEROING;
    }
    if (target === "speedwell_dodm4_m16a2_25m_zero" && mission === "zeroingcorrection" && result === "zerocorrectionresult") {
      return ADAPTERS.SPEEDWELL_M16A2_ZEROING;
    }
    if (target === "army_nsn_6920_01_395_2949_m16a2_25m_zero" && mission === "zeroingcorrection" && result === "zerocorrectionresult") {
      return ADAPTERS.ARMY_M16A2_ZEROING;
    }
    if (target === "baker_st_100yd_smart_zero" && mission === "zeroingcorrection" && result === "zerocorrectionresult") {
      return ADAPTERS.BAKER_100YD_ZEROING;
    }
    if (target === "baker_sl_st1" && mission === "smartevidencecapture" && result === "smartevidenceresult") {
      return ADAPTERS.BAKER_SL_ST1;
    }
    if (target === "gunfun_22740_vital_dude" && mission === "smartevidencecapture" && result === "smartevidenceresult") {
      return ADAPTERS.GUNFUN_VITAL_DUDE;
    }
    if (target === "idpa_silhouette_sl_st2" && mission === "idpatimedpractice" && result === "idpatimescoreresult") {
      return ADAPTERS.BAKER_SL_ST2_IDPA;
    }
    if (target === "baker_gf_db" && mission === "bakerfungame" && result === "bakerdartboardgameresult") {
      return identity.package && identity.package.result && identity.package.result.gameMode === "game_of_numbers"
        ? ADAPTERS.BAKER_GF_DB_NUMBERS
        : ADAPTERS.BAKER_GF_DB_POINTS;
    }
    if (target === "baker_gf_bp" && mission === "bakerfungame" && result === "bakerbowlingpinsresult") {
      return ADAPTERS.BAKER_GF_BP;
    }
    if (target === "ez2c_dot_torture_17" && mission === "catalogfungame" && result === "dottorturecourseresult") {
      return ADAPTERS.EZ2C_DOT_TORTURE;
    }
    if (target === "baker_gf_bb_c" && mission === "catalogfungame" && result === "bakerbilliardsequenceresult") {
      return ADAPTERS.BAKER_GF_BB_C;
    }
    if (target === "baker_gf_battleship" && mission === "catalogfungame" && result === "bakerbattleshipgameresult") {
      return ADAPTERS.BAKER_GF_BATTLESHIP;
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
    if ([ADAPTERS.M4_ZEROING, ADAPTERS.M16A2_ZEROING].includes(dispatch.adapter)) {
      const params = new URLSearchParams(options.current
        ? { v: options.version || "sec-dispatch-v1" }
        : { sessionId, v: options.version || "sec-dispatch-v1" });
      if (new URLSearchParams(global.location && global.location.search || "").get("founder_review") === "1") params.set("founder_review", "1");
      if (options.thumbnail) params.set("vaultThumbnail", "1");
      return `sec.html?${params.toString()}`;
    }
    if ([ADAPTERS.CONTRACT_SMART_EVIDENCE, ADAPTERS.CONTRACT_PRECISION_OPEN_SCORE, ADAPTERS.CONTRACT_RECREATIONAL_CHALLENGE, ADAPTERS.CONTRACT_COLLECTION_HAND, ADAPTERS.CONTRACT_CUE_DRILL, ADAPTERS.CONTRACT_DECISION_SCENARIO, ADAPTERS.CONTRACT_QUALIFICATION, ADAPTERS.CONTRACT_DIAGNOSTIC_FEEDBACK].includes(dispatch.adapter)) {
      return `target-experience.html?session=${encodeURIComponent(sessionId)}&view=sec`;
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
