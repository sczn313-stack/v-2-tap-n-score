# Baker 100 Yard 180° Registration Failure-Class Evidence

## Governing finding

A rotationally ambiguous center crop of the Baker 100 Yard face could satisfy the former feature-match, inlier, reprojection, and coverage gates while receiving a 180°-incorrect homography. The source photograph showed POIB below-left of aim, requiring RIGHT / UP movement. The incorrect canonical registration instead calculated 4 LEFT / 4 DOWN.

The calculation was internally consistent with the bad registration. Registration quality was therefore not sufficient evidence of orientation.

## Permanent controls

1. Every registered zeroing face declares asymmetric orientation anchors. Directional authority requires those anchors to prove TOP / BOTTOM / LEFT / RIGHT.
2. The release gate independently preserves and compares source taps, source POIB-to-aim direction, canonical observations, canonical POIB-to-aim direction, projected vector, and released correction.
3. Failure of either gate removes correction, clicks, shooter vector, confirmation authority, and SEC release. The shooter receives `TARGET ORIENTATION UNVERIFIED` or a source-reconciliation refusal, never a guessed direction.
4. Shared presentation guards prevent an old estimated package without orientation and reconciliation evidence from displaying or being newly preserved in the live result, SEC, or Ballistic Vault.

## Reproduction

The deterministic fixture is recorded in `BAKER_100YD_180_REGRESSION_EVIDENCE_V1.json`. It derives an 858 × 1200 JPEG from the governed canonical face using crop `[left 68, top 280, right 1047, bottom 1650]`, maximum dimension 1200, and JPEG quality 86.

The old transform was mathematically strong by the former gates: 34 mutual matches, 15 inliers, 0.3438 px RMS reprojection error, and 0.7101 canonical coverage. Its two negative principal axes reveal the 180° mapping, but that fact alone was not previously an admission gate.

Under the repaired authority:

- source direction: RIGHT / UP;
- incorrect canonical calculation retained only inside the audit envelope: 4 LEFT / 4 DOWN;
- orientation: unverified because the product-identity and QR anchors are absent;
- directional reconciliation: mismatch;
- released correction, clicks, and vector: null;
- SEC release status: withheld.

## Regression coverage

`backend/test_directional_registration_reconciliation.py` covers:

- correctly oriented perspective evidence;
- the deterministic Founder 4 LEFT / 4 DOWN failure condition;
- ambiguous 0° / 90° / 180° / 270° center crops;
- 90° / 180° / 270° full faces accepted only when asymmetric orientation is proven;
- all four quadrants and corresponding single-axis directions;
- source marker and projected vector anchoring;
- independent rejection of tampered correction direction or vector endpoints;
- withheld audit/SEC release.

The supported M4, standard Baker M16A2, and Baker 100 Yard registrations are exercised alongside this regression.
