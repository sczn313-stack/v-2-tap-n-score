import unittest

from .weapon_equipment_registry import (
    REGISTRY,
    get_adjustment_profile,
    resolve_target_adjustment_authority,
)


M4_PROFILE_ID = "M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011"
M16A2_PROFILE_ID = "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
FORT_BENNING_AUTHORITY_ID = "M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01"


def _reusable_relationship(profile_id, equipment_configuration_id, target_profile_id):
    return {
        "relationshipId": f"TEST-{target_profile_id}",
        "equipmentConfigurationId": equipment_configuration_id,
        "targetProfileId": target_profile_id,
        "authoritySelectionType": "reusable_adjustment_profile",
        "adjustmentProfileId": profile_id,
        "targetScopedAuthorityRecordId": None,
    }


class EquipmentAdjustmentProfileTests(unittest.TestCase):
    def test_reusable_m4_profile_resolves_without_target_override(self):
        selection = resolve_target_adjustment_authority(
            _reusable_relationship(
                M4_PROFILE_ID,
                "M4-M4A1-DCH-FSP",
                "BAKER_M4_PROFILE_PENDING",
            )
        )
        self.assertEqual(selection["selectionType"], "reusable_adjustment_profile")
        self.assertIsNone(selection["authorityRecord"])
        front_sight = next(
            control
            for control in selection["adjustmentProfile"]["controls"]
            if control["controlId"] == "M4-STANDARD-FRONT-SIGHT-POST"
        )
        self.assertEqual(front_sight["movementPerClick"], 1.5)


    def test_reusable_m16a2_profile_separates_correction_from_drum_setting(self):
        selection = resolve_target_adjustment_authority(
            _reusable_relationship(
                M16A2_PROFILE_ID,
                "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
                "BAKER_M16A2_PROFILE_PENDING",
            )
        )
        controls = {
            control["controlId"]: control
            for control in selection["adjustmentProfile"]["controls"]
        }
        self.assertEqual(controls["M16A2-STANDARD-FRONT-SIGHT-POST"]["movementPerClick"], 1.25)
        self.assertEqual(controls["M16A2-REAR-WINDAGE-KNOB"]["movementPerClick"], 0.5)
        self.assertEqual(controls["M16A2-REAR-ELEVATION-DRUM"]["movementPerClick"], 1.0)
        self.assertEqual(controls["M16A2-REAR-ELEVATION-DRUM"]["operationPurpose"], "configuration_setting")
        self.assertNotIn("one click past 300", str(selection["adjustmentProfile"]).lower())


    def test_fort_benning_selects_only_target_scoped_1_75_authority(self):
        record = next(
            item for item in REGISTRY["records"]
            if item["recordId"] == FORT_BENNING_AUTHORITY_ID
        )
        selection = resolve_target_adjustment_authority(record["targetZeroRelationship"])
        self.assertEqual(selection["selectionType"], "target_scoped_authority")
        self.assertIsNone(selection["adjustmentProfile"])
        self.assertEqual(selection["authorityRecord"]["axes"]["elevation"]["movementPerClick"], 1.75)
        reusable = get_adjustment_profile(M4_PROFILE_ID)
        reusable_elevation = next(
            control for control in reusable["controls"]
            if control["axis"] == "elevation"
        )
        self.assertEqual(reusable_elevation["movementPerClick"], 1.5)


    def test_ambiguous_or_mismatched_selection_fails_closed(self):
        relationship = _reusable_relationship(
            M4_PROFILE_ID,
            "M4-M4A1-DCH-FSP",
            "BAKER_M4_PROFILE_PENDING",
        )
        self.assertIsNone(resolve_target_adjustment_authority({
            **relationship,
            "targetScopedAuthorityRecordId": FORT_BENNING_AUTHORITY_ID,
        }))
        self.assertIsNone(resolve_target_adjustment_authority({
            **relationship,
            "equipmentConfigurationId": "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
        }))
        self.assertIsNone(resolve_target_adjustment_authority({}))


if __name__ == "__main__":
    unittest.main()
