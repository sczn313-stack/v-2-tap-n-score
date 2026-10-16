# Episode 67: Master #407 UGO Physical Measurement

Date: 2026-10-16

## Result

**BLOCKED — exact-face physical boundary calibration is not present in existing verified evidence.**

No target contract, geometry, scoring rule, or authority record was changed.

## Exact target and runtimes

- Master: #407
- Publisher: American Target Company
- Product: USPA/IPSC Practice, ATC-200
- Physical product size: 20 x 32 inches
- Registered asset: `authority-evidence/platform/scale-batch-1-2026-09-08/representations/american-target-58-Q100.jpg`
- Asset SHA-256: `53202446b635012c7a4f509e7bbc0fb5cef10a42aa5d1c9a531f1f763d070a52`
- Stored image resolution: 200 x 322 pixels

Affected runtime identities:

1. `american_target_58_q100_uspa_ipsc`
2. `american_target_58_q500_uspa_ipsc`
3. `american_target_58_q1000_uspa_ipsc`

The publisher evidence establishes that Q100, Q500, and Q1000 are separate package identities for the same face. It does not provide the missing physical boundary measurements.

## Existing geometry

Each runtime contains five normalized, result-affecting regions:

- `a_head`
- `b_head`
- `a_body`
- `c_body`
- `d_body`

Those coordinates are attributed to `publisher-representation-normalized-named-region-data-v1`. They are image-space representations. The contracts contain neither `physicalAuthority` nor `completeBoundaryProof`.

The active gate therefore reports for all three runtimes:

```text
required: true
status: UNPROVEN
boundaryCount: 0
probeCount: 0
error: ugo_complete_boundary_proof_required
```

## Evidence examined

### Exact ATC-200 evidence

The preserved American Target publisher page supplies:

- Product identity: USPA/IPSC Practice, ATC-200
- Overall sheet size: 20 x 32 inches
- Paper construction
- Package quantities: 100, 500, and 1,000
- A 200 x 322 JPEG representation

It does not supply:

- Physical inch coordinates for any A/B/C/D boundary
- A calibrated scan or photograph with fiducials
- A manufacturer drawing defining internal boundaries
- A source record proving that every image edge is the physical 20 x 32 target-plane edge
- Measurement uncertainty or line-width evidence
- Independent physical-to-runtime correspondence

At this resolution, naively scaling the JPEG to 20 x 32 would provide approximately 0.1 inch per pixel before JPEG and line-width uncertainty. That would still derive authority from representation pixels and is rejected.

### Other USPSA/IPSC physical authority

`USPSA_IPSC_FOUNDER_PHYSICAL_GEOMETRY_AUTHORITY.json` governs:

- Publisher: GunFun Shooting Targets, Inc.
- SKU: 22470
- Physical plane: 23 x 35 inches
- Separate registered face and UGO authority

It is not identity-equivalent to ATC-200 and was not substituted or inherited.

The Qualification Targets 23 x 35 IPSC face is likewise a different product and was not used.

## Why UGO cannot measure this face yet

UGO can translate independently calibrated physical target truth into normalized Backend geometry and can execute the complete-boundary probe gate. It cannot create physical truth from an uncalibrated, low-resolution product image.

The overall commercial size is sufficient to identify the sheet, but not sufficient to establish the five internal scoring boundaries in inches. Running probes against the current normalized polygons would only test generated geometry against itself; it would not provide independent physical correspondence.

## Exact evidence required

Any one of the following must first establish the exact ATC-200 internal geometry:

1. A manufacturer drawing or publisher specification giving the A/B/C/D boundary dimensions and positions on the 20 x 32 face.
2. A physical ATC-200 exemplar measured directly by UGO, with the target plane, origin, boundary vertices/edges, line widths, measurement method, and uncertainty recorded.
3. A calibrated full-face scan or orthogonal photograph of the exact ATC-200 with independent scale/fiducials and evidence that the complete physical sheet is represented without crop or perspective distortion.

The resulting authority record must include:

- Exact target and asset identity
- 20 x 32 inch target plane and top-left origin
- Physical-inch geometry for all five regions
- Independent physical correspondence artifact and source hashes
- `pixelIsAuthority: false`
- Complete result-affecting boundary roster
- Outer hit/miss envelopes
- Inside, edge, and outside probes for all five regions

Minimum acceptance execution: five boundaries and fifteen probes on Q100, followed by the same fifteen probes against Q500 and Q1000 after exact-face/package inheritance is verified. Every probe must reconcile through the runtime classifier.

## Decision

The required authoritative evidence does not currently exist in the repository. No measurements or proof were manufactured. All three runtime blockers remain intact.

No commit, push, or deployment was performed.
