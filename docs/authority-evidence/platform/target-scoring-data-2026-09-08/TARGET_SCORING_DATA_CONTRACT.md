# Target Scoring Data Contract

Status: implemented and scale-proven 2026-09-08.

## Boundary

The shared `targetScoring` capability owns normalized observation classification, aggregation, result packaging, SEC adaptation, preservation validation, and Ballistic Vault reopen. It contains no target IDs.

Each Target Execution Contract supplies only data:

- exact publisher/product identity;
- exact registered representation and hash;
- normalized UGO regions (`circle`, `ellipse`, `rectangle`, or `polygon`);
- a scoring model;
- region labels/values/object identities;
- outside/miss behavior;
- publisher-rule provenance.

## Scoring models

| Model | Expression |
|---|---|
| `numeric_regions` | Numeric ring/region values, per-group totals, total |
| `named_regions` | Named classifications such as A/B/C/D and counts |
| `penalty_regions` | Zero/negative region values, miss penalty, total |
| `ordered_objects` | Discrete object identities, expected sequence, next object |
| `multiple_bulls` | Multiple independent bull/aim-region identities and counts |
| `not_applicable` | Observations preserved when printer authority defines no score |

`not_applicable` is a governed scoring-data outcome, not a fabricated score and not an execution failure.

## Runtime rule

`LOAD → TAP → SHOW RESULTS → SEC → BALLISTIC VAULT`

The road and executor remain unchanged between products. Product identity, representation, geometry, and scoring data change through the Target Execution Contract.

## Claim boundary

The runtime may execute only rules present in the admitted printer/governing authority. It does not infer points, anatomy, tactics, qualification, line-touch adjudication, or physical bullet-hole extent.
