# SEC Progression Evaluator — Founder Specification

**Status:** Founder approved; implemented and validated — see `SEC_PROGRESSION_EVALUATOR_IMPLEMENTATION_REPORT.md`  
**Episode:** 56 — Capability Engine, Gear 5  
**Population evidence:** 2 Baker offerings / 1 product lineage  
**Implementation:** Founder authorized in conversation; completed within this boundary

## 1. Governing objective

Implement the smallest reusable owner that can evaluate an exact set of immutable, backend-preserved Shooter Experience Cards under one versioned publisher-authorized progression program without changing, re-scoring, or reinterpreting any source SEC:

> **Registered publisher product → governed Progression Profile → authoritative subject scope → immutable eligible SECs → SEC Progression Evaluator → immutable progression record → exact reopen**

Gear 5 is not another shooting-session executor. It evaluates governed relationships among already preserved results over time.

The V1 shooter-facing truth label is:

> **Governed Progression Result — Derived from Preserved SECs**

## 2. Catalog evidence and current authority gap

The identified catalog population is one Baker lineage offered in two quantities:

| SKU | Exact product | Publisher evidence |
|---|---|---|
| `BE-Challenge` | Bullseye Challenge Target | Baker states that the target is used with a 20-page guide to track accuracy and advance through levels. |
| `BE-Challenge-Bulk` | Bullseye Challenge Target – 250 Pack | Same progression program/product lineage in a bulk offering. |

The public product pages establish progression intent. They do not establish the guide's complete executable level criteria, eligibility rules, repeat/hold/advance behavior, reset/demotion treatment, or revision semantics.

Therefore:

- Baker's 20-page guide must be obtained, versioned, and approved/licensed for digital use before either real offering receives an executable Progression Profile;
- the two SKUs are not two independent demonstrations of reusability;
- V1 architecture acceptance requires at least two independent synthetic authority-complete progression programs;
- both Baker offerings remain valid at their currently authorized lower capability boundary until exact Profile authority exists.

An authority gap is not an implementation failure.

## 3. Claims that must remain separate

| Claim | Correct owner | Truthful meaning |
|---|---|---|
| Historical evidence | Each original family result and preserved SEC | What happened in that exact governed shooting experience. |
| Progression evaluation | New SEC Progression family | Under this exact Progression Profile version, these exact eligible preserved SECs produced this hold/advance state. |
| Skill, readiness, certification, or official standing | Separately governed authority | A person possesses a broader capability, credential, readiness level, legal status, or official qualification. |

V1 may report `advanced`, `held`, `insufficient_evidence`, or `ineligible_inputs` under exact Profile rules. It must not independently claim mastery, competency, readiness, certification, qualification, medical improvement, tactical ability, or future performance.

## 4. Exact family identity

| Owner | Identity | Version |
|---|---|---:|
| Mission family | `secProgressionEvaluation` | — |
| Result package | `secProgressionResult` | `1` |
| Backend evaluator | `sec-progression-evaluator` | `1` |
| SEC/Vault adapter family | `sec-progression-family` | `1` |
| Preservation validator | `sec-progression-preservation` | `1` |
| Profile | `sec-progression-profile` | `1` |

`missionFamily` remains the exact capability relationship switch. Progression must not invoke or acquire the authority of any source family. It consumes already validated source results as immutable facts.

## 5. Cross-session execution boundary

The Target Execution Contract continues to bind the registered publisher product, exact Progression Profile, owner versions, adapter, and preservation validator. Its component model and resolver semantics do not change.

Progression does **not** use the ordinary observation-execution route and does not create a fictional shooting session:

- `/api/target-execution` remains for one-session evidence execution;
- `/api/target-execution/action` remains for staged shooting-session actions;
- a narrow `/api/sec-progression/evaluate` route owns cross-session evaluation;
- attempting `secProgressionEvaluation` through an ordinary shooting-session route fails closed with `cross_session_progression_route_required`;
- no equipment selection, target image capture, physical observation entry, stage/event run, or authoritative shooting-session ID is fabricated.

