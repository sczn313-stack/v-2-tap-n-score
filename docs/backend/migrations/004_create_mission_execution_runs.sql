-- Durable, target-agnostic state for governed multi-event mission families.

create table if not exists mission_execution_runs (
  authoritative_session_id text primary key references authoritative_sessions(authoritative_session_id),
  contract_fingerprint text not null,
  mission_family text not null,
  sequence_number integer not null default 0 check (sequence_number >= 0),
  terminal_status text check (terminal_status in ('complete', 'stopped_incomplete')),
  state jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists mission_execution_events (
  authoritative_session_id text not null references mission_execution_runs(authoritative_session_id),
  sequence_number integer not null check (sequence_number >= 1),
  action_id text not null,
  event jsonb not null,
  response jsonb not null,
  created_at timestamptz not null,
  primary key (authoritative_session_id, sequence_number),
  unique (authoritative_session_id, action_id)
);

create index if not exists mission_execution_events_action_idx
  on mission_execution_events (authoritative_session_id, action_id);
