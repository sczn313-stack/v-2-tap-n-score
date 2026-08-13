import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const zeroingStageOrder = ["target", "session", "sight-correction"];
const sources = Object.fromEntries(await Promise.all(
  ["sec_v1.js", "sec.html", "records.html", "m4_smart_target_sec.js", "universal_practice_sec.js", "sec_framework.js"]
    .map(async file => [file, await readFile(file, "utf8")])
));
const styles = await readFile("styles.css", "utf8");
const m4Styles = await readFile("m4-sec.css", "utf8");
const universalUi = await readFile("universal-ui.css", "utf8");
const shooterWorkspace = await readFile("shoot.html", "utf8");
const netlifyBuild = await readFile("production/build-netlify.mjs", "utf8");
const serverBuild = await readFile("production/build-site.mjs", "utf8");

assert.match(sources["sec_framework.js"], /impacts\.map\(\(point, index\) => marker\(point, "impact-marker", index \+ 1\)\)/, "M4 SEC markers expose contiguous count identifiers");

assert.match(
  sources["sec_v1.js"],
  /const REQUIRED_REGIONS = \["target", "session", "actions"\]/
);
assert.match(sources["sec_v1.js"], /const OPTIONAL_REGIONS = \["sightCorrection"\]/);

function positions(source, stages, patternForStage) {
  return stages.map(stage => source.indexOf(patternForStage(stage)));
}

function assertOrdered(label, stages, values) {
  values.forEach((position, index) => assert.ok(position >= 0, `${label}: missing ${stages[index]}`));
  values.slice(1).forEach((position, index) => {
    assert.ok(position > values[index], `${label}: ${stages[index + 1]} must follow ${stages[index]}`);
  });
}

