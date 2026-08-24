# Weapon Library Full-Catalog Intelligence Study

## Founder summary

SCZN3's current selector is not one catalog. It is three coupled systems:

- **21 firearm manufacturers** across Rifle, Pistol and Shotgun;
- **7 optic manufacturers** across seven sight classes plus iron/bead sights;
- **14 ammunition manufacturers** behind a separate caliber/gauge → maker → load → weight hierarchy.

Only **Glock (54 local variant records)** and **Canik (23)** currently receive true structured firearm-catalog treatment. The remaining firearm choices are mostly short, hand-maintained labels behind generic buckets such as `AR Platform`, `Full Size`, `Compact`, `Semi-Auto` and `Bolt Action`. Those labels mix four different concepts: action, form factor, platform and model.

The Glock proof is valid but incomplete as a universal design. Its useful inheritance is the structured searchable record and normalized hidden identity fields. Its limits are equally important: a rifle, modular military system or optic needs platform, configuration, mount, reticle, zero and authority relationships beyond Glock's seven fields.

The M4/M4A1 study proves the deeper shape:

> **Weapon → exact variant → sight/optic → mount/configuration → ammunition → zero method → target → confirmation → shooter evidence**

That knowledge can be enormous underneath while later selection remains small. No menu redesign is proposed here.

## 1. Current SCZN3 weapon-menu inventory

### Exact hierarchy

1. Rifle / Pistol / Shotgun
2. Manufacturer filtered by category
3. “Model Type” filtered by manufacturer and category
4. “Model Caliber” containing a mixture of exact model labels and caliber
5. Optional barrel length
6. Optic type → manufacturer → model → magnification → click value → unit
7. Ammunition caliber/gauge → manufacturer → load → weight

The exact arrays are preserved in `CURRENT_MENU_BASELINE.json`.

### Generic versus model-specific

- **Structured/searchable:** Glock and Canik pistol catalogs.
- **Partially model-specific:** short curated labels such as `P320 Full Size 9mm`, `M&P15 Sport III 5.56 NATO`, `Mossberg 590 12 Gauge`.
- **Generic:** `AR Platform`, `Full Size`, `Compact`, `Semi-Auto`, `Bolt Action`.
- **Materially ambiguous:** `Benelli Tactical`, `Comp Series`, `Razor`, `SLx`, `Vudu`, `Iron Sights`.

## 2. Exact Glock reference model

The Glock implementation uses:

- `model`
- `caliber`
- `frameCategory`
- `barrelLength`
- `sightRadius`
- `flags`
- `notes`

It generates searchable `model + caliber` options, emits catalog-detail chips and stores normalized hidden fields for catalog manufacturer/model/caliber, frame category, sight radius, flags and notes. Search accepts ordinary text and numeric model fragments.

What made it better was not “more dropdown rows.” It created one normalized model record, a search projection and exact persisted identity.

What must not be copied blindly:

- current/discontinued/regional status is not normalized;
- commercial SKU/MPN is absent;
- generation and optic-ready state are flags rather than governed configuration relationships;
- compatible optic footprints/mounts are absent;
- a model-plus-caliber display string still conflates two fields;
- the 54-record local set is not itself proof of a complete current U.S. catalog.

## 3–5. Manufacturers/categories investigated and catalog depth

The census covers every current firearm and optic manufacturer. `CATALOG_CENSUS.csv` gives the acquired unit, count, evidence depth, confidence, families and exact gap for all **28 manufacturers**.

The counts are deliberately not added into a fake “total models” denominator because they are unlike units:

- Glock/Canik are exact local variant records;
- Ruger provides an official company-scale statement of almost 800 variations across more than 40 lines;
- Mossberg exposes 309 current firearm product records overall;
- several sources expose series/families rather than exact SKUs;
- some catalogs are current, while CZ/Canik source material is older and explicitly downgraded.

The honest result is a complete manufacturer coverage pass and a normalized family census—not a claim that every commercial firearm SKU has been ingested.

### Highest-value gaps

1. Smith & Wesson, Ruger and Mossberg have very large variant populations; family knowledge is strong but exact model/SKU ingestion is not complete.
2. BCM and Aero use component/build/configuration language that must distinguish complete firearms from receivers/uppers.
3. CZ and Canik require a fresh current-U.S. reconciliation.
4. FN's local `SLP` shotgun entry appears stale against the current official catalog/manual evidence.
5. HK's local `MR556/MR762` labels lag current official status, which marks A1 versions discontinued and points to the MR A4 line.

## 6. Recommended normalized equipment-data structure

Use independent entities for:

- manufacturer/brand;
- platform family;
- exact model;
- technical variant/configuration;
- commercial SKU/package;
- sighting system;
- mount/installation;
- ammunition configuration;
- target/zero relationship;
- composed shooter equipment profile;
- provenance, observation interval and uncertainty.

See `DATA_MODEL.md` for fields and relationship rules.

## 7. Duplicate, alias and model-family issues

- `M&P15-22` is rendered under both AR Platform and Rimfire.
- `Shadow 2` is rendered under Full Size and Competition.
- `Razor` is admitted under Holographic even though it is not a holographic-sight family.
- `MicroPrism` is treated as a peer to SLx even though it is a product form within Primary Arms' tiering.
- `Comp Series`, `ACOG TA31`, `Vudu`, `SLx/GLx/PLx` and `Iron Sights` are at different hierarchy levels.
- `HHS` is an EOTECH hybrid/bundle relationship, not one optic model.
- `Benelli Tactical` is not an exact model.
- `Sig Sauer` should normalize to the canonical brand presentation `SIG SAUER` while preserving the existing alias.
- Commercial M4-branded products, Army M4/M4A1 platform identity and manufacturer-of-record relationships must not merge.
- Finish, state-compliance and magazine-package variants usually belong to the commercial-offering layer, not model identity.

