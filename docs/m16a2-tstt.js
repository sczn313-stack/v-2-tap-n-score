(function initializeM16A2TSTT() {
  "use strict";

  const targetImage = "authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02.png";
  const equipmentKeys = Object.freeze({ active: "SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", saved: "SCZN3_SAVED_EQUIPMENT_PROFILES" });
  const journeyKey = "SCZN3_TSTT_M16A2_JOURNEY_V1";
  const shootingSetupKey = "SCZN3_TSTT_M16A2_SHOOTING_SETUP_V1";
  const defaultEquipment = Object.freeze({ status: "none", label: "No active equipment selected" });
  const auditionSentence = "Your group is two squares high and three squares left. We’ll use the sights to move the group to the center of the target.";
  const chapterOneSpokenNarration = "This target gives you an aim point. It also gives you a way to measure your group. Aim at the white center dot. Hold that same point for every shot. The grid is a measurement tool. One vertical square equals one front-sight click. One horizontal square equals three rear-windage clicks. The target shows where the center of your group is compared with the white center dot. Use the group as evidence for the correction. Do not chase a single shot.";
  const chapters = Object.freeze([
    Object.freeze({
      id: "a2-1", label: "TARGET + EQUIPMENT", shortTitle: "Target and equipment", eyebrow: "", targetIdentity: true,
      title: "Know the target before you touch the sights.",
      summary: "",
      narration: "This target gives you an aim point and a way to measure your group. Aim at the white center dot and hold that same point for every shot. The grid is a measurement tool. For this M16A2 standard iron-sight setup, one vertical square equals one front-sight click, and one horizontal square equals three rear-windage clicks. The target shows where the center of your group is compared with the white center dot. Use the group as evidence for the correction. Do not chase a single shot.",
      narrationPlan: Object.freeze([
        Object.freeze({ text: chapterOneSpokenNarration, delivery: "normal" })
      ]),
      visual: () => `<div class="target-lesson"><figure class="target-window is-full-target target-teaching-figure"><img src="${targetImage}" alt="Complete 25 Meters Zeroing Target, M16A2"><span class="target-marker target-marker-aim" aria-hidden="true"><i>1</i></span><span class="target-marker target-marker-grid" aria-hidden="true"><i>3</i></span><span class="sample-group" aria-hidden="true"><i></i><i></i><i></i></span></figure><ol class="target-curriculum"><li><span>1</span><div><b>WHERE TO AIM</b><p>Aim at the white center dot. Hold that same point for every shot.</p></div></li><li><span>2</span><div><b>WHAT THE GRID MEANS</b><p>The grid measures how far your group center is from the white center dot.</p></div></li><li><span>3</span><div><b>WHAT ONE SQUARE REPRESENTS</b><p><strong>Up / down:</strong> 1 square = 1 front-sight click.<br><strong>Left / right:</strong> 1 square = 3 rear-windage clicks.</p></div></li><li><span>4</span><div><b>WHAT THE TARGET WILL TELL YOU</b><p>Your group's place on the grid shows the direction and amount it needs to move.</p></div></li><li><span>5</span><div><b>WHY WE SHOOT A GROUP</b><p>A group gives us a repeatable center for the correction. Do not chase individual shots.</p></div></li></ol></div>`,
      action: "equipment"
    }),
    Object.freeze({
      id: "a2-2", label: "REAR-DRUM SETUP", shortTitle: "Prepare the rear elevation drum", eyebrow: "TEMPORARY 25-METER SETUP",
      title: "Set 300. Then go one click past.",
      summary: "Use the rear elevation drum to prepare the rifle for this 25-meter procedure. You will use a different control later to move the group up or down.",
      narration: "Temporary twenty-five-meter setup. Use the rear elevation drum to prepare the rifle for this procedure. Set three hundred. Then go one click past. Viewed from above, rotate clockwise one click past three hundred. This is the setup control. It is not the control for moving your group up or down. On a safe, unloaded rifle, locate three hundred, then rehearse that one clockwise click.",
      narrationPlan: Object.freeze([
        Object.freeze({ text: "Find the rear elevation drum.", delivery: "action" }),
        Object.freeze({ text: "Use it to prepare the rifle for this twenty-five-meter procedure.", delivery: "normal" }),
        Object.freeze({ text: "Set the drum at three hundred.", delivery: "action" }),
        Object.freeze({ text: "Then go one click past.", delivery: "important" }),
        Object.freeze({ text: "Viewed from above, turn it clockwise one click.", delivery: "important" }),
        Object.freeze({ text: "This is the setup control.", delivery: "normal" }),
        Object.freeze({ text: "Do not use it to move your group up or down.", delivery: "important" }),
        Object.freeze({ text: "On a safe, unloaded rifle, rehearse that one clockwise click.", delivery: "action" })
      ]),
      visual: () => `<div class="drum-demo"><div class="view-label">VIEWED FROM ABOVE</div><svg viewBox="0 0 360 250" role="img" aria-label="Rear elevation drum moves clockwise one click from the 300 mark"><circle cx="180" cy="128" r="83" class="diagram-ring"/><circle cx="180" cy="128" r="48" class="diagram-core"/><line x1="180" y1="44" x2="180" y2="72" class="index-line"/><text x="180" y="31" class="diagram-label">INDEX</text><text x="180" y="139" class="drum-mark">300</text><path d="M 108 84 A 86 86 0 0 1 248 85" class="motion-arrow"/><polygon points="250,85 228,79 241,102" class="arrow-head"/><text x="180" y="224" class="diagram-command">CLOCKWISE • ONE CLICK PAST 300</text></svg><div class="not-correction"><b>SETUP CONTROL</b><span>Rear elevation drum</span><em>Not the control for moving your group up or down</em></div></div>`,
      task: "On a safe, unloaded rifle: locate 300, then rehearse one clockwise click past it while viewing the drum from above.", action: "advance", actionLabel: "I REHEARSED THE SETUP"
    }),
    Object.freeze({
      id: "a2-3", label: "GRID + AIM", shortTitle: "Understand the grid and aim", eyebrow: "AIM RELATIONSHIP", title: "The center is your reference.",
      summary: "The grid shows where your group lands in relation to where you aimed. Aim at the center and keep that same aim for every shot in the group.",
      narration: "The target grid extends twenty-seven units left and right and ten units up and down. The heavy center lines meet at the white center of the red silhouette. That intersection is your point of aim. Keep that same center aim through the entire first group. Do not estimate a correction now.",
      visual: () => `<div class="aim-demo"><figure class="target-window is-aim"><img src="${targetImage}" alt="M16A2 target centered on the heavy horizontal and vertical grid lines"><span class="aim-reticle" aria-hidden="true"><i></i></span><figcaption>HOLD THE SAME CENTER AIM</figcaption></figure><div class="axis-key"><span><b>±27</b> LEFT / RIGHT</span><span><b>±10</b> UP / DOWN</span></div></div>`,
      task: "Point to the heavy-line intersection at the center of the red silhouette. That is the aim reference for every shot in the first group.", action: "advance", actionLabel: "I FOUND THE AIM POINT"
    }),
    Object.freeze({
      id: "a2-4", label: "ADJUSTMENT CONTROLS", shortTitle: "Rehearse the correction controls", eyebrow: "STANDARD M16A2 IRON SIGHTS", title: "Two controls. Four movements.",
      summary: "The front sight post moves group elevation. The rear windage knob moves the group left or right. Always name the movement you want before turning a control.",
      narration: "For group elevation, use the front sight post. Each click is one point two five minutes of angle. To move impact up, turn the front sight post clockwise viewed from above. To move impact down, turn it counterclockwise viewed from above. For windage, use the exposed right-side rear windage knob. Each click is zero point five minutes of angle. To move impact right, turn it clockwise while looking squarely at the knob face. To move impact left, turn it counterclockwise. The rear elevation drum is not the group-elevation correction control in this procedure.",
      visual: () => `<div class="control-grid"><section class="control-card"><div class="control-name"><span>ELEVATION</span><b>FRONT SIGHT POST</b><em>1.25 MOA / CLICK</em></div><div class="control-figure front-post" aria-hidden="true"><span class="post-tip"></span><span class="post-base"></span><i class="view-axis">VIEW FROM ABOVE</i></div><div class="movement-list"><span><b>MOVE IMPACT UP</b><i>↻ CLOCKWISE</i></span><span><b>MOVE IMPACT DOWN</b><i>↺ COUNTERCLOCKWISE</i></span></div></section><section class="control-card"><div class="control-name"><span>WINDAGE</span><b>REAR WINDAGE KNOB</b><em>0.5 MOA / CLICK</em></div><div class="control-figure windage-knob" aria-hidden="true"><span></span><i class="view-axis">FACE THE RIGHT-SIDE KNOB</i></div><div class="movement-list"><span><b>MOVE IMPACT RIGHT</b><i>↻ CLOCKWISE</i></span><span><b>MOVE IMPACT LEFT</b><i>↺ COUNTERCLOCKWISE</i></span></div></section></div><div class="control-reminder"><b>NOT THE REAR DRUM</b><span>Use the front sight post to move the group up or down.</span></div>`,
      task: "With the rifle safe, point to the front sight post for up/down movement and the rear windage knob for left/right movement. Say the desired impact movement before rehearsing the turn.", action: "advance", actionLabel: "I REHEARSED BOTH CONTROLS"
    }),
    Object.freeze({
      id: "a2-5", label: "PRE-FIRE READY", shortTitle: "Ready for the first group", eyebrow: "STOP POINT • LIVE FIRE COMES NEXT", title: "Ready to fire your first group.",
      summary: "You have learned the target, temporary drum setup, center aim, and adjustment controls used by this M16A2 standard iron-sight training.",
      narration: "You are ready for your first group. At twenty-five meters, follow all range commands and safety procedures. Use the center of the target as the same point of aim for every shot. Your range procedure determines the number of rounds. Stop here and wait for range commands.",
      visual: () => `<div class="ready-panel"><span class="ready-kicker">PREFIRE TRAINING COMPLETE</span><div class="ready-title">READY TO FIRE<br>YOUR FIRST GROUP</div><ul><li><span>•</span>Training target: 25 Meters Zeroing Target — M16A2</li><li><span>•</span>Training setup: M16A2 with standard iron sights</li><li><span>•</span>Rear-drum lesson: one click past 300</li><li><span>•</span>Aim: center intersection</li><li><span>•</span>Distance: 25 meters</li></ul><p>STOP HERE. Follow range commands and keep one center aim.</p></div>`,
      task: "When the range is safe and commands permit, maintain the same center aim throughout your first group.", action: "terminal"
    })
  ]);

  const elements = Object.freeze({
    app: document.getElementById("tsttApp"), chapterNumber: document.getElementById("chapterNumber"), chapterSubject: document.getElementById("chapterSubject"),
    progress: document.getElementById("lessonProgress"), targetIdentity: document.getElementById("targetIdentity"), eyebrow: document.getElementById("chapterEyebrow"),
    title: document.getElementById("lessonTitle"), summary: document.getElementById("lessonSummary"), visual: document.getElementById("visualStage"), task: document.getElementById("taskCard"), action: document.getElementById("chapterAction"),
    equipmentLibraryLink: document.getElementById("equipmentLibraryLink"), dialog: document.getElementById("chapterDialog"), list: document.getElementById("chapterList"),
    shootingSetupSummary: document.getElementById("shootingSetupSummary"), sessionDistance: document.getElementById("sessionDistance"), sessionDistanceUnit: document.getElementById("sessionDistanceUnit"), sessionAdjustmentUnit: document.getElementById("sessionAdjustmentUnit"), sessionAdjustmentIncrement: document.getElementById("sessionAdjustmentIncrement"), shootingSetupNote: document.getElementById("shootingSetupNote"),
    start: document.querySelector('[data-control="start"]'), pause: document.querySelector('[data-control="pause"]'), pauseLabel: document.querySelector("[data-pause-label]"), stop: document.querySelector('[data-control="stop"]'), replay: document.querySelector('[data-control="replay"]'), restart: document.querySelector('[data-control="restart"]'),
    runtimeVoiceStatus: document.getElementById("runtimeVoiceStatus"), runtimeVoiceCheck: document.getElementById("runtimeVoiceCheck")
  });
  const state = { started: false, current: 0, unlocked: 0, paused: false, stopped: false, equipment: null };
  const narrator = window.SCZN3TSTTNarration.createNarrator({
    onVoiceStatus: ({ status, identifier }) => {
      elements.runtimeVoiceStatus.textContent = status === "checking" ? "CHECKING FOR SAMANTHA…" : identifier;
      elements.runtimeVoiceCheck.disabled = status !== "selected";
    }
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
  function equipmentLibraryUrl() {
    return `matrix.html?view=library&origin=tstt&return_to=m16a2-tstt.html&return_chapter=${state.current + 1}`;
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
    if (chapter.action === "equipment") return `<button class="primary-action" type="button" data-action="next">NEXT → THE SIGHTS</button>`;
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
    elements.task.innerHTML = chapter.action === "equipment" ? setupMarkup() : `<span class="task-label">YOUR TASK</span><strong>${chapter.task}</strong>`;
    elements.action.innerHTML = actionMarkup(chapter);
    elements.pause.disabled = !state.started; elements.stop.disabled = !state.started; elements.replay.disabled = !state.started; elements.restart.disabled = !state.started;
    elements.app.dataset.status = state.stopped ? "stopped" : (state.paused ? "paused" : (state.started ? "active" : "waiting")); updateChapterList(); preserveJourney(); window.scrollTo({ top: 0, behavior: "smooth" }); if (narrate) speakCurrent();
  }
  function startTraining() { state.started = true; state.paused = false; state.stopped = false; state.current = 0; state.unlocked = chapters.length - 1; render(); }
  function advance() { if (state.current >= chapters.length - 1) return; state.unlocked = Math.max(state.unlocked, state.current + 1); state.current += 1; state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render(); }
  function restartTraining() { cancelSpeech(); sessionStorage.removeItem(journeyKey); state.started = false; state.current = 0; state.unlocked = 0; state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render({ narrate: false }); }

  elements.start.addEventListener("click", startTraining);
  elements.runtimeVoiceCheck.addEventListener("click", () => narrator.play([Object.freeze({ text: auditionSentence, delivery: "normal" })]));
  elements.action.addEventListener("click", event => { const action = event.target.closest("[data-action]")?.dataset.action; if (action === "next") advance(); });
  elements.pause.addEventListener("click", () => setPaused(!state.paused)); elements.stop.addEventListener("click", stopTraining);
  elements.replay.addEventListener("click", () => { state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render(); }); elements.restart.addEventListener("click", restartTraining);
  document.querySelector('[data-control="chapters"]').addEventListener("click", () => elements.dialog.showModal()); document.querySelector("[data-close-chapters]").addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", event => { const button = event.target.closest("[data-chapter-index]"); if (!button || button.disabled) return; state.current = Number(button.dataset.chapterIndex); state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; elements.dialog.close(); render(); });
  window.addEventListener("focus", () => syncEquipment()); window.addEventListener("pageshow", () => syncEquipment()); window.addEventListener("storage", event => { if ([equipmentKeys.active, equipmentKeys.saved].includes(event.key)) syncEquipment(); });
  restoreJourney(); syncEquipment({ rerender: false }); render({ narrate: false, sync: false });
})();
