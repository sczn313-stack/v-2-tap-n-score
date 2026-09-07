# M/FAM Scale Proof 02 - Family Admission

Date: 2026-09-06  
Authority registry: `SCZN3-MFAM-FAMILY-AUTHORITY-2026-09-06` version `2026-09-06.6`  
Conformance registry: `SCZN3-MFAM-TARGET-FAMILY-CONFORMANCE-2026-09-06` version `2026-09-06.1`  
Contract: `MFAM-STANDARD-M16A2-A3-FAMILY-CONFORMANCE-v1`  
Disposition: implemented, batch executed, evidence-limited

## Result

SCZN3 now has one machine-enforced Target Family Conformance/Admission Pattern. It evaluates all recurring Standard M16A2/A3 admission questions once through six gates:

1. physical geometry and pitch;
2. aim reference;
3. exact representation and landmarks;
4. procedure;
5. applicable governed mechanical branch;
6. exact-face registration and orientation.

The Backend registry remains fail closed: every gate must be `PROVEN`, and a separate explicit governed Target Profile binding must exist, before a face is `ADMITTED`. Candidate family assignment cannot create execution authority.

The eight Scale Proof #1 HOLDs were run through that one contract. No new face is executable because none has a verified exact-face registration/orientation package. The process did eliminate repeated investigation: M16A2 mechanics and the family procedure are now reused wherever exact product evidence proves the M16A2 branch, and one issued-NSN evidence package clears geometry, aim, procedure, and mechanics for both the Speedwell and Army records.

## Score

| Measure | Result |
|---|---:|
| Candidates evaluated | 8 |
| Common conformance requirements | 6 |
| Reusable evidence facts established | 7 |
| Representation-specific requirement types | 2 |
| Representation-specific fact instances required | 16 |
| Newly admitted faces | 0 |
| Remaining `HOLD` | 8 |
| Total executable Standard M16A2/A3 bindings | 1 |
| Family authority packages | 1 |
| New reusable evidence/conformance packages required | 2 |
| Product-specific zeroing implementations | 0 |
| Universal zeroing roads added | 0 |
| **FAMILY LEVERAGE** | **1.0 executable binding / family package** |
| **ADMISSION LEVERAGE** | **0.0 admitted faces / new reusable package** |

The zero admission score is not rounded up. Shared facts have been cleared, but no exact representation may borrow Baker registration.

## Reusable evidence established once

The contract consumes seven reusable evidence packages:

- Standard M16A2/A3 18 x 20, 0.96 cm geometry;
- center crosshairs / white-dot aim at 9 columns and 10 rows;
- 25-meter to 300-meter procedure with governed setup/finalization;
- M16A2 standard-iron mechanical authority;
- confirmation authority;
- universal governed zeroing capability;
- issued-product identity bridge for NSN `6920-01-395-2949`, M16A2/A3 side.

The first six were already governed at the family/platform level. The seventh is the one new reusable evidence package created by this proof. It links the exact issued NSN and side identity to the Army-governed family facts without merging any publisher representation.

## Batch admission matrix

`P` = proven; `H` = unresolved / HOLD.

| Face | Product / face | Geometry / pitch | Aim | Representation / landmarks | Procedure | M16A2 mechanics | Registration / orientation | Disposition |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `face-006` | Rite in the Rain `9125`, front | H | H | H | H | P | H | HOLD |
| `face-013` | National `M-16A2/M4-CARBINE`, M16 side | H | H | P | P | P | H | HOLD |
| `face-016` | Qualification Targets `M16A2` | H | H | P | P | P | H | HOLD |
| `face-018` | Alco `AR-0`, M16A2 branch only | H | H | P | P | P | H | HOLD |
| `face-020` | Speedwell `DODM4`, DoD M16A2 side | P | P | P | P | P | H | HOLD |
| `face-025` | GunFun `32110`, red side A, M16A2 branch | H | H | P | P | P | H | HOLD |
| `face-027` | GunFun `32120`, green side A, M16A2 branch | H | H | P | P | P | H | HOLD |
| `face-032` | U.S. Army NSN `6920-01-395-2949`, M16A2/A3 side | P | P | P | P | P | H | HOLD |

