# SCZN3 Milestone Index

## Purpose

The Milestone Index records major engineering and governance checkpoints. Milestone numbers are stable catalog identifiers assigned by this historical framework; they do not claim a previously published milestone sequence.

## Index

| Milestone | Title | Date | Related episode | Status |
|---|---|---|---|---|
| M-001 | First Stable Zeroing Pipeline | Needs Review; candidate checkpoint 2026-04-25 | Episode number Needs Review | Needs Review |
| M-002 | Backend Authority | 2026-06-09 through 2026-06-18 | Episode number Needs Review | Completed |
| M-003 | Mission Family Routing | 2026-06-26 | Episode number Needs Review | Completed |
| M-004 | Governed Target Registry | 2026-06-30 | Episode number Needs Review | Completed |
| M-005 | Active Calculation Context | 2026-07-08 | Episode number Needs Review | Completed |
| M-006 | Explainable Scoring | 2026-07-08 through 2026-07-11 | Episode number Needs Review | Completed |
| M-007 | Target Authority Phase 1 | 2026-07-14 | Episode 27 | Architecture Locked; Implementation Pending |
| M-008 | Universal SEC Architecture | 2026-07-14 | Episode number Needs Review | Architecture Baseline |
| M-009 | Composable Target Authority | 2026-07-14 | Episode 30 | Architecture Locked |
| M-010 | Episode 56 Publisher Product Boundary | 2026-08-18 | Episode 56 | Architecture Boundary Locked; Playable Proof Validated |
| M-011 | Behavioral Primitive Dependency Order | 2026-08-19 | Episode 56 | Founder Locked / Implemented |
| M-012 | Independent Multi-Capability Resolution | 2026-08-19 | Episode 56 | Founder Locked / Implemented |
| M-013 | Catalog-Scale Capability Inheritance | 2026-08-19 | Episode 56 | Founder Locked / Validated |
| M-014 | Publisher OS 11-Publisher Knowledge Baseline | 2026-08-21 | Post-Episode 56 / Episode 57 working context | Founder Directed / Validated |

## Milestone records

### M-001 — First Stable Zeroing Pipeline

**Milestone number:** M-001

**Title:** First Stable Zeroing Pipeline

**Date:** Needs Review; `f354799` is a candidate checkpoint dated 2026-04-25

**Summary:** A commit explicitly named `v2 clean anchor - stable build` preserved an early stable SCZN3 application baseline. Current evidence does not prove the exact first-stable-zeroing date.

**Why it mattered:** Later authority and governance work required a functional target and SEC baseline from which to evolve.

**Architecture impact:** Needs Review. No committed architecture document from this checkpoint defines its zeroing boundaries.

**Governance impact:** Needs Review. Formal backend-authority rules were documented later.