The result receives a backend-authoritative `progressionEvaluationId`, not a false `authoritativeSessionId`.

## 6. Required subject-continuity boundary

Progression requires proof that all input SECs belong to one authorized continuity scope. The current preservation model proves authoritative session and target identity, but it does not establish a backend-authoritative shooter/account identity across sessions.

V1 must therefore distinguish:

- `progressionSubjectId` — a backend-authoritative opaque continuity identifier;
- verified real-world identity — **not established**;
- account ownership/authentication — **not established unless separately implemented**.

Browser-local profile names, client-generated IDs, shooter-entered names, matching equipment, and possession of SEC IDs cannot establish subject continuity.

The proposed implementation uses a **synthetic test-only Progression Subject Authority** for architecture acceptance. Production evaluation remains fail-closed until Founder separately authorizes an authenticated or otherwise governed backend subject-continuity owner. No real Baker progression result is authorized by Gear 5 alone.

## 7. Immutable source-SEC eligibility

Every input must be loaded by the backend from the preservation store. The browser may request candidate SEC identities; it may not supply authoritative SEC bodies, scores, outcomes, timestamps, hashes, or family results.

An eligible input must establish:

- exact preserved SEC/session identity;
- exact artifact SHA-256 and immutable preservation record;
- backend-authoritative source result;
- exact source Target Execution Contract fingerprint where contract-backed;
- exact target, publisher product, mission family, result-package type/version, and claim grade;
- result reconciliation and family validation status;
- preservation timestamp and source result identity/hash;
- exact match to the Progression Profile's input-eligibility declaration;
- exact progression subject binding;
- absence from any disallowed or already-consumed transition set.

Missing, mutable, unverifiable, foreign-subject, duplicate, unsupported-family, wrong-target, wrong-claim-grade, in-progress, authority-unavailable, or tampered SECs are ineligible. Ineligible inputs cannot advance state.

## 8. No historical rewriting or silent re-scoring

The evaluator may read only normalized facts already established by the source family result. It must not:

- reclassify source observations;
- rerun UGO under new geometry;
- recalculate an old score under a new scoring component;
- convert evidence-only results into scores, qualification results, diagnoses, or decisions;
- apply a newer source-family Profile to an older result;
- edit a source SEC or its preservation metadata;
- replace an old progression record when a new SEC arrives;
- silently recompute prior levels after a Progression Profile revision.

Each progression evaluation freezes its exact input SEC identities/hashes, normalized input facts, Profile version/digest, prior progression record, evaluation time, and resulting transition.

## 9. Progression input fact adapters

V1 does not authorize arbitrary JSON paths, browser formulas, executable expressions, or a generic rules scripting engine.

A narrow family-level adapter registry converts validated source results into approved normalized facts. Initial synthetic validation may use only already governed facts such as:

- Precision/Open Score: authoritative total and completion state;
- Qualification: practice/simulation outcome and exact claim grade;
- Cue/Drill: terminal state and reconciled cue count;
- Diagnostic: publisher-label-match counts without converting labels into diagnosis;
- Decision: publisher-designated match counts without converting them into legal/tactical judgment.

Adding a new normalized source fact is a family-level controlled change. A Progression Profile may select only registered facts exposed by the exact source-family adapter. It cannot reach into arbitrary result fields.

Source-family authority remains unchanged. For example, a practice Qualification PASS may be an eligible progression fact, but it does not become an official qualification.

## 10. Progression Profile v1

The Profile is bounded declarative data. It contains no code or arbitrary expressions.

### Authority envelope

The Profile must establish:

- immutable Profile ID/version and digest;
- publisher/rules owner and exact source documents;
- approval, effective window, lifecycle, suspension/revocation, and supersession state;
- exact registered publisher product/lineage bindings;
- allowed claim grade: `governed_progression_result` only;
- progression program identity and exact level vocabulary;
- subject-continuity requirement;
- input eligibility and input-consumption policy;
- transition rules and unsupported behavior.

