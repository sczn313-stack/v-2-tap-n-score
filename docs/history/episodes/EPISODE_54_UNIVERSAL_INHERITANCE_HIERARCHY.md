# Episode 54 — Universal Inheritance Hierarchy

Status: CLOSED — Founder Approved

Date opened: 2026-08-16

Founder decisions incorporated: 2026-08-16

Date closed: 2026-08-16

Implementation: Items 1–9 complete and Founder Approved

Restore boundary: Snapshot 5 — Pre-Universality Baseline

Target Five — IDPA: Architecture gate satisfied; implementation not authorized

## Mission

Define what universality means inside SCZN3 and establish the inheritance hierarchy that existing and future Smart Targets must follow.

> Universal means one authoritative implementation inherited by every applicable Smart Target—not separate implementations made to look alike.

Universality is the governance and inheritance rule. It is not a required naming prefix for platform components.

## Founder-approved platform terminology

```text
SCZN3 Platform
│
├── Smart Target Workspace
│   └── Target Adapter
│
└── SEC Framework
    ├── Shared Components
    ├── Scoring Presentation Families
    └── Target Adapter
```

The platform uses clean functional names. New implementation names shall not be prefixed with `Universal` merely because they participate in universal inheritance.

## Founder-approved structural decisions

1. Evidence → Measurement → Recommendation → Execution → Validation → Preservation are ordered semantic contents inside the existing SEC outer shell. They are not six replacement accordions.
2. Result is a cross-family primary-answer component, not a seventh structural stage.
3. A target adapter may omit an inapplicable component. Applicable components may not be reordered.
4. Qualification / Pass-Fail remains reserved until a backend-authoritative qualification package exists.
5. The proven viewport and workspace behavior currently demonstrated by the Baker SL-ST1 experience is the source for extraction into the SCZN3 Smart Target Workspace. Baker mission logic is not part of that extraction.

## Ownership boundary

> The target controls the inside. SCZN3 controls the outside.

The SCZN3 Platform owns:

- outer workspace and SEC structure,
- viewport allocation,
- section/container grammar,
- responsive behavior,
- navigation,
- processing presentation,
- shared action regions,
- semantic component order,
- preservation entry points,
- reopen lifecycle,
- shared typography and spacing.

Target adapters supply:

- authoritative target and mission identity,
- content models for applicable shared components,
- evidence requirements,
- the registered Scoring Presentation Family,
- backend-produced results and mission-specific language.

Target adapters must not supply alternative shell markup, shell geometry, accordion behavior, navigation systems, viewport behavior, or competing processing systems.

### Partnership identity layer

Partnership identity is governed data rendered in platform-owned optional surfaces. It is not an architecture owner and does not alter the locked platform hierarchy.

A Partnership / Publisher Identity Surface may present an authoritative:

- publisher,
- printer,
- manufacturer,
- range,
- organization,
- commercial or distribution partner.

The SCZN3 Platform owns the surface and its behavior. Governed partner data supplies the identity and destination. Target authority remains independent. When no authorized partner identity applies, the surface is omitted without changing layout or workflow.

## Persistent Target Profile Identity — Founder locked

> The shooter shall always be able to identify the active Target Profile throughout the Target Page, Results, SEC, and preserved SEC experience. Publisher or manufacturer identity is not part of this foundational profile identifier.

The persistent identity is target-driven and must be supplied from authoritative target identity. It identifies the target/profile and an applicable mission identity. It does not describe the Scoring Presentation Family.

Its presentation contract is:

```text
Target Profile Label • Mission Label (when applicable)
```

Examples:

- `100 Yard Bullseye • 100 Yard Zero`
- `M4 25m Zero • 25 Meter Zero`
- `GSSF Practice`
- `USPSA Practice Target`

`Highest Score Wins` and `Lowest Score Wins` remain valid Scoring Presentation Families. They are not Target Profile Identity values.

Publisher and manufacturer attribution may remain in catalog, provenance, authority, evidence, purchase, and product-information surfaces. It must not be used to construct the persistent Target Profile Identity.

The authoritative identity contract must keep these concerns distinct:

- `targetProfileId`
- `targetProfileVersion`
- `targetProfileLabel`
- `missionLabel` when applicable
- `publisherIdentity` when applicable
- `productIdentity` when applicable

The frontend renders the authoritative profile identity. It does not derive it by stripping publisher text from a product name.

