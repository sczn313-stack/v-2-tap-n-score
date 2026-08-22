# E56-T08 — GunFun Vital Dude Playable Founder Specification

**Product:** GunFun Vital Dude

**Publisher SKU:** `22740`

**Episode identifier:** `E56-T08`

**Status:** **FOUNDER APPROVED — CONTROLLED IMPLEMENTATION VALIDATED**

**Founder approval:** 2026-08-18 — retain the optional shooter-declared aim marker as session evidence only.

**Preservation boundary resolution:** The approved implementation reached the live evidence-only SEC and correctly failed closed at the shared client preservation owner. Founder then separately approved the minimum Vital Dude-only admission in `docs/m4_runtime.js`, with preservation regression coverage. The admission is restricted to the exact SKU `22740` adapter/result/evidence contract and does not generalize the Target Execution Contract or another Episode 56 target.

**Architecture milestone:** [Episode 56 Publisher Product Boundary](PUBLISHER_PRODUCT_BOUNDARY_MILESTONE.md)

## Governing objective

Demonstrate this relationship without reinventing the publisher's product:

```text
GunFun product
  -> SCZN3 digital relationship
  -> shooter evidence
  -> governed result
  -> SEC
```

The proof is intentionally evidence-only. It does not invent a Vital Dude mission or convert the printed illustration into unsupported meaning.

## 1. Exact shooter-facing experience proposed

1. The shooter opens **Vital Dude — Evidence Capture** from Smart Targets. The opening surface identifies `GunFun`, `Vital Dude`, SKU `22740`, and the publisher's `23 x 35 in` dimensions. It does not advertise a score, drill, qualification, or anatomical result.
2. **Start** creates a backend-authoritative Vital Dude evidence session. Equipment may be recorded using the existing optional session capability; no distance, firearm, caliber, shot count, or course-of-fire value is required to make the target valid.
3. The shooter loads or captures a photograph of the physical target. SCZN3 records the image hash, pixel dimensions, and capture/import time.
4. The shooter taps visible shot evidence to place numbered observation markers. Existing undo and clear behavior are available. Each marker means only **shooter-recorded shot observation at this image coordinate**.
5. An optional **Mark Aim Point** control may record one shooter-declared aim point. It is labelled as the shooter's declaration, is not required, and produces no correction, distance, or publisher-meaning claim.
6. **Show Evidence Result** submits the captured evidence to backend authority. It becomes available after at least one shot observation. Selecting it freezes that evidence snapshot; it does not mean pass, completion, or successful execution of a course.
7. The result shows the admitted product identity, the evidence image with numbered markers, the accepted observation count, optional shooter-declared aim point, backend session identity, and validation/provenance state. Unsupported result families are absent or explicitly unavailable/not applicable.
8. **Save SEC** preserves the governed evidence package. **View SEC** opens it in the Vault, and reopening the saved record reproduces the same identity, evidence, result, authority trace, and unavailable states.

No automatic visual detection is part of the smallest proof. The shooter establishes observations explicitly.

## 2. Existing SCZN3 components and capabilities inherited

- Shared Smart Target workspace and navigation from `docs/smart_target_workspace.js`.
- Shared target-page actions and processing patterns from `docs/platform_actions.js`.
- Existing authoritative-session lifecycle in `docs/backend/session_authority.py`.
- Existing image loading, manual impact marking, undo/clear, and submission interaction proven by the Baker SL-ST1 target page.
- Existing `smartEvidenceCapture` mission-family and `smartEvidenceResult` package vocabulary.
- Backend-owned validation and frontend-presentation-only rule.
- Universal SEC shell and semantic ordering from `docs/sec_framework.js`.
- Target-profile, adapter, and dispatch boundaries in `docs/platform_contracts.js`, `docs/sec_adapter_model.js`, and `docs/sec_dispatch.js`.
- Target-agnostic preserved-record store in `docs/backend/preserved_sec_store.py`.
- Existing Vault save, list, view, and exact-reopen behavior in `docs/records.html`.
- Shared responsive platform styling and accessibility conventions.

