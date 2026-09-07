# M/FAM Hold-Clearance Plan

Date: 2026-09-06  
Authority floor: M/FAM inventory and family authority registry version `2026-09-06.5`
Purpose: clear shared authority by governed family without collapsing product identity or copying the universal zeroing road

## Decision

The 34 held physical faces are not 34 independent zeroing applications.

- 26 held faces are assigned to seven candidate families.
- 8 held faces remain deliberately unassigned because present evidence cannot truthfully place them in a family.
- Two candidate families currently contain no admitted physical face.
- Registration remains representation-specific. A family proof may supply common geometry, procedure, confirmation, or mechanical authority, but it cannot prove the landmarks and orientation of ink it has never examined.

The scaling unit is therefore:

> **one governed family package + one conformance/registration package per exact representation → many Target Profile bindings → one universal zeroing capability**

This preserves publisher/product identity while eliminating repeated geometry, procedure, mechanics, confirmation, and workflow work.

## Nine-family hold map

| Candidate family | Faces held | Common proven facts | Common missing facts | One family-level closure package | Representation-specific remainder | Potential runtime bindings gained |
|---|---:|---|---|---|---|---:|
| `mfam_m16a1_25m_250m` — Legacy M16A1 | 1: `face-031` | issued M16A1 identity; 25m/250m procedure; aperture sequence evidence | canonical physical geometry; complete sight mechanics; confirmation authority | govern the issued M16A1 face geometry, complete mechanical controls/directions, and confirmation standard once | exact production-face registration | 1 |
| `mfam_m16a2_a3_standard_25m_300m` — Standard M16A2/A3 | 8: `face-006`, `face-013`, `face-016`, `face-018`, `face-020`, `face-025`, `face-027`, `face-032` | **governed** 18 × 20 / 0.96 cm geometry; center aim; 25m/300m procedure; M16A2 mechanics; confirmation through the existing Baker binding | no new common family authority for the exact M16A2 branch; candidate publisher faces still need conformance proof | reuse the existing governed family package and one standard conformance test: physical dimensions/pitch, aim, procedure branch, and applicable weapon branch must match | exact landmarks, orientation, and registration package for each representation; non-A2 claims need their own mechanics | **up to 8** |
| `mfam_m16a4_m4_standard_25m_300m` — Standard M16A4/M4 | 7: `face-004`, `face-007`, `face-014`, `face-017`, `face-019`, `face-021`, `face-033` | issued 14 × 16 / 1.3 cm family dimensions; 25m/300m purpose; governed M4 DCH/front-post mechanics | canonical page origin and aim; full procedure/finalization; confirmation; exact M16A4 versus M4 configuration scope | govern one canonical standard-M4 family geometry/aim/procedure/confirmation package and an explicit equipment-configuration matrix | each publisher face must prove physical conformance and receive its own registration package | **up to 7** |
| `mfam_modern_a8_moa_25m` — Modern Universal MOA/A8 | 6: `face-001`, `face-009`, `face-011`, `face-012`, `face-023`, `face-034` | governed quarter-inch Universal-MOA geometry on protected reference; geometry equivalence already proven for `face-001`, `face-011`, `face-012`; protected M4 mechanical branch exists | common procedure/finalization and confirmation by equipment branch; complete equipment/mechanical matrix | govern the reusable equipment-branch + procedure + confirmation matrix against the existing Universal-MOA Geometry Authority | registration for every representation; geometry conformance first for `face-009`, `face-023`, `face-034` | **3 near-term; up to 6** |
| `mfam_m16a2r_enlarged_23x35` — Baker enlarged M16A2R | 1: `face-005` | Baker `ST-M16A2R` product identity; 23 × 35-inch sheet; M16A2-related 25m/300m purpose; proven different from Letter-size M16A2 | internal grid pitch; page origin; physical aim; mechanical applicability; confirmation | measure and govern the enlarged family geometry/aim, then prove whether the existing M16A2 procedure/mechanics apply at that physical scale | Baker `ST-M16A2R` registration package | 1 |
| `mfam_10m_boresight_offset` — 10m boresight/offset | 1: `face-035` | Army 10m boresight procedure and device/mount-specific nature | exact form geometry; complete symbols; device/mount branches; confirmation/completion rule | govern the official base face and a device/mount authority matrix once | exact issued-form registration | 1 |
| `mfam_configuration_offset_overlay_on_base` — Configuration overlay | 0 | governed model: admitted base geometry plus exact offset overlay; M68/M150/TA01 evidence exists | exact overlay coordinates, device/mount authority, base-face applicability, completion rule | govern the overlay contract and equipment matrix independently of any one publisher representation | each base representation must already be registered; no physical face is presently mapped | 0 now |
| `mfam_usmc_36m_bzo` — USMC 36m BZO | 0 | 36m procedure evidence; M16A4/M4 applicability at evidence level | exact product/face, geometry, aim, equipment branches, confirmation | govern current issuer procedure and equipment matrix after an exact face exists | exact face identity and registration | 0 now |
| `mfam_qualification_course_product_specific` — Qualification/course products | 2: `face-015`, `face-030` | qualification purpose is proven different from the universal zeroing correction road | course geometry, scoring regions, procedure, mechanics, completion authority | define the shared qualification execution contract only where course rules are genuinely common | product/subface registration and course-specific scoring | **0 universal-zeroing bindings**; up to 2 qualification bindings |

