(function initializeM16A2TSTT() {
  "use strict";

  const targetImage = "authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02.png";
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
  const chapterTwoFounderScript = Object.freeze([
    "Controls elevation — moves your shot pattern up or down.",
    "Controls windage — moves your shot pattern right or left.",
    "For your 25-meter zero, set the drum to 8/3, then turn it one click CLOCKWISE past 8/3.",
    "After your zero is confirmed, turn it one click COUNTERCLOCKWISE back to 8/3 for the 300-meter setting.",
    "Now you know which sight controls you'll adjust when Tap-n-Score tells you how to move your shot pattern."
  ]);
  const chapterTwoSpokenNarration = `Front sight post. ${chapterTwoFounderScript[0]} Rear windage knob. ${chapterTwoFounderScript[1]} Rear elevation drum. ${chapterTwoFounderScript[2]} ${chapterTwoFounderScript[3]} ${chapterTwoFounderScript[4]}`;
  const chapterThreeFounderScript = Object.freeze([
    "Your sights are ready. Now let Tap-n-Score tell you how to adjust them.",
    "Shoot three to five shots while aiming at the center crosshairs.",
    "Tap each shot in Tap-n-Score.",
    "Tap-n-Score finds the center of your shot pattern and measures how far it is from the center crosshairs.",
    "For elevation, Tap-n-Score tells you how many clicks to move the front sight post and which direction to turn it.",
    "For windage, Tap-n-Score tells you how many clicks to move the rear windage knob and which direction to turn it.",
    "Make the adjustments Tap-n-Score gives you.",
    "Then shoot another three-to-five-shot pattern to confirm your zero.",
    "Once your zero is confirmed, turn the rear elevation drum one click COUNTERCLOCKWISE back to 8/3 for your 300-meter setting.",
    "Your sights are set."
  ]);
  const chapterThreeSpokenNarration = chapterThreeFounderScript.join(" ");
  const chapters = Object.freeze([
    Object.freeze({
      id: "a2-1", label: "TARGET + EQUIPMENT", shortTitle: "Target and equipment", eyebrow: "", targetIdentity: true,
      title: "Know your target.",
      summary: chapterOneFounderScript[0],
      narration: chapterOneSpokenNarration,
      narrationPlan: Object.freeze([
        Object.freeze({ text: chapterOneSpokenNarration, delivery: "normal" })
      ]),
      visual: () => `<div class="target-lesson"><figure class="target-window is-full-target target-teaching-figure"><img src="${targetImage}" alt="Complete 25 Meters Zeroing Target, M16A2"></figure><ol class="target-curriculum"><li><span>1</span><div><b>AIM POINT</b><p>${chapterOneFounderScript[1]}</p></div></li><li><span>2</span><div><b>READ THE GRID</b><p>${chapterOneFounderScript[2]}</p></div></li><li><span>3</span><div><b>READ THE CLICKS</b><p>${chapterOneFounderScript[3]} ${chapterOneFounderScript[4]}</p></div></li><li><span>4</span><div><b>FIRE THE SHOT PATTERN</b><p>${chapterOneFounderScript[5]} <strong>THE CENTER OF YOUR SHOT PATTERN</strong> gives a better picture of where your shots are landing.</p></div></li><li><span>5</span><div><b>LET TAP-N-SCORE READ IT</b><p>${chapterOneFounderScript[7]}</p></div></li></ol></div>`,
      action: "equipment"
    }),
    Object.freeze({
      id: "a2-2", label: "THE SIGHTS", shortTitle: "Know your sights", eyebrow: "M16A2 · STANDARD IRON SIGHTS",
      title: "Know your sights.",
      summary: "",
      narration: chapterTwoSpokenNarration,
      narrationPlan: Object.freeze([
        Object.freeze({ text: chapterTwoSpokenNarration, delivery: "normal" })
      ]),
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
      id: "a2-3", label: "MAKE THE ADJUSTMENT", shortTitle: "Make the adjustment", eyebrow: "LET TAP-N-SCORE TALK", title: "Make the adjustment.",
      summary: chapterThreeFounderScript[0],
      narration: chapterThreeSpokenNarration,
      narrationPlan: Object.freeze([
        Object.freeze({ text: chapterThreeSpokenNarration, delivery: "normal" })
      ]),
      visual: () => `<div class="adjustment-lesson"><ol class="adjustment-flow"><li><span>01</span><div><b>SHOOT</b><p>${chapterThreeFounderScript[1]}</p></div></li><li><span>02</span><div><b>TAP YOUR SHOTS</b><p>${chapterThreeFounderScript[2]}</p></div></li><li><span>03</span><div><b>MEASURE</b><p>${chapterThreeFounderScript[3]}</p></div></li><li><span>04</span><div><b>ADJUST</b><p>${chapterThreeFounderScript[4]}</p><p>${chapterThreeFounderScript[5]}</p><p>${chapterThreeFounderScript[6]}</p></div></li><li><span>05</span><div><b>CONFIRM</b><p>${chapterThreeFounderScript[7]}</p></div></li><li><span>06</span><div><b>8/3</b><p>${chapterThreeFounderScript[8]}</p></div></li></ol><p class="adjustment-close">${chapterThreeFounderScript[9]}</p></div>`,
      task: "", action: "none", hideTask: true
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
  });
  const state = { started: false, current: 0, unlocked: 0, paused: false, stopped: false, equipment: null };
  const narrator = window.SCZN3TSTTNarration.createNarrator();

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
    if (chapter.action === "none") return "";
    if (chapter.action === "equipment") return `<button class="primary-action" type="button" data-action="next">NEXT, WE'LL LEARN THE SIGHTS.</button>`;
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
    elements.action.innerHTML = actionMarkup(chapter);
    elements.pause.disabled = !state.started; elements.stop.disabled = !state.started; elements.replay.disabled = !state.started; elements.restart.disabled = !state.started;
    elements.app.dataset.status = state.stopped ? "stopped" : (state.paused ? "paused" : (state.started ? "active" : "waiting")); updateChapterList(); preserveJourney(); window.scrollTo({ top: 0, behavior: "smooth" }); if (narrate) speakCurrent();
  }
  function startTraining() { state.started = true; state.paused = false; state.stopped = false; state.current = 0; state.unlocked = chapters.length - 1; render(); }
  function advance() { if (state.current >= chapters.length - 1) return; state.unlocked = Math.max(state.unlocked, state.current + 1); state.current += 1; state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render(); }
  function restartTraining() { cancelSpeech(); sessionStorage.removeItem(journeyKey); state.started = false; state.current = 0; state.unlocked = 0; state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render({ narrate: false }); }

  elements.start.addEventListener("click", startTraining);
  elements.action.addEventListener("click", event => { const action = event.target.closest("[data-action]")?.dataset.action; if (action === "next") advance(); });
  elements.pause.addEventListener("click", () => setPaused(!state.paused)); elements.stop.addEventListener("click", stopTraining);
  elements.replay.addEventListener("click", () => { state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render(); }); elements.restart.addEventListener("click", restartTraining);
  document.querySelector('[data-control="chapters"]').addEventListener("click", () => elements.dialog.showModal()); document.querySelector("[data-close-chapters]").addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", event => { const button = event.target.closest("[data-chapter-index]"); if (!button || button.disabled) return; state.current = Number(button.dataset.chapterIndex); state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; elements.dialog.close(); render(); });
  window.addEventListener("focus", () => syncEquipment()); window.addEventListener("pageshow", () => syncEquipment()); window.addEventListener("storage", event => { if ([equipmentKeys.active, equipmentKeys.saved].includes(event.key)) syncEquipment(); });
  restoreJourney(); syncEquipment({ rerender: false }); render({ narrate: false, sync: false });
})();
