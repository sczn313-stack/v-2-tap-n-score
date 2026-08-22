# Collection/Hand Evaluator — Implementation Report

**Status:** BUILT / PASS  
**Episode:** 56 — Capability Engine, Gear 6  
**Founder authorization:** Collection/Hand Evaluator Founder Specification approved  
**Implementation start:** August 19, 2026, 9:14:10 PM EDT  
**Validated completion:** August 19, 2026, 9:21:21 PM EDT  
**Production deployment:** None  
**Commit / push:** None

## Governing result

> **`collectionHandEvaluation → collectionHandResult` — PASS**

V1 returns only:

> **Publisher-Defined Collection/Hand Result — Not a General Game Judgment**

The backend owns player/turn state, UGO observation classification, ordered collections, exact Profile-pattern matching, terminal state, result identity, and preservation. No conventional poker rule, target artwork inference, or generalized game-state behavior supplies authority.

## Three-fixture acceptance

| Fixture | SKU | Governed behavior | Result | Exact reopen | Target-ID/SKU production edit |
|---|---|---|---|---|---|
| Solo Publisher Collection | `HAND-A01` | One player; exact A/B/C member collection | `Publisher Triple Collection` | PASS | **NO** |
| Alternating Publisher Hands | `HAND-B02` | Two backend-governed alternating players | Player 1 `Publisher Pair A`; Profile-defined winner | PASS | **NO** |
| Data-Only Independent Hand | `HAND-C03` | Independent two-member Profile with duplicate refusal | `Publisher Data Pair` | PASS | **NO** |

All three products inherited one evaluator, action route, durable state owner, SEC family, and preservation path. `HAND-C03` exists only in governed fixture data and appears in no inspected production routing surface.

## Collection/hand provenance

Every terminal result preserves:

1. authoritative session and exact Target Execution Contract fingerprint;
2. exact publisher product, SKU, Target Profile, and component digests;
3. exact Collection/Hand Profile ID/version and source-document hash/reference;
4. backend turn number and active session-local player;
5. admitted image hash and exact normalized observation;
6. UGO geometry entity and publisher-authorized collection member;
7. duplicate/ambiguous/unresolved disposition;
8. ordered per-player collection;
9. exact declarative pattern ID, publisher label, and precedence;
10. comparison/terminal state and backend result identity/hash.

The browser cannot submit authoritative member IDs, collections, hand classes, winners, turn numbers, or completion.

## Exact result-generation evidence

- `HAND-A01` observations in geometry regions A, B, and C produced member IDs `member-a`, `member-b`, and `member-c`.
- The exact Profile multiset matched `publisher-triple`; its publisher label—not a conventional poker label—was returned.
- `HAND-B02` enforced Player 1 → Player 2 → Player 1 → Player 2 turn ownership and compared only Profile-defined precedence.
- `HAND-C03` matched only its independent B/C Profile pattern.
- unmatched pattern sets become `unclassified_collection`; no nearest familiar hand is invented.
- manual observations preserve `physicalShotTiming.status: unavailable`.
- scoring remains `not_applicable`.

## Fail-closed validation

| Condition | Result |
|---|---|
| suspended Profile | REFUSED — `collection_hand_profile_authority_inactive` |
| mismatched UGO/registration component binding | REFUSED — `collection_hand_component_binding_invalid` |
| hand pattern references an unknown member | REFUSED — `collection_hand_pattern_invalid` |
| out-of-turn player evidence | REFUSED — `collection_hand_turn_order_invalid` |
| Profile-forbidden duplicate | REFUSED — `collection_hand_duplicate_member_rejected` |
| altered claim, hand label, winner, or result body | preservation validation fails |
| real Baker Poker Wheel without complete approved/licensed rules | REFUSED — no executable contract/Profile |

`stopped_incomplete` preserves partial evidence and incomplete hands without inventing a winner.

## No speculative game framework

No path, maze, traversal, board, deck, hidden-state, casino, betting, wagering, odds, strategy, wildcard, discard/redraw, or generic game engine was introduced. The bounded evaluator supports only:

- solo or alternating session-local players;
- one governed observation per turn;
- exact UGO member mapping;
- exact Profile duplicate/invalid-observation policy;
- fixed turns per player;
- exact Profile-declared member multisets and precedence;
- `complete` or `stopped_incomplete`.

The evaluator imports authority-neutral stage/event primitives. It does not import or call Cue/Drill or Recreational Challenge executors.

## Baker authority boundary

The real Baker Poker Wheel single and bulk offerings remain at Smart Evidence. No Baker target registration, Profile, route, rules package, or SEC was created. The real Collection/Hand capability remains unavailable until the complete printed guide is captured with sufficient fidelity, approved, licensed, versioned, and packaged.

Synthetic acceptance proves the bounded architecture only.

## Exact files changed

### New

- `docs/backend/executors/collection_hand_evaluator.py`
- `docs/backend/target_execution_contracts/profiles/collection_hand_game_profile.schema.json`
- `docs/backend/test_fixtures/collection_hand_scale.py`
- `docs/backend/test_collection_hand_evaluator.py`
- `docs/production/collection_hand_family_review_server.py`
- `docs/production/collection_hand_family_browser_test.mjs`
- `docs/history/episodes/episode56-target-capability-coverage/COLLECTION_HAND_EVALUATOR_IMPLEMENTATION_REPORT.md`

