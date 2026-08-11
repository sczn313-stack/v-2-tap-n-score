import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const registry = JSON.parse(await readFile(
  "backend/registries/smart_target_identity_registry.json",
  "utf8"
));
const schema = JSON.parse(await readFile(
  "backend/registries/smart_target_identity_registry.schema.json",
  "utf8"
));

assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(schema.properties.registryId.const, "SCZN3-SMART-TARGET-IDENTITY-REGISTRY");
assert.equal(registry.registryId, "SCZN3-SMART-TARGET-IDENTITY-REGISTRY");
assert.equal(registry.schemaVersion, "1.0.0");
assert.equal(registry.publicationStatus, "founder_review");
assert.equal(registry.records.length, 1);
assert.equal(new Set(registry.records.map(record => record.smartTargetId)).size, registry.records.length);

const identity = registry.records[0];
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
