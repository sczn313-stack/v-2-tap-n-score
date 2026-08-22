# Qualification Executor — Founder Specification

**Status:** Founder review; specification only  
**Episode:** 56 — Capability Engine, Gear 2  
**Population evidence:** 27 offerings / 21 product lineages  
**Implementation:** Not authorized by this document

## 1. Governing objective

Implement the smallest reusable owner that can truthfully evaluate a versioned qualification course without creating jurisdiction-specific application code or claiming authority SCZN3 does not possess:

> **Publisher product → governed registration → authoritative Qualification Profile → exact Target Execution Contract → inherited stage/event machinery → Qualification Executor → backend-authoritative practice result → Universal SEC → preservation → exact reopen**

The catalog evidence supports one qualification behavior family. Federal versus state, police versus security, pistol versus rifle, and differing stages, distances, values, penalties, and thresholds belong in governed profile data—not separate executors.

The implementation must preserve:

- M-011: shared behavioral primitives precede higher-order executors;
- M-012: multi-capability products resolve and execute one mission family at a time;
- M-010 Publisher Product Boundary;
- the locked Target Execution Contract and exact `targetProfileId + missionFamily` resolver;
- Session Authority, Backend Authority, UGO, Universal SEC, immutable preservation, and exact reopen;
- Zeroing Authority isolation;
- existing targets and historical SEC behavior.

## 2. Critical authority distinction

Three experiences must remain distinct:

| Experience | Correct owner | Truthful claim |
|---|---|---|
| Evidence only | Existing `smartEvidenceCapture` family | Visible observations were recorded against the exact registered product. No course or qualification claim. |
| Practice/simulation | New Qualification family | The shooter completed a nonofficial run of an exact, versioned course profile and SCZN3 calculated the governed practice result. |
| Official qualification | Qualification plus separately governed administration/attestation authority | The identified shooter completed the controlling course under every required official condition and received the governed course result. Credential issuance and agency reporting remain separate. |

Evidence-only is not a low-grade Qualification result. The shooter chooses Smart Evidence when no complete Qualification Profile exists.

The smallest correct v1 implements **practice/simulation** and an explicit **official-claim refusal boundary**. It does not admit a production official-qualification claim merely because a user supplies instructor, witness, timer, facility, or agency text.

## 3. Proposed family identity

| Owner | Identity | Version |
|---|---|---:|
| Mission family | `qualificationCourseEvaluation` | — |
| Result package | `qualificationResult` | `1` |
| Backend executor | `qualification-executor` | `1` |
| SEC adapter family | `qualification-family` | `1` |
| Preservation validator | `qualification-preservation` | `1` |
| Profile | `qualification-profile` | `1` |

`missionFamily` remains the sole authority-pipeline switch. Qualification must not invoke Cue/Drill, Diagnostic, Decision, Progression, Collection/Hand, or Zeroing executors.

## 4. Smallest correct shooter experience

For an authority-complete practice profile:

1. Open the exact registered publisher product.
2. Choose **Qualification Practice** from the product’s authorized capabilities.
3. Review the exact course name, governing source, profile revision/effective date, target edition, course mode, required stages, distances, rounds, timing-evidence limitations, scoring method, and passing threshold.
4. Explicitly acknowledge **Practice / Not an Official Qualification**.
5. Start an authoritative session resolving exactly `targetProfileId + qualificationCourseEvaluation`.
6. Load/capture the required registered target evidence instance or instances.
7. Execute each fixed course stage using the inherited backend stage/event machinery.
8. Record visible observations against the active stage and target instance; record missing evidence explicitly where applicable.
9. Complete or explicitly stop the course.
10. Receive a backend-authoritative practice result showing only established stage facts, governed score, threshold comparison, completeness, and provenance.
11. View the Universal SEC, save it, and reopen the exact preserved practice record.

The UI and SEC must display **Practice Simulation — Not Official Qualification** prominently and persistently.

## 5. What Qualification inherits from Cue/Drill

Qualification inherits implementation mechanics, not Cue/Drill authority.

### Already reusable unchanged

- `stage_event_store.py` durable mission-run storage;
- `mission_execution_runs` and immutable `mission_execution_events` persistence;
- authoritative-session and exact-contract binding;
- action IDs, monotonic sequence numbers, idempotent replay, and compare-and-set transitions;
- backend receipt timestamps;
- the generic `/api/target-execution/action` route;
- generic capability-owner transition dispatch;
- terminal result handoff to Universal SEC, preservation, and exact reopen.

