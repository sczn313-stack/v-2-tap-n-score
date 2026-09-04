import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, source, productionSource, server] = await Promise.all([
  readFile("tstt-samantha-ab.html", "utf8"),
  readFile("tstt-samantha-ab.js", "utf8"),
  readFile("tstt_narration.js", "utf8"),
  readFile("production/m16a2_tstt_review_server.mjs", "utf8")
]);

const sentence = "Your group is two squares high and three squares left. We’ll use the sights to move the group to the center of the target.";
assert.ok(html.includes(`“${sentence}”`), "the exact approved sentence is visible");
assert.ok(source.includes(`const auditionSentence = "${sentence}";`), "both paths share one exact sentence constant");
assert.match(html, /A · ORIGINAL APPROVED SAMANTHA[\s\S]*B · CURRENT PRODUCTION PATH/, "the review order is explicit");
assert.match(source, /const key = `\$\{voice\.name\}\|\$\{voice\.lang\}`/, "A preserves the approved name-and-language deduplication");
assert.match(source, /new SpeechSynthesisUtterance\(auditionSentence\)[\s\S]*utterance\.voice = originalVoice[\s\S]*utterance\.rate = speechSettings\.rate/, "A preserves direct approved audition playback");
assert.match(source, /SCZN3TSTTNarration\.createNarrator[\s\S]*narrator\.play\(\[Object\.freeze\(\{ text: auditionSentence, delivery: "normal" \}\)\]\)/, "B uses the current production narrator");
assert.match(source, /rate: 0\.70, pitch: 1, volume: 1/, "A uses the approved delivery settings");
assert.match(productionSource, /DEFAULT_SETTINGS = Object\.freeze\(\{ rate: 0\.70, pitch: 1, volume: 1 \}\)/, "B uses identical base delivery settings");
assert.match(server, /tstt-samantha-ab\.html/, "the LAN review server exposes the A/B page");

console.log("PASS Episode 60 TSTT Samantha A/B contract");
