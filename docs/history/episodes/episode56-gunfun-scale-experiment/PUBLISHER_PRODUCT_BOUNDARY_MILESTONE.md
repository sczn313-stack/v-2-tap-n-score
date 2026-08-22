# M-010 — Episode 56 Publisher Product Boundary

**Status:** Architecture boundary preserved; no implementation authorized

**Date:** 2026-08-18

**Related episode:** Episode 56 — GunFun 12-Target Scale Experiment

## Milestone

Episode 56 establishes the **Publisher Product Boundary**:

> The publisher owns the product. SCZN3 owns the governed digital relationship to that product. Shooter evidence establishes the session. SCZN3 may return only results supported by admitted authority and evidence.

The operational chain is:

```text
Publisher product
  -> governed SCZN3 target identity and authority
  -> shooter session evidence
  -> backend-governed result
  -> Universal SEC
  -> preservation and exact recall
```

This is a major architectural milestone because it makes a publisher's existing product digitally playable without requiring SCZN3 to redesign the product, invent a mission, or become the source of publisher meaning.

## Ownership boundary

| Owner | Owns | Does not establish |
|---|---|---|
| Publisher | Product identity, SKU, published dimensions, artwork, and any expressly published rules or meanings | Shooter session facts or SCZN3 result claims |
| SCZN3 target authority | Exact admitted product identity, compatible evidence/result contracts, authority provenance, and refusal behavior | Missing publisher intent, anatomy, tactics, scoring, or qualification rules |
| Shooter evidence | The captured target image and shooter-recorded observations for that session | Publisher meaning or backend classification authority |
| SCZN3 backend authority | Validation, reconciliation, authorized calculations/classifications, and explicit unavailable/not-applicable states | Unsupported inference |
| Universal SEC | Governed presentation, provenance, preservation, and recall of the admitted result | New rules, classifications, or calculations |

## Architectural consequences

1. Product registration and product execution are different decisions.
2. A useful Smart Target experience may be evidence-only. Scoring is not a prerequisite when scoring is not established or not applicable.
3. UGO may preserve image-space evidence without claiming canonical regions, physical measurements, or semantic meaning.
4. An unavailable capability is a governed result, not an implementation failure.
5. The Target Execution Contract may later standardize composition authorization, but it cannot create product legitimacy, geometry, scoring, mission, or publisher intent.
6. A controlled target-specific proof may use existing SCZN3 target authority, session authority, backend result, SEC, and preservation boundaries without claiming general catalog-scale execution support.

## E56-T08 proving case

**GunFun Vital Dude, SKU 22740** is the first proposed operational demonstration of this boundary. Current publisher authority establishes the product identity, artwork, published `23 x 35 in` dimensions, and the presence of a printed anatomical illustration. It does not establish scoring, anatomical significance, medical consequences, tactical priorities, qualification rules, penalties, shot requirements, completion rules, or a GunFun mission.

The smallest correct playable proof is therefore a governed evidence-capture experience, not a reconstructed or invented course of fire.

## Explicit non-effects

This milestone does not:

- authorize implementation of E56-T08;
- grant execution authority to any other Episode 56 target;
- change the 10-target SCZN3 baseline;
- modify GunFun artwork or publisher identity;
- authorize a Target Execution Contract implementation or redesign;
- create scoring, anatomy, medical, tactical, qualification, penalty, shot-count, or completion authority;
- authorize production changes, a commit, a push, or a deployment.

Implementation remains subject to Founder approval of the separate E56-T08 playable specification.
