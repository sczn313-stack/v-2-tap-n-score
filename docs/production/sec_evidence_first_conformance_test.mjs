import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const stageOrder = ["evidence", "measurement", "recommendation", "execution", "validation", "preservation"];
const sources = Object.fromEntries(await Promise.all(
  ["sec_v1.js", "sec.html", "records.html", "m4_smart_target_sec.js", "universal_practice_sec.js"]
    .map(async file => [file, await readFile(file, "utf8")])
));
const styles = await readFile("styles.css", "utf8");

assert.match(
  sources["sec_v1.js"],
  /const REQUIRED_REGIONS = \["evidence", "measurement", "recommendation", "execution", "validation", "preservation"\]/
);

function positions(source, patternForStage) {
  return stageOrder.map(stage => source.indexOf(patternForStage(stage)));
}

function assertOrdered(label, values) {
  values.forEach((position, index) => assert.ok(position >= 0, `${label}: missing ${stageOrder[index]}`));
  values.slice(1).forEach((position, index) => {
    assert.ok(position > values[index], `${label}: ${stageOrder[index + 1]} must follow ${stageOrder[index]}`);
  });
}

assertOrdered("M4 live SEC", positions(sources["sec.html"], stage => `data-sec-stage="${stage}"`));
assertOrdered("GSSF Vault SEC", positions(sources["records.html"], stage => `key: "${stage}"`));
assertOrdered("M4 unavailable SEC", positions(sources["m4_smart_target_sec.js"], stage => `key: "${stage}"`));
assertOrdered("Universal Practice SEC", positions(sources["universal_practice_sec.js"], stage => `key: "${stage}"`));

for (const stage of stageOrder) {
  assert.match(sources["records.html"], new RegExp(`universalSecStageHtml\\("${stage}"`), `100 Yard Vault: missing ${stage}`);
}
assert.match(
  sources["records.html"],
  /universalSecStageHtml\("evidence", "Target Evidence", `[\s\S]*?<span>Smart Target<\/span><strong>\$\{escapeHtml\(targetName\)\}<\/strong>/,
  "100 Yard SEC must present the preserved target identity before measurement and interpretation",
);

assert.match(sources["records.html"], /data-sec-export/, "preserved SECs expose Export where supported");
assert.match(sources["records.html"], /data-sec-share/, "preserved SECs expose Share where supported");
assert.match(
  sources["records.html"],
  /button\.hidden = !shareSupported;[\s\S]*?button\.disabled = !shareSupported;/,
  "Share is exposed only when the browser supports the native share capability",
);
assert.match(
  sources["records.html"],
  /delivery === "shared"[\s\S]*?delivery === "downloaded"[\s\S]*?"Share Unavailable"/,
  "SEC delivery status must report the real browser outcome",
);
assert.match(
  sources["records.html"],
  /RECORD_QUERY\.get\("session"\) \|\| RECORD_QUERY\.get\("sessionId"\)/,
  "Ballistic Vault must reopen an exact SEC from both universal and M4 preservation links",
);
assert.match(sources["records.html"], /records\.html\?session=/, "preserved SECs provide an exact reopen route");
assert.match(sources["records.html"], /REQUESTED_RECORD_SESSION_ID/, "Ballistic Vault can reopen one exact preserved session");
assert.match(styles, /\.records-page \.sec-v1-record-actions\{[\s\S]*?flex-wrap:wrap;/, "SEC actions must wrap at mobile width");
assert.match(
  styles,
  /@media \(max-width:560px\)\{[\s\S]*?\.records-page \.history-list\{[\s\S]*?grid-template-columns:minmax\(0, 1fr\);[\s\S]*?\.records-page \.history-card\{[\s\S]*?grid-template-columns:1fr;/,
  "the Ballistic Vault must collapse to one readable column at 390px",
);

const m4EvidenceEnd = sources["sec.html"].indexOf('data-sec-stage="measurement"');
assert.ok(sources["sec.html"].indexOf('id="beforeEvidenceImage"') < m4EvidenceEnd);
assert.ok(sources["sec.html"].indexOf('id="secSessionConfiguration"') > sources["sec.html"].indexOf('data-sec-stage="preservation"'));

console.log("PASS universal evidence-first SEC and Ballistic Vault conformance");
