(function registerUSMProof(global) {
  "use strict";

  const individuallyEligibleTargetIds = new Set(["gunfun_22200_b27e_black"]);
  const QT_PRINTER13_TARGET_PREFIX = "qt_printer13_product_";

  global.SCZN3USMProofRegistry = Object.freeze({
    modelId: "sczn3-usm-score-hit-rate-points-per-tap-v1",
    status: "b27e-founder-approved-plus-qt-printer13-corrected-packet",
    isEligible(targetId) {
      const cleanTargetId = String(targetId || "").trim();
      return individuallyEligibleTargetIds.has(cleanTargetId) || cleanTargetId.startsWith(QT_PRINTER13_TARGET_PREFIX);
    }
  });
})(window);