These owners require no Qualification branch and should not change.

### Authority-neutral primitives to extract once

The first implementation placed several proven mechanics inside `cue_drill_orchestrator.py`. Qualification must not import the Cue/Drill owner. The approved implementation should extract only these authority-neutral mechanics to a shared `stage_event_primitives.py` module:

- stable stage/event/cue identities;
- fixed ordered plan construction;
- active-stage cursor and deterministic transitions;
- normalized observation validation;
- response-to-active-stage association;
- recorded, missing, extra, ambiguous, and unresolved reconciliation vocabulary;
- clock-source/provenance envelopes;
- terminal `complete` and `stopped_incomplete` handling;
- canonical result-integrity/hash helpers.

Cue/Drill must consume the extracted helpers with byte-for-byte equivalent result behavior. Its profile modes, seeded randomization, memory behavior, externally declared cue semantics, result package, SEC adapter, and authority remain owned exclusively by Cue/Drill.

### Qualification-specific behavior

Qualification alone owns:

- Course/Qualification Profile validation;
- claimant course mode and target eligibility;
- required stages, rounds, distances, positions, start conditions, reloads, and target allocation;
- application of exact scoring-component values and course aggregation;
- incomplete, extra, missing, ambiguous, and penalty treatment established by profile authority;
- threshold comparison and practice PASS/FAIL/INCOMPLETE result;
- claim grade and official-claim refusal;
- qualification-specific SEC presentation and preservation validation.

## 6. Qualification Profile v1

The Qualification Profile is the approved `components.mission.definition` bound into the exact Target Execution Contract. It is declarative data, never executable code.

### Authority identity

The profile must establish:

- `profileId` and immutable version;
- course/program name and course mode;
- governing authority ID and name;
- claimant class or eligible population;
- authoritative source document IDs, titles, revisions, URLs/references, content hashes, and effective dates;
- approval status, approval authority, effective window, supersession, suspension, and revocation state;
- exact eligible Target Profile/edition and geometry/scoring component digests;
- result vocabulary established by the authority.

A publisher product page may establish product identity and publisher-described use. It does not establish government course authority unless the publisher is also demonstrably the rules owner for that course.

### Course conditions

The profile must declare, where applicable:

- weapon/course mode and ammunition constraints;
- required range/facility conditions;
- distance per stage with unit and authority source;
- starting conditions and shooter positions;
- commands and stage order;
- rounds per string/stage and total required rounds;
- reload requirements;
- target-instance count and stage-to-instance allocation;
- fixed practice windows and permitted timing-evidence sources;
- completion, abort, remediation, retry, and requalification rules.

V1 may support several physical instances of the same registered publisher product. A course requiring a different target product or multi-product relationship is authority-blocked until an exact composed contract is separately approved.

### Scoring and outcome authority

The Target Execution Contract keeps ownership separated:

- Geometry/UGO identifies approved regions or zones.
- The scoring component maps governed classifications to values and exact penalty rules.
- The Qualification Profile defines required course aggregation, stage completeness, threshold, and result vocabulary.
- The Qualification Executor composes only the exact approved components.

The profile must specify:

- included/excluded scoring zones and values by scoring-component reference;
- stage and course aggregation;
- treatment of outside, missing, extra, ambiguous, unresolved, and late evidence;
- penalties only where exact authority exists;
- minimum score or other exact passing condition;
- tie/rounding rules;
- whether every stage must independently pass;
- whether an incomplete course can receive any evaluated outcome.

No default penalty, threshold, rounding rule, or familiar qualification convention may be inferred.

### Claim policy

The profile declares allowed claim grades:

- `practice_simulation`;
- `official_qualification` only when a separately approved administration/attestation owner exists.

V1 production support is limited to `practice_simulation`. `official_qualification` remains unavailable and fails closed until Founder separately approves the required authority owner and integrations.

## 7. Timing boundary

Qualification inherits Cue/Drill’s proven clock-provenance boundary:

| Timing evidence | Practice result | Official result |
|---|---|---|
| Backend cue/order timestamps | May establish orchestration sequence only | Insufficient for physical shot timing |
| Client practice clock | May be used only when the profile authorizes nonofficial simulation timing | Insufficient |
| Shooter/instructor reported external time | May be displayed as declared practice evidence if profile permits | Insufficient without an approved attestation owner |
| Authorized timer/sensor or officially accepted administrator attestation | Not implemented in v1 | Required where the course makes physical timing material |

