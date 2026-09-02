# Episode 60 — M/FAM Target Family Contract Lock

Date: 2026-09-02  
Status: Founder Approved / architecture locked / implementation pending

## Discovery

The M4/M16 25-meter family cannot be modeled safely as one visual category. Publisher product identity, exact printed face, physical geometry, print representation, weapon/sight configuration, mechanical authority, QR identity, Talking language, and governed execution are related but independently governed layers.

Baker's two-sided `ST-M16A2/M4` product proves the boundary. Its M4 and M16A2 faces are not cosmetic variants: they use different geometry, different sight procedures, and different mechanical authority. Conversely, harmless color or print-treatment variation need not create new geometry when physical scale and landmarks remain unchanged.

## Founder decision

Founder approved the M/FAM Target Family Contract, its admission classifications, its fail-closed boundary, and the normalized observer-view convention.

> **Publisher Product → Exact Face → Physical Geometry → Representation Variant → Weapon/Sight Configuration → Mechanical Authority → QR Identity → Talking Language → Governed Road**

> **M/FAM owns reusable capability, never inherited geometry or mechanical defaults.**

Physical-control language must follow:

> **Desired POI movement first → physical control → rotation → explicit observer view.**

## Initial family disposition

- **Fort Benning M4/M16:** locked Victory #2 Target Profile and exact `1.75/0.75` target-scoped authority remain unchanged.
- **Baker M4:** separate Smart Target identity; ±21/±8 face; `6/3`, do not use `Z`; `1.5/0.75` authority closed for future implementation.
- **Baker M16A2:** separate Smart Target identity; ±27/±10 face; one click past 300 then return to 300; `1.25/0.5` correction authority and `1 MOA/click` rear-drum setup/finalization authority closed for future implementation.

## Admission classifications

- `SAME_GEOMETRY_NEW_PRODUCT`
- `NEW_REPRESENTATION_VARIANT`
- `NEW_TARGET_PROFILE`
- `EVIDENCE_ONLY`
- `HOLD_IDENTITY_OR_AUTHORITY_UNRESOLVED`

Ambiguous identity, face, scale, configuration, or authority fails closed for governed correction.

## Preserved open work

Baker production artwork and physical specimens remain final registration/production-validation requirements. Commercial SKUs, exact QR destinations, and final observer-view iconography remain open. Baker profiles, runtime registrations, Talking lessons, tests, and governed roads have not been implemented.

## Records

- Contract: `docs/architecture/M_FAM_TARGET_FAMILY_CONTRACT.md`
- Baker M4 authority evidence: `docs/authority-evidence/mfam/BAKER_M4_MECHANICAL_AUTHORITY_EVIDENCE.md`
- Baker M16A2 authority evidence: `docs/authority-evidence/mfam/BAKER_M16A2_MECHANICAL_AUTHORITY_EVIDENCE.md`
- Snapshot: `docs/history/snapshots/SNAPSHOT_019_EPISODE_60_M_FAM_CONTRACT_LOCK.md`

This architecture preservation does not reopen Victory #2, activate M4 on Home, deploy, or begin Baker product implementation.

> **We bought this knowledge once. Make it permanent.**

