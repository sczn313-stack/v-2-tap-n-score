(function (global) {
  "use strict";

  const registry = global.SCZN3TargetAdapters;
  if (!registry) throw new Error("SCZN3TargetAdapters is required before sec_adapter_model.js");

  const SCHEMA = registry.schemaVersion;
  const FAMILY = registry.scoringPresentationFamilies;
  const SESSION_AUTHORITY = Object.freeze({ packageType: "authoritative-session", source: "backend-authoritative" });
  const PRESERVATION = Object.freeze(["save-sec", "open-ballistic-vault", "reopen-preserved-sec"]);

  function component(stage, modelRef, authorityRef) {
    return Object.freeze({ stage, modelRef, authorityRef });
  }

  const definitions = [
    {
      schemaVersion: SCHEMA,
      adapterId: "m4-zeroing",
      targetProfileRef: { targetProfileId: "m4_25m_zero", targetProfileVersion: "M4_TARGET_AUTHORITY_v1_ORIGINAL" },
      authorityReferences: {
        session: SESSION_AUTHORITY,
        result: { packageType: "zeroCorrectionResult", source: "backend-authoritative" }
      },
      scoringPresentationFamily: FAMILY.ZEROING_CORRECTION,
      contentModel: {
        result: { authorityRef: "resultPackage.correction" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "group-measurement", "resultPackage.measurement"),
          component("recommendation", "sight-correction", "resultPackage.correction"),
          component("execution", "applied-correction", "session.execution"),
          component("validation", "confirmation-group", "resultPackage.validation"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "baker-100yd-zeroing",
      targetProfileRef: { targetProfileId: "baker_st_100yd_smart_zero", targetProfileVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL" },
      authorityReferences: {
        session: SESSION_AUTHORITY,
        result: { packageType: "zeroCorrectionResult", source: "backend-authoritative" }
      },
      scoringPresentationFamily: FAMILY.ZEROING_CORRECTION,
      contentModel: {
        result: { authorityRef: "resultPackage.correction" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "group-measurement", "resultPackage.measurement"),
          component("recommendation", "sight-correction", "resultPackage.correction"),
          component("execution", "applied-correction", "session.execution"),
          component("validation", "confirmation-group", "resultPackage.validation"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "gssf",
      targetProfileRef: { targetProfileId: "gssf_ac_1", targetProfileVersion: "1" },
      authorityReferences: {
        session: SESSION_AUTHORITY,
        result: { packageType: "gssfPaperPenaltyResult", source: "backend-authoritative" }
      },
      scoringPresentationFamily: FAMILY.LOWEST_SCORE_WINS,
      contentModel: {
        result: { authorityRef: "resultPackage.totalTime" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "time-and-penalties", "resultPackage.measurement"),
          component("execution", "string-execution", "session.execution"),
          component("validation", "score-reconciliation", "resultPackage.validation"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "baker-sl-st1",
      targetProfileRef: { targetProfileId: "baker_sl_st1_practice", targetProfileVersion: "1" },
      authorityReferences: {
        session: SESSION_AUTHORITY,
        result: { packageType: "smartEvidenceResult", source: "backend-authoritative" }
      },
      scoringPresentationFamily: FAMILY.HIGHEST_SCORE_WINS,
      contentModel: {
        result: { authorityRef: "resultPackage.scoring" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "zone-performance", "resultPackage.scoring"),
          component("validation", "score-reconciliation", "resultPackage.validation"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "gunfun-vital-dude-evidence",
      targetProfileRef: { targetProfileId: "gunfun_22740_vital_dude", targetProfileVersion: "1" },
      authorityReferences: {
        session: SESSION_AUTHORITY,
        result: { packageType: "smartEvidenceResult", source: "backend-authoritative" }
      },
      scoringPresentationFamily: FAMILY.EVIDENCE_ONLY,
      contentModel: {
        result: { authorityRef: "resultPackage.supportedAnalysis" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("validation", "observation-reconciliation", "resultPackage.reconciliation"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "baker-sl-st2-idpa",
      targetProfileRef: { targetProfileId: "idpa_silhouette_sl_st2", targetProfileVersion: "1" },
      authorityReferences: {
        session: SESSION_AUTHORITY,
        result: { packageType: "idpaTimeScoreResult", source: "backend-authoritative" }
      },
      scoringPresentationFamily: FAMILY.LOWEST_SCORE_WINS,
      contentModel: {
        result: { authorityRef: "resultPackage.scoring" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "time-and-points-down", "resultPackage.scoring"),
          component("execution", "timed-pair-execution", "session.execution"),
          component("validation", "time-and-selection-reconciliation", "resultPackage.reconciliation"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "baker-gf-db-points",
      targetProfileRef: { targetProfileId: "baker_gf_db", targetProfileVersion: "1" },
      authorityReferences: { session: SESSION_AUTHORITY, result: { packageType: "bakerDartboardGameResult", source: "backend-authoritative" } },
      scoringPresentationFamily: FAMILY.HIGHEST_SCORE_WINS,
      contentModel: {
        result: { authorityRef: "resultPackage.result" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "player-score-breakdown", "resultPackage.result.players"),
          component("validation", "game-reconciliation", "resultPackage.reconciliation"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "baker-gf-db-numbers",
      targetProfileRef: { targetProfileId: "baker_gf_db", targetProfileVersion: "1" },
      authorityReferences: {
        session: SESSION_AUTHORITY,
        result: { packageType: "bakerDartboardGameResult", source: "backend-authoritative" },
        qualification: { packageType: "bakerDartboardGameResult", source: "backend-authoritative" }
      },
      scoringPresentationFamily: FAMILY.QUALIFICATION_PASS_FAIL,
      contentModel: {
        result: { authorityRef: "resultPackage.result" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "numbers-progress", "resultPackage.result.players"),
          component("validation", "game-outcome", "resultPackage.result"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "baker-gf-bp",
      targetProfileRef: { targetProfileId: "baker_gf_bp", targetProfileVersion: "1" },
      authorityReferences: {
        session: SESSION_AUTHORITY,
        result: { packageType: "bakerBowlingPinsResult", source: "backend-authoritative" },
        qualification: { packageType: "bakerBowlingPinsResult", source: "backend-authoritative" }
      },
      scoringPresentationFamily: FAMILY.QUALIFICATION_PASS_FAIL,
      contentModel: {
        result: { authorityRef: "resultPackage.result" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "pin-count", "resultPackage.result"),
          component("validation", "ten-shot-challenge", "resultPackage.result"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "ez2c-dot-torture",
      targetProfileRef: { targetProfileId: "ez2c_dot_torture_17", targetProfileVersion: "1" },
      authorityReferences: { session: SESSION_AUTHORITY, result: { packageType: "dotTortureCourseResult", source: "backend-authoritative" } },
      scoringPresentationFamily: FAMILY.HIGHEST_SCORE_WINS,
      contentModel: {
        result: { authorityRef: "resultPackage.result" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "course-score", "resultPackage.result"),
          component("execution", "published-course", "resultPackage.result.observations"),
          component("validation", "course-reconciliation", "resultPackage.reconciliation"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "baker-gf-bb-c",
      targetProfileRef: { targetProfileId: "baker_gf_bb_c", targetProfileVersion: "1" },
      authorityReferences: {
        session: SESSION_AUTHORITY,
        result: { packageType: "bakerBilliardSequenceResult", source: "backend-authoritative" },
        qualification: { packageType: "bakerBilliardSequenceResult", source: "backend-authoritative" }
      },
      scoringPresentationFamily: FAMILY.QUALIFICATION_PASS_FAIL,
      contentModel: {
        result: { authorityRef: "resultPackage.result" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "ordered-sequence", "resultPackage.result"),
          component("execution", "turn-sequence", "resultPackage.result.observations"),
          component("validation", "sequence-completion", "resultPackage.result"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    },
    {
      schemaVersion: SCHEMA,
      adapterId: "baker-gf-battleship",
      targetProfileRef: { targetProfileId: "baker_gf_battleship", targetProfileVersion: "1" },
      authorityReferences: {
        session: SESSION_AUTHORITY,
        result: { packageType: "bakerBattleshipGameResult", source: "backend-authoritative" },
        qualification: { packageType: "bakerBattleshipGameResult", source: "backend-authoritative" }
      },
      scoringPresentationFamily: FAMILY.QUALIFICATION_PASS_FAIL,
      contentModel: {
        result: { authorityRef: "resultPackage.result" },
        components: [
          component("evidence", "target-evidence", "session.evidence"),
          component("measurement", "ship-square-state", "resultPackage.result.boards"),
          component("execution", "publisher-game-turns", "resultPackage.result.observations"),
          component("validation", "published-win-loss", "resultPackage.result"),
          component("preservation", "sec-preservation", "session.preservation")
        ]
      },
      preservationCapabilities: PRESERVATION
    }
  ];

  definitions.forEach(definition => registry.register(definition));

  const familyRegistry = global.SCZN3ExecutionFamilyAdapters;
  if (!familyRegistry) throw new Error("SCZN3ExecutionFamilyAdapters is required before sec_adapter_model.js");
  const familyDefinitions = [
    {
      adapterId: "collection-hand-family", missionFamily: "collectionHandEvaluation", resultPackageType: "collectionHandResult", resultPackageVersion: "1", missionLabel: "Publisher Collection / Hand",
      authorityReferences: { session: SESSION_AUTHORITY, result: { packageType: "collectionHandResult", source: "backend-authoritative" }, executionContract: { packageType: "targetExecutionContract", source: "backend-authoritative" }, collectionHandProfile: { packageType: "collectionHandGameProfile", source: "publisher-authoritative" } },
      scoringPresentationFamily: FAMILY.EVIDENCE_ONLY,
      contentModel: { result: { authorityRef: "resultPackage.players" }, components: [component("evidence", "registered-target-evidence", "session.evidence"), component("execution", "governed-turn-and-collection-state", "resultPackage.turns"), component("validation", "publisher-defined-hand-evaluation", "resultPackage.players"), component("preservation", "sec-preservation", "session.preservation")] },
      preservationCapabilities: PRESERVATION
    },
    {
      adapterId: "sec-progression-family", missionFamily: "secProgressionEvaluation", resultPackageType: "secProgressionResult", resultPackageVersion: "1", missionLabel: "Governed Progression Result",
      authorityReferences: { session: { packageType: "progressionRecordPresentationContext", source: "backend-authoritative" }, result: { packageType: "secProgressionResult", source: "backend-authoritative" }, executionContract: { packageType: "targetExecutionContract", source: "backend-authoritative" }, progressionProfile: { packageType: "secProgressionProfile", source: "publisher-authoritative" }, sourceSECs: { packageType: "preservedSECs", source: "backend-preserved" } },
      scoringPresentationFamily: FAMILY.EVIDENCE_ONLY,
      contentModel: { result: { authorityRef: "resultPackage.transition" }, components: [component("evidence", "immutable-source-secs", "resultPackage.sourceSECs"), component("execution", "progression-transition", "resultPackage.transition"), component("validation", "append-only-provenance", "resultPackage.authorityTrace"), component("preservation", "progression-record-preservation", "resultPackage.resultIdentity")] },
      preservationCapabilities: PRESERVATION
    },
    {
      adapterId: "decision-scenario-family", missionFamily: "decisionScenarioEvaluation", resultPackageType: "decisionScenarioResult", resultPackageVersion: "1", missionLabel: "Publisher-Designated Response Match",
      authorityReferences: { session: SESSION_AUTHORITY, result: { packageType: "decisionScenarioResult", source: "backend-authoritative" }, executionContract: { packageType: "targetExecutionContract", source: "backend-authoritative" }, decisionProfile: { packageType: "decisionScenarioProfile", source: "publisher-authoritative" } },
      scoringPresentationFamily: FAMILY.EVIDENCE_ONLY,
      contentModel: { result: { authorityRef: "resultPackage.presentations" }, components: [component("evidence", "registered-target-evidence", "session.evidence"), component("execution", "governed-scenario-presentations", "resultPackage.presentations"), component("validation", "publisher-designation-response-reconciliation", "resultPackage.reconciliation"), component("preservation", "sec-preservation", "session.preservation")] },
      preservationCapabilities: PRESERVATION
    },
    {
      adapterId: "diagnostic-feedback-family", missionFamily: "diagnosticFeedbackEvaluation", resultPackageType: "diagnosticFeedbackResult", resultPackageVersion: "1", missionLabel: "Publisher Label Match",
      authorityReferences: { session: SESSION_AUTHORITY, result: { packageType: "diagnosticFeedbackResult", source: "backend-authoritative" }, executionContract: { packageType: "targetExecutionContract", source: "backend-authoritative" }, publisherLabels: { packageType: "diagnosticFeedbackProfile", source: "publisher-authoritative" } },
      scoringPresentationFamily: FAMILY.EVIDENCE_ONLY,
      contentModel: { result: { authorityRef: "resultPackage.classifications" }, components: [component("evidence", "registered-target-evidence", "session.evidence"), component("measurement", "ugo-region-association", "resultPackage.classifications"), component("validation", "publisher-label-reconciliation", "resultPackage.reconciliation"), component("preservation", "sec-preservation", "session.preservation")] },
      preservationCapabilities: PRESERVATION
    },
    {
      adapterId: "qualification-family", missionFamily: "qualificationCourseEvaluation", resultPackageType: "qualificationResult", resultPackageVersion: "1", missionLabel: "Practice Qualification",
      authorityReferences: { session: SESSION_AUTHORITY, result: { packageType: "qualificationResult", source: "backend-authoritative" }, executionContract: { packageType: "targetExecutionContract", source: "backend-authoritative" }, qualificationProfile: { packageType: "qualificationProfile", source: "governing-authority" } },
      scoringPresentationFamily: FAMILY.QUALIFICATION_PASS_FAIL,
      contentModel: { result: { authorityRef: "resultPackage.performance" }, components: [component("evidence", "registered-target-evidence", "session.evidence"), component("execution", "governed-course-stages", "resultPackage.stages"), component("validation", "practice-qualification-evaluation", "resultPackage.performance"), component("preservation", "sec-preservation", "session.preservation")] },
      preservationCapabilities: PRESERVATION
    },
    {
      adapterId: "cue-drill-family", missionFamily: "cueDrillOrchestration", resultPackageType: "cueDrillResult", resultPackageVersion: "1", missionLabel: "Cue / Drill",
      authorityReferences: { session: SESSION_AUTHORITY, result: { packageType: "cueDrillResult", source: "backend-authoritative" }, executionContract: { packageType: "targetExecutionContract", source: "backend-authoritative" } },
      scoringPresentationFamily: FAMILY.EVIDENCE_ONLY,
      contentModel: { result: { authorityRef: "resultPackage.run" }, components: [component("evidence", "registered-target-evidence", "session.evidence"), component("execution", "governed-cue-sequence", "resultPackage.stages"), component("validation", "cue-response-reconciliation", "resultPackage.reconciliation"), component("preservation", "sec-preservation", "session.preservation")] },
      preservationCapabilities: PRESERVATION
    },
    {
      adapterId: "smart-evidence-family", missionFamily: "smartEvidenceCapture", resultPackageType: "smartEvidenceResult", resultPackageVersion: "1", missionLabel: "Evidence Capture",
      authorityReferences: { session: SESSION_AUTHORITY, result: { packageType: "smartEvidenceResult", source: "backend-authoritative" }, executionContract: { packageType: "targetExecutionContract", source: "backend-authoritative" } },
      scoringPresentationFamily: FAMILY.EVIDENCE_ONLY,
      contentModel: { result: { authorityRef: "resultPackage.supportedAnalysis" }, components: [component("evidence", "registered-target-evidence", "session.evidence"), component("validation", "observation-reconciliation", "resultPackage.reconciliation"), component("preservation", "sec-preservation", "session.preservation")] },
      preservationCapabilities: PRESERVATION
    },
    {
      adapterId: "precision-open-score-family", missionFamily: "precisionRingScore", resultPackageType: "precisionScoreResult", resultPackageVersion: "1", missionLabel: "Open Scoring",
      authorityReferences: { session: SESSION_AUTHORITY, result: { packageType: "precisionScoreResult", source: "backend-authoritative" }, executionContract: { packageType: "targetExecutionContract", source: "backend-authoritative" } },
      scoringPresentationFamily: FAMILY.HIGHEST_SCORE_WINS,
      contentModel: { result: { authorityRef: "resultPackage.scoring" }, components: [component("evidence", "registered-target-evidence", "session.evidence"), component("measurement", "governed-zone-values", "resultPackage.scoring"), component("validation", "score-reconciliation", "resultPackage.reconciliation"), component("preservation", "sec-preservation", "session.preservation")] },
      preservationCapabilities: PRESERVATION
    },
    {
      adapterId: "recreational-challenge-family", missionFamily: "recreationalChallenge", resultPackageType: "challengeResult", resultPackageVersion: "1", missionLabel: "Recreational Challenge",
      authorityReferences: { session: SESSION_AUTHORITY, result: { packageType: "challengeResult", source: "backend-authoritative" }, executionContract: { packageType: "targetExecutionContract", source: "backend-authoritative" } },
      scoringPresentationFamily: FAMILY.QUALIFICATION_PASS_FAIL,
      contentModel: { result: { authorityRef: "resultPackage.challenge" }, components: [component("evidence", "registered-target-evidence", "session.evidence"), component("execution", "challenge-state", "resultPackage.events"), component("validation", "challenge-reconciliation", "resultPackage.reconciliation"), component("preservation", "sec-preservation", "session.preservation")] },
      preservationCapabilities: PRESERVATION
    }
  ];
  familyDefinitions.forEach(definition => familyRegistry.register(definition));
})(window);
