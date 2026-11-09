(function initializeTst12StationResults(global) {
  "use strict";

  const PRESENTATION_ID = "sczn3-tst12-station-pip-cq-20261107-2";
  const DISCLOSURE_CONTROLLER_ID = "sczn3-tst12-session-accordion-20261104-4";
  const boundDisclosures = new WeakSet();
  const boundSessionStages = new WeakSet();
  const disclosureDiagnostics = [];
  const TARGET_PATTERN = /^(?:baker_tst12_(?:17_5x23|23x35)|sczn3_tst12_clean_v1(?:_23x35)?)$/;
  const CONDITIONS = Object.freeze([
    "Both Eyes / Right Hand Supported", "Right Eye / Right Hand Supported", "Left Eye / Right Hand Supported",
    "Both Eyes / Left Hand Only", "Right Eye / Left Hand Only", "Left Eye / Left Hand Only",
    "Both Eyes / Right Hand Only", "Right Eye / Right Hand Only", "Left Eye / Right Hand Only",
    "Both Eyes / Left Hand Supported", "Right Eye / Left Hand Supported", "Left Eye / Left Hand Supported"
  ]);
  const CONDITION_CODES = Object.freeze([
    "BOTH / RHS", "RE / RHS", "LE / RHS",
    "BOTH / LHO", "RE / LHO", "LE / LHO",
    "BOTH / RHO", "RE / RHO", "LE / RHO",
    "BOTH / LHS", "RE / LHS", "LE / LHS"
  ]);
  // Presentation-only crop geometry copied exactly from the Founder-approved
  // UGO contract squares. Backend classifications remain the sole scoring
  // authority; these bounds only place preserved artwork and observations.
  const UGO_STATION_PRESENTATION = Object.freeze({
    "17.5x23": Object.freeze({
      widthInches: 17.5,
      heightInches: 23,
      artwork: "assets/TST12_PRINT_17.5X23_TAP_N_SCORE_V1.svg",
      contractFingerprints: Object.freeze(["1c836e1596394c16316a7a32dd5145b83d7343e9a9b1c15321f97369bc9082e6"]),
      columns: Object.freeze([[0.05, 0.32142857142857145], [0.36428571428571427, 0.6357142857142857], [0.6785714285714286, 0.95]]),
      rows: Object.freeze([[0.05434782608695652, 0.2608695652173913], [0.2826086956521739, 0.4891304347826087], [0.5108695652173914, 0.717391304347826], [0.7391304347826086, 0.9456521739130435]])
    }),
    "23x35": Object.freeze({
      widthInches: 23,
      heightInches: 35,
      artwork: "assets/TST12_PRINT_23X35_TAP_N_SCORE_V1.svg",
      contractFingerprints: Object.freeze(["9c99f99b844b9cf1757cf3ca796849a5e7bef8b044cf05060310037be71e5529"]),
      columns: Object.freeze([[0.05434782608695652, 0.33695652173913043], [0.358695652173913, 0.6413043478260869], [0.6630434782608695, 0.9456521739130435]]),
      rows: Object.freeze([[0.04285714285714286, 0.22857142857142856], [0.2642857142857143, 0.45], [0.4857142857142857, 0.6714285714285714], [0.7071428571428572, 0.8928571428571429]])
    })
  });

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function canonicalRegionId(rawId) {
    const raw = String(rawId || "").trim();
    const match = raw.match(/^station_(\d+)_(square|black_ring_[1-4]|red_center|crosshair)$/);
    return match ? `station_${String(Number(match[1])).padStart(2, "0")}_${match[2]}` : raw;
  }

  function displayRegionLabel(regionId) {
    const normalized = String(regionId || "");
    const blackRing = normalized.match(/_black_ring_(\d+)$/);
    if (/_square$/.test(normalized)) return "Inside square";
    if (blackRing) return `Ring ${blackRing[1]}`;
    if (/_red_center$/.test(normalized)) return "Red circle";
    if (/_crosshair$/.test(normalized)) return "Crosshairs";
    return normalized;
  }

  function targetId(result) {
    return String(result && result.target && result.target.id || result && result.targetProfileId || "").trim();
  }

  function isTst12(result) {
    return TARGET_PATTERN.test(targetId(result));
  }

  function presentationGeometry(result) {
    const id = targetId(result);
    const size = /(?:23x35|_23x35)$/.test(id) ? "23x35" : "17.5x23";
    const model = UGO_STATION_PRESENTATION[size];
    return model ? { ...model, size } : null;
  }

  function stationSquare(model, station) {
    const column = model && model.columns[(station - 1) % 3];
    const row = model && model.rows[Math.floor((station - 1) / 3)];
    return column && row ? { xMin: column[0], xMax: column[1], yMin: row[0], yMax: row[1] } : null;
  }

  function authoritativeCoordinate(observation) {
    const canonical = observation && observation.canonicalTargetCoordinate;
    const x = Number((canonical && canonical.xNorm) ?? (observation && observation.xNorm));
    const y = Number((canonical && canonical.yNorm) ?? (observation && observation.yNorm));
    return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null;
  }

  function governedDiameterInches(result) {
    const ballistic = result && result.ballisticGeometry || {};
    const candidates = [
      ballistic.projectileDiameter && ballistic.projectileDiameter.diameterInches,
      ballistic.authorityScoringGauge && ballistic.authorityScoringGauge.diameterInches
    ];
    const range = ballistic.authorityScoringGauge && ballistic.authorityScoringGauge.authorizedRange;
    if (range && Number(range.min) === Number(range.max)) candidates.push(range.min);
    const value = candidates.map(Number).find(number => Number.isFinite(number) && number > 0);
    return Number.isFinite(value) ? value : null;
  }

  function creditedStationShots(shots, ledger) {
    const ids = Array.isArray(ledger && ledger.creditedObservationIds) ? ledger.creditedObservationIds.map(String) : [];
    if (ids.length) {
      const byId = new Map(shots.filter(Boolean).map(item => [String(item.observationId || ""), item]));
      const selected = ids.map(id => byId.get(id)).filter(Boolean);
      return { selected, complete: selected.length === ids.length, source: "authoritative_credited_observation_ids" };
    }
    const selected = shots.filter(item => item && item.creditedForScore === true);
    const expected = Number(ledger && ledger.creditedObservations);
    return { selected, complete: !Number.isFinite(expected) || selected.length === expected, source: "authoritative_classification_credit_flag" };
  }

  function impactLayouts(points, model, diameter) {
    const radius = diameter / 2;
    const capsuleWidth = 0.5;
    const capsuleHeight = 0.28;
    const gap = 0.07;
    const groups = new Map();
    points.forEach((point, index) => {
      const key = `${point.x.toFixed(9)}:${point.y.toFixed(9)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(index);
    });
    return points.map((point, index) => {
      const cx = point.x * model.widthInches;
      const cy = point.y * model.heightInches;
      const group = groups.get(`${point.x.toFixed(9)}:${point.y.toFixed(9)}`) || [index];
      const overlapIndex = group.indexOf(index);
      const capsuleStep = capsuleWidth + 0.04;
      const rightExtent = cx + radius + gap + capsuleWidth + (group.length - 1) * capsuleStep;
      const direction = rightExtent <= model.widthInches ? 1 : -1;
      const labelX = cx + direction * (radius + gap + capsuleWidth / 2 + overlapIndex * capsuleStep);
      const labelY = Math.max(capsuleHeight / 2, Math.min(model.heightInches - capsuleHeight / 2, cy));
      return { cx, cy, radius, labelX, labelY, direction, capsuleWidth, capsuleHeight, overlapCount: group.length };
    });
  }

  function cropForStation(model, square, selected, diameter) {
    if (!model || !square) return null;
    const radius = Number.isFinite(diameter) ? diameter / 2 : 0;
    const points = selected.map(authoritativeCoordinate).filter(Boolean);
    let xMin = square.xMin * model.widthInches;
    let xMax = square.xMax * model.widthInches;
    let yMin = square.yMin * model.heightInches;
    let yMax = square.yMax * model.heightInches;
    impactLayouts(points, model, diameter || 0).forEach(layout => {
      xMin = Math.min(xMin, layout.cx - radius, layout.labelX - layout.capsuleWidth / 2);
      xMax = Math.max(xMax, layout.cx + radius, layout.labelX + layout.capsuleWidth / 2);
      yMin = Math.min(yMin, layout.cy - radius, layout.labelY - layout.capsuleHeight / 2);
      yMax = Math.max(yMax, layout.cy + radius, layout.labelY + layout.capsuleHeight / 2);
    });
    const padding = 0.36;
    xMin -= padding; xMax += padding; yMin -= padding; yMax += padding;
    const size = Math.min(Math.max(xMax - xMin, yMax - yMin), Math.min(model.widthInches, model.heightInches));
    let x = (xMin + xMax - size) / 2;
    let y = (yMin + yMax - size) / 2;
    x = Math.max(0, Math.min(model.widthInches - size, x));
    y = Math.max(0, Math.min(model.heightInches - size, y));
    return { x, y, size };
  }

  function stationSvgMarkup(item, result, model, expanded = false) {
    const square = stationSquare(model, item.station);
    if (!square) return { available: false, reason: "The governed station geometry is unavailable." };
    if (!item.credit.complete) return { available: false, reason: "The preserved selected-observation identities are incomplete." };
    const coordinates = item.credit.selected.map(authoritativeCoordinate);
    if (coordinates.some(point => !point)) return { available: false, reason: "An authoritative selected-observation coordinate is unavailable." };
    const diameter = governedDiameterInches(result);
    if (item.credit.selected.length && !diameter) return { available: false, reason: "The governed impact footprint is unavailable." };
    const crop = cropForStation(model, square, item.credit.selected, diameter);
    if (!crop) return { available: false, reason: "The governed station crop is unavailable." };
    const indexById = new Map((Array.isArray(result.classifications) ? result.classifications : []).map((observation, index) => [String(observation && observation.observationId || ""), index + 1]));
    const layouts = impactLayouts(coordinates, model, diameter || 0);
    const markers = item.credit.selected.map((observation, index) => {
      const point = coordinates[index];
      const { cx, cy, radius, labelX, labelY, direction, capsuleWidth, capsuleHeight, overlapCount } = layouts[index];
      const number = indexById.get(String(observation.observationId || "")) || "";
      const footprint = `<circle class="tst12-pip-impact-footprint" cx="${cx}" cy="${cy}" r="${radius}"/><circle class="tst12-pip-impact-pinpoint" cx="${cx}" cy="${cy}" r="${Math.min(0.035, radius * 0.24)}"/>`;
      const leaderEndX = labelX - direction * capsuleWidth / 2;
      return `<g class="tst12-pip-impact" data-observation-id="${escapeHtml(observation.observationId)}" data-authoritative-x="${point.x}" data-authoritative-y="${point.y}" data-impact-center-x="${cx}" data-impact-center-y="${cy}" data-label-side="${direction === 1 ? "right" : "left"}" data-label-center-x="${labelX}" data-label-center-y="${labelY}" data-overlap-count="${overlapCount}">${footprint}<path class="tst12-pip-impact-leader" d="M${cx + direction * radius} ${cy}L${leaderEndX} ${labelY}"/><rect class="tst12-pip-impact-label" x="${labelX - capsuleWidth / 2}" y="${labelY - capsuleHeight / 2}" width="${capsuleWidth}" height="${capsuleHeight}" rx="${capsuleHeight / 2}"/><text class="tst12-pip-impact-number" x="${labelX}" y="${labelY}" font-size=".14">${escapeHtml(number)}</text></g>`;
    }).join("");
    const label = `Station ${item.station}. ${item.stateLabel}. ${item.credit.selected.length} impacts selected for scoring.`;
    return {
      available: true,
      markup: `<svg class="tst12-station-pip-svg${expanded ? " is-expanded" : ""}" viewBox="${crop.x} ${crop.y} ${crop.size} ${crop.size}" role="img" aria-label="${escapeHtml(label)}" data-ugo-physical-size="${model.widthInches}x${model.heightInches}" data-ugo-station-region="station_${String(item.station).padStart(2, "0")}_square" data-impact-diameter-inches="${diameter || "not-required"}"><image href="${escapeHtml(model.artwork)}" x="0" y="0" width="${model.widthInches}" height="${model.heightInches}" preserveAspectRatio="none"/>${markers}</svg>`
    };
  }

  function stationPipMarkup(item, result, model) {
    const preview = stationSvgMarkup(item, result, model, false);
    const expanded = stationSvgMarkup(item, result, model, true);
    if (!preview.available || !expanded.available) {
      const reason = preview.reason || expanded.reason;
      return `<div class="tst12-station-pip-unavailable" data-tst12-station-pip="unavailable" role="status"><strong>STATION PICTURE UNAVAILABLE</strong><span>${escapeHtml(reason)}</span></div>`;
    }
    const zoomIcon = `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8" cy="8" r="5"/><path d="M12 12l5 5M8 5v6M5 8h6"/></svg>`;
    const closeIcon = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>`;
    return `<details class="tst12-station-pip" data-tst12-station-pip="available"><summary aria-label="Toggle Station ${item.station} zoom inspection"><span class="tst12-station-pip-preview">${preview.markup}</span><span class="tst12-pip-zoom-control"><span class="when-closed">${zoomIcon}<b>ZOOM</b></span><span class="when-open">${closeIcon}<b>CLOSE</b></span></span></summary><section class="tst12-station-pip-inspection"><header><strong>STATION ${item.station} INSPECTION</strong><span>${escapeHtml(item.stateLabel)}</span></header>${expanded.markup}<p>Only Backend-selected scoring observations are shown. Centers and governed impact footprints use preserved authoritative coordinates.</p></section></details>`;
  }

  function unavailable(reason) {
    return `<section class="tst12-station-results-unavailable" data-tst12-station-results-renderer="unavailable" role="alert"><strong>Station Results unavailable.</strong><span>${escapeHtml(reason)}</span></section>`;
  }

  function recordDisclosure(disclosure, cause, event = null) {
    const entry = {
      at: new Date().toISOString(),
      cause,
      open: Boolean(disclosure && disclosure.open),
      trusted: Boolean(event && event.isTrusted),
      connected: Boolean(disclosure && disclosure.isConnected),
      controller: DISCLOSURE_CONTROLLER_ID,
      stack: String(new Error().stack || "").split("\n").slice(1, 7).join("\n")
    };
    disclosureDiagnostics.push(entry);
    if (disclosureDiagnostics.length > 80) disclosureDiagnostics.shift();
    global.SCZN3Tst12DisclosureDiagnostics = disclosureDiagnostics.slice();
    return entry;
  }

  function collapseDisclosure(disclosure, cause) {
    if (!disclosure) return false;
    const wasOpen = Boolean(disclosure.open);
    disclosure.open = false;
    recordDisclosure(disclosure, cause);
    return wasOpen;
  }

  function bindDisclosure(root, sessionStage = null) {
    if (!root || typeof root.querySelectorAll !== "function") return 0;
    const disclosures = [...root.querySelectorAll(".tst12-session-details, .tst12-station-performance")];
    disclosures.forEach(disclosure => {
      collapseDisclosure(disclosure, disclosure.open ? "bind-rejected-initial-open" : "bind-collapsed");
      disclosure.dataset.tst12DisclosureController = DISCLOSURE_CONTROLLER_ID;
      if (boundDisclosures.has(disclosure)) return;
      boundDisclosures.add(disclosure);
      let authorizedOpen = false;
      const summary = disclosure.querySelector(":scope > summary");
      summary?.addEventListener("click", event => {
        authorizedOpen = !disclosure.open;
        if (authorizedOpen) disclosures.forEach(sibling => {
          if (sibling !== disclosure && sibling.open) collapseDisclosure(sibling, "sibling-user-open-reset");
        });
        recordDisclosure(disclosure, authorizedOpen ? "header-open-request" : "header-close-request", event);
      });
      disclosure.addEventListener("toggle", event => {
        if (disclosure.open && !authorizedOpen) {
          recordDisclosure(disclosure, "blocked-non-user-open", event);
          disclosure.open = false;
          authorizedOpen = false;
          return;
        }
        recordDisclosure(disclosure, disclosure.open ? "header-open" : "collapsed", event);
        authorizedOpen = false;
      });
    });
    if (sessionStage && !boundSessionStages.has(sessionStage)) {
      boundSessionStages.add(sessionStage);
      sessionStage.addEventListener("toggle", () => {
        sessionStage.querySelectorAll(".tst12-session-details, .tst12-station-performance").forEach(disclosure => {
          collapseDisclosure(disclosure, sessionStage.open ? "session-open-reset" : "session-close-reset");
        });
      });
    }
    return disclosures.length;
  }

  function conditionMarkup(index) {
    const [eyeCode, handCode] = CONDITION_CODES[index].split(" / ");
    const [eyeLabel, handLabel] = CONDITIONS[index].split(" / ");
    const part = (code, label) => `<span class="tst12-condition-part" aria-label="${escapeHtml(code)} — ${escapeHtml(label)}"><b>${escapeHtml(code)}</b><span class="tst12-condition-separator" aria-hidden="true">—</span><span class="tst12-condition-description">${escapeHtml(label)}</span></span>`;
    return `<span class="tst12-station-condition" aria-label="${escapeHtml(CONDITIONS[index])}">${part(eyeCode, eyeLabel)}${part(handCode, handLabel)}</span>`;
  }

  function render(result, options = {}) {
    if (!isTst12(result)) return unavailable("The preserved result is not a governed TST-12 package.");
    const classifications = Array.isArray(result.classifications) ? result.classifications : [];
    const scoring = result.scoring && typeof result.scoring === "object" ? result.scoring : null;
    const policy = scoring && scoring.stationCreditPolicy || {};
    if (!scoring || String(policy.mode || "") !== "best_scoring_observations_per_station") {
      return unavailable("The authoritative station ledger is missing or incomplete.");
    }

    const stationLedgerById = new Map((Array.isArray(scoring.stationBestFive) ? scoring.stationBestFive : [])
      .map(item => [canonicalRegionId(item && item.stationRegionId), item]));
    const regionLedgerById = new Map((Array.isArray(scoring.regionResults) ? scoring.regionResults : [])
      .map(item => [canonicalRegionId(item && item.regionId), item]));
    const stations = Array.from({ length: 12 }, (_, index) => {
      const station = index + 1;
      const expectedId = `station_${String(station).padStart(2, "0")}_square`;
      const shots = classifications.filter(item => canonicalRegionId(item && item.assignedStationRegionId) === expectedId);
      const ledger = stationLedgerById.get(expectedId) || {};
      const credit = creditedStationShots(shots, ledger);
      const creditedShots = credit.selected;
      const hits = Number.isFinite(Number(ledger.actualHits)) ? Number(ledger.actualHits) : shots.filter(item => item && item.countsAsHit === true).length;
      const misses = Number.isFinite(Number(ledger.actualMisses)) ? Number(ledger.actualMisses) : shots.filter(item => item && item.countsAsHit === false).length;
      const unresolved = shots.filter(item => item && item.countsAsHit !== true && item.countsAsHit !== false).length;
      const expectedRegions = [
        expectedId,
        ...[1, 2, 3, 4].map(ring => `${expectedId.replace(/_square$/, "")}_black_ring_${ring}`),
        `${expectedId.replace(/_square$/, "")}_red_center`,
        `${expectedId.replace(/_square$/, "")}_crosshair`
      ];
      const regions = expectedRegions.map((regionId, order) => {
        const row = regionLedgerById.get(regionId) || {};
        return {
          label: displayRegionLabel(regionId),
          value: Number(row.value || 0),
          taps: Number(row.countedHitCount || 0),
          points: Number(row.points || 0),
          order
        };
      }).sort((left, right) => right.value - left.value || left.order - right.order);
      const selected = Number.isFinite(Number(ledger.creditedObservations)) ? Number(ledger.creditedObservations) : creditedShots.length;
      const recorded = Number.isFinite(Number(ledger.totalObservations)) ? Number(ledger.totalObservations) : shots.length;
      const additional = Number.isFinite(Number(ledger.additionalObservations)) ? Number(ledger.additionalObservations) : Math.max(0, recorded - selected - unresolved);
      const selectedMisses = creditedShots.filter(item => item && item.countsAsHit === false).length;
      const score = Number.isFinite(Number(ledger.bestFiveScore)) ? Number(ledger.bestFiveScore) : regions.reduce((total, region) => total + region.points, 0);
      const state = recorded === 0 ? "not-attempted" : score === 0 ? "attempted-zero" : "scored";
      const stateLabel = state === "not-attempted" ? "NOT ATTEMPTED" : state === "attempted-zero" ? "ATTEMPTED · ZERO POINTS" : "SCORED";
      return { station, recorded, selected, additional, hits, misses, selectedMisses, score, ppt: recorded > 0 ? (score / recorded).toFixed(2) : "N/A", regions, shots, credit, state, stateLabel };
    });

    const attempted = stations.filter(item => item.recorded > 0);
    const totals = attempted.reduce((summary, item) => ({
      recorded: summary.recorded + item.recorded,
      selected: summary.selected + item.selected,
      additional: summary.additional + item.additional,
      hits: summary.hits + item.hits,
      misses: summary.misses + item.misses
    }), { recorded: 0, selected: 0, additional: 0, hits: 0, misses: 0 });
    const canonicalSessionPpt = result && result.sczn3Metrics && result.sczn3Metrics.pointsPerTap;
    const legacySessionPpt = Number.isFinite(Number(scoring.total)) && totals.recorded > 0 ? Number(scoring.total) / totals.recorded : null;
    const sessionPptValue = Number.isFinite(Number(canonicalSessionPpt)) ? Number(canonicalSessionPpt) : legacySessionPpt;
    const sessionPpt = Number.isFinite(sessionPptValue) ? sessionPptValue.toFixed(2) : "N/A";
    const simulatorPiP = String(options && options.experienceMode || "") === "simulation";
    const model = simulatorPiP ? presentationGeometry(result) : null;
    const displayedStations = simulatorPiP ? stations : attempted;
    const cardDetails = item => `<div class="tst12-station-region-details" aria-label="Station ${item.station} selected scoring regions"><strong>SELECTED FOR SCORING</strong><table><thead><tr><th scope="col">VALUE &amp; REGION</th><th scope="col">TAPS</th><th scope="col">POINTS</th></tr></thead><tbody>${item.regions.map(region => `<tr><th scope="row">${region.value} – ${escapeHtml(region.label)}</th><td>${region.taps}</td><td>${region.points}</td></tr>`).join("")}<tr class="tst12-station-miss"><th scope="row">0 – Miss</th><td>${item.selectedMisses}</td><td>0</td></tr><tr class="tst12-station-total"><th scope="row">TOTAL</th><td>${item.selected}</td><td>${item.score}</td></tr></tbody></table></div><section class="tst12-station-observation-summary" aria-label="Station ${item.station} observation summary"><div><span>TOTAL TAPS</span><strong>${item.recorded}</strong></div><div><span>HITS</span><strong>${item.hits}</strong></div><div><span>MISSES</span><strong>${item.misses}</strong></div><div><span>SELECTED FOR SCORING</span><strong>${item.selected}</strong></div><div class="is-additional"><span>ADDITIONAL OBSERVATIONS</span><strong>${item.additional}</strong></div></section>`;
    const cards = displayedStations.map(item => {
      if (!simulatorPiP) {
        return `<section class="tst12-station-card vault-tst12-station" data-tst12-station-card="${item.station}" data-tst12-station="${item.station}"><header><strong class="tst12-station-card-title">STATION ${item.station}</strong><span class="tst12-station-ppt"><b>POINTS PER TAP</b><strong>${item.ppt}</strong></span>${conditionMarkup(item.station - 1)}</header>${cardDetails(item)}</section>`;
      }
      return `<section class="tst12-station-card vault-tst12-station is-${item.state} has-station-pip" data-tst12-station-card="${item.station}" data-tst12-station="${item.station}" data-tst12-station-state="${item.state}"><header><div class="tst12-station-heading"><strong class="tst12-station-card-title">STATION ${item.station}</strong><span class="tst12-station-state">${escapeHtml(item.stateLabel)}</span><span class="tst12-station-ppt"><b>POINTS PER TAP</b><strong>${item.ppt}</strong></span></div>${stationPipMarkup(item, result, model)}${conditionMarkup(item.station - 1)}</header>${cardDetails(item)}</section>`;
    }).join("");
    const cardsOrEmpty = cards || `<p class="tst12-station-empty">No stations attempted yet. Unattempted stations are not misses.</p>`;
    return `<details class="tst12-station-performance vault-tst12-stations" data-tst12-station-results-renderer="${PRESENTATION_ID}"><summary>Station Results</summary><section class="tst12-station-overview vault-tst12-station-note"><h3 class="tst12-total-station-results">TOTAL STATION RESULTS</h3><span class="tst12-session-ppt"><b>POINTS PER TAP</b><strong>${sessionPpt}</strong></span><strong class="tst12-stations-attempted">STATIONS ATTEMPTED: ${attempted.length} OF 12</strong><small>Unattempted stations are not misses.</small><div class="tst12-session-accounting" aria-label="Session observation accounting"><div><span>TOTAL TAPS</span><strong>${totals.recorded}</strong></div><div><span>HITS</span><strong>${totals.hits}</strong></div><div><span>MISSES</span><strong>${totals.misses}</strong></div><div><span>SELECTED FOR SCORING</span><strong>${totals.selected}</strong></div><div class="is-additional"><span>ADDITIONAL OBSERVATIONS</span><strong>${totals.additional}</strong></div></div><p>Up to five highest-scoring observations per attempted station are selected for scoring. Additional observations remain preserved.</p></section><div class="tst12-station-cards">${cardsOrEmpty}</div></details>`;
  }

  global.SCZN3Tst12StationResults = Object.freeze({ PRESENTATION_ID, DISCLOSURE_CONTROLLER_ID, isTst12, render, bindDisclosure });
})(window);