## Smart Target Workspace

Every applicable Smart Target inherits one platform-owned workspace containing:

- Persistent Target Profile Identity
- Target image/evidence area
- Session state
- Shooter action hierarchy
- Processing state
- Mobile and desktop viewport behavior
- Shared spacing and typography
- Shared navigation behavior
- SEC transition

Source behavior for extraction: the constrained Baker SL-ST1 workspace layout.

The extracted behavior includes:

- viewport below the application header,
- `minmax(0, 1fr)` evidence row,
- `auto` action row,
- contained target image,
- action regions that never obscure evidence,
- photo decode before workspace presentation,
- stable pending, failure, retry, and success states.

It excludes Baker target identity, scoring, registration, endpoints, evidence rules, and mission state.

## SEC Framework

Every SEC inherits the existing shared outer shell:

- Target
- Session
- optional mission section such as Sight Correction
- Preservation actions

Inside the shell, applicable contents follow this semantic order:

1. Evidence
2. Measurement
3. Recommendation
4. Execution
5. Validation
6. Preservation

Result is a primary-answer component placed within the applicable semantic content:

- Zeroing / Correction: Result leads Recommendation.
- Highest Score Wins: Result leads the scored Measurement presentation.
- Lowest Score Wins: Result leads the timed/penalty Measurement presentation.
- Qualification / Pass-Fail: Result leads Validation when an authoritative qualification package exists.

Omission is permitted only when the component genuinely does not apply or authoritative data is unavailable. Remaining applicable contents keep their order.

## Shared Components

### Evidence

Shared presentation supports:

- target image,
- captured bullet-hole or shot evidence,
- aim reference when applicable,
- authoritative overlays,
- POIB when applicable,
- evidence labels,
- consistent sizing and framing.

Target evidence and overlay semantics remain target-specific inputs.

### Measurement

Shared presentation supports backend-authoritative measurements such as:

- POIB,
- offset,
- group measurements,
- accuracy,
- precision,
- time,
- penalties,
- zone counts and subtotals,
- other registered mission metrics.

### Result

One primary-answer component renders a backend-authoritative result using the registered Scoring Presentation Family. It never calculates or repairs the result.

### Recommendation

One presentation architecture communicates the backend-authoritative next action, including correction, coaching, re-fire instruction, stage guidance, or no-action-required state.

### Execution

One presentation architecture communicates an action the shooter must perform, including mechanical adjustment, repetition, next stage, or confirmation evidence.

### Validation

One presentation architecture answers whether the intended action or mission outcome succeeded. Qualification / Pass-Fail is unavailable until the backend provides an authoritative qualification package and threshold provenance.

### Preservation

Live and saved SECs use the same evidence/result architecture. Preservation owns save state, preserved identity, History/Vault access, and exact-artifact reopening.

### Shared actions and visual language

The platform owns:

- buttons and action hierarchy,
- processing presentation,
- section headings,
- cards and metric grammar,
- typography and spacing,
- accordion lifecycle,
- responsive behavior.

## Scoring Presentation Families

The first platform boundary contains:

- Zeroing / Correction
- Highest Score Wins
- Lowest Score Wins
- Qualification / Pass-Fail — reserved, unavailable pending backend authority

The backend owns the result. The frontend renders only the presentation family registered for the authoritative result package.

## Target-specific backend authority

The following remain target- or mission-specific and must not be universalized into frontend logic:

- Target identity and version
- Publisher/product identity and provenance
- Target geometry
- Registration and coordinate transformation
- Scoring zones and ring dimensions
- Mission rules
- Hit classification
- Zone values and scoring formulas
- Penalty and timing rules
- Pass/fail thresholds
- Zeroing math
- Correction authority and rounding rules
- Confirmation and validation criteria
- Required evidence
- Target-specific authoritative coaching

These are authoritative inputs to the platform presentation system.

## Baker De-Specificity Audit

The audit classifies each occurrence by ownership and purpose, not by spelling alone. De-specificity does not mean removing Baker branding. It means assigning every occurrence to the correct layer.

### Three-layer classification

#### 1. Platform-foundational — extract or neutralize

SCZN3 owns architecture and behavior inherited by applicable targets. Platform owners must not be named for Baker or any future partner.

#### 2. Partnership / Publisher Identity Surface — preserve and generalize

