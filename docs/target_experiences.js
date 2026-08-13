(function () {
  "use strict";

  const experiences = Object.freeze([
    {
      id: "m4-25-meter-zero",
      name: "M4 Carbine — 25 Meter Zero",
      description: "Experience military zeroing with authoritative digital analysis.",
      status: "available",
      thumbnail: "assets/M4_M16_SERIES_WEAPONS_25M_ZERO_FOUNDER_PHOTO.jpeg",
      thumbnailAlt: "Photographed M4/M16 Series Weapons 25M Zero target",
      targetId: "m4_25m_zero",
      href: "matrix.html?target_profile_id=m4_25m_zero&targetName=M4%2FM16%20Series%20Weapons%2025M%20Zero"
    },
    {
      id: "baker-100-yard-bullseye",
      name: "100 Yard Bullseye",
      description: "Zero your optics, scoped or iron sights, with digital corrections.",
      status: "available",
      thumbnail: "assets/BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png",
      thumbnailAlt: "Baker 100 Yard Bullseye Smart Target",
      targetId: "baker_st_100yd_smart_zero",
      href: "matrix.html?target_profile_id=baker_st_100yd_smart_zero&targetName=Baker%20100%20Yard%20Smart%20Target"
    },
    {
      id: "gssf-practice-target",
      name: "GSSF Practice Target",
      description: "Practice scoring your Glock shooting with preserved evidence.",
      status: "available",
      thumbnail: "assets/gssf_ac_1_clean_reference.png",
      thumbnailAlt: "GSSF practice silhouette target",
      targetId: "gssf_ac_1",
      href: "matrix.html?target_profile_id=gssf_ac_1&targetName=GSSF%20AC-1",
      attributes: {
        "data-target-profile-id": "gssf_ac_1",
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
      status: "available",
      thumbnail: "assets/landing-package-range-card-2.png",
      thumbnailAlt: "USPSA practice target preview",
      targetId: "BAKER_SL_ST1",
      href: "t/baker/sl-st1/"
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

  const PENDING_TARGET_KEY = "SCZN3_PENDING_TARGET_PROFILE";
  const CATALOG_VIEW_KEY = "SCZN3_TARGET_CATALOG_VIEW_COUNT_V1";

  function actionMarkup(experience) {
    if (experience.status !== "available") {
      return `<span class="ecosystem-card-action ecosystem-card-action--soon">Coming Soon</span>`;
    }
    return `<span class="ecosystem-card-action ecosystem-card-action--launch"><span aria-hidden="true">●</span> Tap to Begin</span>`;
  }

  function cardMarkup(experience, availableIndex) {
    const available = experience.status === "available";
    const tag = available ? "a" : "article";
    const attributes = Object.entries(experience.attributes || {})
      .map(([name, value]) => `${escapeHtml(name)}="${escapeHtml(value)}"`)
      .join(" ");
    const navigation = available
      ? `href="${escapeHtml(experience.href)}" aria-label="Tap to begin ${escapeHtml(experience.name)}" data-target-id="${escapeHtml(experience.targetId)}" ${attributes}`
      : `aria-label="${escapeHtml(experience.name)}, coming soon"`;
    const discoveryOrder = available ? `style="--discovery-order:${availableIndex}"` : "";
    return `
      <${tag} class="ecosystem-target-card" data-experience-id="${escapeHtml(experience.id)}" data-status="${escapeHtml(experience.status)}" ${navigation} ${discoveryOrder}>
        <div class="ecosystem-target-thumbnail">${previewMarkup(experience)}</div>
        <div class="ecosystem-target-copy">
          <h3><span class="ecosystem-status-dot" aria-hidden="true"></span>${escapeHtml(experience.name)}</h3>
          <span class="ecosystem-status-label">${available ? "Available now" : "Coming soon"}</span>
          <p>${escapeHtml(experience.description)}</p>
        </div>
        ${actionMarkup(experience)}
      </${tag}>`;
  }

  function readCatalogViewCount() {
    try {
      const value = Number.parseInt(localStorage.getItem(CATALOG_VIEW_KEY) || "0", 10);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch (error) {
      return 0;
    }
  }

  function recordCatalogView() {
    const count = readCatalogViewCount();
    try {
      localStorage.setItem(CATALOG_VIEW_KEY, String(count + 1));
    } catch (error) {}
    return count < 3;
  }

  function preservePendingTarget(targetId) {
    if (!targetId) return;
    const encoded = JSON.stringify({ targetId });
    try {
      localStorage.setItem(PENDING_TARGET_KEY, encoded);
      sessionStorage.setItem(PENDING_TARGET_KEY, encoded);
    } catch (error) {}
  }

  function installCardBehavior(container, showDiscoveryCue) {
    const availableCards = Array.from(container.querySelectorAll('.ecosystem-target-card[data-status="available"]'));
    availableCards.forEach(card => {
      if (showDiscoveryCue) card.classList.add("is-discovery-cued");
      card.addEventListener("click", () => {
        availableCards.forEach(item => item.classList.remove("is-discovery-cued"));
        preservePendingTarget(card.dataset.targetId);
      });
    });
    if (showDiscoveryCue) {
      window.setTimeout(() => availableCards.forEach(card => card.classList.remove("is-discovery-cued")), 2600);
    }
  }

  function render() {
    const showDiscoveryCue = recordCatalogView();
    document.querySelectorAll("[data-target-experiences]").forEach(container => {
      let availableIndex = 0;
      container.innerHTML = experiences.map(experience => {
        const index = experience.status === "available" ? availableIndex++ : -1;
        return cardMarkup(experience, index);
      }).join("");
      installCardBehavior(container, showDiscoveryCue);
    });
  }

  window.SCZN3TargetExperiences = Object.freeze({ experiences, render });
  render();
})();
