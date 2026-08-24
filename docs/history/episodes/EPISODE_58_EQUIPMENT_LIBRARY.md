# Episode 58 — Equipment Library

**Status:** CLOSED / ARCHIVED / LOCKED — Founder Approved
**Opened:** 2026-08-23
**Founder-approved title:** Equipment Library
**Implementation:** Founder Approved and preserved by Snapshot 13
**Closed:** 2026-08-24
**Snapshot:** Snapshot 13 — Episode 58 Equipment Library Closure
**Checkpoint:** `SCZN3_EP58_EQUIPMENT_LIBRARY_CLOSURE_2026-08-24`
**Locked inherited baseline commit:** `6846450752277eaad24e64b6d4a40578714fe85d`
**Previous episode:** [Episode 57 — Discovery-Driven Smart Target Landing Page](./EPISODE_57_DISCOVERY_DRIVEN_SMART_TARGET_LANDING_PAGE.md)

## Mission

> **Transform the Equipment Library from a shallow manufacturer/category selector into a deeply informed, normalized equipment system that can identify the shooter's actual firearm, optic/sight, ammunition, and relevant configuration while preserving minimum taps and touches.**

> **Simple on top. Smart underneath.**

Episode 58 begins with research, not a dropdown redesign. SCZN3 should first understand equipment deeply, then determine the smallest truthful set of shooter questions.

## Locked foundation inherited unchanged

