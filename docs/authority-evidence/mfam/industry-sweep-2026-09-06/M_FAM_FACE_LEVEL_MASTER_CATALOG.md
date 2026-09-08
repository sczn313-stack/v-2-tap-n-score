# M/FAM Face-Level Master Catalog

Date: 2026-09-06; runtime bindings updated by Scale Sweep #6 on 2026-09-07
Authority source: `docs/backend/registries/mfam_inventory_audit.json`

This is the human-readable audit of 35 physical faces belonging to 25 commercial/government products. Every two-sided product has two stable Face IDs even when one side remains unresolved. No unresolved faces are merged. The catalog therefore has 35 product-face representation records; the exact number of unique face designs remains `UNPROVEN` until every unresolved side is preserved and compared.

Abbreviations used below:

- `M16A2-2011`: `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011`
- `M4-2011`: `M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011`
- `M16A4-E`: `MFAM-M16A4-IRON-EVIDENCE-2011`
- `MODERN-ROWS-E`: `MFAM-MODERN-PRINTED-SIGHT-ROWS-EVIDENCE-ONLY`
- `M68-E`: `MFAM-M68-CCO-EVIDENCE`
- `—`: no executable authority supplied

## Publisher / issuer rollup

| Publisher / issuing authority | Products | Physical faces | Qualification |
|---|---:|---:|---|
| Headquarters, Department of the Army | 4 | 5 | issued forms/products |
| United States Marine Corps | 0 | 0 | procedure issuer only; retained in the authority count |
| Baker Targets | 3 | 5 | commercial products |
| Rite in the Rain | 4 | 5 | commercial products |
| National Target Company | 3 | 5 | commercial products |
| Qualification Targets | 2 | 2 | commercial products |
| Alco Target Company | 1 | 1 | commercial product |
| Speedwell | 1 | 2 | one two-sided commercial product |
| Action Target | 3 | 4 | commercial products |
| GunFun Shooting Targets | 4 | 6 | commercial products |
| **Total** | **25** | **35** | **10 publishers / issuing authorities** |

## Faces 001–010 — Baker and Rite in the Rain

| Face | Product / publisher / ID | Side and representation | Dimensions; geometry; grid; aim | Distance and procedure | Weapon / sight / mechanics | Registration; family; runtime | Evidence and unresolved facts |
|---|---|---|---|---|---|---|---|
| `face-001` | `product-baker-st-uni25mmoa`; Baker; `ST-Uni25mMOA` | front; `representation-001-baker-universal-moa` | 8.5×11; Universal 32×32 at 0.25 in; center crosshair/diamond | 25m; exact configuration/finalization required | M4/M16; printed rows; `MODERN-ROWS-E` | no package; modern MOA family; `HOLD` | Baker product + geometry comparison; registration/configuration/confirmation unresolved |
| `face-002` | same product/ID | back; `representation-035-baker-st-uni-reverse-unresolved` | reverse face exists; design, geometry, grid and aim are unproven | procedure unproven | applicability/mechanics unproven; — | no package/family; `HOLD` | two-sided product claim proves the physical side, not that it duplicates the preserved front |
| `face-003` | `product-baker-st-m16a2-m4`; Baker; `ST-M16A2/M4` | M16A2; `representation-002-baker-m16a2` | 8.5×11; 18×20 at 0.96 cm; aim 9 columns/10 rows from origin | 25m→300m; 8/3 + one clockwise; return counterclockwise after confirmation | M16A2 standard iron; `M16A2-2011` | `baker-m16a2-25m-photo-registration-v1`; standard M16A2 family; `GOVERNED` as `baker_m16a2_25m_zero` | Baker face, Army FM, SCZN3 registration; no unresolved facts |
| `face-004` | same product/ID | M4; `representation-003-baker-m4` | 8.5×11; 14×16 at 1.3 cm; center aim at 7 columns/8 rows | 25m→300m; 6/3 setup, do not use Z | M4/M4A1 DCH iron; `M4-2011` | `baker-st-m16a2-m4-m4-photo-registration-v1`; Standard M4 family; `GOVERNED` as `baker_m4_25m_zero` | exact Baker representation + common family facts + Scale Sweep #6; M16A4 mechanics excluded |
| `face-005` | `product-baker-st-m16a2r`; Baker; `ST-M16A2R` | single enlarged red; `representation-004` | 23×35; internal grid/pitch/aim unproven | M16A2-related 25m→300m | exact applicability; — | no package; enlarged M16A2R family; `HOLD` | Baker product; geometry, aim, mechanics, registration unresolved |
| `face-006` | `product-ritr-9125`; Rite; item `9125`, NSN `6920-01-544-9471` | front M16A2/M16A4; `representation-005` | 8.5×11; inherited 18×20 at 0.96 cm; center aim | governed Standard M16A2 25m→300m procedure | M16A2 standard iron; `M16A2-2011` | `rite-9125-m16a2-photo-registration-v1`; `GOVERNED` as `rite_9125_m16a2_25m_zero` | exact Rite identity + material face conformance + Scale Proof #5; M16A4 scope remains separate |
| `face-007` | same product/ID | back M4; `representation-006` | 8.5×11; Standard M4 family candidate | governed family procedure after conformance | governed family M4 branch | no package; Standard M4 family candidate; `HOLD` | exact complete M4-side representation for UGO registration |
| `face-008` | `product-ritr-9129`; Rite; item `9129`, NSN `6920-01-660-0348` | True-MOA; `representation-007` | 8.5×11; angular geometry/grid/aim unproven | multipurpose procedure unproven | MOA optic candidate; — | no package/family; `UNPROVEN` | Rite product/NSN; all operational facts unresolved |
| `face-009` | `product-ritr-9126`; Rite; item `9126` | Universal MOA; `representation-008` | 8.5×11; exact lattice/grid/aim unmeasured | 25m; exact procedure unproven | M4/M16 candidate; — | no package; modern MOA candidate; `HOLD` | Rite product; geometry/configuration/registration unresolved |
| `face-010` | `product-ritr-9130`; Rite; item `9130` | True-MIL; `representation-009` | 8.5×11; milliradian geometry/grid/aim unproven | multipurpose procedure unproven | MRAD optic candidate; — | no package/family; `UNPROVEN` | Rite product; all operational facts unresolved |

