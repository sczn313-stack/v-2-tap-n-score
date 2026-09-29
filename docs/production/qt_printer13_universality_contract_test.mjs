import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const read = path => readFile(path, "utf8");
const json = async path => JSON.parse(await read(path));
const manifestPath = "authority-evidence/platform/qt-printer13-physical-authority-execution-2026-09-28/QT_PHYSICAL_AUTHORITY_BATCH_MANIFEST.json";
const lifecyclePath = "authority-evidence/platform/qt-printer13-physical-authority-execution-2026-09-28/QT_PHYSICAL_AUTHORITY_LIFECYCLE_VERIFICATION.json";

const [manifest, lifecycle, targetPage, targetCss, runtime, usmRegistry, adapters, owners, workspace, workspaceCss, actions, processing, navigation] = await Promise.all([
  json(manifestPath),
  json(lifecyclePath),
  read("target-experience.html"),
  read("target-experience.css"),
  read("target_execution_runtime.js"),
  read("usm_proof_registry.js"),
  read("sec_adapter_model.js"),
  read("backend/execution_capability_registry.py"),
  read("smart_target_workspace.js"),
  read("smart_target_workspace.css"),
  read("platform_actions.js"),
  read("experience_frame_processing.js"),
  read("navigation.js")
]);

assert.deepEqual(manifest.census, { PASS: 0, "REPAIR→PASS": 200, HOLD: 3, "N/A": 51, TOTAL: 254 });
assert.equal(manifest.targets.length, 254);
assert.equal(lifecycle.admittedTargetCount, 200);
assert.equal(lifecycle.lifecyclePassCount, 200);
assert.equal(lifecycle.lifecycleFailCount, 0);
assert.ok(lifecycle.targets.every(row => row.ugoCoordinatesUnchanged === true));

const contractNames = (await readdir("backend/target_execution_contracts/contracts"))
  .filter(name => /^qt_printer13_.*\.json$/.test(name));
const contracts = await Promise.all(contractNames.map(name => json(`backend/target_execution_contracts/contracts/${name}`)));
assert.equal(contracts.length, 250);
assert.equal(new Set(contracts.map(contract => contract.contractId)).size, 250, "QT contract identity is unique");
assert.equal(contracts.filter(contract => contract.missionFamily === "targetScoring").length, 200);
assert.equal(contracts.filter(contract => contract.missionFamily === "smartEvidenceCapture").length, 50);
for (const contract of contracts) {
  assert.equal(contract.components.registration.status, "approved");
  assert.equal(contract.executor.id, contract.missionFamily === "targetScoring" ? "declarative-target-score" : "smart-evidence-capture");
  assert.equal(contract.secAdapter.id, contract.missionFamily === "targetScoring" ? "target-scoring-family" : "smart-evidence-family");
  assert.equal(contract.preservationValidator.id, contract.missionFamily === "targetScoring" ? "target-scoring-preservation" : "smart-evidence-preservation");
}

for (const owner of [workspace, actions, processing, navigation]) {
  assert.doesNotMatch(owner, /qt_printer13_product_|Qualification Targets|QT-PRODUCT-/i, "DD universal owner remains QT-neutral");
}
assert.match(adapters, /adapterId: "target-scoring-family"/);
assert.match(adapters, /adapterId: "smart-evidence-family"/);
assert.match(owners, /"targetScoring"/);
assert.match(owners, /"smartEvidenceCapture"/);

for (const source of ["smart_target_workspace.js", "experience_frame_processing.js", "platform_actions.js", "navigation.js"]) {
  assert.match(targetPage, new RegExp(source.replace(".", "\\.")), `QT page inherits ${source}`);
}
assert.match(targetPage, /data-sczn3-workspace="platform-v1"/);
assert.match(targetPage, /data-sczn3-workspace-evidence="true"/);
assert.match(targetPage, /data-sczn3-workspace-actions="true"/);
assert.match(targetPage, /data-sczn3-action-region="platform-v1"/);
assert.match(targetPage, /mobile-platform-menu/);
assert.match(runtime, /SCZN3SmartTargetWorkspace\?\.create/);
assert.match(targetPage, /class="[^"]*precision-tap-viewport[^"]*" id="contractPrecisionTapViewport"/);
assert.match(targetPage, /class="[^"]*precision-tap-plane[^"]*" id="contractPrecisionTapPlane"/);
assert.match(runtime, /SCZN3SmartTargetWorkspace\?\.createPrecisionTap\(/, "QT consumes the existing DD Precision Tap owner");
assert.match(runtime, /class="contract-observation-marker precision-tap-marker"/, "QT observations inherit the shared transparent bullet-hole marker");
assert.match(workspaceCss, /\.precision-tap-marker\{[^}]*background:rgba\(255,255,255,\.08\)/, "shared marker remains see-through");
assert.doesNotMatch(targetCss, /contract-observation-marker\{[^}]*background:/, "QT does not replace the shared marker with an opaque target-specific fill");
assert.match(runtime, /smartTargetWorkspace\?\.bindViewportLifecycle/);
assert.match(runtime, /SCZN3Processing\?\.run/);
assert.match(runtime, /SCZN3Actions\.bind\(byId\("contractSecView"\)/);
assert.match(runtime, /SCZN3SECComponents\.Result/);
assert.match(runtime, /SCZN3SECComponents\.Evidence/);
assert.match(runtime, /SCZN3SECComponents\.Preservation/);
assert.match(runtime, /SCZN3SECReopenAuthority\?\.portableUrl/);
assert.match(usmRegistry, /governed-additive-numeric-region-scoring/, "USM is inherited by governed additive-scoring capability");
assert.doesNotMatch(usmRegistry, /gunfun_22200_b27e_black|qt_printer13_product_/, "USM has no B27E or QT identity gate");

const holds = manifest.targets.filter(row => row.result === "HOLD");
assert.deepEqual(holds.map(row => row.productName).sort(), ["HOSTAGE-2 Paper Target", "HOSTAGE-3 Paper Target", "Shootin Aces Paper Target"].sort());
const capabilities = manifest.targets.reduce((counts, row) => {
  const treatment = row.establishedTreatment || {};
  const capability = treatment.highestTruthfulCapability || treatment.capability || treatment.missionFamily || "UNKNOWN";
  counts[capability] = (counts[capability] || 0) + 1;
  return counts;
}, {});
assert.deepEqual(capabilities, { "Zone / Object Counting": 161, "Evidence Only": 51, Scoring: 41, Zeroing: 1 });

console.log("PASS QT Printer #13 DD Universality comparison");
console.log("PASS 250 generic contracts inherit existing executors/adapters/preservation validators; 1 M16A2 inherits the existing specialized zeroing road");
console.log("PASS shared QT road now inherits DD Workspace, Processing, Actions, Navigation, SEC components, Vault, and portable exact reopen");
console.log("PASS accepted physical floor remains 200 REPAIR→PASS / 51 N/A / 3 protected HOLD");
