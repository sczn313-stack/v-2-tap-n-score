# Episode 56 — Reusable Target Execution Scale Architecture Founder Specification

**Status:** FOUNDER ACCEPTED FOR BATCH 2 — FROZEN BASELINE ACTIVE

**Scope:** Smallest reusable architecture that lets a registered publisher product inherit authorized SCZN3 capability composition without target-ID application wiring.

**Architecture baseline frozen:** 2026-08-19 12:00:30 AM EDT

**Runtime effect:** Shared Target Execution Contract resolution, registration-driven family execution, Universal SEC dispatch, preservation admission, exact reopen, catalog discovery, and build inclusion are implemented. No production deployment occurred.

**Batch 2 isolation during architecture work:** Preserved. Founder accepted the frozen baseline, then authorized Batch 2. The new cohort was selected and frozen at 2026-08-19 10:33:13 AM EDT before processing began.

**Governing architecture:** M-009 Composable Target Authority, locked ADR-001 Target Execution Contract, M-010 Publisher Product Boundary, KTIS, UGO, Backend Session Authority, Zeroing Authority isolation, and Universal SEC.

## Governing result

Episode 56 does not demonstrate a conflict with the locked Target Execution Contract. It demonstrates that the contract has not yet been made operational as the shared runtime authorization owner.

The smallest reusable architecture is:

```text
Publisher SKU
  -> registered product relationship (ATP + Registration Package)
  -> available capability inventory
  -> missionFamily selects exactly one authority pipeline
       zeroingCorrection -> existing isolated Zeroing Authority
       all Target Authority families -> Target Execution Contract resolver
  -> exact approved component versions
  -> shared mission-family executor
  -> backend-authoritative Result Package
  -> mission-family SEC adapter
  -> backend-governed preservation and exact recall
```

Registration establishes the digital relationship. It does not manufacture geometry, scoring, a mission, or execution support. A missing optional capability remains `unavailable` or `not_applicable`; it does not make the registered product unknown.

## 1. Existing locked architecture inherited unchanged

The implementation will inherit these decisions without redesign:

1. **Publisher Product Boundary (M-010):** the publisher owns product identity and published meaning; SCZN3 owns the governed digital relationship and may present only admitted claims.
2. **Composable Target Authority (M-009 / ADR-001):** Geometry Profile, ATP, Registration Package, Scoring Profile, Mission Profile, Target Execution Contract, and Mission Result Package retain independent immutable identities and ownership.
3. **Target Execution Contract:** one explicit contract authorizes one exact versioned combination. Unknown, incomplete, incompatible, unapproved, mismatched, expired, suspended, revoked, or unsupported combinations return `authority_unavailable`. There is no fallback contract.
4. **Mission-family routing:** `missionFamily` remains the sole pipeline switch. Neither target identity, an asset, client input, SEC adapter, nor saved data may select or change a pipeline.
5. **Zeroing isolation:** `zeroingCorrection` continues into the independent Zeroing Authority pipeline. The Target Execution Contract does not absorb POIB, corrections, adjustment systems, MOA/MRAD, clicks, or zeroing guidance.
6. **Backend authority:** the client may request a registered target/capability but cannot supply mission authority, component compatibility, support state, result authority, or preservation admission.
7. **Session Authority separation:** Target Admission, Official Mission Eligibility, and Capability Availability remain separate questions. A registered target may be admitted while optional capabilities remain unavailable.
8. **UGO ownership:** geometry owns spatial truth and may preserve image-plane evidence without claiming canonical mapping, physical measurement, or semantic classification.
9. **Universal SEC:** SEC remains presentation-only and receives a strictly validated backend Result Package. It does not authorize composition or calculate results.
10. **Historical compatibility:** existing supported target implementations and preserved SECs remain valid one-component instances. No historical result or target identity is rewritten.

Evidence-only composition does not conflict with ADR-001. It uses an explicit `not_applicable` Scoring Profile and an image-plane Geometry Profile rather than omitting ownership or inventing scoring.

## Frozen implementation acceptance result

The approved architecture passed its governing acceptance test:

