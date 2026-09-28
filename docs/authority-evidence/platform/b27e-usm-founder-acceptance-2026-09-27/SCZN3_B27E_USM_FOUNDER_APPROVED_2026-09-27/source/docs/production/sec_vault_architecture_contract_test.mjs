import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [sec, m4Adapter, sharedShell, records, lifecycle, appState, navigation, secCss, vaultCss, futureAuthority, targetRuntime, secDispatch] = await Promise.all([
  readFile("sec.html", "utf8"),
  readFile("m4_zeroing_sec.js", "utf8"),
  readFile("sec_v1.js", "utf8"),
  readFile("records.html", "utf8"),
  readFile("sec_reopen_lifecycle.js", "utf8"),
  readFile("app_state.js", "utf8"),
  readFile("navigation.js", "utf8"),
  readFile("m4-sec.css", "utf8"),
  readFile("ballistic-vault.css", "utf8"),
  readFile("architecture/FUTURE_BACKEND_SESSION_NUMBERING_AUTHORITY.md", "utf8"),
  readFile("target_execution_runtime.js", "utf8"),
  readFile("sec_dispatch.js", "utf8"),
]);
const vaultDestinationSources = Object.fromEntries(await Promise.all(
  [
    "sec_framework.js",
    "m4_zeroing_sec.js",
    "baker_fun_sec.js",
    "baker_sl_st1_sec.js",
    "baker_sl_st2_idpa_sec.js",
    "gunfun_vital_dude_sec.js",
    "target_execution_runtime.js",
    "sec.html",
    "matrix.html",
    "buy-targets.html",
    "analytics.html",
    "t/baker/sl-st1/index.html",
    "t/baker/sl-st2/index.html",
    "t/baker/fun/index.html",
    "t/gunfun/vital-dude/index.html",
  ].map(async file => [file, await readFile(file, "utf8")])
));

for (const [file, source] of Object.entries(vaultDestinationSources)) {
  assert.doesNotMatch(source, /View History|View SEC History|>History<|<span>History<\/span>/i, `${file} must not rename the Ballistic Vault as History`);
}
assert.match(vaultDestinationSources["sec_framework.js"], /Ballistic Vault/, "the shared SEC action names its destination Ballistic Vault");
assert.match(m4Adapter, /label: "Ballistic Vault"[^\n]*href: "records\.html"/, "the M4 SEC action names its destination Ballistic Vault");