- Episodes 54–57 architecture and approval boundaries.
- Publisher products inherit platform capabilities through governed data rather than product-specific software.
- [General Shooting Knowledge](../../architecture/SCZN3_SHORTEST_CORRECT_MENTAL_MODEL.md#respect-the-target-commonize-the-knowledge) is source-neutral, accumulated, shooter-centered, and distinct from source-specific product or execution authority.
- Episode 57's two-path landing page, Talk guidance, eight activity doors, unique target presentation, Standard startup, printer relationship, and Ballistic Vault payoff.
- Rate Us is voluntary, never automatically prompted, preserves exact first-party feedback with bounded derived context, and returns without interrupting the shooter's journey.
- [Snapshot 10](../snapshots/SNAPSHOT_010_SCMM_V1_4_GENERAL_SHOOTING_KNOWLEDGE_BASELINE.md) and [Snapshot 11](../snapshots/SNAPSHOT_011_RATE_US_FOUNDER_CLEANUP_BASELINE.md) remain locked and unchanged.

## Current P-OS and knowledge baseline

- 12 publishers.
- 1,792 publisher target implementation identities.
- 2,709 commercial target or target-system offerings.
- 1,792 identities / 2,709 offerings represented by recognition-ready evidence.
- 1,789 identities / 2,705 offerings Smart Evidence eligible.
- 16 implemented behavioral families; Thompson required zero new families.
- Recognition-ready evidence is not a claim that photo recognition is implemented.

SCZN3 preserves both sides of the standing distinction:

> **Respect the target. Commonize the knowledge.**

> **Learn the knowledge. Don't copy the expression.**

> **MINE → COMMONIZE → RECONCILE → SYNTHESIZE → DELIVER → LEARN**

Source-specific product meaning and execution claims remain governed. General shooting knowledge is accumulated across useful inputs and organized around shooters, evidence, improvement, and useful next actions. SCZN3 always tells the truth in its delivery to its audience.

## Starting evidence baseline

The detailed owner is the [Weapon Library Full-Catalog Intelligence Study](../../authority-evidence/publisher-os/2026-08-23-weapon-library-full-catalog-intelligence/README.md):

- [Founder report](../../authority-evidence/publisher-os/2026-08-23-weapon-library-full-catalog-intelligence/REPORT.md)
- [Current menu baseline](../../authority-evidence/publisher-os/2026-08-23-weapon-library-full-catalog-intelligence/CURRENT_MENU_BASELINE.json)
- [28-manufacturer catalog census](../../authority-evidence/publisher-os/2026-08-23-weapon-library-full-catalog-intelligence/CATALOG_CENSUS.csv)
- [Normalized equipment-data model](../../authority-evidence/publisher-os/2026-08-23-weapon-library-full-catalog-intelligence/DATA_MODEL.md)
- [M4/M4A1 deep-platform profile](../../authority-evidence/publisher-os/2026-08-23-weapon-library-full-catalog-intelligence/M4_M4A1_DEEP_PLATFORM_PROFILE.json)
- [Source/evidence ledger](../../authority-evidence/publisher-os/2026-08-23-weapon-library-full-catalog-intelligence/SOURCES.md)

The study establishes 21 firearm manufacturers, 7 optic manufacturers, and 14 ammunition manufacturers in the current UI. Glock has 54 structured local variant records, Canik has 23, and the remaining firearm catalogs are materially shallower. All 28 current firearm/optic manufacturers received a catalog-depth pass. These are unlike catalog-depth units and must not be summed into a false exact-model denominator.

## Deep equipment relationship

M4/M4A1 established:

> **Weapon variant → sight/optic → mount/configuration → ammunition → zero method → target → confirmation**

The correct universal principle is that adjustment characteristics belong to the exact equipment/configuration relationship. A generic `1/4 MOA` default cannot represent M68/M150 evidence around 0.5 MOA, M4/M4A1 rear-sight evidence around 0.75 MOA, and front-sight evidence around 1.75 MOA. Do not fix this through a local M4 branch.

Twenty-five-meter grouping/zeroing and distance confirmation are distinct stages. M17/M18, M500/M590, M16A4, M249, and M7/M250 are preserved as research context, not automatic UI or registry admission.

The emerging normalized relationship is:

> **Firearm → exact model/variant → caliber → sight/optic → mount/configuration → ammunition → adjustment behavior → zero relationship → target relationship → shooter history**

Military systems may require deeper configuration profiles than ordinary commercial selections.

## P-OS responsibility

P-OS may continue accumulating exact firearm catalogs and variants, optic models/reticles/adjustment values, mounts, ammunition/load relationships, compatibility, military configuration evidence, and useful shooting knowledge discovered along the way.

> **Respect the product. Commonize the knowledge.**

Equipment facts remain structured, provenance-bearing, time-scoped, and uncertainty-aware. Generalizable shooting knowledge enters the commonized knowledge system.

## Do not redo

- Do not reopen Episode 57 landing-page architecture or redesign Rate Us.
- Do not re-audit the 12-publisher corpus without a genuine contradiction.
- Do not re-litigate General Shooting Knowledge source neutrality.
- Do not treat each equipment model as a software implementation.
- Do not patch M4 adjustment behavior locally before identifying the universal equipment/configuration owner.
- Do not redesign dropdowns before using the completed catalog-depth evidence to define the minimum-tap problem.

## First Founder discussion

> **How do we turn deep equipment knowledge into the simplest possible Equipment Library selection experience?**

The next deliverable should be a Founder Specification, not implementation. It should determine the normalized owner, minimum truthful shooter inputs, inference/confirmation boundaries, treatment of saved equipment profiles, and acceptance tests before any UI or runtime change.

## Shooter-facing implementation candidate — 2026-08-23

The implementation extends the existing universal Equipment Library rather than creating a second equipment owner:

- New equipment follows a phone-first firearm/category path, with optic, ammunition, distance, photo, and personal details remaining optional.
- A saved profile receives a stable equipment profile ID, schema version, catalog version, evidence status/source, and creation/update provenance.
- One saved profile may be explicitly active. Applicable target experiences offer that profile to backend Session Authority first, reducing repeated shooter input without bypassing compatibility or mission authority.
- Profiles survive browser reload/re-entry and reopen exactly through `equipment_profile_id=<stable profile ID>`.
- Backend Session Authority now normalizes, fingerprints, assesses, and preserves the submitted firearm, catalog, optic, ammunition, and profile-provenance facts in the authoritative session package.
- Unknown sight adjustment and distance values remain unknown. The former silent generic `1/4 MOA` and `100 yds` new-profile assumptions were removed.
- Manufacturer/model behavior remains driven by the existing Episode 58 census/catalog data structures. No manufacturer-, model-, SKU-, or target-specific runtime admission branch was added.

Validation covers create, save, reload, exact reopen, active selection, target-experience inheritance without re-entry, 390px presentation, backend fingerprint reconciliation, existing Equipment Library routing, M4 equipment authority, Smart Target identity, Target Execution Scale Architecture, and shared Smart Target workspace ownership.

## Coordinated knowledge-ingestion pass — 2026-08-24

The [Episode 58 Equipment Library Knowledge Ingestion](../../authority-evidence/publisher-os/2026-08-24-equipment-library-knowledge-ingestion/README.md) reconciles the Founder walkthrough with the existing Glock, Canik, M4/military, and 28-manufacturer evidence.

It confirms:

> **Glock and Canik prove catalog breadth. M4/military proves authority depth. The 28-manufacturer census proves scale.**

The smallest correct reusable owner is a normalized equipment graph beneath a minimum-touch shooter projection. Missing knowledge, known-but-unexposed knowledge, presentation defects, freshness problems, authority conflicts, and schema limitations remain explicitly different conditions. MC9 PRIME is preserved as a current first-party-evidenced but locally unexposed catalog gap; no model-specific runtime branch was added. The M4 `1.5`/`1.75 MOA` evidence remains an unresolved source-scoped conflict, and locked runtime authority remains unchanged.

The only implementation change made during this knowledge-ingestion pass is the Founder-approved bright-green `ACTIVE` visual treatment. It changes no equipment identity or authority.

Founder Gate 1 locked `sczn3-equipment-knowledge-v1.1` as the approved Episode 58 ingestion contract after four exact-contract clarifications: technical `entityType` versus commercial `offeringType`; scoped organization ownership/marketing/licensing relationships; fact-level and relationship-level provenance envelopes; and governed `zeroDistance`/`confirmationDistance` separated from transient `sessionDistance`. The minimum-touch shooter projection is unchanged.

Founder Gate 2 then produced a [PASS](../../authority-evidence/publisher-os/2026-08-24-equipment-library-knowledge-ingestion/GATE2_DATA_ADMISSION_PILOT.md). Canik METE MC9 PRIME and the official Glock G17/G19/G45 Gen6 launch set entered through evidence-bearing registry data. The existing Equipment Library inherited search, select, save, reload, exact reopen, active-profile reuse, and applicable target-experience consumption with zero pilot product identities in production routing. Backend Session Authority resolves the canonical record and rejects identity tampering generically.

## Founder-review footnotes

1. **Cross-device subject continuity remains unimplemented.** Saved library profiles remain browser-persistent shooter input because SCZN3 does not yet possess a governed backend shooter identity/subject-continuity owner. Backend Authority begins at preparation/start, where the selected profile is normalized, fingerprinted, reconciled, assessed, and durably preserved with the session. Creating an account-like backend equipment store without that authority would silently invent a new identity owner.
2. **M4 front-sight evidence remains an inherited baseline discrepancy.** The Episode 58 study describes front-sight movement around `1.75 MOA`, while the locked proven M4 registry currently carries `1.5 MOA`. This implementation preserves the existing registry and does not choose between those authorities locally.

## Current boundary

Snapshot 12 remains the immutable starting baseline. Snapshot 13 preserves the Founder-approved final Equipment Library state. Episode 58 is closed, archived, and locked; no push, deployment, or production promotion is authorized by this record.

The [Episode 58 Closeout Readiness Reconciliation](./EPISODE_58_CLOSEOUT_READINESS_RECONCILIATION.md) is the current Founder-review handoff. It reconciles the approved ingestion contract, data-only admission proof, Founder walkthrough, issue taxonomy, and Episode 57/58 Try Before You Buy bridge.

The reconciliation found and the Founder authorized one bounded closure correction: separate transient session distance, personal/organization/instructor, environmental, and target/QR context from durable equipment identity. Equipment Profile V2 applies that boundary, migrates V1 profiles without requiring an equipment rebuild, and presents only explicitly governed zero/confirmation relationships as durable zero information.

The closed result is governed by:

> **Enter the equipment once. SCZN3 carries the knowledge forward—but only the knowledge that actually belongs to the equipment.**
