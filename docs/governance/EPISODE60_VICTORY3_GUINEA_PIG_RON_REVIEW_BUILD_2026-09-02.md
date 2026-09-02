# Episode 60 — Victory #3: Guinea Pig Ron Review Build

Date: 2026-09-02

Status: Founder review candidate / local-only / Founder cold-use pending

## Implemented scope

The first governed Baker M16A2 standard iron-sight TSTT is implemented through the pre-fire readiness point only.

The five task chapters are:

1. Confirm the Baker M16A2 25 Meter target and actual sight configuration.
2. Prepare the rear elevation drum at 300 plus one clockwise click, viewed from above.
3. Understand the ±27 / ±10 grid and center aim relationship.
4. Rehearse front-sight-post elevation and rear-windage-knob correction mechanics with explicit desired-POI movement, rotation, and observer view.
5. Reach **READY TO FIRE YOUR FIRST GROUP** with a pre-fire recap.

The class uses the Snapshot 22 controls: `PAUSE`, `REPLAY CHAPTER`, `CHAPTERS`, and `RESTART TRAINING`. It contains no 10-second rewind.

## Adaptive and authority behavior

- The exact Baker M16A2 target determines the lesson.
- The standard M16A2 rear-sight/front-sight-post configuration selects the only currently admitted branch.
- Selecting a different sight or optic produces a narrow `BRANCH NOT AUTHORIZED` hold and cannot advance.
- Irrelevant optic instruction is not shown.
- The Army/Baker-backed rear-drum, front-post, rear-windage, click-value, rotation, and observer-view authority is taught without frontend calculation.
- The review build ends before results exist, so Snapshot 22 result-adaptive correction/confirmation looping is preserved for the later governed road rather than simulated.

## Explicit stop boundary

This build does not implement or activate live firing, Add Photo, Precision Tap, group measurement, correction calculation, confirmation, SEC, Vault, Target Profile/QR admission, Home availability, push, or deployment.

## Review URLs

- Same Mac: `http://127.0.0.1:8094/m16a2-tstt.html`
- Safari on the Mac or a phone on the same Wi-Fi: `http://Ronnies-MacBook-Pro.local:8094/m16a2-tstt.html`
- Numeric Wi-Fi fallback: `http://192.168.1.90:8094/m16a2-tstt.html`

The restricted review server binds to all IPv4 interfaces on port `8094` but serves only the TSTT page, stylesheet, script, and Baker target image. The numeric Wi-Fi address may change when the Mac changes networks; the Bonjour `.local` URL is the preferred Founder link.

## Founder gate

Victory #3 remains a candidate until Founder/Guinea Pig Ron completes the cold-use review. Snapshot 22 remains the protected parent architecture floor at `8146a3bbfc5bbeb52fbcf0abe8c92754998677f6`.