## Exact irreducible missing fact per HOLD

| Face | Exact remaining fact |
|---|---|
| `face-006` | Calibrated exact front-face artifact proving 0.96 cm pitch, center aim, Standard M16A2 procedure, landmarks, and registration. |
| `face-013` | Physical 0.96 cm pitch/center-aim conformance and verified National-face registration package. |
| `face-016` | Physical 0.96 cm pitch/center-aim conformance and verified Qualification-face registration package. |
| `face-018` | Physical 0.96 cm pitch/center-aim conformance and verified Alco-face registration package. |
| `face-020` | Verified exact Speedwell M16A2-side representation registration/orientation package. |
| `face-025` | Calibrated production-scale proof of 0.96 cm pitch/center aim, then registration against the preserved red representation. |
| `face-027` | Calibrated production-scale proof of 0.96 cm pitch/center aim and wedge non-effect, then registration against the preserved green representation. |
| `face-032` | Verified flat production face for NSN `6920-01-395-2949` and tested exact-face registration/orientation package. |

Each row is one irreducible evidence acquisition, not a new zeroing implementation.

## Targeted primary-source check

No new industry sweep was performed. The smallest missing facts were checked against the existing primary sources:

- [Rite in the Rain item 9125](https://www.riteintherain.com/military-target) proves 8.5 x 11, front/back weapon assignment, item/UPC/NSN, and military-developed design. It does not dimension physical grid pitch or preserve a registration-ready flat face.
- [Qualification Targets M16A2](https://targets.net/collections/u-s-air-force/products/m16a2-paper-target) proves SKU, NSN, 8.5 x 11, and 25-meter product identity. It does not publish physical pitch.
- [Speedwell DODM4](https://www.speedwelltargets.com/DOD-M4-p/dodm4.htm) proves exact two-sided identity, M16A2 side, NSN `6920-01-395-2949`, and 8.75 x 11.5 product dimensions.
- [Army FM 3-22.9 Change 1](https://api.army.mil/e2/c/downloads/363931.pdf), Figure 5-19, proves that the same NSN has an M16A2/A3 side and governs the family geometry, center aim, procedure, and M16A2 mechanical branch. The figure is doctrine evidence, not a verified flat production artifact.
- [Alco AR-0](https://alcotarget.com/ar-zero-shooting-target/) proves the product's 8.5 x 11 dimensions, 25-meter/300-meter claim, and M16A2 applicability. It does not dimension the physical grid and describes an offset aim, so Standard M16A2 center-aim conformance remains unresolved.
- Preserved GunFun publisher images prove exact representations and printed procedures. Their web-resized pixels do not prove production pitch.

## Machine-enforced admission pattern

The reusable machinery is:

```text
Publisher/Product/Face identity
  -> select Family Conformance Contract
    -> reuse family and issued-product evidence packages
      -> evaluate all six gates
        -> HOLD with exact missing fact
        OR
        -> explicit Target Profile binding
          -> Family Authority Package
            -> Universal Governed Zeroing Road
```

Generation now refuses either unsafe state:

- a family Target Profile binding without a passing `ADMITTED` conformance record;
- an `ADMITTED` conformance record without an explicit governed Target Profile binding.

The Backend and production evaluators independently enforce the same all-gates rule. This pattern is data-driven and can be instantiated for Standard M16A4/M4, Universal MOA/A8, and later silhouette families without another road or product-specific application.

## Honest scale conclusion

Family admission is reusable machinery now. Common authority is no longer repeated per publisher. The remaining work is representation evidence: exact calibrated faces and tested registration/orientation packages. That work cannot be compressed into one cross-publisher proof because different artwork is precisely what registration must recognize and orient.

The architecture has solved the target once; the evidence corpus has not yet proven that eight other pieces of paper are exact executable members.
