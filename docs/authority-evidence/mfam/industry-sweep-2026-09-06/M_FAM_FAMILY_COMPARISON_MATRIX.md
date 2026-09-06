# M/FAM Family Comparison Matrix

Date: 2026-09-06

| Family | Physical face | Grid / spatial unit | Aim | Procedure | Configuration authority | Registration | Result |
|---|---|---|---|---|---|---|---|
| Legacy M16A1 | exact sheet unresolved | row/column/pitch unproven | center mass per doctrine | 25m represents 250m; `L` aperture then unmarked aperture | approximately 1 MOA evidence; full package unresolved | absent | `EVIDENCE_ONLY` |
| Standard M16A2/A3 | standard letter-size face; exact Baker face governed | 18 × 20; 0.96 cm uniform squares | center crosshairs/center mass | 25m represents 300m; `8/3 + 1`, return after confirmation | M16A2 front 1.25, rear windage 0.5, rear drum 1 MOA | exact Baker package governed | `GOVERNED` for Baker face only |
| Standard M16A4/M4 | side of legacy dual-face form | 14 × 16; 1.3 cm uniform squares | center mass | 25m represents 300m | M16A4 and M4 values differ | production packages absent | `EVIDENCE_ONLY` |
| Modern Universal MOA/A8 | letter-size Universal face | 32 × 32 quarter-inch lattice; 8 × 8 inches | center/offset references by row | current grouping/zeroing plus true-distance confirmation | target/config row-specific | protected SCZN3 package governed | `GOVERNED` for protected face only |
| Enlarged M16A2R | 23 × 35 | internal pitch unproven | recognizable artwork; physical meaning unresolved | 25m/300m product claim | not admitted | absent | `HOLD` |
| 10m offset/boresight | device-specific template | 1 cm on separately manufactured Army target where specified; complete geometry unresolved | configuration-specific offset symbol | 10m boresight/offset | optic/laser/mount-specific | absent | `EVIDENCE_ONLY` |
| Configuration overlay on admitted base | admitted base geometry plus exact overlay | base units plus configuration-specific aim/strike relationship | device/mount-specific | usually 25m evidence in legacy doctrine | exact sight/laser/mount authority | base and overlay both required | `EVIDENCE_ONLY` |
| USMC 36m BZO | exact product absent | unproven | unproven | 36m battlesight zero | M16A4/M4 evidence only | absent | `EVIDENCE_ONLY` |
| Qualification/composite | product-specific | product-specific | course-specific | not the standard zero/correction procedure | course/equipment-specific | absent | `GENUINELY_DIFFERENT_TARGET_FAMILY` |

## Proven family boundaries

- Standard M16A2 versus standard M4: geometry and mechanical authority differ.
- Standard M16A2 versus modern Universal MOA: geometry, landmarks, registration, and procedure differ.
- Standard M16A2 versus enlarged `ST-M16A2R`: manufactured scale differs.
- Live-fire 25m zero versus 10m offset/boresight: procedure and aim/strike geometry differ.
- Zero face versus Alt-C/Navy qualification/composite: purpose and scoring/measurement regions differ.
- True-MOA versus True-MIL: angular coordinate authority differs and requires separate profiles.

## Same capability, different values

The universal road is the same for all admitted zeroing targets. Values remain injected authority:

| Target/configuration | Elevation | Windage | Same road? |
|---|---:|---:|---|
| Standard M16A2 iron | 1.25 MOA front | 0.5 MOA rear | yes |
| Standard M4 DCH iron | 1.5 MOA front | 0.75 MOA rear | yes |
| Protected modern M4 row | 1.75 MOA front | 0.75 MOA rear | yes |

This is `SAME_GOVERNED_CAPABILITY_DIFFERENT_VALUE`, not permission to merge the three authorities.
