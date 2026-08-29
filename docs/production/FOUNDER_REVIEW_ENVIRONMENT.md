# SCZN3 Founder Review Environment

## Purpose

Founder Review is the protected showroom between Cody's local workshop and
production. It serves one explicitly released Keepsake candidate with the real
SCZN3 Backend Authority and a review-only database.

It is not production and it must never use production persistence credentials.

## Required release provenance

Each release record must identify:

- Keepsake number and archive filename;
- Keepsake SHA-256;
- source commit;
- deployed review commit;
- review service identifier and URL;
- isolated database identifier;
- validation result; and
- prior release used for rollback proof.

The initial release input is:

- Keepsake: `#5 — First Talking Smart Target`
- source commit: `afbcaf7e2e8ec9abe0617533d16f80f4ff95f543`
- archive: `SCZN3_KEEP_005_FIRST_TALKING_SMART_TARGET_afbcaf7.zip`
- SHA-256: `b45765a9591c4a37f410b1c6bf09627ed8be86a9fba1ba723a1ed033c6ca624a`

## Isolation and access contract

- Every page and API route except `/health` requires server-verified Founder
  credentials.
- Browser code receives no database credentials or privileged secrets.
- Review persistence uses a dedicated database through
  `SCZN3_SESSION_SEC_DATABASE_URL`; production URLs are prohibited.
- `SCZN3_SEC_REOPEN_SIGNING_KEY` is review-only.
- Candidate browser calls are bound to the same protected review origin. The
  existing Backend Authority continues to own session, target, result, and SEC
  decisions.
- Static access to backend, governance, history, tests, and dotfiles is denied.
- Review pages are non-indexable and sent with `no-store`.

## Required environment

| Variable | Requirement |
|---|---|
| `SCZN3_REVIEW_USERNAME` | Founder access username; secret |
| `SCZN3_REVIEW_PASSWORD` | Founder access password; secret |
| `SCZN3_SESSION_SEC_DATABASE_URL` | review-only Postgres URL; secret |
| `DATABASE_URL` | same review-only database where non-session stores are exercised |
| `SCZN3_SEC_REOPEN_SIGNING_KEY` | review-only high-entropy signing secret |
| `SCZN3_ALLOWED_ORIGINS` | exact review HTTPS origin(s) only |
| `SCZN3_REVIEW_RELEASE` | immutable release identifier |
| `HOST` | `0.0.0.0` |
| `PORT` | supplied by the host |

## Start command

```text
python docs/production/founder_review_service.py
```

The service applies the candidate's existing numbered database migrations to
the isolated review database before accepting traffic.

## Release gate

Before a link is handed to Founder, prove:

1. unauthenticated page and API requests receive `401`;
2. authenticated access reaches the exact released candidate;
3. review persistence writes only to the isolated database;
4. the talking-target demonstration is audible and synchronized;
5. the complete Baker road reaches Save, SEC, Vault, and exact reopen;
6. production data and production services are unchanged; and
7. the deployed service is rolled back from the actual prior Keepsake release,
   revalidated, and then returned to the approved current release.

## Recovery rule

`KNOWN GOOD → FIND IN INDEX → RETRIEVE FROM MASTER VAULT → VERIFY SHA-256 → RESTORE → DEPLOY REVIEW RELEASE → VERIFY COMPLETE ROAD`
