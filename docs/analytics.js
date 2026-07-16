(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SCZN3Analytics = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const WINDOW_IDS = new Set(["today", "wtd", "mtd", "ytd", "all"]);
  const GSSF_ZONES = ["downZero", "plusOne", "plusThree", "miss"];

  function actualFiniteNumber(value, options = {}) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    if (options.integer && !Number.isInteger(value)) return null;
    if (options.nonnegative && value < 0) return null;
    return value;
  }

  function nonemptyString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function authorityPackage(session) {
    if (!session || typeof session !== "object") return null;
    const pkg = session.backendAuthorityPackage || session.ugeoAuthorityPackage || null;
    return pkg && typeof pkg === "object" ? pkg : null;
  }

  function savedDate(session) {
    if (!session || typeof session !== "object") return null;
    const source = nonemptyString(session.savedAt) || nonemptyString(session.timestamp);
    if (!source) return null;
    const date = new Date(source);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function windowStart(windowId, now = new Date()) {
    const id = WINDOW_IDS.has(windowId) ? windowId : "all";
    if (id === "all") return null;
    if (id === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (id === "mtd") return new Date(now.getFullYear(), now.getMonth(), 1);
    if (id === "ytd") return new Date(now.getFullYear(), 0, 1);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    return start;
  }

  function dateInWindow(date, windowId, now = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
    if (date.getTime() > now.getTime()) return false;
    const start = windowStart(windowId, now);
    return !start || date.getTime() >= start.getTime();
  }

  function isStrictGssfPackage(pkg) {
    if (!pkg || typeof pkg !== "object") return false;
    if (pkg.ok !== true || pkg.status !== "calculated") return false;
    if (pkg.target_profile_id !== "gssf_ac_1" || pkg.mission_family !== "gssf") return false;
    if (!nonemptyString(pkg.targetProfileVersion)) return false;
    if (pkg.resultPackageType !== "gssfPaperPenaltyResult" || pkg.resultSource !== "backend") return false;
    if (actualFiniteNumber(pkg.totalPaperPenaltySeconds, { nonnegative: true }) === null) return false;
    if (!Array.isArray(pkg.scoringBreakdown) || pkg.scoringBreakdown.length !== 4) return false;
    const expected = new Set(GSSF_ZONES);
    const zones = new Set();
    const shotIds = new Set();
    for (const bucket of pkg.scoringBreakdown) {
      if (!bucket || typeof bucket !== "object" || !expected.has(bucket.zone) || zones.has(bucket.zone)) return false;
      const count = actualFiniteNumber(bucket.count, { integer: true, nonnegative: true });
      const multiplier = actualFiniteNumber(bucket.penaltySecondsPerHit, { nonnegative: true });
      const subtotal = actualFiniteNumber(bucket.subtotalPenaltySeconds, { nonnegative: true });
      if (count === null || multiplier === null || subtotal === null || !Array.isArray(bucket.shotIds) || bucket.shotIds.length !== count) return false;
      for (const shotId of bucket.shotIds) {
        if (actualFiniteNumber(shotId, { integer: true, nonnegative: true }) === null || shotId < 1 || shotIds.has(shotId)) return false;
        shotIds.add(shotId);
      }
      zones.add(bucket.zone);
    }
    return zones.size === expected.size;
  }

  function isZeroingPackage(pkg) {
    if (!pkg || typeof pkg !== "object") return false;
    const mission = pkg.mission_family || pkg.missionFamilyId;
    if (mission !== "zeroingCorrection") return false;
    if (!nonemptyString(pkg.target_profile_id || pkg.targetProfileId)) return false;
    if (!nonemptyString(pkg.authorityVersion) || !nonemptyString(pkg.evidenceHash)) return false;
    if (!pkg.status || typeof pkg.status !== "object") return false;
    const impactCount = actualFiniteNumber(pkg.status.impactCount, { integer: true, nonnegative: true });
    if (impactCount === null || !Array.isArray(pkg.impacts) || pkg.impacts.length !== impactCount) return false;
    return true;
  }

  function trainingManualResult(session, pkg) {
    const sec = pkg && pkg.trainingSEC && typeof pkg.trainingSEC === "object" ? pkg.trainingSEC : {};
    const value = session && session.trainingManualResult || pkg && pkg.trainingManualResult || sec.manualResult || null;
    return value && typeof value === "object" ? value : null;
  }

  function isTrainingPackage(session, pkg) {
    if (!pkg || typeof pkg !== "object") return false;
    const mission = pkg.mission_family || pkg.missionFamilyId;
    if (mission !== "marksmanshipTraining" || pkg.resultPackageType !== "marksmanshipTrainingResult") return false;
    if (!nonemptyString(pkg.target_profile_id || pkg.targetProfileId) || !nonemptyString(pkg.authorityVersion)) return false;
    const manual = trainingManualResult(session, pkg);
    if (!manual || manual.status !== "manual" || manual.source !== "manual") return false;
    const score = actualFiniteNumber(manual.score, { nonnegative: true });
    const max = actualFiniteNumber(manual.maxScore, { nonnegative: true });
    const percentage = actualFiniteNumber(manual.percentage, { nonnegative: true });
    return score !== null && max !== null && max > 0 && score <= max && percentage !== null;
  }

  function missionFamily(pkg) {
    return nonemptyString(pkg && (pkg.mission_family || pkg.missionFamilyId || pkg.missionFamily));
  }

  function eligibleRecord(session) {
    if (!session || session.savedToSEC !== true) return null;
    const date = savedDate(session);
    const pkg = authorityPackage(session);
    if (!date || !pkg) return null;
    if (isStrictGssfPackage(pkg)) {
      const shotCount = pkg.scoringBreakdown.reduce((sum, bucket) => sum + bucket.count, 0);
      return { session, pkg, date, mission: "gssf", shotCount };
    }
    if (isZeroingPackage(pkg)) {
      return { session, pkg, date, mission: "zeroing", shotCount: pkg.status.impactCount };
    }
    if (isTrainingPackage(session, pkg)) {
      return { session, pkg, date, mission: "training", shotCount: null };
    }
    return null;
  }

  function localDayKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function analyzeSessions(sessions, windowId = "all", now = new Date()) {
    const source = Array.isArray(sessions) ? sessions : [];
    const savedInWindow = source.filter(session => session && session.savedToSEC === true && dateInWindow(savedDate(session), windowId, now));
    const records = savedInWindow.map(eligibleRecord).filter(Boolean).sort((a, b) => a.date - b.date);
    const days = new Set(records.map(record => localDayKey(record.date)));
    const shotRecords = records.filter(record => record.shotCount !== null);
    return {
      windowId: WINDOW_IDS.has(windowId) ? windowId : "all",
      records,
      shootingDays: days.size,
      completedSessions: records.length,
      authoritativeShots: shotRecords.length ? shotRecords.reduce((sum, record) => sum + record.shotCount, 0) : null,
      authoritativeShotSessionCount: shotRecords.length,
      unavailableRecords: savedInWindow.length - records.length,
      byMission: {
        gssf: records.filter(record => record.mission === "gssf"),
        zeroing: records.filter(record => record.mission === "zeroing"),
        training: records.filter(record => record.mission === "training")
      }
    };
  }

  function commonIdentity(pkg) {
    const mission = missionFamily(pkg);
    const targetId = nonemptyString(pkg && (pkg.target_profile_id || pkg.targetProfileId));
    const targetVersion = nonemptyString(pkg && pkg.targetProfileVersion);
    const resultType = nonemptyString(pkg && pkg.resultPackageType);
    const authorityVersion = nonemptyString(pkg && pkg.authorityVersion);
    if (!mission || !targetId || !targetVersion || !resultType || !authorityVersion) return null;
    return [mission, targetId, targetVersion, resultType, authorityVersion];
  }

  function zeroingSetupIdentity(session, pkg) {
    const common = commonIdentity(pkg);
    if (!common) return null;
    const matrix = session && session.matrixSnapshot || {};
    const fields = [
      matrix.setupId,
      matrix.weaponCatalogManufacturer || matrix.weaponManufacturer,
      matrix.weaponCatalogModel || matrix.weaponModelCaliber || matrix.weaponModelType,
      matrix.weaponCatalogCaliber || matrix.ammoCaliber,
      matrix.opticType,
      matrix.opticBrand,
      matrix.opticModel,
      matrix.adjustmentUnit,
      matrix.clickValueMOA ?? matrix.clickValueMRAD,
      session.targetDistanceValue,
      session.targetDistanceUnit,
      pkg.group && pkg.group.method
    ];
    if (fields.some(value => value === undefined || value === null || value === "")) return null;
    return common.concat(fields.map(String)).join("|");
  }

  function compatibilityKey(record) {
    const { session, pkg, mission } = record;
    const common = commonIdentity(pkg);
    if (!common) return null;
    if (mission === "gssf") {
      const trace = pkg.authorityTrace || {};
      const fields = [
        trace.geometryProfileVersion,
        trace.scoringProfileVersion,
        trace.missionProfileVersion,
        trace.targetExecutionContractId
      ];
      if (fields.some(value => !nonemptyString(value))) return null;
      return common.concat(fields).join("|");
    }
    if (mission === "zeroing") return zeroingSetupIdentity(session, pkg);
    const manual = trainingManualResult(session, pkg);
    const fields = [
      pkg.mission_name || pkg.missionName,
      pkg.mission_variant || pkg.missionVariant,
      manual && manual.maxScore,
      pkg.recommended_distance && JSON.stringify(pkg.recommended_distance)
    ];
    if (fields.some(value => value === undefined || value === null || value === "")) return null;
    return common.concat(fields.map(String)).join("|");
  }

  function comparableRecords(records) {
    const keyed = records.map(record => ({ record, key: compatibilityKey(record) })).filter(item => item.key);
    if (!keyed.length) return { records: [], excluded: records.length, key: null };
    const activeKey = keyed[keyed.length - 1].key;
    const compatible = keyed.filter(item => item.key === activeKey).map(item => item.record);
    return { records: compatible, excluded: records.length - compatible.length, key: activeKey };
  }

  function gssfAnalytics(records) {
    const group = comparableRecords(records);
    const buckets = Object.fromEntries(GSSF_ZONES.map(zone => [zone, 0]));
    const points = group.records.map(record => {
      record.pkg.scoringBreakdown.forEach(bucket => { buckets[bucket.zone] += bucket.count; });
      const pkg = record.pkg;
      const finalTime = pkg.finalTimeStatus === "calculated"
        && actualFiniteNumber(pkg.rawTimeSeconds, { nonnegative: true }) !== null
        && actualFiniteNumber(pkg.finalTimeSeconds, { nonnegative: true }) !== null
        ? pkg.finalTimeSeconds
        : null;
      return {
        date: record.date,
        paperPenalty: pkg.totalPaperPenaltySeconds,
        finalTime
      };
    });
    return { ...group, points, buckets, missingFinalTime: points.filter(point => point.finalTime === null).length };
  }

  function zeroingAnalytics(records) {
    const group = comparableRecords(records);
    const points = group.records.map(record => {
      const value = record.pkg.group && record.pkg.group.status === "calculated"
        ? actualFiniteNumber(record.pkg.group.valueMOA, { nonnegative: true })
        : null;
      return { date: record.date, valueMOA: value };
    }).filter(point => point.valueMOA !== null);
    return { ...group, points };
  }

  function trainingAnalytics(records) {
    const group = comparableRecords(records);
    const points = group.records.map(record => {
      const manual = trainingManualResult(record.session, record.pkg);
      return { date: record.date, score: manual.score, maxScore: manual.maxScore, percentage: manual.percentage };
    });
    return { ...group, points };
  }

  function formatDate(date) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatNumber(value, digits = 2) {
    if (value === null) return "Unavailable";
    const rounded = Number(value.toFixed(digits));
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits);
  }

  function trendRows(points, valueKey, suffix) {
    if (!points.length) return `<div class="analytics-unavailable">Not enough comparable sessions yet.</div>`;
    const values = points.map(point => point[valueKey]).filter(value => value !== null);
    const max = Math.max(1, ...values);
    return `<div class="analytics-trend-list">${points.map(point => {
      const value = point[valueKey];
      const width = value === null ? 0 : Math.max(4, Math.round((value / max) * 100));
      return `<div class="analytics-trend-row">
        <span>${escapeHtml(formatDate(point.date))}</span>
        <div class="analytics-trend-track"><i style="width:${width}%"></i></div>
        <strong>${value === null ? "Unavailable" : `${escapeHtml(formatNumber(value))}${suffix}`}</strong>
      </div>`;
    }).join("")}</div>`;
  }

  function missionPanelHtml(analysis, mission) {
    const records = analysis.byMission[mission] || [];
    if (!records.length) return `<div class="analytics-unavailable"><strong>No eligible ${escapeHtml(mission)} sessions in this window.</strong><span>Missing or incompatible authority is never converted into a result.</span></div>`;
    if (mission === "gssf") {
      const data = gssfAnalytics(records);
      if (!data.records.length) return `<div class="analytics-unavailable"><strong>GSSF comparison unavailable.</strong><span>Required target or authority version context is missing.</span></div>`;
      const labels = { downZero: "Down Zero", plusOne: "+1", plusThree: "+3", miss: "Miss" };
      return `<div class="analytics-mission-story">
        <div class="analytics-story-heading"><div><span>GSSF</span><h2>Paper Penalty</h2></div><small>${data.records.length} comparable session${data.records.length === 1 ? "" : "s"}</small></div>
        ${trendRows(data.points, "paperPenalty", " sec")}
        <section class="analytics-bucket-summary" aria-label="Governed GSSF bucket distribution">
          ${GSSF_ZONES.map(zone => `<div data-zone="${zone}"><span>${labels[zone]}</span><strong>${data.buckets[zone]}</strong><small>authoritative hits</small></div>`).join("")}
        </section>
        <div class="analytics-secondary-story"><h3>Final Time</h3>${trendRows(data.points, "finalTime", " sec")}</div>
        ${data.missingFinalTime ? `<p class="analytics-truth-note">Final Time unavailable for ${data.missingFinalTime} session${data.missingFinalTime === 1 ? "" : "s"} without timer authority.</p>` : ""}
        ${data.excluded ? `<p class="analytics-truth-note">${data.excluded} session${data.excluded === 1 ? " was" : "s were"} excluded because the comparison context differed or was incomplete.</p>` : ""}
      </div>`;
    }
    if (mission === "zeroing") {
      const data = zeroingAnalytics(records);
      if (!data.records.length || !data.points.length) return `<div class="analytics-unavailable"><strong>Zeroing comparison unavailable.</strong><span>Comparable firearm, optic, distance, target, unit, and authority context is required.</span></div>`;
      return `<div class="analytics-mission-story"><div class="analytics-story-heading"><div><span>Zeroing</span><h2>Group Size</h2></div><small>Same governed setup</small></div>${trendRows(data.points, "valueMOA", " MOA")}</div>`;
    }
    const data = trainingAnalytics(records);
    if (!data.records.length) return `<div class="analytics-unavailable"><strong>Training comparison unavailable.</strong><span>The same governed mission, target version, and maximum score are required.</span></div>`;
    const points = data.points.map(point => ({ ...point, displayScore: point.percentage }));
    return `<div class="analytics-mission-story"><div class="analytics-story-heading"><div><span>Training</span><h2>Saved Score Progress</h2></div><small>Same mission and version</small></div>${trendRows(points, "displayScore", "%")}</div>`;
  }

  function renderAnalyticsPage(options = {}) {
    if (typeof document === "undefined") return;
    const history = options.sessions || (globalThis.SCZN3M4 && SCZN3M4.getSessionHistory ? SCZN3M4.getSessionHistory() : []);
    const now = options.now || new Date();
    let activeWindow = "all";
    let activeMission = "gssf";
    const summary = document.getElementById("analyticsSummary");
    const missionPanel = document.getElementById("analyticsMissionPanel");
    const unavailable = document.getElementById("analyticsUnavailableCount");

    function render() {
      const analysis = analyzeSessions(history, activeWindow, now);
      if (summary) summary.innerHTML = `
        <article><span>Shooting Days</span><strong>${analysis.shootingDays}</strong></article>
        <article><span>Completed Sessions</span><strong>${analysis.completedSessions}</strong></article>
        <article><span>Authoritative Shots Recorded</span><strong>${analysis.authoritativeShots === null ? "—" : analysis.authoritativeShots}</strong><small>${analysis.authoritativeShots === null ? "Unavailable" : `From ${analysis.authoritativeShotSessionCount} eligible session${analysis.authoritativeShotSessionCount === 1 ? "" : "s"}`}</small></article>`;
      if (unavailable) {
        unavailable.hidden = analysis.unavailableRecords === 0;
        unavailable.textContent = analysis.unavailableRecords ? `${analysis.unavailableRecords} saved record${analysis.unavailableRecords === 1 ? " is" : "s are"} unavailable because required authority or completion data is incomplete.` : "";
      }
      if (missionPanel) missionPanel.innerHTML = missionPanelHtml(analysis, activeMission);
    }

    document.querySelectorAll("[data-analytics-window]").forEach(button => button.addEventListener("click", () => {
      activeWindow = button.dataset.analyticsWindow;
      document.querySelectorAll("[data-analytics-window]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      render();
    }));
    document.querySelectorAll("[data-analytics-mission]").forEach(button => button.addEventListener("click", () => {
      activeMission = button.dataset.analyticsMission;
      document.querySelectorAll("[data-analytics-mission]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      render();
    }));
    const timezone = document.getElementById("analyticsTimezone");
    if (timezone) timezone.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || "Device time";
    render();
  }

  function governedEvidenceUrl(session, record) {
    const evidence = session && session.targetEvidenceImage;
    if (!record || !evidence || typeof evidence.dataUrl !== "string") return null;
    const url = evidence.dataUrl.trim();
    const isEmbeddedImage = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(url);
    if (evidence.evidenceType === "uploaded-target-image") return isEmbeddedImage ? url : null;
    if (record.mission !== "gssf") return null;
    const canonical = record.pkg.canonicalAsset || {};
    const trace = record.pkg.authorityTrace || {};
    const isApprovedCanonicalUrl = url === "assets/gssf_ac_1_clean_reference.png";
    return evidence.assetRole === "scorable_canonical_asset"
      && (isEmbeddedImage || isApprovedCanonicalUrl)
      && evidence.canonicalAssetId === canonical.canonicalAssetId
      && evidence.canonicalAssetSha256 === canonical.canonicalAssetSha256
      && evidence.registrationPackageId === trace.registrationPackageId
      ? url
      : null;
  }

  function recordResult(record) {
    if (record.mission === "gssf") {
      const pkg = record.pkg;
      const finalTime = pkg.finalTimeStatus === "calculated"
        && actualFiniteNumber(pkg.rawTimeSeconds, { nonnegative: true }) !== null
        && actualFiniteNumber(pkg.finalTimeSeconds, { nonnegative: true }) !== null
        ? pkg.finalTimeSeconds
        : null;
      return finalTime === null ? `${formatNumber(pkg.totalPaperPenaltySeconds)} sec Paper Penalty` : `${formatNumber(finalTime)} sec Final Time`;
    }
    if (record.mission === "zeroing") {
      const moa = record.pkg.group && record.pkg.group.status === "calculated" ? actualFiniteNumber(record.pkg.group.valueMOA, { nonnegative: true }) : null;
      return moa === null ? "Result unavailable" : `${formatNumber(moa)} MOA Group`;
    }
    const manual = trainingManualResult(record.session, record.pkg);
    return manual ? `${formatNumber(manual.score, 0)} / ${formatNumber(manual.maxScore, 0)} Saved Score` : "Result unavailable";
  }

  function renderHomePreview(options = {}) {
    if (typeof document === "undefined") return;
    const history = options.sessions || (globalThis.SCZN3M4 && SCZN3M4.getSessionHistory ? SCZN3M4.getSessionHistory() : []);
    const analysis = analyzeSessions(history, "all", options.now || new Date());
    document.querySelectorAll("[data-home-metric]").forEach(node => {
      const value = node.dataset.homeMetric === "shootingDays" ? analysis.shootingDays : analysis.completedSessions;
      node.textContent = String(value);
    });
    const list = document.querySelector("[data-recent-sec-list]");
    if (!list) return;
    const recentSaved = history.filter(session => session && session.savedToSEC === true).slice(0, 3);
    if (!recentSaved.length) {
      list.innerHTML = `<article class="range-day-card range-day-empty"><strong>No SEC saved yet.</strong><span class="range-day-date">Saved cards will appear here.</span></article>`;
      return;
    }
    list.innerHTML = recentSaved.map(session => {
      const record = eligibleRecord(session);
      const date = savedDate(session);
      const matrix = session.matrixSnapshot || {};
      const profile = globalThis.SCZN3M4 && SCZN3M4.weaponProfileDisplay ? SCZN3M4.weaponProfileDisplay(matrix) : null;
      const title = profile ? profile.short : "Saved Session";
      const evidence = governedEvidenceUrl(session, record);
      return `<article class="range-day-card">
        ${evidence ? `<img src="${escapeHtml(evidence)}" alt="Governed saved target evidence" />` : `<div class="range-day-evidence-unavailable" role="status">Target image unavailable</div>`}
        <span class="range-day-date">${date ? escapeHtml(date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })) : "Date unavailable"}</span>
        <strong>${escapeHtml(title)}</strong>
        <div class="range-day-result"><span>${record ? escapeHtml(recordResult(record)) : "Result unavailable"}</span></div>
      </article>`;
    }).join("");
  }

  return {
    actualFiniteNumber,
    savedDate,
    windowStart,
    dateInWindow,
    isStrictGssfPackage,
    isZeroingPackage,
    isTrainingPackage,
    eligibleRecord,
    compatibilityKey,
    comparableRecords,
    analyzeSessions,
    gssfAnalytics,
    zeroingAnalytics,
    trainingAnalytics,
    governedEvidenceUrl,
    recordResult,
    renderAnalyticsPage,
    renderHomePreview
  };
});
