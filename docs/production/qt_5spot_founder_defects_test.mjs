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
  JSON.parse(JSON.stringify(runtime.sourceImagePoint(150, 260, { left: 50, top: 60, width: 400, height: 800 }, {
    targetProfileId: "qt_printer13_product_1873683447881",
    sourceImageSha256: "a".repeat(64),
    sourceImageWidthPx: 500,
    sourceImageHeightPx: 776,
  }))),
  {
    xNorm: .25,
    yNorm: .25,
    canonicalTargetCoordinate: {
      schemaVersion: "sczn3.ugo.normalized-source-image-point.v1",
      coordinateSystem: "normalized_source_image_top_left",
      targetProfileId: "qt_printer13_product_1873683447881",
      sourceImageSha256: "a".repeat(64),
      sourceImageWidthPx: 500,
      sourceImageHeightPx: 776,
      xNorm: .25,
      yNorm: .25,
    },
    observationFootprint: {
      schemaVersion: "sczn3.observation-footprint.v1",
      coordinateSystem: "normalized_source_image_top_left",
      radiusXNorm: 4.5 / 500,
      radiusYNorm: 4.5 / 776,
      authority: "shooter_observation",
      source: "sczn3_precision_tap_standard_9_source_pixels",
    },
  },
  "tap coordinates convert once into a target-and-source-bound canonical UGO coordinate"
);
assert.equal(runtime.sourceImagePoint(20, 260, { left: 50, top: 60, width: 400, height: 800 }), null);

assert.match(vaultSource, /SCZN3TargetExecutionRuntime\.vaultEvidenceModel\(session, pkg\)/);
assert.match(vaultSource, /evidence\.dataUrl \|\| evidence\.assetUrl/);
assert.match(vaultSource, /evidence\.imageWidthPx \|\| evidence\.widthPx/);
assert.match(cssSource, /\.contract-even-distribution\{color:#fff3b0/);
assert.match(cssSource, /\.contract-product-identity\{color:#151515\}/);
assert.match(cssSource, /\.contract-intro #contractStatus\{height:3\.6em;overflow:auto/);
assert.match(cssSource, /\.contract-image-frame img\{max-height:76vh\}/);
assert.match(cssSource, /\.contract-image-plane>#contractTargetImage\{display:block;width:100%;height:100%\}/);
assert.match(cssSource, /\.contract-evidence img\{display:block;max-width:100%;max-height:42vh\}/);
assert.match(cssSource, /contractSecRoot>\.sec-v1\[data-sec-mode="live"\]/);
assert.match(runtimeSource, /resolve\(\{ widthPx: image\.naturalWidth, heightPx: image\.naturalHeight \}\)/);
assert.match(runtimeSource, /state\.image = \{ sha256: hash, \.\.\.dimensions, mediaType:/);
assert.match(runtimeSource, /vaultResultSummary/);

console.log("PASS QT shared Founder defects: RESULT meta cleanup, readable presentation, Vault evidence/result, target fit/aspect, and source-image coordinate invariance");
