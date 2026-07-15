# SCZN3 Architecture Index

This index is the front door to SCZN3 architecture. Read the documents in order to understand how a target becomes governed, how a mission selects an independent authority pipeline, how an authoritative result becomes a shooter experience, and how those decisions are preserved historically.

## 1. Recommended reading order

1. [Smart Target Catalog](./SMART_TARGET_CATALOG.md)
2. [Mission Family Routing governance](../history/milestones/README.md#m-003--mission-family-routing)
3. [SCZN3 Target Authority — Phase 1](./SCZN3_Target_Authority_Phase1.md), together with the existing [Backend Authority](../history/milestones/README.md#m-002--backend-authority) and zeroing-isolation boundary
4. [SCZN3 Universal Shooter Experience Card Architecture](./SCZN3_Universal_SEC_Architecture.md)
5. [SCZN3 History](../history/README.md), including the [Episode Index](../history/episodes/README.md) and [Milestone Index](../history/milestones/README.md)

### Adopted architecture decision

- [ADR-001 — Composable Target Authority](./decisions/ADR-001_COMPOSABLE_TARGET_AUTHORITY.md)
- [Composable Target Authority Ownership Matrix](./COMPOSABLE_TARGET_AUTHORITY_OWNERSHIP_MATRIX.md)

These documents are locked architecture. They generalize the Phase 1 model without changing Phase 1 runtime behavior or independently authorizing implementation.

## 2. Document roles and authority boundaries

### [Smart Target Catalog](./SMART_TARGET_CATALOG.md) — Active

The Smart Target Catalog is the living architecture for target identity, versioning, lifecycle, physical specification, mission compatibility, evidence, routing, and partner participation. It owns the catalog boundary: a target is a governed identity, not an image, filename, QR parameter, or client claim. It references backend scoring authority without duplicating scoring rules.

### [Mission Family Routing governance](../history/milestones/README.md#m-003--mission-family-routing) — Active

Mission Family Routing owns selection of the authorized result-package family and authority pipeline. `missionFamily` is the sole authority switch: it selects Zeroing Authority, Target Authority, training, precision, practical-stage, or another registered mission path. It does not by itself grant execution authority; the selected pipeline must still validate target identity, support status, evidence, and its required contract. No target, renderer, saved field, or visual similarity may switch authority pipelines.

### [SCZN3 Target Authority — Phase 1](./SCZN3_Target_Authority_Phase1.md) — Locked

Phase 1 owns the locked contract for Authoritative Target Profiles, Registration Packages, observation requests, Authoritative Shot Packages, GSSF routing, and explicit refusal behavior. It defines how an exactly registered target asset may support backend classification. Target Authority must not alter, absorb, replace, or fall through to the existing zeroing engine; Zeroing Authority and Target Authority are independent pipelines.

### Zeroing Authority — Active

Zeroing Authority is the existing independent backend pipeline selected by `missionFamily == zeroingCorrection` and represented by `zeroCorrectionResult`. It owns zeroing geometry, group and point-of-impact calculations, correction vectors, clicks, and shooter guidance. Target Authority documents may define isolation and interoperability boundaries, but they do not redefine zeroing calculations or contracts.

### [SCZN3 Universal SEC Architecture](./SCZN3_Universal_SEC_Architecture.md) — Active

The Universal SEC owns the presentation and strict renderer-selection boundary. It receives a validated mission-specific result package and presents the result, explanation, performance detail, governed evidence, session context, and next actions. It does not calculate official scores, classify observations, repair malformed authority, substitute evidence, or make conceptual targets executable.

### [SCZN3 History](../history/README.md) — Active

The [Episode Index](../history/episodes/README.md) preserves the problems, discoveries, decisions, and outcomes that shaped SCZN3. The [Milestone Index](../history/milestones/README.md) records major engineering and governance checkpoints with commit evidence. History explains why decisions were made, but it does not define runtime authority and cannot override an architecture contract, mission registry, target profile, or backend result package.

## 3. How the documents relate

The catalog establishes which target identities and mission relationships may exist. `missionFamily` selects one independent authority pipeline. That pipeline validates its own inputs and produces its registered result-package type. The Universal SEC validates and renders that package without changing its meaning. History then records why the architecture was adopted and when each checkpoint became official.

```text
Smart Target Catalog
        ↓
Mission Family Routing
        ↓
Zeroing Authority OR Target Authority
        ↓
Mission-Specific Result Package
        ↓
Universal SEC
        ↓
History Episodes and Milestones
```

The downward arrows show dependency and reading order, not ownership transfer. In particular, the Universal SEC never becomes scoring authority, and History never becomes runtime authority.

## 4. Status key

| Status | Meaning |
|---|---|
| **Locked** | Approved architecture boundary; changes require explicit architecture review and versioning. |
| **Active** | Current living architecture or governance used to guide ongoing work. |
| **Draft** | Proposed architecture under review; not an authority source. |
| **Conceptual** | Research or presentation model only; grants no runtime support or scoring authority. |

No core document in this reading order is currently Draft. USPSA/IPSC and IBS examples in the Universal SEC study remain Conceptual until their Target Authority gaps are resolved and execution is explicitly approved.

## 5. History cross-references

- Mission Family Routing: [episode](../history/episodes/README.md#mission-family-routing) · [milestone M-003](../history/milestones/README.md#m-003--mission-family-routing)
- Backend and Zeroing Authority: [episode](../history/episodes/README.md#backend-authority) · [milestone M-002](../history/milestones/README.md#m-002--backend-authority)
- Target Authority Phase 1: [Episode 27](../history/episodes/README.md#target-authority-phase-1-architecture-lock) · [milestone M-007](../history/milestones/README.md#m-007--target-authority-phase-1)
- Universal SEC Architecture: [episode](../history/episodes/README.md#universal-sec-architecture-baseline) · [milestone M-008](../history/milestones/README.md#m-008--universal-sec-architecture)
