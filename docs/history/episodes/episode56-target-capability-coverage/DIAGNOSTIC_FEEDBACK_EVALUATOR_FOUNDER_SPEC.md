# Diagnostic Feedback Evaluator — Founder Specification

**Status:** Founder review; specification only  
**Episode:** 56 — Capability Engine, Gear 3  
**Population evidence:** 16 offerings / 13 lineages  
**Implementation:** Not authorized by this document

## 1. Governing objective

Implement the smallest reusable owner that can truthfully relate recorded observations to exact publisher-defined target labels without turning SCZN3 into the source of diagnosis, causation, correction, medical meaning, anatomy, tactics, or shooting doctrine:

> **Publisher product → governed registration → exact UGO region → Diagnostic Feedback Profile → Diagnostic Feedback Evaluator → publisher-label-match result → Universal SEC → preservation → exact reopen**

The catalog evidence supports one reusable behavior. Left/right-handed tutors, humorous labels, bullseye layouts, silhouettes, pack sizes, and the Navy composition are Profile/data variants—not separate executors.

## 2. Critical truth boundary

Three claims must remain distinct:

| Experience | Correct owner | Truthful claim |
|---|---|---|
| Evidence only | Existing `smartEvidenceCapture` | Visible observations were recorded against the exact registered product. No label or diagnostic claim. |
| Publisher label match | New Diagnostic family | An authorized observation location matched an exact publisher-defined region carrying this exact publisher-supplied label. |
| Causal or corrective feedback | Separately governed future authority | The evidence supports a stated cause, technique assessment, correction, recommendation, or other interpretation under an exact authorized method. |

V1 implements only **publisher label match**. It may count matched labels as an evidence summary, but it may not select a dominant diagnosis, infer why a shot occurred, prescribe a correction, or rewrite a publisher label as SCZN3 advice.

The shooter-facing grammar must be:

> **“Publisher label matched: [exact label].”**

It must not be:

> **“SCZN3 diagnosed…”**, **“Your error was…”**, **“You should correct…”**, or any equivalent causal claim.

## 3. Proposed family identity

| Owner | Identity | Version |
|---|---|---:|
| Mission family | `diagnosticFeedbackEvaluation` | — |
| Result package | `diagnosticFeedbackResult` | `1` |
| Backend evaluator | `diagnostic-feedback-evaluator` | `1` |
| SEC adapter family | `diagnostic-feedback-family` | `1` |
| Preservation validator | `diagnostic-feedback-preservation` | `1` |
| Profile | `diagnostic-feedback-profile` | `1` |

`missionFamily` remains the sole authority-pipeline switch. Diagnostic must not invoke Smart Evidence, Precision/Open Score, Cue/Drill, Qualification, Decision, Progression, Collection/Hand, or Zeroing executors.

## 4. Smallest correct shooter experience

For an authority-complete product/Profile relationship:

1. Open the exact registered publisher product.
2. Choose **Publisher Diagnostic Labels** from the product’s independently authorized capabilities.
3. Review the publisher, product, SKU, exact Diagnostic Profile revision/source, target orientation, handedness applicability where relevant, and label-match limitation.
4. Acknowledge that the experience returns publisher labels—not SCZN3 diagnosis or correction.
5. Start an authoritative session resolving exactly `targetProfileId + diagnosticFeedbackEvaluation`.
6. Load/capture the registered target evidence and satisfy the existing UGO registration gate.
7. Record visible shot observations.
8. Receive backend-owned UGO classifications for each observation.
9. Show the exact publisher-supplied label only for an unambiguous authorized region match.
10. Show explicit `unmapped`, `ambiguous`, or `registration_unavailable` states instead of inventing a label.
11. View the Universal SEC, save it, and reopen the exact preserved result.

No stage/event execution is required. Gear 3 is a one-session evaluator over admitted evidence and exact registered geometry.

## 5. Existing architecture inherited unchanged

### Publisher Product Boundary and authority

