import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, css, source, narration, narrationStandard, matrix, buildSite, buildNetlify, reviewServer] = await Promise.all([
  readFile("m16a2-tstt.html", "utf8"),
  readFile("m16a2-tstt.css", "utf8"),
  readFile("m16a2-tstt.js", "utf8"),
  readFile("tstt_narration.js", "utf8"),
  readFile("architecture/TSTT_NARRATION_STANDARD.md", "utf8"),
  readFile("matrix.html", "utf8"),
  readFile("production/build-site.mjs", "utf8"),
  readFile("production/build-netlify.mjs", "utf8"),
  readFile("production/m16a2_tstt_review_server.mjs", "utf8")
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
assert.match(source, /AIM POINT[\s\S]*READ THE GRID[\s\S]*READ THE CLICKS[\s\S]*FIRE THE SHOT PATTERN[\s\S]*LET TAP-N-SCORE READ IT/, "Chapter 1 visibly teaches the complete target curriculum");
assert.match(source, /each square in the columns represents one front-sight up-or-down click[\s\S]*Each square in the rows represents three rear-windage clicks, right or left/i, "Chapter 1 reads the Founder-settled M16A2 square-to-control scales");
assert.doesNotMatch(`${source}\n${css}`, /target-marker|sample-group/, "Chapter 1 keeps the complete physical target free of intrusive teaching overlays");
assert.match(source, /Fire three to five shots before making an adjustment\.[\s\S]*THE CENTER OF YOUR SHOT PATTERN[\s\S]*better picture of where your shots are landing/, "Chapter 1 teaches the settled shooter-facing shot-pattern concept");
assert.match(source, /NEXT, WE'LL LEARN THE SIGHTS\./, "Chapter 1 hands directly to the sight lesson with the settled Founder copy");
assert.match(html, /tstt_narration\.js[\s\S]*m16a2-tstt\.js/, "the reusable narration standard loads before the product lesson");
assert.match(narration, /DEFAULT_SETTINGS = Object\.freeze\(\{ rate: 0\.70, pitch: 1, volume: 1 \}\)/, "the reusable narrator keeps the slower neutral baseline");
assert.ok(narration.indexOf("/^Samantha") < narration.indexOf("/^Reed"), "Samantha is selected before the neutral fallback voices");
assert.match(narration, /Samantha[\s\S]*Reed[\s\S]*Flo[\s\S]*Alex[\s\S]*Ava[\s\S]*Susan/, "neutral instructional fallbacks remain available");
assert.match(narration, /resolveSamantha[\s\S]*find\(voice => SAMANTHA_NAME\.test[\s\S]*if \(!voice\) return/, "production narration locks Samantha and refuses to speak through a fallback voice");
assert.match(narration, /SAMANTHA UNAVAILABLE[\s\S]*voiceschanged[\s\S]*resolveSamantha/, "the runtime waits for the device voice list and reports exact unavailability");
assert.match(`${html}\n${source}`, /RUNTIME INSTRUCTOR[\s\S]*runtimeVoiceStatus[\s\S]*PLAY “SHOT PATTERN” CHECK[\s\S]*Your shot pattern is two squares high and three squares left/, "Founder review exposes the actual runtime voice with the locked shot-pattern terminology");
assert.match(source, /chapterOneSpokenNarration[\s\S]*narrationPlan: Object\.freeze\(\[\s*Object\.freeze\(\{ text: chapterOneSpokenNarration, delivery: "normal" \}\)/, "Chapter 1 uses one continuous known-good Samantha utterance at the baseline rate");
assert.match(narration, /NON_INSTRUCTIONAL_VOICES[\s\S]*Albert[\s\S]*Zarvox/, "novelty and theatrical system voices cannot become the instructor");
assert.match(narration, /pronounceForInstruction[\s\S]*M sixteen A two[\s\S]*minutes of angle[\s\S]*one point two five[\s\S]*zero point five/, "speech preparation deliberately pronounces equipment terminology and adjustment values");
assert.match(narration, /DEFAULT_PAUSES[\s\S]*normal: 450[\s\S]*action: 900[\s\S]*look: 1100/, "thought, action, and observation pauses are explicitly paced");
assert.match(narration, /deliveryRate[\s\S]*important[\s\S]*0\.66[\s\S]*action[\s\S]*0\.68/, "important facts and actions receive modest vocal emphasis without changing pitch");
assert.match(source, /Before making any sight adjustments, understand what this target is telling you\.[\s\S]*Always make the center crosshairs your aim point when zeroing your weapon\.[\s\S]*Each small square measures how far your shots are landing from the center crosshairs\.[\s\S]*columns represents one front-sight up-or-down click\.[\s\S]*rows represents three rear-windage clicks, right or left\.[\s\S]*Fire three to five shots before making an adjustment\.[\s\S]*The center of your shot pattern gives a better picture of where your shots are landing\.[\s\S]*Tap-n-Score can measure where it is in relation to the center crosshairs and tell you what adjustment to make\.[\s\S]*Next, we'll learn the sights\./, "Chapter 1 contains the complete settled Founder script in order");
assert.doesNotMatch(source.split('id: "a2-2"')[0], /\b(?:white|red|group|POIB)\b|center dot|center point|Do not chase/i, "Chapter 1 uses locked shooter-facing terminology without color, group, POIB, or the retired standalone explanation");
assert.match(source, /Now that you understand the target, let's learn the sights you'll use to zero your M16A2\.[\s\S]*three sight adjustments[\s\S]*front sight post[\s\S]*rear windage knob[\s\S]*rear elevation drum[\s\S]*move your shot pattern up or down[\s\S]*move your shot pattern right or left[\s\S]*correct starting position[\s\S]*Set the rear elevation drum to 8\/3, then move it one click past 8\/3\.[\s\S]*Front sight post — elevation, up or down\.[\s\S]*Rear windage knob — windage, right or left\.[\s\S]*Rear elevation drum — sets the sight for the 25-meter zero\.[\s\S]*exactly where each adjustment is on your rifle and how to move it\./, "Chapter 2 contains the complete Founder-approved script in order");
assert.match(source, /chapterTwoSpokenNarration[\s\S]*narrationPlan: Object\.freeze\(\[\s*Object\.freeze\(\{ text: chapterTwoSpokenNarration, delivery: "normal" \}\)/, "Chapter 2 uses the locked Samantha baseline rate with natural sentence punctuation");
assert.match(source, /SEE IT → FIND IT → UNDERSTAND ITS JOB[\s\S]*FRONT OF RIFLE[\s\S]*REAR SIGHT · RIGHT SIDE[\s\S]*REAR SIGHT · BELOW APERTURE/, "Chapter 2 teaches where each physical sight is found on the rifle");
assert.match(source, /FOUNDER_M16A2_FRONT_SIGHT_POST_REFERENCE[\s\S]*FOUNDER_M16A2_REAR_WINDAGE_KNOB_REFERENCE[\s\S]*FOUNDER_M16A2_REAR_ELEVATION_DRUM_8-3_REFERENCE/, "Chapter 2 uses all three Founder-supplied real-hardware references");
assert.match(source, /FIND THE SQUARE POST BETWEEN THE PROTECTIVE EARS[\s\S]*FIND THE ROUND KNOB ON THE RIGHT SIDE[\s\S]*FIND THE 8\/3 MARK ON THE NUMBERED DRUM/, "Chapter 2 highlights and names the actual hardware controls");
assert.match(source, /25-METER ZERO[\s\S]*1 CLICK CLOCKWISE PAST 8\/3[\s\S]*AFTER ZERO CONFIRMATION[\s\S]*1 CLICK COUNTERCLOCKWISE → BACK TO 8\/3/, "Chapter 2 teaches temporary 25-meter setup and return to the 300-meter 8/3 setting");
assert.doesNotMatch(source.split('id: "a2-3"')[0], /<svg|rifle-locator|sight-physical|drum-demo|diagram-ring|CLOCKWISE • ONE CLICK PAST 300/, "Chapter 2 contains no replacement hardware illustration or rejected abstract drum graphic");
assert.match(source, /task: "", action: "none", hideTask: true/, "Chapter 2 removes the classroom task and completion button");
assert.match(source, /PHOTOGRAPH USAGE RIGHTS NOT YET CLEARED FOR PRODUCTION/, "the local review surface identifies the unresolved production-rights boundary");
assert.match(narrationStandard, /one thought per sentence[\s\S]*Pause briefly after every sentence[\s\S]*Use one governed name[\s\S]*visual and audio teaching in the same sequence/i, "the reusable governance artifact preserves the Founder narration rules");
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
assert.match(source, /Set the rear elevation drum to 8\/3, then move it one click past 8\/3/, "Chapter 2 teaches the Founder-approved M16A2 rear-drum setup");
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
  assert.match(build, /"tstt_narration\.js"/, "the reusable narration runtime is included in the build inventory");
  assert.match(build, /FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02\.png/, "the preserved target evidence is included in the build inventory");
  assert.doesNotMatch(build, /FOUNDER_M16A2_(?:FRONT_SIGHT|REAR_WINDAGE|REAR_ELEVATION)/, "uncleared Chapter 2 reference photographs cannot enter the production build inventory");
}
assert.match(reviewServer, /FOUNDER_M16A2_FRONT_SIGHT_POST_REFERENCE[\s\S]*FOUNDER_M16A2_REAR_WINDAGE_KNOB_REFERENCE[\s\S]*FOUNDER_M16A2_REAR_ELEVATION_DRUM_8-3_REFERENCE/, "the local review server permits all three Founder-supplied references");
assert.match(reviewServer, /const host = process\.argv\[3\] \|\| "127\.0\.0\.1"/, "the review server keeps uncleared reference photographs on localhost unless LAN exposure is explicitly requested");

console.log("PASS Episode 60 Baker M16A2 pre-fire TSTT contract");
