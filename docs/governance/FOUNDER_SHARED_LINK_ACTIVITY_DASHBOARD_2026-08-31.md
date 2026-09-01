# Founder Shared-Link Activity Dashboard

Date: 2026-08-31 (America/New_York)

## Purpose

Answer one practical Founder question without creating a surveillance product:

> Are the people I share SCZN3 with actually trying it?

## Existing production evidence reused

The existing OPS event store already records anonymous arrivals, page views, real-session starts, successful result production, and session saves. The existing `ops.html` Founder operations surface and Postgres-backed `/api/ops/summary` endpoint remain the owners.

## Small instrumentation added

- `tstStart` when LET THE TARGET TALK starts.
- `tstComplete` when the universal PLAYER reaches completion.
- `returnShooter` when the same anonymous browser returns after a 30-minute separation.
- A bounded `ref` campaign identifier, such as `founder-test-1`, retained in same-origin session storage through the journey.

The real Tap-n-Score start, results, and save steps continue to use the existing `sessionStart`, `showResults`, and `sessionSaved` events.

## Founder funnel

`ARRIVED → STARTED TST → COMPLETED TST → STARTED REAL TAP-N-SCORE → REACHED RESULTS → SAVED SESSION → RETURNED`

Counts are distinct anonymous arrival IDs for the selected time, product, and shared-link campaign. Replays and repeated control activation do not inflate a visitor's funnel count.

## Shared links

Example public test link:

`https://tap-n-score.com/?ref=founder-test-1`

Founder dashboard campaign view after deployment:

`https://tap-n-score.com/ops.html?campaign=founder-test-1`

The candidate is not deployed by this record. Local Founder review uses the same paths on `http://127.0.0.1:8096`.

## Privacy boundary

- Campaign IDs accept only lowercase letters, digits, hyphens, and underscores, with a 64-character maximum.
- No name, email, location, device fingerprint, photograph, target evidence, or SEC content is collected by this funnel.
- Anonymous arrival/session identifiers already owned by OPS are reused.
- Return detection is local and anonymous; it records only the new anonymous arrival event after the minimum return interval.
- Telemetry failures remain non-blocking to every shooter workflow.

## Production activation still required

Before deployment, apply migration `007_extend_ops_shared_link_funnel.sql`, deploy the matching backend summary contract, and deploy the same-origin Netlify OPS proxy routes with the frontend candidate. No production deployment is authorized by this preservation record.
