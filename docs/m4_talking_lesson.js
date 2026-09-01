(function exposeM4TalkingLesson(global) {
  "use strict";

  let player = null;
  let lessonState = "waiting";
  let actionRestore = null;

  const TIMING = Object.freeze({
    speechPauseMs: 850,
    inspectionHoldMs: 1700,
    aimHoldMs: 3000,
    addPhotoHoldMs: 2200
  });

  function clean(value, fallback = "") {
    const text = String(value || "").trim();
    return text || fallback;
  }

  function lessonAuthority(config = global.SCZN3_M4_CONFIG || {}) {
    const target = config.target || {};
    const mission = config.zeroingMission || {};
    const geometry = target.geometry || {};
    const bull = geometry.bullCoordinate || {};
    const distance = mission.defaultDistance || {};
    return Object.freeze({
      targetName: clean(target.targetName, "M4 Smart Target"),
      missionLabel: clean(mission.label, "governed M4 zeroing mission"),
      distanceValue: clean(distance.value),
      distanceUnit: clean(distance.unit).toUpperCase(),
      bullXPercent: bull.xPercent !== "" && bull.xPercent !== null && bull.xPercent !== undefined && Number.isFinite(Number(bull.xPercent)) ? Number(bull.xPercent) : null,
      bullYPercent: bull.yPercent !== "" && bull.yPercent !== null && bull.yPercent !== undefined && Number.isFinite(Number(bull.yPercent)) ? Number(bull.yPercent) : null,
      bullAuthoritySource: clean(bull.source)
    });
  }

  function steps(config = global.SCZN3_M4_CONFIG || {}) {
    const authority = lessonAuthority(config);
    return [
      {
        state: "intro",
        narration: `You selected the ${authority.targetName}. This target authorizes the ${authority.missionLabel}.`,
        after: TIMING.inspectionHoldMs
      },
      {
        state: "distance",
        narration: `Use this target at ${authority.distanceValue} ${authority.distanceUnit}. The target's zeroing mission is ${authority.missionLabel}.`,
        after: TIMING.inspectionHoldMs
      },
      {
        state: "aim",
        narration: "Aim at target center. Tap-n-Score will keep the point you actually aimed at as the reference for your shooting session.",
        after: TIMING.aimHoldMs
      },
      {
        state: "add-photo",
        narration: "After you shoot your group, add a photo of this target.",
        after: TIMING.speechPauseMs
      },
      {
        state: "handoff",
        narration: "Tap Add Photo when you're ready. Then mark your aim point and each visible impact.",
        action: Object.freeze({
          id: "add-photo",
          selector: "#chooseTargetButton",
          label: "📷 Add Photo",
          highlightMs: 950,
          tapMs: 420
        }),
        after: TIMING.addPhotoHoldMs
      },
      { state: "handoff", preserveScene: true, terminal: true }
    ];
  }

  function isEligible(targetProfileId, evidence) {
    const profile = clean(targetProfileId || evidence && evidence.targetProfileId).toLowerCase();
    const source = clean(evidence && evidence.dataUrl);
    const authorityId = clean(evidence && (evidence.registrationAuthorityId || evidence.targetId));
    const assetRole = clean(evidence && evidence.assetRole);
    return profile === "m4_25m_zero"
      && !!evidence
      && evidence.registrationStatus === "complete"
      && assetRole === "founder-workspace-presentation-from-physically-validated-reconstruction"
      && (
        authorityId === "M4_TARGET_AUTHORITY_v1_ORIGINAL"
        || source.includes("M4_M16_25M_WORKSPACE_PRESENTATION.svg")
      );
  }

  function featureHighlight(authority) {
    if (authority.bullXPercent === null || authority.bullYPercent === null) return "";
    return `<i class="m4-lesson-feature-highlight is-active" data-m4-lesson-feature="aim" style="--m4-lesson-x:${authority.bullXPercent}%;--m4-lesson-y:${authority.bullYPercent}%" aria-hidden="true"></i>`;
  }

  function sceneMarkup(state, config = global.SCZN3_M4_CONFIG || {}) {
    const authority = lessonAuthority(config);
    if (state === "intro") {
      return `<div class="m4-lesson-callout"><strong>M4 25 METER ZERO</strong><span>${authority.targetName}</span></div>`;
    }
    if (state === "distance") {
      return `<div class="m4-lesson-callout"><strong>${authority.missionLabel.toUpperCase()}</strong><span>Governing target distance: ${authority.distanceValue} ${authority.distanceUnit}</span></div>`;
    }
    if (state === "aim") {
      return `<div class="m4-lesson-callout"><strong>AIM AT TARGET CENTER</strong><span>Your declared aim point remains the session reference.</span></div>${featureHighlight(authority)}`;
    }
    if (state === "add-photo") {
      return `<div class="m4-lesson-callout"><strong>SHOOT YOUR GROUP</strong><span>When you finish, add a photo of this target.</span></div>`;
    }
    if (state === "handoff") {
      return `<div class="m4-lesson-callout is-action-guidance"><strong>📷 ADD PHOTO</strong><span>Mark your aim point and each visible impact next.</span></div>`;
    }
    return "";
  }

  function markup() {
    return `<div class="m4-talking-lesson-layer" id="m4TalkingLessonLayer" data-lesson-state="waiting"><div class="m4-talking-lesson-scene" id="m4TalkingLessonScene" aria-live="polite"></div><button class="m4-talking-lesson-start" id="m4TalkingLessonStart" type="button" data-sczn3-live-control="m4-target-talk" aria-label="Let the M4 target talk. Start the M4 lesson."><span aria-hidden="true">🗣️</span><strong>LET THE TARGET TALK</strong></button></div>`;
  }

  function setState(state, config) {
    lessonState = state;
    const root = global.document && global.document.getElementById("workspaceStageShell");
    const layer = global.document && global.document.getElementById("m4TalkingLessonLayer");
    const scene = global.document && global.document.getElementById("m4TalkingLessonScene");
    if (root) root.dataset.m4LessonState = state;
    if (layer) layer.dataset.lessonState = state;
    if (scene) scene.innerHTML = state === "waiting" ? "" : sceneMarkup(state, config);
    syncStart(player ? player.status : "idle");
  }

  function syncStart(status = "idle") {
    const start = global.document && global.document.getElementById("m4TalkingLessonStart");
    if (start) start.hidden = lessonState !== "waiting" || status === "completed";
  }

  function resolveAction(action) {
    const button = action && action.selector && global.document
      ? global.document.querySelector(action.selector)
      : null;
    if (!button) return null;
    clearAction();
    actionRestore = {
      button,
      text: button.textContent,
      hidden: button.hidden,
      disabled: button.disabled,
      display: button.style.display
    };
    button.dataset.m4LessonHandoff = "true";
    button.hidden = false;
    button.disabled = false;
    button.style.removeProperty("display");
    button.textContent = action.label || button.textContent;
    return button;
  }

  function clearAction() {
    if (!actionRestore) return;
    const restore = actionRestore;
    restore.button.classList.remove("self-teaching-player-action-highlight", "is-demonstrated-tap", "is-player-paused");
    delete restore.button.dataset.m4LessonHandoff;
    restore.button.textContent = restore.text;
    restore.button.hidden = restore.hidden;
    restore.button.disabled = restore.disabled;
    restore.button.style.display = restore.display;
    actionRestore = null;
  }

  function stop({ reset = false } = {}) {
    if (player) player.stop({ reset });
    else if (reset) setState("waiting", global.SCZN3_M4_CONFIG);
    clearAction();
  }

  function bind(options = {}) {
    const root = options.root;
    const host = options.host;
    const config = options.config || global.SCZN3_M4_CONFIG || {};
    const start = global.document && global.document.getElementById("m4TalkingLessonStart");
    if (!root || !host || !start || !global.SCZN3SelfTeachingPlayer) return null;

    if (!host.querySelector("[data-self-teaching-player-controls]")) {
      host.innerHTML = global.SCZN3SelfTeachingPlayer.controlsMarkup("M4 Let the Target Talk player");
    }
    const controls = host.querySelector("[data-self-teaching-player-controls]");
    if (!player) {
      player = global.SCZN3SelfTeachingPlayer.create({
        root,
        steps: steps(config),
        renderStep: step => {
          if (lessonState !== step.state || !step.preserveScene) setState(step.state, config);
        },
        renderReset: () => {
          clearAction();
          setState("waiting", config);
        },
        resolveAction,
        demonstrateAction: () => {},
        clearAction,
        onNarrationStatus: status => { global.document.body.dataset.m4LessonNarration = status; },
        onStatusChange: status => {
          global.document.body.dataset.m4LessonStatus = status;
          syncStart(status);
        }
      });
      player.bindControls(controls);
    }

    ["pointerdown", "pointerup", "pointercancel"].forEach(eventName => {
      start.addEventListener(eventName, event => event.stopPropagation());
    });
    start.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      player.play();
    });
    setState(player.status === "idle" ? "waiting" : lessonState, config);
    syncStart(player.status);
    return player;
  }

  global.SCZN3M4TalkingLesson = Object.freeze({
    bind,
    isEligible,
    lessonAuthority,
    markup,
    sceneMarkup,
    steps,
    stop
  });
})(window);
