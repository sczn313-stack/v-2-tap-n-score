import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const runtimeSource = await readFile("target_execution_runtime.js", "utf8");
const pageSource = await readFile("target-experience.html", "utf8");
const cssSource = await readFile("target-experience.css", "utf8");
const window = {};
const document = { readyState: "loading", addEventListener() {} };
vm.runInNewContext(runtimeSource, { window, document, Uint8Array, Uint32Array, ArrayBuffer, DataView, Math, Date, Object, String, Number, Array, RegExp, URLSearchParams });

const runtime = window.SCZN3TargetExecutionRuntime;
const result = {
  missionFamily: "smartEvidenceCapture",
  observations: [{ xNorm: .4, yNorm: .4 }, { xNorm: .6, yNorm: .6 }],
  sczn3Metrics: {
    status: "complete",
    shotPattern: {
      tapCount: 2,
      center: { xNorm: .5, yNorm: .5, horizontalBand: "center", verticalBand: "middle" },
      dispersion: { status: "complete", rmsRadiusNorm: .1414 },
    },
  },
};
const session = {
  sczn3Progress: {
    shotPatternComparison: { status: "comparable", centerMovementNorm: .04, rmsRadiusChangeNorm: -.02 },
    best: { tightestPattern: { rmsRadiusNorm: .1414, sessionId: "current" } },
  },
};
const markup = runtime.shotPatternMarkup(result, session);
assert.match(markup, /THE CENTER OF YOUR SHOT PATTERN/);
assert.match(markup, /MIDDLE CENTER/);
assert.match(markup, /Tighter/);
assert.doesNotMatch(markup, /points|publisher says|diagnosis/i);

assert.match(pageSource, /id="contractObservationCount">0<\/strong> Taps/);
assert.doesNotMatch(pageSource, /id="contractObservationCount">0<\/strong> observations/);
assert.match(pageSource, /class="button primary" id="contractStart"/);
assert.match(pageSource, /id="contractShowResult"[^>]*disabled/);
assert.match(cssSource, /\.contract-image-frame img\{max-height:76vh\}/);
assert.match(runtimeSource, /Aim-point subsets/);
assert.match(runtimeSource, /subset_not_additional_primary_tap|these are not additional shots/);

console.log("PASS QT final smartness presentation: taps language, shot-pattern intelligence, progress, subsets, workspace, and action state");