## Faces 011–020 — National, Qualification, Alco, and Speedwell

| Face | Product / publisher / ID | Side and representation | Dimensions; geometry; grid; aim | Distance and procedure | Weapon / sight / mechanics | Registration; family; runtime | Evidence and unresolved facts |
|---|---|---|---|---|---|---|---|
| `face-011` | `product-national-23112`; National; source `23112` | no-yellow; `representation-010` | 8.5×11; proven Universal 32×32 at 0.25 in; center crosshair/diamond | 25m; exact configuration/finalization unresolved | M4/M16 printed rows; — | no package; modern MOA family; `HOLD` | National face + P-OS; registration/mechanics/confirmation unresolved |
| `face-012` | same product/ID | yellow-circle; `representation-011` | identical geometry; yellow ink over unchanged aim | same | same | no package; modern MOA family; `HOLD` | proven representation variant; its registration/mechanics/confirmation unresolved |
| `face-013` | `product-national-m16a2-m4-carbine`; National; `M-16A2/M4-CARBINE`, source `23075` | M16A2-derived; `representation-012` | 8.75×11.25 carrier; inherited 18×20 at 0.96 cm; center aim | governed Standard M16A2 25m→300m procedure | M16A2 standard iron; `M16A2-2011` | `national-23075-m16a2-photo-registration-v1`; `GOVERNED` as `national_23075_m16a2_25m_zero` | exact National identity + material face conformance + Scale Proof #5; M4 side remains separate |
| `face-014` | same product/ID | M4-derived; `representation-013` | 8.75×11.25 carrier; Standard M4 family candidate | governed family procedure after conformance | governed family M4 branch | no package; Standard M4 family candidate; `HOLD` | exact National M4-side representation for UGO registration |
| `face-015` | `product-national-25m-alt-c`; National; `25M ALT-C` | single; `representation-014` | 17.5×22.5; course geometry/aim unregistered | M16A1 Alternate Course C, not standard correction | course-specific; — | no package; qualification family; `EVIDENCE_ONLY` | National + P-OS; course geometry/scoring/mechanics unresolved |
| `face-016` | `product-qualification-m16a2`; Qualification; SKU `M16A2`, NSN `6920-01-253-4005` | single; `representation-015` | inherited 18×20 at 0.96 cm through official issued-NSN bridge; center aim | governed Standard M16A2 25m→300m procedure | M16A2 standard iron; `M16A2-2011` | `qualification-m16a2-photo-registration-v1`; standard M16A2 family; `GOVERNED` as `qualification_m16a2_25m_zero` | Qualification exact representation + Army NSN identity + Scale Proof #4; no unresolved facts |
| `face-017` | `product-qualification-m4`; Qualification; SKU `M4 Carbine`, NSN `6920-01-472-7493` | single; `representation-016` | 8.5×11; Standard M4 family candidate | governed family procedure after conformance | governed family M4 branch | no package; Standard M4 family candidate; `HOLD` | calibrated production-scale bridge for the exact publisher representation |
| `face-018` | `product-alco-ar-0`; Alco; `AR-0` | single; `representation-017` | 8.5×11; inherited 18×20 at 0.96 cm; center aim | governed Standard M16A2 25m→300m procedure | M16A2 standard iron; `M16A2-2011` | `alco-ar0-m16a2-photo-registration-v1`; `GOVERNED` as `alco_ar0_m16a2_25m_zero` | exact Alco identity + material face conformance + Scale Proof #5; M4/M16A4/AR-15 scope remains separate |
| `face-019` | `product-speedwell-dodm4`; Speedwell; `DODM4`, NSN `6920-01-395-2949` | M4; `representation-018` | 8.75×11.5 carrier; Standard M4 family candidate | governed family procedure after conformance | governed family M4 branch | no package; Standard M4 family candidate; `HOLD` | calibrated production-scale bridge for the exact publisher representation |
| `face-020` | same product/ID | DoD M16A2; `representation-019` | 8.75×11.5 carrier; 18×20 at 0.96 cm through issued-NSN conformance; center aim | governed 25m→300m procedure | M16A2 standard iron; `M16A2-2011` | `speedwell-dodm4-m16a2-photo-registration-v1`; standard M16A2 family; `GOVERNED` as `speedwell_dodm4_m16a2_25m_zero` | Speedwell primary DODM4/M16A2 artifacts + Army FM + Scale Proof #3 manifest; no unresolved facts for this side |