- two distinct synthetic publisher products inherited the same `smart-evidence-capture` executor and `smart-evidence-family` SEC adapter;
- each preserved its exact publisher, product, target-profile, and SKU identity through backend-authoritative result, Universal SEC, immutable preservation, and exact reopening;
- neither synthetic target ID appears in production routing, Session Authority, execution, SEC, preservation, catalog, or build source;
- missing, unavailable, suspended, tampered, incompatible, ambiguous, and wrong-role authority failed closed;
- zeroing remained isolated and could not fall through Target Authority;
- precision/open scoring and bounded recreational challenge executors produced validated family results from governed component data;
- Session Authority, preserved SEC, Vital Dude, Baker SL-ST1, governed adapter, M4/zeroing, Universal SEC, Vault, and production build regressions passed;
- automated Chromium and interactive browser validation completed the shared Start → evidence → backend result → SEC → Save → exact reopen flow with no browser console errors.

The production contract directory remains intentionally empty at freeze. Synthetic acceptance products exist only as test fixtures. Founder approval of this frozen baseline remains required before Batch 2 selection or clock start.

Two pre-existing validation limitations remain outside this architecture scope: the monolithic backend authority test still expects the pre-Episode-55 mission-family set and therefore rejects the already-present `idpaTimedPractice` family, and the Baker SL-ST1 Python image-analysis test cannot start in this workspace because OpenCV is not installed. Focused IDPA/Vital Dude, Baker SEC, Session Authority, zeroing, adapter, Vault, build, and scale-architecture regressions passed. Neither limitation was changed or concealed to improve the architecture result.

## 2. Smallest Target Execution Contract implementation required

### 2.1 One backend-owned contract schema and registry

Implement an immutable, versioned Target Execution Contract package. Each contract must bind at minimum the locked fields:

- contract ID and version;
- target profile ID and version;
- geometry profile ID and version;
- registration package ID and version, including approved execution role;
- scoring profile ID and version, including an explicit governed `not_applicable` profile where correct;
- mission profile ID and version;
- mission family;
- result package type and schema version;
- authority contract version;
- shared executor ID/version;
- SEC adapter family ID/version;
- lifecycle/support status, approval provenance, effective dates, suspension, and revocation;
- exact component digests/fingerprints and explicit unsupported uses.

Contract packages are backend-owned governed data. Target manifests may reference candidate components but cannot self-approve a contract.

### 2.2 One fail-closed resolver

Implement one resolver that accepts a backend-resolved target identity plus the requested registered capability. It must:

1. resolve the canonical ATP and exact Registration Package;
2. use `missionFamily` once to select the authority pipeline;
3. route `zeroingCorrection` to existing Zeroing Authority without fallback;
4. for Target Authority families, locate exactly one approved Target Execution Contract;
5. validate every component ID, version, digest, lifecycle, compatibility, and result type;
6. refuse zero matches, multiple matches, stale versions, client conflicts, or unavailable authority;
7. return a backend authority trace and stable contract fingerprint used by Session Authority, execution, SEC, and preservation.

The resolver must never search for a “close” contract, silently select a default mission, substitute a compatible-looking target, or downgrade to evidence-only. Evidence-only is executable only when its own exact contract is approved.

### 2.3 One capability registry, not a target registry of code branches

Register shared executors by mission family and result-package contract, not target ID. A registry entry identifies the executor, accepted component schemas, result validator, SEC adapter family, and preservation validator. It contains no publisher SKU allowlist.

New targets become executable by adding approved authority packages and a Target Execution Contract that point to an already registered executor. A new executor remains a Founder-controlled application-code boundary.

### 2.4 One generic session/execution route

Session Authority resolves the target and contract rather than reading a target-specific Python dictionary. One generic execution endpoint accepts session evidence, reloads the backend session and contract, invokes the registered family executor, and returns a result carrying the exact contract/component authority trace.

Existing target-specific routes remain available during compatibility validation. New registered targets do not receive another endpoint, import branch, or handler method.

### 2.5 Family SEC and preservation admission

SEC dispatch selects a registered presentation adapter from the backend-validated contract/result identity. It must not select by publisher SKU or target ID. The adapter receives product identity and labels as data while presentation semantics remain family-owned.

