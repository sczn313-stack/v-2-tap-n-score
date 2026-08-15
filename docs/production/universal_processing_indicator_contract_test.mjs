import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const component = read("../experience_frame_processing.js");
const componentCss = read("../experience_frame_processing.css");
const bakerTarget = read("../t/baker/sl-st1/target-page.js");
const shoot = read("../shoot.html");
const sec = read("../sec.html");
const vault = read("../records.html");
const buildSite = read("./build-site.mjs");
const buildNetlify = read("./build-netlify.mjs");

assert.match(component, /Still working\. Your evidence is safe\./);
assert.match(component, /aria-live/);
assert.match(component, /event\.persisted/);
assert.match(componentCss, /prefers-reduced-motion/);
assert.match(componentCss, /--sczn3-processing-blue:\s*#2367e8/, "shared processing motion must use the governed blue activity color");
assert.match(componentCss, /\[data-sczn3-processing="true"\][\s\S]*?opacity:\s*1\s*!important/, "active processing must remain fully visible when its host control is disabled");
assert.doesNotMatch(componentCss, /background:\s*currentColor/, "processing motion cannot inherit inconsistent host-control colors");

for (const copy of [
  "Preparing your target photo…",
  "Analyzing your target and calculating your score…",
  "Opening your Shooter Experience Card…",
  "Preserving your Shooter Experience Card…"
]) assert.ok(bakerTarget.includes(copy), `Baker workflow must use shared processing copy: ${copy}`);

assert.ok(shoot.includes("Calculating your correction…"));
assert.ok(shoot.includes("Calculating your score…"));
assert.ok(shoot.includes("Preserving your Shooter Experience Card…"));
assert.ok(sec.includes("Preserving your Shooter Experience Card…"));
assert.ok(vault.includes("Opening your Ballistic Vault…"));
assert.ok(vault.includes("Opening your preserved Shooter Experience Card…"));

for (const page of [shoot, sec, vault]) {
  assert.ok(page.includes("experience_frame_processing.js"), "governed page must load the shared Experience Frame component");
}
for (const build of [buildSite, buildNetlify]) {
  assert.ok(build.includes('"experience_frame_processing.js"'));
  assert.ok(build.includes('"experience_frame_processing.css"'));
}

console.log("PASS Universal Processing Indicator Version 1 integration contract");