## Faces 021–030 — Action Target and GunFun

| Face | Product / publisher / ID | Side and representation | Dimensions; geometry; grid; aim | Distance and procedure | Weapon / sight / mechanics | Registration; family; runtime | Evidence and unresolved facts |
|---|---|---|---|---|---|---|---|
| `face-021` | `product-action-m4-carbine`; Action; `M4 CARBINE` | M4; `representation-020` | Standard M4 family candidate | governed family procedure after conformance | governed family M4 branch | no package; Standard M4 family candidate; `HOLD` | exact M4-side representation for UGO registration |
| `face-022` | same product/ID | M16; `representation-021` | dimensions/artwork/grid/aim unproven | 25m; full procedure unavailable | M16 generation unproven; — | no package/family; `HOLD` | opposite side retained separately; generation and all face authority unresolved |
| `face-023` | `product-action-moa-25-1s`; Action; `MOA-25-1S` | single; `representation-022` | dimensions/grid/aim unproven; MOA name is not geometry | 25m claim only | M4/M16 context candidate; — | no package; modern MOA candidate; `HOLD` | Action catalog; geometry/equipment/procedure/registration unresolved |
| `face-024` | `product-action-m68-optic`; Action; `M68 OPTIC` | single; `representation-023` | dimensions/optic geometry/aim unproven | M68 training details unproven | M68; `M68-E` evidence only | no package/family; `EVIDENCE_ONLY` | Action catalog; weapon relationship, geometry, distance, procedure unresolved |
| `face-025` | `product-gunfun-32110`; GunFun; `32110` | A red; `representation-024` | 9.5×12 carrier; inherited 18×20 at 0.96 cm; center aim | governed Standard M16A2 25m→300m procedure | M16A2 standard iron; `M16A2-2011` | `gunfun-32110-m16a2-red-photo-registration-v1`; `GOVERNED` as `gunfun_32110_m16a2_red_25m_zero` | exact red representation + admitted green sibling conformance + Scale Proof #5; M16A4/reverse scope remains separate |
| `face-026` | same product/ID | B / M16A4 red; `representation-025` | 9.5×12 carrier; Standard M4 family candidate | governed family procedure after conformance | M16A4 branch still held; `M16A4-E` | no package; Standard M4 family candidate; `HOLD` | exact red M16A4 reverse representation for UGO registration |
| `face-027` | `product-gunfun-32120`; GunFun; `32120` | A green; `representation-026` | 9.5×12; page-normalized 18×20 at 0.96 cm; center aim; green wedges are ink | governed Standard M16A2 25m→300m procedure | M16A2 standard iron; `M16A2-2011` | `gunfun-32120-m16a2-green-photo-registration-v1`; standard M16A2 family; `GOVERNED` as `gunfun_32120_m16a2_green_25m_zero` | GunFun primary representation + independent axis normalization + Scale Proof #4; M16A4 reverse/scope remains separate |
| `face-028` | same product/ID | B / M16A4 green; `representation-027` | 9.5×12 carrier; Standard M4 family candidate | governed family procedure after conformance | M16A4 branch still held; `M16A4-E` | no package; Standard M4 family candidate; `HOLD` | exact green M16A4 reverse representation for UGO registration |
| `face-029` | `product-gunfun-82020`; GunFun; `82020` | single; `representation-028` | 14×20 carrier; 18×20 Standard M16A2 operative grid at 0.96 cm; center aim | governed Standard M16A2 25m→300m procedure | M16A2 standard iron; `M16A2-2011`; M16A4 excluded | `gunfun-82020-m16a2-photo-registration-v1`; Standard M16A2 family; `GOVERNED` as `gunfun_82020_m16a2_25m_zero` | exact GunFun representation + UGO conformance + Scale Sweep #6; no unresolved M16A2 facts |
| `face-030` | `product-gunfun-22460`; GunFun; `22460` | single composite; `representation-029` | 23×35; qualification regions + embedded subface; transform unproven | Navy M4 qualification | course-specific; — | no package; qualification family; `EVIDENCE_ONLY` | GunFun + P-OS; course geometry/subface transform/mechanics unresolved |

