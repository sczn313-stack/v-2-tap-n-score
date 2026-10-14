# Episode 64 · GitHub Issue #4 · Sink Games

Status: **IMPLEMENTED — FOUNDER APPROVED 2/2**

Tested base commit: `967fce516e235dc7d6b0c58cd0d60968988ad864`

Founder recorded PASS for both targets on 2026-10-13. `FOUNDER_ACCEPTANCE_192_193.json` is the durable decision record; the machine evidence remains separate.

## Exact scope

| Master | Runtime identity | Governed treatment | Machine lifecycle |
|---:|---|---|---|
| 192 | `gunfun_21110_sink_a_sub` | 8 submarines; 16 printed aiming circles; hits by circle and parent submarine; outside miss; publisher alternating/ring/win rules preserved without automatic play-state claims | PASS |
| 193 | `gunfun_11160_sink_a_ship` | 8 ships plus 1 separate central object; 25 printed aiming circles; ship/center/circle results; outside miss; no invented points, bonus, sunk threshold, turn order, or winner rule | PASS |

## Independent machine proof

`MACHINE_PROOF.json` executes every governed aiming-circle center plus one intentional outside observation for each target. It verifies target identity, registered artwork SHA, complete-boundary UGO acceptance, per-circle classification, parent-object aggregation, total-tap reconciliation, SEC preservation, Vault presence, and byte-identical authority-package recovery on exact reopen.

- Sink-A-Sub: 16 hits + 1 miss = 17 taps; 8/8 submarines contacted; UGO 16 boundaries / 48 inside-edge-outside probes PASS.
- Sink-A-Ship: 25 hits + 1 miss = 26 taps; 8/8 ships and 1/1 center object contacted; UGO 25 boundaries / 75 inside-edge-outside probes PASS.

## Browser proof

The actual shooter-facing pages were exercised in the in-app browser against the isolated production-path review server on port 8232.

- Sink-A-Sub: two registered taps → 2 HIT / 0 MISSED / 2 TOTAL; 1/8 submarines contacted; object drawer and aiming-circle drawer present; SEC saved; exact reopen restored two markers and identical result; zero target-page console errors.
- Sink-A-Ship: two ship-circle taps plus one central-object tap → Ships Contacted 1/8 (2 hit taps), Central Object Contacted 1/1 (1 hit tap), 3 HIT / 0 MISSED / 3 TOTAL; aiming-circle drawer present; SEC saved; exact reopen restored three markers and identical result; zero target-page console errors.

The later Founder-discovered #193 mismatch was corrected at the complete geometry owner. The preserved 14-tap browser replay on port 8233 proves 7 HIT / 7 MISSED / 14 TOTAL, with taps #1–#3 independently classified as Aim Circles 18–20. See `FOUNDER_193_GEOMETRY_CORRECTION.md` and `FOUNDER_193_BROWSER_REPLAY_PROOF.json`.

Screenshots:

- `SINK_A_SUB_EXACT_REOPEN.png` — SHA-256 `cf62c68ea1782cb461f8ae6cec139ab90bb69d44cdbb342935ae2b82e9dbf48e`
- `SINK_A_SHIP_EXACT_REOPEN.png` — SHA-256 `1d04bd6dbe224f64ace7dc749e91e1a7430d9d2a3ebcc3089b3d045c5ab43ad1`

## Review routes

- Board: `http://127.0.0.1:8232/founder-issue4-sink-games.html`
- Sink-A-Sub: `http://127.0.0.1:8232/target-experience.html?missionFamily=targetScoring&target=gunfun_21110_sink_a_sub&source=registered&authorityPort=8232`
- Sink-A-Ship: `http://127.0.0.1:8232/target-experience.html?missionFamily=targetScoring&target=gunfun_11160_sink_a_ship&source=registered&authorityPort=8232`

## Validation commands

- `python3 -m unittest docs.backend.test_episode64_issue4_sink_games -v` — 4/4 PASS
- `python3 docs/backend/test_target_execution_scale_architecture.py` — PASS
- `python3 docs/backend/test_score_on_touch_authority.py` — PASS
- `python3 docs/backend/test_execution_capability_families.py` — PASS
- `node --check docs/target_execution_runtime.js` — PASS

The review server is isolated and in-memory. No additional target was deployed or admitted. The Founder acceptance registry now excludes both approved faces from pending review.
