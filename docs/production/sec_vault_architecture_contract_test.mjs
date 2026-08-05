import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [sec, records, appState, navigation, secCss, vaultCss, futureAuthority] = await Promise.all([
  readFile("sec.html", "utf8"),
  readFile("records.html", "utf8"),
  readFile("app_state.js", "utf8"),
  readFile("navigation.js", "utf8"),
  readFile("m4-sec.css", "utf8"),
  readFile("ballistic-vault.css", "utf8"),
  readFile("architecture/FUTURE_BACKEND_SESSION_NUMBERING_AUTHORITY.md", "utf8"),
]);

// Current SEC: TARGET first, every stage in one true accordion.
assert.match(sec, /<span>1 · TARGET<\/span><strong id="secSessionIdentifier"><\/strong>/);
assert.match(sec, /data-sec-stage="evidence" open/);
assert.equal((sec.match(/class="[^"]*sec-accordion-stage/g) || []).length, 6);
assert.match(sec, /if \(otherStage !== stage\) otherStage\.open = false/);
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
assert.match(records, /class="vault-record-summary"/);
assert.match(records, /class="vault-evidence-pair"/);
assert.match(records, /data-preserve-active-session/);
assert.match(records, /function historicalSecUrl/);
assert.match(records, /function prepareHistoricalSec/);
assert.match(records, /details\.open = index === 0/);
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

// Navigation warns only when an action can replace/discard active work.
assert.match(navigation, /data-preserve-active-session/);
assert.match(navigation, /data-replaces-active-session/);

console.log("PASS SEC / Ballistic Vault architecture contract");
