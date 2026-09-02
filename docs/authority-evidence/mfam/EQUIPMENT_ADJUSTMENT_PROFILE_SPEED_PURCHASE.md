# Equipment Adjustment Profile Speed Purchase

Date: 2026-09-02  
Status: Founder Approved / implemented / validated / protected floor

## Governing boundary

> **Equipment Authority owns reusable mechanical facts.**  
> **Target Authority owns applicability, target-specific overrides, procedure, correction calculation, and governed execution.**

Episode 58 already established the normalized equipment graph and referenced `targetZeroRelationship.adjustmentProfileId`. This bounded Episode 60 addition completes that existing concept; it does not redesign the Equipment Library or change its shooter-facing projection.

## Implemented profile contract

The Military Weapon & Equipment Library registry schema v1.1.0 now defines a proven `equipment_adjustment_profile` containing:

- exact equipment configuration and adjustment-system identity;
- per-control identity and physical control name;
- axis and operation purpose;
- movement per click and unit;
- desired POI movement and rotation;
- explicit observer position and viewing axis;
- status and effective interval;
- per-control provenance and conflicts;
- exact applicability scope.

Two reusable profiles are preserved:

| Adjustment profile | Reusable mechanical facts |
|---|---|
| `M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011` | M4/M4A1 detachable carrying handle + standard front sight post: `1.5 MOA` elevation and `0.75 MOA` windage |
| `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011` | M16A2 standard iron sights: `1.25 MOA` front-sight elevation, `0.5 MOA` rear windage, and `1 MOA/click` rear elevation drum as a configuration-setting control |

The M16A2 reusable profile does not contain the Baker target procedure `300 + one click → return to 300`. That procedure remains Target Authority.

## Exclusive target applicability selection

`targetZeroRelationship` must choose exactly one path:

1. `reusable_adjustment_profile` with a non-null `adjustmentProfileId` and null `targetScopedAuthorityRecordId`; or
2. `target_scoped_authority` with null `adjustmentProfileId` and a non-null `targetScopedAuthorityRecordId`.

The resolver rejects missing, ambiguous, wrong-target, and wrong-configuration selections.

The Fort Benning `m4_25m_zero` relationship explicitly selects `M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01`. Its `1.75 MOA` elevation remains target-scoped and never becomes the generic M4 equipment profile. The generic reusable M4 profile remains `1.5/0.75`.

## Authority source

- FM 3-22.9, Change 1, 10 February 2011
- Official URL: `https://api.army.mil/e2/c/downloads/363931.pdf`
- Verified SHA-256: `56c9c9c32e1f19aaff4c8f6bf220208ce54960dadd62dff8a4b59db0b5a1d532`
- Applicable evidence: Figure 5-19 and Table 5-5

The existing 1.5 registry audit-lineage gap remains recorded. It does not invalidate the independently hash-verified Army source.

## Validation

- Registry and schema JSON parse: PASS
- Generated production/parity registry identity: PASS
- Equipment adjustment-profile JavaScript gate: PASS
- Equipment adjustment-profile Python gate: 4/4 PASS
- Exclusive reusable versus target-scoped selection: PASS
- Ambiguous/wrong-target/wrong-configuration refusal: PASS
- Military Equipment Registry contract: PASS
- M4 mechanical-testability gate: PASS
- M4 Authority suite in preserved OpenCV environment: 11/11 PASS
- Python ↔ production adapter parity: 57/57 PASS
- Episode 58 equipment contract: PASS
- Episode 58 create/save/reload/exact-reopen/active-selection/390px/target inheritance: PASS
- Equipment Profile V2 migration/context stripping/governed-zero display: PASS
- Episode 58 Gate 2 data-only admission contract and browser road: PASS
- Equipment Library shooter-data preservation across representative M4 schema expansion: PASS
- Universal Equipment routing desktop/390px: PASS

No Baker Target Profile, QR identity, Talking lesson, registration, target procedure, or governed product road was implemented.

