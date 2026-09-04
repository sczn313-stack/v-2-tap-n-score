(function initializeTSTTSamanthaTest() {
  "use strict";

  const testSentence = "This target is designed to zero your weapon at 25 meters.";
  const speechSettings = Object.freeze({ rate: 0.70, pitch: 1, volume: 1 });
  const samanthaName = /^Samantha(?: \((?:Enhanced|Premium)\))?$/i;

  // Exact approved voice-selection specimen: ab0d90a37f24bb2e9540007969410c86d1c39fa3.
  const preferredNames = Object.freeze([
    /^Samantha(?: \((?:Enhanced|Premium)\))?$/i,
    /^Reed \(English \((?:US|United States)\)\)$/i,
    /^Flo \(English \((?:US|United States)\)\)$/i,
    /^Alex$/i,
    /^Ava(?: \((?:Enhanced|Premium)\))?$/i,
    /^Susan$/i,
    /^Eddy \(English \((?:US|United States)\)\)$/i,
    /^Sandy \(English \((?:US|United States)\)\)$/i,
    /^Shelley \(English \((?:US|United States)\)\)$/i
  ]);
  const nonInstructionalNames = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Fred|Good News|Grandma|Grandpa|Jester|Junior|Kathy|Organ|Ralph|Superstar|Trinoids|Whisper|Zarvox/i;
  const region = document.getElementById("voiceRegion");
  const status = document.getElementById("voiceStatus");
  const identity = document.getElementById("voiceIdentity");
  const buttons = [...document.querySelectorAll("[data-speech-test]")];
  const samanthaButton = document.getElementById("testSamantha");
  const lastSpeechCall = document.getElementById("lastSpeechCall");
  let samantha = null;

  function normalizedLanguage(voice) { return String(voice.lang || "").replace("_", "-").toLowerCase(); }
  function preferenceIndex(voice) {
    const index = preferredNames.findIndex(pattern => pattern.test(voice.name || ""));
    return index < 0 ? preferredNames.length : index;
  }
  function availableCandidates() {
    if (!("speechSynthesis" in window) || typeof window.speechSynthesis.getVoices !== "function") return [];
    const seen = new Set();
    return window.speechSynthesis.getVoices()
      .filter(voice => normalizedLanguage(voice) === "en-us" && !nonInstructionalNames.test(voice.name || ""))
      .filter(voice => { const key = `${voice.name}|${voice.lang}`; if (seen.has(key)) return false; seen.add(key); return true; })
      .sort((left, right) => preferenceIndex(left) - preferenceIndex(right) || Number(right.localService) - Number(left.localService) || left.name.localeCompare(right.name))
      .slice(0, 5);
  }
  function renderVoice() {
    samantha = availableCandidates().find(voice => samanthaName.test(voice.name || "")) || null;
    identity.textContent = samantha ? [samantha.name, samantha.lang, samantha.voiceURI || "DEVICE VOICE"].filter(Boolean).join(" · ") : "SAMANTHA UNAVAILABLE";
    status.textContent = samantha ? "SAMANTHA READY · TAP ONCE" : "SAMANTHA IS NOT AVAILABLE ON THIS DEVICE";
    samanthaButton.disabled = !samantha;
    region.setAttribute("aria-busy", "false");
  }
  function setEvent(channel, eventName, value) {
    const output = document.querySelector(`[data-speech-event="${channel}-${eventName}"]`);
    if (output) output.textContent = value;
  }
  function renderSynthesisFlags() {
    const synthesis = window.speechSynthesis;
    for (const name of ["paused", "pending", "speaking"]) {
      document.querySelector(`[data-synthesis-flag="${name}"]`).textContent = String(Boolean(synthesis?.[name])).toUpperCase();
    }
  }
  function resetEvents(channel) {
    setEvent(channel, "start", "NOT RECEIVED");
    setEvent(channel, "end", "NOT RECEIVED");
    setEvent(channel, "error", "NOT RECEIVED");
    setEvent(channel, "error-value", "—");
  }
  function runSpeechTest(channel) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      lastSpeechCall.textContent = "WEB SPEECH API UNAVAILABLE";
      return;
    }
    if (channel === "samantha" && !samantha) return;
    window.speechSynthesis.cancel();
    buttons.forEach(button => button.setAttribute("aria-pressed", "false"));
    const button = document.querySelector(`[data-speech-test="${channel}"]`);
    const selectedVoice = channel === "samantha" ? samantha : null;
    const utterance = new SpeechSynthesisUtterance(testSentence);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.lang = selectedVoice?.lang || "en-US";
    utterance.rate = speechSettings.rate;
    utterance.pitch = speechSettings.pitch;
    utterance.volume = speechSettings.volume;
    resetEvents(channel);
    button.setAttribute("aria-pressed", "true");
    utterance.onstart = () => {
      setEvent(channel, "start", "RECEIVED");
      renderSynthesisFlags();
    };
    utterance.onend = () => {
      setEvent(channel, "end", "RECEIVED");
      button.setAttribute("aria-pressed", "false");
      renderSynthesisFlags();
    };
    utterance.onerror = event => {
      setEvent(channel, "error", "RECEIVED");
      setEvent(channel, "error-value", String(event.error || "UNSPECIFIED"));
      button.setAttribute("aria-pressed", "false");
      renderSynthesisFlags();
    };
    lastSpeechCall.textContent = `${channel === "samantha" ? "A · SAMANTHA" : "B · DEFAULT"} · speak() CALLED`;
    window.speechSynthesis.speak(utterance);
    renderSynthesisFlags();
  }

  buttons.forEach(button => button.addEventListener("click", () => runSpeechTest(button.dataset.speechTest)));

  if ("speechSynthesis" in window && typeof window.speechSynthesis.addEventListener === "function") window.speechSynthesis.addEventListener("voiceschanged", renderVoice);
  renderVoice();
  renderSynthesisFlags();
})();
