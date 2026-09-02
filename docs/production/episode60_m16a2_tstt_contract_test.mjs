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
assert.match(html, /PAUSE[\s\S]*REPLAY[\s\S]*CHAPTERS[\s\S]*RESTART/, "all four Snapshot 22 controls are present");
assert.doesNotMatch(`${html}\n${source}`, /10\s*(?:SEC|SECOND)|rewind/i, "the TSTT does not restore the retired 10-second rewind");
assert.match(source, /STANDARD M16A2 IRON SIGHTS/, "the admitted equipment branch is explicit");
assert.match(source, /DIFFERENT SIGHT OR OPTIC/, "non-applicable equipment is routed to a narrow hold");
assert.match(source, /BRANCH NOT AUTHORIZED/, "unsupported equipment fails closed");
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
for (const build of [buildSite, buildNetlify]) {
  assert.match(build, /"m16a2-tstt\.html"/, "the route is included in the build inventory");
  assert.match(build, /"m16a2-tstt\.css"/, "the stylesheet is included in the build inventory");
  assert.match(build, /"m16a2-tstt\.js"/, "the lesson runtime is included in the build inventory");
  assert.match(build, /FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02\.png/, "the preserved target evidence is included in the build inventory");
}

console.log("PASS Episode 60 Baker M16A2 pre-fire TSTT contract");
