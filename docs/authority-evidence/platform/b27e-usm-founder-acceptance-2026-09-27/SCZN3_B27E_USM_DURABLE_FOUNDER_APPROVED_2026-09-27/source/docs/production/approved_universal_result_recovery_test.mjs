import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.resolve(here, "..");
const read = relative => fs.readFileSync(path.join(docs, relative), "utf8");

const snapshot = read("history/snapshots/SNAPSHOT_026_EPISODE_60_TARGET_DATA_SCORING_DATA_ONE_ROAD_SCALE_FLOOR.md");
const closureSnapshot = read("history/snapshots/SNAPSHOT_027_EPISODE_60_CLOSURE_2570_TARGET_TRUE_NORTH_EXISTING_CAPABILITY_FLOOR.md");
const knownGood = JSON.parse(read("authority-evidence/platform/known-good-target-regression-2026-09-08/KNOWN_GOOD_TARGETS.json"));
const framework = read("sec_framework.js");
const frameworkCss = read("sec-framework.css");
const runtime = read("target_execution_runtime.js");
const vault = read("records.html");

assert.match(snapshot, /Status: FOUNDER APPROVED \/ SCALE MILESTONE \/ LOCKED \/ RESTORE VERIFIED/);
assert.match(snapshot, /e249872850409536a368a695b69b682e2584bb01/);
assert.match(snapshot, /b1508e09d8d7913bc6938af6d5052c90ddf50018/);
assert.match(closureSnapshot, /FOUNDER DIRECTED \/ EPISODE CLOSURE \/ LOCKED \/ RESTORE READY/);
assert.match(closureSnapshot, /a9ba035659e873f5704a35ee7a10541b270fec3a/);
assert.match(closureSnapshot, /Existing results, Universal SEC, Ballistic Vault, and exact reopen remain part of that road/);

assert.equal(knownGood.schemaVersion, "sczn3-known-good-target-regression-v1");
assert.ok(knownGood.targets.some(target => /highest-score-wins total/.test(target.resultBehavior)), "known-good scoring road");
assert.ok(knownGood.targets.some(target => /Evidence Recorded/.test(target.resultBehavior)), "known-good evidence road");
assert.ok(knownGood.targets.some(target => /zeroing/i.test(target.targetIdentity) || /zeroing/i.test(target.resultBehavior)), "known-good zeroing road");

assert.match(framework, /function Result\(model = \{\}\)/, "historical platform Result component remains the presentation owner");
assert.match(framework, /data-sec-component="result"/);
assert.match(frameworkCss, /\.sec-evidence-result-layout\{display:grid;grid-template-columns:minmax\(0,1\.65fr\) minmax\(260px,\.85fr\)/, "approved Evidence + Result layout remains present");

assert.match(runtime, /SCZN3SECComponents\.Result\(\{ family: approvedResultFamily\(result\), contentHtml \}\)/, "Episode 64 runtime delegates presentation to the approved Result component");
assert.match(runtime, /contract-lifecycle-pair/, "Episode 64 SEC preserves BEFORE and the approved RESULT without the generic session shell");
assert.doesNotMatch(runtime, /function universalResultMarkup/, "the rejected QT-era format is not a presentation authority");
assert.match(runtime, /const reopenBaseHref = `target-experience\.html\?session=\$\{encodeURIComponent\(session\.sessionId \|\| ""\)\}&view=sec\$\{localAuthoritySuffix\(\)\}`[\s\S]*?portableUrl\(reopenBaseHref, session\.sessionId\)/, "targetScoring Exact Reopen returns to the executable preserved-session road with portable authority custody");

assert.match(vault, /SCZN3TargetExecutionRuntime\.approvedResultComponent\(pkg, session\)/, "Vault preserves the same approved RESULT component shown before saving");
assert.match(vault, /<div class="vault-evidence-pair">[\s\S]*?<figcaption>\$\{lowestScoreTarget \? "TARGET EVIDENCE" : "BEFORE"\}/, "Vault preserves the proven BEFORE pane");
assert.match(vault, /<figcaption>\$\{lowestScoreTarget \? "ANALYSIS" : scoredEvidenceTarget \? "RESULT" : "AFTER"\}/, "Vault preserves the proven RESULT pane");
assert.match(vault, /<span class="vault-open-label">OPEN SEC →<\/span>/, "Vault preserves the proven OPEN SEC action");
assert.match(vault, /vault-approved-result-panel/, "Vault binds the preserved RESULT into the proven right-hand pane");
assert.match(vault, /function resolvePreservedApprovedResult[\s\S]*?SCZN3SECDispatch\.isContractAdapter\(dispatch\.adapter\)[\s\S]*?approvedResultComponent\(pkg, session\)/, "contract-backed Vault records use the preserved approved RESULT rather than a summary adapter");
assert.match(vault, /function historicalSecUrl[\s\S]*?SCZN3SECDispatch\.destinationFor\(session\)/, "targetScoring OPEN SEC delegates to the proven execution-family dispatch road");
assert.doesNotMatch(vault, /renderCompactVaultRecord\(requestedSession, \{ historical: true \}\)/, "exact reopen is not replaced with a second Vault summary card");

console.log("Approved universal RESULT recovery contract: PASS");
