import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  MFAM_FAMILY_REGISTRY_SOURCE_SHA256,
  resolveMFAMFamilyTargetProfile
} from "./generated_mfam_family_registry.mjs";

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
assert.deepEqual(generatedProfileIds, ["baker_m16a2_25m_zero"]);
assert.equal(resolveMFAMFamilyTargetProfile("rite-in-rain:9125:m16a2-m16a4-front"), null, "candidate family membership cannot create a runtime binding");

console.log("PASS generated M/FAM family registry matches Backend authority and fails closed");