These locations intentionally carry governed publisher, printer, manufacturer, range, organization, or future partner identity. The location and capability remain. Hard-coded Baker assumptions become governed partner/publisher data. Baker remains visible when Baker is the authoritative partner.

#### 3. Baker-specific authority/content — retain

Baker remains the owner of its product identity, routes, SKUs, QR identity, artwork, provenance, ATPs, UGO geometry, registration evidence, scoring profiles, purchase destinations, backend authority, target-specific mappings, and Baker-specific validation.

### Re-audit of the 18 ownership areas

1. **Workspace viewport and layout — Platform-foundational**
   - Current: `t/baker/sl-st1/target-page.css` `.sl-page-shell`, `.sl-workspace`, `.sl-image-frame`, and `.sl-workflow-dock`.
   - Destination: Smart Target Workspace layout.

2. **Workspace photo lifecycle — Platform-foundational**
   - Current: `t/baker/sl-st1/target-page.js` photo decode, pre-selection hiding, evidence reveal, retry/replace presentation, and visible-viewport synchronization.
   - Destination: Smart Target Workspace controller.

3. **Workspace header and navigation markup — Platform-foundational**
   - Current: `t/baker/sl-st1/index.html` and `.sl-app-header` rules.
   - Destination: SCZN3 application shell/navigation. A distinct partner-attribution slot may be supplied inside this shell where appropriate.

4. **Persistent Target Profile Identity placement — Platform-foundational**
   - Current: hard-coded `.sl-header-target-identity` text.
   - Destination: platform identity component consuming publisher-neutral authoritative profile identity.

5. **SEC save, share, export, notes, and History actions — Platform-foundational**
   - Current: `baker_sl_st1_sec.js` `actionBarHtml()` and `data-baker-*` handlers in `target-page.js`.
   - Destination: SEC Framework preservation/action controller.

6. **Optional Session Details invitation and form — Platform-foundational**
   - Current: `baker_sl_st1_sec.js` `detailsInvitationHtml()` and Baker-prefixed handlers/styles.
   - Destination: Shared Session Details component. Target adapters supply fields and values.

7. **Evidence framing and numbered marker presentation — Platform-foundational**
   - Current: Baker-prefixed evidence frame, viewport, impact layer, and marker selectors.
   - Destination: Shared Evidence component with adapter-supplied coordinates and accessible labels.

8. **Live SEC sizing and evidence/result responsiveness — Platform-foundational**
   - Current: combined Baker content selectors and shared SEC rules.
   - Destination: SEC Framework layout primitives. Baker score content remains adapter-owned.

9. **Processing integration around Show Results and persistence — Platform-foundational**
   - Current: Baker Target Page route wiring.
   - Destination: Smart Target Workspace and SEC Framework operations using the shared processing component.

10. **Vault evidence/result adapter boundaries — Platform-foundational**
    - Current: Baker-specific branching in `records.html` controls shared thumbnail/result placement.
    - Destination: preserved-SEC adapter contract. Baker supplies evidence/result models; the Vault controls placement.

11. **Historical SEC outer rendering — Platform-foundational**
    - Current: route/product functions in `records.html`, including `renderBaker100YardReferenceSec()`.
    - Destination: SEC Framework plus Target Adapters.

12. **Persistent profile display labels — Platform-foundational**
    - Current: mixed hard-coded target, product, manufacturer, and mission strings in `shoot.html`, `records.html`, and Baker page markup.
    - Destination: authoritative `targetProfileLabel` and `missionLabel`. Publisher attribution is separated into a Partnership Identity Surface.

13. **Platform session storage and state identity — Platform-foundational**
    - Current: `app_state.js` uses `SCZN3_BAKER_*`, `baker-session-*`, Baker defaults, and Baker-labelled warnings for multi-target state.
    - Destination: SCZN3 session/evidence storage with non-destructive backward-compatible reads.

14. **Equipment/setup storage — Platform-foundational**
    - Current: `matrix.html` uses `SCZN3_BAKER_SAVED_SETUPS` for shared setups.
    - Destination: SCZN3 Equipment Library storage with non-destructive compatibility migration.

15. **Pending profile and identity resolution — Platform-foundational with Baker authority separated**
    - Current: `smart_target_identity.js` mixes general pending-profile/navigation behavior with Baker M4 SKU/vendor/product resolution.
    - Destination: general target-profile resolution in the platform; Baker M4 QR/product resolution retained in the Baker target/product adapter.

