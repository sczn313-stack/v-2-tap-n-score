(function initializeM16A2TSTT() {
  "use strict";

  const targetImage = "assets/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg";
  const chapterThreeTargetImage = targetImage;
  const tapNScoreRoad = "matrix.html?target_profile_id=baker_m16a2_25m_zero&founder_review=1&tstt_chapter=4";
  const chapterThreeDemoRoad = "shoot.html?target_profile_id=baker_m16a2_25m_zero&prepared_demo=1&talking_demo=1&m16a2_demo=1&embedded_tstt=1&founder_review=1";
  const chapterTwoReferencePath = "authority-evidence/mfam/founder-supplied-chapter2-visual-reference";
  const chapterTwoReferenceImages = Object.freeze({
    frontSight: `${chapterTwoReferencePath}/FOUNDER_M16A2_FRONT_SIGHT_POST_REFERENCE_2026-09-04.jpeg`,
    rearWindage: `${chapterTwoReferencePath}/FOUNDER_M16A2_REAR_WINDAGE_KNOB_REFERENCE_2026-09-04.jpeg`,
    rearDrum: `${chapterTwoReferencePath}/FOUNDER_M16A2_REAR_ELEVATION_DRUM_8-3_REFERENCE_2026-09-04.jpeg`
  });
  const equipmentKeys = Object.freeze({ active: "SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", saved: "SCZN3_SAVED_EQUIPMENT_PROFILES" });
  const journeyKey = "SCZN3_TSTT_M16A2_JOURNEY_V1";
  const shootingSetupKey = "SCZN3_TSTT_M16A2_SHOOTING_SETUP_V1";
  const defaultEquipment = Object.freeze({ status: "none", label: "No active equipment selected" });
  const chapterOneFounderScript = Object.freeze([
    "Before making any sight adjustments, understand what this target is telling you.",
    "Always make the center crosshairs your aim point when zeroing your weapon.",
    "Each small square measures how far your shots are landing from the center crosshairs.",
    "On this target, each square in the columns represents one front-sight up-or-down click.",
    "Each square in the rows represents three rear-windage clicks, right or left.",
    "Fire three to five shots before making an adjustment.",
    "The center of your shot pattern gives a better picture of where your shots are landing.",
    "Once you have a shot pattern, Tap-n-Score can measure where it is in relation to the center crosshairs and tell you what adjustment to make.",
    "Next, we'll learn the sights."
  ]);
  const chapterOneSpokenNarration = chapterOneFounderScript.join(" ");
  const chapterOneNarrationPlan = Object.freeze(chapterOneFounderScript.map((text, index) => Object.freeze({
    text,
    audio: `assets/audio/episode60/chapter1/${String(index + 1).padStart(2, "0")}.wav`,
    cue: index === 3 ? "columns" : (index === 4 ? "rows" : "")
  })));
  const chapterTwoFounderScript = Object.freeze([
    "Controls elevation — moves your shot pattern up or down.",
    "Controls windage — moves your shot pattern right or left.",
    "For your 25-meter zero, set the drum to 8/3, then turn it one click CLOCKWISE past 8/3.",
    "After your zero is confirmed, turn it one click COUNTERCLOCKWISE back to 8/3 for the 300-meter setting.",
    "Now you know which sight controls you'll adjust when Tap-n-Score tells you how to move your shot pattern."
  ]);
  const chapterTwoNarrationSegments = Object.freeze([
    `Front sight post. ${chapterTwoFounderScript[0]}`,
    `Rear windage knob. ${chapterTwoFounderScript[1]}`,
    `Rear elevation drum. ${chapterTwoFounderScript[2]}`,
    chapterTwoFounderScript[3],
    chapterTwoFounderScript[4]
  ]);
  const chapterTwoSpokenNarration = chapterTwoNarrationSegments.join(" ");
  const chapterTwoNarrationPlan = Object.freeze(chapterTwoNarrationSegments.map((text, index) => Object.freeze({
    text,
    audio: `assets/audio/episode60/chapter2/${String(index + 1).padStart(2, "0")}.wav`
  })));
  const chapterThreeFounderScript = Object.freeze([
    "Watch Tap-n-Score zero this M16A2.",
    "See the aim point, shot pattern, measurement, sight adjustment, confirmation, Shooter Experience Card, and Ballistic Vault."
  ]);
  const chapterThreeSpokenNarration = chapterThreeFounderScript.join(" ");
  const chapterFourFounderScript = Object.freeze([
    "Shoot three to five shots while aiming at the center crosshairs.",
    "Take a photo of your target or choose one from your photos."
  ]);
  const chapterFourSpokenNarration = chapterFourFounderScript.join(" ");
  const chapters = Object.freeze([
    Object.freeze({
      id: "a2-1", label: "TARGET AND EQUIPMENT", shortTitle: "TARGET AND EQUIPMENT", eyebrow: "", targetIdentity: true,
      title: "Know your target.",
      summary: chapterOneFounderScript[0],
      narration: chapterOneSpokenNarration,
      narrationPlan: chapterOneNarrationPlan,
      visual: () => `<div class="target-lesson"><figure class="target-window is-full-target target-teaching-figure"><img src="${targetImage}" alt="Complete 25 Meters Zeroing Target, M16A2"><i class="grid-teaching-cue is-column" data-grid-cue="columns" aria-hidden="true"></i><i class="grid-teaching-cue is-row" data-grid-cue="rows" aria-hidden="true"></i></figure><ol class="target-curriculum"><li><span>1</span><div><b>AIM POINT</b><p>${chapterOneFounderScript[1]}</p></div></li><li><span>2</span><div><b>READ THE GRID</b><p>${chapterOneFounderScript[2]}</p></div></li><li><span>3</span><div><b>READ THE CLICKS</b><p>${chapterOneFounderScript[3]} ${chapterOneFounderScript[4]}</p></div></li><li><span>4</span><div><b>FIRE THE SHOT PATTERN</b><p>${chapterOneFounderScript[5]} <strong>THE CENTER OF YOUR SHOT PATTERN</strong> gives a better picture of where your shots are landing.</p></div></li><li><span>5</span><div><b>LET TAP-N-SCORE READ IT</b><p>${chapterOneFounderScript[7]}</p></div></li></ol></div>`,
      action: "equipment"
    }),
    Object.freeze({
      id: "a2-2", label: "KNOW YOUR SIGHTS", shortTitle: "KNOW YOUR SIGHTS", eyebrow: "M16A2 · STANDARD IRON SIGHTS",
      title: "Know your sights.",
      summary: "",
      narration: chapterTwoSpokenNarration,
      narrationPlan: chapterTwoNarrationPlan,
      visual: () => `<div class="sight-lesson">
        <div class="sight-cards">
          <section class="sight-card">
            <div class="sight-card-head"><b>FRONT SIGHT POST</b></div>
            <figure class="sight-photo front-sight-photo"><img src="${chapterTwoReferenceImages.frontSight}" alt="Real M16A2 front sight post between its protective ears"><span class="photo-callout" aria-hidden="true"></span></figure>
            <p>${chapterTwoFounderScript[0]}</p>
          </section>
          <section class="sight-card">
            <div class="sight-card-head"><b>REAR WINDAGE KNOB</b></div>
            <figure class="sight-photo rear-windage-photo"><img src="${chapterTwoReferenceImages.rearWindage}" alt="Real rear sight showing the round windage knob on its right side"><span class="photo-callout" aria-hidden="true"></span></figure>
            <p>${chapterTwoFounderScript[1]}</p>
          </section>
          <section class="sight-card">
            <div class="sight-card-head"><b>REAR ELEVATION DRUM</b></div>
            <figure class="sight-photo rear-drum-photo"><img src="${chapterTwoReferenceImages.rearDrum}" alt="Real M16A2 rear elevation drum with the 8/3 marking visible"><span class="photo-callout" aria-hidden="true"></span></figure>
            <p>${chapterTwoFounderScript[2]}</p><p>${chapterTwoFounderScript[3]}</p>
          </section>
        </div>
        <p class="sight-next">${chapterTwoFounderScript[4]}</p>
      </div>`,
      task: "", action: "none", hideTask: true
    }),
    Object.freeze({
      id: "a2-3", label: "LET TAP-N-SCORE SHOW YOU", shortTitle: "LET TAP-N-SCORE SHOW YOU", eyebrow: "CHAPTER 3 · WATCH", title: "Let Tap-n-Score show you.",
      summary: chapterThreeFounderScript[0],
      narration: chapterThreeSpokenNarration,
      narrationPlan: Object.freeze([
        Object.freeze({ text: chapterThreeSpokenNarration, delivery: "normal" })
      ]),
      visual: () => `<div class="adjustment-entry demo-entry"><figure class="adjustment-target"><img src="${chapterThreeTargetImage}" alt="Baker 25 Meters Zeroing Target, M16A2"></figure><section class="photo-entry demo-launch" aria-labelledby="demo-entry-title"><span>COMPLETE DEMONSTRATION</span><h2 id="demo-entry-title">Watch Tap-n-Score work.</h2><p>${chapterThreeFounderScript[1]}</p><div><a href="${chapterThreeDemoRoad}">WATCH TAP-N-SCORE</a></div><small>Tap-n-Score owns the controls during this example.</small></section></div>`,
      task: "", action: "none", hideTask: true
    }),
    Object.freeze({
      id: "a2-4", label: "YOU'RE UP!", shortTitle: "YOU'RE UP!", eyebrow: "CHAPTER 4 · SHOOTER CONTROL", title: "YOU'RE UP!",
      summary: chapterFourFounderScript[0],
      narration: chapterFourSpokenNarration,
      narrationPlan: Object.freeze([
        Object.freeze({ text: chapterFourSpokenNarration, delivery: "normal" })
      ]),
      visual: () => `<div class="adjustment-entry"><figure class="adjustment-target"><img src="${chapterThreeTargetImage}" alt="Baker 25 Meters Zeroing Target, M16A2"></figure><section class="photo-entry" aria-labelledby="photo-entry-title"><span>YOU'RE UP!</span><h2 id="photo-entry-title">Shoot Your Own Target</h2><p>${chapterFourFounderScript[1]}</p><div><a href="${chapterFourPhotoRoad("camera")}">TAKE PHOTO</a><a href="${chapterFourPhotoRoad("existing")}">CHOOSE EXISTING PHOTO</a></div><small>Your photograph opens in the governed Precision Tap road.</small></section></div>`,
      task: "", action: "none", hideTask: true
    })
  ]);

  const elements = Object.freeze({
    app: document.getElementById("tsttApp"), chapterNumber: document.getElementById("chapterNumber"), chapterSubject: document.getElementById("chapterSubject"),
    progress: document.getElementById("lessonProgress"), targetIdentity: document.getElementById("targetIdentity"), eyebrow: document.getElementById("chapterEyebrow"),
    title: document.getElementById("lessonTitle"), summary: document.getElementById("lessonSummary"), visual: document.getElementById("visualStage"), task: document.getElementById("taskCard"), action: document.getElementById("chapterAction"),
    equipmentLibraryLink: document.getElementById("equipmentLibraryLink"), dialog: document.getElementById("chapterDialog"), list: document.getElementById("chapterList"),
    shootingSetupSummary: document.getElementById("shootingSetupSummary"), sessionDistance: document.getElementById("sessionDistance"), sessionDistanceUnit: document.getElementById("sessionDistanceUnit"), sessionAdjustmentUnit: document.getElementById("sessionAdjustmentUnit"), sessionAdjustmentIncrement: document.getElementById("sessionAdjustmentIncrement"), shootingSetupNote: document.getElementById("shootingSetupNote"),
    start: document.querySelector('[data-control="start"]'), pause: document.querySelector('[data-control="pause"]'), pauseLabel: document.querySelector("[data-pause-label]"), stop: document.querySelector('[data-control="stop"]'), replay: document.querySelector('[data-control="replay"]'), restart: document.querySelector('[data-control="restart"]'),
    chapterThreeRuntimeShell: document.getElementById("chapterThreeRuntimeShell"), chapterThreeRuntime: document.getElementById("chapterThreeRuntime"), chapterThreeRuntimeStart: document.querySelector("[data-start-chapter-three]"),
  });
  const state = { started: false, current: 0, unlocked: 0, paused: false, stopped: false, equipment: null, pendingAutomaticDemoStart: false };
  let gridTeachingCueTimeout = 0;
  const narrator = window.SCZN3TSTTNarration.createNarrator({
    onSegmentStart: segment => setGridTeachingCue(segment.cue),
    onSegmentEnd: clearGridTeachingCue,
    onComplete: () => completeCurrentTeachingChapter()
  });

  function conciseEquipmentName(profile = {}) {
    const manufacturer = profile.weaponCatalogManufacturer || profile.weaponManufacturer || "";
    const model = profile.weaponCatalogModel || profile.weaponModelType || "";
    const firearm = manufacturer === "Military M-Series Rifles"
      ? model
      : model && manufacturer && model.toLowerCase().startsWith(manufacturer.toLowerCase()) ? model : [manufacturer, model].filter(Boolean).join(" ");
    const caliber = profile.weaponCatalogCaliber || profile.weaponModelCaliber || profile.ammoCaliber || profile.caliber || "";
    const sightSource = [profile.opticBrand, profile.opticModel || profile.opticType].filter(Boolean).join(" ");
    const sight = /iron sights/i.test(sightSource) ? "Iron Sights" : sightSource;
    return [firearm, caliber, sight].filter(Boolean).join(" · ") || profile.setupName || "Active Equipment";
  }
  function equipmentSupportsExactSetup() { return state.equipment.status === "exact"; }
  function equipmentLibraryUrl(photoSource = "") {
    const trainingReturn = `&origin=tstt&return_to=m16a2-tstt.html&return_chapter=${state.current + 1}`;
    if (!photoSource) return `matrix.html?view=library${trainingReturn}`;
    return `${tapNScoreRoad}&view=library${trainingReturn}&photo_source=${encodeURIComponent(photoSource)}`;
  }
  function chapterFourPhotoRoad(photoSource) {
    const photoQuery = `&photo_source=${encodeURIComponent(photoSource)}`;
    if (!state.equipment.activeId) return equipmentLibraryUrl(photoSource);
    return `${tapNScoreRoad}&equipment_profile_id=${encodeURIComponent(state.equipment.activeId)}${photoQuery}`;
  }
  function preserveJourney() {
    if (!state.started) return;
    sessionStorage.setItem(journeyKey, JSON.stringify({ started: true, current: state.current, unlocked: state.unlocked, paused: state.paused, stopped: state.stopped }));
  }
  function restoreJourney() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(journeyKey) || "null");
      if (!saved || saved.started !== true) return;
      state.started = true;
      state.current = Math.min(chapters.length - 1, Math.max(0, Number(saved.current) || 0));
      state.unlocked = Math.min(chapters.length - 1, Math.max(state.current, Number(saved.unlocked) || 0));
      state.paused = saved.paused === true;
      state.stopped = saved.stopped === true;
    } catch (error) {
      console.warn("TSTT journey could not be restored", error);
    }
  }
  function applyDirectChapterEntry() {
    const requested = Number(new URLSearchParams(window.location.search).get("chapter"));
    if (!Number.isInteger(requested) || requested < 1 || requested > chapters.length) return;
    state.started = true;
    state.current = requested - 1;
    state.unlocked = chapters.length - 1;
    state.paused = false;
    state.stopped = false;
  }
  function shouldLaunchChapterThreeDemo(chapter) {
    const query = new URLSearchParams(window.location.search);
    return chapter.id === "a2-3" && query.get("chapter_menu") !== "1";
  }
  function updateChapterThreeStartControl(detail = {}) {
    const playerState = String(detail.playerState || "idle").toUpperCase();
    elements.chapterThreeRuntimeStart.hidden = ["PLAYING", "PAUSED", "COMPLETED"].includes(playerState);
  }
  function chapterThreeController() {
    try {
      return elements.chapterThreeRuntime.contentWindow;
    } catch (_) {
      return null;
    }
  }
  function launchChapterThreeDemo({ userGesture = false, automatic = false } = {}) {
    cancelSpeech();
    preserveJourney();
    elements.chapterThreeRuntimeShell.hidden = false;
    elements.app.setAttribute("aria-hidden", "true");
    const controller = chapterThreeController();
    if ((userGesture || automatic) && controller && typeof controller.startBakerSampleDemo === "function") {
      controller.startBakerSampleDemo();
      state.pendingAutomaticDemoStart = false;
      return true;
    }
    if (automatic) state.pendingAutomaticDemoStart = true;
    elements.chapterThreeRuntimeStart.hidden = false;
    return false;
  }
  function readActiveEquipment() {
    try {
      const activeId = localStorage.getItem(equipmentKeys.active) || "";
      const profiles = JSON.parse(localStorage.getItem(equipmentKeys.saved) || "[]");
      const profile = Array.isArray(profiles) ? profiles.find(item => item && item.setupId === activeId) : null;
      if (!profile) return { ...defaultEquipment };
      const sightText = [profile.opticType, profile.opticBrand, profile.opticModel, profile.sightConfiguration, profile.adjustmentSystem, profile.equipmentConfigurationId].filter(Boolean).join(" ").toLowerCase();
      const compatible = profile.equipmentConfigurationId === "M16A2-STANDARD-IRON-FSP-REAR-DRUM"
        && profile.adjustmentProfileId === "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
        && /(iron|front sight post|fsp|m16a2-standard-iron)/.test(sightText);
      const label = conciseEquipmentName(profile);
      const status = compatible ? "exact" : "different";
      return { status, label, profile, activeId };
    } catch (error) {
      console.warn("Active Equipment Library setup could not be read", error);
      return { ...defaultEquipment };
    }
  }
  function syncEquipment({ rerender = true } = {}) {
    const previousStatus = state.equipment?.status;
    state.equipment = readActiveEquipment();
    elements.equipmentLibraryLink.href = equipmentLibraryUrl();
    syncShootingSetup();
    if (rerender && previousStatus !== state.equipment.status) render({ narrate: false, sync: false });
  }
  function cancelSpeech() { narrator.cancel(); }
  function clearGridTeachingCue() {
    window.clearTimeout(gridTeachingCueTimeout);
    gridTeachingCueTimeout = 0;
    elements.visual.querySelectorAll("[data-grid-cue].is-active").forEach(cue => cue.classList.remove("is-active"));
  }
  function setGridTeachingCue(cueName) {
    clearGridTeachingCue();
    if (!cueName || state.current !== 0) return;
    const cue = elements.visual.querySelector(`[data-grid-cue="${cueName}"]`);
    if (!cue) return;
    void cue.offsetWidth;
    cue.classList.add("is-active");
    gridTeachingCueTimeout = window.setTimeout(clearGridTeachingCue, 2700);
  }
  function completeCurrentTeachingChapter() {
    clearGridTeachingCue();
    if (!state.started || state.paused || state.stopped || state.current > 1) return;
    const enteringChapterThree = state.current === 1;
    if (enteringChapterThree) state.pendingAutomaticDemoStart = true;
    advance({ automatic: true });
  }
  function speakCurrent() {
    cancelSpeech();
    if (!state.started || state.paused || state.stopped) return;
    const chapter = chapters[state.current];
    narrator.play(chapter.narrationPlan || chapter.narration);
  }
  function setPaused(paused) {
    if (state.stopped) { state.stopped = false; state.paused = false; elements.pauseLabel.textContent = "PAUSE"; render(); return; }
    state.paused = paused; elements.app.dataset.status = paused ? "paused" : (state.started ? "active" : "waiting"); elements.pauseLabel.textContent = paused ? "RESUME" : "PAUSE";
    if (paused) narrator.pause(); else narrator.resume();
    preserveJourney();
  }
  function stopTraining() { if (!state.started) return; cancelSpeech(); state.paused = false; state.stopped = true; elements.pauseLabel.textContent = "RESUME"; elements.app.dataset.status = "stopped"; preserveJourney(); }
  function syncShootingSetup() {
    const exact = equipmentSupportsExactSetup();
    const setup = {
      distance: "25", distanceUnit: "METERS", adjustmentUnit: "MOA",
      adjustmentIncrement: "Elevation 1.25 · Windage 0.5",
      source: "M16A2 25-meter training authority"
    };
    sessionStorage.setItem(shootingSetupKey, JSON.stringify({ ...setup, appliesToActiveEquipment: exact }));
    elements.shootingSetupSummary.textContent = "25 METERS · MOA";
    elements.sessionDistance.value = setup.distance;
    elements.sessionDistanceUnit.value = setup.distanceUnit;
    elements.sessionAdjustmentUnit.value = setup.adjustmentUnit;
    elements.sessionAdjustmentIncrement.value = setup.adjustmentIncrement;
    elements.shootingSetupNote.textContent = exact
      ? "This lesson governs 25 meters for your selected M16A2 standard iron-sight setup."
      : "Training values for the M16A2 with standard iron sights. Different equipment requires its own governed adjustment authority.";
  }
  function setupMarkup() {
    return `<div class="training-setup"><span class="task-label">TRAINING SETUP</span><b>M16A2 · Standard Iron Sights</b><p>This training teaches this setup. If yours is different, some instructions may not apply.</p></div>`;
  }
  function actionMarkup(chapter) {
    if (!state.started) return "";
    if (chapter.action === "none") return "";
    if (chapter.action === "terminal") return `<div class="terminal-stop"><b>STOP HERE</b><span>Wait for range commands before firing.</span></div>`;
    return `<button class="primary-action" type="button" data-action="next">${chapter.actionLabel}</button>`;
  }
  function updateChapterList() {
    elements.list.innerHTML = chapters.map((chapter, index) => {
      const disabled = !state.started || index > state.unlocked;
      const stateLabel = index === state.current ? `<small class="you-are-here">YOU ARE HERE</small>` : `<small>${disabled ? "LOCKED" : "OPEN"}</small>`;
      return `<li><button type="button" data-chapter-index="${index}" ${disabled ? "disabled" : ""} ${index === state.current ? 'aria-current="step"' : ""}><strong>${String(index + 1).padStart(2, "0")}</strong><span><b>${chapter.shortTitle}</b>${stateLabel}</span></button></li>`;
    }).join("");
  }
  function renderProgress() {
    elements.progress.innerHTML = chapters.map((_, index) => `<span class="${index < state.current ? "is-complete" : (index === state.current ? "is-current" : "")}"></span>`).join("");
    elements.progress.setAttribute("aria-label", `Course progress: chapter ${state.current + 1} of ${chapters.length}`);
  }
  function render({ narrate = true, sync = true } = {}) {
    if (sync) syncEquipment({ rerender: false });
    const chapter = chapters[state.current];
    elements.chapterNumber.textContent = `CHAPTER ${state.current + 1} OF ${chapters.length}`; elements.chapterSubject.textContent = chapter.label; renderProgress();
    elements.targetIdentity.hidden = !chapter.targetIdentity; elements.eyebrow.hidden = !chapter.eyebrow; elements.eyebrow.textContent = chapter.eyebrow; elements.title.textContent = chapter.title; elements.summary.hidden = !chapter.summary; elements.summary.textContent = chapter.summary;
    elements.visual.innerHTML = chapter.visual();
    elements.task.hidden = chapter.hideTask === true;
    elements.task.innerHTML = chapter.action === "equipment" ? setupMarkup() : `<span class="task-label">YOUR TASK</span><strong>${chapter.task}</strong>`;
    elements.action.classList.remove("has-next-chapter");
    elements.action.innerHTML = actionMarkup(chapter);
    elements.pause.disabled = !state.started; elements.stop.disabled = !state.started; elements.replay.disabled = !state.started; elements.restart.disabled = !state.started;
    elements.app.dataset.status = state.stopped ? "stopped" : (state.paused ? "paused" : (state.started ? "active" : "waiting")); updateChapterList(); preserveJourney(); window.scrollTo({ top: 0, behavior: "smooth" });
    if (state.started && !state.paused && !state.stopped && shouldLaunchChapterThreeDemo(chapter)) {
      launchChapterThreeDemo({ userGesture: false, automatic: state.pendingAutomaticDemoStart });
      return;
    }
    if (narrate) speakCurrent();
  }
  function startTraining() { state.started = true; state.paused = false; state.stopped = false; state.current = 0; state.unlocked = chapters.length - 1; render(); }
  function advance({ userGesture = false } = {}) { if (state.current >= chapters.length - 1) return; state.unlocked = Math.max(state.unlocked, state.current + 1); state.current += 1; state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render(); if (userGesture && state.current === 2) launchChapterThreeDemo({ userGesture: true }); }
  function restartTraining() { cancelSpeech(); sessionStorage.removeItem(journeyKey); state.started = false; state.current = 0; state.unlocked = 0; state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render({ narrate: false }); }

  elements.start.addEventListener("click", startTraining);
  elements.action.addEventListener("click", event => { const action = event.target.closest("[data-action]")?.dataset.action; if (action === "next") advance({ userGesture: true }); });
  elements.pause.addEventListener("click", () => setPaused(!state.paused)); elements.stop.addEventListener("click", stopTraining);
  elements.replay.addEventListener("click", () => { state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render(); }); elements.restart.addEventListener("click", restartTraining);
  document.querySelector('[data-control="chapters"]').addEventListener("click", () => elements.dialog.showModal()); document.querySelector("[data-close-chapters]").addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", event => { const button = event.target.closest("[data-chapter-index]"); if (!button || button.disabled) return; state.current = Number(button.dataset.chapterIndex); state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; elements.dialog.close(); if (state.current === 2) launchChapterThreeDemo({ userGesture: true }); else render(); });
  elements.chapterThreeRuntimeStart.addEventListener("click", () => launchChapterThreeDemo({ userGesture: true }));
  elements.chapterThreeRuntime.addEventListener("load", () => {
    updateChapterThreeStartControl({ playerState: "idle" });
    if (state.pendingAutomaticDemoStart && state.current === 2) launchChapterThreeDemo({ automatic: true });
  });
  window.addEventListener("message", event => {
    if (event.origin !== window.location.origin || event.source !== elements.chapterThreeRuntime.contentWindow || event.data?.type !== "sczn3-m16a2-demo-runtime") return;
    updateChapterThreeStartControl(event.data);
  });
  window.addEventListener("focus", () => syncEquipment()); window.addEventListener("pageshow", () => syncEquipment()); window.addEventListener("storage", event => { if ([equipmentKeys.active, equipmentKeys.saved].includes(event.key)) syncEquipment(); });
  restoreJourney(); applyDirectChapterEntry(); syncEquipment({ rerender: false }); render({ narrate: false, sync: false });
  if (new URLSearchParams(window.location.search).get("chapter_menu") === "1") elements.dialog.showModal();
})();
