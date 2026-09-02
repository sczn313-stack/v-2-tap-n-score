# SCZN3 Architecture Index

This index is the front door to SCZN3 architecture. Read the documents in order to understand how a target becomes governed, how a mission selects an independent authority pipeline, how an authoritative result becomes a shooter experience, and how those decisions are preserved historically.

## 1. Recommended reading order

1. [SCZN3 — Shortest Correct Mental Model](./SCZN3_SHORTEST_CORRECT_MENTAL_MODEL.md)
2. [Smart Target Catalog](./SMART_TARGET_CATALOG.md)
3. [Mission Family Routing governance](../history/milestones/README.md#m-003--mission-family-routing)
4. [SCZN3 Target Authority — Phase 1](./SCZN3_Target_Authority_Phase1.md), together with the existing [Backend Authority](../history/milestones/README.md#m-002--backend-authority) and zeroing-isolation boundary
5. [Equipment Compatibility Authority](./EQUIPMENT_COMPATIBILITY_AUTHORITY.md)
6. [SCZN3 Universal Shooter Experience Card Architecture](./SCZN3_Universal_SEC_Architecture.md)
7. [SCZN3 Known Target Integration Standard — KTIS](./SCZN3_KNOWN_TARGET_INTEGRATION_STANDARD_KTIS.md)
8. [M/FAM Target Family Contract](./M_FAM_TARGET_FAMILY_CONTRACT.md) for M4/M16 family admission, identity, geometry, mechanical authority, and Talking-language boundaries
9. [SCZN3 History](../history/README.md), including the [Episode Index](../history/episodes/README.md) and [Milestone Index](../history/milestones/README.md)
10. For publisher-corpus work, [Publisher OS 11-Publisher Founder Master Summary](../authority-evidence/publisher-os/PUBLISHER_OS_11_PUBLISHER_MASTER_SUMMARY_2026-08-21.md)

### Adopted architecture decision

- [ADR-001 — Composable Target Authority](./decisions/ADR-001_COMPOSABLE_TARGET_AUTHORITY.md)
- [Composable Target Authority Ownership Matrix](./COMPOSABLE_TARGET_AUTHORITY_OWNERSHIP_MATRIX.md)

These documents are locked architecture. They generalize the Phase 1 model without changing Phase 1 runtime behavior or independently authorizing implementation.

## 2. Document roles and authority boundaries

### [SCZN3 — Shortest Correct Mental Model](./SCZN3_SHORTEST_CORRECT_MENTAL_MODEL.md) — Active

The Shortest Correct Mental Model is the living operational onboarding brief for incoming agents. It states what SCZN3 knows now, distinguishes production from current working candidates, identifies locked owners and authority boundaries, preserves the failures that changed operating behavior, and directs agents to use SCZN3 knowledge before general model knowledge. It summarizes current truth but does not replace the Episode Registry, architecture contracts, target/mission authority, checkpoints, or backend result packages.

### [Smart Target Catalog](./SMART_TARGET_CATALOG.md) — Active

The Smart Target Catalog is the living architecture for target identity, versioning, lifecycle, physical specification, mission compatibility, evidence, routing, and partner participation. It owns the catalog boundary: a target is a governed identity, not an image, filename, QR parameter, or client claim. It references backend scoring authority without duplicating scoring rules.

### [Mission Family Routing governance](../history/milestones/README.md#m-003--mission-family-routing) — Active

Mission Family Routing owns selection of the authorized result-package family and authority pipeline. `missionFamily` is the sole authority switch: it selects Zeroing Authority, Target Authority, training, precision, practical-stage, or another registered mission path. It does not by itself grant execution authority; the selected pipeline must still validate target identity, support status, evidence, and its required contract. No target, renderer, saved field, or visual similarity may switch authority pipelines.

### [SCZN3 Target Authority — Phase 1](./SCZN3_Target_Authority_Phase1.md) — Locked

Phase 1 owns the locked contract for Authoritative Target Profiles, Registration Packages, observation requests, Authoritative Shot Packages, GSSF routing, and explicit refusal behavior. It defines how an exactly registered target asset may support backend classification. Target Authority must not alter, absorb, replace, or fall through to the existing zeroing engine; Zeroing Authority and Target Authority are independent pipelines.

### Zeroing Authority — Active

Zeroing Authority is the existing independent backend pipeline selected by `missionFamily == zeroingCorrection` and represented by `zeroCorrectionResult`. It owns zeroing geometry, group and point-of-impact calculations, correction vectors, clicks, and shooter guidance. Target Authority documents may define isolation and interoperability boundaries, but they do not redefine zeroing calculations or contracts.

### [Equipment Compatibility Authority](./EQUIPMENT_COMPATIBILITY_AUTHORITY.md) — Locked

Equipment Compatibility Authority separates Target Admission, Official Mission Eligibility, and Capability Availability. Registered active Smart Targets remain admissible independently of equipment ownership. Official mission claims require registered provenance, while evidence, measurement, correction, and score capabilities remain independently governed. The backend owns the truth; the frontend translates it into shooter guidance.

### [SCZN3 Universal SEC Architecture](./SCZN3_Universal_SEC_Architecture.md) — Active

The Universal SEC owns the presentation and strict renderer-selection boundary. It receives a validated mission-specific result package and presents the result, explanation, performance detail, governed evidence, session context, and next actions. It does not calculate official scores, classify observations, repair malformed authority, substitute evidence, or make conceptual targets executable.

### [SCZN3 Known Target Integration Standard — KTIS](./SCZN3_KNOWN_TARGET_INTEGRATION_STANDARD_KTIS.md) — Active

KTIS governs integration of existing printer/publisher targets. The publisher's offered product, identity, published dimensions, artwork, and variants remain physical-target authority; SCZN3 adds QR identity, UGO registration, target/mission-specific backend authority, and inherits the existing platform experience. KTIS prevents target redesign, repeated platform re-specification, and unnecessary Founder gates while preserving explicit stop conditions for real authority or architecture conflicts.

### [M/FAM Target Family Contract](./M_FAM_TARGET_FAMILY_CONTRACT.md) — Locked

M/FAM governs admission and reuse for M4/M16 Talking Smart Targets. It preserves publisher product, exact face, physical geometry, representation variant, weapon/sight configuration, mechanical authority, QR identity, Talking language, and governed-road ownership as separate layers. M/FAM supplies reusable capability but no inherited geometry or mechanical defaults. Its observer-view convention requires desired POI movement, named control, rotation, and explicit viewing perspective.

### [SCZN3 History](../history/README.md) — Active

The [Episode Index](../history/episodes/README.md) preserves the problems, discoveries, decisions, and outcomes that shaped SCZN3. The [Milestone Index](../history/milestones/README.md) records major engineering and governance checkpoints with commit evidence. History explains why decisions were made, but it does not define runtime authority and cannot override an architecture contract, mission registry, target profile, or backend result package.

### [Publisher OS 11-Publisher Founder Master Summary](../authority-evidence/publisher-os/PUBLISHER_OS_11_PUBLISHER_MASTER_SUMMARY_2026-08-21.md) — Current detailed P-OS authority

The master summary owns the current eleven-publisher corpus denominators, shared Tier 1/2/3 intelligence status, organization-authority findings, recognition-ready boundary, monitoring model, and Publisher #12 expansion cap. The Shortest Correct Mental Model carries only the minimum operational context; historical batch reports remain evidence of how the final baseline was reached.

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
- Equipment Compatibility Authority: [Episode 53](../history/episodes/README.md#governed-implementation-and-equipment-compatibility-authority) · [checkpoint](../../CHECKPOINTS/SCZN3_EP53_GOVERNED_IMPLEMENTATION_CLOSURE_2026-08-10/CHECKPOINT.md)
- Publisher OS 11-Publisher Knowledge Baseline: [milestone M-014](../history/milestones/M-014_PUBLISHER_OS_11_PUBLISHER_KNOWLEDGE_BASELINE.md) · [Founder master summary](../authority-evidence/publisher-os/PUBLISHER_OS_11_PUBLISHER_MASTER_SUMMARY_2026-08-21.md)
