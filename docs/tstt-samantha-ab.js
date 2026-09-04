(function initializeTSTTSamanthaAB() {
  "use strict";

  const auditionSentence = "Your group is two squares high and three squares left. We’ll use the sights to move the group to the center of the target.";
  const speechSettings = Object.freeze({ rate: 0.70, pitch: 1, volume: 1 });
  const samanthaName = /^Samantha(?: \((?:Enhanced|Premium)\))?$/i;

  // Reference specimen: ab0d90a37f24bb2e9540007969410c86d1c39fa3.
  // Keep this resolver byte-for-byte equivalent to the approved five-voice audition.
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

  const status = document.getElementById("voiceStatus");
  const region = document.getElementById("voiceRegion");
  const originalIdentity = document.getElementById("originalVoiceIdentity");
  const productionIdentity = document.getElementById("productionVoiceIdentity");
  const playOriginal = document.getElementById("playOriginal");
  const playProduction = document.getElementById("playProduction");
  let originalVoice = null;
  let productionVoice = null;

  function normalizedLanguage(voice) { return String(voice.lang || "").replace("_", "-").toLowerCase(); }
  function preferenceIndex(voice) {
    const index = preferredNames.findIndex(pattern => pattern.test(voice.name || ""));
    return index < 0 ? preferredNames.length : index;
  }
  function approvedAuditionCandidates() {
    if (!("speechSynthesis" in window) || typeof window.speechSynthesis.getVoices !== "function") return [];
    const seen = new Set();
    return window.speechSynthesis.getVoices()
      .filter(voice => normalizedLanguage(voice) === "en-us" && !nonInstructionalNames.test(voice.name || ""))
      .filter(voice => { const key = `${voice.name}|${voice.lang}`; if (seen.has(key)) return false; seen.add(key); return true; })
      .sort((left, right) => preferenceIndex(left) - preferenceIndex(right) || Number(right.localService) - Number(left.localService) || left.name.localeCompare(right.name))
      .slice(0, 5);
  }
  function identity(voice) {
    return voice ? [voice.name, voice.lang, voice.voiceURI || "DEVICE VOICE"].filter(Boolean).join(" · ") : "SAMANTHA UNAVAILABLE";
  }
  function stopPlayback() {
    narrator.cancel();
    playOriginal.setAttribute("aria-pressed", "false");
    playProduction.setAttribute("aria-pressed", "false");
  }
  function render() {
    originalVoice = approvedAuditionCandidates().find(voice => samanthaName.test(voice.name || "")) || null;
    originalIdentity.textContent = identity(originalVoice);
    productionIdentity.textContent = identity(productionVoice);
    playOriginal.disabled = !originalVoice;
    playProduction.disabled = !productionVoice;
    const ready = Boolean(originalVoice && productionVoice);
    status.textContent = ready ? "A/B READY · LISTEN FOR THE WORD “GROUP”" : "SAMANTHA IS NOT AVAILABLE IN BOTH PATHS ON THIS DEVICE";
    region.setAttribute("aria-busy", "false");
    return ready;
  }

  const narrator = window.SCZN3TSTTNarration.createNarrator({
    onVoiceStatus: ({ voice }) => {
      productionVoice = voice || null;
      render();
    }
  });

  playOriginal.addEventListener("click", () => {
    if (!originalVoice || !("SpeechSynthesisUtterance" in window)) return;
    stopPlayback();
    const utterance = new SpeechSynthesisUtterance(auditionSentence);
    utterance.voice = originalVoice;
    utterance.lang = originalVoice.lang;
    utterance.rate = speechSettings.rate;
    utterance.pitch = speechSettings.pitch;
    utterance.volume = speechSettings.volume;
    playOriginal.setAttribute("aria-pressed", "true");
    utterance.onend = () => playOriginal.setAttribute("aria-pressed", "false");
    utterance.onerror = () => playOriginal.setAttribute("aria-pressed", "false");
    window.speechSynthesis.speak(utterance);
  });
  playProduction.addEventListener("click", () => {
    stopPlayback();
    playProduction.setAttribute("aria-pressed", "true");
    narrator.play([Object.freeze({ text: auditionSentence, delivery: "normal" })]);
  });

  if ("speechSynthesis" in window && typeof window.speechSynthesis.addEventListener === "function") window.speechSynthesis.addEventListener("voiceschanged", render);
  render();
  window.setTimeout(render, 250);
  window.setTimeout(render, 1000);
})();
