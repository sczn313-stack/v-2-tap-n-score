# Episode 60 — TSTT Founder Review Pass #3

Date: 2026-09-03

Status: Implemented / verified / Founder review pending

Protected floor: Founder Review Pass #2 commit `02729226bb2f00b78b1f219971f7b3ebc977248a`; Snapshot 22 remains protected at `8146a3bbfc5bbeb52fbcf0abe8c92754998677f6`.

## Founder rule

> IF IT'S JUST BETTER, WE DO IT.

This pass applies that rule only inside the governed Equipment Library, M16A2 TSTT equipment relationship, and target/session Shooting Setup surface. It does not reopen settled architecture or activate another product.

## Package 1 — Rifle Equipment Library and M-Series

**PASS.** Before this pass, the reusable M16A2 mechanical profile already existed with `1.25 MOA` front-sight-post elevation, `0.5 MOA` rear windage, and the rear drum separated as a configuration-setting control. The shooter UI did not expose a Military M-Series family or a direct governed M16A2 discovery path.

This pass adds `Military M-Series Rifles` inside the existing Rifle Equipment Library, alphabetizes actual Rifle discovery entries with `Other` last, and exposes the currently supported M16A2, M4, and M4A1 identities. Only M16A2 + Standard Iron Sights receives the existing proven M16A2 equipment configuration and adjustment profile in this path. M4 and M4A1 remain identity-only here; no target, click, or TSTT authority is inferred from family membership.

The proved path is:

`Rifle → Military M-Series Rifles → M16A2 → 5.56 NATO → Standard Iron Sights`

It saves through the existing profile schema, persistence, active-equipment owner, and concise-name projection.

## Package 2 — exact training without an M/FAM fence

**PASS.** TSTT now distinguishes four truthful states:

- starting example, not the shooter's gear;
- exact governed equipment found, physical confirmation still required;
- exact governed equipment confirmed, exact M16A2 training available;
- other equipment selected, exact M16A2 lesson unavailable and general-zeroing authority not yet proven.

An Equipment Library record alone never turns the exact match green. The shooter must select `THIS MATCHES MY GEAR`. Exact training requires both `M16A2-STANDARD-IRON-FSP-REAR-DRUM` and `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011`.

Different equipment is not labeled `NEEDS CHANGE`. The surface states that the physical target may support general zeroing while failing closed because SCZN3 does not yet have a governed target/equipment relationship for that setup. It does not expose the M16A2-specific chapters.

The Pass #2 round trip remains one-source-of-truth: same TSTT session, same chapter, Pause/Stop preserved, active Equipment Library profile committed before return, and TSTT reread on return.

## Package 3 — Shooting Setup

**PASS.** A compact collapsible `SHOOTING SETUP` surface now belongs to the target/session experience. It does not remove or migrate Equipment Library fields.

For the exact governed M16A2 branch it projects read-only session facts:

- distance: `25`;
- distance unit: `METERS`;
- adjustment unit: `MOA`;
- applicable adjustments: `Elevation 1.25 · Windage 0.5`.

The values are kept in TSTT session storage, not written into the durable equipment profile. No correction or scoring authority moved into the frontend.

## Authority gaps

1. No governed general-zeroing target/equipment relationship is currently registered for a non-M16A2 setup on the Baker M16A2 face. General zeroing therefore fails closed; it is not claimed unavailable in principle.
2. M4 and M4A1 family admission in this selector is identity-only unless an exact configuration is separately resolved. M16A4, M7, and XM8 were inspected as candidates but withheld from this shooter menu because current repository evidence does not support automatic admission. No Baker M16A2 relationship or lesson is inferred.
3. The live firing/photo/Precision Tap/correction/confirmation/SEC/Vault road remains out of scope.

## Founder-review discoveries

1. The broad authority suite contains a pre-existing stale expected set that omits the already-registered `idpaTimedPractice` / `idpaTimeScoreResult` pair.
2. The session-authority umbrella contract contains pre-existing stale string assertions for the former `experience.status` projection and catalog-view counter. The backend session tests and HTTP contract pass; this unrelated test-contract drift was not rewritten in Episode 60 Pass #3.

## Proof

The automated phone/desktop road proves cold start, M-Series discovery, governed M16A2 save/activation, automatic origin return, explicit physical confirmation, session setup projection, all pre-fire chapters, and `READY TO FIRE YOUR FIRST GROUP`. A separate CZ/optic case proves no false M16A2 lesson and truthful fail-closed behavior.

Production and Netlify builds pass. Equipment Authority, M4 authority, Python/production parity, Equipment Library persistence/reopen/active selection, universal Equipment Library routing, PLAYER/Precision Tap boundaries, backend session authority, and Episode 60 TSTT focused gates pass when run with their required local dependencies.

## Boundary

No push, deployment, Home activation, M4/M7/XM8 TSTT, live-fire road, Precision Tap rewrite, SEC/Vault change, or new target authority was performed.