Manual shot observations do not establish physical shot time, response latency, or whether a physical shot occurred within a par window.

If timing is material to PASS/FAIL and the profile lacks an authorized v1 practice timing source, the executor returns `not_evaluable` or refuses the run according to profile policy. It must not ignore the time condition or invent compliance.

## 8. Practice result semantics

`qualificationResult` v1 separates course performance from official authority:

- `terminalStatus`: `complete` or `stopped_incomplete`;
- `claimGrade`: `practice_simulation`;
- `officialClaimStatus`: `not_established`;
- `credentialStatus`: `not_issued_by_sczn3`;
- `performanceOutcome`: `pass`, `fail`, `incomplete`, or `not_evaluable`;
- exact profile ID/version/digest and governing-source trace;
- exact target, geometry, scoring, and mission component identities/digests;
- stage definitions and stage evidence records;
- required/recorded/accepted/missing/extra/ambiguous/unresolved round counts;
- zone classifications and values established by approved components;
- stage totals, penalties, aggregate total, maximum/denominator where authorized, threshold, and comparison;
- clock values and exact provenance;
- target-instance evidence identities;
- authoritative session, contract, result identity, and result hash;
- explicit unavailable/not-applicable capability states.

`pass` means only:

> **The preserved evidence satisfied the exact practice profile’s evaluable conditions and threshold.**

It does not mean SCZN3 certified, licensed, qualified, witnessed, instructed, filed, or credentialed the shooter.

`stopped_incomplete` may never produce PASS. Missing material evidence may never be silently treated as zero unless the profile explicitly supplies that treatment and authority.

## 9. Official qualification boundary

An official request must fail closed before course execution unless every profile-required authority owner can validate:

- exact claimant identity and eligibility;
- current course/profile revision;
- authorized instructor/administrator identity and credential scope;
- required witness identity;
- approved range/facility and course conditions;
- weapon/ammunition identity where required;
- accepted timer/sensor or administrator timing evidence;
- target edition/equivalence;
- required attestations and signatures;
- attempt/requalification eligibility;
- required record destination and external reporting availability.

Client-entered names, credential numbers, checkboxes, timestamps, signatures, or facility descriptions are declarations—not backend authority.

There is no silent downgrade. If the shooter requests official execution and official authority is unavailable, SCZN3 refuses that request and offers a separately selected practice experience where authorized.

Even when a future official course result is established:

- calculation is not credential issuance;
- the Universal SEC is not automatically a government certificate;
- SCZN3 must not claim an agency filing occurred without a separately authorized reporting integration;
- historical official results remain bound to their exact course and attestation versions.

## 10. Universal SEC presentation

The practice Qualification SEC may show:

- exact publisher product and SKU;
- exact course/program and Qualification Profile revision;
- governing source and effective date;
- prominent **Practice Simulation — Not Official Qualification** status;
- completed or stopped-incomplete state;
- stage requirements and recorded evidence;
- governed classifications, values, totals, penalties, and threshold comparison;
- PASS, FAIL, INCOMPLETE, or NOT EVALUABLE as a practice result;
- timing values with exact provenance and physical timing limitations;
- official claim not established;
- credential not issued by SCZN3;
- exact contract, backend authority, result hash, preservation identity, and exact reopen.

It must not show or imply:

- official qualification, certification, license, credential, agency acceptance, instructor approval, witness approval, facility approval, filing, or reporting;
- timing compliance unsupported by authorized evidence;
- penalties, scoring, target equivalence, or course requirements not in the exact profile/components;
- Diagnostic or Decision results;
- a stopped/incomplete or materially unreconciled course as PASS.

## 11. Explicitly unavailable or not applicable in v1

- production official-qualification claims;
- credential/certificate issuance;
- agency filing or government record synchronization;
- instructor, witness, facility, claimant, or credential verification integrations;
- automatic shot detection;
- authoritative physical shot timing;
- multi-product or multi-target-type courses;
- Diagnostic Feedback;
- Decision Scenario evaluation;
- longitudinal progression/requalification history evaluation;
- collection/hand game state;
- unrestricted profile scripting;
- client-generated course, threshold, score, completion, or authority.

An unavailable official capability is not a missing target. The registered product may still offer Smart Evidence and, where a complete profile exists, Qualification Practice.

## 12. Exact proposed implementation scope

