# M/FAM Scale Proof 01 — Standard M16A2/A3

Date: 2026-09-06  
Registry: `SCZN3-MFAM-FAMILY-AUTHORITY-2026-09-06` version `2026-09-06.5`  
Family: `mfam_m16a2_a3_standard_25m_300m`  
Disposition: implemented, evidence-limited

## Result

The Standard M16A2/A3 authority is now governed once as:

> `MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1`

The executable Baker standard M16A2 Target Profile no longer owns its own geometry, procedure, confirmation, or family-mechanical policy. It preserves Baker product/face identity and its exact representation/registration package, then consumes the common family authority and the existing `sczn3-governed-zeroing-road-v1` capability.

The architecture experiment passed. The multi-publisher admission experiment did not produce a second truthful binding from the preserved corpus. Every non-Baker candidate lacks one or more exact physical-conformance or representation-registration facts. No face was admitted from appearance, publisher claims, or candidate-family membership.

## Score

| Measure | Result |
|---|---:|
| Candidate physical faces | 9 |
| New family authority packages | 1 |
| Already executable faces | 1 |
| Newly executable through inheritance | 0 |
| Still `HOLD` | 8 |
| Product-specific zeroing implementations created | 0 |
| Universal zeroing roads created | 0 |
| Total executable family bindings after proof | 1 |
| **FAMILY LEVERAGE** | **1.0 executable binding / family package** |

The leverage score is deliberately not reported as 9.0. Eight candidate faces are not eight authorized faces.

## One family authority package

The family package owns only facts common to a proven Standard M16A2/A3 face:

- Letter sheet: 8.5 × 11 inches;
- uniform 18 × 20 grid;
- 0.96 cm physical square pitch;
- center crosshairs / center white dot aim reference, 9 columns and 10 rows from grid origin;
- 25-meter zero / 300-meter final setting procedure;
- `8/3`, one click clockwise past `8/3` for setup;
- M16A2 standard iron mechanical authority;
- after confirmation, one click counterclockwise back to `8/3`;
- three-shot minimum and one-inch residual confirmation authority;
- second-photo confirmation evidence requirement.

The exact machine record is `familyAuthorityPackages[MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1]` in `docs/backend/registries/mfam_family_authority.json`.

## Product-specific remainder

The Baker binding retains only the facts that cannot be inherited:

- publisher/product/face identity;
- exact Baker representation asset and hash;
- representation pixel bounds and aim coordinate;
- exact landmark/orientation registration package;
- binding to the family-permitted M16A2 equipment profile.

Backend Session Authority and the Python reference service resolve the common package through the Target Profile binding. The production JavaScript adapter consumes a generated projection of that same family record. Neither contains a Baker-specific scoring or zeroing road.

## Candidate disposition

| Face | Publisher / product | Result | Exact remaining conformance facts |
|---|---|---|---|
| `face-003` | Baker — 2-Sided 25 Meter M16A2/M4 Zeroing Target, M16A2 face | `ALREADY_EXECUTABLE` | none |
| `face-006` | Rite in the Rain — 9125 front | `HOLD` | physical pitch; aim; printed instructions; mechanics; exact representation registration |
| `face-013` | National Target — M-16A2/M4 CARBINE | `HOLD` | physical square pitch; aim; mechanical binding; exact representation registration |
| `face-016` | Qualification Targets — M16A2 | `HOLD` | physical pitch; exact landmarks; mechanical binding; exact representation registration |
| `face-018` | Alco — AR-0 | `HOLD` | physical pitch; exact representation registration; authority for its M4/M16A4 applicability claims |
| `face-020` | Speedwell — DOD M4 / M16A2 face | `HOLD` | physical pitch; aim; mechanical binding; exact representation registration |
| `face-025` | GunFun — 32110 red A | `HOLD` | physical pitch; aim; weapon-specific mechanics; exact representation registration |
| `face-027` | GunFun — 32120 green A | `HOLD` | physical pitch; effect of changed ink/wedge; aim; procedure; mechanics; exact representation registration |
| `face-032` | U.S. Army — dual target M16A2/A3 face | `HOLD` | exact production dimensions; exact production-face registration package |

The available GunFun web images are resized representations. Their pixel dimensions and DPI metadata do not prove printed square pitch, page origin, or exact production scale. The Army doctrine proves the issued family geometry, but the preserved corpus does not contain the exact flat production face needed for registration. Those are evidence gaps, not reasons to duplicate family authority.

## Runtime inheritance proof

For `baker_m16a2_25m_zero`, runtime resolution now follows:

```text
Baker product + M16A2 face identity
  → Baker exact representation / registration
    → MFAM-STANDARD-M16A2-A3-FAMILY-AUTHORITY-v1
      → governed M16A2 equipment mechanics
        → sczn3-governed-zeroing-road-v1
```

The resolved session package exposes the family package ID, family geometry, aim, measurement, procedure, mechanical authority, confirmation authority, and canonical representation. Client-supplied confirmation values cannot override the family package. The Python reference and production adapter produce byte-equivalent canonical authority results across the 58-case parity suite.

## Preserved Target Family Admission Pattern

Future Standard M16A2/A3 representations, and later Universal MOA/A8 or Standard M16A4/M4 families, use this same pattern:

1. Govern common physical geometry, aim, measurement, procedure, permitted mechanical authorities, and confirmation once in a `familyAuthorityPackage`.
2. Preserve publisher, product, exact face/side, and representation identity independently.
3. Prove physical conformance to the family; candidate membership is not proof.
4. Build an exact representation registration/orientation package.
5. Bind the Target Profile to the family package and one permitted equipment-mechanical authority.
6. Resolve all shared facts from Backend authority; do not copy them into the target frontend.
7. Enter the existing universal zeroing capability.
8. Preserve exact publisher/product/face identity with the governed family package in the session, SEC, and Ballistic Vault.

One family proof can unlock many faces only when each face supplies the remaining conformance and registration proof. The admission pattern removes repeated zeroing work; it does not remove evidence requirements.

