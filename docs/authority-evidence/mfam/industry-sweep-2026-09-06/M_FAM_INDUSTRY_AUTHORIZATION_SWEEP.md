# M/FAM Industry Authorization Sweep

> Current-floor note (2026-09-08): Authority-floor Scale Completion #9 supersedes the live counts and dispositions in this historical sweep report. The current governed result is 22 executable physical faces, 13 held physical faces, 23 runtime bindings, and seven shared root gaps. See `authority-floor-scale-completion-09/M_FAM_AUTHORITY_FLOOR_SCALE_COMPLETION_09.md`; the original sweep record below is preserved as history.

> **Historical Scale Sweep #6 record.** The current batch disposition is Authority-floor Sweep #8: `authority-floor-sweep-08/M_FAM_AUTHORITY_FLOOR_SWEEP_08.md` — **19 executable / 16 true authority gaps / 35 physical faces**. The tables below preserve the prior decision state and are not the current runtime inventory.

Date: 2026-09-06; updated by Scale Sweep #6 on 2026-09-07
Authority floor: completed M/FAM evidence ledger, face inventory, geometry catalog, procedure catalog, family registry, and existing registration/mechanical authorities  
Runtime owner: `sczn3-governed-zeroing-road-v1`

## Decision

Scale Sweep #6 processed all 35 known physical faces in one batch. It governed the Standard M16A4/M4 family once for the proven M4/M4A1 DCH/FSP branch, admitted Baker's exact M4 face through that family, and admitted GunFun `82020` through the existing Standard M16A2/A3 family. The registry now contains two newly authorized bindings, ten previously authorized bindings, eleven authorized physical product faces, and 24 known physical-face holds.

This is not a request for another industry sweep. It is the evidence-limited result of the sweep already completed.

| Disposition | Count |
|---|---:|
| `AUTHORIZED NOW` — new runtime bindings | 2 |
| `ALREADY AUTHORIZED` — runtime bindings | 10 |
| `ALREADY AUTHORIZED` — physical product faces | 11 |
| `HOLD` — known physical product faces | 24 |
| Held faces with reusable Geometry Authority already proven | 3 |
| Held faces assigned to a candidate family | 19 |
| Held faces awaiting truthful family assignment | 5 |

The ranked family-level closure strategy is recorded in `M_FAM_HOLD_CLEARANCE_PLAN.md`.

## Shooter-state contract

Backend admission now distinguishes:

- `UNKNOWN_TARGET`: publisher product and exact face identity are not in the admitted inventory.
- `KNOWN_TARGET_GEOMETRY_AUTHORIZED`: product/face and reusable physical geometry are proven, but another exact execution fact remains unresolved.
- `KNOWN_TARGET_AUTHORITY_UNRESOLVED`: product/face is known, but physical geometry or another required authority layer is incomplete.
- `KNOWN_TARGET_EXECUTION_AUTHORIZED`: exact identity, representation registration, geometry, procedure, applicable mechanics, and runtime binding are governed.

A known target hold is reported as `THIS TARGET IS KNOWN` with the missing authority fact. It is not converted into `Try another photo` unless the actual registration decision says photograph coverage failed.

## AUTHORIZED NOW

| Product / face | Geometry | Procedure | Mechanical authority | Runtime binding |
|---|---|---|---|---|
| Baker `ST-M16A2/M4` — M4 face (`face-004`) | `geometry-standard-m4-13cm` through exact UGO registration | inherited `procedure-m4-25m-300m` | governed M4/M4A1 DCH/FSP branch | `baker_m4_25m_zero` |
| GunFun `82020` — M16A2 branch (`face-029`) | `geometry-standard-m16a2-096cm` on the product's larger carrier | inherited `procedure-m16a2-25m-300m` | governed M16A2 branch; printed M16A4 scope remains excluded | `gunfun_82020_m16a2_25m_zero` |

Evidence and claim limits: `scale-sweep-06/M_FAM_SCALE_SWEEP_06_BATCH_ADMISSION.md`.

## ALREADY AUTHORIZED

