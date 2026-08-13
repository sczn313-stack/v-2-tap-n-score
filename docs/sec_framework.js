(function () {
  "use strict";

  let vectorSequence = 0;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function metric(label, value, detail = "") {
    return `<div class="sec-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ""}</div>`;
  }

  function halfToEven(value) {
    const lower = Math.floor(value);
    const difference = value - lower;
    if (Math.abs(difference - 0.5) < Number.EPSILON * Math.max(1, Math.abs(value))) {
      return lower % 2 === 0 ? lower : lower + 1;
    }
    return Math.round(value);
  }

  function verifyCalculationChain(authorityPackage) {
    const clicks = authorityPackage && authorityPackage.clicks;
    const mechanical = authorityPackage && authorityPackage.mechanicalValidation || {};
    if (!clicks) {
      return {
        status: mechanical.status === "failed" ? "mismatch" : "unavailable",
        axes: {},
        reasons: mechanical.status === "failed"
          ? [mechanical.reason || "mechanical calculation failed"]
          : []
      };
    }
    const angular = authorityPackage.angular || {};
    const model = clicks.model || {};
    const unit = String(model.unit || "").toUpperCase();
    const roundingRule = String(model.roundingRule || "");
    const stored = authorityPackage.calculationReconciliation || {};
    const reasons = [];
    const axes = {};
    for (const axis of ["windage", "elevation"]) {
      const angularValue = Number(
        unit === "MRAD"
          ? angular[`${axis}MRAD`]
          : angular[`${axis}MOA`]
      );
      const displayedAngularValue = Number(angularValue.toFixed(2));
      const clickConstant = Number(model[`${axis}PerClick`]);
      const displayedClicks = Number(clicks[`${axis}Clicks`]);
      const rawClicks = angularValue / clickConstant;
      const displayedRawClicks = displayedAngularValue / clickConstant;
      const expectedClicks = halfToEven(rawClicks);
      const displayedExpectedClicks = halfToEven(displayedRawClicks);
      const storedAxis = stored.axes && stored.axes[axis] || {};
      const finite = [
        angularValue,
        displayedAngularValue,
        clickConstant,
        displayedClicks,
        rawClicks,
        displayedRawClicks
      ].every(Number.isFinite);
      const reconciled =
        finite
        && clickConstant > 0
        && roundingRule === "nearest-whole-click-half-to-even"
        && expectedClicks === displayedClicks
        && displayedExpectedClicks === displayedClicks
        && stored.status === "reconciled"
        && storedAxis.status === "reconciled"
        && Number(storedAxis.displayedClicks) === displayedClicks
        && Number(storedAxis.clickConstant) === clickConstant;
      axes[axis] = {
        status: reconciled ? "reconciled" : "mismatch",
        angularValue,
        displayedAngularValue,
        clickConstant,
        rawClicks,
        displayedRawClicks,
        expectedClicks,
        displayedExpectedClicks,
        displayedClicks,
        roundingRule
      };
      if (!reconciled) reasons.push(`${axis} calculation chain does not reconcile`);
    }
    return {
      status: reasons.length ? "mismatch" : "reconciled",
      axes,
      reasons
    };
  }

  function marker(point, className, label) {
    if (!point) return "";
    return `<span class="target-marker ${escapeHtml(className)}" style="left:${Number(point.xPercent)}%;top:${Number(point.yPercent)}%">${escapeHtml(label)}</span>`;
  }

  function vector(value) {
    if (!value || !value.start || !value.end) return "";
    const markerId = `sec-correction-arrowhead-${++vectorSequence}`;
    return `<svg class="target-correction-vector" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Correction vector from POIB to confirmed aim point">
      <defs>
        <marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse" markerUnits="strokeWidth">
          <path d="M 0 0 L 10 5 L 0 10 z"></path>
        </marker>
      </defs>
      <line x1="${Number(value.start.xPercent)}" y1="${Number(value.start.yPercent)}" x2="${Number(value.end.xPercent)}" y2="${Number(value.end.yPercent)}" marker-end="url(#${markerId})"></line>
    </svg>`;
  }

  function EvidenceCard(authorityPackage) {
    const status = authorityPackage.status || {};
    const lineage = authorityPackage.lineage || {};
    return {
      summary: `${Number(status.impactCount || 0)} confirmed impacts established the initial group. SCZN3 calculated the correction from that group's POIB to the confirmed aim point.`,
      sourceIds: lineage.sourceShotIds || [],
      overlay(render = authorityPackage.renderCoordinates || {}) {
        const impacts = Array.isArray(render.impacts) ? render.impacts : [];
        return vector(render.vector) +
          marker(render.aim, "aim-marker", "") +
          impacts.map((point, index) => marker(point, "impact-marker", index + 1)).join("") +
          marker(render.poib, "poib-marker", "POIB");
      }
    };
  }

  function ShooterAnalysisCard(authorityPackage) {
    const group = authorityPackage.group || {};
    const discrepancy = authorityPackage.aimPointDiscrepancy || {};
    return [
      metric("Group Size", group.display || "Unavailable", "confirmed impact spread"),
      metric(
        "Aim vs Bull",
        Number.isFinite(Number(discrepancy.magnitudeInches)) ? `${Number(discrepancy.magnitudeInches).toFixed(2)}\"` : "Unavailable",
        "recorded offset"
      )
    ].join("");
  }

  function SightCorrectionCard(authorityPackage) {
    const correction = authorityPackage.correction || {};
    const angular = authorityPackage.angular || {};
    const clicks = authorityPackage.clicks || {};
    const adjustment = clicks.model || {};
    const mechanical = authorityPackage.mechanicalValidation || {};
    const integrity = verifyCalculationChain(authorityPackage);
    const unit = String(adjustment.unit || "MOA").toUpperCase();
    if (mechanical.status !== "calculated" || integrity.status !== "reconciled") {
      const guidance = global.SCZN3Presentation
        ? global.SCZN3Presentation.sightCorrectionGuidance({ integrityStatus: integrity.status })
        : "Your target and group measurement are saved. Review your sight setup in Equipment to receive Sight Correction.";
      return `<div class="sec-sight-correction-unavailable"><span>Sight Correction</span><strong>${escapeHtml(guidance)}</strong></div>`;
    }
    const axisCard = axis => {
      const label = axis[0].toUpperCase() + axis.slice(1);
      const trace = integrity.axes[axis];
      const direction = correction[axis] || `${clicks[`${axis}Clicks`]} clicks ${clicks[`${axis}Direction`] || "CENTER"}`;
      const turn = clicks[`${axis}TurnDirection`];
      const angularValue = unit === "MRAD" ? angular[`${axis}MRAD`] : angular[`${axis}MOA`];
      const supporting = [
        Number.isFinite(Number(angularValue)) ? `${Number(angularValue).toFixed(2)} ${unit} offset` : "",
        trace && Number.isFinite(Number(trace.clickConstant)) ? `${trace.clickConstant} ${unit}/click` : "",
        turn ? `turn ${turn}` : ""
      ].filter(Boolean).join(" · ");
      return `<div class="sec-sight-correction-axis"><span>${escapeHtml(label)}</span><strong>${escapeHtml(direction)}</strong>${supporting ? `<small>${escapeHtml(supporting)}</small>` : ""}</div>`;
    };
    return `<div class="sec-sight-correction-story"><div class="sec-sight-correction-system"><span>Adjustment system</span><strong>${escapeHtml(adjustment.label || "Recorded sight setup")}</strong></div><div class="sec-sight-correction-grid">${axisCard("elevation")}${axisCard("windage")}</div></div>`;
  }

  function RecommendationCard(authorityPackage) {
    const correction = authorityPackage.correction || {};
    const angular = authorityPackage.angular || {};
    const mechanical = authorityPackage.mechanicalValidation || {};
    const integrity = verifyCalculationChain(authorityPackage);
    const instruction = mechanical.status === "calculated" && integrity.status === "reconciled"
      ? `<strong>${escapeHtml(correction.elevation)}</strong><strong>${escapeHtml(correction.windage)}</strong>`
      : integrity.status === "mismatch"
        ? "<strong>Correction unavailable</strong>"
        : "<strong>Sight adjustment unavailable</strong>";
    return {
      call: `${instruction}
        <span>Confirmed aim point minus POIB correction vector</span>`,
      angular: ["windage", "elevation"].map(axis => {
        const trace = integrity.axes[axis];
        const axisLabel = axis[0].toUpperCase() + axis.slice(1);
        if (!trace || integrity.status !== "reconciled") {
          return metric(
            axisLabel,
            `${Number(angular[`${axis}MOA`] || 0).toFixed(2)} MOA`,
            `${Number(angular[`${axis}MRAD`] || 0).toFixed(2)} MRAD · click recommendation unavailable`
          );
        }
        return metric(
          axisLabel,
          `${trace.displayedAngularValue.toFixed(2)} ${String((authorityPackage.clicks.model || {}).unit || "MOA").toUpperCase()}`,
          `${trace.clickConstant} ${String((authorityPackage.clicks.model || {}).unit || "MOA").toUpperCase()}/click · raw ${trace.displayedRawClicks.toFixed(2)} → ${trace.displayedClicks} clicks`
        );
      }).join("")
    };
  }

  function ExecutionCard(authorityPackage) {
    const correction = authorityPackage.correction || {};
    const adjustment = authorityPackage.clicks && authorityPackage.clicks.model || {};
    const mechanical = authorityPackage.mechanicalValidation || {};
    const integrity = verifyCalculationChain(authorityPackage);
    if (mechanical.status !== "calculated" || integrity.status !== "reconciled") {
      const guidance = global.SCZN3Presentation
        ? global.SCZN3Presentation.sightCorrectionGuidance({ integrityStatus: integrity.status })
        : "Your target and group measurement are saved. Review your sight setup in Equipment to receive Sight Correction.";
      return `<div><span>Next step</span><strong>${escapeHtml(guidance)}</strong></div>`;
    }
    return `<div><span>Adjustment system</span><strong>${escapeHtml(adjustment.label || "Unavailable")}</strong></div>
      <div><span>Elevation</span><strong>Apply ${escapeHtml(correction.elevation || "Unavailable")}${authorityPackage.clicks.elevationTurnDirection ? ` · turn ${escapeHtml(authorityPackage.clicks.elevationTurnDirection)}` : ""}</strong></div>
      <div><span>Windage</span><strong>Apply ${escapeHtml(correction.windage || "Unavailable")}${authorityPackage.clicks.windageTurnDirection ? ` · turn ${escapeHtml(authorityPackage.clicks.windageTurnDirection)}` : ""}</strong></div>`;
  }

  function ValidationCard(authorityPackage, initialAuthorityPackage = null) {
    if (!authorityPackage || !authorityPackage.validation) {
      return {
        outcome: "Confirmation group pending",
        detail: "No validation conclusion has been calculated.",
        confirmed: false,
        hash: ""
      };
    }
    const validation = authorityPackage.validation;
    const initialIntegrity = verifyCalculationChain(initialAuthorityPackage);
    const confirmationIntegrity = verifyCalculationChain(authorityPackage);
    if (
      initialIntegrity.status === "mismatch"
      || confirmationIntegrity.status === "mismatch"
    ) {
      return {
        outcome: "RESULT UNAVAILABLE",
        detail: "The correction could not be verified. Return to the target and try Show Results again.",
        confirmed: false,
        hash: ""
      };
    }
    return {
      outcome: validation.outcome,
      detail: `${validation.standard} · residual ${Number(validation.residualOffsetInches).toFixed(2)}"`,
      confirmed: !!validation.confirmed,
      hash: authorityPackage.evidenceHash
    };
  }

  function PreservationCard(capabilities) {
    return [
      capabilities.save ? '<button class="button primary" type="button" id="saveSEC">Save SEC</button>' : "",
      capabilities.validation ? '<button class="button" type="button" id="openValidation">Validation</button>' : "",
      capabilities.share ? '<button class="button" type="button" id="shareSEC">Share</button>' : "",
      capabilities.print ? '<button class="button" type="button" id="exportSEC">Export / Print PDF</button>' : "",
      capabilities.note ? '<button class="button" type="button" id="addNote">Add Note</button>' : "",
      capabilities.history ? '<a class="button" id="viewHistory" href="records.html?from=preserved-sec">View History</a>' : ""
    ].join("");
  }

  window.SCZN3SEC = Object.freeze({
    escapeHtml,
    metric,
    marker,
    vector,
    verifyCalculationChain,
    EvidenceCard,
    ShooterAnalysisCard,
    SightCorrectionCard,
    RecommendationCard,
    ExecutionCard,
    ValidationCard,
    PreservationCard
  });
})();
