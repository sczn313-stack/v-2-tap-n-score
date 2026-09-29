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
      && model === "numeric_regions"
      && status === "complete"
      && Number.isFinite(score)
      && Number.isInteger(totalTaps)
      && totalTaps > 0;
  }

  global.SCZN3USMProofRegistry = Object.freeze({
    modelId: "sczn3-usm-score-hit-rate-points-per-tap-v1",
    status: "founder-approved-capability-inheritance",
    eligibility: "governed-additive-numeric-region-scoring",
    isEligible: governedAdditiveScoring
  });
})(window);