16. **Scored Vault layout family — Platform-foundational**
    - Current: `.vault-record-summary--baker-scored` controls a layout applicable to scored SECs.
    - Destination: Scoring Presentation Family/preserved-result layout. Baker result values remain adapter-owned.

17. **Runtime target branching — Platform-foundational with Baker adapter keys retained**
    - Current: `shoot.html`, `matrix.html`, `m4_runtime.js`, and `records.html` contain direct `isBaker*` checks inside shared orchestration.
    - Destination: Target Adapter registry and capability contracts. Exact Baker IDs remain registered keys.

18. **Home/application-shell design-origin names — Platform-foundational**
    - Current: `styles.css` and `shell.css` contain `Baker reference Home rebuild` and `.baker-resource` names.
    - Destination: neutral platform naming for shared shell/resource behavior. Actual Baker resource links and assets are separate occurrences classified below as Partnership Identity Surfaces or Baker-specific content.

### Partnership / Publisher Identity Surfaces — preserve and generalize

The following are valuable reusable partner capabilities, not architecture defects:

1. **Target introduction attribution**
   - Current Baker example: `.sl-printer` / `Baker Targets` on the SL-ST1 Target Page.
   - Generalize as governed partner/publisher attribution separate from Persistent Target Profile Identity.

2. **SEC publisher/partner bar**
   - Current Baker example: `.sec-publisher-bar` in `sec.html`.
   - Preserve the slot; populate it from governed partner identity and applicable commercial policy.

3. **History/Vault partner promotion**
   - Current Baker example: `.records-historical-promo` and `BakerTargets.com` in `records.html`.
   - Preserve as an optional governed partner surface. Absence of authorized partner data produces no promotion.

4. **Catalog publisher/product attribution**
   - Current Baker examples: Baker product names, artwork, descriptions, and purchase context in `target_experiences.js`, catalog cards, and target information.
   - Preserve product truth while keeping discovery labels and persistent profile identity governed separately.

5. **Evidence provenance/details**
   - Publisher/printer/product attribution may appear in Target Evidence provenance or details when supported by authority.
   - It must remain visually and semantically separate from Persistent Target Profile Identity.

6. **QR/product-entry attribution**
   - Current Baker example: Baker M4 vendor/SKU/QR resolution in `smart_target_identity.js`.
   - Retain Baker product resolution; expose it through a general partner/product-entry contract.

7. **Partner resource and purchase destinations**
   - Current Baker examples: `BakerTargets.com`, purchase links, partner artwork, and resource assets.
   - Preserve exact governed destinations and attribution. Never infer or substitute a partner.

8. **Future partnership surface contract**
   - The same slots may represent another printer, manufacturer, range, organization, or partner when governed identity and presentation authorization exist.
   - A partner surface is optional and may not alter platform structure, target authority, or Persistent Target Profile Identity.

### Baker-specific authority/content — retain

Retain Baker identity in:

- target profile IDs, target IDs, adapter IDs, and route aliases;
- Baker SL-ST1 and 100 Yard backend endpoints;
- authority packages, ATPs, UGO registrations, scoring profiles, and empirical registration evidence;
- canonical artwork and asset filenames;
- product/SKU identity and QR resolution;
- governed publisher identity and partner destinations;
- Baker-specific geometry, registration, classification, scoring, and validation tests;
- Target Adapters and their genuinely Baker-specific evidence and result mappings.

Representative retained owners:

- `backend/registries/smart_target_identity_registry.json`
- `backend/target_profiles/ATP_BAKER_SL_ST1_PRACTICE_V1.json`
- `authority-evidence/baker-sl-st1/`
- `backend/baker_sl_st1_registration.py`
- `backend/baker_sl_st1_scoring.py`
- `backend/baker_sl_st1_target_page.py`
- `sec_dispatch.js` Baker adapter identities
- `baker_sl_st1_sec.js` Baker adapter identity, evidence interpretation, and highest-score mapping

### Naming rules after extraction

Use:

- `SCZN3SmartTargetWorkspace`
- `SCZN3SEC`
- `SCZN3SECComponents`
- `SCZN3ScoringPresentation`
- `SCZN3TargetAdapters`
- neutral `data-sec-*`, `data-workspace-*`, and `data-action-*` hooks

Retain target-specific adapter namespaces such as `SCZN3BakerSLST1SEC` only while they contain Baker-specific mapping. Shared actions and layout behavior must leave those namespaces.

