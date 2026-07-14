# Draft Validation Fixture — Baker GF-DB

**Fixture status:** Architecture example only
**Coordinate source:** Supplied 558 × 698 px screenshot
**Expected scoring status:** `authority_unavailable`

These points test whether the proposed coordinate model can express representative observations. They do not validate production geometry or supply authoritative scores.

## Prototype points

| ID | Image coordinate `(x, y)` | Approximate normalized `(u, v)` | Intended draft classification | Expected behavior now |
|---|---:|---:|---|---|
| `fixture-center` | `(279, 348)` | `(0.000, 0.000)` | `bull_core`; sector unresolved/null | Classifiable geometry example; no score |
| `fixture-sector-20-inner` | `(279, 278)` | `(0.000, 0.304)` | sector `20`, `inner_field` | Classifiable geometry example; no score |
| `fixture-sector-6-inner` | `(349, 348)` | `(0.304, 0.000)` | sector `6`, `inner_field` | Classifiable geometry example; no score |
| `fixture-sector-3-outer` | `(279, 498)` | `(0.000, -0.652)` | sector `3`, `outer_field` | Classifiable geometry example; no score |
| `fixture-sector-13-accent` | `(450, 292)` | `(0.743, 0.243)` | sector `13`, `outer_accent_band` | Classifiable geometry example; no score |
| `fixture-sector-boundary` | `(295, 249)` | `(0.070, 0.430)` | nominal `20` / `1` boundary | Classification `human_review_required`; package `authority_unavailable` |
| `fixture-ring-boundary` | `(279, 236)` | `(0.000, 0.487)` | `inner_field` / `middle_accent_band` boundary | Classification `human_review_required`; package `authority_unavailable` |
| `fixture-outside-board` | `(279, 600)` | `(0.000, -1.096)` | outside visible board, inside image | `authority_unavailable` until miss rule approved |
| `fixture-outside-evidence` | `(600, 348)` | `(1.396, 0.000)` | outside supplied image | `authority_unavailable` |

Coordinates are rounded to the nearest screenshot pixel. Normalized values use the approximate center `(279, 348)` and approximate outer radius `230` px.

## Proposed three-hole turn

```text
shot-1 → fixture-sector-20-inner
shot-2 → fixture-sector-6-inner
shot-3 → fixture-sector-3-outer
```

The geometry draft can describe all three classifications. The result must nevertheless remain:

```json
{
  "ok": false,
  "status": "authority_unavailable",
  "reason": "scoring_authority_unapproved",
  "expectedImpactCount": 3,
  "rawScore": null
}
```

## Future validation cases

- Every sector centerline in printed clockwise order
- Both sides of every sector boundary and each line itself
- Both sides of every ring boundary and each line itself
- Bull-center and bull-edge cases
- Number-annulus, outer-rim, and outside-board behavior
- Bullet-hole radius overlapping one or more boundaries
- Rotation, scale, crop, and perspective tolerance limits
- Canonical asset hash mismatch
- Evidence hash mismatch or incomplete target capture
- Missing, duplicate, and reordered shot IDs
- Two or four holes in a three-hole turn
- Mission-family, target, result-package, and schema mismatch
- Frontend or saved-score override attempts
- Explicit rejection of `zeroingCorrection`
