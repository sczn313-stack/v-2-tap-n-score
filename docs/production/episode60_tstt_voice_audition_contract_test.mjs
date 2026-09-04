import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, css, source, narration, productionTSTT] = await Promise.all([
  readFile("tstt-voice-audition.html", "utf8"),
  readFile("tstt-voice-audition.css", "utf8"),
  readFile("tstt-voice-audition.js", "utf8"),
  readFile("tstt_narration.js", "utf8"),
  readFile("m16a2-tstt.js", "utf8")
]);

const sentence = "Your group is two squares high and three squares left. We’ll use the sights to move the group to the center of the target.";
assert.match(html, /TSTT FOUNDER VOICE AUDITION[\s\S]*Listen\. Compare\. Choose\./i);
assert.ok(html.includes(`“${sentence}”`), "the exact audition sentence is visible");
assert.ok(source.includes(`const auditionSentence = "${sentence}";`), "every voice receives the exact visible sentence");
assert.match(source, /rate: 0\.70, pitch: 1, volume: 1/, "all candidates share the approved delivery settings");
assert.match(html, /tstt_narration\.js[\s\S]*tstt-voice-audition\.js/, "the audition loads the shared voice identity mechanism first");
assert.match(source, /availableInstructionalVoices\(window\.speechSynthesis, \{ limit: 5 \}\)/, "the audition uses the shared production candidate resolver");
assert.match(narration, /Samantha[\s\S]*Reed[\s\S]*Flo[\s\S]*Alex[\s\S]*Ava/, "the shared resolver ranks five clear U.S. English candidates with Samantha first");
assert.match(narration, /normalizedLanguage\(voice\) === "en-us"/, "only U.S. English voices are admitted");
assert.match(narration, /NON_INSTRUCTIONAL_VOICES[\s\S]*Albert[\s\S]*Fred[\s\S]*Grandma[\s\S]*Zarvox/, "novelty, character, and legacy voices are excluded");
assert.match(source, /utterance\.voice = voice[\s\S]*utterance\.rate = speechSettings\.rate[\s\S]*utterance\.pitch = speechSettings\.pitch/, "only the candidate voice changes between plays");
assert.match(css, /100svh[\s\S]*safe-area-inset-bottom/, "the audition is phone-first and safe-area aware");
assert.match(productionTSTT, /const auditionSentence = "Your group[\s\S]*runtimeVoiceCheck[\s\S]*narrator\.play/, "production exposes the exact audition sentence through its locked voice path");

console.log("PASS Episode 60 TSTT Founder voice audition contract");
