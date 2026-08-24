# Episode 58 Equipment Library Knowledge-Ingestion Report

**Observed:** 2026-08-24  
**Baseline:** Snapshot 12 / commit `9bc55aa6c58bc07cfa3cd8b341bc6df9b62dc4a4`  
**Runtime admission:** none

## Founder summary

The cumulative evidence supports one reusable Equipment Library model across commercial pistols, rifles, shotguns, optics, and governed military configurations.

> **Glock + Canik = breadth. M4/military = authority depth. The 28-manufacturer census = scale.**

The current library is not blocked by one universal defect. It contains six distinct conditions that require different responses:

1. **Missing knowledge** — SCZN3 has not yet captured the exact product/configuration fact.
2. **Known but unexposed knowledge** — evidence exists, but the current selector/catalog projection does not expose it.
3. **Presentation defect** — the data exists but is shown at the wrong hierarchy or with misleading language.
4. **Freshness problem** — a formerly reasonable catalog view no longer represents the current manufacturer offering.
5. **Authority conflict/gap** — sources disagree or do not establish the exact fact required for a governed execution claim.
6. **Schema limitation** — the fact cannot be represented truthfully as a flat manufacturer/model label or generic default.

The MC9 PRIME is principally a **known-but-unexposed/freshness** finding. It is not evidence that the reusable architecture failed. Vortex `Razor` under `Holographic` and an unreachable DeltaPoint Pro are **presentation/hierarchy defects**. A generic click-value default is a **schema and authority defect**. The M4 1.5/1.75 MOA difference is an **authority conflict set**, not permission to select the newer or larger number.

## Method

This was cumulative, not clean-sheet research:

1. Accepted the completed 28-manufacturer census and source ledger as the broad evidence baseline.
2. Compared the actual structured Glock/Canik records with the deeper M4/M4A1 relationship profile.
3. Replayed the Founder-walkthrough findings against current code and catalog projections.
4. Performed a targeted current first-party pass where freshness, compatibility, or hierarchy was already known to be weak.
5. Commonized the result into the smallest schema that does not collapse meaningful relationships.

No unlike catalog-depth counts were summed. `54 Glock local variants`, `23 Canik local variants`, manufacturer family counts, manufacturer product-record counts, and commercial SKU counts are different units.

## Primary reference implementations

| Reference | What it proves | What it does not prove | Reusable inheritance |
|---|---|---|---|
| Glock | Searchable structured commercial model/variant identity; caliber and form-factor filtering; compact selector projection | Complete current U.S. catalog, commercial SKU identity, or optic/mount compatibility | Canonical identity, aliases, search projection, exact persisted selection |
| Canik | A second structured pistol catalog; model/caliber relations; real-world escape path when a current model is absent | That the 23-record local set is current or complete | Same catalog owner as Glock, plus explicit unknown/Other without destroying later reconciliation |
| M4/military | Exact configuration and scoped authority; sights, mounts, adjustment facts, ammunition, zero target, and confirmation are relationships | That one military fact transfers to every M4-like commercial rifle or every service/configuration | Configuration graph, authority scope, conflict sets, execution-relevant equipment snapshot |

The reusable owner is therefore not “a larger Glock dropdown.” It is:

> **Canonical equipment graph → evidence-bearing relationships → minimum truthful shooter projection → composed saved equipment profile**

## Founder-walkthrough reconciliation

| Walkthrough observation | Correct classification | Required response |
|---|---|---|
| MC9 PRIME absent | Known-but-unexposed plus freshness | Add through governed catalog data after source packaging; keep `Other` as a truthful escape path until then |
| Search can find known Glock/Canik entries | Demonstrated reusable behavior | Preserve; extend to normalized aliases and exact model/config fields |
| `Other` permits a shooter to continue | Necessary uncertainty boundary | Preserve the shooter declaration and mark it unresolved; do not silently map it to a known model |
| Ammo relationships exist separately | Correct domain separation | Preserve cartridge/load as its own entity and relate it to the equipment profile |
| ACTIVE state lacked enough visual force | Presentation defect | Bright-green `ACTIVE` treatment; no authority change |
| Deep M4 facts exceed commercial dropdown fields | Schema limitation | Keep depth underneath and ask only execution-relevant unresolved questions |

## Targeted freshness and relationship findings

### Glock

Glock's official 2026 material introduces G17 Gen6, G19 Gen6, and G45 Gen6 and describes a new optic-ready mounting system. The current local 54-record set does not carry Gen6 or plate/mount relationships. This is a freshness and relationship-ingestion gap, not a need for Glock-specific runtime logic.

### Canik

The official MC9 PRIME manual establishes an exact 9x19 configuration, 17-round magazine, 3.64-inch barrel, dimensions/weight, Night Fision sights, accessory rail, and named optic compatibility. Canik's optic manual further distinguishes screw/interface relationships for MC9-family products. `opticReady: true` would lose meaningful compatibility; an exact weapon/configuration-to-footprint/adapter relationship is required.

