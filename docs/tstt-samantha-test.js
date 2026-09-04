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
  const button = document.getElementById("testSamantha");
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
    button.disabled = !samantha;
    region.setAttribute("aria-busy", "false");
  }

  button.addEventListener("click", () => {
    if (!samantha || !("SpeechSynthesisUtterance" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(testSentence);
    utterance.voice = samantha;
    utterance.lang = samantha.lang;
    utterance.rate = speechSettings.rate;
    utterance.pitch = speechSettings.pitch;
    utterance.volume = speechSettings.volume;
    window.speechSynthesis.speak(utterance);
  });

  if ("speechSynthesis" in window && typeof window.speechSynthesis.addEventListener === "function") window.speechSynthesis.addEventListener("voiceschanged", renderVoice);
  renderVoice();
})();
