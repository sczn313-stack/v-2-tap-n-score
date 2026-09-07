(function (global) {
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
    const directionalRelease = global.SCZN3PlatformContracts.directionalAuthorityRelease(authorityPackage);
    return {
      summary: `${Number(status.impactCount || 0)} confirmed impacts established the initial group. SCZN3 calculated the correction from that group's POIB to the confirmed aim point.`,
      sourceIds: lineage.sourceShotIds || [],
      overlay(render = authorityPackage.renderCoordinates || {}) {
        const impacts = Array.isArray(render.impacts) ? render.impacts : [];
        return (directionalRelease.releasable ? vector(render.vector) : "") +
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

  function ZeroingCorrection(model = {}) {
    const axes = Array.isArray(model.axes) ? model.axes : [];
    const axisHtml = axes.map(axis => {
      if (!axis || !axis.label || !axis.direction) return "";
      return `<div class="sec-sight-correction-axis"><span>${escapeHtml(axis.label)}</span><strong>${escapeHtml(axis.direction)}</strong>${axis.supporting ? `<small>${escapeHtml(axis.supporting)}</small>` : ""}</div>`;
    }).join("");
    if (!axisHtml) return "";
    return `<div class="sec-sight-correction-story"><div class="sec-sight-correction-system"><span>Adjustment system</span><strong>${escapeHtml(model.systemLabel || "Recorded sight setup")}</strong></div><div class="sec-sight-correction-grid">${axisHtml}</div></div>`;
  }

  function SightCorrectionCard(authorityPackage) {
    const correction = authorityPackage.correction || {};
    const angular = authorityPackage.angular || {};
    const clicks = authorityPackage.clicks || {};
    const adjustment = clicks.model || {};
    const mechanical = authorityPackage.mechanicalValidation || {};
    const integrity = verifyCalculationChain(authorityPackage);
    const directionalRelease = global.SCZN3PlatformContracts.directionalAuthorityRelease(authorityPackage);
    const unit = String(adjustment.unit || "MOA").toUpperCase();
    if (!directionalRelease.releasable || mechanical.status !== "calculated" || integrity.status !== "reconciled") {
      const guidance = global.SCZN3Presentation
        ? global.SCZN3Presentation.sightCorrectionGuidance({ integrityStatus: integrity.status })
        : "Your target and group measurement are saved. Review your sight setup in Equipment to receive Sight Correction.";
      return `<div class="sec-sight-correction-unavailable"><span>Sight Correction</span><strong>${escapeHtml(guidance)}</strong></div>`;
    }
    const axisModel = axis => {
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
      return { label, direction, supporting };
    };
    return ZeroingCorrection({
      systemLabel: adjustment.label || "Recorded sight setup",
      axes: [axisModel("elevation"), axisModel("windage")]
    });
  }

  function RecommendationCard(authorityPackage) {
    const correction = authorityPackage.correction || {};
    const angular = authorityPackage.angular || {};
    const mechanical = authorityPackage.mechanicalValidation || {};
    const integrity = verifyCalculationChain(authorityPackage);
    const directionalRelease = global.SCZN3PlatformContracts.directionalAuthorityRelease(authorityPackage);
    const instruction = directionalRelease.releasable && mechanical.status === "calculated" && integrity.status === "reconciled"
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
        if (!directionalRelease.releasable || !trace || integrity.status !== "reconciled") {
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
    const directionalRelease = global.SCZN3PlatformContracts.directionalAuthorityRelease(authorityPackage);
    if (!directionalRelease.releasable || mechanical.status !== "calculated" || integrity.status !== "reconciled") {
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
      capabilities.save ? '<button class="button primary" type="button" id="saveSEC" data-sczn3-action="save">Save SEC</button>' : "",
      capabilities.validation ? '<button class="button" type="button" id="openValidation">Validation</button>' : "",
      capabilities.share ? '<button class="button" type="button" id="shareSEC" data-sczn3-action="share">Share</button>' : "",
      capabilities.print ? '<button class="button" type="button" id="exportSEC" data-sczn3-action="export">Export / Print PDF</button>' : "",
      capabilities.note ? '<button class="button" type="button" id="addNote" data-sczn3-action="note">Add Note</button>' : "",
      capabilities.history ? '<a class="button" id="viewHistory" href="records.html?from=preserved-sec" data-sczn3-action="history">Ballistic Vault</a>' : ""
    ].join("");
  }

  const SEMANTIC_ORDER = Object.freeze([
    "evidence",
    "measurement",
    "recommendation",
    "execution",
    "validation",
    "preservation"
  ]);
  const RESULT_FAMILIES = Object.freeze([
    "zeroing-correction",
    "highest-score-wins",
    "lowest-score-wins",
    "qualification-pass-fail"
  ]);
  const ACTION_NAMES = Object.freeze(["save", "share", "export", "note", "note-save", "history", "session-details"]);

  function semanticPresentation(stage, model = {}) {
    if (!SEMANTIC_ORDER.includes(stage)) return "";
    const contentHtml = typeof model.contentHtml === "string" ? model.contentHtml : "";
    if (!contentHtml.trim()) return "";
    const className = typeof model.className === "string" && model.className.trim()
      ? ` ${escapeHtml(model.className.trim())}`
      : "";
    return `<div class="sec-component sec-component-${stage}${className}" data-sec-component="${stage}">${contentHtml}</div>`;
  }

  function Result(model = {}) {
    const family = String(model.family || "").trim();
    const contentHtml = typeof model.contentHtml === "string" ? model.contentHtml : "";
    if (!RESULT_FAMILIES.includes(family) || !contentHtml.trim()) return "";
    const className = typeof model.className === "string" && model.className.trim()
      ? ` ${escapeHtml(model.className.trim())}`
      : "";
    return `<div class="sec-component sec-component-result${className}" data-sec-component="result" data-result-family="${escapeHtml(family)}">${contentHtml}</div>`;
  }

  function LowestScoreWinsPanel(model = {}) {
    const metrics = Array.isArray(model.metrics) ? model.metrics.map(metric => ({
      label: String(metric && metric.label || "").trim(),
      value: String(metric && metric.value || "").trim()
    })).filter(metric => metric.label && metric.value).slice(0, 4) : [];
    if (!metrics.length) return "";
    const ariaLabel = String(model.ariaLabel || "Lowest score wins analysis").trim();
    return `<div class="vault-target-panel vault-scoring-panel" data-lowest-score-wins-presentation="platform-v1" aria-label="${escapeHtml(ariaLabel)}">${metrics.map(metric => `<span><b>${escapeHtml(metric.label)}</b><strong>${escapeHtml(metric.value)}</strong></span>`).join("")}</div>`;
  }

  function SessionDetails(model = {}) {
    const fields = Array.isArray(model.fields) ? model.fields : [];
    const rows = fields.map(field => {
      const label = String(field && field.label || "").trim();
      if (!label) return "";
      const id = String(field && field.id || "").trim();
      const value = field && field.value !== undefined && field.value !== null ? String(field.value) : "";
      if (!value && model.includeEmpty !== true && !id) return "";
      return `<div><span>${escapeHtml(label)}</span><strong${id ? ` id="${escapeHtml(id)}"` : ""}>${escapeHtml(value)}</strong></div>`;
    }).join("");
    const heading = String(model.heading || "Session Details").trim() || "Session Details";
    const headingId = String(model.headingId || "").trim();
    const afterHtml = typeof model.afterHtml === "string" ? model.afterHtml : "";
    return `<section class="sec-session-section"${headingId ? ` aria-labelledby="${escapeHtml(headingId)}"` : ""}><h3${headingId ? ` id="${escapeHtml(headingId)}"` : ""}>${escapeHtml(heading)}</h3><div class="sec-session-record-fields">${rows}</div></section>${afterHtml}`;
  }

  function ActionBar(model = {}) {
    const actions = Array.isArray(model.actions) ? model.actions : [];
    const controls = actions.map(action => {
      if (!action || !action.label) return "";
      const tag = action.href ? "a" : "button";
      const attributes = action.attributes && typeof action.attributes === "object"
        ? Object.entries(action.attributes)
          .filter(([name, value]) => /^(?:data|aria)-[a-z0-9-]+$/.test(name) && value !== false && value !== null && value !== undefined)
          .map(([name, value]) => value === true ? name : `${name}="${escapeHtml(value)}"`)
          .join(" ")
        : "";
      const id = action.id ? ` id="${escapeHtml(action.id)}"` : "";
      const governedAction = ACTION_NAMES.includes(String(action.action || "").trim().toLowerCase())
        ? ` data-sczn3-action="${escapeHtml(String(action.action).trim().toLowerCase())}"`
        : "";
      const classes = ["button", action.primary ? "primary" : "", action.className || ""].filter(Boolean).join(" ");
      if (tag === "a") return `<a class="${escapeHtml(classes)}"${id} href="${escapeHtml(action.href)}"${governedAction}${attributes ? ` ${attributes}` : ""}>${escapeHtml(action.label)}</a>`;
      return `<button class="${escapeHtml(classes)}"${id} type="button"${action.disabled ? " disabled" : ""}${governedAction}${attributes ? ` ${attributes}` : ""}>${escapeHtml(action.label)}</button>`;
    }).join("");
    const afterHtml = typeof model.afterHtml === "string" ? model.afterHtml : "";
    return `<div class="sec-preservation-actions" data-sczn3-action-region="platform-v1">${controls}</div>${afterHtml}`;
  }

  const Evidence = model => semanticPresentation("evidence", model);
  const Measurement = model => semanticPresentation("measurement", model);
  const Recommendation = model => semanticPresentation("recommendation", model);
  const Execution = model => semanticPresentation("execution", model);
  const Validation = model => semanticPresentation("validation", model);
  const Preservation = model => semanticPresentation("preservation", model);

  window.SCZN3SECComponents = Object.freeze({
    escapeHtml,
    metric,
    marker,
    vector,
    verifyCalculationChain,
    EvidenceCard,
    ShooterAnalysisCard,
    ZeroingCorrection,
    SightCorrectionCard,
    RecommendationCard,
    ExecutionCard,
    ValidationCard,
    PreservationCard,
    semanticOrder: SEMANTIC_ORDER,
    resultFamilies: RESULT_FAMILIES,
    Evidence,
    Measurement,
    Result,
    LowestScoreWinsPanel,
    Recommendation,
    Execution,
    Validation,
    Preservation,
    SessionDetails,
    ActionBar
  });
})(window);
