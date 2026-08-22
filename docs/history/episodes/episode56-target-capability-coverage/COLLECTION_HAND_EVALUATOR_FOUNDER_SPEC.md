# Collection/Hand Evaluator — Founder Specification

**Status:** Founder approved; implemented and validated — see `COLLECTION_HAND_EVALUATOR_IMPLEMENTATION_REPORT.md`  
**Episode:** 56 — Capability Engine, Gear 6  
**Population evidence:** 2 Baker offerings / 1 product lineage  
**Implementation:** Founder authorized in conversation; completed within this boundary

## 1. Governing objective

Implement the smallest reusable owner that can turn governed target observations into an exact publisher-defined collection and evaluate that collection under bounded publisher-authorized hand rules:

> **Publisher product → governed registration/UGO → Collection/Hand Game Profile → backend-owned turn and collection state → Collection/Hand Evaluator → publisher-defined hand result → Universal SEC → preservation → exact reopen**

The V1 family is deliberately narrow:

> **`collectionHandEvaluation → collectionHandResult`**

It is not a generic game engine, rules scripting system, casino/poker platform, or path-state framework.

## 2. Catalog evidence and real-product authority gap

Only one real lineage establishes this behavior:

| SKU | Exact product | What Baker establishes publicly |
|---|---|---|
| `GF-PokerWheel` | Poker Wheel Target | Poker Wheel play, solo or multiplayer use, poker-hand formation, a Royal Flush objective, and instructions printed on the target. |
| `GF-PokerWheel-Bulk` | Poker Wheel Target – 250 Pack | The same product/game relationship in a bulk quantity. |

Pack size does not create another behavior or independent proof of reuse.

The catalog description does not establish enough executable authority for:

- exact target-region-to-card mapping;
- duplicate-card treatment;
- miss, boundary, and ambiguous-hit treatment;
- number of observations per hand or turn;
- solo and multiplayer turn sequence;
- replacement, discard, redraw, or hold behavior;
- exact recognized combinations and precedence;
- tie-breaking;
- completion, early-stop, and winner conditions.

The printed guide/target instructions must be captured at sufficient fidelity, versioned, approved, and licensed for digital use before the real Baker Poker Wheel capability becomes executable. Familiarity with ordinary poker rules is not authority for Baker's product rules.

Until then, both products retain their valid Smart Evidence boundary. Synthetic Profiles may prove the reusable architecture; they do not authorize the real Baker game.

## 3. Critical truth boundary

Three claims remain separate:

| Experience | Correct owner | Truthful claim |
|---|---|---|
| Evidence only | Existing `smartEvidenceCapture` | These observations were recorded against this exact publisher product. |
| Publisher-defined collection/hand | New Collection/Hand family | These governed observations produced these exact collection members and this hand result under this exact Profile. |
| Skill, gambling, strategy, or external game outcome | Separately governed authority | The result establishes player skill, monetary value, optimal strategy, official competition standing, or another claim beyond the target game. |

V1 may report collection membership, recognized hand class, tie/equality state, completion, and a Profile-authorized winner. It must not infer shooting skill, qualification, diagnosis, tactical/legal meaning, wagering value, odds, strategy, or conventional poker meaning beyond the exact Profile.

Shooter-facing truth label:

> **Publisher-Defined Collection/Hand Result — Not a General Game Judgment**

## 4. Exact family identity

| Owner | Identity | Version |
|---|---|---:|
| Mission family | `collectionHandEvaluation` | — |
| Result package | `collectionHandResult` | `1` |
| Backend evaluator | `collection-hand-evaluator` | `1` |
| SEC adapter family | `collection-hand-family` | `1` |
| Preservation validator | `collection-hand-preservation` | `1` |
| Profile | `collection-hand-game-profile` | `1` |

`missionFamily` remains the exact authority switch. Collection/Hand must not invoke or acquire Smart Evidence, Recreational Challenge, Cue/Drill, Qualification, Diagnostic, Decision, Progression, scoring, or Zeroing authority.

## 5. Smallest correct shooter experience

For an authority-complete product/Profile:

