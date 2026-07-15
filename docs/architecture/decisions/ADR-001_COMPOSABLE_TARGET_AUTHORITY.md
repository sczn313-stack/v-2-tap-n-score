# ADR-001 — Composable Target Authority

**Episode:** 30
**Date:** 2026-07-14
**Status:** Architecture Locked
**Implementation:** Not authorized
**Runtime behavior:** Unchanged

## Decision

SCZN3 adopts Composable Target Authority as an evolutionary generalization of [SCZN3 Target Authority — Phase 1](../SCZN3_Target_Authority_Phase1.md).

Phase 1 remains valid. This decision separates independently versioned authority components so geometry, registered assets, scoring semantics, and mission rules can be reused without duplication. No combination becomes executable merely because its individual components exist.

The governing statement is:

> A Geometry Profile owns immutable spatial truth. An Authoritative Target Profile owns target identity and authorized compatibility. A Registration Package binds an exact asset to that geometry. A Scoring Profile assigns governed numerical meaning to geometric zones. A Mission Profile defines how scored observations become a mission result. A Target Execution Contract authorizes the exact combination.

The constitutional ownership rule is:

> **No authority component may assume ownership of another component's responsibility. Every authority decision has one—and only one—authoritative owner.**

The composability principle is:

> **The platform is composed. Authority is not.**

The platform may be composed of reusable authority components. The authority decision itself must always resolve to one explicit, governed, authorized Target Execution Contract.

## Context

Phase 1 deliberately proved the smallest safe case:

```text
one target
+ one exact canonical asset
+ one geometry
+ one scoring profile
+ one mission family
+ one result package
```

That one-to-one model is correct for the first implementation. The GSSF readiness review exposed recurring cases that should not require copying physical geometry:

- A dimensioned engineering reference and a clean production target may depict the same physical scoring boundaries.
- One physical target may support more than one independently governed scoring interpretation.
- One scoring interpretation may support multiple courses of fire or shooter activities.
- Artwork, labels, QR marks, or production renditions may change without changing physical scoring boundaries.

Without composition, each variation encourages a nearly identical ATP. Those copies can drift in center, scale, boundaries, labels, penalties, mission rules, or evidence requirements.

## Origin of the discovery

Episode 30 began while evaluating whether two different renderings of the same GSSF target should register under one ATP:

```text
One Target
    ↓
One ATP
    ↓
Question:
Can multiple registered assets belong to one ATP?
    ↓
Discovery:
Geometry, Registration, Scoring, Mission,
and Target Identity are independent authority components.
    ↓
Solution:
Composable Target Authority.
```

The dimensioned engineering reference and the clean production rendering did not represent two different physical scoring geometries. They represented distinct asset roles bound to the same governed target identity and spatial truth. That distinction exposed the broader component model.

## Problems this decision prevents

1. **Duplicated geometry:** Repeated centers, dimensions, rings, polygons, and boundary rules can diverge.
2. **Asset/geometry conflation:** A raster file can be mistaken for the physical target definition.
3. **Scoring/geometry conflation:** Changing a label, point value, or penalty can incorrectly require new geometry.
4. **Mission/scoring conflation:** Changing shot count, timing, or aggregation can incorrectly duplicate scoring rules.
5. **Implicit compatibility:** Individually valid components can be paired in an unapproved combination.
6. **Historical drift:** Mutable shared definitions can change the meaning of saved sessions.
7. **Overbroad revocation:** Retiring one asset rendition can unnecessarily retire the geometry or every other approved rendition.

## Decision

### 1. Authority components are independently versioned

The architecture recognizes these immutable, versioned components:

- Geometry Profile
- Authoritative Target Profile (ATP)
- Registration Package
- Scoring Profile
- Mission Profile
- Target Execution Contract
- Mission Result Package

The [Authority Ownership Matrix](../COMPOSABLE_TARGET_AUTHORITY_OWNERSHIP_MATRIX.md) defines their exact boundaries.

### 2. Geometry classification and scoring interpretation remain distinct

There are two different meanings of classification:

```text
spatial classification:
observation → canonical geometry zone ID

scoring interpretation:
canonical geometry zone ID → label, points, penalty, multiplier, or other governed value
```

The Geometry Profile owns spatial classification. The Scoring Profile owns numerical interpretation and customer-facing scoring labels. This preserves the Phase 1 rule that geometry classifies a shot and the scoring profile supplies its penalty.

