# Decision Scenario Evaluator — Founder Specification

**Status:** Founder review; specification only  
**Episode:** 56 — Capability Engine, Gear 4  
**Population evidence:** 8 Baker offerings / 8 lineages  
**Implementation:** Not authorized by this document

## 1. Governing objective

Implement the smallest reusable owner that can present an exact publisher-authorized scenario, associate governed response evidence or an explicit no-response record with that presentation, and evaluate only whether the recorded response matches the publisher-authorized designation:

> **Publisher product → governed registration → Decision Scenario Profile → Decision Scenario Evaluator → publisher-designated response result → Universal SEC → preservation → exact reopen**

The family reuses Gear 1's authority-neutral presentation, response-window, event-association, durable-state, and no-response mechanics. It does not invoke or inherit Cue/Drill authority.

V1's shooter-facing truth label is:

> **Publisher-Designated Response Match — Not Legal or Tactical Judgment**

## 2. Evidence and authority boundary

The current catalog evidence consists of Baker's Good/Bad Dan, Dave, Jeff, and Rich products:

| SKU | Exact product |
|---|---|
| `DS-BadDan` | Bad Dan Target |
| `DS-BadDave` | Bad Dave Target |
| `DS-BadJeff` | Bad Jeff Target |
| `DS-BadRich` | Bad Rich Target |
| `DS-GoodDan` | Good Dan Target |
| `DS-GoodDave` | Good Dave Target |
| `DS-GoodJeff` | Good Jeff Target |
| `DS-GoodRich` | Good Rich Target |

Baker may establish the exact product identity, pair relationship, printed content, and publisher designation represented by Good/Bad or shoot/no-shoot language. That does not make the catalog listing sufficient authority for a digital course's order, randomization, timing, shot limits, penalties, scoring, transitions, completion rules, legal meaning, tactical correctness, or use-of-force judgment.

Those richer fields must be present in an approved Decision Scenario Profile or remain unavailable. Artwork, image recognition, a product-name substring, and target category are never runtime authority.

## 3. Claims that must remain separate

| Experience | Owner | Truthful claim |
|---|---|---|
| Evidence only | Existing `smartEvidenceCapture` | Visible observations were recorded against the exact registered publisher product. |
| Publisher designation recall | Decision V1 | The exact publisher-authorized scenario was presented, and the recorded response evidence matched, did not match, or could not establish the publisher-designated response. |
| Legal/tactical/use-of-force judgment | Separately governed future authority | A response was justified, lawful, tactically appropriate, safe, necessary, or compliant under an exact external standard. |

V1 implements the middle claim only. A result may say **match**, **mismatch**, **unresolved**, or **incomplete** relative to the publisher designation. It must not call a person good, bad, threatening, criminal, innocent, hostile, friendly, lawful, or tactically appropriate as an SCZN3 conclusion.

## 4. Exact family identity

| Owner | Identity | Version |
|---|---|---:|
| Mission family | `decisionScenarioEvaluation` | — |
| Result package | `decisionScenarioResult` | `1` |
| Backend evaluator | `decision-scenario-evaluator` | `1` |
| SEC adapter family | `decision-scenario-family` | `1` |
| Preservation validator | `decision-scenario-preservation` | `1` |
| Profile | `decision-scenario-profile` | `1` |

`missionFamily` remains the sole authority-pipeline switch. Decision must not invoke Smart Evidence, Cue/Drill, Qualification, Diagnostic, Progression, Collection/Hand, scoring, or Zeroing executors.

## 5. Smallest correct shooter experience

For an authority-complete registered product:

1. Open the exact publisher product and choose **Publisher Decision Scenario** from its independently authorized capabilities.
2. Review the publisher, exact product/SKU, Decision Profile version/source, claim limitation, and whether timing is merely a practice window.
3. Start an authoritative session resolving exactly `targetProfileId + decisionScenarioEvaluation`.
4. Load or capture the admitted target evidence required by the contract.
5. The backend establishes and issues the exact governed scenario identity and current presentation event.
6. The shooter records visible observation evidence, or affirmatively records **no observable response captured**.
7. The backend associates the response record with the active scenario and reconciles it against the Profile's exact publisher-designated expected response.
8. The backend advances only through Profile-authorized transitions and reaches `complete` or an explicit `stopped_incomplete` state.
9. Universal SEC shows only the exact presentation, recorded evidence, publisher designation, reconciliation outcome, and authority provenance.
10. Save and reopen the exact preserved result.

For the current Baker line, each SKU remains an independent registered publisher product and contract. V1 does not silently combine the paired Good/Bad SKUs into a randomized multi-product course. Such composition requires an independently approved Profile with exact product bindings, presentation assets, sequence authority, and completion rules.

## 6. Existing architecture inherited unchanged

### Locked authority and product architecture

