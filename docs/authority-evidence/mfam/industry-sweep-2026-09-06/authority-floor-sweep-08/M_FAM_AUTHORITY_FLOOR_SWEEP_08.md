# M/FAM Authority Floor Sweep 08

Date: 2026-09-07  
Scope: all 18 physical faces held after Printer Authority Sweep 07  
Rule: **PRINTER AUTHORITY = AUTHORITY. ACCEPT YES. USE UGO. MOVE.**

## Outcome

| Disposition | Physical faces |
|---|---:|
| EXECUTABLE | 19 |
| TRUE AUTHORITY GAP | 16 |
| TOTAL | 35 |

Two faces became executable: GunFun `32110` M16A4 red reverse (`face-026`) and GunFun `32120` M16A4 green reverse (`face-028`). Both inherit one newly governed M16A4 equipment branch inside the existing Standard M16A4/M4 family and the existing universal zeroing road.

- New family packages: **0**
- New shared mechanical branches: **1**
- Product-specific zeroing implementations: **0**
- New zeroing roads: **0**
- Runtime bindings: **18 → 20** (19 physical product faces plus one protected reference)

## Shared authority solution

The existing Army authority already preserved the missing M16A4 values and procedure. Sweep 08 promotes those common facts once:

- front-sight elevation: `1.25 MOA` per click;
- rear windage: `0.5 MOA` per click;
- rear elevation drum: `0.5 MOA` per click for setup/finalization;
- setup: `6/3`, then two clicks CLOCKWISE to `Z`;
- after confirmed zero: two clicks COUNTERCLOCKWISE back to `6/3` for the 300-meter setting.

The two GunFun faces keep independent printer/product/face/representation identities. Runtime UGO proves source-photo mapping and orientation to the already-governed 14 × 16 / 1.3 cm family geometry. The binding then selects the M16A4 branch. Shared geometry never selects or substitutes mechanics.

## Permanent bureaucracy removal

`rootAuthorityGaps` is now a required Backend registry contract. It covers every non-executable physical face exactly once. Registry load fails if a held face is ungrouped, duplicated across root gaps, or a root group names an unknown face.

This permanently rejects these as standalone authority gates when Printer Authority + runtime UGO + existing family authority already cover them:

- independent re-proof of printer product/face/purpose statements;
- repeated family geometry, mechanics, procedure, or confirmation proof;
- carrier paper size, raster scale, ink, color, logo, branding, or non-operative wording archaeology;
- pre-admission demands for a second publisher artifact when runtime UGO is the actual mapping/orientation authority.

Those facts remain recorded as provenance or representation metadata. They cannot independently create a HOLD.

## Remaining root authority gaps

| Shared root gap | Faces | Exact authority still missing | Why Printer Authority + UGO cannot execute |
|---|---|---|---|
| Modern true-distance completion | `001, 009, 011, 012, 023, 034` | governed true-distance confirmation/completion for the selected equipment branch | UGO proves the 25m image mapping, not a truthfully confirmed true-distance zero |
| Unknown reverse face | `002` | printer identification of the reverse face's actual printed content/purpose | the known two-sided SKU does not identify which family the unknown side belongs to |
| Enlarged M16A2R scale | `005` | operative 23 × 35 grid scale and aim/origin UGO mapping | it is proven different from the Letter M16A2 face; identity and M16A2 mechanics alone cannot measure it |
| True-MOA / True-MIL angular UGO | `008, 010` | angular-grid UGO contract and exact active optic branch | product purpose is known, but source coordinates and equipment clicks cannot be inferred |
| Qualification course authority | `015, 030` | course geometry, scoring, procedure, and completion | these are qualification courses, not interchangeable zeroing faces |
| Generic M16 family dispatch | `022` | governed selection among M16A1, M16A2/A3, and M16A4 after UGO | generic `M16` identity does not select a mechanical generation |
| M68 configuration | `024` | exact optic/mount branch, aim/offset mapping, and registration | UGO cannot invent device/mount offsets |
| M16A1 family execution | `031` | canonical face registration and 25m/250m confirmation package | Army establishes identity/purpose/basic displacement, but the executable face and confirmation contracts are absent |
| 10m device-offset authority | `035` | complete symbols and optic/laser/mount offset branches | this is a separate boresight capability, not the 25m live-fire road |

There are **9 actual shared root authority problems**, not 16 independent projects. Six of the nine groups cover more than one face or permanently remove repeat work; the remaining single-face groups describe genuinely different executable claims.

## Validation contract

Sweep 08 adds Backend tests proving:

- all 16 held faces are covered exactly once by nine root gaps;
- both new GunFun bindings preserve face identity and use one family UGO template;
- both select the one governed M16A4 mechanical branch;
- both consume `sczn3-governed-zeroing-road-v1`;
- family counts are 9 executable faces / 0 HOLD for Standard M16A4/M4;
- global counts are 19 executable / 16 true authority gap / 35 physical faces;
- product-specific zeroing implementations and new zeroing roads remain zero.

Executed validation:

- Authority Floor Sweep 08 Backend: **6/6 PASS**;
- Equipment Authority profile resolution: **5/5 PASS**;
- Backend Session Authority: **22/22 PASS**;
- M/FAM conformance and family authority: **2 Node contracts + 6/6 Python conformance + 20/20 Python authority PASS**;
- generated Backend/browser registry parity: **PASS**;
- browser-side equipment adjustment profile selection: **PASS**;
- canonical Zeroing Platform SOP: **PASS**;
- Target Execution Scale Architecture: **PASS**;
- production build: **422 public files built**.

The image-registration parity harness could not execute in the current shell because its required OpenCV module (`cv2`) is not installed. The legacy integration contract also retains a stale assertion that a removed target-scoped authority ID must be embedded directly in the built target page; the shared registry/session authority tests above govern the current architecture. Neither limitation was bypassed or converted into a target-specific patch.

Elapsed implementation and validation time: **approximately 45 minutes**.

## Decision

The batch did not waive 18 holds. It removed a shared false gate class, solved one real authority problem once, unlocked every face that solution truthfully covered, and reduced the remainder to nine explicit root causes. The next target cannot be blocked by the same printer-identity, paper, ink, or repeated-family-fact bureaucracy because the Backend registry now rejects ungrouped face-level HOLDs.