The Baker SL-ST1 implementation is a reference for the evidence workflow only. Its identity, geometry, scoring, result claims, and SEC adapter are not inherited by Vital Dude.

## 3. Target-specific registration data required

The implementation would require one explicit Vital Dude target authority/profile registration containing:

- target ID `gunfun_22740_vital_dude`;
- experiment ID `E56-T08` as historical provenance, not runtime product identity;
- publisher `GunFun`;
- exact product name `Vital Dude`;
- publisher SKU `22740`;
- published dimensions `23 x 35 in`;
- official product URL `https://gunfun.com/shop/vital-dude-22740/`;
- governed publisher-representation path, source hash, pixel dimensions, retrieval date, and source provenance already captured by Episode 56;
- capability declaration: manual registered-photo evidence capture;
- mission family: `smartEvidenceCapture`;
- target-specific mission identifier: `GUNFUN_22740_EVIDENCE_CAPTURE_V1`;
- result package type: `smartEvidenceResult`;
- scoring authority: `not_applicable` for this experience, never `confirmed` by invention;
- canonical region/semantic classification authority: `unavailable`;
- optional shooter-declared aim-point evidence: permitted, non-authoritative as publisher meaning;
- explicit refusal reasons for absent image, invalid hash/dimensions, malformed or out-of-range coordinates, identity mismatch, and unsupported result requests;
- versioned authority/profile identity and compatible SEC adapter identity.

The existing knowledge manifest should be corrected from a broad “mission/result requires publisher source” unknown to the narrower truth: an evidence-only SCZN3 experience is possible, while any publisher mission, scoring, or anatomical interpretation remains unavailable.

## 4. UGO treatment possible with currently available evidence

Current evidence supports only a limited UGO treatment:

- preserve the captured photo as registered session evidence;
- preserve each shot observation as normalized image-plane coordinates plus the source image hash and dimensions;
- preserve an optional shooter-declared aim point in the same image plane;
- bind the evidence to Vital Dude through the governed target route/profile/session, not through visual recognition;
- report canonical region mapping and semantic classification as unavailable/not applied.

The publisher representation is `377 x 600 px`. It is sufficient to corroborate product identity and displayed artwork, but it is not sufficient authority for defensible detailed boundaries. Published sheet dimensions do not, by themselves, establish that an arbitrary shooter photograph is rectified, uncropped, or distortion-free. Therefore the proof will not return physical-inch measurements, aim-to-impact correction, anatomical zones, region membership, or printed-feature meaning.

Higher-resolution governed evidence and an approved registration method could later support nonsemantic geometry. That future possibility is outside this specification.

## 5. Results SCZN3 can truthfully show

The governed result may show only:

- GunFun / Vital Dude / SKU `22740` identity;
- backend-authoritative session ID and authority/profile version;
- source evidence image, image hash, pixel dimensions, and capture/import timestamp;
- number of backend-accepted shooter-recorded shot observations;
- numbered observation overlay at the accepted normalized image coordinates;
- optional shooter-declared aim-point overlay, explicitly labelled;
- reconciliation that displayed marker count equals the backend-accepted observation count;
- evidence-validation status and any refusal reason;
- UGO status: image-space evidence preserved; canonical mapping/classification unavailable;
- preservation status and SEC record identity.

The primary result language is **Evidence Recorded — N shot observations**, not a score or completion claim.

## 6. Capabilities explicitly unavailable or not applicable

- Score, points, rings, zones, hit value, penalties, pass/fail, ranking, or qualification: **not applicable / unavailable**.
- Anatomical labels, anatomical significance, wound or medical consequence: **unavailable**.
- Tactical priority, target priority, recommended engagement order, or threat interpretation: **unavailable**.
- Publisher drill, mission, intent, shot requirement, time limit, completion rule, or success criterion: **unavailable**.
- Automatic hole detection or image recognition: **not included**.
- Canonical region classification or feature membership: **unavailable**.
- Physical group size, offset, correction, zeroing recommendation, or distance transition: **unavailable**.
- Automatic aim-point inference: **unavailable**.

