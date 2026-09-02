import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const [lessonSource, configSource, shoot, playerSource, css, buildSource] = await Promise.all([
  readFile("m4_talking_lesson.js", "utf8"),
  readFile("m4_sec_config.js", "utf8"),
  readFile("shoot.html", "utf8"),
  readFile("self_teaching_player.js", "utf8"),
  readFile("smart_target_workspace.css", "utf8"),
  readFile("production/build-netlify.mjs", "utf8")
]);

const context = { window: {} };
context.window.window = context.window;
vm.runInNewContext(configSource, context);
vm.runInNewContext(lessonSource, context);

const lesson = context.window.SCZN3M4TalkingLesson;
const config = context.window.SCZN3_M4_CONFIG;
const authority = lesson.lessonAuthority(config);
const steps = lesson.steps(config);

assert.equal(authority.targetName, config.target.targetName, "lesson identity comes from governed M4 configuration");
assert.equal(authority.missionLabel, config.zeroingMission.label, "lesson mission comes from governed M4 configuration");
assert.equal(authority.distanceValue, String(config.zeroingMission.defaultDistance.value), "lesson distance comes from governed M4 configuration");
assert.equal(authority.bullAuthoritySource, config.target.geometry.bullCoordinate.source, "lesson aim choreography retains the governed bull source");
assert.deepEqual(Array.from(steps, step => step.state), ["intro", "distance", "aim", "add-photo", "handoff", "handoff"], "M4 lesson stops at the Add Photo handoff");
assert.equal(steps.at(-1).terminal, true, "completion is clean and terminal at Add Photo");
assert.equal(steps.at(-2).action.selector, "#chooseTargetButton", "the handoff uses the existing Add Photo control");
assert.match(steps.at(-2).narration, /mark your aim point and each visible impact/i, "the handoff explains the next shooter-owned observations");
assert.match(lesson.sceneMarkup("aim", config), /--m4-lesson-x:50%;--m4-lesson-y:43\.181818%/, "aim choreography consumes governed M4 geometry");
assert.equal(lesson.isEligible("m4_25m_zero", {
  targetProfileId: "m4_25m_zero",
  assetRole: "founder-workspace-presentation-from-physically-validated-reconstruction",
  registrationStatus: "complete",
  registrationAuthorityId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
  dataUrl: "authority-evidence/m4-target-reconstruction/M4_M16_25M_WORKSPACE_PRESENTATION.svg"
}), true, "the governed protected M4 surface is eligible");
assert.equal(lesson.isEligible("baker_st_100yd_smart_zero", {
  assetRole: "founder-workspace-presentation-from-physically-validated-reconstruction",
  registrationStatus: "complete",
  registrationAuthorityId: "M4_TARGET_AUTHORITY_v1_ORIGINAL"
}), false, "the M4 lesson cannot attach to Baker");
assert.equal(lesson.isEligible("m4_25m_zero", {
  assetRole: "shooter-captured-photo",
  registrationStatus: "complete",
  registrationAuthorityId: "M4_TARGET_AUTHORITY_v1_ORIGINAL"
}), false, "the lesson cannot overlay or mutate the shooter's photo road");

assert.match(shoot, /self_teaching_player\.js\?v=episode59-founder-player-lock-1[\s\S]*m4_talking_lesson\.js\?v=episode60-m4-teaching-1/, "M4 inherits the unchanged universal PLAYER before its target lesson");
assert.match(shoot, /isM4TalkingLessonEvidence\(evidence\)[\s\S]*SCZN3M4TalkingLesson\.markup\(\)/, "the governed M4 target receives the lesson layer");
assert.match(shoot, /SCZN3M4TalkingLesson\.bind\(\{[\s\S]*root:[\s\S]*host:[\s\S]*config: window\.SCZN3_M4_CONFIG/, "the M4 integration binds the universal parent-owned PLAYER host");
assert.match(playerSource, /play\(\)[\s\S]*pause\(\)[\s\S]*resume\(\)[\s\S]*restart\(\)[\s\S]*rewind\(/, "the inherited PLAYER retains Play/Pause/Resume, Restart, and logical rewind");
assert.match(lessonSource, /demonstrateAction: \(\) => \{\}/, "the lesson demonstrates Add Photo without opening the picker or starting shooter work");
assert.doesNotMatch(lessonSource, /\.click\(/, "M4 choreography cannot trigger live shooter controls");
assert.doesNotMatch(lessonSource, /1\.5|1\.75/, "the unresolved front-sight discrepancy is absent from the M4 lesson");
assert.doesNotMatch(lessonSource, /Baker 100 Yard|bakerSample|baker_talking/, "Baker lesson content is not copied into the M4 integration");
assert.doesNotMatch(lessonSource, /buildAuthorityPackage|windageClicks|elevationClicks|groupCenter|correctionDirection|scoring/i, "the teaching layer neither calculates nor scores");
assert.match(css, /\.m4-talking-lesson-layer\{[\s\S]*pointer-events:none/, "the M4 lesson stays an isolated presentation layer");
assert.match(css, /workspace-stage-shell\.is-player-paused \.m4-talking-lesson-layer \*\{animation-play-state:paused!important\}/, "inspection pause freezes M4 choreography");
assert.match(buildSource, /"m4_talking_lesson\.js"/, "the M4 lesson is included in the production bundle without changing availability");
assert.doesNotMatch(shoot, /m4_25m_zero[^\n]{0,200}AVAILABLE/, "the lesson does not make M4 publicly available");

console.log("PASS Episode 60 M4 Let the Target Talk teaching-layer contract");
