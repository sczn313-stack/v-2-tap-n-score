# Draft Result-Package Schema — Baker Firearm Dart Challenge

**Schema ID:** `bakerFirearmDartChallengeResultV1`
**Proposed package type:** `classificationResult`
**Status:** Contract proposal; not registered or executable

## Current unavailable package shape

This illustrative JSON is a field contract, not a sample authoritative result. Numeric scores remain null until rules are approved.

```json
{
  "ok": false,
  "status": "authority_unavailable",
  "reason": "scoring_authority_unapproved",
  "resultSource": "backend",
  "target_profile_id": "baker_gf_db",
  "target_profile_version": "draft-0.1",
  "mission_family": "classification",
  "mission_variant": "bakerFirearmDartChallenge",
  "resultPackageType": "classificationResult",
  "resultSchemaId": "bakerFirearmDartChallengeResultV1",
  "registrationPackageId": null,
  "canonicalAsset": null,
  "evidenceHash": null,
  "expectedImpactCount": 3,
  "impactClassifications": [],
  "turn": {
    "classifiedImpactCount": 0,
    "rawScore": null,
    "classificationStatus": "unavailable",
    "authorityStatus": "authority_unavailable"
  },
  "authorityTrace": {
    "geometryProfileId": "baker_gf_db_geometry_draft_0_1",
    "scoringProfileId": "baker_gf_db_scoring_draft_0_1",
    "missionProfileId": "baker_firearm_dart_challenge_draft_0_1",
    "authorityVersion": "draft-0.1"
  }
}
```

## Required authoritative success contract

Once separately approved and implemented, a calculated package would require all of the following:

- `ok === true`
- `status === "calculated"`
- `resultSource === "backend"`
- exact target, mission, mission-variant, result-package, and schema identities
- supported ATP and matching approved Registration Package
- canonical asset identity, hash, dimensions, and coordinate-system version
- governed evidence hash and transformation trace
- exactly three unique observation inputs and exactly three result classifications
- stable `shot_id` preserved for every impact
- finite backend-owned numeric score for every classified impact
- finite backend-owned turn total equal to the governed sum
- geometry, scoring, mission, and authority versions in `authorityTrace`

## Per-impact contract

```json
{
  "shot_id": "shot-1",
  "observedCoordinate": { "x_px": 0, "y_px": 0 },
  "canonicalCoordinate": { "u": 0.0, "v": 0.0 },
  "radialDistance": 0.0,
  "clockwiseAngleDegrees": null,
  "sectorNumber": null,
  "radialBand": "bull_core",
  "zoneValue": null,
  "multiplier": null,
  "rawScore": null,
  "classificationStatus": "unavailable",
  "authorityStatus": "authority_unavailable"
}
```

The displayed zeros in the coordinate example are observations, not scores. Null numeric authority must never be coerced to zero.

## Unavailable package requirements

An unavailable response must preserve enough identity to explain the refusal, include a stable reason code, set `ok` false, omit plausible score totals, and never substitute another target or result renderer.

Minimum refusal reasons include:

- `target_not_registered`
- `target_not_supported`
- `mission_family_not_registered`
- `result_package_not_registered`
- `result_package_not_authorized_by_mission_family`
- `registration_missing`
- `canonical_asset_missing`
- `canonical_asset_hash_mismatch`
- `geometry_authority_unapproved`
- `scoring_authority_unapproved`
- `evidence_outside_registration`
- `boundary_human_review_required`
- `impact_count_mismatch`
- `duplicate_shot_id`

## Forbidden zeroing fields

This result package must not contain or derive:

```text
pointOfImpact, poib, groupCenter, correctionVector,
inchesToMOA, moa, mrad, clickValue, clicks,
opticAdjustment, adjustmentDirection, zeroingGuidance
```

Their absence preserves the independent Zeroing Authority boundary.