1. Open the exact registered publisher product.
2. Choose its independently authorized **Collection/Hand Game** relationship.
3. Review publisher/product/SKU, Profile version/source, player mode, hand size, turn behavior, completion rule, and claim limitation.
4. Choose only a Profile-authorized player count and establish stable session-local player labels/IDs.
5. Start an authoritative session resolving exactly `targetProfileId + collectionHandEvaluation`.
6. Load/capture the registered target and satisfy UGO registration.
7. The backend opens the exact player/turn state.
8. Record visible observations for the active turn.
9. The backend classifies each observation to an exact authorized collection member or to an explicit miss/ambiguous/unresolved state.
10. The backend applies the Profile's exact duplicate and collection rules.
11. Advance turns until the Profile establishes `complete`, or explicitly stop as `stopped_incomplete`.
12. Show only the exact resulting collections, authorized hand labels, comparison/tie/winner state, and unavailable capability states.
13. Save the Universal SEC and reopen the exact preserved result.

Manual observations establish visible observation evidence and collection membership only. They do not establish physical shot timing.

## 6. Existing architecture inherited unchanged

### Locked authority and composition

- M-009, ADR-001, M-010, Publisher Product Boundary, KTIS, and UGO;
- `targetProfileId + missionFamily` Target Execution Contract resolution;
- Session Authority, Backend Authority, Universal SEC, preservation, and exact reopen;
- one publisher product may expose multiple capabilities, but each resolves and executes independently.

### Reusable mechanics

- admitted target image and normalized observation handling;
- UGO circle/rectangle containment, unique-match, outside, and ambiguity behavior;
- backend result identity/hash and exact component-digest trace;
- generic action route, durable action/event store, idempotency, and monotonic backend sequence numbers;
- Gear 1 authority-neutral stage/event mechanics for backend-owned active-turn/event association;
- existing Recreational Challenge evidence for stable player IDs, alternate-turn validation, entity state, and winner presentation where the exact Profile authorizes them;
- Universal SEC shared shell and generic contract-backed preservation delegation.

Collection/Hand may reuse those mechanics. It must not call another family executor or inherit another family's authority. `recreationalChallenge` entity-completion rules are insufficient to establish a poker hand and remain unchanged.

## 7. Collection/Hand Game Profile v1

The Profile is bounded declarative authority inside the exact Target Execution Contract. It contains no JavaScript, Python, formulas, arbitrary expressions, JSON paths, templates, or client-authored rules.

### Authority envelope

The Profile must establish:

- immutable Profile ID/version/digest;
- publisher/rules-owner identity;
- exact source document/image, revision/reference, content hash, effective date, and approval/licensing state;
- active, suspended, revoked, and superseded lifecycle;
- exact product edition and Target Profile/geometry bindings;
- allowed claim grade: `publisher_collection_hand_result` only;
- exact allowed player mode/count;
- terminal and incomplete-result policy.

Product name, artwork, card symbols, the phrase “Royal Flush,” and generic poker knowledge are discovery evidence—not executable authority.

### Collection-member map

Each authorized member declares:

- stable `collectionMemberId`;
- exact UGO `geometryEntityId`;
- publisher label;
- bounded attributes required for exact evaluation, such as publisher-defined rank/suit/category IDs;
- exact source reference;
- duplicate identity and status.

Unknown entities, duplicate member IDs, unsupported attributes, conflicting mappings, equal-priority overlaps, or missing source authority fail closed.

### Turn and collection policy

V1 supports only explicitly declared:

- `solo` or bounded `alternating_players` mode;
- minimum/maximum player count;
- fixed observation allowance per turn;
- fixed collection/hand size;
- `count_once`, `allow_repeated_member`, or `reject_duplicate` duplicate policy;
- explicit miss, ambiguous, and unresolved treatment;
- fixed completion after the authorized collection size or explicit Profile terminal condition;
- `complete` and `stopped_incomplete` terminal states.

Replacement, discarding, drawing from hidden state, betting, dealer state, wildcards, side pots, player elimination, arbitrary branching, and physical shot timers are unavailable in V1 unless later catalog authority proves they are necessary.

### Hand evaluation vocabulary

V1 uses an ordered declarative table of exact patterns. Each pattern contains:

- stable `handClassId` and exact publisher label;
- explicit required member attributes/counts;
- precedence/order supplied by the Profile;
- optional exact equality/tie key;
- exact source reference.

The evaluator performs bounded equality, count, set-membership, and consecutive-sequence checks only when explicitly selected by the Profile. It cannot execute code, infer conventional poker rankings, or invent a missing class.

If no authorized pattern matches, the result is `unclassified_collection`, not the nearest familiar poker hand.

## 8. Backend-owned state and event association

The backend owns:

- authoritative session and contract fingerprint;
- player roster and stable session-local player IDs;
- current player/turn number;
- observation-to-turn association;
- per-player ordered collection;
- duplicate/miss/ambiguity disposition;
- completion and stop state;
- result identity/hash.

The client may request a permitted player count, display labels, and actions. It may not submit authoritative collections, cards, ranks, hand labels, winners, turn numbers, or completion.

Out-of-turn, stale-sequence, duplicate-action, foreign-contract, post-terminal, and client-computed-result actions fail closed.

## 9. Observation and UGO boundary

For every observation, the evaluator must:

1. validate admitted normalized coordinates;
2. require the exact registered target/UGO authority;
3. classify against exact geometry entities;
4. require one unambiguous authorized collection-member mapping;
5. preserve miss, boundary, ambiguous, and unresolved states explicitly;
6. apply only the exact Profile disposition;
7. append the accepted member to the exact active player's collection.

Image recognition, OCR, visual card interpretation, nearest-region guessing, mirroring, target rotation, and client-supplied region/member identity are not authority.

## 10. Result semantics

`collectionHandResult` v1 contains:

- backend-authoritative result and authoritative session identity;
- exact publisher product, SKU, Target Profile, contract, component, and Profile identities;
- exact player mode and stable session-local player identities;
- ordered turns/events and observation evidence;
- per-observation UGO classification and collection-member disposition;
- exact per-player collection members;
- exact matched `handClassId`/publisher label or `unclassified_collection`;
- exact Profile-authorized tie/comparison/winner state;
- `complete` or `stopped_incomplete` terminal state;
- `claimGrade: publisher_collection_hand_result`;
- `scoring.status: not_applicable` unless an independently authorized future score owner exists;
- physical shot timing, gambling, wagering, strategy, skill, qualification, diagnosis, legal, tactical, and progression claims as unavailable/not established;
- reconciliation counts, result identity/hash, and complete authority trace.

A stopped-incomplete SEC may preserve the exact partial collections, but it cannot announce a completed hand or winner unless the Profile explicitly authorizes an early terminal comparison.

## 11. Explicitly unavailable/not applicable

- real Baker Poker Wheel execution without complete approved/licensed printed rules;
- generic path, maze, traversal, board-position, or route state;
- generic card-game or casino engine;
- ordinary poker rules inferred from common knowledge;
- wagering, chips, pot, odds, expected value, gambling advice, or monetary result;
- strategic advice, coaching, skill assessment, qualification, certification, diagnosis, legal, tactical, medical, or anatomical meaning;
- automatic shot detection or physical shot timing;
- client-authored members, hands, rankings, winners, or completion;
- arbitrary expressions/scripts;
- cross-session progression;
- hidden/random deck state, replacement, discard, redraw, wildcards, or betting rounds;
- multiplayer identity beyond stable session-local player attribution.

A missing Collection/Hand Profile does not make the target unavailable. Smart Evidence remains the valid lower capability boundary.

## 12. Multi-capability and owner boundaries

The Poker Wheel product may separately expose Smart Evidence and, after complete authority exists, Collection/Hand. Those relationships never merge silently.

- Smart Evidence records observations without hand evaluation.
- Collection/Hand evaluates only the exact governed game Profile.
- Recreational Challenge remains entity-completion/winner authority and is not invoked automatically.
- Progression remains cross-session and is not invoked automatically.

The shooter chooses one capability; the backend executes one exact contract.

## 13. Smallest proposed implementation scope

### New files

- `docs/backend/executors/collection_hand_evaluator.py`
- `docs/backend/target_execution_contracts/profiles/collection_hand_game_profile.schema.json`
- `docs/backend/test_fixtures/collection_hand_scale.py`
- `docs/backend/test_collection_hand_evaluator.py`
- `docs/production/collection_hand_family_review_server.py`
- `docs/production/collection_hand_family_browser_test.mjs`
- `docs/history/episodes/episode56-target-capability-coverage/COLLECTION_HAND_EVALUATOR_IMPLEMENTATION_REPORT.md`

### Existing family-level files modified once

- `docs/backend/target_execution_contract.py`
- `docs/backend/target_execution_contracts/schema.json`
- `docs/backend/execution_capability_registry.py`
- `docs/sec_adapter_model.js`
- `docs/sec_dispatch.js`
- `docs/target_execution_runtime.js`
- `docs/package.json`
- `docs/history/episodes/episode56-target-capability-coverage/CAPABILITY_ENGINE_STATUS.md`

