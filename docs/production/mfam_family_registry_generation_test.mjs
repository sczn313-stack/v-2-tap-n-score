import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  MFAM_FAMILY_REGISTRY_SOURCE_SHA256,
  resolveMFAMFamilyTargetProfile
} from "./generated_mfam_family_registry.mjs";
import { loadFamilyConformanceRegistry, runFamilyAdmissionBatch } from "./mfam_family_conformance.mjs";

const sourceBytes = await readFile("backend/registries/mfam_family_authority.json");
const source = JSON.parse(sourceBytes.toString("utf8"));
const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");

assert.equal(MFAM_FAMILY_REGISTRY_SOURCE_SHA256, sourceHash, "generated runtime projection must match the Backend registry bytes");

const baker = resolveMFAMFamilyTargetProfile("baker_m16a2_25m_zero");
assert(baker, "the executable Baker representation must resolve");
assert.equal(baker.binding.productId, "baker:st-m16a2-m4:m16a2-face");
assert.equal(baker.binding.familyAuthorityPackageId, "MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1");
assert.equal(baker.familyAuthorityPackage.familyId, "mfam_m16a2_a3_standard_25m_300m");
assert.equal(baker.familyAuthorityPackage.universalZeroingCapabilityId, "sczn3-governed-zeroing-road-v1");

const generatedProfileIds = source.targetProfileBindings
  .filter(binding => binding.status === "GOVERNED" && binding.familyAuthorityPackageId)
  .map(binding => binding.targetProfileId);
assert.deepEqual(generatedProfileIds, [
  "baker_m16a2_25m_zero",
  "speedwell_dodm4_m16a2_25m_zero",
  "army_nsn_6920_01_395_2949_m16a2_25m_zero"
  ,"qualification_m16a2_25m_zero"
  ,"gunfun_32120_m16a2_green_25m_zero"
  ,"rite_9125_m16a2_25m_zero"
  ,"national_23075_m16a2_25m_zero"
  ,"alco_ar0_m16a2_25m_zero"
  ,"gunfun_32110_m16a2_red_25m_zero"
  ,"gunfun_82020_m16a2_25m_zero"
  ,"baker_m4_25m_zero"
]);
const speedwell = resolveMFAMFamilyTargetProfile("speedwell_dodm4_m16a2_25m_zero");
const army = resolveMFAMFamilyTargetProfile("army_nsn_6920_01_395_2949_m16a2_25m_zero");
const qualification = resolveMFAMFamilyTargetProfile("qualification_m16a2_25m_zero");
const gunfunGreen = resolveMFAMFamilyTargetProfile("gunfun_32120_m16a2_green_25m_zero");
assert.equal(speedwell.binding.productId, "speedwell:dodm4:two-sided");
assert.equal(army.binding.productId, "army:nsn-6920-01-395-2949:dual-face");
assert.deepEqual(speedwell.familyAuthorityPackage, baker.familyAuthorityPackage);
assert.deepEqual(army.familyAuthorityPackage, baker.familyAuthorityPackage);
assert.deepEqual(qualification.familyAuthorityPackage, baker.familyAuthorityPackage);
assert.deepEqual(gunfunGreen.familyAuthorityPackage, baker.familyAuthorityPackage);
const rite = resolveMFAMFamilyTargetProfile("rite_9125_m16a2_25m_zero");
const national = resolveMFAMFamilyTargetProfile("national_23075_m16a2_25m_zero");
const alco = resolveMFAMFamilyTargetProfile("alco_ar0_m16a2_25m_zero");
const gunfunRed = resolveMFAMFamilyTargetProfile("gunfun_32110_m16a2_red_25m_zero");
for (const record of [rite, national, alco, gunfunRed]) {
  assert(record, "new material-admission binding must resolve");
  assert.deepEqual(record.familyAuthorityPackage, baker.familyAuthorityPackage);
}
const gunfun82020 = resolveMFAMFamilyTargetProfile("gunfun_82020_m16a2_25m_zero");
assert.deepEqual(gunfun82020.familyAuthorityPackage, baker.familyAuthorityPackage);
const bakerM4 = resolveMFAMFamilyTargetProfile("baker_m4_25m_zero");
assert.equal(bakerM4.binding.familyAuthorityPackageId, "MFAM-STANDARD-M16A4-M4-FAMILY-AUTHORITY-v1");
assert.equal(bakerM4.binding.mechanicalAuthorityId, "M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011");
assert.equal(bakerM4.familyAuthorityPackage.universalZeroingCapabilityId, "sczn3-governed-zeroing-road-v1");

const conformance = await loadFamilyConformanceRegistry();
assert.equal(source.familyConformanceRegistry.registryId, conformance.registryId);
const proof = conformance.scaleProof;
const batch = runFamilyAdmissionBatch(conformance, proof.contractId, proof.candidateFaceIds);
assert.equal(batch.candidatesEvaluated, 8);
assert.equal(batch.admitted.length, 8);
assert.equal(batch.held.length, 0);
assert.equal(proof.counts.totalExecutableFamilyBindings, 9);

console.log("PASS generated M/FAM family registry matches Backend authority and fails closed");
