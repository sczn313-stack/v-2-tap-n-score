# Cue/Drill Orchestrator — Founder Specification

**Status:** Founder review; specification only  
**Episode:** 56 — Capability Engine, Gate 1  
**Implementation:** Not authorized by this document  
**Build order:** Cue/Drill → Qualification → Diagnostic → Decision → Progression → Collection/Hand

## 1. Governing objective

Implement the smallest reusable owner that can execute a publisher-authorized sequence of cues and associate shooter evidence with those cues without target-ID production wiring:

> **Publisher product → governed registration → exact Cue/Drill Profile → Target Execution Contract → Cue/Drill Orchestrator → backend-authoritative result → Universal SEC → preservation → exact reopen**

The owner establishes reusable stage/event primitives required later by Qualification and Decision. It does not implement either family in advance.

The implementation must preserve:

- M-011: build shared behavioral primitives before higher-order mission executors;
- M-012: one product may expose multiple governed experiences, but each resolves and executes independently;
- M-010 Publisher Product Boundary;
- the existing Target Execution Contract component model and exact-contract resolver;
- Session Authority, Backend Authority, Universal SEC, preservation, and exact reopen;
- Zeroing Authority isolation;
- existing targets and historical SEC behavior.

## 2. Smallest correct shooter experience

For an authority-complete registered Cue/Drill product, the shooter experience is:

1. Open the registered product and choose **Cue/Drill** from its authorized capabilities.
2. Start an authoritative session. SCZN3 resolves exactly `targetProfileId + cueDrillOrchestration`.
3. Load or capture the registered target evidence image.
4. SCZN3 presents the current stage and exact authorized cue.
5. The shooter performs the drill and records visible response observations against the active cue, or explicitly records that no observable response was captured.
6. SCZN3 advances only according to the profile-defined transition.
7. Repeat until the profile reaches a terminal state or the shooter explicitly stops the run.
8. The backend returns the authoritative orchestration result: what was cued, in what order, what evidence was associated, what was missing/extra/ambiguous, and what timing provenance exists.
9. Universal SEC presents those governed facts without inventing score, qualification, diagnosis, tactical meaning, or physical shot timing.
10. Save the terminal SEC and reopen the exact preserved result.

For an externally commanded mode, the UI must label the cue as instructor/external-declared. SCZN3 records the declaration and association; it must not claim SCZN3 issued or independently verified that external command.

## 3. Inherited architecture and capabilities

The implementation inherits unchanged:

- registration and publisher/product identity from the Target Profile;
- exact contract resolution by `targetProfileId + missionFamily`;
- component identity, versions, approval, effective windows, status, and digests;
- Session Authority preparation/start and authoritative session identity;
- the generic backend execution route and capability-owner registry;
- evidence-image admission, normalized observation coordinates, and image hashing;
- UGO where an approved geometry component supplies entity identities;
- backend result hashing and exact contract fingerprinting;
- Universal SEC shell, family adapter dispatch, preservation, vault listing, and exact reopen;
- fail-closed handling for missing, invalid, suspended, expired, incompatible, ambiguous, or digest-mismatched authority.

The locked Target Execution Contract is extended only by registering one new mission family/result pair and its family owner. Its component model and resolver semantics do not change.

## 4. Exact family identity

The proposed governed identities are:

| Owner | Identity | Version |
|---|---|---:|
| Mission family | `cueDrillOrchestration` | — |
| Result package | `cueDrillResult` | `1` |
| Backend executor | `cue-drill-orchestrator` | `1` |
| SEC adapter family | `cue-drill-family` | `1` |
| Preservation validator | `cue-drill-preservation` | `1` |

`missionFamily` remains the sole authority-pipeline switch. The Cue/Drill executor may use shared stage/event helper code later consumed by other owners, but it may not call Qualification, Diagnostic, Decision, Progression, Collection/Hand, Zeroing, or any existing scoring executor.