- M-009, ADR-001, M-010, M-011, and M-012;
- Publisher Product Boundary, KTIS, Publisher Authority Profile, and UGO;
- exact `targetProfileId + missionFamily` Target Execution Contract resolution;
- registration establishes the relationship; authority determines the available capability;
- multiple capabilities on one product resolve and execute independently.

### Platform lifecycle

- Session Authority and Backend Authority;
- the existing stateless `/api/target-execution` execution path;
- admitted image evidence and normalized observation capture;
- Universal SEC, generic contract-backed preservation, Ballistic Vault dispatch, and exact reopen;
- target-agnostic backend preservation and generic M4 preservation delegation.

### Existing behavioral primitives

- exact UGO geometry/coordinate ownership;
- normalized observation validation;
- circle/rectangle containment, region priority, ambiguity, and outside handling already proven by precision/open scoring and Qualification;
- backend result identity/hash, component-digest trace, and fail-closed contract binding.

Diagnostic consumes these mechanics. It does not acquire scoring, course, orchestration, qualification, correction, or other owners’ authority.

## 6. Diagnostic Feedback Profile v1

The Profile is the approved `components.mission.definition` inside an exact Target Execution Contract. It is bounded declarative data and may contain no executable code, formulas, templates, or client-supplied label mappings.

### Authority envelope

The Profile must establish:

- immutable Profile ID and version;
- publisher/rules-owner ID and name;
- source document or exact publisher-representation identity, revision/reference, content hash, and effective date;
- approval authority/status and effective window;
- active, suspended, revoked, and superseded state;
- exact Target Profile ID/version and registered product edition;
- exact registration and geometry component digests;
- exact coordinate convention and authorized orientation;
- exact label language/locale;
- allowed claim grade: `publisher_label_match` only in V1.

Catalog tags such as `diagnostic`, product names such as “Tutor” or “Doctor,” and visually readable artwork are discovery evidence—not sufficient executable authority by themselves. The exact label/region mapping must be packaged and approved.

### Applicability

The Profile declares:

- `handednessApplicability`: `left`, `right`, `ambidextrous`, or `not_applicable`;
- whether a shooter declaration is required;
- exact authorized orientation, defaulting to the registered publisher orientation;
- whether rotation or mirroring is allowed; V1 defaults both to false;
- required product variant/edition;
- minimum UGO registration state and any exact boundary-uncertainty gate.

Shooter-declared handedness is session context only. It does not establish identity, technique, correctness, or publisher authority. A mismatch fails closed before label evaluation; it is never silently mirrored or translated.

### Region-to-label map

Each entry must contain:

- stable `diagnosticRegionId`;
- exact UGO `geometryEntityId`;
- stable `publisherLabelId`;
- exact publisher-supplied display label;
- label source reference and source content hash;
- statement type, bounded in V1 to `publisher_region_label`;
- optional neutral display note copied exactly from approved publisher authority;
- status and effective version.

Every mapped geometry entity must exist in the exact bound geometry component. Duplicate mappings, unknown entities, conflicting labels, equal-priority overlaps, missing source identity, or client-provided mappings fail closed.

### Evaluation policy

V1 supports only:

- `per_observation_region_match`;
- exact count-by-label evidence summary;
- explicit `matched`, `unmapped`, `ambiguous`, and `registration_unavailable` states;
- no automatic dominant-label selection;
- no centroid, group-center, trend, probability, confidence percentage, severity, or causal aggregation;
- no score, pass/fail, threshold, penalty, recommendation, or correction.

A future group-distribution method requires separate authority showing the exact aggregation formula, applicability, validation, and claim meaning. Familiar target usage is not enough.

## 7. UGO and classification boundary

UGO owns where an admitted observation lies. The Diagnostic Profile owns which publisher label is attached to an authorized region. The evaluator composes those two authorities and nothing more.

For each observation:

1. validate admitted normalized coordinates;
2. require the exact registration/coordinate authority;
3. find containing geometry entities;
4. resolve exact priority;
5. return `ambiguous` when the highest priority is not unique;
6. return `unmapped` when no approved diagnostic region matches;
7. copy the exact approved publisher label only after an unambiguous match.