Preservation admission moves to one backend result/contract validator. The target-agnostic store remains target-agnostic. The frontend may check completeness for user experience, but only the backend authoritative session, contract fingerprint, result package, evidence reconciliation, and family validator can admit preservation.

### 2.6 Registration-driven catalog and build inclusion

The Smart Target catalog and production builders consume approved registration/contract indexes. A new target may add governed data and registered assets, but not a JavaScript target definition, target page, build allowlist entry, or asset-specific application branch. Build generation must fail when an approved asset is missing, hash-mismatched, or assigned an unapproved role.

## 3. Remaining reusable mission-family capabilities

| Capability / family | Existing SCZN3 inheritance | Smallest reusable capability still missing | Episode 56 evidence |
|---|---|---|---|
| **Zeroing** — `zeroingCorrection` | Isolated Zeroing Authority; M4 and Baker 100-yard correction/result behavior; aim/impact evidence; zeroing SEC | A registered zeroing-target relationship resolver that supplies approved target plane/aim/impact mapping and exact Zeroing Authority profile parameters to the existing pipeline without target-ID admission. This is not a generic scoring TEC and must not change Zeroing Authority ownership. | E56-T02 can reuse the family after its UGO candidate is validated and an exact zeroing authority binding is approved. E56-T01 remains blocked by its unresolved two-sided authority. |
| **Precision/open scoring** — `precisionRingScore` | UGO spatial classification separation; GSSF demonstrates geometry/scoring/mission separation; highest-score SEC presentation components | One backend `precisionScoreResult` executor supporting declared zone-value tables (including signed values), boundary rules, optional publisher-defined aggregation groups, and shooter-controlled/open completion. It must make no qualification, shot-count, distance, timing, or pass/fail claim unless a Mission Profile supplies it. | E56-T03, T05, and T06 share this need. T04 remains blocked on the numeric meaning of X for numeric scoring. |
| **Recreational challenge/game** — `recreationalChallenge` | Baker Fun evidence capture, backend classification/scoring patterns, challenge SEC presentation, reconciled event preservation | One bounded challenge executor supporting registered participants/sides, alternating turns, geometry-owned entity membership, declared hit/boundary treatment, entity state, and a publisher-authored terminal condition. It is a finite governed primitive set, not an unrestricted rules language. | E56-T07 supplies alternate-turn, line-touch, fleet, and first-to-sink-all rules and can test the shared capability after UGO validation and explicit player-to-fleet setup authority. |
| **Smart evidence capture** — `smartEvidenceCapture` | Baker SL-ST1 and Vital Dude image evidence, normalized observations, optional shooter declaration, backend reconciliation, evidence-only SEC, target-agnostic storage | One family executor and validator parameterized by the approved Registration Package/UGO capability states; one family SEC adapter; one backend preservation validator. Product identity, overlays, declared aims, and unavailable states arrive as governed data. | E56-T10 can inherit this without importing Baker identity or numeric USPSA scoring. Vital Dude becomes the migration/regression fixture, not the template for another one-off implementation. |

Qualification is intentionally not added as a fifth implementation family in this scope. E56-T11 and T12 lack governing course/version authority, and E56-T04 lacks complete numeric authority. Adding a generic qualification engine would not cure those gaps.

## 4. Target-specific work that legitimately remains

For every new publisher SKU, SCZN3 must still perform or receive:

- exact publisher/product/SKU identity and provenance;
- published dimensions and claim-boundary packaging;
- one immutable ATP version establishing the SCZN3 relationship;
- exact Registration Package asset, hash, role, coordinate convention, lifecycle, and approval;
- target-specific UGO geometry/transform validation where canonical classification or physical measurement is claimed;
- target-specific Scoring Profile data when publisher/governing authority establishes numerical meaning;
- target-specific Mission Profile data when publisher/governing authority establishes activity, timing, turns, aggregation, completion, or qualification;
- one exact approved Target Execution Contract binding the component versions;
- target-specific display identity, thumbnail, accessibility description, and authoritative unavailable/not-applicable states;
- empirical validation of any genuinely new geometry or boundary treatment;
- Founder review whenever the target requires a new mission-family executor, new authority owner, or unsupported semantic capability.

