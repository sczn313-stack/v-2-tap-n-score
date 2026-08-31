import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = name => readFile(new URL(`../${name}`, import.meta.url), "utf8");
const [experiences, home, styles] = await Promise.all([
  read("target_experiences.js"),
  read("index.html"),
  read("landing.css")
]);

assert.match(experiences, /availableTargetIds:\s*Object\.freeze\(\["baker_st_100yd_smart_zero"\]\)/, "Baker 100 Yard is the sole governed available target");
assert.match(experiences, /unidentifiedPhotoEntry:\s*"coming-soon"/, "unidentified photo discovery fails closed");
assert.match(experiences, /const tag = available \? "a" : "article"/, "COMING SOON target cards are not links");
assert.match(experiences, /aria-disabled=\"true\"/, "COMING SOON cards announce their disabled state");
assert.match(experiences, /querySelectorAll\('\[data-status="available"\]\[data-target-id\]'\)/, "only available targets receive launch behavior");
assert.match(home, /data-guided-entry="photo"[^>]*data-status="coming-soon"[^>]*aria-disabled="true"[^>]*disabled/, "generic photo entry cannot bypass governed availability");
assert.doesNotMatch(home, /data-discovery-experience=/, "static navigation exposes no stale target-specific routes before navigation ownership loads");
assert.match(styles, /data-status="coming-soon"/, "COMING SOON has an explicit visual treatment");

console.log("PASS Episode 59 production target availability lock: Baker only; all other target entry routes fail closed");
