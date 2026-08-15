#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [target, records] = await Promise.all([
  readFile("t/baker/sl-st1/index.html", "utf8"),
  readFile("records.html", "utf8"),
]);

const targetAssetVersions = {
  "baker-sl-st1-sec.css": "session-2-uspsa-1",
  "app_state.js": "mission-a-fresh-score-0814",
  "sec_dispatch.js": "mission-a-fresh-score-0814",
  "m4_runtime.js": "mission-a-fresh-score-0814",
  "sec_v1.js": "mission-a-fresh-score-0814",
  "sec_session_timeline.js": "session-2-uspsa-1",
  "baker_sl_st1_sec.js": "session-2-uspsa-1"
};

for (const [asset, token] of Object.entries(targetAssetVersions)) {
  assert.match(target, new RegExp(`${asset.replaceAll(".", "\\.")}\\?v=${token}`));
  assert.match(records, new RegExp(`${asset.replaceAll(".", "\\.")}\\?v=[A-Za-z0-9._-]+`));
}
assert.match(target, /target-page\.js\?v=session-2-uspsa-1/);

const targetRuntime = await readFile("t/baker/sl-st1/target-page.js", "utf8");
assert.match(targetRuntime, /authoritativeSessionId:\s*""/);
assert.match(targetRuntime, /session\.sessionId === state\.authoritativeSessionId/);
assert.match(targetRuntime, /state\.authoritativeSessionId = created\.sessionId/);

console.log("PASS fresh Mission A runtime assets are version-locked");
