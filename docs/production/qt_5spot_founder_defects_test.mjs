import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const runtimeSource = await readFile("target_execution_runtime.js", "utf8");
const vaultSource = await readFile("records.html", "utf8");
const cssSource = await readFile("target-experience.css", "utf8");
const window = {};
const document = { readyState: "loading", addEventListener() {} };
vm.runInNewContext(runtimeSource, { window, document, Uint8Array, Uint32Array, ArrayBuffer, DataView, Math, Date, Object, String, Number, Array, RegExp, URLSearchParams });

const runtime = window.SCZN3TargetExecutionRuntime;
const spots = Array.from({ length: 5 }, (_, index) => ({ objectId: `spot_${index + 1}`, label: `Spot ${index + 1}`, observationCount: 2, observationPercentage: 20, hit: true }));
const result = {
  target: { id: "qt_printer13_product_test" },
  missionFamily: "targetScoring",
  scoring: { status: "complete", model: "named_regions", observationCount: 10, outsideCount: 0, objectResults: spots },
  sczn3Metrics: {
    status: "complete",
    hitRate: { validHitCount: 10, governedShotCount: 10, percentage: 100 },
    objectCoverage: { objectsHit: 5, scorableObjectCount: 5 },
    objectDistribution: { status: "complete", strongest: { label: "Spot 5", tapCount: 2 }, weakest: { label: "Spot 1", tapCount: 2 }, countRange: 0, evennessPercentage: 100 },
  },
};
const markup = runtime.shooterFacingResultMarkup(result, { label: "Target Areas", value: "10", detail: "10 taps" });
assert.doesNotMatch(markup, /Strongest:|Weakest:|EVEN DISTRIBUTION|Evenness/);
assert.doesNotMatch(runtimeSource, /\$\{shotPatternMarkup\(result, session\)\}\$\{cueResultMarkup/);

assert.deepEqual(
  JSON.parse(JSON.stringify(runtime.sourceImagePoint(150, 260, { left: 50, top: 60, width: 400, height: 800 }))),
  { xNorm: .25, yNorm: .25 },
  "tap coordinates normalize against the rendered source image"
);
assert.equal(runtime.sourceImagePoint(20, 260, { left: 50, top: 60, width: 400, height: 800 }), null);

assert.match(vaultSource, /SCZN3TargetExecutionRuntime\.vaultEvidenceModel\(session, pkg\)/);
assert.match(vaultSource, /evidence\.dataUrl \|\| evidence\.assetUrl/);
assert.match(vaultSource, /evidence\.imageWidthPx \|\| evidence\.widthPx/);
assert.match(cssSource, /\.contract-even-distribution\{color:#fff3b0/);
assert.match(cssSource, /\.contract-product-identity\{color:#151515\}/);
assert.match(cssSource, /\.contract-intro #contractStatus\{height:3\.6em;overflow:auto/);
assert.match(cssSource, /\.contract-image-frame img\{display:block;max-width:100%;max-height:66vh\}/);
assert.match(cssSource, /\.contract-evidence img\{display:block;max-width:100%;max-height:42vh\}/);
assert.match(cssSource, /contractSecRoot>\.sec-v1\[data-sec-mode="live"\]/);
assert.match(runtimeSource, /resolve\(\{ widthPx: image\.naturalWidth, heightPx: image\.naturalHeight \}\)/);
assert.match(runtimeSource, /state\.image = \{ sha256: hash, \.\.\.dimensions, mediaType:/);
assert.match(runtimeSource, /vaultResultSummary/);

console.log("PASS QT shared Founder defects: RESULT meta cleanup, readable presentation, Vault evidence/result, target fit/aspect, and source-image coordinate invariance");