| Product / face | Geometry | Procedure | Mechanical authority | Runtime binding |
|---|---|---|---|---|
| Baker `ST-M16A2/M4` — M16A2 face (`face-003`) | `geometry-standard-m16a2-096cm` | `procedure-m16a2-25m-300m` | `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011` | `baker_m16a2_25m_zero` |
| Speedwell `DODM4` — DoD M16A2 face (`face-020`) | inherited `geometry-standard-m16a2-096cm` | inherited `procedure-m16a2-25m-300m` | governed M16A2 branch | `speedwell_dodm4_m16a2_25m_zero` |
| Army NSN `6920-01-395-2949` — M16A2/A3 face (`face-032`) | `geometry-standard-m16a2-096cm` | `procedure-m16a2-25m-300m` | governed M16A2 branch | `army_nsn_6920_01_395_2949_m16a2_25m_zero` |
| Qualification Targets `M16A2`, NSN `6920-01-253-4005` (`face-016`) | inherited `geometry-standard-m16a2-096cm` | inherited `procedure-m16a2-25m-300m` | governed M16A2 branch | `qualification_m16a2_25m_zero` |
| GunFun `32120` — green M16A2 face (`face-027`) | inherited `geometry-standard-m16a2-096cm` | inherited `procedure-m16a2-25m-300m` | governed M16A2 branch | `gunfun_32120_m16a2_green_25m_zero` |
| Rite in the Rain `9125` — M16A2 front (`face-006`) | material face conformance to `geometry-standard-m16a2-096cm` | inherited `procedure-m16a2-25m-300m` | governed M16A2 branch | `rite_9125_m16a2_25m_zero` |
| National `23075` — M16A2 face (`face-013`) | material face conformance to `geometry-standard-m16a2-096cm` | inherited `procedure-m16a2-25m-300m` | governed M16A2 branch | `national_23075_m16a2_25m_zero` |
| Alco `AR-0` — M16A2 face (`face-018`) | material face conformance to `geometry-standard-m16a2-096cm` | inherited `procedure-m16a2-25m-300m` | governed M16A2 branch | `alco_ar0_m16a2_25m_zero` |
| GunFun `32110` — red M16A2 face (`face-025`) | material face conformance through admitted green sibling | inherited `procedure-m16a2-25m-300m` | governed M16A2 branch | `gunfun_32110_m16a2_red_25m_zero` |
| SCZN3 protected modern M4/M16 MOA reference | `geometry-universal-moa-quarter-inch` | `procedure-universal-25m-governed` | `M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01` | `m4_25m_zero` |

## HOLD — exact unresolved execution facts

`AUTHORIZED GEOMETRY` means physical dimensions, grid scale, and aim reference are already proven reusable. It does not imply runtime execution authority.

