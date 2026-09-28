# B27E USM Founder Acceptance — 2026-09-27

## Acceptance

Founder approved the current B27E Black Universal Scoring Model implementation on 2026-09-27. This record preserves the accepted, uncommitted Episode 64 working-tree state; it does not create a commit or claim Library-wide approval.

**USM — Universal Scoring Model**

**SCORE / HIT RATE / POINTS PER TAP**

USM does not replace target-specific scoring authority. It expresses performance after governed target scoring produces the result.

B27E is the first Founder-approved USM control implementation. Library-wide universality remains unproven.

## Accepted behavior

- One chronological B27E History across differing tap counts.
- SCORE, HIT RATE, and POINTS PER TAP use the same synchronized session timeline.
- Horizontal scrolling and selected-session highlighting remain synchronized across all three charts.
- Frozen chart labels, alternating session bands, and a gold selected-session band.
- `TAP ANY BULLET TO VIEW THAT SESSION` interaction guidance.
- Every point carries its session number and `MM/DD/YY` date.
- Selecting a point exposes that preserved session's arithmetic and exact historical `OPEN SESSION #___ SEC` action.
- Compact one-line History header: `3 · HISTORY | B27E BLACK` and `B27E DETAILS ▼`.
- Current-session SCORING DISTRIBUTION remains separate from History.
- Current hit/miss/total-taps presentation remains unchanged.
- B27E scoring authority, target geometry, UGO location authority, RESULT reconciliation, SEC evidence, Vault evidence, Backend Authority, and exact-reopen truth remain unchanged.

## Captured repository state

Exact HEAD before preservation:

`9f3c100b375779cfc95102bc45e59d05fe7d584c`

Exact working-tree status before preservation:

```text
 M docs/architecture/README.md
 M docs/authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23/QT_FOUNDER_TRANSFORM_CLASSIFICATION_BROWSER_VERIFICATION.json
 M docs/backend/executors/declarative_target_score.py
 M docs/backend/executors/smart_evidence_capture.py
 M docs/ballistic-vault.css
 M docs/production/founder_scale_batch_1_contract_test.mjs
 M docs/production/known_good_target_regression_contract_test.mjs
 M docs/production/qt_5spot_founder_defects_test.mjs
 M docs/production/qt_episode64_founder_review_server.py
 M docs/production/qt_founder_corrected_254_browser_test.mjs
 M docs/production/qt_founder_transform_classification_browser_test.mjs
 M docs/production/sec_vault_architecture_contract_test.mjs
 M docs/records.html
 M docs/sec_dispatch.js
 M docs/sec_framework.js
 M docs/sec_reopen_capability.js
 M docs/target-experience.css
 M docs/target-experience.html
 M docs/target_execution_runtime.js
?? docs/architecture/decisions/ADR-002_UGO_LOCATION_AUTHORITY.md
?? docs/authority-evidence/platform/b27e-usm-founder-acceptance-2026-09-27/
?? docs/authority-evidence/platform/qt-episode64-founder-homie-review-2026-09-23/
?? docs/authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23/QT_APPROVED_UNIVERSAL_RESULT_RECOVERY.md
?? docs/backend/target_knowledge/ugo_location_authority_standard_v1.json
?? docs/backend/test_pre_qt_generic_18_regression.py
?? docs/production/approved_universal_result_recovery_test.mjs
?? "docs/production/b27e_history_tap_independence_test 2.mjs"
?? docs/production/b27e_history_tap_independence_test.mjs
?? docs/production/canonical_preserved_lifecycle_test.mjs
?? docs/production/portable_exact_reopen_capability_test.mjs
?? docs/production/pre_qt_generic_road_regression_contract_test.mjs
?? docs/production/recover_qt_founder_homie_review.py
?? docs/production/ugo_location_authority_lock_test.mjs
?? docs/usm_proof_registry.js
```

The archive therefore preserves exact file bytes, not a commit-derived reconstruction. No commit, push, or deployment was performed.

## Final verification

- B27E USM formulas and History contract: PASS.
- Synchronized chart scroll: PASS; all chart scroll positions moved together.
- Synchronized selection: PASS; #055, #560, and #561 each selected across all three charts.
- #055 exact SEC: PASS — score 56, hit rate 100%, 9.3 points/tap, 6 markers.
- #560 exact SEC: PASS — score 51, hit rate 100%, 8.5 points/tap, 6 markers.
- #561 exact SEC: PASS — score 56, hit rate 50%, 4.7 points/tap, 12 markers.
- Current-session B27E RESULT reconciliation: PASS — Session #059, 3 hits, 0 misses, 3 taps, score 28; scoring distribution reconciled to 28.
- RESULT → SEC → Vault → exact reopen ownership: PASS.
- Independent-browser exact-reopen capability portability: PASS.
- UGO location-authority lock: PASS.
- Pre-QT contract preservation: PASS — 251/251 byte-identical.
- Mature adapter preservation: PASS — 8/8 byte-identical.
- Pre-QT generic architecture: PASS — 18/18 targets.
- Pre-QT backend authority/lifecycle: PASS — 18/18 targets.
- Approved universal RESULT recovery contract: PASS.
- `git diff --check`: PASS.

## Scope and preservation boundary

This archive is a source harvest and evidence package. It preserves the accepted implementation, direct dependencies, relevant verification, B27E authority references, and accepted visual evidence. It does not claim a standalone runtime restore. The local authority service used an in-memory preserved-session store; live session records and signing capabilities were not available as durable files at packaging time and are not represented as restorable runtime custody in this archive. The screenshots and recorded verification preserve the accepted session behavior as evidence, while the source preserves the machinery.

No product behavior was changed during preservation.