Founder decision: `SCZN3BakerSLST1SEC` may remain after extraction as the Baker-specific adapter namespace.

Do not replace Baker prefixes with `Universal` prefixes.

### Existing `Universal` implementation names to normalize

Episode 54 does not require disruptive renaming before behavior is consolidated, but the final ownership model should replace generic `Universal` prefixes with functional platform names where they describe infrastructure:

- `universal-ui.css` → platform UI/control ownership
- `sec-universal.css` and `.sec-universal-*` shell selectors → SEC Framework ownership
- `universalSecStageHtml()` → SEC Framework stage rendering
- `universalShooterActionBarHtml()` → SEC preservation/action rendering
- `.universal-app-header` and `.universal-header-menu` → application shell/navigation

Names that identify an actual registered mission or target concept, such as a governed Universal Practice target, are not renamed merely for containing the word `Universal`.

## Persistent identity traceability assessment

The current pipeline already transports authoritative identity keys through Target Page → backend result/session → SEC dispatch → preserved SEC:

- `targetProfileId` / `target_profile_id`
- target version or variant where registered
- mission family
- result package type
- target/product identity and provenance

The path is sufficient to carry the persistent identity, but the display contract is not yet complete for all four current targets:

- M4 has a publisher-neutral target name available.
- GSSF has a target profile label available.
- Baker SL-ST1 has a publisher-neutral product name available, but the live header currently hard-codes Baker identity.
- 100 Yard currently uses `Baker 100 Yard Smart Target` as both product name and visible target name; it needs an authoritative publisher-neutral `targetProfileLabel` distinct from publisher/product identity.

Therefore implementation must add or govern the separate authoritative display fields `targetProfileLabel` and optional `missionLabel` before the platform identity component replaces existing strings. The frontend must not invent these labels or substitute a Scoring Presentation Family for mission identity.

### Current authoritative identity values and approved Persistent Target Profile identities

The following publisher-neutral identities are Founder approved.

| Current experience | Current authoritative identity | Current mission/result authority | Current publisher/product identity | Approved `targetProfileLabel` | Approved `missionLabel` |
|---|---|---|---|---|---|
| M4 | `targetProfileId: m4_25m_zero`; `targetAuthorityId: M4_TARGET_AUTHORITY_v1_ORIGINAL`; `targetProfileVersion: M4_TARGET_AUTHORITY_v1_ORIGINAL`; `targetName: M4/M16 Series Weapons 25M Zero` | `missionFamily: zeroingCorrection`; `missionId: M4_25M_300M_ZERO`; `resultPackageType: zeroCorrectionResult` | Baker M4 product/SKU/QR identity exists separately in `smart_target_identity.js` | `M4 25m Zero` | `25 Meter Zero` |
| 100 Yard | `targetProfileId: baker_st_100yd_smart_zero`; `targetAuthorityId: BAKER_ST_100YD_SMART`; `targetProfileVersion: BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL`; `targetName: Baker 100 Yard Smart Target` | `missionFamily: zeroingCorrection`; `missionId: BAKER_100YD_ZERO`; `resultPackageType: zeroCorrectionResult` | Baker Targets / ST-100YD-SMART product and authority provenance | `100 Yard Bullseye` | `100 Yard Zero` |
| GSSF | `targetProfileId: gssf_ac_1`; `targetAuthorityId: gssf_ac_1`; `targetProfileVersion: 1`; `targetName: GSSF AC-1` | `missionFamily: gssf`; `missionId: GSSF_AC_1_PAPER_PENALTY`; `resultPackageType: gssfPaperPenaltyResult` | Glock Shooting Sports Foundation manufacturer/organization identity | `GSSF Practice` | omitted |
| USPSA practice / SL-ST1 | session authority key `baker_sl_st1`; `targetId: BAKER_SL_ST1`; `targetAuthorityId: BAKER_SL_ST1`; `targetProfileVersion: 1`; `targetName: Silhouette Target (USPSA)`; ATP `targetProfileId: baker_sl_st1_practice` | `missionFamily: smartEvidenceCapture`; `missionId: BAKER_SL_ST1_PRACTICE_EVIDENCE`; `resultPackageType: smartEvidenceResult` | Baker Targets; product `Silhouette Target (USPSA)`; SKU `SL-ST1`; variant `BAKER_SL_ST1_23X35_STANDARD_WHITE` | `USPSA Practice Target` | omitted |