| Face | Product / side | Geometry disposition | Procedure | Mechanics | Exact missing fact(s) |
|---|---|---|---|---|---|
| `face-001` | Baker `ST-Uni25mMOA` / front | **AUTHORIZED GEOMETRY** `geometry-universal-moa-quarter-inch` | universal 25m; exact branch/finalization required | printed rows evidence-only | production registration; exact selected equipment branch; confirmation |
| `face-002` | Baker `ST-Uni25mMOA` / back | unresolved reverse geometry | commercial 25m unresolved | none | exact reverse-face artifact; representation; geometry; grid; aim; procedure; equipment applicability; mechanics; registration |
| `face-005` | Baker `ST-M16A2R` / single 23×35 red face | proven different enlargement; internal geometry incomplete | M16A2-related 25m/300m | none | grid pitch; page origin; aim reference; registration; mechanical applicability |
| `face-007` | Rite in the Rain `9125` / M4 back | Standard M4 family candidate | governed family procedure after exact conformance | governed family M4 branch | exact complete M4-side representation for UGO registration |
| `face-008` | Rite in the Rain `9129` / True-MOA | unresolved angular geometry | multipurpose unresolved | none | geometry; aim; distance; procedure; equipment; registration |
| `face-009` | Rite in the Rain `9126` / Universal MOA | Universal candidate, equivalence unproven | commercial 25m unresolved | none | grid; aim; procedure; equipment; registration |
| `face-010` | Rite in the Rain `9130` / True-MIL | unresolved milliradian geometry | multipurpose unresolved | none | geometry; aim; distance; procedure; equipment; registration |
| `face-011` | National `23112` / no-yellow | **AUTHORIZED GEOMETRY** `geometry-universal-moa-quarter-inch` | commercial 25m details unresolved | none | production registration; configuration mechanics; confirmation |
| `face-012` | National `23112` / yellow-circle | **AUTHORIZED GEOMETRY** `geometry-universal-moa-quarter-inch` | commercial 25m details unresolved | none | representation-specific registration; configuration mechanics; confirmation |
| `face-014` | National `M-16A2/M4-CARBINE` / M4-derived | Standard M4 family candidate | governed family procedure after exact conformance | governed family M4 branch | exact National M4-side representation for UGO registration |
| `face-015` | National `25M ALT-C` | proven different qualification geometry, incomplete | Alt-C qualification | none | course geometry; aim; scoring; registration; mechanics |
| `face-017` | Qualification Targets `M4 Carbine` | Standard M4 family candidate | governed family procedure after exact conformance | governed family M4 branch | calibrated production-scale bridge for the exact publisher representation |
| `face-019` | Speedwell `DODM4` / M4 | Standard M4 family candidate | governed family procedure after exact conformance | governed family M4 branch | calibrated production-scale bridge for the exact publisher representation |
| `face-021` | Action `M4 CARBINE` / M4 | Standard M4 family candidate | governed family procedure after exact conformance | governed family M4 branch | exact M4-side representation for UGO registration |
| `face-022` | Action `M4 CARBINE` / M16 | unresolved two-sided container | commercial 25m unresolved | none | weapon generation; dimensions; artwork; grid; aim; procedure; mechanics; registration |
| `face-023` | Action `MOA-25-1S` | Universal resemblance unproven | commercial 25m unresolved | none | dimensions; geometry; aim; equipment; procedure; registration |
| `face-024` | Action `M68 OPTIC` | unresolved optic geometry | M68 training unresolved | M68 evidence-only | dimensions; geometry; aim; distance; procedure; weapon relationship; registration |
| `face-026` | GunFun `32110` / M16A4 red reverse | Standard M4 family candidate | governed family procedure after exact conformance | M16A4 branch held | exact red M16A4 reverse representation for UGO registration |
| `face-028` | GunFun `32120` / M16A4 green reverse | Standard M4 family candidate | governed family procedure after exact conformance | M16A4 branch held | exact green M16A4 reverse representation for UGO registration |
| `face-030` | GunFun `22460` / Navy composite | proven different qualification/composite geometry, incomplete | Navy qualification | none | course geometry; embedded subface transform; aim; procedure detail; mechanics; registration |
| `face-031` | Army M16A1 NSN `6920-01-167-1392` | legacy geometry unresolved | M16A1 25m/250m | none | page dimensions; grid; complete mechanical package; registration; confirmation |
| `face-033` | Army dual target NSN `6920-01-395-2949` / M16A4/M4/M4A | Standard M4 family candidate | governed family procedure after exact conformance | M4 branch governed; M16A4 held | exact issued M16A4/M4/M4A representation for UGO registration |
| `face-034` | Army A8 NSN `6920-01-660-9191` | exact issued geometry unresolved | current A8 grouping/zero | none | exact issued artifact; geometry equivalence; aim; configuration mechanics; registration |
| `face-035` | Army TC 3-22.9 Figure F-1 / 10m boresight | exact symbol geometry unresolved | 10m device-specific boresight | none | exact form identity; dimensions; complete symbols; device branches; registration |

## Why the holds prevent execution

- Missing physical dimensions, pitch, origin, aim, or landmarks prevents a truthful source-photo-to-target coordinate transform.
- Missing representation registration prevents identity, scale, coverage, and top/bottom/left/right orientation proof for the exact printed face.
- Missing equipment/configuration or mechanical authority prevents a truthful control, click value, direction, and observer-view instruction.
- Missing procedure or confirmation authority prevents the universal road from truthfully declaring completion.
- A missing exact side on a two-sided product prevents selecting the correct geometry and mechanics.

## Scale result

Every known face remains individually identified. Proven common geometries are reused without merging publishers or representations. Ten Standard M16A2 product/issuer faces consume one family package; Baker M4 consumes one Standard M16A4/M4 package. All use the existing universal zeroing capability. Product-specific zeroing implementations created: zero. New universal roads created: zero.
