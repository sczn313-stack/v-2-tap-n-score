# SCZN3 Episode Index

## Purpose

The Episode Index tells the story of SCZN3: what problem was being solved, what the repository proves was discovered, which governance decisions followed, and what changed as a result.

Episode numbers are recorded only when committed documentation establishes them. Unconfirmed episode assignments are marked **Needs Review**.

## Index

| Episode number | Title | Date | Related milestone | Status |
|---|---|---|---|---|
| Needs Review | First Stable Zeroing Pipeline | Needs Review; candidate checkpoint 2026-04-25 | [M-001](../milestones/README.md#m-001--first-stable-zeroing-pipeline) | Needs Review |
| Needs Review | Backend Authority | 2026-06-09 through 2026-06-18 | [M-002](../milestones/README.md#m-002--backend-authority) | Completed |
| Needs Review | Mission Family Routing | 2026-06-26 | [M-003](../milestones/README.md#m-003--mission-family-routing) | Completed |
| Needs Review | Governed Target Registry | 2026-06-30 | [M-004](../milestones/README.md#m-004--governed-target-registry) | Completed |
| Needs Review | Active Calculation Context | 2026-07-08 | [M-005](../milestones/README.md#m-005--active-calculation-context) | Completed |
| Needs Review | Explainable Scoring | 2026-07-08 through 2026-07-11 | [M-006](../milestones/README.md#m-006--explainable-scoring) | Completed |
| Episode 27 | Target Authority Phase 1 Architecture Lock | 2026-07-14 | [M-007](../milestones/README.md#m-007--target-authority-phase-1) | Architecture Locked; Implementation Pending |

## Episode records

### First Stable Zeroing Pipeline

**Episode number:** Needs Review

**Title:** First Stable Zeroing Pipeline

**Date:** Needs Review; `f354799` is a candidate checkpoint dated 2026-04-25

**Summary:** The repository contains an explicit `v2 clean anchor - stable build` checkpoint and an established early target/SEC application. The current evidence does not prove that this commit alone was the first stable zeroing pipeline or establish its episode number.

**Problem:** Needs Review. The repository does not contain a contemporaneous narrative that identifies the exact instability this checkpoint closed.

**Discovery:** A stable-build anchor was important enough to preserve as a named commit before later backend-authority and governance work.

**Governance decisions:** No formal authority decision can be attributed to this checkpoint from current evidence.

**Outcome:** A stable application baseline was committed and later became the historical predecessor to the governed Baker zeroing flow.

**Related milestones:** [M-001 — First Stable Zeroing Pipeline](../milestones/README.md#m-001--first-stable-zeroing-pipeline)

**Related commits:** `f354799` — `v2 clean anchor - stable build`

**Status:** Needs Review

### Backend Authority

**Episode number:** Needs Review

**Title:** Backend Authority

**Date:** 2026-06-09 through 2026-06-18

**Summary:** SCZN3 introduced a backend authority service, executable backend tests, an authority proof harness, production hosting preparation, frontend-to-backend wiring, and backend-owned shooter guidance.

**Problem:** Scoring, correction, and guidance needed a single authoritative owner rather than client presentation code acting as the final source of truth.

**Discovery:** A frontend can collect observations and present results, but durable authority requires a backend result package and explicit unavailable behavior.

**Governance decisions:** Backend calculates; frontend displays. Missing backend authority must not be replaced with a plausible client result. Shooter guidance joined the backend-owned result.

**Outcome:** Baker scoring and correction obtained a committed backend service, tests, proof surface, production path, and frontend integration.

**Related milestones:** [M-002 — Backend Authority](../milestones/README.md#m-002--backend-authority)

**Related commits:**

- `17ad9d8` — `Deploy Baker LIVE_SWAP_READY_0609`
- `215a828` — `Prepare Baker authority backend for production hosting`
- `0c3babb` — `Wire Baker frontend to SCZN3 authority backend`
- `619a2aa` — `Support Render authority endpoint path`
- `7ec9e64` — `Move shooter guidance into backend authority`

**Status:** Completed

### Mission Family Routing

**Episode number:** Needs Review

**Title:** Mission Family Routing

**Date:** 2026-06-26

**Summary:** SCZN3 added a mission-family and result-package registry skeleton so target identity, mission intent, and result contracts could be routed explicitly.

**Problem:** A platform supporting more than one target experience could not safely use a single implicit scoring path.

**Discovery:** Target identity alone is insufficient. Execution must also bind a registered mission family to its authorized result-package type.

**Governance decisions:** Mission families and result packages are named registries. Unsupported missions remain unavailable. A mismatched mission/result combination must not activate another engine.

**Outcome:** The backend gained the routing foundation later used by GSSF and training missions without changing unsupported families into executable scoring engines.

**Related milestones:** [M-003 — Mission Family Routing](../milestones/README.md#m-003--mission-family-routing)

**Related commits:** `de27190` — `Add mission family routing skeleton`

**Status:** Completed

### Governed Target Registry

**Episode number:** Needs Review

**Title:** Governed Target Registry

**Date:** 2026-06-30

**Summary:** SCZN3 separated target knowledge from execution authority through a registry with lifecycle, support, geometry-authority, and scoring-authority gates.

**Problem:** Recognizing or researching a target could otherwise be mistaken for permission to score it.

**Discovery:** A catalog of known targets and an executable authority registry are related but distinct concerns.

**Governance decisions:** Recognition does not grant authority. Execution requires supported lifecycle and explicit confirmation of both geometry and scoring authority. Incomplete targets return a governed unavailable state.

**Outcome:** Target manifests and research seeds could exist without silently activating scoring, while implemented targets could be explicitly authorized.

**Related milestones:** [M-004 — Governed Target Registry](../milestones/README.md#m-004--governed-target-registry)

**Related commits:** `8e27176` — `Add governed target registry foundation`

**Status:** Completed

### Active Calculation Context

**Episode number:** Needs Review

**Title:** Active Calculation Context

**Date:** 2026-07-08

**Summary:** SCZN3 attached the active calculation context to the authoritative session and backend distance-query results.

**Problem:** Calculations could not be safely interpreted if session distance, target, mission, angular unit, click value, and zero context were detached from the result.

**Discovery:** Inputs displayed elsewhere in the UI are not enough; the exact calculation context must travel with the session and authority request.

**Governance decisions:** The authoritative session owns a versioned active calculation context. Session distance remains distinct from distance-transition authority.

**Outcome:** Session state, backend requests, and backend responses gained an explicit context binding for the calculation being performed.

**Related milestones:** [M-005 — Active Calculation Context](../milestones/README.md#m-005--active-calculation-context)

**Related commits:** `f4d7642` — `Attach Active Calculation Context to Authoritative Session`

**Status:** Completed

### Explainable Scoring

**Episode number:** Needs Review

**Title:** Explainable Scoring

**Date:** 2026-07-08 through 2026-07-11

**Summary:** GSSF results evolved from totals into an authoritative, shooter-verifiable breakdown containing formulas, subtotals, hit counts, and backend shot IDs.

**Problem:** A correct final value was not enough if the shooter could not see how each scoring zone contributed to it.

**Discovery:** Explainability belongs in the authoritative result package. The frontend should present backend formulas and shot attribution rather than reconstructing them.

**Governance decisions:** Backend-owned scoring breakdowns include zone counts, per-hit penalties, subtotals, and shot IDs. Missing or malformed authority does not become a believable display result.

**Outcome:** Live and saved SEC experiences gained aligned scoring explanations, strict package validation, authoritative penalties, governed evidence, and a finalized presentation standard.

**Related milestones:** [M-006 — Explainable Scoring](../milestones/README.md#m-006--explainable-scoring)

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

### Target Authority Phase 1 Architecture Lock

**Episode number:** Episode 27

**Title:** Target Authority Phase 1 Architecture Lock

**Date:** 2026-07-14

**Summary:** SCZN3 locked the Phase 1 contract for converting observations on an exactly registered GSSF AC-1 canonical asset into a backend-owned Authoritative Shot Package.

**Problem:** Target authority needed a reviewed contract before canonical-asset scoring implementation could proceed safely.

**Discovery:** Target identity, asset registration, coordinate interpretation, shot observation, mission routing, and backend classification must be separate governed layers.

**Governance decisions:** Architecture and implementation are separate checkpoints. Phase 1 is restricted to an exact registered asset. Coordinates carry observations, not classifications. GSSF routing remains isolated from Baker zeroing. Unresolved geometry cannot silently become authority.

**Outcome:** The Phase 1 architecture was committed with `Status: Architecture Locked` and `Implementation: Pending`. No implementation is established by this checkpoint.

**Related milestones:** [M-007 — Target Authority Phase 1](../milestones/README.md#m-007--target-authority-phase-1)

**Related commits:**

- `a246afb` — `Begin Smart Target Catalog architecture`
- `c44538a` — `Lock Phase 1 target authority architecture`

**Status:** Architecture Locked; Implementation Pending

## Episode entry template

```text
### Episode number: <number or Needs Review>

Title:
Date:
Summary:
Problem:
Discovery:
Governance decisions:
Outcome:
Related milestones:
Related commits:
Status:
```
