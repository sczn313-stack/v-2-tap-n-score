# Backend Session and Equipment Capability Authority Contract

## Governing separation

The backend evaluates three independent questions. A failure in one question
must not silently answer another:

1. **Target Admission** — whether the registered Smart Target may enter the
   shooter workflow.
2. **Official Mission Eligibility** — whether registered authority supports an
   official mission claim for the selected equipment.
3. **Capability Availability** — which evidence, measurement, correction, and
   official-score capabilities are supported for that session.

A resolved active target returns `targetAdmission.status: "admitted"`.
Equipment does not become an ownership gate for a Smart Target. An official
mission restriction returns `ineligible` only when the restriction itself has
registered provenance. Without that provenance the status is
`authority_unavailable`; the backend returns no fabricated restriction ID or
source.

## `POST /api/session/prepare`

The browser sends a registered `targetId`. It may also send
`equipmentCandidates` when the shooter selected a saved or one-time setup.
Client-supplied mission identity and Standard Setup authority are ignored.

When `equipmentCandidates` is absent or empty, Backend Target Authority returns:

- resolved target and mission identity;
- governed distance;
- target equipment requirements;
- a governed `standardSetup`;
- an `equipmentAssessments` result for that Standard Setup;
- `setupMode: "standard"`; and
- a short-lived preparation token.

When candidates are present, the same response includes the backend Standard
Setup for presentation/reference, assesses the submitted candidates, and
returns `setupMode: "shooter-selected"`.

Each equipment assessment contains:

- the prepared equipment fingerprint;
- `officialMission.status` (`eligible`, `ineligible`, or
  `authority_unavailable`);
- independent `evidence`, `measurement`, `correction`, and `officialScore`
  capability statuses;
- registered restrictions, if any; and
- shooter-facing guidance that does not claim unsupported authority.

## `POST /api/session/start`

The browser sends the preparation token and one exact prepared equipment
candidate. The request requires an `Idempotency-Key` header. The backend:

1. reloads the durable preparation;
2. verifies its expiry and unused state;
3. re-resolves Target ID through the ATP;
4. verifies the target profile, ATP fingerprint, and Standard Setup authority;
5. re-assesses official mission eligibility and capability availability;
6. creates one durable backend-owned session; and
7. returns the authoritative session ID, selected setup, assessment, and
   `sessionMode`.

`sessionMode` is `official_mission` only when official mission eligibility is
established. Otherwise it is `target_evidence`. Both modes retain truthful
evidence and supported measurements. Unsupported official scores or correction
claims remain unavailable.

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