This is authority and registration work. It is not repeated application wiring.

## 5. Target-specific work that should disappear

Vital Dude required target-specific additions or edits for identity recognition, Session Authority, backend routing, target-page runtime, SEC registration/dispatch, Vault rendering, preservation admission, catalog listing, build inclusion, and plumbing tests. Under the reusable architecture, the next registered target must not require:

- an `IMPLEMENTED_TARGET_OVERRIDES` entry;
- a target ID in a mission support allowlist;
- a `TARGET_AUTHORITY_PROFILES` Python dictionary entry;
- a target alias added to runtime routing code;
- a target-specific backend import, URL path set, handler branch, or evidence-authority module when the family executor already exists;
- a target-specific HTML/JavaScript/CSS shooter experience;
- a target definition compiled into `platform_contracts.js`;
- a target-specific SEC adapter registration or target-ID dispatch branch;
- a target-specific Vault summary/evidence/render branch;
- a target-specific `preserveActiveSEC()` admission branch;
- a target asset/page entry in both production build allowlists;
- a new plumbing test that merely proves those repeated branches agree.

New data still receives schema, authority, contract, and end-to-end fixture validation. What disappears is duplicated ownership code.

## 6. Exact proposed implementation scope

No file below is authorized by this specification. Founder approval is required before any implementation.

### New backend authority components

- `docs/backend/target_execution_contract.py` — immutable package loader, schema validation, exact resolver, digest/fingerprint, lifecycle/refusal handling.
- `docs/backend/target_execution_contracts/schema.json` — locked ADR-001 contract schema.
- `docs/backend/target_execution_contracts/contracts/` — approved contract data; initial entries are compatibility/test fixtures plus separately approved Episode 56 contracts, never bulk self-approval.
- `docs/backend/execution_capability_registry.py` — mission-family/result/executor/validator registry with no target-ID allowlist.
- `docs/backend/execution_authority.py` — generic session-bound execution service and authority trace.
- `docs/backend/executors/smart_evidence_capture.py` — reusable evidence-only executor.
- `docs/backend/executors/precision_open_score.py` — reusable governed zone/open-score executor.
- `docs/backend/executors/recreational_challenge.py` — bounded challenge-state executor.

Zeroing continues to call the existing Zeroing Authority implementation; no replacement zeroing executor is proposed.

### Existing backend owners modified once

- `docs/backend/target_registry.py` — derive executable capability status from resolver output instead of `IMPLEMENTED_TARGET_OVERRIDES` for contract-backed targets; retain legacy compatibility unchanged initially.
- `docs/backend/mission_registry.py` — replace target-ID support checks for contract-backed targets with exact contract resolution.
- `docs/backend/session_authority.py` — resolve contract-backed target/session capability data rather than adding target dictionary entries.
- `docs/backend/server.py` — add one generic execution route and remove the need for future target-specific routes; legacy routes remain during regression.
- `docs/backend/preserved_sec_store.py` — invoke the shared backend result/contract admission validator before the unchanged target-agnostic immutable store operation.
- `docs/backend/target_knowledge/schema.json` — allow governed references to ATP, Registration Packages, capability candidates, and contract IDs without allowing manifests to self-authorize.

### Shared client/runtime owners modified once

- `docs/target_execution_runtime.js` — generic registered-target workspace driven by backend session/contract/result data.
- `docs/target-experience.html` — one shared target experience route keyed by backend-resolved target identity.
- `docs/target_experiences.js` — consume the approved catalog index rather than requiring one JavaScript entry per target.
- `docs/platform_contracts.js` — validate family adapter and backend contract/result references without compiling product identities into application code.
- `docs/sec_adapter_model.js` — register the reusable evidence-only, precision/open-score, and recreational-challenge presentation families once.
- `docs/sec_dispatch.js` — dispatch contract-backed results by validated adapter family + mission family + result type, never target ID.
- `docs/m4_runtime.js` — replace future contract-backed target admission branches with one completeness check followed by backend preservation authority; retain existing legacy branches until migrated and proven.
- `docs/records.html` — use adapter-owned family view models for list/detail/evidence rather than target branches.
- `docs/production/build-site.mjs` and `docs/production/build-netlify.mjs` — derive approved registered assets and the shared route from the governed build index.

