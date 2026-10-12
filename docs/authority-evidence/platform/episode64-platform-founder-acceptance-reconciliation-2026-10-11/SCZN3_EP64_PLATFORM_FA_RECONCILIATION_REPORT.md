# Episode 64 — Platform Founder Acceptance Reconciliation

## Result

All **1993/1,993** census faces were reconciled exactly once. No Illustrated Master or staging-workbook status was treated as authority.

| Governing state | Count |
|---|---:|
| FOUNDER_APPROVED | 32 |
| FOUNDER_APPROVED_INHERITED | 253 |
| FOUNDER_OOS | 46 |
| FOUNDER_HOLD | 3 |
| UNVERIFIED | 1659 |

## Evidence policy

- Explicit durable Founder decisions and accepted checkpoints are authoritative.
- OOS is current scope and preserves historical approval/evidence.
- Machine lifecycle PASS is never promoted to Founder approval.
- Missing identity-level evidence remains UNVERIFIED.
- This isolated package does not rewrite target contracts, geometry, scoring, artwork, SEC records, or existing ledgers.
- The shared registry exposes one display state and one Founder-review eligibility flag per face; 334 approved/inherited/OOS/hold faces are excluded from reselection.
- Existing production Library code had no shared FA-registry hook. This pass supplies the canonical backend registry/reader; browser UI consumption is NOT PROVEN and no UI link restoration is claimed.

## THE 13 corrected matrix

| # | Printer | Master | Target | FA state | Recommendation | Reason |
|---:|---|---:|---|---|---|---|
| 1 | American Target Company | 251 | A 23/3 | UNVERIFIED | HOLD | Live FA is unverified and deterministic #4 provenance remains unproven |
| 2 | Speedwell Targets | 687 | AR 5/10 10 Meter Air Rifle 12 Bulls | FOUNDER_APPROVED | REPLACE RECOMMENDED | Already Founder approved |
| 3 | Baker Targets | 428 | B27E Target-Oval | UNVERIFIED | HOLD | Live FA is unverified and deterministic #4 provenance remains unproven |
| 4 | Birchwood Casey | 501 | 12" X 18" Gunslinger Silhouette Dirty Bird Target | UNVERIFIED | HOLD | Live FA is unverified and deterministic #4 provenance remains unproven |
| 5 | Highwild | 681 | Shooting Range Silhouette Paper Target - 17X25 Inches (White & Black) | UNVERIFIED | HOLD | Live FA is unverified and deterministic #4 provenance remains unproven |
| 6 | Splatterburst Targets | 817 | 18” x 24” Triple Silhouette Splatter Target | UNVERIFIED | HOLD | Live FA is unverified and deterministic #4 provenance remains unproven |
| 7 | Champion / Primos | 149 | Visicolor Targets - Dartboard | FOUNDER_OOS | REPLACE RECOMMENDED | Founder OOS |
| 8 | EZ Aim / Allen | 156 | EZ Aim® Fun Dialing In More Fun Paper Shooting Targets, 12”W x 12”H | UNVERIFIED | REPLACE RECOMMENDED | Commercial/package identity is not an individual executable face |
| 9 | U.S. Target | 246 | Poker | FOUNDER_OOS | REPLACE RECOMMENDED | Founder OOS |
| 10 | Baker Targets | 92 | Googly Ghosts Target | UNVERIFIED | HOLD | Live FA is unverified and deterministic #4 provenance remains unproven |
| 11 | GunFun | 172 | Bowling Pins (21050) | FOUNDER_APPROVED_INHERITED | REPLACE RECOMMENDED | Already Founder approved |
| 12 | The National Target Company | 218 | Javelina Lifesize Game Target | UNVERIFIED | HOLD | Live FA is unverified and deterministic #4 provenance remains unproven |
| 13 | Thompson Target | 231 | Bo-Bo Clown - Paper Zombie Shooting Targets - 19"x25" | UNVERIFIED | HOLD | Live FA is unverified and deterministic #4 provenance remains unproven |

## Exceptions and limits

- Deterministic printer ordering and exact fourth-eligible provenance are not established by the durable sources inspected; the eight otherwise unresolved candidates remain HOLD rather than being guessed.
- This pass adds the shared machine-readable FA registry and selection fields, but does not claim an existing UI consumed a registry that did not previously exist.
- Runtime links restored: 0. No broken runtime link was changed or verified in this reconciliation-only assignment.
- No external research, target implementation, contract mutation, push, or deployment was performed.
