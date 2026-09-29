# QT Printer #13 — Dirty Dozen Universality Comparison

**Date:** 2026-09-29

**Baseline:** Snapshot 6 — Post-Universality Baseline; Episode 54 Items 1–9

**Physical floor preserved:** 200 REPAIR→PASS / 51 physical-geometry N/A / 3 protected HOLD / 254 total

**Commit floor inspected:** `210e6176445f9c6cef02dc110549e9fdf36e0cca`
**Founder acceptance:** PENDING for this Universality pass

## Governing comparison

The existing Dirty Dozen rule was used without creating a QT capability model:

> Universal means one authoritative implementation inherited by every applicable Smart Target—not separate implementations made to look alike.

The three protected physical-occlusion HOLDs remain unexecuted and are counted `N/A` for executable-road Universality. The 51 entries called `N/A` by the physical-authority census are not 51 non-executable targets: 50 truthfully inherit the existing Evidence Only road, and M16A2 inherits the existing specialized Zeroing road.

## Concrete Universality comparison table

| Existing DD universal capability | Existing owner/path | Applicable QT surfaces | Initial QT result | Repair made with existing owner | Final result | N/A |
|---|---|---:|---|---|---:|---:|
| Persistent Target Profile Identity across Target/Result/SEC/reopen | `platform_contracts.js`; execution-family view model; `target_execution_runtime.js` | 251 | 1 PASS; 250 REPAIR because mobile SEC hid identity | Removed mobile identity suppression; retained compact identity row | 251 PASS | 3 |
| Smart Target Workspace / contained evidence / viewport lifecycle | `smart_target_workspace.js` + `.css` | 251 | 1 PASS; 250 REPAIR because generic QT page bypassed owner | Connected shared QT page to `SCZN3SmartTargetWorkspace` | 251 PASS | 3 |
| Shared processing presentation | `experience_frame_processing.js` + `.css` | 251 | 1 PASS; 250 REPAIR | Connected QT Show Result to `SCZN3Processing.run()` | 251 PASS | 3 |
| Shared action ownership / duplicate suppression | `platform_actions.js` + `.css` | 251 | 1 PASS; 250 REPAIR | Connected QT SEC save to `SCZN3Actions.bind()` and marked workspace action region | 251 PASS | 3 |
| Shared navigation | `navigation.js`; application header menu | 251 | 1 PASS; 250 REPAIR | Connected existing navigation owner and standard menu host | 251 PASS | 3 |
| Registered target evidence and exact product/publisher identity | execution contracts; `target_execution_runtime.js` | 251 | PASS | None | 251 PASS | 3 |
| Backend execution dispatch; frontend representation only | `execution_capability_registry.py`; `target_execution_contract.py`; registered executors | 251 | PASS: 200 `targetScoring`, 50 `smartEvidenceCapture`, 1 specialized M16A2 | None | 251 PASS | 3 |
| Canonical observation/UGO capture and rendered projection | `target_execution_runtime.js`; existing M16A2 zeroing owners | 251 | PASS | None | 251 PASS | 3 |
| Precision Tap pan/pinch/wheel zoom and canonical tap capture | `smart_target_workspace.js:createPrecisionTap()` | 251 | 1 PASS; 250 REPAIR because generic QT used direct click capture without the shared Precision Tap controller | Connected the generic QT evidence plane to the existing DD Precision Tap owner | 251 PASS | 3 |
| See-through numbered bullet-hole identification | `smart_target_workspace.css` `.precision-tap-marker` | 251 | 1 PASS; 250 REPAIR because generic QT supplied an opaque red marker | Removed the QT marker fill and applied the existing DD transparent marker treatment in TARGET and preserved evidence | 251 PASS | 3 |
| Physical scoring/counting boundary classification | accepted QT authority contracts and declarative target-score executor | 200 | PASS | None; physical floor not reopened | 200 PASS | 54 |
| Counting RESULT | `target-scoring-family`; shared target-data Result | 158 | PASS | None | 158 PASS | 96 |
| Scoring RESULT | `target-scoring-family`; shared target-data Result | 41 | PASS | None | 41 PASS | 213 |
| Evidence Only RESULT | `smart-evidence-family`; shared Evidence/Result components | 50 | PASS | None | 50 PASS | 204 |
| Specialized Zeroing / correction / equipment context | existing Qualification M16A2 profile, dispatch, zeroing runtime and SEC adapter | 1 | PASS | None | 1 PASS | 253 |
| USM History for governed additive scoring | `usm_proof_registry.js`; `target_execution_runtime.js` | 41 QT scoring surfaces in the current census | QT passed through a printer-prefix exception; family inheritance was REPAIR because eligibility was B27E/QT-ID based | Replaced target-ID and printer-prefix admission with existing-result capability eligibility: complete `targetScoring` + additive `numeric_regions` + finite score/taps | 41 QT PASS; family gate capability-based | 213 QT N/A |
| Shared SEC shell and semantic component order | `sec_framework.js`; `sec_adapter_model.js`; `sec_dispatch.js` | 251 | Structural consumption PASS | **HELD — no SEC repair in this pass** | DISCUSS: structural shell parity is proven; mature-DD-vs-QT content/action/presentation parity is not accepted | 3 |
| Preserved approved RESULT in Ballistic Vault | `records.html`; shared Result owner | 251 | PASS | None | 251 PASS | 3 |
| Signed portable exact reopen | `sec_reopen_capability.js`; `sec_reopen_lifecycle.js` | 251 | PASS | None | 251 PASS | 3 |
| Responsive shared road | shared workspace/actions/SEC CSS and target execution presentation | 251 | 1 PASS; 250 REPAIR | Existing DD workspace/actions owners plus persistent mobile identity | 251 PASS | 3 |
| One-owner inheritance; adapters do not own shell behavior | Episode 54 owners above | 251 | REPAIR on generic QT page connections | Removed bypasses by connecting the existing owners; no QT-specific substitute | 251 PASS | 3 |

