-- Backend Session Authority durable schema.
-- Provider target: the existing approved Supabase Postgres DATABASE_URL.

create extension if not exists pgcrypto;

create table if not exists session_preparations (
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

create index if not exists session_preparations_expires_at_idx
  on session_preparations (expires_at);
create index if not exists session_preparations_target_id_idx
  on session_preparations (target_id);

create table if not exists authoritative_sessions (
  authoritative_session_id text primary key,
  preparation_id uuid not null references session_preparations(id),
  idempotency_key text not null unique,
  request_fingerprint text not null,
  target_id text not null,
  target_profile_version text not null,
  atp_id text not null,
  mission_identity jsonb not null,
  governed_distance jsonb not null,
  selected_equipment jsonb not null,
  lifecycle_status text not null check (lifecycle_status in ('created', 'active', 'completed', 'preserved', 'abandoned')),
  response_package jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists authoritative_sessions_target_id_idx
  on authoritative_sessions (target_id);
create index if not exists authoritative_sessions_created_at_idx
  on authoritative_sessions (created_at);
create index if not exists authoritative_sessions_lifecycle_status_idx
  on authoritative_sessions (lifecycle_status);
