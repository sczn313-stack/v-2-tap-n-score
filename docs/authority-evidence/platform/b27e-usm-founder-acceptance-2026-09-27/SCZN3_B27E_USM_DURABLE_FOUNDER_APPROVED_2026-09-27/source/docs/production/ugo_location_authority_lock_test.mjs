import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const [runtimeSource, vaultSource, declarativeSource, evidenceSource, architectureSource, standardSource] = await Promise.all([
  readFile("target_execution_runtime.js", "utf8"),
  readFile("records.html", "utf8"),
  readFile("backend/executors/declarative_target_score.py", "utf8"),
  readFile("backend/executors/smart_evidence_capture.py", "utf8"),
  readFile("architecture/decisions/ADR-002_UGO_LOCATION_AUTHORITY.md", "utf8"),
  readFile("backend/target_knowledge/ugo_location_authority_standard_v1.json", "utf8"),
]);

const standard = JSON.parse(standardSource);
assert.equal(standard.status, "FOUNDER_APPROVED_LOCKED");
assert.equal(standard.canonicalPointSchema.schemaVersion, "sczn3.ugo.normalized-source-image-point.v1");
assert.equal(standard.canonicalPointSchema.coordinateSystem, "normalized_source_image_top_left");
assert.match(architectureSource, /UGO\/canonical target coordinate is location truth/);
assert.match(architectureSource, /No lifecycle stage may create a new durable coordinate from a rendered marker position/);

const computedStyle = {
  borderLeftWidth: "0px", borderRightWidth: "0px", borderTopWidth: "0px", borderBottomWidth: "0px",
  paddingLeft: "0px", paddingRight: "0px", paddingTop: "0px", paddingBottom: "0px",
  objectFit: "contain", objectPosition: "50% 50%",
};
const window = { getComputedStyle: () => computedStyle };
const document = { readyState: "loading", addEventListener() {} };
vm.runInNewContext(runtimeSource, { window, document, Uint8Array, Uint32Array, ArrayBuffer, DataView, Math, Date, Object, String, Number, Array, RegExp, URLSearchParams });
const runtime = window.SCZN3TargetExecutionRuntime;

const image = {
  naturalWidth: 500,
  naturalHeight: 776,
  getBoundingClientRect: () => ({ left: 10, top: 20, width: 400, height: 400 }),
};
const visible = runtime.renderedImageContentBox(image);
assert.ok(Math.abs(visible.width - (400 * 500 / 776)) < 1e-9, "object-fit letterboxing is excluded from UGO capture/projection");
assert.ok(Math.abs(visible.height - 400) < 1e-9);
assert.ok(visible.left > 10, "visible source image is horizontally inset inside the image element");

const identity = {
  targetProfileId: "qt_printer13_product_1873683447881",
  sourceImageSha256: "a".repeat(64),
  sourceImageWidthPx: 500,
  sourceImageHeightPx: 776,
};
const captured = runtime.sourceImagePoint(visible.left + visible.width * .25, visible.top + visible.height * .75, visible, identity);
const canonical = JSON.parse(JSON.stringify(captured.canonicalTargetCoordinate));
assert.deepEqual({ ...canonical, xNorm: .25, yNorm: .75 }, {
  schemaVersion: "sczn3.ugo.normalized-source-image-point.v1",
  coordinateSystem: "normalized_source_image_top_left",
  ...identity,
  xNorm: .25,
  yNorm: .75,
});
assert.ok(Math.abs(canonical.xNorm - .25) < 1e-12);
assert.ok(Math.abs(canonical.yNorm - .75) < 1e-12);

const conflictingPresentationPoint = {
  xNorm: .9,
  yNorm: .1,
  canonicalTargetCoordinate: captured.canonicalTargetCoordinate,
};
const projected = JSON.parse(JSON.stringify(runtime.normalizedEvidencePoint(conflictingPresentationPoint, identity)));
assert.ok(Math.abs(projected.xNorm - .25) < 1e-12, "projection consumes canonical UGO x rather than presentation x");
assert.ok(Math.abs(projected.yNorm - .75) < 1e-12, "projection consumes canonical UGO y rather than presentation y");

assert.match(runtimeSource, /sourceImagePoint\(event\.clientX, event\.clientY, renderedImageContentBox\(byId\("contractTargetImage"\)\)/);
assert.match(runtimeSource, /syncProjectionLayerToImage\(layer, image, container\)/);
assert.match(runtimeSource, /data-ugo-projection-plane="normalized-source-image"/);
assert.match(runtimeSource, /container\.dataset\.ugoProjectionPlane === "normalized-source-image"/);
assert.match(vaultSource, /SCZN3TargetExecutionRuntime\?\.renderedImageContentBox\(image\)/);
assert.match(vaultSource, /data-ugo-projection-plane="normalized-source-image"/);
assert.match(vaultSource, /const canonical = point && point\.canonicalTargetCoordinate/);
for (const source of [declarativeSource, evidenceSource]) {
  assert.match(source, /ugo_canonical_target_identity_mismatch/);
  assert.match(source, /ugo_canonical_source_image_mismatch/);
  assert.match(source, /ugo_canonical_source_dimensions_mismatch/);
  assert.match(source, /ugo_canonical_coordinate_value_mismatch/);
}

console.log("PASS UGO location authority lock: canonical capture, identity binding, backend validation, and rendered-image projection only");
