# Episode 59 Supabase Security Repair — Controlled Production Plan

Status: **local repair candidate validated; production unchanged**

## Verified production facts — 2026-08-25 EDT

- Render service: `sczn3-authority` (`srv-d8o5nkmgvqtc73fv2vag`).
- Render `DATABASE_URL` pooler user: `postgres.yzyaxiplvvxwnjefrhth`.
- PostgreSQL `current_user`: `postgres`.
- `postgres`: `NOSUPERUSER`, `BYPASSRLS`, `INHERIT`.
- `postgres` owns `authoritative_sessions`, `session_preparations`, and `preserved_secs`.
- `authoritative_sessions`: RLS enabled, FORCE RLS disabled.
- `session_preparations` and `preserved_secs`: RLS disabled before repair.
- `anon`, `authenticated`, and `service_role` currently hold all ordinary table privileges on all three tables. RLS already prevents Data API access to `authoritative_sessions`; the two Advisor findings remain valid for the other tables.
- The backend `GET /api/session/sec` route currently permits unauthenticated global preserved-SEC enumeration.

The deployed `postgres` login cannot be the repaired runtime identity. As table owner with `BYPASSRLS`, it is not constrained by RLS or membership in a lesser role.

## Minimum correct access model

1. Create NOLOGIN role `sczn3_session_sec_backend` with no bypass privileges.
2. Create a distinct LOGIN role with `NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS` and grant it membership only in `sczn3_session_sec_backend`.
3. Give that role only:
   - `session_preparations`: `SELECT`, `INSERT`, and column-level `UPDATE(consumed_at)`;
   - `authoritative_sessions`: `SELECT`, `INSERT`;
   - `preserved_secs`: `SELECT`, `INSERT`.
4. Enable RLS on both Advisor-flagged tables and add only the backend-role policies required for those operations. Add the corresponding backend policies to the already-RLS-protected `authoritative_sessions` table.
5. Revoke every table privilege on `session_preparations` and `preserved_secs` from `PUBLIC`, `anon`, and `authenticated`. Do not add browser policies.
6. Set the dedicated connection only in Render as `SCZN3_SESSION_SEC_DATABASE_URL`. Session Authority and SEC preservation no longer fall back to the `postgres` `DATABASE_URL`.
7. Set a server-only, randomly generated `SCZN3_SEC_REOPEN_SIGNING_KEY` of at least 32 bytes. It is never returned or embedded in browser assets.

## Application boundary

- `POST /api/session/sec` continues to validate and immutably preserve the exact SEC. It additionally returns a backend-signed capability scoped to that exact `sessionId + artifactSha256`.
- `GET /api/session/sec` without an exact session is denied. There is no anonymous global list.
- Exact GET requires `X-SCZN3-SEC-Reopen-Capability` and verifies both session and immutable artifact hash.
- A capability for SEC A cannot open SEC B.
- Browser capabilities are stored locally and sent only in the request header, never in a URL.
- A browser holding a legacy exact local SEC may POST it. The existing immutable hash check is its proof path; only an exact match receives new reopen authority.
- The Ballistic Vault enumerates browser-held SEC identities locally. Backend-global enumeration remains unavailable until a separately governed authenticated owner exists.

## Controlled production sequence

Production execution must be coordinated; applying only one layer is not the repair.

1. Generate the dedicated LOGIN password and reopen signing key outside source control.
2. Provision the LOGIN role and `SCZN3_SESSION_SEC_DATABASE_URL` secret without displaying either credential in logs or browser code.
3. Add `SCZN3_SEC_REOPEN_SIGNING_KEY` to the backend environment.
4. Apply `migrations/007_secure_session_and_sec_tables.sql` as the existing database owner.
5. Run metadata and direct-role smoke checks before application cutover.
6. Deploy only the approved security patch.
7. Exercise prepare → start → preserve → exact reopen through the real service.
8. Prove anonymous list denial, missing/wrong/cross-SEC capability denial, and update/delete denial.
9. Rerun Supabase Security Advisor and preserve its before/after output.

If the dedicated connection fails the smoke check, do not deploy the application patch. The migration leaves the current owner connection operational during controlled verification, while browser/Data API access is reduced.

## Local proof completed

- Exact prepare/start/preserve/reopen SQL operations passed as a non-owner, non-bypass member of the proposed role.
- `anon` preserved-SEC read denied.
- `authenticated` session-preparation write denied.
- Backend preserved-SEC update and delete denied.
- Global HTTP listing denied.
- Missing, tampered, and cross-SEC capabilities denied.
- Correct capability reopened the exact hash-identical SEC.
- Legacy exact-artifact proof regained authority; a changed artifact failed immutable preservation.
