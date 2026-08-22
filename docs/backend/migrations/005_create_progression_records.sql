create table if not exists progression_records (
  progression_evaluation_id text primary key,
  lineage_key text not null,
  sequence_number bigint not null,
  idempotency_key text not null,
  result_hash text not null,
  result jsonb not null,
  preserved_at timestamptz not null,
  unique (lineage_key, sequence_number),
  unique (lineage_key, idempotency_key)
);

create table if not exists progression_consumed_secs (
  lineage_key text not null,
  consumed_session_id text not null,
  progression_evaluation_id text not null references progression_records(progression_evaluation_id),
  primary key (lineage_key, consumed_session_id)
);

create index if not exists progression_records_lineage_sequence_idx on progression_records (lineage_key, sequence_number desc);