// Current SEC: TARGET first, every stage in one true accordion.
assert.match(m4Adapter, /global\.SCZN3SEC\.render\(\{/);
assert.match(sharedShell, /<span>1 · TARGET<\/span>/);
assert.match(sharedShell, /region\.key === "target" \? " open" : ""/);
assert.match(sharedShell, /class="sec-session-score"/);
assert.match(sharedShell, /aria-label="Shooter Action Bar"/);
assert.match(sec, /SCZN3SECReopenLifecycle\?\.initialize/);
assert.match(lifecycle, /if \(otherStage !== stage\) otherStage\.open = false/);
assert.doesNotMatch(sec, /Before and After/);

// Historical zeroing SEC: a requested preserved snapshot is read-only and never replaces active work.
assert.match(sec, /const historicalSnapshotMode = Boolean\(requestedSessionId\)/);
assert.match(sec, /const requestedPersistedSession = requestedSessionId[\s\S]*?SCZN3M4\.getSessionHistory\(\)/);
assert.doesNotMatch(sec, /SCZN3M4\.loadSession/);
assert.match(sec, /save: !historicalSnapshotMode/);
assert.match(sec, /note: !historicalSnapshotMode/);
assert.match(sec, /id="secVaultBack"[\s\S]*?data-preserve-active-session/);
assert.match(sec, /records\.html\?selected=/);

// Vault browse: compact library records only; full SEC opens on a separate route.
assert.match(records, /if \(!HISTORICAL_DETAIL_MODE\) \{[\s\S]*?sessions\.map\(renderCompactVaultRecord\)[\s\S]*?return;/);
assert.match(records, /class="vault-record-summary/);
assert.match(records, /class="vault-evidence-pair"/);
assert.match(records, /data-preserve-active-session/);
assert.match(records, /function historicalSecUrl/);
assert.match(records, /function resolveVaultEvidenceModel/);
assert.match(records, /function vaultEvidenceOverlay/);
assert.match(records, /completedEvidence \? vaultEvidenceOverlay\(completedEvidence\)/);
assert.match(records, /SCZN3TargetExecutionRuntime\.approvedResultComponent\(pkg, session\)/, "targetScoring Vault records preserve the approved universal RESULT component");
assert.match(records, /<div class="vault-evidence-pair">/, "contract Vault records preserve the proven two-column evidence pair");
assert.match(records, /<span class="vault-open-label">OPEN SEC →<\/span>/, "contract Vault records preserve the proven OPEN SEC action");
assert.match(records, /vault-approved-result-panel/, "the approved universal RESULT occupies the checkpoint RESULT pane");
assert.match(records, /function historicalSecUrl[\s\S]*?SCZN3SECDispatch\.destinationFor\(session\)[\s\S]*?SCZN3SECReopenAuthority\?\.portableUrl\(destination, session\.sessionId\)/, "OPEN SEC delegates exact reopen to the checkpoint dispatch road and preserves portable possession authority");
assert.match(targetRuntime, /preserved \? \[\{ label: "Ballistic Vault", href: vaultHref/, "a preserved contract SEC carries its local authority route into the Vault");
assert.match(targetRuntime, /records\.html\?runtimeView=sec-readable-diagnostic-1\$\{localAuthorityPort\(\) \? `&authorityPort=/, "the Vault handoff preserves the split local authority port");
assert.match(secDispatch, /target-experience\.html\?session=\$\{encodeURIComponent\(sessionId\)\}&view=sec\$\{localAuthoritySuffix\(\)\}/, "OPEN SEC carries the Vault authority port into exact reopen");
assert.doesNotMatch(records, /renderCompactVaultRecord\(requestedSession, \{ historical: true \}\)/, "exact reopen is not replaced with a second Vault card");
assert.match(records, /function prepareHistoricalSec/);
const prepareHistoricalSecSource = records.match(/function prepareHistoricalSec\(session\) \{[\s\S]*?\n\}/)?.[0] || "";
assert.match(prepareHistoricalSecSource, /\[data-sec-shell="universal-v1"\]\[data-sec-record-id=/, "historical SEC lifecycle resolves the universal shell by its governed record identity");
assert.doesNotMatch(prepareHistoricalSecSource, /historyList\.querySelector\(`\[data-session-id=/, "historical SEC lifecycle must not confuse Session timeline points with the universal shell");
assert.match(prepareHistoricalSecSource, /:not\(\.sec-session-timeline-point\)/, "historical SEC cleanup preserves Session 2 exact-artifact links");
assert.match(records, /SCZN3SECReopenLifecycle\?\.initialize\(story\)/);
assert.doesNotMatch(records, /accordionStages\.forEach\(stage => stage\.addEventListener\("toggle"/);
assert.match(secCss, /\.historical-sec-detail \.sec-target-story>details\.sec-accordion-stage\{[^}]*min-height:0!important/);

// Back restores the same library context and selected record without replacing the active session.
assert.match(records, /SCZN3_BALLISTIC_VAULT_RETURN_STATE/);
assert.match(records, /scrollY: window\.scrollY/);
assert.match(records, /window\.scrollTo\(0, Number\(state\.scrollY\)\)/);
assert.match(vaultCss, /\.vault-record-summary\.is-selected/);

// Temporary numbering exception: preserve device-local zero-padded labels and record provenance.
assert.match(appState, /Session #\$\{String\(number \|\| 0\)\.padStart\(3, "0"\)\}/);
assert.match(appState, /sessionNumberAuthority: "device-local-temporary"/);
assert.match(records, /data-session-number-authority/);
assert.match(futureAuthority, /temporary/i);
assert.match(futureAuthority, /backend-issued/i);
assert.doesNotMatch(appState, /shooter-account-authoritative/);

// Responsive contract: preserve two evidence panels; stack disclosure pills only when labels need it.
assert.match(secCss, /@media\(max-width:640px\)[\s\S]*?\.sec-before-after\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(secCss, /@media\(max-width:460px\)[\s\S]*?\.sec-target-story\{grid-template-columns:1fr\}/);
assert.match(vaultCss, /@media\(max-width:720px\)[\s\S]*?\.records-page \.vault-gallery\{grid-template-columns:1fr/);
assert.match(records, /const sessions = savedSessions;/, "Vault retains the full newest-first preserved-session collection for vertical navigation");
assert.doesNotMatch(records, /savedSessions\.slice\(0,\s*10\)/, "Vault presentation does not make older preserved sessions unavailable");

// Navigation warns only when an action can replace/discard active work.
assert.match(navigation, /data-preserve-active-session/);
assert.match(navigation, /data-replaces-active-session/);

console.log("PASS SEC / Ballistic Vault architecture contract");
