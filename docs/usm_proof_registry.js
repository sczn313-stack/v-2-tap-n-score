(function registerUSMProof(global) {
  "use strict";

  function governedAdditiveScoring(value) {
    const candidate = value && value.result ? value.result : value;
    const scoring = candidate && candidate.scoring;
    const missionFamily = String(candidate && candidate.missionFamily || value && value.missionFamily || "").trim();
    const model = String(scoring && scoring.model || value && value.scoringModel || "").trim();
    const status = String(scoring && scoring.status || value && value.scoringStatus || "").trim();
    const score = Number((scoring && scoring.total) ?? (value && value.score));
    const totalTaps = Number((scoring && scoring.observationCount) ?? (value && value.totalTaps));
    return missionFamily === "targetScoring"
      && ["numeric_regions", "penalty_regions", "mixed_regions"].includes(model)
      && status === "complete"
      && Number.isFinite(score)
      && Number.isInteger(totalTaps)
      && totalTaps > 0;
  }

  global.SCZN3USMProofRegistry = Object.freeze({
    modelId: "sczn3-usm-total-points-total-taps-points-per-tap-v2",
    status: "founder-approved-capability-inheritance",
    eligibility: "governed-additive-numeric-region-scoring",
    supportedScoringModels: Object.freeze(["numeric_regions", "penalty_regions", "mixed_regions"]),
    isEligible: governedAdditiveScoring
  });
})(window);