### New shared and family-level files

- `docs/backend/stage_event_primitives.py` — authority-neutral stage identity, fixed-plan, observation association, reconciliation, clock-provenance, terminal-state, and result-integrity helpers extracted from the proven Cue/Drill behavior.
- `docs/backend/executors/qualification_executor.py` — Qualification Profile validation, fixed-course transitions, scoring composition, completeness, threshold evaluation, claim-grade refusal, result production, and validation.
- `docs/backend/target_execution_contracts/profiles/qualification_profile.schema.json` — bounded declarative Qualification Profile v1.
- `docs/backend/test_fixtures/qualification_scale.py` — synthetic authority-complete products and data-only third fixture.
- `docs/backend/test_qualification_executor.py` — unit, authority, scoring, timing, terminal-state, claim-boundary, tamper, and scale acceptance coverage.
- `docs/production/qualification_family_review_server.py` — local-only synthetic review authority.
- `docs/production/qualification_family_browser_test.mjs` — Founder-facing course, SEC, preservation, and exact-reopen acceptance.

### Existing shared files modified once at family level

- `docs/backend/executors/cue_drill_orchestrator.py` — consume extracted authority-neutral helpers without changing Cue/Drill results or authority.
- `docs/backend/target_execution_contracts/schema.json` — admit only the exact Qualification family/result pair.
- `docs/backend/target_execution_contract.py` — register only the exact family/result relationship; no resolver redesign.
- `docs/backend/execution_capability_registry.py` — register the one Qualification owner.
- `docs/target-experience.html` and `docs/target-experience.css` — add shared qualification-practice labels, course summary, stage evidence, and result controls.
- `docs/target_execution_runtime.js` — add family-level Qualification workflow, result reconciliation, SEC presentation, preservation admission, and exact reopen.
- `docs/sec_adapter_model.js` — register `qualification-family`.
- `docs/sec_dispatch.js` — admit the exact family/result/adapter tuple.
- `docs/package.json` — add Qualification acceptance commands.

### Expected unchanged accumulation surfaces

These should require no Qualification-specific change:

- `docs/backend/stage_event_store.py`;
- `docs/backend/migrations/004_create_mission_execution_runs.sql`;
- `docs/backend/execution_authority.py`;
- `docs/backend/server.py`;
- `docs/backend/session_authority.py`;
- `docs/backend/preserved_sec_store.py`;
- `docs/m4_runtime.js`;
- production build manifests unless a new public asset is introduced.

A Qualification branch in the generic action route, durable store, Session Authority, backend preservation store, or M4 runtime is an accumulation failure and must be surfaced rather than patched around.

## 13. Acceptance fixtures

Fixtures are synthetic and authority-complete. No real government rule or catalog SKU is used to design the executor.

### Fixture A — Fixed Pistol Practice Course

- two fixed stages at different declared distances;
- exact round counts and approved zone values;
- client practice timing explicitly permitted but nonofficial;
- complete, evaluable practice PASS;
- no official claim.

### Fixture B — Fixed Rifle Practice Course

- different target geometry, scoring values, stage structure, and threshold;
- complete, evaluable practice FAIL or INCOMPLETE according to exact evidence;
- same executor and SEC family as Fixture A;
- no official claim.

### Fixture C — Data-Only Qualification Practice

- introduced only after A and B pass;
- new publisher/product identity, course stages, geometry, scoring component, and threshold supplied through governed data;
- complete Universal SEC, preservation, and exact reopen;
- zero target-ID production edits, routes, modules, adapters, or preservation branches.

Negative variants must prove:

- a qualification-looking target with no identified rules owner remains Smart-Evidence-only;
- requested official execution fails closed when no approved attestation owner exists;
- missing or mismatched profile, target edition, geometry, scoring, course version, timing authority, or component digest fails closed;
- stopped-incomplete, missing material evidence, and unreconciled observations cannot PASS;
- a profile revision never rewrites a preserved historical result.

## 14. Critical acceptance tests