### Large and modular commercial catalogs

Official current evidence continues to show why family counts are not exact product counts. Ruger states company-scale variation across many lines; Mossberg exposes exact item/configuration records within families; SIG spans firearm, optic, and ammunition domains under one brand; BCM and Aero product language mixes complete firearms with build components. The schema must distinguish model, configuration, commercial offering, component, and domain.

### Fresh model-line changes

Targeted first-party checks confirmed material catalog changes already absent or shallow locally: HK's MR A4 line, FN's 2026 309/502/SCAR changes, current CZ model/configuration tables, and current Mossberg exact item releases. These belong to an updateable catalog ingestion owner with observation dates, not hard-coded menu branches.

### Optics

Official product pages show why an optic family label is insufficient:

- Holosun EPS variants carry exact footprint, adapter, reticle, and click facts.
- Vortex products within adjacent families can use 1 MOA or 1/2 MOA adjustments and different mount systems.
- Aimpoint products package exact mount/rail relationships.
- Leupold variants expose part number, reticle, and adjustment relationships.
- EOTECH HHS is a hybrid/bundle relationship, not a single holographic optic model.

Click value, unit, footprint, mount, height, reticle, and magnification belong to the exact sight configuration—not a brand or family default.

## M4 authority-depth result

The locked runtime registry remains controlling at **1.5 MOA** for the approved M4 front-sight relationship. The research corpus also preserves **1.75 MOA** from separate Army training material. A current review establishes that both values have government-source support in different artifacts.

The system must retain:

- exact source artifact and date;
- weapon/sight/configuration scope;
- fact value and unit;
- locked/runtime status;
- conflict-set membership;
- reconciliation status and Founder-review note.

This pass does not choose between the values, average them, or change runtime authority. It strengthens the rule:

> **Finding two values is not permission to choose one.**

## Smallest correct reusable schema

The schema has nine core entities, not one oversized product record:

1. Manufacturer/brand
2. Platform family
3. Exact model
4. Technical configuration
5. Commercial offering
6. Sight/optic configuration
7. Mount/installation relationship
8. Ammunition configuration
9. Target/zero/confirmation relationship

A saved **Equipment Profile** composes references to those entities plus shooter-declared facts and an immutable provenance snapshot. Full machine-readable details are in `REUSABLE_EQUIPMENT_SCHEMA.json`.

### Founder Gate 1 surgical clarifications

The machine-readable candidate is revised to `sczn3-equipment-knowledge-v1.1` without changing the nine-entity conceptual core or the shooter projection:

1. `configuration.entityType` explicitly distinguishes complete firearms, receivers, uppers, components, optics, mounts, ammunition, and other technical things. `commercialOffering.offeringType` separately distinguishes a single configuration from component packages and bundles.
2. `manufacturer.parentOwner` is removed. `owns`, `markets`, and `licenses` now use time-, domain-, market-, and evidence-scoped `organizationRelationship` records.
3. Every authority-sensitive value and asserted relationship must carry its own `factEnvelope` through a `factRecord` or `relationshipRecord`. A record-level provenance snapshot alone is not sufficient.
4. `targetZeroRelationship.distance` is replaced by `zeroDistance` and optional `confirmationDistance`. Transient `sessionDistance` belongs to Session Authority/execution evidence and cannot silently become a preserved zero distance.

### Minimum shooter interaction

Default projection:

> **Equipment type → manufacturer → search/select model → ask only the material unresolved configuration choice**

Then:

- reuse the active saved profile automatically where the experience can truthfully consume it;
- infer only from exact governed relationships;
- confirm a choice when multiple material configurations remain possible;
- allow `Other / I don't see mine` without converting the declaration into catalog authority;
- keep optional optic, ammunition, session distance, photo, and personal labels out of the primary path unless the selected experience needs them.

The goal is not the largest schema. It is the smallest schema that does not collapse meaningful equipment relationships.

## What should happen next

1. **Freeze this model as the ingestion contract**, not as a UI questionnaire.
2. Package a small catalog update that adds current Canik MC9 PRIME and Glock Gen6 evidence through data, proving no manufacturer/model branch is needed.
3. Correct optic hierarchy/projection defects through normalized data relationships.
4. Add conflict-set support before any research-only equipment fact can contend with locked runtime authority.
5. Validate a three-reference acceptance suite: current commercial pistol, modular optic relationship, and governed M4 configuration.
6. Only then prioritize broader exact-product ingestion by shooter value and catalog freshness—not by the largest public count.

## Explicit non-actions

- No new catalog entry was admitted to runtime authority.
- No M4 registry value was changed.
- No manufacturer-, model-, SKU-, or military-specific production branch was added.
- No menu redesign was performed.
- No false exact-model total was created.
- No commit, push, deployment, snapshot, or production registration occurred.
