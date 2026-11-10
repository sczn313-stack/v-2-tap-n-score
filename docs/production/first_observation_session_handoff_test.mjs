import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeSource = await readFile(path.join(docs, "target_execution_runtime.js"), "utf8");
const document = {
  documentElement: { dataset: {} },
  readyState: "complete",
  querySelector() { return null; }
};
const window = {
  location: { href: "https://example.invalid/target-experience.html", search: "", hostname: "example.invalid", port: "" },
  document,
  console
};
window.window = window;

vm.runInNewContext(runtimeSource, {
  window,
  document,
  console,
  URL,
  URLSearchParams,
  Uint8Array,
  Uint32Array,
  DataView,
  Math,
  TextEncoder
}, { filename: "target_execution_runtime.js" });

const resolvePreparedEquipment = window.SCZN3TargetExecutionRuntime?.resolvePreparedEquipment;
assert.equal(typeof resolvePreparedEquipment, "function", "the shared lifecycle owner exposes its preparation handoff resolver");

const submitted = {
  setupId: "founder-library-setup",
  weaponCategory: "Rifle",
  weaponModelCaliber: ".22 LR",
  source: "weapon_library"
};
const shooterSelectedResponse = {
  preparationToken: "opaque-preparation-token",
  setupMode: "shooter-selected",
  standardSetup: null,
  equipmentAssessments: [{ candidateId: "candidate-1" }]
};

// Regression: Backend preparation intentionally omits equipmentCandidates.
// The old implementation read shooterSelectedResponse.equipmentCandidates and
// then fell back to null standardSetup, causing session_preparation_unavailable.
assert.equal("equipmentCandidates" in shooterSelectedResponse, false, "the response reproduces the production response contract");
const originalSelection = shooterSelectedResponse.setupMode === "shooter-selected"
  && Array.isArray(shooterSelectedResponse.equipmentCandidates)
  && shooterSelectedResponse.equipmentCandidates.length
  ? shooterSelectedResponse.equipmentCandidates[0]
  : shooterSelectedResponse.standardSetup;
assert.equal(originalSelection, null, "the original response-only conversion loses the admitted candidate and reproduces session_preparation_unavailable");
assert.equal(resolvePreparedEquipment(shooterSelectedResponse, [submitted]), submitted, "the admitted submitted candidate survives initialization for deferred /start");

const standard = { setupId: "backend-standard", source: "backend_standard_setup" };
assert.equal(
  resolvePreparedEquipment({ preparationToken: "standard-token", setupMode: "standard", standardSetup: standard }, [submitted]),
  standard,
  "standard setup continues to come from Backend Authority"
);

assert.equal(resolvePreparedEquipment({ setupMode: "shooter-selected", standardSetup: null }, []), null, "missing shooter-selected input fails closed");
assert.equal(resolvePreparedEquipment({ setupMode: "unexpected", standardSetup: standard }, [submitted]), null, "malformed setup mode fails closed");

assert.match(runtimeSource, /const submittedEquipmentCandidates = hasSelectedEquipment/, "start owns the exact submitted candidate set");
assert.match(runtimeSource, /resolvePreparedEquipment\(prepared, submittedEquipmentCandidates\)/, "prepared state uses the admitted handoff resolver");
assert.match(runtimeSource, /if \(!state\.preparation \|\| !clean\(state\.preparation\.preparationToken\) \|\| !state\.selectedEquipment\) throw new Error\("session_preparation_unavailable"\)/, "the durable-session guard remains fail-closed");
assert.match(runtimeSource, /if \(state\.sessionStartPromise\) return state\.sessionStartPromise/, "concurrent first observations share one durable-session start");

console.log("PASS first-observation preparation token and shooter-selected equipment survive initialization");
console.log("PASS standard setup remains Backend-owned and malformed handoffs fail closed");
console.log("PASS first-observation durable-session guard and duplicate-start protection remain active");
