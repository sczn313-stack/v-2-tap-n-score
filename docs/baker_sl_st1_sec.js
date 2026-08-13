(function (global) {
  "use strict";

  const TARGET_ID = "BAKER_SL_ST1";
  const VARIANT_ID = "BAKER_SL_ST1_23X35_STANDARD_WHITE";
  const MISSION_FAMILY = "smartEvidenceCapture";
  const RESULT_PACKAGE_TYPE = "smartEvidenceResult";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clean(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  function targetIdentity(pkg) {
    return clean(pkg && pkg.target && pkg.target.smartTargetId).toUpperCase();
  }

  function matches(pkg) {
    return !!(
      pkg
      && pkg.ok === true
      && pkg.status === "supported_analysis_ready"
      && (pkg.missionFamily === MISSION_FAMILY || pkg.mission_family === MISSION_FAMILY)
      && pkg.resultPackageType === RESULT_PACKAGE_TYPE
      && targetIdentity(pkg) === TARGET_ID
      && pkg.target.variantId === VARIANT_ID
    );
  }

  function impactCount(pkg) {
    const count = Number(pkg && pkg.supportedAnalysis && pkg.supportedAnalysis.impactCount);
    const impacts = Array.isArray(pkg && pkg.impacts) ? pkg.impacts : [];
    return Number.isInteger(count) && count >= 0 && count === impacts.length ? count : null;
  }

  function impactLabel(count) {
    return `${count} ${count === 1 ? "Impact" : "Impacts"}`;
  }

  function displayDateTime(session) {
    const raw = clean(session && (session.preservedAt || session.createdAt || session.timestamp));
    const date = raw ? new Date(raw) : null;
    if (!date || Number.isNaN(date.getTime())) return null;
    return {
      date: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    };
  }

  function sessionValues(session) {
    const snapshot = session && session.matrixSnapshot || {};
    const firearm = [
      clean(snapshot.weaponManufacturer),
      clean(snapshot.weaponModelType || snapshot.rifle),
      clean(snapshot.weaponModelCaliber)
    ].filter(Boolean).join(" · ");
    const equipment = [
      clean(snapshot.opticBrand),
      clean(snapshot.opticModel || snapshot.opticType)
    ].filter(Boolean).join(" · ");
    const ammunition = [
      clean(snapshot.ammoManufacturer),
      clean(snapshot.ammoLoad || snapshot.ammoCaliber),
      clean(snapshot.bulletWeight)
    ].filter(Boolean).join(" · ");
    const distanceValue = clean(snapshot.targetDistanceValue || session && session.targetDistanceValue);
    const distanceUnit = clean(snapshot.targetDistanceUnit || session && session.targetDistanceUnit);
    const distance = distanceValue ? `${distanceValue}${distanceUnit ? ` ${distanceUnit}` : ""}` : "";
    return {
      firearm,
      equipment,
      ammunition,
      distance,
      shooter: clean(snapshot.shooterName),
      dateTime: displayDateTime(session)
    };
  }

  function missingOptionalDetails(session) {
    const values = sessionValues(session);
    return [
      ["firearm", "Firearm", values.firearm],
      ["ammunition", "Ammunition", values.ammunition],
      ["distance", "Distance", values.distance],
      ["shooter", "Shooter", values.shooter]
    ].filter(([, , value]) => !value).map(([key, label]) => ({ key, label }));
  }

  function sessionDetailsHtml(session) {
    const values = sessionValues(session);
    const rows = [
      ["Firearm", values.firearm],
      ["Equipment", values.equipment],
      ["Ammunition", values.ammunition],
      ["Distance", values.distance],
      ["Date", values.dateTime && values.dateTime.date],
      ["Time", values.dateTime && values.dateTime.time],
      ["Shooter", values.shooter]
    ].filter(([, value]) => value);
    return rows.map(([label, value]) => `<div><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  }

  function evidenceHtml(session, pkg) {
    const evidence = session && session.targetEvidenceImage || {};
    const imageUrl = clean(evidence.dataUrl);
    if (!imageUrl) return '<div class="sec-comparison-pending">Target photograph unavailable</div>';
    const markers = pkg.impacts.map((impact, index) => {
      const x = Math.max(0, Math.min(100, Number(impact.xNorm) * 100));
      const y = Math.max(0, Math.min(100, Number(impact.yNorm) * 100));
      return `<span class="sec-baker-impact-marker" style="left:${x}%;top:${y}%" aria-hidden="true">${index + 1}</span>`;
    }).join("");
    return `<div class="sec-baker-evidence-viewport"><div class="sec-baker-evidence-frame"><img src="${escapeHtml(imageUrl)}" alt="Baker Silhouette Target with recorded impacts" /><div class="sec-baker-impact-layer">${markers}</div></div></div>`;
  }

  function detailsInvitationHtml(session, mode, dismissed) {
    if (mode !== "live" || dismissed) return "";
    const missing = missingOptionalDetails(session);
    if (!missing.length) return "";
    const labels = missing.map(item => item.label.toLowerCase());
    const list = labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
    const inputs = missing.map(item => {
      const type = item.key === "distance" ? "text" : "text";
      return `<label>${escapeHtml(item.label)}<input type="${type}" name="${escapeHtml(item.key)}" autocomplete="off" /></label>`;
    }).join("");
    return `<aside class="sec-baker-details-invitation" data-baker-details-invitation>
      <p>Add ${escapeHtml(list)} to make this shooting record easier to remember.</p>
      <div class="sec-baker-details-invitation-actions"><button class="button" type="button" data-baker-add-details>Add Details</button><button class="button" type="button" data-baker-dismiss-details>Not Now</button></div>
      <form class="sec-baker-details-form" data-baker-details-form hidden>${inputs}<div><button class="button primary" type="submit">Save Details</button><button class="button" type="button" data-baker-cancel-details>Cancel</button></div></form>
    </aside>`;
  }

  function actionBarHtml(mode) {
    if (mode === "historical") {
      return `<div class="sec-preservation-actions"><button class="button" type="button" data-sec-export>Export SEC</button><button class="button" type="button" data-sec-share>Share SEC</button><a class="button primary" href="records.html">Back to Vault</a></div>`;
    }
    return `<div class="sec-preservation-actions"><button class="button primary" type="button" data-baker-save-sec>Save SEC</button><button class="button" type="button" data-sec-share>Share</button><button class="button" type="button" data-sec-export>Export / Print PDF</button><button class="button" type="button" data-baker-add-note>Add Note</button><a class="button" href="../../../records.html">View History</a></div>
      <div class="sec-note-editor" data-baker-note-editor hidden><label>Session note<textarea rows="3" data-baker-note></textarea></label><button class="button" type="button" data-baker-save-note>Save Note</button></div><span class="sec-action-status" data-baker-sec-status role="status" aria-live="polite"></span>`;
  }

  function render({ session = {}, package: pkg = null, mode = "live", detailsDismissed = false } = {}) {
    if (!global.SCZN3SEC || !matches(pkg)) {
      return global.SCZN3SEC ? global.SCZN3SEC.renderUnavailable("Results unavailable") : "";
    }
    const count = impactCount(pkg);
    if (count === null) return global.SCZN3SEC.renderUnavailable("Results unavailable");
    const label = impactLabel(count);
    return global.SCZN3SEC.render({
      schemaVersion: "1.2",
      recordId: clean(session.sessionId) || "baker-sl-st1-sec",
      missionFamily: "smartEvidenceCapture",
      sessionLabel: clean(session.sessionLabel) || "Session",
      scoreDisplay: label,
      articleClassName: "history-card baker-sl-st1-sec-card",
      articleAttributes: { "data-target-id": TARGET_ID, "data-sec-mode": mode },
      regions: [
        {
          key: "target",
          className: "sec-v1-evidence-content",
          ariaLabel: "Target",
          contentHtml: `<section class="sec-baker-target-evidence"><header><span>Baker Targets</span><strong>Silhouette Target (USPSA)</strong></header><figure>${evidenceHtml(session, pkg)}<figcaption>${escapeHtml(label)} recorded</figcaption></figure></section>`
        },
        {
          key: "session",
          className: "sec-v1-measurement-content",
          ariaLabel: "Session",
          contentHtml: `<section class="sec-baker-supported-result"><span>Recorded Impacts</span><strong>${escapeHtml(String(count))}</strong></section><section class="sec-session-section"><h3>Session Details</h3><div class="sec-session-record-fields">${sessionDetailsHtml(session)}</div></section>${detailsInvitationHtml(session, mode, detailsDismissed)}`
        },
        {
          key: "actions",
          className: "sec-v1-preservation-content",
          ariaLabel: "Shooter Action Bar",
          contentHtml: actionBarHtml(mode)
        }
      ]
    });
  }

  global.SCZN3BakerSLST1SEC = Object.freeze({
    targetId: TARGET_ID,
    variantId: VARIANT_ID,
    missionFamily: MISSION_FAMILY,
    resultPackageType: RESULT_PACKAGE_TYPE,
    matches,
    impactCount,
    missingOptionalDetails,
    render
  });
})(window);