The UI must not substitute `0`, `none`, or visually blank scoring fields where the correct state is unavailable/not applicable.

## 7. SEC representation

The Universal SEC will preserve its familiar shell while omitting inapplicable stages:

- **Identity:** GunFun, Vital Dude, SKU `22740`, target/profile version, session ID.
- **Evidence:** captured image, numbered shot observations, optional shooter-declared aim point, source hash/dimensions/timestamp.
- **Result:** `Evidence Recorded — N shot observations` and evidence-validation state.
- **Authority trace:** target authority/profile, mission/result package identity, backend authority, and explicit UGO/scoring/semantic unavailable states.
- **Preservation:** immutable record ID, saved timestamp, schema/version information, and exact-reopen data.
- **Actions:** save, view in Vault, and reopen.

Scoring, recommendation, correction, qualification, and course-completion regions are omitted. The saved SEC remains a governed session-evidence record, not a publisher course result.

## 8. Target Execution Contract requirement

The playable proof does **not** require implementation or redesign of the generalized Target Execution Contract.

It can correctly use SCZN3's existing explicit target path: a dedicated target authority/profile, backend-authoritative session admission, target-specific evidence validator/result builder, strict SEC adapter/dispatch identity, and preserved-record store. That is the same architectural class already used for explicitly wired targets, with Vital Dude's own non-scoring contract.

This is a controlled one-target bridge, not proof of catalog-scale execution registration. It must not bypass identity checks, reuse Baker identity, or mark scoring authority `confirmed`. The knowledge registry may remain fail-closed for unsupported execution while Session Authority explicitly admits only the named evidence experience.

The later Target Execution Contract can replace the explicit composition wiring when its implementation is separately approved. It may reduce recurring registration work, but it cannot supply missing authority.

## 9. Exact files/components that would change after approval

The implementation plan is limited to these prospective files. Names for new files are fixed by this specification; no file changes are authorized yet.

### Target authority and backend

- Modify `docs/backend/target_knowledge/manifests/gunfun_22740_vital_dude.json` — correct capability/unknown declarations and bind the evidence-only experience.
- Add `docs/backend/target_profiles/ATP_GUNFUN_22740_VITAL_DUDE_EVIDENCE_V1.json` — explicit target authority/profile registration.
- Modify `docs/backend/registries/smart_target_identity_registry.json` — admit the exact product identity if required by the current identity path.
- Add `docs/backend/gunfun_vital_dude_evidence_authority.py` — validate image/coordinates and build the non-scoring authoritative result.
- Modify `docs/backend/session_authority.py` — admit only the Vital Dude evidence session/profile/result combination.
- Modify `docs/backend/server.py` — expose the target-specific evidence endpoint through existing backend routing.

### Shooter experience and SEC

- Add `docs/t/gunfun/vital-dude/index.html`.
- Add `docs/t/gunfun/vital-dude/target-page.js`.
- Add `docs/t/gunfun/vital-dude/target-page.css` only if shared styles cannot express the target page without a target-local rule.
- Modify `docs/target_experiences.js` — add the Vital Dude evidence experience.
- Modify `docs/platform_contracts.js` — add the exact target profile/result contract.
- Modify `docs/sec_adapter_model.js` — register the evidence-only SEC adapter identity.
- Modify `docs/sec_dispatch.js` — dispatch only the exact Vital Dude mission/result pair.
- Add `docs/gunfun_vital_dude_sec.js` — target-specific evidence-only SEC adapter.
- Modify `docs/records.html` only if exact reopen requires a target-specific dispatch branch not already supplied by shared SEC dispatch.

### Build and validation

- Modify `docs/production/build-site.mjs` and `docs/production/build-netlify.mjs` only where their explicit asset/page allowlists require the new route and adapter.
- Add `docs/backend/test_gunfun_vital_dude_evidence_authority.py`.
- Add `docs/production/gunfun_vital_dude_sec_contract_test.mjs`.
- Add a Vital Dude browser-flow test under `docs/production/` using the repository's existing browser-test naming convention at implementation time.
- Extend existing session, dispatch-governance, preservation/reopen, and baseline-regression tests only where the new registered identity must be enumerated.

