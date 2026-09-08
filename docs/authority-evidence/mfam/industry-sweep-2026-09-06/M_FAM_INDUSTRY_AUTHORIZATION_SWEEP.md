# M/FAM Industry Authorization Sweep

Date: 2026-09-06; updated by Scale Proof #3 on 2026-09-07
Authority floor: completed M/FAM evidence ledger, face inventory, geometry catalog, procedure catalog, family registry, and existing registration/mechanical authorities  
Runtime owner: `sczn3-governed-zeroing-road-v1`

## Decision

Scale Proof #3 converted preserved publisher/government evidence into two new executable Standard M16A2 bindings. The registry now contains two newly authorized bindings, two previously authorized bindings, three authorized physical product faces, and 32 known physical-face holds. Three held faces have reusable Geometry Authority already proven; their remaining registration, configuration/mechanical, or confirmation facts still prevent execution.

This is not a request for another industry sweep. It is the evidence-limited result of the sweep already completed.

| Disposition | Count |
|---|---:|
| `AUTHORIZED NOW` — new runtime bindings | 2 |
| `ALREADY AUTHORIZED` — runtime bindings | 2 |
| `ALREADY AUTHORIZED` — physical product faces | 3 |
| `HOLD` — known physical product faces | 32 |
| Held faces with reusable Geometry Authority already proven | 3 |
| Held faces assigned to a candidate family | 26 |
| Held faces awaiting truthful family assignment | 8 |

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
| Speedwell `DODM4` — DoD M16A2 face (`face-020`) | inherited `geometry-standard-m16a2-096cm` through the issued-NSN conformance bridge | inherited `procedure-m16a2-25m-300m` | `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011` | `speedwell_dodm4_m16a2_25m_zero` |
| Army NSN `6920-01-395-2949` — M16A2/A3 face (`face-032`) | `geometry-standard-m16a2-096cm` | `procedure-m16a2-25m-300m` | governed M16A2 branch only | `army_nsn_6920_01_395_2949_m16a2_25m_zero` |

Evidence and claim limits: `scale-proof-03/M_FAM_SCALE_PROOF_03_EVIDENCE_TO_ADMISSIONS.md`.

## ALREADY AUTHORIZED

| Product / face | Geometry | Procedure | Mechanical authority | Runtime binding |
|---|---|---|---|---|
| Baker `ST-M16A2/M4` — M16A2 face (`face-003`) | `geometry-standard-m16a2-096cm` | `procedure-m16a2-25m-300m` | `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011` | `baker_m16a2_25m_zero` |
| SCZN3 protected modern M4/M16 MOA reference | `geometry-universal-moa-quarter-inch` | `procedure-universal-25m-governed` | `M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01` | `m4_25m_zero` |

## HOLD — exact unresolved execution facts

`AUTHORIZED GEOMETRY` means physical dimensions, grid scale, and aim reference are already proven reusable. It does not imply runtime execution authority.