## Decision ledger

| Classification | Current finding |
|---|---|
| PROVEN | Core DD execution chassis, persistent identity, registered evidence, Backend dispatch, UGO custody, RESULT families, Vault, signed reopen, responsive execution, Precision Tap, and transparent bullet-hole identification. |
| REPAIR→PASS | Generic QT now consumes the existing DD Precision Tap and marker owners. USM inheritance is capability-based rather than B27E/QT identity-based. |
| NEEDS EVIDENCE | **Cleared.** Each prior evidence question is resolved below as PROVEN, N/A, or FOUNDER INPUT REQUIRED. |
| DISCUSS | SEC, plus whether Founder wants one additional visual expression imposed across target-specific DD experiences where no single current DD owner exists. |
| TRUE GAP | **None established.** This is not a claim that the evidence questions are closed. |
| PHYSICAL FLOOR | Unchanged: 200 REPAIR→PASS / 51 N/A / 3 protected HOLD / 254 total. |

## Exact repairs

1. `target-experience.html`
   - consumes the existing DD Smart Target Workspace, Processing, Actions, and Navigation owners;
   - supplies their standard workspace/evidence/action/menu hosts.
2. `target_execution_runtime.js`
   - creates and binds the existing workspace owner;
   - uses the existing processing owner for Show Result;
   - uses the existing action owner for SEC preservation.
3. `target-experience.css`
   - preserves persistent target identity at 390px instead of hiding it;
   - stops overriding the shared marker with an opaque QT-specific fill.
4. Episode 54 Item 5/6 tests
   - replaced an exact `sec_framework.js?v=episode55-lowest-score-1` cache token with an assertion that the historical renderer still loads the shared `sec_framework.js` owner at a versioned URL;
   - replaced the obsolete `markSurface` wrapper literal with the current `targetEvidencePreview` evidence-owner contract;
   - retained assertions for every shared SEC component consumer, absence of adapter-owned presentation, Workspace creation/decode/reveal/viewport ownership, and separation of mission-specific execution from the Workspace owner. These checks protect the same ownership truth without freezing stale markup or a cache-busting string. They do **not** prove visual parity.
5. `target-experience.html` and `target_execution_runtime.js`
   - provide the existing DD Precision Tap viewport/plane hosts;
   - create the existing shared Precision Tap controller;
   - render the same transparent numbered marker class in live TARGET and preserved evidence.
6. `usm_proof_registry.js`
   - removes B27E and QT ID/prefix eligibility;
   - admits only complete additive numeric-region scoring results with a finite score and positive observation count.

SEC actions, Session Details, SEC presentation, authority, target contracts, geometry, and UGO were not changed by this follow-up.

No target contract, physical geometry, scoring rule, UGO authority, target identity, or accepted physical-floor record was changed.

## Verification

