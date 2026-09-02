(function initializeM16A2TSTT() {
  "use strict";

  const targetImage = "authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02.png";

  const chapters = Object.freeze([
    Object.freeze({
      id: "a2-1",
      label: "TARGET + EQUIPMENT",
      shortTitle: "Confirm target and equipment",
      eyebrow: "BAKER M16A2 • 25 METER",
      title: "Know the target before you touch the sights.",
      summary: "Match the target, then confirm the only equipment branch authorized for this first class.",
      narration: "This is the Baker M16A2 twenty-five meter zeroing target. Match the M16A2 title, red silhouette, and numbered grid. This first class is only for an M16A2 with the standard rear sight and front sight post. Choose the equipment that is actually on your rifle.",
      visual: () => `<div class="identity-layout"><figure class="target-window"><img src="${targetImage}" alt="Baker M16A2 25 Meter zeroing target with red silhouette and numbered grid"><figcaption>BAKER ST-M16A2R • M16A2 FACE</figcaption></figure><div class="identity-callouts" aria-label="Target identity markers"><span><b>M16A2</b> printed above the grid</span><span><b>RED</b> center silhouette</span><span><b>±27 / ±10</b> numbered grid</span></div></div>`,
      task: "Look at your target and rifle. Select the sight system that is actually installed.",
      action: "equipment"
    }),
    Object.freeze({
      id: "a2-2",
      label: "REAR-DRUM SETUP",
      shortTitle: "Prepare the rear elevation drum",
      eyebrow: "TEMPORARY 25-METER SETUP",
      title: "Set 300. Then go one click past.",
      summary: "The rear elevation drum prepares the rifle for this 25-meter procedure. It is not the control used later to correct group elevation.",
      narration: "With the rifle unloaded and handled under your range's safety rules, find the rear elevation drum. Set the drum at the three-hundred-meter mark. Then rotate it clockwise one click past three hundred, viewed from above. This is temporary setup. Do not use this drum to correct the shot group.",
      visual: () => `<div class="drum-demo"><div class="view-label">VIEWED FROM ABOVE</div><svg viewBox="0 0 360 250" role="img" aria-label="Rear elevation drum moves clockwise one click from the 300 mark"><circle cx="180" cy="128" r="83" class="diagram-ring"/><circle cx="180" cy="128" r="48" class="diagram-core"/><line x1="180" y1="44" x2="180" y2="72" class="index-line"/><text x="180" y="31" class="diagram-label">INDEX</text><text x="180" y="139" class="drum-mark">300</text><path d="M 108 84 A 86 86 0 0 1 248 85" class="motion-arrow"/><polygon points="250,85 228,79 241,102" class="arrow-head"/><text x="180" y="224" class="diagram-command">CLOCKWISE • ONE CLICK PAST 300</text></svg><div class="not-correction"><b>SETUP CONTROL</b><span>Rear elevation drum</span><em>Not group-elevation correction</em></div></div>`,
      task: "On a safe, unloaded rifle: locate 300, then rehearse one clockwise click past it while viewing the drum from above.",
      action: "advance",
      actionLabel: "I REHEARSED THE SETUP"
    }),
    Object.freeze({
      id: "a2-3",
      label: "GRID + AIM",
      shortTitle: "Understand the grid and aim",
      eyebrow: "AIM RELATIONSHIP",
      title: "The center is your reference.",
      summary: "The grid measures where the group lands in relation to where you aimed. For this target, aim at the center.",
      narration: "The target grid extends twenty-seven units left and right and ten units up and down. The heavy center lines meet at the white center of the red silhouette. That intersection is your point of aim. Keep that same center aim through the entire first group. Later, Tap-n-Score will measure where the group landed. Do not estimate a correction now.",
      visual: () => `<div class="aim-demo"><figure class="target-window is-aim"><img src="${targetImage}" alt="Baker M16A2 target centered on the heavy horizontal and vertical grid lines"><span class="aim-reticle" aria-hidden="true"><i></i></span><figcaption>HOLD THE SAME CENTER AIM</figcaption></figure><div class="axis-key"><span><b>±27</b> LEFT / RIGHT</span><span><b>±10</b> UP / DOWN</span></div></div>`,
      task: "Point to the heavy-line intersection at the center of the red silhouette. That is the aim reference for every shot in the first group.",
      action: "advance",
      actionLabel: "I FOUND THE AIM POINT"
    }),
    Object.freeze({
      id: "a2-4",
      label: "ADJUSTMENT CONTROLS",
      shortTitle: "Rehearse the correction controls",
      eyebrow: "STANDARD M16A2 IRON SIGHTS",
      title: "Two controls. Four movements.",
      summary: "Front sight post controls group elevation. Rear windage knob controls group windage. Direction is always stated as desired point-of-impact movement.",
      narration: "For group elevation, use the front sight post. Each click is one point two five minutes of angle. To move impact up, turn the front sight post clockwise viewed from above. To move impact down, turn it counterclockwise viewed from above. For windage, use the exposed right-side rear windage knob. Each click is zero point five minutes of angle. To move impact right, turn it clockwise while looking squarely at the knob face. To move impact left, turn it counterclockwise. The rear elevation drum is not the group-elevation correction control in this procedure.",
      visual: () => `<div class="control-grid"><section class="control-card"><div class="control-name"><span>ELEVATION</span><b>FRONT SIGHT POST</b><em>1.25 MOA / CLICK</em></div><div class="control-figure front-post" aria-hidden="true"><span class="post-tip"></span><span class="post-base"></span><i class="view-axis">VIEW FROM ABOVE</i></div><div class="movement-list"><span><b>MOVE IMPACT UP</b><i>↻ CLOCKWISE</i></span><span><b>MOVE IMPACT DOWN</b><i>↺ COUNTERCLOCKWISE</i></span></div></section><section class="control-card"><div class="control-name"><span>WINDAGE</span><b>REAR WINDAGE KNOB</b><em>0.5 MOA / CLICK</em></div><div class="control-figure windage-knob" aria-hidden="true"><span></span><i class="view-axis">FACE THE RIGHT-SIDE KNOB</i></div><div class="movement-list"><span><b>MOVE IMPACT RIGHT</b><i>↻ CLOCKWISE</i></span><span><b>MOVE IMPACT LEFT</b><i>↺ COUNTERCLOCKWISE</i></span></div></section></div><div class="authority-reminder"><b>NOT THE REAR DRUM</b><span>Use the front sight post for group elevation correction.</span></div>`,
      task: "With the rifle safe, point to the front sight post for elevation and the rear windage knob for left/right movement. Say the desired impact movement before rehearsing the turn.",
      action: "advance",
      actionLabel: "I REHEARSED BOTH CONTROLS"
    }),
    Object.freeze({
      id: "a2-5",
      label: "PRE-FIRE READY",
      shortTitle: "Ready for the first group",
      eyebrow: "STOP POINT • LIVE FIRE COMES NEXT",
      title: "Ready to fire your first group.",
      summary: "You have the correct target, admitted sight branch, temporary drum setup, center aim, and adjustment-control map.",
      narration: "You are ready for your first group. At twenty-five meters, follow all range commands and safety procedures. Use the center of the target as the same point of aim for every shot. Your governing range procedure determines the number of rounds. This class stops here, before live fire. It does not ask for a photo, measure a group, or issue a correction.",
      visual: () => `<div class="ready-panel"><span class="ready-kicker">PREFIRE CHECK COMPLETE</span><div class="ready-title">READY TO FIRE<br>YOUR FIRST GROUP</div><ul><li><span>✓</span>Baker M16A2 25 Meter target</li><li><span>✓</span>Standard M16A2 iron-sight branch</li><li><span>✓</span>Rear drum: one click past 300</li><li><span>✓</span>Aim: center intersection</li><li><span>✓</span>25-meter firing line</li></ul><p>Follow range commands. Keep one center aim. This build stops before live fire.</p></div>`,
      task: "When the range is safe and commands permit, maintain the same center aim throughout your first group. The authorized live-fire road begins after this review build.",
      action: "terminal"
    })
  ]);

  const elements = Object.freeze({
    app: document.getElementById("tsttApp"),
    chapterNumber: document.getElementById("chapterNumber"),
    chapterTime: document.getElementById("chapterTime"),
    progress: document.getElementById("lessonProgress"),
    eyebrow: document.getElementById("chapterEyebrow"),
    title: document.getElementById("lessonTitle"),
    summary: document.getElementById("lessonSummary"),
    visual: document.getElementById("visualStage"),
    task: document.getElementById("taskCard"),
    action: document.getElementById("chapterAction"),
    dialog: document.getElementById("chapterDialog"),
    list: document.getElementById("chapterList"),
    pause: document.querySelector('[data-control="pause"]'),
    pauseLabel: document.querySelector("[data-pause-label]"),
    replay: document.querySelector('[data-control="replay"]'),
    restart: document.querySelector('[data-control="restart"]')
  });

  const state = { started: false, current: 0, equipmentBranch: null, unlocked: 0, paused: false, utterance: null };

  function cancelSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    state.utterance = null;
  }

  function speakCurrent() {
    cancelSpeech();
    if (!state.started || state.paused || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    const utterance = new SpeechSynthesisUtterance(chapters[state.current].narration);
    utterance.rate = 0.9;
    utterance.pitch = 0.96;
    state.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function setPaused(paused) {
    state.paused = paused;
    elements.app.dataset.status = paused ? "paused" : (state.started ? "active" : "waiting");
    elements.pauseLabel.textContent = paused ? "RESUME" : "PAUSE";
    if (!("speechSynthesis" in window)) return;
    if (paused) window.speechSynthesis.pause();
    else {
      window.speechSynthesis.resume();
      if (!window.speechSynthesis.speaking) speakCurrent();
    }
  }

  function actionMarkup(chapter) {
    if (!state.started) return `<button class="primary-action" type="button" data-action="start">START TRAINING</button>`;
    if (chapter.action === "equipment") {
      if (state.equipmentBranch === "standard-irons") {
        return `<div class="branch-confirmed"><span>✓</span><div><b>APPLICABLE BRANCH CONFIRMED</b><small>Standard M16A2 rear sight + front sight post</small></div></div><button class="primary-action" type="button" data-action="next">NEXT: PREPARE THE REAR DRUM</button>`;
      }
      return `<div class="equipment-options"><button type="button" data-equipment="standard-irons"><b>STANDARD M16A2 IRON SIGHTS</b><span>Rear elevation drum • rear windage knob • front sight post</span></button><button type="button" data-equipment="other"><b>DIFFERENT SIGHT OR OPTIC</b><span>This class must not teach an irrelevant branch.</span></button></div><div class="branch-hold" id="branchHold" hidden><b>BRANCH NOT AUTHORIZED</b><span>This first class covers standard M16A2 iron sights only. Choose the correct class before continuing.</span></div>`;
    }
    if (chapter.action === "terminal") return `<div class="terminal-stop"><b>PRE-FIRE TRAINING COMPLETE</b><span>No live-fire, photo, scoring, correction, or confirmation behavior is active in this build.</span></div>`;
    return `<button class="primary-action" type="button" data-action="next">${chapter.actionLabel}</button>`;
  }

  function updateChapterList() {
    elements.list.innerHTML = chapters.map((chapter, index) => {
      const locked = index > 0 && state.equipmentBranch !== "standard-irons";
      const available = !locked && index <= Math.max(state.unlocked, state.equipmentBranch ? chapters.length - 1 : 0);
      const disabled = !state.started || !available;
      const stateLabel = locked ? "SELECT EQUIPMENT FIRST" : (index === state.current ? "CURRENT" : (disabled ? "LOCKED" : "OPEN"));
      return `<li><button type="button" data-chapter-index="${index}" ${disabled ? "disabled" : ""} ${index === state.current ? 'aria-current="step"' : ""}><strong>${String(index + 1).padStart(2, "0")}</strong><span><b>${chapter.shortTitle}</b><small>${stateLabel}</small></span></button></li>`;
    }).join("");
  }

  function render({ narrate = true } = {}) {
    const chapter = chapters[state.current];
    elements.chapterNumber.textContent = `CHAPTER ${state.current + 1} OF ${chapters.length}`;
    elements.chapterTime.textContent = chapter.label;
    elements.progress.style.width = `${((state.current + 1) / chapters.length) * 100}%`;
    elements.eyebrow.textContent = chapter.eyebrow;
    elements.title.textContent = chapter.title;
    elements.summary.textContent = chapter.summary;
    elements.visual.innerHTML = chapter.visual();
    elements.task.innerHTML = `<span class="task-label">YOUR TASK</span><strong>${chapter.task}</strong>`;
    elements.action.innerHTML = actionMarkup(chapter);
    elements.pause.disabled = !state.started;
    elements.replay.disabled = !state.started;
    elements.restart.disabled = !state.started;
    elements.app.dataset.status = state.paused ? "paused" : (state.started ? "active" : "waiting");
    updateChapterList();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (narrate) speakCurrent();
  }

  function startTraining() {
    state.started = true;
    state.paused = false;
    state.current = 0;
    state.unlocked = 0;
    render();
  }

  function advance() {
    if (state.current === 0 && state.equipmentBranch !== "standard-irons") return;
    if (state.current >= chapters.length - 1) return;
    state.unlocked = Math.max(state.unlocked, state.current + 1);
    state.current += 1;
    state.paused = false;
    elements.pauseLabel.textContent = "PAUSE";
    render();
  }

  function chooseEquipment(value) {
    const hold = document.getElementById("branchHold");
    if (value !== "standard-irons") {
      state.equipmentBranch = null;
      if (hold) hold.hidden = false;
      updateChapterList();
      return;
    }
    state.equipmentBranch = "standard-irons";
    state.unlocked = chapters.length - 1;
    render({ narrate: false });
  }

  function restartTraining() {
    cancelSpeech();
    state.started = false;
    state.current = 0;
    state.equipmentBranch = null;
    state.unlocked = 0;
    state.paused = false;
    elements.pauseLabel.textContent = "PAUSE";
    render({ narrate: false });
  }

  elements.action.addEventListener("click", event => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    const equipment = event.target.closest("[data-equipment]")?.dataset.equipment;
    if (action === "start") startTraining();
    if (action === "next") advance();
    if (equipment) chooseEquipment(equipment);
  });
  elements.pause.addEventListener("click", () => setPaused(!state.paused));
  elements.replay.addEventListener("click", () => {
    state.paused = false;
    elements.pauseLabel.textContent = "PAUSE";
    render();
  });
  elements.restart.addEventListener("click", restartTraining);
  document.querySelector('[data-control="chapters"]').addEventListener("click", () => elements.dialog.showModal());
  document.querySelector("[data-close-chapters]").addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", event => {
    const button = event.target.closest("[data-chapter-index]");
    if (!button || button.disabled) return;
    state.current = Number(button.dataset.chapterIndex);
    state.paused = false;
    elements.pauseLabel.textContent = "PAUSE";
    elements.dialog.close();
    render();
  });

  render({ narrate: false });
})();