- M-009, ADR-001, M-010, M-011, and M-012;
- Publisher Product Boundary, KTIS, Publisher Authority Profile, and UGO;
- exact Target Execution Contract resolution by `targetProfileId + missionFamily`;
- one product may expose several capabilities, but one selected capability resolves and executes independently;
- missing optional Decision authority leaves Smart Evidence available where independently authorized.

### Shared platform lifecycle

- Session Authority and Backend Authority;
- generic `/api/target-execution` and `/api/target-execution/action` routing;
- target-agnostic durable mission-run/event storage;
- monotonic backend action sequence, idempotency, and stale-action refusal;
- evidence-image admission, normalized observations, and UGO classification where authorized;
- backend result identity/hash and exact contract fingerprint;
- Universal SEC, generic contract-backed preservation, Ballistic Vault dispatch, and exact reopen.

### Gear 1 primitives reused without Cue/Drill authority

- authoritative presentation/event identity;
- active response association;
- explicit no-observation event representation;
- optional practice response-window representation and clock provenance;
- transition and terminal-state mechanics;
- durable event log and deterministic result reconstruction.

Decision owns scenario identity, publisher-designated expected response, and Decision result semantics. Cue/Drill continues to own only cue orchestration. Shared mechanics do not transfer authority between the families.

## 7. Decision Scenario Profile v1

The Profile is bounded declarative `components.mission.definition` data in the exact Target Execution Contract. It may contain no executable code, formulas, client-authored expected-response maps, arbitrary scripts, or target-ID routing instructions.

### Authority envelope

The Profile must establish:

- immutable Profile ID/version and component digest;
- publisher/rules-owner identity;
- exact source identity, revision/reference, content hash, and effective date;
- approval authority/status and effective window;
- active, suspended, revoked, and superseded state;
- exact Target Profile, registered product edition, registration, geometry, and asset bindings;
- `claimGrade: publisher_designation_response_match` only;
- exact approved publisher-facing labels and limitation text.

### Scenario presentation

Each authorized presentation contains:

- stable `scenarioId` and `presentationId`;
- exact registered product/edition binding;
- publisher-authorized display identity and source reference;
- admitted presentation asset or exact registered target reference;
- optional exact UGO entity references;
- stable order for V1;
- response policy and transition rule;
- exact terminal behavior.

V1 permits a fixed Profile-defined presentation sequence. Seeded randomization, external commands, and multi-product presentation are unavailable unless their complete authority and asset bindings are separately approved. They are not inferred from Gear 1's technical ability to orchestrate them.

### Expected response

The Profile must declare exactly one expected response per presentation:

- `observation_required`; or
- `no_observation_expected`.

For `observation_required`, it declares the allowed minimum/maximum observation count and any exact authorized entity set. For `no_observation_expected`, the only expected count is zero.

Core execution language remains neutral. A publisher-supplied “shoot” or “don't shoot” display label may be shown only with its publisher/source attribution. Internally, SCZN3 evaluates the governed evidence state, not a person's moral, legal, or tactical status.

### Response window and evidence mode

The Profile declares:

- `timingPolicy.mode`: `untimed` or `fixed_practice_window`;
- an exact practice window when applicable;
- the permitted evidence mode: `manual_observation`, `explicit_no_observation`, or both;
- whether an unresolved or ambiguous observation repeats, advances, or stops;
- completion and explicit-stop behavior.

The backend may own the presentation window for practice orchestration. Without a separately authorized sensor/timer source, it does not own physical shot time or prove that a shot did or did not occur.

## 8. No-response is first-class evidence

Three states must never be collapsed:

1. **Explicit no-observation record** — the shooter/instructor affirmatively records that no visible response observation was captured for the active presentation.
2. **Authoritative practice-window expiration** — the backend records that its governed presentation window closed without a response event; this proves only the absence of a recorded response within that system window.
3. **Missing evidence** — the run lacks a valid response event or governed window closure.

Only the first two may be compared with `no_observation_expected`, and each must retain its exact provenance. Missing evidence is `incomplete` or `unresolved`; it is never silently treated as a correct no-response.

An explicit no-observation record does not prove no physical shot was fired. Manual observations do not prove physical shot timing. The SEC must preserve both limitations.

## 9. Evaluation and result semantics

For each presentation, the evaluator produces one of:

- `matched` — governed recorded response kind/count/entity state matches the exact publisher designation;
- `mismatched` — governed recorded evidence contradicts the exact publisher designation;
- `ambiguous` — evidence classification cannot choose one authorized entity;
- `unresolved` — evidence cannot be associated with the authorized scenario/entity;
- `missing` — required response evidence or governed closure is absent;
- `stopped_incomplete` — the shooter explicitly stopped before Profile completion.

`decisionScenarioResult` v1 contains:

