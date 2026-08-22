# Episode 56 GunFun Scale Experiment — Pass 001 Findings

> Preliminary boundary report. The completed governed classification and reconciled timing are in `FIRST_PASS_RESULTS.md`, `FIRST_PASS_RESULTS.json`, and `WORK_LEDGER.json`.

**Pass status:** complete through publisher authority packaging and fail-closed knowledge registration  
**Application code changed:** no  
**Execution authorization granted:** no  

## Population result

- Existing SCZN3 baseline remains **10**.
- Episode 55 remains inheritance evidence only.
- Episode 56 remains exactly **12** new GunFun SKUs.

## Measured ingestion result

- **12/12** GunFun SKUs have distinct, declarative target-knowledge registration and are recognized by the existing target-registry loader without new application code.
- **0/12** are execution-authorized. This is the correct fail-closed result at this pass.
- **0/12** can presently complete end-to-end runtime ingestion without application-code changes because execution support is not declaratively registrable.

The third result is a cohort-wide platform boundary, not 12 target-specific failures:

1. `target_registry.py` reads arbitrary target manifests but hard-codes `lifecycleStatus=research`, `supportedStatus=unavailable`, and unconfirmed geometry/scoring for every new manifest.
2. Supported status is available only through the application-code `IMPLEMENTED_TARGET_OVERRIDES` dictionary.
3. `mission_registry.py` then applies target-ID allowlists in `is_supported_profile`.
4. `session_authority.py` keeps runtime Target Authority Profiles in a Python dictionary.
5. The inherited catalog execution engine dispatches classifiers and result builders by hard-coded Target Profile IDs.

Adding 12 more override entries and dispatch branches would make the sample move, but it would directly reproduce the 40,000-implementations failure mode. That code has not been written.

## Authority findings by target

| Target | Publisher evidence result | Current boundary |
|---|---|---|
| E56-T01 / 32110 | Side A supplies detailed printed M16A2/M16A4 zeroing instructions. | Side B is represented only by a 100×100 thumbnail; two-sided identity/UGO remains incomplete. |
| E56-T02 / 82030 | Full publisher representation and numbered correction grid captured. | Strongest registration-only candidate; runtime admission is blocked by the shared platform boundary. |
| E56-T03 / 12190 | Five bulls and printed 5–10 zone values captured. | Course, shot count, distance, and aggregation are not published; generic precision execution is not declaratively dispatchable. |
| E56-T04 / 22130 | Five oval bulls and printed 7/8/9/X labels captured. | Numeric meaning of X and any qualification course are missing. |
| E56-T05 / 21420 | The target itself resolves scoring: +1000, 0, and −1000 by emoji region. | Completion/shot count is open; generic zone scoring is not declaratively dispatchable. |
| E56-T06 / 21090 | The target prints 7–10 values and horizontal/vertical pair-total tables. | Completion/comparison rule is open; generic precision execution is not declaratively dispatchable. |
| E56-T07 / 21110 | The target prints alternating-turn, line-touch hit, and first-to-sink-all rules. | Player-to-fleet binding must be explicit; recreational challenge execution is not declaratively dispatchable. |
| E56-T08 / 22740 | Product identity, 23×35 dimensions, artwork, and Founder contextual provenance are preserved. | No scoring/mission/anatomical authority; detailed publisher image is low resolution. Founder photos remain optional evidence, not authority. |
| E56-T09 / 22790 | Product identity, dimensions, two-figure artwork, and a blank score table are captured. | No friend/foe, hostage penalty, scoring, mission, or anatomical authority; image resolution is limited. |
| E56-T10 / 22470 | GunFun identity, GF-100, 23×35 dimensions, and A/B/C/D printed geometry are captured. | Numeric scoring/stage authority is absent; Baker SL-ST1 identity remains explicitly prohibited. |
| E56-T11 / 53510 | OPOTA-RQT2 and partial printed +1/−1 scoring authority are captured. | Official course, timing, round count, passing threshold, and version remain external authority gaps. |
| E56-T12 / 53900 | B21F identity, dimensions, and visible region codes are captured. | Kentucky legend/course/version authority is missing, and the publisher image is insufficient for detailed UGO. |

## Founder decision boundary

The cohort has exposed one shared architecture decision:

> Should SCZN3 authorize a governed, data-driven execution-registration contract so approved Target Profiles can declare lifecycle/support status, mission/result routing, UGO classifier configuration, and session admission without adding target IDs to application-code allowlists?

This is not authority to make every manifest executable. Any design must retain schema validation, approved-state provenance, immutable identity/versioning, explicit UGO and scoring authority, and fail-closed behavior. No platform change should begin without Founder approval.

Pending that decision, target-specific gaps remain isolated and the 12 registered records remain unavailable rather than receiving one-off code.
