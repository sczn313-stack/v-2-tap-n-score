# M/FAM Governance

Date: 2026-09-06  
Status: backend family authority established; only explicit proven bindings are executable

## Decision

M/FAM is one governed authority family consumed by the shared SCZN3 zeroing capability. It is not a collection of copied target applications.

> **Many products → few governed families → one universal zeroing capability.**

The shared capability owns:

> **photo entry → Precision Tap → aim → shots → undo/clear → results → correction presentation → adjustment → confirmation → SEC → Vault → failure/recovery**

An exact Target Profile supplies only:

> **product and face identity → representation → physical geometry → aim/procedure → applicable equipment configuration → mechanical authority → registration**

Backend structured data is runtime authority. This record explains that data to humans; it does not supersede it.

- Runtime registry: `docs/backend/registries/mfam_family_authority.json`
- Registry schema: `docs/backend/registries/mfam_family_authority.schema.json`
- Product/face audit registry: `docs/backend/registries/mfam_inventory_audit.json`
- Product/face audit schema: `docs/backend/registries/mfam_inventory_audit.schema.json`
- Fail-closed resolver: `docs/backend/mfam_family_authority.py`
- Universal zeroing capability: `sczn3-governed-zeroing-road-v1`

## Authority model

```text
Publisher / issuer product
  └─ exact face or side
      ├─ representation / ink
      ├─ physical geometry family
      ├─ registration and orientation proof
      └─ permitted weapon / sight / optic / laser configuration
          └─ mechanical authority and procedure
              └─ universal governed zeroing capability
```

Each layer answers a different question:

| Layer | Question | Never implies |
|---|---|---|
| Product identity | What printed product is this? | Geometry equivalence |
| Exact face | Which side/face is in use? | Authority from the opposite side |
| Representation | What ink/artwork is printed? | A new coordinate system when geometry is proven unchanged |
| Physical geometry | What does a photographed location mean spatially? | Equipment click authority |
| Procedure | At what distance and with what setup/confirmation sequence? | A reusable mechanical default |
| Equipment configuration | Which weapon and sight/optic/laser is mounted? | Authority for a related configuration |
| Mechanical authority | Which control, value, rotation, and observer view are true? | Product identity or registration |
| Registration | Is this exact physical face, scale, and orientation proven? | “Close enough” admission |

## Governing classifications

The structured registry uses exactly these outcomes:

- `EXACTLY_THE_SAME`
- `REPRESENTATION_INK_PUBLISHER_DIFFERENCE_ONLY`
- `SAME_GOVERNED_CAPABILITY_DIFFERENT_VALUE`
- `GEOMETRY_DIFFERENCE`
- `MECHANICAL_AUTHORITY_DIFFERENCE`
- `PROCEDURE_DIFFERENCE`
- `IDENTITY_REGISTRATION_DIFFERENCE`
- `GENUINELY_DIFFERENT_TARGET_FAMILY`
- `UNPROVEN`

These classifications are composable. Two products can have proven equivalent geometry and still require `IDENTITY_REGISTRATION_DIFFERENCE`. A shared face can require `MECHANICAL_AUTHORITY_DIFFERENCE` for M16A4 versus M4. A different sight row can be `SAME_GOVERNED_CAPABILITY_DIFFERENT_VALUE` only after its exact configuration and controls are proven.

## Inventory hierarchy and exact catalog counts

The original 31 rows are evidence records. They are not interchangeable counts of products, faces, or families.

```text
10 publishers / issuing authorities
  → 25 commercial or government products/forms
    → 35 physical printed faces
      → 35 product-face representation records
        + 1 non-product governed reference representation
        → 23 cataloged physical-geometry identities/candidates
          → 14 cataloged procedure identities/buckets
            → 9 candidate governed families
              → 2 executable runtime bindings
```

Count qualifications:

- The 25-product total excludes the SCZN3 preserved reference representation, the Army configuration-overlay relationship, and the USMC procedure-only record because none is a separate commercial/government product.
- The 35-face total counts every substantiated printed side. A two-sided product contributes two physical faces even when one face remains unresolved.
- The audit carries 35 product-face representation records. The exact number of unique face designs is `UNPROVEN`: Baker `ST-Uni25mMOA` is substantiated as two-sided, but preserved evidence shows only one side and does not prove the reverse is an exact duplicate.
- The protected SCZN3 modern MOA asset adds one non-product reference representation, producing 36 total representation-catalog records.
- The exact real-world number of unique physical geometries is `UNPROVEN`. The registry deliberately carries 23 geometry identities/candidates: three reusable geometry records with substantial proof, several proven-different but incomplete geometries, and unresolved product/side candidates that cannot yet be merged.
- The exact real-world number of unique procedures is also `UNPROVEN` where printed instructions were not captured. The registry carries 14 stable procedure identities or explicit unresolved buckets so geometry never supplies missing procedure.

