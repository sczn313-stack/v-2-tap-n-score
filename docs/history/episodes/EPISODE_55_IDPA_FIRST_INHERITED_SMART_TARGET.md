# Episode 55 — IDPA: The First Inherited Smart Target

**Status:** ACTIVE — Founder-authorized local implementation candidate  
**Opened:** 2026-08-17  
**Starting authority:** Snapshot 6 — Post-Universality Baseline  
**Episode 54:** CLOSED — Founder Approved; not reopened or reinterpreted  
**IDPA architecture gate:** SATISFIED  
**Application implementation:** AUTHORIZED — local verification only; no commit, push, or deployment

**Integration standard:** [SCZN3 Known Target Integration Standard — KTIS](../../architecture/SCZN3_KNOWN_TARGET_INTEGRATION_STANDARD_KTIS.md). Episode 55 Draft 013 is Founder Approved for implementation under KTIS.

## Purpose

Episode 55 asks one governing question:

> **What does IDPA uniquely need to supply to SCZN3?**

The SCZN3 Platform already owns the inherited shooter experience. IDPA must supply target/profile identity, governed authority, evidence interpretation, mission rules, and adapter content only where those responsibilities are legitimately IDPA-specific.

The inheritance test remains:

> **One authoritative implementation inherited by every applicable Smart Target—not separate implementations made to look alike.**

## Starting-state audit

The repository currently contains one IDPA catalog placeholder:

- identifier: `idpa-practice-target`
- display name: `IDPA Practice Target`
- description: `Practice scoring your IDPA shooting.`
- status: `coming-soon`
- artwork: a generic catalog preview

It does **not** yet contain a registered SL-ST2 Target Profile, product/QR authority record, target geometry, evidence model, backend scoring authority, registration corpus, SEC adapter, route, or IDPA acceptance fixture. The catalog text is discovery copy; it is not authority.

### Founder correction — Publisher Authority Profile

The physical product entering Episode 55 is governed by its publisher:

> **Baker prints its current target exactly as Baker currently offers it. SCZN3 adds the QR code. Nothing else changes.**

The integration starts from:

> **Baker's existing physical product → + SCZN3 QR → governed Target Profile → inherited SCZN3 experience**

For this draft, the publisher-supplied product identity is:

- publisher: Baker Targets;
- product label: `Silhouette Target (IDPA)`;
- SKU/product reference: `SL-ST2`;
- physical artifact: Baker's existing published product, unchanged except for the added SCZN3 QR.

SCZN3 does not redesign, rename, reinterpret, or represent that product as another target. If Baker changes its published product, a new governed product/profile version is required.

### Founder-locked identity and terminology

The physical-product layer and its identity separation are approved:

- **Target Profile:** `Silhouette Target (IDPA)`
- **Partnership:** `Baker Targets`
- **Product:** `Silhouette Target (IDPA) — SL-ST2`
- **Scoring Presentation Family:** `Lowest Score Wins` — pending digital-authority approval

The following terminology rule is Founder locked:

> **SCZN3 shall not use the word “official” when describing the Baker Silhouette Target (IDPA) — SL-ST2 unless Baker uses that term in the authoritative product description relied upon by SCZN3.**

This rule applies to catalog copy, Target Profile presentation, Target Page, Results, SEC, preserved SEC, Vault, provenance summaries, marketing copy, and shooter-facing help. It does not prevent an independently governed rules source from using its own terminology within a clearly separated rules citation or authority record.

The current external rules candidate is the **2026.2 IDPA Rulebook**, adopted 1996 and amended 2026-01-10:

- <https://www.idpa.com/wp-content/uploads/2026/01/2026-IDPA-Rulebook-2.pdf>

That rulebook establishes that IDPA scoring converts performance to a time score and lowest time wins; each point down adds one second. It also distinguishes Limited and Unlimited scoring and defines threat and non-threat scoring. The repository does not yet contain a governed copy, hash, ruleset identifier, or interpretation package for this source.

The rulebook does **not** determine which Baker physical product SCZN3 begins with. It determines only which digital mission/scoring claims may truthfully be attached after QR entry. Episode 55 must not infer official-match authority from the product name, catalog copy, silhouette appearance, or IDPA reference alone.

## Proposed Target Profile identity

The Founder-supplied publisher/product identity supports the following proposed separation. Final Target Profile version still depends on the governed authority record:

| Field | Founder Review proposal | Status |
|---|---|---|
| `targetProfileId` | `idpa_silhouette_sl_st2` | Proposed stable profile identifier for the Baker SL-ST2 integration |
| `targetProfileVersion` | derived from the governed target authority record, not `1` by assumption | Required before implementation |
| `targetProfileLabel` | `Silhouette Target (IDPA)` | Founder Approved and locked |
| `missionLabel` | empty for the first single-target practice profile | Proposed; no scoring-family phrase in identity |
| `publisherIdentity` | Baker Targets | Founder Approved and locked; preserve in approved partnership surfaces |
| `productIdentity` | `Silhouette Target (IDPA)` / `SL-ST2` | Founder Approved and locked; exact source record, QR identity, and hashes still required |

The persistent display would therefore be:

> **Silhouette Target (IDPA)**

This identifies the active profile using Baker's published product identity without putting Baker into the persistent profile label. It does not claim official-match status, encode “Lowest Score Wins,” or substitute Partnership Identity for Target Profile Identity.

## Inherited-capability matrix

`INHERITED` means the platform owner already exists. `IDPA-SPECIFIC` means IDPA supplies authority or content through the inherited contract. `GAP` means the complete intended IDPA capability is not yet supported and cannot receive an IDPA-only workaround.

| Capability | Classification | Existing platform owner / IDPA obligation |
|---|---|---|
| Smart Target Workspace | INHERITED | `SCZN3SmartTargetWorkspace`; IDPA supplies workflow/content, never substitute structure |
| Persistent Target Profile Identity | INHERITED + IDPA-SPECIFIC | platform contract/presentation inherited; governed IDPA values must be registered |
| Partnership / Publisher Identity | INHERITED + IDPA-SPECIFIC | `SCZN3PartnershipIdentity`; optional governed attribution only |
| Product Identity | INHERITED + IDPA-SPECIFIC | `SCZN3ProductIdentity`; Baker `Silhouette Target (IDPA)` / `SL-ST2` is selected, while exact source record, QR identity, and hashes remain to be preserved |
| Target geometry | IDPA-SPECIFIC | governed physical geometry, zones, neckline, outer scoring area, hard-cover reductions, and version |
| Evidence requirements | IDPA-SPECIFIC | required image/target identity, bullet-hole observations, timer evidence, stage context, target type, and integrity hashes |
| Hit classification | IDPA-SPECIFIC | backend-only classification into governed target zones/statuses |
| Scoring | IDPA-SPECIFIC | backend-owned time score and reconciliation under a locked ruleset/stage package |
| Penalties | IDPA-SPECIFIC + GAP | penalty authority is IDPA-specific; automatic stage/behavior penalty adjudication is not currently supported |
| Timing | IDPA-SPECIFIC | authoritative raw-time source and precision must be declared; the platform can present but cannot invent it |
| Mission / stage rules | IDPA-SPECIFIC + GAP | written stage description, Limited/Unlimited mode, required hits, strings, threats/non-threats, and target arrays require a governed stage package not yet present |
| Scoring Presentation Family | INHERITED | `lowest-score-wins`; selected explicitly by the adapter, never inferred from copy |
| SEC adapter | INHERITED + IDPA-SPECIFIC | `SCZN3TargetAdapters` contract inherited; a new IDPA mapping is required |
| Evidence component | INHERITED + IDPA-SPECIFIC | `SCZN3SECComponents.Evidence`; IDPA supplies authoritative evidence model |
| Measurement component | INHERITED + IDPA-SPECIFIC | shared component; IDPA supplies raw time, points down, scored-hit and penalty measurements |
| Result component | INHERITED + IDPA-SPECIFIC | shared cross-family result; IDPA supplies backend final time/result package |
| Recommendation | INHERITED / OMIT | shared component exists; omit unless a future backend-authoritative recommendation exists |
| Execution | INHERITED + IDPA-SPECIFIC | shared component exists; include only if the governed stage/session execution model supplies meaningful data |
| Validation | INHERITED + IDPA-SPECIFIC | shared component; IDPA supplies count/time/penalty/result reconciliation and authority trace |
| Preservation | INHERITED | shared SEC actions and immutable preserved-artifact contract |
| Shared actions | INHERITED | `SCZN3Actions`; IDPA declares applicability only |
| Processing | INHERITED | `SCZN3Processing`; IDPA supplies truthful operation copy only |
| Navigation | INHERITED | `SCZN3Navigation`; no IDPA shell or menu |
| Responsive behavior | INHERITED | platform UI, workspace, SEC framework, and action owners |
| Save → Vault → preserved SEC reopen | INHERITED | platform persistence/preservation path; IDPA evidence/result identity must survive exactly |

## What IDPA uniquely must supply

### Target authority

1. Baker `Silhouette Target (IDPA)` / `SL-ST2` product identity, source record, and provenance.
2. Canonical artwork or measurement authority and a versioned geometry record.
3. Scoring zones and exterior scoring boundary.
4. Head/body/whole-target applicability when a mission distinguishes them.
5. Threat/non-threat identity when applicable.
6. Hard-cover or reduced-scoring-area representation when applicable.
7. Target identity verification and, for photographs, target-specific registration evidence and tolerances.

### Evidence authority

1. Original image bytes, image hashes, evidence identity, and target/product identity.
2. Shooter-selected bullet-hole coordinates and immutable coordinate-space metadata.
3. Authoritative raw time and its source.
4. Written stage authority: Limited or Unlimited, required hits, strings, target designations, and applicable penalties.
5. Any match-official determinations the software cannot truthfully derive from pixels or shooter taps.

### Result authority

The backend result package must own at least:

- ruleset identifier/version/hash;
- target geometry identifier/version/hash;
- stage/mission authority identifier/version/hash;
- evidence and session identities/hashes;
- selected scored hits and excluded extra hits with reasons;
- backend classifications and points-down values;
- misses and non-threat hits where governed;
- raw time and authoritative source;
- governed penalty entries and source/approver where required;
- points-down time, penalty time, and final time score;
- complete reconciliation and authority trace;
- an explicit unavailable/indeterminate result when any required authority is missing.

The frontend may collect observations and render this package. It may not select best hits, classify zones, apply penalties, add time, decide qualification, or reconstruct a missing result.

## Genuine platform gaps

### GAP 1 — IDPA stage authority

The current platform has target/session adapters but no governed IDPA Course-of-Fire package that represents written stage descriptions, strings, required hits per target, Limited/Unlimited scoring, threat/non-threat designations, target arrays, or match-official penalty decisions.

This gap matters because the same bullet holes can score differently depending on the written stage authority. An IDPA-only UI workaround is prohibited.

### GAP 2 — Physical-hole adjudication

Current shooter-selected point coordinates do not establish the outside diameter of a physical bullet hole, caliber, radial tear, elongated-hole status, fragment status, entry direction, or physical line touch. The current IDPA rules use physical-hole evidence for some scoring calls.

The Founder must choose the first-release claim:

- **practice coordinate model:** classify the selected coordinate and explicitly avoid claiming official match scoring; or
- **physical-hole model:** authorize and validate additional evidence/measurement capability before official-rule scoring is claimed.

Until then, boundary-sensitive or physically indeterminate observations must fail closed.

### GAP 3 — Full-stage behavioral penalties

The platform cannot infer procedural, flagrant, FTDR, disqualification, cover, engagement-order, or other behavior penalties from a target photograph. Such penalties require a governed official/user-entered decision package with provenance, or a future stage-observation system.

### GAP 4 — Product evidence registration

The physical product decision is no longer open: Baker's existing `Silhouette Target (IDPA)` / `SL-ST2` is the selected artifact and remains physically unchanged except for the SCZN3 QR. The repository still needs the governed publisher source record, original artifact evidence, product/QR identity, canonical geometry, artwork provenance, and hashes. This is registration work, not product redesign or product selection.

