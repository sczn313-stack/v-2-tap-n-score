import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, source, narration, server] = await Promise.all([
  readFile("tstt-word-audition.html", "utf8"),
  readFile("tstt-word-audition.js", "utf8"),
  readFile("tstt_narration.js", "utf8"),
  readFile("production/m16a2_tstt_review_server.mjs", "utf8")
]);

const samples = [
  ["A · GROUP", "Your group is two squares high and three squares left."],
  ["B · SHOTS", "Your shots are landing two squares high and three squares left."],
  ["C · SHOT PATTERN", "Your shot pattern is two squares high and three squares left."],
  ["D · CLUSTER", "Your cluster is two squares high and three squares left."]
];
for (const [label, sentence] of samples) {
  assert.ok(html.includes(label), `${label} is visible`);
  assert.ok(html.includes(`“${sentence}”`), `${label} displays its exact sentence`);
  assert.ok(source.includes(sentence), `${label} speaks its exact sentence`);
}
assert.match(source, /SCZN3TSTTNarration\.createNarrator/, "all samples share the locked production Samantha narrator");
assert.match(source, /narrator\.play\(\[Object\.freeze\(\{ text, delivery: "normal" \}\)\]\)/, "all samples share one-sentence production construction");
assert.match(narration, /DEFAULT_SETTINGS = Object\.freeze\(\{ rate: 0\.70, pitch: 1, volume: 1 \}\)/, "the shared narrator locks identical delivery settings");
assert.match(server, /tstt-word-audition\.html/, "the LAN server exposes the word audition");

console.log("PASS Episode 60 TSTT word audition contract");