The result may state classification certainty as a categorical authority state—`exact_region_match`, `ambiguous`, `unmapped`, or `registration_unavailable`. It may not invent a statistical confidence score.

## 8. Result semantics

`diagnosticFeedbackResult` v1 contains:

- backend-authoritative result and authoritative session identity;
- exact publisher product, SKU, Target Profile, contract, and component identities;
- exact Diagnostic Profile ID/version/digest;
- applicability declaration and match result;
- admitted image identity and UGO registration/coordinate provenance;
- normalized observations;
- per-observation geometry entity and categorical classification state;
- exact publisher label ID/text/source for matched observations;
- matched, unmapped, ambiguous, and rejected counts;
- count-by-label evidence summary;
- `claimGrade: publisher_label_match`;
- `causalDiagnosisStatus: not_established`;
- `correctionStatus: not_provided`;
- `scoring.status: not_applicable`;
- explicit unavailable capability states;
- result identity/hash and exact authority trace.

At least one admitted observation is required. A result with only unmapped observations remains a valid reconciled label-match attempt with zero matches; it is not an implementation failure and must not invent a nearest label.

## 9. Explicitly unavailable or not applicable

- SCZN3-authored diagnosis;
- causal attribution or technique assessment;
- medical, anatomical, physiological, psychological, legal, or tactical interpretation;
- corrective instruction or recommendation;
- severity, probability, confidence percentage, ranking, or dominant diagnosis;
- scoring, penalties, PASS/FAIL, qualification, certification, or credentialing;
- shot-timing or response-time claims;
- automatic shot detection;
- target rotation/mirroring unless exact future authority allows it;
- image-text extraction as runtime authority;
- client-created regions or labels;
- Diagnostic results inferred from a product name, category, tag, or unusual artwork;
- cross-session progression or trend diagnosis.

An unavailable Diagnostic Profile does not make the product unavailable. Smart Evidence remains the valid lower capability boundary.

## 10. Multi-capability composition

One product may expose Smart Evidence, Diagnostic, Qualification, or another independently governed capability. The shooter selects one relationship, and the resolver executes one exact contract.

For Navy Qual M4 SKU 22460:

- `targetProfileId + smartEvidenceCapture` records evidence only;
- `targetProfileId + diagnosticFeedbackEvaluation` returns only exact publisher label matches;
- `targetProfileId + qualificationCourseEvaluation` evaluates only an independently authorized practice Course Profile.

No executor may opportunistically add another family’s result. Diagnostic labels cannot affect Qualification score or PASS/FAIL unless a future exact Course Profile separately incorporates that authority.

## 11. Universal SEC presentation

The Diagnostic SEC may show:

- exact publisher product and SKU;
- exact publisher/rules owner and Profile source/version;
- prominent **Publisher Label Match — Not an SCZN3 Diagnosis** status;
- admitted target evidence and observation markers;
- exact matched publisher labels beside their observations;
- matched/unmapped/ambiguous counts and count-by-label summary;
- handedness/orientation declaration and applicability result where required;
- scoring not applicable;
- causal diagnosis not established;
- correction not provided;
- exact contract, backend result, component digests, preservation identity, and exact reopen.

It must not rewrite labels into second-person claims, combine labels into advice, suppress ambiguity, imply that publisher labels are medical facts, or present the result as Qualification, scoring, correction, or official training assessment.

## 12. Smallest proposed implementation scope

### New files

- `docs/backend/ugo_observation_classifier.py` — authority-neutral coordinate, containment, priority, ambiguity, and outside classification mechanics extracted from proven precision/open-score behavior.
- `docs/backend/executors/diagnostic_feedback_evaluator.py` — Profile validation, applicability, exact label mapping, evidence reconciliation, result production, and strict result validation.
- `docs/backend/target_execution_contracts/profiles/diagnostic_feedback_profile.schema.json` — bounded V1 Profile schema.
- `docs/backend/test_fixtures/diagnostic_feedback_scale.py` — three synthetic authority-complete products.
- `docs/backend/test_diagnostic_feedback_evaluator.py` — classification, authority, applicability, tamper, preservation, multi-capability, and scale tests.
- `docs/production/diagnostic_feedback_family_review_server.py` — local-only review authority.
- `docs/production/diagnostic_feedback_family_browser_test.mjs` — Founder-facing three-fixture lifecycle through exact reopen.
- `docs/history/episodes/episode56-target-capability-coverage/DIAGNOSTIC_FEEDBACK_EVALUATOR_IMPLEMENTATION_REPORT.md` — created only after authorized implementation and validation.

