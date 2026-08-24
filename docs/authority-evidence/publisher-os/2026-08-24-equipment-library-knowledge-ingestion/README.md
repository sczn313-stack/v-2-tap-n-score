# Episode 58 Equipment Library Knowledge Ingestion

This evidence package reconciles the existing 28-manufacturer equipment census, the Glock and Canik structured catalogs, the governed M4/military library, the Founder walkthrough, and a targeted first-party freshness pass.

It answers one question:

> What is the smallest reusable Equipment Library model that preserves meaningful equipment relationships without making the shooter answer for the knowledge SCZN3 can carry underneath?

## Controlling results

- **Glock and Canik prove catalog breadth.** Their structured searchable records demonstrate reusable model identity and low-friction selection.
- **M4/military proves authority depth.** Useful execution knowledge is a governed relationship among a weapon configuration, sight, mount, ammunition, zero method, target, and confirmation evidence.
- **The 28-manufacturer census proves scale.** Catalog depth is uneven and unlike counts remain unlike; no false exact-model denominator is produced.
- **The Founder walkthrough proves the presentation boundary.** Missing catalog knowledge, known-but-unexposed knowledge, presentation defects, freshness problems, authority conflicts, and schema limitations are different conditions.
- **The correct model is a graph underneath and a projection on top.** The shooter usually sees category, manufacturer, searchable model, and only the material unresolved choices.

## Files

- `REPORT.md` — Founder-facing synthesis and implementation implications.
- `MANUFACTURER_RECONCILIATION.csv` — all 28 firearm/optic manufacturers and the outcome of the cumulative pass.
- `REUSABLE_EQUIPMENT_SCHEMA.json` — minimum normalized entities, relationships, fact provenance, and shooter-facing projection.
- `SOURCES.md` — local authority and targeted first-party source ledger.
- `GATE2_DATA_ADMISSION_PILOT.md` — MC9 PRIME + Glock Gen6 data-only admission result.

## Authority boundary

This package is research and architecture evidence. It does not admit new equipment into runtime authority, change locked M4 facts, or authorize manufacturer-specific production routing. The only UI change in this pass is the separately Founder-approved bright-green `ACTIVE` presentation state.

Founder subsequently locked `sczn3-equipment-knowledge-v1.1` as the Episode 58 ingestion contract. Gate 2 admitted MC9 PRIME and the official G17/G19/G45 Gen6 launch set through the governed equipment registry without product-specific production routing. See `GATE2_DATA_ADMISSION_PILOT.md`.
