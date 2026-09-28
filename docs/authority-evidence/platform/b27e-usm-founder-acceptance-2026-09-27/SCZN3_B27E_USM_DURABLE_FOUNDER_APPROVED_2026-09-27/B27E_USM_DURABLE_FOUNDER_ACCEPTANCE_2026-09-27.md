# B27E USM Durable Founder Acceptance — 2026-09-27

## Founder locks

**B27E USM product design — FOUNDER APPROVED.**

**B27E fresh-session durable road — FOUNDER APPROVED.**

This record extends, but does not rewrite, the earlier B27E product-design acceptance. The earlier source-only archive remains preserved as its own milestone.

## Accepted product floor

- B27E is the only approved USM control implementation.
- USM presents **SCORE / HIT RATE / POINTS PER TAP** above unchanged governed B27E scoring.
- Current-session RESULT and Scoring Distribution remain separate from History.
- B27E History synchronizes chronology, horizontal movement, and selected-session identity across all three charts.
- Selected-session details use the exact preserved session's score, hit rate, points per tap, date, arithmetic, and `OPEN SESSION #___ SEC` road.
- UGO/canonical coordinates remain location authority through TARGET → RESULT → SEC → VAULT → exact reopen.
- The accepted Vault and SEC preserve target identity, evidence, observations, governed result, distribution, and session identity.

## Accepted durable road

The Founder-review service uses:

- `PostgresSessionStore` for preparations and authoritative sessions;
- `PostgresPreservedSECStore` for preserved SEC custody;
- the existing signed exact-reopen authority for capability issuance and verification.

Fresh Postgres-backed sessions #060 and #061 survived complete authority-process restarts. After restart, the exact sessions remained available to SEC/Vault exact reopen and B27E History.

### Control session #060

- Session ID: `sczn3-session-3a2e55dc-b855-46ef-8356-1e9be14b97be`
- 6 hit / 0 missed / 6 total taps
- Score 59
- Preserved artifact SHA-256: `19f498dad9903a765f3d87e127954cdd3b4f6838ecbf93e76ff3467dab92246c`

### Companion session #061

- Session ID: `sczn3-session-41c33ed8-5f35-4283-acf4-f491b0409762`
- 4 hit / 0 missed / 4 total taps
- Score 40
- Preserved artifact SHA-256: `096362c16ac0f02c58004fa4d379a05fa0284801a511e39787fc80e23587577a`

## Founder acceptance boundary

Founder visually accepted the fresh durable B27E road after another authority-process restart, including the preserved session, scoring presentation, Scoring Distribution, B27E History/USM presentation, and Session Details operating together.

A true second-browser-family visual run was unavailable and remains **NOT PROVEN**. This does not negate the accepted process-restart road; signed-URL portability also has clean-client and regression support.

The 25 pre-durability B27E development sessions are preserved evidence only. They are not to be resurrected, reconstructed, or imported as a condition of restoring this floor.

## Repository and custody boundary

- Starting Git HEAD: `9f3c100b375779cfc95102bc45e59d05fe7d584c`
- Accepted state: uncommitted Episode 64 working-tree bytes captured in this archive
- Postgres schema: packaged migrations 001–007
- Database credentials: not packaged
- Signing key: not packaged
- Signed reopen tokens: not packaged
- Live database dump: not packaged

Restoration requires newly provisioned durable infrastructure and secret custody. Acceptance must be proven with fresh sessions after restart; it must not depend on the original process memory or resurrection of old development data.

No commit, push, deployment, USM expansion, target-family rollout, or product change was performed while creating this checkpoint.