assertOrdered("M4 live SEC", zeroingStageOrder, positions(sources["sec.html"], zeroingStageOrder, stage => `data-sec-stage="${stage}"`));
assert.match(sources["sec.html"], /<details class="sec-universal-stage sec-universal-stage-target sec-accordion-stage" data-sec-stage="target" open>/, "TARGET is the initially open accordion stage");
for (const label of ["Session", "Sight Correction"]) assert.match(sources["sec.html"], new RegExp(`<h2>${label}<\\/h2>`), `M4 live SEC: missing ${label} disclosure pill`);
assert.equal((sources["sec.html"].match(/sec-collapsible-stage/g) || []).length, 2, "M4 live SEC must expose two collapsible stages");
assert.equal((sources["sec.html"].match(/class="[^"]*sec-accordion-stage/g) || []).length, 3, "M4 live SEC must bind three numbered stages to one accordion");
assert.doesNotMatch(sources["sec.html"], /<details class="sec-universal-stage(?! sec-universal-stage-target)[^>]*\sopen(?:\s|>)/, "SESSION and SIGHT CORRECTION must be collapsed on initial load");
assert.match(sources["sec.html"], /SEC_ACCORDION_STAGES\.forEach\(stage => \{[\s\S]*?if \(!stage\.open\) return;[\s\S]*?if \(otherStage !== stage\) otherStage\.open = false;/, "opening one SEC stage closes every other stage");
assert.match(m4Styles, /\.sec-stage-pill\{[\s\S]*?min-height:var\(--sczn3-pill-height\)/, "SEC disclosure headers use the universal pill footprint");
assertOrdered("M4 unavailable SEC", ["target", "session", "sightCorrection", "actions"], positions(sources["m4_smart_target_sec.js"], ["target", "session", "sightCorrection", "actions"], stage => `key: "${stage}"`));
assertOrdered("Universal Practice SEC", ["target", "session", "actions"], positions(sources["universal_practice_sec.js"], ["target", "session", "actions"], stage => `key: "${stage}"`));
for (const stage of zeroingStageOrder.slice(1)) assert.match(sources["records.html"], new RegExp(`universalSecStageHtml\\("${stage}"`), `Zeroing Vault: missing ${stage}`);
assert.match(sources["records.html"], /function universalShooterActionBarHtml/, "every saved SEC uses the unnumbered Shooter Action Bar");
assert.match(sources["records.html"], /function renderBaker100YardReferenceSec\(session, pkg\)/, "100 Yard uses the zeroing reference renderer");
assert.match(sources["records.html"], /class="sec-experience m4-reference-sec-card zeroing-reference-sec-card"/, "100 Yard inherits the M4 SEC card shell");
assert.match(sources["records.html"], /class="sec-target-story"/, "100 Yard inherits the M4 target-story layout");
assert.match(sources["records.html"], /class="sec-before-after" aria-label="Initial and confirmation group comparison"/, "100 Yard uses the fixed M4 before/after evidence component");
assert.match(sources["records.html"], /Confirmation not recorded/, "100 Yard preserves the confirmation-target footprint when no group is saved");
[
  "Initial and Confirmation Groups",
  "Session Details",
  "Sight Correction",
  "How to Confirm",
].forEach(heading => assert.match(sources["records.html"], new RegExp(heading), `100 Yard reference SEC: missing ${heading}`));
assert.match(sources["records.html"], /function renderGssfM4ReferenceSec\(session, pkg\)/, "GSSF has an M4 reference renderer");
assert.match(sources["records.html"], /class="sec-experience m4-reference-sec-card gssf-m4-reference-sec-card"/, "GSSF inherits the same M4 SEC card shell");
assert.match(sources["records.html"], /dispatch\.adapter === SCZN3SECDispatch\.ADAPTERS\.GSSF && isGssfAuthorityPackage\(pkg\)/, "every governed GSSF result uses the identity-selected universal SEC without a review-only query");
[
  "Target and Scoring Analysis",
  "Session Details",
  "Analysis",
].forEach(heading => assert.match(sources["records.html"], new RegExp(heading), `GSSF reference SEC: missing ${heading}`));
assert.doesNotMatch(sources["records.html"].slice(sources["records.html"].indexOf("function renderGssfM4ReferenceSec"), sources["records.html"].indexOf("function renderHistory")), /universalSecStageHtml\("sight-correction"/, "GSSF must not receive a sight-correction stage");
assert.match(sources["records.html"], /<span>Initial<\/span><strong>Confirmed Impacts<\/strong>/, "GSSF exposes the initial-target caption");
assert.match(sources["records.html"], /<span>Analysis<\/span><strong>Shot Distribution<\/strong>/, "GSSF uses the approved scoring-analysis exception in the second evidence panel");
assert.match(sources["records.html"], /Down Zero[\s\S]*?\+1[\s\S]*?\+3[\s\S]*?Miss \/ Other/, "GSSF analysis preserves the governed scoring buckets");
assert.match(sources["records.html"], /function gssfEvidenceVisualForPackage\(pkg\)[\s\S]*?renderedHits\.map[\s\S]*?authorityPoint\(renderedHit\)[\s\S]*?gssf-zone-\$\{gssfZoneTone\(hit\.zone\)\}[\s\S]*?String\(index \+ 1\)/, "GSSF evidence markers must preserve backend coordinates while exposing contiguous count identifiers");
assert.match(sources["records.html"], /Array\.isArray\(result\.shotIds\)[\s\S]*?<b>Shots:<\/b>[\s\S]*?shotIds\.join\(", "\)/, "GSSF scoring buckets must preserve authoritative shot-number lineage");
assert.doesNotMatch(sources["records.html"], /<div class="sec-correction-call">\$\{scoreBreakdown\}<\/div>/, "GSSF must not use the oversized score hero");
assert.doesNotMatch(sources["records.html"], /<span class="sec-save-status">Saved SEC<\/span>/, "preservation sections must not repeat the saved-state label");
assert.doesNotMatch(sources["records.html"], /Backend shot classifications|Diagnostic validation evidence|Marker coordinate validation/, "preserved GSSF SECs must not expose developer diagnostics");
assert.match(sources["records.html"], /class="vault-record-summary[^"]*"[\s\S]*?OPEN SEC →/, "Vault browse cards must expose one full-SEC action");
assert.match(m4Styles, /\.sec-before-after figcaption\{[^}]*min-height:42px/, "universal target captions share one footprint");
assert.match(m4Styles, /\.records-page \.m4-reference-sec-card \.sec-universal-stage-evidence,\.records-page \.m4-reference-sec-card \.sec-universal-stage-target\{min-height:620px\}/, "reference SEC target stages share one desktop footprint");

[
  "--sczn3-control-height:42px",
  "--sczn3-control-radius:8px",
  "--sczn3-control-background:#101010",
  "--sczn3-control-border:#d9960b",
  "--sczn3-control-active-background:#d9960b",
  "--sczn3-pill-height:38px",
  "--sczn3-pill-radius:999px",
].forEach(token => assert.ok(styles.includes(token), `universal UI standard: missing ${token}`));
assert.match(universalUi, /Founder UI Standard — one control language across every mission and preserved SEC/, "universal button and pill standard must be declared once");
assert.match(netlifyBuild, /"universal-ui\.css"/, "the Netlify artifact must include the governing UI standard");
assert.match(serverBuild, /"universal-ui\.css"/, "the server artifact must include the governing UI standard");
assert.match(universalUi, /\.records-page \.sec-v1-record-actions button,[\s\S]*?height:var\(--sczn3-control-height\)/, "Vault actions inherit the universal button footprint");
assert.match(universalUi, /\.workflow-control-row \.button\.next-step,[\s\S]*?background:var\(--sczn3-control-active-background\)/, "active workflow actions inherit the universal gold state");
assert.match(universalUi, /\.status-pill,[\s\S]*?\.vendor-pill,[\s\S]*?height:var\(--sczn3-pill-height\)/, "SEC pills inherit the universal pill footprint");
assert.match(universalUi, /\.analytics-filter-row button,[\s\S]*?\.ops-window-row button,[\s\S]*?height:var\(--sczn3-control-height\)/, "analytics and operations filters inherit the universal button footprint");
assert.match(universalUi, /\.proof-pill,[\s\S]*?\.ops-live-pill[\s\S]*?height:var\(--sczn3-pill-height\)/, "proof and operations status pills inherit the universal pill footprint");
assert.match(universalUi, /\.ecosystem-family-actions \.button,[\s\S]*?\.matrix-page \.weapon-top-row \.button,[\s\S]*?height:var\(--sczn3-control-height\)/, "landing and equipment actions inherit the universal button footprint");
assert.match(universalUi, /\.target-page \.workflow-control-row > \.button\.next-step,[\s\S]*?background:var\(--sczn3-control-active-background\)/, "the Target Workspace height exception must retain the universal active colors");
for (const page of ["analytics.html", "backend-authority-proof.html", "buy-targets.html", "index.html", "matrix.html", "ops.html", "records.html", "sec.html", "shoot.html", "survey.html"]) {
  assert.match(await readFile(page, "utf8"), /<link rel="stylesheet" href="universal-ui\.css\?v=founder-ui-standard-1" \/>/, `${page} must load the governing UI standard`);
}
for (const page of ["backend-authority-proof.html", "ops.html"]) {
  const source = await readFile(page, "utf8");
  assert.ok(source.lastIndexOf("universal-ui.css") > source.lastIndexOf("</style>"), `${page} must load the governing UI standard after page-local CSS`);
}

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
assert.match(sources["records.html"], /function historicalSecUrl/, "preserved SECs provide a mission-appropriate exact reopen route");
assert.match(sources["records.html"], /REQUESTED_RECORD_SESSION_ID/, "Ballistic Vault can reopen one exact preserved session");
assert.match(styles, /\.records-page \.sec-v1-record-actions\{[\s\S]*?flex-wrap:wrap;/, "SEC actions must wrap at mobile width");
assert.match(
  styles,
  /@media \(max-width:560px\)\{[\s\S]*?\.records-page \.history-list\{[\s\S]*?grid-template-columns:minmax\(0, 1fr\);[\s\S]*?\.records-page \.history-card\{[\s\S]*?grid-template-columns:1fr;/,
  "the Ballistic Vault must collapse to one readable column at 390px",
);

const m4EvidenceEnd = sources["sec.html"].indexOf('data-sec-stage="session"');
assert.ok(sources["sec.html"].indexOf('id="beforeEvidenceImage"') < m4EvidenceEnd);
assert.match(sources["sec.html"], /<summary class="sec-universal-stage-heading sec-evidence-toggle"><span>1 · TARGET<\/span><strong id="secSessionIdentifier"><\/strong><\/summary>/, "the TARGET header contains only its label and session number");
assert.doesNotMatch(sources["sec.html"].slice(0, m4EvidenceEnd), /secSessionDistance|secSessionFirearm|secSessionEquipment|secSessionAmmo|secSessionDate|secSessionTime|secSessionShooter|evidenceDataStatus/, "TARGET contains no session metadata or status text");
const m4SessionEnd = sources["sec.html"].indexOf('data-sec-stage="sight-correction"');
for (const id of ["secSessionDistance", "secSessionFirearm", "secSessionEquipment", "secSessionAmmo", "secSessionDate", "secSessionTime", "secSessionShooter"]) {
  const position = sources["sec.html"].indexOf(`id="${id}"`);
  assert.ok(position > m4EvidenceEnd && position < m4SessionEnd, `SESSION must own ${id}`);
}
assert.doesNotMatch(sources["sec.html"], /id="secSessionTarget"/, "SESSION must not repeat target identity");
assert.match(sources["sec.html"], /id="secSessionScore">Score --<\/strong>/, "SESSION score remains visible in the collapsed pill");
assert.match(sources["sec.html"], /<h3[^>]*>Session Details<\/h3>[\s\S]*?<summary>Analysis<\/summary>/, "SESSION owns details and shooter-helpful analysis");
assert.doesNotMatch(sources["sec.html"], /POIB X|POIB Y/, "SESSION analysis must not expose coordinate components");
assert.doesNotMatch(sources["sec.html"], /<h2>(?:Group Analysis|Measurements|Zero Correction|Mechanical Adjustment|Confirmation)<\/h2>/, "legacy M4 accordion sections are removed");
assert.match(sources["sec.html"], /class="sec-story-command-bar sec-shooter-action-bar" aria-label="Shooter Action Bar"/, "actions remain unnumbered below the accordion");
assert.doesNotMatch(sources["sec.html"], /id="secSessionConfiguration"|Preserved Session Setup|Preserved Shooting Setup/, "the legacy metadata strip is removed");
assert.doesNotMatch(sources["sec.html"], /Authority version|Evidence hash|Confirmation authority|backend authority/, "the preserved M4 SEC must not expose internal authority terminology");
assert.doesNotMatch(sources["sec.html"], /Engineering Traceability/, "the shooter-facing SEC must not expose engineering terminology");
assert.doesNotMatch(sources["sec_framework.js"], /score\.method|group\.method|Geometry validation|Mechanical validation/, "M4 result cards must use shooter-facing labels instead of internal method identifiers");
assert.doesNotMatch(shooterWorkspace, /m4ValidationSummary|renderM4ValidationSummary|Geometry validation|Mechanical validation|Aim-point discrepancy|materiality threshold|workspaceRuntimeDiagnostic|savePersistenceDiagnostic|Temporary Save Persistence Diagnostic/i, "the shooter workspace must not contain developer diagnostics UI");
assert.doesNotMatch(sources["sec.html"], /sec-validation-workspace|validationWorkspace|openValidation|Validation Data|Shot Coordinates &amp; Numbering/, "the shooter-facing SEC must not render the developer validation workspace");
assert.doesNotMatch(shooterWorkspace, /gssf-mode-controls|gssf-marker-validation|gssf-classification-debug|Marker coordinate validation|Backend shot classifications|Diagnostic validation evidence/, "the GSSF shooter experience must not expose developer diagnostics or validation modes");

console.log("PASS universal evidence-first SEC and Ballistic Vault conformance");
