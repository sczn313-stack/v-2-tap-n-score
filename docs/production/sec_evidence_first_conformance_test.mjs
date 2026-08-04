import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const stageOrder = ["evidence", "measurement", "recommendation", "execution", "validation", "preservation"];
const sources = Object.fromEntries(await Promise.all(
  ["sec_v1.js", "sec.html", "records.html", "m4_smart_target_sec.js", "universal_practice_sec.js", "sec_framework.js"]
    .map(async file => [file, await readFile(file, "utf8")])
));
const styles = await readFile("styles.css", "utf8");
const m4Styles = await readFile("m4-sec.css", "utf8");

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
assert.match(sources["records.html"], /function renderBaker100YardReferenceSec\(session, pkg\)/, "100 Yard uses the zeroing reference renderer");
assert.match(sources["records.html"], /class="sec-experience m4-reference-sec-card zeroing-reference-sec-card"/, "100 Yard inherits the M4 SEC card shell");
assert.match(sources["records.html"], /class="sec-target-story"/, "100 Yard inherits the M4 target-story layout");
assert.match(sources["records.html"], /class="sec-before-after" aria-label="Initial and confirmation group comparison"/, "100 Yard uses the fixed M4 before/after evidence component");
assert.match(sources["records.html"], /Confirmation not recorded/, "100 Yard preserves the confirmation-target footprint when no group is saved");
[
  "Initial and Confirmation Groups",
  "Group Analysis",
  "Sight Correction",
  "Apply the Correction",
  "Confirmation Outcome",
  "Save the Complete Shooting Event",
].forEach(heading => assert.match(sources["records.html"], new RegExp(heading), `100 Yard reference SEC: missing ${heading}`));
assert.match(sources["records.html"], /function renderGssfM4ReferenceSec\(session, pkg\)/, "GSSF has an M4 reference renderer");
assert.match(sources["records.html"], /class="sec-experience m4-reference-sec-card gssf-m4-reference-sec-card"/, "GSSF inherits the same M4 SEC card shell");
assert.match(sources["records.html"], /if \(isGssfAuthorityPackage\(pkg\)\) return renderGssfM4ReferenceSec\(session, pkg\);/, "every governed GSSF result uses the universal SEC without a review-only query");
[
  "Target and Scoring Analysis",
  "Timer and Result Inputs",
  "GSSF Score",
  "Complete the Result",
  "GSSF Final Results",
  "Save the Complete Shooting Event",
].forEach(heading => assert.match(sources["records.html"], new RegExp(heading), `GSSF reference SEC: missing ${heading}`));
assert.match(sources["records.html"], /<span>Initial<\/span><strong>Confirmed Impacts<\/strong>/, "GSSF exposes the initial-target caption");
assert.match(sources["records.html"], /<span>Analysis<\/span><strong>Shot Distribution<\/strong>/, "GSSF uses the approved scoring-analysis exception in the second evidence panel");
assert.match(sources["records.html"], /Down Zero[\s\S]*?\+1[\s\S]*?\+3[\s\S]*?Miss \/ Other/, "GSSF analysis preserves the governed scoring buckets");
assert.doesNotMatch(sources["records.html"], /<div class="sec-correction-call">\$\{scoreBreakdown\}<\/div>/, "GSSF must not use the oversized score hero");
assert.match(m4Styles, /\.sec-before-after figcaption\{[^}]*min-height:42px/, "universal target captions share one footprint");
assert.match(m4Styles, /\.records-page \.m4-reference-sec-card \.sec-universal-stage-evidence\{min-height:620px\}/, "reference SEC evidence stages share one desktop footprint");

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
assert.doesNotMatch(sources["sec.html"], /Authority version|Evidence hash|Confirmation authority|backend authority/, "the preserved M4 SEC must not expose internal authority terminology");
assert.doesNotMatch(sources["sec_framework.js"], /score\.method|group\.method|Geometry validation|Mechanical validation/, "M4 result cards must use shooter-facing labels instead of internal method identifiers");

console.log("PASS universal evidence-first SEC and Ballistic Vault conformance");
