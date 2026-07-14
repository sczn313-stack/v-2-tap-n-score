# Baker GF-DB Draft Authority Foundation

**Status:** Draft for architecture review
**Execution:** Unavailable
**Runtime implementation:** None
**Source authority:** Reference image only; not production authority

## Purpose

This documentation set proposes the smallest governed foundation for representing the Baker Targets `GF-DB` firearm target through SCZN3 Target Authority. It does not register the target, authorize scoring, or change any runtime behavior.

> **This draft proves that the Baker GF-DB target can be represented by SCZN3 Target Authority. It does not authorize runtime scoring.**

The target remains unavailable until Baker's production artifact, physical dimensions, geometry, rules, tolerances, permission, and SCZN3 approvals are registered.

While the draft statuses remain in force, every scoring request—including an otherwise classifiable point or a boundary requiring human review—must return an `authority_unavailable` package with no plausible score.

## Proposed identity

| Field | Proposed value | Status |
|---|---|---|
| `target_profile_id` | `baker_gf_db` | Proposed |
| `target_name` | `Baker Dartboard Target` | Image-supported draft |
| `manufacturer` | `Baker Targets` | Image-supported draft |
| `manufacturer_product_code` | `GF-DB` | Visible in supplied image |
| `mission_family` | `classification` | Proposed; not registered |
| `mission_variant` | `bakerFirearmDartChallenge` | Proposed |
| `result_schema_id` | `bakerFirearmDartChallengeResultV1` | Proposed |
| `result_package_type` | `classificationResult` | Proposed; not registered |

The current mission registry does not contain `classification` or `classificationResult`. No runtime may route this draft until an architecture review either approves those identities or assigns an existing compatible mission/result pair. Visual similarity must not choose the route.

## Governing architecture

- [SCZN3 Architecture Index](../../README.md)
- [Smart Target Catalog](../../SMART_TARGET_CATALOG.md)
- [SCZN3 Target Authority — Phase 1](../../SCZN3_Target_Authority_Phase1.md)
- [Universal SEC Architecture](../../SCZN3_Universal_SEC_Architecture.md)

## Draft artifacts

1. [Target ATP manifest](./target_atp_manifest.md)
2. [Geometry profile](./geometry_profile.md)
3. [Scoring profile](./scoring_profile.md)
4. [Mission profile](./mission_profile.md)
5. [Result-package schema proposal](./result_package_schema.md)
6. [Registration requirements](./registration_requirements.md)
7. [Validation fixture](./validation_fixture.md)

## Audit evidence

### Repository-proven

- No Baker `GF-DB` asset, SKU, manifest, ATP, or scoring rules were found in the repository during this audit.
- `missionFamily` is the sole authority switch.
- Zeroing Authority and Target Authority are independent pipelines.
- Missing or unregistered authority must return `authority_unavailable`.
- Current registered mission and result-package identities do not include the proposed `classification` / `classificationResult` pair.

### Supplied-image facts

| Fact | Value |
|---|---|
| Local audit source | `/private/var/folders/90/jgpj4hn51tq4xwprwhnxht4m0000gn/T/codex-clipboard-84d79d68-d060-4f1f-a8c4-f0e734cde097.png` |
| Media type | PNG (`image/png`) |
| Pixel dimensions | 558 × 698 px |
| Byte length | 276,242 |
| SHA-256 | `adc16b9633d99fbd172565b965f40747c0f82329e3d49f9bf47a19ee01d02b4e` |
| Visible maker | BakerTargets.com / Baker Targets |
| Visible product marking | `GF-DB` |
| Visible numbered sectors | 20 |

The local path is temporary audit evidence, not a catalog asset ID or approved Registration Package. Its hash must not be promoted to production authority merely because it is recorded here.

### Image-derived prototype values

- Approximate board center: `(279, 348)` px.
- Approximate outer visible board radius: `230` px.
- Approximate concentric boundaries: documented in the geometry profile.
- Printed clockwise sector order from top: `20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5`.

Every prototype geometry value is subject to replacement by Baker-approved production geometry.

File dimensions, byte length, and hash are exact properties of the supplied screenshot file. Visible text and sector order are direct observations. All recovered geometric measurements, normalized boundaries, center/radius measurements, and test-point classifications are explicitly approximate prototype values.

## Authority gaps

- Original production PDF and immutable source provenance
- Approved printed width and height
- Approved scoring-circle diameter
- Exact ring dimensions and sector boundaries
- Approved center, line widths, crop, orientation, and print tolerances
- Official Baker product rules or Baker approval of independently authored SCZN3 rules
- Bullet-hole line-touch and ambiguous-boundary policy
- Outside-scoring-surface policy
- Permission to create and distribute a governed digital profile
- Approved mission-family and result-package registry identities
- Approved canonical asset and Registration Package
- Backend implementation, tests, and Universal SEC adapter

## Zeroing isolation

This draft is a Target Authority classification proposal. It does not invoke or redefine Zeroing Authority. It contains no point of impact, correction vector, inches-to-MOA, MRAD, click, optic, or adjustment contract. A request that attempts to pair `baker_gf_db` with `zeroingCorrection` must return `authority_unavailable`.

## Smallest future implementation sequence

1. Obtain Baker's production source, dimensions, rules, tolerances, and permission.
2. Replace image-derived geometry with approved physical and canonical geometry.
3. Approve the independent firearm-game scoring table and boundary policies.
4. Resolve and register the mission-family/result-package identities.
5. Create and approve an immutable Registration Package for the canonical asset.
6. Add the draft ATP to the governed target catalog without enabling execution.
7. Implement backend-only registration validation, coordinate classification, scoring, refusal behavior, and authority trace.
8. Add executable geometry, scoring, malformed-input, identity, and zeroing-isolation tests.
9. Add strict live/saved result validation and a Universal SEC adapter.
10. Promote statuses only after physical validation and an explicit authority review.
