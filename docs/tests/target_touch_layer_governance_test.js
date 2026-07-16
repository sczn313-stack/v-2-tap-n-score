const fs = require("fs");
const path = require("path");
const assert = require("assert");

const shootHtml = fs.readFileSync(path.join(__dirname, "..", "shoot.html"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `${name} must exist`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`${name} body must be extractable`);
}

const resetSource = functionSource(shootHtml, "resetMarkPointerState");
const pointerDownSource = functionSource(shootHtml, "handleMarkPointerDown");
const pointerUpSource = functionSource(shootHtml, "handleMarkPointerUp");
const pointerCancelSource = functionSource(shootHtml, "handleMarkPointerCancel");
const activeSurfaceRuleStart = styles.indexOf('\n.target-page[data-has-results="false"] .mark-surface{');
const activeSurfaceRuleEnd = styles.indexOf("\n}", activeSurfaceRuleStart);
assert(activeSurfaceRuleStart >= 0 && activeSurfaceRuleEnd > activeSurfaceRuleStart, "active mark-surface rule must exist");
const activeSurfaceRule = styles.slice(activeSurfaceRuleStart, activeSurfaceRuleEnd + 2);

assert(
  /markSurface\.addEventListener\("pointerdown", handleMarkPointerDown, \{ passive: true \}\)/.test(shootHtml),
  "mark surface must bind the current passive pointer-down handler"
);
assert(
  /markSurface\.addEventListener\("pointerup", handleMarkPointerUp, \{ passive: true \}\)/.test(shootHtml),
  "mark surface must bind the current passive pointer-up handler"
);
assert(
  /markSurface\.addEventListener\("pointercancel", handleMarkPointerCancel, \{ passive: true \}\)/.test(shootHtml),
  "mark surface must bind the current passive pointer-cancel handler"
);

assert(
  /touch-action\s*:\s*pinch-zoom/i.test(activeSurfaceRule),
  "active marking must preserve pinch zoom while blocking one-finger target panning"
);
assert(
  !/touch-action\s*:[^;}]*\bpan-[xy]\b/i.test(activeSurfaceRule),
  "active marking must not permit one-finger panning from the target surface"
);
assert(
  /\.marker-layer\s*\{[^}]*position\s*:\s*absolute/i.test(styles),
  "marker rendering must remain outside normal layout flow"
);
assert(
  /\.target-marker\s*\{[^}]*position\s*:\s*absolute/i.test(styles),
  "individual markers must remain outside normal layout flow"
);
assert(
  /\.target-page\[data-has-results="true"\]\s+\.mark-surface\s*\{[^}]*pointer-events\s*:\s*none/i.test(styles),
  "mark surface must be non-interactive after results"
);
assert(
  /\.target-page\[data-has-results="true"\]\s+\.mark-surface\s*\{[^}]*touch-action\s*:\s*pan-y/i.test(styles),
  "mark surface must allow vertical panning after results"
);

const createPointerHarness = new Function(`
  let resultsShown = false;
  let markableEvidence = true;
  const activeMarkPointers = new Set();
  let markTapCandidate = null;
  let markGestureCancelled = false;
  const recordedShotIds = [];
  function hasMarkableEvidence() { return markableEvidence; }
  function handleMarkTap() { recordedShotIds.push(recordedShotIds.length + 1); }
  ${resetSource}
  ${pointerDownSource}
  ${pointerUpSource}
  ${pointerCancelSource}
  return {
    pointerDown: handleMarkPointerDown,
    pointerUp: handleMarkPointerUp,
    pointerCancel: handleMarkPointerCancel,
    setResultsShown(value) { resultsShown = value; },
    setMarkableEvidence(value) { markableEvidence = value; },
    shotIds() { return recordedShotIds.slice(); },
    activePointerCount() { return activeMarkPointers.size; }
  };
`);

const harness = createPointerHarness();
const jitterDistances = [3, 4, 5, 6, 7, 8, 9, 10, 3, 10];
jitterDistances.forEach((distance, index) => {
  const pointerId = index + 1;
  harness.pointerDown({ pointerId, pointerType: "touch", clientX: 100, clientY: 100 });
  harness.pointerUp({ pointerId, pointerType: "touch", clientX: 100 + distance, clientY: 100 });
});
assert.deepStrictEqual(
  harness.shotIds(),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "ten rapid touch taps with 3-10px jitter must preserve shot order"
);
assert.strictEqual(harness.activePointerCount(), 0, "rapid taps must leave no active pointer state");

const shotsBeforeMultiTouch = harness.shotIds().length;
harness.pointerDown({ pointerId: 20, pointerType: "touch", clientX: 100, clientY: 100 });
harness.pointerDown({ pointerId: 21, pointerType: "touch", clientX: 110, clientY: 110 });
harness.pointerUp({ pointerId: 21, pointerType: "touch", clientX: 110, clientY: 110 });
harness.pointerUp({ pointerId: 20, pointerType: "touch", clientX: 100, clientY: 100 });
assert.strictEqual(
  harness.shotIds().length,
  shotsBeforeMultiTouch,
  "a second simultaneous pointer must cancel shot recording"
);

harness.pointerDown({ pointerId: 30, pointerType: "touch", clientX: 100, clientY: 100 });
harness.pointerCancel({ pointerId: 30 });
assert.strictEqual(harness.activePointerCount(), 0, "pointer cancellation must clear active pointer state");

const shotsBeforeLargeMove = harness.shotIds().length;
harness.pointerDown({ pointerId: 31, pointerType: "touch", clientX: 100, clientY: 100 });
harness.pointerUp({ pointerId: 31, pointerType: "touch", clientX: 113, clientY: 100 });
assert.strictEqual(
  harness.shotIds().length,
  shotsBeforeLargeMove,
  "touch movement beyond the existing 12px tolerance must not record a shot"
);

harness.setResultsShown(true);
harness.pointerDown({ pointerId: 40, pointerType: "touch", clientX: 100, clientY: 100 });
harness.pointerUp({ pointerId: 40, pointerType: "touch", clientX: 100, clientY: 100 });
assert.strictEqual(harness.shotIds().length, shotsBeforeLargeMove, "results state must reject new shots");

harness.setResultsShown(false);
harness.setMarkableEvidence(false);
harness.pointerDown({ pointerId: 41, pointerType: "touch", clientX: 100, clientY: 100 });
harness.pointerUp({ pointerId: 41, pointerType: "touch", clientX: 100, clientY: 100 });
assert.strictEqual(harness.shotIds().length, shotsBeforeLargeMove, "missing evidence must reject new shots");

console.log("PASS target touch layer governance test");
