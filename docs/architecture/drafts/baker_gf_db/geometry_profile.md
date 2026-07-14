# Draft Geometry Profile — Baker GF-DB

**Profile ID:** `baker_gf_db_geometry_draft_0_1`
**Geometry authority:** Validation only
**Production use:** Prohibited

## Canonical target plane

The draft uses the supplied 558 × 698 px image as a prototype plane only:

```text
origin: top-left of supplied image
x-axis: increases right
y-axis: increases down
approximate prototype center: (279, 348) px
prototype outer visible radius: approximately 230 px
```

Normalized target-plane coordinates are defined for architecture testing:

```text
u = (x_px - 279) / 230
v = (348 - y_px) / 230
r = sqrt(u² + v²)
clockwise_angle_degrees = mod(degrees(atan2(u, v)), 360)
```

Thus `(u, v) = (0, 0)` is the center, `v = +1` points up, and positive angle proceeds clockwise. These formulas describe coordinate meaning; they do not approve the measured center or scale.

## Image-derived concentric regions

Pixel transitions were sampled across the horizontal and vertical centerlines. Anti-aliasing, line width, image scaling, and screenshot presentation make all boundaries approximate.

| Draft region ID | Approximate radial interval | Normalized interval against 230 px | Scoring status |
|---|---:|---:|---|
| `bull_core` | 0–10 px | 0.000–0.043 | Value unresolved |
| `bull_outer` | 11–29 px | 0.048–0.126 | Value unresolved |
| `inner_field` | 30–111 px | 0.130–0.483 | Value unresolved |
| `middle_accent_band` | 112–122 px | 0.487–0.530 | Value unresolved |
| `outer_field` | 123–174 px | 0.535–0.757 | Value unresolved |
| `outer_accent_band` | 175–186 px | 0.761–0.809 | Value unresolved |
| `number_annulus` | 187–221 px | 0.813–0.961 | Non-scoring status unresolved |
| `outer_rim` | 222–230 px | 0.965–1.000 | Non-scoring status unresolved |
| `outside_board` | greater than 230 px | greater than 1.000 | Miss/unavailable policy unresolved |

The gaps between intervals represent visible transition pixels and must be treated as boundaries, not silently assigned. Production geometry must replace these raster estimates with approved dimensions and explicit inclusivity rules.

## Angular sectors

The printed clockwise order, starting at the top, is:

```text
20 → 1 → 18 → 4 → 13 → 6 → 10 → 15 → 2 → 17
   → 3 → 19 → 7 → 16 → 8 → 11 → 14 → 9 → 12 → 5
```

The prototype model proposes:

- Sector `20` centerline at `0°` (vertical up).
- Clockwise orientation.
- Twenty nominal equal sectors of `18°` each.
- Nominal boundaries at `9° + 18°n`, where `n` is an integer from 0 through 19.

Equal angular width is a defensible image-derived draft, not an approved Baker dimension. Exact ray endpoints, line widths, and sector inclusivity require source-art or physical confirmation.

## Classification order

For an observation inside registered evidence, the future backend classifier would:

1. Validate target, mission, registration, canonical asset, evidence, and coordinate-system identities.
2. Transform the observation into the canonical target plane.
3. Determine whether the point is inside approved evidence and the approved board boundary.
4. Resolve radial region and angular sector from approved geometry.
5. Detect boundary tolerance before assigning either region.
6. Mark an ambiguous classification `human_review_required`, return the scoring package as `authority_unavailable`, and never guess.

The bull regions may be independent zones without a sector number. That decision requires approved rules.

## Boundary behavior

- **Sector line:** unresolved; no silent assignment to either adjacent sector.
- **Ring line:** unresolved; no assumed line-touch advantage.
- **Bullet-hole radius:** unresolved; a center-point-only policy is not approved.
- **Outside board but inside evidence:** unresolved between governed miss and `authority_unavailable`.
- **Outside registered evidence:** `authority_unavailable`.
- **Perspective, crop, rotation, or distortion:** unsupported until a Registration Package defines the transformation and tolerance model.

Under the current draft statuses, all of the above cases—including prototype points that can be described geometrically—produce an `authority_unavailable` scoring package. `human_review_required` is a classification-status detail, not permission to score.

## Values requiring Baker approval

- Physical target and scoring-circle dimensions
- Exact center and concentric radii
- Sector-ray geometry and line widths
- Which visible bands are scoring regions
- Crop box, orientation, production tolerances, and print scale
- Treatment of central regions, number annulus, outer rim, and outside-board marks
- Bullet-hole line-touch and measurement policy
