(function (global) {
  "use strict";

  const clean = value => typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const CONTRACT_ADAPTERS = Object.freeze(["collection-hand-family", "cue-drill-family", "decision-scenario-family", "diagnostic-feedback-family", "qualification-family", "smart-evidence-family", "precision-open-score-family", "recreational-challenge-family", "target-scoring-family"]);
  const EXECUTABLE_REGISTRATION_ROLES = Object.freeze(["scorable_canonical_asset", "evidence_capture_asset"]);
  const SHA256_CONSTANTS = Object.freeze([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);

  function localAuthorityPort() {
    const value = new URLSearchParams(global.location && global.location.search || "").get("authorityPort") || "";
    const number = Number(value);
    return /^\d{2,5}$/.test(value) && number > 0 && number <= 65535 && ["127.0.0.1", "localhost", "[::1]"].includes(global.location && global.location.hostname) ? value : "";
  }

  function localAuthoritySuffix() {
    const port = localAuthorityPort();
    return port ? `&authorityPort=${encodeURIComponent(port)}` : "";
  }

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

  function requestScoringCaliber(error) {
    const dialog = document.getElementById("contractScoringCaliberDialog");
    const choices = document.getElementById("contractScoringCaliberChoices");
    const cancel = document.getElementById("contractScoringCaliberCancel");
    const payload = error && (error.payload || error.packageData) || {};
    const suppliedChoices = Array.isArray(payload.allowedCaliberChoices)
      ? payload.allowedCaliberChoices
        .map(choice => ({ label: clean(choice && choice.label), value: clean(choice && choice.value) }))
        .filter(choice => choice.label && choice.value)
      : [];
    const fallbackChoices = Array.isArray(payload.allowedCalibers)
      ? [...new Set(payload.allowedCalibers.map(clean).filter(Boolean))].map(value => ({ label: value, value }))
      : [];
    const allowed = suppliedChoices.length ? suppliedChoices : fallbackChoices;
    if (!dialog || !choices || !cancel || !allowed.length || typeof dialog.showModal !== "function") return Promise.resolve("");
    choices.innerHTML = allowed.map(choice => `<button class="button primary" type="button" data-scoring-caliber="${escapeHtml(choice.value)}">${escapeHtml(choice.label)}</button>`).join("");
    return new Promise(resolve => {
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        choices.removeEventListener("click", choose);
        cancel.removeEventListener("click", cancelChoice);
        dialog.removeEventListener("cancel", cancelDialog);
        if (dialog.open) dialog.close();
        resolve(value);
      };
      const choose = event => {
        const button = event.target.closest("[data-scoring-caliber]");
        if (button) finish(clean(button.dataset.scoringCaliber));
      };
      const cancelChoice = () => finish("");
      const cancelDialog = event => { event.preventDefault(); finish(""); };
      choices.addEventListener("click", choose);
      cancel.addEventListener("click", cancelChoice);
      dialog.addEventListener("cancel", cancelDialog);
      dialog.showModal();
    });
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
    const source = clean(image.dataUrl || image.assetUrl);
    const sourceWidth = Number(image.imageWidthPx || image.widthPx || image.width);
    const sourceHeight = Number(image.imageHeightPx || image.heightPx || image.height);
    const governedPlane = sourceWidth > 0 && sourceHeight > 0
      ? ` data-ugo-projection-plane="normalized-source-image" style="--ugo-source-aspect:${sourceWidth} / ${sourceHeight};--ugo-evidence-max-width:${42 * sourceWidth / sourceHeight}vh"`
      : "";
    const observations = preservedObservations(session, result, image);
    const markers = observations.map((observation, index) => `<span class="contract-observation-marker precision-tap-marker" data-shot-index="${index + 1}" style="left:${observation.xNorm * 100}%;top:${observation.yNorm * 100}%" aria-label="${escapeHtml(observation.label)}"></span>`).join("");
    const targetAim = shouldRenderGovernedAim(result.missionFamily) && result.aimStructure && result.aimStructure.mode === "fixed" && Array.isArray(result.aimStructure.points) ? result.aimStructure.points[0] : null;
    const aim = normalizedEvidencePoint(result.shooterDeclaredAimPoint || session && session.aimPoint || targetAim, image);
    const aimLabel = result.shooterDeclaredAimPoint ? "Shooter-declared aim point" : "Governed target aim point";
    const aimMarker = aim ? `<span class="contract-aim-marker" style="left:${aim.xNorm * 100}%;top:${aim.yNorm * 100}%" aria-label="${aimLabel}"></span>` : "";
    return source ? `<figure class="contract-evidence"><div${governedPlane}><img src="${escapeHtml(source)}" alt="Registered target session evidence" /><div class="contract-evidence-marker-layer">${markers}${aimMarker}</div></div></figure>` : `<p>Evidence image unavailable.</p>`;
  }

  function normalizedEvidencePoint(value, image = {}) {
    if (!value || typeof value !== "object") return null;
    const canonical = value.canonicalTargetCoordinate && typeof value.canonicalTargetCoordinate === "object"
      ? value.canonicalTargetCoordinate
      : null;
    let x = Number(canonical ? canonical.xNorm : value.xNorm);
    let y = Number(canonical ? canonical.yNorm : value.yNorm);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = Number(value.xPercent) / 100;
      y = Number(value.yPercent) / 100;
    }
    if ((!Number.isFinite(x) || !Number.isFinite(y)) && Number(image.imageWidthPx || image.widthPx || image.width) > 0 && Number(image.imageHeightPx || image.heightPx || image.height) > 0) {
      x = Number(value.xPx) / Number(image.imageWidthPx || image.widthPx || image.width);
      y = Number(value.yPx) / Number(image.imageHeightPx || image.heightPx || image.height);
    }
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return null;
    if (canonical && clean(canonical.coordinateSystem) !== "normalized_source_image_top_left") return null;
    return {
      xNorm: x,
      yNorm: y,
      ...(canonical ? { canonicalTargetCoordinate: { ...canonical, xNorm: x, yNorm: y } } : {})
    };
  }

  function preservedObservations(session, result, image = {}) {
    const candidates = Array.isArray(result && result.observations) && result.observations.length
      ? result.observations
      : Array.isArray(result && result.classifications) && result.classifications.length
        ? result.classifications
        : Array.isArray(result && result.events) && result.events.length
          ? result.events
          : Array.isArray(session && session.impactPoints)
            ? session.impactPoints
            : [];
    return candidates.map((observation, index) => {
      const point = normalizedEvidencePoint(observation && (observation.coordinate || observation.point || observation), image);
      if (!point) return null;
      const identity = clean(observation && (observation.observationId || observation.shotId || observation.eventId)) || String(index + 1);
      return { ...point, identity, label: `Tap ${identity}` };
    }).filter(Boolean);
  }

  function sourceImagePoint(clientX, clientY, imageBox, identity = {}) {
    const left = Number(imageBox && imageBox.left);
    const top = Number(imageBox && imageBox.top);
    const width = Number(imageBox && imageBox.width);
    const height = Number(imageBox && imageBox.height);
    const x = Number(clientX);
    const y = Number(clientY);
    if (![left, top, width, height, x, y].every(Number.isFinite) || width <= 0 || height <= 0) return null;
    const xNorm = (x - left) / width;
    const yNorm = (y - top) / height;
    if (xNorm < 0 || xNorm > 1 || yNorm < 0 || yNorm > 1) return null;
    const canonicalTargetCoordinate = Object.freeze({
      schemaVersion: "sczn3.ugo.normalized-source-image-point.v1",
      coordinateSystem: "normalized_source_image_top_left",
      targetProfileId: clean(identity.targetProfileId),
      sourceImageSha256: clean(identity.sourceImageSha256).toLowerCase(),
      sourceImageWidthPx: Number(identity.sourceImageWidthPx),
      sourceImageHeightPx: Number(identity.sourceImageHeightPx),
      xNorm,
      yNorm
    });
    return { xNorm, yNorm, canonicalTargetCoordinate };
  }

  function renderedImageContentBox(image) {
    if (!image) return null;
    const rect = image.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return null;
    const style = global.getComputedStyle ? global.getComputedStyle(image) : null;
    const leftInset = style ? (Number.parseFloat(style.borderLeftWidth) || 0) + (Number.parseFloat(style.paddingLeft) || 0) : 0;
    const rightInset = style ? (Number.parseFloat(style.borderRightWidth) || 0) + (Number.parseFloat(style.paddingRight) || 0) : 0;
    const topInset = style ? (Number.parseFloat(style.borderTopWidth) || 0) + (Number.parseFloat(style.paddingTop) || 0) : 0;
    const bottomInset = style ? (Number.parseFloat(style.borderBottomWidth) || 0) + (Number.parseFloat(style.paddingBottom) || 0) : 0;
    const contentWidth = Math.max(0, rect.width - leftInset - rightInset);
    const contentHeight = Math.max(0, rect.height - topInset - bottomInset);
    if (!(contentWidth > 0 && contentHeight > 0)) return null;
    let left = rect.left + leftInset;
    let top = rect.top + topInset;
    let width = contentWidth;
    let height = contentHeight;
    const objectFit = clean(style && style.objectFit) || "fill";
    const naturalWidth = Number(image.naturalWidth || 0);
    const naturalHeight = Number(image.naturalHeight || 0);
    if (["contain", "scale-down"].includes(objectFit) && naturalWidth > 0 && naturalHeight > 0) {
      const scale = Math.min(contentWidth / naturalWidth, contentHeight / naturalHeight, ...(objectFit === "scale-down" ? [1] : []));
      width = naturalWidth * scale;
      height = naturalHeight * scale;
      left += (contentWidth - width) / 2;
      top += (contentHeight - height) / 2;
    }
    return { left, top, width, height, right: left + width, bottom: top + height };
  }

  function syncProjectionLayerToImage(layer, image, container) {
    if (!layer || !image || !container) return false;
    if (container.dataset && container.dataset.ugoProjectionPlane === "normalized-source-image") {
      layer.style.inset = "0";
      layer.style.left = "";
      layer.style.top = "";
      layer.style.width = "";
      layer.style.height = "";
      return true;
    }
    const imageBox = renderedImageContentBox(image);
    const containerBox = container.getBoundingClientRect();
    if (!imageBox || !(containerBox.width > 0 && containerBox.height > 0)) return false;
    layer.style.inset = "auto";
    layer.style.left = `${imageBox.left - containerBox.left - Number(container.clientLeft || 0)}px`;
    layer.style.top = `${imageBox.top - containerBox.top - Number(container.clientTop || 0)}px`;
    layer.style.width = `${imageBox.width}px`;
    layer.style.height = `${imageBox.height}px`;
    return true;
  }

  function bindProjectionLayer(layer, image, container) {
    if (!layer || !image || !container) return;
    const sync = () => syncProjectionLayerToImage(layer, image, container);
    if (image.complete) requestAnimationFrame(sync);
    else image.addEventListener("load", sync, { once: true });
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(sync);
      observer.observe(image);
      observer.observe(container);
    }
    requestAnimationFrame(sync);
  }

  function bindEvidenceProjection(root = document) {
    root.querySelectorAll(".contract-evidence>div").forEach(container => {
      const image = container.querySelector("img");
      const layer = container.querySelector(".contract-evidence-marker-layer");
      if (!image || !layer || layer.dataset.projectionBound === "true") return;
      layer.dataset.projectionBound = "true";
      bindProjectionLayer(layer, image, container);
    });
  }

  function targetUsesPointTerminology(scoring) {
    return ["numeric_regions", "penalty_regions", "mixed_regions"].includes(clean(scoring && scoring.model));
  }

  function missedTapDisplay(scoring, missedCount) {
    const taps = `${missedCount} tap${missedCount === 1 ? "" : "s"}`;
    return targetUsesPointTerminology(scoring) ? `${taps} · 0 points` : taps;
  }

  function shooterFacingCountingLabel(value, fallback = "Region") {
    const label = clean(value)
      .replace(/\bgoverned\b/gi, "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:])/g, "$1")
      .trim();
    return label || fallback;
  }

  function outsideCountingLabel(result) {
    const treatment = result && result.smartTargetTreatment || {};
    return shooterFacingCountingLabel(treatment.outsideLabel, "Missed");
  }

  function titleCase(value) {
    const label = clean(value);
    return label ? label.charAt(0).toUpperCase() + label.slice(1) : "";
  }

  function naturalObjectVocabulary(result) {
    const treatment = result && result.smartTargetTreatment || {};
    const declared = treatment.shooterFacingVocabulary || {};
    const declaredSingular = clean(declared.singular);
    const declaredPlural = clean(declared.plural);
    if (declaredSingular && declaredPlural) return {
      singular: declaredSingular.toLowerCase(),
      plural: declaredPlural.toLowerCase(),
      titleSingular: titleCase(declaredSingular),
      titlePlural: titleCase(declaredPlural)
    };
    const scoring = result && result.scoring || {};
    const labels = (Array.isArray(scoring.objectResults) ? scoring.objectResults : [])
      .map(item => clean(item && (item.label || item.objectId))).filter(Boolean).join(" ");
    const product = clean(result && result.target && result.target.product && result.target.product.name);
    const haystack = `${labels} ${product}`.toLowerCase();
    const candidates = [
      ["zone", "zones", /\bzones?\b/],
      ["bullseye", "bullseyes", /\bbullseye\b/], ["bull", "bulls", /\bbull\b/],
      ["circle", "circles", /\bcircles?\b/], ["ball", "balls", /\bballs?\b/],
      ["animal", "animals", /\banimals?\b/], ["bot", "bots", /\bbots?\b|\brobots?\b/],
      ["cow", "cows", /\bcows?\b/], ["silhouette", "silhouettes", /\bsilhouettes?\b/],
      ["spot", "spots", /\bspots?\b/],
      ["dot", "dots", /\bdots?\b/], ["diamond", "diamonds", /\bdiamonds?\b/],
      ["figure", "figures", /\bfigures?\b/], ["target area", "target areas", /\btarget areas?\b/]
    ];
    const selected = candidates.find(([, , pattern]) => pattern.test(haystack)) || ["target area", "target areas"];
    return { singular: selected[0], plural: selected[1], titleSingular: titleCase(selected[0]), titlePlural: titleCase(selected[1]) };
  }

  function objectCompletionLanguage(result) {
    const treatment = result && result.smartTargetTreatment || {};
    return {
      verbPast: clean(treatment.objectCompletionVerbPast) || "hit",
      label: clean(treatment.objectCompletionLabel),
    };
  }

  function naturalObjectLabel(result, value, fallbackIndex = 0) {
    const vocabulary = naturalObjectVocabulary(result);
    const label = shooterFacingCountingLabel(value, vocabulary.titleSingular);
    const generic = label.match(/^(?:target\s+)?object(?:\s+(\d+))?$/i);
    if (!generic) return label;
    const suffix = generic[1] || (fallbackIndex > 0 ? String(fallbackIndex) : "");
    return `${vocabulary.titleSingular}${suffix ? ` ${suffix}` : ""}`;
  }

  function governedRegionDisplayLabels(records) {
    const normalized = records.map(record => ({
      ...record,
      baseLabel: clean(record.label) || clean(record.regionId).replaceAll("_", " ") || "Region"
    }));
    const frequencies = normalized.reduce((counts, record) => {
      const key = record.baseLabel.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
    return normalized.map(record => {
      if (frequencies[record.baseLabel.toLowerCase()] < 2) return record.baseLabel;
      const labelTokens = new Set(record.baseLabel.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
      const context = clean(record.regionId).split(/[_\s-]+/).filter(token => token && !labelTokens.has(token.toLowerCase())).map(titleCase).join(" ");
      return context ? `${record.baseLabel} · ${context}` : `${record.baseLabel} · ${clean(record.regionId).replaceAll("_", " ")}`;
    });
  }

  function hasGovernedOrdering(result) {
    const scoring = result && result.scoring || {};
    const aggregation = scoring.aggregation || {};
    const authority = scoring.publisherRuleAuthority || {};
    return scoring.model === "ordered_objects"
      && aggregation.mode === "ordered_progression"
      && Array.isArray(aggregation.sequence) && aggregation.sequence.length > 0
      && clean(authority.source) && clean(authority.rule);
  }

  function targetScoringRows(result) {
    if (!result || result.missionFamily !== "targetScoring" || !result.scoring) return [];
    const scoring = result.scoring;
    if (scoring.status === "not_applicable") return [];
    const classifications = Array.isArray(result.classifications) ? result.classifications : [];
    if (Array.isArray(scoring.objectResults) && scoring.objectResults.length) {
      const countOnly = !targetUsesPointTerminology(scoring);
      const rows = scoring.objectResults.map(item => ({
        label: countOnly
          ? shooterFacingCountingLabel(item.label || item.objectId, "Object")
          : clean(item.label) || clean(item.objectId) || "Object",
        value: Number(item.observationCount || 0),
        displayValue: countOnly
          ? `${Number(item.observationCount || 0) === 1 ? "1 hit" : `${Number(item.observationCount || 0)} hits`}`
          : `${Number(item.observationCount || 0) === 1 ? "1 hit" : `${Number(item.observationCount || 0)} hits`} · ${Number(item.observationPercentage || 0).toFixed(1)}%`,
        hit: item.hit === true,
      }));
      const classifiedCount = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);
      const missedCount = Math.max(Number(scoring.outsideCount || 0), Number(scoring.observationCount || 0) - classifiedCount, 0);
      rows.push({
        label: outsideCountingLabel(result),
        value: missedCount,
        displayValue: missedTapDisplay(scoring, missedCount),
        hit: false
      });
      return rows;
    }
    const governedRegions = Array.isArray(scoring.regionCatalog) && scoring.regionCatalog.length
      ? scoring.regionCatalog.map(item => [clean(item.regionId), Number((scoring.regionCounts || {})[clean(item.regionId)] || 0), clean(item.label)])
      : Object.entries(scoring.regionCounts || {}).filter(([regionId]) => clean(regionId) !== "outside").map(([regionId, count]) => [regionId, count, ""]);
    const regionRecords = governedRegions.map(([regionId, count, catalogLabel]) => {
      const classified = classifications.find(item => clean(item.regionId) === clean(regionId));
      return { regionId, count, classified, label: catalogLabel || clean(classified && classified.label) || clean(regionId).replaceAll("_", " ") || "Outside" };
    });
    const displayLabels = governedRegionDisplayLabels(regionRecords);
    const rows = regionRecords.map(({ regionId, count, classified }, index) => {
      return {
        label: targetUsesPointTerminology(scoring)
          ? displayLabels[index]
          : shooterFacingCountingLabel(displayLabels[index], "Region"),
        value: Number(count || 0),
        displayValue: String(Number(count || 0)),
        hit: Number(count || 0) > 0,
      };
    });
    const classifiedCount = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);
    const missedCount = Math.max(Number(scoring.outsideCount || 0), Number(scoring.observationCount || 0) - classifiedCount, 0);
    rows.push({
      label: outsideCountingLabel(result),
      value: missedCount,
      displayValue: missedTapDisplay(scoring, missedCount),
      hit: false,
    });
    return rows;
  }

  function objectLabelParts(label) {
    const value = clean(label);
    let match = value.match(/^(.+?)\s+[—–-]\s+(.+)$/);
    if (match) return { group: match[1], location: match[2] };
    match = value.match(/^(.+?)\s+((?:top|bottom|middle|lower|upper|center|left|right)(?:[ -](?:left|right|center))?|\d+(?:-\d+)?)$/i);
    if (match) return { group: match[1], location: match[2] };
    match = value.match(/^((?:top|bottom|middle|lower|upper|center|left|right)(?:[ -](?:left|right|center))?)\s+(.+)$/i);
    if (match) return { group: match[2], location: match[1] };
    return { group: value, location: "" };
  }

  function objectResultGroups(result) {
    const scoring = result && result.scoring || {};
    if (!Array.isArray(scoring.objectResults) || !scoring.objectResults.length) return [];
    const grouped = new Map();
    scoring.objectResults.forEach(item => {
      const count = Number(item.observationCount || 0);
      const parts = objectLabelParts(shooterFacingCountingLabel(item.label || item.objectId, "Object"));
      if (!grouped.has(parts.group)) grouped.set(parts.group, []);
      grouped.get(parts.group).push({ label: parts.location || parts.group, count });
    });
    return Array.from(grouped, ([label, items]) => ({ label, items }));
  }

  function objectGroupsMarkup(result) {
    const scoring = result && result.scoring || {};
    const regions = Array.isArray(scoring.objectResults) ? scoring.objectResults : [];
    if (!regions.length) return "";
    const vocabulary = naturalObjectVocabulary(result);
    return countingDetailsMarkup(regions, {
      title: "Region details",
      column: vocabulary.titleSingular,
      className: "contract-counting-details",
      dataAttribute: 'data-counting-details="true"',
      fallback: vocabulary.titleSingular,
      labeler: (item, index) => naturalObjectLabel(result, item.label || item.objectId, index + 1),
      analysis: objectDistributionDetailMarkup(result)
    });
  }

  function isUsmcThreatResult(result) {
    return clean(result && result.target && result.target.id) === "qt_printer13_product_1891723542601";
  }

  function zoneDetailsMarkup(result) {
    const scoring = result && result.scoring || {};
    const zones = Array.isArray(scoring.objectResults) ? scoring.objectResults : [];
    if (!zones.length) return "";
    return countingDetailsMarkup(zones, {
      title: "Zone details",
      column: "Zone",
      className: "contract-zone-details",
      dataAttribute: 'data-zone-details="true"',
      fallback: "Zone"
    });
  }

  function countingDetailsMarkup(items, options = {}) {
    const title = clean(options.title) || "Region details";
    const column = clean(options.column) || "Region";
    const className = clean(options.className) || "contract-counting-details";
    const dataAttribute = clean(options.dataAttribute);
    const fallback = clean(options.fallback) || column;
    const rows = items.map((item, index) => ({
      label: typeof options.labeler === "function" ? options.labeler(item, index) : shooterFacingCountingLabel(item.label || item.objectId, fallback),
      count: Number(item.hitCount ?? item.observationCount ?? 0),
      misses: Number(item.missCount || 0)
    }));
    const hasMisses = rows.some(row => row.misses > 0);
    const analysis = clean(options.analysis);
    const table = (tableRows, rangeLabel = "") => `<table${rangeLabel ? ` aria-label="${escapeHtml(rangeLabel)}"` : ""}>${rangeLabel ? `<caption>${escapeHtml(rangeLabel)}</caption>` : ""}<thead><tr><th scope="col">${escapeHtml(column)}</th><th scope="col">Hits</th>${hasMisses ? '<th scope="col">Misses</th>' : ""}</tr></thead><tbody>${tableRows.map(row => `<tr><th scope="row">${escapeHtml(row.label)}</th><td>${escapeHtml(measuredNumber(row.count))}</td>${hasMisses ? `<td>${escapeHtml(measuredNumber(row.misses))}</td>` : ""}</tr>`).join("")}</tbody></table>`;
    const rangeLabel = tableRows => {
      const first = clean(tableRows[0] && tableRows[0].label);
      const last = clean(tableRows[tableRows.length - 1] && tableRows[tableRows.length - 1].label);
      const firstNumbered = first.match(/^(.*?)(\d+)$/);
      const lastNumbered = last.match(/^(.*?)(\d+)$/);
      return firstNumbered && lastNumbered && clean(firstNumbered[1]).toLowerCase() === clean(lastNumbered[1]).toLowerCase()
        ? `${clean(firstNumbered[1])} ${firstNumbered[2]}–${lastNumbered[2]}`
        : `${first}–${last}`;
    };
    const body = rows.length > 8
      ? (() => {
          const splitAt = Math.ceil(rows.length / 2);
          const columns = [rows.slice(0, splitAt), rows.slice(splitAt)];
          return `<div class="contract-counting-columns" data-counting-column-count="2">${columns.map(columnRows => table(columnRows, rangeLabel(columnRows))).join("")}</div>`;
        })()
      : table(rows);
    return `<details class="contract-numeric-region-results ${escapeHtml(className)}"${dataAttribute ? ` ${dataAttribute}` : ""}><summary data-disclosure-control="true"><span class="contract-distribution-title">${escapeHtml(title)}</span><span class="contract-disclosure-instruction contract-disclosure-instruction--closed">Tap to view <b aria-hidden="true">›</b></span><span class="contract-disclosure-instruction contract-disclosure-instruction--open">Tap to close <b aria-hidden="true">›</b></span></summary><div>${body}${analysis}</div></details>`;
  }

  function cumulativeColorTotalsMarkup(result) {
    const scoring = result && result.scoring || {};
    const groups = Array.isArray(scoring.cumulativeResults) ? scoring.cumulativeResults : [];
    const whole = scoring.cumulativeWholeTarget;
    if (!groups.length || !whole) return "";
    const cells = group => `<span><b>Red total</b><strong>${escapeHtml(group.cumulative.redTotal)}</strong></span><span><b>White total</b><strong>${escapeHtml(group.cumulative.whiteTotal)}</strong></span><span><b>Blue total</b><strong>${escapeHtml(group.cumulative.blueTotal)}</strong></span><span><b>Missed</b><strong>${escapeHtml(group.missCount)}</strong></span>`;
    return `<details class="contract-numeric-region-results contract-cumulative-color-results" data-cumulative-color-details="true"><summary data-disclosure-control="true"><span class="contract-distribution-title">Color totals</span><span class="contract-disclosure-instruction contract-disclosure-instruction--closed">Tap to view <b aria-hidden="true">›</b></span><span class="contract-disclosure-instruction contract-disclosure-instruction--open">Tap to close <b aria-hidden="true">›</b></span></summary><div class="contract-object-groups">${groups.map(group => `<article class="contract-object-group"><h3>${escapeHtml(group.label)}</h3><div>${cells(group)}</div></article>`).join("")}<article class="contract-object-group"><h3>Whole target</h3><div>${cells(whole)}</div></article></div><small>SCZN3 method · Red is counted inside White; White is counted inside Blue. Atomic tap classifications remain exclusive.</small></details>`;
  }

  function subsetResultsMarkup(result) {
    const subsets = result && result.scoring && Array.isArray(result.scoring.subsetResults) ? result.scoring.subsetResults : [];
    if (!subsets.length) return "";
    const total = subsets.reduce((sum, item) => sum + Number(item.observationCount || 0), 0);
    return `<section class="contract-object-groups" aria-label="Subset tap counts; these are not additional shots"><article class="contract-object-group"><h3>Aim-point subsets · ${escapeHtml(total)} total</h3><div>${subsets.map(item => `<span><b>${escapeHtml(item.label)}</b><strong>${escapeHtml(item.observationCount)} · subset</strong></span>`).join("")}</div></article></section>`;
  }

  function numericObjectMeasurements(result) {
    const scoring = result && result.scoring || {};
    if (!["numeric_regions", "penalty_regions", "mixed_regions"].includes(scoring.model) || !Array.isArray(scoring.objectResults)) return [];
    return scoring.objectResults.filter(item => item && Number.isFinite(Number(item.assignedTapCount)) && Number.isFinite(Number(item.score))).map(item => ({
      objectId: clean(item.objectId),
      label: clean(item.label || item.objectId) || "Target object",
      assignedTapCount: Number(item.assignedTapCount),
      score: Number(item.score),
      xCount: Number(item.xCount || 0),
      countedHitCount: item.countedHitCount !== null && Number.isFinite(Number(item.countedHitCount)) ? Number(item.countedHitCount) : null,
      uncountedHitCount: item.uncountedHitCount !== null && Number.isFinite(Number(item.uncountedHitCount)) ? Number(item.uncountedHitCount) : null,
      maximumCountedHits: item.maximumCountedHits !== null && Number.isFinite(Number(item.maximumCountedHits)) ? Number(item.maximumCountedHits) : null,
      ringCounts: item.ringCounts && typeof item.ringCounts === "object" ? item.ringCounts : {},
      scoreValues: Array.isArray(item.scoreValues) ? item.scoreValues.map(Number).filter(Number.isFinite) : [],
      maximumPossiblePoints: Number(item.maximumPossiblePoints || 0),
      performancePercentage: item.performancePercentage !== null && Number.isFinite(Number(item.performancePercentage)) ? Number(item.performancePercentage) : null,
      previousPerformancePercentage: item.previousPerformancePercentage !== null && Number.isFinite(Number(item.previousPerformancePercentage)) ? Number(item.previousPerformancePercentage) : null,
      bestHistoricalPerformancePercentage: item.bestHistoricalPerformancePercentage !== null && Number.isFinite(Number(item.bestHistoricalPerformancePercentage)) ? Number(item.bestHistoricalPerformancePercentage) : null,
      missCount: item.missCount !== null && Number.isFinite(Number(item.missCount)) ? Number(item.missCount) : null,
      missesDetermination: clean(item.missesDetermination),
    }));
  }

  function numericRegionMeasurements(result) {
    const scoring = result && result.scoring || {};
    if (!["numeric_regions", "penalty_regions", "mixed_regions"].includes(scoring.model) || !Array.isArray(scoring.regionResults)) return [];
    const rows = scoring.regionResults.map(item => ({
      regionId: clean(item && item.regionId),
      label: clean(item && item.label),
      value: item && item.value !== null && item.value !== undefined ? Number(item.value) : null,
      hitCount: Number(item && item.hitCount),
      points: Number(item && item.points),
    })).filter(item => item.regionId && item.label && Number.isFinite(item.hitCount) && Number.isFinite(item.points) && (item.value === null || Number.isFinite(item.value)));
    const regionPoints = rows.reduce((sum, item) => sum + item.points, 0);
    const classifications = Array.isArray(result && result.classifications) ? result.classifications : [];
    const outsidePoints = classifications
      .filter(item => clean(item && item.regionId) === "outside")
      .reduce((sum, item) => sum + Number(item && item.value || 0), 0);
    return rows.length && Math.abs(regionPoints + outsidePoints - Number(scoring.total)) < 0.000001 ? rows : [];
  }

  function measuredNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && Number.isInteger(number) ? String(number) : (Number.isFinite(number) ? String(Math.round(number * 10) / 10) : "—");
  }

  function safeDomToken(value) {
    return String(value || "repeated-objects").replace(/[^a-zA-Z0-9_-]+/g, "-");
  }

  function numericObjectResultsMarkup(result, session = {}, compactClass = "contract") {
    const objects = numericObjectMeasurements(result);
    if (!objects.length) return "";
    const accordionId = `${compactClass}-${safeDomToken(session.sessionId || runtimeId())}`;
    const selectors = objects.map((item, index) => {
      const parts = objectLabelParts(item.label);
      const title = parts.location ? `${parts.group} ${parts.location}` : item.label;
      const capped = item.maximumCountedHits !== null;
      const performance = item.performancePercentage === null ? "—" : `${measuredNumber(item.performancePercentage)}%`;
      const selectorValue = capped
        ? `${measuredNumber(item.countedHitCount)} / ${measuredNumber(item.assignedTapCount)} counted`
        : (item.performancePercentage === null ? `${measuredNumber(item.assignedTapCount)} tap${item.assignedTapCount === 1 ? "" : "s"}` : performance);
      return `<button type="button" data-repeated-object-trigger="${index}" data-disclosure-control="true" aria-expanded="false"><span>${escapeHtml(title)}</span><strong>${escapeHtml(selectorValue)}</strong><i data-disclosure-indicator="true" aria-hidden="true"></i></button>`;
    }).join("");
    const panels = objects.map((item, index) => {
      const parts = objectLabelParts(item.label);
      const title = parts.location ? `${parts.group} ${parts.location}` : item.label;
      const rings = item.scoreValues.map(value => `<span><b>${escapeHtml(measuredNumber(value))}s</b><strong>${escapeHtml(Number(item.ringCounts[String(value)] || 0))}</strong></span>`).join("");
      const misses = item.missesDetermination === "not_determinable_without_object_assignment" ? "—" : measuredNumber(item.missCount);
      const capped = item.maximumCountedHits !== null;
      const totals = capped
        ? `<span><b>Observed</b><strong>${escapeHtml(measuredNumber(item.assignedTapCount))}</strong></span><span><b>Counted</b><strong>${escapeHtml(measuredNumber(item.countedHitCount))}</strong></span><span><b>Extra</b><strong>${escapeHtml(measuredNumber(item.uncountedHitCount))}</strong></span><span><b>Score</b><strong>${escapeHtml(measuredNumber(item.score))}</strong></span>`
        : `<span><b>Taps</b><strong>${escapeHtml(item.assignedTapCount)}</strong></span><span><b>Numeric points</b><strong>${escapeHtml(measuredNumber(item.score))}</strong></span>${item.xCount ? `<span><b>X hits</b><strong>${escapeHtml(measuredNumber(item.xCount))}</strong></span>` : ""}<span><b>Outside</b><strong>${escapeHtml(misses)}</strong></span>`;
      const history = [
        item.previousPerformancePercentage === null ? "" : `<span>Previous <strong>${escapeHtml(measuredNumber(item.previousPerformancePercentage))}%</strong></span>`,
        item.bestHistoricalPerformancePercentage === null ? "" : `<span>Best <strong>${escapeHtml(measuredNumber(item.bestHistoricalPerformancePercentage))}%</strong></span>`
      ].filter(Boolean).join("");
      return `<article data-repeated-object-panel="${index}" aria-label="${escapeHtml(title)} scoring detail" hidden><h3>${escapeHtml(title)}</h3><div class="contract-numeric-object-totals">${totals}</div><div class="contract-numeric-object-rings">${rings}</div>${capped ? `<p><span>Counted-hit cap</span><strong>${escapeHtml(measuredNumber(item.maximumCountedHits))} max</strong><small>Every observation is preserved; extra hits score 0.</small></p>` : `<p><span>SCZN3 Performance %</span><strong>${escapeHtml(item.performancePercentage === null ? "—" : `${measuredNumber(item.performancePercentage)}%`)}</strong></p>`}${history ? `<div class="contract-numeric-object-history">${history}</div>` : ""}</article>`;
    }).join("");
    return `<section class="contract-repeated-object-results" data-repeated-object-accordion="${escapeHtml(accordionId)}" aria-label="Per-object measured scoring detail"><div class="contract-repeated-object-selectors" aria-label="Scored objects">${selectors}</div><div class="contract-repeated-object-panels">${panels}</div></section>`;
  }

  function aggregateValueDistributionMarkup(result) {
    const rows = result && result.scoring && Array.isArray(result.scoring.valueDistribution) ? result.scoring.valueDistribution : [];
    if (!rows.length) return "";
    const items = rows.map(item => {
      const resultText = item.value === null
        ? `${measuredNumber(item.hitCount)} hit${Number(item.hitCount) === 1 ? "" : "s"} · non-numeric`
        : `${measuredNumber(item.hitCount)} hit${Number(item.hitCount) === 1 ? "" : "s"} · ${measuredNumber(item.points)} points`;
      return `<span><b>${escapeHtml(item.label)}</b><strong>${escapeHtml(resultText)}</strong></span>`;
    }).join("");
    return `<section class="contract-object-groups" aria-label="Aggregate ring distribution"><article class="contract-object-group"><h3>Aggregate ring distribution</h3><div>${items}</div></article></section>`;
  }

  function objectScoreboardMarkup(result) {
    const scoring = result && result.scoring || {};
    const presentation = scoring.objectScoreboard;
    if (!presentation || presentation.mode !== "score_x") return "";
    const objects = numericObjectMeasurements(result);
    if (!objects.length) return "";
    const rows = objects.map(item => `<article><h3>${escapeHtml(item.label)}</h3><strong>${escapeHtml(measuredNumber(item.score))}-${escapeHtml(measuredNumber(item.xCount))}X</strong><small>${escapeHtml(measuredNumber(item.assignedTapCount))} hit${item.assignedTapCount === 1 ? "" : "s"}</small></article>`).join("");
    const total = `${measuredNumber(scoring.total)}-${measuredNumber(scoring.xCount)}X`;
    return `<section class="contract-object-scoreboard" aria-label="${escapeHtml(presentation.heading)}"><h2>${escapeHtml(presentation.heading)}</h2><div class="contract-object-scoreboard-rows">${rows}</div><footer><span>${escapeHtml(presentation.totalScoreLabel)}:&nbsp;</span><strong>${escapeHtml(total)}</strong></footer></section>`;
  }

  function numericRegionResultsMarkup(result) {
    const rows = numericRegionMeasurements(result);
    if (!rows.length) return "";
    const totalHits = rows.reduce((sum, item) => sum + item.hitCount, 0);
    const totalPoints = rows.reduce((sum, item) => sum + item.points, 0);
    const totalTaps = Number(result && result.scoring && result.scoring.observationCount);
    const missed = Number.isFinite(totalTaps) ? Math.max(0, totalTaps - totalHits) : Number(result && result.scoring && result.scoring.outsideCount || 0);
    const reconciledTotal = totalHits + missed;
    if (clean(result && result.scoring && result.scoring.model) === "penalty_regions") {
      const duplicateLabels = rows.reduce((counts, item) => counts.set(item.label, Number(counts.get(item.label) || 0) + 1), new Map());
      const displayLabel = item => {
        if (Number(duplicateLabels.get(item.label)) < 2) return item.label;
        if (/(?:^|_)torso$/.test(item.regionId)) return `${item.label} Torso`;
        if (/(?:^|_)head$/.test(item.regionId)) return `${item.label} Head`;
        return item.label;
      };
      const distribution = rows.map(item => `<li><strong>${escapeHtml(displayLabel(item))}</strong><span>${escapeHtml(measuredNumber(item.hitCount))} tap${item.hitCount === 1 ? "" : "s"}</span></li>`).join("");
      return `<details class="contract-numeric-region-results contract-penalty-region-results" data-numeric-region-detail="true"><summary data-disclosure-control="true"><span class="contract-distribution-title">Scoring distribution</span><span class="contract-disclosure-instruction contract-disclosure-instruction--closed">Tap to view <b aria-hidden="true">›</b></span><span class="contract-disclosure-instruction contract-disclosure-instruction--open">Tap to close <b aria-hidden="true">›</b></span></summary><div><ul>${distribution}<li><strong>Missed</strong><span>${escapeHtml(measuredNumber(missed))} tap${missed === 1 ? "" : "s"} · 0 points</span></li></ul></div></details>`;
    }
    const outsideCountOnly = clean(result && result.scoring && result.scoring.model) === "mixed_regions";
    const outsideLabel = outsideCountOnly ? clean(result && result.smartTargetTreatment && result.smartTargetTreatment.outsideLabel) || "Outside Scoring Area" : "Missed";
    const outsideValue = outsideCountOnly ? "Count only" : "0";
    const outsidePoints = outsideCountOnly ? "Count only" : "—";
    return `<details class="contract-numeric-region-results" data-numeric-region-detail="true"><summary data-disclosure-control="true"><span class="contract-distribution-title">Scoring distribution</span><span class="contract-disclosure-instruction contract-disclosure-instruction--closed">Tap to view <b aria-hidden="true">›</b></span><span class="contract-disclosure-instruction contract-disclosure-instruction--open">Tap to close <b aria-hidden="true">›</b></span></summary><div><table><thead><tr><th scope="col">Region</th><th scope="col">Value</th><th scope="col">Taps</th><th scope="col">Points</th></tr></thead><tbody>${rows.map(item => `<tr><th scope="row">${escapeHtml(shooterFacingNumericRegionLabel(result, item))}</th><td>${item.value === null ? "—" : escapeHtml(measuredNumber(item.value))}</td><td>${escapeHtml(measuredNumber(item.hitCount))}</td><td>${item.value === null ? "Count only" : escapeHtml(measuredNumber(item.points))}</td></tr>`).join("")}<tr><th scope="row">${escapeHtml(outsideLabel)}</th><td>${outsideValue}</td><td>${escapeHtml(measuredNumber(missed))}</td><td>${outsidePoints}</td></tr><tr class="is-total"><th scope="row">Total</th><td>—</td><td>${escapeHtml(measuredNumber(reconciledTotal))}</td><td>${escapeHtml(measuredNumber(totalPoints))}</td></tr></tbody></table></div></details>`;
  }

  function shooterFacingNumericRegionLabel(result, item) {
    const competition = result && result.smartTargetTreatment && result.smartTargetTreatment.competitionAuthority;
    if (clean(competition && competition.disciplineId) !== "uspsa-cardboard-target") return clean(item && item.label);
    const regionId = clean(item && item.regionId);
    const governedLabels = competition && competition.regionLabels;
    return clean(governedLabels && governedLabels[regionId]) || ({
      a_head: "Head A",
      b_head: "Head B (scored C)",
      b_head_scored_c: "Head B (scored C)",
      a_body: "Body A",
      c_body: "Body C",
      d_body: "Body D"
    })[regionId] || clean(item && item.label);
  }

  function participantResultsMarkup(result) {
    const participants = result && result.scoring && Array.isArray(result.scoring.participantResults)
      ? result.scoring.participantResults
      : [];
    if (!participants.length) return "";
    return `<section class="contract-participant-results" aria-label="Participant final scores">${participants.map(participant => `<article><header><span>${escapeHtml(participant.label)}</span><strong>${escapeHtml(measuredNumber(participant.finalScore))}</strong><small>Final Score</small></header><div>${(participant.objectSubtotals || []).map(object => `<span><b>${escapeHtml(object.label)}</b><strong>${escapeHtml(measuredNumber(object.score))}</strong><small>${escapeHtml(object.recordedShots)} of ${escapeHtml(object.shotQuota)} shots</small></span>`).join("")}</div></article>`).join("")}</section>`;
  }

  function objectTapSummary(result) {
    const scoring = result && result.scoring || {};
    if (!Array.isArray(scoring.objectResults) || !scoring.objectResults.length) return null;
    const hitRate = result.sczn3Metrics && result.sczn3Metrics.hitRate;
    const total = Number((hitRate && hitRate.governedShotCount) ?? scoring.observationCount ?? 0);
    const hits = Number((hitRate && hitRate.validHitCount) ?? Math.max(0, total - Number(scoring.outsideCount || 0)));
    return { hits, misses: Math.max(0, total - hits), total };
  }

  function shotTapSummary(result) {
    const scoring = result && result.scoring || {};
    const hitRate = result && result.sczn3Metrics && result.sczn3Metrics.hitRate;
    if (!hitRate || !Number.isFinite(Number(hitRate.governedShotCount)) || !Number.isFinite(Number(hitRate.validHitCount))) return null;
    const total = Number(hitRate.governedShotCount);
    const hits = Number(hitRate.validHitCount);
    return { hits, misses: Math.max(0, total - hits), total, outsideCount: Number(scoring.outsideCount || 0) };
  }

  function objectTapSummaryMarkup(result, includeCoverage = false) {
    const counts = objectTapSummary(result);
    if (!counts) return "";
    const coverage = result && result.sczn3Metrics && result.sczn3Metrics.objectCoverage;
    const vocabulary = naturalObjectVocabulary(result);
    const completion = objectCompletionLanguage(result);
    const outsideLabel = outsideCountingLabel(result).toUpperCase();
    const objectCount = includeCoverage && coverage && Number(coverage.scorableObjectCount) > 0
      ? `<i aria-hidden="true">|</i><strong>${escapeHtml(coverage.objectsHit)} OF ${escapeHtml(coverage.scorableObjectCount)} ${escapeHtml(vocabulary.plural.toUpperCase())} ${escapeHtml(completion.verbPast.toUpperCase())}</strong>`
      : "";
    return `<section class="contract-tap-summary" aria-label="Shooter-facing session result: hit taps, ${escapeHtml(outsideLabel.toLowerCase())}, total taps, and ${escapeHtml(vocabulary.plural)} hit"><strong>${escapeHtml(counts.hits)} HIT TAPS</strong><i aria-hidden="true">|</i><strong>${escapeHtml(counts.misses)} ${escapeHtml(outsideLabel)}</strong><i aria-hidden="true">|</i><strong>${escapeHtml(counts.total)} TOTAL TAPS</strong>${objectCount}</section>`;
  }

  function numericTapSummaryMarkup(result) {
    const counts = shotTapSummary(result);
    if (!counts) return "";
    const mixedCountOnly = clean(result && result.scoring && result.scoring.model) === "mixed_regions";
    const outsideLabel = mixedCountOnly ? outsideCountingLabel(result).toUpperCase() : "MISSED";
    return `<section class="contract-tap-summary" aria-label="Hit taps, ${escapeHtml(outsideLabel.toLowerCase())}, and total taps"><strong>${escapeHtml(counts.hits)} HIT TAPS</strong><i aria-hidden="true">|</i><strong>${escapeHtml(counts.misses)} ${escapeHtml(outsideLabel)}</strong><i aria-hidden="true">|</i><strong>${escapeHtml(counts.total)} TOTAL TAPS</strong></section>`;
  }

  function countingTapSummaryMarkup(result) {
    const counts = shotTapSummary(result);
    if (!counts) return "";
    const outsideLabel = outsideCountingLabel(result).toUpperCase();
    return `<section class="contract-tap-summary" aria-label="Hit taps, ${escapeHtml(outsideLabel.toLowerCase())}, and total taps"><strong>${escapeHtml(counts.hits)} HIT TAPS</strong><i aria-hidden="true">|</i><strong>${escapeHtml(counts.outsideCount)} ${escapeHtml(outsideLabel)}</strong><i aria-hidden="true">|</i><strong>${escapeHtml(counts.total)} TOTAL TAPS</strong></section>`;
  }

  function targetScoringDetailMarkup(result) {
    const scoring = result && result.scoring || {};
    if (result && result.missionFamily !== "targetScoring" || scoring.status === "not_applicable") return "";
    const rows = targetScoringRows(result);
    if (!rows.length) return "";
    return `<section class="contract-cue-records contract-scoring-details" aria-label="Target scoring detail">${rows.map(row => `<div><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.displayValue)}</strong></div>`).join("")}</section>`;
  }

  function regionCountDetailsMarkup(result) {
    const scoring = result && result.scoring || {};
    const rows = targetScoringRows(result);
    if (!rows.length) return "";
    return `<details class="contract-numeric-region-results contract-region-count-details" data-region-count-details="true"><summary data-disclosure-control="true" aria-expanded="false"><span class="contract-distribution-title">Region details</span><span class="contract-disclosure-instruction contract-disclosure-instruction--closed">Tap to view <b aria-hidden="true">›</b></span><span class="contract-disclosure-instruction contract-disclosure-instruction--open">Tap to close <b aria-hidden="true">›</b></span></summary><div><table><thead><tr><th scope="col">Region</th><th scope="col">Taps</th></tr></thead><tbody>${rows.map(row => `<tr><th scope="row">${escapeHtml(row.label)}</th><td>${escapeHtml(measuredNumber(row.value))}</td></tr>`).join("")}<tr class="is-total"><th scope="row">Total</th><td>${escapeHtml(measuredNumber(scoring.observationCount))}</td></tr></tbody></table></div></details>`;
  }

  function recordedTapSummaryMarkup(result) {
    const counts = shotTapSummary(result);
    if (!counts) return "";
    return `<section class="contract-tap-summary contract-total-taps-only" aria-label="Total recorded taps"><strong>${escapeHtml(counts.total)} TOTAL TAPS</strong></section>`;
  }

  function shooterResultRows(result) {
    if (!result || typeof result !== "object") return [];
    if (result.missionFamily === "targetScoring") {
      if (!result.scoring || result.scoring.status === "not_applicable") return [];
      return targetScoringRows(result)
        .filter(row => Number(row.value) > 0)
        .map(row => ({ label: row.label, value: row.displayValue }));
    }
    if (result.missionFamily === "qualificationCourseEvaluation") {
      return (Array.isArray(result.stages) ? result.stages : []).map(record => ({
        label: `${record.cue.stageTitle} · ${record.cue.distance.value} ${record.cue.distance.unit}`,
        value: `${record.stageScore} points · ${record.reconciliationState}`
      }));
    }
    if (result.missionFamily === "precisionRingScore" && result.scoring) {
      const regionCounts = result.scoring.regionCounts || result.scoring.ringCounts || {};
      return Object.entries(regionCounts).filter(([, value]) => Number(value) > 0).map(([label, value]) => ({
        label: String(label).replaceAll("_", " "), value: String(value)
      }));
    }
    if (Array.isArray(result.breakdown)) {
      return result.breakdown.map(item => ({
        label: clean(item.label || item.name || item.zone) || "Result",
        value: clean(item.displayValue || item.value || item.count)
      })).filter(item => item.value);
    }
    return [];
  }

  function isQtPrinter13Result(result) {
    return /^qt_printer13_product_/.test(clean(result && result.target && result.target.id));
  }

  function hitRateMarkup(result, session = {}) {
    const metrics = result && result.sczn3Metrics;
    const hitRate = metrics && metrics.status === "complete" ? metrics.hitRate : null;
    if (!hitRate || !Number.isFinite(Number(hitRate.percentage))) return "";
    const coverage = metrics.objectCoverage;
    const vocabulary = naturalObjectVocabulary(result);
    const treatment = result && result.smartTargetTreatment || {};
    const completion = objectCompletionLanguage(result);
    const intelligence = Array.isArray(treatment.intelligence) ? treatment.intelligence : [];
    const reportsTapAccuracy = intelligence.includes("tap_accuracy");
    const hitAreaLabel = shooterFacingCountingLabel(treatment.hitAreaLabel, vocabulary.plural);
    const publisherHasScore = result && result.scoring && ["numeric_regions", "penalty_regions", "mixed_regions"].includes(result.scoring.model);
    const progress = session && session.sczn3Progress;
    const previous = progress && progress.previous;
    const comparison = previous && Number.isFinite(Number(previous.percentage))
      ? `<div class="contract-session-progress"><span>Previous on this target</span><strong>${escapeHtml(previous.percentage)}%</strong><small>${Number(progress.percentagePointChange) >= 0 ? "+" : ""}${escapeHtml(progress.percentagePointChange)} percentage points</small></div>`
      : "";
    if (coverage && Number(coverage.scorableObjectCount) > 0) {
      const validHitCount = Number(hitRate.validHitCount);
      const governedShotCount = Number(hitRate.governedShotCount);
      const objectsHit = Number(coverage.objectsHit);
      const scorableObjectCount = Number(coverage.scorableObjectCount);
      const completionPercentage = scorableObjectCount > 0
        ? measuredNumber(objectsHit / scorableObjectCount * 100)
        : "0";
      const completionLabel = completion.label || `${vocabulary.singular.split(/\s+/).map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ")} Completion`;
      return `<section class="contract-combined-score-rate contract-object-performance-truths${publisherHasScore ? " is-supplemental" : ""}" aria-label="Tap accuracy and ${escapeHtml(vocabulary.singular)} completion"><div><span>Tap Accuracy:</span><strong>${escapeHtml(hitRate.percentage)}%</strong><small>— ${escapeHtml(validHitCount)} of ${escapeHtml(governedShotCount)} taps landed on ${escapeHtml(vocabulary.plural)}</small></div><div><span>${escapeHtml(completionLabel)}:</span><strong>${escapeHtml(completionPercentage)}%</strong><small>— ${escapeHtml(objectsHit)} of ${escapeHtml(scorableObjectCount)} ${escapeHtml(vocabulary.plural)} ${escapeHtml(completion.verbPast)}</small></div>${comparison}</section>`;
    }
    const accuracyBasis = reportsTapAccuracy
      ? `<small>— ${escapeHtml(hitRate.validHitCount)} of ${escapeHtml(hitRate.governedShotCount)} taps landed in ${escapeHtml(hitAreaLabel)}</small>`
      : "";
    return `<section class="contract-hit-rate${publisherHasScore ? " is-supplemental" : ""}" aria-label="${reportsTapAccuracy ? "Tap accuracy" : "SCZN3 measured hit rate"}"><span>${reportsTapAccuracy ? "Tap Accuracy" : "SCZN3 Hit Rate"}</span><strong>${escapeHtml(hitRate.percentage)}%</strong>${accuracyBasis}${comparison}</section>`;
  }

  function objectDistributionDetailMarkup(result) {
    const treatment = result && result.smartTargetTreatment || {};
    const intelligence = Array.isArray(treatment.intelligence) ? treatment.intelligence : [];
    const sections = [];
    const counts = result && result.scoring && result.scoring.regionCounts || {};
    if (intelligence.includes("bullseye_ring_distribution")) {
      const tiers = [
        ["Center", /_center$/],
        ["Inner Ring", /_inner_ring$/],
        ["Outer Ring", /_outer_ring$/],
      ].map(([label, pattern]) => ({
        label,
        count: Object.entries(counts).reduce((sum, [regionId, value]) => {
          const id = clean(regionId);
          return sum + (id.includes("bullseye") && pattern.test(id) ? Number(value || 0) : 0);
        }, 0),
      }));
      sections.push(`<section class="contract-object-distribution" aria-label="Bullseye center and ring distribution"><strong>Bullseye distribution</strong><span>${tiers.map(item => `${escapeHtml(item.label)} ${escapeHtml(measuredNumber(item.count))}`).join(" · ")}</span></section>`);
    }
    const summaries = result && result.scoring && Array.isArray(result.scoring.summaryResults) ? result.scoring.summaryResults : [];
    summaries.forEach(summary => {
      const groups = Array.isArray(summary.groups) ? summary.groups : [];
      if (!groups.length) return;
      const items = groups.map(item => `${escapeHtml(item.label)} ${escapeHtml(measuredNumber(item.observationCount))} taps · ${escapeHtml(measuredNumber(item.objectsHit))}/${escapeHtml(measuredNumber(item.objectCount))} engaged`);
      sections.push(`<section class="contract-object-distribution" data-summary-dimension="${escapeHtml(summary.dimensionId)}" aria-label="${escapeHtml(summary.label)}"><strong>${escapeHtml(summary.label)}</strong><span>${items.join(" · ")}</span></section>`);
    });
    return sections.join("");
  }

  function shotPatternMarkup(result, session = {}) {
    const pattern = result && result.sczn3Metrics && result.sczn3Metrics.shotPattern;
    const center = pattern && pattern.center;
    const dispersion = pattern && pattern.dispersion;
    if (!center || !dispersion || !Number.isFinite(Number(center.xNorm)) || !Number.isFinite(Number(center.yNorm))) return "";
    const centerLabel = `${clean(center.verticalBand) || "middle"} ${clean(center.horizontalBand) || "center"}`;
    const spread = dispersion.status === "complete" && Number.isFinite(Number(dispersion.rmsRadiusNorm))
      ? `${measuredNumber(Number(dispersion.rmsRadiusNorm) * 100)}% normalized RMS radius`
      : "One tap — spread needs another tap";
    const comparison = session && session.sczn3Progress && session.sczn3Progress.shotPatternComparison;
    const movement = comparison && comparison.status === "comparable"
      ? `<div class="contract-session-progress"><span>Since your previous session</span><strong>${escapeHtml(measuredNumber(Number(comparison.centerMovementNorm) * 100))}% pattern-center movement</strong><small>${Number(comparison.rmsRadiusChangeNorm) < 0 ? "Tighter" : Number(comparison.rmsRadiusChangeNorm) > 0 ? "Wider" : "Same spread"} by ${escapeHtml(measuredNumber(Math.abs(Number(comparison.rmsRadiusChangeNorm || 0)) * 100))}% normalized radius</small></div>`
      : "";
    return `<section class="contract-shot-pattern" aria-label="SCZN3 measured shot pattern"><span>THE CENTER OF YOUR SHOT PATTERN</span><strong>${escapeHtml(centerLabel.toUpperCase())}</strong><small>${escapeHtml(pattern.tapCount)} tap${Number(pattern.tapCount) === 1 ? "" : "s"} · ${escapeHtml(spread)} · measured in target-image coordinates</small>${movement}</section>`;
  }

  function combinedNumericSummaryMarkup(result, resultSummary, session = {}) {
    const metrics = result && result.sczn3Metrics;
    const hitRate = metrics && metrics.status === "complete" ? metrics.hitRate : null;
    if (!hitRate || !Number.isFinite(Number(hitRate.percentage))) return "";
    const progress = session && session.sczn3Progress;
    const previous = progress && progress.previous;
    const scoreComparison = previous && Number.isFinite(Number(previous.targetScore))
      ? `<small>${Number(progress.scoreChange) >= 0 ? "+" : ""}${escapeHtml(measuredNumber(progress.scoreChange))} pts vs previous${progress.best && progress.best.targetScore ? ` · Best ${escapeHtml(measuredNumber(progress.best.targetScore.value))}` : ""}</small>`
      : "";
    const rateComparison = previous && Number.isFinite(Number(previous.percentage))
      ? `<small>${Number(progress.percentagePointChange) >= 0 ? "+" : ""}${escapeHtml(progress.percentagePointChange)} pts vs previous${progress.best && progress.best.hitRate ? ` · Best ${escapeHtml(progress.best.hitRate.percentage)}%` : ""}</small>`
      : "";
    const taps = objectTapSummary(result) ? objectTapSummaryMarkup(result, true) : numericTapSummaryMarkup(result);
    return `<section class="contract-combined-score-rate" aria-label="Target score and SCZN3 Hit Rate"><div><span>${escapeHtml(resultSummary.label)}</span><strong>${escapeHtml(resultSummary.value)}</strong>${scoreComparison}</div><div><span>SCZN3 Hit Rate</span><strong>${escapeHtml(hitRate.percentage)}%</strong>${rateComparison}</div></section>${taps}`;
  }

  function shooterFacingResultMarkup(result, resultSummary, session = {}) {
    const selectedMode = result && result.scoring && result.scoring.scoringMode;
    const modeMarkup = selectedMode && clean(selectedMode.label)
      ? `<p class="contract-claim-grade"><span>Scoring mode</span><strong>${escapeHtml(selectedMode.label)}</strong></p>`
      : "";
    const objectSummary = objectTapSummary(result);
    const publisherHasScore = result && result.scoring && ["numeric_regions", "penalty_regions", "mixed_regions"].includes(result.scoring.model);
    if (objectSummary && !publisherHasScore) {
      const objectDetail = isUsmcThreatResult(result) ? zoneDetailsMarkup(result) : objectGroupsMarkup(result);
      return `${modeMarkup}${objectTapSummaryMarkup(result)}${hitRateMarkup(result, session)}${cumulativeColorTotalsMarkup(result) || objectDetail}${subsetResultsMarkup(result)}`;
    }
    const numericObjects = numericObjectMeasurements(result);
    const numericRegions = numericRegionMeasurements(result);
    const participantMarkup = participantResultsMarkup(result);
    const rows = numericObjects.length ? [] : shooterResultRows(result);
    const detail = rows.length
      ? `<div class="contract-session-result-rows" aria-label="Session result breakdown">${rows.map(row => `<div><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}</div>`
      : "";
    const hitRateFirst = result && result.missionFamily === "targetScoring" && result.scoring && !["numeric_regions", "penalty_regions", "mixed_regions"].includes(result.scoring.model);
    const publisherResult = `<section class="contract-result contract-session-result" aria-label="Shooter-facing session result"><span>${escapeHtml(resultSummary.label)}</span><strong class="contract-session-result-primary">${escapeHtml(resultSummary.value)}</strong><small>${escapeHtml(resultSummary.detail)}</small>${detail}</section>`;
    if (participantMarkup) return `${modeMarkup}${participantMarkup}${numericTapSummaryMarkup(result)}${numericObjectResultsMarkup(result, session)}`;
    if (objectSummary && numericObjects.length) return `${modeMarkup}${combinedNumericSummaryMarkup(result, resultSummary, session)}${aggregateValueDistributionMarkup(result)}${numericObjectResultsMarkup(result, session)}`;
    if (publisherHasScore && numericRegions.length && !numericObjects.length) return `${modeMarkup}${combinedNumericSummaryMarkup(result, resultSummary, session)}${numericRegionResultsMarkup(result)}`;
    if (objectSummary) {
      const objectDetail = isUsmcThreatResult(result) ? zoneDetailsMarkup(result) : objectGroupsMarkup(result);
      return `${modeMarkup}${publisherResult}${objectTapSummaryMarkup(result)}${hitRateMarkup(result, session)}${objectDetail}`;
    }
    if (hitRateFirst && result.scoring.status === "complete") return `${modeMarkup}${countingTapSummaryMarkup(result)}${hitRateMarkup(result, session)}${regionCountDetailsMarkup(result)}`;
    return hitRateFirst ? `${modeMarkup}${hitRateMarkup(result, session)}${publisherResult}` : `${modeMarkup}${publisherResult}${hitRateMarkup(result, session)}`;
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
    if (result.missionFamily === "smartEvidenceCapture") return {
      label: "Total Taps",
      value: String(result.observations.length),
      detail: `${result.observations.length} shooter tap${result.observations.length === 1 ? "" : "s"} saved with this target`
    };
    if (result.missionFamily === "precisionRingScore") return { label: "Open Score", value: String(result.scoring.total), detail: result.scoring.completion === "open" ? "Shooter-controlled completion" : "Shooter declared complete" };
    if (result.missionFamily === "targetScoring") {
      const scoring = result.scoring || {};
      const rows = targetScoringRows(result);
      if (scoring.status === "not_applicable") return { label: "Target Result", value: `${scoring.observationCount || 0} recorded`, detail: "Printer defines no score · evidence preserved" };
      if (Array.isArray(scoring.participantResults) && scoring.participantResults.length) return {
        label: "Participant Scores",
        value: scoring.participantResults.map(item => `${item.label}: ${measuredNumber(item.finalScore)}`).join(" · "),
        detail: `${scoring.observationCount} printer-course shots`
      };
      if (["numeric_regions", "penalty_regions", "mixed_regions"].includes(scoring.model)) {
        const nonNumericX = clean(scoring.xScoring && scoring.xScoring.mode) === "separate_non_numeric";
        const derivedNumericX = clean(scoring.xScoring && scoring.xScoring.mode) === "sczn3_derived_numeric";
        return {
          label: scoring.model === "penalty_regions" ? "Penalty Total" : (nonNumericX ? "Numeric Target Score" : (derivedNumericX ? "SCZN3 Target Score" : "Target Score")),
          value: scoring.xCount ? (nonNumericX ? `${scoring.total} points · ${scoring.xCount} X` : `${scoring.total}-${scoring.xCount}X`) : String(scoring.total),
          detail: `${scoring.scoringMode && clean(scoring.scoringMode.label) ? `${scoring.scoringMode.label} scoring · ` : ""}${scoring.observationCount} governed taps${nonNumericX ? " · X remains non-numeric" : ""}`
        };
      }
      if (scoring.model === "ordered_objects" && hasGovernedOrdering(result)) {
        const vocabulary = naturalObjectVocabulary(result);
        return { label: `${vocabulary.titleSingular} Sequence`, value: `${scoring.completedInOrder} in order`, detail: scoring.nextExpectedObjectId ? `Next: ${vocabulary.titleSingular} ${scoring.nextExpectedObjectId}` : "Sequence complete" };
      }
      if (scoring.model === "multiple_bulls") {
        const objectResults = Array.isArray(scoring.objectResults) ? scoring.objectResults : [];
        const hits = objectResults.filter(item => item.hit === true).length;
        const vocabulary = naturalObjectVocabulary(result);
        return { label: vocabulary.titlePlural, value: `${hits} of ${objectResults.length} hit`, detail: `${scoring.observationCount} total taps` };
      }
      const detail = rows.map(row => `${row.label}: ${row.value}`).join(" · ");
      return { label: "Target Areas", value: `${scoring.observationCount} taps`, detail: detail || "No governed area hit" };
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
    if (result.diagnosticOverlay && Array.isArray(result.diagnosticOverlay.records)) {
      const overlay = result.diagnosticOverlay;
      const rows = Object.entries(overlay.labelCounts || {}).map(([label, count]) => `<div><span>${escapeHtml(label)} <small>(publisher-printed)</small></span><strong>${escapeHtml(count)} tap${Number(count) === 1 ? "" : "s"}</strong></div>`).join("");
      return `<p class="contract-claim-grade"><strong>QT ${escapeHtml(String(overlay.handedness || "").replace(/^./, value => value.toUpperCase()))}-Hand Diagnostic Labels</strong><br />Publisher-printed label match alongside governed ring scoring. SCZN3 does not claim cause or prescribe a correction.</p><section class="contract-cue-records" aria-label="QT publisher diagnostic label distribution">${rows || "<div><span>Publisher label match</span><strong>No mapped taps</strong></div>"}</section><small>Causal diagnosis: Not established · Correction: Not provided</small>`;
    }
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

  function approvedResultContent(result, session = {}) {
    if (!contractIdentity(result) || !targetIdentity(result) || !familyReconciles(result)) return "";
    const resultSummary = summary(result);
    const shotPattern = result.missionFamily === "targetScoring" || isQtPrinter13Result(result) ? "" : shotPatternMarkup(result, session);
    return `${shooterFacingResultMarkup(result, resultSummary, session)}${shotPattern}${cueResultMarkup(result)}${qualificationResultMarkup(result)}${diagnosticResultMarkup(result)}${decisionResultMarkup(result)}${progressionResultMarkup(result)}${collectionHandResultMarkup(result)}`;
  }

  function approvedResultFamily(result) {
    if (result && result.missionFamily === "smartEvidenceCapture") return "evidence-only";
    if (result && result.missionFamily === "qualificationCourseEvaluation") return "qualification-pass-fail";
    if (result && result.missionFamily === "targetScoring") {
      const model = clean(result.scoring && result.scoring.model);
      return ["numeric_regions", "penalty_regions", "mixed_regions"].includes(model) ? "highest-score-wins" : "counts-only";
    }
    if (result && result.missionFamily === "precisionRingScore") return "highest-score-wins";
    return "counts-only";
  }

  function approvedResultComponent(result, session = {}) {
    if (!global.SCZN3SECComponents || typeof global.SCZN3SECComponents.Result !== "function") return "";
    const contentHtml = approvedResultContent(result, session);
    if (!contentHtml) return "";
    return global.SCZN3SECComponents.Result({ family: approvedResultFamily(result), contentHtml });
  }

  function isUsmEligible(value) {
    return global.SCZN3USMProofRegistry?.isEligible?.(value) === true;
  }

  function preservedProgressionPoint(session) {
    const result = canonicalResult(session);
    const scoring = result && result.scoring;
    const rows = scoring && Array.isArray(scoring.regionResults) ? scoring.regionResults : [];
    const totalTaps = Number(scoring && scoring.observationCount);
    const target = targetIdentity(result);
    const score = Number(scoring && scoring.total);
    const preservedAt = clean(session && (session.preservedAt || session.savedAt || session.timestamp));
    const preservedTime = Date.parse(preservedAt);
    const hitCounts = rows.map(row => Number(row && row.hitCount));
    const classifications = Array.isArray(result && result.classifications) ? result.classifications : [];
    const governedHitCount = Number(result && result.sczn3Metrics && result.sczn3Metrics.hitRate && result.sczn3Metrics.hitRate.validHitCount);
    const classifiedHitCount = classifications.filter(item => item && item.countsAsHit === true).length;
    const fallbackHitCount = hitCounts.reduce((sum, count) => sum + count, 0);
    const hitTaps = Number.isInteger(governedHitCount) && governedHitCount >= 0
      ? governedHitCount
      : (classifications.length ? classifiedHitCount : fallbackHitCount);
    const scoringModel = clean(scoring && scoring.model);
    if (!target || !isUsmEligible(result) || !["numeric_regions", "penalty_regions", "mixed_regions"].includes(scoringModel) || !Number.isFinite(score) || !Number.isInteger(totalTaps) || totalTaps <= 0 || !rows.length || hitCounts.some(count => !Number.isInteger(count) || count < 0) || !Number.isInteger(hitTaps) || hitTaps < 0 || hitTaps > totalTaps || !Number.isFinite(preservedTime)) return null;
    const regionPointTotal = rows.reduce((sum, row) => sum + Number(row && row.points || 0), 0);
    const outsideCount = Math.max(0, Number(scoring && scoring.outsideCount || 0));
    const outsideClassifications = classifications.filter(item => clean(item && item.regionId) === "outside");
    const outsideCountOnly = outsideCount > 0
      && outsideClassifications.length === outsideCount
      && outsideClassifications.every(item => item && item.value === null);
    const classifiedOutsidePoints = outsideClassifications
      .reduce((sum, item) => sum + Number(item && item.value || 0), 0);
    const outsidePoints = outsideCount > 0 ? (classifications.length ? classifiedOutsidePoints : score - regionPointTotal) : 0;
    const scoringDistribution = rows.map(row => Object.freeze({
      regionId: clean(row && row.regionId),
      label: shooterFacingNumericRegionLabel(result, row) || clean(row && row.regionId).replaceAll("_", " ") || "Scoring region",
      value: row && row.value !== null && row.value !== undefined ? Number(row.value) : null,
      hitCount: Number(row && row.hitCount) || 0,
      points: Number(row && row.points) || 0
    }));
    scoringDistribution.push(Object.freeze({
      regionId: "outside",
      label: outsideCountOnly ? outsideCountingLabel(result) : "Missed",
      value: outsideCountOnly ? null : (outsideCount ? outsidePoints / outsideCount : 0),
      hitCount: outsideCount,
      points: outsidePoints
    }));
    const valueDistribution = Array.isArray(scoring && scoring.valueDistribution)
      ? scoring.valueDistribution.map(row => Object.freeze({
        label: clean(row && row.label) || (row && row.value !== null && row.value !== undefined ? usmNumber(Number(row.value)) : "Count only"),
        value: row && row.value !== null && row.value !== undefined ? Number(row.value) : null,
        hitCount: Number(row && row.hitCount) || 0,
        points: row && row.points !== null && row.points !== undefined ? Number(row.points) : null,
        countsAsX: row && row.countsAsX === true,
        valueAuthority: clean(row && row.valueAuthority)
      }))
      : [];
    const objectResults = Array.isArray(scoring && scoring.objectResults)
      ? scoring.objectResults.map(item => Object.freeze({
        objectId: clean(item && item.objectId),
        label: clean(item && item.label) || "Scoring object",
        observationCount: Number(item && item.observationCount) || 0,
        hitCount: Number(item && item.hitCount) || 0,
        hit: item && item.hit === true,
        score: Number(item && item.score) || 0,
        xCount: Number(item && item.xCount) || 0,
        performancePercentage: Number.isFinite(Number(item && item.performancePercentage)) ? Number(item.performancePercentage) : null,
        ringCounts: Object.freeze(Object.entries(item && item.ringCounts || {}).reduce((snapshot, [label, count]) => {
          snapshot[clean(label)] = Number(count) || 0;
          return snapshot;
        }, {}))
      }))
      : [];
    const treatment = result && result.smartTargetTreatment || {};
    const objectCoverage = result && result.sczn3Metrics && result.sczn3Metrics.objectCoverage;
    const objectDistribution = result && result.sczn3Metrics && result.sczn3Metrics.objectDistribution;
    const competitionAuthority = result && result.smartTargetTreatment && result.smartTargetTreatment.competitionAuthority;
    const isUspsa = clean(competitionAuthority && competitionAuthority.disciplineId) === "uspsa-cardboard-target";
    const aHitTaps = isUspsa ? rows.filter(row => ["a_head", "a_body"].includes(clean(row && row.regionId))).reduce((sum, row) => sum + Number(row.hitCount || 0), 0) : null;
    const elapsedTimeSeconds = Number(result && result.timing && result.timing.elapsedTimeSeconds);
    const snapshot = session && session.matrixSnapshot && typeof session.matrixSnapshot === "object" ? session.matrixSnapshot : {};
    const actualDistance = session && session.sessionDistance && clean(session.sessionDistance.source) === "shooter-entered-session-fact" ? session.sessionDistance : null;
    const equipment = [snapshot.weaponManufacturer || snapshot.weaponCatalogManufacturer, snapshot.weaponModelType || snapshot.weaponCatalogModel, snapshot.weaponModelCaliber || snapshot.weaponCatalogCaliber, snapshot.opticBrand, snapshot.opticModel].map(clean).filter(Boolean).join(" · ") || clean(snapshot.setupName);
    return Object.freeze({
      sessionId: clean(session.sessionId),
      sessionLabel: clean(session.sessionLabel) || `Session #${clean(session.sessionNumber)}`,
      targetId: target.id,
      targetName: target.product.name,
      missionFamily: clean(result && result.missionFamily),
      scoringModel,
      scoringStatus: clean(scoring && scoring.status),
      preservedAt,
      preservedTime,
      score,
      hitTaps,
      totalTaps,
      hitRate: Math.round((hitTaps * 10000) / totalTaps) / 100,
      pointsPerTap: Math.round((score * 10) / totalTaps) / 10,
      misses: outsideCount,
      scoringDistribution: Object.freeze(scoringDistribution),
      valueDistribution: Object.freeze(valueDistribution),
      objectResults: Object.freeze(objectResults),
      objectPresentation: Object.freeze({
        singular: clean(treatment && treatment.shooterFacingVocabulary && treatment.shooterFacingVocabulary.singular) || "object",
        plural: clean(treatment && treatment.shooterFacingVocabulary && treatment.shooterFacingVocabulary.plural) || "objects",
        completionLabel: clean(treatment && treatment.objectCompletionLabel) || "Objects Engaged",
        completionVerbPast: clean(treatment && treatment.objectCompletionVerbPast) || "engaged"
      }),
      objectCoverage: objectCoverage ? Object.freeze({
        objectsHit: Number(objectCoverage.objectsHit) || 0,
        scorableObjectCount: Number(objectCoverage.scorableObjectCount) || 0
      }) : null,
      objectDistribution: objectDistribution ? Object.freeze({
        strongest: objectDistribution.strongest ? Object.freeze({ label: clean(objectDistribution.strongest.label), tapCount: Number(objectDistribution.strongest.tapCount) || 0 }) : null,
        weakest: objectDistribution.weakest ? Object.freeze({ label: clean(objectDistribution.weakest.label), tapCount: Number(objectDistribution.weakest.tapCount) || 0 }) : null,
        countRange: Number(objectDistribution.countRange) || 0,
        standardDeviationTaps: Number(objectDistribution.standardDeviationTaps) || 0,
        evennessPercentage: Number(objectDistribution.evennessPercentage) || 0
      }) : null,
      sessionContext: Object.freeze({
        shooter: clean(session && (session.shooterName || snapshot.shooterName)),
        equipment,
        distance: actualDistance && Number.isFinite(Number(actualDistance.value)) ? `${actualDistance.value} ${clean(actualDistance.unit).toUpperCase() === "M" ? "m" : "yds"}` : ""
      }),
      competition: isUspsa ? Object.freeze({
        disciplineId: "uspsa-cardboard-target",
        scoringModeLabel: clean(scoring && scoring.scoringMode && scoring.scoringMode.label),
        aHitTaps,
        aHitPercentage: Math.round((aHitTaps * 10000) / totalTaps) / 100,
        misses: Number(scoring && scoring.outsideCount) || 0,
        distribution: rows.map(row => Object.freeze({ regionId: clean(row.regionId), label: shooterFacingNumericRegionLabel(result, row), hitCount: Number(row.hitCount) || 0, points: Number(row.points) || 0 })),
        elapsedTimeSeconds: Number.isFinite(elapsedTimeSeconds) && elapsedTimeSeconds > 0 ? elapsedTimeSeconds : null,
        grossPointsPerSecond: Number.isFinite(Number(result && result.timing && result.timing.grossPointsPerSecond)) ? Number(result.timing.grossPointsPerSecond) : null,
        officialHitFactorStatus: clean(result && result.timing && result.timing.officialHitFactorStatus) || "withheld_without_course_scoring_method_stipulated_hits_and_penalties"
      }) : null
    });
  }

  function comparableProgressionSeries(sessions, targetId, totalTaps) {
    return (Array.isArray(sessions) ? sessions : [])
      .map(preservedProgressionPoint)
      .filter(point => point && point.targetId === clean(targetId) && point.totalTaps === Number(totalTaps))
      .sort((left, right) => left.preservedTime - right.preservedTime || left.sessionId.localeCompare(right.sessionId));
  }

  function targetHistorySeries(sessions, targetId) {
    return (Array.isArray(sessions) ? sessions : [])
      .map(preservedProgressionPoint)
      .filter(point => point && point.targetId === clean(targetId))
      .sort((left, right) => left.preservedTime - right.preservedTime || left.sessionId.localeCompare(right.sessionId));
  }

  function usmHistorySeries(sessions, targetId) {
    return targetHistorySeries(sessions, targetId).filter(isUsmEligible);
  }

  function usmSessionDate(point) {
    if (!point || !Number.isFinite(point.preservedTime)) return "";
    return new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" }).format(new Date(point.preservedTime));
  }

  function progressionChartMarkup(points, { label, valueKey, maximum, minimum = 0, suffix = "", seriesHeading = "", seriesSupport = "" }) {
    const pointSpacing = 72;
    const width = Math.max(640, 52 + Math.max(1, points.length - 1) * pointSpacing + 52);
    const height = 196;
    const left = 52;
    const right = 52;
    const top = 34;
    const bottom = 58;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const ceiling = Math.max(0, Number(maximum));
    const floor = Math.min(0, Number(minimum));
    const span = Math.max(1, ceiling - floor);
    const xAt = index => left + (points.length === 1 ? chartWidth / 2 : (chartWidth * index) / (points.length - 1));
    const yAt = value => top + chartHeight - ((Math.max(floor, Math.min(ceiling, Number(value))) - floor) / span) * chartHeight;
    const path = points.map((point, index) => `${xAt(index)},${yAt(point[valueKey])}`).join(" ");
    const tickValues = Array.from(new Set([ceiling, ceiling > 0 && floor < 0 ? 0 : floor + span / 2, floor]));
    const ticks = tickValues.map(value => `<g><line x1="${left}" y1="${yAt(value)}" x2="${width - right}" y2="${yAt(value)}"></line><text x="${left - 6}" y="${yAt(value) + 3}" text-anchor="end">${escapeHtml(Number.isInteger(value) ? value : value.toFixed(1))}</text></g>`).join("");
    const values = points.map((point, index) => {
      const value = Number(point[valueKey]);
      const displayValue = valueKey === "hitRate"
        ? `${Number.isInteger(value) ? value : value.toFixed(2)}%`
        : (valueKey === "pointsPerTap" ? value.toFixed(1) : String(value));
      const shortLabel = clean(point.sessionLabel).replace(/^Session\s*/i, "");
      const dateLabel = usmSessionDate(point);
      const textAnchor = index === 0 ? "start" : (index === points.length - 1 ? "end" : "middle");
      const bandLeft = Math.max(0, xAt(index) - pointSpacing / 2);
      const bandRight = Math.min(width, xAt(index) + pointSpacing / 2);
      return `<g class="contract-progression-point${index % 2 ? " is-alternate" : ""}" data-usm-session-id="${escapeHtml(point.sessionId)}" role="button" tabindex="0" aria-label="Select ${escapeHtml(point.sessionLabel)} from ${escapeHtml(dateLabel)}"><rect class="contract-progression-band" x="${bandLeft}" y="0" width="${bandRight - bandLeft}" height="${height}"></rect><circle cx="${xAt(index)}" cy="${yAt(value)}" r="6"></circle><text class="contract-progression-value" x="${xAt(index)}" y="${Math.max(15, yAt(value) - 10)}" text-anchor="${textAnchor}">${escapeHtml(displayValue)}</text><text class="contract-progression-session" x="${xAt(index)}" y="${height - 29}" text-anchor="${textAnchor}">${escapeHtml(shortLabel)}</text><text class="contract-progression-date" x="${xAt(index)}" y="${height - 12}" text-anchor="${textAnchor}">${escapeHtml(dateLabel)}</text></g>`;
    }).join("");
    const cohort = seriesHeading ? `<p class="contract-history-series-heading">${escapeHtml(seriesHeading)}</p>${seriesSupport ? `<p class="contract-history-series-support">${escapeHtml(seriesSupport)}</p>` : ""}` : "";
    return `<section class="contract-progression-chart" aria-label="${escapeHtml(label)} by preserved session">${cohort}<h3>${escapeHtml(label)}</h3><div class="contract-history-chart-scroll" data-history-chart-scroll tabindex="0" role="region" aria-label="${escapeHtml(label)} history; swipe horizontally for older sessions"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)} for ${escapeHtml(points.length)} chronological preserved sessions"><g class="contract-progression-grid">${ticks}</g><polyline points="${path}"></polyline>${values}</svg></div>${suffix ? `<small>${escapeHtml(suffix)}</small>` : ""}</section>`;
  }

  function usmNumber(value, digits = 2) {
    return Number.isInteger(value) ? String(value) : Number(value).toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function usmMetricButton(metric, label, value, formula, expanded = false) {
    return `<button type="button" class="contract-usm-metric-card" data-usm-metric-trigger="${escapeHtml(metric)}" aria-expanded="${expanded ? "true" : "false"}" aria-controls="contract-usm-panel-${escapeHtml(metric)}"><span class="contract-usm-metric-label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><span>${formula}<b class="contract-usm-disclosure-cue" aria-hidden="true">DETAILS</b></span></button>`;
  }

  function usmObjectCards(point, mode = "score") {
    const objects = Array.isArray(point.objectResults) ? point.objectResults : [];
    if (!objects.length) return "";
    const cards = objects.map(item => {
      const rings = Object.entries(item.ringCounts || {}).filter(([, count]) => Number(count) > 0).map(([label, count]) => `${escapeHtml(label)}: ${escapeHtml(count)}`).join(" · ");
      const detail = mode === "engagement"
        ? `${escapeHtml(item.observationCount)} tap${item.observationCount === 1 ? "" : "s"} · ${item.hit ? escapeHtml(point.objectPresentation.completionVerbPast) : "not engaged"}`
        : `${escapeHtml(usmNumber(item.score))} points · ${escapeHtml(item.observationCount)} tap${item.observationCount === 1 ? "" : "s"}${item.xCount ? ` · ${escapeHtml(item.xCount)}X` : ""}${rings ? `<br>${rings}` : ""}`;
      return `<article><strong>${escapeHtml(item.label)}</strong><span>${detail}</span></article>`;
    }).join("");
    return `<div class="contract-usm-object-grid">${cards}</div>`;
  }

  function usmCompactValueDistribution(point) {
    const preserved = Array.isArray(point.valueDistribution) ? point.valueDistribution.filter(row => row.hitCount > 0) : [];
    if (preserved.length) {
      const countOnly = (Array.isArray(point.scoringDistribution) ? point.scoringDistribution : []).filter(row => row.hitCount > 0 && row.value === null);
      return [...preserved, ...countOnly];
    }
    const aggregate = new Map();
    (Array.isArray(point.scoringDistribution) ? point.scoringDistribution : []).filter(row => row.hitCount > 0).forEach(row => {
      const key = row.value === null ? `count:${row.label}` : `value:${row.value}`;
      const existing = aggregate.get(key) || { label: row.value === null ? row.label : usmNumber(row.value), value: row.value, hitCount: 0, points: row.value === null ? null : 0 };
      existing.hitCount += row.hitCount;
      if (existing.points !== null) existing.points += row.points;
      aggregate.set(key, existing);
    });
    return Array.from(aggregate.values()).sort((left, right) => (right.value ?? -Infinity) - (left.value ?? -Infinity));
  }

  function usmMathDisclosure(point, reopenHref = "", open = false, accessState = "ready") {
    if (!point) {
      return "";
    }
    const exactHitRate = (point.hitTaps * 100) / point.totalTaps;
    const exactPointsPerTap = point.score / point.totalTaps;
    const hitRelation = Math.abs(exactHitRate - point.hitRate) < 0.0000001 ? "=" : "≈";
    const pointsRelation = Math.abs(exactPointsPerTap - point.pointsPerTap) < 0.0000001 ? "=" : "≈";
    const openSEC = reopenHref
      ? `<a class="contract-usm-open-sec" data-usm-exact-reopen href="${escapeHtml(reopenHref)}"><span aria-hidden="true">▤</span> OPEN ${escapeHtml(point.sessionLabel.toUpperCase())} SEC →</a>`
      : `<span class="contract-usm-open-sec is-unavailable" aria-disabled="true">${accessState === "recovering" ? "OPENING SEC ACCESS…" : "OPEN SEC UNAVAILABLE"}</span>`;
    const competition = point.competition;
    const context = point.sessionContext || {};
    const sessionFacts = [context.shooter ? `Shooter: ${context.shooter}` : "", context.equipment ? `Equipment: ${context.equipment}` : "", context.distance ? `Distance: ${context.distance}` : ""].filter(Boolean);
    const sessionContext = sessionFacts.length ? `<p class="contract-usm-session-context"><span class="contract-usm-metric-label">SESSION</span><strong>${escapeHtml(sessionFacts.join(" · "))}</strong></p>` : "";
    const scoringDistribution = Array.isArray(point.scoringDistribution) ? point.scoringDistribution : [];
    const compactDistribution = usmCompactValueDistribution(point);
    const compactRows = compactDistribution.map(row => {
      const accounting = `${row.label} — ${row.hitCount} tap${row.hitCount === 1 ? "" : "s"}${row.points === null ? " · count only" : ` · ${usmNumber(row.points)} points`}`;
      return `<li aria-label="${escapeHtml(accounting)}"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.hitCount)} tap${row.hitCount === 1 ? "" : "s"}${row.points === null ? " · count only" : ` · ${escapeHtml(usmNumber(row.points))} points`}</span></li>`;
    }).join("");
    const allRegionRows = scoringDistribution.map(row => {
      const accounting = `${row.label} — ${row.hitCount} tap${row.hitCount === 1 ? "" : "s"}${row.value === null ? " · count only" : ` · ${usmNumber(row.points)} points`}`;
      return `<li aria-label="${escapeHtml(accounting)}"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.hitCount)} tap${row.hitCount === 1 ? "" : "s"}${row.value === null ? " · count only" : ` · ${escapeHtml(usmNumber(row.points))} points`}</span></li>`;
    }).join("");
    const objectScoreDetail = point.objectResults && point.objectResults.length ? `<details class="contract-usm-deep-detail"><summary>PER-${escapeHtml(point.objectPresentation.singular.toUpperCase())} DETAIL <b aria-hidden="true">+</b></summary>${usmObjectCards(point, "score")}</details>` : "";
    const objectEngagementDetail = point.objectResults && point.objectResults.length ? `<details class="contract-usm-deep-detail"><summary>PER-${escapeHtml(point.objectPresentation.singular.toUpperCase())} ENGAGEMENT <b aria-hidden="true">+</b></summary>${usmObjectCards(point, "engagement")}</details>` : "";
    const fullRegionDetail = scoringDistribution.length ? `<details class="contract-usm-deep-detail"><summary>ALL SCORING REGIONS <b aria-hidden="true">+</b></summary><ul class="contract-usm-detail-list contract-usm-all-regions">${allRegionRows}</ul></details>` : "";
    const coverage = point.objectCoverage;
    const coverageMarkup = coverage ? `<div class="contract-usm-fact"><span>${escapeHtml(point.objectPresentation.completionLabel.toUpperCase())}</span><strong>${escapeHtml(coverage.objectsHit)} / ${escapeHtml(coverage.scorableObjectCount)}</strong></div>` : "";
    const objectDistribution = point.objectDistribution;
    const comparisonMarkup = objectDistribution ? `<div class="contract-usm-comparison"><span><b>Most engaged</b>${escapeHtml(objectDistribution.strongest && objectDistribution.strongest.label || "—")} · ${escapeHtml(objectDistribution.strongest && objectDistribution.strongest.tapCount || 0)} taps</span><span><b>Least engaged</b>${escapeHtml(objectDistribution.weakest && objectDistribution.weakest.label || "—")} · ${escapeHtml(objectDistribution.weakest && objectDistribution.weakest.tapCount || 0)} taps</span><span><b>Distribution evenness</b>${escapeHtml(usmNumber(objectDistribution.evennessPercentage))}%</span></div>` : "";
    const competitionScore = competition ? `<div class="contract-usm-comparison"><span><b>A-zone performance</b>${escapeHtml(usmNumber(competition.aHitPercentage))}% · ${escapeHtml(competition.aHitTaps)} hits</span><span><b>Scoring mode</b>${escapeHtml(competition.scoringModeLabel || "Governed mode")}</span></div>` : "";
    const competitionEfficiency = competition ? `<div class="contract-usm-comparison"><span><b>Elapsed time</b>${competition.elapsedTimeSeconds === null ? "Untimed" : `${escapeHtml(usmNumber(competition.elapsedTimeSeconds))} sec`}</span><span><b>Points per second</b>${competition.grossPointsPerSecond === null ? "Withheld" : escapeHtml(usmNumber(competition.grossPointsPerSecond, 4))}</span><small>Official Hit Factor withheld without course method, stipulated hits, and penalties.</small></div>` : "";
    const scorePanel = `<section id="contract-usm-panel-score" class="contract-usm-metric-panel" data-usm-metric-panel="score" hidden><h4>SCORING DISTRIBUTION &amp; BREAKDOWN</h4><ul class="contract-usm-detail-list">${compactRows}</ul><p class="contract-usm-total"><span>TOTAL POINTS</span><strong>${escapeHtml(point.score)}</strong></p>${competitionScore}${objectScoreDetail}${fullRegionDetail}</section>`;
    const hitPanel = `<section id="contract-usm-panel-hit-rate" class="contract-usm-metric-panel" data-usm-metric-panel="hit-rate" hidden><h4>HIT ACCOUNTING</h4><div class="contract-usm-fact-grid"><div class="contract-usm-fact"><span>HITS</span><strong>${escapeHtml(point.hitTaps)}</strong></div><div class="contract-usm-fact"><span>OUTSIDE</span><strong>${escapeHtml(point.misses)}</strong></div><div class="contract-usm-fact"><span>TOTAL TAPS</span><strong>${escapeHtml(point.totalTaps)}</strong></div>${coverageMarkup}</div>${objectEngagementDetail}</section>`;
    const efficiencyPanel = `<section id="contract-usm-panel-points-per-tap" class="contract-usm-metric-panel" data-usm-metric-panel="points-per-tap" hidden><h4>EFFICIENCY &amp; DISTRIBUTION</h4><p class="contract-usm-equation"><strong>${escapeHtml(point.score)}</strong> points ÷ <strong>${escapeHtml(point.totalTaps)}</strong> taps ${pointsRelation} <strong>${escapeHtml(point.pointsPerTap.toFixed(1))}</strong> points per tap</p>${comparisonMarkup}${competitionEfficiency}</section>`;
    const summaryCards = `<div class="contract-usm-metric-grid">${usmMetricButton("score", "SCORE", point.score, `${escapeHtml(point.score)} points · tap for breakdown`)}${usmMetricButton("hit-rate", "HIT RATE", `${usmNumber(point.hitRate)}%`, `${escapeHtml(point.hitTaps)} hits ÷ ${escapeHtml(point.totalTaps)} taps ${hitRelation} ${escapeHtml(usmNumber(point.hitRate))}%`)}${usmMetricButton("points-per-tap", "POINTS PER TAP", point.pointsPerTap.toFixed(1), `${escapeHtml(point.score)} points ÷ ${escapeHtml(point.totalTaps)} taps`)}</div>`;
    return `<details class="contract-usm-math" data-usm-selected-detail data-usm-selected-session-id="${escapeHtml(point.sessionId)}"${open ? " open" : ""}><summary><strong>${escapeHtml(point.sessionLabel.toUpperCase())}</strong><time datetime="${escapeHtml(point.preservedAt)}">${escapeHtml(usmSessionDate(point))}</time><b aria-hidden="true"></b></summary><div>${sessionContext}${summaryCards}<div class="contract-usm-metric-panels">${scorePanel}${hitPanel}${efficiencyPanel}</div>${openSEC}</div></details>`;
  }

  function usmDrawerMarkup(points, currentSessionId = "", embedded = false) {
    const series = Array.isArray(points) ? points : [];
    if (!series.length || !series.every(isUsmEligible)) return "";
    const targetName = series[0].targetName;
    const currentPoint = series.find(point => point.sessionId === clean(currentSessionId)) || null;
    const scoreChart = progressionChartMarkup(series, {
      label: "Score",
      valueKey: "score",
      maximum: Math.max(0, Math.ceil(Math.max(...series.map(point => point.score)) / 10) * 10),
      minimum: Math.min(0, Math.floor(Math.min(...series.map(point => point.score)) / 10) * 10)
    });
    const hitRateChart = progressionChartMarkup(series, {
      label: "Hit Rate",
      valueKey: "hitRate",
      maximum: 100,
      suffix: ""
    });
    const pointsPerTapChart = progressionChartMarkup(series, {
      label: "Points per Tap",
      valueKey: "pointsPerTap",
      maximum: Math.max(0, Math.ceil(Math.max(...series.map(point => point.pointsPerTap)))),
      minimum: Math.min(0, Math.floor(Math.min(...series.map(point => point.pointsPerTap)))),
      suffix: ""
    });
    const body = `<div class="contract-progression-body contract-usm-history-surface${embedded ? " contract-usm-embedded-body" : ""}"><p class="contract-usm-target-name">${escapeHtml(targetName)}</p><p class="contract-usm-heading">SCORE <i>|</i> HIT RATE <i>|</i> POINTS PER TAP</p><p class="contract-usm-instruction">TAP ANY BULLET TO VIEW THAT SESSION</p><div class="contract-progression-charts">${scoreChart}${hitRateChart}${pointsPerTapChart}</div><div data-usm-selected-detail-host>${usmMathDisclosure(currentPoint)}</div></div>`;
    return embedded ? body : `<details class="contract-progression-drawer contract-usm-drawer" data-contract-progression-drawer="true" data-usm-proof-target="${escapeHtml(series[0].targetId)}"><summary><span class="contract-usm-history-identity"><em>3 · HISTORY</em></span><span class="contract-usm-details-label">DETAILS</span><b aria-hidden="true"></b></summary>${body}</details>`;
  }

  function usmReopenBaseHref(point) {
    const params = new URLSearchParams({
      target: clean(point && point.targetId),
      missionFamily: clean(point && point.missionFamily),
      source: "registered",
      session: clean(point && point.sessionId),
      view: "sec"
    });
    const authorityPort = new URLSearchParams(global.location && global.location.search || "").get("authorityPort") || "";
    const authorityPortNumber = Number(authorityPort);
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(global.location && global.location.hostname);
    if (local && /^\d{2,5}$/.test(authorityPort) && authorityPortNumber > 0 && authorityPortNumber <= 65535) {
      params.set("authorityPort", authorityPort);
    }
    return `target-experience.html?${params.toString()}`;
  }

  function initializeUSMInteractions(host, points, sourceSessions, endpoint, initialSessionId) {
    const scrollers = Array.from(host.querySelectorAll("[data-history-chart-scroll]"));
    const pointById = new Map(points.map(point => [point.sessionId, point]));
    const sourceById = new Map((Array.isArray(sourceSessions) ? sourceSessions : []).map(session => [clean(session && session.sessionId), session]));
    const detailHost = host.querySelector("[data-usm-selected-detail-host]");
    let selectedSessionId = pointById.has(clean(initialSessionId)) ? clean(initialSessionId) : points[points.length - 1].sessionId;
    let synchronizingScroll = false;

    const revealLatestHistory = () => global.requestAnimationFrame(() => {
      scrollers.forEach(scroller => { scroller.scrollLeft = scroller.scrollWidth; });
    });

    const exactReopenHref = sessionId => {
      const point = pointById.get(sessionId);
      if (!point) return "";
      const base = usmReopenBaseHref(point);
      const portable = global.SCZN3SECReopenAuthority?.portableUrl(base, sessionId) || base;
      return portable.includes(`#${global.SCZN3SECReopenAuthority?.FRAGMENT_KEY || "secReopenCapability"}=`) ? portable : "";
    };

    const paintSelection = (sessionId, open, reopenHref = "", accessState = "ready") => {
      const point = pointById.get(sessionId);
      if (!point || !detailHost) return;
      selectedSessionId = sessionId;
      host.dataset.usmSelectedSessionId = sessionId;
      host.querySelectorAll("[data-usm-session-id]").forEach(node => {
        const selected = node.getAttribute("data-usm-session-id") === sessionId;
        node.classList.toggle("is-selected", selected);
        node.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      detailHost.innerHTML = usmMathDisclosure(point, reopenHref, open, accessState);
    };

    const selectSession = async (sessionId, open = true) => {
      const point = pointById.get(sessionId);
      if (!point) return;
      let reopenHref = exactReopenHref(sessionId);
      paintSelection(sessionId, open, reopenHref, reopenHref ? "ready" : "recovering");
      if (reopenHref) return;
      const sourceSession = sourceById.get(sessionId);
      if (!sourceSession || !global.SCZN3SECReopenAuthority?.provePossession) {
        if (selectedSessionId === sessionId) paintSelection(sessionId, open, "", "unavailable");
        return;
      }
      try {
        await global.SCZN3SECReopenAuthority.provePossession(endpoint, sourceSession);
        reopenHref = exactReopenHref(sessionId);
      } catch (_) {
        reopenHref = "";
      }
      if (selectedSessionId === sessionId) paintSelection(sessionId, open, reopenHref, reopenHref ? "ready" : "unavailable");
    };

    scrollers.forEach(source => source.addEventListener("scroll", () => {
      if (synchronizingScroll) return;
      synchronizingScroll = true;
      scrollers.forEach(target => { if (target !== source) target.scrollLeft = source.scrollLeft; });
      global.requestAnimationFrame(() => { synchronizingScroll = false; });
    }, { passive: true }));

    host.addEventListener("click", event => {
      const metricTrigger = event.target && event.target.closest && event.target.closest("[data-usm-metric-trigger]");
      if (metricTrigger) {
        const metric = clean(metricTrigger.getAttribute("data-usm-metric-trigger"));
        const detail = metricTrigger.closest("[data-usm-selected-detail]");
        const willOpen = metricTrigger.getAttribute("aria-expanded") !== "true";
        if (detail) {
          detail.querySelectorAll("[data-usm-metric-trigger]").forEach(trigger => trigger.setAttribute("aria-expanded", "false"));
          detail.querySelectorAll("[data-usm-metric-panel]").forEach(panel => { panel.hidden = true; });
          if (willOpen) {
            metricTrigger.setAttribute("aria-expanded", "true");
            const panel = detail.querySelector(`[data-usm-metric-panel="${metric}"]`);
            if (panel) panel.hidden = false;
          }
        }
        return;
      }
      const link = event.target && event.target.closest && event.target.closest("[data-usm-exact-reopen]");
      if (!link) return;
      event.preventDefault();
      const destination = link.href;
      if (!destination) return;
      if (destination === global.location.href) {
        global.location.reload();
        return;
      }
      global.location.assign(destination);
    });

    host.querySelectorAll("[data-usm-session-id]").forEach(node => {
      const activate = () => selectSession(clean(node.getAttribute("data-usm-session-id")), true);
      node.addEventListener("click", activate);
      node.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate();
      });
    });

    const disclosure = host.closest("details");
    if (disclosure) disclosure.addEventListener("toggle", () => { if (disclosure.open) revealLatestHistory(); });

    global.requestAnimationFrame(() => {
      revealLatestHistory();
      selectSession(selectedSessionId, true);
    });
  }

  async function hydrateProgression(root = document) {
    const hosts = Array.from(root.querySelectorAll("[data-contract-progression-host]"));
    if (!hosts.length) return;
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(global.location && global.location.hostname);
    const privateLan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(global.location && global.location.hostname || "") || /\.local$/i.test(global.location && global.location.hostname || "");
    const origin = local ? `http://127.0.0.1:${localAuthorityPort() || "8098"}` : (privateLan ? "" : "https://sczn3-authority.onrender.com");
    const endpoint = `${origin}/api/session/sec`;
    const response = await global.fetch(endpoint, { headers: { Accept: "application/json" } });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || !Array.isArray(payload.sessions)) return;
    hosts.forEach(host => {
      const targetId = clean(host.dataset.progressionTargetId);
      const points = usmHistorySeries(payload.sessions, targetId);
      const markup = usmDrawerMarkup(points, host.dataset.usmCurrentSessionId, host.dataset.usmSectionContent === "true");
      if (!markup) return;
      host.innerHTML = markup;
      host.hidden = false;
      initializeUSMInteractions(host, points, payload.sessions, endpoint, host.dataset.usmCurrentSessionId);
    });
  }

  function secActions({ mode, preserved, vaultHref, reopenHref, note = "" }) {
    const historical = mode === "historical";
    const actions = [
      ...(!historical ? [{ label: preserved ? "SEC Preserved" : "Save SEC", action: "save", primary: !preserved, disabled: preserved }] : []),
      { label: "Share", action: "share" },
      { label: "Export / Print PDF", action: "export" },
      ...(!historical && !preserved ? [{ label: "Add Note", action: "note" }] : []),
      ...(preserved || historical ? [{ label: "Ballistic Vault", href: vaultHref, action: "history" }] : []),
      ...(preserved && !historical ? [{ label: "Exact Reopen", href: reopenHref, action: "history", className: "contract-exact-reopen" }] : [])
    ];
    const noteEditor = !historical && !preserved
      ? `<div class="sec-note-editor is-hidden" data-sczn3-note-editor hidden><label>Session note<textarea rows="3" data-contract-sec-note placeholder="Instructor note, applied setting, or range observation">${escapeHtml(note)}</textarea></label><button class="button" type="button" data-sczn3-action="note-save">Save Note</button></div>`
      : "";
    return global.SCZN3SECComponents.Preservation({ contentHtml: global.SCZN3SECComponents.ActionBar({
      actions,
      afterHtml: `${noteEditor}<span class="sec-action-status" data-contract-save-status role="status" aria-live="polite"></span>`
    }) });
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
    const vaultHref = `records.html?runtimeView=sec-readable-diagnostic-1${localAuthorityPort() ? `&authorityPort=${encodeURIComponent(localAuthorityPort())}` : ""}`;
    const reopenBaseHref = `target-experience.html?session=${encodeURIComponent(session.sessionId || "")}&view=sec${localAuthoritySuffix()}`;
    const reopenHref = global.SCZN3SECReopenAuthority?.portableUrl(reopenBaseHref, session.sessionId) || reopenBaseHref;
    const sessionLabel = clean(session.sessionLabel) || "Session";
    const preservedAt = clean(session.preservedAt || session.savedAt || session.timestamp);
    const identityAttributes = Object.fromEntries([
      ["data-session-id", clean(session.sessionId || result.authoritativeSessionId)],
      ["data-target-id", target.id],
      ["data-target-profile-id", target.id],
      ["data-target-profile-version", target.version],
      ["data-sec-adapter-id", contract.secAdapterFamilyId],
      ["data-contract-fingerprint", contract.contractFingerprint],
      ["data-publisher-id", publisher.id],
      ["data-product-id", product.id],
      ["data-sec-mode", mode]
    ]);
    const before = result.missionFamily === "secProgressionEvaluation"
      ? ""
      : `<figure class="contract-lifecycle-pane contract-lifecycle-before"><figcaption>BEFORE</figcaption>${global.SCZN3SECComponents.Evidence({ contentHtml: evidenceMarkup(session, result) })}</figure>`;
    const progressionTapCount = Number(result && result.scoring && result.scoring.observationCount);
    const progressionHost = isUsmEligible(result) && Number.isFinite(progressionTapCount) && progressionTapCount > 0
      ? `<section class="contract-progression-host contract-usm-section-host" data-contract-progression-host data-usm-section-content="true" data-progression-target-id="${escapeHtml(target.id)}" data-usm-current-session-id="${escapeHtml(clean(session.sessionId || result.authoritativeSessionId))}" hidden></section>`
      : "";
    const targetContent = `<section class="contract-product-identity"><span>${escapeHtml(publisher.name)}</span><strong>${escapeHtml(product.name)} · SKU ${escapeHtml(product.sku)}</strong></section>
      <section class="contract-lifecycle-pair" aria-label="Preserved target evidence and approved result">
        ${before}
        <figure class="contract-lifecycle-pane contract-lifecycle-result"><figcaption>RESULT</figcaption>${approvedResultComponent(result, session)}</figure>
      </section>
      ${objectScoreboardMarkup(result)}`;
    const sessionContent = global.SCZN3SECComponents.Measurement({ contentHtml: global.SCZN3SECComponents.SessionFoundation(session) });
    const resultSummary = summary(result);
    return global.SCZN3SEC.render({
      schemaVersion: "1.2",
      recordId: clean(session.sessionId || result.authoritativeSessionId) || "target-execution-sec",
      missionFamily: result.missionFamily,
      sessionLabel,
      targetTitle: product.name,
      scoreDisplay: `${resultSummary.label} ${resultSummary.value}`,
      articleClassName: "contract-family-sec-card contract-universal-sec",
      articleAttributes: identityAttributes,
      regions: [
        { key: "target", className: "sec-v1-evidence-content", ariaLabel: "Target", contentHtml: targetContent },
        { key: "session", className: "sec-v1-measurement-content", ariaLabel: "Session", contentHtml: sessionContent },
        ...(progressionHost ? [{ key: "history", className: "sec-v1-history-content", ariaLabel: "History", contentHtml: progressionHost }] : []),
        { key: "actions", className: "sec-v1-preservation-content", ariaLabel: "Shooter Action Bar", contentHtml: secActions({ mode, preserved, vaultHref, reopenHref, note: clean(session.secNote) }) }
      ]
    });
  }

  function vaultResultSummary(result, session = {}) {
    if (!contractIdentity(result) || !targetIdentity(result) || !familyReconciles(result)) return null;
    const value = summary(result);
    if (result.missionFamily === "smartEvidenceCapture") {
      const tapCount = Array.isArray(result.observations) ? result.observations.length : 0;
      const shotPattern = isQtPrinter13Result(result) ? null : result.sczn3Metrics && result.sczn3Metrics.shotPattern || null;
      const progress = session && session.sczn3Progress;
      return Object.freeze({
        status: "complete",
        primaryValue: String(tapCount),
        primaryUnit: "TOTAL TAPS",
        objectiveLabel: "SAVED TAPS",
        breakdown: [{ label: "Saved Taps", value: String(tapCount) }],
        evidenceLabel: `${tapCount} saved tap${tapCount === 1 ? "" : "s"}`,
        groups: [], numericObjects: [], numericRegions: [], participantResults: [],
        tapSummary: null, hitRate: null, objectCoverage: null, shotPattern,
        progress: !isQtPrinter13Result(result) && progress && progress.shotPatternComparison ? {
          shotPatternComparison: progress.shotPatternComparison,
          tightestPattern: progress.best && progress.best.tightestPattern || null
        } : null,
        scoringMode: null, objectScoreboard: null
      });
    }
    if (result.missionFamily === "targetScoring" && result.scoring && result.scoring.status === "not_applicable") {
      const tapCount = Number(result.scoring.observationCount || (Array.isArray(result.classifications) ? result.classifications.length : 0));
      return Object.freeze({
        status: "complete",
        primaryValue: String(tapCount),
        primaryUnit: "TOTAL TAPS",
        objectiveLabel: "EVIDENCE PRESERVED",
        breakdown: [{ label: "Recorded observations", value: String(tapCount) }],
        evidenceLabel: `${tapCount} recorded observation${tapCount === 1 ? "" : "s"} · classification unavailable`,
        groups: [], numericObjects: [], numericRegions: [], participantResults: [],
        tapSummary: null, hitRate: null, objectCoverage: null, shotPattern: null,
        progress: null, scoringMode: null, objectScoreboard: null
      });
    }
    if (result.missionFamily === "diagnosticFeedbackEvaluation") {
      const reconciliation = result.reconciliation || {};
      const observationCount = Array.isArray(result.observations) ? result.observations.length : 0;
      return Object.freeze({
        status: "complete",
        primaryValue: `${Number(reconciliation.matched) || 0} matched`,
        primaryUnit: "PUBLISHER LABEL MATCH",
        objectiveLabel: "NOT AN SCZN3 DIAGNOSIS",
        breakdown: [
          { label: "Unmapped", value: String(Number(reconciliation.unmapped) || 0) },
          { label: "Ambiguous", value: String(Number(reconciliation.ambiguous) || 0) }
        ],
        evidenceLabel: `${observationCount} observation${observationCount === 1 ? "" : "s"} preserved`,
        groups: [],
        numericObjects: [],
        numericRegions: [],
        participantResults: [],
        tapSummary: null,
        hitRate: null,
        objectCoverage: null,
        progress: null,
        scoringMode: null,
        objectScoreboard: null
      });
    }
    if (result.missionFamily === "targetScoring" && result.scoring && result.scoring.status === "complete") {
      const scoring = result.scoring;
      const rows = targetScoringRows(result);
      const numeric = ["numeric_regions", "penalty_regions", "mixed_regions"].includes(scoring.model);
      const multiple = scoring.model === "multiple_bulls";
      const ordered = scoring.model === "ordered_objects";
      const hitCount = rows.filter(row => row.hit).length;
      return Object.freeze({
        status: "complete",
        primaryValue: numeric ? String(scoring.total) : (multiple ? String(hitCount) : (ordered ? String(scoring.completedInOrder) : String(scoring.observationCount))),
        primaryUnit: numeric ? (scoring.model === "penalty_regions" ? "PENALTY" : "POINTS") : (multiple ? "OBJECTS HIT" : (ordered ? "IN ORDER" : "CLASSIFIED")),
        objectiveLabel: value.label.toUpperCase(),
        breakdown: rows.map(row => ({ label: row.label, value: row.displayValue })),
        evidenceLabel: `${scoring.observationCount} observation${scoring.observationCount === 1 ? "" : "s"} preserved`,
      });
    }
    return Object.freeze({ status: "unavailable", primaryLabel: value.label.toUpperCase(), objectiveLabel: value.value, evidenceLabel: value.detail });
  }

  function vaultEvidenceModel(session, supplied = null) {
    const result = supplied || canonicalResult(session);
    const image = session && session.targetEvidenceImage || {};
    const observations = preservedObservations(session, result, image);
    const imageUrl = clean(image.dataUrl || image.assetUrl);
    if (!imageUrl || !observations.length) return null;
    const targetAim = result && shouldRenderGovernedAim(result.missionFamily) && result.aimStructure && result.aimStructure.mode === "fixed" && Array.isArray(result.aimStructure.points)
      ? result.aimStructure.points[0]
      : null;
    const aim = normalizedEvidencePoint(result && result.shooterDeclaredAimPoint || session && session.aimPoint || targetAim, image);
    return Object.freeze({
      status: "complete",
      imageUrl,
      imageAlt: "Saved target with shooter-declared observations",
      evidence: image,
      markers: observations.map((observation, index) => ({
        xPercent: observation.xNorm * 100,
        yPercent: observation.yNorm * 100,
        ...(observation.canonicalTargetCoordinate ? { canonicalTargetCoordinate: observation.canonicalTargetCoordinate } : {}),
        label: String(index + 1)
      })),
      aimPoint: aim ? { xPercent: aim.xNorm * 100, yPercent: aim.yNorm * 100, label: "Aim" } : null
    });
  }

  function bindRepeatedObjectAccordions(root = document) {
    root.querySelectorAll("[data-repeated-object-accordion]").forEach(accordion => {
      if (accordion.dataset.repeatedObjectReady === "true") return;
      accordion.dataset.repeatedObjectReady = "true";
      const triggers = Array.from(accordion.querySelectorAll("[data-repeated-object-trigger]"));
      const panels = Array.from(accordion.querySelectorAll("[data-repeated-object-panel]"));
      triggers.forEach(trigger => {
        trigger.dataset.disclosureControl = "true";
        if (!trigger.querySelector("[data-disclosure-indicator]")) {
          const indicator = document.createElement("i");
          indicator.dataset.disclosureIndicator = "true";
          indicator.setAttribute("aria-hidden", "true");
          trigger.append(indicator);
        }
        trigger.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const index = trigger.dataset.repeatedObjectTrigger;
        const willOpen = trigger.getAttribute("aria-expanded") !== "true";
        triggers.forEach(item => item.setAttribute("aria-expanded", "false"));
        panels.forEach(panel => { panel.hidden = true; });
        if (willOpen) {
          trigger.setAttribute("aria-expanded", "true");
          const panel = panels.find(item => item.dataset.repeatedObjectPanel === index);
          if (panel) panel.hidden = false;
        }
        });
      });
    });
  }

  function bindNativeDisclosures(root = document) {
    root.querySelectorAll("details>summary[data-disclosure-control]").forEach(summary => {
      const details = summary.parentElement;
      if (!details || details.dataset.nativeDisclosureReady === "true") return;
      details.dataset.nativeDisclosureReady = "true";
      const sync = () => summary.setAttribute("aria-expanded", details.open ? "true" : "false");
      details.addEventListener("toggle", sync);
      sync();
    });
  }

  function initializeSECInteractions(root = document, preferredRegion = "target") {
    global.SCZN3SECReopenLifecycle?.initialize(root, preferredRegion);
    bindRepeatedObjectAccordions(root);
    bindNativeDisclosures(root);
    bindEvidenceProjection(root);
    hydrateProgression(root).catch(() => {});
  }

  function hasExecutableRegisteredAsset(registration) {
    return Boolean(registration && EXECUTABLE_REGISTRATION_ROLES.includes(clean(registration.role)) && clean(registration.assetPath));
  }

  function shouldRenderGovernedAim(mission) {
    return clean(mission) !== "targetScoring";
  }

  function persistentEvidenceImage(image) {
    if (!image || typeof image !== "object" || !clean(image.assetUrl) || !clean(image.mediaId)) return image;
    const compact = { ...image };
    delete compact.dataUrl;
    return compact;
  }

  global.SCZN3TargetExecutionRuntime = Object.freeze({ bindRepeatedObjectAccordions, initializeSECInteractions, canPreserve, contractIdentity, targetIdentity, familyReconciles, renderSEC, approvedResultComponent, approvedResultContent, approvedResultFamily, vaultEvidenceModel, vaultResultSummary, objectResultGroups, objectTapSummary, shooterFacingResultMarkup, shotPatternMarkup, requestScoringCaliber, summary, comparableProgressionSeries, targetHistorySeries, usmHistorySeries, usmDrawerMarkup, hydrateProgression, runtimeId, sha256Hex, hasExecutableRegisteredAsset, shouldRenderGovernedAim, persistentEvidenceImage, normalizedEvidencePoint, preservedObservations, sourceImagePoint, renderedImageContentBox, syncProjectionLayerToImage });

  function initializePage() {
    const root = document.querySelector("[data-contract-target-page]");
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const targetId = clean(params.get("target"));
    const missionFamily = clean(params.get("missionFamily"));
    const autoLoadRegistered = clean(params.get("source")) === "registered";
    const reopenSessionId = clean(params.get("session"));
    const reopenProgressionId = clean(params.get("progression"));
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(location.hostname);
    const privateLan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname) || /\.local$/i.test(location.hostname);
    const authorityOrigin = local ? `http://127.0.0.1:${localAuthorityPort() || "8098"}` : (privateLan ? "" : "https://sczn3-authority.onrender.com");
    const equipmentDraftKey = "SCZN3_ACTIVE_TARGET_EQUIPMENT_RETURN_DRAFT";
    const equipmentFields = ["setupId", "setupName", "weaponCategory", "weaponManufacturer", "weaponModelType", "weaponModelCaliber", "weaponCatalogManufacturer", "weaponCatalogModel", "weaponCatalogCaliber", "opticType", "opticBrand", "opticModel", "opticAdjustmentUnit", "opticClickValue", "adjustmentSystem", "ammoCaliber", "ammoManufacturer", "ammoLoad", "bulletWeight"];
    // Missing interaction authority must fail closed.  MARK AIM is shown only
    // when the Backend returns an explicit shooter_declared interaction.
    const state = { session: null, image: null, imageDataUrl: "", observations: [], aim: null, aimMode: false, interaction: { aim: { mode: "not_required", points: [] } }, selectedObjectId: "", isCueDrill: false, isQualification: false, isDiagnostic: false, isDecision: false, isStaged: false, cueSequence: 0, cueRunState: null, noObservationDeclared: false, elapsedTimeConfirmed: false };
    const smartTargetWorkspace = global.SCZN3SmartTargetWorkspace?.create({
      root: document.getElementById("contractWorkspace"),
      evidenceRegion: document.querySelector("#contractWorkspace [data-sczn3-workspace-evidence]"),
      actionRegion: document.querySelector("#contractWorkspace [data-sczn3-workspace-actions]"),
      header: document.querySelector(".app-header")
    });
    global.SCZN3Actions?.markRegion(document.querySelector("#contractWorkspace [data-sczn3-action-region]"));
    smartTargetWorkspace?.bindViewportLifecycle();
    const precisionTapController = global.SCZN3SmartTargetWorkspace?.createPrecisionTap({
      viewport: document.getElementById("contractPrecisionTapViewport"),
      plane: document.getElementById("contractPrecisionTapPlane"),
      image: document.getElementById("contractTargetImage"),
      canTap: () => !byId("contractWorkspace").hidden && !byId("contractTapSurface").disabled,
      onTap: capturePrecisionTap
    });

    function renderScoringModeSelector() {
      const panel = byId("contractScoringModePanel");
      const select = byId("contractScoringMode");
      const label = byId("contractScoringModeLabel");
      const control = byId("contractScoringModeControl");
      const fieldLabel = byId("contractModeFieldLabel");
      const selector = state.interaction && state.interaction.scoringMode;
      const options = selector && Array.isArray(selector.options) ? selector.options.filter(item => clean(item && item.modeId) && clean(item && item.label)) : [];
      panel.hidden = false;
      control.hidden = !options.length;
      const modeLabel = clean(selector && selector.label) || "";
      label.textContent = options.length ? `${modeLabel.toUpperCase()} & DISTANCE` : "DISTANCE";
      fieldLabel.textContent = modeLabel || "Mode";
      if (!options.length) select.innerHTML = "";
      else select.innerHTML = `<option value="">Choose ${escapeHtml(modeLabel || "mode")}</option>${options.map(item => `<option value="${escapeHtml(item.modeId)}">${escapeHtml(item.label)}</option>`).join("")}`;
      renderSessionFacts();
    }

    function renderElapsedTimeEntry() {
      const input = byId("contractElapsedTime");
      const label = byId("contractElapsedTimeLabel");
      const policy = state.interaction && state.interaction.elapsedTime;
      const available = policy && clean(policy.mode) === "optional_manual_entry" && clean(policy.unit) === "seconds";
      if (!available) { input.value = ""; return; }
      label.textContent = clean(policy.label) || "Enter Time";
    }

    function sessionEquipmentSummary(snapshot = {}) {
      const firearm = [snapshot.weaponManufacturer || snapshot.weaponCatalogManufacturer, snapshot.weaponModelType || snapshot.weaponCatalogModel, snapshot.weaponModelCaliber || snapshot.weaponCatalogCaliber].map(clean).filter(Boolean).join(" ");
      const optic = [snapshot.opticBrand, snapshot.opticModel].map(clean).filter(Boolean).join(" ");
      return [firearm, optic].filter(Boolean).join(" · ") || clean(snapshot.setupName) || "Not selected";
    }

    function renderSessionFacts() {
      if (!state.session) return;
      const snapshot = state.session.matrixSnapshot || {};
      const expected = state.session.expectedDistance || null;
      const actual = state.session.sessionDistance && clean(state.session.sessionDistance.source) === "shooter-entered-session-fact" ? state.session.sessionDistance : null;
      byId("contractActualDistance").value = actual && Number.isFinite(Number(actual.value)) ? String(actual.value) : "";
      byId("contractDistanceUnit").value = clean(actual && actual.unit).toUpperCase() === "M" ? "M" : "YDS";
      byId("contractShooterName").value = clean(state.session.shooterName || snapshot.shooterName);
      byId("contractEquipmentSummary").textContent = sessionEquipmentSummary(snapshot);
      const expectedNode = byId("contractExpectedDistance");
      expectedNode.hidden = !(expected && Number.isFinite(Number(expected.value)));
      expectedNode.textContent = expectedNode.hidden ? "" : `Expected distance: ${expected.display || `${expected.value} ${clean(expected.unit).toUpperCase() === "M" ? "m" : "yds"}`}`;
    }

    async function persistSessionFacts() {
      if (!state.session) return;
      const snapshot = state.session.matrixSnapshot || {};
      const distanceText = clean(byId("contractActualDistance").value);
      const distanceValue = distanceText ? Number(distanceText) : null;
      const distanceUnit = byId("contractDistanceUnit").value === "M" ? "M" : "YDS";
      const shooterName = clean(byId("contractShooterName").value);
      const matrixSnapshot = {
        ...snapshot,
        shooterName,
        targetDistanceValue: Number.isFinite(distanceValue) && distanceValue > 0 ? String(distanceValue) : "",
        targetDistanceUnit: Number.isFinite(distanceValue) && distanceValue > 0 ? distanceUnit : ""
      };
      const sessionDistance = Number.isFinite(distanceValue) && distanceValue > 0 ? {
        value: distanceValue,
        unit: distanceUnit,
        display: `${distanceValue} ${distanceUnit === "M" ? "m" : "yds"}`,
        source: "shooter-entered-session-fact",
        locked: false,
        targetProfileId: targetId
      } : state.session.sessionDistance;
      state.session = await Promise.resolve(global.SCZN3M4.updateActiveSession({ matrixSnapshot, shooterName, sessionDistance }));
    }

    async function openEquipmentLibrary(event) {
      event.preventDefault();
      await persistSessionFacts();
      if (state.image) state.session = await Promise.resolve(global.SCZN3M4.saveTargetEvidenceImage(persistentEvidenceImage(state.image)));
      const draft = {
        schemaVersion: "sczn3-active-target-equipment-return-v1",
        returnUrl: global.location.href,
        targetId,
        missionFamily,
        sessionId: clean(state.session && state.session.sessionId),
        observations: state.observations,
        aim: state.aim,
        interaction: state.interaction,
        selectedObjectId: state.selectedObjectId,
        scoringMode: byId("contractScoringMode").value,
        imageWasRegistered: autoLoadRegistered,
        savedAt: new Date().toISOString()
      };
      global.sessionStorage.setItem(equipmentDraftKey, JSON.stringify(draft));
      global.location.href = "matrix.html?view=library&return_to=active-target";
    }

    function pendingEquipmentDraft() {
      try {
        const value = JSON.parse(global.sessionStorage.getItem(equipmentDraftKey) || "null");
        return value && value.schemaVersion === "sczn3-active-target-equipment-return-v1" && clean(value.targetId) === targetId ? value : null;
      } catch (_) {
        return null;
      }
    }

    async function resumeEquipmentDraft(draft) {
      const restored = global.SCZN3M4.loadSession(clean(draft.sessionId));
      if (!restored) throw new Error("active_target_session_restore_unavailable");
      const selectedEquipment = draft.selectedEquipmentProfile && typeof draft.selectedEquipmentProfile === "object"
        ? draft.selectedEquipmentProfile
        : (global.SCZN3M4.getActiveMatrix?.() || {});
      const equipmentPatch = Object.fromEntries(equipmentFields.filter(key => selectedEquipment[key] !== undefined).map(key => [key, selectedEquipment[key]]));
      state.session = await Promise.resolve(global.SCZN3M4.updateActiveSession({ matrixSnapshot: { ...(restored.matrixSnapshot || {}), ...equipmentPatch } }));
      state.interaction = draft.interaction || state.interaction;
      state.observations = Array.isArray(draft.observations) ? draft.observations : [];
      state.aim = draft.aim || null;
      state.selectedObjectId = clean(draft.selectedObjectId);
      renderScoringModeSelector();
      renderElapsedTimeEntry();
      renderObjectCourse();
      if (clean(draft.scoringMode)) byId("contractScoringMode").value = clean(draft.scoringMode);
      const started = state.session.backendSessionAuthority || {};
      const startedMission = started.missionIdentity || {};
      state.isCueDrill = startedMission.missionFamily === "cueDrillOrchestration";
      state.isQualification = startedMission.missionFamily === "qualificationCourseEvaluation";
      state.isDiagnostic = startedMission.missionFamily === "diagnosticFeedbackEvaluation";
      state.isDecision = startedMission.missionFamily === "decisionScenarioEvaluation";
      state.isStaged = state.isCueDrill || state.isQualification || state.isDecision;
      byId("contractExperienceLabel").textContent = startedMission.missionFamily === "targetScoring" ? "Shoot" : "Target experience";
      byId("contractProductName").textContent = clean(started.target && started.target.targetName) || clean(state.session.matrixSnapshot && state.session.matrixSnapshot.targetName) || "Registered Smart Target";
      byId("contractStart").hidden = true;
      byId("contractCapture").hidden = draft.imageWasRegistered === true;
      const preservedImage = state.session.targetEvidenceImage;
      if (draft.imageWasRegistered === true) await loadRegisteredTarget();
      else if (preservedImage && clean(preservedImage.dataUrl)) {
        const response = await fetch(preservedImage.dataUrl);
        await loadFile(await response.blob(), clean(preservedImage.sha256), { assetUrl: clean(preservedImage.assetUrl), mediaId: clean(preservedImage.mediaId) });
      }
      paintMarkers();
      global.sessionStorage.removeItem(equipmentDraftKey);
      status(draft.equipmentSelectedSetupId ? "Equipment selected. Active target session restored." : "Active target session restored unchanged.");
    }

    function renderDiagnosticHandednessSelector() {
      const selector = state.interaction && state.interaction.diagnosticHandedness;
      const allowed = selector && Array.isArray(selector.allowedValues) ? [...new Set(selector.allowedValues.map(clean).filter(Boolean))] : [];
      const labels = { right: "Right", left: "Left", ambidextrous: "Ambidextrous", not_applicable: "Not applicable" };
      byId("contractDiagnosticHandednessControl").hidden = allowed.length <= 1;
      byId("contractDiagnosticHandednessLabel").textContent = clean(selector && selector.label) || "WHAT HAND ARE YOU SHOOTING WITH?";
      byId("contractDiagnosticHandedness").innerHTML = allowed.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(labels[value] || value)}</option>`).join("");
      const preferred = clean(selector && selector.defaultValue);
      if (preferred && allowed.includes(preferred)) byId("contractDiagnosticHandedness").value = preferred;
    }

    function governedDiagnosticHandedness() {
      const selector = state.interaction && state.interaction.diagnosticHandedness;
      const allowed = selector && Array.isArray(selector.allowedValues) ? [...new Set(selector.allowedValues.map(clean).filter(Boolean))] : [];
      if (allowed.length === 1) return allowed[0];
      const selected = clean(byId("contractDiagnosticHandedness").value);
      return allowed.includes(selected) ? selected : "";
    }
    const byId = id => document.getElementById(id);
    const status = message => {
      byId("contractStatus").textContent = message;
      const secStatus = byId("contractSecStatus");
      if (secStatus) secStatus.textContent = message;
    };

    function syncTargetProjection() {
      if (precisionTapController) return;
      const image = byId("contractTargetImage");
      const frame = image && image.closest(".contract-image-frame");
      if (!image || !frame) return;
      syncProjectionLayerToImage(byId("contractMarkers"), image, frame);
      syncProjectionLayerToImage(byId("contractTapSurface"), image, frame);
    }

    function fitTargetImage() {
      if (!state.image || !Number(state.image.widthPx) || !Number(state.image.heightPx)) return;
      const image = byId("contractTargetImage");
      const maximumWidth = Math.max(240, Math.min(1040, document.documentElement.clientWidth - 32));
      const maximumHeight = Math.max(300, Math.min(760, window.innerHeight * 0.68));
      const scale = Math.min(maximumWidth / state.image.widthPx, maximumHeight / state.image.heightPx, 4);
      const frame = image.closest(".contract-image-frame");
      if (frame) frame.dataset.ugoProjectionPlane = "normalized-source-image";
      if (frame) {
        frame.style.width = `${state.image.widthPx * scale}px`;
        frame.style.height = `${state.image.heightPx * scale}px`;
      }
      image.style.aspectRatio = `${state.image.widthPx} / ${state.image.heightPx}`;
      image.style.objectFit = "fill";
      requestAnimationFrame(() => precisionTapController ? precisionTapController.resetView() : syncTargetProjection());
    }

    function participantObjects() {
      const course = state.interaction && state.interaction.participantCourse;
      return course && Array.isArray(course.participants)
        ? course.participants.flatMap(participant => (participant.objects || []).map(object => ({ ...object, participantId: clean(participant.participantId), participantLabel: clean(participant.label) })))
        : [];
    }

    function objectCounts() {
      return state.observations.reduce((counts, observation) => {
        const objectId = clean(observation.declaredObjectId);
        if (objectId) counts[objectId] = (counts[objectId] || 0) + 1;
        return counts;
      }, {});
    }

    function renderObjectCourse() {
      const objects = participantObjects();
      const panel = byId("contractObjectCourse");
      panel.hidden = !objects.length;
      if (!objects.length) { state.selectedObjectId = ""; return; }
      if (!objects.some(object => object.objectId === state.selectedObjectId)) state.selectedObjectId = clean(objects[0].objectId);
      const counts = objectCounts();
      byId("contractObjectChoices").innerHTML = objects.map(object => {
        const count = counts[object.objectId] || 0;
        const quota = Number(object.shotQuota || 0);
        return `<button type="button" data-contract-object="${escapeHtml(object.objectId)}" aria-pressed="${object.objectId === state.selectedObjectId}" ${count >= quota ? "disabled" : ""}><span>${escapeHtml(object.participantLabel)} · ${escapeHtml(object.label)}</span><small>${count} of ${quota} shots</small></button>`;
      }).join("");
      const recorded = objects.reduce((total, object) => total + (counts[object.objectId] || 0), 0);
      const required = objects.reduce((total, object) => total + Number(object.shotQuota || 0), 0);
      byId("contractObjectProgress").textContent = `${recorded} of ${required} governed shots assigned`;
    }

    function paintMarkers() {
      const fixedAim = shouldRenderGovernedAim(missionFamily) && state.interaction.aim && state.interaction.aim.mode === "fixed" ? state.interaction.aim.points[0] : null;
      byId("contractMarkers").innerHTML = state.observations.map((point, index) => `<span class="contract-observation-marker precision-tap-marker" data-shot-index="${index + 1}" style="left:${point.xNorm * 100}%;top:${point.yNorm * 100}%" aria-label="Shot ${index + 1}"></span>`).join("") + (state.aim ? `<span class="contract-aim-marker" style="left:${state.aim.xNorm * 100}%;top:${state.aim.yNorm * 100}%"></span>` : (fixedAim ? `<span class="contract-aim-marker" style="left:${fixedAim.xNorm * 100}%;top:${fixedAim.yNorm * 100}%"></span>` : ""));
      syncTargetProjection();
      const observationRequirement = state.interaction && state.interaction.observations;
      const exactObservationCount = Number(observationRequirement && observationRequirement.exact);
      byId("contractObservationCount").textContent = Number.isInteger(exactObservationCount) && exactObservationCount > 0
        ? `${state.observations.length}/${exactObservationCount}`
        : String(state.observations.length);
      const shooterReviewAvailable = !state.isStaged && state.observations.length > 0;
      byId("contractUndoObservation").hidden = !shooterReviewAvailable;
      byId("contractUndoObservation").disabled = !shooterReviewAvailable;
      byId("contractClearObservations").hidden = !shooterReviewAvailable;
      byId("contractClearObservations").disabled = !shooterReviewAvailable;
      byId("contractShowResult").disabled = state.isStaged || !state.observations.length;
      byId("contractShowResult").textContent = state.observations.length ? "Show Result" : "Tap Bullet Holes";
      if (!state.isStaged && Number.isInteger(exactObservationCount) && exactObservationCount > 0) {
        const exactComplete = state.observations.length === exactObservationCount;
        byId("contractShowResult").disabled = !exactComplete;
        byId("contractShowResult").textContent = exactComplete
          ? "Show Result"
          : `Complete Shots (${state.observations.length}/${exactObservationCount})`;
      }
      const objects = participantObjects();
      if (objects.length) {
        const counts = objectCounts();
        const complete = objects.every(object => (counts[object.objectId] || 0) === Number(object.shotQuota || 0));
        const recorded = state.observations.length;
        const required = objects.reduce((total, object) => total + Number(object.shotQuota || 0), 0);
        byId("contractShowResult").disabled = !complete;
        byId("contractShowResult").textContent = complete ? "Show Result" : `Complete Course (${recorded}/${required})`;
        renderObjectCourse();
      }
      if (state.isStaged) byId("contractCueAdvance").disabled = !(state.observations.length || state.noObservationDeclared);
    }

    async function request(path, options = {}) {
      const response = await fetch(`${authorityOrigin}${path}`, { headers: { "Content-Type": "application/json", Accept: "application/json", ...(options.headers || {}) }, ...options });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        const error = new Error(payload && payload.reason || `request_failed_${response.status}`);
        error.payload = payload;
        error.httpStatus = response.status;
        throw error;
      }
      return payload;
    }

    async function loadRegisteredTarget() {
      const catalog = await request("/api/target-execution/catalog");
      const entry = (Array.isArray(catalog.targets) ? catalog.targets : []).find(item => clean(item.targetProfileId).toLowerCase() === targetId.toLowerCase() && clean(item.missionFamily) === missionFamily);
      const registration = entry && entry.registration;
      if (!hasExecutableRegisteredAsset(registration)) throw new Error("registered_target_image_unavailable");
      const registeredAssetUrl = new URL(registration.assetPath, location.href);
      const response = await fetch(registeredAssetUrl);
      if (!response.ok) throw new Error(`registered_target_image_failed_${response.status}`);
      await loadFile(await response.blob(), clean(registration.assetSha256), {
        assetUrl: registeredAssetUrl.pathname,
        mediaId: `registered-asset:${clean(registration.assetSha256).toLowerCase()}`
      });
      byId("contractCapture").hidden = true;
      status("Target loaded. Tap your shot holes.");
    }

  async function start(options = {}) {
      if (!targetId) throw new Error("registered_target_required");
      status("Resolving registered capability…");
      const activeSessionContext = global.SCZN3M4.getActiveMatrix?.() || {};
      const hasSelectedEquipment = [
        "setupId", "weaponCategory", "weaponManufacturer", "weaponModelType", "weaponModelCaliber",
        "weaponCatalogManufacturer", "weaponCatalogModel", "weaponCatalogCaliber", "opticType", "opticBrand",
        "opticModel", "ammoCaliber", "ammoManufacturer", "ammoLoad"
      ].some(key => clean(activeSessionContext[key]));
      const prepared = await request("/api/session/prepare", {
        method: "POST",
        body: JSON.stringify({
          targetId,
          missionFamily: missionFamily || undefined,
          ...(hasSelectedEquipment ? { equipmentCandidates: [{ ...activeSessionContext, source: activeSessionContext.setupId ? "weapon_library" : "one_time_setup" }] } : {})
        })
      });
      const selectedEquipment = prepared.setupMode === "shooter-selected" && Array.isArray(prepared.equipmentCandidates) && prepared.equipmentCandidates.length
        ? prepared.equipmentCandidates[0]
        : prepared.standardSetup;
      const started = await request("/api/session/start", { method: "POST", headers: { "Idempotency-Key": `contract-${runtimeId()}` }, body: JSON.stringify({ preparationToken: prepared.preparationToken, selectedEquipment }) });
      state.session = global.SCZN3M4.createAuthoritativeSession(started, { ...activeSessionContext, targetProfileId: started.target.targetId, target_profile_id: started.target.targetId, targetName: started.target.targetName, missionFamily: started.missionIdentity.missionFamily, resultPackageType: started.missionIdentity.resultPackageType });
      state.interaction = started.interactionContract || state.interaction;
      renderScoringModeSelector();
      renderElapsedTimeEntry();
      renderObjectCourse();
      state.isCueDrill = started.missionIdentity.missionFamily === "cueDrillOrchestration";
      state.isQualification = started.missionIdentity.missionFamily === "qualificationCourseEvaluation";
      state.isDiagnostic = started.missionIdentity.missionFamily === "diagnosticFeedbackEvaluation";
      state.isDecision = started.missionIdentity.missionFamily === "decisionScenarioEvaluation";
      state.isStaged = state.isCueDrill || state.isQualification || state.isDecision;
      renderDiagnosticHandednessSelector();
      byId("contractExperienceLabel").textContent = started.missionIdentity.missionFamily === "targetScoring" ? "Shoot" : "Target experience";
      byId("contractProductName").textContent = started.target.targetName;
      byId("contractMarkAim").hidden = !shouldRenderGovernedAim(started.missionIdentity.missionFamily) || state.isStaged || state.isDiagnostic || !state.interaction.aim || state.interaction.aim.mode !== "shooter_declared";
      byId("contractStart").hidden = true;
      byId("contractCapture").hidden = false;
      status("Session admitted. Load target evidence.");
      if (options.autoLoadRegistered === true) await loadRegisteredTarget();
    }

    async function loadFile(file, expectedSha256 = "", registered = null) {
      if (!file) return;
      const bytes = await file.arrayBuffer();
      const hash = await sha256Hex(bytes);
      if (expectedSha256 && hash !== expectedSha256.toLowerCase()) throw new Error("registered_target_image_hash_mismatch");
      const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const dimensions = await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ widthPx: image.naturalWidth, heightPx: image.naturalHeight }); image.onerror = reject; image.src = dataUrl; });
      state.imageDataUrl = dataUrl;
      state.image = { sha256: hash, ...dimensions, mediaType: file.type || "image/unknown", dataUrl, ...(registered || {}) };
      byId("contractTargetImage").src = dataUrl;
      fitTargetImage();
      if (smartTargetWorkspace) await smartTargetWorkspace.revealAfterDecode(byId("contractTargetImage"), { scroll: false });
      else byId("contractWorkspace").hidden = false;
      byId("contractDiagnosticPanel").hidden = !state.isDiagnostic;
      if (!shouldRenderGovernedAim(missionFamily) || state.isDiagnostic || state.isStaged || !state.interaction.aim || state.interaction.aim.mode !== "shooter_declared") byId("contractMarkAim").hidden = true;
      if (state.isStaged) await startCueRun();
      else status("Tap your shot holes.");
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
      await Promise.resolve(global.SCZN3M4.saveTargetEvidenceImage(persistentEvidenceImage(state.image)));
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

    async function showResult(scoringCaliber = "") {
      const scoringModeSelector = state.interaction && state.interaction.scoringMode;
      const scoringMode = scoringModeSelector ? clean(byId("contractScoringMode").value) : "";
      if (scoringModeSelector && !scoringMode) {
        status(`Choose ${clean(scoringModeSelector.label) || "the scoring mode"} before showing the result.`);
        byId("contractScoringMode").focus({ preventScroll: false });
        return;
      }
      const elapsedPolicy = state.interaction && state.interaction.elapsedTime;
      const elapsedAvailable = elapsedPolicy && clean(elapsedPolicy.mode) === "optional_manual_entry" && clean(elapsedPolicy.unit) === "seconds";
      if (elapsedAvailable && !state.elapsedTimeConfirmed) {
        const dialog = byId("contractElapsedTimeDialog");
        if (dialog && typeof dialog.showModal === "function") dialog.showModal();
        return;
      }
      const elapsedText = elapsedPolicy ? clean(byId("contractElapsedTime").value) : "";
      const elapsedTimeSeconds = elapsedText ? Number(elapsedText) : null;
      await persistSessionFacts();
      status("Requesting backend-authoritative result…");
      let result;
      try {
        result = await request("/api/target-execution", { method: "POST", body: JSON.stringify({ authoritativeSessionId: state.session.sessionId, evidence: { imageEvidence: state.image, observations: state.observations, shooterDeclaredAimPoint: state.aim, ...(scoringMode ? { scoringMode } : {}), ...(elapsedText ? { elapsedTimeSeconds } : {}), ...(scoringCaliber ? { scoringCaliber } : {}), ...(state.isDiagnostic ? { declaredHandedness: governedDiagnosticHandedness(), declaredOrientation: "registered_publisher_orientation" } : {}) } }) });
      } catch (error) {
        if (error.message !== "scoring_caliber_required") throw error;
        const answer = await requestScoringCaliber(error);
        if (!clean(answer)) {
          status("Caliber is required only for this score-changing boundary observation. Your taps remain preserved.");
          return;
        }
        return showResult(clean(answer));
      }
      await Promise.resolve(global.SCZN3M4.saveTargetEvidenceImage(persistentEvidenceImage(state.image)));
      state.session = await Promise.resolve(global.SCZN3M4.updateActiveSession({ authorityPackage: result, savedToSEC: false }));
      byId("contractCaptureView").hidden = true;
      byId("contractSecView").hidden = false;
      byId("contractSecRoot").innerHTML = renderSEC({ session: state.session, package: result });
      initializeSECInteractions(byId("contractSecRoot"), "session");
      status("Result ready.");
    }

    async function save() {
      const preserved = global.SCZN3M4.preserveActiveSEC("", state.session);
      if (!preserved) throw new Error("preservation_admission_failed");
      const response = await request("/api/session/sec", { method: "POST", body: JSON.stringify({ session: preserved }) });
      if (!global.SCZN3SECReopenAuthority?.remember(response)) throw new Error("sec_reopen_authority_unavailable");
      state.session = response.session;
      byId("contractSecRoot").innerHTML = renderSEC({ session: state.session, package: canonicalResult(state.session), preserved: true });
      initializeSECInteractions(byId("contractSecRoot"), "session");
      const saveStatus = document.querySelector("[data-contract-save-status]");
      if (saveStatus) saveStatus.textContent = "";
    }

    async function saveNote() {
      const input = byId("contractSecView").querySelector("[data-contract-sec-note]");
      if (!input) throw new Error("sec_note_editor_unavailable");
      state.session = await Promise.resolve(global.SCZN3M4.updateActiveSession({ secNote: clean(input.value) }));
      const saveStatus = document.querySelector("[data-contract-save-status]");
      if (saveStatus) saveStatus.textContent = "Note saved with this active session.";
      return "saved";
    }

    async function reopen(sessionId) {
      const response = await request(`/api/session/sec?session=${encodeURIComponent(sessionId)}`, {
        headers: global.SCZN3SECReopenAuthority?.authorizedHeaders(sessionId)
      });
      state.session = response.session;
      byId("contractCaptureView").hidden = true;
      byId("contractSecView").hidden = false;
      byId("contractSecRoot").innerHTML = renderSEC({ session: state.session, package: canonicalResult(state.session), mode: "historical", preserved: true });
      initializeSECInteractions(byId("contractSecRoot"));
      status("Saved Session Opened");
    }

    async function reopenProgression(evaluationId) {
      const response = await request(`/api/sec-progression/evaluate?evaluation=${encodeURIComponent(evaluationId)}`);
      const result = response.result;
      const progressionRecord = { progressionEvaluationId: evaluationId, recordType: "cross_session_progression", authorityPackage: result, matrixSnapshot: { targetProfileId: result.target.id, missionFamily: result.missionFamily, resultPackageType: result.resultPackageType }, preserved: true, preservedAt: response.preservedAt };
      byId("contractCaptureView").hidden = true;
      byId("contractSecView").hidden = false;
      byId("contractSecRoot").innerHTML = renderSEC({ session: progressionRecord, package: result, mode: "historical", preserved: true });
      initializeSECInteractions(byId("contractSecRoot"));
      status("Exact immutable Progression Record reopened.");
    }

    byId("contractStart").addEventListener("click", () => start().catch(error => status(`Unavailable: ${error.message}`)));
    byId("contractFile").addEventListener("change", event => loadFile(event.target.files[0]).catch(error => status(`Unable to load evidence: ${error.message}`)));
    function capturePrecisionTap(event) {
      const point = sourceImagePoint(event.clientX, event.clientY, renderedImageContentBox(byId("contractTargetImage")), { targetProfileId: targetId, sourceImageSha256: state.image && state.image.sha256, sourceImageWidthPx: state.image && state.image.widthPx, sourceImageHeightPx: state.image && state.image.heightPx });
      if (!point) { status("Tap inside the visible target image."); return; }
      if (state.aimMode) { state.aim = point; state.aimMode = false; }
      else {
        const observationRequirement = state.interaction && state.interaction.observations;
        const maximumObservationCount = Number(observationRequirement && observationRequirement.max);
        if (Number.isInteger(maximumObservationCount) && maximumObservationCount > 0 && state.observations.length >= maximumObservationCount) {
          status(`All ${maximumObservationCount} governed shots are already recorded. Undo, Clear, or Show Result.`);
          return;
        }
        const objects = participantObjects();
        if (objects.length && !state.selectedObjectId) { status("Choose the governed scoring object before recording the shot."); return; }
        state.observations.push(objects.length ? { ...point, declaredObjectId: state.selectedObjectId } : point);
        const exactObservationCount = Number(observationRequirement && observationRequirement.exact);
        status(Number.isInteger(exactObservationCount) && exactObservationCount > 0 && state.observations.length < exactObservationCount
          ? `${state.observations.length} of ${exactObservationCount} governed shots recorded.`
          : "Review your shots. Undo, Clear, or Show Result.");
      }
      paintMarkers();
    }
    byId("contractUndoObservation").addEventListener("click", () => { if (!state.observations.length) return; state.observations.pop(); paintMarkers(); status(state.observations.length ? "Last shot removed. Review your shots, Undo, Clear, or Show Result." : "Last shot removed. Tap your shot holes."); });
    byId("contractClearObservations").addEventListener("click", () => { if (!state.observations.length) return; state.observations = []; paintMarkers(); status("Shots cleared. Tap your shot holes."); });
    byId("contractObjectChoices").addEventListener("click", event => { const button = event.target.closest("[data-contract-object]"); if (!button || button.disabled) return; state.selectedObjectId = clean(button.dataset.contractObject); renderObjectCourse(); status("Scoring object selected. Tap that printed object."); });
    byId("contractMarkAim").addEventListener("click", () => {
      if (!shouldRenderGovernedAim(missionFamily) || !state.interaction.aim || state.interaction.aim.mode !== "shooter_declared") return;
      state.aimMode = true;
      status("Tap the shooter-declared aim point.");
    });
    const targetImage = byId("contractTargetImage");
    const targetFrame = targetImage && targetImage.closest(".contract-image-frame");
    if (targetImage && targetFrame) {
      targetImage.addEventListener("load", () => precisionTapController ? precisionTapController.resetView() : syncTargetProjection());
      if (typeof ResizeObserver === "function") {
        const targetProjectionObserver = new ResizeObserver(syncTargetProjection);
        targetProjectionObserver.observe(targetImage);
        targetProjectionObserver.observe(targetFrame);
      }
    }
    window.addEventListener("resize", () => { fitTargetImage(); syncTargetProjection(); });
    ["contractActualDistance", "contractDistanceUnit", "contractShooterName"].forEach(id => byId(id).addEventListener("change", () => persistSessionFacts().catch(error => status(`Session update unavailable: ${error.message}`))));
    byId("contractElapsedTimeContinue").addEventListener("click", () => {
      state.elapsedTimeConfirmed = true;
      byId("contractElapsedTimeDialog").close();
      showResult().catch(error => status(`Result unavailable: ${error.message}`));
    });
    byId("contractElapsedTimeUntimed").addEventListener("click", () => {
      byId("contractElapsedTime").value = "";
      state.elapsedTimeConfirmed = true;
      byId("contractElapsedTimeDialog").close();
      showResult().catch(error => status(`Result unavailable: ${error.message}`));
    });
    byId("contractElapsedTime").addEventListener("input", event => {
      const value = Number(event.currentTarget.value);
      byId("contractElapsedTimeContinue").disabled = !(Number.isFinite(value) && value > 0);
    });
    byId("contractEquipmentLibrary").addEventListener("click", event => openEquipmentLibrary(event).catch(error => status(`Equipment Library unavailable: ${error.message}`)));
    byId("contractShowResult").addEventListener("click", event => {
      const task = () => showResult();
      const run = global.SCZN3Processing?.run
        ? global.SCZN3Processing.run({ id: "target-result", message: "Building your result…", trigger: event.currentTarget, scope: byId("contractWorkspace") }, task)
        : task();
      Promise.resolve(run).catch(error => status(`Result unavailable: ${error.message}`));
    });
    byId("contractCueIssue").addEventListener("click", () => issueCue().catch(error => status(`Cue unavailable: ${error.message}`)));
    byId("contractCueNoObservation").addEventListener("click", () => recordNoObservation().catch(error => status(`Evidence unavailable: ${error.message}`)));
    byId("contractCueAdvance").addEventListener("click", () => advanceCue().catch(error => status(`Advance unavailable: ${error.message}`)));
    byId("contractCueStop").addEventListener("click", () => stopCue().catch(error => status(`Stop unavailable: ${error.message}`)));
    if (global.SCZN3Actions) {
      global.SCZN3Actions.bind(byId("contractSecView"), {
        save: { run: save, fail: error => status(`Save unavailable: ${error.message}`) },
        "note-save": { run: saveNote, fail: error => status(`Note unavailable: ${error.message}`) }
      }, {
        noteEditorSelector: "[data-sczn3-note-editor]",
        shareData: () => ({
          title: "Shooter Experience Card",
          text: clean(state.session && state.session.sessionLabel) || "SCZN3 session",
          url: global.location.href
        })
      });
    } else {
      document.addEventListener("click", event => { if (event.target.closest('[data-sczn3-action="save"]')) save().catch(error => status(`Save unavailable: ${error.message}`)); });
    }
    const equipmentDraft = pendingEquipmentDraft();
    if (reopenProgressionId) reopenProgression(reopenProgressionId).catch(error => status(`Progression reopen unavailable: ${error.message}`));
    else if (reopenSessionId) reopen(reopenSessionId).catch(error => status(`Reopen unavailable: ${error.message}`));
    else if (equipmentDraft) resumeEquipmentDraft(equipmentDraft).catch(error => status(`Target return unavailable: ${error.message}`));
    else if (autoLoadRegistered) start({ autoLoadRegistered: true }).catch(error => status(`Unavailable: ${error.message}`));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializePage);
  else initializePage();
})(window);
