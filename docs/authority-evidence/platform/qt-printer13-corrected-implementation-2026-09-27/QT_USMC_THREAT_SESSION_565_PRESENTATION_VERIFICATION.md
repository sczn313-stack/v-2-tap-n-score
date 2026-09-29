# USMC-THREAT Session #565 Presentation Verification

Status: **CODY PASS · FOUNDER ACCEPTANCE PENDING**

## Scope

Presentation-only change for target profile `qt_printer13_product_1891723542601`.
Backend Authority, target geometry, classification, hit/miss logic, UGO coordinates,
governed counts, Hit Rate, and the five governed zones were not changed.

## Preserved truth used

- Session: `Session #565`
- Session ID: `sczn3-session-503bbe9d-86c1-4367-ba39-73db7b18919c`
- Immutable artifact SHA-256: `9a11c253b8de7a03244baef0aa85c3227f1fc8462f56a9803ae94ccd3cda775a`
- Result: `17 HIT TAPS | 9 MISSED | 26 TOTAL TAPS`
- SCZN3 Hit Rate: `65.4%`
- Coverage: `17 of 26 taps hit valid regions`; `5 of 5 target objects hit`
- Zone counts: 5-inch Circle Head Zone `2`; Outline of Head Zone `2`;
  10-inch Center Chest Zone `6`; 19.5-inch Center Mass Zone `2`;
  Full Polygonal Pelvic Zone `5`.
- Reconciliation: `2 + 2 + 6 + 2 + 5 = 17`; `17 + 9 = 26`.

## Presentation result

- The five always-expanded cards are absent for USMC-THREAT.
- One collapsed `ZONE DETAILS` disclosure is shown beneath the unchanged primary result.
- Opening it shows each governed zone name exactly once with its count.
- RESULT, SEC, Ballistic Vault, and exact reopen all consume the shared
  `approvedResultComponent`, so the same presentation is preserved throughout.
- The preserved target evidence contains all 26 original UGO observations; exact reopen
  returned the same immutable Session #565 artifact and displayed the same 26 markers.

## Browser evidence

- `QT_USMC_THREAT_SESSION_565_RESULT_COLLAPSED.png`
- `QT_USMC_THREAT_SESSION_565_RESULT_ZONE_DETAILS.png`
- `QT_USMC_THREAT_SESSION_565_SEC.png`
- `QT_USMC_THREAT_SESSION_565_VAULT_COLLAPSED.png`
- `QT_USMC_THREAT_SESSION_565_VAULT_ZONE_DETAILS_VIEWPORT.png`
- `QT_USMC_THREAT_SESSION_565_EXACT_REOPEN.png`

The Vault-to-SEC action was executed in the browser. Exact reopen returned
`Saved Session Opened` for Session #565 with the same target identity, 26 markers,
17/9/26 reconciliation, 65.4% Hit Rate, 5/5 coverage, and collapsed Zone Details.

## Regression evidence

- `node production/qt_usmc_threat_zone_details_test.mjs` — PASS
- `python3 backend/test_universal_counting_result_presentation.py` — PASS, 162/162
- `node production/b27e_history_tap_independence_test.mjs` — PASS
- `node --check target_execution_runtime.js` — PASS

No commit, push, or deploy was performed.