**Related episodes:** [First Stable Zeroing Pipeline — episode number Needs Review](../episodes/README.md#first-stable-zeroing-pipeline)

**Related commits:** `f354799` — `v2 clean anchor - stable build`

**Status:** Needs Review

### M-002 — Backend Authority

**Milestone number:** M-002

**Title:** Backend Authority

**Date:** 2026-06-09 through 2026-06-18

**Summary:** Backend scoring, correction, proof, testing, hosting, frontend integration, and shooter guidance became committed platform capabilities.

**Why it mattered:** Results could be governed by a single service rather than reconstructed by each client surface.

**Architecture impact:** Established the backend authority service and authority-package boundary used by later mission engines.

**Governance impact:** Established the operating rule that the backend calculates and the frontend displays, including explicit unavailable behavior when backend authority is missing.

**Related episodes:** [Backend Authority — episode number Needs Review](../episodes/README.md#backend-authority)

**Related commits:**

- `17ad9d8` — `Deploy Baker LIVE_SWAP_READY_0609`
- `215a828` — `Prepare Baker authority backend for production hosting`
- `0c3babb` — `Wire Baker frontend to SCZN3 authority backend`
- `619a2aa` — `Support Render authority endpoint path`
- `7ec9e64` — `Move shooter guidance into backend authority`

**Status:** Completed

### M-003 — Mission Family Routing

**Milestone number:** M-003

**Title:** Mission Family Routing

**Date:** 2026-06-26

**Summary:** A mission-family registry, result-package registry, and explicit mission/result mapping were added as a routing skeleton.

**Why it mattered:** Multiple target experiences required explicit routing contracts instead of implicit reuse of the Baker path.

**Architecture impact:** Introduced the target-profile normalization and mission/result dispatch boundary used by later GSSF and training work.

**Governance impact:** Unsupported mission families and unauthorized result-package combinations remain unavailable rather than falling through to plausible scoring.

**Related episodes:** [Mission Family Routing — episode number Needs Review](../episodes/README.md#mission-family-routing)

**Related commits:** `de27190` — `Add mission family routing skeleton`

**Status:** Completed

### M-004 — Governed Target Registry

**Milestone number:** M-004

**Title:** Governed Target Registry

**Date:** 2026-06-30

**Summary:** SCZN3 added a registry that preserves target knowledge without automatically granting execution authority.

**Why it mattered:** Researching or recognizing a target must not make it scoreable.

**Architecture impact:** Added lifecycle, support, geometry-authority, and scoring-authority gates around target execution.

**Governance impact:** Execution requires explicit confirmation. Recognized targets with incomplete authority produce a governed unavailable result.

**Related episodes:** [Governed Target Registry — episode number Needs Review](../episodes/README.md#governed-target-registry)

**Related commits:** `8e27176` — `Add governed target registry foundation`

**Status:** Completed

### M-005 — Active Calculation Context

**Milestone number:** M-005

**Title:** Active Calculation Context

**Date:** 2026-07-08

**Summary:** The authoritative session gained a versioned context containing the target, mission, session distance, zero context, angular unit, and click value used by calculations.

**Why it mattered:** A result without its active inputs can be displayed in the wrong session or interpreted using stale UI state.

**Architecture impact:** Bound calculation context to session state, requests, and relevant backend responses.

**Governance impact:** Preserved the separation between session distance and distance-transition authority and made the calculation context auditable.

**Related episodes:** [Active Calculation Context — episode number Needs Review](../episodes/README.md#active-calculation-context)

**Related commits:** `f4d7642` — `Attach Active Calculation Context to Authoritative Session`

**Status:** Completed

### M-006 — Explainable Scoring

**Milestone number:** M-006

**Title:** Explainable Scoring

**Date:** 2026-07-08 through 2026-07-11

**Summary:** Backend scoring breakdowns exposed formula, subtotal, hit count, and shot attribution for each governed GSSF zone, followed by strict live/saved validation and finalized SEC presentation.

**Why it mattered:** Shooters could verify how the result was built instead of trusting an unexplained total.

**Architecture impact:** Expanded the authoritative GSSF result contract with four complete scoring-breakdown entries and backend shot IDs.

**Governance impact:** Prevented frontend fallback math, malformed authority rendering, missing-penalty coercion, and evidence substitution while preserving live/saved parity.

**Related episodes:** [Explainable Scoring — episode number Needs Review](../episodes/README.md#explainable-scoring)

**Related commits:**

- `3b02353` — `Explain GSSF SEC scoring breakdown`
- `6933c1c` — `Lock GSSF SEC formula subtotal hierarchy`
- `5faeda4` — `Preserve GSSF shot IDs in render coordinates`
- `e97fdd1` — `Rebuild authoritative GSSF time buckets and fix mobile overflow`
- `c406788` — `Enforce strict GSSF authority package validation`
- `3b10b19` — `Require authoritative GSSF paper penalties`
- `87a2ee6` — `Require governed saved evidence for GSSF records`
- `f006a2f` — `Finalize GSSF SEC Standard v1 presentation`

**Status:** Completed

### M-007 — Target Authority Phase 1

**Milestone number:** M-007

**Title:** Target Authority Phase 1

**Date:** 2026-07-14

**Summary:** SCZN3 committed the locked Phase 1 architecture for Authoritative Target Profiles, Registration Packages, Authoritative Shot Packages, mission routing, GSSF Shot #2 mapping, and Baker zeroing isolation.

**Why it mattered:** Canonical target-asset scoring required an approved authority contract before implementation.

**Architecture impact:** Defined the minimum Phase 1 target-authority pipeline and separated exact asset registration, observed coordinates, backend classification, and presentation.

**Governance impact:** Locked architecture before implementation, prohibited client classification, preserved refusal behavior, isolated zeroing, and explicitly listed unresolved geometry values that cannot yet become authority.

**Related episodes:** [Episode 27 — Target Authority Phase 1 Architecture Lock](../episodes/README.md#target-authority-phase-1-architecture-lock)

**Related commits:**

- `a246afb` — `Begin Smart Target Catalog architecture`
- `c44538a` — `Lock Phase 1 target authority architecture`

**Status:** Architecture Locked; Implementation Pending

### M-008 — Universal SEC Architecture

**Milestone number:** M-008

**Title:** Universal SEC Architecture

**Date:** 2026-07-14

**Summary:** The four-target Universal SEC study was incorporated into the authoritative architecture set and normalized to current Mission Family, ATP, Registration Package, Authoritative Shot Package, result-package, evidence, and zeroing-isolation terminology.

**Why it mattered:** SCZN3 can provide one recognizable shooter experience across different disciplines without centralizing their rules in a client-side or generic scoring engine.

**Architecture impact:** Established [SCZN3 Universal Shooter Experience Card Architecture](../../architecture/SCZN3_Universal_SEC_Architecture.md) and the governed chain `Mission Family → Target Authority → Result Package → Universal SEC`.

**Governance impact:** Made renderer selection dependent on strict package identity, preserved mission-specific contracts, classified unsupported USPSA and IBS adapters as conceptual, restored Registration Package requirements for asset-based authority, and explicitly preserved Baker zeroing isolation.

**Related episodes:** [Universal SEC Architecture Baseline — episode number Needs Review](../episodes/README.md#universal-sec-architecture-baseline)

**Related commits:** `f0a7ca0` — `Establish Universal SEC architecture`

**Status:** Architecture Baseline

### M-009 — Composable Target Authority

**Milestone number:** M-009

**Title:** Composable Target Authority

**Date:** 2026-07-14

**Summary:** SCZN3 adopted a composable authority model in which Geometry Profiles, ATPs, Registration Packages, Scoring Profiles, Mission Profiles, and Target Execution Contracts have explicit independent ownership and version boundaries.

**Why it mattered:** Future targets can reuse immutable spatial truth across approved assets, scoring interpretations, and shooter activities without copying geometry or weakening authority.

**Architecture impact:** Generalizes Phase 1 from a valid one-to-one instance into an explicitly authorized composition model. The ATP remains target identity and compatibility authority; a new Target Execution Contract authorizes exact component combinations.

**Governance impact:** Preserves backend ownership, strict refusal, immutable versioning, mission-family routing, Zeroing Authority isolation, and Universal SEC presentation boundaries while preventing unauthorized component composition.

**Compatibility:** GSSF Phase 1 remains valid. Baker GF-DB remains a draft and unavailable. Existing single-asset ATPs require no runtime migration or behavior change.

**Related episodes:** [Episode 30 — Composable Target Authority](../episodes/README.md#composable-target-authority)

**Related commits:** `Lock Episode 30 — Adopt Composable Target Authority` documentation checkpoint

**Status:** Architecture Locked

### M-010 — Episode 56 Publisher Product Boundary

**Milestone number:** M-010

**Title:** Episode 56 Publisher Product Boundary

**Date:** 2026-08-18

**Summary:** Episode 56 established that the publisher owns the existing product, SCZN3 owns its governed digital relationship to that product, shooter evidence establishes the session, backend authority governs the result, and the Universal SEC presents and preserves only supported claims.

**Why it mattered:** A publisher's existing product can become a useful Smart Target without SCZN3 redesigning the product or inventing scoring, anatomy, tactics, qualification, penalties, shot requirements, completion rules, or publisher intent.

**Architecture impact:** Separates publisher product authority, SCZN3 target/session authority, shooter evidence, governed results, and SEC presentation. It admits evidence-only experiences and explicit unavailable/not-applicable states as correct architecture.

**Governance impact:** Product registration does not automatically grant execution or scoring authority. Target-specific proofs must preserve exact identity and refuse unsupported claims. The generalized Target Execution Contract may standardize later composition but cannot manufacture missing authority.

**Related episodes:** [Episode 56 — GunFun 12-Target Scale Experiment](../episodes/episode56-gunfun-scale-experiment/README.md)

**Primary record:** [Episode 56 Publisher Product Boundary](../episodes/episode56-gunfun-scale-experiment/PUBLISHER_PRODUCT_BOUNDARY_MILESTONE.md)

**Status:** Architecture Boundary Locked; Playable Proof Validated

### M-011 — Behavioral Primitive Dependency Order

**Milestone number:** M-011

**Title:** Behavioral Primitive Dependency Order

**Date:** 2026-08-19

**Summary:** SCZN3 locked the rule that shared behavioral primitives must be built before higher-order mission executors that depend on them. Cue/Drill established authority-neutral stage/event mechanics before Qualification and Decision consumed those mechanics through independent owners.

**Architecture impact:** Prevents sequencing, timing policy, event association, durable state, and reconciliation from becoming hidden inside one mission-shaped executor.

**Governance impact:** Reuse transfers mechanics, never authority. Every family retains its exact Profile, executor, result package, SEC family, and preservation validator.

**Primary record:** [Episode 56 Capability Engine Principles](../episodes/episode56-target-capability-coverage/EPISODE56_CAPABILITY_ENGINE_PRINCIPLES.md)

**Status:** Founder Locked / Implemented

### M-012 — Independent Multi-Capability Resolution

**Milestone number:** M-012

**Title:** Independent Multi-Capability Resolution

**Date:** 2026-08-19

**Summary:** One registered publisher product may expose multiple governed capabilities, but `targetProfileId + missionFamily` resolves and executes one exact Target Execution Contract at a time.

**Architecture impact:** Preserves independent capability composition without target-specific routing or executor crossover.

**Governance impact:** Multi-capability does not mean multi-authority execution. Shared primitives cannot silently grant another family's claims.

**Primary record:** [Episode 56 Capability Engine Principles](../episodes/episode56-target-capability-coverage/EPISODE56_CAPABILITY_ENGINE_PRINCIPLES.md)

**Status:** Founder Locked / Implemented

### M-013 — Catalog-Scale Capability Inheritance

**Milestone number:** M-013

**Title:** Catalog-Scale Capability Inheritance

**Date:** 2026-08-19

**Summary:** SCZN3 proved that publisher catalogs are compositions of governed product identity, registration, and reusable shooter behaviors—not catalogs of target-specific software implementations.

**Architecture impact:** The locked Target Execution Contract resolver and reusable capability-family owners allow an authority-complete product to become executable through Profile/contract data with zero target-ID/SKU production routing. The previously missing catalog behavior collapsed into six reusable families: Cue/Drill, Qualification, Diagnostic, Decision, SEC Progression, and Collection/Hand.

**Governance impact:** Authority gaps remain fail-closed and do not count as architecture failures. Website discovery and QR identity converge on the same governed relationship. Publisher OS remains a separately controlled future publication/QR mechanism and was not implemented by this milestone.

**Scale evidence:** GunFun + Baker analysis examined 663 offerings; 69 offerings outside the previously demonstrated set collapsed into six families. All six reusable owners passed data-only inheritance fixtures with zero target-ID/SKU production edits. Combined active implementation time was 59m 31s. The frozen architecture also processed 12/12 blind Batch 2 products and 237/258 distinct GunFun catalog SKUs through exact reopen without target-specific production code.

**Primary record:** [M-013 — Catalog-Scale Capability Inheritance](./M-013_CATALOG_SCALE_CAPABILITY_INHERITANCE.md)

**Status:** Founder Locked / Validated

## Milestone entry template

```text
### M-000 — <title>

Milestone number:
Title:
Date:
Summary:
Why it mattered:
Architecture impact:
Governance impact:
Related episodes:
Related commits:
Status:
```
