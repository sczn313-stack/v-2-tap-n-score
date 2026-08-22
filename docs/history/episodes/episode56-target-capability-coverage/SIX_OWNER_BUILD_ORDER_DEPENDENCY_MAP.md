# Six Missing Capability Owners — Dependency and Build-Order Analysis

**Status:** Founder review; specification analysis only  
**Population:** 69 offerings / 55 lineages requiring one or more missing families  
**Implementation:** None

## Governing answer

> **Recommended serial build order: Cue/Drill → Qualification → Diagnostic → Decision → Progression → Collection/Hand.**

Qualification should not lead. A correct Qualification Executor needs reusable stage, command, timing, event-association, and reconciliation primitives that are first established by Cue/Drill. Building Qualification first would either duplicate that machinery or hide a premature drill engine inside a qualification-shaped owner.

Diagnostic is independent and may proceed in parallel with Cue/Drill. In a single serial queue it follows Qualification because Cue/Drill unlocks the largest dependency chain, Qualification has the highest direct catalog leverage, and Diagnostic then supplies a lower-coupling family before Decision reuses the orchestration substrate.

## Locked architecture inherited unchanged

The dependency map does not redesign the frozen scale architecture:

- `missionFamily` selects exactly one authority pipeline.
- One Target Execution Contract binds one exact approved component combination.
- Geometry, registration, scoring, and mission components keep separate immutable identities and digests.
- The backend capability registry binds mission family, result package, executor, validator, SEC adapter family, and preservation validator.
- Universal SEC renders a validated family result; it does not calculate it.
- Preservation validates the authoritative result and exact contract fingerprint before immutable storage.
- Zeroing Authority remains isolated.
- A new family requires Founder-controlled family-owner application code, but a new product using that family must require zero target-ID production wiring.

The existing implementation is intentionally closed: the Target Execution Contract schema, backend family map, capability registry, runtime result validation, SEC adapter registry/dispatch, and family preservation rules enumerate supported families. Adding six family owners extends those governed family-level surfaces. It must not replace them with an unrestricted plug-in or rules bypass.

## Composition boundary

“Governed composition” does not mean executing several mission-family pipelines ambiguously in one request.

- GunFun Navy Qual may expose one Qualification contract and one Diagnostic contract for the same registered product.
- Baker CTQ may expose one Qualification contract and one Cue/Drill contract.
- The shooter selects one available governed capability; `targetProfileId + missionFamily` resolves exactly one contract.
- Shared implementation primitives may be reused internally, but one executor cannot silently invoke another mission family or merge result authority.

This preserves the locked rule that `missionFamily` is the sole authority-pipeline switch while still allowing one publisher product to have multiple authorized digital relationships.

## Dependency graph

```text
Existing frozen Target Execution Contract + Session Authority + Universal SEC + preservation
        │
        ├── Existing UGO classification + precision/open scoring
        │        └── Diagnostic Feedback Evaluator
        │
        ├── Existing session/event identity + target-shaped timed/course evidence
        │        └── Cue/Drill Orchestrator
        │                ├── shared stage/timer/event primitives ──> Qualification Executor
        │                └── shared presentation/response primitives ──> Decision Scenario Evaluator
        │
        ├── Existing immutable SEC history + exact reopen
        │        └── SEC Progression Evaluator
        │
        └── Existing recreational challenge + player/turn/entity state
                 └── Collection/Hand Evaluator
```

The arrows represent reusable implementation primitives and data dependencies, not transfer of authority. Qualification remains qualification authority; Decision remains scenario authority.

## Dependency and leverage matrix

| Recommended rank | Owner | Direct offerings / lineages | Existing prerequisites | New dependency created or consumed | Downstream leverage | Why this position |
|---:|---|---:|---|---|---|---|
| 1 | Cue/Drill Profile → Orchestrator | 17 / 13 | Session Authority, backend event identity, evidence reconciliation, existing target-shaped timed/course behavior | Establishes reusable stage, cue, timer, ordering/randomization, active-window, response-association, and completion primitives | Qualification (27 offerings) and Decision (8) both reuse the substrate | Highest dependency centrality: 17 direct assignments and foundational primitives for 35 more family assignments. |
| 2 | Qualification Profile → Executor | 27 / 21 | Cue/Drill stage primitives; UGO; scoring profiles; Session Authority; authority trace | Adds versioned course evaluation, thresholds, claim grade, administration/attestation requirements, and official-claim refusal | Largest direct family; provides governed course results that Progression may later consume | Highest direct leverage, but only correct after stage/timing primitives exist. |
| 3 | Diagnostic Feedback Profile → Evaluator | 16 / 13 | UGO classification and existing observation reconciliation | Adds exact publisher-label mapping, handedness/orientation applicability, and diagnostic result provenance | Independent; Navy can expose Diagnostic separately from Qualification | Low coupling and strong leverage; suitable as a parallel track or a stabilizing third serial owner. |
| 4 | Decision Scenario Profile → Evaluator | 8 / 8 | Cue/Drill presentation/response primitives; session state; no-response representation | Adds governed scenario identity, expected response, no-response, response window, and scenario transition semantics | Future paired/multi-scenario products | Reuses orchestration without forcing threat, legal, or tactical inference into Cue/Drill. |
| 5 | Progression Profile → SEC Progression Evaluator | 2 / 1 | Immutable SEC history, shooter identity, family result identity, exact historical reopen | Adds eligibility queries, profile-versioned level state, transition history, and recomputation prohibitions | Can eventually evaluate results from multiple stable families | It should follow stable family result schemas; it is cross-session infrastructure, not a shooting-session executor. |
| 6 | Collection/Hand Game Profile → Evaluator | 2 / 1 | Recreational challenge player/turn/entity primitives; geometry classification | Adds collection membership, hand size, combination/ranking, duplicate/tie treatment, and terminal rules | One currently evidenced lineage | Lowest evidence and leverage. Collection/hand is justified; generic path state is not. |