### Not a platform gap

The following already exist and must be inherited: workspace geometry/lifecycle, responsive behavior, SEC shell, semantic components, lowest-score-wins result presentation, actions, processing, navigation, identity separation, preservation, Vault, and reopen lifecycle.

## Proposed SEC adapter mapping

The first adapter should be registered only after the authority decisions above are closed.

| Adapter field | Proposed mapping |
|---|---|
| `adapterId` | `idpa-practice` |
| `targetProfileRef` | governed `idpa_silhouette_sl_st2` ID/version |
| session authority | backend `authoritative-session` |
| result authority | backend `idpaPracticeResult` or a Founder-approved functional package name |
| presentation family | `lowest-score-wins` |
| Result | `resultPackage.finalTime` |
| Evidence | target photograph, target identity, selected bullet holes, timer/stage evidence |
| Measurement | raw time, selected scored hits, points down, penalties, reconciliation |
| Recommendation | omitted |
| Execution | omitted for single-target score review unless governed stage execution exists |
| Validation | result/evidence/ruleset reconciliation and authority trace |
| Preservation | shared Save/Vault/reopen capabilities |

Semantic order remains:

> **Evidence → Measurement → Recommendation → Execution → Validation → Preservation**

Inapplicable Recommendation and Execution are omitted. Result remains the cross-family primary answer, not a semantic stage.

## Proposed Scoring Presentation Family

**Lowest Score Wins** is the correct existing presentation family for an authoritative IDPA time score. The 2026.2 rules describe a time score in which accuracy and penalties add time and the lowest time wins.

This selection authorizes presentation only. It does not authorize a formula in the browser and does not finalize the backend scoring contract.

## Draft 004 — Digital Authority Analysis

### Classification key

- **SUPPORTED BY EXISTING SCZN3 AUTHORITY** — an authoritative platform pattern or contract already exists and can be inherited without creating IDPA authority.
- **IDPA-SPECIFIC AUTHORITY REQUIRED** — the capability exists, but SL-ST2 requires a governed target, ruleset, mission, or result definition.
- **REQUIRES SHOOTER / RANGE INPUT** — the fact cannot be derived from the preserved target evidence alone and must be supplied with source/provenance.
- **UNRESOLVED — FOUNDER DECISION REQUIRED** — the intended product claim or authority boundary must be chosen before implementation.

### Digital-authority summary

| Requirement | Classification | Finding |
|---|---|---|
| Target/session identity and durable session | SUPPORTED BY EXISTING SCZN3 AUTHORITY | Backend admission, session identity, capability status, persistence, and fail-closed patterns exist |
| Canonical geometry and coordinate transforms | IDPA-SPECIFIC AUTHORITY REQUIRED | SCZN3 has proven target-specific geometry/registration patterns, but no SL-ST2 geometry or transform authority |
| Bullet-hole observation preservation | SUPPORTED BY EXISTING SCZN3 AUTHORITY | Image bytes/hashes, selected coordinates, marker parity, evidence identity, and immutable reopen patterns exist |
| Physical bullet-hole validity | REQUIRES SHOOTER / RANGE INPUT | Whole bullet, front entry, elongated hole, keyhole, radial tear, and physical diameter cannot be established from a selected center point alone |
| Zone classification | IDPA-SPECIFIC AUTHORITY REQUIRED | Backend classifier is required for governed SL-ST2 zones and exterior scoring boundary |
| Head/body/whole-target applicability | IDPA-SPECIFIC AUTHORITY REQUIRED | Depends on the mission/stage authority, not geometry alone |
| Threat/non-threat designation | REQUIRES SHOOTER / RANGE INPUT + IDPA-SPECIFIC AUTHORITY REQUIRED | Designation must come from the governed stage/target instance; it cannot be inferred from the blank product |
| Raw time storage and result presentation | SUPPORTED BY EXISTING SCZN3 AUTHORITY | GSSF proves raw-time intake, backend time calculation, Lowest Score Wins presentation, and preservation patterns |
| Raw time truth/source | REQUIRES SHOOTER / RANGE INPUT | A timer reading/device record must be supplied; the target photograph cannot establish elapsed time |
| Points-down calculation | IDPA-SPECIFIC AUTHORITY REQUIRED | Requires ruleset, scored-hit selection, target designation, and SL-ST2 classification |
| Required-hit / best-hit selection | IDPA-SPECIFIC AUTHORITY REQUIRED | Requires a governed Course-of-Fire definition and Limited/Unlimited mode |
| Misses caused by insufficient fired/scored hits | IDPA-SPECIFIC AUTHORITY REQUIRED + REQUIRES SHOOTER / RANGE INPUT | Requires required-hit count and trustworthy evidence that the captured set is complete |
| Hit-on-non-threat time | IDPA-SPECIFIC AUTHORITY REQUIRED | Backend can calculate only after stage designation and evidence classification are authoritative |
| Procedural, flagrant, FTDR, DQ, cover, or conduct decisions | REQUIRES SHOOTER / RANGE INPUT | These are not derivable from target evidence; they require a governed human/range decision record |
| Final time equation | IDPA-SPECIFIC AUTHORITY REQUIRED | Backend-only calculation under the locked ruleset and mission package |
| Lowest Score Wins presentation | SUPPORTED BY EXISTING SCZN3 AUTHORITY | Existing registered presentation family is sufficient once a valid backend result exists |
| SEC mapping and preservation | SUPPORTED BY EXISTING SCZN3 AUTHORITY | Adapter, SEC Framework, shared components, actions, Vault, and exact reopen already exist |
| Photo-derived match-score claim | UNRESOLVED — FOUNDER DECISION REQUIRED | Rule 4.5.2 says still photography cannot determine or appeal a match score; first-release claims must respect that boundary |
| Selected-center versus physical-hole scoring | UNRESOLVED — FOUNDER DECISION REQUIRED | The point model is adequate only for a clearly governed practice contract unless physical-hole evidence is added |
| Single-target practice versus full stage | UNRESOLVED — FOUNDER DECISION REQUIRED | The authority inputs and result meaning differ materially |

## 1. Evidence Measurement & Classification

### What SCZN3 can authoritatively measure

With a governed SL-ST2 geometry and a validated photograph-to-canonical transform, the backend can truthfully measure:

- the selected coordinate in source-image pixels;
- its transformed coordinate in canonical target space;
- transform identity, residuals, coverage, and acceptance status;
- the coordinate's geometric relationship to registered zones, boundaries, neckline, and exterior scoring area;
- distance to relevant boundaries for fail-closed ambiguity handling;
- the number of captured observations and their one-to-one relationship with visible count markers.

These are coordinate relationships. They are not proof of physical hole diameter, caliber, shot chronology, target entry direction, or stage conduct.

### Required classifications

The minimum backend classification vocabulary for a single SL-ST2 target instance is:

- `down_zero`
- `down_one`
- `down_three`
- `outside_scoring_area`
- `indeterminate_boundary`
- `invalid_physical_hole` only when a governed human/range observation supplies that fact

Mission context may additionally resolve the same geometric observation as:

- `valid_head_hit`
- `valid_body_hit`
- `wrong_required_region_miss`
- `hit_on_non_threat`
- `hard_cover_miss`
- `soft_cover_hit`

Those are not Target Geometry classifications alone. They require a stage-defined target instance and engagement requirement.

### Authority ownership

| Authority | Owns |
|---|---|
| Target Authority | SL-ST2 product identity, canonical coordinate system, zones, neckline, exterior boundary, registered target markings, geometry version/hash |
| Registration Authority | source-image identity, landmark fit, transform, residuals, coverage, acceptance/failure reason |
| Session Authority | the selected image/evidence set, captured coordinates, media/hash identity, equipment/session context, evidence completeness declaration |
| Mission/Stage Authority | required region, target instance designation, threat/non-threat, hard/soft cover, required hits, Limited/Unlimited mode |
| Backend Result Authority | per-observation classification, scored-hit selection, points down, misses, reconciliation, final result |
| Shooter/Range Authority | physical-hole validity and any stage/behavior facts not visible in the target evidence |

### Evidence that must be preserved

- original image bytes or immutable media reference plus backend SHA-256;
- image dimensions/orientation and decode identity;
- Target Profile, Product, Partnership, geometry, and QR identities/versions;
- every selected coordinate in source space;
- canonical transform, registration evidence, residuals, and transformed coordinates;
- visible marker count identifiers, explicitly non-chronological;
- stage target-instance identity and classification inputs;
- physical-hole decisions supplied by a shooter/range authority, including source and timestamp;
- backend classification output and authority trace.

### Rulebook boundary

The 2026.2 rules use physical bullet-hole evidence in scoring: outside diameter/grease-ring evidence, radial-tear treatment, elongated-hole limits, whole-bullet status, and front-entry status. Rule 4.5.2 also states that still photography cannot determine or appeal the score of a match. Therefore, a photo plus center taps can support a governed SCZN3 practice analysis, but it cannot silently become a claimed match-official scoring process.

## 2. Timing Authority

### What timing represents

For the analyzed ruleset, raw time is the shot-timer time required to complete the governed string or stage. For multiple strings, the mission package must identify each timer result and the aggregation required by that Course of Fire.

Timing is not a Target Authority property. The printed SL-ST2 target does not define or observe elapsed time.

### Ownership

- **Session Authority** preserves timer observations, source type, source/device identity where available, precision, strings, timestamps, and any manual-entry provenance.
- **Mission/Stage Authority** defines which strings/times belong to the result and how they are combined.
- **Backend Result Authority** validates the required timing observations and combines them with accuracy and allowed penalties.
- **Target Authority** contributes no elapsed-time value.

### What SCZN3 can accept, calculate, and preserve

SCZN3 can already accept and preserve a numeric raw time and can present a backend-calculated Lowest Score Wins result. For IDPA, a new authority contract must distinguish:

- manual transcription from a shot timer;
- imported/device-signed timer evidence;
- direct timer integration;
- range-official entered/certified time.

The backend may validate numeric range, precision, required strings, and aggregation. It cannot assert that a manually entered value came from a timer unless that source fact is supplied and preserved.

**Founder decision:** select the accepted first-release timing source and the shooter-facing claim attached to each source level.

## 3. Scoring & Penalties

### Rules-derived equation

Subject to a locked and governed interpretation of the 2026.2 rules, the backend stage calculation is:

> **Final Time = Raw Time + Points-Down Time + Hit-on-Non-Threat Time + Other Governed Penalty Time**

Where the reviewed rules state:

- each point down adds `1 second`;
- threat-target zones are `-0`, `-1`, `-3`, with a miss at `-5`;
- each hit on a non-threat adds `5 seconds`;
- Procedural Error adds `3 seconds` per governed infraction;
- Flagrant Penalty adds `10 seconds`;
- Failure To Do Right adds `20 seconds`;
- Disqualification is a result status, not a numeric score SCZN3 should convert into seconds.

The equation is incomplete until the stage authority defines required hits, Limited/Unlimited mode, target instances, and applicable penalties.

### Target-hit scoring versus behavioral penalties

**Potentially computed from governed target evidence plus stage authority:**

- zone points down;
- best required hits for Unlimited scoring;
- scored hits and excluded extra observations;
- misses caused by fewer captured valid hits than the required count, but only if evidence completeness is established;
- hit-on-non-threat time when the target instance is authoritatively designated non-threat;
- hard-cover/soft-cover consequences when the cover map is governed.

**Not derivable from target evidence alone:**

- procedural errors;
- extra shots fired in a Limited string unless firing count is separately authoritative;
- failure to follow a shooting action;
- cover/fault-line violations;
- flagrant penalties;
- FTDR;
- disqualification;
- incomplete-stage cause;
- reshoot or calibration decisions;
- reasonable-doubt decisions.

These require a governed shooter/range/official observation record. The backend may apply an accepted penalty value; it may not invent the infraction.

### Presentation-family verdict

**Lowest Score Wins is supported by the existing SCZN3 presentation family.**

This verdict is limited to rendering a valid backend-authoritative final time and breakdown. It does not authorize an IDPA calculation in the frontend or settle the match-versus-practice claim.

