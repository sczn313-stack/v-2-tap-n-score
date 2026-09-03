import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, css, source, buildSite, buildNetlify] = await Promise.all([
  readFile("m16a2-tstt.html", "utf8"),
  readFile("m16a2-tstt.css", "utf8"),
  readFile("m16a2-tstt.js", "utf8"),
  readFile("production/build-site.mjs", "utf8"),
  readFile("production/build-netlify.mjs", "utf8")
]);

assert.match(html, /Baker M16A2 25 Meter TSTT/, "the route identifies the exact lesson product");
assert.match(html, /PAUSE[\s\S]*STOP[\s\S]*REPLAY[\s\S]*CHAPTERS[\s\S]*RESTART/, "Snapshot 22 controls plus distinct Stop are present");
assert.doesNotMatch(`${html}\n${source}`, /10\s*(?:SEC|SECOND)|rewind/i, "the TSTT does not restore the retired 10-second rewind");
assert.match(html, /25 METERS ZEROING TARGET[\s\S]*M16A2/, "the physical target identity is reproduced exactly");
assert.doesNotMatch(`${html}\n${source}`, /BAKER M16A2 • 25 METER|M16A2 FACE|APPLICABLE BRANCH|BRANCH NOT AUTHORIZED|Match the target, then confirm/, "registry and architecture language stays off the teaching surface");
assert.match(source, /SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID[\s\S]*SCZN3_SAVED_EQUIPMENT_PROFILES/, "TSTT reads the existing Equipment Library owner state");
assert.doesNotMatch(source, /setItem\(|removeItem\(/, "TSTT never creates or mutates equipment state");
assert.match(source, /focus[\s\S]*pageshow[\s\S]*storage/, "TSTT rereads active equipment when the shooter returns");
assert.match(source, /YOUR ZEROING SETUP[\s\S]*M16A2 RIFLE[\s\S]*STANDARD IRON SIGHTS[\s\S]*25 METERS ZEROING TARGET — M16A2[\s\S]*THIS SETUP WORKS TOGETHER/, "Chapter 1 combines compatibility and teaching");
assert.match(source, /YOU ARE HERE/, "direct navigation marks the current chapter");
assert.match(html, /PROFICIENCY[\s\S]*☆☆☆[\s\S]*shooting results—not chapter progress/, "proficiency remains separate from course progress");
assert.match(source, /renderProgress[\s\S]*is-current/, "course advancement uses chapter segments");
assert.match(source, /Set 300\. Then go one click past/, "rear-drum preparation is a complete learning task");
assert.match(source, /FRONT SIGHT POST[\s\S]*1\.25 MOA \/ CLICK/, "front-post elevation authority is taught");
assert.match(source, /REAR WINDAGE KNOB[\s\S]*0\.5 MOA \/ CLICK/, "rear-windage authority is taught");
assert.match(source, /CLOCKWISE[\s\S]*COUNTERCLOCKWISE/, "rotation language is explicit");
assert.match(source, /VIEW FROM ABOVE[\s\S]*FACE THE RIGHT-SIDE KNOB/, "observer view is explicit for both controls");
assert.match(source, /READY TO FIRE[\s\S]*YOUR FIRST GROUP/, "the experience reaches the exact pre-fire readiness stop");
assert.doesNotMatch(source, /ADD PHOTO|Precision Tap|showResults|groupCenter|\bSEC\b|\bVault\b/i, "the class does not enter the live governed road");
assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|\/api\//, "the pre-fire lesson does not call execution authority");
assert.match(css, /100svh/, "the shell is sized for a phone viewport");
assert.match(css, /safe-area-inset-bottom/, "phone safe areas protect the fixed controls");
assert.match(css, /repeat\(5, 1fr\)/, "five course chapters render as five progress/control segments");
for (const build of [buildSite, buildNetlify]) {
  assert.match(build, /"m16a2-tstt\.html"/, "the route is included in the build inventory");
  assert.match(build, /"m16a2-tstt\.css"/, "the stylesheet is included in the build inventory");
  assert.match(build, /"m16a2-tstt\.js"/, "the lesson runtime is included in the build inventory");
  assert.match(build, /FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02\.png/, "the preserved target evidence is included in the build inventory");
}

console.log("PASS Episode 60 Baker M16A2 pre-fire TSTT contract");
