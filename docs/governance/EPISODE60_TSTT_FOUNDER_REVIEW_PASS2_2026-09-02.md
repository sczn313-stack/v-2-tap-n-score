# Episode 60 — TSTT Founder Review Pass #2

Date: 2026-09-02

Status: Implemented / verified / Founder review pending

## Founder problem closed

Pass #2 makes the equipment journey continuous:

> Start with no useful equipment setup → enter M16A2 TSTT → establish or select equipment → return directly → resume the same TSTT session and chapter → see the active equipment and applicable lesson automatically updated.

## First-use behavior

When Equipment Library has no active profile, TSTT supplies the truthful starting example `M16A2 Rifle · 5.56 NATO · Iron Sights`. It is labeled `STARTING SETUP · NOT CONFIRMED` and `STARTING EXAMPLE — NOT CONFIRMED AS YOUR EQUIPMENT`. The example admits the standard-iron-sight lesson without writing or pretending to own a personal Equipment Library profile.

## Journey continuity

- TSTT preserves started state, chapter, unlocked chapters, Pause, and Stop state in TSTT-owned session storage.
- The one persistent equipment control carries the exact origin and current chapter to Equipment Library.
- Equipment Library displays a direct `RETURN TO CHAPTER N` control.
- Selecting an existing setup commits the active Equipment Profile immediately and returns directly.
- Saving newly added equipment already commits it active and now returns directly.
- On return, TSTT restores the same journey, rereads Equipment Library, and chooses the applicable branch without another confirmation or Save.
- Return routing accepts only the explicit `m16a2-tstt.html` local destination.

## Chapter 1 refinements

- Removed `KNOW YOUR TARGET`.
- Removed `BAKER TARGETS • ST-M16A2R` from the target image.
- The Chapter 1 thumbnail now shows the complete physical target; later instructional views retain purposeful close-ups.
- Equipment identity uses one concise shooter-facing form across the TSTT indicator, Equipment Library cards, and current-equipment bar—for example `Colt LE6920 · 5.56 NATO · Iron Sights`.
- Removed `RETURN AFTER SELECTING YOUR EQUIPMENT`.

## Preserved

The established TSTT visual identity, exact target identity, chapter location/subject relationship, five-segment course progress, bottom player controls, direct chapter navigation, and rifle + sights + target teaching model remain intact.

## Boundary

No new M/FAM target, QR/Home activation, live-fire road, deployment, or unrelated architecture was added. Snapshot 22 remains protected at `8146a3bbfc5bbeb52fbcf0abe8c92754998677f6`.