The SL-ST1 row exposes an existing governed alias set—`BAKER_SL_ST1`, `baker_sl_st1`, and `baker_sl_st1_practice`. Episode 54 must preserve the exact registered identities while establishing one canonical Target Adapter resolution. This audit does not authorize changing those identifiers.

Publisher/partner presentation is a separate optional model. Scoring Presentation Family is a separate result-presentation model. Neither may be concatenated into `targetProfileLabel` or `missionLabel` by the frontend.

## Inheritance test

Change one platform-owned visual token once. Every applicable current Smart Target must inherit the change without editing its target adapter or mission stylesheet.

Recommended proof: override a shared SEC section-label accent/letter-spacing token in the test environment and assert the computed presentation on Baker SL-ST1, M4, GSSF, and 100 Yard real SEC routes.

The proof must show:

- one platform owner changed,
- all four applicable experiences inherited the change,
- no target adapter or target stylesheet changed,
- evidence, result, authority, and viewport geometry remained unchanged.

## Revised smallest implementation sequence

Each item is implemented, locally verified, and Founder-reviewed before the next item begins.

### Item 1 — Ownership and contract foundation

- Keep `SCZN3SEC` as SEC Framework owner.
- Move semantic card helpers out of the conflicting `window.SCZN3SEC` ownership in `sec_framework.js` into `SCZN3SECComponents`.
- Define target-adapter and semantic-component contracts.
- Define platform state/storage ownership and a non-destructive backward-compatible migration contract for legacy `SCZN3_BAKER_*` keys.
- Separate general target-profile resolution from Baker M4 product/QR resolution.
- Add fail-first ownership tests.
- No intended visual change.

### Item 2 — Identity-layer contracts

- Register the approved authoritative `targetProfileLabel` and optional `missionLabel` values for the four current experiences.
- Define a separate optional Partnership / Publisher Identity Surface contract using governed publisher/product data.
- Keep target profile, publisher, and product identities independently addressable.
- Add one shared identity component to the application shell, Smart Target Workspace, SEC Framework, and preserved SEC route.
- Add optional partner-attribution hosts only on approved catalog, provenance, evidence/details, authority, and commercial surfaces.
- Verify identity continuity and exact preserved values end to end.

### Item 3 — SEC adapter model

- Define one SEC view model with ordered semantic contents and a registered Scoring Presentation Family.
- Preserve the current Target / Session / optional mission section / Actions shell.
- Enforce omission without reordering.

### Item 4 — SEC migrations, one target at a time

1. Baker SL-ST1 contract migration; visual no-op expected.
2. 100 Yard migration out of inline historical rendering.
3. GSSF migration out of inline historical rendering.
4. M4 migration from the bespoke SEC shell into the SEC Framework.

Each target receives route, reopen, preservation, and responsive verification before the next migration.

### Item 5 — Shared component extraction

Extract one at a time:

1. Evidence
2. Measurement
3. Result and its presentation families
4. Recommendation
5. Execution
6. Validation
7. Preservation/actions
8. Session Details

Target adapters retain only authoritative content mapping.

### Item 6 — Smart Target Workspace extraction

- Extract the proven Baker viewport behavior into the platform workspace.
- Separate photo/evidence lifecycle from Baker endpoint, scoring, registration, and mission rules.
- Migrate Baker first, then M4, 100 Yard, and GSSF through target adapters.

### Item 7 — Shared responsive and action ownership

- Move shared responsive primitives, processing integration, buttons, action regions, navigation, and SEC preservation behavior to platform owners.
- Remove target-owned shell geometry only after parity is proven.

### Item 8 — Duplicate retirement

- Retire inline 100 Yard/GSSF SEC shell builders after adapter parity.
- Retire dormant or incompatible adapter paths after route coverage proves they are unused.
- Remove mission CSS selectors that control SEC shell structure.
- Remove Baker-prefixed hooks only when their behavior has moved to platform ownership.
- Retire legacy Baker-labelled platform storage writes only after compatibility reads and preserved-session recovery are proven.
- Normalize infrastructure-level `Universal` names to functional SCZN3 Platform names after imports and route contracts are migrated safely.

### Item 9 — Universality proof and IDPA gate

