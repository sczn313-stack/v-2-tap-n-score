-- OPS V3 authoritative event store.
-- Provider target: Supabase Postgres.

create extension if not exists pgcrypto;

create table if not exists ops_events (
  id uuid primary key default gen_random_uuid(),

  event_type text not null check (
    event_type in (
      'arrival',
      'pageView',
      'sessionStart',
      'showResults',
      'sessionSaved',
      'returnShooter'
    )
  ),

  arrival_id text,
  session_id text,

  referral_source text not null default 'Unknown',
  target_source text not null default 'Unknown',
  region text not null default 'Unknown',
  path text,
  occurred_at timestamptz not null default now(),

  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists ops_events_event_type_idx on ops_events (event_type);
create index if not exists ops_events_occurred_at_idx on ops_events (occurred_at);
create index if not exists ops_events_arrival_id_idx on ops_events (arrival_id);
create index if not exists ops_events_session_id_idx on ops_events (session_id);
create index if not exists ops_events_referral_source_idx on ops_events (referral_source);
create index if not exists ops_events_target_source_idx on ops_events (target_source);
create index if not exists ops_events_region_idx on ops_events (region);

create unique index if not exists ops_events_unique_arrival
  on ops_events (arrival_id)
  where event_type = 'arrival' and arrival_id is not null;
