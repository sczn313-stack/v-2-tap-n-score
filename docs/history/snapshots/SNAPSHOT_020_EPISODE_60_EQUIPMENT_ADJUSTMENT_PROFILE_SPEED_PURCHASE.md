# Snapshot 20 — Episode 60 Equipment Adjustment Profile Speed Purchase

Date: 2026-09-02  
Status: Founder Approved / implemented / validated / protected floor

## Preserved state

- SCMM v2.1 includes the Founder-approved Equipment Authority/Target Authority boundary.
- Military Weapon & Equipment Library registry/schema v1.1.0 defines per-control, observer-normalized, provenance-bearing adjustment profiles.
- Reusable M4 profile: `M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011` at `1.5/0.75`.
- Reusable M16A2 profile: `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011` at `1.25/0.5`, with rear drum `1 MOA/click` as a configuration-setting fact.
- `targetZeroRelationship` selects exactly one reusable adjustment profile or one explicit target-scoped authority and fails closed on ambiguity or mismatch.
- Fort Benning `m4_25m_zero` selects its existing target-scoped `1.75/0.75` authority; generic M4 equipment authority remains uncontaminated.
- Episode 58 regressions, M4 authority/mechanics, and Python/JavaScript parity pass.

## Product boundary

No Baker M4 or Baker M16A2 Target Profile, QR identity, target procedure, Talking lesson, registration, SEC/Vault product road, Home activation, or deployment is introduced. Snapshot 19 remains the M/FAM architecture floor beneath this additive speed-purchase implementation.

## Exact floor relationship

This work began from clean Snapshot 19 commit `1dca762f62a80828f247314b617e5421b9e86b1d`. The commit containing Snapshot 20 becomes the next protected Episode 60 floor; its exact hash is reported after commit rather than predicted here.