### Validation additions

- `docs/backend/test_target_execution_contract.py`
- `docs/backend/test_execution_authority.py`
- `docs/backend/test_execution_capability_families.py`
- `docs/production/target_execution_contract_contract_test.mjs`
- `docs/production/registered_target_inheritance_browser_test.mjs`
- Contract fixtures covering one approved and multiple refused combinations per family.

Implementation must stop if another production owner is required, if a family cannot be expressed without an unrestricted rules language, or if a locked architecture conflict appears.

## 7. What will not change

- M-009, ADR-001, its Ownership Matrix, or M-010.
- Publisher product identity, artwork, SKU, published claims, or ownership.
- The existing 10-target baseline, Episode 55 historical evidence, or Episode 56 population counts.
- Zeroing Authority ownership, algorithms, correction math, adjustment authority, or pipeline isolation.
- UGO ownership of geometry and classification.
- Scoring Profile ownership of numerical interpretation.
- Mission Profile ownership of course, timing, aggregation, and completion.
- Backend authority or fail-closed behavior.
- Universal SEC semantic order or presentation-only boundary.
- Existing supported target behavior or preserved historical SEC meaning.
- Authority-blocked Episode 56 targets; architecture cannot manufacture their missing evidence.
- Production deployment state. Implementation approval would not itself authorize commit, push, or deployment.

## 8. Validation plan

1. **Schema:** reject missing IDs/versions/digests, unknown fields where prohibited, duplicate contracts, malformed lifecycles, and client-supplied approval.
2. **Exact resolution:** approve exactly one complete tuple; reject zero matches, multiple matches, component mismatch, stale version, wrong asset role, expired/suspended/revoked contract, mission/result mismatch, and digest mismatch.
3. **Pipeline invariant:** prove `missionFamily` is the only switch; prove a target ID, result field, asset, client request, or saved session cannot switch pipelines.
4. **Zeroing isolation:** run existing M4 and Baker 100-yard regressions byte-for-behavior; prove non-zeroing contracts cannot reach Zeroing Authority and zeroing cannot fall through to a Target Authority executor.
5. **Session Authority:** prove target admission remains independent from optional capability availability and that Session Authority reloads the backend contract at start.
6. **Family executors:** run approved and refused fixtures for smart evidence, precision/open scoring, and recreational challenge; assert no executor accepts a target ID allowlist.
7. **No invented authority:** verify absent score, mission, qualification, timing, anatomy, correction, or completion remains unavailable/not applicable through live result, SEC, save, and reopen.
8. **SEC dispatch:** prove two different target identities sharing one family use the same adapter while preserving exact product identity and authority trace; reject mismatched contract/result packages.
9. **Preservation:** prove backend admission reconciles session, target, contract fingerprint, evidence, result counts, and family validator before the existing immutable store; preserve and exactly reopen all capability states.
10. **Build/catalog:** add a registration-only fixture without editing client/build application files; fail for missing, hash-mismatched, unapproved, or display-only assets.
11. **Legacy regression:** existing Session Authority, M4, Baker 100-yard, GSSF, Baker SL-ST1, Vital Dude, Baker Fun, SEC dispatch, Vault, and preservation tests remain passing.
12. **Code-boundary assertion:** a new fixture using an existing family must produce a playable flow with zero target-ID additions in Python/JavaScript/HTML/CSS and zero target-specific production routes.

## 9. Expected effect on the Episode 56 cohort