### 3. The ATP remains the target identity and compatibility boundary

The ATP is not reduced to geometry. It owns the governed target identity, manufacturer relationship, lifecycle, authority status, compatible Geometry Profile, and compatible Registration Packages. It records which execution relationships may be considered, but it does not itself calculate scores or define mission procedure.

One immutable ATP version references one immutable Geometry Profile version. A physical geometry change therefore requires a new Geometry Profile version and a new compatible ATP version.

### 4. Multiple assets may bind to one ATP

Each approved rendition receives its own Registration Package. Registrations may have different roles:

- `engineering_reference`
- `scorable_canonical_asset`
- `print_production_asset`
- `display_only`
- `retired`

Only a registration explicitly approved for the requested execution role may accept observations. An engineering reference can document geometry without becoming a shootable asset.

### 5. Scoring Profiles and Mission Profiles are reusable but never self-authorizing

A Scoring Profile declares the Geometry Profile zone schema, units, numeric rules, completeness requirements, and result compatibility it expects.

A Mission Profile declares shooter activity, timing, course structure, aggregation, completion rules, and mission-specific result contract.

Either component may be reused when compatible, but reuse requires an explicit Target Execution Contract. A client, saved record, filename, visual similarity, or matching label cannot authorize composition.

### 6. A Target Execution Contract authorizes the exact combination

The Target Execution Contract is the execution allowlist. At minimum, it binds immutable versions of:

```text
target_profile_id + target_profile_version
geometry_profile_id + geometry_profile_version
registration_package_id + registration_package_version
scoring_profile_id + scoring_profile_version
mission_profile_id + mission_profile_version
mission_family
result_package_type
authority_contract_version
```

It also owns lifecycle, support status, effective dates, approval, suspension, revocation, and explicit unsupported combinations.

Any unknown, incomplete, incompatible, suspended, revoked, expired, or mismatched component produces `authority_unavailable`. The resolver must never fall through to another combination.

## Authority flow

```text
┌──────────────── Authoritative Target Profile ────────────────┐
│ owns target identity, lifecycle, and compatible authority     │
│                                                              │
│  ┌────────────── Target Execution Contract ────────────────┐  │
│  │ authorizes this exact versioned combination             │  │
│  │                                                        │  │
│  │ Registration Package                                   │  │
│  │        ↓ exact asset → canonical coordinate mapping     │  │
│  │ Geometry Profile                                       │  │
│  │        ↓ observation → canonical zone ID                │  │
│  │ Scoring Profile                                        │  │
│  │        ↓ zone ID → governed numerical meaning           │  │
│  │ Mission Profile                                        │  │
│  │        ↓ activity, timing, aggregation, completion      │  │
│  │ Mission Result Package                                 │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                         ↓ strict package validation
                    Universal SEC
                    presentation only
```

The diagram describes Target Authority execution. It does not absorb or redefine the independent Zeroing Authority pipeline.

## Examples

### GSSF AC-1

```text
ATP:
  GSSF AC-1 identity and supported compatibility

Geometry Profile:
  GSSF AC-1 canonical center, scale, zones, and boundaries

Registration Package A:
  dimensioned engineering reference
  role = engineering_reference

Registration Package B:
  clean production target
  role = scorable_canonical_asset

Scoring Profile:
  Down Zero / +1 / +3 / Miss paper penalties

Mission Profile:
  GSSF time plus paper-penalty activity

Target Execution Contract:
  authorizes Registration B + GSSF geometry + GSSF scoring
  + GSSF mission + gssfPaperPenaltyResult
```

The engineering image can support provenance and validation without automatically accepting shot observations. Phase 1 remains the valid single-scorable-asset instance.

### Baker GF-DB

The existing Baker GF-DB draft already separates a geometry proposal, scoring proposal, mission proposal, registration requirements, and result schema. Under this decision:

- its Geometry Profile remains a reusable spatial definition;
- its ATP remains the Baker product identity;
- its supplied screenshot remains reference evidence only;
- its absent approved registration prevents execution;
- its proposed scoring and mission do not self-authorize; and
- no Target Execution Contract may be supported while its authority gaps remain.

Its existing statuses remain unchanged:

```text
lifecycle_status: draft
geometry_authority_status: validation
scoring_authority_status: validation
supported_status: unavailable
```

### Future Smart Targets

