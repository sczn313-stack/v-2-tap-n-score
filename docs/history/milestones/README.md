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
