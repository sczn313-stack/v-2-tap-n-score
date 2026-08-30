import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile("self_teaching_player.js", "utf8");
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

class FakeAudio {
  constructor() {
    this.paused = true;
    this.playCount = 0;
    this.pauseCount = 0;
    this.currentTime = 0;
    this.onended = null;
    this.onerror = null;
    FakeAudio.instances.push(this);
  }
  play() {
    this.paused = false;
    this.playCount += 1;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
    this.pauseCount += 1;
  }
}
FakeAudio.instances = [];

const context = { setTimeout, clearTimeout, Date, Promise, Audio: FakeAudio };
context.window = context;
vm.runInNewContext(source, context);

const classList = {
  values: new Set(),
  toggle(name, enabled) { enabled ? this.values.add(name) : this.values.delete(name); }
};
const root = { dataset: {}, classList };
const rendered = [];
const player = context.SCZN3SelfTeachingPlayer.create({
  root,
  steps: [
    { state: "first", after: 70 },
    { state: "second", terminal: true }
  ],
  renderStep: step => rendered.push(step.state),
  renderReset: () => rendered.push("reset")
});

player.play();
await wait(20);
player.pause();
await wait(100);
assert.deepEqual(rendered, ["reset", "first"], "pause freezes the logical transition timer");
assert.equal(root.dataset.playerStatus, "paused", "paused status is externally observable");
assert.equal(classList.values.has("is-player-paused"), true, "paused status freezes CSS choreography through the root class");
player.resume();
await wait(70);
assert.deepEqual(rendered, ["reset", "first", "second"], "resume continues from the paused logical point");
assert.equal(player.status, "completed", "the resumed lesson completes coherently");

const narrated = [];
const narrationPlayer = context.SCZN3SelfTeachingPlayer.create({
  root: { dataset: {}, classList: { toggle() {} } },
  steps: [
    { state: "talk", narration: "One complete sentence.", audio: "sentence.wav" },
    { state: "done", terminal: true }
  ],
  renderStep: step => narrated.push(step.state),
  audioFactory: () => new FakeAudio()
});
narrationPlayer.play();
await wait(0);
const audio = FakeAudio.instances.at(-1);
narrationPlayer.pause();
assert.equal(audio.paused, true, "pause stops narration audio");
narrationPlayer.resume();
assert.equal(audio.playCount, 2, "resume continues the same narration asset");
audio.onended();
await wait(0);
assert.deepEqual(narrated, ["talk", "done"], "audio completion advances exactly one logical step");

player.restart();
await wait(0);
assert.deepEqual(rendered.slice(-2), ["reset", "first"], "restart clears the completed run and begins again without page reload");
player.stop({ reset: true });

const rewindRendered = [];
const rewindPlayer = context.SCZN3SelfTeachingPlayer.create({
  root: { dataset: {}, classList: { toggle() {} } },
  rewindMs: 50,
  steps: [
    { state: "rewind-first", after: 60 },
    { state: "rewind-second", after: 80 },
    { state: "rewind-done", terminal: true }
  ],
  renderStep: step => rewindRendered.push(step.state),
  renderReset: () => rewindRendered.push("rewind-reset")
});
rewindPlayer.play();
await wait(75);
assert.equal(rewindRendered.at(-1), "rewind-second", "the control case reaches the second logical checkpoint");
rewindPlayer.rewind();
await wait(0);
assert.equal(rewindRendered.at(-1), "rewind-first", "rewind restores the nearest valid earlier choreography checkpoint");
rewindPlayer.stop({ reset: true });

const actionClasses = new Set();
const actionElement = {
  classList: {
    add(...names) { names.forEach(name => actionClasses.add(name)); },
    remove(...names) { names.forEach(name => actionClasses.delete(name)); }
  }
};
let actionTapCount = 0;
const actionPlayer = context.SCZN3SelfTeachingPlayer.create({
  root: { dataset: {}, classList: { toggle() {} } },
  steps: [
    { state: "action", action: { id: "show-results", highlightMs: 5, tapMs: 5 }, after: 5 },
    { state: "action-done", terminal: true }
  ],
  resolveAction: () => actionElement,
  demonstrateAction: () => { actionTapCount += 1; }
});
actionPlayer.play();
await wait(8);
assert.equal(actionTapCount, 1, "the player demonstrates the required shooter action on the resolved real control");
await wait(15);
assert.equal(actionClasses.size, 0, "demonstrated action emphasis clears before the lesson continues");

const controlsMarkup = context.SCZN3SelfTeachingPlayer.controlsMarkup();
assert.match(controlsMarkup, /10 SEC[\s\S]*PLAY[\s\S]*RESTART/, "the universal control shell exposes rewind, one play-state control, and restart");
assert.doesNotMatch(controlsMarkup, />REPLAY</, "full replay is no longer a primary control");
console.log("PASS universal self-teaching player rewind, pause, resume, restart, action demonstration, and narration continuity contract");