A future concentric-circle practice target could reuse one Geometry Profile with separate scoring and mission combinations:

```text
Geometry Profile: concentric_practice_v1

Execution Contract A:
  scoring = A/B/C
  mission = untimed practice

Execution Contract B:
  scoring = 10/9/8 rings
  mission = timed qualification simulation
```

The two executions share physical truth but remain independently approved, versioned, and revocable.

## Compatibility review

### GSSF Phase 1 — Compatible

Phase 1 is a valid one-component instance:

```text
one ATP version
+ one Geometry Profile version
+ one Registration Package version
+ one Scoring Profile version
+ one Mission Profile version
+ one permitted execution combination
```

The existing exact target/mission/result route remains mandatory. No Phase 1 scoring or package behavior changes.

### Baker GF-DB draft — Compatible and still unavailable

The draft's separated documents map directly to the component model. This decision does not approve its geometry, scoring, registration, mission family, or execution. Its refusal behavior remains intact.

### Universal SEC — Unchanged

The Universal SEC continues to receive a strictly validated mission-specific Result Package. It does not need to understand component composition and never calculates official results. A future authority trace may identify the component versions and Target Execution Contract used.

### Zeroing Authority — Unchanged and isolated

`missionFamily == zeroingCorrection` continues to select the independent Zeroing Authority pipeline and `zeroCorrectionResult`. Composable Target Authority does not alter, absorb, replace, or fall through to zeroing geometry, POIB, corrections, MOA/MRAD, clicks, or guidance.

### Mission Family routing — Unchanged

`missionFamily` remains the sole authority-pipeline switch. The Target Execution Contract is evaluated only after the mission family selects Target Authority and before classification or scoring begins.

```text
missionFamily route
        ↓
target/profile resolution
        ↓
Target Execution Contract authorization
        ↓
registration → geometry → scoring → mission result
```

No target, Registration Package, Scoring Profile, Mission Profile, frontend field, or saved record may switch pipelines.

### Runtime behavior — No change required

Adopting this architecture document requires no runtime migration and no behavior change. Existing one-to-one ATP implementations remain valid.

Supporting future multi-registration, multi-scoring, or multi-mission combinations will require separately reviewed additive implementation. That future work is not authorized by this ADR.

## Migration strategy

Existing ATPs become compliant through conceptual decomposition and version pinning, not data rewriting:

1. Preserve the existing target identity and result-package behavior.
2. Identify the geometry already used by the ATP as Geometry Profile version 1.
3. Treat the existing exact asset binding as Registration Package version 1.
4. Treat existing numerical rules as Scoring Profile version 1.
5. Treat existing course and aggregation rules as Mission Profile version 1.
6. Record the existing authorized tuple as Target Execution Contract version 1.
7. Keep current runtime routing and saved records unchanged.
8. Add new components only through future versioned, reviewed authority packages.

Therefore:

> Existing single-asset ATPs are valid one-component instances of the generalized architecture.

No migration may retroactively change historical results. Saved sessions continue to resolve against the authority versions under which they were created.

## Consequences

### Benefits

- One source of physical truth
- Less duplicated target geometry
- Independent asset, scoring, and mission versioning
- More precise approval and revocation
- Reusable authoring components
- Complete authority traceability
- Backward-compatible evolution from Phase 1

### Costs and governance risks

- More component identifiers and versions
- Compatibility validation becomes mandatory
- Unauthorized combinations become a new attack and governance surface
- Revocation dependencies must be explicit
- Authoring tools must distinguish reusable definition from executable authority

The Target Execution Contract is required to contain those risks. Composability without an explicit authorization contract is rejected.

## Follow-on documentation changes

1. Version the Smart Target Catalog to define the six authority components and execution binding.
2. Add a Phase 1 compatibility note; do not rewrite Phase 1 history.
3. Add component IDs, versions, roles, and authority trace requirements to future schemas.
4. Update the architecture index reading order and status.
5. Preserve Episode 30 and the related milestone as locked architecture.
6. Keep Universal SEC and Zeroing Authority contracts unchanged.

## Validation statements

- Zeroing Authority is unchanged.
- Mission Family remains the sole pipeline switch.
- Universal SEC remains presentation-only and unchanged.
- Existing GSSF Phase 1 architecture remains valid.
- Existing Baker GF-DB draft architecture remains valid and unavailable.
- Existing single-asset ATPs require no runtime migration.
- This ADR authorizes no implementation.
