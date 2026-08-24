# Episode 58 — Reconciliation and Closeout Readiness

**Date:** 2026-08-24  
**Status:** Founder-approved closure evidence; preserved by Snapshot 13  
**Authority boundary:** Historical reconciliation and validation record. Episode 58 is closed; no push or deployment is authorized.

## 1. Gate 1 schema reconciliation

Founder Gate 1 approved `sczn3-equipment-knowledge-v1.1` as the reusable Equipment Library ingestion contract.

The contract preserves the smallest correct underlying model:

> **Canonical equipment graph → evidence-bearing relationships → minimum truthful shooter projection → composed saved equipment profile**

Its controlling distinctions are:

- technical `entityType` is not commercial `offeringType`;
- manufacturer identity is stable while ownership, marketing, and licensing are scoped, evidence-bearing relationships;
- individual facts and relationships carry their own provenance envelopes;
- governed `zeroDistance` and `confirmationDistance` are not transient `sessionDistance`;
- firearm, optic/sight, mount/installation, ammunition, and target/zero/confirmation relationships remain composable rather than flattened;
- `Other / I don't see mine` is a truthful shooter-declared uncertainty boundary;
- unlike catalog-depth counts are never summed into a false exact-model denominator.

The shooter projection remains:

> **equipmentType → manufacturer → searchOrSelectModel → materialUnresolvedConfigurationOnly**

## 2. Gate 2 data-only admission proof

Founder Gate 2 passed with Canik METE MC9 PRIME and the official Glock G17/G19/G45 Gen6 launch set.

- Both discovery paths entered through governed, evidence-bearing registry data.
- Existing generic Equipment Library composition supplied search/select, save, reload, exact reopen, active-profile reuse, and applicable experience consumption.
- Backend Session Authority resolved canonical identity and rejected identity tampering generically.
- No Canik-, Glock-, manufacturer-, model-, SKU-, or military-specific production routing was required.

This proves the Episode 58 scale principle:

> **New equipment inherits through governed data and reusable relationships, not product-identity production branches.**

## 3. Founder walkthrough reconciliation

The complete Founder walkthrough remains the shooter-facing authority for the candidate:

- minimum-touch equipment creation;
- search/select rather than catalog traversal;
- truthful `Other / I don't see mine` escape;
- equipment photo persistence;
- save, browser reload/re-entry, and exact reopen;
- one explicit active selection with a bright-green `ACTIVE` state;
- `LAST USED` only after an actual SEC-preserved shooting session, never from ordinary editing or selection;
- long native dropdowns remain open and usable while the shooter scrolls;
- caliber inheritance from exact firearm data;
- ammunition choices constrained by the known firearm/caliber relationship;
- truthful unknowns rather than generic click-value or distance defaults;
- session distance remains conceptually distinct from governed zero and confirmation distance;
- personal/session context remains conceptually distinct from durable equipment identity;
- technical depth remains underneath the minimum-touch interface.

The current implementation satisfies the visible flow and most persistence behavior. The durable-profile boundary exception in section 6 must be corrected before closeout.

## 4. Remaining-issue classification

| Condition | Classification | Closeout effect |
|---|---|---|
| MC9 PRIME was known but absent from the local selector | Freshness / known-but-unexposed knowledge | Resolved by Gate 2 data admission |
| Glock Gen6 launch models were newly published | Freshness | Resolved by Gate 2 data admission; dimensions remain truthfully unknown where unsupported |
| M4 front-sight `1.5` versus `1.75 MOA` | Authority conflict | Not a blocker; preserve locked runtime authority and visible conflict |
| Cross-device equipment continuity | Authority/identity gap | Not a blocker; browser persistence remains the truthful V1 boundary |
| Deeper 28-manufacturer exact-model coverage | Missing knowledge / future accumulation | Not a blocker; broad catalog expansion is explicitly deferred |
| Long-dropdown scroll behavior | Presentation behavior | Founder-walkthrough evidence accepted; targeted regression coverage may be added later |
| Bright-green `ACTIVE` treatment | Presentation | Resolved |
| Transient distance, shooter, weather, and target context persisted inside saved equipment | Ordinary implementation plus saved-profile projection/schema boundary | **Closure blocker; narrow correction required** |
| `Saved Distance` presented as an equipment-card fact | Presentation consequence of the same boundary defect | **Closure blocker with the same narrow correction** |

