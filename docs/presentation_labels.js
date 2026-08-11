(function () {
  "use strict";

  const TARGET_LABELS = Object.freeze({
    gssf_ac_1: "GSSF AC-1"
  });

  function targetLabel(targetProfileId, fallback = "Target") {
    const governedId = String(targetProfileId || "").trim().toLowerCase();
    return TARGET_LABELS[governedId] || fallback;
  }

  function cleanText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function capabilityAvailable(capabilities, name) {
    return !!(capabilities && capabilities[name] && capabilities[name].status === "available");
  }

  function readableList(items) {
    const values = items.filter(Boolean);
    if (values.length < 2) return values[0] || "";
    if (values.length === 2) return `${values[0]} and ${values[1]}`;
    return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
  }

  function missionKind(targetProfileId, missionFamily = "") {
    const profile = cleanText(targetProfileId).toLowerCase();
    const family = cleanText(missionFamily).toLowerCase();
    if (profile === "gssf_ac_1" || family === "gssf") return "gssf";
    if (profile === "m4_25m_zero") return "m4";
    if (profile === "baker_st_100yd_smart_zero") return "100-yard";
    if (family.includes("zeroing")) return "zeroing";
    return "practice";
  }

  function equipmentGuidance(options = {}) {
    const assessment = options.assessment || {};
    const capabilities = assessment.capabilities || {};
    const kind = missionKind(options.targetProfileId, options.missionFamily);
    const setupName = cleanText(options.setupName, "this equipment");
    const nextAction = cleanText(options.nextAction, "Go To Target");
    const services = [
      capabilityAvailable(capabilities, "evidence") ? "save your target evidence" : "",
      capabilityAvailable(capabilities, "measurement") ? (kind === "gssf" ? "measure your confirmed impacts" : "measure your group") : "",
      capabilityAvailable(capabilities, "correction") ? "provide Sight Correction" : "",
      capabilityAvailable(capabilities, "officialScore") ? "calculate your Official GSSF Score" : ""
    ].filter(Boolean);
    const opening = `You can use this Smart Target with ${setupName}.`;
    const help = services.length ? `SCZN3 will ${readableList(services)}.` : "SCZN3 will preserve the session information that is available.";
    if (kind === "gssf" && !capabilityAvailable(capabilities, "officialScore")) {
      return `${opening} ${help} Select pistol equipment to receive an Official GSSF Score, or tap ${nextAction} to continue with the available features.`;
    }
    if (["m4", "100-yard", "zeroing"].includes(kind) && !capabilityAvailable(capabilities, "correction")) {
      const action = options.sightClickDataMissing === true
        ? "Enter your sight click data in Equipment to receive Sight Correction."
        : "Review your sight setup in Equipment to receive Sight Correction.";
      return `${opening} ${help} ${action}`;
    }
    return `${opening} ${help} Ready to shoot. Tap ${nextAction}.`;
  }

  function capabilityGuidance(options = {}) {
    const kind = missionKind(options.targetProfileId, options.missionFamily);
    if (kind === "gssf") {
      return "You can keep this target evidence. SCZN3 can measure the confirmed impacts. Select pistol equipment in Equipment to receive an Official GSSF Score.";
    }
    const action = options.sightClickDataMissing === true
      ? "Enter your sight click data in Equipment to receive Sight Correction."
      : "Review your sight setup in Equipment to receive Sight Correction.";
    return `Your target evidence and group measurement are ready. SCZN3 cannot provide Sight Correction with the current setup. ${action}`;
  }

  function sightCorrectionGuidance(options = {}) {
    if (options.integrityStatus === "mismatch") {
      return "Your target and group measurement are saved. SCZN3 could not verify the correction. Return to Target and tap Show Results again.";
    }
    return "Your target and group measurement are saved. SCZN3 cannot provide Sight Correction with the current setup. Review your sight setup in Equipment to receive Sight Correction.";
  }

  function blockedTargetGuidance(targetName = "This Smart Target") {
    const label = cleanText(targetName, "This Smart Target");
    return `You can choose another available Smart Target. SCZN3 cannot analyze ${label} yet. Return Home to continue.`;
  }

  function targetEntryGuidance(targetName = "This Smart Target") {
    const label = cleanText(targetName, "This Smart Target");
    return `${label} is available. SCZN3 could not open it from this link. Return Home, then tap ${label} to try again.`;
  }

  function confirmationUnavailableGuidance() {
    return "Your confirmation group is saved. SCZN3 cannot confirm this zero yet. No additional action is required.";
  }

  function applyTargetLabels(root = document) {
    root.querySelectorAll("[data-sczn3-target-label]").forEach(element => {
      const targetProfileId = element.getAttribute("data-sczn3-target-label");
      const fallback = element.getAttribute("data-sczn3-target-fallback") || element.textContent || "Target";
      element.textContent = targetLabel(targetProfileId, fallback);
    });
  }

  window.SCZN3Presentation = Object.freeze({
    targetLabel,
    applyTargetLabels,
    equipmentGuidance,
    capabilityGuidance,
    sightCorrectionGuidance,
    blockedTargetGuidance,
    targetEntryGuidance,
    confirmationUnavailableGuidance
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => applyTargetLabels(), { once: true });
  } else {
    applyTargetLabels();
  }
})();
