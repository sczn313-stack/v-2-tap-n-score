(function initializeM16A2TSTT() {
  "use strict";

  const targetImage = "authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02.png";
  const equipmentKeys = Object.freeze({ active: "SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", saved: "SCZN3_SAVED_EQUIPMENT_PROFILES" });
  const chapters = Object.freeze([
    Object.freeze({
      id: "a2-1", label: "TARGET + EQUIPMENT", shortTitle: "Target and equipment", eyebrow: "KNOW YOUR TARGET", targetIdentity: true,
      title: "Know the target before you touch the sights.",
      summary: "This class teaches the M16A2 25-meter zeroing target with the rifle and standard iron sights shown in your Equipment Library.",
      narration: "This is the twenty-five meters zeroing target for the M16A2. Your M16A2 rifle, standard iron sights, and this target are designed to work together for this lesson. SCZN3 is using the active setup from your Equipment Library.",
      visual: () => `<figure class="target-window"><img src="${targetImage}" alt="25 Meters Zeroing Target, M16A2"><figcaption>BAKER TARGETS • ST-M16A2R</figcaption></figure>`,
      action: "equipment"
    }),
    Object.freeze({
      id: "a2-2", label: "REAR-DRUM SETUP", shortTitle: "Prepare the rear elevation drum", eyebrow: "TEMPORARY 25-METER SETUP",
      title: "Set 300. Then go one click past.",
      summary: "Use the rear elevation drum to prepare the rifle for this 25-meter procedure. You will use a different control later to move the group up or down.",
      narration: "With the rifle unloaded and handled under your range's safety rules, find the rear elevation drum. Set the drum at the three-hundred-meter mark. Then rotate it clockwise one click past three hundred, viewed from above. This is temporary setup. Do not use this drum to correct the shot group.",
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
      summary: "Your target, rifle, iron sights, temporary drum setup, center aim, and adjustment controls are ready.",
      narration: "You are ready for your first group. At twenty-five meters, follow all range commands and safety procedures. Use the center of the target as the same point of aim for every shot. Your range procedure determines the number of rounds. Stop here and wait for range commands.",
      visual: () => `<div class="ready-panel"><span class="ready-kicker">PREFIRE CHECK COMPLETE</span><div class="ready-title">READY TO FIRE<br>YOUR FIRST GROUP</div><ul><li><span>✓</span>25 Meters Zeroing Target — M16A2</li><li><span>✓</span>M16A2 rifle with standard iron sights</li><li><span>✓</span>Rear drum: one click past 300</li><li><span>✓</span>Aim: center intersection</li><li><span>✓</span>25-meter firing line</li></ul><p>STOP HERE. Follow range commands and keep one center aim.</p></div>`,
      task: "When the range is safe and commands permit, maintain the same center aim throughout your first group.", action: "terminal"
    })
  ]);

  const elements = Object.freeze({
    app: document.getElementById("tsttApp"), chapterNumber: document.getElementById("chapterNumber"), chapterSubject: document.getElementById("chapterSubject"),
    progress: document.getElementById("lessonProgress"), targetIdentity: document.getElementById("targetIdentity"), eyebrow: document.getElementById("chapterEyebrow"),
    title: document.getElementById("lessonTitle"), summary: document.getElementById("lessonSummary"), visual: document.getElementById("visualStage"), task: document.getElementById("taskCard"), action: document.getElementById("chapterAction"),
    equipmentIndicator: document.getElementById("equipmentIndicator"), equipmentLabel: document.getElementById("equipmentLabel"), dialog: document.getElementById("chapterDialog"), list: document.getElementById("chapterList"),
    pause: document.querySelector('[data-control="pause"]'), pauseLabel: document.querySelector("[data-pause-label]"), stop: document.querySelector('[data-control="stop"]'), replay: document.querySelector('[data-control="replay"]'), restart: document.querySelector('[data-control="restart"]')
  });
  const state = { started: false, current: 0, unlocked: 0, paused: false, stopped: false, utterance: null, equipment: null };

  function escaped(value = "") { return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
  function readActiveEquipment() {
    try {
      const activeId = localStorage.getItem(equipmentKeys.active) || "";
      const profiles = JSON.parse(localStorage.getItem(equipmentKeys.saved) || "[]");
      const profile = Array.isArray(profiles) ? profiles.find(item => item && item.setupId === activeId) : null;
      if (!profile) return { status: "missing", label: "NO ACTIVE SETUP" };
      const weaponText = [profile.weaponModelType, profile.weaponCatalogModel, profile.weaponPlatform, profile.setupName, profile.equipmentConfigurationId].filter(Boolean).join(" ").toLowerCase();
      const sightText = [profile.opticType, profile.opticBrand, profile.opticModel, profile.sightConfiguration, profile.adjustmentSystem, profile.equipmentConfigurationId].filter(Boolean).join(" ").toLowerCase();
      const compatible = /m16\s*-?\s*a2/.test(weaponText) && /(iron|front sight post|fsp|m16a2-standard-iron)/.test(sightText);
      const label = profile.setupName || [profile.weaponManufacturer, profile.weaponModelType, profile.opticModel || profile.opticType].filter(Boolean).join(" • ") || "ACTIVE SETUP";
      return { status: compatible ? "compatible" : "incompatible", label, profile };
    } catch (error) {
      console.warn("Active Equipment Library setup could not be read", error);
      return { status: "missing", label: "NO ACTIVE SETUP" };
    }
  }
  function syncEquipment({ rerender = true } = {}) {
    const previousStatus = state.equipment?.status;
    state.equipment = readActiveEquipment();
    elements.equipmentLabel.textContent = state.equipment.label;
    elements.equipmentIndicator.dataset.equipmentStatus = state.equipment.status;
    if (state.equipment.status !== "compatible" && state.current > 0) {
      state.current = 0; state.unlocked = 0; state.paused = false; state.stopped = false; cancelSpeech();
    }
    if (rerender && previousStatus !== state.equipment.status) render({ narrate: false, sync: false });
  }
  function cancelSpeech() { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); state.utterance = null; }
  function speakCurrent() {
    cancelSpeech();
    if (!state.started || state.paused || state.stopped || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    const utterance = new SpeechSynthesisUtterance(chapters[state.current].narration); utterance.rate = 0.9; utterance.pitch = 0.96; state.utterance = utterance; window.speechSynthesis.speak(utterance);
  }
  function setPaused(paused) {
    if (state.stopped) { state.stopped = false; state.paused = false; elements.pauseLabel.textContent = "PAUSE"; render(); return; }
    state.paused = paused; elements.app.dataset.status = paused ? "paused" : (state.started ? "active" : "waiting"); elements.pauseLabel.textContent = paused ? "RESUME" : "PAUSE";
    if (!("speechSynthesis" in window)) return;
    if (paused) window.speechSynthesis.pause(); else { window.speechSynthesis.resume(); if (!window.speechSynthesis.speaking) speakCurrent(); }
  }
  function stopTraining() { if (!state.started) return; cancelSpeech(); state.paused = false; state.stopped = true; elements.pauseLabel.textContent = "RESUME"; elements.app.dataset.status = "stopped"; }
  function setupMarkup() {
    if (state.equipment.status === "compatible") return `<div class="zeroing-setup"><span class="setup-label">YOUR ZEROING SETUP</span><div class="setup-equation"><b>M16A2 RIFLE</b><i>＋</i><b>STANDARD IRON SIGHTS</b><i>＋</i><b>25 METERS ZEROING TARGET — M16A2</b></div><div class="setup-match">✓ THIS SETUP WORKS TOGETHER</div></div>`;
    const message = state.equipment.status === "incompatible" ? `<b>${escaped(state.equipment.label)}</b><span>This lesson is for an M16A2 rifle with standard iron sights.</span>` : `<b>NO ACTIVE EQUIPMENT SETUP</b><span>Select your M16A2 rifle with standard iron sights in Equipment Library, then return here.</span>`;
    return `<div class="equipment-hold">${message}<a href="matrix.html?view=library">OPEN EQUIPMENT LIBRARY</a></div>`;
  }
  function actionMarkup(chapter) {
    if (!state.started) return `<button class="primary-action" type="button" data-action="start">START TRAINING</button>`;
    if (chapter.action === "equipment") return state.equipment.status === "compatible" ? `<button class="primary-action" type="button" data-action="next">NEXT: PREPARE THE REAR DRUM</button>` : `<div class="equipment-wait">RETURN AFTER SELECTING YOUR EQUIPMENT</div>`;
    if (chapter.action === "terminal") return `<div class="terminal-stop"><b>STOP HERE</b><span>Wait for range commands before firing.</span></div>`;
    return `<button class="primary-action" type="button" data-action="next">${chapter.actionLabel}</button>`;
  }
  function updateChapterList() {
    elements.list.innerHTML = chapters.map((chapter, index) => {
      const unavailable = state.equipment.status !== "compatible" && index > 0;
      const disabled = !state.started || unavailable || index > state.unlocked;
      const stateLabel = index === state.current ? `<small class="you-are-here">YOU ARE HERE</small>` : `<small>${unavailable ? "CHECK EQUIPMENT" : (disabled ? "LOCKED" : "OPEN")}</small>`;
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
    elements.targetIdentity.hidden = !chapter.targetIdentity; elements.eyebrow.textContent = chapter.eyebrow; elements.title.textContent = chapter.title; elements.summary.textContent = chapter.summary;
    elements.visual.innerHTML = chapter.visual(); elements.task.innerHTML = chapter.action === "equipment" ? setupMarkup() : `<span class="task-label">YOUR TASK</span><strong>${chapter.task}</strong>`; elements.action.innerHTML = actionMarkup(chapter);
    elements.pause.disabled = !state.started; elements.stop.disabled = !state.started; elements.replay.disabled = !state.started; elements.restart.disabled = !state.started;
    elements.app.dataset.status = state.stopped ? "stopped" : (state.paused ? "paused" : (state.started ? "active" : "waiting")); updateChapterList(); window.scrollTo({ top: 0, behavior: "smooth" }); if (narrate) speakCurrent();
  }
  function startTraining() { state.started = true; state.paused = false; state.stopped = false; state.current = 0; state.unlocked = state.equipment.status === "compatible" ? chapters.length - 1 : 0; render(); }
  function advance() { if (state.current === 0 && state.equipment.status !== "compatible") return; if (state.current >= chapters.length - 1) return; state.unlocked = Math.max(state.unlocked, state.current + 1); state.current += 1; state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render(); }
  function restartTraining() { cancelSpeech(); state.started = false; state.current = 0; state.unlocked = 0; state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render({ narrate: false }); }

  elements.action.addEventListener("click", event => { const action = event.target.closest("[data-action]")?.dataset.action; if (action === "start") startTraining(); if (action === "next") advance(); });
  elements.pause.addEventListener("click", () => setPaused(!state.paused)); elements.stop.addEventListener("click", stopTraining);
  elements.replay.addEventListener("click", () => { state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; render(); }); elements.restart.addEventListener("click", restartTraining);
  document.querySelector('[data-control="chapters"]').addEventListener("click", () => elements.dialog.showModal()); document.querySelector("[data-close-chapters]").addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", event => { const button = event.target.closest("[data-chapter-index]"); if (!button || button.disabled) return; state.current = Number(button.dataset.chapterIndex); state.paused = false; state.stopped = false; elements.pauseLabel.textContent = "PAUSE"; elements.dialog.close(); render(); });
  window.addEventListener("focus", () => syncEquipment()); window.addEventListener("pageshow", () => syncEquipment()); window.addEventListener("storage", event => { if ([equipmentKeys.active, equipmentKeys.saved].includes(event.key)) syncEquipment(); });
  syncEquipment({ rerender: false }); render({ narrate: false, sync: false });
})();
