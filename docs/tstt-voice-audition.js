(function initializeTSTTVoiceAudition() {
  "use strict";

  const auditionSentence = "Your group is two squares high and three squares left. We’ll use the sights to move the group to the center of the target.";
  const speechSettings = Object.freeze({ rate: 0.70, pitch: 1, volume: 1 });
  const region = document.getElementById("voiceRegion");
  const status = document.getElementById("voiceStatus");
  const list = document.getElementById("voiceList");
  let candidates = [];

  function availableCandidates() {
    return window.SCZN3TSTTNarration.availableInstructionalVoices(window.speechSynthesis, { limit: 5 });
  }
  function stopPlayback() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    list.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", "false"));
  }
  function playVoice(index) {
    const voice = candidates[index];
    if (!voice || !("SpeechSynthesisUtterance" in window)) return;
    stopPlayback();
    const button = list.querySelector(`[data-voice-index="${index}"]`);
    const utterance = new SpeechSynthesisUtterance(auditionSentence);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = speechSettings.rate;
    utterance.pitch = speechSettings.pitch;
    utterance.volume = speechSettings.volume;
    button?.setAttribute("aria-pressed", "true");
    utterance.onend = () => button?.setAttribute("aria-pressed", "false");
    utterance.onerror = () => button?.setAttribute("aria-pressed", "false");
    window.speechSynthesis.speak(utterance);
  }
  function renderVoices() {
    const nextCandidates = availableCandidates();
    if (!nextCandidates.length) {
      status.textContent = "NO U.S. ENGLISH VOICES ARE AVAILABLE IN THIS BROWSER.";
      region.setAttribute("aria-busy", "false");
      return false;
    }
    if (candidates.map(voice => voice.name).join("|") === nextCandidates.map(voice => voice.name).join("|")) return true;
    candidates = nextCandidates;
    list.innerHTML = candidates.map((voice, index) => `<article class="voice-sample"><div class="voice-name"><span>VOICE ${index + 1}${/^Samantha(?: |$)/i.test(voice.name) ? " · BASELINE" : ""}</span><b>${voice.name}</b></div><button type="button" data-voice-index="${index}" aria-pressed="false"><span aria-hidden="true">▶</span> PLAY</button></article>`).join("");
    const hasSamantha = candidates.some(voice => /^Samantha(?: |$)/i.test(voice.name));
    status.textContent = `${candidates.length} DEVICE VOICE${candidates.length === 1 ? "" : "S"} READY${hasSamantha ? " · SAMANTHA BASELINE INCLUDED" : " · SAMANTHA IS NOT AVAILABLE ON THIS DEVICE"}`;
    region.setAttribute("aria-busy", "false");
    return true;
  }

  list.addEventListener("click", event => {
    const button = event.target.closest("[data-voice-index]");
    if (button) playVoice(Number(button.dataset.voiceIndex));
  });
  if ("speechSynthesis" in window && typeof window.speechSynthesis.addEventListener === "function") window.speechSynthesis.addEventListener("voiceschanged", renderVoices);
  if (!renderVoices()) {
    window.setTimeout(renderVoices, 250);
    window.setTimeout(renderVoices, 1000);
  }
})();
