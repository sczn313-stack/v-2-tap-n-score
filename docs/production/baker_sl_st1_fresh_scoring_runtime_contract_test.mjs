#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const token = "mission-a-fresh-score-0814";
const [target, records] = await Promise.all([
  readFile("t/baker/sl-st1/index.html", "utf8"),
  readFile("records.html", "utf8"),
]);

for (const asset of ["baker-sl-st1-sec.css", "app_state.js", "sec_dispatch.js", "m4_runtime.js", "sec_v1.js", "baker_sl_st1_sec.js"]) {
  assert.match(target, new RegExp(`${asset.replaceAll(".", "\\.")}\\?v=${token}`));
  assert.match(records, new RegExp(`${asset.replaceAll(".", "\\.")}\\?v=[A-Za-z0-9._-]+`));
}
assert.match(target, new RegExp(`target-page\\.js\\?v=${token}`));

const targetRuntime = await readFile("t/baker/sl-st1/target-page.js", "utf8");
assert.match(targetRuntime, /authoritativeSessionId:\s*""/);
assert.match(targetRuntime, /session\.sessionId === state\.authoritativeSessionId/);
assert.match(targetRuntime, /state\.authoritativeSessionId = created\.sessionId/);

console.log("PASS fresh Mission A runtime assets are version-locked");