## Shared implementation primitives — implement once, own narrowly

These are shared libraries or contracts, not additional shooter capability families:

### Governed profile envelope

Reuse the existing Target Execution Contract component identity, version, status, digest, approval, and effective-window machinery. Each new Mission Profile definition receives a family-specific schema. Do not introduce a second generic authority system.

### Observation classification

Extract or reuse the existing UGO/precision zone-classification behavior for exact geometry membership, priority, ambiguity, and out-of-bounds handling. Diagnostic, Qualification scoring, Decision response association, and Collection membership may consume it without owning geometry.

### Stage/event state

Cue/Drill should establish the minimal reusable event model:

- stage and cue identity;
- ordered, randomized, or externally supplied cue mode;
- authoritative start/end instants and permitted response window;
- active target entity/entities;
- expected event count and response association;
- late, extra, missing, or ambiguous observation state;
- deterministic transition and completion.

Qualification and Decision may reuse this library while producing their own result packages and authority traces.

### Claim grade and attestation

Qualification establishes an explicit claim grade: `evidence_only`, `practice_simulation`, or `official_qualification`. Official status fails closed without required administrator, instructor, facility, witness, weapon, course-version, record, and reporting evidence. This envelope may later be reusable, but it must not become a generic certification switch.

### Historical SEC eligibility

Progression reads immutable SEC identities and validated family results. It never edits historical SECs, silently re-scores them under a new profile, or treats reopened presentation data as result authority.

### Game collection/ranking

Collection/Hand reuses player, turn, entity, and terminal-state primitives from `recreationalChallenge`. Only exact profile-supplied membership and rankings are executable. No unrestricted scripting language and no speculative path engine are authorized.

## Per-owner acceptance gates

Every family must pass the frozen scale-architecture test:

1. Two different registered fixtures inherit the family executor and SEC family with zero target-ID production edits.
2. Missing, unapproved, suspended, expired, incompatible, ambiguous, or digest-mismatched profile authority fails closed.
3. Backend result identity, reconciliation, authority trace, SEC, preservation, and exact reopen agree.
4. A third fixture requires profile/contract data only.
5. Existing targets and historical SECs remain unchanged.

Additional gates:

- **Cue/Drill:** ordered, randomized, externally cued, timed, late, missing, extra, and ambiguous-response cases are deterministic; client time cannot become backend authority.
- **Qualification:** evidence/practice/official claim grades cannot be confused; official result fails closed without every required attestation; course revisions never rewrite historical results.
- **Diagnostic:** only publisher-supplied labels are returned; no causal, medical, anatomical, tactical, or correction inference; handedness/profile mismatch fails closed.
- **Decision:** no-response is first-class evidence; artwork cannot choose expected response; presentation identity and response window are authoritative.
- **Progression:** preserved inputs remain immutable; profile upgrades do not silently recompute old levels; missing or ineligible SECs cannot advance state.
- **Collection/Hand:** combination/ranking and duplicate/tie rules are profile data; a second independent fixture is required before generality is accepted.

## Proposed delivery gates

### Gate 0 — Family-extension contract specification

Before code, Founder approves the exact six mission-family IDs, result-package schemas, Profile schemas, executor identities, SEC family identities, preservation validators, and unsupported-use language. This is not a seventh owner.

### Gate 1 — Cue/Drill

Implement the orchestrator and shared stage/event primitives. Validate with two synthetic authority-complete fixtures representing different modes. Do not use the 17 catalog products to design around missing rules.

### Gate 2 — Qualification

Implement practice/evidence/official claim separation over the stage primitives and existing geometry/scoring owners. Validate one non-government practice fixture and one government-shaped fixture with synthetic attestations; no real government credential or reporting integration.

### Gate 3 — Diagnostic

Implement exact region-to-publisher-label evaluation. Validate handedness/orientation mismatch and a non-causal humorous-label profile as well as a conventional tutor profile.

### Gate 4 — Decision

Implement governed presentation and response/no-response evaluation using the stage/event primitives. Validate paired identities without encoding legal or tactical judgment.

### Gate 5 — Progression

Implement profile-versioned evaluation over immutable SECs. Validate history selection, level transition, profile revision, and exact historical reconstruction.

### Gate 6 — Collection/Hand

Implement only collection/hand rules over existing game-state primitives. Require a second independent fixture and preserve path state as unsupported.

After each gate, freeze and obtain Founder acceptance before the next owner. Do not use a difficult catalog target as permission to broaden an owner during implementation.

## Recommended decision

Revise the initial instinct from:

`Qualification → Diagnostic → Cue/Drill → Decision → Progression → Collection/Hand`

to:

> **`Cue/Drill → Qualification → Diagnostic → Decision → Progression → Collection/Hand`**

If two approved workstreams are allowed, Diagnostic can run independently beside Cue/Drill. Qualification still waits for the stage/event substrate.

This order maximizes inherited machinery, keeps official-claim authority separate, and leaves the least-supported generalization until last.

No application code, Target Execution Contract schema, family registry, authority profile, catalog registration, production state, commit, push, or deployment changed.