## 5. Cue/Drill Profile v1

The Cue/Drill Profile is the `components.mission.definition` bound into the exact Target Execution Contract. It is data, not executable code.

### Required envelope

The existing component envelope continues to establish:

- profile/component ID and version;
- lifecycle and support status;
- approval authority;
- effective window;
- immutable digest;
- mission family, result-package type, and result-package version.

### Required v1 definition

The v1 mission definition contains:

- `profileId` and `profileVersion`;
- `cueSelectionMode`, `sequenceRule`, and `timingPolicy`;
- one or more ordered `stages`;
- exact authorized cue definitions or an authorized cue set;
- target-entity references where the drill depends on printed entities;
- response requirements per cue;
- transition and terminal rules;
- response reconciliation policy;
- timing policy and timing evidence source;
- explicit capability states and unsupported uses.

### Authorized v1 behavior axes

Selection, sequence, and timing are orthogonal profile fields so a valid combination such as randomized memory-repeat does not require a new mode or application branch.

Only these bounded declarative values are proposed:

- `cueSelectionMode`: `fixed_order`, `seeded_random`, or `external_command`;
- `sequenceRule`: `single_pass`, `fixed_repeat`, or `memory_repeat`;
- `timingPolicy.mode`: `untimed` or `fixed_practice_window`.

For `fixed_order`, the exact stage/cue sequence is profile data. For `seeded_random`, the backend selects from an approved cue set, preserves the random seed and generated order, and returns both in the result. For `external_command`, an instructor/shooter declares the externally supplied cue and provenance remains external/declarative. `memory_repeat` permits only bounded profile-defined sequence growth or repetition. `fixed_practice_window` records practice/orchestration timing with explicit clock provenance; it does not establish physical shot time.

No unrestricted scripting language, expression evaluator, target-supplied JavaScript, or arbitrary workflow engine is authorized.

### Stage and cue fields

Each stage has a stable `stageId`, order, title/instruction text established by profile authority, cue-generation mode, response policy, transition rule, and terminal behavior.

Each cue has or receives a stable `cueId`, `stageId`, sequence index, source, display payload, authorized target-entity references, expected observation count or explicit no-response allowance, and optional practice window.

Entity references must resolve to the exact approved geometry component. Missing or unknown entity IDs fail closed. Text-only cues may explicitly declare that geometry association is not applicable.

### Reconciliation states

The backend may return only these evidence-association states:

- `recorded`;
- `missing`;
- `extra`;
- `ambiguous`;
- `unresolved`.

These are orchestration/evidence states, not scores or penalties. A profile may define whether a state advances, repeats, or terminates the run, but v1 does not assign points or qualification consequences.

## 6. Timing and event-authority boundary

Cue/Drill v1 must distinguish four different facts that must never be collapsed:

| Timing fact | v1 treatment |
|---|---|
| Backend cue issuance/order | Backend-authoritative for orchestration sequence |
| Client display/practice clock | Preserved with client-clock provenance; nonofficial |
| External timer value | Shooter/instructor-declared unless an authorized device owner exists |
| Physical shot time/response latency | Unavailable without an authorized timer or sensor source |

A manually tapped observation proves only that the shooter recorded a visible observation and associated it with the active cue. It does not prove when the physical shot occurred.

Therefore v1 must not claim:

- an official par-time result;
- sensor-confirmed latency;
- that a physical shot was early or late;
- that a displayed cue reached the shooter at the backend issuance instant;
- that an external timer value was independently verified.

The result may report cue issuance timestamps, client practice-clock values, and declared external time only with their exact provenance. `physicalShotTiming.status` remains `unavailable` unless a separately approved authorized timing owner is added in the future.

## 7. Backend state and execution behavior

The orchestrator owns a session-bound state machine, not a one-shot client-calculated result.

### Required governed actions