## 4. Stage / Mission Rules

The physical target alone is insufficient to produce an IDPA time score. A minimum mission authority package must define:

- `missionAuthorityId`, version, and hash;
- ruleset identifier/version/hash;
- stage category or explicitly governed practice mode;
- target-instance identity referencing the SL-ST2 Target Profile;
- threat/non-threat designation;
- required engagement region: head, body, or whole target;
- required scored-hit count;
- Limited or Unlimited scoring;
- number and identity of strings;
- authoritative timing inputs required for each string;
- hard-cover, soft-cover, or reduced-scoring-area map when applicable;
- allowed penalty observation types;
- incomplete-stage and fail-closed behavior;
- whether the result is practice analysis or a broader rules-based score claim.

No generic IDPA stage may be assumed. A different Course of Fire is a different mission authority package even when it uses the same physical SL-ST2 Target Profile.

For Unlimited scoring, the reviewed rules call for the best required hits. For Limited scoring, the stage must define the exact number of shots; extra and missing shots have consequences beyond geometric hit classification. That selection logic belongs in the backend and cannot run without stage authority.

## 5. Backend Result Package

Proposed functional package name:

`idpaTimeScoreResult`

The name describes the result without claiming that the Baker product itself is official or that every possible IDPA match rule is supported.

### Required package sections

| Section | Required contents |
|---|---|
| `identity` | authoritative session, Target Profile, Product, Partnership reference, mission/stage, ruleset, and package IDs/versions |
| `reportedEvidence` | image/media hash, captured coordinates, timer observations, target-instance facts, and governed human/range inputs |
| `registration` | source/canonical identities, transform, residuals, tolerance, coverage, decision, and transformed coordinates |
| `classifications` | one backend record per captured observation with geometric zone, mission interpretation, points down, status, and reason |
| `scoredSelection` | required-hit count, mode, selected scored observations, excluded observations, missing hits, and selection explanation |
| `timing` | each raw-time observation, source/provenance, aggregation, and validated total raw time |
| `penalties` | target-derived and human/range-supplied penalty entries kept distinct, each with rule reference, value, source, and authority |
| `calculation` | points-down subtotal, HNT subtotal, other penalty subtotal, final time, equation, precision, and Lowest Score Wins semantic |
| `validation` | count reconciliation, timing reconciliation, penalty reconciliation, evidence/hash reconciliation, and complete/unavailable status |
| `authorityTrace` | backend classification/calculation authority plus target, registration, session, mission, ruleset, and source hashes |

### Failure behavior

The package must return a truthful unavailable/indeterminate status rather than a partial numeric result when required geometry, registration, timer evidence, stage authority, evidence completeness, or human/range decisions are missing or inconsistent.

Frontend-supplied zones, points-down values, penalty seconds, hit selection, or final time must be ignored.

## 6. Preservation & Traceability

The exact preserved SEC artifact must retain enough information to reproduce and explain the result without recalculating in the Vault or browser:

- authoritative session ID and lifecycle;
- Target Profile ID/version/label;
- Baker Partnership identity in its separate governed surface;
- SL-ST2 Product and QR identities;
- target geometry ID/version/hash;
- ruleset and mission/stage IDs/versions/hashes;
- original evidence media identity/hash;
- all captured coordinates and visible marker parity;
- registration transform, residuals, and transformed coordinates;
- per-observation backend classification;
- required-hit selection and exclusions;
- raw timer observations and source/provenance;
- every target-derived and human/range-supplied penalty record;
- calculation breakdown and final result;
- validation/reconciliation package;
- result-package identity/hash and backend authority trace;
- preservation timestamp and immutable preserved-record identity.

The lifecycle requirement remains:

> **Target → Results → SEC → Save → Vault → exact reopen**

Reopen must display the preserved package. It must not rerun classification, scoring, penalty logic, or timing aggregation.

## Draft 004 digital-authority conclusion

SCZN3 already supports the infrastructure needed to collect coordinate evidence, preserve media/hashes, create durable sessions, call backend authority, present Lowest Score Wins, render inherited SEC components, preserve an immutable artifact, and reopen it exactly.

IDPA-specific authority is still required for SL-ST2 geometry, registration, zone semantics, stage/mission definition, scored-hit selection, timing evidence, ruleset interpretation, penalty application, and the final backend package.

The target photograph alone cannot truthfully establish raw time, stage requirements, threat/non-threat status, physical bullet-hole validity, behavior penalties, or match-official decisions. Those facts require separate governed authority or shooter/range input.

## Draft 005 — Exact First Baker SL-ST2 Digital Experience

### Product-source finding

Baker's published product page confirms:

- product: `Silhouette Target (IDPA)`;
- SKU: `SL-ST2`;
- available sizes: `23 x 35 inches` on standard white paper and `17.5 x 23 inches` on heavyweight paper;
- Baker describes the product for law-enforcement, competition, and qualifying use.

Source: <https://bakertargets.com/product/silhouette-target-idpa/>

The two sizes must not share an unversioned geometry assumption. The QR/product authority must either identify the physical variant or the backend must fail closed until the variant is selected from governed product data.

### Proposed first-release mission boundary

The smallest truthful first inherited experience is:

> **One Baker SL-ST2 target → one governed timed-practice mission → one complete photographed evidence set → one backend time result**

It is not a match reconstruction, match-official score, multi-target stage, classifier, qualification decision, or behavioral-penalty adjudication system.

The first mission package should be a registered **single-target timed practice** with these properties:

| Mission property | Draft 005 proposal |
|---|---|
| target instances | one Baker SL-ST2 |
| firing distance | 7 yards |
| physical target variant | Baker SL-ST2, 23 × 35 inches, standard paper |
| target designation | threat |
| required region | whole scoring silhouette |
| scoring mode | Unlimited |
| strings | one |
| raw time | one reported shot-timer value |
| scored hits | best `N` valid captured hits |
| non-threat | not applicable |
| hard/soft cover | none |
| behavioral penalties | unsupported in first release |
| incomplete-stage adjudication | unsupported; fail closed |
| result | raw time + points-down time |
| presentation | Lowest Score Wins |

`N = 2` is Founder locked by Gate 1 and must be stored in Mission Authority. It may not be inferred from how many holes the shooter taps.

### The exact shooter flow

#### 1. Enter the Target Profile

The shooter scans the SCZN3 QR attached to Baker's unchanged SL-ST2 product.

SCZN3 resolves:

- `Silhouette Target (IDPA)` Target Profile;
- Baker Partnership identity in its separate approved surface;
- `Silhouette Target (IDPA) — SL-ST2` Product identity;
- product-size/geometry variant;
- the registered first-release timed-practice Mission Authority.

If the QR cannot establish the physical size/geometry variant, the shooter must choose from the two governed Baker variants before the session starts. Free-text dimensions are not authority.

#### 2. Confirm Session Setup

The inherited session setup presents, without reconstructing authority:

- Target Profile and governed mission label;
- product-size variant;
- shooter identity when supplied;
- firearm/equipment/ammunition context when supplied;
- one required `Raw Time` field;
- raw-time source: `Manual Shot Timer Entry` for Version 1;
- the governed required scored-hit count `N` as read-only mission information.

The shooter enters the displayed shot-timer value. SCZN3 preserves it as a reported session observation. The UI must not imply device verification.

#### 3. Load Target Evidence

The shooter loads or photographs the completed SL-ST2 target.

The inherited workspace:

- waits for successful image decode;
- keeps the full target and next action discoverable;
- preserves the original evidence bytes and backend hash;
- verifies Product/Target identity;
- applies only a governed SL-ST2 registration contract;
- fails closed when identity, geometry variant, registration, or required landmarks cannot be established.

#### 4. Mark Bullet Holes

The shooter taps every bullet hole intended to belong to the timed practice string.

SCZN3:

- records exact source-image coordinate centers;
- shows numbered count identifiers `1…M` for confidence;
- preserves marker centers without claiming chronology;
- permits Undo and Clear through inherited actions;
- requires the shooter to affirm `All bullet holes for this string are marked` before scoring.

This affirmation is a reported completeness input. It is not independently proven by the photograph.

#### 5. Show Results

The shooter selects **SHOW RESULTS** once.

The inherited processing system immediately acknowledges the request and prevents duplicates while the backend:

1. validates session, Target Profile, Product, geometry variant, mission, evidence, and raw-time authority;
2. verifies image identity/registration;
3. transforms every captured coordinate;
4. classifies every unambiguous coordinate as `down_zero`, `down_one`, `down_three`, or `outside_scoring_area`;
5. rejects an unresolved boundary rather than guessing;
6. selects the best `N` valid hits under the governed Unlimited mission;
7. records extra captured hits as excluded observations with reasons;
8. fails closed when fewer than `N` valid scored hits exist because the first release does not adjudicate the additional procedural consequence of an under-fired string;
9. calculates points-down time;
10. adds the reported raw time;
11. returns `idpaTimeScoreResult` with complete reconciliation and authority trace.

There is no separate intermediate Results page. The authoritative result opens directly in the inherited SEC.

#### 6. Review the SEC

The SEC is the Results experience.

The initial Target section is open and Session is closed. Exactly one section is open at a time.

#### 7. Preserve and revisit

The shooter selects **SAVE SEC**. Preservation succeeds without navigating away. The button confirms preservation, and **VIEW HISTORY** opens the Ballistic Vault.

The Vault displays the preserved target evidence and authoritative result summary. Reopening loads the exact artifact, with Target open and Session closed, without recalculation.

### What the shooter supplies

Required in Version 1:

- the completed target photograph;
- all bullet-hole center selections belonging to the string;
- affirmation that the captured set is complete;
- raw time transcribed from the shot timer;
- selection of the governed physical-size variant only when QR identity does not encode it.

Optional session context:

- shooter identity;
- firearm/equipment profile;
- ammunition details;
- notes.

The shooter does **not** supply zones, points down, scored-hit selection, penalty seconds, or final time.

### What SCZN3 observes and preserves

- QR/product/profile/mission resolution;
- image bytes, dimensions, orientation, and hash;
- exact tapped coordinate centers;
- marker-count parity;
- raw-time value and declared source type;
- evidence-completeness affirmation;
- session/equipment context;
- processing, backend request, result, preservation, and reopen identities.

### What requires range/adjudicated input

Version 1 intentionally does not accept or calculate behavioral penalties. It also does not adjudicate:

- physical line touch or bullet-hole diameter;
- elongated/keyhole/fragment/front-entry status;
- hard/soft cover;
- non-threat designation;
- procedural or conduct penalties;
- reshoot, calibration, reasonable doubt, DNF, DQ, or qualification status.

If any such condition affects the intended result, the shooter must not receive a complete numeric Version 1 result. A future governed range/adjudication input contract is required.

### What the backend computes

For the proposed Version 1 mission only:

> **Final Time = Reported Raw Time + Points-Down Time**

Where:

- `down_zero = 0 seconds`;
- `down_one = 1 second`;
- `down_three = 3 seconds`;
- a captured `outside_scoring_area` observation = `5 seconds`;
- the backend selects the best governed `N` hits;
- extra captured hits are preserved but contribute no time under the proposed Unlimited mission;
- fewer than `N` valid captured hits withholds the complete Version 1 result pending adjudication;
- `indeterminate_boundary` withholds the complete result.

This is a constrained instance of the broader Draft 004 equation. Hit-on-non-threat and other penalty time are zero because the first mission does not authorize those conditions—not because the frontend assumes zero.

### Exact Results / SEC presentation

#### Primary Result

```text
FINAL TIME
18.42 SECONDS
LOWEST TIME WINS
```

The number is illustrative layout copy only; no fixture value is authorized by this specification.

#### Target Evidence

- complete preserved SL-ST2 photograph;
- visible numbered bullet-hole markers;
- captured-count reconciliation;
- Target Profile identity;
- optional Baker attribution in its separate approved surface.

No engineering trace, hashes, or coordinate tables appear in the primary evidence view.

#### Performance Breakdown

