# SCZN3 Target Authority — Phase 1

**Version:** 1.0

**Status:** Architecture Locked

**Implementation:** Pending

**Governing architecture:** [Smart Target Catalog](./SMART_TARGET_CATALOG.md)

## Purpose

Phase 1 establishes the smallest authoritative path from a registered target asset and shooter-marked shot coordinates to a backend-owned scoring result.

Phase 1 proves one target first: GSSF AC-1.

It does not create a general image-recognition system, printer-onboarding system, QR catalog, or photographic target-registration workflow.

## Governing rules

1. A target is identified by an Authoritative Target Profile, not by a filename or visual similarity.
2. A digital asset has no authority until an approved Registration Package binds its identity, hash, dimensions, and coordinate system.
3. Shot coordinates carry observations only. They do not carry classifications or penalties.
4. The backend resolves the target and mission before performing scoring.
5. Target geometry classifies the shot; the scoring profile supplies the penalty.
6. Missing, malformed, mismatched, or unregistered authority produces refusal, not a plausible score.
7. Shot IDs must survive capture, classification, scoring breakdown, saved records, and SEC rendering.
8. Saved or frontend fields cannot override backend classifications.
9. GSSF routing must not enter the Baker zeroing path.
10. Phase 1 authority is restricted to the exact registered canonical asset.

## SCZN3 target-authority pipeline

```text
Authoritative Target Profile
        │
        │ identifies target, mission, and result contract
        ▼
Registration Package
        │
        │ binds approved asset bytes to canonical coordinates
        ▼
Shooter opens the registered target asset
        │
        │ records ordered shot IDs and pixel coordinates
        ▼
Shot Observation Request
        │
        │ target + mission + registered asset + evidence + shots
        ▼
Backend target/profile resolution
        │
        ├── reject unknown or unavailable target
        ├── reject mission mismatch
        ├── reject result-package mismatch
        └── reject incomplete authority
        ▼
Registration validation
        │
        ├── asset ID
        ├── SHA-256
        ├── dimensions
        └── coordinate-system version
        ▼
Backend coordinate transformation
        │
        │ pixel offset ÷ registered pixels-per-inch
        ▼
Backend zone classification
        │
        │ authoritative target geometry
        ▼
Backend penalty assignment
        │
        │ authoritative scoring profile
        ▼
Authoritative Shot Package
        │
        ├── per-shot classifications
        ├── four-zone scoring breakdown
        ├── authoritative shot IDs
        ├── paper-penalty total
        └── authority trace
        ▼
Strict live/saved validation
        │
        ├── valid package → render SEC
        └── invalid package → authority unavailable
```

The client may record coordinates and display results. It does not classify zones, assign penalty values, repair malformed packages, or manufacture missing shot IDs.

## Minimum required fields

### Authoritative Target Profile

| Field | Purpose |
|---|---|
| `target_profile_id` | Canonical target identity |
| `target_profile_version` | Immutable profile version |
| `target_name` | Governed display identity |
| `lifecycle_status` | Draft, validation, supported, suspended, or retired |
| `supported_status` | Whether new execution is permitted |
| `geometry_authority_status` | Whether geometry is approved |
| `scoring_authority_status` | Whether scoring is approved |
| `mission_family` | Authorized mission route |
| `result_package_type` | Authorized result contract |
| `scoring_profile_ref` | Single backend scoring-authority reference |
| `registration_package_id` | Approved asset and coordinate registration |
| `evidence_model` | Permitted evidence contract |
| `authority_source` | Provenance for the profile |
| `authority_version` | Version of the applied authority |

Execution requires a supported lifecycle and confirmed geometry and scoring authority.

### Registration Package

| Field | Purpose |
|---|---|
| `registration_package_id` | Immutable registration identity |
| `registration_package_version` | Registration contract version |
| `registration_status` | Approved, suspended, superseded, or revoked |
| `target_profile_id` | Target to which the asset belongs |
| `target_profile_version` | Exact target-profile binding |
| `canonical_asset_id` | Stable asset identity |
| `canonical_asset_sha256` | Exact approved asset bytes |
| `media_type` | Expected asset format |
| `image_width_px` | Registered pixel width |
| `image_height_px` | Registered pixel height |
| `coordinate_system_version` | Meaning of all supplied coordinates |
| `coordinate_origin` | Origin and axis definition |
| `canonical_center_px` | Governed scoring center |
| `pixels_per_inch` | Pixel-to-physical conversion |
| `geometry_profile_ref` | Authoritative zone geometry |
| `authority_source` | Source supporting registration |
| `approved_by` | Accountable approval owner |
| `approved_at` | Approval audit timestamp |