## Authority-gap decomposition

This matrix prevents one missing layer from being disguised as another.

| Candidate family | Geometry proof | Registration / representation proof | Procedure proof | Mechanical applicability | Confirmation authority |
|---|---|---|---|---|---|
| `mfam_m16a1_25m_250m` | missing canonical physical face geometry | missing exact issued-face package | 25m/250m sequence is evidence-only | complete M16A1 sight package missing | missing |
| `mfam_m16a2_a3_standard_25m_300m` | governed; each candidate face must prove conformance | missing per held representation | governed for M16A2/A3 family | governed for exact M16A2 branch; other weapon claims remain separate | reusable governed M16A2 procedure after face/configuration admission |
| `mfam_m16a4_m4_standard_25m_300m` | 14 × 16 / 1.3 cm proven; canonical page origin/aim incomplete | missing per representation | evidence-only until finalization is closed | governed M4 branch exists; M16A4 scope remains evidence-only | missing common standard |
| `mfam_modern_a8_moa_25m` | governed reference; proven reusable on three held faces; three faces unresolved | missing per representation | partially governed; exact branch/finalization missing | protected M4 branch governed; full printed equipment matrix unresolved | missing for held product faces |
| `mfam_m16a2r_enlarged_23x35` | 23 × 35 size proven; pitch/origin/aim missing | missing Baker package | M16A2-related evidence only | must prove M16A2 mechanics apply to enlarged geometry | depends on procedure/mechanical applicability closure |
| `mfam_10m_boresight_offset` | exact form/symbol geometry missing | missing issued-form package | issuer procedure evidence only | device/mount matrix missing | completion/verification rule missing |
| `mfam_configuration_offset_overlay_on_base` | exact overlay transform missing | base face plus overlay proof missing | configuration-specific evidence only | M68/M150/TA01 rows are evidence-only | missing |
| `mfam_usmc_36m_bzo` | no exact face geometry | no exact representation exists in inventory | issuer evidence only | exact M16A4/M4 branches missing | missing |
| `mfam_qualification_course_product_specific` | product/course-specific and incomplete | missing per product/subface | product/course-specific and incomplete | course-specific mechanics unresolved | course completion/scoring authority missing |

## Ranked hold-clearance plan

The ranking uses potential bindings gained, existing governed reuse, and the amount of genuinely new common evidence required. “Potential” is conditional: no face executes until its exact representation passes conformance and registration.