### Input eligibility

Each allowed input tuple declares:

- exact target/product scope or explicitly authorized product set;
- mission family and result-package type/version;
- allowed source Profile/contract versions where required;
- required terminal and reconciliation states;
- required claim grade;
- registered normalized fact ID;
- preservation-time window or cutoff policy;
- duplicate and reuse policy.

V1 defaults to single-use SEC consumption within one progression lineage. Reusing one SEC to produce several advances is unavailable unless an exact future Profile explicitly authorizes and explains it.

### Levels and transitions

V1 supports only ordered levels and bounded declarative conditions:

- stable `levelId`, order, and publisher-supplied label;
- starting level;
- required eligible SEC count;
- registered normalized fact;
- comparator: `equal`, `greater_than_or_equal`, or `less_than_or_equal`;
- exact threshold/value;
- aggregation mode: `all_selected` or `count_meeting_condition`;
- maximum one-level advance per evaluation;
- explicit `advance`, `hold`, `insufficient_evidence`, and `ineligible_inputs` results.

Demotion, decay, resets, streak-breaking, weighted averages, best-of selection, rolling windows, branching levels, cross-program credit, and Profile migration are unavailable in V1 unless catalog authority later proves they are required.

## 11. Progression state and append-only records

The backend owns an append-only progression lineage keyed by:

> `progressionSubjectId + registered product relationship + Progression Profile ID/version`

Each immutable record contains:

- backend `progressionEvaluationId` and record hash;
- opaque subject-continuity ID and identity claim limitation;
- exact registered publisher product and progression program;
- exact Profile ID/version/digest and authority sources;
- prior progression record ID/hash or explicit genesis state;
- cutoff and evaluation timestamps;
- ordered input SEC IDs, artifact hashes, result identities/hashes, preservation times, and normalized facts;
- eligible, ineligible, newly consumed, and previously consumed input identities;
- prior level, resulting level, and transition result;
- deterministic reason codes;
- explicit unavailable capability states;
- evaluator, adapter, preservation, and authority trace.

The current level is the latest valid record in the exact lineage. It is never a mutable field written over prior history.

Concurrent evaluations use compare-and-set against the prior record hash. Stale or competing transitions fail closed. Idempotent retries return the same record.

## 12. Profile revision and historical reconstruction

A Profile revision never silently changes an existing lineage or old result.

- every old record reopens under its original Profile version and frozen inputs;
- V1 keys state by exact Profile version;
- a new Profile version starts an independent lineage unless a separately governed migration policy is later approved;
- no automatic carry-forward, level translation, or retroactive recomputation occurs;
- reopening an old record presents the old rules and result exactly, even if the Profile is now superseded.

Late-arriving SECs do not rewrite prior records. They may be considered only by a later evaluation under the exact active Profile and cutoff policy.

## 13. Result and presentation boundary

`secProgressionResult` v1 may show:

- exact publisher product/program and Profile version;
- prior level and resulting level;
- `advanced`, `held`, `insufficient_evidence`, or `ineligible_inputs`;
- exact eligible and rejected SEC references with reason codes;
- normalized facts used, with their original source-family labels and claim grades;
- exact prior progression record;
- prominent **Governed Progression Result — Derived from Preserved SECs** label;
- verified real-world identity: not established;
- certification, qualification, readiness, mastery, medical, and tactical claims: not established;
- exact preservation and reopen identities.

The record must not display a newly calculated shot score, rewritten source result, unofficial credential, or a claim stronger than any source SEC permits.

Because this is a derived cross-session record, it uses the Universal SEC presentation shell but is explicitly typed **Progression Record**, not **Shooting Session SEC**.

## 14. Preservation boundary

Existing shooting SEC preservation remains unchanged. A progression result must not be inserted by pretending it has an authoritative shooting-session ID.

V1 adds a separate append-only Progression Record store and validator. The Vault may list the typed record beside shooting SECs, but exact reopen dispatches through `sec-progression-family` and validates:

- progression evaluation ID/hash;
- exact prior record chain;
- exact source SEC identities/artifact hashes;
- exact Profile and input-fact adapter versions;
- subject scope;
- deterministic transition reconciliation.

Deleting, modifying, or replacing source SECs or earlier progression records is not authorized.

## 15. Explicitly unavailable or not applicable

- executable Baker Bullseye Challenge progression without the approved 20-page guide;
- verified real-world shooter identity or account ownership;
- official skill level, credential, certification, qualification, or readiness;
- re-scoring, reclassification, or mutation of historical SECs;
- automatic Profile migration or retroactive level changes;
- client-authored SEC bodies, metrics, levels, or transitions;
- arbitrary JSON paths, formulas, expressions, or scripts;
- cross-subject aggregation;
- leaderboard, social comparison, coaching, diagnosis, prediction, or recommendation;
- demotion, decay, reset, branching, weighted, or rolling-window rules;
- target-image capture or physical observation entry in the progression evaluator;
- using product quantity/pack size as a behavioral distinction.

## 16. Smallest proposed implementation scope

### New files

- `docs/backend/executors/sec_progression_evaluator.py` — bounded Profile validation, eligibility evaluation, transition calculation, and strict result validation.
- `docs/backend/progression_input_facts.py` — controlled source-family fact adapters; no target IDs.
- `docs/backend/sec_progression_authority.py` — cross-session route service, subject/input resolution, idempotency, and compare-and-set orchestration.
- `docs/backend/progression_record_store.py` — append-only target-agnostic lineage/record store.
- `docs/backend/migrations/005_create_progression_records.sql` — progression lineage and immutable record tables.
- `docs/backend/target_execution_contracts/profiles/sec_progression_profile.schema.json` — bounded V1 Profile schema.
- `docs/backend/test_fixtures/sec_progression_scale.py` — two independent authority-complete programs plus a data-only third Profile.
- `docs/backend/test_sec_progression_evaluator.py` — eligibility, transition, immutability, revision, subject, concurrency, tamper, and scale coverage.
- `docs/production/sec_progression_family_review_server.py` — local-only synthetic subject/profile review authority.
- `docs/production/sec_progression_family_browser_test.mjs` — complete history evaluation, Progression Record preservation, and exact-reopen test.
- `docs/history/episodes/episode56-target-capability-coverage/SEC_PROGRESSION_EVALUATOR_IMPLEMENTATION_REPORT.md` — created only after authorized implementation and validation.

### Existing family-level files modified once

- `docs/backend/target_execution_contract.py` — admit the exact Progression family/result relationship; no resolver redesign.
- `docs/backend/target_execution_contracts/schema.json` — admit only the exact Progression tuple.
- `docs/backend/execution_capability_registry.py` — register the evaluator/validator/SEC/preservation owner; ordinary single-session execution remains refused.
- `docs/backend/server.py` — add one cross-session `/api/sec-progression/evaluate` route that remains fail-closed without governed subject authority.
- `docs/backend/session_authority.py` — refuse Progression as an ordinary shooting session with one family-level guard.
- `docs/sec_adapter_model.js` — register `sec-progression-family` as a typed Progression Record.
- `docs/sec_dispatch.js` — admit the exact Progression family/result/adapter tuple.
- `docs/target_execution_runtime.js` — render and validate the Progression Record family without treating it as a shooting session.
- `docs/records.html` — list typed immutable Progression Records and dispatch exact reopen.
- `docs/package.json` — add focused backend/browser validation commands.
- `docs/history/episodes/episode56-target-capability-coverage/CAPABILITY_ENGINE_STATUS.md` — record the governed Gear 5 state.

The Baker target registrations, executable real Progression Profile, and production subject authority are not part of the synthetic architecture proof.

## 17. What explicitly will not change

