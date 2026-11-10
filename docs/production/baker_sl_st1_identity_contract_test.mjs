import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const IDENTITY_PATH = "backend/registries/smart_target_identity_registry.json";
const ATP_PATH = "backend/target_profiles/ATP_BAKER_SL_ST1_PRACTICE_V1.json";
const UGO_PATH = "authority-evidence/baker-sl-st1/BAKER_SL_ST1_UGO_REGISTRATION_V1.json";
const SCORING_PATH = "authority-evidence/baker-sl-st1/BAKER_SL_ST1_SCORING_PROFILE_V1.json";
const [identityBytes, registry, atp, ugo, scoring, targetPageSource, scoringSource] = await Promise.all([
  readFile(IDENTITY_PATH),
  readFile(IDENTITY_PATH, "utf8").then(JSON.parse),
  readFile(ATP_PATH, "utf8").then(JSON.parse),
  readFile(UGO_PATH, "utf8").then(JSON.parse),
  readFile(SCORING_PATH, "utf8").then(JSON.parse),
  readFile("backend/baker_sl_st1_target_page.py", "utf8"),
  readFile("backend/baker_sl_st1_scoring.py", "utf8")
]);
const schema = JSON.parse(await readFile(
  "backend/registries/smart_target_identity_registry.schema.json",
  "utf8"
));
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(schema.properties.registryId.const, "SCZN3-SMART-TARGET-IDENTITY-REGISTRY");
assert.equal(registry.registryId, "SCZN3-SMART-TARGET-IDENTITY-REGISTRY");
assert.equal(registry.schemaVersion, "1.0.0");
assert.equal(registry.publicationStatus, "founder_review");
assert.equal(new Set(registry.records.map(record => record.smartTargetId)).size, registry.records.length);
assert.equal(new Set(registry.records.map(record => record.recordId)).size, registry.records.length);

const matchingBindings = registry.records.filter(record => record.smartTargetId === "BAKER_SL_ST1");
assert.equal(matchingBindings.length, 1, "BAKER_SL_ST1 must have exactly one governed identity binding");
const identity = matchingBindings[0];
assert.equal(identity.recordId, "BAKER_SL_ST1_IDENTITY_V1");
assert.equal(identity.recordType, "smart_target_identity");
assert.equal(identity.recordStatus, "founder_review");
assert.equal(identity.immutableAfterApproval, true);
assert.equal(identity.smartTargetId, "BAKER_SL_ST1");
assert.equal(identity.identityVersion, 1);

assert.deepEqual(identity.printer, {
  printerId: "baker",
  brandName: "Baker Targets",
  businessName: "The Baker Press, Inc."
});
assert.deepEqual(identity.product, {
  productName: "Silhouette Target (USPSA)",
  sku: "SL-ST1",
  bulkSku: "SL-ST1-Bulk",
  productUrl: "https://bakertargets.com/product/silhouette-target-uspsa/",
  countryOfManufacture: "United States",
  sczn3Positioning: "practice"
});

assert.deepEqual(identity.launchVariant, {
  variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE",
  width: 23,
  height: 35,
  unit: "inch",
  materialDescription: "standard white paper",
  identityStatus: "registered",
  runtimeSupportStatus: "unavailable_pending_ugo"
});
assert.equal(identity.deferredVariants.length, 1);
assert.equal(identity.deferredVariants[0].variantId, "BAKER_SL_ST1_17_5X23_HEAVYWEIGHT");
assert.equal(identity.deferredVariants[0].identityStatus, "deferred");
assert.notEqual(identity.deferredVariants[0].variantId, identity.launchVariant.variantId);

assert.deepEqual(identity.productSource, {
  printerProduct: "Baker offered-for-sale product",
  geometrySource: "pending UGO observation",
  scoringModel: "pending product implementation"
});

assert.equal(identity.qrIdentityStrategy.status, "declared_not_implemented");
assert.deepEqual(identity.qrIdentityStrategy.identityTuple, {
  printerId: "baker",
  smartTargetId: "BAKER_SL_ST1",
  variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE",
  identityVersion: 1
});
assert.ok(
  identity.qrIdentityStrategy.rules.every(rule => !/https?:\/\//i.test(rule)),
  "Phase 1 QR strategy must not implement a route"
);

assert.equal(identity.launchCapabilityDeclaration.status, "pending_governed_dependencies");
assert.ok(
  identity.launchCapabilityDeclaration.capabilities.includes(
    "Digital scoring using the product's scoring model"
  )
);
assert.equal(
  identity.unsupportedCapabilityDeclaration.policy,
  "Capabilities not supported by the printer's product are unavailable."
);
assert.deepEqual(identity.runtimeExecution, {
  status: "unavailable",
  blockingDependency: "ugo_observation"
});

// Governed Registry -> ATP -> UGO -> executable authority chain. These checks
// select the exact SL-ST1 identity; unrelated registry records remain valid.
assert.equal(atp.bindings.smartTargetIdentity.artifactId, identity.recordId);
assert.equal(atp.bindings.smartTargetIdentity.relativePath, IDENTITY_PATH);
assert.equal(atp.bindings.smartTargetIdentity.sha256, sha256(identityBytes));
assert.equal(atp.bindings.launchVariant.variantId, identity.launchVariant.variantId);
assert.equal(atp.bindings.launchVariant.identityVersion, identity.identityVersion);
assert.equal(atp.bindings.ugoObservation.artifactId, ugo.registrationId);
assert.equal(atp.bindings.ugoObservation.relativePath, UGO_PATH);
assert.equal(ugo.smartTargetIdentity.recordId, identity.recordId);
assert.equal(ugo.smartTargetIdentity.smartTargetId, identity.smartTargetId);
assert.equal(ugo.smartTargetIdentity.variantId, identity.launchVariant.variantId);
assert.equal(scoring.targetId, identity.smartTargetId);
assert.equal(scoring.variantId, identity.launchVariant.variantId);
assert.equal(scoring.geometryAuthorityId, ugo.registrationId);
assert.match(targetPageSource, /from baker_sl_st1_scoring import BakerSLST1ScoringError, score_canonical_impacts/);
assert.match(targetPageSource, /ATP_PATH = .*ATP_BAKER_SL_ST1_PRACTICE_V1\.json/);
assert.match(targetPageSource, /UGO_PATH = .*BAKER_SL_ST1_UGO_REGISTRATION_V1\.json/);
assert.match(targetPageSource, /IDENTITY_PATH = .*smart_target_identity_registry\.json/);
assert.match(scoringSource, /UGO_PATH = .*BAKER_SL_ST1_UGO_REGISTRATION_V1\.json/);
assert.match(scoringSource, /SCORING_PATH = .*BAKER_SL_ST1_SCORING_PROFILE_V1\.json/);

const serialized = JSON.stringify(identity);
for (const forbidden of [
  "targetProfileId",
  "missionFamily",
  "resultPackageType",
  "registrationPackageId",
  "targetExecutionContractId",
  "publicRoute",
  "experienceUrl"
]) {
  assert.equal(
    Object.prototype.hasOwnProperty.call(identity, forbidden),
    false,
    `Phase 1 identity must not implement ${forbidden}`
  );
  assert.equal(
    new RegExp(`\\"${forbidden}\\"`).test(serialized),
    false,
    `Phase 1 identity descendants must not implement ${forbidden}`
  );
}

console.log("PASS Baker SL-ST1 Phase 1 Smart Target identity contract");