- `qt_printer13_universality_contract_test.mjs`: PASS.
- `qt_printer13_universality_browser_test.mjs`: PASS desktop; PASS 390px; shared palette/control state and no-overflow checks; disabled/current/neutral action-state checks; collapsed/open/keyboard disclosure checks; existing Precision Tap owner present; wheel zoom active; transparent numbered marker verified; registered image, RESULT, SEC save, signed exact reopen, three exact markers.
- `qt_printer13_m16a2_fixture_lifecycle_test.mjs`: PASS specialized M16A2 lifecycle.
- Pre-QT generic regression: 251/251 contracts and 8/8 mature adapters byte-identical to Snapshot 27 floor; PASS.
- Approved universal RESULT recovery: PASS.
- Universal Counting drawer: PASS.
- QT Scoring→USM contract: PASS.
- Universal SEC shell: PASS.
- SEC/Ballistic Vault architecture: PASS.
- Independent-browser portable exact reopen contract: PASS.
- Episode 54 shared components/workspace/actions/duplicate-retirement contracts: PASS.
- Accepted physical lifecycle evidence remains 200/200 PASS with 0 UGO failures and 0 lifecycle failures.

## Cleared evidence board

| Question | Evidence and applicability result | Classification |
|---|---|---|
| Shared palette / typography / buttons / spacing / responsive shell | QT consumes `styles.css`, `platform-ui.css`, shared application header/navigation, Workspace, Processing, and Actions. Browser verification at 1280×900 and 390×844 proves an explicit dark/gold header and primary-action treatment, readable contrast, no horizontal overflow, disabled unavailable actions, enabled current action after a valid observation, and neutral available Undo/Clear controls. | PROVEN |
| Target-specific cards and layouts | Current DD target families deliberately have distinct zeroing, competition, diagnostic, and target-result presentations driven by their capability. There is no single existing DD owner whose exact card geometry can truthfully replace every target-specific layout. QT retains target-specific RESULT intelligence behind the common visual/interaction floor. | N/A to exact cross-family sameness; see Founder input if further normalization is desired |
| Markers and Precision Tap states | Existing DD `SCZN3SmartTargetWorkspace.createPrecisionTap()` owns capture/zoom/pan. Existing shared marker CSS owns the transparent hole and detached number. Desktop/mobile browser verification proves the owner, zoom, marker transparency, state transition, and lifecycle persistence. | REPAIR→PASS |
| Non-SEC drawers and controls | Scoring/Counting details default collapsed; the complete row is interactive; native keyboard activation works; History and repeated-object controls retain explicit selection/expanded state. Browser verification covers collapsed/open/keyboard behavior at desktop and 390px. These disclosures expose target-specific intelligence and do not require identical content. | PROVEN |
| SEC accordion/drawers | A shared owner and one-open lifecycle exist, but the current mature family expression after merged rewrites is the held SEC question. | FOUNDER INPUT REQUIRED |
| PLAYER / audio | `SCZN3SelfTeachingPlayer` is a reusable player engine, but current programs are authored target/workflow lessons: Baker and M16A2 with target-specific narration/audio/choreography. No generic player program or applicability contract exists for ordinary scoring/counting/evidence targets. QT M16A2 already inherits its specialized road; generic QT correctly receives no fabricated narration. | N/A for generic QT; PROVEN for the applicable M16A2 exception |
| Analysis presentation | Existing DD analysis is capability-owned: zeroing correction, GSSF scoring analysis, diagnostics, and other governed packages. Generic QT already renders its governed counting/scoring/evidence result and USM where eligible. Importing a specialized DD analysis into an unrelated target would flatten target truth. | PROVEN where governed; N/A where no analysis package applies |
| Shooter/equipment context outside SEC | M16A2/Baker use equipment because their correction/training behavior depends on it. Ordinary QT scoring/counting/evidence execution has no proven equipment-dependent calculation or universal pre-result context panel. | N/A for generic QT; PROVEN for applicable specialized targets |
| Shooter/equipment/session context inside SEC | This is part of the held SEC content/action/presentation decision and was not changed. | FOUNDER INPUT REQUIRED |
| Navigation, identity, processing, action state, RESULT, Vault, History, signed reopen | Covered by shared-owner contract tests plus desktop/mobile lifecycle verification. | PROVEN |

The three protected HOLDs are not Universality gaps. Their exact physical boundaries remain unavailable because of printed occlusion; this pass did not reopen or alter them.

## FOUNDER INPUT REQUIRED

1. **SEC family truth.** Select the accepted current family expression for SEC content, actions, Session Details, shooter/equipment context, drawers, and mobile/desktop presentation after the merged rewrites. QT structural consumption is proven; no SEC choice or repair was made.
2. **Cross-family visual normalization beyond the shared floor.** The current DD has one shared platform palette/control/Workspace floor but intentionally different capability-owned card and analysis layouts. Decide only if Founder wants an additional single visual expression imposed across those target-specific experiences. Cody did not choose one by similarity.

Everything else on the requested evidence board is classified PROVEN, REPAIR→PASS, or N/A. **No TRUE GAP is established.**

No commit, push, or deploy was performed.
