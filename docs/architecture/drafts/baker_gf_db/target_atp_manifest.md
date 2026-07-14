# Draft Target ATP Manifest — Baker GF-DB

**Artifact status:** Non-executable proposal
**Authority status:** Unavailable

The following YAML-shaped record documents the proposed ATP contract. It is not a runtime manifest and must not be loaded by the target registry.

```yaml
target_profile_id: baker_gf_db
target_profile_version: draft-0.1
target_name: Baker Dartboard Target
target_family: Baker Firearm Challenge
target_type: radial-sector-firearm-classification
manufacturer: Baker Targets
manufacturer_product_code: GF-DB

lifecycle_status: draft
supported_status: unavailable
geometry_authority_status: validation
scoring_authority_status: validation

mission_family: classification
mission_variant: bakerFirearmDartChallenge
result_package_type: classificationResult
result_schema_id: bakerFirearmDartChallengeResultV1

registration_package_id: null
geometry_profile_ref: baker_gf_db_geometry_draft_0_1
scoring_profile_ref: baker_gf_db_scoring_draft_0_1
mission_profile_ref: baker_firearm_dart_challenge_draft_0_1

evidence_model:
  observation_type: firearm_bullet_hole_coordinates
  accepted_canonical_asset_ids: []
  photographed_target_registration: required
  exact_asset_binding: required
  ambiguous_boundary_behavior: human_review_required

authority_source:
  type: reference_image_only
  supplied_image_sha256: adc16b9633d99fbd172565b965f40747c0f82329e3d49f9bf47a19ee01d02b4e
  production_authority: false
  baker_approval: pending

execution_guards:
  draft_execution_request: authority_unavailable
  missing_canonical_asset: authority_unavailable
  asset_hash_mismatch: authority_unavailable
  missing_registration: authority_unavailable
  unapproved_geometry: authority_unavailable
  unapproved_scoring: authority_unavailable
  ambiguous_boundary: authority_unavailable
  missing_or_conflicting_mission_family: authority_unavailable
  zeroing_route_requested: authority_unavailable
```

## Contract notes

- The ATP describes the target and references authority; it does not define a session game.
- `classification` and `classificationResult` are proposed identities, not current registry facts.
- Empty `accepted_canonical_asset_ids` and null `registration_package_id` intentionally prevent execution.
- `human_review_required` may describe an ambiguous classification, but the enclosing scoring request still returns `authority_unavailable` while this ATP is a draft.
- No frontend or saved-record field may override any unavailable status.
- The supplied screenshot hash identifies audit evidence only. It is not an approved canonical-asset hash.