### Modified once at family level

- `docs/backend/target_execution_contract.py`
- `docs/backend/target_execution_contracts/schema.json`
- `docs/backend/execution_capability_registry.py`
- `docs/sec_adapter_model.js`
- `docs/sec_dispatch.js`
- `docs/target_execution_runtime.js`
- `docs/package.json`
- `docs/history/episodes/episode56-target-capability-coverage/COLLECTION_HAND_EVALUATOR_FOUNDER_SPEC.md`
- `docs/history/episodes/episode56-target-capability-coverage/CAPABILITY_ENGINE_STATUS.md`

## Existing owners preserved

No Gear 1–5 executor was changed. `session_authority.py`, `execution_authority.py`, `stage_event_primitives.py`, `stage_event_store.py`, `server.py`, `preserved_sec_store.py`, `records.html`, `target-experience.html`, `m4_runtime.js`, UGO owners, existing target registrations, and historical SECs remained unchanged by Gear 6.

## Regression results

| Validation | Result |
|---|---|
| Collection/Hand backend three-fixture lifecycle | PASS |
| Collection/Hand browser lifecycle → preservation → exact reopen | PASS |
| Data-only third fixture, zero target-ID/SKU production edits | PASS |
| provenance and exact Profile-result generation | PASS |
| invalid/incomplete/tampered-authority refusal | PASS |
| Baker authority-gap refusal | PASS |
| no speculative game behavior | PASS |
| Cue/Drill | PASS |
| Qualification | PASS |
| Diagnostic Feedback | PASS |
| Decision Scenario | PASS |
| SEC Progression | PASS |
| Target Execution Scale Architecture | PASS |
| execution capability families | PASS |
| Session Authority | PASS — 17/17 |
| preserved SEC store | PASS — 3/3 |
| Vital Dude SEC/preservation/reopen | PASS |
| Episode 55 IDPA and Baker Fun | PASS |
| Universal SEC dispatch at 1440px and 390px | PASS |
| Universal SEC shell, Vault, and evidence-first contracts | PASS |
| Target Execution Contract generic routing/build admission | PASS |
| Production build | PASS — 337 public files |
| JavaScript syntax, JSON schemas, and `git diff --check` | PASS |

## Timing reconciliation and Work Ledger

The clock is anchored to the first implementation timestamp and the final successful integrity check. Waiting and environment friction are separate from active work.

| Segment | Work category | Why the work existed | Active Cody | Friction / waiting | Shared or target-specific | Reusable | New application code | Future reduction |
|---|---|---|---:|---:|---|---|---|---|
| Profile/result contract and family registration | Authority packaging / Registration | The sixth governed family needed exact Profile, result, owner, and contract identities | 0m 46s | — | Shared family | Yes | Yes | Future products supply governed data only |
| Collection/Hand evaluator and bounded turn state | Shared-owner/platform capability | SCZN3 lacked exact collection-member and Profile-pattern evaluation | 1m 46s | — | Shared family | Yes | Yes | Inherited by authority-complete Collection/Hand products |
| Three fixtures and backend refusal tests | Validation/testing | Prove solo, multiplayer, invalid authority, incomplete state, Baker refusal, and data-only scale | 0m 54s | — | Shared family | Yes | Test code only | Retained automated suite |
| Universal SEC composition and preservation dispatch | Shared-owner/platform capability | The new family needed truthful shared result presentation and exact reopen | 0m 51s | — | Shared family | Yes | Yes | Future Profiles require no SEC module |
| Browser authority and end-to-end test | Validation/testing | Prove complete governed lifecycle through preservation/reopen | 0m 41s | 0m 20s unattended automation | Shared family | Yes | Test code only | Reusable acceptance harness |
| Full regression/build validation | Validation/testing | Prove Gears 1–5 and platform owners remained intact | 0m 22s | 0m 27s unattended automation | Shared platform | Yes | Test code only | Automated regression suites remain |
| Implementation report and ledger reconciliation | Other — governance record | Preserve exact scope, evidence, timing, and authority gaps | 0m 57s | — | Shared governance | Yes | No | Reusable report pattern |
| Local sockets/browser permission, repeat-run idempotency key, and test working-directory retry | Tooling/environment/permission friction | Local review required approved browser/socket access and two harness invocation corrections | — | 0m 07s friction | Shared environment | No | Test code only | Randomized harness identities and correct roots now retained |
| **Total** |  |  | **6m 17s active** | **0m 54s non-active** |  |  |  |  |

### Clock totals

- **Total elapsed implementation time:** 7 minutes 11 seconds
- **Total active Cody work time:** 6 minutes 17 seconds
- **Permission/environment friction:** 7 seconds
- **Unattended waiting:** 47 seconds
- **Founder-response waiting:** 0 seconds

Durations are rounded to the nearest second from the implementation anchor, filesystem timestamps, command durations, browser/test output, and final integrity evidence. The categories reconcile exactly to elapsed time.

## Founder decision boundary

None encountered. Baker Poker Wheel remains authority-blocked exactly as approved, and no architecture expansion was required.

Gear 6 is complete. All six missing Episode 56 capability families now have governed reusable owners.