1. Two different products inherit `qualification-executor` and `qualification-family` while preserving exact publisher/product/SKU identity.
2. A third product becomes playable through profile/contract/registration data with zero target-ID production edits.
3. Qualification uses the existing action route, durable state store, migration, Session Authority, backend preservation store, and generic M4 preservation delegation unchanged.
4. Cue/Drill’s backend result hashes and full browser exact-reopen lifecycle remain unchanged after primitive extraction.
5. Smart Evidence remains available for a registered qualification-looking target that lacks course authority.
6. One product exposing Smart Evidence, Qualification, and a future Diagnostic contract resolves only the explicitly selected mission family.
7. Practice PASS/FAIL never becomes an official claim or credential.
8. An official request cannot be client-authorized and cannot silently downgrade.
9. Timing-material course conditions cannot be ignored or inferred from manual observations.
10. Missing, invalid, suspended, expired, superseded, ambiguous, or digest-mismatched authority fails closed.

## 15. Validation plan

### Profile and component authority

- validate exact source, revision, effective window, governing authority, claimant class, target edition, geometry, scoring, stage, threshold, and claim policy;
- reject unknown zones, unapproved values, absent thresholds, unbounded scripts, and conflicting component identities;
- reject a product-category or artwork inference as course authority.

### Stage/event inheritance

- fixed stage order, action identities, monotonic sequence, idempotent replay, stale-action refusal, evidence association, reconciliation, timing provenance, terminal state, and result integrity;
- no change to Cue/Drill results before/after shared-helper extraction;
- no Qualification-specific branch on expected-unchanged accumulation surfaces.

### Scoring and result

- exact zone classification and priority;
- stage round counts and target-instance allocation;
- stage totals, penalties, aggregate, rounding, denominator, threshold, and PASS/FAIL comparison;
- missing, extra, outside, ambiguous, unresolved, stopped, and not-evaluable cases;
- server recalculation rejects client totals, PASS/FAIL, completion, and claim grade;
- tampered profile, event order, evidence, score, threshold, result hash, or authority trace fails validation/preservation.

### Claim boundary

- practice label survives result, SEC, preservation, vault, and exact reopen;
- official claim remains not established;
- credential remains not issued by SCZN3;
- client-entered administrator, witness, facility, timer, or agency data cannot authorize official execution;
- no silent practice fallback after an official request fails.

### End-to-end and regression

- complete three-fixture browser lifecycle through exact reopen;
- existing Cue/Drill three-fixture backend and browser acceptance;
- Target Execution Scale Architecture;
- Session Authority;
- Smart Evidence, precision/open scoring, and recreational challenge families;
- Universal SEC and dispatch;
- Baker SL-ST1 and historical SECs;
- Episode 54 governed adapters;
- Episode 55 IDPA and Baker Fun inheritance;
- Zeroing Authority isolation;
- local production build.

## 16. Failure conditions

Implementation acceptance fails if:

- any fixture requires a target-ID production edit;
- any jurisdiction, agency, course, publisher, or SKU receives an application-code branch;
- Qualification imports or invokes the Cue/Drill executor or authority;
- Cue/Drill result behavior changes during primitive extraction;
- the generic action route, durable store, Session Authority, preservation store, or M4 runtime needs a Qualification branch;
- client data establishes official administration authority;
- practice PASS is presented as official qualification or credential;
- material timing is ignored or inferred from manual observations;
- incomplete/unreconciled evidence produces PASS;
- a profile can inject executable code;
- historical results are recomputed under a later profile revision.

## 17. Expected leverage

Direct catalog leverage is 27 offerings / 21 product lineages, subject to exact course authority. The engine remains one reusable executor with versioned profiles—not 27 implementations.

The expected reusable relationship is:

> **One Qualification Executor + authoritative course profiles + independently governed official-administration authority when available**

GunFun Navy Qual may later expose Qualification and Diagnostic as independent contracts. Baker CTQ may expose Qualification and Cue/Drill independently. Neither overlap authorizes cross-family execution.

## 18. Founder decisions required

Founder approval is required for:

1. family identity: `qualificationCourseEvaluation → qualificationResult`;
2. v1 scope: practice/simulation evaluation plus official-claim refusal, with no production official qualification;
3. evidence-only remaining an independent Smart Evidence experience;
4. extraction of authority-neutral stage/event helpers while Cue/Drill authority and results remain unchanged;
5. same-product multiple evidence instances, with multi-product courses unavailable;
6. the practice result vocabulary and explicit credential boundary;
7. exact implementation scope and three-fixture acceptance plan.

If Founder instead wants production official-qualification claims in Gear 2, implementation must stop until a separate specification identifies and governs the required claimant, instructor, witness, facility, timing, attestation, credential, and reporting owners. Those authorities must not be invented inside the Qualification Executor.

**No implementation begins until Founder approves this specification.**
