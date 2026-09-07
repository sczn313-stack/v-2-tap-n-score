import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  evaluateFamilyCandidate,
  loadFamilyConformanceRegistry,
  runFamilyAdmissionBatch,
  verifyFamilyConformanceRegistry
} from "./mfam_family_conformance.mjs";

const authority = JSON.parse(await readFile("backend/registries/mfam_family_authority.json", "utf8"));
const schema = JSON.parse(await readFile("backend/registries/mfam_family_conformance.schema.json", "utf8"));
const registry = await verifyFamilyConformanceRegistry(authority);
assert.equal(schema.properties.schemaId.const, registry.schemaId);
assert(schema.required.includes("contracts"));
assert(schema.required.includes("evaluations"));
const contract = registry.contracts[0];
assert.equal(contract.contractId, "MFAM-STANDARD-M16A2-A3-FAMILY-CONFORMANCE-v1");
assert.equal(contract.requiredGates.length, 6);
assert.deepEqual(
  contract.requiredGates.filter((gate) => gate.scope === "REPRESENTATION_SPECIFIC").map((gate) => gate.gateId),
  ["representation_landmarks", "registration_orientation"]
);

const baker = evaluateFamilyCandidate(registry, "face-003");
assert.equal(baker.disposition, "ADMITTED");
assert.equal(baker.targetProfileId, "baker_m16a2_25m_zero");
assert.deepEqual(baker.missingGateIds, []);

const batch = runFamilyAdmissionBatch(registry, contract.contractId, registry.scaleProof.candidateFaceIds);
assert.equal(batch.candidatesEvaluated, 8);
assert.equal(batch.admitted.length, 0);
assert.equal(batch.held.length, 8);
assert(batch.held.every((candidate) => candidate.irreducibleMissingFacts.length === 1));

const speedwell = evaluateFamilyCandidate(registry, "face-020");
assert.deepEqual(speedwell.missingGateIds, ["registration_orientation"]);
assert(speedwell.gateResults.filter((gate) => gate.status === "PROVEN").length === 5);

const army = evaluateFamilyCandidate(registry, "face-032");
assert.deepEqual(army.missingGateIds, ["registration_orientation"]);
assert.match(army.irreducibleMissingFacts[0], /flat production face/);

const gunfun = evaluateFamilyCandidate(registry, "face-025");
assert(gunfun.missingGateIds.includes("physical_geometry_pitch"));
assert(gunfun.missingGateIds.includes("registration_orientation"));

assert.equal(registry.scaleProof.counts.productSpecificZeroingImplementations, 0);
assert.equal(registry.scaleProof.counts.universalZeroingRoadsAdded, 0);
assert.equal(registry.scaleProof.familyLeverage, 1);
assert.equal(registry.scaleProof.admissionLeverage, 0);

console.log("PASS reusable M/FAM Target Family Conformance/Admission Pattern");
console.log("PASS 8 Standard M16A2/A3 HOLDs evaluated by one six-gate contract");
console.log("PASS no candidate admitted without exact representation registration");
