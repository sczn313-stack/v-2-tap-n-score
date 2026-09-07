# Founder Chapter 4 mechanical-quantization evidence

Date: 2026-09-06  
Target Profile: `baker_m16a2_25m_zero`  
Source specimen: `founder-m16a2-chapter4-specimen.jpg`  
Source SHA-256: `cfdc1b739588976096fcaa1b48a37cd7834d6096a5dfd08052d20454551a71d0`

## Registration proof

- Target coverage: `0.9821`
- Mutual matches: `1070`
- Inliers: `1010`
- Reprojection RMS: `0.3064 px`
- Orientation: `proven` for top, bottom, left, and right
- Source/canonical directional reconciliation: `reconciled`

## Governed correction

- Windage: `9.1849 MOA / 0.5 MOA per click = 18.369746 clicks RIGHT`
- Elevation: `9.8853 MOA / 1.25 MOA per click = 7.908241 clicks UP`
- Executable recommendation: `18 RIGHT / 8 UP`

For windage, 18 clicks leaves a residual of `0.369746` click and 19 clicks leaves a residual of `0.630254` click. The universal residual-minimization rule therefore selects 18. Registration uncertainty admits the adjacent `[18, 19]` candidates and remains preserved in the authority audit envelope; it is not erased by selection.

The deterministic exact-half tie rule is nearest whole click, half to even. The shared policy fails closed when the candidate span exceeds the governed three-click envelope or when uncertainty can reverse the correction direction.

## Regression ownership

- Shared policy: `docs/backend/mechanical_quantization.py`
- Exact Founder regression: `docs/backend/test_m16a2_target_image_registration.py`
- Boundary/cross-target regression: `docs/backend/test_mechanical_quantization.py`
