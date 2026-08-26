#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.resolve(here, "..");
const targetPage = fs.readFileSync(path.join(docs, "t/baker/sl-st1/target-page.js"), "utf8");
const records = fs.readFileSync(path.join(docs, "records.html"), "utf8");
const server = fs.readFileSync(path.join(docs, "backend/server.py"), "utf8");
const migration = fs.readFileSync(path.join(docs, "backend/migrations/003_create_preserved_secs.sql"), "utf8");
const reopenAuthority = fs.readFileSync(path.join(docs, "sec_reopen_capability.js"), "utf8");

assert.match(targetPage, /\/api\/session\/sec/);
assert.match(targetPage, /body:\s*JSON\.stringify\(\{ session: saved \}\)/);
assert.match(records, /REQUESTED_RECORD_SESSION_ID/);
assert.match(records, /packageData\.session \? \[packageData\.session\]/);
assert.match(records, /SCZN3SECReopenAuthority\.provePossession\(PRESERVED_SEC_ENDPOINT, requestedLocalSession\)/);
assert.match(records, /SCZN3SECReopenAuthority\.reopen\(/);
assert.doesNotMatch(records, /fetch\(PRESERVED_SEC_ENDPOINT\s*,\s*\{\s*headers:\s*\{\s*Accept:/s);
assert.match(reopenAuthority, /X-SCZN3-SEC-Reopen-Capability/);
assert.match(server, /PRESERVED_SEC_PATHS = \{"\/api\/session\/sec"/);
assert.match(server, /read_preserved_sec\(session_id, preserved_sec_runtime_store\(\)\)/);
assert.match(server, /preserve_sec\(self\._read_json_body\(\), preserved_sec_runtime_store\(\)\)/);
assert.match(server, /preserved_sec_enumeration_not_authorized/);
assert.match(migration, /session_id text primary key references authoritative_sessions/);
assert.match(migration, /artifact_sha256 text not null/);

console.log("PASS durable preserved-SEC cross-origin contract");