If existing generic action routing and durable stage/event state can host the family without modification, they remain unchanged. Any genuinely missing authority-neutral player/turn primitive must be surfaced as a shared primitive in the implementation report; it must not be hidden in target-specific code.

No Baker target registration or executable real Poker Wheel Profile is authorized by the synthetic architecture proof.

## 14. What explicitly will not change

- Gears 1–5 or their authority;
- Target Execution Contract resolver semantics;
- Session Authority, generic action route, durable state owner, preservation store, or `m4_runtime.js` unless validation reveals a genuine family-level obstruction;
- UGO, target registration, Publisher Product Boundary, Backend Authority, Universal SEC, or Zeroing isolation;
- existing Recreational Challenge behavior;
- existing targets, SECs, routes, or historical artifacts;
- real Baker authority packaging;
- any target-ID/SKU production branch;
- any path-game capability.

## 15. Three-fixture scale acceptance

Because the catalog contains only one real lineage and that lineage is authority-incomplete, architecture acceptance uses three independent synthetic, authority-complete Collection/Hand Profiles:

1. **Solo fixed hand** — exact governed observations produce a recognized Profile-defined hand.
2. **Alternating-player hand** — backend turn ownership creates two independent collections and a Profile-authorized comparison/tie result.
3. **Data-only independent hand** — a third publisher/product/Profile becomes executable through data only.

The third fixture must require:

> **Zero target-ID/SKU production-code edits.**

The suite must also prove:

- the same evaluator and SEC family serve all three products;
- exact collection-member mapping comes from UGO/Profile data;
- duplicate, miss, ambiguous, unresolved, out-of-turn, stale, and over-limit evidence follows exact Profile policy or fails closed;
- no conventional hand rank is inferred when absent from the Profile;
- complete and stopped-incomplete SECs preserve and reopen exactly;
- manual observations do not become physical shot timing;
- no path/game-generalization branch exists.

Passing synthetic fixtures proves the bounded architecture, not the real Baker rules and not a universal game engine.

## 16. Validation plan

- validate Profile authority, lifecycle, product/geometry bindings, source hashes, member uniqueness, rules vocabulary, and component digests;
- validate solo and multiplayer player-count limits and backend-owned turn association;
- test exact member classification and every miss/duplicate/ambiguity disposition;
- test hand recognition, precedence, unclassified collection, equality/tie, winner, completion, and stopped-incomplete behavior;
- refuse client-computed cards, hands, ranks, winners, turn numbers, and completion;
- refuse arbitrary expressions/scripts and unsupported path/deck/betting mechanics;
- prove result tampering and contract/Profile mismatch block preservation;
- prove third-fixture zero target-ID/SKU production edits;
- run Gears 1–5, Target Execution, Session Authority, Universal SEC, preservation, Vault, Vital Dude, Baker, IDPA, existing-target, and production-build regressions;
- verify `m4_runtime.js`, source executors, real Baker registrations, and historical SECs remain unchanged;
- preserve active Cody time separately from permission friction, unattended waiting, and Founder-response waiting.

## 17. Expected catalog effect

One bounded owner could cover both identified Baker Poker Wheel offerings because pack quantity does not change behavior. Real-product execution remains authority-blocked until the complete printed guide is approved and packaged.

The architecture can prove data-driven reuse across synthetic Collection/Hand Profiles, but the catalog currently supports only this claim:

> **Collection/hand state is one evidenced missing behavior. Generic path or game state is not established.**

If Gear 6 later passes, all six capability gaps identified across the GunFun + Baker analysis will have a governed composition owner. That does not mean every product has complete authority data; it means each identified behavior has a non-target-specific architectural path.

## 18. Founder decisions required

Founder approval is required before implementation for:

1. the exact `collectionHandEvaluation → collectionHandResult` family identity;
2. the truth label and claim-grade boundary;
3. bounded declarative collection members, turn policies, and hand-pattern table;
4. reuse of authority-neutral player/turn mechanics without importing Recreational Challenge or Cue/Drill authority;
5. synthetic-only architecture validation while real Baker execution remains blocked;
6. explicit exclusion of generic path, board, deck, betting, strategy, and game-engine behavior;
7. the exact file scope and three-fixture acceptance test.

No conflict with the locked Episode 56 architecture has been identified.

**No implementation, registration, authority invention, commit, push, deployment, or production-state change is authorized by this specification.**