| Target | Expected post-architecture effect |
|---|---|
| E56-T01 / 32110 | Remains registered and authority-blocked on side B/two-sided identity. Architecture does not cure it. A separately scoped side-A-only relationship would require explicit authority and contract identity. |
| E56-T02 / 82030 | Becomes a zeroing registration/authority-binding candidate with no target-ID runtime wiring after UGO validation and explicit Zeroing Authority compatibility approval. |
| E56-T03 / 12190 | Becomes a precision/open-score contract candidate using printed 5–10 values with shooter-controlled completion and no invented course. |
| E56-T04 / 22130 | Remains registered; numeric scoring remains unavailable until X is authoritative. Evidence-only could be separately contracted but must not be automatic fallback. |
| E56-T05 / 21420 | Becomes a precision/open-score contract candidate using +1000/0/−1000 zones and open completion. |
| E56-T06 / 21090 | Becomes a precision/open-score contract candidate using 7–10 zones plus publisher-defined horizontal/vertical aggregation groups. |
| E56-T07 / 21110 | Becomes a recreational-challenge contract candidate using the shared bounded state executor after UGO and player/fleet setup validation. |
| E56-T08 / 22740 | Remains the completed proof and becomes a compatibility/migration regression fixture. No new focus or redesign. |
| E56-T09 / 22790 | Remains registered with semantic/scoring authority unavailable. An evidence-only contract would require an explicit approval; it is not inferred from similarity to Vital Dude. |
| E56-T10 / 22470 | Becomes a smart-evidence contract candidate with GunFun identity and A/B/C/D evidence preserved, without Baker identity or numeric USPSA scoring. |
| E56-T11 / 53510 | Remains registered and qualification-blocked pending current course/version authority. The missing qualification capability is not a missing target. |
| E56-T12 / 53900 | Remains registered and qualification/UGO-blocked pending Kentucky authority and adequate representation. |

The immediate reusable payoff is six first-pass code-boundary targets becoming authority-data/contract candidates rather than six application implementations. Authority-blocked targets stay truthfully blocked and do not stop the rest.

## 10. Proposed second 12-target timing experiment

### Population

Create a new **Episode 56 Batch 2 Scale Cohort** of 12 publisher SKUs never previously registered or implemented in SCZN3. Keep it separate from:

- the existing 10-target baseline;
- Episode 55 historical evidence;
- Batch 1 E56-T01 through E56-T12;
- Vital Dude implementation work.

Assign `E56-B2-T01` through `E56-B2-T12` while preserving publisher identity. Prefer 12 new GunFun SKUs for publisher/process comparability. Stratify selection as evenly as catalog authority permits across zeroing, precision/open scoring, recreational challenge, and smart evidence capture. Record any unmatched family mix rather than substituting unsupported meaning.

### Freeze before measurement

Before selecting or processing Batch 2:

1. Founder approves the reusable implementation and its validation evidence.
2. Freeze the architecture version, schemas, executor versions, test suite, timing rules, and Batch 2 selection criteria.
3. Do not improve the architecture during the measured batch merely to improve the result. Record genuine shared defects and continue other targets where possible.

### Same clock and ledger rules

Use the existing Work Ledger categories and preserve separately:

- active Cody work;
- permission/tool/environment friction;
- unattended waiting;
- Founder-response waiting;
- shared work affecting multiple targets.

For every active segment retain the Batch 1 question: **Why did this minute have to exist, and what reusable owner could eliminate it?**

### Primary comparison metrics

Compare Batch 1 and Batch 2 using:

1. total active Cody work and median active work per target;
2. active work by category and target;
3. end-to-end registrations completed without target-specific application code;
4. number of production files requiring target-ID edits;
5. number of new target-specific application modules/routes/adapters/preservation branches;
6. number and duration of shared-owner/platform defects;
7. authority-gap count and authority-gap investigation time, reported separately from implementation friction;
8. number of family capabilities inherited unchanged;
9. time from approved authority package to validated save/exact reopen;
10. total elapsed time with every waiting class separated.

The principal architectural success condition is not a favorable percentage. It is observable inheritance:

> A Batch 2 target using an already implemented mission family reaches validated execution, SEC, preservation, and exact reopen through governed data and an approved contract, with zero target-ID application wiring.

Report exceptions rather than hiding them. A target that needs a genuinely new mission-family executor is a new Founder decision boundary, not a failed registration.

## Founder review gate

The implementation scope was Founder approved and has completed validation. Review and approve, revise, or decline the frozen baseline before any Batch 2 SKU selection or timing begins.

This frozen baseline does not approve an Episode 56 target contract, an authority gap, production deployment, commit, push, or Batch 2 cohort. Batch 2 remains unseen until separate Founder approval.