| Rank | Family package | Faces affected | Exact missing evidence to acquire once | Expected bindings gained | Why this order |
|---:|---|---:|---|---:|---|
| 1 | Standard M16A2/A3 | 8 | **No new shared M16A2 geometry/procedure/mechanics proof.** Establish the family conformance protocol, then capture physical dimensions/pitch/aim and registration landmarks for the eight exact representations; isolate non-M16A2 equipment claims. | up to 8 | largest set with the common authority already governed |
| 2 | Modern Universal MOA/A8 — proven-geometry tranche | 3 immediately; 6 total | one equipment-branch/procedure/confirmation matrix; registration for Baker `ST-Uni25mMOA`, National `23112` no-yellow, and National `23112` yellow-circle | 3 near-term | three faces already have reusable Geometry Authority; no geometry research is needed for them |
| 3 | Standard M16A4/M4 | 7 | one canonical page-origin/aim/procedure/confirmation package plus exact M4/M16A4 configuration matrix | up to 7 | large family return, but more common authority remains open than M16A2 |
| 4 | Modern Universal MOA/A8 — remaining tranche | 3 | conformance proof for Rite `9126`, Action `MOA-25-1S`, and Army A8 before their representation registrations | 3 additional | reuses the rank-2 common package after geometry is proven |
| 5 | Baker enlarged M16A2R | 1 | measured internal pitch, page origin, aim, mechanical applicability, confirmation, and Baker registration | 1 | strategically important known target, but its enlargement prevents Letter-size geometry inheritance |
| 6 | Legacy M16A1 | 1 | canonical geometry, complete sight mechanics, confirmation, and registration | 1 | one family proof yields one face |
| 7 | 10m boresight/offset | 1 | exact form/symbol geometry and device/mount matrix | 1 | specialized procedure and equipment scope |
| 8 | Qualification/course products | 2 | shared course contract only after exact course geometry/scoring rules are proven | 0 on the zeroing road | must not be forced through the universal zeroing capability |
| 9 | Configuration overlay / USMC 36m | 0 admitted faces | exact physical faces or mappings before execution authority can be completed | 0 now | authority packages without a face cannot create a runtime target |

## First work package

Start with `mfam_m16a2_a3_standard_25m_300m`.

Scale Proof 01 executed this package. The shared family authority is now a machine-enforced Backend record and the Baker standard face consumes it through inheritance. No additional candidate face was admitted because the preserved evidence did not prove its physical conformance and exact representation registration. See `M_FAM_SCALE_PROOF_01_STANDARD_M16A2_A3.md`.

The family already owns the facts that must not be repurchased per publisher:

- 18 × 20 uniform grid;
- 0.96 cm physical square pitch;
- center aim reference;
- 25-meter/300-meter procedure;
- M16A2 front-post, rear-windage, and drum mechanics;
- confirmation/finalization behavior;
- the universal zeroing capability.

The remaining work is a batch **representation-conformance and registration** pass across the eight held faces. Each face must prove that it physically conforms; once it does, it inherits the family Geometry/Procedure/Mechanical Authority and receives only its own Product Identity, Representation, and registration package. No publisher-specific zeroing workflow is created.

## Named priority faces

- Baker `ST-Uni25mMOA` (`face-001`): known product and authorized Universal-MOA geometry. Hold only for production registration, exact selected-equipment branch, and confirmation.
- National `23112` no-yellow (`face-011`): known product and authorized Universal-MOA geometry. Hold only for production registration, configuration mechanics, and confirmation.
- National `23112` yellow-circle (`face-012`): same authorized geometry, separate representation. Hold only for representation-specific registration, configuration mechanics, and confirmation.
- Baker `ST-M16A2R` (`face-005`): known 23 × 35-inch product and separate geometry identity. Hold for grid pitch, page origin, aim reference, registration, and mechanical applicability. It does not inherit Letter-size M16A2 geometry.

## Unassigned intake — not silently forced into a family

Eight held faces are cataloged but cannot yet be assigned to one of the nine candidate families:

| Face | Minimum fact needed before family assignment |
|---|---|
| `face-002` — Baker Universal-MOA reverse | exact reverse-face artifact and representation |
| `face-008` — Rite True-MOA | physical geometry, aim, distance, and procedure |
| `face-010` — Rite True-MIL | physical geometry, aim, distance, and procedure |
| `face-022` — Action M16 reverse | exact face artwork, weapon generation, dimensions, grid, and aim |
| `face-024` — Action M68 optic | geometry, aim, distance, procedure, and weapon/device relationship |
| `face-026` — GunFun red reverse | exact face identity/artwork and physical geometry |
| `face-028` — GunFun green reverse | exact face identity/artwork and physical geometry |
| `face-029` — GunFun 14 × 20 M16 | weapon generation, grid, pitch, aim, and procedure |

Family assignment waits for these minimum facts. Similar branding or artwork is not authority.

## Permanent scale rules

1. Govern geometry, procedure, mechanics, and confirmation once per genuinely common family or equipment branch.
2. Preserve publisher, product, face, side, and representation identity independently.
3. Require exact representation registration; never reuse another publisher's landmarks by appearance.
4. Use one conformance protocol across a family instead of re-investigating the same common authority.
5. Admit each proven face through a small Target Profile binding to `sczn3-governed-zeroing-road-v1`.
6. Keep unassigned faces unassigned until evidence proves membership.
7. A family package reduces repeated work; it never turns candidate membership into proof.
