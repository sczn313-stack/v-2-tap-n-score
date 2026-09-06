# M16A2 Chapter 4 registration refusal evidence

Date: 2026-09-05  
Status: Founder runtime refusal reproduced; correction authority correctly withheld

## Selected authority

- Target Profile: `baker_m16a2_25m_zero`
- Target Profile version: `BAKER_M16A2_25M_AUTHORITY_v1`
- Registration package: `baker-m16a2-25m-photo-registration-v1`
- Governed face: Baker `ST-M16A2/M4` standard M16A2 face
- Governed physical sheet: Letter `8.5 × 11 inches`
- Governed canonical representation: `BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg`

## Founder source evidence

The recent Founder-selected photograph is `IMG_5326.jpeg`:

- SHA-256: `4a4adb481f5409cc7ae8db6755c8d50004f2c4128303e12ed423e5251c15575e`
- Raster: `707 × 929`
- Printed product identity: Baker `ST-M16A2R`
- Preserved product evidence identifies `ST-M16A2R` as the enlarged red `23 × 35 inch` product.

This is not the standard Letter face governed by the Chapter 4 Target Profile. No
geometry or registration equivalence between these products has been admitted.

## Registration evidence

The grid supplied enough repeated features for a strong homography, which explains
why the photograph looked convincing on screen:

| Evidence | Result |
|---|---:|
| Registration method | `ugo_sift_homography_v1` |
| Mutual matches | `62` |
| Inliers | `31` |
| Inlier ratio | `0.5000` |
| Reprojection RMS | `1.9247 px` |
| Reprojection P95 | `4.3304 px` |
| Target coverage | `1.0000` |

Coverage did not fail. The complete face was visible.

The product-specific asymmetric anchors failed:

| Orientation anchor | Coverage | Correlation | Required correlation | Result |
|---|---:|---:|---:|---|
| `top-identity` | `1.0000` | `0.1523` | `0.2500` | unverified |
| `bottom-instructions` | `1.0000` | `0.0464` | `0.2500` | unverified |

The exact authority gate was `target_orientation_unverified`. The registration
sufficiency owner was `baker-m16a2-zeroing-authority`; the directional audit release
status was `withheld`. No correction or click instruction reached the shooter.

## Root cause and correction

This was a product/representation binding defect in TSTT, plus an inaccurate generic
recovery message:

1. Chapter 1 still displayed preserved `ST-M16A2R` evidence while Chapters 3 and 4
   executed the standard `ST-M16A2/M4` M16A2 Target Profile.
2. Registration correctly refused directional authority, but the generic recovery
   copy claimed that the photograph needed more target even though coverage was 100%.

The correction binds every TSTT chapter to the exact governed standard face and maps
identity/orientation refusal to its real cause. Registration thresholds, orientation
proof, directional reconciliation, geometry, and mechanical authority are unchanged.
