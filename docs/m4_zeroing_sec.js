(function (global) {
  "use strict";

  const REQUIRED_SEMANTIC_STAGES = Object.freeze(["evidence", "measurement", "recommendation", "execution", "validation", "preservation"]);

  function secAdapterId(session) {
    const source = session && session.matrixSnapshot || session || {};
    const profile = String(source.target_profile_id || source.targetProfileId || "").toLowerCase();
    const zeroingAdapters = {
      baker_m16a2_25m_zero: "m16a2-zeroing",
      speedwell_dodm4_m16a2_25m_zero: "speedwell-m16a2-zeroing",
      army_nsn_6920_01_395_2949_m16a2_25m_zero: "army-m16a2-zeroing",
      qualification_m16a2_25m_zero: "qualification-m16a2-zeroing",
      gunfun_32120_m16a2_green_25m_zero: "gunfun-32120-m16a2-zeroing"
    };
    return zeroingAdapters[profile] || "m4-zeroing";
  }

  function secAdapterViewModel(session) {
    const registry = global.SCZN3TargetAdapters;
    if (!registry || !session || typeof session !== "object") return null;
    const mapped = registry.createViewModel(secAdapterId(session), { session });
    if (!mapped.ok || !mapped.value) return null;
    const stages = mapped.value.semanticComponents.map(component => component.stage);
    if (stages.length !== REQUIRED_SEMANTIC_STAGES.length || stages.some((stage, index) => stage !== REQUIRED_SEMANTIC_STAGES[index])) return null;
    if (mapped.value.scoringPresentationFamily !== registry.scoringPresentationFamilies.ZEROING_CORRECTION) return null;
    return mapped.value;
  }

  function targetContent() {
    return global.SCZN3SECComponents.Evidence({ contentHtml: `<div class="sec-before-after" aria-label="Initial and confirmation group comparison">
      <figure><figcaption><strong>BEFORE</strong></figcaption><div class="sec-comparison-target"><div class="sec-evidence-plane" id="beforeEvidencePlane"><img id="beforeEvidenceImage" alt="Initial group target evidence" /><div class="marker-layer" id="beforeEvidenceMarkers"></div></div></div></figure>
      <figure id="confirmationWorkspace"><figcaption><strong>AFTER</strong></figcaption><div class="sec-comparison-target"><div class="sec-evidence-plane" id="confirmationEvidencePlane"><img id="confirmationImage" alt="Confirmation-group target evidence" /><div class="marker-layer" id="confirmationMarkers"></div></div><span class="sec-comparison-pending is-hidden" id="confirmationPending" hidden></span></div></figure>
    </div>` });
  }

  function sessionContent() {
    const details = global.SCZN3SECComponents.SessionDetails({
      headingId: "secSessionDetailsHeading",
      includeEmpty: true,
      fields: [
        { label: "Firearm", id: "secSessionFirearm" }, { label: "Equipment", id: "secSessionEquipment" },
        { label: "Ammunition", id: "secSessionAmmo" }, { label: "Distance", id: "secSessionDistance" },
        { label: "Date", id: "secSessionDate" }, { label: "Time", id: "secSessionTime" },
        { label: "Shooter", id: "secSessionShooter" }
      ],
      afterHtml: `<details class="correction-context-drawer sec-correction-context sec-measurement-session-details"><summary>Analysis</summary><div class="correction-context-panel sec-session-record"><div class="sec-metric-grid" id="summaryMeasurementGrid"></div></div></details>`
    });
    return global.SCZN3SECComponents.Measurement({ contentHtml: details });
  }

  function correctionContent() {
    return global.SCZN3SECComponents.Result({ family: "zeroing-correction", contentHtml: global.SCZN3SECComponents.Recommendation({ contentHtml: `<div id="summarySightCorrection"></div>` }) })
      + global.SCZN3SECComponents.Execution({ contentHtml: `<section class="sec-confirmation-summary" aria-labelledby="secConfirmationHeading"><h3 id="secConfirmationHeading">How to Confirm</h3>${global.SCZN3SECComponents.Validation({ contentHtml: `<div class="sec-validation-calculation" id="summaryValidationOutcome"></div>` })}</section>` });
  }

  function actionsContent() {
    return global.SCZN3SECComponents.Preservation({ contentHtml: global.SCZN3SECComponents.ActionBar({
      actions: [
        { label: "Save SEC", action: "save", id: "saveSEC", primary: true }, { label: "Share", action: "share", id: "shareSEC" },
        { label: "Export / Print PDF", action: "export", id: "exportSEC" }, { label: "Add Note", action: "note", id: "addNote" },
        { label: "Ballistic Vault", action: "history", href: "records.html" }
      ],
      afterHtml: `<div class="sec-note-editor is-hidden" id="noteEditor" data-sczn3-note-editor hidden><label>Session note<textarea id="secNote" rows="3" placeholder="Instructor note, applied setting, or range observation"></textarea></label><button class="button" type="button" id="saveNote" data-sczn3-action="note-save">Save Note</button></div><div class="sec-preserved-history-row is-hidden"></div><span class="sec-action-status" id="secActionStatus" role="status" aria-live="polite"></span>`
    }) });
  }

  function render(session) {
    const adapterView = secAdapterViewModel(session);
    if (!global.SCZN3SEC || !adapterView) return global.SCZN3SEC ? global.SCZN3SEC.renderUnavailable("M4 zeroing result unavailable") : "";
    const authority = adapterView.result.package;
    const score = authority && authority.score || {};
    const scoreDisplay = `Score ${score.value === null || score.value === undefined ? "Unavailable" : score.value}`;
    return global.SCZN3SEC.render({
      schemaVersion: "1.2",
      recordId: String(session.sessionId || "m4-zeroing-sec"),
      missionFamily: "zeroingCorrection",
      sessionLabel: session.sessionLabel || "Session",
      scoreDisplay,
      articleClassName: "sec-experience is-hidden",
      articleAttributes: {
        "data-session-id": session.sessionId || "",
        "data-sec-adapter-id": secAdapterId(session),
        "data-scoring-presentation-family": adapterView.scoringPresentationFamily,
        "data-target-profile-id": adapterView.targetProfileIdentity.targetProfileId,
        "data-target-profile-version": adapterView.targetProfileIdentity.targetProfileVersion,
        "data-publisher-id": adapterView.publisherIdentity && adapterView.publisherIdentity.publisherId || "",
        "data-product-id": adapterView.productIdentity && adapterView.productIdentity.productId || "",
        "data-processing-host": ""
      },
      regions: [
        { key: "target", className: "sec-v1-evidence-content", ariaLabel: "Target", contentHtml: targetContent() },
        { key: "session", className: "sec-v1-measurement-content", ariaLabel: "Session", contentHtml: sessionContent() },
        { key: "sightCorrection", className: "sec-v1-recommendation-content sec-v1-execution-content sec-v1-validation-content", ariaLabel: "Sight Correction", contentHtml: correctionContent() },
        { key: "actions", className: "sec-v1-preservation-content", ariaLabel: "Shooter Action Bar", contentHtml: actionsContent() }
      ]
    });
  }

  global.SCZN3M4SEC = Object.freeze({ secAdapterId, secAdapterViewModel, render });
})(window);