### Separately approved preservation admission

- Modify `docs/m4_runtime.js` only to add a fail-closed Vital Dude SKU `22740` admission branch to the existing `preserveActiveSEC()` path.
- Require exact adapter/product/profile identity, backend result authority, verified admitted image evidence, reconciled observation counts, evidence-only UGO refusal states, `scoring.status === "not_applicable"`, and a valid absent-or-shooter-declared aim point.
- Extend the Vital Dude browser-flow regression through Save, Vault, and exact reopen; retain existing universal preservation and Baker regressions.

If inspection during implementation reveals any additional required production file, work stops and the delta is returned to Founder before that file is changed.

## 10. What will explicitly not change

- GunFun's product name, SKU, artwork, published dimensions, product identity, or asserted meaning.
- The existing 10-target SCZN3 baseline or Episode 55 historical evidence.
- Any other Episode 56 target's execution status.
- Baker SL-ST1 identity, authority, geometry, scoring, result package, or SEC behavior.
- Existing scoring engines, qualification engines, zeroing authority, correction logic, or anatomy/medical semantics.
- The Publisher Product Boundary, KTIS, UGO ownership, backend-authority rule, or Universal SEC semantic order.
- Shared SEC layout or application architecture unless validation exposes a genuine shared-owner defect; that would be a new-application-code boundary requiring Founder review.
- The generalized Target Execution Contract.
- Production data or deployment state.

There will be no commit, push, or deployment under this specification unless separately authorized after implementation and validation.

## 11. Validation plan

1. **Authority identity:** verify exact GunFun/Vital Dude/`22740`/profile/mission/result binding and reject identity mismatch.
2. **Evidence validation:** accept a valid image hash, dimensions, and in-range normalized observations; reject absent image, malformed hash, invalid dimensions, malformed coordinates, out-of-range coordinates, unsupported fields, and excessive observations.
3. **No invented authority:** assert that backend responses, live UI, SEC, saved record, and reopen contain no score, anatomy, medical consequence, tactical priority, qualification, penalty, shot requirement, completion, correction, or publisher-intent claim.
4. **Reconciliation:** assert the backend-accepted observation count, displayed marker count, SEC count, and reopened count are identical.
5. **UGO refusal:** assert that image-plane coordinates are preserved while canonical mapping, semantic regions, physical measurements, and classification remain explicitly unavailable.
6. **Session governance:** verify backend-issued session identity, exact allowed result type, optional equipment behavior, malformed/stale-session refusal, and idempotent result submission where the existing contract requires it.
7. **Playable browser flow:** open -> start -> load/capture -> mark/undo/clear -> optional aim point -> record observations -> show result -> save -> Vault -> exact reopen, including mobile viewport and keyboard-access checks.
8. **SEC contract:** verify identity, evidence, result, authority trace, unavailable states, preservation metadata, and omission of inapplicable sections.
9. **Regression:** run existing backend, target registry, SEC dispatch, preservation, Baker SL-ST1, and the 10-target baseline suites unchanged.
10. **Build parity:** verify both supported production builders include the new route/assets without changing unrelated output.

No production deployment is part of validation.

## 12. Founder decision

Founder approved this exact controlled implementation choice:

> Approve E56-T08 as a one-target, evidence-only playable proof using the existing explicit SCZN3 target-authority/session/SEC architecture, with optional shooter-declared aim point and no Target Execution Contract implementation.

Approval authorized only the prospective file scope in section 9 and the behavior in sections 1–8. It did not authorize new shared application architecture, generalized Target Execution Contract work, invented authority, commit, push, or deployment.

Founder retained the optional aim-point marker. It remains shooter-declared session evidence only.

### Preservation decision resolved

Founder approved the narrowly target-specific Vital Dude admission branch in `docs/m4_runtime.js` plus preservation regression coverage. The governed flow now validates through Save, Vault, and exact reopen without altering the Target Execution Contract or admitting another Episode 56 target.
