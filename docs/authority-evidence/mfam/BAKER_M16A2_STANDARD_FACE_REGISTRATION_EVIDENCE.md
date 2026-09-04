# Baker standard M16A2 face registration evidence

Date: 2026-09-04  
Status: Founder-authorized runtime registration evidence

## Identity

- Publisher product: Baker Targets `ST-M16A2/M4`
- Exact face: `M16/A2 - 25 METER ZEROING TARGET`
- Publisher page: `https://bakertargets.com/product/2-sided-25-meter-m16a2m4-zeroing-target/`
- Publisher-hosted face: `https://bakertargets.com/wp-content/uploads/2017/08/ST_M16A2.jpg`
- Governed local representation: `docs/assets/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg`
- SHA-256: `250f77079bd13198a8d3c301e204f58c8e96752631f9aec479c29f8f2f5c7993`
- Raster: `773 × 1000`
- Physical sheet: Letter `8.5 × 11 inches`, heavy ivory tag board

The representation is the flat standard face published by Baker. It is not the
`23 × 35 inch` enlarged red `ST-M16A2R` product.

## Governed geometry

The Army source establishes an `18 × 20` uniform grid of `.96 cm` squares for
the M16A2 face. Pixel landmarks measured on the exact Baker representation are:

| Landmark | Canonical coordinate |
|---|---:|
| Image | `773 × 1000 px` |
| Grid left / right | `64 / 709 px` |
| Grid top / bottom | `129 / 845 px` |
| Horizontal spacing | `645 / 18 = 35.833333 px` |
| Vertical spacing | `716 / 20 = 35.8 px` |
| Center white dot | `(386.5, 487.0 px)` = `(50.0%, 48.7%)` |

Physical displacement uses the Army-governed `.96 cm` square value, converted
to inches only at calculation time. Separate horizontal and vertical raster
spacing preserves the exact face without pretending JPEG pixels are physically
square.

## Registration boundary

- Target Profile: `baker_m16a2_25m_zero`
- Version: `BAKER_M16A2_25M_AUTHORITY_v1`
- Registration package: `baker-m16a2-25m-photo-registration-v1`
- Coordinate system: `BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1`
- Geometry authority: `BAKER_M16A2_096CM_18X20_GEOMETRY_v1`

Exact-hash admission and SIFT homography both remain fail-closed. No equivalence
with `m4_25m_zero`, Universal MOA, or `ST-M16A2R` is declared.

## Mechanical authority reuse

The registered target selects the existing reusable equipment profile only for
the exact M16A2 standard iron-sight configuration:

- `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011`
- Front sight post: `1.25 MOA/click`
- Rear windage knob: `.5 MOA/click`
- Rear elevation drum: `1 MOA/click`, configuration setup/finalization only

The printed procedure remains one clockwise click past `8/3` for the 25-meter
setup, followed by one counterclockwise click back to `8/3` only after confirmed
zero.

## Primary sources

- Baker product and exact-face URLs above.
- FM 3-22.9, Change 1, 10 February 2011, Figure 5-19 and Table 5-5.
- Verified Army PDF SHA-256: `56c9c9c32e1f19aaff4c8f6bf220208ce54960dadd62dff8a4b59db0b5a1d532`.
