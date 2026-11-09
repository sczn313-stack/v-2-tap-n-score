(function initializeTst12UniversalExperience(global) {
  "use strict";

  const TST12_PRESENTATION_ID = "sczn3-session-init-20261109-1";
  document.documentElement.dataset.tst12UniversalIdentity = TST12_PRESENTATION_ID;
  const TARGETS = Object.freeze({
    baker_tst12_17_5x23: Object.freeze({
      name: "TST-12-17.5",
      size: "17.5 × 23",
      route: "/t/baker/tst12-17-5x23/",
      cleanFaceAsset: "assets/TST12_PRINT_17.5X23_V1.svg",
      shooterCrop: Object.freeze({ sourceWidth: 1041, sourceHeight: 980, x: 42, y: 42, width: 525, height: 690 }),
      stationGrid: Object.freeze({ x: 0.05, y: 0.05434782608695652, width: 0.27142857142857146, height: 0.20652173913043478, columnStep: 0.3142857142857143, rowStep: 0.22826086956521738 })
    }),
    baker_tst12_23x35: Object.freeze({
      name: "TST-12-35",
      size: "23 × 35",
      route: "/t/baker/tst12-23x35/",
      cleanFaceAsset: "assets/TST12_PRINT_23X35_V1.svg",
      shooterCrop: Object.freeze({ sourceWidth: 1206, sourceHeight: 1134, x: 42, y: 42, width: 690, height: 1050 }),
      stationGrid: Object.freeze({ x: 0.05434782608695652, y: 0.04285714285714286, width: 0.2826086956521739, height: 0.1857142857142857, columnStep: 0.30434782608695654, rowStep: 0.22142857142857142 })
    }),
    sczn3_tst12_clean_v1: Object.freeze({
      name: "TST-12-17.5",
      size: "17.5 × 23",
      route: "/t/baker/tst12-17-5x23/",
      cleanFaceAsset: "assets/TST12_PRINT_17.5X23_V1.svg",
      shooterCrop: Object.freeze({ sourceWidth: 1041, sourceHeight: 980, x: 42, y: 42, width: 525, height: 690 }),
      stationGrid: Object.freeze({ x: 0.05, y: 0.05434782608695652, width: 0.27142857142857146, height: 0.20652173913043478, columnStep: 0.3142857142857143, rowStep: 0.22826086956521738 })
    }),
    sczn3_tst12_clean_v1_23x35: Object.freeze({
      name: "TST-12-35",
      size: "23 × 35",
      route: "/t/baker/tst12-23x35/",
      cleanFaceAsset: "assets/TST12_PRINT_23X35_V1.svg",
      shooterCrop: Object.freeze({ sourceWidth: 1206, sourceHeight: 1134, x: 42, y: 42, width: 690, height: 1050 }),
      stationGrid: Object.freeze({ x: 0.05434782608695652, y: 0.04285714285714286, width: 0.2826086956521739, height: 0.1857142857142857, columnStep: 0.30434782608695654, rowStep: 0.22142857142857142 })
    })
  });

  const RULES = Object.freeze([
    "Tap a numbered target to select the station you want to shoot. The cyan border shows your selected station. Selecting a station does not record a shot.",
    "Record as many shots as you want at each station, but ONLY YOUR FIVE HIGHEST-SCORING SHOTS PER STATION COUNT TOWARD YOUR POINTS. Switch stations or return whenever you want.",
    "Whenever you change stations, tap the new station's numbered button first. SCZN3 assigns the shots you record to that selected station.",
    "Scoring: Crosshair 5, red center 4, black ring 3, elsewhere inside the selected square 2, outside the square 0. Existing line-touch rules apply. Only the best five shots at each station receive scoring credit.",
    "Press SHOW RESULTS whenever you want to see your score, hits, misses, and station performance. Unfired shots are not misses.",
    "Save your Results and Shooter Experience Card to the Vault if desired.",
    "Safety: Follow all range commands and firearm-safety rules."
  ]);

  const STATION_CONDITIONS = Object.freeze([
    "Both Eyes / Right Hand Supported",
    "Right Eye / Right Hand Supported",
    "Left Eye / Right Hand Supported",
    "Both Eyes / Left Hand Only",
    "Right Eye / Left Hand Only",
    "Left Eye / Left Hand Only",
    "Both Eyes / Right Hand Only",
    "Right Eye / Right Hand Only",
    "Left Eye / Right Hand Only",
    "Both Eyes / Left Hand Supported",
    "Right Eye / Left Hand Supported",
    "Left Eye / Left Hand Supported"
  ]);
  const STATION_CONDITION_CODES = Object.freeze([
    "BOTH / RHS", "RE / RHS", "LE / RHS",
    "BOTH / LHO", "RE / LHO", "LE / LHO",
    "BOTH / RHO", "RE / RHO", "LE / RHO",
    "BOTH / LHS", "RE / LHS", "LE / LHS"
  ]);

  let lastStationPolicy = null;
  let lastGaugeCatalog = null;

  // This script is loaded before the universal runtime. Register immediately so
  // an auto-started registered-target session cannot dispatch before we retain
  // its UGO-backed station rectangles for the digital presentation.
  document.addEventListener("sczn3:target-session-started", event => {
    const interaction = event.detail && event.detail.interaction;
    lastStationPolicy = interaction && interaction.stationSequencePolicy || null;
    lastGaugeCatalog = interaction && interaction.scoringGaugeCatalog || null;
  });

  function byId(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function mountSessionDrawer(root, sessionMarkup, stationMarkup) {
    const sessionStage = root?.querySelector?.('details[data-sec-region="session"]');
    const sessionBody = sessionStage?.querySelector?.(":scope > .sec-stage-body");
    if (!sessionBody) return null;
    let group = sessionBody.querySelector(":scope > .tst12-result-session-group");
    if (!group) {
      group = document.createElement("section");
      group.className = "tst12-result-session-group";
      const close = sessionBody.querySelector(":scope > [data-sec-close-drawer]");
      sessionBody.insertBefore(group, close || null);
    }
    group.innerHTML = `${sessionMarkup}${stationMarkup}`;
    sessionBody.querySelectorAll(":scope > .sec-component-measurement, :scope > .sec-session-section:not(.tst12-session-details)").forEach(candidate => candidate.remove());
    root.querySelectorAll(".tst12-result-session-group").forEach(candidate => {
      if (candidate !== group) candidate.remove();
    });
    const disclosureController = global.SCZN3Tst12StationResults;
    if (disclosureController && typeof disclosureController.bindDisclosure === "function") disclosureController.bindDisclosure(group, sessionStage);
    return group;
  }

  global.SCZN3Tst12SessionDrawer = Object.freeze({ mount: mountSessionDrawer });

  function stationRect(stationRegions, stationNumber) {
    const region = stationRegions[stationNumber - 1];
    if (!region) return null;
    return {
      left: Number(region.xMin) * 100,
      top: Number(region.yMin) * 100,
      width: (Number(region.xMax) - Number(region.xMin)) * 100,
      height: (Number(region.yMax) - Number(region.yMin)) * 100
    };
  }

  function fitShooterFace(target) {
    const image = byId("contractTargetImage");
    const frame = image && image.closest(".contract-image-frame");
    const plane = byId("contractPrecisionTapPlane");
    const crop = target && target.shooterCrop;
    if (!image || !frame || !plane || !crop) return;
    const maximumWidth = Math.max(240, Math.min(1040, document.documentElement.clientWidth - 32));
    const maximumHeight = Math.max(300, Math.min(760, global.innerHeight * 0.68));
    const scale = Math.min(maximumWidth / crop.width, maximumHeight / crop.height, 4);
    frame.style.setProperty("width", `${crop.width * scale}px`, "important");
    frame.style.setProperty("height", `${crop.height * scale}px`, "important");
    image.style.setProperty("width", "100%", "important");
    image.style.setProperty("height", "100%", "important");
    image.style.setProperty("transform", "none", "important");
    image.style.setProperty("opacity", "1", "important");
  }

  function installShooterFace(target, mode) {
    const image = byId("contractTargetImage");
    const digitalFace = byId("contractDigitalTargetFace");
    const markers = byId("contractMarkers");
    if (!image || !digitalFace || !markers) return;

    function syncActiveStationBorder() {
      const activeRegionId = String(markers.dataset.activeStationRegion || "");
      digitalFace.querySelectorAll("[data-tst12-station-border]").forEach(border => {
        // This is the existing printable square border in the same SVG viewBox,
        // never a separately positioned overlay.
        border.classList.toggle("is-active", border.closest("[data-tst12-station]")?.dataset.tst12Station === activeRegionId);
      });
    }

    async function renderDigitalFace() {
      const response = await global.fetch(target.cleanFaceAsset, { cache: "no-store" });
      if (!response.ok) throw new Error("tst12_digital_face_unavailable");
      const documentTree = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
      const svg = documentTree.documentElement;
      const stationTemplate = svg.querySelector("defs #station");
      const stationUses = [...svg.querySelectorAll('[aria-label="Stations"] use[href="#station"]')];
      const numberTexts = [...svg.querySelectorAll("text")].filter(node => /^\d{1,2}$/.test(String(node.textContent || "").trim()));
      const numberBackdrops = [...svg.querySelectorAll("g")].find(group => group.children.length === 12 && [...group.children].every(node => node.tagName === "rect"));
      if (!stationTemplate || stationUses.length !== 12 || numberTexts.length !== 12 || !numberBackdrops) throw new Error("tst12_station_face_invalid");
      stationUses.forEach((stationUse, index) => {
        const station = stationTemplate.cloneNode(true);
        station.removeAttribute("id");
        station.setAttribute("data-tst12-station", `station_${String(index + 1).padStart(2, "0")}_square`);
        station.setAttribute("transform", `translate(${stationUse.getAttribute("x") || "0"} ${stationUse.getAttribute("y") || "0"})`);
        const border = station.querySelector(":scope > rect");
        if (!border) throw new Error("tst12_station_border_missing");
        border.setAttribute("data-tst12-station-border", "true");
        stationUse.replaceWith(station);
      });
      numberBackdrops.setAttribute("data-tst12-number-backdrops", "true");
      [...numberBackdrops.children].forEach((node, index) => {
        node.setAttribute("data-tst12-station-selector", `station_${String(index + 1).padStart(2, "0")}_square`);
        node.setAttribute("role", "button");
        node.setAttribute("aria-label", `Select Station ${index + 1}.`);
      });
      const numberLayer = numberTexts[0].parentElement;
      if (numberLayer) numberLayer.setAttribute("data-tst12-number-layer", "true");
      numberTexts.forEach((node, index) => {
        node.setAttribute("data-tst12-station-selector", `station_${String(index + 1).padStart(2, "0")}_square`);
        node.setAttribute("role", "button");
        node.setAttribute("aria-label", `Select Station ${index + 1}.`);
      });
      digitalFace.innerHTML = new XMLSerializer().serializeToString(svg);
      const coordinateSurface = digitalFace.querySelector("svg");
      if (coordinateSurface) coordinateSurface.setAttribute("data-observation-coordinate-surface", "true");
      digitalFace.classList.toggle("is-actual-overlay", mode === "actual");
      digitalFace.hidden = false;
      image.style.visibility = mode === "simulation" ? "hidden" : "visible";
      syncActiveStationBorder();
    }

    new MutationObserver(syncActiveStationBorder).observe(markers, { attributes: true, attributeFilter: ["data-active-station-region"] });
    ["pointerdown", "pointerup", "pointercancel"].forEach(type => digitalFace.addEventListener(type, event => {
      if (!event.target.closest("[data-tst12-station-selector]")) return;
      event.stopPropagation();
    }));
    digitalFace.addEventListener("click", event => {
      const selector = event.target.closest("[data-tst12-station-selector]");
      if (!selector) return;
      event.preventDefault();
      event.stopPropagation();
      const stationRegionId = selector.getAttribute("data-tst12-station-selector");
      markers.dataset.activeStationRegion = stationRegionId;
      document.dispatchEvent(new CustomEvent("sczn3:tst12-station-selected", { detail: { stationRegionId } }));
    });
    digitalFace.addEventListener("dblclick", event => {
      const selector = event.target.closest("[data-tst12-station-selector]");
      if (!selector) return;
      event.preventDefault();
      event.stopPropagation();
    });
    image.addEventListener("load", () => {
      if (image.dataset.tst12ShooterFace !== "loading") return;
      image.dataset.tst12ShooterFace = "ready";
      image.alt = `${target.name} target`;
      global.requestAnimationFrame(() => global.requestAnimationFrame(() => {
        if (mode === "simulation") fitShooterFace(target);
        renderDigitalFace().catch(() => {
          digitalFace.hidden = true;
          image.style.visibility = "visible";
        });
        // Let the existing precision-tap controller recenter against the final
        // clean-face dimensions after this replacement image has loaded.
        image.dispatchEvent(new Event("load"));
      }));
    });
    if (mode === "simulation") global.addEventListener("resize", () => fitShooterFace(target), { passive: true });
    document.addEventListener("sczn3:target-session-started", () => {
      if (mode === "actual") {
        image.dataset.tst12ShooterFace = "loading";
        return;
      }
      image.addEventListener("load", () => {
        image.dataset.tst12ShooterFace = "loading";
        image.src = target.cleanFaceAsset;
      }, { once: true });
    }, { once: true });
  }

  function installTargetStationWarning() {
    const frame = document.querySelector(".contract-image-frame");
    const status = byId("contractStatus");
    if (!frame || !status || byId("tst12TargetStationWarning")) return;
    const warning = document.createElement("p");
    warning.id = "tst12TargetStationWarning";
    warning.className = "tst12-target-station-warning";
    warning.setAttribute("role", "status");
    warning.setAttribute("aria-live", "polite");
    warning.hidden = true;
    frame.append(warning);
    let dismissTimer = 0;
    const dismiss = () => {
      global.clearTimeout(dismissTimer);
      dismissTimer = 0;
      warning.hidden = true;
      warning.textContent = "";
    };
    const sync = () => {
      const message = String(status.textContent || "").trim();
      if (message !== "Select a station before recording a shot.") return;
      global.clearTimeout(dismissTimer);
      warning.textContent = message;
      warning.hidden = false;
      dismissTimer = global.setTimeout(dismiss, 2500);
    };
    new MutationObserver(sync).observe(status, { childList: true, characterData: true, subtree: true });
    document.addEventListener("sczn3:tst12-station-selected", dismiss);
  }

  function relocateRoundControls() {
    const fields = document.querySelector(".contract-session-setup-fields");
    const actions = document.querySelector(".contract-observation-actions");
    if (!fields || !actions || actions.dataset.tst12Relocated === "true") return;
    actions.dataset.tst12Relocated = "true";
    actions.dataset.tst12HasObservations = "false";
    actions.classList.add("tst12-round-controls");
    const result = byId("contractShowResult");
    const frame = document.querySelector(".contract-image-frame");
    if (result && frame) {
      const belowTarget = document.createElement("div");
      belowTarget.className = "tst12-below-target-actions";
      frame.insertAdjacentElement("afterend", belowTarget);
      belowTarget.append(result);
    }
    fields.append(actions);
    byId("contractMarkAim").hidden = true;
    const progress = document.createElement("div");
    progress.className = "tst12-round-progress";
    progress.id = "tst12RoundProgress";
    progress.innerHTML = "<strong>SELECT YOUR CALIBER AND ENTER YOUR SHOOTING DISTANCE.</strong>";
    fields.append(progress);
  }

  function humanizeShooterExperience() {
    const host = byId("contractShooterExperience");
    if (!host || host.hidden || !host.innerHTML.trim() || host.dataset.tst12Humanized === "true") return;
    const technical = host.innerHTML;
    host.dataset.tst12Humanized = "true";
    host.innerHTML = '<strong>Your TST-12 round</strong><p>Select a numbered station, then tap the impact location.</p><small>Record as many shots as needed. The best five per station score.</small><details><summary>Target details</summary><div class="tst12-technical-details"></div></details>';
    host.querySelector(".tst12-technical-details").innerHTML = technical;
  }

  function humanStatus(message, mode) {
    const text = String(message || "");
    if (/^Target loaded\. Tap your shot holes\.?$/i.test(text)) return "";
    if (/Resolving registered capability/i.test(text)) return "Getting your target ready...";
    if (/Session admitted/i.test(text)) return mode === "simulation" ? "Loading your target..." : "Take or choose a target photo.";
    if (/Backend-authoritative/i.test(text)) return "Your results are ready.";
    if (/registered_target_image/i.test(text)) return "The registered target could not be loaded.";
    return text;
  }

  function installStatusLanguage(mode) {
    const status = byId("contractStatus");
    if (!status) return;
    new MutationObserver(() => {
      const next = humanStatus(status.textContent, mode);
      if (next !== status.textContent) status.textContent = next;
    }).observe(status, { childList: true, characterData: true, subtree: true });
  }

  function installRoundBehavior(target, mode) {
    const markerLayer = byId("contractMarkers");
    const status = byId("contractStatus");
    if (!markerLayer || !status) return;

    function normalizedCaliber(value) {
      return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    function governedCaliberValues() {
      const options = lastGaugeCatalog && Array.isArray(lastGaugeCatalog.options) ? lastGaugeCatalog.options : [];
      return new Set(options.flatMap(option => [option.value, option.caliberId, ...(option.aliases || [])]
        .map(normalizedCaliber)
        .filter(Boolean)));
    }

    function requiredSetup() {
      const distance = Number(byId("contractActualDistance")?.value);
      const caliber = String(byId("contractScoringCaliber")?.value || "").trim();
      return { distanceValid: Number.isFinite(distance) && distance > 0, caliberValid: governedCaliberValues().has(normalizedCaliber(caliber)) };
    }

    function announceMissingSetup() {
      const { distanceValid, caliberValid } = requiredSetup();
      [byId("contractActualDistance"), byId("contractScoringCaliber")].forEach((field, index) => {
        const valid = index === 0 ? distanceValid : caliberValid;
        if (!field) return;
        if (valid) field.removeAttribute("aria-invalid");
        else field.setAttribute("aria-invalid", "true");
      });
      const progress = byId("tst12RoundProgress");
      if (progress) progress.querySelector("strong").textContent = !caliberValid
        ? "SELECT YOUR CALIBER FIRST."
        : "ENTER YOUR SHOOTING DISTANCE.";
      document.body.classList.toggle("tst12-setup-incomplete", !distanceValid || !caliberValid);
      if (!distanceValid || !caliberValid) status.textContent = "";
      return false;
    }

    function setupReady() {
      const { distanceValid, caliberValid } = requiredSetup();
      return distanceValid && caliberValid;
    }

    const sync = () => {
      const markers = Array.from(markerLayer.querySelectorAll(".contract-observation-marker"));
      const count = Number(markerLayer.dataset.totalObservationCount || markers.length);
      const controls = document.querySelector(".tst12-round-controls");
      if (controls) controls.dataset.tst12HasObservations = count > 0 ? "true" : "false";
      const activeStationRegionId = markerLayer.dataset.activeStationRegion || "";
      const activeStationMatch = activeStationRegionId.match(/^station_(\d+)_square$/);
      const activeStation = activeStationMatch ? Number(activeStationMatch[1]) : null;
      const activeCount = Number(markerLayer.dataset.selectedStationObservationCount || markers.length);
      const progress = byId("tst12RoundProgress");
      if (progress) {
        progress.querySelector("strong").textContent = setupReady()
          ? activeStation
            ? `TAP WHERE YOUR SHOTS HIT · STATION ${activeStation}: ${activeCount} RECORDED · ${count} TOTAL`
            : "TAP YOUR FIRST STATION"
          : requiredSetup().caliberValid
            ? "ENTER YOUR SHOOTING DISTANCE."
            : "SELECT YOUR CALIBER FIRST.";
        progress.dataset.activeStation = activeStation ? String(activeStation) : "";
        progress.dataset.stationShotCount = activeStation ? String(activeCount) : "0";
        progress.dataset.totalShotCount = String(count);
      }
      document.body.classList.toggle("tst12-setup-incomplete", !setupReady());
      document.querySelectorAll(".tst12-mode-link").forEach(link => {
        if (count === 0) link.setAttribute("data-allow-mission-exit", "");
        else link.removeAttribute("data-allow-mission-exit");
      });
      const result = byId("contractShowResult");
      if (result) {
        const ready = count > 0;
        result.textContent = "SHOW RESULTS";
        result.classList.toggle("is-tst12-ready", ready);
        result.dataset.tst12ResultReady = ready ? "true" : "false";
        result.disabled = !ready;
        if (ready) {
          result.removeAttribute("aria-disabled");
          result.setAttribute("aria-label", "Show TST-12 results");
        } else {
          result.removeAttribute("aria-label");
        }
      }
      if (!/opening|result/i.test(status.textContent)) status.textContent = "";
      humanizeShooterExperience();
    };

    new MutationObserver(sync).observe(markerLayer, { childList: true });
    document.addEventListener("sczn3:tst12-station-selected", () => {
      global.requestAnimationFrame(() => {
        sync();
        if (!setupReady()) announceMissingSetup();
      });
    });
    document.addEventListener("sczn3:target-session-started", () => global.requestAnimationFrame(sync), { once: true });
    const tapSurface = byId("contractTapSurface");
    tapSurface?.addEventListener("pointerdown", event => {
      if (setupReady()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      announceMissingSetup();
    }, true);
    document.addEventListener("input", event => {
      if (!["contractActualDistance", "contractScoringCaliber"].includes(event.target && event.target.id)) return;
      if (setupReady()) {
        byId("contractActualDistance")?.removeAttribute("aria-invalid");
        byId("contractScoringCaliber")?.removeAttribute("aria-invalid");
      }
    });
    sync();
    byId("contractShowResult")?.addEventListener("click", event => {
      if (event.currentTarget.disabled || event.currentTarget.dataset.tst12ResultReady !== "true") return;
      status.textContent = "Opening your results…";
    }, true);
  }

  function targetUrl(mode) {
    const url = new URL(global.location.href);
    url.searchParams.set("missionFamily", "targetScoring");
    url.searchParams.set("experienceMode", mode);
    if (mode === "simulation") url.searchParams.set("source", "registered");
    else url.searchParams.delete("source");
    return url.toString();
  }

  function rulesMarkup() {
    const emphasizedClause = "ONLY YOUR FIVE HIGHEST-SCORING SHOTS PER STATION COUNT TOWARD YOUR POINTS";
    return `<div class="tst12-read-instructions" id="tst12ReadInstructions" hidden><ol>${RULES.map((rule, index) => {
      if (index !== 1) return `<li>${escapeHtml(rule)}</li>`;
      const [before, after] = rule.split(emphasizedClause);
      return `<li>${escapeHtml(before)}<strong class="tst12-five-shot-clause">${escapeHtml(emphasizedClause)}</strong>${escapeHtml(after)}</li>`;
    }).join("")}</ol></div>`;
  }

  function syncNarrationControls(status) {
    const hear = byId("tst12HearInstructions");
    const toggle = byId("tst12NarrationToggle");
    const stop = byId("tst12NarrationStop");
    if (!hear || !toggle || !stop) return;
    const active = status === "playing" || status === "paused";
    hear.hidden = active;
    toggle.hidden = !active;
    stop.hidden = !active;
    toggle.textContent = status === "paused" ? "Resume" : "Pause";
  }

  function initialize() {
    const params = new URLSearchParams(global.location.search);
    const targetId = String(params.get("target") || "").trim();
    const target = TARGETS[targetId];
    if (!target) {
      // Older exact-reopen links did not carry target identity. Once the
      // runtime has fetched the preserved Backend result, reload once with
      // that authoritative ID so the same TST-12 adapter owns the record.
      if (params.get("session")) {
        document.addEventListener("sczn3:target-result-rendered", event => {
          const resolvedTargetId = String(event.detail && event.detail.result && event.detail.result.target && event.detail.result.target.id || "").trim();
          if (!TARGETS[resolvedTargetId]) return;
          const url = new URL(global.location.href);
          url.searchParams.set("target", resolvedTargetId);
          url.searchParams.set("missionFamily", "targetScoring");
          url.searchParams.set("experienceMode", event.detail && event.detail.experienceMode === "simulation" ? "simulation" : "actual");
          global.location.replace(url.toString());
        }, { once: true });
      }
      return;
    }

    const requestedMode = String(params.get("experienceMode") || "").trim();
    const mode = requestedMode === "simulation" || requestedMode === "actual" ? requestedMode : "";
    const gate = byId("tst12ExperienceGate");
    const instructions = byId("tst12Instructions");
    const start = byId("contractStart");
    const introName = byId("contractProductName");
    const experienceLabel = byId("contractExperienceLabel");
    const status = byId("contractStatus");
    const captureLabel = document.querySelector('label[for="contractFile"]');

    function normalizeEquipmentSummary() {
      const summary = byId("contractEquipmentSummary");
      if (summary && /^standard setup$/i.test(summary.textContent.trim())) summary.textContent = "No equipment selected";
    }

    document.body.dataset.tst12Experience = "true";
    document.body.dataset.tst12Mode = mode || "choose";
    document.title = `${target.name} - SCZN3`;
    introName.textContent = `TARGET:\u00a0\u00a0\u00a0TST-12 · ${target.size}`;
    experienceLabel.textContent = "TST-12";

    gate.hidden = false;
    const actualRoundDevelopmentControl = mode === "actual"
      ? `<a class="button tst12-mode-link" data-allow-mission-exit href="${targetUrl("actual")}" aria-current="page">ACTUAL ROUND</a>`
      : "";
    gate.innerHTML = `${mode ? '<div class="tst12-instruction-bar"><span class="tst12-audio-controls"><button class="button tst12-hear" id="tst12HearInstructions" type="button">▶ HEAR</button><button class="button" id="tst12NarrationToggle" type="button" hidden>Pause</button><button class="button" id="tst12NarrationStop" type="button" hidden>Stop</button></span><strong>TARGET INSTRUCTIONS</strong><button class="button" id="tst12ReadToggle" type="button" aria-expanded="false">▶ READ</button></div>' : ""}<div class="tst12-mode-controls"><a class="button tst12-mode-link" data-allow-mission-exit href="${targetUrl("simulation")}"${mode === "simulation" ? ' aria-current="page"' : ""}>SIMULATOR</a>${actualRoundDevelopmentControl}</div>`;

    if (!mode) {
      // Compatibility for previously saved TST-12 links that carried a target
      // but not its experience mode. Wait for the same authoritative session
      // result the runtime uses for reopen, then reload with that saved mode.
      if (params.get("session")) {
        document.addEventListener("sczn3:target-result-rendered", event => {
          const savedMode = String(event.detail && event.detail.session && event.detail.session.matrixSnapshot && event.detail.session.matrixSnapshot.experienceMode || "").trim();
          const url = new URL(global.location.href);
          url.searchParams.set("experienceMode", savedMode === "simulation" || params.get("source") === "registered" ? "simulation" : "actual");
          global.location.replace(url.toString());
        }, { once: true });
      }
      start.hidden = true;
      status.textContent = "";
      return;
    }

    // SCZN3Tst12StationResults is the sole Station Results renderer.

    function stationPerformanceMarkup(result) {
      const renderer = global.SCZN3Tst12StationResults;
      if (!renderer || typeof renderer.render !== "function") {
        return '<section class="tst12-station-results-unavailable" data-tst12-station-results-renderer="unavailable" role="alert"><strong>Station Results unavailable.</strong><span>The approved TST-12 presentation contract did not load.</span></section>';
      }
      return renderer.render(result, { experienceMode: mode });
    }

    function clarifyResultTerminology(result, root) {
      const scoring = result && result.scoring || {};
      const recorded = Number(scoring.observationCount || 0);
      const credited = Number(scoring.creditedObservationCount ?? recorded);
      const additional = Number(scoring.additionalObservationCount ?? Math.max(0, recorded - credited));
      const hits = Number(scoring.actualHitCount ?? 0);
      const misses = Number(scoring.actualMissCount ?? 0);
      const tapSummary = root.querySelector(".contract-lifecycle-result .contract-tap-summary");
      if (!tapSummary) return;
      tapSummary.setAttribute("aria-label", "Actual hits, actual misses, and all recorded observations");
      tapSummary.innerHTML = `<strong>${hits} HIT${hits === 1 ? "" : "S"}</strong><i aria-hidden="true">|</i><strong>${misses} MISS${misses === 1 ? "" : "ES"}</strong><i aria-hidden="true">|</i><strong>${recorded} RECORDED</strong>`;
      const existing = root.querySelector(".tst12-credit-summary");
      if (existing) existing.remove();
      tapSummary.insertAdjacentHTML("afterend", `<section class="tst12-credit-summary" aria-label="Best-five scoring selection"><strong>${credited} SELECTED FOR SCORING</strong><i aria-hidden="true">|</i><strong>${additional} ADDITIONAL OBSERVATIONS</strong><small>Up to five highest-scoring observations per station are selected for scoring. Additional observations retain their hit/miss classification but do not contribute to the best-five score.</small></section>`);
    }

    function installMissedTapControl(result, root) {
      const classifications = Array.isArray(result && result.classifications) ? result.classifications : [];
      const missed = global.SCZN3TargetExecutionRuntime && typeof global.SCZN3TargetExecutionRuntime.missedTapNumbers === "function"
        ? global.SCZN3TargetExecutionRuntime.missedTapNumbers(result)
        : classifications.reduce((numbers, item, index) => {
          if (item && item.countsAsHit === false) numbers.push(index + 1);
          return numbers;
        }, []);
      const existing = root.querySelector(".contract-missed-tap-identifiers");
      const summary = missed.length ? missed.map(number => `#${number}`).join(", ") : "NONE";
      const markup = `<details class="contract-missed-tap-identifiers tst12-missed-taps-control"><summary><strong>MISSED TAPS:</strong><span>${summary}</span></summary><p${missed.length ? ' class="tst12-missed-taps-explanation"' : ""}>${missed.length ? "Only red missed-shot markers are shown on the target." : "No missed taps in this session."}</p></details>`;
      if (existing) existing.outerHTML = markup;
      else {
        const credit = root.querySelector(".tst12-credit-summary");
        if (credit) credit.insertAdjacentHTML("afterend", markup);
      }
      const control = root.querySelector(".tst12-missed-taps-control");
      const evidence = root.querySelector(".contract-lifecycle-before .contract-evidence-marker-layer");
      if (!control || !evidence) return;
      const markers = Array.from(evidence.querySelectorAll(".tst12-shot-marker"));
      const sync = () => markers.forEach(marker => { marker.hidden = control.open && marker.dataset.tst12ShotOutcome !== "miss"; });
      control.addEventListener("toggle", sync);
      sync();
    }

    function recordedValue(value) {
      const text = String(value || "").trim();
      return !text || /^(?:not selected|standard setup|no equipment selected)$/i.test(text) ? "Not recorded" : text;
    }

    function displayedCaliber(value) {
      const recorded = recordedValue(value);
      if (recorded === "Not recorded") return recorded;
      return recorded;
    }

    function sessionFactsMarkup() {
      const source = new Map(Array.from(byId("contractSecRoot")?.querySelectorAll(".sec-session-record-fields>div") || []).map(field => [
        field.querySelector("span")?.textContent.trim(),
        field.querySelector("strong")?.textContent.trim()
      ]));
      const saved = latestSession || {};
      const savedDistance = saved.sessionDistance && String(saved.sessionDistance.source || "") === "shooter-entered-session-fact" ? saved.sessionDistance : null;
      const distance = String(savedDistance && savedDistance.value || byId("contractActualDistance")?.value || "").trim();
      const unit = String(savedDistance && savedDistance.unit || byId("contractDistanceUnit")?.value || "YDS").toUpperCase() === "M" ? "meters" : "yards";
      const equipment = recordedValue(byId("contractEquipmentSummary")?.textContent);
      const existing = label => recordedValue(source.get(label));
      const fields = [
        ["Session", mode === "simulation" ? "Simulator" : "Actual Round"],
        ["Firearm", existing("Firearm") !== "Not recorded" ? existing("Firearm") : mode === "simulation" ? "Pistol" : "Not recorded"],
        ["Equipment", equipment !== "Not recorded" ? equipment : existing("Equipment")],
        ["Ammunition", existing("Ammunition")],
        ["Caliber", displayedCaliber(saved.scoringCaliber || byId("contractScoringCaliber")?.value || existing("Caliber"))],
        ["Distance", distance ? `${distance} ${unit}` : "Not recorded"],
        ["Angular unit", recordedValue(byId("tst12AngularUnit")?.value || existing("Angular unit"))],
        ["Shooter", recordedValue(byId("contractShooterName")?.value || existing("Shooter"))]
      ];
      const hasAuthoritativeFacts = source.size > 0 || Boolean(latestSession);
      const unavailable = hasAuthoritativeFacts ? "" : '<p class="tst12-session-data-unavailable" role="status">Saved session information is unavailable for this result.</p>';
      return `<details class="sec-session-section tst12-session-details"><summary>Session Details</summary>${unavailable}<div class="sec-session-record-fields">${fields.map(([label, value]) => `<div class="${value === "Not recorded" ? "is-unrecorded" : "is-recorded"}" data-session-field-state="${value === "Not recorded" ? "unrecorded" : "recorded"}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div></details>`;
    }

    function polishResultPresentation(result) {
      const root = polishCustomerResult();
      if (!root) return null;
      // The universal renderer supplies generic score drawers before this
      // TST-12 adapter runs. Replace every one with the station-owned view so
      // a saved or reopened SEC cannot leave a flat ring list behind.
      root.querySelectorAll("details[data-numeric-region-detail='true'], details[data-station-results='true'], details[data-station-score-distribution='true'], .contract-numeric-region-results").forEach(panel => panel.remove());
      const sessionMarkup = sessionFactsMarkup();
      const sessionGroup = mountSessionDrawer(root, sessionMarkup, stationPerformanceMarkup(result));
      if (!sessionGroup) return root;
      clarifyResultTerminology(result, root);
      installMissedTapControl(result, root);
      return root;
    }

    function polishCustomerResult() {
      const root = byId("contractSecRoot");
      if (!root) return null;
      root.dataset.tst12CustomerResult = "true";
      // The governed result keeps its measurements while the shooter-facing
      // record omits the publisher's engineering-only description.
      root.querySelectorAll(".contract-shooter-experience").forEach(panel => panel.remove());
      root.querySelectorAll('.sec-preservation-actions>[data-sczn3-action="save"]:disabled').forEach(action => action.remove());
      // This control creates the SEC; its standard label must remain visible.
      return root;
    }

    function markSimulatorResult(result) {
      if (mode !== "simulation") return;
      const root = polishCustomerResult();
      if (!root) return;
      root.dataset.tst12SimulatorResult = "true";
      const beforeImage = root.querySelector(".contract-lifecycle-before .contract-evidence img");
      if (beforeImage && target.cleanFaceAsset) {
        beforeImage.src = target.cleanFaceAsset;
        beforeImage.alt = `${target.name} clean shooting face`;
        beforeImage.dataset.tst12CleanBefore = "true";
      }
      // The universal target runtime owns the functional Simulator re-entry
      // control. TST-12 only marks its governed Result presentation here.
    }

    relocateRoundControls();
    installShooterFace(target, mode);
    installTargetStationWarning();
    installStatusLanguage(mode);
    normalizeEquipmentSummary();
    new MutationObserver(normalizeEquipmentSummary).observe(byId("contractEquipmentSummary"), { childList: true, characterData: true, subtree: true });

    start.textContent = "START ROUND";
    if (captureLabel) captureLabel.textContent = mode === "actual" ? "TAKE PHOTO / CHOOSE EXISTING PHOTO" : "LOAD REGISTERED TARGET";

    instructions.hidden = false;
    instructions.innerHTML = rulesMarkup();
    installRoundBehavior(target, mode);

    const player = global.SCZN3SelfTeachingPlayer.create({
      root: instructions,
      steps: RULES.map((narration, index) => ({ narration, after: index === RULES.length - 1 ? 0 : 300 })),
      renderStep: (_step, index) => {
        const items = instructions.querySelectorAll("li");
        items.forEach((item, itemIndex) => item.classList.toggle("is-speaking", itemIndex === index));
      },
      renderReset: () => instructions.querySelectorAll("li").forEach(item => item.classList.remove("is-speaking")),
      onStatusChange: narrationStatus => {
        syncNarrationControls(narrationStatus);
        if (narrationStatus === "completed") instructions.querySelectorAll("li").forEach(item => item.classList.remove("is-speaking"));
      }
    });
    byId("tst12HearInstructions").addEventListener("click", () => player.play());
    byId("tst12NarrationToggle").addEventListener("click", () => player.status === "paused" ? player.resume() : player.pause());
    byId("tst12NarrationStop").addEventListener("click", () => player.stop({ reset: true }));
    byId("tst12ReadToggle").addEventListener("click", event => {
      const panel = byId("tst12ReadInstructions");
      const open = panel.hidden;
      panel.hidden = !open;
      event.currentTarget.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("sczn3:target-observation-recorded", event => {
      if (event.detail?.targetId !== targetId || Number(event.detail?.observationCount) !== 1) return;
      const panel = byId("tst12ReadInstructions");
      const read = byId("tst12ReadToggle");
      if (!panel || !read || panel.hidden) return;
      panel.hidden = true;
      read.setAttribute("aria-expanded", "false");
    });
    syncNarrationControls("idle");
    let latestResult = null;
    let latestSession = null;
    // The universal runtime owns SEC markup.  This adapter owns only the
    // TST-12 replacement presentation, so make that post-render handoff
    // explicit instead of relying on a later DOM mutation to notice it.
    function applyResultPresentation(detail = {}) {
      if (detail.targetId !== targetId || !detail.result) return false;
      latestResult = detail.result;
      latestSession = detail.session || latestSession;
      polishResultPresentation(detail.result);
      if (detail.experienceMode === "simulation") markSimulatorResult(detail.result);
      return true;
    }
    global.SCZN3Tst12ResultPresentation = Object.freeze({ TST12_PRESENTATION_ID, targetId, applyResultPresentation });
    document.addEventListener("sczn3:target-result-ready", event => {
      if (event.detail && event.detail.presentationApplied) return;
      applyResultPresentation(event.detail);
    });
    document.addEventListener("sczn3:target-result-rendered", event => {
      if (event.detail && event.detail.presentationApplied) return;
      applyResultPresentation(event.detail);
    });
    // Saving replaces the SEC DOM without emitting a new result event. Reapply
    // the existing result presentation after that replacement.
    document.addEventListener("sczn3:target-session-preserved", event => {
      if (!event.detail || event.detail.targetId !== targetId || !latestResult) return;
      queueMicrotask(() => {
        polishResultPresentation(latestResult);
        if (mode === "simulation") markSimulatorResult(latestResult);
      });
    });
    const secRoot = byId("contractSecRoot");
    if (secRoot) new MutationObserver(() => {
      if (!latestResult || !secRoot.querySelector("article")) return;
      if (secRoot.querySelector(".tst12-result-session-group") && !secRoot.querySelector(".contract-shooter-experience")) return;
      queueMicrotask(() => {
        polishResultPresentation(latestResult);
        if (mode === "simulation") markSimulatorResult(latestResult);
      });
    }).observe(secRoot, { childList: true, subtree: true });

    document.addEventListener("sczn3:target-session-started", () => {
        const isExactReopen = Boolean(new URL(global.location.href).searchParams.get("session"));
        introName.textContent = `TARGET:\u00a0\u00a0\u00a0TST-12 · ${target.size}`;
        const distanceLabel = byId("contractActualDistance")?.closest("label");
        const distanceLabelText = distanceLabel?.querySelector("span");
        if (distanceLabel) {
          distanceLabel.classList.add("tst12-setup-field", "tst12-distance-field", "is-required");
          distanceLabel.dataset.tst12Required = "true";
        }
        if (distanceLabelText) distanceLabelText.textContent = "DISTANCE (YDS)";
        const distanceInput = byId("contractActualDistance");
        if (distanceInput) {
          if (!isExactReopen) distanceInput.value = "";
          distanceInput.placeholder = "Distance";
          distanceInput.setAttribute("aria-label", "Distance");
        }
        let caliberField = byId("contractScoringCaliber");
        const caliberLabel = caliberField?.closest("label");
        const caliberLabelText = caliberLabel?.querySelector("span");
        if (caliberLabel) {
          caliberLabel.classList.add("tst12-setup-field", "tst12-caliber-field", "is-required");
          caliberLabel.dataset.tst12Required = "true";
        }
        if (caliberLabelText) caliberLabelText.textContent = "CALIBER";
        const gaugeOptions = lastGaugeCatalog && Array.isArray(lastGaugeCatalog.options) ? lastGaugeCatalog.options : [];
        if (caliberField && caliberField.tagName !== "SELECT") {
          const recordedCaliber = caliberField.value;
          const caliberSelect = document.createElement("select");
          caliberSelect.id = "contractScoringCaliber";
          caliberSelect.setAttribute("aria-label", "Caliber");
          caliberSelect.innerHTML = `<option value="">Select Caliber</option>${gaugeOptions.map(option => {
            const available = option.availableForScoring !== false && Boolean(option.value);
            const diameter = Number(option.diameterInches);
            const suffix = available && Number.isFinite(diameter)
              ? ` · ${diameter.toFixed(3)} in`
              : ` · unavailable — ${String(option.unavailableReason || "scoring diameter unavailable")}`;
            return `<option value="${available ? escapeHtml(option.value) : ""}"${available && Number.isFinite(diameter) ? ` data-diameter-inches="${diameter}"` : ""}${available ? "" : " disabled"}>${escapeHtml(option.caliberId + suffix)}</option>`;
          }).join("")}`;
          caliberField.replaceWith(caliberSelect);
          caliberSelect.value = recordedCaliber;
          caliberField = caliberSelect;
        }
        const setupFields = document.querySelector(".contract-session-setup-fields");
        const shooterGroup = document.querySelector(".contract-shooter-caliber-fields");
        if (caliberLabel && setupFields && caliberLabel.parentElement !== setupFields) setupFields.insertBefore(caliberLabel, shooterGroup || null);
        const equipment = document.querySelector(".contract-equipment-entry");
        if (shooterGroup) shooterGroup.hidden = true;
        equipment?.remove();
        const panelLabel = byId("contractScoringModeLabel");
        if (panelLabel) panelLabel.hidden = true;
        normalizeEquipmentSummary();
        const setupPanel = byId("contractScoringModePanel");
        if (setupPanel && setupPanel.parentElement !== gate) gate.append(setupPanel);
        const unitSelect = byId("contractDistanceUnit");
        if (unitSelect) {
          unitSelect.classList.remove("tst12-distance-unit-source");
          unitSelect.setAttribute("aria-label", "Distance unit");
          unitSelect.innerHTML = '<option value="YDS">YDS</option><option value="M">M</option>';
        }
        if (setupFields && !byId("tst12AngularUnit")) {
          const angular = document.createElement("label");
          angular.className = "tst12-setup-field tst12-angular-field";
          angular.innerHTML = '<select id="tst12AngularUnit" aria-label="Angular unit"><option value="MOA">MOA</option><option value="MRAD">MRAD</option></select>';
          setupFields.insertBefore(angular, setupFields.querySelector(".tst12-round-progress"));
        }
        if (setupFields && !byId("tst12SetupRow")) {
          const setupRow = document.createElement("div");
          setupRow.id = "tst12SetupRow";
          setupRow.className = "tst12-setup-row";
          setupFields.insertBefore(setupRow, setupFields.firstChild);
          // Keep visible, associated labels in normal flow. Moving bare inputs
          // into the row previously discarded the only field names.
          [caliberLabel, distanceLabel, byId("tst12AngularUnit")?.closest("label")].forEach(label => {
            if (label) setupRow.append(label);
          });
        }
        if (mode === "simulation" && setupFields && !byId("tst12SimulatorFirearm")) {
          const firearm = document.createElement("span");
          firearm.id = "tst12SimulatorFirearm";
          firearm.className = "tst12-simulator-firearm";
          firearm.textContent = "FIREARM: PISTOL";
          setupFields.insertBefore(firearm, setupFields.firstChild);
        }
        const updateSetup = () => {
          const caliber = String(byId("contractScoringCaliber")?.value || "");
          const distance = Number(byId("contractActualDistance")?.value);
          const recognizedCalibers = new Set(gaugeOptions.flatMap(option => [option.value, option.caliberId, ...(option.aliases || [])]
            .map(value => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, ""))
            .filter(Boolean)));
          const caliberValid = recognizedCalibers.has(caliber.toLowerCase().replace(/[^a-z0-9]/g, ""));
          const distanceValid = Number.isFinite(distance) && distance > 0;
          const complete = caliberValid && distanceValid;
          setupPanel?.classList.toggle("is-tst12-setup-ready", complete);
          caliberField?.classList.toggle("is-tst12-setup-attention", !caliberValid);
          distanceInput?.classList.toggle("is-tst12-setup-attention", caliberValid && !distanceValid);
          document.querySelectorAll(".tst12-mode-link").forEach(link => {
            link.classList.toggle("is-tst12-setup-muted", !complete && link.getAttribute("aria-current") === "page");
          });
          const progress = byId("tst12RoundProgress");
          if (progress) progress.querySelector("strong").textContent = complete
            ? "TAP YOUR FIRST STATION"
            : "SELECT YOUR CALIBER AND ENTER YOUR SHOOTING DISTANCE.";
        };
        caliberField?.addEventListener("change", () => {
          updateSetup();
          if (caliberField.value) byId("contractActualDistance")?.focus({ preventScroll: true });
        });
        byId("contractActualDistance")?.addEventListener("change", updateSetup);
        byId("contractActualDistance")?.addEventListener("input", updateSetup);
        byId("contractDistanceUnit")?.addEventListener("change", updateSetup);
        if (mode === "simulation" && !isExactReopen) {
          // The simulator has an approved, editable starting setup. Choose the
          // existing governed .22 LR option so the normal session path retains
          // the caliber and its backend-authorized gauge handling.
          const simulatorGauge = gaugeOptions.find(option => String(option && option.caliberId || "").trim() === ".22 LR" && option.availableForScoring !== false && option.value);
          if (caliberField && !caliberField.value && simulatorGauge) caliberField.value = simulatorGauge.value;
          if (distanceInput && !distanceInput.value) distanceInput.value = "25";
          if (unitSelect && !unitSelect.value) unitSelect.value = "YDS";
          [caliberField, distanceInput, unitSelect].forEach(field => field?.dispatchEvent(new Event("change", { bubbles: true })));
        }
        updateSetup();
    }, { once: true });
    status.textContent = mode === "simulation"
      ? "Opening registered target for simulator."
      : "Start the round, then photograph or choose the actual target.";
    if (mode === "actual") {
      const beginActualRound = () => { if (!start.hidden) start.click(); };
      if (document.readyState === "complete") global.setTimeout(beginActualRound, 0);
      else global.addEventListener("load", beginActualRound, { once: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})(window);