### Existing family-level files modified once

- `docs/backend/executors/precision_open_score.py` — consume the neutral UGO classifier with byte-for-byte equivalent result behavior.
- `docs/backend/target_execution_contract.py` — admit the exact family/result relationship.
- `docs/backend/target_execution_contracts/schema.json` — admit only the exact Diagnostic tuple.
- `docs/backend/execution_capability_registry.py` — register one Diagnostic owner.
- `docs/target_execution_runtime.js` — family-level result reconciliation, diagnostic presentation, preservation admission, and exact reopen.
- `docs/sec_adapter_model.js` — register `diagnostic-feedback-family`.
- `docs/sec_dispatch.js` — admit the exact family/result/adapter tuple.
- `docs/target-experience.html` and `docs/target-experience.css` — add the diagnostic truth-boundary acknowledgment and result presentation.
- `docs/package.json` — add Diagnostic acceptance commands.
- `docs/history/episodes/episode56-target-capability-coverage/CAPABILITY_ENGINE_STATUS.md` — update Gear 3 state after validation.

### Expected unchanged accumulation surfaces

- `docs/backend/stage_event_primitives.py`;
- `docs/backend/stage_event_store.py`;
- `docs/backend/migrations/004_create_mission_execution_runs.sql`;
- `docs/backend/execution_authority.py`;
- `docs/backend/server.py`;
- `docs/backend/session_authority.py`;
- `docs/backend/preserved_sec_store.py`;
- `docs/backend/executors/cue_drill_orchestrator.py`;
- `docs/backend/executors/qualification_executor.py`;
- `docs/m4_runtime.js`;
- all existing target-specific authority owners and registrations.

A Diagnostic branch in the generic route, Session Authority, durable stage/event store, backend preservation store, or M4 runtime is an accumulation failure and must be surfaced rather than patched around.

## 13. Three-fixture acceptance

Fixtures are synthetic and authority-complete. No catalog product is used to design around incomplete publisher mappings.

### Fixture A — Conventional Right-Handed Tutor

- exact right-handed applicability;
- conventional publisher region labels;
- matched and unmapped observations;
- count-by-label summary;
- no causal or correction language generated by SCZN3.

### Fixture B — Humorous Neutral Label Target

- handedness not applicable;
- non-causal, obviously playful publisher labels;
- proves labels are governed data, not hard-coded diagnostic semantics;
- overlapping regions exercise exact priority and ambiguity refusal.

### Fixture C — Data-Only Left-Handed Tutor

- introduced only after A and B pass;
- new publisher/product/SKU, Target Profile, geometry, orientation/applicability, and label map supplied through governed data;
- complete Universal SEC, preservation, and exact reopen;
- zero target-ID production edits, routes, modules, adapters, or preservation branches.

## 14. Critical acceptance tests

1. Two products inherit `diagnostic-feedback-evaluator` and `diagnostic-feedback-family` while preserving exact identities.
2. The third product becomes playable through Profile/contract/registration data with zero target-ID production edits.
3. Exact publisher labels are returned only for unambiguous authorized region matches.
4. Unmapped observations remain unmapped; no nearest-label inference occurs.
5. Equal-priority overlap returns ambiguous and no label.
6. Left/right-handed applicability mismatch fails before evaluation and is never mirrored.
7. Rotation, edition, Target Profile, geometry digest, label-source hash, Profile version, or coordinate mismatch fails closed.
8. Product tags, names, OCR, client labels, and artwork appearance cannot create authority.
9. Smart Evidence remains independently available when Diagnostic authority is absent.
10. A multi-capability product resolves only the selected mission family.
11. `scoring.status === "not_applicable"`, causal diagnosis remains unestablished, and correction remains unavailable through exact reopen.
12. Existing Precision/Open Score results remain equivalent after neutral classifier extraction.
13. Cue/Drill and Qualification full acceptance remain unchanged.
14. The generic execution route, Session Authority, preservation owner, durable stores, and M4 runtime remain byte-identical.