- `start_run`
- `issue_or_declare_cue`
- `record_response_evidence`
- `record_no_observation`
- `advance`
- `stop_run`
- `complete_run`

Every accepted action receives a backend event identity, authoritative session identity, contract fingerprint, monotonic sequence number, and server receipt timestamp. Idempotency and stale-sequence rejection are required.

The browser sends observations and declarations. It does not send authoritative stage state, generated cue order, completion, reconciliation, or result totals.

For `seeded_random`, the backend owns the seed and exact generated order. Replaying the preserved profile version, seed, and event log must reproduce the same sequence.

### Terminal states

Only terminal results are preservable:

- `complete` — the profile terminal condition was reached;
- `stopped_incomplete` — the shooter explicitly stopped before completion.

`in_progress` state may be displayed during the active authoritative session but must not be preserved as an immutable SEC in v1.

## 8. Cue/Drill Result v1

The backend-authoritative `cueDrillResult` contains:

- standard result identity, result hash, authority source, and authoritative session ID;
- exact publisher, product, SKU, Target Profile, and contract fingerprint;
- exact Cue/Drill Profile ID, version, and component digest;
- cue-selection mode, sequence rule, timing policy, and terminal status;
- ordered stage and cue records;
- cue source and cue payload identity;
- backend sequence/event identities;
- associated observations and explicit no-observation declarations;
- per-cue reconciliation state;
- total recorded, accepted, missing, extra, ambiguous, and unresolved counts;
- random seed and generated order when applicable;
- timing values with source-specific provenance;
- `physicalShotTiming.status === "unavailable"` unless future separately approved authority exists;
- `scoring.status === "not_applicable"`;
- explicit capability states;
- authority trace and component digests.

The validator recalculates reconciliation from the event log and rejects mismatched counts, missing cue identities, unknown entity references, client-authored authoritative state, invalid transitions, nonterminal preservation, contract mismatch, or altered profile/seed/order data.

## 9. Truthful SEC presentation

Universal SEC may show:

- exact publisher product and SKU;
- selected Cue/Drill experience and profile version;
- completed or stopped-incomplete status;
- stage/cue order;
- SCZN3-issued versus externally declared cue provenance;
- associated visible observations;
- missing, extra, ambiguous, or unresolved evidence counts;
- preserved evidence image;
- practice/external timing values with explicit provenance;
- physical shot timing unavailable;
- scoring not applicable;
- contract, backend authority, and preservation identities.

Universal SEC must not show or imply:

- score, points, penalties, pass/fail, qualification, certification, diagnosis, correction, anatomical meaning, medical meaning, tactical/legal judgment, or official timing;
- a response as correct/incorrect unless a later independently governed family owns that claim;
- external commands as SCZN3-issued;
- an in-progress state as a completed immutable result.

## 10. Explicitly unavailable or not applicable

The first implementation does not provide:

- Qualification Profile or qualification/pass/fail evaluation;
- Diagnostic Feedback Profile or corrective/causal advice;
- Decision Scenario Profile or expected-response judgment;
- longitudinal progression;
- collection/hand game state;
- target scoring or penalties;
- automatic shot detection;
- acoustic, camera, timer, wearable, or sensor integration;
- official physical shot timing;
- speech recognition or generated voice-command authority;
- unrestricted profile scripting;
- cross-family execution;
- government, agency, instructor, witness, facility, credential, or reporting authority.

An unavailable optional capability does not make a registered Cue/Drill target unavailable.

## 11. Exact proposed implementation scope

### New shared family-level files