## 5. Try Before You Buy continuity

The Episode 57/58 bridge is preserved in [Episode 57/58 — Try Before You Buy Continuity](./EPISODE_57_58_TRY_BEFORE_YOU_BUY_CONTINUITY.md).

It is a future Founder Specification candidate, not implemented behavior:

> **Discover/choose → Try → Equipment Library → active equipment → SCZN3 experience → SEC → Ballistic Vault → returning reuse → Rate Us**

> **Add it once. Use it whenever you shoot.**

## 6. Authorized final closure correction

The Founder authorized the one narrow implementation correction identified by this reconciliation.

The current `setupPayload()` persists these transient fields inside the durable Equipment Profile: session/target distance, shooter name, unit, agency, instructor, weather, temperature, wind, and target/QR attribution. Reopening equipment therefore also reinstates context that belongs to a shooting session or person-context owner, and the equipment card displays `Saved Distance` as though it were durable equipment identity.

The correction now:

1. stores new durable Equipment Profiles as `sczn3-equipment-profile-v2` using an equipment-only allowlist;
2. strips transient session distance, target/QR attribution, shooter/organization/instructor context, and environmental facts during V1 migration while preserving legitimate equipment identity/configuration, label, photo, timestamps, and provenance;
3. leaves session-specific facts with the active matrix, Session Authority, execution, and SEC owners as applicable;
4. preserves `targetZeroRelationship` separately and displays it only when the relationship is explicitly governed and carries a complete active fact envelope;
5. removes `Saved Distance` from Equipment Library cards and uses the truthful label `Zero` only for an admitted governed relationship;
6. preserves exact reopen, active reuse, data-only admission, backend canonical reconciliation/tamper refusal, and applicable target-experience consumption.

This is not a failure of `sczn3-equipment-knowledge-v1.1`. It is a bounded mismatch between the approved knowledge model and the V1 saved-profile projection.

## 7. Future accumulation, not closure blockers

- fuller manufacturer/model/variant, optic, mount, and ammunition ingestion;
- cross-device continuity after a governed backend subject-identity owner exists;
- resolution of the M4 `1.5`/`1.75 MOA` authority conflict;
- richer compatibility and exact commercial-offering evidence;
- Try Before You Buy implementation;
- low-rating-specific Rate Us presentation refinement;
- additional automation around long native-selector interaction.

## 8. Rate Us continuity

Rate Us remains the existing voluntary first-party feedback owner. The future completion bridge should make it available after completion and later through navigation, never mandatory and never an automatic interruption.

Recommended completion language:

> **How was your SCZN3 experience?**  
> **1–5 stars**

For a low rating, offer one optional short feedback opportunity. Do not turn Rate Us into Survey and do not create another feedback backend.

## 9. Closeout readiness determination

**Recommendation: the substantive Episode 58 work is ready for Founder closure review.**

Gate 1, Gate 2, the data-inheritance scale architecture, the minimum-touch shooter flow, and the authorized durable-equipment-versus-transient-context correction pass. Broad knowledge expansion is unnecessary.

One inherited static assertion in `session_authority_contract_test.mjs` remains stale against the byte-identical baseline `target_experiences.js`: the test expects a dynamic `data-status` template while the canonical file renders the literal admitted state `data-status="available"`. This mismatch exists at `HEAD`, was not caused by Episode 58, and is not patched around by this correction. Backend Session Authority itself passes 19/19. The Founder may keep this unrelated baseline limitation out of the Episode 58 correction boundary.

The locked Shortest Correct Mental Model should be updated only as part of an approved final closeout, not silently during this correction.

## 10. Recommended next action

Founder review the final candidate. If approved, authorize the normal Episode 58 closeout sequence. Do not reopen the ingestion schema, Gate 2 admissions, catalog census, M4 authority, Episode 57, Rate Us, or universal platform architecture.
