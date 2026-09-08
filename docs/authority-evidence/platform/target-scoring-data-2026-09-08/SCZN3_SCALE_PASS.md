# SCZN3 Scale Pass

Date: 2026-09-08

## Model

`TARGET = DATA`  
`SCORING = DATA`  
`ROAD = SOFTWARE`

The existing nine-product proof already supplied one shared road, one
declarative scoring executor, one SEC adapter, and six scoring models. This pass
closed four reusable seams without adding a target or a target-specific branch:

1. Target data now declares aim applicability and structure.
2. Object targets now return explicit per-object hit/count state.
3. Ordered objects now declare aggregation, mismatch/reset, and completion
   policy as data.
4. Scoring-data defects fail when the contract catalog loads, before a shooter
   session can be admitted.

## Reuse proof

- Center-out: GunFun `22200` and `12070` use governed fixed centers and reusable
  concentric-region layouts.
- Named/region classification: GunFun `13120` and `22470` use classification
  counts without invented numeric totals.
- Penalty regions: GunFun `22040` and Baker `SL-ST2` use one sum policy with
  printer/governing-authority values.
- Repeated objects: Baker `BE-R9B` uses per-object counts across nine bulls.
- Ordered discrete objects: Baker `GF-BB-C` uses one ordered-progression policy.
- Classification/preservation without a score: GunFun `22740` remains
  `not_applicable`.

The universal road remains:

`LOAD → TAP AIM/OBSERVATIONS AS APPLICABLE → SHOW RESULT → SEC → BALLISTIC VAULT → EXACT REOPEN`

## Production delta

- New target-specific production implementations: **0**
- New shooter roads: **0**
- New target identities: **0**
- Shared scoring-data validator: **1**
- Shared executor extended: **1**
- Products consuming the shared model in the regression cohort: **9**

Future products should first be expressed through these existing data models.
Only a behavior that cannot be truthfully expressed here is a candidate for one
new reusable capability.

## Runtime proof

The same nine products completed the LAN road at both `1180px` and `390px`:
result ready, SEC preserved, exact reopen with all three observations restored,
and Ballistic Vault reached. The complete session evidence is recorded in
`SCZN3_SCALE_PASS_VALIDATION.json`.
