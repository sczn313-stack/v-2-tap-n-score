"""Durable, target-agnostic mission run and immutable event storage.

This owner persists state and enforces sequencing/idempotency. It assigns no
mission meaning; the selected capability owner alone validates transitions.
"""
from __future__ import annotations

import json
import os
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Mapping, Optional


class StageEventStoreError(ValueError):
    pass


def _iso(value: Optional[datetime] = None) -> str:
    return (value or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()


class MemoryStageEventStore:
    def __init__(self):
        self.runs: Dict[str, Dict[str, Any]] = {}
        self.events: Dict[tuple[str, str], Dict[str, Any]] = {}

    def apply(
        self,
        *,
        session_id: str,
        contract_fingerprint: str,
        mission_family: str,
        action_id: str,
        expected_sequence: int,
        transition: Callable[[Optional[Mapping[str, Any]], Mapping[str, Any]], Mapping[str, Any]],
        action: Mapping[str, Any],
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        replay = self.events.get((session_id, action_id))
        if replay:
            return {**deepcopy(replay["response"]), "idempotentReplay": True}
        run = self.runs.get(session_id)
        sequence = int(run["sequenceNumber"]) if run else 0
        if expected_sequence != sequence:
            raise StageEventStoreError("mission_action_sequence_mismatch")
        if run and (run["contractFingerprint"] != contract_fingerprint or run["missionFamily"] != mission_family):
            raise StageEventStoreError("mission_run_identity_mismatch")
        occurred_at = _iso(now)
        outcome = dict(transition(deepcopy(run["state"]) if run else None, {
            **deepcopy(dict(action)),
            "backendSequenceNumber": sequence + 1,
            "backendReceivedAt": occurred_at,
        }))
        state = deepcopy(outcome["state"])
        event = deepcopy(outcome["event"])
        response = deepcopy(outcome["response"])
        event.update({"sequenceNumber": sequence + 1, "actionId": action_id, "backendReceivedAt": occurred_at})
        response.update({"sequenceNumber": sequence + 1, "actionId": action_id})
        self.runs[session_id] = {
            "contractFingerprint": contract_fingerprint,
            "missionFamily": mission_family,
            "sequenceNumber": sequence + 1,
            "terminalStatus": state.get("terminalStatus"),
            "state": state,
            "createdAt": run["createdAt"] if run else occurred_at,
            "updatedAt": occurred_at,
        }
        self.events[(session_id, action_id)] = {"event": event, "response": response}
        return deepcopy(response)

    def get_run(self, session_id: str) -> Optional[Dict[str, Any]]:
        return deepcopy(self.runs.get(session_id))


class PostgresStageEventStore:
    def __init__(self, database_url: Optional[str] = None, connect_fn: Any = None):
        self.database_url = database_url if database_url is not None else os.environ.get("DATABASE_URL", "")
        self.connect_fn = connect_fn

    def _connect(self):
        if not self.database_url:
            raise StageEventStoreError("DATABASE_URL_not_configured")
        if self.connect_fn:
            return self.connect_fn(self.database_url)
        import psycopg
        from psycopg.rows import dict_row
        return psycopg.connect(self.database_url, row_factory=dict_row)

    @staticmethod
    def _json(value: Any) -> str:
        return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)

    def apply(
        self,
        *,
        session_id: str,
        contract_fingerprint: str,
        mission_family: str,
        action_id: str,
        expected_sequence: int,
        transition: Callable[[Optional[Mapping[str, Any]], Mapping[str, Any]], Mapping[str, Any]],
        action: Mapping[str, Any],
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        occurred_at = _iso(now)
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "select response from mission_execution_events where authoritative_session_id = %s and action_id = %s",
                    (session_id, action_id),
                )
                replay = cursor.fetchone()
                if replay:
                    return {**deepcopy(replay["response"]), "idempotentReplay": True}
                cursor.execute(
                    "select contract_fingerprint, mission_family, sequence_number, state, created_at from mission_execution_runs where authoritative_session_id = %s for update",
                    (session_id,),
                )
                run = cursor.fetchone()
                if not run:
                    cursor.execute(
                        """
                        insert into mission_execution_runs (
                          authoritative_session_id, contract_fingerprint, mission_family,
                          sequence_number, terminal_status, state, created_at, updated_at
                        ) values (%s, %s, %s, 0, null, '{}'::jsonb, %s::timestamptz, %s::timestamptz)
                        on conflict (authoritative_session_id) do nothing
                        """,
                        (session_id, contract_fingerprint, mission_family, occurred_at, occurred_at),
                    )
                    cursor.execute(
                        "select contract_fingerprint, mission_family, sequence_number, state, created_at from mission_execution_runs where authoritative_session_id = %s for update",
                        (session_id,),
                    )
                    run = cursor.fetchone()
                cursor.execute(
                    "select response from mission_execution_events where authoritative_session_id = %s and action_id = %s",
                    (session_id, action_id),
                )
                replay = cursor.fetchone()
                if replay:
                    return {**deepcopy(replay["response"]), "idempotentReplay": True}
                sequence = int(run["sequence_number"]) if run else 0
                if expected_sequence != sequence:
                    raise StageEventStoreError("mission_action_sequence_mismatch")
                if run and (run["contract_fingerprint"] != contract_fingerprint or run["mission_family"] != mission_family):
                    raise StageEventStoreError("mission_run_identity_mismatch")
                outcome = dict(transition(deepcopy(run["state"]) if sequence else None, {
                    **deepcopy(dict(action)),
                    "backendSequenceNumber": sequence + 1,
                    "backendReceivedAt": occurred_at,
                }))
                state = deepcopy(outcome["state"])
                event = deepcopy(outcome["event"])
                response = deepcopy(outcome["response"])
                event.update({"sequenceNumber": sequence + 1, "actionId": action_id, "backendReceivedAt": occurred_at})
                response.update({"sequenceNumber": sequence + 1, "actionId": action_id})
                cursor.execute(
                    "update mission_execution_runs set sequence_number = %s, terminal_status = %s, state = %s::jsonb, updated_at = %s::timestamptz where authoritative_session_id = %s and sequence_number = %s",
                    (sequence + 1, state.get("terminalStatus"), self._json(state), occurred_at, session_id, sequence),
                )
                if cursor.rowcount != 1:
                    raise StageEventStoreError("mission_action_sequence_conflict")
                cursor.execute(
                    """
                    insert into mission_execution_events (
                      authoritative_session_id, sequence_number, action_id, event, response, created_at
                    ) values (%s, %s, %s, %s::jsonb, %s::jsonb, %s::timestamptz)
                    """,
                    (session_id, sequence + 1, action_id, self._json(event), self._json(response), occurred_at),
                )
        return deepcopy(response)


def runtime_stage_event_store() -> PostgresStageEventStore:
    return PostgresStageEventStore()
