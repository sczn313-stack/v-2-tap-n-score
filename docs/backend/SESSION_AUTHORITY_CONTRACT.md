# Backend Session Authority Contract

## `POST /api/session/prepare`

The browser sends a registered `targetId`. It may also send
`equipmentCandidates` when the shooter selected a saved or one-time setup.
Client-supplied mission identity and Standard Setup authority are ignored.

When `equipmentCandidates` is absent or empty, Backend Target Authority returns:

- resolved target and mission identity;
- governed distance;
- target equipment requirements;
- a governed `standardSetup`;
- compatibility results for that Standard Setup;
- `setupMode: "standard"`; and
- a short-lived preparation token.

When candidates are present, the same response includes the backend Standard
Setup for presentation/reference, evaluates the submitted candidates, and
returns `setupMode: "shooter-selected"`.

## `POST /api/session/start`

The browser sends the preparation token and one exact prepared equipment
candidate. The request requires an `Idempotency-Key` header. The backend:

1. reloads the durable preparation;
2. verifies its expiry and unused state;
3. re-resolves Target ID through the ATP;
4. verifies the target profile, ATP fingerprint, Standard Setup authority, and
   equipment compatibility;
5. creates one durable backend-owned session; and
6. returns the authoritative session ID and selected setup.

Retries with the same key and request return the existing session. Reusing a
key with a different request fails with `409`. Offline operation fails closed;
there is no frontend-created session fallback.

## Standard Setup ownership

Standard Setup is part of the ATP fingerprint and is persisted with each
preparation. The frontend renders `displayFields` supplied by the backend and
does not derive setup values. A Standard Setup is not automatically added to
the device-local Weapon Library.

- M4 uses the proven `M4-IRON-DCH-FSP-AUTHORITY-2026-07-28` equipment record,
  including 0.75 MOA windage and 1.5 MOA elevation per click.
- Baker 100 Yard uses the registered target Standard Setup with a 100-yard
  distance and 0.25 MOA scope adjustment.
- GSSF AC-1 uses the registered pistol Standard Setup. No ungoverned distance
  or adjustment value is fabricated.

## Persistence boundary

Preparations and sessions require the approved Postgres `DATABASE_URL` and
migration `002_create_authoritative_sessions.sql`. Browser storage, Render's
ephemeral filesystem, and process memory are never session authority.
