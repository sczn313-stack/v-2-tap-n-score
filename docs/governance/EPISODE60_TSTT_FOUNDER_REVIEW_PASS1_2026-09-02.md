# Episode 60 — TSTT Founder Review Pass #1

Date: 2026-09-02

Status: Implemented / verified / Founder review pending

## Chapter 1 correction

- The teaching surface reproduces the physical identity `25 METERS ZEROING TARGET` / `M16A2` exactly.
- Baker provenance remains visible as `BAKER TARGETS • ST-M16A2R`; registry/face language is not exposed.
- The recognition strip and redundant target-reconfirmation instruction are removed.
- `CHAPTER 1 OF 5` and `TARGET + EQUIPMENT` now form one location/subject header.
- Five discrete segments show course position only.
- One `YOUR ZEROING SETUP` component teaches the rifle + sight + target relationship and confirms when the active setup works.

## Equipment ownership

TSTT does not own, write, or save equipment selection. It reads the existing Equipment Library keys `SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID` and `SCZN3_SAVED_EQUIPMENT_PROFILES`. The persistent indicator names the setup SCZN3 currently believes is active and links to the established Equipment Library. TSTT rereads that state on page return, window focus, and cross-page storage change, then selects or withholds the standard-iron-sight lesson accordingly.

Equipment Library already commits `Use This Equipment` immediately. No second TSTT selector or save action exists.

## Principles propagated to Chapters 2–5

- Every chapter uses the same course-location → lesson-subject header relationship and segmented course progress.
- Shooter copy describes the action and purpose without `applicable branch`, `authority`, `admitted`, or runtime-boundary jargon.
- Chapter 2 distinguishes temporary rear-drum setup from later up/down group movement in shooter language.
- Chapter 3 limits the surface to the grid, center aim, and consistent first-group aim; future-system explanation is removed.
- Chapter 4 keeps the useful controls, click values, movement directions, and observer views while removing authority terminology.
- Chapter 5 recaps the actual target/equipment/procedure and stops with range-command language rather than implementation talk.

## Player corrections

- `STOP` is distinct from `PAUSE`: Pause retains playback position; Stop cancels narration and requires Resume, which restarts the current chapter narration.
- Chapters remain directly navigable after the active equipment setup admits the lesson.
- The current chapter carries the green `YOU ARE HERE` cue.
- Proficiency remains a separate unmeasured `☆☆☆` concept tied to future shooting results, never chapter completion.

## Boundary

No new M/FAM target, QR/Home activation, live-fire road, deployment, or unrelated architecture was added. Snapshot 22 remains protected at `8146a3bbfc5bbeb52fbcf0abe8c92754998677f6`.

