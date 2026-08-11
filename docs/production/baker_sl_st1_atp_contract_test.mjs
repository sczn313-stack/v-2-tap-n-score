import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const ATP_PATH = "backend/target_profiles/ATP_BAKER_SL_ST1_PRACTICE_V1.json";
const IDENTITY_PATH = "backend/registries/smart_target_identity_registry.json";
const UGO_PATH = "authority-evidence/baker-sl-st1/BAKER_SL_ST1_UGO_REGISTRATION_V1.json";

const [atp, schema, identityRegistry, ugo, identityBytes, ugoBytes] = await Promise.all([
  readFile(ATP_PATH, "utf8").then(JSON.parse),
  readFile("backend/target_profiles/product_definition_atp.schema.json", "utf8").then(JSON.parse),
  readFile(IDENTITY_PATH, "utf8").then(JSON.parse),
  readFile(UGO_PATH, "utf8").then(JSON.parse),
  readFile(IDENTITY_PATH),
  readFile(UGO_PATH)
]);

const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(schema.properties.schemaVersion.const, "product-definition-atp-v1");
assert.equal(atp.schemaVersion, "product-definition-atp-v1");
assert.equal(atp.atpId, "ATP_BAKER_SL_ST1_PRACTICE_V1");
assert.equal(atp.targetProfileId, "baker_sl_st1_practice");
assert.equal(atp.targetProfileVersion, 1);
assert.equal(atp.status, "founder_review");

const identity = identityRegistry.records.find(record => record.smartTargetId === "BAKER_SL_ST1");
assert.ok(identity, "Bound Smart Target identity must exist");
assert.equal(atp.bindings.smartTargetIdentity.artifactId, identity.recordId);
assert.equal(atp.bindings.smartTargetIdentity.relativePath, IDENTITY_PATH);
assert.equal(atp.bindings.smartTargetIdentity.sha256, sha256(identityBytes));
assert.equal(atp.bindings.launchVariant.variantId, identity.launchVariant.variantId);
assert.equal(atp.bindings.launchVariant.identityVersion, identity.identityVersion);
assert.notEqual(atp.bindings.launchVariant.variantId, identity.deferredVariants[0].variantId);

assert.equal(atp.bindings.ugoObservation.artifactId, ugo.registrationId);
assert.equal(atp.bindings.ugoObservation.relativePath, UGO_PATH);
assert.equal(atp.bindings.ugoObservation.sha256, sha256(ugoBytes));
assert.equal(ugo.smartTargetIdentity.smartTargetId, identity.smartTargetId);
assert.equal(ugo.smartTargetIdentity.variantId, identity.launchVariant.variantId);

assert.deepEqual(atp.scoringModel, {
  source: "printer_product",
  status: "founder_verification_pending",
  numericScoring: "unavailable_pending_founder_verification",
  verifiedRules: []
});
assert.equal(atp.equipmentPolicy.restrictions.length, 0);
assert.equal(atp.runtimeExecution.status, "unavailable");

const ugoFeatureIds = new Set([
  ...ugo.observableGeometry.boundaries,
  ...ugo.observableGeometry.printedBoundaryRegions,
  ...ugo.observableGeometry.printedTextAndSymbols
].map(feature => feature.featureId));
for (const featureId of atp.traceability.ugoFeatureIds) {
  assert.ok(ugoFeatureIds.has(featureId), `ATP feature ${featureId} must exist in UGO Observation`);
}

const requiredFeatureIds = new Set([
  atp.productDefinitions.observableTargetSurface.outerPrintedBoundaryFeatureId,
  ...atp.productDefinitions.observableTargetSurface.nestedPrintedBoundaryFeatureIds,
  atp.productDefinitions.printedIdentifiers.featureId,
  atp.productDefinitions.printedScoringTable.boundaryFeatureId,
  atp.productDefinitions.printedScoringTable.textFeatureId,
  atp.productDefinitions.printedForm.boundaryFeatureId,
  atp.productDefinitions.printedForm.textFeatureId
]);
for (const relationship of atp.productDefinitions.observableTargetSurface.boundaryRelationships) {
  requiredFeatureIds.add(relationship.containerFeatureId);
  relationship.containedFeatureIds.forEach(featureId => requiredFeatureIds.add(featureId));
}
for (const featureId of requiredFeatureIds) {
  assert.ok(ugoFeatureIds.has(featureId), `Product definition ${featureId} must trace to UGO`);
  assert.ok(atp.traceability.ugoFeatureIds.includes(featureId), `${featureId} must be declared traceable`);
}

const serialized = JSON.stringify(atp);
for (const forbiddenKey of [
  "missionFamily",
  "resultPackageType",
  "publicRoute",
  "experienceUrl",
  "registrationPackageId",
  "targetExecutionContractId",
  "equipmentRequirements",
  "scoringProfileId"
]) {
  assert.equal(
    new RegExp(`\\"${forbiddenKey}\\"`).test(serialized),
    false,
    `Phase 3 ATP must not implement ${forbiddenKey}`
  );
}
assert.doesNotMatch(serialized, /USPSA competition|official USPSA|hit factor|power factor/i);
assert.deepEqual(atp.scoringModel.verifiedRules, []);
assert.ok(atp.capabilityDeclaration.unavailable.includes("numeric scoring"));
assert.ok(atp.capabilityDeclaration.unavailable.includes("runtime evidence classification"));

console.log("PASS Baker SL-ST1 Phase 3 product-definition ATP contract");
