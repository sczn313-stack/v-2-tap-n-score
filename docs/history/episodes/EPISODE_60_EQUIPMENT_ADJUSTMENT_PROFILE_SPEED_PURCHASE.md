# Episode 60 — Equipment Adjustment Profile Speed Purchase

Date: 2026-09-02  
Status: Founder Approved / implemented / validated / protected floor

## Discovery

Episode 58 already owned the correct Equipment Library architecture and `targetZeroRelationship.adjustmentProfileId`, but its per-control adjustment-profile resolution was not defined. M/FAM exposed the missing details: observer view, named controls, purpose, per-control provenance, and an unambiguous choice between reusable equipment mechanics and target-scoped authority.

## Founder decision

Founder approved an additive completion without redesigning Episode 58:

> **Equipment Authority owns reusable mechanical facts.**  
> **Target Authority owns applicability, target-specific overrides, procedure, correction calculation, and governed execution.**

> **Equipment knowledge once. Target applicability each time.**

## Implementation

- Military Weapon & Equipment Library schema advanced from v1.0.0 to v1.1.0.
- Reusable M4 and M16A2 per-control adjustment profiles were registered with observer-normalized directions, operation purpose, scope, provenance, status, effective interval, and conflict handling.
- JavaScript and Python resolvers now accept exactly one authority-selection path per target/zero relationship.
- The existing Fort Benning relationship explicitly selects its target-scoped `1.75` authority; the reusable M4 equipment profile remains `1.5/0.75`.
- Generated frontend/backend parity artifacts were refreshed from the canonical registry.
- The standing equipment gate now includes both JavaScript and Python adjustment-profile tests.

## Boundary preserved

- Baker M4 equipment mechanics: reusable `1.5/0.75`.
- Baker M16A2 equipment mechanics: reusable `1.25/0.5`.
- M16A2 rear drum: reusable `1 MOA/click` configuration-setting fact.
- `300 + one click → return to 300`: target/zero procedure and absent from the reusable profile.
- Fort Benning `1.75`: explicit target-scoped authority, never generic M4 equipment authority.
- Backend/Target Authority retains correction calculation and governed execution.

## Verification and record

The focused selection/refusal gates, Episode 58 contracts and browser roads, shooter-data preservation, universal routing, M4 Authority 11/11, mechanical testability, and 57-case parity all pass. Full evidence is preserved in `docs/authority-evidence/mfam/EQUIPMENT_ADJUSTMENT_PROFILE_SPEED_PURCHASE.md`.

This floor does not authorize or begin the three-target M/FAM implementation.

> **We're buying speed for later.**

