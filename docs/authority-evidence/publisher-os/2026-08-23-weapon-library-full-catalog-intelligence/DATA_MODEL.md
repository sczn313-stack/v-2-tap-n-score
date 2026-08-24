# Recommended normalized equipment-intelligence model

The Glock record shape is a useful seed, but `model + caliber + form factor + barrel + sight radius + flags` is not sufficient for the whole Weapon Library. Rifles, modular pistols, optics, military configurations and commercial packages require separate identities and relationships.

## Core entities

1. **Manufacturer / brand**
   - canonical ID, exact display name, parent/owner, region, official site, aliases.
2. **Platform family**
   - stable technical lineage such as M4/M4A1, P320, 870, 10/22, ACOG.
3. **Model**
   - exact manufacturer model within a platform family.
4. **Variant / configuration**
   - generation, frame/receiver size, action, chambering, barrel, slide/upper, stock, finish only when material, optic-ready state, handedness, service configuration.
5. **Commercial offering**
   - exact SKU/MPN/UPC, market, package, included equipment, current/discontinued status and observation interval.
6. **Sighting system**
   - optic/sight identity, type, magnification, reticle, focal plane, adjustment unit and click, adjustment directions, footprint/mount interface, sight height, issued/authorized status with authority scope.
7. **Mount / installation**
   - mount model, interface, height, rail slot/location, torque or installation authority, co-witness and return-to-zero facts where established.
8. **Ammunition configuration**
   - cartridge/gauge, load, projectile/shot, weight, velocity/lot only where available. This remains a separate catalog domain.
9. **Target / zero relationship**
   - weapon configuration + sight configuration + ammunition + distance + target specification + aim point + desired impact + adjustment profile + confirmation protocol.
10. **Equipment profile**
    - the shooter's exact composed relationship, with every component/version and provenance preserved.

## Required relationship tables

- manufacturer **owns/markets** model;
- model **belongs to** platform family;
- variant **configures** model;
- commercial offering **packages** variant;
- sight **fits via** mount/interface;
- authority **issues/authorizes/associates** an exact configuration for an exact scope and period;
- target profile **supports** an exact weapon/sight/zero relationship;
- alias **resolves to** exactly one canonical entity or remains ambiguous;
- successor **replaces/supplements** predecessor without deleting historical identity.

## Identity rules

- Action, form factor and model are different fields. `Compact`, `AR Platform` and `Semi-Auto` are not model identities.
- Platform identity is not manufacturer identity. U.S. M4A1, Colt M4-family commercial products, FN military production and Daniel Defense's commercial M4A1 are related but not interchangeable.
- A family label is not an exact optic. `Comp Series`, `ACOG`, `Razor`, `SLx` and `Vudu` require model/reticle/configuration resolution.
- A color, magazine package or compliant SKU is normally a commercial offering variant, not a new technical model.
- Barrel length, chambering, sight radius, optic footprint, reticle and mount can be materially configuration-defining.
- Current/discontinued/limited/regional is time-scoped evidence, not part of the immutable model name.

## Provenance and uncertainty

Every fact carries:

- source URL/artifact;
- source owner/type;
- observation date;
- effective date/version when known;
- fact grade: `official_current`, `official_historical`, `publisher_claim`, `inference`, `unknown`;
- geographic/organizational scope;
- conflict set and reconciliation note.

## Minimum shooter-facing projection later

The backend may hold every entity above while a shooter sees only:

> Category → Manufacturer → searchable model → one material variant question

Presentation must be derived later from frequency, ambiguity and minimum-touch testing. This study does not authorize that redesign.
