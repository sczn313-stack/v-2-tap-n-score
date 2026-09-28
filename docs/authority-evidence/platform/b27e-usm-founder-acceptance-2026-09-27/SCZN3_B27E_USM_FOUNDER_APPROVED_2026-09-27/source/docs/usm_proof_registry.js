(function registerUSMProof(global) {
  "use strict";

  const eligibleTargetIds = new Set(["gunfun_22200_b27e_black"]);

  global.SCZN3USMProofRegistry = Object.freeze({
    modelId: "sczn3-usm-score-hit-rate-points-per-tap-v1",
    status: "controlled-proof",
    isEligible(targetId) {
      return eligibleTargetIds.has(String(targetId || "").trim());
    }
  });
})(window);
