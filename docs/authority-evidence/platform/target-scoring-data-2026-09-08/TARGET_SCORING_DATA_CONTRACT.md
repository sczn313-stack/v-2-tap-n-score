# Target Scoring Data Contract

Status: implemented, scale-proven, and admission-validated 2026-09-08.

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

The scoring definition is versioned as `sczn3-target-scoring-data-v1`. Invalid
geometry, region/rule mappings, aggregation, object identity, ordered behavior,
or aim structure is rejected when the contract catalog loads. It cannot wait
until a shooter presses **Show Result** to fail.

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

## Reusable layout and interaction data

| Concern | Data values |
|---|---|
| Layout | `concentric_regions`, `regions`, `repeated_regions`, `discrete_objects`, `unstructured_evidence` |
| Aim | `fixed`, `region_centers`, `shooter_declared`, `not_required` |
| Observation input | `normalized_taps` |
| Result action | `show_result` |

The road no longer assumes that image center is the aim, that every target asks
for a shooter-declared aim, or that every target has only one aim region.
Center-out targets carry a governed fixed center. Repeated/discrete objects carry
their region centers. Classification-only or evidence-only targets can declare
that no aim input is required.

## Reusable aggregation data

| Aggregation | Behavior |
|---|---|
| `sum` | Numeric and penalty values, including per-group totals |
| `classification_counts` | Named region classification without invented arithmetic |
| `per_object_counts` | Independent hit/count state for repeated objects |
| `ordered_progression` | Printer-defined sequence, next object, completion, and mismatch/reset policy |
| `none` | Printer defines no score |

Ordered behavior is target data. `stop_progress` and `restart_sequence` are
shared policies; `all_in_order` and `shooter_declared` are shared completion
policies. A target selects a policy only when printer-derived data supplies it.

## Runtime rule

`LOAD → TAP → SHOW RESULTS → SEC → BALLISTIC VAULT`

The road and executor remain unchanged between products. Product identity,
representation, geometry, aim structure, aggregation, and scoring rules change
through the Target Execution Contract.

Target-defined interaction is returned by Session Authority to the same shared
page. The page shows **Mark Aim** only for a `shooter_declared` aim and preserves
the governed fixed aim when applicable. Production code contains no cohort
target IDs.

## Preservation

The authoritative result carries the exact aim structure, aggregation policy,
object results, normalized observations/classifications, printer rule
provenance, component digests, and contract fingerprint. SEC → Ballistic Vault
→ exact reopen therefore reconstructs the same observation/result package
without reinterpreting the target.

## Claim boundary

The runtime may execute only rules present in the admitted printer/governing authority. It does not infer points, anatomy, tactics, qualification, line-touch adjudication, or physical bullet-hole extent.
