"""Append-only, compare-and-set persistence for cross-session progression records."""
from __future__ import annotations

import json
import os
from copy import deepcopy
from typing import Any, Callable, Dict, Mapping, Optional


class ProgressionRecordStoreError(ValueError):
    pass


class MemoryProgressionRecordStore:
    def __init__(self):
        self.records: Dict[str, Dict[str, Any]] = {}
        self.lineages: Dict[str, list[str]] = {}
        self.idempotency: Dict[tuple[str, str], str] = {}

    def latest(self, lineage_key: str) -> Optional[Dict[str, Any]]:
        ids = self.lineages.get(lineage_key, [])
        return deepcopy(self.records[ids[-1]]) if ids else None

    def consumed_session_ids(self, lineage_key: str) -> set[str]:
        return {session_id for record_id in self.lineages.get(lineage_key, []) for session_id in self.records[record_id]["result"]["sourceSECs"]["newlyConsumedSessionIds"]}

    def apply(self, lineage_key: str, idempotency_key: str, expected_prior_id: Optional[str], build: Callable[[Optional[Mapping[str, Any]], set[str]], Mapping[str, Any]]) -> Dict[str, Any]:
        replay_id = self.idempotency.get((lineage_key, idempotency_key))
        if replay_id:
            return {**deepcopy(self.records[replay_id]), "idempotentReplay": True}
        prior = self.latest(lineage_key)
        prior_id = prior["progressionEvaluationId"] if prior else None
        if expected_prior_id != prior_id:
            raise ProgressionRecordStoreError("progression_prior_record_conflict")
        result = deepcopy(dict(build(prior["result"] if prior else None, self.consumed_session_ids(lineage_key))))
        record_id = result["progressionEvaluationId"]
        if record_id in self.records:
            raise ProgressionRecordStoreError("progression_record_identity_conflict")
        record = {"progressionEvaluationId": record_id, "lineageKey": lineage_key, "resultHash": result["resultHash"], "result": result, "preservedAt": result["evaluatedAt"]}
        self.records[record_id] = deepcopy(record)
        self.lineages.setdefault(lineage_key, []).append(record_id)
        self.idempotency[(lineage_key, idempotency_key)] = record_id
        return deepcopy(record)

    def get(self, evaluation_id: str) -> Optional[Dict[str, Any]]:
        return deepcopy(self.records.get(evaluation_id))


class PostgresProgressionRecordStore:
    def __init__(self, database_url: Optional[str] = None, connect_fn: Any = None):
        self.database_url = database_url if database_url is not None else os.environ.get("DATABASE_URL", "")
        self.connect_fn = connect_fn

    def _connect(self):
        if not self.database_url:
            raise ProgressionRecordStoreError("DATABASE_URL_not_configured")
        if self.connect_fn:
            return self.connect_fn(self.database_url)
        import psycopg
        from psycopg.rows import dict_row
        return psycopg.connect(self.database_url, row_factory=dict_row)

    def latest(self, lineage_key: str):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select progression_evaluation_id, lineage_key, result_hash, result, preserved_at from progression_records where lineage_key = %s order by sequence_number desc limit 1", (lineage_key,))
                row = cursor.fetchone()
        return self._row(row) if row else None

    def consumed_session_ids(self, lineage_key: str) -> set[str]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select consumed_session_id from progression_consumed_secs where lineage_key = %s", (lineage_key,))
                rows = cursor.fetchall()
        return {row["consumed_session_id"] for row in rows}

    def apply(self, lineage_key: str, idempotency_key: str, expected_prior_id: Optional[str], build):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select progression_evaluation_id, lineage_key, result_hash, result, preserved_at from progression_records where lineage_key = %s and idempotency_key = %s", (lineage_key, idempotency_key))
                replay = cursor.fetchone()
                if replay:
                    return {**self._row(replay), "idempotentReplay": True}
                cursor.execute("select progression_evaluation_id, lineage_key, result_hash, result, preserved_at, sequence_number from progression_records where lineage_key = %s order by sequence_number desc limit 1 for update", (lineage_key,))
                prior_row = cursor.fetchone()
                prior = self._row(prior_row) if prior_row else None
                if expected_prior_id != (prior["progressionEvaluationId"] if prior else None):
                    raise ProgressionRecordStoreError("progression_prior_record_conflict")
                cursor.execute("select consumed_session_id from progression_consumed_secs where lineage_key = %s", (lineage_key,))
                consumed = {row["consumed_session_id"] for row in cursor.fetchall()}
                result = deepcopy(dict(build(prior["result"] if prior else None, consumed)))
                sequence = int(prior_row["sequence_number"]) + 1 if prior_row else 1
                cursor.execute("insert into progression_records (progression_evaluation_id, lineage_key, sequence_number, idempotency_key, result_hash, result, preserved_at) values (%s,%s,%s,%s,%s,%s::jsonb,%s::timestamptz)", (result["progressionEvaluationId"], lineage_key, sequence, idempotency_key, result["resultHash"], json.dumps(result, sort_keys=True, separators=(",", ":")), result["evaluatedAt"]))
                for session_id in result["sourceSECs"]["newlyConsumedSessionIds"]:
                    cursor.execute("insert into progression_consumed_secs (lineage_key, consumed_session_id, progression_evaluation_id) values (%s,%s,%s)", (lineage_key, session_id, result["progressionEvaluationId"]))
        return {"progressionEvaluationId": result["progressionEvaluationId"], "lineageKey": lineage_key, "resultHash": result["resultHash"], "result": result, "preservedAt": result["evaluatedAt"]}

    def get(self, evaluation_id: str):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select progression_evaluation_id, lineage_key, result_hash, result, preserved_at from progression_records where progression_evaluation_id = %s", (evaluation_id,))
                row = cursor.fetchone()
        return self._row(row) if row else None

    @staticmethod
    def _row(row):
        return {"progressionEvaluationId": row["progression_evaluation_id"], "lineageKey": row["lineage_key"], "resultHash": row["result_hash"], "result": row["result"], "preservedAt": row["preserved_at"].isoformat() if hasattr(row["preserved_at"], "isoformat") else str(row["preserved_at"])}


def runtime_progression_record_store() -> PostgresProgressionRecordStore:
    return PostgresProgressionRecordStore()
