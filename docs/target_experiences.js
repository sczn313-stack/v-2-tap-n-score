(function () {
  "use strict";

  const PENDING_TARGET_KEY = "SCZN3_PENDING_TARGET_PROFILE";
  const TALK_PREFERENCE_KEY = "SCZN3_TALK_ME_THROUGH_IT_V1";
  const publishers = Object.freeze({
    baker: { name: "Baker Targets", catalogUrl: "https://bakertargets.com/shop/" },
    gunfun: { name: "GunFun Shooting Targets", catalogUrl: "https://gunfun.com/shop/" },
    ez2c: { name: "EZ2C Targets", catalogUrl: "https://www.ez2ctargets.com/" }
  });

  const experiences = Object.freeze({
    "100-yard-bullseye": {
      id: "baker-100-yard-bullseye",
      name: "100 Yard Bullseye",
      shooterDescription: "See where your shots land and make the correction.",
      targetId: "baker_st_100yd_smart_zero",
      href: "matrix.html?target_profile_id=baker_st_100yd_smart_zero&targetName=Baker%20100%20Yard%20Smart%20Target&equipment=standard",
      art: "bullseye",
      publisherKey: "baker"
    },
    "m4-zero": {
      id: "m4-25-meter-zero",
      name: "M4 25m Zero Practice Target",
      shooterDescription: "Practice military zeroing and see the correction.",
      targetId: "m4_25m_zero",
      href: "matrix.html?target_profile_id=m4_25m_zero&targetName=M4%2FM16%20Series%20Weapons%2025M%20Zero&equipment=standard",
      art: "military",
      publisherKey: "baker"
    },
    "dot-torture": {
      id: "dot-torture",
      name: "Dot Torture",
      shooterDescription: "Work through the target's practice course one step at a time.",
      targetId: "ez2c_dot_torture_17",
      href: "t/baker/fun/?target=dot-torture",
      art: "dots",
      publisherKey: "ez2c"
    },
    "uspsa-practice": {
      id: "uspsa-practice-target",
      name: "USPSA Practice Target",
      shooterDescription: "Shoot it, score it, and see how you did.",
      targetId: "BAKER_SL_ST1",
      href: "t/baker/sl-st1/",
      art: "silhouette",
      publisherKey: "baker"
    },
    "gssf-practice": {
      id: "gssf-practice-target",
      name: "GSSF Practice Target",
      shooterDescription: "Practice the course and keep your result.",
      targetId: "gssf_ac_1",
      href: "matrix.html?target_profile_id=gssf_ac_1&targetName=GSSF%20AC-1&equipment=standard",
      art: "rings",
      attributes: {
        "data-target-profile-id": "gssf_ac_1",
        "data-target-name": "GSSF AC-1"
      }
    },
    "idpa-practice": {
      id: "idpa-practice-target",
      name: "IDPA Practice Target",
      shooterDescription: "Practice the timed course and review your result.",
      targetId: "idpa_silhouette_sl_st2",
      href: "t/baker/sl-st2/",
      art: "shield",
      publisherKey: "baker"
    },
    "dart-board": {
      id: "dart-board",
      name: "Dart Board",
      shooterDescription: "Turn your range session into a game of darts.",
      targetId: "baker_gf_db",
      href: "t/baker/fun/?target=gf-db",
      art: "dart",
      publisherKey: "baker"
    },
    "bowling-pins": {
      id: "bowling-pins",
      name: "Bowling Pins",
      shooterDescription: "See how many pins you can hit in ten shots.",
      targetId: "baker_gf_bp",
      href: "t/baker/fun/?target=gf-bp",
      art: "pins",
      publisherKey: "baker"
    },
    "splatter": {
      id: "splatter-target",
      name: "Splatter Target",
      shooterDescription: "No course and no score required. Just shoot.",
      targetId: "gunfun_79220_splatter_2_circles",
      href: "target-experience.html?target=gunfun_79220_splatter_2_circles&missionFamily=smartEvidenceCapture",
      art: "splatter",
      publisherKey: "gunfun"
    },
    "five-circles": {
      id: "gunfun-five-circles",
      name: "5 Circles",
      shooterDescription: "Use five clear aim points and review where your shots land.",
      targetId: "gunfun_12190_5_circles",
      href: "target-experience.html?target=gunfun_12190_5_circles&missionFamily=smartEvidenceCapture",
      art: "rings",
      publisherKey: "gunfun"
    },
    "tennessee-qualification": {
      id: "gunfun-tennessee-qualification-practice",
      name: "Tennessee Qualification Practice Target",
      shooterDescription: "Shoot the target and review where your shots landed.",
      targetId: "gunfun_43020_tennessee_qualifying_target_small",
      href: "target-experience.html?target=gunfun_43020_tennessee_qualifying_target_small&missionFamily=smartEvidenceCapture",
      art: "silhouette",
      publisherKey: "gunfun"
    },
    "vital-dude": {
      id: "gunfun-vital-dude",
      name: "Vital Dude",
      shooterDescription: "Mark the shots you can see and review your session.",
      targetId: "gunfun_22740_vital_dude",
      href: "t/gunfun/vital-dude/",
      art: "silhouette",
      publisherKey: "gunfun"
    },
    "seven-shot-spots": {
      id: "gunfun-seven-shot-spots",
      name: "7 Shot Spots",
      shooterDescription: "Choose an aim point, shoot, and review your shots.",
      targetId: "gunfun_12200_7_shot_spots",
      href: "target-experience.html?target=gunfun_12200_7_shot_spots&missionFamily=smartEvidenceCapture",
      art: "dots",
      publisherKey: "gunfun"
    },
    "m16-a2-a4-zero": {
      id: "gunfun-m16-a2-a4-zero",
      name: "M16 A2 and A4 Zeroing Target Red",
      shooterDescription: "Practice with the M16 zeroing pattern and review your shots.",
      targetId: "gunfun_32110_m16_a2_and_a4_zeroing_target_red",
      href: "target-experience.html?target=gunfun_32110_m16_a2_and_a4_zeroing_target_red&missionFamily=smartEvidenceCapture",
      art: "military",
      publisherKey: "gunfun"
    },
    "precision-sighting": {
      id: "gunfun-precision-sighting",
      name: "Precision Sighting",
      shooterDescription: "Use the sighting pattern and review where your shots land.",
      targetId: "gunfun_12110_precision_sighting",
      href: "target-experience.html?target=gunfun_12110_precision_sighting&missionFamily=smartEvidenceCapture",
      art: "rings",
      publisherKey: "gunfun"
    },
    "getting-started": {
      id: "gunfun-getting-started",
      name: "Getting Started",
      shooterDescription: "Practice with several aim points and review your shots.",
      targetId: "gunfun_12040_getting_started",
      href: "target-experience.html?target=gunfun_12040_getting_started&missionFamily=smartEvidenceCapture",
      art: "dots",
      publisherKey: "gunfun"
    },
    "small-target-101": {
      id: "gunfun-small-target-101",
      name: "Small Target 101",
      shooterDescription: "Work through the target and review where your shots landed.",
      targetId: "gunfun_12120_small_target_101",
      href: "target-experience.html?target=gunfun_12120_small_target_101&missionFamily=smartEvidenceCapture",
      art: "rings",
      publisherKey: "gunfun"
    },
    "competition-1": {
      id: "gunfun-competition-1",
      name: "Competition 1",
      shooterDescription: "Shoot the target and let Tap-n-Score record your results.",
      targetId: "gunfun_12210_competition_1",
      href: "target-experience.html?target=gunfun_12210_competition_1&missionFamily=smartEvidenceCapture",
      art: "rings",
      publisherKey: "gunfun"
    },
    "five-gun-competition": {
      id: "gunfun-five-gun-competition",
      name: "5 Gun Competition Target",
      shooterDescription: "Shoot your target. Tap-n-Score will help you capture and review your shots.",
      targetId: "gunfun_21220_5_gun_competition_target",
      href: "target-experience.html?target=gunfun_21220_5_gun_competition_target&missionFamily=smartEvidenceCapture",
      art: "silhouette",
      publisherKey: "gunfun"
    },
    "navy-qual-m4": {
      id: "gunfun-navy-qual-m4",
      name: "Navy Qual – M4",
      shooterDescription: "Shoot the Navy target and review where your shots landed.",
      targetId: "gunfun_22460_navy_qual_m4",
      href: "target-experience.html?target=gunfun_22460_navy_qual_m4&missionFamily=smartEvidenceCapture",
      art: "military",
      publisherKey: "gunfun"
    }
  });

  const doors = Object.freeze([
    {
      id: "diagnose-zero",
      title: "DIAGNOSE & ZERO",
      representative: "100 Yard Bullseye",
      representativeKey: "100-yard-bullseye",
      description: "See where you're hitting. Make the correction.",
      art: "bullseye",
      targets: ["five-circles", "precision-sighting"]
    },
    {
      id: "practice",
      title: "PRACTICE",
      representative: "Dot Torture",
      representativeKey: "dot-torture",
      description: "Work on what you want to improve.",
      art: "dots",
      targets: ["getting-started", "small-target-101"]
    },
    {
      id: "compete",
      title: "COMPETE",
      representative: "USPSA Practice Target",
      representativeKey: "uspsa-practice",
      description: "Shoot it. Score it. See how you did.",
      art: "silhouette",
      targets: ["competition-1", "five-gun-competition"]
    },
    {
      id: "qualify",
      title: "QUALIFY",
      representative: "GSSF Practice Target",
      representativeKey: "gssf-practice",
      description: "Shoot the course. Know your result.",
      art: "rings",
      targets: ["tennessee-qualification"]
    },
    {
      id: "law-enforcement",
      title: "LAW ENFORCEMENT",
      representative: "IDPA Practice Target",
      representativeKey: "idpa-practice",
      description: "Practice with law-enforcement targets and courses.",
      art: "shield",
      targets: ["vital-dude"]
    },
    {
      id: "fun-games",
      title: "FUN & GAMES",
      representative: "Dart Board",
      representativeKey: "dart-board",
      description: "Put some fun into your range day.",
      art: "dart",
      targets: ["bowling-pins"]
    },
    {
      id: "just-shoot",
      title: "JUST SHOOT",
      representative: "Splatter Target",
      representativeKey: "splatter",
      description: "No course. No score required. Just shoot.",
      art: "splatter",
      targets: ["seven-shot-spots"]
    },
    {
      id: "military",
      title: "MILITARY",
      representative: "M4 25m Zero Practice Target",
      representativeKey: "m4-zero",
      description: "Practice with military targets and courses.",
      art: "military",
      targets: ["m16-a2-a4-zero", "navy-qual-m4"]
    }
  ]);

  const escapeHtml = value => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  function qrcMarkup() {
    return `<span class="ecosystem-qrc" role="img" aria-label="SCZN3 QRC"><i></i><i></i><i></i><b>3</b></span>`;
  }

  function artMarkup(kind, label) {
    const modules = kind === "dots"
      ? "<i></i><i></i><i></i><i></i><i></i><i></i>"
      : kind === "pins"
        ? "<i></i><i></i><i></i><i></i><i></i>"
        : "<i></i><i></i><i></i>";
    return `<span class="ecosystem-target-art ecosystem-target-art--${escapeHtml(kind)}" role="img" aria-label="Vendor-free ${escapeHtml(label)} representative target artwork">${modules}${qrcMarkup()}</span>`;
  }

  function targetNameMarkup(name) {
    const match = String(name || "").match(/^(.*?)(\s+Practice Target)$/i);
    if (!match) return escapeHtml(name);
    return `<span class="ecosystem-practice-name"><span>${escapeHtml(match[1])}</span><span>${escapeHtml(match[2])}</span></span>`;
  }

  function targetMarkup(experience) {
    const attributes = Object.entries(experience.attributes || {})
      .map(([name, value]) => `${escapeHtml(name)}="${escapeHtml(value)}"`)
      .join(" ");
    return `
      <a class="ecosystem-target-card ecosystem-door-choice" data-experience-id="${escapeHtml(experience.id)}" data-status="available" href="${escapeHtml(experience.href)}" aria-label="Tap to begin ${escapeHtml(experience.name)}" data-target-id="${escapeHtml(experience.targetId)}" data-publisher-key="${escapeHtml(experience.publisherKey)}" ${attributes}>
        <span class="ecosystem-target-thumbnail">${artMarkup(experience.art, experience.name)}</span>
        <span class="ecosystem-target-copy">
          <h3>${targetNameMarkup(experience.name)}</h3>
          <p data-shooter-description>${escapeHtml(experience.shooterDescription)}</p>
        </span>
        <span class="ecosystem-card-action ecosystem-card-action--launch">BEGIN <span aria-hidden="true">→</span></span>
      </a>`;
  }

  function doorMarkup(door) {
    const controlsId = `door-targets-${door.id}`;
    const representative = experiences[door.representativeKey];
    return `
      <article class="ecosystem-door-item" data-door-item="${escapeHtml(door.id)}">
        <div class="ecosystem-target-card ecosystem-door-card" data-representative-target-id="${escapeHtml(representative.targetId)}">
          <a class="ecosystem-door-representative-entry" href="${escapeHtml(representative.href)}" data-target-id="${escapeHtml(representative.targetId)}" data-publisher-key="${escapeHtml(representative.publisherKey)}" aria-label="Begin ${escapeHtml(representative.name)}">
            <span class="ecosystem-target-thumbnail">${artMarkup(door.art, door.representative)}</span>
            <span class="ecosystem-target-copy">
              <span class="ecosystem-door-title">${escapeHtml(door.title)}</span>
              <span class="ecosystem-door-representative">${targetNameMarkup(door.representative)}</span>
              <span class="ecosystem-door-description">${escapeHtml(door.description)}</span>
              <span class="ecosystem-door-begin">BEGIN <span aria-hidden="true">→</span></span>
            </span>
          </a>
          <button class="ecosystem-card-action ecosystem-door-toggle" type="button" data-door-id="${escapeHtml(door.id)}" aria-expanded="false" aria-controls="${controlsId}"><span data-door-action-label>SEE TARGETS</span> <span data-door-action-arrow aria-hidden="true">↓</span></button>
        </div>
        <div class="ecosystem-door-targets" id="${controlsId}" hidden>
          ${door.targets.map(key => targetMarkup(experiences[key])).join("")}
        </div>
      </article>`;
  }

  function preservePendingTarget(targetId) {
    if (!targetId) return;
    const encoded = JSON.stringify({ targetId });
    try {
      localStorage.setItem(PENDING_TARGET_KEY, encoded);
      sessionStorage.setItem(PENDING_TARGET_KEY, encoded);
    } catch (error) {}
  }

  function speak(message) {
    if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") return false;
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(message);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window && typeof window.speechSynthesis.cancel === "function") window.speechSynthesis.cancel();
  }

  function setPrinterContext(publisherKey) {
    const link = document.querySelector("[data-printer-explore]");
    const title = document.querySelector("[data-printer-explore-title]");
    const note = document.querySelector("[data-printer-explore-note]");
    if (!link || !title || !note) return;
    const publisher = publishers[publisherKey];
    if (!publisher) {
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.setAttribute("aria-disabled", "true");
      title.textContent = "Printer relationship not established";
      note.textContent = "SCZN3 will not guess who printed this target.";
      return;
    }
    link.href = publisher.catalogUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.removeAttribute("aria-disabled");
    title.innerHTML = `Explore More from ${escapeHtml(publisher.name)} <span aria-hidden="true">→</span>`;
    note.textContent = "Publisher catalog. Supported Smart Target experiences vary.";
  }

  function setDoorAction(button, open) {
    const label = button.querySelector("[data-door-action-label]");
    const arrow = button.querySelector("[data-door-action-arrow]");
    if (label) label.textContent = open ? "CLOSE" : "SEE TARGETS";
    if (arrow) arrow.textContent = open ? "↑" : "↓";
    button.classList.toggle("is-open", open);
    button.closest(".ecosystem-door-card")?.classList.toggle("is-open", open);
  }

  function installDoorBehavior(container) {
    const doorButtons = Array.from(container.querySelectorAll("[data-door-id]"));
    const guidedEntries = Array.from(document.querySelectorAll("[data-guided-entry]"));
    const talkStatus = document.querySelector("[data-talk-status]");
    let talkEnabled = false;

    function setTalk(enabled, announce = true, shouldScroll = enabled) {
      talkEnabled = enabled;
      document.body.classList.toggle("ecosystem-talk-enabled", enabled);
      try { sessionStorage.setItem(TALK_PREFERENCE_KEY, enabled ? "enabled" : "disabled"); } catch (error) {}
      if (talkStatus) {
        talkStatus.textContent = enabled
          ? "Guidance is on. Tap-n-Score will walk you through the experience this target authorizes."
          : "";
      }
      if (enabled && shouldScroll) document.querySelector("#targetExperiences")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (announce) speak(talkStatus?.textContent || "");
    }

    guidedEntries.forEach(entry => {
      entry.addEventListener("click", event => {
        if (entry.dataset.guidedEntry === "photo" && event.target?.matches?.("input")) return;
        setTalk(true, true, entry.dataset.guidedEntry === "choose");
      });
    });

    doorButtons.forEach(button => {
      button.addEventListener("click", () => {
        const willOpen = button.getAttribute("aria-expanded") !== "true";
        doorButtons.forEach(other => {
          const panel = document.getElementById(other.getAttribute("aria-controls"));
          other.setAttribute("aria-expanded", "false");
          setDoorAction(other, false);
          if (panel) panel.hidden = true;
        });
        const panel = document.getElementById(button.getAttribute("aria-controls"));
        button.setAttribute("aria-expanded", String(willOpen));
        setDoorAction(button, willOpen);
        if (panel) panel.hidden = !willOpen;
        if (willOpen) {
          const door = doors.find(item => item.id === button.dataset.doorId);
          const representative = experiences[door?.representativeKey];
          setPrinterContext(representative?.publisherKey);
          button.closest("[data-door-item]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          if (talkEnabled) {
            const message = `${door.title}. ${door.description} Choose one of the available targets.`;
            if (talkStatus) talkStatus.textContent = message;
            speak(message);
          }
        } else {
          stopSpeaking();
          if (talkStatus && talkEnabled) talkStatus.textContent = "Guidance is on. Choose another activity when you're ready.";
        }
      });
    });

    container.querySelectorAll("[data-target-id]").forEach(card => {
      card.addEventListener("click", () => preservePendingTarget(card.dataset.targetId));
      card.addEventListener("mouseenter", () => setPrinterContext(card.dataset.publisherKey));
      card.addEventListener("focusin", () => setPrinterContext(card.dataset.publisherKey));
    });
  }

  function installPhotoEntry() {
    const trigger = document.querySelector('[data-guided-entry="photo"]');
    const picker = document.getElementById("landingPhotoPicker");
    const inputs = [document.getElementById("landingCameraInput"), document.getElementById("landingPhotoInput")].filter(Boolean);
    const status = document.getElementById("landingPhotoStatus");
    trigger?.addEventListener("click", () => {
      const open = trigger.getAttribute("aria-expanded") !== "true";
      trigger.setAttribute("aria-expanded", String(open));
      if (picker) picker.hidden = !open;
      if (open) picker?.querySelector("label")?.focus();
    });
    inputs.forEach(input => input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!status) return;
      status.textContent = file
        ? `Photo selected: ${file.name}. We'll identify the target before showing what's available.`
        : "No photo selected.";
      if (file) speak("Target photo selected. Tap-n-Score will identify the target before showing the governed experience available.");
      trigger?.setAttribute("aria-expanded", "false");
      if (picker) picker.hidden = true;
      input.value = "";
    }));
  }

  function render() {
    document.querySelectorAll("[data-target-experiences]").forEach(container => {
      container.innerHTML = doors.map(doorMarkup).join("");
      installDoorBehavior(container);
    });
    installPhotoEntry();
  }

  window.SCZN3TargetExperiences = Object.freeze({ doors, experiences, render });
  render();
})();
