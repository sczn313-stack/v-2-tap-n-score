import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../sec_session_timeline.js", import.meta.url), "utf8");
const context = { window: {}, globalThis: {} };
vm.createContext(context);
vm.runInContext(source, context);
const timeline = context.window.SCZN3SECSessionTimeline;

const identity = "BAKER_SL_ST1::BAKER_SL_ST1_23X35_STANDARD_WHITE";
function payload(entries) {
  return {
    ok: true,
    sessions: entries.map(entry => ({
      sessionId: entry.id,
      sessionIdAuthority: "backend",
      savedToSEC: true,
      targetIdentity: entry.identity ?? identity,
      metric: entry.metric
    })),
    artifacts: entries.map(entry => ({
      sessionId: entry.id,
      artifactSha256: entry.hash ?? `hash-${entry.id}`,
      preservedAt: entry.preservedAt
    }))
  };
}
const options = records => ({
  records,
  expectedIdentity: identity,
  identityResolver: session => session.targetIdentity,
  metricResolver: session => typeof session.metric === "number" && Number.isFinite(session.metric) ? session.metric : Number.NaN,
  currentSessionId: "s12"
});
const entries = Array.from({ length: 12 }, (_, index) => ({
  id: `s${index + 1}`,
  metric: 100 + index,
  preservedAt: `2026-08-${String(index + 1).padStart(2, "0")}T12:00:00Z`
}));

assert.equal(timeline.preservedRecords(null).length, 0);
assert.equal(timeline.build(options([])).points.length, 0, "zero preserved SECs create zero points");

const oneRecords = timeline.preservedRecords(payload(entries.slice(0, 1)));
assert.equal(timeline.build(options(oneRecords)).points.length, 1, "one preserved SEC creates one point");

const three = timeline.build(options(timeline.preservedRecords(payload(entries.slice(0, 3)))));
assert.deepEqual(Array.from(three.points, point => point.sessionId), ["s1", "s2", "s3"], "fewer than 10 retain only real chronological points");

const ten = timeline.build(options(timeline.preservedRecords(payload(entries.slice(0, 10)))));
assert.equal(ten.points.length, 10, "exactly 10 preserved SECs create 10 points");

const newestTen = timeline.build(options(timeline.preservedRecords(payload([...entries].reverse()))));
assert.deepEqual(Array.from(newestTen.points, point => point.sessionId), ["s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12"], "more than 10 returns newest 10 in chronological order");
assert.equal(newestTen.points.at(-1).current, true, "current SEC is marked only when present in preserved records");

const unsavedCurrent = { sessionId: "unsaved", sessionIdAuthority: "backend", savedToSEC: false, targetIdentity: identity, metric: 999 };
const unsavedPayload = payload(entries.slice(0, 2));
unsavedPayload.sessions.push(unsavedCurrent);
unsavedPayload.artifacts.push({ sessionId: "unsaved", artifactSha256: "hash-unsaved", preservedAt: "2026-08-14T12:00:00Z" });
assert.equal(timeline.build({ ...options(timeline.preservedRecords(unsavedPayload)), currentSessionId: "unsaved" }).points.some(point => point.sessionId === "unsaved"), false, "current unsaved SEC is excluded");

const filteredPayload = payload([
  entries[0],
  { ...entries[1], identity: "OTHER::V1" },
  { ...entries[2], metric: "not-a-number" },
  { ...entries[3], preservedAt: "invalid" },
  { ...entries[4], metric: undefined }
]);
const filtered = timeline.build(options(timeline.preservedRecords(filteredPayload)));
assert.deepEqual(Array.from(filtered.points, point => point.sessionId), ["s1"], "identity, metric, and backend timestamp failures suppress points");

const missingArtifact = payload(entries.slice(0, 2));
missingArtifact.artifacts.pop();
assert.deepEqual(Array.from(timeline.preservedRecords(missingArtifact), record => record.sessionId), ["s1"], "one point requires one backend preservation artifact");

const html = timeline.render(newestTen, { recordsHref: "records.html" });
assert.match(html, /LAST 10 SCORES/i);
assert.equal((html.match(/class="sec-session-timeline-point/g) || []).length, 10);
assert.match(html, /records\.html\?session=s3&amp;view=sec/);
assert.match(html, /records\.html\?session=s12&amp;view=sec/);
assert.doesNotMatch(timeline.render({ points: [] }), /sec-session-timeline-point/);

console.log("PASS Universal SEC Session timeline contract");
