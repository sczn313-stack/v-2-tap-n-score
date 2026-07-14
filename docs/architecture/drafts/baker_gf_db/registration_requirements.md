# Registration Requirements — Baker GF-DB

**Current registration:** Missing
**Current execution result:** `authority_unavailable`

## Baker source package required

- Original production PDF or equivalent immutable production artwork
- Source file version, publication date, and provenance
- Printed page width and height
- Scoring-circle diameter
- Center location in production coordinates
- Exact radial dimensions for every visible ring and band
- Exact sector boundaries, angular orientation, and line widths
- Approved scoring-surface and non-scoring-surface definitions
- Print scale, crop, bleed, and production tolerances
- Orientation and any calibration/registration marks
- Official product rules or written approval of independently authored SCZN3 challenge rules
- Permission to create, validate, distribute, and maintain the governed digital target profile
- Named Baker and SCZN3 approval owners

## SCZN3 Registration Package required

The approved package must contain at least:

| Field | Required meaning |
|---|---|
| `registration_package_id` | Immutable registration identity |
| `registration_package_version` | Immutable contract version |
| `registration_status` | Approved for execution |
| `target_profile_id` | Exact `baker_gf_db` binding |
| `target_profile_version` | Exact approved ATP version |
| `canonical_asset_id` | Stable production-asset identity |
| `canonical_asset_sha256` | SHA-256 of exact approved bytes |
| `media_type` | Approved format |
| `image_width_px` / `image_height_px` | Exact canonical raster dimensions, if rasterized |
| `coordinate_system_version` | Meaning and version of observation coordinates |
| `coordinate_origin` / axes | Explicit orientation |
| `canonical_center_px` | Approved center |
| `physical_width` / `physical_height` | Approved print dimensions and units |
| `scoring_circle_diameter` | Approved physical scoring extent |
| `geometry_profile_ref` | Approved geometry profile |
| `transform_model` | Canonical-to-evidence registration method |
| `transform_tolerances` | Crop, scale, rotation, perspective, and residual thresholds |
| `authority_source` | Baker/SCZN3 provenance |
| `approved_by` / `approved_at` | Accountable approval record |

## Photographed-target registration

A photograph cannot become authoritative merely because it resembles the target. A future registration flow must:

1. Resolve the exact ATP and approved canonical asset.
2. Bind the photograph to a session and evidence hash.
3. Detect or receive governed registration correspondences.
4. Calculate a transform into the canonical target plane.
5. Validate crop completeness, orientation, scale, perspective, distortion, and residual error against approved tolerances.
6. Confirm the full required scoring surface is represented.
7. Reject mismatched, partial, ambiguous, or out-of-tolerance evidence.
8. Preserve the transform and validation trace in the result package.

The supplied screenshot has no approved registration marks, physical scale, or transform tolerance. It cannot register photographed targets for production scoring.

## Minimum evidence to move from draft to supported

1. Baker-approved production artifact and permission.
2. Immutable asset hash and versioned Registration Package.
3. Approved physical and canonical geometry with tolerances.
4. Approved independent firearm rules, numeric values, and boundary policies.
5. Registered mission family, result-package type, and schema.
6. Physical print samples verified against approved dimensions.
7. Photographed-evidence registration validated across representative capture conditions.
8. Backend classification and scoring tests, including boundaries and malformed inputs.
9. Explicit Zeroing Authority isolation tests.
10. Strict live/saved package validation and Universal SEC evidence behavior.
11. Named approval and status promotion from validation to supported.
