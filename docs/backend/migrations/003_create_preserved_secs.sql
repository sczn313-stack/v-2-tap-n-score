-- Durable, browser-independent preserved Shooter Experience Card artifacts.

create table if not exists preserved_secs (
  session_id text primary key references authoritative_sessions(authoritative_session_id),
  target_id text not null,
  artifact jsonb not null,
  artifact_sha256 text not null,
  preserved_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists preserved_secs_preserved_at_idx
  on preserved_secs (preserved_at desc);