```text
RAW TIME              14.42 sec
DOWN ZERO     1 × 0 =  0.00 sec
DOWN ONE      1 × 1 =  1.00 sec
DOWN THREE    1 × 3 =  3.00 sec
MISSES        0 × 5 =  0.00 sec
POINTS-DOWN TIME       4.00 sec
FINAL TIME            18.42 sec
```

Counts and values render only from the backend package. The frontend performs no multiplication or addition.

#### Scored-hit explanation

The SEC states naturally:

> **Your best N hits were scored for this timed practice.**

When extra observations exist:

> **M bullet holes were captured. The best N were scored.**

`N` and `M` are rendered from preserved authority/evidence, not copy templates that imply fixed values.

#### Session section

The inherited Session section contains:

- mission name and required-hit count;
- raw time and source label;
- product-size variant;
- shooter/date/time;
- equipment/ammunition when present;
- current-session evidence reconciliation;
- no Session 2 metric until separately specified for IDPA.

#### Validation action

Validation contains:

- Target/Profile/Product/Mission authority identities;
- image/evidence/result hashes;
- registration transform and residuals;
- source and canonical coordinates;
- per-observation classification;
- selected/excluded/missing-hit reconciliation;
- raw-time provenance;
- calculation trace;
- backend authority trace.

### Failure and retry behavior

No numeric result is shown when any required authority is missing or inconsistent. The shooter remains in a usable workspace with evidence intact and a truthful reason, including:

- `product_variant_required`
- `target_identity_mismatch`
- `registration_required`
- `registration_rejected`
- `raw_time_required`
- `mission_authority_missing`
- `evidence_completeness_required`
- `insufficient_valid_hits`
- `indeterminate_boundary`
- `adjudication_required`

Retry never clears the photograph or bullet-hole coordinates and never changes workspace geometry.

### Inherited versus new implementation

#### Inherited unchanged

- Target Page shell and contained viewport;
- profile/partnership/product identity presentation;
- photograph decode/reveal lifecycle;
- evidence interaction frame;
- processing and duplicate prevention;
- SEC shell and semantic components;
- Lowest Score Wins Result component;
- actions, navigation, responsive behavior;
- Save, Vault, exact preserved reopen.

#### IDPA-specific implementation required

- SL-ST2 variant/product/geometry authority;
- QR/profile/mission registrations;
- photograph registration contract and fixtures;
- timed-practice Mission Authority including `N`;
- backend coordinate classification;
- Unlimited best-hit selection;
- raw-time plus points-down calculation;
- `idpaTimeScoreResult` package;
- IDPA adapter content mapping;
- IDPA fail-first and end-to-end fixtures.

No new Target Page, SEC shell, processing system, action bar, navigation, responsive system, or Vault architecture is required.

### Authority-gate status before implementation approval

1. **Required scored hits (`N`) and mission distance** — **RESOLVED:** `N = 2`; `7 yards`; `Timed Pair — 7 Yards`.
2. **Physical variant scope** — **RESOLVED:** Baker SL-ST2, 23 × 35 inches, standard paper. The 17.5 × 23-inch heavyweight variant requires a separate future geometry identity.
3. **Coordinate-center contract** — **RESOLVED:** Gate 3 Founder Approved; selected-center practice classification through UGO with fail-closed boundary handling.
4. **Timing claim** — **RESOLVED:** manual shot-timer transcription is reported Session Evidence for Version 1; it is not device-verified time.
5. **Evidence completeness** — **RESOLVED:** shooter affirmation gates backend completeness validation; insufficient determinate hits fail closed.
6. **Rules source** — **RESOLVED:** preserve and hash the 2026.2 rulebook as the digital mission/scoring source, separately from the Baker product source.
7. **Result claim** — **RESOLVED:** `Timed Practice Result`; match, classifier, qualification, official, or match-official score claims are prohibited in Version 1.

These are authority decisions, not missing platform UI architecture.

## Draft 007 — Gate 1: Founder-Locked Timed-Practice Mission

### Authority statement

Neither Baker's SL-ST2 product description nor the general 2026.2 rules source establishes one default Course of Fire for this QR experience.

The first mission must therefore be explicitly owned by SCZN3 as a governed practice mission. It must not be attributed to Baker or represented as a match stage, classifier, qualification, or externally authored drill.

### Proposed mission identity

| Field | Proposal |
|---|---|
| `missionAuthorityId` | `SCZN3_SL_ST2_TIMED_PAIR_7YD_V1` |
| mission label | `Timed Pair — 7 Yards` |
| shooter-facing profile line | `Silhouette Target (IDPA) • Timed Pair — 7 Yards` |
| mission type | single-target timed practice |
| author | SCZN3 |
| result claim | `Timed Practice Result` |
| scoring presentation | Lowest Score Wins |

### Proposed Course of Fire

> **From a range-approved low-ready position, begin on the shot-timer signal and engage one Baker SL-ST2 at 7 yards with at least two rounds. The string ends on the final shot. SCZN3 scores the best two valid captured hits and combines their points-down time with the reported raw time.**

### Locked-by-mission constants proposed for Founder approval

| Property | Governed value |
|---|---|
| physical targets | one |
| firing distance | **7 yards** |
| target designation | threat |
| required scoring region | whole scoring silhouette |
| strings | one |
| start position | range-approved low ready |
| start event | shot-timer signal |
| end event | final shot in the string |
| scoring mode | Unlimited |
| required scored-hit count | **`N = 2`** |
| minimum rounds fired | two |
| additional rounds | permitted; preserved; best two valid hits scored |
| raw time | shot-timer value from start signal through final shot |
| cover | none |
| movement | none required |
| reload | none required |
| concealment | none required |
| non-threat | none |
| behavioral penalties | unsupported |
| incomplete/under-fired string | no complete result; `adjudication_required` |
| physical-hole dispute | no complete result; `adjudication_required` |

### Why `N = 2` at 7 yards

`N = 2` creates the smallest timed string that measures both speed and more than one accuracy observation. It also exercises Unlimited best-hit selection when the shooter fires additional rounds. The fixed 7-yard distance makes repeated results comparable without representing the drill as an IDPA match stage.

This is an SCZN3 product decision for this practice mission. It is not inferred from the target artwork, Baker's product description, the number of captured holes, or a generic claim about IDPA stages.

### Shooter instructions

Before shooting:

```text
TIMED PAIR
Start from a range-approved low-ready position.
At 7 yards, engage the target with at least two rounds on the timer signal.
Lowest time wins after accuracy is added.
```

During evidence capture:

```text
Enter the raw time from your shot timer.
Mark every bullet hole from this string.
```

Before Show Results:

```text
Confirm all bullet holes from this string are marked.
Your best two valid hits will be scored.
```

### Backend mission effect

The mission package authorizes the backend to:

1. require one raw-time observation;
2. require one complete evidence set for one target;
3. require at least two valid captured observations;
4. select the two lowest points-down classifications;
5. preserve every additional captured observation as excluded from scoring;
6. calculate points-down time for the selected pair;
7. add points-down time to raw time;
8. return a Lowest Score Wins `Timed Practice Result`.

The mission package does not authorize the backend to infer shooter position, safe firearm handling, physical-hole validity, stage conduct, behavioral penalties, or match status.

### Comparability contract

Results belong to the same longitudinal metric only when all of the following match:

- `missionAuthorityId` and version;
- Target Profile ID/version;
- physical geometry variant;
- fixed firing distance of 7 yards;
- scoring ruleset/interpretation version;
- raw-time source classification;
- required scored-hit count;
- scoring mode.

A later holster-start, different distance, different `N`, Limited-scoring, movement, reload, or multi-target mission is a different Mission Authority and must not silently share the same Session 2 timeline.

### Gate 1 Founder lock

Founder Approved and locked:

1. mission identity `SCZN3_SL_ST2_TIMED_PAIR_7YD_V1`;
2. shooter label `Timed Pair — 7 Yards`;
3. the Course of Fire above;
4. **`N = 2`**;
5. fixed firing distance of **7 yards**;
6. Unlimited best-two scoring;
7. the `Timed Practice Result` claim.

Gate 1 is closed. A different distance, hit count, start condition, scoring mode, or Course of Fire requires a different Mission Authority identity/version.

This lock authorizes mission specification only. No geometry, evidence, timing, backend, adapter, Target Page, or SEC implementation is authorized.

## Draft 008 — Gate 2: Initial SL-ST2 Geometry Authority

Founder Approved and locked:

> **Initial SL-ST2 Geometry Authority — Baker Silhouette Target (IDPA), 23 × 35 Standard Paper**

### Governed physical scope

| Property | Locked value |
|---|---|
| publisher | Baker Targets |
| product | Silhouette Target (IDPA) |
| SKU | SL-ST2 |
| physical size | 23 × 35 inches |
| substrate | standard paper |
| QR treatment | SCZN3 QR added; Baker's existing printed product otherwise unchanged |
| proposed geometry authority ID | `BAKER_SL_ST2_23X35_GEOMETRY_V1` |
| geometry status | authority evidence and exact geometry still to be established |

### Variant boundary

The Baker 17.5 × 23-inch heavyweight-paper SL-ST2 is a separate future physical geometry identity.

SCZN3 shall not:

- derive it by scaling the 23 × 35 profile;
- reuse the 23 × 35 geometry hash;
- treat its QR/product variant as interchangeable;
- accept it through a dimension-tolerance workaround;
- silently score it under the 23 × 35 authority.

Supporting the smaller heavyweight variant requires its own source artifact, measurements, canonical asset, geometry record, hashes, registration fixtures/tolerances, validation, and authority version.

### Admission and failure behavior

For Version 1, the QR and Target Profile admission must resolve the 23 × 35 standard-paper variant. Evidence identified as the 17.5 × 23-inch heavyweight variant, an unknown variant, or a mismatched artifact fails closed before classification.

Expected refusal states include:

- `product_variant_required`
- `product_variant_mismatch`
- `geometry_authority_unavailable`
- `target_identity_mismatch`

### Gate 2 lock effect

Gate 2 supplies one physical reality for the next authority work:

> **Baker's actual 23 × 35 product → establish its geometry → classify selected coordinates against that geometry → backend authority**

It does not approve or manufacture the geometry itself. Canonical measurements, printed boundaries, source-artifact identity, and registration validation remain required.

### Next gate

**Gate 3 — Coordinate and geometry-classification contract:** establish exactly what printed SL-ST2 boundaries exist on the 23 × 35 product, how the canonical coordinate plane is derived, how a shooter-selected coordinate is classified, and when boundary uncertainty must fail closed.

## Draft 010 — Gate 3: UGO Coordinate and Geometry-Classification Contract

**Status:** Founder Approved through the Draft 012 Publisher Authority correction. This section establishes the UGO/coordinate authority contract; its artifacts are produced during implementation under Draft 013.

### Founder-locked governing mechanism

> **Physical SL-ST2 → UGO registration → canonical target-space inches → shooter-selected coordinate → backend classification**

In compact form:

> **Reality → UGO → coordinate → backend classification**

The image is evidence of the target, not the target itself. **UGO is the governed bridge back to authoritative target space.** The 23 × 35-inch Baker SL-ST2 physical product is the geometry authority; the photographed image may neither replace that authority nor manufacture geometry from appearance.

For Version 1, SCZN3 classifies the **shooter-selected center coordinate** of each captured bullet hole against governed Baker SL-ST2 geometry. It does not claim that computer vision found the physical bullet-hole edge, measured caliber, or independently adjudicated a physical line touch.

### 1. Authoritative geometry contract

The Target Authority must register the exact printed scoring-region boundaries of Baker's 23 × 35-inch standard-paper SL-ST2 from defensible source evidence. A screen image, catalog thumbnail, visual tracing, assumed IDPA proportions, or scaling from another target or SL-ST2 variant is insufficient.

Acceptable authority evidence must be one or more of:

1. publisher-supplied production artwork/vector geometry with preserved provenance and hash;
2. publisher-verified dimensioned drawing or measurements;
3. controlled physical metrology of the exact 23 × 35 product, preserved with method, uncertainty, artifact identity, and independent verification.

The resulting versioned geometry record must declare:

- geometry authority ID/version/hash;
- physical width and height in inches;
- canonical origin, axes, orientation, and unit;
- exact paths/polygons for every governed scoring region;
- the exterior scoring boundary;
- any head/body separator or other printed boundary used by the Timed Pair mission;
- region precedence and containment rules;
- numerical precision and boundary uncertainty policy;
- source-evidence references and provenance.

The intended classification vocabulary is `down_zero`, `down_one`, `down_three`, `outside`, and `indeterminate_boundary`, but no region path or points-down assignment becomes authoritative until the source geometry and selected rules authority are preserved and reconciled.

### 2. UGO registration and coordinate contract

The frontend records evidence; it does not classify it. Each observation sent to the backend must preserve at least:

- evidence/image identity and backend-verifiable image hash;
- decoded image width, height, orientation, and coordinate-space version;
- the shooter-selected bullet-hole center in that immutable image space;
- Target Profile, Product, physical variant, mission, and session identities;
- the backend-governed UGO registration/transform reference when the evidence is a real photograph.

Shooter taps originate in immutable image space. Before any scoring classification, UGO must register the photographed target back to the governed 23 × 35 physical geometry and resolve each selected image-space center into the canonical target plane in **inches**:

> **One inch is one inch.**

Display scaling, CSS pixels, device-pixel ratio, cropping, rotation, perspective, or image resizing may not change the physical meaning of the selected coordinate. Once properly registered, the same physical evidence must preserve the same authoritative coordinate relationship across those presentation/capture differences.

UGO must own and preserve:

- the governed physical target-space definition;
- the observable target landmarks used for registration;
- the image-to-canonical transform and its identity/version/hash;
- the registration method and empirical validation basis;
- residual/error measurements and target-plane coverage;
- registration uncertainty at each resolved coordinate;
- the original image-space point and canonical-inch result.

No visual scaling assumption, proportional inference, target-size guess, or “looks close enough” decision is permitted. The backend must reject classification if evidence identity, UGO registration authority, physical variant, registration quality, uncertainty, landmark coverage, or coordinate bounds cannot be reconciled.

The authoritative observation trace must preserve both the original selected image coordinate and the transformed canonical coordinate; neither replaces the other.

### 3. Boundary rule

Version 1 makes a point-classification claim, not a physical-hole line-touch claim.

- A transformed selected center demonstrably inside one governed region receives that region's backend classification and points-down value.
- A transformed selected center demonstrably outside the exterior scoring boundary receives `outside`; its downstream mission treatment must come from the approved scoring contract.
- A UGO-resolved selected center on a registered scoring boundary, or close enough that carried-forward UGO registration uncertainty prevents a defensible interior decision, receives `indeterminate_boundary`.
- `indeterminate_boundary` withholds a complete score. The frontend may not break the tie visually, choose the more favorable zone, or reinterpret the coordinate.

This conservative rule remains in force unless a later Founder-approved authority explicitly establishes a different deterministic point-boundary policy. A physical bullet hole touching a printed line is a separate evidence/adjudication problem and is not inferred from the selected center.

### 4. Backend ownership and result trace

The frontend may submit the preserved selected-center observation. It may not submit an authoritative zone, points-down value, boundary decision, or scored-hit selection.

For every observation, the backend must return a traceable classification record containing at least:

- observation/evidence identity;
- original image-space selected center;
- UGO registration/transform authority ID/version/hash;
- canonical physical coordinate in inches;
- geometry authority ID/version/hash;
- classified region or fail-closed status;
- points-down value only when governed and determinate;
- boundary distance/uncertainty information sufficient to explain the decision;
- rules/mission authority references;
- decision reason and reconciliation status.

Frontend-supplied classification or value claims must be ignored. Incomplete, mismatched, out-of-bounds, or unregistered authority must return an explicit unavailable/refusal result rather than a plausible classification.

### Explicit claim boundary

Gate 3 authorizes this prospective claim only:

> **SCZN3 can classify a shooter-selected bullet-hole center after that coordinate has been validly registered into governed Baker SL-ST2 physical geometry.**

It does not authorize these claims:

- autonomous bullet-hole detection;
- physical bullet-hole edge or caliber measurement;
- grease-ring, radial-tear, elongated-hole, fragment, or front-entry adjudication;
- match-official line-touch adjudication;
- independent reconstruction of an IDPA match score from a photograph.

### Fail-first acceptance required before implementation

1. Reject geometry derived from a catalog image, assumed scaling, or the 17.5 × 23 variant.
2. Prove canonical-inch classification for unambiguous interior fixtures in every registered scoring region.
3. Prove image resize, display scale, rotation, crop, and perspective do not change the authoritative physical-coordinate relationship when UGO registration is valid.
4. Reject mismatched image, product variant, Target Profile, geometry, transform, or mission identities.
5. Return `indeterminate_boundary` for exact-boundary and uncertainty-band fixtures and withhold the complete score.
6. Preserve the original and canonical coordinates plus all authority hashes through Results, SEC, Save, Vault, and exact reopen.
7. Ignore/tamper-suppress frontend zone and points-down claims.
8. Prove the backend is the only classifier and that the frontend only renders its returned package.

### Evidence still required to close Gate 3

Gate 3 cannot be Founder locked as operational authority until Cody returns:

1. the exact 23 × 35 Baker geometry source and provenance;
2. the measured/derived canonical boundaries and geometry hash;
3. the rule-authority mapping from each registered region to its points-down value;
4. the proposed UGO registration method and empirical uncertainty basis for real photographs;
5. boundary fixtures demonstrating the fail-closed policy;
6. a visual overlay showing the registered geometry against the preserved source artifact.

No geometry approximation or classification implementation is authorized by Draft 010 or Draft 011.

## Draft 011 — Gate 3 Representation Evidence and Physical Metrology Plan

### Preserved representation evidence

The Founder-supplied Baker SL-ST2 JPEG is preserved byte-for-byte as:

- image: `authority-evidence/baker-sl-st2/BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.jpeg`
- manifest: `authority-evidence/baker-sl-st2/BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.json`
- SHA-256: `9fb11d843c09336bce46e93a7c163eb9f8653e439ad0f4950d419d75d7faf5e9`
- bytes: `100700`
- decoded dimensions: `1074 × 1393`

The original was not redrawn, resampled, or measured for physical dimensions.

### Observable structure—not dimensional authority

The representation visibly supports a future UGO observation plan for:

- separate head and torso geometry;
- a printed `0` region in the head;
- a printed `0` region in the torso;
- surrounding `-1` regions;
- an outer-body `-3` region;
- distinct printed boundaries between those regions;
- Baker and `SL-ST2` identity markings;
- printed scoring/reference material.

These are visual observations only. The JPEG establishes relative appearance, not physical inches, boundary dimensions, manufacturing tolerances, or scoring-line ownership.

### Gate 3 physical metrology checklist

Measurements must be taken from an actual Baker **23 × 35-inch standard-paper SL-ST2**, with the artifact identity, measuring method, instrument resolution, operator, date, and uncertainty preserved. Where feasible, repeat measurements on more than one production copy to expose print/trim variation.

#### A. Artifact and sheet frame

1. Confirm finished sheet width and height at multiple edge locations.
2. Record squareness, trim variation, and any measurable paper distortion.
3. Establish a canonical physical datum, proposed as sheet upper-left with `+x` right, `+y` down, units in inches.
4. Record the physical target centerline and its relationship to the sheet frame.
5. Identify the exact product/revision/print evidence tying the measured sheet to Baker `SL-ST2` 23 × 35 standard paper.

#### B. Exterior target geometry

1. Measure every vertex and segment of the exterior silhouette in canonical inches.
2. Measure the head rectangle, neck junction, shoulder breaks, side segments, lower tapers, and bottom segment.
3. Resolve the visible double-line treatment: identify which line is the scoring boundary, which is non-scoring/reference/print structure, and the physical separation between them.
4. Measure line widths and record whether governed boundaries use a line center, inner edge, outer edge, or another publisher/rules-authorized definition.

#### C. Scoring-region geometry

1. Head `0`: center coordinate, diameter/radius, circularity, and line width.
2. Head `-1`: exact containment boundary and relationship to the head exterior and neck/base line.
3. Torso `0`: center coordinate, diameter/radius, circularity, and line width.
4. Torso `-1`: every polygon vertex/segment, symmetry, and relationship to the torso `0` circle.
5. Torso `-3`: exact containment between the governed torso `-1` boundary and governed exterior scoring boundary.
6. Measure and define the head/torso separator and determine whether it changes classification for the Timed Pair mission.
7. Record any gaps, overlaps, intersections, or printed discontinuities that could make a canonical classification ambiguous.

#### D. UGO registration landmarks

1. Select distributed landmarks across head, shoulders, torso, and lower body—not a single local cluster.
2. Include stable intersections/vertices from the exterior silhouette and interior region boundaries.
3. Identify independent validation landmarks that are not used to fit the transform.
4. Measure each landmark in canonical physical inches with uncertainty.
5. Evaluate whether Baker/SL-ST2 identity marks and the scoring table are stable enough for identity evidence or bootstrap assistance; do not treat typography as scoring geometry.
6. Reserve QR placement so it does not obscure required identity, fit, validation, or scoring landmarks.

#### E. Uncertainty and manufacturing evidence

1. Record instrument precision and repeated-measurement spread for each feature class.
2. Quantify paper flatness/stretch and print/trim variation relevant to the canonical model.
3. Separate source-geometry uncertainty, physical-production uncertainty, photo-registration uncertainty, and numerical-transform uncertainty.
4. Define how those uncertainties combine at a resolved bullet-hole center.
5. Preserve uncertainty per feature and carry the applicable resolved uncertainty into backend boundary classification.

### Required metrology deliverable

The measurement pass must return:

1. an immutable physical-artifact record and photographs;
2. a dimensioned measurement table in canonical inches;
3. a versioned UGO observation containing scoring boundaries and registration landmarks;
4. source, artifact, measurement, and UGO hashes;
5. an overlay of the governed UGO geometry on the preserved representation and on the measured physical artifact;
6. independent-landmark residuals and uncertainty accounting;
7. an explicit list of any unresolved feature or boundary;
8. a recommendation to accept, refine, or reject the geometry authority.

Until that deliverable is Founder-approved, the preserved JPEG remains evidence only and no SL-ST2 coordinate may receive an authoritative backend classification.

### Authority chain preserved

> **Actual Baker target = physical truth**  
> **Preserved JPEG = representation/evidence**  
> **Controlled measurements = dimensional authority**  
> **UGO = bridge between representation and physical truth**  
> **Backend = classification authority**

## Draft 012 — Gate 3 Publisher Authority Correction and Minimum UGO Contract

### Founder-locked printer authority rule

> **Printer-published dimensions are the physical target authority for SCZN3 integration. SCZN3 accepts those dimensions as published, uses UGO to map the target representation into governed target space, and moves forward.**

For Baker SL-ST2:

> **Baker prints it → Baker's published dimensions define it → UGO registers it → backend classifies selected coordinates.**

The selected product remains Baker `Silhouette Target (IDPA)` / `SL-ST2`, **23 × 35 inches, standard paper**. SCZN3 does not independently certify Baker's manufacturing or printing tolerances, require laboratory metrology, redesign the target, or rescale another product variant.

Draft 012 supersedes Draft 011 only where Draft 011 required independent physical metrology to establish the published sheet dimensions or printed geometry. The preserved JPEG, its manifest/hash, its non-dimensional evidence status, the UGO ownership boundary, the selected-center claim boundary, and backend-only classification remain in force.

### Minimum sufficient authority inputs

Gate 3 may proceed from these governed inputs:

1. Baker's authoritative product/source record identifying `Silhouette Target (IDPA)`, SKU `SL-ST2`, and the **23 × 35-inch standard-paper** variant.
2. The exact publisher-supplied target representation preserved as `BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.jpeg` with SHA-256 `9fb11d843c09336bce46e93a7c163eb9f8653e439ad0f4950d419d75d7faf5e9`.
3. The selected rules/mission authority mapping the representation's governed `0`, `-1`, `-3`, and outside regions to the Timed Pair mission's points-down semantics.
4. A versioned UGO observation that binds those exact authority sources without inventing physical dimensions beyond Baker's published 23 × 35 product definition.