- `docs/backend/executors/cue_drill_orchestrator.py` — bounded state transition, cue generation, event association, result production, and result validation.
- `docs/backend/stage_event_store.py` — target-agnostic durable run/event storage with monotonic sequence and compare-and-set transition enforcement; it stores state but owns no mission meaning.
- `docs/backend/migrations/004_create_mission_execution_runs.sql` — durable mission-run and immutable event records keyed by authoritative session and contract fingerprint.
- `docs/backend/target_execution_contracts/profiles/cue_drill_profile.schema.json` — declarative Cue/Drill Profile v1 schema.
- `docs/backend/test_fixtures/cue_drill_scale.py` — synthetic authority-complete products and data-only third-fixture generator.
- `docs/backend/test_cue_drill_orchestrator.py` — unit, fail-closed, transition, timing-provenance, and result-validation coverage.
- `docs/production/cue_drill_family_browser_test.mjs` — complete browser flow, preservation, and exact-reopen acceptance test.

### Existing shared files modified once at family level

- `docs/backend/target_execution_contracts/schema.json` — admit only the exact `cueDrillOrchestration` / `cueDrillResult` pair.
- `docs/backend/target_execution_contract.py` — register the exact family/result relationship; no resolver redesign.
- `docs/backend/execution_capability_registry.py` — register the one executor/validator/SEC/preservation owner.
- `docs/backend/server.py` — add one family-neutral `/api/target-execution/action` route; no product routes.
- `docs/backend/execution_authority.py` — validate the authoritative session/contract on every action, dispatch the selected family owner, and return only owner-validated state/results.
- `docs/backend/session_authority.py` — expose the existing database connection to the new target-agnostic stage/event store without changing preparation or session admission semantics.
- `docs/target-experience.html` — add family-level stage/cue and response controls to the shared experience shell.
- `docs/target-experience.css` — style the shared Cue/Drill state without product-specific selectors.
- `docs/target_execution_runtime.js` — add family-level action transport, result reconciliation, SEC summary, preservation admission, and exact-reopen rendering.
- `docs/sec_adapter_model.js` — register `cue-drill-family` and its result identity.
- `docs/sec_dispatch.js` — admit the exact family/result/adapter tuple.
- `docs/production/build-site.mjs` and `docs/production/build-netlify.mjs` — include only any new shared schema/test-facing asset required by the production build.
- existing Target Execution Contract, Session Authority, SEC dispatch, preservation, and regression test suites — add family-level assertions.

### Conditional shared-owner file

- `docs/m4_runtime.js` changes only if its generic `SCZN3TargetExecutionRuntime.canPreserve()` delegation does not already admit the validated family result. No Cue/Drill-specific branch is authorized there.

The existing backend preservation store is target-agnostic and is not expected to change.

## 12. What will explicitly not change

- No GunFun or Baker catalog product will be selected as an implementation fixture.
- No Batch 1 or Batch 2 registration will be changed.
- No target-ID branch, target-specific route, target-specific module, target page, or target-specific SEC adapter will be added.
- No existing target, Target Profile, mission, executor, result, SEC, or historical record will be migrated.
- No Target Execution Contract redesign or generic authority bypass will occur.
- No mission profile or event payload gains authority merely because the shared event store can persist it; only the selected registered capability owner may interpret and validate it.
- No change to M-009, ADR-001, M-010, KTIS, UGO, Session Authority, Zeroing Authority, Backend Authority, Universal SEC, or the Publisher Product Boundary.
- No scoring, qualification, diagnosis, decision judgment, progression, collection/hand rules, inferred publisher intent, physical measurement, correction, or tactical/anatomical/medical meaning.
- No production deployment, commit, or push.

## 13. Acceptance fixtures

The architecture is validated with synthetic authority-complete products, not catalog products chosen to fit the implementation.

### Fixture A — Fixed Command Paper

- `fixed_order`;
- at least two stages and several exact cues;
- entity-associated visible observations;
- one explicit missing observation;
- terminal complete result.

### Fixture B — Random Memory Paper

- `seeded_random` plus `memory_repeat` behavior;
- backend-owned seed and reproducible cue order;
- at least one ambiguous or extra observation case;
- terminal complete result.

### Fixture C — External Command Paper

