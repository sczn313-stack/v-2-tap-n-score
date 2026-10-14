# Sink-a-Ship Founder geometry correction

Founder retested the corrected target and recorded **PASS** on 2026-10-13. The correction evidence below remains the technical basis; machine proof is not substituted for the Founder decision.

## Root cause

The registered 400 × 531 representation and the precision-tap projection used the same normalized source-image coordinate plane. The live desktop projection was one-to-one: the image and precision plane had identical rendered bounds, `object-fit: fill`, and no hidden crop or letterbox offset. The original Founder coordinates were preserved correctly.

The defect was the Backend geometry admitted for SKU 11160. Its physical circle centers were hand-entered approximations. The earlier machine proof generated test taps from those same approximations, so it could pass without proving correspondence to the identified physical target. That was a circular proof.

## Repair

UGO recalibrated the complete 25-circle target plane against the identified GunFun SKU 11160 physical target and its governed 19 × 25 inch plane. The registered artwork is used only to establish representation correspondence; pixels are not promoted to physical authority. No individual tap patch exists.

The preserved Founder Session #004 observations are stored unchanged in `FOUNDER_193_14_TAP_REGRESSION.json`. Taps #1, #2, and #3 are permanent independent regressions.

## Corrected 14-tap replay

- Taps #1–#3: Aim Circles 18, 19, and 20 — HIT.
- Tap #4: Aim Circle 16 — HIT.
- Tap #5: Aim Circle 17 — HIT.
- Taps #6–#7: Aim Circles 14 and 15 — HIT.
- Taps #8–#14: outside every governed aiming circle — MISS.
- Reconciliation: **7 HIT / 7 MISSED / 14 TOTAL**.

The regression independently preserves and reopens the classification ledger through RESULT → SEC → Vault → exact reopen.

## Permanent verification lesson

A geometry implementation cannot validate itself by generating its expected taps from the same candidate boundaries. Physical-correspondence fixtures must come from an independent governed source—such as preserved Founder observations or independent physical measurement—and must remain unchanged while the candidate geometry is evaluated. The three preserved Founder observations above are permanent regressions for this rule.
