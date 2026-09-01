# Equipment Library User-Data Preservation Proof

**Date:** 2026-08-31  
**Result:** PASS  
**Scope:** Existing Equipment Profile V2 and session relationship under representative forward M4 catalog/schema expansion

## Governing question

> Does shooter-owned Equipment Library data remain intact and usable when SCZN3's governed equipment catalog/schema expands?

Yes. The focused browser proof loaded an existing Equipment Profile V2 created against the Episode 58 Gate 2 catalog, then served the current Equipment Library against a representative additive M4-era registry/schema expansion.

## Shooter-owned fixture

The proof preserved and compared:

- stable Equipment Profile ID and shooter label;
- firearm category, manufacturer, model, caliber, and exact governed catalog/configuration identity;
- shooter-declared durable configuration note;
- optic identity and adjustment data;
- ammunition identity;
- shooter-supplied equipment photograph and its media metadata;
- active-equipment selection;
- a preserved SEC/session relationship through `matrixSnapshot.setupId`.

## Forward expansion exercised

The browser received an additive registry with:

- a new registry version;
- the existing Colt LE6920 governed identity;
- a representative new Colt M4A1 governed record;
- new optional technical-configuration and relationship-schema fields.

The expansion did not mutate the stored shooter profile. On a deliberate edit/resave, the profile retained the same shooter-owned values and exact equipment identity while truthfully advancing only its catalog-version provenance to the registry currently in use.

## Acceptance results

| Requirement | Result |
|---|---|
| Shooter label and stable profile ID survive | PASS |
| Shooter photo survives media compaction/hydration | PASS |
| Exact governed equipment identity survives | PASS |
| Optic/ammunition/configuration data survives | PASS |
| Active selection survives | PASS |
| Exact Equipment Profile reopen survives | PASS |
| Preserved session retains exact Equipment Profile relationship | PASS |
| Equipment Library remains usable at 390px | PASS |
| Edit/resave under expanded catalog preserves shooter data | PASS |
| Applicable target session inherits the same saved equipment | PASS |
| Episode 58 V2/V1 migration regressions | PASS |
| Episode 58 Gate 2 data-only inheritance regressions | PASS |

## Evidence

- `production/equipment_library_user_data_preservation_browser_test.mjs`
- `npm run test:equipment-user-data-preservation`
- `npm run test:episode58-equipment`
- `npm run test:episode58-gate2`

## Boundary

This proof establishes additive forward catalog/schema compatibility for shooter-owned Equipment Profile V2 data and its existing session reference. It does not authorize destructive schema replacement, removal of currently durable fields, target-specific migration branches, or catalog authority moving into the browser.

The durable rule is:

> Catalog knowledge may expand. Shooter-owned equipment identity, photographs, active selection, and preserved session relationships remain theirs and move forward intact.
