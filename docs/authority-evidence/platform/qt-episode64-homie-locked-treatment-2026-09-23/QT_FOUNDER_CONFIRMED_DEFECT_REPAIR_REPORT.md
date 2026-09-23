# QT Founder Review — Confirmed Defect Repair

Status: **PASS — Founder acceptance pending**

## Root cause and first divergence

- Tap display: the first divergence occurred in TARGET presentation immediately after the click. Status feedback wrapped, increased the intro block height, and moved the rendered image. The saved source-image coordinate did not move.
- 530 classification: the contract registered a generic 3-top/2-bottom bull layout against artwork that is 2-top/1-middle/2-bottom. This was a one-chair implementation-registration defect.
- Prior false PASS: tests checked internal numeric equality and generated observations from the same geometry under test; they did not assert the original physical browser click against post-feedback rendered bounds or independently challenge 530 registration.

## Scope and repair

- 254/254 QT chairs rescoped.
- 253 contract-driven chairs share the repaired target-experience presentation road.
- 1 inherited Zeroing chair uses a separate road and is unaffected.
- 1/254 chair required registration correction: `QT-PRODUCT-1873655562313` (530 Paper Target).
- Homie's capability, target meaning, and region identities were preserved.

## Verification

- Real rendered projection: **8/8 PASS** across narrow and desktop viewports, 5-Spot, 530, and QT aspect-ratio extremes.
- Lifecycle: **254/254 PASS**, **0 FAIL**.
- Coordinate persistence: **254/254 PASS**.
- Scoring/counting reconciliation: **253/253 PASS**.
- Vault evidence: **254/254 PASS**.
- Vault result: **254/254 PASS**.
- Target fit/aspect: **254/254 PASS**.
- 530 Founder replay: **10 total · 10 valid bull hits · 0 missed · 5/5 bulls · 2 taps per bull**, preserved through exact reopen.

Automated repair verification is complete. **Founder visual acceptance remains pending.**
