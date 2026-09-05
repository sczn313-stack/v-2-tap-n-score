import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile("tstt_narration.js", "utf8");
const audioInstances = [];
const speechCalls = [];

class TestAudio {
  constructor() {
    this.paused = true;
    this.src = "";
    audioInstances.push(this);
  }
  play() {
    this.paused = false;
    this.onplay?.();
    return Promise.resolve();
  }
  pause() { this.paused = true; }
  finish() {
    this.paused = true;
    this.onended?.();
  }
}

const root = {
  Audio: TestAudio,
  SpeechSynthesisUtterance: class {},
  clearTimeout,
  setTimeout,
  speechSynthesis: {
    addEventListener() {},
    cancel() { speechCalls.push("cancel"); },
    getVoices() { return []; },
    speak() { speechCalls.push("speak"); }
  }
};
vm.runInNewContext(source, { window: root });

const started = [];
const ended = [];
let completed = 0;
const narrator = root.SCZN3TSTTNarration.createNarrator({
  audioFactory: () => new TestAudio(),
  onSegmentStart: segment => started.push(segment.text),
  onSegmentEnd: segment => ended.push(segment.text),
  onComplete: () => { completed += 1; }
});

narrator.play([
  { text: "Chapter one.", audio: "chapter1.wav", pauseAfter: 0 },
  { text: "Chapter two.", audio: "chapter2.wav", pauseAfter: 0 }
]);
assert.equal(audioInstances.length, 1);
assert.equal(audioInstances[0].src, "chapter1.wav");
assert.deepEqual(started, ["Chapter one."]);
assert.equal(speechCalls.includes("speak"), false, "native plans never invoke Web Speech");

narrator.pause();
assert.equal(audioInstances[0].paused, true);
narrator.resume();
assert.equal(audioInstances[0].paused, false);

audioInstances[0].finish();
await new Promise(resolve => setTimeout(resolve, 5));
assert.equal(audioInstances.length, 2);
assert.equal(audioInstances[1].src, "chapter2.wav");
assert.deepEqual(ended, ["Chapter one."]);

audioInstances[1].finish();
assert.deepEqual(ended, ["Chapter one.", "Chapter two."]);
assert.equal(completed, 1, "the final audio ending emits exactly one chapter-complete event");

console.log("PASS TSTT native audio sequence, pause/resume, and completion contract");
