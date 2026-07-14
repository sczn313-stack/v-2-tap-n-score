# Draft Mission Profile — Baker Firearm Dart Challenge

**Mission variant:** `bakerFirearmDartChallenge`
**Proposed mission family:** `classification`
**Execution:** Unavailable

## Purpose

The ATP describes what the target is. This mission profile separately proposes how a shooter uses it for a firearm challenge.

## Proposed course contract

| Field | Proposed value | Approval status |
|---|---|---|
| Observation type | Firearm bullet holes | Required by request |
| Bullet holes per turn | 3 | Proposed |
| Target | `baker_gf_db` | Proposed |
| Mission family | `classification` | Proposed; not registered |
| Result package type | `classificationResult` | Proposed; not registered |
| Result schema | `bakerFirearmDartChallengeResultV1` | Proposed |
| Per-hole result | Sector + radial band + independently approved value | Rule values pending |
| Turn result | Sum of three authoritative hole scores | Pending scoring approval |
| Boundary behavior | Human review or unavailable | Policy approval pending |
| Outside-surface behavior | Proposed governed miss | Policy approval pending |

Distance, firearm type, ammunition, firing position, cadence, target replacement, reshoots, and match procedure are intentionally unresolved. They belong to the approved mission rules, not target geometry.

## Mission-family routing contract

`missionFamily` remains the sole authority switch. The proposed request identity is:

```text
missionFamily = classification
target_profile_id = baker_gf_db
mission_variant = bakerFirearmDartChallenge
resultPackageType = classificationResult
```

Current registry evidence shows that `classification` and `classificationResult` are not registered. Until that changes through a separate architecture and governance decision, the only valid response is `authority_unavailable` with a mission or result-package registration reason.

The target must not silently route through `recreationalChallenge`, `precisionRingScore`, `marksmanshipTraining`, or `zeroingCorrection` based on visual similarity or convenience. An architecture review may deliberately choose an existing family later, but this draft does not make that choice.

## Completion rules

A turn is complete only when:

- exactly three unique shot observations were supplied;
- every observation is bound to valid registered evidence;
- all three classifications are authoritative;
- no observation requires human review;
- the approved scoring profile supplies every numeric value; and
- target, mission, package, registration, and authority identities all agree.

Otherwise, the turn has no believable total.

## Zeroing isolation

This mission produces classifications, not corrections. It neither requests nor returns group center, point of impact, adjustment direction, correction vector, MOA, MRAD, clicks, optic data, or zeroing guidance. Any zeroing-family request for this mission identity is an identity mismatch and must be refused.