- any source SEC artifact, hash, result, score, observation, Profile, or preservation timestamp;
- `docs/backend/preserved_sec_store.py` and its immutable shooting-session admission;
- existing progression-unaware historical SEC behavior;
- Cue/Drill, Qualification, Diagnostic, Decision, Precision/Open Score, Smart Evidence, Recreational Challenge, or Zeroing executors;
- stage/event primitives, durable shooting-run store, or action route;
- UGO, scoring, or target registration authority;
- `docs/m4_runtime.js`;
- Publisher Product Boundary, Backend Authority, Universal SEC ownership, or Zeroing isolation;
- real Baker Bullseye Challenge authority packaging;
- existing targets, product routes, or target-ID/SKU production branches;
- Gear 6 Collection/Hand behavior.

## 18. Three-program scale acceptance

1. **Precision ladder** — multiple immutable Precision/Open Score SECs produce deterministic hold then advance under one synthetic Profile.
2. **Practice-course ladder** — immutable Qualification practice/simulation SECs produce progression while preserving `officialQualification: not_established`.
3. **Data-only independent program** — a new publisher/product/Profile becomes evaluable with zero target-ID production-code edits.

The test must prove:

- two independent progression programs inherit one evaluator, adapter, and record store;
- the third program requires Profile/contract data only;
- source SECs remain byte-for-byte and hash-identical before and after evaluation;
- one SEC cannot advance the same lineage twice under the default single-use policy;
- foreign-subject, tampered, missing, duplicate, in-progress, and authority-ineligible inputs cannot advance;
- a stale concurrent evaluation fails closed;
- Profile v2 does not recompute or migrate Profile v1 history;
- old records reopen exactly with original input hashes and Profile version;
- no target-ID/SKU production edit exists.

Any product-specific branch required for the data-only program is a failed scale acceptance test.

## 19. Validation plan

- validate Profile authority, source documents, lifecycle/effective window, component bindings, level ordering, bounded comparators, and adapter IDs;
- validate backend-only SEC loading and artifact/result hash reconciliation;
- prove client-submitted SEC bodies, metrics, subject IDs, prior levels, and transitions are ignored or rejected;
- prove source-family validation and claim grade survive normalization without authority expansion;
- test hold, advance, insufficient evidence, ineligible inputs, duplicate consumption, cutoff, deterministic ordering, and idempotency;
- test compare-and-set concurrency and append-only prior-record chain;
- test Profile suspension, revocation, digest mismatch, version change, and no automatic migration;
- test exact Progression Record preservation and reopen without a fabricated shooting session;
- run all Gear 1–4, Target Execution, Session Authority, Universal SEC, Vault, preservation, Vital Dude, Baker, IDPA, existing-target, and historical-SEC regressions;
- verify `preserved_sec_store.py`, all source executors, `m4_runtime.js`, source SEC fixtures, and existing historical records remain unchanged;
- inspect production surfaces for fixture target IDs/SKUs;
- preserve active Cody time separately from permission friction, unattended waiting, and Founder-response waiting.

## 20. Expected catalog effect

One reusable owner can cover both currently identified Baker Bullseye Challenge offerings because pack size does not change behavior. The catalog evidence still represents only one real lineage, so broad generality is accepted only after the independent synthetic programs pass.

Real-product execution remains blocked by:

1. the missing approved/licensed Baker 20-page guide authority; and
2. the missing production-grade backend subject-continuity authority.

The architecture may pass while those products truthfully remain at their lower authorized capability boundary.

## 21. Founder decisions required

Founder approval is required before implementation for:

1. the exact family identities in section 4;
2. Progression as a cross-session route/result rather than a fabricated shooting session;
3. a separate append-only Progression Record store instead of weakening `preserved_sec_store.py`;
4. synthetic test-only subject authority, with production use remaining blocked;
5. the bounded normalized-fact and level-rule vocabulary;
6. Profile versions creating independent lineages with no automatic migration;
7. the exact implementation scope and three-program acceptance test.

No conflict with M-009, ADR-001, M-010, M-011, M-012, the Publisher Product Boundary, or the locked Target Execution Contract is identified. No implementation, authority packaging, target registration, source SEC change, commit, push, deployment, or production-state change is authorized by this specification.