## Faces 031–035 — Government forms

| Face | Product / issuer / ID | Side and representation | Dimensions; geometry; grid; aim | Distance and procedure | Weapon / sight / mechanics | Registration; family; runtime | Evidence and unresolved facts |
|---|---|---|---|---|---|---|---|
| `face-031` | `product-army-m16a1-zero`; Army; NSN `6920-01-167-1392` | single issued; `representation-030` | page/grid/pitch unproven; center-mass aim | 25m→250m; L aperture then unmarked | M16A1 iron; complete package — | no package; M16A1 family; `EVIDENCE_ONLY` | Army FM; geometry/mechanics/registration/confirmation unresolved |
| `face-032` | `product-army-dual-m16-m4`; Army; NSN `6920-01-395-2949` | M16A2/A3; `representation-031` | 8.75×11.5 traceable issued-NSN production listing; 18×20 at 0.96 cm; center aim | governed 25m→300m procedure | M16A2 execution scope; `M16A2-2011` | `army-nsn-6920-01-395-2949-m16a2-photo-registration-v1`; standard M16A2 family; `GOVERNED` as `army_nsn_6920_01_395_2949_m16a2_25m_zero` | Army FM Figure 5-19 + Speedwell issued-NSN production bridge + Scale Proof #3 manifest; M16A3 mechanics excluded from v1 |
| `face-033` | same product/ID | M16A4/M4/M4A; `representation-032` | 14×16 at 1.3 cm; Standard M4 family candidate | governed family procedure after conformance | M4 branch governed; M16A4 held; `M4-2011`, `M16A4-E` | no package; Standard M4 family candidate; `HOLD` | exact issued M16A4/M4/M4A representation for UGO registration |
| `face-034` | `product-army-a8`; Army; A8, NSN `6920-01-660-9191` | single issued; `representation-033` | exact issued face/grid/aim comparison pending | 25m 5-round grouping/zero; 4/5 within 6 MOA threshold, 4 MOA objective; true-distance confirmation | current M4/M16 branches; — | no package; modern MOA candidate; `HOLD` | Army TC 3-20.40; exact artifact/geometry/config mechanics unresolved |
| `face-035` | `product-army-10m-boresight`; Army; TC 3-22.9 Figure F-1 | single template; `representation-034` | exact page unknown; 1 cm statement limited to separately manufactured 10m target; device-specific aim symbol | 10m boresight/offset, not live-fire 25m zero | exact optic/laser/mount required; — | no package; 10m family; `EVIDENCE_ONLY` | Army TC 3-22.9; exact form/symbol set/device branches/registration unresolved |

## Non-product authority records

These explain why 31 evidence records do not equal 25 products:

| Record | Kind | Count treatment |
|---|---|---|
| `sczn3:protected-modern-m4-m16-moa:face` | governed reference representation | adds one representation-catalog record and one runtime binding; not a commercial/government product or physical product face |
| `army:m16a2-config-offset-overlays:evidence` | configuration/overlay relationship | contributes procedure/configuration evidence; not another product/face |
| `usmc:36m-bzo:procedure-evidence` | procedure-only evidence | USMC counts as an issuing authority and 36m BZO as a procedure record; no product or face is claimed |

## Audit totals

| Level | Count | Qualification |
|---|---:|---|
| Source evidence records | 31 | prior mixed registry rows |
| Publishers / issuing authorities | 10 | includes USMC procedure issuer; excludes SCZN3 as product publisher |
| Commercial/government products | 25 | exact SKU/NSN/form identities |
| Physical faces | 35 | every substantiated side counted |
| Product-face representation records | 35 | exact unique face-design count remains `UNPROVEN` |
| Total representation catalog records | 36 | adds protected SCZN3 non-product reference |
| Geometry catalog records | 23 | resolved plus deliberately unmerged candidates; actual unique total `UNPROVEN` |
| Procedure catalog records | 14 | defined procedures plus explicit unresolved buckets; actual complete total `UNPROVEN` |
| Candidate governed families | 9 | exact list in `M_FAM_GOVERNANCE.md` |
| Runtime bindings | 12 | 11 exact physical product faces plus the protected modern reference |
