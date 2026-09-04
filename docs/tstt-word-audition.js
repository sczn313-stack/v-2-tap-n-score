(function initializeTSTTWordAudition() {
  "use strict";

  const samples = Object.freeze({
    A: "Your group is two squares high and three squares left.",
    B: "Your shots are landing two squares high and three squares left.",
    C: "Your shot pattern is two squares high and three squares left.",
    D: "Your cluster is two squares high and three squares left."
  });
  const status = document.getElementById("voiceStatus");
  const region = document.getElementById("voiceRegion");
  const buttons = [...document.querySelectorAll("[data-sample]")];

  const narrator = window.SCZN3TSTTNarration.createNarrator({
    onVoiceStatus: ({ status: voiceStatus, identifier }) => {
      const ready = voiceStatus === "selected";
      status.textContent = ready ? `READY · ${identifier}` : (voiceStatus === "checking" ? "CHECKING THIS DEVICE FOR SAMANTHA…" : "SAMANTHA IS NOT AVAILABLE ON THIS DEVICE");
      buttons.forEach(button => { button.disabled = !ready; });
      region.setAttribute("aria-busy", "false");
    }
  });

  buttons.forEach(button => button.addEventListener("click", () => {
    const text = samples[button.dataset.sample];
    if (!text) return;
    buttons.forEach(candidate => candidate.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    narrator.play([Object.freeze({ text, delivery: "normal" })]);
  }));
})();
