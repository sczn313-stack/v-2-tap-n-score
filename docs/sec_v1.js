(function (global) {
  "use strict";

  const VERSION = "1.1";
  const REQUIRED_REGIONS = ["result", "evidence", "experience", "nextStep", "session", "identity"];
  const ACHIEVEMENT_LEVELS = Object.freeze([
    Object.freeze(["needs-attention", "Needs Attention"]),
    Object.freeze(["developing", "Developing"]),
    Object.freeze(["improving", "Improving"]),
    Object.freeze(["proficient", "Proficient"]),
    Object.freeze(["advanced", "Advanced"]),
    Object.freeze(["mastery", "Mastery"])
  ]);

  function escapeAttribute(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function validText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function normalizeRegion(region, key) {
    if (!region || region.key !== key || !validText(region.contentHtml)) return null;
    return {
      key,
      className: validText(region.className) ? region.className.trim() : "",
      ariaLabel: validText(region.ariaLabel) ? region.ariaLabel.trim() : key,
      contentHtml: region.contentHtml
    };
  }

  function normalizeModel(model) {
    if (!model || model.schemaVersion !== VERSION) return null;
    if (!validText(model.recordId) || !validText(model.missionFamily)) return null;
    if (!Array.isArray(model.regions) || model.regions.length !== REQUIRED_REGIONS.length) return null;

    const regions = REQUIRED_REGIONS.map((key, index) => normalizeRegion(model.regions[index], key));
    if (regions.some(region => !region)) return null;

    return {
      recordId: model.recordId.trim(),
      missionFamily: model.missionFamily.trim(),
      articleClassName: validText(model.articleClassName) ? model.articleClassName.trim() : "",
      articleAttributes: model.articleAttributes && typeof model.articleAttributes === "object"
        ? Object.entries(model.articleAttributes).filter(([name, value]) => /^(?:data|aria)-[a-z0-9-]+$/.test(name) && value !== undefined && value !== null)
        : [],
      regions,
      afterHtml: typeof model.afterHtml === "string" ? model.afterHtml : ""
    };
  }

  function render(model) {
    const normalized = normalizeModel(model);
    if (!normalized) return renderUnavailable("Result unavailable");

    const classes = ["sec-v1", normalized.articleClassName].filter(Boolean).join(" ");
    const attributes = normalized.articleAttributes
      .map(([name, value]) => `${name}="${escapeAttribute(value)}"`)
      .join(" ");
    const regions = normalized.regions.map(region => {
      const regionClasses = ["sec-v1-region", `sec-v1-${region.key}`, region.className].filter(Boolean).join(" ");
      return `<section class="${escapeAttribute(regionClasses)}" data-sec-region="${escapeAttribute(region.key)}" aria-label="${escapeAttribute(region.ariaLabel)}">${region.contentHtml}</section>`;
    }).join("");

    return `
      <article class="${escapeAttribute(classes)}" data-sec-version="${VERSION}" data-sec-record-id="${escapeAttribute(normalized.recordId)}" data-sec-mission-family="${escapeAttribute(normalized.missionFamily)}"${attributes ? ` ${attributes}` : ""}>
        <div class="sec-v1-flow">${regions}</div>
        ${normalized.afterHtml}
      </article>
    `;
  }

  function renderUnavailable(message) {
    const safeMessage = validText(message) ? message.trim() : "Result unavailable";
    return `
      <article class="sec-v1 sec-v1-unavailable" data-sec-version="${VERSION}" role="status">
        <div class="sec-v1-unavailable-copy">${escapeAttribute(safeMessage)}</div>
      </article>
    `;
  }

  function renderAchievementScale(statusText = "Unavailable for this result") {
    const safeStatus = validText(statusText) ? statusText.trim() : "Unavailable for this result";
    return `
      <section class="sec-achievement" data-achievement-status="unavailable" aria-label="SCZN3 achievement scale">
        <div class="sec-achievement-heading">
          <span>Current Achievement</span>
          <strong>${escapeAttribute(safeStatus)}</strong>
        </div>
        <ol class="sec-achievement-scale">
          ${ACHIEVEMENT_LEVELS.map(([id, label]) => `
            <li class="achievement-${id}">
              <i aria-hidden="true"></i>
              <span>${label}</span>
            </li>
          `).join("")}
        </ol>
      </section>
    `;
  }

  global.SCZN3SEC = Object.freeze({
    version: VERSION,
    requiredRegions: Object.freeze(REQUIRED_REGIONS.slice()),
    achievementLevels: ACHIEVEMENT_LEVELS,
    render,
    renderUnavailable,
    renderAchievementScale
  });
})(window);
