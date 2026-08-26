\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;
create role sczn3_test_backend nologin;

create schema if not exists public;
grant usage on schema public to anon, authenticated, sczn3_test_backend;

create table public.session_preparations (
  id uuid primary key,
  token_hash text not null unique,
  target_id text not null,
  target_profile_version text not null,
  atp_id text not null,
  atp_fingerprint text not null,
  mission_identity jsonb not null,
  governed_distance jsonb not null,
  equipment_requirements jsonb not null,
  standard_setup jsonb not null,
  equipment_candidates jsonb not null,
  compatibility_results jsonb not null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create table public.authoritative_sessions (
  authoritative_session_id text primary key,
  preparation_id uuid not null references public.session_preparations(id),
  idempotency_key text not null unique,
  request_fingerprint text not null,
  target_id text not null,
  target_profile_version text not null,
  atp_id text not null,
  mission_identity jsonb not null,
  governed_distance jsonb not null,
  selected_equipment jsonb not null,
  lifecycle_status text not null,
  response_package jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create table public.preserved_secs (
  session_id text primary key references public.authoritative_sessions(authoritative_session_id),
  target_id text not null,
  artifact jsonb not null,
  artifact_sha256 text not null,
  preserved_at timestamptz not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.session_preparations to anon, authenticated;
grant select, insert, update, delete on public.preserved_secs to anon, authenticated;
insert into public.session_preparations values (
  '00000000-0000-0000-0000-000000000001', 'token-hash', 'fixture-target', '1',
  'fixture-atp', 'fixture-fingerprint', '{}', '{}', '{}', '{}', '[]', '[]',
  now(), now() + interval '15 minutes', null
);
insert into public.authoritative_sessions values (
  'SCZN3-SESSION-1', '00000000-0000-0000-0000-000000000001', 'idempotency-1',
  'request-fingerprint-1', 'fixture-target', '1', 'fixture-atp', '{}', '{}', '{}',
  'completed', '{}', now(), now()
);
insert into public.preserved_secs values (
  'SCZN3-SESSION-1', 'fixture-target', '{"targetEvidenceImage":{"dataUrl":"sensitive"}}',
  'sha256', now(), now()
);

\ir migrations/007_secure_session_and_sec_tables.sql

grant sczn3_session_sec_backend to sczn3_test_backend;

do $$
declare
  privilege_count integer;
begin
  select count(*) into privilege_count
  from information_schema.table_privileges
  where table_schema = 'public'
    and table_name in ('session_preparations', 'authoritative_sessions', 'preserved_secs')
    and grantee in ('PUBLIC', 'anon', 'authenticated');
  if privilege_count <> 0 then
    raise exception 'browser-facing grants remain: %', privilege_count;
  end if;
  if (select rolbypassrls from pg_roles where rolname = 'sczn3_session_sec_backend') then
    raise exception 'backend role unexpectedly bypasses RLS';
  end if;
  if has_table_privilege('sczn3_test_backend', 'public.preserved_secs', 'UPDATE')
     or has_table_privilege('sczn3_test_backend', 'public.preserved_secs', 'DELETE') then
    raise exception 'immutable preserved SEC mutation privilege exists';
  end if;
  if not (
    select relrowsecurity from pg_class
    where oid = 'public.session_preparations'::regclass
  ) then
    raise exception 'session_preparations RLS is disabled';
  end if;
  if not (
    select relrowsecurity from pg_class
    where oid = 'public.preserved_secs'::regclass
  ) then
    raise exception 'preserved_secs RLS is disabled';
  end if;
end $$;

set role sczn3_test_backend;
select token_hash from public.session_preparations;
update public.session_preparations set consumed_at = now()
where id = '00000000-0000-0000-0000-000000000001';
select artifact_sha256 from public.preserved_secs;
select target_id from public.authoritative_sessions;
insert into public.session_preparations values (
  '00000000-0000-0000-0000-000000000002', 'token-hash-2', 'fixture-target', '1',
  'fixture-atp', 'fixture-fingerprint', '{}', '{}', '{}', '{}', '[]', '[]',
  now(), now() + interval '15 minutes', null
);
insert into public.authoritative_sessions values (
  'SCZN3-SESSION-2', '00000000-0000-0000-0000-000000000002', 'idempotency-2',
  'request-fingerprint-2', 'fixture-target', '1', 'fixture-atp', '{}', '{}', '{}',
  'created', '{"ok":true}', now(), now()
);
update public.session_preparations set consumed_at = now()
where id = '00000000-0000-0000-0000-000000000002' and consumed_at is null;
insert into public.preserved_secs values (
  'SCZN3-SESSION-2', 'fixture-target', '{"sessionId":"SCZN3-SESSION-2"}',
  'sha256-2', now(), now()
);
select artifact_sha256 from public.preserved_secs where session_id = 'SCZN3-SESSION-2';
reset role;

\echo 'PASS Supabase security repair metadata and backend operations preserved'