The machine-enforced counts live in `mfam_inventory_audit.json`. The face-by-face human view is `M_FAM_FACE_LEVEL_MASTER_CATALOG.md`.

## Exact nine-family audit

| Family ID / plain name | Defining geometry | Defining procedure / generations | Equipment and mechanics | Products / physical faces mapped | Evidence / runtime |
|---|---|---|---|---|---|
| `mfam_m16a1_25m_250m` — Legacy M16A1 | exact grid/pitch unproven | 25m represents 250m; `L` aperture then unmarked; M16A1 | complete mechanical package unproven | Army NSN `6920-01-167-1392` / face-031 | issuer procedure evidence; `EVIDENCE_ONLY` |
| `mfam_m16a2_a3_standard_25m_300m` — Standard M16A2/A3 | 18 × 20; 0.96 cm uniform squares | 25m/300m; 8/3 + one; M16A2/A3 | `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011` | Baker `ST-M16A2/M4` face-003; Rite 9125 face-006; National dual face-013; QTI face-016; Alco face-018; Speedwell face-020; GunFun faces 025/027; Army face-032 | geometry/mechanics governed; only Baker face-003 runtime `GOVERNED` |
| `mfam_m16a4_m4_standard_25m_300m` — Standard M16A4/M4 | 14 × 16; 1.3 cm uniform squares | 25m/300m; M16A4/M4/M4A1 | `M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011`; `MFAM-M16A4-IRON-EVIDENCE-2011` | Baker face-004; Rite face-007; National face-014; QTI face-017; Speedwell face-019; Action face-021; Army face-033 | family evidence defined; commercial registrations held; no runtime binding |
| `mfam_modern_a8_moa_25m` — Modern Universal MOA/A8 | protected geometry: 32 × 32 quarter-inch lattice, 8 × 8-inch grid | modern 25m grouping/zero; final/confirmation by exact profile | `M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01`; printed rows remain evidence-only | Baker face-001 (reverse face-002 unresolved/unmapped); Rite face-009; National faces 011/012; Action face-023; Army face-034; plus protected reference representation | protected reference runtime `GOVERNED`; all product faces held |
| `mfam_m16a2r_enlarged_23x35` — Baker enlarged M16A2R | 23 × 35; internal pitch/origin unproven | M16A2-related 25m/300m | mechanical applicability unproven | Baker `ST-M16A2R` / face-005 | proven different scale; `HOLD` |
| `mfam_10m_boresight_offset` — 10m boresight/offset | separately manufactured 10m target; exact symbol geometry incomplete | 10m device/mount-specific aim/strike offset | exact optic/laser/mount required | Army 10m form / face-035 | issuer evidence; `EVIDENCE_ONLY` |
| `mfam_configuration_offset_overlay_on_base` — Configuration overlay | admitted base geometry plus exact aim/strike overlay and zone | device/mount-specific 25m offset | `MFAM-M68-CCO-EVIDENCE`; `MFAM-M150-TA01-RCO-EVIDENCE` are not executable defaults | Army overlay evidence record; no separate product face | issuer evidence; `EVIDENCE_ONLY` |
| `mfam_usmc_36m_bzo` — USMC 36m BZO | exact product/face/geometry unproven | 36m BZO; M16A4/M4 | exact configuration authority unproven | USMC procedure evidence; no product face | issuer procedure only; `EVIDENCE_ONLY` |
| `mfam_qualification_course_product_specific` — Qualification/course products | product-specific Alt-C, Navy/composite, slow/timed-fire regions | course/qualification-specific; not standard zero correction | course/equipment-specific | National face-015; GunFun face-030; other catalog leads remain outside the 31 structured records | proven different purpose; `EVIDENCE_ONLY` |

Qualification, composite, True-MOA, and True-MIL targets do not inherit a 25-meter live-fire zero face merely because an M4/M16 label appears on the product.

## Runtime admission

The registry currently exposes only two executable M/FAM bindings:

| Target Profile | Exact product/face | Geometry family | Mechanical authority | Registration |
|---|---|---|---|---|
| `baker_m16a2_25m_zero` | Baker `ST-M16A2/M4`, standard M16A2 face | standard M16A2/A3 | `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011` | `baker-m16a2-25m-photo-registration-v1` |
| `m4_25m_zero` | protected SCZN3 modern M4/M16 MOA face | modern Universal MOA/A8 | `M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01` | `m4-m16-25m-zero-photo-registration-v1` |

Every other discovered product is cataloged as evidence, `HOLD`, or `UNPROVEN`. Even a product assigned to a governed geometry family cannot execute until an explicit Target Profile binding proves its exact face, physical scale, orientation, applicable equipment, mechanics, and registration package.

## Mechanical separation

The same universal road supports different values without embedding them in frontend logic:

| Configuration | Elevation | Windage | Scope |
|---|---:|---:|---|
| M16A2 standard iron | front post 1.25 MOA/click | rear knob 0.5 MOA/click | reusable exact equipment profile; rear drum 1 MOA/click for setup/finalization |
| M4/M4A1 DCH + standard post | front post 1.5 MOA/click | rear knob 0.75 MOA/click | reusable 2011 equipment profile |
| Protected modern target M4 row | front post 1.75 MOA/click | rear knob 0.75 MOA/click | target-scoped override only |
| Printed M68/M150/TA01 rows | printed evidence values exist | printed evidence values exist | `EVIDENCE_ONLY` until exact configuration/control authority closes |

The M16A2 rear elevation drum remains a setup/finalization control:

- 25-meter setup: `8/3`, then one click clockwise past `8/3`.
- After authoritative confirmation: one click counterclockwise back to `8/3` for the 300-meter setting.

## Fail-closed invariants

1. A family has no default geometry or mechanical authority that products inherit automatically.
2. One two-sided SKU produces at least two exact face identities.
3. Matching title, NSN, overall sheet size, or artwork does not prove geometry equivalence.
4. A manufactured enlargement is new physical geometry even when artwork is recognizable.
5. Representation reuse requires proof that ink changes do not move spatial landmarks.
6. Registration must prove exact face, scale, coverage, and top/bottom/left/right orientation.
7. Equipment and mechanical authority are selected after face/geometry admission and must match their exact evidence scope.
8. Unknown values are stored as `null`/`UNPROVEN`; no nearby product supplies them.
9. Only an explicit `GOVERNED` Target Profile binding may reach correction, confirmation, SEC, or Vault.
10. Frontend and TSTT may present resolved authority; they cannot create it.

## Deliverable map

- Full product inventory: `docs/authority-evidence/mfam/industry-sweep-2026-09-06/M_FAM_INDUSTRY_PRODUCT_INVENTORY.md`
- Face-level master catalog: `docs/authority-evidence/mfam/industry-sweep-2026-09-06/M_FAM_FACE_LEVEL_MASTER_CATALOG.md`
- Family comparison: `docs/authority-evidence/mfam/industry-sweep-2026-09-06/M_FAM_FAMILY_COMPARISON_MATRIX.md`
- Product mapping: `docs/authority-evidence/mfam/industry-sweep-2026-09-06/M_FAM_PRODUCT_FAMILY_MAPPING.md`
- Exact-common vs genuine-difference report: `docs/authority-evidence/mfam/industry-sweep-2026-09-06/M_FAM_EXACT_COMMON_VS_DIFFERENCES.md`
- Unresolved evidence gaps: `docs/authority-evidence/mfam/industry-sweep-2026-09-06/M_FAM_UNRESOLVED_GAPS.md`
- Source ledger: `docs/authority-evidence/mfam/industry-sweep-2026-09-06/EVIDENCE_LEDGER.md`

## First pure-scale recommendation

Admit Baker `ST-Uni25mMOA` next—after obtaining the exact production face/specimen and building its dedicated registration package.

Why it is first:

- its physical geometry equivalence to the protected modern Universal MOA face is already proven;
- its publisher product identity is exact;
- it exercises the intended architecture: new product/representation and registration, existing geometry family and universal road;
- no target-specific zeroing workflow is needed.

The implementation must still create a Baker-specific Target Profile and registration. It must not alias Baker identity to `m4_25m_zero`, and it must resolve the selected sight/equipment row before correction authority is released.

No new target face is implemented by this governance pass.