- Run the one-owner inheritance test against all four existing experiences.
- Run complete desktop and 390px lifecycle acceptance.
- Confirm no target-specific frontend edit is required to consume the shared shell/components.
- IDPA remains on hold until Founder approves this gate.

## Required validation

At desktop and 390px:

- authoritative Persistent Target Profile Identity across Target Page, Results/SEC, preserved SEC, direct reopen, Vault reopen, and history/timeline links;
- publisher/partner attribution remains separate from profile identity and renders only from governed data;
- absence of governed partner identity produces no fabricated or stale partner attribution;
- target photo load/decode and target containment;
- evidence acquisition and editing;
- immediate processing presentation and duplicate-request prevention;
- backend result dispatch and fail-closed behavior;
- correct Scoring Presentation Family selection;
- no frontend scoring, correction, or qualification inference;
- semantic order and valid omission behavior;
- one-open SEC accordion behavior and compact closed state;
- exact evidence preservation and artifact reopening;
- shared navigation and Equipment behavior;
- no horizontal overflow or target movement;
- one-owner inheritance-token propagation;
- target adapters free of platform shell markup and structural CSS;
- legacy state and preserved evidence remain readable after storage ownership migration;
- platform files no longer create new Baker-labelled state for non-Baker targets.

## Implementation-blocking ambiguities

None remain in this specification.

The visibility and default-open behavior of an optional Partnership / Publisher Identity Surface will be reviewed with the applicable component. That presentation decision does not block Item 1 and may not change the locked separation among Target Profile Identity, partnership attribution, Scoring Presentation Family, and Baker-specific authority/content.

The existing SL-ST1 identity alias set requires canonical Target Adapter resolution during implementation, but it does not require changing the governed identifiers and is not a Founder-decision blocker.

## Episode 54 implementation record

All nine governed implementation items were completed one at a time, locally verified, and Founder Approved:

1. Ownership contracts, namespace separation, and legacy-state migration contract.
2. Target-profile and partnership identity contracts.
3. SEC Adapter Model.
4. Four SEC adapter migrations: USPSA Practice, 100 Yard Zeroing, GSSF Practice, and M4.
5. Shared SEC component extraction.
6. Smart Target Workspace extraction.
7. Shared responsive, action, processing, and navigation ownership.
8. Duplicate retirement and functional naming normalization.
9. Four-target inheritance proof and IDPA architecture gate.

The resulting presentation path is:

> Backend Authority → Target Adapter → SEC Framework → SEC Shell

The resulting Target Page architecture is one platform-owned `SCZN3SmartTargetWorkspace` consumed by target-specific workflows. The resulting SEC architecture is one platform-owned shell and one shared component owner, with target adapters supplying authoritative content models rather than alternative structure.

## Controlled inheritance proof

Item 9 temporarily changed one safe SEC section-label accent property in the shared `sec-framework.css` owner.

- USPSA Practice Target inherited the change.
- 100 Yard Bullseye inherited the change.
- GSSF Practice inherited the change.
- M4 25m Zero inherited the change.
- No target stylesheet, adapter selector, or target renderer was changed.
- Reverting the single shared property restored all four.

The temporary purple test value was reverted before this checkpoint. It is not part of Snapshot 6 or the Post-Universality Baseline.

## Final architecture verdict

**Four-target inheritance proof: PASS.**

**IDPA architecture gate: SATISFIED.**

IDPA implementation is not authorized by this verdict. Episode 55 is reserved and not opened.

## Authorized unresolved footnotes

These pre-existing issues remain separately recorded and were not repaired during Episode 54 closeout:

1. Session 2 historical-point defect.
2. Equipment-preselection timeout.
3. Stale Episode 53 inline-M4 assertion.

None alters the Founder approval of Items 1–9 or the controlled inheritance proof.

## Closeout artifacts

- Snapshot 6 — Post-Universality Baseline.
- Checkpoint `SCZN3_EP54_POST_UNIVERSALITY_BASELINE_2026-08-16`.
- ZIP `SCZN3_EP54_POST_UNIVERSALITY_BASELINE_2026-08-16.zip` with external SHA-256 sidecar.
- Authoritative Episode Registry and Episode Index updated to record closure.

## Final authorization boundary

Episode 54 is closed and Founder Approved. This closeout authorizes preservation only. It does not authorize a commit, push, deployment, production promotion, IDPA implementation, Episode 55 opening, unrelated defect repair, or new feature work.