Dimensions alone never identify an asset. Hash, asset identity, target binding, and coordinate version must agree.

### Authoritative Shot Package

The request and backend result are distinct.

#### Minimum request fields

| Field | Purpose |
|---|---|
| `target_profile_id` | Requested target |
| `mission_family` | Requested mission |
| `registration_package_id` | Approved registration |
| `canonical_asset_id` | Presented asset identity |
| `canonical_asset_sha256` | Presented asset hash |
| `evidence_sha256` | Evidence-to-registration binding |
| `image_width_px` | Presented width |
| `image_height_px` | Presented height |
| `coordinate_system_version` | Coordinate interpretation |
| `shots` | Ordered observations |
| `shots[].shot_id` | Stable shooter-facing shot identity |
| `shots[].x_px` | Observed horizontal coordinate |
| `shots[].y_px` | Observed vertical coordinate |

#### Minimum authoritative result fields

| Field | Purpose |
|---|---|
| `ok === true` | Successful authoritative calculation |
| `status === "calculated"` | Completed state |
| `resultSource === "backend"` | Authority owner |
| `authorityVersion` | Applied authority version |
| `authorityPackageId` | Package identity |
| `target_profile_id` | Resolved target |
| `mission_family` | Resolved mission |
| `resultPackageType` | Governed result contract |
| `canonicalAsset` | Validated registration facts |
| `hitClassifications` | One result per supplied shot |
| `scoringBreakdown` | Exactly four recognized GSSF zones |
| `totalPaperPenaltySeconds` | Finite, nonnegative backend value |
| `authorityTrace` | Applied rules and source |
| `evidenceHash` | Package-integrity evidence |
| `computedAt` | Calculation timestamp |

Every classification must preserve `shot_id`, the observed coordinate, physical radius, zone, and backend penalty. Shot count must equal classification count, and each shot ID must occur in exactly one scoring bucket.

## Required now versus deferred

### Required in Phase 1

- Exact GSSF AC-1 profile identity
- `gssf` mission binding
- `gssfPaperPenaltyResult` result binding
- Supported and confirmed execution status
- Exact canonical asset ID and SHA-256
- Exact pixel dimensions
- Explicit coordinate-system version
- Approved center and physical scale
- Governed GSSF radii
- Backend-owned penalty profile
- Ordered shot IDs and pixel coordinates
- Per-shot classification
- Exactly four scoring-breakdown zones
- Paper-penalty total
- Explicit refusal responses
- Live and saved strict validation
- Baker zeroing non-regression coverage

### Deferred

- Photographs of arbitrary printed targets
- Perspective correction and homography
- Camera calibration
- Fiducials and automatic registration marks
- Rotation, crop, glare, distortion, and confidence handling
- Automated hole detection
- Manufacturer and printer onboarding
- Print tolerances and production certification
- QR catalog resolution
- Catalog persistence and publication workflows
- Cryptographic package signing
- Offline authority resolution
- Revocation distribution
- Multi-target and multi-stage generalization
- Tutoring and analytics integration

## GSSF AC-1 mapping — Shot #2 example

The following values define the reviewed Shot #2 example. Values identified as unresolved later in this document require approval before implementation.

```text
Target:                    gssf_ac_1
Mission:                   gssf
Result package:            gssfPaperPenaltyResult
Canonical asset:           gssf_ac_1_clean_reference_png_v1
Asset dimensions:          1125 × 1373 px
Canonical center:          (561.8978, 649.6939) px
Scale:                     60.9 px/in
Down Zero radius:          4.0 in
+1 outer radius:           6.5 in
Shot #2 tap:               (562.0, 932.96) px
```

Transformation:

```text
dx = 562.0 − 561.8978
   = 0.1022 px
   ≈ 0.0017 in

dy = 932.96 − 649.6939
   = 283.2661 px
   ≈ 4.6513 in

radius = √(dx² + dy²)
       ≈ 4.6513 in
```

Classification:

```text
4.0 in < 4.6513 in ≤ 6.5 in

Zone:             +1
Penalty:          1 second
Shot ID:          2
Down Zero offset: +0.6513 in
```

The `plusOne` breakdown must therefore contain Shot ID `2`. The frontend must not independently derive or replace this classification.

## Mission-family routing contract

Routing order:

1. Normalize `target_profile_id`.
2. Resolve a governed target profile.
3. Reject incomplete registry authority.
4. Require the mission family to exist in the mission registry.
5. Require the result type to exist in the result-package registry.
6. Require the exact mission/result mapping.
7. Require the target/mission/result combination to be implemented.
8. Dispatch to the matching backend engine.
9. Never fall through to a different mission engine after a failed identity check.

Required mappings:

| Target | Mission | Result package | Engine |
|---|---|---|---|
| `gssf_ac_1` | `gssf` | `gssfPaperPenaltyResult` | GSSF paper-penalty engine |
| Baker target | `zeroingCorrection` | `zeroCorrectionResult` | Baker zeroing engine |
| Dot Torture variants | `marksmanshipTraining` | `marksmanshipTrainingResult` | Training-session engine |

For GSSF AC-1, any other mission or result-package type must return governed unavailable or refused. It must not invoke zeroing, training, or generic scoring.

## Zeroing isolation

Phase 1 GSSF target authority must remain isolated behind the exact GSSF route:

```text
target_profile_id == gssf_ac_1
mission_family == gssf
result_package_type == gssfPaperPenaltyResult
```

Canonical-asset validation and classification may execute only after that route is accepted. Baker requests cannot enter the GSSF engine. The existing Baker zeroing route, geometry, correction calculations, output contract, and tests must remain unchanged.

Implementation acceptance requires structural diff validation and the complete existing zeroing suite. A GSSF change that modifies Baker zeroing behavior is outside Phase 1 scope and must be rejected.

## Smallest implementation sequence

1. Commit this locked architecture as an isolated checkpoint.
2. Resolve and approve every geometry and provenance item listed under unresolved assumptions.
3. Define an executable Authoritative Target Profile schema.
4. Define and approve the GSSF AC-1 Registration Package.
5. Place canonical registration values in one governed source.
6. Implement strict Registration Package validation.
7. Accept explicit ordered shot objects with stable `shot_id` values.
8. Perform GSSF classification exclusively in the backend.
9. Emit the established strict GSSF result package.
10. Add Shot #2, boundary, malformed-input, and shot-count parity tests.
11. Run the complete GSSF, live/saved, evidence, penalty, mobile, POIB, zeroing, and backend-authority suites.
12. Commit implementation separately from architecture.

No implementation may begin before the architecture checkpoint is committed.

## Deferred Phase 2 and Phase 3 items

### Phase 2 — Physical target registration

- Printed-target registration
- Perspective correction
- Fiducial detection
- Crop and orientation normalization
- Physical-dimension verification
- Print-tolerance enforcement
- Photo-evidence provenance
- Confidence and refusal thresholds
- Multiple approved asset renditions
- Manufacturer or printer pilot

### Phase 3 — Platform catalog

- Persistent Smart Target Catalog service
- Publication, suspension, supersession, retirement, and revocation
- Governed QR routing
- Partner onboarding
- Versioned historical resolution
- Signed authority packages
- Multi-target mission routing
- Tutoring inheritance
- Analytics dimensions
- Operational monitoring and incident handling

## Unresolved assumptions and unapproved values

The following values and policies require explicit approval before implementation:

- Canonical center `(561.8978, 649.6939)`.
- Scale `60.9 pixels per inch`.
- Provenance and licensing of `gssf_ac_1_clean_reference.png`.
- Whether the clean asset represents the full 19 × 30-inch target or a cropped scoring surface.
- How the center and scale were measured.
- Coordinate origin, axis direction, rounding, and boundary-tolerance policy.
- Whether coordinates outside image bounds must be rejected.
- Whether every radius beyond 6.5 inches is `+3`; the reviewed draft does not establish how `miss` is derived.
- How misses and unmarked fired shots enter the Authoritative Shot Package.
- Whether malformed shot entries reject the package or are discarded.
- Whether shot IDs are supplied explicitly or assigned from array position.
- Whether `evidence_sha256` must equal the registered asset hash only for canonical Phase 1 use.
- Registration approval owner and audit record.
- Target-profile and Registration Package versioning.
- Whether the proposed asset and coordinate-system identifiers are final.

Observed asset facts do not establish geometry authority by themselves:

```text
PNG:     1125 × 1373
SHA-256: e08eb090f31e64a2fd75f6e88b7267ed9798da4eb438322d1dbc8246e362f030
```

Until the unresolved items are approved, implementation remains pending.

## Architecture lock

This document is the Phase 1 implementation boundary. Changes to its target identity, package contracts, routing, authority ownership, or zeroing isolation require an explicit architecture review and a new document version.

Architecture and implementation must remain separate commits.