- created by profile/contract/registration data only after A and B pass;
- no production-file edit;
- externally declared cues and an externally reported practice time;
- external timing remains declared, and physical shot timing remains unavailable;
- terminal stopped-incomplete or complete result as profile data dictates.

Fixtures A and B must be different publisher-product identities inheriting the same executor and SEC family. Fixture C is the scale test: if it requires a target-ID production edit, the family acceptance test fails.

## 14. Validation plan

### Contract and authority

- exact family/result/owner tuple resolves;
- one target exposing Cue/Drill plus another family resolves only the requested mission family;
- missing mission-family selection fails closed when multiple contracts exist;
- absent, suspended, expired, unapproved, incompatible, or digest-mismatched profiles fail closed;
- unknown geometry entity references fail closed;
- target identity and exact contract fingerprint survive result, SEC, preservation, and reopen.

### State and reconciliation

- fixed order is deterministic;
- seeded random order is backend-owned, reproducible, and preserved;
- memory-repeat transitions follow only profile data;
- external cues remain external/declarative;
- stale, duplicated, skipped, and out-of-order actions fail closed or idempotently return the prior accepted event;
- missing, extra, ambiguous, unresolved, and recorded states reconcile exactly;
- client-authored completion, stage order, cue order, or counts are rejected;
- stopped-incomplete and complete are distinguishable terminal results;
- in-progress preservation fails closed.

### Timing authority

- backend cue sequence/receipt timing is distinct from client practice timing;
- external reported time retains declarant provenance;
- manual observations never create physical shot timestamps;
- official timing and late-shot claims remain unavailable.

### End-to-end lifecycle

- Start → load/capture → present/decode cue → record observations/no-observation → advance → terminal result → Universal SEC → Save → exact reopen;
- preserved evidence image survives exact reopen;
- authoritative reconciliation counts survive exact reopen;
- `scoring.status === "not_applicable"` survives exact reopen;
- unsupported capability states remain unavailable/not applicable after reopen;
- two products inherit the same family executor and SEC family;
- third fixture becomes playable through exact reopen with zero target-ID production edits.

### Regression

- existing scale-architecture fixtures;
- smart evidence capture, precision/open scoring, and recreational challenge families;
- Session Authority;
- Baker SL-ST1 SEC and historical SEC behavior;
- governed adapter and SEC dispatch;
- preservation admission and exact reopen;
- Zeroing Authority isolation;
- existing target behavior and build manifests.

## 15. Failure conditions

Implementation acceptance fails if any of the following occurs:

- a fixture requires a target-ID production branch;
- a profile can inject executable code;
- the browser becomes authoritative for cue order, completion, reconciliation, or result;
- physical shot timing is inferred from manual observation capture;
- a Cue/Drill result claims score, pass/fail, qualification, diagnosis, correction, or decision correctness;
- one mission executor silently invokes another family;
- preservation admits an in-progress, unreconciled, altered, or contract-mismatched result;
- a new product requires a product route, module, SEC adapter, or preservation branch;
- existing behavior or historical SECs change.

## 16. Expected leverage

Direct catalog leverage is 17 offerings / 13 lineages currently assigned to the missing Cue/Drill family, subject to exact authority profiles.

Architectural leverage is larger: the reusable stage, cue, sequence, clock-provenance, response-association, reconciliation, transition, and completion primitives become dependencies for the later Qualification family (27 offerings) and Decision family (8 offerings). Reuse is implementation reuse only; authority and execution remain separate by mission family.

## 17. Founder decision required

Founder approval is required for:

1. the exact family and owner identities in Section 4;
2. the bounded v1 modes in Section 5;
3. the timing-authority boundary in Section 6;
4. the terminal-only preservation rule;
5. the exact implementation scope and acceptance fixtures.

If approved, implementation proceeds only within this specification and stops at any proposed target-ID branch, new authority claim, broader timing source, cross-family execution, or other material boundary.

**No implementation begins until Founder approves this specification.**
