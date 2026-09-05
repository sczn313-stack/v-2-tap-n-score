(function initializeTSTTNarration(root) {
  "use strict";

  const DEFAULT_SETTINGS = Object.freeze({ rate: 0.70, pitch: 1, volume: 1 });
  const DEFAULT_PAUSES = Object.freeze({ normal: 450, important: 650, action: 900, look: 1100, completion: 650 });
  const DEFAULT_VOICE_PRIORITY = Object.freeze([
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
  const NON_INSTRUCTIONAL_VOICES = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Fred|Good News|Grandma|Grandpa|Jester|Junior|Kathy|Organ|Ralph|Superstar|Trinoids|Whisper|Zarvox/i;
  const SAMANTHA_NAME = /^Samantha(?: \((?:Enhanced|Premium)\))?$/i;

  function pronounceForInstruction(text) {
    return String(text)
      .replace(/\bM16A2\b/g, "M sixteen A two")
      .replace(/\bMOA\b/g, "minutes of angle")
      .replace(/\bMRAD\b/g, "milliradians")
      .replace(/\b1\.25\b/g, "one point two five")
      .replace(/\b0\.5\b/g, "zero point five")
      .replace(/\b25-meter\b/gi, "twenty-five-meter")
      .replace(/\b25 meters\b/gi, "twenty-five meters")
      .replace(/\b300-meter\b/gi, "three-hundred-meter")
      .replace(/\b300 meters\b/gi, "three hundred meters")
      .replace(/\b300\b/g, "three hundred");
  }

  function sentencePlan(text) {
    return String(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(sentence => ({ text: sentence.trim(), delivery: "normal" })) || [];
  }

  function normalizedLanguage(voice) { return String(voice?.lang || "").replace("_", "-").toLowerCase(); }
  function preferenceIndex(voice, voicePriority = DEFAULT_VOICE_PRIORITY) {
    const index = voicePriority.findIndex(pattern => pattern.test(voice?.name || ""));
    return index < 0 ? voicePriority.length : index;
  }
  function availableInstructionalVoices(synthesis = root.speechSynthesis, { limit = Infinity, voicePriority = DEFAULT_VOICE_PRIORITY } = {}) {
    if (!synthesis || typeof synthesis.getVoices !== "function") return [];
    const seen = new Set();
    return synthesis.getVoices()
      .filter(voice => normalizedLanguage(voice) === "en-us" && !NON_INSTRUCTIONAL_VOICES.test(voice.name || ""))
      .filter(voice => { const key = `${voice.name}|${voice.lang}|${voice.voiceURI || ""}`; if (seen.has(key)) return false; seen.add(key); return true; })
      .sort((left, right) => preferenceIndex(left, voicePriority) - preferenceIndex(right, voicePriority) || Number(right.localService) - Number(left.localService) || left.name.localeCompare(right.name) || String(left.voiceURI || "").localeCompare(String(right.voiceURI || "")))
      .slice(0, limit);
  }
  function voiceIdentifier(voice) {
    return voice ? [voice.name, voice.lang, voice.voiceURI || "DEVICE VOICE"].filter(Boolean).join(" · ") : "SAMANTHA UNAVAILABLE";
  }

  function createNarrator(options = {}) {
    const synthesis = options.synthesis || root.speechSynthesis;
    const Utterance = options.Utterance || root.SpeechSynthesisUtterance;
    const audioFactory = options.audioFactory || (() => new root.Audio());
    const settings = Object.freeze({ ...DEFAULT_SETTINGS, ...(options.settings || {}) });
    const onVoiceStatus = typeof options.onVoiceStatus === "function" ? options.onVoiceStatus : () => {};
    const onSegmentStart = typeof options.onSegmentStart === "function" ? options.onSegmentStart : () => {};
    const onSegmentEnd = typeof options.onSegmentEnd === "function" ? options.onSegmentEnd : () => {};
    const onComplete = typeof options.onComplete === "function" ? options.onComplete : () => {};
    const onAudioError = typeof options.onAudioError === "function" ? options.onAudioError : () => {};
    let queue = [];
    let cursor = 0;
    let currentUtterance = null;
    let currentAudio = null;
    let currentSegment = null;
    let pauseTimer = null;
    let paused = false;
    let waitingBetweenThoughts = false;
    let generation = 0;
    let selectedVoice = null;
    let availabilityFinal = false;

    function resolveSamantha({ final = availabilityFinal } = {}) {
      selectedVoice = availableInstructionalVoices(synthesis).find(voice => SAMANTHA_NAME.test(voice.name || "")) || null;
      onVoiceStatus(Object.freeze({ status: selectedVoice ? "selected" : (final ? "unavailable" : "checking"), voice: selectedVoice, identifier: voiceIdentifier(selectedVoice) }));
      return selectedVoice;
    }

    function deliveryRate(delivery) {
      if (delivery === "important") return 0.66;
      if (delivery === "action") return 0.68;
      if (delivery === "look") return 0.68;
      return settings.rate;
    }

    function pauseAfter(segment) {
      return Number.isFinite(segment.pauseAfter) ? segment.pauseAfter : (DEFAULT_PAUSES[segment.delivery] || DEFAULT_PAUSES.normal);
    }

    function clearTimer() {
      if (pauseTimer !== null) root.clearTimeout(pauseTimer);
      pauseTimer = null;
    }

    function completePlan(token) {
      if (token !== generation || paused) return;
      currentSegment = null;
      onComplete(Object.freeze({ token, segments: queue.slice() }));
    }

    function finishSegment(segment, token) {
      if (token !== generation || currentSegment !== segment) return;
      currentUtterance = null;
      currentAudio = null;
      currentSegment = null;
      onSegmentEnd(segment);
      if (cursor >= queue.length) {
        completePlan(token);
        return;
      }
      waitingBetweenThoughts = true;
      pauseTimer = root.setTimeout(() => {
        pauseTimer = null;
        waitingBetweenThoughts = false;
        playNext(token);
      }, pauseAfter(segment));
    }

    function playNativeAudio(segment, token) {
      const audio = audioFactory();
      currentAudio = audio;
      audio.preload = "auto";
      audio.src = segment.audio;
      audio.volume = settings.volume;
      audio.onplay = () => {
        if (token === generation && currentAudio === audio) onSegmentStart(segment);
      };
      audio.onended = () => finishSegment(segment, token);
      audio.onerror = event => {
        if (token !== generation || currentAudio !== audio) return;
        currentAudio = null;
        currentSegment = null;
        onAudioError(Object.freeze({ event, segment }));
      };
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(error => {
          if (token !== generation || currentAudio !== audio) return;
          currentAudio = null;
          currentSegment = null;
          onAudioError(Object.freeze({ error, segment }));
        });
      }
    }

    function playNext(token) {
      if (token !== generation || paused) return;
      if (cursor >= queue.length) {
        completePlan(token);
        return;
      }
      const segment = queue[cursor++];
      currentSegment = segment;
      if (segment.audio) {
        playNativeAudio(segment, token);
        return;
      }
      if (!synthesis || !Utterance) return;
      const utterance = new Utterance(pronounceForInstruction(segment.text));
      const voice = selectedVoice || resolveSamantha({ final: true });
      if (!voice) return;
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = deliveryRate(segment.delivery);
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;
      onSegmentStart(segment);
      utterance.onend = () => {
        if (token !== generation || currentUtterance !== utterance) return;
        finishSegment(segment, token);
      };
      utterance.onerror = () => { if (token === generation && currentUtterance === utterance) currentUtterance = null; };
      currentUtterance = utterance;
      synthesis.speak(utterance);
    }

    function cancel() {
      generation += 1;
      clearTimer();
      queue = [];
      cursor = 0;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.onplay = null;
        currentAudio.onended = null;
        currentAudio.onerror = null;
      }
      currentAudio = null;
      currentUtterance = null;
      currentSegment = null;
      waitingBetweenThoughts = false;
      paused = false;
      if (synthesis && typeof synthesis.cancel === "function") synthesis.cancel();
    }

    function play(plan) {
      cancel();
      queue = (Array.isArray(plan) ? plan : sentencePlan(plan)).map(segment => typeof segment === "string" ? { text: segment, delivery: "normal" } : { delivery: "normal", ...segment }).filter(segment => segment.text);
      if (queue.some(segment => !segment.audio) && !resolveSamantha({ final: true })) return;
      playNext(generation);
    }

    function pause() {
      if (paused) return;
      paused = true;
      if (pauseTimer !== null) {
        clearTimer();
        waitingBetweenThoughts = true;
      } else if (currentAudio) {
        currentAudio.pause();
      } else if (currentUtterance && synthesis && typeof synthesis.pause === "function") {
        synthesis.pause();
      }
    }

    function resume() {
      if (!paused) return;
      paused = false;
      if (currentAudio) {
        const playback = currentAudio.play();
        if (playback && typeof playback.catch === "function") playback.catch(error => onAudioError(Object.freeze({ error, segment: currentSegment })));
      }
      else if (currentUtterance && synthesis && typeof synthesis.resume === "function") synthesis.resume();
      else if (waitingBetweenThoughts) {
        waitingBetweenThoughts = false;
        pauseTimer = root.setTimeout(() => { pauseTimer = null; playNext(generation); }, 200);
      } else playNext(generation);
    }

    if (synthesis && typeof synthesis.addEventListener === "function") synthesis.addEventListener("voiceschanged", () => {
      const wasUnavailable = !selectedVoice;
      if (resolveSamantha({ final: true }) && wasUnavailable && queue.some(segment => !segment.audio) && !currentUtterance && !currentAudio && !paused) playNext(generation);
    });
    resolveSamantha();
    root.setTimeout(() => resolveSamantha(), 250);
    root.setTimeout(() => { availabilityFinal = true; resolveSamantha({ final: true }); }, 1000);

    return Object.freeze({ cancel, pause, play, resume, resolveSamantha, settings });
  }

  root.SCZN3TSTTNarration = Object.freeze({ availableInstructionalVoices, createNarrator, pronounceForInstruction, sentencePlan, settings: DEFAULT_SETTINGS, voiceIdentifier });
})(window);
