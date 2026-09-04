import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, css, source, matrix, buildSite, buildNetlify] = await Promise.all([
  readFile("m16a2-tstt.html", "utf8"),
  readFile("m16a2-tstt.css", "utf8"),
  readFile("m16a2-tstt.js", "utf8"),
  readFile("matrix.html", "utf8"),
  readFile("production/build-site.mjs", "utf8"),
  readFile("production/build-netlify.mjs", "utf8")
]);

assert.match(html, /Baker M16A2 25 Meter TSTT/, "the route identifies the exact lesson product");
assert.match(html, /PAUSE[\s\S]*STOP[\s\S]*REPLAY[\s\S]*CHAPTERS[\s\S]*RESTART/, "Snapshot 22 controls plus distinct Stop are present");
assert.doesNotMatch(`${html}\n${source}`, /10\s*(?:SEC|SECOND)|rewind/i, "the TSTT does not restore the retired 10-second rewind");
assert.match(html, /25 METERS ZEROING TARGET[\s\S]*M16A2/, "the physical target identity is reproduced exactly");
assert.doesNotMatch(`${html}\n${source}`, /BAKER M16A2 • 25 METER|M16A2 FACE|APPLICABLE BRANCH|BRANCH NOT AUTHORIZED|Match the target, then confirm/, "registry and architecture language stays off the teaching surface");
assert.match(source, /SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID[\s\S]*SCZN3_SAVED_EQUIPMENT_PROFILES/, "TSTT reads the existing Equipment Library owner state");
assert.doesNotMatch(source, /localStorage\.(?:setItem|removeItem)\(/, "TSTT never creates or mutates equipment state");
assert.match(source, /focus[\s\S]*pageshow[\s\S]*storage/, "TSTT rereads active equipment when the shooter returns");
assert.match(`${html}\n${source}`, /TRAINING SETUP[\s\S]*M16A2 · Standard Iron Sights[\s\S]*This training teaches this setup\. If yours is different, some instructions may not apply\./, "Chapter 1 presents the Founder-approved concise training guidance");
assert.doesNotMatch(`${html}\n${source}`, /CURRENT EQUIPMENT|equipmentIndicator|equipmentStateLabel|equipmentLabel/, "Page 1 does not prominently display the shooter's stored equipment");
assert.doesNotMatch(source, /Learn the target and the M16A2 standard iron-sight setup this training will use\./, "Chapter 1 does not announce that teaching is coming");
assert.match(source, /WHERE TO AIM[\s\S]*WHAT THE GRID MEANS[\s\S]*WHAT ONE SQUARE REPRESENTS[\s\S]*WHAT THE TARGET WILL TELL YOU[\s\S]*WHY WE SHOOT A GROUP/, "Chapter 1 visibly teaches the complete target curriculum");
assert.match(source, /1 square = 1 front-sight click[\s\S]*1 square = 3 rear-windage clicks/, "Chapter 1 reads the exact M16A2 square-to-control scales printed on the governed target");
assert.match(source, /target-marker-aim[\s\S]*target-marker-grid[\s\S]*sample-group/, "the curriculum is demonstrated on the complete physical target");
assert.match(source, /Do not chase (?:a single shot|individual shots)/, "Chapter 1 teaches the group as correction evidence");
assert.match(source, /NEXT → THE SIGHTS/, "Chapter 1 hands directly to the sight lesson");
assert.match(source, /speechSettings = Object\.freeze\(\{ rate: 0\.70, pitch: 1, volume: 1 \}\)/, "voice test 2 slows narration another ten percent while keeping neutral delivery");
assert.ok(source.indexOf("/^Reed") < source.indexOf("/^Samantha"), "voice test 2 prefers Reed before Samantha");
assert.match(source, /Samantha[\s\S]*Flo[\s\S]*Alex[\s\S]*Ava[\s\S]*Susan/, "neutral instructional fallbacks remain available");
assert.match(source, /nonInstructionalVoices[\s\S]*Albert[\s\S]*Zarvox/, "novelty and theatrical system voices cannot become the instructor");
assert.match(source, /pronounceForInstruction[\s\S]*M sixteen A two[\s\S]*minutes of angle[\s\S]*front sight post[\s\S]*rear elevation drum|pronounceForInstruction[\s\S]*M sixteen A two[\s\S]*minutes of angle/, "speech preparation deliberately pronounces core equipment terminology");
assert.match(source, /Temporary twenty-five-meter setup\.[\s\S]*Use the rear elevation drum[\s\S]*Set three hundred\.[\s\S]*Viewed from above[\s\S]*setup control[\s\S]*not the control for moving your group up or down/, "Chapter 2 narration closely tracks its visible instructions");
assert.doesNotMatch(`${html}\n${source}\n${css}`, /equipment-dot|EXACT TRAINING MATCH · CONFIRM GEAR|THIS MATCHES MY GEAR|confirm-equipment|CONFIRM YOUR GEAR|NOT CONFIRMED AS YOUR EQUIPMENT/, "physical-equipment confirmation UI and its orange/gold status dot are removed");
assert.doesNotMatch(`${html}\n${source}`, /confirm (?:this |the )?target|target confirmation/i, "QR-established target identity is never reconfirmed by the shooter");
assert.match(source, /YOU ARE HERE/, "direct navigation marks the current chapter");
assert.match(html, /PROFICIENCY[\s\S]*☆☆☆[\s\S]*shooting results—not chapter progress/, "proficiency remains separate from course progress");
assert.match(source, /renderProgress[\s\S]*is-current/, "course advancement uses chapter segments");
assert.doesNotMatch(`${html}\n${source}`, /KNOW YOUR TARGET|BAKER TARGETS • ST-M16A2R|RETURN AFTER SELECTING YOUR EQUIPMENT/, "Pass #2 removes the three rejected Chapter 1 surfaces");
assert.match(source, /equipmentConfigurationId === "M16A2-STANDARD-IRON-FSP-REAR-DRUM"[\s\S]*adjustmentProfileId === "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"/, "exact training requires the governed equipment configuration and reusable adjustment profile");
assert.match(source, /compatible \? "exact" : "different"/, "equipment authority distinguishes an exact configuration without turning it into entry permission");
assert.match(source, /startTraining\(\)[\s\S]*state\.unlocked = chapters\.length - 1/, "training entry and chapter navigation are not gated by equipment state");
assert.match(html, /SHOOTING SETUP[\s\S]*sessionDistance[\s\S]*sessionAdjustmentUnit[\s\S]*sessionAdjustmentIncrement/, "the target session owns a compact shooting-setup drawer");
assert.match(source, /25[\s\S]*METERS[\s\S]*MOA[\s\S]*Elevation 1\.25 · Windage 0\.5/, "the exact branch projects governed session conditions and both applicable adjustments");
assert.match(source, /Different equipment requires its own governed adjustment authority/, "permissive training entry does not broaden equipment-specific adjustment authority");
assert.match(source, /SCZN3_TSTT_M16A2_JOURNEY_V1[\s\S]*preserveJourney[\s\S]*restoreJourney/, "the same TSTT journey survives the Equipment Library round trip");
assert.match(source, /return_to=m16a2-tstt\.html&return_chapter=/, "the Equipment Library link preserves the exact TSTT origin and chapter");
assert.match(html, /shootingSetupNote[\s\S]*equipmentLibraryLink[\s\S]*EQUIPMENT LIBRARY/, "Equipment Library remains quietly available inside Shooting Setup");
assert.match(source, /target-window is-full-target/, "Chapter 1 requests the complete physical target thumbnail");
assert.match(html, /player-controls[\s\S]*player-start[\s\S]*▶[\s\S]*START TRAINING/, "START TRAINING lives in the fixed PLAYER rail before training begins");
assert.match(css, /data-status="waiting"[\s\S]*player-start[\s\S]*display: block/, "the pre-start PLAYER rail makes START TRAINING dominant");
assert.match(matrix, /EQUIPMENT_RETURN_PATH[\s\S]*RETURN TO CHAPTER[\s\S]*returnToEquipmentOrigin/, "Equipment Library exposes the direct origin-preserving return");
assert.match(matrix, /function conciseEquipmentName[\s\S]*join\(" · "\)/, "Equipment Library owns one concise equipment display name");
assert.match(matrix, /setActiveEquipmentProfile\(setupId\)[\s\S]*returnToEquipmentOrigin/, "existing-equipment selection commits before direct return");
assert.match(matrix, /Military M-Series Rifles[\s\S]*M16A2[\s\S]*M16A2-STANDARD-IRON-FSP-REAR-DRUM/, "M16A2 standard iron sights are discoverable through the existing Equipment Library");
assert.match(matrix, /function discoveryOrderedOptions[\s\S]*localeCompare[\s\S]*\.\.\.other/, "equipment discovery is alphabetized while Other remains last");
assert.match(source, /Set 300\. Then go one click past/, "rear-drum preparation is a complete learning task");
assert.match(source, /FRONT SIGHT POST[\s\S]*1\.25 MOA \/ CLICK/, "front-post elevation authority is taught");
assert.match(source, /REAR WINDAGE KNOB[\s\S]*0\.5 MOA \/ CLICK/, "rear-windage authority is taught");
assert.match(source, /CLOCKWISE[\s\S]*COUNTERCLOCKWISE/, "rotation language is explicit");
assert.match(source, /VIEW FROM ABOVE[\s\S]*FACE THE RIGHT-SIDE KNOB/, "observer view is explicit for both controls");
assert.match(source, /READY TO FIRE[\s\S]*YOUR FIRST GROUP/, "the experience reaches the exact pre-fire readiness stop");
assert.match(source, /PREFIRE TRAINING COMPLETE[\s\S]*Training setup: M16A2 with standard iron sights/, "the readiness panel reports lesson coverage without claiming the shooter's equipment was confirmed");
assert.doesNotMatch(source, /PREFIRE CHECK COMPLETE/, "the readiness panel does not imply an equipment-confirmation checkpoint");
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