| Face | Product / side | Geometry disposition | Procedure | Mechanics | Exact missing fact(s) |
|---|---|---|---|---|---|
| `face-001` | Baker `ST-Uni25mMOA` / front | **AUTHORIZED GEOMETRY** `geometry-universal-moa-quarter-inch` | universal 25m; exact branch/finalization required | printed rows evidence-only | production registration; exact selected equipment branch; confirmation |
| `face-002` | Baker `ST-Uni25mMOA` / back | unresolved reverse geometry | commercial 25m unresolved | none | exact reverse-face artifact; representation; geometry; grid; aim; procedure; equipment applicability; mechanics; registration |
| `face-004` | Baker `ST-M16A2/M4` / M4 | standard M4 family proven; face registration incomplete | M4 25m/300m | governed M4 DCH/front post | exact production landmarks; page origin; registration; confirmation |
| `face-005` | Baker `ST-M16A2R` / single 23×35 red face | proven different enlargement; internal geometry incomplete | M16A2-related 25m/300m | none | grid pitch; page origin; aim reference; registration; mechanical applicability |
| `face-006` | Rite in the Rain `9125` / M16 front | standard M16 candidate | commercial 25m unresolved | none | physical pitch; aim; printed instructions; mechanics; registration |
| `face-007` | Rite in the Rain `9125` / M4 back | standard M4 candidate | commercial 25m unresolved | none | physical pitch; aim; printed instructions; mechanics; registration |
| `face-008` | Rite in the Rain `9129` / True-MOA | unresolved angular geometry | multipurpose unresolved | none | geometry; aim; distance; procedure; equipment; registration |
| `face-009` | Rite in the Rain `9126` / Universal MOA | Universal candidate, equivalence unproven | commercial 25m unresolved | none | grid; aim; procedure; equipment; registration |
| `face-010` | Rite in the Rain `9130` / True-MIL | unresolved milliradian geometry | multipurpose unresolved | none | geometry; aim; distance; procedure; equipment; registration |
| `face-011` | National `23112` / no-yellow | **AUTHORIZED GEOMETRY** `geometry-universal-moa-quarter-inch` | commercial 25m details unresolved | none | production registration; configuration mechanics; confirmation |
| `face-012` | National `23112` / yellow-circle | **AUTHORIZED GEOMETRY** `geometry-universal-moa-quarter-inch` | commercial 25m details unresolved | none | representation-specific registration; configuration mechanics; confirmation |
| `face-013` | National `M-16A2/M4-CARBINE` / M16A2-derived | non-letter M16 candidate | M16A2 25m/300m | none | physical square pitch; aim; registration; mechanical binding |
| `face-014` | National `M-16A2/M4-CARBINE` / M4-derived | non-letter M4 candidate | M4 25m/300m | none | grid count; physical pitch; aim; registration; mechanical binding |
| `face-015` | National `25M ALT-C` | proven different qualification geometry, incomplete | Alt-C qualification | none | course geometry; aim; scoring; registration; mechanics |
| `face-016` | Qualification Targets `M16A2` | standard M16 candidate | M16A2 25m/300m | none | physical pitch; exact landmarks; mechanical binding; registration |
| `face-017` | Qualification Targets `M4 Carbine` | standard M4 candidate | commercial 25m unresolved | none | grid; physical pitch; aim; procedure; mechanics; registration |
| `face-018` | Alco `AR-0` | standard M16 candidate | M16A2 25m/300m | none | physical pitch; registration; authority for M4/M16A4 claims |
| `face-019` | Speedwell `DODM4` / M4 | standard M4 candidate | M4 25m/300m | none | physical pitch; aim; mechanical binding; registration |
| `face-021` | Action `M4 CARBINE` / M4 | unresolved two-sided container | commercial 25m unresolved | none | dimensions; artwork; grid; aim; procedure; mechanics; registration |
| `face-022` | Action `M4 CARBINE` / M16 | unresolved two-sided container | commercial 25m unresolved | none | weapon generation; dimensions; artwork; grid; aim; procedure; mechanics; registration |
| `face-023` | Action `MOA-25-1S` | Universal resemblance unproven | commercial 25m unresolved | none | dimensions; geometry; aim; equipment; procedure; registration |
| `face-024` | Action `M68 OPTIC` | unresolved optic geometry | M68 training unresolved | M68 evidence-only | dimensions; geometry; aim; distance; procedure; weapon relationship; registration |
| `face-025` | GunFun `32110` / red side A | standard-derived 9.5×12 candidate | commercial 25m unresolved | none | physical pitch; aim; weapon-specific mechanics; registration |
| `face-026` | GunFun `32110` / side B | unresolved reverse geometry | M16 zero unresolved | none | exact face identity; artwork; geometry; aim; distance; procedure; equipment; registration |
| `face-027` | GunFun `32120` / green side A | standard-derived 9.5×12 candidate | commercial 25m unresolved | none | physical pitch; ink/wedge geometry effect; aim; procedure; mechanics; registration |
| `face-028` | GunFun `32120` / side B | unresolved reverse geometry | M16 zero unresolved | none | exact face identity; artwork; geometry; aim; distance; procedure; equipment; registration |
| `face-029` | GunFun `82020` / 14×20 | proven different enlargement; internal geometry incomplete | M16 zero unresolved | none | weapon generation; grid; pitch; aim; procedure; mechanics; registration |
| `face-030` | GunFun `22460` / Navy composite | proven different qualification/composite geometry, incomplete | Navy qualification | none | course geometry; embedded subface transform; aim; procedure detail; mechanics; registration |
| `face-031` | Army M16A1 NSN `6920-01-167-1392` | legacy geometry unresolved | M16A1 25m/250m | none | page dimensions; grid; complete mechanical package; registration; confirmation |
| `face-033` | Army dual target NSN `6920-01-395-2949` / M16A4/M4/M4A | issued 14×16/1.3 cm geometry; production face incomplete | M4 25m/300m | governed M4 mechanics; M16A4 evidence-only | exact production dimensions; registration package; configuration selection |
| `face-034` | Army A8 NSN `6920-01-660-9191` | exact issued geometry unresolved | current A8 grouping/zero | none | exact issued artifact; geometry equivalence; aim; configuration mechanics; registration |
| `face-035` | Army TC 3-22.9 Figure F-1 / 10m boresight | exact symbol geometry unresolved | 10m device-specific boresight | none | exact form identity; dimensions; complete symbols; device branches; registration |

## Why the holds prevent execution

- Missing physical dimensions, pitch, origin, aim, or landmarks prevents a truthful source-photo-to-target coordinate transform.
- Missing representation registration prevents identity, scale, coverage, and top/bottom/left/right orientation proof for the exact printed face.
- Missing equipment/configuration or mechanical authority prevents a truthful control, click value, direction, and observer-view instruction.
- Missing procedure or confirmation authority prevents the universal road from truthfully declaring completion.
- A missing exact side on a two-sided product prevents selecting the correct geometry and mechanics.

## Scale result

Every known face remains individually identified. Proven common geometries are reused without merging publishers or representations. Three Standard M16A2 product/issuer faces now consume one family authority and the existing universal zeroing capability; no target-specific zeroing road was created.
