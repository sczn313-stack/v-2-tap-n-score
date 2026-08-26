-- PROPOSED ONLY — Founder approval is required before production execution.
--
-- SCZN3 browsers do not access these tables through the Supabase Data API.
-- Session Authority and SEC preservation use a dedicated backend-only
-- SCZN3_SESSION_SEC_DATABASE_URL. The existing Render DATABASE_URL resolves to
-- postgres, which owns these tables and has BYPASSRLS; it MUST NOT be reused for
-- this boundary. A separate LOGIN role receives membership in this NOLOGIN role
-- during the controlled production rollout.

begin;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'sczn3_session_sec_backend') then
    create role sczn3_session_sec_backend nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
  end if;
end
$$;

alter table public.session_preparations enable row level security;
alter table public.authoritative_sessions enable row level security;
alter table public.preserved_secs enable row level security;

revoke all privileges on table public.session_preparations from public;
revoke all privileges on table public.session_preparations from anon;
revoke all privileges on table public.session_preparations from authenticated;

revoke all privileges on table public.preserved_secs from public;
revoke all privileges on table public.preserved_secs from anon;
revoke all privileges on table public.preserved_secs from authenticated;

revoke all privileges on table public.authoritative_sessions from public;
revoke all privileges on table public.authoritative_sessions from anon;
revoke all privileges on table public.authoritative_sessions from authenticated;

grant usage on schema public to sczn3_session_sec_backend;
grant select, insert on table public.session_preparations to sczn3_session_sec_backend;
grant update (consumed_at) on table public.session_preparations to sczn3_session_sec_backend;
grant select, insert on table public.authoritative_sessions to sczn3_session_sec_backend;
grant select, insert on table public.preserved_secs to sczn3_session_sec_backend;

drop policy if exists session_preparations_backend_select on public.session_preparations;
drop policy if exists session_preparations_backend_insert on public.session_preparations;
drop policy if exists session_preparations_backend_consume on public.session_preparations;
drop policy if exists preserved_secs_backend_select on public.preserved_secs;
drop policy if exists preserved_secs_backend_insert on public.preserved_secs;
drop policy if exists authoritative_sessions_session_sec_backend_select on public.authoritative_sessions;
drop policy if exists authoritative_sessions_session_sec_backend_insert on public.authoritative_sessions;

create policy session_preparations_backend_select
  on public.session_preparations for select to sczn3_session_sec_backend
  using (true);
create policy session_preparations_backend_insert
  on public.session_preparations for insert to sczn3_session_sec_backend
  with check (true);
create policy session_preparations_backend_consume
  on public.session_preparations for update to sczn3_session_sec_backend
  using (true) with check (true);

create policy preserved_secs_backend_select
  on public.preserved_secs for select to sczn3_session_sec_backend
  using (true);
create policy preserved_secs_backend_insert
  on public.preserved_secs for insert to sczn3_session_sec_backend
  with check (true);

-- authoritative_sessions already has RLS enabled. Session Authority needs only
-- exact SELECT/INSERT operations; no update/delete policy is introduced.
create policy authoritative_sessions_session_sec_backend_select
  on public.authoritative_sessions for select to sczn3_session_sec_backend
  using (true);
create policy authoritative_sessions_session_sec_backend_insert
  on public.authoritative_sessions for insert to sczn3_session_sec_backend
  with check (true);

-- Intentionally create no anon/authenticated policies. Membership in
-- sczn3_session_sec_backend is backend-secret configuration, never a browser grant.

commit;
