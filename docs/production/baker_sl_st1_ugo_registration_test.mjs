import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const registration = JSON.parse(await readFile(
  "authority-evidence/baker-sl-st1/BAKER_SL_ST1_UGO_REGISTRATION_V1.json",
  "utf8"
));
const identityRegistry = JSON.parse(await readFile(
  "backend/registries/smart_target_identity_registry.json",
  "utf8"
));
const evidenceBytes = await readFile(
  "authority-evidence/baker-sl-st1/BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp"
);
const reviewOverlay = await readFile(
  "founder-review/BAKER_SL_ST1_UGO_REGISTRATION_V1_OVERLAY.svg",
  "utf8"
);

function webpDimensions(bytes) {
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  const marker = Buffer.from([0x9d, 0x01, 0x2a]);
  const markerOffset = bytes.indexOf(marker);
  assert.notEqual(markerOffset, -1, "VP8 dimension marker must exist");
  return {
    width: bytes.readUInt16LE(markerOffset + 3) & 0x3fff,
    height: bytes.readUInt16LE(markerOffset + 5) & 0x3fff
  };
}

assert.equal(registration.registrationSchema, "ugo-observable-geometry-v1");
assert.equal(registration.registrationId, "UGO_BAKER_SL_ST1_23X35_V1");
assert.equal(registration.registrationStatus, "founder_review");
assert.equal(registration.phaseName, "UGO Observation");
assert.equal(
  registration.measurementFramework,
  "UGO establishes SCZN3's governed measurement framework. No claim is made about the printer's manufacturing geometry beyond what is observable in the printed product."
);

const identity = identityRegistry.records.find(
  record => record.smartTargetId === registration.smartTargetIdentity.smartTargetId
);
assert.ok(identity, "Phase 1 identity must exist");
assert.equal(registration.smartTargetIdentity.recordId, identity.recordId);
assert.equal(registration.smartTargetIdentity.identityVersion, identity.identityVersion);
assert.equal(registration.smartTargetIdentity.variantId, identity.launchVariant.variantId);
assert.notEqual(
  registration.smartTargetIdentity.variantId,
  identity.deferredVariants[0].variantId
);

const digest = createHash("sha256").update(evidenceBytes).digest("hex");
assert.equal(digest, registration.sourceEvidence.sha256);
assert.deepEqual(webpDimensions(evidenceBytes), {
  width: registration.sourceEvidence.pixelWidth,
  height: registration.sourceEvidence.pixelHeight
});

assert.equal(registration.sourceEvidence.qualification.status, "qualifying");
assert.equal(registration.sourceEvidence.qualification.paperBoundary, "not_observable");
assert.equal(registration.sourceEvidence.qualification.physicalCoordinateMapping, "not_claimed");
assert.equal(registration.coordinateSystem.physicalUnit, "unavailable");
assert.equal(registration.observableGeometry.featureMeaning, "unassigned");

const widthDenominator = registration.sourceEvidence.pixelWidth - 1;
const heightDenominator = registration.sourceEvidence.pixelHeight - 1;
for (const boundary of registration.observableGeometry.boundaries) {
  assert.equal(boundary.geometryType, "closed_polyline");
  assert.ok(boundary.points.length >= 4);
  assert.ok(boundary.traceTolerancePx > 0);
  for (const point of boundary.points) {
    assert.ok(point.xPx >= 0 && point.xPx <= widthDenominator);
    assert.ok(point.yPx >= 0 && point.yPx <= heightDenominator);
    assert.ok(Math.abs(point.xNorm - point.xPx / widthDenominator) < 0.000001);
    assert.ok(Math.abs(point.yNorm - point.yPx / heightDenominator) < 0.000001);
  }
}

assert.ok(registration.observableGeometry.printedBoundaryRegions.length >= 3);
assert.ok(registration.observableGeometry.printedTextAndSymbols.length >= 4);
for (const feature of [
  ...registration.observableGeometry.boundaries,
  ...registration.observableGeometry.printedBoundaryRegions
]) {
  assert.match(reviewOverlay, new RegExp(`id=["']${feature.featureId}["']`));
}
assert.doesNotMatch(reviewOverlay, /scoring.?zone|scoreValue|missionFamily/i);
assert.equal(registration.registrationTolerances.physicalMapping, "not_claimed");
assert.equal(
  registration.registrationTolerances.runtimeEvidenceRegistration,
  "not_implemented_in_phase_2"
);

assert.deepEqual(registration.validation, {
  sourceHashVerified: true,
  sourceDimensionsVerified: true,
  completeObservableInkPresent: true,
  paperBoundaryRequired: false,
  physicalMappingClaimed: false,
  featureMeaningAssigned: false,
  scoringIntroduced: false,
  runtimeRegistrationIntroduced: false,
  deferredVariantAccepted: false,
  result: "pass_for_founder_review"
});
assert.deepEqual(registration.runtimeExecution, {
  status: "unavailable",
  reason: "Phase 2 observes geometry only."
});

const serialized = JSON.stringify(registration);
for (const forbidden of [
  "scoringZones",
  "scoreValue",
  "targetProfileId",
  "missionFamily",
  "resultPackageType",
  "registrationPackageId",
  "targetExecutionContractId",
  "publicRoute",
  "experienceUrl"
]) {
  assert.equal(
    new RegExp(`\\"${forbidden}\\"`).test(serialized),
    false,
    `UGO registration must not implement ${forbidden}`
  );
}

console.log("PASS Baker SL-ST1 Phase 2 UGO observable-geometry registration");