- backend-authoritative result/session identity and result hash;
- exact publisher, product, SKU, Target Profile, contract, and component identities;
- exact Decision Profile ID/version/digest and publisher source;
- terminal status: `complete` or `stopped_incomplete`;
- ordered scenario/presentation and backend event identities;
- exact publisher designation and neutral expected-response enum;
- associated observations or explicit no-observation/window-closure records;
- per-presentation reconciliation state and exact provenance;
- matched, mismatched, ambiguous, unresolved, and missing counts;
- response-window and clock provenance;
- `claimGrade: publisher_designation_response_match`;
- `legalJudgmentStatus: not_established`;
- `tacticalJudgmentStatus: not_established`;
- `useOfForceStatus: not_established`;
- `physicalShotTiming.status: unavailable` absent separate authority;
- `scoring.status: not_applicable`;
- explicit unavailable capability states and complete authority trace.

A complete result may include mismatches. Completion means the governed sequence reached its terminal state; it does not mean the shooter made every publisher-designated response.

## 10. Universal SEC boundary

The Decision SEC may show:

- exact publisher product and SKU;
- exact Decision Profile and publisher/source authority;
- prominent **Publisher-Designated Response Match — Not Legal or Tactical Judgment** label;
- each exact presented scenario and its publisher designation;
- recorded observations or declared/system-window no-response with provenance;
- match, mismatch, ambiguous, unresolved, and missing results;
- practice-window timing with explicit clock provenance;
- scoring not applicable and physical shot timing unavailable;
- exact contract, backend result, component digests, preservation identity, and exact reopen.

It must not show or imply:

- lawful/unlawful, justified/unjustified, safe/unsafe, threat/non-threat, friendly/hostile, criminal/innocent, or tactically correct/incorrect;
- official use-of-force, agency, qualification, certification, instructor, or legal result;
- points, score, penalties, ranking, coaching, correction, anatomy, medical consequences, intent, or causation;
- a missing response as a successful no-response;
- a publisher designation as SCZN3's independent conclusion.

## 11. Explicitly unavailable or not applicable

- legal, tactical, ethical, threat, intent, or use-of-force interpretation;
- government/agency course or official qualification claims;
- scoring, penalties, pass/fail, certification, or credentialing;
- physical shot timing, automatic shot detection, or sensor-confirmed latency;
- target recognition or artwork-driven expected-response selection;
- facial, anatomical, weapon, object, or pose recognition;
- automatic Good/Bad pairing or multi-product scenario composition;
- randomized/external-command execution without separately approved Decision Profile authority;
- branching narrative or unrestricted scenario scripting;
- diagnosis, correction, progression, or collection/hand behavior;
- client-authored scenario identity, expected response, terminal state, or authoritative result.

## 12. Smallest proposed implementation scope

### New files

- `docs/backend/executors/decision_scenario_evaluator.py` — Profile validation, Decision transitions, response reconciliation, result production, and strict result validation.
- `docs/backend/target_execution_contracts/profiles/decision_scenario_profile.schema.json` — bounded V1 Profile schema.
- `docs/backend/test_fixtures/decision_scenario_scale.py` — three synthetic authority-complete products, including the data-only fixture.
- `docs/backend/test_decision_scenario_evaluator.py` — family, authority, no-response, timing, tamper, preservation, and scale coverage.
- `docs/production/decision_scenario_family_review_server.py` — local-only review authority.
- `docs/production/decision_scenario_family_browser_test.mjs` — full three-fixture lifecycle through exact reopen.
- `docs/history/episodes/episode56-target-capability-coverage/DECISION_SCENARIO_EVALUATOR_IMPLEMENTATION_REPORT.md` — created only after authorized implementation and validation.

### Existing family-level files modified once

- `docs/backend/stage_event_primitives.py` — add only authority-neutral presentation-envelope and explicit no-response reconciliation helpers not already shared.
- `docs/backend/target_execution_contract.py` — admit the exact family/result relationship; no resolver redesign.
- `docs/backend/target_execution_contracts/schema.json` — admit only the exact Decision tuple.
- `docs/backend/execution_capability_registry.py` — register the one evaluator/validator/SEC/preservation owner.
- `docs/target-experience.html` — add shared Decision presentation/response controls without product selectors.
- `docs/target-experience.css` — family-level presentation and result states only.
- `docs/target_execution_runtime.js` — family-level action transport, validated result/SEC rendering, preservation admission, and exact-reopen rendering.
- `docs/sec_adapter_model.js` — register `decision-scenario-family` and its result identity.
- `docs/sec_dispatch.js` — admit only the exact Decision family/result/adapter tuple to the existing generic SEC dispatch path.
- `docs/ballistic_vault.js` — render only validated Decision summaries and exact reopen.
- `docs/execution_capability_matrix.json` — add the exact governed family tuple.
- `docs/execution_contract_registry.json` — add synthetic validation registrations/contracts only.
- `docs/execution_family_persistence_rules.json` — add strict Decision preservation validation.