If the preserved representation cannot be verified as the publisher-supplied representation of that exact product/variant, UGO registration must stop with `target_representation_authority_mismatch` rather than infer equivalence.

### Canonical target-space contract

UGO shall establish a canonical physical target plane with:

- coordinate-system ID proposed as `UGO_BAKER_SL_ST2_23X35_TARGET_PLANE_V1`;
- origin at the governed upper-left sheet corner;
- `+x` to the right and `+y` downward;
- canonical unit of inches;
- governed sheet extent of `0 ≤ x ≤ 23` and `0 ≤ y ≤ 35`;
- explicit orientation and representation-to-target transform identity/version/hash.

The representation's sheet boundary—not the JPEG canvas edge—is fitted to that published 23 × 35 plane. UGO must preserve the pixel-space sheet-corner observations and the transform used. It may not assume that the JPEG bounds equal the physical sheet bounds.

### Minimum UGO geometry observation

UGO shall recover and version only the observable geometry required by the Timed Pair classification contract:

1. sheet boundary and orientation;
2. exterior governed scoring boundary;
3. head/torso junction or separator when it affects containment;
4. head `0` boundary;
5. torso `0` boundary;
6. governed `-1` containment boundary/boundaries;
7. governed `-3` containment between the `-1` boundary and exterior scoring boundary;
8. stable, distributed registration landmarks sufficient to recover this geometry from shooter photographs;
9. independent validation landmarks not used to fit the transform.

UGO must distinguish scoring boundaries from decorative, duplicate, cut, or reference lines. A line whose scoring role cannot be established from the publisher representation plus selected rules/mission authority remains unresolved and cannot silently become classification geometry.

### Geometry extraction discipline

The UGO observation may derive canonical geometry by mapping the verified publisher representation into the published 23 × 35 target plane. It must preserve:

- the source pixels used for every observed boundary/landmark;
- the extraction method and precision;
- canonical paths/centers/radii/vertices in inches;
- source-to-canonical residuals;
- any ambiguity caused by raster resolution, line thickness, compression, or unclear line ownership;
- the complete UGO artifact and source hashes.

This is governed registration against publisher authority—not an independent claim that SCZN3 certified Baker's production tolerance. No proportional inference from the 17.5 × 23 product is permitted.

### Selected-coordinate classification contract

The runtime chain is:

> **Shooter photograph → UGO registration → canonical target-space inches → selected bullet-hole center → backend classification**

For each shooter-selected image-space center:

1. UGO verifies the photograph against the registered Baker product/representation evidence.
2. UGO resolves the observation into the canonical 23 × 35 target plane.
3. UGO carries transform residual/error and local registration uncertainty with the canonical coordinate.
4. The backend—not the frontend—tests that coordinate against the governed region paths.
5. The backend returns `down_zero`, `down_one`, `down_three`, `outside`, or `indeterminate_boundary` with authority references and decision trace.
6. The mission authority—not the frontend—uses determinate classifications in best-two selection and points-down calculation.

The same physical evidence must preserve the same authoritative coordinate relationship regardless of screen size, display scale, crop, rotation, or perspective once validly registered.

### Boundary and uncertainty rule

- A selected center defensibly inside one governed region receives that region.
- A selected center defensibly outside the governed exterior receives `outside`.
- A selected center on a governed boundary, or whose carried UGO uncertainty overlaps more than one possible region, receives `indeterminate_boundary`.
- `indeterminate_boundary` withholds the complete result; neither frontend nor backend may guess a favorable region.

This remains selected-center classification only. It does not adjudicate bullet-hole diameter, caliber, grease ring, paper tear, keyhole, physical line touch, or match-official scoring.

### Minimum Gate 3 implementation artifacts

During implementation, Cody must build and validate:

1. the preserved Baker product/source record and proof that the representation belongs to the 23 × 35 SL-ST2 variant;
2. `UGO_BAKER_SL_ST2_23X35_TARGET_PLANE_V1` with source hashes and canonical geometry;
3. an overlay of every governed scoring boundary and registration landmark on the exact preserved JPEG;
4. a region/precedence table for `down_zero`, `down_one`, `down_three`, `outside`, and `indeterminate_boundary`;
5. extraction residuals and the uncertainty representation used by boundary decisions;
6. interior, exterior, exact-boundary, and uncertainty-overlap fixtures;
7. confirmation that no 17.5 × 23 scaling, laboratory tolerance certification, or frontend classification was introduced.

### Gate 3 lock effect

Founder lock now establishes:

- **physical dimension authority:** Baker's published 23 × 35 product definition;
- **representation evidence:** the exact preserved and hashed publisher representation;
- **geometry bridge:** UGO;
- **classification input:** UGO-resolved canonical coordinates with uncertainty;
- **classification owner:** backend;
- **claim:** selected-center practice classification only.

Gate 3 is Founder Approved. The artifacts above are implementation deliverables and acceptance evidence—not separate Founder specification gates. Cody must stop for Founder judgment only if implementation exposes a genuine ambiguity, missing authority, or contradiction that cannot be resolved from the locked contract.

## Draft 013 — Implementation-Ready Episode 55 Specification

### Gate status

| Gate | Decision |
|---|---|
| Gate 1 — Mission | **FOUNDER APPROVED:** `Timed Pair — 7 Yards`, `N = 2`, one target, one string, Unlimited best-two scoring |
| Gate 2 — Physical product | **FOUNDER APPROVED:** Baker SL-ST2, 23 × 35 standard paper; 17.5 × 23 remains a separate future geometry identity |
| Gate 3 — Geometry/classification | **FOUNDER APPROVED:** publisher dimensions → UGO target plane → selected-center coordinate → backend classification |
| Timing | **RESOLVED:** manual shot-timer transcription as reported Session Evidence |
| Evidence completeness | **RESOLVED:** explicit shooter affirmation required; backend validates the governed evidence package and fails closed |
| Rules source | **RESOLVED:** IDPA 2026.2 source preserved/versioned/hashed separately from Baker product authority |
| Result claim | **RESOLVED:** `Timed Practice Result`; not a match, classifier, qualification, official, or match-official score |

No unresolved Founder product decision currently blocks implementation. Authority-source or geometry contradictions discovered during implementation must be surfaced; ordinary artifact construction, test fixture creation, overlays, hashes, and validation do not create new Founder gates.

### Locked identity and authority package

| Contract | Implementation value |
|---|---|
| Target Profile ID | `idpa_silhouette_sl_st2` |
| Target Profile label | `Silhouette Target (IDPA)` |
| Partnership identity | Baker Targets, shown only in approved partnership surfaces |
| Product | Baker `Silhouette Target (IDPA)` / `SL-ST2`, 23 × 35 standard paper |
| Geometry/UGO ID | `UGO_BAKER_SL_ST2_23X35_TARGET_PLANE_V1` |
| Mission Authority ID | `SCZN3_SL_ST2_TIMED_PAIR_7YD_V1` |
| Mission label | `Timed Pair — 7 Yards` |
| Rules source | IDPA Rulebook 2026.2, preserved with source URI/version/hash |
| Result package | `idpaTimeScoreResult` |
| Scoring Presentation Family | `lowest-score-wins` |
| SEC adapter | IDPA timed-practice adapter consuming the Episode 54 adapter contract |

No identity may be reconstructed by stripping publisher text. Target Profile, Partnership, Product, geometry, mission, rules, evidence, session, and result identities remain separate and traceable.

### Locked Course of Fire

> **From a range-approved low-ready position, begin on the shot-timer signal and engage one Baker SL-ST2 at 7 yards with at least two rounds. The string ends on the final shot. SCZN3 scores the best two valid captured hits and combines their points-down time with the reported raw time.**

This is one SCZN3 timed-practice mission. It is not attributed to Baker or represented as an IDPA match stage, classifier, qualification, or official score.

### Locked evidence and timing inputs

Required shooter/session inputs are:

1. reported raw time transcribed from a shot timer;
2. source type `manual_shot_timer_entry`;
3. completed target photograph;
4. all shooter-selected bullet-hole centers belonging to the string;
5. explicit affirmation that all bullet holes for the string were marked.

The raw-time contract must preserve the submitted display value and parse it server-side into an exact nonnegative decimal seconds representation suitable for deterministic calculation. Missing, malformed, non-finite, negative, or unsupported-precision values fail closed. The UI describes the value as **Reported Raw Time** and does not imply timer-device verification.

The completeness affirmation is a reported Session Evidence fact, bound to session/evidence identity and submission time. It does not claim that SCZN3 independently detected every physical hole. Missing affirmation returns `evidence_completeness_required`.

### Locked UGO and classification behavior

Implementation must build the Gate 3 UGO artifacts and validate them as one implementation workstream:

1. verify the Baker product source and exact 23 × 35 representation authority;
2. bind the preserved representation to Baker's published 23 × 35 physical plane;
3. register the exterior, `0`, `-1`, and `-3` scoring boundaries plus distributed fit/validation landmarks;
4. preserve transform identity, hashes, residuals, coverage, and local uncertainty;
5. transform every selected image-space center to canonical inches;
6. return backend-only `down_zero`, `down_one`, `down_three`, `outside`, or `indeterminate_boundary` classifications;
7. withhold the complete result for `indeterminate_boundary` or unreconciled authority.

No physical-hole extent, caliber, tear, keyhole, grease-ring, line-touch, computer-vision detection, manufacturing-tolerance certification, or 17.5 × 23 scaling is authorized.

### Locked backend result behavior

For determinate evidence, the backend:

1. validates all identity, authority, evidence, UGO, session, mission, and rules bindings;
2. classifies every selected center;
3. assigns governed points down: `down_zero = 0`, `down_one = 1`, `down_three = 3`, `outside = 5`;
4. selects the two lowest points-down valid observations under Unlimited scoring;
5. preserves all extra observations as excluded evidence with reasons;
6. requires two determinate scored observations;
7. calculates `pointsDownTime` from the selected pair;
8. calculates `finalTime = reportedRawTime + pointsDownTime` using exact decimal arithmetic;
9. returns a reconciled `idpaTimeScoreResult` and complete authority trace.

Frontend-supplied classifications, selected-hit claims, values, subtotals, penalties, or final time are ignored. Hit-on-non-threat and behavioral penalties are not accepted as zero-value inputs; they are outside this mission's authorized conditions. If such adjudication is required, the result is unavailable.

### Locked inherited shooter experience

The first IDPA Smart Target inherits the Episode 54 platform path:

> **QR/Catalog → Session Setup → Target Photo → Mark Bullet Holes → Show Results → SEC → Save → Vault → Exact Reopen**

It consumes:

- `SCZN3SmartTargetWorkspace`;
- Persistent Target Profile, Partnership, and Product Identity contracts;
- `SCZN3Processing` and duplicate-request prevention;
- `SCZN3SEC`, `SCZN3SECComponents`, and the registered `lowest-score-wins` presentation family;
- `SCZN3Actions`, navigation, responsive behavior, preservation, Vault, and reopen lifecycle.

IDPA-specific code supplies authority packages, target/evidence workflow content, backend classification/result logic, and adapter mappings only. It must not create another Target Page shell, SEC shell, component system, action system, processing system, navigation system, responsive system, or persistence architecture.

### SEC and Vault result contract

The inherited SEC presents, from the backend package only:

- **FINAL TIME** as the primary answer;
- **LOWEST TIME WINS**;
- reported raw time;
- selected-hit breakdown by `0`, `-1`, `-3`, and miss/outside values;
- points-down time;
- captured/selected/excluded evidence reconciliation;
- complete target evidence with numbered count identifiers;
- Session details and Validation trace behind inherited sections/actions.

Save remains on the SEC and confirms preservation. View History opens the Ballistic Vault. The preserved card/result summary may render only validated backend result data. Exact reopen must reproduce evidence, coordinates, classifications, selection, calculation, identities, hashes, and result without recalculation.

### Fail-closed contract

The implementation must return truthful unavailable/retry states for at least:

- product/variant/representation mismatch;
- missing or rejected UGO registration;
- insufficient landmark coverage or excessive registration uncertainty;
- `indeterminate_boundary`;
- missing/malformed raw time;
- missing completeness affirmation;
- fewer than two determinate valid observations;
- missing/mismatched mission or rules authority;
- evidence/result/preservation identity mismatch;
- any condition requiring unsupported range or match-official adjudication.

Failure preserves the photograph, selected centers, session context, and usable retry state.

### Single governed implementation sequence

These are implementation phases, not new Founder specification gates:

1. preserve/hash Baker product and IDPA 2026.2 source authority;
2. register Target Profile, Partnership, Product, geometry, mission, and result-package identities;
3. build and validate the UGO artifact, overlay, geometry table, residual/uncertainty model, and fixtures;
4. write fail-first backend classification, timing, best-two, tamper, and reconciliation tests;
5. implement backend-only `idpaTimeScoreResult` authority;
6. register the IDPA Target Adapter against existing Episode 54 contracts;
7. supply IDPA workflow/content to the inherited Smart Target Workspace;
8. map the authoritative result into inherited SEC components and Lowest Score Wins presentation;
9. integrate existing preservation/Vault/exact-reopen contracts;
10. run the IDPA end-to-end lifecycle plus the complete four-target Episode 54 regression at desktop, 390px, and short height.

Implementation should proceed continuously through these phases. Stop for Founder judgment only upon a genuine authority ambiguity or contradiction, not for routine artifacts or intermediate engineering evidence.

### Implementation acceptance

Acceptance requires:

- fail-first evidence before each new backend authority behavior;
- verified product/rules/UGO/mission/evidence/result source hashes;
- correct interior classifications and fail-closed boundary/uncertainty behavior;
- deterministic best-two selection and exact-decimal time reconciliation;
- frontend tamper suppression and no frontend authority;
- complete inherited shooter lifecycle through exact preserved reopen;
- identity separation and full authority trace;
- desktop, 390px, and short-height containment with no horizontal overflow;
- Episode 54 four-target regression unchanged;
- no IDPA-only reconstruction of inherited platform functionality.

### Final implementation-readiness verdict

> **PASS — Episode 55 is implementation-ready, pending Founder implementation authorization.**

There is no remaining planned specification gate. UGO artifacts, overlays, region tables, residuals, uncertainty models, and fixtures are required implementation deliverables. If publisher representation provenance or a scoring-boundary role cannot be reconciled from the locked sources, that specific contradiction must be returned for Founder judgment; otherwise implementation proceeds without subdivision into additional gates.

## Local implementation record — Candidate 001

Founder authorization converted Draft 013 into one continuous implementation workstream. Candidate 001 now provides:

- preserved Baker SL-ST2 product authority and the byte-identical governed representation;
- preserved IDPA 2026.2 rules authority with source URI and SHA-256;
- the `SCZN3_SL_ST2_TIMED_PAIR_7YD_V1` Mission Authority;
- `UGO_BAKER_SL_ST2_23X35_TARGET_PLANE_V1`, its overlay, landmarks, region table, uncertainty contract, and registration fixtures;
- backend-only selected-center classification, Unlimited best-two selection, exact-decimal points-down time, final-time calculation, reconciliation, evidence/result identities, and complete authority trace;
- the registered IDPA Target Profile, Partnership, Product, result-package, session, target, mission, dispatch, and SEC-adapter contracts;
- an IDPA workflow consuming `SCZN3SmartTargetWorkspace`, `SCZN3Actions`, `SCZN3Processing`, shared navigation, and shared responsive behavior;
- an inherited `SCZN3SEC` / `SCZN3SECComponents` Lowest Score Wins SEC and the existing Save → Vault → exact reopen lifecycle;
- a deterministic local Founder-review path using the governed representation as the initial review fixture.

Fail-first proof was recorded before the backend module existed. Backend authority, HTTP boundary, adapter/SEC, dispatch, Episode 54 inheritance, build, desktop, 390px, short-height, preservation, Vault, exact reopen, evidence/result hash, and accordion lifecycle verification are implementation evidence—not new Founder specification gates.

No deployment, push, or commit is included in Candidate 001.

## KTIS Right/Wrong Ledger — inheritance audit 001

This ledger records the enforced Episode 54 inheritance audit of Candidate 001. `RIGHT` means the IDPA implementation consumes the existing SCZN3 owner. `WRONG → CORRECTED` means the candidate bypassed or borrowed a target-specific implementation and was corrected at the shared owner before the audit continued.

| Inherited responsibility | Verdict | Evidence and correction |
|---|---|---|
| Smart Target Workspace shell and lifecycle | **WRONG → CORRECTED** | IDPA imported the SL-ST1 Target Page stylesheet, and SL-ST1 still owned platform page/workspace frame rules. Those rules now live in `smart_target_workspace.css`; both targets consume that owner, and IDPA imports no SL-ST1 workspace or SEC stylesheet. Pre-selection remains fully hidden; post-decode workspace containment and reserved action-region geometry pass at desktop and 390px. |
| Persistent Target Profile Identity | **RIGHT** | `idpa_silhouette_sl_st2` / version `1` resolves through `SCZN3TargetProfiles` and persists separately through Target Page, SEC, and preserved reopen. No publisher string is stripped or reconstructed in the frontend. |
| Partnership / Publisher Identity | **RIGHT** | Baker Targets is supplied by the governed partnership contract and appears only on partnership/provenance surfaces; it does not replace the Target Profile identity. |
| Product Identity | **RIGHT** | `BAKER_SL_ST2` / `SL-ST2` remains a separate governed product record and survives the SEC and preserved artifact independently of profile and partnership identity. |
| Target authority, UGO registration, classification, timing, and scoring | **RIGHT** | IDPA-specific authority remains backend-owned. The frontend sends evidence and reported session inputs and renders the returned `idpaTimeScoreResult`; frontend zone, points-down, timing, and final-score calculations remain absent. |
| SEC shell and Evidence → Result composition | **WRONG → CORRECTED** | IDPA reused SL-ST1 structural classes and stylesheet ownership. Evidence/result layout, target-evidence header/frame, image containment, marker layer, and marker presentation now have neutral platform classes in `sec-framework.css`; both SL-ST1 and SL-ST2 consume them. Target adapters retain only target/result content. |
| Lowest Score Wins Vault presentation | **WRONG → CORRECTED** | IDPA rendered a separate analysis format while GSSF already established the family. `SCZN3SECComponents.LowestScoreWinsPanel` now owns the presentation; GSSF and IDPA provide metrics only. `BEFORE` is normalized to `TARGET EVIDENCE`, and Raw Time / Points Down use separate label/value elements. |
| Responsive Evidence/Result ordering | **WRONG → CORRECTED** | The shared component wrapper used `display:contents`, so ordering only the wrapper did not order its rendered result panel and the live evidence row collapsed at 390px. The platform breakpoint now orders the actual result child, leaving the evidence row measurable and contained. No adapter stylesheet owns this behavior. |
| Shared actions, processing, and duplicate-request prevention | **RIGHT** | IDPA consumes `SCZN3Actions` and `SCZN3Processing`; action availability and processing state are platform-owned while IDPA supplies operation copy and mission transitions. |
| Navigation and responsive application frame | **RIGHT** | The standard Home · Equipment · Smart Targets · History shell is inherited. Desktop and 390px checks show no horizontal overflow. |
| Save → Vault → exact preserved SEC reopen | **RIGHT** | Browser proof preserved Session #009 in place, displayed the backend result and completed target evidence in the Vault, reopened the exact SEC, and retained result, three numbered coordinates, profile/partnership/product identities, and evidence. |
| Historical SEC accordion lifecycle | **RIGHT** | Exact reopen begins Target-open / Session-closed. Opening Session fully closes Target; reopening Target closes Session and restores the same decoded evidence and three markers. |

### Audit proof summary

- One platform workspace owner: `SCZN3SmartTargetWorkspace` + `smart_target_workspace.css`.
- One platform SEC evidence/result owner: `SCZN3SEC` + `SCZN3SECComponents` + `sec-framework.css`.
- One Lowest Score Wins Vault presenter consumed by both GSSF and IDPA.
- No IDPA import of SL-ST1 workspace or SEC presentation code remains.
- Local browser lifecycle passed at 390px: governed target load → three bullet holes → backend result `9.50s` → Save → Vault → exact reopen → accordion evidence restoration, with zero horizontal overflow.
- Python authority suites require the repository's OpenCV-capable runtime; the frontend/adapter/authority-boundary contracts and live local authority path passed in this audit.

## Baker Fun Targets — KTIS execution record

Episode 55 authority was extended under KTIS to Baker's existing Dartboard (`GF-DB`) and Bowling Pins (`GF-BP`) products. The implementation begins with Baker's published products and rules, inherits the Episode 54 platform owners, and adds only Baker Fun target authority and adapter content.

### Preserved publisher authority

- `BAKER_GF_DB_PUBLISHER_PRODUCT_IMAGE_V1.jpg` — SHA-256 `7c5b0f448eee83c0638f182e0faaa2791f0ec4cd41f9b7d26aaf4908e829648e`.
- `BAKER_GF_BP_PUBLISHER_PRODUCT_IMAGE_V1.jpg` — SHA-256 `5c9dbe1297864ed3bac8b1b48ab8475ae5f71920707b5b0c69cc95552bd3bea6`.
- `BAKER_TARGETS_RANGE_TARGET_GAMES_2026.pdf` — SHA-256 `c0663ba92087461b1257835d8a8e712fd347c2ad50551b9cade6549d5a3ed4a7`.
- `BAKER_GF_DB_PRODUCT_AUTHORITY_V1.json` governs Baker's published Game of Points and Game of Numbers.
- `BAKER_GF_BP_PRODUCT_AUTHORITY_V1.json` governs only Baker's published ten-shot pin challenge. No bowling-league, competition, or third-party rules were imported.

### Living completeness checklist

| Responsibility | Dartboard | Bowling Pins | Evidence |
|---|---:|---:|---|
| Governed Target Profile, Partnership, and Product identity | PASS | PASS | Separate platform contracts and registered backend aliases |
| Publisher authority preserved and hashed | PASS | PASS | Governed images, product records, and Baker range-games PDF |
| UGO registration to canonical target space | PASS | PASS | Target-specific UGO profiles; backend-only transform and uncertainty gate |
| Backend classification and game authority | PASS | PASS | `baker_fun_target_authority.py`; frontend result claims ignored |
| Inherited Smart Target Workspace | PASS | PASS | One target-neutral page consuming `SCZN3SmartTargetWorkspace` |
| Inherited SEC Framework and components | PASS | PASS | `SCZN3SEC` + `SCZN3SECComponents`; adapter content only |
| Scoring/result presentation | PASS | PASS | Points uses Highest Score Wins; Numbers and ten-shot completion use backend qualification results |
| Shared Actions, Processing, Navigation, responsive behavior | PASS | PASS | Existing Episode 54 owners; desktop and 390px no overflow |
| Save → Vault → exact preserved reopen | PASS | PASS | Real local authority lifecycle; preserved evidence and result reopen exactly |
| Production endpoint activation | GATED | GATED | Target-photo upload to the separate production authority origin requires explicit external-data authorization before deployment wiring |

### Right/Wrong Ledger — Baker Fun inheritance audit 001

