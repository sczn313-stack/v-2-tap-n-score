(function (global) {
  "use strict";

  const clean = value => typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const CONTRACT_ADAPTERS = Object.freeze(["collection-hand-family", "cue-drill-family", "decision-scenario-family", "diagnostic-feedback-family", "qualification-family", "smart-evidence-family", "precision-open-score-family", "recreational-challenge-family", "target-scoring-family"]);
  const SHA256_CONSTANTS = Object.freeze([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);

  function runtimeId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") return global.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (global.crypto && typeof global.crypto.getRandomValues === "function") global.crypto.getRandomValues(bytes);
    else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  function sha256Fallback(buffer) {
    const input = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
    const message = new Uint8Array(paddedLength);
    message.set(input);
    message[input.length] = 0x80;
    const view = new DataView(message.buffer);
    const bitLength = input.length * 8;
    view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
    view.setUint32(paddedLength - 4, bitLength >>> 0, false);
    const state = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const words = new Uint32Array(64);
    const rotate = (value, count) => (value >>> count) | (value << (32 - count));
    for (let offset = 0; offset < paddedLength; offset += 64) {
      for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4, false);
      for (let index = 16; index < 64; index += 1) {
        const s0 = rotate(words[index - 15], 7) ^ rotate(words[index - 15], 18) ^ (words[index - 15] >>> 3);
        const s1 = rotate(words[index - 2], 17) ^ rotate(words[index - 2], 19) ^ (words[index - 2] >>> 10);
        words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
      }
      let [a,b,c,d,e,f,g,h] = state;
      for (let index = 0; index < 64; index += 1) {
        const sum1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
        const choice = (e & f) ^ (~e & g);
        const temp1 = (h + sum1 + choice + SHA256_CONSTANTS[index] + words[index]) >>> 0;
        const sum0 = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22);
        const majority = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (sum0 + majority) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      state[0] = (state[0] + a) >>> 0; state[1] = (state[1] + b) >>> 0; state[2] = (state[2] + c) >>> 0; state[3] = (state[3] + d) >>> 0;
      state[4] = (state[4] + e) >>> 0; state[5] = (state[5] + f) >>> 0; state[6] = (state[6] + g) >>> 0; state[7] = (state[7] + h) >>> 0;
    }
    return state.map(value => value.toString(16).padStart(8, "0")).join("");
  }

  async function sha256Hex(buffer) {
    if (global.crypto && global.crypto.subtle && typeof global.crypto.subtle.digest === "function") {
      try {
        const digest = await global.crypto.subtle.digest("SHA-256", buffer);
        return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
      } catch (_) {}
    }
    return sha256Fallback(buffer);
  }

  function canonicalResult(session) {
    return session && (session.authorityPackage || session.backendAuthorityPackage) || null;
  }

  function contractIdentity(result) {
    const contract = result && result.executionContract;
    return contract && clean(contract.contractId) && clean(contract.contractVersion) && /^[a-f0-9]{64}$/.test(clean(contract.contractFingerprint)) ? contract : null;
  }

  function targetIdentity(result) {
    const target = result && result.target;
    return target && clean(target.id) && clean(target.version) && target.publisher && clean(target.publisher.id) && clean(target.publisher.name) && target.product && clean(target.product.id) && clean(target.product.name) && clean(target.product.sku) ? target : null;
  }

  function familyReconciles(result) {
    const reconciliation = result && result.reconciliation;
    if (result && result.missionFamily === "secProgressionEvaluation") {
      const source = result.sourceSECs || {}, claim = result.claim || {}, transition = result.transition || {};
      const all = [...(Array.isArray(source.eligible) ? source.eligible : []), ...(Array.isArray(source.ineligible) ? source.ineligible : [])];
      return result.status === "complete" && ["advanced", "held", "insufficient_evidence", "ineligible_inputs"].includes(transition.outcome) && source.consumptionPolicy === "single_use_within_profile_lineage" && new Set(all.map(item => item.sessionId)).size === all.length && claim.claimGrade === "governed_progression_result" && claim.skillStatus === "not_established" && claim.readinessStatus === "not_established" && claim.certificationStatus === "not_established" && claim.officialQualificationStatus === "not_established" && claim.verifiedIdentityStatus === "not_established";
    }
    if (!reconciliation) return false;
    if (result.missionFamily === "smartEvidenceCapture") {
      const observations = Array.isArray(result.observations) ? result.observations : [];
      return observations.length > 0 && reconciliation.countsMatch === true && reconciliation.capturedObservationCount === observations.length && reconciliation.acceptedObservationCount === observations.length && result.scoring && result.scoring.status === "not_applicable";
    }
    if (result.missionFamily === "precisionRingScore") return reconciliation.status === "reconciled" && result.scoring && result.scoring.status === "complete";
    if (result.missionFamily === "targetScoring") {
      const classifications = Array.isArray(result.classifications) ? result.classifications : [];
      const aim = result.aimStructure;
      return result.status === "complete" && reconciliation.status === "reconciled" && reconciliation.countsMatch === true && reconciliation.recordedObservationCount === classifications.length && classifications.length > 0 && result.scoring && ["complete", "not_applicable"].includes(result.scoring.status) && aim && ["fixed", "region_centers", "shooter_declared", "not_required"].includes(aim.mode);
    }
    if (result.missionFamily === "recreationalChallenge") return reconciliation.status === "reconciled" && result.challenge && ["in_progress", "complete"].includes(result.challenge.status);
    if (result.missionFamily === "collectionHandEvaluation") {
      const turns = Array.isArray(result.turns) ? result.turns : [], observations = Array.isArray(result.observations) ? result.observations : [], players = Array.isArray(result.players) ? result.players : [], claim = result.claim || {};
      const counted = ["acceptedMemberCount", "duplicateIgnoredCount", "ambiguousCount", "unresolvedCount"].reduce((total, key) => total + Number(reconciliation[key] || 0), 0);
      return ["complete", "stopped_incomplete"].includes(result.status) && reconciliation.status === "reconciled" && reconciliation.turnCount === turns.length && reconciliation.observationCount === observations.length && turns.length === observations.length && counted === observations.length && players.length === result.run.playerCount && result.run.terminalStatus === result.status && claim.claimGrade === "publisher_collection_hand_result" && claim.generalGameJudgmentStatus === "not_established" && claim.conventionalPokerMeaningStatus === "not_established" && claim.gamblingStatus === "not_applicable" && result.scoring && result.scoring.status === "not_applicable" && result.timing && result.timing.physicalShotTiming && result.timing.physicalShotTiming.status === "unavailable";
    }
    if (result.missionFamily === "cueDrillOrchestration") {
      const stages = Array.isArray(result.stages) ? result.stages : [];
      const count = ["recorded", "missing", "extra", "ambiguous", "unresolved"].reduce((total, key) => total + Number(reconciliation[key] || 0), 0);
      return ["complete", "stopped_incomplete"].includes(result.status) && reconciliation.status === "reconciled" && reconciliation.cueCount === stages.length && count === stages.length && result.run && result.run.terminalStatus === result.status && result.scoring && result.scoring.status === "not_applicable" && result.timing && result.timing.physicalShotTiming && result.timing.physicalShotTiming.status === "unavailable";
    }
    if (result.missionFamily === "decisionScenarioEvaluation") {
      const presentations = Array.isArray(result.presentations) ? result.presentations : [];
      const count = ["matched", "mismatched", "ambiguous", "unresolved", "missing"].reduce((total, key) => total + Number(reconciliation[key] || 0), 0);
      const claim = result.claim || {};
      return ["complete", "stopped_incomplete"].includes(result.status) && reconciliation.status === "reconciled" && reconciliation.presentationCount === presentations.length && count === presentations.length && result.run && result.run.terminalStatus === result.status && claim.claimGrade === "publisher_designation_response_match" && claim.legalJudgmentStatus === "not_established" && claim.tacticalJudgmentStatus === "not_established" && claim.threatStatus === "not_established" && claim.useOfForceStatus === "not_established" && claim.qualificationStatus === "not_established" && result.scoring && result.scoring.status === "not_applicable" && result.timing && result.timing.physicalShotTiming && result.timing.physicalShotTiming.status === "unavailable";
    }
    if (result.missionFamily === "qualificationCourseEvaluation") {
      const stages = Array.isArray(result.stages) ? result.stages : [];
      const count = ["recorded", "missing", "extra", "ambiguous", "unresolved"].reduce((total, key) => total + Number(reconciliation[key] || 0), 0);
      return ["complete", "stopped_incomplete"].includes(result.status) && reconciliation.status === "reconciled" && reconciliation.stageCount === stages.length && count === stages.length && result.run && result.run.terminalStatus === result.status && result.claim && result.claim.claimGrade === "practice_simulation" && result.claim.officialClaimStatus === "not_established" && result.claim.credentialStatus === "not_issued_by_sczn3" && result.performance && ["pass", "fail", "incomplete", "not_evaluable"].includes(result.performance.outcome) && result.timing && result.timing.physicalShotTiming && result.timing.physicalShotTiming.status === "unavailable";
    }
    if (result.missionFamily === "diagnosticFeedbackEvaluation") {
      const classifications = Array.isArray(result.classifications) ? result.classifications : [];
      const counted = ["matched", "unmapped", "ambiguous", "rejected"].reduce((total, key) => total + Number(reconciliation[key] || 0), 0);
      return result.status === "complete" && classifications.length > 0 && reconciliation.status === "reconciled" && reconciliation.observationCount === classifications.length && counted === classifications.length && result.claim && result.claim.claimGrade === "publisher_label_match" && result.claim.causalDiagnosisStatus === "not_established" && result.claim.correctionStatus === "not_provided" && result.scoring && result.scoring.status === "not_applicable" && result.labelSummary && result.labelSummary.dominantLabel && result.labelSummary.dominantLabel.status === "unavailable";
    }
    return false;
  }

  function canPreserve(session) {
    const result = canonicalResult(session);
    const contract = contractIdentity(result);
    const target = targetIdentity(result);
    const evidence = session && session.targetEvidenceImage;
    const dispatch = global.SCZN3SECDispatch && global.SCZN3SECDispatch.resolve(session);
    const sessionId = clean(session && (session.sessionId || session.authoritativeSessionId));
    const snapshotTarget = clean(session && session.matrixSnapshot && (session.matrixSnapshot.targetProfileId || session.matrixSnapshot.target_profile_id || session.matrixSnapshot.targetId)).toLowerCase();
    return !!(
      result && result.ok === true && result.authoritySource === "backend-authoritative"
      && clean(result.authoritativeSessionId) === sessionId
      && contract && target && snapshotTarget === clean(target.id).toLowerCase()
      && dispatch && CONTRACT_ADAPTERS.includes(dispatch.adapter) && dispatch.adapter === contract.secAdapterFamilyId
      && familyReconciles(result)
      && evidence && (clean(evidence.dataUrl) || clean(evidence.mediaId))
    );
  }

  function evidenceMarkup(session, result) {
    const image = session && session.targetEvidenceImage || {};
    const source = clean(image.dataUrl);
    const observations = Array.isArray(result.observations) ? result.observations : (Array.isArray(result.classifications) ? result.classifications : result.events || []);
    const markers = observations.map((observation, index) => `<span class="contract-observation-marker" style="left:${Number(observation.xNorm) * 100}%;top:${Number(observation.yNorm) * 100}%" aria-label="Observation ${index + 1}">${index + 1}</span>`).join("");
    const targetAim = result.aimStructure && result.aimStructure.mode === "fixed" && Array.isArray(result.aimStructure.points) ? result.aimStructure.points[0] : null;
    const aim = result.shooterDeclaredAimPoint || targetAim;
    const aimLabel = result.shooterDeclaredAimPoint ? "Shooter-declared aim point" : "Governed target aim point";
    const aimMarker = aim ? `<span class="contract-aim-marker" style="left:${Number(aim.xNorm) * 100}%;top:${Number(aim.yNorm) * 100}%" aria-label="${aimLabel}"></span>` : "";
    return source ? `<figure class="contract-evidence"><div><img src="${escapeHtml(source)}" alt="Registered target session evidence" />${markers}${aimMarker}</div></figure>` : `<p>Evidence image unavailable.</p>`;
  }

  function summary(result) {
    if (result.missionFamily === "collectionHandEvaluation") {
      const winner = result.comparison && result.comparison.winnerPlayerId;
      const completeHands = (result.players || []).filter(player => player.hand && player.hand.status === "matched");
      return { label: "Publisher Collection / Hand", value: result.status === "complete" ? (winner ? `Winner: ${winner}` : `${completeHands.length} governed hand${completeHands.length === 1 ? "" : "s"}`) : "Stopped — Incomplete", detail: `${result.reconciliation.acceptedMemberCount} accepted collection members · not a general game judgment` };
    }
    if (result.missionFamily === "cueDrillOrchestration") return { label: "Cue / Drill", value: result.status === "complete" ? "Complete" : "Stopped — Incomplete", detail: `${result.reconciliation.cueCount} governed cues · ${result.reconciliation.observationCount} observations` };
    if (result.missionFamily === "decisionScenarioEvaluation") return { label: "Publisher-Designated Response", value: `${result.reconciliation.matched} matched`, detail: `${result.reconciliation.mismatched} mismatched · ${result.reconciliation.unresolved + result.reconciliation.ambiguous + result.reconciliation.missing} unresolved/incomplete · not legal or tactical judgment` };
    if (result.missionFamily === "secProgressionEvaluation") return { label: "Governed Progression Result", value: String(result.transition.outcome).replaceAll("_", " ").toUpperCase(), detail: `${result.priorLevel.label} → ${result.resultingLevel.label} · derived from ${result.sourceSECs.eligible.length} eligible preserved SECs` };
    if (result.missionFamily === "qualificationCourseEvaluation") return { label: "Practice Qualification", value: String(result.performance.outcome).replace("_", " ").toUpperCase(), detail: `${result.performance.total} points · threshold ${result.performance.threshold.value} · not an official qualification` };
    if (result.missionFamily === "diagnosticFeedbackEvaluation") return { label: "Publisher Label Match", value: `${result.reconciliation.matched} matched`, detail: `${result.reconciliation.unmapped} unmapped · ${result.reconciliation.ambiguous} ambiguous · not an SCZN3 diagnosis` };
    if (result.missionFamily === "smartEvidenceCapture") return { label: "Evidence Recorded", value: String(result.observations.length), detail: `${result.observations.length} shot observations` };
    if (result.missionFamily === "precisionRingScore") return { label: "Open Score", value: String(result.scoring.total), detail: result.scoring.completion === "open" ? "Shooter-controlled completion" : "Shooter declared complete" };
    if (result.missionFamily === "targetScoring") {
      const scoring = result.scoring || {};
      if (scoring.status === "not_applicable") return { label: "Target Result", value: `${scoring.observationCount || 0} recorded`, detail: "Printer defines no score · evidence preserved" };
      if (["numeric_regions", "penalty_regions"].includes(scoring.model)) return { label: scoring.model === "penalty_regions" ? "Penalty Total" : "Target Score", value: String(scoring.total), detail: `${scoring.observationCount} governed observations` };
      if (scoring.model === "ordered_objects") return { label: "Ordered Objects", value: `${scoring.completedInOrder} in order`, detail: scoring.nextExpectedObjectId ? `Next: ${scoring.nextExpectedObjectId}` : "Sequence complete" };
      return { label: "Target Result", value: `${scoring.observationCount} classified`, detail: `${Object.keys(scoring.regionCounts || {}).length} target region${Object.keys(scoring.regionCounts || {}).length === 1 ? "" : "s"}` };
    }
    const winner = result.challenge && result.challenge.winnerPlayerId;
    return { label: "Challenge", value: winner ? `Winner: ${winner}` : "In progress", detail: `${(result.events || []).length} governed events` };
  }

  function cueResultMarkup(result) {
    if (result.missionFamily !== "cueDrillOrchestration") return "";
    const records = Array.isArray(result.stages) ? result.stages : [];
    const rows = records.map(record => `<div><span>${escapeHtml(record.cue.stageTitle)} · ${escapeHtml(record.cue.label)}</span><strong>${escapeHtml(record.reconciliationState)}</strong></div>`).join("");
    return `<section class="contract-cue-records" aria-label="Governed cue record">${rows}</section><small>Physical shot timing: Unavailable</small>`;
  }

  function qualificationResultMarkup(result) {
    if (result.missionFamily !== "qualificationCourseEvaluation") return "";
    const rows = (Array.isArray(result.stages) ? result.stages : []).map(record => `<div><span>${escapeHtml(record.cue.stageTitle)} · ${escapeHtml(record.cue.distance.value)} ${escapeHtml(record.cue.distance.unit)}</span><strong>${escapeHtml(record.stageScore)} points · ${escapeHtml(record.reconciliationState)}</strong></div>`).join("");
    return `<p class="contract-claim-grade"><strong>${escapeHtml(result.claim.displayLabel)}</strong></p><section class="contract-cue-records" aria-label="Governed qualification course record">${rows}</section><small>SCZN3 credential: Not issued · Physical shot timing: Unavailable</small>`;
  }

  function diagnosticResultMarkup(result) {
    if (result.missionFamily !== "diagnosticFeedbackEvaluation") return "";
    const rows = result.classifications.map(item => `<div><span>Observation ${escapeHtml(item.observationId)}</span><strong>${escapeHtml(item.publisherLabel ? item.publisherLabel.displayLabel : item.classificationState)}</strong></div>`).join("");
    return `<p class="contract-claim-grade"><strong>${escapeHtml(result.claim.displayLabel)}</strong></p><section class="contract-cue-records" aria-label="Publisher label matches">${rows}</section><small>Causal diagnosis: Not established · Correction: Not provided</small>`;
  }

  function decisionResultMarkup(result) {
    if (result.missionFamily !== "decisionScenarioEvaluation") return "";
    const rows = result.presentations.map(record => `<div><span>${escapeHtml(record.presentation.title)} · ${escapeHtml(record.presentation.publisherDesignation.label)} <small>(publisher-designated)</small></span><strong>${escapeHtml(record.reconciliationState)}</strong><small>${record.noResponseEvidence ? "Explicit no-observation · physical shot absence not proven" : `${record.observations.length} governed observation${record.observations.length === 1 ? "" : "s"}`}</small></div>`).join("");
    return `<p class="contract-claim-grade"><strong>${escapeHtml(result.claim.displayLabel)}</strong></p><section class="contract-cue-records" aria-label="Publisher-designated scenario response results">${rows}</section><small>Legal judgment: Not established · Tactical judgment: Not established · Threat status: Not established · Use of force: Not established</small>`;
  }

  function progressionResultMarkup(result) {
    if (result.missionFamily !== "secProgressionEvaluation") return "";
    const eligible = result.sourceSECs.eligible.map(item => `<div><span>${escapeHtml(item.sessionId)} · ${escapeHtml(item.factId)}</span><strong>${escapeHtml(item.factValue)}</strong><small>${escapeHtml(item.artifactSha256)} · ${escapeHtml(item.resultIdentity)}</small></div>`).join("");
    const rejected = result.sourceSECs.ineligible.map(item => `<div><span>${escapeHtml(item.sessionId)}</span><strong>Ineligible: ${escapeHtml(item.reason)}</strong></div>`).join("");
    return `<p class="contract-claim-grade"><strong>${escapeHtml(result.claim.displayLabel)}</strong></p><section class="contract-cue-records" aria-label="Progression source SEC provenance">${eligible}${rejected}</section><small>Profile ${escapeHtml(result.profile.profileId)} @ ${escapeHtml(result.profile.profileVersion)} · Verified identity: Not established · Certification: Not established · Historical re-scoring: Not performed</small>`;
  }

  function collectionHandResultMarkup(result) {
    if (result.missionFamily !== "collectionHandEvaluation") return "";
    const rows = (result.players || []).map(player => `<article><strong>${escapeHtml(player.label)}</strong><span>${escapeHtml(player.hand && player.hand.publisherLabel || String(player.hand && player.hand.status || "unavailable").replaceAll("_", " "))}</span><small>${(player.collection || []).map(member => escapeHtml(member.publisherLabel)).join(" · ") || "No accepted collection members"}</small></article>`).join("");
    const comparison = result.comparison || {};
    const comparisonLabel = comparison.status === "winner" ? `Publisher-defined winner: ${comparison.winnerPlayerId}` : (comparison.status === "tie" ? `Publisher-defined tie: ${(comparison.tiedPlayerIds || []).join(", ")}` : `Comparison: ${String(comparison.status || "not_applicable").replaceAll("_", " ")}`);
    return `<p class="contract-claim-grade"><strong>${escapeHtml(result.claim.displayLabel)}</strong></p><section class="contract-cue-records" aria-label="Publisher-defined collection and hand results">${rows}</section><small>${escapeHtml(comparisonLabel)} · Conventional poker meaning: Not established · Path/board/deck/casino behavior: Unavailable</small>`;
  }

  function renderSEC({ session = {}, package: supplied = null, mode = "live", preserved = session.savedToSEC === true } = {}) {
    const result = supplied || canonicalResult(session);
    const contract = contractIdentity(result);
    const target = targetIdentity(result);
    const familyRegistry = global.SCZN3ExecutionFamilyAdapters;
    const view = contract && familyRegistry ? familyRegistry.createViewModel(contract.secAdapterFamilyId, { session, resultPackage: result }) : null;
    if (!global.SCZN3SEC || !view || !view.ok || !target || !familyReconciles(result)) return global.SCZN3SEC ? global.SCZN3SEC.renderUnavailable("Result unavailable") : "";
    const product = target.product;
    const publisher = target.publisher;
    const resultSummary = summary(result);
    const scoringState = result.scoring && result.scoring.status || "not_applicable";
    const actions = mode === "historical"
      ? global.SCZN3SECComponents.ActionBar({ actions: [{ label: "Ballistic Vault", href: "records.html", action: "history", primary: true }] })
      : global.SCZN3SECComponents.ActionBar({ actions: [{ label: preserved ? "SEC Preserved" : "Save SEC", action: "save", primary: !preserved, disabled: preserved }, { label: "Exact Reopen", href: `target-experience.html?session=${encodeURIComponent(session.sessionId || "")}&view=sec`, action: "history" }], afterHtml: '<span data-contract-save-status role="status" aria-live="polite"></span>' });
    return global.SCZN3SEC.render({
      schemaVersion: "1.2", recordId: clean(session.sessionId || result.progressionEvaluationId) || "contract-sec", missionFamily: result.missionFamily,
      sessionLabel: clean(session.sessionLabel) || "Session", scoreDisplay: resultSummary.value,
      articleClassName: "history-card contract-family-sec-card",
      articleAttributes: { "data-target-id": target.id, "data-target-profile-id": target.id, "data-target-profile-version": target.version, "data-sec-adapter-id": contract.secAdapterFamilyId, "data-contract-fingerprint": contract.contractFingerprint, "data-publisher-id": publisher.id, "data-product-id": product.id, "data-sec-mode": mode },
      regions: [
        { key: "target", className: "sec-v1-evidence-content", ariaLabel: "Target", contentHtml: `<section class="contract-product-identity"><span>${escapeHtml(publisher.name)}</span><strong>${escapeHtml(product.name)} · SKU ${escapeHtml(product.sku)}</strong></section>${result.missionFamily === "secProgressionEvaluation" ? "" : global.SCZN3SECComponents.Evidence({ contentHtml: evidenceMarkup(session, result) })}<section class="contract-result"><span>${escapeHtml(resultSummary.label)}</span><strong>${escapeHtml(resultSummary.value)}</strong><small>${escapeHtml(resultSummary.detail)}</small><small>Scoring: ${escapeHtml(result.missionFamily === "qualificationCourseEvaluation" ? "Governed course evaluation" : (scoringState === "not_applicable" ? "Not applicable" : scoringState))}</small>${cueResultMarkup(result)}${qualificationResultMarkup(result)}${diagnosticResultMarkup(result)}${decisionResultMarkup(result)}${progressionResultMarkup(result)}${collectionHandResultMarkup(result)}</section>` },
        { key: "session", className: "sec-v1-measurement-content", ariaLabel: "Authority", contentHtml: global.SCZN3SECComponents.Measurement({ contentHtml: `<dl class="contract-authority"><div><dt>Target Execution Contract</dt><dd>${escapeHtml(contract.contractId)} @ ${escapeHtml(contract.contractVersion)}</dd></div><div><dt>Backend authority</dt><dd>${escapeHtml(result.authoritySource)}</dd></div><div><dt>Claim grade</dt><dd>${escapeHtml(result.claim && result.claim.claimGrade || "not_applicable")}</dd></div><div><dt>Scoring status</dt><dd>${escapeHtml(scoringState)}</dd></div></dl>` }) },
        { key: "actions", className: "sec-v1-preservation-content", ariaLabel: "Shooter Action Bar", contentHtml: global.SCZN3SECComponents.Preservation({ contentHtml: actions }) }
      ]
    });
  }

  function vaultResultSummary(result) {
    if (!contractIdentity(result) || !targetIdentity(result) || !familyReconciles(result)) return null;
    const value = summary(result);
    return Object.freeze({ status: "unavailable", primaryLabel: value.label.toUpperCase(), objectiveLabel: value.value, evidenceLabel: value.detail });
  }

  global.SCZN3TargetExecutionRuntime = Object.freeze({ canPreserve, contractIdentity, targetIdentity, familyReconciles, renderSEC, vaultResultSummary, runtimeId, sha256Hex });

  function initializePage() {
    const root = document.querySelector("[data-contract-target-page]");
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const targetId = clean(params.get("target"));
    const missionFamily = clean(params.get("missionFamily"));
    const reopenSessionId = clean(params.get("session"));
    const reopenProgressionId = clean(params.get("progression"));
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(location.hostname);
    const privateLan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname) || /\.local$/i.test(location.hostname);
    const authorityOrigin = local ? "http://127.0.0.1:8098" : (privateLan ? "" : "https://sczn3-authority.onrender.com");
    const state = { session: null, image: null, imageDataUrl: "", observations: [], aim: null, aimMode: false, interaction: { aim: { mode: "shooter_declared", points: [] } }, isCueDrill: false, isQualification: false, isDiagnostic: false, isDecision: false, isStaged: false, cueSequence: 0, cueRunState: null, noObservationDeclared: false };
    const byId = id => document.getElementById(id);
    const status = message => { byId("contractStatus").textContent = message; };

    function paintMarkers() {
      const fixedAim = state.interaction.aim && state.interaction.aim.mode === "fixed" ? state.interaction.aim.points[0] : null;
      byId("contractMarkers").innerHTML = state.observations.map((point, index) => `<span class="contract-observation-marker" style="left:${point.xNorm * 100}%;top:${point.yNorm * 100}%">${index + 1}</span>`).join("") + (state.aim ? `<span class="contract-aim-marker" style="left:${state.aim.xNorm * 100}%;top:${state.aim.yNorm * 100}%"></span>` : (fixedAim ? `<span class="contract-aim-marker" style="left:${fixedAim.xNorm * 100}%;top:${fixedAim.yNorm * 100}%"></span>` : ""));
      byId("contractObservationCount").textContent = String(state.observations.length);
      byId("contractShowResult").disabled = state.isStaged || !state.observations.length;
      if (state.isStaged) byId("contractCueAdvance").disabled = !(state.observations.length || state.noObservationDeclared);
    }

    async function request(path, options = {}) {
      const response = await fetch(`${authorityOrigin}${path}`, { headers: { "Content-Type": "application/json", Accept: "application/json", ...(options.headers || {}) }, ...options });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) throw new Error(payload && payload.reason || `request_failed_${response.status}`);
      return payload;
    }

    async function start() {
      if (!targetId) throw new Error("registered_target_required");
      status("Resolving registered capability…");
      const prepared = await request("/api/session/prepare", { method: "POST", body: JSON.stringify({ targetId, missionFamily: missionFamily || undefined }) });
      const started = await request("/api/session/start", { method: "POST", headers: { "Idempotency-Key": `contract-${runtimeId()}` }, body: JSON.stringify({ preparationToken: prepared.preparationToken, selectedEquipment: prepared.standardSetup }) });
      state.session = global.SCZN3M4.createAuthoritativeSession(started, { targetProfileId: started.target.targetId, target_profile_id: started.target.targetId, targetName: started.target.targetName, missionFamily: started.missionIdentity.missionFamily, resultPackageType: started.missionIdentity.resultPackageType });
      state.interaction = started.interactionContract || state.interaction;
      state.isCueDrill = started.missionIdentity.missionFamily === "cueDrillOrchestration";
      state.isQualification = started.missionIdentity.missionFamily === "qualificationCourseEvaluation";
      state.isDiagnostic = started.missionIdentity.missionFamily === "diagnosticFeedbackEvaluation";
      state.isDecision = started.missionIdentity.missionFamily === "decisionScenarioEvaluation";
      state.isStaged = state.isCueDrill || state.isQualification || state.isDecision;
      byId("contractProductName").textContent = started.target.targetName;
      byId("contractMarkAim").hidden = state.isStaged || state.isDiagnostic || !state.interaction.aim || state.interaction.aim.mode !== "shooter_declared";
      byId("contractStart").hidden = true;
      byId("contractCapture").hidden = false;
      status("Session admitted. Load target evidence.");
    }

    async function loadFile(file) {
      if (!file) return;
      const bytes = await file.arrayBuffer();
      const hash = await sha256Hex(bytes);
      const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const dimensions = await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ widthPx: image.naturalWidth, heightPx: image.naturalHeight }); image.onerror = reject; image.src = dataUrl; });
      state.imageDataUrl = dataUrl;
      state.image = { sha256: hash, ...dimensions, mediaType: file.type || "image/unknown", dataUrl };
      byId("contractTargetImage").src = dataUrl;
      byId("contractWorkspace").hidden = false;
      byId("contractDiagnosticPanel").hidden = !state.isDiagnostic;
      if (state.isDiagnostic || state.isStaged || !state.interaction.aim || state.interaction.aim.mode !== "shooter_declared") byId("contractMarkAim").hidden = true;
      if (state.isStaged) await startCueRun();
      else status("Tap visible shot observations.");
    }

    async function cueAction(type, fields = {}) {
      const response = await request("/api/target-execution/action", { method: "POST", body: JSON.stringify({ authoritativeSessionId: state.session.sessionId, actionId: runtimeId(), expectedSequence: state.cueSequence, action: { type, ...fields } }) });
      state.cueSequence = response.sequenceNumber;
      state.cueRunState = response.runState;
      return response;
    }

    function showCueState() {
      const run = state.cueRunState || {};
      const completed = state.isDecision ? run.completedPresentationCount : run.completedCueCount;
      const planned = state.isDecision ? run.plannedPresentationCount : run.plannedCueCount;
      byId("contractCueProgress").textContent = state.isDecision ? `${completed || 0} of ${planned || 0} scenarios complete` : (state.isQualification ? `${completed || 0} of ${planned || 0} course stages complete` : `${completed || 0} of ${planned || 0} cues complete`);
      const active = state.isDecision ? run.activeScenario : run.activeCue;
      byId("contractCueStage").textContent = active ? (state.isDecision ? active.title : active.stageTitle) : (state.isDecision ? "Awaiting governed scenario" : "Awaiting governed cue");
      byId("contractCueLabel").textContent = active ? (state.isDecision ? `${active.publisherDesignationLabel} · publisher-designated ${active.expectedResponse.replaceAll("_", " ")}` : (state.isQualification ? `${active.distance.value} ${active.distance.unit} · ${active.requiredRounds} required observation${active.requiredRounds === 1 ? "" : "s"}` : `${active.label} · ${active.source === "sczn3_issued" ? "SCZN3 issued" : "Externally declared"}`)) : (state.isDecision ? "Present the next governed scenario." : (state.isQualification ? "Begin the next governed course stage." : "Issue the next governed cue."));
      byId("contractExternalCueControls").hidden = !run.externalCueRequired || !!active;
      if (run.externalCueRequired && !active) {
        byId("contractExternalCue").innerHTML = (run.allowedExternalCues || []).map(cue => `<option value="${escapeHtml(cue.cueId)}">${escapeHtml(cue.label)}</option>`).join("");
      }
      byId("contractCueControls").hidden = !active;
      byId("contractTapSurface").disabled = !active;
      paintMarkers();
    }

    async function issueCue() {
      const run = state.cueRunState || {};
      const fields = run.externalCueRequired ? { declaredCueId: byId("contractExternalCue").value, declaredBy: byId("contractExternalDeclaredBy").value } : {};
      await cueAction(state.isDecision ? "present_scenario" : "issue_or_declare_cue", fields);
      state.observations = [];
      state.noObservationDeclared = false;
      showCueState();
      status(state.isDecision ? "Governed scenario active. Record response evidence or explicitly record no response." : "Governed cue active. Record visible observations or explicitly record none.");
    }

    async function startCueRun() {
      byId("contractCuePanel").hidden = false;
      byId("contractClaimGrade").hidden = !state.isQualification;
      byId("contractDecisionClaim").hidden = !state.isDecision;
      byId("contractMarkAim").hidden = true;
      byId("contractShowResult").hidden = true;
      await cueAction("start_run", { imageEvidence: state.image, ...(state.isQualification ? { requestedClaimGrade: "practice_simulation" } : {}) });
      showCueState();
      if (!state.cueRunState.externalCueRequired) await issueCue();
      else status("Choose and declare the externally supplied cue.");
    }

    async function finishCue(response) {
      const result = response.result;
      await Promise.resolve(global.SCZN3M4.saveTargetEvidenceImage(state.image));
      state.session = await Promise.resolve(global.SCZN3M4.updateActiveSession({ authorityPackage: result, savedToSEC: false }));
      byId("contractCaptureView").hidden = true;
      byId("contractSecView").hidden = false;
      byId("contractSecRoot").innerHTML = renderSEC({ session: state.session, package: result });
      const familyLabel = state.isDecision ? "publisher-designated response" : (state.isQualification ? "practice/simulation qualification" : "Cue/Drill");
      status(result.status === "complete" ? `Backend-authoritative ${familyLabel} result complete.` : `Backend-authoritative ${familyLabel} run stopped incomplete.`);
    }

    async function recordNoObservation() {
      await cueAction("record_no_observation");
      state.noObservationDeclared = true;
      paintMarkers();
      status("No visible observation recorded for the active cue.");
    }

    async function advanceCue() {
      if (state.observations.length) await cueAction("record_response_evidence", { observations: state.observations });
      else if (!state.noObservationDeclared) throw new Error("response_evidence_or_no_observation_required");
      const elapsedText = clean(byId("contractCueElapsed").value);
      const fields = elapsedText ? { practiceElapsedMs: Number(elapsedText), declaredBy: byId("contractExternalDeclaredBy").value } : {};
      const response = await cueAction("advance", fields);
      byId("contractCueElapsed").value = "";
      if (response.result) return finishCue(response);
      state.observations = [];
      state.noObservationDeclared = false;
      showCueState();
      if (!state.cueRunState.externalCueRequired) await issueCue();
      else status("Choose and declare the next externally supplied cue.");
    }

    async function stopCue() {
      const response = await cueAction("stop_run");
      await finishCue(response);
    }

    async function showResult() {
      status("Requesting backend-authoritative result…");
      const result = await request("/api/target-execution", { method: "POST", body: JSON.stringify({ authoritativeSessionId: state.session.sessionId, evidence: { imageEvidence: state.image, observations: state.observations, shooterDeclaredAimPoint: state.aim, ...(state.isDiagnostic ? { declaredHandedness: byId("contractDiagnosticHandedness").value, declaredOrientation: "registered_publisher_orientation" } : {}) } }) });
      await Promise.resolve(global.SCZN3M4.saveTargetEvidenceImage(state.image));
      state.session = await Promise.resolve(global.SCZN3M4.updateActiveSession({ authorityPackage: result, savedToSEC: false }));
      byId("contractCaptureView").hidden = true;
      byId("contractSecView").hidden = false;
      byId("contractSecRoot").innerHTML = renderSEC({ session: state.session, package: result });
      status("Backend-authoritative result ready.");
    }

    async function save() {
      const preserved = global.SCZN3M4.preserveActiveSEC("", state.session);
      if (!preserved) throw new Error("preservation_admission_failed");
      const response = await request("/api/session/sec", { method: "POST", body: JSON.stringify({ session: preserved }) });
      state.session = response.session;
      byId("contractSecRoot").innerHTML = renderSEC({ session: state.session, package: canonicalResult(state.session), preserved: true });
      const saveStatus = document.querySelector("[data-contract-save-status]");
      if (saveStatus) saveStatus.textContent = "SEC preserved. Exact reopen available.";
    }

    async function reopen(sessionId) {
      const response = await request(`/api/session/sec?session=${encodeURIComponent(sessionId)}`);
      state.session = response.session;
      byId("contractCaptureView").hidden = true;
      byId("contractSecView").hidden = false;
      byId("contractSecRoot").innerHTML = renderSEC({ session: state.session, package: canonicalResult(state.session), mode: "historical", preserved: true });
      status("Exact preserved SEC reopened.");
    }

    async function reopenProgression(evaluationId) {
      const response = await request(`/api/sec-progression/evaluate?evaluation=${encodeURIComponent(evaluationId)}`);
      const result = response.result;
      const progressionRecord = { progressionEvaluationId: evaluationId, recordType: "cross_session_progression", authorityPackage: result, matrixSnapshot: { targetProfileId: result.target.id, missionFamily: result.missionFamily, resultPackageType: result.resultPackageType }, preserved: true, preservedAt: response.preservedAt };
      byId("contractCaptureView").hidden = true;
      byId("contractSecView").hidden = false;
      byId("contractSecRoot").innerHTML = renderSEC({ session: progressionRecord, package: result, mode: "historical", preserved: true });
      status("Exact immutable Progression Record reopened.");
    }

    byId("contractStart").addEventListener("click", () => start().catch(error => status(`Unavailable: ${error.message}`)));
    byId("contractFile").addEventListener("change", event => loadFile(event.target.files[0]).catch(error => status(`Unable to load evidence: ${error.message}`)));
    byId("contractTapSurface").addEventListener("click", event => { const box = event.currentTarget.getBoundingClientRect(); const point = { xNorm: (event.clientX - box.left) / box.width, yNorm: (event.clientY - box.top) / box.height }; if (state.aimMode) { state.aim = point; state.aimMode = false; } else state.observations.push(point); paintMarkers(); });
    byId("contractMarkAim").addEventListener("click", () => { state.aimMode = true; status("Tap the shooter-declared aim point."); });
    byId("contractShowResult").addEventListener("click", () => showResult().catch(error => status(`Result unavailable: ${error.message}`)));
    byId("contractCueIssue").addEventListener("click", () => issueCue().catch(error => status(`Cue unavailable: ${error.message}`)));
    byId("contractCueNoObservation").addEventListener("click", () => recordNoObservation().catch(error => status(`Evidence unavailable: ${error.message}`)));
    byId("contractCueAdvance").addEventListener("click", () => advanceCue().catch(error => status(`Advance unavailable: ${error.message}`)));
    byId("contractCueStop").addEventListener("click", () => stopCue().catch(error => status(`Stop unavailable: ${error.message}`)));
    document.addEventListener("click", event => { if (event.target.closest('[data-sczn3-action="save"]')) save().catch(error => status(`Save unavailable: ${error.message}`)); });
    if (reopenProgressionId) reopenProgression(reopenProgressionId).catch(error => status(`Progression reopen unavailable: ${error.message}`));
    else if (reopenSessionId) reopen(reopenSessionId).catch(error => status(`Reopen unavailable: ${error.message}`));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializePage);
  else initializePage();
})(window);
