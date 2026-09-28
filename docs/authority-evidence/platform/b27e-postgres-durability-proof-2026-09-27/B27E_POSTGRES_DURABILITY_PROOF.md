# B27E Postgres Durability Proof — 2026-09-27

## Boundary

The 25 recovered pre-durability B27E SEC artifacts remain quarantined development evidence. None was imported, reconstructed, or restored into this runtime.

This proof uses only sessions created after the Episode 64 Founder-review authority was switched from `MemoryStore` to the existing Postgres session and preserved-SEC stores.

## Isolated durable store

- Database: `sczn3_b27e_durability_review_20260927`
- Scope: local review only
- Initial rows: 0 preparations / 0 authoritative sessions / 0 preserved SECs
- Migrations: existing numbered Backend Authority migrations 001–007
- Production database/state: untouched

## Fresh sessions

### Session #060

- Session ID: `sczn3-session-3a2e55dc-b855-46ef-8356-1e9be14b97be`
- B27E Black
- 6 taps
- 6 hit / 0 missed
- Score: 59
- Preserved artifact SHA-256: `19f498dad9903a765f3d87e127954cdd3b4f6838ecbf93e76ff3467dab92246c`
- UGO coordinates: 6/6

### Session #061

- Session ID: `sczn3-session-41c33ed8-5f35-4283-acf4-f491b0409762`
- B27E Black
- 4 taps
- 4 hit / 0 missed
- Score: 40
- Preserved artifact SHA-256: `096362c16ac0f02c58004fa4d379a05fa0284801a511e39787fc80e23587577a`
- UGO coordinates: 4/4

## Database reconciliation before restart

- `session_preparations`: 2
- `authoritative_sessions`: 2
- `preserved_secs`: 2

Each preserved SEC joins to its exact authoritative session record.

## Browser journey before restart

Both fresh sessions completed the real visible road:

`registered B27E target → taps → governed RESULT → SAVE SEC → Ballistic Vault → OPEN SEC → exact preserved session`

Session #060 visibly reopened with the same B27E identity, six markers, 6/0/6 reconciliation, score 59, and scoring distribution. Session #061 was independently preserved with 4/0/4 and score 40.

## Process-restart proof

The port 8118 authority process was stopped completely and a new process was started against the same isolated Postgres database and the same review-only signing-key custody.

After restart:

- Durable enumeration returned exactly the two fresh session IDs and two artifacts.
- The exact signed Session #060 URL visibly reopened as `Saved Session Opened` with the same target, six UGO markers, 6/0/6 result, score 59, and distribution.
- The exact signed Session #061 URL visibly reopened as `Saved Session Opened` with the same target, four UGO markers, 4/0/4 result, score 40, and distribution.
- B27E History displayed exactly two chronological preserved sessions: #060 and #061.
- History displayed Score, Hit Rate, and Points per Tap for both sessions.

## Browser-storage-independent supporting proof

After restart, a clean HTTP client with no browser storage presented only the signed session capability and exact session ID. The durable authority returned Session #060 with:

- HTTP 200
- exact artifact SHA-256 match
- B27E identity
- 6 taps
- score 59
- 6/6 canonical UGO coordinates

No capability token or signing key is recorded in this report.

An actual second browser family was unavailable in the connected browser environment, so a second-browser visual run is **NOT PROVEN** here. Exact signed-URL portability is supported by the clean-client proof and existing portability regression.

## Regression floor

- Durable Founder-review store binding: PASS
- Independent-browser exact-reopen capability contract: PASS
- B27E USM History contract: PASS
- Canonical RESULT → SEC → Vault → exact-reopen ownership: PASS
- Pre-QT preservation boundary: 251/251 contracts and 8/8 mature adapters unchanged
- Pre-QT generic road: 18/18 representative targets retain the approved executor/adapter, RESULT, and UGO projection road

## Result

**POSTGRES PROCESS-RESTART DURABILITY: PASS**

**SECOND-BROWSER VISUAL ACCEPTANCE: NOT PROVEN**

## Founder acceptance

Founder visually accepted the fresh durable B27E road on 2026-09-27 after the authority process was restarted. The accepted road included the preserved session, governed scoring presentation, Scoring Distribution, B27E History/USM presentation, and selected-session details operating together.

This acceptance does not change the separate second-browser evidence statement above: a true second-browser visual run remains **NOT PROVEN** because that browser context was unavailable. It also does not require resurrection of the 25 pre-durability development sessions; those remain quarantined development evidence.

**B27E USM PRODUCT DESIGN: FOUNDER APPROVED**

**B27E FRESH-SESSION DURABLE ROAD: FOUNDER APPROVED**