| Responsibility | Verdict | Evidence and correction |
|---|---|---|
| Baker published rules | **RIGHT** | Game of Points and Game of Numbers follow Baker's supplied instructions. Bowling exposes only Baker's ten-shot pin challenge and does not invent scoring or tie-break rules. |
| Prior Dartboard draft authority | **WRONG → CORRECTED** | The prior locally drafted game semantics were not treated as authority. Publisher assets and instructions were preserved and became the governed source. |
| Workspace ownership | **RIGHT** | Both products consume `SCZN3SmartTargetWorkspace`; no Baker Fun workspace implementation was created. |
| Backend authority boundary | **RIGHT** | Image identity, UGO registration, coordinate classification, game progress, result, and reconciliation are backend-owned. Frontend claims are ignored. |
| SEC ownership | **RIGHT** | Baker Fun adapters supply content models to the existing SEC Framework and shared semantic components. |
| Shared preservation gate | **WRONG → CORRECTED** | `SCZN3M4.preserveActiveSEC` only recognized the earlier target adapters. The shared preservation owner now validates any registered Baker Fun backend result package before canonical preservation; no target-specific persistence path was added. |
| Vault and historical reopen | **RIGHT** | Existing Vault summary/evidence contracts render the preserved result and numbered evidence, then reopen the exact SEC with the shared accordion lifecycle. |
| Catalog, navigation, and build ownership | **RIGHT** | Both products are registered as available experiences and consume existing catalog/navigation/build owners. |

### Founder Found It count

`0` for this local Baker Fun candidate. No Founder walkthrough finding has been recorded; Founder review remains pending. The production endpoint gate above is an engineering/governance stop identified before release, not a Founder-found product defect.

## Catalog Fun expansion — KTIS execution record 002

### Completed inherited targets

- **Dot Torture — EZ2C Style 17:** preserves the publisher's 11 × 17 product, ten numbered two-inch dots, seven-stage 50-round course, 3-yard recommendation, maximum score of 50, and complete-inside hit rule. UGO resolves the selected coordinate to the expected dot; the shooter explicitly reports physical hole containment because a selected center cannot prove the physical hole edge. The backend alone validates course order and calculates the score.
- **Billiard Balls — Baker GF-BB-C:** preserves Baker's 23 × 35 and 17.5 × 23 variants and the exact published instruction, “Shoot in order; change shooters if you miss.” UGO resolves the selected coordinate to balls 1–15. The backend owns sequence and turn state. No winner, tie-break, or numeric score was invented.

Both targets consume the existing Smart Target Workspace, SEC Framework, shared semantic components, Actions, Processing, Navigation, responsive behavior, preservation contract, Ballistic Vault summary/evidence model, and exact historical reopen lifecycle.

### Right/Wrong Ledger — catalog expansion 002

| Responsibility | Verdict | Evidence and correction |
|---|---|---|
| Publisher authority | **RIGHT** | Official EZ2C Style 17 and Baker GF-BB-C product records and representations are preserved with SHA-256 identities. |
| Physical-hole claim boundary | **RIGHT** | Dot Torture requires an explicit shooter complete-inside adjudication; SCZN3 does not convert a selected center into an unsupported physical-edge claim. |
| Billiard result semantics | **RIGHT** | Sequence/turn behavior follows Baker. Winner and numeric score remain absent because Baker supplied neither. |
| Workspace/action-region inheritance | **WRONG → CORRECTED** | The shared compact dock assumed exactly four cells and wrapped a fifth applicable action into reserved space. The platform owner now uses a variable-action flex contract; no target-specific layout patch was added. |
| SEC/Vault/preservation inheritance | **RIGHT** | Both result packages dispatch through registered adapters, shared preservation admission, Vault evidence/result summaries, and exact-record historical reopen. |
| Backend authority | **RIGHT** | UGO registration, coordinate classification, course/sequence state, reconciliation, and result packages remain backend-owned. |

### Founder scope replacement — ST-001 removed; Baker Battleship added

The Founder removed `ST-001 Universal Bullseye` from this Episode 55 implementation batch. Its historical identity collision remains preserved outside the batch and no additional time was spent resolving or rewriting that authority.

The fifth catalog target is Baker Targets' `Battleship Target` (`GF-Battleship`). The publisher product page, publisher representation, and June 2025 Game Target Instructions are preserved byte-for-byte. The backend implements Baker's two-player opponent-board rule, ship-square hit condition, first-fleet-sunk win/loss condition, and optional declared challenge-circle awards/turn penalty. No third-party Battleship rules or numeric score were added.

Battleship inherits the existing Smart Target Workspace, SEC Framework, shared semantic components, Actions, Processing, Navigation, responsive behavior, preservation admission, Ballistic Vault presentation, and exact historical reopen lifecycle. Target-specific additions are confined to the publisher authority record, UGO grid/ship/challenge geometry, backend game state, and adapter content.

### Completeness and FFI

- Dartboard: complete local candidate.
- Bowling Pins: complete local candidate.
- Dot Torture: complete local candidate.
- Billiard Balls: complete local candidate.
- Baker Battleship: complete local candidate using publisher-authoritative game rules.
- ST-001 Universal Bullseye: removed from the current batch by Founder direction; historical records remain untouched.
- Founder Found It count remains `0` before the consolidated five-target Founder Flow.

## Historical implementation sequence — superseded by Draft 013

This earlier staged proposal is retained as history only. Draft 013 converts the work into one continuous implementation sequence. The items below are implementation tasks, not separate Founder gates.

1. **Founder digital-scope decision** — choose practice-coordinate scoring or official-rule physical-hole scoring; choose single-target practice or full-stage scope. The Baker physical product is not reopened by this decision.
2. **Source authority preservation** — preserve Baker's published `Silhouette Target (IDPA)` / `SL-ST2` source record, unchanged physical-artifact evidence, QR identity, selected rulebook, geometry source, and hashes.
3. **Identity registration** — approve Target Profile ID/version/label, mission label, optional partnership identity, and exact product/QR identity.
4. **Stage/mission authority contract** — define required hits, Limited/Unlimited mode, target designation, timing source, allowed penalty inputs, and fail-closed states.
5. **Geometry and evidence contract** — register canonical zones/boundaries, image identity, photo-registration method/corpus/tolerance if real photographs are supported, and boundary policy.
6. **Fail-first backend tests** — zone interiors/boundaries, required-hit selection, variable observations, misses, non-threats, timing, penalties, tamper suppression, reconciliation, and unavailable behavior.
7. **Backend authority implementation** — classify and calculate only from governed packages; return a traceable result.
8. **IDPA Target Adapter** — map authoritative session/result content into existing platform contracts with no structural UI or calculations.
9. **Inherited Target Page wiring** — supply IDPA workflow/content to `SCZN3SmartTargetWorkspace`; do not create another workspace.
10. **Inherited SEC wiring** — use `SCZN3SEC`, `SCZN3SECComponents`, and `lowest-score-wins`; do not create another SEC shell.
11. **Preservation integration** — verify exact immutable result/evidence identity through Save, Vault, direct reopen, and historical reopen.
12. **Inheritance and release proof** — run IDPA plus four-target regression at desktop, 390px, and short height; prove no current target implementation was edited to accommodate IDPA.

## Proposed validation plan

### Contract and authority

- Reject an unregistered Target Profile, product, geometry, ruleset, or stage package.
- Reject mismatched target/product/photo identity.
- Ignore frontend-supplied zone, points-down, penalty-time, or final-time claims.
- Require backend reconciliation from evidence count through scored-hit selection to final time.
- Fail closed when a required official or stage decision is absent.

### Geometry and evidence

- Test unambiguous interiors of every governed zone.
- Test exterior/miss, head/body distinctions, non-threat, hard cover, and reduced scoring areas only when registered.
- Test boundary conditions against the Founder-approved point or physical-hole contract.
- Preserve exact image hash, coordinate centers, marker count, target identity, and transform trace.
- Use real photographs only after an empirical IDPA registration corpus establishes tolerance.

### Scoring and timing

- Test Unlimited best-hit selection and Limited exact-shot behavior only after their stage contracts are approved.
- Test raw time, points-down time, non-threat time, and allowed penalty entries against locked rule fixtures.
- Test missing hits, extra hits, missing time, invalid timestamps, invalid penalties, and incomplete stages.
- Prove lowest-score-wins presentation displays—but never calculates—the backend result.

### Inherited experience

- Catalog → inherited Target Page → evidence → processing → backend result → inherited SEC → Save → Vault → exact reopen.
- Verify profile/partnership/product identity separation.
- Verify shared actions, processing, navigation, accordion lifecycle, responsive containment, and no horizontal overflow.
- Verify desktop, 390px, and short-height behavior.
- Re-run the four Episode 54 target lifecycles unchanged.

## Founder decisions resolved for implementation

The historical decision list is closed by Draft 013:

1. single-target `Timed Pair — 7 Yards` practice mission;
2. Baker SL-ST2 23 × 35 standard-paper product authority and preserved representation evidence;
3. preserved/versioned/hashed IDPA 2026.2 digital rules source;
4. selected-center classification through UGO, not physical-hole adjudication;
5. manual shot-timer transcription as reported Session Evidence;
6. one target, one string, Unlimited best-two (`N = 2`);
7. no behavioral, non-threat, or human-adjudicated penalties in Version 1;
8. real-photo UGO registration required for the inherited shooter flow.

There is no remaining planned Founder specification decision. A genuine contradiction in product provenance, scoring-boundary meaning, or locked authority must still stop for Founder judgment.

## Founder Review verdict

The Episode 54 inheritance architecture is sufficient for the **outside** of the IDPA experience. No new Target Page shell, SEC shell, action system, navigation system, processing system, responsive system, preservation flow, or scoring-presentation family is required.

The Publisher Authority Profile fixes the physical starting point: Baker's `Silhouette Target (IDPA)` / `SL-ST2`, unchanged except for the SCZN3 QR. IDPA-related digital authority must supply the **inside**: ruleset and stage authority, geometry registration, evidence interpretation, timing, scoring/penalty package, and adapter content.

The digital mission scope and authority boundaries are resolved in Draft 013. Source preservation, UGO construction, backend authority, adapter wiring, inherited experience integration, and validation are implementation deliverables. No IDPA-only workaround is authorized.

**Episode 55 Draft 013 is Founder-authorized and implemented locally as Candidate 001. Candidate 001 awaits Founder review; no commit, push, or deployment has occurred.**

## Governed closeout — 2026-08-18

**Final status:** **CLOSED / ARCHIVED / LOCKED**

Episode 55 completed its purpose by proving that the first inherited IDPA candidate and a five-target catalog candidate could add target-specific authority without rebuilding the platform around them. The exact closing state is preserved as **Snapshot 7 — Episode 55 Inherited Catalog Baseline** and checkpoint `SCZN3_EP55_INHERITED_CATALOG_CLOSURE_2026-08-18`.

### Historical truth preserved

- IDPA Candidate 001 and its Universality audit-and-fix work remain a local candidate, not a production claim.
- The Right/Wrong Ledger remains part of the record. Its central lesson is **Declared Universality ≠ Enforced Universality**.
- Episode 55 corrected shared ownership where reality exposed incomplete inheritance: Smart Target Workspace behavior, SEC Evidence/Result composition, Lowest Score Wins presentation, responsive Evidence/Result ordering, preservation admission, and shared action-dock behavior.
- KTIS proved the intended integration order: known target → publisher Target Profile and rules → QR → UGO → inherited SCZN3 platform → target-specific backend authority → validation.
- The closing Fun candidate is: **Dartboard → Bowling Pins → Dot Torture → Billiard Balls → Battleship**.
- `ST-001 Universal Bullseye` was removed from the current batch because of a genuine historical authority collision. Its historical records were not rewritten, deleted, or reassigned.
- Founder Found It remained `0` before the consolidated five-target Founder Flow. This is not represented as Founder product approval or a production release.
- The work exposed the catalog-scale question: SCZN3 cannot reach roughly 40,000 target SKUs by rebuilding target experiences individually. Future work must investigate governed publisher-catalog ingestion while preserving authority, identity, geometry, evidence, and backend truth.

### Closing authority

- Canonical living onboarding artifact: `docs/architecture/SCZN3_SHORTEST_CORRECT_MENTAL_MODEL.md`, Version 1.0 — 2026-08-18.
- Production remains `https://tap-n-score.com` at Git commit `bfce363643eff364e43d7d71a6b1e42c0262ca42` for purposes of this checkpoint record.
- The Episode 54/55 implementation is an intentionally uncommitted working overlay captured by Snapshot 7 and the restore archive. It is not falsely represented as production.
- Episode 56 is opened only with its title, purpose, starting authority, and standard invocation. No Episode 56 architecture or implementation is established by this closeout.
