# Mission B Empirical Registration Report — Draft 001

**Status:** Founder review evidence; not runtime authority
**Date:** 2026-08-14
**Scope:** Offline measurement only. No production registration or scoring implementation.

## Method

The governed Baker publisher asset was matched to each preserved capture using
mutual scale-invariant feature correspondences. A robust planar homography
mapped the photographed evidence plane into the registered 1141 × 1500
canonical plane.

Identity evidence was counted independently in the publisher, scoring-table,
and exterior-boundary regions. Registration was checked against 1,476 dense
samples from `printed_boundary_003`, `printed_boundary_004`, and
`printed_boundary_005`. Transform stability was measured with 100 deterministic
bootstrap homographies evaluated at nine distributed canonical probes.

This measurement harness is not production code. Its results establish the
evidence from which a first runtime tolerance may be approved.

## Corpus Results

| Fixture | Identity | RMS px | P95 px | Max px | Stability RMS px | Result under proposed gate |
|---|---:|---:|---:|---:|---:|---|
| Session #002 | PASS | 1.5043 | 2.0000 | 3.0000 | 0.0855 | PASS |
| Capture #002 — digital scale/composition | PASS | 1.6370 | 2.0000 | 3.1969 | 0.5660 | PASS |
| Capture #003 — rotation | PASS | 3.8471 | 9.0000 | 10.1969 | 2.5843 | PASS |
| Capture #004 — perspective/scale | PASS | 1.3486 | 2.0000 | 2.8000 | 1.7990 | PASS |
| Capture #005 — perspective/skew | PASS | 1.5485 | 2.8000 | 3.1969 | 2.5862 | PASS |
| Capture #006 — distance/scale/perspective | PASS | 5.7245 | 16.9845 | 17.1969 | 5.4478 | PASS — edge of validated envelope |
| Capture #007 — extreme distance | FAIL | 36.2335 | 78.9093 | 101.1969 | 543.5065 | FAIL — target evidence too small for reliable verification/registration |
| Capture #008 — insufficient geometry | INCOMPLETE | 377.6159 | 650.2822 | 689.1188 | 35.4777 | FAIL — insufficient authoritative geometry |
| Capture #009 — tight crop | PASS | 3.2429 | 5.8453 | 19.0000 | 2.4453 | PASS |
| GUNFUN negative identity | FAIL | — | — | — | — | FAIL — wrong target identity |

## Session #002 Coordinate Result

- Original photograph hash remains `a3056889916ae85ae83da3a9b7f711d60ad09e993fee0eed048e0fed7a29ec76`.
- All 16 preserved shooter-selected coordinates transformed into the governed
  canonical plane.
- Transform stability: 0.0855 px RMS, 0.1615 px P95, 0.2930 px maximum.
- Independent geometry residual: 1.5043 px RMS and 3.0000 px maximum.
- Minimum transformed-hole clearance from a decisive boundary: 10.6518 px.
- At the measured 3 px uncertainty radius, zero of 16 transformed holes are
  zone-ambiguous.
- No zone classification or score was produced during this study.

## Proposed Initial Runtime Gate

The proposed gate is the smallest envelope that accepts the empirically stable
positive cluster through Capture #006 and Capture #009 while rejecting Capture
#007, Capture #008, and the GUNFUN target.

### Identity and correspondence

- Publisher-region matches: at least 12.
- Scoring-table matches: at least 6.
- Exterior-boundary matches: at least 6.
- Robust homography inliers: at least 24.
- Homography inlier ratio: at least 0.70.

### Independent registration residual

- Combined RMS: at most 6 canonical pixels.
- Combined P95: at most 17 canonical pixels.
- Combined maximum: at most 20 canonical pixels.

### Transform stability

- Bootstrap RMS: at most 6 canonical pixels.
- Bootstrap P95: at most 7 canonical pixels.
- Bootstrap maximum: at most 50 canonical pixels.

The thresholds round outward from the weakest accepted empirical case rather
than selecting a tolerance in advance.

## Per-Impact Truth Protection

Registration PASS does not automatically make every transformed coordinate
decisive. The measured maximum residual for that photograph becomes its
registration-uncertainty radius. If a transformed bullet hole lies within that
radius of any decisive scoring boundary, Mission B must return the coordinate
as unresolved and withhold a complete score. Mission A remains unchanged.

## Explicit First-Release Boundary

Capture #007 is a correct Baker target but does not pass the proposed initial
runtime envelope. The image contains too little reliable identity and geometry
information at its captured scale. The truthful result is fail closed, not a
looser tolerance. Supporting this distance later requires separately validated
target localization or higher-resolution capture evidence.

Capture #008 may expose publisher identity, but it lacks sufficient geometry.
Registration must fail regardless of publisher recognition.

## Approval Boundary

These measurements and proposed thresholds require Founder approval before
they may become Mission B runtime authority. Mission A, SEC presentation,
persistence, and all existing preserved artifacts remain unchanged.
