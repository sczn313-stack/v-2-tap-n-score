-- Voluntary first-party SCZN3 Rate Us records.

create table if not exists experience_ratings (
  id uuid primary key default gen_random_uuid(),
  submission_key text not null unique,
  request_fingerprint text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  submitted_at timestamptz not null default now(),
  source text not null check (source = 'voluntary_rate_us'),
  shooter_relationship text not null,
  relationship_scope text not null,
  originating_route text,
  originating_view text,
  activity_context text,
  target_profile_id text,
  target_label text,
  publisher_id text,
  publisher_label text,
  session_id text,
  sec_exists boolean not null default false,
  sec_state text not null,
  current_stage text,
  completion_status text not null,
  context jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists experience_ratings_submitted_at_idx on experience_ratings (submitted_at desc);
create index if not exists experience_ratings_target_idx on experience_ratings (target_profile_id);
create index if not exists experience_ratings_publisher_idx on experience_ratings (publisher_id);
create index if not exists experience_ratings_activity_idx on experience_ratings (activity_context);
create index if not exists experience_ratings_relationship_idx on experience_ratings (shooter_relationship);
