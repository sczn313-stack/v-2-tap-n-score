import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  WEAPON_EQUIPMENT_REGISTRY,
  getAdjustmentProfile,
  resolveTargetAdjustmentAuthority
} from "./generated_weapon_equipment_registry.mjs";

const M4_PROFILE_ID = "M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011";
const M16A2_PROFILE_ID = "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011";
const M16A4_PROFILE_ID = "M16A4-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011";
const FORT_BENNING_AUTHORITY_ID = "M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01";

const registrySchema = JSON.parse(await readFile(
  "backend/registries/military_weapon_equipment_registry.schema.json",
  "utf8"
));
assert.ok(registrySchema.required.includes("adjustmentProfiles"));
assert.ok(registrySchema.$defs.adjustmentProfile);
assert.ok(registrySchema.$defs.adjustmentControl);
assert.ok(registrySchema.$defs.observerView);
assert.equal(registrySchema.$defs.targetZeroRelationship.oneOf.length, 2);

assert.equal(WEAPON_EQUIPMENT_REGISTRY.schemaVersion, "1.1.0");
assert.equal(WEAPON_EQUIPMENT_REGISTRY.adjustmentProfiles.length, 3);

for (const profile of WEAPON_EQUIPMENT_REGISTRY.adjustmentProfiles) {
  assert.equal(profile.recordType, "equipment_adjustment_profile");
  assert.equal(profile.status, "proven");
  assert.equal(profile.authorityOwner, "Equipment Authority");
  assert.ok(profile.equipmentConfigurationId);
  assert.ok(profile.applicabilityScope.scopeRule.includes("Target Authority"));
  assert.ok(profile.sourceDocumentation.length > 0);
  assert.equal(profile.sourceDocumentation[0].sourceSha256, "56c9c9c32e1f19aaff4c8f6bf220208ce54960dadd62dff8a4b59db0b5a1d532");
  for (const control of profile.controls) {
    assert.ok(control.controlId);
    assert.ok(["windage", "elevation"].includes(control.axis));
    assert.ok(control.operationPurpose);
    assert.ok(control.movementPerClick > 0);
    assert.equal(control.movementUnit, "MOA");
    assert.equal(control.status, "proven");
    assert.ok(control.effectiveInterval.from);
    assert.ok(control.provenance.length > 0);
    assert.ok(Array.isArray(control.conflicts));
    assert.equal(control.directions.length, 2);
    for (const direction of control.directions) {
      assert.ok(direction.desiredPoiMovement);
      assert.ok(["CLOCKWISE", "COUNTERCLOCKWISE"].includes(direction.rotation));
      assert.ok(direction.observerView.position);
      assert.ok(direction.observerView.viewingAxis);
    }
  }
}

const bakerM4Relationship = {
  relationshipId: "BAKER-M4-PROPOSED-TARGET-ZERO-RELATIONSHIP",
  equipmentConfigurationId: "M4-M4A1-DCH-FSP",
  targetProfileId: "BAKER_M4_PROFILE_PENDING",
  authoritySelectionType: "reusable_adjustment_profile",
  adjustmentProfileId: M4_PROFILE_ID,
  targetScopedAuthorityRecordId: null
};
const bakerM4Selection = resolveTargetAdjustmentAuthority(bakerM4Relationship);
assert.equal(bakerM4Selection.selectionType, "reusable_adjustment_profile");
assert.equal(bakerM4Selection.adjustmentProfile.adjustmentProfileId, M4_PROFILE_ID);
assert.equal(bakerM4Selection.adjustmentProfile.controls.find((control) => control.controlId === "M4-STANDARD-FRONT-SIGHT-POST").movementPerClick, 1.5);

const bakerM16A2Relationship = {
  relationshipId: "BAKER-M16A2-PROPOSED-TARGET-ZERO-RELATIONSHIP",
  equipmentConfigurationId: "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
  targetProfileId: "BAKER_M16A2_PROFILE_PENDING",
  authoritySelectionType: "reusable_adjustment_profile",
  adjustmentProfileId: M16A2_PROFILE_ID,
  targetScopedAuthorityRecordId: null
};
const bakerM16A2Selection = resolveTargetAdjustmentAuthority(bakerM16A2Relationship);
assert.equal(bakerM16A2Selection.selectionType, "reusable_adjustment_profile");
assert.equal(bakerM16A2Selection.adjustmentProfile.adjustmentProfileId, M16A2_PROFILE_ID);
assert.equal(bakerM16A2Selection.adjustmentProfile.controls.find((control) => control.controlId === "M16A2-STANDARD-FRONT-SIGHT-POST").movementPerClick, 1.25);
const m16A2RearDrum = bakerM16A2Selection.adjustmentProfile.controls.find((control) => control.controlId === "M16A2-REAR-ELEVATION-DRUM");
assert.equal(m16A2RearDrum.movementPerClick, 1);
assert.equal(m16A2RearDrum.operationPurpose, "configuration_setting");
assert.doesNotMatch(JSON.stringify(bakerM16A2Selection.adjustmentProfile), /one click past 300|return one click to 300/i);

const m16A4Profile = getAdjustmentProfile(M16A4_PROFILE_ID);
assert.equal(m16A4Profile.equipmentConfigurationId, "M16A4-STANDARD-IRON-FSP-REAR-DRUM");
assert.equal(m16A4Profile.controls.find((control) => control.axis === "elevation" && control.operationPurpose === "correction").movementPerClick, 1.25);
assert.equal(m16A4Profile.controls.find((control) => control.axis === "windage").movementPerClick, 0.5);
assert.equal(m16A4Profile.controls.find((control) => control.operationPurpose === "configuration_setting").movementPerClick, 0.5);

const fortBenningRecord = WEAPON_EQUIPMENT_REGISTRY.records.find((record) => record.recordId === FORT_BENNING_AUTHORITY_ID);
const fortBenningSelection = resolveTargetAdjustmentAuthority(fortBenningRecord.targetZeroRelationship);
assert.equal(fortBenningSelection.selectionType, "target_scoped_authority");
assert.equal(fortBenningSelection.adjustmentProfile, null);
assert.equal(fortBenningSelection.authorityRecord.recordId, FORT_BENNING_AUTHORITY_ID);
assert.equal(fortBenningSelection.authorityRecord.axes.elevation.movementPerClick, 1.75);
assert.notEqual(fortBenningSelection.authorityRecord.axes.elevation.movementPerClick, getAdjustmentProfile(M4_PROFILE_ID).controls.find((control) => control.axis === "elevation").movementPerClick);

assert.equal(resolveTargetAdjustmentAuthority({...bakerM4Relationship, targetScopedAuthorityRecordId: FORT_BENNING_AUTHORITY_ID}), null);
assert.equal(resolveTargetAdjustmentAuthority({...bakerM4Relationship, equipmentConfigurationId: "M16A2-STANDARD-IRON-FSP-REAR-DRUM"}), null);
assert.equal(resolveTargetAdjustmentAuthority({...fortBenningRecord.targetZeroRelationship, targetProfileId: "wrong-target"}), null);
assert.equal(resolveTargetAdjustmentAuthority({...fortBenningRecord.targetZeroRelationship, adjustmentProfileId: M4_PROFILE_ID}), null);
assert.equal(resolveTargetAdjustmentAuthority({}), null);

console.log("PASS Equipment Authority adjustment profiles and exclusive target applicability selection");
