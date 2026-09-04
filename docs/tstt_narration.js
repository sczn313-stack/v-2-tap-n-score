(function initializeTSTTNarration(root) {
  "use strict";

  const DEFAULT_SETTINGS = Object.freeze({ rate: 0.70, pitch: 1, volume: 1 });
  const DEFAULT_PAUSES = Object.freeze({ normal: 450, important: 650, action: 900, look: 1100, completion: 650 });
  const DEFAULT_VOICE_PRIORITY = Object.freeze([
    /^Samantha(?: \((?:Enhanced|Premium)\))?$/i,
    /^Reed \(English \(US\)\)$/i,
    /^Flo \(English \(US\)\)$/i,
    /^Alex$/i,
    /^Ava(?: \((?:Enhanced|Premium)\))?$/i,
    /^Susan$/i
  ]);
  const NON_INSTRUCTIONAL_VOICES = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Zarvox/i;

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

  function createNarrator(options = {}) {
    const synthesis = options.synthesis || root.speechSynthesis;
    const Utterance = options.Utterance || root.SpeechSynthesisUtterance;
    const settings = Object.freeze({ ...DEFAULT_SETTINGS, ...(options.settings || {}) });
    const voicePriority = options.voicePriority || DEFAULT_VOICE_PRIORITY;
    let queue = [];
    let cursor = 0;
    let currentUtterance = null;
    let pauseTimer = null;
    let paused = false;
    let waitingBetweenThoughts = false;
    let generation = 0;

    function voiceScore(voice) {
      if (!voice || NON_INSTRUCTIONAL_VOICES.test(voice.name || "")) return -1;
      const language = String(voice.lang || "").replace("_", "-").toLowerCase();
      if (!language.startsWith("en-")) return -1;
      const priorityIndex = voicePriority.findIndex(pattern => pattern.test(voice.name || ""));
      return (language === "en-us" ? 100 : 40)
        + (voice.localService ? 20 : 0)
        + (/(enhanced|premium)/i.test(voice.name || "") ? 12 : 0)
        + (priorityIndex < 0 ? 0 : 80 - priorityIndex * 8)
        + (voice.default ? 2 : 0);
    }

    function selectVoice() {
      if (!synthesis || typeof synthesis.getVoices !== "function") return null;
      return synthesis.getVoices().slice().sort((left, right) => voiceScore(right) - voiceScore(left)).find(voice => voiceScore(voice) >= 0) || null;
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

    function speakNext(token) {
      if (token !== generation || paused || !synthesis || !Utterance || cursor >= queue.length) return;
      const segment = queue[cursor++];
      const utterance = new Utterance(pronounceForInstruction(segment.text));
      const voice = selectVoice();
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; } else { utterance.lang = "en-US"; }
      utterance.rate = deliveryRate(segment.delivery);
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;
      utterance.onend = () => {
        if (token !== generation || currentUtterance !== utterance) return;
        currentUtterance = null;
        if (cursor >= queue.length) return;
        waitingBetweenThoughts = true;
        pauseTimer = root.setTimeout(() => {
          pauseTimer = null;
          waitingBetweenThoughts = false;
          speakNext(token);
        }, pauseAfter(segment));
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
      currentUtterance = null;
      waitingBetweenThoughts = false;
      paused = false;
      if (synthesis && typeof synthesis.cancel === "function") synthesis.cancel();
    }

    function play(plan) {
      cancel();
      queue = (Array.isArray(plan) ? plan : sentencePlan(plan)).map(segment => typeof segment === "string" ? { text: segment, delivery: "normal" } : { delivery: "normal", ...segment }).filter(segment => segment.text);
      speakNext(generation);
    }

    function pause() {
      if (paused) return;
      paused = true;
      if (pauseTimer !== null) {
        clearTimer();
        waitingBetweenThoughts = true;
      } else if (currentUtterance && synthesis && typeof synthesis.pause === "function") {
        synthesis.pause();
      }
    }

    function resume() {
      if (!paused) return;
      paused = false;
      if (currentUtterance && synthesis && typeof synthesis.resume === "function") synthesis.resume();
      else if (waitingBetweenThoughts) {
        waitingBetweenThoughts = false;
        pauseTimer = root.setTimeout(() => { pauseTimer = null; speakNext(generation); }, 200);
      } else speakNext(generation);
    }

    return Object.freeze({ cancel, pause, play, resume, selectVoice, settings });
  }

  root.SCZN3TSTTNarration = Object.freeze({ createNarrator, pronounceForInstruction, sentencePlan, settings: DEFAULT_SETTINGS });
})(window);
