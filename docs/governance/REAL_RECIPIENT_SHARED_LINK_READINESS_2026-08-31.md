# Real-Recipient Shared-Link Readiness

**Date:** 2026-08-31  
**Result:** READY  
**Production surface:** `https://tap-n-score.com/`

## First real-recipient campaign

Use one bounded campaign ID for one recipient group or sharing moment:

`founder-baker-first-recipients`

Share only this link with recipients:

`https://tap-n-score.com/?ref=founder-baker-first-recipients`

Founder view:

`https://tap-n-score.com/ops.html?campaign=founder-baker-first-recipients`

The production Dashboard was opened with that exact campaign before sharing. It reported Live / Supabase Connected / Healthy and seven clean zeroes:

`0 arrivals → 0 TST starts → 0 TST completions → 0 real Tap-n-Score starts → 0 results → 0 saves → 0 returns`

No recipient activity was manufactured.

## Tomorrow's procedure

1. Choose a short lowercase campaign ID using only letters, digits, hyphens, or underscores. Maximum length is 64 characters.
2. Use a new ID for every group or sharing moment Founder wants to distinguish. Do not reuse an old campaign if separate counts matter.
3. Before sending, open `https://tap-n-score.com/ops.html?campaign=<campaign>` and confirm the selected campaign name and a clean zero baseline.
4. Send recipients only `https://tap-n-score.com/?ref=<campaign>`.
5. Reopen the campaign Dashboard after recipients have had time to use it. Use Today / This Week / This Month / This Year / All Time as needed.
6. Read the funnel left to right:

   `Arrived → TST Started → TST Completed → Real Tap-n-Score → Results Produced → Sessions Saved → Returned`

7. Compare a second audience with a different campaign ID rather than combining them under one label.

## What the counts mean

- Counts are distinct anonymous arrival IDs, not raw button clicks.
- Replaying TST or repeatedly pressing the same control does not inflate a visitor's stage count.
- `RETURNED` means the anonymous browser began a later arrival after at least a 30-minute separation.
- Campaign attribution remains in same-origin session storage through the relevant journey.
- Telemetry failure remains non-blocking to the shooter experience.

## Privacy boundary

This funnel records bounded campaign attribution and anonymous progression only. It does not collect names, email addresses, location, browser fingerprints, photographs, target evidence, SEC content, or equipment records. Existing SCZN3 evidence/session preservation remains separate and unchanged.

## Verification

- Production Dashboard campaign selection and clean zero baseline — PASS
- Production database / telemetry health — PASS
- Distinct campaign view versus All shared links — PASS
- Founder shared-link activity contract — PASS
- Pulse Check access-governance contract — PASS

## Practical boundary

Do not open the recipient share link merely to check it before sending; doing so creates a legitimate arrival. Verify readiness from the campaign Dashboard, then let the first arrival belong to the first real recipient.
