(function () {
  "use strict";

  const experiences = Object.freeze([
    {
      id: "m4-25-meter-zero",
      name: "M4 Carbine — 25 Meter Zero",
      description: "Experience military zeroing with authoritative digital analysis.",
      status: "available",
      thumbnail: "assets/M4_TARGET_AUTHORITY_v1_ORIGINAL.png",
      thumbnailAlt: "M4 25 Meter Zeroing Target",
      href: "?v=baker&sku=ST-M16A2%2FM4"
    },
    {
      id: "baker-100-yard-bullseye",
      name: "100 Yard Bullseye",
      description: "Zero your optics, scoped or iron sights, with digital corrections.",
      status: "available",
      thumbnail: "assets/BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png",
      thumbnailAlt: "Baker 100 Yard Bullseye Smart Target",
      href: "matrix.html?target_profile_id=baker_st_100yd_smart_zero&mission_family=zeroingCorrection&targetName=Baker%20100%20Yard%20Smart%20Target"
    },
    {
      id: "gssf-practice-target",
      name: "GSSF Practice Target",
      description: "Practice scoring your Glock shooting with preserved evidence.",
      status: "available",
      thumbnail: "assets/gssf_ac_1_clean_reference.png",
      thumbnailAlt: "GSSF practice silhouette target",
      href: "matrix.html?target_profile_id=gssf_ac_1&mission_family=gssf&targetName=GSSF%20AC-1",
      attributes: {
        "data-target-profile-id": "gssf_ac_1",
        "data-mission-family": "gssf",
        "data-target-name": "GSSF AC-1"
      }
    },
    {
      id: "dot-torture",
      name: "Dot Torture",
      description: "Improve your shooting one target at a time.",
      status: "coming-soon",
      thumbnail: "assets/landing-package-range-card-3.png",
      thumbnailAlt: "Dot training target preview"
    },
    {
      id: "uspsa-practice-target",
      name: "USPSA Practice Target",
      description: "Practice scoring your USPSA shooting.",
      status: "coming-soon",
      thumbnail: "assets/landing-package-range-card-2.png",
      thumbnailAlt: "USPSA practice target preview"
    },
    {
      id: "idpa-practice-target",
      name: "IDPA Practice Target",
      description: "Practice scoring your IDPA shooting.",
      status: "coming-soon",
      thumbnail: "assets/landing-package-range-card-4.png",
      thumbnailAlt: "IDPA practice target preview"
    },
    {
      id: "bowling-pins",
      name: "Bowling Pins",
      description: "Classic target fun with digital scoring.",
      status: "coming-soon",
      preview: "pins",
      thumbnailAlt: "Bowling pin target preview"
    },
    {
      id: "billiard-balls",
      name: "Billiard Balls",
      description: "Bring the whole family together for a fun day at the range.",
      status: "coming-soon",
      preview: "billiards",
      thumbnailAlt: "Billiard ball target preview"
    },
    {
      id: "dart-board",
      name: "Dart Board",
      description: "See who becomes the range dart champion.",
      status: "coming-soon",
      preview: "dart",
      thumbnailAlt: "Dart board target preview"
    },
    {
      id: "st-001-universal-bullseye",
      name: "ST-001 Universal Bullseye",
      description: "Turn almost any bullseye target into a Digital Target Experience.",
      status: "coming-soon",
      preview: "bullseye",
      thumbnailAlt: "Universal bullseye target preview"
    }
  ]);

  const escapeHtml = value => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  function previewMarkup(experience) {
    if (experience.thumbnail) {
      return `<img src="${escapeHtml(experience.thumbnail)}" alt="${escapeHtml(experience.thumbnailAlt)}" loading="lazy" />`;
    }
    return `<span class="ecosystem-generated-preview ecosystem-generated-preview--${escapeHtml(experience.preview)}" role="img" aria-label="${escapeHtml(experience.thumbnailAlt)}"><i></i><i></i><i></i><i></i><i></i></span>`;
  }

  function actionMarkup(experience) {
    if (experience.status !== "available") {
      return `<span class="ecosystem-card-action ecosystem-card-action--soon">Coming Soon</span>`;
    }
    const attributes = Object.entries(experience.attributes || {})
      .map(([name, value]) => `${escapeHtml(name)}="${escapeHtml(value)}"`)
      .join(" ");
    return `<a class="ecosystem-card-action ecosystem-card-action--launch" href="${escapeHtml(experience.href)}" ${attributes} aria-label="Launch ${escapeHtml(experience.name)}">Launch <span aria-hidden="true">→</span></a>`;
  }

  function cardMarkup(experience) {
    const available = experience.status === "available";
    return `
      <article class="ecosystem-target-card" data-experience-id="${escapeHtml(experience.id)}" data-status="${escapeHtml(experience.status)}">
        <div class="ecosystem-target-thumbnail">${previewMarkup(experience)}</div>
        <div class="ecosystem-target-copy">
          <h3><span class="ecosystem-status-dot" aria-hidden="true"></span>${escapeHtml(experience.name)}</h3>
          <span class="ecosystem-status-label">${available ? "Available now" : "Coming soon"}</span>
          <p>${escapeHtml(experience.description)}</p>
        </div>
        ${actionMarkup(experience)}
      </article>`;
  }

  function render() {
    document.querySelectorAll("[data-target-experiences]").forEach(container => {
      container.innerHTML = experiences.map(cardMarkup).join("");
    });
  }

  window.SCZN3TargetExperiences = Object.freeze({ experiences, render });
  render();
})();