Existing Cue/Drill code is not modified merely to make Decision work. If implementation proves that a neutral mechanic currently exists only inside `cue_drill_orchestrator.py`, the change must be limited to extracting that mechanic into `stage_event_primitives.py`, with byte-equivalent Cue/Drill behavior and full Gear 1 regression. Decision-specific expected-response or result semantics must never move into the shared primitive.

## 13. What explicitly will not change

- Cue/Drill mission/result authority or Profile semantics;
- Qualification or Diagnostic executors, Profiles, results, SECs, or preservation;
- Target Execution Contract component model or resolver semantics;
- Session Authority, Backend Authority, generic action route, durable store schema, or migration;
- `docs/backend/server.py`, `docs/backend/session_authority.py`, `docs/backend/stage_event_store.py`, or `docs/backend/migrations/004_create_mission_execution_runs.sql`;
- UGO ownership or geometry authority;
- target-agnostic backend preservation store;
- `docs/m4_runtime.js`;
- Zeroing Authority isolation;
- existing product registrations, existing targets, historical SECs, or production state;
- Gear 5 Progression or Gear 6 Collection/Hand;
- any target-ID branch, product route, product module, or Baker-specific runtime selector.

## 14. Three-fixture scale acceptance

1. **Publisher-observation-expected scenario** — an exact governed observation produces `matched`; explicit no-response produces `mismatched`.
2. **Publisher-no-observation-expected scenario** — explicit no-response produces `matched`; a governed observation produces `mismatched`; mere missing evidence does not pass.
3. **Data-only independent product** — a distinct publisher/product/SKU becomes executable through Profile/registration/contract data with zero target-ID production-code edits.

All three must complete the full lifecycle:

> **resolve → prepare/start → present → record response or no-response → backend-authoritative terminal result → Universal SEC → preservation → exact reopen**

At least two different products must inherit the same Decision evaluator, SEC family, and preservation owner while retaining exact publisher/product/SKU identity.

Any target-ID production branch required for the third fixture is a failed architecture acceptance test. Stop and surface it rather than adding the branch.

## 15. Validation plan

- validate every Profile authority field, lifecycle/effective window, digest, product/edition, registration, geometry, and asset binding;
- prove presentation identity and expected response come only from the resolved backend contract/Profile;
- prove artwork, product name, catalog category, and browser input cannot choose or alter the designation;
- prove explicit no-response, authoritative window closure, and missing evidence remain distinct;
- prove manual observations and client clocks never become physical-shot timing authority;
- test observation-required/no-observation-expected match and mismatch cases;
- test ambiguous, unresolved, extra, missing, stopped-incomplete, stale-sequence, duplicate/idempotent, and invalid-transition cases;
- reject client-authored result, terminal state, counts, scenario identity, designation, clock provenance, contract fingerprint, or component digest;
- reject missing, inactive, suspended, expired, superseded, incompatible, or tampered Profile authority;
- verify `scoring.status === "not_applicable"` and every legal/tactical/use-of-force capability remains unavailable through exact reopen;
- preserve evidence image, response provenance, publisher identity, result hash, and exact Profile version;
- run complete Cue/Drill regression and prove behavior remains byte-equivalent if any neutral helper is extracted;
- run Qualification, Diagnostic, Target Execution Contract, Session Authority, generic action route, Universal SEC, preservation, Baker SL-ST1, Vital Dude, existing-target, and historical-SEC regressions;
- inspect production files to confirm zero target IDs/SKUs and zero product-specific routes/modules;
- record active Cody time separately from permission/environment friction, unattended waiting, and Founder-response waiting.

## 16. Expected catalog effect

One reusable Decision owner plus authority-complete Profiles can provide a governed path for the 8 currently identified Baker offerings without eight implementations. Current catalog evidence is sufficient to identify the family and product relationships, but not automatically sufficient to authorize every digital sequence/timing/completion field. Each product remains Smart-Evidence-capable at the valid lower boundary until its exact Decision Profile is packaged and approved.

Unusual or provocative artwork does not create a new capability family. Only the required governed behavior does.

## 17. Founder decision required

Founder approval is required before implementation for:

1. the exact family identities in section 4;
2. the V1 claim grade and shooter-facing label;
3. the neutral expected-response enums and fail-closed no-response rule;
4. fixed Profile-defined presentation as the V1 ceiling;
5. the exact files and shared-helper boundary in section 12;
6. the three-fixture acceptance test and unchanged-owner boundary.

No conflict with the locked Target Execution Contract, M-010 Publisher Product Boundary, M-011, or M-012 is identified. No implementation, registration, catalog change, commit, push, deployment, or production-state change is authorized by this specification.
