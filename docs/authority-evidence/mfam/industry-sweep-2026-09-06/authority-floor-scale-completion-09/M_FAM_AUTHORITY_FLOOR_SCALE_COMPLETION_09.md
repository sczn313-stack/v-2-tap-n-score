# M/FAM Authority-Floor Scale Completion 09

Date: 2026-09-08  
Authority registry: `SCZN3-MFAM-FAMILY-AUTHORITY-2026-09-06`  
Universal capability: `sczn3-governed-zeroing-road-v1`

## Result

The 35-face catalog was processed as one authority-floor batch. Three additional exact identities are executable, reducing the floor from 16 held faces / 9 shared root gaps to 13 held faces / 7 shared root gaps.

| Measure | Before | After |
|---|---:|---:|
| Physical faces | 35 | 35 |
| Executable runtime bindings | 20 | 23 |
| Executable physical faces | 19 | 22 |
| Held physical faces | 16 | 13 |
| Shared root authority gaps | 9 | 7 |
| New family authority packages | 0 | 1 |
| Product-specific zeroing implementations | 0 | 0 |
| New universal zeroing roads | 0 | 0 |

## Shared authority problems solved

### 1. Generic M16 dispatch

Face `face-022`, Action Target `M4 CARBINE` M16 side, is now bound as `action_m16_m16a2_25m_zero`.

- Action Target's own product statement preserves the printer/product/M16-face identity.
- Runtime UGO must prove the 18 × 20 Standard M16A2/A3 geometry and TOP/BOTTOM/LEFT/RIGHT orientation.
- Active equipment must resolve to the governed M16A2 standard-iron branch.
- No generic `M16` string may select M16A1 or M16A4 mechanics.

This permanently removes the redundant rule that a printer's M16-face statement requires a second publisher artifact merely to exist. It does not weaken runtime geometry or equipment dispatch.

### 2. Qualification composite versus embedded zeroing subface

Face `face-030`, GunFun `22460`, is now bound as `gunfun_22460_embedded_m4_25m_zero` for its exact lower-left M4 zeroing subface.

- The exact GunFun composite remains one publisher/product representation.
- Only the embedded 14 × 16 M4 zeroing subface inherits the Standard M16A4/M4 family geometry, M4 mechanics, confirmation authority, and universal road.
- Navy qualification scoring and the other composite regions are explicitly excluded.

This corrects the over-broad gate that treated every part of a qualification product as unavailable merely because the whole sheet also contains course-scoring regions.

### 3. Issued M16A1 family authority

Face `face-031`, Army NSN `6920-01-167-1392`, is now bound as `army_nsn_6920_01_167_1392_m16a1_25m_zero` through one new family package:

`MFAM-M16A1-25M-250M-FAMILY-AUTHORITY-v1`

The issuer face and doctrine govern:

- a 26 × 30 printed click lattice;
- center white-dot aim at 13 columns / 16 rows;
- one printed interval per applicable M16A1 sight click;
- the L aperture during 25-meter zero;
- three-round groups and group-center-to-white-dot adjustment;
- the issued 4-centimeter zero region;
- final rotation to the unmarked aperture for the 250-meter battlesight zero.

The runtime consumes the printed click lattice directly. It does not invent a carrier dimension, infer centimeter pitch from the raster, or buy a separate MOA conversion.

## Redundant gates permanently removed

- Independent re-proof of printer/issuer product identity after a primary printer statement exists.
- Outer paper dimension as an execution gate when the operative UGO geometry is independently proven.
- Ink, color, branding, and non-operative wording as geometry gates.
- Re-proving family mechanics, procedure, aim, or confirmation for each publisher face.
- Treating a composite product as indivisible when an exact zeroing subface has its own governed UGO boundary.
- Treating one OpenCV feature-detector count as authority: the exact historical evidence remains preserved, while regression now governs material registration quality, direction, and the executable result across supported CPU builds.

## Remaining genuine authority gaps

| Faces | Exact hold statement |
|---|---|
| `001, 009, 011, 012, 023, 034` | SCZN3 cannot truthfully execute because the applicable true-distance confirmation/completion authority is genuinely unknown; UGO cannot turn a 25-meter proxy result into a confirmed true-distance zero. |
| `002` | SCZN3 cannot truthfully execute because the second physical face is genuinely unknown; UGO cannot select a geometry family before the face is identified. |
| `005` | SCZN3 cannot truthfully execute because the enlarged face's operative scale and aim/origin mapping are genuinely unknown; printer-authorized carrier size does not establish them. |
| `008, 010` | SCZN3 cannot truthfully execute because the canonical source-to-angular transform and the shooter's exact optic mechanics are genuinely unknown. |
| `015` | SCZN3 cannot truthfully execute because the complete Alternate-C course scoring and completion authority is genuinely unknown; the universal zeroing road cannot invent it. |
| `024` | SCZN3 cannot truthfully execute because the device/mount offset and applicable M68 mechanics are genuinely unknown. |
| `035` | SCZN3 cannot truthfully execute because the configuration-specific device offsets are genuinely unknown; this is not the 25-meter live-fire road. |

## Preserved authority

- Army FM 3-22.9 Change 1 PDF SHA-256: `56c9c9c32e1f19aaff4c8f6bf220208ce54960dadd62dff8a4b59db0b5a1d532`.
- Extracted Figure 5-18 M16A1 face SHA-256: `d0549a9b3c11d2cfa7e8b536d2cd5e2a5a73833fac1d16070074082718a8994c` (tight target-border crop; manual-page text excluded).
- GunFun `22460` exact publisher representation SHA-256: `f2fc490a4f65f6b04dd656e5ad6320807b946b93ef13d6022d07f000fbc01765`.
- Action Target primary product page: `https://shop.actiontarget.com/content/m4-carbine-m4-m16-25-meter-two-sided-zeroing-target.asp`.
- GunFun primary product page: `https://gunfun.com/shop/navy-qual-m4-22460/`.
- Army primary publication: `https://api.army.mil/e2/c/downloads/363931.pdf`.

## Validation

- Registry integrity and live authorization counts: PASS.
- JSON Schema validation for authority, conformance, and inventory registries: 3/3 PASS.
- Three new family-conformance admissions: PASS.
- Exact GunFun composite registration: PASS.
- Exact Army M16A1 registration and topology/orientation proof: PASS.
- Army printed-grid mechanical recommendation and calculation reconciliation: PASS.
- Session Authority preparation for all three profiles: PASS.
- Backend Session Authority: 22/22 PASS.
- Python/production authority parity, including the M16A1 direct-click case: 59/59 PASS.
- Existing M4 and directional registration/reconciliation: 13/13 PASS.
- Production build: 422 public files PASS.
- Product-specific zeroing implementations created: 0.
- Universal zeroing roads created: 0.

Measured batch elapsed time: approximately 1 hour 41 minutes from the first retained completion artifact through the completed validation pass. Most time was spent extracting and validating the one genuinely new M16A1 family package and proving exact registration topology, not re-verifying already-governed publisher-family facts.
