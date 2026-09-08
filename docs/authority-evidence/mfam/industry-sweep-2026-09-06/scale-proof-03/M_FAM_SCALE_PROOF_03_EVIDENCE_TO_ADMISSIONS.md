# M/FAM Scale Proof #3 — Evidence to Admissions

Observed: 2026-09-07  
Starting preservation HEAD: `d76c21a7692bc70d58b91b4b5c0f57ff6a896a97`  
Family: `mfam_m16a2_a3_standard_25m_300m`  
Family authority: `MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1`

## Result

One issued-NSN production-representation bridge and two exact-face registration packages converted two of the eight held candidates into executable bindings:

The starting family binding was Baker standard M16A2 `face-003` → `baker_m16a2_25m_zero`.

| Face | Exact identity preserved | Representation authority | Result |
| --- | --- | --- | --- |
| `face-020` | Speedwell `DODM4`, NSN `6920-01-395-2949`, DoD M16A2 side | Speedwell primary DODM4 side plus primary high-resolution Speedwell M16A2 plate | `speedwell_dodm4_m16a2_25m_zero` — ADMITTED |
| `face-032` | Army-issued NSN `6920-01-395-2949`, M16A2/A3 face | Army FM 3-22.9 Figure 5-19 exact issued face | `army_nsn_6920_01_395_2949_m16a2_25m_zero` — ADMITTED for the governed M16A2 branch |

Both inherit the existing family geometry, aim, procedure, M16A2 mechanical authority, confirmation authority, and universal zeroing capability. Neither has product-specific correction, confirmation, SEC, Vault, or workflow code.

The DODM4 M4 reverse face remains held. The Army M16A4/M4/M4A reverse face remains held. Admission of one face does not authorize the other side of a two-sided product.

## Pantry-first evidence path

The existing corpus already proved five of six gates for Speedwell and Army. The only acquisition performed was the missing exact production-representation/orientation evidence:

1. Archived Speedwell primary DODM4 product page.
2. Speedwell primary DODM4 M16A2-side image.
3. Archived Speedwell primary DODM16A2 page.
4. Speedwell primary high-resolution M16A2 flat plate.
5. Official Army FM 3-22.9 Figure 5-19 M16A2 face.

The exact files, source URLs, hashes, feature reconciliation, admissions, and claim limits are in `SCALE_PROOF_03_EVIDENCE_MANIFEST.json`.

## Registration and orientation

Each admitted face owns a separate package:

- `speedwell-dodm4-m16a2-photo-registration-v1`
- `army-nsn-6920-01-395-2949-m16a2-photo-registration-v1`

Each package requires the existing governed admission gates, asymmetric top/bottom evidence, and source-plane directional reconciliation. A 180-degree transformed representation cannot enter through the exact-asset path and must independently prove orientation through registration; it is not flipped or guessed.

The representation bridge does only three things:

- trace the DODM4 M16A2 side to Speedwell's primary flat M16A2 representation;
- trace the issued NSN identity to the official Army face;
- establish that both conforming representations consume the already-governed Standard M16A2/A3 family authority.

It does not collapse publisher/product identities or grant registration to another publisher.

## Remaining HOLDs

| Face | Product | Exact irreducible remote evidence gap |
| --- | --- | --- |
| `face-006` | Rite in the Rain 9125 | Calibrated exact front-face artifact proving physical pitch, center aim, exact Standard M16A2 procedure and orientation landmarks; then exact-face registration. |
| `face-013` | National 23075 | Calibrated production proof of 0.96 cm pitch and center-aim conformance; then exact National-face registration. The publisher image is not a dimensional artifact. |
| `face-016` | Qualification M16A2 | Traceable physical production proof tying this publisher/NSN face to 0.96 cm pitch and center aim; then exact-face registration. Its web image is anisotropically resized. |
| `face-018` | Alco AR-0 | Dimensioned evidence resolving the publisher's offset-aim description against the family's center-aim requirement; then exact-face registration. |
| `face-025` | GunFun 32110 | Calibrated production-scale 0.96 cm pitch/center-aim proof for the 9.5 × 12 red face; then registration. |
| `face-027` | GunFun 32120 | Calibrated production-scale pitch/center-aim proof and proof that the green wedges do not alter governed geometry; then registration. |

No face above was rejected merely because its publisher, SKU, color, or branding differs. Each remains held because a fact required to interpret physical displacement is still unproven.

## Scale score

| Measure | Result |
| --- | ---: |
| Starting executable family bindings | 1 |
| Candidates investigated | 8 |
| New authoritative evidence artifacts | 5 |
| Reusable evidence artifacts | 2 |
| New reusable evidence/conformance packages | 1 |
| New exact registration/orientation packages | 2 |
| Newly admitted family bindings | 2 |
| Remaining HOLD | 6 |
| Ending executable family bindings | 3 |
| Family authority packages | 1 |
| Product-specific zeroing implementations | 0 |
| New universal zeroing roads | 0 |

`FAMILY LEVERAGE = 3 executable bindings / 1 family authority package = 3.0`

`ADMISSION LEVERAGE = 2 newly admitted faces / 1 reusable evidence-conformance package = 2.0`

## Marginal work per executable target

- **Speedwell DODM4 M16A2:** one primary product-to-face provenance bridge, one exact representation hash, one registration/orientation package, and one data binding. Shared geometry/procedure/mechanics/confirmation/workflow work: zero.
- **Army-issued M16A2:** one official issuer representation crop, one registration/orientation package, and one data binding. Shared geometry/procedure/mechanics/confirmation/workflow work: zero.

The marginal unit is now proof and binding, not a new target application.
