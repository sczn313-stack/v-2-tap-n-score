import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile("production/qt_episode64_founder_review_server.py", "utf8");

assert.match(source, /PostgresSessionStore/);
assert.match(source, /PostgresPreservedSECStore/);
assert.match(source, /SESSION_STORE\s*=\s*PostgresSessionStore\(\)/);
assert.match(source, /PRESERVED_SEC_STORE\s*=\s*PostgresPreservedSECStore\(\)/);
assert.doesNotMatch(source, /MemoryStore/);

assert.match(source, /prepare_session\(payload, SESSION_STORE,/);
assert.match(source, /start_session\(payload, SESSION_STORE,/);
assert.match(source, /execute_authoritative_session\(payload, SESSION_STORE,/);
assert.match(source, /list_preserved_secs\(PRESERVED_SEC_STORE\)/);
assert.match(source, /read_preserved_sec\(session_id, PRESERVED_SEC_STORE\)/);
assert.match(source, /preserve_sec\(payload, PRESERVED_SEC_STORE,/);

console.log("PASS Episode 64 Founder-review runtime uses durable Postgres session and preserved-SEC stores");