## 8. M4/M4A1 deep-platform findings

The M4 and M4A1 are distinct configurations. The Army describes the M4A1 as the fully automatic variant, with 5.56 mm chambering, 14.5-inch barrel, 30-round magazine, collapsible stock and 500 m stated range. The official weight itself includes sling and loaded magazine, demonstrating that “weight” also needs configuration context.

The sight is not an accessory footnote:

- M4/M4A1 backup rear sight: 0.75 MOA windage per click;
- front sight: 1.75 MOA elevation per click;
- M68 CCO: 0.5 MOA per click, 1x red-dot relationship;
- M150 RCO: 0.5 MOA per click, 4x BDC/range-estimation relationship.

Therefore SCZN3's current generic default of `1/4 MOA` cannot be silently applied to an M4/M4A1 setup. The exact sight configuration must own the adjustment relationship.

Current Army training evidence also separates:

1. grouping;
2. zeroing on the A8 at 25 m;
3. confirmation at distance;
4. hold-off application;
5. practice;
6. qualification.

A near-distance paper zero is a controlled proxy. It is not the same evidence as confirmation at distance.

The structured proof is preserved in `M4_M4A1_DEEP_PLATFORM_PROFILE.json`.

## 9. Military weapon/optic/target relationships

### Directly established

- **M4/M4A1 ↔ M68 CCO**
- **M4/M4A1 ↔ M150 RCO**
- **M4/M4A1 ↔ backup iron sight**
- **M4/M4A1 ↔ AN/PEQ-15/15A** as a separately zeroed aiming/illumination system
- **M4 ↔ FWS-I** thermal/in-line relationship
- **M4/M4A1 + primary optic ↔ A8 25 m zero ↔ confirmation on E-type target**

### Existing SCZN3/P-OS target connections

- implemented M4 25 m zero relationship;
- GunFun M16 A2/A4 zero target SKU 32110;
- GunFun M16 zero target SKU 82020;
- GunFun Navy Qual–M4 SKU 22460.

The last three remain bound by their exact product/UGO/course authority. The words “M4,” “M16” or “Navy” do not transfer government rules into a printer product.

### Adjacent platforms now connected

- SIG P320 lineage ↔ exact M17/M18 issued configurations;
- Mossberg 500/590 lineage ↔ exact M500/M590 issued configurations;
- FN ↔ M249 platform knowledge, but SCZN3 has no automatic-weapon menu category;
- SIG ↔ M7/M250 transition knowledge, but fielding does not erase the installed M4A1/M249 population.

## 10. New General Shooting Knowledge gained

### Equipment identity is relational

A weapon model alone is insufficient for useful zeroing knowledge. The repeatable unit is the composed weapon, sight, mount, ammunition, distance and target relationship.

### “Optics ready” is not compatibility

An optics-ready slide still requires an exact footprint/plate/mount relationship. HK's official VP9 plate guide directly demonstrates this: different plates serve RMR/Holosun, DeltaPoint, ACRO, Shield, EPS and 509T patterns.

### Near zero and confirmation are different evidence

The 25 m target helps establish the sight relationship; confirmation at distance tests whether that proxy produces the intended downrange outcome.

### Association is not issue authority

An optic can be commonly seen on a platform without being universally issued or authorized. Record organization, unit/scope, configuration and effective date.

### Configuration changes can invalidate inherited knowledge

Sight model, reticle, click value, mount height/location, barrel/chambering and ammunition can change the correct zero relationship. Finish or package count usually cannot.

### Platform succession is not deletion

The Army's M7/M250 transition is current knowledge, while M4A1/M249 remain real installed systems. The knowledge model needs `successor/supplements/replaces-for-scope`, not a single current boolean.

## 11. Research that would materially improve completeness

1. Exact first-party SKU/product-page ingestion for the largest catalogs: Ruger, Mossberg, Smith & Wesson, SIG SAUER and Beretta.
2. Fresh U.S.-market reconciliation for CZ, Canik, Savage, BCM and Aero Precision.
3. Official optic SKU/reticle/mount ingestion for Trijicon, Vortex, Primary Arms and Leupold.
4. A separate ammunition catalog study; do not hide it inside firearm model work.
5. Current Army technical/authorized configuration data for specific mount positions, torque, sling issue and unit-level optic allocation where publicly available.
6. Navy, Marine Corps, Air Force and Coast Guard platform/qualification profiles rather than assuming Army configuration equivalence.
7. Shooter-frequency evidence before designing menu order or tap depth.

## 12. What can eventually be commonized

Across the entire Weapon Library, SCZN3 can commonize:

- canonical manufacturer/platform/model/variant identity;
- alias resolution;
- current/legacy/regional status;
- chambering and barrel/configuration traits;
- optic footprint and mount compatibility;
- exact adjustment units/clicks and directions;
- weapon/sight/ammunition/zero/target relationships;
- provenance and uncertainty;
- search and minimum-touch presentation projections;
- SEC equipment snapshots that preserve the exact composed relationship.

What must remain specific is the authoritative data: exact model facts, exact compatibility, exact issued configuration and exact zero/target relationship.

## Final conclusion

The Glock idea scales, but the universal object is not a bigger dropdown record. It is a normalized equipment graph with small shooter-facing projections.

> **Make the knowledge underneath enormous. Make the shooter's interaction with it tiny.**

This study supplies the information architecture and first catalog census. It authorizes no Weapon Library redesign or implementation.