## 15. Validation plan

### Authority and Profile

- exact Profile/source/approval/effective/lifecycle validation;
- exact Target Profile, edition, registration, geometry, orientation, and label-source binding;
- reject missing, suspended, revoked, expired, superseded, ambiguous, digest-mismatched, or incompatible authority;
- reject unknown geometry entities, duplicate maps, conflicting label identities, executable content, and unbounded fields.

### Classification and result

- normalized coordinates and admitted image identity;
- circle/rectangle containment, priority, equal-priority ambiguity, outside/unmapped, and boundary conditions;
- per-observation exact label copying and count reconciliation;
- zero-match valid result;
- handedness/orientation applicability;
- backend recalculation rejects client classification, label, count, claim grade, status, result hash, or authority trace;
- tampered result fails preservation.

### Truth boundary

- no SCZN3 causal, corrective, medical, anatomical, tactical, scoring, Qualification, or timing claim;
- exact publisher wording and source survive SEC, preservation, Vault summary, and exact reopen;
- humorous labels remain labels and do not create a new capability family;
- causal/corrective fields in a V1 Profile are rejected rather than ignored.

### End-to-end and regression

- complete three-fixture browser lifecycle through exact reopen;
- Precision/Open Score equivalence before/after classifier extraction;
- Cue/Drill and Qualification backend/browser acceptance;
- Target Execution Scale Architecture;
- Session Authority and preserved SEC suites;
- Smart Evidence and recreational challenge families;
- Universal SEC and dispatch;
- Baker SL-ST1 and historical SECs;
- Episode 54 and Episode 55 governed adapters;
- Zeroing Authority isolation;
- JavaScript/Python/schema checks and local production build.

## 16. Failure conditions

Implementation acceptance fails if:

- any fixture, publisher, SKU, handedness, label, or target theme receives an application-code branch;
- Diagnostic imports or invokes another family executor;
- SCZN3 invents, paraphrases, ranks, combines, or corrects from publisher labels;
- an ambiguous or unmapped observation receives a label;
- a handedness/orientation mismatch is silently transformed;
- client data, OCR, catalog tags, or artwork establishes label authority;
- scoring or PASS/FAIL appears in the Diagnostic result;
- a missing Diagnostic Profile makes Smart Evidence unavailable;
- Navy or another multi-capability product silently executes more than one family;
- shared routes, stores, Session Authority, preservation, or M4 runtime require a Diagnostic branch;
- Precision/Open Score, Cue/Drill, Qualification, existing targets, or historical SEC behavior changes.

## 17. Expected leverage

Direct catalog leverage is **16 offerings / 13 lineages**, subject to exact publisher region/label authority packaging.

The proposed reusable relationship is:

> **One Diagnostic Feedback Evaluator + exact UGO geometry + versioned publisher label Profiles**

It is not 16 implementations. Pack-size variants inherit the same Profile lineage where product identity and artwork authority permit. Left/right-handed versions remain separate data bindings to the same owner.

## 18. Founder decisions required

Founder approval is required for:

1. family identity: `diagnosticFeedbackEvaluation → diagnosticFeedbackResult`;
2. V1 claim scope: `publisher_label_match` only;
3. exact shooter-facing language: **Publisher Label Match — Not an SCZN3 Diagnosis**;
4. per-observation region matching and count-by-label summary, with no dominant/group diagnosis;
5. strict handedness/orientation applicability and no silent mirroring;
6. extraction of the neutral UGO classifier from proven Precision/Open Score mechanics;
7. scoring, causal diagnosis, and correction remaining unavailable/not applicable;
8. exact implementation scope and three-fixture acceptance plan.

No implementation begins until Founder approves this specification.
